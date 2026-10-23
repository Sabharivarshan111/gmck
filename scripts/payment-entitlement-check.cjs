// Production native entitlement reader under account/expiry transitions.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const values=new Map();let current='account-a';const rows=new Map();
const storage={getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{values.set(key,value);},removeItem:async key=>{values.delete(key);}};
const supabase={auth:{getSession:async()=>({data:{session:current?{user:{id:current}}:null}})},from:()=>{
 let owner;const query={select(){return query;},eq(key,value){if(key==='user_id')owner=value;return query;},order(){return query;},limit(){return query;},async maybeSingle(){return {data:rows.has(owner)?{expires_at:rows.get(owner)}:null,error:null};}};return query;
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
 console.log('Native payment sync: purchase, reopen, wrong-account isolation, expiry and sign-out passed (fixture API).');
})().catch(error=>{console.error(error);process.exitCode=1;});
