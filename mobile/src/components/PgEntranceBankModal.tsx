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
import { searchOfflinePgQuestions, getPgSubjects, getPgChapters, PG_COMPACT, PG_COMPACT_BYTES } from '@/lib/pgLocalBank';
import { PG_ORIGINAL_PRACTICE, PG_SOURCES, PG_SOURCE_REVIEW_DATE, type PgExam, type PgQuestion } from '@/lib/pgEntranceBank';

type ExamFilter = 'ALL' | PgExam | 'GENERAL_MEDICAL';
type Panel = 'sources' | 'practice' | 'recent';
const EXAMS: { id: ExamFilter; title: string }[] = [
  { id: 'ALL', title: 'All' }, { id: 'NEET_PG', title: 'NEET-PG' },
  { id: 'INI_CET', title: 'INI-CET' }, { id: 'FMGE', title: 'FMGE' },
  { id: 'GENERAL_MEDICAL', title: 'Mock practice' },
];

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
  const [exam, setExam] = useState<ExamFilter>('NEET_PG');
  const [panel, setPanel] = useState<Panel>('practice');
  const [yearText, setYearText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [published, setPublished] = useState<PgQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkQuestion,setCheckQuestion] = useState<PgQuestion|null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [chapterFilter, setChapterFilter] = useState<string | null>(null);
  const [chapterSearch, setChapterSearch] = useState('');
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);

  const year = /^\d{4}$/.test(yearText) ? Number(yearText) : null;
  const yearInvalid = yearText.length > 0 && (year === null || year < 1991 || year > 2026);
  const search = searchText.toLocaleLowerCase().trim();
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {const timer=setTimeout(()=>setDebouncedSearch(search),270);return ()=>clearTimeout(timer);},[search]);

  useEffect(() => {
    if (yearInvalid) {setPublished([]);setLoadedCount(0);setLoading(false);return;}
    if (!visible || panel !== 'practice') return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void searchOfflinePgQuestions({ exam, year, search: debouncedSearch, subject: subjectFilter, chapter: chapterFilter, limit: 40, offset: page * 40 })
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
  }, [visible, panel, exam, year, yearInvalid, debouncedSearch, page, subjectFilter, chapterFilter]);

  const sources = useMemo(() => yearInvalid ? [] : PG_SOURCES.filter(item =>
    (exam === 'ALL' || item.exam === 'ALL' || item.exam === exam) &&
    (year === null || (item.from <= year && item.to >= year)) &&
    (!search || [item.name, item.note, item.kind, item.answerStatus].join(' ').toLocaleLowerCase().includes(search))
  ), [exam, year, yearInvalid, search]);

  const reviewed = published;

  const subjects = useMemo(() => getPgSubjects(), []);
  const chapters = useMemo(() => getPgChapters(subjectFilter).filter(c => !chapterSearch || c.name.toLocaleLowerCase().includes(chapterSearch.toLocaleLowerCase())).slice(0,40).map(c => c.name), [subjectFilter, chapterSearch]);

  // Original questions are offered separately and never given exam/year labels.
  const original = useMemo(() => PG_ORIGINAL_PRACTICE.filter(item =>
    !yearInvalid && year === null && (subjectFilter === null || item.subject === subjectFilter) &&
    (chapterFilter === null || item.chapter === chapterFilter) &&
    (!search || [item.question, item.subject, item.chapter].join(' ').toLocaleLowerCase().includes(search))
  ), [year, yearInvalid, search, subjectFilter, chapterFilter]);
  const chapterGroups = useMemo(() => [...new Set(original.map(q => q.subject))].flatMap(subject =>
    [...new Set(original.map(q => q.chapter!))].map(chapter => ({ subject, chapter, questions: original.filter(q => q.subject === subject && q.chapter === chapter) }))
      .filter(group => group.questions.length > 0)
  ), [original]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Touchable label="Close PG entrance bank" onPress={onClose} style={styles.iconButton}>
            <ArrowLeft size={21} color={colors.text} />
          </Touchable>
          <View style={styles.flex}>
            <Text style={[styles.title, { color: colors.text }]}>{exam === 'NEET_PG' ? 'NEET-PG practice questions' : exam === 'INI_CET' ? 'INI-CET practice questions' : exam === 'FMGE' ? 'FMGE practice questions' : 'PG practice questions'}</Text>
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
              Practice questions with supplied answer keys. Answers and chapter labels are not independently medically reviewed; textbook checks are provisional. No verified exam-year archive is claimed.

            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {EXAMS.map(e => (
              <Touchable key={e.id} label={e.title} state={{ selected: exam === e.id }}
                onPress={() => { setExam(e.id); setCheckQuestion(null); setPage(0); setExpandedAnswer(null); }}
                style={[styles.chip, { borderColor: exam === e.id ? colors.primary : colors.border, backgroundColor: exam === e.id ? withAlpha(colors.primary, 0.13) : colors.card }]}>
                <Text style={[styles.chipText, { color: colors.text }]}>{e.title}</Text>
              </Touchable>
            ))}
          </ScrollView>

          <View style={styles.switchRow}>
            {(['practice', 'recent', 'sources'] as const).map(p => (
              <Touchable key={p} label={p === 'sources' ? 'Official exam information' : p === 'recent' ? 'Check an answer against textbooks' : 'Practice questions'}
                state={{ selected: panel === p }}
                onPress={() => { setPanel(p); setCheckQuestion(null); setExpandedAnswer(null); }}
                style={[styles.switchButton, { backgroundColor: panel === p ? withAlpha(colors.primary, 0.22) : colors.card, borderColor: panel === p ? colors.primary : colors.border }]}>
                <Text style={[styles.switchText, { color: colors.text }]}>
                  {p === 'sources' ? 'Exam information' : p === 'recent' ? 'Textbook AI' : 'Offline MCQs'}
                </Text>
              </Touchable>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Touchable label="Clear question year" onPress={() => {setYearText('');setPage(0);setExpandedAnswer(null);}}
              style={[styles.chip,{borderColor:colors.border,backgroundColor:colors.card}]}>
              <Text style={[styles.chipText,{color:colors.text}]}>All years</Text>
            </Touchable>
          </ScrollView>
          <View style={styles.filters}>
            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Search size={16} color={colors.textMuted} />
              <TextInput value={searchText} onChangeText={v => { setSearchText(v); setPage(0); }} placeholder="Search chapters, questions or sources"
                placeholderTextColor={colors.textMuted} accessibilityLabel="Search PG exam content"
                style={[styles.searchInput, { color: colors.text }]} />
            </View>
            <TextInput value={yearText} onChangeText={v => { setYearText(v); setPage(0); }} keyboardType="number-pad" maxLength={4}
              placeholder="All years" placeholderTextColor={colors.textMuted} accessibilityLabel="Filter by exam year from 1991 through 2026"
              style={[styles.yearInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />
          </View>
          {yearInvalid ? (
            <Text style={[styles.small, { color: colors.warning }]}>Enter a year from 1991 through 2026, or clear for all years.</Text>
          ) : null}

          {panel === 'sources' ? (
            <>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                {sources.length} external source link{sources.length === 1 ? '' : 's'}
              </Text>
              <Text style={[styles.small, { color: colors.textMuted }]}>
                Checked {PG_SOURCE_REVIEW_DATE}. These official information links contain no bundled questions or answer keys.
              </Text>
              {sources.map(item => (
                <View key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHead}>
                    <View style={styles.flex}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.small, { color: colors.textMuted }]}>
                        Current official notices · no question bank
                      </Text>
                    </View>
                    <ExternalLink size={17} color={colors.primary} />
                  </View>
                  <Text style={[styles.description, { color: colors.text }]}>{item.answerStatus}</Text>
                  <Text style={[styles.small, { color: colors.textMuted }]}>{item.note}</Text>
                  {item.sessions ? <Text style={[styles.small,{color:colors.textMuted}]}>Located sessions: {item.sessions.join(' · ')}</Text> : null}
                  {item.coverageNote ? <Text style={[styles.small,{color:colors.textMuted}]}>{item.coverageNote}</Text> : null}
                  <Touchable onPress={() => { void openSource(item.url); }}
                    label={'Open official exam information: ' + item.name}
                    style={[styles.sourceLink, { borderColor: colors.border }]}>
                    <Text style={[styles.linkText, { color: colors.primary }]}>Open official information ↗</Text>
                  </Touchable>
                </View>
              ))}
              {sources.length === 0 ? <Text style={[styles.empty, { color: colors.textMuted }]}>No indexed source matches this filter. Try another year or exam.</Text> : null}
            </>
          ) : panel === 'recent' ? (
            yearInvalid ? <Text style={[styles.small,{color:colors.warning}]}>Correct or clear the year before checking an answer.</Text> : <PgRecentAnswerReview exam={exam} initialQuestion={checkQuestion} year={year} onYear={y => {setYearText(y === null ? '' : String(y));setPage(0);}} />
          ) : (
            <>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>PG practice</Text>
              {loading ? <ActivityIndicator color={colors.primary} /> : null}
              {loadError ? <Text style={[styles.small, { color: colors.warning }]}>Offline pack error: {loadError}</Text> : null}
              <Text style={[styles.small, { color: colors.textMuted }]}>
                {loadedCount.toLocaleString()} matching dataset practice questions · {PG_COMPACT.total.toLocaleString()} available · {(PG_COMPACT_BYTES / 1000000).toFixed(2)} MB offline data
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {[null, ...subjects].map(subject => (
                  <Touchable key={subject ?? 'all-subjects'} label={subject ? 'Filter PG subject: ' + subject : 'All PG subjects'}
                    state={{ selected: subjectFilter === subject }}
                    onPress={() => {setSubjectFilter(subject);setChapterFilter(null);setChapterSearch('');setPage(0);setExpandedAnswer(null);}}
                    style={[styles.chip, {borderColor: subjectFilter === subject ? colors.primary : colors.border, backgroundColor: colors.card}]}>
                    <Text style={[styles.chipText, {color: colors.text}]}>{subject ?? 'All subjects'}</Text>
                  </Touchable>
                ))}
              </ScrollView>
              {subjectFilter ? <TextInput value={chapterSearch} onChangeText={v => {setChapterSearch(v);setChapterFilter(null);setPage(0);}}
                accessibilityLabel="Search PG chapters within subject" placeholder="Search chapters within this subject" placeholderTextColor={colors.textMuted}
                style={[styles.chapterSearch,{color:colors.text,borderColor:colors.border,backgroundColor:colors.card}]} /> :
                <Text style={[styles.small,{color:colors.textMuted}]}>Choose a subject to browse its chapters.</Text>}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {[null, ...chapters].map(chapter => (
                  <Touchable key={chapter ?? 'all-chapters'} label={chapter ? 'Filter PG chapter: ' + chapter : 'All PG chapters'}
                    state={{ selected: chapterFilter === chapter }}
                    onPress={() => {setChapterFilter(chapter);setPage(0);setExpandedAnswer(null);}}
                    style={[styles.chip, {borderColor: chapterFilter === chapter ? colors.primary : colors.border, backgroundColor: colors.card}]}>
                    <Text style={[styles.chipText, {color: colors.text}]}>{chapter ?? 'All chapters'}</Text>
                  </Touchable>
                ))}
              </ScrollView>
              {reviewed.map(q => <QuestionCard key={q.id} q={q} active={expandedAnswer === q.id}
                onPress={() => setExpandedAnswer(prev => prev === q.id ? null : q.id)}
                onCheck={() => {setCheckQuestion(q);setPanel('recent');setYearText(q.year === null ? '' : String(q.year));}} colors={colors} />)}
              {loadedCount > 40 ? <View style={styles.switchRow}>
                <Touchable label="Previous page" disabled={page === 0} onPress={() => { setPage(p => Math.max(0, p - 1)); setExpandedAnswer(null); }} style={[styles.switchButton, { borderColor: colors.border, backgroundColor: colors.card }]}><Text style={{ color: colors.text }}>Previous</Text></Touchable>
                <Touchable label="Next page" disabled={(page + 1) * 40 >= loadedCount} onPress={() => { setPage(p => p + 1); setExpandedAnswer(null); }} style={[styles.switchButton, { borderColor: colors.border, backgroundColor: colors.card }]}><Text style={{ color: colors.text }}>Next</Text></Touchable>
              </View> : null}
              {reviewed.length === 0 && !loading ? <Text style={[styles.empty, { color: colors.textMuted }]}>
                No undated practice questions match these filters. Clear the year or try another subject, chapter or search.
              </Text> : null}
              <Text style={[styles.sectionHeading, { color: colors.text }]}>ORBIT original practice — not PYQs</Text>
              <Text style={[styles.small, { color: colors.textMuted }]}>
                {original.length} of {PG_ORIGINAL_PRACTICE.length} original practice questions · {chapterGroups.length} chapters · 0 imported PYQs
              </Text>
              {chapterGroups.map(group => (
                <View key={group.subject + ':' + group.chapter} style={styles.chapterGroup}>
                  <Text style={[styles.sectionHeading, {color: colors.text}]}>{group.subject} · {group.chapter}</Text>
                  <Text style={[styles.small, {color: colors.textMuted}]}>{group.questions.length} original practice question{group.questions.length === 1 ? '' : 's'}</Text>
                  {group.questions.map(q => <QuestionCard key={q.id} q={q} active={expandedAnswer === q.id}
                    onPress={() => setExpandedAnswer(prev => prev === q.id ? null : q.id)}
                    onCheck={() => {setCheckQuestion(q);setPanel('recent');setYearText(q.year === null ? '' : String(q.year));}} colors={colors} />)}
                </View>
              ))}
              {original.length === 0 ? <Text style={[styles.small, { color: colors.textMuted }]}>No original practice questions match. Clear the year, subject, chapter or search filters.</Text> : null}
              <Text style={[styles.small, {color:colors.textMuted}]}>Textbook AI can provide a provisional explanation for medical practice questions you own or have permission to use.</Text>
            </>
          )}
          <View style={[styles.bottomNote, { borderColor: colors.border }]}>
            <BookOpenCheck size={17} color={colors.textMuted} />
            <Text style={[styles.small, styles.flex, { color: colors.textMuted }]}>
              Source answers remain provisional. Credits and third-party licences are available in Settings → About.
            </Text>
          </View>
        </ScrollView>
        </KeyboardSafe>
      </View>
    </Modal>
  );
}

function QuestionCard({ q, active, onPress, onCheck, colors }: {
  q: PgQuestion; active: boolean; onPress: () => void; onCheck: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.small, { color: colors.textMuted }]}>
        {q.exam === 'ORIGINAL' ? 'ORBIT original • not asked in a specific exam' :
          q.record_type === 'licensed_practice_dataset' ? 'Practice question · supplied answer, review pending' :
          q.record_type === 'historical_dataset'
             ? (q.exam === 'GENERAL_MEDICAL' ? 'MOCK / TEST SERIES · answer not independently verified' : 'NEET-PG validation · exam year unknown')
             : q.exam.replaceAll('_', '-') + (q.year ? ' • ' + q.year : '') + ' • source-labelled, review pending'}
        {' · '}{q.subject}{q.chapter ? ' · ' + q.chapter : ''}
      </Text>
      <Text style={[styles.question, { color: colors.text }]}>{q.question}</Text>
      {q.options.map((option, i) => {
        const letter = String.fromCharCode(65 + i);
        return <Text key={letter} style={[styles.option, { color: active && letter === q.answer ? colors.success : colors.text }]}>
          {letter}. {option}
        </Text>;
      })}
      <Touchable label={active ? 'Hide answer and explanation' : 'Show answer and explanation'}
        onPress={onPress} style={[styles.answerButton, { backgroundColor: withAlpha(colors.primary, 0.10) }]}>
        <Text style={[styles.linkText, { color: colors.primary }]}>{active ? 'Hide answer' : 'Reveal answer + explanation'}</Text>
      </Touchable>
      {active ? (
        <View style={[styles.answerBox, { borderColor: colors.border }]}>
          <Text style={[styles.question, { color: colors.text }]}>{q.record_type === 'historical_dataset' || q.record_type === 'licensed_practice_dataset' ? 'Dataset answer: ' : 'Supplied answer: '}{q.answer}</Text>
          <Text style={[styles.description, { color: colors.text }]}>{q.explanation.trim().length >= 20 ? q.explanation : 'No explanation supplied. Use the textbook check for a provisional explanation; this dataset answer has not been independently medically reviewed.'}</Text>
          <Touchable label={'Check supplied answer against textbooks: ' + q.id} onPress={onCheck} style={styles.answerButton}><Text style={[styles.linkText,{color:colors.primary}]}>Check this answer against textbooks</Text></Touchable>
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
  chapterGroup: { gap: 8 },
  chapterSearch: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, fontSize: 13 },
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
