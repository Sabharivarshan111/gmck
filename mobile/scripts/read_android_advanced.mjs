// Read actual installed WebView layout. Disconnect only the inspector socket.
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
const adb = (...args) => execFileSync('adb', args, { encoding: 'utf8' });
const sockets = [...new Set(adb('shell', 'cat', '/proc/net/unix').match(/webview_devtools_remote[^\s]*/g) || [])];
const results = [];
const expression = (()=>({
  url:location.href,
  viewport:[innerWidth,innerHeight],
  nativeVh:getComputedStyle(document.documentElement).getPropertyValue('--orbit-native-vh'),
  eye:{render:document.querySelector('[data-testid="eye-head-view"]')?.getAttribute('data-render-state'),response:{...document.querySelector('[data-testid="eye-response-state"]')?.dataset}},
  audioErrors:[...document.querySelectorAll('.ausc-error')].map(x=>x.textContent),
  buttons:[...document.querySelectorAll('button')].filter(x=>x.getClientRects().length).map(x=>({text:x.textContent,label:x.getAttribute('aria-label'),pressed:x.getAttribute('aria-pressed')})),
  canvases:[...document.querySelectorAll('canvas')].filter(x=>x.getClientRects().length).map(x=>({label:x.getAttribute('aria-label'),width:x.width,height:x.height,rect:{width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height}})),
})).toString();
for (const socket of sockets) {
  try {
    adb('forward', 'tcp:9222', 'localabstract:' + socket);
    const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json();
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
