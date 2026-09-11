import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ExternalLink, Lock } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { LINK_OUT, openUnlock } from '@/lib/unlock';

/**
 * Where ad-free is bought, said once.
 *
 * It lives in its own file rather than inline in the ad prompt for two
 * reasons, and the second is the one that mattered:
 *
 * 1. It is the only place in the app that talks about paying, so it is the
 *    only place that has to be read carefully when the policy around paying
 *    changes — which it has, twice, in a month.
 * 2. **It could not be photographed inline.** `requestDailyAd` returns early
 *    whenever ads are off, and they are off in every build that is not the
 *    signed release, so the card was unreachable in the preview harness. The
 *    only way to see it was to flip `ADS_ENABLED`, which is a real gate and
 *    not a screenshot switch. A component can be rendered on its own.
 *
 * It prices nothing. Whatever the unlock page charges is the page's to say, in
 * the reader's currency and after tax; a number compiled into an APK is a
 * number that goes stale in a build nobody can update.
 */
export function UnlockCard() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          borderColor: withAlpha(colors.accent, 0.4),
          backgroundColor: withAlpha(colors.accent, 0.08),
        },
      ]}>
      <Lock size={14} color={colors.accent} />
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]}>Ad-free is on the website</Text>
        <Text style={[styles.note, { color: colors.textMuted }]}>
          {LINK_OUT
            ? 'Unlock it there, then sign in here with the same Google account and the ads stop.'
            : 'Unlock it at mbbsqbank-questor.lovable.app, then sign in here with the same Google account and the ads stop.'}
        </Text>
        {LINK_OUT ? (
          <Touchable
            onPress={openUnlock}
            label="Open the unlock page in your browser"
            hitSlop={8}
            style={styles.row}>
            <Text style={[styles.link, { color: colors.accent }]}>Open the unlock page</Text>
            <ExternalLink size={13} color={colors.accent} />
          </Touchable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '700' },
  note: { fontSize: 12, lineHeight: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 6 },
  link: { fontSize: 13, fontWeight: '700' },
});
