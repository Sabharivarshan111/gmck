package com.aistudio.mbbsqbank.aycxvd

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
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
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
