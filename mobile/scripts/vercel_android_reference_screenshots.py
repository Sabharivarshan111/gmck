"""Live Vercel UI in the same Android viewport/fonts/GPU as the local renderer.

The debug-only reference browser blocks third-party requests and live ads.
No fixtures, production source changes or scripted success messages are used.
"""
import json
import time
from urllib.parse import urlsplit, parse_qs
from native_anatomy_screenshots import route
from native_screenshot_driver import OUT, adb, tap, visible, wait_visible, shot, scroll_to_tappable

def main():
    captures=[]
    def capture(name):
        shot(name)
        captures.append(name)
        (OUT / 'vercel-mobile-device-audit.json').write_text(json.dumps({'platform':'Android WebView, same native device viewport', 'status':'NOT_CERTIFIED', 'captures':captures},indent=2))
    def open(query=''):
        path = '/simulator?' + query + '&device_reference=1'
        route(path,reference=True)
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            logs = adb('logcat','-d','-s','ORBIT_ANATOMY:I','*:S',capture=True).stdout
            loaded = [line.split('ORBIT_NATIVE_REFERENCE_READY:',1)[1].strip() for line in logs.splitlines() if 'ORBIT_NATIVE_REFERENCE_READY:' in line]
            if any(urlsplit(url).hostname == 'orbitmbbs.vercel.app' and parse_qs(urlsplit(url).query) == {**parse_qs(urlsplit(path).query), 'native_audit':['1']} for url in loaded):
                return
            time.sleep(1)
        raise RuntimeError('The actual Vercel page never finished loading; do not label native screens as Vercel references')
    # Mount the real local host independently of earlier capture failures.
    # Bootstrap the studio only; no invisible atlas download is needed.
    for _ in range(4):
        if visible('Explore 3D anatomy'):
            route('/simulator?reference_bootstrap=1')
            tap('Explore 3D anatomy')
            break
        adb('shell','input','keyevent','4')
        time.sleep(1)
    else:
        raise RuntimeError('Could not mount an Android renderer host for the actual Vercel reference')
    open()
    wait_visible('Explore 3D anatomy')
    capture('00-vercel-studio-393x852')
    tap('Switch to light theme')
    capture('00-vercel-studio-light-393x852')
    tap('Switch to dark theme')
    tap('Practise a case')
    scroll_to_tappable('Acute Inferior STEMI')
    capture('00-vercel-case-choices-393x852')
    tap('Acute Inferior STEMI')
    wait_visible('SELECT CASE')
    capture('00-vercel-case-393x852')
    scroll_to_tappable('IV Saline')
    tap('IV Saline')
    tap('ICU Monitor')
    wait_visible('SWEEP 25 mm/s')
    time.sleep(2)
    capture('00-vercel-icu-393x852')
    open('tool=radiology')
    wait_visible('CHEST CASE LIBRARY')
    time.sleep(2)
    capture('00-vercel-xray-393x852')
    tap('Next')
    time.sleep(1)
    capture('00-vercel-xray-case-393x852')
    tap('Brain MRI')
    wait_visible('Axial')
    time.sleep(3)
    capture('00-vercel-mri-axial-393x852')
    tap('Coronal')
    capture('00-vercel-mri-coronal-393x852')
    tap('Sagittal')
    capture('00-vercel-mri-sagittal-393x852')
    tap('Full screen')
    capture('00-vercel-radiology-fullscreen-393x852')
    tap('Exit full screen')
    open('tool=clubbing')
    wait_visible('Clubbing examination')
    tap('Clubbing findings')
    time.sleep(2)
    capture('00-vercel-clubbing-393x852')
    tap('Reveal answer')
    capture('00-vercel-clubbing-viva-393x852')

if __name__=='__main__':
    main()
