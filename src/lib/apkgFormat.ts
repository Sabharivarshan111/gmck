/**
 * The Anki package format, read rather than guessed at.
 *
 * An `.apkg` is a ZIP holding a SQLite collection and a numbered pile of media
 * files. Everything in here is the part of reading one that can be decided
 * without touching a file: which entry in the zip is the real collection, what
 * a note's fields turn into once its card template has been applied, what a
 * cloze deletion hides, and which pictures a card refers to.
 *
 * It is deliberately all pure functions over plain data. The zip, the zstd and
 * the SQLite are Android's problem (`OrbitApkg`); none of them can be run in a
 * sandbox, so anything that lives on that side cannot be tested until it is on
 * a phone. Everything here runs in Node against real `.apkg` files built by
 * `scripts/make-apkg-fixtures.py`, and `npm run check:apkg` does exactly that.
 *
 * The shapes below are checked against `ankitects/anki` at
 * `rslib/src/import_export/package/` — meta.rs, media.rs and colpkg/export.rs
 * — and `rslib/src/cloze.rs`. Where a rule looks arbitrary it is quoted.
 */

/* ------------------------------------------------------------------ types */

/**
 * Which of the three package layouts this file is.
 *
 * 1 — no `meta` entry at all; the collection is `collection.anki2`, schema 11.
 * 2 — `meta` says 2; the collection is `collection.anki21`, still schema 11.
 * 3 — `meta` says 3; the collection is `collection.anki21b`, **zstd**, schema 18.
 */
export type ApkgVersion = 1 | 2 | 3;

export interface ApkgLayout {
  version: ApkgVersion;
  /** The zip entry holding the collection database. */
  collectionEntry: string;
  /** Whether that entry, the media list and every media file are zstd. */
  zstd: boolean;
  /** Whether the `media` entry is a JSON hashmap rather than a protobuf. */
  mediaListIsHashmap: boolean;
}

/** One notetype, however the collection happened to store it. */
export interface ApkgNotetype {
  id: string;
  name: string;
  /** Cloze notetypes generate a card per cloze number, not per template. */
  cloze: boolean;
  /** Field names in ordinal order; a note's `flds` is in the same order. */
  fields: string[];
  templates: { name: string; qfmt: string; afmt: string }[];
}

/** One row of `cards`, joined to its note. Ids are strings: they are int64. */
export interface ApkgCardRow {
  id: string;
  nid: string;
  did: string;
  ord: number;
  mid: string;
  /** The note's fields, still joined by the unit separator. */
  flds: string;
  tags: string;
}

export interface ApkgCollection {
  schema: number;
  notetypes: ApkgNotetype[];
  decks: { id: string; name: string }[];
  cards: ApkgCardRow[];
}

/** A card once its template has been applied and its HTML flattened. */
export interface ApkgCard {
  /** Stable across re-imports of the same package: the Anki card id. */
  id: string;
  deck: string;
  front: string;
  back: string;
  tags: string[];
  /** Media filenames as written in the note, before they become paths. */
  frontMedia: string[];
  backMedia: string[];
  audio: string[];
}

/** Anki joins a note's fields with the unit separator. */
export const FIELD_SEPARATOR = '\x1f';

/**
 * Every media file in the zip is named for its **position in the media list**,
 * not for what it is. `"0"`, `"1"`, `"2"`. The list is the only thing that
 * knows `3` is `heart-anatomy.png`.
 */
export interface ApkgMediaEntry {
  /** The zip entry name — the index, as a string. */
  index: string;
  /** The filename the note text refers to. */
  name: string;
}

/* -------------------------------------------------------------- protobuf */

/*
 * Anki stores four things as protobuf: the package version, the media list,
 * and — in schema 18 — each notetype's and each template's configuration.
 *
 * All four are small and use two wire types, so a library would be more code
 * than the reader. This is not a general protobuf implementation and does not
 * try to be: it reads the fields these four messages actually carry and skips
 * everything else by wire type.
 */

interface Reader {
  bytes: Uint8Array;
  at: number;
}

function readVarint(reader: Reader): number {
  let result = 0;
  let shift = 0;
  while (reader.at < reader.bytes.length) {
    const byte = reader.bytes[reader.at];
    reader.at += 1;
    result += (byte & 0x7f) * Math.pow(2, shift);
    if ((byte & 0x80) === 0) {
      return result;
    }
    shift += 7;
    // A varint longer than ten bytes is not a varint, and continuing would
    // spin to the end of the buffer producing a nonsense number.
    if (shift > 63) {
      break;
    }
  }
  return result;
}

function readBytes(reader: Reader): Uint8Array {
  const length = readVarint(reader);
  const end = Math.min(reader.bytes.length, reader.at + length);
  const slice = reader.bytes.subarray(reader.at, end);
  reader.at = end;
  return slice;
}

/**
 * UTF-8, by hand.
 *
 * `TextDecoder` exists in Hermes and in Node, but it is not in this project's
 * TypeScript lib and a card's text is not the place to find out which runtimes
 * have it. Protobuf strings are UTF-8 by definition, so this is the whole job.
 */
function decodeUtf8(bytes: Uint8Array): string {
  let out = '';
  let at = 0;
  while (at < bytes.length) {
    const byte = bytes[at];
    let code: number;
    let width: number;
    if (byte < 0x80) {
      code = byte;
      width = 1;
    } else if ((byte & 0xe0) === 0xc0) {
      code = byte & 0x1f;
      width = 2;
    } else if ((byte & 0xf0) === 0xe0) {
      code = byte & 0x0f;
      width = 3;
    } else if ((byte & 0xf8) === 0xf0) {
      code = byte & 0x07;
      width = 4;
    } else {
      // A stray continuation byte. Replace it rather than stop: one bad byte
      // in a field is a smudged character, not a deck that will not import.
      out += '�';
      at += 1;
      continue;
    }
    if (at + width > bytes.length) {
      out += '�';
      break;
    }
    for (let i = 1; i < width; i += 1) {
      code = (code << 6) | (bytes[at + i] & 0x3f);
    }
    at += width;
    out += code > 0xffff ? String.fromCodePoint(code) : String.fromCharCode(code);
  }
  return out;
}

function readString(reader: Reader): string {
  return decodeUtf8(readBytes(reader));
}

/** Step over a field this reader does not care about. */
function skipField(reader: Reader, wire: number): void {
  if (wire === 0) {
    readVarint(reader);
  } else if (wire === 1) {
    reader.at += 8;
  } else if (wire === 2) {
    readBytes(reader);
  } else if (wire === 5) {
    reader.at += 4;
  } else {
    // Groups (3 and 4) are gone from proto3 and appear in none of these
    // messages. Stopping is better than walking off the end.
    reader.at = reader.bytes.length;
  }
}

/** Walk a message, handing each field's number and wire type to `visit`. */
function eachField(
  bytes: Uint8Array,
  visit: (field: number, wire: number, reader: Reader) => boolean,
): void {
  const reader: Reader = { bytes, at: 0 };
  while (reader.at < bytes.length) {
    const key = readVarint(reader);
    const field = key >>> 3;
    const wire = key & 7;
    if (!visit(field, wire, reader)) {
      skipField(reader, wire);
    }
  }
}

/**
 * `PackageMetadata { Version version = 1 }`.
 *
 * Returns 0 for a `meta` that carries no version, which anki treats as
 * "too new to read" rather than as a legacy file.
 */
export function decodePackageMeta(bytes: Uint8Array): number {
  let version = 0;
  eachField(bytes, (field, wire, reader) => {
    if (field === 1 && wire === 0) {
      version = readVarint(reader);
      return true;
    }
    return false;
  });
  return version;
}

/** `MediaEntries { repeated MediaEntry { string name = 1 } entries = 1 }`. */
export function decodeMediaEntries(bytes: Uint8Array): ApkgMediaEntry[] {
  const out: ApkgMediaEntry[] = [];
  eachField(bytes, (field, wire, reader) => {
    if (field !== 1 || wire !== 2) {
      return false;
    }
    const entry = readBytes(reader);
    let name = '';
    eachField(entry, (inner, innerWire, innerReader) => {
      if (inner === 1 && innerWire === 2) {
        name = readString(innerReader);
        return true;
      }
      return false;
    });
    // The index is the position in the list, which is why an entry that fails
    // to parse still has to occupy its slot.
    out.push({ index: String(out.length), name });
    return true;
  });
  return out;
}

/**
 * The legacy media list: a JSON object of zip entry name to filename.
 *
 * `{"0": "heart.png", "1": "murmur.mp3"}`. The keys are not necessarily dense
 * or in order — anki's own comment on `legacy_zip_filename` says legacy maps
 * "may include gaps" — so the key is the entry name and nothing may be
 * inferred from its position.
 */
export function decodeLegacyMediaMap(text: string): ApkgMediaEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return [];
  }
  return Object.entries(parsed as Record<string, unknown>)
    .filter(([, name]) => typeof name === 'string' && name.length > 0)
    .map(([index, name]) => ({ index, name: name as string }));
}

/** `Notetype.Config { Kind kind = 1 }` — 0 normal, 1 cloze. */
export function decodeNotetypeConfig(bytes: Uint8Array): { cloze: boolean } {
  let kind = 0;
  eachField(bytes, (field, wire, reader) => {
    if (field === 1 && wire === 0) {
      kind = readVarint(reader);
      return true;
    }
    return false;
  });
  return { cloze: kind === 1 };
}

/** `Notetype.Template.Config { string q_format = 1; string a_format = 2 }`. */
export function decodeTemplateConfig(bytes: Uint8Array): { qfmt: string; afmt: string } {
  let qfmt = '';
  let afmt = '';
  eachField(bytes, (field, wire, reader) => {
    if (wire !== 2) {
      return false;
    }
    if (field === 1) {
      qfmt = readString(reader);
      return true;
    }
    if (field === 2) {
      afmt = readString(reader);
      return true;
    }
    return false;
  });
  return { qfmt, afmt };
}

/* ------------------------------------------------------------ the layout */

/**
 * Decide which entry in the zip is the collection.
 *
 * **`meta` first, filenames only if there is none.** This is the whole reason
 * this function exists rather than a `.includes('collection.anki21b')`.
 *
 * `export_collection` in anki's colpkg/export.rs calls `write_dummy_collection`
 * unconditionally, so **every version 3 package also contains a
 * `collection.anki2`**: a complete, valid, schema 11 collection holding one
 * note that reads "This file requires a newer version of Anki." It exists so
 * that an old Anki opening a new file says something useful.
 *
 * A reader that picks its collection by looking for a filename finds that
 * decoy. It parses. It has a notetype, a deck and a card. Nothing throws,
 * nothing warns, and the reader is handed a one-card deck containing an error
 * message — which is the worst possible outcome, because it looks like the
 * import worked.
 */
export function packageLayout(entryNames: string[], metaBytes: Uint8Array | null): ApkgLayout {
  const names = new Set(entryNames);

  let version: ApkgVersion;
  if (metaBytes && metaBytes.length > 0) {
    const declared = decodePackageMeta(metaBytes);
    if (declared !== 1 && declared !== 2 && declared !== 3) {
      // anki returns ImportError::TooNew for an unknown version rather than
      // guessing, and guessing is exactly what would read the decoy.
      throw new ApkgError(
        'tooNew',
        'This package was made by a newer version of Anki than this app can read.',
      );
    }
    version = declared;
  } else if (names.has('collection.anki21')) {
    version = 2;
  } else if (names.has('collection.anki2')) {
    version = 1;
  } else {
    throw new ApkgError('notAPackage', 'This file does not contain an Anki collection.');
  }

  const layout: ApkgLayout = {
    version,
    collectionEntry: { 1: 'collection.anki2', 2: 'collection.anki21', 3: 'collection.anki21b' }[
      version
    ],
    zstd: version === 3,
    mediaListIsHashmap: version !== 3,
  };

  if (!names.has(layout.collectionEntry)) {
    throw new ApkgError(
      'corrupt',
      `This package says it is version ${version} but has no ${layout.collectionEntry} in it.`,
    );
  }
  return layout;
}

export type ApkgErrorKind = 'tooNew' | 'notAPackage' | 'corrupt' | 'empty' | 'native';

export class ApkgError extends Error {
  kind: ApkgErrorKind;

  constructor(kind: ApkgErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = 'ApkgError';
  }
}

/* -------------------------------------------------------------------- sql */

/**
 * The queries that read a collection, in one place because two things run
 * them: `OrbitApkg` on a phone, and `npm run check:apkg` in Node. Node's
 * bundled SQLite and Android's are both stock builds, so a query that works in
 * the check works on a device — provided it stays inside the rule below.
 *
 * **Never order or filter on a name column.** Every `name` in a schema 15+
 * collection is declared `COLLATE unicase`, which is a collation Anki's Rust
 * backend registers and *no other SQLite has*. SQLite resolves a collation
 * lazily, when a statement needs one, so a plain `SELECT` of these columns is
 * fine and `ORDER BY name` or `WHERE name = ?` throws
 *
 *     no such collation sequence: unicase
 *
 * on the device and nowhere a desktop Anki would ever show it. Ordering by
 * `ntid, ord` is safe because both are integers.
 *
 * `check:apkg` greps the Kotlin for these strings, so changing one here
 * without changing it there fails the check rather than the import.
 */
export const SQL = {
  /** Schema 15 moved notetypes out of `col` and into their own tables. */
  hasNotetypeTables: "SELECT name FROM sqlite_master WHERE type='table' AND name='notetypes'",
  version: 'SELECT ver FROM col LIMIT 1',
  legacyModels: 'SELECT models, decks FROM col LIMIT 1',
  notetypes: 'SELECT id, name, config FROM notetypes',
  fields: 'SELECT ntid, ord, name FROM fields ORDER BY ntid, ord',
  templates: 'SELECT ntid, ord, name, config FROM templates ORDER BY ntid, ord',
  decks: 'SELECT id, name FROM decks',
  /*
   * One row per card, joined to its note, in the package's own order. The
   * order matters: a package bigger than the import cap is taken from the
   * front, and card ids are creation timestamps, so "the first 5000" is the
   * 5000 the author made first rather than 5000 chosen at random.
   */
  cards:
    'SELECT c.id, c.nid, c.did, c.ord, n.mid, n.flds, n.tags ' +
    'FROM cards c JOIN notes n ON n.id = c.nid ORDER BY c.id',
  /**
   * The same, for the decks the reader chose. `%DECKS%` is replaced with a
   * list of integer ids — see `deckIdList`, which is what makes that safe.
   */
  cardsInDecks:
    'SELECT c.id, c.nid, c.did, c.ord, n.mid, n.flds, n.tags ' +
    'FROM cards c JOIN notes n ON n.id = c.nid WHERE c.did IN (%DECKS%) ORDER BY c.id',
  /** How big each deck is, without reading a single card's text. */
  deckCounts: 'SELECT did, count(*) AS n FROM cards GROUP BY did',
} as const;

/**
 * Turn chosen deck ids into a list that can go into `%DECKS%`.
 *
 * Deck ids are int64 and come back from SQLite as numbers too large to bind
 * comfortably one by one, so they are written into the statement — which makes
 * this the one place in the app where SQL is built from a value. Everything
 * that is not a run of digits is dropped, so what goes in is a list of
 * integers or nothing at all; an empty result means "every deck" and the
 * caller uses `SQL.cards` instead.
 */
export function deckIdList(ids: string[]): string {
  return ids.filter(id => /^\d{1,19}$/.test(id)).join(',');
}

/**
 * Read the schema 11 `col.models` blob.
 *
 * Before schema 15 every notetype in the collection lived in one JSON column,
 * keyed by id. From 15 on that column is left as `"{}"` and the tables are the
 * truth — so a reader that only knows this path finds a modern collection with
 * no notetypes at all, and imports nothing without saying why.
 */
export function parseLegacyNotetypes(modelsJson: string): ApkgNotetype[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(modelsJson || '{}');
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== 'object') {
    return [];
  }
  const out: ApkgNotetype[] = [];
  for (const [id, raw] of Object.entries(parsed as Record<string, any>)) {
    if (!raw || typeof raw !== 'object') {
      continue;
    }
    const fields: string[] = [];
    for (const field of Array.isArray(raw.flds) ? raw.flds : []) {
      const ord = typeof field?.ord === 'number' ? field.ord : fields.length;
      fields[ord] = String(field?.name ?? '');
    }
    const templates: ApkgNotetype['templates'] = [];
    for (const template of Array.isArray(raw.tmpls) ? raw.tmpls : []) {
      const ord = typeof template?.ord === 'number' ? template.ord : templates.length;
      templates[ord] = {
        name: String(template?.name ?? ''),
        qfmt: String(template?.qfmt ?? ''),
        afmt: String(template?.afmt ?? ''),
      };
    }
    out.push({
      id: String(raw.id ?? id),
      name: String(raw.name ?? 'Notetype'),
      // `type` is 1 for cloze, matching the Kind enum the protobuf uses.
      cloze: raw.type === 1,
      fields: [...fields].map(name => name ?? ''),
      templates: [...templates].filter(Boolean),
    });
  }
  return out;
}

/** Read the schema 11 `col.decks` blob. Names here already use `::`. */
export function parseLegacyDecks(decksJson: string): { id: string; name: string }[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(decksJson || '{}');
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== 'object') {
    return [];
  }
  return Object.entries(parsed as Record<string, any>)
    .filter(([, deck]) => deck && typeof deck === 'object')
    .map(([id, deck]) => ({ id: String(deck.id ?? id), name: String(deck.name ?? 'Imported') }));
}

/* ------------------------------------------------------------------ cloze */

/*
 * **Written to match the cloze syntax's behaviour, not translated from anki's
 * source.** The syntax is a data format — it is what makes a deck readable in
 * more than one program — and a format is not copyrightable; anki's code is
 * AGPL-3.0 and none of it is here. `rslib/src/cloze.rs` is the only precise
 * written description of the syntax that exists, so it is what the behaviour
 * below was checked against, and `npm run check:apkg` asserts that behaviour
 * against real .apkg files rather than against anyone's code.
 *
 * The shape is `{{c1::hidden text}}` with two extensions that
 * both turn up constantly in medical decks and are silently wrong if dropped:
 *
 *   {{c1::text::hint}}   a hint, shown in the brackets instead of "..."
 *   {{c1,3::text}}       one deletion belonging to several cards
 *
 * and clozes nest.
 */

interface ClozeNode {
  ordinals: number[];
  nodes: (string | ClozeNode)[];
  hint: string | null;
}

const OPEN = /^\{\{c([\d,]+)::/;

/** Split field text into runs of plain text and cloze deletions. */
function parseClozes(text: string): (string | ClozeNode)[] {
  const open: ClozeNode[] = [];
  const output: (string | ClozeNode)[] = [];

  const push = (node: string | ClozeNode) => {
    const target = open.length > 0 ? open[open.length - 1].nodes : output;
    target.push(node);
  };

  let at = 0;
  let run = '';

  const flush = () => {
    if (run === '') {
      return;
    }
    let piece = run;
    run = '';
    const current = open[open.length - 1];
    if (current && !piece.startsWith('image-occlusion:')) {
      // The hint is whatever follows the last `::` inside the deletion, and
      // anki takes it from the *text run*, not from the whole deletion — so
      // `{{c1::a {{c2::b}}::hint}}` puts the hint on the outer one.
      const cut = piece.indexOf('::');
      if (cut >= 0) {
        current.hint = piece.slice(cut + 2);
        piece = piece.slice(0, cut);
      }
    }
    push(piece);
  };

  while (at < text.length) {
    const rest = text.slice(at);
    const opener = OPEN.exec(rest);
    if (opener) {
      flush();
      const ordinals = [
        ...new Set(
          opener[1]
            .split(',')
            .map(part => Number.parseInt(part, 10))
            .filter(n => Number.isFinite(n) && n > 0),
        ),
      ].sort((a, b) => a - b);
      at += opener[0].length;
      if (ordinals.length === 0) {
        // `{{c::x}}` is not a deletion. anki's parser rejects it at the
        // ordinal step and the text stands as written.
        run += opener[0];
        continue;
      }
      // anki stops nesting at ten deep and drops the rest.
      if (open.length < 10) {
        open.push({ ordinals, nodes: [], hint: null });
      }
      continue;
    }
    if (rest.startsWith('}}')) {
      flush();
      at += 2;
      const closed = open.pop();
      if (closed) {
        push(closed);
      } else {
        push('}}');
      }
      continue;
    }
    run += text[at];
    at += 1;
  }
  flush();
  // An unclosed `{{c1::` leaves its text where it was rather than losing it.
  while (open.length > 0) {
    const dangling = open.pop();
    if (dangling) {
      push(dangling);
    }
  }
  return output;
}

/**
 * Every cloze number in a field.
 *
 * Only needed as a fallback: a real package's `cards` table already has one
 * row per card, so the ordinals are known without looking at the text. This is
 * for a note whose card rows did not survive whatever produced the file.
 */
export function clozeOrdinals(text: string): number[] {
  const found = new Set<number>();
  const walk = (nodes: (string | ClozeNode)[]) => {
    for (const node of nodes) {
      if (typeof node !== 'string') {
        node.ordinals.forEach(o => found.add(o));
        walk(node.nodes);
      }
    }
  };
  walk(parseClozes(text));
  return [...found].sort((a, b) => a - b);
}

/**
 * Show one cloze card's side of a field.
 *
 * `question` hides the deletions belonging to `ordinal` behind their hint (or
 * `[...]`) and shows every other deletion's text; the answer side shows them
 * all. That asymmetry is the entire mechanic: a cloze card is one sentence
 * with one hole in it, and the other holes have to be filled in or the
 * sentence cannot be read.
 */
export function revealCloze(text: string, ordinal: number, question: boolean): string {
  const render = (node: ClozeNode): string => {
    const active = node.ordinals.includes(ordinal);
    const inner = node.nodes
      .map(part => (typeof part === 'string' ? part : render(part)))
      .join('');
    if (question && active) {
      return `[${node.hint ?? '...'}]`;
    }
    return inner;
  };
  return parseClozes(text)
    .map(node => (typeof node === 'string' ? node : render(node)))
    .join('');
}

/** Whether a field contains any cloze deletion at all. */
export function hasCloze(text: string): boolean {
  return OPEN.test(text) || /\{\{c[\d,]+::/.test(text);
}

/* --------------------------------------------------------------- templates */

/**
 * Apply one side of a card template.
 *
 * Anki's template language is Mustache-shaped but is not Mustache: the only
 * constructs are a field replacement, a section that shows when a field is
 * filled, its negation, and a chain of filters before the field name.
 *
 * `cloze` is the ordinal for a cloze card, or null on a normal one.
 */
export function renderTemplate(
  format: string,
  fields: Record<string, string>,
  options: { cloze?: number | null; question: boolean; deck?: string; tags?: string } = {
    question: true,
  },
): string {
  const value = (spec: string): string => {
    const parts = spec.split(':');
    const name = parts[parts.length - 1];
    const filters = parts.slice(0, -1);

    let text: string;
    if (name === 'FrontSide') {
      /*
       * Dropped on purpose. `{{FrontSide}}` exists because Anki draws the
       * answer over the top of the question, so the template has to put the
       * question back. This app shows the question and the answer as two
       * parts of one card, with the question still on screen — pasting it in
       * again would print it twice.
       */
      return '';
    } else if (name === 'Tags') {
      text = options.tags ?? '';
    } else if (name === 'Deck' || name === 'Subdeck') {
      text = options.deck ?? '';
    } else if (name === 'Type' || name === 'Card' || name === 'CardFlag') {
      return '';
    } else {
      text = fields[name] ?? '';
    }

    for (const filter of filters) {
      if (filter === 'cloze' || filter === 'cloze-only') {
        text = revealCloze(text, options.cloze ?? 1, options.question);
      } else if (filter === 'text') {
        text = htmlToText(text).text;
      } else if (filter === 'type') {
        // A box the reader types their answer into. There is nothing to show.
        return '';
      }
      // Everything else — furigana, kana, kanji, nc, and any add-on's own
      // filter — passes the field through. Refusing to render an unknown
      // filter would blank the card; showing the field is always closer to
      // what the author meant than showing nothing.
    }
    return text;
  };

  const filled = (name: string): boolean => {
    const spec = name.split(':');
    const field = spec[spec.length - 1];
    return (fields[field] ?? '').trim().length > 0;
  };

  /*
   * Sections first, innermost outwards, so a conditional wrapping a field
   * replacement is resolved before the replacement is attempted. The loop has
   * a bound because a malformed template — `{{#A}}` with no `{{/A}}` — would
   * otherwise never stop matching.
   */
  let out = format;
  for (let pass = 0; pass < 12; pass += 1) {
    const before = out;
    out = out.replace(
      /\{\{([#^])([^}]+)\}\}([\s\S]*?)\{\{\/\2\}\}/g,
      (_all, kind: string, name: string, body: string) =>
        (kind === '#') === filled(name) ? body : '',
    );
    if (out === before) {
      break;
    }
  }

  return out.replace(/\{\{([^#^/][^}]*)\}\}/g, (_all, spec: string) => value(spec.trim()));
}

/* -------------------------------------------------------------------- html */

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
  deg: '°',
  times: '×',
  micro: 'µ',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  plusmn: '±',
  le: '≤',
  ge: '≥',
  rarr: '→',
  larr: '←',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (all, body: string) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : all;
    }
    return ENTITIES[body.toLowerCase()] ?? all;
  });
}

/** What a card side turns into: readable text, plus what it pointed at. */
export interface FlatSide {
  text: string;
  images: string[];
  audio: string[];
}

/**
 * Flatten a rendered card side into text and its media.
 *
 * An Anki card is HTML, styled by the notetype's CSS, and this app draws cards
 * as text. Rendering the HTML properly would mean a WebView per card — which
 * is how AnkiDroid does it, and it is the right answer for an app whose whole
 * job is Anki. Here it would put a browser inside a flashcard that otherwise
 * costs nothing to draw, on phones chosen for being cheap.
 *
 * So the tags become line breaks and the media comes out as filenames. What is
 * lost is layout and colour; what is kept is every word the author wrote, and
 * every picture.
 */
export function htmlToText(html: string): FlatSide {
  const images: string[] = [];
  const audio: string[] = [];

  let text = html;

  // `[sound:file.mp3]` is Anki's own markup rather than HTML, and it appears
  // in the field text itself.
  text = text.replace(/\[sound:([^\]]+)\]/g, (_all, name: string) => {
    audio.push(name.trim());
    return ' ';
  });

  // Style and script hold no reading matter, and their contents would
  // otherwise survive the tag strip below as a wall of CSS.
  text = text.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');

  text = text.replace(/<img\b[^>]*>/gi, tag => {
    const src = /\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
    const name = src ? (src[2] ?? src[3] ?? src[4] ?? '').trim() : '';
    if (name) {
      images.push(decodeEntities(name));
    }
    return ' ';
  });

  // Anki's own audio/video elements, for decks that use them instead of
  // `[sound:]`.
  text = text.replace(/<(audio|video)\b[^>]*>([\s\S]*?)<\/\1>/gi, (all: string) => {
    const src = /\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(all);
    const name = src ? (src[2] ?? src[3] ?? src[4] ?? '').trim() : '';
    if (name) {
      audio.push(decodeEntities(name));
    }
    return ' ';
  });

  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<(hr)\b[^>]*>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '• ')
    .replace(/<t[dh]\b[^>]*>/gi, '\t')
    .replace(/<[^>]+>/g, '');

  text = decodeEntities(text);

  text = text
    // Tabs and spaces collapse; newlines are the one thing worth keeping.
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { text, images, audio };
}

/* ------------------------------------------------------- notes into cards */

/** Split a note's `flds` into a name-keyed record for the template. */
export function noteFields(flds: string, names: string[]): Record<string, string> {
  const values = flds.split(FIELD_SEPARATOR);
  const out: Record<string, string> = {};
  names.forEach((name, index) => {
    out[name] = values[index] ?? '';
  });
  return out;
}

/** Anki stores tags space-separated with a leading and trailing space. */
export function noteTags(tags: string): string[] {
  return tags.split(/\s+/).filter(Boolean);
}

/**
 * Schema 15 and later store a deck's name with the unit separator between its
 * levels, and only turn it back into `::` on the way out. A name read straight
 * out of the table and shown to a reader has an unprintable character in the
 * middle of it.
 */
export function deckName(stored: string): string {
  return stored.split(FIELD_SEPARATOR).join('::');
}

/**
 * Turn a collection into cards.
 *
 * **The `cards` table is the authority on how many cards a note has**, and
 * that is the single biggest reason importing a package is tractable at all.
 * Card generation — which templates fire, which cloze numbers exist, what
 * happens when a conditional field is empty — already ran inside Anki when the
 * deck was made. Re-deriving it here would be reimplementing the part of Anki
 * most likely to disagree, to answer a question the file already answers.
 *
 * So: one row in, one card out. `ord` selects the template on a normal
 * notetype and the cloze number on a cloze one.
 */
export function cardsFromCollection(
  collection: ApkgCollection,
  options: { decks?: Set<string>; limit?: number } = {},
): ApkgCard[] {
  const notetypes = new Map(collection.notetypes.map(nt => [nt.id, nt]));
  const decks = new Map(collection.decks.map(deck => [deck.id, deckName(deck.name)]));
  const out: ApkgCard[] = [];
  const limit = options.limit ?? Number.MAX_SAFE_INTEGER;

  for (const row of collection.cards) {
    if (out.length >= limit) {
      break;
    }
    const notetype = notetypes.get(row.mid);
    if (!notetype) {
      // A note whose notetype is missing cannot be rendered into anything, and
      // a card of raw field text separated by an unprintable character is not
      // a card. Skipping is the honest outcome.
      continue;
    }
    const deck = decks.get(row.did) ?? 'Imported';
    if (options.decks && !options.decks.has(deck)) {
      continue;
    }

    const fields = noteFields(row.flds, notetype.fields);
    const tags = noteTags(row.tags);

    // A cloze notetype has one template and many cards; ord is the cloze
    // number minus one. A normal one has a template per card.
    const template = notetype.cloze
      ? notetype.templates[0]
      : notetype.templates[row.ord] ?? notetype.templates[0];
    if (!template) {
      continue;
    }
    const cloze = notetype.cloze ? row.ord + 1 : null;

    const front = htmlToText(
      renderTemplate(template.qfmt, fields, { cloze, question: true, deck, tags: row.tags.trim() }),
    );
    const back = htmlToText(
      renderTemplate(template.afmt, fields, { cloze, question: false, deck, tags: row.tags.trim() }),
    );

    /*
     * A card with nothing on the front is not answerable. Anki itself skips
     * these — a normal notetype's `req` is what stops it generating a card
     * whose question would be blank — but a package can still carry one, and
     * an empty card in a deck is a card the reader has to grade with no way to
     * know what it wanted.
     */
    if (!front.text && front.images.length === 0) {
      continue;
    }

    out.push({
      id: row.id,
      deck,
      front: front.text,
      back: back.text,
      tags,
      frontMedia: front.images,
      // The answer side of most templates contains `{{FrontSide}}`, so a
      // picture on the question would otherwise be listed on both sides and
      // drawn twice.
      backMedia: back.images.filter(name => !front.images.includes(name)),
      audio: [...new Set([...front.audio, ...back.audio])],
    });
  }

  return out;
}

/** Every media filename the given cards actually point at. */
export function referencedMedia(cards: ApkgCard[]): Set<string> {
  const names = new Set<string>();
  for (const card of cards) {
    card.frontMedia.forEach(name => names.add(name));
    card.backMedia.forEach(name => names.add(name));
    card.audio.forEach(name => names.add(name));
  }
  return names;
}

/**
 * Which zip entries have to be unpacked.
 *
 * Only the ones the imported cards refer to. A shared deck's media folder is
 * routinely far larger than the cards taken from it — a package where one
 * chapter is wanted out of thirty would otherwise copy every picture in all
 * thirty onto the phone, and nothing would ever look at them again.
 */
export function mediaToExtract(
  entries: ApkgMediaEntry[],
  wanted: Set<string>,
): ApkgMediaEntry[] {
  return entries.filter(entry => wanted.has(entry.name));
}

/** A deck summary for the screen that asks which decks to take. */
export function deckSummary(collection: ApkgCollection): { name: string; cards: number }[] {
  const decks = new Map(collection.decks.map(deck => [deck.id, deckName(deck.name)]));
  const counts = new Map<string, number>();
  for (const row of collection.cards) {
    const name = decks.get(row.did) ?? 'Imported';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, cards]) => ({ name, cards }))
    .sort((a, b) => b.cards - a.cards || a.name.localeCompare(b.name));
}
