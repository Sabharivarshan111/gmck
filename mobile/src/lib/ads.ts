import mobileAds, {
  AdEventType,
  AdsConsent,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { warn } from '@/lib/log';
import { ADS_ENABLED } from '@/lib/adsMode';

/**
 * AdMob wiring.
 *
 * Live unit IDs are only used in release builds. Development serves Google's
 * test units instead — impressions or clicks on your own live ads during
 * development are policy violations and can get the AdMob account suspended.
 *
 * The app ID itself lives in app.json under `react-native-google-mobile-ads`;
 * the library's Gradle script reads it from there and injects the manifest
 * meta-data, so it must not also be declared in AndroidManifest.xml.
 */

// TestIds is still imported so a build with ads on but running from Metro
// cannot hit a live unit — but in a build where ADS_ENABLED is false none of
// this is reached at all, because every entry point returns first.
const INTERSTITIAL_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-3177287525203129/7425202639';

const REWARDED_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-3177287525203129/6765465304';

export interface RewardedResult {
  completed: boolean;
  amount: number;
}

let initialized = false;
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;

/*
 * The rewarded ad's readiness is a PROPERTY OF AN INSTANCE, not of this
 * module, and that distinction is the whole bug behind "the ad does not play
 * when I tap OK, it plays later or not at all".
 *
 * It used to be one `rewarded` instance plus a separate `rewardedLoaded`
 * boolean, and the two could describe different ads. `showRewardedAd` would
 * replace `rewarded` with a fresh instance while the preloaded one was still
 * in flight; the orphan's LOADED listener then set the flag to true, so the
 * flag said "ready" about an ad nobody was holding any more, and the next
 * `show()` was called on an unloaded instance and threw.
 *
 * So the loaded ad is held BY IDENTITY. `readyAd` is an ad that has actually
 * reported LOADED and has not been shown; `pendingAd` is one still loading.
 * There is never more than one request in flight, which is also what stops a
 * tap from throwing away a preload that was seconds from arriving.
 */
let readyAd: RewardedAd | null = null;
let pendingAd: RewardedAd | null = null;

/*
 * A failed preload used to be the end of it: the ERROR listener set the flag
 * false and nothing ever tried again. One transient failure at launch — no
 * network yet, no fill, or a request that beat the consent flow — left the
 * session with no preloaded ad at all, so every later tap paid a cold load
 * and the reader saw exactly what was reported: nothing immediate, then an
 * ad some seconds later, or none.
 *
 * Bounded, because retrying a no-fill forever on a cheap phone is worse than
 * the bug it fixes. Three attempts and it stops until something asks.
 */
const RETRY_DELAYS_MS = [5_000, 20_000, 60_000];

/** How long a tap waits for an ad that was not preloaded. Past this the
 *  reader is let through; the load carries on and becomes the next preload. */
const LOAD_WAIT_MS = 8_000;
let retryCount = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Ask for consent (required in the EEA/UK) and start the SDK. Safe to call
 * more than once; failures are swallowed so ads never block the app.
 */
export async function initializeAds(): Promise<void> {
  // The whole SDK, the consent form and every preload skipped in one line.
  // This is the launch-time saving, not just the policy guard.
  if (!ADS_ENABLED || initialized) {
    return;
  }
  initialized = true;

  // Initialize mobileAds immediately so ad requests are not delayed or blocked
  try {
    await mobileAds().initialize();
    preloadInterstitial();
    preloadRewarded();
  } catch (error) {
    warn('Ads initialization failed:', error);
    initialized = false;
    return;
  }

  // Run consent check concurrently with a safety timeout so it never stalls ads
  void (async () => {
    try {
      const consentPromise = AdsConsent.requestInfoUpdate();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Consent timeout')), 3500),
      );
      const consentInfo = (await Promise.race([consentPromise, timeoutPromise])) as {
        isConsentFormAvailable?: boolean;
        status?: string;
      };
      if (consentInfo?.isConsentFormAvailable && consentInfo?.status === 'REQUIRED') {
        await AdsConsent.showForm();
      }
    } catch (error) {
      warn('Ads consent flow skipped:', error);
    } finally {
      /*
       * The preload above deliberately does NOT wait for this — consent is
       * decoupled behind a 3.5s race precisely so a slow or absent consent
       * service cannot stall ads, and re-serialising it would undo that.
       *
       * But a request issued before consent is resolved is the likeliest
       * thing to come back with no fill, and until now that first failure
       * was permanent. So once consent has settled, ask again: `preloadRewarded`
       * returns immediately if the first attempt already succeeded, so on the
       * ordinary path this costs one comparison.
       */
      preloadRewarded();
    }
  })();
}

function preloadInterstitial(): void {
  try {
    interstitialLoaded = false;
    interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID);
    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoaded = true;
    });
    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      // A unit can only be shown once, so build a fresh one for next time.
      preloadInterstitial();
    });
    interstitial.addAdEventListener(AdEventType.ERROR, () => {
      interstitialLoaded = false;
    });
    interstitial.load();
  } catch (error) {
    warn('Interstitial preload failed:', error);
  }
}

/** Listeners waiting for the in-flight ad. Resolved with the loaded instance,
 *  or null when the load failed, so a tap that arrives mid-load rides the
 *  request already running instead of starting a second one. */
type PendingWaiter = (ad: RewardedAd | null) => void;
const waiters = new Set<PendingWaiter>();

function settleWaiters(ad: RewardedAd | null): void {
  const pending = [...waiters];
  waiters.clear();
  // One ad, one show. A rewarded unit can be shown exactly once, so only the
  // first waiter is handed the instance; anyone else who tapped while it was
  // loading is told there was none rather than being shown a consumed ad.
  pending.forEach((waiter, index) => {
    waiter(index === 0 ? ad : null);
  });
}

function preloadRewarded(): void {
  // One request at a time. A second `createForAdRequest` while the first is
  // loading is what used to orphan a nearly-arrived ad.
  if (pendingAd || readyAd) {
    return;
  }
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  try {
    const ad = RewardedAd.createForAdRequest(REWARDED_UNIT_ID);
    pendingAd = ad;

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      unsubscribeLoaded();
      unsubscribeError();
      // Only adopt it if it is still the request we are waiting on. A late
      // arrival from an abandoned attempt must not overwrite a newer one.
      if (pendingAd === ad) {
        pendingAd = null;
        readyAd = ad;
        retryCount = 0;
      }
      settleWaiters(ad);
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, () => {
      unsubscribeLoaded();
      unsubscribeError();
      if (pendingAd === ad) {
        pendingAd = null;
      }
      settleWaiters(null);
      scheduleRetry();
    });

    ad.load();
  } catch (error) {
    warn('Rewarded preload failed:', error);
    pendingAd = null;
    settleWaiters(null);
    scheduleRetry();
  }
}

function scheduleRetry(): void {
  if (retryTimer || retryCount >= RETRY_DELAYS_MS.length) {
    return;
  }
  const delay = RETRY_DELAYS_MS[retryCount];
  retryCount += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    preloadRewarded();
  }, delay);
}

export function isRewardedReady(): boolean {
  if (!ADS_ENABLED) {
    return false;
  }
  return readyAd !== null;
}

export function isInterstitialReady(): boolean {
  if (!ADS_ENABLED) {
    return false;
  }
  return interstitialLoaded;
}

/**
 * Plays a rewarded ad and resolves once it closes. Resolves
 * `{ completed: false }` rather than rejecting when no ad is available, so
 * callers never have to gate on ad success.
 */
export function showRewardedAd(): Promise<RewardedResult> {
  // Reported as completed rather than failed: whatever the ad was gating is
  // not something a build without ads should withhold.
  if (!ADS_ENABLED) {
    return Promise.resolve({ completed: true, amount: 0 });
  }

  return new Promise(resolve => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const finish = (result: RewardedResult) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      resolve(result);
    };

    const playInstance = (adInstance: RewardedAd) => {
      // It is being shown, so it is no longer a preloaded ad anybody else may
      // pick up. A rewarded unit can only be shown once.
      if (readyAd === adInstance) {
        readyAd = null;
      }

      let earned = 0;
      const unsubscribeEarned = adInstance.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        reward => {
          earned = reward.amount;
        },
      );
      const unsubscribeClosed = adInstance.addAdEventListener(AdEventType.CLOSED, () => {
        unsubscribeEarned();
        unsubscribeClosed();
        finish({ completed: earned > 0, amount: earned });
        preloadRewarded();
      });

      try {
        adInstance.show();
      } catch (error) {
        warn('Rewarded show failed:', error);
        unsubscribeEarned();
        unsubscribeClosed();
        finish({ completed: false, amount: 0 });
        preloadRewarded();
      }
    };

    // The ordinary path, and the one the reader is entitled to: an ad was
    // preloaded at launch, so tapping OK plays it with no wait at all.
    if (readyAd) {
      playInstance(readyAd);
      return;
    }

    /*
     * Nothing preloaded. Wait for a load rather than starting a competing one
     * — `preloadRewarded` is a no-op while a request is in flight, so this
     * either joins the request already running or begins the only one.
     *
     * The timeout used to tear down the LOADED listener, which meant an ad
     * arriving at 8.1s was thrown away AND the module was left believing no
     * ad existed — so every subsequent tap paid the same cold load and the
     * state never healed. The waiter is dropped now, but the load is left
     * running and its result is adopted as the preload for next time. That
     * turns "slow for ever" into "slow once".
     */
    const waiter: PendingWaiter = ad => {
      if (settled) {
        return;
      }
      if (ad) {
        playInstance(ad);
      } else {
        finish({ completed: false, amount: 0 });
      }
    };
    waiters.add(waiter);

    timer = setTimeout(() => {
      waiters.delete(waiter);
      finish({ completed: false, amount: 0 });
    }, LOAD_WAIT_MS);

    preloadRewarded();
  });
}

export function showInterstitialAd(): void {
  if (!ADS_ENABLED) {
    return;
  }
  if (!interstitial || !interstitialLoaded) {
    preloadInterstitial();
    return;
  }
  try {
    interstitial.show();
  } catch (error) {
    warn('Interstitial show failed:', error);
    preloadInterstitial();
  }
}
