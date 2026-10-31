import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createClient } from '@supabase/supabase-js';
const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../web/adapters/auth-storage.ts', import.meta.url),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, {exports});
const {createBrowserAuthStorage,isBrowserAuthKey} = exports;
function fixture({localFails=false,idbFails=false}={}) {
 const local=new Map(),idb=new Map();
 const browser={getItem:k=>{if(localFails)throw Error('Blocked localStorage');return local.get(k)??null;},setItem:(k,v)=>{if(localFails)throw Error('Blocked localStorage');local.set(k,v);},removeItem:k=>{if(localFails)throw Error('Blocked localStorage');local.delete(k);}};
 const previous={getItem:async k=>{if(idbFails)throw Error('Blocked IDB');return idb.get(k)??null;},setItem:async(k,v)=>{if(idbFails)throw Error('Blocked IDB');idb.set(k,v);},removeItem:async k=>{if(idbFails)throw Error('Blocked IDB');idb.delete(k);}};
 return {local,idb,browser,storage:createBrowserAuthStorage(()=>browser,previous)};
}
const key='sb-fixture-auth-token';
assert.equal(isBrowserAuthKey(key),true);assert.equal(isBrowserAuthKey(key+'-code-verifier'),true);assert.equal(isBrowserAuthKey('orbit-profile-v1'),false);
const f=fixture();f.idb.set(key,'stale');f.local.set(key,'current');assert.equal(await f.storage.getItem(key),'current');
f.local.set(key,'legacy-refreshed');assert.equal(await f.storage.getItem(key),'legacy-refreshed');
await f.storage.setItem(key,'homepage-refreshed');assert.equal(f.local.get(key),'homepage-refreshed');
f.local.delete(key);assert.equal(await f.storage.getItem(key),null,'Legacy logout must never restore the old IDB session');
const migrated=fixture();migrated.idb.set(key,'idb-only');assert.equal(await migrated.storage.getItem(key),'idb-only');assert.equal(migrated.local.get(key),'idb-only');await migrated.storage.removeItem(key);assert.equal(await migrated.storage.getItem(key),null);
const denied=fixture({localFails:true});await denied.storage.setItem(key,'fallback');assert.equal(await denied.storage.getItem(key),'fallback');await denied.storage.removeItem(key);assert.equal(await denied.storage.getItem(key),null);
const noIDB=fixture({idbFails:true});await noIDB.storage.setItem(key,'saved');assert.equal(await noIDB.storage.getItem(key),'saved');await noIDB.storage.removeItem(key);assert.equal(await noIDB.storage.getItem(key),null);
const full=fixture({localFails:true,idbFails:true});await assert.rejects(full.storage.setItem(key,'unsaved'));
// Real Supabase SDK: restore an expired session, rotate its refresh token, then
// simulate closing/reopening the app. No live account or external request.
const sdk=fixture();let refreshes=0;
const user={id:'00000000-0000-4000-8000-000000000031',aud:'authenticated',role:'authenticated',is_anonymous:false,email:'session-test@example.invalid',app_metadata:{provider:'google'},user_metadata:{},created_at:'2026-01-01T00:00:00Z'};
const jwt=exp=>`${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:user.id,exp})).toString('base64url')}.fixture`;
sdk.local.set(key,JSON.stringify({access_token:jwt(Math.floor(Date.now()/1000)-60),refresh_token:'first-refresh',expires_at:Math.floor(Date.now()/1000)-60,user,token_type:'bearer'}));
const options={auth:{storage:sdk.storage,storageKey:key,autoRefreshToken:false,persistSession:true,detectSessionInUrl:false},global:{fetch:async(url,request)=>{
 assert.ok(String(url).includes('/token?grant_type=refresh_token'));assert.equal(JSON.parse(request.body).refresh_token,'first-refresh');refreshes++;
 return new globalThis.Response(JSON.stringify({access_token:jwt(Math.floor(Date.now()/1000)+3600),refresh_token:'rotated-refresh',expires_in:3600,token_type:'bearer',user}),{status:200,headers:{'content-type':'application/json'}});
}}};
const first=createClient('https://auth-fixture.invalid','fixture',options);
const restored=await first.auth.getSession();assert.equal(restored.error,null);assert.equal(restored.data.session.refresh_token,'rotated-refresh');assert.equal(JSON.parse(sdk.local.get(key)).refresh_token,'rotated-refresh');await first.auth.stopAutoRefresh();
const reopened=createClient('https://auth-fixture.invalid','fixture',options);
assert.equal((await reopened.auth.getSession()).data.session.user.id,user.id);assert.equal(refreshes,1,'Reopening must reuse the saved refreshed session');
await reopened.auth.signOut({scope:'local'});assert.equal(await sdk.storage.getItem(key),null);await reopened.auth.stopAutoRefresh();
console.log('PASS browser auth: stale-copy precedence, both-bundle refreshes, migration, logout, denied stores, real SDK token rotation and reopen.');
process.exit(0);
