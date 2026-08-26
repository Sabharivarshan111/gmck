import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeckCard } from './flashcards';

/**
 * Decks you write yourself.
 *
 * **On the phone, and nowhere else.** The generated decks are cached in
 * Supabase because a chapter produces the same cards for everyone, which is
 * what makes one Gemini call worth sharing. A deck you wrote is the opposite:
 * it is yours, it is nobody else's revision, and there is no shared cost to
 * amortise. Uploading it would mean an account, a policy, and a row that
 * outlives the app on someone else's server — for no benefit to the person who
 * typed it.
 *
 * The trade is honest and the UI says it: reinstall the app, or lose the phone,
 * and these go. That is the cost of not having an account.
 */

const KEY = 'orbit:anki:custom-decks';

export interface CustomDeck {
  id: string;
  name: string;
  cards: DeckCard[];
  createdAt: number;
  updatedAt: number;
}

/**
 * A custom deck's schedule key.
 *
 * Namespaced so it can never collide with a generated deck's
 * `{year}::{subject}::{chapter}` — a collision would have one deck reading the
 * other's schedule, and the symptom would be cards that are mysteriously
 * already due.
 */
export function customDeckKey(id: string): string {
  return `custom::${id}`;
}

function newId(): string {
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Card ids are per deck and must be stable: the schedule is keyed on them. */
function newCardId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function isCard(value: unknown): value is DeckCard {
  const card = value as DeckCard | null;
  return (
    !!card &&
    typeof card === 'object' &&
    typeof card.id === 'string' &&
    typeof card.front === 'string' &&
    typeof card.back === 'string'
  );
}

export async function loadCustomDecks(): Promise<CustomDeck[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (deck): deck is CustomDeck =>
          !!deck &&
          typeof (deck as CustomDeck).id === 'string' &&
          typeof (deck as CustomDeck).name === 'string' &&
          Array.isArray((deck as CustomDeck).cards),
      )
      .map(deck => ({ ...deck, cards: deck.cards.filter(isCard) }));
  } catch {
    /*
     * A deck list that will not parse is returned empty rather than thrown.
     * These are the only copy — but a screen that crashes on open cannot show
     * them either, and an empty list at least leaves the app usable while the
     * rest of it still works.
     */
    return [];
  }
}

async function persist(decks: CustomDeck[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(decks));
}

export async function createDeck(name: string): Promise<CustomDeck> {
  const decks = await loadCustomDecks();
  const now = Date.now();
  const deck: CustomDeck = {
    id: newId(),
    name: name.trim().slice(0, 80) || 'Untitled deck',
    cards: [],
    createdAt: now,
    updatedAt: now,
  };
  await persist([deck, ...decks]);
  return deck;
}

export async function renameDeck(id: string, name: string): Promise<CustomDeck[]> {
  const decks = await loadCustomDecks();
  const next = decks.map(deck =>
    deck.id === id
      ? { ...deck, name: name.trim().slice(0, 80) || deck.name, updatedAt: Date.now() }
      : deck,
  );
  await persist(next);
  return next;
}

export async function deleteDeck(id: string): Promise<CustomDeck[]> {
  const decks = await loadCustomDecks();
  const next = decks.filter(deck => deck.id !== id);
  await persist(next);
  // The schedule goes too. Leaving it behind would resurrect a deleted deck's
  // review history if the same id were ever minted again.
  await AsyncStorage.removeItem(`orbit:anki:${customDeckKey(id)}`).catch(() => {});
  return next;
}

export async function addCard(
  id: string,
  front: string,
  back: string,
): Promise<CustomDeck[]> {
  const decks = await loadCustomDecks();
  const card: DeckCard = {
    id: newCardId(),
    kind: 'theory',
    front: front.trim(),
    back: back.trim(),
  };
  const next = decks.map(deck =>
    deck.id === id
      ? { ...deck, cards: [...deck.cards, card], updatedAt: Date.now() }
      : deck,
  );
  await persist(next);
  return next;
}

export async function deleteCard(deckId: string, cardId: string): Promise<CustomDeck[]> {
  const decks = await loadCustomDecks();
  const next = decks.map(deck =>
    deck.id === deckId
      ? { ...deck, cards: deck.cards.filter(c => c.id !== cardId), updatedAt: Date.now() }
      : deck,
  );
  await persist(next);
  return next;
}
