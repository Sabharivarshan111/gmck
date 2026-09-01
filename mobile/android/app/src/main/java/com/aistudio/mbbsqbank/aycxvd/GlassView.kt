package com.aistudio.mbbsqbank.aycxvd

import android.graphics.Bitmap
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RuntimeShader
import android.graphics.Shader
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.widget.ImageView
import kotlin.math.abs

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
 * A snapshot is only honest because of what is actually behind a card in this
 * app: a wallpaper, or a flat theme colour. Both are still. The things that
 * move are the cards themselves, which are siblings of the background and not
 * part of it. Over a scrolling *background* this technique would show a frozen
 * picture, and it is worth knowing that before it is reused somewhere else.
 *
 * `revision` is how JS says the background changed — a new wallpaper, mostly.
 * There is no listener that could know.
 *
 * ## What can go wrong, and what happens then
 *
 * A **video wallpaper** is a SurfaceView, and `draw()` on one produces
 * nothing: the video lives on a separate surface the view hierarchy cannot
 * read. The capture comes back transparent, `looksReal()` rejects it, and
 * after a few retries this view gives up for good and leaves the bevel. That
 * is the correct outcome and it is why the retries are bounded — a view that
 * kept re-rasterising a full-screen bitmap every frame, forever, on a cheap
 * phone, is a worse bug than the one it was trying to fix.
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
      invalidate()
    }
  }

  private fun supported(): Boolean = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU

  /**
   * Rasterise whatever is behind, once, for everyone.
   *
   * Shared rather than per-view because it is the same picture for all of
   * them and it is measured in megabytes — a full-screen ARGB_8888 bitmap is
   * about ten on a 1080x2400 phone, and one per card would be indefensible on
   * the handsets this app is for.
   */
  private fun capture(): Bitmap? {
    synchronized(lock) {
      val existing = sharedBitmap
      if (existing != null && !existing.isRecycled) return existing
    }
    if (gaveUp || width <= 0 || height <= 0) return null
    val background = findBackground(rootView) ?: run { attempts += 1; return null }
    if (background.width <= 0 || background.height <= 0) {
      attempts += 1
      return null
    }
    return try {
      val bitmap = Bitmap.createBitmap(background.width, background.height, Bitmap.Config.ARGB_8888)
      background.draw(Canvas(bitmap))
      if (!looksReal(bitmap)) {
        bitmap.recycle()
        attempts += 1
        if (attempts >= MAX_ATTEMPTS) gaveUp = true
        null
      } else {
        synchronized(lock) {
          sharedBitmap?.recycle()
          sharedBitmap = bitmap
          sharedView = background
        }
        attempts = 0
        bitmap
      }
    } catch (error: Throwable) {
      attempts += 1
      if (attempts >= MAX_ATTEMPTS) gaveUp = true
      null
    }
  }

  override fun onDraw(canvas: Canvas) {
    // The gate. Everything below Android 13, every phone whose canvas is not
    // hardware accelerated, and every case where the capture failed, leaves
    // this view drawing nothing over the card GlassSurface already painted.
    if (!supported() || !canvas.isHardwareAccelerated || width <= 0 || height <= 0) return
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

    /**
     * How many times to try before leaving it alone.
     *
     * A video wallpaper can never be captured, so this has to end. Retrying
     * a full-screen rasterisation forever is the failure that would actually
     * hurt somebody's phone.
     */
    private const val MAX_ATTEMPTS = 8

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
      var bestPlain: View? = null
      var bestPlainArea = 0L
      fun walk(view: View) {
        if (!view.isShown || view.width <= 0 || view.height <= 0 || view is GlassView) return
        val area = view.width.toLong() * view.height.toLong()
        if (view is ImageView && view.drawable != null) {
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
      return bestImage ?: bestPlain
    }

    /**
     * Is there anything in this bitmap?
     *
     * A SurfaceView — the video wallpaper — draws nothing into a canvas, so
     * the capture comes back fully transparent and refracting it would replace
     * a perfectly good card with a hole. Nine points, and most of them have to
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

        float2 base = coord + origin;
        float push = curve * refraction * min(size.x, size.y);
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
