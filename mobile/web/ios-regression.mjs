import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright-core';
const root=path.resolve(import.meta.dirname,'../..');
const server=http.createServer(async(req,res)=>{try{let rel=new URL(req.url,'http://localhost').pathname;if(!path.extname(rel))rel=rel==='/simulator'?'/legacy.html':'/index.html';const file=path.join(root,'dist',rel);res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'}[path.extname(file)])||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(5226,'127.0.0.1',r));
const engine=process.env.ORBIT_BROWSER==='webkit'?webkit:chromium;
const browser=await engine.launch({headless:true,...(engine===chromium?{executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
await fs.mkdir('/tmp/orbit-ios-evidence',{recursive:true});
const errors=[];const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',timezoneId:'Asia/Kolkata'});
const intentionallyBlocked = new Set();
await context.route('**/*',r=>{
  const url = new URL(r.request().url());
  if (url.origin === 'http://127.0.0.1:5226') return r.continue();
  intentionallyBlocked.add(url.host + url.pathname);
  return r.abort();
});
await context.addInitScript(()=>localStorage.setItem('orbit:tour-v1',JSON.stringify({seen:1})));
const page=await context.newPage();await page.clock.install({time:new Date('2026-10-14T09:00:00+05:30')});page.on('pageerror',e=>{
  // WebKit reports an intentionally aborted cross-origin fetch as a pageerror.
  // Ignore only that exact network message for a URL this fixture blocked;
  // unexpected application errors and real (unblocked) CORS failures still fail.
  const aborted = e.message.match(/^\/([^\s]+) due to access control checks\.$/);
  if (aborted && intentionallyBlocked.has(aborted[1])) return;
  errors.push(e.message);
});
const label=s=>page.getByLabel(s,{exact:true});const tap=async s=>{await label(s).scrollIntoViewIfNeeded();await label(s).tap();};
try{
await page.goto('http://127.0.0.1:5226');
await label('Continue').or(label('Display name')).first().waitFor();
if(await label('Continue').count())await label('Continue').tap({timeout:2000}).catch(()=>{});
await label('Display name').fill('Calendar tester');
await page.getByRole('radio',{name:'Final Year',exact:true}).tap();
await page.getByRole('radio',{name:'Tamil Nadu Dr. M.G.R. Medical University (TNMGR)',exact:true}).tap();await tap('Start studying');
await label('Settings').waitFor();await page.reload();await label('Settings').waitFor();assert.equal(await label('Display name').count(),0);assert.ok(!(await page.locator('body').innerText()).includes('Question bank ·'));console.log('PASS fresh setup stays complete after reload');
await page.goto('http://127.0.0.1:5226/progress');await tap('Attendance');await tap('Clinical postings');await tap('Add a posting');
await tap('Posting start date');
// Wait for the modal to mount before addressing a date; do not inspect a stale render.
await label('5 October 2026').waitFor();
await tap('5 October 2026');assert.ok((await label('Posting start date').innerText()).includes('2026-10-05'));
await tap('Posting end date');await page.getByText('November 2026',{exact:true}).waitFor();await tap('Previous month');await tap('31 October 2026');assert.ok((await label('Posting end date').innerText()).includes('2026-10-31'));console.log('PASS touch selects exact local start and end dates');
// The previously silent failure: valid dates but no posting name.
await tap('Add this posting');
const missingName=page.getByRole('alert').filter({hasText:'Enter a posting name'});
await missingName.waitFor();
assert(await missingName.isVisible(),'Name validation must be visible beside Add');
await page.screenshot({path:'/tmp/orbit-ios-evidence/add-name-validation.png'});
await label('Posting name').fill('Paediatrics');
await tap('Add this posting');await tap('View Rotation Calendar and Holidays');
const day=page.getByLabel('Sat, Oct 17 - Working day',{exact:true});await day.scrollIntoViewIfNeeded();await day.tap();await page.getByLabel('Sat, Oct 17 - Holiday',{exact:true}).waitFor();
await page.reload();await tap('Attendance');await tap('Clinical postings');await tap('View Rotation Calendar and Holidays');await page.getByLabel('Sat, Oct 17 - Holiday',{exact:true}).waitFor();console.log('PASS calendar opens and holiday selection persists');
await tap('Edit posting dates');await tap('Saved posting start date');await tap('6 October 2026');await tap('Save posting dates');await page.getByLabel('Tue, Oct 6 - Working day',{exact:true}).waitFor();console.log('PASS saved posting date edit uses nested picker');
// Reopening with the same browser storage must retain study setup.
const second=await context.newPage();await second.goto('http://127.0.0.1:5226');await second.getByLabel('Settings',{exact:true}).waitFor();assert.equal(await second.getByLabel('Display name',{exact:true}).count(),0);await second.close();
assert.deepEqual(errors,[]);console.log('PASS no browser crashes; reopen retains setup');
await fs.mkdir('/tmp/orbit-ios-evidence',{recursive:true});await page.screenshot({path:'/tmp/orbit-ios-evidence/calendar-'+(process.env.ORBIT_BROWSER||'chromium')+'.png'});
}catch(error){console.log((await page.locator('body').innerText()).slice(0,3500));await page.screenshot({path:'/tmp/ios-failure.png'});throw error;}finally{await browser.close();await new Promise(r=>server.close(r));}
