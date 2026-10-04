// Exercise actual preference validation, persistence, rollover and plan allocation.
import { buildSync } from 'esbuild';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const saved = new Map();
const storage = { getItem: async key => saved.get(key) ?? null, setItem: async (key, value) => { saved.set(key, value); } };
const result = buildSync({ entryPoints: ['src/lib/studyBuddy.ts'], bundle: true, write: false, platform: 'node', format: 'cjs', external: ['@react-native-async-storage/async-storage', 'react'] });
const module = { exports: {} };
vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require: id => id === 'react' ? { useEffect() {}, useSyncExternalStore() {} } : storage, Date, Set });
const { cleanBuddy, studyPlan, todayKey, hydrateBuddy, setBuddy, getBuddy, BUDDY_ANIMALS, BUDDY_VARIANTS, recommendedVariant } = module.exports;
assert.equal(cleanBuddy({ kind: 'invalid', minutes: -10, color: 'red' }).kind, 'orb');
assert.equal(cleanBuddy({ name: '' }).name, 'Orbit');
assert.equal(cleanBuddy({ name: 'x'.repeat(100) }).name.length, 24);
assert.equal(cleanBuddy({ quiet: true }).quiet, true);
assert.equal(cleanBuddy({ enabled: false }).enabled, false);
assert.equal(cleanBuddy({ remindMcq: 'true' }).remindMcq, false);
assert.deepEqual(Array.from(cleanBuddy({ day: '2000-1-1', completed: [0, 1, 2] }).completed), []);
assert.deepEqual(Array.from(cleanBuddy({ day: todayKey(), completed: [0, 0, 2, -1, 99] }).completed), [0, 2]);
for (const minutes of [15, 30, 60]) {
  const plan = studyPlan(minutes, 'Cardiac cycle');
  assert.equal(plan.reduce((sum, step) => sum + step.minutes, 0), minutes);
  assert.ok(plan.every(step => step.minutes > 0));
  assert.ok(plan[1].prompt.startsWith('Double-tapped:'));
  assert.ok(plan.every(step => step.prompt.includes('Cardiac cycle')));
}
saved.set('orbit:study-buddy-v1', JSON.stringify({ kind: 'owl', name: 'Nova', minutes: 60, day: todayKey(), completed: [1] }));
await hydrateBuddy();
assert.equal(getBuddy().name, 'Nova');
assert.equal(getBuddy().kind, 'otter');
assert.equal(cleanBuddy({ kind: 'crocodile' }).kind, 'squirrel');
setBuddy({ kind: 'bear', color: '#42BFA9', remindMcq: true });
assert.equal(JSON.parse(saved.get('orbit:study-buddy-v1')).kind, 'bear');
assert.equal(getBuddy().name, 'Nova');
console.log('PASS: Study Buddy preference validation, persistence, opt-in flags, daily rollover and 15/30/60-minute plans.');

for (const animal of BUDDY_ANIMALS) {
  for (const variant of BUDDY_VARIANTS) {
    setBuddy({ kind: animal.id, variant });
    assert.equal(getBuddy().kind, animal.id);
    assert.equal(getBuddy().variant, variant);
    assert.equal(JSON.parse(saved.get('orbit:study-buddy-v1')).variant, variant);
  }
  assert.equal(cleanBuddy({ kind: animal.id }).variant, recommendedVariant(animal.id));
}
assert.equal(cleanBuddy({ variant: 'invalid' }).variant, 'classic');
console.log('PASS: all 27 animal designs persist, invalid variants recover, and existing animal preferences migrate.');
