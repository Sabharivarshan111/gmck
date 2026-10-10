#!/usr/bin/env python3
"""Regression tests for the native-only, budget-gated PG source-pack builder."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

PATH = Path(__file__).with_name('build-pg-offline-packs.py')
spec = importlib.util.spec_from_file_location('pg_offline_builder', PATH)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

def example(n=0):
    return dict(
        id=f'original-pg-{n}', status='published', reuse_status='original',
        rights_evidence='Original ORBIT question drafted and checked',
        answer_reference='Independent textbook review: Gray Anatomy, Chapter 1',
        question='Which cranial nerve supplies the lateral rectus muscle?',
        opa='Oculomotor', opb='Trochlear', opc='Abducens', opd='Optic',
        answer='C',
        explanation='The abducens nerve supplies the lateral rectus and causes abduction of the eye.',
        exam='GENERAL_MEDICAL', exam_year=None, exam_session=None,
        record_type='original_exam_style',
        source_url='https://github.com/Sabharivarshan111/gmck',
        subject='Anatomy', topic='Extraocular muscles'
    )

class LocalPgPackTests(unittest.TestCase):
    def test_valid_original(self):
        self.assertEqual(builder.validate(example())['answer'], 'C')

    def test_year_must_be_proven(self):
        row=example();row['exam_year']=2025
        with self.assertRaises(ValueError): builder.validate(row)

    def test_rights_review_mandatory(self):
        row=example();row['rights_evidence']=''
        with self.assertRaises(ValueError): builder.validate(row)

    def test_unreviewed_must_not_ship(self):
        row=example();row['status']='pending'
        with self.assertRaises(ValueError): builder.validate(row)

    def test_successful_offline_manifest(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);source=root/'reviewed.jsonl'
            source.write_text(''.join(json.dumps(example(i))+'\\n' for i in range(5)))
            opts=type('Opts',(),dict(input=source,out=root/'packs',max_compressed_mb=0.01,rows_per_pack=2))
            report=builder.write_packs(opts)
            self.assertEqual(report['total_questions'],5)
            self.assertEqual(report['chunk_count'],3)
            manifest=(root/'packs'/'generatedManifest.ts').read_text()
            self.assertEqual(manifest.count('load: () => import('),3)
            self.assertNotIn('supabase',manifest.lower())

    def test_budget_failure_preserves_existing_pack(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);source=root/'reviewed.jsonl'
            source.write_text(json.dumps(example())+'\\n')
            out=root/'packs';out.mkdir();(out/'generatedManifest.ts').write_text('old-manifest')
            opts=type('Opts',(),dict(input=source,out=out,max_compressed_mb=0.00001,rows_per_pack=1000))
            with self.assertRaises(SystemExit): builder.write_packs(opts)
            self.assertEqual((out/'generatedManifest.ts').read_text(),'old-manifest')

if __name__ == '__main__':
    unittest.main()
