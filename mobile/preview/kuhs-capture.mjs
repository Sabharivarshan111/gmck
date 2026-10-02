import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const server=http.createServer(async(req,res)=>{try{const filename=path.resolve('preview/dist',req.url.split('?')[0].slice(1)||'index.html');const content=await fs.readFile(filename);res.setHeader('Content-Type',filename.endsWith('.js')?'application/javascript':filename.endsWith('.css')?'text/css':filename.endsWith('.html')?'text/html':'application/octet-stream');res.end(content);}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(5198,'127.0.0.1',r));
const out=path.resolve(process.argv[2] ?? '../../kuhs-screenshots');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH ?? '/tmp/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--disable-gpu']});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,reducedMotion:'reduce'});
const page=await context.newPage();
page.on('pageerror',e=>console.log('PAGEERROR',e.message));
await context.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:5198') ? route.continue() : route.abort());
const capture=async name=>{await page.waitForTimeout(500);await page.screenshot({path:out+'/'+name+'.png'});};
await page.goto('http://127.0.0.1:5198');
await page.waitForTimeout(4500);
await capture('01-onboarding');
console.log('ONBOARDING', (await page.locator('body').innerText()).slice(-1800));
await page.evaluate(()=>localStorage.setItem('orbit-profile-v1',JSON.stringify({display_name:'Sabari',year:'first'})));
await page.goto('http://127.0.0.1:5198/?screen=home');
await page.getByText('Which university do you study under?',{exact:true}).waitFor();
await capture('00-existing-user-confirmation');
await page.getByRole('radio',{name:'Kerala University of Health Sciences (KUHS)',exact:true}).click();
await page.getByText('Which university do you study under?',{exact:true}).waitFor({state:'hidden'});
await page.reload();
await page.waitForTimeout(500);
if(await page.getByText('Which university do you study under?',{exact:true}).isVisible()) throw new Error('Confirmed university prompted again');
const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('orbit-profile-v1')));
if(saved.university!=='kuhs') throw new Error('University choice not persisted');
console.log('Existing-user prompt remembers choice after reload, offline.');

await page.goto('http://127.0.0.1:5198/?screen=home');
await page.waitForTimeout(800);
await page.getByLabel('Question bank: Kerala University of Health Sciences (KUHS). Change university',{exact:true}).click();
await capture('02-university-choice');
await page.goto('http://127.0.0.1:5198/?screen=home');
await page.getByLabel('Settings',{exact:true}).click();
await page.getByText('Kerala · KUHS',{exact:true}).scrollIntoViewIfNeeded();
await capture('03-settings');
for(const year of ['first','second','third','final']){
 await page.goto('http://127.0.0.1:5198/?screen=browse&year='+year+'-year');
 await page.getByPlaceholder('Search all questions…').waitFor();
 await capture('04-'+year+'-subjects');
}
await page.goto('http://127.0.0.1:5198/?screen=browse&year=first-year&node=anatomy,basic-tissues&title=Basic%20Tissues');
await page.getByText('Printed exams:',{exact:false}).first().waitFor();
await capture('05-questions');
await page.getByLabel('Mark as done',{exact:true}).first().click();
await capture('06-progress-ticked');
await page.goto('http://127.0.0.1:5198/?screen=browse&year=first-year');
await page.getByPlaceholder('Search all questions…').fill('skin');
await page.getByText('Switch to this chapter',{exact:true}).first().waitFor();
await capture('07-search');
await page.getByPlaceholder('Search all questions…').fill('cystometrogram');
await page.getByText('6 recorded exam references',{exact:false}).first().waitFor();
await capture('08-repeat-count-six');
await page.getByText('Switch to this chapter',{exact:true}).first().click();
await page.getByText('Renal Physiology',{exact:true}).waitFor();
await capture('09-search-to-topic');
for (const forbidden of ['Review preview','Under review','work in progress','Source PDF p.']) {
 if ((await page.locator('body').innerText()).includes(forbidden)) throw new Error('Unwanted status caption: '+forbidden);
}
console.log('Captured screens, six-reference badge and search navigation with external requests blocked; no review/PDF captions.');

await page.goto('http://127.0.0.1:5198/?screen=notesdemo&repetition=1');
await page.getByText('Atrial Fibrillation (AF)',{exact:true}).waitFor();
for (const heading of ['Etiology','Pathophysiology','Clinical Features']) {
 if (await page.getByText(heading,{exact:true}).count() !== 1) throw new Error('Repeated heading: '+heading);
}
if (!(await page.locator('body').innerText()).includes('Variable intensity S1') || !(await page.locator('body').innerText()).includes('Palpitations')) throw new Error('Unique clinical detail lost');
await capture('10-notes-repetition-fixed');
await page.goto('http://127.0.0.1:5198/?screen=ankidemo');
await capture('11-anki-study');
console.log('Cached-note repetition fixture: each heading once, distinct facts retained; study screen rendered.');

await browser.close();
server.close();
