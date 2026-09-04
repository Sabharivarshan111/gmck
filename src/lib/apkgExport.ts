import { FIELD_SEPARATOR } from './apkgFormat';

/**
 * The four fields a package actually needs off a card.
 *
 * Declared here rather than imported from `./flashcards`, and that is not
 * fussiness — it is a bug this file already caused once. While this module
 * lived under `mobile/src/lib/`, `./flashcards` meant the React Native one.
 * Moving it to the shared `src/lib/` silently re-pointed the same import at the
 * *web* app's `flashcards.ts`, which reaches for `localStorage` and the
 * Supabase browser client, and dragged both into the native app's typecheck.
 *
 * Nothing caught it except tsc, because the two `DeckCard` types are
 * structurally identical — the binding changed, the shape did not. A shared
 * module that names no app cannot be re-pointed by being moved.
 *
 * Both apps' `DeckCard` satisfies this structurally, so neither has to change.
 */
export interface ExportableCard {
  front?: string;
  back?: string;
  /** A `data:` URI. Anything else is skipped rather than fetched. */
  imageUrl?: string;
  tags?: string[];
}

/**
 * Writing an Anki package, so a deck you wrote can be given to somebody.
 *
 * The mirror of `apkgFormat.ts`, and the same split: everything that decides
 * what goes *in* the file is here, in TypeScript, where `npm run check:apkg`
 * can build a real package from it and read it back with the importer. Kotlin
 * only writes the bytes — a SQLite database and a ZIP, both of which Android
 * already has.
 *
 * ## It writes the oldest format on purpose
 *
 * Three package layouts exist and this produces version 1: a plain
 * `collection.anki2` at schema 11, a JSON media map, no `meta` entry and **no
 * zstd**. That is not laziness, it is the only choice that makes the file
 * useful:
 *
 * - **Every Anki ever released can open it.** A version 3 package is refused
 *   outright by anything before 2.1.50, and the person being given this deck
 *   did not choose their Anki version.
 * - **Nothing has to compress.** The newer format would mean zstd on the way
 *   out as well as in — for a file that is a few hundred kilobytes of text.
 * - **It round-trips through our own importer**, which is what
 *   `check:apkg` asserts.
 *
 * The cost is size, and there is nothing here big enough for that to matter: a
 * deck somebody typed is a few hundred cards.
 */

/** Anki's own Basic notetype id. Any stable number works; this one is ours. */
const NOTETYPE_ID = 1_600_000_900_001;
const DECK_ID = 1_600_000_900_002;

/** A row of `notes`, ready to be inserted verbatim. */
export interface ExportNote {
  id: number;
  guid: string;
  mid: number;
  mod: number;
  tags: string;
  flds: string;
  sfld: string;
  csum: number;
}

/** A row of `cards`. */
export interface ExportCard {
  id: number;
  nid: number;
  did: number;
  ord: number;
  mod: number;
  due: number;
}

export interface ExportPackage {
  /** `col.models`, as the JSON string the column holds. */
  models: string;
  /** `col.decks`. */
  decks: string;
  conf: string;
  dconf: string;
  /** Seconds since the epoch: Anki's day boundary is measured from this. */
  crt: number;
  notes: ExportNote[];
  cards: ExportCard[];
  /**
   * The media map, `{ "0": "picture-1.jpg" }`, and the bytes for each.
   *
   * A media file's zip entry is named for its **index**, not for the file — so
   * the map is the only thing that knows which is which, on the way out as
   * much as on the way in.
   */
  media: { index: string; name: string; base64: string }[];
  /** What the file should be called. */
  fileName: string;
}

/* ---------------------------------------------------------------- sha1 */

/**
 * SHA-1, for the `csum` column.
 *
 * Anki stores the first eight hex digits of the sha1 of a note's first field
 * and uses it to find duplicates on import. A wrong one is not fatal — the
 * cards still import — but it makes Anki's duplicate check answer nonsense,
 * which is exactly the sort of thing nobody would ever trace back to here.
 *
 * Written out rather than taken from a library or from Kotlin's MessageDigest:
 * it is thirty lines, and doing it here means the whole payload is built in
 * one place that `check:apkg` can run.
 */
export function sha1Hex(text: string): string {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }

  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) {
    bytes.push(0);
  }
  // The length goes in as 64 bits big-endian. The high word is always zero
  // here — a note field long enough to need it does not exist.
  bytes.push(0, 0, 0, 0);
  bytes.push((bitLength >>> 24) & 0xff, (bitLength >>> 16) & 0xff, (bitLength >>> 8) & 0xff, bitLength & 0xff);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const rotate = (value: number, by: number) => ((value << by) | (value >>> (32 - by))) >>> 0;

  const words = new Array<number>(80);
  for (let block = 0; block < bytes.length; block += 64) {
    for (let i = 0; i < 16; i += 1) {
      const at = block + i * 4;
      words[i] =
        ((bytes[at] << 24) | (bytes[at + 1] << 16) | (bytes[at + 2] << 8) | bytes[at + 3]) >>> 0;
    }
    for (let i = 16; i < 80; i += 1) {
      words[i] = rotate(words[i - 3] ^ words[i - 8] ^ words[i - 14] ^ words[i - 16], 1);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let i = 0; i < 80; i += 1) {
      let f: number;
      let k: number;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const next = (rotate(a, 5) + f + e + k + words[i]) >>> 0;
      e = d;
      d = c;
      c = rotate(b, 30);
      b = a;
      a = next;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  return [h0, h1, h2, h3, h4].map(word => word.toString(16).padStart(8, '0')).join('');
}

/** Anki's `csum`: the first eight hex digits of the sha1, as an integer. */
export function fieldChecksum(text: string): number {
  return Number.parseInt(sha1Hex(text).slice(0, 8), 16);
}

/* ------------------------------------------------------------ the models */

/**
 * One notetype: Basic, with Front and Back.
 *
 * A deck written in this app has exactly one shape of card — a question and an
 * answer, sometimes with a picture — so exporting anything more elaborate
 * would be inventing structure the cards do not have. Basic is also the
 * notetype every Anki user already has, which means the import has nothing to
 * reconcile.
 */
function models(): string {
  return JSON.stringify({
    [String(NOTETYPE_ID)]: {
      id: NOTETYPE_ID,
      name: 'Orbit Basic',
      type: 0,
      mod: 0,
      usn: -1,
      sortf: 0,
      did: DECK_ID,
      css: '.card { font-family: arial; font-size: 20px; text-align: center; }',
      latexPre: '',
      latexPost: '',
      latexsvg: false,
      req: [[0, 'any', [0]]],
      flds: [
        { name: 'Front', ord: 0, sticky: false, rtl: false, font: 'Arial', size: 20, description: '' },
        { name: 'Back', ord: 1, sticky: false, rtl: false, font: 'Arial', size: 20, description: '' },
      ],
      tmpls: [
        {
          name: 'Card 1',
          ord: 0,
          qfmt: '{{Front}}',
          afmt: '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}',
          bqfmt: '',
          bafmt: '',
          did: null,
          bfont: '',
          bsize: 0,
        },
      ],
    },
  });
}

function decks(name: string): string {
  return JSON.stringify({
    [String(DECK_ID)]: {
      id: DECK_ID,
      name,
      mod: 0,
      usn: -1,
      lrnToday: [0, 0],
      revToday: [0, 0],
      newToday: [0, 0],
      timeToday: [0, 0],
      collapsed: false,
      browserCollapsed: false,
      desc: 'Made in Orbit MBBS.',
      dyn: 0,
      conf: 1,
      extendNew: 0,
      extendRev: 0,
    },
  });
}

/**
 * A deck name Anki will accept.
 *
 * `::` is how Anki nests decks, so a deck called "Anatomy :: revision" would
 * arrive as a *subdeck* of one called "Anatomy". Quotes and control characters
 * are stripped for the same reason a filename is.
 */
export function safeDeckName(name: string): string {
  const cleaned = name
    .replace(/::/g, '-')
    .replace(/[\x00-\x1f\x7f"]/g, '')
    .trim();
  return cleaned.slice(0, 80) || 'Orbit deck';
}

/** A filename that will survive a share sheet, an email and a Windows box. */
export function safeFileName(name: string): string {
  const cleaned = name
    .replace(/[^A-Za-z0-9 _-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `${(cleaned || 'Orbit deck').slice(0, 60)}.apkg`;
}

/* ------------------------------------------------------------- the build */

/** `data:image/png;base64,…` split into its type and its bytes. */
function readDataUri(uri: string): { extension: string; base64: string } | null {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(uri);
  if (!match) {
    return null;
  }
  const subtype = match[1].split('/')[1] ?? 'jpeg';
  const extension = subtype === 'jpeg' ? 'jpg' : subtype.replace(/[^a-z0-9]/gi, '').slice(0, 5);
  return { extension: extension || 'jpg', base64: match[2] };
}

/**
 * Turn a deck into everything a package needs.
 *
 * Ids are milliseconds, which is what Anki uses and what makes them unique
 * without a counter — but two cards written in the same millisecond would
 * collide, so each one steps forward from the last.
 */
export function buildExport(
  deck: { name: string; cards: ExportableCard[] },
  now = Date.now(),
): ExportPackage {
  const name = safeDeckName(deck.name);
  const notes: ExportNote[] = [];
  const cards: ExportCard[] = [];
  const media: ExportPackage['media'] = [];

  let id = now;
  deck.cards.forEach((card, index) => {
    id += 1;

    /*
     * A picture becomes an `<img>` in the answer, which is what Anki reads.
     * The bytes go into the package beside the collection — a data URI in a
     * field would be a field several hundred kilobytes long that Anki would
     * store, sync and never be able to show.
     */
    let back = card.back ?? '';
    if (card.imageUrl) {
      const picture = readDataUri(card.imageUrl);
      if (picture) {
        const fileName = `orbit-${id.toString(36)}.${picture.extension}`;
        media.push({ index: String(media.length), name: fileName, base64: picture.base64 });
        back = `${back ? `${back}<br>` : ''}<img src="${fileName}">`;
      }
    }

    const front = (card.front ?? '').trim();
    /*
     * An empty front is a card nobody can answer, and Anki's own importer
     * would drop it. Dropping it here means the count on the share sheet is
     * the count that arrives.
     */
    if (!front && !back) {
      return;
    }

    const flds = `${front}${FIELD_SEPARATOR}${back}`;
    notes.push({
      id,
      // Any stable unique string. Anki matches notes across imports on this,
      // so re-sending an updated deck updates rather than duplicates.
      guid: `orbit${id.toString(36)}`,
      mid: NOTETYPE_ID,
      mod: Math.floor(now / 1000),
      tags: card.tags?.length ? ` ${card.tags.join(' ')} ` : '',
      flds,
      sfld: front,
      csum: fieldChecksum(front),
    });
    cards.push({
      id: id + 500_000,
      nid: id,
      did: DECK_ID,
      ord: 0,
      mod: Math.floor(now / 1000),
      // `due` for a new card is its position in the queue, so the deck opens
      // in the order it was written rather than shuffled.
      due: index + 1,
    });
  });

  return {
    models: models(),
    decks: decks(name),
    conf: JSON.stringify({
      nextPos: notes.length + 1,
      estTimes: true,
      activeDecks: [DECK_ID],
      sortType: 'noteFld',
      timeLim: 0,
      sortBackwards: false,
      addToCur: true,
      curDeck: DECK_ID,
      newBury: true,
      newSpread: 0,
      dueCounts: true,
      curModel: String(NOTETYPE_ID),
      collapseTime: 1200,
    }),
    dconf: JSON.stringify({
      '1': {
        id: 1,
        name: 'Default',
        mod: 0,
        usn: 0,
        maxTaken: 60,
        autoplay: true,
        timer: 0,
        replayq: true,
        new: {
          bury: false,
          delays: [1, 10],
          initialFactor: 2500,
          ints: [1, 4, 7],
          order: 1,
          perDay: 20,
        },
        rev: {
          bury: false,
          ease4: 1.3,
          ivlFct: 1,
          maxIvl: 36500,
          perDay: 200,
          hardFactor: 1.2,
        },
        lapse: { delays: [10], leechAction: 1, leechFails: 8, minInt: 1, mult: 0 },
        dyn: false,
      },
    }),
    // Anki's day rolls at 4am local, and the creation stamp is what every
    // interval is measured from. Today at 4am is what a fresh collection gets.
    crt: Math.floor(startOfAnkiDay(now) / 1000),
    notes,
    cards,
    media,
    fileName: safeFileName(deck.name),
  };
}

/** Today's 4am, which is where Anki puts a new collection's creation stamp. */
export function startOfAnkiDay(now: number): number {
  const date = new Date(now);
  date.setHours(4, 0, 0, 0);
  if (date.getTime() > now) {
    date.setDate(date.getDate() - 1);
  }
  return date.getTime();
}

/** The `media` entry: a JSON map of zip entry name to filename. */
export function mediaMap(pkg: ExportPackage): string {
  return JSON.stringify(Object.fromEntries(pkg.media.map(item => [item.index, item.name])));
}
