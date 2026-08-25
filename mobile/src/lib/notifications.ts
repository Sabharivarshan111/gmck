import OrbitNotify from '@/native/NativeOrbitNotify';

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
 * Ask for the microphone's louder cousin, once, when the switch is turned on.
 *
 * Never at launch. Android stops showing the dialog after two refusals and the
 * only route back is the system settings screen, so the one chance to ask has
 * to come at the moment the user has said they want this.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!native) {
    return false;
  }
  try {
    return await native.requestPermission();
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

export function cancelNotifications(): void {
  try {
    native?.cancelAll();
  } catch {
    // Already gone.
  }
}
