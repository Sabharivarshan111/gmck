const fs = require('fs'), vm = require('vm'), assert = require('assert/strict'), ts = require('typescript');
const { webcrypto } = require('crypto');
function load(file, extra = {}) {
  const context = { exports: {}, Request, Response, Headers, TextEncoder, Uint8Array, URL, AbortSignal,
    crypto: webcrypto, btoa, console: { log(){}, warn(){}, error(){} },
    Deno: { env: { get: key => key === 'RAZORPAY_KEY_SECRET' ? 'dummy-test-key' : key === 'ORBIT_ALLOWED_ORIGINS' ? '' : 'fixture' } }, ...extra };
  const source = fs.readFileSync(file, 'utf8').replace(/^import .*;\s*$/gm, '');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return context;
}
(async () => {
  let checks = 0;
  const guard = load('supabase/functions/_shared/endpointSecurity.ts').exports.secureEndpoint;
  let calls = 0;
  const handler = guard(async () => { calls++; return new Response('{"ok":true}'); }, { maxBytes: 32 });
  for (const [origin, status] of [['https://mbbsqbank-questor.lovable.app',200], ['https://evil.invalid',403], [undefined,200]]) {
    const result = await handler(new Request('https://fixture.invalid', { method: 'POST', headers: origin ? { origin } : {}, body:'{}' }));
    assert.equal(result.status, status); assert.equal(result.headers.get('x-content-type-options'), 'nosniff');
    assert.notEqual(result.headers.get('access-control-allow-origin'), '*'); checks++;
  }
  const before = calls;
  const stream = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(33)); c.close(); } });
  assert.equal((await handler(new Request('https://fixture.invalid', { method:'POST', body:stream, duplex:'half' }))).status,413);
  assert.equal(calls,before); checks++;
  assert.equal((await handler(new Request('https://fixture.invalid'))).status,405); checks++;
  const failure = await guard(() => new Response('{"error":"database-secret-detail"}', { status:500 }))(new Request('https://fixture.invalid', { method:'POST' }));
  assert.doesNotMatch(await failure.text(), /database-secret-detail/); checks++;
  const thrown = await guard(() => { throw Error('secret'); })(new Request('https://fixture.invalid', { method:'POST' }));
  assert.equal(thrown.status,500); assert.doesNotMatch(await thrown.text(),/secret/); checks++;
  const { verifiedPurchase } = load('supabase/functions/_shared/razorpaySecurity.ts').exports;
  const order = { id:'order_fixture',notes:{user_id:'user-a',purpose:'adfree_monthly'},status:'paid',currency:'INR',amount:5000,amount_paid:5000 };
  const payment = { id:'pay_fixture',order_id:order.id,status:'captured',captured:true,currency:'INR',amount:5000,amount_refunded:0,created_at:Math.floor(Date.now()/1000)-10 };
  assert.equal(verifiedPurchase(order,payment,'user-a').plan,'adfree_monthly'); checks++;
  for (const [o,p,u] of [
    [order,payment,'user-b'],[order,{...payment,status:'authorized'},'user-a'],
    [order,{...payment,captured:false},'user-a'],[order,{...payment,currency:'USD'},'user-a'],
    [order,{...payment,amount:30000},'user-a'],[order,{...payment,amount_refunded:1},'user-a'],
    [order,{...payment,order_id:'order_other'},'user-a'],[{...order,notes:{user_id:'user-a',purpose:'unknown'}},payment,'user-a'],
    [{...order,amount_paid:0},payment,'user-a'],[{...order,status:'created'},payment,'user-a'],
  ]) { assert.equal(verifiedPurchase(o,p,u),null); checks++; }
  // Execute the production verifier: even a signed-in caller cannot pick a better plan.
  const key=await webcrypto.subtle.importKey('raw',new TextEncoder().encode('dummy-test-key'),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signature=Buffer.from(await webcrypto.subtle.sign('HMAC',key,new TextEncoder().encode(order.id+'|'+payment.id))).toString('hex');
  let edge, grants=0;
  const helpers = load('supabase/functions/_shared/razorpaySecurity.ts').exports;
  load('supabase/functions/razorpay-verify-payment/index.ts', { ...helpers, secureEndpoint:guard,
    Deno:{env:{get:()=> 'dummy-test-key'},serve: fn => {edge=fn;}},
    signedInUser:async()=>({id:'user-a'}),provider:async path=>path.startsWith('orders/')?order:payment,
    grantPurchase:async (_u,_o,_p,proof)=>{grants++;assert.equal(proof.plan,'adfree_monthly');return new Response('{"success":true}');},
  });
  const response = await edge(new Request('https://fixture.invalid', {method:'POST', body:JSON.stringify({razorpay_order_id:order.id,razorpay_payment_id:payment.id,razorpay_signature:signature,plan:'adfree_1y'})}));
  assert.equal(response.status,200); assert.equal(grants,1); checks++;
  // Guest transfer must verify both identities, and never trust body uid/device id.
  let merge, rpcCalls=0;
  load('supabase/functions/merge-guest-account/index.ts', {secureEndpoint:guard,
    Deno:{env:{get:()=> 'fixture'},serve:fn=>{merge=fn;}},
    createClient:()=>({auth:{getUser:async token=>({data:{user:token==='current'?{id:'new',is_anonymous:false}:token==='guest'?{id:'old',is_anonymous:true}:null},error:token==='invalid'?{}:null})},
      rpc:async(name,args)=>{rpcCalls++;assert.equal(name,'merge_verified_guest');assert.equal(args._old_user_id,'old');assert.equal(args._new_user_id,'new');return {error:null};}}),
  });
  for (const [token,status] of [['invalid',403],['guest',200]]) {
    const response=await merge(new Request('https://fixture.invalid',{method:'POST',headers:{authorization:'Bearer current'},body:JSON.stringify({guest_access_token:token,uid:'victim',device_id:'known-device'})}));
    assert.equal(response.status,status); checks++;
  }
  assert.equal(rpcCalls,1);
  console.log(checks+' transport/payment/guest authorization cases passed; no external provider or user-data writes.');
})().catch(error=>{console.error(error);process.exitCode=1;});
