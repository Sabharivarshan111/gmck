// Compare the native display against the actual frozen canonical canvas helper.
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { build } from 'esbuild';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const work = await mkdtemp(join(tmpdir(), 'orbit-icu-display-'));
try {
  const source = await readFile(join(root, 'src/simulator/instruments/IcuMonitor.tsx'), 'utf8');
  const body = source.split('const calculatePoint = (t: number) => {')[1].split('\n    };')[0];
  const canonical = new Function('t', 'liveRef', 'c1Y', 'c2Y', 'c3Y', 'c4Y', body);
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
  console.log(`PASS: ${coordinates} native waveform coordinates match canonical Vercel calculations across ${SCENARIOS.length} scenarios; sweep wrap, erase band and patient clock verified.`);
} finally { await rm(work, { recursive: true, force: true }); }
