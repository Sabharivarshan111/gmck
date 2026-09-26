import AsyncStorage from '@react-native-async-storage/async-storage';
import { YEAR_KEYS, type YearKey } from '@/lib/questionBank';

const KEY = 'orbit:last-question-v1';

export interface LastQuestion {
  year: YearKey;
  path: string[];
  title: string;
  question: string;
  type: 'essay' | 'short-notes';
}

/** A private device-only pointer, written only when a question is interacted with. */
export function rememberQuestion(item: LastQuestion): void {
  AsyncStorage.setItem(KEY, JSON.stringify(item)).catch(() => {});
}

export async function readLastQuestion(): Promise<LastQuestion | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const item = JSON.parse(raw) as LastQuestion;
    return typeof item.title === 'string' && typeof item.question === 'string' &&
      Array.isArray(item.path) && item.path.every(part => typeof part === 'string') &&
      YEAR_KEYS.includes(item.year) &&
      (item.type === 'essay' || item.type === 'short-notes') ? item : null;
  } catch {
    return null;
  }
}
