import { daysUntil, getExam, hydrateExam, isHydrated as examHydrated } from '@/lib/exam';
import {
  attendanceEventsHydrated,
  daysToEvent,
  getAttendanceEvents,
  hydrateAttendanceEvents,
  kindLabel,
  nextEvent,
} from '@/lib/attendanceEvents';
import { dueCards, loadCards } from '@/lib/spacedRepetition';
import { currentValue, loadStreak } from '@/lib/streak';
import { getLastStudyDay } from '@/lib/progress';
import { getSettings } from '@/lib/settings';
import {
  DEFAULT_HOUR,
  cancelNotifications,
  epochDay,
  notificationsAvailable,
  setNotificationSchedule,
  updateDigest,
} from '@/lib/notifications';

/**
 * Everything the reminder needs, gathered and handed to the receiver.
 *
 * This is the **only** thing that writes the digest, and the reason it exists
 * is that the digest used to be written from one screen. NotifyReceiver posts
 * nothing when the digest is empty — that is correct, it has nothing to say —
 * so a reader who turned the reminder on in Settings and never opened My
 * Progress got a switch that armed an alarm which woke up every evening,
 * found no facts, and went back to sleep. Silently, for ever. Which is exactly
 * what "I enabled it and no notification comes" looks like from the outside.
 *
 * It also **re-arms the alarm**. `setSchedule` was called only when the switch
 * was flipped, and an Android alarm does not survive a force-stop — one swipe
 * from the app switcher on some OEM skins, one "Force stop" in app info, and
 * the reminder is gone with the switch still showing on. Arming it again on
 * every launch costs one `setWindow` call and closes that hole.
 *
 * Called from `App.tsx` after hydration and from My Progress when the facts
 * behind it change. Every call is a no-op when the native module is absent,
 * which it is in the preview harness.
 */
export async function syncReminders(): Promise<void> {
  if (!notificationsAvailable) {
    return;
  }

  const settings = getSettings();
  if (!settings.dailyReminder) {
    cancelNotifications();
    return;
  }

  setNotificationSchedule(true, settings.reminderHour ?? DEFAULT_HOUR);

  if (!examHydrated()) {
    await hydrateExam().catch(() => {});
  }
  const exam = getExam();

  const cards = await loadCards().catch(() => []);
  const due = dueCards(cards);
  const soonest = cards.reduce<number | null>(
    (earliest, card) => (earliest === null || card.due < earliest ? card.due : earliest),
    null,
  );

  /*
   * The device's streak, not the cloud's.
   *
   * `currentValue` re-checks the stored day against today, so a streak broken
   * two days ago reads as 0 here rather than as whatever it was when it
   * stopped — and "your 4 day streak is about to break" sent to someone who
   * broke it on Tuesday is the kind of wrong that gets an app muted. The cloud
   * value can only be larger, and being quiet about a streak someone still has
   * is the cheaper mistake.
   */
  const streak = currentValue(await loadStreak().catch(() => ({
    lastActiveDay: '',
    current: 0,
    best: 0,
  })));

  /*
   * The soonest dated thing wins the one slot the receiver has.
   *
   * The digest carries a single exam, and the Kotlin already reads it as
   * "three days to X". A posting exam or a seminar the reader typed into the
   * Attendance tab is the same shape of fact, so it goes through that slot
   * rather than through a new field — which would mean changing a receiver
   * that cannot be run in these sandboxes, and an untested change there fails
   * as an evening that stays silent, which is what this whole file exists to
   * prevent.
   *
   * The typed events never reach `exam`, because that store syncs to
   * `exam_targets` and a locally-typed seminar is not this app's to upload.
   */
  if (!attendanceEventsHydrated()) {
    await hydrateAttendanceEvents();
  }
  const soonestEvent = nextEvent(getAttendanceEvents());
  const eventDays = soonestEvent ? daysToEvent(soonestEvent) : null;
  const examDays = exam ? daysUntil(exam) : null;
  const eventWins =
    soonestEvent !== null &&
    eventDays !== null &&
    eventDays >= 0 &&
    (examDays === null || examDays < 0 || eventDays < examDays);

  updateDigest({
    examDay: eventWins
      ? epochDay(new Date(`${soonestEvent!.date}T00:00:00`).getTime())
      : exam
        ? epochDay(exam.date)
        : -1,
    // Said out loud by the reminder, so it is the reader's own words plus
    // what kind of thing it is: "Cardio seminar", not "your exam".
    examName: eventWins
      ? `${soonestEvent!.title} ${kindLabel(soonestEvent!.kind).toLowerCase()}`
      : (exam?.name ?? 'your exam'),
    lastStudyDay: getLastStudyDay(),
    streak,
    revisionDueDay: soonest === null ? -1 : epochDay(soonest),
    revisionDueCount: due.length,
    // How many days before a date the countdown starts. The receiver defaults
    // to seven when it is absent, so an older digest is unchanged.
    examLeadDays: settings.examLeadDays ?? 7,
    allowExam: settings.remindExam,
    allowStreak: settings.remindStreak,
    allowRevision: settings.remindRevision,
  });
}
