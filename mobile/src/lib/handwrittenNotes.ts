import { supabase } from './supabase';
import { collectQuestions, type BankNode } from './questionBank';
import { clampQuestions } from './notesLimits';

/**
 * Handwritten-notes generation, ported from
 * src/components/handwritten/HandwrittenNotesHub.tsx.
 *
 * The edge function generates a topic's notes in batches of questions, so a
 * large topic arrives over several calls that are merged client-side. The
 * batch size, inter-batch delay and request shape all match the web app, since
 * they are tuned to the provider's throughput limits.
 */

export interface Section {
  type: string;
  title: string;
  icon?: string;
  pyqYears?: string[];
  payload: Record<string, unknown>;
}

export interface NotesContent {
  highYieldTip?: string;
  pyqYears?: string[];
  diagramUrl?: string;
  sections: Section[];
}

export interface LeafTopic {
  /** Stable identity for the cache: "pathology::paper-1/neoplasia". */
  key: string;
  name: string;
  breadcrumb: string;
  questions: string[];
}

export const NOTES_BATCH_SIZE = 10;
/** Keeps direct Google AI Studio keys under safer throughput. */
export const INTER_BATCH_DELAY_MS = 25_000;

/** A node is a leaf when its children are only question buckets. */
function isLeafShape(node: BankNode): boolean {
  const subs = node?.subtopics as Record<string, BankNode> | undefined;
  if (!subs) {
    return true;
  }
  return Object.keys(subs).every(
    key =>
      key === 'essay' ||
      key === 'short-note' ||
      key === 'short-notes' ||
      Array.isArray(subs[key]?.questions),
  );
}

/** Every leaf topic under a subject that has at least one question. */
export function flattenSubjectTopics(
  subjectKey: string,
  node: BankNode | undefined,
): LeafTopic[] {
  const out: LeafTopic[] = [];

  function walk(
    current: BankNode | undefined,
    keyPath: string[],
    namePath: string[],
  ) {
    if (!current || typeof current !== 'object') {
      return;
    }
    const unique = Array.from(
      new Set([
        ...collectQuestions(current, 'essay'),
        ...collectQuestions(current, 'short-notes'),
      ]),
    ).filter(Boolean);

    const subs = current.subtopics as Record<string, BankNode> | undefined;
    const hasChildren = subs && typeof subs === 'object';

    if (
      unique.length > 0 &&
      (!hasChildren || Object.keys(subs).length === 0 || isLeafShape(current))
    ) {
      out.push({
        key: `${subjectKey}::${keyPath.join('/')}`,
        name: namePath[namePath.length - 1] ?? current.name ?? 'Topic',
        breadcrumb: namePath.join(' › '),
        questions: unique,
      });
      return;
    }

    if (hasChildren) {
      for (const [key, value] of Object.entries(subs)) {
        walk(value, [...keyPath, key], [...namePath, value?.name ?? key]);
      }
    }
  }

  walk(node, [], [node?.name ?? subjectKey]);

  const seen = new Set<string>();
  return out.filter(topic =>
    seen.has(topic.key) ? false : (seen.add(topic.key), true),
  );
}

/** Combine per-batch results, folding same-titled sections together. */
export function mergeNotes(parts: (NotesContent | null)[]): NotesContent {
  const merged: NotesContent = { highYieldTip: '', pyqYears: [], sections: [] };
  const extraTips: string[] = [];
  const years = new Set<string>();
  const byTitle = new Map<string, Section>();

  for (const part of parts) {
    if (!part) {
      continue;
    }
    if (part.highYieldTip) {
      if (!merged.highYieldTip) {
        merged.highYieldTip = part.highYieldTip;
      } else {
        extraTips.push(part.highYieldTip);
      }
    }
    if (Array.isArray(part.pyqYears)) {
      for (const year of part.pyqYears) {
        if (year) {
          years.add(String(year));
        }
      }
    }
    if (Array.isArray(part.sections)) {
      for (const section of part.sections) {
        const key = (section?.title ?? '').toLowerCase().trim();
        if (!key) {
          merged.sections.push(section);
          continue;
        }
        const existing = byTitle.get(key);
        if (!existing) {
          byTitle.set(key, section);
          merged.sections.push(section);
        } else if (
          Array.isArray(existing.payload?.items) &&
          Array.isArray(section.payload?.items)
        ) {
          existing.payload.items = [
            ...(existing.payload.items as unknown[]),
            ...(section.payload.items as unknown[]),
          ];
        }
      }
    }
  }

  if (extraTips.length) {
    merged.highYieldTip = `${merged.highYieldTip} ${extraTips.join(
      ' ',
    )}`.trim();
  }
  merged.pyqYears = Array.from(years).sort();
  return merged;
}

export interface BatchResult {
  cached: boolean;
  content: NotesContent;
  batchIndex: number;
  totalBatches: number;
  hasMore: boolean;
  estSecondsPerBatch: number;
}

interface FunctionErrorContext {
  json?: () => Promise<{ error?: unknown }>;
  text?: () => Promise<string>;
}

/** Edge-function errors carry the useful message in the response body. */
async function unwrapError(error: {
  message?: string;
  context?: unknown;
}): Promise<Error> {
  let message = error.message ?? 'Failed';
  try {
    const context = error.context as FunctionErrorContext | undefined;
    if (context?.json) {
      const body = await context.json();
      if (body?.error) {
        message =
          typeof body.error === 'string'
            ? body.error
            : JSON.stringify(body.error);
      }
    } else if (context?.text) {
      const text = await context.text();
      if (text) {
        message = text.slice(0, 300);
      }
    }
  } catch {
    // Keep the original message.
  }
  return new Error(message);
}

interface TopicRequest {
  topic: LeafTopic;
  yearLabel: string;
  subject: string;
}

function baseBody({ topic, yearLabel, subject }: TopicRequest) {
  return {
    subtopicKey: topic.key,
    year: yearLabel,
    subject,
    subtopicName: topic.name,
    questions: clampQuestions(topic.questions),
  };
}

export async function fetchNotesBatch(
  request: TopicRequest,
  batchIndex: number,
  regenerate: boolean,
): Promise<BatchResult> {
  const { data, error } = await supabase.functions.invoke(
    'generate-handwritten-notes',
    {
      body: {
        ...baseBody(request),
        batchIndex,
        batchSize: NOTES_BATCH_SIZE,
        // Only the first batch may bust the cache.
        regenerate: regenerate && batchIndex === 0,
      },
    },
  );
  if (error) {
    throw await unwrapError(error);
  }
  if (data?.error) {
    throw new Error(String(data.error));
  }
  return data as BatchResult;
}

/** Persist the merged result so later opens hit the cache. Non-fatal. */
export async function saveMergedNotes(
  request: TopicRequest,
  content: NotesContent,
): Promise<void> {
  try {
    await supabase.functions.invoke('generate-handwritten-notes', {
      body: { ...baseBody(request), saveContent: true, content },
    });
  } catch {
    // Caching is best-effort.
  }
}

export async function applyNotesEdit(
  request: TopicRequest,
  content: NotesContent,
  editInstruction: string,
): Promise<NotesContent> {
  const { data, error } = await supabase.functions.invoke(
    'generate-handwritten-notes',
    {
      body: { ...baseBody(request), content, editInstruction },
    },
  );
  if (error) {
    throw await unwrapError(error);
  }
  if (data?.error) {
    throw new Error(String(data.error));
  }
  const updated = data?.content as NotesContent | undefined;
  if (!updated?.sections) {
    throw new Error('AI edit returned invalid notes.');
  }
  return updated;
}

/**
 * A handwritten note for **one** question.
 *
 * The web app's third-year triple tap does this (QuestionCard.tsx dispatches
 * `orbit:single-note`, SingleQuestionNoteOverlay calls the function): third
 * year is Community Medicine and Forensic Medicine, and those are the two
 * subjects `generate-handwritten-notes` grounds in a real textbook — Sia and
 * Vision, bundled into the function itself. Sending the question to
 * `ask-gemini` instead, as the native app did, gets a general-purpose answer
 * from a model that has never seen either book.
 *
 * `singleMode` is what makes the function treat one question as an essay
 * rather than a batch item, so the depth matches what the exam asks for.
 *
 * **The key has to match the web app's character for character.** It is
 * `single::<subjectKey>::<hash>`, the hash is that app's own string hash, and
 * `subtopicName` is the first 80 characters — because the rows those keys
 * point at are not empty. The diagram pass wrote a
 * `🎨 High-Yield Visual Exam Diagram` section into 75+ existing
 * `handwritten_notes` rows, so a key that matches returns a note with its
 * picture already in it, instantly and for free. A key that is merely
 * *similar* misses every one of them, regenerates, and spends quota to arrive
 * somewhere worse.
 */
export interface SingleNoteRequest {
  question: string;
  subjectKey: string;
  subjectName: string;
  yearLabel: string;
}

/**
 * The identity of one question's note.
 *
 * Every call about that note — generate, propose an edit, save the result —
 * has to carry the identical body, or the edge function looks at a different
 * cache row than the one on screen. Built in one place for that reason.
 */
function singleNoteBody(request: SingleNoteRequest): Record<string, unknown> {
  const clean = request.question.trim();
  return {
    subtopicKey: `single::${request.subjectKey}::${hashKey(clean)}`,
    year: request.yearLabel,
    /*
     * No fallback subject. This read `|| 'Community Medicine'`, which was
     * harmless while the feature was third-year-only and Community was most of
     * it — an empty subject there guessed right. It is now offered for Anatomy,
     * Physiology, Biochemistry, Pharmacology, Pathology and Microbiology, where
     * the same guess grounds the answer in Park's Community Medicine and
     * returns it with a textbook's confidence. A wrong book is worse than none:
     * the server falls back to general MBBS knowledge when it cannot place the
     * subject, and says nothing false.
     */
    subject: request.subjectName || request.subjectKey,
    subtopicName: clean.slice(0, 80),
    questions: clampQuestions([clean]),
    singleMode: true,
  };
}

async function invokeNotes(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke(
    'generate-handwritten-notes',
    { body },
  );
  if (error) {
    throw await unwrapError(error);
  }
  if (data?.error) {
    throw new Error(String(data.error));
  }
  return (data ?? {}) as Record<string, unknown>;
}

export const DIAGRAM_STOP_WORDS = new Set([
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
  'life', 'cycle', 'cycles', 'diagram', 'draw', 'drawn', 'neat', 'labelled', 'question',
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
  'wall', 'walls', 'cord', 'blood', 'reflex', 'reflexes',
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
  'definition', 'definitions', 'sequence', 'reaction', 'reactions', 'energetics',
  'regulation', 'mechanism', 'mechanisms', 'steps', 'pathway', 'pathways',
  'transport', 'transports', 'passive', 'active', 'fate', 'synthesis',
  'degradation', 'metabolism', 'abnormalities', 'important', 'significance',
  'molecules', 'molecule', 'overview', 'pathophysiology', 'complications',
]);

function normalizeSubject(keyOrName?: string): string | undefined {
  if (!keyOrName) return undefined;
  const s = keyOrName.toLowerCase().replace(/[-_]/g, ' ').trim();
  if (s.includes('anat')) return 'Anatomy';
  if (s.includes('physio')) return 'Physiology';
  if (s.includes('biochem')) return 'Biochemistry';
  if (s.includes('patho')) return 'Pathology';
  if (s.includes('pharm')) return 'Pharmacology';
  if (s.includes('micro')) return 'Microbiology';
  if (s.includes('comm') || s.includes('psm')) return 'Community Medicine';
  if (s.includes('foren') || s.includes('fmt')) return 'Forensic Medicine';
  if (s.includes('ent')) return 'ENT';
  if (s.includes('ophth')) return 'Ophthalmology';
  if (s.includes('surg') || s.includes('ortho')) return 'General Surgery and Orthopaedics';
  if (s.includes('med')) return 'General Medicine';
  if (s.includes('paed') || s.includes('ped')) return 'Paediatrics';
  if (s.includes('obg') || s.includes('gyn') || s.includes('obst')) return 'Obstetrics & Gynaecology';
  return undefined;
}

/**
 * Known distinct anatomical/clinical entities to prevent cross-organ and cross-topic collisions.
 */
const EXCLUSIVE_ENTITIES = [
  // Anatomy
  ['temporomandibular', 'tmj', 'mandible', 'mandibular'],
  ['shoulder', 'glenohumeral', 'scapula', 'acromion', 'rotator cuff'],
  ['synovial', 'synovial joint', 'diarthrodial', 'articular capsule'],
  ['cartilaginous', 'synchondrosis', 'symphysis', 'primary cartilaginous', 'secondary cartilaginous'],
  ['fibrous joint', 'suture', 'gomphosis', 'syndesmosis', 'schindylesis'],
  ['nutrient artery', 'blood supply of bone', 'blood supply of long bone', 'haversian artery'],
  ['ossification', 'endochondral', 'intramembranous', 'epiphyseal plate', 'growth plate', 'zone of proliferation'],
  ['compact bone', 'haversian system', 'osteon', 'volkmann', 'lamellae', 'lacunae'],
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
  // Biochemistry pathways & cycles
  ['tca', 'tca cycle', 'krebs', 'citric acid', 'citric acid cycle', 'tricarboxylic', 'anaplerosis', 'anaplerotic', 'citrate synthase'],
  ['glycolysis', 'embden', 'meyerhof', 'hexokinase', 'glucokinase', 'phosphofructokinase', 'pfk 1', 'pfk-1', 'pyruvate kinase', 'rapoport'],
  ['gluconeogenesis', 'cori cycle', 'cahill cycle', 'alanine cycle', 'pyruvate carboxylase', 'pepck', 'fructose 1 6 bisphosphatase', 'glucose 6 phosphatase'],
  ['glycogen', 'glycogenesis', 'glycogenolysis', 'von gierke', 'pompe', 'cori disease', 'mcardle', 'glycogen storage'],
  ['hmp shunt', 'pentose phosphate', 'g6pd', 'favism', 'transketolase', 'transaldolase'],
  ['urea cycle', 'hyperammonemia', 'ornithine', 'citrulline', 'argininosuccinate', 'arginase', 'carbamoyl phosphate synthetase i'],
  ['beta oxidation', 'carnitine', 'carnitine shuttle', 'cpt-1', 'cpt-2', 'acyl coa dehydrogenase'],
  ['ketogenesis', 'ketone body', 'ketone bodies', 'ketolysis', 'dka', 'diabetic ketoacidosis', 'hmg coa synthase'],
  ['cholesterol', 'statin', 'hmg coa reductase', 'mevalonate', 'squalene'],
  ['lipoprotein', 'chylomicron', 'chylomicrons', 'vldl', 'ldl', 'hdl', 'reverse cholesterol transport', 'rct', 'abetalipoproteinemia', 'tangier', 'atherogenesis', 'dyslipidemia', 'hyperlipoproteinemia'],
  ['bilirubin', 'jaundice', 'heme catabolism', 'heme degradation', 'urobilinogen', 'stercobilin', 'kernicterus', 'crigler', 'gilbert', 'dubinhohnson', 'rotor'],
  ['heme synthesis', 'porphyria', 'porphyrias', 'ala synthase', 'lead poisoning', 'acute intermittent porphyria', 'coproporphyria'],
  ['purine', 'uric acid', 'gout', 'lesch nyhan', 'prpp', 'allopurinol', 'salvage pathway'],
  ['pyrimidine', 'orotic acid', 'orotic aciduria', 'carbamoyl phosphate synthetase ii', 'cad enzyme'],
  ['phenylalanine', 'tyrosine', 'pku', 'phenylketonuria', 'alkaptonuria', 'albinism', 'homogentisic'],
  ['tryptophan', 'serotonin', 'melatonin', 'carcinoid', 'hartnup', 'niacin', 'pellagra'],
  ['one carbon', 'methionine', 'homocysteine', 'folate trap', 'sam', 'tetrahydrofolate'],
  ['enzyme kinetics', 'lineweaver', 'burk', 'michaelis', 'menten', 'km', 'vmax', 'competitive inhibition', 'non competitive'],
  ['electrophoresis', 'spep', 'serum protein electrophoresis', 'multiple myeloma', 'm band', 'gamma globulin'],
  ['electron transport chain', 'etc complexes', 'oxidative phosphorylation', 'chemiosmotic', 'atp synthase', 'rotenone', 'cyanide', 'uncoupler', 'dnp'],
  ['visual cycle', 'wald', 'rhodopsin', 'vitamin a', 'retinal', 'opsin', 'night blindness'],
  ['translation', 'ribosome', 'elongation', 'initiation factor', 'tetracycline', 'chloramphenicol', 'erythromycin', 'cycloheximide'],
  ['cell membrane transport', 'transport mechanisms', 'passive transport', 'simple diffusion', 'facilitated diffusion', 'sodium potassium pump', 'na k atpase', 'ping pong mechanism', 'ping-pong'],
  // Physiology
  ['action potential', 'resting membrane potential', 'depolarization', 'repolarization', 'hyperpolarization'],
  ['cardiac cycle', 'wiggers', 'isovolumetric', 'ejection phase', 'atrial systole'],
  ['pacemaker', 'cardiac action potential', 'phase 4 depolarization', 'sa node'],
  ['coagulation', 'hemostasis', 'intrinsic pathway', 'extrinsic pathway', 'thrombin', 'fibrinogen', 'clotting factor'],
  ['erythropoiesis', 'erythropoietin', 'proerythroblast', 'reticulocyte', 'normoblast'],
  ['baroreceptor', 'carotid sinus', 'aortic arch', 'buffer nerve', 'vasomotor center'],
  ['raas', 'renin', 'angiotensin', 'aldosterone', 'juxtaglomerular', 'macula densa'],
  ['gfr', 'glomerular filtration', 'podocyte', 'filtration barrier', 'starling forces'],
  ['countercurrent', 'vasa recta', 'loop of henle', 'medullary hyperosmolality'],
  ['spirogram', 'lung volumes', 'vital capacity', 'fev1', 'fvc', 'residual volume'],
  ['oxygen hemoglobin', 'dissociation curve', 'bohr effect', 'haldane effect', 'p50', '2,3-bpg'],
  ['neural control of respiration', 'dorsal respiratory group', 'drg', 'vrg', 'pneumotaxic', 'apneustic'],
  ['gastric acid', 'parietal cell', 'proton pump', 'h/k atpase', 'gastrin', 'histamine h2', 'vagus'],
  ['neuromuscular junction', 'nmj', 'acetylcholine', 'motor end plate', 'myasthenia gravis'],
  ['sarcomere', 'cross bridge', 'actin', 'myosin', 'troponin', 'tropomyosin', 'sliding filament'],
  ['basal ganglia', 'direct pathway', 'indirect pathway', 'striatum', 'substantia nigra', 'parkinson'],
  ['pyramidal tract', 'corticospinal', 'lateral corticospinal', 'internal capsule', 'upper motor neuron'],
  ['visual pathway', 'optic chiasma', 'bitemporal hemianopia', 'homonymous hemianopia', 'lateral geniculate'],
  ['micturition', 'cystometrogram', 'detrusor', 'internal sphincter', 'pudendal nerve'],
  ['menstrual cycle', 'follicular phase', 'luteal phase', 'ovulation', 'lh surge', 'endometrium'],
  ['spermatogenesis', 'sertoli', 'leydig', 'blood testis barrier', 'fsh', 'testosterone'],
  ['glucose homeostasis', 'insulin', 'glucagon', 'beta cell', 'islet of langerhans'],
  ['renal acidification', 'bicarbonate reabsorption', 'glutaminase', 'titratable acid'],
];

/**
 * Build an authentic, textbook-grounded Gemini image generation prompt for any MBBS question.
 */
export function buildGeminiPromptForQuestion(
  question: string,
  subject?: string,
): string {
  const cleanQ = question
    .replace(/[0-9]+\./g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[*#★☆]/g, '')
    .trim();

  const subj = normalizeSubject(subject) || 'Medical Science';

  const textbook = `standard MBBS ${subj} curriculum benchmark`;

  return `A professional university exam diagram for the MBBS ${subj} topic: "${cleanQ}".\n\nTextbook Grounding: Based directly on standard schematics from ${textbook}.\nLayout & Style: Crisp 2D medical textbook illustration, anatomical line art with soft watercolor shading, straight horizontal leader lines with clear bold labels, strictly centered on a solid pure white background (#FFFFFF) with high contrast and zero clutter.`;
}

/**
 * Look up ALL authentic diagrams from `question_diagrams` for a question or topic query.
 * Scoped strictly by subject and exclusive entity families to prevent false positives.
 */
export async function findAllDiagramsForQuery(
  query: string,
  subjectKey?: string,
  subjectName?: string,
): Promise<Array<{ url: string; title?: string }>> {
  const clean = query
    .replace(/[0-9]+\./g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[*#★☆]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length < 4) {
    return [];
  }

  const queryLower = clean.toLowerCase();
  const canonicalSubject = normalizeSubject(subjectName || subjectKey);
  if (!canonicalSubject) {
    return [];
  }

  const matchingFamily = EXCLUSIVE_ENTITIES.find(family =>
    family.some(kw => queryLower.includes(kw)),
  );

  // If query is not in a specific known diagram family, do not loose-match on generic words
  if (!matchingFamily) {
    return [];
  }

  try {
    const { data } = await supabase
      .from('question_diagrams')
      .select('public_url, storage_path, question_text, subject')
      .not('public_url', 'is', null)
      .ilike('subject', `%${canonicalSubject}%`);

    if (!data || data.length === 0) {
      return [];
    }

    const matches: Array<{ url: string; title: string; score: number }> = [];
    const seenUrls = new Set<string>();

    for (const row of data) {
      if (!row.public_url || !row.question_text) continue;
      if (seenUrls.has(row.public_url)) continue;

      const rowText = row.question_text.toLowerCase();
      const storagePath = (row.storage_path || '').toLowerCase();

      // Strict barrier: candidate MUST match the specific entity family
      const rowMatchesFamily = matchingFamily.some(
        kw => rowText.includes(kw) || storagePath.includes(kw),
      );
      if (!rowMatchesFamily) {
        continue;
      }

      // Ignore storage path if it explicitly belongs to a different subject prefix
      const subjectPrefix = canonicalSubject.toLowerCase().slice(0, 4);
      if (storagePath.length > 5 && !storagePath.includes(subjectPrefix) && !storagePath.includes('general')) {
        const otherSubjects = ['physiology', 'biochemistry', 'pathology', 'pharmacology', 'microbiology', 'forensic', 'community'];
        const isCrossSubject = otherSubjects.some(os => !canonicalSubject.toLowerCase().includes(os) && storagePath.startsWith(os + '/'));
        if (isCrossSubject) continue;
      }

      seenUrls.add(row.public_url);
      matches.push({
        url: row.public_url,
        title: row.question_text,
        score: 10,
      });
    }

    return matches.map(m => ({ url: m.url, title: m.title }));
  } catch (err) {
    console.warn('[handwrittenNotes] diagram lookup failed:', err);
  }
  return [];
}

/**
 * Ensures single-question note content carries its authentic visual exam diagrams,
 * or attaches a ready-to-use Gemini prompt if no pre-rendered diagram exists.
 * Automatically cleans any mismatched/false-positive diagram sections.
 */
export async function ensureSingleNoteDiagram(
  content: NotesContent,
  request: SingleNoteRequest,
): Promise<NotesContent> {
  const queryLower = request.question.toLowerCase();
  const matchingFamily = EXCLUSIVE_ENTITIES.find(family =>
    family.some(kw => queryLower.includes(kw)),
  );

  // Clean out any mismatched/corrupted diagram sections from old cached runs
  const cleanedSections = (content.sections || []).filter(s => {
    const isDiagram =
      s.icon === '🎨' ||
      (typeof s.payload?.text === 'string' &&
        s.payload.text.includes('supabase.co/storage/v1/object/public/diagrams'));
    if (!isDiagram) {
      return true;
    }
    // If it's a diagram, verify it actually matches the question's family
    if (!matchingFamily) {
      return false; // Question has no matching diagram family, so strip diagram
    }
    const text = (
      (s.title || '') + ' ' + (typeof s.payload?.text === 'string' ? s.payload.text : '')
    ).toLowerCase();
    const matchesFamily = matchingFamily.some(kw => text.includes(kw));
    return matchesFamily;
  });

  const hasValidDiagram = cleanedSections.some(
    s =>
      s.icon === '🎨' ||
      (typeof s.payload?.text === 'string' &&
        s.payload.text.includes('supabase.co/storage/v1/object/public/diagrams')),
  );

  if (hasValidDiagram) {
    return { ...content, sections: cleanedSections };
  }

  const diagrams = await findAllDiagramsForQuery(
    request.question,
    request.subjectKey,
    request.subjectName,
  );

  if (diagrams.length === 0) {
    return { ...content, sections: cleanedSections, diagramUrl: undefined };
  }

  // Attach ALL authentic matching diagrams as rich visual sections
  const diagramSections: Section[] = diagrams.map((diag, idx) => {
    const cleanTitle = (diag.title || request.question)
      .replace(/[0-9]+\./g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/[*#★☆]/g, '')
      .trim();

    const sectionTitle =
      diagrams.length > 1
        ? `High-Yield Visual Exam Diagram (${idx + 1}/${diagrams.length})`
        : 'High-Yield Visual Exam Diagram';

    return {
      type: 'definition',
      title: sectionTitle,
      icon: '🎨',
      payload: {
        text: `![${cleanTitle}](${diag.url})\n\n💡 High-Yield Continuous Visual Mnemonic (Standard Textbook Grounded)`,
      },
    };
  });

  const enriched: NotesContent = {
    ...content,
    diagramUrl: diagrams[0]?.url,
    sections: [...diagramSections, ...cleanedSections],
  };

  // Best effort save back to Supabase
  try {
    const clean = request.question.trim();
    await supabase.from('handwritten_notes').upsert({
      subtopic_key: `single::${request.subjectKey}::${hashKey(clean)}`,
      year: request.yearLabel,
      subject: request.subjectName || request.subjectKey || 'Medical Science',
      subtopic_name: clean.slice(0, 80),
      content: enriched,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Non-fatal
  }

  return enriched;
}

export async function fetchSingleQuestionNote(
  request: SingleNoteRequest,
  regenerate = false,
): Promise<NotesContent> {
  const data = await invokeNotes({ ...singleNoteBody(request), regenerate });
  const content = data.content as NotesContent | undefined;
  if (!content) {
    throw new Error('The note came back empty. Tap to try again.');
  }
  return ensureSingleNoteDiagram(content, request);
}

export interface NoteProposal {
  /** Where the answer came from, which is the thing worth knowing before saying yes. */
  source: 'textbook' | 'knowledge' | 'web';
  found: boolean;
  summary: string[];
  content: NotesContent;
}

/**
 * Ask for a change without making it.
 *
 * `proposeOnly` is the whole point: the function looks the request up in the
 * reference textbook, drafts the change, and returns it *without writing
 * anything*. Nothing is saved until the reader says yes, so a wrong answer
 * costs a tap rather than the notes they were revising from.
 *
 * `useWeb` is the second try, offered only after a rejection — the textbook is
 * the source that should win, and reaching past it by default would quietly
 * turn a grounded note into a search result.
 */
export async function proposeNoteEdit(
  request: SingleNoteRequest,
  content: NotesContent,
  editInstruction: string,
  useWeb = false,
): Promise<NoteProposal> {
  const data = await invokeNotes({
    ...singleNoteBody(request),
    content,
    editInstruction,
    proposeOnly: true,
    useWeb,
  });
  const proposed = data.content as NotesContent | undefined;
  if (!proposed?.sections) {
    throw new Error('The answer came back in a shape the app could not read.');
  }
  const source = data.source;
  return {
    source: source === 'textbook' || source === 'web' ? source : 'knowledge',
    found: Boolean(data.found),
    summary: Array.isArray(data.summary)
      ? (data.summary as string[]).map(String)
      : [],
    content: proposed,
  };
}

/**
 * Fold a proposal into the notes instead of overwriting them.
 *
 * Gemini answers the question it was asked, which means it returns only the
 * sections it touched. Treating that as the new note wipes every section it
 * did not mention — the reader asks for one correction and loses the other
 * nine. Same-titled sections are replaced, new ones appended, everything else
 * left alone.
 */
export function mergeProposal(
  previous: NotesContent | null,
  next: NotesContent,
): NotesContent {
  if (!previous) {
    return next;
  }
  const keyOf = (section: Section) =>
    String(section?.title ?? '')
      .toLowerCase()
      .trim();
  const out = [...(previous.sections ?? [])];
  const indexByKey = new Map<string, number>();
  out.forEach((section, i) => {
    const key = keyOf(section);
    if (key && !indexByKey.has(key)) {
      indexByKey.set(key, i);
    }
  });
  for (const section of next.sections ?? []) {
    const key = keyOf(section);
    const at = key ? indexByKey.get(key) : undefined;
    if (at === undefined) {
      out.push(section);
      if (key) {
        indexByKey.set(key, out.length - 1);
      }
    } else {
      out[at] = section;
    }
  }
  return {
    ...previous,
    highYieldTip: next.highYieldTip || previous.highYieldTip,
    pyqYears: Array.from(
      new Set([...(previous.pyqYears ?? []), ...(next.pyqYears ?? [])]),
    ),
    sections: out,
  };
}

/** Persist an accepted edit so the next open reads it back. Best-effort. */
export async function saveSingleNote(
  request: SingleNoteRequest,
  content: NotesContent,
): Promise<void> {
  try {
    await invokeNotes({
      ...singleNoteBody(request),
      saveContent: true,
      content,
    });
  } catch {
    // The reader already has the change on screen; failing to cache it is not
    // worth an error in their face.
  }
}

/**
 * A stable short key for one question.
 *
 * Same algorithm as the web app's overlay (`SingleQuestionNoteOverlay.tsx`),
 * so a question noted in the browser and the same question noted on the phone
 * land on one cached row rather than generating twice. Left shift by 5 minus
 * itself, forced back to int32 each step — change any of that and the two
 * apps stop sharing a cache silently.
 */
function hashKey(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}
