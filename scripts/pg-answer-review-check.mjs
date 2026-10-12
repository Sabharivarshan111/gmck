#!/usr/bin/env node
/** Offline deterministic guards: no provider calls or private OCR downloads. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const ts = createRequire(import.meta.url)('../mobile/node_modules/typescript');
const cache = new Map();
function load(file) {
  file = path.resolve(file.endsWith('.ts') ? file : file + '.ts');
  if (cache.has(file)) return cache.get(file).exports;
  const m = {exports:{}}; cache.set(file,m);
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(id=>load(path.resolve(path.dirname(file),id)),m,m.exports);
  return m.exports;
}
const base='supabase/functions/pg-answer-review/';
const {validate,requiresImage,parseCandidate,answerComparison}=load(base+'review.ts');
const {parsePassages,clinicalTokens,rankPassages,subjectSources}=load(base+'retrieval.ts');
const input={exam:'NEET_PG',exam_year:2026,subject:'Medicine',question:'Which treatment is appropriate for this condition?',options:['Option alpha','Option beta','Option gamma','Option delta'],supplied_answer:'A',question_id:'test:1'};
for(const year of [1991,2002,2012,2026,null]) assert.ok(validate({...input,exam_year:year}));
for(const year of [1990,2027,2026.5,'2026',undefined]) assert.equal(validate({...input,exam_year:year}),null);
for(const exam of ['FMGE','INI_CET','AIPGMEE','AIIMS_PG','GENERAL_MEDICAL']) assert.ok(validate({...input,exam}));
for(const patch of [{exam:'FAKE'}, {subject:'Unsupported'}, {options:['same',' SAME ','third','fourth']}, {options:['one','two']}, {supplied_answer:'E'}, {source_url:'http://example.com'}, {source_url:'https://user:pass@example.com'}, {image_required:'false'}]) assert.equal(validate({...input,...patch}),null);
for(const subject of ['Radiology','Psychiatry','Dermatology','Anaesthesia']) assert.ok(subjectSources(subject)?.fallback);
assert.equal(subjectSources('Medicine').fallback,null);
for(const patch of [{image_required:true},{image_url:'https://example.com/image.png'}, {question:'What is shown in the given image?'}, {question:'Identify the following ECG tracing.'},
  {question:'What is diagnosis in this image?'}, {question:'Identify structure marked by arrow.'},
  {question:'Which structure is indicated by the red arrow?'}, {question:'Name the labelled structure.'},
  {question:'What does the arrow indicate in this micrograph?'}]) assert.ok(requiresImage(validate({...input,...patch})),JSON.stringify(patch));
assert.equal(requiresImage(input),false);
for(const question of ['What is the role of image reconstruction in computed tomography?',
  'Which ECG change is associated with hyperkalemia?', 'What is the mechanism of target organ damage?',
  'Which artery supplies this structure?', 'What is the indication for a CT scan?']) assert.equal(requiresImage({...input,question}),false,question);
const text='===== PAGE 2 / 12 =====\nA clinical patient has no fever and receives 5mg medication, not 50 mg. This is a sufficiently long reference paragraph.\n\n===== PAGE 4 =====\nA second sufficiently long reference paragraph describes glucose measurement of 5 mmol per litre and medication safety.';
const passages=await parsePassages(text,'medicine/test.txt');
assert.deepEqual(passages.map(p=>p.ocr_page),[2,4]);
assert.deepEqual(await parsePassages(text,'medicine/test.txt'),passages);
for(const p of passages){assert.match(p.passage_sha256,/^[a-f0-9]{64}$/);assert.ok(p.id.includes(p.source_path));assert.ok(p.id.includes(p.paragraph_id));assert.ok(p.id.includes(p.passage_sha256));assert.ok(!p.text.includes('===== PAGE'));}
assert.deepEqual(clinicalTokens('5mg 50 mg no fever not present 2.5ml').filter(t=>['5','50','mg','no','not','2.5','ml'].includes(t)),['5','mg','50','no','not','2.5','ml']);
assert.notDeepEqual(clinicalTokens('5mg'),clinicalTokens('50mg'));
assert.equal(rankPassages(passages,'fever medication 5mg no')[0].id,passages[0].id);
assert.deepEqual(rankPassages(passages,'fever medication 5mg no',1),[]);
const candidate={answer:'A',confidence:'limited',explanation:'Evidence supports this option provisionally.',evidence_ids:[passages[0].id],conflicting_evidence:false,options_distinguished:true};
const parse=patch=>parseCandidate(JSON.stringify({...candidate,...patch}),passages);
assert.equal(parse({}).answer,'A');
for(const patch of [{conflicting_evidence:true},{options_distinguished:false},{confidence:'insufficient'},{evidence_ids:[]}]) assert.equal(parse(patch).answer,'UNRESOLVED');
for(const patch of [{evidence_ids:['invented']},{answer:'E'},{confidence:'perfect'},{explanation:'short'}]) assert.equal(parse(patch),null);
// Synthetic private text only: verify the response cannot echo retrieved OCR,
// including a passage whose ID the model omitted from its evidence list.
const privateText='In this fictional clinical protocol the investigator documents unusual symptoms before selecting a treatment and subsequently records the observation period alongside a detailed account of the patient response to therapy.';
const privatePassages=[{...passages[0],text:privateText}, {...passages[1],text:'An entirely different reference supplies background context for this fictional condition.'}];
const privateParse=(explanation,source=privatePassages)=>parseCandidate(JSON.stringify({...candidate,explanation,evidence_ids:[passages[1].id]}),source);
assert.equal(privateParse(privateText),null);
assert.equal(privateParse('Supporting text: '+privateText.toUpperCase().replaceAll(' ', ' , \n')),null);
const fragments=['Researchers carefully document the presenting complaint alongside the history',
  'The team then records every subsequent observation during treatment',
  'An independent reviewer subsequently assesses each recorded clinical response',
  'All remaining protocol details are preserved for later comparison'];
const fragmentedPassages=fragments.map((text,i)=>({...passages[i%2],text}));
assert.equal(privateParse(fragments.join(' Therefore, '),fragmentedPassages),null);
assert.ok(privateParse('The response to therapy informs reassessment, but the available evidence cannot establish the preferred treatment for this patient.'));
assert.ok(privateParse('Treatment depends on clinical context. The patient response to therapy requires careful review before choosing an option.'));
assert.equal(answerComparison(input,'A'),'agrees_provisionally');
assert.equal(answerComparison(input,'B'),'disagrees_requires_review');
assert.equal(answerComparison(input,'UNRESOLVED'),'unresolved');
assert.equal(answerComparison({...input,supplied_answer:undefined},'A'),'not_supplied');
const server=fs.readFileSync(base+'index.ts','utf8');
for(const regex of [/auth\.auth\.getUser\(token\)/,/consume_edge_quota/,/source_year_verified:false/,/independently_medically_reviewed:false/,/map\(\(\{text,\.\.\.metadata\}\) => metadata\)/,/retrievePassages/]) assert.match(server,regex);
assert.ok(!server.includes('verify_jwt: false'));
const local=load('mobile/src/lib/pgLocalBank.ts');
const quarantine=load('mobile/src/lib/pgQuarantine.ts');
const packs=local.getPgOfflinePacks();
assert.equal(packs.reduce((sum,p)=>sum+p.count,0),quarantine.PG_STRUCTURALLY_ELIGIBLE_TOTAL);
const expectedNeet=packs.filter(p=>p.exam==='NEET_PG').reduce((sum,p)=>sum+p.count,0);
const first=await local.searchOfflinePgQuestions({exam:'NEET_PG',year:null,search:'',limit:40,offset:0});
assert.equal(first.total,expectedNeet);assert.equal(first.questions.length,40);
assert.ok(first.questions.every(q=>!quarantine.PG_QUARANTINED_IDS.has(q.id)));
const last=await local.searchOfflinePgQuestions({exam:'NEET_PG',year:null,search:'',limit:40,offset:Math.floor((expectedNeet-1)/40)*40});
assert.equal(last.questions.length,expectedNeet%40||40);
for(const exam of ['FMGE','INI_CET'])assert.equal((await local.searchOfflinePgQuestions({exam,year:null,search:''})).total,0);
assert.equal((await local.searchOfflinePgQuestions({exam:'NEET_PG',year:2026,search:''})).total,0);
console.log('PG answer review: validation, image rejection, stable citations, dosage/negation ranking and provisional comparisons passed. No live AI used.');
