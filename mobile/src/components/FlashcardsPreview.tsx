import React, { useEffect, useMemo, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudyView } from '@/screens/FlashcardsScreen';
import type { DeckCard } from '@/lib/flashcards';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useVaultPremium } from '@/components/VaultPremium';
import { useTheme } from '@/theme';
import { typeScale } from '@/theme/typography';

const cards: DeckCard[] = [
  { id: 'orbit-preview-1', kind: 'theory', front: 'How many chambers does the human heart have?', back: 'Four: the right atrium, right ventricle, left atrium and left ventricle.' },
  { id: 'orbit-preview-2', kind: 'theory', front: 'What is the structural and functional unit of the kidney?', back: 'The nephron.' },
  { id: 'orbit-preview-3', kind: 'theory', front: 'Which nerve supplies the diaphragm?', back: 'The phrenic nerve (C3–C5).' },
];

/** Real study controls with a fixed sample; no premium deck import or generation. */
export function FlashcardsPreview({ onBack }: { onBack: () => void }) {
  const access = useVaultPremium();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [attempt, setAttempt] = useState(0);
  const topic = useMemo(() => ({ key: `orbit::flashcards-free-preview-v1::${attempt}`, name: 'Flashcards preview', breadcrumb: 'Free preview', questions: [] }), [attempt]);
  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => { onBack(); return true; });
    return () => back.remove();
  }, [onBack]);
  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}>
    <View style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[typeScale.caption, styles.description, { color: colors.textMuted }]}>Free preview · Try 3 cards, reveal answers and rate your recall.</Text>
      <Touchable label="Unlock all Anki flashcards" onPress={() => access.requestPurchase('all Anki flashcards')} style={styles.action}>
        <Text style={[typeScale.caption, { color: colors.accent }]}>Unlock all →</Text>
      </Touchable>
    </View>
    <StudyView key={attempt} year="first" subjectName="Sample deck" topic={topic} fixture={cards} onBack={onBack} />
    <Touchable label="Restart free preview" onPress={() => setAttempt(value => value + 1)} style={[styles.restart, { borderColor: colors.border }]}>
      <Text style={[typeScale.caption, { color: colors.accent }]}>Restart free preview</Text>
    </Touchable>
    <Text style={[typeScale.caption, { color: colors.textMuted }]}>Premium unlocks full chapter decks, your own decks and Anki imports.</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12 },
  description: { flex: 1 },
  action: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  restart: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 12 },
});
