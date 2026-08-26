// The triple-tap gate must follow the textbooks, not the year.
//
// mobile/src/lib/textbooks.ts mirrors `pickBookKey` from the deployed
// generate-handwritten-notes function. The server decides what it can ground an
// answer in; the client only decides whether to offer the button. If the two
// disagree, one of two things happens and neither is visible:
//
//   • client says yes, server says no  → a "handwritten note" with no textbook
//     behind it, which is the generic answer wearing the grounded one's badge
//   • client says no, server says yes  → a student is turned away from an
//     answer that was sitting there. This is the one that actually shipped:
//     the gate was `year === 'third-year'` from when Community and Forensic
//     were the only two books, and it stayed that way through six more.
//
// Run:  node scripts/textbooks-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

/**
 * The deployed function's rules, as of version 47 (2026-08-25), transcribed.
 *
 * A snapshot rather than a live fetch on purpose: CI has no service-role key
 * and must not have one — that key bypasses RLS. Re-read the function with the
 * Supabase MCP connector when it changes, and update this table with it.
 */
const SERVER_RULES = [
  ['community', ['community', 'psm', 'preventive', 'social medicine']],
  ['forensic', ['forensic', 'fmt', 'toxicology']],
  ['pharmacology', ['pharmac', 'drug']],
  ['pathology', ['patholog']],
  ['microbiology', ['microbio', 'bacterio', 'virolog', 'mycolog', 'parasitolog', 'immunolog']],
  ['physiology', ['physiolog']],
  ['biochemistry', ['biochem']],
  ['anatomy', ['anatom', 'embryo', 'histolog', 'osteolog']],
];

const source = await fs.readFile(path.join(root, 'src/lib/textbooks.ts'), 'utf8');

// 1. Every server rule is present on the client, in the same order — the order
//    matters because the matches overlap ("drug" would otherwise catch
//    "Antimicrobial Drugs" before "microbio" ever runs).
let cursor = -1;
for (const [book, needles] of SERVER_RULES) {
  const at = source.indexOf(`return '${book}';`);
  check(at !== -1, `mobile/src/lib/textbooks.ts never returns '${book}' — the server has a book the client will not offer`);
  if (at !== -1) {
    check(at > cursor, `'${book}' is out of order against the deployed pickBookKey — overlapping matches resolve differently`);
    cursor = at;
  }
  for (const needle of needles) {
    check(
      source.includes(`'${needle}'`),
      `the client does not match "${needle}" for ${book}, but the deployed function does`,
    );
  }
}

// 2. The client must not invent a book the server has never heard of.
const clientBooks = [...source.matchAll(/return '([a-z]+)';/g)].map(m => m[1]);
const serverBooks = new Set(SERVER_RULES.map(([b]) => b));
for (const book of clientBooks) {
  check(serverBooks.has(book), `the client offers '${book}', which the deployed function cannot ground — the note would be ungrounded`);
}

// 3. The gate itself. A year comparison here is the bug coming back.
const screen = await fs.readFile(path.join(root, 'src/screens/BrowseNodeScreen.tsx'), 'utf8');
check(
  /notesAvailable\s*=.*hasTextbook\(/.test(screen),
  'BrowseNodeScreen no longer gates the handwritten note on hasTextbook()',
);
check(
  !/notesAvailable\s*=\s*year ===/.test(screen),
  "the note gate is back to comparing the year — it must follow the subject's textbook",
);

// 4. Every subject in the shipped bank lands where it should. This is the part
//    that would have caught the original bug on its own.
const bank = await fs.readFile(path.join(root, '..', 'src/data/questionBankData.ts'), 'utf8');
const EXPECTED = {
  'first-year': ['anatomy', 'physiology', 'biochemistry'],
  'second-year': ['pharmacology', 'pathology', 'microbiology'],
  'third-year': ['forensic-medicine', 'community-medicine'],
};
const matches = (subject) => {
  const s = subject.toLowerCase();
  return SERVER_RULES.some(([, needles]) => needles.some(n => s.includes(n)));
};
for (const [year, subjects] of Object.entries(EXPECTED)) {
  check(bank.includes(`"${year}"`), `the question bank no longer has a ${year}`);
  for (const subject of subjects) {
    check(matches(subject), `${year}/${subject} has a textbook on the server but does not match — it would be silently turned away`);
  }
}
// Final year has no books, and must not pretend to.
for (const subject of ['general-medicine', 'obstetrics-gynaecology', 'ent', 'ophthalmology', 'paediatrics']) {
  check(!matches(subject), `${subject} matched a book — final year has none, so this note would be ungrounded`);
}

// 5. No textbook is ever named to the reader.
//
// A student is studying, not being handed a bibliography, and the notes
// function is told the same thing in its own prompt ("DO NOT include page
// numbers or textbook citations", "never mention OCR/pages/edition inside the
// notes"). The diagram card carried a hardcoded "Park & Vision FMT" caption,
// which was both a book name and — once first and second year were switched on
// — flatly wrong, since it named third year's two books above an Anatomy
// diagram.
//
// Checked against rendered strings only. The book *keys* ('anatomy',
// 'community') are internal and fine; what may not appear is an author or a
// title.
const NAMES = [
  'Park', 'Vision FMT', 'Tripathi', 'Shanbhag', 'Sembulingam',
  'Vasudevan', 'Ramadas', 'Nayak', 'Sastry', 'Vishram', 'Langman',
];
const uiFiles = [];
const walk = async (dir) => {
  for (const entry of await fs.readdir(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(rel);
    } else if (/\.tsx?$/.test(entry.name)) {
      uiFiles.push(rel);
    }
  }
};
await walk('src');
for (const file of uiFiles) {
  // eslint-disable-next-line no-await-in-loop
  const body = await fs.readFile(path.join(root, file), 'utf8');
  // Strings and JSX text, never comments — the reasoning is allowed to name
  // the books; the interface is not.
  const withoutComments = body
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  for (const name of NAMES) {
    check(
      !withoutComments.includes(name),
      `${file} names a textbook ("${name}") outside a comment — the app never shows a book title to the reader`,
    );
  }
}

if (failures.length > 0) {
  for (const failure of failures) process.stdout.write(`  FAIL  ${failure}\n`);
  process.stdout.write(`\n${failures.length} problem(s) — the triple tap and its textbooks disagree.\n`);
  process.exit(1);
}
process.stdout.write(
  `OK  ${SERVER_RULES.length} books mirrored across 3 years, final year correctly has none, ` +
    `no book named in ${uiFiles.length} source files\n`,
);
