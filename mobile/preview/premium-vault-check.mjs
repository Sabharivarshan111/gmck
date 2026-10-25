// Actual RN components through RN-web; provider traffic is a test fixture, not a charge/device test.
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import os from 'node:os';
import assert from 'node:assert/strict';
import {installPremiumTestAccount} from './test-premium-fixture.mjs';
os.networkInterfaces=()=>({});
const server=await createServer({configFile:'preview/vite.config.ts',server:{host:'127.0.0.1',port:5194,strictPort:true},logLevel:'error'});
await server.listen();
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try {
 for(const paid of [false,true]){
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await installPremiumTestAccount(context);
  await context.addInitScript(()=>{localStorage.setItem('orbit-profile-v1',JSON.stringify({display_name:'Test',year:'first',university:'tnmgr'}));localStorage.setItem('orbit:last-run-version','28');});
  await context.route('**/rest/v1/premium_subscriptions*',route=>route.fulfill({contentType:'application/json',body:paid?JSON.stringify({expires_at:new Date(Date.now()+365*86400000).toISOString()}):'null'}));
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5194/?screen=notes');
  await page.getByLabel('NEET-PG practice questions',{exact:true}).waitFor();
  if(!paid){await page.getByLabel('Anki flashcards',{exact:true}).click();await page.getByText('Unlock Anki flashcards',{exact:true}).waitFor();await page.getByLabel('Continue free preview',{exact:true}).click();}
  await page.getByLabel('NEET-PG practice questions',{exact:true}).click();
  await page.getByLabel('Search offline NEET PG questions',{exact:true}).waitFor();
  if(!paid){await page.getByText('Free preview · 10 questions per exam',{exact:true}).waitFor();await page.getByLabel('Unlock all Premium features',{exact:true}).click();await page.getByText('Unlock all Premium features',{exact:true}).waitFor();}
  else assert.equal(await page.getByText('Free preview · 10 questions per exam',{exact:true}).count(),0);
  await page.goto('http://127.0.0.1:5194/?screen=notes');
  await page.getByLabel('Case proformas',{exact:true}).click();
  await page.getByLabel('Open Respiratory System (RS) Master Case Proforma',{exact:true}).click();
  if(!paid)await page.getByText('Unlock all case proformas',{exact:true}).waitFor();
  else await page.getByText('1. Patient Demographics & Presenting Complaints',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);console.log(paid?'Paid Native Vault: full questions and respiratory proforma open':'Free Native Vault: questions open with trial, Anki and extra proformas request Premium');await context.close();
 }
}finally{await browser.close();await server.close();}
