import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Layers, Plus, RotateCw, Trash2, User } from 'lucide-react-native';
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
  deckTargetFor,
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
import {
  addCard,
  createDeck,
  customDeckKey,
  deleteCard,
  deleteDeck,
  loadCustomDecks,
  type CustomDeck,
} from '@/lib/customDecks';

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
  | { kind: 'myDecks' }
  | { kind: 'editDeck'; deckId: string }
  | { kind: 'studyCustom'; deckId: string }
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
      if (current.kind === 'subjects' || current.kind === 'myDecks') {
        return { kind: 'years' };
      }
      if (current.kind === 'editDeck' || current.kind === 'studyCustom') {
        return { kind: 'myDecks' };
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
        <YearsView
          onPick={year => setView({ kind: 'subjects', year })}
          onMyDecks={() => setView({ kind: 'myDecks' })}
          onBack={back}
        />
      ) : null}

      {view.kind === 'myDecks' ? (
        <MyDecksView
          onBack={back}
          onEdit={deckId => setView({ kind: 'editDeck', deckId })}
          onStudy={deckId => setView({ kind: 'studyCustom', deckId })}
        />
      ) : null}

      {view.kind === 'editDeck' ? (
        <EditDeckView deckId={view.deckId} onBack={back} />
      ) : null}

      {view.kind === 'studyCustom' ? (
        <CustomStudyView deckId={view.deckId} onBack={back} />
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

function YearsView({
  onPick,
  onMyDecks,
  onBack,
}: {
  onPick: (year: Year) => void;
  onMyDecks: () => void;
  onBack: () => void;
}) {
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

      <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 22 }]}>
        YOUR OWN DECKS
      </Text>
      <Touchable
        onPress={onMyDecks}
        label="Your own decks, write and study your own cards"
        scaleTo={0.97}
        style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.rowIcon, { backgroundColor: withAlpha(colors.accent, 0.15) }]}>
          <User size={18} color={colors.accent} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>Decks you write</Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>
            Kept on this phone only — they are not uploaded anywhere
          </Text>
        </View>
        <ChevronRight size={20} color={colors.textMuted} />
      </Touchable>
    </>
  );
}

/** The list of decks you have written, and a box to start another. */
function MyDecksView({
  onBack,
  onEdit,
  onStudy,
}: {
  onBack: () => void;
  onEdit: (deckId: string) => void;
  onStudy: (deckId: string) => void;
}) {
  const { colors } = useTheme();
  const [decks, setDecks] = useState<CustomDeck[] | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    loadCustomDecks().then(setDecks);
  }, []);

  const create = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const deck = await createDeck(trimmed);
    setName('');
    setDecks(await loadCustomDecks());
    onEdit(deck.id);
  }, [name, onEdit]);

  const remove = useCallback(async (id: string) => {
    setDecks(await deleteDeck(id));
  }, []);

  return (
    <>
      <Header title="Decks you write" subtitle="Kept on this phone only" onBack={onBack} />

      <View style={[styles.card, styles.compactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>New deck</Text>
        <View style={styles.newRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Cranial nerves"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            returnKeyType="done"
            onSubmitEditing={create}
            accessibilityLabel="Name for the new deck"
          />
          <Touchable
            onPress={create}
            label="Create this deck"
            disabled={name.trim().length === 0}
            style={[styles.iconButton, { backgroundColor: colors.primary }]}>
            <Plus size={18} color={colors.primaryText} />
          </Touchable>
        </View>
        {/*
          Said plainly, where the decision is made. These decks live in this
          app's storage and nowhere else: no account, no upload, and no copy to
          restore from. That is a fair trade for not needing an account, but it
          is only fair if it is not a surprise later.
        */}
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Your decks stay on this phone. Uninstalling the app removes them, and
          they will not appear on another device.
        </Text>
      </View>

      {decks === null ? (
        <ActivityIndicator color={colors.accent} />
      ) : decks.length === 0 ? (
        <Text style={[styles.centeredText, { color: colors.textMuted }]}>
          No decks yet. Name one above and start adding cards.
        </Text>
      ) : (
        decks.map(deck => (
          <View
            key={deck.id}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Touchable
              onPress={() => (deck.cards.length > 0 ? onStudy(deck.id) : onEdit(deck.id))}
              label={`${deck.name}, ${deck.cards.length} cards, ${
                deck.cards.length > 0 ? 'study' : 'add cards'
              }`}
              style={styles.flex}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{deck.name}</Text>
              <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                {deck.cards.length === 0
                  ? 'No cards yet — tap to add some'
                  : `${deck.cards.length} card${deck.cards.length === 1 ? '' : 's'}`}
              </Text>
            </Touchable>
            <Touchable
              onPress={() => onEdit(deck.id)}
              label={`Edit ${deck.name}`}
              style={[styles.iconButton, { borderColor: colors.border, borderWidth: 1 }]}>
              <Plus size={16} color={colors.textMuted} />
            </Touchable>
            <Touchable
              onPress={() => remove(deck.id)}
              label={`Delete ${deck.name}`}
              hint="Removes the deck and its cards from this phone"
              style={[styles.iconButton, { borderColor: colors.border, borderWidth: 1 }]}>
              <Trash2 size={16} color={colors.danger} />
            </Touchable>
          </View>
        ))
      )}
    </>
  );
}

/** Add and remove cards in one of your decks. */
function EditDeckView({ deckId, onBack }: { deckId: string; onBack: () => void }) {
  const { colors } = useTheme();
  const [decks, setDecks] = useState<CustomDeck[] | null>(null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomDecks().then(setDecks);
  }, []);

  const deck = decks?.find(d => d.id === deckId) ?? null;

  const add = useCallback(async () => {
    if (!front.trim() || !back.trim()) {
      return;
    }
    /*
     * The keyboard goes first.
     *
     * Both fields are `multiline`, so on Android the soft keyboard is up while
     * the finger comes down on this button. `keyboardShouldPersistTaps` on the
     * ScrollView is what is supposed to let the tap through, and it does not
     * cover a Pressable whose press begins inside the keyboard's own inset —
     * the tap is spent dismissing the keyboard and the button never hears it.
     * Dismissing first makes the press land the first time rather than the
     * second, and costs nothing when there is no keyboard (the preview, where
     * this always appeared to work).
     */
    Keyboard.dismiss();
    try {
      setDecks(await addCard(deckId, front, back));
      setFront('');
      setBack('');
      setError(null);
      complete();
    } catch (err) {
      /*
       * Storage is the only thing that can fail here, and it used to fail
       * invisibly: an async onPress with no catch is an unhandled rejection,
       * which React Native does not surface. The card simply did not appear and
       * there was nothing to read. Whatever went wrong, the reader gets told.
       */
      setError((err as Error)?.message ?? 'Could not save that card.');
    }
  }, [back, deckId, front]);

  if (!deck) {
    return <Header title="Deck" onBack={onBack} />;
  }

  return (
    <>
      <Header
        title={deck.name}
        subtitle={`${deck.cards.length} card${deck.cards.length === 1 ? '' : 's'}`}
        onBack={onBack}
      />

      <View style={[styles.card, styles.compactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>New card</Text>
        <TextInput
          value={front}
          onChangeText={setFront}
          placeholder="Front — the question"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.inputBlock, { color: colors.text, borderColor: colors.border }]}
          multiline
          accessibilityLabel="Front of the card, the question"
        />
        <TextInput
          value={back}
          onChangeText={setBack}
          placeholder="Back — the answer"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.inputBlock, { color: colors.text, borderColor: colors.border }]}
          multiline
          accessibilityLabel="Back of the card, the answer"
        />
        <Touchable
          onPress={add}
          label="Add this card"
          disabled={!front.trim() || !back.trim()}
          style={[styles.reveal, { backgroundColor: colors.primary }]}>
          <Text style={[styles.revealText, { color: colors.primaryText }]}>Add card</Text>
        </Touchable>
        {/* One fact per card is the rule Anki is built around, so it is said
            where the card is written rather than in a help page nobody opens. */}
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          One fact per card. If the answer needs a paragraph, it is two cards.
        </Text>
        {error ? (
          <Text accessibilityLiveRegion="polite" style={[styles.hint, { color: colors.danger }]}>
            {error}
          </Text>
        ) : null}
      </View>

      {deck.cards.map(card => (
        <View
          key={card.id}
          style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.flex}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>{card.front}</Text>
            <Text style={[styles.rowSub, { color: colors.textMuted }]}>{card.back}</Text>
          </View>
          <Touchable
            onPress={async () => setDecks(await deleteCard(deckId, card.id))}
            label={`Delete the card "${card.front}"`}
            style={[styles.iconButton, { borderColor: colors.border, borderWidth: 1 }]}>
            <Trash2 size={16} color={colors.danger} />
          </Touchable>
        </View>
      ))}
    </>
  );
}

/** Study one of your own decks, through exactly the same scheduler. */
function CustomStudyView({ deckId, onBack }: { deckId: string; onBack: () => void }) {
  const [deck, setDeck] = useState<CustomDeck | null>(null);

  useEffect(() => {
    loadCustomDecks().then(all => setDeck(all.find(d => d.id === deckId) ?? null));
  }, [deckId]);

  if (!deck) {
    return <Header title="Deck" onBack={onBack} />;
  }
  /*
   * The same StudyView, with the cards handed in rather than fetched. A deck
   * you wrote and a deck Gemini wrote are the same thing once they are cards,
   * and a second study screen would be a second place for the scheduler to
   * drift.
   */
  return (
    <StudyView
      year="third"
      subjectName={deck.name}
      topic={{ key: customDeckKey(deck.id), name: deck.name, breadcrumb: deck.name, questions: [] }}
      onBack={onBack}
      fixture={deck.cards}
    />
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
          label={`${topic.name}, ${deckTargetFor(topic.questions.length)} cards, study flashcards`}
          style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.flex}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>{topic.name}</Text>
            {/*
              The deck's size, not the chapter's question count.

              These are different numbers and the row used to show the wrong
              one. A chapter of 15 questions builds a 20-card deck — an essay
              question is worth several cards — so "15 questions" was a promise
              about something the reader was never shown, and every deck looked
              like it had lost cards on the way.
            */}
            <Text style={[styles.rowSub, { color: colors.textMuted }]}>
              {deckTargetFor(topic.questions.length)} cards
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
export function StudyView({
  year,
  subjectName,
  topic,
  onBack,
  fixture,
}: {
  year: Year;
  subjectName: string;
  topic: LeafTopic;
  onBack: () => void;
  /**
   * A deck supplied instead of fetched.
   *
   * Only the preview passes this. The study screen is otherwise unreachable
   * without a route to Supabase, which the harness does not have — so every
   * state past "could not build this deck" was unreviewable and could not be
   * screenshotted. A fixture is how the card, the four buttons and their
   * interval previews get looked at before they reach a phone.
   */
  fixture?: DeckCard[];
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
    if (fixture) {
      setDeck(fixture);
      setDeckKey('preview::fixture');
      setSchedule({});
      setLoading(false);
      return;
    }
    load(false);
  }, [fixture, load]);

  const cards = useMemo<Card[]>(
    () => (deck ? reconcile(deck, schedule) : []),
    [deck, schedule],
  );
  const queue = useMemo(() => dueQueue(cards), [cards]);
  const tally = useMemo(() => counts(cards), [cards]);
  /**
   * The three counts, plus what is being held back.
   *
   * `dueQueue` serves at most NEW_PER_DAY (20) new cards a day, which is
   * Anki's default and the whole point of spaced repetition — twenty a day is
   * a habit, forty-four in one sitting is a evening that never happens again.
   * But a 44-card deck that says "20 new" reads as a deck that lost 24 cards.
   * Saying where they went is the difference between a limit and a bug.
   */
  const heldBack = useMemo(
    () => cards.filter(c => c.type === 'new').length - tally.fresh,
    [cards, tally.fresh],
  );
  const queueSubtitle = useMemo(() => {
    const parts = [`${tally.fresh} new`, `${tally.learning} learning`, `${tally.review} to review`];
    return heldBack > 0
      ? `${parts.join(' · ')}  ·  ${heldBack} more tomorrow`
      : parts.join(' · ');
  }, [heldBack, tally.fresh, tally.learning, tally.review]);

  const [cardIndex, setCardIndex] = useState(0);
  const [history, setHistory] = useState<Array<{ cardId: string; prevCard: Card }>>([]);

  const safeIndex = queue.length > 0 ? Math.min(cardIndex, queue.length - 1) : 0;
  const current = queue[safeIndex];
  const face = useMemo(
    () => (current && deck ? deck.find(c => c.id === current.id) ?? null : null),
    [current, deck],
  );

  const canGoNext = queue.length > 1;
  const canGoPrevious = safeIndex > 0 || history.length > 0;

  const onNext = useCallback(() => {
    if (queue.length <= 1) return;
    setCardIndex(i => (i + 1) % queue.length);
    setRevealed(false);
    setImageFailed(false);
  }, [queue.length]);

  const onPrevious = useCallback(() => {
    if (safeIndex > 0) {
      setCardIndex(i => i - 1);
      setRevealed(false);
      setImageFailed(false);
    } else if (history.length > 0) {
      const last = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setSchedule(prev => {
        const updated = { ...prev, [last.cardId]: last.prevCard };
        saveSchedule(deckKey, updated);
        return updated;
      });
      setRevealed(false);
      setImageFailed(false);
    }
  }, [safeIndex, deckKey, history]);

  const onGrade = useCallback(
    (grade: Grade) => {
      if (!current) {
        return;
      }
      setHistory(h => [...h.slice(-10), { cardId: current.id, prevCard: current }]);
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
      setCardIndex(0);
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
        subtitle={queueSubtitle}
        onBack={onBack}
      />

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/*
          The question, and only the question.

          The diagram belongs on the *back*, with the answer. It used to render
          here — above the question, before Show Answer — which handed the
          reader the answer and left "Show Answer" with nothing to reveal but a
          sentence telling them to look at the picture they had already seen.
          A diagram of the answer shown on the front is not a flashcard.
        */}
        <Text style={[styles.cardFront, { color: colors.text }]}>{face.front}</Text>

        {!revealed && face.hint ? (
          <Text style={[styles.hint, { color: colors.textMuted }]}>Hint: {face.hint}</Text>
        ) : null}

        {revealed ? (
          <>
            <View style={[styles.rule, { backgroundColor: colors.border }]} />

            {/* The answer: the diagram, then the words. */}
            {face.imageUrl && !imageFailed ? (
              <Image
                source={{ uri: face.imageUrl }}
                style={styles.cardImage}
                resizeMode="contain"
                // A diagram that will not load has to say so. A grey rectangle
                // looks identical to "this app does not show diagrams", and
                // from inside the app there is no way to tell which it is.
                onError={() => setImageFailed(true)}
                accessibilityLabel={`Diagram: ${face.front}`}
              />
            ) : null}

            {face.back ? (
              <Text style={[styles.cardBack, { color: colors.text }]}>{face.back}</Text>
            ) : null}

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

      {/* Deck & Question Navigation */}
      <View style={styles.navRow}>
        <Touchable
          onPress={onPrevious}
          disabled={!canGoPrevious}
          label="Previous question"
          scaleTo={0.96}
          style={[
            styles.navButton,
            { borderColor: colors.border },
            !canGoPrevious && styles.opacityDisabled,
          ]}>
          <ChevronLeft size={16} color={colors.text} />
          <Text style={[styles.navButtonText, { color: colors.text }]}>Previous</Text>
        </Touchable>

        <Touchable
          onPress={onBack}
          label="Back to all decks"
          scaleTo={0.96}
          style={[styles.navButton, { borderColor: colors.border }]}>
          <Layers size={16} color={colors.textMuted} />
          <Text style={[styles.navButtonText, { color: colors.textMuted }]}>Decks</Text>
        </Touchable>

        <Touchable
          onPress={onNext}
          disabled={!canGoNext}
          label="Next question"
          scaleTo={0.96}
          style={[
            styles.navButton,
            { borderColor: colors.border },
            !canGoNext && styles.opacityDisabled,
          ]}>
          <Text style={[styles.navButtonText, { color: colors.text }]}>Next</Text>
          <ChevronRight size={16} color={colors.text} />
        </Touchable>
      </View>

      {/*
        Only for generated decks. A deck you wrote yourself has nothing to
        regenerate — the button would call the edge function, and on a deck of
        your own cards that is either a failure or, worse, a replacement of
        what you typed with something Gemini made up.
      */}
      {fixture ? null : (
        <Touchable
          onPress={() => load(true)}
          label="Write this deck again"
          hint="Discards these cards and generates new ones"
          style={[styles.retry, { borderColor: colors.border }]}>
          <RotateCw size={16} color={colors.textMuted} />
          <Text style={[styles.retryText, { color: colors.textMuted }]}>Write this deck again</Text>
        </Touchable>
      )}
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
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The card shell without the study card's tall minimum height, which exists
  // so a one-line question does not sit in a sliver.
  compactCard: {
    minHeight: 0,
    justifyContent: 'flex-start',
    gap: 10,
  },
  newRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputBlock: {
    flex: 0,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 14,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 11,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  opacityDisabled: {
    opacity: 0.35,
  },
});
