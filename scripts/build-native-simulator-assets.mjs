/** Source-derived offline anatomy. No geometry, question, or named part is invented. */
import fs from 'node:fs';import path from 'node:path';import zlib from 'node:zlib';import crypto from 'node:crypto';
import {MeshoptSimplifier} from 'meshoptimizer';import {Matrix4,Vector3,Quaternion} from 'three';
import {correctPartSystem,resolveAtlasElementIds} from '../src/simulator/data/atlasResolver.ts';
import {ORGAN_ANATOMY_DATABASE} from '../src/simulator/data/organAnatomyData.ts';
import {ORGAN_CONNECTIONS} from '../src/simulator/data/organConnections.ts';
import {HRA_ORGAN_MODELS,HRA_ORGAN_TARGETS,hraOrganMeshMatchesTarget} from '../src/simulator/data/hraOrgans.ts';
import {ZANATOMY_REFERENCE_MODELS,ZANATOMY_REFERENCE_TARGETS,zAnatomyMeshMatchesTarget} from '../src/simulator/data/zanatomyReferences.ts';
import {HRA_HEART_MODEL_URL,HRA_HEART_TARGETS,hraHeartMeshMatchesTarget} from '../src/simulator/data/hraHeart.ts';
import {peripheralNerveKeyForMeshName,peripheralNerveRegistrationIssue} from '../src/simulator/data/peripheralNerves.ts';
await MeshoptSimplifier.ready;
const out='mobile/android/app/src/main/assets/simulator';fs.mkdirSync(out+'/models',{recursive:true});
const maxError=Number(process.env.NATIVE_ANATOMY_ERROR||.0008),allParts=[],models={},targets={},references=[];
function writeModel(key,parts){
 const buffers=[];let sourceTriangles=0,triangles=0;
 const metadata=parts.map(p=>{
  const {positions,normals,indices}=p;sourceTriangles+=indices.length/3;
  const target=Math.min(indices.length,Math.max(36,Math.round(indices.length*.12/3)*3));
  const scale=MeshoptSimplifier.getScale(positions,3);
  const limit=p.source==='BodyParts3D'?maxError:Math.min(maxError,scale*.001);
  const [simple,error]=MeshoptSimplifier.simplify(indices,positions,3,target,limit,['ErrorAbsolute']);
  const vertices=[...new Set(simple)],remap=new Map(vertices.map((v,i)=>[v,i]));
  if(vertices.length>65535)throw Error('Mesh index limit '+p.id);
  const header=Buffer.alloc(8);header.writeUInt32BE(vertices.length);header.writeUInt32BE(simple.length,4);
  const verts=Buffer.alloc(vertices.length*9);
  vertices.forEach((v,j)=>{for(let k=0;k<3;k++){
   const lo=p.bounds[0][k],span=p.bounds[1][k]-lo;
   const q=span?Math.round((positions[v*3+k]-lo)/span*65535):0;
   verts.writeUInt16BE(Math.max(0,Math.min(65535,q)),j*9+k*2);
   verts.writeInt8(Math.max(-127,Math.min(127,Math.round(normals[v*3+k]*127))),j*9+6+k);
  }});
  const idx=Buffer.alloc(simple.length*2);simple.forEach((v,i)=>idx.writeUInt16BE(remap.get(v),i*2));
  buffers.push(header,verts,idx);triangles+=simple.length/3;
  return {id:p.id,name:p.name,system:p.system,bounds:p.bounds,source:p.source,model:key,triangles:simple.length/3,error};
 });
 const magic=Buffer.alloc(8);magic.write('ORB1');magic.writeUInt32BE(metadata.length,4);
 const bytes=zlib.gzipSync(Buffer.concat([magic,...buffers]),{level:9});
 fs.writeFileSync(out+'/models/'+key+'.bin.gz',bytes);
 fs.writeFileSync(out+'/models/'+key+'.json.gz',zlib.gzipSync(JSON.stringify(metadata),{level:9}));
 allParts.push(...metadata);models[key]={parts:metadata.length,sourceTriangles,triangles,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
 console.log(key+': '+metadata.length+' parts / '+triangles+' triangles / '+bytes.length+' bytes');return metadata;
}
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json','utf8'));atlas.parts=atlas.parts.map(correctPartSystem);
const chunks=atlas.chunks.map(c=>zlib.gunzipSync(fs.readFileSync('public'+c.gzip)));
writeModel('atlas',atlas.parts.map(p=>{
 const b=chunks[p.chunk],positions=new Float32Array(p.vertexCount*3),normals=new Float32Array(p.vertexCount*3),indices=new Uint32Array(p.indexCount);
 for(let i=0;i<positions.length;i++){positions[i]=b.readFloatLE(p.positions+i*4);normals[i]=b.readInt16LE(p.normals+i*2)/32767;}
 for(let i=0;i<indices.length;i++)indices[i]=b.readUInt32LE(p.indices+i*4);
 return {...p,positions,normals,indices,source:'BodyParts3D'};
}));
for(const id of Object.keys(ORGAN_ANATOMY_DATABASE))targets[id]={model:'atlas',ids:[...resolveAtlasElementIds(id,atlas)]};
for(const links of Object.values(ORGAN_CONNECTIONS))for(const c of links)if(c.targetId)targets[c.id]={model:'atlas',ids:c.partIds};
targets.connection_412.ids=[...targets.connection_412.ids,'FJ3078','FJ2562','FJ3420','FJ3499','FJ3544','FJ3640'];
function glbParts(url,key,source,organ){
 const bytes=fs.readFileSync('public'+url);if(bytes.readUInt32LE(0)!==0x46546c67)throw Error('Not GLB '+url);
 let gltf,bin;for(let at=12;at<bytes.length;){const n=bytes.readUInt32LE(at),kind=bytes.readUInt32LE(at+4);const data=bytes.subarray(at+8,at+8+n);if(kind===0x4e4f534a)gltf=JSON.parse(data.toString());if(kind===0x004e4942)bin=data;at+=8+n;}
 function read(index){const a=gltf.accessors[index],v=gltf.bufferViews[a.bufferView];if(a.sparse)throw Error('Sparse accessor unsupported '+url);const sizes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},readers={5120:'readInt8',5121:'readUInt8',5122:'readInt16LE',5123:'readUInt16LE',5125:'readUInt32LE',5126:'readFloatLE'},arity={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],step=v.byteStride||arity*sizes[a.componentType],start=(v.byteOffset||0)+(a.byteOffset||0);const values=[];for(let i=0;i<a.count;i++)for(let c=0;c<arity;c++){let n=bin[readers[a.componentType]](start+i*step+c*sizes[a.componentType]);if(a.normalized)n/=a.componentType===5122?32767:a.componentType===5120?127:255;values.push(n);}return values;}
 const parents=new Set();gltf.nodes.forEach(n=>(n.children||[]).forEach(i=>parents.add(i)));const parts=[];
 function walk(i,parent){const n=gltf.nodes[i],local=n.matrix?new Matrix4().fromArray(n.matrix):new Matrix4().compose(new Vector3(...(n.translation||[0,0,0])),new Quaternion(...(n.rotation||[0,0,0,1])),new Vector3(...(n.scale||[1,1,1]))),world=parent.clone().multiply(local);
  if(n.mesh!==undefined){const m=gltf.meshes[n.mesh];m.primitives.forEach((p,pi)=>{
   if(p.mode!==undefined&&p.mode!==4)throw Error('Nontriangle source '+url);const raw=read(p.attributes.POSITION),positions=new Float32Array(raw.length),normalRaw=p.attributes.NORMAL!==undefined?read(p.attributes.NORMAL):null,normals=new Float32Array(raw.length);
   const bounds=[[Infinity,Infinity,Infinity],[-Infinity,-Infinity,-Infinity]],v=new Vector3(),normalMatrix=world.clone().invert().transpose();
   for(let j=0;j<raw.length;j+=3){v.set(raw[j],raw[j+1],raw[j+2]).applyMatrix4(world);for(let k=0;k<3;k++){positions[j+k]=v.getComponent(k);bounds[0][k]=Math.min(bounds[0][k],positions[j+k]);bounds[1][k]=Math.max(bounds[1][k],positions[j+k]);}
    if(normalRaw){v.set(normalRaw[j],normalRaw[j+1],normalRaw[j+2]).transformDirection(normalMatrix);normals.set(v.toArray(),j);}
   }
   const indices=p.indices!==undefined?new Uint32Array(read(p.indices)):Uint32Array.from({length:raw.length/3},(_,v)=>v);
   if(!normalRaw){for(let j=0;j<indices.length;j+=3){const a=new Vector3().fromArray(positions,indices[j]*3),b=new Vector3().fromArray(positions,indices[j+1]*3),c=new Vector3().fromArray(positions,indices[j+2]*3),normal=b.sub(a).cross(c.sub(a)).normalize();for(let k=0;k<3;k++)for(let q=0;q<3;q++)normals[indices[j+k]*3+q]+=normal.getComponent(q);}for(let j=0;j<normals.length;j+=3){v.fromArray(normals,j).normalize();normals.set(v.toArray(),j);}}
   const name=n.extras?.name||n.name||m.name||key;const lower=name.toLowerCase(),system=source==='Z-Anatomy peripheral nerves'?'nervous':/arter|aorta/.test(lower)?'arterial':/vein|vena/.test(lower)?'venous':organ==='heart'?'cardiac':organ==='lungs'?'respiratory':['kidney','urinary_bladder','ureter'].includes(organ)?'urinary':organ==='brain'?'nervous':'digestive';
   parts.push({id:key+'__'+i+'__'+pi,name,system,source,positions,normals,indices,bounds});
  });}
  for(const child of n.children||[])walk(child,world);
 }
 gltf.nodes.forEach((_,i)=>{if(!parents.has(i))walk(i,new Matrix4());});return parts;
}
const specs=[...HRA_ORGAN_MODELS.map(m=>({...m,source:'HuBMAP HRA'})),...ZANATOMY_REFERENCE_MODELS.map(m=>({...m,source:'Z-Anatomy'})),{key:'hra_heart',url:HRA_HEART_MODEL_URL,organKey:'heart',source:'HuBMAP HRA'},{key:'peripheral_nerves',url:'/models/zanatomy_peripheral_nerves.glb',organKey:'nervous',source:'Z-Anatomy peripheral nerves'}];
for(const spec of specs){const sourceParts=glbParts(spec.url,spec.key,spec.source,spec.organKey);const parts=writeModel(spec.key,spec.key==='peripheral_nerves'?sourceParts.filter(p=>!peripheralNerveRegistrationIssue(p.name)):sourceParts);
 const definitions=spec.key==='hra_heart'?HRA_HEART_TARGETS:spec.source==='HuBMAP HRA'?HRA_ORGAN_TARGETS.filter(t=>t.modelKeys.includes(spec.key)):ZANATOMY_REFERENCE_TARGETS.filter(t=>t.modelKey===spec.key);
 for(const target of definitions){const ids=parts.filter(p=>spec.key==='hra_heart'?hraHeartMeshMatchesTarget(p.name,target.id):spec.source==='HuBMAP HRA'?hraOrganMeshMatchesTarget(p.name,target.id):zAnatomyMeshMatchesTarget(p.name,target.id)).map(p=>p.id);
  if(target.kind==='schematic')continue;
  // Multi-model HRA views keep the source files distinct; chooser exposes each side.
  if(!targets[target.id])targets[target.id]={model:spec.key,ids};
  references.push({id:target.id,model:spec.key,ids,organ:spec.organKey,label:target.label});
 }
 if(spec.key==='peripheral_nerves')for(const p of parts){const nerve=peripheralNerveKeyForMeshName(p.name);if(nerve){if(!targets[nerve]||targets[nerve].model==='atlas')targets[nerve]={model:spec.key,ids:[]};targets[nerve].ids.push(p.id);}}
}
fs.mkdirSync('mobile/src/simulator',{recursive:true});
const catalog='// Generated by scripts/build-native-simulator-assets.mjs.\nexport const ANATOMY_PARTS = '+JSON.stringify(allParts.map(({id,name,system,bounds,source,model})=>({id,name,system,bounds,source,model})))+';\nexport const ANATOMY_TARGETS:Record<string,{model:string;ids:readonly string[]}> = '+JSON.stringify(targets)+';\nexport const ANATOMY_REFERENCES = '+JSON.stringify(references)+';\n';
fs.writeFileSync('mobile/src/simulator/anatomyCatalog.ts',catalog);
for(const old of ['anatomy.bin.gz','atlas.json.gz'])fs.rmSync(out+'/'+old,{force:true});
fs.mkdirSync(out+'/radiology',{recursive:true});fs.cpSync('public/clinical-reference/radiology',out+'/radiology',{recursive:true});
fs.mkdirSync(out+'/pocus',{recursive:true});fs.cpSync('public/clinical-reference/pocus',out+'/pocus',{recursive:true});
fs.writeFileSync(out+'/ATTRIBUTION_BODYPARTS3D.md',fs.readFileSync('public/models/ATTRIBUTION_BODYPARTS3D.md','utf8')+'\n\n## Native offline pack adaptations\nSource identities and independent reference frames are retained. Native model geometry is further simplified with an absolute 0.8 mm BodyParts3D error bound, with source-scaled limits on other files. Positions are quantized to unsigned 16-bit per-part bounds, normals to signed 8-bit, and payloads compressed with gzip. Unverified vestibular-nerve geometry is withheld. Model source licenses and component attribution above remain applicable.\n');
for(const spec of ZANATOMY_REFERENCE_MODELS)fs.copyFileSync('public'+spec.manifestUrl,out+'/models/'+spec.key+'.source.json');
fs.copyFileSync('public/models/zanatomy_peripheral_nerves.manifest.json',out+'/models/peripheral_nerves.source.json');
const pg=JSON.parse(fs.readFileSync('public/pg/size.json','utf8')),modelBytes=fs.readdirSync(out+'/models').reduce((s,f)=>s+fs.statSync(out+'/models/'+f).size,0);
const report={schema:1,parts:allParts.length,models,geometryBytes:modelBytes,pgBytes:pg.completeBytes,contentBytes:modelBytes+pg.completeBytes,maxAtlasErrorMetres:maxError,budget:'Full offline detail authorised; 10 MB cap relaxed by owner.'};
fs.writeFileSync(out+'/size.json',JSON.stringify(report));fs.mkdirSync('docs/native-simulator',{recursive:true});fs.writeFileSync('docs/native-simulator/asset-size.json',JSON.stringify(report,null,2));console.log('TOTAL '+report.contentBytes+' bytes before radiology/audio/JS.');
