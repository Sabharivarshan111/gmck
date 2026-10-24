import { installPremiumTestAccount } from './test-premium-fixture.mjs';
/** Real shipped UI; local profile only, actual bundled questions and actual storage. */
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
const repo = path.resolve(import.meta.dirname,'../..');
const out = path.join(repo,'remotion-ad/public/app_screens/neet-plan');
await fs.mkdir(out,{recursive:true});
const bank = JSON.parse(await fs.readFile(path.join(repo,'mobile/src/lib/neetPgBank.json'),'utf8'));
const server = http.createServer(async(req,res)=>{try { let p=new URL(req.url,'http://localhost').pathname;if(!path.extname(p))p='/index.html'; const f=path.join(repo,'dist',p);res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f)); }catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(5248,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await ctx.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:5248')?r.continue():r.abort());
await ctx.addInitScript(()=>{if(!localStorage.getItem('orbit-profile-v1')){localStorage.setItem('orbit-profile-v1',JSON.stringify({display_name:'ORBIT student',year:'first',university:'tnmgr'}));localStorage.setItem('orbit:tour-v1',JSON.stringify({seen:1}));localStorage.setItem('orbit:last-run-version','28');localStorage.setItem('orbit:theme-preference','dark');}});
await installPremiumTestAccount(ctx);
const page=await ctx.newPage();page.setDefaultTimeout(30000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
const label=n=>page.getByLabel(n,{exact:true});
const settle=async()=>{await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);};
const shot=async name=>{await settle();await page.screenshot({path:path.join(out,name+'.png')});};
const open=async()=>{await page.goto('http://127.0.0.1:5248/notes');await label('NEET-PG practice questions').click();await label('Open NEET PG study planner').waitFor();};
try {
 await open();await shot('library');
 await label('Open NEET PG study planner').click();await label('Continue plan setup').waitFor();await shot('goal');
 await label('NEET PG target exam date').fill('2026-02-31');assert.equal(await label('Continue plan setup').isDisabled(),true);
 await label('NEET PG target exam date').fill('');await label('Top 1,000').click();await label('Continue plan setup').click();await label('10 min').click();await shot('time');
 await label('Continue plan setup').click();await label('Revision mode').click();await label('Anatomy').click();await shot('priorities');
 await label('Continue plan setup').click();await label('Save my NEET PG plan').waitFor();await shot('review');await label('Save my NEET PG plan').click();await label('Start today’s session').or(label('Start optional practice')).waitFor();await shot('today');
 await label('Start today’s session').or(label('Start optional practice')).click();await page.getByRole('radiogroup').waitFor();await shot('question');
 await page.getByRole('radio').first().click();await label('Show answer and explanation').click();await page.getByTestId('neet-answer-explanation').waitFor();await shot('explanation');
 await label('Save this NEET PG question').click();await label('Unsave this NEET PG question').waitFor();await shot('saved');
 await label('Ask ACEV about this question').click();await label('Ask about this NEET PG question').waitFor();await shot('acev');await label('Done').click();
 await label('Next NEET PG question').click();await label('Return to NEET PG library').click();await shot('today-progress');
 await page.waitForFunction(()=>Object.entries(localStorage).some(([k,v])=>k.startsWith('orbit:neetpg:study:v1:')&&JSON.parse(v).session?.position===1));
 await page.reload();await label('NEET-PG practice questions').click();await label('Open NEET PG study planner').click();await label('Resume today’s session').click();await page.getByText('2 of 5',{exact:true}).waitFor();
 await label('Return to NEET PG library').click();await label('Browse NEET PG chapter library').click();
 await label('Search offline NEET PG questions').fill('');
 // Existing library taxonomy and image reader remain available.
 await label('Start NEET PG practice').click();await label('Open question illustration').first().click();await shot('illustration');await label('Close the picture').click();
 await label('Return to NEET PG library').click();
 await label('Search offline NEET PG questions').fill(bank.records[0].question.split(/\s+/).slice(0,3).join(' '));await shot('search');await label('Clear NEET PG search').click();
 await label('Anatomy').click();await shot('chapters');
 await label('NEET PG appearance and bank settings').click();await label('Use Black & White theme').click();await label('Done').click();await shot('mono');
 await label('Close offline NEET PG bank').click();await page.goto('http://127.0.0.1:5248/');await label('NEET-PG question of the day widget').click();await label('Answer NEET PG question of the day').waitFor();await shot('daily');await label('Answer NEET PG question of the day').click();await page.getByRole('radiogroup').waitFor();
 const dailyText=await page.getByRole('radiogroup').locator('..').innerText();
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller,undefined,{timeout:120000});await ctx.setOffline(true);await page.reload();await label('NEET-PG question of the day widget').click();await label('Answer NEET PG question of the day').click();await page.getByRole('radiogroup').waitFor();assert.equal(await page.getByRole('radiogroup').locator('..').innerText(),dailyText);
 for(const width of [360,390,768,1024]) {await page.setViewportSize({width,height:932});await settle();for(const name of ['Ask ACEV about this question','Show answer and explanation']) {const box=await label(name).boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=width+1,`${name} fits ${width}`);}}
 assert.deepEqual(errors,[]);console.log('PASS: real planner setup/date validation, capacity/priority selection, answer history, saved questions, ordered session resume after reload, actual daily question offline reload, 360/390/768/1024 layouts.');
} finally {await browser.close();await new Promise(r=>server.close(r));}
