// Every @color / @drawable / @string an Android XML resource points at must exist.
//
// Android resource linking happens inside `processReleaseResources`, four
// minutes into a Gradle build, on CI. Nothing before it — tsc, eslint, the
// checks, the JS bundle — touches `android/app/src/main/res/` at all, so a
// missing colour is invisible locally and fails the build that produces the
// thing you actually ship.
//
// That is not hypothetical: adding the window background rewrote colors.xml
// instead of adding to it, which deleted `ic_launcher_background`. The adaptive
// icon still referenced it, and every release build failed with
//
//   error: resource color/ic_launcher_background ... not found
//
// while the JS side stayed perfectly green.
//
//   node scripts/android-res-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resDir = path.join(root, 'android/app/src/main/res');
const failures = [];

/** Every file under res/, recursively. */
async function walk(dir) {
  const found = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await walk(full)));
    } else {
      found.push(full);
    }
  }
  return found;
}

const files = await walk(resDir);
if (files.length === 0) {
  process.stdout.write('  FAIL  android/app/src/main/res is missing or empty\n');
  process.exit(1);
}

/** Names declared in values/*.xml, as `type/name`. */
const declared = new Set();
for (const file of files.filter(f => f.includes(`${path.sep}values`) && f.endsWith('.xml'))) {
  const body = await fs.readFile(file, 'utf8');
  for (const [, tag, name] of body.matchAll(/<(color|string|dimen|style|bool|integer)\s+name="([^"]+)"/g)) {
    declared.add(`${tag}/${name}`);
  }
}

/** Files that exist as resources in their own right — drawables, mipmaps. */
for (const file of files) {
  const dir = path.basename(path.dirname(file));
  const type = dir.split('-')[0];
  if (['drawable', 'mipmap', 'raw', 'color', 'anim', 'font'].includes(type)) {
    declared.add(`${type}/${path.basename(file).replace(/\.[^.]+$/, '')}`);
  }
}

// A reference may resolve to a same-named resource of another kind — a
// `@color` can point at a colour or a colour-state-list drawable — so a name
// found under any type counts.
const names = new Set([...declared].map(entry => entry.split('/')[1]));

/**
 * Resources that come from a dependency, not from this module.
 *
 * AppCompat and Material ship their own `res/`, and AGP merges them in before
 * linking, so `@dimen/abc_edit_text_inset_top_material` resolves fine at build
 * time even though nothing here declares it. Resolving AAR resources properly
 * would mean running Gradle, which is the four-minute step this check exists
 * to run in front of — so library-owned names are skipped by prefix instead.
 *
 * The point of the check is our own resources disappearing, which is what
 * actually happened.
 */
const LIBRARY_PREFIXES = ['abc_', 'mtrl_', 'material_', 'design_', 'androidx_', 'common_', 'gcm_', 'exo_'];
const fromLibrary = name => LIBRARY_PREFIXES.some(prefix => name.startsWith(prefix));

for (const file of files.filter(f => f.endsWith('.xml'))) {
  const body = await fs.readFile(file, 'utf8');
  for (const [, type, name] of body.matchAll(/"@(color|drawable|mipmap|string|dimen|style)\/([A-Za-z0-9_.]+)"/g)) {
    if (!names.has(name) && !fromLibrary(name)) {
      failures.push(
        `${path.relative(root, file)} references @${type}/${name}, which nothing declares — ` +
          'Android resource linking will fail the release build',
      );
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(`\n${failures.length} dangling resource reference(s).\n`);
  process.exit(1);
}
process.stdout.write(`OK  every resource reference in ${files.length} res/ files resolves\n`);
