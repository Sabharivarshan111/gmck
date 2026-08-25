// The daily reminder has four ways to die silently. This is all of them.
//
// A notification feature that does not fire looks exactly like a notification
// feature the user has muted, so none of these produce an error anyone would
// see:
//
//   not a TurboModule       the module is never reachable, the switch is hidden
//   no POST_NOTIFICATIONS   Android 13+ drops every post, no exception thrown
//   no channel              Android 8+ drops every post, no exception thrown
//   no boot receiver        reminders work until the first reboot, then stop
//                           forever with the switch still reading "on"
//
// The last one is the worst, because it works in testing. You install, you see
// a reminder, you ship, and every user's reminders die the next time they
// restart their phone.
//
//   node scripts/native-notify-check.mjs
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const check = (ok, message) => {
  if (!ok) {
    failures.push(message);
  }
};
const read = file => fs.readFile(path.join(root, file), 'utf8').catch(() => null);
const KOTLIN = 'android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd';

const pkg = JSON.parse((await read('package.json')) ?? '{}');
const specDir = pkg.codegenConfig?.jsSrcsDir ?? 'src/native';

// 1. The spec, resolved so a missing module hides the switch rather than crashing.
const spec = await read(`${specDir}/NativeOrbitNotify.ts`);
check(spec !== null, `${specDir}/NativeOrbitNotify.ts is missing`);
if (spec) {
  check(
    /TurboModuleRegistry\.get</.test(spec),
    'the spec uses getEnforcing — a build without the module would crash rather than hide the switch',
  );
  for (const method of ['hasPermission', 'requestPermission', 'setSchedule', 'updateDigest', 'cancelAll']) {
    check(new RegExp(`\\b${method}\\(`).test(spec), `the spec declares no ${method}()`);
  }
}

// 2. Kotlin extending the generated spec, and a package that declares itself.
const moduleKt = await read(`${KOTLIN}/NotifyModule.kt`);
check(moduleKt !== null, 'NotifyModule.kt is missing');
check(
  moduleKt !== null && /:\s*NativeOrbitNotifySpec\(/.test(moduleKt),
  'NotifyModule does not extend NativeOrbitNotifySpec — it would not be a TurboModule',
);

const packageKt = await read(`${KOTLIN}/NotifyPackage.kt`);
check(packageKt !== null, 'NotifyPackage.kt is missing');
check(
  packageKt !== null && /:\s*BaseReactPackage\(\)/.test(packageKt),
  'NotifyPackage is not a BaseReactPackage — the TurboModule manager never asks it for modules',
);
check(
  packageKt !== null && /isTurboModule\s*=\s*\*\/\s*true/.test(packageKt.replace(/\s+/g, ' ')),
  'NotifyPackage does not declare isTurboModule = true',
);

const mainApp = await read(`${KOTLIN}/MainApplication.kt`);
check(
  mainApp !== null && /add\(NotifyPackage\(\)\)/.test(mainApp),
  'NotifyPackage is not added in MainApplication — nothing registers the module',
);

// 3. The channel. Without one, Android 8+ silently drops every post.
const receiverKt = await read(`${KOTLIN}/NotifyReceiver.kt`);
check(receiverKt !== null, 'NotifyReceiver.kt is missing');
if (receiverKt) {
  check(
    /NotificationChannel\(/.test(receiverKt),
    'nothing creates a NotificationChannel — Android 8+ drops every post without one, silently',
  );
  // The anti-spam rules are the feature. Each is one line and each is the
  // difference between a reminder and a nag.
  check(
    /KEY_LAST_POSTED/.test(receiverKt),
    'the receiver does not record the day it last posted — nothing enforces one a day',
  );
  check(
    /lastStudyDay/.test(receiverKt),
    'the receiver never checks whether they studied today — it would nag people who just closed the app',
  );
  check(
    /KEY_IGNORED/.test(receiverKt),
    'the receiver has no back-off — ignored reminders would keep arriving daily',
  );
}

// 4. The boot receiver. Reminders that stop at the first reboot are the worst
//    version of this feature, because they work when you test them.
const bootKt = await read(`${KOTLIN}/BootReceiver.kt`);
check(bootKt !== null, 'BootReceiver.kt is missing — reminders would stop at the first reboot');
check(
  bootKt !== null && /BOOT_COMPLETED/.test(bootKt),
  'BootReceiver does not handle BOOT_COMPLETED',
);

// 5. The manifest: permissions and both receivers.
const manifest = await read('android/app/src/main/AndroidManifest.xml');
check(manifest !== null, 'AndroidManifest.xml is missing');
if (manifest) {
  check(
    /android\.permission\.POST_NOTIFICATIONS/.test(manifest),
    'POST_NOTIFICATIONS is not declared — Android 13+ drops every post',
  );
  check(
    /android\.permission\.RECEIVE_BOOT_COMPLETED/.test(manifest),
    'RECEIVE_BOOT_COMPLETED is not declared — the boot receiver would never run',
  );
  check(
    /android:name="\.NotifyReceiver"/.test(manifest),
    'NotifyReceiver is not registered in the manifest — the alarm would fire into nothing',
  );
  check(
    /android:name="\.BootReceiver"/.test(manifest),
    'BootReceiver is not registered in the manifest',
  );
  check(
    !/SCHEDULE_EXACT_ALARM|USE_EXACT_ALARM/.test(manifest),
    'an exact-alarm permission crept in — Play restricts those to alarm clocks and calendars, and a study reminder does not need one',
  );
}

// 6. The JS side degrades, and the preview has a shim.
const lib = await read('src/lib/notifications.ts');
check(lib !== null, 'src/lib/notifications.ts is missing');
check(
  lib !== null && /OrbitNotify \?\? undefined/.test(lib),
  'notifications.ts does not fall back when the module is absent — the preview would throw',
);
const viteConfig = await read('preview/vite.config.ts');
check(
  viteConfig !== null && /NativeOrbitNotify/.test(viteConfig),
  'the preview has no alias for NativeOrbitNotify',
);

// 7. Off by default. A notification is the most intrusive thing this app can
//    do, and one that arrives because the app was installed is one that gets
//    the whole category muted.
const settings = await read('src/lib/settings.ts');
check(
  settings !== null && /dailyReminder: false/.test(settings),
  'the daily reminder is not off by default',
);

// 8. And the spec has to produce a schema.
const cli = path.join(
  root,
  'node_modules/@react-native/codegen/lib/cli/combine/combine-js-to-schema-cli.js',
);
if (await fs.stat(cli).then(() => true, () => false)) {
  const outFile = path.join(
    await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-notify-codegen-')),
    'schema.json',
  );
  try {
    execFileSync('node', [cli, '--platform', 'android', outFile, specDir], { cwd: root });
    const schema = JSON.parse(await fs.readFile(outFile, 'utf8'));
    const moduleName = schema.modules?.NativeOrbitNotify?.moduleName;
    check(
      moduleName === 'OrbitNotify',
      `codegen read the spec as "${moduleName}", not "OrbitNotify" — the Kotlin side would never be found`,
    );
  } catch (error) {
    check(false, `codegen could not parse the spec: ${String(error.message).split('\n')[0]}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(`\n${failures.length} problem(s) — reminders would never arrive.\n`);
  process.exit(1);
}
process.stdout.write('OK  reminders are reachable, permitted, channelled and reboot-proof\n');
