import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const out='native-diagnostics-proof';fs.mkdirSync(out,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','preview/vite.config.ts','--host','127.0.0.1','--port','4179'],{cwd:'mobile',stdio:'pipe'});
let log='';server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b);
let browser;
try{
 for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:4179/ecg.html')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 browser=await chromium.launch({headless:true});
 for(const width of [360,390,430]){
  const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4179/ecg.html',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'ST Segment',exact:true}).click();
  await page.getByText('Clinical teaching notes',{exact:true}).waitFor();
  const paths=await page.locator('svg path').count();assert(paths>12,'ECG trace missing');
  for(const group of ['aVR · aVL · aVF','V1 · V2 · V3','V4 · V5 · V6','All 12'])await page.getByRole('button',{name:group,exact:true}).click();
  await page.getByRole('button',{name:'Enlarge ECG',exact:true}).click();await page.getByRole('button',{name:'Fit ECG to screen',exact:true}).click();
  await page.getByRole('button',{name:'stemi_inferior',exact:true}).click();await page.getByText(/captured stemi inferior/).waitFor();
  await page.getByRole('button',{name:'I · II · III',exact:true}).click();
  await page.locator('svg').last().screenshot({path:`${out}/ecg-${width}.png`});
  await page.getByRole('button',{name:'Open eye examination',exact:true}).click();
  await page.getByRole('button',{name:'Normal examination',exact:true}).click();
  await page.getByRole('button',{name:'Light · right',exact:true}).click();
  await page.getByText('Right pupil 2.2 mm · Left pupil 2.2 mm',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Relative afferent defect · CN II',exact:true}).click();
  await page.getByRole('button',{name:'Light · left',exact:true}).click();
  await page.getByText('Right pupil 2.2 mm · Left pupil 2.2 mm',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Light · right',exact:true}).click();
  await page.getByText('Right pupil 3.7 mm · Left pupil 3.7 mm',{exact:true}).waitFor();
  await page.getByRole('button',{name:'CN III palsy · pupil involved',exact:true}).click();
  await page.getByRole('button',{name:'Light · left',exact:true}).click();
  await page.getByText('Right pupil 6.5 mm · Left pupil 2.2 mm',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Elevate upper lids',exact:true}).click();
  await page.getByTestId('native-eye-stage').scrollIntoViewIfNeeded();await page.getByTestId('native-eye-stage').screenshot({path:`${out}/eye-${width}.png`});
  await page.getByRole('button',{name:'Corneal afferent loss · V1',exact:true}).click();
  await page.getByRole('button',{name:'Cotton · right cornea',exact:true}).click();
  await page.getByText('Right blink: absent · Left blink: absent',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Cotton · left cornea',exact:true}).click();
  await page.getByText('Right blink: present · Left blink: present',{exact:true}).waitFor();
  assert.equal(errors.length,0,errors.join('\n'));await page.close();
 }
 console.log('Native ECG capture/groups/segments/enlarge and eye light/RAPD/CN III/V1 reflex controls passed at 360/390/430px. RN-web layout only; Android rendering not verified.');
 for(const name of ['ecg-390','eye-390']){console.log('UI_IMAGE_BEGIN '+name);console.log(fs.readFileSync(`${out}/${name}.png`).toString('base64'));console.log('UI_IMAGE_END');}
}catch(error){console.error(log.slice(-3000));throw error;}finally{await browser?.close();server.kill();}
