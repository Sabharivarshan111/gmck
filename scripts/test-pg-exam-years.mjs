import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from '../mobile/node_modules/esbuild/lib/main.js';
const compile=async path=>{const r=await build({entryPoints:[path],bundle:true,write:false,format:'esm',platform:'node',alias:{'@shared':'./src/lib'}});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));};
const [{loadBundledNeetBank},{pgExamYearLabel},{createOfflineReader,validateOfflineBank}]=await Promise.all([compile('mobile/src/lib/neetPgBundledBank.ts'),compile('src/lib/pgExamYear.ts'),compile('src/lib/neetPgOffline.ts')]);
const {reader}=await loadBundledNeetBank();assert.equal(reader.total,2078);
const original=JSON.parse(fs.readFileSync('mobile/src/lib/neetPgBank.json','utf8'));
for(let offset=0;offset<reader.total;offset+=40){
 for(const row of reader.search({offset}).records){
  assert.ok(row.examYear>=2017&&row.examYear<=2026);
  assert.ok(pgExamYearLabel(row,'NEET-PG').includes(String(row.examYear)));
  const before=original.records.find(r=>r.id===row.id);const {examYear,examSession,...after}=row;assert.deepEqual(after,before);
 }
}
const shift=reader.search({query:'2024 Shift 1'});assert.ok(shift.total>0);assert.ok(shift.records.every(r=>r.examYear===2024&&r.examSession==='Shift 1'));
assert.equal(pgExamYearLabel({},'NEET-PG'),'NEET-PG · Year unavailable');
assert.equal(pgExamYearLabel({examYear:2022,examSession:'November'},'INI-CET'),'INI-CET 2022 · November · Recall');
const legacy={...original,records:[{...original.records.find(r=>!r.requiresImage),id:'private-2025-do-not-infer'}]};
assert.equal(createOfflineReader(legacy).search().records[0].examYear,undefined);
for(const patch of [{examYear:2101},{examYear:2025.5},{examYear:'2025'},{examSession:'May'}])assert.throws(()=>validateOfflineBank({...legacy,records:[{...legacy.records[0],...patch}]}));
console.log('PASS all 2,078 NEET source-year joins; exact payload preservation; shift search; unknown private year; invalid dates rejected.');
