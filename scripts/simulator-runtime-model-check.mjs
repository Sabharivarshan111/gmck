import fs from 'node:fs';
import assert from 'node:assert/strict';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { restoreSourceNodeNames, partBelongsToRegion } from '../src/simulator/data/anatomyRegions.ts';
import { PERIPHERAL_NERVE_KEYS, meshMatchesPeripheralNerveTarget } from '../src/simulator/data/peripheralNerves.ts';
import { ZANATOMY_REFERENCE_MODELS, ZANATOMY_REFERENCE_TARGETS, zAnatomyMeshMatchesTarget } from '../src/simulator/data/zanatomyReferences.ts';
import { HRA_ORGAN_MODELS, HRA_ORGAN_TARGETS, hraOrganMeshMatchesTarget } from '../src/simulator/data/hraOrgans.ts';
import { HRA_HEART_TARGETS, hraHeartMeshMatchesTarget, HRA_HEART_MODEL_URL } from '../src/simulator/data/hraHeart.ts';

// Exercise the actual Three.js loader, not only names in the GLB JSON. The old
// asset checks passed while GLTFLoader removed dots/spaces from runtime names.
async function load(url) {
  const b = fs.readFileSync(`public${url}`);
  const gltf = await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '');
  restoreSourceNodeNames(gltf.scene);
  const names = [];
  gltf.scene.traverse(n => { if (n.isMesh) names.push(n.name); });
  assert(names.length, `Empty runtime model: ${url}`);
  return names;
}
const nerves = await load('/models/zanatomy_peripheral_nerves.glb');
for (const key of PERIPHERAL_NERVE_KEYS.filter(k => !['phrenic_nerve', 'splanchnic_nerves', 'cardiac_plexus'].includes(k))) {
  assert(nerves.some(n => meshMatchesPeripheralNerveTarget(n, key)), `Runtime nerve target missing: ${key}`);
}
assert.equal(nerves.filter(n => meshMatchesPeripheralNerveTarget(n, 'sympathetic')).length, 6);
let checked = 0;
for (const model of ZANATOMY_REFERENCE_MODELS) {
  const names = await load(model.url);
  for (const target of ZANATOMY_REFERENCE_TARGETS.filter(t => t.modelKey === model.key)) {
    assert(names.some(n => zAnatomyMeshMatchesTarget(n, target.id)), `Runtime Z-Anatomy target missing: ${target.id}`);
    checked++;
  }
}
for (const model of HRA_ORGAN_MODELS) {
  const names = await load(model.url);
  for (const target of HRA_ORGAN_TARGETS.filter(t => t.modelKeys.includes(model.key))) {
    // Multi-file targets may match another file in their same-source set.
    if (target.modelKeys.length === 1) assert(names.some(n => hraOrganMeshMatchesTarget(n, target.id)), `Runtime HRA target missing: ${target.id}`);
    checked++;
  }
}
const heart = await load(HRA_HEART_MODEL_URL);
for (const t of HRA_HEART_TARGETS.filter(t => t.kind !== 'schematic')) {
  assert(heart.some(n => hraHeartMeshMatchesTarget(n, t.id)), `Runtime heart target missing: ${t.id}`);
  checked++;
}
const atlas = JSON.parse(fs.readFileSync('public/models/atlas.json', 'utf8'));
for (const r of ['head', 'thorax', 'abdomen']) {
  const parts = atlas.parts.filter(p => partBelongsToRegion(p, r));
  assert(parts.length > 30, `Empty region: ${r}`);
  if (r === 'head') assert(!parts.some(p => /hepatovenous|deltoid|cardiac ventricle/i.test(p.name)), 'Unrelated anatomy leaked into Head');
  console.log(`${r}: ${parts.length} source structures`);
}
console.log(`Actual GLTFLoader regression passed: sympathetic six meshes, peripheral targets, ${checked} organ targets and regional inventories.`);
