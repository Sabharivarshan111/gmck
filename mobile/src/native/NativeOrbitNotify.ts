import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * One study reminder a day, decided on the device.
 *
 * **Local notifications, not push.** Everything worth saying — how many days
 * to the exam, whether today's revision is due, whether the streak is about to
 * break — is already known on the phone. Push would mean Firebase, a token
 * table, a server cron, and sending a student's study state to a backend to be
 * told something their own device already knew. The only thing push could add
 * is server-side news (someone passed you on the leaderboard), and that is
 * exactly the kind of notification this app should not send.
 *
 * **The decision happens at fire time, in Kotlin, without waking JavaScript.**
 * Two of the inputs change while the app is closed: the days remaining to an
 * exam, and whether "studied today" is still true. A message composed when the
 * app was last open would say "3 days to go" for a week. Starting the React
 * runtime from a broadcast receiver to recompute it would cost a second of CPU
 * and a chunk of battery daily, on phones chosen for having neither — so the
 * app writes a small digest of facts, and the receiver does the arithmetic.
 *
 * **Inexact alarms.** `setWindow` rather than `setExact`, because exact alarms
 * need SCHEDULE_EXACT_ALARM, Play restricts that permission to alarm clocks and
 * calendars, and a revision reminder that arrives at 19:04 instead of 19:00 is
 * not worse in any way a student could notice.
 */
export interface Spec extends TurboModule {
  /** Whether POST_NOTIFICATIONS has been granted. Always true below API 33. */
  hasPermission(): boolean;

  /**
   * Ask for it, once, when the toggle is turned on.
   *
   * Resolves false if the user declines or has declined twice before — Android
   * stops showing the dialog after that, and the only way back is Settings.
   */
  requestPermission(): Promise<boolean>;

  /**
   * Turn the daily check on or off, and say what hour to run it.
   *
   * @param hour 0-23, local. Scheduling is inexact by design.
   */
  setSchedule(enabled: boolean, hour: number): void;

  /**
   * The facts the receiver reasons over, as JSON.
   *
   * Written whenever the app has fresh state, and read at fire time. See
   * `src/lib/notifications.ts` for the shape and why each field is in it.
   */
  updateDigest(json: string): void;

  /**
   * Post tonight's reminder right now, and say what happened.
   *
   * Resolves `'posted'` when a reminder went out, `'quiet'` when tonight's
   * rules produce nothing (already studied today, no exam near, no streak, no
   * revision due) and `'blocked'` when Android will not deliver it.
   *
   * It exists because the reminder is, by design, almost always silent — and
   * a feature that is correct to do nothing is indistinguishable from one that
   * is broken. There was no way for anybody, including the person who wrote
   * it, to confirm it worked short of waiting for the evening.
   *
   * It runs the receiver's real `compose`, not a canned string. A test that
   * posts a different notification from the real one tests the wrong thing.
   */
  sendTest(): Promise<string>;

  /** Clear anything posted and stop the daily check. */
  cancelAll(): void;
}

export default TurboModuleRegistry.get<Spec>('OrbitNotify');
