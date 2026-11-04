/** Real production UI and compressed practice data; provider entitlement responses are isolated fixtures. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';
import {chromium} from 'playwright-core';
import {installPremiumTestAccount} from './test-premium-fixture.mjs';

const repo = path.resolve(import.meta.dirname, '../..');
const base = 'http://127.0.0.1:5261';
const evidence = process.env.PRACTICE_UI_EVIDENCE || '/tmp/orbit-practice-evidence';
await fs.mkdir(evidence, {recursive: true});
const manifest = JSON.parse(await fs.readFile(path.join(repo, 'public/pg/manifest.json')));
const pack = manifest.packs[0];
const data = JSON.parse(zlib.zstdDecompressSync(await fs.readFile(path.join(repo, 'public/pg', `${pack.id}-${pack.sha256.slice(0,12)}.zst`))));
const chapter = pack.chapters.find(item => item.count > 0);
const rawIndex = data.rows.findIndex(row => data.chapters[row[7]] === chapter.name);
const original = data.rows[rawIndex];
const id = `medmcqa-practice-${pack.id}-${original[8] ?? rawIndex}`;
const server = http.createServer(async (req, res) => {
  try {
    let pathname = new URL(req.url, base).pathname;
    if (!path.extname(pathname)) pathname = '/index.html';
    const file = path.join(repo, 'dist', pathname);
    res.setHeader('Content-Type', ({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.zst':'application/octet-stream'})[path.extname(file)] || 'application/octet-stream');
    res.end(await fs.readFile(file));
  } catch {res.writeHead(404);res.end();}
});
await new Promise(resolve => server.listen(5261, '127.0.0.1', resolve));
const browser = await chromium.launch({executablePath: process.env.CHROME_PATH, args:['--no-sandbox','--disable-dev-shm-usage']});
const context = await browser.newContext({viewport:{width:390,height:844}, isMobile:true, hasTouch:true});
const prepare = async ctx => {
  await ctx.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
  await ctx.addInitScript(() => {
    localStorage.setItem('orbit-profile-v1', JSON.stringify({display_name:'Practice tester',year:'second',university:'tnmgr'}));
    localStorage.setItem('orbit:tour-v1',JSON.stringify({seen:1}));
    localStorage.setItem('orbit:last-run-version','28');
  });
};
await prepare(context);
await installPremiumTestAccount(context);
const page = await context.newPage();
page.setDefaultTimeout(30000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const label = name => page.getByLabel(name, {exact:true});
const open = async () => {
  await page.goto(base + '/notes');
  await label('NEET-PG practice questions').click();
  for (const name of ['NEET-PG','AIIMS PG','INI-CET']) await label('Open ' + name + ' practice').waitFor();
  await label('Open chapter-wise practice questions').waitFor();
  await label('Open chapter-wise practice questions').click();
  await label(pack.subject + ' (' + pack.count.toLocaleString() + ')').click();
  await label(chapter.name + ' (' + chapter.count.toLocaleString() + ')').click();
  await label(original[0]).click();
};
try {
  await open();
  for (let index = 0; index < 4; index++) await label('Option ' + 'ABCD'[index] + ': ' + original[index + 1]).waitFor();
  await label('Option A: ' + original[1]).click();
  await label('Show supplied answer').click();
  await page.getByText('Answer: ' + 'ABCD'[original[5]],{exact:true}).waitFor();
  await page.getByText(original[6] || 'No explanation is available in this source record.',{exact:true}).waitFor();
  await label('Save practice question').click();
  await label('Unsave practice question').waitFor();
  await page.waitForFunction(id => JSON.parse(localStorage.getItem('orbit:medmcqa:saved:v1') || '[]').includes(id), id);
  for (const width of [360,390,768]) {
    await page.setViewportSize({width,height:932});
    const button = await label('Show supplied answer').or(label('Hide supplied answer')).boundingBox();
    assert.ok(button && button.x >= 0 && button.x + button.width <= width + 1 && button.height >= 44);
  }
  await page.screenshot({path:path.join(evidence,'practice-answer.png')});
  await open();
  await label('Unsave practice question').waitFor();
  await label('Back to practice questions').click();
  await label('Back to practice subjects').click();
  await label('Search MedMCQA practice questions').fill('the');
  await label('Search practice').click();
  await label('Next practice page').waitFor();
  await page.waitForFunction(() => !document.querySelector('[aria-label="Loading practice questions"]'));
  assert.equal(await label('Next practice page').isDisabled(), false);
  await label(data.rows[0][0]).first().waitFor();
  const firstPage = await page.locator('[role="button"]').allTextContents();
  await label('Next practice page').click();
  await label(data.rows[30][0]).first().waitFor();
  await page.waitForFunction(() => !document.querySelector('[aria-label="Loading practice questions"]'));
  assert.notDeepEqual(await page.locator('[role="button"]').allTextContents(), firstPage);
  await page.screenshot({path:path.join(evidence,'practice-library.png')});
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, {timeout:120000});
  await context.setOffline(true);
  await open();
  await label('Unsave practice question').waitFor();
  await label('Show supplied answer').click();
  await page.getByText('Answer: ' + 'ABCD'[original[5]], {exact:true}).waitFor();
  assert.deepEqual(errors, []);
  const free = await browser.newContext({viewport:{width:390,height:844}});
  await prepare(free);
  const guest = await free.newPage();
  await guest.goto(base + '/notes');
  await guest.getByLabel('NEET-PG practice questions',{exact:true}).click();
  await guest.getByLabel('Open chapter-wise practice questions',{exact:true}).click();
  await guest.getByLabel('Unlock practice questions',{exact:true}).waitFor();
  assert.equal(await guest.getByLabel('Search MedMCQA practice questions',{exact:true}).count(),0);
  await free.close();
  console.log('PASS: real compressed chapter questions, intact A–D options and supplied key, answer reveal, bookmark/reload, paged search, 360/390/768 fit, offline reload, paid access and guest denial. No live backend requests.');
} catch (error) {
  await page.screenshot({path:path.join(evidence,'failure.png')});
  console.error((await page.locator('body').innerText()).slice(-3500));
  throw error;
} finally {await context.close();await browser.close();await new Promise(resolve => server.close(resolve));}
