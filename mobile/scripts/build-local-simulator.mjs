import { build } from 'vite';
import { readdir, readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
await build({ configFile: resolve(root, 'mobile/simulator-renderer/vite.config.ts') });
const output = resolve(root, 'mobile/android/app/build/generated/simulatorAssets/simulator');
const manifest = {};
async function inventory(dir) {
  for (const entry of await readdir(resolve(root, 'public', dir), { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) { await inventory(path); continue; }
    const bytes = await readFile(resolve(root, 'public', path));
    manifest[`/${path}`] = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
    // Small metadata is available on a cold offline start. Large exact meshes
    // download once into app-private storage; they never inflate the APK.
    if (path.endsWith('.json')) {
      const target = resolve(output, path);
      await mkdir(dirname(target), { recursive: true });
      await copyFile(resolve(root, 'public', path), target);
    }
  }
}
await inventory('models');
await inventory('clinical-reference');
await writeFile(resolve(output, 'asset-manifest.json'), JSON.stringify(manifest));
async function size(dir) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    total += entry.isDirectory() ? await size(path) : (await stat(path)).size;
  }
  return total;
}
const bytes = await size(output);
if (bytes > 10 * 1024 * 1024) throw Error(`Local renderer exceeds 10 MiB: ${bytes}`);
console.log(`Local canonical simulator: ${bytes} bytes, ${Object.keys(manifest).length} pinned public assets. Geometry downloads are stored separately.`);
