import importlib.util
import sys
sys.dont_write_bytecode = True
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('candidates', Path(__file__).parent/'pg-import/recall_text_candidates.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class RecallKeys(unittest.TestCase):
    def question(self, key, number=1):
        return f'Q{number}. Example?\nA) One\nB) Two\nC) Three\nD) Four\nCorrect answer : {key}\n'

    def test_complete_key_required(self):
        for key in ['C,D', 'A-B-D-C', 'A and C', 'B?', 'AB', '']:
            self.assertIsNone(m.single_key(key), key)
        self.assertEqual(m.single_key(' c '), 'C')

    def test_sequence_not_truncated(self):
        row = m.extract(self.question('A-B-D-C'), 'example.pdf')[0]
        self.assertIsNone(row['key'])
        self.assertIn('non_single_or_unreadable_key', row['issues'])
        self.assertEqual(row['sourceKeyText'], 'A-B-D-C')

    def test_repeated_numbers_never_silently_merge(self):
        rows = m.extract(self.question('A') + self.question('B'), 'example.pdf')
        self.assertEqual(len(rows), 2)
        self.assertTrue(all('duplicate_source_number' in r['issues'] for r in rows))
        self.assertTrue(all(r['reviewStatus'] == 'unreviewed_candidate' for r in rows))

    def test_statements_survive(self):
        text = self.question('B').replace('Example?', 'Statements: 1. First; 2. Second. Which are true?')
        self.assertIn('2. Second', m.extract(text, 'example.pdf')[0]['question'])

    def test_changed_wording_still_suggests_overlap(self):
        existing = [dict(id='old',question='A hooch tragedy is classically associated with poisoning by which substance?',options=['Methanol','Mercury','Ethanol','Phosphorus'],key='A')]
        candidate = dict(id='new',question='Hooch tragedy is because of?',options=['Methanol','Mercury','Ethanol','Phosphorus'],key='A')
        result = m.duplicate_suggestions([candidate], existing)[0]
        self.assertEqual(result['duplicateSuggestions'][0]['id'], 'old')
        self.assertGreater(result['duplicateSuggestions'][0]['similarity'], 0.3)

if __name__ == '__main__':
    unittest.main()
