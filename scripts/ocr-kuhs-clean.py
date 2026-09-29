#!/usr/bin/env python3
"""Re-OCR scanned Decipher pages after removing long table rules.

Writes source-page left/right transcripts for review, never app content.
Usage: python3 scripts/ocr-kuhs-clean.py PDF OUTPUT_DIR [--jobs 4]
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import os
from pathlib import Path
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageOps


def page_count(pdf):
    result = subprocess.run(['pdfinfo', str(pdf)], check=True, capture_output=True, text=True)
    return int(next(line.split(':', 1)[1] for line in result.stdout.splitlines() if line.startswith('Pages:')))


def clean_half(image):
    data = np.asarray(ImageOps.autocontrast(image.convert('L'))).copy()
    dark = data < 110
    height, width = dark.shape
    for y in np.flatnonzero(dark.sum(axis=1) > width * .65):
        data[max(0, y - 1):min(height, y + 2), :] = 255
    for x in np.flatnonzero(dark.sum(axis=0) > height * .65):
        data[:, max(0, x - 1):min(width, x + 2)] = 255
    return Image.fromarray(data)


def process_page(pdf, destination, page):
    with tempfile.TemporaryDirectory(prefix='kuhs-page-') as temp:
        prefix = Path(temp) / 'page'
        subprocess.run(['pdftoppm', '-f', str(page), '-l', str(page), '-scale-to', '2400',
                        '-singlefile', '-png', str(pdf), str(prefix)],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        with Image.open(prefix.with_suffix('.png')) as image:
            width, height = image.size
            for name, half in (('left', image.crop((0, 0, width // 2 + 16, height))),
                               ('right', image.crop((width // 2 - 16, 0, width, height)))):
                path = Path(temp) / f'{name}.png'
                clean_half(half).save(path)
                ocr = subprocess.run(['tesseract', str(path), 'stdout', '--psm', '6'],
                                     check=True, capture_output=True, text=True,
                                     env=dict(os.environ, OMP_THREAD_LIMIT='1'))
                (destination / f'{page:04d}-{name}.txt').write_text(ocr.stdout)
    return page


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf', type=Path)
    parser.add_argument('destination', type=Path)
    parser.add_argument('--jobs', type=int, default=4)
    args = parser.parse_args()
    args.destination.mkdir(parents=True, exist_ok=True)
    pages = page_count(args.pdf)
    pending = [n for n in range(1, pages + 1) if not all(
        (args.destination / f'{n:04d}-{half}.txt').exists() for half in ('left', 'right'))]
    print(f'{args.pdf.name}: {pages} PDF pages, {len(pending)} pending', flush=True)
    with ThreadPoolExecutor(max_workers=args.jobs) as workers:
        futures = {workers.submit(process_page, args.pdf, args.destination, n): n for n in pending}
        for completed, future in enumerate(as_completed(futures), 1):
            page = future.result()
            if completed % 20 == 0 or completed == len(pending):
                print(f'{args.pdf.name}: {completed}/{len(pending)} (latest {page})', flush=True)


if __name__ == '__main__':
    main()
