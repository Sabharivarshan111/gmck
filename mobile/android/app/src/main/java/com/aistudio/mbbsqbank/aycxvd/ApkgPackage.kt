package com.aistudio.mbbsqbank.aycxvd

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Registers ApkgModule. A `BaseReactPackage` declaring `isTurboModule`,
 * because under the New Architecture anything else is never asked for a module
 * at all — this app has already shipped one that did not exist, silently, on
 * every device. See SoundPackage.kt.
 */
class ApkgPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == ApkgModule.NAME) ApkgModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
      ApkgModule.NAME to
        ReactModuleInfo(
          ApkgModule.NAME,
          ApkgModule::class.java.name,
          /* canOverrideExistingModule = */ false,
          // Lazy: nothing to warm. It is built the first time somebody opens
          // the import screen, and does nothing at all until then.
          /* needsEagerInit = */ false,
          /* isCxxModule = */ false,
          /* isTurboModule = */ true,
        )
    )
  }
}
