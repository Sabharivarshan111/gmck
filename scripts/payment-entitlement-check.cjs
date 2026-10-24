// Production native entitlement reader under account/expiry transitions.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const values=new Map();let current='account-a';const rows=new Map();
const storage={getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{values.set(key,value);},removeItem:async key=>{values.delete(key);}};
const supabase={auth:{getUser:async()=>({data:{user:current?{id:current,is_anonymous:false}:null},error:null}),getSession:async()=>({data:{session:current?{user:{id:current}}:null}})},from:()=>{
 let owner;const query={select(){return query;},gt(){return query;},eq(key,value){if(key==='user_id')owner=value;return query;},order(){return query;},limit(){return query;},async maybeSingle(){return {data:rows.has(owner)?{expires_at:rows.get(owner)}:null,error:null};}};return query;
}};
function reader(){const context={exports:{},secureStorage:storage,supabase,useEffect(){},AppState:{}};const code=fs.readFileSync('mobile/src/lib/premium.ts','utf8').replace(/^import .*;\s*$/gm,'');vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);return context.exports;}
(async()=>{
 let app=reader();assert.equal(app.isPremiumCached(),false);
 assert.equal(await app.syncPremiumCache(),null);
 const expiry=new Date(Date.now()+180*86400000).toISOString();rows.set('account-a',expiry);
 assert.equal(await app.syncPremiumCache(),expiry);assert.equal(app.isPremiumCached(),true);
 app=reader();await app.hydratePremium();assert.equal(app.isPremiumCached(),true);
 current='account-b';app=reader();await app.hydratePremium();assert.equal(app.isPremiumCached(),false);assert.equal(await app.syncPremiumCache(),null);
 current='account-a';rows.set('account-a',new Date(Date.now()-1000).toISOString());await app.syncPremiumCache();assert.equal(app.isPremiumCached(),false);
 current=null;await app.syncPremiumCache();assert.equal(app.isPremiumCached(),false);
 const context={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/website-premium.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
 const website=context.exports;
 current='account-a';rows.delete(current);values.set('orbit:premium-until',expiry);values.set('orbit:premium-owner-v1',current);
 assert.equal(await website.readWebsitePremium(supabase),null,'forged cache cannot unlock website');
 rows.set(current,expiry);assert.equal(await website.readWebsitePremium(supabase),expiry);
 rows.set(current,'invalid date');assert.equal(await website.readWebsitePremium(supabase),null);
 rows.set(current,new Date(Date.now()-1000).toISOString());assert.equal(await website.readWebsitePremium(supabase),null);
 current='account-b';assert.equal(await website.readWebsitePremium(supabase),null);
 console.log('Website server-row access: forged cache, expired/invalid date and other-account rejection passed.');
 console.log('Native payment sync: purchase, reopen, wrong-account isolation, expiry and sign-out passed (fixture API).');
})().catch(error=>{console.error(error);process.exitCode=1;});
