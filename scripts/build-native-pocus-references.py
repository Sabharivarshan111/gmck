"""Encode the existing acquired loops for native Android's video decoder."""
from pathlib import Path
import hashlib,json,subprocess
folder=Path('public/clinical-reference/pocus')
records=[]
for name in ['plax','subcostal']:
 source=folder/(name+'.gif');poster=folder/(name+'-poster.jpg');movie=folder/(name+'.mp4')
 subprocess.run(['ffmpeg','-y','-v','error','-i',str(source),'-frames:v','1','-q:v','3',str(poster)],check=True)
 subprocess.run(['ffmpeg','-y','-v','error','-i',str(source),'-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-pix_fmt','yuv420p','-crf','24','-movflags','+faststart','-an',str(movie)],check=True)
 records.append({'source':source.name,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'poster':poster.name,'movie':movie.name,'movieSha256':hashlib.sha256(movie.read_bytes()).hexdigest(),'bytes':movie.stat().st_size+poster.stat().st_size})
(folder/'native-references.json').write_text(json.dumps({'schema':1,'method':'First-frame JPEG and H.264 MP4 derivatives of existing attributed GIF reference loops; native decoder compatibility only. Original source/licence metadata remains in PocusReference.tsx.','references':records},indent=2))
print(json.dumps({'references':len(records),'additionalBytes':sum(r['bytes'] for r in records)}))
