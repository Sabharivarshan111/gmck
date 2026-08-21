package com.aistudio.mbbsqbank.aycxvd

import android.media.AudioAttributes
import android.media.SoundPool
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

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
 *
 * It extends NativeOrbitSoundSpec, which React Native's codegen generates from
 * src/native/NativeOrbitSound.ts. That is not a style choice: the app runs the
 * New Architecture, and a module that is not a TurboModule is never reachable
 * from JavaScript there. See the spec file for the full reason.
 */
@ReactModule(name = NativeOrbitSoundSpec.NAME)
class SoundModule(reactContext: ReactApplicationContext) :
  NativeOrbitSoundSpec(reactContext) {

  /**
   * Two pools, because the two sounds mean different things to the system.
   *
   * A SoundPool's AudioAttributes are fixed at construction, and the usage is
   * what decides whether Android will let the sound out at all.
   *
   * - **Taps** are USAGE_ASSISTANCE_SONIFICATION. That routes with the
   *   system's own touch sounds and ducks under whatever the user is
   *   listening to rather than interrupting it — declaring a 45ms click as
   *   media would pause their music. The consequence is that it goes to the
   *   system stream, which Do Not Disturb and silent mode mute. That is
   *   correct: a phone told to be quiet should be quiet, and it is the reason
   *   a device sitting in DND makes no click no matter how healthy this code
   *   is.
   *
   * - **The focus chime** is USAGE_ALARM. A session ending is an alarm the
   *   user set themselves and is waiting for, and alarms are exempt from Do
   *   Not Disturb by default. Filing it as sonification would have silenced
   *   the one sound in the app someone is actually listening for.
   */
  private val uiPool: SoundPool =
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

  private val alertPool: SoundPool =
    SoundPool.Builder()
      // One: a second chime on top of the first is not a thing that happens.
      .setMaxStreams(1)
      .setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ALARM)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
      )
      .build()

  private fun poolFor(name: String): SoundPool = if (name == CHIME) alertPool else uiPool

  private val ids = mutableMapOf<String, Int>()
  /** Ids that SoundPool has finished decoding. Playing one before it is ready
   *  is a silent no-op, so they are tracked rather than assumed. */
  private val ready = mutableSetOf<Int>()

  init {
    val onLoaded =
      SoundPool.OnLoadCompleteListener { _, sampleId, status ->
        if (status == 0) {
          synchronized(ready) { ready.add(sampleId) }
        }
      }
    uiPool.setOnLoadCompleteListener(onLoaded)
    alertPool.setOnLoadCompleteListener(onLoaded)
    load(TAP, R.raw.tap)
    load(CHIME, R.raw.chime)
  }

  private fun load(name: String, resId: Int) {
    try {
      ids[name] = poolFor(name).load(reactApplicationContext, resId, 1)
    } catch (_: Throwable) {
      // A clip that will not decode simply never plays.
    }
  }

  /**
   * @param name   "tap" or "chime"
   * @param volume 0..1
   */
  override fun play(name: String, volume: Double) {
    val id = ids[name] ?: return
    val loaded = synchronized(ready) { ready.contains(id) }
    if (!loaded) {
      return
    }
    val level = volume.coerceIn(0.0, 1.0).toFloat()
    try {
      poolFor(name).play(id, level, level, /* priority = */ 1, /* loop = */ 0, /* rate = */ 1f)
    } catch (_: Throwable) {
      // Never let feedback break the action it is decorating.
    }
  }

  override fun invalidate() {
    super.invalidate()
    try {
      uiPool.release()
      alertPool.release()
    } catch (_: Throwable) {
      // Nothing useful to do if teardown fails.
    }
  }

  companion object {
    const val TAP = "tap"
    const val CHIME = "chime"
  }
}
