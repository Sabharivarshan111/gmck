import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { NeetPgQuestionAi } from '@/components/NeetPgQuestionAi';
import {
  PG_COMPACT,
  getPgChapters,
  searchOfflinePgQuestions,
} from '@/lib/pgLocalBank';
import type { PgQuestion } from '@/lib/pgEntranceBank';
import { useTheme } from '@/theme';
import { radius, space } from '@/theme/tokens';
import { typeScale } from '@/theme/typography';

const SAVED_KEY = 'orbit:medmcqa:saved:v1';
const PAGE = 30;

/** Keep the existing compressed bank paged: never materialize 185k questions in React. */
export function MedMcqaPracticeModal({
  onClose,
  examChoices,
  locked = false,
  onUnlock,
}: {
  onClose: () => void;
  examChoices: React.ReactNode;
  locked?: boolean;
  onUnlock?: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState<string | null>(null);
  const [chapter, setChapter] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<{
    questions: PgQuestion[];
    total: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [active, setActive] = useState<PgQuestion | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [ai, setAi] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [savedReady, setSavedReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(SAVED_KEY)
      .then(raw => {
        const value: unknown = JSON.parse(raw ?? '[]');
        if (mounted && Array.isArray(value))
          setSaved(value.filter((id): id is string => typeof id === 'string'));
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setSavedReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (savedReady)
      void AsyncStorage.setItem(SAVED_KEY, JSON.stringify(saved)).catch(
        () => {},
      );
  }, [saved, savedReady]);
  useEffect(() => {
    if (locked || (!chapter && !search)) {
      setResult(null);
      setError('');
      setBusy(false);
      return;
    }
    let mounted = true;
    setBusy(true);
    setError('');
    setResult(null);
    void searchOfflinePgQuestions({
      exam: 'GENERAL_MEDICAL',
      year: null,
      subject,
      chapter,
      search,
      offset: page * PAGE,
      limit: PAGE,
    })
      .then(value => {
        if (mounted) setResult(value);
      })
      .catch(reason => {
        if (mounted)
          setError(
            reason instanceof Error
              ? reason.message
              : 'Practice questions could not be opened.',
          );
      })
      .finally(() => {
        if (mounted) setBusy(false);
      });
    return () => {
      mounted = false;
    };
  }, [subject, chapter, search, page, retry, locked]);
  const chapters = useMemo(() => getPgChapters(subject), [subject]);
  const open = (question: PgQuestion) => {
    setActive(question);
    setChoice(null);
    setRevealed(false);
    setAi(false);
  };
  const back = () => {
    if (active) {
      setActive(null);
      setAi(false);
    } else if (chapter || search) {
      setChapter(null);
      setSearch('');
      setQuery('');
      setPage(0);
    } else if (subject) setSubject(null);
    else onClose();
  };
  const button = (label: string, action: () => void, disabled = false) => (
    <Touchable
      label={label}
      onPress={action}
      disabled={disabled}
      style={[
        styles.button,
        { borderColor: colors.border, backgroundColor: colors.card },
      ]}
    >
      <Text style={[typeScale.body, { color: colors.text }]}>{label}</Text>
    </Touchable>
  );
  const rows = subject
    ? chapters.map(item => ({
        id: item.name,
        name: item.name,
        count: item.count,
      }))
    : PG_COMPACT.packs.map(pack => ({
        id: pack.subject,
        name: pack.subject,
        count: pack.count,
      }));
  return (
    <Modal visible onRequestClose={back}>
      <KeyboardSafe
        style={[
          styles.screen,
          {
            paddingTop: insets.top + space.md,
            paddingBottom: insets.bottom + space.md,
            backgroundColor: colors.background,
          },
        ]}
      >
        {button(
          active
            ? 'Back to practice questions'
            : subject || search
            ? 'Back to practice subjects'
            : 'Close practice questions',
          back,
        )}
        {!active ? examChoices : null}
        <Text
          accessibilityRole="header"
          style={[typeScale.title2, { color: colors.text }]}
        >
          Practice questions
        </Text>
        <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
          {PG_COMPACT.total.toLocaleString()} questions · Subject and chapter
          practice
        </Text>
        {locked ? (
          <View style={styles.content}>
            <Text style={[typeScale.body, { color: colors.text }]}>
              Unlock Premium to open the complete chapter-wise practice bank.
            </Text>
            {button('Unlock practice questions', () => onUnlock?.())}
          </View>
        ) : active ? (
          <ScrollView key={active.id} contentContainerStyle={styles.content}>
            <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
              {active.subject} · {active.chapter}
            </Text>
            <Text style={[typeScale.body, { color: colors.text }]}>
              {active.question}
            </Text>
            {active.options.map((option, index) => (
              <Touchable
                key={index}
                label={'Option ' + 'ABCD'[index] + ': ' + option}
                role="radio"
                state={{ checked: choice === index }}
                disabled={revealed}
                disabledOpacity={1}
                onPress={() => setChoice(index)}
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.card,
                    borderColor:
                      revealed && active.answer === 'ABCD'[index]
                        ? colors.success
                        : choice === index
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              >
                <Text style={[typeScale.body, { color: colors.text }]}>
                  {'ABCD'[index]}. {option}
                </Text>
              </Touchable>
            ))}
            {button(
              revealed ? 'Hide supplied answer' : 'Show supplied answer',
              () => setRevealed(!revealed),
            )}
            {revealed ? (
              <View style={styles.content}>
                <Text style={[typeScale.bodyStrong, { color: colors.text }]}>
                  Answer: {active.answer}
                </Text>
                <Text style={[typeScale.body, { color: colors.text }]}>
                  {active.explanation ||
                    'No explanation is available in this source record.'}
                </Text>
              </View>
            ) : null}
            {button(
              saved.includes(active.id)
                ? 'Unsave practice question'
                : 'Save practice question',
              () =>
                setSaved(ids =>
                  ids.includes(active.id)
                    ? ids.filter(id => id !== active.id)
                    : [...ids, active.id],
                ),
              !savedReady,
            )}
            {button('Ask ACEV about this practice question', () => setAi(true))}
            {ai ? (
              <NeetPgQuestionAi
                key={active.id}
                question={{
                  id: active.id,
                  chapterId: active.chapter ?? active.subject,
                  question: active.question,
                  options: active.options,
                  answerIndex: 'ABCD'.indexOf(active.answer),
                  sourceAnswer: active.answer,
                  explanation: active.explanation,
                  requiresImage: false,
                  imageIds: [],
                }}
                chapter={active.subject + ' / ' + active.chapter}
                onClose={() => setAi(false)}
              />
            ) : null}
          </ScrollView>
        ) : (
          <>
            <Text style={[typeScale.bodyStrong, { color: colors.text }]}>
              {chapter ?? subject ?? 'Browse subjects'}
            </Text>
            <View style={styles.search}>
              <TextInput
                accessibilityLabel="Search MedMCQA practice questions"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => {
                  setSearch(query.trim());
                  Keyboard.dismiss();
                  setPage(0);
                }}
                placeholder="Search practice questions"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  typeScale.body,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />
              {button('Search practice', () => {
                setSearch(query.trim());
                  Keyboard.dismiss();
                setPage(0);
              })}
            </View>
            {busy ? (
              <ActivityIndicator
                accessibilityLabel="Loading practice questions"
                color={colors.primary}
              />
            ) : null}
            {error ? (
              <View>
                <Text style={{ color: colors.danger }}>{error}</Text>
                {button('Retry practice questions', () =>
                  setRetry(value => value + 1),
                )}
              </View>
            ) : null}
            {chapter || search ? (
              <>
                {result ? (
                  <Text
                    style={[typeScale.footnote, { color: colors.textMuted }]}
                  >
                    {result.total.toLocaleString()} matching practice questions
                  </Text>
                ) : null}
                <FlatList
                keyboardShouldPersistTaps="handled"
                  data={result?.questions ?? []}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.row}>
                      {button(item.question, () => open(item))}
                      {saved.includes(item.id) ? (
                        <Text style={{ color: colors.primary }}>Saved</Text>
                      ) : null}
                    </View>
                  )}
                />
                <View style={styles.search}>
                  {button(
                    'Previous practice page',
                    () => setPage(value => value - 1),
                    busy || page === 0,
                  )}
                  {button(
                    'Next practice page',
                    () => setPage(value => value + 1),
                    busy || !result || (page + 1) * PAGE >= result.total,
                  )}
                </View>
              </>
            ) : (
              <FlatList
                keyboardShouldPersistTaps="handled"
                data={rows}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={styles.row}>
                    {button(
                      item.name + ' (' + item.count.toLocaleString() + ')',
                      () => {
                        if (subject) setChapter(item.name);
                        else setSubject(item.name);
                        setPage(0);
                      },
                    )}
                  </View>
                )}
              />
            )}
          </>
        )}
      </KeyboardSafe>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.md, gap: space.sm },
  content: { gap: space.md, paddingBottom: space.lg },
  button: {
    minHeight: 44,
    padding: space.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  row: { marginBottom: space.sm },
  search: { flexDirection: 'row', gap: space.sm },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.sm,
  },
});
