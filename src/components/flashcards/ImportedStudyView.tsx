import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  answer,
  counts,
  dueQueue,
  GRADES,
  intervalLabel,
  type Card,
  type Grade,
} from "@/lib/anki";
import {
  loadSchedule,
  reconcile,
  saveSchedule,
  type DeckCard,
  type Schedule,
} from "@/lib/flashcards";
import {
  importedDeckKey,
  importedMediaUrl,
  loadImportedCards,
  type ImportedDeck,
} from "@/lib/importedDecksWeb";

const GRADE_LABEL: Record<Grade, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

const GRADE_CLASS: Record<Grade, string> = {
  again: "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400",
  hard: "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  good: "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  easy: "border-sky-500/50 bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

/**
 * Object URLs for a card's media, minted when it is shown and revoked when it
 * is not.
 *
 * A blob URL holds its blob alive until it is revoked. Minting one per render
 * without revoking would keep every picture the reader has walked past in
 * memory for the life of the tab — on a deck of photographs, the whole deck.
 * The cleanup runs on the way out of every effect, so leaving the card, leaving
 * the deck and closing the screen are all the same path.
 */
function useMediaUrls(deckId: string, names: string[] | undefined): string[] {
  const key = (names ?? []).join("\u0000");
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let live = true;
    const minted: string[] = [];
    const wanted = key ? key.split("\u0000") : [];

    void (async () => {
      for (const name of wanted) {
        const url = await importedMediaUrl(deckId, name);
        if (url) minted.push(url);
      }
      if (live) setUrls(minted);
      else minted.forEach((u) => URL.revokeObjectURL(u));
    })();

    return () => {
      live = false;
      minted.forEach((u) => URL.revokeObjectURL(u));
      setUrls([]);
    };
  }, [deckId, key]);

  return urls;
}

/**
 * Study a deck the reader imported from an Anki package.
 *
 * Separate from `StudyView` rather than a mode of it, because almost nothing is
 * shared: there is no chapter, no edge function, no regenerate, and the
 * pictures come out of IndexedDB as blobs instead of off a URL. What the two
 * *do* share is the part that matters — `dueQueue`, `answer` and the schedule
 * are the same scheduler, so a card graded here behaves exactly like a card
 * graded in a generated deck.
 *
 * **A card's front may carry pictures.** Our own image cards put the diagram on
 * the back because the diagram is the answer; an Anki card's front is whatever
 * its author wrote, and an ECG above "identify this rhythm" is the question.
 */
export default function ImportedStudyView({
  deck,
  newPerDay,
  onBack,
}: {
  deck: ImportedDeck;
  newPerDay: number;
  onBack: () => void;
}) {
  const deckKey = useMemo(() => importedDeckKey(deck.id), [deck.id]);
  const [cards, setCards] = useState<DeckCard[] | null>(null);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [revealed, setRevealed] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [history, setHistory] = useState<Array<{ cardId: string; prevCard: Card }>>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void loadImportedCards(deck.id).then((loaded) => {
      if (!live) return;
      setCards(loaded);
      setSchedule(loadSchedule(deckKey));
    });
    return () => {
      live = false;
    };
  }, [deck.id, deckKey]);

  const scheduled = useMemo<Card[]>(
    () => (cards ? reconcile(cards, schedule) : []),
    [cards, schedule]
  );
  const queue = useMemo(() => dueQueue(scheduled, Date.now(), newPerDay), [scheduled, newPerDay]);
  const tally = useMemo(() => counts(scheduled, Date.now(), newPerDay), [scheduled, newPerDay]);

  const heldBack = scheduled.filter((c) => c.type === "new").length - tally.fresh;
  const subtitle = [
    `${tally.fresh} new`,
    `${tally.learning} learning`,
    `${tally.review} to review`,
  ].join(" · ") + (heldBack > 0 ? `  ·  ${heldBack} more tomorrow` : "");

  const safeIndex = queue.length > 0 ? Math.min(cardIndex, queue.length - 1) : 0;
  const current = queue[safeIndex];
  const face = useMemo(
    () => (current && cards ? cards.find((c) => c.id === current.id) ?? null : null),
    [current, cards]
  );

  // Keep question media mounted after reveal. An ECG or radiograph is part
  // of the question and should not disappear just as the answer appears.
  const frontUrls = useMediaUrls(deck.id, face?.frontImages);
  const backUrls = useMediaUrls(deck.id, revealed ? face?.backImages : undefined);

  const onNext = useCallback(() => {
    if (queue.length <= 1) return;
    setCardIndex((i) => (i + 1) % queue.length);
    setRevealed(false);
    setZoomedImage(null);
  }, [queue.length]);

  const onPrevious = useCallback(() => {
    if (safeIndex > 0) {
      setCardIndex((i) => i - 1);
      setRevealed(false);
    setZoomedImage(null);
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
    setZoomedImage(null);
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
    setZoomedImage(null);
      setCardIndex(0);
    },
    [current, deckKey]
  );

  const header = (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to decks">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-0">
        <p className="font-bold truncate">{deck.name}</p>
        {cards && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );

  if (!cards) {
    return (
      <div className="space-y-4">
        {header}
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Opening the deck…
        </div>
      </div>
    );
  }

  if (queue.length === 0 || !current || !face) {
    return (
      <div className="space-y-4">
        {header}
        <div className="rounded-xl border bg-card p-8 text-center space-y-2">
          <p className="font-semibold">Nothing due right now</p>
          <p className="text-sm text-muted-foreground">
            {scheduled.length === 0
              ? "This deck has no cards in it."
              : "Every card you have started comes back on its own schedule. Come back tomorrow, or raise the new-cards-a-day setting to see more of this deck sooner."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}

      <div className="rounded-2xl border bg-card p-5 min-h-[16rem] flex flex-col">
        <div className="flex-1 space-y-3">
          <p className="text-xs tracking-widest text-muted-foreground">QUESTION</p>
          {frontUrls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setZoomedImage(url)}
              className="block w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Open question picture ${i + 1} full screen`}
            >
              <img
                src={url}
                alt={`Question picture ${i + 1} of ${frontUrls.length}`}
                className="max-h-64 max-w-full w-auto mx-auto rounded-lg object-contain"
              />
            </button>
          ))}
          <p className="text-lg font-medium whitespace-pre-wrap">{face.front}</p>

          {revealed && (
            <>
              <div className="border-t pt-3" />
              <p className="text-xs tracking-widest text-muted-foreground">ANSWER</p>
              {backUrls.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setZoomedImage(url)}
                  className="block w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Open answer picture ${i + 1} full screen`}
                >
                  <img
                    src={url}
                    alt={`Answer picture ${i + 1} of ${backUrls.length}`}
                    className="max-h-72 max-w-full w-auto mx-auto rounded-lg object-contain"
                  />
                </button>
              ))}
              <p className="whitespace-pre-wrap">{face.back}</p>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            disabled={safeIndex === 0 && history.length === 0}
            aria-label="Previous card"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground">
            {safeIndex + 1} of {queue.length}
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            disabled={queue.length <= 1}
            aria-label="Next card"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!revealed ? (
        <Button className="w-full" onClick={() => setRevealed(true)} aria-label="Show the answer">
          Show answer
        </Button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {GRADES.map((grade) => (
            <button
              key={grade}
              onClick={() => onGrade(grade)}
              aria-label={`${GRADE_LABEL[grade]}, next in ${intervalLabel(current, grade)}`}
              className={`rounded-xl border px-2 py-3 text-center transition-transform active:scale-95 ${GRADE_CLASS[grade]}`}
            >
              <span className="block text-sm font-bold">{GRADE_LABEL[grade]}</span>
              <span className="block text-[10px] opacity-80">
                {intervalLabel(current, grade)}
              </span>
            </button>
          ))}
        </div>
      )}

      {zoomedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Flashcard image preview"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] rounded-full bg-white/15 px-3 py-2 text-sm font-semibold text-white"
            onClick={() => setZoomedImage(null)}
            aria-label="Close image preview"
          >
            Close
          </button>
          <img
            src={zoomedImage}
            alt="Enlarged flashcard media"
            className="max-h-[88vh] max-w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
