// Dump every line to be spoken, as JSON, for the Python synthesiser.
//
// The scripts are TypeScript (Node 22 strips the types natively) and edge-tts
// is Python, so this is the seam between them. One file, so there is exactly
// one place the two agree about what gets said.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Every script, from the one list that has them all — see preflight.mjs for
// why naming them here separately is the bug this replaces.
const { ALL_SCRIPTS } = await import(
  pathToFileURL(path.join(process.cwd(), 'src', 'scripts', 'index.ts')).href
);

const manifest = ALL_SCRIPTS.map((s) => ({
  id: s.id,
  voice: s.voice,
  rate: s.rate,
  pitch: s.pitch,
  lines: s.shots.map((shot) => ({
    name: `shot_${String(shot.n).padStart(2, '0')}`,
    text: shot.vo,
  })),
}));

const out = path.join(process.cwd(), 'public', 'audio');
await fs.mkdir(out, { recursive: true });
await fs.writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));

const total = manifest.reduce((n, s) => n + s.lines.length, 0);
process.stdout.write(`manifest written: ${manifest.length} ads, ${total} lines\n`);
