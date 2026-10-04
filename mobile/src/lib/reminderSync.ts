import { getBuddy, hydrateBuddy, todayKey } from '@/lib/studyBuddy';
import { getAttendance, hydrateAttendance } from '@/lib/attendance';
import { readDailyCard } from '@/lib/dailyStudy';
import { readLocalProfile, YEAR_TO_KEY } from '@/lib/profile';
import { getExam, hydrateExam, isHydrated as examHydrated } from '@/lib/exam';
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
    (earliest, card) =>
      earliest === null || card.due < earliest ? card.due : earliest,
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
  const streak = currentValue(
    await loadStreak().catch(() => ({
      lastActiveDay: '',
      current: 0,
      best: 0,
    })),
  );

  await Promise.all([hydrateBuddy(), hydrateAttendance()]);
  const buddy = getBuddy();
  const attendance = getAttendance().items;
  const held = attendance.reduce((sum, item) => sum + item.held, 0);
  const attended = attendance.reduce((sum, item) => sum + item.attended, 0);
  const attendanceSummary =
    held > 0
      ? `Recorded total attendance: ${((100 * attended) / held).toFixed(
          1,
        )}% (${attended}/${held}). Check each subject's target in Attendance.`
      : 'No attendance recorded yet. Log your classes and postings to see your percentage.';
  let mcqPreview = '';
  if (buddy.remindMcq) {
    const profile = await readLocalProfile();
    if (profile) {
      const card = await readDailyCard(
        'mcq',
        profile.university ?? 'tnmgr',
        YEAR_TO_KEY[profile.year],
      );
      if (card && !card.revealed && card.answer === undefined) {
        const full = `${card.question} ${card.options
          .map((option, i) => `${'ABCD'[i]}. ${option}`)
          .join(' ')} Tap ORBIT to answer.`;
        mcqPreview =
          full.length <= 700
            ? full
            : 'Your MCQ of the day is ready. Open ORBIT to read the complete question and answer it.';
      }
    }
  }
  updateDigest({
    buddyName: buddy.enabled ? buddy.name : 'ORBIT',
    attendanceSummary,
    allowPlan: buddy.remindPlan,
    planSummary:
      buddy.topic && (buddy.day !== todayKey() || buddy.completed.length < 3)
        ? `${buddy.minutes}-minute plan: ${buddy.topic}. Understand, recall, then review.`
        : '',
    allowMcq: buddy.remindMcq,
    mcqDay: epochDay(),
    mcqPreview,
    examDay: exam ? epochDay(exam.date) : -1,
    examName: exam?.name ?? 'your exam',
    lastStudyDay: getLastStudyDay(),
    streak,
    revisionDueDay: soonest === null ? -1 : epochDay(soonest),
    revisionDueCount: due.length,
    allowExam: settings.remindExam,
    allowStreak: settings.remindStreak,
    allowRevision: settings.remindRevision,
    allowAttendance: settings.remindAttendance,
  });
}
