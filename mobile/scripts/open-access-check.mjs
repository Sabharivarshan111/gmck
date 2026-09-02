// Anyone can read every question on the web app, without an account.
//
// The web app used to put a card reading "We've crossed 1000+ users — to
// prevent spam, you're requested to sign in with Google" in place of the
// question list for every reader without a session. It was not a soft prompt:
// `BrowseTab` rendered the gate *instead of* the questions, so a student who
// opened a topic saw a sign-in wall where the bank should have been. The app
// owner asked for it gone.
//
// A gate is the kind of thing that comes back — it is one `isAnonymous ? …`
// away — and it fails silently for whoever is signed in, which includes
// everyone who would notice. So this drives the real built app down to a real
// question list and asserts there is no sign-in wall in front of it.
//
//   node scripts/open-access-check.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..', '..');
const dist = path.join(repo, 'dist');

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// ------------------------------------------------------------------ source

const src = path.join(repo, 'src');
for (const gone of [
  'components/GoogleGateCard.tsx',
  'components/progress/GoogleSyncButton.tsx',
  'components/progress/EmailSyncButton.tsx',
]) {
  check(
    !fs.existsSync(path.join(src, gone)),
    `${gone} is back — the sign-in UI was removed on the owner's instruction`,
  );
}

const browseTab = fs.readFileSync(
  path.join(src, 'components/shell/BrowseTab.tsx'),
  'utf8',
);
check(
  !/isAnonymous/.test(browseTab),
  'BrowseTab is branching on isAnonymous again — that is the shape the reading gate had',
);

// ----------------------------------------------------------------- browser

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  await new Promise((resolve, reject) => {
    const build = spawn('npm', ['run', 'build'], { cwd: repo, stdio: 'ignore' });
    build.on('exit', c => (c === 0 ? resolve() : reject(new Error('vite build failed'))));
  });
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.json': 'application/json',
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let file = path.join(dist, url.pathname);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(dist, 'index.html');
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const entries = fs.readdirSync('/opt/pw-browsers');
const [chrome] = entries.filter(e => e.startsWith('chromium-')).sort().reverse();
const browser = await chromium.launch({
  headless: true,
  executablePath: `/opt/pw-browsers/${chrome}/chrome-linux/chrome`,
  args: ['--no-sandbox', '--disable-gpu', '--headless=new'],
});
const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });

// No session, no network. A reader with neither is exactly the case the gate
// used to catch.
await page.route('**/*.supabase.co/**', route =>
  route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
);

await page.goto(origin, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

const dismiss = async () => {
  for (const label of ['Skip tour', 'OK, continue']) {
    const button = page.getByText(label, { exact: true });
    if (await button.count()) {
      await button.first().click().catch(() => {});
      await page.waitForTimeout(600);
    }
  }
};
await dismiss();

for (const name of ['PHARMACOLOGY', 'Paper 1', 'General Pharmacology']) {
  const target = page.getByText(new RegExp(`^${name}$`, 'i')).first();
  if (await target.count()) {
    await target.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(1000);
  }
  const body = await page.evaluate(() => document.body.innerText);
  if (/Essays/.test(body) && /Short Notes/.test(body)) break;
}
await dismiss();

const body = await page.evaluate(() => document.body.innerText);
check(
  /Essays/.test(body) && /Short Notes/.test(body),
  'could not reach a question list at all — the walk down to General Pharmacology did not arrive',
);
check(
  /Triple tap/.test(body) || /DOUBLE TAP FOR MCQS/.test(body),
  'the question list is empty — reaching the screen is not the same as the questions being on it',
);
check(
  !/Sign in with Google/i.test(body),
  'a "Sign in with Google" prompt is in front of the questions again',
);
check(
  !/1000\+ users/i.test(body),
  'the spam-prevention sign-in card is back in front of the question list',
);

fs.mkdirSync(path.join(repo, 'screenshots'), { recursive: true });
await page.screenshot({ path: path.join(repo, 'screenshots', 'web-no-gate.png') });

await browser.close();
server.close();

if (failures.length > 0) {
  process.stdout.write('FAIL  open access\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exit(1);
}
process.stdout.write(
  'OK    a reader with no account reaches the questions, with no sign-in wall\n',
);
