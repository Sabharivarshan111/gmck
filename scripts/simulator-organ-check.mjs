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
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolverPath = path.join(root, 'src/simulator/data/atlasResolver.ts');
const { describeAtlasTarget, resolvePartToOrganKey, correctPartSystem, hasTerm } = await import(resolverPath);

const atlas = JSON.parse(readFileSync(path.join(root, 'public/models/atlas.json'), 'utf8'));
// The same correction the chunk loader applies: two groups of parts carry an
// ontology `system` that does not describe what they are.
atlas.parts.forEach(correctPartSystem);
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
// An organ contains the parts that ARE it
// ---------------------------------------------------------------------------
//
// The rules above stop an organ containing somebody else's parts. This is the
// other half: every part whose NAME says it belongs must be in it. It is what
// found the liver.
//
// There is no part called "Liver" in this atlas. The liver parenchyma is the
// nine Couinaud hepatovenous segments, and the ontology files them under
// `venous` — so the app painted the largest organ in the abdomen vein-blue, and
// the abdomen rule (which takes the digestive and urinary systems and names the
// vessels it wants) left it out altogether. Opening the abdomen showed a
// stomach, a bowel and a spleen around a hole.

/** Every part matching `pattern` must be in `key`'s answer. */
function mustBeComplete(key, pattern, why) {
  const ids = describeAtlasTarget(key, atlas).ids;
  const expected = atlas.parts.filter((p) => pattern.test(p.name));
  if (expected.length === 0) {
    fail(`nothing in the atlas matches ${pattern} — the "${key}" completeness assertion has gone stale`);
    return;
  }
  const missing = expected.filter((p) => !ids.has(p.id));
  if (missing.length) {
    fail(`"${key}" is missing ${missing.length} of ${expected.length} parts matching ${pattern} — ${why}\n      e.g. ${[...new Set(missing.map((p) => p.name))].slice(0, 4).join(', ')}`);
  }
}

// BodyParts3D hyphenates inconsistently, and sometimes inconsistently with
// itself: the gastro-epiploic ARTERIES carry a hyphen and the gastroepiploic
// VEINS do not. So the stomach showed its venous drainage along both curvatures
// and only half its arterial supply.
for (const [text, term] of [
  ['Left gastro-epiploic artery', 'gastroepiploic'],
  ['Left gastroepiploic vein', 'gastro epiploic'],
  ['Trunk of left thoraco-acromial artery', 'thoracoacromial'],
  ['Left supra-orbital nerve', 'supraorbital'],
]) {
  if (!hasTerm(text, term)) fail(`hasTerm("${text}", "${term}") is false — a hyphen should not decide whether a part is found`);
}
mustBeComplete('stomach', /gastro-?epiploic (artery|vein)/i, 'both curvatures carry an artery AND a vein');

mustBeComplete('liver', /^hepatovenous segment/i, 'the Couinaud segments ARE the liver parenchyma');
mustBeComplete('abdomen', /^hepatovenous segment/i, 'the liver is the largest organ in the abdomen');
mustBeComplete('abdomen', /\bileum\b/i, 'the small bowel is abdominal content; a y-threshold clip used to cut seventeen loops of it');
mustBeComplete('abdomen', /\b(jejunum|colon|duodenum|cecum|appendix)\b/i, 'the whole alimentary tract belongs to the abdomen');
mustBeComplete('kidney', /\b(kidney|adrenal gland)\b/i, 'both kidneys and both adrenals');
mustBeComplete('brain', /\bgyrus\b/i, 'every cortical gyrus is brain');

// The circle of Willis and the cerebral arterial tree. This atlas carries 107
// parts of it and the brain used to show eight: the arterial territories, the
// lenticulostriate branches and the vessels a stroke occludes were all in the
// data and none of them on screen.
mustBeComplete('brain', /cerebral artery|cerebellar artery|communicating artery|basilar artery/i,
  'the circle of Willis and the cortical arterial territories are neuroanatomy, not decoration');
mustNotContain('brain', 'common carotid', 'the common carotid is in the neck; the head floor separates the intracranial supply from its origin');

// Every nerve in the atlas must belong to something. There are 144 and one of
// them — the central canal of the spinal cord — belonged to nothing at all.
{
  const targetsBySys = new Set();
  for (const t of targets) for (const id of describeAtlasTarget(t, atlas).ids) targetsBySys.add(id);
  const orphans = atlas.parts.filter((p) => p.system === 'nervous' && !targetsBySys.has(p.id));
  if (orphans.length) {
    fail(`${orphans.length} nervous part(s) are reachable from no isolation target at all: ${[...new Set(orphans.map((p) => p.name))].slice(0, 5).join(', ')}`);
  }
}
mustBeComplete('lungs', /bronchial tree|bronchus|^trachea$/i, 'the whole tracheobronchial tree');
mustBeComplete('skeletal', /\bvertebra\b/i, 'the vertebral column is skeleton');

// The system labels that do not describe the part.
{
  const hep = atlas.parts.filter((p) => /^hepatovenous segment/i.test(p.name));
  const wrong = hep.filter((p) => p.system !== 'digestive');
  if (wrong.length) fail(`${wrong.length} hepatic segment(s) are still system "${wrong[0].system}" after correctPartSystem — the liver renders in vein blue`);
  const csf = ['FJ1730', 'FJ1731', 'FJ1752', 'FJ1767', 'FJ1814'].map((id) => byId.get(id)).filter(Boolean);
  const csfWrong = csf.filter((p) => p.system !== 'nervous');
  if (csfWrong.length) fail(`${csfWrong.length} CSF space(s) are still system "${csfWrong[0].system}" after correctPartSystem`);
}

// This atlas has no lung tissue, so the parenchyma mesh has to exist and has to
// be the one the view names. Without it, isolating the lungs shows an airway
// hanging in space.
{
  const viewSrcForLungs = readFileSync(path.join(root, 'src/simulator/view/AnatomicalBody3D.tsx'), 'utf8');
  const named = [...viewSrcForLungs.matchAll(/'(\/models\/[^']+\.glb)'/g)].map((m) => m[1]);
  if (named.length === 0) fail('AnatomicalBody3D names no lung parenchyma mesh, and the atlas contains no lung tissue at all');
  for (const rel of [...new Set(named)]) {
    if (!existsSync(path.join(root, 'public', rel))) {
      fail(`AnatomicalBody3D loads ${rel}, which is not in public/ — the lungs would be an airway with no lobes`);
    }
  }
  const parenchyma = atlas.parts.filter((p) => /lobe of (left|right) lung/i.test(p.name));
  if (parenchyma.length > 0) {
    fail(`the atlas now has ${parenchyma.length} lung lobe mesh(es) of its own — the separate Z-Anatomy mesh may no longer be needed`);
  }
}

// ---------------------------------------------------------------------------
// Tapping a mesh opens the right dossier
// ---------------------------------------------------------------------------
//
// `resolvePartToOrganKey` is the other half of the same job and had the same
// disease. Every case below is a real part of this atlas that opened the wrong
// organ's notes.

const partByName = new Map(atlas.parts.map((p) => [p.name, p]));

function mustOpen(partName, organ, why) {
  const part = partByName.get(partName);
  if (!part) {
    fail(`"${partName}" is not in the atlas — this assertion has gone stale`);
    return;
  }
  const got = resolvePartToOrganKey(part, atlas);
  if (got !== organ) fail(`tapping "${partName}" opens "${got}", expected "${organ}" — ${why}`);
}

function mustNotOpen(partName, organ, why) {
  const part = partByName.get(partName);
  if (!part) {
    fail(`"${partName}" is not in the atlas — this assertion has gone stale`);
    return;
  }
  const got = resolvePartToOrganKey(part, atlas);
  if (got === organ) fail(`tapping "${partName}" opens "${organ}" — ${why}`);
}

// `caudate` alone is the liver's caudate LOBE and the basal ganglia's caudate
// NUCLEUS, and the liver test runs first.
mustOpen('Left caudate nucleus', 'brain', 'the caudate nucleus is basal ganglia; only the caudate LOBE is hepatic');
mustOpen('Caudate lobe of liver', 'liver', 'and the lobe must still reach the liver');

// `gastro` is the stomach and it is also the calf.
mustNotOpen('Medial head of right gastrocnemius', 'stomach', 'gastrocnemius is the calf muscle');
mustOpen('Left gastric vein', 'stomach', 'the named gastric vessels must still reach the stomach');

// `rib` is a bone and it is also the middle of forty-three names beginning
// `Tributary of ...`.
mustNotOpen('Tributary of plantar venous arch', 'skeletal', 'a tributary is not a rib');

// `ventricle` is a chamber of the heart and it is also a CSF space, and
// BodyParts3D files all five CSF spaces under the cardiac system.
for (const csf of ['Third ventricle', 'Fourth ventricle', 'Left lateral ventricle', 'Right lateral ventricle', 'Interventricular foramen']) {
  mustOpen(csf, 'brain', 'BodyParts3D files it as cardiac, which is simply wrong');
}
mustOpen('Wall of ventricle', 'heart', 'the myocardium must still reach the heart');

// This atlas has no phrenic nerve. What it has is the phrenic arteries and
// veins, and they used to open the phrenic NERVE dossier.
mustNotOpen('Left inferior phrenic artery', 'phrenic_nerve', 'an artery is not a nerve');

// And the ordinary cases still work.
mustOpen('Coronary sinus', 'coronary_sinus', 'the cardiac venous return has its own dossier');
mustOpen('Cerebellum', 'brain', 'cerebell- is a prefix, not a whole word');
mustOpen('Spleen', 'spleen', 'the simplest case of all');

// ---------------------------------------------------------------------------
// Two invariants that are not about the resolver, and had each drifted
// ---------------------------------------------------------------------------

const viewSrc = readFileSync(path.join(root, 'src/simulator/view/AnatomicalBody3D.tsx'), 'utf8');

// 1. The studio rig. Past this, ACESFilmic tone mapping blows the speculars out
//    and the tissue bleaches towards chalk. CLAUDE.md has said 2.3 since the
//    view was written; the dark rig had drifted to 2.60 with nothing checking.
const STUDIO_LIGHT_CEILING = 2.3;
const intensities = [...viewSrc.matchAll(/new THREE\.(?:Hemisphere|Directional)Light\([^)]*?isLight \? ([\d.]+) : ([\d.]+)\)/g)];
if (intensities.length < 4) {
  fail(`only ${intensities.length} studio lights parsed from AnatomicalBody3D — the rig has changed shape and this check no longer measures it`);
} else {
  const lightTotal = intensities.reduce((s, m) => s + Number(m[1]), 0);
  const darkTotal = intensities.reduce((s, m) => s + Number(m[2]), 0);
  // Floating point: 0.44 + 1.10 + 0.50 + 0.26 is not exactly 2.3.
  const over = (n) => n - STUDIO_LIGHT_CEILING > 1e-9;
  if (over(lightTotal)) fail(`light-theme studio rig totals ${lightTotal.toFixed(2)}, over the ${STUDIO_LIGHT_CEILING} ceiling`);
  if (over(darkTotal)) fail(`dark-theme studio rig totals ${darkTotal.toFixed(2)}, over the ${STUDIO_LIGHT_CEILING} ceiling — the tissue bleaches to clay above it`);
}

// 2. The phone is the device this is for, and the guards that protect it.
//
//    Every one of these was written down as a mobile rule and then undone
//    somewhere else in the same file: the DPR clamp exists to stop a large
//    backbuffer and MSAA allocated a multiple of it; the concurrency cap exists
//    to stop a memory spike and `powerPreference: 'high-performance'` asked the
//    driver for the profile that throttles.
for (const [pattern, why] of [
  [/antialias:\s*!isMobileDevice/, 'antialias must be OFF on mobile — a multisampled backbuffer undoes the DPR clamp that exists to avoid exactly that allocation'],
  [/powerPreference:\s*isMobileDevice \? 'default'/, "powerPreference must be 'default' on mobile — 'high-performance' is heat, then throttling, then a slower frame rate than the default profile"],
  [/setPixelRatio\([^)]*isMobileDevice \? 1\.0/, 'mobile devicePixelRatio must be clamped to 1.0 (GPU tile exhaustion)'],
  [/const concurrencyLimit = isMobileDevice \? 2 :/, 'mobile chunk streaming must be capped at 2 concurrent fetches (WebKit Jetsam OOM)'],
  [/chunkBuffers\.length = 0/, 'the decoded chunk buffers (59.5 MB) must be released once the geometry is merged'],
]) {
  if (!pattern.test(viewSrc)) fail(`AnatomicalBody3D: ${why}`);
}

// 3. One 3D view per device.
//
//    `hidden lg:grid` and `lg:hidden` hide a subtree with CSS, and a subtree
//    hidden with CSS is still mounted. Simulator.tsx renders both a desktop and
//    a mobile layout, so both AnatomicalBody3D instances existed at once on
//    every device: two WebGL contexts, and the whole 2,234-part atlas
//    downloaded, decoded and merged into GPU buffers twice, on the phones this
//    app is for. Each must now be gated on `useIsDesktopLayout()` in JS.
const simulatorSrc = readFileSync(path.join(root, 'src/pages/Simulator.tsx'), 'utf8');
const mounts = [...simulatorSrc.matchAll(/<AnatomicalBody3D\b/g)].length;
const gates = [...simulatorSrc.matchAll(/\{!?isDesktopLayout && \(\s*<AnatomicalBody3D\b/g)].length;
if (mounts !== gates) {
  fail(`Simulator.tsx mounts AnatomicalBody3D ${mounts} time(s) but only ${gates} are gated on isDesktopLayout — a CSS-hidden instance still builds a WebGL context and streams the whole atlas`);
}
if (!simulatorSrc.includes('useIsDesktopLayout()')) {
  fail('Simulator.tsx does not call useIsDesktopLayout() — the layout split would be CSS-only again');
}

// 4. The mobile stage fits the phone it is on.
//
//    It was a flat `h-[420px]`: the same box on a 640pt screen, where it runs
//    under the fold, and on an 844pt one, where a third of the screen goes
//    unused. And the tab bar was `sticky top-[53px]` — the header's height on
//    one phone — while the header's title wraps and grows on a narrow one.
// Comments are stripped first: this file explains the old values, and a check
// that its own documentation trips is a check nobody keeps.
const simulatorCode = simulatorSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
if (/h-\[420px\]/.test(simulatorCode)) {
  fail('Simulator.tsx pins the MOBILE 3D stage to a fixed pixel height — it has to fit the viewport it is given');
}
if (/sticky\s+top-\[\d+px\]/.test(simulatorCode)) {
  fail('Simulator.tsx positions a sticky element with a hardcoded header height; nest it in the header\'s own sticky block instead');
}
if (!simulatorSrc.includes('dvh')) {
  fail('Simulator.tsx sizes the mobile stage without dvh — mobile `vh` counts the URL bar that is not there, so the canvas is taller than its space');
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
