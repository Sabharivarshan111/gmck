import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The study streak, computed on the phone.
 *
 * It used to come only from `profiles.streak` in Supabase, refreshed by the
 * `register_open` RPC. That RPC needs a session, anonymous sign-in happens
 * inside `saveProfile` and nowhere else, and on a fresh install there is no
 * session at launch — so `cloudProfile` was null, `streak` fell back to `0`,
 * and the streak card showed "0 day streak" for ever no matter how many days
 * running the app was opened. A counter that never counts is worse than no
 * counter: it tells the reader their work did not register.
 *
 * So the device keeps its own, and it is the one that always works. The cloud
 * value still matters — it is what survives a reinstall and what the
 * leaderboard reads — so the two are combined by taking the larger, which is
 * the only merge that cannot lose a day someone earned.
 */

const KEY = 'orbit:streak-v1';

export interface StreakState {
  /** `YYYY-MM-DD` in the phone's own timezone. */
  lastActiveDay: string;
  current: number;
  best: number;
}

const EMPTY: StreakState = { lastActiveDay: '', current: 0, best: 0 };

/**
 * Local calendar day, not UTC.
 *
 * A streak is a human thing: it breaks when *you* miss a day, not when a
 * timezone does. Using an ISO timestamp here would end someone's streak at 5:30
 * in the morning in India and start the new day mid-evening in California.
 */
export function dayKey(at: number = Date.now()): string {
  const date = new Date(at);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function daysBetween(from: string, to: string): number | null {
  const a = Date.parse(`${from}T00:00:00`);
  const b = Date.parse(`${to}T00:00:00`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return null;
  }
  return Math.round((b - a) / 86_400_000);
}

/**
 * Fold today into a streak.
 *
 * Pure, so `check:streak` can walk a year of days without a clock or a device.
 */
export function advance(state: StreakState, today: string): StreakState {
  if (state.lastActiveDay === today) {
    return state;
  }
  const gap = state.lastActiveDay ? daysBetween(state.lastActiveDay, today) : null;
  /*
   * Only a gap of exactly one day continues a streak. A gap of zero was handled
   * above; a negative gap means the phone's clock moved backwards, and the safe
   * reading of that is "same day again" rather than "streak broken" — someone
   * crossing a timezone westward has not stopped studying.
   */
  const current = gap === 1 ? state.current + 1 : gap !== null && gap <= 0 ? state.current : 1;
  return {
    lastActiveDay: today,
    current,
    best: Math.max(state.best, current),
  };
}

export async function loadStreak(): Promise<StreakState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return EMPTY;
    }
    const parsed = JSON.parse(raw) as Partial<StreakState>;
    return {
      lastActiveDay: typeof parsed.lastActiveDay === 'string' ? parsed.lastActiveDay : '',
      current: typeof parsed.current === 'number' && parsed.current >= 0 ? parsed.current : 0,
      best: typeof parsed.best === 'number' && parsed.best >= 0 ? parsed.best : 0,
    };
  } catch {
    return EMPTY;
  }
}

/**
 * What the card should show *right now*, without recording a visit.
 *
 * A stored streak is only true on the day it was written. Opening the app after
 * two days off must show 0, not the number it was when you stopped — reading
 * the stored value straight back is how a broken streak keeps displaying as
 * unbroken until something happens to rewrite it.
 */
export function currentValue(state: StreakState, today: string = dayKey()): number {
  if (!state.lastActiveDay) {
    return 0;
  }
  const gap = daysBetween(state.lastActiveDay, today);
  if (gap === null) {
    return 0;
  }
  return gap <= 1 ? state.current : 0;
}

/** Records today, and returns the streak including it. */
export async function recordToday(now: number = Date.now()): Promise<StreakState> {
  const today = dayKey(now);
  const next = advance(await loadStreak(), today);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Best effort. A streak that fails to persist is a streak that restarts,
    // which is better than a launch that fails.
  }
  return next;
}
