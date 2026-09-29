export type University = 'tnmgr' | 'kuhs';

export const UNIVERSITIES: University[] = ['tnmgr', 'kuhs'];
export const UNIVERSITY_LABEL: Record<University, string> = {
  tnmgr: 'Tamil Nadu Dr. M.G.R. Medical University (TNMGR)',
  kuhs: 'Kerala University of Health Sciences (KUHS)',
};

export function isUniversity(value: unknown): value is University {
  return value === 'tnmgr' || value === 'kuhs';
}
