package com.aistudio.mbbsqbank.aycxvd

import android.media.AudioAttributes
import android.media.SoundPool
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * The app's sound effects, on Android's SoundPool.
 *
 * SoundPool rather than MediaPlayer, and rather than an npm audio library,
 * because this is precisely the job it exists for. It decodes each clip once
 * at startup and keeps it in memory ready to fire, so a tap makes a sound in
 * single-digit milliseconds instead of the tens-to-hundreds a MediaPlayer
 * takes to prepare. It also mixes overlapping streams, which matters when a
 * fast scroll fires several taps inside one clip's length.
 *
 * The alternative considered and rejected was playing these through
 * react-native-video, which is already a dependency: that would mean holding
 * two ExoPlayer instances in memory for the life of the app, for two clips
 * totalling 130KB. On the 3GB phones this app targets that is the wrong trade,
 * and ExoPlayer's start latency would make a tap sound arrive after the finger
 * had already lifted.
 *
 * Everything here fails quietly. A device with no audio focus, a broken
 * decoder or a full stream pool is not a reason for a button to stop working.
 */
class SoundModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = NAME

  /**
   * USAGE_ASSISTANCE_SONIFICATION is the correct usage for UI feedback: it
   * routes with the system's touch sounds and, importantly, ducks rather than
   * interrupting whatever the user is listening to. Declaring this as media
   * would pause their music for a 45ms click.
   */
  private val pool: SoundPool =
    SoundPool.Builder()
      // Four is enough for overlapping taps without reserving decoders that
      // spend the whole session idle.
      .setMaxStreams(4)
      .setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
      )
      .build()

  private val ids = mutableMapOf<String, Int>()
  /** Ids that SoundPool has finished decoding. Playing one before it is ready
   *  is a silent no-op, so they are tracked rather than assumed. */
  private val ready = mutableSetOf<Int>()

  init {
    pool.setOnLoadCompleteListener { _, sampleId, status ->
      if (status == 0) {
        synchronized(ready) { ready.add(sampleId) }
      }
    }
    load("tap", R.raw.tap)
    load("chime", R.raw.chime)
  }

  private fun load(name: String, resId: Int) {
    try {
      ids[name] = pool.load(reactApplicationContext, resId, 1)
    } catch (_: Throwable) {
      // A clip that will not decode simply never plays.
    }
  }

  /**
   * @param name   "tap" or "chime"
   * @param volume 0..1
   */
  @ReactMethod
  fun play(name: String, volume: Double) {
    val id = ids[name] ?: return
    val loaded = synchronized(ready) { ready.contains(id) }
    if (!loaded) {
      return
    }
    val level = volume.coerceIn(0.0, 1.0).toFloat()
    try {
      pool.play(id, level, level, /* priority = */ 1, /* loop = */ 0, /* rate = */ 1f)
    } catch (_: Throwable) {
      // Never let feedback break the action it is decorating.
    }
  }

  override fun invalidate() {
    super.invalidate()
    try {
      pool.release()
    } catch (_: Throwable) {
      // Nothing useful to do if teardown fails.
    }
  }

  companion object {
    const val NAME = "OrbitSound"
  }
}
