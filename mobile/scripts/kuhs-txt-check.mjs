// Transfer integrity from reviewed TXT to app; not source image accuracy.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const file = process.argv[2];
assert.ok(file, 'Usage: node scripts/kuhs-txt-check.mjs /absolute/KUHS_reviewed_questions.txt');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const result = await build({entryPoints:[path.join(root,'../src/data/kuhs/verifiedQuestions.ts')],bundle:true,write:false,format:'esm',platform:'neutral'});
const { VERIFIED_KUHS_QUESTIONS: rows } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const workingCopy = fs.readFileSync(file,'utf8').startsWith('KUHS QUESTION BANK — TXT WORKING COPY');
const workingPattern = /^\[(kuhs-[a-z0-9-]+)\] (FIRST|SECOND|THIRD|FINAL) \| ([a-z-]+) \| ([a-z0-9-]+) \| (essay|short-notes)\n([\s\S]*?)\nExam references: ([^\n]*)/gm;
const pattern = /^\[(kuhs-[a-z0-9-]+)\] (FIRST|SECOND|THIRD|FINAL) \| ([a-z-]+) \| PDF page (\d+) \| (essay|short-notes)\nTopic: ([a-z0-9-]+)\n([\s\S]*?)\nPrinted exam references: ([^\n]*)/gm;
const found = new Map();
for (const match of fs.readFileSync(file,'utf8').matchAll(workingCopy ? workingPattern : pattern)) {
 if (workingCopy) {
  const [,id,year,subject,topic,kind,question,refs]=match;
  assert.ok(!found.has(id),`Duplicate TXT entry ${id}`);
  found.set(id,{year:year.toLowerCase(),subjectKey:subject,topicKey:topic,kind,question,examRefs:refs.split(', ')});
  continue;
 }
 const [,id,year,subject,page,kind,topic,question,refs] = match;
 assert.ok(!found.has(id),`Duplicate TXT entry ${id}`);
 found.set(id,{year:year.toLowerCase(),subjectKey:subject,pdfPage:Number(page),kind,topicKey:topic,question,examRefs:refs.split(', ')});
}
assert.equal(found.size,rows.length,'TXT and app entry totals differ');
for(const row of rows) {
 const {id,...expected}=row;
 if (workingCopy) delete expected.pdfPage;
 assert.deepEqual(found.get(id),expected,`TXT/app mismatch: ${id}`);
}
console.log(`OK ${rows.length} TXT entries match app wording, years, subjects, topics, kinds and exam references${workingCopy ? "" : ", including source metadata"}.`);
