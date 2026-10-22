"""Regression: extending a bank must reject altered published rows and source bytes."""
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import sys
sys.dont_write_bytecode = True
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('pg_builder', ROOT/'scripts/build-aiims-ini-bank.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

class ExtensionIntegrity(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        for name in ['scripts/aiims-ini-sources.json','scripts/aiims-ini-reviewed.json','scripts/aiims-ini-transcribed.json','mobile/src/lib/aiimsPgBank.json','mobile/src/lib/iniCetBank.json','docs/AIIMS_INI_RELEASE_CANDIDATE_20261021.json']:
            target = self.root/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT/name, target)
        builder.ROOT = self.root
        self.index = {s['file']:s for s in json.loads((self.root/'scripts/aiims-ini-sources.json').read_text())}

    def tearDown(self):
        builder.ROOT = ROOT
        self.temp.cleanup()

    def test_released_rows_recover_with_receipts(self):
        rows, count = builder.reviewed_baseline(self.index)
        self.assertEqual(len(rows), 239)
        self.assertEqual(count, 2277)

    def test_changed_answer_is_rejected(self):
        path = self.root/'mobile/src/lib/iniCetBank.json'
        bank = json.loads(path.read_text())
        bank['records'][0]['sourceAnswer'] = 'Z'
        path.write_text(json.dumps(bank))
        with self.assertRaisesRegex(ValueError, 'baseline changed'):
            builder.reviewed_baseline(self.index)

    def test_changed_explanation_is_rejected(self):
        path = self.root/'mobile/src/lib/aiimsPgBank.json'
        bank = json.loads(path.read_text())
        bank['records'][0]['explanation'] += ' Unsupported change.'
        path.write_text(json.dumps(bank))
        with self.assertRaisesRegex(ValueError, 'baseline changed'):
            builder.reviewed_baseline(self.index)

    def test_changed_source_receipt_is_rejected(self):
        source = next(iter(self.index.values()))
        source['sha256'] = '0'*64
        with self.assertRaisesRegex(ValueError, 'source identity'):
            builder.reviewed_baseline(self.index)

    def test_new_review_needs_transcription(self):
        path = self.root/'scripts/aiims-ini-reviewed.json'
        reviews = json.loads(path.read_text())
        reviews.append({'id':'untranscribed-addition:1'})
        path.write_text(json.dumps(reviews))
        with self.assertRaisesRegex(ValueError, 'explicit source transcriptions'):
            builder.build(self.root, True)

    def test_staged_new_pdf_hash_is_required(self):
        data = b'%PDF-1.7\nsource fixture'
        record = dict(file='new.pdf',url='https://example.invalid/new.pdf',required=True,sha256=hashlib.sha256(data).hexdigest())
        (self.root/'scripts/aiims-ini-sources.json').write_text(json.dumps([record]))
        (self.root/'new.pdf').write_bytes(data)
        builder.prepare(self.root, False, {'new.pdf'})
        (self.root/'new.pdf').write_bytes(data+b' changed')
        with self.assertRaisesRegex(ValueError, 'fingerprint changed'):
            builder.prepare(self.root, False, {'new.pdf'})

    def test_pinned_html_hash_is_required(self):
        data = b'<html>Public faculty recall source</html>'
        record = dict(file='faculty.html',url='https://example.invalid/faculty.html',required=True,pinBytes=True,sha256=hashlib.sha256(data).hexdigest())
        (self.root/'scripts/aiims-ini-sources.json').write_text(json.dumps([record]))
        (self.root/'faculty.html').write_bytes(data)
        builder.prepare(self.root, False, {'faculty.html'})
        (self.root/'faculty.html').write_bytes(data+b' changed')
        with self.assertRaisesRegex(ValueError, 'fingerprint changed'):
            builder.prepare(self.root, False, {'faculty.html'})

if __name__ == '__main__':
    unittest.main()
