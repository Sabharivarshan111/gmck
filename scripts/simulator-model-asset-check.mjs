import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glbTriangles } from './lib/glb.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const atlasPath = path.join(publicDir, 'models', 'atlas.json');
const hraHeartSourcePath = path.join(root, 'src', 'simulator', 'data', 'hraHeart.ts');
const hraOrgansSourcePath = path.join(root, 'src', 'simulator', 'data', 'hraOrgans.ts');
const zReferencesSourcePath = path.join(root, 'src', 'simulator', 'data', 'zanatomyReferences.ts');
const preferredReferencesSourcePath = path.join(root, 'src', 'simulator', 'data', 'preferredAnatomyReferences.ts');
const peripheralNervesSourcePath = path.join(root, 'src', 'simulator', 'data', 'peripheralNerves.ts');
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
const {
  ZANATOMY_REFERENCE_MODELS,
  ZANATOMY_REFERENCE_TARGETS,
  zAnatomyMeshMatchesTarget,
} = await import(zReferencesSourcePath);
const {
  PREFERRED_ANATOMY_OVERVIEW_TARGETS,
} = await import(preferredReferencesSourcePath);
const {
  PERIPHERAL_NERVE_MODEL_URL,
  meshMatchesPeripheralNerveTarget,
} = await import(peripheralNervesSourcePath);
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

const zNamesByModel = new Map();
for (const model of ZANATOMY_REFERENCE_MODELS) {
  const rel = model.url.replace(/^\//, '');
  const manifestRel = model.manifestUrl.replace(/^\//, '');
  const file = path.join(publicDir, rel);
  const manifestFile = path.join(publicDir, manifestRel);

  if (!existsSync(file)) {
    fail(`Z-Anatomy reference missing: ${rel}`);
    continue;
  }
  if (!existsSync(manifestFile)) {
    fail(`Z-Anatomy manifest missing: ${manifestRel}`);
    continue;
  }

  try {
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
    if (!manifest.objectCount || !Array.isArray(manifest.objects) || !manifest.objects.length) {
      fail(`${manifestRel} has no exported objects`);
      continue;
    }

    const bytes = statSync(file).size;
    if (bytes > 14 * 1024 * 1024) {
      fail(`${rel} exceeds the 14 MiB on-demand mobile budget: ${bytes}`);
    }

    const { json } = parseGlb(file);
    const names = [
      ...(json.nodes || []).map((n) => String(n.name || '')),
      ...(json.meshes || []).map((m) => String(m.name || '')),
    ].filter(Boolean);
    zNamesByModel.set(model.key, [...new Set(names)]);

    const manifestNames = manifest.objects.map((o) => String(o.name || '')).filter(Boolean);
    const missingNames = manifestNames.filter((name) => !names.includes(name));
    if (missingNames.length) {
      fail(`${rel} lost manifest meshes: ${missingNames.join(', ')}`);
    }

    const markerOnly = manifest.objects.filter(
      (o) => Number(o.triangles || 0) <= 20 || Number(o.vertices || 0) <= 20
    );
    if (markerOnly.length) {
      fail(`${manifestRel} contains marker-like geometry: ${markerOnly.map((o) => o.name).join(', ')}`);
    }
  } catch (e) {
    fail(`cannot verify ${rel}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

for (const target of ZANATOMY_REFERENCE_TARGETS) {
  const model = ZANATOMY_REFERENCE_MODELS.find((m) => m.key === target.modelKey);
  if (!model) {
    fail(`Z-Anatomy UI target "${target.id}" references unknown model "${target.modelKey}"`);
    continue;
  }
  const names = zNamesByModel.get(target.modelKey) || [];
  const matches = names.filter((name) => zAnatomyMeshMatchesTarget(name, target.id));
  if (!matches.length) {
    fail(`Z-Anatomy UI target "${target.id}" matches no verified source mesh`);
  }
}
console.log(
  `Selective Z-Anatomy references OK: ${ZANATOMY_REFERENCE_MODELS.length} files, ${ZANATOMY_REFERENCE_TARGETS.length} verified targets.`
);

// Whole-organ isolation must never silently fall back to a rougher whole-body
// mesh when a verified dedicated teaching model is already shipped.
const expectedPreferredOrgans = [
  'heart',
  'lungs',
  'brain',
  'liver',
  'stomach',
  'pancreas',
  'spleen',
  'small_intestine',
  'urinary_bladder',
  'thymus',
  'kidney',
  'eye',
  'ureter',
  'spinal_cord',
  'pelvis',
  'prostate',
  'skin',
  'knee',
  'uterus',
  'ovary',
  'fallopian_tube',
  'placenta',
];

for (const organKey of expectedPreferredOrgans) {
  const targetId = PREFERRED_ANATOMY_OVERVIEW_TARGETS[organKey];
  if (!targetId) {
    fail(`preferred anatomy overview missing for ${organKey}`);
    continue;
  }

  const heartTarget = HRA_HEART_TARGETS.find((target) => target.id === targetId);
  if (heartTarget) {
    if (organKey !== 'heart' || targetId !== 'hra_heart_overview') {
      fail(`preferred target ${organKey} -> ${targetId} is not the verified HRA heart overview`);
    }
    continue;
  }

  const hraTarget = HRA_ORGAN_TARGETS.find((target) => target.id === targetId);
  if (hraTarget) {
    if (hraTarget.organKey !== organKey) {
      fail(`preferred target ${organKey} -> ${targetId} belongs to HRA organ ${hraTarget.organKey}`);
    }
    if (!hraTarget.matchAll) {
      fail(`preferred HRA target ${targetId} is not an overview/matchAll target`);
    }
    continue;
  }

  const zTarget = ZANATOMY_REFERENCE_TARGETS.find((target) => target.id === targetId);
  if (zTarget) {
    if (zTarget.organKey !== organKey) {
      fail(`preferred target ${organKey} -> ${targetId} belongs to Z-Anatomy organ ${zTarget.organKey}`);
    }
    if (!zTarget.matchAll) {
      fail(`preferred Z-Anatomy target ${targetId} is not an overview/matchAll target`);
    }
    continue;
  }

  fail(`preferred anatomy target ${organKey} -> ${targetId} is not backed by a verified HRA/Z-Anatomy target`);
}

console.log(
  `Preferred organ isolation OK: ${expectedPreferredOrgans.length} source-backed organ buttons route to verified overview geometry.`
);

// The peripheral nerve supplement is a separate, much larger Z-Anatomy layer.
// The all-organ audit classifies these targets as source-backed, so verify the
// actual shipped GLB and its source manifest here rather than trusting that
// classification string.
{
  const nerveRel = PERIPHERAL_NERVE_MODEL_URL.replace(/^\//, '');
  const nervePath = path.join(publicDir, nerveRel);
  const manifestRel = 'models/zanatomy_peripheral_nerves.manifest.json';
  const manifestPath = path.join(publicDir, manifestRel);

  if (!existsSync(nervePath)) {
    fail(`peripheral nerve supplement missing: ${nerveRel}`);
  } else if (!existsSync(manifestPath)) {
    fail(`peripheral nerve manifest missing: ${manifestRel}`);
  } else {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const { json, bytes } = parseGlb(nervePath);
      const names = [
        ...(json.nodes || []).map((n) => String(n.name || '')),
        ...(json.meshes || []).map((m) => String(m.name || '')),
      ].filter(Boolean);
      const uniqueNames = new Set(names);

      if (!/Z-Anatomy/i.test(String(manifest.source || ''))) {
        fail(`${manifestRel} does not identify Z-Anatomy as its source`);
      }
      if (!/CC BY-SA 4\.0/i.test(String(manifest.sourceLicense || ''))) {
        fail(`${manifestRel} is missing the Z-Anatomy CC BY-SA 4.0 licence`);
      }
      if (!Array.isArray(manifest.objects) || manifest.objects.length < 250) {
        fail(`${manifestRel} has only ${manifest.objects?.length ?? 0} exported objects; expected the verified peripheral-nerve layer`);
      }
      if (manifest.exportedObjectCount !== manifest.objects.length) {
        fail(`${manifestRel} exportedObjectCount=${manifest.exportedObjectCount} but objects.length=${manifest.objects.length}`);
      }
      // The canonical Blender exporter targets ~190k true loop-triangles
      // after mobile decimation. Keep a floor well below that target but high
      // enough to catch accidental replacement with marker/schematic geometry.
      if (Number(manifest.exportedTriangles || 0) < 175_000) {
        fail(`${manifestRel} has only ${manifest.exportedTriangles || 0} triangles; expected the ~190k detailed mobile nerve export`);
      }
      if (bytes > 14 * 1024 * 1024) {
        fail(`${nerveRel} exceeds the 14 MiB on-demand mobile budget: ${bytes}`);
      }

      const missingObjects = (manifest.objects || []).filter((name) => !uniqueNames.has(String(name)));
      if (missingObjects.length) {
        fail(`${nerveRel} lost ${missingObjects.length} manifest object(s): ${missingObjects.slice(0, 8).join(', ')}`);
      }

      // Read the actual indexed geometry with node transforms applied. Metadata
      // alone cannot catch a re-export that keeps all names but moves/scales the
      // nerves away from the body or drops most triangles.
      const nervePrimitives = glbTriangles(nervePath);
      const actualTriangles = nervePrimitives.reduce((sum, mesh) => sum + mesh.idx.length / 3, 0);
      if (actualTriangles !== Number(manifest.exportedTriangles || 0)) {
        fail(
          `${nerveRel} contains ${actualTriangles.toLocaleString('en-GB')} triangles but the verified manifest declares ${Number(manifest.exportedTriangles || 0).toLocaleString('en-GB')}`
        );
      }

      const nerveBounds = {
        lo: [Infinity, Infinity, Infinity],
        hi: [-Infinity, -Infinity, -Infinity],
      };
      for (const mesh of nervePrimitives) {
        for (let i = 0; i < mesh.pos.length; i += 3) {
          for (let axis = 0; axis < 3; axis++) {
            nerveBounds.lo[axis] = Math.min(nerveBounds.lo[axis], mesh.pos[i + axis]);
            nerveBounds.hi[axis] = Math.max(nerveBounds.hi[axis], mesh.pos[i + axis]);
          }
        }
      }

      const atlasBounds = {
        lo: [Infinity, Infinity, Infinity],
        hi: [-Infinity, -Infinity, -Infinity],
      };
      for (const part of atlas?.parts || []) {
        if (!part.bounds) continue;
        for (let axis = 0; axis < 3; axis++) {
          atlasBounds.lo[axis] = Math.min(atlasBounds.lo[axis], Number(part.bounds[0][axis]));
          atlasBounds.hi[axis] = Math.max(atlasBounds.hi[axis], Number(part.bounds[1][axis]));
        }
      }

      const nerveHeight = nerveBounds.hi[1] - nerveBounds.lo[1];
      const atlasHeight = atlasBounds.hi[1] - atlasBounds.lo[1];
      if (!Number.isFinite(nerveHeight) || nerveHeight < 1.25 || nerveHeight > 1.9) {
        fail(`${nerveRel} has implausible transformed Y span ${nerveHeight.toFixed(3)} m; expected a full-body nerve layer in metre/Y-up space`);
      }
      if (Number.isFinite(atlasHeight) && atlasHeight > 0 && nerveHeight < atlasHeight * 0.68) {
        fail(`${nerveRel} spans only ${(100 * nerveHeight / atlasHeight).toFixed(0)}% of the BodyParts3D body height; likely scale/registration drift`);
      }
      for (let axis = 0; axis < 3; axis++) {
        const tolerance = axis === 1 ? 0.18 : 0.28;
        if (
          nerveBounds.lo[axis] < atlasBounds.lo[axis] - tolerance ||
          nerveBounds.hi[axis] > atlasBounds.hi[axis] + tolerance
        ) {
          fail(
            `${nerveRel} axis ${axis} bounds [${nerveBounds.lo[axis].toFixed(3)}, ${nerveBounds.hi[axis].toFixed(3)}] sit outside the BodyParts3D envelope [${atlasBounds.lo[axis].toFixed(3)}, ${atlasBounds.hi[axis].toFixed(3)}] beyond tolerance; source registration may have drifted`
          );
        }
      }

      const requiredTargets = [
        'vagus_nerve',
        'brachial_plexus',
        'pectoral_nerves',
        'musculocutaneous_nerve',
        'axillary_nerve',
        'median_nerve',
        'ulnar_nerve',
        'radial_nerve',
        'intercostal_nerves',
        'sympathetic_chain',
        'femoral_nerve',
        'obturator_nerve',
        'sciatic_nerve',
        'tibial_nerve',
        'common_fibular_nerve',
      ];

      for (const target of requiredTargets) {
        const declared = manifest.targets?.[target] || [];
        if (!declared.length) {
          fail(`${manifestRel} declares no source objects for required target "${target}"`);
          continue;
        }
        const actualMatches = names.filter((name) =>
          meshMatchesPeripheralNerveTarget(name, target)
        );
        if (!actualMatches.length) {
          fail(`peripheral nerve target "${target}" matches no mesh in the shipped GLB`);
        }
        const staleNames = declared.filter((name) => !uniqueNames.has(String(name)));
        if (staleNames.length) {
          fail(`peripheral nerve target "${target}" references missing mesh names: ${staleNames.join(', ')}`);
        }
      }

      // These two are intentionally schematic today. If a future source adds
      // real geometry, fail loudly so the simulator can stop labelling them
      // schematic instead of quietly keeping the old classification.
      for (const target of ['phrenic_nerve', 'splanchnic_nerves']) {
        const declared = manifest.targets?.[target] || [];
        const actualMatches = names.filter((name) =>
          meshMatchesPeripheralNerveTarget(name, target)
        );
        if (declared.length || actualMatches.length) {
          fail(`${target} now has source geometry; replace its schematic classification in the anatomy audit/runtime`);
        }
      }

      console.log(
        `Z-Anatomy peripheral nerves OK: ${manifest.objects.length} source-named objects, ${Number(manifest.exportedTriangles || 0).toLocaleString('en-GB')} triangles, 15 required nerve targets verified; phrenic/splanchnic remain explicit source gaps.`
      );
    } catch (e) {
      fail(`cannot verify peripheral nerve supplement: ${e instanceof Error ? e.message : String(e)}`);
    }
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
  if (!/Selective Z-Anatomy organ references/i.test(attribution)) {
    fail('Selective Z-Anatomy reference provenance is missing');
  }
}

if (failures.length) {
  console.error(`\n${failures.length} simulator asset problem(s):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`Atlas assets OK: ${atlas.parts.length} parts, ${atlas.chunks.length} chunks.`);
console.log('Simulator model assets and provenance OK.');
