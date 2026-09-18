"""Pull the page images out of a scanned PDF, without any dependency.

`extract-pdf-text.py` returns nothing useful for a CamScanner scan, because
there is no text layer in it — the pages are photographs. OCR would be the
obvious answer and it is not available in an agent sandbox: `tesseract`,
`poppler-utils`, `pypdf` and `pip` are all refused by the egress proxy.

So this takes the other route. A scanner embeds each page as a single image
XObject with the `/DCTDecode` filter, and **a DCTDecode stream is a JPEG file
byte for byte** — there is no transformation to undo. Writing the bytes between
`stream` and `endstream` to a `.jpg` therefore produces the page exactly as the
scanner saw it, and that image can be read by anything that reads images,
including a human or a vision model.

That is how `ortho_casesheets-1.pdf` was read: 22 pages out, transcribed by eye
into `ortho_casesheets-1.txt`, and turned into the six proformas in
`mobile/src/lib/proformas/orthopaedics.ts`.

It handles `/DCTDecode` (JPEG) and `/JPXDecode` (JPEG 2000). It does NOT handle
`/CCITTFaxDecode` or `/JBIG2Decode`, which are bilevel fax encodings used by
some scanners: those bytes are not a standalone file and would need a real
decoder wrapped in a TIFF container. If you hit one, the script says so rather
than writing a file nothing can open.

    python3 extract-page-images.py scan.pdf outdir/
"""
import pathlib
import re
import sys


FILTERS = {
    b'/DCTDecode': ('.jpg', b'\xff\xd8'),        # JPEG — SOI marker
    b'/JPXDecode': ('.jp2', None),               # JPEG 2000
}
UNSUPPORTED = (b'/CCITTFaxDecode', b'/JBIG2Decode')


def main(pdf_path: str, out_dir: str) -> int:
    data = pathlib.Path(pdf_path).read_bytes()
    out = pathlib.Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    written = 0
    skipped = []

    # Object header, then its dictionary, then the stream keyword. The
    # dictionary is bounded generously: an image XObject's dict is small, and
    # anything longer is not one.
    for match in re.finditer(rb'(\d+)\s+0\s+obj(.{0,2000}?)stream\r?\n', data, re.S):
        head = match.group(2)
        if b'/Image' not in head and b'Decode' not in head:
            continue

        filt = next((f for f in FILTERS if f in head), None)
        if filt is None:
            bad = next((f for f in UNSUPPORTED if f in head), None)
            if bad:
                skipped.append(bad.decode())
            continue

        start = match.end()
        end = data.find(b'endstream', start)
        if end == -1:
            continue
        blob = data[start:end].rstrip(b'\r\n')

        suffix, magic = FILTERS[filt]
        if magic and not blob.startswith(magic):
            continue

        written += 1
        name = out / f'page{written:02d}{suffix}'
        name.write_bytes(blob)

        width = re.search(rb'/Width\s+(\d+)', head)
        height = re.search(rb'/Height\s+(\d+)', head)
        size = f'{width.group(1).decode()}x{height.group(1).decode()}' if width and height else '?'
        print(f'{name.name}  {len(blob) // 1024:5d} KB  {size}')

    if skipped:
        kinds = ', '.join(sorted(set(skipped)))
        print(
            f'\n{len(skipped)} page(s) use {kinds}, which this script does not decode.\n'
            'Those are bilevel fax encodings: the stream is not a standalone file and\n'
            'needs a real decoder wrapped in a TIFF container.',
            file=sys.stderr,
        )

    print(f'\n{written} page image(s) written to {out}/')
    if written == 0:
        print(
            'Nothing extracted. If the PDF has a text layer, use '
            'extract-pdf-text.py instead.',
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    sys.exit(main(sys.argv[1], sys.argv[2]))
