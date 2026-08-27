/**
 * The preview harness has no NotificationManager and no TurboModuleRegistry.
 *
 * Reports **present**, like the sound shim and unlike the speech one. What the
 * flag gates decides it: this one gates a Settings section that needs
 * reviewing, and nothing here opens a UI that could hang.
 *
 * It starts denied and grants on request, which is the one browser-shaped
 * version of the real sequence — a switch turned on, a dialog, an Allow. The
 * previous shim refused permanently, and that is why the section it gates went
 * unreviewed: the per-kind switches only exist once permission is held, so
 * every state past the first one was unreachable from here. The path worth
 * checking is the one someone actually ends up in.
 */
let granted = false;
let digest: Record<string, unknown> = {};

export default {
  hasPermission: () => granted,
  requestPermission: async () => {
    granted = true;
    return true;
  },
  setSchedule: () => {},
  updateDigest: (json: string) => {
    try {
      digest = JSON.parse(json);
    } catch {
      digest = {};
    }
  },
  /*
   * The same ladder NotifyReceiver.compose walks — exam, then streak, then
   * revision — decided only far enough to answer "posted or quiet".
   *
   * A shim that always said "posted" would let the harness assert a result
   * the app can never actually produce, which is worse than not asserting.
   * Nothing is drawn: a browser has no notification shade, and the point of
   * the check is the Settings screen's reply, not the shade.
   */
  sendTest: async () => {
    if (!granted) {
      return 'blocked';
    }
    const day = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);
    const examDay = Number(digest.examDay ?? -1);
    const hasExam = digest.allowExam !== false && examDay > 0 && examDay - day <= 7;
    const hasStreak = digest.allowStreak !== false && Number(digest.streak ?? 0) >= 2;
    const dueDay = Number(digest.revisionDueDay ?? -1);
    const hasRevision =
      digest.allowRevision !== false &&
      dueDay >= 0 &&
      dueDay <= day &&
      Number(digest.revisionDueCount ?? 0) > 0;
    return hasExam || hasStreak || hasRevision ? 'posted' : 'quiet';
  },
  cancelAll: () => {},
};
