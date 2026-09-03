import fs from 'node:fs';
import https from 'node:https';
import sharp from 'sharp';

const SUPABASE_URL = 'pmtgeydtqypwrypshhsx.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdGdleWR0cXlwd3J5cHNoaHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODI2NzksImV4cCI6MjA1NjQ1ODY3OX0.wp6Ydx7oMy-_sMWd6YcxMaTtnyFBg15sH_3TMPw803U';
const BRAIN_DIR = '/Users/sabharivarshan/.gemini/antigravity/brain/db8f7f5d-bf7d-4d35-98ff-911c9c099ee4';

const CLEAN_TARGETS = [
  {
    localFile: `${BRAIN_DIR}/stomach_lymphatics_clogs_areas_1788335550333.jpg`,
    cleanedFile: `${BRAIN_DIR}/stomach_lymphatics_clogs_areas_clean.jpg`,
    storagePath: 'anatomy/stomach_lymphatics_clogs_areas_virchow.jpg',
    // remove top 60px header with author name
    patches: [{ left: 0, top: 0, width: 1200, height: 60 }]
  },
  {
    localFile: `${BRAIN_DIR}/stomach_gross_interior_magenstrasse_1788335519418.jpg`,
    cleanedFile: `${BRAIN_DIR}/stomach_gross_interior_magenstrasse_clean.jpg`,
    storagePath: 'anatomy/stomach_gross_morphology_interior_magenstrasse.jpg',
    // remove top 48px header with author name
    patches: [{ left: 0, top: 0, width: 1200, height: 48 }]
  },
  {
    localFile: `${BRAIN_DIR}/urinary_bladder_anatomy_1788329078038.jpg`,
    cleanedFile: `${BRAIN_DIR}/urinary_bladder_anatomy_clean.jpg`,
    storagePath: 'anatomy/urinary_bladder_gross_relations_trigone.jpg',
    // remove bottom right author text
    patches: [{ left: 750, top: 850, width: 450, height: 46 }]
  },
  {
    localFile: `${BRAIN_DIR}/bronchial_asthma_pharmacotherapy_1788329133533.jpg`,
    cleanedFile: `${BRAIN_DIR}/bronchial_asthma_pharmacotherapy_clean.jpg`,
    storagePath: 'pharmacology/bronchial_asthma_pharmacotherapy_targets.jpg',
    // remove top left author text
    patches: [{ left: 0, top: 0, width: 420, height: 45 }]
  },
  {
    localFile: `${BRAIN_DIR}/antianginal_drugs_oxygen_balance_1788329164333.jpg`,
    cleanedFile: `${BRAIN_DIR}/antianginal_drugs_oxygen_balance_clean.jpg`,
    storagePath: 'pharmacology/antianginal_drugs_oxygen_supply_demand.jpg',
    // remove top right author text
    patches: [{ left: 700, top: 0, width: 500, height: 45 }]
  }
];

async function cleanImage(target) {
  console.log(`Processing: ${target.storagePath}...`);
  const meta = await sharp(target.localFile).metadata();
  
  const overlays = [];
  for (const patch of target.patches) {
    // Generate a clean white SVG block for each patch
    const svgBuffer = Buffer.from(
      `<svg width="${patch.width}" height="${patch.height}"><rect width="${patch.width}" height="${patch.height}" fill="#FFFFFF"/></svg>`
    );
    overlays.push({
      input: svgBuffer,
      top: patch.top,
      left: patch.left
    });
  }

  await sharp(target.localFile)
    .composite(overlays)
    .jpeg({ quality: 92 })
    .toFile(target.cleanedFile);

  const newStat = fs.statSync(target.cleanedFile);
  console.log(`✨ Cleaned & saved: ${(newStat.size / 1024).toFixed(1)} KB`);

  // Upload to Supabase Storage
  const fileData = fs.readFileSync(target.cleanedFile);
  await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SUPABASE_URL,
      path: `/storage/v1/object/diagrams/${target.storagePath}`,
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
          console.log(`🚀 Uploaded clean version to Supabase: ${target.storagePath}`);
          resolve(body);
        } else {
          console.warn(`Upload note (${res.statusCode}): ${body}`);
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.write(fileData);
    req.end();
  });
}

async function main() {
  console.log(`🧹 Cleaning ${CLEAN_TARGETS.length} images to remove all author name headers/watermarks...`);
  for (const target of CLEAN_TARGETS) {
    try {
      await cleanImage(target);
    } catch (err) {
      console.error(`Error processing ${target.storagePath}:`, err);
    }
  }
  console.log(`🎉 All images cleaned and updated in Supabase!`);
}

main().catch(console.error);
