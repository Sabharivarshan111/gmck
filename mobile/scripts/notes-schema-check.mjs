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
check(
  /!\[/.test(fixture) && /storage\/v1\/object\/public/.test(fixture),
  'the fixture has no image markdown, so the diagram path in prose is untested',
);

// 3. The edge function still declares those shapes.
const fn = await fs
  .readFile(path.join(root, '..', 'supabase/functions/generate-handwritten-notes/index.ts'), 'utf8')
  .catch(() => null);
if (fn) {
  const declares = (type, fragment) =>
    check(
      fn.includes(fragment),
      `the edge function no longer declares ${type} as ${fragment} — the renderer needs updating`,
    );
  declares('bullets', '"items": [ { "label": string, "description": string } ]');
  declares('steps', '"items": [ { "title": string, "description": string, "keyTrigger"?: string } ]');
  declares('flowchart', '"steps": [ { "label": string, "detail": string } ]');
  declares('comparison', '"rows": [ { "label": string, "left": string, "right": string } ]');
  check(
    /attachDiagramToContent/.test(fn) && /question_diagrams/.test(fn),
    'the edge function no longer attaches question_diagrams — notes would ship without their exam diagrams',
  );
  check(
    /!\[[^\]]*\]\(\$\{/.test(fn),
    'the edge function no longer emits the diagram as image markdown — RichText reads exactly that shape',
  );
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(`\n${failures.length} problem(s) — notes would render wrong on a phone.\n`);
  process.exit(1);
}
process.stdout.write('OK  notes fixture, renderer and edge-function schema agree\n');
