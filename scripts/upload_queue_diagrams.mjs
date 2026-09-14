import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pmtgeydtqypwrypshhsx.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdGdleWR0cXlwd3J5cHNoaHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODI2NzksImV4cCI6MjA1NjQ1ODY3OX0.wp6Ydx7oMy-_sMWd6YcxMaTtnyFBg15sH_3TMPw803U';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

const GMCK_DIR = '/Users/sabharivarshan/.gemini/antigravity/scratch/gmck';

function getQuestionId(question) {
  return `question-${question.slice(0, 50).replace(/\s+/g, '-')}`;
}

const ITEMS = [
  {
    localFile: path.join(GMCK_DIR, 'public/diagrams/ent/otitis_media_with_effusion_glue_ear.jpg'),
    storagePath: 'ent/otitis_media_with_effusion_glue_ear.jpg',
    subject: 'ENT',
    year: '3rd Year',
    subtopic: 'ear',
    diagramKind: 'clinical',
    questions: [
      'Give an account of etiology, clinical features and treatment of glue ear. (Page No: 75)***',
      'Enumerate the common causes of conductive deafness. Describe the etiology, clinical features and management of secretory Otitis media. (Page No: 75)'
    ]
  },
  {
    localFile: path.join(GMCK_DIR, 'public/diagrams/ent/jna_modes_of_spread_anatomy.jpg'),
    storagePath: 'ent/jna_modes_of_spread_anatomy.jpg',
    subject: 'ENT',
    year: '3rd Year',
    subtopic: 'pharynx',
    diagramKind: 'anatomy',
    questions: [
      'What are the modes of spread and clinical features of Juvenile Nasopharyngeal Angiofibroma? (Page No: 279)'
    ]
  },
  {
    localFile: path.join(GMCK_DIR, 'public/diagrams/ent/peritonsillar_abscess_anatomy_signs.jpg'),
    storagePath: 'ent/peritonsillar_abscess_anatomy_signs.jpg',
    subject: 'ENT',
    year: '3rd Year',
    subtopic: 'pharynx',
    diagramKind: 'anatomy',
    questions: [
      'Describe the etiology, signs and symptoms of peritonsillar abscess. Mention the complications of the disease. (Page No: NA)'
    ]
  },
  {
    localFile: path.join(GMCK_DIR, 'public/diagrams/ophthalmology/crvo_fundus_tomato_splash.jpg'),
    storagePath: 'ophthalmology/crvo_fundus_tomato_splash.jpg',
    subject: 'Ophthalmology',
    year: '3rd Year',
    subtopic: 'diseases-of-retina',
    diagramKind: 'clinical',
    questions: [
      'What is Central retinal vein occlusion? (Page No: 253)**'
    ]
  },
  {
    localFile: path.join(GMCK_DIR, 'public/diagrams/ophthalmology/ophthalmia_neonatorum_etiology_clinical.jpg'),
    storagePath: 'ophthalmology/ophthalmia_neonatorum_etiology_clinical.jpg',
    subject: 'Ophthalmology',
    year: '3rd Year',
    subtopic: 'conjunctiva',
    diagramKind: 'clinical',
    questions: [
      'What is ophthalmia neonatorum? (Page No: 73)*****'
    ]
  }
];

async function main() {
  console.log('🚀 UPLOADING QUEUED MEDICAL DIAGRAMS TO SUPABASE STORAGE & DATABASE...');

  for (const item of ITEMS) {
    const fileBytes = fs.readFileSync(item.localFile);
    console.log(`📤 Uploading ${item.storagePath} (${(fileBytes.length / 1024).toFixed(1)} KB)...`);

    const { error: upErr } = await supabase.storage
      .from('diagrams')
      .upload(item.storagePath, fileBytes, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (upErr) {
      console.error(`❌ Upload error for ${item.storagePath}:`, upErr);
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/diagrams/${item.storagePath}`;
    console.log(`✅ Public URL: ${publicUrl}`);

    for (const qText of item.questions) {
      const qid = getQuestionId(qText);
      const row = {
        question_id: qid,
        year: item.year,
        subject: item.subject,
        subtopic_key: item.subtopic,
        question_text: qText,
        question_type: qText.toLowerCase().includes('essay') || qText.toLowerCase().includes('give an account') || qText.toLowerCase().includes('describe') ? 'essay' : 'short-notes',
        diagram_kind: item.diagramKind,
        storage_path: item.storagePath,
        public_url: publicUrl,
        status: 'approved',
        reviewed: true,
        updated_at: new Date().toISOString()
      };

      const { data: existing } = await supabase
        .from('question_diagrams')
        .select('id')
        .eq('question_id', qid)
        .maybeSingle();

      if (existing) {
        const { error: updateErr } = await supabase
          .from('question_diagrams')
          .update(row)
          .eq('id', existing.id);
        if (updateErr) console.error(`❌ Update error for "${qText}":`, updateErr);
        else console.log(`🔄 Updated question_diagrams row for: "${qText.slice(0, 45)}..."`);
      } else {
        const { error: insertErr } = await supabase
          .from('question_diagrams')
          .insert({ ...row, created_at: new Date().toISOString() });
        if (insertErr) console.error(`❌ Insert error for "${qText}":`, insertErr);
        else console.log(`✨ Inserted new question_diagrams row for: "${qText.slice(0, 45)}..."`);
      }
    }
  }

  console.log('🎉 ALL QUEUED DIAGRAMS UPLOADED AND REGISTERED SUCCESSFULLY!');
}

main().catch(console.error);
