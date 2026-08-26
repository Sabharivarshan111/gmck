import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Layers, RotateCw } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { BackButton } from '@/components/BackButton';
import { GradientFill } from '@/components/Gradient';
import { typeScale } from '@/theme/typography';
import { useTheme, withAlpha } from '@/theme';
import { getSubjects, YEAR_LABEL, type BankNode } from '@/lib/questionBank';
import { YEAR_TO_KEY, type Year } from '@/lib/profile';
import { flattenSubjectTopics, type LeafTopic } from '@/lib/handwrittenNotes';
import {
  fetchDeck,
  loadSchedule,
  reconcile,
  saveSchedule,
  type DeckCard,
  type Schedule,
} from '@/lib/flashcards';
import {
  answer,
  counts,
  dueQueue,
  GRADES,
  intervalLabel,
  isLeech,
  type Card,
  type Grade,
} from '@/lib/anki';
import { tick, complete } from '@/lib/haptics';

const YEARS: Year[] = ['first', 'second', 'third', 'final'];
const YEAR_EMOJI: Record<Year, string> = {
  first: '🩺',
  second: '💊',
  third: '⚖️',
  final: '🏥',
};

/** Anki's button colours, in Anki's order. Muted to sit in this app's palette. */
const GRADE_LABEL: Record<Grade, string> = {
  again: 'Again',
  hard: 'Hard',
  good: 'Good',
  easy: 'Easy',
};

type Screen =
  | { kind: 'years' }
  | { kind: 'subjects'; year: Year }
  | { kind: 'topics'; year: Year; subjectKey: string; subjectName: string; node: BankNode }
  | {
      kind: 'study';
      year: Year;
      subjectKey: string;
      subjectName: string;
      topic: LeafTopic;
    };

export default function FlashcardsScreen({ onExit }: { onExit: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<Screen>({ kind: 'years' });

  const back = useCallback(() => {
    setView(current => {
      if (current.kind === 'years') {
        onExit();
        return current;
      }
      if (current.kind === 'subjects') {
        return { kind: 'years' };
      }
      if (current.kind === 'topics') {
        return { kind: 'subjects', year: current.year };
      }
      return {
        kind: 'topics',
        year: current.year,
        subjectKey: current.subjectKey,
        subjectName: current.subjectName,
        node: getSubjects(YEAR_TO_KEY[current.year]).find(s => s.key === current.subjectKey)?.node ?? {},
      };
    });
  }, [onExit]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      keyboardShouldPersistTaps="handled">
      {view.kind === 'years' ? (
        <YearsView onPick={year => setView({ kind: 'subjects', year })} onBack={back} />
      ) : null}

      {view.kind === 'subjects' ? (
        <SubjectsView
          year={view.year}
          onBack={back}
          onPick={(subjectKey, subjectName, node) =>
            setView({ kind: 'topics', year: view.year, subjectKey, subjectName, node })
          }
        />
      ) : null}

      {view.kind === 'topics' ? (
        <TopicsView
          year={view.year}
          subjectKey={view.subjectKey}
          subjectName={view.subjectName}
          node={view.node}
          onBack={back}
          onPick={topic =>
            setView({
              kind: 'study',
              year: view.year,
              subjectKey: view.subjectKey,
              subjectName: view.subjectName,
              topic,
            })
          }
        />
      ) : null}

      {view.kind === 'study' ? (
        <StudyView
          year={view.year}
          subjectName={view.subjectName}
          topic={view.topic}
          onBack={back}
        />
      ) : null}
    </ScrollView>
  );
}

function Header({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.headerRow}>
      <BackButton onPress={onBack} label="Go back" />
      <View style={styles.flex}>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function YearsView({ onPick, onBack }: { onPick: (year: Year) => void; onBack: () => void }) {
  const { colors } = useTheme();
  return (
    <>
      <Header title="Flashcards" onBack={onBack} />

      <View style={styles.hero}>
        <GradientFill from="#7C3AED" to="#C026D3" borderRadius={18} />
        <View style={styles.heroKickerRow}>
          <Layers size={16} color="#FFFFFF" />
          <Text style={styles.heroKicker}>SPACED REPETITION</Text>
        </View>
        <Text style={styles.heroTitle}>Anki-style cards</Text>
        <Text style={styles.heroBody}>
          Pick a year → subject → chapter. Half the cards are theory written from that chapter's
          past-year questions; the other half are the exam diagrams. Cards you find hard come back
          sooner.
        </Text>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SELECT YEAR</Text>
      <View style={styles.grid}>
        {YEARS.map(year => (
          <Touchable
            key={year}
            onPress={() => onPick(year)}
            label={`${YEAR_LABEL[YEAR_TO_KEY[year]]}, browse subjects`}
            scaleTo={0.97}
            style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.gridEmoji}>{YEAR_EMOJI[year]}</Text>
            <Text style={[styles.gridName, { color: colors.text }]}>
              {YEAR_LABEL[YEAR_TO_KEY[year]]}
            </Text>
            <Text style={[styles.gridHint, { color: colors.textMuted }]}>Tap to browse subjects</Text>
          </Touchable>
        ))}
      </View>
    </>
  );
}

function SubjectsView({
  year,
  onPick,
  onBack,
}: {
  year: Year;
  onPick: (key: string, name: string, node: BankNode) => void;
  onBack: () => void;
}) {
  const { colors } = useTheme();
  const subjects = useMemo(() => getSubjects(YEAR_TO_KEY[year]), [year]);
  return (
    <>
      <Header title={`${YEAR_LABEL[YEAR_TO_KEY[year]]} • Subjects`} onBack={onBack} />
      {subjects.map(subject => (
        <Touchable
          key={subject.key}
          onPress={() => onPick(subject.key, subject.name, subject.node)}
          label={`${subject.name}, browse chapters`}
          style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{subject.name}</Text>
          <ChevronRight size={20} color={colors.textMuted} />
        </Touchable>
      ))}
    </>
  );
}

function TopicsView({
  year,
  subjectKey,
  subjectName,
  node,
  onPick,
  onBack,
}: {
  year: Year;
  subjectKey: string;
  subjectName: string;
  node: BankNode;
  onPick: (topic: LeafTopic) => void;
  onBack: () => void;
}) {
  const { colors } = useTheme();
  const topics = useMemo(() => flattenSubjectTopics(subjectKey, node), [subjectKey, node]);
  return (
    <>
      <Header
        title={subjectName}
        subtitle={`${YEAR_LABEL[YEAR_TO_KEY[year]]} • ${topics.length} chapters`}
        onBack={onBack}
      />
      {topics.map(topic => (
        <Touchable
          key={topic.key}
          onPress={() => onPick(topic)}
          label={`${topic.name}, ${topic.questions.length} questions, study flashcards`}
          style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.flex}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>{topic.name}</Text>
            <Text style={[styles.rowSub, { color: colors.textMuted }]}>
              {topic.questions.length} questions
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </Touchable>
      ))}
    </>
  );
}

/**
 * One sitting.
 *
 * The card is face-down until the reader says they have tried to recall it —
 * that is the whole mechanism, and showing the answer alongside the question
 * turns a memory test into reading. Anki calls the step "Show Answer" and so
 * does this.
 */
function StudyView({
  year,
  subjectName,
  topic,
  onBack,
}: {
  year: Year;
  subjectName: string;
  topic: LeafTopic;
  onBack: () => void;
}) {
  const { colors } = useTheme();
  const [deck, setDeck] = useState<DeckCard[] | null>(null);
  const [deckKey, setDeckKey] = useState('');
  const [schedule, setSchedule] = useState<Schedule>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const yearLabel = YEAR_LABEL[YEAR_TO_KEY[year]];
  /*
   * The chapter key the diagrams are filed under is the last segment of the
   * leaf key ("community-medicine::epidemiology-of-communicable-diseases"), not
   * the whole thing. Sending the whole key would match no diagram rows and
   * quietly produce an all-theory deck.
   */
  const subtopicKey = useMemo(() => {
    const path = topic.key.split('::').pop() ?? topic.key;
    return path.split('/').pop() ?? path;
  }, [topic.key]);

  const load = useCallback(
    async (regenerate: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const built = await fetchDeck({
          year: yearLabel,
          subject: subjectName,
          subtopicKey,
          subtopicName: topic.name,
          questions: topic.questions,
          regenerate,
        });
        const saved = await loadSchedule(built.deckKey);
        setDeck(built.cards);
        setDeckKey(built.deckKey);
        setSchedule(saved);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [subjectName, subtopicKey, topic.name, topic.questions, yearLabel],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const cards = useMemo<Card[]>(
    () => (deck ? reconcile(deck, schedule) : []),
    [deck, schedule],
  );
  const queue = useMemo(() => dueQueue(cards), [cards]);
  const tally = useMemo(() => counts(cards), [cards]);
  const current = queue[0];
  const face = useMemo(
    () => (current && deck ? deck.find(c => c.id === current.id) ?? null : null),
    [current, deck],
  );

  const onGrade = useCallback(
    (grade: Grade) => {
      if (!current) {
        return;
      }
      const next = answer(current, grade);
      // A commit, so the stronger of the two taps. Anki's own feedback is the
      // card leaving; this is the same beat.
      if (grade === 'again') {
        tick();
      } else {
        complete();
      }
      setSchedule(previous => {
        const updated = { ...previous, [next.id]: next };
        saveSchedule(deckKey, updated);
        return updated;
      });
      setRevealed(false);
      setImageFailed(false);
    },
    [current, deckKey],
  );

  if (loading) {
    return (
      <>
        <Header title={topic.name} subtitle="Building this deck…" onBack={onBack} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
          <Text style={[styles.centeredText, { color: colors.textMuted }]}>
            The first person to open a chapter waits while its cards are written. After that it is
            instant for everyone.
          </Text>
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title={topic.name} onBack={onBack} />
        <View style={[styles.notice, { borderColor: withAlpha(colors.danger, 0.4) }]}>
          <Text style={[styles.noticeText, { color: colors.danger }]}>{error}</Text>
        </View>
        <Touchable
          onPress={() => load(false)}
          label="Try building this deck again"
          style={[styles.retry, { borderColor: colors.border }]}>
          <RotateCw size={16} color={colors.textMuted} />
          <Text style={[styles.retryText, { color: colors.textMuted }]}>Try again</Text>
        </Touchable>
      </>
    );
  }

  if (!current || !face) {
    return (
      <>
        <Header title={topic.name} subtitle={`${deck?.length ?? 0} cards`} onBack={onBack} />
        <View style={styles.centered}>
          <Text style={[styles.doneTitle, { color: colors.text }]}>Nothing due right now</Text>
          <Text style={[styles.centeredText, { color: colors.textMuted }]}>
            Every card in this chapter is scheduled for later. Come back when one falls due — that
            gap is the part that makes it stick.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Header
        title={topic.name}
        subtitle={`${tally.fresh} new · ${tally.learning} learning · ${tally.review} to review`}
        onBack={onBack}
      />

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {face.kind === 'image' && face.imageUrl && !imageFailed ? (
          <Image
            source={{ uri: face.imageUrl }}
            style={styles.cardImage}
            resizeMode="contain"
            // A diagram that will not load must say so rather than leave a grey
            // rectangle, which looks identical to "this app has no diagrams".
            onError={() => setImageFailed(true)}
            accessibilityLabel={face.front}
          />
        ) : null}

        <Text style={[styles.cardFront, { color: colors.text }]}>{face.front}</Text>

        {!revealed && face.hint ? (
          <Text style={[styles.hint, { color: colors.textMuted }]}>Hint: {face.hint}</Text>
        ) : null}

        {revealed ? (
          <>
            <View style={[styles.rule, { backgroundColor: colors.border }]} />
            <Text style={[styles.cardBack, { color: colors.text }]}>
              {face.back || 'Study the diagram above, then grade how well you recalled it.'}
            </Text>
            {imageFailed ? (
              <Text style={[styles.hint, { color: colors.warning }]}>
                This diagram could not be loaded.
              </Text>
            ) : null}
          </>
        ) : null}

        {isLeech(current) ? (
          <Text style={[styles.hint, { color: colors.warning }]}>
            You have missed this one {current.lapses} times. It may be worth rewriting rather than
            repeating.
          </Text>
        ) : null}
      </View>

      {revealed ? (
        <View style={styles.grades}>
          {GRADES.map(grade => (
            <Touchable
              key={grade}
              onPress={() => onGrade(grade)}
              label={`${GRADE_LABEL[grade]}, next in ${intervalLabel(current, grade)}`}
              scaleTo={0.95}
              style={[
                styles.gradeButton,
                {
                  backgroundColor: withAlpha(gradeColor(grade, colors), 0.14),
                  borderColor: withAlpha(gradeColor(grade, colors), 0.5),
                },
              ]}>
              <Text style={[styles.gradeName, { color: gradeColor(grade, colors) }]}>
                {GRADE_LABEL[grade]}
              </Text>
              {/* The cost of the choice, before it is made. This is the single
                  most useful thing about Anki's answer row. */}
              <Text style={[styles.gradeWhen, { color: colors.textMuted }]}>
                {intervalLabel(current, grade)}
              </Text>
            </Touchable>
          ))}
        </View>
      ) : (
        <Touchable
          onPress={() => setRevealed(true)}
          label="Show answer"
          scaleTo={0.97}
          style={[styles.reveal, { backgroundColor: colors.primary }]}>
          <Text style={[styles.revealText, { color: colors.primaryText }]}>Show answer</Text>
        </Touchable>
      )}

      <Touchable
        onPress={() => load(true)}
        label="Write this deck again"
        hint="Discards these cards and generates new ones"
        style={[styles.retry, { borderColor: colors.border }]}>
        <RotateCw size={16} color={colors.textMuted} />
        <Text style={[styles.retryText, { color: colors.textMuted }]}>Write this deck again</Text>
      </Touchable>
    </>
  );
}

/** Anki's colour language: red to green, left to right. */
function gradeColor(grade: Grade, colors: ReturnType<typeof useTheme>['colors']): string {
  if (grade === 'again') {
    return colors.danger;
  }
  if (grade === 'hard') {
    return colors.warning;
  }
  if (grade === 'good') {
    return colors.success;
  }
  return colors.accent;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  headerTitle: typeScale.title3,
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  hero: {
    borderRadius: 18,
    padding: 20,
    overflow: 'hidden',
    marginBottom: 22,
  },
  heroKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  heroKicker: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroBody: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.92,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    flexGrow: 1,
    flexBasis: '46%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  gridEmoji: { fontSize: 26, marginBottom: 8 },
  gridName: { fontSize: 17, fontWeight: '700' },
  gridHint: { fontSize: 12, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  rowTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  rowSub: { fontSize: 12, marginTop: 2 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    minHeight: 180,
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardFront: {
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 26,
    textAlign: 'center',
  },
  rule: {
    height: 1,
    marginVertical: 16,
  },
  cardBack: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  reveal: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  revealText: { fontSize: 16, fontWeight: '700' },
  grades: {
    flexDirection: 'row',
    gap: 8,
  },
  gradeButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  gradeName: { fontSize: 14, fontWeight: '700' },
  gradeWhen: { fontSize: 11, marginTop: 2 },
  centered: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  centeredText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  doneTitle: { fontSize: 18, fontWeight: '700' },
  notice: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  noticeText: { fontSize: 13, lineHeight: 19 },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    marginTop: 16,
  },
  retryText: { fontSize: 13, fontWeight: '600' },
});
