import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
const base = process.env.ORBIT_STUDIO_BASE_URL || 'http://127.0.0.1:4180';
const out = 'artifacts/simulator-ecg'; fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath:process.env.ORBIT_CHROMIUM_PATH||undefined, args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
const report=[];
try {
 for (const width of [360,390,430]) {
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/simulator?tool=ecg12');
  const sheet=page.getByTestId('ecg-12lead-canvas');await sheet.waitFor();
  for(const name of ['I · II · III','aVR · aVL · aVF','V1 · V2 · V3','V4 · V5 · V6','All 12']){await page.getByRole('button',{name,exact:true}).click();assert.equal(await sheet.getAttribute('width'), name==='All 12'?'840':'420');}
  await page.getByRole('button',{name:'I · II · III',exact:true}).click();
  const snapshot=await sheet.screenshot();await page.waitForTimeout(1500);assert.ok(snapshot.equals(await sheet.screenshot()),'captured diagnostic sheet moved');await page.getByRole('button',{name:'Capture current ECG',exact:true}).click();await page.screenshot({path:`${out}/ecg-${width}.png`});
  await page.getByRole('button',{name:'Tutorial',exact:true}).click();
  const modal=page.getByRole('dialog',{name:'ECG learning studio'});await modal.waitFor();
  const explorer=modal.getByRole('region',{name:'Synchronized heart and ECG'});
  const heart=explorer.getByRole('img',{name:/Heart cutaway/});
  const teachingCursor=explorer.getByTestId('beat-cursor');
  const paused=await teachingCursor.getAttribute('x1');await page.waitForTimeout(180);assert.equal(await teachingCursor.getAttribute('x1'),paused);
  await explorer.getByRole('button',{name:'P',exact:true}).click();assert.equal(await heart.getAttribute('data-activation'),'atria');
  await explorer.getByRole('button',{name:'PR',exact:true}).click();assert.equal(await heart.getAttribute('data-activation'),'delay');
  await explorer.getByRole('button',{name:'QRS',exact:true}).click();assert.equal(await heart.getAttribute('data-activation'),'ventricles');
  await explorer.getByRole('button',{name:'Play beat',exact:true}).click();const before=await teachingCursor.getAttribute('x1');await page.waitForFunction(([el,x])=>el.getAttribute('x1')!==x,[await teachingCursor.elementHandle(),before],{timeout:5000,polling:100});
  await explorer.getByRole('button',{name:'Pause beat',exact:true}).click();
  await modal.locator('.ecg-model-panel').scrollIntoViewIfNeeded();await page.waitForTimeout(350);
  await page.screenshot({path:`${out}/new-heart-${width}.png`});
  await page.screenshot({path:`${out}/lesson-${width}-paper.png`});
  await modal.getByRole('button',{name:'Next',exact:true}).click();
  await modal.getByTestId('ecg-learning-path').getByRole('button',{name:'PR',exact:true}).click();
  const svg=modal.getByRole('img',{name:'Illustrative ECG beat highlighting PR'});
  const cursor=svg.locator('line');const frozenX=await cursor.getAttribute('x1');await page.waitForTimeout(150);assert.equal(await cursor.getAttribute('x1'),frozenX,'paused teaching cursor moved');
  await modal.getByTestId('ecg-learning-path').getByRole('button',{name:'Play beat'}).click();await page.waitForFunction(([el,x])=>el.getAttribute('x1')!==x,[await cursor.elementHandle(),frozenX],{timeout:5000,polling:100});
  await modal.getByTestId('ecg-learning-path').getByRole('button',{name:'Pause beat'}).click();
  await page.screenshot({path:`${out}/lesson-${width}-beat.png`});
  await modal.getByRole('button',{name:'Lesson 3: Find the rate'}).click();assert.ok((await modal.textContent()).includes('75 bpm'));
  await modal.getByRole('button',{name:'Lesson 6: Check yourself'}).click();await modal.getByRole('button',{name:'75 bpm',exact:true}).click();assert.ok((await modal.getByTestId('ecg-learning-path').getByRole('status').textContent()).includes('Correct'));
  for(const tab of ['Leads & axis','Intervals','Patterns']){await modal.getByRole('button',{name:tab,exact:true}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:`${out}/lesson-${width}-${tab.split(' ')[0]}.png`});}
  await modal.getByRole('button',{name:'Leads & axis',exact:true}).click();
  await modal.getByRole('slider',{name:'Net QRS axis'}).fill('-120');assert.ok((await modal.textContent()).includes('Extreme axis'));
  await modal.getByRole('button',{name:'V6',exact:true}).click();assert.ok((await modal.textContent()).includes('Left midaxillary line'));
  await modal.getByRole('button',{name:'Intervals',exact:true}).click();assert.ok((await modal.textContent()).includes('QTc 409 ms'));
  await modal.getByRole('combobox',{name:'QT correction formula'}).selectOption('bazett');assert.ok((await modal.textContent()).includes('QTc 425 ms'));
  await modal.getByRole('button',{name:'SA / AV node',exact:true}).click();await modal.getByRole('img',{name:'Nodal action potential'}).waitFor();
  await modal.getByRole('button',{name:'Patterns',exact:true}).click();
  await modal.getByRole('button',{name:'Atrial fibrillation',exact:true}).click();await modal.getByRole('img',{name:'Atrial fibrillation schematic ECG example'}).waitFor();
  for(const territory of ['inferior','anterior','lateral'])await modal.getByRole('button',{name:territory,exact:true}).click();
  assert.ok(await modal.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  await modal.getByRole('button',{name:'Start here',exact:true}).click();await modal.getByText('Explore the cardiac cycle',{exact:true}).click();await modal.getByRole('button',{name:/Heart & valves/}).click();await modal.getByRole('region',{name:'Heart and valve physiology'}).getByRole('img').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/lesson-${width}-heart.png`});
  await modal.getByRole('button',{name:'Done',exact:true}).click();await modal.waitFor({state:'detached'});
  if(width===390){await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Tutorial',exact:true}).click();await modal.waitFor();assert.equal(await modal.getByRole('region',{name:'Synchronized heart and ECG'}).getByRole('button',{name:'Play beat',exact:true}).isDisabled(),true);await modal.getByRole('button',{name:'Done',exact:true}).click();await modal.waitFor({state:'detached'});await page.emulateMedia({reducedMotion:'no-preference'});}
  assert.deepEqual(errors,[]);report.push({width,passed:true});await page.close();
 }
 console.log('ECG lead groups, paused/playback beat, rate exercise, all lesson levels and mobile layout passed.');
}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
