/** Build compact offline reference loops from the existing procedural DSP.
 * Only this build tool uses Web Audio; Android plays local Ogg files natively. */
import fs from 'node:fs';import crypto from 'node:crypto';import ts from '../mobile/node_modules/typescript/lib/typescript.js';import {chromium} from '../mobile/node_modules/playwright-core/index.mjs';import {spawnSync} from 'node:child_process';
const sourcePath='src/simulator/instruments/StethoscopeSynthesizer.ts',source=fs.readFileSync(sourcePath,'utf8');
const root=ts.createSourceFile(sourcePath,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS),edits=[];
// Unlock/resume apply to live AudioContext only. Preserve every DSP operation.
function visit(node){
 if(ts.isMethodDeclaration(node)&&node.name.getText(root)==='unlock'){edits.push([node.body.getStart(root),node.body.end,'{}']);return;}
 if(ts.isIfStatement(node)&&node.expression.getText(root)==="this.ctx.state === 'suspended'"){edits.push([node.getStart(root),node.end,'']);return;}
 ts.forEachChild(node,visit);
}visit(root);let adapted=source;for(const [a,b,text] of edits.sort((a,b)=>b[0]-a[0]))adapted=adapted.slice(0,a)+text+adapted.slice(b);
const js=ts.transpileModule(adapted.replace('export class StethoscopeAudioEngine','class StethoscopeAudioEngine'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/export \{\};?\s*$/,'');
const dir='public/clinical-reference/auscultation';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.ORBIT_CHROME,args:['--no-sandbox']});const page=await browser.newPage();const clips=[];
try{
 await page.addScriptTag({content:js+'\nwindow.SoundEngine=StethoscopeAudioEngine;'});
 if(!await page.evaluate(()=>typeof window.SoundEngine==='function'))throw Error('Offline DSP constructor did not load');
 const hearts=['normal','s3_gallop','s4_gallop','mitral_stenosis','aortic_stenosis','pulmonic_stenosis','vsd','hcm','pda','mitral_regurg','tricuspid_regurg','aortic_regurg','friction_rub','tamponade_muffled'];
 const lungs=['vesicular','bronchial','crackles','wheeze','stridor'];
 for(const mode of ['bell','diaphragm'])for(const group of ['cardiac','pulmonary']){
  const presets=group==='cardiac'?[...hearts,'mitral_stenosis_af']:lungs;
  const rates=group==='cardiac'?[30,60,90,120,150,180]:[6,12,18,24,30,36,42,48];
  for(const preset of presets)for(const rate of rates){
   const rendered=await page.evaluate(async ({mode,group,preset,rate})=>{
    let seed=731;const random=Math.random;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296;};
    try{
     const sampleRate=22050,period=60/rate,start=.05;
     const ctx=new OfflineAudioContext(1,Math.ceil((period*4+.5)*sampleRate),sampleRate),engine=new window.SoundEngine();engine.ctx=ctx;await engine.initialize();engine.setStethoscopeMode(mode);engine.atrialContraction=!preset.endsWith('_af');engine.sourceGroup=group;
     for(let beat=0;beat<4;beat++)if(group==='cardiac')engine.renderCardiacBeat(start+period*beat,period,preset.replace('_af',''));else engine.renderBreathCycle(start+period*beat,period,preset);
     const result=await ctx.startRendering(),data=result.getChannelData(0);const offset=Math.round((start+period*2)*sampleRate),count=Math.round(period*sampleRate),pcm=new Int16Array(count);let peak=0,energy=0;
     for(let i=0;i<count;i++){const v=Math.max(-1,Math.min(1,data[offset+i]));peak=Math.max(peak,Math.abs(v));energy+=v*v;pcm[i]=Math.round(v*32767);}
     let bytes='';const u=new Uint8Array(pcm.buffer);for(let i=0;i<u.length;i+=8192)bytes+=String.fromCharCode(...u.subarray(i,i+8192));
     return {pcm:btoa(bytes),peak,rms:Math.sqrt(energy/count),sampleRate,samples:count};
    }finally{Math.random=random;}
   },{mode,group,preset,rate});
   if(rendered.peak<.0001||!Number.isFinite(rendered.rms))throw Error('Silent/nonfinite DSP '+preset);
   const file=`${group}_${preset}_${mode}_${rate}.ogg`,raw='/tmp/orbit-reference.pcm';fs.writeFileSync(raw,Buffer.from(rendered.pcm,'base64'));
   const result=spawnSync('ffmpeg',['-y','-v','error','-f','s16le','-ar','22050','-ac','1','-i',raw,'-c:a','libvorbis','-q:a','3',dir+'/'+file]);if(result.status!==0)throw Error(result.error?.message||result.stderr?.toString()||'Audio encoder failed');
   const bytes=fs.readFileSync(dir+'/'+file);clips.push({group,preset,mode,rate,file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),peak:rendered.peak,rms:rendered.rms});
  }
 }
 const manifest={schema:1,source:sourcePath,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),sampleRate:22050,method:'Existing Web Audio DSP rendered offline; middle cycle after filter warm-up, mono PCM quantization and Ogg Vorbis encoding. Native tempo adjustment preserves pitch; references are synthetic educational sounds.',clips,bytes:clips.reduce((n,c)=>n+c.bytes,0)};
 fs.writeFileSync(dir+'/manifest.json',JSON.stringify(manifest,null,2));console.log(JSON.stringify({clips:clips.length,bytes:manifest.bytes,sourceSha256:manifest.sourceSha256}));
}finally{await browser.close();}
