/** Authoritative exhaustive CI entrypoint. Tests run inside the installed Android WebView via Playwright's Android API.
 * Input is sent to the real page. No DOM/model/patient state is substituted. */
import { _android, chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { ORGAN_CONNECTIONS } from '../../src/simulator/data/organConnections.ts';
import { ZANATOMY_REFERENCE_TARGETS, zAnatomyReferenceRegistrationNotice } from '../../src/simulator/data/zanatomyReferences.ts';
const referenceOrigin=process.env.ORBIT_REFERENCE_ORIGIN||'https://orbitmbbs.vercel.app';
const out=resolve(process.env.ORBIT_SCREENSHOT_OUT||'artifacts/native-exhaustive');await mkdir(out,{recursive:true});
const devices=await _android.devices({omitDriverInstall:true});assert.equal(devices.length,1,'Exactly one actual emulator must be connected');
const device=devices[0], webview=await device.webView({pkg:'com.aistudio.mbbsqbank.aycxvd.debug'},{timeout:90000});
const nativePage=await webview.page();let page=nativePage;page.setDefaultTimeout(60000);
const viewport=await nativePage.evaluate(()=>({width:window.innerWidth,height:window.innerHeight}));
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const webContext=await browser.newContext({viewport,userAgent:await nativePage.evaluate(()=>navigator.userAgent.replace('; wv','').replace(' Version/4.0','')),isMobile:true,hasTouch:true,deviceScaleFactor:3});const referencePage=await webContext.newPage();referencePage.setDefaultTimeout(60000);
const groups=8;
const partitionCount=Number(process.env.ORBIT_ANATOMY_PARTITIONS||1),partition=Number(process.env.ORBIT_ANATOMY_PARTITION||0);
assert(Number.isInteger(partitionCount)&&partitionCount>0&&Number.isInteger(partition)&&partition>=0&&partition<partitionCount,'Valid anatomy partition required');
const connectionOrder=new Map(Object.values(ORGAN_CONNECTIONS).flat().map((c,i)=>[c.id,i]));
const inPartition=c=>connectionOrder.get(c.id)%partitionCount===partition;
const coverage=JSON.parse(await readFile(resolve(out,'anatomy-coverage.json'),'utf8'));
const checks=[],failures=[],errors=[];for(const surface of [nativePage,referencePage])surface.on('pageerror',e=>{const record={surface:surface===nativePage?'android':'vercel',url:surface.url(),at:new Date().toISOString(),name:e.name,message:e.message,stack:e.stack};errors.push(record);console.error('ORBIT_PAGE_ERROR '+JSON.stringify(record));});
const suite=process.env.ORBIT_EXHAUSTIVE_SUITE||'anatomy-0';let reference=false;
const button=name=>page.getByRole('button',{name,exact:true});
const click=async name=>{await button(name).click();};
const read=async()=>page.evaluate(()=>({url:window.location.href,patientScenario:window.__orbitPatientKernel?.currentScenario?.id,viewport:[window.innerWidth,window.innerHeight],theme:document.querySelector('[data-simulator-root]')?.getAttribute('data-simulator-theme'),isolated:document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-isolated'),systems:document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-visible-atlas-systems'),eye:{...document.querySelector('[data-testid="eye-response-state"]')?.dataset},thorax:{...document.querySelector('.ausc-webgl')?.dataset},audioErrors:[...document.querySelectorAll('.ausc-error')].map(e=>e.textContent)}));
const shot=async name=>{console.log('Capture',reference?'vercel':'android',name);await page.screenshot({timeout:60000,path:resolve(out,(reference?'source-reference-':'cdp-android-')+name+'.png')});if(!reference)await writeFile(resolve(out,'android-'+name+'.png'),execFileSync('adb',['exec-out','screencap','-p'],{maxBuffer:20*1024*1024}));return read();};
const route=async(query,ref=false)=>{
 reference=ref;const path='/simulator?'+new URLSearchParams({...query,nativeTheme:'dark',native_audit:'1'});
 page=ref?referencePage:nativePage;
 if(ref)await page.goto(referenceOrigin+path,{waitUntil:'domcontentloaded'});
 else{
  execFileSync('adb',['shell','am','start','-n','com.aistudio.mbbsqbank.aycxvd.debug/com.aistudio.mbbsqbank.aycxvd.MainActivity','--es','orbit_anatomy_qa_route',"'"+path+"'",'--ez','orbit_anatomy_qa_reference','false'],{stdio:'pipe'});
  await page.waitForURL(url=>url.hostname==='appassets.androidplatform.net'&&Object.entries(query).every(([k,v])=>url.searchParams.get(k)===String(v)),{timeout:90000});
 }
 await page.locator('[data-simulator-root]').waitFor({timeout:60000});
 if(await button('Switch to dark theme').count())await button('Switch to dark theme').click();
};
// Thin cord sources have few colours even when their geometry is visible.
// Keep the general threshold unchanged for every other selection.
const thinCordTargets=new Set(['hra_spinal_cord_overview','hra_spinal_cord_cervical','hra_spinal_cord_thoracic','hra_spinal_cord_lumbar','hra_spinal_cord_sacral']);
const loaded=async()=>{
 const renderer=page.getByTestId('anatomy-renderer');await renderer.waitFor();
 await page.waitForFunction(()=>{const e=document.querySelector('[data-testid="anatomy-renderer"]');if(e?.querySelector('[role="alert"]'))throw Error(e.querySelector('[role="alert"]').textContent);return !!e?.querySelector('canvas')&&!/LOADING (?:BODYPARTS3D|Z-ANATOMY|HRA)/.test(e.textContent||'');},undefined,{timeout:180000});
 const selected=await renderer.getAttribute('data-isolated'),minimumColours=thinCordTargets.has(selected)?4:12;
 const canvas=renderer.locator('canvas');let pixels;
 for(let i=0;i<30;i++){
  pixels=await renderedPixels(canvas);
  assert.equal(pixels.error,0,'WebGL must not report an error');
  assert.equal(pixels.contextLost,false,'WebGL context must remain active');
  assert.deepEqual(pixels.viewport,[0,0,pixels.width,pixels.height],'Viewport must fit the drawing buffer');
  if(pixels.bright>40&&pixels.colours>minimumColours)return pixels;
  await page.waitForTimeout(500);
 }
 throw Error('Anatomy geometry did not meet visibility checks: '+JSON.stringify({selected,minimumColours,...pixels}));
};
async function renderedPixels(canvas){return canvas.evaluate(e=>new Promise(resolve=>requestAnimationFrame(()=>{
 const gl=e.getContext('webgl2')||e.getContext('webgl');if(!gl){resolve({error:'No WebGL context',bright:0,colours:0});return;}
 const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,p=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,p);let hash=2166136261,bright=0;const colours=new Set();
 for(let i=0;i<p.length;i+=16){hash=Math.imul(hash^p[i],16777619);hash=Math.imul(hash^p[i+1],16777619);hash=Math.imul(hash^p[i+2],16777619);if(p[i]+p[i+1]+p[i+2]>100&&p[i+3]>0)bright++;colours.add((p[i]>>3)*1024+(p[i+1]>>3)*32+(p[i+2]>>3));}
 resolve({hash:hash>>>0,bright,colours:colours.size,width:w,height:h,viewport:Array.from(gl.getParameter(gl.VIEWPORT)),contextLost:gl.isContextLost(),error:gl.getError()});
 })));}
async function contextOn(){if(await button('Show organ context').count())await click('Show organ context');}
async function drawerClose(){const d=page.getByTestId('organ-detail-drawer');if(await d.isVisible().catch(()=>false))await d.getByRole('button',{name:'Close',exact:true}).click();}
async function arrowEvidence(connection){
 await page.waitForFunction(id=>document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-isolated')===id,connection.id);
 const leaders=page.getByTestId('connection-leaders');await leaders.waitFor({timeout:20000});
 await page.getByTestId('anatomy-connection-callout').getByText(connection.label,{exact:true}).waitFor();await page.waitForTimeout(500);
 const tips=await leaders.locator('circle').evaluateAll(nodes=>nodes.map(n=>({x:Number(n.getAttribute('cx')),y:Number(n.getAttribute('cy'))})));
 assert(tips.length>0&&tips.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'Projected arrow tips must exist');
 return {id:connection.id,label:connection.label,sourcePartIds:connection.partIds,tips,...await read()};
}
async function anatomy(group){
 const owners=Object.keys(ORGAN_CONNECTIONS).filter((_,i)=>i%groups===group);
 const views=[{id:'whole-body',query:{mode:'anatomy'}},{id:'vessels',query:{mode:'anatomy',layer:'vascular'}},{id:'skeleton',query:{mode:'anatomy',layer:'skeletal'}},...coverage.organs.map(o=>({id:o.id,query:{mode:'anatomy',organ:o.id,isolate:o.preferredReference}}))].filter((_,i)=>i%groups===group).filter((_,i)=>i%partitionCount===partition);
 for(const view of views){
  const frames=[];for(const ref of [false,true]){await route(view.query,ref);await page.getByTestId('anatomy-renderer').locator('canvas').waitFor();await drawerClose();await loaded();await page.waitForTimeout(700);frames.push(await shot('overview-'+view.id));}
  checks.push({type:'overview',id:view.id,actualAndroidAndMobileChromiumVercel:frames});await persist();
 }
 for(const owner of owners){
  await route({mode:'anatomy',organ:owner,isolate:owner});await loaded();let d=page.getByTestId('organ-detail-drawer');await d.waitFor();
  for(const section of ['Supply','Relations']){
   await d.getByRole('tab',{name:section,exact:true}).click();await shot(owner+'-'+section.toLowerCase());
   const list=ORGAN_CONNECTIONS[owner].filter(c=>section==='Supply'?c.kind!=='relation':c.kind==='relation').filter(inPartition);
   for(const c of list){
    await page.getByTestId('inspect-'+c.id).click();
    if(!c.targetId){const region=page.getByRole('region',{name:c.label+' teaching diagram',exact:true});await region.waitFor();assert((await region.innerText()).includes('not a registered 3D mesh'));await region.getByRole('button',{name:'Close teaching diagram'}).click();checks.push({owner,id:c.id,type:'explicit-schematic',passed:true});}
    else{
     await d.waitFor({state:'hidden'});await loaded();if(c.kind!=='relation')assert.equal(await button('Hide organ context').getAttribute('aria-pressed'),'true','Organ context must be visible by default: '+c.id);const native=await arrowEvidence(c);await shot(c.id);
     // Exercise real camera drag while the selected mesh and its leaders remain.
     const model=page.getByTestId('anatomy-renderer');const box=await model.boundingBox();
     await page.mouse.move(box.x+box.width*.45,box.y+box.height*.55);await page.mouse.down();await page.mouse.move(box.x+box.width*.60,box.y+box.height*.58,{steps:6});await page.mouse.up();
     await arrowEvidence(c);
     if(c.id==='connection_19'){
      assert.equal(await button('Hide organ context').getAttribute('aria-pressed'),'true');assert((await read()).systems.split(',').includes('cardiac'),'Coronary artery must include heart geometry by default');await click('Hide organ context');await page.waitForFunction(()=>document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-visible-atlas-systems')==='arterial');await click('Show organ context');
     }
     // Match the user interaction on both surfaces. A synthetic connection URL
     // omits the parent context that the real dossier action carries.
     await route({mode:'anatomy',organ:owner,isolate:owner},true);await loaded();const referenceDrawer=page.getByTestId('organ-detail-drawer');await referenceDrawer.getByRole('tab',{name:section,exact:true}).click();await page.getByTestId('inspect-'+c.id).click();await referenceDrawer.waitFor({state:'hidden'});await loaded();await contextOn();const vercel=await arrowEvidence(c);await shot(c.id);
     checks.push({owner,id:c.id,type:'registered-view',passed:true,native,vercel});
     page=nativePage;reference=false;await click('Open selected structure anatomy details');d=page.getByTestId('organ-detail-drawer');await d.getByRole('tab',{name:section,exact:true}).click();
    }
    await persist();
   }
  }
 }
 const expectedConnections=owners.flatMap(o=>ORGAN_CONNECTIONS[o]).filter(inPartition).map(c=>c.id).sort();
 const actualConnections=checks.filter(c=>c.type==='registered-view'||c.type==='explicit-schematic').map(c=>c.id).sort();
 assert.deepEqual(actualConnections,expectedConnections,'Every assigned registered and schematic connection must be checked exactly once');
 assert.deepEqual(checks.filter(c=>c.type==='overview').map(c=>c.id).sort(),views.map(v=>v.id).sort(),'Every assigned overview must be checked');
}

async function brainRegistration(ref){
 for(const target of ZANATOMY_REFERENCE_TARGETS){
  await route({mode:'anatomy',organ:target.organKey,isolate:target.id},ref);await page.getByTestId('anatomy-renderer').locator('canvas').waitFor();await drawerClose();await loaded();await page.waitForTimeout(800);
  let bounds=null;
  if(target.modelKey==='brain_reference'){
   const expected=zAnatomyReferenceRegistrationNotice(target.id);
   if(expected){const notice=page.getByTestId('anatomy-source-notice');await notice.locator('summary').click();await notice.getByText(expected,{exact:true}).waitFor();await notice.locator('summary').click();}
   bounds=await page.getByTestId('anatomy-renderer').locator('canvas').evaluate(e=>new Promise(resolve=>requestAnimationFrame(()=>{
    const gl=e.getContext('webgl2')||e.getContext('webgl'),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,p=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,p);
    let minX=w,minY=h,maxX=-1,maxY=-1,count=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,r=p[i],g=p[i+1],b=p[i+2];if(g>r*1.12&&b>r*1.05&&g+b+r>100){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);count++;}}
    resolve({count,left:minX/w,right:maxX/w,bottom:minY/h,top:maxY/h,width:w,height:h});
   })));
   assert(bounds.count>100,'Brain must render visible source geometry');
   assert(bounds.left>.02&&bounds.right<.98&&bounds.bottom>.12&&bounds.top<.88,'Brain must fit in the visible camera, not offscreen: '+JSON.stringify(bounds));
  }
  await shot(target.id);checks.push({type:'reference-registration',id:target.id,reference:ref,passed:true,bounds,notice:zAnatomyReferenceRegistrationNotice(target.id),state:await read()});await persist();
 }
}

async function anatomyControls(ref){
 await route({mode:'anatomy'},ref);await loaded();await drawerClose();
 for(const system of coverage.systems){
  await click('Browse');await page.getByLabel('Filter regional anatomy by system',{exact:true}).selectOption(system.id);
  const first=page.locator('[aria-label="Regional structures"] button').first();await first.waitFor();const label=await first.innerText();await first.click();await loaded();
  await page.waitForFunction(()=>!!document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-isolated'));
  const observed=await read();assert(system.structures.some(p=>p.id===observed.isolated||'atlas:'+p.id===observed.isolated),'Browser selection must belong to '+system.id+': '+observed.isolated);
  await shot('system-'+system.id);checks.push({type:'system-browser-selection',system:system.id,label,reference:ref,state:observed});await persist();
 }
 await click('Reset');await loaded();const canvas=page.getByTestId('anatomy-renderer').locator('canvas');await canvas.scrollIntoViewIfNeeded();const before=await hash(canvas);
 await click('Zoom anatomy in');await page.waitForTimeout(700);await canvas.scrollIntoViewIfNeeded();assert.notEqual(await hash(canvas),before,'Zoom must change the rendered anatomy');await click('Zoom anatomy out');
 const spread=page.locator('[data-testid="anatomy-spread"]:visible');await spread.focus();await spread.press('End');assert.equal(await spread.inputValue(),'1');await page.waitForTimeout(700);await shot('spread-full');await click('Reassemble anatomy');assert.equal(await spread.inputValue(),'0');
 await click('Layers');const toolbar=page.locator('[data-testid="dissection-toolbar"]:visible');
 for(const name of ['left','up','down','right'])await click('Pan anatomy '+name);
 const quality=page.getByLabel('Anatomy image quality',{exact:true});await quality.selectOption('smooth');assert.equal(await quality.inputValue(),'smooth');await quality.selectOption('crisp');
 const xray=toolbar.getByTestId('dissection-xray');const prior=await xray.getAttribute('aria-pressed');await xray.click();assert.notEqual(await xray.getAttribute('aria-pressed'),prior);await xray.click();
 const peel=toolbar.getByTestId('dissection-depth');await peel.focus();await peel.press('End');assert.equal(await peel.inputValue(),'1');await page.waitForTimeout(700);await shot('depth-peel-skeleton');await peel.press('Home');assert.equal(await peel.inputValue(),'0');
 for(const mode of ['scalpel','isolate','inspect']){const control=toolbar.getByTestId('dissection-mode-'+mode);await control.click();assert.equal(await control.getAttribute('aria-pressed'),'true');}
 await click('Close anatomy tools');await click('Reset');
 // Remove a named source mesh using the real dossier action, then restore it.
 await click('Browse');await page.getByLabel('Filter regional anatomy by system',{exact:true}).selectOption('skeletal');await page.locator('[aria-label="Regional structures"] button').first().click();
 await click('Open selected structure anatomy details');const drawer=page.getByTestId('organ-detail-drawer');await drawer.getByRole('button',{name:'Dissect',exact:true}).click();await drawerClose();await click('Layers');
 const tray=page.locator('[data-testid="dissection-tray"]:visible');assert.match(await tray.innerText(),/Cut \(1\)/);await page.locator('[title="Undo last dissected structure (Ctrl+Z)"]:visible').click();assert.match(await tray.innerText(),/Cut \(0\)/);
 await click('Close anatomy tools');await click('Reset');await shot('controls-restored');
 if(!ref){
  try{
   execFileSync('adb',['shell','svc','wifi','disable']);execFileSync('adb',['shell','svc','data','disable']);
   await page.waitForFunction(()=>!navigator.onLine,undefined,{timeout:30000});
   await route({mode:'anatomy',offline_test:'1'});await loaded();await shot('cached-anatomy-offline');checks.push({type:'cached-anatomy-offline',passed:true,state:await read()});
  }finally{
   execFileSync('adb',['shell','svc','wifi','enable']);execFileSync('adb',['shell','svc','data','enable']);await page.waitForFunction(()=>navigator.onLine,undefined,{timeout:60000});
  }
 }
 checks.push({type:'anatomy-controls',reference:ref,zoom:true,spread:true,pan:true,quality:true,xray:true,peel:true,modes:true,dissectAndUndo:true});await persist();
}
async function setPressed(name,value){const b=button(name);if((await b.getAttribute('aria-pressed')==='true')!==value)await b.click();}
async function hash(locator){
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
async function pocusPixels(){return page.getByTestId('pocus-canvas').evaluate(e=>{
 const ctx=e.getContext('2d');const pixels=ctx.getImageData(0,0,e.width,e.height).data;let hash=2166136261;let bright=0;
 for(let i=0;i<pixels.length;i+=4){hash=Math.imul(hash^pixels[i],16777619);hash=Math.imul(hash^pixels[i+1],16777619);if(pixels[i]+pixels[i+1]+pixels[i+2]>100)bright++;}
 return {hash:hash>>>0,bright};
});}
async function advanced(kind,ref){
 const tool={eye:'pupil',pocus:'ultrasound',general:'piccled',auscultation:'stethoscope','auscultation-case':'stethoscope'}[kind];
 await route({tool,scenario:kind==='auscultation-case'?'stemi':'normal'},ref);
 if(kind==='eye'){
  await page.waitForFunction(()=>document.querySelector('[data-testid="eye-head-view"]')?.getAttribute('data-render-state')==='ready',undefined,{timeout:180000});
  await click('Patient’s right');assert(Number((await read()).eye.rightX)<-.5);await shot('eye-gaze-right');await click('Centre');await click('🔦 Penlight');await click('Right eye penlight');
  await page.waitForFunction(()=>Number(document.querySelector('[data-testid="eye-response-state"]')?.dataset.rightPupil)<3);
  await shot('eye-penlight');const lit=Number((await read()).eye.rightPupil);await click('Turn penlight off');assert(Number((await read()).eye.rightPupil)>lit);await click('🪶 Cotton');await click('Touch right cornea');await click('Reset examination');await shot('eye-reset');
 }else if(kind==='auscultation'||kind==='auscultation-case'){
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.ausc-webgl')).visibility==='visible',undefined,{timeout:180000});
  if(kind==='auscultation-case'&&!ref)assert.equal((await read()).patientScenario,'stemi','Native selected case must reach the bedside renderer');if(kind==='auscultation')await click('Normal S1 / S2');else await click('Place Stethoscope & Listen Live');await button('Stop Stethoscope').waitFor();
  assert.deepEqual((await read()).audioErrors,[]);if(kind==='auscultation-case'){const footer=await page.locator('.ausc-footer').innerText();const hr=Number(footer.match(/(\d+) bpm/)?.[1]);assert(hr>0&&hr<65,'STEMI patient bradycardia must reach auscultation: '+footer);}await shot(kind+'-heart');await click('Bell · low pitch');await setPressed('X-ray view',true);
  const motion=page.getByRole('button',{name:/^(Show|Pause) organ movement$/});if(await motion.getAttribute('aria-pressed')!=='false')await motion.click();
  const canvas=page.locator('.ausc-webgl canvas');await canvas.scrollIntoViewIfNeeded();await page.waitForTimeout(500);
  const still=[await hash(canvas),await hash(canvas)];assert.equal(still[0],still[1],'Paused thorax must hold its image');
  await motion.click();await canvas.scrollIntoViewIfNeeded();const frames=[];for(let i=0;i<12;i++){frames.push(await hash(canvas));await page.waitForTimeout(180);}
  assert(new Set(frames).size>1,'Enabled organ motion must change actual Android canvas pixels');await shot(kind+'-motion');
  await click('View back');await shot(kind+'-back');await click('Normal breath sounds');await shot(kind+'-lungs');await click('Stop Stethoscope');
 }else if(kind==='pocus'){
  const canvas=page.getByTestId('pocus-canvas');await canvas.waitFor();await canvas.scrollIntoViewIfNeeded();for(let i=0;i<60&&(await pocusPixels()).bright<50;i++)await page.waitForTimeout(250);assert((await pocusPixels()).bright>50,'The actual scan must draw anatomy');await shot('pocus-live');await click('Freeze');const frozen=(await pocusPixels()).hash;await page.waitForTimeout(1000);assert.equal((await pocusPixels()).hash,frozen);await click('Unfreeze');const a=(await pocusPixels()).hash;for(let i=0;i<30&&(await pocusPixels()).hash===a;i++)await page.waitForTimeout(200);assert.notEqual((await pocusPixels()).hash,a,'Live scan must resume');await click('M-Mode');await shot('pocus-mmode');
  for(const name of ['Ultrasound gain','Ultrasound depth']){const s=page.getByLabel(name,{exact:true});const before=await s.inputValue();await s.focus();await page.keyboard.press('ArrowRight');assert.notEqual(await s.inputValue(),before);}
  await click('Reference scans');await shot('pocus-reference');await click('Case simulation');
 }else if(kind==='general'){
  await page.getByLabel('Press shin',{exact:true}).waitFor();await page.getByLabel('Edema findings',{exact:true}).selectOption('3');const stage=page.getByLabel('Press shin',{exact:true});await stage.scrollIntoViewIfNeeded();const b=await stage.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.waitForTimeout(5500);await page.mouse.up();await shot('edema-after-hold');assert(Number((await page.getByTestId('edema-depth').innerText()).replace(' mm',''))>4,'Five-second compression must produce a pit in grade 3');const depth=Number((await page.getByTestId('edema-depth').innerText()).replace(' mm',''));await page.waitForTimeout(1000);assert(Number((await page.getByTestId('edema-depth').innerText()).replace(' mm',''))<depth,'Released pit must recover');
  for(const id of ['ward-tab-icterus','ward-tab-pallor','ward-tab-ascites']){
   await page.getByTestId(id).click();
   if(id==='ward-tab-icterus'){
    await page.waitForFunction(()=>document.querySelector('[data-testid="eye-head-view"]')?.getAttribute('data-render-state')==='ready',undefined,{timeout:180000});
    await page.getByLabel('Scleral findings',{exact:true}).selectOption('yellow');await page.waitForFunction(()=>Number(document.querySelector('[data-testid="scleral-stage"]')?.getAttribute('data-tint'))>.5);
    await click('Look straight');await button('Look down').waitFor();await click('Look down');await click('Release upper lids');await click('Elevate upper lids');
    await page.getByTestId('scleral-stage').scrollIntoViewIfNeeded();await page.waitForTimeout(700);
   }
   await shot(id);
  }
  const tilt=page.getByRole('button',{name:/Roll Patient to 45° Lateral Decubitus/});await tilt.click();const tilted=page.getByRole('button',{name:/Patient in 45° Lateral Tilt/});await tilted.waitFor();await tilted.click();
 }
 checks.push({suite:kind,reference:ref,passed:true,state:await read()});await persist();
}
async function persist(){await writeFile(resolve(out,'actual-android-exhaustive.json'),JSON.stringify({status:failures.length?'FAILED':'IN_PROGRESS',suite,partition:{index:partition,count:partitionCount},platform:'installed Android WebView; corrected canonical source in mobile Chromium at matching viewport',referenceOrigin,checks,failures,errors},null,2));}
try{
 if(suite==='brain-registration')for(const ref of [false,true])await brainRegistration(ref);else if(suite==='anatomy-controls')for(const ref of [false,true])await anatomyControls(ref);else if(suite.startsWith('anatomy-'))await anatomy(Number(suite.split('-')[1]));else for(const ref of [false,true])await advanced(suite,ref);
 assert.deepEqual(errors,[]);await persist();await writeFile(resolve(out,'PASSED.json'),JSON.stringify({suite,partition:{index:partition,count:partitionCount},checks:checks.length,passed:true}));
}catch(e){failures.push({message:e.message,stack:e.stack,state:await read().catch(()=>null)});await shot('FAILURE').catch(()=>{});await persist();throw e;}
finally{await device.close();await browser.close();}
