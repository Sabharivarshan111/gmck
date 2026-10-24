import catalog from './structureDetails/catalog.json';
import type {Part} from './atlasTypes';
import type {OrganConnection} from './organConnections';
export type StructureKind='artery'|'vein'|'muscle';
export interface StructureProfile {kind:StructureKind;name:string;source?:string;origin?:string;insertion?:string;branches?:string;tributaries?:string;drainsTo?:string;course?:string;supply?:string;innervation?:string;action?:string;scopeNote?:string;links?:{id:string;name:string}[]}
interface Binding {name:string;conceptId:string;kind:StructureKind;profile?:string;wholeMuscle?:boolean;scope?:string;parent?:string}
export interface StructureDetail extends StructureProfile {id:string;conceptId?:string;scope?:string;referenceName?:string;sourceTitle?:string;sourceUrl?:string;sourceLicense?:string}
const profiles=catalog.profiles as Record<string,StructureProfile>;
const parts=catalog.parts as Record<string,Binding>;
const sources=catalog.sources as Record<string,{title:string;url:string;license?:string}>;
const normalize=(text:string)=>text.toLowerCase().replace(/\banterior descending branch\b/g,'anterior interventricular branch').replace(/[_-]/g,' ').replace(/\s+/g,' ').trim();
const names=new Map(Object.entries(profiles).map(([key,p])=>[normalize(p.name),key]));
const aliases:Record<string,string>={coronary_arteries:'coronary_arteries',coronary_artery:'coronary_arteries',lad_artery:'left anterior descending artery',rca_artery:'right coronary artery',lca_artery:'left coronary artery',lcx_artery:'circumflex artery',portal_vein:'portal vein',celiac_trunk:'celiac artery',aorta:'aorta',coronary_sinus:'coronary sinus'};
const profileParts=new Map<string,Binding[]>();
const childGroups=new Map<string,Map<string,string[]>>();
for(const [id,part]of Object.entries(parts)){
 if(part.profile)profileParts.set(part.profile,[...(profileParts.get(part.profile)||[]),part]);
 const relation=part.name.match(/(?:branch|tributary) of (.+)$/i);if(!relation)continue;
 const key=normalize(relation[1]),groups=childGroups.get(key)||new Map<string,string[]>();groups.set(part.name,[...(groups.get(part.name)||[]),id]);childGroups.set(key,groups);
}
function withSource(d:StructureDetail):StructureDetail{
 const source=d.source&&sources[d.source];const ownParts=parts[d.id]?[parts[d.id]]:profileParts.get(aliases[d.id]||names.get(normalize(d.id))||'')||[];
 if(!d.links){const links=ownParts.flatMap(p=>[...(childGroups.get(normalize(p.name.replace(/^Trunk of /i,'')))||[])].map(([name,ids])=>({id:ids.length===1?ids[0]:'atlas:'+ids.join(','),name})));if(links.length)d.links=[...new Map(links.map(l=>[l.name,l])).values()];}
 return {...d,sourceTitle:source?.title||'Anatomy reference, adapted',sourceUrl:source?.url||(d.source?.startsWith('https://')?d.source:undefined),sourceLicense:source?.license||(d.source?.includes('wikipedia.org')?'CC BY-SA 4.0':undefined)};
}
function profileDetail(id:string,key:string,name?:string):StructureDetail|null{const p=profiles[key];return p?withSource({...p,id,name:name||p.name}):null;}
export function getStructureDetail(id:string|null|undefined,sourcePart?:Part,connection?:OrganConnection|null):StructureDetail|null{
 if(!id)return null;const raw=id.replace(/^atlas:/,'');
 if(raw.includes(',')){const members=raw.split(',').map(x=>parts[x]);if(members.every(Boolean)&&(new Set(members.map(p=>p.profile)).size===1||new Set(members.map(p=>p.name)).size===1)&&members[0].profile){const first=getStructureDetail(raw.split(',')[0]);return first?{...first,id,name:members[0].name}:null;}}
 const b=parts[raw];if(b){const p=b.profile&&profiles[b.profile];const d:StructureDetail={...(p||{kind:b.kind}),id:raw,name:b.name,conceptId:b.conceptId};
  if(b.scope==='regional'){d.scope='Regional anatomy reference';d.referenceName=p?.name;}
  if(b.wholeMuscle||b.scope==='parent'){d.scope=b.scope==='parent'?'Parent vessel reference':'Whole-muscle reference';d.referenceName=p?.name;
   if(b.scope==='parent'){if(b.parent&&b.name.toLowerCase().includes('branch'))d.origin=b.parent;if(b.parent&&b.name.toLowerCase().includes('tributary'))d.drainsTo=b.parent;d.branches=undefined;d.tributaries=undefined;d.course=undefined;d.supply=undefined;}}
  return withSource(d);
 }
 if(aliases[id]&&profiles[aliases[id]])return profileDetail(id,aliases[id]);const key=names.get(normalize(id));if(key)return profileDetail(id,key);
 if(sourcePart?.id===raw){const kind={arterial:'artery',venous:'vein',muscular:'muscle'}[sourcePart.system] as StructureKind|undefined;if(kind)return {id:raw,name:sourcePart.name,kind,conceptId:sourcePart.conceptId};}
 if(!connection)return null;if(connection.nodeId&&aliases[connection.nodeId])return profileDetail(id,aliases[connection.nodeId],connection.label);
 if(normalize(connection.label)==='coronary artery')return profileDetail(id,'coronary_arteries','Coronary arteries');const labelKey=names.get(normalize(connection.label));if(labelKey)return profileDetail(id,labelKey,connection.label);
 const members=connection.partIds.map(x=>parts[x]).filter(Boolean);if(!members.length)return ['arterial','venous'].includes(connection.kind)?{id,name:connection.label,kind:connection.kind==='arterial'?'artery':'vein',course:connection.note}:null;
 const keys=[...new Set(members.map(p=>p.profile).filter(Boolean))];if(keys.length===1&&members.every(p=>p.profile===keys[0]))return profileDetail(id,keys[0]!,connection.label);
 return {id,name:connection.label,kind:connection.kind==='venous'?'vein':connection.kind==='arterial'?'artery':members[0].kind,course:connection.note,scope:'Named structures in this selection',links:connection.partIds.filter(x=>parts[x]).map(x=>({id:x,name:parts[x].name}))};
}
