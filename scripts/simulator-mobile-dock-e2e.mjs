import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const base = process.env.SIMULATOR_E2E_BASE_URL || 'http://127.0.0.1:4180';
const out = 'artifacts/mobile-dock';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 393, height: 789 }, isMobile: true, hasTouch: true });
const checks = [];
const assert = (ok, message) => { if (!ok) throw Error(message); };
const box = id => page.locator(`[data-testid="${id}"]:visible`).boundingBox();
async function verify(label) {
  const spread = await box('anatomy-spread-control');
  const toolbar = await box('anatomy-thumb-toolbar');
  const tabs = await box('simulator-bottom-tabs');
  assert(spread && toolbar && tabs, label + ': missing controls');
  assert(spread.y >= 0 && spread.y + spread.height <= toolbar.y, label + ': spread overlaps toolbar');
  assert(toolbar.y + toolbar.height <= tabs.y, label + ': toolbar overlaps tabs');
  for (const r of [spread, toolbar, tabs]) assert(r.x >= 0 && r.x + r.width <= page.viewportSize().width + 1, label + ': horizontal overflow');
  const unobstructed = await page.getByTestId('mobile-anatomy-dock').evaluate(dock => {
    const card = dock.querySelector('[data-testid="anatomy-spread-control"]');
    const r = card.getBoundingClientRect();
    return [.15,.5,.85].every(x => [.2,.5,.8].every(y => dock.contains(document.elementFromPoint(r.x+r.width*x,r.y+r.height*y))));
  });
  assert(unobstructed, label + ': anatomy overlays cover spread controls');
  const input = page.getByTestId('mobile-anatomy-dock').getByRole('slider');
  const r = await input.boundingBox();
  const hit = await input.evaluate(el => { const r = el.getBoundingClientRect(); return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2) === el; });
  assert(hit && r.height >= 28, label + ': spread slider obstructed');
  for (const name of ['Browse','Layers']) {
    await page.getByTestId('anatomy-thumb-toolbar').getByRole('button', {name, exact:true}).click();
    const panel = page.locator('.mobile-anatomy-panel:visible');
    await panel.waitFor();
    const p = await panel.boundingBox();
    assert(p.y >= 0 && p.y + p.height <= spread.y, label + ': ' + name + ' overlaps dock');
    assert(await panel.evaluate(el=>getComputedStyle(el).overflowY === 'auto'), name + ' must scroll');
    await page.getByTestId('anatomy-thumb-toolbar').getByRole('button', {name,exact:true}).click();
  }
  await page.screenshot({path:path.join(out,label+'.png')});
  checks.push({label,spread,toolbar,tabs});
}
try {
  await page.goto(base+'/simulator?mode=anatomy', {waitUntil:'domcontentloaded'});
  await page.getByTestId('mobile-anatomy-dock').waitFor();
  for (const [width,height] of [[320,640],[393,789],[412,915],[844,390]]) {
    await page.setViewportSize({width,height});
    await page.waitForTimeout(500);
    await verify(`${width}x${height}`);
  }
  await page.setViewportSize({width:393,height:789});
  await page.addStyleTag({content:'[data-testid="simulator-bottom-tabs"] { padding-bottom: 32px !important; } [data-simulator-root] { font-size: 20px; }'});
  await page.waitForTimeout(500);
  await verify('safe-area-large-text');
  const range = page.getByTestId('mobile-anatomy-dock').getByRole('slider');
  const r = await range.boundingBox();
  await page.mouse.move(r.x + 3, r.y + r.height/2);
  await page.mouse.down(); await page.mouse.move(r.x+r.width*.45,r.y+r.height/2,{steps:8}); await page.mouse.up();
  assert(Number(await range.inputValue()) > .05, 'Actual slider drag did not change spread');
  await verify('spread-dragged');
  console.log(JSON.stringify({status:'passed',checks},null,2));
} finally {
  fs.writeFileSync(path.join(out,'geometry.json'),JSON.stringify(checks,null,2));
  await browser.close();
}
