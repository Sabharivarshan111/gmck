import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ChevronRight, Search } from 'lucide-react-native';
import { loadWbuhsOcrYear } from '@/lib/wbuhsOcrBank';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { QuestionRow } from '@/components/QuestionRow';
import { SingleQuestionNote } from '@/components/SingleQuestionNote';
import { UniversityMcqAnswer } from '@/components/UniversityMcqAnswer';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { SegmentedControl } from '@/components/ui';
import { useTheme } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HomeStackParamList, RootTabParamList } from '@/navigation/types';
import { YEAR_KEYS, YEAR_LABEL, SUBJECT_ICON, type YearKey } from '@/lib/questionBank';
import { useCountDone } from '@/hooks/useProgress';
import { noteQuestionText, getCleanQuestionText } from '@/lib/questionText';
import { hasTextbook } from '@/lib/textbooks';
import { collectedRecordedExamCount } from '@data/universityPapers/presentation';
import { loadUniversityOfflineSubject, offlineUniversitySubjects, UNIVERSITY_OFFLINE_MANIFEST } from '@/lib/universityOfflineBank';
import type { OfflineUniversityQuestion } from '@/lib/universityOfflineTypes';
import {
  isRguhsSourceChecked, mergeUniversityQuestions, rguhsSubjectIdentity,
  type RguhsKind, type RguhsRow, type UnifiedUniversity, type UniversityOcrQuestion,
} from '@/lib/rguhsUnifiedBank';

type SubjectItem = { kind: 'subject'; name: string; identity: string; count: number; done: number; icon: string };
type ChapterItem = { kind: 'chapter'; name: string; count: number };
type QuestionItem = { kind: 'question'; row: RguhsRow };
type ListItem = SubjectItem | ChapterItem | QuestionItem;
type YearRows = Partial<Record<YearKey, RguhsRow[]>>;
type YearErrors = Partial<Record<YearKey, string>>;

const TABS: { key: RguhsKind; label: string }[] = [
  { key: 'essay', label: 'Essay' },
  { key: 'short-notes', label: 'Short Notes' },
  { key: 'mcq', label: 'MCQ' },
  { key: 'other', label: 'Other' },
];
const YEARS = YEAR_KEYS.map(key => ({ key, label: YEAR_LABEL[key].replace(' Year', '') }));
const RESULT_LIMIT = 120;

export function UnifiedImportedUniversityBank({
  university, initialYear, onSwitchBack,
}: {
  university: UnifiedUniversity;
  initialYear: YearKey;
  onSwitchBack?: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList, 'BrowseHome'>>();
  const countDone = useCountDone();
  const [year, setYear] = useState<YearKey>(initialYear);
  const [subject, setSubject] = useState<string | null>(null);
  const [chapter, setChapter] = useState<string | null>(null);
  const [tab, setTab] = useState<RguhsKind>('essay');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [years, setYears] = useState<YearRows>({});
  const [errors, setErrors] = useState<YearErrors>({});
  const [noted, setNoted] = useState<RguhsRow | null>(null);
  const [mcqTarget, setMcqTarget] = useState<string | null>(null);
  const cache = useRef<YearRows>({});
  const pending = useRef<Partial<Record<YearKey, Promise<void>>>>({});
  // Keep the selected university from onboarding/Settings as the sole source
  // of truth, including on transitions that preserve this component instance.
  const previousUniversity = useRef(university);
  if (previousUniversity.current !== university) {
    previousUniversity.current = university;
    cache.current = {};
    pending.current = {};
  }
  useEffect(() => {
    setYears({});
    setErrors({});
    setSubject(null);
    setChapter(null);
    setQuery('');
    setDebounced('');
    setNoted(null);
    setMcqTarget(null);
    setYear(initialYear);
  }, [university, initialYear]);

  /** Read on-device checksum-pinned assets; never fetch university questions at runtime. */
  const loadYear = useCallback((requestedYear: YearKey, force = false): Promise<void> => {
    if (!force && cache.current[requestedYear]) return Promise.resolve();
    if (pending.current[requestedYear]) return pending.current[requestedYear]!;
    const job = (async () => {
      // The reviewed bank is already bundled. Render it immediately even if
      // WBUHS OCR has never been downloaded on this device.
      if (university === 'wbuhs') {
        const reviewed = mergeUniversityQuestions(university, requestedYear, []);
        cache.current[requestedYear] = reviewed;
        setYears(previous => ({ ...previous, [requestedYear]: reviewed }));
      }
      let bundled: UniversityOcrQuestion[] = [];
      let failures = 0;
      if (university === 'wbuhs') {
        const result = await loadWbuhsOcrYear(requestedYear, force);
        bundled = result.rows;
        failures = result.failures.length;
      } else {
        const packs = offlineUniversitySubjects(university, requestedYear);
        const results = await Promise.allSettled(packs.map(pack =>
          loadUniversityOfflineSubject(university, requestedYear, pack.subject)));
        results.forEach(result => {
          if (result.status === 'fulfilled') bundled.push(...result.value);
          else failures++;
        });
      }
      const merged = mergeUniversityQuestions(university, requestedYear, bundled);
      cache.current[requestedYear] = merged;
      setYears(previous => ({ ...previous, [requestedYear]: merged }));
      setErrors(previous => ({
        ...previous,
        [requestedYear]: failures
          ? university === 'wbuhs'
            ? String(failures) + ' scanned subject(s) unavailable. Reviewed questions remain accessible; downloaded scans are cached.'
            : String(failures) + ' offline subject pack(s) could not be read. Reviewed questions are still available.'
          : '',
      }));
    })().finally(() => { delete pending.current[requestedYear]; });
    pending.current[requestedYear] = job;
    return job;
  }, [university]);

  useEffect(() => { void loadYear(year); }, [year, loadYear]);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 230);
    return () => clearTimeout(timer);
  }, [query]);
  const searchingAll = subject === null && debounced.length >= 2;
  useEffect(() => {
    if (searchingAll) void Promise.all(YEAR_KEYS.map(value => loadYear(value)));
  }, [searchingAll, loadYear]);

  const yearRows = years[year] ?? [];
  const loadedYear = years[year] !== undefined;
  const subjectRows = useMemo(() =>
    subject ? yearRows.filter(row => rguhsSubjectIdentity(row.subjectName) === subject) : [],
  [yearRows, subject]);
  const chapters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of subjectRows) counts.set(row.chapter, (counts.get(row.chapter) ?? 0) + 1);
    return [...counts].map(([name, count]) => ({ kind: 'chapter' as const, name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [subjectRows]);
  const subjects = useMemo(() => {
    const grouped = new Map<string, { name: string; rows: RguhsRow[]; icon: string }>();
    for (const row of yearRows) {
      const id = rguhsSubjectIdentity(row.subjectName);
      const entry = grouped.get(id) ?? { name: row.subjectName, rows: [], icon: SUBJECT_ICON[row.subjectKey] ?? '📘' };
      entry.rows.push(row);
      grouped.set(id, entry);
    }
    return [...grouped].map(([identity, data]) => ({
      kind: 'subject' as const, identity, name: data.name, icon: data.icon,
      count: data.rows.length, done: countDone(data.rows.map(row => row.question)),
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [yearRows, countDone]);

  const globalRows = useMemo(() =>
    searchingAll ? YEAR_KEYS.flatMap(value => years[value] ?? []) : [],
  [years, searchingAll]);
  const globalMatches = useMemo(() => {
    if (!searchingAll) return [];
    const needle = debounced.toLowerCase();
    return globalRows.filter(row => row.university === university && (
      getCleanQuestionText(row.question).toLowerCase().includes(needle) ||
      row.chapter.toLowerCase().includes(needle) ||
      row.subjectName.toLowerCase().includes(needle)));
  }, [searchingAll, globalRows, debounced, university]);
  const globalLoading = searchingAll && YEAR_KEYS.some(value => years[value] === undefined);
  const entries: ListItem[] = searchingAll
    ? globalMatches.slice(0, RESULT_LIMIT).map(row => ({ kind: 'question', row }))
    : subject === null
      ? subjects
      : chapter === null
        ? chapters
        : subjectRows
          .filter(row => row.chapter === chapter && row.kind === tab)
          .filter(row => !debounced || getCleanQuestionText(row.question).toLowerCase().includes(debounced.toLowerCase()))
          .map(row => ({ kind: 'question', row }));

  const goBack = useCallback(() => {
    if (searchingAll) { setQuery(''); setDebounced(''); return; }
    if (chapter !== null) { setChapter(null); setQuery(''); return; }
    if (subject !== null) { setSubject(null); setQuery(''); return; }
    if (onSwitchBack) onSwitchBack();
    else navigation.goBack();
  }, [searchingAll, chapter, subject, onSwitchBack, navigation]);
  const askAi = useCallback((question: string) => {
    navigation.getParent<BottomTabNavigationProp<RootTabParamList>>()
      ?.navigate('AskAI', { question, nonce: Date.now() });
  }, [navigation]);
  const openQuestion = (row: RguhsRow, index: number) => {
    const notesAvailable = hasTextbook(row.subjectKey, row.subjectName);
    const repetitions = row.reviewedQuestion
      ? collectedRecordedExamCount(row.reviewedQuestion)
      : row.offline && isRguhsSourceChecked(row.offline)
        ? new Set(row.offline.exam_dates ?? []).size : 0;
    return <View style={{ marginBottom: 14 }}>
      {searchingAll ? <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 5 }}>
        {YEAR_LABEL[row.year]} · {row.subjectName} · {row.chapter} · {row.kind === 'mcq' ? 'MCQ' : row.kind === 'essay' ? 'Essay' : row.kind === 'short-notes' ? 'Short Notes' : 'Other'}
      </Text> : null}
      <QuestionRow
        question={row.question} index={index} onAskAi={askAi}
        onNote={notesAvailable ? () => setNoted(row) : undefined}
        onMcqAnswer={row.kind === 'mcq' && row.reviewedQuestion ? () => setMcqTarget(row.reviewedQuestion!) : undefined}
        repeatCountOverride={repetitions}
      />
      <Text style={{ color: colors.textMuted, fontSize: 11, paddingLeft: 10, paddingTop: 4 }}>
        {row.reviewedQuestion ? 'PDF-reviewed entry' : row.offline && isRguhsSourceChecked(row.offline) ? 'Source checked' : 'OCR text — source checking needed'}
        {row.offline?.source_pdf ? ' · ' + row.offline.source_pdf : ''}
        {row.offline?.source_page != null ? ' · PDF p. ' + row.offline.source_page : ''}
        {row.offline?.exam_dates?.length ? ' · ' + [...new Set(row.offline.exam_dates)].join(', ') : ''}
      </Text>
    </View>;
  };
  const currentSubjectName = subjectRows[0]?.subjectName ?? university.toUpperCase();
  const title = subject === null ? university.toUpperCase() + ' Question Bank'
    : chapter === null ? currentSubjectName : chapter;
  const countText = loadedYear
    ? yearRows.length.toLocaleString() + ' unique questions in ' + YEAR_LABEL[year]
    : 'Loading reviewed and offline questions…';

  return <KeyboardSafe>
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 14 }}>
        <Touchable label="Back" onPress={goBack}
          style={{ borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
          <Text style={{ color: colors.text }}>‹ Back</Text>
        </Touchable>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>
            {title}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            {subject === null ? 'Reviewed + offline · one unified bank' : YEAR_LABEL[year] + (chapter ? ' · ' + currentSubjectName : '')}
          </Text>
        </View>
      </View>

      {subject === null ? <View style={{ backgroundColor: colors.card, borderRadius: 13, borderWidth: 1,
        borderColor: colors.border, padding: 12, marginBottom: 14 }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>{countText}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 5 }}>
          {university === 'wbuhs'
            ? 'Page-reviewed questions are built in. Second/third-year PDF scans download once and then work offline; unavailable scans are never counted as verified.'
            : UNIVERSITY_OFFLINE_MANIFEST.totals[university].toLocaleString() + ' bundled OCR entries across all years, plus the reviewed bank. Overlapping questions are counted once per year and subject.'}
        </Text>
      </View> : null}

      {subject === null && !searchingAll ? <View style={{ marginBottom: 14 }}>
        <SegmentedControl options={YEARS} value={year}
          onChange={(next: YearKey) => { setYear(next); setSubject(null); setChapter(null); setQuery(''); }} />
      </View> : null}
      {university === 'wbuhs' && subject === null && !searchingAll
        && (year === 'second-year' || year === 'third-year') ? (
        <Touchable label="Refresh downloaded WBUHS PDF scans"
          onPress={() => { void loadYear(year, true); }}
          style={{ paddingVertical: 8, marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: colors.cyan }}>Check for updated scanned questions</Text>
        </Touchable>
      ) : null}
      {chapter !== null ? <View style={{ marginBottom: 12 }}>
        <SegmentedControl options={TABS} value={tab} onChange={(next: RguhsKind) => { setTab(next); setQuery(''); }} />
      </View> : null}
      {subject === null || chapter !== null ? <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center',
        backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12,
        paddingHorizontal: 12, marginBottom: 12 }}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          placeholder={subject === null ? 'Search every ' + university.toUpperCase() + ' question…' : 'Search this chapter…'}
          placeholderTextColor={colors.textMuted} value={query} onChangeText={setQuery}
          autoCorrect={false} returnKeyType="search"
          style={{ color: colors.text, paddingVertical: 12, flex: 1 }} />
      </View> : null}

      {errors[year] ? <Touchable label="Retry loading unavailable university question packs"
        onPress={() => { void loadYear(year, true); }}
        style={{ padding: 10, marginBottom: 10, borderWidth: 1, borderColor: colors.warning, borderRadius: 10 }}>
        <Text style={{ color: colors.warning, fontSize: 12 }}>
          {errors[year]} Tap to retry.
        </Text>
      </Touchable> : null}
      {(!loadedYear || globalLoading) ? <ActivityIndicator color={colors.primary} style={{ marginBottom: 8 }} /> : null}
      {searchingAll ? <Text style={{ color: colors.textMuted, marginBottom: 8, fontSize: 12 }}>
        {globalLoading ? 'Searching bundled papers on this device… · ' : ''}
        {globalMatches.length.toLocaleString()} matches
        {globalMatches.length > RESULT_LIMIT ? ' · showing first ' + RESULT_LIMIT : ''}
      </Text> : null}
      {chapter !== null ? <Text style={{ color: colors.textMuted, marginBottom: 8, fontSize: 12 }}>
        {entries.length} matching {tab === 'mcq' ? 'MCQs' : 'questions'}
      </Text> : null}

      <FlatList
        data={entries} keyboardShouldPersistTaps="handled"
        keyExtractor={item => item.kind === 'question' ? item.row.id : item.kind + ':' + item.name}
        contentContainerStyle={{ paddingBottom: insets.bottom + 65 }}
        ListEmptyComponent={(!loadedYear || globalLoading) ? undefined :
          <Text style={{ color: colors.textMuted, padding: 16 }}>
            {searchingAll ? 'No matching questions. Try fewer words.'
              : chapter !== null ? 'No questions in this section. Try another category.'
              : 'No questions in this section.'}
          </Text>}
        renderItem={({ item, index }) => {
          if (item.kind === 'question') return openQuestion(item.row, index);
          if (item.kind === 'subject') return <Touchable
            label={item.name + ', ' + item.done + ' of ' + item.count + ' complete'}
            onPress={() => { setSubject(item.identity); setChapter(null); setQuery(''); }}
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14,
              flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 25 }}>{item.icon}</Text>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{item.name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.done} of {item.count} done</Text>
              <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 99, overflow: 'hidden' }}>
                <View style={{ width: ((item.count ? Math.round(100 * item.done / item.count) : 0) + '%') as `${number}%`,
                  height: 6, backgroundColor: colors.success }} />
              </View>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </Touchable>;
          return <Touchable label={item.name + ', ' + item.count + ' questions'}
            onPress={() => {
              const current = subjectRows.filter(row => row.chapter === item.name);
              setChapter(item.name);
              setTab(current.some(row => row.kind === 'essay') ? 'essay' : current[0]?.kind ?? 'essay');
              setQuery('');
            }}
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
              borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{item.name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.count} questions</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </Touchable>;
        }}
      />
      <SingleQuestionNote
        question={noted ? noteQuestionText(noted.question) : null}
        rawQuestion={noted?.question ?? null}
        subjectKey={noted?.subjectKey ?? ''} subjectName={noted?.subjectName ?? ''}
        yearLabel={noted ? YEAR_LABEL[noted.year] : YEAR_LABEL[year]}
        university={university} onClose={() => setNoted(null)}
      />
      <UniversityMcqAnswer question={mcqTarget} onClose={() => setMcqTarget(null)} />
    </View>
  </KeyboardSafe>;
}

/** RGUHS remains the same public screen; MUHS shares its verified UI. */
export default function RguhsImportedBank(props: { initialYear: YearKey; onSwitchBack?: () => void }) {
  return <UnifiedImportedUniversityBank university="rguhs" {...props} />;
}
