import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {ZANATOMY_REFERENCE_TARGETS,zAnatomyReferenceRegistrationNotice} from '../../src/simulator/data/zanatomyReferences.ts';
async function walk(p){const out=[];for(const e of await readdir(p,{withFileTypes:true})){const f=resolve(p,e.name);if(e.isDirectory())out.push(...await walk(f));else out.push(f);}return out;}
const summary=[];
for(const [folder,origin] of [['rebuilt-brain-canonical','http://127.0.0.1:4173'],['rebuilt-brain-vercel','https://orbitmbbs-2df8l5j36-sabharivarshan111s-projects.vercel.app']]){
 const files=await walk('evidence/'+folder),reports=files.filter(f=>f.endsWith('/PASSED.json'));assert.equal(reports.length,1);const base=dirname(reports[0]),passed=JSON.parse(await readFile(reports[0],'utf8')),r=JSON.parse(await readFile(resolve(base,'actual-android-exhaustive.json'),'utf8'));assert.equal(passed.passed,true);assert.equal(passed.suite,'brain-registration');assert.equal(r.referenceOrigin,origin);assert.deepEqual(r.errors,[]);assert.deepEqual(r.failures,[]);assert.equal(passed.checks,ZANATOMY_REFERENCE_TARGETS.length*2);assert.equal(r.checks.length,passed.checks);
 for(const reference of [false,true])for(const t of ZANATOMY_REFERENCE_TARGETS){const matches=r.checks.filter(c=>c.id===t.id&&c.reference===reference);assert.equal(matches.length,1);const c=matches[0];assert.equal(c.passed,true);assert.equal(c.type,'reference-registration');assert.equal(c.notice,zAnatomyReferenceRegistrationNotice(t.id));assert.equal(c.state.isolated,t.id);assert.equal(new URL(c.state.url).origin,reference?origin:'https://appassets.androidplatform.net');
  if(t.modelKey==='brain_reference'){assert(c.bounds.count>100);assert(c.bounds.left>.02&&c.bounds.right<.98&&c.bounds.bottom>.12&&c.bounds.top<.88,'Brain cannot be offscreen');}
  const image=await readFile(resolve(base,(reference?'source-reference-':'android-')+t.id+'.png'));assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert(image.length>10000,'Screenshot cannot be empty');
 }
 summary.push({folder,origin,checks:r.checks.length,targets:ZANATOMY_REFERENCE_TARGETS.length,brainTargets:ZANATOMY_REFERENCE_TARGETS.filter(t=>t.modelKey==='brain_reference').length});
}
await writeFile('release-assets/rebuilt-reference-coverage.json',JSON.stringify({passed:true,source:'e7cafadc843ac353dc45dc9b139a445c7d5e4f08',summary},null,2));console.log(JSON.stringify(summary));
