// Refuse to render until every asset a script names actually exists.
//
// This exists because the previous cut shipped screens that had failed to load.
// A missing asset has to stop the build; it must never become a grey rectangle
// inside a finished ad.
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const registry = await fs.readFile(path.join(root, 'src/components/ScreenRegistry.tsx'), 'utf8');
const files = [...registry.matchAll(/file:\s*'([^']+)'/g)].map((m) => m[1]);

const problems = [];
for (const rel of [...new Set(files)]) {
  const full = path.join(root, 'public', rel);
  try {
    const { size } = await fs.stat(full);
    // A black or empty PNG is the failure this is really looking for.
    if (size < 4000) problems.push(`${rel} is only ${size} bytes — almost certainly a blank capture`);
  } catch {
    problems.push(`${rel} is missing`);
  }
}

if (problems.length) {
  process.stdout.write('PREFLIGHT FAILED\n');
  for (const p of problems) process.stdout.write(`  - ${p}\n`);
  process.stdout.write(`\n${problems.length} asset problem(s). Fix these before rendering.\n`);
  process.exit(1);
}
process.stdout.write(`OK  ${new Set(files).size} assets present\n`);
