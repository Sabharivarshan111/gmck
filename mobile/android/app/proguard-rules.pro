# Project specific ProGuard rules for R8 optimization & app size reduction

# React Native core & JNI
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.bridge.** { *; }

# Keep native methods and classes
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep annotations
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# App package
-keep class com.aistudio.mbbsqbank.aycxvd.** { *; }

# Zstandard, used to read Anki packages. It is JNI: R8 cannot see that the
# native side calls back into these classes, so without this the importer
# fails only in a minified build — which is the release one.
-keep class com.github.luben.zstd.** { *; }
-dontwarn com.github.luben.zstd.**
