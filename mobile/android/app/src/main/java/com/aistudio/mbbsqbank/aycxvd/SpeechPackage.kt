package com.aistudio.mbbsqbank.aycxvd

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Registers SpeechModule. Added by hand in MainApplication for the same reason
 * SoundPackage is: the module lives in the app rather than a node module, so
 * autolinking has nothing to find.
 *
 * A `BaseReactPackage`, not a plain `ReactPackage`. The TurboModule manager
 * only ever asks packages of this shape; one that returns modules from
 * `createNativeModules` is skipped entirely unless `useTurboModuleInterop` is
 * on, and that flag is `false` in every stable React Native release. This app
 * has already shipped a module registered the old way — it was not unreliable,
 * it never existed.
 */
class SpeechPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == NativeOrbitSpeechSpec.NAME) SpeechModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
      NativeOrbitSpeechSpec.NAME to
        ReactModuleInfo(
          NativeOrbitSpeechSpec.NAME,
          SpeechModule::class.java.name,
          /* canOverrideExistingModule = */ false,
          // Lazy, unlike sound. There is nothing to warm up — SpeechRecognizer
          // is created per session inside start() — and building it eagerly
          // would put a system-service lookup on the launch path for a feature
          // most launches never touch.
          /* needsEagerInit = */ false,
          /* isCxxModule = */ false,
          /* isTurboModule = */ true,
        )
    )
  }
}
