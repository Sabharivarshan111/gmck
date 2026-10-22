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
        for name in ['scripts/aiims-ini-sources.json','scripts/aiims-ini-reviewed.json','scripts/aiims-ini-transcribed.json','scripts/aiims-ini-held.json','mobile/src/lib/aiimsPgBank.json','mobile/src/lib/iniCetBank.json','docs/AIIMS_INI_RELEASE_CANDIDATE_20261021.json']:
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
        self.assertEqual(len(rows), 313)
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

    def test_numbered_sequence_requires_all_statements(self):
        row=dict(id='broken',question='. Setting research objective',options=['4-3-2-1','1-2-3-4','3-4-2-1','3-4-1-2'])
        with self.assertRaisesRegex(ValueError, 'missing its statements'):
            builder.validate_numbered_sequence(row)
        row['question']='Order: 1. Analyse data; 2. Select population; 3. Set question; 4. Set objective.'
        builder.validate_numbered_sequence(row)
        builder.validate_numbered_sequence(dict(id='viral-types',question='Which HPV types?',options=['16, 18','33, 34','6, 11','41, 42']))

    def test_full_source_override_requires_exact_audit(self):
        old=dict(id='repair:4',source='source.pdf',source_number=4,question='Incomplete stem',options=['4-3-2-1','1-2-3-4','3-4-2-1','3-4-1-2'],key='C')
        new=dict(old,question='Order 1. Analysis; 2. Population; 3. Question; 4. Objective.')
        with self.assertRaisesRegex(ValueError, 'without an audited correction'):
            builder.merge_transcription({old['id']:old},new,{})
        audit=dict(reason='Restore source statements',beforeSourceFingerprint=builder.digest(old),afterSourceFingerprint=builder.digest(new))
        candidates={old['id']:old};builder.merge_transcription(candidates,new,{old['id']:audit})
        self.assertEqual(candidates[old['id']],new)

    def test_withdrawal_requires_original_complete_review(self):
        p=self.root/'scripts/aiims-ini-reviewed.json';reviews=json.loads(p.read_text());withdrawn=reviews.pop(0)
        p.write_text(json.dumps(reviews));h=self.root/'scripts/aiims-ini-held.json'
        h.write_text(json.dumps([dict(withdrawn,reason='Reviewed duplicate')]))
        rows,_=builder.reviewed_baseline(self.index)
        self.assertNotIn(withdrawn['id'],{r['id'] for r in rows})
        withdrawn['sourceFingerprint']='0'*64
        h.write_text(json.dumps([dict(withdrawn,reason='Reviewed duplicate')]))
        with self.assertRaisesRegex(ValueError, 'baseline changed'):
            builder.reviewed_baseline(self.index)

    def test_correction_must_match_old_receipt_and_new_transcription(self):
        p=self.root/'scripts/aiims-ini-reviewed.json';reviews=json.loads(p.read_text());before=dict(reviews[0])
        rows,_=builder.reviewed_baseline(self.index);old=rows[0];replacement=dict(old,question=old['question']+' Reviewed wording.')
        reviews[0]['sourceFingerprint']=builder.digest(replacement);p.write_text(json.dumps(reviews))
        t=self.root/'scripts/aiims-ini-transcribed.json';transcribed=json.loads(t.read_text())
        t.write_text(json.dumps([r for r in transcribed if r['id']!=old['id']]+[replacement]))
        audit=dict(id=old['id'],source=old['source'],reason='Restored source text',beforeSourceFingerprint=builder.digest(old),afterSourceFingerprint=builder.digest(replacement),beforeReview=before)
        a=self.root/'scripts/aiims-ini-audit-corrections.json';a.write_text(json.dumps([audit]))
        recovered,_=builder.reviewed_baseline(self.index)
        self.assertEqual(recovered[0]['question'],replacement['question'])
        with self.assertRaisesRegex(ValueError, 'Missing required source'):
            builder.build(self.root, True)
        audit['afterSourceFingerprint']='0'*64;a.write_text(json.dumps([audit]))
        with self.assertRaisesRegex(ValueError, 'replacement is not reviewed'):
            builder.reviewed_baseline(self.index)

if __name__ == '__main__':
    unittest.main()
