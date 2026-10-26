import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
const root=path.resolve(import.meta.dirname,'..');
function load(file,mocks){
 const exports={},code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require:key=>{if(key in mocks)return mocks[key];throw Error('Missing mock '+key);},console,setTimeout,clearTimeout});return exports;
}
function fixture({writeFails=false,cloud=null}={}){
 const values=new Map(),storage={getItem:async k=>values.get(k)??null,setItem:async(k,v)=>{if(writeFails)throw Error('Disk full');values.set(k,v);}};
 const supabase={auth:{getSession:async()=>({data:{session:cloud?{user:{id:'own-account'}}:null}}),signInAnonymously:async()=>({error:{message:'Offline'}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:cloud})})})}),rpc:async()=>({data:null,error:null})};
 const profile=load('src/lib/profile.ts',{'@react-native-async-storage/async-storage':{__esModule:true,default:storage},'@shared/profanity':{validateDisplayName:n=>({ok:n.trim().length>=2,reason:'Enter a display name'})},'@shared/university':load('../src/lib/university.ts',{}),'./supabase':{supabase},'./guestMerge':{retryGuestMerge:async()=>{}},'@/lib/log':{warn:()=>{}}});
 const hook=load('src/hooks/useProfile.ts',{'react':{useCallback:f=>f,useSyncExternalStore:()=>{}},'@/lib/profile':profile,'@/lib/progress':{reconcileProgress:async()=>{}},'@/lib/streak':{currentValue:()=>0,recordToday:async()=>({})}});
 return {values,profile,hook};
}
const clean={display_name:'Student',year:'final',university:'tnmgr'};
for(const mode of ['valid','invalid','failed-write']){
 const f=fixture({writeFails:mode==='failed-write'});await f.hook.hydrateProfile();
 if(mode==='valid'){await f.hook.useProfile().save(clean);assert.equal(f.hook.useProfile().needsOnboarding,false);assert.deepEqual(JSON.parse(f.values.get('orbit-profile-v1')),clean);}
 else{await assert.rejects(f.hook.useProfile().save(mode==='invalid'?{...clean,display_name:''}:clean));assert.equal(f.hook.useProfile().local,null);assert.equal(f.hook.useProfile().needsOnboarding,true);assert.equal(f.values.has('orbit-profile-v1'),false);}
}
const recovered=fixture({cloud:{...clean,id:'own-account',xp:25,streak:2}});await recovered.hook.hydrateProfile();assert.equal(recovered.hook.useProfile().needsOnboarding,false);assert.deepEqual(JSON.parse(recovered.values.get('orbit-profile-v1')),clean);
const invalidCloud=fixture({cloud:{...clean,year:'__proto__'}});await invalidCloud.hook.hydrateProfile();assert.equal(invalidCloud.hook.useProfile().needsOnboarding,true);
// IndexedDB failure must still read/write small durable setup records via localStorage.
const values=new Map([['orbit-profile-v1',JSON.stringify(clean)]]);
const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
const code=ts.transpileModule(fs.readFileSync(path.join(root,'web/adapters/storage.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};vm.runInNewContext(code,{exports,localStorage,indexedDB:{open:()=>{const r={error:new Error('IndexedDB denied')};queueMicrotask(()=>r.onerror());return r;}},console});
assert.equal(await exports.default.getItem('orbit-profile-v1'),JSON.stringify(clean));await exports.default.setItem('orbit-profile-v1','updated');assert.equal(values.get('orbit-profile-v1'),'updated');
await assert.rejects(exports.default.setItem('large-file','x'.repeat(100001)));
console.log('PASS profile validation, write failure, durable save, own cloud recovery, malformed cloud year, and Safari storage fallback.');

for (const university of ['rguhs','knruhs','muhs','ntruhs','wbuhs']) { const f=fixture(); await f.hook.hydrateProfile(); await f.hook.useProfile().save({...clean,university}); assert.equal(JSON.parse(f.values.get('orbit-profile-v1')).university,university); }
console.log('PASS all collected university choices persist offline.');
