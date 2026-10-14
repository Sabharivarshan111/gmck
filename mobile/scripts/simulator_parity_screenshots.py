#!/usr/bin/env python3
"""Capture native V27 simulator from an Android emulator, not a browser mock."""
from __future__ import annotations
import time
from native_screenshot_driver import launch, first_run, tap, visible, shot, scroll_until

def main() -> None:
    launch()
    first_run()
    tap("Vault")
    scroll_until("Simulator & Anatomy", tries=8)
    tap("Simulator & Anatomy")
    # The remote Vercel page has a multi-MB renderer on a cold emulator.
    time.sleep(16)
    shot("01-native-v27-simulator")
    if visible("Offline native studio") or visible("Clinical learning studio"):
        raise RuntimeError("The obsolete fake offline simulator is still present")
    if visible("The full website simulator needs an internet connection"):
        raise RuntimeError("The hosted simulator failed to load in the Android emulator")
    print("Captured online WebView. Visually inspect against the reference browser screenshot.")
if __name__ == "__main__":
    main()
