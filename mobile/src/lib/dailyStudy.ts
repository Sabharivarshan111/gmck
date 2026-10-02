import AsyncStorage from '@react-native-async-storage/async-storage';
import type { YearKey } from './questionBank';
import { supabase } from './supabase';
import { stripKuhsQuestionMarker, type University } from '@shared/university';

export type DailyKind = 'mcq' | 'picture';
export interface DailySourceQuestion {
  subject: string;
  question: string;
}
export interface DailyCard {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  subject: string;
  sourceQuestion: string;
  imageUrl?: string;
  answer?: number;
  revealed?: boolean;
}

export const localStudyDate = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
export const dailyKey = (
  kind: DailyKind,
  university: University,
  year: YearKey,
  date = localStudyDate(),
) => `orbit:daily-study-v2:${university}:${kind}:${year}:${date}`;

function isCard(value: unknown): value is DailyCard {
  const card = value as DailyCard;
  return !!card && typeof card.question === 'string' && card.question.length > 0 &&
    Array.isArray(card.options) && card.options.length === 4 &&
    card.options.every(option => typeof option === 'string' && option.length > 0) &&
    Number.isInteger(card.correctIndex) && card.correctIndex >= 0 && card.correctIndex < 4 &&
    typeof card.explanation === 'string' && typeof card.subject === 'string' &&
    (card.answer === undefined || Number.isInteger(card.answer) && card.answer >= 0 && card.answer < 4) &&
    (card.revealed === undefined || typeof card.revealed === 'boolean');
}

export async function readDailyCard(
  kind: DailyKind,
  university: University,
  year: YearKey,
  date = localStudyDate(),
): Promise<DailyCard | null> {
  try {
    const raw = await AsyncStorage.getItem(dailyKey(kind, university, year, date));
    const value: unknown = raw && JSON.parse(raw);
    return isCard(value) ? value : null;
  } catch { return null; }
}

export async function createDailyCard(
  kind: DailyKind,
  university: University,
  year: YearKey,
  date = localStudyDate(),
  sourceQuestions: DailySourceQuestion[] = [],
): Promise<DailyCard> {
  const cached = await readDailyCard(kind, university, year, date);
  if (cached) return cached;

  const compact = sourceQuestions
    .filter(item => item && typeof item.subject === 'string' && typeof item.question === 'string')
    .slice(0, 60)
    .map(item => ({
      subject: item.subject.slice(0, 120),
      question: stripKuhsQuestionMarker(item.question).slice(0, 1000),
    }));

  const { data, error } = await supabase.functions.invoke('daily-study-card', {
    body: { kind, university, year, date, sourceQuestions: compact },
  });
  if (error) throw new Error((data as { error?: string } | null)?.error ?? 'Could not create today’s question. Please retry.');
  const card: DailyCard = data;
  if (!isCard(card)) throw new Error('The daily question was incomplete. Please retry.');
  await AsyncStorage.setItem(dailyKey(kind, university, year, date), JSON.stringify(card));
  return card;
}

export async function saveDailyAnswer(
  kind: DailyKind,
  university: University,
  year: YearKey,
  card: DailyCard,
  answer?: number,
  date = localStudyDate(),
): Promise<DailyCard> {
  if (card.revealed || card.answer !== undefined) return card;
  const updated = { ...card, revealed: true, ...(answer !== undefined ? { answer } : {}) };
  await AsyncStorage.setItem(dailyKey(kind, university, year, date), JSON.stringify(updated));
  return updated;
}
