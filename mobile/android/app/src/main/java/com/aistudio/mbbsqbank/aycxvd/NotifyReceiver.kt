package com.aistudio.mbbsqbank.aycxvd

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.util.Calendar
import java.util.concurrent.TimeUnit

/**
 * The daily check. Runs without the app, decides once, usually says nothing.
 *
 * The rules below are the feature. Anyone can post a notification every day;
 * the work is in not doing it. In order:
 *
 *  1. **One a day, at most.** Enforced on a stored epoch day, not on the alarm,
 *     because a reboot reschedules and could otherwise fire twice.
 *  2. **Silence if they already studied today.** The entire purpose is to
 *     prompt someone who has not opened the app; telling someone who just
 *     closed it to come back is the exact behaviour that gets notifications
 *     turned off, permanently, for every app that does it.
 *  3. **Back off when ignored.** Three unopened reminders in a row and it drops
 *     to one a week. Most apps escalate here. Escalating is how you get
 *     uninstalled — a student ignoring three reminders is telling you
 *     something, and the right answer is to ask less often, not more.
 *  4. **One message, chosen by priority.** Never two. The ladder runs
 *     exam → streak → revision → nothing, hardest deadline first.
 *
 * "Continue where you left off" is deliberately **not** on that ladder. It is
 * the one reminder with no deadline behind it and nothing the reader does not
 * already know, which is the definition of the engagement nag this is meant to
 * avoid.
 */
class NotifyReceiver : BroadcastReceiver() {

  override fun onReceive(context: Context, intent: Intent) {
    val prefs = NotifyStore.prefs(context)
    if (!prefs.getBoolean(NotifyStore.KEY_ENABLED, false)) {
      return
    }

    // Reschedule first, so a crash below still leaves tomorrow armed.
    NotifyScheduler.schedule(context, prefs.getInt(NotifyStore.KEY_HOUR, 19))

    val today = epochDay()
    if (prefs.getLong(NotifyStore.KEY_LAST_POSTED, -1L) == today) {
      return
    }

    val digest = NotifyStore.digest(context)

    // Already studied today. Nothing to prompt.
    if (digest.optLong("lastStudyDay", -1L) == today) {
      return
    }

    // Ignored three in a row: once a week from here, not once a day.
    val ignored = prefs.getInt(NotifyStore.KEY_IGNORED, 0)
    if (ignored >= 3) {
      val last = prefs.getLong(NotifyStore.KEY_LAST_POSTED, -1L)
      if (last > 0 && today - last < 7) {
        return
      }
    }

    val message = compose(digest, today) ?: return

    if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) {
      return
    }

    val open = context.packageManager.getLaunchIntentForPackage(context.packageName)
    val pending = PendingIntent.getActivity(
      context,
      0,
      open,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val notification = NotificationCompat.Builder(context, CHANNEL)
      // Our own bell, not android.R.drawable.ic_dialog_info. Android renders a
      // small icon as a silhouette from its alpha channel, so it has to be a
      // single-colour shape drawn for that — see res/drawable/ic_notification.xml.
      .setSmallIcon(R.drawable.ic_notification)
      .setColor(0xFFD45CFF.toInt())
      .setContentTitle(message.first)
      .setContentText(message.second)
      .setStyle(NotificationCompat.BigTextStyle().bigText(message.second))
      .setPriority(NotificationCompat.PRIORITY_DEFAULT)
      .setAutoCancel(true)
      .setContentIntent(pending)
      .build()

    try {
      NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
    } catch (_: SecurityException) {
      // POST_NOTIFICATIONS revoked between the check and here.
      return
    }

    prefs.edit()
      .putLong(NotifyStore.KEY_LAST_POSTED, today)
      // Counted as ignored until the app is opened, which resets it.
      .putInt(NotifyStore.KEY_IGNORED, ignored + 1)
      .apply()
  }

  /**
   * The single most useful thing, or nothing at all.
   *
   * Returns title and body. Every branch needs a reason the reader could not
   * have worked out for themselves — a date arriving, a streak about to break,
   * work that is due today.
   */
  private fun compose(digest: org.json.JSONObject, today: Long): Pair<String, String>? {
    // optBoolean defaults true so a digest written by an older build — one
    // that predates these switches — behaves as it did before rather than
    // going silent on every kind at once.
    val examDay = digest.optLong("examDay", -1L)
    val examName = digest.optString("examName", "your exam")
    if (digest.optBoolean("allowExam", true) && examDay > 0) {
      val days = (examDay - today).toInt()
      // A countdown is only news near the end. Ninety days out it is wallpaper.
      if (days in 0..7) {
        val title = when (days) {
          0 -> "$examName is today"
          1 -> "$examName is tomorrow"
          else -> "$days days to $examName"
        }
        return title to "Nothing done today yet. Even one topic moves the number."
      }
    }

    val streak = digest.optInt("streak", 0)
    if (digest.optBoolean("allowStreak", true) && streak >= 2) {
      return "$streak day streak" to "One question keeps it. It resets at midnight."
    }

    val dueDay = digest.optLong("revisionDueDay", -1L)
    val dueCount = digest.optInt("revisionDueCount", 0)
    if (digest.optBoolean("allowRevision", true) && dueDay in 0..today && dueCount > 0) {
      val what = if (dueCount == 1) "1 question is" else "$dueCount questions are"
      return "$what due for revision" to "Spaced revision only works on the day it comes up."
    }

    return null
  }

  private fun epochDay(): Long {
    val now = Calendar.getInstance()
    now.set(Calendar.HOUR_OF_DAY, 0)
    now.set(Calendar.MINUTE, 0)
    now.set(Calendar.SECOND, 0)
    now.set(Calendar.MILLISECOND, 0)
    return TimeUnit.MILLISECONDS.toDays(now.timeInMillis)
  }

  companion object {
    const val CHANNEL = "orbit_study_reminder"
    const val NOTIFICATION_ID = 4201

    fun ensureChannel(context: Context) {
      if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) {
        return
      }
      val channel = android.app.NotificationChannel(
        CHANNEL,
        "Study reminders",
        NotificationManager.IMPORTANCE_DEFAULT,
      ).apply {
        description = "One reminder a day, only when there is something worth saying."
      }
      context.getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
    }
  }
}
