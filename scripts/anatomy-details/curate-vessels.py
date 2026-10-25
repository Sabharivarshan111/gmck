import json,pathlib
R=pathlib.Path(__file__).resolve().parents[2];D=R/'src/simulator/data/structureDetails';p=D/'reviewed.json';r=json.loads(p.read_text())
arteries='''
circumflex artery|Left coronary artery|Left marginal, atrial and posterior ventricular branches; PDA in left dominance
posterior interventricular artery|RCA in right dominance; circumflex in left dominance|Posterior septal and ventricular branches
conus artery|Usually proximal RCA; separate aortic origin may occur|Small infundibular branches
anterior communicating artery|Connects the anterior cerebral arteries|Small basal forebrain and hypothalamic perforators
posterior communicating artery|Internal carotid artery|Hypothalamic and other perforating branches; connects with PCA
callosomarginal artery|Anterior cerebral arterial system|Medial frontal and paracentral branches; pattern varies
pericallosal artery|Anterior cerebral artery continuation|Callosomarginal and other medial cortical branches
lateral occipital artery|Posterior cerebral artery|Temporal cortical branches
medial occipital artery|Posterior cerebral artery|Calcarine and parieto-occipital branches
posterior medial choroidal artery|Posterior cerebral artery|Choroidal twigs
thalamoperforating artery|Posterior cerebral or posterior communicating arterial system, depending on branch|Small perforators
thoracoacromial artery|Second part of axillary artery|Pectoral, deltoid, acromial and clavicular branches
anterior circumflex humeral artery|Third part of axillary artery|Ascending, muscular and articular branches
posterior circumflex humeral artery|Third part of axillary artery|Deltoid and articular branches
musculophrenic artery|Internal thoracic artery|Anterior intercostal and diaphragmatic branches
superior intercostal artery|Costocervical trunk|First and second posterior intercostal arteries
superficial cervical artery|Usually transverse cervical arterial system|Superficial muscular branches
dorsal scapular artery|Subclavian artery or deep transverse cervical branch|Rhomboid and levator scapulae branches
gastroduodenal artery|Common hepatic artery|Right gastro-omental and superior pancreaticoduodenal arteries
left gastric artery|Celiac trunk|Esophageal and gastric branches
right gastric artery|Usually hepatic artery proper; origin varies|Gastric branches
left gastroepiploic artery|Splenic artery|Gastric and omental branches
right gastroepiploic artery|Gastroduodenal artery|Gastric and omental branches
superior pancreaticoduodenal artery|Gastroduodenal artery|Anterior and posterior branches
inferior pancreaticoduodenal artery|Superior mesenteric artery; sometimes jejunal source|Anterior and posterior branches
caudal pancreatic artery|Usually splenic arterial system|Small pancreatic tail branches
inferior pancreatic artery|Usually dorsal pancreatic arterial system|Pancreatic body branches
sigmoid arteries|Inferior mesenteric artery|Sigmoid branches and anastomoses
arcuate artery of the foot|Dorsalis pedis artery|Dorsal metatarsal arteries
inferior lateral genicular artery|Popliteal artery|Genicular articular branches
recurrent interosseous artery|Posterior interosseous artery|Muscular and articular elbow branches
proper palmar digital arteries|Common palmar digital arteries or named radial digital sources, according to digit|Small digital branches
common palmar digital arteries|Superficial palmar arch|Proper palmar digital arteries
dorsal digital arteries|Dorsal metacarpal or metatarsal arteries according to region|Small digital branches
'''
for line in arteries.strip().splitlines():
 name,origin,branches=line.split('|');r[name]={'name':name.title(),'kind':'artery','origin':origin,'branches':branches,'source':'https://en.wikipedia.org/wiki/'+name.capitalize().replace(' ','_')}
veins='''
coronary sinus|Continuation of great cardiac vein with oblique vein contribution|Great, middle, small cardiac and posterior LV/marginal tributaries|Right atrium
posterior vein of the left ventricle|Posterior left ventricular venous channels|Posterior ventricular tributaries|Coronary sinus, sometimes via great cardiac vein
anterior cardiac veins|Anterior right ventricular venous channels|Small anterior ventricular tributaries|Directly to right atrium
hepatic veins|Intrahepatic venous channels collecting sinusoidal outflow|Segmental hepatic tributaries|Inferior vena cava
middle hepatic vein|Central hepatic venous channels|Adjacent central liver segmental tributaries|IVC, often in common trunk with left hepatic vein
suprarenal vein|Adrenal venous channels|Adrenal tributaries|Right: IVC. Left: left renal vein, usually after joining inferior phrenic vein
superficial dorsal vein of the penis|Superficial penile venous plexus|Superficial skin and preputial tributaries|Superficial external pudendal venous system
deep dorsal vein of the penis|Deep penile venous drainage|Circumflex and emissary tributaries|Prostatic venous plexus
musculophrenic vein|Lower anterior thoracic and diaphragmatic venous channels|Anterior intercostal and diaphragmatic tributaries|Internal thoracic vein
subscapular vein|Posterior axillary venous channels|Thoracodorsal and circumflex scapular tributaries|Axillary vein
circumflex scapular vein|Scapular venous network|Small scapular tributaries|Subscapular vein
thoracodorsal vein|Latissimus-dorsi region venous channels|Muscular tributaries|Subscapular vein
anterior circumflex humeral vein|Proximal humeral venous channels|Muscular and articular tributaries|Axillary venous system
lateral circumflex femoral vein|Lateral thigh muscular venous channels|Muscular tributaries|Deep femoral or femoral vein; termination varies
medial circumflex femoral vein|Proximal medial femoral venous channels|Muscular and periarticular tributaries|Deep femoral or femoral vein; termination varies
subcostal vein|Venous drainage below rib 12|Posterior body-wall tributaries|Right: azygos system. Left: hemiazygos system
median sacral vein|Sacral venous plexus|Small sacral tributaries|Common iliac venous system, often left common iliac vein
internal pudendal vein|Perineal venous channels|Perineal tributaries|Internal iliac vein
gastric vein|Stomach venous channels|Gastric and esophageal tributaries depend on named vessel|Portal or splenic venous system according to named gastric vein
gastroepiploic vein|Greater-curvature and omental venous channels|Gastric and omental tributaries|Right: superior mesenteric system. Left: splenic vein
common palmar digital vein|Proper palmar digital veins|Digital tributaries|Palmar venous arches
deep palmar venous arch|Deep palmar metacarpal venous channels|Deep palmar tributaries|Radial and ulnar venae comitantes
plantar venous arch|Plantar metatarsal and digital venous channels|Plantar tributaries|Medial/lateral plantar and posterior tibial venous system
proper palmar digital vein|Small finger venous channels|Digital tributaries|Common palmar digital veins and communicating dorsal channels
dorsal digital veins|Finger or toe venous channels|Small digital tributaries|Dorsal metacarpal/metatarsal venous networks
'''
for line in veins.strip().splitlines():
 name,origin,tributaries,drains=line.split('|');r[name]={'name':name.title(),'kind':'vein','origin':origin,'tributaries':tributaries,'drainsTo':drains,'source':'https://en.wikipedia.org/wiki/'+name.capitalize().replace(' ','_')}
p.write_text(json.dumps(r,indent=2)+'\n')
# Major named branch lists absent from some source infoboxes; original factual summaries.
extra='''
anterior cerebral artery|Anterior communicating, recurrent artery of Heubner and medial striate branches; pericallosal and callosomarginal cortical branches, variable pattern
posterior cerebral artery|Thalamoperforating, thalamogeniculate and posterior choroidal branches; temporal, calcarine and parieto-occipital branches
anterior choroidal artery|Perforating branches and choroidal branches to temporal-horn choroid plexus
anterior spinal artery|Sulcal/central and pial spinal branches
superior cerebellar artery|Medial/lateral cerebellar branches and brainstem perforators
thalamogeniculate artery|Small thalamic and geniculate perforators
lateral circumflex femoral artery|Ascending, transverse and descending branches
lateral thoracic artery|Pectoral, serratus and lateral mammary branches
inferior thyroid artery|Glandular, ascending cervical, inferior laryngeal, esophageal and tracheal branches
inferior ulnar collateral artery|Anterior/posterior elbow anastomotic branches
posterior ulnar recurrent artery|Small muscular and articular medial-elbow branches
radial recurrent artery|Small muscular and articular lateral-elbow branches
deep cervical artery|Muscular and spinal branches
superior epigastric artery|Rectus-abdominis muscular and cutaneous branches
circumflex scapular artery|Ascending and descending scapular branches
thoracodorsal artery|Latissimus-dorsi and adjacent muscular branches
suprascapular artery|Supraspinous/infraspinous muscular, acromial and articular branches
pulmonary artery|Right and left pulmonary arteries, then lobar, segmental and subsegmental branches
hepatic artery proper|Usually right and left hepatic arteries; right gastric origin varies
middle colic artery|Right and left colic branches
superior rectal artery|Right/left rectal and smaller terminal branches
superficial epigastric artery|Superficial abdominal-wall muscular and cutaneous branches
inferior suprarenal artery|Small adrenal gland branches
middle suprarenal arteries|Small adrenal gland branches
subcostal arteries|Dorsal, spinal, muscular and cutaneous branches
lumbar arteries|Dorsal, spinal and abdominal-wall branches
esophageal arteries|Small esophageal-wall branches and anastomoses
dorsal pancreatic artery|Right/left pancreatic branches with inferior or transverse pancreatic continuation in common patterns
greater pancreatic artery|Pancreatic body and tail branches
anterior cecal artery|Small anterior cecal branches
posterior cecal artery|Small posterior cecal branches; appendicular origin varies
appendicular artery|Small appendiceal branches
lateral plantar artery|Superficial branches and deep plantar arch contribution
medial plantar artery|Superficial/deep digital and muscular branches
deep plantar artery|Anastomotic contribution to plantar arch
proper plantar digital arteries|Small branches to sides and terminal tissues of toes
plantar metatarsal arteries|Common/proper plantar digital continuations and perforating connections
palmar metacarpal arteries|Connections with common palmar digital arteries and smaller palmar branches
radial artery of index finger|Digital branches along radial index finger
princeps pollicis artery|Proper digital branches of thumb
anterior tibial recurrent artery|Muscular and articular knee anastomotic branches
lateral tarsal artery|Small tarsal, muscular and anastomotic branches
perforating arteries|Muscular and anastomotic branches according to named perforator group
middle genicular artery|Intra-articular branches to cruciate ligaments and synovial tissues
medial inferior genicular artery|Periarticular genicular branches
medial superior genicular artery|Periarticular genicular branches
lateral superior genicular artery|Periarticular genicular branches
testicular artery|Ureteric, epididymal and testicular branches
bronchial artery|Peribronchial and bronchial branches; mediastinal/esophageal contributions vary
dorsal artery of the penis|Small glandular and dorsal penile branches
'''
# Supplements merge into raw source profiles during the build, not into different structures.
(D/'branch-supplements.json').write_text(json.dumps(dict(line.split('|',1) for line in extra.strip().splitlines()),indent=2)+'\n')
