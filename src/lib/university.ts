export type University = 'tnmgr' | 'kuhs';

export const UNIVERSITIES: University[] = ['tnmgr', 'kuhs'];
export const UNIVERSITY_LABEL: Record<University, string> = {
  tnmgr: 'Tamil Nadu Dr. M.G.R. Medical University (TNMGR)',
  kuhs: 'Kerala University of Health Sciences (KUHS)',
};

export function isUniversity(value: unknown): value is University {
  return value === 'tnmgr' || value === 'kuhs';
}

/** Internal prefix on offline KUHS rows; never displayed or sent to the notes AI. */
const KUHS_QUESTION_MARKER = /^KUHS\[(kuhs-[a-z0-9-]+)\]\s/;

export function kuhsQuestionId(question: string): string | null {
  return question.match(KUHS_QUESTION_MARKER)?.[1] ?? null;
}

export function stripKuhsQuestionMarker(question: string): string {
  return question.replace(KUHS_QUESTION_MARKER, '');
}
