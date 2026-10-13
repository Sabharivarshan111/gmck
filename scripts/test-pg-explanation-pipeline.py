#!/usr/bin/env python3
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec=importlib.util.spec_from_file_location('pipeline',Path(__file__).with_name('prepare-pg-explanations.py'))
p=importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)

class PipelineTests(unittest.TestCase):
    def test_batch_selection_skips_prepared_and_keeps_original_ids(self):
        items=[{'id':str(i),'existing_explanation':'existing' if i==1 else ''} for i in range(5)]
        self.assertEqual([q['id'] for q in p.select_questions(items,1,missing_only=True,prepared_ids={'2'})],['3','4'])
        self.assertEqual([q['id'] for q in p.select_questions(items,only_ids={'4'})],['4'])
    def test_rejects_disagreement_fabricated_evidence_and_copying(self):
        q={'supplied_answer':'B'}
        passage={'id':'known','text':' '.join('word'+str(i) for i in range(60))}
        draft={'status':'source_supported_draft','answer':'B','explanation':'An independently phrased explanation can discuss the relevant physiological mechanism and distinguish each alternative without copying a reference passage.','evidence_ids':['known'],'independently_medically_reviewed':False}
        self.assertTrue(p.validate(draft,q,[passage]))
        self.assertFalse(p.validate({**draft,'answer':'A'},q,[passage]))
        self.assertFalse(p.validate({**draft,'evidence_ids':['invented']},q,[passage]))
        self.assertFalse(p.validate({**draft,'explanation':passage['text']},q,[passage]))
        self.assertFalse(p.validate({**draft,'independently_medically_reviewed':True},q,[passage]))
    def test_missing_images_do_not_become_text_answers(self):
        self.assertTrue(p.image_required({'question':'Interpret the waveform shown below','options':['one','two','three','four']}))
        self.assertTrue(p.image_required({'question':'Which ligament is injured?','options':list('ABCD')}))
    def test_tiva_does_not_accept_generic_toxicity_passages(self):
        with tempfile.TemporaryDirectory() as directory:
            db=p.database(Path(directory)/'test.sqlite')
            p.index_text(db,'irrelevant.txt','Cerebral renal toxicity metabolic rate and hypoxia in neonatal disorders. '*30)
            p.index_text(db,'relevant.txt','Propofol reduces cerebral metabolic rate during intravenous anaesthesia. '*30)
            found=p.retrieve(db,'TIVA reduces cerebral metabolic rate renal toxicity')
            self.assertTrue(found)
            self.assertTrue(all(x['source']=='relevant.txt' for x in found))
            db.close()
    def test_index_is_idempotent_and_replaces_changed_sources(self):
        with tempfile.TemporaryDirectory() as directory:
            db=p.database(Path(directory)/'test.sqlite')
            text='Propofol reduces cerebral metabolic rate and intracranial pressure during intravenous anaesthesia. '*15
            p.index_text(db,'private.txt',text)
            initial=db.execute('select count(*) from passages').fetchone()[0]
            p.index_text(db,'private.txt',text)
            self.assertEqual(db.execute('select count(*) from passages').fetchone()[0],initial)
            self.assertTrue(p.retrieve(db,'propofol cerebral metabolic intracranial pressure'))
            p.index_text(db,'private.txt','Unrelated microbiology material. '*100)
            self.assertFalse(p.retrieve(db,'propofol cerebral metabolic intracranial pressure'))
            db.close()
    def test_ids_cover_published_bank_and_tiva_example(self):
        questions=list(p.questions())
        self.assertEqual(len(questions),185636)
        self.assertEqual(len({q['id'] for q in questions}),185636)
        self.assertNotIn('medmcqa-practice-s00-6',{q['id'] for q in questions})
        following=next(q for q in questions if q['id']=='medmcqa-practice-s00-7')
        self.assertIn('intracranial',following['question'])
        tiva=next(q for q in questions if 'Total Infra' in q['question'] and 'TIVA' in q['question'])
        self.assertEqual(tiva['supplied_answer'],'B')

if __name__=='__main__':
    unittest.main()
