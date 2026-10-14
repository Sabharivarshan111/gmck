import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mobile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => readFileSync(path.resolve(mobile, relative), 'utf8');

const kernel = read('../src/simulator/engine/PhysiologyKernel.ts');
const web = read('../src/simulator/controls/SimulatorStudio.tsx');
const catalog = read('src/lib/nativeClinicalCatalog.ts');
const native = read('src/components/NativeClinicalStudio.tsx');
const entry = read('src/screens/SimulatorScreen.tsx');
const routes = read('src/lib/nativeSimulatorRouting.ts');
const webPage = read('../src/pages/Simulator.tsx');

const rows = [...kernel.matchAll(/\bid:\s*(['"])(.*?)\1\s*,\s*title:\s*(['"])(.*?)\3\s*,\s*subtitle:\s*(['"])(.*?)\5\s*,\s*category:\s*(['"])(.*?)\7/gms)]
  .map(m => ({ id: m[2], title: m[4], subtitle: m[6], category: m[8] }));
const skills = [...web.matchAll(/\{\s*id:\s*'([^']+)'\s*,\s*title:\s*'([^']+)'\s*,\s*hint:\s*'([^']+)'\s*,\s*emoji:\s*'([^']+)'\s*\}/g)]
  .map(m => ({ id: m[1], title: m[2], hint: m[3], emoji: m[4] }));
const extract = name => {
  const match = catalog.match(new RegExp('export const ' + name + ':[^=]*= (\\[[\\s\\S]*?\\]);'));
  assert.ok(match, 'native catalog missing ' + name);
  return JSON.parse(match[1]);
};

assert.ok(rows.length >= 40, 'web clinical case extraction incomplete');
assert.equal(skills.length, 7, 'web clinical skill extraction incomplete');
assert.deepEqual(extract('NATIVE_CLINICAL_SCENARIOS'), rows, 'native case choices diverged from Vercel');
assert.deepEqual(extract('NATIVE_CLINICAL_SKILLS'), skills, 'native skill choices diverged from Vercel');

for (const [element, label] of [
  ['studio-native-anatomy', '3D anatomy'],
  ['studio-native-baseline', 'findings selector'],
  ['studio-native-search', 'search'],
  ['studio-native-monitor', 'ICU monitor'],
]) assert.ok(native.includes(element), 'native screen missing ' + label);
assert.ok(native.includes('studio-native-${k}') && native.includes("(['skills','cases'] as const)"), 'native skill/case segmented controls are missing');
assert.ok(entry.includes('<NativeClinicalStudio'), 'simulator entry does not show native studio');
assert.ok(routes.includes('orbitmbbs.vercel.app/simulator'), 'deep module fallback routing lost');
assert.ok(webPage.includes("searchParams.get('mode') === 'telemetry'"), 'web telemetry deep link missing');
assert.ok(webPage.includes("searchParams.get('tool') === 'clubbing'"), 'web clubbing deep link missing');
console.log('PASS: Native studio cards, labels and case catalog mirror Vercel source.');
console.log('WIP: Deep skill/3D/monitor engines still use a hosted WebView; FULL NATIVE PARITY IS NOT DONE.');
