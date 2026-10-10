import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AUSCULTATION_SITES, SOUND_LIBRARY } from '../src/simulator/instruments/auscultationSites.ts';
for (const url of ['/models/hra_heart_male_v1.3.glb','/models/lungs_candidate_zanatomy_full.glb']) {
  const bytes = fs.readFileSync(`public${url}`);
  const {scene} = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset+bytes.byteLength), '');
  const size = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
  assert.ok([size.x,size.y,size.z].every(n=>Number.isFinite(n)&&n>0), `${url} invalid fit bounds`);
  let count=0;scene.traverse(n=>{if(n.isMesh)count++;});assert.ok(count>1);
  console.log(`${url}: ${count} source meshes, valid fitting bounds`);
}
assert.equal(new Set(AUSCULTATION_SITES.map(s=>s.id)).size, 8);
for(const sound of SOUND_LIBRARY)assert.ok(AUSCULTATION_SITES.some(s=>s.id===sound.site&&!s.pulmonary));
const heart=AUSCULTATION_SITES.filter(s=>!s.pulmonary);
for(const a of heart)for(const b of heart)if(a!==b)assert.ok(Math.hypot((a.x-b.x)*3.36,(a.y-b.y)*3.7)>=44, `${a.id}/${b.id} overlap at 360px`);
console.log('8 listening regions and 9 heart demonstrations: source lookup, mobile point separation passed');
