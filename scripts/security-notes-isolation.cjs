const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ts=require('typescript');
const {webcrypto}=require('crypto');
async function run(token, mode) {
  let handler;const writes=[],reads=[];
  const content={highYieldTip:'Fixture',pyqYears:[],sections:[{type:'bullets',title:'Fixture',payload:{items:[{label:'Test',description:'Fixture'}]}}]};
  const body={subtopicKey:'fixture',year:'first',subject:'Anatomy',subtopicName:'Fixture',questions:['Fixture'],batchIndex:0,saveContent:mode==='save',content};
  const schema=new Proxy(function(){},{get:(_t,k)=>k==='safeParse'?()=>({success:true,data:body}):schema,apply:()=>schema});
  const context={Request,Response,TextEncoder,crypto:webcrypto,console:{log(){},error(){}},z:schema,serve:fn=>{handler=fn},
    Deno:{env:{get:k=>({SUPABASE_URL:'https://fixture.invalid',SUPABASE_ANON_KEY:'public-key',SUPABASE_SERVICE_ROLE_KEY:'server-key'})[k]}},
    createClient:()=>({auth:{getUser:async t=>({data:{user:t==='valid-user'?{id:'user-a'}:null},error:t==='valid-user'?null:new Error('Invalid')})},
      from:table=>({upsert:async row=>{writes.push({table,row});return {error:null}},select:()=>{const chain={eq:()=>chain,maybeSingle:async()=>{reads.push(table);return {data:{content},error:null}}};return chain}})})};
  let code=fs.readFileSync('supabase/functions/generate-handwritten-notes/index.ts','utf8').replace(/^import .*;\s*$/gm,'');
  vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
  const res=await handler(new Request('https://fixture.invalid',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(body)}));
  const result=await res.json();
  if(token==='invalid'){assert.equal(res.status,401);assert.equal(writes.length,0);return}
  assert.equal(res.status,200);
  if(mode==='save') {
    if(token==='public-key'){assert.equal(writes.length,0);assert.equal(result.saved,false)}
    else {assert.equal(writes.length,1);assert.equal(writes[0].table,token==='server-key'?'handwritten_notes':'personal_handwritten_notes');if(token==='valid-user')assert.equal(writes[0].row.user_id,'user-a')}
  } else {assert.equal(result.cached,true);assert.equal(writes.length,0);assert.equal(reads[0],token==='valid-user'?'personal_handwritten_notes':'handwritten_notes')}
}
(async()=>{for(const token of ['valid-user','public-key','server-key','invalid'])for(const mode of ['save','read'])await run(token,mode);console.log('8 notes isolation cases passed: personal writes, visitor no-write, internal cache writes, and private-first reads.')})().catch(e=>{console.error(e);process.exitCode=1});
