const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const ts = require('typescript');
const { webcrypto } = require('crypto');
async function run(file, token, quota, expected) {
  let handler, modelCalls = 0, authCalls = 0, checks = [];
  const schema = new Proxy(function () {}, { get: (_t, key) => key === 'safeParse'
    ? () => ({success:false,error:{issues:[{message:'invalid fixture'}],flatten:()=>({fieldErrors:{}})}})
    : schema, apply: () => schema });
  const context = { Request, Response, TextEncoder, crypto:webcrypto, URL, console:{log(){},error(){}},
    z:schema, corsHeaders:{'Access-Control-Allow-Origin':'*'}, serve: fn => {handler=fn},
    Deno:{env:{get:key=>({SUPABASE_URL:'https://fixture.invalid',SUPABASE_ANON_KEY:'public-key',SUPABASE_SERVICE_ROLE_KEY:'server-key',GEMINI_API_KEY:'fixture'})[key]},serve:fn=>{handler=fn}},
    GoogleGenerativeAI:class{constructor(){modelCalls++;throw new Error('Unexpected model call')}},
    createClient:()=>({auth:{getUser:async value=>{authCalls++;return value==='valid-user'?{data:{user:{id:'fixture-user'}},error:null}:{data:{user:null},error:new Error('Invalid')}}},
      rpc:async (_name,args)=>{checks.push(args);return {data:quota==='allow',error:quota==='error'?new Error('Unavailable'):null}}}) };
  let code=fs.readFileSync(file,'utf8').replace(/^import .*;\s*$/gm,'');
  code=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(code,context);
  const headers={'content-type':'application/json','cf-connecting-ip':'192.0.2.10'};
  if(token) headers.authorization='Bearer '+token;
  const response=await handler(new Request('https://fixture.invalid',{method:'POST',headers,body:'{'}));
  assert.equal(response.status,expected,file+': '+token+' '+quota);
  assert.equal(modelCalls,0);
  if(token==='public-key') assert.equal(authCalls,0);
  if(token==='invalid-token'||!token) assert.equal(checks.length,0);
  if(quota==='allow'&&(token==='public-key'||token==='valid-user')) assert.equal(checks.length,3);
}
(async()=>{for(const [file,valid] of [['supabase/functions/ask-gemini/index.ts',200],['supabase/functions/quiz-from-subtopic/index.ts',400]]) {
  for(const args of [[null,'allow',401],['invalid-token','allow',401],['public-key','allow',valid],['valid-user','allow',valid],['public-key','deny',429],['valid-user','error',503]]) await run(file,...args);
} console.log('12 edge guard cases passed: visitor compatibility, invalid tokens, quota denial and database failure; no paid calls.');})().catch(e=>{console.error(e);process.exitCode=1});
