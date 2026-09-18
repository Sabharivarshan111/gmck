/*
 * The rewarded ad has to play when the reader taps OK.
 *
 * The bug this exists for, as reported: "when I click the sorry for the
 * inconvenience button, ads not playing immediately or after sometime only
 * playing". Four separate defects in src/lib/ads.ts produced it, and each
 * one of them typechecks, lints and bundles perfectly:
 *
 *  1. A module-level `rewardedLoaded` boolean beside a module-level `rewarded`
 *     instance. `showRewardedAd` replaced the instance while a preload was in
 *     flight; the orphan's LOADED listener then set the flag, so the flag was
 *     true about an ad nobody held and `show()` ran on an unloaded instance.
 *  2. A failed preload was never retried. One transient failure at launch and
 *     the session had no preloaded ad at all, so every tap paid a cold load.
 *  3. The 8s wait tore down the LOADED listener, so an ad arriving at 8.1s was
 *     thrown away AND the module still believed none existed — every later tap
 *     repeated the same cold load. The state never healed.
 *  4. The first preload raced the consent flow and nothing re-preloaded once
 *     consent settled, which is the likeliest reason for that first no-fill.
 *
 * None of it is reachable from a sandbox: there is no emulator, the preview
 * harness has no AdMob, and ADS_ENABLED is false in every test build by
 * design. So this reads the source instead — which is the honest thing to say
 * it does.
 */
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/lib/ads.ts', import.meta.url), 'utf8');
// Comments describe the bugs by name, so an assertion looking for the bug
// would match the warning about it. Strip them first.
const code = src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

check(
  !/\brewardedLoaded\b/.test(code),
  'A `rewardedLoaded` flag is back. Readiness is a property of an instance, ' +
    'not of the module — hold the loaded ad itself (readyAd) instead.',
);

check(
  /let readyAd: RewardedAd \| null/.test(code) && /let pendingAd: RewardedAd \| null/.test(code),
  'readyAd / pendingAd are gone. The loaded ad must be held by identity.',
);

check(
  /function preloadRewarded\(\): void \{\s*if \(pendingAd \|\| readyAd\) \{\s*return;/.test(code),
  'preloadRewarded no longer refuses to start a second request. Two in-flight ' +
    'loads is what orphans a preload that was seconds from arriving.',
);

check(
  /function scheduleRetry\(\)/.test(code) && /RETRY_DELAYS_MS/.test(code),
  'The bounded preload retry is gone. A failed preload that is never retried ' +
    'means every later tap pays a cold load.',
);

check(
  /RETRY_DELAYS_MS\s*=\s*\[[^\]]+\]/.test(code) &&
    /retryCount >= RETRY_DELAYS_MS\.length/.test(code),
  'The retry is no longer bounded. Retrying a no-fill for ever on a cheap ' +
    'phone is worse than the bug it fixes.',
);

const consentBlock = code.slice(code.indexOf('AdsConsent.requestInfoUpdate'));
check(
  /finally \{\s*preloadRewarded\(\);/.test(consentBlock),
  'Nothing re-preloads once the consent flow settles. A request issued before ' +
    'consent resolves is the likeliest first no-fill, and it used to be permanent.',
);

check(
  !/await AdsConsent\.requestInfoUpdate/.test(code.slice(0, code.indexOf('void (async'))),
  'The consent flow is back in front of the preload. It is deliberately ' +
    'decoupled behind a 3.5s race so a slow consent service cannot stall ads.',
);

const showBody = code.slice(code.indexOf('export function showRewardedAd'));
check(
  /waiters\.delete\(waiter\);/.test(showBody) && !/unsubscribeLoaded\(\);/.test(showBody),
  'The wait timeout tears the load down again. Dropping the waiter is right; ' +
    'abandoning the load means the ad that arrives late is thrown away and the ' +
    'next tap repeats the same cold load.',
);

check(
  /pending\.forEach\(\(waiter, index\) => \{\s*waiter\(index === 0 \? ad : null\);/.test(code),
  'settleWaiters hands the same ad to every waiter. A rewarded unit can be ' +
    'shown exactly once.',
);

check(
  /if \(readyAd === adInstance\) \{\s*readyAd = null;/.test(showBody),
  'Showing an ad no longer clears it from readyAd, so it can be handed out ' +
    'a second time after it has been consumed.',
);

if (failures.length) {
  console.error('check:ads FAILED\n');
  for (const f of failures) console.error('  - ' + f + '\n');
  process.exit(1);
}
console.log('check:ads OK  — the rewarded ad is preloaded, retried, and shown by identity.');
