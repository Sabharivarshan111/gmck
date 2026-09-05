import AsyncStorage from '@react-native-async-storage/async-storage';
import OrbitApkg from '@/native/NativeOrbitApkg';
import type { DeckCard } from './flashcards';
import {
  ApkgError,
  cardsFromCollection,
  deckIdList,
  decodeLegacyMediaMap,
  decodeMediaEntries,
  decodeNotetypeConfig,
  decodeTemplateConfig,
  deckName,
  mediaToExtract,
  packageLayout,
  parseLegacyDecks,
  parseLegacyNotetypes,
  referencedMedia,
  type ApkgCard,
  type ApkgCollection,
  type ApkgMediaEntry,
  type ApkgNotetype,
} from '@shared/apkgFormat';
import { buildExport } from '@shared/apkgExport';
import { warn } from './log';

/**
 * Decks imported from an Anki `.apkg`.
 *
 * **On this phone, and nowhere else** — the same rule the decks you write
 * follow, for a stronger reason. A shared deck is somebody else's copyrighted
 * work that the reader downloaded for themselves; uploading it to this app's
 * server would be this app redistributing it. `npm run check:cloud-ids`
 * enforces that from the network side.
 *
 * ## Why these are not `CustomDeck`s
 *
 * The decks you write live in **one** AsyncStorage value, with pictures inline
 * as data URIs, capped at forty image cards. That is exactly right for a deck
 * somebody typed: it is small, and holding it in one value means the deck list
 * loads in one read.
 *
 * An imported deck breaks every one of those assumptions. A shared medical
 * deck is thousands of cards and hundreds of megabytes of pictures, so:
 *
 * - **The cards go in a key of their own**, one per deck. The deck *list* is
 *   still one small value holding names and counts, so opening Flashcards
 *   never parses a card. Putting them in the shared list would make reading
 *   the deck titles a multi-megabyte parse — the same reason a note's pictures
 *   are one key each rather than inline.
 * - **The pictures are files**, in `filesDir/anki-media/{id}/`, referenced by
 *   `file://` path. Base64 in a store is the one thing that cannot scale here.
 * - **There is a cap on cards, and it is honest about itself.** A package with
 *   more is imported up to it and the screen says so, rather than refusing a
 *   deck the reader has just waited to copy in.
 */

/** The deck list: names and counts, small enough to read on every open. */
const LIST_KEY = 'orbit:anki:imported-decks';

/** One deck's cards. Read only when that deck is opened. */
const cardsKey = (id: string) => `orbit:anki:imported-cards:${id}`;

/**
 * How many cards one import may take.
 *
 * Not a limit of the format and not a guess: it is what one AsyncStorage value
 * can hold and still be read quickly. A card is a few hundred bytes of text,
 * so five thousand is a couple of megabytes — a slow read, but a read that
 * happens once when the deck is opened rather than on every screen.
 *
 * The right answer for a thirty-thousand-card package is not a bigger number,
 * it is choosing a deck out of it: `deckSummary` lists what is inside and the
 * import screen asks. A student wants the cardiology chapter, not all of
 * AnKing on a phone with 8GB of storage.
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

/** A deck's schedule key, namespaced away from every other kind of deck. */
export function importedDeckKey(id: string): string {
  return `imported::${id}`;
}

function newId(): string {
  return `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/* --------------------------------------------------------------- the list */

export async function loadImportedDecks(): Promise<ImportedDeck[]> {
  try {
    const raw = await AsyncStorage.getItem(LIST_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (deck): deck is ImportedDeck =>
        !!deck &&
        typeof (deck as ImportedDeck).id === 'string' &&
        typeof (deck as ImportedDeck).name === 'string',
    );
  } catch {
    // A list that will not parse is returned empty rather than thrown: a
    // screen that crashes on open cannot show the decks either.
    return [];
  }
}

async function persistList(decks: ImportedDeck[]): Promise<void> {
  await AsyncStorage.setItem(LIST_KEY, JSON.stringify(decks));
}

/** One deck's cards, read only when it is opened. */
export async function loadImportedCards(id: string): Promise<DeckCard[]> {
  try {
    const raw = await AsyncStorage.getItem(cardsKey(id));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as DeckCard[]) : [];
  } catch {
    return [];
  }
}

export async function renameImportedDeck(id: string, name: string): Promise<ImportedDeck[]> {
  const decks = await loadImportedDecks();
  const next = decks.map(deck =>
    deck.id === id ? { ...deck, name: name.trim().slice(0, 80) || deck.name } : deck,
  );
  await persistList(next);
  return next;
}

/**
 * Delete a deck, its cards, its schedule and its pictures.
 *
 * All four, because nothing else references any of them and a forgotten media
 * folder is hundreds of megabytes the reader can never account for — they
 * would see it only as "Orbit is using 400MB" in Android's settings.
 */
export async function deleteImportedDeck(id: string): Promise<ImportedDeck[]> {
  const decks = await loadImportedDecks();
  const next = decks.filter(deck => deck.id !== id);
  await persistList(next);
  await AsyncStorage.removeItem(cardsKey(id)).catch(() => {});
  await AsyncStorage.removeItem(`orbit:anki:${importedDeckKey(id)}`).catch(() => {});
  try {
    OrbitApkg?.forget(id);
  } catch (error) {
    warn('[importedDecks] could not remove media for', id, error);
  }
  return next;
}

/* ------------------------------------------------------------- the export */

/**
 * Write a deck out as an `.apkg` and offer it to the share sheet.
 *
 * The other direction, and the reason it is worth having: a deck somebody
 * typed is stuck on their phone otherwise. An `.apkg` is the one format that
 * is worth anything to the person receiving it — it opens in Anki on any
 * platform, and it opens in this app's own importer.
 *
 * Everything about what goes in the file is decided in `apkgExport.ts`, which
 * `npm run check:apkg` builds a real package from and reads back through the
 * importer. This is the two native calls.
 */
export async function shareWrittenDeck(deck: {
  name: string;
  cards: DeckCard[];
}): Promise<{ shared: boolean; cards: number }> {
  const native = available();
  const payload = buildExport(deck);
  if (payload.notes.length === 0) {
    throw new ApkgError('empty', 'There are no finished cards in this deck to share yet.');
  }
  const path = await native.exportDeck(JSON.stringify(payload));
  const shared = await native.share(path);
  return { shared, cards: payload.notes.length };
}

/* ------------------------------------------------------------- the import */

/** A package that has been staged and read far enough to ask about. */
export interface StagedPackage {
  path: string;
  fileName: string;
  bytes: number;
  entry: string;
  zstd: boolean;
  mediaListIsHashmap: boolean;
  version: number;
  /** The decks inside, largest first, for the reader to choose from. */
  decks: { id: string; name: string; cards: number }[];
  totalCards: number;
}

function base64ToBytes(base64: string): Uint8Array {
  /*
   * Hermes has `atob`, but not on every version this app still runs on, and a
   * table decode is a dozen lines. The strings this decodes are small — the
   * package's `meta`, its media list, and a protobuf config per notetype.
   */
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let at = 0;
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = alphabet.indexOf(char);
    if (value < 0) {
      continue;
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[at] = (buffer >> bits) & 0xff;
      at += 1;
    }
  }
  return out.subarray(0, at);
}

function available(): NonNullable<typeof OrbitApkg> {
  if (!OrbitApkg) {
    throw new ApkgError(
      'native',
      'Importing Anki decks needs the app itself — it does not work in the browser preview.',
    );
  }
  return OrbitApkg;
}

/**
 * Ask for a package, and read enough of it to say what is inside.
 *
 * Returns null when the reader cancelled. Everything expensive — the cards,
 * the pictures — waits until they have chosen which decks they want.
 */
export async function stagePackage(): Promise<StagedPackage | null> {
  return stageStaged(await available().pick());
}

/**
 * The package the app was opened with, if a `.apkg` was tapped elsewhere.
 *
 * Returns null on an ordinary launch, which is almost every launch, so a
 * screen can call this on mount without deciding first whether to. The native
 * side clears the intent as it hands the file over, so this yields a package
 * once and then null — an import the reader backed out of does not reopen
 * itself every time they switch back to the app.
 */
export async function stageLaunchPackage(): Promise<StagedPackage | null> {
  if (!OrbitApkg) {
    return null;
  }
  return stageStaged(await OrbitApkg.takeLaunchFile());
}

/**
 * Everything both entry points share: check it is a package, survey it, and
 * report what is inside.
 *
 * One body rather than two, because the interesting part — the version
 * decision, and the decoy collection every v3 package carries — must not exist
 * twice. A file that arrived from WhatsApp is the same file as one chosen in
 * the picker.
 */
async function stageStaged(picked: string): Promise<StagedPackage | null> {
  const native = available();
  if (!picked) {
    return null;
  }
  const file = JSON.parse(picked) as { path: string; name: string; size: number };

  if (!/\.(apkg|colpkg)$/i.test(file.name)) {
    native.discard(file.path);
    throw new ApkgError(
      'notAPackage',
      `${file.name} is not an Anki package. Look for a file ending in .apkg.`,
    );
  }

  const survey = JSON.parse(await native.survey(file.path)) as {
    entries: { name: string; size: number }[];
    meta: string | null;
  };

  /*
   * The version decision, made here rather than in Kotlin, because it is the
   * one place this format sets a trap and it is covered by `check:apkg`:
   * every version 3 package also carries a decoy `collection.anki2` holding
   * one note that says the file needs a newer Anki.
   */
  const layout = packageLayout(
    survey.entries.map(entry => entry.name),
    survey.meta ? base64ToBytes(survey.meta) : null,
  );

  const overview = JSON.parse(
    await native.surveyCollection(file.path, layout.collectionEntry, layout.zstd),
  ) as {
    modern: boolean;
    notetypes: { legacyDecks?: string; notetypes?: unknown[] };
    decks: { id: string; name: string }[];
    deckCounts: Record<string, number>;
  };

  const decks = overview.modern
    ? overview.decks
    : parseLegacyDecks(overview.notetypes.legacyDecks ?? '{}');

  const counted = decks
    .map(deck => ({
      id: deck.id,
      name: deckName(deck.name),
      cards: overview.deckCounts[deck.id] ?? 0,
    }))
    .filter(deck => deck.cards > 0)
    .sort((a, b) => b.cards - a.cards || a.name.localeCompare(b.name));

  const totalCards = Object.values(overview.deckCounts).reduce((sum, n) => sum + n, 0);
  if (totalCards === 0) {
    native.discard(file.path);
    throw new ApkgError('empty', 'There are no cards in this package.');
  }

  return {
    path: file.path,
    fileName: file.name,
    bytes: file.size,
    entry: layout.collectionEntry,
    zstd: layout.zstd,
    mediaListIsHashmap: layout.mediaListIsHashmap,
    version: layout.version,
    decks: counted,
    totalCards,
  };
}

/** Give up on a staged package without importing it. */
export function discardPackage(staged: StagedPackage): void {
  try {
    OrbitApkg?.discard(staged.path);
  } catch {
    // The staging directory is a cache; Android will reclaim it regardless.
  }
}

/** Turn what Kotlin read into the shape the renderer works on. */
function toCollection(raw: {
  schema: number;
  notetypes: { legacyModels?: string; legacyDecks?: string; notetypes?: unknown[] };
  decks: { id: string; name: string }[];
  cards: ApkgCollection['cards'];
}): ApkgCollection {
  const modern = Array.isArray(raw.notetypes.notetypes);
  const notetypes: ApkgNotetype[] = modern
    ? (raw.notetypes.notetypes as {
        id: string;
        name: string;
        config: string;
        fields: string[];
        templates: { name: string; config: string }[];
      }[]).map(type => ({
        id: type.id,
        name: type.name,
        cloze: decodeNotetypeConfig(base64ToBytes(type.config)).cloze,
        fields: type.fields,
        templates: type.templates.map(template => {
          const config = decodeTemplateConfig(base64ToBytes(template.config));
          return { name: template.name, qfmt: config.qfmt, afmt: config.afmt };
        }),
      }))
    : parseLegacyNotetypes(raw.notetypes.legacyModels ?? '{}');

  const decks = modern ? raw.decks : parseLegacyDecks(raw.notetypes.legacyDecks ?? '{}');

  return { schema: raw.schema, notetypes, decks, cards: raw.cards };
}

export interface ImportProgress {
  step: 'reading' | 'cards' | 'media' | 'saving';
  detail?: string;
}

/**
 * Import the chosen decks out of a staged package.
 *
 * `deckIds` empty means everything in it.
 */
export async function importPackage(
  staged: StagedPackage,
  options: { name?: string; deckIds?: string[]; onProgress?: (p: ImportProgress) => void } = {},
): Promise<ImportedDeck> {
  const native = available();
  const report = options.onProgress ?? (() => {});
  const id = newId();

  report({ step: 'reading' });
  const raw = JSON.parse(
    await native.readCollection(
      staged.path,
      staged.entry,
      staged.zstd,
      deckIdList(options.deckIds ?? []),
      MAX_IMPORT_CARDS,
    ),
  );
  const collection = toCollection(raw);

  report({ step: 'cards' });
  const cards = cardsFromCollection(collection, { limit: MAX_IMPORT_CARDS });
  if (cards.length === 0) {
    discardPackage(staged);
    throw new ApkgError('empty', 'Nothing in this package could be turned into a card.');
  }

  /* ---- the pictures, and only the ones these cards point at ---- */

  report({ step: 'media', detail: 'pictures' });
  let entries: ApkgMediaEntry[] = [];
  try {
    const mediaBase64 = await native.readEntry(staged.path, 'media', staged.zstd);
    if (mediaBase64) {
      const bytes = base64ToBytes(mediaBase64);
      entries = staged.mediaListIsHashmap
        ? decodeLegacyMediaMap(new TextDecoderLite().decode(bytes))
        : decodeMediaEntries(bytes);
    }
  } catch (error) {
    // A package with no media at all is normal, and a media list that will not
    // parse costs pictures rather than the whole deck.
    warn('[importedDecks] media list unreadable:', error);
  }

  const wanted = referencedMedia(cards);
  const plan = mediaToExtract(entries, wanted);
  let mediaDir = '';
  let mediaBytes = 0;
  let written = 0;
  if (plan.length > 0) {
    const result = JSON.parse(
      await native.extractMedia(staged.path, id, JSON.stringify(plan), staged.zstd),
    ) as { written: number; bytes: number; dir: string };
    mediaDir = result.dir;
    mediaBytes = result.bytes;
    written = result.written;
  }

  report({ step: 'saving' });
  const deckCards = cards.map(card => toDeckCard(card, mediaDir));

  await AsyncStorage.setItem(cardsKey(id), JSON.stringify(deckCards));

  const decks = [...new Set(cards.map(card => card.deck))];
  const deck: ImportedDeck = {
    id,
    name:
      options.name?.trim() ||
      // The package's own deck name reads better than the filename, which is
      // routinely `deck-1699887342.apkg`.
      (decks.length === 1 ? decks[0] : staged.fileName.replace(/\.(apkg|colpkg)$/i, '')),
    source: staged.fileName,
    cardCount: deckCards.length,
    decks,
    mediaCount: written,
    mediaBytes,
    createdAt: Date.now(),
    truncated: staged.totalCards > deckCards.length,
  };

  await persistList([deck, ...(await loadImportedDecks())]);
  discardPackage(staged);
  return deck;
}

/**
 * One Anki card as this app's renderer wants it.
 *
 * A media filename becomes a `file://` path into this deck's own folder. The
 * front may carry a picture, which is the one place an imported card differs
 * from a generated one: our image cards put the diagram on the back because
 * the diagram *is* the answer, while an Anki card's front is whatever its
 * author wrote — an ECG on the question side is the question.
 */
function toDeckCard(card: ApkgCard, mediaDir: string): DeckCard {
  const toUri = (name: string) => `file://${mediaDir}/${safeMediaName(name)}`;
  const frontImages = mediaDir ? card.frontMedia.map(toUri) : [];
  const backImages = mediaDir ? card.backMedia.map(toUri) : [];
  return {
    id: card.id,
    kind: backImages.length > 0 || frontImages.length > 0 ? 'image' : 'theory',
    front: card.front,
    back: card.back,
    ...(backImages.length > 0 ? { imageUrl: backImages[0] } : null),
    ...(frontImages.length > 0 ? { frontImages } : null),
    ...(backImages.length > 0 ? { backImages } : null),
    tags: card.tags,
  };
}

/**
 * The filename `ApkgModule.safeName` writes the file under.
 *
 * A copy of that rule rather than a shared one, because the two run in
 * different languages either side of the bridge; `check:apkg` pins them to
 * each other so a change to one fails rather than producing paths that point
 * at nothing.
 */
export function safeMediaName(name: string): string {
  const base = name.split('/').pop()?.split('\\').pop() ?? '';
  const cleaned = base
    .split('')
    .filter(char => /[A-Za-z0-9._\-() []\]]/.test(char))
    .join('')
    .trim();
  if (!cleaned || cleaned === '.' || cleaned === '..') {
    return 'file';
  }
  return cleaned.slice(0, 120);
}

/**
 * The tiniest UTF-8 decode, for the legacy media map.
 *
 * The same reason `apkgFormat` has one: `TextDecoder` is not in this project's
 * TypeScript lib, and a media list is not the place to find out which runtime
 * has it.
 */
class TextDecoderLite {
  decode(bytes: Uint8Array): string {
    let out = '';
    for (let i = 0; i < bytes.length; i += 1) {
      const byte = bytes[i];
      if (byte < 0x80) {
        out += String.fromCharCode(byte);
      } else if ((byte & 0xe0) === 0xc0) {
        out += String.fromCharCode(((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
        i += 1;
      } else if ((byte & 0xf0) === 0xe0) {
        out += String.fromCharCode(
          ((byte & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f),
        );
        i += 2;
      } else {
        const code =
          ((byte & 0x07) << 18) |
          ((bytes[i + 1] & 0x3f) << 12) |
          ((bytes[i + 2] & 0x3f) << 6) |
          (bytes[i + 3] & 0x3f);
        out += String.fromCodePoint(code);
        i += 3;
      }
    }
    return out;
  }
}
