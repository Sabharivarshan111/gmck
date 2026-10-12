#!/usr/bin/env node
/** Counts the released feature, never the withheld research corpus. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const ts=createRequire(import.meta.url)('../mobile/node_modules/typescript');
function load(file){
 const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module:m,exports:m.exports},{filename:file});return m.exports;
}
const {PG_SOURCES,PG_ORIGINAL_PRACTICE}=load('mobile/src/lib/pgEntranceBank.ts');
const {PG_COMPACT,PG_COMPACT_BYTES}=load('mobile/src/lib/pgCompact/manifest.ts');
assert.equal(PG_COMPACT.total,185637);assert.equal(PG_COMPACT.quarantined,1293);
assert.ok(PG_COMPACT_BYTES<10000000);
assert.equal(PG_COMPACT.packs.length,21);
for(const pack of PG_COMPACT.packs){assert.equal(pack.chapters.reduce((n,c)=>n+c.count,0),pack.count);assert.ok(pack.rawBytes<=20000000);}
assert.ok(fs.readFileSync('docs/licenses/MedMCQA-MIT.txt','utf8').includes('Copyright (c) 2022 MedMCQA'));
assert.equal(PG_ORIGINAL_PRACTICE.length,10);
assert.equal(new Set(PG_ORIGINAL_PRACTICE.map(q=>q.id)).size,10);
assert.equal(new Set(PG_ORIGINAL_PRACTICE.map(q=>q.subject)).size,9);
assert.equal(new Set(PG_ORIGINAL_PRACTICE.map(q=>q.subject+' / '+q.chapter)).size,10);
for(const q of PG_ORIGINAL_PRACTICE){
 assert.equal(q.exam,'ORIGINAL');assert.equal(q.year,null);assert.equal(q.record_type,'original_exam_style');
 assert.ok(q.chapter?.trim(), 'Every released question must have a chapter');
 assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);
 assert.match(q.answer,/^[ABCD]$/);assert.ok(q.explanation.length>=20);
}
assert.equal(PG_SOURCES.length,3);
for(const s of PG_SOURCES){
 assert.equal(s.kind,'Official information');
 assert.ok(['natboard.edu.in','www.aiimsexams.ac.in'].includes(new URL(s.url).hostname));
}
const screen=fs.readFileSync('mobile/src/components/PgEntranceBankModal.tsx','utf8');
assert.ok(screen.includes('publisher-declared MIT licence'));assert.ok(screen.includes('not independently medically reviewed'));
assert.ok(!/source-labelled questions are available offline/.test(screen));
assert.ok(fs.readFileSync('mobile/src/screens/NotesScreen.tsx','utf8').includes('PG medical practice and official exam information'));
console.log(JSON.stringify({release_policy:'publisher_declared_mit_practice',third_party_questions_released:PG_COMPACT.total,question_data_bytes:PG_COMPACT_BYTES,original_practice_questions:10,subjects:9,chapters:10,official_information_links:3,verified_exam_years:0,independently_medically_reviewed_answers:0,legal_immunity_guaranteed:false}));
