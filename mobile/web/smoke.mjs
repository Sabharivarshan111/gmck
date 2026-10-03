import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright-core';
const root=path.resolve(import.meta.dirname, '../..');
const out=process.env.ORBIT_EVIDENCE_DIR || '/tmp/orbit-web-evidence';
await fs.mkdir(out,{recursive:true});
const results=[];const crashes=[];
function check(name,condition){if(!condition)throw new Error(name);results.push({name,passed:true});console.log('PASS',name);}
const shot=async(name)=>{await page.screenshot({path:path.join(out,name+'.png')});};
const server=http.createServer(async(req,res)=>{try{let rel=decodeURIComponent(req.url.split('?')[0]); if(/^\/(notes|timer|ask-ai|progress|browse(\/.*)?)?$/.test(rel))rel='/index.html';else if(rel==='/simulator')rel='/legacy.html'; const file=path.join(root,'dist',rel);const content=await fs.readFile(file); const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.wasm':'application/wasm','.wav':'audio/wav','.woff2':'font/woff2'}[ext])||'application/octet-stream');res.end(content);}catch{res.statusCode=404;res.end('not found');}});
await new Promise(r=>server.listen(5225,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/tmp/orbit-chromium',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
await context.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:5225') ? route.continue():route.abort());
await context.addInitScript(()=>{if (!localStorage.getItem('orbit-profile-v1')) localStorage.setItem('orbit-profile-v1',JSON.stringify({display_name:'Sabari',year:'first',university:'kuhs'}));localStorage.setItem('orbit:tour-v1',JSON.stringify({seen:1}));});
const page=await context.newPage();page.on('pageerror',e=>crashes.push(e.message));page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,200))});
await page.goto('http://127.0.0.1:5225');await page.waitForTimeout(1500);

try {
  await page.getByLabel('Settings',{exact:true}).waitFor();
  await page.locator('img[alt="🫀"]').waitFor();await page.waitForFunction(()=>Array.from(document.querySelectorAll('img[alt="🫀"],img[alt="🧠"]')).every(img=>img.complete&&img.naturalWidth>0));
  check('Android subject emoji artwork renders',true);
  await shot('01-home');check('Native homepage renders with KUHS', (await page.locator('body').innerText()).includes('Question bank · KUHS'));
  await page.getByLabel('Menu',{exact:true}).click();await page.getByLabel('Patient simulator',{exact:true}).waitFor();await shot('02-menu');
  await page.getByLabel('All subjects',{exact:true}).click();check('Native browse pushes browser history',page.url().endsWith('/browse'));await shot('03-browse');
  await page.goto('http://127.0.0.1:5225/browse/first-year/anatomy,basic-tissues');
  await page.getByLabel('Mark as done',{exact:true}).first().waitFor();await page.getByLabel('Mark as done',{exact:true}).first().click();
  await page.getByLabel('Mark as not done',{exact:true}).first().waitFor();await shot('04-questions');
  await page.reload();await page.getByLabel('Mark as not done',{exact:true}).first().waitFor();check('Question completion survives reload',true);
  await page.goto('http://127.0.0.1:5225/');await page.getByLabel('Settings',{exact:true}).click();
  await page.getByRole('radio',{name:'Tamil Nadu Dr. M.G.R. Medical University (TNMGR)',exact:true}).click();
  await page.getByRole('radio',{name:'Kerala University of Health Sciences (KUHS)',exact:true}).click();await shot('05-university-settings');
  await page.goto('http://127.0.0.1:5225/notes');await page.getByLabel('Anki-style flashcards, browse decks by year',{exact:true}).waitFor();await shot('06-notes');
  for (const fixture of ['legacy1','legacy2','v3']) {
    await page.goto('http://127.0.0.1:5225/notes');
    await page.getByLabel('Anki-style flashcards, browse decks by year',{exact:true}).click();
    await page.getByLabel('Import your Anki cards from an apkg file',{exact:true}).click();
    const chooserPromise=page.waitForEvent('filechooser');await page.getByLabel('Choose an apkg file to import',{exact:true}).click();
    await (await chooserPromise).setFiles(path.join(root,'mobile/preview/fixtures/apkg',fixture+'.apkg'));
    await page.getByLabel('Import 10 cards',{exact:true}).click();await page.getByLabel('Show answer',{exact:true}).waitFor();
    await page.getByLabel('Show answer',{exact:true}).click();
    check(fixture+' imports actual cards and Anki answer buttons',(await page.locator('body').innerText()).includes('Atrial depolarisation') && (await page.locator('body').innerText()).includes('Again'));
    if(fixture==='v3')await shot('07-anki-study');
  }
  await page.goto('http://127.0.0.1:5225/notes');await page.getByLabel('Anki-style flashcards, browse decks by year',{exact:true}).click();await page.getByLabel('Import your Anki cards from an apkg file',{exact:true}).click();
  await page.getByLabel('Study v3, 10 cards',{exact:true}).waitFor();check('Imported decks persist after reload',await page.getByLabel('Study legacy1, 10 cards',{exact:true}).count()===1);
  // Inspect persisted media references, then request the actual local bytes.
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
  const persisted=await page.evaluate(async()=>{
    const db=await new Promise((resolve,reject)=>{const request=window.indexedDB.open('orbit-browser-v1',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    const read=(store,key)=>new Promise(resolve=>{const request=db.transaction(store).objectStore(store).get(key);request.onsuccess=()=>resolve(request.result);});
    const decks=JSON.parse(await read('strings','orbit:anki:imported-decks'));
    const cards=JSON.parse(await read('strings','orbit:anki:imported-cards:'+decks[0].id+':0'));
    const uris=[...new Set(cards.flatMap(card=>[...(card.frontImages||[]),...(card.backImages||[])]))];
    const media=await Promise.all(uris.map(async uri=>{const r=await fetch(uri);return {status:r.status,size:(await r.blob()).size,uri};}));
    db.close();return {decks,media};
  });
  check('Anki media is available after reload',persisted.media.length>=1 && persisted.media.every(item=>item.status===200&&item.size>0));
  await page.goto('http://127.0.0.1:5225/timer');await page.getByLabel('Start timer',{exact:true}).waitFor();await shot('08-timer');
  await page.getByLabel('Start timer',{exact:true}).click();await page.getByLabel('Pause timer',{exact:true}).waitFor();check('Focus timer starts',true);
  await page.goto('http://127.0.0.1:5225/ask-ai');await shot('09-ai');
  await page.goto('http://127.0.0.1:5225/progress');await page.getByText('Not signed in',{exact:true}).waitFor();await shot('10-progress');
  await page.goto('http://127.0.0.1:5225/');await page.getByLabel('Settings',{exact:true}).waitFor();await context.setOffline(true);
  await page.goto('http://127.0.0.1:5225/browse/first-year/anatomy,basic-tissues');await page.getByLabel('Mark as not done',{exact:true}).first().waitFor();await shot('11-offline-kuhs');
  check('KUHS and saved question progress reload offline',true);await context.setOffline(false);
  await page.goto('http://127.0.0.1:5225/simulator');await page.waitForTimeout(1200);await shot('12-simulator');
  check('Simulator uses original application shell',(await page.locator('body').innerText()).length>100);
  await page.setViewportSize({width:1280,height:900});await page.goto('http://127.0.0.1:5225/');await page.getByLabel('Settings',{exact:true}).waitFor();await shot('13-desktop');
  check('No uncaught browser errors',crashes.length===0);
  const guest=await browser.newContext({viewport:{width:390,height:844}});await guest.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:5225')?route.continue():route.abort());
  const fresh=await guest.newPage();await fresh.goto('http://127.0.0.1:5225/');await fresh.getByLabel('Continue with Google',{exact:true}).waitFor();
  check('Guest onboarding never claims Google verification',!((await fresh.locator('body').innerText()).includes('Verified with Google')));
  await fresh.screenshot({path:path.join(out,'14-onboarding.png')});await guest.close();
  await fs.writeFile(path.join(out,'checks.json'),JSON.stringify({results,crashes,persisted},null,2));
} finally {await browser.close();await new Promise(r=>server.close(r));}
