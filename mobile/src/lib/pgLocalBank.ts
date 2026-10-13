import type {PgQuestion} from './pgEntranceBank';
import PgBank from '@/native/NativeOrbitPgBank';
import {PG_COMPACT, PG_COMPACT_BYTES} from './pgCompact/manifest';
export {PG_COMPACT, PG_COMPACT_BYTES};
export type PgOfflinePack={id:string;exam:string;year:number|null;subject?:string;count:number;load?:()=>Promise<{default:PgQuestion[]}>};
export type PgOfflineSearch={exam:string;year:number|null;search:string;subject?:string|null;chapter?:string|null;limit?:number;offset?:number};
type PackData={subject:string;chapters:string[];rows:[string,string,string,string,string,number,string,number,number?][]};
const cache=new Map<string,Promise<PackData>>();
let generation=0;
export function getPgOfflinePacks(): readonly PgOfflinePack[]{
  return PG_COMPACT.packs.map(p=>({id:p.id,exam:'GENERAL_MEDICAL',year:null,subject:p.subject,count:p.count}));
}
export function getPgSubjects(){return PG_COMPACT.packs.map(p=>p.subject);}
export function getPgChapters(subject:string|null){
  return subject===null?[]:PG_COMPACT.packs.filter(p=>p.subject===subject).flatMap(p=>p.chapters);
}
async function loadPack(id:string):Promise<PackData>{
  const existing=cache.get(id);
  if(existing){cache.delete(id);cache.set(id,existing);return existing;}
  const meta=PG_COMPACT.packs.find(p=>p.id===id)!;
  const task=(async()=>{
    if(!PgBank)throw new Error('This app build does not contain the offline PG reader. Install the updated build.');
    const data=JSON.parse(await PgBank.readPack(id,meta.sha256)) as PackData;
    if(data.subject!==meta.subject||data.rows.length!==meta.count)throw new Error('PG pack inventory mismatch');
    return data;
  })();
  cache.set(id,task);while(cache.size>2)cache.delete(cache.keys().next().value!);
  try{return await task;}catch(error){cache.delete(id);throw error;}
}
export async function searchOfflinePgQuestions(input:PgOfflineSearch):Promise<{questions:PgQuestion[];total:number;packsScanned:number}>{
  const current=++generation;
  if(input.year!==null)return{questions:[],total:0,packsScanned:0};
  const search=input.search.toLocaleLowerCase().trim();
  const packs=PG_COMPACT.packs.filter(p=>!input.subject||p.subject===input.subject);
  let total=0,scanned=0;const questions:PgQuestion[]=[];
  const offset=Math.max(0,input.offset??0),limit=Math.max(1,Math.min(40,input.limit??40));
  const fastTotal=!search?packs.reduce((n,p)=>n+(input.chapter?p.chapters.find(c=>c.name===input.chapter)?.count??0:p.count),0):null;
  for(const meta of packs){
    const relevant=input.chapter?meta.chapters.find(c=>c.name===input.chapter)?.count??0:meta.count;
    if(!relevant)continue;
    if(!search&&total+relevant<=offset){total+=relevant;continue;}
    const data=await loadPack(meta.id);scanned++;
    if(current!==generation)throw new Error('PG search superseded');
    for(let index=0;index<data.rows.length;index++){
      const r=data.rows[index];const chapter=data.chapters[r[7]];
      if(input.chapter&&chapter!==input.chapter)continue;
      if(search&&![r[0],r[1],r[2],r[3],r[4],r[6],meta.subject,chapter].join(' ').toLocaleLowerCase().includes(search))continue;
      if(total>=offset&&questions.length<limit)questions.push({id:'medmcqa-practice-'+meta.id+'-'+(r[8]??index),exam:'GENERAL_MEDICAL',year:null,subject:meta.subject,chapter,question:r[0],options:r.slice(1,5) as string[],answer:'ABCD'[r[5]],explanation:r[6],record_type:'licensed_practice_dataset',source_url:'https://github.com/medmcqa/medmcqa',answer_reference:'MedMCQA supplied answer key; not independently medically reviewed.'});
      total++;
      if(!search&&questions.length>=limit)return{questions,total:fastTotal!,packsScanned:scanned};
    }
    await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  return{questions,total:fastTotal??total,packsScanned:scanned};
}
