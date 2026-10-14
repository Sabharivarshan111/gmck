import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const native = readFileSync(path.join(here, '../src/screens/SimulatorScreen.tsx'), 'utf8');
const web = readFileSync(path.join(here, '../../src/pages/Simulator.tsx'), 'utf8');

assert.match(native, /const SIMULATOR_URL = 'https:\/\/orbitmbbs\.vercel\.app\/simulator\?orbit_native_build=27'/);
assert.match(native, /<WebView<unknown>/, 'real Vercel view missing');
assert.match(native, /incognito\s*\n\s*cacheEnabled=\{false\}/, 'stale offline cache could mask the new page');
assert.match(native, /testID="orbit-simulator-vercel-webview"/);
assert.doesNotMatch(native, /styles\.header|Offline native studio|Clinical learning studio|arrowsToFakeOrgans/i,
  'native wrapper must not add its own misleading simulator chrome');
for (const feature of ['SimulatorStudio', 'AnatomicalBody3D', 'DiagnosticTools', 'IcuMonitor', 'OrganDetailDrawer']) {
  assert.ok(web.includes(feature), 'missing reference web simulator feature: ' + feature);
}
console.log('V27 simulator source parity contract passed (runtime screenshots still required).');
