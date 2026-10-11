#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const manifestPath = path.join(root, 'public/models/pocus/fast/manifest.json');
if (!fs.existsSync(manifestPath)) throw new Error('Missing source FAST manifest');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.probe.geometry !== 'curvilinear') throw new Error('FAST pilot must declare curvilinear geometry');
if (manifest.probe.elements !== 128) throw new Error('Unexpected C5-2v element count');
if (Math.abs(manifest.probe.centerFrequencyMHz - 3.57) > .01) throw new Error('Unexpected center frequency');
if (manifest.frames.length !== 2 || new Set(manifest.frames.map(frame => frame.state)).size !== 2) throw new Error('Expected balanced normal/fluid states');
for (const frame of manifest.frames) {
  const file = path.join(root, 'public', frame.image.replace(/^\//, ''));
  if (!fs.existsSync(file) || fs.statSync(file).size < 10_000) throw new Error(`Invalid reconstructed asset: ${frame.image}`);
}
if (!(manifest.qualityCheck.meanFluidGapEnvelopeReductionDb > 3)) throw new Error('Fluid state did not measurably reduce hepatorenal gap envelope');
const component = fs.readFileSync(path.join(root, 'src/simulator/instruments/pocus/PocusSourceScan.tsx'), 'utf8');
for (const marker of ['ResizeObserver', 'Loading source-reconstructed scan', 'Retry scan', 'experimental source-reconstructed']) {
  if (!component.includes(marker)) throw new Error(`Missing runtime guard: ${marker}`);
}
console.log('POCUS source check passed: two source-reconstructed experimental states.');
