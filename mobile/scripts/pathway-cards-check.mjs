// A pathway flashcard is read in one place and drawn in two.
//
// `generate-flashcards` writes an ordered chain onto the back of a first-year
// pathway card — the plate the question already owns, plus the steps that plate
// draws. Three programs then have to agree about that payload: the Deno edge
// function that writes it, the React Native screen that draws it on a phone,
// and the React component that draws it in a browser.
//
// Nothing in tsc, eslint or the preview harness can see any of that agreement:
//
//   • The edge function is Deno and is not in either app's typecheck. Its
//     reader is written twice by necessity — an edge function cannot import the
//     browser tree — so "twice" has to be enforced as "identically".
//   • The two renderers are a React Native tree and a DOM tree. They cannot be
//     one component, so the thing that must be one is the *reader*, and there
//     is nothing in either app stopping a second one appearing.
//   • The failure this guards is the one the notes renderer already shipped:
//     `String(item)` over a model-returned object, which writes the literal
//     text `[object Object]` onto the card. It was invisible for weeks because
//     the demo fixture had been written with plain strings and agreed with the
//     bug.
//
// So: one reader, both apps importing it, the server's copy field-for-field
// identical to it, the identity rule intact, and the reader actually run over
// the shapes a model really returns.
//
//   node scripts/pathway-cards-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const SHARED = 'src/lib/pathwayCards.ts';
const SERVER = 'supabase/functions/generate-flashcards/index.ts';
const NATIVE_VIEW = 'mobile/src/components/PathwayFlow.tsx';
const WEB_VIEW = 'src/components/flashcards/PathwayFlow.tsx';
const NATIVE_SCREEN = 'mobile/src/screens/FlashcardsScreen.tsx';
const WEB_SCREEN = 'src/components/flashcards/StudyView.tsx';
const IDENTITY = 'src/lib/questionDiagrams.ts';

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};
const read = file => fs.readFile(path.join(root, file), 'utf8');

const [shared, server, nativeView, webView, nativeScreen, webScreen, identity] = await Promise.all(
  [SHARED, SERVER, NATIVE_VIEW, WEB_VIEW, NATIVE_SCREEN, WEB_SCREEN, IDENTITY].map(f =>
    read(f).catch(() => null),
  ),
);

for (const [file, body] of [
  [SHARED, shared],
  [SERVER, server],
  [NATIVE_VIEW, nativeView],
  [WEB_VIEW, webView],
  [NATIVE_SCREEN, nativeScreen],
  [WEB_SCREEN, webScreen],
  [IDENTITY, identity],
]) {
  check(body !== null, `${file} is missing`);
}

// ---------------------------------------------------------------------------
// 1. One reader, and both apps use it.
// ---------------------------------------------------------------------------

if (nativeView && webView) {
  check(
    /from '@shared\/pathwayCards'/.test(nativeView),
    `${NATIVE_VIEW} does not import the shared reader — @shared/pathwayCards is the one home for this shape`,
  );
  check(
    /from "@\/lib\/pathwayCards"/.test(webView),
    `${WEB_VIEW} does not import the shared reader from @/lib/pathwayCards`,
  );
  for (const [file, body] of [
    [NATIVE_VIEW, nativeView],
    [WEB_VIEW, webView],
  ]) {
    check(
      /normalizePathway\(/.test(body),
      `${file} draws a pathway without going through normalizePathway — the raw payload may hold ` +
        `bare strings or objects, and reading it directly is how [object Object] reached a card`,
    );
    check(
      !/function normalizePathway/.test(body),
      `${file} defines its own normalizePathway. There is exactly one, in ${SHARED}.`,
    );
    check(
      !/String\(\s*step/.test(body) && !/String\(\s*item/.test(body),
      `${file} stringifies a step. An object rendered that way prints as [object Object]; read ` +
        `named fields through the shared reader instead.`,
    );
  }
}

// A second copy anywhere under either app.
const CODE = new Set(['.ts', '.tsx']);
async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      yield* walk(full);
    } else if (CODE.has(path.extname(entry.name))) {
      yield full;
    }
  }
}
for (const dir of ['src', 'mobile/src']) {
  for await (const file of walk(path.join(root, dir))) {
    const rel = path.relative(root, file);
    if (rel === SHARED) continue;
    const body = await fs.readFile(file, 'utf8');
    check(
      !/function normalizePathway/.test(body),
      `${rel} carries a second normalizePathway. It belongs in ${SHARED} only.`,
    );
  }
}

// ---------------------------------------------------------------------------
// 2. The server's reader and the shared one read the same field names.
//
// They are written twice because an edge function cannot import the browser
// tree. That is the only excuse for two copies, and it does not extend to two
// answers: a server writing `description` into a payload whose reader only
// looks for `detail` produces a chain of labels with every detail silently
// dropped, and nothing anywhere says so.
// ---------------------------------------------------------------------------

const fieldNames = (body, call) => {
  const match = new RegExp(`field\\(\\s*${call}\\s*,([^)]*)\\)`, 'g');
  const out = [];
  for (const m of body.matchAll(match)) {
    out.push(
      m[1]
        .split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
        .join('|'),
    );
  }
  return out;
};

if (shared && server) {
  const sharedLabels = fieldNames(shared, 'item');
  const serverLabels = fieldNames(server, 'item');
  check(
    sharedLabels.length > 0 && serverLabels.length > 0,
    'could not find the step field lists in one of the two readers',
  );
  check(
    JSON.stringify(sharedLabels) === JSON.stringify(serverLabels),
    `the step field names differ.\n    ${SHARED}: ${JSON.stringify(sharedLabels)}\n    ${SERVER}: ${JSON.stringify(serverLabels)}`,
  );

  for (const name of ['MAX_PATHWAY_STEPS', 'MIN_PATHWAY_STEPS']) {
    const a = new RegExp(`${name}\\s*=\\s*(\\d+)`).exec(shared);
    const b = new RegExp(`${name}\\s*=\\s*(\\d+)`).exec(server);
    check(a !== null, `${SHARED} no longer defines ${name}`);
    check(b !== null, `${SERVER} no longer defines ${name}`);
    if (a && b) {
      check(
        Number(b[1]) <= Number(a[1]) || name === 'MIN_PATHWAY_STEPS',
        `${name}: the server writes up to ${b[1]} steps and the reader keeps ${a[1]} — ` +
          `the extra ones are dropped silently`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 3. A plate is still chosen by identity, and a pathway card doubly so.
//
// .agents/rules/97-diagram-rows.md: no text rule may attach a plate to a
// question, in either direction. A pathway card goes further — it prints a
// chain *asserting what the picture shows* — so it may only ever be built from
// a row that reached the deck through the identity join.
// ---------------------------------------------------------------------------

if (server && identity) {
  const serverId = /function diagramQuestionId[\s\S]*?\n}/.exec(server)?.[0] ?? '';
  const sharedId = /export function questionDiagramId[\s\S]*?\n}/.exec(identity)?.[0] ?? '';
  const shape = body => /slice\(0,\s*(\d+)\)[\s\S]*?replace\(\/\\s\+\/g,\s*['"]-['"]\)/.exec(body);
  const a = shape(serverId);
  const b = shape(sharedId);
  check(a !== null, `${SERVER}: diagramQuestionId is no longer "first N chars, whitespace dashed"`);
  check(b !== null, `${IDENTITY}: questionDiagramId is no longer "first N chars, whitespace dashed"`);
  check(
    a && b && a[1] === b[1],
    `the per-question key length differs — server slices ${a?.[1]}, the apps slice ${b?.[1]}. ` +
      `A different 50 matches nothing, which looks exactly like the chapter having no diagrams.`,
  );

  check(
    /\.in\("question_id",/.test(server) && /\.in\("question_text",/.test(server),
    `${SERVER}: the identity join is gone. A plate is found by question_id and by question_text, ` +
      `both equalities, and never by a keyword search.`,
  );
  check(
    /d\?\.identity/.test(server) && /PATHWAY_KINDS\.has/.test(server),
    `${SERVER}: a pathway card is built from something other than an identity-matched row whose ` +
      `own diagram_kind says it draws a process. A chain written under a plate the question does ` +
      `not own is a wrong answer stated confidently.`,
  );
  check(
    /const\s+PATHWAY_KINDS\s*=\s*new Set\(\[[^\]]*"flowchart"/.test(server),
    `${SERVER}: PATHWAY_KINDS no longer reads the diagram_kind column`,
  );
  check(
    !/score|keyword|ENTITY_FAMILIES/i.test(
      /---- 1\. Diagrams for this chapter ----[\s\S]*?---- 2\./.exec(server)?.[0] ?? '',
    ),
    `${SERVER}: the diagram section has grown a score or a keyword table. That premise is wrong — ` +
      `a question that mentions a pathway is not a question about it.`,
  );
}

// ---------------------------------------------------------------------------
// 4. The chain is an enrichment, never the whole card.
//
// A deck built before this field existed has no chain, and a plate that fails
// to load must still leave a card worth answering. Both screens therefore have
// to render the written back as well, and to say something better than "this
// diagram could not be loaded" when there are steps standing in for it.
// ---------------------------------------------------------------------------

for (const [file, body] of [
  [NATIVE_SCREEN, nativeScreen],
  [WEB_SCREEN, webScreen],
]) {
  if (!body) continue;
  check(
    /face\.pathway/.test(body) && /PathwayFlow/.test(body),
    `${file} never draws a card's pathway`,
  );
  check(
    /face\.back/.test(body),
    `${file} no longer renders the written back — the chain is an enrichment, not a replacement`,
  );
  check(
    /normalizePathway\(face\.pathway\)/.test(body) && /steps above are the answer/.test(body),
    `${file}: when the plate fails to load, a card that still has its chain must say so. ` +
      `"This diagram could not be loaded" over a perfectly good answer reads as a dead card.`,
  );
  check(
    /CARD_MODE_LABEL/.test(body),
    `${file} does not show what the card is asking for — the recall/why/clinical chip`,
  );
}

// ---------------------------------------------------------------------------
// 5. Run the reader over what a model really returns.
// ---------------------------------------------------------------------------

const mod = await import(path.join(root, SHARED));
const { normalizePathway, MAX_PATHWAY_STEPS, pathwayStepLabel, normalizeCardMode } = mod;

const objectChain = normalizePathway({
  steps: [
    { label: 'Glucose → Glucose-6-phosphate', detail: 'Hexokinase / glucokinase; 1 ATP spent' },
    { label: 'F6P → Fructose-1,6-bisphosphate', detail: 'PFK-1, rate-limiting; 1 ATP spent' },
    { label: '1,3-BPG → 3-phosphoglycerate', detail: 'Substrate-level phosphorylation; 2 ATP' },
  ],
  caption: 'PFK-1 is the rate-limiting step and the one regulation questions ask about.',
});
check(objectChain !== null, 'an ordinary three-step chain was rejected');
check(objectChain?.steps?.[1]?.detail?.includes('PFK-1'), 'the detail field was dropped');

// The model does sometimes return bare strings. The notes renderer shipped a
// bug precisely because its fixture did not.
const stringChain = normalizePathway({ steps: ['Glutamate', 'Ornithine', 'Citrulline'] });
check(stringChain?.steps?.length === 3, 'a chain of bare strings was rejected');
check(
  stringChain?.steps?.every(s => typeof s.label === 'string' && s.label.length > 0),
  'a bare-string step did not become a label',
);

// Nothing may ever come out as the literal text of a stringified object.
const objecty = normalizePathway({ steps: [{ description: 'only a detail' }, { label: 'ok' }] });
check(
  JSON.stringify(objecty ?? {}).indexOf('[object Object]') === -1,
  'a step was stringified — this is the notes renderer bug returning',
);

check(
  normalizePathway({ steps: [{ label: 'one' }] }) === null,
  'a single-step "chain" was accepted. An arrow pointing at nothing reads as a rendering bug.',
);
check(normalizePathway(null) === null, 'null was not rejected');
check(normalizePathway({ steps: 'glycolysis' }) === null, 'a string in place of steps was accepted');
check(
  normalizePathway({
    steps: Array.from({ length: 20 }, (_, i) => ({ label: `step ${i}` })),
  })?.steps?.length === MAX_PATHWAY_STEPS,
  `a twenty-step pathway was not capped at ${MAX_PATHWAY_STEPS}`,
);

check(
  pathwayStepLabel({ label: 'A → B', detail: 'enzyme' }, 0, 3) === 'Step 1 of 3. A → B. enzyme',
  'the spoken step label is not one ordered sentence — TalkBack would read fragments with no position',
);
check(normalizeCardMode('applied') === 'applied', 'a valid mode was rejected');
check(normalizeCardMode('vignette') === undefined, 'an unknown mode was kept — it would render as a chip reading nonsense');

if (failures.length > 0) {
  for (const failure of failures) process.stdout.write(`  FAIL  ${failure}\n`);
  process.stdout.write(`\n${failures.length} problem(s) with pathway flashcards.\n`);
  process.exit(1);
}

process.stdout.write(
  'OK  one pathway reader, both apps use it, the server writes the same fields, ' +
    'plates stay identity-matched, and a chain survives strings, objects and a missing plate\n',
);
