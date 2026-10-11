"""Experimental source-anatomy acoustic pipeline, intentionally NOT a production scan.
Run from any directory after installing scripts/pocus-physics-requirements.txt.
Uses source mesh sections, SIMUS channel RF simulation, quadrature demodulation,
delay-and-sum beamforming, coherent angle compounding and log compression.
No SVG organ drawing, reference photograph, generated image or cosmetic speckle.
BodyParts3D © Database Center for Life Science, CC BY 4.0.
PyMUST: Bernardino & Garcia, LGPL-2.1; doi:10.1109/uffc-js60046.2024.10793881.
See docs/pocus-source-physics-research-2026-10-11.md for limitations.
"""
import os,time,json,hashlib
os.environ['OPENBLAS_NUM_THREADS']='2'
import numpy as np,trimesh,pymust
from matplotlib.path import Path
from PIL import Image,ImageDraw
from scipy.ndimage import binary_dilation,binary_fill_holes
from pathlib import Path as FilePath
root=str(FilePath(__file__).resolve().parents[1])
import argparse
parser=argparse.ArgumentParser(description='Experimental BodyParts3D → SIMUS RF → DAS ultrasound proof')
parser.add_argument('--output',type=FilePath,default=FilePath('/tmp/orbit-pocus-physics'))
args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
W,H=384,384
x=np.linspace(-.13,.13,W);z=np.linspace(0,.22,H);xx,zz=np.meshgrid(x,z)
points=np.column_stack([xx.ravel(),zz.ravel()])
origin=np.array([-.06,1.16,.12]); masks={};boundaries=[]
import gzip
atlas=json.load(open(root+'/public/models/atlas.json'));cache={};source_parts=[]
for part in atlas['parts']:
 if not (part['name'].startswith('Hepatovenous segment') or part['name']=='Right kidney'): continue
 if part['chunk'] not in cache:
  cache[part['chunk']]=gzip.decompress(FilePath(root+'/public'+atlas['chunks'][part['chunk']]['gzip']).read_bytes())
 raw=cache[part['chunk']]
 vertices=np.frombuffer(raw,'<f4',part['vertexCount']*3,part['positions']).reshape(-1,3)
 faces=np.frombuffer(raw,'<u4',part['indexCount'],part['indices']).reshape(-1,3)
 m=trimesh.Trimesh(vertices,faces)
 sec=m.section(plane_origin=origin,plane_normal=[1,0,0])
 if sec is None:continue
 mask=np.zeros(H*W,dtype=bool)
 for poly in sec.discrete:
  coords=np.column_stack([origin[1]-poly[:,1],origin[2]-poly[:,2]])
  mask |= Path(coords).contains_points(points)
 masks[part['name']]=mask.reshape(H,W)
 source_parts.append({'id':part['id'],'name':part['name'],'watertight':m.is_watertight,'planePixels':int(mask.sum())})
amp=np.full((H,W),.035)
liver=np.zeros((H,W),bool);kidney=np.zeros((H,W),bool)
for k,m in masks.items():
 if k.startswith('Hepatovenous'):liver |= m
 if k=='Right kidney':kidney |= m
amp[liver]=.5; amp[kidney]=.3
# Acoustic boundary enhancement derives from the atlas mask, not drawn outlines.
from scipy.ndimage import binary_erosion
edge=(liver & ~binary_erosion(liver)) | (kidney & ~binary_erosion(kidney)); amp[edge]=1.0
print('SOURCE',source_parts,flush=True)
Image.fromarray((amp/amp.max()*255).astype('uint8')).save(args.output/'source-tissue.png')
rng=np.random.default_rng(2234);n=35000
xs=rng.uniform(x[0],x[-1],n);zs=rng.uniform(.005,.22,n)
ix=np.clip(np.searchsorted(x,xs),0,W-1);iz=np.clip(np.searchsorted(z,zs),0,H-1)
rc=rng.normal(0,1,n)*amp[iz,ix]

inside=(zs>.003)&(zs<.22)&(abs(xs)<zs*np.tan(np.deg2rad(55)))
xs,zs,rc=[v[inside] for v in [xs,zs,rc]]
p=pymust.getparam('P4-2v');p.Nelements=64;p.fs=4*p.fc;p.attenuation=.5
p.TXapodization=np.hanning(p.Nelements)
opts=pymust.utils.Options();opts.dBThresh=-50
start=time.time();print('SIMUS scatterers',len(xs),flush=True)
bIQ=np.zeros_like(xx,dtype=np.complex64)
for angle in [-20,0,20]:
 delays=pymust.txdelay(p,np.deg2rad(angle),np.deg2rad(80))
 rf,_=pymust.simus(xs,zs,rc,delays,p,opts);print('RF',angle,rf.shape,time.time()-start,flush=True)
 iq=pymust.rf2iq(rf,p.fs,p.fc)
 iq *= np.exp(np.arange(len(iq))[:,None]/p.fs*1540/2*100*p.fc/1e6*.5*np.log(10)/20)
 M=pymust.dasmtx(iq,xx,zz,delays,p)
 bIQ+=pymust.utils.applyDasMTX(M,iq,xx.shape)
 print('DAS',angle,time.time()-start,flush=True)
bmode=pymust.bmode(bIQ,55);bmode[abs(xx)>zz*np.tan(np.deg2rad(55))]=0
Image.fromarray(bmode).save(args.output/'beamformed-scan.png')
assert np.isfinite(rf).all() and np.isfinite(bIQ).all()
assert np.count_nonzero(liver)>1000 and np.count_nonzero(kidney)>1000
assert sum(p['planePixels']>0 for p in source_parts)>=5
manifest={'status':'experimental; not integrated into app','anatomy':{'source':'BodyParts3D 4.0','license':'CC BY 4.0','atlasSha256':hashlib.sha256(FilePath(root+'/public/models/atlas.json').read_bytes()).hexdigest(),'sourceParts':source_parts},'software':{'name':'PyMUST','version':'0.1.9','license':'LGPL-2.1','url':'https://github.com/creatis-ULTIM/PyMUST'},'probe':dict(p),'planeOriginMeters':origin.tolist(),'planeNormal':[1,0,0],'scatterers':len(xs),'seed':2234,'transmitAnglesDegrees':[-20,0,20],'divergingWaveWidthDegrees':80,'depthMeters':.22,'dynamicRangeDb':55,'outputPixels':[W,H],'assumptions':['Homogeneous sound speed; linear scattering; no refraction or nonlinear propagation','Tissue reflectivities and attenuation are teaching assumptions, not measured patient material properties','Source slice is a parasagittal abdominal section, not a clinically validated RUQ probe pose','No fluid pathology, cine, lung reverberation or Doppler model yet'],'rfLastTransmitShape':list(rf.shape),'seconds':time.time()-start}
# Param contains derived arrays; store JSON-compatible probe parameters.
manifest['probe']={k:(v.tolist() if isinstance(v,np.ndarray) else v) for k,v in manifest['probe'].items()}
(args.output/'manifest.json').write_text(json.dumps(manifest,indent=2,default=str))
np.savez_compressed(args.output/'beamformed-scan.npz',iq=bIQ,rf=rf,x=x,z=z)
print('DONE',time.time()-start,flush=True)
