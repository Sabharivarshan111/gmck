const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ts=require('typescript');
const {webcrypto}=require('crypto');
async function run(token,quota,cached,expected) {
 let handler,calls=0;const checks=[],writes=[];
 const body={year:'first',subject:'Anatomy',subtopicKey:'fixture',subtopicName:'Fixture',questions:['Fixture'],regenerate:!cached,noCache:false};
 const schema=new Proxy(function(){},{get:(_t,k)=>k==='safeParse'?()=>({success:true,data:body}):schema,apply:()=>schema});
 const from=table=>{const chain=new Proxy({}, {get:(_t,k)=>{
  if(k==='then')return Promise.resolve({data:[],error:null}).then.bind(Promise.resolve({data:[],error:null}));
  if(k==='maybeSingle')return async()=>({data:cached?{cards:[{front:'Fixture',back:'Fixture'}],deck_target:20}:null,error:null});
  if(k==='upsert')return async row=>{writes.push({table,row});return {error:null}};
  return ()=>chain;
 }});return chain};
 const context={secureEndpoint:handler=>handler, ensureLongEssay:value=>value,Request,Response,TextEncoder,crypto:webcrypto,AbortController,setTimeout,clearTimeout,console:{log(){},error(){},warn(){}},z:schema,serve:fn=>{handler=fn},
  pickBookKeys:()=>[],buildTextbookContext:async()=>'',
  Deno:{env:{get:k=>({SUPABASE_URL:'https://fixture.invalid',SUPABASE_ANON_KEY:'public-key',SUPABASE_SERVICE_ROLE_KEY:'server-key',GEMINI_API_KEY:'fixture'})[k]}},
  fetch:async()=>{calls++;return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({theoryCards:[{front:'Fixture question',back:'Fixture answer',tags:[]}],diagramCards:[]})}]}}]}))},
  createClient:()=>({from,auth:{getUser:async t=>({data:{user:t==='valid-user'?{id:'user-a'}:null},error:t==='valid-user'?null:new Error('Invalid')})},rpc:async(_n,args)=>{checks.push(args);return {data:quota==='allow',error:quota==='error'?new Error('Unavailable'):null}}})};
 const source=fs.readFileSync('supabase/functions/generate-flashcards/index.ts','utf8').replace(/^import .*;\s*$/gm,'');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
 const headers={'content-type':'application/json','cf-connecting-ip':'192.0.2.10'};if(token)headers.authorization='Bearer '+token;
 const res=await handler(new Request('https://fixture.invalid',{method:'POST',headers,body:JSON.stringify(body)}));
 assert.equal(res.status,expected);
 if(expected===200&&!cached){assert.equal(calls,1);assert.equal(writes.length,1);assert.match(writes[0].row.deck_key,/::input:[a-f0-9]{64}$/);assert.equal((await res.json()).deckKey,'first::Anatomy::fixture')}
 else {assert.equal(calls,0);assert.equal(writes.length,0)}
 if(cached)assert.equal(checks.length,0);
}
(async()=>{for(const args of [[null,'allow',false,401],['invalid','allow',false,401],['public-key','allow',true,200],['valid-user','allow',true,200],['public-key','deny',false,429],['valid-user','error',false,503],['valid-user','allow',false,200]])await run(...args);console.log('7 flashcard security cases passed: free cache reads, token validation, quota failures and fingerprinted cache writes with stable deck identity.')})().catch(e=>{console.error(e);process.exitCode=1});
