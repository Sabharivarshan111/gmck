// Runs against an assembled native browser + simulator build or its preview deployment.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.ORBIT_STUDIO_BASE_URL || 'http://127.0.0.1:5225';
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [360, 390, 430]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/simulator`);
    await page.getByTestId('simulator-studio').waitFor();
    assert.equal(await page.getByLabel('Findings to show').inputValue(), 'normal');
    assert.equal(await page.locator('canvas').count(), 0, 'opening Skills must not instantiate the anatomy renderer');
    for (const [title, testId] of [['Auscultation','diagnostic-stethoscope'], ['12-lead ECG','diagnostic-ecg12'], ['Ultrasound / POCUS','diagnostic-ultrasound'], ['Pupil examination','diagnostic-pupil']]) {
      await page.getByRole('button', { name: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`) }).click();
      await page.getByTestId(testId).waitFor();
      if (title === 'Auscultation') {
        await page.getByRole('button', { name: 'Normal breath sounds', exact: true }).click();
        assert.equal(await page.locator('#ausc-lung-sound').inputValue(), 'vesicular');
        await page.getByRole('button', { name: 'Normal S1 / S2', exact: true }).click();
        assert.equal(await page.getByLabel('Sound demonstration').inputValue(), 'normal');
      }
      await page.getByLabel('Close diagnostic tool').click();
      await page.getByTestId(testId).waitFor({ state: 'hidden' });
    }
    await page.getByRole('button', { name: /^Clubbing Normal/ }).click();
    await page.getByRole('dialog', { name: 'Clubbing skill' }).waitFor();
    await page.getByRole('button', { name: 'Clubbing findings', exact: true }).click();
    const reference = page.locator('img[alt^="Clinical reference"]');
    await reference.waitFor({ state: 'visible' });
    assert.ok(await reference.evaluate(async img => { await img.decode(); return img.naturalWidth > 0; }), 'clinical photograph must load');
    await page.getByLabel('Close clubbing skill').click();
    await page.getByLabel('Change comparison findings').click();
    await page.getByLabel('Findings to show').selectOption('chf_dcm');
    await page.getByRole('button', { name: 'Return to normal baseline' }).click();
    assert.equal(await page.getByLabel('Findings to show').inputValue(), 'normal');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `horizontal overflow at ${width}`);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('Studio navigation, normal shortcuts, case reset and mobile widths passed.');
} finally { await browser.close(); }
