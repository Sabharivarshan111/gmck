#!/usr/bin/env python3
"""Derive coverage counts from visually checked rows and run one batch gate.

This never adds questions or promotes a page's visual review status.
Usage: python3 scripts/checkpoint-kuhs-review.py [--check-app]
"""

import argparse
from collections import Counter
import csv
import io
import json
from pathlib import Path
import subprocess

import importlib.util
_spec = importlib.util.spec_from_file_location('kuhs_reconciliation', Path(__file__).with_name('kuhs-reconciliation.py'))
_reconciliation = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_reconciliation)

ROOT = Path(__file__).resolve().parents[1]
TOTALS = {'first': 86, 'second': 149, 'third': 95, 'final': 281}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-app', action='store_true')
    args = parser.parse_args()
    source = (ROOT / 'src/data/kuhs/verifiedQuestions.ts').as_uri()
    questions = json.loads(subprocess.check_output([
        'node', '--experimental-strip-types', '--input-type=module', '-e',
        f"import {{ VERIFIED_KUHS_QUESTIONS as rows }} from '{source}'; console.log(JSON.stringify(rows))",
    ], text=True))
    expected = {(year, page) for year, total in TOTALS.items()
                for page in range(1, total + 1)}
    assert len({row['id'] for row in questions}) == len(questions), 'duplicate question ID'
    for row in questions:
        assert (row['year'], row['pdfPage']) in expected, row['id']
        assert row['examRefs'] and not any('TU' in ref or 'RGU' in ref
                                           for ref in row['examRefs']), row['id']
    counts = Counter((row['year'], row['pdfPage']) for row in questions)
    coverage_path = ROOT / 'scripts/kuhs-page-coverage.tsv'
    original = coverage_path.read_text()
    reader = csv.DictReader(io.StringIO(original), delimiter='\t')
    fields, coverage = reader.fieldnames, list(reader)
    actual = {(row['year'], int(row['pdf_page'])) for row in coverage}
    assert len(coverage) == len(actual) == len(expected) and actual == expected
    _reconciliation.validate_reconciliation(questions, coverage)
    for row in coverage:
        row['hand_checked_questions'] = str(counts[(row['year'], int(row['pdf_page']))])
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=fields, delimiter='\t', lineterminator='\n')
    writer.writeheader()
    writer.writerows(coverage)
    if buffer.getvalue() != original:
        temporary = coverage_path.with_suffix('.tsv.tmp')
        temporary.write_text(buffer.getvalue())
        temporary.replace(coverage_path)
    subprocess.run(['python3', str(ROOT / 'scripts/check-kuhs-ledger.py')], check=True)
    if args.check_app:
        for command in ('typecheck', 'check:search-index', 'check:repeat-markers'):
            result = subprocess.run(['npm', 'run', command], cwd=ROOT / 'mobile',
                                    capture_output=True, text=True)
            if result.returncode:
                print(result.stdout + result.stderr)
                raise SystemExit(result.returncode)
            print(f'{command}: passed')


if __name__ == '__main__':
    main()
