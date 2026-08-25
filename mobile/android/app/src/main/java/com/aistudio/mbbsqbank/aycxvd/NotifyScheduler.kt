package com.aistudio.mbbsqbank.aycxvd

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import java.util.Calendar

/**
 * Arms tomorrow's check.
 *
 * `setWindow`, not `setExact`. Exact alarms need SCHEDULE_EXACT_ALARM, which
 * Play grants to alarm clocks and calendars and not to study apps, and a
 * revision reminder landing at 19:11 instead of 19:00 is not worse in any way
 * a student could notice. The hour-wide window also lets Android batch it with
 * whatever else it was going to wake for, which is most of the battery cost.
 *
 * One-shot and re-armed by the receiver rather than `setRepeating`, so the hour
 * can change without cancelling anything, and so a reboot rebuilding it from
 * the stored hour lands on the same schedule.
 */
object NotifyScheduler {
  private const val REQUEST = 4202

  fun schedule(context: Context, hour: Int) {
    val alarms = context.getSystemService(AlarmManager::class.java) ?: return
    val at = nextOccurrence(hour)
    try {
      alarms.setWindow(
        AlarmManager.RTC_WAKEUP,
        at,
        AlarmManager.INTERVAL_HOUR,
        pending(context),
      )
    } catch (_: Throwable) {
      // A phone that refuses the alarm is one without reminders, not one that
      // crashes on the Settings screen.
    }
  }

  fun cancel(context: Context) {
    val alarms = context.getSystemService(AlarmManager::class.java) ?: return
    try {
      alarms.cancel(pending(context))
    } catch (_: Throwable) {
      // Nothing armed.
    }
  }

  private fun pending(context: Context): PendingIntent =
    PendingIntent.getBroadcast(
      context,
      REQUEST,
      Intent(context, NotifyReceiver::class.java),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

  /** The next time it is `hour` o'clock — today if that is still ahead. */
  private fun nextOccurrence(hour: Int): Long {
    val at = Calendar.getInstance()
    at.set(Calendar.HOUR_OF_DAY, hour.coerceIn(0, 23))
    at.set(Calendar.MINUTE, 0)
    at.set(Calendar.SECOND, 0)
    at.set(Calendar.MILLISECOND, 0)
    if (at.timeInMillis <= System.currentTimeMillis()) {
      at.add(Calendar.DAY_OF_YEAR, 1)
    }
    return at.timeInMillis
  }
}
