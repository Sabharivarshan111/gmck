import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.SIMULATOR_E2E_BASE_URL || 'https://orbitmbbs.vercel.app';
const outDir = path.resolve('artifacts/simulator-mobile-ux');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/152.0 Mobile Safari/537.36',
});
const page = await context.newPage();
page.setDefaultTimeout(30000);

const report = {
  baseURL,
  viewport: { width: 390, height: 844 },
  startedAt: new Date().toISOString(),
  checks: [],
  warnings: [],
};

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    report.warnings.push({ type: 'console-error', message: msg.text() });
  }
});
page.on('pageerror', (err) => {
  report.warnings.push({ type: 'page-error', message: String(err?.message || err) });
});

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const visible = async (locator, label) => {
  await locator.waitFor({ state: 'visible' });
  const box = await locator.boundingBox();
  assert(box && box.width > 0 && box.height > 0, label + ' has no visible box');
  return box;
};
const touchSafe = async (locator, label, min = 43) => {
  const box = await visible(locator, label);
  assert(box.width >= min && box.height >= min,
    label + ' touch target is ' + Math.round(box.width) + 'x' + Math.round(box.height) + 'px');
  return box;
};
const documentFits = async (label) => {
  const dims = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert(dims.html <= dims.innerWidth + 2 && dims.body <= dims.innerWidth + 2,
    label + ' has horizontal overflow: ' + JSON.stringify(dims));
};
const shot = async (name) => {
  await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: false, timeout: 30000 });
};
const setRangeValue = async (locator, value) => {
  await locator.evaluate((element, nextValue) => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    descriptor?.set?.call(element, String(nextValue));
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
};
const goto = async (urlPath) => {
  await page.goto(baseURL + urlPath, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('body').waitFor({ state: 'visible' });
  await page.waitForTimeout(1200);
};
const check = async (name, fn) => {
  const started = Date.now();
  try {
    await fn();
    report.checks.push({ name, status: 'passed', durationMs: Date.now() - started });
  } catch (error) {
    report.checks.push({
      name,
      status: 'failed',
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.stack || error.message : String(error),
    });
    try { await shot('FAIL-' + name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()); } catch {}
  }
};

await check('compact-toolbar-and-visible-canvas', async () => {
  await goto('/simulator');
  const stage = page.getByTestId('mobile-anatomy-stage');
  const toolbar = stage.getByTestId('dissection-toolbar');
  await visible(stage, 'mobile anatomy stage');
  const toolbarBox = await visible(toolbar, 'compact dissection toolbar');
  assert(toolbarBox.height <= 180, 'Mobile dissection toolbar is still too tall: ' + Math.round(toolbarBox.height) + 'px');
  for (const id of ['inspect', 'scalpel', 'isolate']) {
    await touchSafe(toolbar.getByTestId('dissection-mode-' + id), id + ' mode');
  }
  await touchSafe(toolbar.getByTestId('dissection-xray'), 'X-Ray');
  const canvas = stage.locator('canvas').first();
  const canvasBox = await visible(canvas, '3D anatomy canvas');
  assert(canvasBox.height >= 390, '3D canvas is too short: ' + Math.round(canvasBox.height) + 'px');
  await visible(page.getByTestId('mobile-gesture-hint'), 'mobile gesture hint');
  await documentFits('3D stage');
  await shot('01-compact-toolbar-visible-canvas');
});

await check('spread-anatomy-inventory-and-clickable-labels', async () => {
  await goto('/simulator');
  const stage = page.getByTestId('mobile-anatomy-stage');
  const spreadControl = stage.getByTestId('anatomy-spread-control');
  const spread = stage.getByTestId('anatomy-spread');
  await visible(spreadControl, 'Spread anatomy control');
  await visible(spread, 'Spread anatomy slider');

  const canvas = stage.locator('canvas').first();
  await visible(canvas, '3D canvas before spread');
  const assembled = await canvas.screenshot();

  await setRangeValue(spread, 0.48);
  await page.waitForTimeout(850);
  assert(Number(await spread.inputValue()) > 0.45, 'Spread slider did not enter separated-system range');
  const separated = await canvas.screenshot();
  assert(!assembled.equals(separated), 'Moving Spread anatomy did not change the rendered atlas');
  assert(separated.length > 8000, 'Separated anatomy canvas rendered suspiciously blank');
  await shot('02a-spread-separated-systems');

  await setRangeValue(spread, 1);
  await page.waitForTimeout(1000);
  const inventory = await canvas.screenshot();
  assert(!separated.equals(inventory), '100% spread did not transition to every-piece inventory');
  assert(inventory.length > 8000, 'Every-piece anatomy inventory rendered suspiciously blank');

  const labels = stage.locator('[data-testid^="anatomy-label-"]:visible');
  const labelCount = await labels.count();
  assert(labelCount >= 3, 'Expected at least three collision-safe anatomy labels at full spread; got ' + labelCount);
  assert(labelCount <= 7, 'Mobile floating labels exceeded the clutter budget: ' + labelCount);
  await shot('02b-spread-every-piece-inventory');

  const heartLabel = stage.getByTestId('anatomy-label-heart');
  await visible(heartLabel, 'Heart floating label');
  await touchSafe(heartLabel, 'Heart floating label', 32);
  await heartLabel.click();

  const drawer = page.getByTestId('organ-detail-drawer');
  await visible(drawer, 'Heart dossier from floating label');
  await visible(drawer.getByRole('heading', { name: /Heart/i }).first(), 'Heart heading from floating label');
  await shot('02c-spread-heart-label-details');

  await documentFits('Spread anatomy mobile inventory');
});

await check('drawer-peek-does-not-block-3d', async () => {
  await goto('/simulator?organ=pectoralis_major');
  const drawer = page.getByTestId('organ-detail-drawer');
  const drawerBox = await visible(drawer, 'Pectoralis Major drawer');
  assert(drawerBox.height <= 360, 'Collapsed anatomy drawer covers too much of the phone: ' + Math.round(drawerBox.height) + 'px');
  assert((await page.locator('[aria-label="Collapse anatomy details"]').count()) === 0,
    'Collapsed drawer still has a full-screen backdrop that can intercept rotation gestures');
  await visible(drawer.getByRole('heading', { name: /Pectoralis Major/i }).first(), 'Pectoralis Major heading');
  await touchSafe(drawer.getByTitle('Open the 3D viewport and center this structure'), 'View 3D');
  await touchSafe(drawer.getByTestId('drawer-isolate-btn'), 'Isolate 3D');
  await documentFits('drawer peek');
  await shot('03-drawer-peek');
});

await check('view-3d-handoff-and-rotation', async () => {
  await goto('/simulator?organ=pectoralis_major');
  const drawer = page.getByTestId('organ-detail-drawer');
  await visible(drawer, 'drawer before View 3D');
  await drawer.getByTitle('Open the 3D viewport and center this structure').click();
  await drawer.waitFor({ state: 'detached' });
  const stage = page.getByTestId('mobile-anatomy-stage');
  await visible(page.getByTestId('mobile-gesture-hint'), 'gesture hint after View 3D');
  const canvas = stage.locator('canvas').first();
  const box = await visible(canvas, 'exposed 3D canvas');
  const before = await canvas.screenshot();
  const x = box.x + box.width * 0.5;
  const y = box.y + box.height * 0.45;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 90, y + 30, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  const after = await canvas.screenshot();
  assert(!before.equals(after), 'Dragging the exposed canvas did not change the 3D render');
  assert(after.length > 8000, 'Rotated 3D canvas rendered suspiciously blank');
  fs.writeFileSync(path.join(outDir, '04-view-3d-after-rotation.png'), after);
});

await check('isolate-handoff', async () => {
  await goto('/simulator?organ=pectoralis_major');
  const drawer = page.getByTestId('organ-detail-drawer');
  await visible(drawer, 'drawer before isolate');
  await drawer.getByTestId('drawer-isolate-btn').click();
  await drawer.waitFor({ state: 'detached' });
  const banner = page.getByTestId('mobile-isolation-banner');
  await visible(banner, 'isolation banner');
  await visible(banner.getByRole('button', { name: 'Dossier' }), 'Dossier action');
  await visible(banner.getByRole('button', { name: 'Restore' }), 'Restore action');
  await shot('05-isolate-focus');
});

await check('depth-peel-exits-isolation-and-shows-requested-layer', async () => {
  await goto('/simulator?organ=pectoralis_major');
  const drawer = page.getByTestId('organ-detail-drawer');
  await visible(drawer, 'Pectoralis dossier before depth peel');
  await drawer.getByTestId('drawer-isolate-btn').click();
  await drawer.waitFor({ state: 'detached' });

  const banner = page.getByTestId('mobile-isolation-banner');
  await visible(banner, 'Pectoralis isolation banner before depth peel');

  const depth = page.getByTestId('mobile-anatomy-stage').getByTestId('dissection-depth');
  await depth.scrollIntoViewIfNeeded();
  await depth.focus();
  // Use the native range interaction path rather than mutating DOM value
  // directly. This fires the same React onChange path as a real drag/tap.
  await depth.press('End');

  await banner.waitFor({ state: 'detached' });
  assert(Number(await depth.inputValue()) > 0.9, 'Depth peel slider did not move to skeletal layer');
  await visible(
    page.getByTestId('mobile-anatomy-stage').getByText('Skeletal Framework', { exact: true }),
    'Skeletal Framework label'
  );
  assert(
    (await page.getByTestId('mobile-isolation-banner').count()) === 0,
    'Isolation banner remained active after moving the global depth peel slider'
  );

  const canvas = page.getByTestId('mobile-anatomy-stage').locator('canvas').first();
  const canvasBox = await visible(canvas, 'skeletal framework canvas after leaving isolation');
  assert(canvasBox.height >= 390, 'Skeletal framework canvas collapsed after depth peel');
  await page.waitForTimeout(700);
  const skeletalFrame = await canvas.screenshot();
  assert(
    skeletalFrame.length > 8000,
    'Skeletal Framework canvas rendered suspiciously blank after leaving Pectoralis isolation'
  );
  fs.writeFileSync(path.join(outDir, '06-depth-peel-restores-global-layer.png'), skeletalFrame);
});

await check('thoracoacromial-reopens-pectoralis-not-heart', async () => {
  await goto('/simulator?organ=pectoralis_major');
  let drawer = page.getByTestId('organ-detail-drawer');
  await visible(drawer, 'Pectoralis dossier');
  await drawer.getByTestId('organ-drawer-tab-vascular').click();
  const inspect = drawer.getByRole('button', { name: /Inspect in 3D/i }).first();
  await visible(inspect, 'Thoracoacromial Inspect in 3D');
  await inspect.click();
  await drawer.waitFor({ state: 'detached' });
  const banner = page.getByTestId('mobile-isolation-banner');
  await visible(banner, 'Thoracoacromial isolation banner');
  const bannerText = ((await banner.textContent()) || '').toLowerCase();
  assert(bannerText.includes('thoracoacromial'), 'Expected thoracoacromial child isolation, got: ' + bannerText);
  await banner.getByRole('button', { name: 'Dossier' }).click();
  drawer = page.getByTestId('organ-detail-drawer');
  await visible(drawer, 'reopened parent dossier');
  const heading = drawer.getByRole('heading').first();
  await visible(heading, 'parent dossier heading');
  const text = ((await heading.textContent()) || '').trim();
  assert(/Pectoralis Major/i.test(text), 'Child structure reopened wrong dossier: ' + text);
  await shot('07-thoracoacromial-parent-dossier');
});

report.finishedAt = new Date().toISOString();
report.summary = {
  passed: report.checks.filter((x) => x.status === 'passed').length,
  failed: report.checks.filter((x) => x.status === 'failed').length,
  warnings: report.warnings.length,
};
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();

console.log(JSON.stringify(report.summary));
if (report.summary.failed > 0) process.exit(1);
