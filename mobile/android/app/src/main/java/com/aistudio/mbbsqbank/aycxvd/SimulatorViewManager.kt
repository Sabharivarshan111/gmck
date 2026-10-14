package com.aistudio.mbbsqbank.aycxvd

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.webkit.*
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.Event

/** Dedicated local WebGL teaching surface; the surrounding app remains React Native.
 * Like OrbitGlass, a view manager uses Fabric's supported view interop.
 */
class SimulatorViewManager : SimpleViewManager<WebView>() {
  private val qaListeners = java.util.WeakHashMap<WebView, BaseActivityEventListener>()
  override fun getName() = "OrbitSimulator"

  private fun status(view: WebView, value: String) {
    view.post {
      val context = view.context as ThemedReactContext
      UIManagerHelper.getEventDispatcherForReactTag(context, view.id)?.dispatchEvent(
        SimulatorStatusEvent(UIManagerHelper.getSurfaceId(view), view.id, value)
      )
    }
  }

  @SuppressLint("SetJavaScriptEnabled")
  override fun createViewInstance(context: ThemedReactContext): WebView {
    val store = SimulatorAssetStore(context)
    return WebView(context).apply {
      settings.javaScriptEnabled = true
      settings.domStorageEnabled = true
      settings.allowFileAccess = false
      settings.allowContentAccess = false
      settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
      settings.mediaPlaybackRequiresUserGesture = true
      settings.setSupportMultipleWindows(false)
      settings.setGeolocationEnabled(false)
      webChromeClient = object : WebChromeClient() {
        override fun onConsoleMessage(message: ConsoleMessage): Boolean {
          if (BuildConfig.DEBUG && message.message().startsWith("ORBIT_NATIVE_GEOMETRY:")) {
            android.util.Log.i("ORBIT_ANATOMY", message.message())
          }
          return true
        }
      }
      webViewClient = object : WebViewClient() {
        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
          val uri = request.url
          if (uri.scheme != "https" || uri.host != HOST || request.method != "GET") return store.failure(403, "Forbidden")
          return store.response(uri.path ?: "/")
        }
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
          val uri = request.url
          if (uri.scheme == "https" && uri.host == HOST && uri.path == "/simulator") return false
          if (uri.host == HOST && uri.path == "/notes") status(view, "exit")
          else if (uri.scheme == "https") {
            try { context.startActivity(Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
            catch (_: Exception) { /* No installed handler. */ }
          }
          return true
        }
        override fun onPageStarted(view: WebView, url: String?, icon: android.graphics.Bitmap?) { status(view, "loading") }
        override fun onPageFinished(view: WebView, url: String?) { status(view, "ready") }
        override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
          if (request.isForMainFrame) status(view, "error")
        }
        override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
          status(view, "error"); return true
        }
      }
      if (BuildConfig.DEBUG) {
        val view = this
        val listener = object : BaseActivityEventListener() {
          override fun onNewIntent(intent: Intent) {
            intent.getStringExtra("orbit_anatomy_qa_route")?.let { route -> view.post { loadRoute(view, route) } }
          }
        }
        qaListeners[view] = listener
        context.addActivityEventListener(listener)
      }
    }
  }

  @ReactProp(name = "route")
  fun setRoute(view: WebView, route: String?) {
    val context = view.context as ThemedReactContext
    val qaRoute = if (BuildConfig.DEBUG) context.currentActivity?.intent?.getStringExtra("orbit_anatomy_qa_route") else null
    loadRoute(view, qaRoute ?: route)
  }

  private fun loadRoute(view: WebView, route: String?) {
    if (route == null || !route.startsWith("/simulator") || route.startsWith("//")) return
    val uri = Uri.parse("https://$HOST$route")
    if (uri.host == HOST && uri.path == "/simulator" && view.url != uri.toString()) view.loadUrl(uri.toString())
  }

  @ReactProp(name = "active", defaultBoolean = true)
  fun setActive(view: WebView, active: Boolean) {
    if (active) view.onResume() else view.onPause()
    view.evaluateJavascript("window.dispatchEvent(new CustomEvent('orbit-native-active',{detail:$active}));", null)
  }

  @ReactProp(name = "backRequest", defaultInt = 0)
  fun setBackRequest(view: WebView, request: Int) {
    if (request == 0) return
    view.evaluateJavascript("""
      (() => {
        const selectors = ['[aria-label="Exit full screen"]','[aria-label="Close ECG tutorial"]','[aria-label="Close bedside examination"]','[aria-label="Close clubbing skill"]','[aria-label="Close diagnostic tool"]','[title="Close Drawer"]','[aria-label="Close anatomy browser"]','[aria-label="Close anatomy tools"]'];
        for (const selector of selectors) {
          const button = document.querySelector(selector);
          if (button && button.getClientRects().length) { button.click(); return true; }
        }
        return false;
      })()
    """.trimIndent()) { closed -> if (closed != "true") status(view, "exit") }
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
    mutableMapOf("topStatus" to mapOf("registrationName" to "onStatus"))

  override fun onDropViewInstance(view: WebView) {
    qaListeners.remove(view)?.let { (view.context as ThemedReactContext).removeActivityEventListener(it) }
    view.stopLoading(); view.destroy(); super.onDropViewInstance(view)
  }
  companion object { private const val HOST = "appassets.androidplatform.net" }
}

private class SimulatorStatusEvent(surfaceId: Int, tag: Int, private val status: String) :
  Event<SimulatorStatusEvent>(surfaceId, tag) {
  override fun getEventName() = "topStatus"
  override fun canCoalesce() = false
  override fun getEventData() = Arguments.createMap().apply { putString("status", status) }
}
