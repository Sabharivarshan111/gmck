/**
 * General Examination — the head-to-toe survey every clinical case opens with,
 * in the order PICCLE names it.
 *
 * Why this is a module rather than a section inside one proforma: every case
 * sheet in `docs/clinical_materials/case_sheets/` repeats the same six signs,
 * and repeats them as a *list* — "No PICCLE", "Pallor present, icterus
 * absent". A list is what a student writes down once they already know how to
 * look; it teaches nobody how. What is missing from all thirteen sheets, and
 * what an examiner actually asks, is the layer underneath: which kinds there
 * are, where you look, how you look, and what each answer would mean.
 *
 * So each sign here carries the four things a viva turns on:
 *   • the types, because "pallor" and "icterus" are both several things;
 *   • the sites, in the order you examine them;
 *   • the technique, written as instructions rather than as findings;
 *   • the causes, grouped by mechanism rather than listed alphabetically —
 *     a mechanism is one fact that generates the list, and a list is fifty
 *     facts that generate nothing.
 *
 * Nothing in here is theme-coloured or platform-specific: it is data, and the
 * renderer is `GeneralExamScreen`.
 */

/** A labelled figure `ClinicalSignFigure` knows how to draw. */
export type FigureKind =
  | 'clubbing-profile'
  | 'schamroth'
  | 'cyanosis-sites'
  | 'pallor-sites'
  | 'icterus-sites'
  | 'pitting-grades'
  | 'lymph-node-map'
  | 'jvp-waveform'
  | 'none';

export interface SignBlock {
  heading: string;
  /** Prose that sets up the list. Kept to one or two sentences. */
  body?: string;
  bullets?: string[];
  /** A comparison the viva actually asks for, e.g. central vs peripheral. */
  table?: { columns: string[]; rows: string[][] };
}

/**
 * A ward mnemonic, expanded. Stored letter-by-letter rather than as one string
 * because the expansion is what is examined — a student who can say "COLD BLUE"
 * and not say what the L is has memorised a noise.
 */
export interface Mnemonic {
  word: string;
  /** What the mnemonic is a list OF. Without this a mnemonic is unusable. */
  answers: string;
  letters: { letter: string; stands: string; detail?: string }[];
  /** Where the mnemonic lies, or is incomplete. Every one of them does. */
  caveat?: string;
}

export interface ClinicalSign {
  id: string;
  /** The PICCLE letter, or '' for signs outside the mnemonic. */
  letter: string;
  name: string;
  /** One line, for the list row. */
  summary: string;
  figure: FigureKind;
  /** The single thing most often got wrong in front of an examiner. */
  examinerTrap: string;
  mnemonics?: Mnemonic[];
  blocks: SignBlock[];
}

export const PICCLE_ORDER: { letter: string; stands: string; why: string }[] = [
  {
    letter: 'P',
    stands: 'Pallor',
    why: 'Looked for first because it is the one sign you can see from the foot of the bed, and because anaemia changes the interpretation of everything after it.',
  },
  {
    letter: 'I',
    stands: 'Icterus',
    why: 'Next, because it shares a site with pallor — you are already holding the lower lid down, and the sclera is one finger away.',
  },
  {
    letter: 'C',
    stands: 'Cyanosis',
    why: 'Third, because the tongue answers it in two seconds and separates central from peripheral before you have moved to the hand.',
  },
  {
    letter: 'C',
    stands: 'Clubbing',
    why: 'Fourth: you now take the hand, and the hand is also where you will count the pulse.',
  },
  {
    letter: 'L',
    stands: 'Lymphadenopathy',
    why: 'Fifth, from behind for the neck and from in front for the axilla — it needs the patient repositioned, so it is grouped rather than scattered.',
  },
  {
    letter: 'E',
    stands: 'Edema',
    why: 'Last, because it is at the feet and you finish there before turning to the systemic examination.',
  },
];

export const CLINICAL_SIGNS: ClinicalSign[] = [
  // ───────────────────────────────────────────────────────────── PALLOR ────
  {
    id: 'pallor',
    letter: 'P',
    name: 'Pallor',
    summary: 'Loss of the red of haemoglobin from skin and mucous membranes — five sites, in order, and never from the face alone.',
    figure: 'pallor-sites',
    examinerTrap:
      'Pallor is not anaemia. It is a clinical impression with roughly 70% sensitivity at best; a normal-looking conjunctiva does not exclude a haemoglobin of 9 g/dL, and a pale patient may simply be vasoconstricted, frightened or fair-skinned. Say "pallor present, to be confirmed by haemoglobin" — never "the patient is anaemic" from inspection.',
    mnemonics: [
      {
        word: 'ANAEMIA',
        answers: 'the causes of anaemia, i.e. of true pallor',
        letters: [
          { letter: 'A', stands: 'Acute or chronic blood loss', detail: 'Menorrhagia, hookworm, peptic ulcer, piles, occult GI malignancy' },
          { letter: 'N', stands: 'Nutritional deficiency', detail: 'Iron, B12, folate, protein-energy malnutrition' },
          { letter: 'A', stands: 'Aplastic anaemia and marrow failure', detail: 'Also marrow infiltration by leukaemia, lymphoma, myeloma, secondaries' },
          { letter: 'E', stands: 'Erythropoietin deficiency', detail: 'Chronic kidney disease — the normocytic normochromic anaemia of CKD' },
          { letter: 'M', stands: 'Malignancy and chronic disease', detail: 'Anaemia of chronic disease: TB, HIV, rheumatoid arthritis, any malignancy' },
          { letter: 'I', stands: 'Inherited haemoglobinopathy', detail: 'Thalassaemia, sickle cell disease, hereditary spherocytosis, G6PD deficiency' },
          { letter: 'A', stands: 'Autoimmune and acquired haemolysis', detail: 'AIHA, malaria, prosthetic valve, microangiopathic haemolysis (HUS, TTP, DIC)' },
        ],
        caveat:
          'It leaves out the one cause you will meet most on an obstetric ward — physiological dilutional anaemia of pregnancy — and it does not distinguish apparent (vasomotor) pallor, which is not anaemia at all.',
      },
    ],
    blocks: [
      {
        heading: 'What it actually is',
        body:
          'The pink of a mucous membrane is haemoglobin in the capillaries under a thin, non-keratinised epithelium. Pallor appears when either there is less haemoglobin per unit blood (anaemia) or less blood reaching the capillary bed (vasoconstriction, shock). Those two produce the same colour and are separated by everything else about the patient, not by the colour itself.',
      },
      {
        heading: 'Types',
        bullets: [
          'True (haematological) pallor — anaemia of any cause. Affects mucous membranes as well as skin, because the deficit is in the blood itself.',
          'Apparent (vasomotor) pallor — vasoconstriction from shock, cold, fright, hypoglycaemia, phaeochromocytoma. Skin is pale and cold; mucous membranes are comparatively spared.',
          'Constitutional pallor — a fair-skinned, indoor patient with normal mucous membranes. Skin only. Not a finding.',
          'Localised pallor — one limb or one digit: acute arterial occlusion, Raynaud phenomenon, or a limb held elevated.',
          'Pallor with an added tint: lemon-yellow in megaloblastic anaemia (pallor plus mild haemolytic icterus), muddy/earthy in chronic kidney disease, café-au-lait in subacute bacterial endocarditis.',
        ],
      },
      {
        heading: 'Where to look — the five sites, in this order',
        body:
          'Examine in daylight or white light. Yellow ward light hides pallor and invents icterus.',
        bullets: [
          '1. Lower palpebral conjunctiva — the most reliable single site. Ask the patient to look up; draw the lower lid down with your thumb. Look at the inner (fornix) part, not the lid margin, which is pale in everyone.',
          '2. Tongue — dorsum and, more usefully, the under-surface and the tip. Unaffected by pigmentation.',
          '3. Nail beds — press the nail and watch the colour return. Useless if the patient is cold, has nail polish on, or has thick nails.',
          '4. Palmar creases — a genuinely useful sign only when severe: the creases stay pinker than the surrounding palm until the haemoglobin is roughly below 7 g/dL, so pallor of the creases themselves suggests severe anaemia.',
          '5. Soft palate and the skin generally — the skin last, because complexion confounds it.',
        ],
      },
      {
        heading: 'Grading (clinical, and deliberately coarse)',
        table: {
          columns: ['Grade', 'What you see', 'Rough Hb'],
          rows: [
            ['Mild', 'Conjunctiva pale, tongue and palms normal', '9–11 g/dL'],
            ['Moderate', 'Conjunctiva and tongue pale; nail beds pale', '7–9 g/dL'],
            ['Severe', 'Palmar creases pale; pallor obvious at a distance', 'below 7 g/dL'],
          ],
        },
      },
      {
        heading: 'Causes, grouped by mechanism',
        body:
          'Every anaemia is one of three things: too little made, too much lost, or too much destroyed. Ask which, and the differential writes itself.',
        bullets: [
          'Decreased production — iron deficiency (much the commonest in India, and nutritional or from hookworm), B12/folate deficiency, anaemia of chronic disease, chronic kidney disease (erythropoietin), aplastic anaemia, marrow infiltration, hypothyroidism.',
          'Increased loss — menorrhagia, hookworm, peptic ulcer, haemorrhoids, occult GI malignancy, repeated phlebotomy. In an Indian ward the first three carry most of it.',
          'Increased destruction (haemolysis) — thalassaemia, sickle cell disease, G6PD deficiency, hereditary spherocytosis, autoimmune haemolytic anaemia, malaria, prosthetic valve, microangiopathy.',
          'Dilutional — pregnancy (plasma volume rises ~50%, red cell mass ~25%, so the haemoglobin falls physiologically), and over-transfusion of crystalloid.',
        ],
      },
      {
        heading: 'What to look for in the same breath',
        bullets: [
          'Koilonychia, angular stomatitis, glossitis, platonychia — iron deficiency.',
          'Knuckle hyperpigmentation, beefy red tongue, subacute combined degeneration — B12 deficiency.',
          'Icterus plus splenomegaly plus pallor — haemolysis until proven otherwise.',
          'Bony deformity, frontal bossing, hepatosplenomegaly in a child — thalassaemia major.',
          'Pallor with lymphadenopathy, sternal tenderness, bleeding gums — leukaemia.',
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────── ICTERUS ────
  {
    id: 'icterus',
    letter: 'I',
    name: 'Icterus (Jaundice)',
    summary: 'Yellow staining by bilirubin — sclera first, and the site that distinguishes it from carotenaemia.',
    figure: 'icterus-sites',
    examinerTrap:
      'The yellow of icterus reaches the sclera; the yellow of carotenaemia does not. If the palms and soles are yellow and the sclera is white, the patient has been eating carrots, papaya or pumpkin, not bilirubin. The second trap is the light: examine in daylight, because tube light and yellow ward light each invent a jaundice that is not there.',
    mnemonics: [
      {
        word: 'HEPATIC BOSS',
        answers: 'the causes of jaundice, across all three mechanisms',
        letters: [
          { letter: 'H', stands: 'Hepatitis', detail: 'Viral A, B, C, D, E; also autoimmune and alcoholic hepatitis' },
          { letter: 'E', stands: 'Extrahepatic obstruction', detail: 'CBD stone, stricture, parasites (Ascaris, Clonorchis)' },
          { letter: 'P', stands: 'Pancreatic disease', detail: 'Carcinoma head of pancreas, chronic pancreatitis, periampullary carcinoma' },
          { letter: 'A', stands: 'Alcoholic liver disease', detail: 'Alcoholic hepatitis, alcoholic cirrhosis' },
          { letter: 'T', stands: 'Tumours of liver and biliary tract', detail: 'Hepatocellular carcinoma, cholangiocarcinoma, hilar (Klatskin) tumour, secondaries' },
          { letter: 'I', stands: 'Infections', detail: 'Malaria, leptospirosis, dengue, enteric fever, sepsis, liver abscess' },
          { letter: 'C', stands: 'Cirrhosis', detail: 'Of any cause — post-viral, alcoholic, NASH, autoimmune, Wilson, haemochromatosis' },
          { letter: 'B', stands: 'Blood disorders', detail: 'Haemolytic anaemias — the pre-hepatic group' },
          { letter: 'O', stands: 'Obstructive disease', detail: 'Choledocholithiasis, benign biliary stricture, Mirizzi syndrome' },
          { letter: 'S', stands: 'Sickle cell and hereditary haemolytic disorders', detail: 'Also thalassaemia, spherocytosis, G6PD deficiency' },
          { letter: 'S', stands: 'Sepsis', detail: 'Cholestasis of sepsis — jaundice with a disproportionately normal liver' },
        ],
        caveat:
          'It omits the congenital hyperbilirubinaemias (Gilbert, Crigler-Najjar, Dubin-Johnson, Rotor), drug-induced jaundice (paracetamol, anti-tubercular therapy, OCPs, methotrexate) and the whole of neonatal jaundice, which is its own differential.',
      },
    ],
    blocks: [
      {
        heading: 'Threshold',
        body:
          'Bilirubin binds elastin, and the sclera is rich in it — which is why the sclera goes first. Icterus is clinically detectable at a serum bilirubin of roughly 2–3 mg/dL (34–51 µmol/L); below 2 mg/dL the patient is biochemically but not visibly jaundiced. Under-surface of the tongue and the soft palate come next, then skin.',
      },
      {
        heading: 'Types, by the mechanism of the rise',
        table: {
          columns: ['', 'Pre-hepatic', 'Hepatic', 'Post-hepatic'],
          rows: [
            ['Bilirubin', 'Unconjugated', 'Both', 'Conjugated'],
            ['Urine colour', 'Normal', 'Dark', 'Dark'],
            ['Urine bilirubin', 'Absent (unconjugated is albumin-bound, not filtered)', 'Present', 'Present'],
            ['Urobilinogen', 'Increased', 'Variable', 'Absent / decreased'],
            ['Stool', 'Normal or dark', 'Normal / pale', 'Clay-coloured'],
            ['Pruritus', 'Absent', 'Variable', 'Marked'],
            ['ALT / AST', 'Normal', 'Very high', 'Mildly raised'],
            ['ALP / GGT', 'Normal', 'Mildly raised', 'Very high'],
            ['Typical shade', 'Lemon-yellow', 'Orange-yellow', 'Greenish-yellow'],
          ],
        },
      },
      {
        heading: 'Where to look',
        bullets: [
          '1. Sclera, in natural daylight, with the patient looking down while you lift the upper lid — the upper bulbar sclera is the earliest site and the one hidden by the lid in a casual glance.',
          '2. Under-surface of the tongue and the frenulum.',
          '3. Soft palate.',
          '4. Skin, palms and soles — late, and the site that separates jaundice from carotenaemia.',
          'Look also at the urine (ask, or look at the bag) and ask about stool colour — two questions that split obstructive from hepatocellular before any test.',
        ],
      },
      {
        heading: 'Causes',
        bullets: [
          'Pre-hepatic — haemolysis (thalassaemia, sickle cell, G6PD, autoimmune, malaria), ineffective erythropoiesis, massive haematoma resorption, Gilbert and Crigler-Najjar syndromes.',
          'Hepatic — viral hepatitis A/B/C/E, alcoholic hepatitis, drug-induced (paracetamol, anti-tubercular drugs, methotrexate), autoimmune hepatitis, Wilson disease, cirrhosis of any cause, leptospirosis, dengue.',
          'Post-hepatic — choledocholithiasis, carcinoma head of pancreas, periampullary carcinoma, cholangiocarcinoma, biliary stricture, chronic pancreatitis, parasitic (ascariasis, clonorchiasis).',
          'In the newborn a separate frame applies entirely: physiological, breast-milk, ABO/Rh incompatibility, sepsis, biliary atresia. Jaundice on day 1 of life is never physiological.',
        ],
      },
      {
        heading: 'Courvoisier\'s law, and why it is a law with a hole in it',
        body:
          'In a jaundiced patient, a palpable, non-tender gallbladder is unlikely to be due to stones — because stone disease scars and contracts the gallbladder, so it cannot distend. It therefore points to malignant obstruction (carcinoma head of pancreas, periampullary). The hole: it fails when a stone in the cystic duct coexists with one in the common bile duct (double impaction), in a double stone, and in oriental cholangiohepatitis.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────── CYANOSIS ────
  {
    id: 'cyanosis',
    letter: 'C',
    name: 'Cyanosis',
    summary: 'Blue discolouration from ≥5 g/dL of reduced haemoglobin — and the central/peripheral split is the whole examination.',
    figure: 'cyanosis-sites',
    examinerTrap:
      'Cyanosis is an absolute amount of reduced haemoglobin, not a percentage. A polycythaemic patient goes blue while still well oxygenated; a severely anaemic patient can be profoundly hypoxic and never go blue at all, because they do not own 5 g/dL of haemoglobin to spare. This is the single most asked question on this sign.',
    mnemonics: [
      {
        word: 'COLD BLUE',
        answers: 'the causes of cyanosis',
        letters: [
          { letter: 'C', stands: 'Congenital heart disease', detail: 'Cyanotic CHD with right-to-left shunt: Fallot, TGA, TAPVC, tricuspid atresia, truncus' },
          { letter: 'O', stands: 'Obstructive lung disease', detail: 'COPD, severe asthma — the "blue bloater" phenotype' },
          { letter: 'L', stands: 'Lung disease', detail: 'Pneumonia, pulmonary oedema, ARDS, extensive fibrosis, collapse' },
          { letter: 'D', stands: 'Drugs and toxins', detail: 'Nitrates, dapsone, local anaesthetics, aniline dyes → methaemoglobinaemia' },
          { letter: 'B', stands: 'Blood disorders', detail: 'Methaemoglobinaemia, sulphaemoglobinaemia, polycythaemia' },
          { letter: 'L', stands: 'Left-to-right shunt that has reversed', detail: 'Eisenmenger syndrome — a VSD/ASD/PDA that has become right-to-left' },
          { letter: 'U', stands: 'Upper airway obstruction', detail: 'Foreign body, epiglottitis, laryngeal oedema, obstructive sleep apnoea' },
          { letter: 'E', stands: 'Embolism', detail: 'Massive pulmonary embolism' },
        ],
        caveat:
          'Every letter here is a cause of CENTRAL cyanosis. The peripheral causes — cold, shock, low cardiac output, arterial or venous obstruction, Raynaud — are not in it at all, and peripheral is the commoner finding on a ward round.',
      },
    ],
    blocks: [
      {
        heading: 'The rule',
        body:
          'Cyanosis appears when reduced (deoxygenated) haemoglobin in the capillary blood exceeds about 5 g/dL — classically corresponding to an SpO₂ near 85% in a patient with a normal haemoglobin of 15 g/dL. Because the trigger is absolute, anaemia delays it and polycythaemia brings it on early.',
      },
      {
        heading: 'Central vs peripheral — the comparison the viva turns on',
        table: {
          columns: ['', 'Central', 'Peripheral'],
          rows: [
            ['Mechanism', 'Arterial blood itself is desaturated', 'Normal arterial saturation; increased extraction in a slow peripheral circulation'],
            ['Sites', 'Tongue, under-surface of tongue, lips, buccal mucosa, conjunctiva — AND the extremities', 'Extremities only: fingers, toes, nose tip, ear lobes, outer lips'],
            ['Tongue', 'Blue — the defining site', 'Pink — never blue'],
            ['Temperature of part', 'Warm', 'Cold'],
            ['Effect of warming/massage', 'No change', 'Cyanosis disappears'],
            ['Effect of 100% oxygen', 'Improves (except in a right-to-left shunt, where it does not)', 'No change'],
            ['Clubbing', 'Often present if long-standing', 'Absent'],
            ['Polycythaemia', 'Often present', 'Absent'],
          ],
        },
      },
      {
        heading: 'Where to look, and how to examine',
        bullets: [
          'Look at the TONGUE first, in good light — it is the one site that answers central versus peripheral by itself, and it is unaffected by skin pigmentation and by cold.',
          'Then lips, buccal mucosa and conjunctiva.',
          'Then fingers, toes, nose tip, ear lobes.',
          'Warm the hands, or immerse them in warm water, and look again: peripheral cyanosis abolishes, central does not.',
          'Compare hands with feet, and the two hands with each other — see differential cyanosis below.',
          'Confirm with pulse oximetry and, if it matters, arterial blood gas. Oximetry reads normal in methaemoglobinaemia, which is the trap; the blood is chocolate-brown and does not redden on exposure to air.',
        ],
      },
      {
        heading: 'Causes of central cyanosis',
        bullets: [
          'Decreased inspired oxygen — high altitude.',
          'Lung disease — COPD, severe pneumonia, ARDS, pulmonary oedema, massive pulmonary embolism, extensive fibrosis.',
          'Right-to-left shunt — Tetralogy of Fallot, transposition of the great arteries, Eisenmenger syndrome, pulmonary arteriovenous malformation. The distinguishing feature is that 100% oxygen does not correct it.',
          'Abnormal haemoglobin — methaemoglobinaemia (nitrates, dapsone, local anaesthetics), sulphaemoglobinaemia. Strictly this is pseudocyanosis: the saturation is normal and the oximeter is fooled.',
        ],
      },
      {
        heading: 'Causes of peripheral cyanosis',
        bullets: [
          'Cold exposure — physiological, and much the commonest.',
          'Reduced cardiac output — heart failure, shock of any cause.',
          'Arterial obstruction — peripheral arterial disease, embolism, Raynaud phenomenon.',
          'Venous obstruction — deep vein thrombosis, superior vena cava obstruction.',
          'Increased blood viscosity — polycythaemia.',
        ],
      },
      {
        heading: 'Differential cyanosis — worth knowing because it localises the lesion',
        bullets: [
          'Lower limbs blue, upper limbs pink — patent ductus arteriosus with reversed shunt (Eisenmenger physiology). Desaturated pulmonary arterial blood enters the aorta distal to the left subclavian.',
          'Upper limbs blue, lower limbs pink (reverse differential) — transposition of the great arteries with PDA and either pulmonary hypertension or coarctation.',
          'Left arm and both legs blue, right arm pink — PDA with reversed shunt plus a pre-ductal coarctation.',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────── CLUBBING ────
  {
    id: 'clubbing',
    letter: 'C',
    name: 'Clubbing',
    summary: 'Bulbous swelling of the terminal phalanx with loss of the nail-bed angle — four grades, and three systems that cause it.',
    figure: 'clubbing-profile',
    examinerTrap:
      'Clubbing is graded on the ANGLE and on FLUCTUATION, not on how big the finger looks. The earliest sign is fluctuation of the nail bed, before any angle has changed — so a confident "no clubbing" from a glance at the profile alone is the answer that gets corrected.',
    mnemonics: [
      {
        word: 'CLUBBING',
        answers: 'the causes of clubbing',
        letters: [
          { letter: 'C', stands: 'Cyanotic congenital heart disease', detail: 'Fallot, transposition, Eisenmenger — clubbing plus central cyanosis plus polycythaemia' },
          { letter: 'L', stands: 'Lung abscess', detail: 'And empyema — suppurative lung disease is the classic group' },
          { letter: 'U', stands: 'Ulcerative colitis', detail: 'And Crohn disease, coeliac disease, tropical sprue' },
          { letter: 'B', stands: 'Bronchiectasis', detail: 'The commonest respiratory cause on an Indian ward' },
          { letter: 'B', stands: 'Bronchogenic carcinoma', detail: 'Clubbing in a smoker with COPD means look for a cancer — COPD itself does not club' },
          { letter: 'I', stands: 'Infective endocarditis', detail: 'With splinter haemorrhages, Osler nodes, Janeway lesions, Roth spots' },
          { letter: 'N', stands: 'Neoplasm', detail: 'Mesothelioma, thymoma, oesophageal and GI malignancy, lymphoma' },
          { letter: 'G', stands: 'Gastrointestinal and idiopathic', detail: 'Cirrhosis (especially biliary), and hereditary or idiopathic clubbing' },
        ],
        caveat:
          'It leaves out the two that change your answer most: thyroid acropachy in Graves disease, and UNILATERAL clubbing (aortic or subclavian aneurysm, Pancoast tumour, axillary AV malformation) — which is a local vascular problem and not a chest one at all.',
      },
    ],
    blocks: [
      {
        heading: 'What it is',
        body:
          'Interstitial oedema and vascular hyperplasia in the nail bed, driven by megakaryocytes and platelet clumps that bypass the normal pulmonary filter and lodge in the digital vasculature, releasing PDGF and VEGF. That mechanism is why it is a feature of right-to-left shunts and of suppurative lung disease, and why it can regress when the cause is removed.',
      },
      {
        heading: 'The four grades',
        table: {
          columns: ['Grade', 'Finding'],
          rows: [
            ['1', 'Fluctuation of the nail bed only. The nail feels spongy, floating on its bed. No visible change.'],
            ['2', 'Obliteration of the Lovibond angle — the normal 160° angle between nail fold and nail becomes 180° or more. Schamroth\'s window is lost.'],
            ['3', 'Parrot-beak / drumstick appearance: the nail curves in both directions and the pulp is swollen.'],
            ['4', 'Hypertrophic pulmonary osteoarthropathy — clubbing plus painful, swollen wrists and ankles with subperiosteal new bone on X-ray.'],
          ],
        },
      },
      {
        heading: 'How to examine — four tests, in this order',
        bullets: [
          '1. Profile (Lovibond) angle — look at the finger from the side, at eye level. Normal nail-fold-to-nail angle is about 160°; in clubbing it flattens to ≥180°.',
          '2. Schamroth\'s window — appose the dorsal surfaces of the two index fingers nail to nail. Normally a diamond-shaped gap appears between the nail beds. In clubbing that window is obliterated. This is the quickest and the one to demonstrate.',
          '3. Fluctuation — steady the finger with both thumbs under the pulp and both index fingers on the interphalangeal joint, then press the nail bed with your middle fingers alternately. A clubbed nail bed rocks, like a nail floating on fluid.',
          '4. Curvature and the distal phalangeal depth ratio — the depth at the nail bed exceeds the depth at the distal interphalangeal joint (ratio >1). Also check the toes, and always both hands.',
        ],
      },
      {
        heading: 'Causes by system',
        bullets: [
          'RESPIRATORY (suppurative and malignant, not obstructive) — bronchiectasis, lung abscess, empyema, bronchogenic carcinoma, mesothelioma, idiopathic pulmonary fibrosis, cystic fibrosis, pulmonary tuberculosis with cavitation. Note: uncomplicated COPD and asthma do NOT cause clubbing; clubbing in a COPD patient means look for a cancer.',
          'CARDIOVASCULAR — cyanotic congenital heart disease (Fallot, transposition, Eisenmenger), infective endocarditis, atrial myxoma.',
          'GASTROINTESTINAL — cirrhosis (especially biliary), inflammatory bowel disease (Crohn more than ulcerative colitis), coeliac disease, tropical sprue, GI lymphoma.',
          'ENDOCRINE — thyroid acropachy in Graves disease.',
          'HEREDITARY / IDIOPATHIC — familial clubbing, pachydermoperiostosis. Present since childhood, no disease, and the giveaway is that it has not changed.',
          'UNILATERAL clubbing — aneurysm of the aorta, subclavian or innominate artery; Pancoast tumour; axillary arteriovenous malformation. Unilateral means a local vascular cause, so examine the arm.',
        ],
      },
      {
        heading: 'Nail signs to check in the same breath',
        bullets: [
          'Koilonychia (spoon nails) — iron deficiency. Test by placing a drop of water on the nail: it stays.',
          'Platonychia — flat nails, the stage before koilonychia.',
          'Leuconychia — hypoalbuminaemia (chronic liver disease, nephrotic syndrome).',
          'Splinter haemorrhages — infective endocarditis, trauma, vasculitis.',
          'Beau\'s lines — a transverse groove marking an episode of severe systemic illness; its distance from the cuticle dates the illness.',
          'Nail clubbing with nicotine staining, and a cachectic smoker — look for a bronchogenic carcinoma before you say anything else.',
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────── LYMPHADENOPATHY ──────
  {
    id: 'lymphadenopathy',
    letter: 'L',
    name: 'Lymphadenopathy',
    summary: 'Nodes are described by six characters and examined from behind — and the drainage territory is the diagnosis.',
    figure: 'lymph-node-map',
    examinerTrap:
      'A palpable node is not a diagnosis; its drainage area is. Before you describe the node, work out what drains into it and examine that. A hard left supraclavicular node (Virchow) sends you to the stomach, not to the neck.',
    mnemonics: [
      {
        word: 'VITALS',
        answers: 'the causes of GENERALISED lymphadenopathy (two or more non-contiguous regions)',
        letters: [
          { letter: 'V', stands: 'Viral infections', detail: 'EBV (infectious mononucleosis), CMV, HIV, rubella, dengue, measles' },
          { letter: 'I', stands: 'Infections, non-viral', detail: 'Tuberculosis, brucellosis, toxoplasmosis, secondary syphilis, kala-azar, filariasis' },
          { letter: 'T', stands: 'Tumours', detail: 'Lymphoma (Hodgkin and non-Hodgkin), leukaemia, widespread metastasis' },
          { letter: 'A', stands: 'Autoimmune disease', detail: 'SLE, rheumatoid arthritis, adult-onset Still disease, dermatomyositis' },
          { letter: 'L', stands: 'Lymphoproliferative disorders', detail: 'CLL, ALL, Castleman disease, Langerhans cell histiocytosis' },
          { letter: 'S', stands: 'Sarcoidosis', detail: 'Bilateral hilar lymphadenopathy plus erythema nodosum plus arthralgia = Löfgren syndrome' },
        ],
        caveat:
          'Drugs are missing and they are a real ward cause — phenytoin, carbamazepine, allopurinol and lamotrigine all produce a pseudolymphoma. So is hyperthyroidism. And none of it applies to LOCALISED lymphadenopathy, where the answer is always "what drains into this node".',
      },
    ],
    blocks: [
      {
        heading: 'The six characters to describe — every node, every time',
        bullets: [
          'Site and group — and therefore what drains into it.',
          'Number — single or multiple; one group or generalised (generalised = two or more non-contiguous groups).',
          'Size — in centimetres, not in fruit. Over 1 cm is significant anywhere except the inguinal region, where up to 1.5 cm may be normal.',
          'Consistency — soft (normal/reactive), firm-rubbery (lymphoma), stony hard (metastatic carcinoma), matted (tuberculosis), fluctuant (abscess, cold abscess).',
          'Tenderness — tender suggests acute inflammation; painless suggests malignancy or tuberculosis.',
          'Mobility and fixity — mobile, fixed to skin, fixed to deeper structures. Fixity suggests malignancy or advanced tuberculosis. Also note overlying skin: redness, a discharging sinus, a healed puckered scar.',
        ],
      },
      {
        heading: 'How to examine',
        bullets: [
          'Cervical nodes — stand BEHIND the seated patient, with the neck slightly flexed to relax the sternocleidomastoid. Use the pulps of the fingers of both hands, rolling the node against the underlying structure, and follow a fixed route so nothing is missed: submental → submandibular → preauricular → postauricular → occipital → superficial cervical (along the external jugular) → deep cervical (along the sternocleidomastoid, upper/middle/lower) → posterior triangle → supraclavicular.',
          'Axillary nodes — stand in FRONT. Take the weight of the patient\'s arm on your own forearm so the pectoral muscles relax, and examine the five groups with the other hand: anterior (pectoral), posterior (subscapular), lateral (brachial), central, and apical. Use your right hand for the left axilla and vice versa.',
          'Inguinal nodes — patient supine. Horizontal group along the inguinal ligament (drains lower abdominal wall, perineum, anal canal below the dentate line, external genitalia — not the testis); vertical group along the saphenous opening (drains the lower limb).',
          'Epitrochlear node — 3 cm above the medial epicondyle, in the groove between biceps and triceps. Flex the elbow to 90° and cup the elbow in your hand. A palpable epitrochlear node is significant: non-Hodgkin lymphoma, secondary syphilis, sarcoidosis, or a hand infection.',
          'Always finish by examining liver, spleen and the drainage territory, and by looking at the throat, scalp, ears and teeth for cervical nodes.',
        ],
      },
      {
        heading: 'Named nodes worth knowing',
        bullets: [
          'Virchow\'s node — left supraclavicular, at the confluence of the thoracic duct with the left subclavian vein. Enlargement is Troisier\'s sign: carcinoma stomach, and also pancreas, oesophagus, testis, ovary.',
          'Jugulodigastric (tonsillar) node — below and behind the angle of the mandible; tonsillitis and carcinoma of the tonsil.',
          'Sister Mary Joseph nodule — umbilical metastatic deposit, not a node, but found on the same survey.',
          'Delphian (prelaryngeal) node — thyroid carcinoma and laryngeal carcinoma.',
        ],
      },
      {
        heading: 'Causes of localised lymphadenopathy',
        bullets: [
          'Acute bacterial infection in the drainage area — tender, soft, mobile, with overlying warmth.',
          'Tuberculous lymphadenitis — much the commonest cause of chronic cervical lymphadenopathy in India. Matted, painless, may caseate to a cold abscess and then a collar-stud abscess with a discharging sinus and a puckered scar.',
          'Metastatic carcinoma — hard, fixed, painless, and in the node draining the primary.',
          'Lymphoma — rubbery, painless, mobile; asymmetric in non-Hodgkin, contiguous spread in Hodgkin.',
          'Cat-scratch disease, lymphogranuloma venereum, filariasis (inguinal).',
        ],
      },
      {
        heading: 'Causes of generalised lymphadenopathy',
        bullets: [
          'Infective — HIV, infectious mononucleosis, cytomegalovirus, toxoplasmosis, secondary syphilis, disseminated tuberculosis, brucellosis, kala-azar.',
          'Haematological — chronic lymphocytic leukaemia, acute lymphoblastic leukaemia, lymphoma.',
          'Connective tissue — systemic lupus erythematosus, rheumatoid arthritis, Still disease.',
          'Granulomatous — sarcoidosis.',
          'Drugs — phenytoin, carbamazepine, allopurinol (pseudolymphoma).',
          'Endocrine — hyperthyroidism.',
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────── EDEMA ────
  {
    id: 'edema',
    letter: 'E',
    name: 'Edema',
    summary: 'Excess interstitial fluid — pitting or not, dependent or generalised, and the site depends on the posture.',
    figure: 'pitting-grades',
    examinerTrap:
      'Press for long enough. Pitting needs sustained pressure over a bony point for 10–15 seconds (some texts say up to 30 in chronic oedema); a two-second press over soft calf muscle finds nothing and the candidate concludes "no oedema". And look where gravity put it: in a patient who has been lying down for a week the oedema is over the SACRUM, not the ankles.',
    mnemonics: [
      {
        word: 'HEART – KIDNEY – LIVER',
        answers: 'the three organ failures behind most bilateral pitting pedal oedema',
        letters: [
          { letter: 'H', stands: 'HEART', detail: 'Congestive cardiac failure, cor pulmonale, constrictive pericarditis, restrictive cardiomyopathy — oedema WITH a raised JVP and tender hepatomegaly' },
          { letter: 'K', stands: 'KIDNEY', detail: 'Nephrotic syndrome (periorbital first, frothy urine), nephritic syndrome, chronic kidney disease — oedema with a NORMAL or low JVP unless overloaded' },
          { letter: 'L', stands: 'LIVER', detail: 'Cirrhosis and chronic liver disease — oedema with ascites, spider naevi, splenomegaly and a low albumin' },
        ],
        caveat:
          'Three organs is a starting point, not the differential. It leaves out hypoalbuminaemia from malnutrition and protein-losing enteropathy, severe anaemia, beri-beri, myxoedema, drugs (amlodipine, NSAIDs, steroids, pioglitazone), pregnancy, IVC obstruction — and the whole non-pitting group (filarial and post-surgical lymphoedema, myxoedema), which no organ failure explains.',
      },
    ],
    blocks: [
      {
        heading: 'Mechanism — the four Starling causes',
        bullets: [
          'Increased capillary hydrostatic pressure — heart failure, venous obstruction, DVT, fluid overload, pregnancy.',
          'Decreased plasma oncotic pressure (hypoalbuminaemia) — nephrotic syndrome, cirrhosis, protein-losing enteropathy, kwashiorkor, severe malnutrition.',
          'Increased capillary permeability — inflammation, sepsis, burns, angio-oedema, ARDS.',
          'Lymphatic obstruction — filariasis, post-surgical (axillary clearance), post-radiotherapy, malignant infiltration. This is the group that does NOT pit.',
        ],
      },
      {
        heading: 'Pitting vs non-pitting',
        table: {
          columns: ['', 'Pitting', 'Non-pitting'],
          rows: [
            ['Fluid', 'Low-protein transudate', 'High-protein / bound fluid'],
            ['On pressure', 'An indentation stays', 'No indentation'],
            ['Typical causes', 'Cardiac failure, renal, hepatic, hypoalbuminaemia, venous, drugs', 'Lymphoedema (filariasis, post-surgical), myxoedema in hypothyroidism, chronic long-standing lymphoedema'],
            ['Skin', 'Normal, shiny when tense', 'Thickened, warty, peau d\'orange, non-pinchable (Stemmer sign)'],
          ],
        },
      },
      {
        heading: 'Grading',
        table: {
          columns: ['Grade', 'Depth of pit', 'Rebound'],
          rows: [
            ['Grade 1 (+)', '2 mm', 'Immediate'],
            ['Grade 2 (++)', '4 mm', 'A few seconds'],
            ['Grade 3 (+++)', '6 mm', '10–12 seconds'],
            ['Grade 4 (++++)', '8 mm', 'More than 20 seconds'],
          ],
        },
      },
      {
        heading: 'Where to look, by posture',
        bullets: [
          'Ambulant patient — over the medial malleolus and the dorsum of the foot; then the shin over the subcutaneous surface of the tibia, moving upward to find the upper level.',
          'Bed-bound patient — over the SACRUM. This is the classically missed site.',
          'Generalised (anasarca) — face and periorbital region (nephrotic syndrome and angio-oedema start here, because the tissue is lax), scrotum or vulva, abdominal wall, with ascites and pleural effusion.',
          'Always state the UPPER LEVEL of the oedema, and always compare the two limbs — unilateral oedema is a different differential entirely.',
        ],
      },
      {
        heading: 'Unilateral vs bilateral — the first split to make',
        bullets: [
          'Unilateral — deep vein thrombosis, cellulitis, lymphatic obstruction (filariasis), trauma, ruptured Baker cyst, compartment syndrome, May-Thurner syndrome.',
          'Bilateral — congestive cardiac failure, nephrotic syndrome, cirrhosis with hypoalbuminaemia, chronic kidney disease, severe anaemia, beri-beri, myxoedema, drugs (amlodipine and other dihydropyridines, NSAIDs, steroids, pioglitazone), pregnancy, inferior vena cava obstruction, constrictive pericarditis.',
        ],
      },
      {
        heading: 'Reading the rest of the patient',
        bullets: [
          'Oedema + raised JVP + tender hepatomegaly → right heart failure.',
          'Oedema + periorbital puffiness worse in the morning + frothy urine → nephrotic syndrome.',
          'Oedema + ascites + spider naevi + splenomegaly → cirrhosis with portal hypertension.',
          'Oedema + raised JVP that does NOT fall on inspiration (Kussmaul sign) → constrictive pericarditis.',
          'Oedema of face and arms with dilated chest veins and a non-pulsatile raised JVP → superior vena cava obstruction.',
        ],
      },
    ],
  },
];
