package com.aistudio.mbbsqbank.aycxvd

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import java.security.KeyStore
import java.util.concurrent.Executors
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/** Ciphertext only on disk. The AES key stays in AndroidKeyStore. */
@ReactModule(name = SecureStorageModule.NAME)
class SecureStorageModule(reactContext: ReactApplicationContext) : NativeOrbitSecureStorageSpec(reactContext) {
  private val prefs = reactContext.getSharedPreferences("orbit-secure-v1", Context.MODE_PRIVATE)
  private val worker = Executors.newSingleThreadExecutor()

  override fun getName(): String = NAME

  private fun encryptionKey(create: Boolean): SecretKey {
    val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    val existing = store.getKey(KEY_ALIAS, null) as? SecretKey
    if (existing != null) return existing
    check(create) { "Secure key unavailable" }
    return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore").run {
      init(KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .setKeySize(256)
        .build())
      generateKey()
    }
  }

  override fun getItem(key: String, promise: Promise) {
    worker.execute {
      try {
        val encoded = prefs.getString(key, null)
        if (encoded == null) {
          promise.resolve(null)
        } else {
          val parts = encoded.split(":")
          check(parts.size == 3 && parts[0] == "1")
          val cipher = Cipher.getInstance("AES/GCM/NoPadding")
          cipher.init(Cipher.DECRYPT_MODE, encryptionKey(false), GCMParameterSpec(128, Base64.decode(parts[1], Base64.NO_WRAP)))
          cipher.updateAAD(key.toByteArray(Charsets.UTF_8))
          promise.resolve(String(cipher.doFinal(Base64.decode(parts[2], Base64.NO_WRAP)), Charsets.UTF_8))
        }
      } catch (_: Exception) {
        // Never return null for corrupt/unreadable ciphertext or log a token.
        promise.reject("secure_read_failed", "Encrypted storage could not be read.")
      }
    }
  }

  override fun setItem(key: String, value: String, promise: Promise) {
    worker.execute {
      try {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, encryptionKey(true))
        cipher.updateAAD(key.toByteArray(Charsets.UTF_8))
        val encrypted = cipher.doFinal(value.toByteArray(Charsets.UTF_8))
        val encoded = "1:${Base64.encodeToString(cipher.iv, Base64.NO_WRAP)}:${Base64.encodeToString(encrypted, Base64.NO_WRAP)}"
        check(prefs.edit().putString(key, encoded).commit())
        promise.resolve(null)
      } catch (_: Exception) {
        promise.reject("secure_write_failed", "Encrypted storage could not be written.")
      }
    }
  }

  override fun removeItem(key: String, promise: Promise) {
    worker.execute {
      try {
        check(prefs.edit().remove(key).commit())
        promise.resolve(null)
      } catch (_: Exception) {
        promise.reject("secure_remove_failed", "Encrypted storage could not be removed.")
      }
    }
  }

  override fun invalidate() {
    worker.shutdown()
    super.invalidate()
  }

  companion object {
    const val NAME = "OrbitSecureStorage"
    private const val KEY_ALIAS = "orbit-session-aes-v1"
  }
}
