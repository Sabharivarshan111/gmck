import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ChevronDown, Layers, Search, Stethoscope } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Sheet } from '@/components/Sheet';
import { SCENARIOS } from '@simulator/engine/PhysiologyKernel';
import CLINICAL_DEPARTMENTS from '@/lib/nativeClinicalDepartments.json';

// KeyboardSafe is owned by NativeClinicalCase, including this search input.
export const CASE_NIGHT = { background: '#05070d', card: '#0e0e11', raised: '#1b1b21', border: '#34343a', ink: '#f5f5f7', muted: '#a6a6af', accent: '#e784fb', cyan: '#06b6d4' };
export const CASE_DAY = { background: '#f8fafc', card: '#ffffff', raised: '#f1f5f9', border: '#cbd5e1', ink: '#1e293b', muted: '#64748b', accent: '#0284c7', cyan: '#0284c7' };

export default function NativeCaseLibrary({ scenarioId, theme, onSelect, onOpen }: {
  scenarioId: string; theme: 'light' | 'dark'; onSelect: (id: string) => void; onOpen: (query: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [picker, setPicker] = useState(false);
  const palette = theme === 'light' ? CASE_DAY : CASE_NIGHT;
  const scenario = SCENARIOS.find(item => item.id === scenarioId) || SCENARIOS[0];
  const cases = useMemo(() => SCENARIOS.filter(item =>
    (department === 'all' || item.departmentId === department || item.category.toLowerCase().includes(department.toLowerCase())) &&
    (!query.trim() || [item.title, item.chiefComplaint, item.category, item.history].some(value => value?.toLowerCase().includes(query.toLowerCase())))), [department, query]);
  const open = (values: Record<string, string>) => onOpen(new URLSearchParams({ mode: 'case', scenario: scenarioId, ...values }).toString());
  return <>
    <View style={[styles.section, { borderColor: palette.border }]}>
      <Text style={[styles.kicker, { color: palette.accent }]}>🔴 NMC CBME MULTI-DEPARTMENT CLINICAL LIBRARY ({SCENARIOS.length} CASES)</Text>
      <Text style={[styles.title, { color: palette.ink }]}>{scenario.title}</Text>
      <Text numberOfLines={1} style={[styles.copy, { color: palette.muted }]}>{scenario.chiefComplaint}</Text>
      <View style={[styles.search, { backgroundColor: palette.raised, borderColor: palette.border }]}>
        <Search color={palette.muted} size={14} />
        <TextInput accessibilityLabel="Search clinical cases and symptoms" placeholder={`Search ${SCENARIOS.length} cases, symptoms...`} value={query} onChangeText={setQuery}
          placeholderTextColor="#64748b" style={{ flex: 1, color: palette.ink, fontSize: 16, padding: 0 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.departments} style={{ flexGrow: 0 }}>
        <Touchable label={`All ${SCENARIOS.length} clinical cases`} onPress={() => setDepartment('all')} style={[styles.department, { backgroundColor: department === 'all' ? palette.cyan : palette.raised }]}>
          <Text style={{ color: department === 'all' ? '#020617' : palette.ink, fontSize: 12, fontWeight: '800' }}>🌐 All ({SCENARIOS.length})</Text>
        </Touchable>
        {CLINICAL_DEPARTMENTS.filter(item => item.id !== 'all').map(item => <Touchable key={item.id} label={`Filter ${item.name}`} onPress={() => setDepartment(item.id)}
          style={[styles.department, { backgroundColor: department === item.id ? palette.cyan : palette.raised }]}>
          <Text style={{ color: department === item.id ? '#020617' : palette.ink, fontSize: 12, fontWeight: '700' }}>{item.icon} {item.name} ({SCENARIOS.filter(sc => sc.departmentId === item.id || sc.category === item.name).length})</Text>
        </Touchable>)}
      </ScrollView>
      <Text style={[styles.kicker, { color: palette.muted, marginTop: 12 }]}>SELECT CASE ({cases.length} FOUND):</Text>
      <Touchable label="Select clinical case" onPress={() => setPicker(true)} style={[styles.select, { backgroundColor: palette.raised, borderColor: palette.border }]}>
        <Text numberOfLines={1} style={{ flex: 1, color: palette.ink, fontSize: 16, fontWeight: '700' }}>[{scenario.category}] {scenario.title}</Text><ChevronDown size={16} color={palette.muted} />
      </Touchable>
    </View>
    <Text style={[styles.badge, { color: palette.ink, backgroundColor: palette.raised, borderColor: palette.border }]}>Department: {scenario.category}</Text>
    <Text style={[styles.badge, { color: theme === 'light' ? '#065f46' : '#6ee7b7', borderColor: '#065f46', backgroundColor: theme === 'light' ? '#ecfdf5' : '#032b22' }]}>✓ Target Rx: {scenario.targetInterventions.join(', ')}</Text>
    <Text style={[styles.badge, { borderRadius: 0, color: theme === 'light' ? '#9f1239' : '#fda4af', borderColor: '#9f1239', backgroundColor: theme === 'light' ? '#fff1f2' : '#2f101b' }]}>⚠ Lethal Errors: {scenario.lethalTriggers.join(', ')}</Text>
    <View style={[styles.box, { borderColor: palette.border, backgroundColor: theme === 'light' ? '#f8fafc' : '#000000' }]}>
      <View style={styles.heading}><Layers color={palette.accent} size={16} /><Text style={[styles.headingText, { color: palette.ink }]}>Anatomical 3D Systems</Text><Text style={[styles.kicker, { color: palette.muted }]}>5 LAYERS</Text></View>
      <View style={styles.grid}>{[{ id: 'glass', title: 'Glass' }, { id: 'skin', title: 'Skin' }, { id: 'vascular', title: 'Vessels' }, { id: 'viscera', title: 'Viscera' }, { id: 'skeletal', title: 'Skeleton' }].map(item =>
        <Touchable key={item.id} label={`Open ${item.title} anatomy layer`} onPress={() => open({ mode: 'anatomy', layer: item.id })}
          style={[styles.layer, { backgroundColor: item.id === 'glass' ? palette.cyan : palette.card, borderColor: item.id === 'glass' ? palette.cyan : palette.border }]}>
          <Text style={{ color: item.id === 'glass' ? '#020617' : palette.muted, fontSize: 12, fontWeight: '800' }}>{item.title}</Text>
        </Touchable>)}</View>
    </View>
    <View style={[styles.box, { borderColor: palette.border, backgroundColor: theme === 'light' ? '#f8fafc' : '#000000' }]}>
      <View style={styles.heading}><Stethoscope color="#34d399" size={16} /><Text style={[styles.headingText, { color: palette.ink }]}>Bedside Diagnostics & POCUS</Text><Text style={[styles.kicker, { color: palette.muted }]}>MODAL TOOLS</Text></View>
      <View style={styles.grid}>{[{ id: 'pupil', title: '👁️ Pupil' }, { id: 'ultrasound', title: '📡 POCUS' }, { id: 'stethoscope', title: '🩺 Steth' }, { id: 'ecg12', title: '🫀 ECG' }, { id: 'radiology', title: '🩻 X-ray & MRI' }, { id: 'piccled', title: '🔎 General examination' }].map(item =>
        <Touchable key={item.id} label={`Open ${item.title} diagnostic tool`} onPress={() => open({ tool: item.id })} style={[styles.tool, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '700' }}>{item.title}</Text>
        </Touchable>)}</View>
    </View>
    <Sheet visible={picker} title="Select clinical case" onClose={() => setPicker(false)} contentStyle={{ backgroundColor: palette.card, paddingHorizontal: 12 }}>
      {cases.length === 0 && <Text>No cases match this search.</Text>}
      {cases.map(item => <Touchable key={item.id} label={`Select ${item.title}`} onPress={() => { onSelect(item.id); setPicker(false); }} style={{ paddingVertical: 12 }}>
        <Text style={{ color: palette.ink, fontWeight: '700' }}>[{item.category}] {item.title}</Text>
      </Touchable>)}
    </Sheet>
  </>;
}

const styles = StyleSheet.create({
  section: { paddingBottom: 10, borderBottomWidth: 1, gap: 5 },
  kicker: { fontSize: 12, letterSpacing: 0.6, fontWeight: '800', lineHeight: 18 },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '900' },
  copy: { fontSize: 12, lineHeight: 16 },
  search: { minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  departments: { gap: 6, paddingTop: 8, paddingBottom: 8 },
  department: { minHeight: 44, paddingHorizontal: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  select: { minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  badge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, lineHeight: 16, fontWeight: '700', marginTop: 8 },
  box: { borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  headingText: { flex: 1, fontSize: 12, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  layer: { width: '32%', minHeight: 44, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tool: { width: '49%', minHeight: 44, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
