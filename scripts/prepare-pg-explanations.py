#!/usr/bin/env python3
"""Private, resumable PG explanation preparation. Never publishes source text or keys."""
import argparse
import hashlib
import html
import json
import os
from pathlib import Path
import re
import sqlite3
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
STOP = set('which following statement statements true false except most best patient years year age all with from this that what does have has are and the for not'.split())

def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()

def request(url, key=None, body=None, method=None):
    headers = {'Content-Type': 'application/json'}
    if key:
        headers.update({'Authorization': 'Bearer '+key, 'apikey': key})
    req = urllib.request.Request(url, data=None if body is None else json.dumps(body).encode(), headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=100) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        # Never log request headers, signed URLs, response bodies or provider errors.
        raise RuntimeError('HTTP '+str(e.code)) from None

def database(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path)
    db.execute('pragma journal_mode=WAL')
    db.execute('create virtual table if not exists passages using fts5(id UNINDEXED, source UNINDEXED, text)')
    db.execute('create table if not exists sources(id text primary key, sha text, bytes integer)')
    db.execute('create table if not exists results(id text primary key, input_hash text, status text, payload text, updated integer)')
    return db

def index_text(db, name, text):
    sha = digest(text)
    old = db.execute('select sha from sources where id=?', (name,)).fetchone()
    if old and old[0] == sha:
        return
    db.execute('delete from passages where source=?', (name,))
    words = text.split()
    for start in range(0, len(words), 300):
        chunk = ' '.join(words[start:start+400])
        if len(chunk) >= 150:
            db.execute('insert into passages values(?,?,?)', (digest(name+':'+sha+':'+str(start))[:24], name, chunk))
    db.execute('insert or replace into sources values(?,?,?)', (name, sha, len(text.encode())))
    db.commit()

def retrieve(db, query):
    terms = sorted(set(t for t in re.findall(r'[a-zA-Z]{3,}', query.lower()) if t not in STOP))[:40]
    anchor = None
    if re.search(r'\btiva\b|total.{0,15}venous',query,re.I):
        terms += ['propofol','tiva']
        anchor = re.compile(r'propofol|\btiva\b|total.{0,15}intravenous',re.I)
    elif re.search(r'malignant\s+hyperthermia',query,re.I):
        anchor = re.compile(r'malignant\s+hyperthermia',re.I)
    if not terms:
        return []
    rows = db.execute('select id,source,text from passages where passages match ? order by bm25(passages) limit 60', (' OR '.join('"'+t+'"' for t in terms),)).fetchall()
    return [{'id': r[0], 'source': r[1], 'text': r[2]} for r in rows if (anchor is None or anchor.search(r[2])) and sum(t in r[2].lower() for t in terms) >= min(4, len(terms))][:6]

def storage_files(url, key):
    pending = ['']
    while pending:
        prefix = pending.pop()
        offset = 0
        while True:
            items = json.loads(request(url+'/storage/v1/object/list/textbooks', key, {'prefix': prefix, 'limit':100, 'offset':offset, 'sortBy':{'column':'name','order':'asc'}}))
            for item in items:
                name = (prefix+'/' if prefix else '')+item['name']
                if item.get('id') is None:
                    pending.append(name)
                elif name.lower().endswith('.txt'):
                    yield name
            if len(items) < 100:
                break
            offset += len(items)

def download_textbooks(db, directory, url, key):
    directory.mkdir(parents=True, exist_ok=True)
    os.chmod(directory, 0o700)
    count = 0
    for name in storage_files(url, key):
        # Remote paths never become local filenames; no traversal and no title leaks.
        target = directory/(digest(name)+'.txt')
        data = request(url+'/storage/v1/object/authenticated/textbooks/'+urllib.parse.quote(name, safe='/'), key)
        if len(data) > 30_000_000:
            raise ValueError('Oversized source')
        target.write_bytes(data)
        os.chmod(target, 0o600)
        index_text(db, name, data.decode('utf-8-sig', errors='replace'))
        count += 1
    return count

def questions():
    excluded = {r['id'] for r in json.loads((ROOT/'docs/PG_CORPUS_QUARANTINE_20261011.json').read_text())['rows']}
    holds = json.loads((ROOT/'docs/PG_MEDICAL_REVIEW_HOLDS.json').read_text())
    groups = {}
    for file in sorted((ROOT/'mobile/src/lib/pgPacks').glob('*_undated_*.ts')):
        if not re.match(r'^(general_medical|neet_pg)_undated_\d+\.ts$',file.name):
            continue
        text = file.read_text()
        def array(label):
            match = re.search(r'const '+label+r'[^=]*=\s*(\[.*?\]);', text, re.S)
            return json.loads(match[1])
        subjects, rows = array('SUBJECTS'), array('ROWS')
        for r in rows:
            if r[0] not in excluded:
                groups.setdefault(subjects[r[8]], []).append(r)
    # Match JS locale ordering for these English source subject names.
    for pack, subject in enumerate(sorted(groups, key=str.casefold)):
        for offset, r in enumerate(groups[subject]):
            record_id = f'medmcqa-practice-s{pack:02d}-{offset}'
            if record_id in holds:
                continue
            yield {'id':record_id, 'subject':subject, 'question':r[1], 'options':r[2:6], 'supplied_answer':'ABCD'[r[6]], 'existing_explanation':r[7]}

def select_questions(items, offset=0, only_ids=(), missing_only=False, prepared_ids=()):
    """Offset counts eligible records; IDs remain tied to their original ordinals."""
    eligible = 0
    for q in items:
        if only_ids and q['id'] not in only_ids:
            continue
        if missing_only and (q['existing_explanation'].strip() or q['id'] in prepared_ids):
            continue
        if eligible >= offset:
            yield q
        eligible += 1

def image_required(q):
    return bool(re.search(r'\b(image|photograph|radiograph|diagram|waveform|micrograph|figure|picture)\b.{0,55}\b(shown|below|above|given|following|seen)\b|\b(shown|below|above)\b.{0,55}\b(image|figure|ecg|x.ray)\b', q['question'], re.I)) or set(q['options']) == set('ABCD')

def web_evidence(q):
    # Primary research fallback, rather than forum or coaching answer keys.
    # Abstracts are kept private; they do not establish current guideline validity.
    terms = [t for t in re.findall(r'[A-Za-z]{4,}', q['question']) if t.lower() not in STOP][:10]
    query = ' '.join(terms)
    endpoint = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?'+urllib.parse.urlencode({'query':query,'format':'json','resultType':'core','pageSize':3})
    result = json.loads(request(endpoint))
    evidence = []
    for item in result.get('resultList', {}).get('result', []):
        abstract = html.unescape(re.sub('<[^>]+>', ' ', item.get('abstractText','')))
        if len(abstract) < 200:
            continue
        source = 'https://europepmc.org/article/'+item.get('source','MED')+'/'+item['id']
        evidence.append({'id':digest(source)[:24], 'source':source, 'text':item.get('title','')+'; '+item.get('pubYear','')+'; '+abstract[:2400]})
    return evidence

def validate(candidate, q, passages):
    if candidate.get('status') != 'source_supported_draft' or candidate.get('answer') != q['supplied_answer']:
        return False
    text = candidate.get('explanation','')
    ids = candidate.get('evidence_ids',[])
    if not isinstance(text,str) or not 80 <= len(text) <= 1200 or not ids or not set(ids) <= {p['id'] for p in passages}:
        return False
    if candidate.get('independently_medically_reviewed') is not False:
        return False
    # Reject substantial verbatim copying from every retrieved passage.
    tokens = re.findall(r'\w+', text.lower())
    source_text = ' '.join(re.findall(r'\w+', ' '.join(p['text'] for p in passages).lower()))
    return not any(' '.join(tokens[i:i+14]) in source_text for i in range(max(0,len(tokens)-13)))

def save(db, q, status, payload):
    fingerprint = digest(json.dumps(q, sort_keys=True))
    db.execute('insert or replace into results values(?,?,?,?,?)', (q['id'],fingerprint,status,json.dumps(payload),int(time.time())))
    db.commit()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--work-dir', type=Path, default=Path('/tmp/orbit-pg-private'))
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--web-fallback', action='store_true')
    parser.add_argument('--limit', type=int, default=10)
    parser.add_argument('--only-id', action='append', default=[])
    parser.add_argument('--offset', type=int, default=0)
    parser.add_argument('--missing-only', action='store_true')
    args = parser.parse_args()
    if not 1 <= args.limit <= 186930 or not 0 <= args.offset < 186930:
        parser.error('Invalid run limits')
    args.work_dir.mkdir(parents=True,exist_ok=True)
    os.chmod(args.work_dir,0o700)
    db = database(args.work_dir/'progress.sqlite')
    url = os.environ.get('SUPABASE_URL','').rstrip('/')
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY','')
    if args.download:
        if not url.startswith('https://') or not key:
            raise SystemExit('Private-storage credentials unavailable; no public access was enabled.')
    if args.download:
        count = download_textbooks(db,args.work_dir/'texts',url,key)
        print(json.dumps({'private_txt_sources_downloaded':count}))
    processed = 0
    batch = []
    prepared = json.loads((ROOT/'docs/PG_PREPARED_EXPLANATIONS.json').read_text())
    for q in select_questions(questions(),args.offset,args.only_id,args.missing_only,prepared):
        old = db.execute('select input_hash,status from results where id=?',(q['id'],)).fetchone()
        if old and old[0] == digest(json.dumps(q,sort_keys=True)) and old[1] != 'error':
            continue
        if processed >= args.limit:
            break
        processed += 1
        if image_required(q):
            save(db,q,'needs_image_review',{});continue
        passages = retrieve(db,q['question']+' '+' '.join(q['options']))
        if not passages and args.web_fallback:
            passages = web_evidence(q)
        if not passages:
            save(db,q,'no_evidence',{});continue
        save(db,q,'retrieved_only',{'evidence_ids':[p['id'] for p in passages]})
        batch.append({'question':q,'passages':passages})
    (args.work_dir/'evidence.json').write_text(json.dumps(batch))
    counts = dict(db.execute('select status,count(*) from results group by status'))
    (args.work_dir/'progress.json').write_text(json.dumps([dict(zip(['id','input_hash','status','payload','updated'],r)) for r in db.execute('select * from results')]))
    summary = {'processed_this_run':processed,'provider_calls':0,'statuses':counts,'published_explanations':0,'clinically_verified':0}
    (args.work_dir/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps(summary))

if __name__ == '__main__':
    main()
