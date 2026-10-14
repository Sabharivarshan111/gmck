/**
 * Functional check for the real shared Vercel physiology engine used by
 * native ICU and case modules. Runs in plain Node without Android emulator.
 */
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const mobile = resolve(fileURLToPath(new URL('..', import.meta.url)));
const work = await mkdtemp(join(tmpdir(), 'orbit-native-clinical-'));
try {
  const output = join(work, 'physiology.mjs');
  await build({
    entryPoints: [join(mobile, '../src/simulator/engine/PhysiologyKernel.ts')],
    outfile: output,
    platform: 'node',
    format: 'esm',
    bundle: true,
    logLevel: 'silent',
  });
  const { PhysiologyKernel, SCENARIOS } = await import(pathToFileURL(output).href);
  assert.equal(SCENARIOS.length, 43, 'catalog count changed: review the native parity data source');
  assert.ok(SCENARIOS.some(s => s.id === 'normal'));
  for (const scenario of SCENARIOS) {
    const kernel = new PhysiologyKernel(scenario.id);
    assert.equal(kernel.currentScenario.id, scenario.id);
    const { heartRate, spo2 } = kernel.getLiveVitals();
    assert.ok(Number.isFinite(heartRate) && Number.isFinite(spo2), scenario.id + ': nonnumeric vitals');
    kernel.tick(0.01);
    const waveform = kernel.sampleWaveforms();
    for (const name of ['ecg', 'artLine', 'pleth', 'capno', 'cvp'])
      assert.ok(Number.isFinite(waveform[name]), scenario.id + ': invalid waveform ' + name);
  }

  // Case-specific clinical intervention effects must actually change the
  // simulation, not just append a fake success message on the Android screen.
  const snake = new PhysiologyKernel('snakebite');
  const before = snake.vitals.spo2;
  const feedback = snake.applyAction('antivenom');
  for (let i = 0; i < 100; i++) snake.tick(0.01);
  assert.ok(snake.vitals.spo2 > before, 'antivenom has no physiological response');
  assert.match(feedback, /venom|ASV|neutral/i);

  const vfib = new PhysiologyKernel('vfib_arrest');
  assert.equal(vfib.pathology.ecgRhythm, 'vfib');
  vfib.applyAction('defib');
  assert.equal(vfib.pathology.ecgRhythm, 'sinus', 'defibrillation did not restore rhythm');

  const heart = new PhysiologyKernel('stemi');
  const ischemia = heart.pathology.myocardialIschemia;
  heart.applyAction('aspirin_ticagrelor');
  assert.ok(heart.pathology.myocardialIschemia < ischemia, 'antiplatelet has no action');

  // Exercise every actionable button in every clinical case, including
  // "wrong" choices. Bad choices must produce feedback, not crashes/NaNs.
  const actionsText = readFileSync(join(mobile,'src/lib/nativeClinicalActions.ts'),'utf8');
  const jsonActions = actionsText.match(/export const NATIVE_CLINICAL_ACTIONS:[^=]*= (\[[\s\S]*?\]);/);
  assert.ok(jsonActions,'Native action catalog not found');
  const actions = JSON.parse(jsonActions[1]);
  assert.equal(actions.length,27);
  let exercised=0;
  for (const scenario of SCENARIOS) {
    for (const action of actions) {
      const patient = new PhysiologyKernel(scenario.id);
      const response = patient.applyAction(action.id);
      assert.equal(typeof response,'string',scenario.id+' '+action.id+' no textual feedback');
      assert.ok(response.length>0,scenario.id+' '+action.id+' blank feedback');
      patient.tick(0.08);
      const vitalValues = Object.entries(patient.getLiveVitals());
      for (const [key,value] of vitalValues)
        assert.ok(Number.isFinite(value),scenario.id+' '+action.id+' corrupted vital '+key);
      for (const key of ['ecg','artLine','pleth','capno','cvp'])
        assert.ok(Number.isFinite(patient.sampleWaveforms()[key]),scenario.id+' '+action.id+' corrupt trace '+key);
      exercised++;
    }
  }
  assert.equal(exercised, 43*27, 'Not all visible clinical actions exercised');
  console.log('PASS: '+exercised+' engine actions tested (all 27 buttons in all 43 cases; feedback, finite vitals, waveforms).');
  console.log('PASS: all 43 web cases, waveform channels and 3 physiology-specific intervention pathways.');
} finally {
  await rm(work, { recursive: true, force: true });
}
