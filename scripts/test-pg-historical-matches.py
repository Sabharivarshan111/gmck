#!/usr/bin/env python3
"""Synthetic regressions for conservative historical item attribution."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('matcher', Path(__file__).with_name('audit-pg-historical-matches.py'))
matcher = importlib.util.module_from_spec(spec); spec.loader.exec_module(matcher)
STEM = 'A synthetic patient has a clearly documented long question stem for exact attribution testing?'
OPTIONS = ['Alpha pathway', 'Beta pathway', 'Gamma pathway', 'Delta pathway']

class HistoricalMatchChecks(unittest.TestCase):
    def run_match(self, raw, options=OPTIONS, duplicate=False, warning=None):
        stem = matcher.norm(STEM)
        rows = [dict(id='synthetic-1', pack='synthetic', options=options)]
        if duplicate: rows.append(dict(id='synthetic-2', pack='synthetic', options=options))
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'synthetic.txt'; path.write_text(raw)
            source = dict(id='test', url='https://example.invalid/synthetic', sha256='synthetic',
                exam='Synthetic', year=2004, session=None, attribution='unofficial_publisher_claim',
                rights_status='unresolved', text_path=str(path), identity_warning=warning)
            return matcher.match_source(source, {' '.join(stem.split()[:5]):{stem}}, {stem:rows})

    def block(self):
        return 'Q. 12. '+ STEM + '\n' + '\n'.join(f'{label}. {o}' for label,o in zip('ABCD',OPTIONS)) + '\nAns. A\n'

    def test_full_match_metadata_contains_no_question_text(self):
        full, partial = self.run_match(self.block())
        self.assertEqual(len(full), 1); self.assertFalse(partial)
        self.assertFalse(full[0]['answer_verified']); self.assertFalse(full[0]['eligible_for_automatic_year_label'])
        self.assertNotIn(STEM, str(full)); self.assertEqual(full[0]['source_question_number'], 12)

    def test_repeated_source_stem_is_unresolved(self):
        full, partial = self.run_match(self.block()*2)
        self.assertFalse(full); self.assertEqual(len(partial),2)

    def test_duplicate_bank_stem_is_unresolved(self):
        full, partial = self.run_match(self.block(),duplicate=True)
        self.assertFalse(full); self.assertEqual(len(partial),2)

    def test_next_question_options_cannot_corroborate(self):
        raw = 'Q. 12. '+STEM+'\nA. Something else\nQ. 13. Other question\n'+ '\n'.join(OPTIONS)+'\nAns. A'
        full, _ = self.run_match(raw); self.assertFalse(full)

    def test_explanation_options_cannot_corroborate(self):
        full, _ = self.run_match('Q. 12. '+STEM+'\nAns. A\n'+ '\n'.join(OPTIONS))
        self.assertFalse(full)

    def test_overlapping_option_strings_are_unresolved(self):
        full, _ = self.run_match(self.block(), options=['Alpha','Alpha pathway','Gamma pathway','Delta pathway'])
        self.assertFalse(full)

    def test_punctuation_is_not_removed(self):
        full, partial = self.run_match(self.block().replace('testing?', 'testing.'))
        self.assertFalse(full); self.assertFalse(partial)

    def test_whitespace_and_case_are_ignored(self):
        full, _ = self.run_match(self.block().upper().replace(' ', '  '))
        self.assertEqual(len(full),1)

    def test_unestablished_exam_identity_blocks_strong_claim(self):
        full, partial = self.run_match(self.block(),warning='identity conflicting')
        self.assertFalse(full); self.assertIn('source_exam_identity_unestablished',partial[0]['reasons'])

if __name__ == '__main__': unittest.main()
