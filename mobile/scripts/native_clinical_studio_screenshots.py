#!/usr/bin/env python3
"""Real Android screenshot+tap proof for native clinical studio, case, ICU monitor."""
from native_screenshot_driver import launch, first_run, tap, wait_visible, shot, scroll_until, scroll_up, visible
import time


def back_to_top():
    for _ in range(10):
        if visible("Explore 3D anatomy") or visible("Practise a case"):
            return
        scroll_up()


def main():
    launch()
    first_run()
    tap("Vault")
    wait_visible("Simulator & Anatomy")
    tap("Simulator & Anatomy")
    wait_visible("Explore 3D anatomy")
    shot("01-android-native-clinical-studio")

    tap("Practise a case")
    scroll_until("Acute Inferior STEMI", tries=8)
    shot("02-android-native-case-choices")
    tap("Acute Inferior STEMI")
    wait_visible("Patient Simulator")
    shot("03-android-native-stemi-case")

    scroll_until("IV Saline", tries=8)
    tap("IV Saline")
    scroll_until("Clinical activity log", tries=14)
    # Clicking an intervention must update the offline Vercel physiology,
    # not merely display a nonfunctional shortcut to the website.
    if not visible("IV Normal Saline"):
        scroll_until("IV Normal Saline", tries=8)
    shot("04-android-after-native-clinical-intervention")

    for _ in range(12):
        if visible("Live ICU monitor"):
            break
        scroll_up()
    tap("Live ICU monitor")
    wait_visible("SWEEP 25 mm/s")
    shot("05-android-native-icu-waveforms")
    tap("Pause monitor")
    wait_visible("Resume")
    shot("06-android-native-icu-paused")
    tap("Back to clinical studio")
    time.sleep(0.8)
    shot("07-android-case-return-preserved")

    tap("Back to clinical studio")
    wait_visible("Explore 3D anatomy")
    tap("12-lead ECG")
    wait_visible("WAVE GUIDE")
    shot("08-android-native-12lead-ecg")
    tap("All 12")
    shot("09-android-native-ecg-all-leads")
    tap("QRS")
    wait_visible("Electrophysiological")
    shot("10-android-native-ecg-qrs-teaching")

    print("Native clinical UI/monitor/case/ECG screenshots generated. Compare with web.")
    print("Offline/physical-device parity is NOT yet certified by this script.")


if __name__ == "__main__":
    main()
