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

console.log('RGUHS unified merger: source quality, dedup, progress, MCQs, and identity PASS');
