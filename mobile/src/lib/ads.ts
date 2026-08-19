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
let rewarded: RewardedAd | null = null;
let interstitialLoaded = false;
let rewardedLoaded = false;

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

  try {
    // Google requires a UMP consent flow before serving personalised ads.
    const consentInfo = await AdsConsent.requestInfoUpdate();
    if (consentInfo.isConsentFormAvailable && consentInfo.status === 'REQUIRED') {
      await AdsConsent.showForm();
    }
  } catch (error) {
    // No consent form, or the user is outside a consent region.
    warn('Ads consent flow skipped:', error);
  }

  try {
    await mobileAds().initialize();
    preloadInterstitial();
    preloadRewarded();
  } catch (error) {
    warn('Ads initialization failed:', error);
    initialized = false;
  }
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

function preloadRewarded(): void {
  try {
    rewardedLoaded = false;
    rewarded = RewardedAd.createForAdRequest(REWARDED_UNIT_ID);
    rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedLoaded = true;
    });
    rewarded.addAdEventListener(AdEventType.ERROR, () => {
      rewardedLoaded = false;
    });
    rewarded.load();
  } catch (error) {
    warn('Rewarded preload failed:', error);
  }
}

export function isRewardedReady(): boolean {
  if (!ADS_ENABLED) {
    return false;
  }
  return rewardedLoaded;
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
    if (!rewarded || !rewardedLoaded) {
      // Nothing loaded — take the chance to warm one up for next time.
      preloadRewarded();
      resolve({ completed: false, amount: 0 });
      return;
    }

    let earned = 0;
    let settled = false;
    const finish = (result: RewardedResult) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        earned = reward.amount;
      },
    );
    const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      unsubscribeEarned();
      unsubscribeClosed();
      finish({ completed: earned > 0, amount: earned });
      preloadRewarded();
    });

    try {
      rewarded.show();
    } catch (error) {
      warn('Rewarded show failed:', error);
      unsubscribeEarned();
      unsubscribeClosed();
      finish({ completed: false, amount: 0 });
      preloadRewarded();
    }
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
