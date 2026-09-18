// Every organ in the simulator resolves to its own parts, all of them, and to
// nobody else's.
//
//   npm run check:simulator
//
// This runs the REAL resolver — `src/simulator/data/atlasResolver.ts`, imported
// directly, not a copy of its rules — against the REAL atlas,
// `public/models/atlas.json`, all 2,234 BodyParts3D meshes of it. That is the
// whole design: the resolver was moved out of `AnatomicalBody3D.tsx` so it
// could be loaded without `three`, which no plain Node script can load.
//
// What it is guarding against is one failure wearing several coats. The old
// resolver matched by substring, both when choosing which rule answered a key
// and when choosing which parts that rule took, and it filled its result from
// three sources that could only ever add. So:
//
//   * `bladder` contains `lad`, so isolating the gallbladder lit up
//     twenty-two branches of the left anterior descending coronary artery.
//   * the diaphragm rule also answered for `tendon`, so isolating the
//     diaphragm brought both calcaneal tendons up from the ankles.
//   * the heart rule excludes `cavity of …`, the hollow lumen casts, and all
//     four chamber cavities came back anyway, because the FMA concept named
//     "heart" had already added them and a Set has no un-add.
//   * BodyParts3D holds no peripheral nerves at all, so the vagus fell through
//     to the nerves of the orbit and the phrenic nerve to the phrenic
//     arteries and veins.
//
// None of that throws, none of it logs, and a student cannot tell a wrong
// answer from a right one — which is the reason they are looking at it. So the
// assertions below are specific: they name the structures that were wrong and
// the parts that must never come back with them.
//
// Low part counts are NOT a failure on their own. Many structures are genuinely
// a handful of meshes, and this atlas is a reference body rather than a
// complete one. What fails is a structure resolving to *nothing* without the
// resolver knowing it is absent, or resolving to something that is not it.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolverPath = path.join(root, 'src/simulator/data/atlasResolver.ts');
const { describeAtlasTarget } = await import(resolverPath);

const atlas = JSON.parse(readFileSync(path.join(root, 'public/models/atlas.json'), 'utf8'));
const byId = new Map(atlas.parts.map((p) => [p.id, p]));

const failures = [];
const fail = (msg) => failures.push(msg);

// ---------------------------------------------------------------------------
// Every target the dossier database can hand the 3D view
// ---------------------------------------------------------------------------

const organSrc = readFileSync(path.join(root, 'src/simulator/data/organAnatomyData.ts'), 'utf8');
const dbStart = organSrc.indexOf('export const ORGAN_ANATOMY_DATABASE');
if (dbStart < 0) fail('ORGAN_ANATOMY_DATABASE not found in organAnatomyData.ts');
const dbBody = organSrc.slice(dbStart);

/** The organ keys: the top-level entries of the database. */
const organKeys = [...dbBody.matchAll(/^ {2}([a-zA-Z_][\w]*):\s*\{/gm)].map((m) => m[1]);

/** The vessel and nerve node ids inside them, which are isolated the same way. */
const nodeIds = [...dbBody.matchAll(/^ {4,}id: '([^']+)',$/gm)].map((m) => m[1]);

const targets = [...new Set([...organKeys, ...nodeIds])];

if (organKeys.length < 15) fail(`only ${organKeys.length} organ keys parsed out of the dossier database — the parser has drifted from the file`);
if (targets.length < 25) fail(`only ${targets.length} isolation targets parsed — expected the organs plus their vessel and nerve nodes`);

const results = new Map();
for (const t of targets) results.set(t, describeAtlasTarget(t, atlas));

// A target must resolve, or be known to be absent. `unmatched` is the state
// that has no answer for the reader and no answer here either.
for (const [t, r] of results) {
  if (r.status === 'unmatched') {
    fail(`"${t}" resolves to nothing and is not declared absent — add a rule, or add it to an absent rule with the reason`);
  }
  if (r.status === 'absent' && !r.reason) {
    fail(`"${t}" is declared absent with no reason to show the reader`);
  }
}

// ---------------------------------------------------------------------------
// The specific wrong answers, each of which shipped
// ---------------------------------------------------------------------------

const names = (key) => [...describeAtlasTarget(key, atlas).ids].map((id) => byId.get(id)?.name ?? id);

/** No part of `key`'s answer may contain `word`. */
function mustNotContain(key, word, why) {
  const bad = names(key).filter((n) => new RegExp(`\\b${word}\\b`, 'i').test(n));
  if (bad.length) {
    fail(`"${key}" returns ${bad.length} part(s) matching "${word}" — ${why}\n      e.g. ${[...new Set(bad)].slice(0, 4).join(', ')}`);
  }
}

/** `key`'s answer must contain at least one part matching `word`. */
function mustContain(key, word, why) {
  const hit = names(key).some((n) => new RegExp(`\\b${word}\\b`, 'i').test(n));
  if (!hit) fail(`"${key}" returns nothing matching "${word}" — ${why}`);
}

/** `key` must resolve to nothing, because this atlas does not hold it. */
function mustBeAbsent(key) {
  const r = describeAtlasTarget(key, atlas);
  if (r.status !== 'absent' || r.ids.size > 0) {
    fail(`"${key}" resolved to ${r.ids.size} part(s) via rule "${r.rule}" — this atlas has no such structure, and a plausible substitute is worse than nothing`);
  }
}

// A key is chosen by whole words. `bladder` is not `lad`.
mustNotContain('bladder', 'coronary', 'the key contains the letters of "lad"; rule selection must be by whole words');
mustNotContain('gallbladder', 'coronary', 'same substring trap, with the gallbladder actually present');
mustNotContain('urinary bladder', 'coronary', 'same substring trap');
mustContain('urinary bladder', 'bladder', 'the urinary bladder is in this atlas');
mustContain('gallbladder', 'gallbladder', 'the gallbladder is in this atlas');

// A rule takes parts by whole words too, and only words that are its own.
mustNotContain('diaphragm', 'calcaneal', 'the diaphragm rule used to answer for "tendon" and then match any part named "… tendon"');
mustContain('diaphragm', 'diaphragm', 'the diaphragm is a single mesh in this atlas');

// A rule that claims a key owns the answer, so its exclusions mean something.
mustNotContain('heart', 'cavity', 'the heart rule excludes the hollow lumen casts, and the concept table used to put them back');
mustNotContain('heart', 'cerebral', 'nothing cerebral is in the heart');
mustContain('heart', 'papillary muscle', 'the papillary muscles are filed under the muscular system and have to be pulled in by id');
mustContain('heart', 'coronary sinus', 'the cardiac venous return belongs to the heart');

// Structures this atlas does not hold.
for (const key of ['vagus_nerve', 'phrenic_nerve', 'pectoral_nerves', 'splanchnic_nerves', 'axillary_nerve', 'sympathetic_chain']) {
  mustBeAbsent(key);
}

// Structures it does hold, that used to resolve to nothing or to the wrong thing.
mustContain('thoracoacromial', 'thoraco-acromial', 'the dossier spells it without the hyphen and the atlas spells it with one');
mustNotContain('post_circumflex_humeral', 'coronary', 'the posterior circumflex humeral artery is in the arm, not on the heart');
mustContain('post_circumflex_humeral', 'posterior circumflex humeral', 'it is in this atlas');
mustNotContain('post_circumflex_humeral', 'anterior circumflex humeral', 'the posterior vessel is the one in the quadrangular space');
mustNotContain('pectoralis_major', 'pectoralis minor', 'pectoralis minor is a different muscle');
mustNotContain('deltoid', 'artery', 'the deltoid is the muscle; the deltoid branch of the thoraco-acromial artery is an artery');
mustNotContain('celiac_trunk', 'duct', 'the common hepatic DUCT is biliary; the common hepatic ARTERY is the celiac branch');
mustNotContain('abdomen', 'epigastric', 'the epigastric arteries are anterior abdominal wall, and this rule strips the wall');

// The portal tree, which is the reason anyone opens the portal vein.
mustContain('portal_vein', 'splenic vein', 'the portal tributaries are the portosystemic anastomosis sites');
mustContain('portal_vein', 'superior rectal vein', 'same');
mustContain('portal_vein', 'left gastric vein', 'same');

// Organs that must be complete enough to be worth isolating.
const FLOORS = {
  heart: 100, brain: 120, lungs: 100, liver: 60, abdomen: 150, skeletal: 250,
  kidney: 30, pancreas: 15, lad_artery: 15, rca_artery: 20, portal_vein: 30,
};
for (const [key, floor] of Object.entries(FLOORS)) {
  const n = describeAtlasTarget(key, atlas).ids.size;
  if (n < floor) fail(`"${key}" resolves to ${n} parts, below the ${floor} it had — something stopped matching`);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const rows = [...results.entries()]
  .map(([t, r]) => ({ t, n: r.ids.size, status: r.status, rule: r.rule }))
  .sort((a, b) => b.n - a.n);

const w = Math.max(...rows.map((r) => r.t.length));
console.log(`\n  ${'target'.padEnd(w)}  parts  rule`);
console.log(`  ${'-'.repeat(w)}  -----  ----`);
for (const r of rows) {
  const marker = r.status === 'absent' ? 'not in this atlas' : r.rule;
  console.log(`  ${r.t.padEnd(w)}  ${String(r.n).padStart(5)}  ${marker}`);
}
console.log(`\n  ${targets.length} isolation targets, ${atlas.parts.length} atlas parts, ${rows.filter((r) => r.status === 'absent').length} declared absent.`);

if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('');
  process.exit(1);
}
console.log('  simulator organ resolution OK\n');
