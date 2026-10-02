import AsyncStorage from '@react-native-async-storage/async-storage';
import { YEAR_KEYS, type YearKey } from '@/lib/questionBank';
import { kuhsQuestionId, type University } from '@shared/university';

const LEGACY_KEY = 'orbit:last-question-v1';
const keyFor = (university: University) => `orbit:last-question-v2:${university}`;

export interface LastQuestion {
  university: University;
  year: YearKey;
  path: string[];
  title: string;
  question: string;
  type: 'essay' | 'short-notes';
}

function valid(item: LastQuestion): boolean {
  return (item.university === 'tnmgr' || item.university === 'kuhs') &&
    typeof item.title === 'string' &&
    typeof item.question === 'string' &&
    Array.isArray(item.path) &&
    item.path.every(part => typeof part === 'string') &&
    YEAR_KEYS.includes(item.year) &&
    (item.type === 'essay' || item.type === 'short-notes');
}

/** A private device-only pointer, namespaced by university. */
export function rememberQuestion(item: LastQuestion): void {
  AsyncStorage.setItem(keyFor(item.university), JSON.stringify(item)).catch(() => {});
}

export async function readLastQuestion(university: University): Promise<LastQuestion | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(university));
    if (raw) {
      const item = JSON.parse(raw) as LastQuestion;
      return valid(item) && item.university === university ? item : null;
    }

    // One-time compatibility with the old global key. KUHS rows carry a stable
    // KUHS[...] marker, so the legacy pointer can be attributed safely.
    const legacyRaw = await AsyncStorage.getItem(LEGACY_KEY);
    if (!legacyRaw) return null;
    const legacy = JSON.parse(legacyRaw) as Omit<LastQuestion, 'university'>;
    const inferred: University = kuhsQuestionId(legacy.question) ? 'kuhs' : 'tnmgr';
    const migrated: LastQuestion = { ...legacy, university: inferred };
    if (!valid(migrated) || inferred !== university) return null;
    await AsyncStorage.setItem(keyFor(university), JSON.stringify(migrated)).catch(() => {});
    return migrated;
  } catch {
    return null;
  }
}
