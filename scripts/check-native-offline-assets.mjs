import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import {MRI_ANNOTATION_VOLUME_SHA} from '../mobile/src/simulator/radiologyAnnotations.ts';
import {ORGAN_CONNECTIONS} from '../src/simulator/data/organConnections.ts';
const root='mobile/android/app/src/main/assets/simulator';
const catalog=fs.readFileSync('mobile/src/simulator/anatomyCatalog.ts','utf8');
const record=JSON.parse(catalog.match(/export const ANATOMY_TARGETS[^=]*= ([^\n]+);/)[1]);
const all=new Map();let partCount=0;
for(const file of fs.readdirSync(root+'/models').filter(f=>f.endsWith('.meta.pack'))){
 const model=file.slice(0,-10);
 const meta=JSON.parse(zlib.gunzipSync(fs.readFileSync(root+'/models/'+file)));
 const bytes=zlib.gunzipSync(fs.readFileSync(root+'/models/'+model+'.mesh.pack'));
 assert.equal(bytes.readUInt32BE(0),0x4f524231);
 assert.equal(bytes.readUInt32BE(4),meta.length);
 let offset=8;const ids=new Set();
 for(const part of meta){
  const n=bytes.readUInt32BE(offset),count=bytes.readUInt32BE(offset+4);offset+=8;
  assert.ok(n>0&&n<=65535,'Vertex count '+model+' '+part.id+' '+n);assert.ok(count>=3&&count%3===0,'Triangle count '+model+' '+part.id+' '+count);
  offset+=n*9;
  for(let i=0;i<count;i++)assert.ok(bytes.readUInt16BE(offset+i*2)<n);
  offset+=count*2;
  ids.add(part.id);partCount++;
 }
 assert.equal(offset,bytes.length,'Complete model payload '+model);
 all.set(model,ids);
}
for(const [name,target] of Object.entries(record)){
 assert.ok(all.has(target.model),'Target model '+name);
 for(const id of target.ids)assert.ok(all.get(target.model).has(id),'Target part '+name+' '+id);
}
let registered=0;
for(const connections of Object.values(ORGAN_CONNECTIONS))for(const c of connections)if(c.targetId){
 const target=record[c.id];assert.ok(target?.ids.length,'Registered view missing '+c.id);registered++;
}
const mri=JSON.parse(fs.readFileSync(root+'/radiology/brain-t1.json'));assert.equal(mri.volumeSha256,MRI_ANNOTATION_VOLUME_SHA,'MRI labels require the reviewed source volume');
const mriBytes=zlib.gunzipSync(fs.readFileSync(root+'/radiology/brain-t1.pack'));assert.equal(mriBytes.length,mri.dimensions.reduce((a,b)=>a*b,1));assert.equal(createHash('sha256').update(mriBytes).digest('hex'),MRI_ANNOTATION_VOLUME_SHA,'Actual MRI pixels must match the reviewed volume');
const anatomy=fs.readFileSync('mobile/src/screens/SimulatorScreen.android.tsx','utf8');
assert.ok(!/react-native-webview|https:\/\/orbitmbbs/.test(anatomy),'Native screen cannot navigate to hosted simulator');
assert.ok(fs.existsSync('mobile/android/app/src/main/assets/pg/manifest.json'),'Offline PG manifest');
const references=JSON.parse(fs.readFileSync(root+'/pocus/native-references.json'));
assert.equal(references.references.length,2,'Both acquired cardiac ultrasound loops');
for(const reference of references.references){
 const source=fs.readFileSync(root+'/pocus/'+reference.source),movie=fs.readFileSync(root+'/pocus/'+reference.movie);
 assert.equal(createHash('sha256').update(source).digest('hex'),reference.sourceSha256);
 assert.equal(createHash('sha256').update(movie).digest('hex'),reference.movieSha256);
 assert.ok(fs.existsSync(root+'/pocus/'+reference.poster));
}
const audio=JSON.parse(fs.readFileSync(root+'/auscultation/manifest.json'));
assert.equal(audio.sourceSha256,createHash('sha256').update(fs.readFileSync(audio.source)).digest('hex'),'Sound clips must match shared DSP source');
assert.equal(audio.clips.length,212,'All heart/lung presets, filter modes and reference rates');
for(const clip of audio.clips){const bytes=fs.readFileSync(root+'/auscultation/'+clip.file);assert.equal(bytes.length,clip.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.sha256,'Audio checksum '+clip.file);assert.ok(clip.rms>0&&clip.peak<=1);}
console.log('Offline audio: '+audio.clips.length+' source-derived loops, '+audio.bytes+' bytes; source and every encoded clip hash verified.');
console.log('Offline source assets: '+partCount+' named meshes, '+registered+' registered connections, full MRI volume and native screen verified.');
