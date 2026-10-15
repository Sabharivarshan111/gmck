package com.aistudio.mbbsqbank.aycxvd

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class RadiologyPackage : BaseReactPackage() {
  override fun getModule(name: String, context: ReactApplicationContext): NativeModule? =
    if (name == RadiologyModule.NAME) RadiologyModule(context) else null
  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(RadiologyModule.NAME to ReactModuleInfo(RadiologyModule.NAME, RadiologyModule::class.java.name, false, false, false, true))
  }
}
