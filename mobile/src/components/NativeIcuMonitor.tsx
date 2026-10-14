/**
 * Actual React Native bedside telemetry. No HTML, remote URL or canvas WebView.
 * Uses the exact PhysiologyKernel class from the Vercel source tree. This is
 * a real, functional offline port of the 4-channel ICU monitor; additional
 * web tutorial/audio controls are tracked separately as not yet ported.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, BackHandler, Pressable, ScrollView, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { ArrowLeft, RotateCcw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Text } from '@/components/Text';
import { PhysiologyKernel, SCENARIOS } from '@simulator/engine/PhysiologyKernel';
import type { PatientVitals, TelemetryWaveformSample } from '@simulator/types';

const W = 340;
const H = 360;
const BUFFER_LENGTH = 164;
type Channel = keyof Pick<TelemetryWaveformSample, 'ecg' | 'artLine' | 'pleth' | 'capno'>;
type SampleBuffer = TelemetryWaveformSample[];
const CHANNELS: { key: Channel; label: string; note: string; color: string; channel: number }[] = [
  { key: 'ecg', label: 'II', note: '1.0 mV/cm', color: '#00e676', channel: 0 },
  { key: 'artLine', label: 'ART', note: '0–200 mmHg', color: '#ff1744', channel: 1 },
  { key: 'pleth', label: 'PLETH', note: 'SpO2 %', color: '#00e5ff', channel: 2 },
  { key: 'capno', label: 'CO2', note: '0–50 mmHg', color: '#ffd600', channel: 3 },
];

const fmt = (n: number) => String(Math.round(n));
// A monitor must not advance the patient's clock simply by being opened.
// Fill the display with real incoming samples; a new trace starts empty.
const initialBuffer = (): SampleBuffer => [];

const scaleValue = (s: TelemetryWaveformSample, channel: Channel): number => {
  if (channel === 'ecg') return s.ecg / 1.7;
  if (channel === 'artLine') return (s.artLine - 80) / 95;
  if (channel === 'pleth') return s.pleth;
  return s.capno / 50;
};
export function channelPath(samples: SampleBuffer, channel: Channel, bandIndex: number): string {
  if (!samples.length) return '';
  const center = (bandIndex + 0.64) * (H / 4);
  const amplitude = bandIndex === 1 ? 28 : 25;
  return samples.map((p, i) => {
    const x = (i / Math.max(1, BUFFER_LENGTH - 1)) * W;
    const y = center - scaleValue(p, channel) * amplitude;
    return `${i ? 'L' : 'M'} ${x.toFixed(1)} ${Math.max(3, Math.min(H - 3, y)).toFixed(1)}`;
  }).join(' ');
}

function Metric({ label, secondary, value, color, alert }: {
  label: string; secondary: string; value: string; color: string; alert?: boolean;
}) {
  return <View style={[styles.metric, { borderColor: color + '45' }]}>
    <View style={{ flex: 1 }}>
      <Text style={{ color, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{label}</Text>
      <Text style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{secondary}</Text>
    </View>
    <Text style={{ color: alert ? '#ef4444' : color, fontSize: 26, fontWeight: '800' }}>{value}</Text>
  </View>;
}

export interface NativeIcuMonitorProps {
  scenarioId?: string;
  /** Optional shared case engine: preserves intervention effects in monitor. */
  engine?: PhysiologyKernel;
  onBack: () => void;
}

export default function NativeIcuMonitor({ scenarioId = 'normal', engine, onBack }: NativeIcuMonitorProps) {
  const { width } = useWindowDimensions();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const kernel = useRef(engine ?? new PhysiologyKernel(scenarioId));
  const [vitals, setVitals] = useState<PatientVitals>(() => ({ ...kernel.current.getLiveVitals() }));
  const [rhythm, setRhythm] = useState(() => kernel.current.pathology.ecgRhythm);
  const [samples, setSamples] = useState<SampleBuffer>(() => initialBuffer());
  const [running, setRunning] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const chosen = SCENARIOS.find(s => s.id === scenarioId) ?? SCENARIOS[0];

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
    if (!engine) kernel.current.setScenario(scenarioId);
    setVitals({ ...kernel.current.getLiveVitals() });
    setRhythm(kernel.current.pathology.ecgRhythm);
    setSamples(initialBuffer());
  }, [scenarioId, engine]);
  useEffect(() => {
    if (!running || !active || !focused) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(0.25, Math.max(0.01, (now - last) / 1000));
      last = now;
      const next: SampleBuffer = [];
      const slices = Math.max(1, Math.min(15, Math.round(dt / 0.012)));
      for (let i = 0; i < slices; i++) {
        kernel.current.tick(dt / slices);
        next.push(kernel.current.sampleWaveforms());
      }
      setSamples(previous => [...previous, ...next].slice(-BUFFER_LENGTH));
      setVitals({ ...kernel.current.getLiveVitals() });
      setRhythm(kernel.current.pathology.ecgRhythm);
    }, 90);
    return () => clearInterval(timer);
  }, [running, active, focused]);

  const paths = useMemo(() => CHANNELS.map(c => channelPath(samples, c.key, c.channel)), [samples]);
  const waveWidth = Math.max(300, Math.min(width - 30, 720));
  return (
    <View testID="native-icu-monitor" style={[styles.screen, { paddingTop: insets.top }]} >
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Pressable testID="native-icu-back" accessibilityRole="button" accessibilityLabel="Back to clinical studio" style={styles.headButton} onPress={onBack}>
          <ArrowLeft color="#e2e8f0" size={21} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>ICU monitor</Text>
          <Text style={{ color: '#94a3b8', fontSize: 11 }} numberOfLines={1}>{chosen.title}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Reset telemetry" onPress={() => {
          kernel.current.setScenario(scenarioId);
          setRhythm(kernel.current.pathology.ecgRhythm);
          setSamples(initialBuffer());
          setVitals({ ...kernel.current.getLiveVitals() });
        }} style={styles.headButton}><RotateCcw color="#cbd5e1" size={19} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.monitor}>
          <View style={styles.status}>
            <View style={styles.statusDot} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#34d399' }}>SWEEP 25 mm/s</Text>
            <Text style={{ color: '#64748b', fontSize: 11 }}> | </Text>
            <Text testID="native-icu-rhythm" style={{ fontSize: 11, color: rhythm === 'vfib' || rhythm === 'vtach' ? '#f87171' : '#6ee7b7', flex: 1 }}>
              Rhythm: {rhythm.toUpperCase().replace('_', ' ')}
            </Text>
            <Pressable testID="native-icu-pause" accessibilityRole="button" accessibilityLabel={running ? 'Pause monitor' : 'Resume monitor'} onPress={() => setRunning(v => !v)} style={styles.pause}>
              <Text style={{ color: '#cbd5e1', fontSize: 11 }}>{running ? 'Pause' : 'Resume'}</Text>
            </Pressable>
          </View>
          <View testID="native-icu-four-waveforms" style={[styles.waveContainer, { width: waveWidth }]}>
            <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
              {Array.from({ length: 12 }, (_, i) => <Line key={'v'+i} x1={i * 30} x2={i * 30} y1={0} y2={H} stroke="#1e293b" strokeOpacity={0.33} strokeWidth={0.5} />)}
              {Array.from({ length: 13 }, (_, i) => <Line key={'h'+i} x1={0} x2={W} y1={i * 30} y2={i * 30} stroke="#1e293b" strokeOpacity={0.33} strokeWidth={0.5} />)}
              {CHANNELS.map((c, i) => <Path key={c.key} d={paths[i]} stroke={c.color} strokeWidth={1.9} strokeLinecap="round" fill="none" />)}
            </Svg>
            {CHANNELS.map(c => <View pointerEvents="none" key={c.key} style={[styles.channelLabel, { top: c.channel * 90 + 7 }]}>
              <Text style={{ fontSize: 11, color: c.color, fontWeight: '800' }}>{c.label}</Text>
              <Text style={{ fontSize: 9, color: '#64748b', marginLeft: 5 }}>{c.note}</Text>
            </View>)}
          </View>
          <View style={styles.numbers}>
            <Metric label="ECG / HR" secondary="bpm (60–100)" value={fmt(vitals.heartRate)} color="#00e676" alert={vitals.heartRate < 50 || vitals.heartRate > 120} />
            <Metric label="NIBP / ART" secondary={`MAP (${fmt(vitals.meanArterialPressure)})`} value={`${fmt(vitals.bpSystolic)}/${fmt(vitals.bpDiastolic)}`} color="#ff1744" alert={vitals.bpSystolic < 90} />
            <Metric label="SpO2 / PLETH" secondary="Oxygen saturation" value={`${fmt(vitals.spo2)}%`} color="#00e5ff" alert={vitals.spo2 < 92} />
            <Metric label="RESP / ETCO2" secondary={`EtCO2 ${fmt(vitals.etco2)} mmHg`} value={fmt(vitals.respiratoryRate)} color="#ffd600" />
          </View>
        </View>
        <Text style={{ marginTop: 12, fontSize: 11, lineHeight: 17, color: '#94a3b8' }}>
          Offline physiology uses the same Vercel case kernel. Simulated educational traces; not a medical device. Audio and full ECG tutorial are not yet native.
        </Text>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155', gap: 10 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#f8fafc' },
  headButton: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  monitor: { backgroundColor: '#050811', borderWidth: 1, borderColor: '#1e293b', borderRadius: 18, padding: 8, marginTop: 10 },
  status: { flexDirection: 'row', alignItems: 'center', padding: 6, borderWidth: 1, borderColor: '#1e293b', borderRadius: 11, backgroundColor: '#0f172a', minHeight: 44, gap: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00e676' },
  pause: { minHeight: 34, paddingHorizontal: 9, justifyContent: 'center', borderWidth: 1, borderColor: '#334155', borderRadius: 9 },
  waveContainer: { backgroundColor: '#080c15', borderRadius: 8, alignSelf: 'center', marginVertical: 6, overflow: 'hidden' },
  channelLabel: { position: 'absolute', left: 8, flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 2, alignItems: 'center', backgroundColor: '#0f172acc', borderRadius: 5 },
  numbers: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 3 },
  metric: { width: '49%', flexGrow: 1, flexBasis: 145, backgroundColor: '#0f172a', padding: 10, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', minHeight: 76 },
});
