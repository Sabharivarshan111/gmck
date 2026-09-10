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
  const remaining =
    typeof item.totalDays === 'number' ? Math.max(0, item.totalDays - item.held) : null;
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
  if (typeof item.totalDays !== 'number' || item.totalDays <= 0) {
    return null;
  }
  const remaining = Math.max(0, item.totalDays - item.held);
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
