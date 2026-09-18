#!/usr/bin/env bash
set -euo pipefail

SOURCE_APK="${1:-downloaded-apk/app-preview.apk}"
WORK="${RUNNER_TEMP:-/tmp}/orbit-native-screenshot"
JS="$WORK/index.android.js"
BUNDLE="$WORK/index.android.bundle"
PATCHED="$WORK/app-patched-unsigned.apk"
ALIGNED="$WORK/app-patched-aligned.apk"
SIGNED="$WORK/app-screenshot.apk"
ASSET_DIR="$WORK/repack/assets"

rm -rf "$WORK"
mkdir -p "$ASSET_DIR"

echo "Building screenshot-only dev JS bundle (production source remains unchanged)."
(
  cd mobile
  npx react-native bundle \
    --platform android \
    --dev true \
    --entry-file index.js \
    --bundle-output "$JS" \
    --assets-dest "$WORK/assets"
)

# Hermes can execute a plain Metro JavaScript bundle. The Gradle release
# plugin precompiles one for startup performance, but screenshot verification
# does not need that optimization. Keeping source JS here is deliberate:
# it preserves --dev true (so __DEV__ remains true) without depending on a
# hermesc binary whose npm package layout changes across React Native releases.
cp "$JS" "$BUNDLE"
file "$BUNDLE" || true

cp "$SOURCE_APK" "$PATCHED"
cp "$BUNDLE" "$ASSET_DIR/index.android.bundle"

# Replace only the JS bundle inside the already-built native APK.
zip -dq "$PATCHED" assets/index.android.bundle
(
  cd "$WORK/repack"
  zip -0q "$PATCHED" assets/index.android.bundle
)

SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-/usr/local/lib/android/sdk}}"
ZIPALIGN="$(find "$SDK/build-tools" -type f -name zipalign | sort -V | tail -1)"
APKSIGNER="$(find "$SDK/build-tools" -type f -name apksigner | sort -V | tail -1)"

if [ -z "$ZIPALIGN" ] || [ -z "$APKSIGNER" ]; then
  echo "zipalign/apksigner not found under $SDK/build-tools" >&2
  exit 1
fi

"$ZIPALIGN" -f 4 "$PATCHED" "$ALIGNED"
"$APKSIGNER" sign \
  --ks mobile/android/app/debug.keystore \
  --ks-pass pass:android \
  --key-pass pass:android \
  --ks-key-alias androiddebugkey \
  --out "$SIGNED" \
  "$ALIGNED"
"$APKSIGNER" verify "$SIGNED"

adb install -r "$SIGNED"

ORBIT_PACKAGE="com.aistudio.mbbsqbank.aycxvd.debug" \
ORBIT_SCREENSHOT_OUT="artifacts/native-screenshots/v23" \
  python3 mobile/scripts/native_screenshot_driver.py
