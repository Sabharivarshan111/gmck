import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { type Card, newCard } from './anki';

/**
 * Flashcard decks: one per chapter, built by the `generate-flashcards` edge
 * function and studied with Anki's scheduler.
 *
 * The deck (the cards themselves) is **shared** — the same chapter produces the
 * same cards for everyone, so it is cached server-side and read by everybody.
 * The schedule (which card is due when) is **personal**, and lives on the
 * device. Keeping them apart is what lets a deck be generated once and studied
 * by a thousand people on their own timetables.
 */

export interface DeckCard {
  id: string;
  kind: 'theory' | 'image';
  front: string;
  back: string;
  hint?: string;
  imageUrl?: string;
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
 * **Mirrors `MIN_CARDS`/`MAX_CARDS`/`CARDS_PER_QUESTION` in the
 * `generate-flashcards` edge function, and must keep mirroring them.** The
 * chapter list shows this number before the deck exists, so if the two drift
 * the list makes a promise the server does not keep — which is exactly how a
 * chapter listed as "15 questions" opened as an 11-card deck.
 *
 * The shape is `clamp(20, 50, questions x 1.2)`, and each part earns its place:
 *
 * - **The multiplier is above 1** because a university exam question is not one
 *   card. "Classify mechanical injuries and describe the medicolegal
 *   importance of each" is a dozen facts, and the model is told to split a
 *   question into its parts rather than restate it. Deck size used to *be* the
 *   question count, which is why a 44-question chapter capped out at 44 when it
 *   had enough material for a full fifty.
 * - **The floor is 20** because a question count is not a workload. A
 *   15-question chapter still owes the reader a full sitting, and it was the
 *   small chapters — the ones with the most to unpack per question — that came
 *   out thinnest.
 * - **The ceiling is 50** because the model's output budget is finite and a
 *   deck nobody can finish is a deck nobody starts. More than fifty is a second
 *   chapter, not a longer one.
 *
 * It is deliberately a flat multiplier rather than something that weighs each
 * question. Two implementations in two languages have to produce the identical
 * number, and every extra term is another way for them to disagree.
 *
 * `npm run check:flashcard-size` pins this to the deployed function.
 */
export const MIN_DECK_CARDS = 20;
export const MAX_DECK_CARDS = 50;
export const CARDS_PER_QUESTION = 1.2;

export function deckTargetFor(questionCount: number): number {
  const wanted = Math.round(questionCount * CARDS_PER_QUESTION);
  return Math.max(MIN_DECK_CARDS, Math.min(MAX_DECK_CARDS, wanted));
}

/**
 * A key that cannot collide with the chapter's shared deck.
 *
 * The server caches on `year::subject::subtopicKey`, so asking it to build a
 * *personal* extra deck under the chapter's own key would overwrite the deck
 * everyone else reads — and because card ids are hashed from the front,
 * everybody's schedule for every changed card would reset with it.
 *
 * A suffixed key sidesteps that entirely, with no server change and nothing to
 * deploy first. `noCache` is the tidier fix for when it ships; this is what
 * makes the feature safe in the meantime.
 */
export function personalDeckKey(topicKey: string, at = Date.now()): string {
  return `${topicKey}#own-${at.toString(36)}`;
}

/** Same shape the function builds, so a cache hit and a fresh build agree. */
export function deckKeyFor(year: string, subject: string, subtopicKey: string): string {
  return `${year}::${subject}::${subtopicKey}`;
}

function isDeckCard(value: unknown): value is DeckCard {
  const card = value as DeckCard | null;
  if (!card || typeof card !== 'object') {
    return false;
  }
  if (typeof card.front !== 'string' || card.front.trim().length === 0) {
    return false;
  }
  /*
   * A theory card with no back cannot be answered, and an image card with no
   * image is a blank rectangle. Both are dropped rather than shown — the same
   * rule parseMcqs follows, and for the same reason: a broken card in a study
   * deck teaches the wrong thing or nothing, and there is no way for the
   * reader to tell which.
   */
  if (card.kind === 'image') {
    return typeof card.imageUrl === 'string' && card.imageUrl.length > 0;
  }
  return typeof card.back === 'string' && card.back.trim().length > 0;
}

/** Errors come back in the body, so the message has to be dug out of it. */
async function unwrapError(error: { message?: string; context?: unknown }): Promise<Error> {
  let message = error.message ?? 'Could not build this deck';
  try {
    const context = error.context as { json?: () => Promise<{ error?: unknown }> } | undefined;
    if (context?.json) {
      const body = await context.json();
      if (body?.error) {
        message = typeof body.error === 'string' ? body.error : JSON.stringify(body.error);
      }
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
  /**
   * Ask the server not to keep this deck.
   *
   * Set for a personal deck, which belongs on the phone that asked for it. The
   * function's zod schema strips unknown keys rather than rejecting them, so
   * sending this to a version that does not know about it is harmless — it
   * caches as usual, which is why `personalDeckKey` is what actually protects
   * the shared row.
   */
  noCache?: boolean;
}): Promise<Deck> {
  const { data, error } = await supabase.functions.invoke('generate-flashcards', {
    body: {
      year: request.year,
      subject: request.subject,
      subtopicKey: request.subtopicKey,
      subtopicName: request.subtopicName,
      // The function caps at 400; sending the whole chapter of a big topic
      // would 400 the request the way the notes function does.
      questions: request.questions.slice(0, 300),
      regenerate: request.regenerate ?? false,
      ...(request.noCache ? { noCache: true } : null),
      /*
       * The same number the row promised, and the same number the server would
       * compute for itself.
       *
       * Sending a limit at all is what makes this dangerous: the function reads
       * `limit ?? <its own floor>`, so any limit the client invents **replaces**
       * the 20-card floor rather than being clamped by it. A `Math.max(10, …)`
       * here quietly rebuilt the 15-card decks the floor exists to prevent.
       * Going through deckTargetFor keeps one definition of deck size, and
       * `npm run check:flashcard-size` fails if this line ever computes its own
       * again.
       */
      limit: deckTargetFor(request.questions.length),
    },
  });
  if (error) {
    throw await unwrapError(error);
  }
  if ((data as { error?: unknown } | null)?.error) {
    throw new Error(String((data as { error: unknown }).error));
  }
  const payload = data as { deckKey?: string; cards?: unknown[]; cached?: boolean };
  const cards = (payload?.cards ?? []).filter(isDeckCard);
  if (cards.length === 0) {
    throw new Error('This chapter produced no usable cards.');
  }
  return {
    deckKey: payload.deckKey ?? deckKeyFor(request.year, request.subject, request.subtopicKey),
    cards,
    cached: Boolean(payload.cached),
  };
}

// ---------------------------------------------------------------------------
// The schedule, which is per device and per deck.
// ---------------------------------------------------------------------------

const key = (deckKey: string) => `orbit:anki:${deckKey}`;

export type Schedule = Record<string, Card>;

export async function loadSchedule(deckKey: string): Promise<Schedule> {
  try {
    const raw = await AsyncStorage.getItem(key(deckKey));
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Schedule;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    // A corrupt schedule is a study session lost, not a crash. Starting over
    // costs the reader a few minutes; failing to open the deck costs the deck.
    return {};
  }
}

export async function saveSchedule(deckKey: string, schedule: Schedule): Promise<void> {
  try {
    await AsyncStorage.setItem(key(deckKey), JSON.stringify(schedule));
  } catch {
    // Best effort, like every other cache in the app.
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
  return cards.map(card => schedule[card.id] ?? newCard(card.id, now));
}
