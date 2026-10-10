import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Linking, Modal, ScrollView, StyleSheet, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpenCheck, ExternalLink, Search, ShieldCheck, X } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { supabase } from '@/lib/supabase';
import { PG_ORIGINAL_PRACTICE, PG_SOURCES, PG_SOURCE_REVIEW_DATE, type PgExam, type PgQuestion } from '@/lib/pgEntranceBank';

type ExamFilter = 'ALL' | PgExam;
type Panel = 'sources' | 'practice';
type PublishedRow = {
  id: string; question: string; opa: string; opb: string; opc: string; opd: string;
  answer: string; explanation: string; exam: string; exam_year: number | null;
  subject: string | null; source_url: string; record_type: string; answer_reference: string;
};
const EXAMS: { id: ExamFilter; title: string }[] = [
  { id: 'ALL', title: 'All' }, { id: 'NEET_PG', title: 'NEET-PG' },
  { id: 'INI_CET', title: 'INI-CET' }, { id: 'FMGE', title: 'FMGE' },
];
const AIPG: Record<PgExam, string[]> = {
  NEET_PG: ['NEET_PG', 'AIPGMEE'],
  INI_CET: ['INI_CET', 'AIIMS_PG', 'PGIMER_PG', 'JIPMER_PG'],
  FMGE: ['FMGE'],
};

function normalize(row: PublishedRow): PgQuestion {
  return {
    id: row.id, exam: row.exam, year: row.exam_year, subject: row.subject || 'General',
    question: row.question, options: [row.opa, row.opb, row.opc, row.opd],
    answer: row.answer, explanation: row.explanation, source_url: row.source_url,
    record_type: row.record_type, answer_reference: row.answer_reference,
  };
}

async function openSource(url: string) {
  try {
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  } catch {
    // Browsers may decline to open a link, but the question bank stays responsive.
  }
}

/**
 * ONE entry point for all postgraduate exams. Research links are not copied
 * into the app as examination questions. Only independently reviewed, published
 * records from the rights-gated pg_exam_questions table may appear as PYQs.
 * ORIGINAL samples never masquerade as previous-year exam questions.
 */
export function PgEntranceBankModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [exam, setExam] = useState<ExamFilter>('ALL');
  const [panel, setPanel] = useState<Panel>('sources');
  const [yearText, setYearText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [published, setPublished] = useState<PgQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishedUnavailable, setPublishedUnavailable] = useState(false);
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let live = true;
    setLoading(true);
    // The optional table may not yet exist. Fail closed: do not surface
    // unreviewed third-party questions as an apparently verified question bank.
    void supabase.from('pg_exam_questions')
      .select('id,question,opa,opb,opc,opd,answer,explanation,exam,exam_year,subject,source_url,record_type,answer_reference')
      .order('exam_year', { ascending: false, nullsFirst: false })
      .limit(80)
      .then(({ data, error }) => {
        if (!live) return;
        setPublished(error ? [] : ((data || []) as PublishedRow[]).map(normalize));
        setPublishedUnavailable(Boolean(error));
        setLoading(false);
      }, () => {
        if (!live) return;
        setPublished([]);
        setPublishedUnavailable(true);
        setLoading(false);
      });
    return () => { live = false; };
  }, [visible]);

  const year = /^\d{4}$/.test(yearText) ? Number(yearText) : null;
  const yearInvalid = yearText.length > 0 && (year === null || year < 1991 || year > 2026);
  const search = searchText.toLocaleLowerCase().trim();

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
            <Text style={[styles.title, { color: colors.text }]}>PG Entrance PYQ Bank</Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>One place for NEET-PG · INI-CET · FMGE</Text>
          </View>
          <Touchable label="Dismiss" onPress={onClose} style={styles.iconButton}>
            <X size={19} color={colors.text} />
          </Touchable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}>
          <View style={[styles.notice, { backgroundColor: withAlpha(colors.primary, 0.08), borderColor: colors.border }]}>
            <ShieldCheck size={17} color={colors.primary} />
            <Text style={[styles.noticeText, { color: colors.text }]}>
              Historical sources from 1991 to 2026. Links may contain unofficial recall answers.
              Only independently reviewed and reuse-cleared questions are shown as in-app PYQs.
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {EXAMS.map(e => (
              <Touchable key={e.id} label={e.title} state={{ selected: exam === e.id }}
                onPress={() => { setExam(e.id); setExpandedAnswer(null); }}
                style={[styles.chip, { borderColor: exam === e.id ? colors.primary : colors.border, backgroundColor: exam === e.id ? withAlpha(colors.primary, 0.13) : colors.card }]}>
                <Text style={[styles.chipText, { color: colors.text }]}>{e.title}</Text>
              </Touchable>
            ))}
          </ScrollView>

          <View style={styles.switchRow}>
            {(['sources', 'practice'] as const).map(p => (
              <Touchable key={p} label={p === 'sources' ? 'Answer-bearing sources' : 'Practice questions'}
                state={{ selected: panel === p }}
                onPress={() => { setPanel(p); setExpandedAnswer(null); }}
                style={[styles.switchButton, { backgroundColor: panel === p ? colors.primary : colors.card, borderColor: panel === p ? colors.primary : colors.border }]}>
                <Text style={[styles.switchText, { color: panel === p ? '#FFFFFF' : colors.text }]}>
                  {p === 'sources' ? 'Sources + answers' : 'Practice MCQs'}
                </Text>
              </Touchable>
            ))}
          </View>

          <View style={styles.filters}>
            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Search size={16} color={colors.textMuted} />
              <TextInput value={searchText} onChangeText={setSearchText} placeholder="Search subjects or sources"
                placeholderTextColor={colors.textMuted} accessibilityLabel="Search PG exam content"
                style={[styles.searchInput, { color: colors.text }]} />
            </View>
            <TextInput value={yearText} onChangeText={setYearText} keyboardType="number-pad" maxLength={4}
              placeholder="All years" placeholderTextColor={colors.textMuted} accessibilityLabel="Filter by exam year from 1991 through 2026"
              style={[styles.yearInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />
          </View>
          {yearInvalid ? (
            <Text style={[styles.small, { color: '#D97706' }]}>Enter a year from 1991 through 2026, or clear for all years.</Text>
          ) : null}

          {panel === 'sources' ? (
            <>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                {sources.length} indexed source{sources.length === 1 ? '' : 's'} with answer information
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
          ) : (
            <>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Reviewed question practice</Text>
              {loading ? <ActivityIndicator color={colors.primary} /> : null}
              {publishedUnavailable ? (
                <Text style={[styles.small, { color: colors.textMuted }]}>
                  The published PG question table is not available yet. Unverified third-party questions remain blocked; original practice is available below.
                </Text>
              ) : null}
              <Text style={[styles.small, { color: colors.textMuted }]}>
                {reviewed.length} approved questions loaded (at most 80 from the server). No full-paper completeness is claimed.
              </Text>
              {reviewed.map(q => <QuestionCard key={q.id} q={q} active={expandedAnswer === q.id}
                onPress={() => setExpandedAnswer(prev => prev === q.id ? null : q.id)}
                colors={colors} />)}
              {reviewed.length === 0 && !loading ? <Text style={[styles.empty, { color: colors.textMuted }]}>
                No approved exam-specific PYQs match this selection. You can still browse recalled questions at their original source links.
              </Text> : null}
              <Text style={[styles.sectionHeading, { color: colors.text }]}>ORBIT original practice — not PYQs</Text>
              {original.map(q => <QuestionCard key={q.id} q={q} active={expandedAnswer === q.id}
                onPress={() => setExpandedAnswer(prev => prev === q.id ? null : q.id)}
                colors={colors} />)}
              {original.length === 0 ? <Text style={[styles.small, { color: colors.textMuted }]}>Clear the year filter to show original practice questions.</Text> : null}
            </>
          )}
          <View style={[styles.bottomNote, { borderColor: colors.border }]}>
            <BookOpenCheck size={17} color={colors.textMuted} />
            <Text style={[styles.small, styles.flex, { color: colors.textMuted }]}>
              MedMCQA is a 2022-era dataset, not a complete annual PYQ archive. Its AIIMS-PG test split has no public answer labels.
            </Text>
          </View>
        </ScrollView>
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
          q.exam.replaceAll('_', '-') + (q.year ? ' • ' + q.year : '') + ' • ' + (q.record_type || 'reviewed')}
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
          <Text style={[styles.question, { color: colors.text }]}>Correct: {q.answer}</Text>
          <Text style={[styles.description, { color: colors.text }]}>{q.explanation}</Text>
          {q.answer_reference ? <Text style={[styles.small, { color: colors.textMuted }]}>Answer checked against: {q.answer_reference}</Text> : null}
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
  switchText: { fontSize: 12, fontWeight: '700' },
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
