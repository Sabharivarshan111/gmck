/**
 * First fully native clinical-studio surface.
 *
 * Layout and copy are ported from src/simulator/controls/SimulatorStudio.tsx
 * and SimulatorStudio.css. This file intentionally uses React Native Views,
 * Pressables and TextInputs instead of HTML or a WebView.
 *
 * Case controls, ICU, ECG and radiology use native views. Anatomy and advanced
 * diagnostic teaching use the locally bundled canonical renderer and pinned
 * geometry cache. Complete device parity requires actual screenshot review.
 */
import React, { useMemo, useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions,
} from 'react-native';
import { ArrowLeft, ChevronRight, HeartPulse, Moon, Search, Sun } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { NATIVE_CLINICAL_SCENARIOS, NATIVE_CLINICAL_SKILLS } from '@/lib/nativeClinicalCatalog';

type Screen = { kind: 'anatomy' | 'monitor' } | { kind: 'tool'; id: string; scenario: string } | { kind: 'case'; id: string };

interface Props {
  onExit: () => void;
  onOpen: (screen: Screen) => void;
  /** Preserve the same case selection across screens as the Vercel page. */
  scenarioId: string;
  onScenarioChange: (scenarioId: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const NIGHT = {
  background: '#000000', card: '#0e0e11', raised: '#1b1b21',
  ink: '#f5f5f7', muted: '#a6a6af', border: '#34343a',
  accent: '#e784fb', onAccent: '#171019',
};
const DAY = {
  background: '#f7f7fa', card: '#ffffff', raised: '#efedf4',
  ink: '#202027', muted: '#62626e', border: '#d5d3dd',
  accent: '#8c279d', onAccent: '#ffffff',
};
type Palette = typeof NIGHT;

function AnatomyStudioIcon() {
  return <Svg width={48} height={64} viewBox="0 0 60 80" accessibilityLabel="Anatomy">
    <Defs><LinearGradient id="native-skin" x1="0" y1="0" x2="1" y2="1">
      <Stop offset="0" stopColor="#ffe1c1" /><Stop offset="1" stopColor="#dc926e" />
    </LinearGradient></Defs>
    <Circle cx="30" cy="10" r="8" fill="url(#native-skin)" />
    <Path d="M25 19h10v4l9 4 10 22q1 4-3 5t-5-2l-7-15v19l-2 20q0 4-4 4t-4-4l1-18h-1l-1 18q0 4-4 4t-4-4l-2-20V37l-7 15q-2 3-5 2t-3-5l10-22 9-4z" fill="url(#native-skin)" stroke="#f4c6a3" strokeWidth={1.3} />
    <Path d="M30 24v12m0-7-4 4m4-4 4 4" fill="none" stroke="#fff5e8" strokeWidth={2} strokeLinecap="round" />
    <Path d="M26 29c-5 0-7 7-6 12 0 3 6 4 7 1V30zM34 29c5 0 7 7 6 12 0 3-6 4-7 1V30z" fill="#57c4dd" />
    <Path d="M30 34c-4-5-8 0-4 5l5 5 5-6c3-5-3-8-6-4z" fill="#f54b65" stroke="#b92b43" strokeWidth={0.6} />
    <Path d="M22 46q5-4 10 0l6 1q0 5-6 4h-8z" fill="#a9543f" />
    <Path d="M31 48q9 0 6 7t-7 0" fill="#ffcb6a" stroke="#d39140" strokeWidth={1} />
    <Path d="M24 54h3m-3 4h10m-10 4h10m-10-8v8m10-8v8" fill="none" stroke="#f694a3" strokeWidth={2.7} strokeLinecap="round" />
  </Svg>;
}

export default function NativeClinicalStudio({ onExit, onOpen, scenarioId, onScenarioChange, theme, onToggleTheme }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [section, setSection] = useState<'skills' | 'cases'>('skills');
  const [query, setQuery] = useState('');
  const [showFindings, setShowFindings] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const c: Palette = theme === 'dark' ? NIGHT : DAY;
  const activeScenario = NATIVE_CLINICAL_SCENARIOS.find(s => s.id === scenarioId) || NATIVE_CLINICAL_SCENARIOS[0];
  const normal = scenarioId === 'normal';
  const q = query.trim().toLowerCase();
  const skills = useMemo(() => NATIVE_CLINICAL_SKILLS.filter(s => `${s.title} ${s.hint}`.toLowerCase().includes(q)), [q]);
  const cases = useMemo(() => NATIVE_CLINICAL_SCENARIOS.filter(s => s.id !== 'normal' && `${s.title} ${s.category}`.toLowerCase().includes(q)), [q]);
  // Same CSS breakpoints as the canonical web .studio-grid.
  const columns = width <= 340 ? 1 : width >= 640 ? 3 : 2;
  const headingSize = Math.max(30, Math.min(44, width * 0.07));
  const bodyWidth = Math.min(width, 800) - 36;
  const skillWidth = (bodyWidth - 12 * (columns - 1)) / columns;

  const buttonStyle = (radius = 20) => ({ backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: radius });
  return (
    <View testID="native-clinical-studio" style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={[styles.header, { backgroundColor: c.background, borderBottomColor: c.border }]}>
        <Pressable testID="studio-native-back" accessibilityRole="button" accessibilityLabel="Back to Vault" onPress={onExit} style={[styles.iconButton, buttonStyle(14)]}>
          <ArrowLeft color={c.ink} size={20} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.logo, { color: c.ink }]}>ORBIT</Text>
          <Text style={[styles.logoSub, { color: c.muted }]}>CLINICAL STUDIO</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          testID="studio-native-theme" onPress={onToggleTheme} style={[styles.iconButton, buttonStyle(14)]}>
          {theme === 'dark' ? <Sun color={c.ink} size={20} /> : <Moon color={c.ink} size={20} />}
        </Pressable>
      </View>

      <KeyboardSafe>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={[styles.main, { paddingBottom: 28 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: c.accent }]}>EXPLORE. LISTEN. PRACTISE.</Text>
        <Text style={[styles.heading, { color: c.ink, fontSize: headingSize, lineHeight: headingSize * 1.12 }]}>What would you{'\n'}like to learn?</Text>
        <Text style={[styles.intro, { color: c.muted }]}>Start with normal findings, explore anatomy, or work through a patient case.</Text>
        <Pressable testID="studio-native-anatomy" accessibilityRole="button" accessibilityLabel="Explore 3D anatomy" onPress={() => onOpen({ kind: 'anatomy' })}
          style={[styles.anatomy, buttonStyle()]}>
          <AnatomyStudioIcon />
          <View style={{ flex: 1 }}>
            <Text style={[styles.anatomyTitle, { color: c.ink }]}>Explore 3D anatomy</Text>
            <Text style={[styles.hint, { color: c.muted, marginTop: 5 }]}>Bones, muscles, organs & nerves · no case needed</Text>
          </View>
          <ChevronRight color={c.accent} size={22} />
        </Pressable>

        <View style={[styles.segment, buttonStyle(16)]}>
          {(['skills','cases'] as const).map(k => (
            <Pressable key={k} testID={`studio-native-${k}`} accessibilityRole="button" onPress={() => { setSection(k); setQuery(''); }}
              style={[styles.segmentItem, section === k ? { backgroundColor: c.accent } : null]}>
              <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: '700', color: section === k ? c.onAccent : c.muted }}>{k === 'skills' ? 'Learn a skill' : 'Practise a case'}</Text>
            </Pressable>
          ))}
        </View>

        {section === 'skills' && <View style={[styles.baseline, buttonStyle(18)]}>
          <Pressable testID="studio-native-baseline" accessibilityRole="button" onPress={() => setShowFindings(v => !v)} style={{ minHeight: 44 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <HeartPulse color={c.accent} size={20} />
              <Text style={{ color: c.accent, fontWeight: '700', fontSize: 13 }}>{normal ? 'Normal findings' : 'Case comparison'}</Text>
            </View>
            <Text style={[styles.baselineSubtitle, { color: c.muted }]}>{normal ? 'Healthy adult at rest' : activeScenario.title}</Text>
            <Text style={{ color: c.accent, fontSize: 11, alignSelf: 'flex-end', marginTop: 8 }}>Change findings ↓</Text>
          </Pressable>
          {(showFindings || !normal) && <>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 12 }}>Findings to show</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Findings to show" onPress={() => setPickerVisible(true)} style={[styles.findingsSelect, { backgroundColor: c.raised, borderColor: c.border }]}>
              <Text style={{ color: c.ink, flex: 1 }} numberOfLines={2}>{activeScenario.title}</Text><ChevronRight color={c.muted} size={18} />
            </Pressable>
            {!normal && <Pressable onPress={() => onScenarioChange('normal')}><Text style={{ color: c.accent, marginTop: 12, textDecorationLine: 'underline' }}>Return to normal baseline</Text></Pressable>}
            <Text style={[styles.footnote, { color: c.muted, marginTop: 10 }]}>Each tool uses this selection. Sound demonstrations inside Auscultation can override it.</Text>
          </>}
        </View>}

        <View style={[styles.search, buttonStyle(16)]}>
          <Search size={18} color={c.muted} />
          <TextInput testID="studio-native-search" style={[styles.input, { color: c.ink }]} placeholder={section === 'skills' ? 'Find a skill…' : 'Find a case or specialty…'}
            placeholderTextColor={c.muted} value={query} onChangeText={setQuery} accessibilityLabel={section === 'skills' ? 'Search skills' : 'Search cases'} />
        </View>

        {section === 'skills' ? <>
          <View style={styles.grid}>
            {skills.map(item => (
              <Pressable key={item.id} testID={`studio-native-skill-${item.id}`} accessibilityRole="button" onPress={() => onOpen({ kind: 'tool', id: item.id, scenario: scenarioId })}
                style={[styles.skillCard, buttonStyle(), { width: skillWidth }]}>
                <Text style={[styles.emoji, { color: c.ink, fontFamily: 'sans-serif' }]} accessible={false}>{item.emoji}</Text>
                <Text style={[styles.skillTitle, { color: c.ink }]}>{item.title}</Text>
                <Text style={[styles.hint, { color: c.muted, flexGrow: 1 }]}>{item.hint}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>Open skill</Text>
                  <ChevronRight size={14} color={c.accent} />
                </View>
              </Pressable>
            ))}
          </View>
          {skills.length === 0 && <Text style={{ color: c.muted }}>No matching skill. Try “ECG” or “lungs”.</Text>}
          <Pressable testID="studio-native-monitor" accessibilityRole="button" onPress={() => onOpen({ kind: 'monitor' })} style={[styles.monitor, buttonStyle()]}>
            <Text style={[styles.emoji, { color: c.ink, fontFamily: 'sans-serif' }]} accessible={false}>📈</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.ink, fontSize: 15, fontWeight: '700' }}>Open live monitor</Text>
              <Text style={[styles.hint, { color: c.muted, marginTop: 4 }]}>See ECG, oxygen saturation & respiratory waveforms</Text>
            </View>
            <ChevronRight size={20} color={c.accent} />
          </Pressable>
        </> : <View style={{ gap: 12 }}>
          {cases.map(item => <Pressable key={item.id} testID={`studio-native-case-${item.id}`} accessibilityRole="button" onPress={() => onOpen({ kind: 'case', id: item.id })}
            style={[styles.caseCard, buttonStyle()]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: c.accent, marginBottom: 4 }}>{item.category}</Text>
              <Text style={{ fontSize: 16, color: c.ink, fontWeight: '700' }}>{item.title}</Text>
              <Text style={[styles.hint, { color: c.muted, marginTop: 6 }]}>{item.subtitle}</Text>
            </View>
            <ChevronRight size={20} color={c.accent} />
          </Pressable>)}
          {!cases.length && <Text style={{ color: c.muted }}>No matching case.</Text>}
        </View>}
        <Text style={[styles.footnote, { color: c.muted, marginTop: 24 }]}>Teaching simulations for learning examination and anatomy.</Text>
      </ScrollView>
      </KeyboardSafe>

      <Modal visible={pickerVisible} onRequestClose={() => setPickerVisible(false)} transparent animationType="fade">
        <View style={[styles.modalBackdrop, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={[styles.modalPanel, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={{ color: c.ink, fontWeight: '700', fontSize: 17, marginBottom: 12 }}>Findings to show</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {NATIVE_CLINICAL_SCENARIOS.map(s => <Pressable key={s.id} onPress={() => { onScenarioChange(s.id); setPickerVisible(false); }} style={[styles.pickerRow, { borderBottomColor: c.border }]}>
                <Text style={{ color: s.id === scenarioId ? c.accent : c.ink }}>{s.title}</Text>
              </Pressable>)}
            </ScrollView>
            <Pressable onPress={() => setPickerVisible(false)} style={{ padding: 14, alignItems: 'center' }}><Text style={{ color: c.accent }}>Close</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1 },
  iconButton: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 13, lineHeight: 19.5, fontWeight: '800', letterSpacing: 2 },
  logoSub: { fontSize: 10, lineHeight: 15, fontWeight: '800', letterSpacing: 1.3 },
  main: { width: '100%', maxWidth: 800, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 28 },
  eyebrow: { fontSize: 10, lineHeight: 15, fontWeight: '800', letterSpacing: 1.8 },
  heading: { fontSize: 38, lineHeight: 43, fontWeight: '800', letterSpacing: -1.3, marginTop: 10, marginBottom: 14 },
  intro: { fontSize: 15, lineHeight: 24, marginBottom: 24, maxWidth: 440 },
  anatomy: { paddingHorizontal: 18, paddingVertical: 22, flexDirection: 'row', alignItems: 'center', gap: 14 },
  anatomyTitle: { fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 13, lineHeight: 19.5 },
  segment: { padding: 4, flexDirection: 'row', gap: 4, marginTop: 24, marginBottom: 16 },
  segmentItem: { minHeight: 48, flex: 1, justifyContent: 'center', borderRadius: 12 },
  baseline: { padding: 16 },
  baselineSubtitle: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  findingsSelect: { borderWidth: 1, marginTop: 5, minHeight: 48, borderRadius: 12, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 14, paddingHorizontal: 14 },
  input: { minHeight: 48, flex: 1, fontSize: 14, paddingVertical: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  skillCard: { paddingHorizontal: 16, paddingVertical: 20, gap: 12, minHeight: 200 },
  emoji: { fontSize: 36, lineHeight: 45 },
  skillTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  monitor: { marginTop: 18, flexDirection: 'row', padding: 18, alignItems: 'center', gap: 12 },
  caseCard: { padding: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  footnote: { fontSize: 11, lineHeight: 17.6 },
  modalBackdrop: { flex: 1, backgroundColor: '#000a', justifyContent: 'center', padding: 16 },
  modalPanel: { maxHeight: '80%', padding: 16, borderRadius: 20, borderWidth: 1 },
  pickerRow: { minHeight: 48, paddingVertical: 14, borderBottomWidth: 1 },
});
