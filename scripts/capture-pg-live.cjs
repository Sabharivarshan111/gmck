const { chromium, devices } = require('/tmp/orbit-capture/node_modules/playwright');
const fs = require('node:fs');
const out='artifacts/screenshots/pg-live-20261010';
fs.mkdirSync(out, { recursive:true });
(async () => {
  const browser = await chromium.launch({ headless:true, args:['--no-sandbox'] });
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    viewport:{width:390,height:844},
    deviceScaleFactor:2,
    serviceWorkers:'block',
  });
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',msg=>{ if(msg.type()==='error') errors.push(msg.text().slice(0,220)); });
  const origin='https://orbitmbbs.vercel.app';
  await page.goto(origin+'/notes',{waitUntil:'domcontentloaded',timeout:75000});
  await page.waitForTimeout(6000);
  // New visitors see FirstRun before any app page. Complete its LOCAL-only
  // setup (no Google sign-in, no external user identity).
  if(await page.getByText('Set up your studies',{exact:true}).count()) {
    await page.getByPlaceholder('e.g. Phantom').fill('Orbit Screenshot');
    await page.getByText('3rd Year',{exact:true}).click();
    await page.getByText('Tamil Nadu · TNMGR',{exact:true}).click();
    await page.getByText('Start studying',{exact:true}).click();
    await page.waitForTimeout(2200);
  }
  const skipTour=page.getByText('Skip',{exact:true}).first();
  if(await skipTour.isVisible().catch(()=>false)) await skipTour.click().catch(()=>{});
  let entry=page.getByText('PG Entrance Questions & Sources',{exact:false}).first();
  if(!(await entry.count())){
    await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:75000});
    await page.waitForTimeout(5500);
    const notes=page.getByText('Notes',{exact:true}).first();
    if(await notes.count()) await notes.click({timeout:10000});
    await page.waitForTimeout(2500);
    entry=page.getByText('PG Entrance Questions & Sources',{exact:false}).first();
  }
  await page.screenshot({path:out+'/01-notes-entry.png'});
  if(!(await entry.count())){
    fs.writeFileSync(out+'/debug.txt','Current URL: '+page.url()+'\nVisible text:\n'+(await page.locator('body').innerText()).slice(0,9000)+'\nJS errors:\n'+errors.join('\n'));
    throw new Error('PG Notes entry missing: '+page.url());
  }
  await entry.click({timeout:15000});
  await page.getByText('PG Entrance Questions',{exact:true}).first().waitFor({timeout:20000});
  await page.getByText('Offline medical question practice',{exact:true}).waitFor({timeout:20000});
  await page.waitForTimeout(6500);
  await page.screenshot({path:out+'/02-pg-questions.png'});
  const countText=await page.locator('body').innerText();
  fs.writeFileSync(out+'/visible-content.txt',countText.slice(0,9000));
  if(!countText.includes('4180 bundled questions')) throw new Error('Unable to verify 4180 bundled questions in live app: '+countText.slice(0,800));
  const reveal=page.getByText('Reveal answer + explanation',{exact:true}).first();
  await reveal.click({timeout:15000});
  await page.getByText('Answer-label provenance:',{exact:false}).first().waitFor({timeout:10000});
  await page.waitForTimeout(500);
  await page.screenshot({path:out+'/03-answer-revealed.png'});
  const sources=page.getByText('Source directory',{exact:true}).first();
  await sources.click({timeout:15000});
  await page.waitForTimeout(900);
  await page.screenshot({path:out+'/04-source-directory.png'});
  fs.writeFileSync(out+'/result.txt',
    'Site: '+origin+'\nUTC: '+new Date().toISOString()+
    '\nQuestion pack: 4180 entries verified on-screen\nScreens: 01 notes / 02 questions / 03 answer / 04 sources\nBrowser errors:\n'+errors.join('\n'));
  await browser.close();
  console.log('SCREENSHOTS CAPTURED FROM LIVE ORBIT: '+out);
})().catch(e=>{console.error(e.stack||String(e));process.exit(1)});
