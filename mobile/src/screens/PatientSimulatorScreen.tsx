import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  BackHandler,
  Platform,
  Modal,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Activity,
  Heart,
  Layers,
  Sparkles,
  Zap,
  BookOpen,
  Stethoscope,
  Shield,
  Sun,
  Moon,
  ChevronRight,
  X,
  Compass,
  AlertCircle,
  Radio,
  FileText,
} from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { ORGAN_ANATOMY_DATABASE, type DetailedOrganAnatomy } from '../../../src/simulator/data/organAnatomyData';

interface PatientSimulatorScreenProps {
  onExit: () => void;
}

export default function PatientSimulatorScreen({ onExit }: PatientSimulatorScreenProps) {
  const { colors, theme: globalTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [localTheme, setLocalTheme] = useState<'light' | 'dark'>(
    globalTheme === 'light' ? 'light' : 'light' // default to clean white medical studio as requested
  );

  // Active tab on mobile: 'anatomy' | 'telemetry' | 'interventions' | 'diagnostics'
  const [activeTab, setActiveTab] = useState<'anatomy' | 'telemetry' | 'interventions' | 'diagnostics'>('anatomy');

  // Selected Organ for Deep Inspection
  const [selectedOrgan, setSelectedOrgan] = useState<DetailedOrganAnatomy | null>(null);
  const [organTab, setOrganTab] = useState<'overview' | 'vascular' | 'clinical' | 'lymphatics'>('overview');

  // Simulated Patient Vitals State
  const [vitals, setVitals] = useState({
    hr: 118,
    bpSys: 84,
    bpDia: 52,
    spo2: 94,
    rr: 26,
    temp: 37.8,
    gcs: 14,
  });

  const [activeScenario, setActiveScenario] = useState<string>('snakebite');
  const [logs, setLogs] = useState<string[]>([
    'Patient admitted: 42M with Russell viper bite right foot.',
    '20WBCT performed: INCOAGULABLE at 20 mins. Severe hemotoxicity.',
  ]);

  // Handle hardware back on Android
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedOrgan) {
        setSelectedOrgan(null);
        return true;
      }
      onExit();
      return true;
    });
    return () => sub.remove();
  }, [selectedOrgan, onExit]);

  // Heartbeat animation interval
  useEffect(() => {
    const interval = setInterval(() => {
      // Natural slight fluctuation
      setVitals(v => ({
        ...v,
        hr: Math.max(40, Math.min(180, v.hr + (Math.random() > 0.5 ? 1 : -1))),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyAction = (action: string) => {
    if (action === 'asv') {
      setVitals(v => ({ ...v, hr: 98, bpSys: 105, bpDia: 68, spo2: 97 }));
      setLogs(l => [
        `Infused 10 vials Indian Polyvalent ASV in 500mL NS over 1 hr. Clotting factors recovering.`,
        ...l,
      ]);
    } else if (action === 'saline') {
      setVitals(v => ({ ...v, bpSys: Math.min(130, v.bpSys + 16), bpDia: Math.min(85, v.bpDia + 10) }));
      setLogs(l => [`Rapid bolus 500mL 0.9% Normal Saline infused. CVP augmented.`, ...l]);
    } else if (action === 'atropine') {
      setVitals(v => ({ ...v, hr: Math.min(140, v.hr + 24) }));
      setLogs(l => [`IV Atropine 0.6mg administered. Muscarinic blockade achieved.`, ...l]);
    } else if (action === 'adrenaline') {
      setVitals(v => ({ ...v, hr: Math.min(160, v.hr + 35), bpSys: Math.min(160, v.bpSys + 30) }));
      setLogs(l => [`IM Adrenaline 0.5mg administered. Alpha/Beta agonist inotropy surged.`, ...l]);
    } else if (action === 'o2') {
      setVitals(v => ({ ...v, spo2: 99, rr: Math.max(16, v.rr - 4) }));
      setLogs(l => [`High-flow 15 L/min O2 via Non-Rebreather Mask initiated. PaO2 elevated.`, ...l]);
    }
  };

  const isLight = localTheme === 'light';
  const bg = isLight ? '#FFFFFF' : '#05070D';
  const cardBg = isLight ? '#F8FAFC' : '#0E131F';
  const borderCol = isLight ? '#E2E8F0' : '#1E293B';
  const textPrimary = isLight ? '#0F172A' : '#F8FAFC';
  const textMuted = isLight ? '#64748B' : '#94A3B8';

  const organList = Object.values(ORGAN_ANATOMY_DATABASE);

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: isLight ? '#FFFFFF' : '#090D18',
            borderBottomColor: borderCol,
          },
        ]}>
        <View style={styles.headerRow}>
          <Touchable
            onPress={onExit}
            label="Back to Notes"
            style={[
              styles.iconBtn,
              { backgroundColor: isLight ? '#F1F5F9' : '#1E293B', borderColor: borderCol },
            ]}>
            <ArrowLeft size={18} color={textPrimary} />
          </Touchable>

          <View style={styles.titleCol}>
            <View style={styles.titleRow}>
              <Text style={[styles.headerTitle, { color: textPrimary }]}>
                3D Patient Simulator
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: withAlpha('#0EA5E9', 0.15) },
                ]}>
                <Text style={styles.badgeText}>v8.5 PBR</Text>
              </View>
            </View>
            <Text style={[styles.headerSub, { color: textMuted }]}>
              NMC CBME Bedside Virtual Resuscitation
            </Text>
          </View>

          <Touchable
            onPress={() => setLocalTheme(isLight ? 'dark' : 'light')}
            label="Toggle theme"
            style={[
              styles.iconBtn,
              { backgroundColor: isLight ? '#F1F5F9' : '#1E293B', borderColor: borderCol },
            ]}>
            {isLight ? (
              <Moon size={16} color="#64748B" />
            ) : (
              <Sun size={16} color="#F59E0B" />
            )}
          </Touchable>
        </View>

        {/* Real-Time Vitals HUD Pill Bar */}
        <View style={[styles.vitalsBar, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <View style={styles.vitalItem}>
            <View style={styles.vitalLabelRow}>
              <Heart size={12} color="#EF4444" fill="#EF4444" />
              <Text style={[styles.vitalLabel, { color: textMuted }]}>HR</Text>
            </View>
            <Text style={[styles.vitalValue, { color: '#EF4444' }]}>{vitals.hr}</Text>
          </View>

          <View style={[styles.vitalDivider, { backgroundColor: borderCol }]} />

          <View style={styles.vitalItem}>
            <Text style={[styles.vitalLabel, { color: textMuted }]}>BP (NIBP)</Text>
            <Text style={[styles.vitalValue, { color: '#0EA5E9' }]}>
              {vitals.bpSys}/{vitals.bpDia}
            </Text>
          </View>

          <View style={[styles.vitalDivider, { backgroundColor: borderCol }]} />

          <View style={styles.vitalItem}>
            <Text style={[styles.vitalLabel, { color: textMuted }]}>SpO2</Text>
            <Text style={[styles.vitalValue, { color: '#10B981' }]}>{vitals.spo2}%</Text>
          </View>

          <View style={[styles.vitalDivider, { backgroundColor: borderCol }]} />

          <View style={styles.vitalItem}>
            <Text style={[styles.vitalLabel, { color: textMuted }]}>RR / GCS</Text>
            <Text style={[styles.vitalValue, { color: '#F59E0B' }]}>
              {vitals.rr} / E4V5M5
            </Text>
          </View>
        </View>

        {/* Segmented Tab Selector */}
        <View style={styles.tabRow}>
          {[
            { id: 'anatomy', label: '3D Anatomy', icon: Layers },
            { id: 'telemetry', label: 'Telemetry', icon: Activity },
            { id: 'interventions', label: 'Rx & Resuscitation', icon: Sparkles },
            { id: 'diagnostics', label: 'POCUS & Lab', icon: Stethoscope },
          ].map(tab => {
            const isCur = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <Touchable
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                label={tab.label}
                style={[
                  styles.tabBtn,
                  isCur && {
                    backgroundColor: '#0EA5E9',
                    shadowColor: '#0EA5E9',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                  },
                ]}>
                <Icon size={14} color={isCur ? '#FFFFFF' : textMuted} />
                <Text
                  style={[
                    styles.tabBtnText,
                    { color: isCur ? '#FFFFFF' : textMuted, fontWeight: isCur ? '700' : '500' },
                  ]}>
                  {tab.label}
                </Text>
              </Touchable>
            );
          })}
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.contentPad, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* TAB 1: 3D ANATOMY EXPLORER */}
        {activeTab === 'anatomy' && (
          <View style={styles.spaceCol}>
            {/* 3D Anatomical Body Stage Card */}
            <View
              style={[
                styles.bodyHeroCard,
                { backgroundColor: cardBg, borderColor: borderCol },
              ]}>
              <View style={styles.heroHeadRow}>
                <View style={styles.statusLive}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>CLINICAL STUDIO VIEWPORT</Text>
                </View>
                <Text style={[styles.heroSubText, { color: textMuted }]}>
                  PBR Shaders • Calibrated Cavities
                </Text>
              </View>

              <View style={styles.stageGraphicsPlaceholder}>
                <Layers size={44} color="#0EA5E9" />
                <Text style={[styles.stagePrompt, { color: textPrimary }]}>
                  Realistic Human Anatomical Model
                </Text>
                <Text style={[styles.stageSubPrompt, { color: textMuted }]}>
                  Cranium (y=1.58) • Mediastinum • Retroperitoneum
                </Text>
                <View style={styles.badgePillRow}>
                  <View style={[styles.pillBadge, { backgroundColor: withAlpha('#0EA5E9', 0.15) }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#0EA5E9' }}>
                      Skin Layer
                    </Text>
                  </View>
                  <View style={[styles.pillBadge, { backgroundColor: withAlpha('#10B981', 0.15) }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>
                      Viscera
                    </Text>
                  </View>
                  <View style={[styles.pillBadge, { backgroundColor: withAlpha('#EF4444', 0.15) }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>
                      Vessels
                    </Text>
                  </View>
                  <View style={[styles.pillBadge, { backgroundColor: withAlpha('#8B5CF6', 0.15) }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#8B5CF6' }}>
                      X-Ray Skeleton
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.instructionsBox, { backgroundColor: withAlpha('#0EA5E9', 0.08) }]}>
                <Text style={[styles.instructionsText, { color: '#0284C7' }]}>
                  👉 Tap any organ below to inspect its Arterial Supply, Venous Drainage, Innervation, Muscle Relations, and NMC CBME Viva Pearls.
                </Text>
              </View>
            </View>

            {/* Organ Selection Grid */}
            <Text style={[styles.sectionHeading, { color: textPrimary }]}>
              Anatomical Viscera & Systems ({organList.length})
            </Text>

            <View style={styles.organGrid}>
              {organList.map(organ => (
                <Touchable
                  key={organ.id}
                  onPress={() => {
                    setSelectedOrgan(organ);
                    setOrganTab('overview');
                  }}
                  label={`Inspect ${organ.name}`}
                  scaleTo={0.97}
                  style={[
                    styles.organCard,
                    { backgroundColor: cardBg, borderColor: borderCol },
                  ]}>
                  <View style={styles.organCardHead}>
                    <View
                      style={[
                        styles.organIconBox,
                        { backgroundColor: withAlpha('#0EA5E9', 0.15) },
                      ]}>
                      {organ.id === 'heart' ? (
                        <Heart size={18} color="#EF4444" />
                      ) : organ.id === 'brain' ? (
                        <Zap size={18} color="#8B5CF6" />
                      ) : (
                        <Layers size={18} color="#0EA5E9" />
                      )}
                    </View>
                    <View style={styles.organTextCol}>
                      <Text style={[styles.organTitle, { color: textPrimary }]} numberOfLines={1}>
                        {organ.name}
                      </Text>
                      <Text style={[styles.organSystem, { color: textMuted }]} numberOfLines={1}>
                        {organ.system}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[styles.organDescSnippet, { color: textMuted }]}
                    numberOfLines={2}>
                    {organ.surfaceLandmarks}
                  </Text>

                  <View style={styles.organCardFoot}>
                    <Text style={styles.inspectLink}>Inspect Anatomy</Text>
                    <ChevronRight size={14} color="#0EA5E9" />
                  </View>
                </Touchable>
              ))}
            </View>
          </View>
        )}

        {/* TAB 2: TELEMETRY & ICU MONITOR */}
        {activeTab === 'telemetry' && (
          <View style={styles.spaceCol}>
            <View
              style={[
                styles.icuBox,
                { backgroundColor: '#060911', borderColor: '#1E293B' },
              ]}>
              <View style={styles.icuHeader}>
                <View style={styles.icuSweepRow}>
                  <View style={styles.greenPulse} />
                  <Text style={styles.icuSweepText}>SWEEP 25 mm/s • LEAD II</Text>
                </View>
                <Text style={styles.icuRhythmText}>SINUS TACHYCARDIA</Text>
              </View>

              {/* Synthetic Waveform Simulation Lines */}
              <View style={styles.waveformContainer}>
                <View style={styles.waveChannel}>
                  <Text style={styles.waveChannelLabelGreen}>ECG II (1.0 mV/cm)</Text>
                  <View style={styles.simulatedTraceGreen} />
                </View>

                <View style={styles.waveChannel}>
                  <Text style={styles.waveChannelLabelRed}>ART (120/80 mmHg)</Text>
                  <View style={styles.simulatedTraceRed} />
                </View>

                <View style={styles.waveChannel}>
                  <Text style={styles.waveChannelLabelCyan}>PLETH (SpO2 94%)</Text>
                  <View style={styles.simulatedTraceCyan} />
                </View>

                <View style={styles.waveChannel}>
                  <Text style={styles.waveChannelLabelYellow}>CAPNO (EtCO2 35 mmHg)</Text>
                  <View style={styles.simulatedTraceYellow} />
                </View>
              </View>

              <View style={styles.icuFootVitals}>
                <View style={styles.icuBoxItem}>
                  <Text style={styles.icuBoxLabel}>ECG HR</Text>
                  <Text style={[styles.icuBoxVal, { color: '#10B981' }]}>{vitals.hr}</Text>
                </View>
                <View style={styles.icuBoxItem}>
                  <Text style={styles.icuBoxLabel}>ART BP</Text>
                  <Text style={[styles.icuBoxVal, { color: '#EF4444' }]}>
                    {vitals.bpSys}/{vitals.bpDia}
                  </Text>
                </View>
                <View style={styles.icuBoxItem}>
                  <Text style={styles.icuBoxLabel}>SpO2</Text>
                  <Text style={[styles.icuBoxVal, { color: '#06B6D4' }]}>{vitals.spo2}%</Text>
                </View>
                <View style={styles.icuBoxItem}>
                  <Text style={styles.icuBoxLabel}>RESP</Text>
                  <Text style={[styles.icuBoxVal, { color: '#FACC15' }]}>{vitals.rr}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 3: RESUSCITATION & PHARMACOTHERAPY */}
        {activeTab === 'interventions' && (
          <View style={styles.spaceCol}>
            <Text style={[styles.sectionHeading, { color: textPrimary }]}>
              Emergency Pharmacotherapy & Interventions
            </Text>

            <View style={styles.actionsGrid}>
              <Touchable
                onPress={() => handleApplyAction('asv')}
                label="Infuse 10 Vials ASV"
                style={[styles.actionBtn, { backgroundColor: cardBg, borderColor: '#10B981' }]}>
                <Text style={styles.actionEmoji}>🧪</Text>
                <Text style={[styles.actionTitle, { color: textPrimary }]}>10 Vials ASV</Text>
                <Text style={[styles.actionSub, { color: textMuted }]}>
                  Polyvalent Anti-Snake Venom
                </Text>
              </Touchable>

              <Touchable
                onPress={() => handleApplyAction('saline')}
                label="Infuse 500mL Normal Saline"
                style={[styles.actionBtn, { backgroundColor: cardBg, borderColor: '#0EA5E9' }]}>
                <Text style={styles.actionEmoji}>💧</Text>
                <Text style={[styles.actionTitle, { color: textPrimary }]}>IV Normal Saline</Text>
                <Text style={[styles.actionSub, { color: textMuted }]}>
                  500 mL Rapid Crystalloid
                </Text>
              </Touchable>

              <Touchable
                onPress={() => handleApplyAction('atropine')}
                label="Administer IV Atropine"
                style={[styles.actionBtn, { backgroundColor: cardBg, borderColor: '#8B5CF6' }]}>
                <Text style={styles.actionEmoji}>💉</Text>
                <Text style={[styles.actionTitle, { color: textPrimary }]}>Atropine 0.6mg</Text>
                <Text style={[styles.actionSub, { color: textMuted }]}>Vagolytic Inotrope</Text>
              </Touchable>

              <Touchable
                onPress={() => handleApplyAction('adrenaline')}
                label="Administer Adrenaline"
                style={[styles.actionBtn, { backgroundColor: cardBg, borderColor: '#EF4444' }]}>
                <Text style={styles.actionEmoji}>⚡</Text>
                <Text style={[styles.actionTitle, { color: textPrimary }]}>Adrenaline 1mg</Text>
                <Text style={[styles.actionSub, { color: textMuted }]}>Anaphylaxis / Arrest</Text>
              </Touchable>

              <Touchable
                onPress={() => handleApplyAction('o2')}
                label="High-Flow Oxygen"
                style={[styles.actionBtn, { backgroundColor: cardBg, borderColor: '#06B6D4' }]}>
                <Text style={styles.actionEmoji}>🫁</Text>
                <Text style={[styles.actionTitle, { color: textPrimary }]}>High-Flow O2</Text>
                <Text style={[styles.actionSub, { color: textMuted }]}>15 L/min via NRB Mask</Text>
              </Touchable>
            </View>

            {/* Event Log */}
            <View style={[styles.eventLogCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <Text style={[styles.eventLogTitle, { color: textPrimary }]}>
                Real-Time Clinical Response Log
              </Text>
              {logs.map((log, idx) => (
                <View key={idx} style={styles.logRow}>
                  <Text style={styles.logDot}>•</Text>
                  <Text style={[styles.logText, { color: textMuted }]}>{log}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TAB 4: DIAGNOSTICS & POCUS */}
        {activeTab === 'diagnostics' && (
          <View style={styles.spaceCol}>
            <Text style={[styles.sectionHeading, { color: textPrimary }]}>
              Bedside Diagnostic Examination Suite
            </Text>

            <View style={styles.diagCardsCol}>
              <View style={[styles.diagCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <View style={styles.diagHeadRow}>
                  <Radio size={20} color="#0EA5E9" />
                  <Text style={[styles.diagTitle, { color: textPrimary }]}>
                    Bedside POCUS Ultrasound (FAST Exam)
                  </Text>
                </View>
                <Text style={[styles.diagDesc, { color: textMuted }]}>
                  Hepatorenol recess (Morison pouch) evaluation: No anechoic free fluid collection detected. Inferior vena cava (IVC) collapsibility &gt; 50% indicating hypovolemia.
                </Text>
              </View>

              <View style={[styles.diagCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <View style={styles.diagHeadRow}>
                  <Stethoscope size={20} color="#10B981" />
                  <Text style={[styles.diagTitle, { color: textPrimary }]}>
                    Cardiopulmonary Auscultation
                  </Text>
                </View>
                <Text style={[styles.diagDesc, { color: textMuted }]}>
                  S1 and S2 heart sounds clear, physiological A2-P2 splitting. Tachycardia present. Clear bilateral vesicular breath sounds, no basal crepitations or bronchial breathing.
                </Text>
              </View>

              <View style={[styles.diagCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <View style={styles.diagHeadRow}>
                  <FileText size={20} color="#8B5CF6" />
                  <Text style={[styles.diagTitle, { color: textPrimary }]}>
                    Coagulation & 20WBCT Test
                  </Text>
                </View>
                <Text style={[styles.diagDesc, { color: textMuted }]}>
                  20-Minute Whole Blood Clotting Test: Incoagulable. Fibrinogen &lt; 50 mg/dL, D-Dimer &gt; 5000 ng/mL, Platelets 68,000/uL. Diagnostic of severe consumption coagulopathy (VICC).
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* APPLE-STYLE BOTTOM SHEET MODAL FOR ORGAN DETAILS */}
      <Modal
        visible={!!selectedOrgan}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedOrgan(null)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: isLight ? '#FFFFFF' : '#0B0F19',
                borderColor: borderCol,
                paddingBottom: insets.bottom + 20,
              },
            ]}>
            {/* Drag Handle */}
            <View style={styles.dragHandleRow}>
              <View style={[styles.dragHandle, { backgroundColor: isLight ? '#CBD5E1' : '#334155' }]} />
            </View>

            {/* Sheet Header */}
            {selectedOrgan && (
              <>
                <View style={styles.sheetHeader}>
                  <View style={styles.flex}>
                    <View style={styles.sheetBadgeRow}>
                      <Text style={styles.sheetSystemBadge}>{selectedOrgan.system}</Text>
                      <Text style={[styles.sheetLatinText, { color: textMuted }]}>
                        {selectedOrgan.latinName}
                      </Text>
                    </View>
                    <Text style={[styles.sheetTitle, { color: textPrimary }]}>
                      {selectedOrgan.name}
                    </Text>
                    <Text style={[styles.sheetSub, { color: textMuted }]}>
                      {selectedOrgan.quadrantOrCavity}
                    </Text>
                  </View>

                  <Touchable
                    onPress={() => setSelectedOrgan(null)}
                    label="Close"
                    style={[styles.closeBtn, { backgroundColor: isLight ? '#F1F5F9' : '#1E293B' }]}>
                    <X size={18} color={textPrimary} />
                  </Touchable>
                </View>

                {/* Tab Switcher */}
                <View style={[styles.sheetTabBar, { borderBottomColor: borderCol }]}>
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'vascular', label: 'Blood & Nerves' },
                    { id: 'clinical', label: 'Viva & Signs' },
                    { id: 'lymphatics', label: 'Lymph & Surgery' },
                  ].map(tab => {
                    const isCur = organTab === tab.id;
                    return (
                      <Touchable
                        key={tab.id}
                        onPress={() => setOrganTab(tab.id as any)}
                        label={tab.label}
                        style={[
                          styles.sheetTabItem,
                          isCur && { borderBottomColor: '#0EA5E9', borderBottomWidth: 2 },
                        ]}>
                        <Text
                          style={[
                            styles.sheetTabLabel,
                            { color: isCur ? '#0EA5E9' : textMuted, fontWeight: isCur ? '700' : '500' },
                          ]}>
                          {tab.label}
                        </Text>
                      </Touchable>
                    );
                  })}
                </View>

                {/* Sheet Body Scroll */}
                <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
                  {organTab === 'overview' && (
                    <View style={styles.sheetSectionCol}>
                      <View style={[styles.infoCard, { backgroundColor: isLight ? '#F0F9FF' : '#082F49' }]}>
                        <Text style={[styles.infoCardHead, { color: '#0284C7' }]}>
                          Surface Anatomical Landmarks
                        </Text>
                        <Text style={[styles.infoCardBody, { color: textPrimary }]}>
                          {selectedOrgan.surfaceLandmarks}
                        </Text>
                        <Text style={[styles.infoCardSub, { color: textMuted }]}>
                          Dimensions: {selectedOrgan.dimensionsAndWeight}
                        </Text>
                      </View>

                      <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 }]}>
                        <Text style={[styles.infoCardHead, { color: '#10B981' }]}>
                          Musculoskeletal & Peritoneal Relations
                        </Text>
                        {selectedOrgan.musculoskeletalRelations.map((rel, i) => (
                          <View key={i} style={styles.bulletRow}>
                            <Text style={{ color: '#10B981', marginRight: 6 }}>•</Text>
                            <Text style={[styles.bulletText, { color: textPrimary }]}>{rel}</Text>
                          </View>
                        ))}
                      </View>

                      <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 }]}>
                        <Text style={[styles.infoCardHead, { color: '#8B5CF6' }]}>
                          Histology & Microscopic Physiology
                        </Text>
                        <Text style={[styles.infoCardBody, { color: textPrimary }]}>
                          {selectedOrgan.histologyAndPhysiology}
                        </Text>
                      </View>
                    </View>
                  )}

                  {organTab === 'vascular' && (
                    <View style={styles.sheetSectionCol}>
                      <View style={[styles.infoCard, { backgroundColor: isLight ? '#FFF1F2' : '#4C0519' }]}>
                        <Text style={[styles.infoCardHead, { color: '#E11D48' }]}>
                          Arterial Blood Supply
                        </Text>
                        {selectedOrgan.arterialSupply.map((art, i) => (
                          <View key={i} style={styles.bulletRow}>
                            <Text style={{ color: '#E11D48', marginRight: 6 }}>•</Text>
                            <Text style={[styles.bulletText, { color: textPrimary }]}>{art}</Text>
                          </View>
                        ))}
                      </View>

                      <View style={[styles.infoCard, { backgroundColor: isLight ? '#EFF6FF' : '#172554' }]}>
                        <Text style={[styles.infoCardHead, { color: '#2563EB' }]}>
                          Venous Drainage
                        </Text>
                        {selectedOrgan.venousDrainage.map((vein, i) => (
                          <View key={i} style={styles.bulletRow}>
                            <Text style={{ color: '#2563EB', marginRight: 6 }}>•</Text>
                            <Text style={[styles.bulletText, { color: textPrimary }]}>{vein}</Text>
                          </View>
                        ))}
                      </View>

                      <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 }]}>
                        <Text style={[styles.infoCardHead, { color: '#D97706' }]}>
                          Nerve Supply & Pain Referral
                        </Text>
                        <Text style={[styles.bulletText, { color: textPrimary, marginBottom: 4 }]}>
                          <Text style={{ fontWeight: '700' }}>Sympathetic: </Text>
                          {selectedOrgan.innervation.sympathetic}
                        </Text>
                        <Text style={[styles.bulletText, { color: textPrimary, marginBottom: 4 }]}>
                          <Text style={{ fontWeight: '700' }}>Parasympathetic: </Text>
                          {selectedOrgan.innervation.parasympathetic}
                        </Text>
                        <Text style={[styles.bulletText, { color: textPrimary, marginBottom: 4 }]}>
                          <Text style={{ fontWeight: '700' }}>Sensory: </Text>
                          {selectedOrgan.innervation.somaticOrSensory}
                        </Text>
                        <Text style={[styles.bulletText, { color: '#D97706', fontWeight: '700' }]}>
                          Referred Pain: {selectedOrgan.innervation.referredPain}
                        </Text>
                      </View>
                    </View>
                  )}

                  {organTab === 'clinical' && (
                    <View style={styles.sheetSectionCol}>
                      <View style={[styles.infoCard, { backgroundColor: isLight ? '#ECFDF5' : '#064E3B' }]}>
                        <Text style={[styles.infoCardHead, { color: '#059669' }]}>
                          Bedside Physical Examination Signs
                        </Text>
                        {selectedOrgan.clinicalBedsideSigns.map((sign, i) => (
                          <View key={i} style={styles.bulletRow}>
                            <Text style={{ color: '#059669', marginRight: 6 }}>•</Text>
                            <Text style={[styles.bulletText, { color: textPrimary }]}>{sign}</Text>
                          </View>
                        ))}
                      </View>

                      <View style={[styles.infoCard, { backgroundColor: isLight ? '#EEF2FF' : '#1E1B4B' }]}>
                        <Text style={[styles.infoCardHead, { color: '#4F46E5' }]}>
                          High-Yield NMC CBME Viva Questions & Traps
                        </Text>
                        {selectedOrgan.nmcMbbssVivaPearls.map((pearl, i) => (
                          <View key={i} style={[styles.bulletRow, { marginBottom: 8 }]}>
                            <Text style={[styles.bulletText, { color: textPrimary, fontSize: 13 }]}>
                              {pearl}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 }]}>
                        <Text style={[styles.infoCardHead, { color: '#64748B' }]}>
                          Radiology & Ultrasound
                        </Text>
                        <Text style={[styles.bulletText, { color: textPrimary }]}>
                          {selectedOrgan.radiologicalCorrelation}
                        </Text>
                      </View>
                    </View>
                  )}

                  {organTab === 'lymphatics' && (
                    <View style={styles.sheetSectionCol}>
                      <View style={[styles.infoCard, { backgroundColor: isLight ? '#F0FDFA' : '#134E4A' }]}>
                        <Text style={[styles.infoCardHead, { color: '#0D9488' }]}>
                          Lymphatic Drainage & Staging
                        </Text>
                        {selectedOrgan.lymphaticDrainage.map((lym, i) => (
                          <View key={i} style={styles.bulletRow}>
                            <Text style={{ color: '#0D9488', marginRight: 6 }}>•</Text>
                            <Text style={[styles.bulletText, { color: textPrimary }]}>{lym}</Text>
                          </View>
                        ))}
                      </View>

                      <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 }]}>
                        <Text style={[styles.infoCardHead, { color: '#E11D48' }]}>
                          Surgical Approaches & Incisions
                        </Text>
                        <Text style={[styles.bulletText, { color: textPrimary }]}>
                          {selectedOrgan.surgicalApproaches}
                        </Text>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0EA5E9',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  vitalsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  vitalItem: {
    alignItems: 'center',
  },
  vitalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  vitalLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  vitalValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 1,
  },
  vitalDivider: {
    width: 1,
    height: 20,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tabBtnText: {
    fontSize: 11,
  },
  contentPad: {
    padding: 16,
  },
  spaceCol: {
    gap: 16,
  },
  bodyHeroCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  heroHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  heroSubText: {
    fontSize: 10,
  },
  stageGraphicsPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  stagePrompt: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  stageSubPrompt: {
    fontSize: 12,
    marginTop: 2,
  },
  badgePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  instructionsBox: {
    padding: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  instructionsText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  organGrid: {
    gap: 10,
  },
  organCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  organCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  organIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organTextCol: {
    flex: 1,
  },
  organTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  organSystem: {
    fontSize: 11,
  },
  organDescSnippet: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
  },
  organCardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  inspectLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0EA5E9',
  },
  // ICU Monitor Screen styles
  icuBox: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  icuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  icuSweepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  icuSweepText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#10B981',
    fontWeight: '700',
  },
  icuRhythmText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#EF4444',
    fontWeight: '800',
  },
  waveformContainer: {
    paddingVertical: 14,
    gap: 12,
  },
  waveChannel: {
    gap: 4,
  },
  waveChannelLabelGreen: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#10B981',
  },
  simulatedTraceGreen: {
    height: 28,
    borderBottomWidth: 2,
    borderBottomColor: '#10B981',
    borderStyle: 'dashed',
  },
  waveChannelLabelRed: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#EF4444',
  },
  simulatedTraceRed: {
    height: 28,
    borderBottomWidth: 2,
    borderBottomColor: '#EF4444',
  },
  waveChannelLabelCyan: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#06B6D4',
  },
  simulatedTraceCyan: {
    height: 28,
    borderBottomWidth: 2,
    borderBottomColor: '#06B6D4',
  },
  waveChannelLabelYellow: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#FACC15',
  },
  simulatedTraceYellow: {
    height: 28,
    borderBottomWidth: 2,
    borderBottomColor: '#FACC15',
  },
  icuFootVitals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  icuBoxItem: {
    alignItems: 'center',
  },
  icuBoxLabel: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#64748B',
  },
  icuBoxVal: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '900',
    marginTop: 2,
  },
  // Resuscitation Action Buttons
  actionsGrid: {
    gap: 10,
  },
  actionBtn: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionSub: {
    fontSize: 11,
    marginTop: 1,
  },
  eventLogCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  eventLogTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  logDot: {
    fontSize: 14,
    color: '#0EA5E9',
  },
  logText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  // Diagnostic Cards
  diagCardsCol: {
    gap: 10,
  },
  diagCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  diagHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diagTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  diagDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  // Bottom Sheet Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '85%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  dragHandleRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  sheetBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sheetSystemBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  sheetLatinText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  sheetSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  sheetTabItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  sheetTabLabel: {
    fontSize: 12,
  },
  sheetBody: {
    flex: 1,
    padding: 16,
  },
  sheetSectionCol: {
    gap: 12,
  },
  infoCard: {
    padding: 14,
    borderRadius: 16,
    gap: 6,
  },
  infoCardHead: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCardBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoCardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  bulletText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
});
