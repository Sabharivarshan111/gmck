import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import Radiology from '@/native/NativeOrbitRadiology';

const normalFindings = [
  'No bulbous enlargement of the fingertips.',
  'The nail folds form an angle below 180°; the nail bed feels firm.',
  'A diamond-shaped window remains when corresponding fingernails are opposed.',
];
const clubbingFindings = [
  'Increased nail curvature and bulbous terminal phalanges.',
  'Loss of the normal nail-fold angle, progressing beyond 180°.',
  'Nail-bed sponginess may be an early finding.',
  'Schamroth window may be lost. Interpret with the full examination.',
];
const examinationSteps = [
  'Inspect fingers from the side for the nail-fold angle and distal enlargement.',
  'Gently palpate the nail bed for fluctuation or sponginess.',
  'Ask the patient to oppose corresponding nails; look for the diamond window (Schamroth test).',
  'Compare both hands and examine the toes. Ask about duration and family history.',
  'Investigate the clinical context, including pulmonary, cardiac and gastrointestinal disease. Clubbing itself does not diagnose a cause.',
];
type Frame = { uri: string; width: number; height: number };

/** Canonical ClubbingTrainer's fixed white teaching sheet, rendered natively. */
export default function NativeClubbingTrainer({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'normal' | 'clubbing'>('normal');
  const [answer, setAnswer] = useState(false);
  const [steps, setSteps] = useState(false);
  const [image, setImage] = useState<Frame | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (mode !== 'clubbing' || image) return;
    let cancelled = false;
    if (!Radiology) { setError('Native image renderer unavailable.'); return; }
    Radiology.renderXray('clinical-reference/clubbing.jpg', 1, 1)
      .then(json => { if (!cancelled) setImage(JSON.parse(json)); })
      .catch(e => { if (!cancelled) setError(String(e.message || e)); });
    return () => { cancelled = true; };
  }, [mode, image]);

  return <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Clubbing examination</Text>
      <Touchable label="Close clubbing skill" onPress={onBack} style={styles.close}><Text style={styles.closeLabel}>✕</Text></Touchable>
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>Independent teaching skill. These examples do not assign clubbing to the selected patient case.</Text>
      <View style={styles.modeRow}>{(['normal', 'clubbing'] as const).map(value => {
        const selected = value === mode;
        const label = value === 'normal' ? 'Normal findings' : 'Clubbing findings';
        return <Touchable key={value} label={label} state={{ selected }} onPress={() => { setMode(value); setAnswer(false); }} style={[styles.modeButton, selected && styles.modeSelected]}>
          <Text style={[styles.modeLabel, selected && styles.modeLabelSelected]}>{label}</Text>
        </Touchable>;
      })}</View>
      {mode === 'clubbing' && <View>
        {image ? <Image source={{ uri: image.uri }} style={[styles.photo, { aspectRatio: image.width / image.height }]} resizeMode="contain" accessibilityLabel="Clinical reference photograph of enlarged distal fingers with convex nails" />
          : error ? <Text accessibilityRole="alert" style={styles.caption}>{error}</Text> : <ActivityIndicator color="#0f766e" />}
        <Text style={[styles.caption, styles.photoCaption]}>Inspect the terminal phalanges and nail curvature; a photograph alone cannot assess nail-bed fluctuation.</Text>
      </View>}
      <View style={[styles.card, styles.findings]}>
        <Text style={styles.cardTitle}>{mode === 'normal' ? 'What should I find normally?' : 'What changes in clubbing?'}</Text>
        {(mode === 'normal' ? normalFindings : clubbingFindings).map(text => <View style={styles.bulletRow} key={text}>
          <Text style={[styles.body, styles.bullet]}>•</Text><Text style={[styles.body, styles.listText]}>{text}</Text>
        </View>)}
      </View>
      <View style={[styles.card, styles.examination]}>
        <Touchable label="How to examine & why" state={{ expanded: steps }} onPress={() => setSteps(value => !value)} style={styles.summary}><Text style={styles.summaryLabel}>How to examine &amp; why</Text></Touchable>
        {steps && <View style={styles.list}>{examinationSteps.map((text, index) => <View style={styles.numberRow} key={text}>
          <Text style={[styles.body, styles.number]}>{index + 1}.</Text><Text style={[styles.body, styles.listText]}>{text}</Text>
        </View>)}</View>}
      </View>
      <View style={[styles.card, styles.viva]}>
        <Text style={styles.cardTitle}>Viva: does asthma usually cause clubbing?</Text>
        <Touchable label={answer ? 'Hide answer' : 'Reveal answer'} state={{ expanded: answer }} onPress={() => setAnswer(value => !value)} style={styles.reveal}><Text style={styles.revealLabel}>{answer ? 'Hide answer' : 'Reveal answer'}</Text></Touchable>
        {answer && <Text style={styles.body}>No. Look for another cause, such as bronchiectasis, if a patient labelled as having asthma has clubbing.</Text>}
      </View>
      <Text style={styles.caption}>Clinical reference: <Text accessibilityRole="link" accessibilityLabel="Nail clubbing examination" style={styles.link} onPress={() => { Linking.openURL('https://www.ncbi.nlm.nih.gov/books/NBK539713/').catch(() => setError('Unable to open reference.')); }}>Nail clubbing examination</Text></Text>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e5e7eb', gap: 8 },
  headerTitle: { flex: 1, color: '#0f172a', fontWeight: '700', fontSize: 16, lineHeight: 24 },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  closeLabel: { color: '#0f172a', fontSize: 16 },
  content: { padding: 16, gap: 16 },
  cardTitle: { color: '#0f172a', fontWeight: '700', fontSize: 14, lineHeight: 22.75 },
  intro: { color: '#475569', fontSize: 14, lineHeight: 20 },
  body: { color: '#0f172a', fontSize: 14, lineHeight: 22.75 },
  caption: { color: '#64748b', fontSize: 12, lineHeight: 16 },
  photoCaption: { marginTop: 8 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeButton: { flex: 1, minHeight: 48, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  modeSelected: { backgroundColor: '#0f766e' },
  modeLabel: { color: '#0f172a', fontSize: 16, lineHeight: 24, fontWeight: '600', textAlign: 'center' },
  modeLabelSelected: { color: '#fff' },
  photo: { width: '100%', maxHeight: 288, backgroundColor: '#f1f5f9', borderRadius: 12 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', gap: 8 },
  findings: { backgroundColor: '#f0fdfa', borderWidth: 0 },
  bulletRow: { flexDirection: 'row', paddingLeft: 4, gap: 8 },
  bullet: { width: 8 },
  listText: { flex: 1 },
  list: { gap: 8 },
  numberRow: { flexDirection: 'row', gap: 8 },
  number: { width: 12 },
  examination: { padding: 12, gap: 0 },
  summary: { minHeight: 44, justifyContent: 'center' },
  summaryLabel: { color: '#0f172a', fontSize: 16, lineHeight: 24, fontWeight: '700' },
  viva: { gap: 0 },
  reveal: { minHeight: 48, justifyContent: 'center' },
  revealLabel: { color: '#0f766e', fontSize: 14, lineHeight: 20, fontWeight: '700' },
  link: { textDecorationLine: 'underline' },
});
