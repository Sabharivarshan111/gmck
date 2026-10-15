/**
 * Actual React Native bedside telemetry. No HTML, remote URL or canvas WebView.
 * Uses the exact PhysiologyKernel class from the Vercel source tree. This is
 * an offline port of the 4-channel ICU monitor and source oxygen-pitched tone.
 * The full web tutorial remains a separate teaching surface.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Pressable, ScrollView, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { GraduationCap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Text } from '@/components/Text';
import { PhysiologyKernel } from '@simulator/engine/PhysiologyKernel';
import OrbitSound from '@/native/NativeOrbitSound';
import CanonicalTeachingOverlay from '@/components/CanonicalTeachingOverlay';
import { restoreClinicalSnapshot } from '@/lib/clinicalSnapshot';
import { advanceNativeTelemetry } from '@/lib/nativeIcuSampling';
import { advanceIcuSweep, createIcuSweep, icuChannelPath } from '@/lib/nativeIcuDisplay';
import { NativeSimulatorHeader, NativeSimulatorTabs } from '@/components/NativeSimulatorChrome';
import { CASE_DAY, CASE_NIGHT } from '@/components/NativeCaseLibrary';
import type { PatientVitals } from '@simulator/types';

const CHANNELS = [
  { key: 'ecgY', label: 'II', note: '1.0 mV/cm', color: '#00e676', labelColor: '#34d399', top: '2%' },
  { key: 'artY', label: 'ART', note: '0 - 200 mmHg', color: '#ff1744', labelColor: '#ef4444', top: '26%' },
  { key: 'plethY', label: 'PLETH', note: 'SpO2 %', color: '#00e5ff', labelColor: '#e784fb', top: '52%' },
  { key: 'capnoY', label: 'CO2', note: '0 - 50 mmHg', color: '#ffd600', labelColor: '#facc15', top: '78%' },
] as const;
const fmt = (n: number) => String(Math.round(n));
function Metric({ label, secondary, value, color, border, alert, pressure, percent }: {
  label: string; secondary: string; value: string; color: string; border: string; alert?: boolean; pressure?: boolean; percent?: boolean;
}) {
  return <View style={[styles.metric, { borderColor: border, borderRadius: pressure ? 8 : 12 }]}>
    <View><Text style={[styles.mono, { color, fontSize: 10, fontWeight: '600', letterSpacing: 1 }]}>{label}</Text>
      <Text style={[styles.mono, { color: '#a6a6af', fontSize: 12, lineHeight: 16 }]}>{secondary}</Text></View>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}><Text style={[styles.mono, { color: alert ? '#ef4444' : color, fontSize: pressure ? 20 : 30, fontWeight: '900', lineHeight: 36 }]}>{value}</Text>{percent && <Text style={[styles.mono, { color: '#a6a6af', fontSize: 12 }]}>%</Text>}</View>
  </View>;
}

export interface NativeIcuMonitorProps {
  scenarioId?: string;
  /** Optional shared case engine: preserves intervention effects in monitor. */
  engine?: PhysiologyKernel;
  onBack: () => void;
  onExit?: () => void;
  onSkills?: () => void;
  onCase?: (patient: PhysiologyKernel) => void;
  onAnatomy?: (patient: PhysiologyKernel) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export default function NativeIcuMonitor({ scenarioId = 'normal', engine, onBack, onExit, onSkills, onCase, onAnatomy, theme = 'dark', onToggleTheme }: NativeIcuMonitorProps) {
  const { height } = useWindowDimensions();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [patient] = useState(() => engine ?? new PhysiologyKernel(scenarioId));
  const [vitals, setVitals] = useState<PatientVitals>(() => ({ ...patient.getLiveVitals() }));
  const [rhythm, setRhythm] = useState(() => patient.pathology.ecgRhythm);
  const [initialSweep] = useState(() => createIcuSweep(patient.getLiveVitals(), patient.pathology.ecgRhythm));
  const sweep = useRef(initialSweep);
  const [paths, setPaths] = useState(() => CHANNELS.map(c => icuChannelPath(initialSweep, c.key)));
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const toneEnabled = useRef(false);
  const lastBeep = useRef(0);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const palette = theme === 'light' ? CASE_DAY : CASE_NIGHT;
  const resetDisplay = useCallback(() => { sweep.current = createIcuSweep(patient.getLiveVitals(), patient.pathology.ecgRhythm); setPaths(CHANNELS.map(c => icuChannelPath(sweep.current, c.key))); }, [patient]);

  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!focused) return false;
      onBack();
      return true;
    });
    return () => back.remove();
  }, [focused, onBack]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!engine) patient.setScenario(scenarioId);
    setVitals({ ...patient.getLiveVitals() });
    setRhythm(patient.pathology.ecgRhythm);
    resetDisplay();
  }, [scenarioId, engine, patient, resetDisplay]);
  useEffect(() => {
    toneEnabled.current = audioEnabled;
    if (!audioEnabled || !active || !focused || tutorialOpen) OrbitSound?.stopMonitorTone();
    return () => OrbitSound?.stopMonitorTone();
  }, [audioEnabled, active, focused, tutorialOpen]);
  useEffect(() => {
    if (!active || !focused || tutorialOpen) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(0.25, Math.max(0.01, (now - last) / 1000));
      last = now;
      const next = advanceNativeTelemetry(patient, dt);
      // Resolve the R wave before decimating UI updates; one beep per beat.
      if (toneEnabled.current && next.some(sample => sample.ecg > 1.0) && now - lastBeep.current > 400) {
        lastBeep.current = now;
        OrbitSound?.monitorBeep(Math.max(300, 780 * patient.getLiveVitals().spo2 / 100));
      }

      setVitals({ ...patient.getLiveVitals() });
      setRhythm(patient.pathology.ecgRhythm);
    }, 90);
    return () => clearInterval(timer);
  }, [active, focused, patient, tutorialOpen]);

  // Display prefill is analytical, as in Vercel. It never ticks the case engine.
  useEffect(() => {
    if (!active || !focused || tutorialOpen) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      advanceIcuSweep(sweep.current, Math.min(0.25, (now - last) / 1000), patient.getLiveVitals(), patient.pathology.ecgRhythm);
      last = now;
      setPaths(CHANNELS.map(c => icuChannelPath(sweep.current, c.key)));
    }, 50);
    return () => clearInterval(timer);
  }, [active, focused, tutorialOpen, patient]);
  const stageHeight = Math.max(500, Math.min(0.72 * (height - insets.top - insets.bottom), 620)) - 8;
  return <View testID="native-icu-monitor" style={[styles.screen, { paddingTop: insets.top, backgroundColor: palette.background }]}>
    <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
    <NativeSimulatorHeader theme={theme} vitals={vitals} onExit={onExit ?? onBack} onMonitor={() => {}} onToggleTheme={onToggleTheme} />
    <ScrollView contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 34, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.monitor, { height: stageHeight, backgroundColor: theme === 'light' ? '#0f172a' : '#050811' }]}>
        <View style={styles.main}>
          <View style={[styles.statusShell, { backgroundColor: theme === 'light' ? '#0f172a' : '#0e0e11' }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.status} testID="native-icu-status-controls">
              <View style={styles.statusDot} /><Text style={[styles.mono, { color: '#34d399', fontSize: 10, fontWeight: '700' }]}>SWEEP 25 mm/s</Text>
              <Text style={{ color: theme === 'dark' ? '#a6a6af' : '#475569', fontSize: 10 }}>|</Text>
              <Text testID="native-icu-rhythm" style={{ color: '#cbd5e1', fontSize: 10 }}>Rhythm: <Text style={{ color: rhythm === 'vfib' || rhythm === 'vtach' ? '#ef4444' : rhythm.includes('stemi') ? '#fbbf24' : '#34d399', fontWeight: '900' }}>{rhythm.toUpperCase().replace('_', ' ')}</Text></Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Open ICU tutorial" onPress={() => setTutorialOpen(true)} style={styles.tutorial}><GraduationCap size={14} color="#fda4af" /><Text style={{ color: '#fda4af', fontSize: 10, fontWeight: '700' }}>🎓 Tutorial</Text></Pressable>
              <Pressable accessibilityRole="switch" accessibilityState={{ checked: audioEnabled, disabled: !OrbitSound }} accessibilityLabel={audioEnabled ? 'Mute monitor tone' : 'Enable monitor tone'} disabled={!OrbitSound} onPress={() => setAudioEnabled(value => !value)} style={[styles.tone, { backgroundColor: audioEnabled ? '#022c2299' : '#1b1b21', borderColor: audioEnabled ? '#10b981' : '#34343a' }]}><Text style={{ color: audioEnabled ? '#6ee7b7' : '#a6a6af', fontSize: 10, fontWeight: '600' }}>{audioEnabled ? '🔊 Tone ON' : '🔇 Muted'}</Text></Pressable>
            </ScrollView>
          </View>
          <View testID="native-icu-four-waveforms" style={styles.waveContainer}>
            <Svg width="100%" height="100%" viewBox="0 0 720 360" preserveAspectRatio="none">{CHANNELS.map((c, i) => <Path key={c.key} d={paths[i]} stroke={c.color} strokeWidth={2} fill="none" />)}</Svg>
            {CHANNELS.map(c => <View pointerEvents="none" key={c.key} style={[styles.channelLabel, { top: c.top }]}><Text style={[styles.mono, { fontSize: 10, color: theme === 'light' && c.key === 'plethY' ? '#22d3ee' : c.labelColor, fontWeight: '700' }]}>{c.label}</Text><Text style={[styles.mono, { fontSize: 10, color: '#a6a6af' }]}>{c.note}</Text></View>)}
          </View>
        </View>
        <View style={styles.numbers}>
          <View style={styles.metricRow}>
            <Metric label="ECG / HR" secondary="bpm (60-100)" value={fmt(vitals.heartRate)} color="#34d399" border="#064e3b99" alert={vitals.heartRate < 50 || vitals.heartRate > 120} />
            <Metric label="NIBP / ART" secondary={`MAP: (${fmt(vitals.meanArterialPressure)})`} value={`${fmt(vitals.bpSystolic)}/${fmt(vitals.bpDiastolic)}`} color="#f87171" border="#7f1d1d99" alert={vitals.bpSystolic < 90} pressure />
          </View>
          <View style={styles.metricRow}>
            <Metric label="SPO2" secondary="% (95-100)" value={fmt(vitals.spo2)} color={theme === 'dark' ? '#e784fb' : '#22d3ee'} border="#164e6399" alert={vitals.spo2 < 92} percent />
            <Metric label="RESP / ETCO2" secondary={`EtCO2: ${fmt(vitals.etco2)}`} value={fmt(vitals.respiratoryRate)} color="#facc15" border="#713f1299" alert={vitals.respiratoryRate > 28 || vitals.respiratoryRate < 10} />
          </View>
          <View style={styles.secondary}>
            {([{ label: 'CVP', value: vitals.cvp.toFixed(1), color: theme === 'dark' ? '#e784fb' : '#38bdf8' },
               { label: 'TEMP', value: vitals.temperature.toFixed(1) + '°', color: '#cbd5e1' },
               { label: 'LACTATE', value: vitals.lactate.toFixed(1), color: vitals.lactate > 4 ? '#f59e0b' : '#cbd5e1' }]).map((metric, i) => <React.Fragment key={metric.label}>{i > 0 && <Text style={[styles.mono, { color: '#334155', fontSize: 12 }]}>|</Text>}<View style={{ flex: 1, alignItems: 'center' }}><Text style={[styles.mono, { color: '#a6a6af', fontSize: 9, lineHeight: 14 }]}>{metric.label}</Text><Text style={[styles.mono, { color: metric.color, fontSize: 12, fontWeight: '700', lineHeight: 16 }]}>{metric.value}</Text></View></React.Fragment>)}
          </View>
        </View>
      </View>
    </ScrollView>
    <NativeSimulatorTabs theme={theme} selected="monitor" bottomInset={insets.bottom} onSkills={onSkills ?? onBack} onAnatomy={() => onAnatomy?.(patient)} onMonitor={() => {}} onCase={() => onCase ? onCase(patient) : onBack()} />
    {tutorialOpen && <CanonicalTeachingOverlay route={'/simulator?mode=telemetry&native_teaching=icu&nativeTheme=' + theme + '&scenario=' + scenarioId} patient={JSON.stringify(patient)} active={active && focused} onPatient={snapshot => { restoreClinicalSnapshot(patient, snapshot); }} onClose={() => { setTutorialOpen(false); setVitals({ ...patient.getLiveVitals() }); setRhythm(patient.pathology.ecgRhythm); resetDisplay(); }} />}
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  mono: { fontFamily: 'monospace' },
  monitor: { borderWidth: 1, borderColor: '#34343a', borderRadius: 16, overflow: 'hidden' },
  main: { flex: 1, minHeight: 0, padding: 8 },
  statusShell: { borderWidth: 1, borderColor: '#34343a', borderRadius: 12, overflow: 'hidden' },
  status: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  tutorial: { minHeight: 44, paddingHorizontal: 10, borderWidth: 1, borderColor: '#f43f5e66', backgroundColor: '#f43f5e33', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  tone: { minHeight: 44, paddingHorizontal: 10, borderWidth: 1, borderRadius: 12, justifyContent: 'center' },
  waveContainer: { flex: 1, minHeight: 230, backgroundColor: '#080c15', borderWidth: 1, borderColor: '#0f172a', borderRadius: 4, marginVertical: 6, overflow: 'hidden' },
  channelLabel: { position: 'absolute', left: 12, flexDirection: 'row', gap: 4, paddingHorizontal: 4, alignItems: 'center', backgroundColor: '#0e0e1199', borderRadius: 4 },
  numbers: { backgroundColor: '#080c14', borderTopWidth: 1, borderTopColor: '#34343a', padding: 8, gap: 6 },
  metricRow: { flexDirection: 'row', gap: 6 },
  metric: { flex: 1, minWidth: 0, backgroundColor: '#0e0e11', paddingHorizontal: 8, paddingVertical: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  secondary: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#34343acc', borderRadius: 8, backgroundColor: '#000', alignItems: 'center' },
});
