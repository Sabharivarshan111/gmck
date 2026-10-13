#!/usr/bin/env python3
"""CI runner only: private credential use, private checkpoint, counts-only logs."""
import importlib.util
import json
import os
from pathlib import Path
import sys
import urllib.request

spec=importlib.util.spec_from_file_location('prepare',Path(__file__).with_name('prepare-pg-explanations.py'))
prepare=importlib.util.module_from_spec(spec)
spec.loader.exec_module(prepare)

def main():
    # Validate selection before reading credentials or doing network work.
    offset=int(os.environ.get('PG_START_OFFSET','9'))
    limit=int(os.environ.get('PG_BATCH_LIMIT','10'))
    if not 0 <= offset < 186930 or not 1 <= limit <= 100:
        raise ValueError('Invalid evidence batch selection')
    token=next((os.environ.get(n) for n in ('SUPABASE_ACCESS_TOKEN','SUPABASE_TOKEN','SUPABASE_PAT') if os.environ.get(n)),None)
    if not token:
        raise RuntimeError('Existing Supabase runner credential is unavailable')
    project='pmtgeydtqypwrypshhsx'
    req=urllib.request.Request('https://api.supabase.com/v1/projects/'+project+'/api-keys',headers={'Authorization':'Bearer '+token})
    with urllib.request.urlopen(req,timeout=30) as response:
        keys=json.load(response)
    service=next((x['api_key'] for x in keys if x.get('name')=='service_role'),None)
    if not service:
        raise RuntimeError('Private-storage runner credential unavailable')
    url='https://'+project+'.supabase.co'
    os.environ['SUPABASE_URL']=url
    os.environ['SUPABASE_SERVICE_ROLE_KEY']=service
    work=Path('/tmp/orbit-pg-private')
    db=prepare.database(work/'progress.sqlite')
    db.close()
    # No model API: evidence is prepared for the assistant to read and reason over.
    sys.argv=[sys.argv[0],'--work-dir',str(work),'--download','--web-fallback','--limit',str(limit),'--offset',str(offset)]
    if os.environ.get('PG_MISSING_ONLY','false')=='true':
        sys.argv.append('--missing-only')
    prepare.main()
    evidence=json.loads((work/'evidence.json').read_text())
    batch=os.environ.get('GITHUB_SHA','pilot')
    if not __import__('re').fullmatch(r'[0-9a-f]{40}|pilot',batch):
        raise RuntimeError('Invalid batch identifier')
    run=os.environ.get('GITHUB_RUN_ID','0')
    attempt=os.environ.get('GITHUB_RUN_ATTEMPT','1')
    if not run.isdigit() or not attempt.isdigit() or len(run)>15 or len(attempt)>3:
        raise RuntimeError('Invalid run identifier')
    batch+='-'+run+'-'+attempt
    payload=json.dumps(evidence).replace("'","''")
    sql="insert into private_pg_work.evidence_batches(id,payload) values('"+batch+"','"+payload+"'::jsonb) on conflict(id) do update set payload=excluded.payload, created_at=now();"
    req=urllib.request.Request('https://api.supabase.com/v1/projects/'+project+'/database/query',data=json.dumps({'query':sql}).encode(),method='POST',headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=60) as response:
        response.read()
    print('Evidence batch '+batch+' saved in a private schema; no AI provider calls or publication.')

if __name__=='__main__':
    try:
        main()
    except Exception:
        print('Pilot stopped: credential, storage, provider or network check failed. No publication occurred.',file=sys.stderr)
        raise SystemExit(1) from None
