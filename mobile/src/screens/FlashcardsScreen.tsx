import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  ImagePlus,
  Layers,
  Pencil,
  Plus,
  RotateCw,
  Share2,
  Sparkles,
  Timer as TimerIcon,
  Trash2,
  User,
  X,
} from 'lucide-react-native';
import { Text } from '@/components/Text';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { Touchable } from '@/components/Touchable';
import { BackButton } from '@/components/BackButton';
import { GradientFill } from '@/components/Gradient';
import { typeScale } from '@/theme/typography';
import { EASE, useReducedMotion } from '@/theme/motion';
import { useTheme, withAlpha } from '@/theme';
import { getSubjects, YEAR_LABEL, type BankNode } from '@/lib/questionBank';
import { YEAR_TO_KEY, type Year } from '@/lib/profile';
import { flattenSubjectTopics, type LeafTopic } from '@/lib/handwrittenNotes';
import {
  deleteImportedDeck,
  discardPackage,
  importedDeckKey,
  importPackage,
  loadImportedCards,
  loadImportedDecks,
  MAX_IMPORT_CARDS,
  shareWrittenDeck,
  stagePackage,
  type ImportedDeck,
  type StagedPackage,
} from '@/lib/importedDecks';
import {
  deckTargetFor,
  fetchDeck,
  loadSchedule,
  personalDeckKey,
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
} from '@shared/anki';
import { tick, complete } from '@/lib/haptics';
import { pickCardImage } from '@/lib/cardImage';
import { Slider } from '@/components/Slider';
import { Sheet } from '@/components/Sheet';
import {
  CARD_SECONDS_MAX,
  CARD_SECONDS_STEP,
  DEFAULT_SETTINGS,
  NEW_PER_DAY_MAX,
  NEW_PER_DAY_MIN,
  setSetting,
  useSettings,
} from '@/lib/settings';
import {
  addCard,
  createDeck,
  customDeckKey,
  deleteCard,
  deleteDeck,
  decksForChapter,
  loadCustomDecks,
  setDeckChapter,
  type CustomDeck,
  type DeckChapter,
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
  | { kind: 'importDecks' }
  | { kind: 'studyImported'; deckId: string }
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
      if (
        current.kind === 'subjects' ||
        current.kind === 'myDecks' ||
        current.kind === 'importDecks'
      ) {
        return { kind: 'years' };
      }
      if (current.kind === 'studyImported') {
        return { kind: 'importDecks' };
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
    <KeyboardSafe>
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      keyboardShouldPersistTaps="handled">
      {view.kind === 'years' ? (
        <YearsView
          onPick={year => setView({ kind: 'subjects', year })}
          onMyDecks={() => setView({ kind: 'myDecks' })}
          onImport={() => setView({ kind: 'importDecks' })}
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

      {view.kind === 'importDecks' ? (
        <ImportDecksView
          onBack={back}
          onStudy={deckId => setView({ kind: 'studyImported', deckId })}
        />
      ) : null}

      {view.kind === 'studyImported' ? (
        <ImportedStudyView deckId={view.deckId} onBack={back} />
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
          subjectKey={view.subjectKey}
          topic={view.topic}
          onBack={back}
          onOpenOwn={deckId => setView({ kind: 'studyCustom', deckId })}
          onWriteOwn={deckId => setView({ kind: 'editDeck', deckId })}
        />
      ) : null}
    </ScrollView>
    </KeyboardSafe>
  );
}

function Header({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  /** Trailing action, drawn as the circle the app's headers use elsewhere. */
  right?: React.ReactNode;
}) {
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
      {right}
    </View>
  );
}

/**
 * The circle in the top-right corner.
 *
 * Same shape and size as the theme and settings circles on Home, because it is
 * the same idea in the same place: the one thing you can *do* to what is on
 * screen. `Touchable` already carries the press spring, so there is no motion
 * to write here — a second, hand-rolled press animation on one button is
 * exactly the fork the house style exists to prevent.
 */
function HeaderAction({
  onPress,
  label,
  children,
}: {
  onPress: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Touchable
      onPress={onPress}
      label={label}
      style={[styles.headerAction, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {children}
    </Touchable>
  );
}

function YearsView({
  onPick,
  onMyDecks,
  onImport,
  onBack,
}: {
  onPick: (year: Year) => void;
  onMyDecks: () => void;
  onImport: () => void;
  onBack: () => void;
}) {
  const { colors } = useTheme();
  const { newCardsPerDay, cardSeconds } = useSettings();
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

      {/*
        The daily cap, where the decks are — not buried in Settings.

        The cap is most of what makes spaced repetition work, and it is also the
        single most confusing thing about it: a fifty-card deck that hands out
        twenty reads as a deck that lost thirty. Putting the number next to the
        decks it governs is what turns "why are there only 20?" into a control.
      */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 22 }]}>
        HOW MUCH A DAY
      </Text>
      <View style={[styles.card, styles.compactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/*
          Name on the left, current value on the right, above the track.

          `Slider` draws no text of its own — `format` feeds the accessibility
          value only — so a caller that does not render this row ships a bare
          track with nothing saying what it is set to.
        */}
        <View style={styles.sliderHead}>
          <Text style={[styles.rowTitle, styles.flex, { color: colors.text }]}>New cards</Text>
          <Text style={[styles.sliderValue, { color: colors.accent }]}>
            {newCardsPerDay} a day
          </Text>
        </View>
        <Slider
          value={newCardsPerDay}
          min={NEW_PER_DAY_MIN}
          max={NEW_PER_DAY_MAX}
          step={5}
          detents={[20]}
          onChange={value => setSetting('newCardsPerDay', value)}
          label="New flashcards per day"
          format={value => `${value} new cards a day`}
        />
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {newCardsPerDay === DEFAULT_SETTINGS.newCardsPerDay
            ? "Anki's default. Twenty a day is a habit; a whole chapter in one sitting is an evening that happens once."
            : `Cards you have already started still come back on their own schedule — this only sets how many ${'new'} ones a deck introduces each day.`}
        </Text>
      </View>

      {/*
        Pacing, under the daily limit, because they are the same decision seen
        from two sides: how much in a sitting, and how long each card gets.
      */}
      <View style={[styles.card, styles.compactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.builderRow}>
          <TimerIcon size={16} color={colors.textMuted} />
          <Text style={[styles.rowTitle, styles.flex, { color: colors.text }]}>Time per card</Text>
          <Text
            style={[
              styles.sliderValue,
              { color: cardSeconds === 0 ? colors.textMuted : colors.accent },
            ]}>
            {cardSeconds === 0 ? 'Off' : `${cardSeconds}s`}
          </Text>
        </View>
        <Slider
          value={cardSeconds}
          min={0}
          max={CARD_SECONDS_MAX}
          step={CARD_SECONDS_STEP}
          detents={[0, 30, 60]}
          onChange={value => setSetting('cardSeconds', value)}
          label="Seconds allowed per card"
          format={value => (value === 0 ? 'No timer' : `${value} seconds a card`)}
        />
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {cardSeconds === 0
            ? 'Off. Turn it on in the last fortnight before an exam, when pace is the thing you are practising.'
            : `A bar drains beside each card and turns amber at ${cardSeconds}s. Nothing happens when it does — the card waits. ${newCardsPerDay} cards at ${cardSeconds}s is about ${Math.max(1, Math.round((newCardsPerDay * cardSeconds) / 60))} minutes.`}
        </Text>
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

      {/*
        Under "Decks you write", and shaped like it, because it is the same
        kind of thing: a deck that is yours rather than one this app made. The
        screen behind it explains where an .apkg comes from — that is the part
        people get stuck on, not the tapping.
      */}
      <Touchable
        onPress={onImport}
        label="Import your Anki cards from an apkg file"
        scaleTo={0.97}
        style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.rowIcon, { backgroundColor: withAlpha(colors.fuchsia, 0.15) }]}>
          <FileDown size={18} color={colors.fuchsia} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>Import your Anki cards</Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>
            Open an .apkg deck from Anki or AnkiWeb — it stays on this phone
          </Text>
        </View>
        <ChevronRight size={20} color={colors.textMuted} />
      </Touchable>
    </>
  );
}

/**
 * Importing an Anki package.
 *
 * The tapping is the easy part; **where an .apkg comes from is what people get
 * stuck on**, so the instructions are on the screen rather than in a help page
 * nobody opens. Three routes cover essentially everybody: a deck somebody
 * shared with them, a deck off AnkiWeb, and a deck exported from their own
 * Anki on a computer.
 *
 * Everything here stays on the phone. A shared deck is somebody else's work
 * that the reader downloaded for themselves — uploading it would be this app
 * redistributing it, which is a stronger reason than the one the hand-written
 * decks have, not a weaker one. `npm run check:cloud-ids` enforces it.
 */
function ImportDecksView({
  onBack,
  onStudy,
}: {
  onBack: () => void;
  onStudy: (deckId: string) => void;
}) {
  const { colors } = useTheme();
  const [decks, setDecks] = useState<ImportedDeck[] | null>(null);
  const [staged, setStaged] = useState<StagedPackage | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadImportedDecks().then(setDecks);
  }, []);

  const pick = useCallback(async () => {
    setError(null);
    setBusy('Reading the package…');
    try {
      const next = await stagePackage();
      if (next) {
        setStaged(next);
        // Everything, unless the reader narrows it. A package with one deck in
        // it — which most shared decks are — then needs no choice at all.
        setChosen(new Set(next.decks.map(deck => deck.id)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That file could not be read.');
    } finally {
      setBusy(null);
    }
  }, []);

  const run = useCallback(async () => {
    if (!staged) {
      return;
    }
    setError(null);
    setBusy('Importing…');
    try {
      const deck = await importPackage(staged, {
        deckIds: chosen.size === staged.decks.length ? [] : [...chosen],
        onProgress: progress =>
          setBusy(
            progress.step === 'media'
              ? 'Copying pictures…'
              : progress.step === 'saving'
                ? 'Saving…'
                : 'Reading the cards…',
          ),
      });
      setStaged(null);
      setDecks(await loadImportedDecks());
      onStudy(deck.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That package could not be imported.');
    } finally {
      setBusy(null);
    }
  }, [chosen, onStudy, staged]);

  const cancel = useCallback(() => {
    if (staged) {
      discardPackage(staged);
    }
    setStaged(null);
  }, [staged]);

  const remove = useCallback(async (id: string) => {
    setDecks(await deleteImportedDeck(id));
  }, []);

  const chosenCards = staged
    ? staged.decks.filter(deck => chosen.has(deck.id)).reduce((sum, deck) => sum + deck.cards, 0)
    : 0;

  return (
    <>
      <Header
        title="Import your Anki cards"
        subtitle="Kept on this phone only"
        onBack={onBack}
      />

      {error ? (
        <View style={[styles.notice, { borderColor: withAlpha(colors.danger, 0.4) }]}>
          <Text style={[styles.noticeText, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : null}

      {staged ? (
        <View
          style={[
            styles.card,
            styles.compactCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{staged.fileName}</Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>
            {staged.totalCards} cards in {staged.decks.length}{' '}
            {staged.decks.length === 1 ? 'deck' : 'decks'}
          </Text>

          {/* Which decks to take. A package can hold thirty chapters and the
              reader usually wants one; taking all of them is how a phone ends
              up with thirty thousand cards it will never see. */}
          {staged.decks.length > 1
            ? staged.decks.map(deck => {
                const on = chosen.has(deck.id);
                return (
                  <Touchable
                    key={deck.id}
                    onPress={() =>
                      setChosen(previous => {
                        const next = new Set(previous);
                        if (next.has(deck.id)) {
                          next.delete(deck.id);
                        } else {
                          next.add(deck.id);
                        }
                        return next;
                      })
                    }
                    label={`${deck.name}, ${deck.cards} cards`}
                    state={{ checked: on }}
                    scaleTo={0.97}
                    style={[
                      styles.row,
                      {
                        backgroundColor: on ? withAlpha(colors.accent, 0.12) : colors.cardElevated,
                        borderColor: on ? colors.accent : colors.border,
                      },
                    ]}>
                    <View style={styles.flex}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>{deck.name}</Text>
                      <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                        {deck.cards} cards
                      </Text>
                    </View>
                  </Touchable>
                );
              })
            : null}

          {chosenCards > MAX_IMPORT_CARDS ? (
            <Text style={[styles.hint, { color: colors.warning }]}>
              That is {chosenCards} cards. The first {MAX_IMPORT_CARDS} will be imported — pick
              fewer decks to choose which.
            </Text>
          ) : null}

          <View style={styles.newRow}>
            <Touchable
              onPress={cancel}
              label="Cancel this import"
              scaleTo={0.95}
              style={[styles.reveal, styles.flex, { borderWidth: 1, borderColor: colors.border }]}>
              <Text style={[styles.revealText, { color: colors.textMuted }]}>Cancel</Text>
            </Touchable>
            <Touchable
              onPress={run}
              label={`Import ${Math.min(chosenCards, MAX_IMPORT_CARDS)} cards`}
              disabled={chosenCards === 0 || busy !== null}
              scaleTo={0.95}
              style={[styles.reveal, styles.flex, { backgroundColor: colors.primary }]}>
              <Text style={[styles.revealText, { color: colors.primaryText }]}>
                {busy ?? `Import ${Math.min(chosenCards, MAX_IMPORT_CARDS)} cards`}
              </Text>
            </Touchable>
          </View>
        </View>
      ) : (
        <>
          <Touchable
            onPress={pick}
            label="Choose an apkg file to import"
            disabled={busy !== null}
            scaleTo={0.97}
            style={[styles.row, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
            <View style={[styles.rowIcon, { backgroundColor: withAlpha(colors.primaryText, 0.2) }]}>
              <Download size={18} color={colors.primaryText} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.rowTitle, { color: colors.primaryText }]}>
                {busy ?? 'Choose an .apkg file'}
              </Text>
              <Text style={[styles.rowSub, { color: withAlpha(colors.primaryText, 0.75) }]}>
                Your files, Downloads, Drive — wherever you saved it
              </Text>
            </View>
          </Touchable>

          {/*
            The part people actually get stuck on. Written as three routes
            rather than one, because "download a deck" means something
            different depending on where the reader is starting from.
          */}
          <View
            style={[
              styles.card,
              styles.compactCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Where do I get an .apkg?
            </Text>

            <Text style={[styles.rowSub, { color: colors.textMuted, marginTop: 8 }]}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>From AnkiWeb. </Text>
              Open ankiweb.net/shared/decks in your browser, search for the subject, and press
              Download. The file lands in your Downloads folder — come back here and choose it.
            </Text>

            <Text style={[styles.rowSub, { color: colors.textMuted, marginTop: 10 }]}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>From a friend. </Text>
              A deck sent on WhatsApp or Telegram saves like any other file. Tap it once to
              download it, then choose it here — you do not need to open it in anything first.
            </Text>

            <Text style={[styles.rowSub, { color: colors.textMuted, marginTop: 10 }]}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>From your own Anki. </Text>
              On a computer: right-click the deck, Export, choose{' '}
              <Text style={{ color: colors.text }}>Anki Deck Package (*.apkg)</Text>, and tick
              Include media if it has pictures. Scheduling is not needed — this app keeps its own.
            </Text>

            <Text style={[styles.hint, { color: colors.textMuted, marginTop: 12 }]}>
              Both the old and the new package formats work, with or without media. Cloze
              deletions, reversed cards and pictures all come across. What does not is the
              styling: cards are shown as text here rather than as web pages, so a deck's own
              fonts and colours are not kept.
            </Text>

            {/*
              Said once, where the name is actually used.

              This app reads and writes Anki's file format so decks can move
              between the two — that is interoperability, and saying so is
              allowed. What is not allowed is looking like Anki's product or
              like something Anki endorsed, and the difference between those
              two is a sentence.
            */}
            <Text style={[styles.hint, { color: colors.textMuted, marginTop: 12 }]}>
              Anki is a trademark of Ankitects Pty Ltd. Orbit is not affiliated with, endorsed
              by or supported by Ankitects — it reads and writes the .apkg format so your decks
              can move between the two.
            </Text>
          </View>
        </>
      )}

      {/* What has already been imported. */}
      {decks === null ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : decks.length === 0 ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Nothing imported yet. Decks you bring in appear here, and stay on this phone.
        </Text>
      ) : (
        <>
          <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 18 }]}>
            IMPORTED DECKS
          </Text>
          {decks.map(deck => (
            <View
              key={deck.id}
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Touchable
                onPress={() => onStudy(deck.id)}
                label={`Study ${deck.name}, ${deck.cardCount} cards`}
                scaleTo={0.98}
                style={styles.flex}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{deck.name}</Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                  {deck.cardCount} cards
                  {deck.mediaCount > 0
                    ? ` · ${deck.mediaCount} pictures · ${Math.max(1, Math.round(deck.mediaBytes / 1e6))} MB`
                    : ''}
                  {deck.truncated ? ' · part of a larger package' : ''}
                </Text>
              </Touchable>
              <Touchable
                onPress={() => remove(deck.id)}
                label={`Delete ${deck.name}`}
                hitSlop={8}
                scaleTo={0.9}
                style={styles.iconButton}>
                <Trash2 size={16} color={colors.danger} />
              </Touchable>
            </View>
          ))}
        </>
      )}
    </>
  );
}

/** An imported deck, studied through the same scheduler as everything else. */
function ImportedStudyView({ deckId, onBack }: { deckId: string; onBack: () => void }) {
  const [deck, setDeck] = useState<ImportedDeck | null>(null);
  const [cards, setCards] = useState<DeckCard[] | null>(null);

  useEffect(() => {
    loadImportedDecks().then(all => setDeck(all.find(d => d.id === deckId) ?? null));
    loadImportedCards(deckId).then(setCards);
  }, [deckId]);

  if (!deck || cards === null) {
    return <Header title="Imported deck" onBack={onBack} />;
  }
  /*
   * The same StudyView, with the cards handed in — the route a deck you wrote
   * already takes. A second study screen would be a second place for the
   * scheduler to drift, and `importedDeckKey` namespaces the schedule so an
   * imported deck can never read another deck's history.
   */
  return (
    <StudyView
      year="first"
      subjectName={deck.name}
      topic={{
        key: importedDeckKey(deckId),
        name: deck.name,
        breadcrumb: deck.source,
        questions: [],
      }}
      fixture={cards}
      onBack={onBack}
    />
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
    // The keyboard is up and the button is under it. Same trap as Add card:
    // the tap is spent dismissing rather than pressing.
    Keyboard.dismiss();
    const deck = await createDeck(trimmed);
    setName('');
    setDecks(await loadCustomDecks());
    onEdit(deck.id);
  }, [name, onEdit]);

  const remove = useCallback(async (id: string) => {
    setDecks(await deleteDeck(id));
  }, []);

  /*
   * Writing the file takes a moment on a big deck, so the button reports it
   * rather than looking like it did nothing until the chooser appears.
   */
  const [sharing, setSharing] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const share = useCallback(async (deck: CustomDeck) => {
    setShareError(null);
    setSharing(deck.id);
    try {
      await shareWrittenDeck(deck);
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'That deck could not be shared.');
    } finally {
      setSharing(null);
    }
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
                {/* A filed deck still lives here too, and says where else it
                    appears — otherwise filing it looks like losing it. */}
                {deck.chapter ? ` · ${deck.chapter.topicName}` : ''}
              </Text>
            </Touchable>
            <Touchable
              onPress={() => onEdit(deck.id)}
              label={`Edit ${deck.name}`}
              style={[styles.iconButton, { borderColor: colors.border, borderWidth: 1 }]}>
              <Plus size={16} color={colors.textMuted} />
            </Touchable>
            {/*
              Sharing sits on the deck rather than on a screen of its own,
              because it is a thing you do *to one deck* and this row is the
              only place all of them are listed. It is hidden while the deck is
              empty: an .apkg of nothing is a file that wastes somebody's time
              twice, once sending it and once opening it.
            */}
            {deck.cards.length > 0 ? (
              <Touchable
                onPress={() => share(deck)}
                label={`Share ${deck.name} as an Anki file`}
                hint="Makes an .apkg your friend can open in Anki or in Orbit"
                disabled={sharing !== null}
                style={[styles.iconButton, { borderColor: colors.border, borderWidth: 1 }]}>
                <Share2
                  size={16}
                  color={sharing === deck.id ? colors.textMuted : colors.accent}
                />
              </Touchable>
            ) : null}
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

      {shareError ? (
        <View style={[styles.notice, { borderColor: withAlpha(colors.danger, 0.4) }]}>
          <Text style={[styles.noticeText, { color: colors.danger }]}>{shareError}</Text>
        </View>
      ) : null}

      {/*
        What the share button actually does, next to the button rather than in
        a help page. "Export as .apkg" means nothing to somebody who has never
        used Anki, and the useful facts are short: what the file is, who can
        open it, and that it is a copy rather than a link.
      */}
      {decks !== null && decks.some(deck => deck.cards.length > 0) ? (
        <View
          style={[
            styles.card,
            styles.compactCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            Sharing a deck with a friend
          </Text>
          <Text style={[styles.rowSub, { color: colors.textMuted, marginTop: 6 }]}>
            The share button on a deck makes an <Text style={{ color: colors.text }}>.apkg</Text>{' '}
            file — the same format Anki uses — and hands it to WhatsApp, Telegram, Gmail or
            anything else on your phone. Pictures on your cards go inside the file, so nothing
            breaks at the other end.
          </Text>
          <Text style={[styles.rowSub, { color: colors.textMuted, marginTop: 10 }]}>
            Whoever gets it can open it in <Text style={{ color: colors.text }}>Anki</Text> on any
            phone or computer, or bring it into Orbit through{' '}
            <Text style={{ color: colors.text }}>Import your Anki cards</Text>. They do not need
            this app and they do not need an account.
          </Text>
          <Text style={[styles.hint, { color: colors.textMuted, marginTop: 10 }]}>
            It sends a copy. Editing your deck afterwards does not change the file they already
            have — send it again to give them the new version.
          </Text>
        </View>
      ) : null}
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
  const [image, setImage] = useState<string | null>(null);
  const [filingOpen, setFilingOpen] = useState(false);

  useEffect(() => {
    loadCustomDecks().then(setDecks);
  }, []);

  const deck = decks?.find(d => d.id === deckId) ?? null;

  const attach = useCallback(async () => {
    setError(null);
    const picked = await pickCardImage();
    if (!picked) {
      return;
    }
    if ('tooLarge' in picked) {
      setError('That picture is too big to keep on the phone. Crop it, or pick a smaller one.');
      return;
    }
    setImage(picked.uri);
    tick();
  }, []);

  const add = useCallback(async () => {
    /*
     * A visual card answers with its picture, so it does not need a written
     * back — the same rule the generated decks follow. A written one does.
     */
    if (!front.trim() || (!back.trim() && !image)) {
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
      setDecks(await addCard(deckId, front, back, image ?? undefined));
      setFront('');
      setBack('');
      setImage(null);
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
  }, [back, deckId, front, image]);

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

      {/*
        Where this deck lives.
        
        A deck about mechanical injuries is more use filed under mechanical
        injuries than in a flat list that grows for ever — but a deck of
        odds and ends is not, so it is a choice rather than a rule. Moving it
        changes nothing about the cards or the schedule: filing is a property
        of the deck, which is why `customDeckKey(id)` still finds its history.
      */}
      <Touchable
        onPress={() => setFilingOpen(true)}
        label={
          deck.chapter
            ? `Filed under ${deck.chapter.topicName}. Change where this deck is kept.`
            : 'Kept in My decks. Change where this deck is kept.'
        }
        style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.rowIcon, { backgroundColor: withAlpha(colors.violet, 0.15) }]}>
          <Layers size={18} color={colors.violet} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            {deck.chapter ? deck.chapter.topicName : 'My decks'}
          </Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>
            {deck.chapter
              ? `${deck.chapter.subjectName} · tap to move it`
              : 'Not filed under a chapter · tap to file it'}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
      </Touchable>

      <FilingSheet
        visible={filingOpen}
        deck={deck}
        onClose={() => setFilingOpen(false)}
        onPick={async chapter => {
          setDecks(await setDeckChapter(deckId, chapter));
          setFilingOpen(false);
          tick();
        }}
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
        {/*
          The picture, if there is one.

          It previews at a readable size rather than as a thumbnail: the whole
          reason to attach a diagram is that its labels matter, and a 40dp
          square cannot tell you whether you picked the right screenshot.
        */}
        {image ? (
          <View style={styles.attached}>
            <Image source={{ uri: image }} style={styles.attachedImage} resizeMode="contain" />
            <Touchable
              onPress={() => setImage(null)}
              label="Remove the attached picture"
              style={[styles.attachedRemove, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <X size={14} color={colors.danger} />
            </Touchable>
          </View>
        ) : null}

        <View style={styles.builderRow}>
          <Touchable
            onPress={attach}
            label={image ? 'Replace the attached picture' : 'Add a picture to this card'}
            style={[styles.attachButton, { borderColor: colors.border }]}>
            <ImagePlus size={16} color={colors.accent} />
            <Text style={[styles.attachText, { color: colors.accent }]}>
              {image ? 'Replace picture' : 'Add picture'}
            </Text>
          </Touchable>

          <Touchable
            onPress={add}
            label="Add this card"
            disabled={!front.trim() || (!back.trim() && !image)}
            style={[styles.reveal, styles.flex, { backgroundColor: colors.primary }]}>
            <Text style={[styles.revealText, { color: colors.primaryText }]}>Add card</Text>
          </Touchable>
        </View>
        {/* One fact per card is the rule Anki is built around, so it is said
            where the card is written rather than in a help page nobody opens. */}
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          One fact per card. If the answer needs a paragraph, it is two cards. A card with a
          picture can leave the answer blank — the diagram is the answer.
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
          {card.imageUrl ? (
            <Image source={{ uri: card.imageUrl }} style={styles.rowThumb} resizeMode="cover" />
          ) : null}
          <View style={styles.flex}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>{card.front}</Text>
            <Text style={[styles.rowSub, { color: colors.textMuted }]}>
              {card.back || (card.imageUrl ? 'Answered by the picture' : '')}
            </Text>
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
/**
 * Choosing where a hand-written deck is filed.
 *
 * Three steps deep — year, subject, chapter — inside one Sheet rather than
 * three screens, because filing a deck is a detour from writing it and a detour
 * that pushes three screens onto the stack is one nobody takes twice. The Sheet
 * scrolls, so a subject with forty chapters is a scroll rather than a crop.
 */
function FilingSheet({
  visible,
  deck,
  onClose,
  onPick,
}: {
  visible: boolean;
  deck: CustomDeck;
  onClose: () => void;
  onPick: (chapter: DeckChapter | undefined) => void;
}) {
  const { colors } = useTheme();
  const [year, setYear] = useState<Year | null>(null);
  const [subject, setSubject] = useState<{ key: string; name: string; node: BankNode } | null>(null);

  // Reopening starts at the top. Landing back inside the chapter list of a
  // subject chosen a week ago is disorientation, not a shortcut.
  useEffect(() => {
    if (visible) {
      setYear(null);
      setSubject(null);
    }
  }, [visible]);

  const subjects = useMemo(
    () => (year ? getSubjects(YEAR_TO_KEY[year]) : []),
    [year],
  );
  const topics = useMemo(
    () => (subject ? flattenSubjectTopics(subject.key, subject.node) : []),
    [subject],
  );

  const title = subject ? subject.name : year ? YEAR_LABEL[YEAR_TO_KEY[year]] : 'Keep this deck in';

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title}
      headerRight={
        subject || year ? (
          <Touchable
            onPress={() => (subject ? setSubject(null) : setYear(null))}
            label="Back one step"
            style={styles.sheetBack}>
            <ChevronLeft size={18} color={colors.accent} />
          </Touchable>
        ) : undefined
      }>
      {!year ? (
        <>
          <Touchable
            onPress={() => onPick(undefined)}
            label="Keep this deck in My decks, not filed under a chapter"
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: withAlpha(colors.accent, 0.15) }]}>
              <User size={18} color={colors.accent} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>My decks</Text>
              <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                {deck.chapter ? 'Move it out of its chapter' : 'Where it is now'}
              </Text>
            </View>
          </Touchable>

          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>OR FILE IT UNDER</Text>
          {YEARS.map(y => (
            <Touchable
              key={y}
              onPress={() => setYear(y)}
              label={`${YEAR_LABEL[YEAR_TO_KEY[y]]}, choose a subject`}
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.rowEmoji}>{YEAR_EMOJI[y]}</Text>
              <View style={styles.flex}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  {YEAR_LABEL[YEAR_TO_KEY[y]]}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </Touchable>
          ))}
        </>
      ) : !subject ? (
        subjects.map(item => (
          <Touchable
            key={item.key}
            onPress={() => setSubject({ key: item.key, name: item.name, node: item.node })}
            label={`${item.name}, choose a chapter`}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.flex}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{item.name}</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </Touchable>
        ))
      ) : (
        topics.map(topic => (
          <Touchable
            key={topic.key}
            onPress={() =>
              onPick({
                year: year,
                subjectKey: subject.key,
                subjectName: subject.name,
                topicKey: topic.key,
                topicName: topic.name,
              })
            }
            label={`File this deck under ${topic.name}`}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.flex}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{topic.name}</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </Touchable>
        ))
      )}
    </Sheet>
  );
}

/**
 * The per-card clock.
 *
 * Purpose: state indication — how long you have been sitting on this card. It
 * is a bar rather than a number because the number is not the point; the point
 * is "am I dwelling", which is a shape you read without looking at it.
 *
 * Motion: `scaleX` on a transform with `transformOrigin: 'left'`, driven by one
 * `Animated.timing` per card at `EASE.linear`. Linear is the correct curve for
 * exactly one thing and this is it — constant motion, where any easing would be
 * a clock that lies. Never an animated `width`: that is layout, paint and
 * composite every frame on the JS thread, which is the house rule for every
 * other bar in this app.
 *
 * **Nothing happens when it runs out.** It turns amber and stops. Auto-advancing
 * is the obvious next feature and it is wrong: spaced repetition only works if
 * the grade is honest, and a card that flips itself has graded for you.
 */
function CardClock({ seconds, resetKey }: { seconds: number; resetKey: string }) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const [spent, setSpent] = useState(false);

  useEffect(() => {
    setSpent(false);
    progress.setValue(0);
    const run = Animated.timing(progress, {
      toValue: 1,
      duration: seconds * 1000,
      easing: EASE.linear,
      useNativeDriver: true,
    });
    run.start(({ finished }) => {
      if (finished) {
        setSpent(true);
      }
    });
    return () => run.stop();
    // `resetKey` is the card: a new card restarts the clock, and grading the
    // same card twice must not.
  }, [progress, resetKey, seconds]);

  /*
   * Under reduced motion the bar does not sweep — a continuously moving element
   * is the thing that setting exists to remove. It still reports the outcome by
   * colour, which is information rather than movement.
   */
  const scaleX = reduceMotion
    ? 1
    : progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View
      style={[styles.clockTrack, { backgroundColor: withAlpha(colors.text, 0.08) }]}
      accessibilityLabel={
        spent ? `Your ${seconds} second pace for this card is up` : `Pacing: ${seconds} seconds a card`
      }>
      <Animated.View
        style={[
          styles.clockFill,
          {
            backgroundColor: spent ? colors.warning : colors.accent,
            transform: [{ scaleX }],
          },
        ]}
      />
    </View>
  );
}

/**
 * What the "+" on a chapter offers.
 *
 * A Sheet, not a popover or a Dialog. Dialog is for either/or — confirm or
 * cancel — and this is a menu of two things you might do plus leaving; and the
 * Sheet already carries the drag-to-dismiss, the velocity handoff and the
 * reduced-motion path, so choosing anything else here would mean rebuilding
 * three solved problems to get one worse result.
 */
function ChapterAddSheet({
  visible,
  onClose,
  onGenerate,
  onWrite,
  busy,
}: {
  visible: boolean;
  onClose: () => void;
  onGenerate: () => void;
  onWrite: () => void;
  busy: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title="Add to this chapter">
      <Touchable
        onPress={onGenerate}
        disabled={busy}
        label="Generate another deck for this chapter with AI, kept on this phone"
        style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.rowIcon, { backgroundColor: withAlpha(colors.fuchsia, 0.15) }]}>
          {busy ? (
            <ActivityIndicator size="small" color={colors.fuchsia} />
          ) : (
            <Sparkles size={18} color={colors.fuchsia} />
          )}
        </View>
        <View style={styles.flex}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            {busy ? 'Writing a deck…' : 'Generate a deck with AI'}
          </Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>
            A fresh set of cards from this chapter&apos;s questions. Yours alone — it stays on this
            phone and is not uploaded.
          </Text>
        </View>
      </Touchable>

      <Touchable
        onPress={onWrite}
        disabled={busy}
        label="Write your own deck for this chapter"
        style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.rowIcon, { backgroundColor: withAlpha(colors.accent, 0.15) }]}>
          <Pencil size={18} color={colors.accent} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>Write your own deck</Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>
            Type the cards yourself, and add photos of diagrams from your phone.
          </Text>
        </View>
      </Touchable>
    </Sheet>
  );
}

export function StudyView({
  year,
  subjectName,
  subjectKey,
  topic,
  onBack,
  onOpenOwn,
  onWriteOwn,
  fixture,
}: {
  year: Year;
  subjectName: string;
  subjectKey?: string;
  topic: LeafTopic;
  onBack: () => void;
  /** Opens a deck this reader made for this chapter. */
  onOpenOwn?: (deckId: string) => void;
  /** Starts writing one. */
  onWriteOwn?: (deckId: string) => void;
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
  const { newCardsPerDay, cardSeconds } = useSettings();

  // The "+" in the corner, and what it is doing.
  const [addOpen, setAddOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const chapter = useMemo(
    () => ({
      year,
      subjectKey: subjectKey ?? subjectName,
      subjectName,
      topicKey: topic.key,
      topicName: topic.name,
    }),
    [subjectKey, subjectName, topic.key, topic.name, year],
  );

  /**
   * Build one more deck for this chapter, for this phone only.
   *
   * `personalDeckKey` is what keeps it off everyone else's: the server caches
   * on the subtopic key, so asking under the chapter's own key would replace
   * the shared deck and reset every reader's schedule with it. `noCache` says
   * the same thing to a server new enough to understand it.
   */
  const generateOwn = useCallback(async () => {
    setGenerating(true);
    setAddError(null);
    try {
      const built = await fetchDeck({
        year: yearLabel,
        subject: subjectName,
        subtopicKey: personalDeckKey(subtopicKey),
        subtopicName: topic.name,
        questions: topic.questions,
        regenerate: true,
        noCache: true,
      });
      const made = await createDeck(`${topic.name} — your AI deck`, {
        chapter,
        source: 'ai',
        cards: built.cards,
      });
      setAddOpen(false);
      complete();
      onOpenOwn?.(made.id);
    } catch (err) {
      setAddError((err as Error)?.message ?? 'Could not build that deck.');
    } finally {
      setGenerating(false);
    }
  }, [chapter, onOpenOwn, subjectName, subtopicKey, topic.name, topic.questions, yearLabel]);

  const writeOwn = useCallback(async () => {
    const made = await createDeck(`${topic.name} — your deck`, { chapter, source: 'hand' });
    setAddOpen(false);
    onWriteOwn?.(made.id);
  }, [chapter, onWriteOwn, topic.name]);

  const addAction = onOpenOwn ? (
    <HeaderAction onPress={() => setAddOpen(true)} label="Add a deck to this chapter">
      <Plus size={20} color={colors.accent} />
    </HeaderAction>
  ) : undefined;

  /**
   * The decks this reader made for this chapter.
   *
   * Without this list, a generated deck is reachable exactly once — at the
   * moment it is created — and then only from My decks, which is not where
   * anyone would look for it. Reloaded whenever the sheet closes, since that is
   * when one may have been added.
   */
  const [ownDecks, setOwnDecks] = useState<CustomDeck[]>([]);
  useEffect(() => {
    if (addOpen) {
      return;
    }
    let alive = true;
    loadCustomDecks().then(all => {
      if (alive) {
        setOwnDecks(decksForChapter(all, topic.key));
      }
    });
    return () => {
      alive = false;
    };
  }, [addOpen, topic.key]);

  const ownDeckList =
    ownDecks.length > 0 && onOpenOwn ? (
      <>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>YOUR DECKS HERE</Text>
        {ownDecks.map(own => (
          <Touchable
            key={own.id}
            onPress={() => (own.cards.length > 0 ? onOpenOwn(own.id) : onWriteOwn?.(own.id))}
            label={`${own.name}, ${own.cards.length} cards, ${
              own.cards.length > 0 ? 'study' : 'add cards'
            }`}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View
              style={[
                styles.rowIcon,
                {
                  backgroundColor: withAlpha(
                    own.source === 'ai' ? colors.fuchsia : colors.accent,
                    0.15,
                  ),
                },
              ]}>
              {own.source === 'ai' ? (
                <Sparkles size={16} color={colors.fuchsia} />
              ) : (
                <Pencil size={16} color={colors.accent} />
              )}
            </View>
            <View style={styles.flex}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{own.name}</Text>
              <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                {own.cards.length === 0
                  ? 'No cards yet — tap to add some'
                  : `${own.cards.length} card${own.cards.length === 1 ? '' : 's'} · on this phone`}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </Touchable>
        ))}
      </>
    ) : null;

  const addSheet = (
    <ChapterAddSheet
      visible={addOpen}
      onClose={() => setAddOpen(false)}
      onGenerate={generateOwn}
      onWrite={writeOwn}
      busy={generating}
    />
  );

  const queue = useMemo(() => dueQueue(cards, Date.now(), newCardsPerDay), [cards, newCardsPerDay]);
  const tally = useMemo(() => counts(cards, Date.now(), newCardsPerDay), [cards, newCardsPerDay]);
  /**
   * The three counts, plus what is being held back.
   *
   * `dueQueue` serves at most `settings.newCardsPerDay` new cards a day —
   * Anki's default of 20 unless the reader has moved it on the Flashcards
   * screen. The cap is the whole point of spaced repetition, but a 50-card
   * deck that says "20 new" reads as a deck that lost 30. Saying where they
   * went is the difference between a limit and a bug.
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
        <Header title={topic.name} onBack={onBack} right={addAction} />
        {addSheet}
        {ownDeckList}
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
        <Header
          title={topic.name}
          subtitle={`${deck?.length ?? 0} cards`}
          onBack={onBack}
          right={addAction}
        />
        {addSheet}
        {ownDeckList}
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
        right={addAction}
      />
      {addSheet}
      {addError ? (
        <View style={[styles.notice, { borderColor: withAlpha(colors.danger, 0.4) }]}>
          <Text style={[styles.noticeText, { color: colors.danger }]}>{addError}</Text>
        </View>
      ) : null}

      {/*
        The clock sits above the card, not on it: it is about the sitting, not
        about this question, and a bar drawn inside the card would read as part
        of the answer.
      */}
      {cardSeconds > 0 ? <CardClock seconds={cardSeconds} resetKey={current.id} /> : null}

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

        {/*
          Pictures on the question side, which only an imported Anki card has.

          The rule above — a diagram belongs on the back — is about *our* image
          cards, where the diagram is the answer. An imported card is somebody
          else's, its front is whatever they wrote, and an ECG strip above
          "identify this rhythm" is the question rather than the answer to it.
          Hiding it leaves a card asking about a picture that is not there.
        */}
        {(face.frontImages ?? []).map(uri => (
          <Image
            key={uri}
            source={{ uri }}
            style={styles.cardImage}
            resizeMode="contain"
            accessibilityLabel={`Picture on this card: ${face.front.slice(0, 60)}`}
          />
        ))}

        {!revealed && face.hint ? (
          <Text style={[styles.hint, { color: colors.textMuted }]}>Hint: {face.hint}</Text>
        ) : null}

        {revealed ? (
          <>
            <View style={[styles.rule, { backgroundColor: colors.border }]} />

            {/* The answer: the diagram, then the words. */}
            {/*
              `backImages` when the card has them and `imageUrl` otherwise, so
              a generated or hand-written card is unaffected and an imported
              one can answer with more than one picture — Anki cards routinely
              do, and taking only the first would silently drop the rest.
            */}
            {(face.backImages ?? (face.imageUrl ? [face.imageUrl] : [])).map(uri =>
              imageFailed ? null : (
                <Image
                  key={uri}
                  source={{ uri }}
                  style={styles.cardImage}
                  resizeMode="contain"
                  // A diagram that will not load has to say so. A grey
                  // rectangle looks identical to "this app does not show
                  // diagrams", and from inside the app there is no way to
                  // tell which it is.
                  onError={() => setImageFailed(true)}
                  accessibilityLabel={`Diagram: ${face.front}`}
                />
              ),
            )}

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
      {ownDeckList}

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
  sheetBack: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEmoji: {
    fontSize: 22,
  },
  sliderHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderValue: {
    fontSize: typeScale.footnote.fontSize,
    fontWeight: '800',
  },
  builderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  attachText: {
    fontSize: typeScale.footnote.fontSize,
    fontWeight: '700',
  },
  attached: {
    marginBottom: 10,
  },
  attachedImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  attachedRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  clockTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  clockFill: {
    height: 3,
    width: '100%',
    borderRadius: 2,
    // Shrinks from the left edge, so the bar drains rather than slides.
    transformOrigin: 'left',
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
