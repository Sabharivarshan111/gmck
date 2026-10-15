package com.aistudio.mbbsqbank.aycxvd

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
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
  private val stores = java.util.WeakHashMap<WebView, SimulatorAssetStore>()
  private val pendingRoutes = java.util.WeakHashMap<WebView, String>()
  private data class Fullscreen(val parent: ViewGroup, val container: FrameLayout, val previousFlags: Int, val callback: WebChromeClient.CustomViewCallback)
  private val fullscreens = java.util.WeakHashMap<WebView, Fullscreen>()
  override fun getName() = "OrbitSimulator"

  private fun status(view: WebView, value: String, patient: String? = null) {
    view.post {
      val context = view.context as ThemedReactContext
      UIManagerHelper.getEventDispatcherForReactTag(context, view.id)?.dispatchEvent(
        SimulatorStatusEvent(UIManagerHelper.getSurfaceId(view), view.id, value, patient)
      )
    }
  }

  @SuppressLint("SetJavaScriptEnabled")
  override fun createViewInstance(context: ThemedReactContext): WebView {
    val store = SimulatorAssetStore(context)
    if (QA_ENABLED) ServiceWorkerController.getInstance().setServiceWorkerClient(object : ServiceWorkerClient() {
      override fun shouldInterceptRequest(request: WebResourceRequest): WebResourceResponse? {
        return if (request.method == "GET" && request.url.scheme == "https" && request.url.host == REFERENCE_HOST) null else store.failure(403, "Third-party QA request blocked")
      }
    })
    return WebView(context).apply {
      stores[this] = store
      settings.javaScriptEnabled = true
      settings.domStorageEnabled = true
      settings.allowFileAccess = false
      settings.allowContentAccess = false
      settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
      settings.mediaPlaybackRequiresUserGesture = true
      settings.setSupportMultipleWindows(false)
      settings.setGeolocationEnabled(false)
      webChromeClient = object : WebChromeClient() {
        override fun onShowCustomView(custom: View, callback: CustomViewCallback) {
          val activity = context.currentActivity
          if (activity == null) { callback.onCustomViewHidden(); return }
          hideFullscreen(this@apply)
          val parent = activity.window.decorView as ViewGroup
          val previous = parent.systemUiVisibility
          val container = FrameLayout(activity).apply {
            setBackgroundColor(android.graphics.Color.BLACK)
            addView(custom, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
          }
          fullscreens[this@apply] = Fullscreen(parent, container, previous, callback)
          parent.addView(container, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
          if (android.os.Build.VERSION.SDK_INT >= 30) activity.window.insetsController?.hide(android.view.WindowInsets.Type.systemBars())
          else parent.systemUiVisibility = View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        }
        override fun onHideCustomView() { hideFullscreen(this@apply) }
        override fun onConsoleMessage(message: ConsoleMessage): Boolean {
          if (message.message().startsWith("ORBIT_NATIVE_RENDER_ERROR:")) {
            if (QA_ENABLED) android.util.Log.e("ORBIT_ANATOMY", message.message().take(1200))
            status(this@apply, "error")
          } else if (QA_ENABLED && message.messageLevel() == ConsoleMessage.MessageLevel.ERROR) {
            android.util.Log.e("ORBIT_SIMULATOR", message.message().take(1200))
          }
          if (message.message().contains("THREE.WebGLProgram: Shader Error")) {
            if (QA_ENABLED) android.util.Log.e("ORBIT_ANATOMY", "ORBIT_NATIVE_SHADER_ERROR:" + message.message())
            status(this@apply, "error")
          }
          if (message.message().startsWith("ORBIT_NATIVE_PATIENT:")) {
            val patient = message.message().removePrefix("ORBIT_NATIVE_PATIENT:")
            if (patient.length < 500000) status(this@apply, "patient", patient)
          }
          if (QA_ENABLED && message.message().startsWith("ORBIT_NATIVE_GEOMETRY:")) {
            android.util.Log.i("ORBIT_ANATOMY", message.message())
          }
          return true
        }
      }
      webViewClient = object : WebViewClient() {
        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
          val uri = request.url
          // QA only: the real Vercel page on the same Android WebView/GPU/fonts.
          // Third-party requests (including live ad scripts) remain blocked.
          if (QA_ENABLED && store.referenceMode && request.method == "GET" && uri.scheme == "https" && uri.host == REFERENCE_HOST) return null
          if (uri.scheme != "https" || uri.host != HOST || request.method != "GET") return store.failure(403, "Forbidden")
          return store.response(uri.path ?: "/")
        }
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
          val uri = request.url
          if (QA_ENABLED && store.referenceMode && uri.scheme == "https" && uri.host == REFERENCE_HOST && uri.path == "/simulator") return false
          if (uri.scheme == "https" && uri.host == HOST && uri.path == "/simulator") return false
          if (uri.host == HOST && uri.path == "/notes") status(view, "vault")
          else if (uri.scheme == "https") {
            try { context.startActivity(Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
            catch (_: Exception) { /* No installed handler. */ }
          }
          return true
        }
        override fun onPageStarted(view: WebView, url: String?, icon: android.graphics.Bitmap?) { status(view, "loading") }
        override fun onPageFinished(view: WebView, url: String?) {
          status(view, "ready")
          if (QA_ENABLED && store.referenceMode) view.evaluateJavascript("""
            (() => {
              if (window.__orbitDeviceRead) return;
              window.__orbitDeviceRead = true;
              let last = '';
              let pending = 0;
              let failed = false;
              const originalFetch = window.fetch.bind(window);
              window.fetch = async (input, init) => {
                const url = typeof input==='string'?input:input instanceof URL?input.href:input.url;
                if (!url.includes('/models/')) return originalFetch(input,init);
                pending++;
                try {
                  const response = await originalFetch(input,init);
                  if (!response.ok) failed=true;
                  response.clone().arrayBuffer().catch(()=>{failed=true;}).finally(()=>{pending--;});
                  return response;
                } catch (error) { pending--; failed=true; throw error; }
              };
              setInterval(() => {
                const renderer = document.querySelector('[data-testid="anatomy-renderer"]');
                const canvas = renderer?.querySelector('canvas');
                const systems = renderer?.getAttribute('data-visible-atlas-systems');
                const geometry = JSON.stringify({route:location.search,viewport:[innerWidth,innerHeight],systems,canvas:canvas?[canvas.width,canvas.height]:null,loading:/LOADING BODYPARTS3D/.test(renderer?.textContent||'')||pending>0,graphicsError:!!renderer?.querySelector('[role="alert"]')||failed||/failed to load|could not be loaded/.test(renderer?.textContent||''),resources:performance.getEntriesByType('resource').filter(entry=>entry.name.includes('/models/')).length,reference:true});
                if (geometry!==last && canvas && systems!==null) { console.info('ORBIT_NATIVE_GEOMETRY:'+geometry); last=geometry; }
              },1000);
            })()
          """.trimIndent(), null)
        }
        override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
          if (request.isForMainFrame) status(view, "error")
        }
        override fun onReceivedHttpError(view: WebView, request: WebResourceRequest, response: WebResourceResponse) {
          if (request.isForMainFrame) status(view, "error")
        }
        override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
          status(view, "error"); return true
        }
      }
      if (QA_ENABLED) {
        val view = this
        val listener = object : BaseActivityEventListener() {
          override fun onNewIntent(intent: Intent) {
            intent.getStringExtra("orbit_anatomy_qa_route")?.let { route -> view.post {
              store.referenceMode = intent.getBooleanExtra("orbit_anatomy_qa_reference", false)
              loadRoute(view, route)
            } }
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
    val qaRoute = if (QA_ENABLED) context.currentActivity?.intent?.getStringExtra("orbit_anatomy_qa_route") else null
    stores[view]?.referenceMode = QA_ENABLED && context.currentActivity?.intent?.getBooleanExtra("orbit_anatomy_qa_reference", false) == true
    (qaRoute ?: route)?.let { pendingRoutes[view] = it }
  }

  @ReactProp(name = "initialPatient")
  fun setInitialPatient(view: WebView, patient: String?) {
    stores[view]?.initialPatient = if (patient != null && patient.length < 500000) patient else null
  }

  override fun onAfterUpdateTransaction(view: WebView) {
    super.onAfterUpdateTransaction(view)
    pendingRoutes.remove(view)?.let { loadRoute(view, it) }
  }

  private fun loadRoute(view: WebView, route: String?) {
    if (route == null || !route.startsWith("/simulator") || route.startsWith("//")) return
    val host = if (QA_ENABLED && stores[view]?.referenceMode == true) REFERENCE_HOST else HOST
    val base = Uri.parse("https://$host$route")
    val context = view.context as ThemedReactContext
    val uri = if (QA_ENABLED && context.currentActivity?.intent?.hasExtra("orbit_anatomy_qa_route") == true)
      base.buildUpon().appendQueryParameter("native_audit", "1").build() else base
    if (uri.host == host && uri.path == "/simulator" && view.url != uri.toString()) view.loadUrl(uri.toString())
  }

  @ReactProp(name = "active", defaultBoolean = true)
  fun setActive(view: WebView, active: Boolean) {
    if (active) view.onResume() else view.onPause()
    view.evaluateJavascript("window.dispatchEvent(new CustomEvent('orbit-native-active',{detail:$active}));", null)
  }

  @ReactProp(name = "backRequest", defaultInt = 0)
  fun setBackRequest(view: WebView, request: Int) {
    if (request == 0) return
    if (fullscreens.containsKey(view)) { hideFullscreen(view); return }
    view.evaluateJavascript("""
      (() => {
        const selectors = ['[aria-label="Exit full screen"]','[aria-label="Close ECG tutorial"]','[aria-label="Close bedside examination"]','[aria-label="Close clubbing skill"]','[aria-label="Close diagnostic tool"]','[title="Close Drawer"]','[aria-label="Close anatomy browser"]','[aria-label="Close anatomy tools"]'];
        for (const selector of selectors) {
          const button = document.querySelector(selector);
          if (button && button.getClientRects().length) { button.click(); return true; }
        }
        if (window.__orbitPatientKernel) console.info('ORBIT_NATIVE_PATIENT:' + JSON.stringify({...window.__orbitPatientKernel,nativeTheme:localStorage.getItem('orbit-simulator-theme')}));
        return false;
      })()
    """.trimIndent()) { closed -> if (closed != "true") status(view, "exit") }
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
    mutableMapOf("topStatus" to mapOf("registrationName" to "onStatus"))

  override fun onDropViewInstance(view: WebView) {
    hideFullscreen(view)
    qaListeners.remove(view)?.let { (view.context as ThemedReactContext).removeActivityEventListener(it) }
    stores.remove(view); pendingRoutes.remove(view)
    view.stopLoading(); view.destroy(); super.onDropViewInstance(view)
  }
  private fun hideFullscreen(view: WebView) {
    val state = fullscreens.remove(view) ?: return
    state.parent.removeView(state.container)
    state.parent.systemUiVisibility = state.previousFlags
    val activity = (view.context as ThemedReactContext).currentActivity
    if (android.os.Build.VERSION.SDK_INT >= 30) activity?.window?.insetsController?.show(android.view.WindowInsets.Type.systemBars())
    state.callback.onCustomViewHidden()
  }
  companion object {
    // Preview APKs are optimized and therefore have DEBUG=false.
    // Device routing is confined to the two test variants; never internal/release.
    private val QA_ENABLED = BuildConfig.DEBUG || BuildConfig.BUILD_TYPE == "preview"
    private const val HOST = "appassets.androidplatform.net"
    private const val REFERENCE_HOST = "orbitmbbs.vercel.app"
  }
}

private class SimulatorStatusEvent(surfaceId: Int, tag: Int, private val status: String, private val patient: String?) :
  Event<SimulatorStatusEvent>(surfaceId, tag) {
  override fun getEventName() = "topStatus"
  override fun canCoalesce() = false
  override fun getEventData() = Arguments.createMap().apply { putString("status", status); patient?.let { putString("patient", it) } }
}
