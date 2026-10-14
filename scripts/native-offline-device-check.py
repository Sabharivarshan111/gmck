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
def dismiss_launcher_anr(root):
 nodes=list(root.iter('node'));visible=[n.get('text') or '' for n in nodes]
 if "Pixel Launcher isn't responding" not in visible:return False
 for n in nodes:
  if n.get('text')=='Close app':
   x1,y1,x2,y2=map(int,re.findall(r'\d+',n.get('bounds')))
   adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(2)
   adb('shell','am','start','-n',package+'/com.aistudio.mbbsqbank.aycxvd.MainActivity');time.sleep(5);return True
 return False
def swipe(up=True):
 x=360;start,end=(1280,560) if up else (450,1350)
 adb('shell','input','swipe',str(x),str(start),str(x),str(end),'400')
def tap(label,scroll=False,timeout=40):
 end=time.time()+timeout
 while time.time()<end:
  root=dump()
  if dismiss_launcher_anr(root):continue
  for n in root.iter('node'):
   text=n.get('content-desc') or n.get('text') or ''
   if text==label:
    x1,y1,x2,y2=map(int,re.findall(r'\d+',n.get('bounds')))
    if x2>x1 and y2>y1 and n.get('enabled')!='false' and n.get('clickable')=='true':
     adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(.6);return
  if scroll:swipe()
  time.sleep(.6)
 raise AssertionError('Android control missing: '+label+'; '+str(labels()))
def shot(name):
 (out/(name+'.png')).write_bytes(adb('exec-out','screencap','-p'))
 (out/(name+'.xml')).write_bytes(adb('shell','cat','/sdcard/orbit-ui.xml'))
 text=' '.join(labels())
 assert 'Offline 3D could not load' not in text,text
 assert 'Something went wrong' not in text,text
# Render a representative 360dp viewport without the Pixel 6's costly full resolution.
adb('shell','wm','size','720x1600');adb('shell','wm','density','320')
adb('logcat','-c')
adb('shell','svc','wifi','disable');adb('shell','svc','data','disable')
adb('shell','settings','put','global','airplane_mode_on','1')
adb('shell','am','force-stop',package)
adb('shell','am','start','-n',package+'/com.aistudio.mbbsqbank.aycxvd.MainActivity')
time.sleep(15)
try:
 root=dump()
 if dismiss_launcher_anr(root):root=dump()
 visible=[n.get('content-desc') or n.get('text') or '' for n in root.iter('node')]
 if 'Set up your studies' in visible:
  assert 'Google Sign-In Required' not in visible, 'Offline preview incorrectly requires Google sign-in'
  tap('Display name');adb('shell','input','text','OfflinePreview');adb('shell','input','keyevent','4')
  tap('1st Year',scroll=True)
  tap('Tamil Nadu Dr. M.G.R. Medical University (TNMGR)',scroll=True)
  tap('Start studying',scroll=True);time.sleep(2)
  visible=labels()
 if 'Skip the walkthrough' in visible:tap('Skip the walkthrough');tap('Close the walkthrough')
 tap('Vault');tap('Simulator & Anatomy',scroll=True)
 assert any('Offline native studio' in l for l in labels()),labels()
 shot('skills-offline')
 tap('12-lead ECG · captured teaching trace',scroll=True);tap('Wave segments',scroll=True);tap('ST Segment',scroll=True);shot('ecg12-native');tap('Close diagnostic view')
 tap('Pupil & cranial nerve examination',scroll=True);tap('CN III palsy · pupil involved',scroll=True);tap('Light · left',scroll=True)
 swipe(False);time.sleep(.5);shot('pupil-native');tap('Close diagnostic view')
 tap('Auscultation · heart & lung sounds',scroll=True);tap('Play reference sound',scroll=True);time.sleep(3)
 assert any('Playing local synthetic reference.' in l for l in labels()),labels()
 shot('audio-native');tap('Stop listening',scroll=True);tap('Close diagnostic view')
 tap('X-ray & MRI · annotated references',scroll=True);tap('Brain MRI',scroll=True);time.sleep(3);shot('mri-native');tap('Close diagnostic view')
 tap('Ultrasound teaching view',scroll=True);tap('Play ultrasound',scroll=True);time.sleep(2);tap('Freeze ultrasound',scroll=True);shot('pocus-native');tap('Play archived ultrasound loop',scroll=True);time.sleep(3)
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
 (out/'logcat.txt').write_bytes(adb('logcat','-d'))
 (out/'activities.txt').write_bytes(adb('shell','dumpsys','activity','activities'))
 (out/'failure-or-final.png').write_bytes(adb('exec-out','screencap','-p'))
 (out/'final-ui.xml').write_bytes(adb('shell','cat','/sdcard/orbit-ui.xml'))
