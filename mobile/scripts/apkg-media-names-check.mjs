// Exercise the filename rule used by the shipped importer. These cases failed
// when a malformed character class turned every imported filename into "file".
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = fileURLToPath(new URL('../src/lib/importedDecks.ts', import.meta.url));
const source = readFileSync(file, 'utf8');
const functionText = source.match(/export function safeMediaName\(name: string\): string \{[\s\S]*?\n\}/)?.[0];
assert.ok(functionText, 'safeMediaName must remain testable');
const javascript = functionText.replace('export function safeMediaName(name: string): string', 'function safeMediaName(name)');
// This pure function has no React Native imports or filesystem side effects.
const safeMediaName = new Function(javascript + '\nreturn safeMediaName;')();

assert.equal(safeMediaName('photo.jpg'), 'photo.jpg');
assert.equal(safeMediaName('path/to/ECG [12].png'), 'ECG [12].png');
assert.equal(safeMediaName('folder\\xray%20image%231.png'), 'xray image1.png');
assert.equal(safeMediaName('scan+one.jpg'), 'scan one.jpg');
assert.equal(safeMediaName('../..'), 'file');
assert.ok(
  source.includes('encodeURIComponent(storedMediaName(name, mediaEntries, extractedByIndex))'),
  'reserved characters in an extracted image filename must be escaped in file URIs',
);
console.log('APKG image filename and URI checks passed');
