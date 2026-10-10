import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AUSCULTATION_SITES, SOUND_LIBRARY } from '../src/simulator/instruments/auscultationSites.ts';
for (const url of ['/models/auscultation_thorax_bp3d.glb.gz','/models/lungs_candidate_zanatomy_full.glb']) {
  const input = fs.readFileSync(`public${url}`);
  const bytes = url.endsWith('.gz') ? gunzipSync(input) : input;
  const {scene} = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset+bytes.byteLength), '');
  const size = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
  assert.ok([size.x,size.y,size.z].every(n=>Number.isFinite(n)&&n>0), `${url} invalid fit bounds`);
  let count=0, parts=0;
  scene.traverse(n=>{
    if(!n.isMesh)return; count++;
    const index=n.geometry.index;
    assert.equal(index.count%3,0, `${n.name}: incomplete source triangles`);
    for(const vertex of index.array)assert.ok(vertex<n.geometry.attributes.position.count, `${n.name}: invalid vertex index`);
    parts += n.userData.sourceParts?.length || 0;
  });
  assert.ok(count>1);
  if(url.includes('thorax')) {
    assert.equal(count,7); assert.equal(parts,587);
    assert.ok(scene.getObjectByName('integumentary'));
    assert.ok(scene.getObjectByName('cardiac'));
    assert.ok(scene.getObjectByName('skeletal'));
    assert.ok(size.y>.4 && size.y<.47, 'source torso crop bounds changed');
    assert.ok(new THREE.Box3().setFromObject(scene).min.y>1, 'source coordinates recentered');
  }
  console.log(`${url}: ${count} source meshes, valid fitting bounds`);
}
assert.equal(new Set(AUSCULTATION_SITES.map(s=>s.id)).size, 8);
for(const sound of SOUND_LIBRARY)assert.ok(AUSCULTATION_SITES.some(s=>s.id===sound.site&&!s.pulmonary));
const heart=AUSCULTATION_SITES.filter(s=>!s.pulmonary);
for(const a of heart)for(const b of heart)if(a!==b)assert.ok(Math.hypot((a.x-b.x)*3.36,(a.y-b.y)*3.7)>=44, `${a.id}/${b.id} overlap at 360px`);
console.log('8 listening regions and 9 heart demonstrations: source lookup, mobile point separation passed');
