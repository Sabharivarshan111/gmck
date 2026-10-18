// Capture the CURRENT deployed application. No preview fixtures, UI rewriting,
// invented screenshots, authenticated user account or production data writes.
const {chromium} = require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const OUT=path.resolve('artifacts/marketing-current');
const ORIGIN='https://www.orbitmbbs.site';
(async()=>{
 await fs.mkdir(OUT,{recursive:true});
 const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:3,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await context.addInitScript(()=>{
  // A local, unsigned-in study profile; no cloud account or fabricated progress.
  if(!localStorage.getItem('orbit-profile-v1'))localStorage.setItem('orbit-profile-v1',JSON.stringify({display_name:'Student',year:'second',university:'tnmgr'}));
  localStorage.setItem('orbit:tour-v1',JSON.stringify({seen:1}));
  localStorage.setItem('orbit-install-dismissed',String(Date.now()));
 });
 const page=await context.newPage();
 const manifest={capturedAt:new Date().toISOString(),source:'current live ORBIT web app, mobile viewport; not Android APK screenshots',viewport:{width:393,height:852},deviceScaleFactor:3,shots:[]};
 async function open(route){await page.goto(ORIGIN+route,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForTimeout(4500);}
 async function shot(name){await page.screenshot({path:path.join(OUT,name+'.png')});await fs.writeFile(path.join(OUT,name+'.txt'),await page.locator('body').innerText());manifest.shots.push({name,url:page.url(),capturedAt:new Date().toISOString()});}
 async function step(name,fn){try{await fn();console.log('CAPTURED',name);}catch(e){console.error('FAILED',name,e.message);await page.screenshot({path:path.join(OUT,name+'-error.png')}).catch(()=>{});await fs.writeFile(path.join(OUT,name+'-error.txt'),e.stack+'\n'+await page.locator('body').innerText().catch(()=>''));manifest.shots.push({name,error:e.message});}}
 await step('home',async()=>{await open('/');await shot('home');});
 await step('questions',async()=>{await open('/browse/second-year/pathology,paper-1,cell-injury');await shot('questions');});
 await step('anatomy',async()=>{await open('/simulator?mode=anatomy');await page.waitForTimeout(18000);await shot('anatomy');});
 await step('icu',async()=>{const btn=page.getByRole('button',{name:'Open ICU monitor',exact:true});if(await btn.count())await btn.click();else await page.getByRole('button',{name:/ICU Monitor/}).first().click();await page.waitForTimeout(2000);await shot('icu');});
 await step('flashcards',async()=>{await open('/notes');await page.getByRole('button',{name:/Anki flashcards/i}).click();await page.waitForTimeout(2000);await shot('flashcards');});
 await step('attendance',async()=>{await open('/progress');await page.getByRole('tab',{name:'Attendance',exact:true}).click();await page.waitForTimeout(1500);await shot('attendance');});
 await step('timer',async()=>{await open('/timer');await shot('timer');});
 await step('askai',async()=>{await open('/ask-ai');await shot('askai');});
 await fs.writeFile(path.join(OUT,'capture-manifest.json'),JSON.stringify(manifest,null,2));
 await browser.close();
 if(manifest.shots.filter(s=>!s.error).length!==8)process.exitCode=1;
})();
