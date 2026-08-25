import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The next exam, and how many days are left of it.
 *
 * A plain store with a listener set rather than a context, for the same reason
 * `settings.ts` is one: two screens read it — My Progress owns it, the Timer
 * displays it — and they are in different tabs, so a provider would have to
 * wrap the whole app to join them.
 */

export interface Exam {
  name: string;
  /** Epoch ms, midnight local on the day of the exam. */
  date: number;
}

const KEY = 'orbit:exam-v1';

let current: Exam | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(listener => listener());

/** Local midnight. Days remaining is a count of days, not of elapsed hours. */
export function startOfDay(at: number): number {
  const date = new Date(at);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Whole days from today to the exam.
 *
 * Both ends are snapped to local midnight first. Subtracting raw timestamps
 * gives 0 for an exam tomorrow morning if it is late tonight, which is the
 * one answer that would matter and be wrong.
 */
export function daysUntil(exam: Exam, now = Date.now()): number {
  return Math.round((startOfDay(exam.date) - startOfDay(now)) / 86400000);
}

export function getExam(): Exam | null {
  return current;
}

export function isHydrated(): boolean {
  return hydrated;
}

export async function hydrateExam(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Exam>;
      if (typeof parsed?.name === 'string' && typeof parsed?.date === 'number') {
        current = { name: parsed.name, date: parsed.date };
      }
    }
  } catch {
    // A corrupt entry is one missing countdown, not a broken launch.
  }
  hydrated = true;
  emit();
}

export function setExam(exam: Exam | null): void {
  current = exam;
  emit();
  AsyncStorage.setItem(KEY, exam ? JSON.stringify(exam) : '').catch(() => {});
  if (!exam) {
    AsyncStorage.removeItem(KEY).catch(() => {});
  }
}

export function subscribeExam(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
