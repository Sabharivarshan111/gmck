import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.ORBIT_JOINT_OUT||'/tmp/orbit-joints';await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:393,height:789},isMobile:true,hasTouch:true});
await page.route(/https:\/\/(?:[^/]+\.)?(?:googlesyndication\.com|doubleclick\.net|googleadservices\.com)\//,r=>r.abort());
const results=[];
try{
 for(const id of ['za_knee_joint','za_hip_joint','za_shoulder_joint']){
  await page.goto((process.env.ORBIT_JOINT_BASE_URL||'http://127.0.0.1:4180')+'/simulator?mode=anatomy&organ=skeletal&isolate='+id,{waitUntil:'domcontentloaded'});
  const drawer=page.getByTestId('organ-detail-drawer');await drawer.waitFor({timeout:120000});await drawer.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByTestId('anatomy-renderer').locator('canvas').waitFor();await page.waitForFunction(()=>!document.querySelector('[data-testid="anatomy-renderer"]').textContent.includes('LOADING'),null,{timeout:180000});await page.waitForTimeout(1800);
  const png=await page.getByTestId('anatomy-renderer').locator('canvas').screenshot();
  const state=JSON.parse(execFileSync('python3',['-c',`
import sys,json,io
from PIL import Image
im=Image.open(io.BytesIO(sys.stdin.buffer.read())).convert('RGB');w,h=im.size
points=[(x,y) for y in range(int(h*.28),int(h*.77)) for x in range(8,w-8) if (lambda c:c[1]>=c[0] and c[2]>c[0]*.9 and c[1]>100 and c[2]>100)(im.getpixel((x,y)))]
print(json.dumps({'count':len(points),'left':min((p[0]/w for p in points),default=1),'right':max((p[0]/w for p in points),default=0),'bottom':min((p[1]/h for p in points),default=1),'top':max((p[1]/h for p in points),default=0),'w':w,'h':h}))
`],{input:png}).toString());
  const text=await page.getByTestId('anatomy-renderer').innerText();await page.screenshot({path:out+'/'+id+'.png'});results.push({id,...state,incorrectHraNotice:/HuBMAP Human Reference Atlas/.test(text)});console.log(results.at(-1));
  if(process.env.ORBIT_JOINT_EXPECT_FIXED==='1'){assert(state.count>500&&state.right-state.left>.2,'Joint source must be legible, not tiny distant points');assert(!results.at(-1).incorrectHraNotice,'Z-Anatomy target must not be attributed to HRA');}
 }
}finally{await writeFile(out+'/results.json',JSON.stringify(results,null,2));await browser.close();}
