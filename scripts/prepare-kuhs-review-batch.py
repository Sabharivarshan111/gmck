#!/usr/bin/env python3
"""Prepare a resumable visual review batch; never mark OCR as verified.

Example: python3 scripts/prepare-kuhs-review-batch.py ../restored ../kuhs-page-batches --total 50
The manifest is a work queue. Only a human comparison with the PDF image can
add a question to verifiedQuestions/reviewedMore.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import csv
import hashlib
import json
from pathlib import Path
import subprocess
from PIL import Image


SOURCES = {
    'first': ('Decipher 1st year(3).pdf', 86),
    'second': ('Decipher 2nd year.pdf', 149),
    'third': ('Decipher third year 2025(2).pdf', 95),
    'final': ('decipher final year mbbs 2026 (2)(2).pdf', 281),
}


def prepare(task):
    year, page, pdf, output, ocr, image_format = task
    folder = output / year
    folder.mkdir(parents=True, exist_ok=True)
    image = folder / f'{page:04d}.{image_format}'
    def readable():
        if not image.exists():
            return False
        try:
            with Image.open(image) as rendered:
                rendered.load()
            return True
        except (OSError, ValueError):
            return False

    if not readable():
        image.unlink(missing_ok=True)
        subprocess.run(['pdftoppm', '-f', str(page), '-l', str(page),
                        '-scale-to', '2200', '-jpeg' if image_format == 'jpg' else '-png', '-singlefile', str(pdf),
                        str(image.with_suffix(''))], check=True,
                       stdout=subprocess.DEVNULL)
        if not readable():
            raise RuntimeError(f'PDF page image is incomplete: {image}')
    transcript = folder / f'{page:04d}.txt'
    if ocr and (not transcript.exists() or not transcript.stat().st_size):
        temporary_transcript = transcript.with_suffix('.txt.tmp')
        with temporary_transcript.open('w') as stream:
            subprocess.run(['tesseract', str(image), 'stdout', '--psm', '6'],
                           check=True, stdout=stream, stderr=subprocess.DEVNULL)
        temporary_transcript.replace(transcript)
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
    batch_size = parser.add_mutually_exclusive_group()
    batch_size.add_argument('--total', type=int, help='total pages across all years (default: 50)')
    batch_size.add_argument('--count', type=int, help='legacy pages-per-year limit')
    parser.add_argument('--mode', choices=('after-last', 'gaps'), default='gaps')
    parser.add_argument('--start', action='append', default=[], metavar='YEAR:PAGE',
                        help='override the next page for a year, e.g. --start first:43')
    parser.add_argument('--jobs', type=int, default=4)
    parser.add_argument('--ocr', action='store_true')
    parser.add_argument('--list-only', action='store_true', help='print the next queue without rendering pages')
    parser.add_argument('--format', choices=('png', 'jpg'), default='jpg',
                        help='JPEG reduces file size and avoids observed PNG read failures')
    args = parser.parse_args()
    if args.count is None and args.total is None:
        args.total = 50
    if args.jobs < 1 or (args.count is not None and args.count < 1) or (args.total is not None and args.total < 1):
        parser.error('batch size and --jobs must be positive')
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
    # Selection checkpoints include title/objective-only pages with zero rows.
    # Skip these in the addition queue, without claiming final reconciliation.
    selection_checked = {year: set() for year in SOURCES}
    for checkpoint in sorted(Path(__file__).with_name('kuhs-batches').glob('*.json')):
        for row in json.loads(checkpoint.read_text()).get('pages', []):
            year, page = row.get('year'), row.get('pdf_page')
            if (year not in SOURCES or type(page) is not int
                    or not 1 <= page <= SOURCES[year][1]):
                raise SystemExit(f'invalid page in selection checkpoint: {checkpoint}')
            if row.get('status') == 'selection_checked_final_page_reconciliation_pending':
                selection_checked[year].add(page)
    queues = {}
    for year, (filename, total) in SOURCES.items():
        pdf = args.sources / filename
        if not pdf.is_file():
            raise SystemExit(f'missing source PDF: {pdf}')
        reviewed = {int(row['pdf_page']) for row in coverage
                    if row['year'] == year and int(row['hand_checked_questions']) > 0}
        reviewed.update(selection_checked[year])
        start = starts.get(year, max(reviewed, default=0) + 1
                           if args.mode == 'after-last' else 1)
        pages = [page for page in range(start, total + 1) if page not in reviewed]
        if args.mode == 'after-last' and not pages:
            pages = [page for page in range(1, total + 1) if page not in reviewed]
        queues[year] = [(year, page, pdf, args.output, args.ocr, args.format) for page in pages]
    tasks = []
    if args.count is not None:
        for queue in queues.values():
            tasks.extend(queue[:args.count])
    else:
        # Spread the total across years, using other queues when one runs out.
        while len(tasks) < args.total and any(queues.values()):
            for queue in queues.values():
                if queue and len(tasks) < args.total:
                    tasks.append(queue.pop(0))
    if args.list_only:
        print(json.dumps([{'year': task[0], 'pdf_page': task[1]} for task in tasks], indent=2))
        return
    args.output.mkdir(parents=True, exist_ok=True)
    manifest = args.output / 'pending-review.json'
    entries = []
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        futures = [pool.submit(prepare, task) for task in tasks]
        for future in as_completed(futures):
            entries.append(future.result())
            entries.sort(key=lambda row: (list(SOURCES).index(row['year']), row['pdf_page']))
            # Save after every page; interruptions retain completed work.
            temporary_manifest = manifest.with_suffix('.json.tmp')
            temporary_manifest.write_text(json.dumps(entries, indent=2) + '\n')
            temporary_manifest.replace(manifest)
    print(f'{len(entries)} page images ready: {manifest}')
    for year in SOURCES:
        print(f'{year}: {[row["pdf_page"] for row in entries if row["year"] == year]}')


if __name__ == '__main__':
    main()
