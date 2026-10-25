// Exercises actual RN components through RN-web; not an Android device test.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
os.networkInterfaces = () => ({});
const server = await createServer({ configFile:'preview/vite.config.ts',server:{host:'127.0.0.1',port:5188,strictPort:true} }); await server.listen();
const browser = await chromium.launch({ executablePath:process.env.CHROME_PATH || '/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process'] });
const context = await browser.newContext({viewport:{width:390,height:844},hasTouch:true,timezoneId:'Asia/Kolkata'});
await context.addInitScript(()=>{
 localStorage.setItem('orbit-profile-v1',JSON.stringify({display_name:'ORBIT Demo',year:'final'}));
 if(localStorage.getItem('orbit:attendance-v1'))return;
 const daily={};
 for(const [date,present,absent,off] of [['12',1,0,false],['13',1,0,false],['14',0,1,false],['15',1,1,false],['16',0,0,true],['19',2,0,false],['20',1,0,false],['21',0,1,false]])daily[`2026-10-${date}`]={present,absent,off};
 localStorage.setItem('orbit:attendance-v1',JSON.stringify([
 {id:'medicine',name:'General Medicine',kind:'theory',held:43,attended:30,target:75,totalClasses:100,monthly:{'2026-10':{held:43,attended:30,totalClasses:60}},daily},
 {id:'lab',name:'Pathology practical',kind:'lab',held:8,attended:6,target:80,monthly:{'2026-10':{held:8,attended:6}}},
 {id:'posting',name:'Medicine posting',kind:'posting',held:15,attended:13,target:80,totalDays:28,startDate:'2026-10-05',endDate:'2026-11-01',skipSundays:true,prepaidHolidays:true}
 ]));
});
const page=await context.newPage();await page.clock.install({time:new Date('2026-10-25T12:00:00+05:30')});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const by=label=>page.getByLabel(label,{exact:true}).last();
const tap=async label=>{const dismiss=by('Not now'); if(label!=='Not now' && await dismiss.isVisible().catch(()=>false)){await dismiss.click();await page.waitForTimeout(300);} await by(label).click();await page.waitForTimeout(220);};
const record=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('orbit:attendance-v1')).find(item=>item.id==='medicine'));
const out=path.resolve('../screenshots/attendance-history');await fs.mkdir(out,{recursive:true});
const shot=async name=>{if(['01-theory-full','06-lab-attendance','06b-swipe-actions','08-posting-calendar'].includes(name)){const label=name==='08-posting-calendar'?'Add a posting':'Add a subject';const box=await by(label).boundingBox();if(box)await page.setViewportSize({width:390,height:Math.max(844,Math.ceil(box.y+box.height+110))});await page.waitForTimeout(200);}await page.screenshot({path:path.join(out,name+'.png')});console.log(name);};
try{
 await page.goto('http://127.0.0.1:5188/?screen=progress',{waitUntil:'networkidle'});await page.waitForTimeout(900);await tap('Attendance');
 await page.setViewportSize({width:390,height:1700});await shot('01-theory-full');await page.setViewportSize({width:390,height:844});
 await tap('Attendance history for General Medicine');await shot('02-history-calendar');
 await tap('2026-10-23, unmarked');await tap('Mixed day');await by('Present classes on selected date').fill('2');
 await page.setViewportSize({width:390,height:1250});await shot('03-edit-mixed-day');await tap('Save date attendance');
 assert.equal((await record()).held,46);assert.equal((await record()).attended,32);
 await tap('2026-10-24, unmarked');await tap('Off-day');await tap('Save date attendance');assert.equal((await record()).held,46);
 await tap('2026-10-22, unmarked');await tap('Present day');await tap('Use existing attendance balance');await tap('Save date attendance');assert.equal((await record()).held,46);
 await page.setViewportSize({width:390,height:844});await shot('04-updated-history');await tap('Done');
 await tap('Edit counts for General Medicine');await tap('Increase Attended count');await shot('05-edit-counts');await tap('Save attendance counts');
 assert.equal((await record()).held,47);assert.equal((await record()).attended,33);
 await tap('Mark present for General Medicine');await tap('Mark absent for General Medicine');assert.equal((await record()).daily['2026-10-25'].absent,1);
 await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(900);await tap('Attendance');await tap('Undo the last mark for General Medicine');assert.equal((await record()).held,48);assert.equal((await record()).attended,34);
 await tap('Set custom target for General Medicine');await by('Custom attendance percentage').fill('0');await tap('Save custom attendance target');assert.equal((await record()).target,0);
 await tap('Edit name for General Medicine');await by('Attendance subject name').fill('Medicine theory');await tap('Save attendance name');
 await tap('Labs');await page.setViewportSize({width:390,height:1550});await shot('06-lab-attendance');await tap('Mark present for Pathology practical');

 const cdp=await context.newCDPSession(page);
 const nameBox=await page.getByText('Pathology practical',{exact:true}).boundingBox();
 const swipeY=nameBox.y+nameBox.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:330,y:swipeY,id:0,radiusX:4,radiusY:4}]});
 for(let step=1;step<=10;step++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:330-step*16,y:swipeY,id:0,radiusX:4,radiusY:4}]});await page.waitForTimeout(25);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(500);
 await by('Swipe delete Pathology practical').waitFor();await shot('06b-swipe-actions');await tap('Swipe delete Pathology practical');await tap('Keep attendance subject');
 await tap('Add a subject');await by('Subject name').fill('Microbiology lab');await tap('Add this subject');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('orbit:attendance-v1')).find(x=>x.name==='Microbiology lab').kind),'lab');
 await tap('Remove Microbiology lab');await shot('07-delete-confirmation');await tap('Keep attendance subject');await by('Mark present for Microbiology lab').waitFor();
 await tap('Remove Microbiology lab');await tap('Confirm remove Microbiology lab');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('orbit:attendance-v1')).some(x=>x.name==='Microbiology lab')),false);
 await tap('Clinical postings');await tap('Attendance details for Medicine posting');await tap('View Rotation Calendar and Holidays');await shot('08-posting-calendar');await tap('Attendance history for Medicine posting');
 assert.equal(await by('2026-10-04, unmarked').isDisabled(),true);assert.equal(await by('2026-10-26, unmarked').isDisabled(),true);await tap('Done');
 for(const width of [360,412]){await page.setViewportSize({width,height:844});await tap('Attendance history for Medicine posting');await shot(`09-history-${width}`);
 const escaped=await page.evaluate(()=>[...document.querySelectorAll('[aria-label^="2026-10-"]')].some(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.left < -1||r.right>window.innerWidth+1);}));assert.equal(escaped,false);await tap('Done');}
 assert.deepEqual(errors,[]);console.log('OK history UI: mixed/off-day edits, no-double-count migration, count correction, persisted Undo, zero target, renaming, labs, deletion and phone layouts');
}catch(err){await shot('debug-failure');console.log(await page.locator('body').innerText());throw err;}finally{await browser.close();await server.close();}
