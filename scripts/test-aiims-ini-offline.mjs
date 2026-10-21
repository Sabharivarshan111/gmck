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
const fetchBefore = globalThis.fetch;
globalThis.fetch=()=>{throw Error('Offline bank attempted networking');};
try {
  for (const [file,count] of [['aiimsPgBank.json',80],['iniCetBank.json',150]]) {
    const bank=read('mobile/src/lib/'+file);validateOfflineBank(bank);
    const reader=createOfflineReader(bank);assert.equal(reader.total,count);
    assert.equal(fs.statSync('mobile/src/lib/'+file).size<125000,true);
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
      assert.ok(!/\b(?:image|picture|shown|marked|unrecalled)\b/i.test(row.question));
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
  assert.equal(receipts.totalQuestions,230);
  assert.equal(receipts.questionProvenance.length,230);
  const used = new Set(receipts.questionProvenance.map(r=>r.id));assert.deepEqual(used,new Set(reviewed.map(r=>r.id)));
  // Existing NEET payload remains separate and is not relabelled as another exam.
  const neet=read('mobile/src/lib/neetPgBank.json');assert.equal(neet.records.length,2078);
  assert.equal(neet.records.some(r=>used.has(r.id)),false);
} finally {globalThis.fetch=fetchBefore;}
console.log('PASS: 230 source-fingerprinted recall items, original explanations, real syllabus paths, offline search/filter/answers, mutation isolation and unchanged 2,078-item NEET bank.');
