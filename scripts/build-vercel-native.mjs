import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Build the unchanged simulator/document app, then give the homepage to the
// native browser build. Separate bundles keep React 18 and 19 isolated.
execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
fs.copyFileSync('dist/index.html', 'dist/legacy.html');
execFileSync('npm', ['--prefix', 'mobile', 'run', 'web:build'], { stdio: 'inherit' });
fs.cpSync('dist-native', 'dist', { recursive: true });
const assets = fs.readdirSync('dist-native/assets').map(name => `/assets/${name}`);
fs.writeFileSync('dist/orbit-offline-assets.json', JSON.stringify(['/index.html', '/legacy.html', ...assets]));
console.log(`Native homepage and unchanged simulator assembled; ${assets.length} native assets prepared for offline use.`);
