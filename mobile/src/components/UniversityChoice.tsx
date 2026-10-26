import React from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Check } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { bankAvailable, KUHS_BANK_READY } from '@/lib/kuhsAvailability';
import { COLLECTED_QUESTION_COUNTS } from '@data/universityPapers/questionBankData';
import { UNIVERSITIES, UNIVERSITY_LABEL, UNIVERSITY_SHORT_LABEL, type University } from '@shared/university';

export function UniversityChoice({ value, onChange }: {
  value: University | null;
  onChange: (next: University) => void;
}) {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  return <ScrollView style={[styles.scroll, { height: Math.min(320, height * 0.4) }]} contentContainerStyle={styles.options}
    nestedScrollEnabled accessibilityRole="radiogroup">
    {UNIVERSITIES.map(option => {
      const active = value === option;
      const unavailable = !bankAvailable(option);
      const count = option !== 'tnmgr' && option !== 'kuhs' ? COLLECTED_QUESTION_COUNTS[option] : null;
      return <Touchable key={option}
        label={`${UNIVERSITY_LABEL[option]}${option === 'kuhs' && !KUHS_BANK_READY ? ', question bank under review' : ''}`}
        role="radio" state={{ checked: active, disabled: unavailable }} disabled={unavailable}
        onPress={() => onChange(option)}
        style={[styles.option, {
          borderColor: active ? colors.accent : colors.border,
          backgroundColor: active ? withAlpha(colors.accent, 0.12) : colors.cardElevated,
          opacity: unavailable ? 0.65 : 1,
        }]}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.text }]}>
            {UNIVERSITY_SHORT_LABEL[option]}
          </Text>
          <Text style={[styles.detail, { color: colors.textMuted }]}>
            {count !== null
              ? (count > 0 ? `${count} questions · more papers being added` : 'Papers collected · question review in progress')
              : option === 'kuhs' && !KUHS_BANK_READY
              ? (unavailable ? 'Questions are being checked against the PDFs' : 'Review preview · coverage and references still being checked')
              : UNIVERSITY_LABEL[option]}
          </Text>
        </View>
        {active ? <Check size={20} color={colors.accent} /> : null}
      </Touchable>;
    })}
  </ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 320 },
  options: { gap: 9 },
  option: { minHeight: 64, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  copy: { flex: 1, gap: 3 },
  title: { ...typeScale.bodyStrong },
  detail: { ...typeScale.caption },
});
