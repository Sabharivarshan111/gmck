// The app's idea of its own version, against the one Gradle will stamp on it.
//
// React Native does not expose `BuildConfig`, so `src/lib/appVersion.ts` holds
// a committed copy — the same trade `adsMode.ts` makes, and for the same
// reason: a value that must never be guessed at runtime is safer as something
// CI checks than as something the app derives.
//
// A stale copy does not crash anything, which is precisely why it needs a
// check. It fails as a *wrong answer*: an old build that thinks it is new
// stays silent about the update that fixes it, and a new build that thinks it
// is old tells everyone to go and install the version they are already
// running. Neither shows up in tsc, eslint, the preview harness or a device
// test that happens to be on the current version.
//
//   node scripts/version-check.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const mobile = path.join(here, '..');
const read = p => readFileSync(p, 'utf8');

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

const gradle = read(path.join(mobile, 'android', 'app', 'build.gradle'));
const constants = read(path.join(mobile, 'src', 'lib', 'appVersion.ts'));

const gradleCode = gradle.match(/^\s*versionCode\s+(\d+)/m);
const gradleName = gradle.match(/^\s*versionName\s+"([^"]+)"/m);
check(gradleCode !== null, 'build.gradle no longer declares a versionCode');
check(gradleName !== null, 'build.gradle no longer declares a versionName');

const tsCode = constants.match(/APP_VERSION_CODE = (\d+)/);
const tsName = constants.match(/APP_VERSION_NAME = '([^']+)'/);
check(tsCode !== null, 'src/lib/appVersion.ts no longer declares APP_VERSION_CODE');
check(tsName !== null, 'src/lib/appVersion.ts no longer declares APP_VERSION_NAME');

if (gradleCode && tsCode) {
  check(
    gradleCode[1] === tsCode[1],
    `versionCode is ${gradleCode[1]} in build.gradle and ${tsCode[1]} in appVersion.ts — ` +
      'the app would offer, or withhold, the wrong update',
  );
}
if (gradleName && tsName) {
  check(
    gradleName[1] === tsName[1],
    `versionName is "${gradleName[1]}" in build.gradle and "${tsName[1]}" in appVersion.ts`,
  );
}

// The package the update button sends people to has to be the package Play is
// serving. Two different ids means the button opens somebody else's listing —
// or a 404 — and the reader concludes the update does not exist.
const appId = gradle.match(/applicationId\s+"([^"]+)"/);
const playPackage = constants.match(/PLAY_PACKAGE = '([^']+)'/);
check(appId !== null && playPackage !== null, 'could not read the applicationId or PLAY_PACKAGE');
if (appId && playPackage) {
  check(
    appId[1] === playPackage[1],
    `PLAY_PACKAGE is ${playPackage[1]} but the app is built as ${appId[1]} — ` +
      'the Update button would open the wrong listing',
  );
}

/*
 * Whether an update EXISTS is Google Play's answer. The table only holds words.
 *
 * This used to assert the opposite — that `appUpdate.ts` filtered rows on
 * `.eq('live_on_play', true)` and `.gt('version_code', APP_VERSION_CODE)`,
 * because the app decided for itself whether a newer release was out. That flag
 * was a person promising by hand that the listing had caught up, and it failed
 * in both directions: late and nobody hears about the update, early and every
 * phone is sent to a page still showing the version it is running.
 *
 * `NativeOrbitUpdate` asks Play instead. What survives here is the half Play
 * cannot do — Play hands no release notes to a client, in any shape — so the
 * table is now a lookup by the versionCode Play names, and a version with no
 * row still prompts, wordlessly. `check:native-update` guards the module
 * itself.
 */
const updateLib = read(path.join(mobile, 'src', 'lib', 'appUpdate.ts'));
const updateCode = updateLib.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
check(
  /from '@\/native\/NativeOrbitUpdate'/.test(updateCode),
  'appUpdate.ts no longer asks Google Play whether an update exists',
);
check(
  !/live_on_play/.test(updateCode),
  'appUpdate.ts reads live_on_play again — that is the hand-flipped flag Play replaced',
);
check(
  /\.eq\('version_code', versionCode\)/.test(updateCode),
  'the notes lookup no longer keys on the versionCode Play names',
);
check(
  /export async function dismissUpdate\(versionCode: number\)/.test(updateLib),
  'a dismissal is no longer per version — postponing 16 would also postpone 17',
);

// The what's-new card must not grow an ad or an offer. That is the one thing
// the app's owner asked for by name, and it is exactly the kind of thing that
// gets added later because the card is already there and already read.
const notice = read(path.join(mobile, 'src', 'components', 'UpdateNotice.tsx'));
for (const forbidden of ['razorpay', 'buyAdFree', 'ADFREE_TIERS', 'showRewarded', 'AdBanner']) {
  check(
    !notice.includes(forbidden),
    `UpdateNotice imports ${forbidden} — the release-notes card carries no ad and nothing for sale`,
  );
}

/*
 * The advertising ID permission, which Play refuses a release without.
 *
 * v15 was rejected for it: "your advertising ID declaration in Play Console
 * says that your app uses advertising ID. A manifest file in one of your active
 * artifacts doesn't include the com.google.android.gms.permission.AD_ID
 * permission." Since Android 13 an app targeting API 33+ that reads the ad ID
 * must declare it, or Play zeroes the identifier — AdMob then serves untargeted
 * ads and earns a fraction of what it does now.
 *
 * The obvious assumption is that the ads library brings it, and it does not:
 * `react-native-google-mobile-ads` declares INTERNET, WAKE_LOCK and
 * ACCESS_NETWORK_STATE and nothing else. It leans on the play-services-ads AAR
 * to merge this one, and whatever the build resolved did not reach the shipped
 * artifact.
 *
 * Nothing else here can catch it. Gradle builds happily, the app runs, the ads
 * even show — the loss is silent and lands in the revenue, and the only thing
 * that ever said so was the Play Console refusing an upload twenty minutes
 * after a build somebody waited for.
 */
const manifest = read(path.join(mobile, 'android/app/src/main/AndroidManifest.xml'));
check(
  /<uses-permission android:name="com\.google\.android\.gms\.permission\.AD_ID"\s*\/>/.test(
    manifest,
  ),
  'AndroidManifest.xml does not declare com.google.android.gms.permission.AD_ID — ' +
    'Play refuses the upload, and a build that got through would have its advertising ' +
    'identifier zeroed. The ads library does not declare it; this app must.',
);
check(
  !/AD_ID"[^>]*tools:node="remove"/.test(manifest),
  'something removes the AD_ID permission during manifest merging',
);

if (failures.length > 0) {
  console.error('version check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `OK  versionCode ${gradleCode?.[1]} (${gradleName?.[1]}) agrees across gradle and the app, ` +
    'update comes from Google Play, AD_ID declared, notes card carries no ad',
);
