#!/usr/bin/env python3
"""Prepare a resumable visual review batch; never mark OCR as verified.

Example: python3 scripts/prepare-kuhs-review-batch.py ../restored ../kuhs-page-batches --count 4
The manifest is a work queue. Only a human comparison with the PDF image can
add a question to verifiedQuestions/reviewedMore.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
import csv
import hashlib
import json
from pathlib import Path
import subprocess


SOURCES = {
    'first': ('Decipher 1st year(3).pdf', 86),
    'second': ('Decipher 2nd year.pdf', 149),
    'third': ('Decipher third year 2025(2).pdf', 95),
    'final': ('decipher final year mbbs 2026 (2)(2).pdf', 281),
}


def prepare(task):
    year, page, pdf, output, ocr = task
    folder = output / year
    folder.mkdir(parents=True, exist_ok=True)
    image = folder / f'{page:04d}.png'
    if not image.exists():
        subprocess.run(['pdftoppm', '-f', str(page), '-l', str(page),
                        '-scale-to', '2200', '-png', '-singlefile', str(pdf),
                        str(image.with_suffix(''))], check=True,
                       stdout=subprocess.DEVNULL)
    transcript = folder / f'{page:04d}.txt'
    if ocr and not transcript.exists():
        with transcript.open('w') as stream:
            subprocess.run(['tesseract', str(image), 'stdout', '--psm', '6'],
                           check=True, stdout=stream, stderr=subprocess.DEVNULL)
    digest = hashlib.sha256(image.read_bytes()).hexdigest()
    return {'year': year, 'pdf_page': page, 'image': str(image.resolve()),
            'image_sha256': digest, 'ocr': str(transcript.resolve()) if ocr else None,
            'status': 'pending_visual_review'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sources', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--coverage', type=Path,
                        default=Path(__file__).with_name('kuhs-page-coverage.tsv'))
    parser.add_argument('--count', type=int, default=4, help='pages per year')
    parser.add_argument('--mode', choices=('after-last', 'gaps'), default='gaps')
    parser.add_argument('--start', action='append', default=[], metavar='YEAR:PAGE',
                        help='override the next page for a year, e.g. --start first:43')
    parser.add_argument('--jobs', type=int, default=4)
    parser.add_argument('--ocr', action='store_true')
    args = parser.parse_args()
    if args.count < 1 or args.jobs < 1:
        parser.error('--count and --jobs must be positive')
    with args.coverage.open(newline='') as stream:
        coverage = list(csv.DictReader(stream, delimiter='\t'))
    if len(coverage) != sum(total for _, total in SOURCES.values()):
        raise SystemExit('coverage must contain all 611 PDF pages')
    starts = {}
    for item in args.start:
        try:
            year, page = item.split(':', 1)
            starts[year] = int(page)
            if year not in SOURCES or not 1 <= starts[year] <= SOURCES[year][1]:
                raise ValueError
        except ValueError:
            parser.error(f'invalid --start {item!r}; expected YEAR:PAGE in PDF range')
    tasks = []
    for year, (filename, total) in SOURCES.items():
        pdf = args.sources / filename
        if not pdf.is_file():
            raise SystemExit(f'missing source PDF: {pdf}')
        reviewed = {int(row['pdf_page']) for row in coverage
                    if row['year'] == year and int(row['hand_checked_questions']) > 0}
        start = starts.get(year, max(reviewed, default=0) + 1
                           if args.mode == 'after-last' else 1)
        pages = [page for page in range(start, total + 1) if page not in reviewed]
        if args.mode == 'after-last' and not pages:
            pages = [page for page in range(1, total + 1) if page not in reviewed]
        tasks.extend((year, page, pdf, args.output, args.ocr) for page in pages[:args.count])
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        entries = list(pool.map(prepare, tasks))
    args.output.mkdir(parents=True, exist_ok=True)
    manifest = args.output / 'pending-review.json'
    manifest.write_text(json.dumps(entries, indent=2) + '\n')
    print(f'{len(entries)} page images ready: {manifest}')
    for year in SOURCES:
        print(f'{year}: {[row["pdf_page"] for row in entries if row["year"] == year]}')


if __name__ == '__main__':
    main()
