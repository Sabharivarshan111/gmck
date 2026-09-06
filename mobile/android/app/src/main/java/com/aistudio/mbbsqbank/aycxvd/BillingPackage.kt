package com.aistudio.mbbsqbank.aycxvd

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Registers BillingModule. A `BaseReactPackage` declaring `isTurboModule`,
 * because under the New Architecture anything else is never asked for a module
 * at all — this app has already shipped one that did not exist, silently, on
 * every device. See SoundPackage.kt.
 */
class BillingPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == NativeOrbitBillingSpec.NAME) BillingModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
      NativeOrbitBillingSpec.NAME to
        ReactModuleInfo(
          NativeOrbitBillingSpec.NAME,
          BillingModule::class.java.name,
          /* canOverrideExistingModule = */ false,
          // Lazy. Building the client opens a connection to Play, and most
          // readers never open a purchase screen at all.
          /* needsEagerInit = */ false,
          /* isCxxModule = */ false,
          /* isTurboModule = */ true,
        )
    )
  }
}
