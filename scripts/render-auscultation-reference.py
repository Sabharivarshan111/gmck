"""Render licensed reference views from the registered chest asset.
Requires numpy, trimesh, pyrender and Pillow; uses EGL offscreen rendering.
Run build-auscultation-thorax.py first. These are source-model renders, not drawings.
"""
import os
os.environ['PYOPENGL_PLATFORM']='egl'
import io,gzip,trimesh,pyrender,numpy as np
from PIL import Image
body=trimesh.load(io.BytesIO(gzip.decompress(open('public/models/auscultation_thorax_bp3d.glb.gz','rb').read())),file_type='glb')
lung=trimesh.load('public/models/lungs_candidate_zanatomy_full.glb')
renderer=pyrender.OffscreenRenderer(720,800)
for back in [False,True]:
 for xray in [False,True]:
  scene=pyrender.Scene(bg_color=[.045,.08,.145,1],ambient_light=[.12,.12,.12])
  for name,mesh in body.geometry.items():
   if name=='muscular' or not xray and name!='integumentary':continue
   color=mesh.visual.material.baseColorFactor.copy().astype(float)/255
   opacity=.08 if name=='integumentary' and xray else 1
   color[3]=opacity
   mat=pyrender.MetallicRoughnessMaterial(baseColorFactor=color,metallicFactor=0,roughnessFactor=.65,alphaMode='BLEND' if opacity<1 else 'OPAQUE',doubleSided=True)
   scene.add(pyrender.Mesh.from_trimesh(mesh,material=mat,smooth=True))
  if xray:
   for node in lung.graph.nodes_geometry:
    transform,geo=lung.graph[node]
    scene.add(pyrender.Mesh.from_trimesh(lung.geometry[geo],material=pyrender.MetallicRoughnessMaterial(baseColorFactor=[.75,.47,.49,.32],metallicFactor=0,roughnessFactor=.7,alphaMode='BLEND',doubleSided=True)),pose=transform)
  pose=np.eye(4);pose[:3,3]=[0,1.305,-2 if back else 2]
  if back:pose[:3,:3]=np.diag([-1,1,-1])
  scene.add(pyrender.OrthographicCamera(xmag=.255*.9,ymag=.255,znear=.01,zfar=5),pose=pose)
  lightpose=pose.copy(); lightpose[:3,3]=[-1,2,-3 if back else 3]
  direction=lightpose[:3,3]-np.array([0,1.3,0]);direction/=np.linalg.norm(direction)
  right=np.cross([0,1,0],direction);right/=np.linalg.norm(right)
  lightpose[:3,:3]=np.column_stack([right,np.cross(direction,right),direction])
  scene.add(pyrender.PointLight(color=[1.,1.,1.],intensity=35),pose=lightpose)
  color,depth=renderer.render(scene)
  filename=f'public/models/auscultation-{"back" if back else "front"}-{"xray" if xray else "surface"}.webp'
  Image.fromarray(color).save(filename,quality=90)
  print(filename, 'nonbackground pixels',int((depth>0).sum()))
renderer.delete()
