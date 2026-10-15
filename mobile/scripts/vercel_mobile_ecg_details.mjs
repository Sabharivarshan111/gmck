import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve('artifacts/vercel-mobile-ecg-details');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:393,height:800},deviceScaleFactor:3,isMobile:true,hasTouch:true,colorScheme:'dark'});
const captures=[],errors=[];
async function shot(name){await page.waitForTimeout(1000);await page.screenshot({path:resolve(out,name+'.png')});captures.push(name);}
try{
 await page.goto('https://orbitmbbs.vercel.app/simulator',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Practise a case',exact:true}).click();
 await page.getByRole('button',{name:/Acute Inferior STEMI/}).click();
 await page.getByTestId('simulator-tab-monitor').click();
 await page.locator('[data-active-tab="telemetry"]').waitFor();
 await page.getByRole('button',{name:'🎓 Tutorial',exact:true}).click();
 await page.getByRole('dialog',{name:'ECG learning studio'}).waitFor();await shot('vercel-icu-tutorial');
 await page.getByRole('button',{name:'Leads & axis',exact:true}).click();await shot('vercel-icu-leads-axis');
 await page.goto('https://orbitmbbs.vercel.app/simulator?tool=ecg12&scenario=stemi',{waitUntil:'domcontentloaded'});
 await page.getByLabel('Static synthetic ECG with calibrated grid').waitFor();
 for(const segment of ['P','PR','QRS','ST','T','QT']){
  await page.getByRole('button',{name:segment,exact:true}).click();
  await page.getByText(/Single-Lead Magnified Cut-Out:/).scrollIntoViewIfNeeded();
  await shot('vercel-ecg-cutout-'+segment.toLowerCase());
 }
}catch(e){errors.push(e.message);await shot('failure').catch(()=>{});process.exitCode=1;}
finally{await writeFile(resolve(out,'report.json'),JSON.stringify({url:'https://orbitmbbs.vercel.app',viewport:[393,800],captures,errors,status:'NOT_CERTIFIED'},null,2));await browser.close();}
