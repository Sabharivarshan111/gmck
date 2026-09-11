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
   * How long the whole block runs, in calendar days.
   *
   * **This used to be postings only**, on the reasoning that a theory subject
   * has no end date anybody knows in advance. The app's owner asked for it on
   * theory too — "in theory how many days does it run option not there" — and
   * they are right: a term IS a fixed block. Somebody who knows their
   * Pathology block is ninety days and started on the fourth can be told how
   * many classes are left, and without it the most useful sentence this
   * feature has is only available to half the people using it.
   *
   * Still optional everywhere. A subject with no length behaves exactly as it
   * did: open ended, and "how many can I miss" is answered without a ceiling.
   */
  totalDays?: number;
  /** ISO date the block started, for the same reason. */
  startDate?: string;
  /**
   * Sundays are not working days, so they do not count.
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
  /**
   * Which Saturdays the college is shut, as a **rule** rather than a switch.
   *
   * Saturdays are their own field and not half of a "weekends" one, because in
   * Indian medical colleges the two weekend days are genuinely different:
   * Sunday is off almost everywhere, and Saturday very often is not.
   *
   * A boolean was not enough either, and the app's owner is the one who said
   * so: *"every second saturday is automatic holiday"*. That is the rule most
   * Indian institutions actually run — the second Saturday of each month off,
   * and very commonly the fourth as well — and it cannot be expressed as "all
   * Saturdays" or "no Saturdays" without being wrong two ways. Typing those
   * dates into `holidays` by hand works out at six to twelve entries a term,
   * every term, which is not a thing anybody keeps up.
   *
   * * `none` — Saturday is a working day. The default.
   * * `second` — the second Saturday of each month is off.
   * * `second-fourth` — the second and fourth are off.
   * * `all` — every Saturday is off.
   */
  saturdays?: SaturdayRule;
  /**
   * Days the college is shut: government holidays, festivals, a strike.
   *
   * ISO `YYYY-MM-DD`, and they come off the working-day count the same way a
   * Sunday does. This is the other half of "holidays reduce total working
   * days": a block that contains Diwali and Republic Day is four or five days
   * shorter than its calendar length, and a tracker that does not know it will
   * tell somebody they have days they do not have.
   *
   * A date outside the block is harmless — it simply never matches — so a
   * reader can keep one list of their college's holidays and paste it at every
   * subject without pruning it.
   */
  holidays?: string[];
  /**
   * Every mark, dated, newest last.
   *
   * `held` and `attended` stay the truth: they are what the arithmetic reads,
   * they are what existing installs already have, and deriving them from this
   * list would make a migration out of a feature nobody asked to migrate.
   *
   * This is what makes "see about each month" possible. Two counters cannot be
   * broken down by month — the information is simply not in them — so the
   * month view was going to be a schedule rather than a record until this
   * existed. A subject marked before this shipped has no log and reads as
   * "no marks recorded yet this month", which is true.
   */
  log?: AttendanceMark[];
}

export type SaturdayRule = 'none' | 'second' | 'second-fourth' | 'all';

/** What each rule is called on screen, in the order they are offered. */
export const SATURDAY_RULES: { value: SaturdayRule; label: string }[] = [
  { value: 'none', label: 'All Saturdays working' },
  { value: 'second', label: '2nd Saturday off' },
  { value: 'second-fourth', label: '2nd & 4th off' },
  { value: 'all', label: 'Every Saturday off' },
];

export interface AttendanceMark {
  /** ISO `YYYY-MM-DD`, the day the class was held. */
  date: string;
  present: boolean;
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
 * How many working days a rotation has, counting from its start.
 *
 * `totalDays` is what the reader typed, and what they typed is the length of
 * the block as the college states it. Whether every one of those is a day they
 * are expected to turn up is a separate question, and `skipSundays` is how they
 * answer it.
 *
 * Counted rather than divided by seven. A 28-day block has four Sundays or
 * five depending on the weekday it starts, and the difference is a whole day of
 * somebody's margin.
 */
/** `YYYY-MM-DD` for a local date, without going through UTC and losing a day. */
export function isoDay(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/**
 * Is this day one the college is shut?
 *
 * The three reasons are deliberately one function rather than three checks
 * spread through the file: `workingDays`, `dayOfRotation` and the month
 * breakdown all have to agree about which days exist, and they disagreed once
 * already — `dayOfRotation` skipped Sundays while `workingDays` had a separate
 * loop doing the same thing, and adding Saturdays would have meant remembering
 * both.
 */
export function isOffDay(item: AttendanceItem, day: Date): boolean {
  const weekday = day.getDay();
  if (item.skipSundays && weekday === 0) return true;
  if (weekday === 6 && saturdayIsOff(item.saturdays ?? 'none', day)) return true;
  return Boolean(item.holidays?.includes(isoDay(day)));
}

/**
 * Which Saturday of its month this is — 1 for the first, 2 for the second.
 *
 * `ceil(date / 7)` and not a week-number: the "second Saturday" everybody
 * means is the second one that falls in the month, which is the 8th to the
 * 14th whatever weekday the month started on. Counting calendar weeks instead
 * gets it wrong in every month that begins late in a week.
 */
export function saturdayOrdinal(day: Date): number {
  return Math.ceil(day.getDate() / 7);
}

function saturdayIsOff(rule: SaturdayRule, day: Date): boolean {
  if (rule === 'all') return true;
  if (rule === 'none') return false;
  const nth = saturdayOrdinal(day);
  return rule === 'second' ? nth === 2 : nth === 2 || nth === 4;
}

/** Every calendar day of the block, off days included, or null with no length. */
function blockDays(item: AttendanceItem): Date[] | null {
  if (typeof item.totalDays !== 'number' || item.totalDays <= 0) {
    return null;
  }
  if (!item.startDate) {
    return null;
  }
  const start = new Date(`${item.startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  const days: Date[] = [];
  for (let i = 0; i < item.totalDays; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
}

export function workingDays(item: AttendanceItem): number | null {
  if (typeof item.totalDays !== 'number' || item.totalDays <= 0) {
    return null;
  }
  const days = blockDays(item);
  // No start date means no calendar to subtract from, so the block is however
  // many days it says it is. That is the honest answer rather than a guess.
  if (!days) {
    return item.totalDays;
  }
  return days.filter((day) => !isOffDay(item, day)).length;
}

export interface AttendanceMonth {
  /** `YYYY-MM`, which sorts correctly as a string. */
  key: string;
  /** "September 2026". */
  label: string;
  /** Working days of the block that fall in this month. */
  working: number;
  /** Days the college is shut that fall in it — Sundays, Saturdays, holidays. */
  off: number;
  /** Marks recorded in this month, from the log. */
  held: number;
  attended: number;
}

/**
 * The block, month by month — what "see about each month" shows.
 *
 * Asked for by the app's owner, and it answers a question the single
 * percentage cannot: a rotation that looks comfortable overall can still have
 * a month in it where nearly everything was missed, and a term with a long
 * holiday in the middle has far fewer classes in that month than the average
 * suggests.
 *
 * Two different things are counted, and they are kept apart on purpose.
 * `working`/`off` come from the **calendar**: they exist as soon as a block has
 * a length and a start, before anybody has marked anything. `held`/`attended`
 * come from the **log**, which only has what has actually been marked since
 * the log existed. Merging them would produce a percentage that mixes a
 * schedule with a record, which is the kind of number nobody can check.
 */
export function monthsOf(item: AttendanceItem): AttendanceMonth[] {
  const months = new Map<string, AttendanceMonth>();
  const at = (key: string, label: string): AttendanceMonth => {
    let row = months.get(key);
    if (!row) {
      row = { key, label, working: 0, off: 0, held: 0, attended: 0 };
      months.set(key, row);
    }
    return row;
  };
  const labelFor = (date: Date) =>
    `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

  for (const day of blockDays(item) ?? []) {
    const key = isoDay(day).slice(0, 7);
    const row = at(key, labelFor(day));
    if (isOffDay(item, day)) row.off += 1;
    else row.working += 1;
  }

  for (const mark of item.log ?? []) {
    const key = mark.date.slice(0, 7);
    const date = new Date(`${mark.date}T00:00:00`);
    const row = at(key, Number.isNaN(date.getTime()) ? key : labelFor(date));
    row.held += 1;
    if (mark.present) row.attended += 1;
  }

  return [...months.values()].sort((a, b) => a.key.localeCompare(b.key));
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Which working day of the rotation today is, 1-based, or null.
 *
 * Null before it starts and after it ends, because "day 31 of 28" is not a
 * thing to put on a card. Clamped rather than extrapolated for the same reason.
 */
export function dayOfRotation(item: AttendanceItem, today: Date = new Date()): number | null {
  const total = workingDays(item);
  if (total === null || !item.startDate) {
    return null;
  }
  const start = new Date(`${item.startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (now < start) {
    return null;
  }
  let working = 0;
  for (let i = 0; i < (item.totalDays ?? 0); i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    // The same off-day rule the total uses. It was a second inline `getDay()
    // === 0` here, which is how the two would have disagreed the moment
    // Saturdays or holidays were added to one of them.
    if (isOffDay(item, day)) {
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
    skipSundays: item.skipSundays === true ? true : undefined,
    /*
       A stored `skipSaturdays: true` is read as "every Saturday".

       It shipped for a few hours as a boolean before the owner pointed out
       that the rule they actually live under is the second Saturday. Anyone
       who had already ticked it meant "Saturdays are off", so that is what it
       keeps meaning; nothing has to be re-entered.
    */
    saturdays: SATURDAY_RULES.some((r) => r.value === item.saturdays)
      ? (item.saturdays as SaturdayRule)
      : item.skipSaturdays === true
        ? 'all'
        : undefined,
    /*
       Filtered to real ISO days rather than trusted.

       This list is the one field a reader types by hand or pastes from
       somewhere, so it is the one that can arrive as anything. A malformed
       entry here would never match a date and so would silently do nothing,
       which is worse than dropping it: the reader would be looking at a
       holiday they entered that is not coming off the count.
    */
    holidays: Array.isArray(item.holidays)
      ? [...new Set(item.holidays.filter((d: unknown) => typeof d === 'string' && ISO_DAY.test(d)))].sort()
      : undefined,
    log: Array.isArray(item.log)
      ? item.log
          .filter(
            (m: unknown): m is AttendanceMark =>
              typeof m === 'object' &&
              m !== null &&
              typeof (m as AttendanceMark).date === 'string' &&
              ISO_DAY.test((m as AttendanceMark).date) &&
              typeof (m as AttendanceMark).present === 'boolean',
          )
          .map((m) => ({ date: m.date, present: m.present }))
      : undefined,
  };
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

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

/** One class happened, and you were there — or you were not. */
export async function markAttendance(id: string, present: boolean): Promise<void> {
  const item = state.items.find(entry => entry.id === id);
  if (!item) {
    return;
  }
  await updateAttendance(id, {
    held: item.held + 1,
    attended: item.attended + (present ? 1 : 0),
    // Dated as well as counted, which is the only way the month view can say
    // anything about a month. The counters stay the truth; this is a record
    // beside them, so an install that predates it keeps working untouched.
    log: [...(item.log ?? []), { date: isoDay(new Date()), present }],
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
    // Undo takes the last mark back off, not "a mark matching this one" —
    // there is exactly one thing the reader just did and this is it.
    log: (item.log ?? []).slice(0, -1),
  });
}

export async function removeAttendance(id: string): Promise<void> {
  await persist(state.items.filter(item => item.id !== id));
}
