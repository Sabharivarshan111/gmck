// Read actual installed WebView layout. Disconnect only the inspector socket.
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
const adb = (...args) => execFileSync('adb', args, { encoding: 'utf8' });
const appPids = adb('shell','pidof',process.env.ORBIT_PACKAGE || 'com.aistudio.mbbsqbank.aycxvd.debug').trim().split(/\s+/);
const sockets = [...new Set(adb('shell', 'cat', '/proc/net/unix').match(/webview_devtools_remote[^\s]*/g) || [])].filter(socket => appPids.some(pid => socket === 'webview_devtools_remote_' + pid));
const results = [];
const expression = (async()=>{
const geometry=el=>{
 const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
 let parent=el.parentElement;
 while(parent && !(parent.scrollHeight>parent.clientHeight+1 && /auto|scroll/.test(getComputedStyle(parent).overflowY))) parent=parent.parentElement;
 const s=parent?.getBoundingClientRect();
 return {rect:{x:r.x,y:r.y,width:r.width,height:r.height},hit:!!hit && el.contains(hit),scroller:s?{x:s.x,y:s.y,width:s.width,height:s.height}:null};
};const scan=document.querySelector('[data-testid="pocus-canvas"]');let scanHash=null;if(scan){const bytes=scan.getContext('2d')?.getImageData(0,0,scan.width,scan.height).data;if(bytes){let hash=2166136261;for(let i=0;i<bytes.length;i+=4)hash=Math.imul(hash^bytes[i]^bytes[i+1]^bytes[i+2],16777619);scanHash=hash>>>0;}}const thorax=document.querySelector('.ausc-webgl');
const body=thorax?.querySelector('canvas');let bodyHash=null;
if(body && getComputedStyle(thorax).visibility==='visible'){
  await new Promise(resolve=>window.requestAnimationFrame(resolve));
  const frame=body.toDataURL();let hash=2166136261;
  for(let i=0;i<frame.length;i++)hash=Math.imul(hash^frame.charCodeAt(i),16777619);
  bodyHash=hash>>>0;
}
return ({
  thorax:{rect:body?geometry(body).rect:null,ready:!!body && getComputedStyle(thorax).visibility==='visible',status:document.querySelector('.ausc-model-status')?.textContent,bodyHash},
  patient:window.__orbitPatientKernel?{scenario:window.__orbitPatientKernel.currentScenario?.id,vitals:window.__orbitPatientKernel.vitals}:null,
  url:window.location.href,
  viewport:[window.innerWidth,window.innerHeight],
  scanHash,
  controls:[...document.querySelectorAll('button,input[type="range"]')].filter(x=>x.getClientRects().length).map(x=>({text:x.textContent?.trim(),label:x.getAttribute('aria-label'),testId:x.getAttribute('data-testid'),disabled:x.disabled,...geometry(x)})),
  sliders:[...document.querySelectorAll('input[type="range"]')].map(x=>({label:x.getAttribute('aria-label'),value:Number(x.value),min:Number(x.min),max:Number(x.max || 100)})),
  nativeVh:getComputedStyle(document.documentElement).getPropertyValue('--orbit-native-vh'),
  eye:{render:document.querySelector('[data-testid="eye-head-view"]')?.getAttribute('data-render-state'),response:{...document.querySelector('[data-testid="eye-response-state"]')?.dataset}},
  audioErrors:[...document.querySelectorAll('.ausc-error')].map(x=>x.textContent),
  buttons:[...document.querySelectorAll('button')].filter(x=>x.getClientRects().length).map(x=>({text:x.textContent,label:x.getAttribute('aria-label'),pressed:x.getAttribute('aria-pressed')})),
  canvases:[...document.querySelectorAll('canvas')].filter(x=>x.getClientRects().length).map(x=>({label:x.getAttribute('aria-label'),width:x.width,height:x.height,rect:{width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height}})),
});}).toString();
for (const socket of sockets) {
  try {
    adb('forward', 'tcp:9222', 'localabstract:' + socket);
    const targets = await (await fetch('http://127.0.0.1:9222/json/list', {signal:globalThis.AbortSignal.timeout(5000)})).json();
    for (const target of targets.filter(target => /\/simulator(?:\?|$)/.test(target.url))) {
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      const value = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { ws.close(); reject(Error('Read-only layout probe timed out')); }, 10000);
        ws.onopen = () => ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:'('+expression+')()',returnByValue:true,awaitPromise:true}}));
        ws.onerror = () => { clearTimeout(timeout); reject(Error('Inspector socket failed')); };
        ws.onmessage = event => {
          const message = JSON.parse(String(event.data));
          if (message.id !== 1) return;
          clearTimeout(timeout);
          ws.close();
          if (message.error || message.result?.exceptionDetails) reject(Error(JSON.stringify(message)));
          else resolve(message.result.result.value);
        };
      });
      results.push(value);
    }
  } catch (error) { results.push({socket,error:error.message}); }
}
await writeFile(process.argv[2], JSON.stringify({sockets,results}, null, 2));
if (!results.length) console.warn('No debuggable Android WebView found.');

// All requested reads and the evidence file write are complete. Do not keep
// the CLI alive for an inspector or HTTP keep-alive close handshake.
process.exit(0);
