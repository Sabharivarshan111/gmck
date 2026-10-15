// Regression: ~83Hz could miss every narrow R peak for 18–22% of starting phases.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const work = await mkdtemp(join(tmpdir(), 'orbit-icu-sampling-'));
try {
  const output = join(work, 'sampling.mjs');
  await build({ stdin: { contents: `export { PhysiologyKernel } from './src/simulator/engine/PhysiologyKernel'; export { advanceNativeTelemetry, NATIVE_ICU_SAMPLE_STEP } from './mobile/src/lib/nativeIcuSampling';`, resolveDir: root, loader: 'ts' }, outfile: output, bundle: true, platform: 'node', format: 'esm' });
  const { PhysiologyKernel, advanceNativeTelemetry, NATIVE_ICU_SAMPLE_STEP } = await import(pathToFileURL(output).href);
  assert.ok(NATIVE_ICU_SAMPLE_STEP <= 0.004, 'R waves require at least 250Hz sampling');
  for (const id of ['normal', 'stemi']) {
    for (let phase = 0; phase < 100; phase++) {
      const patient = new PhysiologyKernel(id);
      // A monitor can open at any phase of an already-running patient.
      patient.cardiacPhase = phase / 100 * 2 * Math.PI;
      let pulses = 0, last = -1;
      for (let frame = 0; frame < 56; frame++) {
        const samples = advanceNativeTelemetry(patient, 0.09);
        assert.ok(samples.every(point => Object.values(point).every(Number.isFinite)));
        if (samples.some(point => point.ecg > 1) && frame * 0.09 - last > 0.4) {
          pulses++;
          last = frame * 0.09;
        }
      }
      assert.ok(pulses >= Math.floor(patient.vitals.heartRate * 5 / 60) - 1, `${id} phase ${phase}: R waves lost (${pulses} pulses)`);
      assert.ok(Math.abs(patient.simTimeSec - 5.04) < 1e-8, 'monitor advanced the patient clock by the wrong duration');
    }
  }
  const patient = new PhysiologyKernel('normal');
  const before = JSON.stringify(patient);
  for (const invalid of [0, -1, NaN, Infinity]) assert.deepEqual(advanceNativeTelemetry(patient, invalid), []);
  assert.equal(JSON.stringify(patient), before, 'invalid sampling interval altered the patient');
  console.log('PASS: normal/STEMI R waves retained at all 100 starting phases; real patient clock and invalid-interval behavior preserved.');
} finally {
  await rm(work, { recursive: true, force: true });
}
