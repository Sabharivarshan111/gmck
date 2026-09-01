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
  entryPoints: [path.join(root, 'src/lib/apkgFormat.ts')],
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
