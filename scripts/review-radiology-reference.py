"""Review exact acquired reference pixels, without inventing medical images."""
import base64, gzip, io, json, re
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

# Review callout endpoints on exact pixels. This is a source figure, not an Android screenshot.
labels=json.loads(re.search(r"export const MRI_REFERENCE_LABELS[^=]*= ([^\n]+);",Path("mobile/src/simulator/radiologyAnnotations.ts").read_text()).group(1))
for plane,slice in frames:
 original=Image.open(out/f"mri-{plane}-{slice}.png").convert("RGB")
 image=original.crop((14,42,526,original.height-14))
 canvas=Image.new("RGB",(872,image.height+80),"#050a12");canvas.paste(image,(180,55));draw=ImageDraw.Draw(canvas)
 draw.text((20,16),f"Source slice annotation review | {plane} {slice} | not a device screenshot",fill="#e1e6ed")
 items=labels.get(f"{plane}:{slice}",[])
 for left in (True,False):
  side=sorted([p for p in items if (p["x"]<.5)==left],key=lambda p:p["y"])
  previous=40
  for p in side:
   px=180+p["x"]*512;py=55+p["y"]*image.height
   ly=max(previous+45,min(canvas.height-36,py));previous=ly
   edge=160 if left else 710;tx=18 if left else 718
   draw.line([(edge,ly),(edge+10 if left else edge-10,ly),(px,py)],fill="#ced4da",width=1)
   draw.ellipse((px-3,py-3,px+3,py+3),fill="#edf1f5",outline="#050a12")
   words=p["name"].split();lines=[];line=""
   for word in words:
    if len(line+" "+word)>21 and line:lines.append(line);line=word
    else:line=(line+" "+word).strip()
   if line:lines.append(line)
   draw.multiline_text((tx,ly-7), "\n".join(lines),fill="#e1e6ed",spacing=2)
 filename=out/f"annotated-{plane}-{slice}.png";canvas.save(filename)
 print(f"REVIEW_IMAGE_BEGIN {filename.name}",flush=True);print(base64.b64encode(filename.read_bytes()).decode(),flush=True);print("REVIEW_IMAGE_END",flush=True)
