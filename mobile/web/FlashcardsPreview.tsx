import React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudyView } from '@/screens/FlashcardsScreen';
import { useTheme } from '@/theme';
import type { DeckCard } from '@/lib/flashcards';
import { useVaultAccess } from './VaultAccess';

// A fixed deck uses the real answer/review controls without generating or
// importing premium decks. Its schedule stays separate from the reader's decks.
const cards: DeckCard[] = [
  { id: 'orbit-preview-1', kind: 'theory', front: 'How many chambers does the human heart have?', back: 'Four: the right atrium, right ventricle, left atrium and left ventricle.' },
  { id: 'orbit-preview-2', kind: 'theory', front: 'What is the structural and functional unit of the kidney?', back: 'The nephron.' },
  { id: 'orbit-preview-3', kind: 'theory', front: 'Which nerve supplies the diaphragm?', back: 'The phrenic nerve (C3–C5).' },
];
const topic = { key: 'orbit::flashcards-free-preview-v1', name: 'Flashcards preview', breadcrumb: 'Free preview', questions: [] };

export function FlashcardsPreview({ onBack }: { onBack: () => void }) {
  const access = useVaultAccess();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [attempt, setAttempt] = React.useState(0);
  return <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}>
    <aside className="simulator-sample-banner">
      <span><strong>Free preview</strong> · Try 3 cards, reveal answers and rate your recall.</span>
      <button onClick={() => access.requestPurchase('all Anki flashcards')}>Unlock all →</button>
    </aside>
    <StudyView key={attempt} year="first" subjectName="Sample deck" topic={{ ...topic, key: `${topic.key}::${attempt}` }} fixture={cards} onBack={onBack} />
    <button className="checkout-secondary" onClick={() => setAttempt(value => value + 1)}>Restart free preview</button>
    <p style={{ color: colors.textMuted }}>Premium unlocks full chapter decks, your own decks and Anki imports.</p>
  </ScrollView>;
}
