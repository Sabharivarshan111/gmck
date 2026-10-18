// Compile reviewed names to explicit registered atlas ids. Never pass prose to
// the broad organ resolver: 'thoracic duct' must not become a thoracic organ.
import fs from 'node:fs';
import { ORGAN_ANATOMY_DATABASE as db } from '../src/simulator/data/organAnatomyData.ts';
import { describeAtlasTarget } from '../src/simulator/data/atlasResolver.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json','utf8'));
const supply={
 heart:[['coronary artery','interventricular artery','marginal branch of right coronary artery','diagonal branch of anterior descending branch of left coronary artery'],['cardiac vein','coronary sinus','interventricular vein']],
 kidney:[['renal artery'],['renal vein']],
 brain:[['cerebral artery','communicating artery','basilar artery','vertebral artery','internal carotid artery','cerebellar artery'],[]],
 stomach:[['gastric artery','gastro-omental artery','gastroepiploic artery'],['gastric vein','gastro-omental vein','gastroepiploic vein']],
 liver:[['hepatic artery'],['hepatic vein','portal vein']],
 lungs:[['pulmonary artery','pulmonary trunk','bronchial artery'],['pulmonary vein','bronchial vein']],
 pancreas:[['pancreatic artery','pancreaticoduodenal artery'],['pancreatic vein','pancreaticoduodenal vein','splenic vein']],
 spleen:[['splenic artery'],['splenic vein']],
 small_intestine:[['jejunal artery','ileal artery','superior mesenteric artery','pancreaticoduodenal artery'],['jejunal vein','ileal vein','superior mesenteric vein']],
 urinary_bladder:[['vesical artery'],['vesical vein']],thymus:[['thymic artery'],['thymic vein']],
 eye:[['ophthalmic artery','central artery of retina','ciliary artery'],['ophthalmic vein','central vein of retina']],
 ureter:[['ureteric artery'],['ureteric vein']],spinal_cord:[['spinal artery'],['spinal vein']],
 pelvis:[['obturator artery','iliolumbar artery','gluteal artery'],['obturator vein','iliolumbar vein','gluteal vein']],
 prostate:[['prostatic artery'],['prostatic vein']],knee:[['genicular artery'],['genicular vein']],
 uterus:[['uterine artery'],['uterine vein']],ovary:[['ovarian artery'],['ovarian vein']],fallopian_tube:[['tubal artery'],['tubal vein']],
 phrenic_nerve:[['pericardiacophrenic artery'],['pericardiacophrenic vein']],
 celiac_trunk:[['celiac trunk'],['portal vein','splenic vein']],portal_vein:[[],['hepatic vein']],
 aorta:[[],['azygos vein','hemiazygos vein']],ascites:[[],['portal vein']],
 snakebite:[['dorsalis pedis artery','fibular artery'],['great saphenous vein','small saphenous vein']],
 abdomen:[['celiac trunk','superior mesenteric artery','inferior mesenteric artery','renal artery'],['portal vein','hepatic vein']],
 pectoralis_major:[['thoraco-acromial artery','lateral thoracic artery'],['cephalic vein','axillary vein']],
 deltoid:[['posterior circumflex humeral artery','deltoid branch'],['cephalic vein','posterior circumflex humeral vein']],
 lad_artery:[['anterior interventricular artery'],['great cardiac vein','anterior interventricular vein']],
 rca_artery:[['right coronary artery'],['small cardiac vein','middle cardiac vein']],
};
const extra={
 kidney:{posterior:['Diaphragm','Psoas major','Quadratus lumborum'],superior:['Suprarenal glands'],medial:['Renal artery','Renal vein','Renal pelvis','Ureter'],anterior:['Liver (right kidney)','Duodenum (right kidney)','Stomach (left kidney)','Spleen (left kidney)','Pancreas (left kidney)']},
 brain:{superior:['Calvarium'],inferior:['Base of skull'],posterior:['Cerebellum']},
 stomach:{anterior:['Liver','Diaphragm'],posterior:['Pancreas','Left kidney','Spleen','Splenic artery']},
 pancreas:{anterior:['Stomach','Transverse colon'],posterior:['Abdominal aorta','Inferior vena cava','Left renal vein'],medial:['Duodenum'],lateral:['Spleen']},
 spleen:{lateral:['Diaphragm'],medial:['Stomach','Pancreatic tail','Left kidney','Splenic flexure']},
 small_intestine:{posterior:['Abdominal aorta','Inferior vena cava'],superior:['Transverse colon']},
 urinary_bladder:{anterior:['Pubic symphysis'],inferior:['Pelvic floor'],posterior:['Rectum (male)','Uterus (female)']},
 thymus:{anterior:['Sternum'],posterior:['Pericardium','Ascending aorta','Brachiocephalic veins']},
 eye:{posterior:['Optic nerve'],medial:['Medial rectus'],lateral:['Lateral rectus'],superior:['Superior rectus'],inferior:['Inferior rectus']},
 ureter:{posterior:['Psoas major'],anterior:['Gonadal vessels'],inferior:['Urinary bladder']},
 spinal_cord:{posterior:['Vertebral arches'],anterior:['Vertebral bodies'],inferior:['Cauda equina']},
 pelvis:{medial:['Urinary bladder','Rectum'],posterior:['Sacrum']},
 prostate:{superior:['Urinary bladder'],posterior:['Rectum'],anterior:['Pubic symphysis'],inferior:['External urethral sphincter']},
 skin:{posterior:['Superficial fascia','Deep fascia']},
 knee:{anterior:['Patella','Quadriceps tendon'],posterior:['Popliteal artery','Popliteal vein'],medial:['Medial collateral ligament'],lateral:['Lateral collateral ligament']},
 uterus:{anterior:['Urinary bladder'],posterior:['Rectum'],lateral:['Ureter','Uterine artery']},
 ovary:{medial:['Uterus'],superior:['Uterine tube'],lateral:['Pelvic wall']},
 fallopian_tube:{lateral:['Ovary'],medial:['Uterus'],inferior:['Mesosalpinx']},
 placenta:{posterior:['Decidua basalis'],anterior:['Umbilical cord']},
 aorta:{posterior:['Vertebral column'],lateral:['Inferior vena cava']},skeletal:{anterior:['Regional muscles']},
 ascites:{posterior:['Liver','Kidney'],inferior:['Pelvic cavity']},
 snakebite:{anterior:['Tibialis anterior'],lateral:['Fibularis longus','Fibularis brevis']},
};
const aliases={
 // The source files most liver parenchyma as hepatovenous segments. Matching
 // only the word "liver" returns the caudate lobe and omits the whole surface.
 'Liver':['hepatovenous segment','caudate lobe of liver'],
 'Liver (Right)':['hepatovenous segment','caudate lobe of liver'],
 'Liver (right kidney)':['hepatovenous segment','caudate lobe of liver'],
 'Interatrial Septum':['interatrial septum'],'Phrenic Nerve (C3-C5)':[],
 'Pericardiophrenic Vessels':['pericardiacophrenic artery','pericardiacophrenic vein'],
 'Epicardium':[],'Visceral Pericardium':[],
 'Bifurcation of Left Main Coronary Artery':['left coronary artery'],'Incisura Apicis Cordis':[],
 'Right Ventricular Conus Arteriosus':['conus arteriosus'],
 'Left Ventricle Anterolateral Wall':['wall of left ventricle'],'Anterior Myocardium of Left Ventricle':['wall of left ventricle'],
 'Diagonal Branches (D1, D2)':['diagonal branch'],
 'Mammary Gland (Breast)':['mammary gland'],'Subcutaneous Fat':[],'Clavipectoral Fascia':[],
 'Intercostal Muscles':['external intercostal','internal intercostal','innermost intercostal'],
 'Deltopectoral Groove (Cephalic Vein)':['cephalic vein'],'Anterior Rectus Sheath':[],
 'Lateral Lip of Bicipital Groove of Humerus':[],'Deltopectoral Triangle':[],
 'Teres Major & Minor':['teres major','teres minor'],'Acromion Process':['acromion'],
 'Subacromial Bursa':[],'Supraspinatus Tendon':['tendon of supraspinatus'],'Head of Humerus':['head of humerus'],
 'Subcutaneous Tissue & Skin':['skin'],'Lesser Omentum':[],'Sympathetic Trunk':[],
 "Suprapleural Membrane (Sibson's Fascia)":[],
 'Thoracic Cage':['rib','sternum','thoracic vertebra'],
 'Intercostal Neurovascular Bundles':['intercostal artery','intercostal vein'],
 'Right Atrial Appendage':['right auricle'],'Crux Cordis':[],
 'Right Ventricle Free Wall':['wall of right ventricle'],'Right Phrenic Nerve':[],
 'Prevertebral Fascia':[],'Jugular Foramen':['jugular foramen'],
 'Hypoglossal Nerve (CN XII)':['hypoglossal nerve'],'Cardiac Plexus':[],'Recurrent Laryngeal Nerve':[],
 'Brachial Plexus Roots':[],'C3-C5 Cervical Nerve Roots':[],
 'Ascending Cervical Artery':['ascending cervical artery'],'Pericardium':['pericardium'],
 'Pericardiophrenic Artery':['pericardiacophrenic artery'],'Lesser Sac':[],'Epiploic Foramen of Winslow':[],
 'Porta Hepatis':['porta hepatis'],'Rectus Sheath & Linea Alba':[],'Greater Omentum':[],
 'Psoas Major & Quadratus Lumborum':['psoas major','quadratus lumborum'],
 'Inferior Phrenic Vessels':['inferior phrenic artery','inferior phrenic vein'],
 'Pelvic Brim & True Pelvis':[],'Median Sagittal Plane':[],
 'Common Iliac Vessels':['common iliac artery','common iliac vein'],
 'Superior & Inferior Mesenteric Vessels':['superior mesenteric artery','inferior mesenteric artery','superior mesenteric vein','inferior mesenteric vein'],
 'Transversus Abdominis':['transversus abdominis'],'Internal & External Oblique Muscles':['internal oblique','external oblique'],
 'Iliac Crests':['iliac crest'],'Axillary Artery & Vein':['axillary artery','axillary vein'],
 'Subclavian Artery & Vein':['subclavian artery','subclavian vein'],
 'Abdominal Aorta & IVC':['abdominal aorta','inferior vena cava'],
 'Urinary Bladder & Sigmoid Colon':['urinary bladder','sigmoid colon'],
 'Right Kidney & Adrenal':['right kidney','right adrenal gland'],'Stomach & Spleen (Left)':['stomach','spleen'],
 'Heart & Pericardium':['wall of right atrium','wall of left atrium','wall of left ventricle','wall of right ventricle'],
 'Pericardium / Heart':['wall of right atrium','wall of left atrium','wall of left ventricle','wall of right ventricle'],
 'Deltoid Tuberosity of Humerus':[],'Clavicle (Medial Half)':[],'Clavicle (Lateral 1/3)':[],
 'Renal pelvis':['pelvis of kidney'],'Thoracic Aorta':['descending thoracic aorta'],
 'Bile Duct (anterior-right)':['common bile duct'],'Right & Left Lobar Portal Branches':['left portal vein','right portal vein'],
 'Splenic Vein Confluence':['splenic vein','superior mesenteric vein'],'Trachea & Carina':['trachea'],
 'Spine of Scapula':[],'Hepatic Flexure of Colon':['right colic flexure'],'Splenic flexure':['left colic flexure'],
 'Right Lung Base':[],'Pleural Dome / Lung Apex':[],'Right Atrium':['wall of right atrium'],
 'Aortic Root':['ascending aorta'],'Caudate Lobe of Liver':['caudate lobe of liver'],
 'Pancreatic tail':[],'Superior Border of Pancreas':[],'Neck of Pancreas':[],'Gallbladder Neck':[],
 'Suprarenal glands':['adrenal gland'],'Gonadal vessels':['testicular artery','ovarian artery','testicular vein','ovarian vein'],
 'Brachiocephalic veins':['brachiocephalic vein'],
};
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const find=(names,system)=>atlas.parts.filter(p=>(!system||p.system===system)&&names.some(t=>new RegExp('\\b'+escape(t)+'\\b','i').test(p.name))).map(p=>p.id);
const byId=new Map(atlas.parts.map(p=>[p.id,p]));
// Name partial/region views for what the registered mesh actually shows.
const displayLabels={
 'Intercostal Neurovascular Bundles':'Intercostal vessels (nerve mesh unavailable)',
 'Heart & Pericardium':'Heart walls (pericardium mesh unavailable)',
 'Pericardium / Heart':'Heart walls (pericardium mesh unavailable)',
 'Subcutaneous Tissue & Skin':'Skin surface (subcutaneous mesh unavailable)',
 'Deltopectoral Groove (Cephalic Vein)':'Cephalic vein in deltopectoral groove',
 'Aortic Root':'Aortic root region (ascending aorta)',
 'Bifurcation of Left Main Coronary Artery':'Left coronary artery (bifurcation region)',
};
// Exact source names reviewed during the structure audit. Bypass the prose
// heuristic only for these entries; a child branch is not its parent artery.
const reviewedSourceNames={
 'Aortic Arch':['Arch of aorta'],
 'Diagonal Branches (D1, D2)':['Diagonal branch of anterior descending branch of left coronary artery'],
 'Subclavius Muscle':['Right subclavius','Left subclavius'],
 'Deltoid Muscle':['Acromial part of right deltoid','Acromial part of left deltoid','Clavicular part of right deltoid','Clavicular part of left deltoid','Spinal part of right deltoid','Spinal part of left deltoid'],
 'Long Head of Triceps':['Long head of right triceps brachii','Long head of left triceps brachii'],
 'Lateral Head of Triceps':['Lateral head of right triceps brachii','Lateral head of left triceps brachii'],
 'Sternum (Manubrium & Body)':['Manubrium','Body of sternum'],
 'Sternocleidomastoid Muscle':['Left sternocleidomastoid','Right sternocleidomastoid'],
 'Longus Colli Muscle':['Inferior oblique part of left longus colli','Superior oblique part of left longus colli','Vertical intermediate part of left longus colli'],
 'Scalenus Anterior Muscle':['Left scalenus anterior','Right scalenus anterior'],
 'Right & Left Lobar Portal Branches':['Left portal vein','Right portal vein'],
 'Celiac Axis':['Celiac trunk'],
 'Thoracoabdominal Diaphragm':['Diaphragm'],
};
const reviewedSupplyNames={
 'lad_artery:anterior interventricular artery':['Trunk of anterior interventricular branch of left coronary artery'],
};
const exactSourceIds=names=>{
 const ids=[];for(const name of names){const matches=atlas.parts.filter(p=>p.name===name);if(!matches.length)throw Error('Reviewed source name missing: '+name);ids.push(...matches.map(p=>p.id));}return ids;
};
Object.assign(displayLabels,{
 'Diagonal Branches (D1, D2)':'Diagonal branch (D1/D2 not separately captured)',
 'Longus Colli Muscle':'Longus colli (left reference; right mesh unavailable)',
 'Psoas Major & Quadratus Lumborum':'Psoas major (quadratus lumborum mesh unavailable)',
 'Urinary Bladder & Sigmoid Colon':'Urinary bladder (sigmoid colon mesh unavailable)',
 'Internal & External Oblique Muscles':'External oblique (internal oblique mesh unavailable)',
});
const output={};let serial=0;
for(const [owner,o] of Object.entries(db)){
 const links=[];
 const add=(kind,direction,label,partIds,note,nodeId)=>links.push({id:`connection_${serial++}`,owner,kind,direction,label,targetId:partIds.length?'atlas:'+partIds.join(','):null,partIds,note,...nodeId?{nodeId}:{}});
 const relations=o.relationsStructured||extra[owner]||{relation:o.musculoskeletalRelations};
 for(const [direction,labels] of Object.entries(relations))for(const label of labels){
  const names=aliases[label]||[label.replace(/\([^)]*\)/g,'').trim()];
  let ids=find(names);
  if(!/arter|vein|vessel|nerve|duct|ligament|cavity/i.test(label))ids=ids.filter(id=>!/artery|vein|nerve|duct|branch|ligament|cavity/i.test(byId.get(id).name));
  if(reviewedSourceNames[label])ids=exactSourceIds(reviewedSourceNames[label]);
  add('relation',direction,displayLabels[label]||label,ids,ids.length?'Structures share the BodyParts3D reference frame.':'This exact relation has no mesh in the registered atlas; the diagram is a teaching schematic.');
 }
 for(const [index,kind,system,field,nodes] of [[0,'arterial','arterial','arterialSupply','arterialNodes'],[1,'venous','venous','venousDrainage','venousNodes']]){
  const names=supply[owner]?.[index]||[];
  if(names.length)for(const name of names)add(kind,kind,name[0].toUpperCase()+name.slice(1),reviewedSupplyNames[owner+':'+name]?exactSourceIds(reviewedSupplyNames[owner+':'+name]):find([name],system),o[field].join(' '));
  else for(const paragraph of o[field])add(kind,kind,paragraph.split(':')[0].split('.')[0].slice(0,95),[],paragraph);
  for(const node of o[nodes]||[]){
   let ids=[...describeAtlasTarget(node.id,atlas).ids].filter(id=>byId.get(id)?.system===system);
   if(node.id==='heart')ids=[];
   if(node.name.includes('Pectoral Branch'))ids=ids.filter(id=>/pectoral branch/i.test(byId.get(id).name));
   add(kind,kind,node.name,ids,node.territory+' '+node.clinicalNote,node.id);
  }
 }
 output[owner]=links;
}
fs.writeFileSync('src/simulator/data/organConnections.ts',`// Generated by scripts/build-organ-connections.mjs; reviewed names only.\nexport interface OrganConnection {id:string;owner:string;kind:'relation'|'arterial'|'venous';direction:string;label:string;targetId:string|null;partIds:string[];note:string;nodeId?:string}\nexport const ORGAN_CONNECTIONS:Record<string,OrganConnection[]> = ${JSON.stringify(output,null,2)};\nconst CONNECTION_BY_ID = new Map(Object.values(ORGAN_CONNECTIONS).flat().map(c => [c.id,c]));\nexport const getOrganConnection = (id:string|null|undefined):OrganConnection|null => id ? CONNECTION_BY_ID.get(id) || null : null;\nexport const getNodeConnection = (owner:string,nodeId:string):OrganConnection|undefined => ORGAN_CONNECTIONS[owner]?.find(c=>c.nodeId===nodeId);\n`);
console.log({dossiers:Object.keys(output).length,links:serial,registered:Object.values(output).flat().filter(c=>c.targetId).length});
