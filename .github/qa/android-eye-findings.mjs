/** Additional eye findings and actual rendered corneal-reflex checks. */
import { _android, chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { EYE_FINDINGS } from '../../src/simulator/instruments/eye/eyeExamModel.ts';

const out=resolve(process.env.ORBIT_SCREENSHOT_OUT||'artifacts/exhaustive');
await mkdir(out,{recursive:true});
const [device]=await _android.devices({omitDriverInstall:true});
assert(device,'Installed Android device required');
const nativePage=await (await device.webView({pkg:'com.aistudio.mbbsqbank.aycxvd.debug'},{timeout:90000})).page();let page=nativePage;
const viewport=await nativePage.evaluate(()=>({width:window.innerWidth,height:window.innerHeight}));const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const context=await browser.newContext({viewport,userAgent:await nativePage.evaluate(()=>navigator.userAgent.replace('; wv','').replace(' Version/4.0','')),isMobile:true,hasTouch:true,deviceScaleFactor:3});const referencePage=await context.newPage();
page.setDefaultTimeout(30000);
const button=name=>page.getByRole('button',{name,exact:true});
const state=()=>page.getByTestId('eye-response-state').evaluate(e=>({...e.dataset}));
const checks=[];
try {
  for(const reference of [false,true]){
    const path='/simulator?tool=pupil&scenario=normal&nativeTheme=dark&native_audit=1';
    page=reference?referencePage:nativePage;
    if(reference)await page.goto('https://orbitmbbs.vercel.app'+path);
    else{
     execFileSync('adb',['shell','am','start','-n','com.aistudio.mbbsqbank.aycxvd.debug/com.aistudio.mbbsqbank.aycxvd.MainActivity','--es','orbit_anatomy_qa_route',"'"+path+"'",'--ez','orbit_anatomy_qa_reference','false']);
     await page.waitForURL(url=>url.hostname==='appassets.androidplatform.net'&&url.searchParams.get('tool')==='pupil',{timeout:90000});
    }
    await page.waitForFunction(()=>document.querySelector('[data-testid="eye-head-view"]')?.getAttribute('data-render-state')==='ready',undefined,{timeout:180000});
    const findings=page.getByLabel('Eye examination findings',{exact:true});
    for(const finding of EYE_FINDINGS){
      await findings.selectOption(finding.id);
      const samples=[];
      for(const side of ['right','left']){
        if(!['case','normal'].includes(finding.id))await page.locator('.eye-side').getByRole('button',{name:'Patient’s '+side,exact:true}).click();
        const s=await state();
        for(const key of ['rightX','leftX','rightPupil','leftPupil','rightLid','leftLid'])assert(Number.isFinite(Number(s[key])),finding.id+' '+key);
        if(finding.id==='iii')assert(Number(s[side+'Pupil'])>6&&Number(s[side+'Lid'])>.8,'Pupil-involved III findings');
        if(finding.id==='iii_spared')assert.equal(Number(s[side+'Pupil']),4,'Pupil-spared III finding');
        if(finding.id==='horner')assert(Number(s[side+'Pupil'])<3&&Number(s[side+'Lid'])>0,'Horner findings');
        samples.push({side,...s});
      }
      checks.push({reference,finding:finding.id,samples});
    }
    await findings.selectOption('normal');
    await button('🔦 Penlight').click();await button('Right eye penlight').click();
    await page.waitForFunction(()=>Number(document.querySelector('[data-testid="eye-response-state"]')?.dataset.rightPupil)<3&&Number(document.querySelector('[data-testid="eye-response-state"]')?.dataset.leftPupil)<3);
    const anchor=await page.locator('.eye-light-beam').evaluate(e=>({x:parseFloat(e.style.left)/100,y:parseFloat(e.style.top)/100}));
    await button('Turn penlight off').click();await button('🪶 Cotton').click();
    const stage=page.getByRole('group',{name:'Move examination target',exact:true});
    await stage.scrollIntoViewIfNeeded();await page.waitForTimeout(700);
    const canvas=page.getByTestId('eye-head-view').locator('canvas');
    const before=(await page.screenshot({clip:await canvas.boundingBox(),timeout:60000})).toString('base64');
    const box=await stage.boundingBox();
    await page.mouse.move(box.x+box.width*anchor.x,box.y+box.height*anchor.y);await page.mouse.down();
    await page.waitForFunction(()=>Number(document.querySelector('[data-testid="eye-response-state"]')?.dataset.rightLid)>.9&&Number(document.querySelector('[data-testid="eye-response-state"]')?.dataset.leftLid)>.9);
    await page.waitForTimeout(700);
    const blink=(await page.screenshot({clip:await canvas.boundingBox(),timeout:60000})).toString('base64');
    assert.notEqual(blink,before,'Cotton contact must change the actual 3D eyelids');
    await page.screenshot({path:resolve(out,(reference?'vercel':'android')+'-eye-corneal-blink.png')});
    await page.mouse.up();
    await page.waitForFunction(()=>Number(document.querySelector('[data-testid="eye-response-state"]')?.dataset.rightLid)<.1&&Number(document.querySelector('[data-testid="eye-response-state"]')?.dataset.leftLid)<.1);
    checks.push({reference,cornealBlinkAndRelease:true,consensualPupilResponse:true});
  }
  await writeFile(resolve(out,'EYE-FINDINGS-PASSED.json'),JSON.stringify({passed:true,checks},null,2));
} catch(error){
  await page.mouse.up().catch(()=>{});
  await page.screenshot({path:resolve(out,'eye-findings-FAILURE.png')}).catch(()=>{});
  await writeFile(resolve(out,'eye-findings-failure.json'),JSON.stringify({error:error.message,checks},null,2));
  throw error;
} finally {await device.close();await browser.close();}
