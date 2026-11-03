import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { QuestionRow } from '@/components/QuestionRow';
import { SingleQuestionNote } from '@/components/SingleQuestionNote';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import type { HomeStackParamList, RootTabParamList } from '@/navigation/types';
import { hasTextbook } from '@/lib/textbooks';
import { noteQuestionText } from '@/lib/questionText';
import { SegmentedControl } from '@/components/ui';
import { type YearKey } from '@/lib/questionBank';

type Year = 'first-year' | 'second-year' | 'third-year';
type Entry = {
  id: string;
  subject: string;
  chapter: string;
  question_type: 'essay' | 'short-notes';
  question_text: string;
  source_pdf: string;
  source_page: number;
  quality_status: string;
};
const DB_YEAR: Record<Year, string> = {
  'first-year': '1st Year',
  'second-year': '2nd Year',
  'third-year': '3rd Year Part 1',
};
const OPTIONS = [
  { key: 'first-year', label: '1st' },
  { key: 'second-year', label: '2nd' },
  { key: 'third-year', label: '3rd' },
] as const;
const SUBJECTS: Record<Year, { name: string; key: string; count: number }[]> = {
  'first-year': [
    { name: 'Anatomy', key: 'anatomy', count: 426 },
    { name: 'Physiology', key: 'physiology', count: 659 },
    { name: 'Biochemistry', key: 'biochemistry', count: 414 },
  ],
  'second-year': [
    { name: 'Pathology', key: 'pathology', count: 267 },
    { name: 'Pharmacology', key: 'pharmacology', count: 609 },
    { name: 'Microbiology', key: 'microbiology', count: 328 },
  ],
  'third-year': [
    { name: 'Community Medicine (PSM)', key: 'community-medicine', count: 67 },
    { name: 'Forensic Medicine', key: 'forensic-medicine', count: 29 },
  ],
};

type Item = { kind: 'subject'; name: string; key: string; count: number }
  | { kind: 'chapter'; name: string; count: number }
  | { kind: 'question'; row: Entry };

export default function MuhsImportedBank({ initialYear, onSwitchBack }: {
  initialYear: YearKey;
  onSwitchBack: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList, 'BrowseHome'>>();
  const [year, setYear] = useState<Year>(initialYear === 'final-year' ? 'first-year' : initialYear);
  const [subject, setSubject] = useState<string | null>(null);
  const [chapter, setChapter] = useState<string | null>(null);
  const [tab, setTab] = useState<'essay' | 'short-notes'>('essay');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [noted, setNoted] = useState<Entry | null>(null);

  const chosenSubject = SUBJECTS[year].find(item => item.name === subject);
  const topicRows = useMemo(
    () => rows.filter(item => item.chapter === chapter &&
      item.question_type === tab &&
      (!search.trim() || item.question_text.toLowerCase().includes(search.toLowerCase().trim()))),
    [rows, chapter, tab, search],
  );
  const chapters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of rows) counts.set(item.chapter || 'Other', (counts.get(item.chapter || 'Other') || 0) + 1);
    return [...counts].map(([name, count]) => ({ kind: 'chapter' as const, name, count }));
  }, [rows]);

  useEffect(() => {
    if (!subject) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setRows([]);
    const fetchAll = async () => {
      try {
        const all: Entry[] = [];
        for (let start = 0; start < 10000; start += 250) {
          const { data, error: queryError } = await supabase
            .from('muhs_pre_final_questions')
            .select('id,subject,chapter,question_type,question_text,source_pdf,source_page,quality_status')
            .eq('university', 'MUHS')
            .eq('study_year', DB_YEAR[year])
            .eq('subject', subject)
            .order('source_page')
            .range(start, start + 249);
          if (queryError) throw new Error(queryError.message);
          if (cancelled) return;
          const batch = (data ?? []) as Entry[];
          all.push(...batch);
          if (batch.length < 250) break;
        }
        if (!cancelled) {
          const seen = new Set<string>();
          setRows(all.filter(row => {
            const key = [row.chapter, row.question_type, row.question_text.toLowerCase().replace(/[^a-z0-9]/g, '')].join('|');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load MUHS questions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchAll();
    return () => { cancelled = true; };
  }, [year, subject, retry]);

  const items: Item[] = !subject
    ? SUBJECTS[year].map(item => ({ kind: 'subject', ...item }))
    : !chapter ? chapters
      : topicRows.map(row => ({ kind: 'question', row }));

  const goBack = useCallback(() => {
    if (chapter) { setChapter(null); setSearch(''); return; }
    if (subject) { setSubject(null); setRows([]); return; }
    onSwitchBack();
  }, [chapter, subject, onSwitchBack]);

  const askAi = useCallback((question: string) => {
    navigation.getParent<BottomTabNavigationProp<RootTabParamList>>()
      ?.navigate('AskAI', { question, nonce: Date.now() });
  }, [navigation]);

  return (
    <KeyboardSafe>
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Touchable onPress={goBack} label="Back" style={[styles.back, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text }}>‹ Back</Text>
          </Touchable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>MUHS — {subject ?? 'Previous Questions'}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{chapter ?? 'First, Second and Third MBBS'}</Text>
          </View>
        </View>
        <Text style={[styles.warning, { color: colors.textMuted, borderColor: colors.border }]}>
          OCR-extracted questions, not independently verified. Review flagged wording against the source PDF.
        </Text>
        {!subject ? (
          <SegmentedControl options={OPTIONS.map(item => ({ key: item.key, label: item.label }))} value={year} onChange={(next: Year) => {
            setYear(next); setSubject(null); setChapter(null); setRows([]); setSearch('');
          }} />
        ) : null}
        {chapter ? (
          <View style={styles.controls}>
            <SegmentedControl
              options={[{ key: 'essay', label: 'Essay' }, { key: 'short-notes', label: 'Short Notes' }]}
              value={tab}
              onChange={(value: 'essay' | 'short-notes') => { setTab(value); setSearch(''); }}
            />
            <TextInput placeholder="Search this chapter..." placeholderTextColor={colors.textMuted}
              value={search} onChangeText={setSearch}
              style={[styles.search, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]} />
          </View>
        ) : null}
        {loading ? <ActivityIndicator style={{ margin: 20 }} color={colors.primary} /> : null}
        {error ? (
          <Touchable onPress={() => setRetry(current => current + 1)} label="Retry loading MUHS questions">
            <Text style={{ color: colors.danger }}>Loading failed: {error}. Tap to retry.</Text>
          </Touchable>
        ) : null}
        {!loading && !error ? (
          <FlatList
            data={items}
            keyExtractor={item => item.kind === 'question' ? item.row.id : item.name}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={{ color: colors.textMuted }}>No questions in this section.</Text>}
            renderItem={({ item, index }) => {
              if (item.kind === 'question') return (
                <View style={{ marginBottom: 12 }}>
                  <QuestionRow
                    question={item.row.question_text} index={index} onAskAi={askAi}
                    onNote={chosenSubject && hasTextbook(chosenSubject.key, chosenSubject.name) ? () => setNoted(item.row) : undefined}
                  />
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginLeft: 10 }}>
                    {item.row.source_pdf} • PDF page {item.row.source_page}
                    {item.row.quality_status === 'needs_review' ? ' • OCR review needed' : ' • OCR extracted'}
                  </Text>
                </View>
              );
              return (
                <Touchable label={item.name} onPress={() => {
                  if (item.kind === 'subject') { setSubject(item.name); setChapter(null); }
                  else { setChapter(item.name); setTab('essay'); setSearch(''); }
                }} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '700' }}>{item.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.count} questions</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </Touchable>
              );
            }}
          />
        ) : null}
        <SingleQuestionNote
          question={noted ? noteQuestionText(noted.question_text) : null}
          rawQuestion={noted?.question_text ?? null}
          subjectKey={chosenSubject?.key ?? ''}
          subjectName={subject ?? ''}
          yearLabel={DB_YEAR[year]}
          university="muhs"
          onClose={() => setNoted(null)}
        />
      </View>
    </KeyboardSafe>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  back: { borderWidth: 1, borderRadius: 10, padding: 10 },
  title: { fontSize: 18, fontWeight: '800' },
  warning: { fontSize: 11, borderWidth: 1, padding: 9, borderRadius: 10, marginBottom: 12 },
  list: { paddingVertical: 12, paddingBottom: 40 },
  listItem: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 10 },
  controls: { gap: 10, marginTop: 12 },
  search: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 10 },
});
