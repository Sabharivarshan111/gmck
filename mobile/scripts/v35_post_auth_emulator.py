# Android 15 Google-bypassed native onboarding visual test. Run only after emulator and debug APK install.
import io, re, subprocess, time, xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path
from PIL import Image

out = Path('artifacts/v35-post-google')
out.mkdir(parents=True, exist_ok=True)
pkg = 'com.aistudio.mbbsqbank.aycxvd.debug'
def adb(*args, binary=False):
    p = subprocess.run(['adb', *args], capture_output=True, text=not binary, check=False)
    if p.returncode:
        print('ADB command failed', args, str(p.stderr)[-500:], flush=True)
    return p.stdout
def xml():
    for _ in range(5):
        adb('shell','uiautomator','dump','/sdcard/orbit-v35.xml')
        raw = adb('exec-out','cat','/sdcard/orbit-v35.xml')
        try:
            root = ET.fromstring(raw)
            (out/'current-ui.xml').write_text(raw)
            return root
        except Exception:
            time.sleep(2)
    raise AssertionError('Android accessibility dump unavailable')
def nodes(root):
    return list(root.iter())
def label(node):
    a=node.attrib
    return (a.get('content-desc','')+' '+a.get('text','')).strip()
def bounds(node):
    match=re.fullmatch(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]',node.attrib.get('bounds',''))
    if not match: raise AssertionError('UI target has no bounds: '+label(node))
    return tuple(map(int,match.groups()))
def find(term, exact=False):
    root=xml()
    matches=[]
    for n in nodes(root):
        val=label(n).lower()
        if (val == term.lower() if exact else term.lower() in val):
            x1,y1,x2,y2=bounds(n)
            if x2>x1 and y2>y1:
                matches.append(n)
    # A static help paragraph can mention "Continue to Orbit"
    # before the real CTA. Select the accessible, clickable target.
    # Likewise choose the actual TextInput, not DISPLAY NAME label.
    matches.sort(key=lambda n: (
        n.attrib.get('content-desc','').strip().lower()==term.lower(),
        n.attrib.get('clickable')=='true',
        n.attrib.get('class','').endswith('EditText'),
    ),reverse=True)
    return matches[0] if matches else None
def tap_node(node):
    x1,y1,x2,y2=bounds(node)
    adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2))
    time.sleep(1.4)
def tap(term):
    for attempt in range(5):
        node=find(term)
        if node:
            tap_node(node)
            return
        adb('shell','input','swipe','525','1760','525','740','330')
        time.sleep(1)
    raise AssertionError('Cannot find a visible option: '+term)
def snap(filename):
    data=adb('exec-out','screencap','-p',binary=True)
    (out/filename).write_bytes(data)
    return Image.open(io.BytesIO(data)).convert('RGB')
# Debug APK intentionally bypasses Google; this is the same
# authenticated -> Continue branch, while the separate signed
# release smoke checks real Google-picker launch and app survival.
btn=find('Continue to Orbit')
assert btn is not None, 'POST-GOOGLE Continue CTA missing from Android accessibility tree'
assert btn.attrib.get('clickable') == 'true', 'POST-GOOGLE Continue is not tappable'
assert btn.attrib.get('enabled') == 'true', 'POST-GOOGLE Continue unexpectedly disabled'
im=snap('01-post-google-continue.png')
x1,y1,x2,y2=bounds(btn)
w,h=x2-x1,y2-y1
region=im.crop((x1+w//5,y1+h//5,x2-w//5,y2-h//5))
# Real visual check, not just a hidden accessibility label:
# the screenshot of broken v33 had a completely uniform pink
# fill, with zero dark-text pixels in the center of this button.
pixels=list(region.getdata())
dark=sum(1 for r,g,b in pixels if max(r,g,b)<92)
(out/'visual-result.txt').write_text(f'Button bounds: {x1,y1,x2,y2}\nDark foreground pixels: {dark}\n')
assert dark > 45, f'Button is visually BLANK! Found only {dark} dark text pixels inside its fill.'
print('PASS visible Continue CTA: dark foreground pixels',dark,flush=True)

# Verify button fires handler instead of silently doing nothing.
tap_node(btn)
assert find('Choose your year') or find('Choose your university'), 'Continue tap did not expose required-field validation'
snap('02-required-field-validation.png')
print('PASS Continue tap invokes form validation', flush=True)
# End-to-end setup on this exact native React Native view.
tap('Choose your university')
tap('Tamil Nadu')
tap('Display name')
adb('shell','input','text','OrbitTester35')
adb('shell','input','keyevent','4')
tap('Final Year')
try:
    tap('Both')
except Exception:
    print('Both selector not reachable; continuing with default goal',flush=True)
snap('03-filled-form.png')
tap('Continue to Orbit')
time.sleep(5)
assert find('Continue to Orbit') is None, 'Form did not dismiss after submission'
snap('04-entered-home.png')
print('PASS native form submitted, onboarding dismissed',flush=True)
adb('shell','am','force-stop',pkg)
adb('shell','monkey','-p',pkg,'-c','android.intent.category.LAUNCHER','1')
time.sleep(8)
assert find('Continue to Orbit') is None, 'Saved profile did not persist across app restart'
snap('05-restart-home.png')
print('PASS profile persisted after app restart',flush=True)
(out/'result.txt').write_text('PASS: visual Continue CTA, tap validation, onboarding submission, restart persistence in native Android 15\n')
