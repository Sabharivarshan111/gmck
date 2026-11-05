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
  ['patient.applyAction(actionId)', cases],
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
// Verified purchase must remove Preview on Android just as on the website.
// The native and WebGL layers must both enforce sample restrictions.
const nativeEntitlement = src('src/lib/simulatorEntitlement.ts');
const premiumCache = src('src/lib/premium.ts');
const websiteEntitlement = readFileSync(resolve(here, '../../src/lib/website-premium.ts'),'utf8');
const sampleGate = readFileSync(resolve(here, '../../src/simulator/SimulatorAccess.tsx'),'utf8');
assert.match(websiteEntitlement,/\.eq\('plan', 'adfree_monthly'\)/);
assert.match(premiumCache,/\.eq\('plan', 'adfree_monthly'\)/,'Android must verify the same subscription as the website');
assert.match(nativeEntitlement,/syncPremiumCache\(\)/,'Android access must come from server-backed account Premium');
assert.match(nativeEntitlement,/setLoading\(true\)/,'Do not flash the free banner before verifying paid status');
assert.match(studio,/\{!premiumActive \? \(/,'The free-preview card must be hidden for paid users');
assert.match(studio,/testID="studio-native-free-preview"/);
assert.match(entry,/useSimulatorEntitlement\(focused\)/);
assert.match(entry,/if \(premiumLoading\) return wrap/,'Do not render Preview while a subscriber is loading');
assert.match(entry,/destination.kind !== 'anatomy'/,'Guard native cases and advanced diagnostic tools');
assert.match(entry,/premiumActive=\{premiumActive\}/,'Pass verified access to the native studio');
assert.match(entry,/nativePremium=' \+ \(premiumActive \? '1' : '0'\)/,'Pass entitlement to WebGL');
assert.match(renderer,/SimulatorAccessContext.Provider value=\{\{ active: premiumFromNative/,'Local WebGL must enforce canonical sample restrictions');
assert.match(sampleGate,/if \(access.active\) return null/,'The preview banner must disappear after purchase');
assert.match(view,/ORBIT_NATIVE_PREMIUM_REQUEST/,'Locked renderer actions must return to a native upgrade screen');
console.log('PASS: unpaid Android shows sample preview; verified Premium hides it and unlocks both the native studio and bundled WebGL.');

console.log('PASS: Android genuine native studio, cases, monitor and ECG are routed; outdated fake studio absent.');
console.log('Canonical anatomy/diagnostic renderer is local, with pinned persistent model downloads. WIP: actual device appearance, gestures, sound and full Vault parity still need screenshot/functional proof.');
