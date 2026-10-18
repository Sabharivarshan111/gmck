/** Offline geometry and loader-name matching; native visual evidence is separate. */
import assert from 'node:assert/strict';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';import * as THREE from 'three';import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {restoreSourceNodeNames} from '../../src/simulator/data/anatomyRegions.ts';
import {HRA_ORGAN_MODELS,HRA_ORGAN_TARGETS,hraOrganMeshMatchesTarget} from '../../src/simulator/data/hraOrgans.ts';
import {HRA_HEART_MODEL_URL,HRA_HEART_TARGETS,hraHeartMeshMatchesTarget} from '../../src/simulator/data/hraHeart.ts';
import {ZANATOMY_REFERENCE_MODELS,ZANATOMY_REFERENCE_TARGETS,zAnatomyMeshMatchesTarget,zAnatomyReferenceRegistrationIssue,zAnatomyReferenceRegistrationNotice} from '../../src/simulator/data/zanatomyReferences.ts';
const models=new Map(),report={scope:'Static geometry and actual GLTFLoader matching; not per-piece visual or clinical certification',models:[],targets:[]};
for(const spec of [...HRA_ORGAN_MODELS,...ZANATOMY_REFERENCE_MODELS,{key:'hra-heart',url:HRA_HEART_MODEL_URL}]){
 const bytes=await readFile('public'+spec.url),gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');restoreSourceNodeNames(gltf.scene);gltf.scene.updateWorldMatrix(true,true);const meshes=[];let vertices=0,triangles=0;
 gltf.scene.traverse(mesh=>{if(!mesh.isMesh)return;const p=mesh.geometry.getAttribute('position'),idx=mesh.geometry.index;assert(p&&p.count>0,spec.key+' empty positions');
  for(let i=0;i<p.count;i++)assert(Number.isFinite(p.getX(i))&&Number.isFinite(p.getY(i))&&Number.isFinite(p.getZ(i)),spec.key+' nonfinite positions');
  if(idx)for(let i=0;i<idx.count;i++)assert(Number.isInteger(idx.getX(i))&&idx.getX(i)>=0&&idx.getX(i)<p.count,spec.key+' invalid index');
  const box=new THREE.Box3().setFromObject(mesh);assert(!box.isEmpty()&&box.min.toArray().concat(box.max.toArray()).every(Number.isFinite),spec.key+' invalid world bounds');assert(mesh.matrixWorld.elements.every(Number.isFinite));vertices+=p.count;triangles+=(idx?.count||p.count)/3;meshes.push({name:mesh.name});
 });assert(meshes.length>0);models.set(spec.key,meshes);report.models.push({key:spec.key,url:spec.url,sha256:createHash('sha256').update(bytes).digest('hex'),meshes:meshes.length,vertices,triangles});
}
for(const [family,targets,keys,match] of [['hra-organ',HRA_ORGAN_TARGETS,t=>t.modelKeys,hraOrganMeshMatchesTarget],['hra-heart',HRA_HEART_TARGETS,()=>['hra-heart'],hraHeartMeshMatchesTarget],['zanatomy',ZANATOMY_REFERENCE_TARGETS,t=>[t.modelKey],zAnatomyMeshMatchesTarget]])for(const t of targets){
 const matched=keys(t).flatMap(key=>models.get(key).filter(m=>match(m.name,t.id)).map(m=>({model:key,...m}))),registered=matched.filter(m=>!zAnatomyReferenceRegistrationIssue(m.model,m.name)),omitted=matched.filter(m=>zAnatomyReferenceRegistrationIssue(m.model,m.name));
 if(t.kind==='schematic')assert.equal(matched.length,0,'Schematic must remain distinct from source meshes');else if(!registered.length){assert.equal(t.id,'za_brain_corpus_callosum','Unexplained source gap: '+t.id);assert(zAnatomyReferenceRegistrationNotice(t.id));}
 report.targets.push({id:t.id,family,kind:t.kind||'source',matched:matched.map(m=>m.name),registeredCount:registered.length,omitted:omitted.map(m=>m.name),notice:family==='zanatomy'?zAnatomyReferenceRegistrationNotice(t.id):null});
}
assert.equal(report.models.length,32);assert.equal(report.targets.length,155);report.status='PASSED';await mkdir('docs/qa/anatomy-audit-20261018',{recursive:true});await writeFile('docs/qa/anatomy-audit-20261018/reference-source-integrity.json',JSON.stringify(report,null,2));console.log('32 reference files/155 target names passed; known malformed brain sources remain quarantined and labelled.');
