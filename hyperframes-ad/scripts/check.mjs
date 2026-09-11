/**
 * Build both films and put them through the HyperFrames gate.
 *
 * `hyperframes check` is the real one: it reruns `lint`, then opens a browser,
 * seeks the timeline, and audits runtime errors, failed requests, layout
 * overflow and WCAG contrast on actual rendered frames. It is the only check
 * here that can see a caption running out of its box, which is exactly the
 * class of bug that has reached a finished cut in this repo before.
 *
 *   node scripts/check.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env, HYPERFRAMES_NO_TELEMETRY: '1' };
const chrome = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
if (!env.HYPERFRAMES_BROWSER_PATH && fs.existsSync(chrome)) {
  env.HYPERFRAMES_BROWSER_PATH = chrome;
}
const run = (argv) => execFileSync(process.execPath, argv, { cwd: root, env, stdio: 'inherit' });

run(['scripts/build.mjs']);

const films = ['ask-it', 'the-year'].filter((f) =>
  fs.existsSync(path.join(root, f, 'index.html')),
);
if (films.length === 0) {
  throw new Error(
    'Neither film built. That is a missing screenshot, not a broken check — ' +
      'run `cd remotion-ad && npm run plates && npm run screens`.',
  );
}

for (const film of films) {
  process.stdout.write(`\n=== ${film}\n`);
  run(['node_modules/hyperframes/bin/hyperframes.mjs', 'check', film]);
}

if (films.length < 2) {
  process.stdout.write(
    `\nOnly ${films.join(', ')} was checked. The other film is missing a ` +
      'screenshot; see the build output above.\n',
  );
}
