/**
 * Which atlas parts make up an organ.
 *
 * Given an organ key from `ORGAN_ANATOMY_DATABASE` — or a vessel/nerve node id
 * from one of its `arterialNodes` / `venousNodes` / `nerveNodes` lists — this
 * returns every BodyParts3D element id that belongs to it, and that is what the
 * 3D view isolates, highlights and dims.
 *
 * It lives here, apart from `AnatomicalBody3D.tsx`, for one reason: that file
 * imports `three`, and three cannot be loaded by a plain Node script. Nothing
 * here imports anything at runtime — the only import is `import type`, which is
 * erased — so `scripts/simulator-organ-check.mjs` runs THIS function against the
 * real `public/models/atlas.json`. Keep it that way: a value import turns the
 * check into a check of a copy of the resolver, which is what it exists to stop.
 *
 * ---------------------------------------------------------------------------
 * Three rules, each of which was a bug that shipped
 * ---------------------------------------------------------------------------
 *
 * **1. A key selects a rule by whole words, never by substring.** It used to be
 * `key.includes('lad')`, so `bladder` — and `gallbladder`, and `urinary
 * bladder` — selected the *left anterior descending coronary artery*. Isolating
 * the gallbladder lit up twenty-two branches of the LAD alongside it. Every
 * `when` list here is matched with `\b` word boundaries.
 *
 * **2. A rule selects parts by whole words too, and only words that are its
 * own.** The diaphragm rule matched any part whose name contained `tendon`,
 * because the same branch also answered for the key `tendon` — so isolating the
 * diaphragm brought both calcaneal tendons up from the ankles.
 *
 * **3. A rule that claims a key owns the whole answer.** The set used to be
 * filled from the FMA concept table *and* the system table *and* the rule, in
 * that order, with no way to take anything back out. The heart rule carefully
 * excludes `cavity of …` — the hollow lumen casts — and all four chamber
 * cavities came back anyway, because the concept named "heart" had already
 * added them and `Set.add` has no opposite. Every exclusion written in this
 * file was advisory. Now a matching rule is the answer, and the concept/system
 * lookup is only the fallback for keys no rule claims.
 *
 * ---------------------------------------------------------------------------
 * What this atlas does not contain, and why that is answered with nothing
 * ---------------------------------------------------------------------------
 *
 * BodyParts3D models the central nervous system and the nerves of the orbit.
 * It contains **no peripheral nerves at all** — no vagus, phrenic, splanchnic,
 * sympathetic chain, recurrent laryngeal, intercostal, pectoral or axillary
 * nerve, and none of the limb nerves either. Measured, not assumed: search the
 * 2,234 part names for any of those words and the count is zero.
 *
 * The old resolver did not know that, so it fell through to "any part sharing a
 * word". Isolating the **vagus nerve** showed the ciliary ganglia, the
 * oculomotor and trochlear nerves and the supratrochlear nerve — the nerves of
 * the eye. Isolating the **phrenic nerve** showed the inferior phrenic and
 * musculophrenic *arteries and veins*. Isolating the **pectoral nerves** showed
 * all 139 parts of the nervous system at once.
 *
 * A student cannot tell a wrong answer from a right one here; that is the whole
 * reason they are looking. So a structure the atlas does not hold resolves to
 * an empty set and `describeAtlasTarget` says why, and the view says so on
 * screen. The dossier text beside it is unaffected — it still teaches the
 * vagus nerve, it just does not pretend to draw it.
 */
import type { Atlas, Part } from './atlasTypes';

// ---------------------------------------------------------------------------
// Whole-word matching
// ---------------------------------------------------------------------------

/**
 * A term matches on word boundaries, and the separators inside a multi-word
 * term are elastic: `[\s\-_]*` rather than a literal space.
 *
 * That last detail is not tidiness. BodyParts3D spells the same structure both
 * ways — `thoraco-acromial` in the part names, `thoracoacromial` in the organ
 * dossier's node id — so a literal match found nothing and the thoraco-acromial
 * artery resolved to zero parts while all eight of them sat in the atlas.
 */
const RX_CACHE = new Map<string, RegExp>();

function termRegex(term: string): RegExp {
  let rx = RX_CACHE.get(term);
  if (!rx) {
    const parts = term
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    rx = new RegExp(`\\b${parts.join('[\\s\\-_]*')}\\b`, 'i');
    RX_CACHE.set(term, rx);
  }
  return rx;
}

/**
 * Does `text` contain `term` as a whole word (or whole phrase)?
 *
 * Tested against the text twice, the second time with hyphens removed, because
 * BodyParts3D hyphenates the same word inconsistently and sometimes
 * inconsistently *with itself*: the gastro-epiploic ARTERIES carry a hyphen and
 * the gastroepiploic VEINS do not, so the stomach showed its venous drainage
 * along both curvatures and only half its arterial supply. Twenty-three part
 * names are hyphenated and every one of them has an unhyphenated spelling
 * somewhere in the literature.
 *
 * The elastic separator in `termRegex` covers the other direction — a term
 * written `thoraco acromial` matches both spellings — so between them a term
 * can be written either way and still find the part.
 */
export function hasTerm(text: string, term: string): boolean {
  const rx = termRegex(term);
  if (rx.test(text)) return true;
  return text.includes('-') && rx.test(text.replace(/-/g, ''));
}

const PREFIX_CACHE = new Map<string, RegExp>();

/**
 * Does a word in `text` START with `prefix`?
 *
 * Anatomy names are full of stems that only ever appear as prefixes — `cerebr`
 * for cerebrum and cerebral, `myocard`, `pericard`, `bronch`, `pulmon`,
 * `thalam` — so a whole-word test is the wrong tool for those and a plain
 * `includes` is the wrong tool for everything. This is the middle: bounded at
 * the start, free at the end.
 *
 * It is what stops `rib` matching **T**rib**utary of middle hepatic vein**, of
 * which this atlas has forty-three, and which used to open the skeleton.
 */
export function startsWord(text: string, prefix: string): boolean {
  let rx = PREFIX_CACHE.get(prefix);
  if (!rx) {
    rx = new RegExp(`\\b${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    PREFIX_CACHE.set(prefix, rx);
  }
  return rx.test(text);
}

function anyTerm(text: string, terms: readonly string[]): boolean {
  // Through hasTerm, not termRegex directly: the hyphen fallback lives there,
  // and bypassing it here is what kept the gastro-epiploic arteries out of the
  // stomach after that fallback was written.
  for (const t of terms) if (hasTerm(text, t)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// The rule table
// ---------------------------------------------------------------------------

/**
 * Parts whose `system` in the ontology is wrong, and what it should be.
 *
 * BodyParts3D's system labels come from its own taxonomy, and two groups of
 * them do not describe what the part IS. Everything that reads `part.system` —
 * which is the colour, the merge group, the isolation rules and the dossier
 * mapper — has to agree about this, so it is one table rather than a condition
 * repeated in four files with only one of them complete.
 *
 * **The cerebral ventricles are filed under `cardiac`**, because `ventricle`.
 * They are CSF spaces. Tapping the third ventricle used to open the heart.
 *
 * **The whole liver is filed under `venous`**, and that one is worth reading
 * twice: there is no part named "Liver" in this atlas. The liver parenchyma is
 * the nine Couinaud hepatovenous segments, II to IX, and because they are
 * `venous` the app painted the liver in vein blue and the abdomen view left it
 * out entirely — the abdominal rule takes the digestive and urinary systems and
 * names the vessels it wants, and "Hepatovenous segment VII" is neither. So
 * opening the abdomen showed a stomach, a bowel and a spleen with a hole where
 * the largest organ in it should be. The liver is a digestive organ; calling it
 * one fixes the colour and the omission together.
 */
export const MISFILED_SYSTEMS = new Map<string, string>([
  // CSF spaces, filed as cardiac
  ['FJ1730', 'nervous'], // Third ventricle
  ['FJ1731', 'nervous'], // Fourth ventricle
  ['FJ1752', 'nervous'], // Interventricular foramen (of Monro)
  ['FJ1767', 'nervous'], // Left lateral ventricle
  ['FJ1814', 'nervous'], // Right lateral ventricle
]);

/** Filled below from the atlas, so a renumbered export cannot silently drop a segment. */
export const CEREBRAL_CSF_IDS = new Set<string>(
  [...MISFILED_SYSTEMS].filter(([, sys]) => sys === 'nervous').map(([id]) => id)
);

/** Names that ARE the liver, whatever the ontology files them under. */
const HEPATIC_PARENCHYMA = /^hepatovenous segment/i;

/**
 * Apply `MISFILED_SYSTEMS` plus the hepatic-parenchyma rule.
 *
 * Called by the chunk loader once per part before anything is merged, and by
 * `scripts/render-organ-sheets.mjs` so the sheets show the same colours the app
 * does. It mutates rather than copying: the atlas is one object held for the
 * life of the page and 2,234 clones of it is not worth the purity.
 */
export function correctPartSystem(p: Part): Part {
  const fixed = MISFILED_SYSTEMS.get(p.id);
  if (fixed && p.system !== fixed) p.system = fixed as Part['system'];
  else if (HEPATIC_PARENCHYMA.test(p.name) && p.system !== 'digestive') {
    p.system = 'digestive' as Part['system'];
  }
  return p;
}

type Selector = (p: Part, atlas: Atlas, key: string) => boolean;

interface AtlasRule {
  /** Stable name, so the check script can report which rule answered. */
  id: string;
  /** Key terms that select this rule, matched as whole words. */
  when: readonly string[];
  /**
   * Set when the structure is genuinely not in this atlas. The text is shown to
   * the reader, so it says what is missing rather than that something failed.
   */
  absent?: string;
  /** Which parts belong, when the structure IS in the atlas. */
  select?: Selector;
}

const NO_PERIPHERAL_NERVES =
  'BodyParts3D models the brain, brainstem and the nerves of the orbit. It carries no peripheral nerves, so this one cannot be drawn — the notes beside the model still describe it in full.';

/**
 * First match wins, so the order is part of the meaning: `coronary sinus` has to
 * be tested before `cardiac`, and `pulmonary trunk` before `pulmonary`.
 */
const RULES: readonly AtlasRule[] = [
  // -- Structures this atlas does not hold ----------------------------------
  {
    id: 'absent-peripheral-nerve',
    when: [
      'vagus', 'vagus nerve', 'recurrent laryngeal', 'parasympathetic',
      'phrenic nerve', 'splanchnic', 'splanchnic nerves', 'sympathetic',
      'sympathetic chain', 'pectoral nerve', 'pectoral nerves',
      'axillary nerve', 'intercostal nerve', 'intercostal nerves', 'cardiac plexus',
      'median nerve', 'ulnar nerve', 'radial nerve', 'sciatic nerve',
      'femoral nerve', 'obturator nerve', 'tibial nerve',
      'peroneal nerve', 'common peroneal nerve', 'fibular nerve', 'common fibular nerve',
      'musculocutaneous nerve', 'brachial plexus',
      'peripheral nerve', 'peripheral nerves',
    ],
    absent: NO_PERIPHERAL_NERVES,
  },
  {
    id: 'absent-organ',
    when: ['thyroid gland', 'uterus', 'ovary', 'ovaries', 'parathyroid'],
    absent:
      'This organ is not one of the 2,234 meshes in the BodyParts3D male reference body, so the primary atlas does not substitute another structure.',
  },
  {
    id: 'hra-reference-organ',
    when: ['eye', 'knee', 'fallopian tube', 'fallopian_tube', 'uterine tube', 'placenta'],
    absent:
      'This Deep Inspector target is supplied by ORBIT’s verified HuBMAP Human Reference Atlas reference model rather than by the BodyParts3D primary body. No unrelated BodyParts3D structure is substituted.',
  },
  {
    id: 'absent-not-a-structure',
    when: ['ascites', 'snakebite', 'sepsis', 'shock'],
    absent:
      'This is a clinical state rather than a structure, so it has no mesh of its own. Pick an organ to isolate.',
  },

  // -- Thoracic cage and mediastinal scaffolding ----------------------------
  {
    id: 'sternum',
    when: ['sternum', 'manubrium', 'xiphoid'],
    select: (p) => anyTerm(p.name, ['sternum', 'manubrium', 'xiphoid process']) || p.id === 'FJ3178',
  },
  {
    id: 'costal-cartilage',
    when: ['costal cartilage', 'costal', 'rib cartilage'],
    select: (p) => anyTerm(p.name, ['costal cartilage', 'costal', 'rib']),
  },
  {
    id: 'rib',
    when: ['rib', 'ribs', 'rib cage'],
    select: (p) => hasTerm(p.name, 'rib'),
  },
  {
    id: 'vertebra',
    when: ['vertebra', 'vertebrae', 'spine', 'vertebral column', 'spinal column'],
    select: (p) => hasTerm(p.name, 'vertebra'),
  },
  {
    id: 'esophagus',
    when: ['esophagus', 'oesophagus', 'esophageal', 'oesophageal'],
    select: (p) => anyTerm(p.name, ['esophagus', 'oesophagus']) || p.id === 'FJ2563',
  },
  {
    id: 'azygos',
    when: ['azygos', 'hemiazygos', 'azygos vein', 'accessory hemiazygos'],
    // `\bazygos\b` does not match "hemiazygos" — there is no word boundary in
    // the middle of a word — so asking for the hemiazygos returned the azygos.
    select: (p) => anyTerm(p.name, ['azygos', 'hemiazygos']),
  },
  {
    id: 'lymphatic',
    when: ['lymph', 'lymph node', 'lymphatic', 'thoracic duct', 'cisterna chyli'],
    select: (p) => p.system === 'lymphatic' || anyTerm(p.name, ['spleen', 'thymus']),
  },
  {
    // `tendon` is gone from both sides. It used to select this rule and then
    // match any part named `… tendon`, which put the calcaneal tendons on
    // screen whenever the diaphragm was isolated.
    id: 'diaphragm',
    when: ['diaphragm', 'diaphragmatic', 'crus of diaphragm'],
    select: (p) => anyTerm(p.name, ['diaphragm', 'phrenic']),
  },
  {
    id: 'pleura',
    when: ['pleura', 'pleural', 'pleural cavity'],
    select: (p) => p.system === 'respiratory' || hasTerm(p.name, 'lung'),
  },
  {
    id: 'vena-cava',
    when: ['vena cava', 'svc', 'ivc', 'superior vena cava', 'inferior vena cava'],
    select: (p) => anyTerm(p.name, ['cava', 'brachiocephalic', 'jugular']),
  },

  // -- Coronary circulation. Ordered: sinus, then each named trunk. ---------
  {
    id: 'coronary-sinus',
    when: ['coronary sinus', 'cardiac vein', 'cardiac veins'],
    select: (p) =>
      anyTerm(p.name, [
        'coronary sinus', 'great cardiac vein', 'middle cardiac vein',
        'small cardiac vein', 'anterior cardiac vein',
      ]),
  },
  {
    id: 'lad',
    when: ['lad', 'lad artery', 'anterior descending', 'anterior interventricular'],
    select: (p) => {
      if (p.system !== 'arterial') return false;
      if (p.id === 'FJ2737' || p.id === 'FJ2631') return true;
      if (hasTerm(p.name, 'vein')) return false;
      return anyTerm(p.name, [
        'anterior interventricular',
        'diagonal branch of anterior descending',
        'diagonal branch of anterior',
      ]);
    },
  },
  {
    id: 'rca',
    when: ['rca', 'rca artery', 'right coronary', 'pda', 'posterior interventricular'],
    select: (p) => {
      if (p.system !== 'arterial') return false;
      if (p.id === 'FJ2723') return true;
      if (hasTerm(p.name, 'vein')) return false;
      return anyTerm(p.name, [
        'right coronary',
        'posterior interventricular branch of right',
        'marginal branch of right coronary',
        'first anterior ventricular branch of right',
        'first posterior ventricular branch of right',
        'septal branch of right posterior',
      ]);
    },
  },
  {
    // Side-aware: `post_circumflex_humeral` is the posterior vessel, the one in
    // the quadrangular space with the axillary nerve, and showing the anterior
    // one alongside it would put the wrong vessel in the space being taught.
    id: 'circumflex-humeral',
    when: ['post circumflex humeral', 'posterior circumflex humeral', 'anterior circumflex humeral', 'circumflex humeral'],
    select: (p, _atlas, key) => {
      if (!hasTerm(p.name, 'circumflex humeral')) return false;
      if (hasTerm(key, 'posterior') || hasTerm(key, 'post')) return hasTerm(p.name, 'posterior');
      if (hasTerm(key, 'anterior')) return hasTerm(p.name, 'anterior');
      return true;
    },
  },
  {
    id: 'lcx',
    // Never a bare `circumflex`: this body has circumflex femoral, humeral,
    // scapular and iliac vessels, and all of them used to open the heart.
    when: ['lcx', 'lcx artery', 'circumflex coronary', 'circumflex branch of left coronary', 'left circumflex'],
    select: (p) => {
      if (p.system !== 'arterial') return false;
      if (p.id === 'FJ2737') return true;
      if (anyTerm(p.name, ['femoral', 'humeral', 'scapular', 'iliac'])) return false;
      return (
        (hasTerm(p.name, 'circumflex') && hasTerm(p.name, 'coronary')) ||
        hasTerm(p.name, 'circumflex branch of left')
      );
    },
  },

  // -- Abdominal and thoracic vessels ---------------------------------------
  {
    id: 'celiac',
    when: ['celiac', 'coeliac', 'celiac trunk', 'celiac axis'],
    select: (p) =>
      anyTerm(p.name, ['celiac', 'common hepatic artery', 'splenic artery', 'left gastric artery']),
  },
  {
    id: 'superior-mesenteric',
    when: ['superior mesenteric', 'superior mesenteric artery', 'sma'],
    select: (p) => {
      if (hasTerm(p.name, 'superior mesenteric')) return true;
      // Its branches are arteries; the matching veins are portal tributaries
      // and belong to `portal-vein`, not here.
      if (hasTerm(p.name, 'vein')) return false;
      return anyTerm(p.name, [
        'ileocolic', 'ileal artery', 'ileal branch',
        'right colic artery', 'middle colic artery', 'marginal colic artery',
        'appendicular artery', 'anterior cecal artery', 'posterior cecal artery',
        'inferior pancreaticoduodenal',
      ]);
    },
  },
  {
    // The portal vein AND its tributaries, because the tributaries are the
    // reason anyone opens this: the sites of portosystemic anastomosis in
    // portal hypertension are the left gastric, the superior rectal and the
    // paraumbilical, not the trunk. They used to arrive by accident — the FMA
    // concept named `portal vein` groups the whole tree, and the old resolver
    // prefilled from that table before any rule ran. Naming them keeps them
    // now that a rule owns its own answer.
    id: 'portal-vein',
    when: ['portal', 'portal vein', 'hepatic portal vein', 'portal system', 'portal hypertension'],
    select: (p) => {
      if (hasTerm(p.name, 'portal vein')) return true;
      if (!hasTerm(p.name, 'vein')) return false;
      return anyTerm(p.name, [
        'splenic vein', 'superior mesenteric vein', 'inferior mesenteric vein',
        'left gastric vein', 'right gastric vein', 'gastroepiploic vein',
        'ileocolic vein', 'ileal vein', 'jejunal vein',
        'right colic vein', 'middle colic vein', 'left colic vein',
        'sigmoid vein', 'superior rectal vein', 'pancreaticoduodenal vein',
        'cystic vein', 'paraumbilical vein',
      ]);
    },
  },
  {
    // Valve targets must beat the broader aorta/pulmonary-vessel rules.
    // These ids are the three source cusps in BodyParts3D.
    id: 'aortic-valve',
    when: ['aortic valve'],
    select: (p) => ['FJ2426', 'FJ2431', 'FJ2435'].includes(p.id),
  },
  {
    id: 'pulmonary-valve',
    when: ['pulmonary valve', 'pulmonic valve'],
    select: (p) => ['FJ2417', 'FJ2427', 'FJ2434'].includes(p.id),
  },
  {
    id: 'pulmonary-vessels',
    when: ['pulmonary trunk', 'pulmonary artery', 'pulmonary veins', 'pulmonary vein'],
    select: (p) => hasTerm(p.name, 'pulmonary') || p.id === 'FJ2966',
  },
  {
    id: 'aorta',
    when: ['aorta', 'aortic', 'aortic arch'],
    select: (p) => hasTerm(p.name, 'aorta'),
  },
  {
    id: 'thoraco-acromial',
    when: ['thoracoacromial', 'thoraco-acromial', 'thoracoacromial artery'],
    select: (p) => hasTerm(p.name, 'thoraco acromial'),
  },
  {
    id: 'axillary-vessels',
    when: ['axillary artery', 'axillary vein', 'axillary vessels'],
    select: (p) => hasTerm(p.name, 'axillary'),
  },

  // -- Organs ---------------------------------------------------------------
  // `septum` is gone from the list: the only part in this atlas whose name
  // contains it is the Septum of telencephalon, which is forebrain, and it
  // opened the whole heart.
  { id: 'heart', when: ['heart', 'cardiac', 'cor humanum', 'myocardium', 'interventricular septum'], select: selectHeart },
  { id: 'liver', when: ['liver', 'hepar', 'hepatic', 'biliary', 'gallbladder'], select: selectLiver },
  {
    id: 'lungs',
    when: ['lung', 'lungs', 'pulmonary', 'bronchus', 'bronchial', 'respiratory', 'trachea', 'airway'],
    select: selectLungs,
  },
  { id: 'abdomen', when: ['abdomen', 'abdominal', 'abdominal cavity'], select: selectAbdomen },
  { id: 'brain', when: ['brain', 'cranium', 'cerebrum', 'cerebral', 'cns'], select: selectBrain },
  { id: 'kidney', when: ['kidney', 'kidneys', 'renal'], select: selectKidney },
  { id: 'stomach', when: ['stomach', 'gastric'], select: selectStomach },
  { id: 'spleen', when: ['spleen', 'splenic'], select: selectSpleen },
  { id: 'pancreas', when: ['pancreas', 'pancreatic'], select: selectPancreas },
  {
    id: 'urinary-bladder',
    when: ['bladder', 'urinary bladder'],
    select: (p) => hasTerm(p.name, 'urinary bladder'),
  },
  {
    id: 'skeletal',
    when: ['skeletal', 'skeleton', 'bone', 'bones'],
    select: (p) => p.system === 'skeletal',
  },
  {
    // Pectoralis minor is a different muscle and is no longer swept in with the
    // major; ask for it by name and the fallback finds it.
    id: 'pectoralis-major',
    when: ['pectoralis major', 'pectoralis_major', 'pectoralis'],
    select: (p) => hasTerm(p.name, 'pectoralis major'),
  },
  {
    // The deltoid is the muscle. `Deltoid branch of thoraco-acromial artery` is
    // an artery that happens to run to it, and used to be returned as part of it.
    id: 'deltoid',
    when: ['deltoid'],
    select: (p) => p.system === 'muscular' && hasTerm(p.name, 'deltoid'),
  },
];

// ---------------------------------------------------------------------------
// Organ selectors
// ---------------------------------------------------------------------------

/**
 * The heart, its valves, its own muscle and the roots of the great vessels —
 * and nothing that merely passes nearby.
 *
 * The bounding-box clamp at the end is a mediastinal constraint: anything whose
 * x reaches past ±0.18 or that starts below y = 1.24 is not in the middle
 * mediastinum, whatever it is called.
 */
function selectHeart(p: Part): boolean {
  if (CEREBRAL_CSF_IDS.has(p.id)) return false;
  if (PURE_HEART_IDS.has(p.id)) return true;

  const name = p.name;

  const isCardioPulmonaryVein = anyTerm(name, [
    'cardiac vein', 'interventricular vein', 'pulmonary vein', 'marginal vein',
    'vein of left ventricle', 'coronary sinus', 'superior vena cava',
  ]);

  // Lumen casts, cerebral ventricles, peripheral vessels: never the heart.
  if (
    hasTerm(name, 'cavity of') ||
    anyTerm(name, ['lateral ventricle', 'third ventricle', 'fourth ventricle', 'interventricular foramen']) ||
    anyTerm(name, ['brain', 'cerebral', 'cerebrum', 'cerebellum']) ||
    (hasTerm(name, 'vein') && !isCardioPulmonaryVein) ||
    hasTerm(name, 'inferior vena cava') ||
    anyTerm(name, ['femoral', 'humeral', 'scapular', 'iliac', 'fibular', 'tibial', 'radial', 'ulnar', 'brachial', 'popliteal'])
  ) {
    return false;
  }

  const belongs =
    p.system === 'cardiac' ||
    anyTerm(name, [
      'myocardium', 'pericardium', 'coronary', 'interventricular', 'conus artery',
      'papillary muscle', 'cardiac vein', 'marginal vein', 'vein of left ventricle',
      'pulmonary artery', 'pulmonary vein', 'superior vena cava', 'ascending aorta',
      'aortic arch', 'arch of aorta', 'pulmonary trunk', 'brachiocephalic artery',
    ]) ||
    (hasTerm(name, 'circumflex') && hasTerm(name, 'coronary'));

  if (!belongs) return false;

  if (p.bounds && (Math.abs(p.bounds[0][0]) > 0.18 || Math.abs(p.bounds[1][0]) > 0.18 || p.bounds[0][1] < 1.24)) {
    return false;
  }
  return true;
}

const PURE_HEART_IDS = new Set<string>([
  // Myocardial walls
  'FJ2428', 'FJ2438', 'FJ2439',
  // Papillary muscles (filed under `muscular` in the ontology)
  'FJ2418', 'FJ2419', 'FJ2429', 'FJ2430', 'FJ2437',
  // Great vessel roots and arch
  'FJ3413', 'FJ3411', 'FJ3417', 'FJ2966', 'FJ2924', 'FJ3019', 'FJ3645',
  // Pulmonary veins entering the left atrium
  'FJ2925', 'FJ2933', 'FJ2944', 'FJ2950', 'FJ2955', 'FJ3020', 'FJ3040',
  // All four valves, eleven cusps and leaflets
  'FJ2417', 'FJ2427', 'FJ2434',
  'FJ2420', 'FJ2432',
  'FJ2421', 'FJ2433', 'FJ2436',
  'FJ2426', 'FJ2431', 'FJ2435',
  // Coronary trunks and the branches BodyParts3D names oddly
  'FJ2723', 'FJ2737', 'FJ2670', 'FJ2676',
  'FJ2732', 'FJ2733', 'FJ2734', 'FJ2735', 'FJ2736',
]);

/** Liver parenchyma, its segments, the biliary tree and the portal/hepatic venous trees. */
function selectLiver(p: Part): boolean {
  return (
    anyTerm(p.name, [
      'liver', 'hepatovenous segment', 'caudate lobe', 'hepatic', 'gallbladder',
      'cystic duct', 'bile duct', 'biliary', 'portal vein',
    ]) ||
    p.id === 'FJ1853' || p.id === 'FJ3082' ||
    p.id === 'FJ2414' || p.id === 'FJ2415' || p.id === 'FJ2416'
  );
}

/**
 * Thoracic airway, both lungs and their lobar trees, plus the pulmonary and
 * bronchial blood supply. The upper airway of the head — nasal cartilages,
 * conchae, pharyngeal constrictors — is excluded by id: it is respiratory in
 * the ontology and would drag the camera up to the face.
 */
function selectLungs(p: Part): boolean {
  if (HEAD_RESPIRATORY_IDS.has(p.id)) return false;

  if (
    p.id === 'FJ2541' || p.id === 'FJ2450' || p.id === 'FJ2539' ||
    p.system === 'respiratory' ||
    anyTerm(p.name, ['bronchus', 'bronchial', 'lung', 'trachea', 'cricoid', 'thyroid cartilage', 'epiglottis', 'larynx', 'pleura'])
  ) {
    return true;
  }

  return (
    p.id === 'FJ2966' ||
    p.id === 'FJ1931' ||
    (hasTerm(p.name, 'pulmonary') && (p.system === 'arterial' || p.system === 'venous')) ||
    anyTerm(p.name, ['bronchial artery', 'bronchial vein'])
  );
}

const HEAD_RESPIRATORY_IDS = new Set<string>([
  'FJ2556', 'FJ2557', 'FJ2558',
  'FJ3263', 'FJ3369',
  'FJ2740', 'FJ2742', 'FJ2743', 'FJ2745', 'FJ2746', 'FJ2747',
  'FJ2752', 'FJ2754', 'FJ2755', 'FJ2757', 'FJ2758', 'FJ2759',
]);

/**
 * The abdominal viscera and their blood supply, with the wall stripped out.
 *
 * The wall is what makes this rule awkward: the muscular, skeletal and
 * integumentary parts of the abdomen are a closed box around everything the
 * reader wants to see, so they are excluded wholesale and the named wall
 * muscles are blacklisted by id on top of that.
 */
function selectAbdomen(p: Part): boolean {
  if (ABDOMEN_WALL_IDS.has(p.id)) return false;
  if (p.system === 'muscular' || p.system === 'skeletal' || p.system === 'integumentary' || p.system === 'connective') {
    return false;
  }

  const name = p.name;

  const isViscus =
    p.system === 'digestive' ||
    p.system === 'urinary' ||
    p.id === 'FJ2561' || p.id === 'FJ3129' || p.id === 'FJ3130' ||
    hasTerm(name, 'hepatovenous segment') ||
    anyTerm(name, [
      'stomach', 'liver', 'pancreas', 'spleen', 'kidney', 'ureter', 'gallbladder',
      'biliary', 'colon', 'appendix', 'cecum', 'caecum', 'intestine', 'mesentery',
      'duodenum', 'jejunum', 'ileum', 'rectum',
    ]);

  if (isViscus) {
    // The true pelvic organs, named. This was `bounds[1][1] < 1.0` over
    // ureter/ileum/rectum, and the small bowel sits at y 0.88-1.03 — so it cut
    // seventeen loops of ileum out of the abdomen to keep the bladder out.
    // The ileum is abdominal content and its lower loops belong in the pelvis;
    // the bladder, the rectum and the pelvic ureter are the ones that pull the
    // camera down, and they can be named.
    if (anyTerm(name, ['urinary bladder', 'rectum'])) return false;
    if (hasTerm(name, 'ureter') && p.bounds && p.bounds[1][1] < 1.0) return false;
    return true;
  }

  const isAbdominalVessel =
    anyTerm(name, [
      'celiac', 'mesenteric', 'portal vein', 'hepatic artery', 'hepatic vein',
      'splenic artery', 'splenic vein', 'renal artery', 'renal vein',
      'suprarenal artery', 'suprarenal vein',
      'gastric artery', 'gastroepiploic', 'gastroduodenal',
    ]) ||
    (p.system === 'arterial' && anyTerm(name, ['abdominal aorta', 'lumbar artery']));

  if (!isAbdominalVessel) return false;
  if (p.bounds && p.bounds[1][1] < 0.98) return false;
  return true;
}

const ABDOMEN_WALL_IDS = new Set<string>([
  'FJ1452', 'FJ1452M', 'FJ1451', 'FJ1451M', 'FJ1454', 'FJ1454M',
  'FJ1450', 'FJ1450M', 'FJ1455', 'FJ1455M', 'FJ1461', 'FJ1461M',
  'FJ1426', 'FJ1426M', 'FJ1428', 'FJ1428M', 'FJ1431', 'FJ1431M',
  'FJ3131',
  'FJ3152', 'FJ3288', 'FJ3393',
  'FJ3157', 'FJ3159', 'FJ3162', 'FJ3165', 'FJ3168',
  'FJ3212', 'FJ3214', 'FJ3215', 'FJ3216', 'FJ3217',
  'FJ2815',
]);

/** Cerebrum, deep grey matter, brainstem, cerebellum and the optic pathway. */
function selectBrain(p: Part): boolean {
  const name = p.name;

  const isCortexOrDeep =
    anyTerm(name, [
      'gyrus', 'lobule', 'white matter', 'corpus callosum', 'fornix of forebrain',
      'thalamus', 'hypothalamus', 'amygdala', 'hippocampus', 'putamen',
      'caudate nucleus', 'globus pallidus', 'internal capsule', 'insula',
      'stria', 'septum of telencephalon', 'commissure', 'habenula',
      'lamina terminalis', 'mammillary body', 'tuber cinereum', 'choroid plexus',
      'insular',
      // The CSF spaces are brain structures. BodyParts3D files the lateral and
      // third ventricles under `cardiac`, which is why the loader remaps them.
      'lateral ventricle', 'third ventricle', 'fourth ventricle',
    ]) ||
    (hasTerm(name, 'lobe') && anyTerm(name, ['frontal', 'temporal', 'parietal', 'occipital', 'insula']));

  const isBrainstem = anyTerm(name, [
    'midbrain', 'pons', 'medulla oblongata', 'peduncle of midbrain', 'colliculus',
    'brachium of', 'interpeduncular', 'cerebral aqueduct',
    // Continuous with the fourth ventricle, and modelled here only as far as
    // the upper cord (y 1.537-1.572). It was the one nervous part in the whole
    // atlas that no organ claimed.
    'central canal',
  ]);

  const isCerebellum = anyTerm(name, ['cerebellum', 'tentorium cerebelli']);

  const isPathway = anyTerm(name, ['geniculate body', 'optic chiasm', 'optic tract', 'optic nerve']);

  const isGland = p.id === 'FJ1796' || p.id === 'FJ1795';

  if (CEREBRAL_CSF_IDS.has(p.id)) return true;

  /**
   * The cerebral circulation, which the brain used to show eight parts of out
   * of a hundred and seven.
   *
   * This atlas carries a complete circle of Willis and the whole cerebral
   * arterial tree — anterior, middle and posterior cerebral arteries with their
   * cortical branches, both communicating arteries, the basilar and vertebrals,
   * PICA, AICA and the superior cerebellar, the pontine arteries, the
   * anterolateral central (lenticulostriate) branches, the choroidal arteries,
   * the pericallosal and callosomarginal. That is the circle of Willis, the
   * arterial territories and the vessels a stroke occludes: three of the most
   * examined things in the whole of neuroanatomy, present in the data and
   * invisible in the app.
   *
   * Every one of them sits above y = 1.47 already, and the common carotid tops
   * out at 1.452 in the neck, so the head floor separates the intracranial
   * supply from its origin without naming either.
   *
   * There are no dural venous sinuses and no cerebral veins in this atlas —
   * searched, and the only `sinus` in it is the coronary sinus. So the venous
   * side of the brain cannot be drawn, and the resolver does not pretend.
   */
  const isCerebralVessel =
    (p.system === 'arterial' || p.system === 'venous') &&
    !hasTerm(name, 'common carotid') &&
    anyTerm(name, [
      'cerebral artery', 'cerebellar artery', 'communicating artery',
      'basilar artery', 'vertebral artery', 'internal carotid artery',
      'ophthalmic artery', 'choroidal artery', 'pontine artery',
      'callosomarginal artery', 'pericallosal artery', 'labyrinthine artery',
      'artery of central sulcus', 'artery of postcentral sulcus',
      'artery of precentral sulcus',
    ]);

  if (isCerebralVessel) return !!p.bounds && p.bounds[0][1] > 1.45;

  // The nerves of the orbit, but only the ones actually in the head — the
  // y > 1.45 floor is what keeps the spinal cord out.
  const inHead = p.system === 'nervous' && !!p.bounds && p.bounds[0][1] > 1.45;
  const isOrbitalNerve =
    inHead &&
    anyTerm(name, [
      'oculomotor', 'trochlear', 'ophthalmic', 'nasociliary', 'ciliary',
      'lacrimal nerve', 'frontal nerve', 'supra-orbital', 'supratrochlear',
      'infratrochlear', 'ethmoidal nerve',
    ]);

  if (!(isCortexOrDeep || isBrainstem || isCerebellum || isPathway || isGland || isOrbitalNerve)) {
    return false;
  }

  if (
    p.system === 'nervous' && p.bounds && p.bounds[0][1] < 1.45 &&
    !isCerebellum && !anyTerm(name, ['pons', 'medulla'])
  ) {
    return false;
  }
  return true;
}

/** Both kidneys, the adrenals above them, the renal vessels and the proximal ureter. */
function selectKidney(p: Part): boolean {
  if (
    anyTerm(p.name, ['kidney', 'renal', 'adrenal', 'suprarenal']) ||
    p.id === 'FJ3129' || p.id === 'FJ3130' || p.id === 'FJ3145' || p.id === 'FJ3147'
  ) {
    return true;
  }
  // The proximal ureteric segments only. The full pelvic ureters run to the
  // bladder and pull the camera out to the whole trunk.
  return hasTerm(p.name, 'ureteric segment of');
}

/** The stomach, its named parts and the gastric vessels along its curvatures. */
function selectStomach(p: Part): boolean {
  const name = p.name;
  // Inferior and superficial epigastric vessels run down to the groin.
  if (hasTerm(name, 'epigastric')) return false;

  if (anyTerm(name, ['stomach', 'pylorus', 'pyloric', 'fundus of stomach', 'cardia of stomach']) || p.id === 'FJ2564') {
    return true;
  }

  if (anyTerm(name, ['gastric artery', 'gastric vein', 'gastroepiploic', 'gastroduodenal'])) {
    return !!p.bounds && p.bounds[0][1] >= 1.1 && p.bounds[1][1] <= 1.25;
  }

  if (anyTerm(name, ['esophagus', 'oesophagus'])) {
    return !!p.bounds && p.bounds[0][1] >= 1.18 && p.bounds[1][1] <= 1.30;
  }
  return false;
}

/** The spleen and its hilar vessels. */
function selectSpleen(p: Part): boolean {
  return anyTerm(p.name, ['spleen', 'splenic artery', 'splenic vein']) || p.id === 'FJ2561';
}

/** The pancreas, its duct system, its arterial arcades and the duodenal C-loop. */
function selectPancreas(p: Part): boolean {
  const name = p.name;
  if (
    anyTerm(name, ['pancreas', 'pancreatic duct']) ||
    p.id === 'FJ1895' || p.id === 'FJ2629' || p.id === 'FJ1896' || p.id === 'FJ2630'
  ) {
    return true;
  }
  if (p.id === 'FJ2573' || hasTerm(name, 'duodenum')) return true;

  if (
    anyTerm(name, [
      'pancreaticoduodenal', 'pancreatic artery', 'dorsal pancreatic',
      'caudal pancreatic', 'great pancreatic',
    ])
  ) {
    return !!p.bounds && p.bounds[0][1] >= 1.07 && p.bounds[1][1] <= 1.25;
  }
  if (hasTerm(name, 'splenic artery')) {
    return !!p.bounds && p.bounds[0][1] >= 1.12 && p.bounds[1][1] <= 1.22;
  }
  return false;
}

// ---------------------------------------------------------------------------
// The resolver
// ---------------------------------------------------------------------------

export type AtlasTargetStatus = 'resolved' | 'absent' | 'unmatched';

export interface AtlasTargetResult {
  ids: Set<string>;
  status: AtlasTargetStatus;
  /** Which rule answered, or `fallback`. For the check script and for debugging. */
  rule: string;
  /** Present when `status` is `absent`: what to tell the reader. */
  reason?: string;
}

function normaliseKey(targetId: string): string {
  const raw = targetId.toLowerCase().trim();
  const clean = raw.replace(/\([^)]*\)/g, '').replace(/_/g, ' ').trim();
  return clean || raw;
}

/** The rule that claims this key, if any. Exported so the check can enumerate. */
export function ruleForTarget(targetId: string): AtlasRule | null {
  const key = normaliseKey(targetId);
  for (const rule of RULES) {
    if (anyTerm(key, rule.when)) return rule;
  }
  return null;
}

/**
 * The full answer: the element ids, and — when there are none — whether that is
 * because the atlas does not hold the structure or because nothing matched.
 */
export function describeAtlasTarget(targetId: string, atlas: Atlas): AtlasTargetResult {
  const ids = new Set<string>();
  if (!targetId || !atlas) return { ids, status: 'unmatched', rule: 'none' };

  const key = normaliseKey(targetId);
  const lowered = targetId.toLowerCase().trim();

  // An element id is its own answer.
  const direct = atlas.parts.find((p) => p.id === targetId);
  if (direct) {
    ids.add(direct.id);
    return { ids, status: 'resolved', rule: 'direct-id' };
  }

  /**
   * Is the key the exact name of a part?
   *
   * This decides a real tension rather than a corner case. `stomach` is both a
   * dossier key, meaning the stomach AND its vessels, and the name of a single
   * mesh. `Anterior interventricular vein` is only ever a mesh — but the `lad`
   * rule claims it on the words "anterior interventricular" and answers with
   * twenty-two arteries.
   *
   * The test that separates them: **a rule may keep a key it can answer.** If
   * the key names parts and the rule's answer contains them, the rule is
   * talking about the same thing and its wider answer is the useful one. If the
   * rule's answer LEAVES OUT the very part the key names, the rule has taken a
   * key that is not its own, and the named part wins.
   *
   * Eighteen of the atlas's 772 named vessels and nerves could not be found by
   * their own names before this, and each read as a different bug:
   *
   *   "Left lateral circumflex femoral artery"  -> the LEFT CORONARY circumflex
   *   "Right circumflex scapular vein"          -> the same seven coronary parts
   *   "Anterior interventricular vein"          -> the twenty-two LAD arteries
   *   "Esophageal artery"                       -> the oesophagus
   *   "Septum of telencephalon"                 -> the whole heart
   *
   * All 1,674 distinct part names now resolve to themselves, and
   * `npm run check:simulator` walks every one of them.
   */
  const namedExactly = atlas.parts.filter((p) => p.name.toLowerCase() === key || p.name.toLowerCase() === lowered);

  const rule = ruleForTarget(targetId);
  if (rule) {
    if (rule.absent) return { ids, status: 'absent', rule: rule.id, reason: rule.absent };
    const select = rule.select!;
    atlas.parts.forEach((p) => {
      if (select(p, atlas, key)) ids.add(p.id);
    });
    const keepsItsOwn = namedExactly.length === 0 || namedExactly.every((p) => ids.has(p.id));
    if (keepsItsOwn && ids.size > 0) {
      return { ids, status: 'resolved', rule: rule.id };
    }
    if (!keepsItsOwn) {
      const own = new Set(namedExactly.map((p) => p.id));
      return { ids: own, status: 'resolved', rule: 'exact-name' };
    }
    return { ids, status: 'unmatched', rule: rule.id };
  }

  if (namedExactly.length > 0) {
    namedExactly.forEach((p) => ids.add(p.id));
    return { ids, status: 'resolved', rule: 'exact-name' };
  }

  // -- Fallback, for keys no rule claims -----------------------------------
  // Only reached now that a matching rule owns its answer outright, which is
  // what makes each rule's exclusions mean anything.

  if (atlas.concepts) {
    for (const c of atlas.concepts) {
      const cName = c.name.toLowerCase();
      if (cName === key || c.id.toLowerCase() === key) {
        c.elements.forEach((el) => ids.add(el));
      }
    }
  }

  atlas.parts.forEach((p) => {
    if (p.system.toLowerCase() === key) ids.add(p.id);
    else if (p.conceptId === targetId) ids.add(p.id);
    else if (hasTerm(p.name, key)) ids.add(p.id);
  });

  if (ids.size === 0) {
    const words = key
      .split(/[\s,/-]+/)
      .filter((w) => w.length >= 4 && !['and', 'the', 'with', 'muscle', 'artery', 'vein', 'nerve'].includes(w));
    if (words.length > 0) {
      atlas.parts.forEach((p) => {
        if (words.every((w) => hasTerm(p.name, w))) ids.add(p.id);
      });
    }
  }

  return { ids, status: ids.size > 0 ? 'resolved' : 'unmatched', rule: 'fallback' };
}

/** The 3D view's lookup: the element ids for an organ, vessel or nerve key. */
export function resolveAtlasElementIds(targetId: string, atlas: Atlas): Set<string> {
  return describeAtlasTarget(targetId, atlas).ids;
}

// ============================================================================
// Anatomical Organ Key Resolver: Maps any clicked mesh/part to its parent organ dossier
// ============================================================================
export function resolvePartToOrganKey(part?: Part | null, atlas?: Atlas | null): string {
  if (!part) return 'heart';
  const name = part.name || '';
  const sys = (part.system || '').toLowerCase();
  const id = (part.id || '').toUpperCase();

  const any = (...terms: string[]) => terms.some((t) => startsWord(name, t));

  // The CSF spaces. They have to be settled first, because `ventricle` is also
  // the word for a chamber of the heart and the cardiac test is below: tapping
  // the third ventricle used to open the heart dossier. BodyParts3D even files
  // them under `cardiac`, which is why the loader remaps them.
  const isCerebralVentricle =
    CEREBRAL_CSF_IDS.has(part.id) ||
    ['lateral ventricle', 'third ventricle', 'fourth ventricle'].some((t) => hasTerm(name, t));

  // 1. Cardiac & great vessels
  if (
    !isCerebralVentricle &&
    (sys === 'cardiac' ||
      any('ventricle', 'atrium', 'valve', 'myocard', 'pericard', 'coronary') ||
      id === 'FJ2428' || id === 'FJ2438' || id === 'FJ2439' || id === 'FJ3413')
  ) {
    if (any('anterior interventricular', 'diagonal branch')) return 'lad_artery';
    if (any('circumflex') && !any('humeral', 'femoral', 'scapular', 'iliac')) return 'lcx_artery';
    if (any('right coronary', 'posterior interventricular')) return 'rca_artery';
    if (any('coronary sinus', 'cardiac vein')) return 'coronary_sinus';
    return 'heart';
  }

  // 2. Respiratory & airway
  if (sys === 'respiratory' || any('lung', 'bronch', 'trachea', 'pleura', 'pulmon')) {
    return 'lungs';
  }

  // 3. Hepatic & biliary.
  //
  // `caudate lobe` as a phrase, never `caudate` alone: the caudate NUCLEUS is
  // in the basal ganglia, and four of them used to open the liver.
  if (any('liver', 'hepatic', 'hepatovenous', 'gallbladder', 'bile duct') || hasTerm(name, 'caudate lobe')) {
    return 'liver';
  }

  // 4. Stomach.
  //
  // Named vessels only, never the stem `gastro`: `gastrocnemius` is the calf,
  // and all four heads of it used to open the stomach.
  if (any('stomach', 'gastric', 'gastro-epiploic', 'gastroepiploic', 'gastroduodenal', 'pylor')) {
    return 'stomach';
  }

  // 5-7. Pancreas, spleen, kidney
  if (any('pancrea')) return 'pancreas';
  if (any('spleen', 'splenic')) return 'spleen';
  if (sys === 'urinary' || any('kidney', 'renal', 'suprarenal', 'adrenal', 'ureter')) return 'kidney';

  // 8. Brain & central nervous system
  if (
    isCerebralVentricle ||
    any('brain', 'cerebr', 'cerebell', 'thalam', 'pons', 'medulla oblongata', 'midbrain',
        'gyrus', 'hippocamp', 'amygdala', 'putamen', 'caudate nucleus', 'globus pallidus',
        'corpus callosum', 'colliculus', 'optic') ||
    (sys === 'nervous' && part.bounds && part.bounds[0][1] > 1.45)
  ) {
    return 'brain';
  }

  // 9. Vessels
  if (any('aorta')) return 'aorta';
  if (any('celiac')) return 'celiac_trunk';
  if (hasTerm(name, 'portal vein')) return 'portal_vein';

  // 10. Nerves.
  //
  // The name has to BE a nerve. This atlas has no vagus and no phrenic nerve —
  // what it has is the inferior phrenic and musculophrenic arteries and veins,
  // and those used to open the phrenic NERVE dossier.
  if (hasTerm(name, 'nerve')) {
    if (any('vagus')) return 'vagus_nerve';
    if (any('phrenic')) return 'phrenic_nerve';
  }
  if (any('phrenic', 'diaphragm')) return 'abdomen';

  // 11. Muscles with a dossier of their own
  if (any('deltoid') && sys === 'muscular') return 'deltoid';
  if (any('pectoralis major')) return 'pectoralis_major';

  // 12. Skeletal framework.
  //
  // `rib` bounded at the start of a word, or the forty-three parts whose names
  // begin `Tributary of ...` open the skeleton.
  if (sys === 'skeletal' || any('rib', 'sternum', 'vertebra', 'clavicle', 'scapula', 'costal')) {
    return 'skeletal';
  }

  if (sys === 'digestive') return 'abdomen';
  return part.id;
}
