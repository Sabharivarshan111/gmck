package com.aistudio.mbbsqbank.aycxvd
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.view.View
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.annotations.ReactProp
import org.json.JSONObject
import java.util.zip.GZIPInputStream
import java.util.concurrent.Executors
class MriView(private val context: ThemedReactContext): View(context) {
  var plane="axial";var slice=56;var contrast=1f;var zoom=1f
  private var data: ByteArray?=null;private var dimensions=intArrayOf(112,128,112);private var spacing=floatArrayOf(2.2857f,1.5836f,2.2857f)
  private var bitmap: Bitmap?=null;private val paint=Paint(Paint.FILTER_BITMAP_FLAG)
  private val worker=Executors.newSingleThreadExecutor()
  init { contentDescription="Offline T1 research MRI reference";worker.execute { try {
    val meta=context.assets.open("simulator/radiology/brain-t1.json").use {JSONObject(it.bufferedReader().readText())}
    val dims=meta.getJSONArray("dimensions");val gaps=meta.getJSONArray("spacing")
    val bytes=GZIPInputStream(context.assets.open("simulator/radiology/brain-t1.pack")).use {it.readBytes()}
    check(bytes.size==dims.getInt(0)*dims.getInt(1)*dims.getInt(2)){"MRI volume length"}
    post {dimensions=IntArray(3){dims.getInt(it)};spacing=FloatArray(3){gaps.getDouble(it).toFloat()};data=bytes;rebuild()}
  }catch(e:Exception){post {contentDescription="MRI could not load: "+e.message;invalidate()}}} }
  fun rebuild() { val bytes=data?:return;val axes=when(plane){"coronal"->intArrayOf(0,2,1);"sagittal"->intArrayOf(1,2,0);else->intArrayOf(0,1,2)};val w=dimensions[axes[0]];val h=dimensions[axes[1]];val position=slice.coerceIn(0,dimensions[axes[2]]-1);val pixels=IntArray(w*h)
    for(y in 0 until h)for(x in 0 until w){val c=IntArray(3);c[axes[0]]=w-1-x;c[axes[1]]=h-1-y;c[axes[2]]=position;val v=((((bytes[c[0]+dimensions[0]*(c[1]+dimensions[1]*c[2])].toInt() and 255)-128)*contrast)+128).toInt().coerceIn(0,255);pixels[y*w+x]=0xff000000.toInt() or (v shl 16) or (v shl 8) or v}
    bitmap?.recycle();bitmap=Bitmap.createBitmap(pixels,w,h,Bitmap.Config.ARGB_8888);invalidate()
  }
  override fun onDraw(canvas:Canvas) { super.onDraw(canvas);canvas.drawColor(0xff050a12.toInt());val image=bitmap?:return;val axes=when(plane){"coronal"->intArrayOf(0,2);"sagittal"->intArrayOf(1,2);else->intArrayOf(0,1)};val ratio=image.width*spacing[axes[0]]/(image.height*spacing[axes[1]]);var h=height.toFloat();var w=h*ratio;if(w>width){w=width.toFloat();h=w/ratio};w*=zoom;h*=zoom;canvas.drawBitmap(image,null,RectF((width-w)/2,(height-h)/2,(width+w)/2,(height+h)/2),paint) }
  fun release(){worker.shutdownNow();bitmap?.recycle();bitmap=null;data=null}
}
class MriViewManager:SimpleViewManager<MriView>() {
 override fun getName()="OrbitMRI"
 override fun createViewInstance(context:ThemedReactContext)=MriView(context)
 @ReactProp(name="plane") fun plane(view:MriView,value:String?){view.plane=value?:"axial";view.rebuild()}
 @ReactProp(name="slice",defaultInt=56) fun slice(view:MriView,value:Int){view.slice=value;view.rebuild()}
 @ReactProp(name="contrast",defaultFloat=1f) fun contrast(view:MriView,value:Float){view.contrast=value.coerceIn(.4f,2.5f);view.rebuild()}
 @ReactProp(name="zoom",defaultFloat=1f) fun zoom(view:MriView,value:Float){view.zoom=value.coerceIn(1f,3f);view.invalidate()}
 override fun onDropViewInstance(view:MriView){view.release();super.onDropViewInstance(view)}
}
