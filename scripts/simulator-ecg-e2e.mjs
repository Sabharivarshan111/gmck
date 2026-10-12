import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
const base = process.env.ORBIT_STUDIO_BASE_URL || 'http://127.0.0.1:4180';
const out = 'artifacts/simulator-ecg'; fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
const report=[];
try {
 for (const width of [360,390,430]) {
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/simulator?tool=ecg12');
  const sheet=page.getByTestId('ecg-12lead-canvas');await sheet.waitFor();
  for(const name of ['I · II · III','aVR · aVL · aVF','V1 · V2 · V3','V4 · V5 · V6','All 12']){await page.getByRole('button',{name,exact:true}).click();assert.equal(await sheet.getAttribute('width'), name==='All 12'?'840':'420');}
  await page.getByRole('button',{name:'I · II · III',exact:true}).click();
  await page.screenshot({path:`${out}/ecg-${width}.png`});
  await page.getByRole('button',{name:'Tutorial',exact:true}).click();
  const modal=page.getByRole('dialog',{name:'ECG learning studio'});await modal.waitFor();
  await page.screenshot({path:`${out}/lesson-${width}-paper.png`});
  await modal.getByRole('button',{name:'Next',exact:true}).click();
  await modal.getByRole('button',{name:'PR',exact:true}).click();
  const svg=modal.getByRole('img',{name:'Illustrative ECG beat highlighting PR'});
  const frozen=await svg.screenshot();await page.waitForTimeout(150);assert.ok(frozen.equals(await svg.screenshot()),'paused teaching beat moved');
  await modal.getByRole('button',{name:'Play beat'}).click();await page.waitForTimeout(180);assert.ok(!frozen.equals(await svg.screenshot()),'beat playback did not move');
  await modal.getByRole('button',{name:'Pause beat'}).click();
  await page.screenshot({path:`${out}/lesson-${width}-beat.png`});
  await modal.getByRole('button',{name:'Lesson 3: Find the rate'}).click();assert.ok((await modal.textContent()).includes('75 bpm'));
  await modal.getByRole('button',{name:'Lesson 6: Check yourself'}).click();await modal.getByRole('button',{name:'75 bpm',exact:true}).click();assert.ok((await modal.getByRole('status').textContent()).includes('Correct'));
  for(const tab of ['Leads & axis','Intervals','Patterns']){await modal.getByRole('button',{name:tab,exact:true}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:`${out}/lesson-${width}-${tab.split(' ')[0]}.png`});}
  await modal.getByRole('button',{name:'Start here',exact:true}).click();await modal.getByText('Explore the cardiac cycle',{exact:true}).click();await modal.getByRole('button',{name:/Heart & valves/}).click();await page.screenshot({path:`${out}/lesson-${width}-heart.png`});
  await modal.getByRole('button',{name:'Done',exact:true}).click();await modal.waitFor({state:'detached'});
  assert.deepEqual(errors,[]);report.push({width,passed:true});await page.close();
 }
 console.log('ECG lead groups, paused/playback beat, rate exercise, all lesson levels and mobile layout passed.');
}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
