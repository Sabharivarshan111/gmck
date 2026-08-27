package com.aistudio.mbbsqbank.aycxvd

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Registers FilesModule. A `BaseReactPackage` declaring `isTurboModule`,
 * because under the New Architecture anything else is never asked for a module
 * at all — this app has already shipped one that did not exist, silently, on
 * every device. See SoundPackage.kt.
 */
class FilesPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == NativeOrbitFilesSpec.NAME) FilesModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
      NativeOrbitFilesSpec.NAME to
        ReactModuleInfo(
          NativeOrbitFilesSpec.NAME,
          FilesModule::class.java.name,
          /* canOverrideExistingModule = */ false,
          // Lazy: nothing to warm. Unlike the sound module, whose SoundPool
          // load is asynchronous and must have finished before the first press.
          /* needsEagerInit = */ false,
          /* isCxxModule = */ false,
          /* isTurboModule = */ true,
        )
    )
  }
}
