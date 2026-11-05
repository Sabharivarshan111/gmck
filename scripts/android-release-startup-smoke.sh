#!/usr/bin/env bash
# Run as one shell process: emulator-runner executes each script line separately.
set -euo pipefail
pkg=com.aistudio.mbbsqbank.aycxvd
out=artifacts/android-release-native-startup
mkdir -p "$out"
capture() {
  adb exec-out screencap -p > "$out/after-launch.png" || true
  adb logcat -d -b crash -v time > "$out/crash-logcat.txt" || true
  adb logcat -d -v time -s AndroidRuntime:E ReactNativeJS:E > "$out/js-native-errors.txt" || true
}
trap capture EXIT
adb install -r mobile/android/app/build/outputs/apk/release/app-release.apk
adb shell am force-stop "$pkg"
adb logcat -c
adb shell am start -n "$pkg/.MainActivity"
sleep 18
capture
app_pid="$(adb shell pidof "$pkg" | tr -d '\r')"
if [ -z "$app_pid" ] || grep -q 'FATAL EXCEPTION' "$out/crash-logcat.txt"; then
  echo "ERROR: Signed release closed or crashed on first launch."
  cat "$out/crash-logcat.txt" "$out/js-native-errors.txt"
  exit 1
fi
adb shell dumpsys package "$pkg" > "$out/installed-package.txt"
echo "PASS: signed APK stays open on Android API 35 (PID $app_pid)."
