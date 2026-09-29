#!/usr/bin/env python3
"""Report OCR marker coverage on every PDF page; markers are not verified rows.

Usage: python3 scripts/audit-kuhs-coverage.py REVIEW_DIR OUTPUT_TSV
Every page still needs visual checking before the KUHS bank can be enabled.
"""

from collections import Counter
import csv
from pathlib import Path
import re
import subprocess
import sys


PAGE_COUNTS = {'first': 86, 'second': 149, 'third': 95, 'final': 281}
YEAR_CODES = {'first': '1', 'second': '2', 'third': '3', 'final': '4'}
VERIFIED_ID = re.compile(r'kuhs-([1-4])-[^-]+-p(\d+)-\d+')


def reviewed_counts():
    source = Path(__file__).resolve().parents[1] / 'src/data/kuhs/verifiedQuestions.ts'
    command = ['node', '--experimental-strip-types', '--input-type=module', '-e',
               f"import {{ VERIFIED_KUHS_QUESTIONS as rows }} from '{source.as_uri()}'; "
               'console.log(JSON.stringify(rows.map(row => row.id)))']
    ids = subprocess.check_output(command, text=True)
    import json
    return Counter((code, int(page)) for row_id in json.loads(ids)
                   for code, page in VERIFIED_ID.findall(row_id))


def counts(path):
    with path.open(newline='') as stream:
        return Counter(int(row['page']) for row in csv.DictReader(stream, delimiter='\t'))


def main():
    source_dir, destination = map(Path, sys.argv[1:3])
    verified = reviewed_counts()
    previous = {}
    if destination.exists():
        with destination.open(newline='') as stream:
            previous = {(row['year'], int(row['pdf_page'])): row
                        for row in csv.DictReader(stream, delimiter='\t')}
    rows = []
    for year, page_count in PAGE_COUNTS.items():
        original = counts(source_dir / f'{year}-columns.tsv')
        clean_path = source_dir / f'{year}-clean-candidates.tsv'
        if clean_path.exists():
            clean = counts(clean_path)
        else:
            # A workspace reset may remove the costly clean OCR pass. Preserve
            # the prior, source-matched audit values until it is regenerated.
            if any((year, page) not in previous or
                   int(previous[year, page]['first_ocr_markers']) != original[page]
                   for page in range(1, page_count + 1)):
                raise SystemExit(f'{clean_path} missing and no matching prior audit')
            clean = Counter({page: int(previous[year, page]['clean_ocr_markers'])
                             for page in range(1, page_count + 1)})
            print(f'{year}: clean OCR absent; retained source-matched prior marker counts')
        for page in range(1, page_count + 1):
            rows.append(dict(year=year, pdf_page=page, first_ocr_markers=original[page],
                             clean_ocr_markers=clean[page],
                             hand_checked_questions=verified[YEAR_CODES[year], page],
                             review_status='manual_page_review_required'))
        subset = rows[-page_count:]
        print(f'{year}: {page_count}/{page_count} pages indexed, '
              f'{sum(row["first_ocr_markers"] for row in subset)} first-pass / '
              f'{sum(row["clean_ocr_markers"] for row in subset)} clean-pass markers, '
              f'{sum(row["hand_checked_questions"] for row in subset)} hand-checked questions, '
              f'{sum(not row["first_ocr_markers"] and not row["clean_ocr_markers"] for row in subset)} zero-marker pages')
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]), delimiter='\t', lineterminator='\n')
        writer.writeheader()
        writer.writerows(rows)
    print(f'{len(rows)} page audit rows: {destination}')


if __name__ == '__main__':
    main()
