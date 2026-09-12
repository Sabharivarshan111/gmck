import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Attendance — theory classes and clinical postings, and how many you can miss.
 *
 * ## Why this replaced the calendar
 *
 * The Calendar tab was a month grid you could pin a note to, and almost nobody
 * did: an exam date already lives in the exam countdown, and everything else a
 * student writes down goes in their notes. What they actually count, every
 * week, on paper or in their head, is whether they are above seventy-five —
 * because below it you are barred from the exam.
 *
 * ## It never leaves the phone
 *
 * A record of which days somebody turned up is a record of their movements, and
 * it is nobody's business but theirs. Same rule as their notes and the focus
 * log: AsyncStorage only, no row, no bucket, no account.
 * `npm run check:cloud-ids` holds this file to that from the other side.
 *
 * ## The arithmetic is the feature, so it is pure and it is pinned
 *
 * Everything below the storage line is a pure function of numbers, exported on
 * its own and covered by `npm run check:attendance`. That is not ceremony:
 * telling a student they can safely miss three more classes when they can miss
 * one is the difference between sitting an exam and repeating a year, and it is
 * a mistake nobody would notice until it was far too late to fix.
 */

const KEY = 'orbit:attendance-v1';

export type AttendanceKind = 'theory' | 'posting';

export interface AttendanceItem {
  id: string;
  name: string;
  kind: AttendanceKind;
  /** The percentage the college requires. 75 in most Indian medical colleges. */
  target: number;
  /** Classes or days that have happened so far. */
  held: number;
  /** How many of those you were present for. */
  attended: number;
  /**
   * Postings only: how long the whole rotation runs.
   *
   * A theory subject has no end date anybody knows in advance — the timetable
   * changes, classes get cancelled — so "how many can I miss" there is open
   * ended. A posting is a fixed block, and knowing its length is what turns
   * "you can miss four" into "you can miss four, and there are only two left".
   */
  totalDays?: number;
  /** ISO date the rotation started, for the same reason. */
  startDate?: string;
  /**
   * Postings only: the ISO date the rotation ends.
   *
   * This replaced "how many days does it run?", which asked the reader to do
   * a subtraction they do not have the numbers for. A college hands out a
   * rotation as two dates on a noticeboard; turning that into a count means
   * working out whether both ends are included, and getting it wrong by one
   * is getting the whole margin wrong by one.
   *
   * It also fixes a quieter bug. `startDate` was stamped with TODAY whenever a
   * posting was added, so anybody entering a rotation they were already three
   * weeks into had every day of it counted from the wrong end.
   *
   * `totalDays` is still read for postings saved before this existed.
   */
  endDate?: string;
  /**
   * Postings only: ISO dates inside the rotation that are not working days.
   *
   * Public holidays, college holidays, a strike, a long weekend the department
   * announced. They come off the working-day count exactly the way Sundays do,
   * which is the whole reason the reader is being asked: a holiday nobody
   * subtracted is a day of margin somebody thinks they have and does not.
   *
   * The reader marks them by tapping the calendar. Four are offered ready to
   * accept, and only four — see `FIXED_HOLIDAYS`.
   */
  holidays?: string[];
  /**
   * Postings only: Sundays are not working days, so they do not count.
   *
   * Taken from a competitor's tracker, which states it plainly — "holidays
   * reduce total working days count" — and it is the one idea of theirs worth
   * having, because without it the most useful sentence this feature can say is
   * simply wrong. A 28-day block starting on a Monday contains four Sundays, so
   * "only two days left" is out by four, in the direction that gets somebody
   * short.
   *
   * Off by default: plenty of postings do run through the weekend, and a
   * tracker that silently shortens a rotation nobody asked it to shorten is the
   * same bug in the other direction.
   */
  skipSundays?: boolean;
}

export interface AttendanceState {
  items: AttendanceItem[];
  hydrated: boolean;
}

// ---------------------------------------------------------------------------
// The arithmetic
// ---------------------------------------------------------------------------

export function percentOf(attended: number, held: number): number {
  if (held <= 0) {
    return 0;
  }
  return (attended / held) * 100;
}

/**
 * How many MORE you may miss and still be at or above target.
 *
 * After missing `k` more, attendance is `attended / (held + k)`. Setting that
 * at the target and solving gives `k <= attended / t - held`, floored — because
 * you cannot miss two thirds of a class.
 *
 * **Floor, never round.** Rounding is the version that tells somebody sitting
 * at exactly the line that they have one in hand.
 */
export function canMiss(attended: number, held: number, target: number): number {
  const t = target / 100;
  if (t <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  if (attended <= 0) {
    // Nothing attended: any class held at all is already below any target
    // above zero, so there is nothing spare whatever `held` says.
    return 0;
  }
  return Math.max(0, Math.floor(attended / t - held));
}

/**
 * How many you must now attend, in a row and without missing one, to climb
 * back to target.
 *
 * `(attended + n) / (held + n) >= t`, solved for `n` and rounded UP. Zero when
 * you are already there.
 *
 * A target of 100 has no answer — you cannot recover from a single absence —
 * and this says so with Infinity rather than dividing by zero.
 */
export function mustAttend(attended: number, held: number, target: number): number {
  const t = target / 100;
  if (t >= 1) {
    return attended >= held ? 0 : Number.POSITIVE_INFINITY;
  }
  if (attended >= t * held) {
    return 0;
  }
  return Math.ceil((t * held - attended) / (1 - t));
}

/**
 * India's gazetted holidays that fall on the same date every year.
 *
 * Four, and deliberately only four. Every other national holiday — Diwali,
 * Holi, Eid, Good Friday — moves against the Gregorian calendar, and the ones
 * that matter most to any given student are their own college's and their own
 * state's, which no list here could know.
 *
 * So this offers the dates that are genuinely knowable and asks about the
 * rest. Filling a calendar with guessed holidays would hand somebody a
 * working-day count built on dates that are wrong, which is the same failure
 * as inventing a repeat-count: a number that looks authoritative and is not.
 *
 * Nothing is marked automatically. These are proposed, and the reader accepts
 * or ignores them — a college that works Republic Day is not unusual.
 */
export const FIXED_HOLIDAYS = [
  { month: 1, day: 26, name: 'Republic Day' },
  { month: 8, day: 15, name: 'Independence Day' },
  { month: 10, day: 2, name: 'Gandhi Jayanti' },
  { month: 12, day: 25, name: 'Christmas' },
];

/** ISO `yyyy-mm-dd` for a date, in local time. */
export function isoDate(day: Date): string {
  const month = `${day.getMonth() + 1}`.padStart(2, '0');
  const date = `${day.getDate()}`.padStart(2, '0');
  return `${day.getFullYear()}-${month}-${date}`;
}

/** A local midnight Date from an ISO date, or null if it does not parse. */
export function parseDate(iso: string): Date | null {
  if (!iso) {
    return null;
  }
  const day = new Date(`${iso}T00:00:00`);
  return Number.isNaN(day.getTime()) ? null : day;
}

/**
 * How many calendar days the rotation covers, both ends included.
 *
 * Inclusive because that is how a noticeboard means it: a posting running
 * "1 Jan to 7 Jan" is seven days, not six. Off by one here is off by one in
 * every number this screen prints.
 *
 * Falls back to `totalDays` for postings saved before the range existed.
 */
export function spanDays(item: AttendanceItem): number | null {
  const start = parseDate(item.startDate ?? '');
  const end = parseDate(item.endDate ?? '');
  if (start && end) {
    const ms = end.getTime() - start.getTime();
    if (ms < 0) {
      return null;
    }
    // Rounded rather than floored: an hour of drift either way must not
    // silently drop a day. India keeps no DST, but a phone that has travelled
    // does not know that.
    return Math.round(ms / 86400000) + 1;
  }
  if (typeof item.totalDays === 'number' && item.totalDays > 0) {
    return Math.round(item.totalDays);
  }
  return null;
}

/** Whether a given ISO date has been marked as not a working day. */
export function isHoliday(item: AttendanceItem, iso: string): boolean {
  return Array.isArray(item.holidays) && item.holidays.indexOf(iso) !== -1;
}

/**
 * How many working days a rotation has.
 *
 * The span is the block as the college states it. Whether every one of those
 * is a day the reader is expected to turn up is a separate question, and
 * `skipSundays` and the marked holidays are how they answer it.
 *
 * Counted day by day rather than divided by seven. A 28-day block has four
 * Sundays or five depending on the weekday it starts, holidays cluster rather
 * than spread, and the difference is a whole day of somebody's margin.
 */
export function workingDays(item: AttendanceItem): number | null {
  const total = spanDays(item);
  if (total === null) {
    return null;
  }
  const start = parseDate(item.startDate ?? '');
  const marked = Array.isArray(item.holidays) ? item.holidays.length : 0;
  // Nothing to subtract, so nothing to walk.
  if (!start || (!item.skipSundays && marked === 0)) {
    return total;
  }
  let working = 0;
  for (let i = 0; i < total; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    if (item.skipSundays && day.getDay() === 0) {
      continue;
    }
    if (isHoliday(item, isoDate(day))) {
      continue;
    }
    working += 1;
  }
  return working;
}

/**
 * The fixed-date holidays that land inside a range, as `{ date, name }`.
 *
 * Every year the range touches is walked, so a rotation crossing New Year gets
 * both sides. Nothing moveable is guessed — see `FIXED_HOLIDAYS`.
 */
export function fixedHolidaysBetween(startDate: string, endDate: string) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end || end.getTime() < start.getTime()) {
    return [];
  }
  const found = [];
  for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) {
    for (const holiday of FIXED_HOLIDAYS) {
      const day = new Date(year, holiday.month - 1, holiday.day);
      if (day.getTime() >= start.getTime() && day.getTime() <= end.getTime()) {
        found.push({ date: isoDate(day), name: holiday.name });
      }
    }
  }
  return found.sort((a, b) => (a.date < b.date ? -1 : 1));
}

/**
 * Which working day of the rotation today is, 1-based, or null.
 *
 * Null before it starts and after it ends, because "day 31 of 28" is not a
 * thing to put on a card. Clamped rather than extrapolated for the same reason.
 */
export function dayOfRotation(item: AttendanceItem, today: Date = new Date()): number | null {
  const span = spanDays(item);
  const start = parseDate(item.startDate ?? '');
  if (span === null || !start) {
    return null;
  }
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (now.getTime() < start.getTime()) {
    return null;
  }
  let working = 0;
  for (let i = 0; i < span; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    if (item.skipSundays && day.getDay() === 0) {
      continue;
    }
    if (isHoliday(item, isoDate(day))) {
      continue;
    }
    working += 1;
    if (day.getTime() >= now.getTime()) {
      return working;
    }
  }
  return null;
}

export interface AttendanceVerdict {
  percent: number;
  /** At or above the target right now. */
  safe: boolean;
  /** How many more can be missed. Capped by what is left of a posting. */
  canMiss: number;
  /** True when the cap above is the end of the rotation rather than the target. */
  cappedByEnd: boolean;
  /** How many must be attended in a row to recover. 0 when already safe. */
  mustAttend: number;
  /** Days of the rotation still to come, for a posting with a length. */
  remaining: number | null;
}

/**
 * Everything the card needs to say, in one place.
 *
 * The cap matters and is easy to leave out: a posting with four days left
 * cannot have six missed out of it, and "you can safely miss 6" on a rotation
 * that ends on Friday is worse than saying nothing.
 */
export function verdictFor(item: AttendanceItem): AttendanceVerdict {
  const pct = percentOf(item.attended, item.held);
  const safe = item.held === 0 || pct >= item.target;
  const spare = canMiss(item.attended, item.held, item.target);
  /*
   * What is LEFT of the rotation, in days somebody is expected to attend.
   *
   * This was `totalDays - held`, which is two assumptions stacked: that every
   * calendar day is a working day, and that the reader has marked every one so
   * far. Both are usually false. `workingDays` drops the Sundays when the
   * rotation says to, and the count runs off the length rather than off how
   * diligently the card has been tapped.
   */
  const total = workingDays(item);
  const remaining = total === null ? null : Math.max(0, total - item.held);
  const capped = remaining !== null && spare > remaining;
  return {
    percent: pct,
    safe,
    canMiss: capped ? remaining : spare,
    cappedByEnd: capped,
    mustAttend: safe ? 0 : mustAttend(item.attended, item.held, item.target),
    remaining,
  };
}

/**
 * The best percentage this posting can still finish on.
 *
 * Attending every remaining day. Worth showing when somebody is below target
 * and wondering whether it is even recoverable — for a rotation that is nearly
 * over, often it is not, and finding that out in the last week is the thing
 * this is meant to prevent.
 */
export function bestPossible(item: AttendanceItem): number | null {
  const total = workingDays(item);
  if (total === null) {
    return null;
  }
  const remaining = Math.max(0, total - item.held);
  return percentOf(item.attended + remaining, item.held + remaining);
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

let state: AttendanceState = { items: [], hydrated: false };
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version += 1;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeAttendance(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function attendanceVersion(): number {
  return version;
}

export function getAttendance(): AttendanceState {
  return state;
}

function sane(raw: unknown): AttendanceItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const item = raw as Record<string, unknown>;
  if (typeof item.id !== 'string' || typeof item.name !== 'string') {
    return null;
  }
  const held = Math.max(0, Math.round(Number(item.held) || 0));
  // Attended can never exceed held. A stored file that says otherwise would
  // make every percentage above 100 and every verdict nonsense, and it is
  // cheaper to clamp here than to defend against it in six places.
  const attended = Math.min(held, Math.max(0, Math.round(Number(item.attended) || 0)));
  const target = Math.min(100, Math.max(1, Math.round(Number(item.target) || 75)));
  return {
    id: item.id,
    name: item.name,
    kind: item.kind === 'posting' ? 'posting' : 'theory',
    target,
    held,
    attended,
    totalDays:
      typeof item.totalDays === 'number' && item.totalDays > 0
        ? Math.round(item.totalDays)
        : undefined,
    startDate: typeof item.startDate === 'string' ? item.startDate : undefined,
    endDate: typeof item.endDate === 'string' ? item.endDate : undefined,
    // Deduplicated and sorted on the way in. A date marked twice would be
    // subtracted twice, and a rotation would come back shorter than it is —
    // silently, and only for whoever managed to double-tap.
    holidays: Array.isArray(item.holidays)
      ? Array.from(
          new Set(
            item.holidays.filter(
              (day): day is string => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day),
            ),
          ),
        ).sort()
      : undefined,
    skipSundays: item.skipSundays === true ? true : undefined,
  };
}

export async function hydrateAttendance(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    const items = Array.isArray(parsed)
      ? parsed.map(sane).filter((item): item is AttendanceItem => item !== null)
      : [];
    state = { items, hydrated: true };
  } catch {
    state = { items: [], hydrated: true };
  }
  emit();
}

async function persist(items: AttendanceItem[]): Promise<void> {
  state = { ...state, items };
  emit();
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // The in-memory list still applies for this session. Losing a tap is
    // better than losing the screen.
  }
}

export async function addAttendance(
  input: Omit<AttendanceItem, 'id' | 'held' | 'attended'> &
    Partial<Pick<AttendanceItem, 'held' | 'attended'>>,
): Promise<void> {
  const item: AttendanceItem = {
    id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    held: 0,
    attended: 0,
    ...input,
  };
  await persist([...state.items, item]);
}

export async function updateAttendance(
  id: string,
  patch: Partial<AttendanceItem>,
): Promise<void> {
  await persist(
    state.items.map(item => {
      if (item.id !== id) {
        return item;
      }
      const next = { ...item, ...patch };
      next.held = Math.max(0, Math.round(next.held));
      next.attended = Math.min(next.held, Math.max(0, Math.round(next.attended)));
      return next;
    }),
  );
}

/**
 * Mark a date in the rotation as a holiday, or take the mark back.
 *
 * A toggle rather than add/remove because that is what a tap on a calendar
 * cell means, and because the reader is the only authority here: a college
 * that works Republic Day, and one that shuts for a week nobody outside it has
 * heard of, are both ordinary.
 *
 * It never touches `held` or `attended`. Those are what happened; this is what
 * was scheduled, and conflating them would let marking a holiday rewrite a
 * register that has already been filled in.
 */
export async function toggleHoliday(id: string, iso: string): Promise<void> {
  const item = state.items.find(entry => entry.id === id);
  if (!item) {
    return;
  }
  const current = Array.isArray(item.holidays) ? item.holidays : [];
  const next = current.indexOf(iso) === -1
    ? [...current, iso].sort()
    : current.filter(day => day !== iso);
  await updateAttendance(id, { holidays: next.length > 0 ? next : undefined });
}

/** One class happened, and you were there — or you were not. */
export async function markAttendance(id: string, present: boolean): Promise<void> {
  const item = state.items.find(entry => entry.id === id);
  if (!item) {
    return;
  }
  await updateAttendance(id, {
    held: item.held + 1,
    attended: item.attended + (present ? 1 : 0),
  });
}

/**
 * Take back the last mark.
 *
 * There is one Undo rather than a per-day editor because the mistake this
 * fixes is always the same one: tapping Present when you meant Absent, and
 * noticing immediately. It cannot know WHICH of the previous marks was wrong,
 * so it removes a class from the total and, when asked, an attendance with it.
 */
export async function undoAttendance(id: string, wasPresent: boolean): Promise<void> {
  const item = state.items.find(entry => entry.id === id);
  if (!item || item.held === 0) {
    return;
  }
  await updateAttendance(id, {
    held: item.held - 1,
    attended: Math.max(0, item.attended - (wasPresent ? 1 : 0)),
  });
}

export async function removeAttendance(id: string): Promise<void> {
  await persist(state.items.filter(item => item.id !== id));
}
