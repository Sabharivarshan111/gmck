import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Download, Rocket, Sparkles } from 'lucide-react-native';
import { Dialog } from '@/components/Dialog';
import { Text } from '@/components/Text';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import {
  completeUpdate,
  dismissUpdate,
  markVersionSeen,
  ownNotes,
  playStatus,
  startUpdate,
  updateToOffer,
  upgradedThisLaunch,
  type ReleaseNotes,
  type UpdateOffer,
} from '@/lib/appUpdate';

/**
 * Three cards, one component, because they are one card at three moments.
 *
 * "A newer version exists", "it has finished downloading, restart to install",
 * and "you just updated, here is what it fixed" all render the same list from
 * the same row. Splitting them would be three components that must agree about
 * how a release is presented, and the last would be the one that went stale —
 * it is only seen on the launch after an install.
 *
 * ## Shaped after the ad-consent dialog, and carrying no ad
 *
 * The reader knows that card: it appears, explains itself, and offers a way
 * out. That familiarity is the reason to reuse the shape. But the ad prompt
 * earns its offer by being *about* the ad, and this is not — a purchase next to
 * "what we fixed" makes the fixes read as the pretext. `check:version` fails
 * the build if this file ever imports anything ad- or payment-related.
 *
 * ## Why only one is ever on screen
 *
 * A launch cannot be both an upgrade and behind one: if this build is newer
 * than the last that ran, it IS the new one. So the Play check is not even made
 * when the what's-new card has something to say.
 *
 * ## What is absent, and why that is correct
 *
 * Play reports no update for a build it did not install — every APK from CI,
 * every debug build, and the preview harness, where the module is absent
 * entirely. None of these cards can be driven by `check:smoke`. That is the
 * same position the sound module is in, and the first real proof is an
 * internally-shared build on a phone.
 */

/** Long enough not to compete with the app finishing its own launch. */
const SETTLE_MS = 1400;

/** While a download is in flight. Play reports bytes; this reads them. */
const POLL_MS = 2500;

type Mode = 'update' | 'ready' | 'whatsnew';

export function UpdateNotice() {
  const { colors } = useTheme();
  const [mode, setMode] = useState<Mode>('update');
  const [offer, setOffer] = useState<UpdateOffer | null>(null);
  const [own, setOwn] = useState<ReleaseNotes | null>(null);
  const [visible, setVisible] = useState(false);
  const polling = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (polling.current) {
      clearInterval(polling.current);
      polling.current = null;
    }
  }, []);

  /**
   * Watch a flexible download to its end.
   *
   * Polled rather than pushed. An event emitter is a second mechanism to get
   * right — codegen, subscription lifetime, the New Architecture's own emitter
   * plumbing — for a value read by one card; see UpdateModule.kt.
   */
  const watchDownload = useCallback(() => {
    stopPolling();
    polling.current = setInterval(() => {
      void (async () => {
        const status = await playStatus();
        if (!status) {
          stopPolling();
          return;
        }
        if (status.installStatus === 'downloaded') {
          stopPolling();
          setMode('ready');
          setVisible(true);
        } else if (status.installStatus === 'failed' || status.installStatus === 'canceled') {
          stopPolling();
        }
      })();
    }, POLL_MS);
  }, [stopPolling]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        // Ordered, not raced: what's new wins, and Play is not even asked when
        // it applies. See the header.
        if (await upgradedThisLaunch()) {
          const notes = await ownNotes();
          if (cancelled) {
            return;
          }
          if (notes && notes.notes.length > 0) {
            setOwn(notes);
            setMode('whatsnew');
            setVisible(true);
            return;
          }
          // A version with no row has nothing to say. Record it anyway, or
          // every launch re-asks and the next real release is announced as if
          // it were this one.
          await markVersionSeen();
          return;
        }

        /*
         * A download that finished while the app was closed.
         *
         * Play holds it, and nothing installs it until `completeUpdate` is
         * called — so without this the reader downloads an update once and is
         * never asked to install it again.
         */
        const status = await playStatus();
        if (cancelled) {
          return;
        }
        if (status?.installStatus === 'downloaded') {
          setMode('ready');
          setVisible(true);
          return;
        }

        const next = await updateToOffer();
        if (!cancelled && next) {
          setOffer(next);
          setMode('update');
          setVisible(true);
        }
      })();
    }, SETTLE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      stopPolling();
    };
  }, [stopPolling]);

  const close = useCallback(() => {
    setVisible(false);
    if (mode === 'whatsnew') {
      void markVersionSeen();
    } else if (mode === 'update' && offer) {
      void dismissUpdate(offer.status.versionCode);
    }
    // 'ready' is deliberately not dismissed: the bytes are already on the
    // phone, and asking again next launch costs nothing.
  }, [mode, offer]);

  const accept = useCallback(() => {
    setVisible(false);
    void (async () => {
      const outcome = await startUpdate(offer?.urgent ?? false);
      // Play's own sheet has just been answered. Accepted means the download
      // has begun; everything else is the reader's decision and says nothing.
      if (outcome === 'accepted') {
        watchDownload();
      }
    })();
  }, [offer, watchDownload]);

  const install = useCallback(() => {
    setVisible(false);
    // Restarts the app.
    completeUpdate();
  }, []);

  const release = mode === 'whatsnew' ? own : offer?.notes ?? null;
  const heading =
    mode === 'whatsnew'
      ? `What's new in ${own?.versionName ?? 'this update'}`
      : mode === 'ready'
      ? 'Update ready to install'
      : `Update available${release ? ` — ${release.versionName}` : ''}`;
  const message =
    mode === 'ready'
      ? 'Orbit has downloaded it. Installing takes a few seconds and restarts the app.'
      : release?.headline ??
        (mode === 'update' ? 'A newer version of Orbit is on the Play Store.' : undefined);

  return (
    <Dialog
      visible={visible}
      // Even an urgent release closes. A dialog with no way out is a phone the
      // reader cannot use, and priority exists to make an update loud rather
      // than to hold their question bank hostage.
      onDismiss={close}
      title={heading}
      message={message}
      footer={
        release && release.notes.length > 0 && mode !== 'ready' ? (
          <View
            style={[
              styles.notes,
              {
                borderColor: withAlpha(colors.accent, 0.4),
                backgroundColor: withAlpha(colors.accent, 0.08),
              },
            ]}>
            <View style={styles.notesHead}>
              {mode === 'whatsnew' ? (
                <Sparkles size={14} color={colors.accent} />
              ) : (
                <Rocket size={14} color={colors.accent} />
              )}
              <Text style={[styles.notesTitle, { color: colors.accent }]}>
                {mode === 'whatsnew' ? 'Fixed in this version' : 'What this update fixes'}
              </Text>
            </View>
            {release.notes.map((note, i) => (
              <View key={i} style={styles.noteRow}>
                <Text style={[styles.bullet, { color: colors.accent }]}>•</Text>
                <Text style={[styles.noteText, { color: colors.text }]}>{note}</Text>
              </View>
            ))}
          </View>
        ) : mode === 'ready' ? (
          <View style={styles.readyRow}>
            <Download size={14} color={colors.textMuted} />
            <Text style={[styles.noteText, { color: colors.textMuted }]}>
              Nothing you have written is lost — Orbit saves as you go.
            </Text>
          </View>
        ) : null
      }
      actions={
        mode === 'whatsnew'
          ? [{ label: 'Got it', onPress: close, tone: 'primary' }]
          : mode === 'ready'
          ? [
              { label: 'Later', onPress: close, tone: 'secondary' },
              { label: 'Install now', onPress: install, tone: 'primary' },
            ]
          : [
              { label: 'Not now', onPress: close, tone: 'secondary' },
              { label: 'Update', onPress: accept, tone: 'primary' },
            ]
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
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
