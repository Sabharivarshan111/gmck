package com.aistudio.mbbsqbank.aycxvd

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Lives in this app rather than in a node module, so autolinking has
          // nothing to find and it is registered by hand. See SoundModule.kt.
          add(SoundPackage())
          add(SpeechPackage())
          add(NotifyPackage())
          add(FilesPackage())
          add(ScreenPackage())
          add(ApkgPackage())
          // A view, not a module — see GlassViewManager for why that is a
          // different registration path under the New Architecture.
          add(GlassPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    /*
     * W3C pointer events, for the one thing that needs them: palm rejection.
     *
     * Android knows which tool produced a touch — finger, stylus, mouse — and
     * React Native carries that through as `pointerType` on a pointer event,
     * but only when this flag is on. Without it the note canvas cannot tell a
     * nib from the heel of a hand, and every "palm rejection" left is a guess
     * from pressure or contact size that works on one handset and not the next.
     *
     * It is *additive*: `dispatchJSPointerEvent` is a separate path from
     * `dispatchJSTouchEvent`, so every existing PanResponder in the app — the
     * sliders, the sheets, the home-block drag — keeps receiving exactly the
     * touch events it did before. Nothing is intercepted or replaced.
     *
     * Set before loadReactNative, because the surface reads it when it builds
     * its dispatcher and never looks again.
     */
    ReactFeatureFlags.dispatchPointerEvents = true
    loadReactNative(this)
  }
}
