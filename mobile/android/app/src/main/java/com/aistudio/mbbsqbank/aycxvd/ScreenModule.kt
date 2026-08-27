package com.aistudio.mbbsqbank.aycxvd

import android.content.pm.ActivityInfo
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule

/**
 * Rotates the Activity for a fullscreen video, and lets go afterwards.
 *
 * Two lines of Android, and the only part of the app's own fullscreen player
 * that JavaScript cannot do — see NativeOrbitScreen.ts for why fullscreen is
 * ours rather than ExoPlayer's.
 */
@ReactModule(name = ScreenModule.NAME)
class ScreenModule(reactContext: ReactApplicationContext) :
  NativeOrbitScreenSpec(reactContext) {

  override fun getName(): String = NAME

  override fun setLandscape(on: Boolean) {
    // requestedOrientation touches the window, so it belongs on the UI thread.
    UiThreadUtil.runOnUiThread {
      val activity = getCurrentActivity() ?: return@runOnUiThread
      activity.requestedOrientation =
        if (on) {
          // SENSOR_LANDSCAPE rather than LANDSCAPE, so the reader can still
          // flip the phone the other way up while watching.
          ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
        } else {
          // UNSPECIFIED, not PORTRAIT: handing control back means handing it
          // back, including to whatever rotation lock the reader has set.
          ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        }
    }
  }

  companion object {
    const val NAME = "OrbitScreen"
  }
}
