import fs from 'fs';

const SUPABASE_URL = 'https://pmtgeydtqypwrypshhsx.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdGdleWR0cXlwd3J5cHNoaHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODI2NzksImV4cCI6MjA1NjQ1ODY3OX0.wp6Ydx7oMy-_sMWd6YcxMaTtnyFBg15sH_3TMPw803U';

const DIAGRAMS_TO_UPLOAD = [
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/types_of_synovial_joints_1788145924858.jpg',
    storagePath: 'anatomy/types_of_synovial_joints.jpg',
    subject: 'Anatomy',
    questionText: 'Types of synovial joint'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/cartilaginous_joints_primary_secondary_1788145960577.jpg',
    storagePath: 'anatomy/cartilaginous_joints_primary_vs_secondary.jpg',
    subject: 'Anatomy',
    questionText: 'Cartilaginous joint'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/blood_supply_long_bone_nutrient_artery_1788145997165.jpg',
    storagePath: 'anatomy/blood_supply_of_a_long_bone.jpg',
    subject: 'Anatomy',
    questionText: 'Blood supply of a long bone ***'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/endochondral_ossification_zones_1788146037060.jpg',
    storagePath: 'anatomy/endochondral_ossification_growth_plate_zones.jpg',
    subject: 'Anatomy',
    questionText: 'Endochondral ossification'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/compact_bone_haversian_system_1788146078776.jpg',
    storagePath: 'anatomy/microscopic_structure_compact_bone_haversian_system.jpg',
    subject: 'Anatomy',
    questionText: 'Microscopic structure of bone **'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/protein_synthesis_inhibitors_1788145082842.jpg',
    storagePath: 'pharmacology/protein_synthesis_inhibitors_30s_50s.jpg',
    subject: 'Pharmacology',
    questionText: 'Protein Synthesis Inhibitors (30S & 50S Ribosomal Targets)'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/antifungal_drugs_targets_1788145112499.jpg',
    storagePath: 'pharmacology/antifungal_drugs_sites_of_action.jpg',
    subject: 'Pharmacology',
    questionText: 'Antifungal Drugs (Sites of Action & Cell Wall/Membrane Targets)'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/antimalarial_drugs_targets_1788145136301.jpg',
    storagePath: 'pharmacology/antimalarial_drugs_sites_of_action.jpg',
    subject: 'Pharmacology',
    questionText: 'Antimalarial Drugs & Sites of Action'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/haart_regimen_targets_1788145165344.jpg',
    storagePath: 'pharmacology/antiretroviral_haart_regimen_targets.jpg',
    subject: 'Pharmacology',
    questionText: 'Antiretroviral Drugs (HAART Regimen Sites of Action)'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/anticancer_cell_cycle_targets_1788145196575.jpg',
    storagePath: 'pharmacology/cancer_chemotherapy_cell_cycle_sites.jpg',
    subject: 'Pharmacology',
    questionText: 'Cancer Chemotherapy: Cell Cycle Sites of Action'
  }
];

async function uploadFile(d) {
  const fileBytes = fs.readFileSync(d.localFile);
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/diagrams/${d.storagePath}`;
  
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true'
    },
    body: fileBytes
  });
  
  const text = await res.text();
  console.log(`Uploaded ${d.storagePath}: status ${res.status}`);
  return `${SUPABASE_URL}/storage/v1/object/public/diagrams/${d.storagePath}`;
}

async function run() {
  for (const d of DIAGRAMS_TO_UPLOAD) {
    if (fs.existsSync(d.localFile)) {
      const publicUrl = await uploadFile(d);
      d.publicUrl = publicUrl;
    } else {
      console.warn(`File not found: ${d.localFile}`);
    }
  }
  console.log('Uploads complete.');
}

run().catch(console.error);
