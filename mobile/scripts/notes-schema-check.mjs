// The notes fixture has to match the edge function, not the renderer.
//
// generate-handwritten-notes documents its section payloads in the prompt it
// sends the model, and every list item in them is an **object**:
//
//   bullets    items: { label, description }[]
//   steps      items: { title, description, keyTrigger? }[]
//   morphology items: { title, tag?, details: string[] }[]
//   comparison rows:  { label, left, right }[]
//   flowchart  steps: { label, detail }[]
//   revision   items: string[]
//
// The native renderer was written against a fixture that used plain strings
// throughout, so it ran every item through String(). On real notes that
// printed the literal text "[object Object]" — and because the model does
// sometimes return bare strings, some topics looked perfect while a third-year
// Community Medicine topic was unreadable. The demo screen could never show
// it, because the fixture agreed with the bug.
//
// This asserts three things:
//   1. the fixture uses the documented object shapes
//   2. the renderer reads named fields and never stringifies an object
//   3. the shapes above still match what the edge function's prompt declares
//
//   node scripts/notes-schema-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const check = (ok, message) => {
  if (!ok) {
    failures.push(message);
  }
};

const fixture = await fs.readFile(path.join(root, 'preview/notesSample.ts'), 'utf8');
const renderer = await fs.readFile(path.join(root, 'src/components/NotesContentView.tsx'), 'utf8');

/** Comments explain these traps; searching them as code finds the prose. */
const code = text =>
  text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');

// 1. The fixture's items must be objects with the documented keys.
for (const [section, keys] of [
  ['bullets', ['label', 'description']],
  ['steps', ['title', 'description']],
  ['morphology', ['title', 'details']],
  ['flowchart', ['label', 'detail']],
]) {
  for (const key of keys) {
    check(
      new RegExp(`\\b${key}:`).test(fixture),
      `preview/notesSample.ts never uses "${key}", so the ${section} branch is untested`,
    );
  }
}
check(
  /rows: \[\s*\{ label:/.test(fixture),
  'comparison rows in the fixture have no label — the renderer would drop the axis silently',
);

// 2. The renderer must read fields, not stringify items.
const rendererCode = code(renderer);
check(
  !/String\(item\)/.test(rendererCode),
  'NotesContentView stringifies items again — objects will render as [object Object]',
);
check(
  !/asStrings/.test(rendererCode),
  'NotesContentView still has asStrings(), which flattens objects to [object Object]',
);
check(
  /function field\(/.test(rendererCode),
  'NotesContentView has no field() reader for named item fields',
);
for (const key of ['label', 'description', 'keyTrigger', 'details', 'detail', 'title']) {
  // Either read by name through field(), or accessed as a property — details
  // is an array, so it has its own reader rather than going through field().
  check(
    rendererCode.includes(`'${key}'`) || new RegExp(`\\.${key}\\b`).test(rendererCode),
    `NotesContentView never reads "${key}" — that part of an item is dropped`,
  );
}
check(
  /section\.payload \?\?/.test(rendererCode) && /as unknown as Record</.test(rendererCode),
  'NotesContentView does not fall back to the section itself when payload is absent, as the web app does',
);

// 2b. The two things the web app does to prose that the port had dropped.
check(
  /function Inline\(/.test(rendererCode) && /\\\*\\\*/.test(rendererCode),
  'NotesContentView does not render **bold** — the model marks the examinable word and it would print asterisks',
);
check(
  /function AskedRow\(/.test(rendererCode),
  'NotesContentView has no AskedRow — the per-section PYQ years lose their count',
);
check(
  !/Asked: \{/.test(rendererCode),
  'NotesContentView still prints "Asked: a, b, c" instead of the count-and-chips row',
);
check(
  /\*\*/.test(fixture),
  'the fixture has no **bold**, so the highlight path is untested',
);

// 2c. Prose carries pictures, so every run of prose has to be able to draw one.
//
// generate-handwritten-notes prepends the matched question_diagrams row as a
// *definition* section whose text is `![alt](url)`, and the model drops the
// same markdown into paragraphs, bullet descriptions and comparison cells. The
// first attempt special-cased two section types, so a shotgun-cartridge
// definition rendered the picture and everything else printed
//
//     ![Parts of a 12-Gauge Shotgun Cartridge](https://…supabase.co/storage/…
//
// at the reader. RichText is the single place that splits a run into text and
// images; Inline is its private helper. Any <Inline> outside it is a run of
// prose that would print the markdown instead of the diagram.
check(
  /function RichText\(/.test(rendererCode),
  'NotesContentView has no RichText — image markdown in prose would print as raw text',
);
const inlineUses = [...rendererCode.matchAll(/<Inline\b/g)].length;
const richTextBody = rendererCode.slice(
  rendererCode.indexOf('function RichText('),
  rendererCode.indexOf('function Inline('),
);
const inlineInsideRichText = [...richTextBody.matchAll(/<Inline\b/g)].length;
check(
  inlineUses === inlineInsideRichText,
  `NotesContentView renders <Inline> directly in ${inlineUses - inlineInsideRichText} place(s) ` +
    'outside RichText — that prose would print ![alt](url) instead of the diagram',
);
check(
  !/imgMatch|cleanText/.test(rendererCode),
  'NotesContentView is back to matching images per section type — only the first image survives, and only in the types that were special-cased',
);
// The fixture must still exercise image-markdown-in-prose, which is how the
// edge function delivers a diagram: a `definition` section whose text is
// `![alt](url)` and a caption. What it must NOT do is name a real host.
//
// This used to require `storage/v1/object/public` in the fixture — it was
// asserting that the fixture pointed at Supabase storage. Nothing in a sandbox
// can reach that host and the object it named had been deleted from the
// bucket, so `DiagramCard` fell to its error branch and the captured
// screenshot read **"This diagram could not be loaded."** That capture is what
// the ad renderer draws for every note shot in every ad; it shipped, and was
// reported twice. The check was holding the bug in place.
//
// So: the markdown has to be there, and the URL has to be a parameter rather
// than a literal. A fixture that reaches the network to render is a fixture
// that fails differently on every machine.
check(
  /!\[/.test(fixture) && /\(' \+ diagramUrl \+ '\)/.test(fixture),
  'the fixture has no image markdown, so the diagram path in prose is untested',
);
check(
  !/storage\/v1\/object\/public/.test(fixture),
  'the fixture names a real storage URL again — it cannot be reached from a ' +
    'sandbox, and the capture that fails becomes "This diagram could not be ' +
    'loaded" inside every ad',
);

// 3. The edge function's shapes are no longer asserted from source, and that
//    is deliberate.
//
//    They used to be read out of supabase/functions/generate-handwritten-notes/
//    index.ts. That copy was two versions behind what is deployed and nothing
//    deployed from it, so the assertions were green against a file the server
//    had never run — two of them ("still attaches question_diagrams", "still
//    emits image markdown") asserted behaviour the live function does not have
//    at all. A check that passes by reading the wrong file is worse than no
//    check, because it is counted as coverage.
//
//    The copy is gone (see that folder's README for where the real one lives
//    and what it does). What survives here is everything that can be checked
//    against code this repo actually ships: the fixture and the renderer, both
//    above, plus the client-side book map in check:textbooks.

if (failures.length > 0) {
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(`\n${failures.length} problem(s) — notes would render wrong on a phone.\n`);
  process.exit(1);
}
process.stdout.write('OK  notes fixture and renderer agree\n');
