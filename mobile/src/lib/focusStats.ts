import AsyncStorage from '@react-native-async-storage/async-storage';

const FOCUS_TOTAL_KEY = 'pomodoro:focus-minutes-total';
export const FOCUS_SESSIONS_KEY = 'pomodoro:completed-sessions-total';
const FOCUS_TODAY_KEY = 'pomodoro:focus-today';

export interface FocusSummary {
  total: number;
  today: number;
  sessions: number;
}

/** Read the same stored totals as the timer, including its local-day rollover. */
export async function readFocusSummary(): Promise<FocusSummary> {
  try {
    const stored = await AsyncStorage.getMany([FOCUS_TOTAL_KEY, FOCUS_TODAY_KEY, FOCUS_SESSIONS_KEY]);
    const today = stored[FOCUS_TODAY_KEY] ? JSON.parse(stored[FOCUS_TODAY_KEY]!) : null;
    const now = new Date();
    const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    return {
      total: Math.max(0, Number(stored[FOCUS_TOTAL_KEY]) || 0),
      today: today?.date === day ? Math.max(0, Number(today.minutes) || 0) : 0,
      sessions: Math.max(0, Number(stored[FOCUS_SESSIONS_KEY]) || 0),
    };
  } catch {
    return { total: 0, today: 0, sessions: 0 };
  }
}

/** Lifetime focused minutes, written by usePomodoro when a focus block ends. */
export async function readFocusMinutes(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(FOCUS_TOTAL_KEY);
    return Number(raw) || 0;
  } catch {
    return 0;
  }
}

/** Identical to formatFocusTime in src/hooks/use-pomodoro-stats.ts. */
export function formatFocusTime(mins: number): string {
  if (mins <= 0) {
    return '0m';
  }
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}
