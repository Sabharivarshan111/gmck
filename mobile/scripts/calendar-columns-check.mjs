import assert from 'node:assert/strict';
import { calendarWeeks } from '../src/lib/calendarWeeks.ts';
// Actual dates cross months and years, begin on every weekday, and end midweek.
for (const start of ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-12-30', '2028-02-27']) {
  for (const length of [1, 6, 7, 28, 31, 90]) {
    const [y, m, d] = start.split('-').map(Number);
    const days = Array.from({ length }, (_, i) => {
      const date = new Date(y, m - 1, d + i);
      return { date, dayOfWeek: date.getDay() };
    });
    const weeks = calendarWeeks(days);
    assert.deepEqual(weeks.flat().filter(Boolean), days);
    for (const week of weeks) {
      assert.equal(week.length, 7);
      week.forEach((day, col) => { if (day) assert.equal(day.date.getDay(), (col + 1) % 7); });
    }
  }
}
assert.deepEqual(calendarWeeks([]), []);
console.log('Calendar: 54 rotations keep every actual weekday in its Monday–Sunday column.');
