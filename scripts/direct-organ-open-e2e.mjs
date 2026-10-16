import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const runtime=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const {chromium}=runtime?createRequire(runtime+'/__entry.js')('playwright'):await import('playwright');
const browser=await chromium.launch({headless:true,...runtime?{executablePath:'/tmp/orbit-chromium'}:{},args:['--no-sandbox','--no-zygote','--single-process','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const targets={heart:'heart',kidney:'kidney',liver:'hra_liver_overview',lungs:'hra_lung_overview'};
const base=process.env.SIMULATOR_BASE_URL||'http://127.0.0.1:4180';
const out='artifacts/direct-organ-open';fs.mkdirSync(out,{recursive:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function loaded(){await page.getByText(/LOADING BODYPARTS3D/).waitFor({state:'hidden',timeout:90000});}
try{
 await page.goto(base+'/simulator?mode=anatomy');await loaded();
 for(const organ of ['heart','kidney','liver','lungs']){
  await page.getByTestId('anatomy-label-'+organ).click({timeout:30000});
  await page.waitForFunction(id=>document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-isolated')===id,targets[organ]);
  assert.equal(await page.getByTestId('organ-detail-drawer').count(),0,'model tap must not open a dossier');
  await page.getByTestId('mobile-isolation-banner').waitFor();
  if(organ==='heart'){await page.waitForTimeout(700);await page.screenshot({path:out+'/heart-direct.png'});}
  await page.getByRole('button',{name:'Open selected structure anatomy details',exact:true}).click();
  await page.getByTestId('organ-detail-drawer').waitFor();
  await page.getByTestId('organ-detail-drawer').getByRole('button',{name:'Close',exact:true}).click();
  await page.getByRole('button',{name:'Restore whole anatomy from selected structure',exact:true}).click();
  await page.getByRole('button',{name:'Full',exact:true}).click();
 }
 // Coronary arteries start on the heart; hiding is a reversible explicit action.
 await page.goto(base+'/simulator?organ=heart&isolate=heart');await loaded();
 await page.getByTestId('organ-detail-drawer').getByRole('tab',{name:'Supply',exact:true}).click();
 await page.getByTestId('inspect-connection_19').click();
 await page.getByTestId('organ-detail-drawer').waitFor({state:'hidden'});
 await page.getByTestId('connection-leaders').waitFor();
 await page.waitForFunction(()=>document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-visible-atlas-systems')?.includes('cardiac'));
 assert.equal(await page.getByRole('button',{name:'Hide organ context',exact:true}).getAttribute('aria-pressed'),'true');
 const arrows=page.getByTestId('connection-leaders').locator('circle');
 assert(await arrows.count()>0,'coronary view must have projected arrow endpoints');
 await page.screenshot({path:out+'/coronary-heart-default.png'});
 await page.getByRole('button',{name:'Hide organ context',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-visible-atlas-systems')==='arterial');
 await page.screenshot({path:out+'/coronary-heart-hidden.png'});
 await page.goto(base+'/simulator?organ=abdomen&isolate=abdomen');await loaded();
 const d=page.getByTestId('organ-detail-drawer');await d.getByRole('tab',{name:'Supply',exact:true}).click();
 await page.getByTestId('inspect-connection_412').click();
 await d.waitFor({state:'hidden'});
 await page.getByTestId('connection-leaders').waitFor({timeout:15000});
 assert.equal(await page.getByRole('button',{name:'Hide organ context',exact:true}).getAttribute('aria-pressed'),'true');
 await page.waitForFunction(()=>document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-visible-atlas-systems')?.includes('digestive'));
 await page.screenshot({path:out+'/celiac-with-organ.png'});
 await page.getByRole('button',{name:'Hide organ context',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-visible-atlas-systems')==='arterial');
 await page.getByRole('button',{name:'Show organ context',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-visible-atlas-systems')?.includes('digestive'));
 for(const width of [360,430]){
  await page.setViewportSize({width,height:844});
  await page.getByTestId('connection-leaders').waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
  await page.screenshot({path:out+'/celiac-'+width+'.png'});
 }
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
 assert.deepEqual(errors,[]);console.log('Four real organ-label taps open models directly; details reopen explicitly; celiac vessel focus and context toggle pass.');
}catch(e){await page.screenshot({path:out+'/FAIL.png'}).catch(()=>{});throw e;}finally{await browser.close();}
