package com.aistudio.mbbsqbank.aycxvd

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject

/**
 * The facts the daily check reasons over, and the state it keeps between runs.
 *
 * SharedPreferences rather than anything larger because this is read from a
 * BroadcastReceiver with a few milliseconds to live, before any of the app
 * exists. Opening a database or starting the React runtime there would be
 * expensive and, for four numbers and two strings, absurd.
 */
object NotifyStore {
  private const val FILE = "orbit_notify"

  const val KEY_ENABLED = "enabled"
  const val KEY_HOUR = "hour"
  const val KEY_DIGEST = "digest"
  /** How many reminders in a row went unopened. The back-off reads this. */
  const val KEY_IGNORED = "ignored"
  /** Epoch day of the last reminder actually posted, so one a day is enforced. */
  const val KEY_LAST_POSTED = "last_posted"

  fun prefs(context: Context): SharedPreferences =
    context.getSharedPreferences(FILE, Context.MODE_PRIVATE)

  fun digest(context: Context): JSONObject =
    try {
      JSONObject(prefs(context).getString(KEY_DIGEST, "{}") ?: "{}")
    } catch (_: Throwable) {
      JSONObject()
    }
}
