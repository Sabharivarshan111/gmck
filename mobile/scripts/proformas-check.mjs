/*
 * The clinical case proformas: structure, uniqueness, and pictures that exist.
 *
 * There is no typechecker in this sandbox — npm cannot reach the registry — and
 * these files are data rather than logic, so the failures they produce are the
 * quiet kind: a duplicate id silently shadows a case in the picker, a
 * `diagramPath` with a typo renders an empty frame in the Guide tab, and a
 * `system` that is not in the union puts a case in a department nobody can
 * filter to. None of that throws.
 *
 * So this walks the proforma sources as text and asserts the things that have
 * to be true of every case:
 *
 *  - the fields the modal reads are all present,
 *  - ids are unique across every file, because CLINICAL_PROFORMAS is one array,
 *  - every `system` is one the picker offers, since the picker builds its
 *    counts from a fixed list and a case outside it is unreachable,
 *  - every `diagramPath` names a plate this repo actually knows about.
 *
 * The diagram rule is the one worth explaining. A question with no diagram
 * shows nothing, which is correct and is what `question_diagrams` does; but a
 * proforma naming a plate that does not exist shows a broken frame, and that is
 * the same failure the 39 broken diagram rows were. Checked against the repo's
 * own public/diagrams/ tree plus the paths already shipped, since the bucket
 * itself is unreachable from here.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const here = fileURLToPath(new URL('.', import.meta.url));
const repo = join(here, '..', '..');

const sources = [
  join(here, '..', 'src', 'lib', 'clinicalProformas.ts'),
  ...readdirSync(join(here, '..', 'src', 'lib', 'proformas'))
    .filter(f => f.endsWith('.ts'))
    .map(f => join(here, '..', 'src', 'lib', 'proformas', f)),
];

// Plates this repo holds. The bucket has more (most were generated elsewhere
// and never committed), so a path not found here is reported as unverifiable
// rather than as an error — except when it is plainly malformed.
const plates = new Set();
const diagramRoot = join(repo, 'public', 'diagrams');
if (existsSync(diagramRoot)) {
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else plates.add(relative(diagramRoot, full).split('\\').join('/'));
    }
  };
  walk(diagramRoot);
}

const ALLOWED_SYSTEMS = new Set([
  'General Medicine',
  'General Surgery',
  'Pediatrics',
  'Orthopaedics',
  'Obstetrics & Gynaecology',
  'ENT',
  'Ophthalmology',
]);

const failures = [];
const warnings = [];
const seen = new Map();
let total = 0;

for (const file of sources) {
  const text = readFileSync(file, 'utf8');
  const name = relative(repo, file);

  // Each proforma object: from "id: '...'" to the matching "vivaQuestions".
  const ids = [...text.matchAll(/^ {4}id: '([a-z0-9_]+)',$/gm)];
  for (const match of ids) {
    total += 1;
    const id = match[1];
    if (seen.has(id)) {
      failures.push(
        `Duplicate proforma id "${id}" in ${name} — it is already in ${seen.get(id)}. ` +
          `CLINICAL_PROFORMAS is ONE array, so the second one silently shadows the first ` +
          `in the picker and neither the counts nor the search will say so.`,
      );
    }
    seen.set(id, name);

    // The block for this proforma: up to the next id, or the end.
    const start = match.index;
    const nextId = ids.find(m => m.index > start);
    const block = text.slice(start, nextId ? nextId.index : text.length);

    for (const field of ['title', 'system', 'department', 'summary', 'examPearl']) {
      if (!new RegExp(`^ {4}${field}:`, 'm').test(block)) {
        failures.push(`Proforma "${id}" (${name}) has no ${field}. The modal reads it.`);
      }
    }
    for (const field of ['sections', 'vivaQuestions']) {
      if (!new RegExp(`^ {4}${field}: \\[`, 'm').test(block)) {
        failures.push(`Proforma "${id}" (${name}) has no ${field} array.`);
      }
    }

    const sys = block.match(/^ {4}system: '([^']+)'/m);
    if (sys && !ALLOWED_SYSTEMS.has(sys[1])) {
      failures.push(
        `Proforma "${id}" is in system "${sys[1]}", which the picker does not offer. ` +
          `Add it to SYSTEMS and SYSTEM_COLOUR in ClinicalProformaModal.tsx and to ` +
          `ProformaSystem in clinicalProformas.ts, or the case is unreachable.`,
      );
    }

    const diagram = block.match(/^ {4}diagramPath: '([^']+)'/m);
    if (diagram) {
      const path = diagram[1];
      if (!path.startsWith('/diagrams/')) {
        failures.push(
          `Proforma "${id}" has diagramPath "${path}", which does not start with ` +
            `/diagrams/. resolveProformaDiagramUrl strips that prefix to build the ` +
            `bucket URL, so anything else resolves to the wrong place.`,
        );
      } else {
        const key = path.replace(/^\/diagrams\//, '');
        if (!plates.has(key)) {
          warnings.push(
            `Proforma "${id}" names ${path}, which is not in this repo's ` +
              `public/diagrams/. It may still be in the bucket — most plates were ` +
              `generated elsewhere — but it cannot be verified from here.`,
          );
        }
      }
      if (!/^ {4}diagramTitle: '/m.test(block)) {
        failures.push(
          `Proforma "${id}" has a diagramPath but no diagramTitle, so the picture ` +
            `renders with an empty caption.`,
        );
      }
    }
  }
}

// These high-risk OBG cases come directly from the owner's uploaded college
// case sheets. Keep them pinned: dropping a per-subject file from the aggregate
// import otherwise looks like a perfectly healthy picker with missing cases.
for (const id of [
  'obg_anaemia_pregnancy_proforma',
  'obg_preeclampsia_proforma',
  'obg_previous_lscs_proforma',
  'obg_rh_negative_proforma',
  'obg_heart_disease_pregnancy_proforma',
  'obg_twin_pregnancy_proforma',
  'obg_fibroid_aub_proforma',
  'obg_primary_infertility_pcod_proforma',
]) {
  if (!seen.has(id)) {
    failures.push(`Source-grounded OBG case "${id}" is missing from the proforma sources.`);
  }
}

if (warnings.length) {
  console.log('check:proformas notes\n');
  for (const w of warnings) console.log('  ? ' + w + '\n');
}

if (failures.length) {
  console.error('check:proformas FAILED\n');
  for (const f of failures) console.error('  - ' + f + '\n');
  process.exit(1);
}

// ── The picker itself ──────────────────────────────────────────────────────
// Forty cases in a flat list is a wall, and every department must have a
// colour or its cards render in whatever the last branch of the lookup was.
const modal = readFileSync(
  new URL('../src/components/ClinicalProformaModal.tsx', import.meta.url),
  'utf8',
);

const pickerFailures = [];
const pick = (ok, message) => {
  if (!ok) pickerFailures.push(message);
};

pick(
  /groupedProformas/.test(modal) && /showGroupHeadings/.test(modal),
  'The picker is a flat list again. Forty near-identical rows with no headings ' +
    'means finding your case requires reading all of them.',
);

// The two references a student needs WHILE clerking. Both were reachable only
// from inside a case before — the general examination in each Guide tab, the
// normal values nowhere at all — and a reference you have to navigate into is
// a reference people stop opening.
pick(
  /styles\.quickRefRow/.test(modal) &&
    /setExamSheetOpen\(true\)/.test(modal) &&
    /setLabSheetOpen\(true\)/.test(modal),
  'The General Examination and Normal Lab Values buttons are gone from above ' +
    'the search. Both are needed on a ward round without opening a case sheet.',
);

// Directly under the search, by the owner's choice: the search box is what
// the screen is for, and anything above it pushes that down the page.
pick(
  modal.indexOf('{/* Search Bar */}') < modal.indexOf('styles.quickRefRow') &&
    modal.indexOf('styles.quickRefRow') < modal.indexOf('{/* Subject Filter Pills */}'),
  'The quick-reference row is no longer directly under the search box. It sits ' +
    'between the search and the department filters.',
);

pick(
  /from '@\/components\/GeneralExamSheet'/.test(modal),
  'The standalone general-examination page is unmounted.',
);

const examSheet = readFileSync(
  new URL('../src/components/GeneralExamSheet.tsx', import.meta.url),
  'utf8',
);
pick(
  /<GeneralExamSigns/.test(examSheet),
  'GeneralExamSheet no longer renders the shared GeneralExamSigns component. A ' +
    'second copy of the nineteen signs is nineteen chances to drift.',
);

pick(
  /filteredProformas\.length === 0/.test(modal),
  'The empty state is gone. A filter or search matching nothing then looks ' +
    'exactly like a screen that failed to load.',
);

const colourBlock = modal.slice(
  modal.indexOf('const SYSTEM_COLOUR'),
  modal.indexOf('};', modal.indexOf('const SYSTEM_COLOUR')),
);
for (const sys of ALLOWED_SYSTEMS) {
  const key = /[^A-Za-z]/.test(sys) ? `'${sys}'` : sys;
  pick(
    colourBlock.includes(key),
    `SYSTEM_COLOUR has no entry for "${sys}", so its cards fall through to the ` +
      `default. This lookup replaced a five-deep nested ternary precisely because ` +
      `a missing department rendered pink and nothing said so.`,
  );
}

if (pickerFailures.length) {
  console.error('check:proformas FAILED (picker)\n');
  for (const f of pickerFailures) console.error('  - ' + f + '\n');
  process.exit(1);
}

const bySystem = new Map();
for (const file of sources) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/^ {4}system: '([^']+)'/gm)) {
    bySystem.set(m[1], (bySystem.get(m[1]) ?? 0) + 1);
  }
}
const summary = [...bySystem.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([s, n]) => `${s} ${n}`)
  .join(', ');
console.log(`check:proformas OK  — ${total} cases: ${summary}`);
