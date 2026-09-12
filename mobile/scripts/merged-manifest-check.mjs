/**
 * The permissions Play actually receives, read out of the MERGED manifest.
 *
 * ## Why this is a separate check from `check:billing`
 *
 * `check:billing` reads `android/app/src/main/AndroidManifest.xml` — what this
 * repo *says*. This reads what Gradle *built*, which is the file that goes into
 * the `.aab` and the only one Play ever looks at. Those two have already
 * disagreed once, expensively:
 *
 * Play refused version 15 with "your advertising ID declaration in Play Console
 * says that your app uses advertising ID. A manifest file in one of your active
 * artifacts doesn't include the com.google.android.gms.permission.AD_ID
 * permission." The dependency that was supposed to bring it was present and
 * correct. The merge did not happen, nothing in the build said so, and the
 * first report was a rejection.
 *
 * `com.android.vending.BILLING` is now in exactly that position. The billing
 * AAR declares it; it is also declared in the app's own manifest so it cannot
 * be resolved away — and this asserts the result rather than the intent,
 * because "it should merge" is the sentence that cost version 15.
 *
 * ## Why it runs in CI and not here
 *
 * There is no Android SDK in the sandboxes this repo is written in, so no
 * merged manifest exists to read. Run with no manifest present it says so and
 * exits 0; the release and internal workflows call it right after `bundle`,
 * where the file is real and a missing permission must fail the build rather
 * than ship.
 *
 *   node scripts/merged-manifest-check.mjs [buildDir]
 */
import fs from 'node:fs';
import path from 'node:path';

const buildDir = process.argv[2] ?? path.join('android', 'app', 'build');

/** Every merged AndroidManifest.xml under the build directory. */
const mergedManifests = (dir) => {
  const out = [];
  const walk = (at) => {
    let entries;
    try {
      entries = fs.readdirSync(at, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(at, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name === 'AndroidManifest.xml' && full.includes('merged_manifest')) {
        out.push(full);
      }
    }
  };
  walk(dir);
  return out;
};

/*
 * Every permission that must survive the merge, and what breaks without it.
 *
 * Only the ones the app declares for a reason that is NOT visible in its own
 * behaviour are listed. VIBRATE going missing is a buzz nobody feels and is
 * caught by using the app; these two are caught by Play, weeks later.
 */
const REQUIRED = [
  {
    name: 'com.google.android.gms.permission.AD_ID',
    why:
      'Play refused version 15 for this exact absence. Without it Play zeroes ' +
      'the advertising ID and AdMob serves untargeted ads.',
  },
  {
    name: 'com.android.vending.BILLING',
    why:
      'Play scans the uploaded bundle for this. Without it the Console will ' +
      'not let an in-app product or subscription be created, so the store ' +
      'listing can never show "In-app purchases".',
  },
];

const manifests = mergedManifests(buildDir);

if (manifests.length === 0) {
  console.log(
    `OK  (skipped) no merged manifest under ${buildDir} — there is no Android SDK ` +
      'here, so nothing has been merged yet. The release workflow runs this ' +
      'after `bundleRelease`, where the file exists.',
  );
  process.exit(0);
}

const failures = [];
for (const file of manifests) {
  const source = fs.readFileSync(file, 'utf8');
  for (const { name, why } of REQUIRED) {
    // The merger rewrites attribute order and quoting, so match the name only.
    if (!source.includes(name)) {
      failures.push(`${file} does not declare ${name}. ${why}`);
    }
  }
}

if (failures.length > 0) {
  console.error('merged manifest check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error(
    '\nThis is the artifact Play receives. Declare the permission in ' +
      'android/app/src/main/AndroidManifest.xml rather than relying on a ' +
      'library to merge it.\n',
  );
  process.exit(1);
}

console.log(
  `OK  ${manifests.length} merged manifest(s) carry all ${REQUIRED.length} ` +
    `permission(s) Play reads: ${REQUIRED.map((r) => r.name.split('.').pop()).join(', ')}`,
);
