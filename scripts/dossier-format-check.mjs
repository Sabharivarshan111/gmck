// Every organ and every muscle dossier: the fields a student reads, and the
// house convention they are written in.
//
//   npm run check:dossiers
//
// `ORGAN_ANATOMY_DATABASE` is the text beside the 3D model — the arterial
// supply, the venous drainage, the innervation, the lymphatics, the bedside
// signs and the viva pearls for all 21 targets. It imports nothing at runtime,
// so this loads the REAL objects rather than parsing the file, and checks what
// a reader would notice.
//
// ---------------------------------------------------------------------------
// The convention, which was already 100% consistent and is worth keeping
// ---------------------------------------------------------------------------
//
// Measured across all 21 dossiers before this check existed:
//
//   SENTENCES end with a full stop.   arterialSupply 39/39, venousDrainage
//   36/37, lymphaticDrainage 22/22, musculoskeletalRelations 47/47,
//   clinicalBedsideSigns 64/64, nmcMbbssVivaPearls 57/57, and every one of
//   the 21 `clinicalNote` fields on a vessel or nerve node.
//
//   LABELS never do.   `name`, `territory`, `origin`, `roots`, `motorSupply`,
//   `sensorySupply`, `parentVessel` — 0 of 68 carry one — and the
//   `relationsStructured` lists, which are relations rather than prose.
//
// That is a real distinction and not a typo pattern: "Lateral and posterior
// walls of left ventricle, left atrium" is a territory, and a full stop on it
// would be wrong. So the check enforces BOTH halves; adding a period to a label
// fails just as adding a sentence without one does.
//
// ---------------------------------------------------------------------------
// And the thing that actually costs a student marks
// ---------------------------------------------------------------------------
//
// Three of the 265 prose entries were a bare vessel name. "Lateral Thoracic
// Artery." is half an exam answer — the other half is which part of the
// axillary artery it comes from, and every other arterial entry in the file
// gives it. All three were in the two MUSCLE dossiers, which had been written
// thinner than the organ ones. So a vessel entry must say where the vessel
// comes from or where it goes.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { ORGAN_ANATOMY_DATABASE: db } = await import(
  path.join(root, 'src/simulator/data/organAnatomyData.ts')
);

const failures = [];
const fail = (m) => failures.push(m);

/** Prose: a sentence, so it ends with a stop, a bracket or a closing quote. */
const ENDS_PROSE = /[.!?)\]"'’”]$/;
/** Fields written as prose. */
const PROSE_LISTS = [
  'arterialSupply', 'venousDrainage', 'lymphaticDrainage',
  'musculoskeletalRelations', 'clinicalBedsideSigns', 'nmcMbbssVivaPearls',
];
/** Fields written as labels, which must NOT end with a stop. */
const LABEL_FIELDS = ['name', 'territory', 'origin', 'roots', 'motorSupply', 'sensorySupply', 'parentVessel'];
const INNERVATION = ['sympathetic', 'parasympathetic', 'somaticOrSensory', 'referredPain'];

/**
 * Does a vessel entry say where the vessel comes from, or where it goes?
 *
 * A parenthetical, a colon, or one of the words anatomy uses to place a
 * vessel. "None." and "Nil." are allowed: no parasympathetic supply to
 * skeletal muscle is the correct answer, not a missing one.
 */
const PLACED = /\(|: |\bfrom\b|\bbranch(es)? of\b|\barises?\b|\borigin\b|\bdrain(s|ing)?\b|\bjoin(s|ing)?\b|\bvia\b|\baccompan|\btributar|\bsupplie[sd]\b|\bterminal\b|\bformed by\b|\bcontinues?\b|\btraverses?\b|\bascends?\b|\bdescends?\b|\breceiv/i;
const IS_NONE = /^(none|nil|not applicable|n\/a)\.?$/i;

const organs = Object.entries(db);
if (organs.length < 15) fail(`only ${organs.length} dossiers loaded — the database has shrunk or failed to import`);

let prose = 0;
let labels = 0;

for (const [key, o] of organs) {
  const at = (f) => `${key}.${f}`;

  if (o.id !== key) fail(`${at('id')} is "${o.id}" but its key is "${key}" — the 3D view looks the dossier up by key`);

  for (const f of ['name', 'latinName', 'system', 'quadrantOrCavity', 'surfaceLandmarks',
                   'dimensionsAndWeight', 'histologyAndPhysiology', 'radiologicalCorrelation',
                   'surgicalApproaches']) {
    if (typeof o[f] !== 'string' || !o[f].trim()) fail(`${at(f)} is empty`);
  }

  for (const f of PROSE_LISTS) {
    const arr = o[f];
    if (!Array.isArray(arr) || arr.length === 0) { fail(`${at(f)} is empty — every organ has one`); continue; }
    for (const [i, s] of arr.entries()) {
      prose += 1;
      const where = `${at(f)}[${i}]`;
      if (typeof s !== 'string' || !s.trim()) { fail(`${where} is empty`); continue; }
      if (s !== s.trim()) fail(`${where} has leading or trailing whitespace`);
      if (/\s\s/.test(s)) fail(`${where} has a double space`);
      if (/^[a-z]/.test(s)) fail(`${where} starts lower-case: ${JSON.stringify(s.slice(0, 60))}`);
      if (!ENDS_PROSE.test(s)) fail(`${where} does not end a sentence: ${JSON.stringify(s.slice(-50))}`);

      if ((f === 'arterialSupply' || f === 'venousDrainage') && !IS_NONE.test(s) && !PLACED.test(s)) {
        fail(`${where} names a vessel without saying where it comes from or goes: ${JSON.stringify(s)}\n      every other vessel entry in this file does, and the origin is half the exam answer`);
      }
    }
  }

  const inn = o.innervation;
  if (!inn || typeof inn !== 'object') { fail(`${at('innervation')} is missing`); }
  else for (const f of INNERVATION) {
    const s = inn[f];
    if (typeof s !== 'string' || !s.trim()) { fail(`${at('innervation.' + f)} is empty — an organ with no parasympathetic supply says "None.", it does not leave the field blank`); continue; }
    if (!ENDS_PROSE.test(s.trim())) fail(`${at('innervation.' + f)} does not end a sentence: ${JSON.stringify(s.slice(-40))}`);
    if (/^[a-z]/.test(s.trim())) fail(`${at('innervation.' + f)} starts lower-case`);
  }

  for (const [nf, arr] of [['arterialNodes', o.arterialNodes], ['venousNodes', o.venousNodes], ['nerveNodes', o.nerveNodes]]) {
    for (const [i, n] of (arr ?? []).entries()) {
      const where = `${at(nf)}[${i}]`;
      if (!n.id || !n.name) { fail(`${where} has no id or no name`); continue; }
      if (typeof n.clinicalNote !== 'string' || !n.clinicalNote.trim()) fail(`${where}.clinicalNote is empty — it is the reason the node is listed`);
      else if (!ENDS_PROSE.test(n.clinicalNote.trim())) fail(`${where}.clinicalNote does not end a sentence`);
      for (const f of LABEL_FIELDS) {
        if (typeof n[f] !== 'string') continue;
        labels += 1;
        if (/[.!?]$/.test(n[f].trim())) {
          fail(`${where}.${f} ends with a full stop, and it is a label rather than a sentence: ${JSON.stringify(n[f])}`);
        }
      }
    }
  }

  for (const [side, list] of Object.entries(o.relationsStructured ?? {})) {
    for (const [i, s] of (list ?? []).entries()) {
      labels += 1;
      if (typeof s !== 'string' || !s.trim()) fail(`${at('relationsStructured.' + side)}[${i}] is empty`);
      else if (/[.!?]$/.test(s.trim())) fail(`${at('relationsStructured.' + side)}[${i}] ends with a full stop, and a relation is a label: ${JSON.stringify(s)}`);
    }
  }

  const mg = o.muscleGraph;
  if (mg) {
    if (!Array.isArray(mg.origins) || mg.origins.length === 0) fail(`${at('muscleGraph.origins')} is empty — a muscle without an origin is not a muscle dossier`);
    if (!Array.isArray(mg.insertions) || mg.insertions.length === 0) fail(`${at('muscleGraph.insertions')} is empty`);
    for (const [g, list] of [['origins', mg.origins], ['insertions', mg.insertions]]) {
      for (const [i, a] of (list ?? []).entries()) {
        for (const f of ['landmark', 'bone', 'details']) {
          if (typeof a?.[f] !== 'string' || !a[f].trim()) fail(`${at('muscleGraph.' + g)}[${i}].${f} is empty`);
        }
      }
    }
    for (const f of ['action', 'nerveSupply']) {
      if (typeof mg[f] !== 'string' || !mg[f].trim()) fail(`${at('muscleGraph.' + f)} is empty`);
    }
  }
}

// ---------------------------------------------------------------------------
// How much of the body a dossier actually covers
// ---------------------------------------------------------------------------
//
// A number, printed, that nobody has to go looking for. It is the same shape as
// `npm run check:repeat-markers` in the native app: low coverage is a FACT
// about the content, not a failure, and the check exists so it is a figure
// somebody can act on rather than something a reader discovers.
//
// What it says today is that the 21 dossiers reach about half the atlas, and
// that the muscles are where the hole is: 2 of 252 distinct muscles have one.
// Writing the other 250 is real anatomy — an origin, an insertion, an action, a
// nerve supply, an arterial supply and a venous drainage each, all of which
// have to be RIGHT — and inventing them would be worse than the gap.
//
// It fails only if coverage DROPS, so a resolver change that quietly stops an
// organ reaching its parts cannot pass unnoticed.
const FLOORS = { total: 45, skeletal: 100, nervous: 100, digestive: 95, arterial: 38, venous: 27 };

try {
  const atlas = JSON.parse(
    (await import('node:fs')).readFileSync(path.join(root, 'public/models/atlas.json'), 'utf8')
  );
  const resolver = await import(path.join(root, 'src/simulator/data/atlasResolver.ts'));
  atlas.parts.forEach(resolver.correctPartSystem);

  const covered = new Set();
  for (const key of Object.keys(db)) {
    for (const id of resolver.describeAtlasTarget(key, atlas).ids) covered.add(id);
  }

  const bySystem = {};
  for (const p of atlas.parts) {
    (bySystem[p.system] ??= { total: 0, covered: 0 }).total += 1;
    if (covered.has(p.id)) bySystem[p.system].covered += 1;
  }

  const pct = (c, t) => (t === 0 ? 100 : (c / t) * 100);
  console.log('\n  what a dossier reaches\n');
  for (const [sys, v] of Object.entries(bySystem).sort((a, b) => b[1].total - a[1].total)) {
    const p = pct(v.covered, v.total);
    const floor = FLOORS[sys];
    const note = floor !== undefined && p + 1e-9 < floor ? `  <-- was ${floor}%` : '';
    console.log(`    ${sys.padEnd(15)} ${String(v.covered).padStart(4)} / ${String(v.total).padEnd(5)} ${p.toFixed(0).padStart(3)}%${note}`);
    if (floor !== undefined && p + 1e-9 < floor) {
      fail(`${sys} coverage fell to ${p.toFixed(0)}% from ${floor}% — a dossier has stopped reaching parts it used to`);
    }
  }
  const totalPct = pct(covered.size, atlas.parts.length);
  console.log(`\n    ${covered.size} of ${atlas.parts.length} parts reachable from a dossier (${totalPct.toFixed(0)}%)`);
  if (totalPct + 1e-9 < FLOORS.total) {
    fail(`overall dossier coverage fell to ${totalPct.toFixed(0)}% from ${FLOORS.total}%`);
  }

  const muscleNames = new Set(
    atlas.parts.filter((p) => p.system === 'muscular')
      .map((p) => p.name.replace(/^(Right|Left) /, '').replace(/^\w+ part of /, ''))
  );
  const muscleDossiers = Object.values(db).filter((o) => o.muscleGraph).length;
  console.log(`    ${muscleDossiers} of ${muscleNames.size} distinct muscles have a dossier — the known gap, see CLAUDE.md\n`);
} catch (err) {
  fail(`could not measure dossier coverage: ${err.message}`);
}

console.log(`\n  ${organs.length} dossiers · ${prose} prose entries · ${labels} labels`);
console.log('  sentences end with a stop, labels never do, and every vessel says where it comes from.\n');

if (failures.length) {
  console.error(`${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('');
  process.exit(1);
}
console.log('  dossier formatting OK\n');
