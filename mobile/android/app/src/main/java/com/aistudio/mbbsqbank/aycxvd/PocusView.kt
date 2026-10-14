package com.aistudio.mbbsqbank.aycxvd
import android.graphics.*
import android.os.SystemClock
import android.view.View
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import kotlin.math.*
/** Native Canvas teaching appearance model; not acquired or diagnostic ultrasound. */
class PocusView(context:ThemedReactContext):View(context) {
 var mode="cardiac_plax";var gain=1f;var depth=16f;var heartRate=75f;var frozen=true;var fluid=0f;var ischemia=0f;var air=0f;var mMode=false;var colorDoppler=false
 private val paint=Paint(Paint.ANTI_ALIAS_FLAG);private var hold=0L;private val started=SystemClock.elapsedRealtime()
 private val texture=Bitmap.createBitmap(256,256,Bitmap.Config.ARGB_8888)
 private val redraw=object:Runnable{override fun run(){if(isShown&&!frozen){invalidate();postDelayed(this,100)}}}
 init {val pixels=IntArray(256*256);var seed=731
  for(i in pixels.indices){seed=seed*1664525+1013904223;val n=((seed ushr 24)*.7f).toInt();pixels[i]=Color.rgb(n,n,n)}
  texture.setPixels(pixels,0,256,0,0,256,256);contentDescription="Simulated bedside ultrasound. Educational appearance model."
 }
 fun setFreeze(value:Boolean){if(value&&!frozen)hold=SystemClock.elapsedRealtime()-started;frozen=value;removeCallbacks(redraw);if(!frozen)post(redraw);invalidate()}
 override fun onAttachedToWindow(){super.onAttachedToWindow();if(!frozen)post(redraw)}
 override fun onDetachedFromWindow(){removeCallbacks(redraw);super.onDetachedFromWindow()}
 private fun ellipse(canvas:Canvas,box:RectF,color:Int,stroke:Float=0f){paint.color=color;paint.shader=null;paint.style=if(stroke>0)Paint.Style.STROKE else Paint.Style.FILL;paint.strokeWidth=stroke;canvas.drawOval(box,paint);paint.style=Paint.Style.FILL}
 override fun onDraw(canvas:Canvas){
  super.onDraw(canvas);val sx=width/360f;val sy=height/320f;canvas.save();canvas.scale(sx,sy);canvas.drawColor(Color.rgb(2,4,8))
  val seconds=(if(frozen)hold else SystemClock.elapsedRealtime()-started)/1000f;val pulse=sin(seconds*2*PI.toFloat()*heartRate/60)*(.06f*(1-ischemia*.6f))
  val sector=Path();if(mode=="lung")sector.addRect(28f,32f,332f,285f,Path.Direction.CW)else{sector.moveTo(180f,22f);sector.arcTo(RectF(-108f,-266f,468f,310f),50f,80f);sector.close()}
  canvas.save();canvas.clipPath(sector);paint.shader=LinearGradient(0f,22f,0f,310f,intArrayOf(0xff12151c.toInt(),0xff05070c.toInt()),null,Shader.TileMode.CLAMP);canvas.drawRect(0f,0f,360f,320f,paint);paint.shader=null
  paint.alpha=(80*gain).toInt().coerceIn(0,255);canvas.drawBitmap(texture,null,RectF(0f,22f,360f,310f),paint);paint.alpha=255
  val scale=16f/depth;canvas.save();canvas.scale(scale,scale,180f,30f)
  val tissue=(150*gain).toInt().coerceIn(0,255);val grey=Color.rgb(tissue,tissue,tissue)
  if(mode=="cardiac_plax"||mode=="subxiphoid"){
   canvas.rotate(if(mode=="subxiphoid")-12f else 18f,180f,170f)
   ellipse(canvas,RectF(80f,94f,279f,247f),grey)
   ellipse(canvas,RectF(94f,108f,264f,232f),0xff030508.toInt())
   ellipse(canvas,RectF(116f+pulse*160,140f+pulse*90,232f-pulse*150,214f-pulse*90),0xff000000.toInt())
   ellipse(canvas,RectF(116f+pulse*160,140f+pulse*90,232f-pulse*150,214f-pulse*90),grey,9f)
   ellipse(canvas,RectF(101f,103f,220f,137f),0xff000000.toInt())
   paint.color=Color.LTGRAY;paint.strokeWidth=3f;canvas.drawLine(218f,119f,226f+pulse*90,162f,paint);canvas.drawLine(241f,129f,230f-pulse*90,163f,paint)
   ellipse(canvas,RectF(238f,173f,295f,225f),grey);ellipse(canvas,RectF(244f,179f,289f,219f),Color.BLACK)
   if(fluid>.02f)ellipse(canvas,RectF(70f,83f,289f,257f),Color.BLACK,4f+fluid*16)
   if(colorDoppler){paint.alpha=160;val forward=sin(seconds*2*PI.toFloat()*heartRate/60)>0;ellipse(canvas,RectF(210f,129f,235f,176f),if(forward)Color.rgb(205,67,66)else Color.rgb(68,126,219));paint.alpha=255}
  }else if(mode=="fast_morison"){
   ellipse(canvas,RectF(55f,55f,288f,202f),grey);ellipse(canvas,RectF(180f,132f,293f,242f),0xff505050.toInt());ellipse(canvas,RectF(195f,147f,278f,221f),0xffb0b0b0.toInt())
   if(fluid>.02f){paint.color=Color.BLACK;val stripe=Path();stripe.moveTo(110f,177f);stripe.quadTo(210f,190f,280f,206f);stripe.quadTo(186f,205f+fluid*35,110f,177f);canvas.drawPath(stripe,paint)}
  }else{
   paint.color=grey;paint.strokeWidth=5f;canvas.drawLine(28f,78f,332f,78f,paint)
   for(i in 1..5){paint.alpha=(150f/i).toInt();paint.strokeWidth=2f;val slide=if(air>.5f)0f else sin(seconds*3)*2;canvas.drawLine(28f,78f+i*38+slide,332f,78f+i*38+slide,paint)}
   paint.alpha=255
   if(fluid>.15f){paint.color=Color.WHITE;paint.strokeWidth=2f;for(i in 0..4)canvas.drawLine(70f+i*45,80f,56f+i*54,290f,paint)}
  }
  canvas.restore();canvas.restore()
  if(mMode){
   paint.color=0xff05070b.toInt();canvas.drawRect(228f,145f,355f,285f,paint);paint.strokeWidth=1f
   if(mode=="lung"){
    // Qualitative seashore/barcode appearance, not acquired M-mode data.
    paint.color=Color.GRAY
    for(i in 0..24){val y=150f+i*5;if(y<190f||air>.5f)canvas.drawLine(230f,y,352f,y,paint)}
    if(air<=.5f)for(y in 192..282 step 2)for(x in 230..352 step 2){val n=((x*31+y*17+(seconds*10).toInt())%101+45);paint.color=Color.rgb(n,n,n);canvas.drawPoint(x.toFloat(),y.toFloat(),paint)}
   }else{
    paint.color=Color.GRAY;for(i in 0..24){val y=150f+i*5;canvas.drawLine(230f,y,352f,y,paint)}
    paint.color=Color.WHITE;val p=Path();for(x in 230..352){val y=220+sin(x*.11+seconds)*14;if(x==230)p.moveTo(x.toFloat(),y.toFloat())else p.lineTo(x.toFloat(),y.toFloat())};paint.style=Paint.Style.STROKE;paint.strokeWidth=2f;canvas.drawPath(p,paint);paint.style=Paint.Style.FILL
   }
  }
  paint.shader=null;paint.alpha=255;paint.color=Color.LTGRAY;paint.textSize=10f;canvas.drawText("SIMULATED · "+mode.replace('_',' '),12f,16f,paint);canvas.drawText("GAIN "+(gain*100).toInt()+"% · DEPTH "+depth.toInt()+" cm",12f,309f,paint);canvas.drawText(if(frozen)"FROZEN" else "LIVE",290f,16f,paint);canvas.restore()
 }
 fun release(){removeCallbacks(redraw);texture.recycle()}
}
class PocusViewManager:SimpleViewManager<PocusView>(){
 override fun getName()="OrbitPOCUS"
 override fun createViewInstance(context:ThemedReactContext)=PocusView(context)
 @ReactProp(name="mode") fun mode(view:PocusView,value:String?){view.mode=value?:"cardiac_plax";view.invalidate()}
 @ReactProp(name="gain",defaultFloat=1f) fun gain(view:PocusView,value:Float){view.gain=value.coerceIn(.3f,2f);view.invalidate()}
 @ReactProp(name="depth",defaultFloat=16f) fun depth(view:PocusView,value:Float){view.depth=value.coerceIn(6f,24f);view.invalidate()}
 @ReactProp(name="heartRate",defaultFloat=75f) fun heart(view:PocusView,value:Float){view.heartRate=value;view.invalidate()}
 @ReactProp(name="fluid",defaultFloat=0f) fun fluid(view:PocusView,value:Float){view.fluid=value.coerceIn(0f,1f);view.invalidate()}
 @ReactProp(name="ischemia",defaultFloat=0f) fun ischemia(view:PocusView,value:Float){view.ischemia=value.coerceIn(0f,1f);view.invalidate()}
 @ReactProp(name="air",defaultFloat=0f) fun air(view:PocusView,value:Float){view.air=value.coerceIn(0f,1f);view.invalidate()}
 @ReactProp(name="colorDoppler",defaultBoolean=false) fun colorDoppler(view:PocusView,value:Boolean){view.colorDoppler=value;view.invalidate()}
 @ReactProp(name="mMode",defaultBoolean=false) fun mMode(view:PocusView,value:Boolean){view.mMode=value;view.invalidate()}
 @ReactProp(name="frozen",defaultBoolean=true) fun frozen(view:PocusView,value:Boolean){view.setFreeze(value)}
 override fun onDropViewInstance(view:PocusView){view.release();super.onDropViewInstance(view)}
}
