#!/usr/bin/env python3
"""Pull embedded JPEG (DCTDecode) page scans out of a PDF. Stdlib only."""
import re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pdftext import objects

src, outdir = sys.argv[1], sys.argv[2]
os.makedirs(outdir, exist_ok=True)
buf = open(src, 'rb').read()
n = 0
for oid, (head, stream) in sorted(objects(buf).items()):
    if stream is None or b'DCTDecode' not in head:
        continue
    data = stream.lstrip(b'\r\n')
    s = data.find(b'\xff\xd8\xff')
    if s < 0:
        continue
    e = data.rfind(b'\xff\xd9')
    data = data[s:e + 2] if e > s else data[s:]
    n += 1
    open(os.path.join(outdir, f'p{n:03d}_obj{oid}.jpg'), 'wb').write(data)
print(f'{n} JPEGs written to {outdir}')
