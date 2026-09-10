package com.aistudio.mbbsqbank.aycxvd

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability
import org.json.JSONObject

/**
 * Google Play's in-app update API, wrapped for JavaScript.
 *
 * See NativeOrbitUpdate.ts for why this replaced a table lookup, and for the
 * three things Play cannot do. In short: Play is the only thing that actually
 * knows whether a build is live for a given reader on a given track, and it was
 * a person flipping a boolean before.
 *
 * Nothing here can be exercised in this repo. There is no emulator in the
 * sandboxes, the preview harness is a browser, and the API returns nothing at
 * all for a build Play did not install — which is every APK CI produces. The
 * first real proof is an internally-shared build on a phone.
 */
@ReactModule(name = UpdateModule.NAME)
class UpdateModule(reactContext: ReactApplicationContext) :
  NativeOrbitUpdateSpec(reactContext) {

  override fun getName(): String = NAME

  /**
   * Built lazily, and never on a device without Play services.
   *
   * `AppUpdateManagerFactory.create` throws on a device with no Play Store —
   * which is most cheap tablets and every emulator image without Google APIs.
   * Every use is inside a runCatching for that reason; the module reports "no
   * update" rather than taking the app down for a feature that is decoration.
   */
  private val manager by lazy { AppUpdateManagerFactory.create(reactApplicationContext) }

  /**
   * The last info Play gave us, so `start` has something to hand back to it.
   *
   * `startUpdateFlowForResult` needs the `AppUpdateInfo` object itself, not a
   * version number — it carries the IntentSender Play built for this exact
   * offer. Re-fetching inside `start` would be a second round trip in the
   * moment the reader has just tapped a button.
   */
  private var lastInfo: AppUpdateInfo? = null

  /** The one in-flight `start`, resolved by the Activity result below. */
  private var pending: Promise? = null

  /*
   * Download progress, kept here rather than pushed as events.
   *
   * A flexible download reports through a listener, and JavaScript polls
   * `check()` for it. That is deliberate: an event emitter is a second
   * mechanism to get right — codegen, subscription lifetime, the New
   * Architecture's own emitter plumbing — for a number that changes a few times
   * a second at most and is read by one card. Polling a field is the smaller
   * thing that cannot go silently wrong.
   */
  private var bytesDownloaded: Long = 0
  private var totalBytes: Long = 0
  private var installStatus: Int = InstallStatus.UNKNOWN

  private val installListener = InstallStateUpdatedListener { state ->
    installStatus = state.installStatus()
    bytesDownloaded = state.bytesDownloaded()
    totalBytes = state.totalBytesToDownload()
  }

  private val activityListener: ActivityEventListener =
    object : BaseActivityEventListener() {
      // `activity` is non-null in BaseActivityEventListener. Declaring it
      // nullable makes this override nothing at all, which only the six-minute
      // Gradle step ever notices — the same trap FilesModule documents.
      override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
      ) {
        if (requestCode != REQUEST_CODE) {
          return
        }
        val promise = pending ?: return
        pending = null
        // Backing out of Play's sheet is an answer, not a failure. The caller
        // should not have to tell "changed my mind" from "Play errored" in a
        // catch block.
        promise.resolve(
          when (resultCode) {
            Activity.RESULT_OK -> "accepted"
            Activity.RESULT_CANCELED -> "cancelled"
            else -> "failed"
          }
        )
      }
    }

  init {
    reactContext.addActivityEventListener(activityListener)
    runCatching { manager.registerListener(installListener) }
  }

  override fun invalidate() {
    reactApplicationContext.removeActivityEventListener(activityListener)
    runCatching { manager.unregisterListener(installListener) }
    pending?.resolve("cancelled")
    pending = null
    super.invalidate()
  }

  /** Play's InstallStatus as a word, because a JS caller reading 11 is not reading. */
  private fun statusName(status: Int): String =
    when (status) {
      InstallStatus.PENDING -> "pending"
      InstallStatus.DOWNLOADING -> "downloading"
      InstallStatus.DOWNLOADED -> "downloaded"
      InstallStatus.INSTALLING -> "installing"
      InstallStatus.INSTALLED -> "installed"
      InstallStatus.FAILED -> "failed"
      InstallStatus.CANCELED -> "canceled"
      else -> "unknown"
    }

  private fun empty(reason: String): String =
    JSONObject()
      .put("available", false)
      .put("versionCode", 0)
      .put("staleness", -1)
      .put("priority", 0)
      .put("flexibleAllowed", false)
      .put("immediateAllowed", false)
      .put("installStatus", statusName(installStatus))
      .put("bytesDownloaded", bytesDownloaded)
      .put("totalBytes", totalBytes)
      .put("reason", reason)
      .toString()

  override fun check(promise: Promise) {
    val task =
      runCatching { manager.appUpdateInfo }
        .getOrElse {
          // No Play Store on the device, or Play services too old to answer.
          promise.resolve(empty("play_unavailable"))
          return
        }

    task
      .addOnSuccessListener { info ->
        lastInfo = info
        installStatus = info.installStatus()
        val availability = info.updateAvailability()
        val available =
          availability == UpdateAvailability.UPDATE_AVAILABLE ||
            availability == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS
        if (!available) {
          promise.resolve(empty("up_to_date"))
          return@addOnSuccessListener
        }
        promise.resolve(
          JSONObject()
            .put("available", true)
            .put("versionCode", info.availableVersionCode())
            .put("staleness", info.clientVersionStalenessDays() ?: -1)
            .put("priority", info.updatePriority())
            .put("flexibleAllowed", info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE))
            .put("immediateAllowed", info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE))
            .put("installStatus", statusName(info.installStatus()))
            .put("bytesDownloaded", bytesDownloaded)
            .put("totalBytes", totalBytes)
            // An update Play has already started and not finished. The card
            // asks to resume rather than to begin.
            .put(
              "reason",
              if (availability == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
                "in_progress"
              } else {
                ""
              },
            )
            .toString()
        )
      }
      // A failed lookup is offline, or a build Play did not install. Both are
      // "no update", and neither is worth interrupting anybody over.
      .addOnFailureListener { error ->
        promise.resolve(empty(error.message ?: "lookup_failed"))
      }
  }

  override fun start(type: String, promise: Promise) {
    val info = lastInfo
    val activity = getCurrentActivity()
    if (info == null || activity == null) {
      promise.resolve("unavailable")
      return
    }
    // One at a time. A second sheet over the first would orphan the first
    // promise, and the Activity result carries no way to tell them apart.
    pending?.resolve("cancelled")
    pending = promise

    val mode = if (type == "immediate") AppUpdateType.IMMEDIATE else AppUpdateType.FLEXIBLE
    val started =
      runCatching {
        manager.startUpdateFlowForResult(
          info,
          activity,
          AppUpdateOptions.newBuilder(mode).build(),
          REQUEST_CODE,
        )
      }
    if (started.isFailure) {
      // SendIntentException: the offer Play built has gone stale. Nothing is
      // broken and a later check will build a fresh one.
      pending = null
      promise.resolve("failed")
    }
  }

  override fun complete() {
    // Restarts the app. Everything this app holds is already persisted on
    // write — progress, notes, the profile — so there is nothing to flush
    // first, but this is why it is a deliberate button and not automatic.
    runCatching { manager.completeUpdate() }
  }

  companion object {
    const val NAME = "OrbitUpdate"

    /** Distinct from FilesModule's and ApkgModule's, or the results cross. */
    private const val REQUEST_CODE = 7314
  }
}
