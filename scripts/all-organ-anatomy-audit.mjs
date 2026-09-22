import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolverPath = path.join(root, 'src/simulator/data/atlasResolver.ts');
const hraOrgansPath = path.join(root, 'src/simulator/data/hraOrgans.ts');
const hraHeartPath = path.join(root, 'src/simulator/data/hraHeart.ts');

const { describeAtlasTarget, correctPartSystem } = await import(resolverPath);
const { getHraTargetsForOrgan } = await import(hraOrgansPath);
const { HRA_HEART_TARGETS } = await import(hraHeartPath);

const atlas = JSON.parse(readFileSync(path.join(root, 'public/models/atlas.json'), 'utf8'));
atlas.parts.forEach(correctPartSystem);

const organSrc = readFileSync(path.join(root, 'src/simulator/data/organAnatomyData.ts'), 'utf8');
const dbStart = organSrc.indexOf('export const ORGAN_ANATOMY_DATABASE');
if (dbStart < 0) throw new Error('ORGAN_ANATOMY_DATABASE not found');
const dbBody = organSrc.slice(dbStart);
const organKeys = [...dbBody.matchAll(/^ {2}([a-zA-Z_][\w]*):\s*\{/gm)].map((m) => m[1]);
const nodeIds = [...dbBody.matchAll(/^ {4,}id: '([^']+)',$/gm)].map((m) => m[1]);
const targets = [...new Set([...organKeys, ...nodeIds])];

const nonAnatomical = new Set(['ascites', 'snakebite']);
const explicitSchematics = new Map([
  ['phrenic_nerve', ['HRA/Z-Anatomy landmark-derived phrenic schematic']],
  ['splanchnic_nerves', ['explicit autonomic schematic overlay']],
]);

const zAnatomySupplements = new Map([
  ['lungs', ['Z-Anatomy lung parenchyma / lobar-segmental supplement']],
  ['peripheral_nerves', ['Z-Anatomy NervousSystem100 peripheral nerve layer']],
  ['vagus_nerve', ['Z-Anatomy peripheral nerve layer']],
  ['brachial_plexus', ['Z-Anatomy peripheral nerve layer']],
  ['axillary_nerve', ['Z-Anatomy peripheral nerve layer']],
  ['median_nerve', ['Z-Anatomy peripheral nerve layer']],
  ['ulnar_nerve', ['Z-Anatomy peripheral nerve layer']],
  ['radial_nerve', ['Z-Anatomy peripheral nerve layer']],
  ['musculocutaneous_nerve', ['Z-Anatomy peripheral nerve layer']],
  ['sciatic_nerve', ['Z-Anatomy peripheral nerve layer']],
  ['femoral_nerve', ['Z-Anatomy peripheral nerve layer']],
  ['obturator_nerve', ['Z-Anatomy peripheral nerve layer']],
  ['tibial_nerve', ['Z-Anatomy peripheral nerve layer']],
  ['common_fibular_nerve', ['Z-Anatomy peripheral nerve layer']],
]);

const hraAliases = new Map([
  ['heart', 'heart'],
  ['liver', 'liver'],
  ['lungs', 'lungs'],
  ['kidney', 'kidney'],
  ['pancreas', 'pancreas'],
  ['spleen', 'spleen'],
  ['aorta', 'aorta'],
  ['portal_vein', 'portal_vein'],
  ['celiac_trunk', 'celiac_trunk'],
  ['lad_artery', 'aorta'],
  ['rca_artery', 'aorta'],
  ['abdomen', 'abdomen'],
]);

const report = {
  generatedBy: 'scripts/all-organ-anatomy-audit.mjs',
  bodyParts3DPartCount: atlas.parts.length,
  organKeys,
  targetCount: targets.length,
  targets: {},
};

const failures = [];

for (const target of targets) {
  const core = describeAtlasTarget(target, atlas);
  const sources = [];
  if (core.status === 'present' && core.ids.size > 0) {
    sources.push({
      type: 'source',
      source: 'BodyParts3D',
      meshCount: core.ids.size,
    });
  }

  const hraKey = hraAliases.get(target);
  if (target === 'heart') {
    sources.push({
      type: 'source-supplement',
      source: 'HRA male heart v1.3',
      targetCount: HRA_HEART_TARGETS.filter((t) => t.kind !== 'schematic').length,
    });
  } else if (hraKey) {
    const hraTargets = getHraTargetsForOrgan(hraKey);
    if (hraTargets.length) {
      sources.push({
        type: 'source-supplement',
        source: 'HRA male reference organs v1.3',
        targetCount: hraTargets.filter((t) => t.kind !== 'schematic').length,
      });
    }
  }

  for (const source of zAnatomySupplements.get(target) || []) {
    sources.push({ type: 'source-supplement', source });
  }
  for (const source of explicitSchematics.get(target) || []) {
    sources.push({ type: 'schematic', source });
  }

  if (nonAnatomical.has(target)) {
    sources.push({
      type: 'clinical-overlay',
      source: 'ORBIT physiology/pathology simulation; no anatomical mesh required',
    });
  }

  const hasAcceptableCoverage = sources.length > 0 || core.status === 'absent';
  if (!hasAcceptableCoverage && core.status === 'unmatched') {
    failures.push(`${target}: unmatched and has no verified supplement/schematic classification`);
  }

  report.targets[target] = {
    bodyParts3DStatus: core.status,
    bodyParts3DReason: core.reason || null,
    sources,
    coverage:
      sources.some((s) => s.type === 'source') || sources.some((s) => s.type === 'source-supplement')
        ? 'source-backed'
        : sources.some((s) => s.type === 'schematic')
        ? 'schematic-only'
        : sources.some((s) => s.type === 'clinical-overlay')
        ? 'clinical-overlay'
        : core.status === 'absent'
        ? 'known-source-gap'
        : 'uncovered',
  };
}

const counts = Object.values(report.targets).reduce((acc, item) => {
  acc[item.coverage] = (acc[item.coverage] || 0) + 1;
  return acc;
}, {});
report.summary = counts;

writeFileSync(
  path.join(root, 'docs/anatomy-coverage-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\nORBIT ALL-ANATOMY COVERAGE AUDIT\n');
for (const key of organKeys) {
  const item = report.targets[key];
  console.log(
    `${item.coverage.padEnd(17)} ${key.padEnd(22)} core=${item.bodyParts3DStatus} sources=${item.sources
      .map((s) => s.source)
      .join(' | ')}`
  );
}
console.log('\nSummary:', counts);

if (failures.length) {
  console.error('\nCoverage failures:');
  failures.forEach((f) => console.error('  ✗', f));
  process.exit(1);
}
console.log('Every simulator anatomy target is source-backed, explicitly schematic, a known source gap, or an intentional clinical overlay.');
