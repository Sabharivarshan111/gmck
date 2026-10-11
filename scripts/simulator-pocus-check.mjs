// Exercise the real renderer at phone widths; use a temporary canvas dependency.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { createCanvas } = require(process.env.ORBIT_CANVAS_PATH || '@napi-rs/canvas');
const ts = require('typescript');
globalThis.document = { createElement: () => createCanvas(1, 1) };
const code = ts.transpileModule(fs.readFileSync('src/simulator/instruments/pocus/PocusEngineCore.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { PocusSimulationEngine, DEFAULT_POCUS_SETTINGS } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const vitals = { heartRate: 72, respiratoryRate: 16, cvp: 4, spo2: 98, meanArterialPressure: 80, lactate: 8 };
const pathology = { ascites: 0, lungSoundType: 'vesicular', heartSoundType: 'normal' };
const hash = canvas => createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex');
fs.mkdirSync('/tmp/orbit-pocus-renders', {recursive: true});
for (const width of [310,340,380]) {
  for (const viewMode of ['cardiac_plax','subxiphoid','fast_morison','lung']) {
    const engine = new PocusSimulationEngine();
    const canvas = createCanvas(width, 368), ctx = canvas.getContext('2d');
    const settings = {...DEFAULT_POCUS_SETTINGS, viewMode};
    engine.render(ctx,width,368,0.7,vitals,pathology,settings);
    const baseline = hash(canvas);
    engine.render(ctx,width,368,0.7,vitals,pathology,{...settings,isFrozen:true});
    const frozen = hash(canvas);
    engine.render(ctx,width,368,0.7,vitals,pathology,{...settings,isFrozen:true});
    assert.equal(hash(canvas), frozen, 'frozen frames must be pixel-identical');
    engine.render(ctx,width,368,4.2,{...vitals,heartRate:150,respiratoryRate:32},{...pathology,ascites:0.8},{...settings,isFrozen:true});
    assert.equal(hash(canvas), frozen, 'new case signals must not change the frozen scan');
    engine.render(ctx,width,368,0.7,vitals,pathology,{...settings,gain:1.6});
    assert.notEqual(hash(canvas), baseline, 'gain must change scan brightness');
    engine.render(ctx,width,368,0.7,vitals,pathology,{...settings,depthCm:8});
    assert.notEqual(hash(canvas), baseline, 'depth must zoom the scan field');
    engine.render(ctx,width,368,0.7,vitals,pathology,{...settings,showMMode:true});
    const historyLength=engine.mMBuffer.length;
    engine.render(ctx,width,368,0.7,vitals,pathology,{...settings,showMMode:true,isFrozen:true});
    assert.equal(engine.mMBuffer.length,historyLength,'Freeze must not advance M-mode');
    engine.render(ctx,width,368,0.8,vitals,pathology,{...settings,showMMode:true});
    assert.equal(engine.mMBuffer.length,historyLength+1);
    if (width === 310) {
      engine.render(ctx,width,368,0.7,vitals,{...pathology,ascites:0.8},settings);
      fs.writeFileSync(`/tmp/orbit-pocus-renders/${viewMode}.png`, canvas.toBuffer('image/png'));
    }
    if (viewMode === 'fast_morison') {
      engine.render(ctx,width,368,0.7,vitals,pathology,settings);
      const noFluid = hash(canvas);
      engine.render(ctx,width,368,0.7,{...vitals,lactate:1},pathology,settings);
      assert.equal(hash(canvas),noFluid,'Lactate alone must not create abdominal fluid');
      engine.render(ctx,width,368,0.7,vitals,{...pathology,ascites:0.8},settings);
      assert.notEqual(hash(canvas),noFluid,'Fluid setting must affect the scan');
    }
    for (const depthCm of [8,16,22]) {
      let label=''; const original=ctx.fillText.bind(ctx);
      ctx.fillText=(text,...args)=>{label=text; original(text,...args);};
      engine.renderCalipers(ctx,{...settings,depthCm,caliperPointA:{x:100,y:100},caliperPointB:{x:100,y:100+2*324/depthCm}},324);
      assert.equal(label,'+ 2.0 cm','Calipers must agree with depth scale');
      ctx.fillText=original;
    }
  }
}
console.log('POCUS: 12 mobile renders; stable freeze, M-mode history, gain, depth, fluid routing and calibrated calipers passed.');
