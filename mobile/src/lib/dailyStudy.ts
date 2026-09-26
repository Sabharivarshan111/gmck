import AsyncStorage from '@react-native-async-storage/async-storage';
import type { YearKey } from './questionBank';
import { supabase } from './supabase';

export type DailyKind = 'mcq' | 'picture';
export interface DailyCard {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  subject: string;
  sourceQuestion: string;
  imageUrl?: string;
  answer?: number;
}

export const localStudyDate = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
export const dailyKey = (kind: DailyKind, year: YearKey, date = localStudyDate()) =>
  `orbit:daily-study-v1:${kind}:${year}:${date}`;

function isCard(value: unknown): value is DailyCard {
  const card = value as DailyCard;
  return !!card && typeof card.question === 'string' && card.question.length > 0 &&
    Array.isArray(card.options) && card.options.length === 4 &&
    card.options.every(option => typeof option === 'string' && option.length > 0) &&
    Number.isInteger(card.correctIndex) && card.correctIndex >= 0 && card.correctIndex < 4 &&
    typeof card.explanation === 'string' && typeof card.subject === 'string' &&
    (card.answer === undefined || Number.isInteger(card.answer) && card.answer >= 0 && card.answer < 4);
}

export async function readDailyCard(kind: DailyKind, year: YearKey, date = localStudyDate()): Promise<DailyCard | null> {
  try {
    const raw = await AsyncStorage.getItem(dailyKey(kind, year, date));
    const value: unknown = raw && JSON.parse(raw);
    return isCard(value) ? value : null;
  } catch { return null; }
}

export async function createDailyCard(kind: DailyKind, year: YearKey, date = localStudyDate()): Promise<DailyCard> {
  const cached = await readDailyCard(kind, year, date);
  if (cached) return cached;
  const { data, error } = await supabase.functions.invoke('daily-study-card', {
    body: { kind, year, date },
  });
  if (error) throw new Error((data as { error?: string } | null)?.error ?? 'Could not create today’s question. Please retry.');
  const card: DailyCard = data;
  if (!isCard(card)) throw new Error('The daily question was incomplete. Please retry.');
  await AsyncStorage.setItem(dailyKey(kind, year, date), JSON.stringify(card));
  return card;
}

export async function saveDailyAnswer(kind: DailyKind, year: YearKey, card: DailyCard, answer: number, date = localStudyDate()): Promise<DailyCard> {
  if (card.answer !== undefined) return card;
  const updated = { ...card, answer };
  await AsyncStorage.setItem(dailyKey(kind, year, date), JSON.stringify(updated));
  return updated;
}
