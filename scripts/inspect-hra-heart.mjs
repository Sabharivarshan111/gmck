import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const file = process.argv[2];
const out = process.argv[3];
if (!file || !out) throw new Error('usage: node inspect-hra-heart.mjs <heart.glb> <out.json>');

const b = readFileSync(file);
if (b.toString('ascii',0,4) !== 'glTF') throw new Error('not a GLB');
if (b.readUInt32LE(4) !== 2) throw new Error('expected GLB v2');
const declared = b.readUInt32LE(8);
if (declared !== b.length) throw new Error(`declared length ${declared} != ${b.length}`);
const jsonLen = b.readUInt32LE(12);
const jsonType = b.readUInt32LE(16);
if (jsonType !== 0x4E4F534A) throw new Error('first GLB chunk is not JSON');
const gltf = JSON.parse(b.toString('utf8',20,20+jsonLen).replace(/\0+$/,'').trim());

const nodes=(gltf.nodes||[]).map((n,i)=>({i,name:n.name||'',mesh:n.mesh}));
const meshes=(gltf.meshes||[]).map((m,i)=>({i,name:m.name||'',primitives:(m.primitives||[]).length}));
const names=[...nodes.map(x=>x.name),...meshes.map(x=>x.name)].filter(Boolean);

const patterns={
  interventricular_septum:/interventricular septum/i,
  interatrial_septum:/interatrial septum|atrial septum/i,
  chordae_tendineae:/chordae|tendine/i,
  trabeculae_carneae:/trabeculae carneae|trabecular.*ventric/i,
  moderator_band:/moderator band|septomarginal/i,
  fossa_ovalis:/fossa ovalis|oval fossa/i,
  crista_terminalis:/crista terminalis|terminal crest/i,
  right_auricle:/right (?:auricle|atrial appendage)/i,
  left_auricle:/left (?:auricle|atrial appendage)/i,
  pericardium:/pericard/i,
  sa_node:/sinoatrial|sinus node|\bsa node\b/i,
  av_node:/atrioventricular node|\bav node\b/i,
  bundle_of_his:/bundle of his|atrioventricular bundle|his bundle/i,
  purkinje:/purkinje/i,
  valve:/valve|leaflet|cusp/i,
  papillary:/papillary/i,
  atrium:/atrium|atrial/i,
  ventricle:/ventricle|ventricular/i,
};

const matches={};
for(const [k,rx] of Object.entries(patterns)) matches[k]=names.filter(n=>rx.test(n));

mkdirSync(path.dirname(out),{recursive:true});
writeFileSync(out,JSON.stringify({
  source:'https://github.com/hubmapconsortium/ccf-releases/blob/main/v1.3/models/VH_M_Heart.glb',
  license:'HRA / HuBMAP reference organ, CC BY 4.0',
  bytes:b.length,
  nodeCount:nodes.length,
  meshCount:meshes.length,
  nodes,
  meshes,
  matches
},null,2));
console.log(Object.fromEntries(Object.entries(matches).map(([k,v])=>[k,v.length])));
