import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
const root=resolve(process.argv[2]||'evidence/anatomy-partitions');
async function walk(p){const out=[];for(const e of await readdir(p,{withFileTypes:true})){const f=resolve(p,e.name);if(e.isDirectory())out.push(...await walk(f));else out.push(f);}return out;}
const files=await walk(root),reports=files.filter(f=>f.endsWith('/PASSED.json'));
assert.equal(reports.length,6,'Exactly six completed partition reports are required');
const text=await readFile('src/simulator/data/organConnections.ts','utf8');
const connections=JSON.parse(text.slice(text.indexOf(' = {')+3,text.indexOf(';\nconst CONNECTION_BY_ID')));
const seen=new Set(),byGroup=new Map(),summary=[];
for(const file of reports){const base=dirname(file),passed=JSON.parse(await readFile(file,'utf8')),report=JSON.parse(await readFile(resolve(base,'actual-android-exhaustive.json'),'utf8'));assert.equal(passed.passed,true);assert(['anatomy-2','anatomy-4'].includes(passed.suite));assert.equal(passed.partition.count,3);assert([0,1,2].includes(passed.partition.index));const key=passed.suite+':'+passed.partition.index;assert(!seen.has(key),'Duplicate partition '+key);seen.add(key);assert.equal(report.suite,passed.suite);assert.deepEqual(report.partition,passed.partition);assert.deepEqual(report.errors,[]);assert.deepEqual(report.failures,[]);assert.equal(passed.checks,report.checks.length);
 const checks=byGroup.get(passed.suite)||[];checks.push(...report.checks);byGroup.set(passed.suite,checks);
 for(const check of report.checks){if(check.type==='registered-view'){assert.equal(check.passed,true);assert.equal(check.native.isolated,check.id);assert.equal(check.vercel.isolated,check.id);for(const state of [check.native,check.vercel])assert(state.tips.length>0&&state.tips.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));for(const surface of ['android','vercel'])assert(files.includes(resolve(base,surface+'-'+check.id+'.png')),'Missing raw screenshot '+check.id);}else if(check.type==='explicit-schematic'){assert.equal(check.passed,true);}else if(check.type==='overview'){assert.equal(check.actualAndroidAndMobileChromiumVercel.length,2);for(const surface of ['android','vercel'])assert(files.includes(resolve(base,surface+'-overview-'+check.id+'.png')));}else assert.fail('Unexpected check type '+check.type);}
 summary.push({suite:passed.suite,partition:passed.partition.index,checks:passed.checks});
}
for(const group of [2,4]){const suite='anatomy-'+group,checks=byGroup.get(suite),owners=Object.keys(connections).filter((_,i)=>i%8===group),expected=owners.flatMap(o=>connections[o]),actual=checks.filter(c=>c.type!=='overview');assert.deepEqual(actual.map(c=>c.id).sort(),expected.map(c=>c.id).sort(),'All source connections must appear once across partitions for '+suite);
 for(const c of expected){const hit=actual.find(x=>x.id===c.id);assert.equal(hit.owner,c.owner);assert.equal(hit.type,c.targetId?'registered-view':'explicit-schematic');if(c.targetId)for(const state of [hit.native,hit.vercel]){assert.equal(state.id,c.id);assert.equal(state.label,c.label);assert.deepEqual(state.sourcePartIds,c.partIds);}}
 const coverage=JSON.parse(await readFile(files.find(f=>f.endsWith('/anatomy-coverage.json')),'utf8'));const views=['whole-body','vessels','skeleton',...coverage.organs.map(o=>o.id)].filter((_,i)=>i%8===group);assert.deepEqual(checks.filter(c=>c.type==='overview').map(c=>c.id).sort(),views.sort(),'All overview captures must appear once for '+suite);
}
const output={passed:true,source:'97ee4579b4b2a6230c06f7616b7486c5be4f51d4',partitionCount:6,summary,totalConnectionChecks:[...byGroup.values()].flat().filter(c=>c.type!=='overview').length,claims:'Only groups 2 and 4; remaining scope is qualified separately'};
assert.equal(output.totalConnectionChecks,140);await writeFile(process.argv[3]||'release-assets/anatomy-partition-coverage.json',JSON.stringify(output,null,2));console.log(JSON.stringify(output));
