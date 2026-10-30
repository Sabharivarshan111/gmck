import type { University } from '@shared/university';
import { COLLECTED_QUESTION_COUNTS } from '@data/universityPapers/questionBankData';

/** TXT/app transfer and navigation verified. This flag controls app availability. */
export const KUHS_BANK_READY = true;
/** One availability policy for onboarding, Settings, browse and progress. */
export const KUHS_BANK_AVAILABLE = KUHS_BANK_READY || __DEV__;

export function availableBankUniversity(university: University | null): University {
  if (university === 'kuhs') return KUHS_BANK_AVAILABLE ? 'kuhs' : 'tnmgr';
  return university && bankAvailable(university) ? university : 'tnmgr';
}

export function bankAvailable(university: University): boolean {
  if (university === 'tnmgr' || university === 'other') return true;
  if (university === 'kuhs') return KUHS_BANK_AVAILABLE;
  return COLLECTED_QUESTION_COUNTS[university] > 0;
}
