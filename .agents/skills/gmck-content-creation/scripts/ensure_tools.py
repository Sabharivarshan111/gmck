#!/usr/bin/env python3
"""Prepare a project-local editing environment and test an actual A/V round trip.
Does not grant ChatGPT execution, network or plugin access. Writes JSON evidence.
"""
import argparse,importlib,json,os,shutil,subprocess,sys,tempfile,venv
from pathlib import Path
BASE={'PIL':'Pillow>=10,<13','numpy':'numpy>=1.26,<3','scipy':'scipy>=1.11,<2','cairosvg':'CairoSVG>=2.7,<3'}
ASR={'faster_whisper':'faster-whisper>=1.1,<2','socksio':'socksio>=1,<2'}
FACE={'cv2':'opencv-python>=4.8,<5','mediapipe':'mediapipe>=0.10,<0.11'}
def run(args,timeout=120):
    r=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
    if r.returncode:raise RuntimeError(r.stderr[-1600:] or r.stdout[-1600:] or 'Command failed')
    return r.stdout

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--project-dir',required=True,type=Path);p.add_argument('--install',action='store_true')
    p.add_argument('--asr',action='store_true');p.add_argument('--face',action='store_true')
    p.add_argument('--model',help='Optional faster-whisper model to download/load and test; e.g. tiny or small')
    p.add_argument('--_prepared',action='store_true',help=argparse.SUPPRESS)
    a=p.parse_args();project=a.project_dir.expanduser().resolve();project.mkdir(parents=True,exist_ok=True)
    required=dict(BASE)
    if a.asr or a.model:required.update(ASR)
    if a.face:required.update(FACE)
    if a.install and not a._prepared:
        envdir=project/'.gmck-tools-venv'
        py=envdir/('Scripts/python.exe' if os.name=='nt' else 'bin/python')
        if not py.exists():venv.EnvBuilder(with_pip=True,system_site_packages=True).create(envdir)
        # Probe inside the target interpreter, not the parent process.
        probe='import importlib.util,json;print(json.dumps([x for x in '+repr(list(required))+' if importlib.util.find_spec(x) is None]))'
        missing=json.loads(run([str(py),'-c',probe]))
        if missing:
            run([str(py),'-m','pip','install','--disable-pip-version-check',*[required[x] for x in missing]],timeout=600)
        os.execv(str(py),[str(py),str(Path(__file__).resolve()),*sys.argv[1:],'--_prepared'])
    report={'execution':True,'python':sys.executable,'project_dir':str(project),'libraries':{},'commands':{},'filters':{},'external_capabilities':'Assistant must separately verify browsing, asset downloads and file saving using currently exposed tools.','errors':[]}
    for name in required:
        try:importlib.import_module(name);report['libraries'][name]='ready'
        except Exception as e:report['libraries'][name]='unavailable';report['errors'].append(name+': '+str(e))
    for cmd in ['ffmpeg','ffprobe']:
        path=shutil.which(cmd);report['commands'][cmd]=path
        if not path:report['errors'].append('Missing system command: '+cmd)
    report['optional_commands']={x:shutil.which(x) for x in ['node','npm','git']}
    if not report['errors']:
        try:
            filters=run(['ffmpeg','-hide_banner','-filters'])
            import re
            for name in ['ass','loudnorm','afftdn','zoompan','overlay','ebur128','blackdetect']:
                ok=bool(re.search(r'^\s*\S+\s+'+name+r'\s',filters,re.M));report['filters'][name]=ok
                if not ok:report['errors'].append('Missing FFmpeg filter: '+name)
            with tempfile.TemporaryDirectory(prefix='gmck-preflight-',dir=project) as tmp:
                media=Path(tmp)/'roundtrip.mp4'
                run(['ffmpeg','-v','error','-y','-f','lavfi','-i','testsrc2=size=180x320:rate=30','-f','lavfi','-i','anullsrc=r=48000:cl=mono','-t','0.5','-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-c:a','aac',str(media)])
                info=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(media)]))
                if len(info['streams'])!=2 or abs(float(info['format']['duration'])-.5)>.1:raise RuntimeError('A/V roundtrip metadata mismatch')
                run(['ffmpeg','-v','error','-threads','1','-i',str(media),'-f','null','-'])
                report['av_roundtrip']='passed'
        except Exception as e:report['errors'].append('Render test: '+str(e))
    if a.model:
        try:
            import numpy as np
            from faster_whisper import WhisperModel
            m=WhisperModel(a.model,device='cpu',compute_type='int8',cpu_threads=2,download_root=str(project/'models'))
            segments,_=m.transcribe(np.zeros(16000,dtype=np.float32),language='ta',beam_size=1,vad_filter=False)
            list(segments)
            report['asr_model']={'name':a.model,'loaded_and_executed':True,'accuracy_checked':False}
        except Exception as e:report['errors'].append('ASR model: '+str(e))
    elif a.asr:
        report['asr_model']={'loaded_and_executed':False,'next_step':'Download/load a suitable multilingual model on the actual transcription task; package import alone does not prove model availability.'}
    report['ready']=not report['errors'];report['scope']='Core editing smoke test; optional face segmentation/browser engines need their own actual runtime checks before use.'
    (project/'tool-readiness.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2));return 0 if report['ready'] else 1
if __name__=='__main__':
    try:raise SystemExit(main())
    except (OSError,RuntimeError,subprocess.TimeoutExpired) as e:
        print(json.dumps({'ready':False,'error':str(e),'note':'Do not claim tool readiness after this setup failure.'},indent=2));raise SystemExit(1)
