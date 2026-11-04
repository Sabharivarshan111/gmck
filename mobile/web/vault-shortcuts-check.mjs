import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

const root=path.resolve(import.meta.dirname,'../..');
const origin='http://127.0.0.1:5268';
const server=http.createServer(async(req,res)=>{
  try {
    let rel=new URL(req.url,origin).pathname;
    if(!path.extname(rel))rel='/index.html';
    const file=path.join(root,'dist',rel);
    res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');
    res.end(await fs.readFile(file));
  } catch {res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(5268,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
const skills=[['Auscultation','stethoscope'],['12-lead ECG','ecg12'],['Ultrasound / POCUS','ultrasound'],['X-ray & MRI','radiology'],['Eyes & cranial nerves','pupil'],['General examination','piccled']];
try {
  for(const [width,scale,theme] of [[360,1,'dark'],[430,1,'light'],[360,1.15,'dark'],[430,1.15,'light']]) {
    const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
    await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
    await context.addInitScript(({scale,theme})=>{
      localStorage.setItem('orbit-profile-v1',JSON.stringify({display_name:'Vault test',year:'second',university:'tnmgr',preparationGoal:'both'}));
      localStorage.setItem('orbit:tour-v1',JSON.stringify({seen:1}));
      localStorage.setItem('orbit:text-size',String(scale));
      localStorage.setItem('orbit:theme-preference',theme);
      window.__vaultOpened=[];
      window.open=url=>{window.__vaultOpened.push(String(url));return null;};
    },{scale,theme});
    const page=await context.newPage();const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin,{waitUntil:'networkidle'});
    const vault=page.getByLabel('Vault',{exact:true});await vault.waitFor();await vault.click();
    const simulator=page.getByTestId('vault-card-Simulator & Anatomy');await simulator.waitFor();
    const simulatorBox=await simulator.boundingBox();
    const ankiBox=await page.getByTestId('vault-card-Anki flashcards').boundingBox();
    const boxes=new Map(await Promise.all(skills.map(async([title])=>[title,await page.getByTestId('vault-card-'+title).boundingBox()])));
    for(const [title,id] of skills) {
      const card=page.getByTestId('vault-card-'+title);assert.equal(await card.count(),1,title+' duplicated or absent');
      const box=boxes.get(title);assert.ok(box.y>=simulatorBox.y+simulatorBox.height-1,title+' must be below the Simulator row');
      assert.ok(box.y<ankiBox.y,title+' must precede Anki');
      assert.ok(box.x>=-1&&box.x+box.width<=width+1,title+' overflows screen');
      await card.scrollIntoViewIfNeeded();await card.click();
      const href=await page.evaluate(()=>window.__vaultOpened.at(-1));const url=new URL(href);
      assert.equal(url.origin,'https://orbitmbbs.vercel.app');assert.equal(url.pathname,'/simulator');assert.equal(url.searchParams.get('tool'),id);assert.equal(url.searchParams.get('scenario'),'normal');
    }
    await page.getByTestId('vault-card-Auscultation').evaluate(el=>el.scrollIntoView({block:'start'}));
    const evidence=path.join(root,'artifacts/vault-layout');await fs.mkdir(evidence,{recursive:true});
    await page.screenshot({path:path.join(evidence,`clinical-shortcuts-${width}-${scale}.png`)});
    await simulator.scrollIntoViewIfNeeded();await simulator.click();
    assert.equal(await page.evaluate(()=>window.__vaultOpened.at(-1)),'https://orbitmbbs.vercel.app/simulator');
    assert.deepEqual(errors,[],'Unexpected render error');
    console.log(`PASS ${width}px text ${scale}: six unique Vault shortcuts, order/width, exact tool URLs and original studio entry`);
    await context.close();
  }
} finally {await browser.close();await new Promise(r=>server.close(r));}
