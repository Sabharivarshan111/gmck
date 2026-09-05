import React, { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Rocket, Sparkles } from 'lucide-react-native';
import { Dialog } from '@/components/Dialog';
import { Text } from '@/components/Text';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { PLAY_MARKET_URL, PLAY_WEB_URL } from '@/lib/appVersion';
import {
  dismissUpdate,
  fetchOwnRelease,
  markVersionSeen,
  updateToOffer,
  upgradedThisLaunch,
  type Release,
} from '@/lib/appUpdate';

/**
 * Two cards, one component, because they are the same card at two moments.
 *
 * "A newer version exists, here is what it fixes" and "you just updated, here
 * is what it fixed" render the same list from the same row. Splitting them
 * would be two components that must agree about how a release is presented,
 * and the second one would be the one that goes stale — it is only seen on the
 * launch after an install.
 *
 * ## Shaped after the ad-consent dialog, and deliberately not carrying an ad
 *
 * The reader knows that card: it is the one that appears, explains itself and
 * offers a way out. That familiarity is the reason to reuse the shape. But the
 * ad prompt earns its offer by being *about* the ad, and this is not — putting
 * a purchase next to "what we fixed" would make the fixes read as the pretext.
 * Nothing is sold here.
 *
 * ## Why only one is ever on screen
 *
 * A launch cannot be both. If this build is newer than the last one that ran,
 * there is nothing newer on Play to offer — this IS the new one. The update
 * check therefore only runs when the what's-new card has nothing to say.
 */

/** Long enough that it is not competing with the app finishing its own launch. */
const SETTLE_MS = 1400;

type Mode = 'update' | 'whatsnew';

export function UpdateNotice() {
  const { colors } = useTheme();
  const [release, setRelease] = useState<Release | null>(null);
  const [mode, setMode] = useState<Mode>('update');

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        // Ordered, not raced: what's new wins, and the update check is not even
        // made when it applies. See the header.
        if (await upgradedThisLaunch()) {
          const own = await fetchOwnRelease();
          if (cancelled) {
            return;
          }
          if (own && own.notes.length > 0) {
            setMode('whatsnew');
            setRelease(own);
            return;
          }
          // A version with no row has nothing to say. Record it anyway, or
          // every launch re-asks and the next real release is announced as if
          // it were this one.
          await markVersionSeen();
          return;
        }
        const offer = await updateToOffer();
        if (!cancelled && offer) {
          setMode('update');
          setRelease(offer);
        }
      })();
    }, SETTLE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const close = useCallback(() => {
    const current = release;
    setRelease(null);
    if (!current) {
      return;
    }
    if (mode === 'whatsnew') {
      void markVersionSeen();
    } else {
      void dismissUpdate(current.versionCode);
    }
  }, [mode, release]);

  const openPlay = useCallback(() => {
    // Closed but deliberately NOT recorded as dismissed: they said yes. If the
    // store visit does not end in an install, the next check should offer it
    // again rather than treat the intention as the update.
    setRelease(null);
    /*
     * `market:` first, https second.
     *
     * `canOpenURL` is not asked. On Android 11+ it answers false for any
     * scheme not declared in `<queries>`, so asking would report the Play app
     * missing on a phone that has it — and the declaration would be a manifest
     * change for a question `openURL`'s own failure already answers.
     */
    Linking.openURL(PLAY_MARKET_URL).catch(() => {
      Linking.openURL(PLAY_WEB_URL).catch(() => {});
    });
  }, []);

  const isUpdate = mode === 'update';

  return (
    <Dialog
      visible={release !== null}
      // A mandatory release still closes. A dialog with no way out is a phone
      // the reader cannot use, and the flag exists to make the update loud, not
      // to hold their app hostage.
      onDismiss={close}
      title={
        isUpdate
          ? `Update available — ${release?.versionName ?? ''}`
          : `What's new in ${release?.versionName ?? 'this update'}`
      }
      message={release?.headline}
      footer={
        release ? (
          <View
            style={[
              styles.notes,
              {
                borderColor: withAlpha(colors.accent, 0.4),
                backgroundColor: withAlpha(colors.accent, 0.08),
              },
            ]}>
            <View style={styles.notesHead}>
              {isUpdate ? (
                <Rocket size={14} color={colors.accent} />
              ) : (
                <Sparkles size={14} color={colors.accent} />
              )}
              <Text style={[styles.notesTitle, { color: colors.accent }]}>
                {isUpdate ? 'What this update fixes' : 'Fixed in this version'}
              </Text>
            </View>
            {release.notes.map((note, i) => (
              <View key={i} style={styles.noteRow}>
                <Text style={[styles.bullet, { color: colors.accent }]}>•</Text>
                <Text style={[styles.noteText, { color: colors.text }]}>{note}</Text>
              </View>
            ))}
          </View>
        ) : null
      }
      actions={
        isUpdate
          ? [
              { label: 'Not now', onPress: close, tone: 'secondary' },
              { label: 'Update', onPress: openPlay, tone: 'primary' },
            ]
          : [{ label: 'Got it', onPress: close, tone: 'primary' }]
      }
    />
  );
}

const styles = StyleSheet.create({
  notes: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  notesHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesTitle: {
    ...typeScale.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  noteRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bullet: {
    ...typeScale.caption,
    lineHeight: 19,
  },
  noteText: {
    ...typeScale.caption,
    lineHeight: 19,
    flex: 1,
  },
});
