import assert from 'node:assert/strict';
import { simulatorNavigation } from '../src/lib/simulatorNavigation.ts';
for (const [url, action] of [
  ['https://orbitmbbs.vercel.app/simulator', 'allow'],
  ['https://orbitmbbs.vercel.app/simulator?tool=stethoscope', 'allow'],
  ['https://orbitmbbs.vercel.app/simulator/anatomy', 'allow'],
  ['https://orbitmbbs.vercel.app/notes', 'vault'],
  ['https://orbitmbbs.vercel.app/', 'vault'],
  ['https://orbitmbbs.vercel.app/settings', 'block'],
  ['https://orbitmbbs.vercel.app.evil.example/simulator', 'external'],
  ['https://commons.wikimedia.org/wiki/File:Heart.jpg', 'external'],
  ['http://orbitmbbs.vercel.app/simulator', 'block'],
  ['javascript:alert(1)', 'block'],
  ['file:///data/user/0/example', 'block'],
  ['intent://example', 'block'],
  ['malformed', 'block'],
  ['about:blank', 'allow'],
]) assert.equal(simulatorNavigation(url), action, url);
console.log('Simulator: 14 native navigation cases passed.');
