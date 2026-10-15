#!/usr/bin/env python3
"""Capture installed Android's real cached canonical renderer for every organ target.

Debug-only route intents change the actual WebView's URL. They never substitute a
fixture, inject a fake model or exist in signed release builds.
"""
import json
import os
import subprocess
import xml.etree.ElementTree as ET
import shlex
import re
import time
from urllib.parse import urlencode, parse_qs, urlsplit
from native_screenshot_driver import OUT, PACKAGE, adb, launch, first_run, tap, scroll_to_tappable, shot, dump_ui, node_label, bounds_center

def route(path, reference=False):
    adb("logcat", "-c")
    adb("shell", "am", "start", "-n", PACKAGE + "/com.aistudio.mbbsqbank.aycxvd.MainActivity",
        "--es", "orbit_anatomy_qa_route", shlex.quote(path), "--ez", "orbit_anatomy_qa_reference", "true" if reference else "false")

def ready(timeout=180, expected_route=None, reference=False, section=None):
    start = time.monotonic()
    previous = None
    last_metadata = None
    stable_since = time.monotonic()
    while time.monotonic() - start < timeout:
        output = adb("logcat", "-d", "-s", "ORBIT_ANATOMY:I", "*:S", capture=True).stdout
        if "ORBIT_NATIVE_SHADER_ERROR:" in output:
            raise RuntimeError("Actual Android WebGL shader failed to compile")
        if "ORBIT_NATIVE_RENDER_ERROR:" in output:
            raise RuntimeError("Actual Android renderer startup failed: " + output[-1500:])
        for line in reversed(output.splitlines()):
            if "ORBIT_NATIVE_GEOMETRY:" not in line:
                continue
            value = json.loads(line.split("ORBIT_NATIVE_GEOMETRY:", 1)[1])
            last_metadata = value
            if bool(value.get('reference')) != reference:
                continue
            if section is not None and value.get('section') != section:
                break
            if expected_route:
                wanted=parse_qs(urlsplit(expected_route).query)
                actual=parse_qs(value.get('route','').lstrip('?'))
                keys = set(wanted) | {'mode', 'organ', 'layer', 'isolate', 'scenario', 'tool', 'offline_test'}
                if any(actual.get(key)!=wanted.get(key) for key in keys):
                    break
            if value.get("graphicsError"):
                raise RuntimeError("Android WebGL error: " + json.dumps(value))
            if value.get("loading") or value.get("systems") is None:
                break
            if value != previous:
                previous = value
                stable_since = time.monotonic()
            if time.monotonic() - stable_since >= 5:
                return value
            break
        time.sleep(1)
    raise RuntimeError("Android anatomy geometry never reached a stable loaded state; last metadata=" + json.dumps(last_metadata))

def capture_details(target, path, bounds, reference=False):
    """Use real drawer controls, verifying the selected DOM tab before capture."""
    if os.environ.get('ORBIT_ANATOMY_OVERVIEWS_ONLY') == '1':
        return []
    if 'organ' not in target['query'] or target.get('hasTeachingDetails') is False:
        return []
    prefix = 'anatomy-vercel-' if reference else 'anatomy-android-'
    details = []
    # Read layout before any accessibility service handoff. One hierarchy
    # snapshot owns the optional selection-strip tap, avoiding a second lookup.
    if os.environ.get('ORBIT_ANATOMY_LAYOUT_PROBE') == '1':
        subprocess.run(['node', 'mobile/scripts/read_android_webview.mjs', str(OUT / (prefix + target['id'] + '-before-dom.json'))], check=False, timeout=45)
    root = dump_ui()
    ET.ElementTree(root).write(OUT / (prefix + target['id'] + '-before.xml'))
    for node in root.iter('node'):
        if 'Open selected structure anatomy details' in node_label(node):
            center = bounds_center(node.get('bounds', ''))
            if center:
                adb('shell', 'input', 'tap', str(center[0]), str(center[1]))
                time.sleep(2)
                break
    if os.environ.get('ORBIT_ANATOMY_LAYOUT_PROBE') == '1':
        subprocess.run(['node', 'mobile/scripts/read_android_webview.mjs', str(OUT / (prefix + target['id'] + '-after-dom.json'))], check=False, timeout=45)
    for label in ['Supply', 'Relations']:
        name = target['id'] + '-' + label.lower()
        candidates = []
        for node in dump_ui().iter('node'):
            if label in [node.get('text', '').strip(), node.get('content-desc', '').strip()]:
                center = bounds_center(node.attrib.get('bounds', ''))
                if center: candidates.append(center)
        if not candidates:
            ET.ElementTree(dump_ui()).write(OUT / (prefix + name + '-missing.xml'))
            shot(prefix + 'failure-' + name)
            details.append({'id': name, 'section': label, 'available': True, 'captured': False, 'error': 'Detail tab could not be reached; availability unverified'})
            continue
        try:
            x, y = candidates[0]
            adb('shell', 'input', 'tap', str(x), str(y))
            metadata = ready(timeout=45, expected_route=path, reference=reference, section=label)
            metadata['nativeBounds'] = bounds
            shot(prefix + name)
            details.append({'id': name, 'section': label, 'available': True, 'captured': True, 'renderer': metadata})
            if label == 'Supply':
                venous = {'id': target['id'] + '-venous-drainage', 'section': 'Venous drainage', 'available': True}
                try:
                    scroll_to_tappable('Venous Drainage & Return', tries=8)
                    shot(prefix + venous['id'])
                    venous.update(captured=True, renderer=metadata)
                except Exception as error:
                    venous.update(captured=False, error=str(error))
                details.append(venous)
        except Exception as error:
            shot(prefix + 'failure-' + name)
            details.append({'id': name, 'section': label, 'available': True, 'captured': False, 'error': str(error)})
    return details

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
    targets += [{"id": organ["id"], "hasTeachingDetails": organ["hasTeachingDetails"], "query": {"mode": "anatomy", "organ": organ["id"], "isolate": organ["preferredReference"]}}
                for organ in coverage["organs"]]
    selected = os.environ.get('ORBIT_ANATOMY_TARGETS')
    if selected:
        targets = [t for t in targets if t['id'] in selected.split(',')]
    # The first intent is applied when the real anatomy surface is mounted.
    route("/simulator?" + urlencode(targets[0]["query"]))
    tap("Explore 3D anatomy")
    native_bounds = None
    missing_metadata = 0
    for index, target in enumerate(targets):
        path = "/simulator?" + urlencode(target["query"])
        try:
            if index:
                route(path)
            metadata = ready(expected_route=path)
            if native_bounds is None:
                for node in dump_ui().iter("node"):
                    if node.attrib.get("class") == "android.webkit.WebView":
                        native_bounds = [int(value) for value in re.findall(r"\d+", node.attrib["bounds"])]
                        break
            metadata["nativeBounds"] = native_bounds
            name = "anatomy-android-" + target["id"]
            shot(name)
            details = capture_details(target, path, native_bounds)
            results.append({**target, "route": path, "screenshot": name + ".png", "renderer": metadata, "captured": True, "details": details})
            missing_metadata = 0
            print("CAPTURED actual Android anatomy:", target["id"], flush=True)
        except Exception as error:
            shot("anatomy-android-failure-" + target["id"])
            results.append({**target, "route": path, "captured": False, "error": str(error)})
            print("FAILED actual Android anatomy:", target["id"], str(error), flush=True)
            (OUT / ("anatomy-logcat-" + target["id"] + ".txt")).write_text(adb("logcat", "-d", capture=True).stdout[-100000:])
            missing_metadata += int('last metadata=null' in str(error))
        (OUT / "native-anatomy-captures.json").write_text(json.dumps({"status": "NOT_CERTIFIED", "targets": results}, indent=2))
        if missing_metadata >= 3 or (not results[-1]['captured'] and any(message in results[-1].get('error', '') for message in ['renderer startup failed', 'shader failed'])):
            raise RuntimeError('Global native renderer failure; stopping repeated route timeouts. See failure logcat and screenshots.')
    references = []
    if os.environ.get('ORBIT_ANATOMY_REFERENCE') != 'browser':
        # The live Vercel reference uses the same Android WebView, fonts, viewport and
        # software GPU. This avoids desktop font fallback masquerading as mobile QA.
        for target in targets:
            path = "/simulator?" + urlencode(target["query"])
            try:
                route(path, reference=True)
                metadata = ready(expected_route=path, reference=True)
                metadata["nativeBounds"] = native_bounds
                shot("anatomy-vercel-" + target["id"])
                details = capture_details(target, path, native_bounds, reference=True)
                references.append({"id": target["id"], "captured": True, "renderer": metadata, "details": details})
            except Exception as error:
                shot("anatomy-vercel-failure-" + target["id"])
                references.append({"id": target["id"], "captured": False, "error": str(error)})
            (OUT / "vercel-anatomy-captures.json").write_text(json.dumps({"status": "NOT_CERTIFIED", "platform": "same Android WebView", "targets": references}, indent=2))
    # A new renderer instance, with radios off, must reuse the actual private cache.
    adb("shell", "svc", "wifi", "disable", check=False)
    adb("shell", "svc", "data", "disable", check=False)
    route("/simulator?mode=anatomy&layer=vascular&offline_test=1")
    try:
        ready(expected_route="/simulator?mode=anatomy&layer=vascular&offline_test=1")
        shot("anatomy-android-offline-vessels")
    finally:
        adb("shell", "svc", "wifi", "enable", check=False)
        adb("shell", "svc", "data", "enable", check=False)
    if not all(target["captured"] and all(not item['available'] or item['captured'] for item in target.get('details', [])) for target in results + references):
        raise RuntimeError("Some organ captures failed; see native-anatomy-captures.json")

if __name__ == "__main__":
    main()
