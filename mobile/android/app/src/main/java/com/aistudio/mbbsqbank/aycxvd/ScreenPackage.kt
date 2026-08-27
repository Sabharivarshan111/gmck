package com.aistudio.mbbsqbank.aycxvd

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Registers ScreenModule. A `BaseReactPackage` declaring `isTurboModule`,
 * because under the New Architecture anything else is never asked for a module
 * at all — this app has already shipped one that did not exist, silently, on
 * every device. See SoundPackage.kt.
 */
class ScreenPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == NativeOrbitScreenSpec.NAME) ScreenModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
      NativeOrbitScreenSpec.NAME to
        ReactModuleInfo(
          NativeOrbitScreenSpec.NAME,
          ScreenModule::class.java.name,
          /* canOverrideExistingModule = */ false,
          /* needsEagerInit = */ false,
          /* isCxxModule = */ false,
          /* isTurboModule = */ true,
        )
    )
  }
}
