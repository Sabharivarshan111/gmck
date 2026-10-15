"""Interact through actual Android UI; inspector reads state without modifying it."""
import os, json, re, subprocess, time, xml.etree.ElementTree as ET
from native_screenshot_driver import OUT, adb, tap, wait_visible, shot, dump_ui, scroll_to_tappable, find_nodes, visible, screen_size, reachable_nodes, launch, first_run
from native_diagnostic_controls import open_skill, adjust_slider

def edge_scroll(up=False):
    # Eye stage deliberately consumes drags (touch-action:none). Scroll in the
    # real outer 6px gutter, outside that examination target.
    w,h=screen_size();x=round(w*.5)
    adb("shell","input","swipe",str(x),str(round(h*(.30 if up else .74))),str(x),str(round(h*(.76 if up else .28))),"550")
    time.sleep(1)

webview_bounds = None


def reach_control(label):
    global webview_bounds
    if webview_bounds is None:
        for node,rect in reachable_nodes(dump_ui()):
            if node.get('class') == 'android.webkit.WebView':
                webview_bounds = rect
                break
    if webview_bounds is None:
        raise RuntimeError('Actual Android WebView bounds unavailable')
    tab_ids = {'Scleral icterus':'ward-tab-icterus','Pallor & cyanosis':'ward-tab-pallor','Ascites & thrill':'ward-tab-ascites'}
    for attempt in range(24):
        snapshot = state('control-target')
        controls = snapshot['controls']
        candidates = []
        for control in controls:
            text = control.get('text') or ''
            stripped = re.sub(r'^[^\w]+', '', text)
            if control.get('disabled'):
                continue
            if control.get('label') == label or text == label or stripped == label or control.get('testId') == tab_ids.get(label, '__none__'):
                candidates.append(control)
        if not candidates:
            edge_scroll(attempt < 4)
            continue
        control = candidates[0]
        rect = control['rect'];w,h=snapshot['viewport']
        cx,cy=rect['x']+rect['width']/2,rect['y']+rect['height']/2
        sx,sy=(webview_bounds[2]-webview_bounds[0])/w,(webview_bounds[3]-webview_bounds[1])/h
        if control['hit'] and 0<cx<w and 0<cy<h:
            return [round(webview_bounds[0]+rect['x']*sx),round(webview_bounds[1]+rect['y']*sy),round(webview_bounds[0]+(rect['x']+rect['width'])*sx),round(webview_bounds[1]+(rect['y']+rect['height'])*sy)]
        area=control.get('scroller') or {'x':0,'y':0,'width':w,'height':h}
        top=area['y']+20;bottom=min(h,area['y']+area['height'])-20
        up=cy<max(100,top+30)
        drag=area.get('down' if up else 'up')
        if drag:
            x,start,end=drag['x'],drag['start'],drag['end']
        else:
            x=area['x']+area['width']/2
            start,end=(top,bottom) if up else (bottom,top)
        adb('shell','input','swipe',str(round(webview_bounds[0]+x*sx)),str(round(webview_bounds[1]+start*sy)),str(round(webview_bounds[0]+x*sx)),str(round(webview_bounds[1]+end*sy)),'250')
        time.sleep(.5)
    raise RuntimeError('Actual advanced control remained occluded: '+label)


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
    path = OUT/(name+'-state.json')
    failures = []
    for attempt in range(4):
        try:
            subprocess.run(['node','mobile/scripts/read_android_advanced.mjs',str(path)],check=True,timeout=35)
            candidates = json.loads(path.read_text())['results']
            valid = [r for r in candidates if not r.get('error')]
            if valid:
                return valid[-1]
            failures.append(candidates)
        except (subprocess.SubprocessError, ValueError, OSError) as error:
            failures.append(str(error))
        time.sleep(.7)
    raise RuntimeError('Read-only Android inspector did not connect: '+json.dumps(failures))


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


def ready_thorax():
    for attempt in range(24):
        snapshot = state('thorax-ready')
        if snapshot['thorax']['ready']:
            return snapshot
        time.sleep(3)
    raise AssertionError('Actual 3D thorax did not become ready: '+json.dumps(snapshot))


def thorax_frame():
    import hashlib, io
    from PIL import Image
    for attempt in range(8):
        snapshot = state('thorax-frame-target')
        rect=snapshot['thorax']['rect'];width,height=snapshot['viewport']
        if rect and rect['y']>=75 and rect['y']+rect['height']<=height-130:
            break
        edge_scroll(True)
    else:
        raise RuntimeError('Actual 3D chest could not be brought fully into view')
    sx=(webview_bounds[2]-webview_bounds[0])/width
    sy=(webview_bounds[3]-webview_bounds[1])/height
    bounds=(round(webview_bounds[0]+rect['x']*sx),round(webview_bounds[1]+rect['y']*sy),round(webview_bounds[0]+(rect['x']+rect['width'])*sx),round(webview_bounds[1]+(rect['y']+rect['height'])*sy))
    raw=subprocess.check_output(['adb','exec-out','screencap','-p'])
    return hashlib.sha256(Image.open(io.BytesIO(raw)).crop(bounds).tobytes()).hexdigest()


def auscultation_case():
    launch();first_run();tap('Vault')
    scroll_to_tappable('Simulator & Anatomy');tap('Simulator & Anatomy')
    scroll_to_tappable('Practise a case');tap('Practise a case')
    scroll_to_tappable('Acute Inferior STEMI');tap('Acute Inferior STEMI')
    wait_visible('Patient Simulator')
    scroll_to_tappable('Open 🩺 Steth diagnostic tool');tap('Open 🩺 Steth diagnostic tool')
    wait_visible('Auscultation trainer',tries=30)
    snapshot = ready_thorax()
    assert snapshot['patient']['scenario']=='stemi',snapshot
    capture('auscultation-stemi-case-3d')
    press('View back');wait_visible('View front');capture('auscultation-stemi-case-back')
    press('Place Stethoscope & Listen Live');wait_visible('Stop Stethoscope')
    snapshot=state('auscultation-stemi-listening')
    if not any(b['text']=='X-ray view' and b['pressed']=='true' for b in snapshot['buttons']):
        press('X-ray view')
    baseline=[thorax_frame(),thorax_frame()]
    assert baseline[0]==baseline[1],baseline
    press('Show organ movement')
    moving=state('auscultation-stemi-moving')
    assert any(b['text'] in ['Show organ movement','Pause organ movement'] and b['pressed']=='true' for b in moving['buttons']),moving
    frames=[]
    for attempt in range(8):
        frames.append(thorax_frame());time.sleep(.12)
    (OUT/'actual-native-thorax-frame-hashes.json').write_text(json.dumps({'stationary':baseline,'moving':frames},indent=2))
    assert len(set(frames))>1,frames
    capture('auscultation-stemi-case-movement')
    return {'enteredFromActualNativePatientCase':True,'scenarioPreserved':'stemi','real3DModelReady':True,'backView':True,'actual3DFramesChangeWithMovement':True}


def auscultation():
    open_skill('Auscultation')
    wait_visible('Auscultation trainer',tries=30)
    ready_thorax()
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
for name,suite in [('eye',eye),('auscultation',auscultation),('auscultation-case',auscultation_case),('pocus',pocus),('general',general)]:
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
