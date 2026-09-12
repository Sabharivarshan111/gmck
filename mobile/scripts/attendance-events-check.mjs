// Which dated thing the evening reminder counts down to.
//
// The digest has ONE slot. An exam synced from the web app and a seminar typed
// into the Attendance tab both want it, and the rule is simply "whichever is
// sooner" — but getting it wrong is a reminder that counts down to the wrong
// thing, which is worse than no reminder, and nobody would notice until the
// evening before something they had already missed.
//
// The arithmetic is sliced out of the shipped file rather than reimplemented,
// the same way `attendance-check.mjs` does it, because importing would drag
// AsyncStorage into Node.
//
//   node scripts/attendance-events-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = await fs.readFile(path.join(root, 'src/lib/attendanceEvents.ts'), 'utf8');

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

const pure = source
  .slice(source.indexOf('export function eventDate'), source.indexOf('function sane'))
  .replace(/export /g, '')
  .replace(/: AttendanceEvent\[\]/g, '')
  .replace(/: AttendanceEvent/g, '')
  .replace(/: number \| null/g, '')
  .replace(/: Date \| null/g, '')
  .replace(/: string/g, '')
  .replace(/: number/g, '')
  // After the named types, or `: AttendanceEvent | null` strips to a stray
  // ` | null` and the function stops parsing at its own return annotation.
  .replace(/ \| null/g, '')
  .replace(/^\s*\/\*\*[\s\S]*?\*\/$/gm, '');

// eslint-disable-next-line no-new-func
const fns = new Function(`${pure}; return { eventDate, daysToEvent, nextEvent };`)();

const at = (y, m, d) => new Date(y, m - 1, d).getTime();
const ev = (title, date, kind = 'exam') => ({ id: title, title, kind, date });
const TODAY = at(2026, 9, 12);

// ---- daysToEvent ----------------------------------------------------------
check(fns.daysToEvent(ev('a', '2026-09-12'), TODAY) === 0, 'today is zero days away');
check(fns.daysToEvent(ev('a', '2026-09-13'), TODAY) === 1, 'tomorrow is one');
check(fns.daysToEvent(ev('a', '2026-10-12'), TODAY) === 30, 'a month out is thirty');
check(fns.daysToEvent(ev('a', '2026-09-11'), TODAY) === -1, 'yesterday is negative');
// Snapped to midnight: late at night, tomorrow must still be one day away and
// not zero. That is the one answer that would matter and be wrong.
check(
  fns.daysToEvent(ev('a', '2026-09-13'), at(2026, 9, 12) + 23 * 3600_000) === 1,
  'late at night, tomorrow is still tomorrow',
);
check(fns.daysToEvent(ev('a', 'not-a-date'), TODAY) === null, 'an unparseable date is null');
check(fns.eventDate('2026-13-45') === null, 'an impossible date is refused');

// ---- nextEvent ------------------------------------------------------------
const list = [ev('far', '2026-12-01'), ev('soon', '2026-09-20'), ev('past', '2026-01-01')];
check(fns.nextEvent(list, TODAY)?.title === 'soon', 'the soonest future date wins');
check(
  fns.nextEvent([ev('past', '2026-01-01')], TODAY) === null,
  'a list of past dates counts down to nothing',
);
check(fns.nextEvent([], TODAY) === null, 'an empty list is null');
// Today counts as still ahead: a seminar at four is not past at breakfast, and
// "your seminar is today" is the most useful thing this can send.
check(
  fns.nextEvent([ev('today', '2026-09-12'), ev('tomorrow', '2026-09-13')], TODAY)?.title === 'today',
  'something happening today still counts down',
);
check(
  fns.nextEvent([ev('bad', 'nonsense'), ev('good', '2026-09-20')], TODAY)?.title === 'good',
  'a corrupt row does not block the one behind it',
);

// ---- and the reminder actually consults it --------------------------------
const sync = await fs.readFile(path.join(root, 'src/lib/reminderSync.ts'), 'utf8');
const code = sync.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
check(
  /nextEvent\(/.test(code) && /hydrateAttendanceEvents\(/.test(code),
  'reminderSync no longer reads the typed dates, so none of them would ever be announced',
);
check(
  /eventWins/.test(code),
  'reminderSync no longer chooses between the synced exam and the typed dates',
);
// The typed dates must never be written to the store that syncs upward.
check(
  !/setExam\(/.test(code),
  'reminderSync writes to the exam store, which syncs to exam_targets — a ' +
    'locally-typed seminar is not this app’s to upload',
);

if (failures.length > 0) {
  console.error('attendance events check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(
  'OK  the evening reminder counts down to the soonest of the synced exam and the typed dates, ' +
    'today still counts, and nothing typed is uploaded',
);
