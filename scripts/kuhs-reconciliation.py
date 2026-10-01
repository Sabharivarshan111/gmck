"""Validate explicit whole-page reconciliation evidence against current rows."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PENDING = 'manual_page_review_required'
COMPLETE = 'manual_page_review_complete'

def validate_reconciliation(questions, coverage):
    path = ROOT / 'scripts/kuhs-reconciled-pages.json'
    evidence = json.loads(path.read_text()) if path.exists() else []
    by_key = {}
    for page in evidence:
        key = page['year'], page['pdf_page']
        assert key not in by_key, ('duplicate reconciliation', key)
        assert len(page['image_sha256']) == 64 and all(c in '0123456789abcdef' for c in page['image_sha256'])
        assert page['all_visible_leaves_checked'] is True and page['notes']
        rows = [r for r in questions if (r['year'], r['pdfPage']) == key]
        assert page['question_ids'] == sorted(r['id'] for r in rows), ('reconciliation rows changed', key)
        digest = hashlib.sha256(json.dumps(rows, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        assert page['ledger_sha256'] == digest, ('reconciled question changed', key)
        by_key[key] = page
    coverage_keys = {(r['year'], int(r['pdf_page'])) for r in coverage}
    assert set(by_key) <= coverage_keys
    for row in coverage:
        key = row['year'], int(row['pdf_page'])
        expected = COMPLETE if key in by_key else PENDING
        assert row['review_status'] == expected, ('status lacks matching evidence', key)
    return len(by_key)
