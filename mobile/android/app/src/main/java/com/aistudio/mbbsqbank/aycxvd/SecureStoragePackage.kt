package com.aistudio.mbbsqbank.aycxvd

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class SecureStoragePackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == NativeOrbitSecureStorageSpec.NAME) SecureStorageModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(NativeOrbitSecureStorageSpec.NAME to ReactModuleInfo(
      NativeOrbitSecureStorageSpec.NAME, SecureStorageModule::class.java.name,
      false, false, false, true,
    ))
  }
}
