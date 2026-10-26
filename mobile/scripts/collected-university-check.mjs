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

assert.equal(rows.length, 1556);
assert.equal(new Set(rows.map(r => r.id)).size, rows.length);
const expected = { rguhs: 22, knruhs: 1518, muhs: 0, ntruhs: 12, wbuhs: 4 };
const marks = { rguhs: 100, knruhs: 6050, ntruhs: 50, wbuhs: 40 };
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
    assert.ok(row.pdfPage === 1 || row.pdfPage === 2);
    assert.ok(row.question.length > 4 && row.question.length <= 1000);
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
console.log('PASS 1556 reviewed question units: all new bank counts, marks, identities, cleaned text, source refs, university isolation, note/deck cache keys and resume persistence; old TNMGR/KUHS banks retained.');

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
