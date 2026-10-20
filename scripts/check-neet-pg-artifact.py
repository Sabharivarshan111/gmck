"""Verify the built Android payload, before any APK/AAB is published."""
import argparse
from pathlib import Path
import zipfile

p=argparse.ArgumentParser()
p.add_argument('paths', nargs='+')
a=p.parse_args()
found=[]
for pattern in a.paths:
    found.extend(Path('.').glob(pattern))
if not found:
    raise SystemExit('No built APK/AAB found for offline-bank verification')
for path in found:
    with zipfile.ZipFile(path) as archive:
        names=archive.namelist()
        legacy=[name for name in names if name.startswith(('assets/pg/','base/assets/pg/'))]
        if legacy:
            raise SystemExit('Retired question-bank assets remain in '+str(path))
        bundles=[name for name in names if name.endswith('index.android.bundle')]
        if not bundles or not any(b'neet-pg-offline-20261019' in archive.read(name) for name in bundles):
            raise SystemExit('Replacement bank missing from '+str(path))
        print('PASS',path,': replacement bundled, retired PG assets absent')
