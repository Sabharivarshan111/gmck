import { REVIEWED_UNIVERSITY_QUESTIONS } from './reviewedQuestions';
import { collectedQuestionSource } from './questionBankData';
import type { ReviewedUniversityQuestion } from './types';

export type UniversityQuestionTab = 'essay' | 'short-notes' | 'mcq';
// Preserve numbers, negation, units, punctuation within clinical values, and choices.
const normalize = (value: string) => value.normalize('NFKC').toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
export function repetitionKey(row: ReviewedUniversityQuestion): string {
  return JSON.stringify([row.university, row.subjectKey,
    row.questionFormat === 'mcq' ? 'mcq' : 'written', normalize(row.question),
    row.options?.map(option => [normalize(option.label), normalize(option.text)]) ?? []]);
}
export function indexExamAppearances(rows: readonly ReviewedUniversityQuestion[]) {
  const index = new Map<string, Set<string>>();
  for (const row of rows) {
    const key = repetitionKey(row);
    const exams = index.get(key) ?? new Set<string>();
    for (const ref of row.examRefs) exams.add(normalize(ref));
    index.set(key, exams);
  }
  return index;
}
const APPEARANCES = indexExamAppearances(REVIEWED_UNIVERSITY_QUESTIONS);
export function collectedRecordedExamCount(question: string): number {
  const row = collectedQuestionSource(question);
  return row ? APPEARANCES.get(repetitionKey(row))?.size ?? 0 : 0;
}
export function isUniversityMcq(question: string): boolean {
  return collectedQuestionSource(question)?.questionFormat === 'mcq';
}
/** Presentation only: keep raw strings and legacy progress/search buckets intact. */
export function partitionUniversityQuestions(essays: string[], shorts: string[]) {
  const result: Record<UniversityQuestionTab, string[]> = { essay: [], 'short-notes': [], mcq: [] };
  for (const question of essays) result[isUniversityMcq(question) ? 'mcq' : 'essay'].push(question);
  for (const question of shorts) result[isUniversityMcq(question) ? 'mcq' : 'short-notes'].push(question);
  return result;
}
