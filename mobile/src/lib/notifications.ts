import * as ReactNative from 'react-native';
import { Platform } from 'react-native';
import OrbitNotify from '@/native/NativeOrbitNotify';

/**
 * Read off the namespace, not as a named import: react-native-web does not
 * export PermissionsAndroid, and an ESM named import of a missing export takes
 * the whole bundle down rather than resolving to undefined.
 */
const PermissionsAndroid = (
  ReactNative as unknown as { PermissionsAndroid?: typeof ReactNative.PermissionsAndroid }
).PermissionsAndroid;

/**
 * The daily study reminder.
 *
 * The native side decides *whether* to fire; this decides *what it knows*. The
 * split matters: two of the inputs change while the app is closed — the days
 * remaining to an exam, and whether "studied today" is still true — so a
 * message composed here would be stale by morning. See NotifyReceiver.kt for
 * the rules it applies to these facts.
 *
 * Every call is a no-op when the module is absent, which it is in the preview
 * harness. A missing reminder must never take a Settings screen with it.
 */

const native = OrbitNotify ?? undefined;

/** Whether this build can post reminders at all. For Settings to be honest. */
export const notificationsAvailable = native != null;

/** The hour the check runs, if the user has not chosen one. */
export const DEFAULT_HOUR = 19;

export interface Digest {
  /** Epoch *day* of the exam, or -1. Days, because the receiver counts days. */
  examDay: number;
  examName: string;
  /** Epoch day the app last recorded a question being ticked. */
  lastStudyDay: number;
  streak: number;
  /** Epoch day the earliest revision card comes due, or -1. */
  revisionDueDay: number;
  revisionDueCount: number;
  /**
   * Which reminders the reader has allowed.
   *
   * Sent with the facts rather than checked here, because the choice has to be
   * enforced at fire time — the app may not have run since it was changed, and
   * a switch that only takes effect on the next launch is a switch that
   * appears not to work.
   */
  allowExam: boolean;
  allowStreak: boolean;
  allowRevision: boolean;
}

/** Local midnight as a day number, matching what the receiver computes. */
export function epochDay(at = Date.now()): number {
  const date = new Date(at);
  date.setHours(0, 0, 0, 0);
  return Math.floor(date.getTime() / 86400000);
}

export function hasNotificationPermission(): boolean {
  try {
    return native?.hasPermission() ?? false;
  } catch {
    return false;
  }
}

/**
 * Ask, once, when the switch is turned on — and wait for the answer.
 *
 * Through React Native's PermissionsAndroid rather than the native module,
 * because the native one could not wait. It fired the dialog and resolved
 * `false` in the same breath, so tapping "Allow" still left the switch off:
 * the app had already decided it was refused, turned the setting back off, and
 * hidden the per-kind switches that depend on it. Every user's first attempt
 * failed, and the second one worked only because the permission was granted by
 * then.
 *
 * PermissionsAndroid holds the promise across the dialog properly, including
 * across an Activity that Android destroys and recreates while it is open.
 *
 * Never at launch: Android stops showing the dialog after two refusals and the
 * only route back is the system settings screen, so the single chance to ask
 * belongs at the moment the reader has said they want this.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || !PermissionsAndroid) {
    /*
     * No PermissionsAndroid here — react-native-web has none, and that is the
     * preview harness. Fall back to the module's own answer so the harness can
     * still walk the *granted* path.
     *
     * Which is not a convenience. The bug this function exists to fix hid in
     * exactly that gap: the sub-switches only appear once permission is held,
     * so the one screen state that was broken was also the one state no
     * automated check could ever reach. A path nothing can exercise is a path
     * that regresses silently.
     */
    return (await native?.requestPermission()) ?? false;
  }
  // Below Android 13 there is no runtime permission; whether notifications are
  // allowed at all is a system-settings question the native side answers.
  if (typeof Platform.Version === 'number' && Platform.Version < 33) {
    return hasNotificationPermission();
  }
  try {
    const permission = 'android.permission.POST_NOTIFICATIONS' as never;
    if (await PermissionsAndroid.check(permission)) {
      return true;
    }
    const result = await PermissionsAndroid.request(permission, {
      title: 'Send you a study reminder?',
      message:
        'One a day at most, only when there is something worth saying. Never "come back and play".',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    });
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export function setNotificationSchedule(enabled: boolean, hour = DEFAULT_HOUR): void {
  try {
    native?.setSchedule(enabled, hour);
  } catch {
    // A phone that will not take the alarm is one without reminders.
  }
}

/**
 * Hand the receiver the current facts.
 *
 * Called when the app has fresh state rather than on a timer — writing it also
 * resets the ignored-reminder count, because the app being open means the last
 * one was either opened or overtaken by the reader arriving on their own.
 */
export function updateDigest(digest: Digest): void {
  try {
    native?.updateDigest(JSON.stringify(digest));
  } catch {
    // Nothing to do: the receiver keeps the previous digest, which is stale by
    // at most a day and still produces a defensible message.
  }
}

export type TestResult = 'posted' | 'quiet' | 'blocked' | 'unavailable';

/**
 * Post tonight's reminder now.
 *
 * `posted` — a real reminder went out. `quiet` — tonight's rules produce
 * nothing, so a note saying exactly that went out instead; delivery still
 * proven. `blocked` — Android will not deliver. `unavailable` — no module,
 * which is the preview harness.
 */
export async function sendTestNotification(): Promise<TestResult> {
  if (!native) {
    return 'unavailable';
  }
  try {
    const result = await native.sendTest();
    return result === 'posted' || result === 'quiet' || result === 'blocked'
      ? result
      : 'blocked';
  } catch {
    return 'blocked';
  }
}

/** "7:00 pm" from an hour of the day, for a control that sets one. */
export function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h < 12 ? 'am' : 'pm';
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}:00 ${suffix}`;
}

export function cancelNotifications(): void {
  try {
    native?.cancelAll();
  } catch {
    // Already gone.
  }
}
