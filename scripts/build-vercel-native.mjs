import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';


execFileSync('node', ['scripts/build-pg-compact.mjs'], { stdio: 'inherit' });
execFileSync('node', ['scripts/check-pg-release-content.mjs'], { stdio: 'inherit' });

// Build the unchanged simulator/document app, then give the homepage to the
// native browser build. Separate bundles keep React 18 and 19 isolated.
execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
fs.copyFileSync('dist/index.html', 'dist/legacy.html');
execFileSync('npm', ['--prefix', 'mobile', 'run', 'web:build'], { stdio: 'inherit' });
fs.cpSync('dist-native', 'dist', { recursive: true });

// Installed PWAs must retire the old code cache when either app changes.
// Derive the revision from the assembled shells and content-hashed asset names.
const cacheRevision = createHash('sha256')
  .update(fs.readFileSync('dist/index.html'))
  .update(fs.readFileSync('dist/legacy.html'))
  .update(fs.readdirSync('dist/assets').sort().join('\n'))
  .digest('hex').slice(0, 16);
const workerPath = 'dist/sw.js';
const worker = fs.readFileSync(workerPath, 'utf8');
const version = worker.match(/const SW_VERSION = '([^']+)';/);
if (!version) throw new Error('Cannot version the offline app worker');
fs.writeFileSync(workerPath, worker.replace(version[0],
  `const SW_VERSION = '${version[1]}-assets-${cacheRevision}';`));

for (const directory of ['dist/assets','dist-native/assets']) {
  for (const name of fs.readdirSync(directory)) {
    if (/neet_pg_undated|general_medical_undated/.test(name)) throw new Error('Unapproved PG pack emitted: '+name);
    if (name.endsWith('.js') && /medmcqa-(?:train|validation)-/.test(fs.readFileSync(path.join(directory,name),'utf8'))) {
      throw new Error('Unapproved PG record payload emitted: '+name);
    }
  }
}
const assets = fs.readdirSync('dist-native/assets')
  .sort((a, b) => {
    // Cache study content and the actual app JS before bulky anatomical images.
    // Safari may enforce a smaller per-origin offline cache quota.
    const rank = name => /neet_pg_undated|general_medical_undated/.test(name) ? 0
      : /^(?:index|browser|sql|pdf|react)[-_].*\.(?:js|css)$/.test(name) ? 1
      : /\.(?:js|css)$/.test(name) ? 2 : 3;
    return rank(a) - rank(b) || a.localeCompare(b);
  })
  .map(name => `/assets/${name}`);
const practiceAssets = fs.readdirSync('dist/pg').filter(name => /\.(?:zst|json|txt)$/.test(name)).map(name => '/pg/' + name);
fs.writeFileSync('dist/orbit-offline-assets.json', JSON.stringify(['/index.html', '/legacy.html', ...assets, ...practiceAssets]));
console.log(`Native homepage and unchanged simulator assembled; ${assets.length} native assets prepared for offline use.`);
