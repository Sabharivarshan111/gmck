import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const atlas = JSON.parse(readFileSync(path.join(root, 'public/models/atlas.json'), 'utf8'));
const names = atlas.parts.map((p) => ({ id: p.id, name: String(p.name || ''), system: p.system }));

function parseGlbJson(file) {
  const b = readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'glTF') throw new Error('bad GLB magic');
  const jsonLength = b.readUInt32LE(12);
  const jsonType = b.readUInt32LE(16);
  if (jsonType !== 0x4E4F534A) throw new Error('first GLB chunk is not JSON');
  return JSON.parse(b.toString('utf8', 20, 20 + jsonLength).replace(/\0+$/g, '').trim());
}

const hraHeartPath = path.join(root, 'public/models/hra_heart_male_v1.3.glb');
const hraNames = existsSync(hraHeartPath)
  ? (() => {
      const gltf = parseGlbJson(hraHeartPath);
      return [
        ...(gltf.nodes || []).map((n) => String(n.name || '')),
        ...(gltf.meshes || []).map((m) => String(m.name || '')),
      ]
        .filter(Boolean)
        .map((name) => ({ name, normalized: name.replace(/_/g, ' ') }));
    })()
  : [];

const checks = [
  ['Right atrium', /\bright atr(?:ium|ial)\b/i],
  ['Left atrium', /\bleft atr(?:ium|ial)\b/i],
  ['Right ventricle', /\bright ventr(?:icle|icular)\b/i],
  ['Left ventricle', /\bleft ventr(?:icle|icular)\b/i],
  ['Interatrial septum', /interatrial sept/i],
  ['Interventricular septum', /interventricular sept/i],
  ['Tricuspid valve', /tricuspid.*valve|right atrioventricular.*valve/i],
  ['Mitral valve', /mitral.*valve|bicuspid.*valve|left atrioventricular.*valve/i],
  ['Aortic valve', /aortic.*valve|valve.*aort/i],
  ['Pulmonary valve', /pulmon(?:ary|ic).*(?:valve)|valve.*pulmon/i],
  ['Papillary muscles', /papillary.*muscl/i],
  ['Chordae tendineae', /chordae|tendin(?:eae|ous).*cord/i],
  ['Trabeculae carneae', /trabeculae.*carneae|trabecular.*ventric/i],
  ['Moderator band', /moderator band|septomarginal/i],
  ['Fossa ovalis', /fossa ovalis/i],
  ['Crista terminalis', /crista terminalis/i],
  ['SA node', /sinoatrial|sinus node|sa node/i],
  ['AV node', /atrioventricular node|av node/i],
  ['Bundle of His', /bundle of his|atrioventricular bundle/i],
  ['Ascending aorta', /ascending aorta/i],
  ['Aortic arch', /aortic arch|arch of aorta/i],
  ['Pulmonary trunk', /pulmonary trunk/i],
  ['Superior vena cava', /superior vena cava/i],
  ['Inferior vena cava', /inferior vena cava/i],
  ['Pulmonary veins', /pulmonary vein/i],
  ['Left coronary artery / LMCA', /left coronary artery|left main coronary/i],
  ['LAD', /anterior interventricular.*arter|left anterior descending|\bLAD\b/i],
  // Keep this coronary-specific. "Left circumflex" by itself also matches
  // the left circumflex scapular vessels and previously made this audit print
  // non-cardiac anatomy as evidence for LCx coverage.
  ['LCx', /circumflex branch of left coronary|left circumflex coronary|\bLCx\b/i],
  ['RCA', /right coronary artery|\bRCA\b/i],
  ['PDA', /posterior interventricular.*arter|posterior descending.*arter/i],
  ['Coronary sinus', /coronary sinus/i],
  ['Great cardiac vein', /great cardiac vein/i],
  ['Middle cardiac vein', /middle cardiac vein/i],
  ['Small cardiac vein', /small cardiac vein/i],
  ['Right auricle/appendage', /right (?:auricle|atrial appendage)/i],
  ['Left auricle/appendage', /left (?:auricle|atrial appendage)/i],
  ['Pericardium', /pericardi/i],
];

console.log('\nORBIT HEART ANATOMY AUDIT\n');
let present=0;
for (const [label, rx] of checks) {
  const bodyPartsHits = names.filter((p) => rx.test(p.name));
  const hraHits = hraNames.filter((p) => rx.test(p.normalized));
  const hasAny = bodyPartsHits.length > 0 || hraHits.length > 0;
  if (hasAny) present++;

  const source =
    bodyPartsHits.length && hraHits.length
      ? 'BodyParts3D + HRA'
      : bodyPartsHits.length
      ? 'BodyParts3D'
      : hraHits.length
      ? 'HRA supplement'
      : 'missing';

  console.log(`${hasAny ? '✓' : '✗'} ${label} [${source}]`);
  for (const h of bodyPartsHits.slice(0, 6)) {
    console.log(`    [BodyParts3D/${h.system}] ${h.name} (${h.id})`);
  }
  for (const h of hraHits.slice(0, 6)) {
    console.log(`    [HRA] ${h.name}`);
  }
  if (bodyPartsHits.length > 6) console.log(`    … +${bodyPartsHits.length - 6} more BodyParts3D`);
  if (hraHits.length > 6) console.log(`    … +${hraHits.length - 6} more HRA`);
}

const relevant = names.filter((p) =>
  /heart|cardiac|coronary|atri|ventric|aort|pulmon|vena cava|valve|papillary|chord|sept|auricle|appendage|pericard/i.test(p.name)
);

console.log(`\nChecklist coverage: ${present}/${checks.length}`);
console.log(`Relevant atlas parts by broad cardiac/great-vessel terms: ${relevant.length}\n`);
for (const h of relevant) console.log(`[${h.system}] ${h.name} (${h.id})`);

const mustForExternal = [
  /right atr(?:ium|ial)/i, /left atr(?:ium|ial)/i,
  /right ventr(?:icle|icular)/i, /left ventr(?:icle|icular)/i,
  /ascending aorta|aortic arch/i, /pulmonary trunk/i,
  /superior vena cava/i, /inferior vena cava/i,
  /pulmonary vein/i,
  /right coronary artery|anterior interventricular|circumflex.*coronary/i,
  /coronary sinus|cardiac vein/i,
];
const missingExternal = mustForExternal.filter((rx) => !names.some((p) => rx.test(p.name))).length;

const mustForInternal = [
  /tricuspid.*valve|right atrioventricular.*valve/i,
  /mitral.*valve|left atrioventricular.*valve|bicuspid.*valve/i,
  /aortic.*valve/i, /pulmon(?:ary|ic).*valve/i,
  /papillary.*muscl/i, /chordae|tendin(?:eae|ous).*cord/i,
  /interventricular sept/i, /interatrial sept/i,
];
const missingInternal = mustForInternal.filter(
  (rx) =>
    !names.some((p) => rx.test(p.name)) &&
    !hraNames.some((p) => rx.test(p.normalized))
).length;

console.log(`\nExternal gross-heart essential groups missing: ${missingExternal}`);
console.log(`Internal chamber/valve essential groups missing across verified sources: ${missingInternal}`);

if (missingExternal > 0) {
  console.error('HEART AUDIT: external gross anatomy is incomplete.');
  process.exitCode = 2;
} else if (missingInternal > 0) {
  console.log('HEART AUDIT: external BodyParts3D anatomy is broadly present, but verified combined-source internal anatomy still has explicit gaps.');
} else {
  console.log('HEART AUDIT: external BodyParts3D and verified supplemental internal MBBS essentials are represented by named source meshes.');
}
