import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  GraduationCap,
  Layers,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
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
import {
  deleteImportedDeck,
  importPackage,
  loadImportedDecks,
  MAX_IMPORT_CARDS,
  type ImportedDeck,
} from "@/lib/importedDecksWeb";
/*
 * Where sql.js finds its WASM, resolved by Vite at build time.
 *
 * `apkgWeb.ts` will not guess this, and its header says why: a `new URL(…,
 * import.meta.url)` built from a template string is not statically analysable,
 * so Vite leaves it alone and the built app asks for a path under
 * `node_modules` that is not deployed. Without this line the import works in
 * `npm run dev` and, in production, sql.js falls back to fetching the file
 * over the network — which is both a 404 and a request to somewhere else every
 * time a reader opens a deck.
 *
 * `?url` emits the file as an asset and hands back its hashed path, so the
 * WASM ships with the app and is served from its own origin. It is the browser
 * build's WASM specifically: sql.js's `exports.browser` points at
 * `sql-wasm-browser.js`, and the two are a pair.
 */
import sqlWasmUrl from "sql.js/dist/sql-wasm-browser.wasm?url";
import StudyView from "./StudyView";
import ImportedStudyView from "./ImportedStudyView";

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
  | { kind: "study"; year: Year; subjectName: string; topic: LeafTopic }
  | { kind: "imported"; deck: ImportedDeck };

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
          onStudyImported={(deck) => setView({ kind: "imported", deck })}
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
      {view.kind === "imported" && (
        <ImportedStudyView
          deck={view.deck}
          newPerDay={newPerDay}
          onBack={() => setView({ kind: "years" })}
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
  onStudyImported,
  onExit,
}: {
  newPerDay: number;
  onNewPerDay: (value: number) => void;
  onPick: (y: Year) => void;
  onResume: (year: Year, subjectName: string, topic: LeafTopic) => void;
  onStudyImported: (deck: ImportedDeck) => void;
  onExit?: () => void;
}) {
  const [started, setStarted] = useState<StartedDeck[]>([]);
  const [imported, setImported] = useState<ImportedDeck[]>([]);
  useEffect(() => {
    setStarted(listStartedDecks());
    setImported(loadImportedDecks());
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
        Importing an Anki package, in the browser.

        This panel used to say the feature was Android-only, on the reasoning
        that a browser has no zip, no SQLite and no zstd. That was wrong, and
        `apkgWeb.ts` says so in its own header: a *native module* is what React
        Native lacks. A browser reaches all three without asking for a
        permission — fflate, sql.js (WASM) and fzstd — and `apkgWeb.ts` had
        already been written to do it. It simply was not wired to a button, so the
        panel that stood here kept sending readers to the phone.

        The 1.5MB of sql.js WASM is behind a dynamic import inside `readApkg`,
        so a reader who never imports a deck never downloads it — which is
        almost every reader.
      */}
      <p className="text-xs tracking-widest text-muted-foreground pt-2">YOUR OWN ANKI DECKS</p>
      <ImportPanel decks={imported} onDecks={setImported} onStudy={onStudyImported} />
    </div>
  );
}

/**
 * Choose a `.apkg`, read it, and list what has been imported.
 *
 * The file input is the browser's `ACTION_OPEN_DOCUMENT`: it returns the one
 * file the reader chose and grants nothing else, so this needs no permission,
 * exactly like the phone's picker.
 *
 * Three things the message here has to get right, because each one is a way
 * this looks broken when it is working:
 *
 * - **Say it may take a moment.** The first import downloads 1.5MB of SQLite
 *   WASM and then parses a database. On a big package that is seconds of
 *   nothing happening, and a button that appears to do nothing is the failure
 *   people report.
 * - **Say the deck stays here.** A shared medical deck is somebody else's work
 *   the reader downloaded; this app never uploads it, and a reader wondering
 *   whether it did deserves an answer on the screen rather than in a policy.
 * - **Say when a package was truncated.** `MAX_IMPORT_CARDS` silently taking
 *   the first five thousand of a thirty-thousand-card package is exactly the
 *   "it imported but half my deck is missing" report.
 */
function ImportPanel({
  decks,
  onDecks,
  onStudy,
}: {
  decks: ImportedDeck[];
  onDecks: (decks: ImportedDeck[]) => void;
  onStudy: (deck: ImportedDeck) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Clearing the input is what lets the same file be chosen twice. Without
      // it a failed import cannot be retried without picking something else
      // first, which reads as the button having stopped working.
      event.target.value = "";
      if (!file) return;

      setBusy(true);
      setError(null);
      try {
        const { readApkg, setSqlWasmUrl } = await import("@/lib/apkgWeb");
        setSqlWasmUrl(sqlWasmUrl);
        const pkg = await readApkg(file);
        const deck = await importPackage(pkg, file.name);
        onDecks(loadImportedDecks());
        onStudy(deck);
      } catch (e) {
        setError((e as Error).message || "That package could not be opened.");
      } finally {
        setBusy(false);
      }
    },
    [onDecks, onStudy]
  );

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">Import a .apkg</p>
        <p className="text-xs text-muted-foreground">
          Your deck is read in this browser and stays in it — nothing is uploaded. A large
          package takes a moment the first time.
        </p>
      </div>

      <label className="block">
        <input
          type="file"
          accept=".apkg,application/zip"
          className="sr-only"
          disabled={busy}
          onChange={onFile}
          aria-label="Choose an Anki package to import"
        />
        <span
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
            busy ? "opacity-60" : "cursor-pointer hover:bg-muted/60"
          }`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Reading the package…" : "Choose a .apkg file"}
        </span>
      </label>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {decks.map((deck) => (
        <div key={deck.id} className="flex items-center gap-2 rounded-lg border p-3">
          <button
            className="flex-1 text-left min-w-0"
            onClick={() => onStudy(deck)}
            aria-label={`Study ${deck.name}, ${deck.cardCount} cards`}
          >
            <p className="text-sm font-medium truncate">{deck.name}</p>
            <p className="text-xs text-muted-foreground">
              {deck.cardCount} cards
              {deck.mediaCount > 0 && ` · ${deck.mediaCount} pictures`}
              {deck.truncated && ` · first ${MAX_IMPORT_CARDS} of a larger package`}
            </p>
          </button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${deck.name}`}
            onClick={() => {
              void deleteImportedDeck(deck.id).then(onDecks);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <p className="text-[10px] text-muted-foreground">
        Anki is a trademark of Ankitects Pty Ltd. Orbit is not affiliated with, endorsed by
        or supported by Ankitects.
      </p>
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
