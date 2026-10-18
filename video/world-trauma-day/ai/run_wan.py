#!/usr/bin/env python3
"""Run official Wan2.2 TI2V-5B I2V for NON-COLLISION supplementary GMCK scenes."""
import argparse,json,pathlib,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
SCENES={
 "establish":("public/references/R01_Master_Road.jpg","Static high elevated camera of the SAME straight empty Tamil Nadu highway with coconut palms, green-roof tea stall, yellow pole, dry two-lane asphalt. Natural palm motion, overcast sunset. No vehicles appear, no camera teleport or new road."),
 "rescue":("public/references/Rescue_Reference.jpg","Wide shot of Indian paramedics coordinating mass casualty triage at the EXACT SAME location as the reference photo. Original wreckage remains stationary. No added or duplicated ambulances, no moving wrecks, no faces close-up, no graphic injuries, no changing road.")
}
p=argparse.ArgumentParser()
p.add_argument('--scene',required=True,choices=list(SCENES))
p.add_argument('--wan-root',type=pathlib.Path,default=ROOT/'.models/Wan2.2')
p.add_argument('--model-dir',type=pathlib.Path,default=ROOT/'.models/Wan2.2-TI2V-5B')
p.add_argument('--frames',type=int,default=193)
p.add_argument('--seed',type=int,default=42026)
p.add_argument('--dry-run',action='store_true')
a=p.parse_args()
if a.frames<5 or (a.frames-1)%4: p.error('Wan frame count must be 4n+1')
ref,prompt=SCENES[a.scene]
image=ROOT/ref
out=ROOT/'public'/'generated'/(a.scene+'.mp4')
cmd=[sys.executable,str((a.wan_root/'generate.py').resolve()),'--task','ti2v-5B','--size','1280*704','--ckpt_dir',str(a.model_dir.resolve()),'--offload_model','True','--convert_model_dtype','--t5_cpu','--image',str(image),'--prompt',prompt,'--base_seed',str(a.seed),'--frame_num',str(a.frames),'--save_file',str(out)]
print(json.dumps({'reference':ref,'scene':a.scene,'command':cmd},indent=2))
if not a.dry_run:
 if not image.exists(): p.error('Missing reference photo: '+str(image))
 if not (a.wan_root/'generate.py').exists(): p.error('Wan source missing: run bash ai/setup_wan.sh on CUDA machine')
 if not a.model_dir.is_dir(): p.error('Wan weights missing: run bash ai/setup_wan.sh on CUDA machine')
 try:
  x=subprocess.check_output(['nvidia-smi','--query-gpu=memory.total','--format=csv,noheader,nounits'],text=True)
  ram=max(int(q.strip()) for q in x.splitlines() if q.strip())
 except Exception: p.error('No CUDA GPU detected. GitHub repository storage alone does not run inference.')
 if ram<24500: p.error('Wan2.2 TI2V-5B requires a GPU with roughly 24GB VRAM or more')
 out.parent.mkdir(parents=True,exist_ok=True)
 subprocess.run(cmd,cwd=a.wan_root,check=True)
 if not out.exists() or out.stat().st_size==0: raise RuntimeError('Output missing after inference')
 print('SAVED',out)
