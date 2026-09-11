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
  .replace(/: string/g, '')
  .replace(/: AttendanceItem/g, '')
  .replace(/: AttendanceVerdict/g, '')
  // `dayOfRotation(item, today: Date = new Date())` — the default stays, the
  // annotation goes, same as every other one above.
  .replace(/<string, AttendanceMonth>/g, '')
  .replace(/: AttendanceMonth\[\]/g, '')
  .replace(/: AttendanceMonth/g, '')
  .replace(/: AttendanceMark\[\]/g, '')
  .replace(/: Date\[\]/g, '')
  .replace(/: Date/g, '')
  .replace(/: SaturdayRule/g, '')
  .replace(/: boolean/g, '')
  .replace(/\| null/g, '')
  .replace(/interface [\s\S]*?\n\}/g, '')
  .replace(/^\s*\/\*\*[\s\S]*?\*\/$/gm, '');

// eslint-disable-next-line no-new-func
const fns = new Function(
  `${arithmetic}; return { percentOf, canMiss, mustAttend, verdictFor, bestPossible, workingDays, dayOfRotation, isOffDay, isoDay, monthsOf, saturdayOrdinal };`,
)();

const eq = (got, want, what) =>
  check(got === want, `${what}: expected ${want}, got ${got}`);

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

/* ---------------------------------------------------------------------------
 * Saturdays, holidays, and the month breakdown
 *
 * All three asked for by the app's owner. The arithmetic is the whole feature —
 * "you can still miss four" is worth nothing if the four is counted off a
 * calendar that thinks the college is open on Republic Day — so it is worked
 * out here against dates somebody can check by looking at a calendar.
 *
 * March 2026 starts on a Sunday, which is the useful part: a 14-day block from
 * the 1st contains Sundays on the 1st and 8th, and Saturdays on the 7th and
 * 14th. Every combination therefore lands on a different number.
 * ------------------------------------------------------------------------ */
{
  const base = { id: 'x', name: 'Block', kind: 'posting', target: 75, held: 0, attended: 0 };
  const block = { ...base, totalDays: 14, startDate: '2026-03-01' };

  eq(fns.workingDays({ ...block }), 14, 'no days excluded');
  eq(fns.workingDays({ ...block, skipSundays: true }), 12, 'two Sundays off');
  eq(fns.workingDays({ ...block, saturdays: 'all' }), 12, 'every Saturday off');
  eq(
    fns.workingDays({ ...block, skipSundays: true, saturdays: 'all' }),
    10,
    'both weekend days off, and they are separate controls',
  );

  /*
     The second-Saturday rule, which is the one most Indian colleges run.

     The owner named it: "every second saturday is automatic holiday". March
     2026's Saturdays are the 7th, 14th, 21st and 28th, so the second is the
     14th and the fourth is the 28th — and a 31-day block from the 1st is the
     shortest span that contains all four of them.
  */
  const march = { ...base, totalDays: 31, startDate: '2026-03-01' };
  eq(fns.workingDays({ ...march }), 31, 'no Saturday rule, nothing comes off');
  eq(fns.workingDays({ ...march, saturdays: 'second' }), 30, 'only the 14th comes off');
  eq(
    fns.workingDays({ ...march, saturdays: 'second-fourth' }),
    29,
    'the 14th and the 28th come off, and the 7th and 21st do not',
  );
  eq(fns.workingDays({ ...march, saturdays: 'all' }), 27, 'all four Saturdays come off');
  eq(
    fns.isOffDay({ ...march, saturdays: 'second' }, new Date('2026-03-14T00:00:00')),
    true,
    'the second Saturday is off',
  );
  eq(
    fns.isOffDay({ ...march, saturdays: 'second' }, new Date('2026-03-07T00:00:00')),
    false,
    'the first Saturday is a working day under that rule',
  );
  /*
     "Second Saturday" means the second one IN THE MONTH, which is always the
     8th to the 14th. Counting calendar weeks instead gets it wrong in every
     month that starts late in a week — August 2026 begins on a Saturday, so
     its Saturdays are the 1st, 8th, 15th, 22nd and 29th, and the second one is
     the 8th rather than the 15th a week-counter would pick.
  */
  eq(fns.saturdayOrdinal(new Date('2026-08-01T00:00:00')), 1, 'the 1st is the first Saturday');
  eq(fns.saturdayOrdinal(new Date('2026-08-08T00:00:00')), 2, 'the 8th is the second');
  eq(fns.saturdayOrdinal(new Date('2026-08-22T00:00:00')), 4, 'the 22nd is the fourth');
  eq(
    fns.isOffDay({ ...base, saturdays: 'second' }, new Date('2026-08-08T00:00:00')),
    true,
    'a month starting on a Saturday still puts the second one on the 8th',
  );
  eq(
    fns.workingDays({ ...block, holidays: ['2026-03-03', '2026-03-04'] }),
    12,
    'two holidays come off the count',
  );
  eq(
    fns.workingDays({ ...block, skipSundays: true, holidays: ['2026-03-08', '2026-03-03'] }),
    11,
    'a holiday that falls on an already-excluded Sunday is not subtracted twice',
  );
  eq(
    fns.workingDays({ ...block, holidays: ['2026-09-14'] }),
    14,
    'a holiday outside the block changes nothing, so one pasted list serves every subject',
  );

  // A block with a length but no start has no calendar to subtract from.
  eq(
    fns.workingDays({ ...base, totalDays: 30, skipSundays: true }),
    30,
    'no start date means the length is taken at its word rather than guessed at',
  );

  // Theory is no longer excluded from any of this — the owner asked for the
  // run length there, and the arithmetic never cared which kind it was.
  eq(
    fns.workingDays({ ...block, kind: 'theory', skipSundays: true }),
    12,
    'a theory subject with a length counts its working days the same way',
  );

  eq(fns.isOffDay({ ...block, skipSundays: true }, new Date('2026-03-08T00:00:00')), true, 'Sunday is off');
  eq(fns.isOffDay({ ...block, skipSundays: true }, new Date('2026-03-07T00:00:00')), false, 'Saturday is not off unless asked');
  eq(fns.isoDay(new Date('2026-03-07T00:00:00')), '2026-03-07', 'a local date does not slip a day through UTC');

  /*
     The month view keeps the schedule and the record apart.

     `working`/`off` come from the calendar and exist before anybody marks
     anything; `held`/`attended` come from the log. Merging them would produce a
     percentage made half of a plan and half of a record, which is a number
     nobody can check against anything.
  */
  const across = {
    ...base,
    totalDays: 20,
    startDate: '2026-03-25',
    skipSundays: true,
    log: [
      { date: '2026-03-26', present: true },
      { date: '2026-03-27', present: false },
      { date: '2026-04-02', present: true },
    ],
  };
  const months = fns.monthsOf(across);
  eq(months.length, 2, 'a block that crosses a month boundary is two rows');
  eq(months[0].key, '2026-03', 'the earlier month comes first');
  eq(months[0].label, 'March 2026', 'the row is named for a human');
  eq(months[0].working + months[0].off, 7, 'March holds the seven days from the 25th');
  eq(months[0].off, 1, 'one Sunday falls in that week');
  eq(months[0].held, 2, 'two marks were recorded in March');
  eq(months[0].attended, 1, 'one of them was present');
  eq(months[1].held, 1, 'and one in April');
  eq(
    fns.monthsOf({ ...base, totalDays: 10, startDate: '2026-03-01' }).every((m) => m.held === 0),
    true,
    'a subject with no log reports no marks rather than inventing them from the counters',
  );
  eq(
    fns.monthsOf({ ...base }).length,
    0,
    'a subject with no length and no log has no months to show',
  );
}

if (failures.length > 0) {
  console.error('attendance check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  'OK  attendance arithmetic matches 52 worked examples, the rotation caps what can be missed, ' +
    'and nothing leaves the phone',
);
