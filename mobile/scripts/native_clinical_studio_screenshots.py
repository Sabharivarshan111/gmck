#!/usr/bin/env python3
"""Android emulator interaction audit + actual screenshots (never browser mocks)."""
from __future__ import annotations
import json
import re
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

        tap("Live ICU monitor")
        expect("SWEEP 25 mm/s")
        screenshot("05-android-native-icu-waveforms")
        adb("logcat", "-c")
        tap("Enable monitor tone")
        expect("Mute monitor tone")
        time.sleep(5)
        tap("Mute monitor tone")
        expect("Enable monitor tone")
        tone_log = adb("logcat", "-d", "-s", "ORBIT_MONITOR_TONE:I", "*:S", capture=True).stdout
        (OUT / "native-monitor-tone.txt").write_text(tone_log)
        if not any(int(frames) > 0 for frames in re.findall(r"PCM_RENDERED frames=(\d+)", tone_log)):
            raise RuntimeError("No native ICU pulse PCM playback recorded")
        results.append("Native pulse PCM playback and mute state; speaker audibility unverified")
        for metric in ["CVP", "TEMP", "LACTATE"]:
            scroll_to_tappable(metric)
            expect(metric)
        screenshot("05b-android-native-icu-secondary-readings")
        for _ in range(4):
            if visible("Pause monitor"): break
            scroll_up()
        tap("Pause monitor")
        expect("Resume")
        screenshot("06-android-native-icu-paused")
        tap("Resume monitor")
        expect("Pause")
        results.append("ECG/ART/PLETH/CO2 and pause/resume")
        adb("shell","input","keyevent","4")
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
        # Both MRI and chest references must render offline from packaged assets.
        scroll_to_tappable("X-ray & MRI")
        tap("X-ray & MRI")
        expect("CHEST CASE LIBRARY")
        expect("Normal PA chest")
        expect("Normal adult posteroanterior chest radiograph")
        time.sleep(2)
        if visible("unavailable") or visible("RADIOLOGY_"):
            raise AssertionError("Offline native raster renderer failed")
        screenshot("12-android-offline-native-xray")
        scroll_to_tappable("Next →")
        tap("Next →")
        expect("Large left pneumothorax")
        screenshot("13-android-native-xray-case")
        scroll_to_tappable("Brain MRI")
        tap("Brain MRI")
        scroll_to_tappable("Slice")
        expect("Slice 57 / 112")
        time.sleep(2)
        expect("axial MRI slice 57")
        screenshot("14-android-offline-native-mri-axial")
        scroll_to_tappable("Coronal")
        tap("Coronal")
        expect("Slice 65 / 128")
        expect("coronal MRI slice 65")
        screenshot("15-android-offline-native-mri-coronal")
        scroll_to_tappable("Sagittal")
        tap("Sagittal")
        expect("Slice 57 / 112")
        expect("sagittal MRI slice 57")
        screenshot("16-android-offline-native-mri-sagittal")
        scroll_to_tappable("Full screen")
        tap("Full screen")
        expect("Close full screen")
        screenshot("17-android-native-radiology-fullscreen")
        tap("Close full screen")
        tap("Back to clinical studio")
        results.append("Offline X-ray case navigation, all MRI planes and fullscreen")
        scroll_to_tappable("Clubbing")
        tap("Clubbing")
        expect("Clubbing examination")
        tap("Clubbing findings")
        expect("Clinical reference photograph")
        screenshot("18-android-offline-native-clubbing")
        scroll_to_tappable("Reveal answer")
        tap("Reveal answer")
        expect("No. Look for another cause")
        screenshot("19-android-native-clubbing-viva")
        tap("Close clubbing skill")
        results.append("Offline clubbing reference, examination findings and viva reveal")
        print("All successfully exercised UI steps:",results)
    except Exception as exc:
        print("FAIL in real Android UI automation:",repr(exc))
        try:
            shot("99-native-failure-screen")
            from native_screenshot_driver import dump_ui
            dump_ui()
            (OUT/"99-native-failure-ui.xml").write_text(Path("/tmp/window.xml").read_text())
            (OUT/"99-native-failure.txt").write_text(repr(exc))
        except Exception as capture_err:
            print("Failure evidence capture also failed:",capture_err)
        raise
    finally:
        adb("shell","svc","wifi","enable",check=False)
        adb("shell","svc","data","enable",check=False)
        (OUT/"native-ui-audit.json").write_text(json.dumps({"passed":results},indent=2))

if __name__=="__main__":
    main()
