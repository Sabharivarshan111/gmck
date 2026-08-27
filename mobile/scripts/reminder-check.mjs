// A reminder that is correct to say nothing looks exactly like a broken one.
//
// Almost every rule in this feature is a rule about *not* posting — nothing if
// you studied today, nothing without a deadline near, one a week after three
// ignored. That is the feature. It also means the difference between "working"
// and "completely dead" is invisible from the outside, and it hid a real one:
//
//   NotifyReceiver posts nothing when the digest is empty, and the digest was
//   written from ProgressScreen and nowhere else. Turn the reminder on in
//   Settings, never open My Progress, and the alarm woke every evening, found
//   no facts, and went back to sleep. For ever. Nothing failed and nothing
//   logged.
//
// Neither tsc, eslint nor the preview harness can see any of that: the harness
// is react-native-web, which has no NotificationManager, no AlarmManager and
// no shade. So the wiring is asserted here.
//
//   node scripts/reminder-check.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const mobile = path.join(here, '..');
const kotlin = path.join(
  mobile,
  'android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd',
);

const read = p => readFileSync(p, 'utf8');
/** Comments stripped: every assertion is about code, and the comments here
 *  name the bugs the assertions forbid. */
const code = source =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// ---------------------------------------------------------------------------
// 1. Something writes the digest before an evening arrives.
// ---------------------------------------------------------------------------
const sync = read(path.join(mobile, 'src/lib/reminderSync.ts'));
check(/updateDigest\(/.test(sync), 'reminderSync no longer writes a digest');
check(
  /setNotificationSchedule\(true/.test(sync),
  'reminderSync no longer re-arms the alarm — an Android alarm does not survive a force-stop',
);

const app = code(read(path.join(mobile, 'App.tsx')));
check(
  /syncReminders\(\)/.test(app),
  'App.tsx does not sync reminders at launch, so the digest exists only for readers who ' +
    'have visited My Progress — which is the bug this file exists for',
);
check(
  /hydrateProgress\(\)[\s\S]{0,400}syncReminders\(\)/.test(app),
  'syncReminders runs before hydrateProgress resolves — it would write "nobody has ever ' +
    'studied" and the receiver would act on it',
);

// One writer. Composing the digest in two places is how it came to exist in
// only one of them.
const writers = ['src/screens/ProgressScreen.tsx', 'src/components/SettingsSheet.tsx']
  .map(f => code(read(path.join(mobile, f))))
  .filter(source => /updateDigest\(\{/.test(source));
check(
  writers.length === 0,
  'a screen composes the digest itself again — lib/reminderSync.ts is the only writer',
);

// ---------------------------------------------------------------------------
// 2. The reader can say when, and can make one appear.
// ---------------------------------------------------------------------------
const settings = read(path.join(mobile, 'src/components/SettingsSheet.tsx'));
check(
  /label="Reminder time"/.test(settings),
  'the reminder hour is not settable — reminderHour has been a stored setting with no ' +
    'control behind it before, which is a preference nobody can express',
);
check(
  /formatHour\(/.test(settings),
  'the reminder time is not shown as a clock time — "19" is not a time anyone reads',
);
check(
  /sendTestNotification\(\)/.test(settings),
  'there is no way to see a reminder without waiting for the evening',
);
check(
  /syncReminders\(\)[\s\S]{0,200}sendTestNotification\(\)/.test(code(settings)),
  'the test sends before refreshing the digest, so it reports on stale facts',
);

// ---------------------------------------------------------------------------
// 3. The test posts the real thing.
// ---------------------------------------------------------------------------
const module_ = code(read(path.join(kotlin, 'NotifyModule.kt')));
check(
  /receiver\.compose\(/.test(module_),
  "sendTest does not run the receiver's own compose — a test that posts a different " +
    'notification from the real one proves only that a test works',
);
check(
  /NotifyReceiver\.post\(/.test(module_),
  'sendTest does not post through the receiver\'s own post()',
);
check(
  !/KEY_LAST_POSTED/.test(module_.slice(module_.indexOf('sendTest'))),
  'sendTest writes KEY_LAST_POSTED — asking to see a reminder would silence tonight\'s real one',
);

const receiver = code(read(path.join(kotlin, 'NotifyReceiver.kt')));
check(
  /internal fun compose\(/.test(receiver),
  'compose is no longer reachable from the module, so the test cannot run the real rules',
);
check(
  /fun post\(context: Context/.test(receiver),
  'the posting path is no longer shared between the daily check and the test',
);
// The frequency rules stay in the receiver, where the alarm lands. Losing any
// of them is how an app that respects people becomes one they mute.
for (const [rule, pattern] of [
  ['one a day', /KEY_LAST_POSTED, -1L\) == today/],
  ['silence if they studied today', /lastStudyDay[\s\S]{0,80}== today/],
  ['back off after three ignored', /ignored >= 3/],
]) {
  check(pattern.test(receiver), `the receiver lost its "${rule}" rule`);
}

// ---------------------------------------------------------------------------
// 4. The native surface is complete and matches the spec.
// ---------------------------------------------------------------------------
const spec = read(path.join(mobile, 'src/native/NativeOrbitNotify.ts'));
for (const method of [
  'hasPermission',
  'requestPermission',
  'setSchedule',
  'updateDigest',
  'sendTest',
  'cancelAll',
]) {
  check(new RegExp(`\\b${method}\\b`).test(spec), `the spec has no ${method}`);
  check(
    new RegExp(`override fun ${method}\\b`).test(module_),
    `NotifyModule does not implement ${method} — the spec would not compile`,
  );
}
check(
  /TurboModuleRegistry\.get</.test(spec),
  'the spec uses getEnforcing, which turns a missing module into a crash',
);

// The preview shim has to answer every method too, or the Settings screen
// throws in the harness rather than degrading.
const shim = read(path.join(mobile, 'preview/shims/orbit-notify.ts'));
for (const method of ['hasPermission', 'requestPermission', 'setSchedule', 'updateDigest', 'sendTest', 'cancelAll']) {
  check(new RegExp(`\\b${method}\\b`).test(shim), `the preview shim has no ${method}`);
}

// ---------------------------------------------------------------------------
// 5. Android will let it through.
// ---------------------------------------------------------------------------
const manifest = read(path.join(mobile, 'android/app/src/main/AndroidManifest.xml'));
for (const permission of ['POST_NOTIFICATIONS', 'RECEIVE_BOOT_COMPLETED']) {
  check(manifest.includes(permission), `AndroidManifest is missing ${permission}`);
}
check(
  /android:name="\.NotifyReceiver"/.test(manifest),
  'NotifyReceiver is not declared in the manifest, so the alarm reaches nothing',
);
check(
  read(path.join(kotlin, 'MainApplication.kt')).includes('NotifyPackage()'),
  'NotifyPackage is not registered — under the New Architecture the module simply does not exist',
);
// Read raw, not comment-stripped: the flag is passed positionally with the
// parameter name in a comment, which is Kotlin's idiom for it here.
const pkgSource = read(path.join(kotlin, 'NotifyPackage.kt'));
check(
  /isTurboModule\s*=?\s*\*?\/?\s*true/.test(pkgSource),
  'NotifyPackage does not declare isTurboModule — the TurboModule manager will not find it',
);
check(
  /BaseReactPackage/.test(pkgSource),
  'NotifyPackage is a plain ReactPackage again, which the New Architecture never reads',
);

if (failures.length > 0) {
  console.error('Reminder wiring check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('OK  digest written at launch, hour settable, test posts the real message');
