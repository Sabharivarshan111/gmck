import fs from 'node:fs';
import https from 'node:https';

const SUPABASE_URL = 'pmtgeydtqypwrypshhsx.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdGdleWR0cXlwd3J5cHNoaHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODI2NzksImV4cCI6MjA1NjQ1ODY3OX0.wp6Ydx7oMy-_sMWd6YcxMaTtnyFBg15sH_3TMPw803U';

const BATCH = [
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/elbow_joint_anatomy_1788328862816.jpg',
    storagePath: 'anatomy/elbow_joint_ligaments_anastomosis.jpg',
    subject: 'Anatomy',
    questionText: 'Elbow Joint – Articulation, Ligaments, Carrying Angle and Anastomosis around Elbow',
    questionId: 'anat_elbow_joint_01',
    year: '1st Year',
    subtopicKey: 'anatomy::upper_limb::elbow_joint'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/arches_of_foot_anatomy_1788328894119.jpg',
    storagePath: 'anatomy/arches_of_foot_medial_lateral_transverse.jpg',
    subject: 'Anatomy',
    questionText: 'Arches of Foot – Medial, Lateral Longitudinal & Transverse Arches, Factors maintaining arches',
    questionId: 'anat_arches_foot_01',
    year: '1st Year',
    subtopicKey: 'anatomy::lower_limb::arches_of_foot'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/pudendal_nerve_anatomy_1788328918976.jpg',
    storagePath: 'anatomy/pudendal_nerve_course_alcocks_canal.jpg',
    subject: 'Anatomy',
    questionText: 'Pudendal Nerve – Origin, Course, Pudendal Canal (Alcock\'s canal), Branches and Block',
    questionId: 'anat_pudendal_nerve_01',
    year: '1st Year',
    subtopicKey: 'anatomy::pelvis::pudendal_nerve'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/development_of_pancreas_1788328945699.jpg',
    storagePath: 'anatomy/development_of_pancreas_buds_rotation.jpg',
    subject: 'Anatomy',
    questionText: 'Development of Pancreas – Ventral & Dorsal buds, Rotation, Fusion, Duct of Wirsung, Annular Pancreas',
    questionId: 'anat_dev_pancreas_01',
    year: '1st Year',
    subtopicKey: 'anatomy::embryology::pancreas'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/pain_pathway_physiology_1788328973610.jpg',
    storagePath: 'physiology/pain_pathway_spinothalamic_tract.jpg',
    subject: 'Physiology',
    questionText: 'Pain Pathway – Neospinothalamic (A-delta) and Paleospinothalamic (C fibers) Tracts & Gate Control Theory',
    questionId: 'physio_pain_pathway_01',
    year: '1st Year',
    subtopicKey: 'physiology::cns::pain_pathway'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/auditory_pathway_physiology_1788329002609.jpg',
    storagePath: 'physiology/auditory_pathway_organ_of_corti_cortex.jpg',
    subject: 'Physiology',
    questionText: 'Auditory Pathway – Organ of Corti, Cochlear nuclei, Superior Olive, Lateral Lemniscus, MGB, Auditory Cortex',
    questionId: 'physio_auditory_pathway_01',
    year: '1st Year',
    subtopicKey: 'physiology::special_senses::hearing'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/thalamic_nuclei_connections_1788329050693.jpg',
    storagePath: 'physiology/thalamic_nuclei_functional_connections.jpg',
    subject: 'Physiology',
    questionText: 'Thalamus – Functional Classification of Thalamic Nuclei, Connections & Dejerine-Roussy Syndrome',
    questionId: 'physio_thalamus_nuclei_01',
    year: '1st Year',
    subtopicKey: 'physiology::cns::thalamus'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/urinary_bladder_anatomy_1788329078038.jpg',
    storagePath: 'anatomy/urinary_bladder_gross_relations_trigone.jpg',
    subject: 'Anatomy',
    questionText: 'Urinary Bladder – Gross Anatomy, Peritoneal Relations, Interior Trigone of Lieutaud, Blood Supply',
    questionId: 'anat_urinary_bladder_01',
    year: '1st Year',
    subtopicKey: 'anatomy::pelvis::urinary_bladder'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/bronchial_asthma_pharmacotherapy_1788329133533.jpg',
    storagePath: 'pharmacology/bronchial_asthma_pharmacotherapy_targets.jpg',
    subject: 'Pharmacology',
    questionText: 'Bronchial Asthma – Pharmacotherapy, Beta-2 Agonists, ICS, Anticholinergics, PDE Inhibitors, Anti-IgE',
    questionId: 'pharm_asthma_targets_01',
    year: '2nd Year',
    subtopicKey: 'pharmacology::respiratory::asthma'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/antianginal_drugs_oxygen_balance_1788329164333.jpg',
    storagePath: 'pharmacology/antianginal_drugs_oxygen_supply_demand.jpg',
    subject: 'Pharmacology',
    questionText: 'Antianginal Drugs – Myocardial Oxygen Supply-Demand Balance, Nitrates, Beta-Blockers, CCBs, Ranolazine',
    questionId: 'pharm_antianginal_balance_01',
    year: '2nd Year',
    subtopicKey: 'pharmacology::cardiovascular::angina'
  }
];

async function uploadFile(item) {
  const fileData = fs.readFileSync(item.localFile);
  const publicUrl = `https://${SUPABASE_URL}/storage/v1/object/public/diagrams/${item.storagePath}`;

  // 1. Upload to Supabase Storage
  await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SUPABASE_URL,
      path: `/storage/v1/object/diagrams/${item.storagePath}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true',
        'Content-Length': fileData.length
      }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Uploaded to Storage: ${item.storagePath} (${(fileData.length / 1024).toFixed(1)} KB)`);
          resolve(body);
        } else {
          console.warn(`Storage upload note (${res.statusCode}): ${body}`);
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.write(fileData);
    req.end();
  });

  // 2. Upsert into question_diagrams table
  const rowData = JSON.stringify({
    question_id: item.questionId,
    year: item.year,
    subject: item.subject,
    subtopic_key: item.subtopicKey,
    question_text: item.questionText,
    question_type: 'essay',
    status: 'approved',
    storage_path: item.storagePath,
    public_url: publicUrl,
    needs_ai_raster: false,
    reviewed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SUPABASE_URL,
      path: `/rest/v1/question_diagrams`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
        'Content-Length': Buffer.byteLength(rowData)
      }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        console.log(`💾 Upserted table row for: ${item.questionText}`);
        resolve(body);
      });
    });
    req.on('error', reject);
    req.write(rowData);
    req.end();
  });
}

async function main() {
  console.log(`Starting upload of ${BATCH.length} generated priority diagrams...`);
  for (const item of BATCH) {
    try {
      await uploadFile(item);
    } catch (e) {
      console.error(`Failed ${item.storagePath}:`, e);
    }
  }
  console.log(`🎉 All ${BATCH.length} priority diagrams uploaded and registered!`);
}

main().catch(console.error);
