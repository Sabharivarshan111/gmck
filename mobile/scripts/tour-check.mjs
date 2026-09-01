// The walkthrough must point at controls that exist, and must never name a book.
//
// Two failure modes, both silent, both of which this repo has already had in
// other forms:
//
//   • A label the tour points at gets reworded. The spotlight then finds
//     nothing, the step quietly degrades to a plain card, and the arrow that
//     was the whole point of the step is gone — with nothing red anywhere.
//     `check:smoke` lost thirty seconds to exactly this rename
//     (`Anki flashcards` → `Anki-style flashcards`) weeks after it happened.
//   • Someone writes a textbook title or an author into a caption. The tour is
//     the most prose-heavy thing in the app and by far the likeliest place for
//     it. `check:textbooks` already walks src/ and would catch a name on its
//     list; this adds the ones a tour would reach for and that list would not.
//
// Run:  node scripts/tour-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

const read = file => fs.readFile(path.join(root, file), 'utf8');

/**
 * Comments removed before any "this file must not do X" assertion.
 *
 * Without it the check reads its own explanation: `preview/main.tsx` carries a
 * comment saying hydrateTour is deliberately not called here, and the check
 * for a call found the word in that sentence and failed. A check that a
 * comment can trip is a check that punishes writing things down.
 */
const strip = source =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const script = await read('src/tour/script.ts');
const overlay = strip(await read('src/components/TourOverlay.tsx'));
const demo = await read('src/components/TourGestureDemo.tsx');
const touchable = strip(await read('src/components/Touchable.tsx'));
const store = await read('src/tour/store.ts');
const previewMain = strip(await read('preview/main.tsx'));
const app = strip(await read('App.tsx'));

// ---- 1. Every control the tour points at exists -----------------------------
//
// Collected from the whole of src/, because a target may be a tab label defined
// in a table (BottomNav) rather than written at a call site.
const sources = [];
const walk = async dir => {
  for (const entry of await fs.readdir(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(rel);
    } else if (/\.tsx?$/.test(entry.name)) {
      sources.push(rel);
    }
  }
};
await walk('src');
const haystack = (
  await Promise.all(sources.filter(f => !f.startsWith('src/tour/')).map(read))
).join('\n');

const targets = [...script.matchAll(/target:\s*'([^']+)'/g)].map(m => m[1]);
check(targets.length >= 8, `only ${targets.length} steps point at a control — the tour has stopped pointing`);
for (const label of targets) {
  check(
    haystack.includes(`'${label}'`) || haystack.includes(`"${label}"`),
    `the tour points at "${label}", which no control in src/ is labelled — the spotlight would find nothing and the step would silently lose its arrow`,
  );
}

// ---- 2. The rehearsal teaches the real rhythm -------------------------------
//
// The demo row reproduces QuestionRow's multi-tap window. If the two drift, a
// reader practises a rhythm here that then fails on the actual list — worse
// than not rehearsing at all, because they would conclude the feature is
// broken rather than that they were taught wrong.
const row = await read('src/components/QuestionRow.tsx');
const windowOf = source => Number(/TAP_WINDOW_MS\s*=\s*(\d+)/.exec(source)?.[1]);
check(
  Number.isFinite(windowOf(row)) && windowOf(row) === windowOf(demo),
  `the walkthrough rehearses a ${windowOf(demo)}ms multi-tap window while QuestionRow uses ${windowOf(row)}ms`,
);

// ---- 3. No book, no author, no brand ---------------------------------------
//
// A student is studying, not being handed a bibliography, and naming somebody's
// textbook inside a shipped product is not ours to do. The notes function is
// told the same thing in its own prompt.
const FORBIDDEN = [
  'Park', 'Vision FMT', 'Tripathi', 'Shanbhag', 'Sembulingam',
  'Vasudevan', 'Ramadas', 'Nayak', 'Sastry', 'Vishram', 'Langman',
  'Gray', 'Harrison', 'Robbins', 'Bailey', 'Spotify', 'YouTube', 'Apple Music',
];
for (const file of ['src/tour/script.ts', 'src/components/TourOverlay.tsx', 'src/components/TourGestureDemo.tsx']) {
  const body = await read(file);
  for (const name of FORBIDDEN) {
    check(
      !body.includes(name),
      `${file} names "${name}" — the walkthrough may not name a textbook, an author or a music service`,
    );
  }
}

// ---- 4. Nobody can be trapped ----------------------------------------------
check(
  overlay.includes('Skip the walkthrough'),
  'the overlay no longer offers Skip — a first-run tour with no way out is the reason people uninstall',
);
check(
  /pointerEvents="box-none"/.test(overlay),
  'the overlay root is no longer box-none, so it swallows every touch and the spotlight hole stops being live',
);
check(
  overlay.includes('cardWrapCentred'),
  'the no-target case has lost its own wrapper style — an absolutely positioned box with no top and no bottom has zero height, so the card draws but cannot be pressed',
);
check(
  /paused/.test(overlay) && /setTourPaused/.test(store),
  'the tour no longer stands down for a blocking sheet, so it would argue with the non-dismissable profile gate on a fresh install',
);

// ---- 5. The registration stays cheap ---------------------------------------
//
// Touchable is in every row of a five-hundred-row list. Registering every one
// of them for a feature that runs once, for two minutes, on the first launch
// would be a cost paid by every reader for ever.
check(
  /isTourTarget\(label\)/.test(touchable),
  'Touchable registers tour targets without checking isTourTarget first — that is a ref and an effect per row of every long list',
);
check(
  /if\s*\(!isTarget/.test(touchable),
  'Touchable no longer bails out early for controls the tour never names',
);

// ---- 6. The preview must never start it on its own -------------------------
//
// An overlay that appeared by default would cover the screen for all of
// check:smoke's steps and fail every one for a reason unrelated to what they
// test.
check(
  previewMain.includes('tourParam') && /if \(tourParam\)/.test(previewMain),
  'the preview starts the walkthrough unconditionally — it would blank every smoke step behind a scrim',
);
check(
  !previewMain.includes('hydrateTour'),
  'the preview hydrates the tour, which is what decides to auto-start it',
);
check(
  /getTourState\(\)\.seen/.test(app),
  'App.tsx no longer checks whether this phone has already had the tour before starting it',
);

// ---- 7. The script is coherent ---------------------------------------------
const ids = [...script.matchAll(/^\s{4}id: '([^']+)',$/gm)].map(m => m[1]);
check(ids.length >= 12, `the script has only ${ids.length} steps`);
check(new Set(ids).size === ids.length, 'two steps share an id');
for (const chapter of ['study', 'notes', 'focus', 'look', 'progress']) {
  check(
    script.includes(`chapter: '${chapter}'`),
    `chapter "${chapter}" is declared but no step belongs to it — it would show as an empty replay row in Settings`,
  );
}

if (failures.length) {
  for (const failure of failures) {
    console.log(`  FAIL  ${failure}`);
  }
  console.log(`\n${failures.length} problem(s) — the walkthrough would mislead somebody.`);
  process.exit(1);
}
console.log(
  `OK  ${ids.length} steps, ${targets.length} of them pointing at a real control; no book named`,
);
