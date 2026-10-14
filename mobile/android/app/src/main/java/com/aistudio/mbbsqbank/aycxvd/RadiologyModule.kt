package com.aistudio.mbbsqbank.aycxvd

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import java.io.ByteArrayOutputStream
import java.security.MessageDigest
import java.util.concurrent.Executors
import java.util.zip.GZIPInputStream
import org.json.JSONObject

/** Offline raster renderer; the volume, coordinates and images are identical to Vercel. */
@ReactModule(name = RadiologyModule.NAME)
class RadiologyModule(private val context: ReactApplicationContext) : NativeOrbitRadiologySpec(context) {
  companion object { const val NAME = "OrbitRadiology" }
  private val worker = Executors.newSingleThreadExecutor()
  private var volume: ByteArray? = null
  private var metadata: JSONObject? = null
  private var cachedPath: String? = null
  private var cachedImage: Bitmap? = null
  override fun getName(): String = NAME

  private fun encode(bitmap: Bitmap): String {
    val output = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)
    return JSONObject().put("width", bitmap.width).put("height", bitmap.height)
      .put("uri", "data:image/png;base64," + Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP)).toString()
  }
  private fun adjusted(source: Bitmap, contrast: Double, brightness: Double): Bitmap {
    require(contrast.isFinite() && contrast in 0.5..2.0 && brightness.isFinite() && brightness in 0.5..1.8)
    // CSS applies contrast first, then brightness; its pivot is 0.5.
    val scale = (contrast * brightness).toFloat()
    val offset = (127.5 * (1.0 - contrast) * brightness).toFloat()
    val matrix = ColorMatrix(floatArrayOf(scale,0f,0f,0f,offset, 0f,scale,0f,0f,offset, 0f,0f,scale,0f,offset, 0f,0f,0f,1f,0f))
    val result = Bitmap.createBitmap(source.width, source.height, Bitmap.Config.ARGB_8888)
    Canvas(result).drawBitmap(source,0f,0f,Paint().apply { colorFilter = ColorMatrixColorFilter(matrix) })
    return result
  }
  override fun renderXray(path: String, contrast: Double, brightness: Double, promise: Promise) {
    worker.execute {
      try {
        require(path.matches(Regex("clinical-reference/(radiology/(pa\\.jpg|cases/[0-9]+\\.jpg)|clubbing\\.jpg)"))) { "Invalid reference path" }
        if (cachedPath != path) {
          val bytes = context.assets.open(path).use { it.readBytes() }
          require(bytes.size <= 5000000) { "Oversized reference" }
          val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
          BitmapFactory.decodeByteArray(bytes,0,bytes.size,bounds)
          require(bounds.outWidth in 1..3000 && bounds.outHeight in 1..3000) { "Invalid image dimensions" }
          val image = BitmapFactory.decodeByteArray(bytes,0,bytes.size) ?: error("Image decode failed")
          cachedImage?.recycle(); cachedImage = image; cachedPath = path
        }
        val result = adjusted(cachedImage ?: error("No image"),contrast,brightness)
        try { promise.resolve(encode(result)) } finally { result.recycle() }
      } catch (error: Exception) { promise.reject("RADIOLOGY_IMAGE", error.message, error) }
    }
  }
  private fun loadVolume(): Pair<JSONObject, ByteArray> {
    if (volume == null) {
      val meta = JSONObject(context.assets.open("clinical-reference/radiology/brain-t1.json").bufferedReader().use { it.readText() })
      val dims = meta.getJSONArray("dimensions")
      val expected = dims.getInt(0) * dims.getInt(1) * dims.getInt(2)
      require(expected in 1..4000000) { "Oversized MRI" }
      val bytes = GZIPInputStream(context.assets.open("clinical-reference/radiology/brain-t1.pack")).use { stream ->
        val result = ByteArray(expected)
        var filled = 0
        while (filled < expected) {
          val count = stream.read(result,filled,expected-filled)
          require(count > 0) { "Incomplete MRI" }; filled += count
        }
        require(stream.read() == -1) { "MRI length mismatch" }; result
      }
      val sha = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
      require(sha == meta.getString("volumeSha256")) { "MRI checksum mismatch" }
      metadata = meta; volume = bytes
    }
    return Pair(metadata ?: error("No metadata"),volume ?: error("No volume"))
  }
  override fun renderMri(plane: String, slice: Double, contrast: Double, brightness: Double, promise: Promise) {
    worker.execute {
      try {
        val (meta,data) = loadVolume()
        val dims = meta.getJSONArray("dimensions")
        val axes = when(plane) { "axial" -> intArrayOf(0,1,2); "coronal" -> intArrayOf(0,2,1); "sagittal" -> intArrayOf(1,2,0); else -> error("Invalid MRI plane") }
        val w = dims.getInt(axes[0]); val h = dims.getInt(axes[1])
        require(slice.isFinite() && slice == slice.toInt().toDouble() && slice >= 0 && slice < dims.getInt(axes[2])) { "Invalid slice" }
        val pixels = IntArray(w*h)
        val p = IntArray(3); p[axes[2]] = slice.toInt()
        for (y in 0 until h) for (x in 0 until w) {
          p[axes[0]] = w-1-x; p[axes[1]] = h-1-y
          val gray = data[p[0]+dims.getInt(0)*(p[1]+dims.getInt(1)*p[2])].toInt() and 255
          pixels[x+y*w] = (0xff shl 24) or (gray shl 16) or (gray shl 8) or gray
        }
        val source = Bitmap.createBitmap(pixels,w,h,Bitmap.Config.ARGB_8888)
        val result = try { adjusted(source,contrast,brightness) } finally { source.recycle() }
        try { promise.resolve(encode(result)) } finally { result.recycle() }
      } catch (error: Exception) { promise.reject("RADIOLOGY_MRI",error.message,error) }
    }
  }
  override fun invalidate() {
    worker.execute { cachedImage?.recycle(); cachedImage = null; volume = null; metadata = null }
    worker.shutdown(); super.invalidate()
  }
}
