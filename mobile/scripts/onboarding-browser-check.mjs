import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';
const base=process.env.ORBIT_UNIVERSITY_BASE_URL || 'http://127.0.0.1:4184';
const browser=await chromium.launch({headless:true,executablePath:process.env.ORBIT_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox']});
const results=[];
fs.mkdirSync('artifacts/university-import',{recursive:true});
try {
 for(const width of [360,430]) for(const goal of ['University PYQs','NEET PG','Both']) {
  const context=await browser.newContext({viewport:{width,height:780},serviceWorkers:'block'});
  await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
  await context.addInitScript(()=>{localStorage.setItem('orbit:tour-v1',JSON.stringify({seen:1}));});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.getByText('Welcome to Orbit',{exact:true}).waitFor();
  await page.getByLabel('Continue with Google',{exact:true}).waitFor();
  if (await page.getByLabel('Continue on this device',{exact:true}).count()) await page.getByLabel('Continue on this device',{exact:true}).click(); else await page.getByLabel('Continue',{exact:true}).click();
  await page.getByLabel('Choose your university',{exact:true}).click();
  const other=page.getByRole('radio',{name:'Other university',exact:true});await other.scrollIntoViewIfNeeded();await other.click();
  assert.equal(await page.getByRole('radiogroup').count(),0);
  await page.getByLabel('Display name',{exact:true}).fill('Study tester');
  await page.getByRole('radio',{name:'1st Year',exact:true}).click();
  await page.getByRole('radio',{name:goal,exact:true}).click();
  await page.getByLabel('Continue to Premium',{exact:true}).click();
  await page.getByRole('heading',{name:'Unlock Premium',exact:true}).waitFor();
  await page.getByText('STEP 3 OF 3',{exact:true}).waitFor();
  assert.equal(await page.getByText('₹300 / 1 year',{exact:true}).count(),1);
  assert.equal(await page.evaluate(()=>localStorage.getItem('orbit-profile-v1')),null);
  await page.screenshot({path:`artifacts/university-import/premium-${width}-${goal.replace(/\W/g,'')}.png`});
  await page.getByLabel('Back to your study setup',{exact:true}).click();
  assert.equal(await page.getByLabel('Display name',{exact:true}).inputValue(),'Study tester');
  await page.getByLabel('Continue to Premium',{exact:true}).click();
  await page.getByLabel('Continue with free preview',{exact:true}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('orbit-profile-v1')||'{}').university==='other');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('orbit-profile-v1')));
  assert.equal(saved.preparationGoal,goal==='Both'?'both':goal==='NEET PG'?'neet-pg':'university-pyqs');
  await page.reload();await page.getByLabel('Settings',{exact:true}).waitFor();
  assert.equal(await page.getByText('Welcome to Orbit',{exact:true}).count(),0);
  await page.goto(`${base}/browse/second-year`);
  await page.getByRole('heading',{name:'Other university',exact:true}).waitFor();
  await page.getByPlaceholder('Search all questions…').fill('A Man developed gradual loss of weight');
  await page.getByLabel('Switch to Gastrointestinal System',{exact:true}).first().click();
  const body=await page.locator('body').innerText();
  assert.ok(!/RGUHS|TNMGR|KUHS|Code 1082/.test(body),'Other bank must hide source university/exam labels');
  assert.deepEqual(errors,[]);results.push({width,goal,otherAndThirdStepAndPersistence:'passed'});await context.close();
 }
} finally {await browser.close();}
fs.mkdirSync('artifacts/university-import',{recursive:true});
fs.writeFileSync('artifacts/university-import/onboarding-results.json',JSON.stringify(results,null,2));
console.log(`PASS ${results.length} three-step onboarding scenarios`);
