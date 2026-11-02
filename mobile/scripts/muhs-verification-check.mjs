import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const dir = path.join(root, 'src/data/universityPapers');
function batch(name) {
  const source = fs.readFileSync(path.join(dir, name), 'utf8');
  const begin = source.indexOf(' = [');
  const end = source.lastIndexOf(' satisfies ReviewedUniversityQuestion[]');
  assert.ok(begin > 0 && end > begin, 'Unexpected TS question-bank layout '+name);
  return JSON.parse(source.slice(begin+3,end));
}
const rows = [...batch('reviewedBatch25.ts'), ...batch('reviewedBatch26.ts')];
const ledger = JSON.parse(fs.readFileSync(path.join(dir,'muhs-verification-ledger.json'),'utf8'));
const provenance = JSON.parse(fs.readFileSync(path.join(dir,'batch26-provenance.json'),'utf8'));
assert.equal(rows.length,1000);
assert.equal(rows.length,ledger.rows.length);
assert.equal(rows.reduce((total,row)=>total+row.marks,0),5217);
assert.equal(provenance.marks,batch('reviewedBatch26.ts').reduce((n,r)=>n+r.marks,0));
const byId = new Map(rows.map(row=>[row.id,row]));
assert.equal(byId.size,1000,'Duplicated IDs');
const occurrenceKeys = rows.map(row=>[row.sourceSha256,row.pdfPage,row.sourceQuestion].join('/'));
assert.equal(new Set(occurrenceKeys).size,rows.length,'Duplicated original paper occurrence');
const allowed = new Set(Object.keys(ledger.counts));
const counted = Object.fromEntries([...allowed].map(status=>[status,0]));
const knownSources = new Set(rows.map(r=>r.sourceSha256));
assert.equal(knownSources.size,84,'Original MUHS paper source count changed');
for (const entry of ledger.rows) {
  const row = byId.get(entry.id);
  assert.ok(row, 'Ledger row not in app: '+entry.id);
  assert.ok(allowed.has(entry.status),'Invalid verification status');
  assert.equal(entry.sha256,row.sourceSha256);
  assert.equal(entry.sourcePdfPage,row.pdfPage);
  assert.equal(entry.printedQuestion,row.sourceQuestion);
  assert.equal(entry.marks,row.marks);
  assert.equal(entry.format,row.questionFormat);
  assert.match(row.sourceSha256,/^[a-f0-9]{64}$/);
  assert.ok(row.id.includes(row.sourceSha256.slice(0,12)));
  const pending = row.examRefs.some(ref=>ref.toLowerCase().includes('transcription pending visual review'));
  assert.equal(pending,entry.status==='ocr_transcription_page_review_pending','Pending review label mismatch: '+entry.id);
  counted[entry.status]++;
}
assert.deepEqual(counted, ledger.counts);
assert.equal(counted.page_image_compared,265);
assert.equal(counted.pdf_text_layer_corroborated,129);
assert.equal(counted.pdf_text_layer_low_match,9);
assert.equal(counted.ocr_transcription_page_review_pending,597);
assert.equal(ledger.noOriginalAnswerKeys,true);
console.log('PASS MUHS audit: 1000 unique source-linked records; 265 page-reviewed, 129 text-corroborated, 9 weak text matches, 597 OCR still pending; 5217 original marks, no fabricated answers.');
