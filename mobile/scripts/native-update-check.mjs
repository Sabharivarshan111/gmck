// Google Play's in-app update API is the one feature here nothing can exercise.
//
// It reports no update at all for a build Play did not install — every APK this
// repo's CI produces, every debug build, and the preview harness, where the
// module is legitimately absent. There is no emulator with Play services in
// these sandboxes and no Play account to test against. So the update card can
// never appear in `check:smoke`, and "no card" is indistinguishable from "the
// whole thing is broken".
//
// That is exactly the shape of the sound module's failure: registered the old
// way, silently absent on every device, no error anywhere. So the wiring is
// asserted here instead — the four TurboModule pieces, the Gradle dependency,
// and the JS contract that decides what a reader sees.
//
//   node scripts/native-update-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFile(path.join(root, file), 'utf8').catch(() => null);

/** Comments stripped: every negative check below names the thing it forbids. */
const code = text =>
  (text ?? '').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// ---------------------------------------------------------------------------
// 1. The four pieces. Miss any one and the module is undefined on every phone.
// ---------------------------------------------------------------------------
const spec = await read('src/native/NativeOrbitUpdate.ts');
check(spec !== null, 'src/native/NativeOrbitUpdate.ts is missing — there is no spec to generate from');
if (spec) {
  check(
    /TurboModuleRegistry\.get</.test(spec),
    'the spec uses getEnforcing — a missing module would crash the app rather than turn the card off',
  );
  check(
    !/getEnforcing/.test(code(spec)),
    'the spec uses getEnforcing somewhere; Play services are absent on plenty of real devices',
  );
  for (const method of ['check(', 'start(', 'complete(']) {
    check(spec.includes(method), `the spec no longer declares ${method})`);
  }
}

const pkgJson = JSON.parse((await read('package.json')) ?? '{}');
check(
  pkgJson.codegenConfig?.jsSrcsDir === 'src/native',
  'codegenConfig no longer points at src/native, so no spec generates a Kotlin base class',
);

const module_ = await read('android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/UpdateModule.kt');
check(module_ !== null, 'UpdateModule.kt is missing');
if (module_) {
  const moduleCode = code(module_);
  check(
    /class UpdateModule\([\s\S]{0,120}?NativeOrbitUpdateSpec\(/.test(moduleCode),
    'UpdateModule does not extend the GENERATED spec — a hand-written base class is the old registration',
  );
  check(
    /AppUpdateManagerFactory\.create/.test(moduleCode),
    'UpdateModule no longer creates a Play AppUpdateManager',
  );
}

const pkg = await read('android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/UpdatePackage.kt');
check(pkg !== null, 'UpdatePackage.kt is missing');
if (pkg) {
  /*
   * Against `code(pkg)`, and the declaration rather than the word.
   *
   * Written as `/BaseReactPackage/.test(pkg)` first, this passed on a file
   * deliberately changed to `class UpdatePackage : ReactPackage` — because the
   * doc comment above it says the words "a BaseReactPackage declaring
   * isTurboModule". The prose that explains the rule satisfied the check for
   * the rule. Verified the fix by breaking it again.
   */
  const pkgCode = code(pkg);
  check(
    /class UpdatePackage\s*:\s*BaseReactPackage\(\)/.test(pkgCode),
    'UpdatePackage is not a BaseReactPackage — under the New Architecture it would never be asked for a module',
  );
  check(
    /isTurboModule\s*=\s*\*\/\s*true/.test(pkg),
    'UpdatePackage does not declare isTurboModule = true',
  );
}

const main = await read('android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/MainApplication.kt');
check(
  (main ?? '').includes('add(UpdatePackage())'),
  'MainApplication never adds UpdatePackage, so nothing registers the module',
);

const gradle = (await read('android/app/build.gradle')) ?? '';
check(
  /com\.google\.android\.play:app-update:/.test(gradle),
  'the app-update dependency is gone — the Kotlin would not compile',
);

// ---------------------------------------------------------------------------
// 2. Flexible by default, and a way out of every card.
//
// IMMEDIATE takes the screen and does not give it back until the update is
// installed. For a question bank that is a student locked out the evening
// before an exam, so it is reserved for a release Play itself marks high
// priority — and nothing sets that priority today.
// ---------------------------------------------------------------------------
const lib = await read('src/lib/appUpdate.ts');
check(lib !== null, 'src/lib/appUpdate.ts is missing');
if (lib) {
  check(
    /urgent \? 'immediate' : 'flexible'/.test(lib),
    'the update flow no longer defaults to flexible — an immediate update locks the reader out of the app',
  );
  check(
    /priority >= HIGH_PRIORITY/.test(lib),
    "urgency is no longer read from Play's own priority",
  );
  check(
    /export async function dismissUpdate\(versionCode: number\)/.test(lib),
    'a dismissal is no longer per version — declining 16 would also decline 17',
  );
  /*
   * The whole point of the change: Play decides, not a row.
   *
   * Against `code(lib)`, not `lib`. The file explains in a comment why the flag
   * is gone — and that comment names it, so reading the prose as code fails on
   * the very file that got it right. This check's own header says so and I
   * still wrote it the wrong way first.
   */
  check(
    !/live_on_play/.test(code(lib)),
    'appUpdate.ts reads live_on_play again — Play answers whether a release is live, and a ' +
      'hand-flipped flag is what this replaced',
  );
  check(
    /notesFor\(/.test(lib),
    'the release notes lookup is gone; Play does not provide them and the card would be wordless',
  );
}

const notice = await read('src/components/UpdateNotice.tsx');
check(notice !== null, 'UpdateNotice.tsx is missing');
if (notice) {
  // Asked for by name: the release-notes card carries no ad and nothing to buy.
  for (const forbidden of ['razorpay', 'buyAdFree', 'ADFREE_TIERS', 'showRewarded', 'AdBanner']) {
    check(
      !notice.includes(forbidden),
      `UpdateNotice imports ${forbidden} — this card carries no ad and nothing for sale`,
    );
  }
  check(
    /onDismiss=\{close\}/.test(notice),
    'the update dialog can no longer be dismissed — a card with no way out is a phone the reader cannot use',
  );
  // A flexible download finishes in the background, and nothing installs it
  // until completeUpdate is called. Without the "ready" stage the reader
  // downloads an update once and is never asked to install it.
  check(
    /'ready'/.test(notice) && /completeUpdate\(\)/.test(notice),
    'there is no "downloaded, install now" stage — a flexible update would download and never install',
  );
}

const shim = await read('preview/shims/orbit-update.ts');
check(shim !== null, 'the preview has no OrbitUpdate shim, so the preview build breaks');
if (shim) {
  check(
    /export default null/.test(shim),
    'the preview shim pretends the module exists — it would draw an Update button whose only ' +
      'outcome is a Play sheet that cannot open',
  );
}

// ---------------------------------------------------------------------------
// 3. The spec has to produce a schema.
//
// Otherwise this fails inside a Gradle step nobody runs locally, twenty minutes
// into a release build — which is the most expensive place in this repo to
// discover a typo in a type.
// ---------------------------------------------------------------------------
const cli = path.join(
  root,
  'node_modules/@react-native/codegen/lib/cli/combine/combine-js-to-schema-cli.js',
);
if (await fs.stat(cli).then(() => true, () => false)) {
  const outFile = path.join(
    await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-update-codegen-')),
    'schema.json',
  );
  try {
    execFileSync('node', [cli, '--platform', 'android', outFile, 'src/native'], { cwd: root });
    const schema = JSON.parse(await fs.readFile(outFile, 'utf8'));
    const moduleName = schema.modules?.NativeOrbitUpdate?.moduleName;
    check(
      moduleName === 'OrbitUpdate',
      `codegen read the spec as "${moduleName}", not "OrbitUpdate" — the Kotlin would never be found`,
    );
    const methods = (schema.modules?.NativeOrbitUpdate?.spec?.methods ?? []).map(m => m.name);
    for (const name of ['check', 'start', 'complete']) {
      check(methods.includes(name), `codegen found no ${name}() on the spec; it has ${methods.join(', ')}`);
    }
  } catch (error) {
    check(false, `codegen could not parse the spec: ${String(error.message).split('\n')[0]}`);
  }
}

if (failures.length > 0) {
  console.error('native update check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  'OK  OrbitUpdate is a TurboModule, flexible by default, dismissable, with an install stage ' +
    'and an absent preview shim',
);
