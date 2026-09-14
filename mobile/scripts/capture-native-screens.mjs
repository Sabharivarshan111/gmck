import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const mobileDir = path.resolve(here, '..');
const artifactDir = '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4';
const screenshotsDir = path.join(mobileDir, 'screenshots');

await fs.mkdir(artifactDir, { recursive: true });
await fs.mkdir(screenshotsDir, { recursive: true });

const server = await createServer({
  configFile: path.join(mobileDir, 'preview', 'vite.config.ts'),
  server: { port: 5299, strictPort: true },
  logLevel: 'error',
});
await server.listen();
console.log('Vite preview server listening on http://localhost:5299');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

const targets = [
  {
    name: 'v18_to_v19_update_modal',
    url: 'http://localhost:5299/?screen=native-update',
    width: 412,
    height: 915,
  },
  {
    name: 'notes_attachment_layout',
    url: 'http://localhost:5299/?screen=native-notes',
    width: 412,
    height: 915,
  },
  {
    name: 'textbook_delete_permissions',
    url: 'http://localhost:5299/?screen=native-pageref',
    width: 412,
    height: 915,
  },
];

for (const target of targets) {
  const page = await browser.newPage({
    viewport: { width: target.width, height: target.height },
    deviceScaleFactor: 2,
  });

  console.log(`Loading ${target.url}...`);
  await page.goto(target.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const artifactPath = path.join(artifactDir, `${target.name}.png`);
  const repoPath = path.join(screenshotsDir, `${target.name}.png`);

  await page.screenshot({ path: artifactPath });
  console.log(`Saved artifact: ${artifactPath}`);

  await page.screenshot({ path: repoPath });
  console.log(`Saved repo screenshot: ${repoPath}`);

  await page.close();
}

await browser.close();
await server.close();
console.log('All native Android app screenshots captured successfully!');
