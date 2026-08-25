// The SM-2 curve has to keep separating what you know from what you do not.
//
// Every part of this algorithm looks arbitrary and is not, so every part of it
// is easy to "simplify" into something that still runs and no longer teaches:
//
//   - drop the 1.3 ease floor and a card you keep failing decays towards zero
//     growth, becoming permanently due and jamming the queue forever
//   - start compounding on the first success instead of the third and one
//     lucky answer sends a card a month away
//   - round the ease update and passing grades stop being distinguishable
//
// None of that throws. The schedule just quietly stops working, over weeks,
// on a device, where nobody can see it. So this walks real sequences through
// the pure functions and asserts the shape of the curve.
//
//   node scripts/spaced-check.mjs
import { build } from 'esbuild';
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
const { newCard, grade, dueCards, PASS_GRADE } = await import(
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

// 1. A new card is due today.
const fresh = newCard('Define shock.', 'General Medicine', t0);
check(dueCards([fresh], t0).length === 1, 'a new card is not due on the day it is made');

// 2. Answering well grows the gap: 1 day, then 6, then compounding.
let card = fresh;
const intervals = [];
for (let i = 0; i < 6; i += 1) {
  card = grade(card, 5, t0 + i * DAY);
  intervals.push(card.interval);
}
check(intervals[0] === 1, `first interval is ${intervals[0]} day(s), SM-2 says 1`);
check(intervals[1] === 6, `second interval is ${intervals[1]} day(s), SM-2 says 6`);
check(
  intervals.slice(2).every((value, i) => value > intervals[i + 1]),
  `intervals stop growing after the second: ${intervals.join(', ')}`,
);
check(
  intervals[intervals.length - 1] > 60,
  `six perfect answers only reach ${intervals[intervals.length - 1]} days — the ease is not compounding`,
);

// 3. Failing resets it to today, however long the interval had become.
const failed = grade(card, 1, t0 + 400 * DAY);
check(failed.interval === 0, 'a failed card keeps its interval');
check(failed.reps === 0, 'a failed card keeps its rep count');
check(
  dueCards([failed], t0 + 400 * DAY).length === 1,
  'a failed card is not due again immediately — which is the whole point of failing it',
);

// 4. The ease floor holds. Twenty failures must not drive it to zero.
let punished = newCard('q', 's', t0);
for (let i = 0; i < 20; i += 1) {
  punished = grade(punished, 0, t0);
}
check(punished.ease >= 1.3, `ease fell to ${punished.ease.toFixed(2)}, below the 1.3 floor`);
check(
  grade(punished, 5, t0).interval === 1,
  'a card at the ease floor no longer recovers on a good answer',
);

// 5. Passing grades are distinguishable — a 5 must be worth more than a 3.
const base = grade(newCard('q', 's', t0), 4, t0);
const good = grade(base, 5, t0);
const barely = grade(base, PASS_GRADE, t0);
check(good.ease > barely.ease, 'a 5 and a 3 leave the same ease — the grades are not doing anything');
check(barely.ease < base.ease, 'a bare pass does not pull the ease down');

// 6. Due order is hardest first, so a queue abandoned halfway spent its
//    attention on the cards that needed it.
const easy = { ...newCard('easy', 's', t0), ease: 2.8 };
const hard = { ...newCard('hard', 's', t0), ease: 1.4 };
const order = dueCards([easy, hard], t0).map(c => c.question);
check(order[0] === 'hard', `due order starts with "${order[0]}" — the hardest card should lead`);

// 7. Due dates are days, not moments: reviewed late at night, due in the
//    morning. Storing the exact timestamp is what makes a queue look empty.
const nightly = grade(newCard('q', 's', t0), 5, new Date('2026-01-01T23:30:00').getTime());
const nextMorning = new Date('2026-01-02T07:00:00').getTime();
check(
  dueCards([nightly], nextMorning).length === 1,
  'a card reviewed at 11pm is not due at 7am the next day — due dates are not midnight-aligned',
);

if (failures.length > 0) {
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(`\n${failures.length} problem(s) — revision would stop working silently.\n`);
  process.exit(1);
}
process.stdout.write('OK  SM-2 grows, resets, floors its ease and orders hardest-first\n');
