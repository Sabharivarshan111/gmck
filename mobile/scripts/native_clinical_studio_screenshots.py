#!/usr/bin/env python3
"""Capture genuine Android native clinical studio screen for 1:1 Vercel comparison."""
from native_screenshot_driver import launch, first_run, tap, wait_visible, shot
import time

def main():
    launch()
    first_run()
    # Native bottom navigation is accessible by the label "Vault".
    tap("Vault")
    wait_visible("Simulator & Anatomy")
    tap("Simulator & Anatomy")
    wait_visible("Explore 3D anatomy")
    time.sleep(1)
    shot("01-android-native-clinical-studio")
    tap("Practise a case")
    wait_visible("Acute Inferior STEMI")
    shot("02-android-native-cases")
    tap("Learn a skill")
    wait_visible("Auscultation")
    shot("03-android-native-skills")
    print("REAL Android screenshots complete. This is NOT verification of deeper native tools.")

if __name__ == "__main__":
    main()
