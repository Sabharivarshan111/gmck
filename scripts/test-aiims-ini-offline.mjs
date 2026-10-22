import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {build} from '../mobile/node_modules/esbuild/lib/main.js';

const output = await build({entryPoints:['src/lib/neetPgOffline.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {createOfflineReader,validateOfflineBank} = await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
const read = path => JSON.parse(fs.readFileSync(path,'utf8'));
const reviewed = read('scripts/aiims-ini-reviewed.json');
const receipts = read('docs/AIIMS_INI_RELEASE_CANDIDATE_20261021.json');
const chapters = new Map(read('mobile/src/lib/neetPgStudyData.json').chapters.map(c=>[c.id,c]));
// 'Marked leucocytosis' is a severity descriptor, not a reference to a figure.
const missingFigureReference=/\b(?:image|picture|shown|unrecalled)\b|\bmarked\s+(?:structure|point|area|part|region)\b/i;
assert.equal(missingFigureReference.test('Marked leucocytosis with basophilia'),false);
assert.equal(missingFigureReference.test('Identify the marked structure'),true);
const fetchBefore = globalThis.fetch;
globalThis.fetch=()=>{throw Error('Offline bank attempted networking');};
try {
  for (const [file,count] of [['aiimsPgBank.json',108],['iniCetBank.json',216]]) {
    const bank=read('mobile/src/lib/'+file);validateOfflineBank(bank);
    const reader=createOfflineReader(bank);assert.equal(reader.total,count);
    assert.equal(fs.statSync('mobile/src/lib/'+file).size<175000,true);
    const rows=[];
    for(let offset=0;offset<reader.total;offset+=40)rows.push(...reader.search({offset}).records);
    assert.equal(rows.length,count);assert.equal(new Set(rows.map(r=>r.id)).size,count);
    for(const row of rows){
      assert.deepEqual(bank.chapters.find(c=>c.id===row.chapterId),chapters.get(row.chapterId));
      const review=reviewed.find(r=>r.id===row.id);assert.ok(review);
      const signature=JSON.stringify([row.question,row.options,row.sourceAnswer]);
      assert.equal(crypto.createHash('sha256').update(signature).digest('hex'),review.sourceFingerprint);
      assert.equal(row.explanation,review.explanation);assert.equal(row.sourceAnswer,review.answer);
      assert.equal(row.answerIndex,row.sourceAnswer.charCodeAt(0)-65);
      assert.equal(row.examYear,receipts.questionProvenance.find(r=>r.id===row.id).collectionYear);
      assert.ok(!missingFigureReference.test(row.question));
      assert.equal(reader.search({ids:[row.id]}).total,1);
      assert.equal(reader.search({chapterId:row.chapterId,query:row.options[row.answerIndex]}).records.some(r=>r.id===row.id),true);
      assert.equal(reader.search({year:chapters.get(row.chapterId).year,ids:[row.id]}).total,1);
    }
    const before=reader.search().records[0].options[0];bank.records[0].options[0]='Mutated';
    assert.equal(reader.search().records[0].options[0],before);
    const result=reader.search();result.records[0].options[0]='Mutated result';
    assert.equal(reader.search().records[0].options[0],before);
    const bad=structuredClone(bank);bad.records[0].sourceAnswer='Z';bad.records[0].answerIndex=0;
    assert.throws(()=>validateOfflineBank(bad));
  }
  for (const held of ['aiims-2017-nov:1', 'ini-2024-01:15', 'ini-2026-may:8']) assert.equal(reviewed.some(r=>r.id===held),false);
  for(const row of read('scripts/aiims-ini-held.json')) assert.equal(reviewed.some(r=>r.id===row.id),false);
  const ini=read('mobile/src/lib/iniCetBank.json');
  assert.equal(ini.records.some(r=>r.id==='faculty-ini-2022-may-psm:5'),false);
  const repaired=ini.records.find(r=>r.id==='inicetmay25-psm:4');
  for(const statement of ['1. Conduct data analysis','2. Selecting population','3. Setting research question','4. Setting research objective'])assert.ok(repaired.question.includes(statement));
  assert.equal(repaired.sourceAnswer,'C');
  assert.equal(receipts.totalQuestions,324);
  assert.equal(receipts.questionProvenance.length,324);
  const fresh=read('scripts/aiims-ini-missing-papers-import-20261022.json');
  assert.equal(fresh.newQuestions,52);
  for(const review of fresh.questionReviews){
    const record=ini.records.find(r=>r.id===review.id);assert.ok(record);assert.equal(record.sourceAnswer,review.suppliedKey);
    assert.ok(review.sourcePages.length>0);
  }
  assert.equal(ini.records.find(r=>r.id==='inicetmay25-anaesthesia:1').sourceAnswer,'A');
  const arsenic=ini.records.find(r=>r.id==='aglasem-715beab2-b5c8-11ed-8572-0a5e36bc6706:6');
  for(const n of ['1.','2.','3.','4.','5.'])assert.ok(arsenic.question.includes(n));
  assert.equal(fs.statSync('mobile/src/lib/aiimsPgBank.json').size+fs.statSync('mobile/src/lib/iniCetBank.json').size<250000,true);
  const used = new Set(receipts.questionProvenance.map(r=>r.id));assert.deepEqual(used,new Set(reviewed.map(r=>r.id)));
  // Existing NEET payload remains separate and is not relabelled as another exam.
  const neet=read('mobile/src/lib/neetPgBank.json');assert.equal(neet.records.length,2078);
  assert.equal(neet.records.some(r=>used.has(r.id)),false);
} finally {globalThis.fetch=fetchBefore;}
console.log('PASS: 324 source-fingerprinted recall items, original explanations, real syllabus paths, offline search/filter/answers, mutation isolation and unchanged 2,078-item NEET bank.');
