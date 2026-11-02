import { REVIEWED_UNIVERSITY_QUESTIONS } from './reviewedQuestions';
import { collectedQuestionSource } from './questionBankData';
import type { ReviewedUniversityQuestion } from './types';

export type UniversityQuestionTab = 'essay' | 'short-notes' | 'mcq';
// Preserve numbers, negation, units, punctuation within clinical values, and choices.
const normalize = (value: string) => value.normalize('NFKC').toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
export function repetitionKey(row: ReviewedUniversityQuestion): string {
  const mcq = row.questionFormat === 'mcq' && row.options?.length === 4;
  // Booklet choice ordering is presentation; retain every complete choice value.
  const marker = mcq ? `\n(${row.options![0].label}) ` : '';
  const optionStart = marker ? row.question.indexOf(marker) : -1;
  const stem = optionStart >= 0 ? row.question.slice(0, optionStart) : row.question;
  return JSON.stringify([row.university, row.subjectKey,
    mcq ? 'mcq' : 'written', normalize(stem),
    mcq ? row.options!.map(option => normalize(option.text)).sort() : []]);
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
