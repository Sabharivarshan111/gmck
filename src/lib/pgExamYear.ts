import type {OfflineMcq} from './neetPgOffline';

/** Dates are source-labelled recalls, never inferred from an ID or MBBS year. */
export function pgExamYearLabel(question: Pick<OfflineMcq, 'examYear' | 'examSession'>, exam: string): string {
  if (!Number.isInteger(question.examYear)) return `${exam} · Year unavailable`;
  return `${exam} ${question.examYear}${question.examSession ? ` · ${question.examSession}` : ''} · Recall`;
}
