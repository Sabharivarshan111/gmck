#!/usr/bin/env python3
"""Android emulator interaction audit + actual screenshots (never browser mocks)."""
from __future__ import annotations
import json
import re
import time
import subprocess
from pathlib import Path
from native_screenshot_driver import (
    OUT, adb, launch, first_run, tap, wait_visible, shot, scroll_until,
    scroll_up, scroll_to_tappable, visible, dump_ui, node_label, find_nodes, screen_size
)

def expect(needle: str, tries: int = 5):
    wait_visible(needle, tries=tries)
    print("PASS Android UI:", needle)

def screenshot(name: str):
    shot(name)
    if name in ['05c-android-full-icu-tutorial', '05d-android-icu-lead-axis-lesson']:
        subprocess.run(['node', 'mobile/scripts/read_android_webview.mjs', str(OUT / (name + '-dom.json'))], check=False, timeout=45)

def icu_control(label):
    # Canonical mobile ICU has a horizontal status bar. Reach its real buttons
    # with a gesture inside that bar, rather than scrolling the whole page.
    width, _ = screen_size()
    for _ in range(5):
        nodes = find_nodes(label)
        if nodes and width * .05 <= nodes[0][1] <= width * .95:
            tap(label)
            return
        bars = [n for n in dump_ui().iter('node') if 'HorizontalScrollView' in n.get('class', '')]
        if not bars:
            raise RuntimeError('Actual ICU horizontal controls not found')
        rect = list(map(int, re.findall(r'\d+', bars[0].get('bounds', ''))))
        x1, y1, x2, y2 = rect
        adb('shell', 'input', 'swipe', str(round(x1+(x2-x1)*.85)), str((y1+y2)//2), str(round(x1+(x2-x1)*.15)), str((y1+y2)//2), '450')
        time.sleep(1)
    raise RuntimeError('ICU status button not reachable: ' + label)


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
        icu_control("Enable monitor tone")
        expect("Mute monitor tone")
        time.sleep(5)
        icu_control("Mute monitor tone")
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
        icu_control("Open ICU tutorial")
        expect("ECG learning studio", tries=15)
        screenshot("05c-android-full-icu-tutorial")
        tap("Leads & axis")
        expect("One heart. Twelve views.")
        screenshot("05d-android-icu-lead-axis-lesson")
        tap("Close ECG tutorial")
        expect("SWEEP 25 mm/s")
        # The canonical monitor has no pause/reset buttons. Verify its actual
        # bottom tabs and theme controls, keeping the same case engine alive.
        tap("Switch to light theme")
        expect("Switch to dark theme")
        screenshot("06-android-native-icu-light")
        tap("Switch to dark theme")
        results.append("Canonical ECG/ART/PLETH/CO2, full tutorial, live metrics and ICU theme controls")
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
        expect("Static synthetic ECG with calibrated grid")
        expect("STEMI")
        screenshot("08-android-native-12lead-ecg")
        scroll_to_tappable("All 12")
        tap("All 12")
        screenshot("09-android-native-ecg-all-leads")
        scroll_to_tappable("QRS")
        tap("QRS")
        scroll_to_tappable("Electrophysiological")
        screenshot("10-android-native-ecg-qrs-teaching")
        results.append("ECG lead groups and QRS teaching")

        for _ in range(6):
            if visible("Open full ECG teaching studio"): break
            scroll_up()
        scroll_to_tappable("Open full ECG teaching studio")
        tap("Open full ECG teaching studio")
        expect("Static synthetic ECG with calibrated grid", tries=15)
        screenshot("10b-android-full-ecg-teaching-studio")
        tap("Close diagnostic tool")
        expect("WAVE GUIDE")
        results.append("Full canonical ICU lessons, lead-axis interaction and ECG teaching module return")

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
            subprocess.run(["node", "mobile/scripts/read_android_webview.mjs", str(OUT / "99-native-failure-dom.json")], check=False, timeout=45)
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
