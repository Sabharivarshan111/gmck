"""Verify reviewed identities in the actual public web payload, without credentials."""
import hashlib,json,os,re,time,urllib.parse,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
rows=[]
for p in sorted((ROOT/'src/data/universityPapers').glob('reviewedBatch*.ts')):
 m=re.search(r'export const \w+\s*=\s*(\[.*\])\s+satisfies',p.read_text(),re.S)
 assert m,p
 rows.extend(json.loads(m.group(1)))
ids={r['id'] for r in rows};assert rows and len(ids)==len(rows)
TARGETS=['https://orbitmbbs.vercel.app','https://www.orbitmbbs.site']
ASSET_CACHE={}
def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':'ORBIT-owned-bank-publication-check/1.0','Cache-Control':'no-cache'})
 with urllib.request.urlopen(req,timeout=45) as resp:
  data=resp.read(40000001);assert len(data)<40000001,'Public response exceeds verification limit'
  return resp.geturl(),data

def verify(base,attempt):
 page_url,html=get(base+'/?orbit-bank-check='+str(len(ids))+'&attempt='+str(attempt))
 origin=urllib.parse.urlsplit(page_url);origin=f'{origin.scheme}://{origin.netloc}'
 assert origin in TARGETS,origin
 js={urllib.parse.urljoin(origin+'/',s) for s in re.findall(r'<script[^>]+src=["\']([^"\']+\.js)["\']',html.decode(),re.I)}
 try:
  _,raw=get(origin+'/orbit-offline-assets.json?orbit-bank-check='+str(len(ids))+'&attempt='+str(attempt));manifest=json.loads(raw)
  assert isinstance(manifest,list)
  js.update(urllib.parse.urljoin(origin+'/',x) for x in manifest if isinstance(x,str) and x.endswith('.js') and '/assets/' in urllib.parse.urlsplit(urllib.parse.urljoin(origin+'/',x)).path)
 except Exception as exc:
  print('Manifest unavailable; checking HTML modules:',str(exc)[:140],flush=True)
 assert js,'No emitted JavaScript listed'
 payload=bytearray();assets=[]
 for url in sorted(js):
  u=urllib.parse.urlsplit(url);assert f'{u.scheme}://{u.netloc}'==origin and u.path.startswith('/assets/'),url
  if url not in ASSET_CACHE:ASSET_CACHE[url]=get(url)
  final,data=ASSET_CACHE[url];assert final==url,final
  assets.append({'url':url,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()});payload.extend(data);payload.extend(b'\n')
 missing=[s for s in ids if s.encode() not in payload]
 assert not missing,f'{len(missing)} of {len(ids)} reviewed IDs are not served yet'
 _,sw=get(origin+'/sw.js?orbit-bank-check='+str(len(ids)))
 assert b'v38-muhs-batch26-1000-2026-11-02' in sw,'Offline cache revision has not propagated'
 return {'requestedOrigin':base,'finalOrigin':origin,'reviewedIdsFound':len(ids),'missing':0,'assets':assets,'combinedBytes':len(payload),'combinedSHA256':hashlib.sha256(payload).hexdigest(),'offlineCacheRevision':'v38-muhs-batch26-1000-2026-11-02'}
result={}
for attempt in range(1,61):
 for target in TARGETS:
  if target in result:continue
  try:result[target]=verify(target,attempt);print('PASS live payload',target,len(ids),'IDs',flush=True)
  except Exception as exc:print('Waiting for production',target,str(exc)[:220],flush=True)
 if len(result)==len(TARGETS):break
 time.sleep(10)
assert len(result)==len(TARGETS),'Production publication did not verify within this run'
receipt={'sourceCommit':os.getenv('GITHUB_SHA'),'reviewedQuestionCount':len(ids),'verification':'actual production JavaScript bytes and service worker','origins':list(result.values())}
out=ROOT/'artifacts/university-publication';out.mkdir(parents=True,exist_ok=True);(out/'LIVE_UNIVERSITY_BANK_VERIFICATION.json').write_text(json.dumps(receipt,indent=2)+'\n')
print('PUBLICATION_RECEIPT '+json.dumps(receipt,separators=(',',':')),flush=True)
