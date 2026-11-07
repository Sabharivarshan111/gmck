#!/usr/bin/env python3
"""Real installed-APK, no-account smoke test for university-isolated native question banks.

Run on a clean Android emulator with Orbit's ad-free, Google-disabled DEBUG APK.
This drives genuine accessibility controls; it does not mock the question bank,
replace the JS search index or write an AsyncStorage profile behind the app.
Never claim that a passing test also proves a production Google OAuth login.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "mobile" / "scripts"))
import native_screenshot_driver as ui  # noqa: E402

OUT = Path(os.environ.get("ORBIT_SCREENSHOT_OUT", "artifacts/university-bank-native"))
OUT.mkdir(parents=True, exist_ok=True)
PACKAGE = os.environ.get("ORBIT_PACKAGE", "com.aistudio.mbbsqbank.aycxvd.debug")
PROVENANCE = os.environ.get("ORBIT_APK_PROVENANCE", "unknown")
results: list[dict] = []

BANKS = [
    ("rguhs", "Rajiv Gandhi", "Dysphagia", "Dysphagia lusoria"),
    ("muhs", "Maharashtra University", "ferric", "ferric chloride"),
    ("wbuhs", "West Bengal University", "Schuffner", "Schuffner"),
]


def record(stage: str, status: str, detail: str = ""):
    item = {"stage": stage, "status": status, "detail": detail}
    results.append(item)
    print(json.dumps(item), flush=True)
    (OUT / "results.json").write_text(
        json.dumps({"apk": PROVENANCE, "results": results}, indent=2), encoding="utf8"
    )


def labels():
    return [(n.get("class", ""), ui.node_label(n)) for n in ui.dump_ui().iter("node")]


def visible_non_input(needle: str) -> bool:
    return any(
        needle.lower() in label.lower() and "EditText" not in cls
        for cls, label in labels()
    )


def wait_text(needle: str, seconds: int = 45, exclude_input: bool = False):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        if (visible_non_input(needle) if exclude_input else ui.visible(needle)):
            return
        time.sleep(1.4)
    raise AssertionError("Native UI did not display " + repr(needle))


def swipe_inside_university_list():
    """Scroll the real expanded dropdown, not the whole onboarding screen."""
    root = ui.dump_ui()
    width, height = ui.screen_size()
    choices = []
    for node in root.iter("node"):
        if node.get("scrollable") != "true":
            continue
        bounds = [int(x) for x in re.findall(r"\d+", node.get("bounds", ""))]
        if len(bounds) != 4:
            continue
        x1, y1, x2, y2 = bounds
        h, w = y2 - y1, x2 - x1
        if h > 140 and h <= height * 0.54 and w > width * 0.55:
            choices.append((h, x1, y1, x2, y2))
    if not choices:
        ui.shot("99-dropdown-unreachable")
        raise AssertionError("Could not find expanded university dropdown scroll viewport")
    _, x1, y1, x2, y2 = min(choices)
    x = (x1 + x2) // 2
    start = int(y1 + (y2 - y1) * 0.8)
    end = int(y1 + (y2 - y1) * 0.2)
    ui.adb("shell", "input", "swipe", str(x), str(start), str(x), str(end), "420")
    time.sleep(0.9)


def pick_university(text: str):
    for attempt in range(3):
        if ui.visible("Choose your university") or ui.visible("Change university"):
            break
        time.sleep(1)
    # During onboarding the chooser says "Choose your university". In Settings
    # it says "University: <current university>. Change university".
    if ui.visible("Choose your university"):
        ui.tap("Choose your university")
    else:
        nodes = [label for _, label in labels() if label.startswith("University: ") and "Change university" in label]
        if not nodes:
            raise AssertionError("Current university Settings control missing")
        ui.tap(nodes[0])
    for _ in range(12):
        if ui.visible(text):
            ui.tap(text)
            time.sleep(1)
            return
        swipe_inside_university_list()
    ui.shot("99-university-choice-missing")
    raise AssertionError("Cannot choose university " + text)


def clear_tour():
    for _ in range(4):
        if ui.tap("Skip the walkthrough", required=False):
            continue
        if ui.tap("Close the walkthrough", required=False):
            continue
        break


def start_onboarding():
    ui.adb("wait-for-device")
    ui.adb("shell", "settings", "put", "global", "window_animation_scale", "0", check=False)
    ui.adb("shell", "settings", "put", "global", "transition_animation_scale", "0", check=False)
    ui.adb("shell", "settings", "put", "global", "animator_duration_scale", "0", check=False)
    ui.launch()
    wait_text("Welcome to Orbit", seconds=75)
    ui.shot("01-walkthrough")
    if ui.visible("Continue with Google"):
        raise AssertionError("Installed APK is not the debug, no-OAuth bank testing build")
    pick_university(BANKS[0][1])
    wait_text("RGUHS")
    ui.tap("Display name")
    ui.adb("shell", "input", "text", "BankQA")
    ui.adb("shell", "input", "keyevent", "4")
    time.sleep(1)
    if ui.visible("1st Year"):
        ui.scroll_to_tappable("1st Year")
        ui.tap("1st Year")
    elif ui.visible("First Year"):
        ui.tap("First Year")
    else:
        raise AssertionError("First-year selection absent in onboarding")
    ui.tap("Continue to Orbit")
    time.sleep(4)
    clear_tour()
    wait_text("ORBIT", seconds=45)
    ui.shot("02-onboarding-complete")
    record("onboarding_RG UHS".replace(" ", ""), "pass", "Saved RGUHS through actual first-run controls")


def open_bank(code: str):
    clear_tour()
    # The Home menu has a stable dedicated action across quick-action layouts.
    ui.tap("Menu")
    ui.tap("Search the bank")
    wait_text(code.upper() + " Question Bank", seconds=50)
    for other in ("rguhs", "muhs", "wbuhs"):
        if other != code and ui.visible(other.upper() + " Question Bank"):
            raise AssertionError("Wrong university bank visible: " + other)
    ui.shot(f"bank-{code}-home")
    record(code + "_screen", "pass", code.upper() + " title visible; other banks not shown")


def search_bank(code: str, query: str, expected: str):
    field = "Search every " + code.upper() + " question"
    wait_text(field, seconds=50)
    ui.tap(field)
    ui.adb("shell", "input", "text", query)
    ui.adb("shell", "input", "keyevent", "4")
    wait_text(expected, seconds=75, exclude_input=True)
    if not ui.visible(code.upper() + " Question Bank"):
        raise AssertionError("Bank title changed during search")
    # Search rows must be sourced only from the selected university. The
    # source-scoped merger also has a separate unit regression test in CI.
    for other in ("rguhs", "muhs", "wbuhs"):
        if other != code and ui.visible(other.upper() + " Question Bank"):
            raise AssertionError("Cross-university title leaked during search")
    ui.shot(f"bank-{code}-search")
    record(code + "_search", "pass", f"{query!r} matched {expected!r} in installed APK")


def return_home():
    # First Back clears a global search, second Back pops BrowseHome.
    if ui.visible("Back"):
        ui.tap("Back")
        time.sleep(0.5)
    if ui.visible("Back"):
        ui.tap("Back")
    time.sleep(2)
    clear_tour()


def set_university_in_settings(target: str):
    ui.tap("Settings")
    wait_text("QUESTION BANK UNIVERSITY")
    ui.shot("settings-before-" + target.lower().replace(" ", "-"))
    pick_university(target)
    time.sleep(1)
    # Close Settings sheet; Android Back is the native dismissal path.
    ui.adb("shell", "input", "keyevent", "4")
    time.sleep(1.5)


def audit_crashes():
    crash = subprocess.run(
        ["adb", "logcat", "-d", "-v", "brief", "-b", "crash"],
        check=False, capture_output=True, text=True
    ).stdout
    (OUT / "crash-logcat.txt").write_text(crash, encoding="utf8")
    if "FATAL EXCEPTION" in crash and PACKAGE in crash:
        raise AssertionError("Native Android crash detected for " + PACKAGE)
    running = subprocess.run(
        ["adb", "shell", "pidof", PACKAGE], capture_output=True, text=True
    ).stdout.strip()
    if not running:
        raise AssertionError("App process not running at end of test")


def main():
    record("apk_provenance", "info", PROVENANCE)
    ui.adb("logcat", "-c", check=False)
    start_onboarding()
    for index, (code, university, query, expected) in enumerate(BANKS):
        if index:
            set_university_in_settings(university)
        open_bank(code)
        search_bank(code, query, expected)
        return_home()
    audit_crashes()
    record("native_question_bank_qa", "pass",
           "Three universities, real onboarding, Settings switches, search results, no detected crash")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        record("native_question_bank_qa", "fail", repr(exc))
        traceback.print_exc()
        try:
            ui.shot("99-failure-state")
            root = ui.dump_ui()
            (OUT / "failure-ui.xml").write_bytes(
                __import__("xml.etree.ElementTree", fromlist=["tostring"]).tostring(root)
            )
        except Exception:
            pass
        raise SystemExit(1)
