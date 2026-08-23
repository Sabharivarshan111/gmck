import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Dialog } from '@/components/Dialog';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { ADFREE_PRICE_LABEL, buyAdFreeMonth } from '@/lib/razorpay';
import { isPremiumCached } from '@/lib/premium';
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
  const { colors } = useTheme();
  const [prompt, setPrompt] = useState<DailyAdPrompt | null>(null);
  // Kept so the text does not vanish while the dialog animates out.
  const [shown, setShown] = useState<DailyAdPrompt | null>(null);
  const [buying, setBuying] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

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

  /**
   * The offer, in the one place it is actually wanted: next to the ad the user
   * is being asked to watch. Anywhere else it is an interruption; here it is
   * the alternative to the thing on screen.
   *
   * It is not a third dialog action. "Not now" and "OK" answer the question
   * being asked; paying is a different kind of act, and putting it in the same
   * row would make a purchase one mis-tap away from a dismissal.
   */
  const buy = useCallback(async () => {
    if (buying) {
      return;
    }
    setBuying(true);
    setPurchaseError(null);
    const outcome = await buyAdFreeMonth().catch(() => ({
      status: 'failed' as const,
      message: 'Payment could not be started.',
    }));
    setBuying(false);
    if (outcome.status === 'done') {
      // Ads are off from here, so the prompt that triggered this is moot.
      setPrompt(null);
      return;
    }
    if (outcome.status === 'failed') {
      setPurchaseError(outcome.message);
    }
    // A cancellation says nothing: the user closed the sheet on purpose.
  }, [buying]);

  return (
    <Dialog
      visible={prompt !== null}
      onDismiss={decline}
      title={shown?.title}
      message={shown?.message}
      footer={
        isPremiumCached() ? null : (
          <View>
            <Touchable
              onPress={buy}
              label={`Remove ads for a month for ${ADFREE_PRICE_LABEL}`}
              disabled={buying}
              scaleTo={0.97}
              style={[
                styles.offer,
                { borderColor: withAlpha(colors.accent, 0.5), backgroundColor: withAlpha(colors.accent, 0.1) },
              ]}>
              {buying ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={[styles.offerText, { color: colors.accent }]}>
                  Or remove ads for a month — {ADFREE_PRICE_LABEL}
                </Text>
              )}
            </Touchable>
            {purchaseError ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.offerError, { color: colors.danger }]}>
                {purchaseError}
              </Text>
            ) : null}
          </View>
        )
      }
      actions={[
        { label: 'Not now', onPress: decline, tone: 'secondary' },
        { label: 'OK', onPress: accept, tone: 'primary' },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  offer: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  offerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  offerError: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
});
