/*
 * The general examination has to SHOW the sign, and it has to keep the licence.
 *
 * Two rules here, and both are the kind that quietly stop being true:
 *
 * 1. Every sign carries search terms, so the fetch workflow can find it a
 *    photograph. A sign added to the catalogue with no `search` is a sign that
 *    silently never gets a picture, and nothing else would ever report it.
 *
 * 2. The attribution is displayed. These photographs are taken from Wikimedia
 *    Commons under public domain or a commercial-use Creative Commons licence,
 *    and CC-BY requires attribution. An attribution that is fetched, stored and
 *    never rendered is a licence nobody is keeping — so the credit line is
 *    asserted to exist in the component that draws the picture, not merely to
 *    exist in the data.
 *
 * The licence gate itself lives in the workflow rather than the app, so it is
 * checked here too: NC and ND must be refused. This app ships on Play under a
 * real developer account and a clinical photograph is somebody's work.
 */
import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');

const signs = read('../src/lib/generalExamSigns.ts');
const component = read('../src/components/GeneralExamSigns.tsx');
const workflow = read('../../.github/workflows/exam-sign-images.yml');
const manifest = read('../src/lib/examSignImages.ts');

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// Every sign block, by id, with its body.
const blocks = [...signs.matchAll(/\{\s*id: '([a-z0-9-]+)',([\s\S]*?)\n  \},/g)];
check(blocks.length >= 15, `Only ${blocks.length} signs found — the catalogue looks truncated.`);

for (const [, id, body] of blocks) {
  check(
    /search: \[\s*'[^']+'/.test(body),
    `Sign "${id}" has no search terms, so the fetch workflow can never find it a ` +
      `photograph and it will stay text-only for ever without anything saying so.`,
  );
  check(
    /titleMustContain: \[\s*'[^']+'/.test(body),
    `Sign "${id}" has no titleMustContain gate. Commons full-text search matches ` +
      `the file PAGE rather than the subject, so an ungated search returned a ` +
      `portrait of a film-maker for "clubbing" and a Roman bronze nail cleaner ` +
      `for "platonychia". A plausible wrong picture is worse than none.`,
  );
  check(
    !/titleMustContain: \[[^\]]*'(nail|hand|eye|skin|face|finger)'/.test(body),
    `Sign "${id}" has a generic word in its titleMustContain gate. "nail", ` +
      `"hand" and the like let every one of the wrong hits through — the gate ` +
      `has to be the sign's own distinctive vocabulary.`,
  );
  check(/name: '/.test(body), `Sign "${id}" has no name.`);
  check(/definition:/.test(body), `Sign "${id}" has no definition.`);
  check(/whereToLook:/.test(body), `Sign "${id}" does not say where to look.`);
}

// The seven of PICCKLE must all be present — it is the line every proforma in
// this repo recites, and a missing one is a hole in every case sheet at once.
for (const id of [
  'pallor',
  'icterus',
  'cyanosis-central',
  'clubbing',
  'koilonychia',
  'lymphadenopathy',
  'edema',
]) {
  check(
    blocks.some(b => b[1] === id),
    `PICCKLE is incomplete: "${id}" is missing from the sign catalogue.`,
  );
}

check(
  /picture\?\.credit \|\| picture\?\.licence/.test(component) &&
    /styles\.credit/.test(component),
  'The credit line is gone from GeneralExamSigns. CC-BY requires attribution, ' +
    'and an attribution nobody displays is a licence nobody is keeping.',
);

check(
  /No freely-licensed photograph for this sign yet/.test(component),
  'The no-picture state is gone. A sign whose only available images are not ' +
    'licensed for commercial use must say so rather than show an empty frame ' +
    'that reads as a failed load.',
);

// Matched as plain substrings: the workflow's own pattern contains regex
// metacharacters ("non-?commercial"), so a regex written to match the LICENCE
// would not match the SOURCE that rejects it.
check(
  workflow.includes('commercial') && workflow.includes('deriv') && /BAD\s*=\s*re\.compile/.test(workflow),
  'The fetch workflow no longer refuses NC and ND licences. Only public domain ' +
    'and commercial-use Creative Commons may be taken — this app ships on Play.',
);

check(
  /OK_LICENCES\s*=\s*re\.compile/.test(workflow),
  'The allow-list of acceptable licences is gone from the fetch workflow, so ' +
    'anything at all could be downloaded into a shipped app.',
);

check(
  !/examSignImages\.json/.test(workflow) && !/examSignImages\.json/.test(component),
  'Something still refers to examSignImages.json. The manifest is TypeScript ' +
    'because a JSON import needs resolveJsonModule, a flag this repo does not own.',
);

check(
  /do not edit by hand/i.test(manifest),
  'examSignImages.ts has lost the "generated, do not edit" notice. The next ' +
    'workflow run overwrites whatever is there.',
);

if (failures.length) {
  console.error('check:exam-signs FAILED\n');
  for (const f of failures) console.error('  - ' + f + '\n');
  process.exit(1);
}
console.log(
  `check:exam-signs OK  — ${blocks.length} signs, all searchable, credit displayed, NC/ND refused.`,
);
