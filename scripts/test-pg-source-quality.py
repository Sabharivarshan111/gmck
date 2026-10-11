#!/usr/bin/env python3
"""Synthetic source gates only: no upstream downloads or pack mutations."""
import importlib.util
import unittest
from pathlib import Path
from pg_source_quality import preflight, structural_reasons, IMAGE_DEPENDENCE, PLACEHOLDER_PATTERN

spec = importlib.util.spec_from_file_location('importer', Path(__file__).with_name('import-pg-medmcqa-offline.py'))
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)

def source(qid, **changes):
    row = dict(id=qid, question='Which nerve supplies the lateral rectus muscle?',
               opa='Optic', opb='Abducens', opc='Trochlear', opd='Oculomotor',
               cop=1, exp='Abducens supplies the lateral rectus muscle.', subject_name='Anatomy', choice_type='multi')
    row.update(changes)
    return row

class QualityTests(unittest.TestCase):
    def test_entire_split_conflicts_and_exact_accounting(self):
        rows = [source('good', question='Which nerve supplies lateral rectus in this patient?'),
                source('duplicate', opa='Optic', opb=' optic '),
                source('placeholder', opd='???'),
                source('image', question='Identify the lesion in the following image.'),
                source('conflict1'),
                source('conflict2', opa='Trochlear', opb='Oculomotor', opc='Optic', opd='Abducens', cop=0)]
        usable, report = importer.transform_rows(rows, 'validation', 'a' * 40)
        self.assertEqual((report['raw'], report['usable'], report['invalid']), (6, 1, 5))
        self.assertEqual(usable[0]['id'], 'medmcqa-validation-good')
        self.assertEqual(report['invalid_reasons']['conflicting_answer_text'], 2)
        self.assertEqual(len(report['excluded_rows']), 5)

    def test_reordered_same_answer_is_not_conflict_and_sessions_are_separate(self):
        a = importer.to_record(source('a'), 'validation')
        b = importer.to_record(source('b', opa='Trochlear', opb='Oculomotor', opc='Optic', opd='Abducens', cop=3), 'validation')
        self.assertEqual(preflight([a, b])[1]['invalid'], 0)
        b['answer'] = 'A'; b['exam_session'] = 'other'
        self.assertEqual(preflight([a, b])[1]['invalid'], 0)

    def test_normalization_placeholder_and_no_imaging_false_positive(self):
        duplicate = importer.to_record(source('d', opa='Cafe\u0301', opb='Café'), 'train')
        regular = importer.to_record(source('r', question='Which investigation is preferred: CT or MRI for this condition?'), 'train')
        self.assertEqual(preflight([duplicate, regular])[1]['invalid'], 1)
        bad = importer.to_record(source('bool', cop=True), 'train')
        self.assertIn('invalid_answer_label', preflight([bad])[1]['excluded_rows'][0]['reasons'])

    def test_medically_valid_short_options_and_explicit_visual_policy(self):
        for value in ('None', 'Na', 'N/A', 'Null', 'Nil', 'Unknown', 'None of the above', 'A', '1 and 2'):
            row = importer.to_record(source('valid', opa=value), 'validation')
            self.assertNotIn('missing_or_placeholder_option', structural_reasons(row), value)
        for value in ('Option A', '???', '...', '—', 'not available', 'not given', 'missing'):
            row = importer.to_record(source('invalid', opa=value), 'validation')
            self.assertIn('missing_or_placeholder_option', structural_reasons(row), value)
        for question in ('Interpret the given ECG.', 'Which diagnosis is shown in the radiograph?',
                         'Identify the following diagram.', 'The picture shown represents which lesion?'):
            row = importer.to_record(source('image', question=question), 'validation')
            self.assertIn('image_required_without_supported_asset', structural_reasons(row), question)
        for question in ('Which of the following ECG findings is typical?',
                         'Which of the following ECG features indicate ischemia?',
                         'Which investigation is preferred: CT or MRI for this condition?'):
            row = importer.to_record(source('text', question=question), 'validation')
            self.assertNotIn('image_required_without_supported_asset', structural_reasons(row), question)
        audit_spec = importlib.util.spec_from_file_location('audit', Path(__file__).with_name('audit-pg-corpus.py'))
        audit = importlib.util.module_from_spec(audit_spec)
        audit_spec.loader.exec_module(audit)
        self.assertEqual(IMAGE_DEPENDENCE.pattern, audit.IMAGE_PATTERN.pattern)
        self.assertEqual(PLACEHOLDER_PATTERN.pattern, audit.PLACEHOLDER_PATTERN.pattern)

    def test_revision_and_choice_type_provenance(self):
        row = importer.to_record(source('q'), 'train', 'a' * 40)
        self.assertEqual(row['source_revision'], 'a' * 40)
        self.assertIn('/resolve/' + 'a' * 40 + '/', row['source_data_url'])
        self.assertEqual(row['answer_format'], 'single_label')
        self.assertEqual(row['source_choice_type'], 'multi')
        self.assertEqual(row['answer'], 'B')
        self.assertIsNone(row['exam_year'])
        self.assertIn('LICENSE.md', row['rights_evidence'])
        self.assertIn('not independent clearance', row['rights_evidence'])

if __name__ == '__main__':
    unittest.main()
