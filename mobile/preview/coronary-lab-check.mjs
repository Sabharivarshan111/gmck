import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.env.CORONARY_SHOTS || '/tmp/orbit-coronary-shots';
await fs.mkdir(out, { recursive: true });
const server = await createServer({
  configFile: path.join(here, 'vite.config.ts'),
  server: { host: '127.0.0.1', port: 5277, strictPort: true },
  logLevel: 'error',
});
await server.listen();
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
try {
  for (const width of [360, 390, 430, 900]) {
    const page = await browser.newPage({
      viewport: { width, height: width === 900 ? 900 : 844 },
    });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5277/?screen=native-coronary');
    await page.getByTestId('native-coronary-lab').waitFor();
    await page.screenshot({
      path: path.join(out, `coronary-${width}-anatomy.png`),
    });
    const scene = page.getByTestId('coronary-anatomy-scene').first();
    const meshCount = await scene.locator('polygon').count();
    await page
      .getByRole('button', { name: 'Heart shell on', exact: true })
      .click();
    assert.ok(
      (await scene.locator('polygon').count()) < meshCount,
      'Heart shell actually hides',
    );
    await page
      .getByRole('button', { name: 'Heart shell off', exact: true })
      .click();
    assert.equal(await scene.locator('polygon').count(), meshCount);
    const slider = page.getByRole('slider', {
      name: 'Detector oblique angle',
      exact: true,
    });
    const box = await slider.boundingBox();
    assert.ok(box.y+box.height<=page.viewportSize().height,'Angle controls stay within portrait viewport');
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.5, {
      steps: 12,
    });
    await page.mouse.up();
    assert.notEqual(
      await page.getByTestId('coronary-angle-readout').innerText(),
      'LAO 45° · caudal 30°',
      'Dragging changes angle',
    );
    await page
      .getByRole('button', { name: 'Reset coronary lab', exact: true })
      .click();
    await page.getByRole('button', { name: 'Projection', exact: true }).click();
    const angle = page.getByTestId('coronary-angle-readout');
    await page
      .getByRole('button', { name: 'AP · neutral', exact: true })
      .click();
    await angle.filter({ hasText: 'AP · level' }).waitFor();
    await page.screenshot({
      path: path.join(out, `coronary-${width}-projection.png`),
    });
    // Keyboard accessible angle changes exercise the real shared sliders.
    const oblique = page.getByTestId('coronary-oblique-plus');
    await oblique.focus();
    await page.keyboard.press('Enter');
    await angle.filter({ hasText: 'LAO 1°' }).waitFor();
    await page
      .getByRole('button', { name: 'Coronary vessels', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Left dominant', exact: true })
      .click();
    await page
      .getByRole('button', {
        name: 'Select Posterior descending artery',
        exact: true,
      })
      .scrollIntoViewIfNeeded();
    await page
      .getByRole('button', {
        name: 'Select Posterior descending artery',
        exact: true,
      })
      .click();
    await page
      .getByRole('button', { name: 'Coronary learn', exact: true })
      .click();
    await page.getByTestId('coronary-foreshortening').waitFor();
    await page.screenshot({
      path: path.join(out, `coronary-${width}-learn.png`),
    });
    await page
      .getByRole('button', { name: 'Coronary challenge', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Answer: LAD', exact: true })
      .click();
    await page
      .getByText('Review the answer · Circumflex artery', { exact: true })
      .waitFor();
    await page
      .getByRole('button', { name: 'Next question', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Answer: It looks shorter', exact: true })
      .click();
    await page
      .getByText('Correct · It looks shorter', { exact: true })
      .waitFor();
    await page
      .getByRole('button', { name: 'Coronary learn', exact: true })
      .click();
    await page.getByRole('button', { name: 'C-arm', exact: true }).click();
    await page.screenshot({
      path: path.join(out, `coronary-${width}-room.png`),
    });
    await page
      .getByRole('button', { name: 'Switch lab to light theme', exact: true })
      .click();
    await page.screenshot({
      path: path.join(out, `coronary-${width}-light.png`),
    });
    await page
      .getByRole('button', { name: 'Reset coronary lab', exact: true })
      .click();
    await angle.filter({ hasText: 'LAO 45° · caudal 30°' }).waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      'No page overflow',
    );
    await page.context().setOffline(true);
    await page
      .getByRole('button', { name: 'Coronary views', exact: true })
      .click();
    await page.getByRole('button', { name: 'RCA course', exact: true }).click();
    await angle.filter({ hasText: 'LAO 50° · level' }).waitFor();
    assert.deepEqual(errors, [], 'No uncaught runtime errors');
    await page.close();
    console.log(
      `${width}px: projections, keyboard angles, dominance/PDA, quiz feedback, C-arm, theme, reset, offline interactions PASS`,
    );
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:5277/?screen=native-clinical-studio');
  await page.getByRole('textbox', { name: 'Search skills' }).fill('coronary');
  await page.getByTestId('studio-native-skill-coronary').click();
  await page.getByTestId('native-coronary-lab').waitFor();
  await page
    .getByRole('button', { name: 'Back to clinical studio', exact: true })
    .click();
  await page.getByTestId('native-clinical-studio').waitFor();
  console.log(
    'Actual SimulatorScreen: discovery → native coronary tool → back PASS',
  );
  await page.goto('http://127.0.0.1:5277/?screen=native-coronary');
  await page.setViewportSize({ width: 844, height: 390 });
  await page.getByTestId('coronary-tilt-plus').scrollIntoViewIfNeeded();
  await page.getByTestId('coronary-tilt-plus').click();
  await page
    .getByTestId('coronary-angle-readout')
    .filter({ hasText: 'caudal 29°' })
    .waitFor();
  console.log('Short landscape: full console reachable by scrolling PASS');
  await page.close();
} finally {
  await browser.close();
  await server.close();
}
