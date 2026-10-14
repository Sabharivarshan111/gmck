"""Verify packaged native simulator/PG assets in APKs and AABs before publishing."""
import argparse, gzip, hashlib, json, zipfile
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument("directory")
parser.add_argument("--source-commit",required=True)
args=parser.parse_args()
files=sorted(p for p in Path(args.directory).glob("*") if p.suffix in (".apk",".aab"))
assert files, "No Android build output: "+args.directory
for file in files:
    prefix="base/assets/" if file.suffix==".aab" else "assets/"
    with zipfile.ZipFile(file) as z:
        names=set(z.namelist())
        for name in ["index.android.bundle","simulator/models/atlas.mesh.pack","simulator/radiology/brain-t1.pack","pg/manifest.json","simulator/auscultation/manifest.json","simulator/pocus/plax.mp4","simulator/pocus/subcostal.mp4"]:
            assert prefix+name in names, "Missing offline asset: "+name
        pg=json.loads(z.read(prefix+"pg/manifest.json"))
        assert pg["packs"] and sum(p["count"] for p in pg["packs"])==pg["total"]
        for pack in pg["packs"]:
            data=z.read(prefix+"pg/"+pack["id"]+"-"+pack["sha256"][:12]+".zst")
            assert len(data)==pack["bytes"] and hashlib.sha256(data).hexdigest()==pack["sha256"], "Corrupt PG pack: "+pack["id"]
        mri=json.loads(z.read(prefix+"simulator/radiology/brain-t1.json"))
        volume=gzip.decompress(z.read(prefix+"simulator/radiology/brain-t1.pack"))
        assert hashlib.sha256(volume).hexdigest()==mri["volumeSha256"], "Corrupt MRI volume"
        sound=json.loads(z.read(prefix+"simulator/auscultation/manifest.json"))
        assert len(sound["clips"])==212
        for clip in sound["clips"]:
            item=prefix+"simulator/auscultation/"+clip["file"]
            data=z.read(item)
            assert len(data)==clip["bytes"] and hashlib.sha256(data).hexdigest()==clip["sha256"], "Corrupt sound: "+item
            if file.suffix==".apk":
                assert z.getinfo(item).compress_type==zipfile.ZIP_STORED, "Audio asset FD requires uncompressed APK entry: "+item
        report={"file":file.name,"bytes":file.stat().st_size,"MB":file.stat().st_size/1000000,"sha256":hashlib.sha256(file.read_bytes()).hexdigest(),"sourceCommit":args.source_commit,"pgPacks":len(pg["packs"]),"pgQuestions":pg["total"],"audioClips":len(sound["clips"]),"offlineAssetBytes":sum(i.file_size for i in z.infolist() if i.filename.startswith((prefix+"pg/",prefix+"simulator/")))}
    file.with_suffix(file.suffix+".json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report))
