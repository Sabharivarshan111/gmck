// Genuine mobile-browser references; WebView dvh defects are not a reference UI.
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const out = resolve(process.argv[2]);
await mkdir(out, { recursive: true });
const coverage = JSON.parse(await readFile(resolve(out, 'anatomy-coverage.json'), 'utf8'));
const targets = [
  { id: 'whole-body', query: { mode: 'anatomy' } },
  { id: 'vessels', query: { mode: 'anatomy', layer: 'vascular' } },
  { id: 'skeleton', query: { mode: 'anatomy', layer: 'skeletal' } },
  ...coverage.organs.map(organ => ({ id: organ.id, hasTeachingDetails: organ.hasTeachingDetails, query: { mode: 'anatomy', organ: organ.id, isolate: organ.preferredReference } })),
];
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 393, height: 800 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const results = [];
let globalFailures = 0;
const shot = name => page.screenshot({ path: resolve(out, 'anatomy-vercel-' + name + '.png') });
try {
  for (const target of targets) {
    const entry = { id: target.id, captured: false, details: [] };
    try {
      await page.goto('https://orbitmbbs.vercel.app/simulator?' + new URLSearchParams(target.query), { waitUntil: 'domcontentloaded' });
      await page.getByTestId('anatomy-renderer').waitFor({ timeout: 60000 });
      await page.waitForFunction(() => {
        const el = document.querySelector('[data-testid="anatomy-renderer"]');
        if (el?.querySelector('[role="alert"]')) throw Error('Live mobile Vercel WebGL renderer failed');
        return el?.querySelector('canvas') && !/LOADING BODYPARTS3D/.test(el.textContent || '');
      }, undefined, { timeout: 180000 });
      await page.waitForTimeout(6000);
      await shot(target.id);
      entry.captured = true;
      entry.renderer = await page.evaluate(() => ({ viewport: [window.innerWidth, window.innerHeight], systems: document.querySelector('[data-testid="anatomy-renderer"]')?.getAttribute('data-visible-atlas-systems'), drawerHeight: document.querySelector('[aria-label="Anatomy details"]')?.getBoundingClientRect().height || 0 }));
      if (target.hasTeachingDetails) {
        if (entry.renderer.drawerHeight < 100) throw Error('Mobile browser anatomy drawer did not open');
        for (const label of ['Supply', 'Relations']) {
          await page.getByRole('tab', { name: label, exact: true }).click();
          await page.waitForFunction(label => document.querySelector('[aria-label="Anatomy detail sections"] [aria-selected="true"]')?.textContent?.trim() === label, label);
          await shot(target.id + '-' + label.toLowerCase());
          entry.details.push({ id: target.id + '-' + label.toLowerCase(), section: label, available: true, captured: true });
          if (label === 'Supply') {
            await page.getByText('Venous Drainage & Return', { exact: true }).scrollIntoViewIfNeeded();
            await shot(target.id + '-venous-drainage');
            entry.details.push({ id: target.id + '-venous-drainage', section: 'Venous drainage', available: true, captured: true });
          }
        }
      }
      globalFailures = 0;
    } catch (error) {
      entry.error = error.message;
      entry.captured = false;
      await shot('failure-' + target.id).catch(() => {});
      globalFailures++;
    }
    results.push(entry);
    await writeFile(resolve(out, 'vercel-anatomy-captures.json'), JSON.stringify({ status: 'NOT_CERTIFIED', platform: 'actual mobile Vercel browser 393x800 DPR3', targets: results }, null, 2));
    if (globalFailures >= 3) throw Error('Repeated live reference failures; stopping instead of inventing successful comparisons');
  }
  if (results.some(entry => !entry.captured)) throw Error('Incomplete mobile Vercel anatomy references');
} finally { await browser.close(); }
