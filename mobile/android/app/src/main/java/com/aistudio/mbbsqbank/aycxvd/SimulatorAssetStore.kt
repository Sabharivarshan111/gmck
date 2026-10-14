package com.aistudio.mbbsqbank.aycxvd

import android.content.Context
import android.webkit.WebResourceResponse
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap

/** Exact public reference bytes, served from APK metadata or persistent private cache.
 * No script, credentials, redirects or arbitrary URL can enter this download path.
 */
internal class SimulatorAssetStore(private val context: Context) {
  private val manifest = JSONObject(context.assets.open("simulator/asset-manifest.json").bufferedReader().use { it.readText() })
  private val locks = ConcurrentHashMap<String, Any>()
  private val directory = File(context.filesDir, "simulator-models-v1").apply { mkdirs() }

  private fun mime(path: String) = when (path.substringAfterLast('.')) {
    "html" -> "text/html"
    "js" -> "application/javascript"
    "css" -> "text/css"
    "json" -> "application/json"
    "jpg", "jpeg" -> "image/jpeg"
    "png" -> "image/png"
    "svg" -> "image/svg+xml"
    "glb" -> "model/gltf-binary"
    else -> "application/octet-stream"
  }

  fun response(path: String): WebResourceResponse {
    if (!path.matches(Regex("/[A-Za-z0-9_./-]+")) || path.contains("..")) return failure(403, "Forbidden")
    val packagedPath = if (path == "/simulator" || path == "/") "/index.html" else path
    try {
      return WebResourceResponse(mime(packagedPath), "UTF-8", context.assets.open("simulator$packagedPath"))
    } catch (_: java.io.IOException) { /* A pinned large reference may be cached below. */ }
    // Radiology and clubbing already have an offline native asset source.
    if (path.startsWith("/clinical-reference/")) {
      try { return WebResourceResponse(mime(path), null, context.assets.open(path.drop(1))) }
      catch (_: java.io.IOException) { /* Unpackaged references follow the same hash check. */ }
    }
    val entry = manifest.optJSONObject(path) ?: return failure(404, "Not Found")
    val sha = entry.getString("sha256")
    val expectedSize = entry.getLong("bytes")
    synchronized(locks.computeIfAbsent(sha) { Any() }) {
      val cached = File(directory, sha)
      fun valid(file: File): Boolean {
        if (!file.isFile || file.length() != expectedSize) return false
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input ->
          val buffer = ByteArray(64 * 1024)
          while (true) { val n = input.read(buffer); if (n < 0) break; digest.update(buffer, 0, n) }
        }
        return digest.digest().joinToString("") { "%02x".format(it) } == sha
      }
      if (!valid(cached)) {
        cached.delete()
        val temporary = File(directory, "$sha.partial")
        val connection = URL("https://orbitmbbs.vercel.app$path").openConnection() as HttpURLConnection
        try {
          connection.instanceFollowRedirects = false
          connection.connectTimeout = 15000
          connection.readTimeout = 60000
          connection.setRequestProperty("Accept-Encoding", "identity")
          if (connection.responseCode != 200) return failure(503, "Reference unavailable")
          connection.inputStream.use { input -> temporary.outputStream().use { output ->
            val buffer = ByteArray(64 * 1024)
            var written = 0L
            while (true) {
              val n = input.read(buffer); if (n < 0) break
              written += n
              if (written > expectedSize) throw java.io.IOException("Reference size mismatch")
              output.write(buffer, 0, n)
            }
          } }
          if (!valid(temporary) || !temporary.renameTo(cached)) return failure(503, "Reference checksum mismatch")
        } catch (_: Exception) { return failure(503, "Reference unavailable offline") }
        finally { connection.disconnect(); temporary.delete() }
      }
      return WebResourceResponse(mime(path), null, cached.inputStream())
    }
  }

  fun failure(code: Int, message: String) = WebResourceResponse("text/plain", "UTF-8", code, message, emptyMap(), ByteArrayInputStream(message.toByteArray()))
}
