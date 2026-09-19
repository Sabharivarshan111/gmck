import { guidePoints } from '@/lib/guidePoints';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Edit3,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  Maximize2,
  MessageSquare,
  Minimize2,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Stethoscope,
  Trash2,
  X,
} from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { GeneralExamSigns } from '@/components/GeneralExamSigns';
import { GeneralExamSheet } from '@/components/GeneralExamSheet';
import { LabValuesSheet } from '@/components/LabValuesSheet';
import { useTheme, withAlpha } from '@/theme';
import {
  CLINICAL_PROFORMAS,
  resolveProformaDiagramUrl,
  type ClinicalProforma,
} from '@/lib/clinicalProformas';
import {
  autoFillClinicalCase,
  getCanonicalCaseDraft,
  type PatientClerkingDraft,
} from '@/lib/clinicalAutoFill';
import { askAi, type HistoryEntry } from '@/lib/askAi';

export interface ClinicalProformaModalProps {
  visible: boolean;
  onClose: () => void;
  initialProformaId?: string;
}

const SYSTEMS = [
  'All',
  'General Medicine',
  'General Surgery',
  'Pediatrics',
  'Orthopaedics',
  'Obstetrics & Gynaecology',
  'ENT',
  'Ophthalmology',
] as const;

/**
 * One colour per department, as a lookup.
 *
 * This was a five-deep nested ternary repeated twice — once for the tint and
 * once for the ink — and adding a department meant editing both ladders in the
 * right place or getting a card that silently rendered pink. A map is the same
 * information with the failure mode removed.
 *
 * `null` means "use the theme's primary", because a custom theme's accent has
 * to reach these cards the same way it reaches the subject cards; the fixed
 * hues belong to departments that already had one.
 */
const SYSTEM_COLOUR: Record<string, string | null> = {
  'General Medicine': null,
  'General Surgery': '#d97706',
  Pediatrics: '#8b5cf6',
  Orthopaedics: '#10b981',
  'Obstetrics & Gynaecology': '#ec4899',
  ENT: '#0ea5e9',
  Ophthalmology: '#14b8a6',
};

type DetailTab = 'guide' | 'clerk' | 'viva';

interface ChatBubble {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export function ClinicalProformaModal({
  visible,
  onClose,
  initialProformaId,
}: ClinicalProformaModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedSystem, setSelectedSystem] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProforma, setActiveProforma] = useState<ClinicalProforma | null>(() => {
    if (initialProformaId) {
      return CLINICAL_PROFORMAS.find(p => p.id === initialProformaId) ?? null;
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<DetailTab>('guide');
  /* Collapsed by default. Every proforma carries this same block, so left
   * open it would push each case's own sections a screen and a half down —
   * the general examination is the thing you already know how to find. */
  const [signsOpen, setSignsOpen] = useState(false);
  /* The two references a student needs WHILE clerking rather than after it,
   * reachable without opening a case sheet they did not want. */
  const [examSheetOpen, setExamSheetOpen] = useState(false);
  const [labSheetOpen, setLabSheetOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<{ uri: string; title: string } | null>(
    null,
  );

  // Clerking draft state for current proforma
  const [draft, setDraft] = useState<PatientClerkingDraft>(() =>
    activeProforma ? getCanonicalCaseDraft(activeProforma.id) : getCanonicalCaseDraft('cvs_proforma'),
  );
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [savedLocally, setSavedLocally] = useState(false);

  // Progressive disclosure keeps long master proformas readable on a phone.
  const [expandedGuideSections, setExpandedGuideSections] = useState<Record<number, boolean>>({
    0: true,
  });
  const [normalValuesOpen, setNormalValuesOpen] = useState(false);
  const [aiAssistOpen, setAiAssistOpen] = useState(false);

  // Accordion state for Viva Questions
  const [expandedViva, setExpandedViva] = useState<Record<number, boolean>>({ 0: true });

  // Persistent Bottom AI Chatbox state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatBubble[]>([]);
  const chatScrollRef = useRef<any>(null);

  // Load saved draft when activeProforma changes
  useEffect(() => {
    if (!activeProforma) return;
    let cancelled = false;
    const storageKey = `@orbit_proforma_case_${activeProforma.id}`;

    AsyncStorage.getItem(storageKey)
      .then(raw => {
        if (cancelled) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setDraft(parsed);
          } catch {
            setDraft(getCanonicalCaseDraft(activeProforma.id));
          }
        } else {
          setDraft(getCanonicalCaseDraft(activeProforma.id));
        }
        setSavedLocally(true);
      })
      .catch(() => {
        if (!cancelled) {
          setDraft(getCanonicalCaseDraft(activeProforma.id));
        }
      });

    // Prefer the General Physical Examination section when a case opens; keep
    // every other long section collapsed until the student asks for it.
    const generalExamIndex = activeProforma.sections.findIndex(section =>
      /general\s+(physical\s+)?examination/i.test(section.title),
    );
    setExpandedGuideSections({ [generalExamIndex >= 0 ? generalExamIndex : 0]: true });
    setNormalValuesOpen(false);
    setAiAssistOpen(false);

    // Reset expanded viva to first item and clear active chat when changing proforma
    setExpandedViva({ 0: true });
    setChatMessages([]);

    return () => {
      cancelled = true;
    };
  }, [activeProforma]);

  // Update a single draft field and persist to AsyncStorage
  const updateDraft = useCallback(
    (field: keyof PatientClerkingDraft, value: string) => {
      if (!activeProforma) return;
      const key = `@orbit_proforma_case_${activeProforma.id}`;
      setDraft(prev => {
        const next = { ...prev, [field]: value, updatedAt: new Date().toISOString() };
        AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
        return next;
      });
      setSavedLocally(true);
    },
    [activeProforma],
  );

  // AI Auto-Fill for Half-Completed Cases (Night-before-presentation feature)
  const handleAutoFill = useCallback(async () => {
    if (!activeProforma) return;
    setIsAutoFilling(true);
    try {
      const filled = await autoFillClinicalCase(
        activeProforma.id,
        draft,
        activeProforma.title,
        activeProforma.system,
      );
      setDraft(filled);
      await AsyncStorage.setItem(
        `@orbit_proforma_case_${activeProforma.id}`,
        JSON.stringify(filled),
      );
      setSavedLocally(true);
    } catch (e) {
      Alert.alert('Auto-Fill', 'Could not complete auto-fill: ' + (e as Error).message);
    } finally {
      setIsAutoFilling(false);
    }
  }, [activeProforma, draft]);

  // Reset / Clear Draft
  const handleResetDraft = useCallback(() => {
    if (!activeProforma) return;
    Alert.alert(
      'Reset Clerking Draft',
      'Are you sure you want to clear this clerked case? This will reset the patient record on your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const fresh = getCanonicalCaseDraft(activeProforma.id);
            setDraft(fresh);
            await AsyncStorage.removeItem(`@orbit_proforma_case_${activeProforma.id}`);
          },
        },
      ],
    );
  }, [activeProforma]);

  // Bottom AI Chatbox Send
  const handleSendMessage = useCallback(
    async (textOverride?: string) => {
      const query = (textOverride ?? chatInput).trim();
      if (!query || chatBusy || !activeProforma) return;

      setChatInput('');
      const userBubble: ChatBubble = {
        id: String(Date.now()),
        role: 'user',
        text: query,
      };

      setChatMessages(prev => [...prev, userBubble]);
      setChatBusy(true);

      const history: HistoryEntry[] = chatMessages.slice(-6).map(m => ({
        role: m.role,
        content: m.text,
      }));

      const contextPrompt = `Triple-tapped: MBBS Clinical Case Discussion.
Proforma: ${activeProforma.title} (${activeProforma.system} - ${activeProforma.department}).
Student Clerked Patient: ${draft.patientInitials || 'Patient'}, ${draft.age || ''} ${draft.sex || ''}.
Chief complaints: "${draft.chiefComplaints || 'Not entered'}"
Diagnosis: "${draft.provisionalDiagnosis || 'Not finalized'}"
Student Question: ${query}

Provide a concise, high-yield, examiner-grade response suitable for bedside MBBS practical exam presentation.`;

      try {
        const res = await askAi(contextPrompt, history);
        setChatMessages(prev => [
          ...prev,
          { id: String(Date.now() + 1), role: 'assistant', text: res.text },
        ]);
      } catch {
        // High-yield offline fallback
        const matchingViva = activeProforma.vivaQuestions.find(
          v =>
            v.question.toLowerCase().includes(query.toLowerCase()) ||
            v.answer.toLowerCase().includes(query.toLowerCase()),
        );

        const reply = matchingViva
          ? `**${matchingViva.question}**\n\n${matchingViva.answer}${
              matchingViva.examinerTip ? `\n\n💡 *Examiner Tip:* ${matchingViva.examinerTip}` : ''
            }`
          : `Regarding **${activeProforma.title}**:\n- Systematic Presentation Sequence: Demographics -> Chief Complaints (with duration) -> HPI -> General Examination (Vitals, Pallor, Icterus, Cyanosis, Clubbing, Lymphadenopathy, Edema) -> Systemic Findings -> Provisional Diagnosis.\n\n💡 *Exam Pearl:* ${activeProforma.examPearl}`;

        setChatMessages(prev => [
          ...prev,
          { id: String(Date.now() + 1), role: 'assistant', text: reply },
        ]);
      } finally {
        setChatBusy(false);
        setTimeout(() => {
          chatScrollRef.current?.scrollToEnd({ animated: true });
        }, 150);
      }
    },
    [activeProforma, chatBusy, chatInput, chatMessages, draft],
  );

  // Filtered proformas list
  const filteredProformas = useMemo(() => {
    return CLINICAL_PROFORMAS.filter(p => {
      if (selectedSystem !== 'All' && p.system !== selectedSystem) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchSummary = p.summary.toLowerCase().includes(q);
        const matchDept = p.department.toLowerCase().includes(q);
        const matchSections = p.sections.some(s =>
          s.items.some(
            it =>
              it.label.toLowerCase().includes(q) ||
              it.description.toLowerCase().includes(q) ||
              it.checklist?.some(c => c.toLowerCase().includes(q)),
          ),
        );
        const matchViva = p.vivaQuestions.some(
          v => v.question.toLowerCase().includes(q) || v.answer.toLowerCase().includes(q),
        );
        return matchTitle || matchSummary || matchDept || matchSections || matchViva;
      }
      return true;
    });
  }, [selectedSystem, searchQuery]);

  // System category counts
  /**
   * The filtered list, grouped by department.
   *
   * The picker was a flat list, and at twelve cases that was fine. At FORTY it
   * is a wall: forty near-identical rows with no structure, so finding the case
   * you are posted to means reading all of them. Grouping gives the eye
   * something to skip by, and it costs nothing — the same cards, in the same
   * order, with a heading every few rows.
   *
   * Headings are suppressed while a search is running. A search result is
   * already a short list and the user is looking at relevance rather than at
   * department, so headings there would be furniture around three rows.
   */
  const groupedProformas = useMemo(() => {
    const order = SYSTEMS.filter(s => s !== 'All') as string[];
    const groups = new Map<string, typeof filteredProformas>();
    for (const proforma of filteredProformas) {
      const list = groups.get(proforma.system);
      if (list) {
        list.push(proforma);
      } else {
        groups.set(proforma.system, [proforma]);
      }
    }
    return order
      .filter(sys => groups.has(sys))
      .map(sys => ({ system: sys, items: groups.get(sys) ?? [] }));
  }, [filteredProformas]);

  /* One heading per department is noise when there is only one department on
   * screen — which is exactly what the filter pills produce. */
  const showGroupHeadings =
    !searchQuery.trim() && selectedSystem === 'All' && groupedProformas.length > 1;

  const systemCounts = useMemo(() => {
    const counts: Record<string, number> = { All: CLINICAL_PROFORMAS.length };
    for (const sys of SYSTEMS) {
      if (sys === 'All') continue;
      counts[sys] = CLINICAL_PROFORMAS.filter(p => p.system === sys).length;
    }
    return counts;
  }, []);

  // Per-proforma normal references remain separate from the global Lab Values
  // sheet. They are generated from the canonical case data so they cannot drift.
  const activeNormalValues = useMemo(() => {
    if (!activeProforma) return [];
    return activeProforma.sections.flatMap((section, sectionIndex) =>
      section.items.flatMap((item, itemIndex) =>
        item.normal
          ? [
              {
                key: `${sectionIndex}-${itemIndex}`,
                section: section.title,
                label: item.label,
                value: item.normal,
              },
            ]
          : [],
      ),
    );
  }, [activeProforma]);

  const insertNormalGeneralExamTemplate = useCallback(() => {
    updateDraft(
      'generalExam',
      'Conscious, cooperative and oriented to time, place and person. Moderately built and nourished. No pallor, icterus, cyanosis, clubbing, generalized lymphadenopathy or pedal edema.',
    );
  }, [updateDraft]);

  if (!visible) return null;

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" statusBarTranslucent>
      <KeyboardSafe style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 12) + 6,
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            },
          ]}>
          {activeProforma ? (
            <Touchable
              onPress={() => {
                setActiveProforma(null);
                setChatOpen(false);
              }}
              label="Back to proformas list"
              style={[styles.backBtn, { borderColor: colors.border }]}>
              <ArrowLeft size={20} color={colors.text} />
            </Touchable>
          ) : (
            <View style={[styles.headerIcon, { backgroundColor: withAlpha(colors.primary, 0.12) }]}>
              <ClipboardList size={20} color={colors.primary} />
            </View>
          )}

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {activeProforma ? activeProforma.title : 'Clinical Case Proformas'}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>
              {activeProforma ? activeProforma.department : 'MBBS Practical & Ward Clerking Master Sheets'}
            </Text>
          </View>

          <Touchable
            onPress={onClose}
            label="Close proforma viewer"
            style={[styles.closeBtn, { borderColor: colors.border }]}>
            <X size={20} color={colors.text} />
          </Touchable>
        </View>

        {activeProforma ? (
          /* ========================================================================= */
          /* SINGLE PROFORMA WORKSPACE (Guide / Clerk Patient / Viva Q&A + Bottom AI)  */
          /* ========================================================================= */
          <View style={styles.proformaWorkspace}>
            {/* Mode Switcher Segmented Tabs */}
            <View style={[styles.modeTabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <Touchable
                onPress={() => setActiveTab('guide')}
                label="Proforma Guide"
                style={[
                  styles.modeTab,
                  activeTab === 'guide' && [styles.modeTabActive, { borderBottomColor: colors.primary }],
                ]}>
                <BookOpen size={16} color={activeTab === 'guide' ? colors.primary : colors.textMuted} />
                <Text
                  style={[
                    styles.modeTabText,
                    { color: activeTab === 'guide' ? colors.primary : colors.textMuted },
                  ]}>
                  Guide
                </Text>
              </Touchable>

              <Touchable
                onPress={() => setActiveTab('clerk')}
                label="Clerk Patient (Edit Mode)"
                style={[
                  styles.modeTab,
                  activeTab === 'clerk' && [styles.modeTabActive, { borderBottomColor: colors.accent }],
                ]}>
                <Edit3 size={16} color={activeTab === 'clerk' ? colors.accent : colors.textMuted} />
                <Text
                  style={[
                    styles.modeTabText,
                    { color: activeTab === 'clerk' ? colors.accent : colors.textMuted },
                  ]}>
                  Clerk Patient
                </Text>
                {savedLocally ? (
                  <View style={[styles.savedDot, { backgroundColor: '#10b981' }]} />
                ) : null}
              </Touchable>

              <Touchable
                onPress={() => setActiveTab('viva')}
                label="Professor Viva Q&A"
                style={[
                  styles.modeTab,
                  activeTab === 'viva' && [styles.modeTabActive, { borderBottomColor: '#f59e0b' }],
                ]}>
                <GraduationCap size={16} color={activeTab === 'viva' ? '#d97706' : colors.textMuted} />
                <Text
                  style={[
                    styles.modeTabText,
                    { color: activeTab === 'viva' ? '#d97706' : colors.textMuted },
                  ]}>
                  Viva Q&A
                </Text>
                <View style={[styles.vivaBadge, { backgroundColor: withAlpha('#f59e0b', 0.15) }]}>
                  <Text style={styles.vivaBadgeText}>{activeProforma.vivaQuestions.length}</Text>
                </View>
              </Touchable>
            </View>

            {/* TAB CONTENT */}
            <ScrollView
              contentContainerStyle={[
                styles.detailScroll,
                { paddingBottom: chatOpen ? 290 : Math.max(insets.bottom, 20) + 72 },
              ]}
              keyboardShouldPersistTaps="handled">
              {/* ------------------------------------------------------------------- */}
              {/* TAB 1: GUIDE (Textbook proforma, signs, checklists, pearls)          */}
              {/* ------------------------------------------------------------------- */}
              {activeTab === 'guide' ? (
                <>
                  {/* Department & System Badge */}
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: withAlpha(colors.accent, 0.15) }]}>
                      <Stethoscope size={14} color={colors.accent} />
                      <Text style={[styles.badgeText, { color: colors.accent }]}>
                        {activeProforma.system}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.detailSummary, { color: colors.textMuted }]}>
                    {activeProforma.summary}
                  </Text>

                  {/* High Yield Exam Pearl */}
                  <View
                    style={[
                      styles.pearlBox,
                      {
                        backgroundColor: withAlpha('#f59e0b', 0.1),
                        borderColor: withAlpha('#f59e0b', 0.3),
                      },
                    ]}>
                    <View style={styles.pearlHeader}>
                      <Lightbulb size={16} color="#d97706" />
                      <Text style={styles.pearlTitle}>High-Yield Viva Pearl</Text>
                    </View>
                    <Text style={[styles.pearlContent, { color: colors.text }]}>
                      {activeProforma.examPearl}
                    </Text>
                  </View>

                  {/* Clinical Diagram Card if present */}
                  {activeProforma.diagramPath ? (
                    <View
                      style={[
                        styles.diagramCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}>
                      <View style={styles.diagramHeader}>
                        <Sparkles size={16} color={colors.primary} />
                        <Text style={[styles.diagramTitle, { color: colors.text }]}>
                          {activeProforma.diagramTitle || 'Clinical Reference Diagram'}
                        </Text>
                      </View>
                      <Touchable
                        onPress={() => {
                          const resolvedUri = resolveProformaDiagramUrl(activeProforma.diagramPath);
                          if (resolvedUri) {
                            setFullscreenImage({
                              uri: resolvedUri,
                              title: activeProforma.diagramTitle || activeProforma.title,
                            });
                          }
                        }}
                        label="View clinical diagram full screen"
                        style={styles.diagramImageTouch}>
                        <Image
                          source={{ uri: resolveProformaDiagramUrl(activeProforma.diagramPath) }}
                          style={styles.diagramImage}
                          resizeMode="contain"
                        />
                        <View style={styles.maximizeBadge}>
                          <Maximize2 size={14} color="#FFFFFF" />
                          <Text style={styles.maximizeText}>Full View</Text>
                        </View>
                      </Touchable>
                    </View>
                  ) : null}

                  {/*
                    * The general examination, with a photograph of each sign.
                    *
                    * It sits in every proforma in the repo as the same recited
                    * line — "Pallor, Icterus, Cyanosis, Clubbing, Koilonychia,
                    * Lymphadenopathy, Edema" — which is exactly the part of
                    * clerking that words cannot teach. One shared block rather
                    * than a copy per case: there is one general examination.
                    */}
                  <View
                    style={[
                      styles.sectionCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}>
                    <Touchable
                      label="General examination signs, with pictures"
                      hint={
                        signsOpen
                          ? 'Collapse the general examination'
                          : 'Show every sign with a photograph'
                      }
                      state={{ expanded: signsOpen }}
                      onPress={() => setSignsOpen(v => !v)}
                      style={styles.signsToggle}>
                      <Stethoscope size={16} color={colors.primary} />
                      <View style={styles.signsToggleText}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                          General Examination — with pictures
                        </Text>
                        <Text style={[styles.itemDesc, { color: colors.textMuted }]}>
                          PICCLE and the nail signs, with clinical photographs where available
                        </Text>
                      </View>
                      {signsOpen ? (
                        <ChevronUp size={18} color={colors.textMuted} />
                      ) : (
                        <ChevronDown size={18} color={colors.textMuted} />
                      )}
                    </Touchable>
                    {signsOpen ? (
                      <View style={styles.signsBody}>
                        <GeneralExamSigns onOpenImage={setFullscreenImage} />
                      </View>
                    ) : null}
                  </View>

                  {/* Case-specific sections — progressive disclosure prevents a wall of text. */}
                  {activeProforma.sections.map((section, sIdx) => {
                    const isOpen = Boolean(expandedGuideSections[sIdx]);
                    return (
                      <View
                        key={sIdx}
                        style={[
                          styles.sectionCard,
                          { backgroundColor: colors.card, borderColor: colors.border },
                        ]}>
                        <Touchable
                          onPress={() =>
                            setExpandedGuideSections(prev => ({
                              ...prev,
                              [sIdx]: !prev[sIdx],
                            }))
                          }
                          label={`${isOpen ? 'Collapse' : 'Expand'} ${section.title}`}
                          state={{ expanded: isOpen }}
                          style={styles.sectionHeader}>
                          <View style={styles.sectionHeaderTextWrap}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                              {section.title}
                            </Text>
                            <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
                              {section.items.length} bedside points
                            </Text>
                          </View>
                          {isOpen ? (
                            <ChevronUp size={20} color={colors.textMuted} />
                          ) : (
                            <ChevronDown size={20} color={colors.textMuted} />
                          )}
                        </Touchable>

                        {isOpen ? (
                          <View style={styles.sectionBody}>
                            {section.items.map((item, iIdx) => (
                              <View key={iIdx} style={styles.itemBlock}>
                                <Text style={[styles.itemLabel, { color: colors.accent }]}>
                                  {item.label}
                                </Text>
                                {item.checklist && item.checklist.length > 0 ? (
                                  <View style={styles.checklistBox}>
                                    {item.checklist.flatMap(guidePoints).map((check, cIdx) => (
                                      <View key={cIdx} style={styles.checkItem}>
                                        <CheckCircle2
                                          size={15}
                                          color={colors.accent}
                                          style={styles.checkIcon}
                                        />
                                        <Text style={[styles.checkText, { color: colors.text }]}>
                                          <Text style={{ textDecorationLine: 'underline', fontWeight: '600' }}>{check.prompt}</Text>
                                          {check.explanation ? `\n${check.explanation}` : ''}
                                        </Text>
                                      </View>
                                    ))}
                                  </View>
                                ) : null}
                                <Text style={[styles.itemDesc, { color: colors.text }]}>
                                  {item.description}
                                </Text>
                                {item.clinicalSign ? (
                                  <Text style={[styles.itemDesc, { color: colors.textMuted }]}>{item.clinicalSign}</Text>
                                ) : null}
                                {item.normal ? (
                                  <View style={styles.normalRow}>
                                    <Text style={[styles.normalLabel, { color: colors.textMuted }]}>
                                      Normal:{' '}
                                    </Text>
                                    <Text style={[styles.normalVal, { color: colors.text }]}>
                                      {item.normal}
                                    </Text>
                                  </View>
                                ) : null}

                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </>
              ) : null}

              {/* ------------------------------------------------------------------- */}
              {/* TAB 2: CLERK PATIENT (Offline Bedside Clerking & AI Auto-Fill)      */}
              {/* ------------------------------------------------------------------- */}
              {activeTab === 'clerk' ? (
                <View style={styles.clerkContainer}>
                  {/* Status Banner & Action Buttons */}
                  <View
                    style={[
                      styles.clerkTopBar,
                      { backgroundColor: withAlpha(colors.card, 0.8), borderColor: colors.border },
                    ]}>
                    <View style={styles.clerkStatusBadge}>
                      <Check size={14} color="#10b981" />
                      <Text style={styles.clerkStatusText}>Local Storage Active (Offline Private)</Text>
                    </View>

                    <Touchable
                      onPress={handleResetDraft}
                      label="Reset clerking form"
                      style={[styles.resetBtn, { borderColor: colors.border }]}>
                      <Trash2 size={15} color={colors.textMuted} />
                      <Text style={[styles.resetBtnText, { color: colors.textMuted }]}>Reset</Text>
                    </Touchable>
                  </View>

                  {/* AI help is optional; clerking stays visually primary. */}
                  <View
                    style={[
                      styles.aiAutoFillCard,
                      {
                        backgroundColor: withAlpha(colors.primary, 0.06),
                        borderColor: withAlpha(colors.primary, 0.22),
                      },
                    ]}>
                    <Touchable
                      onPress={() => setAiAssistOpen(prev => !prev)}
                      label={aiAssistOpen ? 'Collapse AI case assistance' : 'Expand AI case assistance'}
                      state={{ expanded: aiAssistOpen }}
                      style={styles.compactAssistHeader}>
                      <View style={styles.aiAutoFillHeader}>
                        <Sparkles size={17} color={colors.primary} />
                        <View style={styles.aiAssistHeaderText}>
                          <Text style={[styles.aiAutoFillTitle, { color: colors.primary }]}>
                            Optional AI case assistance
                          </Text>
                          <Text style={[styles.aiAssistHint, { color: colors.textMuted }]}>
                            Keep the bedside form clean; open this only when needed.
                          </Text>
                        </View>
                      </View>
                      {aiAssistOpen ? (
                        <ChevronUp size={19} color={colors.textMuted} />
                      ) : (
                        <ChevronDown size={19} color={colors.textMuted} />
                      )}
                    </Touchable>

                    {aiAssistOpen ? (
                      <>
                        <Text style={[styles.aiAutoFillDesc, { color: colors.text }]}>
                          Enter the findings you actually obtained first. AI can then help organize a
                          half-completed practice case into an examination-style presentation.
                        </Text>

                        <Touchable
                          onPress={handleAutoFill}
                          disabled={isAutoFilling}
                          label="Auto-complete case presentation"
                          style={[
                            styles.autoFillBtn,
                            { backgroundColor: colors.primary, opacity: isAutoFilling ? 0.7 : 1 },
                          ]}>
                          {isAutoFilling ? (
                            <ActivityIndicator size="small" color={colors.primaryText} />
                          ) : (
                            <Sparkles size={16} color={colors.primaryText} />
                          )}
                          <Text style={[styles.autoFillBtnText, { color: colors.primaryText }]}>
                            {isAutoFilling ? 'Organizing Findings…' : 'AI Assist This Case'}
                          </Text>
                        </Touchable>
                      </>
                    ) : null}
                  </View>

                  {/* Demographics Card */}
                  <View
                    style={[
                      styles.formSection,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}>
                    <Text style={[styles.formSectionTitle, { color: colors.text }]}>
                      1. Patient Demographics
                    </Text>

                    <View style={styles.formRow}>
                      <View style={styles.formCol}>
                        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                          Patient Initials / Name
                        </Text>
                        <TextInput
                          value={draft.patientInitials}
                          onChangeText={t => updateDraft('patientInitials', t)}
                          placeholder="e.g. R. K."
                          placeholderTextColor={colors.textMuted}
                          style={[
                            styles.textInput,
                            { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                          ]}
                        />
                      </View>

                      <View style={[styles.formCol, { flex: 0.5 }]}>
                        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Age</Text>
                        <TextInput
                          value={draft.age}
                          onChangeText={t => updateDraft('age', t)}
                          placeholder="e.g. 52"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="numeric"
                          style={[
                            styles.textInput,
                            { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                          ]}
                        />
                      </View>

                      <View style={[styles.formCol, { flex: 0.6 }]}>
                        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Sex</Text>
                        <TextInput
                          value={draft.sex}
                          onChangeText={t => updateDraft('sex', t as any)}
                          placeholder="Male"
                          placeholderTextColor={colors.textMuted}
                          style={[
                            styles.textInput,
                            { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.formRow}>
                      <View style={styles.formCol}>
                        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                          Ward & Bed No.
                        </Text>
                        <TextInput
                          value={draft.ward ? `${draft.ward} (${draft.bedNo})` : draft.bedNo}
                          onChangeText={t => updateDraft('ward', t)}
                          placeholder="e.g. Surgical Ward 3, Bed 16"
                          placeholderTextColor={colors.textMuted}
                          style={[
                            styles.textInput,
                            { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                          ]}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Chief Complaints Card */}
                  <View
                    style={[
                      styles.formSection,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}>
                    <Text style={[styles.formSectionTitle, { color: colors.text }]}>
                      2. Chief Complaints (with duration)
                    </Text>
                    <TextInput
                      multiline
                      numberOfLines={3}
                      value={draft.chiefComplaints}
                      onChangeText={t => updateDraft('chiefComplaints', t)}
                      placeholder="e.g. Swelling in the right groin for 8 months…"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.multilineInput,
                        { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                    />
                  </View>

                  {/* History of Present Illness (HPI) */}
                  <View
                    style={[
                      styles.formSection,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}>
                    <Text style={[styles.formSectionTitle, { color: colors.text }]}>
                      3. History of Present Illness (HPI & Negative History)
                    </Text>
                    <TextInput
                      multiline
                      numberOfLines={5}
                      value={draft.hpi}
                      onChangeText={t => updateDraft('hpi', t)}
                      placeholder="Elaborate chronological history, precipitating factors, and negative history to rule out complications…"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.multilineInput,
                        { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                    />
                  </View>

                  {/* Past & Personal History */}
                  <View
                    style={[
                      styles.formSection,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}>
                    <Text style={[styles.formSectionTitle, { color: colors.text }]}>
                      4. Past, Personal & Treatment History
                    </Text>
                    <TextInput
                      multiline
                      numberOfLines={3}
                      value={draft.pastHistory}
                      onChangeText={t => updateDraft('pastHistory', t)}
                      placeholder="Comorbidities (DM, HTN, TB), past surgeries, personal habits, addictions, medications…"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.multilineInput,
                        { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                    />
                  </View>

                  {/* General Physical Examination — bedside sequence kept visible and structured */}
                  <View
                    style={[
                      styles.formSection,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}>
                    <Text style={[styles.formSectionTitle, { color: colors.text }]}>
                      5. General Physical Examination
                    </Text>
                    <Text style={[styles.gpeIntro, { color: colors.textMuted }]}>
                      Bedside order: overall state → build/nourishment → vitals → pallor, icterus,
                      cyanosis, clubbing, lymph nodes and edema.
                    </Text>

                    <View style={styles.gpeSequence}>
                      {[
                        'Conscious & oriented',
                        'Build / nourishment',
                        'Pulse',
                        'BP',
                        'Respiration',
                        'Temperature',
                        'Pallor',
                        'Icterus',
                        'Cyanosis',
                        'Clubbing',
                        'Lymph nodes',
                        'Edema',
                      ].map(label => (
                        <View
                          key={label}
                          style={[
                            styles.gpeChip,
                            {
                              backgroundColor: withAlpha(colors.accent, 0.08),
                              borderColor: withAlpha(colors.accent, 0.22),
                            },
                          ]}>
                          <Text style={[styles.gpeChipText, { color: colors.text }]}>{label}</Text>
                        </View>
                      ))}
                    </View>

                    <Touchable
                      onPress={insertNormalGeneralExamTemplate}
                      label="Insert normal general examination template"
                      style={[
                        styles.normalTemplateBtn,
                        {
                          backgroundColor: withAlpha(colors.accent, 0.08),
                          borderColor: withAlpha(colors.accent, 0.25),
                        },
                      ]}>
                      <CheckCircle2 size={15} color={colors.accent} />
                      <View style={styles.normalTemplateTextWrap}>
                        <Text style={[styles.normalTemplateText, { color: colors.accent }]}>
                          Insert normal GPE template
                        </Text>
                        <Text style={[styles.normalTemplateHint, { color: colors.textMuted }]}>
                          Use only when these findings match the patient you examined.
                        </Text>
                      </View>
                    </Touchable>

                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                      Vital Signs
                    </Text>
                    <TextInput
                      multiline
                      numberOfLines={2}
                      value={draft.vitals}
                      onChangeText={t => updateDraft('vitals', t)}
                      placeholder="Pulse, BP, respiratory rate, SpO₂ and temperature…"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.multilineInput,
                        {
                          color: colors.text,
                          borderColor: colors.border,
                          backgroundColor: colors.background,
                          marginBottom: 10,
                        },
                      ]}
                    />

                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                      General Survey & Head-to-Toe Findings
                    </Text>
                    <TextInput
                      multiline
                      numberOfLines={4}
                      value={draft.generalExam}
                      onChangeText={t => updateDraft('generalExam', t)}
                      placeholder="Consciousness, orientation, build, nourishment, pallor, icterus, cyanosis, clubbing, lymphadenopathy, edema and relevant head-to-toe signs…"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.multilineInput,
                        { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                    />
                  </View>

                  {/* Case-specific normals are separate from the global Lab Values reference. */}
                  <View
                    style={[
                      styles.normalValuesCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}>
                    <Touchable
                      onPress={() => setNormalValuesOpen(prev => !prev)}
                      label={normalValuesOpen ? 'Hide normal values' : 'Show normal values'}
                      state={{ expanded: normalValuesOpen }}
                      style={styles.normalValuesHeader}>
                      <View style={styles.normalValuesHeaderLeft}>
                        <CheckCircle2 size={17} color={colors.accent} />
                        <View style={styles.normalValuesTitleWrap}>
                          <Text style={[styles.normalValuesTitle, { color: colors.text }]}>
                            Normal Values
                          </Text>
                          <Text style={[styles.normalValuesSubtitle, { color: colors.textMuted }]}>
                            {activeNormalValues.length > 0
                              ? `${activeNormalValues.length} references from this proforma`
                              : 'Open the shared laboratory reference'}
                          </Text>
                        </View>
                      </View>
                      {normalValuesOpen ? (
                        <ChevronUp size={20} color={colors.textMuted} />
                      ) : (
                        <ChevronDown size={20} color={colors.textMuted} />
                      )}
                    </Touchable>

                    {normalValuesOpen ? (
                      <View style={styles.normalValuesList}>
                        {activeNormalValues.length > 0 ? (
                          activeNormalValues.map(entry => (
                            <View
                              key={entry.key}
                              style={[
                                styles.normalValueRow,
                                { borderTopColor: withAlpha(colors.border, 0.65) },
                              ]}>
                              <View style={styles.normalValueLabelWrap}>
                                <Text style={[styles.normalValueLabel, { color: colors.text }]}>
                                  {entry.label}
                                </Text>
                                <Text style={[styles.normalValueSection, { color: colors.textMuted }]}>
                                  {entry.section}
                                </Text>
                              </View>
                              <Text style={[styles.normalValueText, { color: colors.accent }]}>
                                {entry.value}
                              </Text>
                            </View>
                          ))
                        ) : (
                          <Text style={[styles.normalValuesEmpty, { color: colors.textMuted }]}>
                            Use the laboratory reference below. Interpret results with age, pregnancy status
                            and the reporting laboratory’s range.
                          </Text>
                        )}
                        <Touchable label="Open normal laboratory values" onPress={() => setLabSheetOpen(true)} style={styles.normalValuesHeader}>
                          <Text style={[styles.itemLabel, { color: colors.accent }]}>Open normal laboratory values</Text>
                          <ChevronRight size={18} color={colors.accent} />
                        </Touchable>
                      </View>
                    ) : null}
                  </View>

                  {/* Systemic / Local Examination Findings */}
                  <View
                    style={[
                      styles.formSection,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}>
                    <Text style={[styles.formSectionTitle, { color: colors.text }]}>
                      6. Systemic & Local Physical Examination
                    </Text>
                    <TextInput
                      multiline
                      numberOfLines={7}
                      value={draft.systemicExam}
                      onChangeText={t => updateDraft('systemicExam', t)}
                      placeholder="Inspection, palpation, special clinical tests (e.g. Deep ring occlusion, Zieman, cough impulse, auscultation)…"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.multilineInput,
                        { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                    />
                  </View>

                  {/* Provisional Diagnosis */}
                  <View
                    style={[
                      styles.formSection,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}>
                    <Text style={[styles.formSectionTitle, { color: colors.text }]}>
                      7. Provisional Anatomical & Pathological Diagnosis
                    </Text>
                    <TextInput
                      multiline
                      numberOfLines={3}
                      value={draft.provisionalDiagnosis}
                      onChangeText={t => updateDraft('provisionalDiagnosis', t)}
                      placeholder="Complete exam format: Side, site, extent, status, content, predisposing factors…"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.multilineInput,
                        { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                    />
                  </View>

                  {/* Differential Diagnoses */}
                  <View
                    style={[
                      styles.formSection,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}>
                    <Text style={[styles.formSectionTitle, { color: colors.text }]}>
                      8. Differential Diagnoses & Clinical Distinctions
                    </Text>
                    <TextInput
                      multiline
                      numberOfLines={3}
                      value={draft.differentialDiagnosis}
                      onChangeText={t => updateDraft('differentialDiagnosis', t)}
                      placeholder="List 3-4 key differentials and how they were ruled out clinically…"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.multilineInput,
                        { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                    />
                  </View>

                  {/* Investigations & Plan */}
                  <View
                    style={[
                      styles.formSection,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}>
                    <Text style={[styles.formSectionTitle, { color: colors.text }]}>
                      9. Investigations & Management Plan
                    </Text>
                    <TextInput
                      multiline
                      numberOfLines={4}
                      value={draft.investigationsPlan}
                      onChangeText={t => updateDraft('investigationsPlan', t)}
                      placeholder="Diagnostic investigations (USG, ECG, labs) and definitive operative/medical management…"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.multilineInput,
                        { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                    />
                  </View>
                </View>
              ) : null}

              {/* ------------------------------------------------------------------- */}
              {/* TAB 3: VIVA Q&A (Professor Bedside Viva Questions & Examiner Tips)   */}
              {/* ------------------------------------------------------------------- */}
              {activeTab === 'viva' ? (
                <View style={styles.vivaContainer}>
                  <View
                    style={[
                      styles.vivaNotice,
                      {
                        backgroundColor: withAlpha('#f59e0b', 0.1),
                        borderColor: withAlpha('#f59e0b', 0.3),
                      },
                    ]}>
                    <GraduationCap size={20} color="#d97706" />
                    <View style={styles.vivaNoticeContent}>
                      <Text style={styles.vivaNoticeTitle}>
                        Professor's Bedside Viva Questions & Traps
                      </Text>
                      <Text style={[styles.vivaNoticeSub, { color: colors.text }]}>
                        Authentic questions asked during final MBBS practical case presentations,
                        with textbook-grade answers and examiner marking pearls.
                      </Text>
                    </View>
                  </View>

                  {activeProforma.vivaQuestions.map((viva, vIdx) => {
                    const isOpen = Boolean(expandedViva[vIdx]);
                    return (
                      <View
                        key={vIdx}
                        style={[
                          styles.vivaCard,
                          { backgroundColor: colors.card, borderColor: colors.border },
                        ]}>
                        <Touchable
                          onPress={() =>
                            setExpandedViva(prev => ({ ...prev, [vIdx]: !prev[vIdx] }))
                          }
                          label={`Toggle question ${vIdx + 1}`}
                          style={styles.vivaHeader}>
                          <View style={styles.vivaQNumBox}>
                            <Text style={styles.vivaQNumText}>Q{vIdx + 1}</Text>
                          </View>
                          <Text style={[styles.vivaQuestionText, { color: colors.text }]}>
                            {viva.question}
                          </Text>
                          {isOpen ? (
                            <ChevronUp size={20} color={colors.textMuted} />
                          ) : (
                            <ChevronDown size={20} color={colors.textMuted} />
                          )}
                        </Touchable>

                        {isOpen ? (
                          <View style={styles.vivaBody}>
                            <Text style={[styles.vivaAnswerText, { color: colors.text }]}>
                              {viva.answer}
                            </Text>

                            {viva.examinerTip ? (
                              <View
                                style={[
                                  styles.examinerTipBox,
                                  {
                                    backgroundColor: withAlpha('#f59e0b', 0.1),
                                    borderColor: withAlpha('#f59e0b', 0.3),
                                  },
                                ]}>
                                <View style={styles.examinerTipHeader}>
                                  <Lightbulb size={14} color="#d97706" />
                                  <Text style={styles.examinerTipTitle}>Examiner Tip & Marking Trap</Text>
                                </View>
                                <Text style={[styles.examinerTipText, { color: colors.text }]}>
                                  {viva.examinerTip}
                                </Text>
                              </View>
                            ) : null}

                            <Touchable
                              onPress={() => {
                                setChatOpen(true);
                                handleSendMessage(
                                  `Explain in depth with clinical examples: ${viva.question}`,
                                );
                              }}
                              label="Ask AI to expand on this viva question"
                              style={[styles.discussAiBtn, { borderColor: colors.border }]}>
                              <MessageSquare size={14} color={colors.primary} />
                              <Text style={[styles.discussAiBtnText, { color: colors.primary }]}>
                                Discuss in AI Chat
                              </Text>
                            </Touchable>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </ScrollView>

            {/* ===================================================================== */}
            {/* PERSISTENT BOTTOM AI CHATBOX                                          */}
            {/* ===================================================================== */}
            <View
              style={[
                styles.chatDrawer,
                {
                  backgroundColor: colors.card,
                  borderTopColor: colors.border,
                  paddingBottom: Math.max(insets.bottom, 10),
                },
                chatOpen
                  ? chatExpanded
                    ? styles.chatDrawerExpanded
                    : styles.chatDrawerOpen
                  : styles.chatDrawerClosed,
                { height: (chatOpen ? (chatExpanded ? 560 : 280) : 52) + Math.max(insets.bottom, 10) },
              ]}>
              {/* Chat Header Bar */}
              <Touchable
                onPress={() => setChatOpen(prev => !prev)}
                label={chatOpen ? 'Collapse AI chat' : 'Expand AI chat'}
                style={styles.chatHeader}>
                <View style={styles.chatHeaderLeft}>
                  <View style={[styles.chatBotIcon, { backgroundColor: withAlpha(colors.primary, 0.15) }]}>
                    <Bot size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.chatTitle, { color: colors.text }]}>
                    Bedside Clinical AI Assistant
                  </Text>
                </View>

                <View style={styles.chatHeaderRight}>
                  {chatOpen ? (
                    <>
                      <Touchable
                        onPress={() => setChatExpanded(exp => !exp)}
                        label={chatExpanded ? 'Restore chat size' : 'Expand chat full screen'}
                        style={styles.chatResetIcon}>
                        {chatExpanded ? (
                          <Minimize2 size={16} color={colors.textMuted} />
                        ) : (
                          <Maximize2 size={16} color={colors.textMuted} />
                        )}
                      </Touchable>
                      <Touchable
                        onPress={() => setChatMessages([])}
                        label="Reset chat messages"
                        style={styles.chatResetIcon}>
                        <RotateCcw size={16} color={colors.textMuted} />
                      </Touchable>
                    </>
                  ) : null}
                  {chatOpen ? (
                    <ChevronDown size={20} color={colors.textMuted} />
                  ) : (
                    <ChevronUp size={20} color={colors.textMuted} />
                  )}
                </View>
              </Touchable>

              {chatOpen ? (
                <>
                  {/* Suggested Prompt Chips */}
                  <ScrollView
                    horizontal
                    style={styles.promptChipsScroll}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.promptChipsRow}>
                    <Touchable
                      onPress={() =>
                        handleSendMessage('What are the top viva questions professors ask on this case?')
                      }
                      label="Top viva questions chip"
                      style={[styles.promptChip, { borderColor: colors.border }]}>
                      <Text style={[styles.promptChipText, { color: colors.text }]}>
                        Top viva questions
                      </Text>
                    </Touchable>

                    <Touchable
                      onPress={() =>
                        handleSendMessage('Give me the complete differential diagnosis list for this case.')
                      }
                      label="Differential diagnosis chip"
                      style={[styles.promptChip, { borderColor: colors.border }]}>
                      <Text style={[styles.promptChipText, { color: colors.text }]}>
                        Differentials
                      </Text>
                    </Touchable>

                    <Touchable
                      onPress={() =>
                        handleSendMessage('How should I present this case summary to the external examiner?')
                      }
                      label="Presentation summary chip"
                      style={[styles.promptChip, { borderColor: colors.border }]}>
                      <Text style={[styles.promptChipText, { color: colors.text }]}>
                        Case summary
                      </Text>
                    </Touchable>

                    <Touchable
                      onPress={() =>
                        handleSendMessage('What clinical signs can examiners ask me to demonstrate on the patient?')
                      }
                      label="Clinical signs chip"
                      style={[styles.promptChip, { borderColor: colors.border }]}>
                      <Text style={[styles.promptChipText, { color: colors.text }]}>
                        Clinical signs
                      </Text>
                    </Touchable>
                  </ScrollView>

                  {/* Messages Transcript */}
                  <ScrollView
                    ref={chatScrollRef}
                    style={styles.chatTranscript}
                    contentContainerStyle={styles.chatTranscriptContent}
                    keyboardShouldPersistTaps="handled">
                    {chatMessages.length === 0 ? (
                      <View style={styles.emptyChatBox}>
                        <Text style={[styles.emptyChatText, { color: colors.textMuted }]}>
                          Ask any question about this case, clinical signs, viva traps, or presentation
                          nuances.
                        </Text>
                      </View>
                    ) : null}

                    {chatMessages.map(msg => (
                      <View
                        key={msg.id}
                        style={[
                          styles.chatBubble,
                          msg.role === 'user'
                            ? [styles.userBubble, { backgroundColor: colors.primary }]
                            : [styles.botBubble, { backgroundColor: colors.background, borderColor: colors.border }],
                        ]}>
                        <Text
                          style={[
                            styles.chatBubbleText,
                            { color: msg.role === 'user' ? colors.primaryText : colors.text },
                          ]}>
                          {msg.text}
                        </Text>
                      </View>
                    ))}

                    {chatBusy ? (
                      <View style={[styles.botBubble, styles.busyBubble, { backgroundColor: colors.background }]}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={[styles.busyText, { color: colors.textMuted }]}>
                          Consulting MBBS practical clinical guidelines…
                        </Text>
                      </View>
                    ) : null}
                  </ScrollView>

                  {/* Chat Input Row */}
                  <View style={[styles.chatInputRow, { borderTopColor: colors.border }]}>
                    <TextInput
                      value={chatInput}
                      onChangeText={setChatInput}
                      placeholder="Ask about this case or signs…"
                      placeholderTextColor={colors.textMuted}
                      onSubmitEditing={() => handleSendMessage()}
                      style={[
                        styles.chatTextInput,
                        { color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                    />
                    <Touchable
                      onPress={() => handleSendMessage()}
                      disabled={!chatInput.trim() || chatBusy}
                      label="Send medical question"
                      style={[
                        styles.chatSendBtn,
                        {
                          backgroundColor: chatInput.trim() ? colors.primary : withAlpha(colors.primary, 0.4),
                        },
                      ]}>
                      <Send size={16} color={colors.primaryText} />
                    </Touchable>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        ) : (
          /* ========================================================================= */
          /* LIST OF ALL AVAILABLE PROFORMAS (Categorized by Subject)                  */
          /* ========================================================================= */
          <ScrollView
            contentContainerStyle={[
              styles.listScroll,
              { paddingBottom: Math.max(insets.bottom, 20) + 24 },
            ]}
            keyboardShouldPersistTaps="handled">
            {/* Search Bar */}
            <View
              style={[
                styles.searchBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Search size={18} color={colors.textMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search proformas, signs, murmurs, hernia…"
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.text }]}
              />
              {searchQuery ? (
                <Touchable onPress={() => setSearchQuery('')} label="Clear search">
                  <X size={18} color={colors.textMuted} />
                </Touchable>
              ) : null}
            </View>

            {/*
              * Two references directly under the search, not buried in a case.
              *
              * Under rather than over is the owner's call: the search box is
              * what the screen is FOR, and anything above it pushes the thing
              * you came to do down the page.
              *
              * Both already existed but only INSIDE a proforma: the general
              * examination in every Guide tab, and the normal values nowhere at
              * all. A student on a ward round wants them without first opening
              * a case sheet they did not want — and a reference you have to
              * navigate into is a reference people stop opening.
              *
              * The general examination is the SAME component the Guide tab
              * mounts, not a second copy. Nineteen signs kept in step in two
              * places is nineteen chances to drift.
              */}
            <View style={styles.quickRefRow}>
              <Touchable
                onPress={() => setExamSheetOpen(true)}
                label="General examination, with pictures"
                hint="Opens PICCLE and the nail signs"
                style={[
                  styles.quickRefCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}>
                <View
                  style={[
                    styles.quickRefIcon,
                    { backgroundColor: withAlpha(colors.primary, 0.15) },
                  ]}>
                  <Stethoscope size={18} color={colors.primary} />
                </View>
                <View style={styles.quickRefText}>
                  <Text style={[styles.quickRefTitle, { color: colors.text }]}>
                    General Examination
                  </Text>
                  <Text style={[styles.quickRefSub, { color: colors.textMuted }]}>
                    PICCLE, with photographs
                  </Text>
                </View>
              </Touchable>

              <Touchable
                onPress={() => setLabSheetOpen(true)}
                label="Normal lab values"
                hint="Opens the reference ranges"
                style={[
                  styles.quickRefCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}>
                <View
                  style={[
                    styles.quickRefIcon,
                    { backgroundColor: withAlpha(colors.accent, 0.15) },
                  ]}>
                  <FlaskConical size={18} color={colors.accent} />
                </View>
                <View style={styles.quickRefText}>
                  <Text style={[styles.quickRefTitle, { color: colors.text }]}>
                    Normal Lab Values
                  </Text>
                  <Text style={[styles.quickRefSub, { color: colors.textMuted }]}>
                    Ranges, critical values
                  </Text>
                </View>
              </Touchable>
            </View>

            {/* Subject Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}>
              {SYSTEMS.map(sys => {
                const active = selectedSystem === sys;
                const count = systemCounts[sys] ?? 0;
                return (
                  <Touchable
                    key={sys}
                    onPress={() => setSelectedSystem(sys)}
                    label={`Filter by ${sys}`}
                    style={[
                      styles.filterPill,
                      active
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.card, borderColor: colors.border },
                    ]}>
                    <Text
                      style={[
                        styles.filterPillText,
                        { color: active ? colors.primaryText : colors.text },
                      ]}>
                      {sys === 'Obstetrics & Gynaecology' ? 'OBGYN' : sys} ({count})
                    </Text>
                  </Touchable>
                );
              })}
            </ScrollView>

            {/* Proforma Cards, grouped by department */}
            {groupedProformas.map(group => (
              <View key={group.system}>
                {showGroupHeadings ? (
                  <View style={styles.groupHeadingRow}>
                    <Text style={[styles.groupHeading, { color: colors.textMuted }]}>
                      {group.system === 'Obstetrics & Gynaecology'
                        ? 'OBSTETRICS & GYNAECOLOGY'
                        : group.system.toUpperCase()}
                    </Text>
                    <View
                      style={[styles.groupHeadingRule, { backgroundColor: colors.border }]}
                    />
                    <Text style={[styles.groupHeadingCount, { color: colors.textMuted }]}>
                      {group.items.length}
                    </Text>
                  </View>
                ) : null}
                {group.items.map(proforma => {
              const vivaCount = proforma.vivaQuestions.length;
              return (
                <Touchable
                  key={proforma.id}
                  onPress={() => {
                    setActiveProforma(proforma);
                    setActiveTab('guide');
                  }}
                  label={`Open ${proforma.title}`}
                  style={[
                    styles.proformaCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}>
                  <View
                    style={[
                      styles.cardIconBox,
                      {
                        backgroundColor: withAlpha(
                          SYSTEM_COLOUR[proforma.system] ?? colors.primary,
                          0.15,
                        ),
                      },
                    ]}>
                    <GraduationCap
                      size={22}
                      color={SYSTEM_COLOUR[proforma.system] ?? colors.primary}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {proforma.title}
                    </Text>
                    <View style={styles.cardMetaRow}>
                      <Text style={[styles.cardDept, { color: colors.accent }]}>
                        {proforma.department}
                      </Text>
                      {vivaCount > 0 ? (
                        <Text style={[styles.cardVivaCount, { color: '#d97706' }]}>
                          • {vivaCount} Viva Qs
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.cardSummary, { color: colors.textMuted }]} numberOfLines={2}>
                      {proforma.summary}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textMuted} />
                </Touchable>
              );
                })}
              </View>
            ))}

            {/* An empty result has to say so. A filter or a search that matches
              * nothing otherwise looks exactly like a screen that failed to
              * load, which is the report this kind of list always generates. */}
            {filteredProformas.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No case sheet matches
                </Text>
                <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                  {searchQuery.trim()
                    ? `Nothing found for “${searchQuery.trim()}”. Try a sign, a murmur or a department.`
                    : 'Try another department.'}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        )}

        <GeneralExamSheet
          visible={examSheetOpen}
          onClose={() => setExamSheetOpen(false)}
        />
        <LabValuesSheet visible={labSheetOpen} onClose={() => setLabSheetOpen(false)} />

        {/* Fullscreen Image Preview Modal */}
        {fullscreenImage ? (
          <Modal visible onRequestClose={() => setFullscreenImage(null)} animationType="fade" statusBarTranslucent>
            <View style={styles.fullscreenContainer}>
              <View
                style={[
                  styles.fullscreenHeader,
                  { paddingTop: Math.max(insets.top, 12) + 6 },
                ]}>
                <Text style={styles.fullscreenTitle} numberOfLines={1}>
                  {fullscreenImage.title}
                </Text>
                <Touchable
                  onPress={() => setFullscreenImage(null)}
                  label="Close image"
                  style={styles.fullscreenClose}>
                  <X size={22} color="#FFFFFF" />
                </Touchable>
              </View>
              <Image
                source={{ uri: fullscreenImage.uri }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            </View>
          </Modal>
        ) : null}
      </KeyboardSafe>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  proformaWorkspace: {
    flex: 1,
    position: 'relative',
  },
  modeTabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  modeTabActive: {},
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  savedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vivaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  vivaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
  },
  listScroll: {
    padding: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  proformaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    gap: 14,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  cardDept: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardVivaCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardSummary: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  detailScroll: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  pearlBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  pearlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  pearlTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d97706',
  },
  pearlContent: {
    fontSize: 13,
    lineHeight: 19,
  },
  diagramCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 16,
  },
  diagramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  diagramTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  diagramImageTouch: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  diagramImage: {
    width: '100%',
    height: 220,
  },
  maximizeBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  maximizeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeaderTextWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
  },
  sectionMeta: {
    fontSize: 11.5,
    marginTop: 3,
  },
  sectionBody: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.18)',
  },
  itemBlock: {
    marginBottom: 14,
  },
  itemLabel: {
    textDecorationLine: 'underline',
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 6,
  },
  normalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  normalLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  normalVal: {
    fontSize: 12,
    flex: 1,
  },
  quickRefRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  quickRefCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  quickRefIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRefText: { flex: 1 },
  quickRefTitle: { fontSize: 13, fontWeight: '600' },
  quickRefSub: { fontSize: 11, marginTop: 1 },
  groupHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    marginBottom: 8,
  },
  groupHeading: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9 },
  groupHeadingRule: { flex: 1, height: StyleSheet.hairlineWidth },
  groupHeadingCount: { fontSize: 11, fontWeight: '600' },
  emptyState: { paddingVertical: 48, paddingHorizontal: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptyBody: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  signsToggle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  signsToggleText: { flex: 1 },
  signsBody: { marginTop: 14 },
  checklistBox: {
    marginTop: 4,
    gap: 6,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkIcon: {
    marginTop: 2,
  },
  checkText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  /* CLERK PATIENT MODE */
  clerkContainer: {
    gap: 14,
  },
  clerkTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  clerkStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clerkStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  aiAutoFillCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  aiAutoFillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  compactAssistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  aiAssistHeaderText: {
    flex: 1,
  },
  aiAssistHint: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  aiAutoFillTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  aiAutoFillDesc: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  autoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  autoFillBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  formSection: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 8,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  gpeIntro: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 4,
  },
  gpeSequence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginVertical: 6,
  },
  gpeChip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  gpeChipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  normalTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 4,
  },
  normalTemplateTextWrap: {
    flex: 1,
  },
  normalTemplateText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  normalTemplateHint: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  normalValuesCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  normalValuesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  normalValuesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  normalValuesTitleWrap: {
    flex: 1,
  },
  normalValuesTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  normalValuesSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  normalValuesList: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  normalValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  normalValueLabelWrap: {
    flex: 1,
  },
  normalValueLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  normalValueSection: {
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 2,
  },
  normalValueText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    textAlign: 'right',
  },
  normalValuesEmpty: {
    fontSize: 12,
    lineHeight: 17,
    paddingVertical: 10,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  textInput: {
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  multilineInput: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    textAlignVertical: 'top',
  },
  /* VIVA Q&A TAB */
  vivaContainer: {
    gap: 12,
  },
  vivaNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  vivaNoticeContent: {
    flex: 1,
  },
  vivaNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d97706',
  },
  vivaNoticeSub: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  vivaCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  vivaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vivaQNumBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: withAlpha('#f59e0b', 0.15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  vivaQNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#d97706',
  },
  vivaQuestionText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 18,
  },
  vivaBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.2)',
    gap: 10,
  },
  vivaAnswerText: {
    fontSize: 13,
    lineHeight: 19,
  },
  examinerTipBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  examinerTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  examinerTipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d97706',
  },
  examinerTipText: {
    fontSize: 12,
    lineHeight: 17,
  },
  discussAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 2,
  },
  discussAiBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  /* PERSISTENT BOTTOM AI CHATBOX */
  chatDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  chatDrawerClosed: {
    height: 52,
  },
  chatDrawerOpen: {
    height: 280,
  },
  chatDrawerExpanded: {
    height: 560,
    maxHeight: '80%',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 50,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatBotIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  chatHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatResetIcon: {
    padding: 4,
  },
  promptChipsScroll: { flexGrow: 0, flexShrink: 0, maxHeight: 56 },
  promptChipsRow: {
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    paddingBottom: 8,
  },
  promptChip: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  promptChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  chatTranscript: {
    flex: 1,
    paddingHorizontal: 12,
  },
  chatTranscriptContent: {
    paddingVertical: 8,
    gap: 8,
  },
  emptyChatBox: {
    padding: 12,
    alignItems: 'center',
  },
  emptyChatText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  chatBubble: {
    padding: 10,
    borderRadius: 12,
    maxWidth: '88%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  botBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chatBubbleText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  busyBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  busyText: {
    fontSize: 12,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  chatTextInput: {
    flex: 1,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chatSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  fullscreenTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  fullscreenClose: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    flex: 1,
    width: '100%',
  },
});
