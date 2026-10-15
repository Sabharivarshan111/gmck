package com.aistudio.mbbsqbank.aycxvd

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.OnBackPressedCallback
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

class MainActivity : ReactActivity() {
  private var predictiveBackBridge: OnBackPressedCallback? = null

  /**
   * Why this override exists — it is the fix for "the app closes itself when I
   * open it after a long gap, and works the next time".
   *
   * Android kills a backgrounded process to reclaim memory. When the user comes
   * back, the OS does not start the app fresh: it recreates the Activity and
   * hands it the Bundle of state it saved earlier, and the fragment manager
   * restores the fragments recorded in it. react-native-screens puts every
   * navigator screen in a fragment, and those restored fragments do not line up
   * with a React tree that has not been built yet, so the restore crashes
   * before anything is on screen. The launch after that has no saved state, so
   * it works — which is exactly what makes the bug look random.
   *
   * react-native-screens' own README calls for this, in MainActivity and
   * specifically *not* in the delegate: the factory rebuilds the restored
   * fragments in a form that survives the mismatch.
   *
   * The order matters. The factory has to be set before `super.onCreate`,
   * because that is where the fragment manager replays the saved state.
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
    // ReactActivity installs its dispatcher bridge only on API 36+. Our
    // predictive-back opt-in also needs to reach JS BackHandler on API 33–35.
    if (Build.VERSION.SDK_INT >= 33 && Build.VERSION.SDK_INT < 36) {
      val bridge = object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          isEnabled = false
          try {
            this@MainActivity.onBackPressed()
          } finally {
            isEnabled = true
          }
        }
      }
      predictiveBackBridge = bridge
      onBackPressedDispatcher.addCallback(this, bridge)
    }
  }

  override fun invokeDefaultOnBackPressed() {
    // Exclude the bridge when JS requests the default activity exit.
    predictiveBackBridge?.isEnabled = false
    try {
      super.invokeDefaultOnBackPressed()
    } finally {
      predictiveBackBridge?.isEnabled = true
    }
  }

  override fun onNewIntent(intent: Intent) {
    setIntent(intent)
    super.onNewIntent(intent)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "OrbitMBBS"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
