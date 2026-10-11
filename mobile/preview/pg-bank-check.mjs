#!/usr/bin/env node
/** Focused RN-web wiring smoke. Never invokes live AI or claims device testing. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const ts=createRequire(import.meta.url)('typescript');
function load(file){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports},{filename:file});return m.exports;}
const q=load(path.join(root,'mobile/src/lib/pgQuarantine.ts'));
const expected=q.PG_STRUCTURALLY_ELIGIBLE_TOTAL;
const evidence=path.join(here,'pg-bank-evidence');
fs.mkdirSync(evidence,{recursive:true});
const server=await createServer({configFile:path.join(here,'vite.config.ts'),server:{host:'127.0.0.1',port:5207,strictPort:true},logLevel:'error'});
let browser;
let page;
try {
 await server.listen();
 const candidates=[process.env.CHROME_PATH,'/usr/bin/chromium','/usr/bin/google-chrome',...['/opt/pw-browsers',path.join(process.env.HOME||'/tmp','.cache/ms-playwright')].flatMap(dir=>fs.existsSync(dir)?fs.readdirSync(dir).filter(x=>x.startsWith('chromium-')).flatMap(x=>[path.join(dir,x,'chrome-linux/chrome'),path.join(dir,x,'chrome-linux64/chrome')]):[])].filter(Boolean);
 const executablePath=candidates.find(p=>fs.existsSync(p));
 browser=await chromium.launch({...(executablePath?{executablePath}:{}),args:['--no-sandbox','--disable-gpu']});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.addInitScript(()=>{localStorage.setItem('orbit-profile-v1',JSON.stringify({display_name:'PG smoke',year:'second',university:'tnmgr'}));localStorage.setItem('orbit:tour-v1',JSON.stringify({seen:1}));});
 page=await context.newPage();const errors=[];let reviewCalls=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/functions/v1/pg-answer-review',route=>{reviewCalls++;return route.abort();});
 await page.route('**/auth/v1/**',route=>route.abort());
 const label=text=>page.getByLabel(text,{exact:true}).first();
 const shot=name=>page.screenshot({path:path.join(evidence,name+'.png')});
 async function waitText(text){await page.waitForFunction(t=>document.body.innerText.includes(t),text,{timeout:30000});}
 await page.goto('http://127.0.0.1:5207',{waitUntil:'domcontentloaded'});
 // A walkthrough may still be offered by an older stored-state format.
 const skip=page.getByLabel(/Skip.*tour|Skip.*walkthrough|Not now/i).first();
 if(await skip.isVisible().catch(()=>false))await skip.click();
 await label('Notes').click();
 await page.getByLabel(/^PG Entrance Questions & Sources:/).click();
 await waitText(expected.toLocaleString());await waitText(q.PG_QUARANTINED_TOTAL.toLocaleString());
 await label('Show answer and explanation').waitFor({state:'visible'});
 await shot('01-offline-bank');
 await label('Show answer and explanation').click();
 await shot('02-revealed-dataset-answer');
 await page.getByLabel(/^Check supplied answer against textbooks:/).first().click();
 const question=label('Paste recalled PG examination question');
 await question.waitFor({state:'visible'});
 await page.waitForFunction(()=>document.querySelector('[aria-label="Paste recalled PG examination question"]')?.value?.length>=12);
 await shot('03-prefilled-checker-subject');
 await question.scrollIntoViewIfNeeded();
 await shot('04-prefilled-checker-question');
 assert.ok((await question.inputValue()).length>=12,'Card question must prefill review');
 for(const letter of 'ABCD')assert.ok((await label('MCQ option '+letter).inputValue()).trim());
 await label('Check options against textbooks').click();
 await waitText('Sign in with Google first');
 await page.getByText(/Sign in with Google first/).scrollIntoViewIfNeeded();
 await shot('05-unsigned-signin-required');
 assert.equal(reviewCalls,0,'Unsigned check must never call edge function');
 await label('Practice questions').click();
 for(const [exam,count] of [['NEET-PG',Object.entries(q.PG_ELIGIBLE_PACK_COUNTS).filter(([id])=>id.startsWith('neet_pg_')).reduce((a,[,n])=>a+n,0)],['FMGE',0],['INI-CET',0]]){
  await label(exam).click();
  if(count)await waitText(count+' bundled question');else await waitText('No matching dataset questions');
 }
 await label('NEET-PG').click();await label('Filter recalled questions and source links for 2026').click();await waitText('No matching dataset questions');
 // Text-input year label is supplied by the shared bank filter.
 const inputYear=page.locator('input[aria-label*="year"]').first();
 await inputYear.fill('2027');
 await label('Check an answer against textbooks').click();
 await question.waitFor({state:'detached'});
 assert.equal(await question.count(),0,'Invalid year must hide checker');
 await shot('06-invalid-year-hides-checker');
 assert.deepEqual(errors,[]);
 const result={passed:true,structurally_eligible:expected,quarantined:q.PG_QUARANTINED_TOTAL,prefill:true,unsigned_edge_calls:reviewCalls,latest_offline:0,device_tested:false,page_errors:errors};
 fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result));
} catch(error) {
 fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify({passed:false,error:String(error),device_tested:false},null,2)+'\n');
 if(page)await page.screenshot({path:path.join(evidence,'failure.png')}).catch(()=>{});
 throw error;
} finally {await browser?.close();await server.close();}
