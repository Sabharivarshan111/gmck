#!/usr/bin/env python3
"""Run after launching the signed v31 APK in an Android emulator.

Always save native startup logs, even if the process closes immediately.
The app might show an account selector with no Google accounts: an unsuccessful
Google login is not evidence of an app crash.
"""
from __future__ import annotations

import re
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path

OUT = Path("artifacts/v31-crash-smoke")
OUT.mkdir(parents=True, exist_ok=True)
PKG = "com.aistudio.mbbsqbank.aycxvd"
def adb(*args: str, binary: bool = False):
    return subprocess.run(["adb", *args], capture_output=True, check=False, text=not binary)

def capture(name: str):
    screenshot = adb("exec-out", "screencap", "-p", binary=True)
    if screenshot.returncode == 0:
        (OUT / name).write_bytes(screenshot.stdout)
    crash = adb("logcat", "-d", "-v", "time", "-b", "crash")
    (OUT / "android-crash-buffer.txt").write_text(crash.stdout or "", encoding="utf-8")
    runtime = adb("logcat", "-d", "-v", "time", "-s",
                  "AndroidRuntime:E", "ReactNativeJS:E", "ReactNative:E", "libc:F")
    (OUT / "errors.txt").write_text(runtime.stdout or "", encoding="utf-8")
    full = adb("logcat", "-d", "-v", "time")
    relevant = [line for line in (full.stdout or "").splitlines()
                if any(word in line for word in
                (PKG, "FATAL EXCEPTION", "ReactNativeJS", "AndroidRuntime", "Process:"))]
    (OUT / "app-filtered-logcat.txt").write_text("\n".join(relevant[-1800:]), encoding="utf-8")

def pid() -> str:
    return (adb("shell", "pidof", PKG).stdout or "").strip()

def report(line: str):
    print(line, flush=True)
    with (OUT / "result.txt").open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")

report("APK provenance: release-1028 SHA 6052733eefeb98d7de112939f9f2b9f4341c723e")
original_pid = pid()
report("Process after first launch: " + (original_pid or "NOT RUNNING"))
capture("after-launch.png")

tapped = False
if original_pid:
    dump = adb("shell", "uiautomator", "dump", "/sdcard/orbit-ui.xml")
    xml = adb("exec-out", "cat", "/sdcard/orbit-ui.xml")
    (OUT / "ui.xml").write_text(xml.stdout or "", encoding="utf-8")
    if xml.returncode == 0:
        try:
            root = ET.fromstring(xml.stdout)
            # A cold CI emulator may show its launcher's ANR over the app.
            # Dismiss ONLY that observed system dialog; never dismiss an Orbit ANR.
            titles = [n.attrib.get("text", "") for n in root.iter()
                      if n.attrib.get("resource-id") == "android:id/alertTitle"]
            if titles == ["Pixel Launcher isn't responding"]:
                for control in root.iter():
                    if control.attrib.get("resource-id") == "android:id/aerr_close":
                        bounds = re.fullmatch(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]",
                                              control.attrib.get("bounds", ""))
                        if bounds:
                            x1, y1, x2, y2 = map(int, bounds.groups())
                            adb("shell", "input", "tap", str((x1 + x2) // 2), str((y1 + y2) // 2))
                            report("Dismissed Pixel Launcher ANR; Orbit ANRs are never dismissed")
                            time.sleep(2)
                            adb("shell", "uiautomator", "dump", "/sdcard/orbit-ui.xml")
                            xml = adb("exec-out", "cat", "/sdcard/orbit-ui.xml")
                            (OUT / "ui.xml").write_text(xml.stdout or "", encoding="utf-8")
                            root = ET.fromstring(xml.stdout)
                        break
            for node in root.iter():
                label = (node.attrib.get("content-desc", "") + " " +
                         node.attrib.get("text", "")).lower()
                # Match the actual enabled control, never explanatory text.
                if node.attrib.get("clickable") != "true" or node.attrib.get("enabled") != "true":
                    continue
                if (node.attrib.get("resource-id") != "first-run-google-sign-in"
                        and node.attrib.get("content-desc", "").strip().lower() != "continue with google"):
                    continue
                match = re.fullmatch(
                    r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]",
                    node.attrib.get("bounds", ""))
                if not match:
                    continue
                x1, y1, x2, y2 = map(int, match.groups())
                x, y = (x1 + x2) // 2, (y1 + y2) // 2
                pressed = adb("shell", "input", "tap", str(x), str(y))
                tapped = pressed.returncode == 0
                report(f"Google CTA tap dispatched: {tapped} at {(x, y)}")
                break
        except Exception as error:
            report(f"Could not parse accessibility dump: {type(error).__name__}")
    if not tapped:
        report("FAIL: enabled Google CTA absent from UI dump")
        raise SystemExit(1)

time.sleep(8)
capture("after-google-tap.png")
adb("shell", "uiautomator", "dump", "/sdcard/orbit-after-tap-ui.xml")
after_xml = adb("exec-out", "cat", "/sdcard/orbit-after-tap-ui.xml")
(OUT / "after-google-tap-ui.xml").write_text(after_xml.stdout or "", encoding="utf-8")
after_pid = pid()
report("Process after optional tap: " + (after_pid or "NOT RUNNING"))

logs = ((OUT / "android-crash-buffer.txt").read_text(encoding="utf-8") +
        (OUT / "errors.txt").read_text(encoding="utf-8"))
if "FATAL EXCEPTION" in logs:
    report("FAIL: fatal Android exception captured")
    print("\n".join(logs.splitlines()[-130:]))
    raise SystemExit(1)
if not original_pid or not after_pid:
    report("FAIL: Orbit process not running after launch")
    print("\n".join((OUT / "app-filtered-logcat.txt").read_text(encoding="utf-8").splitlines()[-130:]))
    raise SystemExit(1)
if any(x in logs for x in ("ReactNativeJS: Error:", "ReactNativeJS: TypeError:")):
    report("FAIL: React Native JavaScript error captured")
    print("\n".join(logs.splitlines()[-130:]))
    raise SystemExit(1)
report("PASS: process stayed alive; Google account authentication still unverified")
