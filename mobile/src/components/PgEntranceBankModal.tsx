import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Linking, Modal, ScrollView, StyleSheet, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpenCheck, ExternalLink, Search, ShieldCheck, X } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { PgRecentAnswerReview } from '@/components/PgRecentAnswerReview';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { searchOfflinePgQuestions } from '@/lib/pgLocalBank';
import { PG_ORIGINAL_PRACTICE, PG_SOURCES, PG_SOURCE_REVIEW_DATE, type PgExam, type PgQuestion } from '@/lib/pgEntranceBank';

type ExamFilter = 'ALL' | PgExam;
type Panel = 'sources' | 'practice' | 'recent';
const EXAMS: { id: ExamFilter; title: string }[] = [
  { id: 'ALL', title: 'All' }, { id: 'NEET_PG', title: 'NEET-PG' },
  { id: 'INI_CET', title: 'INI-CET' }, { id: 'FMGE', title: 'FMGE' },
];
const AIPG: Record<PgExam, string[]> = {
  NEET_PG: ['NEET_PG', 'AIPGMEE'],
  INI_CET: ['INI_CET', 'AIIMS_PG', 'PGIMER_PG', 'JIPMER_PG'],
  FMGE: ['FMGE'],
};

async function openSource(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    // Browsers may decline to open a link, but the question bank stays responsive.
  }
}

/**
 * ONE entry point for all postgraduate exams. Research links are not copied
 * into the app as examination questions. Only reviewed and reuse-cleared bundled records may appear as exam-specific PYQs.
 * ORIGINAL samples never masquerade as previous-year exam questions.
 */
export function PgEntranceBankModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [exam, setExam] = useState<ExamFilter>('ALL');
  const [panel, setPanel] = useState<Panel>('practice');
  const [yearText, setYearText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [published, setPublished] = useState<PgQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);

  const year = /^\d{4}$/.test(yearText) ? Number(yearText) : null;
  const yearInvalid = yearText.length > 0 && (year === null || year < 1991 || year > 2026);
  const search = searchText.toLocaleLowerCase().trim();

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void searchOfflinePgQuestions({ exam, year, search, limit: 40, offset: page * 40 })
      .then(result => {
        if (cancelled) return;
        setPublished(result.questions);
        setLoadedCount(result.total);
      })
      .catch(err => {
        if (cancelled) return;
        setPublished([]);
        setLoadedCount(0);
        setLoadError(err instanceof Error ? err.message : 'Unable to open the offline pack.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [visible, exam, year, search, page]);

  const sources = useMemo(() => PG_SOURCES.filter(item =>
    (exam === 'ALL' || item.exam === 'ALL' || item.exam === exam) &&
    (year === null || (item.from <= year && item.to >= year)) &&
    (!search || [item.name, item.note, item.kind, item.answerStatus].join(' ').toLocaleLowerCase().includes(search))
  ), [exam, year, search]);

  const reviewed = useMemo(() => published.filter(item =>
    (exam === 'ALL' || (AIPG[exam] || []).includes(item.exam)) &&
    (year === null || item.year === year) &&
    (!search || [item.question, item.subject, item.explanation].join(' ').toLocaleLowerCase().includes(search))
  ), [published, exam, year, search]);

  // Original questions are offered separately and never given exam/year labels.
  const original = useMemo(() => PG_ORIGINAL_PRACTICE.filter(item =>
    year === null && (!search || [item.question, item.subject].join(' ').toLocaleLowerCase().includes(search))
  ), [year, search]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Touchable label="Close PG entrance bank" onPress={onClose} style={styles.iconButton}>
            <ArrowLeft size={21} color={colors.text} />
          </Touchable>
          <View style={styles.flex}>
            <Text style={[styles.title, { color: colors.text }]}>PG Entrance Questions</Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>One place for NEET-PG · INI-CET · FMGE</Text>
          </View>
          <Touchable label="Dismiss" onPress={onClose} style={styles.iconButton}>
            <X size={19} color={colors.text} />
          </Touchable>
        </View>

        <KeyboardSafe>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}>
          <View style={[styles.notice, { backgroundColor: withAlpha(colors.primary, 0.08), borderColor: colors.border }]}>
            <ShieldCheck size={17} color={colors.primary} />
            <Text style={[styles.noticeText, { color: colors.text }]}>
              The 4,180 MedMCQA questions were published in a 2022 dataset, with no
              verified per-question year. For 2023–2026, browse recall sources or use the optional
              signed-in textbook answer checker. These are not imported official papers.
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {EXAMS.map(e => (
              <Touchable key={e.id} label={e.title} state={{ selected: exam === e.id }}
                onPress={() => { setExam(e.id); setPage(0); setExpandedAnswer(null); }}
                style={[styles.chip, { borderColor: exam === e.id ? colors.primary : colors.border, backgroundColor: exam === e.id ? withAlpha(colors.primary, 0.13) : colors.card }]}>
                <Text style={[styles.chipText, { color: colors.text }]}>{e.title}</Text>
              </Touchable>
            ))}
          </ScrollView>

          <View style={styles.switchRow}>
            {(['practice', 'recent', 'sources'] as const).map(p => (
              <Touchable key={p} label={p === 'sources' ? 'Answer-bearing sources' : p === 'recent' ? 'Check a 2023 to 2026 recall against textbooks' : 'Practice questions'}
                state={{ selected: panel === p }}
                onPress={() => { setPanel(p); setExpandedAnswer(null); }}
                style={[styles.switchButton, { backgroundColor: panel === p ? withAlpha(colors.primary, 0.22) : colors.card, borderColor: panel === p ? colors.primary : colors.border }]}>
                <Text style={[styles.switchText, { color: colors.text }]}>
                  {p === 'sources' ? 'Year sources' : p === 'recent' ? 'Textbook AI' : 'Offline MCQs'}
                </Text>
              </Touchable>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {[2023, 2024, 2025, 2026].map(y => (
              <Touchable key={y} label={'Filter recalled questions and source links for '+y}
                onPress={() => { setYearText(String(y)); setPage(0); setExpandedAnswer(null); }}
                style={[styles.chip,{ borderColor: year === y ? colors.primary : colors.border,backgroundColor: year === y ? withAlpha(colors.primary,0.17) : colors.card }]}>
                <Text style={[styles.chipText,{color:colors.text}]}>{y}</Text>
              </Touchable>
            ))}
            <Touchable label="Clear question year" onPress={() => {setYearText('');setPage(0);setExpandedAnswer(null);}}
              style={[styles.chip,{borderColor:colors.border,backgroundColor:colors.card}]}>
              <Text style={[styles.chipText,{color:colors.text}]}>All years</Text>
            </Touchable>
          </ScrollView>
          <View style={styles.filters}>
            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Search size={16} color={colors.textMuted} />
              <TextInput value={searchText} onChangeText={v => { setSearchText(v); setPage(0); }} placeholder="Search subjects or sources"
                placeholderTextColor={colors.textMuted} accessibilityLabel="Search PG exam content"
                style={[styles.searchInput, { color: colors.text }]} />
            </View>
            <TextInput value={yearText} onChangeText={v => { setYearText(v); setPage(0); }} keyboardType="number-pad" maxLength={4}
              placeholder="All years" placeholderTextColor={colors.textMuted} accessibilityLabel="Filter by exam year from 1991 through 2026"
              style={[styles.yearInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />
          </View>
          {yearInvalid ? (
            <Text style={[styles.small, { color: '#D97706' }]}>Enter a year from 1991 through 2026, or clear for all years.</Text>
          ) : null}

          {panel === 'sources' ? (
            <>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                {sources.length} external source link{sources.length === 1 ? '' : 's'}
              </Text>
              <Text style={[styles.small, { color: colors.textMuted }]}>
                Indexed {PG_SOURCE_REVIEW_DATE}. Source year ranges are not proof of complete paper coverage.
                Free access does not grant redistribution rights.
              </Text>
              {sources.map(item => (
                <View key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHead}>
                    <View style={styles.flex}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.small, { color: colors.textMuted }]}>
                        {item.from === item.to ? item.from : item.from + '–' + item.to} · {item.kind}
                      </Text>
                    </View>
                    <ExternalLink size={17} color={colors.primary} />
                  </View>
                  <Text style={[styles.description, { color: colors.text }]}>{item.answerStatus}</Text>
                  <Text style={[styles.small, { color: colors.textMuted }]}>{item.note}</Text>
                  <Touchable onPress={() => { void openSource(item.url); }}
                    label={'Open source with answer information: ' + item.name}
                    style={[styles.sourceLink, { borderColor: colors.border }]}>
                    <Text style={[styles.linkText, { color: colors.primary }]}>Open source / answers ↗</Text>
                  </Touchable>
                </View>
              ))}
              {sources.length === 0 ? <Text style={[styles.empty, { color: colors.textMuted }]}>No indexed source matches this filter. Try another year or exam.</Text> : null}
            </>
          ) : panel === 'recent' ? (
            <PgRecentAnswerReview exam={exam} year={year} onYear={y => {setYearText(String(y));setPage(0);}} />
          ) : (
            <>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Offline medical question practice</Text>
              {loading ? <ActivityIndicator color={colors.primary} /> : null}
              {loadError ? <Text style={[styles.small, { color: '#D97706' }]}>Offline pack error: {loadError}</Text> : null}
              <Text style={[styles.small, { color: colors.textMuted }]}>
                {loadedCount} bundled question{loadedCount === 1 ? '' : 's'} · page {page + 1} of {Math.max(1, Math.ceil(loadedCount / 40))}. Dataset-provided answers are not independently reviewed.
              </Text>
              {reviewed.map(q => <QuestionCard key={q.id} q={q} active={expandedAnswer === q.id}
                onPress={() => setExpandedAnswer(prev => prev === q.id ? null : q.id)}
                colors={colors} />)}
              {loadedCount > 40 ? <View style={styles.switchRow}>
                <Touchable label="Previous page" disabled={page === 0} onPress={() => { setPage(p => Math.max(0, p - 1)); setExpandedAnswer(null); }} style={[styles.switchButton, { borderColor: colors.border, backgroundColor: colors.card }]}><Text style={{ color: colors.text }}>Previous</Text></Touchable>
                <Touchable label="Next page" disabled={(page + 1) * 40 >= loadedCount} onPress={() => { setPage(p => p + 1); setExpandedAnswer(null); }} style={[styles.switchButton, { borderColor: colors.border, backgroundColor: colors.card }]}><Text style={{ color: colors.text }}>Next</Text></Touchable>
              </View> : null}
              {reviewed.length === 0 && !loading ? <Text style={[styles.empty, { color: colors.textMuted }]}>
                No matching dataset questions in this offline build. The source directory links to external exam answer information.
              </Text> : null}
              <Text style={[styles.sectionHeading, { color: colors.text }]}>ORBIT original practice — not PYQs</Text>
              {original.map(q => <QuestionCard key={q.id} q={q} active={expandedAnswer === q.id}
                onPress={() => setExpandedAnswer(prev => prev === q.id ? null : q.id)}
                colors={colors} />)}
              {original.length === 0 ? <Text style={[styles.small, { color: colors.textMuted }]}>Clear the year filter to show original practice questions.</Text> : null}
              <Text style={[styles.small, {color:colors.textMuted}]}>For recalled 2023–2026 questions, open the Textbook AI tab above to check answers using Supabase.</Text>
            </>
          )}
          <View style={[styles.bottomNote, { borderColor: colors.border }]}>
            <BookOpenCheck size={17} color={colors.textMuted} />
            <Text style={[styles.small, styles.flex, { color: colors.textMuted }]}>
              MedMCQA is a 2022-era dataset, not a complete annual PYQ archive. Its AIIMS-PG test split has no public answer labels.
            </Text>
          </View>
        </ScrollView>
        </KeyboardSafe>
      </View>
    </Modal>
  );
}

function QuestionCard({ q, active, onPress, colors }: {
  q: PgQuestion; active: boolean; onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.small, { color: colors.textMuted }]}>
        {q.exam === 'ORIGINAL' ? 'ORBIT original • not asked in a specific exam' :
          q.record_type === 'historical_dataset'
             ? 'MedMCQA dataset practice · answer label not independently reviewed'
             : q.exam.replaceAll('_', '-') + (q.year ? ' • ' + q.year : '') + ' • verified source'}
        {' · '}{q.subject}
      </Text>
      <Text style={[styles.question, { color: colors.text }]}>{q.question}</Text>
      {q.options.map((option, i) => {
        const letter = String.fromCharCode(65 + i);
        return <Text key={letter} style={[styles.option, { color: active && letter === q.answer ? '#16A34A' : colors.text }]}>
          {letter}. {option}
        </Text>;
      })}
      <Touchable label={active ? 'Hide answer and explanation' : 'Show answer and explanation'}
        onPress={onPress} style={[styles.answerButton, { backgroundColor: withAlpha(colors.primary, 0.10) }]}>
        <Text style={[styles.linkText, { color: colors.primary }]}>{active ? 'Hide answer' : 'Reveal answer + explanation'}</Text>
      </Touchable>
      {active ? (
        <View style={[styles.answerBox, { borderColor: colors.border }]}>
          <Text style={[styles.question, { color: colors.text }]}>{q.record_type === 'historical_dataset' ? 'Dataset answer: ' : 'Correct: '}{q.answer}</Text>
          <Text style={[styles.description, { color: colors.text }]}>{q.explanation.trim().length >= 20 ? q.explanation : 'No explanation supplied by the dataset. This answer has not been clinically verified by ORBIT.'}</Text>
          {q.answer_reference ? <Text style={[styles.small, { color: colors.textMuted }]}>Answer-label provenance: {q.answer_reference}</Text> : null}
          {q.source_url ? <Touchable onPress={() => { void openSource(q.source_url!); }} label="Open question source">
            <Text style={[styles.linkText, { color: colors.primary }]}>Open question source ↗</Text>
          </Touchable> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800' },
  sub: { fontSize: 11, marginTop: 2 },
  body: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18 },
  chips: { gap: 8, paddingRight: 12 },
  chip: { paddingHorizontal: 14, minHeight: 40, justifyContent: 'center', borderRadius: 22, borderWidth: 1 },
  chipText: { fontWeight: '700', fontSize: 13 },
  switchRow: { flexDirection: 'row', gap: 8 },
  switchButton: { flex: 1, alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 4 },
  switchText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  filters: { flexDirection: 'row', gap: 8 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, borderWidth: 1, borderRadius: 10, minHeight: 44 },
  searchInput: { flex: 1, paddingVertical: 8, minWidth: 0, fontSize: 13 },
  yearInput: { width: 90, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, fontSize: 12 },
  sectionHeading: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  small: { fontSize: 11, lineHeight: 16 },
  card: { borderWidth: 1, borderRadius: 13, padding: 13, gap: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  description: { fontSize: 12, lineHeight: 18 },
  sourceLink: { borderTopWidth: 1, marginTop: 3, paddingTop: 10, minHeight: 35, justifyContent: 'center' },
  linkText: { fontWeight: '700', fontSize: 12 },
  empty: { fontSize: 13, textAlign: 'center', padding: 20, lineHeight: 19 },
  question: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  option: { fontSize: 12, lineHeight: 18, paddingVertical: 2 },
  answerButton: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginTop: 4 },
  answerBox: { gap: 6, paddingTop: 10, borderTopWidth: 1 },
  bottomNote: { flexDirection: 'row', gap: 10, paddingTop: 12, borderTopWidth: 1 },
});
