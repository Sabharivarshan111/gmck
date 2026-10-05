import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  FileText,
  Search,
  Stethoscope,
  X,
} from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { useTheme, withAlpha } from '@/theme';
import {
  countReadableClinicalCases,
  fetchApprovedClinicalCase,
  fetchClinicalDatasetCatalog,
  searchApprovedClinicalCases,
  type ClinicalDatasetCatalog,
  type ClinicalDatasetCaseDetail,
  type ClinicalDatasetCaseSummary,
} from '@/lib/clinicalDataset';

export interface ClinicalCaseLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  mode?: 'practice' | 'library';
}

function plainItem(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (!value || typeof value !== 'object') {
    return '';
  }
  const item = value as Record<string, unknown>;
  for (const key of [
    'diagnosis',
    'name',
    'condition',
    'mistake',
    'pitfall',
    'text',
    'description',
    'rationale',
    'reason',
  ]) {
    if (typeof item[key] === 'string' && item[key].trim()) {
      return item[key].trim();
    }
  }
  const parts = Object.entries(item)
    .filter(([, candidate]) => typeof candidate === 'string' || typeof candidate === 'number')
    .slice(0, 3)
    .map(([key, candidate]) => `${key.replace(/_/g, ' ')}: ${String(candidate)}`);
  return parts.join(' • ');
}

export function ClinicalCaseLibraryModal({
  visible,
  onClose,
  mode = 'practice',
}: ClinicalCaseLibraryModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [cases, setCases] = useState<ClinicalDatasetCaseSummary[]>([]);
  const [catalog, setCatalog] = useState<ClinicalDatasetCatalog | null>(null);
  const [totalCases, setTotalCases] = useState(0);
  const [selected, setSelected] = useState<ClinicalDatasetCaseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    let cancelled = false;
    Promise.all([fetchClinicalDatasetCatalog(), countReadableClinicalCases()])
      .then(([row, count]) => {
        if (!cancelled) {
          setCatalog(row);
          setTotalCases(count);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalog(null);
          setTotalCases(0);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchApprovedClinicalCases(query, undefined, 50)
        .then(rows => {
          if (!cancelled) {
            setCases(rows);
          }
        })
        .catch(err => {
          if (!cancelled) {
            setCases([]);
            setError(err instanceof Error ? err.message : 'Could not load clinical cases.');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, query.trim() ? 250 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [visible, query]);

  useEffect(() => {
    if (!visible) {
      setSelected(null);
      setRevealed(false);
      setTranscriptOpen(false);
    }
  }, [visible]);

  const openCase = async (item: ClinicalDatasetCaseSummary) => {
    setDetailLoading(true);
    setError(null);
    setRevealed(false);
    setTranscriptOpen(false);
    try {
      const full = await fetchApprovedClinicalCase(item.id);
      if (!full) {
        setError('This case is no longer in the reviewed library.');
        return;
      }
      setSelected(full);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open this clinical case.');
    } finally {
      setDetailLoading(false);
    }
  };

  const visibleTurns = useMemo(
    () =>
      (selected?.conversation ?? []).filter(
        turn => turn.role === 'user' || turn.role === 'assistant',
      ),
    [selected],
  );
  const debriefVisible = mode === 'library' || revealed;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={selected ? () => setSelected(null) : onClose}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 10,
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}>
          <Touchable
            onPress={selected ? () => setSelected(null) : onClose}
            label={selected ? 'Back to case library' : 'Close case library'}
            hitSlop={10}
            scaleTo={0.9}
            style={[styles.roundButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {selected ? (
              <ArrowLeft size={20} color={colors.text} />
            ) : (
              <X size={20} color={colors.text} />
            )}
          </Touchable>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {selected
                ? selected.name
                : mode === 'practice'
                  ? 'Patient simulator cases'
                  : 'Clinical case library'}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>
              {mode === 'practice'
                ? 'Curated synthetic cases for MBBS practice'
                : 'Browse searchable clinical teaching cases'}
            </Text>
          </View>
          <View style={[styles.reviewedBadge, { backgroundColor: withAlpha(colors.primary, 0.12) }]}>
            <Text style={[styles.reviewedBadgeText, { color: colors.primary }]}>
              {selected
                ? selected.reviewStatus === 'source'
                  ? 'OPUS SOURCE'
                  : selected.sourceDataset === 'orbit-curated-v1'
                    ? 'ORBIT CURATED'
                    : 'REVIEWED'
                : loading
                  ? 'LOADING'
                  : totalCases
                    ? `${totalCases.toLocaleString()} CASES`
                    : `${cases.length} CASES`}
            </Text>
          </View>
        </View>

        {detailLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.centerText, { color: colors.textMuted }]}>Opening case…</Text>
          </View>
        ) : selected ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.detailContent,
              { paddingBottom: Math.max(insets.bottom, 16) + 28 },
            ]}
            showsVerticalScrollIndicator={false}>
            <View
              style={[
                styles.safetyBanner,
                {
                  backgroundColor: withAlpha('#B45309', 0.1),
                  borderColor: withAlpha('#B45309', 0.28),
                },
              ]}>
              <AlertTriangle size={18} color="#B45309" />
              <View style={styles.flex}>
                <Text style={[styles.safetyTitle, { color: colors.text }]}>
                  {mode === 'practice' ? 'Simulated case for exam practice' : 'Educational case reference'}
                </Text>
                <Text style={[styles.safetyBody, { color: colors.textMuted }]}>
                  {selected.reviewStatus === 'source'
                    ? 'External synthetic source case. It is published for education but has not been clinically reviewed by ORBIT; verify important facts against primary sources.'
                    : mode === 'practice'
                      ? 'Educational synthetic case, not clinical guidance.'
                      : 'Browse the complete teaching record. This is educational content, not patient-specific clinical guidance.'}
                </Text>
              </View>
            </View>

            <View style={[styles.caseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeading}>
                <Stethoscope size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Presentation</Text>
              </View>
              <Text style={[styles.body, { color: colors.text }]}>{selected.patientScenario}</Text>
              <View style={styles.chipRow}>
                {selected.icd10 ? (
                  <View style={[styles.chip, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
                    <Text style={[styles.chipText, { color: colors.primary }]}>{selected.icd10}</Text>
                  </View>
                ) : null}
                {selected.bodySystems.slice(0, 4).map(system => (
                  <View
                    key={system}
                    style={[styles.chip, { backgroundColor: withAlpha(colors.textMuted, 0.1) }]}>
                    <Text style={[styles.chipText, { color: colors.textMuted }]}>{system}</Text>
                  </View>
                ))}
              </View>
            </View>

            {!debriefVisible ? (
              <View style={[styles.caseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.practiceTitle, { color: colors.text }]}>Before you reveal</Text>
                <Text style={[styles.body, { color: colors.textMuted }]}>
                  Take the history, formulate a provisional diagnosis and list your differentials first.
                  The teaching summary and pitfalls stay hidden until you choose to reveal them.
                </Text>
                <Touchable
                  onPress={() => setRevealed(true)}
                  label="Reveal case debrief"
                  scaleTo={0.97}
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
                  <BookOpen size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Reveal debrief</Text>
                </Touchable>
              </View>
            ) : (
              <>
                {selected.executiveSummary ? (
                  <View
                    style={[styles.caseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.sectionHeading}>
                      <BookOpen size={18} color={colors.primary} />
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>Teaching summary</Text>
                    </View>
                    <Text style={[styles.body, { color: colors.text }]}>
                      {selected.executiveSummary}
                    </Text>
                  </View>
                ) : null}

                <TeachingList
                  title="Differential diagnosis"
                  items={selected.differentialDiagnosis}
                  empty="No differential list was retained for this record."
                />
                <TeachingList
                  title="Common mistakes"
                  items={selected.commonMistakes}
                  empty="No common-mistake list was retained for this record."
                />

                <View
                  style={[styles.caseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.sectionHeading}>
                    <FileText size={18} color={colors.primary} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>References</Text>
                  </View>
                  {selected.pubmedRefs.length ? (
                    selected.pubmedRefs.slice(0, 8).map((ref, index) => (
                      <Text
                        key={`${ref.pmid ?? 'ref'}-${index}`}
                        style={[styles.listText, { color: colors.text }]}>
                        {index + 1}. {ref.title ?? (ref.pmid ? `PubMed ${ref.pmid}` : 'PubMed reference')}
                        {ref.year ? ` (${ref.year})` : ''}
                      </Text>
                    ))
                  ) : (
                    <Text style={[styles.body, { color: colors.textMuted }]}>
                      {selected.sourceDataset === 'orbit-curated-v1'
                        ? 'This ORBIT starter case does not have attached primary references yet.'
                        : 'No references are attached to this reviewed external row.'}
                    </Text>
                  )}
                  <Text style={[styles.referenceNote, { color: colors.textMuted }]}>
                    A PMID resolving to a paper does not prove every generated statement is supported by
                    that paper. Verify important clinical facts against primary sources.
                  </Text>
                </View>

                {visibleTurns.length ? (
                  <>
                    <Touchable
                      onPress={() => setTranscriptOpen(open => !open)}
                      label={transcriptOpen ? 'Hide teaching transcript' : 'Show teaching transcript'}
                      scaleTo={0.98}
                      style={[styles.outlineButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      <Text style={[styles.outlineButtonText, { color: colors.text }]}>
                        {transcriptOpen ? 'Hide teaching transcript' : 'Show teaching transcript'}
                      </Text>
                      <ChevronRight
                        size={18}
                        color={colors.textMuted}
                        style={{ transform: [{ rotate: transcriptOpen ? '90deg' : '0deg' }] }}
                      />
                    </Touchable>

                    {transcriptOpen ? (
                      <View
                        style={[styles.caseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {visibleTurns.map((turn, index) => (
                          <View
                            key={`${turn.role}-${index}`}
                            style={[
                              styles.turn,
                              {
                                backgroundColor:
                                  turn.role === 'assistant'
                                    ? withAlpha(colors.primary, 0.08)
                                    : withAlpha(colors.textMuted, 0.07),
                              },
                            ]}>
                            <Text style={[styles.turnRole, { color: colors.textMuted }]}>
                              {turn.role === 'assistant' ? 'CLINICIAN' : 'PATIENT'}
                            </Text>
                            <Text style={[styles.body, { color: colors.text }]}>{turn.content}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </>
                ) : null}

                <Text style={[styles.provenance, { color: colors.textMuted }]}>
                  Source: {selected.sourceDataset}. Content note: {selected.sourceLicense}
                </Text>
              </>
            )}
          </ScrollView>
        ) : (
          <KeyboardSafe>
            <ScrollView
              style={styles.flex}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: Math.max(insets.bottom, 16) + 24 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <View
                style={[
                  styles.infoCard,
                  { backgroundColor: withAlpha(colors.primary, 0.08), borderColor: withAlpha(colors.primary, 0.2) },
                ]}>
                <Stethoscope size={20} color={colors.primary} />
                <View style={styles.flex}>
                  <Text style={[styles.infoTitle, { color: colors.text }]}>
                    {mode === 'practice' ? 'Patient simulator source bank' : 'Clinical case library'}
                  </Text>
                  <Text style={[styles.infoBody, { color: colors.textMuted }]}>
                    {mode === 'practice'
                      ? 'Choose a live case, take the history and commit to your diagnosis before revealing the debrief.'
                      : 'Browse live cases directly by disease, alias, symptom, presentation or ICD-10.'}
                  </Text>
                  {catalog ? (
                    <Text style={[styles.sourceStatus, { color: colors.textMuted }]}>
                      {catalog.recordsTotal.toLocaleString()} Opus 5.5 source cases loaded
                      {' • '}{catalog.recordsStructurallyValid.toLocaleString()} structurally validated
                      {' • '}{catalog.publishedCases.toLocaleString()} published as external source cases
                      {' • '}{Math.max(0, totalCases - catalog.publishedCases).toLocaleString()} ORBIT-curated cases
                    </Text>
                  ) : null}
                </View>
              </View>

              <View
                style={[
                  styles.searchBox,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}>
                <Search size={18} color={colors.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search disease, alias or ICD-10"
                  placeholderTextColor={colors.textMuted}
                  autoCorrect={false}
                  autoCapitalize="none"
                  style={[styles.searchInput, { color: colors.text }]}
                />
                {query ? (
                  <Touchable
                    onPress={() => setQuery('')}
                    label="Clear search"
                    hitSlop={10}
                    scaleTo={0.9}>
                    <X size={18} color={colors.textMuted} />
                  </Touchable>
                ) : null}
              </View>

              {error ? (
                <View
                  style={[
                    styles.errorCard,
                    { backgroundColor: withAlpha('#B91C1C', 0.08), borderColor: withAlpha('#B91C1C', 0.2) },
                  ]}>
                  <Text style={[styles.body, { color: colors.text }]}>{error}</Text>
                </View>
              ) : null}

              {loading ? (
                <View style={styles.inlineLoading}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={[styles.centerText, { color: colors.textMuted }]}>Loading cases…</Text>
                </View>
              ) : cases.length ? (
                cases.map(item => (
                  <Touchable
                    key={item.id}
                    onPress={() => openCase(item)}
                    label={`${item.name}, ${mode === 'practice' ? 'start simulated clinical case' : 'open case record'}`}
                    scaleTo={0.985}
                    style={[
                      styles.row,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}>
                    <View
                      style={[
                        styles.rowIcon,
                        { backgroundColor: withAlpha(colors.primary, 0.12) },
                      ]}>
                      <Stethoscope size={18} color={colors.primary} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>{item.name}</Text>
                      <Text
                        style={[styles.rowSub, { color: colors.textMuted }]}
                        numberOfLines={2}>
                        {[
                          item.reviewStatus === 'source'
                            ? 'Opus source • not ORBIT-reviewed'
                            : item.sourceDataset === 'orbit-curated-v1'
                              ? 'ORBIT curated'
                              : 'Reviewed external',
                          item.icd10,
                          item.bodySystems.slice(0, 2).join(' • '),
                          item.aliases[0],
                        ]
                          .filter(Boolean)
                          .join('  ·  ')}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </Touchable>
                ))
              ) : (
                <View
                  style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <BookOpen size={28} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {query ? 'No case matches this search' : 'No cases published yet'}
                  </Text>
                  <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                    {query
                      ? 'Try a disease name, common abbreviation, symptom keyword or ICD-10 code.'
                      : 'ORBIT starter cases should appear here. External imports remain hidden until reviewed.'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </KeyboardSafe>
        )}
      </View>
    </Modal>
  );

  function TeachingList({
    title,
    items,
    empty,
  }: {
    title: string;
    items: unknown[];
    empty: string;
  }) {
    const readable = items.map(plainItem).filter(Boolean);
    return (
      <View style={[styles.caseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        {readable.length ? (
          readable.slice(0, 10).map((item, index) => (
            <Text key={`${title}-${index}`} style={[styles.listText, { color: colors.text }]}>
              {index + 1}. {item}
            </Text>
          ))
        ) : (
          <Text style={[styles.body, { color: colors.textMuted }]}>{empty}</Text>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: {
    minHeight: 78,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { marginTop: 2, fontSize: 12 },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewedBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  reviewedBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  listContent: { padding: 16, gap: 12 },
  detailContent: { padding: 16, gap: 12 },
  infoCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  infoTitle: { fontSize: 15, fontWeight: '800' },
  infoBody: { marginTop: 4, fontSize: 12.5, lineHeight: 18 },
  sourceStatus: { marginTop: 8, fontSize: 11.5, lineHeight: 17, fontWeight: '600' },
  searchBox: {
    height: 50,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  row: {
    minHeight: 76,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 15, fontWeight: '800' },
  rowSub: { marginTop: 4, fontSize: 11.5, lineHeight: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  centerText: { fontSize: 13 },
  inlineLoading: {
    minHeight: 80,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  emptyCard: {
    minHeight: 180,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { marginTop: 10, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  emptyBody: { marginTop: 6, fontSize: 12.5, lineHeight: 18, textAlign: 'center' },
  safetyBanner: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13,
    flexDirection: 'row',
    gap: 10,
  },
  safetyTitle: { fontSize: 14, fontWeight: '800' },
  safetyBody: { marginTop: 3, fontSize: 12, lineHeight: 17 },
  caseCard: {
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 15,
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 7 },
  body: { fontSize: 13.5, lineHeight: 20 },
  chipRow: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  chipText: { fontSize: 10.5, fontWeight: '700' },
  practiceTitle: { fontSize: 16, fontWeight: '900', marginBottom: 7 },
  primaryButton: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  listText: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  referenceNote: { marginTop: 12, fontSize: 11.5, lineHeight: 17 },
  outlineButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  outlineButtonText: { fontSize: 13.5, fontWeight: '800' },
  turn: { borderRadius: 12, padding: 11, marginTop: 8 },
  turnRole: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.8, marginBottom: 5 },
  provenance: { fontSize: 10.5, lineHeight: 16, paddingHorizontal: 2 },
});

export default ClinicalCaseLibraryModal;
