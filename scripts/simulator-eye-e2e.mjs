import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
const base=process.env.ORBIT_STUDIO_BASE_URL||'http://127.0.0.1:4180';
const out='artifacts/simulator-eye-exam';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader']});
const report=[];
try {
 for(const width of [360,390,430]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(25000);
  await page.goto(base+'/simulator?tool=pupil');
  const head=page.getByTestId('eye-head-view');await head.waitFor();
  await page.waitForFunction(()=>document.querySelector('[data-testid="eye-head-view"]')?.getAttribute('data-render-state')==='ready');
  const preset=page.getByLabel('Eye examination findings'),state=page.getByTestId('eye-response-state');
  await preset.selectOption('normal');await page.waitForTimeout(600);
  const canvas=head.locator('canvas');assert.ok((await canvas.screenshot()).length>15000,'real 3D head is not visibly rendered');
  const before=await canvas.screenshot();
  await page.getByRole('button',{name:'Patient’s right',exact:true}).click();await page.waitForTimeout(600);
  assert.equal(Number(await state.getAttribute('data-right-x')),-.9);assert.equal(Number(await state.getAttribute('data-left-x')),-.9);
  assert.ok(!before.equals(await canvas.screenshot()),'gaze control did not change the rendered eyes');
  const stage=page.getByRole('group',{name:'Move examination target'});const rect=await stage.boundingBox();
  await page.mouse.move(rect.x+rect.width*.5,rect.y+rect.height*.5);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.78,rect.y+rect.height*.6,{steps:6});await page.mouse.up();
  assert.ok(Number(await state.getAttribute('data-right-x'))>.4,'drag target did not move gaze in real time');
  await page.getByTestId('diagnostic-pupil').getByRole('button',{name:'🔦 Penlight',exact:true}).click();
  await page.getByRole('button',{name:'Right eye penlight',exact:true}).click();await page.waitForTimeout(600);
  assert.equal(Number(await state.getAttribute('data-right-pupil')),2.2);assert.equal(Number(await state.getAttribute('data-left-pupil')),2.2);
  await preset.selectOption('rapd');await page.getByRole('button',{name:'Left eye penlight',exact:true}).click();await page.waitForTimeout(500);
  const strong=Number((await page.getByTestId('eye-right-diameter').textContent()).split(' ')[0]);
  await page.getByRole('button',{name:'Right eye penlight',exact:true}).click();await page.waitForTimeout(600);
  const weak=Number((await page.getByTestId('eye-right-diameter').textContent()).split(' ')[0]);assert.ok(weak>strong+.8,'swinging light did not cause bilateral relative dilation');
  await preset.selectOption('iii');await page.getByRole('button',{name:'Left eye penlight',exact:true}).click();await page.waitForTimeout(500);
  assert.equal(Number(await state.getAttribute('data-right-pupil')),6.5);assert.equal(Number(await state.getAttribute('data-left-pupil')),2.2);
  const droop=await canvas.screenshot();await page.getByRole('button',{name:'Lift eyelids',exact:true}).click();await page.waitForTimeout(600);
  assert.equal(Number(await state.getAttribute('data-right-lid')),0);assert.ok(!droop.equals(await canvas.screenshot()),'lid lifting did not change the real head geometry');
  await head.scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/eye-${width}-third-nerve-penlight.png`});
  await preset.selectOption('vii');await page.getByTestId('diagnostic-pupil').getByRole('button',{name:'🪶 Cotton',exact:true}).click();await page.getByRole('button',{name:'Touch right cornea',exact:true}).click();
  assert.equal(Number(await state.getAttribute('data-right-lid')),0);assert.equal(Number(await state.getAttribute('data-left-lid')),1);
  await page.waitForTimeout(700);await preset.selectOption('normal');await page.getByRole('button',{name:'Touch right cornea',exact:true}).click();
  assert.equal(Number(await state.getAttribute('data-right-lid')),1);assert.equal(Number(await state.getAttribute('data-left-lid')),1);
  await page.waitForTimeout(700);await page.getByText('Facial movements · CN V & VII',{exact:true}).click();await page.getByRole('button',{name:'Open mouth',exact:true}).click();await page.waitForTimeout(600);
  await head.scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/eye-${width}-facial-movements.png`});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow at ${width}px`);
  assert.deepEqual(errors,[]);
  await page.getByRole('button',{name:'Close diagnostic tool'}).click();await head.waitFor({state:'detached'});assert.equal(await page.getByTestId('eye-head-view').count(),0);
  report.push({width,passed:true});await page.close();
 }
 console.log('Real 3D head, gaze drag, light reflex, RAPD, eyelid lift, corneal response and facial controls passed at 360/390/430px.');
} finally {fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
