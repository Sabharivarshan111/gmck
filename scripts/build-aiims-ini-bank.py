#!/usr/bin/env python3
"""Build the reviewed AIIMS/INI recall-practice subset, never a generic dataset.

Source documents stay in caller-owned staging. Only individually selected factual
items, original explanations and existing syllabus paths enter the app. Extraction
alone cannot publish an item; identity fingerprints and an explicit review are required.
"""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[1]

def digest(row):
    value = json.dumps([row['question'], row['options'], row['key']], ensure_ascii=False, separators=(',', ':'))
    return hashlib.sha256(value.encode()).hexdigest()

def prepare(sources, download):
    manifest=json.loads((ROOT/'scripts/aiims-ini-sources.json').read_text())
    def fetch(source):
        target=sources/source['file']
        if not target.exists() and download:
            req=urllib.request.Request(source['url'],headers={'User-Agent':'Mozilla/5.0'})
            with urllib.request.urlopen(req,timeout=60) as response:
                data=response.read(15_000_001)
            if len(data)>15_000_000: raise ValueError('Source exceeds 15 MB: '+source['file'])
            if source['file'].endswith('.pdf') and not data.startswith(b'%PDF-'):
                raise ValueError('Expected PDF: '+source['file'])
            target.write_bytes(data)
        if not target.exists():
            if source['required']:raise ValueError('Missing required source: '+source['file'])
            return
        # WordPress pages vary between requests; selected-item fingerprints pin their text.
        if source['file'].endswith('.pdf') and hashlib.sha256(target.read_bytes()).hexdigest()!=source['sha256']:
            raise ValueError('Source fingerprint changed: '+source['file'])
    with ThreadPoolExecutor(max_workers=5) as pool:list(pool.map(fetch,[s for s in manifest if s['required']]))
    return {s['file']:s for s in manifest}

def build(sources):
    source_index=prepare(sources,False)
    result=json.loads((sources/'candidates.json').read_text())
    candidates={}
    conflicts=set()
    for row in result:
        if row['id'] in candidates and digest(row)!=digest(candidates[row['id']]):conflicts.add(row['id'])
        candidates[row['id']]=row
    for row in json.loads((ROOT/'scripts/aiims-ini-transcribed.json').read_text()):
        if row['id'] in candidates:raise ValueError('Transcription overlaps extraction: '+row['id'])
        candidates[row['id']]=row
    reviews=json.loads((ROOT/'scripts/aiims-ini-reviewed.json').read_text())
    syllabus=json.loads((ROOT/'mobile/src/lib/neetPgStudyData.json').read_text())
    chapters={c['id']:c for c in syllabus['chapters']}
    banks={exam:dict(schema=1,id=f'{exam}-practice-20261021',chapters=[],records=[],images={}) for exam in ['aiims-pg','ini-cet']}
    seen={exam:set() for exam in banks}; seen_ids=set(); receipts=[]; source_words=Counter()
    for review in reviews:
        identity=review['id']
        if identity in seen_ids or identity in conflicts:raise ValueError('Conflicting review identity: '+identity)
        seen_ids.add(identity)
        row=candidates[identity];source=source_index[row['source']]
        if source.get('identityStatus','').startswith('held_'):raise ValueError('Source exam identity is held: '+identity)
        if digest(row)!=review['sourceFingerprint']:raise ValueError('Reviewed source item changed: '+identity)
        if row['key']!=review['answer'] or row['key'] not in ['A','B','C','D']:raise ValueError('Answer mismatch: '+identity)
        if not review['explanation'].strip() or review['chapterId'] not in chapters:raise ValueError('Explanation/chapter missing: '+identity)
        if len(row['options'])!=4 or not all(o.strip() for o in row['options']) or len(set(row['options']))!=4:raise ValueError('Incomplete options: '+identity)
        # This batch contains text-only, single-answer items. Images and multi-selects
        # must be reviewed in their original form in a later batch.
        if any(o.strip() in ['?', '??', 'Not recalled'] for o in row['options']):raise ValueError('Unrecalled option: '+identity)
        source_words[row['source']]+=len(' '.join([row['question']]+row['options']).split())
        if source_words[row['source']]>200:raise ValueError('Selected source excerpt exceeds batch budget: '+row['source'])
        exam=source['exam']; signature=json.dumps([row['question'].casefold(),[o.casefold() for o in row['options']]])
        if signature in seen[exam]:raise ValueError('Duplicate question: '+identity)
        seen[exam].add(signature)
        bank=banks[exam]
        bank['records'].append(dict(id=identity,chapterId=review['chapterId'],question=row['question'],options=row['options'],answerIndex=ord(row['key'])-65,sourceAnswer=row['key'],explanation=review['explanation'],requiresImage=False,imageIds=[],examYear=source['year'],**({'examSession':source['session']} if source.get('session') else {})))
        receipts.append(dict(id=identity,exam=exam,collectionYear=source['year'],examSession=source.get('session'),sourceUrl=source['url'],sourceSha256=source['sha256'],sourceNumber=row['source_number'],numberSemantics='document_or_collection_number_not_authenticated_exam_order',answerOrigin=review.get('answerOrigin','publisher_key_author_checked'),sourceFingerprint=digest(row),chapterId=review['chapterId']))
    for exam,bank in banks.items():
        used={r['chapterId'] for r in bank['records']};bank['chapters']=[c for c in syllabus['chapters'] if c['id'] in used]
        if not bank['records']:raise ValueError('Empty exam bank: '+exam)
    summary=dict(date='2026-10-21',status='reviewed_release_candidate',totalQuestions=len(receipts),examCounts=dict(Counter(r['exam'] for r in receipts)),collectionYearCounts={exam:dict(sorted(Counter(r['collectionYear'] for r in receipts if r['exam']==exam).items())) for exam in banks},sourceDocuments=len(source_index),sourcesUsed=len(source_words),privateExtractedCandidates=len(result),questionProvenance=receipts,limitations=['Partial recall-practice selection, not complete historical papers or authenticated exam wording.','Explanations are original authored educational text; no independent clinical certification claimed.','Text-only single-answer batch. Image-dependent, multiple-answer and disputed items are held.','Document labels and supplied keys can be wrong; source date is not an exam-authentication guarantee.','No generic question dataset was used. No publisher explanations or images were copied.'])
    outputs={ROOT/'mobile/src/lib/aiimsPgBank.json':banks['aiims-pg'],ROOT/'mobile/src/lib/iniCetBank.json':banks['ini-cet']}
    summary['payloadBytes']={p.name:len(json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()) for p,v in outputs.items()}
    outputs[ROOT/'docs/AIIMS_INI_RELEASE_CANDIDATE_20261021.json']=summary
    # Validate everything before touching runtime output; per-file rename prevents
    # partial writes on interruption. Nothing is installed remotely by this script.
    for path,value in outputs.items():
        temp=path.with_suffix(path.suffix+'.tmp');temp.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n');os.replace(temp,path)
    print(json.dumps({k:v for k,v in summary.items() if k!='questionProvenance'},indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--sources',type=Path,required=True);parser.add_argument('--download',action='store_true');args=parser.parse_args();args.sources.mkdir(exist_ok=True,parents=True)
    prepare(args.sources,args.download)
    subprocess.run([sys.executable,str(ROOT/'scripts/pg-import/extract_aiims_ini.py'),'--sources',str(args.sources)],check=True)
    build(args.sources)
