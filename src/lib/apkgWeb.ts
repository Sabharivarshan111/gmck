/**
 * Reading and writing `.apkg` packages in a browser.
 *
 * `apkgFormat.ts` deliberately holds no zip, no SQLite and no zstd — it is pure
 * functions over `Uint8Array` plus the SQL it wants run, so that the part which
 * decides what a card *says* can be tested outside the platform that fetches
 * the bytes. On Android the host is Kotlin (`java.util.zip`,
 * `android.database.sqlite`, zstd-jni). Here the host is the browser.
 *
 * That distinction is worth stating because it was got wrong once in this
 * session: import was described as Android-only "because it needs a native
 * module". A native module is what *React Native* lacks. A browser has all
 * three, and reaches them without asking for a permission:
 *
 *   zip     fflate    (pure JS)
 *   sqlite  sql.js    (WASM)
 *   zstd    fzstd     (pure JS)
 *
 * **sql.js is about 1.5MB of WASM**, so everything here is behind a dynamic
 * `import()`. A reader who never imports a deck never downloads it — which is
 * almost every reader, since the feature exists for the few who arrive with an
 * Anki collection already.
 */
import {
  ApkgError,
  FIELD_SEPARATOR,
  SQL,
  cardsFromCollection,
  decodeLegacyMediaMap,
  decodeMediaEntries,
  decodeNotetypeConfig,
  decodePackageMeta,
  decodeTemplateConfig,
  packageLayout,
  parseLegacyDecks,
  parseLegacyNotetypes,
  type ApkgCard,
  type ApkgCardRow,
  type ApkgCollection,
  type ApkgNotetype,
} from './apkgFormat';
import { mediaMap, type ExportPackage } from './apkgExport';

/** What the browser needs, loaded only when a package is actually opened. */
async function loadDeps() {
  const [fflate, fzstd, initSqlJs] = await Promise.all([
    import('fflate'),
    import('fzstd'),
    import('sql.js').then(m => m.default ?? m),
  ]);
  return { fflate, fzstd, initSqlJs };
}

/**
 * Where `sql-wasm.wasm` is served from.
 *
 * It has to be given rather than guessed, and that is a bundler fact rather
 * than a preference: `new URL('…', import.meta.url)` built from a template
 * string is not statically analysable, so Vite leaves it alone and the built
 * app asks for `/node_modules/sql.js/dist/sql-wasm.wasm` — a 404, and a
 * feature that works in `npm run dev` and nowhere else. The web app passes the
 * URL Vite emitted for the asset; the Node checks let this default stand,
 * because sql.js falls back to reading the file beside its own script there.
 */
let wasmUrl: string | null = null;

/** Tell the reader where the WASM lives, once, at startup. */
export function setSqlWasmUrl(url: string): void {
  wasmUrl = url;
}

async function openSqlJs(deps: Awaited<ReturnType<typeof loadDeps>>) {
  return deps.initSqlJs(
    // Served from this app's own bundle, never a CDN: the app must keep
    // working offline and must not hand a third party a request every time
    // somebody imports a deck.
    wasmUrl ? { locateFile: () => wasmUrl as string } : undefined,
  );
}

export interface ImportedApkg {
  /** The package's own name for what is inside, for naming the deck. */
  deckName: string;
  /**
   * The collection as read: notetypes, decks, and one row per card.
   *
   * Handed back whole rather than only as rendered cards, because the rows are
   * what proves which collection was opened — a v3 package's decoy holds one
   * note whose `flds` reads "This file requires a newer version of Anki".
   */
  collection: ApkgCollection;
  /** Those rows with their templates applied and their HTML flattened. */
  cards: ApkgCard[];
  /** Media, keyed by the filename a card's HTML refers to. */
  media: Map<string, Blob>;
}

/**
 * Open a `.apkg` the reader chose with a file input.
 *
 * The file input is the browser's equivalent of `ACTION_OPEN_DOCUMENT`: it
 * returns the one file chosen and grants nothing else, so this needs no
 * permission either.
 */
export async function readApkg(file: File): Promise<ImportedApkg> {
  const { fflate, fzstd, initSqlJs } = await loadDeps();
  const bytes = new Uint8Array(await file.arrayBuffer());

  let entries: Record<string, Uint8Array>;
  try {
    entries = fflate.unzipSync(bytes);
  } catch {
    throw new ApkgError('notAPackage', 'That file is not an Anki package.');
  }

  // `meta` decides the layout, never the filenames. Every v3 package also
  // contains a decoy `collection.anki2` holding one note reading "This file
  // requires a newer version of Anki" — picking by filename finds it, parses
  // it, throws nothing, and hands back a one-card deck containing an error
  // message, which is the worst outcome available because it looks like it
  // worked.
  const layout = packageLayout(Object.keys(entries), entries.meta ?? null);
  if (entries.meta) {
    decodePackageMeta(entries.meta);
  }

  const raw = entries[layout.collectionEntry];
  if (!raw) {
    throw new ApkgError('corrupt', 'The package has no collection in it.');
  }
  const collectionBytes = layout.zstd ? fzstd.decompress(raw) : raw;

  const SqlJs = await openSqlJs({ fflate, fzstd, initSqlJs });
  const db = new SqlJs.Database(collectionBytes);

  let collection: ApkgCollection;
  try {
    // The schema is a property of the COLLECTION, not of the package: a v1 and
    // a v2 package are both schema 11, and `packageLayout` only ever sees
    // filenames and `meta`. Asking the database is the only way to know, and
    // getting it from the layout instead is what made both legacy fixtures
    // throw "no such table: decks".
    const schema = Number(query(db, SQL.version)[0]?.ver ?? 11);
    collection = readCollection(db, schema);
  } finally {
    db.close();
  }

  /*
   * The rendering is the shared code, not a browser copy of it.
   *
   * `cardsFromCollection` applies the template, resolves the cloze number and
   * flattens the HTML, and it is the same function the phone runs on what
   * Kotlin read. `check:apkg` pins its behaviour against real packages; a
   * second implementation here would be a second thing to get wrong, in the
   * one part of this format where being subtly wrong is invisible.
   */
  const cards = cardsFromCollection(collection);
  return {
    deckName: packageDeckName(collection) ?? file.name.replace(/\.(apkg|colpkg)$/i, ''),
    collection,
    cards,
    media: readMedia(entries, layout, fzstd),
  };
}

/** Rows out of sql.js, as plain objects. */
function query(db: { exec: (sql: string) => { columns: string[]; values: unknown[][] }[] }, sql: string) {
  const [result] = db.exec(sql);
  if (!result) {
    return [] as Record<string, unknown>[];
  }
  return result.values.map(row =>
    Object.fromEntries(result.columns.map((column, index) => [column, row[index]])),
  );
}

/** SQLite hands int64 back as a JS number; every id here is a string. */
const id = (value: unknown) => String(value ?? '');

/**
 * The whole collection: notetypes, decks and one row per card.
 *
 * Two shapes, and the split is at schema 15. Before it a notetype is one entry
 * in the `col.models` JSON blob and a deck one entry in `col.decks`; from 15 on
 * both columns are left as `"{}"` and the `notetypes`/`fields`/`templates` and
 * `decks` tables are the truth. A reader that knows only the old path finds a
 * modern collection with no notetypes at all, imports nothing, and says
 * nothing about why.
 */
function readCollection(db: never, schema: number): ApkgCollection {
  const cards = query(db as never, SQL.cards).map(row => ({
    id: id(row.id),
    nid: id(row.nid),
    did: id(row.did),
    ord: Number(row.ord ?? 0),
    mid: id(row.mid),
    flds: String(row.flds ?? ''),
    tags: String(row.tags ?? ''),
  })) as ApkgCardRow[];

  if (schema < 15) {
    const [row] = query(db as never, SQL.legacyModels);
    return {
      schema,
      notetypes: parseLegacyNotetypes(typeof row?.models === 'string' ? row.models : '{}'),
      decks: parseLegacyDecks(typeof row?.decks === 'string' ? row.decks : '{}'),
      cards,
    };
  }

  /*
   * Both configs are protobuf, and both are read by `apkgFormat`'s own
   * decoder. sql.js hands a BLOB column back as a Uint8Array, which is what
   * those functions take — the same bytes Kotlin passes across the bridge as
   * base64.
   */
  const fields = new Map<string, string[]>();
  for (const row of query(db as never, SQL.fields)) {
    const list = fields.get(id(row.ntid)) ?? [];
    list.push(String(row.name ?? ''));
    fields.set(id(row.ntid), list);
  }
  const templates = new Map<string, ApkgNotetype['templates']>();
  for (const row of query(db as never, SQL.templates)) {
    const list = templates.get(id(row.ntid)) ?? [];
    const config = decodeTemplateConfig(toBytes(row.config));
    list.push({ name: String(row.name ?? ''), qfmt: config.qfmt, afmt: config.afmt });
    templates.set(id(row.ntid), list);
  }

  const notetypes: ApkgNotetype[] = query(db as never, SQL.notetypes).map(row => ({
    id: id(row.id),
    name: String(row.name ?? ''),
    cloze: decodeNotetypeConfig(toBytes(row.config)).cloze,
    fields: fields.get(id(row.id)) ?? [],
    templates: templates.get(id(row.id)) ?? [],
  }));

  const decks = query(db as never, SQL.decks).map(row => ({
    id: id(row.id),
    // Schema 15+ separates deck levels with \x1f and only turns it into "::"
    // on the way out, so a name read straight from the table has an
    // unprintable character in the middle of it.
    name: String(row.name ?? '').split(FIELD_SEPARATOR).join('::'),
  }));

  return { schema, notetypes, decks, cards };
}

function toBytes(value: unknown): Uint8Array {
  return value instanceof Uint8Array ? value : new Uint8Array(0);
}

/**
 * What to call the deck this package becomes.
 *
 * The deck the cards are actually in, not `decks[0]` — a collection always
 * carries a "Default" deck whether or not anything is filed in it, so the
 * first row is routinely the one name that describes nothing.
 */
function packageDeckName(collection: ApkgCollection): string | null {
  const used = new Set(collection.cards.map(card => card.did));
  const named = collection.decks.filter(deck => used.has(deck.id));
  if (named.length === 1) {
    return named[0].name;
  }
  // Several decks in one package: their common parent is the honest name, and
  // failing that the reader gets the filename.
  const shortest = named.map(deck => deck.name.split('::')[0]).sort()[0];
  return named.length > 1 && named.every(deck => deck.name.startsWith(shortest))
    ? shortest
    : null;
}

function readMedia(
  entries: Record<string, Uint8Array>,
  layout: { version: number; zstd: boolean },
  fzstd: { decompress: (b: Uint8Array) => Uint8Array },
): Map<string, Blob> {
  const out = new Map<string, Blob>();
  const listEntry = entries.media;
  if (!listEntry) {
    return out;
  }
  const list =
    layout.version === 3
      ? decodeMediaEntries(layout.zstd ? fzstd.decompress(listEntry) : listEntry)
      : decodeLegacyMediaMap(new TextDecoder().decode(listEntry));

  // A media file's zip entry is named for its POSITION in the list — "0", "1".
  // Nothing but the list knows which is which.
  for (const entry of list) {
    const bytes = entries[String(entry.index)];
    if (bytes) {
      out.set(entry.name, new Blob([bytes as BlobPart]));
    }
  }
  return out;
}

/**
 * Hand the reader a `.apkg` of one of their own decks.
 *
 * The payload comes from the shared `apkgExport.ts`, which writes **version 1**
 * — `collection.anki2` at schema 11, a JSON media map, no `meta`, no zstd —
 * because every Anki ever released can open that, and the person being handed
 * the deck did not choose their Anki version.
 *
 * On Android this goes through a FileProvider because a `file://` URI in an
 * Intent throws since Android 7. A browser needs none of that: an object URL
 * on an anchor is the whole mechanism.
 */
export function downloadApkg(bytes: Uint8Array, deckName: string): void {
  const safe = deckName.replace(/[^\w\- ]+/g, '').trim() || 'deck';
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/octet-stream' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safe}.apkg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on the next tick rather than immediately: revoking synchronously
  // can beat the download starting in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
