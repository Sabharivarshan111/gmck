#!/usr/bin/env python3
"""Validate the resumable KUHS ledger without requiring OCR artifacts."""

from collections import Counter
import csv
import json
from pathlib import Path
import subprocess

import importlib.util
_spec = importlib.util.spec_from_file_location('kuhs_reconciliation', Path(__file__).with_name('kuhs-reconciliation.py'))
_reconciliation = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_reconciliation)

ROOT = Path(__file__).resolve().parents[1]
PAGES = {'first': 86, 'second': 149, 'third': 95, 'final': 281}
SOURCE = (ROOT / 'src/data/kuhs/verifiedQuestions.ts').as_uri()

raw = subprocess.check_output([
    'node', '--experimental-strip-types', '--input-type=module', '-e',
    f"import {{ VERIFIED_KUHS_QUESTIONS as rows }} from '{SOURCE}'; "
    'console.log(JSON.stringify(rows))',
], text=True)
questions = json.loads(raw)
with (ROOT / 'scripts/kuhs-page-coverage.tsv').open(newline='') as stream:
    coverage = list(csv.DictReader(stream, delimiter='\t'))

expected = {(year, page) for year, total in PAGES.items()
            for page in range(1, total + 1)}
actual = {(row['year'], int(row['pdf_page'])) for row in coverage}
assert len(coverage) == len(expected) == len(actual) == 611
assert actual == expected
assert len({row['id'] for row in questions}) == len(questions)
counts = Counter((row['year'], row['pdfPage']) for row in questions)
for row in questions:
    assert (row['year'], row['pdfPage']) in expected, row['id']
    assert row['examRefs'] and not any(
        'TU' in ref or 'RGU' in ref for ref in row['examRefs']), row['id']
for row in coverage:
    key = row['year'], int(row['pdf_page'])
    assert int(row['hand_checked_questions']) == counts[key], key

reconciled = _reconciliation.validate_reconciliation(questions, coverage)

print(f'OK {len(coverage)} indexed pages, {len(questions)} unique KUHS question IDs, '
      f'{sum(bool(counts[key]) for key in expected)} pages with checked entries; '
      f'{reconciled} pages fully reconciled; {611 - reconciled} pending')
