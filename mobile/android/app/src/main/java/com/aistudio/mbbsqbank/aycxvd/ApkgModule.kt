package com.aistudio.mbbsqbank.aycxvd

import android.app.Activity
import android.content.Intent
import android.database.sqlite.SQLiteDatabase
import android.net.Uri
import android.provider.OpenableColumns
import android.util.Base64
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.github.luben.zstd.ZstdInputStream
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.InputStream
import java.util.zip.ZipFile

/**
 * Reading an Anki `.apkg` off the phone.
 *
 * Deliberately mechanical. Nothing in this file decides what a card says —
 * that is all in `src/lib/apkgFormat.ts`, which runs in Node against real
 * packages under `npm run check:apkg`. There is no emulator in the sandboxes
 * this app is worked on from, so Kotlin is code nobody can run until it is
 * installed; the less judgement it carries, the less of the feature is
 * unverifiable.
 *
 * What it does that JavaScript cannot:
 *
 * - **Picks with `ACTION_OPEN_DOCUMENT`**, which runs out of process and
 *   returns the one chosen item. No storage permission is requested and none
 *   may be added, the same rule `FilesModule` follows.
 * - **Streams the ZIP.** A shared medical deck is often hundreds of megabytes.
 * - **Opens the collection with Android's own SQLite**, rather than a
 *   hand-written page reader whose bugs would look like a corrupt deck.
 * - **Decompresses zstd**, which Android has no version of. Everything modern
 *   Anki exports is zstd unless the exporter ticked "support older Anki
 *   versions", so this is not an optional path.
 *
 * ## Two things here will bite whoever edits this next
 *
 * **Never `ORDER BY` or `WHERE` a name column.** Every `name` in a schema 15+
 * collection is declared `COLLATE unicase` — a collation Anki's Rust backend
 * registers and no other SQLite has, Android's included. SQLite resolves a
 * collation only when a statement needs one, so plain `SELECT`s of these
 * columns work and `ORDER BY name` throws `no such collation sequence:
 * unicase` on a device and nowhere a desktop Anki would ever show it. The
 * queries come from `SQL` in apkgFormat.ts and `check:apkg` asserts this file
 * runs the same strings.
 *
 * **The collection is chosen by `meta`, not by filename**, and that decision
 * is made in JavaScript on purpose. Every version 3 package also contains a
 * `collection.anki2` holding one note reading "This file requires a newer
 * version of Anki" — `write_dummy_collection` in anki's colpkg/export.rs puts
 * it there. A reader that looks for a filename finds the decoy, imports it
 * with no error at all, and hands back a one-card deck.
 *
 * Nothing here touches the network, and nothing may be added that does.
 */
@ReactModule(name = ApkgModule.NAME)
class ApkgModule(reactContext: ReactApplicationContext) : NativeOrbitApkgSpec(reactContext) {

  override fun getName(): String = NAME

  /** The one in-flight pick; the Activity can be recreated while it is up. */
  private var pending: Promise? = null

  private val activityListener: ActivityEventListener =
    object : BaseActivityEventListener() {
      // `activity` is non-null here. Declaring it nullable makes this override
      // nothing, which is a compile error only the six-minute Gradle step ever
      // sees — the same trap FilesModule and NotifyModule document.
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
          // Cancelling is an outcome, not an error.
          promise.resolve("")
          return
        }
        try {
          promise.resolve(stage(uri).toString())
        } catch (error: Throwable) {
          promise.reject("pick_failed", error.message ?: "Could not read that file.", error)
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

  /* ------------------------------------------------------------- picking */

  override fun pick(promise: Promise) {
    val activity = getCurrentActivity()
    if (activity == null) {
      promise.resolve("")
      return
    }
    pending?.resolve("")
    pending = promise

    val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
      addCategory(Intent.CATEGORY_OPENABLE)
      // Every type, rather than a MIME type for .apkg, because there isn't one
      // that can be relied on. Android derives a document's type from the
      // provider, and providers disagree about what an .apkg is: Drive reports
      // application/octet-stream, some file managers report application/zip,
      // and a few report nothing at all. Naming any of them hides the file the
      // reader is looking straight at, in a picker with no way to say "show me
      // everything". The extension is checked after the fact instead.
      //
      // Written with line comments on purpose: the wildcard this sets contains
      // the character pair that ends a block comment, and spelling it inside
      // one silently turns the rest of the paragraph into code.
      type = "*/*"
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    try {
      activity.startActivityForResult(intent, REQUEST_CODE)
    } catch (error: Throwable) {
      pending = null
      promise.reject("no_picker", "This phone has no file picker.", error)
    }
  }

  /**
   * Copy the chosen file somewhere the import can make several passes over it.
   *
   * The picker's grant is one-shot and its URI may point into a provider that
   * cannot seek, while reading a package means opening the archive more than
   * once. The staged copy is in `cacheDir`, not `filesDir`: it is wanted for
   * the length of one import and Android is welcome to reclaim it afterwards.
   */
  private fun stage(uri: Uri): JSONObject {
    val resolver = reactApplicationContext.contentResolver
    var name = "deck.apkg"
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

    val staging = File(reactApplicationContext.cacheDir, STAGING).apply { mkdirs() }
    val target = File(staging, "${System.currentTimeMillis().toString(36)}.apkg")
    resolver.openInputStream(uri).use { input ->
      requireNotNull(input) { "Could not read that file." }
      target.outputStream().use { output -> input.copyTo(output) }
    }

    return JSONObject().apply {
      put("path", target.absolutePath)
      put("name", name)
      put("size", if (target.length() > 0) target.length() else size)
    }
  }

  override fun discard(path: String) {
    val file = File(path)
    // Only ever our own staging directory. A path from anywhere else is a bug
    // in the caller, and deleting on it would be this module removing a file
    // it did not create.
    if (file.parentFile?.name == STAGING) {
      file.delete()
    }
  }

  /* --------------------------------------------------------------- zip */

  override fun survey(path: String, promise: Promise) {
    promise.runCatching("survey_failed") {
      ZipFile(File(path)).use { zip ->
        val entries = JSONArray()
        var meta: String? = null
        for (entry in zip.entries()) {
          if (entry.isDirectory) {
            continue
          }
          entries.put(
            JSONObject().apply {
              put("name", entry.name)
              put("size", entry.size)
            }
          )
          if (entry.name == "meta") {
            meta = Base64.encodeToString(zip.getInputStream(entry).readBytes(), Base64.NO_WRAP)
          }
        }
        JSONObject().apply {
          put("entries", entries)
          if (meta != null) put("meta", meta) else put("meta", JSONObject.NULL)
        }.toString()
      }
    }
  }

  override fun readEntry(path: String, entry: String, zstd: Boolean, promise: Promise) {
    promise.runCatching("entry_failed") {
      ZipFile(File(path)).use { zip ->
        val found = zip.getEntry(entry) ?: return@use ""
        open(zip.getInputStream(found), zstd).use {
          Base64.encodeToString(it.readBytes(), Base64.NO_WRAP)
        }
      }
    }
  }

  /** Wrap a zip entry's stream in the zstd decoder when the package needs it. */
  private fun open(stream: InputStream, zstd: Boolean): InputStream =
    if (zstd) ZstdInputStream(stream) else stream

  /* -------------------------------------------------------- the collection */

  /**
   * Unpack the collection to a file and open it read-only.
   *
   * `NO_LOCALIZED_COLLATORS` matters: without it Android tries to install its
   * own collators and to create an `android_metadata` table, which cannot be
   * done to a database opened read-only.
   */
  private fun <T> withCollection(
    path: String,
    entry: String,
    zstd: Boolean,
    body: (SQLiteDatabase) -> T,
  ): T {
    val staging = File(reactApplicationContext.cacheDir, STAGING).apply { mkdirs() }
    val temp = File(staging, "collection-${System.currentTimeMillis().toString(36)}.sqlite")
    try {
      ZipFile(File(path)).use { zip ->
        val found = requireNotNull(zip.getEntry(entry)) { "$entry is not in this package." }
        open(zip.getInputStream(found), zstd).use { input ->
          temp.outputStream().use { output -> input.copyTo(output) }
        }
      }
      val db = SQLiteDatabase.openDatabase(
        temp.absolutePath,
        null,
        SQLiteDatabase.OPEN_READONLY or SQLiteDatabase.NO_LOCALIZED_COLLATORS,
      )
      return db.use(body)
    } finally {
      temp.delete()
    }
  }

  /** Whether this collection keeps its notetypes in tables (schema 15+). */
  private fun isModern(db: SQLiteDatabase): Boolean =
    db.rawQuery(SQL_HAS_NOTETYPE_TABLES, null).use { it.count > 0 }

  private fun schemaVersion(db: SQLiteDatabase): Int =
    db.rawQuery(SQL_VERSION, null).use { if (it.moveToFirst()) it.getInt(0) else 0 }

  /**
   * The notetypes and decks, and how many cards each deck has.
   *
   * Reads no card text, so it stays cheap on a package with tens of thousands
   * of them — which is the point: the reader chooses their chapter before
   * anything large crosses the bridge.
   */
  override fun surveyCollection(path: String, entry: String, zstd: Boolean, promise: Promise) {
    promise.runCatching("collection_failed") {
      withCollection(path, entry, zstd) { db ->
        JSONObject().apply {
          put("schema", schemaVersion(db))
          put("modern", isModern(db))
          put("notetypes", notetypes(db))
          put("decks", decks(db))
          put("deckCounts", deckCounts(db))
        }.toString()
      }
    }
  }

  override fun readCollection(
    path: String,
    entry: String,
    zstd: Boolean,
    deckIds: String,
    limit: Double,
    promise: Promise,
  ) {
    promise.runCatching("collection_failed") {
      withCollection(path, entry, zstd) { db ->
        JSONObject().apply {
          put("schema", schemaVersion(db))
          put("notetypes", notetypes(db))
          put("decks", decks(db))
          put("cards", cards(db, deckIds, limit.toInt()))
        }.toString()
      }
    }
  }

  /**
   * Notetypes, from whichever place this schema keeps them.
   *
   * Before schema 15 they were one JSON blob in `col.models`; from 15 on that
   * column is left as `"{}"` and the tables are the truth. The JSON is handed
   * over untouched for `parseLegacyNotetypes` to read, and the protobuf
   * configs are handed over base64 for `decodeNotetypeConfig` — both so that
   * the parsing stays where it can be tested.
   */
  private fun notetypes(db: SQLiteDatabase): JSONObject {
    val out = JSONObject()
    if (!isModern(db)) {
      db.rawQuery(SQL_LEGACY_MODELS, null).use { cursor ->
        if (cursor.moveToFirst()) {
          out.put("legacyModels", cursor.getString(0))
          out.put("legacyDecks", cursor.getString(1))
        }
      }
      return out
    }

    val fieldsByType = HashMap<String, JSONArray>()
    db.rawQuery(SQL_FIELDS, null).use { cursor ->
      while (cursor.moveToNext()) {
        val ntid = cursor.getLong(0).toString()
        val list = fieldsByType.getOrPut(ntid) { JSONArray() }
        // The query is ordered by ord, so appending keeps the ordinals lined
        // up with the order a note's fields are stored in.
        list.put(cursor.getString(2))
      }
    }

    val templatesByType = HashMap<String, JSONArray>()
    db.rawQuery(SQL_TEMPLATES, null).use { cursor ->
      while (cursor.moveToNext()) {
        val ntid = cursor.getLong(0).toString()
        val list = templatesByType.getOrPut(ntid) { JSONArray() }
        list.put(
          JSONObject().apply {
            put("name", cursor.getString(2))
            put("config", Base64.encodeToString(cursor.getBlob(3), Base64.NO_WRAP))
          }
        )
      }
    }

    val types = JSONArray()
    db.rawQuery(SQL_NOTETYPES, null).use { cursor ->
      while (cursor.moveToNext()) {
        val id = cursor.getLong(0).toString()
        types.put(
          JSONObject().apply {
            put("id", id)
            put("name", cursor.getString(1))
            put("config", Base64.encodeToString(cursor.getBlob(2), Base64.NO_WRAP))
            put("fields", fieldsByType[id] ?: JSONArray())
            put("templates", templatesByType[id] ?: JSONArray())
          }
        )
      }
    }
    out.put("notetypes", types)
    return out
  }

  private fun decks(db: SQLiteDatabase): JSONArray {
    val out = JSONArray()
    if (!isModern(db)) {
      // Legacy decks travel inside the same JSON blob as the notetypes.
      return out
    }
    db.rawQuery(SQL_DECKS, null).use { cursor ->
      while (cursor.moveToNext()) {
        out.put(
          JSONObject().apply {
            put("id", cursor.getLong(0).toString())
            put("name", cursor.getString(1))
          }
        )
      }
    }
    return out
  }

  private fun deckCounts(db: SQLiteDatabase): JSONObject {
    val out = JSONObject()
    db.rawQuery(SQL_DECK_COUNTS, null).use { cursor ->
      while (cursor.moveToNext()) {
        out.put(cursor.getLong(0).toString(), cursor.getInt(1))
      }
    }
    return out
  }

  private fun cards(db: SQLiteDatabase, deckIds: String, limit: Int): JSONArray {
    /*
     * The deck list is written into the statement rather than bound, because
     * the number of ids is not known until the reader has chosen. That is safe
     * only because `deckIdList` in apkgFormat.ts has already thrown away
     * anything that is not a run of digits — an empty string here means "every
     * deck" and takes the unfiltered query instead.
     */
    val safe = deckIds.split(',').filter { it.isNotEmpty() && it.all(Char::isDigit) }
    val sql = if (safe.isEmpty()) SQL_CARDS else SQL_CARDS_IN_DECKS.replace("%DECKS%", safe.joinToString(","))

    val out = JSONArray()
    db.rawQuery(sql, null).use { cursor ->
      while (cursor.moveToNext() && out.length() < limit) {
        out.put(
          JSONObject().apply {
            put("id", cursor.getLong(0).toString())
            put("nid", cursor.getLong(1).toString())
            put("did", cursor.getLong(2).toString())
            put("ord", cursor.getInt(3))
            put("mid", cursor.getLong(4).toString())
            put("flds", cursor.getString(5))
            put("tags", cursor.getString(6) ?: "")
          }
        )
      }
    }
    return out
  }

  /* -------------------------------------------------------------- media */

  private fun mediaFolder(deckId: String): File {
    // The id comes from the app's own deck store, never from the package, but
    // it still ends up as a directory name — so anything that could climb out
    // of the media folder is stripped rather than trusted.
    val safe = deckId.filter { it.isLetterOrDigit() || it == '-' || it == '_' }.take(64)
    return File(File(reactApplicationContext.filesDir, MEDIA), safe)
  }

  override fun mediaDir(deckId: String): String = mediaFolder(deckId).absolutePath

  override fun mediaBytes(deckId: String): Double =
    (mediaFolder(deckId).listFiles()?.sumOf { it.length() } ?: 0L).toDouble()

  override fun forget(deckId: String) {
    mediaFolder(deckId).deleteRecursively()
  }

  /**
   * Unpack the listed media entries.
   *
   * A media file's zip entry is named for its **position in the media list**
   * — `"0"`, `"1"` — and nothing but the list knows which is which, so the
   * plan carries both. The file is written under the name the note text uses,
   * because that is what a card refers to.
   */
  override fun extractMedia(
    path: String,
    deckId: String,
    plan: String,
    zstd: Boolean,
    promise: Promise,
  ) {
    promise.runCatching("media_failed") {
      val wanted = JSONArray(plan)
      val folder = mediaFolder(deckId).apply { mkdirs() }
      var written = 0
      var bytes = 0L
      val missing = JSONArray()

      ZipFile(File(path)).use { zip ->
        for (i in 0 until wanted.length()) {
          val item = wanted.getJSONObject(i)
          val name = item.getString("name")
          val entry = zip.getEntry(item.getString("index"))
          val target = File(folder, safeName(name))
          if (entry == null || target.canonicalFile.parentFile != folder.canonicalFile) {
            // A media name is author-supplied text. Anki normalises it on the
            // way in, but a hand-built package can put a path in it, and this
            // is the line between "a picture in this deck's folder" and
            // writing wherever the name says.
            missing.put(name)
            continue
          }
          open(zip.getInputStream(entry), zstd).use { input ->
            target.outputStream().use { output -> bytes += input.copyTo(output) }
          }
          written += 1
        }
      }

      JSONObject().apply {
        put("written", written)
        put("bytes", bytes)
        put("missing", missing)
        put("dir", folder.absolutePath)
      }.toString()
    }
  }

  /** A media filename reduced to something that is only ever a filename. */
  private fun safeName(name: String): String {
    val base = name.substringAfterLast('/').substringAfterLast('\\')
    val cleaned = base.filter { it.isLetterOrDigit() || it in "._- ()[]" }.trim()
    return if (cleaned.isEmpty() || cleaned == "." || cleaned == "..") "file" else cleaned.take(120)
  }

  /* -------------------------------------------------------------- export */

  /**
   * Write a deck out as an `.apkg`.
   *
   * A transcription, and deliberately nothing more: every decision about what
   * goes in the file — the notetype JSON, the note and card rows, the media
   * map, the checksums — is made in `src/lib/apkgExport.ts`, where
   * `npm run check:apkg` builds a real package from the same payload and reads
   * it back through the importer. This opens a database, inserts what it was
   * given, and zips it.
   *
   * **Schema 11, no `meta`, no zstd.** The oldest package layout, on purpose:
   * every Anki ever released can open it, and the person being handed the deck
   * did not choose their Anki version. It is also the layout our own importer
   * reads without decompressing anything.
   */
  override fun exportDeck(payload: String, promise: Promise) {
    promise.runCatching("export_failed") {
      val json = JSONObject(payload)
      val folder = File(reactApplicationContext.cacheDir, SHARING).apply { mkdirs() }
      /*
       * Cleared first. The share sheet holds a grant on whatever was last
       * exported, and a folder that only ever grows would keep every deck the
       * reader has ever sent in the cache with nothing to remove it.
       */
      folder.listFiles()?.forEach { it.delete() }

      val collectionFile = File(folder, "collection.anki2")
      collectionFile.delete()
      writeCollection(collectionFile, json)

      val outFile = File(folder, safeName(json.optString("fileName", "deck.apkg")))
      java.util.zip.ZipOutputStream(outFile.outputStream().buffered()).use { zip ->
        zip.putNextEntry(java.util.zip.ZipEntry("collection.anki2"))
        collectionFile.inputStream().use { it.copyTo(zip) }
        zip.closeEntry()

        val media = json.optJSONArray("media") ?: org.json.JSONArray()
        val map = JSONObject()
        for (i in 0 until media.length()) {
          val item = media.getJSONObject(i)
          val index = item.getString("index")
          map.put(index, item.getString("name"))
          zip.putNextEntry(java.util.zip.ZipEntry(index))
          zip.write(Base64.decode(item.getString("base64"), Base64.DEFAULT))
          zip.closeEntry()
        }
        // The media map is written even when it is empty: anki's own reader
        // treats a missing `media` entry as an older file, and an empty object
        // is what an export with no pictures is supposed to carry.
        zip.putNextEntry(java.util.zip.ZipEntry("media"))
        zip.write(map.toString().toByteArray())
        zip.closeEntry()
      }
      collectionFile.delete()
      outFile.absolutePath
    }
  }

  /** The schema 11 collection, built from the rows JavaScript decided on. */
  private fun writeCollection(file: File, json: JSONObject) {
    val db = SQLiteDatabase.openOrCreateDatabase(file, null)
    try {
      db.execSQL(SQL_CREATE_COL)
      db.execSQL(SQL_CREATE_NOTES)
      db.execSQL(SQL_CREATE_CARDS)
      db.execSQL(SQL_CREATE_REVLOG)
      db.execSQL(SQL_CREATE_GRAVES)
      db.execSQL("CREATE INDEX ix_cards_nid ON cards (nid)")
      db.execSQL("CREATE INDEX ix_notes_csum ON notes (csum)")

      val now = System.currentTimeMillis()
      db.execSQL(
        "INSERT INTO col VALUES (1,?,?,?,11,0,0,0,?,?,?,?,'{}')",
        arrayOf<Any>(
          json.getLong("crt"),
          now,
          now,
          json.getString("conf"),
          json.getString("models"),
          json.getString("decks"),
          json.getString("dconf"),
        ),
      )

      db.beginTransaction()
      try {
        val notes = json.getJSONArray("notes")
        for (i in 0 until notes.length()) {
          val note = notes.getJSONObject(i)
          db.execSQL(
            "INSERT INTO notes VALUES (?,?,?,?,-1,?,?,?,?,0,'')",
            arrayOf<Any>(
              note.getLong("id"),
              note.getString("guid"),
              note.getLong("mid"),
              note.getLong("mod"),
              note.getString("tags"),
              note.getString("flds"),
              note.getString("sfld"),
              note.getLong("csum"),
            ),
          )
        }
        val cards = json.getJSONArray("cards")
        for (i in 0 until cards.length()) {
          val card = cards.getJSONObject(i)
          db.execSQL(
            "INSERT INTO cards VALUES (?,?,?,?,?,-1,0,0,?,0,0,0,0,0,0,0,0,'')",
            arrayOf<Any>(
              card.getLong("id"),
              card.getLong("nid"),
              card.getLong("did"),
              card.getInt("ord"),
              card.getLong("mod"),
              card.getInt("due"),
            ),
          )
        }
        db.setTransactionSuccessful()
      } finally {
        db.endTransaction()
      }
    } finally {
      db.close()
    }
  }

  /**
   * Offer the file to whatever the reader wants to send it with.
   *
   * A `file://` URI in an Intent throws `FileUriExposedException` on anything
   * since Android 7, so this goes out as a `content://` from the app's own
   * FileProvider with a one-shot read grant attached — the receiving app can
   * read that one file and nothing else in this app's storage.
   */
  override fun share(path: String, promise: Promise) {
    promise.runCatchingBool("share_failed") {
      val activity = getCurrentActivity() ?: return@runCatchingBool false
      val file = File(path)
      // Only ever out of our own sharing folder. A path from anywhere else is
      // a bug in the caller, and honouring it would turn this into a way to
      // hand any file in the app to another app.
      if (file.parentFile?.name != SHARING || !file.exists()) {
        return@runCatchingBool false
      }
      val uri = androidx.core.content.FileProvider.getUriForFile(
        reactApplicationContext,
        "${reactApplicationContext.packageName}.fileprovider",
        file,
      )
      val send = Intent(Intent.ACTION_SEND).apply {
        // The MIME type Anki registers. A generic octet-stream hides the deck
        // from apps that filter, which is most of the ones worth sending to.
        type = "application/apkg"
        putExtra(Intent.EXTRA_STREAM, uri)
        putExtra(Intent.EXTRA_SUBJECT, file.name)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      activity.startActivity(Intent.createChooser(send, "Share this deck"))
      true
    }
  }

  /* ------------------------------------------------------------ plumbing */

  /**
   * Resolve with the block's value, or reject with its message.
   *
   * Every entry point here reads a file somebody else wrote, so every one of
   * them can fail on malformed input — and an unresolved promise is a spinner
   * that never stops.
   */
  private inline fun Promise.runCatching(code: String, body: () -> String) {
    try {
      resolve(body())
    } catch (error: Throwable) {
      reject(code, error.message ?: "That package could not be read.", error)
    }
  }

  /** The same, for the one call that answers with a boolean. */
  private inline fun Promise.runCatchingBool(code: String, body: () -> Boolean) {
    try {
      resolve(body())
    } catch (error: Throwable) {
      reject(code, error.message ?: "That deck could not be shared.", error)
    }
  }

  companion object {
    const val NAME = "OrbitApkg"
    private const val REQUEST_CODE = 0x4150 // 'AP'
    private const val STAGING = "apkg-staging"
    private const val MEDIA = "anki-media"
    /** Named in res/xml/orbit_file_paths.xml — the two must agree. */
    private const val SHARING = "apkg-share"

    /*
     * Schema 11, which is what an export writes. Character for character the
     * table definitions anki's own schema11.sql has, because the file has to
     * open in Anki as well as in here.
     */
    private const val SQL_CREATE_COL =
      "CREATE TABLE col (id integer PRIMARY KEY, crt integer NOT NULL, " +
        "mod integer NOT NULL, scm integer NOT NULL, ver integer NOT NULL, " +
        "dty integer NOT NULL, usn integer NOT NULL, ls integer NOT NULL, " +
        "conf text NOT NULL, models text NOT NULL, decks text NOT NULL, " +
        "dconf text NOT NULL, tags text NOT NULL)"
    private const val SQL_CREATE_NOTES =
      "CREATE TABLE notes (id integer PRIMARY KEY, guid text NOT NULL, " +
        "mid integer NOT NULL, mod integer NOT NULL, usn integer NOT NULL, " +
        "tags text NOT NULL, flds text NOT NULL, sfld integer NOT NULL, " +
        "csum integer NOT NULL, flags integer NOT NULL, data text NOT NULL)"
    private const val SQL_CREATE_CARDS =
      "CREATE TABLE cards (id integer PRIMARY KEY, nid integer NOT NULL, " +
        "did integer NOT NULL, ord integer NOT NULL, mod integer NOT NULL, " +
        "usn integer NOT NULL, type integer NOT NULL, queue integer NOT NULL, " +
        "due integer NOT NULL, ivl integer NOT NULL, factor integer NOT NULL, " +
        "reps integer NOT NULL, lapses integer NOT NULL, left integer NOT NULL, " +
        "odue integer NOT NULL, odid integer NOT NULL, flags integer NOT NULL, " +
        "data text NOT NULL)"
    private const val SQL_CREATE_REVLOG =
      "CREATE TABLE revlog (id integer PRIMARY KEY, cid integer NOT NULL, " +
        "usn integer NOT NULL, ease integer NOT NULL, ivl integer NOT NULL, " +
        "lastIvl integer NOT NULL, factor integer NOT NULL, time integer NOT NULL, " +
        "type integer NOT NULL)"
    private const val SQL_CREATE_GRAVES =
      "CREATE TABLE graves (usn integer NOT NULL, oid integer NOT NULL, " +
        "type integer NOT NULL)"

    /*
     * These are `SQL` from src/lib/apkgFormat.ts, character for character.
     * `npm run check:apkg` reads this file and fails if any of them has
     * drifted, because a query that differs only here is one nothing can test.
     */
    private const val SQL_HAS_NOTETYPE_TABLES =
      "SELECT name FROM sqlite_master WHERE type='table' AND name='notetypes'"
    private const val SQL_VERSION = "SELECT ver FROM col LIMIT 1"
    private const val SQL_LEGACY_MODELS = "SELECT models, decks FROM col LIMIT 1"
    private const val SQL_NOTETYPES = "SELECT id, name, config FROM notetypes"
    private const val SQL_FIELDS = "SELECT ntid, ord, name FROM fields ORDER BY ntid, ord"
    private const val SQL_TEMPLATES =
      "SELECT ntid, ord, name, config FROM templates ORDER BY ntid, ord"
    private const val SQL_DECKS = "SELECT id, name FROM decks"
    private const val SQL_CARDS =
      "SELECT c.id, c.nid, c.did, c.ord, n.mid, n.flds, n.tags " +
        "FROM cards c JOIN notes n ON n.id = c.nid ORDER BY c.id"
    private const val SQL_CARDS_IN_DECKS =
      "SELECT c.id, c.nid, c.did, c.ord, n.mid, n.flds, n.tags " +
        "FROM cards c JOIN notes n ON n.id = c.nid WHERE c.did IN (%DECKS%) ORDER BY c.id"
    private const val SQL_DECK_COUNTS = "SELECT did, count(*) AS n FROM cards GROUP BY did"
  }
}
