import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ORGAN_CONNECTIONS as catalog, getOrganConnection } from '../src/simulator/data/organConnections.ts';
import { ORGAN_ANATOMY_DATABASE as db } from '../src/simulator/data/organAnatomyData.ts';
import { describeAtlasTarget } from '../src/simulator/data/atlasResolver.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json','utf8'));
const byId=new Map(atlas.parts.map(p=>[p.id,p]));
assert.deepEqual(Object.keys(catalog),Object.keys(db));
const ids=new Set();let registered=0,schematic=0;
for(const [owner,links] of Object.entries(catalog)){
 for(const kind of ['relation','arterial','venous'])assert(links.some(c=>c.kind===kind),owner+' '+kind);
 for(const c of links){
  assert.equal(c.owner,owner);assert(!ids.has(c.id));ids.add(c.id);assert.equal(getOrganConnection(c.id),c);
  if(!c.targetId){assert.equal(c.partIds.length,0);schematic++;continue;}
  registered++;assert.equal(describeAtlasTarget(c.targetId,atlas).ids.size,c.partIds.length);
  for(const id of c.partIds){const p=byId.get(id);assert(p,`${c.label}: ${id}`);if(c.kind!=='relation')assert.equal(p.system,c.kind);}
 }
}
for(const [owner,label] of [['heart','Thoracic Duct'],['vagus_nerve','Accessory Nerve (CN XI)'],['celiac_trunk','Celiac Ganglion'],['heart','Interventricular Septum'],['kidney','Renal pelvis']]){
 const c=catalog[owner].find(c=>c.label===label);assert(c,`${owner} ${label}`);assert.equal(c.targetId,null,label+' must not select a different organ');
}
for(const c of catalog.heart)for(const id of c.partIds)assert(!/colon/i.test(byId.get(id).name),'coronary branches must not resolve to colonic marginal arteries');
for(const kind of ['arterial','venous'])assert(catalog.kidney.some(c=>c.kind===kind&&c.partIds.length));
console.log(`${Object.keys(catalog).length} dossiers / ${ids.size} connections: ${registered} registered atlas views, ${schematic} labelled schematics. Source ids and wrong-organ regression checks passed.`);

const view=fs.readFileSync('src/simulator/view/AnatomicalBody3D.tsx','utf8');
assert(view.includes('mat.customProgramCacheKey = () => `orbit-atlas-v2-${sys.id}`'),'system-specific GLSL must have distinct shader cache keys');
assert(view.includes('partSurfaceAnchorsRef.current.set(p.id'),'leaders must anchor to source surface vertices');
