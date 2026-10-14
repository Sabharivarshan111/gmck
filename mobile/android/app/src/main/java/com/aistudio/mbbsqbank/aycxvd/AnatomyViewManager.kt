package com.aistudio.mbbsqbank.aycxvd
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
class AnatomyViewManager : SimpleViewManager<AnatomyView>() {
  override fun getName(): String = "OrbitAnatomy"
  override fun createViewInstance(context: ThemedReactContext): AnatomyView = AnatomyView(context)
  @ReactProp(name = "model") fun model(view: AnatomyView, value: String?) { view.configure(model = value ?: "atlas") }
  @ReactProp(name = "visibleIds") fun visible(view: AnatomyView, value: String?) { view.configure(visible = value ?: "") }
  @ReactProp(name = "contextIds") fun context(view: AnatomyView, value: String?) { view.configure(context = value ?: "") }
  @ReactProp(name = "annotationIds") fun annotations(view: AnatomyView, value: String?) { view.configure(annotations = value ?: "") }
  @ReactProp(name = "region") fun region(view: AnatomyView, value: String?) { view.configure(region = value ?: "full") }
  @ReactProp(name = "layer") fun layer(view: AnatomyView, value: String?) { view.configure(layer = value ?: "surface") }
  @ReactProp(name = "hiddenIds") fun hidden(view: AnatomyView, value: String?) { view.configure(hidden = value ?: "") }
  @ReactProp(name = "spread", defaultFloat = 0f) fun spread(view: AnatomyView, value: Float) { view.configure(spread = value.coerceIn(0f, 1f)) }
  @ReactProp(name = "cameraAction", defaultInt = 0) fun camera(view: AnatomyView, value: Int) { view.cameraAction(value) }
  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> = mutableMapOf(
    "topModelSelection" to mapOf("registrationName" to "onModelSelection"),
    "topModelLabels" to mapOf("registrationName" to "onModelLabels"),
    "topModelStatus" to mapOf("registrationName" to "onModelStatus")
  )
  override fun onDropViewInstance(view: AnatomyView) { view.release(); super.onDropViewInstance(view) }
}
