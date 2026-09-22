import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.SIMULATOR_E2E_BASE_URL || 'http://127.0.0.1:4180';
const outDir = path.resolve('artifacts/simulator-mobile-e2e');
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
page.setDefaultTimeout(12000);

const report = {
  baseURL,
  viewport: { width: 390, height: 844 },
  startedAt: new Date().toISOString(),
  features: [],
  warnings: [],
};

let activeFeature = 'bootstrap';
let pageErrors = [];

page.on('pageerror', (error) => {
  const message = String(error && error.message ? error.message : error);
  if (/AudioContext|audio device|playback/i.test(message)) {
    report.warnings.push({ feature: activeFeature, type: 'audio-environment', message });
    return;
  }
  pageErrors.push(message);
});

page.on('console', (msg) => {
  if (msg.type() !== 'error') return;
  const text = msg.text();
  if (/Failed to load resource|ERR_BLOCKED_BY_CLIENT|ERR_FAILED/i.test(text)) {
    report.warnings.push({ feature: activeFeature, type: 'console-network', message: text });
    return;
  }
  report.warnings.push({ feature: activeFeature, type: 'console-error', message: text });
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
  assert(
    box.width >= min && box.height >= min,
    label + ' touch target is ' + Math.round(box.width) + 'x' + Math.round(box.height) + 'px; expected at least ' + min + 'px'
  );
};

const documentFits = async (label) => {
  const dims = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  assert(
    dims.scrollWidth <= dims.innerWidth + 2 && dims.bodyScrollWidth <= dims.innerWidth + 2,
    label + ' has page-level horizontal overflow: viewport=' + dims.innerWidth +
      ', html=' + dims.scrollWidth + ', body=' + dims.bodyScrollWidth
  );
};

const shot = async (name) => {
  await page.screenshot({
    path: path.join(outDir, name + '.png'),
    fullPage: false,
  });
};

const goto = async (urlPath) => {
  pageErrors = [];
  await page.goto(baseURL + urlPath, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('body').waitFor({ state: 'visible' });
  await page.waitForTimeout(900);
};

const feature = async (name, fn) => {
  activeFeature = name;
  const started = Date.now();
  let status = 'passed';
  let error = null;
  try {
    await fn();
    if (pageErrors.length) {
      throw new Error('Runtime page error(s): ' + pageErrors.join(' | '));
    }
  } catch (e) {
    status = 'failed';
    error = e instanceof Error ? e.stack || e.message : String(e);
    try {
      await shot('FAIL-' + name.replace(/[^a-z0-9]+/gi, '-').toLowerCase());
    } catch {}
  }
  report.features.push({
    name,
    status,
    durationMs: Date.now() - started,
    error,
  });
};

await feature('mobile-shell-and-3d-anatomy', async () => {
  await goto('/simulator');

  const tab3d = page.getByTestId('simulator-tab-3d');
  const tabMonitor = page.getByTestId('simulator-tab-monitor');
  const tabCase = page.getByTestId('simulator-tab-case');
  await touchSafe(tab3d, '3D tab');
  await touchSafe(tabMonitor, 'Monitor tab');
  await touchSafe(tabCase, 'Case tab');

  const stage = page.getByTestId('mobile-anatomy-stage');
  await visible(stage, 'mobile anatomy stage');
  assert(!(await page.getByTestId('mobile-monitor-stage').isVisible()), 'Monitor stage should be hidden on initial 3D tab');
  assert(!(await page.getByTestId('intervention-panel').isVisible()), 'Intervention panel should be hidden on initial 3D tab');

  const toolbar = page.getByTestId('dissection-toolbar');
  await visible(toolbar, 'dissection toolbar');

  for (const id of ['inspect', 'scalpel', 'isolate']) {
    const control = page.getByTestId('dissection-mode-' + id);
    await touchSafe(control, 'dissection mode ' + id);
    await control.click();
  }

  const xray = page.getByTestId('dissection-xray');
  await touchSafe(xray, 'X-Ray control');
  await xray.click();
  assert((await xray.getAttribute('class') || '').includes('bg-cyan-500'), 'X-Ray control did not enter active state');

  const depth = page.getByTestId('dissection-depth');
  await depth.evaluate((el) => {
    el.value = '0.68';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  assert(Number(await depth.inputValue()) > 0.6, 'Depth peel slider did not update');

  const canvas = stage.locator('canvas').first();
  const box = await visible(canvas, '3D anatomy canvas');
  assert(box.height >= 300, '3D anatomy canvas is too short on mobile');

  const stageBox = await stage.boundingBox();
  assert(stageBox && stageBox.height >= 340, '3D stage did not preserve its mobile minimum height');

  await documentFits('3D anatomy');
  await shot('01-3d-anatomy');
});

await feature('stomach-uses-verified-z-anatomy', async () => {
  await goto('/simulator');

  const stomach = page.getByTestId('deep-inspector-stomach');
  await visible(stomach, 'Stomach deep inspector button');
  await stomach.click();

  await visible(
    page.getByText('Isolated: ZA STOMACH OVERVIEW', { exact: true }),
    'preferred stomach isolation status'
  );

  // The source model is local to the production build. A missing/corrupt GLB
  // must fail this feature instead of silently leaving the rough body-atlas
  // stomach on screen.
  await page.waitForFunction(
    () => !document.body.innerText.includes('LOADING Z-ANATOMY REFERENCE…'),
    { timeout: 15000 }
  );
  const bodyText = (await page.locator('body').textContent()) || '';
  assert(
    !/Z-Anatomy reference model failed to load/i.test(bodyText),
    'Stomach Z-Anatomy reference failed to load'
  );

  await documentFits('Z-Anatomy stomach');
  await shot('01b-stomach-zanatomy');

  // The same inspector button must restore the full body even though the
  // active isolation id is the source-specific za_stomach_overview target.
  await stomach.click();
  assert(
    !(await page.getByText('Isolated: ZA STOMACH OVERVIEW', { exact: true }).isVisible()),
    'Stomach inspector did not toggle the source-backed isolate off'
  );
});

await feature('icu-monitor', async () => {
  await goto('/simulator');
  await page.getByTestId('simulator-tab-monitor').click();

  const monitor = page.getByTestId('icu-monitor');
  await visible(monitor, 'ICU monitor');
  assert(!(await page.getByTestId('mobile-anatomy-stage').isVisible()), 'Anatomy stage should hide on Monitor tab');

  for (const label of ['ECG / HR', 'NIBP / ART', 'SPO2', 'RESP / ETCO2']) {
    await visible(page.getByText(label, { exact: true }), 'ICU label ' + label);
  }
  await visible(monitor.locator('canvas').first(), 'ICU waveform canvas');

  const tone = monitor.getByRole('button', { name: /Muted|Tone ON/ });
  await touchSafe(tone, 'ICU tone control');
  await tone.click();

  const tutorial = monitor.getByRole('button', { name: /Tutorial/ }).first();
  await touchSafe(tutorial, 'ICU tutorial control');
  await tutorial.click();
  await visible(page.getByText('12-Lead ECG & ICU Telemetry Masterclass', { exact: true }), 'ICU tutorial modal');
  const closeTutorial = page.getByRole('button', { name: 'Close ECG tutorial' });
  await touchSafe(closeTutorial, 'ECG tutorial close');
  await closeTutorial.click();

  await documentFits('ICU monitor');
  await shot('02-icu-monitor');
});

await feature('case-library-layers-diagnostics-and-intervention', async () => {
  await goto('/simulator');
  await page.getByTestId('simulator-tab-case').click();

  const panel = page.getByTestId('intervention-panel');
  await visible(panel, 'intervention panel');
  assert(!(await page.getByTestId('mobile-anatomy-stage').isVisible()), 'Anatomy stage should hide on Case tab');

  const select = page.getByTestId('scenario-select');
  await visible(select, 'scenario selector');
  const optionCount = await select.locator('option').count();
  assert(optionCount >= 20, 'Scenario selector exposed only ' + optionCount + ' cases');
  const secondValue = await select.locator('option').nth(1).getAttribute('value');
  assert(secondValue, 'Second scenario has no value');
  await select.selectOption(secondValue);
  assert((await select.inputValue()) === secondValue, 'Scenario selector did not change case');

  const vascular = page.getByTestId('layer-vascular');
  await touchSafe(vascular, 'Vascular layer control');
  await vascular.click();
  const vascularClass = await vascular.getAttribute('class') || '';
  assert(/bg-sky-600|bg-cyan-500/.test(vascularClass), 'Vascular layer did not enter active state');

  const pupilLauncher = page.getByTestId('open-tool-pupil');
  await touchSafe(pupilLauncher, 'Pupil launcher');
  await pupilLauncher.click();
  await visible(page.getByTestId('diagnostic-pupil'), 'Pupil diagnostic modal launched from Case');
  await page.getByRole('button', { name: 'Close diagnostic tool' }).click();

  const log = page.getByTestId('clinical-event-log');
  const before = (await log.textContent()) || '';
  const saline = page.getByTestId('intervention-saline');
  await touchSafe(saline, 'IV Saline intervention');
  await saline.click();
  await page.waitForTimeout(200);
  const after = (await log.textContent()) || '';
  assert(after !== before, 'Clinical event log did not change after IV Saline intervention');

  await documentFits('Case and intervention panel');
  await shot('03-case-and-interventions');
});

await feature('pupillometer', async () => {
  await goto('/simulator?tool=pupil');
  const modal = page.getByTestId('diagnostic-pupil');
  await visible(modal, 'pupillometer modal');

  const close = page.getByRole('button', { name: 'Close diagnostic tool' });
  await touchSafe(close, 'diagnostic close');

  const left = modal.getByRole('button', { name: /Left Eye/ });
  const right = modal.getByRole('button', { name: /Right Eye/ });
  const both = modal.getByRole('button', { name: /Both Eyes/ });
  const off = modal.getByRole('button', { name: 'Off', exact: true });
  for (const [locator, label] of [[left, 'left penlight'], [right, 'right penlight'], [both, 'both penlights'], [off, 'penlight off']]) {
    await touchSafe(locator, label);
  }

  await left.click();
  assert((await left.getAttribute('class') || '').includes('bg-amber-400'), 'Left pupil stimulus did not become active');
  await right.click();
  assert((await right.getAttribute('class') || '').includes('bg-amber-400'), 'Right pupil stimulus did not become active');
  await both.click();
  assert((await both.getAttribute('class') || '').includes('bg-amber-400'), 'Bilateral pupil stimulus did not become active');
  await off.click();

  const mmReadouts = await modal.locator('text=/\\d+\\.\\d+ mm/').count();
  assert(mmReadouts >= 2, 'Pupil size readouts are missing');

  await documentFits('Pupillometer');
  await shot('04-pupillometer');
});

await feature('pocus', async () => {
  await goto('/simulator?tool=ultrasound');
  const modal = page.getByTestId('diagnostic-ultrasound');
  await visible(modal, 'POCUS modal');

  const canvas = page.getByTestId('pocus-canvas');
  const canvasBox = await visible(canvas, 'POCUS canvas');
  assert(canvasBox.width >= 300 && canvasBox.height >= 300, 'POCUS canvas is not large enough on mobile');

  const freeze = modal.getByRole('button', { name: 'Freeze', exact: true });
  const mmode = modal.getByRole('button', { name: 'M-Mode', exact: true });
  const doppler = modal.getByRole('button', { name: 'Doppler', exact: true });
  const caliper = modal.getByRole('button', { name: 'Caliper', exact: true });
  for (const [locator, label] of [[freeze, 'POCUS Freeze'], [mmode, 'POCUS M-Mode'], [doppler, 'POCUS Doppler'], [caliper, 'POCUS Caliper']]) {
    await touchSafe(locator, label);
  }

  await freeze.click();
  await visible(modal.getByRole('button', { name: 'Unfreeze', exact: true }), 'POCUS Unfreeze state');
  await mmode.click();
  assert((await mmode.getAttribute('class') || '').includes('bg-amber-400'), 'M-Mode did not activate');
  await doppler.click();
  assert((await doppler.getAttribute('class') || '').includes('bg-blue-600'), 'Color Doppler did not activate');

  await modal.getByRole('button', { name: /Subxiphoid 4-Chamber/ }).click();
  await modal.getByRole('button', { name: /eFAST Morison/ }).click();
  await modal.getByRole('button', { name: /Lung Ultrasound/ }).click();
  await modal.getByRole('button', { name: /Parasternal Long/ }).click();

  await caliper.click();
  const cbox = await canvas.boundingBox();
  assert(cbox, 'POCUS canvas disappeared during caliper test');
  await canvas.click({ position: { x: Math.round(cbox.width * 0.35), y: Math.round(cbox.height * 0.45) } });
  await canvas.click({ position: { x: Math.round(cbox.width * 0.62), y: Math.round(cbox.height * 0.58) } });
  await visible(modal.getByRole('button', { name: 'Reset Caliper', exact: true }), 'POCUS caliper measured state');

  const ranges = modal.locator('input[type="range"]');
  assert((await ranges.count()) >= 2, 'POCUS gain/depth controls are missing');
  await ranges.nth(0).evaluate((el) => {
    el.value = '1.35';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await documentFits('POCUS');
  await shot('05-pocus');
});

await feature('stethoscope-and-auscultation', async () => {
  await goto('/simulator?tool=stethoscope');
  const modal = page.getByTestId('diagnostic-stethoscope');
  await visible(modal, 'stethoscope modal');

  const bell = modal.getByRole('button', { name: /Bell/ });
  const diaphragm = modal.getByRole('button', { name: /Diaphragm/ });
  await touchSafe(bell, 'Stethoscope bell');
  await touchSafe(diaphragm, 'Stethoscope diaphragm');
  await bell.click();
  assert((await bell.getAttribute('class') || '').includes('bg-amber-400'), 'Bell mode did not activate');

  const aortic = modal.getByRole('button', { name: /Aortic Area/ });
  const lungBases = modal.getByRole('button', { name: /Lung Bases/ });
  await touchSafe(aortic, 'Aortic auscultation site');
  await touchSafe(lungBases, 'Lung bases auscultation site');
  await aortic.click();

  const stenosis = modal.getByRole('button', { name: /Aortic Stenosis/ });
  await touchSafe(stenosis, 'Aortic stenosis sound preset');
  await stenosis.click();

  const listen = modal.getByRole('button', { name: /Place Stethoscope & Listen Live/ });
  await touchSafe(listen, 'Live stethoscope control');
  await listen.click();
  await visible(modal.getByRole('button', { name: /Stop Stethoscope/ }), 'Stethoscope listening state');
  await page.waitForTimeout(250);
  await modal.getByRole('button', { name: /Stop Stethoscope/ }).click();

  await lungBases.click();
  const bodyText = (await modal.textContent()) || '';
  assert(/LUNG BASES/i.test(bodyText), 'Stethoscope site state did not change to lung bases');

  await documentFits('Stethoscope');
  await shot('06-stethoscope');
});

await feature('twelve-lead-ecg', async () => {
  await goto('/simulator?tool=ecg12');
  const modal = page.getByTestId('diagnostic-ecg12');
  await visible(modal, '12-lead ECG modal');

  const canvas = page.getByTestId('ecg-12lead-canvas');
  const canvasBox = await visible(canvas, '12-lead ECG canvas');
  const waveTitle = page.getByText('Wave Guide', { exact: true });
  const waveBox = await visible(waveTitle, 'Wave Guide');
  assert(canvasBox.y < waveBox.y, 'ECG canvas is not visually prioritized above Wave Guide on mobile');

  const parentScroll = await canvas.evaluate((el) => {
    const p = el.parentElement;
    return p ? { scrollWidth: p.scrollWidth, clientWidth: p.clientWidth } : null;
  });
  assert(parentScroll && parentScroll.scrollWidth > parentScroll.clientWidth, 'ECG tracing is not horizontally inspectable on mobile');

  for (const name of ['All', 'P', 'PR', 'QRS', 'ST', 'T', 'QT']) {
    await touchSafe(modal.getByRole('button', { name, exact: true }), 'ECG chip ' + name);
  }

  await modal.getByRole('button', { name: 'P', exact: true }).click();
  await visible(page.getByText(/P Wave — Electrophysiological/), 'P-wave teaching panel');

  const tour = modal.getByRole('button', { name: 'Tour', exact: true });
  await touchSafe(tour, 'ECG Tour');
  await tour.click();
  await visible(modal.getByRole('button', { name: 'Pause', exact: true }), 'ECG Tour running state');
  await modal.getByRole('button', { name: 'Pause', exact: true }).click();

  const master = modal.getByRole('button', { name: /Tutorial/ }).first();
  await touchSafe(master, '12-lead master tutorial');
  await master.click();
  await visible(page.getByText('12-Lead ECG & ICU Telemetry Masterclass', { exact: true }), '12-lead tutorial');
  await page.getByRole('button', { name: 'Close ECG tutorial' }).click();

  await documentFits('12-lead ECG');
  await shot('07-12-lead-ecg');
});

await feature('bedside-piccled-examination', async () => {
  await goto('/simulator?tool=piccled');
  const modal = page.getByTestId('ward-exam-modal');
  await visible(modal, 'PICCLED bedside modal');

  const tabs = ['edema', 'icterus', 'pallor', 'ascites'];
  for (const id of tabs) {
    await touchSafe(page.getByTestId('ward-tab-' + id), 'Ward tab ' + id);
  }

  const pressLabel = page.getByText('Press & Hold Thumb', { exact: true });
  const pressPad = pressLabel.locator('..');
  const pbox = await visible(pressPad, 'Pitting edema press pad');
  await page.mouse.move(pbox.x + pbox.width / 2, pbox.y + pbox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(650);
  const duringPress = (await modal.textContent()) || '';
  assert(/s \/ 10s/.test(duringPress), 'Pitting edema hold timer did not run');
  await page.mouse.up();

  await page.getByTestId('ward-tab-icterus').click();
  assert((await page.getByTestId('ward-tab-icterus').getAttribute('class') || '').includes('bg-emerald-500'), 'Icterus tab did not activate');
  await visible(page.getByText(/Superior Bulbar Sclera/), 'Icterus inspection');

  await page.getByTestId('ward-tab-pallor').click();
  assert((await page.getByTestId('ward-tab-pallor').getAttribute('class') || '').includes('bg-emerald-500'), 'Pallor tab did not activate');

  await page.getByTestId('ward-tab-ascites').click();
  assert((await page.getByTestId('ward-tab-ascites').getAttribute('class') || '').includes('bg-emerald-500'), 'Ascites tab did not activate');
  await visible(page.getByText(/Shifting Dullness Examination/), 'Shifting dullness simulator');
  const roll = page.getByRole('button', { name: /Roll Patient to 45/ });
  await touchSafe(roll, 'Roll patient control');
  await roll.click();
  await visible(page.getByRole('button', { name: /Patient in 45/ }), 'Patient roll state');

  await documentFits('PICCLED bedside examination');
  await shot('08-piccled');
});

await feature('organ-drawer-and-anatomy-dossier', async () => {
  await goto('/simulator?organ=heart');
  const drawer = page.getByTestId('organ-detail-drawer');
  await visible(drawer, 'organ detail drawer');
  await visible(drawer.getByRole('heading', { name: /Heart/i }).first(), 'Heart dossier heading');

  const expand = page.getByTitle('Expand full sheet');
  await touchSafe(expand, 'Organ drawer expand');
  await expand.click();
  const expandedBox = await drawer.boundingBox();
  assert(expandedBox && expandedBox.height >= 700, 'Expanded organ drawer is too short on a 844px viewport');

  const tabs = [
    /Overview & Graph/,
    /Vessels & Nerves/,
    /6-Vector Relations/,
    /Bedside & NMC Viva/,
    /Lymph & Surgery/,
  ];
  for (const name of tabs) {
    const tab = drawer.getByRole('button', { name });
    await touchSafe(tab, 'Organ drawer tab ' + name);
    await tab.click();
  }

  const focus3d = drawer.getByTitle('Center and zoom 3D Viewport');
  await touchSafe(focus3d, 'Focus 3D control');
  await focus3d.click();

  const isolate = page.locator('#drawer-isolate-btn');
  await touchSafe(isolate, 'Organ isolate control');
  await isolate.click();
  assert((await isolate.getAttribute('title') || '').includes('Restore full anatomy view'), 'Organ isolation did not enter active state');
  await isolate.click();

  const close = drawer.getByTitle('Close Drawer');
  await touchSafe(close, 'Organ drawer close');
  await close.click();
  await drawer.waitFor({ state: 'detached' });

  await documentFits('Organ dossier');
  await shot('09-organ-dossier');
});

await feature('representative-organ-routes', async () => {
  const organs = ['brain', 'liver', 'kidney', 'peripheral_nerves', 'sciatic_nerve'];
  for (const organ of organs) {
    await goto('/simulator?organ=' + encodeURIComponent(organ));
    const drawer = page.getByTestId('organ-detail-drawer');
    await visible(drawer, organ + ' dossier');
    const text = ((await drawer.textContent()) || '').toLowerCase();
    assert(!text.includes('unable to load'), organ + ' dossier reported a load failure');
    await documentFits(organ + ' dossier');
  }
  await shot('10-representative-organs');
});

report.finishedAt = new Date().toISOString();
report.summary = {
  passed: report.features.filter((f) => f.status === 'passed').length,
  failed: report.features.filter((f) => f.status === 'failed').length,
  warnings: report.warnings.length,
};

fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

console.log('\nORBIT patient simulator mobile E2E');
for (const f of report.features) {
  console.log((f.status === 'passed' ? '  ✓ ' : '  ✗ ') + f.name + ' (' + f.durationMs + ' ms)');
  if (f.error) console.log('    ' + f.error.split('\n')[0]);
}
if (report.warnings.length) console.log('  warnings: ' + report.warnings.length);
console.log('  passed: ' + report.summary.passed + ', failed: ' + report.summary.failed);

await browser.close();

if (report.summary.failed > 0) process.exit(1);
