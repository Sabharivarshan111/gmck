import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const mobile=resolve(fileURLToPath(new URL('..',import.meta.url)));
const web=readFileSync(join(mobile,'../src/simulator/instruments/Ecg12LeadCanvas.tsx'),'utf8');
const reference=readFileSync(join(mobile,'src/lib/nativeEcgReference.ts'),'utf8');
const nativeUI=readFileSync(join(mobile,'src/components/NativeEcgTwelveLead.tsx'),'utf8');
const screen=readFileSync(join(mobile,'src/screens/SimulatorScreen.tsx'),'utf8');
const readConst=name=>{
  const rx=new RegExp('export const '+name+':[^=]*= (\\[[\\s\\S]*?\\]);');
  const match=reference.match(rx);
  assert.ok(match,'Missing '+name);
  return JSON.parse(match[1]);
};
const segments=readConst('NATIVE_ECG_SEGMENTS'),leads=readConst('NATIVE_ECG_LEADS');
assert.equal(leads.length,12);
assert.deepEqual(leads.map(l=>l.id),['I','II','III','aVR','aVL','aVF','V1','V2','V3','V4','V5','V6']);
assert.equal(segments.length,6);
for(const item of segments){
  for(const key of ['bandColor','name','normalDurationMs','physioOrigin','vectorExplanation','leadsAnalysis','clinicalPearls']){
    assert.ok(web.includes(item[key]),item.id+' '+key+' no longer agrees with Vercel ECG');
  }
}
for(const item of leads)assert.ok(web.includes(`leadKey: '${item.id}'`),'Web ECG missing '+item.id);
for(const key of ['native-ecg-paper','native-ecg-tour','native-ecg-group-','native-ecg-capture','native-ecg-teaching-segment'])
  assert.ok(nativeUI.includes(key),key+' missing');
assert.ok(screen.includes("<NativeEcgTwelveLead"),'ECG still not routed natively');

const dir=await mkdtemp(join(tmpdir(),'native-ecg-'));
try{
  const outfile=join(dir,'ecg.mjs');
  await build({entryPoints:[join(mobile,'src/lib/nativeEcgWaveform.ts')],bundle:true,platform:'node',format:'esm',outfile,logLevel:'silent'});
  const {ecgDeflection,nativeEcgTracePath,leadById}=await import(pathToFileURL(outfile).href);
  const ii=leadById('II');
  const cfg={rhythm:'sinus',heartRate:72};
  const path=nativeEcgTracePath(ii,cfg,0,64,420);
  assert.ok(path.length>1200 && path.startsWith('M '),'No native ECG path generated');
  for(const lead of leads)for(const rhythm of ['sinus','stemi_inferior','vfib','afib','hyperkalemia']){
    for(const x of [0,8,20,41,62,85,108,135,180,240]){
      const amplitude=ecgDeflection(x,lead,{rhythm,heartRate:80});
      assert.ok(Number.isFinite(amplitude),'Invalid '+rhythm+' '+lead.id+' '+x);
    }
  }
  const iiNormal=ecgDeflection(48,ii,{rhythm:'sinus',heartRate:75});
  const iiSTEMI=ecgDeflection(48,ii,{rhythm:'stemi_inferior',heartRate:75});
  assert.notEqual(iiNormal,iiSTEMI,'STEMI morphology must be different');
  const v1=leadById('V1'),v5=leadById('V5');
  assert.ok(v1.s>v1.r && v5.r>v5.s,'Chest lead R wave progression lost');
  console.log('PASS: Native offline 12-lead ECG: 12 leads, 6 web teaching segments, 5 rhythm types, waveform and screenshot controls.');
}finally{await rm(dir,{recursive:true,force:true});}
