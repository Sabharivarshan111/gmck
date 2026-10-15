// Browser integration only. Actual native presentation is tested separately.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('mobile/android/app/build/generated/simulatorAssets/simulator');
let patientSnapshot;
const server = createServer(async (request, response) => {
  try {
    let file = resolve(root, '.' + new URL(request.url, 'http://localhost').pathname);
    if (!file.startsWith(root + '/')) file = resolve(root, 'index.html');
    if (!(await stat(file).catch(() => null))?.isFile()) file = resolve(root, 'index.html');
    let bytes = await readFile(file);
    if (file.endsWith('index.html') && patientSnapshot) {
      const safe = JSON.stringify(patientSnapshot).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e');
      bytes = Buffer.from(bytes.toString().replace('<head>', `<head><script type="application/json" id="orbit-native-patient">${safe}</script>`));
    }
    response.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json' })[extname(file)] || 'application/octet-stream');
    response.end(bytes);
  } catch (error) {
    response.writeHead(500).end(String(error));
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  for (const kind of ['icu', 'ecg']) {
    const page = await browser.newPage({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
    const messages = [], errors = [], models = [];
    page.on('console', message => messages.push(message.text()));
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = route.request().url();
      if (url.includes('/models/')) models.push(url);
      return url.startsWith(origin + '/') ? route.continue() : route.abort();
    });
    await page.goto(origin + '/simulator?' + (kind === 'icu' ? 'mode=telemetry' : 'tool=ecg12') + '&native_teaching=' + kind + '&nativeTheme=dark&scenario=normal');
    if (kind === 'icu') {
      await page.getByRole('dialog', { name: 'ECG learning studio' }).waitFor();
      await page.getByRole('button', { name: 'Leads & axis', exact: true }).click();
      await page.getByRole('heading', { name: 'One heart. Twelve views.', exact: true }).waitFor();
      await page.evaluate(() => window.__orbitPatientKernel.applyAction('saline'));
      await page.getByRole('button', { name: 'Close ECG tutorial', exact: true }).click();
    } else {
      await page.getByLabel('Static synthetic ECG with calibrated grid', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => window.__orbitPatientHydrated), true, 'Native patient HTML was not hydrated');
      assert.ok(await page.evaluate(() => window.__orbitPatientKernel.logs.some(log => /saline/i.test(log))), 'Treatment log was lost between teaching modules');
      await page.getByRole('button', { name: 'Close diagnostic tool', exact: true }).click();
    }
    await page.waitForTimeout(500);
    assert.deepEqual(errors, [], kind + ' runtime errors');
    assert.deepEqual(models, [], kind + ' allocated a hidden atlas');
    assert.ok(messages.some(message => message.startsWith('ORBIT_NATIVE_TEACHING_CLOSED:')), kind + ' close handshake missing');
    const snapshot = messages.filter(message => message.startsWith('ORBIT_NATIVE_PATIENT:')).at(-1);
    assert.ok(snapshot, kind + ' patient export missing');
    patientSnapshot = JSON.parse(snapshot.slice('ORBIT_NATIVE_PATIENT:'.length));
    console.log(`PASS browser integration: ${kind} mobile lesson, close handshake and patient export; no hidden atlas requests`);
    await page.close();
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
