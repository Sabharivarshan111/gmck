import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const out = resolve(process.argv[2] || 'artifacts/native-vault-parity');
const native = JSON.parse(await readFile(resolve(out, 'native-anatomy-captures.json'), 'utf8'));
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const results = [];
try {
  for (const target of native.targets) {
    const [width, height] = target.renderer?.viewport || [393, 780];
    if (width >= 768) throw Error('Android anatomy was not rendered at mobile width');
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto('https://orbitmbbs.vercel.app' + target.route, { waitUntil: 'domcontentloaded' });
      const renderer = page.getByTestId('anatomy-renderer');
      await renderer.waitFor({ state: 'visible', timeout: 60000 });
      await page.waitForFunction(() => {
        const element = document.querySelector('[data-testid="anatomy-renderer"]');
        return element?.querySelector('canvas') && element.getAttribute('data-visible-atlas-systems') && !/LOADING BODYPARTS3D/.test(element.textContent);
      }, undefined, { timeout: 180000 });
      await page.waitForTimeout(5000);
      const metadata = await renderer.evaluate(element => ({ systems: element.getAttribute('data-visible-atlas-systems'), graphicsError: !!element.querySelector('[role="alert"]') }));
      if (metadata.graphicsError || errors.length) throw Error('Vercel renderer error: ' + errors.join('; '));
      const screenshot = 'anatomy-vercel-' + target.id + '.png';
      await page.screenshot({ path: resolve(out, screenshot) });
      results.push({ id: target.id, viewport: [width, height], screenshot, metadata, captured: true, appearanceVerified: false });
      console.log('CAPTURED Vercel mobile anatomy:', target.id);
    } catch (error) {
      await page.screenshot({ path: resolve(out, 'anatomy-vercel-failure-' + target.id + '.png') });
      results.push({ id: target.id, captured: false, error: error.message });
    } finally { await context.close(); }
    await writeFile(resolve(out, 'vercel-anatomy-captures.json'), JSON.stringify({ status: 'NOT_CERTIFIED', targets: results }, null, 2));
  }
} finally { await browser.close(); }
if (results.some(result => !result.captured)) throw Error('Missing Vercel organ captures; inspect vercel-anatomy-captures.json');
