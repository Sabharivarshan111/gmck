import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { resolveEyeExam } from '../src/simulator/instruments/eye/eyeExamModel.ts';
const normal={pupilLeft:4,pupilRight:4,pupilReactLeft:true,pupilReactRight:true};
const start={finding:'normal',affected:'right',gaze:{x:0,y:0},light:'none',cotton:null,liftLids:false,action:'rest'};
const run=(changes={},pathology=normal)=>resolveEyeExam({...start,...changes},pathology);
let cases=0;const check=(name,fn)=>{fn();cases++;};
for(const side of ['right','left']) {
 const other=side==='right'?'left':'right',outward=side==='right'?-1:1;
 check(`${side} normal direct and consensual`,()=>{const r=run({light:side});assert.equal(r[side].pupil,2.2);assert.equal(r[other].pupil,2.2);});
 check(`${side} afferent loss is bilateral relative dilation`,()=>{const weak=run({finding:'rapd',affected:side,light:side});const strong=run({finding:'rapd',affected:side,light:other});for(const eye of [side,other])assert.ok(weak[eye].pupil>strong[eye].pupil);assert.equal(weak.right.pupil,weak.left.pupil);assert.equal(run({finding:'rapd',affected:side}).right.pupil,4);});
 check(`${side} III efferent failure preserves fellow response`,()=>{for(const light of [side,other]){const r=run({finding:'iii',affected:side,light});assert.equal(r[side].pupil,6.5);assert.equal(r[other].pupil,2.2);assert.ok(r[side].x*outward>0&&r[side].y>0);assert.ok(r[side].ptosis>.8);assert.equal(r[side].blink,0);}});
 check(`${side} III pupil spared`,()=>{const r=run({finding:'iii_spared',affected:side,light:side});assert.equal(r[side].pupil,2.2);assert.ok(r[side].ptosis>.8);});
 check(`${side} lid lifting changes lid without curing III`,()=>{const r=run({finding:'iii',affected:side,liftLids:true,light:side});assert.equal(r[side].ptosis,0);assert.equal(r[side].pupil,6.5);assert.ok(r[side].x*outward>0);});
 check(`${side} VI abduction blocked and adduction preserved`,()=>{let r=run({finding:'vi',affected:side,gaze:{x:outward,y:0}});assert.ok(r[side].x*outward<=0);assert.equal(r[other].x,outward);r=run({finding:'vi',affected:side,gaze:{x:-outward,y:0}});assert.equal(r[side].x,-outward);});
 check(`${side} IV depression in adduction`,()=>{const r=run({finding:'iv',affected:side,gaze:{x:-outward*.8,y:.8}});assert.ok(r[side].y<0);assert.equal(r[other].y,.8);});
 check(`${side} V1 and VII reflex limbs differ`,()=>{let r=run({finding:'v1',affected:side,cotton:side});assert.equal(r.right.blink,0);assert.equal(r.left.blink,0);r=run({finding:'v1',affected:side,cotton:other});assert.equal(r.right.blink,1);assert.equal(r.left.blink,1);for(const cotton of [side,other]){r=run({finding:'vii',affected:side,cotton});assert.equal(r[side].blink,0);assert.equal(r[other].blink,1);}});
 check(`${side} peripheral VII upper and lower facial weakness`,()=>{for(const [action,key] of [['close','blink'],['brows','brow'],['smile','smile']]){const r=run({finding:'vii',affected:side,action});assert.equal(r[side][key],0);assert.ok(r[other][key]>0);}});
 check(`${side} Horner retains reflex and greater dark anisocoria`,()=>{const dark=run({finding:'horner',affected:side});const lit=run({finding:'horner',affected:side,light:other});assert.ok(dark[side].ptosis>0&&dark[side].ptosis<.5);assert.ok(lit[side].pupil<dark[side].pupil);assert.ok(dark[other].pupil-dark[side].pupil>lit[other].pupil-lit[side].pupil);});
}
check('case sizes and efferent flags preserved',()=>{const r=run({finding:'case',light:'left'},{...normal,pupilRight:7,pupilReactRight:false,pupilLeft:1});assert.equal(r.right.pupil,7);assert.equal(r.left.pupil,.55);});
check('normal selection clears case pupil abnormality',()=>{const r=run({}, {...normal,pupilLeft:7,pupilRight:1,pupilReactRight:false});assert.equal(r.left.pupil,4);assert.equal(r.right.pupil,4);});
const base='public/models/eye-exam/';const manifest=JSON.parse(fs.readFileSync(base+'sources.json','utf8'));
for(const [file,info] of Object.entries(manifest.files)){const b=fs.readFileSync(base+file);assert.equal(b.length,info.bytes);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),info.sha256);}
const b=fs.readFileSync(base+'reference-head.glb');assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(8),b.length);const d=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
const head=d.meshes.find(m=>m.extras?.targetNames);assert.ok(head);const names=head.extras.targetNames;
for(const key of ['Eyes_Closed_Left','Eyes_Closed_Right','Upper_Lid_Left','Upper_Lid_Right','Mouth_Large_Opened'])assert.ok(names.includes(key));
assert.ok(head.primitives.every(p=>p.targets.length===names.length));assert.ok(head.primitives.reduce((n,p)=>n+d.accessors[p.attributes.POSITION].count,0)>10000);
assert.ok(b.length<3_200_000,'keep the reference head within the mobile asset budget');
console.log(`${cases} clinical eye behaviours and the real 3D mesh/morph/texture integrity passed.`);
