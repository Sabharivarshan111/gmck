import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Build the unchanged simulator/document app, then give the homepage to the
// native browser build. Separate bundles keep React 18 and 19 isolated.
execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
fs.copyFileSync('dist/index.html', 'dist/legacy.html');
execFileSync('npm', ['--prefix', 'mobile', 'run', 'web:build'], { stdio: 'inherit' });
fs.cpSync('dist-native', 'dist', { recursive: true });
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
fs.writeFileSync('dist/orbit-offline-assets.json', JSON.stringify(['/index.html', '/legacy.html', ...assets]));
console.log(`Native homepage and unchanged simulator assembled; ${assets.length} native assets prepared for offline use.`);
