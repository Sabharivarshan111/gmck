package com.aistudio.mbbsqbank.aycxvd

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

/**
 * The JavaScript side of the daily study reminder.
 *
 * Deliberately thin: it stores facts and arms an alarm, and decides nothing.
 * All of the "should this fire at all" logic lives in NotifyReceiver, because
 * that is the only place with the current date at the moment it matters — see
 * the spec for why waking JavaScript from a receiver was rejected.
 */
@ReactModule(name = NotifyModule.NAME)
class NotifyModule(reactContext: ReactApplicationContext) :
  NativeOrbitNotifySpec(reactContext) {

  override fun getName(): String = NAME

  override fun hasPermission(): Boolean =
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
        // No runtime permission before 13 — but the user can still have turned
        // the app's notifications off in system settings, which this catches.
        NotificationManagerCompat.from(reactApplicationContext).areNotificationsEnabled()
      } else {
        ContextCompat.checkSelfPermission(
          reactApplicationContext,
          Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED
      }
    } catch (_: Throwable) {
      false
    }

  /**
   * Ask once, from the Activity.
   *
   * Resolves rather than rejecting on refusal: being told no is an outcome,
   * not an error, and the caller has to draw a switch either way.
   *
   * It resolves immediately with the current state rather than waiting for the
   * dialog's result. Plumbing an onRequestPermissionsResult callback back into
   * a TurboModule promise means holding the promise across an Activity that
   * Android may destroy and recreate mid-dialog — and the caller re-reads
   * hasPermission() when the app returns to the foreground anyway, which is
   * both simpler and correct after a trip to system settings.
   */
  override fun requestPermission(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      promise.resolve(hasPermission())
      return
    }
    if (hasPermission()) {
      promise.resolve(true)
      return
    }
    // getCurrentActivity(), not the `currentActivity` property. Kotlin does
    // not synthesise one for it through the generated spec, and the difference
    // is a compile error that only the six-minute Gradle step ever sees.
    val activity: Activity? = getCurrentActivity()
    if (activity == null) {
      promise.resolve(false)
      return
    }
    try {
      ActivityCompat.requestPermissions(
        activity,
        arrayOf(Manifest.permission.POST_NOTIFICATIONS),
        REQUEST_CODE,
      )
    } catch (_: Throwable) {
      promise.resolve(false)
      return
    }
    promise.resolve(false)
  }

  override fun setSchedule(enabled: Boolean, hour: Double) {
    val hourOfDay = hour.toInt().coerceIn(0, 23)
    NotifyStore.prefs(reactApplicationContext)
      .edit()
      .putBoolean(NotifyStore.KEY_ENABLED, enabled)
      .putInt(NotifyStore.KEY_HOUR, hourOfDay)
      .apply()

    if (enabled) {
      NotifyReceiver.ensureChannel(reactApplicationContext)
      NotifyScheduler.schedule(reactApplicationContext, hourOfDay)
    } else {
      NotifyScheduler.cancel(reactApplicationContext)
    }
  }

  override fun updateDigest(json: String) {
    NotifyStore.prefs(reactApplicationContext)
      .edit()
      .putString(NotifyStore.KEY_DIGEST, json)
      // Writing a digest means the app is open, which means the last reminder
      // was either opened or overtaken by the user arriving on their own. Either
      // way it was not ignored, so the back-off starts again.
      .putInt(NotifyStore.KEY_IGNORED, 0)
      .apply()
  }

  /**
   * Post tonight's reminder now, so the reader can see one.
   *
   * The rules this feature is made of are rules about *not* posting — nothing
   * if you studied today, nothing if there is no deadline near, one a week
   * after three ignored — so it is silent on most evenings by design. Which
   * makes "working correctly" and "completely broken" look identical from the
   * outside, to the reader and to whoever wrote it. There was no way to tell
   * short of waiting for the evening.
   *
   * It runs the receiver's real `compose` over the real digest and posts
   * through the receiver's real `post`, so what arrives is what would arrive.
   * The *frequency* gates are skipped on purpose: they are about how often,
   * and this is a deliberate request, not the daily check. Nothing is written
   * to KEY_LAST_POSTED either, or asking to see one would silence tonight's.
   *
   * When tonight's rules genuinely produce nothing it says so rather than
   * inventing a message — that answer is the feature working, and it is worth
   * more than a fake reminder that teaches the reader the wrong thing.
   */
  override fun sendTest(promise: Promise) {
    val context = reactApplicationContext
    if (!hasPermission()) {
      promise.resolve("blocked")
      return
    }
    val receiver = NotifyReceiver()
    val digest = NotifyStore.digest(context)
    val message = receiver.compose(digest, receiver.epochDay())
    val posted = if (message != null) {
      NotifyReceiver.post(context, message.first, message.second)
    } else {
      NotifyReceiver.post(
        context,
        "Reminders are on",
        "Nothing to send tonight — no exam near, no streak at risk, no revision due. " +
          "You will hear from Orbit when there is.",
      )
    }
    promise.resolve(if (!posted) "blocked" else if (message != null) "posted" else "quiet")
  }

  override fun cancelAll() {
    NotifyScheduler.cancel(reactApplicationContext)
    try {
      NotificationManagerCompat.from(reactApplicationContext)
        .cancel(NotifyReceiver.NOTIFICATION_ID)
    } catch (_: Throwable) {
      // Nothing posted.
    }
    NotifyStore.prefs(reactApplicationContext)
      .edit()
      .putBoolean(NotifyStore.KEY_ENABLED, false)
      .apply()
  }

  companion object {
    const val NAME = "OrbitNotify"
    private const val REQUEST_CODE = 4203
  }
}
