export type University = 'tnmgr' | 'kuhs' | 'rguhs' | 'knruhs' | 'muhs' | 'ntruhs' | 'wbuhs' | 'other';

export const UNIVERSITIES: University[] = ['tnmgr', 'kuhs', 'rguhs', 'knruhs', 'muhs', 'ntruhs', 'wbuhs', 'other'];
export const UNIVERSITY_LABEL: Record<University, string> = {
  other: 'Other university',
  tnmgr: 'Tamil Nadu Dr. M.G.R. Medical University (TNMGR)',
  kuhs: 'Kerala University of Health Sciences (KUHS)',
  rguhs: 'Rajiv Gandhi University of Health Sciences (RGUHS)',
  knruhs: 'Kaloji Narayana Rao University of Health Sciences (KNRUHS)',
  muhs: 'Maharashtra University of Health Sciences (MUHS)',
  ntruhs: 'Dr. NTR University of Health Sciences (NTRUHS)',
  wbuhs: 'West Bengal University of Health Sciences (WBUHS)',
};

export const UNIVERSITY_SHORT_LABEL: Record<University, string> = {
  other: 'Other university',
  tnmgr: 'Tamil Nadu · TNMGR', kuhs: 'Kerala · KUHS', rguhs: 'Karnataka · RGUHS',
  knruhs: 'Telangana · KNRUHS', muhs: 'Maharashtra · MUHS', ntruhs: 'Andhra Pradesh · NTRUHS',
  wbuhs: 'West Bengal · WBUHS',
};

export function isUniversity(value: unknown): value is University {
  return typeof value === 'string' && UNIVERSITIES.includes(value as University);
}

/** Internal prefix on offline KUHS rows; never displayed or sent to the notes AI. */
const KUHS_QUESTION_MARKER = /^KUHS\[(kuhs-[a-z0-9-]+)\]\s/;

export function kuhsQuestionId(question: string): string | null {
  return question.match(KUHS_QUESTION_MARKER)?.[1] ?? null;
}

export function stripKuhsQuestionMarker(question: string): string {
  return question.replace(KUHS_QUESTION_MARKER, '').replace(/^PYQ\[(?:rguhs|knruhs|muhs|ntruhs|wbuhs)-[a-z0-9-]+\]\s/, '');
}

export function collectedQuestionId(question: string): string | null {
  return question.match(/^PYQ\[((?:rguhs|knruhs|muhs|ntruhs|wbuhs)-[a-z0-9-]+)\]\s/)?.[1] ?? null;
}
