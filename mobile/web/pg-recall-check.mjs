/** Production browser flow for separate AIIMS/INI banks; no database or AI service. */
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const repo=path.resolve(import.meta.dirname,'../..');
const evidence=path.join(repo,'docs/evidence/pg-recalls');
await fs.mkdir(evidence,{recursive:true});
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    const relative=path.extname(url.pathname)?url.pathname:'/index.html';
    const file=path.join(repo,'dist',relative);
    res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');
    res.end(await fs.readFile(file));
  } catch {res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(5238,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await context.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:5238')?route.continue():route.abort());
await context.addInitScript(()=>{
  localStorage.setItem('orbit-profile-v1',JSON.stringify({display_name:'Recall tester',year:'first',university:'tnmgr'}));
  localStorage.setItem('orbit:tour-v1',JSON.stringify({seen:1}));localStorage.setItem('orbit:last-run-version','28');localStorage.setItem('orbit:theme-preference','blackwhite');
});
const page=await context.newPage();page.setDefaultTimeout(30000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
const label=name=>page.getByLabel(name,{exact:true});
const choose=async(name,count)=>{
  await label('Open '+name+' practice').click();
  await label('Search offline '+name.replace('NEET-PG','NEET PG')+' questions').waitFor();
  await page.getByText(count.toLocaleString(),{exact:true}).waitFor();
};
const open=async()=>{
  await page.goto('http://127.0.0.1:5238/notes');await label('NEET-PG practice questions').click();await label('Search offline NEET PG questions').waitFor();
};
try {
  await open();
  for(const width of [360,390,430]){
    await page.setViewportSize({width,height:844});
    await choose('AIIMS PG',66);
    for(const name of ['NEET-PG','AIIMS PG','INI-CET']){
      const box=await label('Open '+name+' practice').boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=width+1&&box.height>=43.5);
    }
    await choose('INI-CET',49);
  }
  await page.setViewportSize({width:390,height:844});
  await choose('AIIMS PG',66);
  await page.screenshot({path:path.join(evidence,'aiims-library.png')});
  await label('Search offline AIIMS PG questions').fill('Dorello');
  await label('Open AIIMS PG question 1').click();
  await label('Show answer and explanation').click();
  await page.getByText('Answer: D',{exact:true}).waitFor();
  await label('Save this AIIMS PG question').click();
  await label('Return to AIIMS PG library').click();
  await choose('INI-CET',49);
  await page.screenshot({path:path.join(evidence,'ini-library.png')});
  await page.getByText('0 saved',{exact:true}).waitFor();
  await label('Search offline INI-CET questions').fill('SGLT1');
  await label('Open INI-CET question 1').click();
  await label('Show answer and explanation').click();
  await page.getByText('Answer: C',{exact:true}).waitFor();
  await page.screenshot({path:path.join(evidence,'ini-answer.png')});
  await label('Return to INI-CET library').click();
  await context.setOffline(true);
  await choose('AIIMS PG',66);
  await label('Show saved AIIMS PG questions').click();
  await label('Open AIIMS PG question 1').click();
  await page.getByText(/Dorello/).first().waitFor();
  await label('Return to AIIMS PG library').click();
  await choose('NEET-PG',2078);
  assert.deepEqual(errors,[]);
  console.log('PASS 360/390/430 exam controls; separate counts, source-key reveal, bookmark isolation, offline switching and unchanged NEET bank.');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
