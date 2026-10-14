/**
 * Native (offline) clinical case intervention studio. No web traffic.
 * Uses the exact same PhysiologyKernel and 27 actions as the Vercel version.
 * A complete 3D anatomy/diagnostics port remains a separate deliverable.
 */
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ArrowLeft, Activity, RotateCcw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
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
export default function NativeClinicalCase({ scenarioId, onBack }: { scenarioId: string; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const kernel = useRef(new PhysiologyKernel(scenarioId));
  const [vitals, setVitals] = useState<PatientVitals>(() => ({ ...kernel.current.getLiveVitals() }));
  const [group, setGroup] = useState<ActionGroup>('all');
  const [showMonitor, setShowMonitor] = useState(false);
  const [logs, setLogs] = useState<string[]>(() => [...kernel.current.logs]);

  useEffect(() => {
    kernel.current.setScenario(scenarioId);
    setVitals({ ...kernel.current.getLiveVitals() });
    setLogs([...kernel.current.logs]);
  }, [scenarioId]);

  useEffect(() => {
    if (showMonitor) return;
    const t = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      kernel.current.tick(0.125);
      setVitals({ ...kernel.current.getLiveVitals() });
    }, 125);
    return () => clearInterval(t);
  }, [showMonitor]);

  const scenario = kernel.current.currentScenario;
  const apply = (actionId: string) => {
    const result = kernel.current.applyAction(actionId);
    setLogs(previous => [result, ...previous].slice(0, 25));
    setVitals({ ...kernel.current.getLiveVitals() });
  };

  if (showMonitor) return (
    <NativeIcuMonitor
      scenarioId={scenarioId}
      engine={kernel.current}
      onBack={() => {
        setShowMonitor(false);
        setVitals({ ...kernel.current.getLiveVitals() });
      }}
    />
  );

  return <View testID="native-clinical-case" style={[styles.root, { paddingTop: insets.top }]}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to clinical studio" onPress={onBack} style={styles.icon}>
        <ArrowLeft size={20} color="#e2e8f0" />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.hTitle}>Patient Simulator</Text>
        <Text style={styles.sub}>NMC CBME Clinical Library · Offline native</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Reset clinical case" onPress={() => {
        kernel.current.setScenario(scenarioId);
        setVitals({ ...kernel.current.getLiveVitals() });
        setLogs([...kernel.current.logs]);
      }} style={styles.icon}><RotateCcw size={19} color="#94a3b8" /></Pressable>
    </View>

    <ScrollView contentContainerStyle={{ paddingHorizontal: 13, paddingTop: 12, paddingBottom: insets.bottom + 28 }}>
      <View style={styles.caseCard}>
        <Text style={styles.label}>CASE FINDINGS • {scenario.category}</Text>
        <Text style={styles.title}>{scenario.title}</Text>
        <Text style={styles.sub}>{scenario.chiefComplaint}</Text>
        <Text style={[styles.sub, { marginTop: 9, color: '#e2e8f0', lineHeight: 20 }]}>{scenario.history}</Text>
      </View>

      <View style={styles.metricGrid}>
        {[
          { label: 'ECG / HR', value: round(vitals.heartRate), unit: 'bpm', color: '#00e676' },
          { label: 'NIBP / ART', value: `${round(vitals.bpSystolic)}/${round(vitals.bpDiastolic)}`, unit: `MAP ${round(vitals.meanArterialPressure)}`, color: '#ff1744' },
          { label: 'SpO₂', value: `${round(vitals.spo2)}%`, unit: 'pulse oximetry', color: '#00e5ff' },
          { label: 'RESP', value: round(vitals.respiratoryRate), unit: `EtCO₂ ${round(vitals.etco2)}`, color: '#ffd600' },
        ].map(item => <View key={item.label} style={styles.metric}>
          <Text style={{ fontWeight: '700', color: item.color, fontSize: 10 }}>{item.label}</Text>
          <Text style={{ fontWeight: '800', fontSize: 23, color: item.color }}>{item.value}</Text>
          <Text style={styles.sub}>{item.unit}</Text>
        </View>)}
      </View>

      <Pressable testID="native-case-open-monitor" onPress={() => setShowMonitor(true)} accessibilityRole="button" style={styles.monitorButton}>
        <Activity size={22} color="#00e676" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>Live ICU monitor</Text>
          <Text style={styles.sub}>ECG, arterial pressure, PLETH and EtCO₂</Text>
        </View>
        <Text style={{ color: '#00e676' }}>Open →</Text>
      </Pressable>

      <View style={styles.warningCard}>
        <Text style={{ color: '#6ee7b7', fontWeight: '700', fontSize: 11 }}>Target Rx</Text>
        <Text style={{ color: '#d1fae5', fontSize: 12, lineHeight: 19 }}>{scenario.targetInterventions.join(', ') || 'None listed'}</Text>
      </View>
      <View style={[styles.warningCard, { borderColor: '#9f1239', backgroundColor: '#2f101b' }]}>
        <Text style={{ color: '#fda4af', fontWeight: '700', fontSize: 11 }}>Lethal Errors</Text>
        <Text style={{ color: '#fecdd3', fontSize: 12, lineHeight: 19 }}>{scenario.lethalTriggers.join(', ') || 'None listed'}</Text>
      </View>

      <Text style={[styles.title, { marginTop: 20, fontSize: 18 }]}>Clinical interventions</Text>
      <ScrollView horizontal style={{ flexGrow: 0, marginTop: 10 }} contentContainerStyle={{ gap: 7, paddingBottom: 5 }} showsHorizontalScrollIndicator={false}>
        {groups.map(item => <Pressable accessibilityRole="button" testID={`native-case-group-${item.id}`} key={item.id} onPress={() => setGroup(item.id)}
          style={[styles.tab, group === item.id && { backgroundColor: '#00e5ff', borderColor: '#00e5ff' }]}>
          <Text style={{ color: group === item.id ? '#020617' : '#cbd5e1', fontWeight: '700', fontSize: 12 }}>{item.title}</Text>
        </Pressable>)}
      </ScrollView>

      <View style={styles.actions}>
        {NATIVE_CLINICAL_ACTIONS.filter(a => group === 'all' || a.cat === group).map(a => <Pressable key={a.id} testID={`native-case-action-${a.id}`}
          accessibilityRole="button" onPress={() => apply(a.id)} style={styles.action}>
          <Text style={{ fontSize: 23 }}>{a.icon}</Text>
          <View style={{ flex: 1 }}><Text style={{ color: '#e2e8f0', fontWeight: '700', fontSize: 13 }}>{a.label}</Text>
            <Text style={styles.sub}>{a.sub}</Text></View>
        </Pressable>)}
      </View>
      <Text style={[styles.title, { marginTop: 22, fontSize: 18 }]}>Clinical activity log</Text>
      {logs.slice(0, 8).map((row, i) => <View key={i} style={styles.log}><Text style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 18 }}>{row}</Text></View>)}
      <Text style={[styles.sub, { marginTop: 15 }]}>Educational simulation only. Intervention explanations and physiology come from the same case model as the website.</Text>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1e293b', padding: 8, gap: 10 },
  icon: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' },
  hTitle: { color: '#f8fafc', fontSize: 17, fontWeight: '800' },
  sub: { color: '#94a3b8', fontSize: 11, lineHeight: 16 },
  label: { fontSize: 10, color: '#22d3ee', letterSpacing: 1, fontWeight: '800', marginBottom: 7 },
  title: { fontSize: 19, lineHeight: 26, fontWeight: '800', color: '#f8fafc', marginBottom: 6 },
  caseCard: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 17, padding: 15 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 9, gap: 7 },
  metric: { borderWidth: 1, borderColor: '#334155', backgroundColor: '#0f172a', borderRadius: 12, padding: 10, minWidth: 140, flexGrow: 1 },
  monitorButton: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', padding: 14, borderRadius: 12, gap: 10, alignItems: 'center', flexDirection: 'row', marginTop: 10, minHeight: 58 },
  warningCard: { backgroundColor: '#032b2b', borderWidth: 1, borderColor: '#065f46', borderRadius: 12, padding: 12, gap: 4, marginTop: 8 },
  tab: { paddingHorizontal: 15, borderRadius: 12, minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: '#334155', backgroundColor: '#0f172a' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 9, gap: 8 },
  action: { width: '47%', flexGrow: 1, minWidth: 138, minHeight: 76, backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 14, padding: 10, alignItems: 'center', flexDirection: 'row', gap: 8 },
  log: { backgroundColor: '#0f172a', borderRadius: 10, padding: 10, marginTop: 6, borderWidth: 1, borderColor: '#1e293b' },
});
