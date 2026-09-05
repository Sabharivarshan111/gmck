/**
 * Anki decks the reader imported, in the browser.
 *
 * `apkgWeb.ts` opens a package; this is where what came out of it lives, and
 * what the study screen reads back. It is the browser's counterpart to
 * `mobile/src/lib/importedDecks.ts`, and it deliberately keeps that file's
 * shapes — `ImportedDeck`, `importedDeckKey`, `MAX_IMPORT_CARDS` — because a
 * reader with both installed should recognise the same deck list, and because
 * two apps that describe one thing differently drift.
 *
 * ## Why IndexedDB and not localStorage
 *
 * A shared medical deck is thousands of cards and its media is measured in
 * hundreds of megabytes. `localStorage` is a synchronous string store with a
 * ~5MB budget for the whole origin, which the theme, the profile and every
 * question's completion already sit in. Putting a deck there would not merely
 * fail — it would fail by throwing `QuotaExceededError` *while writing*, which
 * is how you lose the value that was already there.
 *
 * So this follows the same split the native app made for the same reason:
 *
 *   the deck LIST      small, read on every visit to the hub   -> localStorage
 *   a deck's CARDS     megabytes, read only when it is opened  -> IndexedDB
 *   a deck's MEDIA     Blobs, read only while studying it      -> IndexedDB
 *
 * The list stays in localStorage on purpose: it is what the hub renders, it is
 * a few hundred bytes, and reading it synchronously means the hub has no
 * loading state for the common case of having no imported decks at all.
 *
 * ## Media are Blobs, never data URLs
 *
 * IndexedDB stores `Blob` natively. Turning a 400KB image into a data URL
 * costs a third again in base64 and then lives in a JS string; a Blob costs
 * nothing until `URL.createObjectURL` is called on it, and that URL is
 * revoked when the card leaves the screen. A deck with two hundred images
 * would otherwise be sixty megabytes of string held for as long as the tab is
 * open.
 *
 * ## It stays in this browser
 *
 * There is no row, no bucket and no account here, and that is the same rule
 * the native app follows rather than a browser limitation: a shared deck is
 * somebody else's work the reader downloaded for themselves, and uploading it
 * would be this app redistributing it. `npm run check:cloud-ids` holds that
 * from the network side — this file must never import the Supabase client.
 */
import type { DeckCard } from './flashcards';
import type { ImportedApkg } from './apkgWeb';

/**
 * The deck list. Small, and read on every visit to the flashcards hub.
 *
 * Deliberately **outside** `flashcards.ts`'s `orbit:anki:` schedule namespace.
 * `listStartedDecks` walks localStorage for every key with that prefix and
 * treats what follows as a deck key; a list living in there would be handed to
 * it as one. It survives today only because the split on `::` yields too few
 * parts — which is a coincidence, not a design, and the kind that stops being
 * true the moment someone loosens that check.
 */
const LIST_KEY = 'orbit:anki-imported:web-list';

const DB_NAME = 'orbit-anki';
const DB_VERSION = 1;
const CARDS_STORE = 'cards';
const MEDIA_STORE = 'media';

/**
 * How many cards one import may take.
 *
 * The same number the phone uses, and not for the same reason — a browser has
 * no AsyncStorage value to overflow. It is kept identical so that a package
 * that imports on one imports on the other, and so the truncation message is
 * true in both places. The right answer to a thirty-thousand-card package is
 * still to choose a deck out of it rather than to raise this.
 */
export const MAX_IMPORT_CARDS = 5000;

export interface ImportedDeck {
  id: string;
  /** What the reader called it, defaulting to the package's own deck name. */
  name: string;
  /** The file it came from, so the list can say where a deck is from. */
  source: string;
  cardCount: number;
  /** Decks inside the package that were taken. */
  decks: string[];
  mediaCount: number;
  mediaBytes: number;
  createdAt: number;
  /** True when the package held more cards than `MAX_IMPORT_CARDS`. */
  truncated?: boolean;
}

/**
 * A deck's schedule key, namespaced away from every other kind of deck.
 *
 * Identical to the native app's, so the scheduler's stored state has one shape
 * across both. `loadSchedule`/`saveSchedule` in `flashcards.ts` key off this.
 */
export function importedDeckKey(id: string): string {
  return `imported::${id}`;
}

function newId(): string {
  return `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/* --------------------------------------------------------------- the list */

export function loadImportedDecks(): ImportedDeck[] {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ImportedDeck[]) : [];
  } catch {
    // A private window, cleared site data, or a browser refusing storage. An
    // empty list is the correct answer to all three; there is nothing here
    // worth failing a render over.
    return [];
  }
}

function saveList(decks: ImportedDeck[]): void {
  try {
    localStorage.setItem(LIST_KEY, JSON.stringify(decks));
  } catch {
    /* see loadImportedDecks */
  }
}

/* ------------------------------------------------------------- the store */

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(CARDS_STORE)) db.createObjectStore(CARDS_STORE);
      if (!db.objectStoreNames.contains(MEDIA_STORE)) db.createObjectStore(MEDIA_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB unavailable'));
  });
}

function tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = run(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error('IndexedDB write failed'));
        t.oncomplete = () => db.close();
      })
  );
}

/** Media are keyed per deck so deleting a deck can delete only its own. */
const mediaKey = (deckId: string, name: string) => `${deckId}/${name}`;

/* ------------------------------------------------------------ the import */

/**
 * Turn an opened package into a stored deck.
 *
 * The cards arrive already rendered by `apkgFormat` — templates applied, HTML
 * flattened, media filenames listed. All that happens here is mapping them
 * onto `DeckCard`, which is the one shape the study screen knows.
 *
 * **An imported card may carry pictures on its question side**, and
 * `frontImages` exists for exactly that. It is not a contradiction of the rule
 * that a diagram belongs on the back: that rule is about *our* image cards,
 * where the diagram is the answer. An Anki card's front is whatever its author
 * wrote, and an ECG above "identify this rhythm" is the question.
 */
export async function importPackage(
  pkg: ImportedApkg,
  source: string,
  name?: string
): Promise<ImportedDeck> {
  const id = newId();
  const truncated = pkg.cards.length > MAX_IMPORT_CARDS;
  const taken = truncated ? pkg.cards.slice(0, MAX_IMPORT_CARDS) : pkg.cards;

  const cards: DeckCard[] = taken.map((c) => ({
    id: c.id,
    kind: c.frontMedia.length > 0 || c.backMedia.length > 0 ? 'image' : 'theory',
    front: c.front,
    back: c.back,
    ...(c.frontMedia.length ? { frontImages: c.frontMedia } : null),
    ...(c.backMedia.length ? { backImages: c.backMedia } : null),
    ...(c.tags.length ? { tags: c.tags } : null),
  }));

  // Only the media those cards actually refer to. A package's media pile is
  // whatever its author accumulated; storing a picture no card names is space
  // the reader can never account for.
  const wanted = new Set<string>();
  for (const c of taken) {
    for (const m of c.frontMedia) wanted.add(m);
    for (const m of c.backMedia) wanted.add(m);
  }

  let mediaCount = 0;
  let mediaBytes = 0;
  for (const [fileName, blob] of pkg.media) {
    if (!wanted.has(fileName)) continue;
    await tx(MEDIA_STORE, 'readwrite', (s) => s.put(blob, mediaKey(id, fileName)));
    mediaCount += 1;
    mediaBytes += blob.size;
  }

  await tx(CARDS_STORE, 'readwrite', (s) => s.put(cards, id));

  const deck: ImportedDeck = {
    id,
    name: (name ?? pkg.deckName ?? 'Imported deck').trim() || 'Imported deck',
    source,
    cardCount: cards.length,
    decks: [...new Set(taken.map((c) => c.deck).filter(Boolean))],
    mediaCount,
    mediaBytes,
    createdAt: Date.now(),
    ...(truncated ? { truncated: true } : null),
  };

  saveList([deck, ...loadImportedDecks()]);
  return deck;
}

/* -------------------------------------------------------------- reading */

export async function loadImportedCards(id: string): Promise<DeckCard[]> {
  try {
    const cards = await tx<DeckCard[]>(CARDS_STORE, 'readonly', (s) => s.get(id));
    return Array.isArray(cards) ? cards : [];
  } catch {
    return [];
  }
}

/**
 * An object URL for one of a deck's media files, or null if it is not there.
 *
 * The caller owns the URL and must `URL.revokeObjectURL` it — a card that
 * mints one per render without revoking leaks the whole blob for the life of
 * the tab, which on a deck of photographs is the entire deck.
 */
export async function importedMediaUrl(deckId: string, fileName: string): Promise<string | null> {
  try {
    const blob = await tx<Blob | undefined>(MEDIA_STORE, 'readonly', (s) =>
      s.get(mediaKey(deckId, fileName))
    );
    return blob ? URL.createObjectURL(blob) : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------- editing */

export function renameImportedDeck(id: string, name: string): ImportedDeck[] {
  const next = loadImportedDecks().map((d) =>
    d.id === id ? { ...d, name: name.trim() || d.name } : d
  );
  saveList(next);
  return next;
}

/**
 * Delete a deck, its cards, its media and its schedule.
 *
 * All four, because a forgotten one is space the reader can only see as "this
 * site is using 400MB" with nothing in the app admitting to it. The media loop
 * is a key scan rather than a lookup by name: the deck's own record says how
 * many files there were, but not what they were called, and the prefix is the
 * only thing that knows.
 */
export async function deleteImportedDeck(id: string): Promise<ImportedDeck[]> {
  try {
    await tx(CARDS_STORE, 'readwrite', (s) => s.delete(id));
    const keys = await tx<IDBValidKey[]>(MEDIA_STORE, 'readonly', (s) => s.getAllKeys());
    for (const k of keys) {
      if (typeof k === 'string' && k.startsWith(`${id}/`)) {
        await tx(MEDIA_STORE, 'readwrite', (s) => s.delete(k));
      }
    }
  } catch {
    // The deck still leaves the list below. A stranded blob is recoverable;
    // a deck that will not delete is not.
  }
  try {
    // `orbit:anki:` is flashcards.ts's SCHEDULE_PREFIX, and `importedDeckKey`
    // is the deck key it stores under. Both halves have to match or the
    // schedule outlives the deck and is inherited by the next import that
    // happens to reuse the id.
    localStorage.removeItem(`orbit:anki:${importedDeckKey(id)}`);
  } catch {
    /* see loadImportedDecks */
  }
  const next = loadImportedDecks().filter((d) => d.id !== id);
  saveList(next);
  return next;
}
