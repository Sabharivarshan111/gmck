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

def drawer_state(name):
    path = OUT / (name + '-dom.json')
    subprocess.run(['node', 'mobile/scripts/read_android_webview.mjs', str(path)], check=True, timeout=25)
    for result in reversed(json.loads(path.read_text())['results']):
        for panel in result.get('panels', []):
            if panel['self'].get('label') == 'Anatomy details':
                return result, panel
    raise RuntimeError('Actual anatomy drawer not present in the installed WebView')


def device_point(rect, viewport, bounds):
    return (round(bounds[0] + (rect['x'] + rect['width']/2) * (bounds[2]-bounds[0])/viewport[0]),
            round(bounds[1] + (rect['y'] + rect['height']/2) * (bounds[3]-bounds[1])/viewport[1]))


def capture_details(target, path, bounds, reference=False):
    """Read real DOM geometry; all interactions remain physical Android touches."""
    if 'organ' not in target['query'] or target.get('hasTeachingDetails') is False:
        return []
    prefix = 'anatomy-vercel-' if reference else 'anatomy-android-'
    result, panel = drawer_state(prefix + target['id'] + '-before')
    if os.environ.get('ORBIT_ANATOMY_LAYOUT_ASSERT') == '1':
        w, h = result['viewport']
        expected = h if h <= 500 else min(h*.62, 540)
        assert w < 768 and abs(panel['self']['rect']['height'] - expected) < 2, (expected, panel['self'])
    if os.environ.get('ORBIT_ANATOMY_OVERVIEWS_ONLY') == '1':
        return []
    details = []
    for label in ['Supply', 'Relations']:
        name = target['id'] + '-' + label.lower()
        try:
            result, panel = drawer_state(prefix + name + '-target')
            control = next(c for c in panel['controls'] if c.get('text') == label and c['rect']['height'] > 0)
            x, y = device_point(control['rect'], result['viewport'], bounds)
            adb('shell', 'input', 'tap', str(x), str(y))
            metadata = ready(timeout=30, expected_route=path, reference=reference, section=label)
            metadata['nativeBounds'] = bounds
            shot(prefix + name)
            details.append({'id':name, 'section':label, 'available':True, 'captured':True, 'renderer':metadata})
            if label != 'Supply':
                continue
            venous = {'id':target['id']+'-venous-drainage', 'section':'Venous drainage', 'available':True}
            try:
                for attempt in range(12):
                    result, panel = drawer_state(prefix + venous['id'] + '-scroll')
                    area = max(panel['scrollAreas'], key=lambda item:item['rect']['width']*item['rect']['height'])
                    rect = area['rect']
                    heading = next((h for h in panel['headings'] if h.get('text') == 'Venous Drainage & Return'), None)
                    if heading and rect['y'] <= heading['rect']['y'] and heading['rect']['y']+heading['rect']['height'] <= rect['y']+rect['height']:
                        break
                    # Stay within the drawer body, clear of tabs/footer and text.
                    x = rect['x'] + rect['width'] - 5
                    top = rect['y'] + 20
                    bottom = rect['y'] + rect['height'] - 20
                    scale_x = (bounds[2]-bounds[0])/result['viewport'][0]
                    scale_y = (bounds[3]-bounds[1])/result['viewport'][1]
                    if bottom-top < 40:
                        raise RuntimeError('Anatomy drawer body has no usable touch scroll viewport')
                    adb('shell','input','swipe',str(round(bounds[0]+x*scale_x)),str(round(bounds[1]+bottom*scale_y)),str(round(bounds[0]+x*scale_x)),str(round(bounds[1]+top*scale_y)),'250')
                    time.sleep(.6)
                else:
                    raise RuntimeError('Venous heading did not enter the actual drawer scroll viewport')
                shot(prefix + venous['id'])
                venous.update(captured=True, renderer=ready(timeout=15, expected_route=path, reference=reference, section='Supply'))
            except Exception as error:
                venous.update(captured=False, error=str(error))
            details.append(venous)
        except Exception as error:
            shot(prefix + 'failure-' + name)
            details.append({'id':name, 'section':label, 'available':True, 'captured':False, 'error':str(error)})
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
