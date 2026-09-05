// Import a real .apkg, end to end, and assert what comes out.
//
// Not a unit test of helper functions. This opens the actual ZIP files that
// `scripts/make-apkg-fixtures.py` builds to the format `ankitects/anki`
// defines, decompresses them, opens the collection with a **stock SQLite**,
// runs the app's own queries and the app's own renderer, and checks the cards.
//
// Node makes that possible in a way that is worth spelling out, because it is
// what stops this feature being untestable until it is on somebody's phone:
//
//   • node:zlib has zstdDecompressSync, so version 3 packages open here.
//   • node:sqlite is a stock SQLite with **no `unicase` collation**, which is
//     exactly the position Android is in. A query that works here works there,
//     and one that needs the collation fails here rather than on a device.
//
// So the only part of the import this cannot exercise is the Kotlin plumbing —
// picking the file and unzipping it. Everything that decides what a card says
// runs for real.
//
//   node scripts/apkg-check.mjs
import { build } from 'esbuild';
import { DatabaseSync } from 'node:sqlite';
import { execFileSync } from 'node:child_process';
import { inflateRawSync, zstdDecompressSync } from 'node:zlib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = path.join(root, 'preview/fixtures/apkg');

const failures = [];
const check = (ok, message) => {
  if (!ok) {
    failures.push(message);
  }
};

/* ----------------------------------------------------------------- fixtures */

if (!fs.existsSync(path.join(fixtures, 'v3.apkg'))) {
  try {
    execFileSync('python3', [path.join(root, 'scripts/make-apkg-fixtures.py')], {
      stdio: 'ignore',
    });
  } catch {
    process.stdout.write(
      'SKIP  no fixtures and python3/zstandard is unavailable to build them\n' +
        '      pip install zstandard && python3 scripts/make-apkg-fixtures.py\n',
    );
    process.exit(0);
  }
}

/* ---------------------------------------------------------------- zip reader */

/**
 * Enough of ZIP to read an .apkg: the central directory, then stored and
 * deflated entries. Test-only — on the phone this is java.util.zip.
 */
function readZip(file) {
  const buf = fs.readFileSync(file);
  // The end-of-central-directory record is at the tail, after a comment that
  // is almost always empty.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 0xffff; i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) {
    throw new Error(`${path.basename(file)} is not a zip`);
  }
  const count = buf.readUInt16LE(eocd + 10);
  let at = buf.readUInt32LE(eocd + 16);

  const entries = new Map();
  for (let i = 0; i < count; i += 1) {
    if (buf.readUInt32LE(at) !== 0x02014b50) {
      throw new Error('bad central directory');
    }
    const method = buf.readUInt16LE(at + 10);
    const compressedSize = buf.readUInt32LE(at + 20);
    const nameLength = buf.readUInt16LE(at + 28);
    const extraLength = buf.readUInt16LE(at + 30);
    const commentLength = buf.readUInt16LE(at + 32);
    const localAt = buf.readUInt32LE(at + 42);
    const name = buf.toString('utf8', at + 46, at + 46 + nameLength);

    // The local header repeats the name and extra fields, at its own lengths.
    const localNameLength = buf.readUInt16LE(localAt + 26);
    const localExtraLength = buf.readUInt16LE(localAt + 28);
    const dataAt = localAt + 30 + localNameLength + localExtraLength;
    const raw = buf.subarray(dataAt, dataAt + compressedSize);

    entries.set(name, method === 0 ? raw : inflateRawSync(raw));
    at += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

/* -------------------------------------------------------------- the module */

const bundled = await build({
  entryPoints: [path.join(root, '..', 'src/lib/apkgFormat.ts')],
  bundle: true,
  format: 'esm',
  write: false,
  platform: 'neutral',
});
const apkg = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
);

/* ---------------------------------------------------------------- the read */

/**
 * Read one package into an ApkgCollection.
 *
 * This mirrors what `ApkgModule.kt` does on the device, using the same
 * queries from `SQL` and the same decoders. It is the reference the Kotlin is
 * written against.
 */
function openPackage(file) {
  const zip = readZip(file);
  const layout = apkg.packageLayout([...zip.keys()], zip.get('meta') ?? null);

  const rawCollection = zip.get(layout.collectionEntry);
  const collectionBytes = layout.zstd ? zstdDecompressSync(rawCollection) : rawCollection;

  const temp = path.join(os.tmpdir(), `apkg-check-${process.pid}-${path.basename(file)}.sqlite`);
  fs.writeFileSync(temp, collectionBytes);
  const db = new DatabaseSync(temp, { readOnly: true });

  const schema = db.prepare(apkg.SQL.version).get()?.ver ?? 0;
  const modern = db.prepare(apkg.SQL.hasNotetypeTables).all().length > 0;

  let notetypes;
  let decks;
  if (modern) {
    const fieldsByType = new Map();
    for (const row of db.prepare(apkg.SQL.fields).all()) {
      const list = fieldsByType.get(String(row.ntid)) ?? [];
      list[row.ord] = row.name;
      fieldsByType.set(String(row.ntid), list);
    }
    const templatesByType = new Map();
    for (const row of db.prepare(apkg.SQL.templates).all()) {
      const list = templatesByType.get(String(row.ntid)) ?? [];
      const config = apkg.decodeTemplateConfig(new Uint8Array(row.config));
      list[row.ord] = { name: row.name, qfmt: config.qfmt, afmt: config.afmt };
      templatesByType.set(String(row.ntid), list);
    }
    notetypes = db.prepare(apkg.SQL.notetypes).all().map(row => ({
      id: String(row.id),
      name: row.name,
      cloze: apkg.decodeNotetypeConfig(new Uint8Array(row.config)).cloze,
      fields: fieldsByType.get(String(row.id)) ?? [],
      templates: templatesByType.get(String(row.id)) ?? [],
    }));
    decks = db.prepare(apkg.SQL.decks).all().map(row => ({ id: String(row.id), name: row.name }));
  } else {
    const row = db.prepare(apkg.SQL.legacyModels).get();
    notetypes = apkg.parseLegacyNotetypes(row.models);
    decks = apkg.parseLegacyDecks(row.decks);
  }

  const cards = db.prepare(apkg.SQL.cards).all().map(row => ({
    id: String(row.id),
    nid: String(row.nid),
    did: String(row.did),
    ord: row.ord,
    mid: String(row.mid),
    flds: row.flds,
    tags: row.tags,
  }));

  db.close();
  fs.unlinkSync(temp);

  // The media list, read the way the layout says to read it.
  const rawMedia = zip.get('media');
  let media = [];
  if (rawMedia) {
    const bytes = layout.zstd ? zstdDecompressSync(rawMedia) : rawMedia;
    media = layout.mediaListIsHashmap
      ? apkg.decodeLegacyMediaMap(bytes.toString('utf8'))
      : apkg.decodeMediaEntries(new Uint8Array(bytes));
  }

  return { layout, collection: { schema, notetypes, decks, cards }, media, zip };
}

/* ------------------------------------------------------------- assertions */

const report = [];

for (const [name, expectedVersion, expectedEntry] of [
  ['legacy1.apkg', 1, 'collection.anki2'],
  ['legacy2.apkg', 2, 'collection.anki21'],
  ['v3.apkg', 3, 'collection.anki21b'],
]) {
  const file = path.join(fixtures, name);
  let opened;
  try {
    opened = openPackage(file);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    continue;
  }
  const { layout, collection, media, zip } = opened;

  check(
    layout.version === expectedVersion,
    `${name}: read as version ${layout.version}, expected ${expectedVersion}`,
  );
  check(
    layout.collectionEntry === expectedEntry,
    `${name}: chose ${layout.collectionEntry}, expected ${expectedEntry}`,
  );

  const cards = apkg.cardsFromCollection(collection);

  /*
   * The trap, asserted directly.
   *
   * Every version 3 package also carries a `collection.anki2` — a real, valid,
   * one-note collection saying the file needs a newer Anki. A reader that
   * picks by filename imports that instead, with no error at all, and the
   * reader is handed a deck of one card telling them to upgrade software they
   * are not using. This is the assertion that says we read `meta` first.
   */
  if (expectedVersion === 3) {
    check(zip.has('collection.anki2'), `${name}: fixture is missing the decoy to test against`);
    check(
      !cards.some(card => /requires a newer version/i.test(card.front)),
      `${name}: imported the decoy collection.anki2 instead of the real one`,
    );
    check(cards.length > 5, `${name}: only ${cards.length} cards — that is the decoy's size`);
  }

  // Ten cards from six notes, because the cards table is the authority: two
  // clozes on one note, three on another, and a reversed note making two.
  check(
    cards.length === 10,
    `${name}: ${cards.length} cards, expected 10 (the fixture's own cards table has 10 rows)`,
  );

  const byId = new Map(cards.map(card => [card.front, card]));

  // A plain Basic card.
  const p = cards.find(card => card.front.startsWith('What does the P wave'));
  check(!!p, `${name}: the Basic card is missing`);
  if (p) {
    check(
      p.back === 'Atrial depolarisation',
      `${name}: Basic back is ${JSON.stringify(p.back)} — {{FrontSide}} or the <hr> leaked in`,
    );
    check(p.deck === 'Medicine::Cardiology', `${name}: deck name is ${p.deck}`);
    check(p.tags.join(',') === 'cardio,ecg', `${name}: tags are ${p.tags.join(',')}`);
  }

  // Media on the question side, and an entity in the answer.
  const rhythm = cards.find(card => card.front.startsWith('Identify the rhythm'));
  check(!!rhythm, `${name}: the image card is missing`);
  if (rhythm) {
    check(
      rhythm.frontMedia.join() === 'ecg-strip.png',
      `${name}: front media is ${JSON.stringify(rhythm.frontMedia)}`,
    );
    check(
      rhythm.backMedia.length === 0,
      `${name}: the question's picture is listed on the answer too — {{FrontSide}} would draw it twice`,
    );
    check(
      rhythm.back.includes('—'),
      `${name}: &mdash; was not decoded, the answer reads ${JSON.stringify(rhythm.back)}`,
    );
    check(
      !rhythm.front.includes('<'),
      `${name}: HTML survived into the card front: ${JSON.stringify(rhythm.front)}`,
    );
  }

  /*
   * Cloze, which is what a medical deck is almost entirely made of.
   *
   * The note is "The {{c1::mitral}} valve lies between the left atrium and
   * the {{c2::left ventricle}}, and is also called the {{c1::bicuspid}}
   * valve." Two cards. Card 1 must hide *both* c1 deletions and show c2;
   * card 2 must hide only c2. Getting that backwards, or hiding every
   * deletion on every card, leaves a sentence nobody can read.
   */
  const clozeCards = cards.filter(card => card.front.includes('valve lies between'));
  check(clozeCards.length === 2, `${name}: ${clozeCards.length} cloze cards from a two-cloze note`);
  const c1 = clozeCards.find(card => card.front.includes('left ventricle'));
  const c2 = clozeCards.find(card => card.front.includes('mitral'));
  check(!!c1 && !!c2, `${name}: the two cloze cards are not distinguishable`);
  if (c1) {
    check(
      !c1.front.includes('mitral') && !c1.front.includes('bicuspid'),
      `${name}: card 1 leaks a c1 answer: ${JSON.stringify(c1.front)}`,
    );
    check(
      (c1.front.match(/\[\.\.\.\]/g) ?? []).length === 2,
      `${name}: card 1 should have two holes, has ${JSON.stringify(c1.front)}`,
    );
    check(
      c1.back.includes('mitral') && c1.back.includes('bicuspid'),
      `${name}: card 1's answer does not fill its holes: ${JSON.stringify(c1.back)}`,
    );
  }
  if (c2) {
    check(
      !c2.front.includes('left ventricle') && c2.front.includes('mitral'),
      `${name}: card 2 hides the wrong deletion: ${JSON.stringify(c2.front)}`,
    );
  }

  // A hint replaces the ellipsis in the brackets.
  const hinted = cards.find(card => card.front.includes('First-line treatment'));
  check(!!hinted, `${name}: the hinted cloze card is missing`);
  if (hinted) {
    check(
      hinted.front.includes('[antiplatelet]'),
      `${name}: the cloze hint was dropped: ${JSON.stringify(hinted.front)}`,
    );
    check(
      !hinted.front.includes('aspirin'),
      `${name}: the hinted deletion leaked its answer: ${JSON.stringify(hinted.front)}`,
    );
  }
  check(
    cards.filter(card => card.front.includes('First-line treatment')).length === 3,
    `${name}: a three-cloze note did not make three cards`,
  );

  // Both directions of a reversed note, from one note.
  const forward = cards.find(card => card.front === 'Bradycardia');
  const backward = cards.find(card => card.front.startsWith('A heart rate below'));
  check(
    !!forward && !!backward,
    `${name}: Basic (and reversed card) did not produce both directions`,
  );

  // Audio comes out as a filename rather than as literal [sound:] markup.
  const murmur = cards.find(card => card.front.startsWith('Listen to this murmur'));
  check(!!murmur, `${name}: the audio card is missing`);
  if (murmur) {
    check(
      murmur.audio.join() === 'murmur.mp3',
      `${name}: audio is ${JSON.stringify(murmur.audio)}`,
    );
    check(
      !murmur.front.includes('[sound:'),
      `${name}: the [sound:] tag was left in the text: ${JSON.stringify(murmur.front)}`,
    );
  }

  // The media list, and the rule that only referenced files are unpacked.
  check(media.length === 3, `${name}: media list has ${media.length} entries, expected 3`);
  const wanted = apkg.referencedMedia(cards);
  const extract = apkg.mediaToExtract(media, wanted);
  check(
    extract.length === 2,
    `${name}: would unpack ${extract.length} media files, expected 2 — the third is unreferenced`,
  );
  check(
    !extract.some(entry => entry.name === 'unused-diagram.png'),
    `${name}: unpacked a picture no card points at`,
  );
  for (const entry of extract) {
    check(zip.has(entry.index), `${name}: media entry ${entry.name} has no zip entry ${entry.index}`);
  }

  // Deck names, which schema 18 stores with an unprintable separator.
  const summary = apkg.deckSummary(collection);
  check(
    summary.some(deck => deck.name === 'Medicine::Cardiology'),
    `${name}: deck names are ${JSON.stringify(summary.map(d => d.name))} — \\x1f was not converted`,
  );
  check(
    !summary.some(deck => deck.name.includes('\x1f')),
    `${name}: a deck name still has the unit separator in it`,
  );

  report.push(
    `${name.padEnd(14)} v${layout.version}  schema ${String(collection.schema).padStart(2)}  ` +
      `${collection.notetypes.length} notetypes  ${cards.length} cards  ` +
      `${extract.length}/${media.length} media`,
  );
  void byId;
}

/* --------------------------------------------------- the pure-function edges */

// A package from a newer Anki has to be refused, not guessed at.
let refused = false;
try {
  apkg.packageLayout(['meta', 'collection.anki2'], new Uint8Array([0x08, 0x63]));
} catch (error) {
  refused = error.kind === 'tooNew';
}
check(refused, 'a package declaring an unknown version was not refused');

// A `meta` that says version 1 must win over a `collection.anki21` sitting
// beside it. Filenames are the fallback, never the answer.
check(
  apkg.packageLayout(['meta', 'collection.anki2', 'collection.anki21'], new Uint8Array([0x08, 0x01]))
    .collectionEntry === 'collection.anki2',
  'the filename beat `meta` when both were present',
);

// Comma ordinals put one deletion on several cards.
check(
  JSON.stringify(apkg.clozeOrdinals('{{c1,3::shared}} and {{c2::other}}')) === '[1,2,3]',
  'comma-separated cloze ordinals were not expanded',
);
check(
  apkg.revealCloze('{{c1,3::shared}}', 3, true) === '[...]',
  'a card whose ordinal is in a comma list did not hide its deletion',
);

// Nested clozes: the outer hole hides everything inside it.
check(
  apkg.revealCloze('{{c1::outer {{c2::inner}}}}', 1, true) === '[...]',
  'a nested cloze did not hide as one hole',
);
check(
  apkg.revealCloze('{{c1::outer {{c2::inner}}}}', 2, true) === 'outer [...]',
  'the inner cloze did not hide on its own card',
);

// Conditional sections, which is how a notetype hides an empty extra field.
check(
  apkg.renderTemplate('{{#Extra}}<b>{{Extra}}</b>{{/Extra}}', { Extra: '' }, { question: false }) ===
    '',
  'an empty field still rendered its conditional section',
);
check(
  apkg
    .renderTemplate('{{^Extra}}none{{/Extra}}', { Extra: '' }, { question: false })
    .includes('none'),
  'an inverted section did not render for an empty field',
);

// `{{type:Field}}` is a typing box, and printing the answer into the question
// would hand it over.
check(
  apkg.renderTemplate('{{type:Back}}', { Back: 'secret' }, { question: true }) === '',
  '{{type:...}} printed the answer instead of being dropped',
);

// An unknown filter must pass the field through rather than blank the card.
check(
  apkg.renderTemplate('{{someaddon:Front}}', { Front: 'kept' }, { question: true }) === 'kept',
  'an unknown filter blanked the field instead of passing it through',
);

/* ------------------------------------------------------- the Kotlin agrees */

const kotlin = path.join(
  root,
  'android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/ApkgModule.kt',
);
if (fs.existsSync(kotlin)) {
  const raw = fs.readFileSync(kotlin, 'utf8');
  /*
   * Kotlin splits a long string across lines with `" +\n  "`, so the file
   * never literally contains the joined query. Rejoining is what lets these
   * be compared to the TypeScript at all.
   */
  const source = raw.replace(/"\s*\+\s*\n\s*"/g, '');
  for (const [name, sql] of Object.entries(apkg.SQL)) {
    check(source.includes(sql), `ApkgModule.kt does not run the same SQL for ${name}`);
  }
  /*
   * The device runs a SQLite with no `unicase`, so the rule that keeps these
   * queries readable there has to hold in the Kotlin too.
   *
   * Comments are stripped first. The file explains this rule at length and
   * quotes the very pattern it forbids, so scanning the prose makes the check
   * fail on its own documentation — which is a check that punishes writing any
   * of this down.
   */
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ');
  check(
    !/ORDER BY\s+name|WHERE\s+name\s*=/i.test(code),
    'ApkgModule.kt orders or filters on a name column — that needs the `unicase` collation, ' +
      'which no SQLite outside Anki has',
  );
} else {
  report.push('note           ApkgModule.kt not present yet; the SQL pinning is skipped');
}

/* ------------------------------------------------------------- round trip */

/*
 * Export a deck, then import it back.
 *
 * This is the strongest thing that can be checked without a phone: the writer
 * and the reader are independent — one builds `col.models` JSON and note rows,
 * the other parses them and applies card templates — so a deck that survives
 * the trip means both halves agree about the format rather than agreeing with
 * each other's mistakes.
 *
 * The package is built here the same way `ApkgModule.export` builds one on the
 * device: a schema 11 SQLite database, the rows from `buildExport`, and a ZIP
 * with a JSON media map. The Kotlin is a transcription of these twenty lines.
 */
const exportBundle = await build({
  entryPoints: [path.join(root, '..', 'src/lib/apkgExport.ts')],
  bundle: true,
  format: 'esm',
  write: false,
  platform: 'neutral',
  absWorkingDir: root,
  alias: { '@': path.join(root, 'src') },
});
const exporter = await import(
  `data:text/javascript;base64,${Buffer.from(exportBundle.outputFiles[0].text).toString('base64')}`
);

/** A one-pixel PNG, as a data URI — the shape a written card's picture has. */
const PNG_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const written = {
  name: 'Cranial nerves',
  cards: [
    { id: 'c1', kind: 'theory', front: 'Which nerve is CN VII?', back: 'The facial nerve', tags: ['cn'] },
    {
      id: 'c2',
      kind: 'image',
      front: 'Name this foramen',
      back: 'Foramen ovale',
      imageUrl: PNG_DATA_URI,
    },
    // An empty card, which must be dropped rather than exported as a card
    // nobody can answer.
    { id: 'c3', kind: 'theory', front: '   ', back: '' },
  ],
};

const pkg = exporter.buildExport(written, Date.UTC(2026, 0, 2, 12));

check(pkg.notes.length === 2, `exported ${pkg.notes.length} notes, expected 2 (the empty one is dropped)`);
check(pkg.media.length === 1, `exported ${pkg.media.length} media files, expected 1`);
check(
  pkg.fileName === 'Cranial nerves.apkg',
  `the file would be called ${pkg.fileName}`,
);
// sha1, against a value anyone can check with `printf abc | sha1sum`.
check(
  exporter.sha1Hex('abc') === 'a9993e364706816aba3e25717850c26c9cd0d89d',
  `sha1 is wrong: ${exporter.sha1Hex('abc')}`,
);

/** Write the package the way the device writes it. */
function writePackage(bundle, outPath) {
  const temp = path.join(os.tmpdir(), `apkg-export-${process.pid}.anki2`);
  if (fs.existsSync(temp)) fs.unlinkSync(temp);
  const db = new DatabaseSync(temp);
  db.exec(`
    CREATE TABLE col (id integer PRIMARY KEY, crt integer NOT NULL, mod integer NOT NULL,
      scm integer NOT NULL, ver integer NOT NULL, dty integer NOT NULL, usn integer NOT NULL,
      ls integer NOT NULL, conf text NOT NULL, models text NOT NULL, decks text NOT NULL,
      dconf text NOT NULL, tags text NOT NULL);
    CREATE TABLE notes (id integer PRIMARY KEY, guid text NOT NULL, mid integer NOT NULL,
      mod integer NOT NULL, usn integer NOT NULL, tags text NOT NULL, flds text NOT NULL,
      sfld integer NOT NULL, csum integer NOT NULL, flags integer NOT NULL, data text NOT NULL);
    CREATE TABLE cards (id integer PRIMARY KEY, nid integer NOT NULL, did integer NOT NULL,
      ord integer NOT NULL, mod integer NOT NULL, usn integer NOT NULL, type integer NOT NULL,
      queue integer NOT NULL, due integer NOT NULL, ivl integer NOT NULL, factor integer NOT NULL,
      reps integer NOT NULL, lapses integer NOT NULL, left integer NOT NULL, odue integer NOT NULL,
      odid integer NOT NULL, flags integer NOT NULL, data text NOT NULL);
    CREATE TABLE revlog (id integer PRIMARY KEY, cid integer NOT NULL, usn integer NOT NULL,
      ease integer NOT NULL, ivl integer NOT NULL, lastIvl integer NOT NULL,
      factor integer NOT NULL, time integer NOT NULL, type integer NOT NULL);
    CREATE TABLE graves (usn integer NOT NULL, oid integer NOT NULL, type integer NOT NULL);
    CREATE INDEX ix_cards_nid ON cards (nid);
    CREATE INDEX ix_notes_csum ON notes (csum);
  `);
  db.prepare(
    'INSERT INTO col VALUES (1,?,?,?,11,0,0,0,?,?,?,?,?)',
  ).run(bundle.crt, Date.now(), Date.now(), bundle.conf, bundle.models, bundle.decks, bundle.dconf, '{}');
  const note = db.prepare("INSERT INTO notes VALUES (?,?,?,?,-1,?,?,?,?,0,'')");
  for (const row of bundle.notes) {
    note.run(row.id, row.guid, row.mid, row.mod, row.tags, row.flds, row.sfld, row.csum);
  }
  const card = db.prepare("INSERT INTO cards VALUES (?,?,?,?,?,-1,0,0,?,0,0,0,0,0,0,0,0,'')");
  for (const row of bundle.cards) {
    card.run(row.id, row.nid, row.did, row.ord, row.mod, row.due);
  }
  db.close();

  const collection = fs.readFileSync(temp);
  fs.unlinkSync(temp);

  // A stored-only ZIP, which is all this needs and is fifty lines rather than
  // a dependency. The device uses java.util.zip.
  const files = [{ name: 'collection.anki2', data: collection }];
  files.push({ name: 'media', data: Buffer.from(exporter.mediaMap(bundle), 'utf8') });
  for (const item of bundle.media) {
    files.push({ name: item.index, data: Buffer.from(item.base64, 'base64') });
  }
  const chunks = [];
  const central = [];
  let offset = 0;
  const crcTable = [...Array(256)].map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc32 = buf => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const crc = crc32(file.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    chunks.push(local, nameBuf, file.data);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(file.data.length, 20);
    entry.writeUInt32LE(file.data.length, 24);
    entry.writeUInt16LE(nameBuf.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBuf);
    offset += local.length + nameBuf.length + file.data.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  fs.writeFileSync(outPath, Buffer.concat([...chunks, centralBuf, end]));
}

const roundTripPath = path.join(os.tmpdir(), `apkg-roundtrip-${process.pid}.apkg`);
try {
  writePackage(pkg, roundTripPath);
  const reopened = openPackage(roundTripPath);
  const back = apkg.cardsFromCollection(reopened.collection);

  check(
    reopened.layout.version === 1,
    `the exported package reads as version ${reopened.layout.version}, expected 1`,
  );
  check(back.length === 2, `the exported deck came back as ${back.length} cards, expected 2`);

  const facial = back.find(card => card.front.includes('CN VII'));
  check(!!facial, 'the first card did not survive the round trip');
  if (facial) {
    check(
      facial.back === 'The facial nerve',
      `the answer came back as ${JSON.stringify(facial.back)}`,
    );
    check(facial.deck === 'Cranial nerves', `the deck came back named ${facial.deck}`);
    check(facial.tags.join() === 'cn', `the tags came back as ${facial.tags.join()}`);
  }

  const foramen = back.find(card => card.front.includes('foramen'));
  check(!!foramen, 'the picture card did not survive the round trip');
  if (foramen) {
    check(
      foramen.backMedia.length === 1,
      `the picture came back as ${JSON.stringify(foramen.backMedia)}`,
    );
    check(
      foramen.back.includes('Foramen ovale'),
      `the answer text was lost beside the picture: ${JSON.stringify(foramen.back)}`,
    );
    // The bytes have to be in the zip under the index the media map gives.
    const entry = reopened.media.find(item => item.name === foramen.backMedia[0]);
    check(!!entry, 'the picture is named on a card but missing from the media map');
    check(
      !!entry && reopened.zip.has(entry.index),
      'the media map names a zip entry that is not in the package',
    );
  }

  report.push(
    `round trip     wrote ${pkg.notes.length} notes + ${pkg.media.length} media, read back ${back.length} cards`,
  );
} catch (error) {
  failures.push(`round trip: ${error.message}`);
} finally {
  if (fs.existsSync(roundTripPath)) fs.unlinkSync(roundTripPath);
}

/* ------------------------------------------------- the module is reachable */

/*
 * Under the New Architecture a module registered any other way is never asked
 * for at all: `NativeModules.OrbitApkg` is simply undefined, with no crash, no
 * warning and nothing in a log. This app has already shipped one that did not
 * exist on every device — the sound module — so the four pieces that make a
 * TurboModule are asserted rather than assumed. See check:native-sound.
 */
const kotlinDir = path.join(root, 'android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd');
const pieces = {
  spec: path.join(root, 'src/native/NativeOrbitApkg.ts'),
  module: path.join(kotlinDir, 'ApkgModule.kt'),
  pkg: path.join(kotlinDir, 'ApkgPackage.kt'),
  app: path.join(kotlinDir, 'MainApplication.kt'),
  gradle: path.join(root, 'android/app/build.gradle'),
  proguard: path.join(root, 'android/app/proguard-rules.pro'),
};
const missing = Object.entries(pieces).filter(([, file]) => !fs.existsSync(file));
check(missing.length === 0, `missing: ${missing.map(([name]) => name).join(', ')}`);

if (missing.length === 0) {
  const read = name => fs.readFileSync(pieces[name], 'utf8');
  const spec = read('spec');
  const module = read('module');
  const pkg = read('pkg');

  check(
    /TurboModuleRegistry\.get</.test(spec),
    'NativeOrbitApkg uses getEnforcing — a missing module should hide the feature, not crash the app',
  );
  const codegen = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).codegenConfig;
  check(
    codegen?.jsSrcsDir === 'src/native',
    'codegenConfig no longer points at src/native, so no spec is generated for this module',
  );
  check(
    /class ApkgModule\([^)]*\)\s*:\s*NativeOrbitApkgSpec/.test(module),
    'ApkgModule does not extend the generated NativeOrbitApkgSpec',
  );
  check(
    /class ApkgPackage\s*:\s*BaseReactPackage/.test(pkg),
    'ApkgPackage is not a BaseReactPackage — a plain ReactPackage is never read under the New Architecture',
  );
  check(
    /isTurboModule\s*=\s*\*\/\s*true/.test(pkg) || /\/\*\s*isTurboModule[^*]*\*\/\s*true/.test(pkg),
    'ApkgPackage does not declare isTurboModule = true',
  );
  check(
    /add\(ApkgPackage\(\)\)/.test(read('app')),
    'MainApplication never adds ApkgPackage, so the module is not registered at all',
  );

  // zstd is the one thing Android has no version of, and every modern package
  // needs it. A minified release build drops it without the keep rule, so the
  // importer would work in every test build and fail only in the shipped one.
  check(
    /com\.github\.luben:zstd-jni/.test(read('gradle')),
    'zstd-jni is not a dependency — every Anki package made since 2.1.50 is zstd and cannot be read without it',
  );
  check(
    /-keep class com\.github\.luben\.zstd/.test(read('proguard')),
    'no ProGuard keep for zstd — R8 cannot see JNI callbacks, so the importer would fail only in the release build',
  );

  /*
   * The version has to be one whose native libraries are 16 KB aligned.
   *
   * Android 15 allows a 16 KB memory page size, and a `.so` whose LOAD
   * segments are aligned to less than that cannot be mapped — the app dies on
   * `System.loadLibrary`, which here is the moment somebody opens their first
   * Anki package. Play rejected version 14 for exactly this and named
   * `libzstd-jni-1.5.6-9.so`.
   *
   * `ndkVersion` cannot fix it. That governs code this project compiles;
   * zstd-jni ships an AAR with the `.so` files already built, so their
   * alignment was decided by whoever published that version. Google's own
   * remediation text says "upgrade to NDK r28", and following it here would
   * have changed nothing — which is worth knowing before an afternoon is spent
   * on it.
   *
   * Measured from the published AARs, maximum PT_LOAD alignment:
   *
   *              1.5.6-9   1.5.7-16
   *   arm64-v8a    65536      16384
   *   x86_64        4096      16384   <- the failure
   *
   * 1.5.7-1 is the first release of the 1.5.7 line, so the floor is that. If
   * this needs changing, re-measure rather than trusting a release note: the
   * alignment is not mentioned in one.
   */
  const zstdVersion = (read('gradle').match(/com\.github\.luben:zstd-jni:(\d+)\.(\d+)\.(\d+)-(\d+)/) ?? []).slice(1).map(Number);
  check(
    zstdVersion.length === 4,
    'the zstd-jni version could not be read out of build.gradle',
  );
  if (zstdVersion.length === 4) {
    const [maj, min, patch] = zstdVersion;
    const atLeast157 =
      maj > 1 || (maj === 1 && min > 5) || (maj === 1 && min === 5 && patch >= 7);
    check(
      atLeast157,
      `zstd-jni is pinned to ${zstdVersion.slice(0, 3).join('.')}-${zstdVersion[3]}, whose x86_64 ` +
        'library is 4 KB aligned. Play refuses that as "your app could crash on 16 KB devices", ' +
        'and no NDK setting on our side can change a prebuilt AAR — use 1.5.7-1 or later',
    );
  }

  // The picker must stay permissionless, the same rule the note and photo
  // pickers follow.
  check(
    /ACTION_OPEN_DOCUMENT/.test(module),
    'the package picker no longer uses ACTION_OPEN_DOCUMENT',
  );
  const manifest = fs.readFileSync(
    path.join(root, 'android/app/src/main/AndroidManifest.xml'),
    'utf8',
  );
  check(
    !/READ_MEDIA_|READ_EXTERNAL_STORAGE|MANAGE_EXTERNAL_STORAGE/.test(manifest),
    'a storage permission appeared in the manifest — ACTION_OPEN_DOCUMENT needs none, and asking for the whole device to read one file is not a trade this app makes',
  );

  // An imported deck is somebody's own study material and stays on the phone.
  check(
    !/supabase|http:\/\/|https:\/\//.test(module.replace(/\/\*[\s\S]*?\*\//g, '')),
    'ApkgModule reaches the network — an imported deck never leaves the phone',
  );

  /* ---- the export half ---- */

  check(/override fun exportDeck\(/.test(module), 'ApkgModule cannot write a package');
  check(/override fun share\(/.test(module), 'ApkgModule cannot hand a package to the share sheet');
  // The oldest layout on the way out, so every Anki can open it — and so our
  // own importer reads it without decompressing anything.
  check(
    /ZipEntry\("collection\.anki2"\)/.test(module),
    'the export does not write collection.anki2 — the oldest layout is what makes the file openable everywhere',
  );
  check(
    !/anki21b/.test(module.replace(/\/\*[\s\S]*?\*\//g, '')),
    'the export writes a version 3 package, which nothing before Anki 2.1.50 can open',
  );

  /*
   * A `file://` URI in an Intent throws FileUriExposedException on anything
   * since Android 7, so sharing needs a FileProvider — and the provider must
   * expose exactly the directory the module writes into and nothing else.
   */
  const manifestPath = path.join(root, 'android/app/src/main/AndroidManifest.xml');
  const manifestXml = fs.readFileSync(manifestPath, 'utf8');
  const pathsFile = path.join(root, 'android/app/src/main/res/xml/orbit_file_paths.xml');
  check(
    /androidx\.core\.content\.FileProvider/.test(manifestXml),
    'no FileProvider in the manifest — sharing a file would throw FileUriExposedException',
  );
  check(
    /android:authorities="\$\{applicationId\}\.fileprovider"/.test(manifestXml),
    'the FileProvider authority is not built from ${applicationId}, so the debug build collides with the release one',
  );
  check(
    /android:exported="false"/.test(
      manifestXml.slice(manifestXml.indexOf('<provider'), manifestXml.indexOf('</provider>')),
    ),
    'the FileProvider is exported — nothing may query it except through the grant we attach',
  );
  check(fs.existsSync(pathsFile), 'res/xml/orbit_file_paths.xml is missing');
  if (fs.existsSync(pathsFile)) {
    const paths = fs.readFileSync(pathsFile, 'utf8');
    check(
      /path="apkg-share\/"/.test(paths) && /SHARING = "apkg-share"/.test(module),
      'the shared directory in orbit_file_paths.xml and ApkgModule disagree — the share would throw IllegalArgumentException',
    );
    check(
      !/<root-path|<external-path/.test(paths),
      'the FileProvider exposes more than the sharing directory, which is a way to read the reader\'s own notes by guessing a path',
    );
  }
}

/* -------------------------------------------------------------------- done */

process.stdout.write(`${report.join('\n')}\n`);
if (failures.length > 0) {
  process.stdout.write(`\nFAIL ${failures.length} problem(s):\n`);
  for (const line of failures) {
    process.stdout.write(`  - ${line}\n`);
  }
  process.exit(1);
}
process.stdout.write('\nOK   all three package versions import to the same 10 cards\n');
