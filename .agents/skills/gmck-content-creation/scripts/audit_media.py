#!/usr/bin/env python3
"""Probe and completely decode one export; does not certify aesthetics/semantics."""
import argparse,json,math,re,subprocess
from fractions import Fraction
from pathlib import Path

def inspect(path,width=None,height=None,fps=None,duration=None,decode=True,allow_no_audio=False):
    result={'file':str(path),'checks':{},'errors':[]}
    try:
        proc=subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)],capture_output=True,text=True)
        if proc.returncode:raise ValueError(proc.stderr.strip() or 'ffprobe failed')
        data=json.loads(proc.stdout);streams=data.get('streams',[])
        video=next((s for s in streams if s.get('codec_type')=='video'),None)
        audio=next((s for s in streams if s.get('codec_type')=='audio'),None)
        if video is None:raise ValueError('Missing video stream')
        w,h=video['width'],video['height'];rotation=0
        for side in video.get('side_data_list',[]):rotation=float(side.get('rotation',rotation))
        rotation=float(video.get('tags',{}).get('rotate',rotation))
        if round(abs(rotation))%180==90:w,h=h,w
        rate=float(Fraction(video.get('avg_frame_rate') or video['r_frame_rate']))
        dur=float(data['format']['duration'])
        if not math.isfinite(dur) or dur<=0:raise ValueError('Invalid duration')
        result['metadata']={'display_width':w,'display_height':h,'rotation':rotation,'fps':rate,'duration':dur,'has_audio':audio is not None}
        tests={'width':width is None or w==width,'height':height is None or h==height,'fps':fps is None or abs(rate-fps)<.02,'duration':duration is None or abs(dur-duration)<.10,'audio_present':allow_no_audio or audio is not None}
        if audio and audio.get('duration') not in (None,'N/A'):
            tests['audio_tail']=abs(float(audio['duration'])-dur)<.15
        result['checks'].update(tests)
        result['errors'] += [k+' mismatch' for k,v in tests.items() if not v]
        if decode:
            cmd=['ffmpeg','-hide_banner','-nostats','-loglevel','info','-threads','1','-i',str(path),'-map','0:v:0','-map','0:a:0?','-vf','blackdetect=d=0.04:pix_th=0.02']
            if audio:cmd+=['-af','ebur128=peak=true']
            cmd+=['-f','null','-']
            run=subprocess.run(cmd,capture_output=True,text=True)
            bad=[line for line in run.stderr.splitlines() if re.search(r'error while decoding|invalid data found|corrupt decoded|error submitting|black_start:',line,re.I)]
            result['checks']['complete_decode']=run.returncode==0 and not bad
            if run.returncode or bad:result['errors']+=bad or ['decode failed: '+run.stderr[-800:]]
            summary=run.stderr[run.stderr.rfind('Summary:'):] if 'Summary:' in run.stderr else ''
            result['loudness_summary']=summary.strip()
    except (OSError,ValueError,KeyError,ZeroDivisionError) as e:
        result['errors'].append(str(e))
    result['passed']=not result['errors']
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('video',type=Path)
    p.add_argument('--width',type=int);p.add_argument('--height',type=int);p.add_argument('--fps',type=float);p.add_argument('--duration',type=float);p.add_argument('--out',type=Path);p.add_argument('--probe-only',action='store_true');p.add_argument('--allow-no-audio',action='store_true')
    a=p.parse_args();r=inspect(a.video,a.width,a.height,a.fps,a.duration,not a.probe_only,a.allow_no_audio)
    text=json.dumps(r,indent=2,ensure_ascii=False)
    if a.out:a.out.write_text(text+'\n')
    print(text);raise SystemExit(0 if r['passed'] else 1)
