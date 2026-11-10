/** Executes the actual Edge handler with isolated auth/model/database fixtures. */
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
const source = readFileSync(new URL('../supabase/functions/generate-handwritten-notes/index.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
const js=stripTypeScriptTypes(source,{mode:'transform'});
const note={sections:[{type:'definition',title:'Fixture',payload:{text:'Fixture content'}}]};
function harness({paid=false,admin=false,anonymous=false,cached=false,sharedCached=false,failModel=false,emptyModel=false}={}) {
 let handle, calls=0, released=0, reservations=0;
 const trials=new Map();
 const chain=new Proxy(()=>{}, {get:(_t,k)=> k==='then'?undefined:k==='upsert'?async()=>({error:null}):k==='maybeSingle'?async()=>({data:cached?{content:note}:null,error:null}):()=>chain,apply:()=>chain});
 const client={auth:{getUser:async()=>({data:{user:{id:'fixture-user',is_anonymous:anonymous}},error:null})},from:table=>sharedCached && table==='handwritten_notes'?{select:()=>({eq:()=>({maybeSingle:async()=>({data:{content:note},error:null})})})}:chain,rpc:async(name,p)=>{
   if(name==='consume_edge_quota')return {data:true,error:null};
   if(name==='reserve_handwritten_note_trial'){
    reservations++;
    if(paid||admin)return {data:{allowed:true,premium:true},error:null};
    let t=trials.get(p._generation);
    if(t && t.hash!==p._fingerprint)return {data:{allowed:false,code:'GENERATION_MISMATCH'}};
    if(t?.results[p._batch])return {data:{allowed:true,cached_response:t.results[p._batch]}};
    if(!t){if(trials.size>=2)return {data:{allowed:false,code:'PREMIUM_REQUIRED'}};t={hash:p._fingerprint,results:{}};trials.set(p._generation,t);}
    return {data:{allowed:true,lease:'lease-fixture'}};
   }
   if(name==='finish_handwritten_note_trial'){
    const t=trials.get(p._generation);
    if(p._result===null){released++;if(!Object.keys(t.results).length)trials.delete(p._generation);}
    else t.results[p._batch]=p._result;
    return {data:true,error:null};
   }
   throw Error(name);
 }};
 const schema=new Proxy(()=>{}, {get:(_t,k)=>k==='safeParse'?body=>({success:true,data:body}):()=>schema,apply:()=>schema});
 const context={console:{log(){},error(){}},TextEncoder,crypto:webcrypto,Response,Request,Date,setTimeout,clearTimeout,AbortController,fetch:()=>{throw Error('unexpected real network');},Deno:{env:{get:n=>n==='SUPABASE_SERVICE_ROLE_KEY'?'service':n==='SUPABASE_ANON_KEY'?'anon':'fixture'}},z:schema,serve:fn=>handle=fn,createClient:()=>client,buildTextbookContext:async()=>'',buildPharmContext:async()=>({}),pickBookKey:()=>null,BOOK_LABELS:{},modelFixture:async()=>{calls++;if(failModel)throw Error('provider unavailable');return JSON.stringify(emptyModel?{sections:[]}:note);}};
 vm.runInNewContext(js+'\ncallModel = modelFixture;',context);
 const send=async body=>{const response=await handle(new Request('https://fixture.invalid',{method:'POST',headers:{authorization:'Bearer user','content-type':'application/json'},body:JSON.stringify({subtopicKey:'fixture-note',year:'Second year',subject:'Pathology',subtopicName:'Fixture',questions:['Fixture question'],...body})}));return {status:response.status,body:await response.json()};};
 return {send,stats:()=>({calls,released,reservations,trials:trials.size})};
}
const free=harness();
assert.equal((await free.send({generationId:'one'})).status,200);
assert.equal((await free.send({generationId:'one'})).status,200);
assert.equal(free.stats().calls,1,'lost-response retry must reuse completed result');
assert.equal((await free.send({generationId:'one',questions:['Changed question']})).status,409,'cannot reuse trial ID for different note');
assert.equal((await free.send({generationId:'two'})).status,200);
const blocked=await free.send({generationId:'three'});assert.equal(blocked.status,402);assert.equal(blocked.body.code,'PREMIUM_REQUIRED');assert.equal(free.stats().calls,2);
const batches=harness();const questions=Array.from({length:21},(_,i)=>'Question '+i);
for(let batchIndex=0;batchIndex<3;batchIndex++)assert.equal((await batches.send({questions,batchIndex,generationId:'topic'})).status,200);
assert.equal(batches.stats().trials,1,'topic batches count as one generation');
for(const config of [{paid:true},{admin:true}]){const h=harness(config);for(let i=0;i<3;i++)assert.equal((await h.send({generationId:'note-'+i})).status,200);}
const saved=harness({cached:true});assert.equal((await saved.send({})).status,200);assert.equal(saved.stats().reservations,0,'reading cached notes must remain free');
const shared=harness({sharedCached:true});for(let i=0;i<2;i++)assert.equal((await shared.send({generationId:'shared-'+i,subtopicKey:'shared-'+i})).status,200);assert.equal((await shared.send({generationId:'shared-third',subtopicKey:'shared-third'})).status,402);assert.equal(shared.stats().calls,0,'shared cache first access uses allowance without model spend');
const anon=harness({anonymous:true});assert.equal((await anon.send({generationId:'guest'})).status,401);assert.equal(anon.stats().calls,0);
const failed=harness({failModel:true});assert.equal((await failed.send({generationId:'fail'})).status,500);assert.equal(failed.stats().released,1);assert.equal(failed.stats().trials,0,'provider failure must refund reservation');
const empty=harness({emptyModel:true});assert.equal((await empty.send({generationId:'empty'})).status,500);assert.equal(empty.stats().trials,0,'empty AI output must not consume allowance');
const edit=harness();assert.equal((await edit.send({generationId:'edit',editInstruction:'Clarify',content:note})).status,200);assert.equal(edit.stats().trials,1,'AI editing also uses allowance');
// Build adapter must still match the real Vault source after common badges move.
const adapterSource=readFileSync(new URL('../mobile/web/premium-transform.ts',import.meta.url),'utf8');
const adapter=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(adapterSource,{mode:'transform'})).toString('base64'));
const vault=readFileSync(new URL('../mobile/src/screens/NotesScreen.tsx',import.meta.url),'utf8');
const transformed=adapter.transformWebsitePremium(vault,'/repo/mobile/src/screens/NotesScreen.tsx','/access');
assert.ok(transformed.includes('Free preview'));assert.ok(transformed.includes('2 free AI generations total'));
console.log('PASS: free 1/2/third-denial, retry idempotency, request binding, multi-batch, paid/admin, saved/shared cache, guests, failure/empty-output refund, AI edits and web Vault adapter.');
