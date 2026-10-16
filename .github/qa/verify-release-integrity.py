from pathlib import Path
import zipfile,json,hashlib
cfg=json.loads(Path('.github/qa/v27-publication.json').read_text()); files=[('debug','app-preview.apk','assets/simulator/'),('internal','app-internal.apk','assets/simulator/'),('release','app-release.apk','assets/simulator/'),('aab','app-release.aab','base/assets/simulator/')]; baseline=None;out={'source':cfg['source'],'files':{}}
for folder,name,prefix in files:
 p=Path('build')/folder/name;b=p.read_bytes();digest=hashlib.sha256(b).hexdigest();assert digest==cfg['expectedHashes'][name],name+' digest changed'
 with zipfile.ZipFile(p) as z:renderer={n[len(prefix):]:z.read(n) for n in z.namelist() if n.startswith(prefix) and not n.endswith('/')}
 assert len(renderer)==20,(name,len(renderer))
 if baseline is None:baseline=renderer
 else:assert renderer==baseline,name+' packaged renderer differs'
 pins=json.loads(renderer['asset-manifest.json']);assert len(pins)==110
 for path,pin in pins.items():
  data=(Path('public')/path.lstrip('/')).read_bytes();assert len(data)==pin['bytes'] and hashlib.sha256(data).hexdigest()==pin['sha256'],path
 out['files'][name]={'bytes':len(b),'sha256':digest,'rendererFiles':20,'pinnedSourceAssets':110}
Path('release-assets/build-integrity.json').write_text(json.dumps(out,indent=2));print(json.dumps(out))
