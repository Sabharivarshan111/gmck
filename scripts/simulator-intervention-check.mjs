import assert from 'node:assert/strict';
import { build } from 'esbuild';
const { outputFiles } = await build({ entryPoints: ['src/simulator/engine/PhysiologyKernel.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { PhysiologyKernel, SCENARIOS } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
const specific = ['antivenom','pralidoxime','nac','needle_decomp','pericardiocentesis','rtpa','lorazepam','oxytocin','fasciotomy','traction_splint','ors_fluids','magnesium_sulfate','calcium_gluconate','laparotomy','surgical_consult'];
let unsupported = 0;
for (const sc of SCENARIOS) for (const action of specific) {
  const kernel = new PhysiologyKernel(sc.id);
  const control = new PhysiologyKernel(sc.id);
  const feedback = kernel.applyAction(action);
  assert(feedback.length, `${sc.id}/${action}: empty feedback`);
  if (!feedback.startsWith('No case-specific effect')) continue;
  kernel.tick(2); control.tick(2);
  assert.deepEqual(kernel.vitals, control.vitals, `${sc.id}/${action}: unmodeled action changed vitals`);
  assert.deepEqual(kernel.pathology, control.pathology, `${sc.id}/${action}: unmodeled action changed pathology`);
  unsupported++;
}
assert(new PhysiologyKernel('snakebite').applyAction('antivenom').includes('ASV'));
assert(new PhysiologyKernel('stemi').applyAction('nitroglycerin').startsWith('CRITICAL ERROR'));
assert(new PhysiologyKernel('vfib_arrest').applyAction('defib').includes('Successful'));
console.log(`Intervention regression passed: ${SCENARIOS.length * specific.length} case/action pairs, ${unsupported} unsupported effects preserve physiology; target and critical-error paths retained.`);
