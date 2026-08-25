import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

/**
 * The next exam, and how many days are left of it.
 *
 * A plain store with a listener set rather than a context, for the same reason
 * `settings.ts` is one: two screens read it — My Progress owns it, the Timer
 * displays it — and they are in different tabs, so a provider would have to
 * wrap the whole app to join them.
 *
 * **The cloud copy wins when there is one.** The web app keeps this in
 * `exam_targets`, one row per (user, year), with the name in `label`. A phone
 * holding its own date would give one user two exam countdowns — the same
 * split the shared storage keys exist to prevent. Local is the offline and
 * not-yet-signed-in path, and the mirror the cloud row is written back into.
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

/**
 * Pull the row the browser would show, and adopt it.
 *
 * Called after hydrate rather than instead of it: the local copy paints
 * immediately and the cloud one replaces it a moment later, so a countdown
 * does not blink in from empty on every launch.
 */
export async function pullExam(year: string): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      return;
    }
    // supabase-js returns errors rather than throwing them, so they have to be
    // read off the result — a try/catch here would never see one.
    const { data, error } = await supabase
      .from('exam_targets')
      .select('exam_date, label')
      .eq('user_id', userId)
      .eq('year', year)
      .is('subject', null)
      .maybeSingle();
    if (error || !data?.exam_date) {
      return;
    }
    // A DATE column, so it is a day. Parsed at local midnight rather than as
    // UTC, or an exam is off by one either side of the date line.
    current = {
      name: (data.label as string) ?? 'Exam',
      date: startOfDay(new Date(`${data.exam_date}T00:00:00`).getTime()),
    };
    emit();
    AsyncStorage.setItem(KEY, JSON.stringify(current)).catch(() => {});
  } catch {
    // Offline. The local copy is already on screen.
  }
}

/** Push to `exam_targets`, matching the row the web app reads. */
async function pushExam(exam: Exam | null, year: string): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      return;
    }
    if (!exam) {
      await supabase
        .from('exam_targets')
        .delete()
        .eq('user_id', userId)
        .eq('year', year)
        .is('subject', null);
      return;
    }
    const payload = {
      user_id: userId,
      year,
      subject: null,
      exam_date: new Date(exam.date).toISOString().slice(0, 10),
      label: exam.name,
    };
    // The unique index is on (user_id, year, coalesce(subject,'')), which
    // onConflict cannot name, so this reads then writes like the web app does.
    const { data: existing } = await supabase
      .from('exam_targets')
      .select('id')
      .eq('user_id', userId)
      .eq('year', year)
      .is('subject', null)
      .maybeSingle();
    if (existing?.id) {
      await supabase.from('exam_targets').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('exam_targets').insert(payload);
    }
  } catch {
    // Saved locally already; the cloud copy catches up next time.
  }
}

export function setExam(exam: Exam | null, year?: string): void {
  current = exam;
  emit();
  AsyncStorage.setItem(KEY, exam ? JSON.stringify(exam) : '').catch(() => {});
  if (!exam) {
    AsyncStorage.removeItem(KEY).catch(() => {});
  }
  if (year) {
    pushExam(exam, year).catch(() => {});
  }
}

export function subscribeExam(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
