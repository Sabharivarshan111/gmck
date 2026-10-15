#!/usr/bin/env bash
set -euo pipefail
qa_root="$(cd "$(dirname "$0")/../.." && pwd)"
qa_sdk="${ANDROID_HOME:?Android SDK required}"
qa_build="$(mktemp -d)"
trap 'rm -rf "$qa_build"' EXIT
sdkmanager 'platforms;android-35' 'build-tools;35.0.0' >/dev/null
qa_tools="$qa_sdk/build-tools/35.0.0"
qa_android="$qa_sdk/platforms/android-35/android.jar"
mkdir -p "$qa_build/classes" "$qa_build/dex"
javac -source 8 -target 8 -cp "$qa_android" -d "$qa_build/classes" "$qa_root/mobile/scripts/ui-dump/UiDump.java"
"$qa_tools/d8" --lib "$qa_android" --output "$qa_build/dex" "$qa_build/classes/com/orbit/qa/UiDump.class"
"$qa_tools/aapt2" link -o "$qa_build/helper.apk" --manifest "$qa_root/mobile/scripts/ui-dump/AndroidManifest.xml" -I "$qa_android"
python3 - "$qa_build/helper.apk" "$qa_build/dex/classes.dex" <<'PY'
import sys,zipfile
with zipfile.ZipFile(sys.argv[1],'a') as archive:
    archive.write(sys.argv[2],'classes.dex')
PY
"$qa_tools/apksigner" sign --ks "$qa_root/mobile/android/app/debug.keystore" --ks-pass pass:android --key-pass pass:android "$qa_build/helper.apk"
adb install -r "$qa_build/helper.apk"
