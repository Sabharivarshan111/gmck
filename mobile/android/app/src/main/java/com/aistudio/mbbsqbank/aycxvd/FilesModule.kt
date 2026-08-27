package com.aistudio.mbbsqbank.aycxvd

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import org.json.JSONObject
import java.io.File

/**
 * Files kept beside a personal study note.
 *
 * Picks through `ACTION_OPEN_DOCUMENT` and copies the bytes into the app's own
 * `filesDir/note-media/`. Both halves matter:
 *
 * - **The picker asks for nothing.** It runs out of process and returns the one
 *   item chosen. No `READ_MEDIA_*`, no `READ_EXTERNAL_STORAGE` — the same rule
 *   the photo picker follows, and the reason neither appears in the manifest.
 * - **The copy is what makes it durable.** The URI carries a one-shot grant to
 *   somebody else's provider, and a picker that lands its result in the cache
 *   directory has handed back something Android will delete when it wants the
 *   space. A recording attached to a note has to still be there in a month.
 *
 * Nothing here touches the network, and nothing may be added that does.
 */
@ReactModule(name = FilesModule.NAME)
class FilesModule(reactContext: ReactApplicationContext) :
  NativeOrbitFilesSpec(reactContext) {

  override fun getName(): String = NAME

  /**
   * The one in-flight pick.
   *
   * Android can destroy and recreate the Activity while the system picker is
   * up, and the promise has to survive that — the listener is registered for
   * the life of the module rather than per call, and this is what it resolves.
   */
  private var pending: Promise? = null

  private val activityListener: ActivityEventListener =
    object : BaseActivityEventListener() {
      // `activity` is non-null in BaseActivityEventListener; declaring it
      // nullable makes this override nothing, which is a compile error only
      // the six-minute Gradle step ever sees. The same trap as
      // NotifyModule's getCurrentActivity().
      override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
      ) {
        if (requestCode != REQUEST_CODE) {
          return
        }
        val promise = pending ?: return
        pending = null
        val uri = data?.data
        if (resultCode != Activity.RESULT_OK || uri == null) {
          // Cancelling is an outcome, not an error. An empty string rather than
          // a rejection so the caller does not have to tell "changed my mind"
          // apart from "the copy failed" in a catch block.
          promise.resolve("")
          return
        }
        try {
          promise.resolve(importUri(uri).toString())
        } catch (error: Throwable) {
          promise.reject("import_failed", error.message ?: "Could not keep that file.", error)
        }
      }
    }

  init {
    reactContext.addActivityEventListener(activityListener)
  }

  override fun invalidate() {
    reactApplicationContext.removeActivityEventListener(activityListener)
    pending?.resolve("")
    pending = null
    super.invalidate()
  }

  override fun pick(promise: Promise) {
    val activity = getCurrentActivity()
    if (activity == null) {
      promise.resolve("")
      return
    }
    // A second pick while one is up would orphan the first promise, and an
    // unresolved promise is a spinner that never stops.
    pending?.resolve("")
    pending = promise

    val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
      addCategory(Intent.CATEGORY_OPENABLE)
      type = "*/*"
      // Named rather than left open: the note renderer can show a picture,
      // play a video or a recording, and open a PDF. Offering a .zip would be
      // offering something nothing downstream can do anything with.
      putExtra(
        Intent.EXTRA_MIME_TYPES,
        arrayOf("image/*", "video/*", "audio/*", "application/pdf"),
      )
    }
    try {
      activity.startActivityForResult(intent, REQUEST_CODE)
    } catch (error: Throwable) {
      pending = null
      promise.reject("no_picker", "This phone has no file picker.", error)
    }
  }

  /**
   * Copy the bytes in, and describe what arrived.
   *
   * The extension is kept on the stored name so anything that later hands the
   * file to another app — a PDF viewer, a share sheet — has something to go on
   * beyond the MIME type we recorded.
   */
  private fun importUri(uri: Uri): JSONObject {
    val resolver = reactApplicationContext.contentResolver
    var name = "attachment"
    var size = 0L
    resolver.query(uri, null, null, null, null)?.use { cursor ->
      if (cursor.moveToFirst()) {
        val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        if (nameIndex >= 0 && !cursor.isNull(nameIndex)) {
          name = cursor.getString(nameIndex)
        }
        val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
        if (sizeIndex >= 0 && !cursor.isNull(sizeIndex)) {
          size = cursor.getLong(sizeIndex)
        }
      }
    }
    val mime = resolver.getType(uri) ?: "application/octet-stream"
    val id = "${System.currentTimeMillis().toString(36)}${(0..0xFFFF).random().toString(36)}"
    val extension = name.substringAfterLast('.', "").take(8).filter { it.isLetterOrDigit() }
    val target = File(mediaDir(), if (extension.isEmpty()) id else "$id.$extension")

    resolver.openInputStream(uri).use { input ->
      requireNotNull(input) { "Could not read that file." }
      target.outputStream().use { output -> input.copyTo(output) }
    }

    return JSONObject().apply {
      put("id", target.name)
      put("name", name)
      put("mime", mime)
      // The copied length, not the provider's claim: a stream that ended early
      // would otherwise be recorded at its intended size.
      put("size", if (target.length() > 0) target.length() else size)
    }
  }

  override fun pathFor(id: String): String {
    val file = File(mediaDir(), sanitise(id))
    return if (file.isFile) file.absolutePath else ""
  }

  override fun remove(id: String) {
    try {
      File(mediaDir(), sanitise(id)).delete()
    } catch (_: Throwable) {
      // Already gone, or never there.
    }
  }

  override fun totalBytes(): Double =
    try {
      mediaDir().listFiles()?.sumOf { it.length() }?.toDouble() ?: 0.0
    } catch (_: Throwable) {
      0.0
    }

  private fun mediaDir(): File =
    File(reactApplicationContext.filesDir, "note-media").apply { mkdirs() }

  /**
   * An id is a file name and nothing else.
   *
   * Ids are minted here, so a separator in one can only mean something has
   * gone wrong or been tampered with — and `File(dir, "../../shared_prefs/x")`
   * resolves outside the directory. Stripping is cheaper than trusting.
   */
  private fun sanitise(id: String): String = id.substringAfterLast('/').substringAfterLast('\\')

  companion object {
    const val NAME = "OrbitFiles"
    private const val REQUEST_CODE = 4204
  }
}
