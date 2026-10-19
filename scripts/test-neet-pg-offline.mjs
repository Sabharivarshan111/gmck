import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from '../mobile/node_modules/esbuild/lib/main.js';

const output = await build({ entryPoints: ['src/lib/neetPgOffline.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { validateOfflineBank, createOfflineReader } = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].text).toString('base64'));
const data = JSON.parse(fs.readFileSync('mobile/src/lib/neetPgStudyData.json', 'utf8'));
const chapters = new Map(data.chapters.map(chapter => [chapter.id, chapter]));
assert.equal(data.records.length, 2209);
assert.equal(new Set(data.records.map(row => row.id)).size, 2209);
assert.equal(chapters.size, 207);
assert.equal(new Set(data.chapters.map(chapter => chapter.year)).size, 4);
for (const row of data.records) {
  assert.ok(chapters.has(row.chapterId));
  assert.ok(row.explanation.trim());
}
// An explanation companion must not pass as a complete offline MCQ bank.
assert.throws(() => validateOfflineBank(data));
const chapter = data.chapters.find(item => item.subject === 'anatomy');
const fixture = {
  schema: 1, id: 'original-test-bank', chapters: [chapter], images: {},
  records: [{ id: 'original-test-1', chapterId: chapter.id, question: 'Which nerve supplies lateral rectus?', options: ['Oculomotor', 'Trochlear', 'Abducens', 'Optic'], answerIndex: 2, sourceAnswer: 'C', explanation: 'The abducens nerve supplies lateral rectus and abducts the eye.', requiresImage: false, imageIds: [] }],
};
const fetchBefore = globalThis.fetch;
globalThis.fetch = () => { throw Error('Network forbidden in offline test'); };
try {
  const reader = createOfflineReader(fixture);
  assert.equal(reader.search({ query: 'abducens rectus' }).total, 1);
  assert.equal(reader.search({ year: 'final-year' }).total, 0);
  assert.equal(reader.search({ chapterId: chapter.id }).records[0].sourceAnswer, 'C');
  assert.equal(reader.search({ offset: 1 }).records.length, 0);
  assert.equal(reader.chapters()[0].count, 1);
  fixture.records[0].options[2] = 'Changed after installation';
  assert.equal(reader.search().records[0].options[2], 'Abducens');
  const result = reader.search();
  result.records[0].options[2] = 'Changed search result';
  assert.equal(reader.search().records[0].options[2], 'Abducens');
  const missingImage = structuredClone(fixture);
  missingImage.records[0].requiresImage = true;
  assert.throws(() => validateOfflineBank(missingImage), /Required image missing/);
  missingImage.records[0].imageIds = ['absent'];
  assert.throws(() => validateOfflineBank(missingImage), /Unresolved image/);
  const externalImage = structuredClone(fixture);
  externalImage.images.scan = { dataUri: 'https://example.com/scan.png', alt: 'Scan' };
  assert.throws(() => validateOfflineBank(externalImage), /must be embedded/);
  const incomplete = structuredClone(fixture);
  incomplete.records[0].options = [];
  assert.throws(() => validateOfflineBank(incomplete), /Incomplete/);
  const invalidAnswer = structuredClone(fixture);
  invalidAnswer.records[0].answerIndex = 8;
  assert.throws(() => validateOfflineBank(invalidAnswer), /Incomplete/);
  const duplicates = structuredClone(fixture);
  duplicates.records.push(structuredClone(duplicates.records[0]));
  assert.throws(() => validateOfflineBank(duplicates), /Incomplete/);
} finally { globalThis.fetch = fetchBefore; }
console.log('Offline reader passes: no fetch; filters/search; immutable answers; incomplete MCQs and external/missing images rejected. 2209 notes mapped; not a complete MCQ release.');
