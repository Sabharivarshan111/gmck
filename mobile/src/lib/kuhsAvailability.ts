import type { University } from '@shared/university';

/** TXT/app transfer and navigation verified. This flag controls app availability. */
export const KUHS_BANK_READY = true;
/** One availability policy for onboarding, Settings, browse and progress. */
export const KUHS_BANK_AVAILABLE = KUHS_BANK_READY || __DEV__;

export function availableBankUniversity(university: University | null): University {
  return university === 'kuhs' && KUHS_BANK_AVAILABLE ? 'kuhs' : 'tnmgr';
}
