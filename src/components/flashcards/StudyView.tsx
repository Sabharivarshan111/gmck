import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { YEAR_LABELS, type Year } from "@/lib/year-subjects";
import { diagramSubtopicKey, type LeafTopic } from "@/lib/leaf-topics";
import PathwayFlow from "@/components/flashcards/PathwayFlow";
import { CARD_MODE_LABEL, normalizePathway } from "@/lib/pathwayCards";
import {
  answer,
  counts,
  dueQueue,
  fetchDeck,
  GRADES,
  intervalLabel,
  isLeech,
  loadSchedule,
  reconcile,
  saveSchedule,
  type Card,
  type DeckCard,
  type Grade,
  type Schedule,
} from "@/lib/flashcards";

const GRADE_LABEL: Record<Grade, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

/** Anki's colour language: red to green, left to right. */
const GRADE_CLASS: Record<Grade, string> = {
  again: "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400",
  hard: "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  good: "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  easy: "border-sky-500/50 bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

/**
 * One sitting.
 *
 * The card is face-down until the reader says they have tried to recall it —
 * that is the whole mechanism, and showing the answer alongside the question
 * turns a memory test into reading. Anki calls the step "Show Answer" and so
 * does this.
 */
export default function StudyView({
  year,
  subjectName,
  topic,
  newPerDay,
  onBack,
}: {
  year: Year;
  subjectName: string;
  topic: LeafTopic;
  /**
   * The daily new-card cap, owned by the hub so the slider there and the queue
   * here are one number rather than two that drift apart mid-session.
   */
  newPerDay: number;
  onBack: () => void;
}) {
  const [deck, setDeck] = useState<DeckCard[] | null>(null);
  const [deckKey, setDeckKey] = useState("");
  const [schedule, setSchedule] = useState<Schedule>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const yearLabel = YEAR_LABELS[year];
  const subtopicKey = useMemo(() => diagramSubtopicKey(topic.key), [topic.key]);

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
        setDeck(built.cards);
        setDeckKey(built.deckKey);
        setSchedule(loadSchedule(built.deckKey));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [subjectName, subtopicKey, topic.name, topic.questions, yearLabel]
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const cards = useMemo<Card[]>(
    () => (deck ? reconcile(deck, schedule) : []),
    [deck, schedule]
  );

  const queue = useMemo(() => dueQueue(cards, Date.now(), newPerDay), [cards, newPerDay]);
  const tally = useMemo(() => counts(cards, Date.now(), newPerDay), [cards, newPerDay]);

  /**
   * The three counts, plus what is being held back.
   *
   * `dueQueue` serves at most `newPerDay` new cards a day. The cap is the whole
   * point of spaced repetition, but a 50-card deck that says "20 new" reads as
   * a deck that lost 30. Saying where they went is the difference between a
   * limit and a bug.
   */
  const heldBack = cards.filter((c) => c.type === "new").length - tally.fresh;
  const queueSubtitle = useMemo(() => {
    const parts = [
      `${tally.fresh} new`,
      `${tally.learning} learning`,
      `${tally.review} to review`,
    ];
    return heldBack > 0
      ? `${parts.join(" · ")}  ·  ${heldBack} more tomorrow`
      : parts.join(" · ");
  }, [heldBack, tally.fresh, tally.learning, tally.review]);

  const [cardIndex, setCardIndex] = useState(0);
  const [history, setHistory] = useState<Array<{ cardId: string; prevCard: Card }>>([]);

  const safeIndex = queue.length > 0 ? Math.min(cardIndex, queue.length - 1) : 0;
  const current = queue[safeIndex];
  const face = useMemo(
    () => (current && deck ? deck.find((c) => c.id === current.id) ?? null : null),
    [current, deck]
  );

  const canGoNext = queue.length > 1;
  const canGoPrevious = safeIndex > 0 || history.length > 0;

  const onNext = useCallback(() => {
    if (queue.length <= 1) return;
    setCardIndex((i) => (i + 1) % queue.length);
    setRevealed(false);
    setImageFailed(false);
  }, [queue.length]);

  const onPrevious = useCallback(() => {
    if (safeIndex > 0) {
      setCardIndex((i) => i - 1);
      setRevealed(false);
      setImageFailed(false);
      return;
    }
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setSchedule((prev) => {
      const updated = { ...prev, [last.cardId]: last.prevCard };
      saveSchedule(deckKey, updated);
      return updated;
    });
    setRevealed(false);
    setImageFailed(false);
  }, [safeIndex, deckKey, history]);

  const onGrade = useCallback(
    (grade: Grade) => {
      if (!current) return;
      setHistory((h) => [...h.slice(-10), { cardId: current.id, prevCard: current }]);
      const next = answer(current, grade);
      setSchedule((previous) => {
        const updated = { ...previous, [next.id]: next };
        saveSchedule(deckKey, updated);
        return updated;
      });
      setRevealed(false);
      setImageFailed(false);
      setCardIndex(0);
    },
    [current, deckKey]
  );

  const header = (subtitle?: string) => (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to chapters">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-0">
        <p className="font-bold truncate">{topic.name}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {header("Building this deck…")}
        <div className="rounded-2xl border bg-card p-8 text-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            The first person to open a chapter waits while its cards are written. After that it
            is instant for everyone.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {header()}
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
        <Button variant="outline" className="w-full" onClick={() => load(false)}>
          <RotateCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      </div>
    );
  }

  if (!current || !face) {
    return (
      <div className="space-y-4">
        {header(`${deck?.length ?? 0} cards`)}
        <div className="rounded-2xl border bg-card p-8 text-center space-y-2">
          <p className="font-bold">Nothing due right now</p>
          <p className="text-sm text-muted-foreground">
            Every card in this chapter is scheduled for later. Come back when one falls due —
            that gap is the part that makes it stick.
          </p>
        </div>
      </div>
    );
  }

  const backImages = face.backImages ?? (face.imageUrl ? [face.imageUrl] : []);

  return (
    <div className="space-y-4">
      {header(queueSubtitle)}

      <div className="rounded-2xl border bg-card p-5 space-y-3">
        {/*
          The question, and only the question. The diagram belongs on the back
          with the answer: a diagram of the answer shown on the front is not a
          flashcard, it is the answer.
        */}
        {/*
          What the card is asking for, before the question.

          A first-year paper mixes three acts of recall — a fact, a claim to
          justify, a vignette to work through — and knowing which is coming is
          the difference between reading the question twice and reading it once.
          It is a field on the card, set by the server; a deck built before that
          field existed has no chip and looks exactly as it always did.
        */}
        {face.mode && (
          <span className="inline-block rounded-full border border-primary/45 bg-primary/10 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-primary">
            {CARD_MODE_LABEL[face.mode]}
          </span>
        )}

        <p className="text-lg font-semibold leading-snug whitespace-pre-wrap">{face.front}</p>

        {/*
          Pictures on the question side, which only an imported Anki card has —
          and this app cannot import one, so in practice this is empty here. It
          is kept because the card shape is the shared one: an ECG strip above
          "identify this rhythm" is the question, not the answer to it.
        */}
        {(face.frontImages ?? []).map((uri) => (
          <img
            key={uri}
            src={uri}
            alt={`Picture on this card: ${face.front.slice(0, 60)}`}
            className="w-full rounded-lg object-contain max-h-80 bg-muted"
          />
        ))}

        {!revealed && face.hint && (
          <p className="text-xs text-muted-foreground">Hint: {face.hint}</p>
        )}

        {revealed && (
          <>
            <div className="h-px bg-border" />
            {/* The answer: the diagram, then the words. */}
            {!imageFailed &&
              backImages.map((uri) => (
                <img
                  key={uri}
                  src={uri}
                  alt={`Diagram: ${face.front}`}
                  loading="lazy"
                  // A diagram that will not load has to say so. A grey
                  // rectangle looks identical to "this app does not show
                  // diagrams", and from inside the app there is no way to tell
                  // which it is.
                  onError={() => setImageFailed(true)}
                  className="w-full rounded-lg object-contain max-h-96 bg-muted"
                />
              ))}
            {face.back && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{face.back}</p>
            )}

            {/*
              The chain the plate draws, under the plate.

              Under, not instead: the picture is the shape of the pathway and
              this is its content, and a first-year exam asks for both. It is
              also what keeps the card worth answering when the plate does not
              arrive, which is why the line below softens when there is a chain
              to fall back on rather than reporting a dead card.
            */}
            {face.pathway && <PathwayFlow pathway={face.pathway} />}

            {imageFailed && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {normalizePathway(face.pathway)
                  ? "The diagram could not be loaded — the steps above are the answer."
                  : "This diagram could not be loaded."}
              </p>
            )}
          </>
        )}

        {isLeech(current) && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            You have missed this one {current.lapses} times. It may be worth rewriting rather
            than repeating.
          </p>
        )}
      </div>

      {revealed ? (
        <div className="grid grid-cols-4 gap-2">
          {GRADES.map((grade) => (
            <button
              key={grade}
              onClick={() => onGrade(grade)}
              aria-label={`${GRADE_LABEL[grade]}, next in ${intervalLabel(current, grade)}`}
              className={`rounded-xl border px-2 py-3 text-center transition-transform active:scale-95 ${GRADE_CLASS[grade]}`}
            >
              <span className="block text-sm font-bold">{GRADE_LABEL[grade]}</span>
              {/* The cost of the choice, before it is made. This is the single
                  most useful thing about Anki's answer row. */}
              <span className="block text-[11px] text-muted-foreground">
                {intervalLabel(current, grade)}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <Button className="w-full" size="lg" onClick={() => setRevealed(true)}>
          Show answer
        </Button>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          aria-label="Previous question"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onBack} aria-label="Back to all decks">
          <Layers className="h-4 w-4 mr-1" />
          Decks
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Next question"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground"
        onClick={() => load(true)}
        aria-label="Write this deck again"
        title="Discards these cards and generates new ones"
      >
        <RotateCw className="h-4 w-4 mr-2" />
        Write this deck again
      </Button>
    </div>
  );
}
