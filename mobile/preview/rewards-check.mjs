// Real ProgressScreen regression; preview rendering is not native device proof.
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(process.argv[2] ?? '/tmp/orbit-rewards-evidence');
await fs.mkdir(out, { recursive: true });
const server = await createServer({ configFile: path.join(here, 'vite.config.ts'),
  server: { host: '127.0.0.1', port: 5198, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader'],
});
try {
  for (const [days, earned] of [[29, 3], [30, 4], [100, 5]]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*.supabase.co/**', route => route.fulfill({ status: 401,
      contentType: 'application/json', body: '{"message":"No test session"}' }));
    await page.addInitScript(({ days }) => {
      const now = new Date();
      const day = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      localStorage.setItem('orbit-profile-v1', JSON.stringify({ display_name: 'Orbit', year: 'second', university: 'tnmgrmu', preparationGoal: 'both' }));
      localStorage.setItem('orbit:streak-v1', JSON.stringify({ current: days, best: days, lastActiveDay: day }));
      localStorage.setItem('orbit:daily-ad:progress', now.toISOString().slice(0,10));
    }, { days });
    await page.goto('http://localhost:5198/?screen=progress', { waitUntil: 'networkidle' });
    await page.getByText(`${days} day streak`, { exact: true }).waitFor();
    const header = page.getByRole('button', { name: 'Rewards', exact: true });
    assert.match(await header.innerText(), new RegExp(`${earned}\\s*/\\s*11`));
    await page.getByText(`STREAK BADGES · ${earned} / 5 unlocked`, { exact: true }).scrollIntoViewIfNeeded();
    for (const name of ['Spark', 'Blaze', 'Inferno']) {
      await page.getByRole('img', { name: new RegExp(`${name}, .* unlocked`) }).waitFor();
    }
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(out, `rewards-${days}-days.png`) });
    // A reload must derive the same rewards from persisted streak data.
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText(`${days} day streak`, { exact: true }).waitFor();
    assert.match(await page.getByRole('button', { name: 'Rewards', exact: true }).innerText(), new RegExp(`${earned}\\s*/\\s*11`));
    await context.close();
  }
  console.log('PASS real ProgressScreen: 29/30/100-day totals, earned badges and reload persistence');
} finally {
  await browser.close();
  await server.close();
}
