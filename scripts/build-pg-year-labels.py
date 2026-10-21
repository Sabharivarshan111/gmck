"""Rebuild the bundled NEET year sidecar by joining source receipts, never by guessing from question text."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def build():
 notes=json.loads((ROOT/'mobile/src/lib/neetPgStudyData.json').read_text())['records']
 sources={s['name']:s for s in json.loads((ROOT/'scripts/neet-pg-build-sources.json').read_text())}
 sources['2025_DigiNerve_web']=sources['2025_DigiNerve']
 bank=json.loads((ROOT/'mobile/src/lib/neetPgBank.json').read_text())
 index={f'neet-{n["year"]}-{i:04}':n for i,n in enumerate(notes,1)}
 labels={}
 for row in bank['records']:
  note=index.get(row['id'])
  if not note or note['source'] not in sources:continue
  if int(note['source'][:4])!=note['year']:raise ValueError('Conflicting source year '+row['id'])
  label={'examYear':note['year']}
  if 'shift1_' in note['source']:label['examSession']='Shift 1'
  elif 'shift2_' in note['source']:label['examSession']='Shift 2'
  labels[row['id']]=label
 out=ROOT/'mobile/src/lib/neetPgExamYears.json'
 out.write_text(json.dumps({'bankId':bank['id'],'questions':labels},separators=(',',':'))+'\n')
 print(f'{len(labels)}/{len(bank["records"])} NEET questions joined to source-year receipts')
if __name__=='__main__':build()
