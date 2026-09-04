import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  GraduationCap,
  Layers,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { YEAR_LABELS, getYearSubjects, type Year } from "@/lib/year-subjects";
import { flattenSubjectTopics, type LeafTopic } from "@/lib/leaf-topics";
import {
  deckTargetFor,
  listStartedDecks,
  loadNewPerDay,
  NEW_PER_DAY_MAX,
  NEW_PER_DAY_MIN,
  NEW_PER_DAY,
  saveNewPerDay,
  type StartedDeck,
} from "@/lib/flashcards";
import StudyView from "./StudyView";

const YEARS: Year[] = ["first", "second", "third", "final"];
const YEAR_ICONS: Record<Year, string> = {
  first: "🩺",
  second: "💊",
  third: "⚖️",
  final: "🏥",
};

type View =
  | { kind: "years" }
  | { kind: "subjects"; year: Year }
  | { kind: "topics"; year: Year; subjectKey: string; subjectName: string; node: any }
  | { kind: "study"; year: Year; subjectName: string; topic: LeafTopic };

/**
 * Anki-style flashcards in the browser.
 *
 * The same feature the native app has had for months, on the same edge function
 * and the same scheduler — see `src/lib/flashcards.ts` for what is shared and
 * what could not be. The navigation deliberately mirrors the notes hub next to
 * it: year → subject → chapter, because it is the same bank underneath and a
 * second way of walking it would be a second thing to learn.
 */
export default function FlashcardsHub({ onExit }: { onExit?: () => void }) {
  const [view, setView] = useState<View>({ kind: "years" });
  const [newPerDay, setNewPerDay] = useState<number>(NEW_PER_DAY);

  useEffect(() => {
    setNewPerDay(loadNewPerDay());
  }, []);

  const commitNewPerDay = useCallback((value: number) => {
    setNewPerDay(value);
    saveNewPerDay(value);
  }, []);

  return (
    <div className="animate-fade-in">
      {view.kind === "years" && (
        <YearsView
          newPerDay={newPerDay}
          onNewPerDay={commitNewPerDay}
          onExit={onExit}
          onPick={(year) => setView({ kind: "subjects", year })}
          onResume={(year, subjectName, topic) =>
            setView({ kind: "study", year, subjectName, topic })
          }
        />
      )}
      {view.kind === "subjects" && (
        <SubjectsView
          year={view.year}
          onBack={() => setView({ kind: "years" })}
          onPick={(subjectKey, subjectName, node) =>
            setView({ kind: "topics", year: view.year, subjectKey, subjectName, node })
          }
        />
      )}
      {view.kind === "topics" && (
        <TopicsView
          subjectKey={view.subjectKey}
          subjectName={view.subjectName}
          node={view.node}
          onBack={() => setView({ kind: "subjects", year: view.year })}
          onPick={(topic) =>
            setView({
              kind: "study",
              year: view.year,
              subjectName: view.subjectName,
              topic,
            })
          }
        />
      )}
      {view.kind === "study" && (
        <StudyView
          year={view.year}
          subjectName={view.subjectName}
          topic={view.topic}
          newPerDay={newPerDay}
          onBack={() => setView({ kind: "years" })}
        />
      )}
    </div>
  );
}

function BackHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <p className="font-bold truncate">{title}</p>
    </div>
  );
}

/**
 * Every chapter in the bank, keyed the way a deck is keyed.
 *
 * Built only when there is a started deck to resume, because it walks all four
 * years. A schedule knows the deck key it belongs to and nothing else — the
 * year label, the subject name and the chapter slug — so this is what turns one
 * back into somewhere the reader can be sent.
 */
function useChapterIndex(enabled: boolean) {
  return useMemo(() => {
    const index = new Map<string, { year: Year; subjectName: string; topic: LeafTopic }>();
    if (!enabled) return index;
    for (const year of YEARS) {
      for (const subject of getYearSubjects(year)) {
        for (const topic of flattenSubjectTopics(subject.key, subject.node)) {
          const path = topic.key.split("::").pop() ?? topic.key;
          const slug = path.split("/").pop() ?? path;
          index.set(`${YEAR_LABELS[year]}::${subject.name}::${slug}`, {
            year,
            subjectName: subject.name,
            topic,
          });
        }
      }
    }
    return index;
  }, [enabled]);
}

function YearsView({
  newPerDay,
  onNewPerDay,
  onPick,
  onResume,
  onExit,
}: {
  newPerDay: number;
  onNewPerDay: (value: number) => void;
  onPick: (y: Year) => void;
  onResume: (year: Year, subjectName: string, topic: LeafTopic) => void;
  onExit?: () => void;
}) {
  const [started, setStarted] = useState<StartedDeck[]>([]);
  useEffect(() => {
    setStarted(listStartedDecks());
  }, []);
  const index = useChapterIndex(started.length > 0);
  const resumable = started
    .map((deck) => ({ deck, target: index.get(deck.deckKey) }))
    .filter((row) => row.target);

  return (
    <div className="space-y-4">
      {onExit && <BackHeader onBack={onExit} title="Flashcards" />}

      <div className="rounded-2xl bg-gradient-to-br from-violet-700 via-purple-700 to-fuchsia-700 text-white p-5">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="h-4 w-4" />
          <p className="text-[10px] tracking-widest uppercase">Spaced repetition</p>
        </div>
        <h2 className="text-2xl font-extrabold">Anki-style cards</h2>
        <p className="text-sm text-purple-100 mt-1">
          Pick a year → subject → chapter. Half the cards are theory written from that chapter's
          past-year questions; the other half are the exam diagrams. Cards you find hard come
          back sooner.
        </p>
      </div>

      {resumable.length > 0 && (
        <>
          <p className="text-xs tracking-widest text-muted-foreground">DECKS YOU HAVE STARTED</p>
          <div className="space-y-2">
            {resumable.map(({ deck, target }) => (
              <button
                key={deck.deckKey}
                onClick={() => onResume(target!.year, target!.subjectName, target!.topic)}
                aria-label={`${target!.topic.name}, ${deck.due} cards due, resume`}
                className="w-full rounded-xl bg-card border p-3 flex items-center gap-3 text-left hover:shadow-md hover:border-primary/40 transition-all"
              >
                <div className="h-10 w-10 rounded-lg bg-violet-500/15 text-violet-600 flex items-center justify-center flex-shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{target!.topic.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {deck.year} · {deck.subject} · {deck.studied} card
                    {deck.studied === 1 ? "" : "s"} started
                  </p>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-1 rounded ${
                    deck.due > 0
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {deck.due > 0 ? `${deck.due} due` : "Nothing due"}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <p className="text-xs tracking-widest text-muted-foreground">SELECT YEAR</p>
      <div className="grid grid-cols-2 gap-3">
        {YEARS.map((y, i) => (
          <button
            key={y}
            onClick={() => onPick(y)}
            aria-label={`${YEAR_LABELS[y]}, browse subjects`}
            className="rounded-2xl border bg-card p-4 text-left hover:shadow-md hover:border-primary/40 transition-all animate-fade-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="text-3xl mb-2">{YEAR_ICONS[y]}</div>
            <p className="font-bold">{YEAR_LABELS[y]}</p>
            <p className="text-xs text-muted-foreground mt-1">Tap to browse subjects</p>
          </button>
        ))}
      </div>

      {/*
        The daily cap, where the decks are — not buried in a settings page.

        The cap is most of what makes spaced repetition work, and it is also the
        single most confusing thing about it: a fifty-card deck that hands out
        twenty reads as a deck that lost thirty. Putting the number next to the
        decks it governs is what turns "why are there only 20?" into a control.
      */}
      <p className="text-xs tracking-widest text-muted-foreground pt-2">HOW MUCH A DAY</p>
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-medium">New cards</p>
          <p className="text-sm font-semibold text-primary">{newPerDay} a day</p>
        </div>
        <Slider
          value={[newPerDay]}
          min={NEW_PER_DAY_MIN}
          max={NEW_PER_DAY_MAX}
          step={5}
          onValueChange={(v) => onNewPerDay(v[0])}
          aria-label="New flashcards per day"
        />
        <p className="text-xs text-muted-foreground">
          {newPerDay === NEW_PER_DAY
            ? "Anki's default. Twenty a day is a habit; a whole chapter in one sitting is an evening that happens once."
            : "Cards you have already started still come back on their own schedule — this only sets how many new ones a deck introduces each day."}
        </p>
      </div>

      {/*
        Saying plainly what this app cannot do, rather than offering a picker
        that would fail on almost every real file.

        A modern .apkg is a ZIP holding a SQLite collection compressed with
        zstd. The native app reads one with `java.util.zip`,
        `android.database.sqlite` and zstd-jni; a browser has none of the three
        without shipping a SQLite build and a zstd decoder of its own. A partial
        importer is the worst outcome available here — every v3 package also
        carries a decoy `collection.anki2` holding one note that reads "This
        file requires a newer version of Anki", so a naive reader hands back a
        one-card deck and looks like it worked.
      */}
      <div className="rounded-xl border bg-muted/40 p-4 flex items-start gap-3">
        <Smartphone className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Importing your own .apkg is on the Android app</p>
          <p className="text-xs text-muted-foreground">
            Reading an Anki package needs a zip, a SQLite database and zstd, which the phone app
            has and a browser does not. Decks you write yourself live on the phone too.
          </p>
          <p className="text-[10px] text-muted-foreground pt-1">
            Anki is a trademark of Ankitects Pty Ltd. Orbit is not affiliated with, endorsed by
            or supported by Ankitects.
          </p>
        </div>
      </div>
    </div>
  );
}

function SubjectsView({
  year,
  onBack,
  onPick,
}: {
  year: Year;
  onBack: () => void;
  onPick: (k: string, n: string, node: any) => void;
}) {
  const subjects = useMemo(() => getYearSubjects(year), [year]);
  return (
    <div className="space-y-3">
      <BackHeader onBack={onBack} title={`${YEAR_LABELS[year]} • Subjects`} />
      {subjects.map((s, i) => (
        <button
          key={s.key}
          onClick={() => onPick(s.key, s.name, s.node)}
          aria-label={`${s.name}, browse chapters`}
          className="w-full rounded-xl bg-card border p-3 flex items-center gap-3 text-left hover:shadow-md hover:border-primary/40 transition-all animate-fade-in"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-primary flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{s.name}</p>
            <p className="text-[11px] text-muted-foreground">Tap to see chapters</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}

function TopicsView({
  subjectKey,
  subjectName,
  node,
  onBack,
  onPick,
}: {
  subjectKey: string;
  subjectName: string;
  node: any;
  onBack: () => void;
  onPick: (t: LeafTopic) => void;
}) {
  const topics = useMemo(() => flattenSubjectTopics(subjectKey, node), [subjectKey, node]);
  return (
    <div className="space-y-3">
      <BackHeader onBack={onBack} title={`${subjectName} • ${topics.length} chapters`} />
      {topics.map((t, i) => (
        <button
          key={t.key}
          onClick={() => onPick(t)}
          aria-label={`${t.name}, ${deckTargetFor(t.questions.length)} cards, study flashcards`}
          className="w-full rounded-xl bg-card border p-3 flex items-center gap-3 text-left hover:shadow-md hover:border-primary/40 transition-all animate-fade-in"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <div className="h-10 w-10 rounded-lg bg-violet-500/15 text-violet-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{t.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{t.breadcrumb}</p>
          </div>
          {/*
            The deck's size, not the chapter's question count. These are
            different numbers: a chapter of 15 questions builds a 20-card deck,
            because an essay question is worth several cards. Showing the
            question count here made every deck look like it had lost cards on
            the way.
          */}
          <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-1 rounded whitespace-nowrap">
            {deckTargetFor(t.questions.length)} cards
          </span>
        </button>
      ))}
    </div>
  );
}
