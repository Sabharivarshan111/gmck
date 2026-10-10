import fs from 'node:fs';
import { Box3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { restoreSourceNodeNames } from '../src/simulator/data/anatomyRegions.ts';
import { genericPeripheralNerveKey, PERIPHERAL_NERVE_MODEL_URL } from '../src/simulator/data/peripheralNerves.ts';

// Source-only metadata: no fabricated nerve course or innervation. Deterministic
// target IDs group laterality copies and match the renderer's exact source stem.
const b = fs.readFileSync(`public${PERIPHERAL_NERVE_MODEL_URL}`);
const gltf = await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '');
restoreSourceNodeNames(gltf.scene);
gltf.scene.updateMatrixWorld(true);
const groups = new Map();
gltf.scene.traverse(mesh => {
  if (!mesh.isMesh) return;
  const id = genericPeripheralNerveKey(mesh.name);
  let p = groups.get(id);
  if (!p) {
    p = { id, name: mesh.name.replace(/\.\d+$/, '').replace(/\.(?:l|r|j)$/i, '').replace(/[_-]+/g, ' '), conceptId: 'Z-Anatomy source', source: 'Z-Anatomy', system: 'nervous', chunk: -1, positions: 0, normals: 0, indices: 0, vertexCount: 0, indexCount: 0, box: new Box3() };
    groups.set(id, p);
  }
  p.box.union(new Box3().setFromObject(mesh));
  p.vertexCount += mesh.geometry.getAttribute('position').count;
  p.indexCount += mesh.geometry.index?.count || 0;
});
const parts = [...groups.values()].map(({box, ...p}) => ({ ...p, bounds: [box.min.toArray(), box.max.toArray()] })).sort((a,b) => a.name.localeCompare(b.name));
fs.writeFileSync('public/models/nerve_catalog.json', JSON.stringify(parts));
console.log(`Generated ${parts.length} source nerve groups; source laterality copies are grouped.`);
