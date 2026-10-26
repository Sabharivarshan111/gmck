"""Assert every reviewed offline question identity survives actual emitted web/Android payloads."""
import argparse, glob, hashlib, json, re, zipfile
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument('paths',nargs='+')
a=p.parse_args()
repo=Path(__file__).resolve().parents[1]
source=(repo/'src/data/universityPapers/reviewedBatch01.ts').read_text()
match=re.search(r'REVIEWED_UNIVERSITY_QUESTIONS\s*=\s*(\[.*\])\s+satisfies',source,re.S)
assert match,'Reviewed payload must remain inspectable'
rows=json.loads(match[1]);ids={r['id'] for r in rows}
assert len(rows)==len(ids) and rows
files=[Path(f) for pattern in a.paths for f in glob.glob(pattern,recursive=True)]
assert files,'No emitted artifact found'
combined=bytearray()
for file in files:
    if zipfile.is_zipfile(file):
        with zipfile.ZipFile(file) as z:
            names=[n for n in z.namelist() if n.endswith('index.android.bundle')]
            assert names,'No Android offline bundle in '+str(file)
            data=b'\n'.join(z.read(n) for n in names)
        missing=[identity for identity in ids if identity.encode() not in data]
        assert not missing,f'{file}: {len(missing)} reviewed questions absent'
        print('PASS',file,':',len(ids),'reviewed identities in actual packaged bundle; artifact SHA256',hashlib.sha256(file.read_bytes()).hexdigest())
    else:
        combined.extend(file.read_bytes());combined.extend(b'\n')
if combined:
    missing=[identity for identity in ids if identity.encode() not in combined]
    assert not missing,f'Emitted JavaScript: {len(missing)} reviewed identities absent'
    print('PASS emitted JavaScript:',len(ids),'reviewed question identities retained')
