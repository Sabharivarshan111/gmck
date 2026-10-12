#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const ts=createRequire(import.meta.url)('../mobile/node_modules/typescript');
const read=p=>fs.readFileSync(p,'utf8');
const module={exports:{}};
const bank='mobile/src/lib/pgEntranceBank.ts';
const compiled=ts.transpileModule(read(bank),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInThisContext(`(function(require,module,exports){${compiled}\n})`,{filename:bank})(id=>{throw Error('No research catalog imports: '+id);},module,module.exports);
const {PG_SOURCES:sources,PG_ORIGINAL_PRACTICE:original}=module.exports;
assert.equal(sources.length,3);
assert.deepEqual(sources.map(s=>s.exam).sort(),['FMGE','INI_CET','NEET_PG']);
for(const source of sources) {
 assert.ok(['natboard.edu.in','www.aiimsexams.ac.in'].includes(new URL(source.url).hostname));
 assert.equal(source.kind,'Official information');
 assert.equal(source.reuseStatus,'reference_only');
}
assert.equal(original.length,10);
for(const q of original) {assert.equal(q.year,null);assert.equal(q.exam,'ORIGINAL');assert.equal(q.record_type,'original_exam_style');assert.equal(q.options.length,4);}
const ui=read('mobile/src/components/PgEntranceBankModal.tsx');
assert.match(ui,/original practice only/);assert.match(ui,/withheld pending documented permissions/);
assert.ok(!ui.includes('PG_QUARANTINED_TOTAL'));
const form=read('mobile/src/components/PgRecentAnswerReview.tsx');
assert.match(form,/question you own or have permission to use/);
assert.ok(!form.includes('Paste recalled'));
const server=read('supabase/functions/pg-answer-review/index.ts');
for(const pattern of [/auth\.auth\.getUser\(token\)/,/consume_edge_quota/,/retrievePassages/,/source_year_verified:false/,/independently_medically_reviewed:false/,/answer:"UNRESOLVED"/])assert.match(server,pattern);
assert.match(form,/supabase\.functions\.invoke\('pg-answer-review'/);
console.log('PG release: zero third-party question distribution; 10 undated original samples and three official information links. AI answers remain provisional.');
