import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';

// Execute the actual camera-action effect with real Three vectors/camera and
// a minimal controls interface; no WebGL or duplicated navigation algorithm.
const source = readFileSync(new URL('../src/simulator/view/AnatomicalBody3D.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('AnatomicalBody3D.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let callback;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useEffect' && node.arguments[0]?.getText(ast).includes('if (!cameraAction?.id)')) callback = node.arguments[0].getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(callback, 'camera action effect exists');
const camera = new THREE.PerspectiveCamera();
camera.position.set(0, 0.85, 3.4);
const controls = { target: new THREE.Vector3(0, 0.85, 0), minDistance: 0.3, maxDistance: 10, touches: {}, update() {} };
const spreadBase = { current: { previous: 'spread view' } };
const lastSpread = { current: 1 };
const run = new Function('THREE', 'cameraAction', 'cameraRef', 'controlsRef', 'mountRef', 'window', 'navigator', 'explodeCameraBaseRef', 'lastExplodeAmountRef', `return (${callback})();`);
const action = kind => run(THREE, {kind, id:1}, {current:camera}, {current:controls}, {current:{clientWidth:390}}, {innerWidth:390}, {userAgent:'iPhone'}, spreadBase, lastSpread);
action('in'); assert.ok(Math.abs(camera.position.distanceTo(controls.target)-2.72) < 1e-9);
action('out'); assert.ok(Math.abs(camera.position.distanceTo(controls.target)-3.4) < 1e-9);
action('left'); assert.ok(controls.target.x < 0);
action('right'); assert.ok(Math.abs(controls.target.x) < 1e-9);
action('up'); assert.ok(controls.target.y > 0.85);
action('down'); assert.ok(Math.abs(controls.target.y-0.85) < 1e-9);
for (let i=0;i<30;i++) action('in');
assert.ok(Math.abs(camera.position.distanceTo(controls.target)-0.3) < 1e-9);
action('left'); action('reset');
assert.deepEqual(camera.position.toArray(), [0,0.85,3.4]);
assert.deepEqual(controls.target.toArray(), [0,0.85,0]);
assert.equal(spreadBase.current, null);
assert.equal(lastSpread.current, 0);
assert.equal(controls.touches.ONE, THREE.TOUCH.ROTATE);
console.log('Actual camera effect: zoom limits, pan round trips and same-region/spread reset passed');
