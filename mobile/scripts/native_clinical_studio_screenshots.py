#!/usr/bin/env python3
"""Android emulator interaction audit + actual screenshots (never browser mocks)."""
from __future__ import annotations
import json
import time
from pathlib import Path
from native_screenshot_driver import (
    OUT, adb, launch, first_run, tap, wait_visible, shot, scroll_until,
    scroll_up, scroll_to_tappable, visible
)

def expect(needle: str, tries: int = 5):
    wait_visible(needle, tries=tries)
    print("PASS Android UI:", needle)

def screenshot(name: str):
    shot(name)

def main():
    results=[]
    try:
        launch()
        first_run()
        tap("Vault")
        scroll_to_tappable("Simulator & Anatomy")
        tap("Simulator & Anatomy")
        expect("Explore 3D anatomy")
        screenshot("01-android-native-clinical-studio")
        results.append("Vault entry and studio")

        # Match web theme toggling without changing the underlying canonical UI.
        tap("Switch to light theme")
        expect("Switch to dark theme")
        screenshot("01b-native-clinical-studio-light")
        tap("Switch to dark theme")
        expect("Switch to light theme")
        results.append("Dark/light mode switches")

        # Verify patient finding selection persists when returning from case.
        scroll_to_tappable("Practise a case")
        tap("Practise a case")
        scroll_to_tappable("Acute Inferior STEMI")
        screenshot("02-android-native-case-choices")
        tap("Acute Inferior STEMI")
        expect("Patient Simulator")
        expect("Acute Inferior STEMI")
        screenshot("03-android-native-stemi-case")
        results.append("Case catalog -> STEMI case")

        scroll_to_tappable("IV Saline")
        tap("IV Saline")
        scroll_to_tappable("Clinical activity log")
        expect("IV Normal Saline")
        screenshot("04-android-after-native-clinical-intervention")
        results.append("IV saline intervention produces clinical feedback")

        scroll_to_tappable("Live ICU monitor")
        tap("Live ICU monitor")
        expect("SWEEP 25 mm/s")
        screenshot("05-android-native-icu-waveforms")
        tap("Pause monitor")
        expect("Resume")
        screenshot("06-android-native-icu-paused")
        tap("Resume monitor")
        expect("Pause")
        results.append("ECG/ART/PLETH/CO2 and pause/resume")
        tap("Back to clinical studio")
        expect("Patient Simulator")
        screenshot("07-android-case-return-preserved")
        tap("Back to clinical studio")
        expect("Explore 3D anatomy")
        results.append("Back navigation")

        scroll_to_tappable("Learn a skill")
        tap("Learn a skill")
        scroll_to_tappable("Case comparison")
        expect("Acute Inferior STEMI")
        results.append("Case context preserved across navigation")

        scroll_to_tappable("12-lead ECG")
        tap("12-lead ECG")
        expect("WAVE GUIDE")
        expect("Acute Inferior STEMI")
        screenshot("08-android-native-12lead-ecg")
        scroll_to_tappable("All 12")
        tap("All 12")
        screenshot("09-android-native-ecg-all-leads")
        scroll_to_tappable("QRS")
        tap("QRS")
        scroll_to_tappable("Electrophysiological")
        screenshot("10-android-native-ecg-qrs-teaching")
        results.append("ECG lead groups and QRS teaching")

        # Cold offline check: native ICU/case/ECG use the embedded physiology.
        # Verify that they load after network is disabled (deep 3D is still online).
        tap("Back to clinical studio")
        expect("Explore 3D anatomy")
        adb("shell","svc","wifi","disable",check=False)
        adb("shell","svc","data","disable",check=False)
        scroll_to_tappable("Open live monitor")
        tap("Open live monitor")
        expect("SWEEP 25 mm/s")
        screenshot("11-android-offline-icu-monitor")
        results.append("Offline native ICU")
        tap("Back to clinical studio")
        expect("Explore 3D anatomy")
        print("All successfully exercised UI steps:",results)
    except Exception as exc:
        print("FAIL in real Android UI automation:",repr(exc))
        try:
            shot("99-native-failure-screen")
            xml=adb("shell","uiautomator","dump","/sdcard/orbit_ui.xml",check=False,capture=True)
            adb("pull","/sdcard/orbit_ui.xml",str(OUT/"99-native-failure-ui.xml"),check=False)
            (OUT/"99-native-failure.txt").write_text(repr(exc)+"\n"+(xml.stdout or ""))
        except Exception as capture_err:
            print("Failure evidence capture also failed:",capture_err)
        raise
    finally:
        adb("shell","svc","wifi","enable",check=False)
        adb("shell","svc","data","enable",check=False)
        (OUT/"native-ui-audit.json").write_text(json.dumps({"passed":results},indent=2))

if __name__=="__main__":
    main()
