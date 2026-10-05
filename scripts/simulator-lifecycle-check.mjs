import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync('src/simulator/engine/visibleFrameLoop.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { startVisibleFrameLoop } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const callbacks = new Map();
const listeners = new Set();
let id = 0;
globalThis.document = {
  hidden: false,
  addEventListener: (_event, fn) => listeners.add(fn),
  removeEventListener: (_event, fn) => listeners.delete(fn),
};
globalThis.requestAnimationFrame = fn => { callbacks.set(++id, fn); return id; };
globalThis.cancelAnimationFrame = id => callbacks.delete(id);
const advance = time => {
  const queued = [...callbacks.values()];
  callbacks.clear();
  queued.forEach(fn => fn(time));
};
const visibility = hidden => { document.hidden = hidden; listeners.forEach(fn => fn()); };
const deltas = [];
const stop = startVisibleFrameLoop((_time, dt) => deltas.push(dt));
advance(1000); advance(1016); advance(2016);
assert.deepEqual(deltas, [0, 0.016, 0.05], 'Long visible gaps must be bounded.');
visibility(true);
assert.equal(callbacks.size, 0, 'Hidden pages must have no scheduled animation work.');
advance(50000);
assert.equal(deltas.length, 3);
visibility(false); visibility(false);
assert.equal(callbacks.size, 1, 'Repeated resume must never create competing frame loops.');
advance(51000); advance(51016);
assert.deepEqual(deltas.slice(-2), [0, 0.016], 'Return from background must discard hidden time.');
stop();
assert.equal(callbacks.size, 0);
assert.equal(listeners.size, 0, 'Unmount must remove visibility listeners.');
visibility(true);
const stopHidden = startVisibleFrameLoop(() => assert.fail('Hidden mount executed a frame.'));
assert.equal(callbacks.size, 0);
stopHidden();
console.log('Simulator lifecycle: gap clamp, background pause, resume deduplication and cleanup passed.');
