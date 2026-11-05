#!/usr/bin/env node
/**
 * Produce immutable, checksum-pinned offline university question packs for Android.
 * This runs BEFORE the TypeScript/Hermes and Gradle release builds. It downloads
 * public, RLS-readable rows only; no service key or direct DB credentials.
 * Any paging mismatch, unexpected row, or failed request aborts the release.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const client=fs.readFileSync(path.join(root,'mobile/src/lib/supabase.ts'),'utf8');
const supabaseUrl=process.env.SUPABASE_URL || client.match(/const SUPABASE_URL\s*=\s*'([^']+)'/)?.[1];
const apiKey=process.env.SUPABASE_ANON_KEY || client.match(/const SUPABASE_ANON_KEY\s*=\s*\n?\s*'([^']+)'/)?.[1];
if(!supabaseUrl || !apiKey || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl))throw Error('Missing public Supabase URL/key in native app');
const headers={apikey:apiKey,Authorization:'Bearer '+apiKey,Prefer:'count=exact'};
const PAGESIZE=500;
const specs=[
  { table:'muhs_pre_final_questions', university:'muhs',
    select:'id,study_year,subject,chapter,question_type,question_text,source_pdf,source_page,exam_dates,quality_status' },
  { table:'muhs_final_year_questions',university:'muhs',
    select:'id,study_year,subject,chapter,question_type,question_text,source_pdf,source_page,exam_dates,quality_status' },
  { table:'muhs_early_year_questions', university:'muhs',
    select:'id,study_year,subject,chapter,question_type,question_text,source_pdf,source_page,quality_status',
    filter:'quality_status=in.(ocr_checked,verified)' },
  { table:'rguhs_question_candidates', university:'rguhs',
    select:'id,mbbs_year,subject,chapter,question_type,question_text,source_pdf,source_pages,exam_sessions,review_status',
    filter:'published=eq.true' }
];
const normalizeYear=(year)=>{
  const text=String(year??'').toLowerCase().trim();
  if(['first','first-year','1st year'].includes(text))return 'first-year';
  if(['second','second-year','2nd year'].includes(text))return 'second-year';
  if(['third','third-year','3rd year part 1'].includes(text))return 'third-year';
  if(['final','final-year','final year'].includes(text))return 'final-year';
  throw Error('Unexpected MBBS year: '+year);
};
const normalizeText=x=>String(x??'').normalize('NFKC').trim().toLowerCase()
  .replace(/\s+/g,' ').replace(/[.!?]+$/,'');
async function requestTable(spec){
  let all=[],total=null;
  for(let offset=0;offset<100000;offset+=PAGESIZE){
    const url=new URL(supabaseUrl+'/rest/v1/'+spec.table);
    url.searchParams.set('select',spec.select);
    url.searchParams.set('order','id.asc');
    url.searchParams.set('limit',String(PAGESIZE));
    url.searchParams.set('offset',String(offset));
    if(spec.filter){const [key,val]=spec.filter.split('=');url.searchParams.set(key,val);}
    const res=await fetch(url,{headers,signal:AbortSignal.timeout(45000)});
    if(!res.ok)throw Error(spec.table+' page '+offset+' failed: '+res.status+' '+(await res.text()).slice(0,150));
    const contentRange=res.headers.get('content-range')??'';
    const count=Number(contentRange.split('/').at(-1));
    if(!Number.isInteger(count))throw Error('Missing exact count for '+spec.table+' '+contentRange);
    if(total!==null && total!==count)throw Error('Source changed during export of '+spec.table);
    total=count;
    const data=await res.json();
    if(!Array.isArray(data)||data.length>PAGESIZE)throw Error('Unexpected page for '+spec.table);
    all.push(...data);
    if(data.length<PAGESIZE)break;
  }
  if(all.length!==total||new Set(all.map(x=>x.id)).size!==all.length)
    throw Error(spec.table+' incomplete/duplicated export: '+all.length+'/'+total);
  if(spec.university==='rguhs' && all.length<10845) throw Error('RGUHS published records unexpectedly missing');
  if(spec.table==='muhs_pre_final_questions'&&all.length<2776)throw Error('MUHS earlier-year count regressed');
  if(spec.table==='muhs_final_year_questions'&&all.length<1571)throw Error('MUHS final-year count regressed');
  if(spec.table==='muhs_early_year_questions'&&all.length<2708)throw Error('MUHS checked early-year count regressed');
  console.log(spec.table+': '+all.length+' accessible records');
  return all;
}
const all=[];
const sourceCounts={};
for(const spec of specs){
  const rows=await requestTable(spec);
  sourceCounts[spec.table]=rows.length;
  for(const row of rows){
    const year=normalizeYear(row.study_year??row.mbbs_year);
    const subject=String(row.subject??'').trim();
    const question=String(row.question_text??'').trim();
    if(!subject||!question||!row.id)throw Error('Incomplete '+spec.table+' row');
    all.push({
      id:String(row.id),university:spec.university,year,subject,
      chapter:String(row.chapter||'Other').trim()||'Other',
      question_type:String(row.question_type||'unknown').toLowerCase(),
      question_text:question,
      source_pdf:String(row.source_pdf||''),
      source_page:row.source_page??row.source_pages?.[0]??null,
      exam_dates:Array.isArray(row.exam_dates)?row.exam_dates:Array.isArray(row.exam_sessions)?row.exam_sessions:[],
      quality_status:String(row.quality_status||row.review_status||'unreviewed'),
      _source:spec.table,
    });
  }
}
// Exact wording repeated across source tables represents the same question,
// not a second unique exam question. Prefer MUHS previously imported records
// over alternate early-year OCR; preserve every distinct RGUHS question.
const merged=new Map();
let removedDuplicates=0;
for(const item of all){
  const key=[item.university,item.year,item.subject.toLowerCase(),normalizeText(item.question_text)].join('|');
  const previous=merged.get(key);
  if(previous){
    removedDuplicates++;
    previous.exam_dates=[...new Set([...previous.exam_dates,...item.exam_dates])];
    // Do not overwrite the earlier record's provenance or imply it was reviewed.
  } else {
    const {_source,...publicRow}=item;
    merged.set(key,publicRow);
  }
}
const groups=new Map();
for(const item of merged.values()){
  const key=[item.university,item.year,item.subject].join('\u0000');
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(item);
}
const native=path.join(root,'mobile/android/app/src/main/assets/university');
fs.mkdirSync(native,{recursive:true});
for(const name of fs.readdirSync(native)){
  if(/^(?:u\d{2}-[a-f0-9]{12}\.zst|manifest\.json)$/.test(name))fs.unlinkSync(path.join(native,name));
  else throw Error('Unexpected university asset; refusing to silently delete '+name);
}
const packs=[];let size=0,index=0;
for(const [key,rows] of [...groups.entries()].sort(([a],[b])=>a.localeCompare(b))){
  const [university,year,subject]=key.split('\u0000');
  rows.sort((a,b)=>a.chapter.localeCompare(b.chapter)||a.id.localeCompare(b.id));
  const raw=Buffer.from(JSON.stringify(rows),'utf8');
  const compressed=zlib.zstdCompressSync(raw,{params:{[zlib.constants.ZSTD_c_compressionLevel]:15}});
  if(!zlib.zstdDecompressSync(compressed).equals(raw))throw Error('Compression round trip failed');
  const hash=crypto.createHash('sha256').update(compressed).digest('hex');
  const id='u'+String(index++).padStart(2,'0');
  const filename=id+'-'+hash.slice(0,12)+'.zst';
  fs.writeFileSync(path.join(native,filename),compressed);
  size+=compressed.length;
  packs.push({id,university,year,subject,count:rows.length,bytes:compressed.length,sha256:hash});
}
if(!packs.length||packs.some(p=>p.bytes>10000000)||size>12000000)throw Error('University offline pack size outside safe budget: '+size);
const count=(u)=>packs.filter(p=>p.university===u).reduce((n,p)=>n+p.count,0);
if(count('muhs')<4347 || count('rguhs')<10845)throw Error('Incomplete offline university export');
const manifest={schema:1,sourceCounts,rawCount:all.length,duplicatesRemoved:removedDuplicates,
  totals:{muhs:count('muhs'),rguhs:count('rguhs')},packs};
fs.writeFileSync(path.join(native,'manifest.json'),JSON.stringify(manifest));
const out=path.join(root,'mobile/src/lib/universityOfflineManifest.ts');
fs.writeFileSync(out,'// Generated by scripts/build-university-offline.mjs. Do not hand edit.\\n'+
  'export const UNIVERSITY_OFFLINE_MANIFEST = '+JSON.stringify(manifest)+' as const;\\n');
console.log(JSON.stringify({manifest:manifest.totals,sourceCounts,duplicatesRemoved,packs:packs.length,compressedBytes:size}));
