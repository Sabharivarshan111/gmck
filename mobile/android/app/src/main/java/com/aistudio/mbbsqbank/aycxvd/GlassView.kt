package com.aistudio.mbbsqbank.aycxvd

import android.graphics.Bitmap
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RuntimeShader
import android.graphics.Shader
import android.os.Build
import android.os.SystemClock
import android.view.TextureView
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.widget.ImageView
import kotlin.math.abs
import kotlin.math.max

/**
 * Real refraction, on the phones that can do it.
 *
 * Android 13 added AGSL — programmable fragment shaders, through
 * `RuntimeShader` — and this view uses one to bend what is behind it, the way
 * a pane of glass does. Below Android 13 it draws **nothing at all**, which is
 * exactly right: `GlassSurface` has already painted the card and its bevel
 * underneath, so an older phone gets the drawn version and never sees a gap.
 * That ordering is the whole safety story here and it is deliberate — this
 * view is additive, never load-bearing. Every failure below, and there are
 * several possible ones, ends in the same place: nothing is drawn and the
 * bevel shows.
 *
 * ## Where the thing behind it comes from
 *
 * Android has no backdrop filter. A shader can read its own view's pixels and
 * a bitmap you hand it, and nothing else — so what is behind has to be
 * captured. `capture()` rasterises the background view once into a bitmap that
 * every instance shares, and each view samples its own window of it, tracked
 * as the card scrolls.
 *
 * Three things make that affordable enough to keep fresh rather than take
 * once, which is what lets this work over a scrolling page and a playing
 * video rather than only over a still wallpaper:
 *
 * **It is captured small.** A third of each dimension, so a ninth of the
 * pixels — about 1.2MB instead of 10 on a 1080x2400 phone, and a draw that
 * costs about a ninth as much. Nothing is lost: a refracted, edge-weighted
 * backdrop is not a place anybody reads detail, and a downscaled source reads
 * as the softness real glass has anyway.
 *
 * **It is shared and throttled.** One bitmap for every pane on screen, and
 * never more than one capture per `MIN_INTERVAL_MS`, whoever asks.
 *
 * **It only refreshes when something moved.** A still screen captures once
 * and then costs nothing at all. Scrolling refreshes on the throttle; a video
 * wallpaper, which is moving by definition, refreshes on it continuously.
 *
 * ## Two traps, and what is done about them
 *
 * A **video** is a `TextureView` here rather than the SurfaceView
 * `react-native-video` uses by default — see WallpaperBackground. A
 * SurfaceView's frames are on a separate surface the hierarchy cannot read, so
 * `draw()` returns nothing and the old code stood down to the bevel. A
 * TextureView answers `getBitmap`, so the shader can refract a moving picture.
 *
 * And **capturing the screen would capture the glass**, which would then
 * refract its own last frame, and that of the frame before, and so on — a
 * smear that gets worse every time. `capturing` is why: while a capture is in
 * flight every pane draws nothing, so what is rasterised is the app without
 * its glass, which is exactly what should be behind glass.
 */
class GlassView(context: android.content.Context) : View(context) {

  var cornerRadius: Float = 24f
    set(value) {
      field = value
      dirty = true
      invalidate()
    }

  var refraction: Float = 0.05f
    set(value) {
      field = value
      dirty = true
      invalidate()
    }

  var chromatic: Float = 0.04f
    set(value) {
      field = value
      dirty = true
      invalidate()
    }

  var edgeGlow: Float = 0.18f
    set(value) {
      field = value
      dirty = true
      invalidate()
    }

  var tint: Int = Color.TRANSPARENT
    set(value) {
      field = value
      dirty = true
      invalidate()
    }

  /** Bumped by JS when the background changed. Forces a fresh capture. */
  var revision: Int = 0
    set(value) {
      if (field != value) {
        field = value
        synchronized(lock) {
          sharedBitmap?.recycle()
          sharedBitmap = null
          sharedView = null
        }
        localShader = null
        attempts = 0
        gaveUp = false
        invalidate()
      }
    }

  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  private var shader: RuntimeShader? = null
  private var localShader: BitmapShader? = null
  private var dirty = true
  private var offsetX = 0f
  private var offsetY = 0f
  private var attempts = 0
  private var gaveUp = false
  private var lastOffsetChange = 0L

  private val preDraw =
    ViewTreeObserver.OnPreDrawListener {
      trackOffset()
      true
    }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (supported()) {
      viewTreeObserver.addOnPreDrawListener(preDraw)
    }
  }

  override fun onDetachedFromWindow() {
    viewTreeObserver.removeOnPreDrawListener(preDraw)
    super.onDetachedFromWindow()
  }

  /**
   * Keep the sampling window under the card as it scrolls.
   *
   * The bitmap is of the background in its own coordinates; this view moves
   * over it. Without this the refraction would show the same patch of
   * wallpaper wherever the card travelled, which reads as a sticker rather
   * than as glass. Compared against half a pixel of movement so a still screen
   * costs nothing.
   */
  private fun trackOffset() {
    val background = synchronized(lock) { sharedView } ?: return
    if (width <= 0 || height <= 0) return
    val bgAt = IntArray(2)
    val selfAt = IntArray(2)
    background.getLocationOnScreen(bgAt)
    getLocationOnScreen(selfAt)
    val x = (selfAt[0] - bgAt[0]).toFloat()
    val y = (selfAt[1] - bgAt[1]).toFloat()
    if (abs(x - offsetX) >= 0.5f || abs(y - offsetY) >= 0.5f) {
      offsetX = x
      offsetY = y
      lastOffsetChange = SystemClock.uptimeMillis()
      invalidate()
    }
    // A moving picture has to be re-read whether or not this card moved; a
    // still one only when something did. Either way the throttle decides
    // whether the request is actually honoured.
    val moving = synchronized(lock) { sharedView } is TextureView
    if (moving || SystemClock.uptimeMillis() - lastOffsetChange < STILL_AFTER_MS) {
      if (refresh()) invalidate()
    }
  }

  private fun supported(): Boolean = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU

  /**
   * Ask for a fresher picture, if the throttle allows one.
   *
   * Returns whether anything was actually re-read, so the caller only
   * invalidates when there is something new to draw.
   */
  private fun refresh(): Boolean {
    if (gaveUp || !supported()) return false
    val now = SystemClock.uptimeMillis()
    synchronized(lock) {
      if (now - lastCaptureAt < MIN_INTERVAL_MS) return false
    }
    return capture(force = true) != null
  }

  /**
   * Rasterise whatever is behind, small, for everyone.
   *
   * Shared rather than per-view because it is the same picture for all of
   * them, and taken at a third of each dimension because nothing here reads
   * detail: the result is refracted, weighted towards the rim, and softened
   * on the way — a downscaled source looks more like glass, not less, and
   * costs a ninth as much to produce.
   */
  private fun capture(force: Boolean = false): Bitmap? {
    if (!force) {
      synchronized(lock) {
        val existing = sharedBitmap
        if (existing != null && !existing.isRecycled) return existing
      }
    }
    if (gaveUp || width <= 0 || height <= 0) return null
    val background = findBackground(rootView) ?: run { attempts += 1; return null }
    if (background.width <= 0 || background.height <= 0) {
      attempts += 1
      return null
    }

    val scaledWidth = max(1, (background.width * CAPTURE_SCALE).toInt())
    val scaledHeight = max(1, (background.height * CAPTURE_SCALE).toInt())

    return try {
      /*
       * Every pane stands down while this runs.
       *
       * `background.draw` walks the whole tree, this view included, so
       * without the flag each capture would contain the refraction from the
       * previous one — glass reflecting glass, smearing a little further
       * every time. What should be behind glass is the app without it.
       */
      capturing = true
      val bitmap =
        if (background is TextureView) {
          // A SurfaceView cannot be read at all; a TextureView can, and this
          // is the only path that gets a *video* wallpaper into the shader.
          background.getBitmap(scaledWidth, scaledHeight)
        } else {
          Bitmap.createBitmap(scaledWidth, scaledHeight, Bitmap.Config.ARGB_8888).also {
            val canvas = Canvas(it)
            canvas.scale(CAPTURE_SCALE, CAPTURE_SCALE)
            background.draw(canvas)
          }
        }

      if (bitmap == null || !looksReal(bitmap)) {
        bitmap?.recycle()
        attempts += 1
        if (attempts >= MAX_ATTEMPTS) gaveUp = true
        null
      } else {
        synchronized(lock) {
          if (sharedBitmap !== bitmap) sharedBitmap?.recycle()
          sharedBitmap = bitmap
          sharedView = background
          lastCaptureAt = SystemClock.uptimeMillis()
        }
        // A fresh bitmap needs a fresh BitmapShader; the old one still points
        // at pixels that have just been recycled.
        localShader = null
        attempts = 0
        bitmap
      }
    } catch (error: Throwable) {
      attempts += 1
      if (attempts >= MAX_ATTEMPTS) gaveUp = true
      null
    } finally {
      capturing = false
    }
  }

  override fun onDraw(canvas: Canvas) {
    // The gate. Everything below Android 13, every phone whose canvas is not
    // hardware accelerated, and every case where the capture failed, leaves
    // this view drawing nothing over the card GlassSurface already painted.
    if (!supported() || !canvas.isHardwareAccelerated || width <= 0 || height <= 0) return
    // Stand down while the screen is being rasterised, or this pane's own
    // refraction ends up inside the picture it refracts.
    if (capturing) return
    val bitmap = capture() ?: return

    var bitmapShader = localShader
    if (bitmapShader == null) {
      bitmapShader =
        BitmapShader(bitmap, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP).also {
          localShader = it
        }
      dirty = true
    }

    val program =
      shader
        ?: try {
          RuntimeShader(SOURCE).also { shader = it }
        } catch (error: Throwable) {
          gaveUp = true
          return
        }

    if (dirty) {
      program.setInputShader("backdrop", bitmapShader)
      program.setFloatUniform("backdropSize", bitmap.width.toFloat(), bitmap.height.toFloat())
      program.setFloatUniform("captureScale", CAPTURE_SCALE)
      program.setFloatUniform("cornerRadius", cornerRadius)
      program.setFloatUniform("refraction", refraction)
      program.setFloatUniform("chromatic", chromatic)
      program.setFloatUniform("edgeGlow", edgeGlow)
      program.setFloatUniform(
        "tint",
        Color.red(tint) / 255f,
        Color.green(tint) / 255f,
        Color.blue(tint) / 255f,
        Color.alpha(tint) / 255f,
      )
      dirty = false
    }
    program.setFloatUniform("size", width.toFloat(), height.toFloat())
    program.setFloatUniform("origin", offsetX, offsetY)

    paint.shader = program
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
  }

  companion object {
    /** Bitmaps and the view they came from, shared by every instance. */
    private val lock = Any()
    private var sharedBitmap: Bitmap? = null
    private var sharedView: View? = null
    private var lastCaptureAt = 0L

    /**
     * True while the screen is being rasterised.
     *
     * Read by every pane's `onDraw`, so the capture contains the app without
     * its glass. Not synchronised on purpose: it is set and cleared on the UI
     * thread within one synchronous `draw()`, and the only readers are on that
     * same thread inside that same call.
     */
    @Volatile
    private var capturing = false

    /**
     * A third of each dimension, so a ninth of the pixels.
     *
     * What the shader does with the backdrop — bend it hardest at the rim,
     * split the channels, brighten the edge — is not somewhere anyone reads
     * detail, and a downscaled source reads as the softness real glass has.
     * The saving is what makes re-capturing affordable at all.
     */
    private const val CAPTURE_SCALE = 1f / 3f

    /** No more than one capture this often, however many panes ask. */
    private const val MIN_INTERVAL_MS = 90L

    /**
     * How long after the last movement a screen still counts as moving.
     *
     * Momentum scrolling stops arriving as offset changes before it stops
     * looking like motion, so a short tail avoids the backdrop freezing a
     * moment before the page does.
     */
    private const val STILL_AFTER_MS = 400L

    /**
     * How many times to try before leaving it alone.
     *
     * Some backgrounds cannot be read at all — a SurfaceView, a
     * hardware-protected surface — so this has to end. Retrying a
     * rasterisation forever is the failure that would actually hurt
     * somebody's phone, and standing down costs only the shader: the card and
     * its bevel are already drawn underneath.
     */
    private const val MAX_ATTEMPTS = 12

    /**
     * The picture behind: the biggest drawn image, or failing that the biggest
     * view with a background.
     *
     * Which is the wallpaper when there is one, and the root view carrying the
     * theme colour when there is not. The cards themselves have backgrounds
     * too, so size is what separates the page from the things on it.
     */
    private fun findBackground(root: View): View? {
      var bestImage: View? = null
      var bestImageArea = 0L
      var bestTexture: View? = null
      var bestTextureArea = 0L
      var bestPlain: View? = null
      var bestPlainArea = 0L
      fun walk(view: View) {
        if (!view.isShown || view.width <= 0 || view.height <= 0 || view is GlassView) return
        val area = view.width.toLong() * view.height.toLong()
        if (view is TextureView) {
          // The video wallpaper. Preferred over everything else when present:
          // it is the whole page, and it is the one thing that moves.
          if (area > bestTextureArea) {
            bestTextureArea = area
            bestTexture = view
          }
        } else if (view is ImageView && view.drawable != null) {
          if (area > bestImageArea) {
            bestImageArea = area
            bestImage = view
          }
        } else if (view.background != null && area > bestPlainArea) {
          bestPlainArea = area
          bestPlain = view
        }
        if (view is ViewGroup) {
          for (i in 0 until view.childCount) walk(view.getChildAt(i))
        }
      }
      walk(root)
      return bestTexture ?: bestImage ?: bestPlain
    }

    /**
     * Is there anything in this bitmap?
     *
     * A surface the hierarchy cannot read draws nothing into a canvas, so the
     * capture comes back fully transparent and refracting it would replace a
     * perfectly good card with a hole. Nine points, and most of them have to
     * be opaque.
     */
    private fun looksReal(bitmap: Bitmap): Boolean {
      val w = bitmap.width
      val h = bitmap.height
      if (w <= 0 || h <= 0) return false
      var opaque = 0
      for (fx in floatArrayOf(0.2f, 0.5f, 0.8f)) {
        for (fy in floatArrayOf(0.2f, 0.5f, 0.8f)) {
          val x = (w * fx).toInt().coerceIn(0, w - 1)
          val y = (h * fy).toInt().coerceIn(0, h - 1)
          if (Color.alpha(bitmap.getPixel(x, y)) >= 250) opaque += 1
        }
      }
      return opaque >= 6
    }

    /**
     * The shader.
     *
     * A rounded-rectangle signed distance field gives two things at once: how
     * far inside the pane each pixel is, and — from the gradient of that
     * distance — which way the surface is facing. Refraction is then just
     * sampling the backdrop along that normal, hardest at the edges where a
     * real pane is most curved and not at all through the flat middle. The
     * three channels are offset by slightly different amounts, which is the
     * colour fringing you see at the edge of any thick glass, and a Fresnel
     * term brightens the rim because a surface seen at a grazing angle
     * reflects more than one seen face on.
     *
     * Written out rather than pulled from a package: the two React Native
     * Liquid Glass libraries are an iOS-26-only one and an Expo module, and
     * adding the whole Expo module system to a bare app for one view is not a
     * trade worth making. The technique is the technique.
     */
    private const val SOURCE =
      """
      uniform shader backdrop;
      uniform float2 backdropSize;
      uniform float captureScale;
      uniform float2 size;
      uniform float2 origin;
      uniform float cornerRadius;
      uniform float refraction;
      uniform float chromatic;
      uniform float edgeGlow;
      uniform float4 tint;

      // Signed distance to a rounded rectangle: negative inside, zero on the
      // edge. Everything else here is derived from it.
      float roundedBox(float2 p, float2 halfSize, float r) {
        float2 q = abs(p) - halfSize + r;
        return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
      }

      float2 sampleAt(float2 p) {
        // CLAMP tiling means an off-screen sample takes the nearest edge
        // pixel rather than wrapping, which would put the top of the
        // wallpaper along the bottom of a card near the end of a page.
        return clamp(p, float2(0.0), backdropSize - 1.0);
      }

      half4 main(float2 coord) {
        float2 halfSize = size * 0.5;
        float r = min(cornerRadius, min(halfSize.x, halfSize.y));
        float d = roundedBox(coord - halfSize, halfSize, r);
        if (d > 0.0) {
          return half4(0.0);
        }

        // The surface normal, from the gradient of the distance field. Two
        // finite differences: cheaper than anything analytic and exact enough
        // for a pane a few millimetres thick.
        float e = 1.0;
        float2 normal = normalize(float2(
          roundedBox(coord - halfSize + float2(e, 0.0), halfSize, r) -
            roundedBox(coord - halfSize - float2(e, 0.0), halfSize, r),
          roundedBox(coord - halfSize + float2(0.0, e), halfSize, r) -
            roundedBox(coord - halfSize - float2(0.0, e), halfSize, r)
        ) + float2(0.0001));

        // How curved this pixel is: all of it at the rim, none of it across
        // the flat middle. A pane that bent light in its centre would be a
        // lens, not a window.
        float depth = clamp(-d / max(r, 1.0), 0.0, 1.0);
        float curve = pow(1.0 - depth, 3.0);

        // The backdrop was captured small, so the window this pane samples has
        // to shrink by the same factor. Getting this wrong shows as the
        // refraction sliding away from the card as you scroll down the page.
        float2 base = (coord + origin) * captureScale;
        float push = curve * refraction * min(size.x, size.y) * captureScale;
        float2 shift = normal * push;

        half4 colour;
        colour.r = backdrop.eval(sampleAt(base + shift * (1.0 + chromatic))).r;
        colour.g = backdrop.eval(sampleAt(base + shift)).g;
        colour.b = backdrop.eval(sampleAt(base + shift * (1.0 - chromatic))).b;
        colour.a = 1.0;

        colour.rgb = mix(colour.rgb, tint.rgb, tint.a);

        // Fresnel: a grazing surface reflects more. This is the bright rim,
        // and it is the cheapest half of what makes the material read.
        float fresnel = pow(1.0 - depth, 6.0) * edgeGlow;
        colour.rgb = colour.rgb + half3(fresnel);

        // Feather the last pixel of the edge so the corner is not a staircase.
        float alpha = clamp(-d, 0.0, 1.0);
        return half4(colour.rgb * alpha, alpha);
      }
      """
  }
}
