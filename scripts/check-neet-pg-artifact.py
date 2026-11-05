"""Verify both the bundled reviewed NEET-PG reader and the exact MedMCQA assets.

The legacy check rejected *all* assets/pg files, even though the reinstated
MedMCQA native reader requires generated assets/pg/*.zst. That prevented an
otherwise successfully compiled APK/AAB from passing release verification.

Validate the manifest, exact list of packages, their sizes and full SHA256,
and absence of unexpected legacy/unreviewed files instead. Never disable
the offline bank integrity gate merely to release the APK.
"""
import argparse
import glob
import hashlib
import json
from pathlib import Path
import zipfile

p = argparse.ArgumentParser()
p.add_argument("paths", nargs="+")
a = p.parse_args()

root = Path(__file__).resolve().parents[1]
manifest_path = root / "public/pg/manifest.json"
if not manifest_path.is_file():
    raise SystemExit("Generated MedMCQA manifest missing: run scripts/build-pg-compact.mjs")
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
if manifest.get("schema") != 2 or manifest.get("total", 0) <= 0 or not manifest.get("packs"):
    raise SystemExit("MedMCQA manifest missing a valid question inventory")
packs = manifest["packs"]
expected = {"manifest.json", "size.json", "LICENSE.txt", "NOTICE.txt"}
files_to_check = []
for pack in packs:
    filename = pack["id"] + "-" + pack["sha256"][:12] + ".zst"
    if filename in expected:
        raise SystemExit("Duplicate MedMCQA pack: " + filename)
    expected.add(filename)
    files_to_check.append((filename, pack))

files = [Path(name) for pattern in a.paths for name in glob.glob(pattern, recursive=True)]
if not files:
    raise SystemExit("No built APK/AAB found for offline-bank verification")

for file in files:
    with zipfile.ZipFile(file) as archive:
        names = archive.namelist()
        prefixes = ("assets/pg/", "base/assets/pg/")
        actual = {name[len(prefix):] for name in names for prefix in prefixes
                  if name.startswith(prefix) and not name.endswith("/")}
        missing = expected - actual
        unexpected = actual - expected
        if missing:
            raise SystemExit(f"{file}: {len(missing)} expected MedMCQA assets absent, first: {sorted(missing)[:5]}")
        if unexpected:
            raise SystemExit(f"{file}: unexpected PG assets (legacy/unreviewed?): {sorted(unexpected)[:5]}")

        def read_asset(name):
            for prefix in prefixes:
                path = prefix + name
                if path in names:
                    return archive.read(path)
            raise SystemExit(f"{file}: missing packaged asset {name}")

        packaged_manifest = json.loads(read_asset("manifest.json"))
        if packaged_manifest != manifest:
            raise SystemExit(f"{file}: packaged MedMCQA inventory does not match generated manifest")
        for filename, pack in files_to_check:
            payload = read_asset(filename)
            if len(payload) != pack["bytes"] or hashlib.sha256(payload).hexdigest() != pack["sha256"]:
                raise SystemExit(f"{file}: corrupted MedMCQA practice pack {filename}")

        bundles = [name for name in names if name.endswith("index.android.bundle")]
        if not bundles or not any(b"neet-pg-offline-20261019" in archive.read(name) for name in bundles):
            raise SystemExit("Reviewed NEET-PG offline bundle missing from " + str(file))
        print("PASS", file, ": reviewed NEET-PG reader plus",
              manifest["total"], "MedMCQA practice questions across",
              len(packs), "SHA256-verified packs; no unexpected PG assets")
