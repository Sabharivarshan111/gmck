import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const [, , inputDir, outFile] = process.argv;
if (!inputDir || !outFile) throw new Error('usage: node inspect-hra-organs.mjs <input-dir> <out.json>');

const organFiles = [
  ['kidney_left', 'VH_M_Kidney_L.glb'],
  ['kidney_right', 'VH_M_Kidney_R.glb'],
  ['liver', 'VH_M_Liver.glb'],
  ['lung', 'VH_M_Lung.glb'],
  ['pancreas', 'VH_M_Pancreas.glb'],
  ['spleen', 'VH_M_Spleen.glb'],
  ['small_intestine', 'VH_M_Small_Intestine.glb'],
  ['urinary_bladder', 'VH_M_Urinary_Bladder.glb'],
  ['thymus', 'VH_M_Thymus.glb'],
  ['blood_vasculature', 'VH_M_Blood_Vasculature.glb'],
];

function parseGlb(file) {
  const b = readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'glTF') throw new Error(file + ': bad GLB magic');
  if (b.readUInt32LE(4) !== 2) throw new Error(file + ': expected GLB v2');
  if (b.readUInt32LE(8) !== b.length) throw new Error(file + ': declared length mismatch');
  const jsonLen = b.readUInt32LE(12);
  if (b.readUInt32LE(16) !== 0x4E4F534A) throw new Error(file + ': first chunk not JSON');
  const gltf = JSON.parse(b.toString('utf8', 20, 20 + jsonLen).replace(/\0+$/g, '').trim());
  return { b, gltf };
}

const payload = {
  source: 'https://github.com/hubmapconsortium/ccf-releases/tree/main/v1.3/models',
  license: 'HuBMAP Human Reference Atlas reference organ models — CC BY 4.0',
  release: 'v1.3',
  organs: {},
};

for (const [key, fileName] of organFiles) {
  const full = path.join(inputDir, fileName);
  const { b, gltf } = parseGlb(full);
  const nodes = (gltf.nodes || []).map((n, i) => ({ i, name: String(n.name || ''), mesh: n.mesh }));
  const meshes = (gltf.meshes || []).map((m, i) => ({
    i,
    name: String(m.name || ''),
    primitives: (m.primitives || []).length,
  }));
  payload.organs[key] = {
    fileName,
    bytes: b.length,
    nodeCount: nodes.length,
    meshCount: meshes.length,
    nodes,
    meshes,
    namedMeshes: meshes.map((m) => m.name).filter(Boolean),
  };
  console.log(key, b.length, 'bytes', meshes.length, 'meshes');
  for (const m of meshes) console.log(' ', m.name);
}

mkdirSync(path.dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(payload, null, 2));
