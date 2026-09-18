#!/usr/bin/env python3
"""Drive the real Android app with adb/uiautomator and capture native screenshots."""

from __future__ import annotations
import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

PACKAGE = os.environ.get("ORBIT_PACKAGE", "com.aistudio.mbbsqbank.aycxvd.debug")
OUT = Path(os.environ.get("ORBIT_SCREENSHOT_OUT", "artifacts/native-screenshots/v23"))
OUT.mkdir(parents=True, exist_ok=True)


def run(*args: str, check: bool = True, capture: bool = False) -> subprocess.CompletedProcess:
    return subprocess.run(
        list(args),
        check=check,
        text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.STDOUT if capture else None,
    )


def adb(*args: str, check: bool = True, capture: bool = False) -> subprocess.CompletedProcess:
    return run("adb", *args, check=check, capture=capture)


def dump_ui() -> ET.Element:
    adb("shell", "uiautomator", "dump", "/sdcard/window.xml", check=False)
    adb("pull", "/sdcard/window.xml", "/tmp/window.xml", check=False)
    for _ in range(5):
        try:
            return ET.parse("/tmp/window.xml").getroot()
        except Exception:
            time.sleep(0.4)
            adb("shell", "uiautomator", "dump", "/sdcard/window.xml", check=False)
            adb("pull", "/sdcard/window.xml", "/tmp/window.xml", check=False)
    raise RuntimeError("Could not read Android UI hierarchy")


def node_label(node: ET.Element) -> str:
    return " ".join(
        part for part in (node.attrib.get("text", ""), node.attrib.get("content-desc", "")) if part
    ).strip()


def bounds_center(bounds: str) -> tuple[int, int] | None:
    m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
    if not m:
        return None
    x1, y1, x2, y2 = map(int, m.groups())
    return (x1 + x2) // 2, (y1 + y2) // 2


def find_nodes(needle: str) -> list[tuple[int, int, int, str]]:
    root = dump_ui()
    needle_l = needle.lower()
    found: list[tuple[int, int, int, str]] = []
    for node in root.iter("node"):
        label = node_label(node)
        if needle_l not in label.lower():
            continue
        center = bounds_center(node.attrib.get("bounds", ""))
        if not center:
            continue
        m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", node.attrib.get("bounds", ""))
        assert m
        x1, y1, x2, y2 = map(int, m.groups())
        area = max(1, (x2 - x1) * (y2 - y1))
        found.append((area, center[0], center[1], label))
    found.sort(key=lambda row: row[0])
    return found


def visible(needle: str) -> bool:
    return bool(find_nodes(needle))


def tap(needle: str, required: bool = True) -> bool:
    nodes = find_nodes(needle)
    if not nodes:
        if required:
            raise RuntimeError(f"UI element not found: {needle!r}")
        return False
    _, x, y, label = nodes[0]
    print(f"tap {label!r} at {x},{y}")
    adb("shell", "input", "tap", str(x), str(y))
    time.sleep(1.0)
    return True


def screen_size() -> tuple[int, int]:
    out = adb("shell", "wm", "size", capture=True).stdout or ""
    m = re.search(r"(\d+)x(\d+)", out)
    if not m:
        return (1080, 2400)
    return int(m.group(1)), int(m.group(2))


def scroll_down() -> None:
    # Swipe in the right-side gutter rather than through TextInputs. Starting a
    # gesture over an editable field lets Android give it to the TextInput,
    # which leaves the parent ScrollView completely stationary.
    width, height = screen_size()
    x = int(width * 0.94)
    adb(
        "shell",
        "input",
        "swipe",
        str(x),
        str(int(height * 0.74)),
        str(x),
        str(int(height * 0.28)),
        "550",
    )
    time.sleep(1.0)


def scroll_up() -> None:
    width, height = screen_size()
    x = int(width * 0.94)
    adb(
        "shell",
        "input",
        "swipe",
        str(x),
        str(int(height * 0.30)),
        str(x),
        str(int(height * 0.76)),
        "500",
    )
    time.sleep(1.0)


def scroll_until(needle: str, tries: int = 8) -> None:
    for _ in range(tries + 1):
        if visible(needle):
            return
        scroll_down()
    raise RuntimeError(f"Could not scroll to UI element: {needle!r}")


def shot(name: str) -> None:
    path = OUT / f"{name}.png"
    with path.open("wb") as fh:
        subprocess.run(["adb", "exec-out", "screencap", "-p"], check=True, stdout=fh)
    if path.stat().st_size < 1000:
        raise RuntimeError(f"Screenshot looks empty: {path}")
    print(f"captured {path} ({path.stat().st_size} bytes)")


def launch() -> None:
    adb("shell", "pm", "clear", PACKAGE, check=False)
    adb("shell", "monkey", "-p", PACKAGE, "-c", "android.intent.category.LAUNCHER", "1")
    time.sleep(4)


def first_run() -> None:
    # The splash auto-advances after ~1.6s and launch() already waits longer than
    # that. Do NOT search for the generic word "Continue" here: once the form is
    # visible it can match "Continue with Google" and accidentally launch OAuth.
    time.sleep(1)

    # The screenshot-only dev Hermes bundle sets __DEV__ true, so the app's own
    # testing bypass unlocks setup. Production builds are not modified.
    tap("Display name")
    adb("shell", "input", "text", "NativePreview")
    adb("shell", "input", "keyevent", "4")
    time.sleep(0.8)
    tap("Final Year", required=False)
    if not visible("Start studying"):
        # Some devices expose only the visible text, not the accessibility label.
        tap("YEAR", required=False)
    tap("Start studying")
    time.sleep(3)

    # The tour resumes after onboarding. Skip through its explicit farewell.
    tap("Skip the walkthrough", required=False)
    tap("Close the walkthrough", required=False)
    time.sleep(2)


def main() -> int:
    adb("wait-for-device")
    adb("shell", "settings", "put", "global", "window_animation_scale", "0", check=False)
    adb("shell", "settings", "put", "global", "transition_animation_scale", "0", check=False)
    adb("shell", "settings", "put", "global", "animator_duration_scale", "0", check=False)

    launch()
    first_run()
    shot("01-home-native")

    tap("Notes")
    shot("02-notes-native")

    scroll_until("Clinical case proformas", tries=7)
    tap("Clinical case proformas")
    time.sleep(1.5)
    shot("03-case-proforma-list-native")

    tap("Open Cardiovascular System")
    time.sleep(1.5)
    shot("04-cvs-guide-native")

    tap("Clerk Patient")
    time.sleep(1.2)
    shot("05-clerk-patient-top-native")

    scroll_until("5. General Physical Examination", tries=10)
    shot("06-general-physical-exam-native")

    scroll_until("Normal Values", tries=7)
    tap("Normal Values")
    time.sleep(0.8)
    scroll_until("Open normal laboratory values", tries=5)
    shot("07-normal-values-expanded-native")
    tap("Open normal laboratory values")
    shot("09-normal-laboratory-reference-native")
    adb("shell", "input", "keyevent", "4")
    time.sleep(0.8)

    # The segmented tabs remain fixed above the ScrollView.
    tap("Viva Q&A", required=False)
    time.sleep(1.0)
    shot("08-viva-native")

    print("Native screenshots:")
    for p in sorted(OUT.glob("*.png")):
        print(p)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"native screenshot driver failed: {exc}", file=sys.stderr)
        # Capture the actual device state on failure, which is useful for fixing
        # automation without guessing what the app showed.
        try:
            shot("99-failure-state-native")
        except Exception:
            pass
        raise
