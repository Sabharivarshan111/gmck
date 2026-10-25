"""Explicit regional/parent references; these are not exact micro-branch claims."""
import json,pathlib,re,collections
R=pathlib.Path(__file__).resolve().parents[2];D=R/'src/simulator/data/structureDetails';j=json.loads((D/'catalog.json').read_text());ps=j['profiles'];parts=j['parts'];atlas={p['id']:p for p in json.loads((R/'public/models/atlas.json').read_text())['parts']}
def add(pid,origin,branches=None,drains=None,tributaries=None,note=None,url=None):
 b=parts[pid];key='regional_'+pid;p={'kind':b['kind'],'name':b['name'],'origin':origin,'source':url or 'https://openstax.org/books/anatomy-and-physiology-2e/pages/20-5-circulatory-pathways','scopeNote':note or 'Regional reference: the exact branch pattern can vary.'}
 for f,v in [('branches',branches),('drainsTo',drains),('tributaries',tributaries)]:
  if v:p[f]=v
 ps[key]=p;b.update(profile=key,scope='regional')
for pid,b in parts.items():
 if b.get('profile'):continue
 n=b['name'].lower();plain=re.sub(r'\b(left|right|set of)\b','',n);plain=re.sub(r'\s+',' ',plain).strip();side='Left' if re.search(r'\bleft\b',n) else 'Right' if re.search(r'\bright\b',n) else ''
 if 'proper palmar digital vein' in plain:b.update(profile='proper palmar digital vein',scope='regional');continue
 if 'digital' in plain and b['kind']=='artery':
  b.update(profile='proper palmar digital arteries' if 'proper palmar' in plain else 'common palmar digital arteries' if 'common palmar' in plain else 'dorsal digital arteries',scope='regional');continue
 if 'hepatic artery' in plain:
  add(pid,'Right hepatic arterial system' if plain.startswith(('anterior','posterior')) else 'Usually left hepatic arterial system; segment IV arterial supply varies','Smaller intrahepatic arterial branches',note='Segmental hepatic reference: proximal branching and segment IV origins vary.');continue
 if plain in ['anterior division of renal artery','posterior division of renal artery','ureteric segment of renal artery'] or (plain=='anterior segmental artery' and sum(x[1] for x in atlas[pid]['bounds'])/2<1.25):
  add(pid,'Renal arterial system; named divisions arise from renal artery','Segmental → interlobar → arcuate → cortical radiate branches',note='Renal regional reference; a subdivision may have a variable proximal origin.');continue
 if any(t in plain for t in ['segmental','lingular','lobar']):
  lower='basal' in plain or 'superior segmental' in plain;lingular='lingular' in plain
  if b['kind']=='artery':
   origin='Left superior lobar pulmonary artery' if lingular else side+' lower lobar pulmonary arterial system' if lower else side+' pulmonary artery' if 'lobar' in plain else side+' upper/middle lobar pulmonary arterial system'
   add(pid,origin.strip(),'Subsegmental pulmonary arterial branches',note='Pulmonary segmental reference: the source name does not always encode a complete lobar parent; patterns vary.',url='https://en.wikipedia.org/wiki/Pulmonary_artery')
  else:
   dest='Left superior pulmonary vein' if lingular else side+' inferior pulmonary venous system' if lower else side+' superior pulmonary venous system'
   add(pid,'Intrapulmonary venous channels of the named region',drains=dest.strip(),tributaries='Intrasegmental and intersegmental pulmonary venous channels',note='Pulmonary venous reference: tributary patterns vary and do not mirror arterial segments.',url='https://en.wikipedia.org/wiki/Pulmonary_vein')
  continue
 if any(t in plain for t in ['central sulcus','precentral','prefrontal','parietal artery','lateral frontobasal','anterior temporal artery']):
  add(pid,'Middle cerebral arterial system','Small cortical branches',note='Cortical branch reference: exact stem and branching order vary.',url='https://en.wikipedia.org/wiki/Middle_cerebral_artery');continue
 if plain=='medial frontobasal artery':add(pid,'Anterior cerebral arterial system','Small orbitofrontal branches',url='https://en.wikipedia.org/wiki/Anterior_cerebral_artery');continue
 if plain in ['splenial artery','polar temporal artery'] or 'temporal branches of lateral occipital' in plain:
  add(pid,'Posterior cerebral arterial system; splenial region also has anterior cerebral contributions','Small cortical/callosal branches',url='https://en.wikipedia.org/wiki/Posterior_cerebral_artery');continue
 if 'posterior intercostal artery' in plain:add(pid,'Supreme intercostal artery for the first two spaces','Dorsal, spinal and collateral branches');continue
 if 'calcaneal branches of posterior tibial' in plain:add(pid,'Posterior tibial artery','Small heel branches');continue
 if 'perforating veins' in plain:add(pid,'Superficial venous system',drains='Deep venous system',tributaries='Superficial and communicating venous channels',note='Perforator group: competent valves generally direct flow towards deep veins.');continue
 if plain=='genicular vein':add(pid,'Knee-region venous channels',drains='Popliteal venous system',tributaries='Periarticular genicular channels');continue
 if plain=='marginal vein':add(pid,'Ventricular myocardial venous channels',drains='Cardiac venous system; left marginal veins commonly reach great cardiac vein/coronary sinus',tributaries='Small ventricular veins',note='Cardiac marginal-vein reference; right and left routes differ.');continue
 if plain=='superficial medial plantar artery':add(pid,'Medial plantar artery','Small plantar muscular and cutaneous branches');continue
 if plain=='distal perforating artery':add(pid,'Regional plantar/dorsal arterial anastomotic system','Small communicating branches',note='The source label does not uniquely identify a named parent; regional foot-artery reference.');continue
 if 'pancreaticoduodenal artery' in plain:
  add(pid,'Gastroduodenal artery via superior pancreaticoduodenal system' if 'superior' in plain else 'SMA via inferior pancreaticoduodenal system','Pancreatic and duodenal branches');continue
 if 'oesophageal branches' in plain:add(pid,'Thoracic aorta','Small esophageal branches');continue
 if plain in ['gastric artery','gastro-epiploic artery']:
  key=('left gastric artery' if side=='Left' else 'right gastric artery') if plain=='gastric artery' else ('left gastroepiploic artery' if side=='Left' else 'right gastroepiploic artery');b['profile']=key;continue
 if plain=='colic artery':add(pid,'Colic branches of mesenteric arterial systems','Colic anastomoses and vasa recta',note='Regional colic reference; this atlas label does not uniquely identify the right, middle or left colic trunk.');continue
 if plain=='colic vein':add(pid,'Colon venous channels',drains='Superior or inferior mesenteric venous system according to region',tributaries='Colonic venous tributaries',note='Regional colic-vein reference; route depends on the named territory.');continue
 if plain=='sigmoid vein':add(pid,'Sigmoid colonic venous channels',drains='Inferior mesenteric vein',tributaries='Sigmoid colonic tributaries');continue
# Correct clear classification/source omissions without inferring nearby organs.
for key in ['inferior vena cava','superior vena cava']:
 if key in ps:ps[key]['kind']='vein'
for key in ['middle genicular artery','lateral superior genicular artery','medial superior genicular artery','medial inferior genicular artery']:
 if key in ps:ps[key]['origin']='Popliteal artery'
if 'intercostal arteries' in ps:ps['intercostal arteries'].update(origin='Posterior intercostals arise from thoracic aorta, except the first two usually from supreme intercostal artery',branches='Dorsal, spinal and collateral branches')
if 'esophageal arteries' in ps:ps['esophageal arteries']['origin']='Thoracic aorta and regional arterial sources; exact origin varies'
if 'central arteries' in ps:ps['central arteries']['origin']='Circle of Willis and adjacent cerebral arteries'
(D/'catalog.json').write_text(json.dumps(j,indent=2)+'\n');report=json.loads((D/'coverage.json').read_text());report.update(mapped=sum(bool(b.get('profile')) for b in parts.values()),unmapped=[{'id':k,**b} for k,b in parts.items() if not b.get('profile')],scopeCounts=dict(collections.Counter(b.get('scope','whole-muscle' if b.get('wholeMuscle') else 'exact') for b in parts.values())));(D/'coverage.json').write_text(json.dumps(report,indent=2)+'\n');print('Mapped',report['mapped'],'/',report['meshes']);print(report['unmapped'])
