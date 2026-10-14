import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const out=resolve(process.argv[2]||'artifacts/native-vault-parity');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:1,isMobile:true,hasTouch:true,colorScheme:'dark'});
const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const captures=[];
async function shot(name) {
  await page.waitForTimeout(250);
  const viewport=await page.evaluate(()=>({width:window.innerWidth,height:window.innerHeight}));
  if(viewport.width!==393||viewport.height!==852) throw Error('Reference viewport is not mobile 393×852');
  await page.screenshot({path:resolve(out,name+'.png')});captures.push(name);
}
async function open(query='') {
  await page.goto('https://orbitmbbs.vercel.app/simulator'+query,{waitUntil:'domcontentloaded'});
  await page.locator('[data-simulator-root]').waitFor({state:'visible',timeout:60000});
}
try {
  await open();await shot('00-vercel-studio-393x852');
  await page.getByRole('button',{name:'Switch to light theme'}).click();await shot('00-vercel-studio-light-393x852');
  await page.getByRole('button',{name:'Switch to dark theme'}).click();
  await page.getByRole('button',{name:'Practise a case',exact:true}).click();await shot('00-vercel-case-choices-393x852');
  await page.getByRole('button',{name:/Acute Inferior STEMI/}).click();await page.getByTestId('simulator-bottom-tabs').waitFor({state:'visible'});await shot('00-vercel-case-393x852');
  await page.getByTestId('intervention-saline').click();
  await page.getByTestId('simulator-tab-monitor').click();
  await page.locator('[data-active-tab="telemetry"]').waitFor({state:'visible'});await shot('00-vercel-icu-393x852');
  await open('?tool=radiology');
  await page.locator('.radio-stage img').waitFor({state:'visible',timeout:60000});
  await page.waitForFunction(()=>{const image=document.querySelector('.radio-stage img');return image?.complete&&image.naturalWidth>0;});
  await shot('00-vercel-xray-393x852');
  await page.getByRole('button',{name:'Next →',exact:true}).click();
  await page.waitForFunction(()=>{const image=document.querySelector('.radio-stage img');return image?.complete&&image.naturalWidth>0;});
  await shot('00-vercel-xray-case-393x852');
  await page.getByRole('button',{name:'Brain MRI',exact:true}).click();
  await page.locator('.radio-stage canvas').waitFor({state:'visible',timeout:60000});
  await shot('00-vercel-mri-axial-393x852');
  await page.getByRole('button',{name:'Coronal',exact:true}).click();await shot('00-vercel-mri-coronal-393x852');
  await page.getByRole('button',{name:'Sagittal',exact:true}).click();await shot('00-vercel-mri-sagittal-393x852');
  await page.getByRole('button',{name:'Full screen',exact:true}).click();await shot('00-vercel-radiology-fullscreen-393x852');
  await page.getByRole('button',{name:'Exit full screen',exact:true}).click();
  await page.getByRole('button',{name:'Close diagnostic tool'}).click();
  await page.getByRole('button',{name:/Clubbing Normal nails/}).click();
  await page.getByRole('button',{name:'Clubbing findings',exact:true}).click();
  await page.waitForFunction(()=>{const image=document.querySelector('.clubbing-card img');return image?.complete&&image.naturalWidth>0;});
  await shot('00-vercel-clubbing-393x852');
  await page.getByRole('button',{name:'Reveal answer',exact:true}).click();
  await shot('00-vercel-clubbing-viva-393x852');
  if(errors.length) throw Error('Vercel client errors: '+errors.join('; '));
} catch(error) {
  errors.push(error.message);
  await page.screenshot({path:resolve(out,'99-vercel-mobile-failure.png')}).catch(()=>undefined);
  await writeFile(resolve(out,'99-vercel-mobile-failure.html'),await page.content());
  throw error;
} finally {
  await writeFile(resolve(out,'vercel-mobile-audit.json'),JSON.stringify({viewport:{width:393,height:852},captures,errors},null,2));
  await browser.close();
}
