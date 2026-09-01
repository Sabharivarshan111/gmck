package com.aistudio.mbbsqbank.aycxvd

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * Registers `GlassView` as `OrbitGlass`.
 *
 * **A view is not a module, and the New Architecture treats them oppositely.**
 * A native *module* registered the old way is never reachable — the
 * TurboModule interop flag is false in every stable release, which is why
 * every module in this app is a TurboModule and why one of them once shipped
 * to every device without existing. A native *view* is the other way round:
 * `useFabricInterop()` defaults to **true**, and when Fabric meets a component
 * it has no descriptor for it registers an
 * `UnstableLegacyViewManagerAutomaticComponentDescriptor` for it on the spot
 * (`ComponentDescriptorRegistry.cpp`). So a plain `SimpleViewManager` works,
 * with no codegen, no `codegenConfig` change, and no C++ entry point — and
 * this app has no C++ layer at all, which it would otherwise have had to grow
 * for one view.
 *
 * That asymmetry is worth stating plainly, because the module rule is written
 * down in several places and reads like it should apply here too.
 */
class GlassViewManager : SimpleViewManager<GlassView>() {
  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext): GlassView = GlassView(context)

  /** Matched to the surface's own radius, or the corner refracts in the wrong place. */
  @ReactProp(name = "cornerRadius", defaultFloat = 24f)
  fun setCornerRadius(view: GlassView, value: Float) {
    view.cornerRadius = value
  }

  @ReactProp(name = "refraction", defaultFloat = 0.05f)
  fun setRefraction(view: GlassView, value: Float) {
    view.refraction = value
  }

  @ReactProp(name = "chromatic", defaultFloat = 0.04f)
  fun setChromatic(view: GlassView, value: Float) {
    view.chromatic = value
  }

  @ReactProp(name = "edgeGlow", defaultFloat = 0.18f)
  fun setEdgeGlow(view: GlassView, value: Float) {
    view.edgeGlow = value
  }

  /** The theme's own wash, applied inside the shader rather than over it. */
  @ReactProp(name = "tint", customType = "Color")
  fun setTint(view: GlassView, value: Int?) {
    view.tint = value ?: 0
  }

  /**
   * Bumped when the background changed.
   *
   * The capture is a still, so something has to say when the still is out of
   * date. Nothing native can know that a wallpaper was replaced; JS does.
   */
  @ReactProp(name = "revision", defaultInt = 0)
  fun setRevision(view: GlassView, value: Int) {
    view.revision = value
  }

  companion object {
    const val NAME = "OrbitGlass"
  }
}
