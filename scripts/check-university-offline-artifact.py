"""Fail closed unless both MUHS and RGUHS question packs are fully inside APK/AAB.

Use the same checksum-pinned manifest used by OrbitPgBank.readUniversityPack.
The generator must have fetched the source rows and generated these exact files
before Gradle. This check runs on the actual, not hypothetical, release output.
"""
import argparse
import glob
import hashlib
import json
import zipfile
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument("paths",nargs="+")
args=p.parse_args()
repo=Path(__file__).resolve().parents[1]
directory=repo/"mobile/android/app/src/main/assets/university"
manifest_path=directory/"manifest.json"
if not manifest_path.is_file():
    raise SystemExit("Missing generated university manifest; offline bank not built")
manifest=json.loads(manifest_path.read_text())
packs=manifest.get("packs",[])
counts=manifest.get("totals",{})
sources=manifest.get("sourceCounts",{})
if manifest.get("schema")!=1 or counts.get("rguhs",0)<10845 or counts.get("muhs",0)<4347:
    raise SystemExit("Missing MUHS/RGUHS offline inventory: "+str(counts))
for table,minimum in {
    "rguhs_question_candidates":10845,
    "muhs_pre_final_questions":2776,
    "muhs_final_year_questions":1571,
    "muhs_early_year_questions":2708,
}.items():
    if sources.get(table,0)<minimum:
        raise SystemExit("Offline source rows missing for "+table)
if sum(pack["count"] for pack in packs if pack["university"]=="rguhs")!=counts["rguhs"]:
    raise SystemExit("RGUHS manifest count inconsistent")
if sum(pack["count"] for pack in packs if pack["university"]=="muhs")!=counts["muhs"]:
    raise SystemExit("MUHS manifest count inconsistent")
expected={"manifest.json"}
for pack in packs:
    expected.add(pack["id"]+"-"+pack["sha256"][:12]+".zst")
    if pack["bytes"]>10000000:
        raise SystemExit("Oversized offline university pack "+pack["id"])
files=[Path(f) for pattern in args.paths for f in glob.glob(pattern,recursive=True)]
if not files:
    raise SystemExit("No built APK/AAB for offline university verification")
for archive_path in files:
    with zipfile.ZipFile(archive_path) as zipfile_:
        names=set(zipfile_.namelist())
        prefixes=("assets/university/","base/assets/university/")
        grouped={name[len(prefix):] for name in names for prefix in prefixes
                 if name.startswith(prefix) and not name.endswith("/")}
        missing=expected-grouped
        extras=grouped-expected
        if missing or extras:
            raise SystemExit(str(archive_path)+f": university packs absent={sorted(missing)[:6]}, unexpected={sorted(extras)[:6]}")
        def read(filename):
            for prefix in prefixes:
                if prefix+filename in names:
                    return zipfile_.read(prefix+filename)
            raise SystemExit(str(archive_path)+": missing "+filename)
        packaged=json.loads(read("manifest.json"))
        if packaged!=manifest:
            raise SystemExit(str(archive_path)+": embedded university manifest differs from build")
        for pack in packs:
            filename=pack["id"]+"-"+pack["sha256"][:12]+".zst"
            payload=read(filename)
            if len(payload)!=pack["bytes"] or hashlib.sha256(payload).hexdigest()!=pack["sha256"]:
                raise SystemExit(str(archive_path)+": corrupted university pack "+filename)
        print("PASS",archive_path,": MUHS",counts["muhs"],"RGUHS",counts["rguhs"],
              "offline source records across",len(packs),"sha256-checked packs")
