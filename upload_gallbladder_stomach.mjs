import fs from 'node:fs';
import https from 'node:https';

const SUPABASE_URL = 'pmtgeydtqypwrypshhsx.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdGdleWR0cXlwd3J5cHNoaHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODI2NzksImV4cCI6MjA1NjQ1ODY3OX0.wp6Ydx7oMy-_sMWd6YcxMaTtnyFBg15sH_3TMPw803U';

const BATCH = [
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/gallbladder_master_anatomy_1788335482731.jpg',
    storagePath: 'anatomy/gallbladder_gross_relations_calots_embryology.jpg',
    subject: 'Anatomy',
    questionText: 'Gallbladder – Gross Anatomy, Relations, Calot\'s Triangle (Cystohepatic Triangle), Embryology & Duct of Heister',
    questionId: 'anat_gallbladder_master_01',
    year: '1st Year',
    subtopicKey: 'anatomy::abdomen::gallbladder'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/stomach_gross_interior_magenstrasse_1788335519418.jpg',
    storagePath: 'anatomy/stomach_gross_morphology_interior_magenstrasse.jpg',
    subject: 'Anatomy',
    questionText: 'Stomach – Location, External Features, Presenting Parts, Pyloric Valve & Interior (Gastric Rugae, Magenstrasse / Canal of Waldeyer)',
    questionId: 'anat_stomach_morphology_01',
    year: '1st Year',
    subtopicKey: 'anatomy::abdomen::stomach'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/stomach_lymphatics_clogs_areas_1788335550333.jpg',
    storagePath: 'anatomy/stomach_lymphatics_clogs_areas_virchow.jpg',
    subject: 'Anatomy',
    questionText: 'Stomach – Lymphatic Drainage, 4 Clog\'s Territories, Celiac Nodes, Virchow\'s Node (Troisier\'s Sign), Krukenberg Tumor & Sister Mary Joseph Nodule',
    questionId: 'anat_stomach_lymphatics_01',
    year: '1st Year',
    subtopicKey: 'anatomy::abdomen::stomach_lymphatics'
  }
];

async function uploadFile(item) {
  const fileData = fs.readFileSync(item.localFile);
  const publicUrl = `https://${SUPABASE_URL}/storage/v1/object/public/diagrams/${item.storagePath}`;

  // 1. Storage Upload
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
          console.warn(`Storage note (${res.statusCode}): ${body}`);
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.write(fileData);
    req.end();
  });

  // 2. Upsert Row
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
  console.log(`Starting upload of ${BATCH.length} gallbladder & stomach diagrams...`);
  for (const item of BATCH) {
    try {
      await uploadFile(item);
    } catch (e) {
      console.error(`Failed ${item.storagePath}:`, e);
    }
  }
  console.log(`🎉 All ${BATCH.length} diagrams uploaded and registered!`);
}

main().catch(console.error);
