// Capture real mobile anatomy twice: its drawer, then the uncovered model.
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const out = resolve(process.argv[2]);
await mkdir(out, { recursive:true });
const coverage = JSON.parse(await readFile(resolve(out,'anatomy-coverage.json'),'utf8'));
let targets = [
  {id:'whole-body',query:{mode:'anatomy'}},
  {id:'vessels',query:{mode:'anatomy',layer:'vascular'}},
  {id:'skeleton',query:{mode:'anatomy',layer:'skeletal'}},
  ...coverage.organs.map(o=>({id:o.id,query:{mode:'anatomy',organ:o.id,isolate:o.preferredReference}})),
];
if (process.env.ORBIT_ANATOMY_TARGETS) targets=targets.filter(t=>process.env.ORBIT_ANATOMY_TARGETS.split(',').includes(t.id));
const browser = await chromium.launch({headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader']});
const page = await browser.newPage({viewport:{width:393,height:800},deviceScaleFactor:3,isMobile:true,hasTouch:true});
const results=[];
let consecutiveFailures=0;
const metadata=()=>page.evaluate(()=>{
  const root=document.querySelector('[data-testid="anatomy-renderer"]');
  return {viewport:[window.innerWidth,window.innerHeight],systems:root?.getAttribute('data-visible-atlas-systems'),isolate:root?.getAttribute('data-isolated'),notices:[...root?.querySelectorAll('[role="status"]') || []].map(el=>el.textContent?.trim())};
});
try {
  for (const target of targets) {
    const entry={id:target.id,captured:false,details:[]};
    try {
      await page.goto('https://orbitmbbs.vercel.app/simulator?'+new URLSearchParams(target.query),{waitUntil:'domcontentloaded'});
      await page.getByTestId('anatomy-renderer').waitFor({timeout:60000});
      await page.waitForFunction(()=>{
        const root=document.querySelector('[data-testid="anatomy-renderer"]');
        if (root?.querySelector('[role="alert"]')) throw Error('Actual Vercel anatomy renderer failed');
        return root?.querySelector('canvas') && root.hasAttribute('data-visible-atlas-systems') && !/LOADING (?:BODYPARTS3D|Z-ANATOMY|HRA)/.test(root.textContent || '');
      },undefined,{timeout:180000});
      await page.waitForTimeout(5000);
      await page.screenshot({path:resolve(out,'anatomy-vercel-'+target.id+'.png')});
      entry.captured=true;entry.renderer=await metadata();
      const close=page.getByTitle('Close Drawer',{exact:true});
      if (await close.count()) {
        await close.click();
        await page.getByLabel('Anatomy details',{exact:true}).waitFor({state:'detached'});
      }
      await page.waitForTimeout(1500);
      await page.screenshot({path:resolve(out,'anatomy-vercel-'+target.id+'-model.png')});
      entry.details.push({id:target.id+'-model',section:'Uncovered 3D model',available:true,captured:true,renderer:await metadata()});
      consecutiveFailures=0;
    } catch(error) {
      entry.error=error.message;consecutiveFailures++;
      await page.screenshot({path:resolve(out,'anatomy-vercel-failure-'+target.id+'.png')}).catch(()=>{});
    }
    results.push(entry);
    await writeFile(resolve(out,'vercel-anatomy-captures.json'),JSON.stringify({status:'NOT_CERTIFIED',platform:'actual Vercel mobile Chromium 393x800 DPR3',targets:results},null,2));
    if (consecutiveFailures>=3) throw Error('Repeated reference failures; stopping uncovered-model audit');
  }
  if (results.some(t=>!t.captured || !t.details.length)) throw Error('Some real Vercel model captures failed');
} finally { await browser.close(); }
