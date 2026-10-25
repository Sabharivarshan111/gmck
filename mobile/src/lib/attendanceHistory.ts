import type { AttendanceItem, MonthlyAttendance } from './attendance';

export interface AttendanceDay {
  present: number;
  absent: number;
  off: boolean;
}
export type AttendanceDayState =
  | 'present'
  | 'absent'
  | 'mixed'
  | 'off'
  | 'unmarked';
export function validHistoryDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}
export function dayState(day?: AttendanceDay): AttendanceDayState {
  if (!day) return 'unmarked';
  if (day.off) return 'off';
  if (day.present && day.absent) return 'mixed';
  return day.present ? 'present' : day.absent ? 'absent' : 'unmarked';
}
const count = (n: unknown): n is number =>
  typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
export function cleanAttendanceHistory(
  raw: unknown,
): Record<string, AttendanceDay> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result: Record<string, AttendanceDay> = {};
  for (const [iso, value] of Object.entries(raw)) {
    if (!validHistoryDate(iso) || !value || typeof value !== 'object') continue;
    const row = value as Record<string, unknown>;
    if (!count(row.present) || !count(row.absent)) continue;
    // Contradictory restored records are rejected, never silently reclassified.
    if (row.off === true && row.present + row.absent > 0) continue;
    result[iso] = {
      present: row.present,
      absent: row.absent,
      off: row.off === true,
    };
  }
  return result;
}
export function historyTotals(
  daily: Record<string, AttendanceDay> = {},
  month?: string,
) {
  return Object.entries(daily).reduce(
    (total, [date, day]) => {
      if (month && !date.startsWith(month + '-')) return total;
      return {
        present: total.present + day.present,
        absent: total.absent + day.absent,
        off: total.off + (day.off ? 1 : 0),
      };
    },
    { present: 0, absent: 0, off: 0 },
  );
}
/** Replace one dated record, applying deltas; never recount an old aggregate as dated history. */
export function withAttendanceDay(
  item: AttendanceItem,
  iso: string,
  next: AttendanceDay,
  today: string,
): AttendanceItem {
  if (!validHistoryDate(iso) || iso > today)
    throw new Error('Choose a valid date on or before today.');
  if (
    item.kind === 'posting' &&
    ((item.startDate && iso < item.startDate) ||
      (item.endDate && iso > item.endDate))
  )
    throw new Error('Choose a date within this posting.');
  if (
    !count(next.present) ||
    !count(next.absent) ||
    (next.off && next.present + next.absent > 0)
  )
    throw new Error(
      'Use whole class counts; an off-day cannot also contain classes.',
    );
  const previous = item.daily?.[iso] ?? { present: 0, absent: 0, off: false };
  if (!Number.isSafeInteger(item.held + next.present + next.absent) || !Number.isSafeInteger(next.present + next.absent)) throw new Error('Class counts are too large.');
  const deltaPresent = next.present - previous.present;
  const deltaHeld =
    next.present + next.absent - previous.present - previous.absent;
  const monthly = { ...(item.monthly ?? {}) };
  const monthKey = iso.slice(0, 7);
  const month = monthly[monthKey] ?? { held: 0, attended: 0 };
  const held = month.held + deltaHeld;
  const attended = month.attended + deltaPresent;
  if (
    held < 0 ||
    attended < 0 ||
    attended > held ||
    item.held + deltaHeld < 0 ||
    item.attended + deltaPresent < 0
  )
    throw new Error(
      'This record conflicts with your totals. Edit the counts first.',
    );
  monthly[monthKey] = {
    ...month,
    held,
    attended,
    totalClasses: month.totalClasses
      ? Math.max(held, month.totalClasses)
      : undefined,
  };
  const daily = { ...item.daily };
  if (dayState(next) === 'unmarked') delete daily[iso];
  else daily[iso] = { ...next };
  return {
    ...item,
    held: item.held + deltaHeld,
    attended: item.attended + deltaPresent,
    monthly,
    daily,
    // A manual history correction invalidates Undo; it cannot guess the old tap afterward.
    lastMarkedDate: undefined,
    lastMarkedPresent: undefined,
    updatedAt: Date.now(),
    totalClasses: item.totalClasses
      ? Math.max(item.totalClasses, item.held + deltaHeld)
      : undefined,
  };
}
export function countBalance(item: AttendanceItem, month: string) {
  if (month !== 'earlier') {
    const row = item.monthly?.[month] ?? { held: 0, attended: 0 };
    return { present: row.attended, absent: row.held - row.attended };
  }
  const total = Object.values(item.monthly ?? {}).reduce(
    (sum, row) => ({
      present: sum.present + row.attended,
      absent: sum.absent + row.held - row.attended,
    }),
    { present: 0, absent: 0 },
  );
  return {
    present: Math.max(0, item.attended - total.present),
    absent: Math.max(0, item.held - item.attended - total.absent),
  };
}
/** Correct an explicitly selected month or the earlier unallocated balance; dated entries are protected. */
export function withAttendanceCounts(
  item: AttendanceItem,
  month: string,
  present: number,
  absent: number,
): AttendanceItem {
  if (!count(present) || !count(absent))
    throw new Error('Enter whole counts of zero or more.');
  if (month !== 'earlier' && !validHistoryDate(month + '-01'))
    throw new Error('Choose a valid month.');
  const known = historyTotals(
    item.daily,
    month === 'earlier' ? undefined : month,
  );
  if (month !== 'earlier' && (present < known.present || absent < known.absent))
    throw new Error(
      'These counts include dated entries. Edit those dates in History to reduce them.',
    );
  const previous = countBalance(item, month);
  const deltaPresent = present - previous.present;
  const deltaHeld = present + absent - previous.present - previous.absent;
  const monthly: Record<string, MonthlyAttendance> = { ...item.monthly };
  if (month !== 'earlier') {
    const row = monthly[month];
    monthly[month] = {
      held: present + absent,
      attended: present,
      totalClasses: row?.totalClasses
        ? Math.max(row.totalClasses, present + absent)
        : undefined,
    };
  }
  const held = item.held + deltaHeld;
  const attended = item.attended + deltaPresent;
  if (
    attended < known.present ||
    held - attended < known.absent ||
    !Number.isSafeInteger(held)
  )
    throw new Error('The new totals conflict with dated history.');
  return {
    ...item,
    held,
    attended,
    monthly,
    lastMarkedDate: undefined,
    lastMarkedPresent: undefined,
    updatedAt: Date.now(),
    totalClasses: item.totalClasses
      ? Math.max(item.totalClasses, held)
      : undefined,
  };
}

/** Date an old aggregate entry without counting the same class twice. Prefer its known month, then the unallocated balance. */
export function withDatedBalance(
  item: AttendanceItem,
  iso: string,
  day: AttendanceDay,
  today: string,
): AttendanceItem {
  const previous = item.daily?.[iso];
  if (previous && previous.present + previous.absent > 0)
    throw new Error('This date already has classes. Edit its counts directly.');
  if (day.off || !count(day.present) || !count(day.absent))
    throw new Error('Choose class counts to move from your earlier balance.');
  const key = iso.slice(0, 7);
  const month = item.monthly?.[key] ?? { held: 0, attended: 0 };
  const dated = historyTotals(item.daily, key);
  const takePresent = Math.min(
    Math.max(0, month.attended - dated.present),
    day.present,
  );
  const takeAbsent = Math.min(
    Math.max(0, month.held - month.attended - dated.absent),
    day.absent,
  );
  const earlier = countBalance(item, 'earlier');
  if (
    earlier.present < day.present - takePresent ||
    earlier.absent < day.absent - takeAbsent
  )
    throw new Error(
      'Not enough undated attendance in this month or the earlier balance. Other months are kept unchanged.',
    );
  const adjusted = {
    ...item,
    held: item.held - day.present - day.absent,
    attended: item.attended - day.present,
    monthly: {
      ...item.monthly,
      [key]: {
        ...month,
        held: month.held - takePresent - takeAbsent,
        attended: month.attended - takePresent,
      },
    },
  };
  return withAttendanceDay(adjusted, iso, day, today);
}
