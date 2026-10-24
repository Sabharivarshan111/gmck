"""Rebuild the scoped reference snapshot; never infer missing fine anatomy as verified."""
import json,re,pathlib,collections,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[2]; OUT=ROOT/'src/simulator/data/structureDetails'; SOURCES=ROOT/'docs/anatomy-reference-snapshots'
def clean(v):
 v=re.sub(r'【[^†]+†([^】]+)】',r'\1',v);v=re.sub(r'\^\{.*?\}|\[\d+\]','',v);v=re.sub(r'[_^]\{([^}]+)\}',r'\1',v);return re.sub(r'\s+',' ',v).strip(' ;')
def norm(v):
 v=v.lower().replace('thoraco-acromial','thoracoacromial');v=re.sub(r'\b(left|right|set of|muscles?|the)\b',' ',v);return re.sub(r'\s+',' ',v).strip()
rows=[];pending=''
for line in (SOURCES/'muscles.txt').read_text().splitlines():
 if ' | ' not in line and not pending:continue
 pending+=(' ' if pending else '')+line
 if pending.count(' | ')<9:continue
 c=[clean(x) for x in pending.split(' | ')];pending=''
 if len(c)!=10 or c[0] in ['Muscle','---']:continue
 rows.append(dict(zip(['name','region','origin','insertion','supply','innervation','action','antagonist','instances','ta'],c)))
profiles={}
for i,row in enumerate(rows):
 profiles['muscle_'+str(i)]={k:(None if not v or '?' in v else v) for k,v in row.items() if k not in ['instances','ta','antagonist']};profiles['muscle_'+str(i)].update(kind='muscle',source='muscle-table')
# Preserve named subdivisions when grouping a whole muscle reference.
composites={'digastric':['digastric, anterior belly','digastric, posterior belly'],'omohyoid':['omohyoid, superior belly','omohyoid, inferior belly'],'genioglossus':['genioglossus, inferior fibers','genioglossus, middle fibers','genioglossus, superior fibers'],'adductor magnus':['adductor magnus, adductor part','adductor magnus, ischiocondylar part'],'spinalis':['spinalis capitis','spinalis colli','spinalis thoracis'],'lateral lumbar intertransversarius':['intertransversarii, lateral lumborum, dorsal parts 1–5','intertransversarii, lateral lumborum, ventral parts 1–5'],'posterior cervical intertransversarii':['intertransversarii, lateral posterior colli 1–7','intertransversarii, medial posterior colli 1–7'],'thyro-arytenoid':['thyroarytenoid, external part','thyroarytenoid, thyroepiglottic part']}
for name,names in composites.items():
 rs=[r for r in profiles.values() if r['name'] in names]
 if rs:profiles['muscle_'+name]={'name':name,'kind':'muscle','source':'muscle-table',**{f:'; '.join(dict.fromkeys(r[f] for r in rs if r.get(f))) or None for f in ['origin','insertion','innervation','action','supply']}}
fixes={
 'frontalis':{'origin':'Epicranial aponeurosis','insertion':'Skin of forehead and eyebrows'},'platysma':{'origin':'Superficial fascia over upper pectoralis major and deltoid','insertion':'Lower border of mandible and skin of lower face'},'mylohyoid':{'insertion':'Median mylohyoid raphe and body of hyoid'},'stylohyoid':{'insertion':'Body of hyoid near its junction with greater horn'},'temporalis':{'origin':'Temporal fossa and deep temporal fascia'},
 'masseter, superficial part':{'action':'Elevates mandible and assists protrusion'},'masseter, deep part':{'origin':'Posterior and deep zygomatic arch','action':'Elevates mandible and assists retrusion'},'supinator':{'innervation':'Deep branch of radial nerve (C6–C7)'},'biceps brachii':{'innervation':'Musculocutaneous nerve (C5–C6)'},
 'puboanalis (puborectalis)':{'insertion':'Sling behind anorectal junction joining opposite side'},'superior gemellus':{'insertion':'Medial greater trochanter with obturator internus tendon'},'external anal sphincter, subcutaneous, superficial, and deep parts':{'origin':'Perineal body anteriorly; fibers surround anal canal','insertion':'Anococcygeal raphe; deep fibers blend with puborectalis','innervation':'Inferior rectal branches of pudendal nerve (S2–S4), with direct sacral contribution'},
 'hemidiaphragm, lumbar/costal/sternal part':{'origin':'Posterior xiphoid, inner lower six ribs/costal cartilages, lumbar crura and arcuate ligaments','insertion':'Central tendon','innervation':'Phrenic nerves (C3–C5), motor; peripheral sensory also by lower intercostal nerves'},
 'opponens digiti minimi muscle of foot (opponens digiti quinti)':{'origin':'Variable deep fibers associated with flexor digiti minimi brevis, fifth metatarsal base and long plantar ligament','insertion':'Lateral distal fifth metatarsal','innervation':'Lateral plantar nerve','action':'Draws fifth metatarsal medially; variable and often not distinct'}
}
for r in profiles.values():r.update(fixes.get(r['name'],{}))
index={norm(r['name']):k for k,r in profiles.items()}
ma={
 'infraspinatus':'infraspinatus','external oblique':'external abdominal oblique','internal oblique':'internal abdominal oblique','iliocostalis cervicis':'iliocostalis colli','longissimus cervicis':'longissimus colli','splenius cervicis':'splenius colli','semispinalis cervicis':'semispinalis colli (cervicis)','uvular':'uvulae','flexor accessorius':'quadratus plantae','transverse arytenoid':'arytenoid, transverse','lateral crico-arytenoid':'cricoarytenoid, lateral','posterior crico-arytenoid':'cricoarytenoid, posterior','aryepiglotticus':'arytenoid, oblique, aryepiglottic part',
 'inferior oblique':'oblique, inferior','superior oblique':'oblique, superior','inferior rectus':'rectus, inferior','superior rectus':'rectus, superior','medial rectus':'rectus, medial','lateral rectus':'rectus, lateral',
 'lumbrical (foot)':'lumbricals of foot 1–4','plantar interosseous (foot)':'plantar interossei 1–3','lumbricals (hand)':'lumbricals of hand 1–4','palmar interossei (hand)':'palmar interossei 1–3','flexor digiti minimi brevis (hand)':'flexor digiti minimi (hand)','opponens digiti minimi (foot)':'opponens digiti minimi of foot (opponens digiti quinti)',
 'gemellus inferior':'inferior gemellus','gemellus superior':'superior gemellus','puborectalis':'puboanalis (puborectalis)','ascending part of trapezius':'trapezius, ascending part','descending part of trapezius':'trapezius, descending part','transverse part of trapezius':'trapezius, transverse part','levatores costarum breves':'levatores costarum, breves 1–12','levatores costarum longi':'levatores costarum, longi 1–4','lumbar rotator':'rotatores lumborum','cervical rotator':'rotatores colli','thoracic rotator':'rotatores, short 1–11',
 'medial lumbar intertransversarius':'intertransversarii, medial lumborum 1–5','interspinalis thoracis':'interspinales thoracis 1–3','interspinales cervicis':'interspinales colli 1–6','interspinales lumborum':'interspinales lumborum 1–4','anterior cervical intertransversarii':'intertransversarii, anterior colli 1–7','rectus capitis anterior':'rectus capitis, anterior','rectus capitis lateralis':'rectus capitis, lateralis','rectus capitis posterior major':'rectus capitis, posterior major','rectus capitis posterior minor':'rectus capitis, posterior minor','obliquus capitis inferior':'obliquus capitis, inferior','obliquus capitis superior':'obliquus capitis, superior','oblique arytenoid':'arytenoid, oblique','oblique part of cricothyroid':'cricothyroid, oblique part','straight part of cricothyroid':'cricothyroid, straight part','diaphragm':'hemidiaphragm, lumbar/costal/sternal part'
}
# Parse only labelled infobox fields, with no free-prose guessing of anatomy.
for batch in json.loads((SOURCES/'vessels.json').read_text()):
 for item in batch['content']:
  if item['type']!='text':continue
  for block in re.split(r'\n-{10,}\n',item['text']):
   m=re.match(r'(.+?) - Wikipedia \((https://en.wikipedia.org/[^)]+)\)',block)
   if not m:continue
   name,url=m.groups();fields={};field=None
   labels=['Source','Branches','Tributaries','Drains to','Drains from','Supplies']
   for line in block.splitlines():
    l=re.sub(r'^L\d+: ?','',line);match=re.match(r'^([^|]+?)\s*\|\s*(.*)',l) or re.match(r'^(Source|Branches|Drains to|Drains from|Supplies)(?=【|[A-Z])(.+)',l)
    if match:
     k=clean(match[1]);field=k if k in labels else None
     if field:fields[field]=clean(match[2])
    elif re.match(r'^\s*(?:#|\[【|---)',l) or l.strip() in ['Details','Identifiers'] or 'Anatomical terminology' in clean(l):field=None
    elif field and clean(l):fields[field]+='; '+clean(l)
   if not fields:continue
   kind='vein' if any(t in name.lower() for t in ['vein','venous','vena cava','coronary sinus']) else 'artery'
   profiles[name.lower()]={'name':name,'kind':kind,'source':url,'origin':fields.get('Source'),'branches':fields.get('Branches'),'tributaries':fields.get('Tributaries') or (fields.get('Source') if kind=='vein' else None),'drainsTo':fields.get('Drains to'),'supply':fields.get('Supplies') or fields.get('Drains from')}
# Hand-reviewed overrides remain separate and survive reproducible imports.
profiles.update(json.loads((OUT/'reviewed.json').read_text()))
va={'deep brachial artery':'deep artery of arm','celiac trunk':'celiac artery','hepatic artery':'hepatic artery proper','anterior interventricular artery':'left anterior descending artery','anterior descending branch of coronary artery':'left anterior descending artery','anterior interventricular branch of coronary artery':'left anterior descending artery','arch of aorta':'aortic arch','descending thoracic aorta':'thoracic aorta','hepatic portal vein':'portal vein','pre-hepatic portal vein':'portal vein','anterior interventricular vein':'great cardiac vein','posterior vein of ventricle':'posterior vein of the left ventricle','superficial palmar venous arch':'superficial venous palmar arch','fibular vein':'fibular veins','hepatic vein':'hepatic veins','medial brachial vein':'brachial veins','anterior cardiac vein':'anterior cardiac veins','pancreaticoduodenal vein':'pancreaticoduodenal veins','lumbar vein':'lumbar veins','dorsal artery of penis':'dorsal artery of the penis','inferior gluteal vein':'inferior gluteal veins','superior gluteal vein':'superior gluteal veins','lateral sacral vein':'lateral sacral veins','obturator vein':'obturator veins','inferior phrenic artery':'inferior phrenic arteries','middle suprarenal artery':'middle suprarenal arteries','posterior intercostal arteries':'intercostal arteries','subcostal artery':'subcostal arteries','dorsal metacarpal vein':'dorsal metacarpal veins','palmar metacarpal vein':'palmar metacarpal veins','ileal vein':'ileal veins','ileal artery':'ileal arteries','palmar metacarpal artery':'palmar metacarpal arteries','inferior medial genicular artery':'medial inferior genicular artery','superior pulmonary vein':'pulmonary vein','inferior pulmonary vein':'pulmonary vein','marginal colic artery':'marginal artery of the colon','marginal artery of colon':'marginal artery of the colon','radialis indicis':'radial artery of index finger','princeps pollicis':'princeps pollicis artery','plantar venous arch of foot':'plantar venous arch','dorsal venous arch of foot':'dorsal venous arch of the foot','plantar metatarsal artery':'plantar metatarsal arteries','plantar digital arteries proper':'proper plantar digital arteries','great pancreatic artery':'greater pancreatic artery','esophageal artery':'esophageal arteries','sigmoid artery':'sigmoid arteries','arcuate artery':'arcuate artery of the foot','superficial palmar arterial arch':'superficial palmar arch'}
atlas=json.loads((ROOT/'public/models/atlas.json').read_text())['parts'];parts={};missing=[]
for p in atlas:
 if p['system'] not in ['muscular','arterial','venous'] or p['name'].startswith('Hepatovenous segment'):continue
 b={'name':p['name'],'conceptId':p['conceptId'],'kind':{'muscular':'muscle','arterial':'artery','venous':'vein'}[p['system']]};n=norm(p['name']);key=None
 if b['kind']=='muscle':
  n=re.sub(r'^(first|second|third|fourth) ','',n).replace(' of hand',' (hand)').replace(' of foot',' (foot)');lookup=norm(ma.get(n,n));key=index.get(lookup)
  if not key:
   base=re.sub(r'^.*? (?:part|head|belly) of ','',n);key=index.get(base)
   if not key:
    candidates=[k for k,v in profiles.items() if v['kind']=='muscle' and (norm(v['name']).startswith(base+',') or norm(v['name']).startswith(base+' (') or re.sub(r' [1-9].*','',norm(v['name']))==base)]
    if len(candidates)==1:key=candidates[0]
   if key:b['wholeMuscle']=True
  if 'papillary' in n:key='papillary_left' if 'left ventricle' in p['name'].lower() else 'papillary_right';b['wholeMuscle']=True
  if p['id']=='FJ1450':key='perineal_group';b['wholeMuscle']=True
 else:
  key=va.get(n,n)
  if n=='trunk of coronary artery':key='left coronary artery' if 'left' in p['name'].lower() else 'right coronary artery'
  if key not in profiles and key.startswith('trunk of '):key=va.get(key[9:],key[9:])
  if key not in profiles:
   variants=[key+'s',key.replace('arteries','artery').replace('veins','vein')];key=next((x for x in variants if x in profiles),key)
  if key not in profiles and any(t in n for t in ['branch of ','tributary of ','part of ']):
   parent=re.split(r'\b(?:branch|tributary|part) of ',n,maxsplit=1)[1];candidate=va.get(parent,parent)
   if candidate in profiles:key=candidate;b.update(scope='parent',parent=parent)
  if key not in profiles:key=None
 if key:b['profile']=key
 parts[p['id']]=b
for pid,key in {'FJ2737':'left coronary artery','FJ2723':'right coronary artery','FJ2631':'left anterior descending artery',**{f'FJ{x}':'circumflex artery' for x in range(2649,2655)}}.items():parts[pid]['profile']=key;parts[pid].pop('scope',None)
# Explicit metadata parent links are facts; no invented fine branches.
for pid,b in parts.items():
 if b.get('profile'):continue
 match=re.search(r'\b(branch|tributary) of (.+)',b['name'],re.I)
 if match:
  key='label_'+pid;profiles[key]={'kind':b['kind'],'name':b['name'],'source':'atlas-source',('origin' if match[1].lower()=='branch' else 'drainsTo'):match[2],'scopeNote':'The parent is stated in the source mesh name. Further named subdivisions are not documented.'};b.update(profile=key,scope='label')
# Remaining rows must be explicitly curated, never silently given heart content.
for pid,b in parts.items():
 if not b.get('profile'):missing.append({'id':pid,**b})
sources={'muscle-table':{'title':'Wikipedia contributors · skeletal muscle table, adapted','url':'https://en.wikipedia.org/wiki/List_of_skeletal_muscles_of_the_human_body','license':'CC BY-SA 4.0'},'atlas-source':{'title':'BodyParts3D source concept','url':'https://lifesciencedb.jp/bp3d/'}}
for v in profiles.values():
 for f in list(v):
  if v[f] is None:del v[f]
  elif isinstance(v[f],str):v[f]=clean(v[f])
(OUT/'catalog.json').write_text(json.dumps({'profiles':profiles,'parts':parts,'sources':sources},indent=2)+'\n')
(OUT/'coverage.json').write_text(json.dumps({'meshes':len(parts),'byKind':dict(collections.Counter(b['kind'] for b in parts.values())),'mapped':len(parts)-len(missing),'unmapped':missing,'sourceSha256':{n:hashlib.sha256((SOURCES/n).read_bytes()).hexdigest() for n in ['muscles.txt','vessels.json']}},indent=2)+'\n')
print('Mesh references',len(parts)-len(missing),'/',len(parts),'remaining',len(missing))
