import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Ellipsis,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZoomableImage } from '@/components/ZoomableImage';
import { Text } from '@/components/Text';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { Touchable } from '@/components/Touchable';
import { Sheet } from '@/components/Sheet';
import { NeetPgPlanPanel } from '@/components/NeetPgPlanPanel';
import { useNeetStudy } from '@/lib/useNeetStudy';
import { planSession, recordNeetAttempt, studyDay } from '@/lib/neetPgPlan';
import { NeetPgQuestionAi } from '@/components/NeetPgQuestionAi';
import { useTheme, withAlpha } from '@/theme';
import { PRESETS } from '@/theme/presets';
import { typeScale } from '@/theme/typography';
import { useReducedMotion } from '@/theme/motion';
import { radius, space } from '@/theme/tokens';
import type { InstalledReader } from '@shared/neetPgInstall';
import type { OfflineMcq } from '@shared/neetPgOffline';

const YEARS = [
  ['first-year', '1st'],
  ['second-year', '2nd'],
  ['third-year', '3rd'],
  ['final-year', 'Final'],
] as const;
const PAGE_SIZE = 30;
type Chapter = ReturnType<InstalledReader['reader']['chapters']>[number];
type Filter = NonNullable<Parameters<InstalledReader['reader']['search']>[0]>;
type LibraryRow =
  | {
      kind: 'subject';
      id: string;
      name: string;
      count: number;
      chapters: number;
    }
  | { kind: 'chapter'; id: string; chapter: Chapter }
  | { kind: 'question'; id: string; question: OfflineMcq; index: number };
const chapterTitle = (name: string) =>
  name === name.toUpperCase()
    ? name.toLowerCase().replace(/(^|\s)\S/g, letter => letter.toUpperCase())
    : name;

export function NeetPgOfflineModal({
  visible,
  onClose,
  installed,
  onReplace,
  installing,
  initialQuestionId,
}: {
  visible: boolean;
  onClose: () => void;
  installed: InstalledReader;
  onReplace: () => void;
  installing: boolean;
  initialQuestionId?: string;
}) {
  const { colors, preference, setPreference } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { reader } = installed;
  const study = useNeetStudy(reader.id);
  const [planOpen, setPlanOpen] = useState(false);
  const [sessionIds, setSessionIds] = useState<string[] | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchPage, setSearchPage] = useState(0);
  const [savedOnly, setSavedOnly] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [savedReady, setSavedReady] = useState(false);
  const [scope, setScope] = useState<Filter | null>(null);
  const [position, setPosition] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, { choice?: number; revealed?: boolean }>
  >({});
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const questionScroll = useRef<React.ElementRef<typeof ScrollView>>(null);
  const libraryList = useRef<FlatList<LibraryRow>>(null);
  const revealScroll = useRef(false);
  const savedKey = 'orbit:neetpg:saved:' + reader.id;

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(savedKey)
      .then(raw => {
        if (!active || !raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed))
          setSaved(
            [
              ...new Set(
                parsed.filter((id): id is string => typeof id === 'string'),
              ),
            ].slice(0, 10000),
          );
      })
      .catch(() => {})
      .finally(() => {
        if (active) setSavedReady(true);
      });
    return () => {
      active = false;
    };
  }, [savedKey]);
  useEffect(() => {
    if (savedReady)
      void AsyncStorage.setItem(savedKey, JSON.stringify(saved)).catch(
        () => {},
      );
  }, [saved, savedKey, savedReady]);

  const chapters = useMemo(
    () => reader.chapters().filter(chapter => chapter.count > 0),
    [reader],
  );
  const chapterById = useMemo(
    () => new Map(chapters.map(chapter => [chapter.id, chapter])),
    [chapters],
  );
  const yearChapters = useMemo(
    () => chapters.filter(chapter => !year || chapter.year === year),
    [chapters, year],
  );
  const subjectRows = useMemo(() => {
    const values = new Map<string, Extract<LibraryRow, { kind: 'subject' }>>();
    for (const chapter of yearChapters) {
      const value = values.get(chapter.subject) ?? {
        kind: 'subject' as const,
        id: chapter.subject,
        name: chapter.names[0],
        count: 0,
        chapters: 0,
      };
      value.count += chapter.count;
      value.chapters += 1;
      values.set(chapter.subject, value);
    }
    return Array.from(values.values());
  }, [yearChapters]);
  const filter: Filter = useMemo(
    () => ({
      year: year ?? undefined,
      subject: subject ?? undefined,
      query,
      ids: savedOnly ? saved : undefined,
    }),
    [year, subject, query, savedOnly, saved],
  );
  const libraryResult = useMemo(
    () =>
      reader.search({
        ...filter,
        offset: searchPage * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
    [reader, filter, searchPage],
  );
  const searching = query.trim().length > 0 || savedOnly;
  const rows: LibraryRow[] = useMemo(
    () =>
      searching
        ? libraryResult.records.map((question, index) => ({
            kind: 'question',
            id: question.id,
            question,
            index: searchPage * PAGE_SIZE + index,
          }))
        : subject
        ? yearChapters
            .filter(chapter => chapter.subject === subject)
            .map(chapter => ({ kind: 'chapter', id: chapter.id, chapter }))
        : subjectRows,
    [searching, libraryResult, searchPage, subject, yearChapters, subjectRows],
  );
  useEffect(() => {
    if (visible && initialQuestionId) {
      setPosition(0);
      setSessionIds(null);
      setScope({ ids: [initialQuestionId] });
    }
  }, [visible, initialQuestionId]);
  const practiceRecords = useMemo(() => {
    const chapterSubjects = new Map(chapters.map(c => [c.id, c.subject]));
    const records: { id: string; subject: string }[] = [];
    for (let offset = 0; offset < reader.total; offset += 40)
      for (const q of reader.search({ offset, limit: 40 }).records)
        records.push({
          id: q.id,
          subject: chapterSubjects.get(q.chapterId) ?? '',
        });
    return records;
  }, [reader, chapters]);
  const startSession = () => {
    const day = studyDay();
    const candidate =
      study.state.session?.day === day
        ? study.state.session
        : planSession(practiceRecords, study.state, day);
    const ids = candidate.ids.filter(id =>
      practiceRecords.some(q => q.id === id),
    );
    if (!ids.length) {
      setSessionIds(null);
      setScope(null);
      return;
    }
    const position = Math.min(candidate.position, ids.length - 1);
    study.setState(current => ({
      ...current,
      session: { day, ids, position },
    }));
    setAnswers({});
    setSessionIds(ids);
    setPosition(position);
    setScope({ ids });
  };
  const activeResult = useMemo(
    () =>
      scope
        ? sessionIds
          ? {
              total: sessionIds.length,
              records: reader.search({ ids: [sessionIds[position]], limit: 1 })
                .records,
            }
          : reader.search({ ...scope, offset: position, limit: 1 })
        : null,
    [reader, scope, position, sessionIds],
  );
  const question = activeResult?.records[0];
  const questionChapter = question
    ? chapterById.get(question.chapterId)
    : undefined;
  const answer = question ? answers[question.id] ?? {} : {};
  const bookmarked = question ? saved.includes(question.id) : false;
  const currentSubject = subjectRows.find(row => row.id === subject)?.name;

  useEffect(() => {
    libraryList.current?.scrollToOffset({ offset: 0, animated: false });
  }, [year, subject, searchPage, savedOnly]);
  useEffect(() => {
    revealScroll.current = false;
    questionScroll.current?.scrollTo({ y: 0, animated: false });
    setAiOpen(false);
    setActiveImage(null);
  }, [question?.id]);
  const start = (chapterId?: string, index = 0) => {
    Keyboard.dismiss();
    setSessionIds(null);
    setPosition(index);
    setScope({
      ...filter,
      ids: filter.ids ? [...filter.ids] : undefined,
      chapterId,
    });
  };
  const leaveQuestion = () => {
    setScope(null);
    setSessionIds(null);
    setAiOpen(false);
  };
  const close = () => {
    setAiOpen(false);
    setSettingsOpen(false);
    setActiveImage(null);
    onClose();
  };
  const pageQuestion = (next: number) => {
    if (activeResult) {
      const position = Math.max(0, Math.min(activeResult.total - 1, next));
      setPosition(position);
      if (sessionIds)
        study.setState(current => ({
          ...current,
          session: current.session ? { ...current.session, position } : null,
        }));
    }
  };
  const changeYear = (value: string | null) => {
    setYear(value);
    setSubject(null);
    setSearchPage(0);
  };
  const toggleSave = () => {
    if (!question || !savedReady) return;
    setSaved(current =>
      current.includes(question.id)
        ? current.filter(id => id !== question.id)
        : [...current, question.id],
    );
  };

  const libraryHeader = (
    <View style={styles.libraryHeader}>
      <View style={styles.hero}>
        <View style={styles.line}>
          <Text style={[typeScale.overline, { color: colors.textMuted }]}>
            QUESTION BANK
          </Text>
          <View
            style={[
              styles.offline,
              { backgroundColor: withAlpha(colors.text, 0.06) },
            ]}
          >
            <Download size={12} color={colors.textMuted} />
            <Text style={[typeScale.caption, { color: colors.textMuted }]}>
              Offline ready
            </Text>
          </View>
        </View>
        <Text
          accessibilityRole="header"
          style={[typeScale.title1, { color: colors.text }]}
        >
          NEET-PG
        </Text>
        <Text style={[typeScale.callout, { color: colors.textMuted }]}>
          Chapter-wise practice
        </Text>
        <View style={[styles.stats, { borderColor: colors.border }]}>
          <View style={styles.flex}>
            <Text style={[typeScale.bodyStrong, { color: colors.text }]}>
              {reader.total.toLocaleString()}
            </Text>
            <Text style={[typeScale.caption, { color: colors.textMuted }]}>
              QUESTIONS
            </Text>
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: colors.border }]}
          />
          <View style={styles.flex}>
            <Text style={[typeScale.bodyStrong, { color: colors.text }]}>
              {chapters.length}
            </Text>
            <Text style={[typeScale.caption, { color: colors.textMuted }]}>
              CHAPTERS
            </Text>
          </View>
          <Touchable
            label="Show saved NEET PG questions"
            state={{ selected: savedOnly }}
            disabled={!savedReady}
            onPress={() => {
              setSavedOnly(value => !value);
              setSubject(null);
              setSearchPage(0);
            }}
            style={[
              styles.savedTile,
              { borderColor: savedOnly ? colors.text : colors.border },
            ]}
          >
            <Bookmark
              size={17}
              color={colors.text}
              fill={savedOnly ? colors.text : 'none'}
            />
            <Text style={[typeScale.footnote, { color: colors.text }]}>
              {saved.length} saved
            </Text>
          </Touchable>
        </View>
      </View>
      <View
        style={[
          styles.search,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Search size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={value => {
            setQuery(value);
            setSearchPage(0);
          }}
          placeholder="Search a question or concept"
          accessibilityLabel="Search offline NEET PG questions"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          style={[styles.searchInput, typeScale.body, { color: colors.text }]}
        />
        {query ? (
          <Touchable
            label="Clear NEET PG search"
            onPress={() => {
              setQuery('');
              setSearchPage(0);
            }}
            style={styles.clear}
          >
            <X size={16} color={colors.textMuted} />
          </Touchable>
        ) : null}
      </View>
      <View style={[styles.years, { backgroundColor: colors.card }]}>
        {[[null, 'All'], ...YEARS].map(([id, name]) => (
          <Touchable
            key={id ?? 'all'}
            label={id ? name + ' Year' : 'All years of study'}
            state={{ selected: year === id }}
            onPress={() => changeYear(id)}
            style={[
              styles.year,
              { backgroundColor: year === id ? colors.primary : 'transparent' },
            ]}
          >
            <Text
              style={[
                typeScale.footnote,
                {
                  color: year === id ? colors.primaryText : colors.textMuted,
                  fontWeight: year === id ? '700' : '500',
                },
              ]}
            >
              {name}
            </Text>
          </Touchable>
        ))}
      </View>
      <View style={styles.sectionHeader}>
        <View style={styles.flex}>
          <Text style={[typeScale.title3, { color: colors.text }]}>
            {searching
              ? savedOnly
                ? 'Saved questions'
                : 'Search results'
              : currentSubject ?? 'Browse subjects'}
          </Text>
          <Text style={[typeScale.caption, { color: colors.textMuted }]}>
            {searching
              ? libraryResult.total.toLocaleString() + ' matching questions'
              : subject
              ? rows.length +
                ' chapters · ' +
                libraryResult.total +
                ' questions'
              : 'Choose a subject, then a chapter'}
          </Text>
        </View>
        {subject ? (
          <Touchable
            label="Back to all NEET PG subjects"
            onPress={() => {
              setSubject(null);
              setSearchPage(0);
            }}
            style={styles.iconButton}
          >
            <ArrowLeft size={20} color={colors.text} />
          </Touchable>
        ) : (
          <Text style={[typeScale.caption, { color: colors.textMuted }]}>
            MBBS YEARS
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType={reducedMotion ? 'none' : 'slide'}
      presentationStyle="fullScreen"
      onRequestClose={
        scope ? leaveQuestion : planOpen ? () => setPlanOpen(false) : close
      }
    >
      <View
        style={[
          styles.screen,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={[styles.topbar, { borderColor: colors.border }]}>
          <Touchable
            label={
              scope
                ? 'Return to NEET PG library'
                : planOpen
                ? 'Return to NEET PG library'
                : 'Close offline NEET PG bank'
            }
            onPress={
              scope
                ? leaveQuestion
                : planOpen
                ? () => setPlanOpen(false)
                : close
            }
            style={styles.back}
          >
            <ChevronLeft size={22} color={colors.text} />
            <Text style={[typeScale.bodyStrong, { color: colors.text }]}>
              {scope
                ? sessionIds
                  ? 'Today'
                  : 'Library'
                : planOpen
                ? 'Library'
                : 'Vault'}
            </Text>
          </Touchable>
          <Text
            style={[
              typeScale.caption,
              styles.flex,
              styles.center,
              { color: colors.textMuted },
            ]}
          >
            {scope && activeResult
              ? position + 1 + ' / ' + activeResult.total
              : 'STUDY SPACE'}
          </Text>
          {question ? (
            <Touchable
              label={
                bookmarked
                  ? 'Unsave this NEET PG question'
                  : 'Save this NEET PG question'
              }
              state={{ selected: bookmarked }}
              disabled={!savedReady}
              onPress={toggleSave}
              style={styles.iconButton}
            >
              <Bookmark
                size={20}
                color={colors.text}
                fill={bookmarked ? colors.text : 'none'}
              />
            </Touchable>
          ) : null}
          <Touchable
            label="NEET PG appearance and bank settings"
            onPress={() => setSettingsOpen(true)}
            style={styles.iconButton}
          >
            <Ellipsis size={22} color={colors.text} />
          </Touchable>
        </View>
        {scope && question && activeResult ? (
          <>
            <View
              style={[styles.progressTrack, { backgroundColor: colors.border }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.accent,
                    transform: [
                      { scaleX: (position + 1) / activeResult.total },
                    ],
                    transformOrigin: 'left',
                  },
                ]}
              />
            </View>
            <ScrollView
              ref={questionScroll}
              style={styles.flex}
              contentContainerStyle={styles.readerContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.reader}>
                <View style={styles.questionMeta}>
                  <View
                    style={[
                      styles.questionTag,
                      { backgroundColor: withAlpha(colors.accent, 0.08) },
                    ]}
                  >
                    <BookOpen size={13} color={colors.accent} />
                    <Text style={[typeScale.caption, { color: colors.accent }]}>
                      {questionChapter?.names[0]}
                    </Text>
                  </View>
                  <Text
                    style={[
                      typeScale.caption,
                      styles.chapterMeta,
                      { color: colors.textMuted },
                    ]}
                  >
                    {chapterTitle(questionChapter?.name ?? '')}
                  </Text>
                </View>
                <Text style={[typeScale.overline, { color: colors.textMuted }]}>
                  QUESTION {String(position + 1).padStart(2, '0')}
                </Text>
                <Text
                  selectable
                  style={[
                    typeScale.reading,
                    styles.question,
                    { color: colors.text },
                  ]}
                >
                  {question.question}
                </Text>
                {question.imageIds.map(id => {
                  const image = reader.image(id)!;
                  return (
                    <Touchable
                      key={id}
                      label="Open question illustration"
                      onPress={() => setActiveImage(id)}
                      style={[
                        styles.illustration,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: image.dataUri }}
                        accessibilityLabel={image.alt}
                        resizeMode="contain"
                        style={styles.image}
                      />
                      <View style={styles.imageCaption}>
                        <Text
                          style={[
                            typeScale.caption,
                            { color: colors.textMuted },
                          ]}
                        >
                          Tap to inspect illustration
                        </Text>
                        <ChevronRight size={14} color={colors.textMuted} />
                      </View>
                    </Touchable>
                  );
                })}
                <View
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Question options"
                  style={styles.options}
                >
                  {question.options.map((option, index) => {
                    const chosen = answer.choice === index;
                    const correct =
                      !!answer.revealed && question.answerIndex === index;
                    const wrong =
                      !!answer.revealed &&
                      chosen &&
                      question.answerIndex !== null &&
                      !correct;
                    const feedback = colors.monochrome
                      ? colors.text
                      : correct
                      ? colors.success
                      : wrong
                      ? colors.danger
                      : colors.accent;
                    const highlighted = chosen || correct;
                    return (
                      <Touchable
                        key={index}
                        label={
                          'Option ' +
                          String.fromCharCode(65 + index) +
                          '. ' +
                          option +
                          (correct
                            ? '. Correct answer'
                            : wrong
                            ? '. Your selection'
                            : '')
                        }
                        role="radio"
                        state={{ checked: chosen, disabled: !!answer.revealed }}
                        disabled={!!answer.revealed}
                        disabledOpacity={1}
                        onPress={() =>
                          setAnswers(current => ({
                            ...current,
                            [question.id]: { choice: index },
                          }))
                        }
                        style={[
                          styles.option,
                          {
                            borderColor: highlighted ? feedback : colors.border,
                            backgroundColor: highlighted
                              ? withAlpha(feedback, 0.07)
                              : colors.card,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.letter,
                            {
                              borderColor: highlighted
                                ? feedback
                                : colors.border,
                              backgroundColor:
                                chosen && !answer.revealed
                                  ? colors.primary
                                  : 'transparent',
                            },
                          ]}
                        >
                          {correct ? (
                            <Check size={16} color={feedback} />
                          ) : wrong ? (
                            <X size={16} color={feedback} />
                          ) : (
                            <Text
                              style={[
                                typeScale.footnote,
                                {
                                  color:
                                    chosen && !answer.revealed
                                      ? colors.primaryText
                                      : colors.textMuted,
                                  fontWeight: '700',
                                },
                              ]}
                            >
                              {String.fromCharCode(65 + index)}
                            </Text>
                          )}
                        </View>
                        <Text
                          style={[
                            typeScale.body,
                            styles.flex,
                            { color: colors.text },
                          ]}
                        >
                          {option}
                        </Text>
                      </Touchable>
                    );
                  })}
                </View>
                {answer.revealed ? (
                  <View
                    testID="neet-answer-explanation"
                    onLayout={event => {
                      if (revealScroll.current) {
                        revealScroll.current = false;
                        questionScroll.current?.scrollTo({
                          y: Math.max(0, event.nativeEvent.layout.y - space.xl),
                          animated: !reducedMotion,
                        });
                      }
                    }}
                    style={[styles.explanation, { borderColor: colors.border }]}
                  >
                    <View style={styles.row}>
                      <ShieldCheck
                        size={19}
                        color={colors.monochrome ? colors.text : colors.success}
                      />
                      <Text
                        style={[
                          typeScale.overline,
                          { color: colors.textMuted },
                        ]}
                      >
                        ANSWER & EXPLANATION
                      </Text>
                    </View>
                    <Text
                      selectable
                      style={[typeScale.title3, { color: colors.text }]}
                    >
                      Answer: {question.sourceAnswer}
                    </Text>
                    <Text
                      selectable
                      style={[
                        typeScale.body,
                        styles.explanationText,
                        { color: colors.text },
                      ]}
                    >
                      {question.explanation}
                    </Text>
                    <Touchable
                      label="Discuss this answer with ACEV"
                      onPress={() => setAiOpen(true)}
                      style={[
                        styles.discuss,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Sparkles size={18} color={colors.accent} />
                      <View style={styles.flex}>
                        <Text
                          style={[typeScale.bodyStrong, { color: colors.text }]}
                        >
                          Need a different explanation?
                        </Text>
                        <Text
                          style={[
                            typeScale.caption,
                            { color: colors.textMuted },
                          ]}
                        >
                          Talk it through with ACEV
                        </Text>
                      </View>
                      <ChevronRight size={17} color={colors.textMuted} />
                    </Touchable>
                  </View>
                ) : (
                  <Text
                    style={[
                      typeScale.caption,
                      styles.answerHint,
                      { color: colors.textMuted },
                    ]}
                  >
                    Choose an option, or reveal the answer to review.
                  </Text>
                )}
              </View>
            </ScrollView>
            <View
              style={[
                styles.studyDock,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  paddingBottom: insets.bottom + space.sm,
                },
              ]}
            >
              <View style={styles.dockWidth}>
                <View style={styles.dockActions}>
                  <Touchable
                    label="Ask ACEV about this question"
                    onPress={() => setAiOpen(true)}
                    style={[
                      styles.ask,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Sparkles size={18} color={colors.accent} />
                    <Text
                      style={[typeScale.bodyStrong, { color: colors.text }]}
                    >
                      Ask ACEV
                    </Text>
                  </Touchable>
                  <Touchable
                    label={
                      answer.revealed
                        ? 'Hide answer and explanation'
                        : 'Show answer and explanation'
                    }
                    onPress={() => {
                      revealScroll.current = !answer.revealed;
                      if (!answer.revealed && study.ready)
                        study.setState(current => ({
                          ...current,
                          attempts: {
                            ...current.attempts,
                            [question.id]: recordNeetAttempt(
                              current.attempts[question.id],
                              answer.choice,
                              question.answerIndex,
                              studyDay(),
                            ),
                          },
                        }));
                      setAnswers(current => ({
                        ...current,
                        [question.id]: {
                          ...answer,
                          revealed: !answer.revealed,
                        },
                      }));
                    }}
                    style={[styles.reveal, { backgroundColor: colors.primary }]}
                  >
                    <Text
                      style={[
                        typeScale.bodyStrong,
                        { color: colors.primaryText },
                      ]}
                    >
                      {answer.revealed
                        ? 'Hide answer'
                        : answer.choice === undefined
                        ? 'Reveal answer'
                        : 'Check answer'}
                    </Text>
                    {!answer.revealed ? (
                      <ArrowRight size={17} color={colors.primaryText} />
                    ) : null}
                  </Touchable>
                </View>
                <View style={styles.navigation}>
                  <Touchable
                    label="Previous NEET PG question"
                    disabled={position === 0}
                    onPress={() => pageQuestion(position - 1)}
                    style={[
                      styles.navButton,
                      { opacity: position === 0 ? 0.3 : 1 },
                    ]}
                  >
                    <ArrowLeft size={17} color={colors.text} />
                    <Text style={[typeScale.footnote, { color: colors.text }]}>
                      Previous
                    </Text>
                  </Touchable>
                  <Text
                    style={[typeScale.caption, { color: colors.textMuted }]}
                  >
                    {position + 1} of {activeResult.total}
                  </Text>
                  <Touchable
                    label={
                      sessionIds && position + 1 >= activeResult.total
                        ? 'Finish NEET PG session'
                        : 'Next NEET PG question'
                    }
                    disabled={!sessionIds && position + 1 >= activeResult.total}
                    onPress={() => {
                      if (sessionIds && position + 1 >= activeResult.total) {
                        study.setState(current => ({
                          ...current,
                          session: null,
                        }));
                        leaveQuestion();
                        setPlanOpen(true);
                      } else pageQuestion(position + 1);
                    }}
                    style={[
                      styles.navButton,
                      {
                        opacity:
                          !sessionIds && position + 1 >= activeResult.total
                            ? 0.3
                            : 1,
                      },
                    ]}
                  >
                    <Text style={[typeScale.footnote, { color: colors.text }]}>
                      {sessionIds && position + 1 >= activeResult.total
                        ? 'Finish'
                        : 'Next'}
                    </Text>
                    <ArrowRight size={17} color={colors.text} />
                  </Touchable>
                </View>
              </View>
            </View>
          </>
        ) : planOpen ? (
          <NeetPgPlanPanel
            total={reader.total}
            key={study.ready ? 'ready' : 'loading'}
            state={study.state}
            ready={study.ready}
            storageError={study.storageError}
            subjects={Array.from(
              new Map(
                chapters.map(c => [
                  c.subject,
                  { id: c.subject, name: c.names[0] },
                ]),
              ).values(),
            )}
            onSave={plan =>
              study.setState(current => ({ ...current, plan, session: null }))
            }
            onStart={startSession}
            onLibrary={() => setPlanOpen(false)}
          />
        ) : (
          <KeyboardSafe style={styles.flex}>
            <FlatList
              ref={libraryList}
              data={rows}
              keyExtractor={row => row.id}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={10}
              maxToRenderPerBatch={8}
              windowSize={5}
              contentContainerStyle={[
                styles.library,
                { paddingBottom: insets.bottom + space.xxl },
              ]}
              ListHeaderComponent={libraryHeader}
              ListEmptyComponent={
                <View style={[styles.empty, { borderColor: colors.border }]}>
                  <Search size={25} color={colors.textMuted} />
                  <Text style={[typeScale.title3, { color: colors.text }]}>
                    {savedOnly && !saved.length
                      ? 'A place for your next revision.'
                      : 'No questions found'}
                  </Text>
                  <Text
                    style={[
                      typeScale.callout,
                      styles.center,
                      { color: colors.textMuted },
                    ]}
                  >
                    {savedOnly && !saved.length
                      ? 'Save a question while you practise. It will be waiting here.'
                      : 'Try another concept, year or subject.'}
                  </Text>
                  <Touchable
                    label="Reset NEET PG filters"
                    onPress={() => {
                      setQuery('');
                      setSavedOnly(false);
                      setSubject(null);
                      setYear(null);
                      setSearchPage(0);
                    }}
                    style={styles.navButton}
                  >
                    <Text
                      style={[typeScale.bodyStrong, { color: colors.accent }]}
                    >
                      Browse all questions
                    </Text>
                  </Touchable>
                </View>
              }
              renderItem={({ item }) =>
                item.kind === 'question' ? (
                  <Touchable
                    label={'Open NEET PG question ' + (item.index + 1)}
                    onPress={() => start(undefined, item.index)}
                    style={[styles.libraryRow, { borderColor: colors.border }]}
                  >
                    <View
                      style={[
                        styles.rowNumber,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <Text
                        style={[typeScale.caption, { color: colors.textMuted }]}
                      >
                        {String(item.index + 1).padStart(2, '0')}
                      </Text>
                    </View>
                    <View style={styles.flex}>
                      <Text
                        numberOfLines={3}
                        style={[typeScale.body, { color: colors.text }]}
                      >
                        {item.question.question}
                      </Text>
                      <Text
                        style={[typeScale.caption, { color: colors.textMuted }]}
                      >
                        {chapterTitle(
                          chapterById.get(item.question.chapterId)?.name ?? '',
                        )}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </Touchable>
                ) : item.kind === 'subject' ? (
                  <Touchable
                    label={item.name}
                    onPress={() => {
                      Keyboard.dismiss();
                      setSubject(item.id);
                      setSearchPage(0);
                    }}
                    style={[styles.libraryRow, { borderColor: colors.border }]}
                  >
                    <View
                      style={[
                        styles.subjectMark,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <Text
                        style={[
                          typeScale.caption,
                          { color: colors.text, fontWeight: '700' },
                        ]}
                      >
                        {item.name.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.flex}>
                      <Text
                        style={[typeScale.bodyStrong, { color: colors.text }]}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[typeScale.caption, { color: colors.textMuted }]}
                      >
                        {item.chapters} chapters · {item.count} questions
                      </Text>
                    </View>
                    <ChevronRight size={19} color={colors.textMuted} />
                  </Touchable>
                ) : (
                  <Touchable
                    label={item.chapter.name + ' (' + item.chapter.count + ')'}
                    onPress={() => start(item.chapter.id)}
                    style={[styles.libraryRow, { borderColor: colors.border }]}
                  >
                    <View
                      style={[
                        styles.subjectMark,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <BookOpen size={19} color={colors.textMuted} />
                    </View>
                    <View style={styles.flex}>
                      <Text
                        style={[typeScale.bodyStrong, { color: colors.text }]}
                      >
                        {chapterTitle(item.chapter.name)}
                      </Text>
                      <Text
                        style={[typeScale.caption, { color: colors.textMuted }]}
                      >
                        {item.chapter.count} questions ·{' '}
                        {YEARS.find(([id]) => id === item.chapter.year)?.[1]}{' '}
                        Year
                      </Text>
                    </View>
                    <ChevronRight size={19} color={colors.textMuted} />
                  </Touchable>
                )
              }
              ListFooterComponent={
                searching && libraryResult.total > PAGE_SIZE ? (
                  <View style={styles.pagination}>
                    <Touchable
                      label="Previous offline question page"
                      disabled={searchPage === 0}
                      onPress={() =>
                        setSearchPage(value => Math.max(0, value - 1))
                      }
                      style={styles.navButton}
                    >
                      <ArrowLeft size={17} color={colors.text} />
                      <Text
                        style={[typeScale.footnote, { color: colors.text }]}
                      >
                        Previous
                      </Text>
                    </Touchable>
                    <Text
                      style={[typeScale.caption, { color: colors.textMuted }]}
                    >
                      {searchPage + 1} /{' '}
                      {Math.ceil(libraryResult.total / PAGE_SIZE)}
                    </Text>
                    <Touchable
                      label="Next offline question page"
                      disabled={
                        (searchPage + 1) * PAGE_SIZE >= libraryResult.total
                      }
                      onPress={() => setSearchPage(value => value + 1)}
                      style={styles.navButton}
                    >
                      <Text
                        style={[typeScale.footnote, { color: colors.text }]}
                      >
                        Next
                      </Text>
                      <ArrowRight size={17} color={colors.text} />
                    </Touchable>
                  </View>
                ) : undefined
              }
            />
            <View
              style={[
                styles.libraryDock,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  paddingBottom: Math.max(insets.bottom, space.sm),
                },
              ]}
            >
              <Touchable
                label="Open NEET PG study planner"
                onPress={() => setPlanOpen(true)}
                style={[
                  styles.plannerShortcut,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
              >
                <Sparkles size={18} color={colors.accent} />
                <View style={styles.flex}>
                  <Text style={[typeScale.bodyStrong, { color: colors.text }]}>
                    {study.state.plan ? 'Study plan' : 'Build study plan'}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.text} />
              </Touchable>

              {libraryResult.total > 0 ? (
                <Touchable
                  label="Start NEET PG practice"
                  onPress={() => start()}
                  style={[styles.start, { backgroundColor: colors.primary }]}
                >
                  <Text
                    style={[
                      typeScale.bodyStrong,
                      { color: colors.primaryText },
                    ]}
                  >
                    {savedOnly
                      ? 'Review saved questions'
                      : subject
                      ? 'Practice this subject'
                      : 'Start practice'}
                  </Text>
                  <ArrowRight size={19} color={colors.primaryText} />
                </Touchable>
              ) : null}
            </View>
          </KeyboardSafe>
        )}
        <Sheet
          visible={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          title="Your study space"
        >
          <Text
            style={[
              typeScale.overline,
              styles.settingLabel,
              { color: colors.textMuted },
            ]}
          >
            APPEARANCE
          </Text>
          {PRESETS.map(preset => (
            <Touchable
              key={preset.key}
              label={'Use ' + preset.name + ' theme'}
              role="radio"
              state={{ checked: preference === preset.key }}
              onPress={() => setPreference(preset.key)}
              style={styles.themeRow}
            >
              <View
                style={[
                  styles.themeSwatch,
                  {
                    backgroundColor: preset.palette?.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.themeDot,
                    { backgroundColor: preset.palette?.accent },
                  ]}
                />
              </View>
              <Text
                style={[typeScale.body, styles.flex, { color: colors.text }]}
              >
                {preset.name}
              </Text>
              {preference === preset.key ? (
                <Check size={18} color={colors.text} />
              ) : null}
            </Touchable>
          ))}
          <View style={[styles.importArea, { borderColor: colors.border }]}>
            <Text style={[typeScale.overline, { color: colors.textMuted }]}>
              OFFLINE LIBRARY
            </Text>
            <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
              {reader.total.toLocaleString()} questions · stored offline
            </Text>
            <Touchable
              label="Replace offline bank"
              disabled={installing}
              onPress={() => {
                setSettingsOpen(false);
                onReplace();
              }}
              style={styles.themeRow}
            >
              <Download size={19} color={colors.text} />
              <Text style={[typeScale.bodyStrong, { color: colors.text }]}>
                {installing ? 'Installing…' : 'Import a question bank'}
              </Text>
            </Touchable>
          </View>
        </Sheet>
        {aiOpen && question ? (
          <NeetPgQuestionAi
            key={question.id}
            question={question}
            chapter={chapterTitle(questionChapter?.name ?? '')}
            onClose={() => setAiOpen(false)}
          />
        ) : null}
        <ZoomableImage
          visible={activeImage !== null}
          onClose={() => setActiveImage(null)}
          uri={activeImage ? reader.image(activeImage)?.dataUri : null}
          title="Question illustration"
          imageLabel="Question illustration"
        />
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  center: { textAlign: 'center' },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    gap: space.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingRight: space.md,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  library: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: space.xl,
  },
  libraryDock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.sm,
  },
  plannerShortcut: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  libraryHeader: { gap: space.md, paddingBottom: space.sm },
  hero: { gap: space.xs, paddingTop: space.md, paddingBottom: space.xs },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingTop: space.sm,
    marginTop: space.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32 },
  savedTile: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  search: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingLeft: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    paddingVertical: space.md,
  },
  clear: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  years: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: space.xs,
    gap: space.xs,
  },
  year: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingTop: space.xs,
  },
  start: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    gap: space.sm,
  },
  libraryRow: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.lg,
  },
  subjectMark: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowNumber: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    marginTop: space.lg,
    padding: space.xxl,
    gap: space.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.lg,
  },
  progressTrack: { height: 2, overflow: 'hidden' },
  progressFill: { width: '100%', height: 2 },
  readerContainer: { flexGrow: 1 },
  reader: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: space.xl,
    paddingTop: space.xxl,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.md,
    flexWrap: 'wrap',
  },
  questionTag: {
    flexDirection: 'row',
    gap: space.xs,
    alignItems: 'center',
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
  },
  chapterMeta: { flexShrink: 1 },
  question: { marginBottom: space.lg },
  illustration: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.md,
  },
  image: { width: '100%', height: 240 },
  imageCaption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: space.sm,
  },
  options: { gap: space.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 64,
    padding: space.md,
  },
  letter: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerHint: { paddingTop: space.sm },
  explanation: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space.xxl,
    marginTop: space.md,
    gap: space.lg,
  },
  explanationText: { lineHeight: 24 },
  discuss: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: space.lg,
  },
  studyDock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
  },
  dockWidth: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: space.xs,
  },
  dockActions: { flexDirection: 'row', gap: space.md },
  ask: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  reveal: {
    flex: 1,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    paddingHorizontal: space.sm,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    minHeight: 44,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  settingLabel: { paddingBottom: space.md },
  themeRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  themeSwatch: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeDot: { width: 10, height: 10, borderRadius: radius.pill },
  importArea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: space.lg,
    paddingTop: space.xl,
    gap: space.sm,
  },
});
