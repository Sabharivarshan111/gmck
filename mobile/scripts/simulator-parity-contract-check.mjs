/**
 * Android simulator migration contract.
 *
 * This supersedes the V27 temporary WebView-only "parity" assertion. It
 * verifies real React Native module routing and prevents the simplistic
 * fake "offline native studio" from returning. It is NOT pixel parity:
 * only actual Android-vs-Vercel screenshots can establish visual equivalence.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = p => readFileSync(resolve(here, '..', p), 'utf8');
const entry = src('src/screens/SimulatorScreen.tsx');
const studio = src('src/components/NativeClinicalStudio.tsx');
const monitor = src('src/components/NativeIcuMonitor.tsx');
const cases = src('src/components/NativeClinicalCase.tsx');
const ecg = src('src/components/NativeEcgTwelveLead.tsx');
const deepLinks = src('src/lib/nativeSimulatorRouting.ts');
const web = readFileSync(resolve(here, '../../src/pages/Simulator.tsx'), 'utf8');

for (const [symbol, source] of [
  ['<NativeClinicalStudio', entry],
  ['<NativeClinicalCase', entry],
  ['<NativeIcuMonitor', entry],
  ['<NativeEcgTwelveLead', entry],
  ['nativeClinicalRoute(destination)', entry],
  ['<Svg', monitor],
  ['<Svg', ecg],
  ['kernel.current.applyAction(actionId)', cases],
  ['studio-native-anatomy', studio],
]) assert.ok(source.includes(symbol), 'Android native migration contract missing: ' + symbol);

assert.doesNotMatch(entry, /Offline native studio|Clinical learning studio|arrowsToFakeOrgans/i, 'obsolete fake native simulator restored');
assert.ok(deepLinks.includes('https://orbitmbbs.vercel.app/simulator'), 'hosted compatibility fallback must remain canonical');
assert.match(entry, /<WebView<unknown>/, 'unfinished advanced tools still need a safe compatibility renderer');
assert.match(entry, /incognito\s*\n\s*cacheEnabled=\{false\}/, 'hosted compatibility renderer must not show outdated cache');
assert.ok(entry.includes('simulatorNavigation(request.url)'), 'navigation policy lost');
for (const symbol of ['SimulatorStudio','AnatomicalBody3D','DiagnosticTools','IcuMonitor','OrganDetailDrawer']) {
  assert.ok(web.includes(symbol), 'Vercel reference source missing: ' + symbol);
}
console.log('PASS: Android genuine native studio, cases, monitor and ECG are routed; outdated fake studio absent.');
console.log('WIP: 3D anatomy, POCUS, radiology, auscultation and full Vault 1:1 pixel parity still require native work and screenshot proof.');
