package com.aistudio.mbbsqbank.aycxvd

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.github.luben.zstd.ZstdInputStream
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.security.MessageDigest
import java.util.concurrent.Executors

@ReactModule(name = PgBankModule.NAME)
class PgBankModule(private val context: ReactApplicationContext) : NativeOrbitPgBankSpec(context) {
  companion object { const val NAME = "OrbitPgBank" }
  private val worker = Executors.newSingleThreadExecutor()
  override fun getName(): String = NAME
  override fun readPack(id: String, sha256: String, promise: Promise) {
    worker.execute {
      try {
        require(id.matches(Regex("s[0-9]{2}")) && sha256.matches(Regex("[0-9a-f]{64}"))) { "Invalid PG pack" }
        val packed = context.assets.open("pg/$id-${sha256.take(12)}.zst").use { it.readBytes() }
        require(packed.size <= 10000000) { "Oversized PG pack" }
        val actual = MessageDigest.getInstance("SHA-256").digest(packed).joinToString("") { "%02x".format(it) }
        require(actual == sha256) { "PG pack checksum mismatch" }
        val decoded = ByteArrayOutputStream()
        ZstdInputStream(ByteArrayInputStream(packed)).use { input ->
          val buffer = ByteArray(16384)
          while (true) {
            val count = input.read(buffer)
            if (count < 0) break
            require(decoded.size() + count <= 20000000) { "PG pack exceeds decoded limit" }
            decoded.write(buffer, 0, count)
          }
        }
        promise.resolve(decoded.toString("UTF-8"))
      } catch (error: Exception) { promise.reject("PG_PACK_READ", error.message, error) }
    }
  }
  override fun invalidate() { worker.shutdown(); super.invalidate() }
}
