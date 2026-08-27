// A streak counter that never counts is worse than no counter.
//
// This one showed "0 day streak" for ever on a fresh install: it read only
// `profiles.streak` from Supabase, which needs a session, and anonymous
// sign-in happens inside saveProfile and nowhere else. No session at launch,
// no cloud profile, `?? 0`. Nothing failed and nothing logged.
//
// The device keeps its own count now, so these are the behaviours that have to
// hold without a clock, a device or a network:
//
//   node scripts/streak-check.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(here, '..', 'src', 'lib', 'streak.ts'), 'utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText.replace(/import[^;]+;/g, '');

const mod = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
);
const { advance, currentValue, dayKey } = mod;

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

const EMPTY = { lastActiveDay: '', current: 0, best: 0 };
const day = n => dayKey(Date.parse('2026-03-01T12:00:00') + n * 86_400_000);

// 1. The first day counts as one, not zero. This is the case that was broken:
//    a brand-new install that has just been opened is on a one-day streak.
let s = advance(EMPTY, day(0));
check(s.current === 1, `first ever day should be a streak of 1, got ${s.current}`);

// 2. Consecutive days accumulate.
for (let i = 1; i <= 6; i++) s = advance(s, day(i));
check(s.current === 7, `seven days running should be 7, got ${s.current}`);
check(s.best === 7, `best should track the run, got ${s.best}`);

// 3. Opening twice in one day is not two days.
const twice = advance(s, day(6));
check(twice.current === 7, `same day again must not increment, got ${twice.current}`);

// 4. A missed day resets to 1 — today still counts.
const afterGap = advance(s, day(8));
check(afterGap.current === 1, `a missed day restarts at 1, got ${afterGap.current}`);
check(afterGap.best === 7, `best must survive a reset, got ${afterGap.best}`);

// 5. The best is never lost by a later shorter run.
let longer = afterGap;
for (let i = 9; i <= 11; i++) longer = advance(longer, day(i));
check(longer.best === 7, `best should still be 7, got ${longer.best}`);

// 6. A stored streak is only true on the day it was written.
//    Reading it straight back is how a broken streak keeps displaying as
//    unbroken until something happens to rewrite it.
const stale = { lastActiveDay: day(0), current: 9, best: 9 };
check(currentValue(stale, day(0)) === 9, 'same day should read the stored value');
check(currentValue(stale, day(1)) === 9, 'yesterday still counts — today is not over');
check(
  currentValue(stale, day(2)) === 0,
  `two days later must read 0, got ${currentValue(stale, day(2))}`,
);
check(currentValue(EMPTY, day(0)) === 0, 'never opened should read 0');

// 7. A clock that moves backwards must not end a streak. Someone flying west
//    has not stopped studying.
const back = advance({ lastActiveDay: day(5), current: 4, best: 4 }, day(4));
check(back.current === 4, `a backwards clock must not reset, got ${back.current}`);

// 8. Day keys are local, not UTC — a streak breaks when you miss a day, not
//    when a timezone does.
check(
  /^\d{4}-\d{2}-\d{2}$/.test(dayKey(Date.now())),
  'dayKey should be YYYY-MM-DD',
);
check(
  !source.includes('toISOString'),
  'streak.ts uses toISOString — that is UTC, and would roll the day over mid-evening or pre-dawn depending on where the reader is',
);

if (failures.length > 0) {
  for (const failure of failures) process.stdout.write(`  FAIL  ${failure}\n`);
  process.stdout.write(`\n${failures.length} problem(s) in the streak.\n`);
  process.exit(1);
}
process.stdout.write('OK  streak counts from day one, survives same-day opens, resets on a gap, and expires when stale\n');
