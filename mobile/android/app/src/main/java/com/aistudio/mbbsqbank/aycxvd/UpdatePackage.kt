package com.aistudio.mbbsqbank.aycxvd

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Registers UpdateModule. A `BaseReactPackage` declaring `isTurboModule`,
 * because under the New Architecture anything else is never asked for a module
 * at all — this app has already shipped one that did not exist, silently, on
 * every device. See SoundPackage.kt.
 */
class UpdatePackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == NativeOrbitUpdateSpec.NAME) UpdateModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
      NativeOrbitUpdateSpec.NAME to
        ReactModuleInfo(
          NativeOrbitUpdateSpec.NAME,
          UpdateModule::class.java.name,
          /* canOverrideExistingModule = */ false,
          // Lazy: nothing asks Play anything until the card decides to look,
          // and building the manager touches Play services.
          /* needsEagerInit = */ false,
          /* isCxxModule = */ false,
          /* isTurboModule = */ true,
        )
    )
  }
}
