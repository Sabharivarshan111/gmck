"""Review exact acquired reference pixels, without inventing medical images."""
import base64, gzip, io, json
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
root=Path("public/clinical-reference/radiology")
out=Path("radiology-review");out.mkdir(exist_ok=True)
meta=json.loads((root/"brain-t1.json").read_text())
dims=meta["dimensions"];spacing=meta["spacing"];data=gzip.decompress((root/"brain-t1.pack").read_bytes())
assert len(data)==dims[0]*dims[1]*dims[2]
frames=[("axial",56),("axial",64),("axial",74),("coronal",64),("sagittal",56)]
axes={"axial":(0,1,2),"coronal":(0,2,1),"sagittal":(1,2,0)}
for plane,slice in frames:
 u,v,s=axes[plane];w,h=dims[u],dims[v];pixels=bytearray(w*h)
 for y in range(h):
  for x in range(w):
   p=[0,0,0];p[u]=w-1-x;p[v]=h-1-y;p[s]=slice
   pixels[x+w*y]=data[p[0]+dims[0]*(p[1]+dims[1]*p[2])]
 image=Image.frombytes("L",(w,h),bytes(pixels))
 ratio=w*spacing[u]/(h*spacing[v]);image=image.resize((512,round(512/ratio)))
 canvas=Image.new("RGB",(540,image.height+56),"black");canvas.paste(image,(14,42));ImageDraw.Draw(canvas).text((14,14),f"T1 RAS · radiological {plane} slice {slice} (zero based)",fill="white")
 filename=out/f"mri-{plane}-{slice}.png";canvas.save(filename)
 print(f"REVIEW_IMAGE_BEGIN {filename.name}",flush=True);print(base64.b64encode(filename.read_bytes()).decode(),flush=True);print("REVIEW_IMAGE_END",flush=True)
files=[root/"pa.jpg"]+sorted((root/"cases").glob("*.jpg"),key=lambda p:int(p.stem))
for group in range(0,len(files),6):
 canvas=Image.new("RGB",(900,1040),"#101318")
 for j,file in enumerate(files[group:group+6]):
  image=Image.open(file).convert("RGB");image=ImageOps.contain(image,(290,470))
  x=(j%3)*300+(300-image.width)//2;y=(j//3)*520+35
  canvas.paste(image,(x,y));ImageDraw.Draw(canvas).text(((j%3)*300+12,(j//3)*520+10),file.name,fill="white")
 filename=out/f"cxr-{group//6}.jpg";canvas.save(filename,quality=88)
 print(f"REVIEW_IMAGE_BEGIN {filename.name}",flush=True);print(base64.b64encode(filename.read_bytes()).decode(),flush=True);print("REVIEW_IMAGE_END",flush=True)
