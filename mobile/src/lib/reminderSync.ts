import { getBuddy, hydrateBuddy, todayKey } from '@/lib/studyBuddy';
import {
  formatLocalIsoDate,
  getAttendance,
  hydrateAttendance,
  isPostingWorkingDate,
  percentOf,
  postingEndDate,
} from '@/lib/attendance';
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
  const overallPercent = held > 0 ? Math.round(percentOf(attended, held)) : -1;
  const attendanceSummary =
    held > 0
      ? `All recorded attendance: ${overallPercent}% (${attended}/${held}).`
      : 'No attendance recorded yet.';

  const today = new Date();
  const todayIso = formatLocalIsoDate(today);
  const activePosting = attendance
    .filter(item => item.kind === 'posting' && item.startDate && item.totalDays)
    .filter(item => {
      const end = item.endDate ?? postingEndDate(item.startDate ?? '', item.totalDays ?? 0);
      return Boolean(end && item.startDate && item.startDate <= todayIso && todayIso <= end);
    })
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))[0];

  const postingPercent =
    activePosting && activePosting.held > 0
      ? Math.round(percentOf(activePosting.attended, activePosting.held))
      : -1;
  const projectedIfAbsent =
    activePosting && activePosting.held >= 0
      ? percentOf(activePosting.attended, activePosting.held + 1)
      : 100;
  const attendanceTodayWorking =
    activePosting ? isPostingWorkingDate(activePosting, today) : false;
  const attendanceMarkedAbsentToday =
    Boolean(activePosting) &&
    activePosting?.lastMarkedDate === todayIso &&
    activePosting?.lastMarkedPresent === false;
  const attendanceUrgent =
    Boolean(activePosting) &&
    attendanceTodayWorking &&
    (attendanceMarkedAbsentToday ||
      (postingPercent >= 0 && postingPercent < (activePosting?.target ?? 75)) ||
      projectedIfAbsent < (activePosting?.target ?? 75));
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
    attendanceActive: Boolean(activePosting),
    attendanceName: activePosting?.name ?? '',
    attendancePercent: postingPercent,
    attendanceOverallPercent: overallPercent,
    attendanceTarget: activePosting?.target ?? 75,
    attendanceAttended: activePosting?.attended ?? 0,
    attendanceHeld: activePosting?.held ?? 0,
    attendanceTodayWorking,
    attendanceMarkedAbsentToday,
    attendanceUrgent,
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
