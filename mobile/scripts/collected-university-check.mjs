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

assert.equal(rows.length, 3580);
assert.equal(new Set(rows.map(r => r.id)).size, rows.length);
const expected = { rguhs: 1671, knruhs: 1893, muhs: 0, ntruhs: 12, wbuhs: 4 };
const marks = { rguhs: 6479, knruhs: 7550, ntruhs: 50, wbuhs: 40 };
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
    assert.ok(Number.isInteger(row.pdfPage) && row.pdfPage >= 1 && row.pdfPage <= 4);
    assert.ok((row.question.length > 4 || (['rguhs-fc6c85e99007-p1-q5','rguhs-d3a0bc4dc8fb-p1-q12'].includes(row.id) && row.question === 'Gout') || (row.id === 'rguhs-8b7f4f6c8446-p1-q13' && row.question === 'GABA')) && row.question.length <= 1000);
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
console.log('PASS 3580 reviewed question units: all new bank counts, marks, identities, cleaned text, source refs, university isolation, note/deck cache keys and resume persistence; old TNMGR/KUHS banks retained.');

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
