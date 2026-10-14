#!/usr/bin/env python3
"""Capture installed Android's real cached canonical renderer for every organ target.

Debug-only route intents change the actual WebView's URL. They never substitute a
fixture, inject a fake model or exist in signed release builds.
"""
import json
import shlex
import re
import time
from urllib.parse import urlencode
from native_screenshot_driver import OUT, PACKAGE, adb, launch, first_run, tap, scroll_to_tappable, shot, dump_ui

def route(path):
    adb("logcat", "-c")
    adb("shell", "am", "start", "-n", PACKAGE + "/com.aistudio.mbbsqbank.aycxvd.MainActivity",
        "--es", "orbit_anatomy_qa_route", shlex.quote(path))

def ready(timeout=180):
    start = time.monotonic()
    previous = None
    stable_since = time.monotonic()
    while time.monotonic() - start < timeout:
        output = adb("logcat", "-d", "-s", "ORBIT_ANATOMY:I", "*:S", capture=True).stdout
        for line in reversed(output.splitlines()):
            if "ORBIT_NATIVE_GEOMETRY:" not in line:
                continue
            value = json.loads(line.split("ORBIT_NATIVE_GEOMETRY:", 1)[1])
            if value.get("graphicsError"):
                raise RuntimeError("Android WebGL error: " + json.dumps(value))
            if value.get("loading") or not value.get("systems"):
                break
            if value != previous:
                previous = value
                stable_since = time.monotonic()
            if time.monotonic() - stable_since >= 5:
                return value
            break
        time.sleep(1)
    raise RuntimeError("Android anatomy geometry never reached a stable loaded state")

def main():
    coverage = json.loads((OUT / "anatomy-coverage.json").read_text())
    results = []
    adb("shell", "svc", "wifi", "enable", check=False)
    adb("shell", "svc", "data", "enable", check=False)
    launch()
    first_run()
    tap("Vault")
    scroll_to_tappable("Simulator & Anatomy")
    tap("Simulator & Anatomy")
    targets = [{"id": "whole-body", "query": {"mode": "anatomy"}},
               {"id": "vessels", "query": {"mode": "anatomy", "layer": "vascular"}},
               {"id": "skeleton", "query": {"mode": "anatomy", "layer": "skeletal"}}]
    targets += [{"id": organ["id"], "query": {"mode": "anatomy", "organ": organ["id"], "isolate": organ["preferredReference"]}}
                for organ in coverage["organs"]]
    # The first intent is applied when the real anatomy surface is mounted.
    route("/simulator?" + urlencode(targets[0]["query"]))
    tap("Explore 3D anatomy")
    native_bounds = None
    for index, target in enumerate(targets):
        path = "/simulator?" + urlencode(target["query"])
        try:
            if index:
                route(path)
            metadata = ready()
            if native_bounds is None:
                for node in dump_ui().iter("node"):
                    if node.attrib.get("class") == "android.webkit.WebView":
                        native_bounds = [int(value) for value in re.findall(r"\d+", node.attrib["bounds"])]
                        break
            metadata["nativeBounds"] = native_bounds
            name = "anatomy-android-" + target["id"]
            shot(name)
            results.append({**target, "route": path, "screenshot": name + ".png", "renderer": metadata, "captured": True})
            print("CAPTURED actual Android anatomy:", target["id"], flush=True)
        except Exception as error:
            shot("anatomy-android-failure-" + target["id"])
            results.append({**target, "route": path, "captured": False, "error": str(error)})
            print("FAILED actual Android anatomy:", target["id"], str(error), flush=True)
        (OUT / "native-anatomy-captures.json").write_text(json.dumps({"status": "NOT_CERTIFIED", "targets": results}, indent=2))
    # A new renderer instance, with radios off, must reuse the actual private cache.
    adb("shell", "svc", "wifi", "disable", check=False)
    adb("shell", "svc", "data", "disable", check=False)
    route("/simulator?mode=anatomy&layer=vascular&offline_test=1")
    try:
        ready()
        shot("anatomy-android-offline-vessels")
    finally:
        adb("shell", "svc", "wifi", "enable", check=False)
        adb("shell", "svc", "data", "enable", check=False)
    if not all(target["captured"] for target in results):
        raise RuntimeError("Some organ captures failed; see native-anatomy-captures.json")

if __name__ == "__main__":
    main()
