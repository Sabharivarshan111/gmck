import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { boundedAngles, CORONARY_VIEWS } from '../src/lib/coronaryLab.ts';
import { CORONARY_MESH_GROUPS } from '../src/lib/coronaryModel.ts';
const assets = new URL('../coronary-renderer/assets/', import.meta.url);
const bytes = await readFile(new URL('heart.glb', assets));
assert.equal(
  createHash('sha256').update(bytes).digest('hex'),
  'b80a727d022a4ab07ccfcf15caccc228eaccb6d69ec0e72923324946ac35a946',
);
const manifest = JSON.parse(
  await readFile(new URL('manifest.json', assets), 'utf8'),
);
const model = await new GLTFLoader().parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  '',
);
const sources = manifest.structures
  .filter(s => s.id.endsWith('-coronary'))
  .flatMap(s => s.sources);
const mapped = CORONARY_MESH_GROUPS.flatMap(g => g.sourceIds);
assert.equal(mapped.length, 54);
assert.equal(new Set(mapped).size, 54);
assert.deepEqual([...mapped].sort(), sources.map(p => p.element).sort());
let triangles = 0;
for (const structure of manifest.structures.filter(s =>
  s.id.endsWith('-coronary'),
)) {
  const mesh = model.scene.getObjectByName(structure.id),
    position = mesh.geometry.getAttribute('position'),
    normal = mesh.geometry.getAttribute('normal'),
    index = mesh.geometry.getIndex();
  let vertexOffset = 0,
    indexOffset = 0;
  for (const part of structure.sources) {
    for (let i = vertexOffset; i < vertexOffset + part.vertices; i++) {
      assert.ok(
        [position.getX(i), position.getY(i), position.getZ(i)].every(
          Number.isFinite,
        ),
      );
      assert.ok(
        Math.abs(
          Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i)) - 1,
        ) < 1e-4,
      );
    }
    for (let i = indexOffset; i < indexOffset + part.triangles * 3; i++)
      assert.ok(
        index.getX(i) >= vertexOffset &&
          index.getX(i) < vertexOffset + part.vertices,
        part.element + ' source topology',
      );
    vertexOffset += part.vertices;
    indexOffset += part.triangles * 3;
    triangles += part.triangles;
  }
  assert.equal(vertexOffset, position.count);
  assert.equal(indexOffset, index.count);
}
for (const a of CORONARY_VIEWS)
  assert.deepEqual(boundedAngles(a), { oblique: a.oblique, tilt: a.tilt });
assert.deepEqual(boundedAngles({ oblique: Infinity, tilt: 90 }), {
  oblique: 0,
  tilt: 45,
});
console.log(
  `Pinned GLB, 54 source partitions, ${triangles} coronary triangles, finite vertices/unit normals, complete index coverage and bounded presets PASS`,
);
