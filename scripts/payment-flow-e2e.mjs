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
  const name=pathname==='/simulator'?'/legacy.html':['/','/notes','/unlock','/unlock/'].includes(pathname)?'/index.html':pathname;
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
async function scenario(width,signedIn=true,verificationFails=false,interrupted=false,featureMode=null,notePlan=null){
 const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
 const calls=[];let active=featureMode==='paid';let purchasedPlan=null;const owned=[];
 await context.addInitScript(({signedIn,user,jwt})=>{
  localStorage.setItem('orbit-profile-v1',JSON.stringify({display_name:'Premium tester',year:'first',university:'tnmgr'}));
  localStorage.setItem('orbit:tour-v1',JSON.stringify({seen:1}));localStorage.setItem('orbit:last-run-version','28');
  if(signedIn)localStorage.setItem('sb-pmtgeydtqypwrypshhsx-auth-token',JSON.stringify({access_token:jwt,refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}));
 },{signedIn,user,jwt});
 await context.route('https://pmtgeydtqypwrypshhsx.supabase.co/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','content-type':'application/json'};
  if(req.method()==='OPTIONS'){await route.fulfill({status:204,headers});return;}
  if(url.pathname==='/auth/v1/user'){await route.fulfill({headers,body:JSON.stringify(user)});return;}
  if(url.pathname.includes('/rest/v1/premium_subscriptions')){await route.fulfill({headers,body:JSON.stringify(url.searchParams.get('plan')?.startsWith('in.') ? owned.map(plan=>({plan,expires_at:expiry})) : active?{expires_at:expiry}:null)});return;}
  if(url.pathname.includes('/functions/v1/')){
   const name=url.pathname.split('/').pop();const body=req.postDataJSON();calls.push({name,body});
   if(name==='razorpay-create-order'){purchasedPlan=body.plan;await route.fulfill({headers,body:JSON.stringify({order_id:'order_fixture',amount:body.plan==='adfree_1y'?30000:15000,currency:'INR',key_id:'rzp_test_fixture',plan:body.plan,label:'ORBIT Premium'})});}
   else if(verificationFails&&name==='razorpay-verify-payment')await route.fulfill({status:503,headers,body:JSON.stringify({error:'Verification temporarily unavailable. Restore before paying again.'})});
   else {active=true;if(purchasedPlan?.startsWith('notes_'))owned.push(purchasedPlan);await route.fulfill({headers,body:JSON.stringify({success:true,restored:true,plan:purchasedPlan,adfree_until:expiry,expires_at:expiry,payment_id:'pay_fixture',order_id:'order_fixture'})});}
   return;
  }
  await route.fulfill({headers,body:'[]'});
 });
 await context.route('https://checkout.razorpay.com/v1/checkout.js',route=>route.fulfill({contentType:'text/javascript',body:`window.Razorpay=class {constructor(options){this.options=options}on(){}open(){window.__checkout=this.options;${interrupted?'':"setTimeout(()=>this.options.handler({razorpay_order_id:this.options.order_id,razorpay_payment_id:'pay_fixture',razorpay_signature:'a'.repeat(64)}),10)"}}};`}));
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(featureMode){
  await page.goto(origin+'/notes');
  await page.getByLabel('NEET-PG practice questions',{exact:true}).waitFor();
  if(featureMode==='free'){
   await page.getByText('Free preview',{exact:true}).first().waitFor();
   assert.equal(await page.getByText('Free preview',{exact:true}).count(),3);
   await page.getByLabel('Anki flashcards',{exact:true}).click();
   await page.getByRole('dialog').getByRole('heading',{name:'Unlock Anki flashcards',exact:true}).waitFor();
   await page.getByRole('button',{name:'Not now',exact:true}).click();
   await page.getByLabel('NEET-PG practice questions',{exact:true}).click();
   await page.getByText('10 questions per exam',{exact:false}).waitFor({timeout:5000});
   await page.getByLabel('Search offline NEET PG questions',{exact:true}).waitFor();
   for (const [exam,label] of [['AIIMS PG','AIIMS PG'],['INI-CET','INI-CET']]) { await page.getByRole('button',{name:'Open '+exam+' practice',exact:true}).click(); await page.getByLabel('Search offline '+label+' questions',{exact:true}).waitFor(); await page.getByText('10 questions per exam',{exact:false}).waitFor(); }
   await page.getByRole('button',{name:'Unlock all →',exact:true}).click();
   await page.getByRole('heading',{name:'Unlock all practice questions',exact:true}).waitFor();
   await page.getByRole('button',{name:'Not now',exact:true}).click();
   await page.goto(origin+'/notes');
   await page.getByLabel('Case proformas',{exact:true}).click();
   await page.getByLabel('Open Respiratory System (RS) Master Case Proforma',{exact:true}).click();
   await page.getByRole('heading',{name:'Unlock all case proformas',exact:true}).waitFor();
   await page.getByRole('button',{name:'Not now',exact:true}).click();
   await page.getByLabel('Open Cardiovascular System (CVS) Master Case Proforma',{exact:true}).click();
   await page.getByText('1. Patient Demographics & Presenting Complaints',{exact:true}).waitFor();
   await page.goto(origin+'/notes');
   await page.getByLabel('Notes',{exact:true}).click();
   await page.getByText('Handwritten Notes',{exact:true}).first().waitFor();
   await page.goto(origin+'/simulator');
   await page.getByTestId('simulator-studio').waitFor();
   await page.getByRole('button',{name:'Auscultation',exact:false}).click();
   await page.getByLabel('Sound demonstration',{exact:true}).selectOption('mitral_stenosis');
   await page.getByRole('heading',{name:'Unlock heart sounds & murmurs',exact:true}).waitFor();
   await page.getByRole('button',{name:'Continue free preview',exact:true}).click();
   await page.goto(origin+'/simulator?organ=liver&mode=anatomy');
   await page.locator('[data-simulator-root]').waitFor();
   assert.equal(await page.locator('[data-simulator-root]').count(),1);
   assert.equal(await page.getByRole('heading',{name:'Liver',exact:true}).count(),0);
   const initialUpsell = page.getByRole('button',{name:'Continue free preview',exact:true});
   if(await initialUpsell.isVisible()) await initialUpsell.click();
   await page.getByTestId('deep-inspector-liver').click();
   await page.getByRole('heading',{name:'Unlock all anatomy organs',exact:true}).waitFor();
   await page.getByRole('button',{name:'Continue free preview',exact:true}).click();
   await page.getByTestId('deep-inspector-heart').click();
   await page.getByRole('dialog',{name:'Anatomy details',exact:true}).waitFor();
  }else{
   await page.getByText('Premium',{exact:true}).first().waitFor({state:'hidden'});
   await page.getByLabel('NEET-PG practice questions',{exact:true}).click();
   await page.getByLabel('Search offline NEET PG questions',{exact:true}).waitFor();
   for (const [exam,label] of [['AIIMS PG','AIIMS PG'],['INI-CET','INI-CET']]) { await page.getByRole('button',{name:'Open '+exam+' practice',exact:true}).click(); await page.getByLabel('Search offline '+label+' questions',{exact:true}).waitFor(); await page.getByText('10 questions per exam',{exact:false}).waitFor(); }
   assert.equal(await page.getByText('Unlock PG Practice',{exact:true}).count(),0);
   await page.goto(origin+'/simulator');await page.locator('[data-simulator-root]').waitFor();
   assert.equal(await page.getByRole('heading',{name:'Unlock Simulator & Anatomy',exact:true}).count(),0);
  }
  assert(!/sponsored ad|remove ads|ad-free/i.test(await page.locator('body').innerText()));
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({featureMode,runtimeErrors:errors.length}));
  await context.close();return;
 }
 await page.goto(origin+'/unlock');
 await page.getByRole('heading',{name:'Unlock Premium',exact:true}).waitFor();
 assert.equal(await page.locator('.checkout-plans button').count(),2);
 assert.equal(await page.getByText(/1 month/).count(),0);
 if(!signedIn){
  await page.getByRole('button',{name:'Continue with Google'}).waitFor();
  assert(await page.locator('.checkout-plans button').first().isDisabled());
 }else{
  await page.getByText(user.email,{exact:true}).waitFor();
  await (notePlan ? page.getByRole('article').filter({hasText:notePlan==='notes_fmspm'?'FM + SPM':'Pharmacology'}).getByRole('button') : page.locator('.checkout-plans button').first()).click();
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
   assert.deepEqual(calls[0],{name:'razorpay-create-order',body:{plan:notePlan??'adfree_6m',...(notePlan?{catalog_version:'2'}:{})}});
   assert.equal(calls[1].name,'razorpay-verify-payment');
   assert.equal(calls[1].body.razorpay_payment_id,'pay_fixture');
   assert(!('uid'in calls[0].body));assert(!('amount'in calls[0].body));
   if(notePlan) await page.getByRole('link',{name:'Open notes ↗',exact:true}).waitFor();
   await page.reload();await page.getByText('Premium access active until',{exact:false}).waitFor();
   if(notePlan) await page.getByRole('link',{name:'Open notes ↗',exact:true}).waitFor();
   assert.equal(calls.filter(x=>x.name==='razorpay-create-order').length,1);
  }
 }
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);
 await page.screenshot({path:`/tmp/orbit-checkout-${width}-${signedIn?'signed':'guest'}-${verificationFails?'recovery':'normal'}.png`,fullPage:true});
 console.log(JSON.stringify({width,signedIn,verificationFails,interrupted,calls:calls.map(x=>x.name),runtimeErrors:errors.length}));
 await context.close();
}
try{if(process.env.ONLY_MODE) {await scenario(390,true,false,false,process.env.ONLY_MODE);}else{await scenario(360,false);await scenario(360);await scenario(412);await scenario(390,true,true);await scenario(390,true,false,true);await scenario(390,true,false,false,null,'notes_fmspm');await scenario(412,true,false,false,null,'notes_pharmac');await scenario(390,true,false,false,'free');await scenario(390,true,false,false,'paid');}console.log('Production checkout browser flows passed (fixture providers, no live charge).');}
finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
