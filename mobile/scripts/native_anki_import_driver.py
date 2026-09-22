#!/usr/bin/env python3
"""Drive the real Android APK through an Anki HTML-enabled text import."""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

# Reuse the battle-tested onboarding/UIAutomator helpers used by the native
# screenshot workflow. ORBIT_SCREENSHOT_OUT is read while this module imports.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from native_screenshot_driver import (  # noqa: E402
    adb,
    first_run,
    launch,
    scroll_until,
    shot,
    tap,
    visible,
    wait_visible,
)

FIXTURE = Path(__file__).resolve().parent.parent / "preview" / "fixtures" / "anki-text" / "html-fields.txt"
DEVICE_FILE = "/sdcard/Download/orbit-html-fields.txt"


def push_fixture() -> None:
    if not FIXTURE.exists():
        raise RuntimeError(f"Fixture missing: {FIXTURE}")
    adb("shell", "mkdir", "-p", "/sdcard/Download")
    adb("push", str(FIXTURE), DEVICE_FILE)
    # DocumentsUI uses MediaProvider for Downloads on this API level. Scanning
    # makes the freshly-pushed file discoverable without sleeps or root access.
    adb(
        "shell",
        "am",
        "broadcast",
        "-a",
        "android.intent.action.MEDIA_SCANNER_SCAN_FILE",
        "-d",
        f"file://{DEVICE_FILE}",
        check=False,
    )
    time.sleep(1.0)


def choose_from_documents(filename: str) -> None:
    # ACTION_OPEN_DOCUMENT normally opens on Recent and the just-scanned file is
    # already there. If this emulator remembers another root, open Downloads.
    for _ in range(4):
        if visible(filename):
            tap(filename)
            return
        time.sleep(0.6)

    tap("Show roots", required=False)
    tap("Downloads", required=False)
    time.sleep(1.0)
    for _ in range(6):
        if visible(filename):
            tap(filename)
            return
        time.sleep(0.7)

    raise RuntimeError(f"Android DocumentsUI could not see {filename!r}")


def main() -> int:
    package = os.environ.get("ORBIT_PACKAGE", "com.aistudio.mbbsqbank.aycxvd.debug")
    adb("wait-for-device")
    adb("shell", "settings", "put", "global", "window_animation_scale", "0", check=False)
    adb("shell", "settings", "put", "global", "transition_animation_scale", "0", check=False)
    adb("shell", "settings", "put", "global", "animator_duration_scale", "0", check=False)

    push_fixture()
    launch()
    first_run()

    tap("Notes")
    wait_visible("Anki-style flashcards")
    tap("Anki-style flashcards")
    wait_visible("Anki-style cards")

    scroll_until("Import your Anki cards", tries=12)
    tap("Import your Anki cards")
    wait_visible("Choose .apkg / .txt / .csv")
    shot("01-native-anki-import-panel")

    tap("Choose .apkg / .txt / .csv")
    choose_from_documents("orbit-html-fields.txt")

    wait_visible("orbit-html-fields.txt", tries=12)
    wait_visible("2 cards", tries=6)
    shot("02-native-anki-text-staged")

    tap("Import 2 cards")
    wait_visible("Most common cause of myocardial infarction?", tries=12)
    if visible("<b>") or visible("<div>"):
        raise RuntimeError("HTML markup leaked into the rendered flashcard front")
    shot("03-native-anki-html-front")

    tap("Show answer")
    wait_visible("Atherosclerotic plaque", tries=8)
    wait_visible("rupture & thrombosis", tries=8)
    if visible("<br>") or visible("&amp;"):
        raise RuntimeError("HTML markup/entity text leaked into the rendered answer")
    shot("04-native-anki-html-answer")

    # Relaunch without clearing app data and prove the imported deck is not just
    # transient React state. The deck metadata + chunked cards must survive.
    adb("shell", "am", "force-stop", package)
    adb("shell", "monkey", "-p", package, "-c", "android.intent.category.LAUNCHER", "1")
    time.sleep(4)
    tap("Notes")
    wait_visible("Anki-style flashcards")
    tap("Anki-style flashcards")
    scroll_until("Import your Anki cards", tries=12)
    tap("Import your Anki cards")
    wait_visible("Orbit HTML Import Test", tries=10)
    wait_visible("2 cards", tries=6)
    shot("05-native-anki-import-persisted")

    print(
        "OK native Anki text import: system picker -> Kotlin staged UTF-8 -> shared HTML parser -> "
        "chunked storage -> study/reveal -> persistence after process restart"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"native Anki import driver failed: {exc}", file=sys.stderr)
        try:
            shot("99-native-anki-failure")
        except Exception:
            pass
        raise
