import React, { useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

type Year = 'second-year' | 'third-year';
type Entry = {
  id: string;
  subject: string;
  chapter: string;
  question_type: 'essay' | 'short-notes';
  question_text: string;
  source_pdf: string;
  source_page: number;
  quality_status: string;
  exam_dates?: string[];
  question_number?: number;
  source_column?: number;
};
const DB_YEAR: Record<Year, string> = {
  'second-year': 'second-year',
  'third-year': 'third-year',
};
const OPTIONS = [
  { key: 'second-year', label: '2nd' },
  { key: 'third-year', label: '3rd' },
] as const;
const SUBJECTS: Record<Year, { name: string; key: string; count: number }[]> = {
  'second-year': [
    { name: 'Pharmacology', key: 'pharmacology', count: 360 },
    { name: 'Microbiology', key: 'microbiology', count: 247 },
    { name: 'Pathology', key: 'pathology', count: 229 },
  ],
  'third-year': [
    { name: 'Community Medicine', key: 'community-medicine', count: 264 },
    { name: 'Forensic Medicine', key: 'forensic-medicine', count: 188 },
  ],
};

type Item = { kind: 'subject'; name: string; key: string; count: number }
  | { kind: 'chapter'; name: string; count: number }
  | { kind: 'question'; row: Entry };

export default function WbuhsImportedBank({ initialYear, onSwitchBack }: {
  initialYear: YearKey;
  onSwitchBack: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList, 'BrowseHome'>>();
  const [year, setYear] = useState<Year>(initialYear === 'third-year' ? 'third-year' : 'second-year');
  const [subject, setSubject] = useState<string | null>(null);
  const [chapter, setChapter] = useState<string | null>(null);
  const [tab, setTab] = useState<'essay' | 'short-notes'>('essay');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [cached, setCached] = useState(false);
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
    setCached(false);
    setRows([]);
    const fetchAll = async () => {
      try {
        const all: Entry[] = [];
        const cacheKey = `orbit:wbuhs-ocr:${year}:${subject}`;
        const table = 'wbuhs_second_third_questions';
        for (let start = 0; start < 10000; start += 250) {
          const { data, error: queryError } = await supabase
            .from(table)
            .select('id,subject,chapter,question_type,question_text,source_pdf,source_page,source_column,exam_dates,question_number,quality_status')
            .eq('university', 'WBUHS')
            .eq('study_year', DB_YEAR[year])
            .eq('subject', subject)
            .order('source_page')
            .order('source_column')
            .order('question_number')
            .order('id')
            .range(start, start + 249);
          if (queryError) throw new Error(queryError.message);
          if (cancelled) return;
          const batch = (data ?? []) as Entry[];
          all.push(...batch);
          if (batch.length < 250) break;
        }
        if (!cancelled) {
          setRows([...new Map(all.map(row => [row.id, row])).values()]);
          void AsyncStorage.setItem(cacheKey, JSON.stringify(all)).catch(() => undefined);
        }
      } catch (e) {
        try {
          const copy = await AsyncStorage.getItem(`orbit:wbuhs-ocr:${year}:${subject}`);
          if (copy && !cancelled) {
            setRows(JSON.parse(copy) as Entry[]);
            setCached(true);
            return;
          }
        } catch { /* No saved copy */ }
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load WBUHS questions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchAll();
    return () => { cancelled = true; };
  }, [year, subject, retry]);

  const items: Item[] = !subject
    ? SUBJECTS[year].map(item => ({ kind: 'subject' as const, ...item }))
    : !chapter ? chapters
      : topicRows.map(row => ({ kind: 'question' as const, row }));

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
            <Text style={[styles.title, { color: colors.text }]}>WBUHS — {subject ?? 'Previous Questions'}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{chapter ?? 'Second and Third MBBS'}</Text>
          </View>
        </View>
        <Text style={[styles.warning, { color: colors.textMuted, borderColor: colors.border }]}>
          WBUHS questions from PDF scans. Review pending items may contain OCR errors; only source-page-reviewed entries have had their source pages checked. Other records may have OCR errors.
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
        {cached ? <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>Offline cached copy — connect for newer corrections.</Text> : null}
        {loading ? <ActivityIndicator style={{ margin: 20 }} color={colors.primary} /> : null}
        {error ? (
          <Touchable onPress={() => setRetry(current => current + 1)} label="Retry loading WBUHS questions">
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
                    {item.row.exam_dates?.length ? ' • ' + [...new Set(item.row.exam_dates)].join(', ') : ''}
                    {' • '}{item.row.quality_status === 'source_page_reviewed' || item.row.quality_status === 'reviewed_against_pdf' ? 'Source page reviewed' : item.row.quality_status.startsWith('needs_') ? 'OCR review pending' : item.row.quality_status === 'ocr_image_crosschecked' ? 'Image/OCR cross-checked' : 'OCR extracted, not individually verified'}
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
          yearLabel={year === 'second-year' ? 'Second Year' : 'Third Year'}
          university="wbuhs"
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
