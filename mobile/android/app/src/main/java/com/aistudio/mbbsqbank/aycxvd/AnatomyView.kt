package com.aistudio.mbbsqbank.aycxvd

import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.opengl.Matrix
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import org.json.JSONArray
import java.io.DataInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import java.nio.ShortBuffer
import java.util.zip.GZIPInputStream
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import kotlin.math.*

private class AnatomyEvent(surface: Int, tag: Int, private val event: String, private val payload: WritableMap) : Event<AnatomyEvent>(surface, tag) {
  override fun getEventName(): String = event
  override fun getEventData(): WritableMap = payload
}
/** Native OpenGL ES renderer; assets are in the APK, with no URL or WebView. */
class AnatomyView(private val reactContext: ThemedReactContext) : GLSurfaceView(reactContext), LifecycleEventListener {
  private val scene = Scene()
  private var downX = 0f; private var downY = 0f; private var lastX = 0f; private var lastY = 0f; private var moved = false
  private val pinch = ScaleGestureDetector(reactContext, object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
    override fun onScale(detector: ScaleGestureDetector): Boolean {
      val factor = detector.scaleFactor
      queueEvent { scene.zoom = (scene.zoom / factor).coerceIn(.35f, 3f) }; requestRender(); moved = true; return true
    }
  })
  init {
    setEGLContextClientVersion(2)
    setEGLConfigChooser(8, 8, 8, 8, 24, 0)
    preserveEGLContextOnPause = true
    setRenderer(scene); renderMode = RENDERMODE_WHEN_DIRTY
    reactContext.addLifecycleEventListener(this)
    contentDescription = "Interactive offline anatomical model. Drag to rotate; pinch to zoom."
  }
  fun configure(model: String? = null, visible: String? = null, context: String? = null, annotations: String? = null, region: String? = null, layer: String? = null, hidden: String? = null, spread: Float? = null) {
    queueEvent {
      model?.let { if (it.matches(Regex("[a-z0-9_]+")) && it != scene.model) { scene.model = it; scene.loadedModel = ""; } }
      visible?.let { scene.visible = it.split(',').filter(String::isNotBlank).toSet() }
      context?.let { scene.context = it.split(',').filter(String::isNotBlank).toSet() }
      annotations?.let { scene.annotations = it.split(',').filter(String::isNotBlank).toSet() }
      region?.let { scene.region = it }; layer?.let { scene.layer = it }
      hidden?.let { scene.hidden = it.split(',').filter(String::isNotBlank).toSet() }
      spread?.let { scene.spread = it }
      scene.dirty = true; scene.refit = true
    }
    requestRender()
  }
  fun cameraAction(value: Int) { queueEvent { when(value % 10) { 1 -> scene.zoom = (scene.zoom*.8f).coerceAtLeast(.35f); 2 -> scene.zoom = (scene.zoom*1.25f).coerceAtMost(3f); 3 -> scene.yaw -= 25f; 4 -> scene.yaw += 25f; 5 -> { scene.yaw=0f; scene.pitch=0f; scene.zoom=1f; scene.panX=0f; scene.panY=0f } } }; requestRender() }
  override fun onTouchEvent(event: MotionEvent): Boolean {
    pinch.onTouchEvent(event)
    when(event.actionMasked) {
      MotionEvent.ACTION_DOWN -> { downX=event.x; downY=event.y; lastX=event.x; lastY=event.y; moved=false; parent?.requestDisallowInterceptTouchEvent(true) }
      MotionEvent.ACTION_POINTER_DOWN -> { moved=true; lastX=(event.getX(0)+event.getX(1))/2; lastY=(event.getY(0)+event.getY(1))/2 }
      MotionEvent.ACTION_POINTER_UP -> { moved=true; lastX=event.getX(if(event.actionIndex==0)1 else 0); lastY=event.getY(if(event.actionIndex==0)1 else 0) }
      MotionEvent.ACTION_MOVE -> {
        if(event.pointerCount>=2) {
          val x=(event.getX(0)+event.getX(1))/2; val y=(event.getY(0)+event.getY(1))/2
          val dx=x-lastX; val dy=y-lastY; moved=true
          queueEvent { scene.pan(dx,dy) }; requestRender(); lastX=x; lastY=y
          return true
        }
        if(event.pointerCount==1 && !pinch.isInProgress) {
          val dx=event.x-lastX; val dy=event.y-lastY
          if(abs(event.x-downX)+abs(event.y-downY)>12f) moved=true
          if(moved) { queueEvent { scene.yaw += dx*.35f; scene.pitch=(scene.pitch+dy*.25f).coerceIn(-80f,80f) }; requestRender() }
        }
        lastX=event.x; lastY=event.y
      }
      MotionEvent.ACTION_UP -> { if(!moved) { val x=event.x; val y=event.y; queueEvent { scene.pick(x,y) } }; parent?.requestDisallowInterceptTouchEvent(false) }
      MotionEvent.ACTION_CANCEL -> parent?.requestDisallowInterceptTouchEvent(false)
    }
    return true
  }
  private fun emit(name: String, payload: WritableMap) {
    post { if(id != NO_ID) UIManagerHelper.getEventDispatcherForReactTag(reactContext,id)?.dispatchEvent(AnatomyEvent(UIManagerHelper.getSurfaceId(this),id,name,payload)) }
  }
  override fun onHostResume() { onResume(); requestRender() }
  override fun onHostPause() { onPause() }
  override fun onHostDestroy() { release() }
  fun release() { reactContext.removeLifecycleEventListener(this); queueEvent { scene.parts=emptyList(); scene.batches=emptyList() } }
  private data class Part(val id: String, val name: String, val system: String, val bounds: FloatArray, val positions: FloatArray, val normals: FloatArray, val indices: ShortArray)
  private data class Batch(val vertices: FloatBuffer, val indices: ShortBuffer, val count: Int, val transparent: Boolean)
  private inner class Scene : Renderer {
    var model="atlas"; var loadedModel=""; var parts: List<Part> = emptyList(); var batches: List<Batch> = emptyList()
    var visible=setOf<String>(); var context=setOf<String>(); var hidden=setOf<String>(); var annotations=setOf<String>()
    var region="full"; var layer="surface"; var spread=0f; var dirty=true; var refit=true
    var yaw=0f; var pitch=0f; var zoom=1f; var panX=0f; var panY=0f
    private var program=0; private var w=1; private var h=1; private var radius=1f
    private var center=floatArrayOf(0f,.85f,0f); private var distance=3f
    private val projection=FloatArray(16); private val view=FloatArray(16); private val rotation=FloatArray(16); private val mvp=FloatArray(16); private val temp=FloatArray(16)
    private var displayed: List<Part> = emptyList()
    override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
      val vertex="attribute vec3 aPosition;attribute vec3 aNormal;attribute vec4 aColor;uniform mat4 uMvp;uniform mat4 uRotation;varying vec4 vColor;void main(){vec3 n=normalize(mat3(uRotation)*aNormal);float light=0.42+0.58*abs(dot(n,normalize(vec3(-0.3,0.7,1.0))));vColor=vec4(aColor.rgb*light,aColor.a);gl_Position=uMvp*vec4(aPosition,1.0);}"
      val fragment="precision mediump float;varying vec4 vColor;void main(){gl_FragColor=vColor;}"
      fun shader(kind: Int, code: String): Int { val s=GLES20.glCreateShader(kind); GLES20.glShaderSource(s,code);GLES20.glCompileShader(s);val ok=IntArray(1);GLES20.glGetShaderiv(s,GLES20.GL_COMPILE_STATUS,ok,0);check(ok[0]!=0){GLES20.glGetShaderInfoLog(s)};return s }
      try { val vs=shader(GLES20.GL_VERTEX_SHADER,vertex);val fs=shader(GLES20.GL_FRAGMENT_SHADER,fragment);program=GLES20.glCreateProgram();GLES20.glAttachShader(program,vs);GLES20.glAttachShader(program,fs);GLES20.glLinkProgram(program);GLES20.glDeleteShader(vs);GLES20.glDeleteShader(fs);val ok=IntArray(1);GLES20.glGetProgramiv(program,GLES20.GL_LINK_STATUS,ok,0);check(ok[0]!=0){GLES20.glGetProgramInfoLog(program)} } catch(e: Exception){emit("topModelStatus",Arguments.createMap().apply { putString("status","error");putString("message",e.message) })}
      GLES20.glEnable(GLES20.GL_DEPTH_TEST);GLES20.glEnable(GLES20.GL_BLEND);GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA,GLES20.GL_ONE_MINUS_SRC_ALPHA);dirty=true
    }
    override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) { w=max(1,width);h=max(1,height);GLES20.glViewport(0,0,w,h);refit=true }
    private fun load() {
      val meta=GZIPInputStream(reactContext.assets.open("simulator/models/$model.meta.pack")).use { JSONArray(it.bufferedReader().readText()) }
      val result=ArrayList<Part>()
      DataInputStream(GZIPInputStream(reactContext.assets.open("simulator/models/$model.mesh.pack"))).use { data ->
        check(data.readInt()==0x4f524231){"Anatomy asset header"};check(data.readInt()==meta.length()){"Anatomy part count"}
        for(i in 0 until meta.length()) {
          val p=meta.getJSONObject(i);val b=p.getJSONArray("bounds");val bounds=FloatArray(6){j->b.getJSONArray(if(j<3)0 else 1).getDouble(j%3).toFloat()}
          val n=data.readInt();val count=data.readInt();check(n in 1..65535 && count in 3..3000000){"Anatomy mesh bounds"}
          val pos=FloatArray(n*3);val normals=FloatArray(n*3)
          for(v in 0 until n) { for(k in 0..2)pos[v*3+k]=bounds[k]+data.readUnsignedShort()/65535f*(bounds[k+3]-bounds[k]);for(k in 0..2)normals[v*3+k]=data.readByte()/127f }
          val indices=ShortArray(count){data.readUnsignedShort().toShort()}
          check(indices.all {(it.toInt() and 0xffff)<n}){"Anatomy index range"}
          result.add(Part(p.getString("id"),p.getString("name"),p.getString("system"),bounds,pos,normals,indices))
        }
      }
      parts=result;loadedModel=model;dirty=true;refit=true
      emit("topModelStatus",Arguments.createMap().apply { putString("status","ready");putInt("parts",parts.size) })
    }
    fun pan(dx: Float, dy: Float) {
      val scale = distance * zoom * 2 * tan(34f * PI.toFloat() / 360) / h
      panX -= dx * scale; panY += dy * scale
    }
    private fun regionPart(p: Part): Boolean { val y=(p.bounds[1]+p.bounds[4])/2;return when(region){"head"->y>1.45f;"thorax"->y in 1.2f..1.46f;"abdomen"->y in .8f..1.23f;else->true} }
    private fun visiblePart(p: Part): Boolean {
      if(p.id in hidden)return false
      if(visible.isNotEmpty())return p.id in visible || p.id in context
      if(model!="atlas")return true
      if(!regionPart(p))return false
      return when(layer) { "surface"->p.system in setOf("muscular","skeletal","integumentary");"vessels"->p.system in setOf("arterial","venous","cardiac");"skeleton"->p.system=="skeletal";"nerves"->p.system=="nervous";else->p.system in setOf("cardiac","respiratory","digestive","urinary","endocrine","reproductive") }
    }
    private fun color(p: Part): FloatArray = when(p.system) {
      "arterial"->floatArrayOf(.78f,.18f,.22f); "venous"->floatArrayOf(.24f,.43f,.78f); "nervous"->floatArrayOf(.88f,.71f,.28f);
      "skeletal"->floatArrayOf(.88f,.84f,.7f); "cardiac"->floatArrayOf(.66f,.2f,.29f); "muscular"->floatArrayOf(.71f,.42f,.36f);
      "urinary"->floatArrayOf(.65f,.32f,.3f); "respiratory"->floatArrayOf(.66f,.62f,.7f); else->floatArrayOf(.68f,.46f,.4f)
    }
    private fun offset(p: Part): FloatArray { if(spread<.01f)return floatArrayOf(0f,0f,0f);val k=(p.system.hashCode() and 0xffff)%12;val a=k*PI.toFloat()/6;return floatArrayOf(cos(a)*spread*.3f,sin(a)*spread*.16f,spread*((k%3)-1)*.1f) }
    private fun rebuild() {
      displayed = parts.filter(::visiblePart)
      val result = ArrayList<Batch>()
      val group = ArrayList<Part>()
      var vertexCount = 0
      var indexCount = 0
      var transparent = false
      fun flush() {
        if (indexCount == 0) return
        // Primitive direct buffers avoid millions of boxed Float allocations.
        val vb = ByteBuffer.allocateDirect(vertexCount * 40).order(ByteOrder.nativeOrder()).asFloatBuffer()
        val ib = ByteBuffer.allocateDirect(indexCount * 2).order(ByteOrder.nativeOrder()).asShortBuffer()
        var base = 0
        for (p in group) {
          val n = p.positions.size / 3
          val c = color(p); val o = offset(p)
          val alpha = if (p.id in context && p.id !in visible) .18f else 1f
          for (v in 0 until n) {
            for (k in 0..2) vb.put(p.positions[v * 3 + k] + o[k])
            for (k in 0..2) vb.put(p.normals[v * 3 + k])
            for (k in 0..2) vb.put(c[k])
            vb.put(alpha)
          }
          for (index in p.indices) ib.put(((index.toInt() and 0xffff) + base).toShort())
          base += n
        }
        vb.position(0); ib.position(0)
        result.add(Batch(vb, ib, indexCount, transparent))
        group.clear(); vertexCount = 0; indexCount = 0
      }
      // Opaque vessels first; translucent organ context must not hide them via depth writes.
      for (pass in 0..1) {
        transparent = pass == 1
        for (p in displayed) {
          if ((p.id in context && p.id !in visible) != transparent) continue
          val n = p.positions.size / 3
          if (vertexCount + n > 65535) flush()
          group.add(p); vertexCount += n; indexCount += p.indices.size
        }
        flush()
      }
      batches = result; dirty = false
      emit("topModelStatus", Arguments.createMap().apply { putString("status", "ready"); putInt("parts", displayed.size) })
    }
    private fun fit() {
      val fitting=displayed.filter { context.isEmpty() || it.id in visible }
      if(fitting.isEmpty())return
      val lo=FloatArray(3){Float.POSITIVE_INFINITY};val hi=FloatArray(3){Float.NEGATIVE_INFINITY}
      for(p in fitting){val o=offset(p);for(k in 0..2){lo[k]=min(lo[k],p.bounds[k]+o[k]);hi[k]=max(hi[k],p.bounds[k+3]+o[k])}}
      center=FloatArray(3){(lo[it]+hi[it])/2};radius=max(.01f,max(hi[0]-lo[0],max(hi[1]-lo[1],hi[2]-lo[2])))
      val tangent=tan(34f*PI.toFloat()/360);distance=max((hi[1]-lo[1])/(2*tangent*.64f),(hi[0]-lo[0])/(2*tangent*(w.toFloat()/h)*.84f))+(hi[2]-lo[2])/2
      distance=max(radius*.6f,distance);yaw=0f;pitch=0f;zoom=1f;panX=0f;panY=0f;refit=false
    }
    override fun onDrawFrame(gl: GL10?) {
      GLES20.glClearColor(.025f,.035f,.055f,1f);GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT or GLES20.GL_DEPTH_BUFFER_BIT)
      if(program==0)return
      try { if(loadedModel!=model)load();if(dirty)rebuild();if(refit)fit() }catch(e: Exception){emit("topModelStatus",Arguments.createMap().apply {putString("status","error");putString("message",e.message)});return}
      Matrix.perspectiveM(projection,0,34f,w.toFloat()/h,max(.0001f,radius*.001f),max(5f,radius*20))
      Matrix.setLookAtM(view,0,center[0]+panX,center[1]+panY,center[2]+distance*zoom,center[0]+panX,center[1]+panY,center[2],0f,1f,0f)
      Matrix.setIdentityM(rotation,0);Matrix.translateM(rotation,0,center[0],center[1],center[2]);Matrix.rotateM(rotation,0,pitch,1f,0f,0f);Matrix.rotateM(rotation,0,yaw,0f,1f,0f);Matrix.translateM(rotation,0,-center[0],-center[1],-center[2])
      Matrix.multiplyMM(temp,0,view,0,rotation,0);Matrix.multiplyMM(mvp,0,projection,0,temp,0)
      GLES20.glUseProgram(program);GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(program,"uMvp"),1,false,mvp,0);GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(program,"uRotation"),1,false,rotation,0)
      val pos=GLES20.glGetAttribLocation(program,"aPosition");val norm=GLES20.glGetAttribLocation(program,"aNormal");val col=GLES20.glGetAttribLocation(program,"aColor")
      for(b in batches){GLES20.glDepthMask(!b.transparent);b.vertices.position(0);GLES20.glVertexAttribPointer(pos,3,GLES20.GL_FLOAT,false,40,b.vertices);b.vertices.position(3);GLES20.glVertexAttribPointer(norm,3,GLES20.GL_FLOAT,false,40,b.vertices);b.vertices.position(6);GLES20.glVertexAttribPointer(col,4,GLES20.GL_FLOAT,false,40,b.vertices);GLES20.glEnableVertexAttribArray(pos);GLES20.glEnableVertexAttribArray(norm);GLES20.glEnableVertexAttribArray(col);GLES20.glDrawElements(GLES20.GL_TRIANGLES,b.count,GLES20.GL_UNSIGNED_SHORT,b.indices)}
      GLES20.glDepthMask(true)
      labels()
    }
    private fun project(x: Float,y: Float,z: Float): FloatArray { val p=FloatArray(4);Matrix.multiplyMV(p,0,mvp,0,floatArrayOf(x,y,z,1f),0);return floatArrayOf((p[0]/p[3]*.5f+.5f)*w,(-p[1]/p[3]*.5f+.5f)*h,p[2]/p[3]) }
    private fun labels() {
      val array=Arguments.createArray()
      for(p in parts.filter { it.id in annotations && (visible.isEmpty() || it in displayed) }) {
        val c=FloatArray(3){(p.bounds[it]+p.bounds[it+3])/2};val o=offset(p);var nearest=0;var best=Float.MAX_VALUE
        for(v in p.positions.indices step 3){if(p.positions[v+2]<c[2])continue;val d=(0..2).sumOf { k->((p.positions[v+k]-c[k]).toDouble()).pow(2) }.toFloat();if(d<best){best=d;nearest=v}}
        val q=project(p.positions[nearest]+o[0],p.positions[nearest+1]+o[1],p.positions[nearest+2]+o[2])
        if(q[2] in -1f..1f)array.pushMap(Arguments.createMap().apply {putString("id",p.id);putDouble("x",PixelUtil.toDIPFromPixel(q[0]).toDouble());putDouble("y",PixelUtil.toDIPFromPixel(q[1]).toDouble())})
      }
      emit("topModelLabels",Arguments.createMap().apply {putArray("points",array)})
    }
    fun pick(x: Float,y: Float) {
      // Pick only displayed source geometry; hidden/context organs cannot win a tap.
      val inverse=FloatArray(16);if(!Matrix.invertM(inverse,0,mvp,0))return
      fun unproject(z: Float): FloatArray {val p=FloatArray(4);Matrix.multiplyMV(p,0,inverse,0,floatArrayOf(x/w*2-1,1-y/h*2,z,1f),0);return FloatArray(3){p[it]/p[3]}}
      val origin=unproject(-1f);val end=unproject(1f);val dir=FloatArray(3){end[it]-origin[it]};var nearest=Float.MAX_VALUE;var hit: Part?=null
      for(p in displayed) {
        if(p.id in context && p.id !in visible)continue
        val o=offset(p);var tmin=0f;var tmax=Float.MAX_VALUE
        for(k in 0..2){if(abs(dir[k])<1e-8f){if(origin[k]<p.bounds[k]+o[k] || origin[k]>p.bounds[k+3]+o[k])tmax=-1f}else{val a=(p.bounds[k]+o[k]-origin[k])/dir[k];val b=(p.bounds[k+3]+o[k]-origin[k])/dir[k];tmin=max(tmin,min(a,b));tmax=min(tmax,max(a,b))}}
        if(tmax<tmin)continue
        for(i in p.indices.indices step 3){
          val a=(p.indices[i].toInt() and 0xffff)*3;val b=(p.indices[i+1].toInt() and 0xffff)*3;val c=(p.indices[i+2].toInt() and 0xffff)*3
          val e1=FloatArray(3){p.positions[b+it]-p.positions[a+it]};val e2=FloatArray(3){p.positions[c+it]-p.positions[a+it]}
          val q=floatArrayOf(dir[1]*e2[2]-dir[2]*e2[1],dir[2]*e2[0]-dir[0]*e2[2],dir[0]*e2[1]-dir[1]*e2[0])
          val det=(0..2).sumOf{(e1[it]*q[it]).toDouble()}.toFloat();if(abs(det)<1e-8f)continue
          val t=FloatArray(3){origin[it]-p.positions[a+it]-o[it]};val u=(0..2).sumOf{(t[it]*q[it]).toDouble()}.toFloat()/det;if(u<0 || u>1)continue
          val r=floatArrayOf(t[1]*e1[2]-t[2]*e1[1],t[2]*e1[0]-t[0]*e1[2],t[0]*e1[1]-t[1]*e1[0])
          val v=(0..2).sumOf{(dir[it]*r[it]).toDouble()}.toFloat()/det;if(v<0 || u+v>1)continue
          val distance=(0..2).sumOf{(e2[it]*r[it]).toDouble()}.toFloat()/det
          if(distance>0 && distance<nearest){nearest=distance;hit=p}
        }
      }
      hit?.let{emit("topModelSelection",Arguments.createMap().apply {putString("id",it.id);putString("name",it.name)})}
    }
  }
}
