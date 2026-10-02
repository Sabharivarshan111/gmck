"""Audit saved TXT without reading PDFs or changing unconfirmed medical wording."""
import argparse,csv,json,re,hashlib,unicodedata
from pathlib import Path
from collections import Counter
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('output',type=Path);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
rows=json.loads((a.source/'verified-ledger.json').read_text())
old={r['id']:r for r in csv.DictReader((a.source/'Ledger_OCR_comparison.csv').open())}
stop=set('a an the of and in to for with what how is are was were or its this that on at from by describe discuss mention give write outline management diagnosis clinical features investigations treatment patient year old years probable most'.split())
def normalize(s):
 s=unicodedata.normalize('NFKC',s).replace('\u00ad','')
 return re.sub(r'(?<=[A-Za-z])-\s*\n\s*(?=[A-Za-z])','',s)
def token(w):
 w=w.lower().replace('isation','ization').replace('ising','izing')
 if len(w)>5 and w.endswith('ies'):return w[:-3]+'y'
 if len(w)>4 and w.endswith('s') and not w.endswith(('ss','us','is')):return w[:-1]
 return w
def tokens(s):return {token(w) for w in re.findall(r'[a-z]+',normalize(s).lower()) if len(w)>2 and w not in stop}
def refs(s,year):
 s=normalize(s)
 if year=='first':return {m.group(1).lower()[:3]+m.group(2) for m in re.finditer(r'\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*[,.:]?\s*([0-9]{2})(?!\d)',s,re.I)}
 out=set()
 for m in re.finditer(r'\bKU\s*[,.:]?\s*((?:[0-9]{2}[\s,./]*)*)',s,re.I):out.add('ku');out.update('ku'+x for x in re.findall(r'\d{2}',m.group(1)))
 return out
texts={};cache={};results=[]
for row in rows:
 key=(row['year'],row['pdfPage'])
 if key not in cache:
  parts=[]
  for n in range(key[1]-1,key[1]+2):
   f=a.source/'pages'/f'{key[0]}-{n:03d}.txt'
   if f.exists():parts.append(f.read_text())
  combined='\n'.join(parts);cache[key]=(tokens(combined),refs(combined,key[0]))
 observed,seen=cache[key];q=tokens(row['question']);recall=max(len(q&observed)/max(1,len(q)),float(old[row['id']]['question_token_recall']));missing=[x for x in row['examRefs'] if re.sub(r'\s+','',x.lower()) not in seen]
 flag='TEXT_AND_REFS_LOCATED' if recall>=.75 and not missing else 'UNCERTAIN_TEXT_MATCH'
 results.append(dict(id=row['id'],year=row['year'],subject=row['subjectKey'],topic=row['topicKey'],question=row['question'],exam_refs='|'.join(row['examRefs']),old_status=old[row['id']]['review_flag'],status=flag,token_recall=round(recall,3),unlocated_tokens='|'.join(sorted(q-observed)),unlocated_refs='|'.join(missing)))
with (a.output/'KUHS_TXT_comparison.csv').open('w') as f:
 w=csv.DictWriter(f,results[0].keys(),lineterminator='\n');w.writeheader();w.writerows(results)
lines=['KUHS QUESTION BANK — TXT WORKING COPY',f'{len(rows)} preserved question entries. Exam references retain the reviewed catalog values.','This readable copy removes PDF page metadata. Raw OCR uncertainty is recorded separately.','']
for row in rows:
 lines.extend([f"[{row['id']}] {row['year'].upper()} | {row['subjectKey']} | {row['topicKey']} | {row['kind']}",row['question'],'Exam references: '+', '.join(row['examRefs']),''])
(a.output/'KUHS_questions_clean.txt').write_text('\n'.join(lines))
counts=Counter(r['status'] for r in results);resolved=[r for r in results if r['old_status']=='CHECK_IMAGE' and r['status']=='TEXT_AND_REFS_LOCATED']
summary={'entries':len(rows),'status_counts':dict(counts),'previous_flags_now_located_after_text_normalization':len(resolved),'changed_question_wording':0,'changed_exam_references':0,'normalization':['Unicode NFKC','joined line-break hyphenation','singular/plural comparison','British/American -isation variants','full month names and date punctuation'],'limitations':['Token/reference location is a locator, not proof that a reference belongs to that question.','No PDF read; unlocated words and years remain unresolved rather than guessed.'],'working_txt_sha256':hashlib.sha256((a.output/'KUHS_questions_clean.txt').read_bytes()).hexdigest()}
(a.output/'TXT_audit_summary.json').write_text(json.dumps(summary,indent=2)+'\n')
(a.output/'TXT_comparison_queue.txt').write_text('\n\n'.join(f"[{r['id']}] {r['question']}\nRefs: {r['exam_refs']}\nNot located: {r['unlocated_tokens']}\nReferences not located: {r['unlocated_refs']}" for r in results if r['status']=='UNCERTAIN_TEXT_MATCH'))
print(json.dumps(summary))
