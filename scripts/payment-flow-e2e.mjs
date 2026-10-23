// Exercises the emitted production checkout; provider and auth traffic are fixtures.
// No real Google credentials, Razorpay charge, or durable backend writes.
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '../mobile/node_modules/playwright-core/index.mjs';
const root=path.resolve('dist');
const server=http.createServer(async(req,res)=>{
 try {
  const pathname=new URL(req.url,'http://local').pathname;
  const name=['/','/unlock','/unlock/'].includes(pathname)?'/index.html':pathname;
  const file=path.resolve(root,'.'+decodeURIComponent(name));
  if(!file.startsWith(root+'/')){res.writeHead(403);res.end();return;}
  const bytes=await fs.readFile(file);
  const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.woff2':'font/woff2'};
  res.writeHead(200,{'content-type':types[path.extname(file)]??'application/octet-stream'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true,args:['--no-sandbox']});
const user={id:'00000000-0000-4000-8000-000000000001',email:'checkout-fixture@example.invalid',is_anonymous:false,app_metadata:{provider:'google',providers:['google']},user_metadata:{},aud:'authenticated',role:'authenticated',created_at:'2026-01-01T00:00:00Z'};
const expiry=new Date(Date.now()+180*86400000).toISOString();
const jwt=`${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:user.id,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.fixture`;
async function scenario(width,signedIn=true,verificationFails=false,interrupted=false){
 const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
 const calls=[];let active=false;
 await context.addInitScript(({signedIn,user,jwt})=>{
  if(signedIn)localStorage.setItem('sb-pmtgeydtqypwrypshhsx-auth-token',JSON.stringify({access_token:jwt,refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}));
 },{signedIn,user,jwt});
 await context.route('https://pmtgeydtqypwrypshhsx.supabase.co/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','content-type':'application/json'};
  if(req.method()==='OPTIONS'){await route.fulfill({status:204,headers});return;}
  if(url.pathname==='/auth/v1/user'){await route.fulfill({headers,body:JSON.stringify(user)});return;}
  if(url.pathname.includes('/rest/v1/premium_subscriptions')){await route.fulfill({headers,body:JSON.stringify(active?{expires_at:expiry}:null)});return;}
  if(url.pathname.includes('/functions/v1/')){
   const name=url.pathname.split('/').pop();const body=req.postDataJSON();calls.push({name,body});
   if(name==='razorpay-create-order')await route.fulfill({headers,body:JSON.stringify({order_id:'order_fixture',amount:body.plan==='adfree_6m'?15000:30000,currency:'INR',key_id:'rzp_test_fixture',plan:body.plan,label:'ORBIT Premium'})});
   else if(verificationFails&&name==='razorpay-verify-payment')await route.fulfill({status:503,headers,body:JSON.stringify({error:'Verification temporarily unavailable. Restore before paying again.'})});
   else {active=true;await route.fulfill({headers,body:JSON.stringify({success:true,restored:true,adfree_until:expiry,expires_at:expiry,payment_id:'pay_fixture',order_id:'order_fixture'})});}
   return;
  }
  await route.fulfill({headers,body:'[]'});
 });
 await context.route('https://checkout.razorpay.com/v1/checkout.js',route=>route.fulfill({contentType:'text/javascript',body:`window.Razorpay=class {constructor(options){this.options=options}on(){}open(){window.__checkout=this.options;${interrupted?'':"setTimeout(()=>this.options.handler({razorpay_order_id:this.options.order_id,razorpay_payment_id:'pay_fixture',razorpay_signature:'a'.repeat(64)}),10)"}}};`}));
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/unlock');
 await page.getByRole('heading',{name:'Unlock Premium',exact:true}).waitFor();
 assert.equal(await page.locator('.checkout-plans button').count(),2);
 assert.equal(await page.getByText(/1 month/).count(),0);
 if(!signedIn){
  await page.getByRole('button',{name:'Continue with Google'}).waitFor();
  assert(await page.locator('.checkout-plans button').first().isDisabled());
 }else{
  await page.getByText(user.email,{exact:true}).waitFor();
  await page.locator('.checkout-plans button').first().click();
  if(interrupted){
   await page.waitForFunction(()=>!!window.__checkout);
   await page.reload();await page.getByText('Payment confirmed.',{exact:false}).waitFor();
   assert.deepEqual(calls.map(x=>x.name),['razorpay-create-order','razorpay-restore-purchase']);
   assert.deepEqual(calls[1].body,{order_id:'order_fixture'});
  }else if(verificationFails){
   await page.getByRole('alert').filter({hasText:'Verification temporarily unavailable'}).waitFor();
   assert.equal(await page.locator('.checkout-success').count(),0);
   await page.getByRole('button',{name:'Restore access'}).click();
   await page.getByText('Payment confirmed.',{exact:false}).waitFor();
   assert.equal(calls.filter(x=>x.name==='razorpay-create-order').length,1);
  }else{
   await page.getByText('Payment confirmed.',{exact:false}).waitFor();
   assert.deepEqual(calls[0],{name:'razorpay-create-order',body:{plan:'adfree_6m'}});
   assert.equal(calls[1].name,'razorpay-verify-payment');
   assert.equal(calls[1].body.razorpay_payment_id,'pay_fixture');
   assert(!('uid'in calls[0].body));assert(!('amount'in calls[0].body));
   await page.reload();await page.getByText('Ad-free access active until',{exact:false}).waitFor();
   assert.equal(calls.filter(x=>x.name==='razorpay-create-order').length,1);
  }
 }
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);
 await page.screenshot({path:`/tmp/orbit-checkout-${width}-${signedIn?'signed':'guest'}-${verificationFails?'recovery':'normal'}.png`,fullPage:true});
 console.log(JSON.stringify({width,signedIn,verificationFails,interrupted,calls:calls.map(x=>x.name),runtimeErrors:errors.length}));
 await context.close();
}
try{await scenario(360,false);await scenario(360);await scenario(412);await scenario(390,true,true);await scenario(390,true,false,true);console.log('Production checkout browser flows passed (fixture providers, no live charge).');}
finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
