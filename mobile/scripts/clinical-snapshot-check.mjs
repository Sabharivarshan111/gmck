import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const result = await build({ stdin: { contents: `export { PhysiologyKernel, SCENARIOS } from './src/simulator/engine/PhysiologyKernel'; export { CLINICAL_DEPARTMENTS } from './src/simulator/data/atlasTypes'; export { restoreClinicalSnapshot } from './mobile/src/lib/clinicalSnapshot';`, resolveDir: root, loader: 'ts' }, alias: { '@simulator': resolve(root, 'src/simulator') }, bundle: true, external: ['fflate'], platform: 'node', format: 'esm', write: false });
const { PhysiologyKernel, SCENARIOS, CLINICAL_DEPARTMENTS, restoreClinicalSnapshot } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
assert.deepEqual(JSON.parse(await readFile(resolve(root, 'mobile/src/lib/nativeClinicalDepartments.json'), 'utf8')), CLINICAL_DEPARTMENTS, 'Generated native department filters differ from canonical source');
for (const scenario of SCENARIOS) {
  const native = new PhysiologyKernel(scenario.id);
  for (const action of ['saline', 'oxygen', 'adrenaline']) native.applyAction(action);
  for (let i = 0; i < 17; i++) native.tick(0.125);
  const embedded = new PhysiologyKernel('normal');
  assert.ok(restoreClinicalSnapshot(embedded, JSON.stringify(native)), scenario.id + ': failed initial transfer');
  for (let i = 0; i < 50; i++) {
    native.tick(0.025); embedded.tick(0.025);
    assert.deepEqual(embedded.getLiveVitals(), native.getLiveVitals(), scenario.id + ': patient vital continuity lost');
    assert.deepEqual(embedded.sampleWaveforms(), native.sampleWaveforms(), scenario.id + ': waveform phase / targets lost');
  }
  embedded.applyAction('atropine'); embedded.tick(0.125);
  assert.ok(restoreClinicalSnapshot(native, JSON.stringify(embedded)), scenario.id + ': failed return transfer');
  assert.deepEqual(JSON.parse(JSON.stringify(native)), JSON.parse(JSON.stringify(embedded)), scenario.id + ': treatment state lost returning to RN');
  const before = JSON.stringify(native);
  assert.equal(restoreClinicalSnapshot(native, '{"vitals":{"heartRate":null}}'), false);
  assert.equal(JSON.stringify(native), before, 'Malformed snapshot changed the patient');
}
console.log(`PASS: all ${SCENARIOS.length} treated patients survive RN ↔ embedded renderer transfers, including targets, phases, vitals, pathology, actions and latest logs; native departments match source.`);
