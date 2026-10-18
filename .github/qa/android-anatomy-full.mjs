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
import { HRA_HEART_TARGETS } from '../../src/simulator/data/hraHeart.ts';
import { HRA_ORGAN_TARGETS } from '../../src/simulator/data/hraOrgans.ts';
const referenceOrigin=process.env.ORBIT_REFERENCE_ORIGIN||'https://orbitmbbs.vercel.app';
const out=resolve(process.env.ORBIT_SCREENSHOT_OUT||'artifacts/native-exhaustive');await mkdir(out,{recursive:true});
const coverage=JSON.parse(await readFile(resolve(out,'anatomy-coverage.json'),'utf8'));
const repairedLiverIds=new Set(['connection_122','connection_246','connection_262','connection_274']);
const contextConnections=Object.values(ORGAN_CONNECTIONS).flat();
const sourceTargets=[...ZANATOMY_REFERENCE_TARGETS.map(t=>({...t,family:'zanatomy'})),...HRA_HEART_TARGETS.map(t=>({...t,organKey:'heart',family:'hra-heart'})),...HRA_ORGAN_TARGETS.map(t=>({...t,family:'hra-organ'}))];
const overviewTasks=[
 {id:'layer-glass',query:{mode:'anatomy',layer:'glass'}},
 {id:'layer-vascular',query:{mode:'anatomy',layer:'vascular'},systems:['arterial','cardiac','venous']},
 {id:'layer-skeletal',query:{mode:'anatomy',layer:'skeletal'},systems:['skeletal']},
 {id:'layer-skin',query:{mode:'anatomy',layer:'skin'},systems:['integumentary']},
 {id:'layer-viscera',query:{mode:'anatomy',layer:'viscera'},allowed:['cardiac','digestive','endocrine','lymphatic','nervous','reproductive','respiratory','sensory','urinary']},
];
overviewTasks.push(...coverage.organs.map(o=>({id:o.id,query:{mode:'anatomy',organ:o.id,isolate:o.preferredReference}})));
assert.equal(contextConnections.length,430);assert.equal(contextConnections.filter(c=>c.targetId).length,237);assert.equal(sourceTargets.length,155);assert.equal(overviewTasks.length,41);
const contextTasks=[...contextConnections.map(c=>c.id),...sourceTargets.map(t=>t.id),...overviewTasks.map(t=>'overview:'+t.id)];
const contextPart=Number(process.env.ORBIT_CONTEXT_PARTITION||0),contextParts=Number(process.env.ORBIT_CONTEXT_PARTS||32);
assert(Number.isInteger(contextPart)&&contextPart>=0&&contextPart<contextParts);
// Keep an owner/model together so every selection is exercised in a lived-in scene.
const taskGroups=[
 ...Object.entries(ORGAN_CONNECTIONS).map(([owner,cs])=>({key:'owner:'+owner,ids:cs.map(c=>c.id),weight:4+cs.reduce((n,c)=>n+(c.targetId?3:1),0)})),
 ...[...new Set(sourceTargets.map(t=>t.family+':'+t.organKey))].map(key=>{const ids=sourceTargets.filter(t=>t.family+':'+t.organKey===key).map(t=>t.id);return{key:'source:'+key,ids,weight:4+ids.length*3};}),
 ...overviewTasks.map(t=>({key:'overview:'+t.id,ids:['overview:'+t.id],weight:2})),
];
const assignments=new Map(),weights=Array(contextParts).fill(0);
for(const group of taskGroups.sort((a,b)=>b.weight-a.weight||a.key.localeCompare(b.key))){
 const part=weights.indexOf(Math.min(...weights));for(const id of group.ids){assert(!assignments.has(id));assignments.set(id,part);}weights[part]+=group.weight;
}
assert.deepEqual([...assignments.keys()].sort(),[...contextTasks].sort());
const auditSubset=process.env.ORBIT_AUDIT_TASKS?new Set(process.env.ORBIT_AUDIT_TASKS.split(',')):null;
if(auditSubset)for(const id of auditSubset)assert(contextTasks.includes(id),'Unknown requested smoke target: '+id);
const contextAssigned=id=>assignments.get(id)===contextPart&&(!auditSubset||auditSubset.has(id));
assert.equal(contextTasks.length,626);assert.equal(new Set(contextTasks).size,contextTasks.length);
if(process.env.ORBIT_AUDIT_PLAN_ONLY==='1'){console.log(JSON.stringify({connections:430,registered:237,schematics:193,references:155,overviews:41,total:contextTasks.length,partitions:contextParts,assigned:contextTasks.filter(contextAssigned)}));process.exit(0);}
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
const blockedExternalRequests=[];
await webContext.route(/https:\/\/(?:[^/]+\.)?(?:googlesyndication\.com|doubleclick\.net|googleadservices\.com)\//,async route=>{blockedExternalRequests.push(route.request().url());await route.abort();});
const checks=[],failures=[],errors=[];for(const surface of [nativePage,referencePage])surface.on('pageerror',e=>{const record={surface:surface===nativePage?'android':'vercel',url:surface.url(),at:new Date().toISOString(),name:e.name,message:e.message,stack:e.stack};errors.push(record);console.error('ORBIT_PAGE_ERROR '+JSON.stringify(record));});
let completed=false;
const suite=process.env.ORBIT_EXHAUSTIVE_SUITE||'anatomy-0';let reference=false;
const button=name=>page.getByRole('button',{name,exact:true});
const click=async name=>{await button(name).click();};
const read=async()=>page.evaluate(()=>({url:window.location.href,patientScenario:window.__orbitPatientKernel?.currentScenario?.id,viewport:[window.innerWidth,window.innerHeight],theme:document.querySelector('[data-simulator-root]')?.getAttribute('data-simulator-theme'),isolated:document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-isolated'),systems:document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-visible-atlas-systems'),eye:{...document.querySelector('[data-testid="eye-response-state"]')?.dataset},thorax:{...document.querySelector('.ausc-webgl')?.dataset},audioErrors:[...document.querySelectorAll('.ausc-error')].map(e=>e.textContent)}));
const shot=async name=>{console.log('Capture',reference?'vercel':'android',name);await writeFile(resolve(out,(reference?'vercel-':'android-')+name+'-gl.json'),JSON.stringify(await glDiagnostics(),null,2));if(reference)await page.screenshot({timeout:60000,path:resolve(out,'source-reference-'+name+'.png')});if(!reference)await writeFile(resolve(out,'android-'+name+'.png'),execFileSync('adb',['exec-out','screencap','-p'],{maxBuffer:20*1024*1024}));return read();};
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
const loaded=async()=>{await page.getByTestId('anatomy-renderer').waitFor();await page.waitForFunction(()=>{const e=document.querySelector('[data-testid="anatomy-renderer"]');if(e?.querySelector('[role="alert"]'))throw Error(e.querySelector('[role="alert"]').textContent);return !!e?.querySelector('canvas')&&!/LOADING (?:BODYPARTS3D|Z-ANATOMY|HRA)/.test(e.textContent||'');},undefined,{timeout:180000});const canvas=page.getByTestId('anatomy-renderer').locator('canvas');let pixels;for(let i=0;i<30;i++){pixels=await renderedPixels(canvas);if(pixels.bright>40&&pixels.colours>12){await page.waitForFunction(()=>{const c=document.querySelector('[data-testid="anatomy-renderer"] canvas'),gl=c?.getContext('webgl2')||c?.getContext('webgl');if(!gl)return false;const v=gl.getParameter(gl.VIEWPORT);return v[0]===0&&v[1]===0&&Math.abs(v[2]-gl.drawingBufferWidth)<=1&&Math.abs(v[3]-gl.drawingBufferHeight)<=1;},undefined,{timeout:20000});return;}await page.waitForTimeout(500);}throw Error('Anatomy geometry has no visible rendered pixels: '+JSON.stringify(pixels));};
async function renderedPixels(canvas){return canvas.evaluate(e=>new Promise(resolve=>requestAnimationFrame(()=>{
 const gl=e.getContext('webgl2')||e.getContext('webgl');if(!gl){resolve({error:'No WebGL context',bright:0,colours:0});return;}
 const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,p=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,p);let hash=2166136261,bright=0;const colours=new Set();
 for(let i=0;i<p.length;i+=16){hash=Math.imul(hash^p[i],16777619);hash=Math.imul(hash^p[i+1],16777619);hash=Math.imul(hash^p[i+2],16777619);if(p[i]+p[i+1]+p[i+2]>100&&p[i+3]>0)bright++;colours.add((p[i]>>3)*1024+(p[i+1]>>3)*32+(p[i+2]>>3));}
 resolve({hash:hash>>>0,bright,colours:colours.size,width:w,height:h,contextLost:gl.isContextLost(),error:gl.getError()});
 })));}
async function contextOn(){if(await button('Show organ context').count())await click('Show organ context');}
async function drawerClose(){const d=page.getByTestId('organ-detail-drawer');if(await d.isVisible().catch(()=>false))await d.getByRole('button',{name:'Close',exact:true}).click();}
async function arrowEvidence(connection){
 await page.waitForFunction(id=>document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-isolated')===id,connection.id);
 const leaders=page.getByTestId('connection-leaders');await leaders.waitFor({timeout:20000});
 await page.getByTestId('anatomy-connection-callout').getByText(connection.label,{exact:true}).waitFor();await page.waitForTimeout(500);
 const tips=await leaders.locator('circle').evaluateAll(nodes=>nodes.map(n=>({x:Number(n.getAttribute('cx')),y:Number(n.getAttribute('cy'))})));
 const bounds=await page.getByTestId('anatomy-renderer').boundingBox();
 assert(tips.length>0&&tips.length<=3&&tips.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=8&&p.x<=bounds.width-8&&p.y>=72&&p.y<=bounds.height-80),'Projected arrow tips must remain inside the rendered viewport');
 assert.equal(await page.getByTestId('anatomy-connection-callout').getAttribute('data-connection'),connection.id,'Arrow layer must belong to the selected connection');
 return {id:connection.id,label:connection.label,sourcePartIds:connection.partIds,tips,...await read()};
}
async function glDiagnostics(){
 return page.getByTestId('anatomy-renderer').locator('canvas').evaluate(e=>{
  const gl=e.getContext('webgl2')||e.getContext('webgl'),program=gl.getParameter(gl.CURRENT_PROGRAM);
  const uniforms={};if(program)for(const name of ['projectionMatrix','modelViewMatrix']){const u=gl.getUniformLocation(program,name);uniforms[name]=u?Array.from(gl.getUniform(program,u)):null;}
  return {canvas:{width:e.width,height:e.height,clientWidth:e.clientWidth,clientHeight:e.clientHeight,rect:e.getBoundingClientRect().toJSON()},drawingBuffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],viewport:Array.from(gl.getParameter(gl.VIEWPORT)),dpr:devicePixelRatio,visualViewport:visualViewport?{scale:visualViewport.scale,width:visualViewport.width,height:visualViewport.height}:null,contextLost:gl.isContextLost(),error:gl.getError(),uniforms};
 });
}

async function geometryFrame(connection=null,attempt=0){
 const bounds=await page.getByTestId('anatomy-renderer').locator('canvas').evaluate(e=>new Promise(resolve=>requestAnimationFrame(()=>{
  const gl=e.getContext('webgl2')||e.getContext('webgl'),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,p=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,p);
  let minX=w,minY=h,maxX=-1,maxY=-1,count=0,blue=0,red=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,r=p[i],g=p[i+1],b=p[i+2];if(b>r*1.5&&b>g*1.3&&b>80)blue++;if(r>g*2.5&&r>b*1.7&&r>100)red++;if(r+g+b>80&&Math.abs(r-7)+Math.abs(g-11)+Math.abs(b-20)>30){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);count++;}}
  resolve({count,blue,red,left:minX/w,right:maxX/w,bottom:minY/h,top:maxY/h,width:w,height:h});
 })));
 assert(bounds.count>100,'Visible registered geometry is required');
 assert(bounds.left>.02&&bounds.right<.98&&bounds.bottom>.10&&bounds.top<.90,'Visible context and selected structure must fit; the camera cannot sit inside the organ: '+JSON.stringify(bounds));
 if(connection&&connection.kind!=='relation'){
  const selectedColour=connection.kind==='venous'?bounds.blue:bounds.red;
  if(selectedColour===0&&attempt<20){await page.waitForTimeout(250);return geometryFrame(connection,attempt+1);}
  assert(selectedColour>0,connection.id+' selected vessel must remain visible through context: '+JSON.stringify(bounds));
 }
 return bounds;
}
async function contextFraming(){
 for(const owner of Object.keys(ORGAN_CONNECTIONS)){
  const assigned=contextConnections.filter(c=>c.owner===owner&&contextAssigned(c.id));if(!assigned.length)continue;
  for(const ref of [false,true]){await route({mode:'anatomy',organ:owner,isolate:owner},ref);await loaded();await page.getByTestId('organ-detail-drawer').waitFor();}
  for(const c of assigned){
   const records=[];
   for(const ref of [false,true]){
    page=ref?referencePage:nativePage;reference=ref;const d=page.getByTestId('organ-detail-drawer');await d.waitFor();
    await d.getByRole('tab',{name:c.kind==='relation'?'Relations':'Supply',exact:true}).click();await page.getByTestId('inspect-'+c.id).click();
    if(!c.targetId){
     const region=page.getByRole('region',{name:c.label+' teaching diagram',exact:true});await region.waitFor();
     assert((await region.innerText()).includes('not a registered 3D mesh'),'Missing source geometry must be disclosed');
     assert.equal(c.partIds.length,0,'A schematic must not claim registered source IDs');
     records.push({explicitSchematic:true,text:await region.innerText(),...await shot(c.id)});
     await region.getByRole('button',{name:'Close teaching diagram'}).click();continue;
    }
    await d.waitFor({state:'hidden'});await loaded();
    if(c.kind!=='relation')assert.equal(await button('Hide organ context').getAttribute('aria-pressed'),'true','Visible owner context is the default');
    if(c.kind!=='relation'&&['heart','lad_artery','rca_artery'].includes(c.owner))assert((await read()).systems.split(',').includes('cardiac'),'Coronary vessels must start with heart context');
    const state=await arrowEvidence(c),frame=await geometryFrame(c);await shot(c.id);records.push({...state,frame});
    if(repairedLiverIds.has(c.id))assert.equal(c.partIds.length,10,'Liver selection requires all registered parenchyma pieces');
    if(c.kind!=='relation'){
     await click('Hide organ context');assert.equal(await button('Show organ context').getAttribute('aria-pressed'),'false');await loaded();await arrowEvidence(c);await shot(c.id+'-context-hidden');
     await click('Show organ context');assert.equal(await button('Hide organ context').getAttribute('aria-pressed'),'true');await geometryFrame(c);
    }
    const modelBox=await page.getByTestId('anatomy-renderer').boundingBox();
    await page.mouse.move(modelBox.x+modelBox.width*.45,modelBox.y+modelBox.height*.55);await page.mouse.down();await page.mouse.move(modelBox.x+modelBox.width*.60,modelBox.y+modelBox.height*.58,{steps:6});await page.mouse.up();
    await arrowEvidence(c);
    await click('Open selected structure anatomy details');await d.waitFor();
   }
   checks.push({type:c.targetId?'registered-view':'explicit-schematic',id:c.id,owner,passed:true,native:records[0],vercel:records[1]});await persist();
  }
 }
 for(const ref of [false,true])await brainRegistration(ref);
 for(const task of overviewTasks.filter(t=>contextAssigned('overview:'+t.id))){
  const frames=[];
  for(const ref of [false,true]){await route(task.query,ref);await loaded();await drawerClose();await page.waitForTimeout(700);const state=await shot('overview-'+task.id);const visible=state.systems.split(',').sort();if(task.systems)assert.deepEqual(visible,[...task.systems].sort(),'Named layer must render its actual systems');if(task.allowed)assert(visible.length>0&&visible.every(s=>task.allowed.includes(s)),'Viscera layer cannot show unrelated body systems');frames.push(state);}
  checks.push({type:'overview',id:'overview:'+task.id,passed:true,native:frames[0],vercel:frames[1]});await persist();
 }
 const expected=contextTasks.filter(contextAssigned).sort(),actual=[...new Set(checks.map(c=>c.id))].sort();assert.deepEqual(actual,expected,'Every assigned connection/source/overview must be captured');
 assert.equal(checks.length,contextConnections.filter(c=>contextAssigned(c.id)).length+overviewTasks.filter(t=>contextAssigned('overview:'+t.id)).length+sourceTargets.filter(t=>contextAssigned(t.id)).length*2);
}

async function jointImageEvidence(id){
 const box=await page.getByTestId('anatomy-renderer').locator('canvas').boundingBox();
 const viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
 let webviewBounds=null;
 if(!reference){
  webviewBounds=JSON.parse(execFileSync('python3',['-c',`
import sys,json,re
sys.path.insert(0,'mobile/scripts')
from native_screenshot_driver import dump_ui
nodes=[n for n in dump_ui().iter('node') if n.get('class')=='android.webkit.WebView']
rects=[list(map(int,re.findall(r'-?\\d+',n.get('bounds','')))) for n in nodes]
rects=[r for r in rects if len(r)==4]
assert rects,'Real native WebView bounds required'
print(json.dumps(max(rects,key=lambda r:(r[2]-r[0])*(r[3]-r[1]))))
`],{env:{...process.env,ORBIT_UI_HELPER:'1'}}).toString());
 }
 const prefix=reference?'source-reference-':'android-';
 const payload={path:resolve(out,prefix+id+'.png'),box,viewport,webviewBounds,crop:resolve(out,prefix+id+'-canvas.png')};
 const result=JSON.parse(execFileSync('python3',['-c',`
import sys,json
from PIL import Image
p=json.loads(sys.argv[1]);im=Image.open(p['path']).convert('RGB');b=p['box'];v=p['viewport'];r=p['webviewBounds']
sx=((r[2]-r[0]) if r else im.width)/v['width'];sy=((r[3]-r[1]) if r else im.height)/v['height'];ox=r[0] if r else 0;oy=r[1] if r else 0
crop=im.crop((round(ox+b['x']*sx),round(oy+b['y']*sy),round(ox+(b['x']+b['width'])*sx),round(oy+(b['y']+b['height'])*sy)));crop.save(p['crop']);w,h=crop.size
points=[(x,y) for y in range(int(h*.28),int(h*.77)) for x in range(int(w*.025),int(w*.975)) if (lambda c:c[1]>=c[0] and c[2]>c[0]*.9 and c[1]>100 and c[2]>100)(crop.getpixel((x,y)))]
print(json.dumps({'count':len(points),'fraction':len(points)/(w*h),'left':min((x/w for x,y in points),default=1),'right':max((x/w for x,y in points),default=0),'width':w,'height':h,'webviewBounds':r}))
`,JSON.stringify(payload)]).toString());
 assert(result.fraction>.005&&result.right-result.left>.2,'Joint source geometry must be readable in the real compositor image: '+JSON.stringify(result));
 assert(!/HuBMAP Human Reference Atlas/.test(await page.getByTestId('anatomy-renderer').innerText()),'Z-Anatomy joint cannot inherit an HRA source banner');
 return result;
}


async function brainRegistration(ref){
 let currentOverview=null;
 for(const target of sourceTargets.filter(t=>contextAssigned(t.id))){
  const first=target.family==='hra-heart'?HRA_HEART_TARGETS[0]:target.family==='hra-organ'?HRA_ORGAN_TARGETS.find(t=>t.organKey===target.organKey):ZANATOMY_REFERENCE_TARGETS.find(t=>t.modelKey===target.modelKey&&t.matchAll)||target;
  if(currentOverview!==first.id){await route({mode:'anatomy',organ:target.organKey,isolate:first.id},ref);await loaded();await drawerClose();currentOverview=first.id;}
  else {page=ref?referencePage:nativePage;reference=ref;}
  {
   await page.getByTitle(target.label,{exact:true}).click();
   await page.getByTestId('anatomy-renderer').locator('canvas').scrollIntoViewIfNeeded();
   await page.waitForFunction(id=>document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-isolated')===id,target.id);
   await loaded();
  }
  await page.waitForTimeout(800);
  if(target.kind==='schematic')assert(/schematic/i.test(await page.getByTestId('anatomy-renderer').innerText()),'Derived source overlay must be labelled schematic');
  let bounds=null;
  if(target.modelKey==='brain_reference'){
   const expected=zAnatomyReferenceRegistrationNotice(target.id);
   if(expected)await page.getByText(expected,{exact:true}).waitFor();
   bounds=await page.getByTestId('anatomy-renderer').locator('canvas').evaluate(e=>new Promise(resolve=>requestAnimationFrame(()=>{
    const gl=e.getContext('webgl2')||e.getContext('webgl'),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,p=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,p);
    let minX=w,minY=h,maxX=-1,maxY=-1,count=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,r=p[i],g=p[i+1],b=p[i+2];if(g>r*1.12&&b>r*1.05&&g+b+r>100){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);count++;}}
    resolve({count,left:minX/w,right:maxX/w,bottom:minY/h,top:maxY/h,width:w,height:h});
   })));
   assert(bounds.count>100,'Brain must render visible source geometry');
   assert(bounds.left>.02&&bounds.right<.98&&bounds.bottom>.12&&bounds.top<.88,'Brain must fit in the visible camera, not offscreen: '+JSON.stringify(bounds));
  }
  await shot(target.id);const jointEvidence=['za_knee_joint','za_hip_joint','za_shoulder_joint'].includes(target.id)?await jointImageEvidence(target.id):null;checks.push({jointEvidence,type:'reference-registration',id:target.id,family:target.family,reference:ref,passed:true,bounds,notice:zAnatomyReferenceRegistrationNotice(target.id),state:await read()});await persist();
 }
}

async function persist(){await writeFile(resolve(out,'actual-android-exhaustive.json'),JSON.stringify({status:failures.length?'FAILED':completed?'PASSED':'IN_PROGRESS',suite,partition:{index:contextPart,count:contextParts},platform:'installed Android WebView; corrected canonical source in mobile Chromium at matching viewport',referenceOrigin,scope:auditSubset?'repair-smoke':'full626',requestedTasks:auditSubset?[...auditSubset]:null,candidateSource:"9a89f4bb25f2a23a19fdc4d637c982def7f322bb",blockedExternalRequests,checks,failures,errors},null,2));}
try{
 assert.equal(suite,'context-framing');await contextFraming();
 assert.deepEqual(errors,[]);completed=true;await persist();await writeFile(resolve(out,'PASSED.json'),JSON.stringify({suite,partition:{index:contextPart,count:contextParts},checks:checks.length,passed:true}));
}catch(e){failures.push({message:e.message,stack:e.stack,state:await read().catch(()=>null)});await writeFile(resolve(out,'failure-gl.json'),JSON.stringify(await glDiagnostics().catch(()=>null),null,2));await shot('FAILURE').catch(()=>{});await persist();throw e;}
finally{await device.close();await browser.close();}


