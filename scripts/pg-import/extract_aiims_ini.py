import re,json,fitz
from pathlib import Path
import argparse
parser=argparse.ArgumentParser(description='Extract recall candidates into private staging, without generating answers.')
parser.add_argument('--sources',type=Path,required=True)
args=parser.parse_args()
P=args.sources
from html.parser import HTMLParser
class HtmlText(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts=[]; self.skip=0
    def handle_starttag(self, tag, attrs):
        if tag in ('script','style'): self.skip+=1
        if tag in ('p','div','br','h1','h2','h3','li','tr'): self.parts.append('\n')
    def handle_endtag(self, tag):
        if tag in ('script','style'): self.skip=max(0,self.skip-1)
        if tag in ('p','div','h1','h2','h3','li','tr'): self.parts.append('\n')
    def handle_data(self, data):
        if not self.skip: self.parts.append(data)
rows=[]

for f in P.glob('aiims*.html'):
 parser=HtmlText();parser.feed(f.read_text());text=''.join(parser.parts);text=re.sub(r'\n\s*\n+','\n',text)
 parts=re.split(r'Question\.\s*\d+\s*\n',text)
 for n,b in enumerate(parts[1:],1):
  head=b.split('Correct Ans:',1)
  if len(head)!=2:continue
  key=head[1].splitlines()[0].strip();head=re.sub(r'AIIMS\s*PG\s*(?:May|Nov|JUNE)\s*[-–]?\s*20\d\d','',head[0],flags=re.I)
  opts=re.split(r'(?m)^\s*([A-D])\.\s*',head)
  if len(opts)!=9 or key not in 'ABCD' or len(key)!=1:continue
  q=' '.join(opts[0].split());ops=[' '.join(x.split()).strip('| ').strip() for x in opts[2::2]]
  if not q or not all(ops):continue
  r=dict(id=f.stem+':'+str(n),source=f.name,source_number=n,question=q,options=ops,key=key)
  rows.append(r)
for f in P.glob('INI_CET*Question_Paper*.pdf'):
 text='\n'.join(pg.get_text(sort=True) for pg in fitz.open(f));text=re.sub(r'(?m)^\s*(?:INI\s*CET[^\n]*PDF|INICET[^\n]*PDF|www\.prepp\.in)\s*$','',text)
 year=int(re.search(r'20\d\d',f.name)[0]);m=re.search(r'Question_Paper_(0[12])',f.name);sid=f'ini-{year}-'+(m[1] if m else '01')
 keyfiles=list(P.glob(f'INI_CET_{year}*Answer_Key*.pdf'))
 if len(keyfiles)>1:keyfiles=[k for k in keyfiles if ('Key_'+(m[1] if m else '01')+'_') in k.name or ('PDF_'+(m[1] if m else '01')+'_') in k.name]
 keys={}
 if len(keyfiles)==1:
  ks='\n'.join(pg.get_text(sort=True) for pg in fitz.open(keyfiles[0]));keys={int(n):a.upper() for n,a in re.findall(r'Q\s*(\d+)\s*\.\s*\(([a-d])\)',ks,re.I)}
 parts=re.split(r'(?m)^\s*(?:Question\s+|Q\s*\.?\s*)(\d{1,3})\s*[.:]?\s*',text)
 for i in range(1,len(parts),2):
  n=int(parts[i]);body=re.sub(r'(?m)^\s*(?:Subject|Topic|Sub-Topic):[^\n]*\n?','',parts[i+1]);body=re.sub(r'^\s*Question:\s*','',body)
  if re.search(r'(?m)^\s*O1:',body):
   op=re.split(r'(?m)^\s*O([1-4]):\s*',body)
  else:op=re.split(r'(?m)^\s*([A-Da-d1-4])\s*[.)]\s*',body)
  if len(op)!=9:continue
  q=' '.join(op[0].split());opts=[' '.join(x.split()) for x in op[2::2]]
  if not q or not all(opts):continue
  rows.append(dict(id=sid+':'+str(n),source=f.name,source_number=n,question=q,options=opts,key=keys.get(n)))
f=next(P.glob('INICET_May_2026*.pdf'));s='\n'.join(pg.get_text(sort=True) for pg in fitz.open(f));s=re.sub(r'diginerve.com[^\n]*|INICET May 2026[^\n]*','',s)
for n,b in enumerate(re.split(r'(?m)^Q\.\s*',s)[1:],1):
 a=re.search(r'Answer:\s*([A-D])',b)
 if not a:continue
 h=b[:a.start()];op=re.split(r'(?m)^\s*([A-D])\.\s*',h)
 if len(op)!=9:continue
 rows.append(dict(id='ini-2026-may:'+str(n),source=f.name,source_number=n,question=' '.join(op[0].split()),options=[' '.join(x.split()) for x in op[2::2]],key=a[1]))

(P/'candidates.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print('Extracted',len(rows),'private candidate rows; no runtime bank changed.')
