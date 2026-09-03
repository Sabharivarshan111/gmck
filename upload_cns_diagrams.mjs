import fs from 'node:fs';
import https from 'node:https';

const SUPABASE_URL = 'pmtgeydtqypwrypshhsx.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdGdleWR0cXlwd3J5cHNoaHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODI2NzksImV4cCI6MjA1NjQ1ODY3OX0.wp6Ydx7oMy-_sMWd6YcxMaTtnyFBg15sH_3TMPw803U';

const BATCH = [
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/opioid_receptors_pharmacology_1788270912468.jpg',
    storagePath: 'pharmacology/opioid_receptors_signaling_toxicity.jpg',
    subject: 'Pharmacology',
    questionText: 'Opioid Receptors (μ, δ, κ) & Acute Morphine Poisoning',
    questionId: 'pharm_opioid_receptors_01',
    year: '2nd Year',
    subtopicKey: 'pharmacology::cns::opioids'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/antiepileptic_drugs_mechanisms_1788270937587.jpg',
    storagePath: 'pharmacology/antiepileptic_drugs_mechanisms_action.jpg',
    subject: 'Pharmacology',
    questionText: 'Antiepileptic Drugs (AEDs) Sites & Mechanisms of Action',
    questionId: 'pharm_aeds_mechanisms_01',
    year: '2nd Year',
    subtopicKey: 'pharmacology::cns::antiepileptics'
  },
  {
    localFile: '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4/arachidonic_acid_nsaids_1788270956534.jpg',
    storagePath: 'pharmacology/arachidonic_acid_cascade_nsaids.jpg',
    subject: 'Pharmacology',
    questionText: 'Arachidonic Acid Cascade & Sites of NSAID Action',
    questionId: 'pharm_nsaids_arachidonic_01',
    year: '2nd Year',
    subtopicKey: 'pharmacology::autacoids::nsaids'
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
          console.log(`✅ Uploaded to Storage: ${item.storagePath}`);
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
  console.log(`Starting upload of ${BATCH.length} generated diagrams...`);
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
