import fs from 'fs';
import path from 'path';

// Load Anatomy topics
const anatomyFiles = [
  'upperLimb.ts',
  'lowerLimb.ts',
  'thorax.ts',
  'abdomenPelvis.ts',
  'headNeck.ts',
  'neuroanatomy.ts',
  'generalAnatomy.ts',
  'histology.ts',
  'embryology.ts',
  'paper1.ts',
  'paper2.ts'
];

const topicsDir = '/Users/sabharivarshan/.gemini/antigravity/scratch/gmck/src/data/topics/anatomy';

// Visual Exam Diagram Keywords in Indian University Anatomy Exams (BD Chaurasia / Vishram Singh)
const DIAGRAM_DEMAND_PATTERNS = [
  { pattern: /synovial joint/i, title: 'Types of Synovial Joints & Typical Synovial Joint Structure', category: 'General Anatomy' },
  { pattern: /cartilaginous joint/i, title: 'Cartilaginous Joints: Primary (Synchondrosis) vs Secondary (Symphysis)', category: 'General Anatomy' },
  { pattern: /blood supply.*(bone|long bone)|nutrient artery/i, title: 'Blood Supply of a Long Bone (Nutrient, Epiphyseal, Metaphyseal, Periosteal)', category: 'General Anatomy' },
  { pattern: /ossification|growth plate|epiphyseal plate/i, title: 'Endochondral Ossification & Epiphyseal Cartilage Zones', category: 'General Anatomy / Embryology' },
  { pattern: /haversian|compact bone|osteon|histology.*bone/i, title: 'Microscopic Structure of Compact Bone (Haversian System)', category: 'Histology' },
  { pattern: /brachial plexus/i, title: 'Brachial Plexus: Roots, Trunks, Divisions, Cords, Branches & Erb\'s Point', category: 'Upper Limb' },
  { pattern: /axillary artery|axilla/i, title: 'Axilla Boundaries, Contents & Axillary Artery Branches (3 Parts)', category: 'Upper Limb' },
  { pattern: /cubital fossa/i, title: 'Cubital Fossa: Boundaries, Roof, Floor & Contents (TAN)', category: 'Upper Limb' },
  { pattern: /carpal tunnel/i, title: 'Carpal Tunnel Anatomy, Flexor Retinaculum & Median Nerve Compression', category: 'Upper Limb' },
  { pattern: /femoral triangle|femoral sheath|femoral canal/i, title: 'Femoral Triangle, Femoral Sheath & Femoral Ring Boundaries', category: 'Lower Limb' },
  { pattern: /popliteal fossa/i, title: 'Popliteal Fossa: Boundaries, Contents & Neurovascular Relations', category: 'Lower Limb' },
  { pattern: /intercostal space|typical intercostal/i, title: 'Typical Intercostal Space: Muscles & Neurovascular Bundle (VAN Order)', category: 'Thorax' },
  { pattern: /coronary circulation|blood supply of heart/i, title: 'Coronary Arterial Circulation (RCA, LCA, Dominance & Anastomoses)', category: 'Thorax' },
  { pattern: /bronchopulmonary segment/i, title: 'Bronchopulmonary Segments of Right and Left Lungs', category: 'Thorax' },
  { pattern: /inguinal canal|inguinal hernia/i, title: 'Inguinal Canal: Boundaries, Deep/Superficial Rings & Hesselbach\'s Triangle', category: 'Abdomen' },
  { pattern: /stomach bed|relations of stomach/i, title: 'Stomach Bed (Structures Forming the Bed of Stomach)', category: 'Abdomen' },
  { pattern: /portal vein|porto.*caval|portosystemic/i, title: 'Portosystemic (Portacaval) Anastomoses Sites & Clinical Significance', category: 'Abdomen' },
  { pattern: /ischiorectal fossa|ischioanal/i, title: 'Ischioanal (Ischiorectal) Fossa: Boundaries, Spaces & Pudendal Canal', category: 'Pelvis & Perineum' },
  { pattern: /carotid triangle/i, title: 'Carotid Triangle: Boundaries, Contents & Ansa Cervicalis', category: 'Head & Neck' },
  { pattern: /cavernous sinus/i, title: 'Cavernous Sinus: Coronal Section, Relations, Lateral Wall & Interior Structures', category: 'Head & Neck' },
  { pattern: /middle ear|tympanic cavity|tympanic membrane/i, title: 'Tympanic Cavity (Middle Ear): 6 Walls Schematic', category: 'Head & Neck' },
  { pattern: /circle of willis/i, title: 'Circle of Willis (Circulus Arteriosus Cerebri) & Major Cerebral Arteries', category: 'Neuroanatomy' },
  { pattern: /internal capsule/i, title: 'Internal Capsule: Horizontal Section Parts, Tracts & Blood Supply', category: 'Neuroanatomy' },
  { pattern: /medulla.*sensory.*decussation|ts.*medulla/i, title: 'T.S of Medulla Oblongata at Sensory & Motor Decussation', category: 'Neuroanatomy' },
  { pattern: /pons.*facial colliculus|ts.*pons/i, title: 'T.S of Lower Pons at Facial Colliculus', category: 'Neuroanatomy' },
  { pattern: /midbrain.*colliculus|ts.*midbrain/i, title: 'T.S of Midbrain at Superior & Inferior Colliculi', category: 'Neuroanatomy' },
  { pattern: /branchial apparatus|pharyngeal arch/i, title: 'Pharyngeal (Branchial) Arches, Pouches, Clefts & Derivatives', category: 'Embryology' },
  { pattern: /interatrial septum|development of heart/i, title: 'Development of Interatrial Septum (Septum Primum & Secundum)', category: 'Embryology' },
  { pattern: /rotation of gut|midgut/i, title: 'Midgut Rotation (90° + 180° Anti-Clockwise Stages)', category: 'Embryology' }
];

console.log('🔍 ANATOMY HIGH-YIELD DIAGRAM ALGORITHM SCANNER');
console.log('Found ' + DIAGRAM_DEMAND_PATTERNS.length + ' High-Yield Visual Exam Diagram Archetypes.');

