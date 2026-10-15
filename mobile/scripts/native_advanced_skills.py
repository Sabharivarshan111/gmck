"""Interact through actual Android UI; inspector reads state without modifying it."""
import os, json, subprocess, time, xml.etree.ElementTree as ET
from native_screenshot_driver import OUT, adb, tap, wait_visible, shot, dump_ui, scroll_to_tappable, find_nodes, visible, screen_size, reachable_nodes
from native_diagnostic_controls import open_skill, adjust_slider

def edge_scroll(up=False):
    # Eye stage deliberately consumes drags (touch-action:none). Scroll in the
    # real outer 6px gutter, outside that examination target.
    w,h=screen_size();x=round(w*.985)
    adb("shell","input","swipe",str(x),str(round(h*(.30 if up else .74))),str(x),str(round(h*(.76 if up else .28))),"550")
    time.sleep(1)

def reach_control(label):
    _, height = screen_size()
    for attempt in range(24):
        candidates = []
        for node, rect in reachable_nodes(dump_ui()):
            if node.get('clickable') != 'true' or node.get('enabled') == 'false':
                continue
            if label not in [node.get('text', '').strip(), node.get('content-desc', '').strip()]:
                continue
            x1, y1, x2, y2 = rect
            candidates.append(((x2-x1)*(y2-y1), rect))
        candidates.sort()
        if candidates:
            rect = candidates[0][1]
            center = (rect[1]+rect[3])/2
            if height*.10 <= center <= height*.94:
                return rect
            edge_scroll(center < height*.10)
        else:
            edge_scroll(attempt < 5)
    raise RuntimeError('Could not reach exact enabled advanced control: ' + label)


def press(label):
    x1, y1, x2, y2 = reach_control(label)
    adb('shell', 'input', 'tap', str((x1+x2)//2), str((y1+y2)//2))
    time.sleep(1)


def adjust_web_slider(label, fraction):
    # WebView HTML ranges lack AccessibilityNodeInfo.RangeInfo on this image.
    # Read their DOM values, but change them only with a real Android touch.
    before = next(s for s in state('slider-before')['sliders'] if s['label'] == label)
    x1, y1, x2, y2 = reach_control(label)
    adb('shell', 'input', 'tap', str(round(x1+(x2-x1)*fraction)), str((y1+y2)//2))
    time.sleep(1)
    after = next(s for s in state('slider-after')['sliders'] if s['label'] == label)
    assert after['value'] != before['value'] and after['min'] <= after['value'] <= after['max'], (before, after)
    return {'control':label, 'before':before['value'], 'after':after['value']}


def state(name):
    path=OUT/(name+'-state.json')
    subprocess.run(['node','mobile/scripts/read_android_advanced.mjs',str(path)],check=True,timeout=50)
    candidates=json.loads(path.read_text())['results']
    return next(r for r in reversed(candidates) if not r.get('error'))


def capture(name):
    shot('advanced-android-'+name)
    return state('advanced-android-'+name)


def eye():
    open_skill('Eyes & cranial nerves')
    wait_visible('Interactive eye and facial examination',tries=30)
    for _ in range(36):
        s=state('eye-ready')
        if s['eye']['render']=='ready':break
        time.sleep(5)
    assert s['eye']['render']=='ready',s
    press('Patient’s right')
    right=capture('eye-gaze-right')
    assert float(right['eye']['response']['rightX'])<-.5,right
    press('Centre')
    press('Penlight')
    press('Right eye penlight')
    lit=capture('eye-penlight')
    assert float(lit['eye']['response']['rightPupil'])<3,lit
    press('Turn penlight off')
    unlit=state('eye-off')
    assert float(unlit['eye']['response']['rightPupil'])>float(lit['eye']['response']['rightPupil']),unlit
    press('Cotton');press('Touch right cornea')
    # Transient blink lasts 600 ms; a later inspector read cannot certify it.
    press('Reset examination');capture('eye-reset')
    return {'gaze':True,'penlightConstrictionAndRecovery':True,'headReady':True,'cottonButtonOnly':True}


def auscultation():
    open_skill('Auscultation')
    wait_visible('Auscultation trainer',tries=30)
    press('Normal S1 / S2');wait_visible('Stop Stethoscope',tries=15)
    s=capture('auscultation-heart')
    assert not s['audioErrors'],s
    press('Bell · low pitch');s=state('auscultation-bell')
    assert any('Bell' in b['text'] and b['pressed']=='true' for b in s['buttons']),s
    press('View back');wait_visible('View front');capture('auscultation-back')
    press('X-ray view');s=capture('auscultation-xray')
    assert any('X-ray view' in b['text'] and b['pressed']=='true' for b in s['buttons']),s
    press('Normal breath sounds');wait_visible('Stop Stethoscope')
    adjust_web_slider('Stethoscope volume',.55);capture('auscultation-lung')
    press('Stop Stethoscope');wait_visible('Place Stethoscope & Listen Live')
    return {'heartLungShortcuts':True,'listenPause':True,'bell':True,'backView':True,'xray':True,'volume':True,'speakerAudibility':'not tested'}


def pocus():
    open_skill('Ultrasound / POCUS')
    wait_visible('Synthetic ultrasound teaching scan',tries=30)
    capture('pocus-live')
    press('Freeze');wait_visible('Unfreeze');frozen=capture('pocus-frozen')
    time.sleep(2);held=state('pocus-held')
    assert frozen['scanHash'] is not None and held['scanHash']==frozen['scanHash'],(frozen,held)
    press('Unfreeze');wait_visible('Freeze');time.sleep(1)
    moving=state('pocus-moving');time.sleep(1);moved=state('pocus-moved')
    assert moving['scanHash'] is not None and moving['scanHash']!=moved['scanHash'],(moving,moved)
    press('M-Mode');capture('pocus-mmode')
    # Gain and depth are real accessibility ranges; no injected values.
    gain=adjust_web_slider('Ultrasound gain',.65);depth=adjust_web_slider('Ultrasound depth',.7)
    capture('pocus-adjusted');press('Reference scans');capture('pocus-reference')
    press('Case simulation');wait_visible('Synthetic ultrasound teaching scan')
    return {'freezeHoldsActualCanvas':True,'unfreezeChangesActualCanvas':True,'mModeButton':True,'gain':gain,'depth':depth,'referenceAndCaseSwitch':True}


def general():
    open_skill('General examination')
    wait_visible('Press shin',tries=30);capture('general-edema')
    press('Scleral icterus')
    labels = [b['text'] for b in state('general-icterus-initial')['buttons']]
    if 'Look straight' in labels:
        press('Look straight');wait_visible('Look down')
    press('Look down');wait_visible('Look straight')
    labels = [b['text'] for b in state('general-lids-initial')['buttons']]
    if 'Release upper lids' in labels:
        press('Release upper lids');wait_visible('Elevate upper lids')
    press('Elevate upper lids');wait_visible('Release upper lids');capture('general-icterus')
    press('Pallor & cyanosis');wait_visible('Estimated Hemoglobin:');capture('general-pallor')
    press('Ascites & thrill');press('Roll Patient to 45° Lateral Decubitus')
    wait_visible('Patient in 45° Lateral Tilt');capture('general-ascites-tilted')
    press('Patient in 45° Lateral Tilt');wait_visible('Roll Patient to 45° Lateral Decubitus')
    return {'fourTabs':True,'lookDown':True,'lidElevation':True,'lateralTiltAndReset':True,'edemaHoldAndGrades':'not tested'}


checks=[];failures=[]
for name,suite in [('eye',eye),('auscultation',auscultation),('pocus',pocus),('general',general)]:
    if os.environ.get('ORBIT_ADVANCED_SUITE') and name != os.environ['ORBIT_ADVANCED_SUITE']:
        continue
    try:checks.append({'suite':name,'passed':True,'details':suite()})
    except Exception as e:
        failures.append({'suite':name,'error':repr(e)})
        try:
            shot('advanced-android-failure-'+name)
            (OUT/('advanced-'+name+'-failure.xml')).write_text(ET.tostring(dump_ui(),encoding='unicode'))
        except Exception as capture_error:
            failures[-1]['captureError']=repr(capture_error)
        try:
            log=subprocess.run(['adb','logcat','-d','-s','AndroidRuntime:E','chromium:E','libc:F','*:S'],capture_output=True,text=True,timeout=15)
            (OUT/('advanced-'+name+'-device-errors.txt')).write_text(log.stdout[-100000:]+log.stderr)
        except Exception:pass
        try:state('advanced-'+name+'-failure')
        except Exception:pass
    finally:
        (OUT/'native-advanced-checks.json').write_text(json.dumps({'status':'NOT_CERTIFIED','checks':checks,'failures':failures},indent=2))
if failures:raise SystemExit(repr(failures))
