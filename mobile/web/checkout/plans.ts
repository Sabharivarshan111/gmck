/** Mirrors the live checkout catalogue; amounts are paise, never client grants. */
export const CHECKOUT_PLANS = {
  adfree_1m: { amountPaise: 19900, label: '1 month', days: 30 },
  adfree_6m: { amountPaise: 29900, label: '6 months', days: 180 },
  adfree_1y: { amountPaise: 39900, label: '1 year', days: 365 },
  notes_fmspm: { amountPaise: 15000, label: 'FM + SPM notes', days: 0 },
  notes_pharmac: { amountPaise: 15000, label: 'Pharmacology notes', days: 0 },
} as const;
export type PlanCode = keyof typeof CHECKOUT_PLANS;
export const PREMIUM_PLAN_CODES = ['adfree_1m', 'adfree_6m', 'adfree_1y'] as const;
