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

// The prompt and the card both read `app_releases`; nothing else may.
const updateLib = read(path.join(mobile, 'src', 'lib', 'appUpdate.ts'));
check(
  /\.eq\('live_on_play', true\)/.test(updateLib),
  'the update check no longer requires live_on_play — a build reaches testers days ' +
    'before the listing serves it, and sending everyone to a page showing the version ' +
    'they already have reads as the app being broken',
);
check(
  /\.gt\('version_code', APP_VERSION_CODE\)/.test(updateLib),
  'the update check no longer compares against this build\'s own version',
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

if (failures.length > 0) {
  console.error('version check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `OK  versionCode ${gradleCode?.[1]} (${gradleName?.[1]}) agrees across gradle and the app, ` +
    'update prompt gated on live_on_play, notes card carries no ad',
);
