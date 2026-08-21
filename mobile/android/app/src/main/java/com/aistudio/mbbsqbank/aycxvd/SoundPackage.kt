package com.aistudio.mbbsqbank.aycxvd

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Registers SoundModule. Added by hand in MainApplication because this module
 * lives in the app itself rather than in a node module, so there is nothing
 * for autolinking to find.
 *
 * A `BaseReactPackage`, not a plain `ReactPackage`. Under the New Architecture
 * the TurboModule manager only ever asks packages of this shape for modules;
 * a package that returns them from `createNativeModules` is skipped entirely
 * unless the `useTurboModuleInterop` feature flag is on, and that flag is
 * `false` in every stable React Native release. Registered the old way, the
 * module was not merely unreliable — it never appeared at all.
 */
class SoundPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == NativeOrbitSoundSpec.NAME) SoundModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
      NativeOrbitSoundSpec.NAME to
        ReactModuleInfo(
          NativeOrbitSoundSpec.NAME,
          SoundModule::class.java.name,
          /* canOverrideExistingModule = */ false,
          // Eager, so the clips are decoded before the first tap rather than
          // because of it. SoundPool.load() is asynchronous and playing a
          // sample that has not finished decoding is a silent no-op — built
          // lazily, the module is constructed *by* the first press and that
          // press makes no sound.
          /* needsEagerInit = */ true,
          /* isCxxModule = */ false,
          /* isTurboModule = */ true,
        )
    )
  }
}
