/** Additional eye findings and actual rendered corneal-reflex checks. */
import { _android, chromium } from 'playwright';
import { createHash } from 'node:crypto';
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
async function capture(name,reference){await page.screenshot({path:resolve(out,(reference?'vercel-':'cdp-android-')+name+'.png')});if(!reference)await writeFile(resolve(out,'android-'+name+'.png'),execFileSync('adb',['exec-out','screencap','-p'],{maxBuffer:20*1024*1024}));}
async function hash(locator,reference){
 await locator.scrollIntoViewIfNeeded();const box=await locator.boundingBox();const viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
 if(!reference){
  // CDP captures can omit Android WebGL surfaces. Measure the compositor image
  // using the observed native WebView bounds, including system-bar offsets.
  return execFileSync('python3',['-c',`import sys,json,subprocess,xml.etree.ElementTree as ET,re,io,hashlib
from PIL import Image
d=json.loads(sys.argv[1]); text=subprocess.check_output(['adb','shell','am','instrument','-w','com.orbit.qa/com.orbit.qa.UiDump'],text=True)
xml=next(s.split('=',1)[1] for s in text.splitlines() if s.startswith('INSTRUMENTATION_RESULT: orbit_ui='))
nodes=[n for n in ET.fromstring(xml).iter('node') if n.get('class')=='android.webkit.WebView']
rects=[list(map(int,re.findall(r'-?\\d+',n.get('bounds','')))) for n in nodes];rects=[r for r in rects if len(r)==4 and r[2]>r[0] and r[3]>r[1]]
assert rects,'Observed native WebView bounds required'
l,t,r,b=max(rects,key=lambda r:(r[2]-r[0])*(r[3]-r[1]));x=d['box'];v=d['viewport'];sx=(r-l)/v['width'];sy=(b-t)/v['height']
crop=(max(l,round(l+x['x']*sx)),max(t,round(t+x['y']*sy)),min(r,round(l+(x['x']+x['width'])*sx)),min(b,round(t+(x['y']+x['height'])*sy)))
assert crop[2]>crop[0] and crop[3]>crop[1],'Canvas must be visible'
im=Image.open(io.BytesIO(subprocess.check_output(['adb','exec-out','screencap','-p']))).crop(crop).convert('RGB')
print(hashlib.sha256(im.tobytes()).hexdigest())`,JSON.stringify({box,viewport})],{encoding:'utf8',maxBuffer:1024*1024}).trim();
 }
 const x=Math.max(0,box.x),y=Math.max(0,box.y),width=Math.min(box.x+box.width,viewport.width)-x,height=Math.min(box.y+box.height,viewport.height)-y;
 assert(width>0&&height>0,'Canvas must be visible');return createHash('sha256').update(await page.screenshot({clip:{x,y,width,height},timeout:60000})).digest('hex');
}
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
        samples.push({side,...s});await capture('eye-finding-'+finding.id+'-'+side,reference);
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
    const before=await hash(canvas,reference);
    const box=await stage.boundingBox();
    await page.mouse.move(box.x+box.width*anchor.x,box.y+box.height*anchor.y);await page.mouse.down();
    await page.waitForFunction(()=>Number(document.querySelector('[data-testid="eye-response-state"]')?.dataset.rightLid)>.9&&Number(document.querySelector('[data-testid="eye-response-state"]')?.dataset.leftLid)>.9);
    await page.waitForTimeout(700);
    const blink=await hash(canvas,reference);
    assert.notEqual(blink,before,'Cotton contact must change the actual 3D eyelids');
    await capture('eye-corneal-blink',reference);
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
