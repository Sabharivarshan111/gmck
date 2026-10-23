/** Drives the actual shared chat: compact tablet paragraphs and failed follow-up recovery. */
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
const root=path.resolve(import.meta.dirname,'../..');
const server=http.createServer(async(req,res)=>{try{let rel=new URL(req.url,'http://localhost').pathname;if(!path.extname(rel))rel='/index.html';res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'}[path.extname(rel)])||'application/octet-stream');res.end(await fs.readFile(path.join(root,'dist-native',rel)).catch(()=>fs.readFile(path.join(root,'public',rel))));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(5241,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
const evidence=path.join(root,'docs/evidence/tablet-ai-chat');await fs.mkdir(evidence,{recursive:true});
const answer='Serum is plasma minus the clotting factors.\n\nWhen blood is allowed to clot, the remaining liquid is serum.\n\nPlasma contains water, proteins and clotting factors.\n\n## Key distinction\n- Serum: after clotting\n- Plasma: before clotting';
try {
for(const viewport of [{width:390,height:844},{width:800,height:1280},{width:1280,height:800}]) {
 const context=await browser.newContext({viewport,hasTouch:true,reducedMotion:'reduce'});const requests=[];let failNext=false;
 await context.addInitScript(()=>{localStorage.setItem('orbit-profile-v1',JSON.stringify({display_name:'Chat tester',year:'first',university:'tnmgr'}));localStorage.setItem('orbit:tour-v1',JSON.stringify({seen:1}));localStorage.setItem('orbit:last-run-version','28');});
 await context.route('**/*',async route=>{const url=route.request().url();if(url.includes('/functions/v1/ask-gemini')){requests.push(route.request().postDataJSON());if(failNext){failNext=false;return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Temporary service failure. Try again.'})});}return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({response:answer})});}return url.startsWith('http://127.0.0.1:5241')?route.continue():route.abort();});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5241/ask-ai');
 const input=page.getByLabel('Medical question',{exact:true});await input.waitFor();
 await input.fill('Difference between serum and plasma');await page.getByLabel('Send',{exact:true}).click();
 await page.getByLabel('Explain it simply',{exact:true}).waitFor();
 const first=page.getByText('Serum is plasma minus the clotting factors.',{exact:true}).first();
 await first.scrollIntoViewIfNeeded();
 assert.equal(await first.evaluate(el=>getComputedStyle(el).flexGrow),'0','Paragraph must not expand vertically');
 const second=page.getByText('When blood is allowed to clot, the remaining liquid is serum.',{exact:true}).first();
 const a=await first.boundingBox(),b=await second.boundingBox();assert.ok(b.y-(a.y+a.height)<35,'Paragraph spacing should be compact');
 assert.ok(a.width<=760 && a.width>0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
 await page.screenshot({path:path.join(evidence,`chat-${viewport.width}.png`)});
 failNext=true;await input.fill('Why?');await page.getByLabel('Send',{exact:true}).click();
 await page.getByText('Temporary service failure. Try again.',{exact:true}).waitFor();
 assert.equal(requests.at(-1).isNeedingClarification,true);assert.ok(requests.at(-1).conversationHistory.some(x=>x.content.includes('clotting factors')));
 const retry=page.getByLabel('Ask again',{exact:true}).last();await retry.scrollIntoViewIfNeeded();await retry.click();
 await page.getByLabel('Explain it simply',{exact:true}).nth(1).waitFor();
 assert.ok(!requests.at(-1).conversationHistory.some(x=>x.content.includes('Temporary service failure')),'Error messages must not become AI context');
 await input.fill('And albumin?');await page.getByLabel('Send',{exact:true}).click();await page.getByLabel('Explain it simply',{exact:true}).nth(2).waitFor();
 assert.equal(requests.at(-1).prompt,'And albumin?');assert.equal(requests.at(-1).isNeedingClarification,true);
 await page.getByLabel('Expand to fullscreen chat',{exact:true}).click();assert.ok(await input.isVisible());await page.getByLabel('Exit fullscreen chat',{exact:true}).click();
 assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${viewport.width}x${viewport.height}: natural paragraphs, follow-up context, failure/retry, next turn and fullscreen`);
}
} finally {await browser.close();await new Promise(r=>server.close(r));}
