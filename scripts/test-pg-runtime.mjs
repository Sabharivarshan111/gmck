#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url),ts=req('../mobile/node_modules/typescript');
const {decompress}=req('../mobile/node_modules/fzstd');
const modules=new Map();let loads=0;
function load(file){
 file=path.resolve(file.endsWith('.ts')?file:file+'.ts');if(modules.has(file))return modules.get(file).exports;
 const m={exports:{}};modules.set(file,m);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',code)(id=>{
  if(id==='@/native/NativeOrbitPgBank')return{__esModule:true,default:{readPack:async(id,sha)=>{loads++;const packed=fs.readFileSync('public/pg/'+id+'-'+sha.slice(0,12)+'.zst');assert.equal(crypto.createHash('sha256').update(packed).digest('hex'),sha);return zlib.zstdDecompressSync(packed).toString('utf8');}}};
  return load(path.resolve(path.dirname(file),id));
 },m,m.exports);return m.exports;
}
const reader=load('mobile/src/lib/pgLocalBank.ts'),manifest=reader.PG_COMPACT;
assert.equal(manifest.total,185637);assert.equal(reader.getPgOfflinePacks().length,21);assert.ok(reader.PG_COMPACT_BYTES<10000000);
let count=0;
for(const p of manifest.packs){
 const packed=fs.readFileSync('public/pg/'+p.id+'-'+p.sha256.slice(0,12)+'.zst');assert.ok(Buffer.from(decompress(packed)).equals(zlib.zstdDecompressSync(packed)),'Browser/native codecs differ');
 const d=JSON.parse(zlib.zstdDecompressSync(packed));assert.equal(d.rows.length,p.count);
 for(const r of d.rows){assert.equal(r.length,8);assert.ok(r[5]>=0&&r[5]<=3);assert.equal(new Set(r.slice(1,5).map(o=>o.trim().toLocaleLowerCase())).size,4);assert.ok(d.chapters[r[7]]);count++;}
 const first=await reader.searchOfflinePgQuestions({exam:'NEET_PG',year:null,search:'',subject:p.subject,limit:40});assert.equal(first.total,p.count);assert.ok(first.questions.length>0);
 const chapter=p.chapters.find(c=>c.count>0);const filtered=await reader.searchOfflinePgQuestions({exam:'FMGE',year:null,search:'',subject:p.subject,chapter:chapter.name});assert.equal(filtered.total,chapter.count);assert.ok(filtered.questions.every(q=>q.chapter===chapter.name));
}
assert.equal(count,185637);
const tiva=await reader.searchOfflinePgQuestions({exam:'NEET_PG',year:null,subject:'Anaesthesia',search:'Total Infra'});
assert.ok(tiva.questions.some(q=>q.id==='medmcqa-practice-s00-4'&&q.answer==='B'&&q.explanation.includes('conventional propofol-based')));
const first=await reader.searchOfflinePgQuestions({exam:'ALL',year:null,search:'',offset:0});
const second=await reader.searchOfflinePgQuestions({exam:'ALL',year:null,search:'',offset:40});assert.ok(second.questions.every(q=>!first.questions.some(p=>p.id===q.id)));assert.equal(first.total,185637);
assert.deepEqual(await reader.searchOfflinePgQuestions({exam:'NEET_PG',year:2026,search:''}),{questions:[],total:0,packsScanned:0});
const exact=first.questions[0];const found=await reader.searchOfflinePgQuestions({exam:'INI_CET',year:null,subject:exact.subject,search:exact.question});assert.ok(found.questions.some(q=>q.id===exact.id));
assert.ok(first.questions.every(q=>q.year===null&&q.record_type==='licensed_practice_dataset'));
console.log(JSON.stringify({records:count,codec_parity:true,subject_and_chapter_filters:true,pagination:true,search:true,verified_years:0,live_AI_calls:0,data_bytes:reader.PG_COMPACT_BYTES,pack_loads:loads}));
