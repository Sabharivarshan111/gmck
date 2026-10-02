import assert from 'node:assert/strict';
import path from 'node:path';
import { build } from 'esbuild';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const result=await build({entryPoints:[path.join(root,'src/lib/kuhsQuestionSource.ts')],bundle:true,write:false,format:'esm',platform:'neutral',alias:{'@data':path.join(root,'../src/data'),'@shared':path.join(root,'../src/lib')}});
const {kuhsQuestionSource,kuhsRecordedExamCount}=await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const bank=await build({entryPoints:[path.join(root,'../src/data/kuhs/verifiedQuestions.ts')],bundle:true,write:false,format:'esm',platform:'neutral'});
const {VERIFIED_KUHS_QUESTIONS:rows}=await import(`data:text/javascript;base64,${Buffer.from(bank.outputFiles[0].text).toString('base64')}`);
assert.equal(kuhsRecordedExamCount(['KU']),0);
assert.equal(kuhsRecordedExamCount(['KU','KU22']),1);
assert.equal(kuhsRecordedExamCount(['KU24','KU24','KU16']),2);
assert.equal(kuhsRecordedExamCount(['July 17','Jul 17']),1);
assert.equal(kuhsRecordedExamCount(['Jan 23 KU','KU Jan 23']),1);
let unknown=0,max=0;
for(const row of rows){
 const refs=new Set();
 for(const ref of row.examRefs){
  const year=ref.match(/^KU(\d{2})$/i);
  const sitting=ref.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul(?:y)?|Aug|Sep|Oct|Nov|Dec)\s+(\d{2})\b/i);
  if(year)refs.add(year[1]);
  else if(sitting)refs.add(sitting[1].slice(0,3).toLowerCase()+sitting[2]);
  else assert.equal(ref,'KU',`Unrecognized reference ${row.id}: ${ref}`);
 }
 const source=kuhsQuestionSource(`KUHS[${row.id}] ${row.question}`);
 assert.ok(source,`Missing metadata for ${row.id}`);
 const count=kuhsRecordedExamCount(source.examRefs);
 assert.equal(count,refs.size,`Wrong count ${row.id}`);
 if(!count)unknown++;
 max=Math.max(max,count);
}
console.log(`OK all ${rows.length} KUHS reference counts checked; ${unknown} have no dated reference; largest count ${max}.`);
