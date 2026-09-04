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
  decodeLegacyMediaMap,
  decodeMediaEntries,
  decodePackageMeta,
  packageLayout,
  parseLegacyDecks,
  type ApkgCard,
} from './apkgFormat';

/** What the browser needs, loaded only when a package is actually opened. */
async function loadDeps() {
  const [fflate, fzstd, initSqlJs] = await Promise.all([
    import('fflate'),
    import('fzstd'),
    import('sql.js').then(m => m.default ?? m),
  ]);
  return { fflate, fzstd, initSqlJs };
}

export interface ImportedApkg {
  deckName: string;
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

  const SqlJs = await initSqlJs({
    // Served from the bundle, not a CDN: the app must keep working offline and
    // must not hand a third party a request every time somebody imports.
    locateFile: (f: string) => new URL(`../../node_modules/sql.js/dist/${f}`, import.meta.url).href,
  });
  const db = new SqlJs.Database(collectionBytes);

  try {
    // The schema is a property of the COLLECTION, not of the package: a v1 and
    // a v2 package are both schema 11, and `packageLayout` only ever sees
    // filenames and `meta`. Asking the database is the only way to know, and
    // getting it from the layout instead is what made both legacy fixtures
    // throw "no such table: decks".
    const schema = Number(query(db, SQL.version)[0]?.ver ?? 11);
    const cards = readCards(db);
    const media = readMedia(entries, layout, fzstd);
    return {
      deckName: readDeckName(db, schema) ?? file.name.replace(/\.apkg$/i, ''),
      cards,
      media,
    };
  } finally {
    db.close();
  }
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

function readDeckName(db: never, schema: number): string | null {
  // Before schema 15 there IS no `decks` table — decks are a JSON blob in
  // `col.decks`, the same way notetypes are in `col.models`. Querying `decks`
  // on a v1 or v2 package fails with "no such table", which is how this was
  // found: v3 opened fine and both legacy fixtures threw.
  if (schema < 15) {
    const [row] = query(db as never, SQL.legacyModels);
    const decks = typeof row?.decks === 'string' ? parseLegacyDecks(row.decks) : [];
    return decks[0]?.name ?? null;
  }

  const rows = query(db as never, SQL.decks);
  const name = rows[0]?.name;
  // Schema 15+ separates deck levels with \x1f and only turns it into "::" on
  // the way out, so a name read straight from the table has an unprintable
  // character in the middle of it.
  return typeof name === 'string' ? name.split(FIELD_SEPARATOR).join('::') : null;
}

function readCards(db: never): ApkgCard[] {
  // The `cards` table is the authority on how many cards a note has: card
  // generation already ran inside Anki, so one row in, one card out. Deriving
  // it again would be reimplementing the part of Anki most likely to disagree,
  // to answer a question the file already answers.
  const rows = query(db as never, SQL.cards);
  return rows as unknown as ApkgCard[];
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
