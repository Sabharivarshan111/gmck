import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const atlasPath = path.join(publicDir, 'models', 'atlas.json');
const hraHeartSourcePath = path.join(root, 'src', 'simulator', 'data', 'hraHeart.ts');
const hraOrgansSourcePath = path.join(root, 'src', 'simulator', 'data', 'hraOrgans.ts');
const {
  HRA_HEART_REQUIRED_MESH_NAMES,
  HRA_HEART_TARGETS,
  hraHeartMeshMatchesTarget,
} = await import(hraHeartSourcePath);
const {
  HRA_ORGAN_MODELS,
  HRA_ORGAN_TARGETS,
  hraOrganMeshMatchesTarget,
} = await import(hraOrgansSourcePath);
const failures = [];
const fail = (m) => failures.push(m);

if (!existsSync(atlasPath)) fail('public/models/atlas.json is missing');
const atlas = existsSync(atlasPath) ? JSON.parse(readFileSync(atlasPath, 'utf8')) : null;

if (atlas) {
  if (!Array.isArray(atlas.parts) || atlas.parts.length < 2200) {
    fail(`atlas has ${atlas?.parts?.length ?? 0} parts; expected the complete 2,234-part BodyParts3D export`);
  }
  if (!Array.isArray(atlas.chunks) || atlas.chunks.length === 0) {
    fail('atlas contains no geometry chunks');
  } else {
    for (let i = 0; i < atlas.chunks.length; i++) {
      const chunk = atlas.chunks[i];
      const candidate = chunk.gzip || chunk.url;
      if (!candidate) {
        fail(`atlas chunk ${i} has neither gzip nor url`);
        continue;
      }
      const rel = candidate.replace(/^\//, '').replace(/^public\//, '');
      const file = path.join(publicDir, rel);
      if (!existsSync(file)) {
        fail(`atlas chunk ${i} points to missing file: ${candidate}`);
      } else if (statSync(file).size < 1024) {
        fail(`atlas chunk ${i} is implausibly small: ${statSync(file).size} bytes (${candidate})`);
      }
    }
  }
}

function parseGlb(file) {
  const b = readFileSync(file);
  if (b.length < 20) throw new Error('file shorter than GLB header');
  if (b.toString('ascii', 0, 4) !== 'glTF') throw new Error('bad GLB magic');
  const version = b.readUInt32LE(4);
  const declaredLength = b.readUInt32LE(8);
  if (version !== 2) throw new Error(`GLB version ${version}, expected 2`);
  if (declaredLength !== b.length) throw new Error(`declared GLB length ${declaredLength} != file length ${b.length}`);
  const jsonLength = b.readUInt32LE(12);
  const jsonType = b.readUInt32LE(16);
  if (jsonType !== 0x4E4F534A) throw new Error('first GLB chunk is not JSON');
  const json = JSON.parse(b.toString('utf8', 20, 20 + jsonLength).replace(/\0+$/g, '').trim());
  return { json, bytes: b.length };
}

const lungRel = 'models/lungs_candidate_zanatomy_full.glb';
const lungPath = path.join(publicDir, lungRel);
if (!existsSync(lungPath)) {
  fail(`${lungRel} is missing; BodyParts3D in this repo has no lung parenchyma`);
} else {
  try {
    const { json, bytes } = parseGlb(lungPath);
    const meshCount = Array.isArray(json.meshes) ? json.meshes.length : 0;
    const nodeNames = (json.nodes || []).map((n) => String(n.name || '').toLowerCase());
    if (bytes < 500_000) fail(`Z-Anatomy full lung GLB is only ${bytes} bytes; wrong candidate may have replaced it`);
    if (meshCount < 20) fail(`Z-Anatomy full lung GLB has only ${meshCount} meshes; expected the detailed segmental model`);
    const hasLeft = nodeNames.some((n) => n.includes('left'));
    const hasRight = nodeNames.some((n) => n.includes('right'));
    if (!hasLeft || !hasRight) fail('Z-Anatomy lung GLB does not expose both left and right named structures');
    console.log(`Z-Anatomy lung GLB OK: ${meshCount} meshes, ${(bytes / 1024).toFixed(0)} KiB.`);
  } catch (e) {
    fail(`cannot parse ${lungRel}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

const hraHeartRel = 'models/hra_heart_male_v1.3.glb';
const hraHeartPath = path.join(publicDir, hraHeartRel);
if (!existsSync(hraHeartPath)) {
  fail(`${hraHeartRel} is missing; the HRA interventricular-septum inspector cannot work`);
} else {
  try {
    const { json, bytes } = parseGlb(hraHeartPath);
    const names = [
      ...(json.nodes || []).map((n) => String(n.name || '')),
      ...(json.meshes || []).map((m) => String(m.name || '')),
    ];
    if (bytes < 3_000_000 || bytes > 5_000_000) {
      fail(`HRA heart GLB is ${bytes} bytes; expected the verified ~4.07 MB v1.3 source`);
    }
    const missingRequired = HRA_HEART_REQUIRED_MESH_NAMES.filter((name) => !names.includes(name));
    if (missingRequired.length > 0) {
      fail(`HRA heart GLB is missing verified source meshes: ${missingRequired.join(', ')}`);
    }

    for (const target of HRA_HEART_TARGETS) {
      if (target.kind === 'schematic') continue;
      const matches = (json.meshes || [])
        .map((m) => String(m.name || ''))
        .filter((name) => hraHeartMeshMatchesTarget(name, target.id));
      if (matches.length === 0) {
        fail(`HRA source UI target "${target.id}" matches no source mesh`);
      }
    }

    console.log(
      `HRA heart reference OK: ${(bytes / 1024 / 1024).toFixed(2)} MiB, ${HRA_HEART_REQUIRED_MESH_NAMES.length} verified meshes and ${HRA_HEART_TARGETS.length} inspectable targets.`
    );
  } catch (e) {
    fail(`cannot parse ${hraHeartRel}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

const hraInventoryPath = path.join(root, 'docs', 'hra-organ-inventory.json');
if (!existsSync(hraInventoryPath)) {
  fail('docs/hra-organ-inventory.json is missing');
} else {
  try {
    const inventory = JSON.parse(readFileSync(hraInventoryPath, 'utf8'));
    const meshNamesByModel = new Map();

    for (const model of HRA_ORGAN_MODELS) {
      const inv = inventory.organs?.[model.key];
      if (!inv) {
        fail(`HRA inventory has no entry for ${model.key}`);
        continue;
      }

      const rel = model.url.replace(/^\//, '');
      const file = path.join(publicDir, rel);
      if (!existsSync(file)) {
        fail(`HRA organ file missing: ${rel}`);
        continue;
      }

      const actualBytes = statSync(file).size;
      if (actualBytes !== inv.bytes) {
        fail(`${rel} is ${actualBytes} bytes; verified HRA source is ${inv.bytes}`);
      }

      const { json } = parseGlb(file);
      const names = (json.meshes || []).map((m) => String(m.name || '')).filter(Boolean);
      meshNamesByModel.set(model.key, names);

      const missingNames = (inv.namedMeshes || []).filter((name) => !names.includes(name));
      if (missingNames.length) {
        fail(`${rel} lost verified meshes: ${missingNames.join(', ')}`);
      }
    }

    for (const target of HRA_ORGAN_TARGETS) {
      const candidateNames = target.modelKeys.flatMap(
        (modelKey) => meshNamesByModel.get(modelKey) || []
      );
      const matches = candidateNames.filter((name) =>
        hraOrganMeshMatchesTarget(name, target.id)
      );
      if (matches.length === 0) {
        fail(`HRA organ UI target "${target.id}" matches no verified source mesh`);
      }
    }

    console.log(
      `Multi-organ HRA references OK: ${HRA_ORGAN_MODELS.length} source files, ${HRA_ORGAN_TARGETS.length} verified UI targets.`
    );
  } catch (e) {
    fail(`multi-organ HRA verification failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

const attributionPath = path.join(publicDir, 'models', 'ATTRIBUTION_BODYPARTS3D.md');
if (!existsSync(attributionPath)) {
  fail('anatomy attribution file is missing');
} else {
  const attribution = readFileSync(attributionPath, 'utf8');
  if (!/BodyParts3D/i.test(attribution) || !/CC Attribution 4\.0|CC BY 4\.0/i.test(attribution)) {
    fail('BodyParts3D CC BY 4.0 attribution is missing/incomplete');
  }
  if (!/Z-Anatomy/i.test(attribution) || !/CC BY-SA 4\.0|Attribution-ShareAlike 4\.0/i.test(attribution)) {
    fail('Z-Anatomy lung provenance / CC BY-SA 4.0 attribution is missing');
  }
  if (!/HRA internal-heart reference/i.test(attribution) || !/CC BY 4\.0/i.test(attribution)) {
    fail('HRA internal-heart provenance / CC BY 4.0 attribution is missing');
  }
  if (!/HRA multi-organ reference set/i.test(attribution)) {
    fail('HRA multi-organ reference provenance is missing');
  }
}

if (failures.length) {
  console.error(`\n${failures.length} simulator asset problem(s):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`Atlas assets OK: ${atlas.parts.length} parts, ${atlas.chunks.length} chunks.`);
console.log('Simulator model assets and provenance OK.');
