// Test the actual merger, transpiled with TypeScript, without loading React Native.
// Clinical near-matches must remain separate; exact OCR/reviewed overlap must not.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'src/lib/rguhsUnifiedBank.ts'), 'utf8');
const transpiled = ts.transpileModule(source, {
  fileName: 'rguhsUnifiedBank.ts',
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;

const done = new Set();
let reviewed = [];
const subjects = [
  { key: 'anatomy', name: 'Anatomy' },
  { key: 'biochemistry', name: 'Biochemistry' },
];
const fakeRequire = id => {
  if (id === './questionBank') {
    return { allSearchHits: () => reviewed, getSubjects: () => subjects };
  }
  if (id === './questionText') {
    return { getCleanQuestionText: q => q.replace(/^PYQ\[[^\]]+\]\s*/, '').trim() };
  }
  if (id === './progress') {
    return { isQuestionDone: q => done.has(q) };
  }
  if (id === '@data/universityPapers/presentation') {
    return { isUniversityMcq: q => q.includes('MCQ_SOURCE') };
  }
  throw new Error('Unexpected import in RGUHS merge test: ' + id);
};
const context = { exports: {}, require: fakeRequire, Map, Set };
vm.runInNewContext(transpiled, context, { filename: 'rguhsUnifiedBank.ts' });
const { mergeRguhsQuestions, rguhsQuestionIdentity, isRguhsSourceChecked } = context.exports;
const mock = (overrides = {}) => ({
  id: 'oc-1',
  university: 'rguhs',
  year: 'first-year',
  subject: 'Anatomy',
  chapter: 'Upper Limb',
  question_type: 'essay',
  question_text: 'Define shock.',
  source_pdf: 'source.pdf',
  source_page: 12,
  exam_dates: ['2022', '2023'],
  quality_status: 'ocr_draft',
  ...overrides,
});
const hit = (q, type = 'essay', extra = {}) => ({
  year: 'first-year',
  yearLabel: '1st Year',
  subjectKey: 'anatomy',
  subjectName: 'Anatomy',
  topicName: 'Upper Limb',
  question: q,
  type,
  ...extra,
});
reviewed = [hit('PYQ[r1] Define shock.'), hit('PYQ[r2] Define shock stages.')];
let rows = mergeRguhsQuestions('first-year', [mock(), mock({ id: 'oc-2', question_text: 'Define shock' })]);
assert.equal(rows.length, 2, 'Deduplicate exact overlap, but not a clinically distinct question');
assert.equal(rows.filter(r => r.reviewedQuestion).length, 2);
assert.equal(rows.find(r => r.reviewedQuestion?.includes('[r1]')).question, 'PYQ[r1] Define shock.',
  'Keep reviewed progress key when no offline completion exists');

done.add('Define shock.');
rows = mergeRguhsQuestions('first-year', [mock()]);
assert.equal(rows.length, 2);
assert.equal(rows.find(r => r.reviewedQuestion?.includes('[r1]')).question, 'Define shock.',
  'Previously checked offline question must stay checked through the merger');
done.clear();

const checked = mock({ id: 'checked', quality_status: 'reviewed_against_pdf' });
rows = mergeRguhsQuestions('first-year', [mock(), checked]);
assert.equal(rows.find(r => r.offline?.id === 'checked').offline.quality_status, 'reviewed_against_pdf',
  'Prefer the independently source-checked OCR reference when duplicates exist');
assert.equal(isRguhsSourceChecked(mock()), false);
assert.equal(isRguhsSourceChecked(checked), true);

// A completed but unverified duplicate must not erase an independently
// verified PDF reference for exactly the same underlying question.
done.add('Define shock.');
rows = mergeRguhsQuestions('first-year', [
  mock({ id: 'verified-first', question_text: 'Define shock', quality_status: 'reviewed_against_pdf' }),
  mock({ id: 'completed-second', question_text: 'Define shock.', quality_status: 'ocr_draft' }),
]);
const combined = rows.find(r => r.reviewedQuestion?.includes('[r1]'));
assert.equal(combined.question, 'Define shock.', 'Keep old completion identity');
assert.equal(combined.offline?.id, 'verified-first', 'Keep the best PDF verification record');
done.clear();

reviewed = [hit('MCQ_SOURCE: Which artery?', 'short-notes')];
rows = mergeRguhsQuestions('first-year', [
  mock({ id: 'mcq', question_type: 'MCQ', question_text: 'MCQ_SOURCE: Which artery?' }),
  mock({ id: 'essay', question_type: 'essay', question_text: 'MCQ_SOURCE: Which artery?' }),
  mock({ id: 'kuhs', university: 'kuhs' }),
  mock({ id: 'other-year', year: 'third-year' }),
]);
assert.equal(rows.length, 2, 'Never merge an MCQ and written question or ingest other university/year');
assert.equal(rows.filter(r => r.kind === 'mcq').length, 1);
assert.equal(rguhsQuestionIdentity('Define shock.'), rguhsQuestionIdentity('define shock'),
  'Case and trailing punctuation must not inflate counts');

reviewed = [
  { ...hit('PYQ[muhs-1] Define shock.'), subjectName: 'Anatomy', subjectKey: 'anatomy' },
];
const muhs = context.exports.mergeUniversityQuestions('muhs', 'first-year', [
  mock({ university: 'muhs', id: 'muhs-ocr' }),
  mock({ university: 'rguhs', id: 'rguhs-ocr' }),
]);
assert.equal(muhs.length, 1, 'MUHS should include reviewed + MUHS OCR only and deduplicate identical wording');
assert.equal(muhs[0].offline?.university, 'muhs');

reviewed = [hit('PYQ[wbuhs-1] Which nerve supplies the diaphragm?')];
const wbuhs = context.exports.mergeUniversityQuestions('wbuhs', 'first-year', [
  mock({
    id: 'wbuhs-ocr',
    university: 'wbuhs',
    question_text: 'Which nerve supplies the diaphragm?',
    quality_status: 'source_page_reviewed',
  }),
]);
assert.equal(wbuhs.length, 1, 'WBUHS reviewed + cached OCR overlap should be one question');
assert.equal(wbuhs[0].offline?.quality_status, 'source_page_reviewed');
assert.equal(wbuhs[0].reviewedQuestion, 'PYQ[wbuhs-1] Which nerve supplies the diaphragm?');

console.log('RGUHS, MUHS and WBUHS unified merger: duplicate, university isolation and completion checks PASS');
