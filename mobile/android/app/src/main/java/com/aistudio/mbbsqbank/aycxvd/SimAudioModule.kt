package com.aistudio.mbbsqbank.aycxvd
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.PlaybackParams
import android.os.Build
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import java.util.concurrent.Executors
/** Media stream, explicit play only; no networking and no alarm/DND bypass. */
@ReactModule(name=NativeOrbitSimAudioSpec.NAME)
class SimAudioModule(private val context:ReactApplicationContext):NativeOrbitSimAudioSpec(context),LifecycleEventListener{
 private val worker=Executors.newSingleThreadExecutor()
 private val audio=context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
 private val attrs=AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build()
 private var player:MediaPlayer?=null
 private var currentFile=""
 @Volatile private var focusBlocked=false
 @Volatile private var foreground=true
 private var request:AudioFocusRequest?=null
 private val listener=AudioManager.OnAudioFocusChangeListener{change->if(change<=0){focusBlocked=true;runCatching{worker.execute{releasePlayer();abandonFocus()}}}}
 init{context.addLifecycleEventListener(this)}
 private fun releasePlayer(){try{player?.stop()}catch(_:Exception){};player?.release();player=null;currentFile=""}
 private fun abandonFocus(){if(Build.VERSION.SDK_INT>=26){request?.let{audio.abandonAudioFocusRequest(it)}}else{@Suppress("DEPRECATION") audio.abandonAudioFocus(listener)};request=null}
 private fun requestFocus():Boolean{
  return if(Build.VERSION.SDK_INT>=26){val value=AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN).setAudioAttributes(attrs).setOnAudioFocusChangeListener(listener).build();request=value;audio.requestAudioFocus(value)==AudioManager.AUDIOFOCUS_REQUEST_GRANTED}
  else{@Suppress("DEPRECATION") (audio.requestAudioFocus(listener,AudioManager.STREAM_MUSIC,AudioManager.AUDIOFOCUS_GAIN)==AudioManager.AUDIOFOCUS_REQUEST_GRANTED)}
 }
 private fun adjust(speed:Double,volume:Double){player?.let{p->p.playbackParams=PlaybackParams().setPitch(1f).setSpeed(speed.toFloat().coerceIn(.5f,2f));val level=volume.toFloat().coerceIn(0f,1f);p.setVolume(level,level)}}
 override fun play(file:String,speed:Double,volume:Double,userStarted:Boolean,promise:Promise){worker.execute{
  try{
   require(file.matches(Regex("[a-z0-9_]+\\.ogg"))){"Invalid local audio file"}
   if(!foreground){promise.resolve(false);return@execute}
   if(userStarted)focusBlocked=false
   if(focusBlocked){promise.resolve(false);return@execute}
   if(currentFile==file&&player?.isPlaying==true){adjust(speed,volume);promise.resolve(true);return@execute}
   releasePlayer();abandonFocus()
   if(!requestFocus()){focusBlocked=true;promise.resolve(false);return@execute}
   val next=MediaPlayer();player=next;next.setAudioAttributes(attrs)
   context.assets.openFd("simulator/auscultation/"+file).use{asset->next.setDataSource(asset.fileDescriptor,asset.startOffset,asset.length)}
   next.isLooping=true;next.prepare();if(!foreground||focusBlocked){releasePlayer();abandonFocus();promise.resolve(false);return@execute};currentFile=file;adjust(speed,volume);next.start();promise.resolve(true)
  }catch(error:Exception){releasePlayer();abandonFocus();promise.reject("AUSCULTATION_AUDIO",error.message,error)}
 }}
 override fun update(speed:Double,volume:Double){worker.execute{try{adjust(speed,volume)}catch(_:Exception){releasePlayer();abandonFocus()}}}
 override fun isPlaying(promise:Promise){worker.execute{promise.resolve(try{player?.isPlaying==true}catch(_:Exception){false})}}
 override fun stop(){worker.execute{releasePlayer();abandonFocus()}}
 override fun onHostPause(){foreground=false;focusBlocked=true;stop()}
 override fun onHostResume(){foreground=true}
 override fun onHostDestroy(){stop()}
 override fun invalidate(){context.removeLifecycleEventListener(this);stop();worker.shutdown();super.invalidate()}
}
