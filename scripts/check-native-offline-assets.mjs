import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import {MRI_ANNOTATION_VOLUME_SHA} from '../mobile/src/simulator/radiologyAnnotations.ts';
import {ORGAN_CONNECTIONS} from '../src/simulator/data/organConnections.ts';
const root='mobile/android/app/src/main/assets/simulator';
const catalog=fs.readFileSync('mobile/src/simulator/anatomyCatalog.ts','utf8');
const record=JSON.parse(catalog.match(/export const ANATOMY_TARGETS[^=]*= ([^\n]+);/)[1]);
const all=new Map();let partCount=0;
for(const file of fs.readdirSync(root+'/models').filter(f=>f.endsWith('.json.gz'))){
 const model=file.slice(0,-8);
 const meta=JSON.parse(zlib.gunzipSync(fs.readFileSync(root+'/models/'+file)));
 const bytes=zlib.gunzipSync(fs.readFileSync(root+'/models/'+model+'.bin.gz'));
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
assert.equal(zlib.gunzipSync(fs.readFileSync(root+'/radiology/brain-t1.pack')).length,mri.dimensions.reduce((a,b)=>a*b,1));
const anatomy=fs.readFileSync('mobile/src/screens/SimulatorScreen.android.tsx','utf8');
assert.ok(!/react-native-webview|https:\/\/orbitmbbs/.test(anatomy),'Native screen cannot navigate to hosted simulator');
assert.ok(fs.existsSync('mobile/android/app/src/main/assets/pg/manifest.json'),'Offline PG manifest');
console.log('Offline source assets: '+partCount+' named meshes, '+registered+' registered connections, full MRI volume and native screen verified.');
