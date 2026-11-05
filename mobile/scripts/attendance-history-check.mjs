import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { transform } from 'esbuild';
let now = new Date(2026, 9, 25, 12).getTime();
class Clock extends Date {
  constructor(...args) { if (args.length) super(...args); else super(now); }
  static now() { return now; }
}
async function evaluate(name, require) {
  const { code } = await transform(await fs.readFile(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8'), { loader: 'ts', format: 'cjs' });
  const module = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('require', 'module', 'exports', 'Date', code)(require, module, module.exports, Clock);
  return module.exports;
}
const domain = await evaluate('attendanceHistory', () => { throw new Error('Unexpected import'); });
let disk = JSON.stringify([{ id: 'legacy', name: 'Medicine', kind: 'theory', target: 75, held: 40, attended: 30 }]);
let fail = false;
const storage = { getItem: async () => disk, setItem: async (_key, value) => { if (fail) throw new Error('Disk full'); disk = value; } };
const load = () => evaluate('attendance', name => name === './attendanceHistory' ? domain : storage);
const store = await load();
await store.hydrateAttendance();
assert.equal(store.getAttendance().items[0].held, 40);
assert.deepEqual(store.getAttendance().items[0].daily, {}, 'legacy counts gain no invented dates');
await store.setAttendanceDay('legacy', '2026-10-24', { present: 2, absent: 1, off: false });
let row = store.getAttendance().items[0];
assert.equal(row.held, 43); assert.equal(row.attended, 32);
assert.equal(domain.dayState(row.daily['2026-10-24']), 'mixed');
assert.deepEqual(row.monthly['2026-10'], { held: 3, attended: 2, totalClasses: undefined });
await store.setAttendanceDay('legacy', '2026-10-24', { present: 2, absent: 1, off: false });
assert.equal(store.getAttendance().items[0].held, 43, 're-saving a date is idempotent');
await store.setAttendanceDay('legacy', '2026-10-24', { present: 0, absent: 0, off: true });
row = store.getAttendance().items[0]; assert.equal(row.held, 40); assert.equal(row.attended, 30);
assert.equal(domain.historyTotals(row.daily).off, 1);
await store.setAttendanceDay('legacy', '2026-10-24', { present: 0, absent: 0, off: false });
assert.equal(store.getAttendance().items[0].daily['2026-10-24'], undefined);
await assert.rejects(store.setAttendanceDay('legacy', '2026-02-30', { present: 1, absent: 0, off: false }));
await assert.rejects(store.setAttendanceDay('legacy', '2026-10-26', { present: 1, absent: 0, off: false }));
await Promise.all(Array.from({ length: 12 }, (_, i) => store.markAttendance('legacy', i % 2 === 0)));
row = store.getAttendance().items[0]; assert.equal(row.held, 52); assert.equal(row.attended, 36);
assert.deepEqual(row.daily['2026-10-25'], { present: 6, absent: 6, off: false });
await store.setAttendanceCounts('legacy', 'earlier', 32, 10);
row = store.getAttendance().items[0]; assert.equal(row.attended, 38); assert.equal(row.held, 54);
await assert.rejects(store.setAttendanceCounts('legacy', '2026-10', 0, 0), /dated entries/);
await store.setAttendanceCounts('legacy', '2026-10', 7, 7);
row = store.getAttendance().items[0]; assert.equal(row.held, 56); assert.equal(row.attended, 39);
await store.updateAttendance('legacy', { target: 0 });
assert.equal(store.getAttendance().items[0].target, 0, '0% survives updating and hydration');
const restart = await load(); await restart.hydrateAttendance();
assert.equal(restart.getAttendance().items[0].target, 0);
assert.equal(restart.getAttendance().items[0].daily['2026-10-25'].present, 6);
fail = true; const before = disk;
await assert.rejects(store.markAttendance('legacy', true));
assert.equal(disk, before); assert.equal(store.getAttendance().items[0].held, 56, 'failed save preserves visible counts');
fail = false;
await store.addAttendance({ id: 'lab', name: 'Pathology lab', kind: 'lab', target: 80 });
await store.markAttendance('lab', true);
const labRestart = await load(); await labRestart.hydrateAttendance();
assert.equal(labRestart.getAttendance().items.find(item => item.id === 'lab').kind, 'lab');
// Undo after midnight and a month boundary uses the persisted original date/status.
now = new Date(2026, 8, 30, 23, 50).getTime();
await store.markAttendance('legacy', false);
now = new Date(2026, 9, 1, 0, 10).getTime();
await store.undoAttendance('legacy', true); // caller's stale hint must not turn this absence into a presence
row = store.getAttendance().items[0]; assert.equal(row.daily['2026-09-30'], undefined);
assert.equal(row.monthly['2026-09'].held, 0); assert.equal(row.monthly['2026-10'].held, 14);
assert.equal(row.attended, 39); assert.equal(row.held, 56);
const posting = { id: 'rotation', name: 'Ward', kind: 'posting', target: 80, held: 0, attended: 0, totalDays: 7, startDate: '2026-10-19', endDate: '2026-10-25', skipSundays: true };
assert.throws(() => domain.withAttendanceDay(posting, '2026-10-18', { present: 1, absent: 0, off: false }, '2026-10-25'), /within/);
const offPosting = domain.withAttendanceDay(posting, '2026-10-24', { present: 0, absent: 0, off: true }, '2026-10-25');
assert.equal(store.workingDays(offPosting), 5, 'recorded off-day is removed in addition to Sunday');
const sunday = domain.withAttendanceDay(posting, '2026-10-25', { present: 1, absent: 0, off: false }, '2026-10-25');
assert.equal(store.workingDays(sunday), 7, 'an actual recorded Sunday class overrides the planned weekend');
assert.deepEqual(domain.cleanAttendanceHistory({ '2026-10-25': { present: 2, absent: 1, off: true }, 'bad': { present: 1, absent: 0 } }), {});
disk = '{bad';
const corrupt = await load(); await corrupt.hydrateAttendance();
await assert.rejects(corrupt.addAttendance({ name: 'Do not overwrite', kind: 'lab', target: 80 }));
assert.equal(disk, '{bad');

const datedLegacy = domain.withDatedBalance({ id: 'old', name: 'Old', kind: 'theory', target: 75, held: 43, attended: 30, monthly: { '2026-10': { held: 20, attended: 15 } } }, '2026-10-24', { present: 2, absent: 1, off: false }, '2026-10-25');
assert.equal(datedLegacy.held, 43); assert.equal(datedLegacy.attended, 30);
assert.equal(datedLegacy.monthly['2026-10'].held, 20);
assert.equal(datedLegacy.daily['2026-10-24'].present, 2);
const transferred = domain.withDatedBalance({ id: 'old', name: 'Old', kind: 'theory', target: 75, held: 10, attended: 8 }, '2026-10-24', { present: 2, absent: 1, off: false }, '2026-10-25');
assert.equal(transferred.held, 10); assert.equal(transferred.attended, 8);
assert.equal(transferred.monthly['2026-10'].held, 3);
assert.throws(() => domain.withDatedBalance(transferred, '2026-10-24', { present: 1, absent: 0, off: false }, '2026-10-25'), /already/);
assert.throws(() => domain.withDatedBalance(transferred, '2026-10-23', { present: 0, absent: 5, off: false }, '2026-10-25'), /Not enough/);

console.log('OK history: legacy preservation, mixed/off dates, corrections, month totals, concurrent taps, failure/retry, lab hydration, persisted cross-month undo and zero targets');
