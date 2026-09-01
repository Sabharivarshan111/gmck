import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/Text';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ChevronRight, Search } from 'lucide-react-native';
import { typeScale } from '@/theme/typography';
import { useTheme } from '@/theme';
import { Card, EmptyState, Muted, ProgressBar } from '@/components/ui';
import { BackButton } from '@/components/BackButton';
import { LIST_TUNING } from '@/components/listTuning';
import {
  collectAllQuestions,
  getSubjects,
  searchQuestions,
  warmSearchIndex,
  SUBJECT_ICON,
  YEAR_KEYS,
  YEAR_LABEL,
  YearKey,
  type SearchHit,
} from '@/lib/questionBank';
import { Touchable } from '@/components/Touchable';
import { SingleQuestionNote } from '@/components/SingleQuestionNote';
import { hasTextbook } from '@/lib/textbooks';
import { noteQuestionText } from '@/lib/questionText';
import { useCountDone } from '@/hooks/useProgress';
import { useProfile } from '@/hooks/useProfile';
import { QuestionRow } from '@/components/QuestionRow';
import type { HomeStackParamList, RootTabParamList } from '@/navigation/types';
import { SegmentedControl } from '@/components/ui';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'BrowseHome'>;
type Route = RouteProp<HomeStackParamList, 'BrowseHome'>;

const SEARCH_DEBOUNCE_MS = 220;

export default function BrowseHomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const countDone = useCountDone();

  const { yearKey: profileYear } = useProfile();
  const [year, setYear] = useState<YearKey>(route.params?.year ?? profileYear);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  // Follow the profile's year until the user picks one on this screen.
  useEffect(() => {
    if (!route.params?.year) {
      setYear(profileYear);
    }
  }, [route.params?.year, profileYear]);

  // Build the search index while the user is still reading the screen, so the
  // first keystroke does not pay for it.
  useEffect(() => {
    warmSearchIndex();
  }, []);

  // The bank is large; debounce so the walk does not run on every keystroke.
  useEffect(() => {
    if (query === debounced) {
      return;
    }
    const id = setTimeout(() => setDebounced(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query, debounced]);

  /**
   * Which year the search looks in.
   *
   * `null` is "every year", and it is the default: someone who types a drug
   * name usually wants to know where it appears, not to be told there are no
   * matches because the year they last browsed happened to be selected.
   */
  const [searchYear, setSearchYear] = useState<YearKey | null>(null);

  /**
   * A third-year hit gets the handwritten note here too.
   *
   * Otherwise the same question offers a note when reached by browsing and
   * only Ask AI when reached by searching, which reads as the search finding
   * a lesser copy of it. The hit already carries everything the note needs.
   */
  const [noted, setNoted] = useState<SearchHit | null>(null);
  const results = useMemo(
    () => searchQuestions(debounced, searchYear ?? undefined),
    [debounced, searchYear],
  );
  const isSearching = debounced.trim().length >= 2;

  const subjects = useMemo(() => {
    return getSubjects(year).map(subject => {
      const all = collectAllQuestions(subject.node);
      return { ...subject, total: all.length, done: countDone(all) };
    });
  }, [year, countDone]);

  /**
   * Open the topic a result lives in, and light the question up on arrival.
   *
   * The path comes from the search index, which check:search-index proves
   * resolves back to a topic containing this exact question.
   */
  const openChapter = useCallback(
    (hit: SearchHit) => {
      navigation.push('BrowseNode', {
        year: hit.year,
        path: hit.path,
        title: hit.topicName,
        highlight: hit.question,
        highlightType: hit.type,
      });
    },
    [navigation],
  );

  const askAi = useCallback(
    (question: string) => {
      navigation
        .getParent<BottomTabNavigationProp<RootTabParamList>>()
        ?.navigate('AskAI', { question, nonce: Date.now() });
    },
    [navigation],
  );

  return (
    <KeyboardSafe>
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          Question Bank
        </Text>
      </View>

      <View
        style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search all questions…"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          autoCorrect={false}
          returnKeyType="search"
          autoFocus={route.params?.focusSearch}
        />
      </View>

      {/* Under the box, because it narrows what the box returns. "All years"
          leads, and is the default: a search that silently only looked in one
          year would report "no matches" for a question that is in the bank. */}
      {isSearching ? (
        <View style={styles.searchYears}>
          {([null, ...YEAR_KEYS] as (YearKey | null)[]).map(key => {
            const active = searchYear === key;
            return (
              <Touchable
                key={key ?? 'all'}
                label={
                  key
                    ? `Search ${YEAR_LABEL[key]} only`
                    : 'Search every year'
                }
                state={{ selected: active }}
                onPress={() => setSearchYear(key)}
                style={[
                  styles.searchYear,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.searchYearText,
                    { color: active ? colors.primaryText : colors.textMuted },
                  ]}>
                  {key ? YEAR_LABEL[key].replace(' Year', '') : 'All'}
                </Text>
              </Touchable>
            );
          })}
        </View>
      ) : null}

      {isSearching ? (
        <FlatList
          {...LIST_TUNING}
          data={results}
          keyExtractor={(item, index) => `${item.subjectKey}-${index}`}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Muted style={styles.resultCount}>
              {results.length === 0
                ? 'No matches'
                : `${results.length} match${results.length === 1 ? '' : 'es'}`}
            </Muted>
          }
          ListEmptyComponent={
            <EmptyState
              title="Nothing found"
              subtitle="Try a shorter phrase, like a drug or disease name."
            />
          }
          renderItem={({ item, index }) => (
            <View>
              <Text style={[styles.hitPath, { color: colors.textMuted }]}>
                {item.type === 'essay' ? 'Essay' : 'Short Notes'} · {item.yearLabel} →{' '}
                {item.subjectName} → {item.topicName}
              </Text>
              <QuestionRow
                question={item.question}
                index={index}
                onAskAi={askAi}
                onNote={hasTextbook(item.subjectKey, item.subjectName) ? () => setNoted(item) : undefined}
              />
              {/* The result names where the question lives; this goes there.
                  Without it a search can only tell you a question exists. */}
              <Touchable
                label={`Switch to ${item.topicName}`}
                onPress={() => openChapter(item)}
                style={[styles.switchRow, { borderColor: colors.border }]}>
                <Text style={[styles.switchText, { color: colors.cyan }]}>
                  Switch to this chapter
                </Text>
                <ChevronRight size={16} color={colors.cyan} />
              </Touchable>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.yearSelector}>
              <SegmentedControl
                options={YEAR_KEYS.map(key => ({ key, label: YEAR_LABEL[key].replace(' Year', '') }))}
                value={year}
                onChange={setYear}
              />
            </View>
          }
          renderItem={({ item }) => (
            <Card
              style={styles.subjectCard}
              label={`${item.name}, ${item.done} of ${item.total} done`}
              onPress={() =>
                navigation.navigate('BrowseNode', {
                  year,
                  path: [item.key],
                  title: item.name,
                })
              }>
              <View style={styles.subjectRow}>
                <Text style={styles.subjectIcon}>{SUBJECT_ICON[item.key] ?? '📘'}</Text>
                <View style={styles.subjectBody}>
                  <Text style={[styles.subjectName, { color: colors.text }]}>{item.name}</Text>
                  <Muted>
                    {item.done} of {item.total} done
                  </Muted>
                  <View style={styles.subjectProgress}>
                    <ProgressBar value={item.done} total={item.total} />
                  </View>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
            </Card>
          )}
        />
      )}

      <SingleQuestionNote
        question={noted ? noteQuestionText(noted.question) : null}
        subjectKey={noted?.subjectKey ?? ''}
        subjectName={noted?.subjectName ?? ''}
        yearLabel={noted?.yearLabel ?? ''}
        onClose={() => setNoted(null)}
      />
    </View>
    </KeyboardSafe>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  backButton: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  title: {
    ...typeScale.title2,
    fontSize: 22,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 24,
  },
  yearSelector: {
    marginBottom: 14,
  },
  resultCount: {
    marginBottom: 10,
  },
  searchYears: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchYear: {
    flex: 1,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    alignItems: 'center',
  },
  searchYearText: {
    fontSize: 13,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 9,
    marginTop: -4,
    marginBottom: 16,
  },
  switchText: {
    fontSize: 13,
    fontWeight: '600',
  },
  hitPath: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  subjectCard: {
    marginBottom: 10,
    paddingVertical: 14,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subjectIcon: {
    fontSize: 24,
  },
  subjectBody: {
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  subjectProgress: {
    marginTop: 8,
  },
});
