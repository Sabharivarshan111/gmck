// Generate the INSERT for orphaned plates whose question has been verified by
// hand. Throwaway: the SQL it prints is the artefact, and it is recorded in
// .agents/queue/.
const BASE = 'https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/';

/** Matches getQuestionId in mobile/src/lib/progress.ts. */
const qid = q => `question-${q.slice(0, 50).replace(/\s+/g, '-')}`;

// The bank's exact strings, copied from the scanner's output.
const BONE = 'Microscopic structure of bone **';
const CART = 'Microscopic structure of cartilages(All 3 types) ***';
const KIDNEY = 'Microscopic structure of kidney**';
const LIVER = 'Microscopic structure of liver and spleen ***';
const STOMACH = 'Microscopic structure of fundus of stomach';
const BLADDER =
  'Urinary Bladder – Parts, Relations, Ligaments, Interior, Nerve supply, Blood supply, Histology, Applied anatomy ***';
const VISUAL =
  'Draw and explain the visual pathway . Discuss the effects of lesions at various levels along its courses***';
const MIDGUT = 'Midgut rotation**';
const MYELOMA = 'Lab diagnosis of multiple myeloma**';
const PAROTID =
  'Surgical anatomy of parotid gland. Pleomorphic adenoma and its etiology, clinical features, diagnosis and management. (Page No: 478)***';
// The bank string starts "27. ". Every screen strips a leading number before it
// shows or looks up a question, so the row is filed under the stripped form —
// that is the `rawQuestion` the lookup asks about.
const RABIES =
  'Post exposure prophylaxis in prevention of human rabies ** (Aug 2016) [Pg:325]';

const rows = [
  // plate,                                          question, year, subject, type, prompt, primary?
  ['anatomy/compact_bone_histology_haversian.jpg', BONE, 'First Year', 'Anatomy', 'short-note', 'Haversian system in compact bone, transverse section', true],
  ['anatomy/compact_bone_handdrawn_pencils.jpg', BONE, 'First Year', 'Anatomy', 'short-note', 'Compact bone histology, hand-drawn', false],
  ['anatomy/compact_bone_histology_plain_white.jpg', BONE, 'First Year', 'Anatomy', 'short-note', 'Compact bone histology, plain plate', false],
  ['anatomy/ground_bone_grey_graphite_pencil.jpg', BONE, 'First Year', 'Anatomy', 'short-note', 'Ground bone preparation, graphite', false],

  ['anatomy/elastic_cartilage_histology_plate.jpg', CART, 'First Year', 'Anatomy', 'short-note', 'Elastic cartilage histology', true],
  ['anatomy/fibrocartilage_histology_plate.jpg', CART, 'First Year', 'Anatomy', 'short-note', 'Fibrocartilage histology', false],

  ['anatomy/kidney_cortex_histology_plate.jpg', KIDNEY, 'First Year', 'Anatomy', 'short-note', 'Kidney cortex histology, glomeruli and tubules', true],
  ['anatomy/liver_histology_plate.jpg', LIVER, 'First Year', 'Anatomy', 'short-note', 'Liver lobule histology', true],
  ['anatomy/stomach_fundus_histology_plate.jpg', STOMACH, 'First Year', 'Anatomy', 'short-note', 'Fundus of stomach histology, gastric glands', true],
  ['anatomy/histology_urinary_bladder_urothelium.jpg', BLADDER, 'First Year', 'Anatomy', 'essay', 'Urothelium of the urinary bladder', true],
  ['anatomy/midgut_rotation_embryology_stages.jpg', MIDGUT, 'First Year', 'Anatomy', 'short-note', 'Stages of midgut rotation', true],

  ['anatomy/visual_pathway_field_defects.jpg', VISUAL, 'First Year', 'Physiology', 'essay', 'Visual pathway with field defects at each level', true],
  ['pathology/multiple_myeloma_plasma_cells_histology.jpg', MYELOMA, 'First Year', 'Biochemistry', 'short-note', 'Plasma cells in multiple myeloma', true],
  ['pathology/pleomorphic_adenoma_salivary_gland_histology.jpg', PAROTID, 'Final Year', 'General Surgery', 'essay', 'Pleomorphic adenoma histology, salivary gland', true],
  ['community/rabies_pep_algorithm.jpg', RABIES, 'Third Year', 'Community Medicine', 'short-note', 'Post-exposure prophylaxis algorithm for rabies', true],
];

const esc = s => s.replace(/'/g, "''");
const out = [];
const slug = p => p.split('/').pop().replace(/\.[a-z]+$/i, '').replace(/_/g, '-');

for (const [plate, question, year, subject, type, prompt, isPrimary] of rows) {
  // question_id is UNIQUE, so only ONE plate per question can hold the bank
  // key. The extras are reachable through the question_text query instead —
  // which is why their question_text is the same bank string.
  const id = isPrimary ? qid(question) : `question-${slug(plate)}`;
  out.push(
    `  ('${esc(id)}', '${esc(year)}', '${esc(subject)}', '${esc(type)}', ` +
      `'${esc(question)}', '${esc(type)}', 'other', false, '${esc(prompt)}', ` +
      `'approved', '${esc(plate)}', '${BASE}${esc(plate)}', true)`,
  );
}

process.stdout.write(
  'insert into public.question_diagrams\n' +
    '  (question_id, year, subject, subtopic_key, question_text, question_type,\n' +
    '   diagram_kind, needs_ai_raster, render_prompt, status, storage_path,\n' +
    '   public_url, reviewed)\nvalues\n' +
    out.join(',\n') +
    '\non conflict (question_id) do nothing;\n',
);
