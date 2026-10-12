#!/usr/bin/env node
/** Execute the active reader with denied imports: a hold must not load any corpus assets. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const ts=createRequire(import.meta.url)('../mobile/node_modules/typescript');
const file='mobile/src/lib/pgLocalBank.ts';
const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};
vm.runInThisContext(`(function(require,module,exports){${output}\n})`,{filename:file})(specifier=>{throw Error('Active reader must not import: '+specifier);},module,module.exports);
const reader=module.exports;
assert.deepEqual(reader.getPgOfflinePacks(),[]);
const cases=[
 {exam:'ALL',year:null,search:'',offset:0,limit:40},
 {exam:'NEET_PG',year:1991,search:'medicine',offset:40,limit:40},
 {exam:'FMGE',year:2002,search:'',offset:0,limit:1},
 {exam:'INI_CET',year:2026,search:'private token',offset:185637,limit:100},
 {exam:'GENERAL_MEDICAL',year:null,search:'',offset:0,limit:50},
];
for(const input of cases)assert.deepEqual(await reader.searchOfflinePgQuestions(input),{questions:[],total:0,packsScanned:0});
console.log(`PG distribution hold: ${cases.length} production reader cases passed, with no corpus import permitted.`);
