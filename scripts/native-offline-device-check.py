"""Exercise the actual packaged Android app with networking disabled.
UIAutomator locates real accessibility labels; captured pixels are device output.
Includes the packaged ultrasound movies alongside the offline diagnostics.
"""
import base64, json, re, subprocess, time, xml.etree.ElementTree as ET
from pathlib import Path
out=Path('native-device-proof');out.mkdir(exist_ok=True)
package='com.aistudio.mbbsqbank.aycxvd.debug'
def adb(*args):return subprocess.check_output(['adb',*args])
def dump():
 adb('shell','uiautomator','dump','/sdcard/orbit-ui.xml')
 return ET.fromstring(adb('shell','cat','/sdcard/orbit-ui.xml').decode().lstrip())
def labels():return [(n.get('content-desc') or n.get('text') or '') for n in dump().iter('node')]
def tap(label,scroll=False,timeout=25):
 end=time.time()+timeout
 while time.time()<end:
  root=dump()
  for n in root.iter('node'):
   text=n.get('content-desc') or n.get('text') or ''
   if text==label:
    x1,y1,x2,y2=map(int,re.findall(r'\d+',n.get('bounds')))
    if x2>x1 and y2>y1:
     adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(.6);return
  if scroll:adb('shell','input','swipe','540','1500','540','650','350')
  time.sleep(.6)
 raise AssertionError('Android control missing: '+label+'; '+str(labels()))
def shot(name):
 (out/(name+'.png')).write_bytes(adb('exec-out','screencap','-p'))
 (out/(name+'.xml')).write_bytes(adb('shell','cat','/sdcard/orbit-ui.xml'))
 text=' '.join(labels())
 assert 'Offline 3D could not load' not in text,text
 assert 'Something went wrong' not in text,text
adb('shell','svc','wifi','disable');adb('shell','svc','data','disable')
adb('shell','settings','put','global','airplane_mode_on','1')
adb('shell','am','force-stop',package)
adb('shell','am','start','-n',package+'/com.aistudio.mbbsqbank.aycxvd.MainActivity')
time.sleep(15)
try:
 visible=labels()
 if 'Skip the walkthrough' in visible:tap('Skip the walkthrough');tap('Close the walkthrough')
 tap('Vault');tap('Simulator & Anatomy',scroll=True)
 assert any('Offline native studio' in l for l in labels()),labels()
 shot('skills-offline')
 tap('12-lead ECG · captured teaching trace',scroll=True);tap('ST Segment',scroll=True);shot('ecg12-native');tap('Close diagnostic view')
 tap('Pupil & cranial nerve examination',scroll=True);tap('CN III palsy · pupil involved',scroll=True);tap('Light · left',scroll=True)
 adb('shell','input','swipe','540','450','540','1600','500');time.sleep(.5);shot('pupil-native');tap('Close diagnostic view')
 tap('Auscultation · heart & lung sounds',scroll=True);tap('Play reference sound',scroll=True);time.sleep(3)
 assert any('Playing local synthetic reference.' in l for l in labels()),labels()
 shot('audio-native');tap('Stop listening',scroll=True);tap('Close diagnostic view')
 tap('X-ray & MRI · annotated references',scroll=True);tap('Brain MRI',scroll=True);time.sleep(3);shot('mri-native');tap('Close diagnostic view')
 tap('Ultrasound teaching view',scroll=True);tap('Play archived ultrasound loop',scroll=True);time.sleep(3)
 assert not any('local reference could not load' in l for l in labels()),labels()
 shot('pocus-reference-native');tap('Pause archived ultrasound loop',scroll=True);tap('Close diagnostic view')
 tap('3D');time.sleep(10);shot('body-native');tap('Open Heart & Great Vessels model',timeout=20);time.sleep(3);shot('heart-native')
 # Native app must remain foreground without a crash after all tools.
 activity=adb('shell','dumpsys','activity','activities').decode()
 assert package in activity,activity[-2000:]
 for name in ['heart-native','mri-native','pupil-native']:
  print('UI_IMAGE_BEGIN '+name);print(base64.b64encode((out/(name+'.png')).read_bytes()).decode());print('UI_IMAGE_END')
 print('Actual Android offline simulator: ECG, pupils, local media decoding/playback, MRI and heart focus exercised. Emulator pixels saved; physical hardware and clinical sound fidelity unverified.')
finally:
 (out/'logcat.txt').write_bytes(adb('logcat','-d','-t','1500'))
 (out/'final-ui.xml').write_bytes(adb('shell','cat','/sdcard/orbit-ui.xml'))
