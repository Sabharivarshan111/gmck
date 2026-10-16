#!/usr/bin/env bash
set -euo pipefail
suite=$1
if [ "$suite" = calendar ]; then
  python3 .github/qa/android_attendance.py
else
  if [ "$suite" = auscultation-case ]; then
    python3 .github/qa/android_case_bootstrap.py
  else
    python3 mobile/scripts/android_webview_bootstrap.py
  fi
  ORBIT_EXHAUSTIVE_SUITE="$suite" node --experimental-strip-types .github/qa/android-webview-exhaustive.mjs
  if [ "$suite" = eye ]; then
    node --experimental-strip-types .github/qa/android-eye-findings.mjs
  fi
fi
