import { VERIFIED_KUHS_QUESTIONS } from '@data/kuhs/verifiedQuestions';
import { kuhsQuestionId } from '@shared/university';

// One lookup per row; preserve the original question string and progress key.
const sources = new Map(VERIFIED_KUHS_QUESTIONS.map(row => [row.id, row]));

export function kuhsQuestionSource(question: string) {
  const id = kuhsQuestionId(question);
  return id ? sources.get(id) : undefined;
}

/** Distinct recorded sittings/years; a bare KU tag does not give an exam count. */
export function kuhsRecordedExamCount(refs: readonly string[]): number {
  return new Set(refs.map(ref => ref.toLowerCase()
    .replace(/\bku\b/g, '')
    .replace(/\bjuly\b/g, 'jul')
    .replace(/\s+/g, '')
    .replace(/^ku(?=\d)/, ''))
    .filter(Boolean)).size;
}
