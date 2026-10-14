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
  ['<NativeRadiologyViewer', entry],
  ['<NativeClubbingTrainer', entry],
  ['nativeClinicalRoute(destination)', entry],
  ['<Svg', monitor],
  ['<Svg', ecg],
  ['kernel.current.applyAction(actionId)', cases],
  ['studio-native-anatomy', studio],
]) assert.ok(source.includes(symbol), 'Android native migration contract missing: ' + symbol);

assert.doesNotMatch(entry, /Offline native studio|Clinical learning studio|arrowsToFakeOrgans/i, 'obsolete fake native simulator restored');
assert.ok(deepLinks.includes('https://orbitmbbs.vercel.app/simulator'), 'routes must retain canonical Vercel query semantics');
assert.match(entry, /<LocalSimulator/, 'anatomy must use the locally bundled canonical renderer');
assert.doesNotMatch(entry, /source=\{\{ uri: url \}\}/, 'hosted simulator page must not return');
const view = src('android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/SimulatorViewManager.kt');
const store = src('android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/SimulatorAssetStore.kt');
const renderer = src('simulator-renderer/main.tsx');
assert.ok(renderer.includes("../../src/pages/Simulator"), 'canonical renderer source must be reused without a divergent organ substitute');
assert.ok(renderer.includes('mobile-touch-targets.css') && renderer.includes('<ThemeProvider>'), 'canonical mobile touch sizing and global theme provider must accompany the simulator');
for (const policy of ['settings.allowFileAccess = false', 'settings.allowContentAccess = false', 'MIXED_CONTENT_NEVER_ALLOW', 'uri.host != HOST', 'BuildConfig.DEBUG']) {
  assert.ok(view.includes(policy), 'local renderer safety policy lost: ' + policy);
}
for (const policy of ['manifest.optJSONObject(path)', 'MessageDigest.getInstance("SHA-256")', 'instanceFollowRedirects = false', 'written > expectedSize', 'context.filesDir']) {
  assert.ok(store.includes(policy), 'persistent canonical asset validation lost: ' + policy);
}
for (const symbol of ['SimulatorStudio','AnatomicalBody3D','DiagnosticTools','IcuMonitor','OrganDetailDrawer']) {
  assert.ok(web.includes(symbol), 'Vercel reference source missing: ' + symbol);
}
console.log('PASS: Android genuine native studio, cases, monitor and ECG are routed; outdated fake studio absent.');
console.log('Canonical anatomy/diagnostic renderer is local, with pinned persistent model downloads. WIP: actual device appearance, gestures, sound and full Vault parity still need screenshot/functional proof.');
