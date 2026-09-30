import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
async function scenario(file,mode){
 let creates=0,gets=0,fail=mode==='retry';
 const signed={user:{id:'existing-account'}},guest={user:{id:'guest-account'}};
 const auth={
  getSession:async()=>{gets++;return {data:{session:mode==='existing'?signed:null},error:mode==='read-error'&&fail?new Error('Storage unavailable'):null}},
  signInAnonymously:async()=>{creates++;await new Promise(r=>setTimeout(r,5));return fail?{data:{session:null},error:new Error('Auth unavailable')}:{data:{session:guest},error:null}}
 };
 const exports={};
 const source=fs.readFileSync(file,'utf8').replace(/^import .*;\s*$/gm,'');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{exports,supabase:{auth},Error});
 if(mode==='existing'){assert.equal(await exports.ensureAnonymousSession(),signed);assert.equal(creates,0)}
 else if(mode==='retry'){await assert.rejects(exports.ensureAnonymousSession(),/Auth unavailable/);fail=false;assert.equal(await exports.ensureAnonymousSession(),guest);assert.equal(creates,2)}
 else {const results=await Promise.all(Array.from({length:5},()=>exports.ensureAnonymousSession()));assert.ok(results.every(s=>s===guest));assert.equal(creates,1);assert.equal(gets,1)}
}
(async()=>{const repo=path.resolve(__dirname,'../..');for(const file of ['src/lib/anonymousSession.ts','mobile/src/lib/anonymousSession.ts'])for(const mode of ['existing','concurrent','retry'])await scenario(path.join(repo,file),mode);console.log('6 presence session cases passed: preserve accounts, coalesce guest creation, retry safely after errors.')})().catch(e=>{console.error(e);process.exitCode=1});
