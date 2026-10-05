import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { CHAT_LANGUAGES, LANGUAGE_LABELS, type ChatLanguage } from '@/lib/chatPresets';
export function ChatLanguagePresets({ selected, onPick, disabled, error }: {
  selected: ChatLanguage; onPick: (language: ChatLanguage) => void; disabled?: boolean; error?: string;
}) {
  const { colors } = useTheme();
  return <View style={styles.wrap}>
    <Text style={[styles.label, { color: colors.textMuted }]}>Answer language</Text>
    <View style={styles.row}>{CHAT_LANGUAGES.map(language => <Touchable
      key={language} label={`Show answer in ${language}`} disabled={disabled}
      state={{ selected: selected === language, disabled: !!disabled }}
      onPress={() => onPick(language)} scale={false}
      style={[styles.chip, { borderColor: selected === language ? colors.fuchsia : colors.border,
        backgroundColor: selected === language ? withAlpha(colors.fuchsia, 0.14) : colors.card }]}>
      <Text style={{ color: selected === language ? colors.fuchsia : colors.text, fontWeight: '600' }}>{LANGUAGE_LABELS[language]}</Text>
    </Touchable>)}</View>
    {error ? <Text accessibilityRole="alert" style={{ color: colors.textMuted }}>{error}</Text> : null}
  </View>;
}
const styles = StyleSheet.create({
  wrap: { gap: 6, marginTop: 8, marginBottom: 8 }, label: { fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1 },
});
