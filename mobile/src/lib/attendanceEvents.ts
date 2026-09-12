import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Dated things you are counting down to: an exam, a posting exam, a seminar.
 *
 * ## Why these are not attendance items
 *
 * An attendance item is a tally — classes held, classes attended, a percentage
 * that decides whether you sit the paper. These have no tally at all. They are
 * a name and a date, and the only question they answer is "how long have I
 * got". Putting them in the same list would give every one of them a Present
 * and Absent button that means nothing.
 *
 * They live in the Attendance tab anyway, because that is where a student
 * already goes to ask a question about their timetable.
 *
 * ## It never leaves the phone
 *
 * A seminar date is a record of somebody's week. Same rule as the attendance
 * tally, their notes and the focus log: AsyncStorage only, no row, no bucket,
 * no account. `npm run check:cloud-ids` holds this file to it.
 *
 * That is also why these do NOT go into the `exam` store. That one syncs with
 * the web app through `exam_targets`, and a locally-typed seminar has no
 * business being written to a server.
 *
 * ## How they reach the evening reminder
 *
 * `reminderSync` takes the SOONEST of the synced exam and these, and puts its
 * name and date into the digest's existing exam slot. The receiver already
 * says "three days to X", so a seminar reads correctly through it and no
 * Android code had to change — which matters, because Kotlin cannot be run in
 * these sandboxes and an untested receiver change is one nobody would see fail
 * until an evening that stayed silent.
 */

export type AttendanceEventKind = 'exam' | 'posting-exam' | 'seminar';

export interface AttendanceEvent {
  id: string;
  /** What the reader typed. Read out loud by the reminder, so it is theirs. */
  title: string;
  kind: AttendanceEventKind;
  /** ISO `yyyy-mm-dd`, local. */
  date: string;
}

export const EVENT_KINDS: { key: AttendanceEventKind; label: string }[] = [
  { key: 'exam', label: 'Exam' },
  { key: 'posting-exam', label: 'Posting exam' },
  { key: 'seminar', label: 'Seminar' },
];

export const kindLabel = (kind: AttendanceEventKind): string =>
  EVENT_KINDS.find(entry => entry.key === kind)?.label ?? 'Exam';

const KEY = 'orbit:attendance-events-v1';

let events: AttendanceEvent[] = [];
let hydrated = false;
let version = 0;
const listeners = new Set<() => void>();

const emit = () => {
  version += 1;
  listeners.forEach(listener => listener());
};

export const subscribeAttendanceEvents = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const attendanceEventsVersion = (): number => version;
export const getAttendanceEvents = (): AttendanceEvent[] => events;
export const attendanceEventsHydrated = (): boolean => hydrated;

/** Local midnight for an ISO date, or null when it does not parse. */
export function eventDate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return null;
  }
  const day = new Date(`${iso}T00:00:00`);
  return Number.isNaN(day.getTime()) ? null : day;
}

/**
 * Whole days from today to the event, or null.
 *
 * Both ends snapped to local midnight, for the reason the exam store gives:
 * subtracting raw timestamps says 0 for something tomorrow morning if it is
 * late tonight, which is the one answer that would matter and be wrong.
 */
export function daysToEvent(event: AttendanceEvent, now = Date.now()): number | null {
  const when = eventDate(event.date);
  if (!when) {
    return null;
  }
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.round((when.getTime() - today.getTime()) / 86400000);
}

/**
 * The next event that has not happened yet, or null.
 *
 * Today counts as still ahead: a seminar at four o'clock is not past at
 * breakfast, and the reminder that says "your seminar is today" is the most
 * useful one this feature can send.
 */
export function nextEvent(list = events, now = Date.now()): AttendanceEvent | null {
  let best: AttendanceEvent | null = null;
  let bestDays = Number.POSITIVE_INFINITY;
  for (const event of list) {
    const days = daysToEvent(event, now);
    if (days === null || days < 0) {
      continue;
    }
    if (days < bestDays) {
      best = event;
      bestDays = days;
    }
  }
  return best;
}

function sane(raw: unknown): AttendanceEvent | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const value = raw as Record<string, unknown>;
  if (typeof value.id !== 'string' || typeof value.title !== 'string') {
    return null;
  }
  if (typeof value.date !== 'string' || !eventDate(value.date)) {
    return null;
  }
  const kind = EVENT_KINDS.some(entry => entry.key === value.kind)
    ? (value.kind as AttendanceEventKind)
    : 'exam';
  return { id: value.id, title: value.title, kind, date: value.date };
}

export async function hydrateAttendanceEvents(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    events = Array.isArray(parsed)
      ? parsed.map(sane).filter((entry): entry is AttendanceEvent => entry !== null)
      : [];
  } catch {
    events = [];
  }
  hydrated = true;
  emit();
}

async function persist(next: AttendanceEvent[]): Promise<void> {
  // Sorted on the way in, so every reader gets them in date order without
  // sorting again — and so the list on screen matches the one the reminder
  // reads.
  events = [...next].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  emit();
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(events));
  } catch {
    // The in-memory list still applies for this session.
  }
}

export async function addAttendanceEvent(
  input: Omit<AttendanceEvent, 'id'>,
): Promise<void> {
  await persist([
    ...events,
    { ...input, id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` },
  ]);
}

export async function removeAttendanceEvent(id: string): Promise<void> {
  await persist(events.filter(event => event.id !== id));
}
