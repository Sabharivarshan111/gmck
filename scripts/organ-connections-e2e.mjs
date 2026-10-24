// Test-only paid account for full-content regressions; free preview has separate denial tests.
import { installPremiumTestAccount } from '../mobile/web/test-premium-fixture.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { ORGAN_CONNECTIONS as catalog } from '../src/simulator/data/organConnections.ts';
const runtime=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium }=runtime?createRequire(runtime+'/__entry.js')('playwright'):await import('playwright');
const browser=await chromium.launch({headless:true,...runtime?{executablePath:'/tmp/orbit-chromium'}:{},args:['--no-sandbox','--no-zygote','--single-process','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await installPremiumTestAccount(page.context());
const group=process.env.ORGAN_CONNECTION_GROUP===undefined?null:Number(process.env.ORGAN_CONNECTION_GROUP);
const owners=Object.keys(catalog).filter((_,index)=>group===null||index%4===group);
const out='artifacts/organ-connections';fs.mkdirSync(out,{recursive:true});const base=process.env.SIMULATOR_BASE_URL||'http://127.0.0.1:4180';const errors=[];page.on('pageerror',e=>errors.push(e.message));const report=[];
async function drawer(owner){await page.goto(base+'/simulator?organ='+owner+'&isolate='+owner);const d=page.getByTestId('organ-detail-drawer');await d.waitFor();return d;}
async function loaded(){await page.getByText(/LOADING BODYPARTS3D/).waitFor({state:'hidden',timeout:90000});}
async function inspect(c){await page.getByTestId('inspect-'+c.id).click();await page.getByTestId('organ-detail-drawer').waitFor({state:'hidden'});await loaded();await page.waitForFunction(id=>document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-isolated')===id,c.id);await page.getByTestId('connection-leaders').waitFor({timeout:15000});await page.getByTestId('anatomy-connection-callout').getByText(c.label,{exact:true}).waitFor({timeout:15000});}
try{
 if(group===null||group===0) for(const width of [360,390,430])for(const owner of ['heart','kidney']){
  await page.setViewportSize({width,height:844});const d=await drawer(owner);await d.getByRole('tab',{name:'Supply',exact:true}).click();const c=catalog[owner].find(c=>c.kind==='arterial'&&c.targetId);await inspect(c);await page.waitForTimeout(700);await page.screenshot({path:`${out}/${owner}-arterial-${width}.png`});
  if(owner==='kidney'){const systems=await page.getByTestId('anatomy-renderer').getAttribute('data-visible-atlas-systems');assert(systems?.includes('arterial') && systems.includes('urinary'),'renal artery must show its kidney context by default');}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');report.push({owner,width,view:c.label,pass:true});
 }
 // Every dossier must expose every audited control; missing meshes open a real
 // diagram, never a misleading whole-organ keyword fallback.
 for(const owner of owners){
  const d=await drawer(owner);await d.getByRole('tab',{name:'Relations',exact:true}).click();const panel=page.getByTestId(`organ-connections-${owner}-relations`);
  assert.equal(await panel.locator('.oc-card').count(),catalog[owner].filter(c=>c.kind==='relation').length,owner);
  const missing=catalog[owner].find(c=>c.kind==='relation'&&!c.targetId);
  if(missing){await panel.getByTestId('inspect-'+missing.id).click();await panel.getByRole('region',{name:missing.label+' teaching diagram',exact:true}).waitFor();await panel.getByRole('button',{name:'Close teaching diagram'}).click();}
  await d.getByRole('tab',{name:'Supply',exact:true}).click();assert.equal(await page.getByTestId(`organ-connections-${owner}-supply`).locator('.oc-card').count(),catalog[owner].filter(c=>c.kind!=='relation').length,owner);
  report.push({owner,controls:true,diagram:!!missing,pass:true});
  for (const c of catalog[owner].filter(c=>c.targetId)) {
    await page.getByTestId('organ-detail-drawer').getByRole('tab',{name:c.kind==='relation'?'Relations':'Supply',exact:true}).click();
    await inspect(c);
    assert(await page.getByTestId('anatomy-connection-callout').getByText(c.label,{exact:true}).count(),c.label+' callout');
    await page.getByRole('button',{name:'Open selected structure anatomy details',exact:true}).click();
    await page.getByTestId('organ-detail-drawer').waitFor();
    report.push({owner,connection:c.id,view:c.label,pass:true});
  }
  fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
  console.log(owner+': controls and registered routes passed');
 }
 // Exercise representative relation and drainage views, then rotation and
 // reopening the parent dossier from the selected-structure information button.
 if(group===null||group===0) for(const [owner,kind] of [['kidney','venous'],['heart','venous'],['liver','relation'],['pancreas','relation'],['knee','arterial']]){
  const d=await drawer(owner);await d.getByRole('tab',{name:kind==='relation'?'Relations':'Supply',exact:true}).click();const c=catalog[owner].find(c=>c.kind===kind&&c.targetId);assert(c);await inspect(c);
  const before=await page.getByTestId('connection-leaders').locator('path').first().getAttribute('d');
  await page.getByRole('button',{name:'Show camera views',exact:true}).click();await page.getByRole('button',{name:/^side$/i}).click();await page.waitForFunction(old=>document.querySelector('[data-testid="connection-leaders"] path')?.getAttribute('d')!==old,before,{timeout:15000});const after=await page.getByTestId('connection-leaders').locator('path').first().getAttribute('d');assert.notEqual(before,after,'leader must follow camera rotation');
  await page.getByRole('button',{name:'Open selected structure anatomy details',exact:true}).click();await page.getByTestId('organ-detail-drawer').waitFor();assert.equal(await page.getByTestId('organ-detail-drawer').getByRole('tab',{name:'Overview',exact:true}).getAttribute('aria-selected'),'true'); // opens overview, not a stale Supply panel
  report.push({owner,kind,rotation:true,reopenedParent:true,pass:true});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(`${owners.length} dossier controls/diagram fallbacks and ${report.filter(r=>r.connection).length} registered routes passed${group===null||group===0?', including 3 phone widths and relation/drainage/rotation checks':''}.`);
}catch(e){await page.screenshot({path:out+'/FAIL.png'}).catch(()=>{});console.error(errors);throw e;}finally{await browser.close();}
