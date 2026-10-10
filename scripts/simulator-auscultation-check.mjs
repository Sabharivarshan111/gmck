import fs from 'node:fs';
import assert from 'node:assert/strict';
import { stripTypeScriptTypes } from 'node:module';
import { createRequire } from 'node:module';
const importTs = async path => import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(fs.readFileSync(path, 'utf8'))).toString('base64'));
const { resolveAuscultation } = await importTs('src/simulator/instruments/auscultationRouting.ts');
const { StethoscopeAudioEngine } = await importTs('src/simulator/instruments/StethoscopeSynthesizer.ts');
const require = createRequire(import.meta.url);
let webAudio;
try { webAudio = require('web-audio-engine'); } catch {
  if (!process.env.ORBIT_AUDIO_ENGINE_PATH) throw new Error('Install web-audio-engine in a temporary test directory and set ORBIT_AUDIO_ENGINE_PATH.');
  webAudio = require(process.env.ORBIT_AUDIO_ENGINE_PATH);
}
const pathology = { heartSoundType: 's3_gallop', lungSoundType: 'wheeze', cyanosis: 0.9, ecgRhythm: 'sinus' };
assert.equal(resolveAuscultation(pathology, {cvp: 20, meanArterialPressure: 40}, 'mitral', 'chf_dcm').heart, 's3_gallop');
assert.equal(resolveAuscultation(pathology, {cvp: 20}, 'trachea', 'chf_dcm').lung, 'bronchial');
assert.equal(resolveAuscultation(pathology, {cvp: 20}, 'trachea', 'anaphylaxis').lung, 'stridor');
assert.equal(resolveAuscultation(pathology, {cvp: 20}, 'mitral', 'tamponade').heart, 'tamponade_muffled');
assert.equal(resolveAuscultation(pathology, {cvp: 20}, 'mitral', 'tamponade', 'normal').heart, 'normal');
assert.equal(resolveAuscultation(pathology, {cvp: 2}, 'mitral', 'ms_afib').atrialContraction, false);
assert.equal(resolveAuscultation({...pathology, ecgRhythm:'vfib'}, {cvp:2,heartRate:0}, 'mitral', 'vfib_arrest').heart, 'silent');
assert.equal(resolveAuscultation(pathology, {cvp:2,respiratoryRate:0}, 'trachea', 'vfib_arrest').lung, 'silent');
assert.equal(resolveAuscultation(pathology, {cvp:2}, 'mitral', 'ms_afib', 's4_gallop').atrialContraction, true);
const kernel = fs.readFileSync('src/simulator/engine/PhysiologyKernel.ts', 'utf8');
assert.match(kernel.slice(kernel.indexOf("id: 'ms_afib'"), kernel.indexOf("id: 'vfib_arrest'")), /heartSoundType: 'mitral_stenosis'/);
const ts = require('typescript');
const parsed = ts.createSourceFile('kernel.ts', kernel, ts.ScriptTarget.Latest, true);
let scenarioArray;
for (const statement of parsed.statements) if (ts.isVariableStatement(statement)) for (const d of statement.declarationList.declarations) if (d.name.getText(parsed) === 'SCENARIOS') scenarioArray = d.initializer.getText(parsed);
const scenarios = new Function('return (' + scenarioArray + ')')();
assert.equal(scenarios.length, 42);
for (const scenario of scenarios) for (const site of ['mitral','aortic','tricuspid','pulmonic','erb','lung_bases','lung_apices','trachea']) {
  const sound = resolveAuscultation(scenario.initialPathology, scenario.initialVitals, site, scenario.id);
  assert.ok(['silent','normal','s3_gallop','s4_gallop','mitral_stenosis','aortic_stenosis','mitral_regurg','tricuspid_regurg','aortic_regurg','friction_rub','tamponade_muffled'].includes(sound.heart));
  assert.ok(['silent','vesicular','bronchial','crackles','wheeze','stridor'].includes(sound.lung));
}
let currentContext;
globalThis.window = { AudioContext: function() { return currentContext; }, setInterval: () => 1, clearInterval: () => {} };
const results = [];
for (const mode of ['bell', 'diaphragm']) {
  for (const preset of ['normal','s3_gallop','s4_gallop','mitral_stenosis','aortic_stenosis','mitral_regurg','tricuspid_regurg','aortic_regurg','friction_rub','tamponade_muffled','vesicular','bronchial','crackles','wheeze','stridor','silent']) {
    currentContext = new webAudio.OfflineAudioContext(1, 22050 * 5, 22050);
    currentContext.resume = async () => {}; // Offline rendering has no hardware/autoplay state.
    const engine = new StethoscopeAudioEngine();
    await engine.initialize(); engine.setStethoscopeMode(mode);
    const pulmonary = ['vesicular','bronchial','crackles','wheeze','stridor','silent'].includes(preset);
    if (pulmonary && preset !== 'silent') { engine.sourceGroup = 'pulmonary'; engine.renderBreathCycle(0.1, 4, preset); }
    else if (!pulmonary) for (let t = 0.1; t < 4; t += 60/72) engine.renderCardiacBeat(t, 60/72, preset);
    const buffer = await currentContext.startRendering();
    const data = buffer.getChannelData(0);
    let power = 0, peak = 0;
    for (const value of data) { assert.ok(Number.isFinite(value)); power += value * value; peak = Math.max(peak, Math.abs(value)); }
    const rms = Math.sqrt(power/data.length);
    if (preset === 'silent') assert.equal(rms, 0); else assert.ok(rms > 0.00001, `${preset}/${mode} unexpectedly silent`);
    results.push({preset, mode, rms: +rms.toFixed(5), peak: +peak.toFixed(5)});
  }
}
// Inspect actual engine event routing instead of a duplicated DSP formula.
const engine = new StethoscopeAudioEngine(); engine.ctx = { currentTime: 0 }; engine.chestWallResonance = {}; engine.noiseBuffer = {};
let events = [];
for (const method of ['synthesizeValveTransient','synthesizeLeafletOverhead','synthesizeCrispSnap','synthesizeGallopThud','synthesizeOpeningSnap','synthesizeMitralRumble','synthesizePresystolicCrescendo','synthesizeAorticStenosisMurmur','synthesizeMitralRegurgMurmur','synthesizeAorticRegurgMurmur','synthesizePericardialScratch','playAirflowPhase','scheduleCrackleCluster','playStridorTone','playPolyphonicWheeze']) engine[method] = (...args) => events.push({method,args});
engine.atrialContraction = false; engine.renderCardiacBeat(1, 60/154, 'mitral_stenosis');
assert.ok(events.some(e => e.method === 'synthesizeMitralRumble'));
assert.ok(!events.some(e => e.method === 'synthesizePresystolicCrescendo'));
events=[]; engine.renderBreathCycle(1,1,'bronchial');
const phases=events.filter(e=>e.method==='playAirflowPhase');
assert.ok(phases[1].args[1] > phases[0].args[1]);
assert.ok(phases[1].args[0]+phases[1].args[1] <= 2);
let stopped=0; engine.activeSources.set({stop(){stopped++;},disconnect(){}},'pulmonary'); engine.stopAll();
events=[]; engine.renderCardiacBeat(1,1,'silent'); assert.equal(events.length,0);
assert.equal(stopped,1); assert.equal(engine.activeSources.size,0);
events=[]; engine.soundEvents=[]; engine.atrialContraction=true;
engine.renderCardiacBeat(1, 1, 's3_gallop');
assert.deepEqual(engine.soundEvents.map(e=>e.label), ['S1','S2','S3']);
const scheduledS3=events.find(e=>e.method==='synthesizeGallopThud');
assert.equal(engine.soundEvents[2].time, scheduledS3.args[0]);
events=[]; engine.soundEvents=[]; engine.renderCardiacBeat(1,1,'tricuspid_regurg');
assert.ok(events.some(e=>e.method==='synthesizeMitralRegurgMurmur'));
engine.stopAll(); assert.deepEqual(engine.soundEvents, []);
console.log(JSON.stringify({routing:'passed',timing:'passed',stop:'passed',rendered:results},null,2));
