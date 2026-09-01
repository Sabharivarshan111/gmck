package com.aistudio.mbbsqbank.aycxvd

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

/**
 * Registers the `OrbitGlass` view, and no modules.
 *
 * `getModule` returning null for everything is correct rather than a stub:
 * this package exists only to hand `createViewManagers` a manager, which is
 * the supported path for a view under the New Architecture. See
 * GlassViewManager for why a view needs none of the TurboModule machinery
 * every other package here carries.
 */
class GlassPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? = null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    emptyMap()
  }

  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ): List<ViewManager<*, *>> = listOf(GlassViewManager())
}
