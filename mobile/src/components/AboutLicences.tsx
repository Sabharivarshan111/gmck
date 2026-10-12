import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { THIRD_PARTY_LICENCES } from '@/lib/thirdPartyLicences';
import { useTheme } from '@/theme';
import { radius, space } from '@/theme/tokens';
import { typeScale } from '@/theme/typography';

export function AboutLicences() {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  return <View>
    <Text style={[styles.heading, { color: colors.textMuted }]}>ABOUT</Text>
    <Touchable label="Third-party licences" state={{ expanded }} onPress={() => setExpanded(value => !value)} style={[styles.button, { borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Third-party licences</Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>Question-bank credits and open-source notices · {expanded ? 'Hide' : 'Show'}</Text>
    </Touchable>
    {expanded ? THIRD_PARTY_LICENCES.map(entry => <View key={entry.name} style={[styles.notice, { borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{entry.name}</Text>
      <Text selectable style={[styles.body, { color: colors.textMuted }]}>{entry.source}</Text>
      <Text selectable style={[styles.body, { color: colors.text }]}>{entry.licence}</Text>
    </View>) : null}
  </View>;
}

const styles = StyleSheet.create({
  heading: { ...typeScale.overline, marginTop: space.lg, marginBottom: space.sm },
  button: { minHeight: 44, padding: space.md, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, gap: space.xs },
  title: { ...typeScale.bodyStrong },
  body: { ...typeScale.caption },
  notice: { padding: space.md, marginTop: space.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, gap: space.sm },
});
