import React, { useCallback, useEffect, useState } from 'react';

import { Dialog } from '@/components/Dialog';
import { isPremiumCached } from '@/lib/premium';
import { UnlockCard } from '@/components/UnlockCard';
import {
  confirmDailyAd,
  declineDailyAd,
  subscribeDailyAd,
  type DailyAdPrompt,
} from '@/lib/dailyAd';

/**
 * Port of src/components/DailyAdConsent.tsx — the app asks before playing the
 * once-a-day rewarded ad rather than interrupting without warning.
 *
 * This is one of the few genuine dialogs in the app: it is an either/or the
 * user has to answer, and "Not now" is a real option, not a formality.
 */
export function DailyAdConsent() {
  const [prompt, setPrompt] = useState<DailyAdPrompt | null>(null);
  // Kept so the text does not vanish while the dialog animates out.
  const [shown, setShown] = useState<DailyAdPrompt | null>(null);

  useEffect(() => subscribeDailyAd(setPrompt), []);

  useEffect(() => {
    if (prompt) {
      setShown(prompt);
    }
  }, [prompt]);

  const decline = useCallback(() => {
    const current = prompt;
    setPrompt(null);
    if (current) {
      // Starts a short cooldown so the next theme change does not ask again.
      declineDailyAd(current.reason).catch(() => undefined);
    }
  }, [prompt]);

  const accept = useCallback(() => {
    const current = prompt;
    setPrompt(null);
    if (current) {
      confirmDailyAd(current.reason).catch(() => undefined);
    }
  }, [prompt]);

  return (
    <Dialog
      visible={prompt !== null}
      onDismiss={decline}
      title={shown?.title}
      message={shown?.message}
      footer={
        /*
         * Ad-free is not for sale right now, and this says so rather than
         * hiding.
         *
         * It USED to open Razorpay's checkout from here. Google Play's
         * Payments policy requires Play Billing for digital content consumed
         * inside the app, and removing ads is exactly that — so taking the
         * money through Razorpay put the whole listing at risk of removal, for
         * fifty rupees. The Razorpay SDK, its plan table and every call to it
         * are gone from this app; see `.agents/rules/42-play-billing.md`.
         *
         * The replacement is Google Play Billing, which is written and is
         * deliberately switched off (`PLAY_BILLING_ENABLED = false`) until the
         * products exist in Play Console and a licence tester has bought each
         * of them once. Until then there is nothing to sell, and a button that
         * cannot work is worse than a sentence that explains why.
         *
         * Someone who already paid keeps what they paid for: this is the only
         * thing that changed, and every reader of the entitlement is untouched
         * — which is why `isPremiumCached()` still hides this row.
         */
        isPremiumCached() ? null : <UnlockCard />
      }
      actions={[
        { label: 'Not now', onPress: decline, tone: 'secondary' },
        { label: 'OK', onPress: accept, tone: 'primary' },
      ]}
    />
  );
}

