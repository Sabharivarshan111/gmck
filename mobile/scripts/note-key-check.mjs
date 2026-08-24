// A single-question note must ask for it under the web app's exact cache key.
//
// generate-handwritten-notes caches on `subtopic_key`, and for a triple tap
// that key is
//
//     single::<subjectKey>::<hashKey(question)>
//
// The diagram pass wrote a "🎨 High-Yield Visual Exam Diagram" section into
// 75+ existing handwritten_notes rows under exactly those keys. A key that
// matches returns one of them instantly with its picture; a key that is one
// character off matches nothing, spends Gemini quota, and comes back without
// the diagram — with no error anywhere, because a cache miss is a normal
// outcome.
//
// The native port got this wrong in the way that is easiest to get wrong: it
// hashed getCleanQuestionText(), which strips the ★ markers, while the web app
// hashes a string that still has them. Same question, same subject, different
// row.
//
// This asserts the four things that make up the request, against the web app's
// own source rather than against a copy of it.
//
//   node scripts/note-key-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.join(root, '..');
const failures = [];
const check = (ok, message) => {
  if (!ok) {
    failures.push(message);
  }
};

const read = file => fs.readFile(file, 'utf8').catch(() => null);

const web = await read(path.join(repo, 'src/components/handwritten/SingleQuestionNoteOverlay.tsx'));
const webCard = await read(path.join(repo, 'src/components/QuestionCard.tsx'));
const native = await read(path.join(root, 'src/lib/handwrittenNotes.ts'));
const nativeText = await read(path.join(root, 'src/lib/questionText.ts'));
const nativeRow = await read(path.join(root, 'src/components/QuestionRow.tsx'));

if (!web || !webCard) {
  process.stdout.write('SKIP  the web app is not in this checkout\n');
  process.exit(0);
}
check(Boolean(native && nativeText && nativeRow), 'the native note files are missing');

// 1. The key template.
check(
  /`single::\$\{[^}]+\}::\$\{hashKey\(/.test(web),
  'the web overlay no longer builds `single::<subject>::<hash>` — this check needs rewriting against whatever replaced it',
);
check(
  native !== null && /`single::\$\{(?:request\.)?subjectKey\}::\$\{hashKey\(/.test(native),
  'handwrittenNotes.ts does not build the key as `single::${subjectKey}::${hashKey(...)}` — the phone would land on its own cache rows',
);

// 2. The hash. Same algorithm, character for character.
const hashBody = source => {
  // The *definition*, not the first call site — native calls hashKey inside
  // fetchSingleQuestionNote long before it declares it.
  const at = source.search(/function hashKey\s*\(/);
  const body = at === -1 ? '' : source.slice(at, at + 400);
  return {
    shift: /<< 5\) - h/.test(body.replace(/hash/g, 'h')),
    int32: /\| 0/.test(body),
    base36: /toString\(36\)/.test(body),
    abs: /Math\.abs/.test(body),
  };
};
const a = hashBody(web);
const b = native ? hashBody(native) : {};
for (const part of ['shift', 'int32', 'base36', 'abs']) {
  check(
    a[part] === b[part],
    `hashKey differs between the apps at "${part}" — the same question hashes to two different rows`,
  );
}

// 3. The question string that gets hashed.
//
// The web app's getCleanQuestionText only strips leading numbering. Native has
// a getCleanQuestionText that strips much more, for display, so the note path
// must use the separate one that matches.
check(
  /replace\(\/\^\\d\+\\\.\\s\/, ''\)/.test(webCard),
  'the web QuestionCard no longer strips only the leading number — noteQuestionText has to follow whatever it does now',
);
check(
  nativeText !== null && /export function noteQuestionText/.test(nativeText),
  'questionText.ts has no noteQuestionText — the note path would fall back to the display cleaner and miss every cached row',
);
if (nativeText) {
  const fn = nativeText.slice(
    nativeText.indexOf('export function noteQuestionText'),
    nativeText.indexOf('/** Body text with the trailing markers stripped'),
  );
  check(
    !/STAR_PATTERN|★/.test(fn),
    'noteQuestionText strips the ★ markers — the web app keeps them, so every hash would differ',
  );
  check(
    !/\.trim\(\)/.test(fn),
    'noteQuestionText trims — the web app does not, and trailing space changes the hash',
  );
}
check(
  nativeRow !== null && /onNote\(noteQuestionText\(question\)\)/.test(nativeRow),
  'QuestionRow does not send noteQuestionText(question) to the note path',
);

// 4. subtopicName. The web app sends the first 80 characters.
const slice = source =>
  [...source.matchAll(/slice\(0,\s*(\d+)\)/g)].map(m => m[1]);
check(
  slice(web).includes('80'),
  'the web overlay no longer uses an 80-character subtopicName',
);
check(
  native !== null && /subtopicName: clean\.slice\(0, 80\)/.test(native),
  'handwrittenNotes.ts does not send an 80-character subtopicName like the web app',
);

if (failures.length > 0) {
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(
    `\n${failures.length} problem(s) — the phone would miss the cached notes, diagrams included.\n`,
  );
  process.exit(1);
}
process.stdout.write('OK  a triple-tap note asks under the same cache key as the web app\n');
