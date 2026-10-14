import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
fs.mkdirSync('native-radiology-proof',{recursive:true});
fs.mkdirSync('public/native-simulator/radiology',{recursive:true});
fs.cpSync('public/clinical-reference/radiology','public/native-simulator/radiology',{recursive:true});
const vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','preview/vite.config.ts','--host','127.0.0.1','--port','4178'],{cwd:'mobile',stdio:['ignore','pipe','pipe']});
let serverLog='';vite.stdout.on('data',b=>serverLog+=b);vite.stderr.on('data',b=>serverLog+=b);
let browser;
async function screenshot(page,name){const stage=page.getByTestId('radiology-image-stage');await stage.scrollIntoViewIfNeeded();await stage.screenshot({path:'native-radiology-proof/'+name+'.png'});await page.screenshot({path:'native-radiology-proof/'+name+'-phone.png'});}
try{
 for(let i=0;i<100;i++){try{const r=await fetch('http://127.0.0.1:4178/radiology.html');if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4178/radiology.html',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Identify Trachea',exact:true}).waitFor();
 await screenshot(page,'normal-xray');
 await page.getByRole('button',{name:'Next film',exact:true}).click();
 await page.getByRole('button',{name:'Identify Pleural air',exact:true}).waitFor();
 await screenshot(page,'pneumothorax');
 await page.getByRole('button',{name:'Next film',exact:true}).click();
 await page.getByRole('button',{name:'Identify Left basal pleural opacity',exact:true}).waitFor();
 await screenshot(page,'pleural-effusion');
 await page.getByRole('button',{name:'Brain MRI',exact:true}).click();
 await page.getByTestId('preview-mri-canvas').waitFor();
 await page.waitForFunction(()=>document.querySelector('[data-testid="preview-mri-canvas"]')?.width===112);
 await page.getByRole('button',{name:'Identify Midbrain',exact:true}).waitFor();
 await screenshot(page,'axial-mri');
 await page.getByRole('button',{name:'Image tools',exact:true}).click();
 await page.getByRole('button',{name:'Reviewed sagittal landmarks',exact:true}).click();
 await page.getByRole('button',{name:'Identify Corpus callosum',exact:true}).waitFor();
 await screenshot(page,'sagittal-mri');
 await page.getByRole('button',{name:'Identify Cerebellum',exact:true}).click();
 await page.getByText('Teaching landmark on this exact resampled reference slice.',{exact:false}).waitFor();
 await page.getByRole('button',{name:'Image tools',exact:true}).click();
 await page.getByRole('button',{name:'Measure image',exact:true}).click();
 const stage=page.getByTestId('radiology-image-stage');await stage.scrollIntoViewIfNeeded();
 const b=await stage.boundingBox();assert(b);
 await stage.click({position:{x:b.width/2-25,y:b.height/2}});
 await stage.click({position:{x:b.width/2+25,y:b.height/2}});
 const readout=page.getByText(/^[0-9]+\.[0-9] mm · resampled voxel spacing$/);await readout.waitFor();
 assert(parseFloat(await readout.textContent())>0);
 await screenshot(page,'mri-calipers');
 await page.getByRole('button',{name:'Image tools',exact:true}).click();
 await page.getByRole('button',{name:'Reviewed axial landmarks',exact:true}).click();
 await page.getByText('Tap two points on the image.',{exact:true}).waitFor();
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('Native imaging components: normal X-ray, pneumothorax, effusion, axial and sagittal MRI, clickable labels passed in RN web preview. Android graphics/device behavior not verified here.');
 for(const name of ['pneumothorax','pleural-effusion','axial-mri','sagittal-mri']){
  const bytes=fs.readFileSync('native-radiology-proof/'+name+'.png');console.log('UI_IMAGE_BEGIN '+name);console.log(bytes.toString('base64'));console.log('UI_IMAGE_END');
 }
}catch(error){console.error(serverLog.slice(-5000));throw error;}finally{await browser?.close();vite.kill();}
