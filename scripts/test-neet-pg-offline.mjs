import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from '../mobile/node_modules/esbuild/lib/main.js';

const installOutput = await build({ entryPoints: ['src/lib/neetPgInstall.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { createBankInstaller } = await import('data:text/javascript;base64,' + Buffer.from(installOutput.outputFiles[0].text).toString('base64'));
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
  const mismatchedKey = structuredClone(fixture);
  mismatchedKey.records[0].sourceAnswer = 'B';
  assert.throws(() => validateOfflineBank(mismatchedKey), /disagree/);
  assert.equal(reader.image('toString'), undefined);
  const duplicates = structuredClone(fixture);
  duplicates.records.push(structuredClone(duplicates.records[0]));
  assert.throws(() => validateOfflineBank(duplicates), /Incomplete/);
} finally { globalThis.fetch = fetchBefore; }
console.log('Offline reader passes: no fetch; filters/search; immutable answers; incomplete MCQs and external/missing images rejected. 2209 notes mapped; not a complete MCQ release.');

// Exercise durable installation with a simulated private file store, including
// storage failures at the commit boundary. A fresh installer models app restart.
const file = id => ({ fileId: id, name: `${id}.json`, size: 1000 });
let pointer = null, next = null, failWrite = false, ambiguousWrite = false, failRead = false;
const stored = new Map();
const removed = [];
const port = {
  async readPointer() { if (failRead) throw Error('storage unavailable'); return pointer; },
  async writePointer(value) {
    if (failWrite) throw Error('quota');
    pointer = value;
    if (ambiguousWrite) { failRead = true; throw Error('storage unavailable after commit'); }
  },
  async pick() { return next; },
  async read(id) { if (!stored.has(id)) throw Error('missing file'); return stored.get(id); },
  async remove(id) { removed.push(id); stored.delete(id); },
};
const create = (check = () => {}) => createBankInstaller(port, check);
const prepare = id => { next = file(id); stored.set(id, JSON.stringify(fixture)); };
const installer = create();
assert.equal(await installer.load(), null);
assert.equal(await installer.install(), null); // Picker cancelled.
prepare('first');
assert.equal((await installer.install()).reader.total, 1);
assert.equal((await create().load()).file.fileId, 'first');
const firstPointer = pointer;
prepare('incomplete'); stored.set('incomplete', JSON.stringify(data));
await assert.rejects(installer.install(), /Invalid offline bank/);
assert.equal(pointer, firstPointer);
assert.ok(!stored.has('incomplete'));
prepare('wrong-chapter');
await assert.rejects(create(() => { throw Error('chapter mismatch'); }).install(), /chapter mismatch/);
assert.equal(pointer, firstPointer);
prepare('write-failure'); failWrite = true;
await assert.rejects(installer.install(), /quota/); failWrite = false;
assert.equal(pointer, firstPointer);
assert.equal((await create().load()).file.fileId, 'first');
prepare('second'); await installer.install();
assert.deepEqual(JSON.parse(pointer).map(item => item.fileId), ['second', 'first']);
prepare('third'); await installer.install();
assert.ok(removed.includes('first'));
assert.deepEqual(JSON.parse(pointer).map(item => item.fileId), ['third', 'second']);
stored.set('third', 'corrupted');
assert.equal((await create().load()).file.fileId, 'second'); // Previous complete bank survives.
prepare('ambiguous'); ambiguousWrite = true;
await assert.rejects(installer.install(), /after commit/);
assert.equal(JSON.parse(pointer)[1].fileId, 'second');
assert.ok(stored.has('ambiguous')); // Never delete a possibly committed file.
failRead = false; ambiguousWrite = false;
assert.equal((await create().load()).file.fileId, 'ambiguous');
let resumePick;
const concurrent = createBankInstaller({ ...port, pick: () => new Promise(resolve => { resumePick = resolve; }) }, () => {});
const pendingInstall = concurrent.install();
await Promise.resolve(); await Promise.resolve();
await assert.rejects(concurrent.install(), /already in progress/);
resumePick(null); await pendingInstall;
console.log('Offline installer passes: restart persistence, cancellation, invalid imports, failed/ambiguous commits, retained previous bank, and concurrent-install protection.');
