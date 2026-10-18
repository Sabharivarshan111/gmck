/** Shared native port of the canonical Simulator mobile header and segmented tabs. */
import React from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Activity, ArrowLeft, Heart, Layers, Monitor, Moon, Sparkles, Stethoscope, Sun } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { CASE_DAY, CASE_NIGHT } from '@/components/NativeCaseLibrary';
import type { PatientVitals } from '@simulator/types';
export type SimulatorTheme = 'light' | 'dark';
export function NativeSimulatorHeader({ theme, vitals, onExit, onMonitor, onToggleTheme }: {
  theme: SimulatorTheme; vitals: PatientVitals; onExit: () => void; onMonitor: () => void; onToggleTheme?: () => void;
}) {
  const p = theme === 'light' ? CASE_DAY : CASE_NIGHT;
  return <View style={[styles.header, { backgroundColor: p.card, borderColor: p.border }]}>
    <Pressable accessibilityRole="button" accessibilityLabel="Back to Vault" onPress={onExit} style={[styles.icon, { backgroundColor: p.raised, borderColor: p.border }]}><ArrowLeft size={16} color={p.ink} /></Pressable>
    <View style={styles.brand}><View style={styles.avatar}><Activity size={16} color="#020617" /></View><Text accessibilityLabel="Patient Simulator" numberOfLines={1} style={{ color: p.ink, fontSize: 12, fontWeight: '900', letterSpacing: -0.3 }}>Simulator</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Open ICU monitor" onPress={onMonitor} style={[styles.hud, { backgroundColor: p.raised, borderColor: p.border }]}>
      <View style={styles.heart}><Heart size={12} color="#f43f5e" fill="#f43f5e" /><Text style={[styles.hudText, { color: '#f43f5e' }]}>{Math.round(vitals.heartRate)}</Text></View>
      <Text style={{ color: '#64748b', fontSize: 10 }}>|</Text><Text style={[styles.hudText, { color: theme === 'light' ? '#0284c7' : '#22d3ee' }]}>{Math.round(vitals.bpSystolic)}/{Math.round(vitals.bpDiastolic)}</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onPress={onToggleTheme} style={[styles.icon, { backgroundColor: p.raised, borderColor: p.border }]}>{theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#475569" />}</Pressable>
  </View>;
}
export function NativeSimulatorBanner({ theme, scenario }: { theme: SimulatorTheme; scenario: { id: string; title: string } }) {
  const p = theme === 'light' ? CASE_DAY : CASE_NIGHT;
  return <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderColor: p.border, backgroundColor: p.card }}><Text style={{ color: p.accent, fontSize: 12, fontWeight: '600' }}>{scenario.id === 'normal' ? 'Normal teaching baseline · healthy adult at rest' : `Case findings · ${scenario.title}`}</Text></View>;
}
export function NativeSimulatorTabs({ theme, selected, bottomInset, onSkills, onAnatomy, onMonitor, onCase }: {
  theme: SimulatorTheme; selected: 'monitor' | 'case'; bottomInset: number;
  onSkills: () => void; onAnatomy: () => void; onMonitor: () => void; onCase: () => void;
}) {
  const p = theme === 'light' ? CASE_DAY : CASE_NIGHT;
  const { width } = useWindowDimensions();
  const tabs = [
    { id: 'skills', title: 'Skills', label: 'Back to clinical studio', Icon: Stethoscope, action: onSkills },
    { id: 'anatomy', title: width >= 390 ? '3D Anatomy' : '3D', label: 'Open patient 3D anatomy', Icon: Layers, action: onAnatomy },
    { id: 'monitor', title: width >= 390 ? 'ICU Monitor' : 'Monitor', label: 'Live ICU monitor', Icon: Monitor, action: onMonitor },
    { id: 'case', title: width >= 390 ? 'Rx & Case' : 'Case', label: 'Open clinical case', Icon: Sparkles, action: onCase },
  ];
  return <View style={[styles.footer, { backgroundColor: p.card, paddingBottom: bottomInset + 8 }]}><View style={[styles.tabs, { borderColor: p.border, backgroundColor: theme === 'light' ? '#e2e8f0cc' : p.card }]}>
    {tabs.map(({ id, title, label, Icon, action }) => {
      const active = id === selected;
      const color = active ? (theme === 'dark' ? '#171019' : '#0f172a') : (id === 'skills' ? p.ink : p.muted);
      return <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={label} onPress={action} style={[styles.tab, active && { backgroundColor: theme === 'dark' ? p.accent : '#fff' }]}><Icon size={14} color={color} /><Text style={{ color, fontSize: 12, fontWeight: '700', textAlign: 'center', flexShrink: 1 }}>{title}</Text></Pressable>;
    })}
  </View></View>;
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderBottomWidth: 1 },
  icon: { minWidth: 44, minHeight: 44, borderWidth: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  brand: { flexDirection: 'row', gap: 8, alignItems: 'center', flex: 1, minWidth: 0 },
  avatar: { width: 28, height: 28, borderRadius: 12, backgroundColor: '#e879f9', alignItems: 'center', justifyContent: 'center' },
  hud: { minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, gap: 8, flexDirection: 'row', alignItems: 'center' },
  heart: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  hudText: { fontSize: 12, lineHeight: 18, fontWeight: '700', fontFamily: 'monospace' },
  footer: { paddingHorizontal: 12, paddingTop: 8 },
  tabs: { minHeight: 54, padding: 4, borderWidth: 1, borderRadius: 16, flexDirection: 'row', gap: 4 },
  tab: { minHeight: 44, borderRadius: 12, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
