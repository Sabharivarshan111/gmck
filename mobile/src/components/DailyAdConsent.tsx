import React, { useCallback, useEffect, useState } from 'react';

import { Dialog } from '@/components/Dialog';
import { isPremiumCached, usePremiumStatus } from '@/lib/premium';
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
  const premiumUntil = usePremiumStatus();
  const [prompt, setPrompt] = useState<DailyAdPrompt | null>(null);
  // Kept so the text does not vanish while the dialog animates out.
  const [shown, setShown] = useState<DailyAdPrompt | null>(null);

  useEffect(() => subscribeDailyAd(setPrompt), []);

  useEffect(() => {
    if (prompt) {
      setShown(prompt);
    }
  }, [prompt]);

  useEffect(() => { if (premiumUntil) setPrompt(null); }, [premiumUntil]);

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
      visible={prompt !== null && !premiumUntil}
      onDismiss={decline}
      title={shown?.title}
      message={shown?.message}
      footer={
        // Purchase details stay on the website; active Premium never sees this popup.
        isPremiumCached() ? null : <UnlockCard />
      }
      actions={[
        { label: 'Not now', onPress: decline, tone: 'secondary' },
        { label: 'OK', onPress: accept, tone: 'primary' },
      ]}
    />
  );
}

