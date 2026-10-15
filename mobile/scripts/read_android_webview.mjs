// Read actual installed WebView layout after an ADB interaction. No DOM writes.
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const adb = (...args) => execFileSync('adb', args, { encoding: 'utf8' });
const sockets = [...new Set(adb('shell', 'cat', '/proc/net/unix').match(/webview_devtools_remote[^\s]*/g) || [])];
const results = [];
for (const socket of sockets) {
  let browser;
  try {
    adb('forward', 'tcp:9222', 'localabstract:' + socket);
    browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    for (const page of browser.contexts().flatMap(context => context.pages())) {
      if (!/\/simulator(?:\?|$)/.test(page.url())) continue;
      results.push(await page.evaluate(() => {
        const describe = el => {
          const r = el.getBoundingClientRect(), s = getComputedStyle(el);
          const keys = ['display','position','zIndex','opacity','visibility','transform','filter','backdropFilter','contain','contentVisibility','overflow','height','maxHeight','pointerEvents','backgroundColor'];
          return { tag: el.tagName, class: String(el.className).slice(0, 500), label: el.getAttribute('aria-label'), rect: { x:r.x,y:r.y,width:r.width,height:r.height }, style: Object.fromEntries(keys.map(key => [key,s[key]])), centerElement: document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML.slice(0,700) };
        };
        const panels = [...document.querySelectorAll('[role="dialog"], [aria-label="Anatomy details"], .ecg-studio-backdrop')];
        return { url: window.location.href, viewport: [window.innerWidth,window.innerHeight], visualViewport: {width:window.visualViewport?.width,height:window.visualViewport?.height,offsetTop:window.visualViewport?.offsetTop}, rootClass:document.documentElement.className, panels:panels.map(el => ({self:describe(el), ancestors:[el.parentElement,el.parentElement?.parentElement,el.parentElement?.parentElement?.parentElement].filter(Boolean).map(describe), controls:[...el.querySelectorAll('button,[role="tab"]')].slice(0,18).map(describe)})) };
      }));
    }
  } catch (error) { results.push({ socket, error: error.message }); }
  finally { await browser?.close(); }
}
await writeFile(process.argv[2], JSON.stringify({ sockets, results }, null, 2));
if (!results.length) console.warn('No debuggable Android WebView found; native screenshots remain authoritative.');
