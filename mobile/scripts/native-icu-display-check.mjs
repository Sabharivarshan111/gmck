// Compare the native display against the actual frozen canonical canvas helper.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { build } from 'esbuild';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const work = await mkdtemp(join(tmpdir(), 'orbit-icu-display-'));
try {
  const source = await readFile(join(root, 'src/simulator/instruments/IcuMonitor.tsx'), 'utf8');
  const body = source.split('const calculatePoint = (t: number) => {')[1].split('\n    };')[0];
  const canonicalFile = join(work, 'canonical.mjs');
  await writeFile(canonicalFile, `export function canonical(t, liveRef, c1Y, c2Y, c3Y, c4Y) {${body}\n}`);
  const { canonical } = await import(pathToFileURL(canonicalFile).href);
  const output = join(work, 'display.mjs');
  await build({ stdin: { contents: `export * from './mobile/src/lib/nativeIcuDisplay'; export { PhysiologyKernel, SCENARIOS } from './src/simulator/engine/PhysiologyKernel';`, resolveDir: root, loader: 'ts' }, outfile: output, bundle: true, platform: 'node', format: 'esm' });
  const { calculateIcuPoint, createIcuSweep, advanceIcuSweep, icuChannelPath, PhysiologyKernel, SCENARIOS } = await import(pathToFileURL(output).href);
  let coordinates = 0;
  for (const scenario of SCENARIOS) {
    const patient = new PhysiologyKernel(scenario.id);
    const before = JSON.stringify(patient);
    const vitals = patient.getLiveVitals();
    const rhythm = patient.pathology.ecgRhythm;
    for (let x = 0; x < 720; x++) {
      const t = x / 150;
      const expected = canonical(t, { current: { vitals, ecgRhythm: rhythm } }, 49.5, 144, 238.5, 333);
      const actual = calculateIcuPoint(t, vitals, rhythm);
      for (const key of Object.keys(expected)) assert.ok(Math.abs(actual[key]-expected[key]) < 1e-10, `${scenario.id} x=${x} ${key}`);
      coordinates += 5;
    }
    const sweep = createIcuSweep(vitals, rhythm);
    assert.equal(sweep.points.length, 720);
    assert.deepEqual(sweep.points[719], calculateIcuPoint(719 / 150, vitals, rhythm));
    for (let frame = 0; frame < 202; frame++) advanceIcuSweep(sweep, .05, vitals, rhythm);
    assert.ok(Math.abs(sweep.x - 75) < 1e-8, '150px/s sweep must wrap correctly');
    assert.ok(sweep.points.some(p => p === null), '20px erase band missing');
    for (const key of ['ecgY', 'artY', 'plethY', 'capnoY']) assert.ok(!/NaN|Infinity/.test(icuChannelPath(sweep, key)));
    assert.equal(JSON.stringify(patient), before, 'Analytical prefill or animation advanced the patient clock');
  }
  for (const id of ['normal', 'stemi']) {
    const patient = new PhysiologyKernel(id), vitals = patient.getLiveVitals(), rhythm = patient.pathology.ecgRhythm;
    const sweeps = [.05, 1 / 60, .18].map(step => {
      const sweep = createIcuSweep(vitals, rhythm); let elapsed = 0;
      while (elapsed < 10.1 - 1e-10) {
        const dt = Math.min(step, 10.1 - elapsed); advanceIcuSweep(sweep, dt, vitals, rhythm); elapsed += dt;
      }
      return sweep;
    });
    for (const candidate of sweeps.slice(1)) {
      let compared = 0;
      for (let x = 0; x < 720; x++) {
        const expected = sweeps[0].points[x], actual = candidate.points[x];
        if (!expected || !actual) continue;
        for (const key of ['ecgY', 'artY', 'plethY', 'capnoY']) assert.ok(Math.abs(actual[key] - expected[key]) < 1e-7, `${id} ${key} x=${x}: frame-dependent trace`);
        compared++;
      }
      assert.ok(compared > 650, 'Most of each live sweep must be compared');
    }
  }
  console.log(`PASS: ${coordinates} native waveform coordinates match canonical Vercel calculations across ${SCENARIOS.length} scenarios; sweep wrap, erase band and patient clock verified.`);
} finally { await rm(work, { recursive: true, force: true }); }
