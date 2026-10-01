import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const out=path.resolve(process.argv[2] ?? '../../cardiology-review');
const fixture=JSON.parse(await fs.readFile(out+'/generated-af-reviewed.json','utf8'));
const server=http.createServer(async(req,res)=>{try{const filename=path.resolve('preview/dist',req.url.split('?')[0].slice(1)||'index.html');const content=await fs.readFile(filename);res.setHeader('Content-Type',filename.endsWith('.js')?'application/javascript':filename.endsWith('.css')?'text/css':filename.endsWith('.html')?'text/html':'application/octet-stream');res.end(content);}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(5198,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH ?? '/tmp/chromium',args:['--no-sandbox','--disable-dev-shm-usage'],headless:true});
try{
 const page=await browser.newPage({viewport:{width:400,height:850},deviceScaleFactor:2});
 await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:5198')?route.continue():route.abort());
 await page.goto('http://127.0.0.1:5198/?screen=notesdemo&repetition=generated');
 await page.getByText(fixture.sections[0].title,{exact:true}).waitFor();
 for(const section of fixture.sections){if(await page.getByText(section.title,{exact:true}).count()!==1)throw new Error('Repeated/missing heading '+section.title);}
 const body=await page.locator('body').innerText();
 for(const detail of ['Decision Points in Anticoagulation','Management Algorithm for Acute AF','Diagnostic Nuances and Differential Diagnosis'])if(!body.includes(detail))throw new Error('Missing content '+detail);
 await page.screenshot({path:out+'/AF_reviewed_answer_app_preview.png'});
 await page.getByText('Decision Points in Anticoagulation',{exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:out+'/AF_reviewed_detail_app_preview.png'});
 console.log('OK reviewed provider AF output: all17 sections rendered once with external requests blocked. Browser preview only.');
}finally{await browser.close();server.close();}
