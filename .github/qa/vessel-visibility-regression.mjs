/** Exercise real dossier selection and GL pixels; no scene/material/state injection. */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { ORGAN_CONNECTIONS } from '../../src/simulator/data/organConnections.ts';
const out=process.env.ORBIT_VISIBILITY_OUT||'/tmp/orbit-visibility-regression';await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:393,height:789},isMobile:true,hasTouch:true});
await page.route(/https:\/\/(?:[^/]+\.)?(?:googlesyndication\.com|doubleclick\.net|googleadservices\.com)\//,r=>r.abort());
const base=process.env.ORBIT_VISIBILITY_BASE_URL||'http://127.0.0.1:4180';
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const report={base,checks:[],errors};
const cById=new Map(Object.values(ORGAN_CONNECTIONS).flat().map(c=>[c.id,c]));
const selected=(process.env.ORBIT_VISIBILITY_IDS?.split(',')||['connection_19','connection_25','connection_66','connection_69','connection_108','connection_133','connection_207','connection_225','connection_234','connection_270','connection_294','connection_309','connection_313','connection_373','connection_419']);
async function pixels(kind){return page.getByTestId('anatomy-renderer').locator('canvas').evaluate((c,kind)=>new Promise(resolve=>requestAnimationFrame(()=>{const gl=c.getContext('webgl2')||c.getContext('webgl'),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,p=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,p);let selectedColour=0;for(let i=0;i<p.length;i+=4){if(kind==='venous'?(p[i+2]>p[i]*1.5&&p[i+2]>p[i+1]*1.3&&p[i+2]>80):(p[i]>p[i+1]*2.5&&p[i]>p[i+2]*1.7&&p[i]>100))selectedColour++;}resolve({w,h,selectedColour});})),kind);}
async function visiblePixels(kind){let result;for(let i=0;i<20;i++){result=await pixels(kind);if(result.selectedColour>0)return result;await page.waitForTimeout(250);}return result;}
async function ready(){await page.getByTestId('anatomy-renderer').waitFor();await page.waitForFunction(()=>{const e=document.querySelector('[data-testid="anatomy-renderer"]');return e?.querySelector('canvas')&&!/LOADING (BODYPARTS3D|Z-ANATOMY|HRA)/.test(e.textContent||'');},null,{timeout:180000});}
try{
 for(const id of selected){
  const c=cById.get(id);assert(c?.targetId&&c.kind!=='relation');
  await page.goto(base+'/simulator?mode=anatomy&organ='+c.owner+'&isolate='+c.owner,{waitUntil:'domcontentloaded'});await ready();
  const d=page.getByTestId('organ-detail-drawer');await d.waitFor();await d.getByRole('tab',{name:'Supply',exact:true}).click();await page.getByTestId('inspect-'+id).click();await d.waitFor({state:'hidden'});await ready();await page.getByTestId('connection-leaders').waitFor();await page.waitForTimeout(700);
  const on=await visiblePixels(c.kind);await page.screenshot({path:out+'/'+id+'-context.png'});assert(on.selectedColour>0,id+' selected vessel is invisible with context');
  await page.getByRole('button',{name:'Hide organ context',exact:true}).click();await page.waitForTimeout(600);const off=await visiblePixels(c.kind);assert(off.selectedColour>0,id+' selected vessel is invisible without context');
  await page.getByRole('button',{name:'Show organ context',exact:true}).click();await page.waitForTimeout(600);const restored=await visiblePixels(c.kind);assert(restored.selectedColour>0,id+' selected vessel vanished after restoring context');
  report.checks.push({id,owner:c.owner,label:c.label,on,off,restored});console.log(id,on.selectedColour,off.selectedColour,restored.selectedColour);
 }
 for(const [layer,systems] of [['skeletal',['skeletal']],['vascular',['arterial','cardiac','venous']],['skin',['integumentary']],['viscera',['cardiac','digestive','endocrine','lymphatic','nervous','reproductive','respiratory','sensory','urinary']]]){
  await page.goto(base+'/simulator?mode=anatomy&layer='+layer,{waitUntil:'domcontentloaded'});await ready();await page.waitForTimeout(700);
  const visible=(await page.getByTestId('anatomy-renderer').getAttribute('data-visible-atlas-systems')).split(',');assert(visible.length>0&&visible.every(s=>systems.includes(s)),layer+' contains unexpected systems: '+visible);if(layer!=='viscera')assert.deepEqual(visible.sort(),systems.sort());
  await page.screenshot({path:out+'/layer-'+layer+'.png'});report.checks.push({layer,visible});console.log(layer,visible);
 }
 assert.deepEqual(errors,[]);report.status='PASSED';
}catch(error){report.status='FAILED';report.failure=String(error.stack||error);throw error;}
finally{await writeFile(out+'/results.json',JSON.stringify(report,null,2));await browser.close();}
