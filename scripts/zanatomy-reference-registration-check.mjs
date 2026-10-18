import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { zAnatomyReferenceRegistrationIssue, zAnatomyReferenceRegistrationNotice } from '../src/simulator/data/zanatomyReferences.ts';
import { isolationCameraDistance } from '../src/simulator/view/isolationFraming.ts';

const bytes = await readFile(new URL('../public/models/zanatomy/brain_reference.glb', import.meta.url));
const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
gltf.scene.updateWorldMatrix(true, true);
const complete = new THREE.Box3().setFromObject(gltf.scene);
const registered = new THREE.Box3();
const omitted = [];
let kept = 0;
gltf.scene.traverse(mesh => {
  if (!mesh.isMesh) return;
  // GLTFLoader sanitizes dots/spaces; the viewer restores original source names.
  const name = gltf.parser.json.nodes.find(n => THREE.PropertyBinding.sanitizeNodeName(n.name) === mesh.name)?.name || mesh.name;
  if (zAnatomyReferenceRegistrationIssue('brain_reference', name)) omitted.push(name);
  else { registered.expandByObject(mesh); kept++; }
});
assert.deepEqual(omitted.sort(), ['Corpus callosum', 'Hippocampal commissure', 'Orbital part of  inferior frontal gyrus.r'].sort());
assert.equal(kept, 101, 'All other captured brain meshes must remain');
assert(Math.max(...complete.getSize(new THREE.Vector3()).toArray()) > 20, 'Regression fixture must contain the measured malformed transform');
assert(registered.min.y > 1.50 && registered.max.y < 1.80);
assert(Math.max(...registered.getSize(new THREE.Vector3()).toArray()) < 0.25, 'Remaining source geometry must fit a brain-sized head frame');
assert(zAnatomyReferenceRegistrationNotice('za_brain_overview')?.includes('corpus callosum'));
assert(zAnatomyReferenceRegistrationNotice('za_brain_corpus_callosum')?.includes('SOURCE REGISTRATION GAP'));
assert.equal(zAnatomyReferenceRegistrationNotice('za_stomach'), null);
assert.equal(zAnatomyReferenceRegistrationIssue('stomach_reference', 'Corpus callosum'), false);

const center = registered.getCenter(new THREE.Vector3()), size = registered.getSize(new THREE.Vector3());
for (const [width, height] of [[393, 636], [393, 500], [852, 500]]) {
  const camera = new THREE.PerspectiveCamera(34, width / height, .001, 50);
  const distance = isolationCameraDistance(size, 34, camera.aspect, true, height);
  camera.position.set(center.x, center.y + Math.max(...size.toArray(), .08) * .035, center.z + distance);
  camera.lookAt(center); camera.updateMatrixWorld();
  for (const x of [registered.min.x, registered.max.x]) for (const y of [registered.min.y, registered.max.y]) for (const z of [registered.min.z, registered.max.z]) {
    const p = new THREE.Vector3(x, y, z).project(camera);
    assert(Math.abs(p.x) < .9 && Math.abs(p.y) < .8 && p.z > -1 && p.z < 1, 'Registered brain must fit inside the visible camera');
  }
}
console.log('Brain registration: 101 source meshes retained; 3 malformed transforms quarantined and labelled; portrait/landscape bounds fit.');
