import { labDisplayText } from '@/lib/labDisplayText';
/**
 * Normal laboratory values, as a full-screen reference.
 *
 * Opened from the button above the search in the case-sheet picker, beside the
 * general examination, because those are the two things a student needs WHILE
 * clerking rather than after it. Every proforma ends in investigations and
 * every one of them assumes the reader knows what normal is.
 *
 * Two things here are deliberate:
 *
 * - **It searches across every group at once.** A student looking up "sodium"
 *   does not know or care that it lives under "Renal and electrolytes", and a
 *   reference that makes you pick the right chapter first is a reference you
 *   stop opening.
 *
 * - **The disclaimer is on the screen, not only in the source.** Reference
 *   intervals differ between laboratories, and the ranges printed on the
 *   patient's own report are the ones that count. Saying that in a code comment
 *   protects nobody.
 *
 * It is a `<Modal>`, so it is a window OUTSIDE the navigator's SafeAreaView and
 * nothing insets it — hence the explicit `insets.top`. That is the rule in
 * `.agents/rules/` that `check:edges` exists for, and the drawing canvas
 * shipped once with its Keep button under the system clock for want of it.
 */
import React, { useMemo, useState } from 'react';
import { Linking, Modal, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, ArrowLeft, Search, X } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { useTheme, withAlpha } from '@/theme';
import { LAB_VALUES, type LabValue } from '@/lib/labValues';

export interface LabValuesSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function LabValuesSheet({ visible, onClose }: LabValuesSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return LAB_VALUES.map(s => ({ group: s.group, values: s.values }));
    }
    const matches = (v: LabValue) =>
      v.name.toLowerCase().includes(q) ||
      (v.aliases ?? []).some(alias => alias.toLowerCase().includes(q)) ||
      v.conventional.toLowerCase().includes(q) ||
      (v.si ?? '').toLowerCase().includes(q) ||
      (v.note ?? '').toLowerCase().includes(q) ||
      (v.variants ?? []).some(
        variant =>
          variant.label.toLowerCase().includes(q) || variant.value.toLowerCase().includes(q),
      );
    return LAB_VALUES.map(s => ({ group: s.group, values: s.group.toLowerCase().includes(q) ? s.values : s.values.filter(matches) })).filter(
      s => s.values.length > 0,
    );
  }, [query]);

  const total = sections.reduce((n, s) => n + s.values.length, 0);

  if (!visible) return null;

  return (
    <Modal visible onRequestClose={onClose} animationType="slide" statusBarTranslucent>
      <KeyboardSafe style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + 8, borderBottomColor: colors.border },
          ]}>
          <Touchable onPress={onClose} label="Back" style={styles.back}>
            <ArrowLeft size={22} color={colors.text} />
          </Touchable>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>Normal Values & Grading</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Laboratory ranges and bedside classifications
            </Text>
          </View>
        </View>

        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={17} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search a test, sign or grading system…"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {query ? (
            <Touchable onPress={() => setQuery('')} label="Clear search">
              <X size={17} color={colors.textMuted} />
            </Touchable>
          ) : null}
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          {/* On the screen, not only in the source: the ranges on the
            * patient's own report are the ones that count. */}
          <View
            style={[
              styles.disclaimer,
              {
                backgroundColor: withAlpha(colors.warning, 0.1),
                borderColor: withAlpha(colors.warning, 0.3),
              },
            ]}>
            <AlertTriangle size={14} color={colors.warning} />
            <Text style={[styles.disclaimerText, { color: colors.text }]}>
              Reference intervals differ between laboratories. Always use the range printed on
              the patient&apos;s own report.
            </Text>
          </View>

          {sections.map(section => (
            <View key={section.group} style={styles.section}>
              <Text style={[styles.groupTitle, { color: colors.textMuted }]}>
                {section.group.toUpperCase()}
              </Text>
              {section.values.map(value => (
                <View
                  key={value.name}
                  style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.name, { color: colors.text }]}>{value.name}</Text>
                  <Text style={[styles.value, { color: colors.accent }]}>{labDisplayText(value.conventional)}</Text>
                  {value.si ? (
                    <Text style={[styles.si, { color: colors.textMuted }]}>{labDisplayText(value.si)}</Text>
                  ) : null}

                  {value.variants && value.variants.length > 0 ? (
                    <View style={styles.variants}>
                      {value.variants.map(variant => (
                        <View key={variant.label} style={styles.variantRow}>
                          <Text style={[styles.variantLabel, { color: colors.textMuted }]}>
                            {variant.label}
                          </Text>
                          <Text style={[styles.variantValue, { color: colors.text }]}>
                            {labDisplayText(variant.value)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* The number that means act now is not the number that
                    * means abnormal, and it is the one that matters at 3am. */}
                  {value.critical ? (
                    <View
                      style={[
                        styles.critical,
                        {
                          backgroundColor: withAlpha(colors.danger, 0.12),
                          borderColor: withAlpha(colors.danger, 0.3),
                        },
                      ]}>
                      <Text style={[styles.criticalLabel, { color: colors.danger }]}>
                        CRITICAL
                      </Text>
                      <Text style={[styles.criticalText, { color: colors.text }]}>
                        {labDisplayText(value.critical)}
                      </Text>
                    </View>
                  ) : null}

                  {value.source ? (
                    <Touchable label={`Read reference for ${value.name}`} onPress={() => Linking.openURL(value.source!).catch(() => {})} style={{ minHeight: 44, justifyContent: 'center' }}>
                      <Text style={{ color: colors.accent }}>Read clinical reference</Text>
                    </Touchable>
                  ) : null}
                  {value.note ? (
                    <Text style={[styles.note, { color: colors.textMuted }]}>{labDisplayText(value.note)}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ))}

          {total === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No value matches</Text>
              <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                Nothing found for &ldquo;{query.trim()}&rdquo;.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardSafe>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { padding: 4 },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  scroll: { padding: 16, paddingBottom: 48 },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 18,
  },
  disclaimerText: { flex: 1, fontSize: 15, lineHeight: 22 },
  section: { marginBottom: 20 },
  groupTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, marginBottom: 8 },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13,
    marginBottom: 8,
  },
  name: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  value: { fontSize: 16, lineHeight: 24, fontWeight: '600', marginTop: 3 },
  si: { fontSize: 12, marginTop: 2 },
  variants: { marginTop: 8, gap: 3 },
  variantRow: { gap: 3, paddingVertical: 6 },
  variantLabel: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  variantValue: { fontSize: 15, lineHeight: 22 },
  critical: {
    marginTop: 9,
    padding: 9,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
  },
  criticalLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.7, marginBottom: 2 },
  criticalText: { fontSize: 15, lineHeight: 22 },
  note: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptyBody: { fontSize: 13, textAlign: 'center' },
});
