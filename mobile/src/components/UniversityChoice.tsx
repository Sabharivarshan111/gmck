import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { KUHS_BANK_READY } from '@/lib/kuhsAvailability';
import { UNIVERSITIES, UNIVERSITY_LABEL, type University } from '@shared/university';

export function UniversityChoice({ value, onChange }: {
  value: University | null;
  onChange: (next: University) => void;
}) {
  const { colors } = useTheme();
  return <View style={styles.options} accessibilityRole="radiogroup">
    {UNIVERSITIES.map(option => {
      const active = value === option;
      const unavailable = option === 'kuhs' && !KUHS_BANK_READY;
      return <Touchable key={option}
        label={`${UNIVERSITY_LABEL[option]}${unavailable ? ', question bank under review' : ''}`}
        role="radio" state={{ checked: active, disabled: unavailable }} disabled={unavailable}
        onPress={() => onChange(option)}
        style={[styles.option, {
          borderColor: active ? colors.accent : colors.border,
          backgroundColor: active ? withAlpha(colors.accent, 0.12) : colors.cardElevated,
          opacity: unavailable ? 0.65 : 1,
        }]}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.text }]}>
            {option === 'tnmgr' ? 'Tamil Nadu · TNMGR' : 'Kerala · KUHS'}
          </Text>
          <Text style={[styles.detail, { color: colors.textMuted }]}>
            {unavailable ? 'Questions are being checked against the PDFs' : UNIVERSITY_LABEL[option]}
          </Text>
        </View>
        {active ? <Check size={20} color={colors.accent} /> : null}
      </Touchable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  options: { gap: 9 },
  option: { minHeight: 64, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  copy: { flex: 1, gap: 3 },
  title: { ...typeScale.bodyStrong },
  detail: { ...typeScale.caption },
});
