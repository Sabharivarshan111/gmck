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

assert.equal(rows.length, 450);
assert.equal(new Set(rows.map(r => r.id)).size, rows.length);
const expected = { rguhs: 22, knruhs: 412, muhs: 0, ntruhs: 12, wbuhs: 4 };
const marks = { rguhs: 100, knruhs: 1650, ntruhs: 50, wbuhs: 40 };
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
console.log('PASS 450 reviewed question units: all new bank counts, marks, identities, cleaned text, source refs, university isolation, note/deck cache keys and resume persistence; old TNMGR/KUHS banks retained.');

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
