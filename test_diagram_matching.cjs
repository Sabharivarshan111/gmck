const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://pmtgeydtqypwrypshhsx.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdGdleWR0cXlwd3J5cHNoaHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODI2NzksImV4cCI6MjA1NjQ1ODY3OX0.wp6Ydx7oMy-_sMWd6YcxMaTtnyFBg15sH_3TMPw803U";
const supabase = createClient(supabaseUrl, anonKey);

const DIAGRAM_STOP_WORDS = new Set([
  'define', 'describe', 'explain', 'discuss', 'enumerate', 'classify', 'write',
  'short', 'note', 'notes', 'briefly', 'detail', 'types', 'various', 'causes',
  'features', 'clinical', 'management', 'treatment', 'prevention', 'control',
  'diagnosis', 'laboratory', 'importance', 'difference', 'differentiate',
  'compare', 'versus', 'medical', 'patient', 'person', 'child', 'female',
  'male', 'years', 'months', 'rules', 'rule', 'case', 'cases', 'study',
  'outline', 'aspects', 'factors', 'principles', 'methods', 'criteria',
  'guidelines', 'algorithm', 'signs', 'symptoms', 'procedure', 'investigations',
  'role', 'what', 'which', 'about', 'with', 'from', 'between', 'under',
  'their', 'does', 'have', 'been', 'give', 'name', 'list', 'state', 'applied',
  'life', 'cycle', 'diagram', 'draw', 'drawn', 'neat', 'labelled', 'question',
  'examination', 'appearance', 'effects', 'program', 'programme', 'scheme',
  'strategy', 'national', 'india', 'indian', 'level', 'levels', 'status',
  'health', 'community', 'public', 'primary', 'secondary', 'tertiary',
  'following', 'based', 'first', 'second', 'third', 'final', 'paper', 'topic',
  'practice', 'body', 'changes', 'death', 'living', 'post', 'mortem',
  'antemortem', 'postmortem', 'wounds', 'wound', 'injury', 'injuries',
  'poisons', 'poison', 'poisoning', 'acute', 'chronic', 'general', 'special',
  'system', 'systemic', 'organs', 'organ', 'human', 'structure', 'structures',
  'functions', 'function', 'parts', 'part', 'suitable', 'examples', 'available',
  'protection', 'act', 'acts', 'proof', 'therapeutic', 'classification',
  'bone', 'bones', 'artery', 'arteries', 'vein', 'veins', 'nerve', 'nerves',
  'muscle', 'muscles', 'joint', 'joints', 'gland', 'glands', 'duct', 'ducts',
  'wall', 'walls', 'cord', 'blood', 'reflex', 'reflexes', 'cycles',
  'disorder', 'disorders', 'disease', 'diseases', 'syndrome', 'syndromes',
  'supply', 'long', 'marrow', 'smear', 'picture', 'findings', 'origin',
  'course', 'distribution', 'branches', 'termination', 'anastomosis', 'relations',
  'articular', 'surface', 'surfaces', 'disc', 'discs', 'ligament', 'ligaments',
  'movement', 'movements', 'capsule', 'cavity', 'cavities', 'cartilage',
  'borders', 'border', 'fossa', 'tubercle', 'process', 'notch', 'insertion',
  'action', 'actions', 'innervation', 'tributaries', 'boundaries', 'contents',
  'extent', 'variation', 'variations', 'correlate', 'development', 'formation',
  'sites', 'presenting', 'location', 'anomalies', 'lesions', 'derivatives',
  'drainage', 'lymphatic', 'histology', 'gross', 'microscopic',
]);

const EXCLUSIVE_ENTITIES = [
  ['temporomandibular', 'tmj', 'mandible', 'mandibular'],
  ['shoulder', 'glenohumeral', 'scapula', 'acromion', 'rotator cuff'],
  ['knee', 'patella', 'meniscus', 'cruciate'],
  ['elbow', 'radioulnar', 'olecranon'],
  ['hip', 'acetabulum', 'iliofemoral'],
  ['wrist', 'carpal', 'carpometacarpal'],
  ['brachial', 'plexus', 'erbs'],
  ['femoral', 'femur'],
  ['popliteal'],
  ['axilla', 'axillary'],
  ['carotid'],
  ['cavernous'],
  ['intercostal'],
  ['coronary'],
  ['atrium', 'atrial'],
  ['cerebellum', 'cerebellar'],
  ['cerebrum', 'cerebral', 'internal capsule'],
  ['medulla', 'medullary'],
  ['pons', 'pontine'],
  ['midbrain'],
  ['facial nerve', 'facial'],
  ['median nerve', 'median'],
  ['ulnar nerve', 'ulnar'],
  ['radial nerve', 'radial'],
  ['sciatic'],
  ['duodenum', 'duodenal'],
  ['pancreas', 'pancreatic'],
  ['spleen', 'splenic'],
  ['liver', 'hepatic', 'portal'],
  ['kidney', 'renal'],
  ['stomach', 'gastric'],
  ['testis', 'testicular'],
  ['ovary', 'ovarian'],
  ['breast', 'mammary'],
  ['lung', 'lungs', 'bronchopulmonary'],
  ['larynx', 'laryngeal', 'vocal cord'],
  ['pharynx', 'pharyngeal'],
  ['palatine tonsil', 'tonsil'],
  ['tongue', 'lingual'],
  ['parotid'],
  ['thyroid'],
  ['pituitary'],
];

async function testQuery(query, subject) {
  console.log(`\n========================================`);
  console.log(`Testing Query: "${query}" (${subject})`);

  const clean = query.replace(/[0-9]+\./g, '').replace(/\(.*?\)/g, '').replace(/[*#★☆]/g, '').replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const queryLower = clean.toLowerCase();
  const matchingFamily = EXCLUSIVE_ENTITIES.find(family => family.some(kw => queryLower.includes(kw)));
  const words = queryLower.split(/\s+/).filter(w => w.length > 3 && !DIAGRAM_STOP_WORDS.has(w));

  console.log("Matching Family:", matchingFamily ? matchingFamily[0] : "None");
  console.log("Filtered Search Tokens:", words);

  const { data } = await supabase
    .from('question_diagrams')
    .select('public_url, storage_path, question_text, subject')
    .not('public_url', 'is', null)
    .ilike('subject', `%${subject}%`);

  const matches = [];
  const seenUrls = new Set();

  for (const row of (data || [])) {
    if (!row.public_url || !row.question_text) continue;
    if (seenUrls.has(row.public_url)) continue;

    const rowText = row.question_text.toLowerCase();
    const storagePath = (row.storage_path || '').toLowerCase();

    if (matchingFamily) {
      const rowMatchesFamily = matchingFamily.some(kw => rowText.includes(kw) || storagePath.includes(kw));
      if (!rowMatchesFamily) continue;
    }

    let score = 0;
    if (queryLower.length >= 15 && (rowText.includes(queryLower.slice(0, 25)) || queryLower.includes(rowText.slice(0, 25)))) {
      score += 10;
    }
    for (const w of words) {
      if (rowText.includes(w) || storagePath.includes(w)) score += 1;
    }

    if (score >= 1) {
      seenUrls.add(row.public_url);
      matches.push({ url: row.public_url, title: row.question_text, score });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  console.log(`FOUND ${matches.length} DIAGRAM(S):`);
  matches.forEach((m, idx) => {
    console.log(`  [${idx + 1}] (Score ${m.score}) ${m.url}`);
  });
}

async function main() {
  await testQuery(
    "Temporomandibular joint - type of joint, articular surface and disc, ligaments, relations, Blood supply, Nerve supply, movements, applied aspects**",
    "Anatomy"
  );

  await testQuery(
    "Shoulder joint - Type, articular surfaces, relations, ligaments, muscles producing movements and applied anatomy. **",
    "Anatomy"
  );

  await testQuery(
    "Knee Joint - Type, bones forming, ligaments, relations, movements, applied anatomy",
    "Anatomy"
  );
}

main();
