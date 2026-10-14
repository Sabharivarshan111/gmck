package com.aistudio.mbbsqbank.aycxvd
import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
class SimAudioPackage:BaseReactPackage(){
 override fun getModule(name:String,reactContext:ReactApplicationContext):NativeModule? = if(name==NativeOrbitSimAudioSpec.NAME)SimAudioModule(reactContext)else null
 override fun getReactModuleInfoProvider():ReactModuleInfoProvider=ReactModuleInfoProvider{mapOf(NativeOrbitSimAudioSpec.NAME to ReactModuleInfo(NativeOrbitSimAudioSpec.NAME,SimAudioModule::class.java.name,false,false,false,true))}
}
