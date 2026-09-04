/**
 * Flashcards, for the web app.
 *
 * The native app has had this since long before the web app did
 * (`mobile/src/screens/FlashcardsScreen.tsx`), and the rules it obeys are in
 * `.agents/rules/60-flashcards.md`. This file is the web half of the same
 * feature, and it is deliberately thin: everything that decides *what a review
 * means* is imported from the one implementation rather than written again.
 *
 * ## The scheduler is imported, not reimplemented
 *
 * `mobile/src/lib/anki.ts` is the single home for it — `npm run check:one-app`
 * (in `mobile/`) fails if a second copy of its constants appears anywhere under
 * `src/` or `supabase/`, and `npm run check:anki` pins that one copy to
 * behaviours Anki's own tests assert. It is pure TypeScript with no imports at
 * all, so a browser bundle can consume it directly. The import below is
 * therefore the whole of the sharing: two apps, one scheduler, one set of
 * checks over it.
 *
 * The path is relative rather than aliased on purpose — `@` means `src/` in
 * this app, and an alias that quietly reached outside it would be the more
 * surprising of the two.
 *
 * ## What is *not* here
 *
 * `.apkg` import is Android-only and stays that way. Reading a package means a
 * ZIP, a SQLite collection and zstd, which the native app does in
 * `ApkgModule.kt`; a browser has none of those without shipping a SQLite build
 * and a zstd decoder. There is no half version worth having — a picker that
 * accepted a file and then failed on every modern (v3, zstd) package would look
 * exactly like a bug — so the web app does not offer it.
 *
 * Hand-written decks (`mobile/src/lib/customDecks.ts`) are likewise not here.
 * They are on-device by design, and the phone is where they were written.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  answer,
  counts,
  dueQueue,
  GRADES,
  intervalLabel,
  isLeech,
  newCard,
  NEW_PER_DAY,
  type Card,
  type Grade,
} from "./anki";

export { answer, counts, dueQueue, GRADES, intervalLabel, isLeech, newCard, NEW_PER_DAY };
export type { Card, Grade };

export interface DeckCard {
  id: string;
  kind: "theory" | "image";
  front: string;
  back: string;
  hint?: string;
  imageUrl?: string;
  /** Pictures on the question side. Only an imported Anki card has these. */
  frontImages?: string[];
  /** Pictures on the answer side. `imageUrl` is the first of these. */
  backImages?: string[];
  tags?: string[];
}

export interface Deck {
  deckKey: string;
  cards: DeckCard[];
  cached: boolean;
}

/**
 * How many cards a chapter's deck should have.
 *
 * **This is a third copy of one number and it is pinned as such.**
 * `MIN_CARDS`/`MAX_CARDS`/`CARDS_PER_QUESTION` in the `generate-flashcards`
 * edge function are the server's, `MIN_DECK_CARDS`/`MAX_DECK_CARDS`/
 * `CARDS_PER_QUESTION` in `mobile/src/lib/flashcards.ts` are the phone's, and
 * these are the browser's. `npm run check:flashcard-size` reads all three files
 * and fails if any of them drifts.
 *
 * It is a copy rather than an import because the native client's copy lives in
 * a module that pulls in AsyncStorage and the React Native Supabase client, and
 * neither exists in a browser. The scheduler above could be shared because it
 * is pure; this one cannot, so the check is what holds it together instead.
 *
 * The shape is `clamp(20, 50, questions x 1.2)`. A university exam question is
 * worth more than one card, so the multiplier is above 1; a 15-question chapter
 * still owes the reader a full sitting, so the floor is 20; and a deck nobody
 * can finish is a deck nobody starts, so the ceiling is 50.
 */
export const MIN_DECK_CARDS = 20;
export const MAX_DECK_CARDS = 50;
export const CARDS_PER_QUESTION = 1.2;

export function deckTargetFor(questionCount: number): number {
  const wanted = Math.round(questionCount * CARDS_PER_QUESTION);
  return Math.max(MIN_DECK_CARDS, Math.min(MAX_DECK_CARDS, wanted));
}

/** Same shape the edge function builds, so a cache hit and a fresh build agree. */
export function deckKeyFor(year: string, subject: string, subtopicKey: string): string {
  return `${year}::${subject}::${subtopicKey}`;
}

function isDeckCard(value: unknown): value is DeckCard {
  const card = value as DeckCard | null;
  if (!card || typeof card !== "object") return false;
  if (typeof card.front !== "string" || card.front.trim().length === 0) return false;
  /*
   * A theory card with no back cannot be answered, and an image card with no
   * image is a blank rectangle. Both are dropped rather than shown: a broken
   * card in a study deck teaches the wrong thing or nothing, and there is no
   * way for the reader to tell which.
   */
  if (card.kind === "image") {
    return typeof card.imageUrl === "string" && card.imageUrl.length > 0;
  }
  return typeof card.back === "string" && card.back.trim().length > 0;
}

/**
 * supabase-js puts the real message in the response body, not in `error.message`.
 *
 * The one that matters is the quota message — the free Gemini tier is the
 * binding constraint on this feature, and "Edge Function returned a non-2xx
 * status code" tells the reader nothing they can act on.
 */
async function unwrapError(error: { message?: string; context?: unknown }): Promise<Error> {
  let message = error.message ?? "Could not build this deck";
  try {
    const context = error.context as
      | { json?: () => Promise<{ error?: unknown }>; text?: () => Promise<string> }
      | undefined;
    if (context?.json) {
      const body = await context.json();
      if (body?.error) {
        message = typeof body.error === "string" ? body.error : JSON.stringify(body.error);
      }
    } else if (context?.text) {
      const text = await context.text();
      if (text) message = text.slice(0, 300);
    }
  } catch {
    // Keep the original.
  }
  return new Error(message);
}

export async function fetchDeck(request: {
  year: string;
  subject: string;
  subtopicKey: string;
  subtopicName: string;
  questions: string[];
  regenerate?: boolean;
}): Promise<Deck> {
  const { data, error } = await supabase.functions.invoke("generate-flashcards", {
    body: {
      year: request.year,
      subject: request.subject,
      subtopicKey: request.subtopicKey,
      subtopicName: request.subtopicName,
      // The function caps at 400; sending the whole chapter of a big topic
      // would 400 the request the way the notes function does.
      questions: request.questions.slice(0, 300),
      regenerate: request.regenerate ?? false,
      /*
       * The same number the chapter list promised, and the same number the
       * server would compute for itself.
       *
       * Sending a limit at all is what makes this dangerous: the function reads
       * `limit ?? <its own floor>`, so any limit invented here **replaces** the
       * 20-card floor rather than being clamped by it. Going through
       * deckTargetFor keeps one definition of deck size on this side.
       */
      limit: deckTargetFor(request.questions.length),
    },
  });
  if (error) throw await unwrapError(error);
  if ((data as { error?: unknown } | null)?.error) {
    throw new Error(String((data as { error: unknown }).error));
  }
  const payload = data as { deckKey?: string; cards?: unknown[]; cached?: boolean };
  const cards = (payload?.cards ?? []).filter(isDeckCard);
  if (cards.length === 0) throw new Error("This chapter produced no usable cards.");
  return {
    deckKey:
      payload.deckKey ?? deckKeyFor(request.year, request.subject, request.subtopicKey),
    cards,
    cached: Boolean(payload.cached),
  };
}

// ---------------------------------------------------------------------------
// The schedule, which is per browser and per deck.
//
// Decks are shared — the same chapter produces the same cards for everyone, so
// the edge function caches them and everybody reads that one row. The schedule
// is not: it is what this reader has learned, and it lives here under the same
// `orbit:anki:{deckKey}` name the phone uses. That split is what lets one
// generated deck serve everyone on their own timetable.
// ---------------------------------------------------------------------------

const SCHEDULE_PREFIX = "orbit:anki:";
const scheduleKey = (deckKey: string) => `${SCHEDULE_PREFIX}${deckKey}`;

export type Schedule = Record<string, Card>;

export function loadSchedule(deckKey: string): Schedule {
  try {
    const raw = localStorage.getItem(scheduleKey(deckKey));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Schedule;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    // A corrupt schedule is a study session lost, not a crash. Starting over
    // costs the reader a few minutes; failing to open the deck costs the deck.
    return {};
  }
}

export function saveSchedule(deckKey: string, schedule: Schedule): void {
  try {
    localStorage.setItem(scheduleKey(deckKey), JSON.stringify(schedule));
  } catch {
    // Best effort, like every other cache in this app.
  }
}

/**
 * Line the deck's cards up with what is known about them.
 *
 * A card the schedule has never seen starts new. A scheduled card whose id is
 * no longer in the deck is dropped: regenerating a chapter renumbers the cards,
 * and carrying a schedule for a card nobody can see would leave the queue
 * permanently one card short with nothing to show for it.
 */
export function reconcile(cards: DeckCard[], schedule: Schedule, now = Date.now()): Card[] {
  return cards.map((card) => schedule[card.id] ?? newCard(card.id, now));
}

export interface StartedDeck {
  deckKey: string;
  /** "1st Year", from the key. */
  year: string;
  subject: string;
  subtopicKey: string;
  studied: number;
  due: number;
}

/**
 * The decks this browser has actually opened.
 *
 * Read off the schedules rather than kept as a list of its own: a schedule is
 * written the first time a card is graded, so there is nothing else to keep in
 * step and nothing that can disagree with what is really stored. A deck with no
 * graded card yet does not appear, which is right — it has not been started.
 */
export function listStartedDecks(now = Date.now()): StartedDeck[] {
  const out: StartedDeck[] = [];
  let store: Storage;
  try {
    store = localStorage;
  } catch {
    return out;
  }
  for (let i = 0; i < store.length; i += 1) {
    const key = store.key(i);
    if (!key || !key.startsWith(SCHEDULE_PREFIX)) continue;
    const deckKey = key.slice(SCHEDULE_PREFIX.length);
    const parts = deckKey.split("::");
    if (parts.length < 3) continue;
    let cards: Card[];
    try {
      const parsed = JSON.parse(store.getItem(key) ?? "null") as Schedule | null;
      if (!parsed || typeof parsed !== "object") continue;
      cards = Object.values(parsed).filter((c) => c && typeof c === "object");
    } catch {
      continue;
    }
    if (cards.length === 0) continue;
    out.push({
      deckKey,
      year: parts[0],
      subject: parts[1],
      subtopicKey: parts.slice(2).join("::"),
      studied: cards.length,
      due: cards.filter((c) => c.type !== "new" && c.due <= now).length,
    });
  }
  return out.sort((a, b) => b.due - a.due || a.subject.localeCompare(b.subject));
}

// ---------------------------------------------------------------------------
// How much a day.
// ---------------------------------------------------------------------------

/**
 * The daily new-card cap, kept beside the decks it governs.
 *
 * Its own key rather than a field in the phone's `orbit:settings-v1` blob:
 * that value carries a couple of dozen native-only preferences, and a browser
 * writing a partial copy of it would be a browser deleting them.
 */
const PREFS_KEY = "orbit:anki-prefs";
export const NEW_PER_DAY_MIN = 5;
export const NEW_PER_DAY_MAX = 50;

export function loadNewPerDay(): number {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null");
    const value = parsed?.newCardsPerDay;
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.round(Math.max(NEW_PER_DAY_MIN, Math.min(NEW_PER_DAY_MAX, value)));
    }
  } catch {
    // Fall through to the default.
  }
  return NEW_PER_DAY;
}

export function saveNewPerDay(value: number): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ newCardsPerDay: value }));
  } catch {
    // Best effort.
  }
}
