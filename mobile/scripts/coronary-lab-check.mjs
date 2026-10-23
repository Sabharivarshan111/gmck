import assert from 'node:assert/strict';
import {
  basis,
  project,
  dot,
  distance,
  coronaryTree,
  foreshortening,
  crossingCount,
  boundedAngles,
  CORONARY_VIEWS,
} from '../src/lib/coronaryLab.ts';
let cases = 0;
for (let oblique = -90; oblique <= 90; oblique += 15)
  for (let tilt = -45; tilt <= 45; tilt += 15) {
    const a = { oblique, tilt },
      b = basis(a);
    for (const v of [b.u, b.v, b.n]) assert.ok(Math.abs(dot(v, v) - 1) < 1e-10);
    for (const [u, v] of [
      [b.u, b.v],
      [b.u, b.n],
      [b.v, b.n],
    ])
      assert.ok(Math.abs(dot(u, v)) < 1e-10);
    const original = [0.3, -0.7, 0.5],
      q = project(original, a);
    const restored = b.u.map(
      (_, i) => b.u[i] * q[0] + b.v[i] * q[1] + b.n[i] * q[2],
    );
    assert.ok(distance(original, restored) < 1e-10);
    // A ray towards the detector vanishes; a perpendicular line retains length.
    assert.ok(Math.abs(foreshortening([[0, 0, 0], b.n], a) - 100) < 1e-6);
    assert.ok(foreshortening([[0, 0, 0], b.u], a) < 1e-6);
    for (const dominance of ['left', 'right'])
      for (const v of coronaryTree(dominance)) {
        const f = foreshortening(v.points, a);
        assert.ok(Number.isFinite(f) && f >= 0 && f <= 100);
      }
    cases++;
  }
for (const dominance of ['left', 'right']) {
  const tree = coronaryTree(dominance);
  assert.equal(new Set(tree.map(v => v.id)).size, tree.length);
  for (const v of tree) {
    assert.ok(v.points.length >= 2 && v.radius > 0);
    for (const p of v.points) assert.ok(p.every(Number.isFinite));
    if (v.parent) {
      const parent = tree.find(p => p.id === v.parent);
      assert.ok(parent);
      assert.ok(
        Math.min(...parent.points.map(p => distance(p, v.points[0]))) < 1e-9,
        `${v.id} must attach to ${v.parent}`,
      );
    }
  }
  const pda = tree.find(v => v.id === 'PDA');
  assert.equal(pda.system, dominance);
  assert.equal(pda.parent, dominance === 'right' ? 'dRCA' : 'dLCx');
  assert.equal(
    tree.some(v => v.id === 'dLCx'),
    dominance === 'left',
  );
}
assert.deepEqual(project([1, 2, 3], { oblique: 0, tilt: 0 }), [1, 2, 3]);
assert.ok(project([0, 0, 1], { oblique: 90, tilt: 0 })[0] < -0.999);
assert.deepEqual(boundedAngles({ oblique: Infinity, tilt: 90 }), {
  oblique: 0,
  tilt: 45,
});
const vessel = (id, points) => ({
  id,
  name: id,
  system: 'left',
  radius: 0.02,
  points,
  note: '',
});
const h = vessel('h', [
    [-1, 0, 0],
    [1, 0, 0],
  ]),
  v = vessel('v', [
    [0, -1, 1],
    [0, 1, 1],
  ]),
  junction = vessel('j', [
    [1, 0, 0],
    [2, 1, 0],
  ]);
assert.equal(crossingCount(h, [h, v], { oblique: 0, tilt: 0 }), 1);
assert.equal(crossingCount(h, [h, junction], { oblique: 0, tilt: 0 }), 0);
for (const a of CORONARY_VIEWS)
  assert.deepEqual(boundedAngles(a), { oblique: a.oblique, tilt: a.tilt });
console.log(
  `Coronary geometry: ${cases} angle combinations, projection invariants, both dominance trees, attached branches and crossing exclusions PASS.`,
);
