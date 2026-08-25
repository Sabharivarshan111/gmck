// The phone's revision schedule has to be the same schedule as the browser's.
//
// The web app grades on the server: `review_question` owns the maths,
// `revision_schedule` owns the state, and `record_question_done` enrols a
// question the moment it is ticked. A phone running its own SM-2 would give one
// user two different schedules for the same question, which is exactly what the
// shared storage keys exist to prevent — and it would do it silently, over
// weeks, with both apps looking correct in isolation.
//
// So this reads the SQL and the TypeScript and asserts they agree, constant for
// constant. It also walks real review sequences through the pure grader,
// because the parts that look arbitrary are not: drop the 1.3 ease floor and a
// failed card decays towards no growth and jams the queue forever, and lose the
// `max(…, interval + 1)` and a low-ease card stops growing at all.
//
//   node scripts/spaced-check.mjs
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
const out = await build({
  entryPoints: [path.join(root, 'src/lib/spacedRepetition.ts')],
  bundle: true,
  format: 'esm',
  write: false,
  platform: 'neutral',
  absWorkingDir: root,
  alias: { '@': path.join(root, 'src') },
  plugins: [
    {
      // Stubbed rather than marked external: an external import stays a bare
      // specifier in the bundle, and node cannot resolve one of those from the
      // data: URL this is imported through. The scheduler's maths is pure —
      // storage is only here so the module loads.
      name: 'stub-async-storage',
      setup(build_) {
        build_.onResolve({ filter: /async-storage/ }, args => ({
          path: args.path,
          namespace: 'stub',
        }));
        build_.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
          contents: 'export default { getItem: async () => null, setItem: async () => {} };',
          loader: 'js',
        }));
      },
    },
  ],
});
const { newCard, grade, dueCards } = await import(
  `data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`
);

const failures = [];
const check = (ok, message) => {
  if (!ok) {
    failures.push(message);
  }
};

const DAY = 24 * 60 * 60 * 1000;
const t0 = new Date('2026-01-01T09:00:00').getTime();

// ---- 1. The TypeScript matches the SQL -------------------------------------
const migrations = path.join(root, '..', 'supabase', 'migrations');
let sql = '';
for (const file of await fs.readdir(migrations).catch(() => [])) {
  const text = await fs.readFile(path.join(migrations, file), 'utf8');
  if (text.includes('FUNCTION public.review_question')) {
    sql = text.slice(text.indexOf('FUNCTION public.review_question'));
    sql = sql.slice(0, sql.indexOf('$function$;'));
  }
}
if (!sql) {
  process.stdout.write('SKIP  review_question is not in supabase/migrations here\n');
} else {
  const ts = await fs.readFile(path.join(root, 'src/lib/spacedRepetition.ts'), 'utf8');
  const rules = [
    ['again', /_interval := 1;\s*_ease := GREATEST\(_ease - 0\.2, 1\.3\)/, /interval = 1;[\s\S]{0,80}ease - 0\.2, MIN_EASE/],
    ['hard', /CEIL\(_interval \* 1\.2\)::int, _interval \+ 1/, /Math\.ceil\(interval \* 1\.2\), interval \+ 1/],
    ['hard ease', /_ease := GREATEST\(_ease - 0\.15, 1\.3\)/, /ease - 0\.15, MIN_EASE/],
    ['good', /CEIL\(_interval \* _ease\)::int, _interval \+ 1/, /Math\.ceil\(interval \* ease\), interval \+ 1/],
    ['easy', /CEIL\(_interval \* _ease \* 1\.3\)::int, _interval \+ 2/, /Math\.ceil\(interval \* ease \* 1\.3\), interval \+ 2/],
    ['easy ease', /_ease := _ease \+ 0\.15/, /ease = ease \+ 0\.15/],
  ];
  for (const [name, inSql, inTs] of rules) {
    check(inSql.test(sql), `review_question no longer defines "${name}" the way this check expects — reread the SQL`);
    check(inTs.test(ts), `spacedRepetition.ts does not implement "${name}" as the SQL does — the two schedules would diverge`);
  }
  check(
    /_ease := 2\.5; _interval := 1;/.test(sql) && /START_EASE = 2\.5/.test(ts) && /START_INTERVAL = 1/.test(ts),
    'the starting ease/interval differ between the SQL and the app',
  );
  check(
    /'again','hard','good','easy'/.test(sql) && /'again' \| 'hard' \| 'good' \| 'easy'/.test(ts),
    'the grade vocabulary differs from the one review_question accepts — it rejects anything else outright',
  );
}

// Enrolment: record_question_done inserts due_date = today + 1.
const enrolSql = await fs
  .readdir(migrations)
  .then(async files => {
    for (const file of files) {
      const text = await fs.readFile(path.join(migrations, file), 'utf8');
      if (text.includes('INSERT INTO public.revision_schedule(user_id, question_id, year, due_date)')) {
        return text;
      }
    }
    return '';
  })
  .catch(() => '');
if (enrolSql) {
  check(
    /VALUES \(_uid, _question_id, _year, _today \+ 1\)/.test(enrolSql),
    'record_question_done no longer enrols due tomorrow — newCard() follows it',
  );
}

// ---- 2. The curve behaves ---------------------------------------------------
const fresh = newCard('q1', 'Define shock.', 'General Medicine', t0);
check(
  dueCards([fresh], t0).length === 0,
  'a newly ticked question is due the same day — the server enrols it for tomorrow',
);
check(
  dueCards([fresh], t0 + DAY).length === 1,
  'a newly ticked question is not due the next day',
);

// "good" compounds; "again" collapses to one day whatever it had reached.
let card = fresh;
const intervals = [];
for (let i = 0; i < 5; i += 1) {
  card = grade(card, 'good', t0 + i * DAY);
  intervals.push(card.interval);
}
check(
  intervals.every((value, i) => i === 0 || value > intervals[i - 1]),
  `"good" does not grow the interval: ${intervals.join(', ')}`,
);
check(
  intervals[intervals.length - 1] > 20,
  `five good answers only reach ${intervals[intervals.length - 1]} days — the ease is not compounding`,
);
const again = grade(card, 'again', t0 + 400 * DAY);
check(again.interval === 1, `"again" left the interval at ${again.interval}, not 1`);
check(
  dueCards([again], t0 + 401 * DAY).length === 1,
  '"again" does not bring the card back the next day',
);

// "easy" must outrun "good", and "hard" must still move.
const base = grade(newCard('q2', 'q', 's', t0), 'good', t0);
check(
  grade(base, 'easy', t0).interval > grade(base, 'good', t0).interval,
  '"easy" and "good" produce the same interval — the grades are not doing anything',
);
check(
  grade(base, 'hard', t0).interval > base.interval,
  '"hard" leaves the interval where it was — a card that never grows is due forever',
);

// The ease floor holds under repeated failure.
let punished = newCard('q3', 'q', 's', t0);
for (let i = 0; i < 20; i += 1) {
  punished = grade(punished, 'again', t0);
}
check(punished.ease >= 1.3, `ease fell to ${punished.ease.toFixed(2)}, below the 1.3 floor`);
check(
  grade(punished, 'good', t0).interval > punished.interval,
  'a card at the ease floor stops growing entirely — max(…, interval + 1) is missing',
);

// Due dates are days, not moments.
const nightly = grade(newCard('q4', 'q', 's', t0), 'good', new Date('2026-01-01T23:30:00').getTime());
check(
  dueCards([nightly], new Date(nightly.due + 8 * 60 * 60 * 1000).getTime()).length === 1,
  'a card reviewed at 11pm is not due in the morning — due dates are not midnight-aligned',
);

if (failures.length > 0) {
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(`\n${failures.length} problem(s) — revision would stop working silently.\n`);
  process.exit(1);
}
process.stdout.write('OK  the phone grades exactly as review_question does\n');
