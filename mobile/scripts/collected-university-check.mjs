import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { build } from 'esbuild';

const mobile = path.resolve(import.meta.dirname, '..');
const repo = path.dirname(mobile);
async function bundle(file, define = {}) {
  const result = await build({ entryPoints: [path.join(repo, file)], bundle: true,
    write: false, format: 'esm', platform: 'neutral', define,
    alias: { '@': path.join(mobile, 'src'), '@data': path.join(repo, 'src/data'), '@shared': path.join(repo, 'src/lib') } });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}
function load(file, mocks) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(mobile, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    throw Error(`Missing mock ${id}`);
  }, console, setTimeout, clearTimeout });
  return exports;
}

const catalog = await bundle('src/lib/university.ts');
const { REVIEWED_UNIVERSITY_QUESTIONS: rows } = await bundle('src/data/universityPapers/reviewedQuestions.ts');
const source = await bundle('src/data/universityPapers/questionBankData.ts');
const bank = await bundle('mobile/src/lib/questionBank.ts');
const text = await bundle('mobile/src/lib/questionText.ts');
const availability = await bundle('mobile/src/lib/kuhsAvailability.ts', { __DEV__: 'false' });
const values = new Map();
const storage = { getItem: async key => values.get(key) ?? null, setItem: async (key, value) => { values.set(key, value); } };
const common = { '@react-native-async-storage/async-storage': { __esModule: true, default: storage },
  './supabase': { supabase: {} }, '@/lib/log': { warn() {} }, '@shared/university': catalog };
const progress = load('src/lib/progress.ts', common);
const flashcards = load('src/lib/flashcards.ts', { ...common, '@shared/anki': {}, '@shared/pathwayCards': {} });
const notes = load('src/lib/handwrittenNotes.ts', { ...common, './notesDedup': {}, './questionBank': bank,
  './notesLimits': {}, './progress': progress });
const resume = load('src/lib/homeResume.ts', { ...common, '@/lib/questionBank': bank });

assert.equal(rows.length, 12709);
assert.equal(new Set(rows.map(r => r.id)).size, rows.length);
const expected = { rguhs: 5008, knruhs: 3695, muhs: 0, ntruhs: 1652, wbuhs: 2354 };
const marks = { rguhs: 20601, knruhs: 15599, ntruhs: 6117, wbuhs: 12225 };
const ids = new Set();
for (const [university, count] of Object.entries(expected)) {
  assert.equal(bank.allSearchHits(university).length, count);
  assert.equal(source.COLLECTED_QUESTION_COUNTS[university], count);
  assert.equal(availability.bankAvailable(university), count > 0);
  if (count) assert.equal(availability.availableBankUniversity(university), university);
  const uniRows = rows.filter(r => r.university === university);
  if (count) assert.equal(uniRows.reduce((sum, r) => sum + r.marks, 0), marks[university]);
  for (const row of uniRows) {
    assert.match(row.sourceSha256, /^[a-f0-9]{64}$/);
    assert.ok(row.id.includes(row.sourceSha256.slice(0, 12)));
    assert.ok(Number.isInteger(row.pdfPage) && row.pdfPage >= 1 && row.pdfPage <= Math.max(7, ...['batch15-provenance.json', 'batch16-provenance.json', 'batch17-provenance.json', 'batch18-provenance.json'].flatMap(file => JSON.parse(fs.readFileSync(path.join(repo, 'src/data/universityPapers', file), 'utf8')).papers).filter(p => p.sha256 === row.sourceSha256).flatMap(p => p.pagesVisuallyCompared)));
    assert.ok((row.question.length > 4 || (row.id === 'rguhs-3e762a08ccd4-p1-q4' && row.question === 'BMR') || {"ntruhs-2a174f5c1c88-p1-q9": "BERA", "ntruhs-45cc96809a77-p1-q11": "CTEV", "ntruhs-6b81306ad1a7-p1-q11": "ASHA"}[row.id] === row.question || (row.id === 'ntruhs-12f02835c36f-p1-q7' && row.question === 'Gout') || {"knruhs-6cde83218b53-p2-q12": "PKDL", "knruhs-ee244d19365e-p1-q11": "IgG", "knruhs-136b4dc127a6-p1-q2": "Bias", "knruhs-d5a145770a41-p1-q10": "CARE"}[row.id] === row.question || (row.id === 'knruhs-e8e59be64df3-p2-q17' && row.question === 'KFD') || (row.id === 'rguhs-942383725e34-p1-q6' && row.question === 'IgM.') || (row.id === 'rguhs-764314376aaf-p1-q17' && row.question === 'Hair') || (['rguhs-fc6c85e99007-p1-q5','rguhs-d3a0bc4dc8fb-p1-q12'].includes(row.id) && row.question === 'Gout') || (row.id === 'rguhs-8b7f4f6c8446-p1-q13' && row.question === 'GABA')) && row.question.length <= 1000);
    assert.ok(row.examRefs.length > 0 && row.topicKey);
    const raw = `PYQ[${row.id}] ${row.question}`;
    assert.equal(text.getCleanQuestionText(raw), row.question);
    assert.equal(text.noteQuestionText(raw), row.question);
    assert.equal(source.collectedQuestionSource(raw).id, row.id);
    assert.equal(progress.getQuestionId(raw), `question-${row.id}`);
    assert.ok(!ids.has(progress.getQuestionId(raw))); ids.add(progress.getQuestionId(raw));
  }
  assert.equal(flashcards.deckKeyFor('first', 'anatomy', 'upper-limb', university), `${university}::first::anatomy::upper-limb`);
  assert.ok(notes.singleNoteCacheKey({ university, subjectKey: 'anatomy', question: 'Shared wording' }).startsWith(`single::${university}::`));
  if (count) {
    const hit = bank.allSearchHits(university)[0];
    resume.rememberQuestion({ university, year: hit.year, path: hit.path, title: hit.topicName, question: hit.question, type: hit.type });
    const restored = await resume.readLastQuestion(university);
    assert.equal(restored.university, university);
    assert.equal(restored.question, hit.question);
  }
}
assert.equal(catalog.isUniversity('not-a-university'), false);
assert.equal(catalog.isUniversity('wbuhs'), true);
assert.ok(bank.allSearchHits('tnmgr').length > 5000);
assert.ok(bank.allSearchHits('kuhs').length > 6900);
assert.equal(progress.getQuestionId('KUHS[kuhs-1-anat-p3-01] Existing row'), 'question-kuhs-1-anat-p3-01');
assert.equal(flashcards.deckKeyFor('first', 'anatomy', 'upper-limb', 'tnmgr'), 'first::anatomy::upper-limb');
assert.equal(flashcards.deckKeyFor('first', 'anatomy', 'upper-limb', 'kuhs'), 'kuhs::first::anatomy::upper-limb');
const wb = rows.filter(r => r.university === 'wbuhs');
assert.ok(wb[2].question.includes('nephrosis and apoptosis'), 'Do not silently correct printed wording');
assert.ok(wb[1].question.includes('any two') && wb[1].question.includes('c)'));
assert.ok(wb[3].question.includes('any two') && wb[3].question.includes('d) Septic shock'));
assert.ok(rows.find(r => r.university === 'knruhs').question.includes('(d) Applied anatomy'));
console.log('PASS 12709 reviewed question units: all new bank counts, marks, identities, cleaned text, source refs, university isolation, note/deck cache keys and resume persistence; old TNMGR/KUHS banks retained.');

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH02: batch02 } = await bundle('src/data/universityPapers/reviewedBatch02.ts');
assert.equal(batch02.length, 200);
const sourcePapers = new Map();
for (const row of batch02) {
  const paper = sourcePapers.get(row.sourceSha256) ?? [];
  paper.push(row); sourcePapers.set(row.sourceSha256, paper);
  assert.equal(row.year, 'third', 'Printed Final Year Part-I belongs in third professional');
  assert.ok(!/Short Answer Questions:|Very Short Answer Questions:|Essay.*Questions:|Max Marks/.test(row.question), 'Section headers leaked into question');
  if (row.questionFormat === 'mcq') {
    assert.deepEqual(row.options.map(option => option.label), ['a', 'b', 'c', 'd']);
    assert.equal(row.marks, 1);
    for (const option of row.options) assert.ok(row.question.includes(`(${option.label}) ${option.text}`));
    assert.equal(source.collectedShortQuestionLabel([`PYQ[${row.id}] ${row.question}`]), 'Short / MCQ');
  } else assert.equal(row.options, undefined);
}
assert.equal(sourcePapers.size, 8);
for (const paper of sourcePapers.values()) {
  assert.deepEqual(paper.map(row => Number(row.sourceQuestion)), Array.from({ length: 25 }, (_, i) => i + 1));
  assert.equal(paper.reduce((total, row) => total + row.marks, 0), 100);
  assert.equal(paper.filter(row => row.questionFormat === 'mcq').length, 10);
}
assert.equal(batch02.filter(row => row.questionFormat === 'mcq').length, 80);
assert.equal(source.collectedShortQuestionLabel([]), 'Short Notes');
assert.ok(batch02.find(row => row.id === 'knruhs-c6066ec7370d-p1-q4').options[2].text.includes('Taking commissions'), 'Printed anomalous option must remain');
assert.ok(batch02.find(row => row.id === 'knruhs-76c1e1c76540-p1-q8').question.includes('efferent for corneal sensation'), 'Printed wording must remain');
assert.equal(batch02.find(row => row.id === 'knruhs-d3849ebf741b-p2-q10').pdfPage, 2, 'Cross-page MCQ provenance must retain its actual page');
assert.ok(batch02.find(row => row.id === 'knruhs-9ccef7949cae-p2-q19').question.includes('C) Outline the appropriate further management'));
console.log('PASS Batch02: 8 complete paper sequences, 800 marks, 80 MCQs/320 options, source anomalies and cross-page questions preserved.');

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH03: batch03 } = await bundle('src/data/universityPapers/reviewedBatch03.ts');
assert.equal(batch03.length, 200);
const papers03 = new Map();
for (const row of batch03) {
  const entries = papers03.get(row.sourceSha256) ?? [];
  entries.push(row); papers03.set(row.sourceSha256, entries);
  assert.equal(row.year, row.subjectKey === 'ophthalmology' ? 'final' : 'third', 'Use printed Part-I/Part-II, not filename phase');
  if (row.subjectKey === 'community-medicine') assert.ok(row.paperNumber === 'I' || row.paperNumber === 'II');
  assert.ok(!/Short Answer Questions:|Very Short Answer Questions:|Essay.*Questions:|Max Marks/.test(row.question));
  if (row.questionFormat === 'mcq') {
    assert.deepEqual(row.options.map(option => option.label), ['a', 'b', 'c', 'd']);
    assert.equal(row.marks, 1);
    for (const option of row.options) assert.ok(row.question.includes(`(${option.label}) ${option.text}`));
  }
}
assert.equal(papers03.size, 8);
for (const entries of papers03.values()) {
  assert.deepEqual(entries.map(row => Number(row.sourceQuestion)), Array.from({ length: 25 }, (_, i) => i + 1));
  assert.equal(entries.reduce((sum, row) => sum + row.marks, 0), 100);
  assert.equal(entries.filter(row => row.questionFormat === 'mcq').length, 10);
}
assert.equal(batch03.filter(row => row.subjectKey === 'community-medicine').length, 150);
assert.ok(batch03.find(row => row.id === 'knruhs-e19c20587902-p1-q5').options[0].text.includes('6/5th'), 'Do not repair printed numerical option');
assert.ok(batch03.find(row => row.id === 'knruhs-aa2f4b5aeef0-p1-q3').question.startsWith('"TODAY"'), 'Quoted undotted question must not disappear');
assert.ok(batch03.find(row => row.id === 'knruhs-663cfc584243-p1-q9').options[2].text === 'Hearing aid');
assert.ok(batch03.find(row => row.id === 'knruhs-c411e2b77af6-p2-q24').question.includes('Human AIDS Anti Retro Viral Therapy'));
console.log('PASS Batch03: 8 complete papers/800marks, 80MCQs/320options, SPM I/II identified, printed Part-II mapped to final year.');

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH04: batch04 } = await bundle('src/data/universityPapers/reviewedBatch04.ts');
assert.equal(batch04.length, 203);
const papers04 = new Map();
for (const row of batch04) {
  assert.equal(row.year, 'final');
  const entries = papers04.get(row.sourceSha256) ?? [];
  entries.push(row); papers04.set(row.sourceSha256, entries);
  assert.ok(!/PART[-–]?[AB]\s*$|Short Answer Questions:|Very Short Answer Questions:|Essay.*Questions:|Max Marks/i.test(row.question));
  if (row.questionFormat === 'mcq') {
    assert.deepEqual(row.options.map(option => option.label.toLowerCase()), ['a', 'b', 'c', 'd']);
    for (const option of row.options) assert.ok(row.question.includes(`(${option.label}) ${option.text}`));
  }
}
assert.equal(papers04.size, 8);
for (const entries of papers04.values()) {
  const split = entries[0].subjectKey === 'general-medicine' && entries[0].paperNumber === 'II';
  const count = split ? 26 : 25;
  assert.deepEqual(entries.map(row => Number(row.sourceQuestion)), Array.from({ length: count }, (_, i) => i + 1));
  assert.equal(entries.reduce((sum, row) => sum + row.marks, 0), 100);
  if (split) {
    for (const part of ['A', 'B']) {
      const group = entries.filter(row => row.examPart === part);
      assert.equal(group.length, 13);
      assert.equal(group.reduce((sum, row) => sum + row.marks, 0), 50);
      assert.equal(group.filter(row => row.questionFormat === 'mcq').length, 5);
      assert.ok(group.every(row => row.originalSection.startsWith(`Part ${part} · `)));
    }
    assert.equal(entries.find(row => row.sourceQuestion === '19').questionFormat, 'long-answer');
    assert.equal(entries.find(row => row.sourceQuestion === '14').questionFormat, 'mcq');
  }
}
assert.equal(batch04.filter(row => row.subjectKey === 'general-medicine').length, 153);
assert.equal(batch04.filter(row => row.questionFormat === 'mcq').length, 80);
const threshold = batch04.find(row => row.id === 'knruhs-5f9ad511b5f1-p1-q3');
assert.equal(threshold.options[0].text, '4 gm%', 'Numeric option must not become the next question');
assert.ok(threshold.examRefs[0].includes('Supplementary'), 'Preserve printed SUPPELEMENTARY as supplementary status');
assert.ok(batch04.find(row => row.id === 'knruhs-a233b89b90d7-p1-q1').question.includes('(B) Lead pipe appearance'), 'Uppercase printed option labels retained');
assert.ok(batch04.find(row => row.id === 'knruhs-d71bdffc81ee-p2-q11').question.includes('(3+3+4+5)'), 'All clinical subparts/marks retained');
console.log('PASS Batch04:203occurrences,8complete papers/800marks,3split papers with50marks per part,all320options and original labels.');

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH05: batch05 } = await bundle('src/data/universityPapers/reviewedBatch05.ts');
assert.equal(batch05.length, 203);
const papers05 = new Map();
for (const row of batch05) {
  assert.equal(row.year, 'final');
  const entries = papers05.get(row.sourceSha256) ?? [];
  entries.push(row); papers05.set(row.sourceSha256, entries);
  assert.ok(!/Short Answer Questions:|Very Short Answer Questions:|Essay.*Questions:|Max Marks/.test(row.question));
  if (row.questionFormat === 'mcq') {
    assert.deepEqual(row.options.map(o => o.label.toLowerCase()), ['a', 'b', 'c', 'd']);
    for (const option of row.options) assert.ok(row.question.includes(`(${option.label}) ${option.text}`));
  }
}
assert.equal(papers05.size, 8);
for (const entries of papers05.values()) {
  const split = entries[0].paperNumber === 'II';
  assert.deepEqual(entries.map(r => Number(r.sourceQuestion)), Array.from({ length: split ? 26 : 25 }, (_, i) => i + 1));
  assert.equal(entries.reduce((sum, r) => sum + r.marks, 0), 100);
  assert.equal(entries.filter(r => r.questionFormat === 'mcq').length, 10);
  if (split) for (const part of ['A', 'B']) {
    const group = entries.filter(r => r.examPart === part);
    assert.equal(group.length, 13);
    assert.equal(group.reduce((sum, r) => sum + r.marks, 0), 50);
  }
}
assert.equal(batch05.filter(r => r.subjectKey === 'general-surgery').length, 128);
assert.equal(batch05.filter(r => r.subjectKey === 'paediatrics').length, 75);
const matchTriage = batch05.find(r => r.id === 'knruhs-b33dcb2a2fee-p1-q4');
assert.ok(matchTriage.question.includes('4. Black — D. Simple fracture') && matchTriage.options[0].text === '1-A, 2-C, 3-D, 4-B', 'Matching table numbering must not truncate the MCQ');
assert.equal(batch05.find(r => r.id === 'knruhs-f6d8f58b79ab-p2-q10').pdfPage, 2);
assert.ok(batch05.find(r => r.id === 'knruhs-f6d8f58b79ab-p1-q1').examRefs[0].includes('May/Jun 2024'), 'Printed two-month session survives filename hint');
assert.equal(batch05.find(r => r.id === 'knruhs-bd28d022a706-p1-q5').options[3].text, 'Weight in gms / height in cm³');
assert.equal(batch05.find(r => r.id === 'knruhs-3392389ba4dd-p1-q8').options[0].text, '36.5°C');
assert.ok(batch05.find(r => r.id === 'knruhs-d710f14304e6-p2-q25').question.includes('Branchial Plexus'), 'Printed anomaly retained');
assert.ok(batch05.find(r => r.id === 'knruhs-837f71107a3f-p2-q19').question.includes('(1+1+1+2+3+2+3+2)'));
console.log('PASS Batch05:203occurrences,8complete papers/800marks,3split papers,matching table,cross-page MCQs,visible superscripts and May/Jun session.');

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH06: batch06 } = await bundle('src/data/universityPapers/reviewedBatch06.ts');
assert.equal(batch06.length, 200);
const papers06 = new Map();
for (const row of batch06) {
  assert.equal(row.year, row.subjectKey === 'biochemistry' ? 'first' : 'final', 'Printed phase retained');
  const group = papers06.get(row.sourceSha256) ?? [];group.push(row);papers06.set(row.sourceSha256, group);
  assert.ok(!/Short Answer Questions:|Very Short Answer Questions:|Essay.*Questions:|Max Marks/.test(row.question));
  if (row.questionFormat === 'mcq') {
    assert.deepEqual(row.options.map(o => o.label), ['a', 'b', 'c', 'd']);
    for (const option of row.options) assert.ok(row.question.includes(`(${option.label}) ${option.text}`));
  }
}
assert.equal(papers06.size, 8);
for (const entries of papers06.values()) {
  assert.deepEqual(entries.map(r => Number(r.sourceQuestion)), Array.from({length:25}, (_, i) => i + 1));
  assert.equal(entries.reduce((sum,r) => sum + r.marks, 0), 100);
  assert.equal(entries.filter(r => r.questionFormat === 'mcq').length, 10);
}
assert.equal(batch06.filter(r => r.subjectKey === 'obstetrics-gynaecology').length, 150);
assert.equal(batch06.filter(r => r.subjectKey === 'biochemistry').length, 50);
const corpus = batch06.find(r => r.id === 'knruhs-13c1c04b6fa2-p1-q2');
assert.equal(corpus.options[2].text, '3 days after ovulation', 'An option beginning3 must not become question3');
assert.equal(corpus.options[3].text, '8-9 days after ovulation');
assert.equal(batch06.find(r => r.id === 'knruhs-13f6d292ef91-p2-q10').options[3].text, 'Lumber', 'Printed typo retained');
assert.equal(batch06.find(r => r.id === 'knruhs-1c7ce8b30a7f-p1-q9').options[0].text, 'Ck₁', 'Visible subscript retained');
assert.equal(batch06.find(r => r.id === 'knruhs-1c7ce8b30a7f-p2-q10').options[0].text, 'Amyl nitrate');
assert.ok(batch06.find(r => r.id === 'knruhs-0bec15b4e0e4-p2-q11').question.includes('Blood glucose = 380 mg%'));
assert.ok(batch06.find(r => r.id === 'knruhs-9bb1c7a0ff7f-p2-q9').options[2].text.includes('life-long'));
assert.ok(batch06.find(r => r.id === 'knruhs-76678ad73b63-p2-q12').question.includes('(2+3+4+6)'));
console.log('PASS Batch06:200occurrences,8complete papers/800marks,80MCQs/320options,printedphase/papernumbers,numericoptions and cross-page provenance retained.');

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH07: batch07 } = await bundle('src/data/universityPapers/reviewedBatch07.ts');
assert.equal(batch07.length, 500);
const papers07 = new Map();
for (const row of batch07) {
  assert.equal(row.year, row.subjectKey === 'pharmacology' ? 'second' : 'first');
  const group = papers07.get(row.sourceSha256) ?? [];group.push(row);papers07.set(row.sourceSha256, group);
  assert.ok(!/Short Answer Questions:|Very Short Answer Questions:|Essay.*Questions:|Max Marks|Write an essay on the following:|Write briefly on the following:|\*\s*\*/.test(row.question));
  if (row.questionFormat === 'mcq') {
    assert.deepEqual(row.options.map(o => o.label), ['a','b','c','d']);
    for (const option of row.options) assert.ok(row.question.includes(`(${option.label}) ${option.text}`));
  }
}
assert.equal(papers07.size, 20);
for (const entries of papers07.values()) {
  assert.deepEqual(entries.map(r => Number(r.sourceQuestion)), Array.from({length:25},(_,i)=>i+1));
  assert.equal(entries.reduce((sum,r)=>sum+r.marks,0),100);
  assert.equal(entries.filter(r=>r.questionFormat==='mcq').length,10);
}
assert.deepEqual(Object.fromEntries(['biochemistry','anatomy','physiology','pharmacology'].map(s=>[s,batch07.filter(r=>r.subjectKey===s).length])), {biochemistry:100,anatomy:150,physiology:150,pharmacology:100});
const duplicateChoices=batch07.find(r=>r.id==='knruhs-4b1dea1077eb-p1-q6');
assert.equal(duplicateChoices.options[2].text, duplicateChoices.options[3].text, 'Printed duplicate choices remain separate choices');
const mammary=batch07.find(r=>r.id==='knruhs-8c52103eeecd-p2-q12');
assert.ok(mammary.question.includes('b) Gross anatomy c) Relations d) blood supply e) Lymphatic drainage f) Applied aspects. (2+3+2+2+3+3)'));
assert.equal(batch07.find(r=>r.id==='knruhs-e62fc51c6e06-p2-q13').originalSection, 'Write a short essay on the following');
assert.ok(batch07.find(r=>r.id==='knruhs-56149621f39a-p2-q11').question.includes('e) What could be the cause for visual defect.'));
const anaphylaxis=batch07.find(r=>r.id==='knruhs-b6cd50f0b87d-p1-q1');
assert.ok(anaphylaxis.examRefs[0].includes('Jan 2026') && anaphylaxis.options[2].text.includes('1:10000'));
assert.ok(batch07.find(r=>r.id==='knruhs-bf8470ea3fa7-p2-q11').question.includes('4+4+4+3 = 15'));
console.log('PASS Batch07:500occurrences,20whole papers/2000marks,200MCQs/800options,allclinicalsubparts,sourceheadings/duplicatechoices and phases retained.');

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH08: batch08 } = await bundle('src/data/universityPapers/reviewedBatch08.ts');
assert.equal(batch08.length, 1023);
assert.equal(batch08.filter(r => r.university === 'rguhs').length, 648);
assert.equal(batch08.filter(r => r.university === 'knruhs').length, 375);
const papers08 = new Map();
for (const row of batch08) {
  const paper = papers08.get(row.sourceSha256) ?? [];paper.push(row);papers08.set(row.sourceSha256, paper);
  assert.equal(row.year, row.university === 'rguhs' ? 'first' : 'second');
  assert.ok(!/FirstRanker|Page \d of|Max[.]? Marks|SHORT ESSAYS|LONG ESSAYS/.test(row.question));
  if (row.questionFormat === 'mcq') {
    assert.deepEqual(row.options.map(o => o.label.toLowerCase()), ['a', 'b', 'c', 'd']);
    assert.equal(row.marks, 1);
    for (const option of row.options) assert.ok(row.question.includes(`(${option.label}) ${option.text}`));
  }
}
assert.equal(papers08.size, 41);
assert.equal(batch08.reduce((sum, r) => sum + r.marks, 0), 3900);
assert.equal(batch08.filter(r => r.questionFormat === 'mcq').length, 300);
assert.equal(batch08.reduce((sum, r) => sum + (r.options?.length ?? 0), 0), 1200);
for (const paper of papers08.values()) {
  if (paper[0].university === 'knruhs') {
    assert.deepEqual(paper.map(r => r.sourceQuestion), Array.from({ length: 25 }, (_, i) => String(i + 1)));
    assert.equal(paper.reduce((sum, r) => sum + r.marks, 0), 100);
  } else {
    const mcqs = paper.filter(r => r.questionFormat === 'mcq');
    const numeric = paper.filter(r => r.questionFormat !== 'mcq');
    assert.ok([11, 20, 22].includes(numeric.length));
    assert.deepEqual(numeric.map(r => r.sourceQuestion), Array.from({ length: numeric.length }, (_, i) => String(i + 1)));
    assert.deepEqual(mcqs.map(r => r.sourceQuestion), mcqs.length ? ['21i','21ii','21iii','21iv','21v','22i','22ii','22iii','22iv','22v'] : []);
    assert.equal(paper.reduce((sum, r) => sum + r.marks, 0), numeric.length === 11 ? 50 : 100);
  }
}
assert.ok(!batch08.some(r => r.sourceSha256.startsWith('26a7492ec0ae')), 'Original22RGUHSrows must not be imported again');
for (const prefix of ['39f55126fa69','a7a194ce584a','3cd06e55f48e','c36328a5c697','d490d746141a','5b2825d51d20']) assert.ok(!batch08.some(r => r.sourceSha256.startsWith(prefix)), 'Alternate scans are source links, not new exam occurrences');
const alternative08 = batch08.find(r => r.id === 'rguhs-fc6c85e99007-p1-q3');
assert.ok(alternative08.question.includes('folic acid. Or Creatinine clearance test'));
assert.ok(batch08.find(r => r.id === 'rguhs-870a39ec37d0-p1-q4').question.includes('5.0 g/dl; 2.3 g/dl; 0.85:1'));
assert.ok(batch08.find(r => r.id === 'rguhs-b30d3ba0faf6-p1-q4').question.includes('305mOsm/kg') && batch08.find(r => r.id === 'rguhs-b30d3ba0faf6-p1-q4').question.includes('<1.005'));
assert.equal(batch08.find(r => r.id === 'rguhs-b30d3ba0faf6-p3-q22v').options[0].text, 'More than 30kg/m²');
assert.equal(batch08.find(r => r.id === 'knruhs-52f982a410a5-p1-q2').options[2].text, 'M bovis');
const crossing08 = batch08.find(r => r.sourceSha256.startsWith('355fba69bd4d') && r.sourceQuestion === '22iii');
assert.equal(crossing08.pdfPage, 2);assert.equal(crossing08.options[3].text, 'Rectum');
console.log('PASS Batch08:41whole papers,1023new occurrences,3900marks,1200options,roman-subnumber identities,clinical tables,groupedalternatives,crosspageoptions and alternate-scan exclusion.');

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH09: batch09 } = await bundle('src/data/universityPapers/reviewedBatch09.ts');
assert.equal(batch09.length, 1001);
assert.equal(batch09.reduce((sum,r)=>sum+r.marks,0),3979);
assert.equal(batch09.filter(r=>r.questionFormat==='mcq').length,157);
assert.equal(batch09.reduce((sum,r)=>sum+(r.options?.length??0),0),628);
const expected09 = {"dc4e153eb36ed4bf82ef64e2665487522dd31cba2b1ff818b0b508ac8f9d8ec4": [30, 100], "1a76097ff1cfa36ccca4278b3d8cc2a4c879730eaa1e9bea12aa569b1823bc1a": [30, 100], "fc3d6f773475ef6926e8094ea5d3c20984dd5503b88f2e8a866b10b257d7b236": [30, 100], "67544e17b5c680f7cfdb7d6368d6b3751b66565c3e73fee8c8142293148a979e": [30, 100], "8c43552ea4d520c5fe9ee7b84f5fe886ba4c1435d2c7aab92689505689d9e35e": [30, 100], "3f29db6b39e3225bf44480c2048a46939afe394b05025994fe14512240ed488c": [30, 100], "170b931883fa5e1c0d44add57a1d44b9fb3c65578c05c0b8ea51a7153759f50c": [29, 99], "912e754438d56b05013e29f24a4f73274892c49362f93f9b50e3341430dcb572": [29, 99], "287013b1b4fb60b4583fd26f80d6a7545a99c8ae08518949a8f012557845c8b0": [29, 99], "8c0841b08755c5101e80d3e7e98f7fcd8d0f55ce880b244241e26b73f2cbdd39": [22, 100], "c164a661fc4836037951cea12ec23f24dcb6b90c7da07a6599819c34d32207a3": [22, 100], "f55dbadd6d407613faa3aa20b363eb19d100686c6a6e14803a90cda417602299": [21, 95], "fb5ca248ca9d491c168a131cb629adfd15b2b16f89a385ec88ac02d3a569403e": [22, 100], "c7db2e7f27f7a4d55e51c4ce392fab1494510187bf7b37101cbfe1fa6067ef99": [22, 100], "8dcd2a0ef98f6a8f5588696f68307d2951d7f82a288d9a364e7b5455ee14bd13": [22, 100], "f4d5c578ec43bb7b2c254e6cea8e0e1e2cd1c6a09d4afb15a1f5c9879125021e": [22, 100], "217cd75be9687022c2a1929f4900b0509dbadf35bb9ee6a6f498af0aace3e667": [22, 100], "226082563f70cbcac6a230123afaca2a48340837022c03f76512653730857804": [22, 100], "63055d0ced9b8ec50d97ed0113809c3e7e249c648809818ec2400f071bce3f0b": [11, 50], "e2be6443e1ed98f6944b5f31dcd0c76aab4c199bab2905802e4737b14d84ac69": [11, 50], "bf55b016dbf013aa67f2ba2bdc7c8a391f4c82fae5a182a7e9ef79a9565f1709": [22, 100], "f41e4e349bc3b0bb3b2368e2fbf913fac78dfc5f270d95bbcf02fff90402b060": [22, 100], "de1291e8ef4c83d4dcf9fcee0ba70166c7f82efab85ff43e55d73888020c98ec": [22, 100], "6a5cddd7222b74e1bd7f54d201ed1b9d986d282ffd29e7463abd7568184e3cf4": [22, 100], "7199b900275c427bfb2255aa8d39e007adb08ef13526fac9f83e9cdd011eaedb": [20, 92], "73eb95b42be43a4a42077b898e5482deb247e8c39ba5e0938ee540e5d242a361": [22, 100], "8b7f4f6c844680a71c858a3ec8cf9b89b6ce5b720a20ef1baa5081e8bf716ef7": [21, 95], "b14b8b811e1724def6047bcbccdf025224217732a10d91e96e099b3de563bec7": [30, 100], "a7ab0f70c0d55c34ecc8b46b332642d19284a7d926dd65c29155ce562bf707de": [30, 100], "50dacbf02efd9f5e2c37b7e4442b80beb932fa7b9dec36e48771a5e9143e8266": [30, 100], "d3a0bc4dc8fb2b7c3df129bfe9f0561ad349558eccefad184a3b2bd7ee301332": [30, 100], "882207ad5fea1345db0dc0bfac21a6e04efffcaf65110ca258a1596bbf9f5f64": [30, 100], "41ea37fd25271b2c4f0e7d75291ee9941ab5a4872073d9eb87af875c05662d3b": [30, 100], "07f9fbfbd1eddb99c18ccd76af54352bbadf51d8b71191af19c25c5e56c7f8eb": [22, 100], "50e72c94b49b85ad3b456acc407973ad4644da45e3b11da435ed910bdd0db8db": [22, 100], "d0c2a9329e4fbec282cfe7c6971718a3a594e331fc2682f6ddadfdecc59a2082": [22, 100], "6508c3aae4a91ecc4410f883f647f2c937c5d77c2224bcf2a420a3cbb3b7a544": [22, 100], "dd6e22a8e9c7978af9e27d434905b8d01cb6c208f76b0fc014f8926a77d71191": [22, 100], "b5a19a5f691fc0ea94fe32754226011149e819fb38ed70e8cfbe64e59ffcc33a": [22, 100], "2e86c65b1added05a999204418546039327d7e704cd9d87018ceaf94cd5be04c": [22, 100], "b6612656bd5f7d4d5951725a392c7856ee2429d92b26079af37eac7e768e1797": [30, 100]};
const groups09 = new Map();
for (const row of batch09) {
 assert.equal(row.university,'rguhs');
 assert.equal(row.year, ['anatomy','physiology','biochemistry'].includes(row.subjectKey)?'first':'second');
 const group=groups09.get(row.sourceSha256)??[];group.push(row);groups09.set(row.sourceSha256,group);
 assert.ok(!/FirstRanker|Page [0-9] of|Max[.]? Marks|SHORT ESSAYS|LONG ESSAYS/.test(row.question));
 if(row.options){assert.deepEqual(row.options.map(o=>o.label),['A','B','C','D']);for(const o of row.options)assert.ok(row.question.includes(`(${o.label}) ${o.text}`));}
}
assert.equal(groups09.size,41);
for(const [sha,[count,marks]] of Object.entries(expected09)) { const group=groups09.get(sha);assert.equal(group.length,count);assert.equal(group.reduce((s,r)=>s+r.marks,0),marks); }
for(const [sha,q] of [["170b931883fa5e1c0d44add57a1d44b9fb3c65578c05c0b8ea51a7153759f50c", "22i"], ["912e754438d56b05013e29f24a4f73274892c49362f93f9b50e3341430dcb572", "22i"], ["287013b1b4fb60b4583fd26f80d6a7545a99c8ae08518949a8f012557845c8b0", "21v"], ["f55dbadd6d407613faa3aa20b363eb19d100686c6a6e14803a90cda417602299", "5"], ["7199b900275c427bfb2255aa8d39e007adb08ef13526fac9f83e9cdd011eaedb", "7"], ["8b7f4f6c844680a71c858a3ec8cf9b89b6ce5b720a20ef1baa5081e8bf716ef7", "12"], ["7199b900275c427bfb2255aa8d39e007adb08ef13526fac9f83e9cdd011eaedb", "14"]]) assert.ok(!batch09.some(r=>r.sourceSha256===sha&&r.sourceQuestion===q),'Incomplete source units must remain held');
const double15=batch09.filter(r=>r.sourceSha256.startsWith('3f29db6b39e3')&&r.sourceQuestion.startsWith('15'));
assert.equal(double15.length,2);assert.ok(double15[1].id.endsWith('q15b'));assert.equal(double15[1].sourceQuestion,'15 (second printed occurrence)');
const mixed09=batch09.filter(r=>r.sourceSha256.startsWith('f55dbadd6d40'));
assert.equal(mixed09.length,21);assert.ok(mixed09.every(r=>r.subjectKey==='physiology'&&r.pdfPage===1),'Do not duplicate Anatomy pages in mixed bundle');
assert.ok(batch09.find(r=>r.id==='rguhs-dc4e153eb36e-p1-q1').question.includes('Or Define Blood Pressure.'));
const fourPage09=batch09.find(r=>r.id==='rguhs-1a76097ff1cf-p4-q22v');assert.ok(fourPage09.options.length===4);
const lft09=batch09.find(r=>r.id==='rguhs-c7db2e7f27f7-p1-q4');assert.ok(lft09.question.includes('7.7 mg/dl')&&lft09.question.includes('13.6 mg/dl'),'Preserve contradictory printed values without clinical correction');
assert.deepEqual(batch09.filter(r=>r.subjectKey==='forensic-medicine').map(r=>r.sourceQuestion),Array.from({length:22},(_,i)=>String(i+1)));
console.log('PASS Batch09:1001 complete units,41sources/70contributing pages,3979marks,157MCQs/628options,sevenheldomissions,double15identity,groupedalternatives and mixed-bundlepage dedup.');

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH10: batch10 } = await bundle('src/data/universityPapers/reviewedBatch10.ts');
assert.equal(batch10.length,1012);
assert.equal(batch10.reduce((sum,r)=>sum+r.marks,0),3984);
assert.equal(batch10.filter(r=>r.questionFormat==='mcq').length,170);
assert.equal(batch10.reduce((sum,r)=>sum+(r.options?.length??0),0),680);
const expected10={"6afd9a51143d1985ae535d51f0d7eee7f1df3a50af83536f834274a3fae6dd0d": [30, 100], "29c7950372ac975072b2c5416a8778379fa5c43f4159470586a7936a7f7f1204": [30, 100], "371dbcffaa5f35ecfb37d1a63739cfed481702a9363ec3fa21770c9652c24252": [30, 100], "8f3b1646df24bad561915acc0144672b35e02bf8f0055a39d128bb2190a10db5": [30, 100], "3815f59f627cd1e87bfdb9ff3991fcfc05964e0cece7bb8ffa3adf1fbcc365a0": [30, 100], "ae18df1bf6ad883e7dc2127eb92b44f99ed8cac1d53ff7e2058a642a62339e10": [30, 100], "093a461a93ba9e7822645a0cde2b27069789a695a50a7873e431b9dca0de77b0": [22, 100], "c2e7c5f469365066d8263d3634f254a423b6bc810afbee3b9dcf917d62869774": [22, 100], "942383725e34869f458561de71797a34cbf0df5d02c46e2f73fd2927c92c19b7": [22, 100], "26b36e0a7a7ab9d19f2c929308ff0439072e7d4257fcb1f177a9bf79a9836924": [21, 97], "60a9d56a231d873588e708ae3c1624ba739c5c920b7a89feb6b85a088dfc0f22": [22, 100], "8db0c455b027a1463c5e3670c0d75f19a51ff1f1eec22ef55094dc17139bdaa7": [22, 100], "83d5fb0b63994b659f46a8664ba7e4aed83c75bf5439655b38666d3f995bb254": [22, 100], "a0d1807cc437a3e317e953940129bddc724fe9135101863b9ba7c7fa9ca6fa31": [22, 100], "a2a0f2f8a12184f2a172ca8b6a7cd084f69e438a425518f170750b2c56682bbe": [22, 100], "b3f058fd2efc316fbe53f367ff042b634e70d446927e3a53af0bc371610e5244": [30, 100], "de58fc7fc6622190ac62f215e8e1956818e9492c5e54e896530553a51d6c84ff": [30, 100], "c15f572406671b89f06c5376443f44183c9dfb61b468db247c6096dc896ec4c8": [30, 100], "8075d7fdaeaed1b98082d89749b97df0d050ec6f314b3749a16e059ef9ef1b11": [30, 100], "0b9d7cc9db3a1b4f23579076b0119a154b38e645a99f199f7b21b75a42edeff8": [30, 100], "255b75504f5b3441f68aed95c350e2ac9c72af9a3084ae840805cd39e05c9ddb": [30, 100], "6100df590db7df28bc4f19aa427ad988c82bdc984fc358938cac09f3fd8fb134": [30, 100], "9794b46203d9e6faaa872154674f925231fe2620003356697cdba0331f84096d": [30, 100], "f8ab536570201cf3c47f1fdbb39da1a1e35160bd30c65d7fa7ac335950b78e60": [19, 87], "cce07cded03575d685315959e1821845619a34500711eec66bc82476e4c57750": [22, 100], "e17378553b2c44b5c8bdc2a2649118d7f58068f83684919a26ef50e9b58dc93b": [22, 100], "dafa9ea7c42f1a1363ae67e2e57376b8c4e9a5f9fbde2c8107ab289f7faec6bd": [22, 100], "c8dc5c3b854c618d83795c9497b4ab58604cbe3dd159c9e584390f7e106bb0bf": [22, 100], "aa895cf27a257d32f1dd51dc921b3c19366ea500803071f33624430204955358": [22, 100], "20e99a17c2b496bcf1fbf1b1f410584a7dd60483e150e0c98db5ce21335cdabb": [22, 100], "edd2faad4de15442d3ccc69d0719f86d1506cb61f2096ca5b5fe510c0919e20c": [22, 100], "94705ea86f1df2bce2f814b5a7c77dc10a8a5497284a1f515e94dc1db0a1bc42": [22, 100], "764314376aaf5923c99642748f7451083dc599916f9077797c0dfcdb4defa646": [22, 100], "3a3f8015f0aac013f99b1753a1c6433d363921d6d38d26b82005f466dcb1c0ae": [22, 100], "3ce4501a8ee023e29a32e77313386448d4e90e01ec28652b7fe6982e648ffce1": [22, 100], "9b12b170a1e026cfff466bbcc20b925ebf9c8995a8ba3f3aab1f3568d9fa7669": [22, 100], "97235a56e0713d75deaea98fb0852f378948b3ff232af2e5a276cfd969014bb0": [30, 100], "fa9ccd35f22647403c4501b69824e09cb3c982ed8ce3dff2800d913d6a50c84d": [30, 100], "ff794afcf106686cf0db5ad61da5b9139c60abf1a15b1994da1edb4295e17752": [22, 100], "44c0c13c738dc61f3b040d1feb28516b1f4467a79415595ad02dd98f694cb167": [30, 100]};
for(const [sha,[count,marks]]of Object.entries(expected10)){const group=batch10.filter(r=>r.sourceSha256===sha);assert.equal(group.length,count);assert.equal(group.reduce((s,r)=>s+r.marks,0),marks);}
for(const row of batch10){
 assert.equal(row.university,'rguhs');
 assert.equal(row.year,['ophthalmology','ent','community-medicine'].includes(row.subjectKey)||(row.subjectKey==='forensic-medicine'&&row.examRefs[0].includes('24 Nov 2025'))?'third':'second');
 assert.ok(!/FirstRanker|Key Answer|LONG ESSAYS|SHORT ESSAYS/.test(row.question));
 if(row.options){assert.deepEqual(row.options.map(o=>o.label),['A','B','C','D']);for(const o of row.options)assert.ok(row.question.includes(`(${o.label}) ${o.text}`));}
}
for(const [sha,q]of [["26b36e0a7a7ab9d19f2c929308ff0439072e7d4257fcb1f177a9bf79a9836924", "22"], ["f8ab536570201cf3c47f1fdbb39da1a1e35160bd30c65d7fa7ac335950b78e60", "20"], ["f8ab536570201cf3c47f1fdbb39da1a1e35160bd30c65d7fa7ac335950b78e60", "21i"], ["f8ab536570201cf3c47f1fdbb39da1a1e35160bd30c65d7fa7ac335950b78e60", "21ii"], ["f8ab536570201cf3c47f1fdbb39da1a1e35160bd30c65d7fa7ac335950b78e60", "21iii"], ["f8ab536570201cf3c47f1fdbb39da1a1e35160bd30c65d7fa7ac335950b78e60", "21iv"], ["f8ab536570201cf3c47f1fdbb39da1a1e35160bd30c65d7fa7ac335950b78e60", "21v"], ["f8ab536570201cf3c47f1fdbb39da1a1e35160bd30c65d7fa7ac335950b78e60", "22i"], ["f8ab536570201cf3c47f1fdbb39da1a1e35160bd30c65d7fa7ac335950b78e60", "22ii"], ["f8ab536570201cf3c47f1fdbb39da1a1e35160bd30c65d7fa7ac335950b78e60", "22iii"], ["f8ab536570201cf3c47f1fdbb39da1a1e35160bd30c65d7fa7ac335950b78e60", "22iv"], ["f8ab536570201cf3c47f1fdbb39da1a1e35160bd30c65d7fa7ac335950b78e60", "22v"]])assert.ok(!batch10.some(r=>r.sourceSha256===sha&&r.sourceQuestion===q),'Incomplete units remain held');
assert.ok(!batch10.some(r=>r.sourceSha256.startsWith('567abe33450f')),'Alternate scan181must not add duplicate occurrences');
assert.equal(batch10.find(r=>r.sourceSha256.startsWith('371dbcffaa5f')&&r.sourceQuestion==='22v').pdfPage,2,'Cross-page MCQ begins on page2');
assert.equal(batch10.find(r=>r.sourceSha256.startsWith('6100df590db7')&&r.sourceQuestion==='22ii').pdfPage,2,'Cross-page optionD retains stem page2');
assert.equal(batch10.find(r=>r.sourceSha256.startsWith('8db0c455b027')&&r.sourceQuestion==='18').pdfPage,2);
assert.equal(batch10.find(r=>r.sourceSha256.startsWith('83d5fb0b6399')&&r.sourceQuestion==='18').pdfPage,2);
const clinical10=batch10.find(r=>r.sourceSha256.startsWith('8075d7fdaeae')&&r.sourceQuestion==='10');assert.ok(clinical10.question.includes('150/90 mm of Hg'));
assert.ok(batch10.find(r=>r.sourceSha256.startsWith('764314376aaf')).examRefs[0].includes('Dec 2013'),'Printed2013overridesOCR2015');
assert.ok(batch10.find(r=>r.sourceSha256.startsWith('97235a56e071')&&r.sourceQuestion==='2').question.includes('e) Create a treatment plan'));
console.log('PASS Batch10:1012complete units,40sources,3984marks,170MCQs/680options;12missing/obscured units held;22alternate-scan occurrences excluded; cross-page options/clinical subparts retained.');

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH11: batch11 } = await bundle('src/data/universityPapers/reviewedBatch11.ts');
assert.equal(batch11.length, 1026);
assert.equal(batch11.reduce((sum, r) => sum + r.marks, 0), 4500);
assert.equal(batch11.filter(r => r.questionFormat === 'mcq').length, 50);
assert.equal(batch11.reduce((sum, r) => sum + (r.options?.length ?? 0), 0), 200);
const papers11 = Map.groupBy(batch11, r => r.sourceSha256);
assert.equal(papers11.size, 47);
for (const entries of papers11.values()) {
  const shortPaper = ['1095', '1096'].some(code => entries[0].examRefs[0].includes(`Code ${code}`));
  const cbme = entries[0].examRefs[0].includes('CBME');
  const writtenCount = shortPaper ? 10 : cbme ? 20 : 22;
  assert.deepEqual(entries.filter(r => r.questionFormat !== 'mcq').map(r => Number(r.sourceQuestion)), Array.from({ length: writtenCount }, (_, i) => i + 1));
  assert.equal(entries.reduce((sum, r) => sum + r.marks, 0), shortPaper ? 50 : 100);
  if (cbme) assert.deepEqual(entries.filter(r => r.questionFormat === 'mcq').map(r => r.sourceQuestion), ['21i','21ii','21iii','21iv','21v','22i','22ii','22iii','22iv','22v']);
  for (const r of entries) {
    assert.ok(!/www\.|FirstRanker|LONG ESSAY|SHORT ESSAY|Max. Marks|Page \d/.test(r.question));
    if (r.options) {
      assert.deepEqual(r.options.map(o => o.label), ['A','B','C','D']);
      for (const o of r.options) assert.ok(r.question.includes(`(${o.label}) ${o.text}`));
    }
  }
}
for (const prefix of ['f993e66c7281','72d444832aed','8e7414ad7b32']) assert.ok(!batch11.some(r => r.sourceSha256.startsWith(prefix)), 'Alternate scans and unattributed paper must not inflate the bank');
const q11 = (sha, q) => batch11.find(r => r.sourceSha256.startsWith(sha) && r.sourceQuestion === q);
assert.equal(q11('cdd2e23a74e8','21i').pdfPage, 1, 'Cross-page MCQ group starts on actual page1');
assert.equal(q11('cdd2e23a74e8','21ii').pdfPage, 2);
assert.equal(q11('d76fe40fc278','21iv').options[2].text, 'VII nerve involvement', 'OCR dropped the second I; preserve actual printed choice');
assert.equal(q11('82439f54d753','22').question, 'Triad of GERD.', 'Obscured footer must be transcribed from original pixels, not guessed');
assert.ok(q11('b74a078d49f7','7').question.includes('population of 900'));
assert.ok(q11('d9523b3a51f6','21').question.includes('mechanism of action and two important side effects'));
assert.ok(batch11.some(r => r.question.includes('Pyrogenic meningitis')), 'Printed wording remains literal');
assert.ok(batch11.some(r => r.examRefs[0].includes('Corrections') && r.question.includes('Or Classify renal tumours.')));
assert.ok(q11('de62cac91db9','16').question.includes('Or Course of ureter'), 'Alternatives remain grouped with original number');
console.log('PASS Batch11:1026 units,47 examinations,4500marks,50MCQs/200options;4half-papers,roman sequencing,footer transcription,grouped alternatives,cross-page provenance and exclusions.');

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH12: batch12 } = await bundle('src/data/universityPapers/reviewedBatch12.ts');
assert.equal(batch12.length,1015);
assert.equal(batch12.reduce((sum,r)=>sum+r.marks,0),4723);
assert.equal(batch12.filter(r=>r.options).length,108);
assert.equal(batch12.reduce((sum,r)=>sum+(r.options?.length??0),0),432);
const expected12 = {"b709cf9e59b34769b066e45e1845478a0dbbc7afe39d7bdc3370b844bcb63d94": [10, 50], "9bf3fdc76ad1449644816895299b9ae1c94cd354e282337b14929d39219f35b4": [10, 50], "aff3b94ae5384c418f4d2f74ae6f085076192cf3528858f7b6646a71249fdcc4": [22, 100], "814841cf01a017c8dbbc0bfb3bbe6d082db7654f1a84909bcb11a76c6e968da6": [10, 50], "5c70a6ef06d22aabad5eb9998ec63785e682f49b15eb1846cd342b33f7c822fe": [10, 50], "20439afd6967a5a7516df579a92e723de53b61fde482d93b880d8810a56a532a": [22, 100], "5710557000e192082aed9cce6e1b1a031c5c78b81ddbf8cf536b12efdee1a992": [25, 100], "a7a804b9d716418c5a94302a9024721360ea1b9ca9634c818dd219f5b9c7c77b": [12, 40], "11cf7cb62e64a8423a2e6d6b06d16eb80ca05094c8f984cd087365c8e034d49a": [25, 100], "454c318336876c827defba107074ef3d00da0aaf02ffb4135b73a5956ff56c72": [25, 100], "336cd1b4ca0d4deba13b6759e24c6d7c7ce8eb46deef2f2644458a047c4737d2": [25, 100], "2aa6e3efd266fcb5b4d2fbddfc803d16043de63b8d8d3ebb52afb31af076cf12": [20, 100], "fefbf2fc755e74d6ab1997834c165351e690d828b1f85d2b0893ada4ca937c4e": [21, 115], "ed50c381c4c6648c35aef3fb2f8df22c77d9409fae73bd69acb9d19b4e742bcc": [20, 100], "76148fa27297b8a4126a79a288e312e1578b881cb121484ed2ec410cdeb9d6bb": [10, 70], "8103983f6c1e01f0335bc7427dad863b1c1090649fc0c459cb9f8641b1a8b856": [20, 100], "e813d5506a85eae79057b39c2f0957687ecadd65af584c78f48c27f360a434b9": [20, 100], "e78b0e68d63d7001ad18a8800a3b87375fef750525753c0ae74463dffd935af4": [20, 100], "9a12d96e8b48f9f99c8a35e5605eefc8d10f921b48eff10435e8ff27b3d165da": [20, 100], "3f0a8de2759cdfc058d6c8db3cff806115a0ffb6e5cc3c48c00a4827de70afa3": [12, 50], "82f306eeb13f448ed39a35c66f458dc1ea8cecf1bd3064b709d520ea9ed40a4b": [12, 50], "b0c858d17af0654075083761e317aa708b36aec057df7a9e51de09a7c66c29a9": [12, 50], "f8e67f3705de9d47d730e5eb07b187f7d926926028474c29809649e0068f005a": [12, 50], "85bc48374b292af5ba72cac69849d815a2e876e57ebbc3e88301c824852cb0c1": [12, 50], "21160f85438fd8335711859518bbee9bf7f8cb2c53ba49312e16559f39479faa": [25, 100], "86c30b2e8485ed31b37ae2010dfe9a89320e14ce9cfd3374ef7b52da7519418c": [25, 100], "00326b5130dedcf343443d711da418afaeb1cbdfe024312483ae777a87a0420e": [20, 100], "f1dcbba464cd5f7c7b1373dd25f08a44b1b7cd82a69014def7636585d9f7c2a5": [20, 100], "65d7fd3d41ae18d912e36ecafd8a68e5dded62049c60f5dc98403c1bf46279a4": [20, 100], "dbd1271a54d516535962702d295d2b98aac1bcbe8ca8b085d96e8c9c676dbcfd": [20, 100], "93d2fa03289f31723ebec33fe82aa90603cf059a795a64146cd11e371fb2622c": [20, 100], "c772eddb79cb37d0fd1dfa26fb7c7c97a2134520f0b83f5250a0308757fe7f68": [20, 100], "3a438dc762f148c9cc5cc8e7fc87971b551c64dd103fb27c0d713258f188aee1": [20, 100], "bf4c3827091b774e1a512b4a604cc6d24f71cb81a434311361e89dbb24740241": [20, 100], "bec55d39fd4f84f1b995c64be823428ffe92654922f89750d5c1fecd390bc9f3": [12, 50], "87ab0dd2335d30816e3d30dc0f973507a06c007d7311efd9429e30f5dd10c11f": [12, 50], "a2a2261c6d41a36a3ee6350633a398a31b0a91871e74654073d02876f55daf1d": [12, 50], "d6d2fbe0fb8c6d992f9a7f1b318862fa99f361a8ff0ee99034c6dcfa3b21924f": [20, 100], "c67ef571fb3cfe0e2f84403c141094173d5f57577ae691780d0f2cd533a8a1fe": [20, 100], "c0327879e82ca458e78bed0bc0e73b8f957724d27dbe9d4405eed99f3aa53561": [20, 100], "f85f08901c23205e1bb3bb612f295c0e25fb3695c9aacfd671f42495b21552d7": [20, 100], "2eae7e92a40e4364b2700d87f5133a1fdd2649dec8bc888cb2d4bf16036198e7": [20, 100], "9365b23dd7beac213216bd2af704ac3f5ab6ad465aa9d4d360a00b6f3c644d22": [20, 100], "0fa190a5285b9cc9b935e6a0c3e25f05544c2a5a09eaff6cb73cebbdb81430b7": [20, 100], "69dee65335f3def2b2f6704ba732baf78a9d803b9442c81b65afa10ffc1315c6": [20, 100], "f8c87d3bede84eead0850797386b9ceb69b69ca21fc75129b78a5384669aeb9b": [12, 50], "ef049a0306ab03ae15ce1464ea905c987d5ae898361d31b3a94c5428d792219b": [12, 50], "cd2df02754e0161dab302da6d1fc9a59d3e944e12b2e794c9742d401011fb905": [24, 99], "849c49c1498ae1a85e024620912e1afa5161fca85522ebb54c90a384b718185d": [24, 99], "c013a2e3f6c7c0b0a9a7e4c50b4db1c64e3cf8af19a1f3d41f469f9ab33d22d4": [25, 100], "3f63415154be72cd2f13852e6939065c975ebf0d030ab0cf4f37826bf58a2f15": [25, 100], "9bdcdea6d4b8a807552917f5d76fbde33f8c006de319de0a65d148d05239312b": [20, 100], "375f9c968ac911341eae1a8298580b8dd7298fa4fdb2e04dd715f3b6491e7160": [20, 100], "6b12a1d0c14540ff2edc8a7a3f8627dec2194905890cceded150b596f05b494c": [20, 100], "e8e59be64df37ebaf49a02fb4c2b5943451bc8190d13497c2b45f74e168c3321": [20, 100]};
const papers12=Map.groupBy(batch12,r=>r.sourceSha256);
assert.equal(papers12.size,55);
for(const [sha,entries] of papers12) {
 assert.deepEqual([entries.length,entries.reduce((sum,r)=>sum+r.marks,0)],expected12[sha]);
 for(const r of entries) {
  assert.ok(!/Ranker|www\.|\brecom\b|following:|Max. Marks/.test(r.question));
  if(r.options) {assert.equal(r.options.length,4);assert.equal(new Set(r.options.map(o=>o.label)).size,4);for(const o of r.options)assert.ok(r.question.includes(`(${o.label}) ${o.text}`));}
 }
}
assert.ok(!batch12.some(r=>r.sourceSha256==="a7a804b9d716418c5a94302a9024721360ea1b9ca9634c818dd219f5b9c7c77b" && r.sourceQuestion==="13"));
assert.ok(!batch12.some(r=>r.sourceSha256==="a7a804b9d716418c5a94302a9024721360ea1b9ca9634c818dd219f5b9c7c77b" && r.sourceQuestion==="14"));
assert.ok(!batch12.some(r=>r.sourceSha256==="a7a804b9d716418c5a94302a9024721360ea1b9ca9634c818dd219f5b9c7c77b" && r.sourceQuestion==="15"));
assert.ok(!batch12.some(r=>r.sourceSha256==="a7a804b9d716418c5a94302a9024721360ea1b9ca9634c818dd219f5b9c7c77b" && r.sourceQuestion==="16"));
assert.ok(!batch12.some(r=>r.sourceSha256==="a7a804b9d716418c5a94302a9024721360ea1b9ca9634c818dd219f5b9c7c77b" && r.sourceQuestion==="17"));
assert.ok(!batch12.some(r=>r.sourceSha256==="a7a804b9d716418c5a94302a9024721360ea1b9ca9634c818dd219f5b9c7c77b" && r.sourceQuestion==="18"));
assert.ok(!batch12.some(r=>r.sourceSha256==="a7a804b9d716418c5a94302a9024721360ea1b9ca9634c818dd219f5b9c7c77b" && r.sourceQuestion==="19"));
assert.ok(!batch12.some(r=>r.sourceSha256==="a7a804b9d716418c5a94302a9024721360ea1b9ca9634c818dd219f5b9c7c77b" && r.sourceQuestion==="20"));
assert.ok(!batch12.some(r=>r.sourceSha256==="a7a804b9d716418c5a94302a9024721360ea1b9ca9634c818dd219f5b9c7c77b" && r.sourceQuestion==="21"));
assert.ok(!batch12.some(r=>r.sourceSha256==="a7a804b9d716418c5a94302a9024721360ea1b9ca9634c818dd219f5b9c7c77b" && r.sourceQuestion==="22"));
assert.ok(!batch12.some(r=>r.sourceSha256==="a7a804b9d716418c5a94302a9024721360ea1b9ca9634c818dd219f5b9c7c77b" && r.sourceQuestion==="23"));
assert.ok(!batch12.some(r=>r.sourceSha256==="a7a804b9d716418c5a94302a9024721360ea1b9ca9634c818dd219f5b9c7c77b" && r.sourceQuestion==="24"));
assert.ok(!batch12.some(r=>r.sourceSha256==="a7a804b9d716418c5a94302a9024721360ea1b9ca9634c818dd219f5b9c7c77b" && r.sourceQuestion==="25"));
assert.ok(!batch12.some(r=>r.sourceSha256==="76148fa27297b8a4126a79a288e312e1578b881cb121484ed2ec410cdeb9d6bb" && r.sourceQuestion==="11"));
assert.ok(!batch12.some(r=>r.sourceSha256==="76148fa27297b8a4126a79a288e312e1578b881cb121484ed2ec410cdeb9d6bb" && r.sourceQuestion==="12"));
assert.ok(!batch12.some(r=>r.sourceSha256==="76148fa27297b8a4126a79a288e312e1578b881cb121484ed2ec410cdeb9d6bb" && r.sourceQuestion==="13"));
assert.ok(!batch12.some(r=>r.sourceSha256==="76148fa27297b8a4126a79a288e312e1578b881cb121484ed2ec410cdeb9d6bb" && r.sourceQuestion==="14"));
assert.ok(!batch12.some(r=>r.sourceSha256==="76148fa27297b8a4126a79a288e312e1578b881cb121484ed2ec410cdeb9d6bb" && r.sourceQuestion==="15"));
assert.ok(!batch12.some(r=>r.sourceSha256==="76148fa27297b8a4126a79a288e312e1578b881cb121484ed2ec410cdeb9d6bb" && r.sourceQuestion==="16"));
assert.ok(!batch12.some(r=>r.sourceSha256==="76148fa27297b8a4126a79a288e312e1578b881cb121484ed2ec410cdeb9d6bb" && r.sourceQuestion==="17"));
assert.ok(!batch12.some(r=>r.sourceSha256==="76148fa27297b8a4126a79a288e312e1578b881cb121484ed2ec410cdeb9d6bb" && r.sourceQuestion==="18"));
assert.ok(!batch12.some(r=>r.sourceSha256==="76148fa27297b8a4126a79a288e312e1578b881cb121484ed2ec410cdeb9d6bb" && r.sourceQuestion==="19"));
assert.ok(!batch12.some(r=>r.sourceSha256==="76148fa27297b8a4126a79a288e312e1578b881cb121484ed2ec410cdeb9d6bb" && r.sourceQuestion==="20"));
assert.ok(!batch12.some(r=>r.sourceSha256==="cd2df02754e0161dab302da6d1fc9a59d3e944e12b2e794c9742d401011fb905" && r.sourceQuestion==="2"));
assert.ok(!batch12.some(r=>r.sourceSha256==="849c49c1498ae1a85e024620912e1afa5161fca85522ebb54c90a384b718185d" && r.sourceQuestion==="9"));
assert.deepEqual(batch12.find(r=>r.id==="knruhs-11cf7cb62e64-p1-q1").options.map(o=>o.label),["a", "c", "b", "d"]);
assert.deepEqual(batch12.find(r=>r.id==="knruhs-cd2df02754e0-p3-q9").options.map(o=>o.label),["a", "e", "b", "d"]);
assert.ok(batch12.find(r=>r.id==="knruhs-fefbf2fc755e-p1-q2b").question.includes("arches of foot"));
assert.ok(batch12.find(r=>r.id==="knruhs-8103983f6c1e-p2-q19a").question.includes("cornea"));
assert.ok(batch12.find(r=>r.id==="knruhs-8103983f6c1e-p2-q19b").question.includes("cleft palate"));
assert.ok(batch12.find(r=>r.id==="knruhs-f1dcbba464cd-p1-q11a").question.includes("lipid profile"));
assert.ok(batch12.find(r=>r.id==="knruhs-f1dcbba464cd-p2-q11b").question.includes("Oxidative phosphorylation"));
assert.ok(batch12.find(r=>r.id==="knruhs-e8e59be64df3-p2-qa1").question.includes("Pertussis"));
assert.ok(batch12.find(r=>r.id==="knruhs-e8e59be64df3-p2-qa2").question.includes("Cerebral Malaria"));
assert.ok(batch12.find(r=>r.id==="knruhs-86c30b2e8485-p3-q11").question.includes("serum - 12 mg/dL"));
console.log('PASS Batch12:1015 units,55 contributing examinations,4723marks,108MCQs/432options; repeated printed numbers, missing-label holds, mixed-tail holds, all cross-page subparts and genuine examination repeats.');

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH13: batch13 } = await bundle('src/data/universityPapers/reviewedBatch13.ts');
assert.equal(batch13.length,1015);
assert.equal(batch13.reduce((sum,r)=>sum+r.marks,0),4556);
assert.equal(batch13.filter(r=>r.options).length,56);
assert.equal(batch13.reduce((sum,r)=>sum+(r.options?.length??0),0),224);
const expected13 = {"39cbb6dfe789d5696813c8e321ed00868a7b0f7cc71a276e1eec00c128aa3a1f": [12, 80], "9039b33081858c76f7a7eb85d2825d1257cf48ea0c58471ca183dc5cdfa48660": [12, 80], "6cde83218b53fbcf9d09add25dd8557f70d0c660687d37dbb7d7498bea93b72b": [20, 90], "0f55ab167d50e2214d8711dd81b2d34a018c1401d75c9c7f7ee86fbce16de398": [20, 90], "99b4db6dee99f00114f751fe213c5956324235f783318f6cb042d8cd23f24b1a": [20, 100], "3ece0ccf88fedd706ac7a03b3e72f9640811804e34d34865bf70c7ae7fb62b6a": [20, 100], "db44df0937f2467ad1bdbd345551de8c8ba7f15006999c34235be5071b21eeec": [11, 40], "e9256320937a87e0457a73840c588dc4966e524bef7397b08fcf69919ee8f2a2": [11, 40], "ee244d19365ec3053f9429aa0fbd5528e1b468cc6016a4401127b9c3bf41f5f4": [11, 40], "10a26032c77015707bbbde74bc0f35c063e756b4e6358220df1c76fa75dd436e": [11, 40], "3e6072d0e7e4704342ee87e63964d95b75febb3b1e20bf1d42ee5510159f25b4": [10, 30], "4d39f3754b1de4960177e321e826db79d3f508cf747d4e84bd093fb4b860084a": [22, 97], "df5776d3d79a213054741a8e09c5394d55c668ab23ba9b1843ff73b050391b98": [25, 100], "059ef1f7f197fcd75f134b66811c9bba10a6a47fe37521eb65fdf719384a6cf1": [20, 100], "38429556789f66a86a3796fbfe47db555c908d8112340f8fd0447e47cfa50ff7": [20, 100], "6ea0620051d37e70fba66c2fdf57eff84e9b4218b01a727c2dbba1787e2e40d9": [12, 80], "61dbdcd48f7408f2f4d28528fd26d7a308017ff5121637a97e625bd0ba367ae4": [12, 80], "9d3f2bd642dfb792c526b0d05856f7009aada9cced3c54cb3bb25c5f20a5e649": [20, 100], "4a4653aae42360491bfd07fafea79749052aedd28bba3f2bc1a82f6701d2d0a3": [20, 100], "cdee4db328c6e355d7c18679db2547df01d14846dc6bb86fb5c879741b02b423": [20, 100], "ceab002fd23430674895579154e88a870a42628f80ce7329acb02de3c204b718": [20, 100], "7a0405438ac0b73616ba81ba73c927372e592c01d23eafa2c648675b7fd9f0dd": [11, 40], "7725cdf861568197b2536e87e46d70b8e886c6774e8821d65652f8f30a06a7a3": [11, 40], "65150043bbb4f2426ad8cb849dd5edf8e76e71e1236dba1d0ec969fe24690916": [11, 40], "df146d64614fca2c927595a29c65429744668ee9e182e2cc9605dd9ca49da96d": [11, 40], "ea45d02257573ef4e3ad6a56f3697b462f6b105f5ea34cd9d67bca944aca2481": [11, 40], "64c5d95239c7602f6248daad17b3a72436a522a33fc0b040e499e4d473a2dff3": [11, 40], "6228c6ca222be523506dc0a6f88d93996df324ec7c93e5572c2c8bd7204e0370": [11, 40], "77738936a8d95ffda03ad3420f39a854ec1dc10f34170737e9395facc28c5814": [11, 40], "7a4696da9e4581aa6f21625ba4d7b1edb6a96b502e0e21c31fea8a4edf975b3e": [11, 40], "7e2fc20b5e646c0d2fdcd841eb6aebbdc67b1c3a237a598d28b342b5be25e8c2": [25, 100], "049002aad52434d7c5e15e686d5a7fd0da8d4222900f59edb8c04293e47a5df7": [25, 100], "ab26140c6c703af43ffa8b97bf309c9b59f78a71198f0fa0647fc57cfed68f42": [25, 100], "eae5c2ac123cab1f66d2c56dd6059fcb37803ac8907dce9efdbfa11e8cd056ef": [11, 40], "2a9a799f40ff52c72c6434f26c5746601926466c193ee86ba13ef92a325228e8": [21, 70], "2049bfd7beb962672937ab2c645289ab160c82f56cf7317167eae2cd5666c7b7": [22, 80], "170c808b417af964646fc5aa1532db968af2a351bda6affef9cf4df845e04206": [22, 80], "4466180812d79eac00d818051efba5991a6ce442357a8a2f82c079e6ffbe5683": [22, 80], "c9738006124a3faf3c9ccb756855aefb836b4936e43cc564a2c49b0ff3a9b306": [24, 99], "7185fb8b1a3e71b524be71d85be5c8c3d91bfbb9e03202385ca7d3d111d8fbb3": [11, 40], "4fd23adddeba55fabb1edb6fbc12f93d6edadbfa837e590bc7996090898b9486": [11, 40], "efca99555a9a62fdf950462c46d2733440510e1ee97500b7412dd668284578a1": [22, 80], "d8a8632a5b92609e611d849510ab5d554cde3703ef55d75873f516a3a37cbf9d": [22, 80], "125464dbf7fbc4ab4bba292362426673177cc78e37ebd12a6128e29b9dee250d": [20, 100], "78994aaf7270a2027419376fc784ef5cd473cbf4966a119dd297983d0a1f8f7a": [20, 100], "2cffbcf525e524f2ad8fe3d8909c9ab1e2ed7aa8dd9524dfeb7640b0651d790a": [12, 60], "a5366484ff107a687e0f21927274cadadc11f9b8eb25ff616a3466a3af9029e4": [12, 60], "136b4dc127a6f3002381cbe67928ddd3349cb6ddae9128aa8f5a98e536f594fa": [12, 60], "e52220762b2cf465cf6a23d403f60df414f46e5eecc8561e9e8bf10335218c44": [12, 60], "3da3b86afffe33d7ef55c23ad6ff596fe18948b351e3a818ca55fe70f3e28087": [12, 60], "d5a145770a416d32bf5b2705f952bc1dc43faaaf704e7d3147c108effd470a2f": [12, 60], "59d4857ba3c0ef32b8cc3614352ce97567ff55d399ae01b7385d138b7e47297f": [12, 60], "6d750ed50c46f5a2c68ccf92709ebe0dd861b26606254c4601b7fac71893647b": [12, 60], "66269ce7b51ac106de45ead73f0357d6d7c2c2312a60d04cb609672183bffe05": [12, 60], "7213a7110c8bbf6ba8ebb211d1191131121322792648961e9761d91ed7cc4c39": [12, 60], "9c4cf9ccb9de323e49395b6f46ec64c1c009776a7e322588ae35a179cac4f99b": [24, 120], "a11493aeaed6070006815afcc40ea94c80dca855a25b636e26193377998dc9c0": [24, 120], "6224d1bfd390839b5de2ec1e07428d91a79bbde480b7d07384c3ec9f7590a4ed": [24, 120], "972a27fd7abd1a65d7b5491c0af48e36a54ec8434659f8e147674a044fa4355b": [24, 120], "dc18cc6ad34d0710bef418583e479226e9aeeb328f872303136a6549635b56fb": [24, 120], "f5e803ca6aa8f24c28f1648acd78802ffb41a81c7f3e51c7bc68a6e3c1692acd": [24, 120]};
const papers13=Map.groupBy(batch13,r=>r.sourceSha256);
assert.equal(papers13.size,61);
for(const [sha,entries] of papers13) {
 assert.deepEqual([entries.length,entries.reduce((sum,r)=>sum+r.marks,0)],expected13[sha]);
 for(const r of entries) {
  assert.ok(!/Ranker|www\.|\brecom\b|following:|Max. Marks|PART[ -]+[AB]/.test(r.question));
  if(r.options) {assert.equal(r.options.length,4);assert.equal(new Set(r.options.map(o=>o.label.toLowerCase())).size,4);for(const o of r.options)assert.ok(r.question.includes(`(${o.label}) ${o.text}`));}
 }
}
assert.ok(!batch13.some(r=>r.sourceSha256==="3e6072d0e7e4704342ee87e63964d95b75febb3b1e20bf1d42ee5510159f25b4" && r.id.endsWith('-q'+"1")));
assert.ok(!batch13.some(r=>r.sourceSha256==="4d39f3754b1de4960177e321e826db79d3f508cf747d4e84bd093fb4b860084a" && r.id.endsWith('-q'+"3")));
assert.ok(!batch13.some(r=>r.sourceSha256==="4d39f3754b1de4960177e321e826db79d3f508cf747d4e84bd093fb4b860084a" && r.id.endsWith('-q'+"4")));
assert.ok(!batch13.some(r=>r.sourceSha256==="4d39f3754b1de4960177e321e826db79d3f508cf747d4e84bd093fb4b860084a" && r.id.endsWith('-q'+"9")));
assert.ok(!batch13.some(r=>r.sourceSha256==="2a9a799f40ff52c72c6434f26c5746601926466c193ee86ba13ef92a325228e8" && r.id.endsWith('-q'+"1l")));
assert.ok(!batch13.some(r=>r.sourceSha256==="c9738006124a3faf3c9ccb756855aefb836b4936e43cc564a2c49b0ff3a9b306" && r.id.endsWith('-q'+"4")));
assert.ok(!batch13.some(r=>r.sourceSha256==="195438a3420ed59f1541b81ce731112cbee448dbf99811d801a36fad8a839139"));
assert.ok(!batch13.some(r=>r.sourceSha256==="8ac934083f1425aac4b6ddbc5bc90c08314dd7d46a4324db0c802dbc0156581c"));
assert.ok(!batch13.some(r=>r.sourceSha256==="aad7ce8676f70caa6cb8936a03611a14e852180c8ab6188e6c4f535ae3d2cbeb"));
assert.ok(!batch13.some(r=>r.sourceSha256==="d1684fc3d74918adda85cbb5fca99cc2a1c271c4194204c7aa552777b6923a21"));
assert.ok(!batch13.some(r=>r.sourceSha256==="36eb93f04fe844c9b205cdc03deddd16921506d6254478ac50bff6d5dd16fb2e"));
assert.ok(!batch13.some(r=>r.sourceSha256==="250550082aa70725ca57eaf20e7b1a007d5ce84b07a2952e2b60fafd720e94e9"));
assert.ok(!batch13.some(r=>r.sourceSha256==="96e1a8ffaf74c4c8b506dcadeaec0b8f1e92516705db87d5206a4586d1c37d75"));
assert.ok(!batch13.some(r=>r.sourceSha256==="7434ded967c9b2e085914ffde75c9ca1f00b82ec28fb12e9508de8fe07cbe1b0"));
assert.ok(!batch13.some(r=>r.sourceSha256==="81ac49e1965e233c64e832e212d565ee8196f5f383c6c1f9d435e1a9c7754b0d"));
assert.ok(!batch13.some(r=>r.sourceSha256==="15b9b1544da882d2029d387e8471286ed4f5f2f0395e1d39b248a49dbdb382de"));
assert.ok(!batch13.some(r=>r.sourceSha256==="1620a3eedc207254540493facd61a60ceafb6c8a7e0c9cb2eefabca3be2c0141"));
assert.ok(!batch13.some(r=>r.sourceSha256==="c29012e4fcdaec692e06ffc054fa8c6fb0f758a68233d4643dacd96b28dd329c"));
assert.ok(!batch13.some(r=>r.sourceSha256==="425c29c5a2a0b8ca1684541be3816907ee955ed564d020dc133ad6141ff3f711"));
assert.ok(!batch13.some(r=>r.sourceSha256==="efa8d1bb04ec28352f9cac72bc1df36cca0f083339200cf65a440bba36064f36"));
assert.ok(!batch13.some(r=>r.sourceSha256==="725bab20151c8e696be33c041686ffa1850d8bea856aab07044b76fa360c9cd5"));
assert.ok(!batch13.some(r=>r.sourceSha256==="091c00598186df2be3f7aa02ebe2a58a9c5e71b8ea5ceec87d767fbc1a9b0f8e"));
assert.ok(batch13.find(r=>r.id==="ntruhs-39cbb6dfe789-p1-q1").question.includes("List the vaccine"));
assert.ok(batch13.find(r=>r.id==="ntruhs-9039b3308185-p1-q2").question.includes("Enumerate the prevention"));
assert.ok(batch13.find(r=>r.id==="knruhs-99b4db6dee99-p2-q14a").question.includes("Koch's"));
assert.ok(batch13.find(r=>r.id==="knruhs-99b4db6dee99-p2-q14b").question.includes("Candidiasis"));
assert.ok(batch13.find(r=>r.id==="knruhs-65150043bbb4-p1-q1").question.includes("2. What is your diagnosis?"));
assert.ok(batch13.find(r=>r.id==="knruhs-df146d64614f-p1-qa").question.includes("atheroma"));
assert.ok(batch13.find(r=>r.id==="knruhs-7e2fc20b5e64-p2-q10").question.includes("Snack"));
assert.ok(batch13.find(r=>r.id==="knruhs-c9738006124a-p1-q1").question.includes("(a) One- Voice"));
assert.ok(batch13.find(r=>r.id==="ntruhs-f5e803ca6aa8-p1-q12r").question.includes("Indian Red Cross"));
assert.equal(batch13.find(r=>r.id==="knruhs-6cde83218b53-p1-q1").marks,10);
assert.equal(batch13.find(r=>r.id==="knruhs-0f55ab167d50-p1-q1").marks,10);
assert.equal(batch13.find(r=>r.id==="ntruhs-2a9a799f40ff-p1-q1r").examRefs[0],"Feb 2018 \u00b7 Examination \u00b7 Code Not printed \u00b7 Not specified");
assert.equal(batch13.find(r=>r.id==="ntruhs-efca99555a9a-p1-q1l").examRefs[0],"Feb 2019 \u00b7 Examination \u00b7 Code Not printed \u00b7 Not specified");
assert.equal(batch13.find(r=>r.id==="ntruhs-d8a8632a5b92-p1-q1r").examRefs[0],"Feb 2016 \u00b7 Examination \u00b7 Code Not printed \u00b7 Not specified");
assert.equal(batch13.find(r=>r.id==="ntruhs-9c4cf9ccb9de-p1-q1r").examRefs[0],"Jul 2019 \u00b7 Examination \u00b7 Paper II \u00b7 Code Not printed \u00b7 Not specified");
assert.equal(batch13.find(r=>r.id==="ntruhs-a11493aeaed6-p1-q1l").examRefs[0],"Feb 2018 \u00b7 Examination \u00b7 Paper I \u00b7 Code Not printed \u00b7 Not specified");
assert.equal(batch13.find(r=>r.id==="ntruhs-f5e803ca6aa8-p1-q12r").examRefs[0],"Jan 2014 \u00b7 Examination \u00b7 Paper II \u00b7 Code Not printed \u00b7 Not specified");
console.log('PASS Batch13:1015 units,61 source PDFs,4556 marks,56 MCQs/224 options; printed NTR/YSR attribution, column-specific dates/papers, repeated numbers, historical legal wording, whole-unit holds and alternate examination scans.');

// Original-page-verified OCR glyph corrections, preserving source anomalies.
assert.ok(batch13.find(r=>r.id==="knruhs-6cde83218b53-p1-q6").question.includes("Type III"));
assert.ok(batch13.find(r=>r.id==="knruhs-99b4db6dee99-p2-q10").question.includes("Type I"));
assert.ok(batch13.find(r=>r.id==="knruhs-3ece0ccf88fe-p1-q2").question.includes("e. Elaborate"));
assert.ok(batch13.find(r=>r.id==="knruhs-059ef1f7f197-p1-q11").question.includes("Type III"));
assert.ok(batch13.find(r=>r.id==="knruhs-049002aad524-p2-q6").question.includes("(a) Homicide"));
assert.ok(batch13.find(r=>r.id==="knruhs-049002aad524-p2-q7").question.includes("(b) Close shot"));
assert.ok(batch13.find(r=>r.id==="knruhs-c9738006124a-p2-q6").question.includes("(a) Perilymph"));

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH14: batch14 } = await bundle('src/data/universityPapers/reviewedBatch14.ts');
assert.equal(batch14.length,1008);
assert.equal(batch14.reduce((s,r)=>s+r.marks,0),3189);
assert.equal(batch14.filter(r=>r.options).length,273);
assert.equal(batch14.reduce((s,r)=>s+(r.options?.length??0),0),1092);
const q14=(n,q)=>batch14.find(r=>r.sourceSha256===source14[n] && r.id.endsWith('-q'+q));
const source14={"398": "b4507601fb3539795f1b77db98bf6380bbb915033d12ec5ed67a628b144673c3", "403": "e43fbd21d959355424913141dabdfe0cc9bde45b691c6e9374a09c520819f9b8", "406": "111c5c296ee15d32ba0b234eefe1b315b122fd8eb4baea2b5753c0c4f2779aaf", "413": "c7f02cc0a9b365f5c6a0af6ffe389680899e1b500bd3c6341ef415f2d1e05e23", "510": "59106d9929fbfbfc160170a322ea94a9ed019b0c4aa060cf21e988cffdce2537", "513": "79c06ce41b0c2eaec19f13f7d40c4107bcf57ee0803eaf9dc1943555b610b81a", "517": "b7ecff9c28fc879fbe9a26bf46d0d2c5de168c35b58a1bd48b3ad0ddf91056e9", "521": "6df8e390df428bef504d5ae9f8d8610a580d597d763bd89a750c1f21e45656e5", "522": "446de7a6dbca70f838d52b9c13c85b444d68045759594bc4d8e0dee9101768c0", "523": "774318bcff31fadbe1184233f23de20ccbe309a2d3628103b54eede2ac8f112e", "524": "70e44b5a24d7ac891ec979d396ca9da3d0e51a71dae5d742924ebc1d36520327", "540": "2df4813f13a6a8f7f592b67be9a8cedea0e6b17c784a2855f5741cb169f30222", "541": "0977f69e714dcf516c8bc3c61035fb40d40df7821847b308d3525f0579a6a8c9", "571": "43d91731af39b982c404073ff38be0130c928c64d433e0139dbcb81f5ff4dc1d"};
assert.ok(q14(403,'13').question.includes('11.8 g/dl'));
assert.ok(q14(406,'2').question.includes('urine osmolality is 40'));
assert.ok(q14(413,'9').examRefs[0].includes('Part B'));
assert.ok(q14(398,'1l').examRefs[0].includes('Aug 2011'));
assert.ok(q14(521,'5a').question.includes('Diarrheagenic'));
assert.ok(q14(521,'5b').question.includes('Helicobacter'));
assert.ok(q14(523,'1').question.startsWith('A 6 years'));
assert.ok(q14(523,'2').question.includes('e. Write a note on treatment and prevention'));
assert.ok(!q14(523,'7'));assert.ok(q14(523,'13'));
assert.equal(q14(510,'19').options[0].text,'180 l');
assert.ok(!q14(510,'3'));assert.ok(!q14(513,'7'));assert.ok(!q14(513,'8'));assert.ok(!q14(513,'16'));
assert.ok(!q14(517,'2'));assert.ok(!q14(517,'8'));assert.ok(!q14(517,'9'));
assert.ok(!q14(522,'15'));assert.ok(!q14(524,'7'));assert.ok(!q14(524,'20'));
assert.ok(!batch14.some(r=>r.sourceSha256===source14[541]));
assert.ok(q14(540,'11').question.includes('Diabetes Insipidus'));
assert.ok(q14(571,'11').question.includes('Type IV'));
for(const r of batch14){
 assert.ok(!/Ranker|www\.|§X2|» Ei|Essay \/ Long Answer Questions|r ras|choige|tnechanisin/.test(r.question));
 if(r.options){assert.equal(r.options.length,4);assert.equal(new Set(r.options.map(o=>o.label.toLowerCase())).size,4);for(const o of r.options)assert.ok(r.question.includes(`(${o.label}) ${o.text}`));}
}
console.log('PASS Batch14:1008 units,273MCQs/1092options,3189marks; repeated/skipped numbering, cross-page clinical subparts, complete-option holds, duplicate exam exclusion and printed NTR/YSR dates.');

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH15: batch15 } = await bundle('src/data/universityPapers/reviewedBatch15.ts');
assert.equal(batch15.length,1014);assert.equal(batch15.reduce((n,r)=>n+r.marks,0),4588);assert.equal(batch15.filter(r=>r.options).length,330);assert.equal(batch15.reduce((n,r)=>n+(r.options?.length??0),0),1320);
const source15={"574": "e04db729c6ad6bd021fc54c36364fd7e026f77259820291e0e436a9edc678e83", "583": "8c16d0d75853ba1ede3a969adaed40fc117f21e4a5fa753e8e554ff1700c3cf7", "591": "2a174f5c1c88336a5a0c91770809af2c2414852dd8ee2865870e7d5809fe878c", "595": "e680b79e412471aa62ca22f4d841d78dcd20572de899e6ee461fb98ab6645425", "604": "29eda413623cb56845024039af9019b3dffab3f122ee28ef9105554d95b8cc64", "606": "ef321bd043cf8ebc5de80a87519aeb83c601feb6022520e5e10e4aaa58014426", "607": "debcab6db733841592435e85dee0340042d16df8f365fe4d039d45968324f625", "609": "0644d392c4e2a4b4ca45a84761d8a74623ef2c5490244f4fbf72fe872ccec36c", "610": "ea880f97f5f755d6c622dc448fb1ed53e04249a40eacbaa791c09c8f53db508a", "611": "7f3a40a51aee47e58f88549d182640a918d8c52d198146857913525c5079877a"};
const q15=(n,p,q)=>batch15.find(r=>r.sourceSha256===source15[n] && r.pdfPage===p && r.id.endsWith("-q"+q));
assert.ok(q15(574,1,'9').sourceQuestion.includes('Unnumbered'));
assert.ok(!q15(583,1,'1') && !q15(583,1,'2'));
assert.equal(q15(591,2,'11').question,'Submandibular Sialadenitis');
assert.ok(q15(595,1,'1').question.includes('recliner'));
assert.equal(q15(604,1,'2b').question,'Mammogram');
assert.ok(!batch15.some(r=>r.sourceSha256===source15[606]));assert.ok(!q15(607,2,'8'));
assert.equal((q15(609,3,'1a').question.match(/T2DM presented/g)||[]).length,2);
assert.ok(q15(610,10,'5vii').options[3].text.includes('medially, forwards'));
assert.ok(q15(611,22,'1').examRefs[0].includes('Mar–Apr 2025'));
assert.ok(q15(611,19,'3').question.includes('any five') && q15(611,19,'3').question.includes('g) Management of Irritable bowel syndrome'));
for(const r of batch15){assert.ok(!/Ranker|www\.|Max.?Marks|Time:/.test(r.question));if(r.options){assert.equal(r.options.length,4);assert.equal(new Set(r.options.map(o=>o.label.toLowerCase())).size,4);for(const o of r.options)assert.ok(r.question.includes(`(${o.label}) ${o.text}`));}}
console.log('PASS Batch15:1014 units,330MCQs/1320options,4588marks; complete clinical cases, cross-page questions, rotated options, mixed 2025/2026 headers and intact choose-any groups.');

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH16: batch16 } = await bundle('src/data/universityPapers/reviewedBatch16.ts');
assert.equal(batch16.length,1014);assert.equal(batch16.reduce((n,r)=>n+r.marks,0),4760);assert.equal(batch16.filter(r=>r.options).length,432);assert.equal(batch16.reduce((n,r)=>n+(r.options?.length??0),0),1728);
const source16={"612": "d170135deca921339f9c15881afeec808e27556e49262c66669e927223dc2311", "613": "fdeb155cbb33d1c7ad2035980c70fc6ce8e024b266a859a6b84faddeecae3057", "614": "8cc0c7d3c3d3911cfa81361ce949504466e50da19bdf143d5308c38e373c6e6f", "615": "a4f580b5e5ee62e364b2b55cc675a632731f5e1470e305923d03c9aac76adec2", "616": "c55c43250a6fbac89a1db82b5bb673ac445c4f40315b30f4d50573432f3aa952", "617": "ff96666ef6f34c2917c047565e05e9a09a6d71194f276b076fcd20468d37b8cf", "618": "d0644921c2cece2e47c75a41dfa4e83bb3410ed7182078e42e4242a237a363c9", "619": "d5988c3b36bc6c784efdf8a891184e8fc0a87d2659ea6ae2d4b63c8a9a0a7d41", "620": "b8683ba13a1f06f7a674ee3ca30ec40f9feadbd034486a933975e21375cf313c"};
const q16=(n,p,q)=>batch16.find(r=>r.sourceSha256===source16[n]&&r.pdfPage===p&&r.id.endsWith("-q"+q));
const repeated16={"wbuhs-d170135deca9-p6-q5viii": ["a", "b", "b", "d"], "wbuhs-8cc0c7d3c3d3-p8-q6vii": ["a", "b", "b", "d"], "wbuhs-a4f580b5e5ee-p5-q5ii": ["a", "b", "c", "c"], "wbuhs-c55c43250a6f-p19-q5ii": ["a", "b", "b", "d"], "wbuhs-d5988c3b36bc-p3-q5i": ["a", "b", "b", "c"], "wbuhs-d5988c3b36bc-p4-q5ix": ["a", "b", "b", "d"], "wbuhs-d5988c3b36bc-p12-q5x": ["a", "b", "b", "d"]};
for(const r of batch16){assert.ok(!/Ranker|www\.|Max.?Marks|Time:/.test(r.question));if(r.options){assert.equal(r.options.length,4);assert.ok(r.options.every(o=>o.text.length>0));if(repeated16[r.id])assert.deepEqual(r.options.map(o=>o.label),repeated16[r.id]);else assert.equal(new Set(r.options.map(o=>o.label)).size,4);for(const o of r.options)assert.ok(r.question.includes(`(${o.label}) ${o.text}`));}}
assert.equal(batch16.filter(r=>r.sourceSha256===source16[614]&&r.year==='first').length,174);
assert.ok(q16(612,12,'4e').question.includes('T₄ is preferred over T₃'));
assert.ok(q16(614,8,'6ix').question.includes('100'));
assert.equal(q16(615,5,'3a').sourceQuestion,'3(i)');
assert.equal(q16(619,5,'1b').sourceQuestion,'1(a) [second printed occurrence]');
assert.equal(q16(618,3,'4a').sourceQuestion,'2(a) [second printed 2]');
assert.ok(q16(616,3,'3').question.includes('any five')&&q16(616,3,'3').question.includes('g) Massive splenomegaly'));
assert.equal(q16(616,15,'1').examRefs[0],'Mar–Apr 2025 · Examination · Paper II · Code 016/25 · Old Regulation');
assert.ok(!batch16.some(r=>r.sourceSha256===source16[620]&&r.pdfPage>6));
console.log('PASS Batch16:1014 original-page-reviewed units,432MCQs/1728options,4760marks; first/second/third/final headers, printed repeated option/question labels, complete clinical cases, old choose-any groups and partial-bundle seam retained.');

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH17: batch17 } = await bundle('src/data/universityPapers/reviewedBatch17.ts');
assert.equal(batch17.length,1016);assert.equal(batch17.reduce((n,r)=>n+r.marks,0),5785);assert.equal(batch17.filter(r=>r.options).length,292);assert.equal(batch17.reduce((n,r)=>n+(r.options?.length??0),0),1168);
const source17={"620": "b8683ba13a1f06f7a674ee3ca30ec40f9feadbd034486a933975e21375cf313c", "621": "21439dbd4c267c481288eab94516b536f41d8461dcf8f545edd5df94a89f469e", "622": "1b03007380dcb7b5cce8292899434b4f2eb1a6787a36606d6db1f96d5fd49a2f", "623": "26c76aae484fbf3666a6b0c283ce97ceb122749890d697b257ca00647b9e6718", "624": "7d2797d6a70e517a27867e99f8c136ae1d4c0e7e8ffe77ceced294a0cd74de57", "625": "d1fa3f8124cdbe7f0a01040c67751c8e51428f8f71bd54b298d63e5e9b2c448b", "626": "ab5fa1e5afc42fbc0d9fd7269037394132589b5a0d68638af5e45ffceac60df9", "627": "416d5086a4a71c101fd74f2c710e30f299c0a6299cfa28034f92c18369c54c85", "628": "551176ba9e36ec42ac147c58dbb9de0d7e0e1d8f8f1c8474d80d1ded8dd294ab", "629": "8dffb9fec44b355c11406c1ee6443b6e1b673b5ddc288d0a9c279a854448515c", "630": "783e147b160c9b72091424bc5d7ae0bb62a2581e217f0e01a75028288f050807", "631": "6ebe0c59bb90d8a7950ecf0d581a70de67d1339bbaab7c4b5749f444e7f4a968", "632": "334abd8581b3142d274daeabdfc50da236b1c18eb4a2e90adae46dd0dd4a7037", "633": "fa22cd236b4b0d98c0de1c1293bdd9f18a60844b726601dfac65a20e23edc616", "634": "c5c1fbf0be362d5406dbe82d2e9bf8eac6412620a74c4de1470a2d04eee21987", "635": "8a68e13ebdd058b8a560fb9532845d8b71910778c14d0dc27c1bc9bf74c63b54", "636": "eb690fb98e74092b6443bc7d01d049df4a4db567e7f4c4e4fa02e0cdf96a7ca2", "637": "9d53b468b4b1124e59e225e3fcb4d66dc8f65a872e064eebe3d469a6712994e7", "638": "ff8ccbff113219102ca8b0ab786eb32dfaa27d5bf448d563a208312f71bc658e", "639": "362007910f0e929bbb66990ce79e1995d52c5cf991896878bd084baa20447df0", "640": "09c2b4508ffa41999e37e53376933ece430f3d1e6d02e380e0c649ded7adca64", "641": "3c480c245088ab9d485090905534f85ff051f077ffe3e70ae7ddb4e7cf11deca", "642": "cc811994a1634ab249a6f158cffb8bc7602c6319f596bbf55a0a6bb3fa718052", "643": "821b6c668d96bd6aba1d8a435c4ad6832d2eedf2c9c1dc3af4315acf0dc2a14c", "644": "1774d729e3d62110067ad1917480c6afad0e4fcba48b3a290c4ef50f0280bde6", "645": "df9e2a5689f5b34f5c0c2a1ab4a4207a0ba3befa30d234ac0cb2be2a3b02edc2", "646": "0ccc2f0a23cbf6b4633f874f0b65753e1b773395f237e8490f201d0e520945ee", "647": "de9f0e851cdd83e00a4f7301d93120c00c11a42fc6438e4c7a8ea059490cb77f", "648": "f3f7c5c27e0fc416f189c8b4805982d502c7564b60fbbb8febd7457f8458ba27", "649": "de6e37d562f82aecb9a167c49dc8229933a02bbc7dd27eafd13df279cd7de965", "650": "7c1594743ebf5b7bb53124767b74c22851402b27ea81b11ee90bd966691525a3", "651": "6da33e4ef5f788d6c789a5a7a831c142ae2bfabf9f5be72ac3f1974a2d3cc053", "652": "a8c8b4cdb14271e1f0c55ced24150606eb1e20eab00762df79d4a8fb66c597c5", "653": "7034dd9dc47cbc65011c4d3329ca39fc166de16cf29ad3c60788c32477fdb60c", "654": "64de52f0b15b400d135f6680820fe4194770a1c676cf9d35645b6e69b508ffbf", "655": "070ad197ac102a4438680d55996199ec5b8ab0cadc2f06bcc4b914816b4acc2a", "656": "749530a6761b8ddc597aeece3275517b8c91eef69fb350ce4ebc613d7cccb24f", "657": "b81d8bedcdba1b77c0a7f62b2bb92394cb9629cc630e872f5d2c478f19e776ce", "658": "dd87ba505997dbd3944935e0f80c8aac927627fc883d3f76f11e73591ed52455", "659": "c4312ef35bef859dbb0cf9b516516cfb960de1c06ddfc2792500284dc153151e", "660": "ca0bfa591a238db18c0c560d121ac8a395ee5705c2dfd9315c8c10a93f3baf42", "661": "475b87afb6595678bff539b4f6f749c6915bf6a93e84669077828a5cab7f25ee", "662": "1f6afc2e285a816c22cdd603af05ed1bbc1812c3429806b48631add95e32b7e3", "663": "ecce0625e325887682bc6f1730557d66aae5bd99e8f522a4c7d334548e1b0499", "664": "e8353537c0ef75b6172a39d0c24c5e9596c25ace01c320f3080dab59f84daf46", "665": "b8415e80a31bd7d7a0d038ae22e107eaaa97a5a835609d9499c8067bde332423", "666": "5ac53317426dda06b5eefd4bab03fc91826a678ea457ca47a153084fd8c7008b", "667": "0ada98f8d8b740e1678f6704e10294b54b0b6e95bd2f1082852af6e636aafe37", "668": "1b5e03478d6282fd194cbab22c96cbf7b02e4bfdaa6ce90d0fa088f45a98784a", "669": "baf263e9db810c5b9005473d4d375b018dfea854148a9590d24d4f76c7c43368", "670": "7b2ec4ba62c590fc6f9e5787461cfbcf66e0dbdb8c59ef9ce4e2166007ffec38", "671": "d4999479427c49c7e6eddd01e1c4667ff1e267e8f35bbf670085e26a56bd502a", "672": "45a623713b1d51a26fe65aedcb660cfcb21d75558478b91f479a2b7e1a762178", "673": "ac7f723487f3fd2a4e9f7ab31ee2610ef4d4787d82399c05786849744f436a2f", "674": "bd8245d2f943dbeb26021bff0b5cdc091d233580d51dd03618e376ddec6dc1c3", "675": "345105920bd62f2719fbf80a4c68e1207890a056e3d1791774af2882c065d91e", "676": "b4e1d08aa418e85c2d9e00acf03948c2f4e02841ee0e5819fc118109a43367af", "677": "3665f2d6afa403f4b78f92149818b80e5568339663866da4a417341460e26578", "678": "2aa7c07c507d23868083031e327f8708b0645f71f57f3430317b55273b128582", "679": "9984a3ec03a6488e508f9c66ecc261118609d573b777c40ce920c1e45bf710d2", "680": "df86704ada8f4c6bd539db29a19b238c91d3e0bb84aef9ba02e12216292d6da4", "681": "a22972651ca54e0d3b928cd4e1cc84d590f876fb696f7be2dfe5e28d4ba4cf3a", "682": "52996d301625db3b574e3012a43c7e8f409d34e38098c6d6dcfc1f93c95d1d9a", "683": "ae8125b355ce0546da0fa0064c9e2342fb4c90db9f82a882f1953d8c4740cc30", "684": "588258b8d32915c6cec6c3b4eaf190ab590107b2e4f8c5eba7bdd182e49497d2", "685": "63e2d609826fc1dc70c736ee3b2ed60acc8f5e21481c745b5b02cc88c61908a8", "686": "bb693953ba898e49faf25e1e02935ad1781af55fa897e1d292afd6a8f901147e", "687": "2c99391db954b5ab5912e0874c5a5fa902b0b171180d83cefc8504f21d03a05d", "688": "45db0b3e4d14a2c383b896fff63d77b45ccdd8c167514aab49ecff090c73f82c", "689": "d1a7ea0a941d9c21d934250214d4341d0d92e3a9b0c45b9a92e141ca1321d9f6", "690": "1b0be3df0b173eecadc7d40f42343530c4f9db1e19c0f5e58ade2879ec0edef8", "691": "4d48ec5033b407e9bdbbf7b1aa2e048dfaccfed369a7aef00b6e3d9bf3eb66f2", "692": "8487bf00e3be89e2b875d74e165b0c433fcd6fdc01619cde9b3477a2b0a3b745", "693": "4d5247485f2da6f6aa8c169e8c589f37d7f03c701bf3e3393ad8b1b175bcc93a", "694": "da8924098b223efec28ae8559904317326cb729086ea5fea5ca7a8dcab5fb3e5", "695": "c09dddcdbbdb63cfa3bd4bb5970aaa649de019cf56dbc467f5ee7e4d63fac502", "696": "cef9a24f6d2a9b49039ee53f5fea1050e2af330ce1c13b9309788ed41427f890", "697": "e5517420b1f09e25edd4e49982a0b5c5415f610a364127e17736137efc1b2d5c", "698": "6bec3bd3504d2843d4bf38c8289a1a7830dab88b56d76018b2466907f28d391f", "699": "3c82cbdd51cc39f085d46c933e0f24daead7a1fa32d879ab7cd68ed1798e607c", "700": "cc5c900091446be85fdb9715d0ce57e222d2578756177554f2150bca46f9a825", "701": "fd54db5b531109fb28bc097c60133f925f7d0f51385741a83ce8be7dde67bf10", "702": "05e7474e163e685958af3cec1c05c0d0045a52fb2a620e71396f69998d35a80d", "703": "56e608e37211d825d6086b7b494fa1f76abc8fa883f72531d698ea87a0b78b96", "704": "496251dec6a0dcb78f556ccbc104b05989a295b793eb9ce04871ba28d59e833e", "705": "f5681590423659a981b5937572ab61910ebfbea732e4c572653f70ba74e578b9", "706": "d19dcf381df7e3265f745bfa25caacf5307de3772f6bb9a669e55172c41f7772", "707": "294c85c55b6bebe13e0451d5e7d769c7bbad6cf074a0221c1cb0f831e74d56b2", "708": "3b0e557acfac0b18cdbc9b8f04c16a7c013a469accdef38e3731c96b6b6dfc99", "709": "2a64bc2b49a3cf02cd6dafc0b17e053826bcdfe8263e3ff1e37eb34b35e7c099", "710": "f54e5d25c24b0718861e5e5b223d82fc7148912d203cad956ed4c77bf34fc6fc", "711": "516b19932358375aa1b177de08c866ff915351414677ff12c37e837a86adf24f", "712": "d735fa0a6981b054b664fb5c632742324062b215229cd8bc3200f788d407e93f", "713": "7813db33c7ebb72352bcf3830f5cde297148c751077b9e3f7351adc30275e9d1", "714": "1ef13e68780c3742736751784ee6e5c0e5d5acd47c207b733094871e48130c44", "715": "efd88c63c6b6878835e1fc16e7e03b6c9d34d032df4b2941bc1cd119187def41", "716": "5686d2225ad0912035162d818fc13b5b3d89600387570da4d198c809901b169e", "717": "ec83c595802ec20fad57a0d64b2357f0e1839e265b0ed4200461c0dbf0119462", "718": "c3a64df3c4fae439f245acd0e3805ae6aefc81fd573d9eba2d1c129e41d1853a", "719": "9324b4c9ff96dc539f3f2c037f1d65a1b38273049b0754ad428d5979e6278c84", "720": "52735997baf9fa5bcf37c9a4ef1886e0ffe3231f55a326e2d5e357e79d50d672", "721": "4653f2662ce26cb683cd0d7537b95c120d508473f08c03bd1cdf32c5f2c7650a"};
const q17=(n,p,q)=>batch17.find(r=>r.sourceSha256===source17[n]&&r.pdfPage===p&&r.id.endsWith("-q"+q));
const repeated17={"wbuhs-b8683ba13a1f-p20-q5iii": ["c", "b", "c", "d"], "wbuhs-21439dbd4c26-p8-q5viii": ["a", "b", "b", "d"]};
for(const r of batch17){assert.ok(!/Ranker|www\.|Max.?Marks|Time:/.test(r.question));if(r.options){assert.equal(r.options.length,4);assert.ok(r.options.every(o=>o.text.length>0));if(repeated17[r.id])assert.deepEqual(r.options.map(o=>o.label),repeated17[r.id]);else assert.equal(new Set(r.options.map(o=>o.label)).size,4);for(const o of r.options)assert.ok(r.question.includes(`(${o.label}) ${o.text}`));}}
assert.ok(!batch17.some(r=>r.sourceSha256===source17[620]&&r.pdfPage<7));
assert.ok(!q17(621,7,'1a'));
assert.ok(q17(621,9,'2c').question.includes('7.72')&&q17(621,9,'2c').question.includes('2.5'));
assert.ok(q17(628,1,'1b').question.includes('palpable bony lump')&&q17(628,1,'1b').question.includes('golfers elbow'));
assert.equal(q17(641,1,'5').sourceQuestion,'5');assert.equal(q17(641,1,'6').sourceQuestion,'6');
assert.equal(q17(651,1,'4').sourceQuestion,'Unnumbered Group D');
assert.ok(q17(652,1,'1').examRefs[0].includes('Code 001/42'));
assert.ok(q17(713,2,'22ii').options.every((o,i)=>o.label==='ABCD'[i]));
assert.ok(q17(720,1,'6').question.includes('small proteins'));
const components17=[{"sha": "b8683ba13a1f06f7a674ee3ca30ec40f9feadbd034486a933975e21375cf313c", "date": "Mar–Apr 2024", "paper": "I", "subject": "general-medicine", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "b8683ba13a1f06f7a674ee3ca30ec40f9feadbd034486a933975e21375cf313c", "date": "Mar–Apr 2024", "paper": "I", "subject": "general-medicine", "reg": "Old Regulation", "count": 4, "marks": 60}, {"sha": "b8683ba13a1f06f7a674ee3ca30ec40f9feadbd034486a933975e21375cf313c", "date": "Mar–Apr 2024", "paper": "II", "subject": "general-medicine", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "b8683ba13a1f06f7a674ee3ca30ec40f9feadbd034486a933975e21375cf313c", "date": "Mar–Apr 2024", "paper": "II", "subject": "general-medicine", "reg": "Old Regulation", "count": 4, "marks": 60}, {"sha": "b8683ba13a1f06f7a674ee3ca30ec40f9feadbd034486a933975e21375cf313c", "date": "Mar–Apr 2024", "paper": null, "subject": "paediatrics", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "b8683ba13a1f06f7a674ee3ca30ec40f9feadbd034486a933975e21375cf313c", "date": "Mar–Apr 2024", "paper": null, "subject": "paediatrics", "reg": "Old Regulation", "count": 4, "marks": 40}, {"sha": "b8683ba13a1f06f7a674ee3ca30ec40f9feadbd034486a933975e21375cf313c", "date": "Mar–Apr 2024", "paper": "I", "subject": "general-surgery", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "b8683ba13a1f06f7a674ee3ca30ec40f9feadbd034486a933975e21375cf313c", "date": "Mar–Apr 2024", "paper": "I", "subject": "general-surgery", "reg": "Old Regulation", "count": 4, "marks": 60}, {"sha": "b8683ba13a1f06f7a674ee3ca30ec40f9feadbd034486a933975e21375cf313c", "date": "Mar–Apr 2024", "paper": "II", "subject": "general-surgery", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "b8683ba13a1f06f7a674ee3ca30ec40f9feadbd034486a933975e21375cf313c", "date": "Mar–Apr 2024", "paper": "II", "subject": "general-surgery", "reg": "Old Regulation", "count": 4, "marks": 60}, {"sha": "21439dbd4c267c481288eab94516b536f41d8461dcf8f545edd5df94a89f469e", "date": "Nov–Dec 2023", "paper": "I", "subject": "anatomy", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "21439dbd4c267c481288eab94516b536f41d8461dcf8f545edd5df94a89f469e", "date": "Nov–Dec 2023", "paper": "II", "subject": "anatomy", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "21439dbd4c267c481288eab94516b536f41d8461dcf8f545edd5df94a89f469e", "date": "Nov–Dec 2023", "paper": "I", "subject": "physiology", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "21439dbd4c267c481288eab94516b536f41d8461dcf8f545edd5df94a89f469e", "date": "Nov–Dec 2023", "paper": "II", "subject": "physiology", "reg": "New Regulation", "count": 21, "marks": 85}, {"sha": "21439dbd4c267c481288eab94516b536f41d8461dcf8f545edd5df94a89f469e", "date": "Nov–Dec 2023", "paper": "I", "subject": "biochemistry", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "21439dbd4c267c481288eab94516b536f41d8461dcf8f545edd5df94a89f469e", "date": "Nov–Dec 2023", "paper": "II", "subject": "biochemistry", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "1b03007380dcb7b5cce8292899434b4f2eb1a6787a36606d6db1f96d5fd49a2f", "date": "Sep 2022", "paper": "I", "subject": "pharmacology", "reg": "Old Regulation", "count": 4, "marks": 40}, {"sha": "1b03007380dcb7b5cce8292899434b4f2eb1a6787a36606d6db1f96d5fd49a2f", "date": "Sep 2022", "paper": "II", "subject": "pharmacology", "reg": "Old Regulation", "count": 4, "marks": 40}, {"sha": "1b03007380dcb7b5cce8292899434b4f2eb1a6787a36606d6db1f96d5fd49a2f", "date": "Sep 2022", "paper": "II", "subject": "pathology", "reg": "Old Regulation", "count": 4, "marks": 40}, {"sha": "1b03007380dcb7b5cce8292899434b4f2eb1a6787a36606d6db1f96d5fd49a2f", "date": "Sep 2022", "paper": "I", "subject": "pathology", "reg": "Old Regulation", "count": 4, "marks": 40}, {"sha": "1b03007380dcb7b5cce8292899434b4f2eb1a6787a36606d6db1f96d5fd49a2f", "date": "Sep 2022", "paper": "I", "subject": "microbiology", "reg": "Old Regulation", "count": 4, "marks": 40}, {"sha": "1b03007380dcb7b5cce8292899434b4f2eb1a6787a36606d6db1f96d5fd49a2f", "date": "Sep 2022", "paper": "II", "subject": "microbiology", "reg": "Old Regulation", "count": 4, "marks": 40}, {"sha": "1b03007380dcb7b5cce8292899434b4f2eb1a6787a36606d6db1f96d5fd49a2f", "date": "Sep 2022", "paper": null, "subject": "forensic-medicine", "reg": "Old Regulation", "count": 8, "marks": 40}, {"sha": "26c76aae484fbf3666a6b0c283ce97ceb122749890d697b257ca00647b9e6718", "date": "Mar–Apr 2022", "paper": "I", "subject": "general-medicine", "reg": "Unknown (not printed)", "count": 4, "marks": 60}, {"sha": "26c76aae484fbf3666a6b0c283ce97ceb122749890d697b257ca00647b9e6718", "date": "Mar–Apr 2022", "paper": "II", "subject": "general-medicine", "reg": "Unknown (not printed)", "count": 4, "marks": 60}, {"sha": "26c76aae484fbf3666a6b0c283ce97ceb122749890d697b257ca00647b9e6718", "date": "Mar–Apr 2022", "paper": "I", "subject": "general-surgery", "reg": "Unknown (not printed)", "count": 4, "marks": 60}, {"sha": "26c76aae484fbf3666a6b0c283ce97ceb122749890d697b257ca00647b9e6718", "date": "Mar–Apr 2022", "paper": "II", "subject": "general-surgery", "reg": "Unknown (not printed)", "count": 4, "marks": 60}, {"sha": "26c76aae484fbf3666a6b0c283ce97ceb122749890d697b257ca00647b9e6718", "date": "Mar–Apr 2022", "paper": null, "subject": "paediatrics", "reg": "Unknown (not printed)", "count": 4, "marks": 40}, {"sha": "26c76aae484fbf3666a6b0c283ce97ceb122749890d697b257ca00647b9e6718", "date": "Mar–Apr 2022", "paper": "I", "subject": "obstetrics-gynaecology", "reg": "Unknown (not printed)", "count": 4, "marks": 40}, {"sha": "26c76aae484fbf3666a6b0c283ce97ceb122749890d697b257ca00647b9e6718", "date": "Mar–Apr 2022", "paper": "II", "subject": "obstetrics-gynaecology", "reg": "Unknown (not printed)", "count": 4, "marks": 40}, {"sha": "7d2797d6a70e517a27867e99f8c136ae1d4c0e7e8ffe77ceced294a0cd74de57", "date": "Feb–Mar 2022", "paper": "I", "subject": "anatomy", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "7d2797d6a70e517a27867e99f8c136ae1d4c0e7e8ffe77ceced294a0cd74de57", "date": "Feb–Mar 2022", "paper": "II", "subject": "anatomy", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "7d2797d6a70e517a27867e99f8c136ae1d4c0e7e8ffe77ceced294a0cd74de57", "date": "Feb–Mar 2022", "paper": "II", "subject": "biochemistry", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "7d2797d6a70e517a27867e99f8c136ae1d4c0e7e8ffe77ceced294a0cd74de57", "date": "Feb–Mar 2022", "paper": "I", "subject": "biochemistry", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "7d2797d6a70e517a27867e99f8c136ae1d4c0e7e8ffe77ceced294a0cd74de57", "date": "Feb–Mar 2022", "paper": "I", "subject": "physiology", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "7d2797d6a70e517a27867e99f8c136ae1d4c0e7e8ffe77ceced294a0cd74de57", "date": "Feb–Mar 2022", "paper": "II", "subject": "physiology", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "d1fa3f8124cdbe7f0a01040c67751c8e51428f8f71bd54b298d63e5e9b2c448b", "date": "Jul–Aug 2021", "paper": null, "subject": "paediatrics", "reg": "Unknown (not printed)", "count": 4, "marks": 40}, {"sha": "d1fa3f8124cdbe7f0a01040c67751c8e51428f8f71bd54b298d63e5e9b2c448b", "date": "Jul–Aug 2021", "paper": "II", "subject": "obstetrics-gynaecology", "reg": "Unknown (not printed)", "count": 4, "marks": 40}, {"sha": "d1fa3f8124cdbe7f0a01040c67751c8e51428f8f71bd54b298d63e5e9b2c448b", "date": "Jul–Aug 2021", "paper": "I", "subject": "obstetrics-gynaecology", "reg": "Unknown (not printed)", "count": 4, "marks": 40}, {"sha": "d1fa3f8124cdbe7f0a01040c67751c8e51428f8f71bd54b298d63e5e9b2c448b", "date": "Jul–Aug 2021", "paper": "I", "subject": "general-surgery", "reg": "Unknown (not printed)", "count": 4, "marks": 60}, {"sha": "d1fa3f8124cdbe7f0a01040c67751c8e51428f8f71bd54b298d63e5e9b2c448b", "date": "Jul–Aug 2021", "paper": "II", "subject": "general-surgery", "reg": "Unknown (not printed)", "count": 4, "marks": 60}, {"sha": "d1fa3f8124cdbe7f0a01040c67751c8e51428f8f71bd54b298d63e5e9b2c448b", "date": "Jul–Aug 2021", "paper": "I", "subject": "general-medicine", "reg": "Unknown (not printed)", "count": 4, "marks": 60}, {"sha": "d1fa3f8124cdbe7f0a01040c67751c8e51428f8f71bd54b298d63e5e9b2c448b", "date": "Jul–Aug 2021", "paper": "II", "subject": "general-medicine", "reg": "Unknown (not printed)", "count": 4, "marks": 60}, {"sha": "551176ba9e36ec42ac147c58dbb9de0d7e0e1d8f8f1c8474d80d1ded8dd294ab", "date": "Nov–Dec 2024", "paper": "I", "subject": "anatomy", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "8dffb9fec44b355c11406c1ee6443b6e1b673b5ddc288d0a9c279a854448515c", "date": "Nov–Dec 2024", "paper": "II", "subject": "anatomy", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "783e147b160c9b72091424bc5d7ae0bb62a2581e217f0e01a75028288f050807", "date": "Aug 2024", "paper": "I", "subject": "anatomy", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "fa22cd236b4b0d98c0de1c1293bdd9f18a60844b726601dfac65a20e23edc616", "date": "Jun 2022", "paper": "I", "subject": "anatomy", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "c5c1fbf0be362d5406dbe82d2e9bf8eac6412620a74c4de1470a2d04eee21987", "date": "Jun 2022", "paper": "II", "subject": "anatomy", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "eb690fb98e74092b6443bc7d01d049df4a4db567e7f4c4e4fa02e0cdf96a7ca2", "date": "Mar 2021", "paper": "I", "subject": "anatomy", "reg": "New Regulation", "count": 12, "marks": 90}, {"sha": "9d53b468b4b1124e59e225e3fcb4d66dc8f65a872e064eebe3d469a6712994e7", "date": "Mar 2021", "paper": "II", "subject": "anatomy", "reg": "New Regulation", "count": 12, "marks": 90}, {"sha": "ff8ccbff113219102ca8b0ab786eb32dfaa27d5bf448d563a208312f71bc658e", "date": "Jan 2020", "paper": "I", "subject": "anatomy", "reg": "Unknown (not printed)", "count": 4, "marks": 50}, {"sha": "362007910f0e929bbb66990ce79e1995d52c5cf991896878bd084baa20447df0", "date": "Jan 2020", "paper": "II", "subject": "anatomy", "reg": "Unknown (not printed)", "count": 4, "marks": 50}, {"sha": "09c2b4508ffa41999e37e53376933ece430f3d1e6d02e380e0c649ded7adca64", "date": "Jul 2019", "paper": "I", "subject": "anatomy", "reg": "Unknown (not printed)", "count": 4, "marks": 50}, {"sha": "3c480c245088ab9d485090905534f85ff051f077ffe3e70ae7ddb4e7cf11deca", "date": "Jul 2019", "paper": "II", "subject": "anatomy", "reg": "Unknown (not printed)", "count": 4, "marks": 50}, {"sha": "cc811994a1634ab249a6f158cffb8bc7602c6319f596bbf55a0a6bb3fa718052", "date": "2014 · Supplementary", "paper": "II", "subject": "anatomy", "reg": "Unknown (not printed)", "count": 4, "marks": 50}, {"sha": "821b6c668d96bd6aba1d8a435c4ad6832d2eedf2c9c1dc3af4315acf0dc2a14c", "date": "Feb–Mar 2026", "paper": "I", "subject": "biochemistry", "reg": "New Regulation", "count": 29, "marks": 100}, {"sha": "0ccc2f0a23cbf6b4633f874f0b65753e1b773395f237e8490f201d0e520945ee", "date": "Mar 2021", "paper": "I", "subject": "biochemistry", "reg": "New Regulation", "count": 12, "marks": 90}, {"sha": "de9f0e851cdd83e00a4f7301d93120c00c11a42fc6438e4c7a8ea059490cb77f", "date": "Jan 2020", "paper": "I", "subject": "biochemistry", "reg": "Unknown (not printed)", "count": 4, "marks": 50}, {"sha": "f3f7c5c27e0fc416f189c8b4805982d502c7564b60fbbb8febd7457f8458ba27", "date": "Jul 2019", "paper": "I", "subject": "biochemistry", "reg": "Unknown (not printed)", "count": 4, "marks": 50}, {"sha": "de6e37d562f82aecb9a167c49dc8229933a02bbc7dd27eafd13df279cd7de965", "date": "2018 · Supplementary", "paper": "I", "subject": "biochemistry", "reg": "Unknown (not printed)", "count": 4, "marks": 50}, {"sha": "7c1594743ebf5b7bb53124767b74c22851402b27ea81b11ee90bd966691525a3", "date": "2018 · Supplementary", "paper": "II", "subject": "biochemistry", "reg": "Unknown (not printed)", "count": 4, "marks": 50}, {"sha": "6da33e4ef5f788d6c789a5a7a831c142ae2bfabf9f5be72ac3f1974a2d3cc053", "date": "2014 · Supplementary", "paper": "II", "subject": "biochemistry", "reg": "Unknown (not printed)", "count": 4, "marks": 50}, {"sha": "a8c8b4cdb14271e1f0c55ced24150606eb1e20eab00762df79d4a8fb66c597c5", "date": "2012 · Supplementary", "paper": "I", "subject": "biochemistry", "reg": "Unknown (not printed)", "count": 4, "marks": 50}, {"sha": "9984a3ec03a6488e508f9c66ecc261118609d573b777c40ce920c1e45bf710d2", "date": "Apr–May 2023", "paper": null, "subject": "forensic-medicine", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "a22972651ca54e0d3b928cd4e1cc84d590f876fb696f7be2dfe5e28d4ba4cf3a", "date": "Apr–May 2023", "paper": null, "subject": "ophthalmology", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "ae8125b355ce0546da0fa0064c9e2342fb4c90db9f82a882f1953d8c4740cc30", "date": "Apr–May 2023", "paper": null, "subject": "ent", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "588258b8d32915c6cec6c3b4eaf190ab590107b2e4f8c5eba7bdd182e49497d2", "date": "Aug–Sep 2026", "paper": null, "subject": "forensic-medicine", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "63e2d609826fc1dc70c736ee3b2ed60acc8f5e21481c745b5b02cc88c61908a8", "date": "Aug–Sep 2026", "paper": null, "subject": "ophthalmology", "reg": "New Regulation", "count": 22, "marks": 100}, {"sha": "7813db33c7ebb72352bcf3830f5cde297148c751077b9e3f7351adc30275e9d1", "date": "09-Aug-2024", "paper": "I", "subject": "anatomy", "reg": "RS4/RS5/RS6", "count": 30, "marks": 100}, {"sha": "1ef13e68780c3742736751784ee6e5c0e5d5acd47c207b733094871e48130c44", "date": "19-Nov-2020", "paper": "I", "subject": "anatomy", "reg": "RS3", "count": 22, "marks": 100}, {"sha": "efd88c63c6b6878835e1fc16e7e03b6c9d34d032df4b2941bc1cd119187def41", "date": "21-Nov-2020", "paper": "II", "subject": "anatomy", "reg": "RS3", "count": 22, "marks": 100}, {"sha": "5686d2225ad0912035162d818fc13b5b3d89600387570da4d198c809901b169e", "date": "24-Nov-2020", "paper": "I", "subject": "physiology", "reg": "RS3", "count": 22, "marks": 100}, {"sha": "ec83c595802ec20fad57a0d64b2357f0e1839e265b0ed4200461c0dbf0119462", "date": "26-Nov-2020", "paper": "II", "subject": "physiology", "reg": "RS3", "count": 22, "marks": 100}, {"sha": "c3a64df3c4fae439f245acd0e3805ae6aefc81fd573d9eba2d1c129e41d1853a", "date": "Jun 2019", "paper": "I", "subject": "anatomy", "reg": "RS2 & RS3", "count": 22, "marks": 100}, {"sha": "9324b4c9ff96dc539f3f2c037f1d65a1b38273049b0754ad428d5979e6278c84", "date": "Jun 2019", "paper": "II", "subject": "anatomy", "reg": "RS2 & RS3", "count": 22, "marks": 100}, {"sha": "52735997baf9fa5bcf37c9a4ef1886e0ffe3231f55a326e2d5e357e79d50d672", "date": "Jun 2019", "paper": "I", "subject": "physiology", "reg": "RS2 & RS3", "count": 22, "marks": 100}, {"sha": "4653f2662ce26cb683cd0d7537b95c120d508473f08c03bd1cdf32c5f2c7650a", "date": "Jun 2019", "paper": "II", "subject": "physiology", "reg": "RS2 & RS3", "count": 22, "marks": 100}];
for(const c of components17){const g=batch17.filter(r=>r.sourceSha256===c.sha&&r.examRefs[0].startsWith(c.date+' · ')&&r.paperNumber==c.paper&&r.subjectKey===c.subject&&r.examRefs[0].includes(c.reg));assert.equal(g.length,c.count);assert.equal(g.reduce((n,r)=>n+r.marks,0),c.marks);}
console.log('PASS Batch17:1016 original-page-reviewed units,292MCQs/1168options,5785marks; held 15-mark unit absent, prior partial-bundle seam preserved, canonical exam duplicates excluded, clinical values and printed option/question/code anomalies retained.');

const { REVIEWED_UNIVERSITY_QUESTIONS_BATCH18: batch18 } = await bundle('src/data/universityPapers/reviewedBatch18.ts');
assert.equal(batch18.length,1009);assert.equal(batch18.reduce((n,r)=>n+r.marks,0),4338);assert.equal(batch18.filter(r=>r.options).length,0);
const source18={"722": "711f9840b5949fb801c3b93c7b26d3a5accdc78e6f1062f3dd52e66257e682b0", "723": "3e762a08ccd47c5731e68ae2a83b3873156b640b5b826b431dbf7c0e1056e903", "724": "7039b37f9786d21c62bcc12f9db46b96f57f3645b7b64ba3ee06f58772e09793", "725": "de24806ca820ceffc7477a180b41d025d8ee136c2e3368480eeefa7043d7e852", "726": "d50fac3461498cb8853faa6aeebb7be442d3f43d293b57da5ea1fcd4ba8fcd96", "727": "23d0fb7b88c3c77ee02f03920d2f4c1aee95e291c529d32ac5f9dc4d62a02f9f", "728": "2b70fbd16e9f902f66722c0e7bf7c653340a5877335372900dde749e6e53dfe1", "729": "b867fd4625a778132c4da2cf024e5a4656d0d61ba401e34fcbd113877dc4ad52", "730": "790afd3efc2dacbd015b9e3e9efdc38143cb82e013426ad39532621c9b0a75ce", "731": "20cfc403a9af8a011e713d3388a592d965aafa4dcc88020aff807d9ae17a0b9e", "732": "6c6e172133f84980695f78195245897c24604f99dbd732fbb5dbf35ffdecbcfd", "733": "13229ab99688943b8d8fc08390b36f8c3aa6209aed2225e1932efb79b4c06525", "734": "f5eec01c5ca3ecb5f30ef6ea5eefdec9550d84490e4bb44a06ed92a91d032899", "735": "5c49ae453cceec6c1c1e2866beb70bcc97af9be2ff9931498bae0aff06e3696f", "736": "44cdc25655d42e8d1abe7821427ba617cef1d802fdf4f1188d3afd6cc3992c96", "737": "47a7adeaece5c3b310d4602c8251887084c19b0e7c2cbe06ad7c93ce933968b0", "738": "39d324cabe9c30ba84fc0029b5ac1c4dd19189e42228d10f7b7ddf8a2071e32c", "739": "3700c0fc29d3dc60d9570b91af32f24618f181ac2f696f87c4f58a3b13ba5577", "740": "17ffa864dc2384f2d2c9bf9007bad9117435e98a4adf766f5f16e4af91c2be7e", "741": "0a443f2f40abd339c8c1d18ad7023a66227073249ad1ec70e47b82ea0a31db60", "742": "5515885dfcece0882c104c79f428cb947aab3482fbd41b4af6d3668c6837e43a", "743": "c3215322d35c811e8340c9ab7c2a76e56789da660aab89fe434d1d45d54f26f5", "744": "41b54056487f2672b8dba94528de6272105c48842768e1905f441b2bb4531004", "745": "93d64d1cfb4a169d733b3acd628dd877ac413273d702ffa6fd998fc1e4770c6b", "746": "d004e71914b2ec062f652f5891befa0d06a8238db896ea0e3604b803048a5f7a", "747": "8dd751491678ea6b28b6ffe2bf6a8ff0fdd37cf57f9813ee57f62d0f379c45be", "748": "4105d8f41d4ff2313bce358f6322c2b413206c6d7ce1f463449afed1178cd17f", "749": "c6ada8c9d1d3eb7937b88c7f4539667f2cabd7d09a489f3f17bbbfbbd97e8044", "750": "bc9a0c2306f6e5e5b8ffde8bed06ac64737ec4935b30795f5b9a4206258b3937", "751": "aa27b9fe89f4273bc8694860eb40cf5c158013469fe3b4e23e107e3867606cd3", "752": "cb592edbbcec0cf62fa5de7317a7645c276a5dd94dfb14b472090618321f8afb", "753": "63393e312764ac0cfb3b5a6de8e164cfdaaa3cbb01224815b2b24929a6a02e36", "754": "82c0536f3232520ba93b9f19193d64b038cc3d087789c7f276c1a66bd93d297f", "755": "c54e956eadd0aa0741e2e1c87468978d030a5fa3c31ae7a4395c02e432de955b", "756": "a9ce401dfa055f7779c5772b574072952498d2bab8effc4a3956aeca03c57d9a", "757": "d9208b4a375d8440d2d7bba3e18094a03a8813af8bf7b46f1bd3121c4ea394df", "758": "f908dcaecf789d13f15d583d9fb2283eddf8c69db6e99d3bca05759d0299aaeb", "759": "ea3afec1216997aae32a1d37160c6cbc615aac3f48854e4b168493a5be07dc19", "760": "d8c5ad5358cf7302e1c0fa618e4232f3c6780df063ec16c48580ca895c1ffe5a", "761": "6151d7d1c80e06dd4001488688e61058eff3b50acabf3b9a05b716d2cdc5c240", "762": "a0275976ae1513692df36d6481c3e1484cd284f8c5670c134b87f85dadc43d7b", "763": "f65f4987468dafdc8d6c7b0153f980fe137da1f9bb0a97dec1f1859b7cbf4109", "764": "85dd7f30506bfb2494710ecf3aa476ab228f0d3f85ab40906afb3eea848a2cbf", "765": "4bc77d7b7c99927b8f26904254dc37f54c17e8bb69892208081f593d15c7c27d", "766": "b56525f0670a27e4755b52aac7d778e49f1beb80086c4baf2d35ee1ccae8899f", "767": "1d56516f8f12c96569a2b56835aa488a350965273d04550e6fd2e425ef09a4bb"};
const q18=(n,p,q)=>batch18.find(r=>r.sourceSha256===source18[n]&&r.pdfPage===p&&r.id.endsWith("-q"+q));
assert.ok(!q18(749,1,'28'),'Crossed-out2-mark unit must remain held');
assert.ok(!batch18.some(r=>r.sourceSha256===source18[756]),'Already-approved22-question alternate must be excluded');
assert.equal(q18(744,1,'1').marks,9);assert.equal(q18(744,1,'28').marks,2);
assert.ok(q18(744,1,'28').question.includes('coastal groove'));
assert.equal(q18(738,1,'22').marks,2);assert.equal(q18(738,1,'1').marks,10);
assert.equal(q18(753,2,'21').sourceQuestion,'21');assert.equal(q18(753,2,'22').pdfPage,2);
assert.equal(q18(755,1,'i-1').sourceQuestion,'1');assert.equal(q18(755,1,'ii-1').sourceQuestion,'1');
assert.equal(q18(755,1,'i-1').paperNumber,'I');assert.equal(q18(755,1,'ii-1').paperNumber,'II');
assert.ok(q18(755,1,'ii-11').examRefs[0].includes('Code 1080'));
assert.ok(q18(764,1,'1').question.includes('30-year-old male')&&q18(764,1,'1').question.includes('when he was 5 years old')&&q18(764,1,'1').question.includes('d) Enumerate'));
assert.equal(q18(762,1,'9').question,'α blockers');
for(const r of batch18)assert.ok(!/Ranker|www\.|Max.?Marks|Time:/.test(r.question));
const components18=[{"sha": "711f9840b5949fb801c3b93c7b26d3a5accdc78e6f1062f3dd52e66257e682b0", "paper": "I", "code": "1079", "count": 11, "marks": 50}, {"sha": "3e762a08ccd47c5731e68ae2a83b3873156b640b5b826b431dbf7c0e1056e903", "paper": "II", "code": "1080", "count": 11, "marks": 50}, {"sha": "7039b37f9786d21c62bcc12f9db46b96f57f3645b7b64ba3ee06f58772e09793", "paper": "I", "code": "1075", "count": 22, "marks": 100}, {"sha": "de24806ca820ceffc7477a180b41d025d8ee136c2e3368480eeefa7043d7e852", "paper": "II", "code": "1076", "count": 22, "marks": 100}, {"sha": "d50fac3461498cb8853faa6aeebb7be442d3f43d293b57da5ea1fcd4ba8fcd96", "paper": "I", "code": "1075", "count": 22, "marks": 100}, {"sha": "23d0fb7b88c3c77ee02f03920d2f4c1aee95e291c529d32ac5f9dc4d62a02f9f", "paper": "II", "code": "1076", "count": 22, "marks": 100}, {"sha": "2b70fbd16e9f902f66722c0e7bf7c653340a5877335372900dde749e6e53dfe1", "paper": "I", "code": "1077", "count": 22, "marks": 100}, {"sha": "b867fd4625a778132c4da2cf024e5a4656d0d61ba401e34fcbd113877dc4ad52", "paper": "II", "code": "1078", "count": 22, "marks": 100}, {"sha": "790afd3efc2dacbd015b9e3e9efdc38143cb82e013426ad39532621c9b0a75ce", "paper": "I", "code": "1075", "count": 22, "marks": 100}, {"sha": "20cfc403a9af8a011e713d3388a592d965aafa4dcc88020aff807d9ae17a0b9e", "paper": "II", "code": "1076", "count": 22, "marks": 100}, {"sha": "6c6e172133f84980695f78195245897c24604f99dbd732fbb5dbf35ffdecbcfd", "paper": "I", "code": "1077", "count": 22, "marks": 100}, {"sha": "13229ab99688943b8d8fc08390b36f8c3aa6209aed2225e1932efb79b4c06525", "paper": "II", "code": "1078", "count": 22, "marks": 100}, {"sha": "f5eec01c5ca3ecb5f30ef6ea5eefdec9550d84490e4bb44a06ed92a91d032899", "paper": null, "code": "1066", "count": 22, "marks": 100}, {"sha": "5c49ae453cceec6c1c1e2866beb70bcc97af9be2ff9931498bae0aff06e3696f", "paper": "I", "code": "1075", "count": 22, "marks": 100}, {"sha": "44cdc25655d42e8d1abe7821427ba617cef1d802fdf4f1188d3afd6cc3992c96", "paper": "II", "code": "1076", "count": 22, "marks": 100}, {"sha": "47a7adeaece5c3b310d4602c8251887084c19b0e7c2cbe06ad7c93ce933968b0", "paper": "I", "code": "1077", "count": 22, "marks": 100}, {"sha": "39d324cabe9c30ba84fc0029b5ac1c4dd19189e42228d10f7b7ddf8a2071e32c", "paper": "I", "code": "1001", "count": 22, "marks": 90}, {"sha": "3700c0fc29d3dc60d9570b91af32f24618f181ac2f696f87c4f58a3b13ba5577", "paper": "II", "code": "1002", "count": 22, "marks": 90}, {"sha": "17ffa864dc2384f2d2c9bf9007bad9117435e98a4adf766f5f16e4af91c2be7e", "paper": "I", "code": "1003", "count": 22, "marks": 90}, {"sha": "0a443f2f40abd339c8c1d18ad7023a66227073249ad1ec70e47b82ea0a31db60", "paper": "II", "code": "1004", "count": 22, "marks": 90}, {"sha": "5515885dfcece0882c104c79f428cb947aab3482fbd41b4af6d3668c6837e43a", "paper": "II", "code": "1004", "count": 22, "marks": 90}, {"sha": "c3215322d35c811e8340c9ab7c2a76e56789da660aab89fe434d1d45d54f26f5", "paper": null, "code": "1005", "count": 22, "marks": 90}, {"sha": "41b54056487f2672b8dba94528de6272105c48842768e1905f441b2bb4531004", "paper": "I", "code": "1051", "count": 28, "marks": 100}, {"sha": "93d64d1cfb4a169d733b3acd628dd877ac413273d702ffa6fd998fc1e4770c6b", "paper": "II", "code": "1052", "count": 28, "marks": 100}, {"sha": "d004e71914b2ec062f652f5891befa0d06a8238db896ea0e3604b803048a5f7a", "paper": "I", "code": "1051", "count": 28, "marks": 100}, {"sha": "8dd751491678ea6b28b6ffe2bf6a8ff0fdd37cf57f9813ee57f62d0f379c45be", "paper": "II", "code": "1052", "count": 28, "marks": 100}, {"sha": "4105d8f41d4ff2313bce358f6322c2b413206c6d7ce1f463449afed1178cd17f", "paper": "I", "code": "1053", "count": 28, "marks": 100}, {"sha": "c6ada8c9d1d3eb7937b88c7f4539667f2cabd7d09a489f3f17bbbfbbd97e8044", "paper": "II", "code": "1054", "count": 27, "marks": 98}, {"sha": "bc9a0c2306f6e5e5b8ffde8bed06ac64737ec4935b30795f5b9a4206258b3937", "paper": null, "code": "1055", "count": 28, "marks": 100}, {"sha": "aa27b9fe89f4273bc8694860eb40cf5c158013469fe3b4e23e107e3867606cd3", "paper": "I", "code": "1075", "count": 22, "marks": 100}, {"sha": "cb592edbbcec0cf62fa5de7317a7645c276a5dd94dfb14b472090618321f8afb", "paper": "II", "code": "1076", "count": 22, "marks": 100}, {"sha": "63393e312764ac0cfb3b5a6de8e164cfdaaa3cbb01224815b2b24929a6a02e36", "paper": "I", "code": "1077", "count": 22, "marks": 100}, {"sha": "82c0536f3232520ba93b9f19193d64b038cc3d087789c7f276c1a66bd93d297f", "paper": "II", "code": "1078", "count": 22, "marks": 100}, {"sha": "c54e956eadd0aa0741e2e1c87468978d030a5fa3c31ae7a4395c02e432de955b", "paper": "I", "code": "1079", "count": 11, "marks": 50}, {"sha": "c54e956eadd0aa0741e2e1c87468978d030a5fa3c31ae7a4395c02e432de955b", "paper": "II", "code": "1080", "count": 11, "marks": 50}, {"sha": "d9208b4a375d8440d2d7bba3e18094a03a8813af8bf7b46f1bd3121c4ea394df", "paper": "I", "code": "1075", "count": 22, "marks": 100}, {"sha": "f908dcaecf789d13f15d583d9fb2283eddf8c69db6e99d3bca05759d0299aaeb", "paper": "II", "code": "1086", "count": 22, "marks": 100}, {"sha": "ea3afec1216997aae32a1d37160c6cbc615aac3f48854e4b168493a5be07dc19", "paper": "II", "code": "1082", "count": 22, "marks": 100}, {"sha": "d8c5ad5358cf7302e1c0fa618e4232f3c6780df063ec16c48580ca895c1ffe5a", "paper": "I", "code": "1083", "count": 22, "marks": 100}, {"sha": "6151d7d1c80e06dd4001488688e61058eff3b50acabf3b9a05b716d2cdc5c240", "paper": "II", "code": "1084", "count": 22, "marks": 100}, {"sha": "a0275976ae1513692df36d6481c3e1484cd284f8c5670c134b87f85dadc43d7b", "paper": "I", "code": "1085", "count": 22, "marks": 100}, {"sha": "f65f4987468dafdc8d6c7b0153f980fe137da1f9bb0a97dec1f1859b7cbf4109", "paper": "I", "code": "1081", "count": 22, "marks": 100}, {"sha": "85dd7f30506bfb2494710ecf3aa476ab228f0d3f85ab40906afb3eea848a2cbf", "paper": "II", "code": "1082", "count": 22, "marks": 100}, {"sha": "4bc77d7b7c99927b8f26904254dc37f54c17e8bb69892208081f593d15c7c27d", "paper": "I", "code": "1083", "count": 22, "marks": 100}, {"sha": "b56525f0670a27e4755b52aac7d778e49f1beb80086c4baf2d35ee1ccae8899f", "paper": "II", "code": "1084", "count": 22, "marks": 100}, {"sha": "1d56516f8f12c96569a2b56835aa488a350965273d04550e6fd2e425ef09a4bb", "paper": "I", "code": "1081", "count": 22, "marks": 100}];
for(const c of components18){const g=batch18.filter(r=>r.sourceSha256===c.sha&&r.paperNumber==c.paper&&r.examRefs[0].includes('Code '+c.code));assert.equal(g.length,c.count);assert.equal(g.reduce((n,r)=>n+r.marks,0),c.marks);}
console.log('PASS Batch18:1009 new original-page-reviewed units,4338marks,46componentbalances; crossed-out unit held,22-question alternate excluded,50/90/100-mark formats, repeated paper numbers, cross-page questions and clinical subparts preserved.');
