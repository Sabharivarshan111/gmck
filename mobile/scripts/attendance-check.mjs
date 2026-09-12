// The attendance arithmetic, checked against worked examples.
//
// This is the one calculation in the app where being wrong has a consequence
// the reader cannot undo. Telling somebody they can safely miss three more
// classes when the answer is one is the difference between sitting an exam and
// repeating a year, and it is a mistake nobody notices until the register is
// closed and it is far too late.
//
// So the maths lives in pure exported functions rather than inside a component,
// and every case below was worked out by hand first.
//
//   node scripts/attendance-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = await fs.readFile(path.join(root, 'src/lib/attendance.ts'), 'utf8');

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

/*
 * The functions are re-implemented here from the file's own text rather than
 * imported, because importing would drag AsyncStorage into Node. Stripping the
 * storage half and evaluating the arithmetic keeps this checking the SHIPPED
 * lines instead of a copy that can drift.
 */
const arithmetic = source
  .slice(source.indexOf('export function percentOf'), source.indexOf('// ------', source.indexOf('export function bestPossible')))
  .replace(/export /g, '')
  .replace(/: number/g, '')
  // Before `: string`, or `: string[]` strips to a stray `[]` and the file
  // stops parsing at the first function that returns one.
  .replace(/: string\[\]/g, '')
  .replace(/: boolean/g, '')
  .replace(/: string/g, '')
  .replace(/: AttendanceItem/g, '')
  .replace(/: AttendanceVerdict/g, '')
  // `dayOfRotation(item, today: Date = new Date())` — the default stays, the
  // annotation goes, same as every other one above.
  .replace(/: Date/g, '')
  .replace(/\| null/g, '')
  .replace(/interface [\s\S]*?\n\}/g, '')
  .replace(/^\s*\/\*\*[\s\S]*?\*\/$/gm, '');

// eslint-disable-next-line no-new-func
const fns = new Function(`${arithmetic}; return { percentOf, canMiss, mustAttend, verdictFor, bestPossible, workingDays, dayOfRotation, spanDays, isoDate, isHoliday, fixedHolidaysBetween, FIXED_HOLIDAYS };`)();

let examples = 0;
const eq = (got, want, what) => {
  examples += 1;
  return check(got === want, `${what}: expected ${want}, got ${got}`);
};

// ---------------------------------------------------------------------------
// canMiss — how many more you may skip
// ---------------------------------------------------------------------------

// 40 held, 36 attended, target 75. 36/0.75 = 48, minus 40 held = 8 more.
eq(fns.canMiss(36, 40, 75), 8, '36/40 at 75%');
// Exactly on the line: 30 of 40 is 75%. 30/0.75 = 40, minus 40 = 0 spare.
// This is the case rounding gets wrong and tells you that you have one in hand.
eq(fns.canMiss(30, 40, 75), 0, 'exactly on the line has nothing spare');
// Below the line has nothing spare either, and must not go negative.
eq(fns.canMiss(20, 40, 75), 0, 'below the line never reports spare classes');
// Nothing held yet: everything attended so far is nothing, so nothing spare.
eq(fns.canMiss(0, 0, 75), 0, 'a subject with no classes yet');
// A fractional answer floors rather than rounds: 35/0.75 = 46.67 → 46 − 40 = 6.
eq(fns.canMiss(35, 40, 75), 6, 'a fractional allowance floors');
// 80% is stricter, so the same record buys fewer: 36/0.8 = 45 − 40 = 5.
eq(fns.canMiss(36, 40, 80), 5, 'a higher target buys less room');

// ---------------------------------------------------------------------------
// mustAttend — the climb back
// ---------------------------------------------------------------------------

// 20 of 40 is 50%. (0.75*40 − 20) / 0.25 = 10/0.25 = 40 in a row.
eq(fns.mustAttend(20, 40, 75), 40, '20/40 back to 75%');
// Already above: nothing to do.
eq(fns.mustAttend(36, 40, 75), 0, 'already safe needs none');
// Exactly on the line counts as safe.
eq(fns.mustAttend(30, 40, 75), 0, 'exactly on the line needs none');
// One short of the line: (30 − 29)/0.25 = 4.
eq(fns.mustAttend(29, 40, 75), 4, 'one short of the line');
// 100% cannot be recovered from at all, and says so rather than dividing by zero.
eq(fns.mustAttend(39, 40, 100), Infinity, '100% is unrecoverable');
eq(fns.mustAttend(40, 40, 100), 0, '100% with a perfect record is fine');

// ---------------------------------------------------------------------------
// verdictFor — and the cap that is easy to forget
// ---------------------------------------------------------------------------

// A posting of 30 days, 26 held, 24 attended. 24/0.75 = 32 − 26 = 6 spare —
// but only 4 days of the rotation are left, so 6 would be a lie.
const nearlyOver = fns.verdictFor({
  id: 'a', name: 'Peds', kind: 'posting', target: 75, held: 26, attended: 24, totalDays: 30,
});
eq(nearlyOver.canMiss, 4, 'a posting cannot have more missed than it has days left');
eq(nearlyOver.cappedByEnd, true, 'and it says the end of the rotation is what capped it');
eq(nearlyOver.remaining, 4, 'remaining days');

// The same record with plenty of rotation left is not capped.
const early = fns.verdictFor({
  id: 'b', name: 'Peds', kind: 'posting', target: 75, held: 26, attended: 24, totalDays: 60,
});
eq(early.canMiss, 6, 'plenty of days left leaves the target as the only cap');
eq(early.cappedByEnd, false, 'and says so');

// A theory subject has no end, so nothing caps it.
const theory = fns.verdictFor({
  id: 'c', name: 'Patho', kind: 'theory', target: 75, held: 26, attended: 24,
});
eq(theory.canMiss, 6, 'a theory subject is uncapped');
eq(theory.remaining, null, 'and has no remaining count');

// Nothing held yet reads as safe rather than as 0%.
const fresh = fns.verdictFor({
  id: 'd', name: 'New', kind: 'theory', target: 75, held: 0, attended: 0,
});
eq(fresh.safe, true, 'a subject with no classes yet is not failing');

// ---------------------------------------------------------------------------
// bestPossible — is it even recoverable
// ---------------------------------------------------------------------------

// 26 held of 30, 15 attended. Attend all 4 left: 19/30 = 63.3%. Not recoverable.
const doomed = fns.bestPossible({
  id: 'e', name: 'Peds', kind: 'posting', target: 75, held: 26, attended: 15, totalDays: 30,
});
check(Math.abs(doomed - 63.333) < 0.01, `best possible: expected 63.33, got ${doomed}`);
check(doomed < 75, 'and it is below the target, which is the point of showing it');

// ---------------------------------------------------------------------------
// It stays on the phone
// ---------------------------------------------------------------------------
check(
  !/supabase/i.test(source),
  'attendance.ts reaches Supabase — a record of which days somebody turned up is theirs',
);
check(
  /AsyncStorage/.test(source),
  'attendance.ts no longer stores anything locally',
);
check(
  /Math\.min\(held, Math\.max\(0/.test(source),
  'attended is no longer clamped to held; a stored file could make every percentage nonsense',
);


// ---------------------------------------------------------------------------
// Sundays, and why they are worth their own arithmetic.
//
// A competitor's tracker states it plainly — "holidays reduce total working
// days count" — and it is the one idea of theirs worth having, because without
// it the most useful sentence this feature says is wrong. The DIRECTION of the
// error is what makes it matter: leaving the Sundays in overstates how much of
// the rotation is left, which overstates how many days somebody may still miss.
//
// Counted rather than divided by seven. A 28-day block holds four Sundays or
// five depending on the weekday it starts, and that difference is a whole day
// of somebody's margin.
// ---------------------------------------------------------------------------

// 2026-09-07 is a Monday.
const monday = {
  id: 'p',
  name: 'Medicine',
  kind: 'posting',
  target: 75,
  held: 0,
  attended: 0,
  totalDays: 28,
  startDate: '2026-09-07',
  skipSundays: true,
};

eq(fns.workingDays(monday), 24, '28 days from a Monday, Sundays off');
eq(
  fns.workingDays({ ...monday, skipSundays: undefined }),
  28,
  'the same block with Sundays left in',
);
eq(
  fns.workingDays({ ...monday, startDate: '2026-09-06' }),
  24,
  '28 days from a Sunday is also 24 — the extra one at the start is offset at the end',
);

// The cap comes off the WORKING days. 20 marked of 24 leaves four, not eight.
const late = { ...monday, held: 20, attended: 20 };
eq(fns.verdictFor(late).remaining, 4, 'what is left counts working days');
eq(fns.verdictFor(late).canMiss, 4, 'canMiss is capped by the days that remain');
eq(
  fns.verdictFor(late).cappedByEnd,
  true,
  'and the card is told the cap was the end of the rotation',
);

// Day-of-rotation is read off the calendar, so it survives a week of not
// marking anything.
eq(fns.dayOfRotation(monday, new Date('2026-09-07T09:00:00')), 1, 'the first day is day 1');
eq(
  fns.dayOfRotation(monday, new Date('2026-09-14T09:00:00')),
  7,
  'a week on is day 7, not 8 — the Sunday between does not count',
);
eq(
  fns.dayOfRotation(monday, new Date('2026-09-01T09:00:00')),
  null,
  'before it starts there is no day number to show',
);

// bestPossible uses the same number, or somebody below target is told a
// recovery the calendar does not allow.
eq(
  Math.round(fns.bestPossible({ ...monday, held: 20, attended: 12 })),
  Math.round(((12 + 4) / 24) * 100),
  'the best finish attends every working day left, not every calendar day',
);

// ---------------------------------------------------------------------------
// The rotation is two dates now, and holidays come off it
// ---------------------------------------------------------------------------
//
// "How many days does it run?" asked the reader to do a subtraction they do
// not have the numbers for — a college hands out a posting as two dates. Every
// number below was worked out against a real calendar: 2026-09-07 is a Monday,
// and 28 days from it ends on 2026-10-04.

const ranged = { ...monday, totalDays: undefined, endDate: '2026-10-04' };

eq(fns.spanDays(ranged), 28, 'a range counts both ends — 7 Sep to 4 Oct is 28 days');
eq(
  fns.workingDays(ranged),
  fns.workingDays(monday),
  'the range and the old day count describe the same block',
);
// Postings saved before the range existed must keep working, and there are
// real ones on real phones.
eq(fns.spanDays(monday), 28, 'a posting stored with only totalDays still measures');
// An end before its start is a typo, not a negative rotation.
eq(fns.spanDays({ ...ranged, endDate: '2026-09-01' }), null, 'an end before the start is nothing');
eq(fns.workingDays({ ...ranged, endDate: '2026-09-01' }), null, 'and nothing propagates');

// 2026-10-02 is Gandhi Jayanti and falls on a Friday that year, so it is a
// working day the calendar would otherwise have counted.
eq(
  fns.workingDays({ ...ranged, holidays: ['2026-10-02'] }),
  23,
  'a marked holiday comes off the working days',
);
eq(
  fns.workingDays({ ...ranged, holidays: ['2026-10-02', '2026-09-15', '2026-09-16'] }),
  21,
  'three of them come off three',
);

// 2026-09-13 is a Sunday. It is already not a working day, and subtracting it
// twice would quietly shorten the rotation — margin somebody thinks they have
// and does not.
eq(
  fns.workingDays({ ...ranged, holidays: ['2026-09-13'] }),
  24,
  'a holiday that lands on a Sunday is not subtracted twice',
);
// With Sundays counted, that same date IS a working day and does come off.
eq(
  fns.workingDays({ ...ranged, skipSundays: undefined, holidays: ['2026-09-13'] }),
  27,
  'the same date comes off when Sundays are worked',
);

// The verdict has to read the same number, or the cap is wrong in the
// direction that gets somebody short.
eq(
  fns.verdictFor({ ...ranged, holidays: ['2026-10-02'], held: 20, attended: 20 }).remaining,
  3,
  'what is left of the rotation counts holidays out too',
);

// Day 1 is the first day somebody is expected to turn up, not the first date
// on the noticeboard.
eq(
  fns.dayOfRotation(ranged, new Date(2026, 8, 8)),
  2,
  'the Tuesday of a Monday start is day 2',
);
eq(
  fns.dayOfRotation({ ...ranged, holidays: ['2026-09-07'] }, new Date(2026, 8, 8)),
  1,
  'and day 1 when the Monday was a holiday',
);

// ---------------------------------------------------------------------------
// The offered holidays are the knowable ones, and only those
// ---------------------------------------------------------------------------
//
// Guessing Diwali or Eid would hand somebody a working-day count built on
// dates that are wrong — authoritative-looking and false, which is the same
// failure as inventing a repeat count.

const offered = fns.fixedHolidaysBetween('2026-09-07', '2026-10-04');
eq(offered.length, 1, 'one fixed holiday falls in this rotation');
eq(offered[0].date, '2026-10-02', 'and it is Gandhi Jayanti');
eq(
  fns.fixedHolidaysBetween('2026-09-07', '2026-09-20').length,
  0,
  'a rotation with none in it is offered none',
);
// A block over New Year has to see both years, not just the first.
eq(
  fns.fixedHolidaysBetween('2026-12-20', '2027-02-01').length,
  2,
  'a rotation crossing New Year sees Christmas and Republic Day',
);
eq(
  fns.FIXED_HOLIDAYS.every(h => typeof h.month === 'number' && typeof h.day === 'number'),
  true,
  'every offered holiday is a fixed Gregorian date',
);
eq(fns.FIXED_HOLIDAYS.length, 4, 'four of them, and nothing moveable is guessed');

eq(fns.isoDate(new Date(2026, 0, 5)), '2026-01-05', 'ISO dates pad to two digits');

if (failures.length > 0) {
  console.error('attendance check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `OK  attendance arithmetic matches ${examples} worked examples, the rotation caps what can be ` +
    'missed, holidays come off the working days, and nothing leaves the phone',
);
