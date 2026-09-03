import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ArrowLeft, BookOpen, ChevronRight, Search } from 'lucide-react-native';
import { typeScale } from '@/theme/typography';
import { useTheme } from '@/theme';
import { LIST_TUNING } from '@/components/listTuning';
import { Touchable } from '@/components/Touchable';
import { EmptyState, Muted, SegmentedControl } from '@/components/ui';
import { GradientText } from '@/components/GradientText';
import { ThinBar } from '@/components/ProgressRing';
import { QuestionRow } from '@/components/QuestionRow';
import { FilterField } from '@/components/FilterField';
import { hasTextbook } from '@/lib/textbooks';
import { getCleanQuestionText } from '@/lib/questionText';
import {
  collectAllQuestions,
  collectQuestions,
  findTypeQuestions,
  getTopicChildren,
  getSubjects,
  SUBJECT_ICON,
  YEAR_LABEL,
  type QuestionType,
  resolveNode,
} from '@/lib/questionBank';
import { SingleQuestionNote } from '@/components/SingleQuestionNote';
import { PageRefSheet } from '@/components/PageRefSheet';
import { usePageRefs, pageFor } from '@/hooks/usePageRefs';
import { setSetting, useSettings } from '@/lib/settings';
import { useCountDone } from '@/hooks/useProgress';
import { requestDailyAd } from '@/lib/dailyAd';
import type { HomeStackParamList, RootTabParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'BrowseNode'>;
type Route = RouteProp<HomeStackParamList, 'BrowseNode'>;

/** "01", "02", … as shown in the numbered badges. */
function ordinal(index: number): string {
  return String(index + 1).padStart(2, '0');
}

/**
 * Every level of the question bank uses this screen. It renders one of three
 * layouts depending on what the node actually holds:
 *
 *  - papers   → a subject whose children are Paper 1 / Paper 2
 *  - topics   → a numbered topic list with per-topic progress
 *  - questions → the leaf list itself
 */
export default function BrowseNodeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const countDone = useCountDone();
  const { year, path, title, highlight, highlightType } = route.params;

  // Open on the tab the searched question is actually on, or a reader who
  // arrives from a search sees the other tab and an unhighlighted list.
  const [type, setType] = useState<QuestionType>(highlightType ?? 'essay');
  const [query, setQuery] = useState('');

  /**
   * The searched question, flashed on arrival and then let go.
   *
   * Held in state rather than read from the route on every render because it
   * has to *stop*: a highlight that never clears reads as a permanent
   * selection, and the reader has no way to dismiss it.
   */
  const listRef = useRef<FlatList<{ index: number; question: string }>>(null);
  const [flash, setFlash] = useState<string | null>(highlight ?? null);
  useEffect(() => {
    if (!highlight) {
      return;
    }
    setFlash(highlight);
    const id = setTimeout(() => setFlash(null), HIGHLIGHT_MS);
    return () => clearTimeout(id);
  }, [highlight]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Opening a leaf topic is the "questions" bucket's trigger.
  const isLeaf = getTopicChildren(resolveNode(year, path)).length === 0;
  useEffect(() => {
    if (isLeaf) {
      requestDailyAd('questions').catch(() => undefined);
    }
  }, [isLeaf]);

  const node = useMemo(() => resolveNode(year, path), [year, path]);
  const children = useMemo(() => getTopicChildren(node), [node]);
  const questions = useMemo(() => findTypeQuestions(node, type), [node, type]);

  /**
   * Textbook page references.
   *
   * The toggle is the switch for the whole feature on this screen: off, the
   * rows carry no chip and `usePageRefs` makes no request at all. The list can
   * be five hundred rows long, so the pages arrive in one batch keyed by
   * question id and each row reads its own out of the map.
   */
  const { showPageRefs, myBookId, myBookLabel } = useSettings();
  const cleanQuestions = useMemo(
    () => questions.map(getCleanQuestionText),
    [questions],
  );
  const { pages, refresh: refreshPages } = usePageRefs(cleanQuestions);
  const [pageRefTarget, setPageRefTarget] = useState<{
    question: string;
    rawQuestion: string;
  } | null>(null);
  const openPageRef = useCallback(
    (question: string, rawQuestion: string) =>
      setPageRefTarget({ question, rawQuestion }),
    [],
  );

  /**
   * Only worth showing above a list long enough to scroll.
   *
   * The largest topic in the bank holds 67 questions; plenty hold three. A
   * field above three rows is chrome that costs a row of space and earns
   * nothing, so it appears at the point where finding something by eye starts
   * to lose to typing two letters.
   */
  const filterable = questions.length >= FILTER_THRESHOLD;

  /**
   * Pairs, not strings, because the number shown on each row is its position
   * in the topic. Renumbering a filtered list 1..n would quietly tell the user
   * that "question 2" is a different question depending on what they typed.
   */
  const visible = useMemo(() => {
    const pairs = questions.map((question, index) => ({ question, index }));
    const needle = query.trim().toLowerCase();
    if (!filterable || !needle) {
      return pairs;
    }
    // Matched against the cleaned text: the raw string carries importance
    // stars, PYQ years and a page number, so a query would otherwise hit
    // markers the user cannot see and is not looking for.
    return pairs.filter(pair =>
      getCleanQuestionText(pair.question).toLowerCase().includes(needle),
    );
  }, [questions, query, filterable]);

  /**
   * Bring the searched question into view.
   *
   * Deferred a beat because the list has to have laid out before it can be
   * told to move, and placed at 0.35 down the screen rather than at the very
   * top — a row flush against the header reads as "the list starts here",
   * which is the opposite of "this is the one you asked for".
   */
  useEffect(() => {
    if (!flash) {
      return;
    }
    const at = visible.findIndex(item => item.question === flash);
    if (at < 0) {
      return;
    }
    const id = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: at, animated: true, viewPosition: 0.35 });
    }, 120);
    return () => clearTimeout(id);
  }, [flash, visible]);

  const filtering = filterable && query.trim().length > 0;
  const essayCount = useMemo(
    () => findTypeQuestions(node, 'essay').length,
    [node],
  );
  const shortNoteCount = useMemo(
    () => findTypeQuestions(node, 'short-notes').length,
    [node],
  );

  // A subject page listing exam papers looks different from a topic list.
  const isPaperLevel =
    path.length === 1 &&
    children.length > 0 &&
    children.every(c => /^paper-\d+$/.test(c.key));

  const askAi = useCallback(
    (question: string) => {
      navigation
        .getParent<BottomTabNavigationProp<RootTabParamList>>()
        ?.navigate('AskAI', { question, nonce: Date.now() });
    },
    [navigation],
  );

  /**
   * A triple tap offers a handwritten note wherever the notes function has a
   * textbook to ground it in — which is a question about the **subject**, not
   * the year. `subject` is the first path segment: the key under the year's
   * `subtopics`, the same value the web app passes.
   *
   * This was `year === 'third-year'`, from back when Community and Forensic
   * were the only two books that existed. Sixteen do now, covering every
   * subject in the bank, so that gate was turning away students the server
   * could already answer.
   *
   * That every subject currently has one is not a reason to drop the gate.
   * `hasTextbook` is what keeps the promise on the row honest the moment a
   * subject without a book is added — and a note badged "handwritten" that is
   * really the generic answer is worse than no button, because nothing on
   * screen says which one arrived.
   */
  const subjectKey = path[0] ?? '';
  const subjectName = useMemo(
    () => getSubjects(year).find(s => s.key === subjectKey)?.name ?? subjectKey,
    [year, subjectKey],
  );
  const notesAvailable = subjectKey !== '' && hasTextbook(subjectKey, subjectName);
  const [notedQuestion, setNotedQuestion] = useState<string | null>(null);
  const [notedRaw, setNotedRaw] = useState<string | null>(null);
  const openNote = useCallback((question: string, rawQuestion: string) => {
    setNotedQuestion(question);
    setNotedRaw(rawQuestion);
  }, []);
  const closeNote = useCallback(() => {
    setNotedQuestion(null);
    setNotedRaw(null);
  }, []);
  const onNote = notesAvailable ? openNote : undefined;

  const noteReader = (
    <SingleQuestionNote
      question={notedQuestion}
      rawQuestion={notedRaw}
      subjectKey={subjectKey}
      subjectName={subjectName}
      yearLabel={YEAR_LABEL[year]}
      onClose={closeNote}
    />
  );

  const openChild = useCallback(
    (key: string, name: string) => {
      navigation.push('BrowseNode', {
        year,
        path: [...path, key],
        title: name,
      });
    },
    [navigation, year, path],
  );

  const back = useCallback(() => navigation.goBack(), [navigation]);

  const backControl = (
    <Touchable
      onPress={back}
      label="Back"
      hitSlop={12}
      scaleTo={0.88}
      style={[
        styles.backButton,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <ArrowLeft size={20} color={colors.text} />
    </Touchable>
  );

  if (!node) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState title="Topic not found" />
      </View>
    );
  }

  // ---- Paper selection -----------------------------------------------------
  if (isPaperLevel) {
    return (
      <FlatList
        {...LIST_TUNING}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 8 },
        ]}
        data={children}
        keyExtractor={item => item.key}
        ListHeaderComponent={
          <View style={styles.paperHeader}>
            <View style={styles.headerRow}>
              {backControl}
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={styles.avatarEmoji}>
                  {SUBJECT_ICON[path[0]] ?? '📘'}
                </Text>
              </View>
              <View style={styles.backSpacer} />
            </View>
            <GradientText size={24} letterSpacing={1}>
              {title.toUpperCase()}
            </GradientText>
            <Text style={[styles.kicker, { color: colors.textMuted }]}>
              SELECT EXAMINATION PAPER
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const topics = getTopicChildren(item.node);
          return (
            <View
              style={[
                styles.paperCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Touchable
                onPress={() => openChild(item.key, item.name)}
                label={item.name}
                scale={false}
                dim
                style={styles.paperTop}
              >
                <View style={[styles.badge, { borderColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: colors.text }]}>
                    {ordinal(index)}
                  </Text>
                </View>
                <View style={styles.paperTitleWrap}>
                  <Text style={[styles.paperTitle, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <View
                    style={[styles.titleRule, { backgroundColor: colors.text }]}
                  />
                </View>
                <ChevronRight size={22} color={colors.textMuted} />
              </Touchable>

              {topics.length > 0 ? (
                <Text style={[styles.paperTopics, { color: colors.textMuted }]}>
                  {topics.map(t => t.name.toUpperCase()).join('  •  ')}
                </Text>
              ) : null}

              <Touchable
                onPress={() => openChild(item.key, item.name)}
                label={`Explore ${item.name} questions`}
                scale={false}
                dim
                style={[styles.exploreRow, { borderTopColor: colors.border }]}
              >
                <Search size={18} color={colors.text} />
                <Text style={[styles.exploreText, { color: colors.text }]}>
                  Explore Questions
                </Text>
                <ChevronRight size={20} color={colors.textMuted} />
              </Touchable>
            </View>
          );
        }}
      />
    );
  }

  // ---- Topic list ----------------------------------------------------------
  if (children.length > 0) {
    const isSubjectLevel = path.length === 1;
    return (
      <>
        <FlatList
          {...LIST_TUNING}
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: insets.top + 8 },
          ]}
          data={children}
          keyExtractor={item => item.key}
          ListHeaderComponent={
            <View style={styles.topicHeader}>
              <View style={styles.headerRow}>
                {backControl}
                <View style={styles.topicTitleWrap}>
                  <Text style={[styles.kicker, { color: colors.textMuted }]}>
                    {children.length} TOPICS
                  </Text>
                  {isSubjectLevel ? (
                    <GradientText size={24}>{title}</GradientText>
                  ) : (
                    <Text style={[styles.topicTitle, { color: colors.text }]}>
                      {title}
                    </Text>
                  )}
                </View>
                <View style={styles.backSpacer} />
              </View>
            </View>
          }
          renderItem={({ item, index }) => {
            const all = collectAllQuestions(item.node);
            const done = countDone(all);
            const pct = all.length ? (done / all.length) * 100 : 0;
            return (
              <Touchable
                onPress={() => openChild(item.key, item.name)}
                label={`${item.name}, ${done} of ${all.length} questions done`}
                scaleTo={0.985}
                style={[
                  styles.topicCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[styles.badge, { borderColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: colors.text }]}>
                    {ordinal(index)}
                  </Text>
                </View>
                <View style={styles.topicBody}>
                  <Text style={[styles.topicName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <View style={styles.topicBar}>
                    <ThinBar percent={pct} />
                  </View>
                  <Text
                    style={[styles.topicCount, { color: colors.textMuted }]}
                  >
                    {done}/{all.length} questions
                  </Text>
                </View>
                <ChevronRight size={22} color={colors.textMuted} />
              </Touchable>
            );
          }}
          ListFooterComponent={
            questions.length > 0 ? (
              <View style={styles.footer}>
                <Text style={[styles.footerTitle, { color: colors.text }]}>
                  Questions in {title}
                </Text>
                {questions.map((question, index) => (
                  <QuestionRow
                    key={`${index}-${question.slice(0, 24)}`}
                    question={question}
                    index={index}
                    onAskAi={askAi}
                    onNote={onNote}
                  />
                ))}
              </View>
            ) : undefined
          }
        />
        {noteReader}
      </>
    );
  }

  // ---- Questions -----------------------------------------------------------
  const doneHere = countDone(questions);

  return (
    <>
      <FlatList
        {...LIST_TUNING}
        ref={listRef}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 8 },
        ]}
        // Rows are different heights, so there is no getItemLayout to give and
        // scrollToIndex is allowed to miss and correct itself.
        onScrollToIndexFailed={info => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: Math.min(info.index, info.highestMeasuredFrameIndex),
              animated: false,
            });
          }, 60);
        }}
        data={visible}
        keyExtractor={item => `${item.index}-${item.question.slice(0, 24)}`}
        initialNumToRender={12}
        windowSize={10}
        removeClippedSubviews
        ListHeaderComponent={
          <View style={styles.questionHeader}>
            <View style={styles.headerRow}>
              {backControl}
              <View style={styles.topicTitleWrap}>
                <Text style={[styles.kicker, { color: colors.textMuted }]}>
                  {collectQuestions(node, type).length} QUESTIONS
                </Text>
                <Text style={[styles.topicTitle, { color: colors.text }]}>
                  {title}
                </Text>
              </View>
              <View style={styles.backSpacer} />
            </View>
            {/* Counts on the tabs, as the published app shows them: you can see
              a topic has no essays before tapping into an empty list. */}
            <SegmentedControl
              options={[
                { key: 'essay' as const, label: `Essays  ${essayCount}` },
                {
                  key: 'short-notes' as const,
                  label: `Short Notes  ${shortNoteCount}`,
                },
              ]}
              value={type}
              onChange={setType}
            />
            {/* The page-reference switch.
              *
              * A pill that reads on or off at a glance, like a quick setting,
              * because that is what it is: it turns the chips on every row on
              * and off, and while it is off nothing here asks the network about
              * page numbers at all.
              */}
            {questions.length > 0 ? (
              <Touchable
                label={
                  showPageRefs
                    ? 'Hide textbook page numbers'
                    : 'Show textbook page numbers'
                }
                state={{ checked: showPageRefs }}
                onPress={() => setSetting('showPageRefs', !showPageRefs)}
                style={[
                  styles.pageToggle,
                  {
                    backgroundColor: showPageRefs
                      ? colors.primary
                      : colors.cardElevated,
                    borderColor: showPageRefs ? colors.primary : colors.border,
                  },
                ]}
              >
                <BookOpen
                  size={14}
                  color={showPageRefs ? colors.primaryText : colors.textMuted}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.pageToggleText,
                    {
                      color: showPageRefs ? colors.primaryText : colors.text,
                    },
                  ]}
                >
                  {showPageRefs && myBookLabel ? myBookLabel : 'Textbook pages'}
                </Text>
                <View
                  style={[
                    styles.pageToggleDot,
                    {
                      backgroundColor: showPageRefs
                        ? colors.primaryText
                        : colors.textMuted,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.pageToggleState,
                    {
                      color: showPageRefs ? colors.primaryText : colors.textMuted,
                    },
                  ]}
                >
                  {showPageRefs ? 'ON' : 'OFF'}
                </Text>
              </Touchable>
            ) : null}

            {questions.length > 0 ? (
              <View style={styles.questionStats}>
                <Muted>
                  {doneHere} of {questions.length} done
                </Muted>
                <View style={styles.questionBar}>
                  <ThinBar
                    percent={
                      questions.length ? (doneHere / questions.length) * 100 : 0
                    }
                  />
                </View>
              </View>
            ) : null}

            {filterable ? (
              <View style={styles.filterWrap}>
                <FilterField
                  value={query}
                  onChange={setQuery}
                  placeholder={`Filter ${questions.length} questions`}
                  label={`Filter questions in ${title}`}
                />
                {filtering ? (
                  // Announced, because the result of typing is a list changing
                  // somewhere below the keyboard where it cannot be seen.
                  <Text
                    accessibilityLiveRegion="polite"
                    style={[styles.filterCount, { color: colors.textMuted }]}
                  >
                    {visible.length} of {questions.length}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          // An empty list because you filtered is a different situation from an
          // empty list because the topic has none, and telling someone to switch
          // tabs when they have simply mistyped is actively unhelpful.
          filtering ? (
            <EmptyState
              title="No matches"
              subtitle={`Nothing in ${title} matches "${query.trim()}".`}
            />
          ) : (
            <EmptyState
              title={`No ${type === 'essay' ? 'essays' : 'short notes'} here`}
              subtitle="Switch the tab above to see the other question type."
            />
          )
        }
        renderItem={({ item }) => (
          // item.index, not the list position: the row's number is where the
          // question sits in the topic, which does not change when filtered.
          <QuestionRow
            question={item.question}
            index={item.index}
            onAskAi={askAi}
            onNote={onNote}
            highlighted={flash === item.question}
            onPageRef={showPageRefs ? openPageRef : undefined}
            communityPage={
              showPageRefs
                ? pageFor(pages, getCleanQuestionText(item.question))
                : undefined
            }
            myBook={Boolean(myBookId)}
          />
        )}
      />
      {noteReader}
      <PageRefSheet
        visible={pageRefTarget !== null}
        onClose={() => setPageRefTarget(null)}
        question={pageRefTarget?.question ?? ''}
        rawQuestion={pageRefTarget?.rawQuestion}
        onChanged={refreshPages}
      />
    </>
  );
}

/** Below this, scanning the list by eye beats typing. */
const FILTER_THRESHOLD = 12;

/**
 * How long a searched question stays lit.
 *
 * Long enough to find with your eyes once the scroll settles, short enough to
 * read as a flash rather than a selected state the reader now has to undo.
 */
const HIGHLIGHT_MS = 2000;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    height: 44,
    width: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 44,
  },
  avatar: {
    height: 76,
    width: 76,
    borderRadius: 38,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 34,
  },
  paperHeader: {
    marginBottom: 20,
  },
  topicHeader: {
    marginBottom: 16,
  },
  topicTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  topicTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  questionHeader: {
    marginBottom: 14,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
  paperCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    overflow: 'hidden',
  },
  paperTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  badge: {
    height: 58,
    width: 58,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  paperTitleWrap: {
    flex: 1,
  },
  paperTitle: {
    ...typeScale.title2,
    fontSize: 20,
    fontWeight: '700',
  },
  titleRule: {
    height: 3,
    width: 34,
    borderRadius: 2,
    marginTop: 6,
  },
  paperTopics: {
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.3,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  exploreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  exploreText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 12,
  },
  topicBody: {
    flex: 1,
  },
  topicName: {
    fontSize: 17,
    fontWeight: '700',
  },
  topicBar: {
    marginTop: 8,
    marginRight: 24,
  },
  topicCount: {
    fontSize: 13,
    marginTop: 8,
  },
  filterWrap: {
    marginTop: 12,
    gap: 6,
  },
  filterCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  questionStats: {
    marginTop: 12,
  },
  pageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    marginTop: 12,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pageToggleText: {
    ...typeScale.caption,
    fontWeight: '700',
  },
  pageToggleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  pageToggleState: {
    ...typeScale.overline,
  },
  questionBar: {
    marginTop: 6,
  },
  footer: {
    marginTop: 18,
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
});
