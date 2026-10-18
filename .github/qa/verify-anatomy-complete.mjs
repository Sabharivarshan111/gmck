/** Reconcile complete original/recovery artifacts for one actual installed APK. */
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import assert from 'node:assert/strict';
import {ORGAN_CONNECTIONS} from '../../src/simulator/data/organConnections.ts';
import {HRA_ORGAN_TARGETS} from '../../src/simulator/data/hraOrgans.ts';
import {HRA_HEART_TARGETS} from '../../src/simulator/data/hraHeart.ts';
import {ZANATOMY_REFERENCE_TARGETS} from '../../src/simulator/data/zanatomyReferences.ts';
const [root,source,output]=process.argv.slice(2);
assert(root&&/^[a-f0-9]{40}$/.test(source||'')&&output,'Require artifact directory, actual APK source and output report');
async function reports(dir){const found=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())found.push(...await reports(p));else if(e.name==='actual-android-exhaustive.json')found.push(p);}return found;}
const parts=new Map(),excluded=[];
for(const path of (await reports(resolve(root))).sort()){
 const r=JSON.parse(await readFile(path,'utf8'));
 if(r.candidateSource!==source||r.scope!=='full626'||r.status!=='PASSED'){excluded.push({path,status:r.status,scope:r.scope,source:r.candidateSource});continue;}
 assert.deepEqual(r.errors,[]);assert.deepEqual(r.failures,[]);assert.equal(r.partition.count,32);
 assert(Number.isInteger(r.partition.index)&&r.partition.index>=0&&r.partition.index<32);
 // A complete recovery can replace a failed original; no partial results count.
 parts.set(r.partition.index,{path,r});
}
assert.equal(parts.size,32,'Every full partition needs a complete successful artifact');
const first=parts.values().next().value;
const manifest=JSON.parse(await readFile(join(dirname(first.path),'anatomy-coverage.json'),'utf8'));
const expected=new Set([...Object.values(ORGAN_CONNECTIONS).flat().map(c=>c.id),...[...HRA_ORGAN_TARGETS,...HRA_HEART_TARGETS,...ZANATOMY_REFERENCE_TARGETS].map(t=>t.id),...['layer-glass','layer-vascular','layer-skeletal','layer-skin','layer-viscera',...manifest.organs.map(o=>o.id)].map(id=>'overview:'+id)]);
assert.equal(expected.size,626);
const observed=new Map();
async function png(path){const b=await readFile(path);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a',path+' must be a PNG');assert(b.readUInt32BE(16)>300&&b.readUInt32BE(20)>600,path+' must be a mobile capture');}
for(const [part,{path,r}] of parts){const dir=dirname(path);for(const c of r.checks){
 assert.equal(c.passed,true);assert(expected.has(c.id),'Unexpected target '+c.id);
 const prior=observed.get(c.id)||[];assert(prior.every(p=>p.part===part),'Target duplicated across partitions: '+c.id);prior.push({part,type:c.type,reference:c.reference,viewport:c.state?.viewport});observed.set(c.id,prior);
 if(c.type==='reference-registration'){assert.equal(new URL(c.state.url).hostname,c.reference?'127.0.0.1':'appassets.androidplatform.net');}
 else {assert(c.native&&c.vercel,'Both actual surfaces required');assert.equal(new URL(c.native.url).hostname,'appassets.androidplatform.net');assert.equal(new URL(c.vercel.url).hostname,'127.0.0.1');assert.deepEqual(c.native.viewport,c.vercel.viewport);}
 }
 for(const id of new Set(r.checks.map(c=>c.id))){const name=id.replace(/^overview:/,'overview-');await png(join(dir,'android-'+name+'.png'));await png(join(dir,'source-reference-'+name+'.png'));}
}
for(const [id,rows] of observed){if(rows[0].type==='reference-registration'){assert.deepEqual(rows.map(r=>r.reference).sort(),[false,true],'Source needs both platforms: '+id);assert.deepEqual(rows[0].viewport,rows[1].viewport);}else assert.equal(rows.length,1,'Duplicate target '+id);}
assert.deepEqual([...observed.keys()].sort(),[...expected].sort(),'All626 actual targets required');
const report={passed:true,apkSource:source,qaSource:process.env.GITHUB_SHA,targets:observed.size,successfulPartitions:parts.size,artifacts:[...parts.values()].map(({path,r})=>({path,partition:r.partition.index,qaSource:r.qaSource||source,checks:r.checks.length})),excluded,scope:'Automated Android UI/render/source-disclosure coverage; not independent clinical certification or every physical device'};
await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log('VERIFIED:626/626 targets,32 complete partitions, exact APK source '+source);
