// Read actual installed WebView layout. Disconnect only the inspector socket.
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
const adb = (...args) => execFileSync('adb', args, { encoding: 'utf8' });
const sockets = [...new Set(adb('shell', 'cat', '/proc/net/unix').match(/webview_devtools_remote[^\s]*/g) || [])];
const results = [];
const expression = (() => {
        const describe = el => {
          const r = el.getBoundingClientRect(), s = getComputedStyle(el);
          const keys = ['display','position','zIndex','opacity','visibility','transform','filter','backdropFilter','contain','contentVisibility','overflow','height','maxHeight','pointerEvents','backgroundColor'];
          return { tag: el.tagName, class: String(el.className).slice(0, 500), label: el.getAttribute('aria-label'), rect: { x:r.x,y:r.y,width:r.width,height:r.height }, style: Object.fromEntries(keys.map(key => [key,s[key]])), centerElement: document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML.slice(0,700) };
        };
        const panels = [...document.querySelectorAll('[role="dialog"], [aria-label="Anatomy details"], .ecg-studio-backdrop')];
        return { url: window.location.href, viewport: [window.innerWidth,window.innerHeight], visualViewport: {width:window.visualViewport?.width,height:window.visualViewport?.height,offsetTop:window.visualViewport?.offsetTop}, rootClass:document.documentElement.className, media: Object.fromEntries(['(min-width: 768px)', '(max-width: 1023px)', '(max-height: 500px)'].map(query => [query, matchMedia(query).matches])), clientViewport:[document.documentElement.clientWidth,document.documentElement.clientHeight], measuredHeight:getComputedStyle(document.documentElement).getPropertyValue('--orbit-native-vh'), panels:panels.map(el => ({self:describe(el), ancestors:[el.parentElement,el.parentElement?.parentElement,el.parentElement?.parentElement?.parentElement].filter(Boolean).map(describe), controls:[...el.querySelectorAll('button,[role="tab"]')].slice(0,18).map(describe)})) };
}).toString();
for (const socket of sockets) {
  try {
    adb('forward', 'tcp:9222', 'localabstract:' + socket);
    const targets = await (await fetch('http://127.0.0.1:9222/json/list', {signal:globalThis.AbortSignal.timeout(5000)})).json();
    for (const target of targets.filter(target => /\/simulator(?:\?|$)/.test(target.url))) {
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      const value = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { ws.close(); reject(Error('Read-only layout probe timed out')); }, 10000);
        ws.onopen = () => ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:'('+expression+')()',returnByValue:true}}));
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
