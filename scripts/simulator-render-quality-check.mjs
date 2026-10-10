import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = readFileSync(new URL('../src/simulator/data/renderQuality.ts', import.meta.url), 'utf8');
const { anatomyPixelRatio: ratio } = await import(`data:text/javascript,${encodeURIComponent(stripTypeScriptTypes(source))}`);
assert.equal(ratio(3, true, 'crisp', 390, 844, 8), 1.5);
assert.equal(ratio(3, true, 'crisp', 390, 844, 2), 1.25);
assert.equal(ratio(3, true, 'smooth', 390, 844), 1);
assert.equal(ratio(1, true, 'crisp', 390, 844), 1);
assert.equal(ratio(2, false, 'crisp', 800, 600), 1.75);
assert.ok(ratio(3, true, 'crisp', 5000, 5000) ** 2 * 5000 * 5000 <= 3_000_000.001);
console.log('Simulator render quality: phone/memory caps and 3M pixel budget passed');
