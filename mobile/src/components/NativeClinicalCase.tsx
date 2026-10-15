/**
 * Native (offline) clinical case intervention studio. No web traffic.
 * Uses the exact same PhysiologyKernel and 27 actions as the Vercel version.
 * A complete 3D anatomy/diagnostics port remains a separate deliverable.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ArrowLeft, Activity, Sun, Moon, Layers, Stethoscope } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Text } from '@/components/Text';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { Touchable } from '@/components/Touchable';
import NativeCaseLibrary, { CASE_DAY, CASE_NIGHT } from '@/components/NativeCaseLibrary';
import { PhysiologyKernel } from '@simulator/engine/PhysiologyKernel';
import { NATIVE_CLINICAL_ACTIONS } from '@/lib/nativeClinicalActions';
import NativeIcuMonitor from '@/components/NativeIcuMonitor';
import type { PatientVitals } from '@simulator/types';

type ActionGroup = 'all' | 'resus' | 'cardiac' | 'antidotes' | 'procedures';
const groups: { id: ActionGroup; title: string }[] = [
  { id: 'all', title: 'All' },
  { id: 'resus', title: 'Resus' },
  { id: 'cardiac', title: 'Cardiac' },
  { id: 'antidotes', title: 'Antidotes' },
  { id: 'procedures', title: 'Procedures' },
];
const round = (n: number) => Math.round(n).toString();
export default function NativeClinicalCase({ scenarioId, onBack, engine, theme = 'dark', onToggleTheme, onScenarioChange, onOpen }: {
  scenarioId: string; onBack: () => void; engine?: PhysiologyKernel; theme?: 'light' | 'dark';
  onToggleTheme?: () => void; onScenarioChange?: (id: string) => void; onOpen?: (query: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const kernel = useRef<PhysiologyKernel | null>(null);
  if (!kernel.current) kernel.current = engine || new PhysiologyKernel(scenarioId);
  const patient = kernel.current;
  const palette = theme === 'light' ? CASE_DAY : CASE_NIGHT;
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [vitals, setVitals] = useState<PatientVitals>(() => ({ ...patient.getLiveVitals() }));
  const [group, setGroup] = useState<ActionGroup>('all');
  const [showMonitor, setShowMonitor] = useState(false);
  const [logs, setLogs] = useState<string[]>(() => [...patient.logs]);

  useEffect(() => {
    if (patient.currentScenario.id !== scenarioId) patient.setScenario(scenarioId);
    setVitals({ ...patient.getLiveVitals() });
    setLogs([...patient.logs]);
  }, [scenarioId, patient]);

  useEffect(() => {
    if (showMonitor || !focused) return;
    const t = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      patient.tick(0.125);
      setVitals({ ...patient.getLiveVitals() });
    }, 125);
    return () => clearInterval(t);
  }, [showMonitor, focused, patient]);

  const scenario = patient.currentScenario;
  const apply = (actionId: string) => {
    patient.applyAction(actionId);
    setLogs([...patient.logs]);
    setVitals({ ...patient.getLiveVitals() });
  };

  if (showMonitor) return (
    <NativeIcuMonitor
      scenarioId={scenarioId}
      engine={patient}
      onBack={() => {
        setShowMonitor(false);
        setVitals({ ...patient.getLiveVitals() });
      }}
    />
  );

  return <KeyboardSafe style={[styles.root, { paddingTop: insets.top }]}>
    <View testID="native-clinical-case" style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to clinical studio" onPress={onBack} style={styles.icon}><ArrowLeft size={16} color={palette.ink} /></Pressable>
      <View style={{ width: 28, height: 28, backgroundColor: palette.accent, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}><Activity size={16} color="#0e0e11" /></View>
      <Text accessibilityLabel="Patient Simulator" style={{ color: palette.ink, fontWeight: '800', fontSize: 12, flex: 1 }}>Simulator</Text>
      <View style={[styles.hud, { backgroundColor: palette.raised, borderColor: palette.border }]}>
        <Text style={{ color: '#fb7185', fontSize: 12, fontWeight: '800' }}>♥ {round(vitals.heartRate)}</Text><Text style={{ color: '#64748b' }}>|</Text>
        <Text style={{ color: '#22d3ee', fontSize: 12, fontWeight: '800' }}>{round(vitals.bpSystolic)}/{round(vitals.bpDiastolic)}</Text>
      </View>
      {onToggleTheme && <Touchable label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onPress={onToggleTheme} style={styles.icon}>{theme === 'dark' ? <Sun size={16} color="#facc15" /> : <Moon size={16} color="#475569" />}</Touchable>}
    </View>
    <View style={[styles.findings, { backgroundColor: palette.card }]}><Text style={{ color: palette.accent, fontWeight: '700', fontSize: 13 }}>Case findings · {scenario.title}</Text></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 34, paddingBottom: 20 }}>
      <View style={styles.panel}>
      <NativeCaseLibrary scenarioId={scenario.id} theme={theme} onSelect={id => { patient.setScenario(id); setVitals({ ...patient.getLiveVitals() }); setLogs([...patient.logs]); onScenarioChange?.(id); }} onOpen={query => onOpen?.(query)} />
      <Text style={[styles.title, { marginTop: 20, fontSize: 18 }]}>Clinical interventions</Text>
      <ScrollView horizontal style={{ flexGrow: 0, marginTop: 10 }} contentContainerStyle={{ gap: 7, paddingBottom: 5 }} showsHorizontalScrollIndicator={false}>
        {groups.map(item => <Pressable accessibilityRole="button" testID={`native-case-group-${item.id}`} key={item.id} onPress={() => setGroup(item.id)}
          style={[styles.tab, group === item.id && { backgroundColor: palette.cyan, borderColor: palette.cyan }]}>
          <Text style={{ color: group === item.id ? '#020617' : palette.ink, fontWeight: '700', fontSize: 12 }}>{item.title}</Text>
        </Pressable>)}
      </ScrollView>

      <View style={styles.actions}>
        {NATIVE_CLINICAL_ACTIONS.filter(a => group === 'all' || a.cat === group).map(a => <Pressable key={a.id} testID={`native-case-action-${a.id}`}
          accessibilityRole="button" onPress={() => apply(a.id)} style={styles.action}>
          <Text style={{ fontSize: 23 }}>{a.icon}</Text>
          <View style={{ flex: 1 }}><Text style={{ color: palette.ink, fontWeight: '700', fontSize: 13 }}>{a.label}</Text>
            <Text style={styles.sub}>{a.sub}</Text></View>
        </Pressable>)}
      </View>
      <Text style={[styles.title, { marginTop: 22, fontSize: 18 }]}>Clinical activity log</Text>
      {logs.slice(-6).map((row, i) => <View key={i} style={styles.log}><Text style={{ color: palette.ink, fontSize: 12, lineHeight: 18 }}>{row}</Text></View>)}
      <Touchable label="Reset clinical case" onPress={() => { patient.setScenario(scenario.id); setVitals({ ...patient.getLiveVitals() }); setLogs([...patient.logs]); }} style={{ minHeight: 44, justifyContent: 'center', marginTop: 12 }}><Text style={{ color: palette.muted }}>↻ Reset clinical case</Text></Touchable>
      </View>
    </ScrollView>
    <View style={[styles.bottomTabs, { paddingBottom: Math.max(8, insets.bottom) }]}>
      <Touchable label="Back to clinical studio" onPress={onBack} style={styles.bottomTab}><Stethoscope size={15} color={palette.ink} /><Text style={styles.tabText}>Skills</Text></Touchable>
      <Touchable label="Open patient 3D anatomy" onPress={() => onOpen?.(new URLSearchParams({ mode: 'anatomy', scenario: scenario.id }).toString())} style={styles.bottomTab}><Layers size={15} color={palette.muted} /><Text style={styles.tabText}>3D Anatomy</Text></Touchable>
      <Touchable label="Live ICU monitor" onPress={() => setShowMonitor(true)} style={styles.bottomTab}><Activity size={15} color={palette.muted} /><Text style={styles.tabText}>ICU Monitor</Text></Touchable>
      <View style={[styles.bottomTab, { backgroundColor: palette.accent, borderRadius: 14 }]}><Activity size={15} color="#171019" /><Text style={[styles.tabText, { color: '#171019' }]}>Rx & Case</Text></View>
    </View>
  </KeyboardSafe>;
}
const makeStyles = (palette: typeof CASE_NIGHT) => StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  hud: { minHeight: 44, paddingHorizontal: 10, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 7 },
  findings: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: palette.border },
  panel: { backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 16, padding: 10 },
  bottomTabs: { flexDirection: 'row', paddingTop: 8, paddingHorizontal: 12, gap: 4, backgroundColor: palette.card, borderTopWidth: 1, borderColor: palette.border },
  bottomTab: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 3 },
  tabText: { color: palette.muted, fontSize: 12, fontWeight: '800', textAlign: 'center', flexShrink: 1 },
  header: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: palette.border, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  icon: { minHeight: 44, minWidth: 44, borderWidth: 1, borderColor: palette.border, borderRadius: 12, backgroundColor: palette.raised, justifyContent: 'center', alignItems: 'center' },
  hTitle: { color: palette.ink, fontSize: 17, fontWeight: '800' },
  sub: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  label: { fontSize: 10, color: '#22d3ee', letterSpacing: 1, fontWeight: '800', marginBottom: 7 },
  title: { fontSize: 19, lineHeight: 26, fontWeight: '800', color: palette.ink, marginBottom: 6 },
  caseCard: { backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 17, padding: 15 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 9, gap: 7 },
  metric: { borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card, borderRadius: 12, padding: 10, minWidth: 140, flexGrow: 1 },
  monitorButton: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, padding: 14, borderRadius: 12, gap: 10, alignItems: 'center', flexDirection: 'row', marginTop: 10, minHeight: 58 },
  warningCard: { backgroundColor: '#032b2b', borderWidth: 1, borderColor: '#065f46', borderRadius: 12, padding: 12, gap: 4, marginTop: 8 },
  tab: { paddingHorizontal: 15, borderRadius: 12, minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card },
  actions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 9, gap: 8 },
  action: { width: '47%', flexGrow: 1, minWidth: 138, minHeight: 76, backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 14, padding: 10, alignItems: 'center', flexDirection: 'row', gap: 8 },
  log: { backgroundColor: palette.card, borderRadius: 10, padding: 10, marginTop: 6, borderWidth: 1, borderColor: '#1e293b' },
});
