/**
 * The general examination, sign by sign, with a photograph of each.
 *
 * Every case sheet in this app opens the same way — "Pallor, Icterus,
 * Cyanosis, Clubbing, Koilonychia, Lymphadenopathy, Edema" — and that line is
 * in every one of the proformas the app's owner collected, from the surgery
 * long cases to the ophthalmology sheet. It is the one part of clerking a
 * student does on literally every patient, and it is the part that is useless
 * as words: nobody has ever learned what koilonychia looks like by reading
 * "spoon-shaped nails".
 *
 * So each sign here carries a PHOTOGRAPH, not a drawing. That is deliberate
 * and it is the owner's instruction: a diagram of a nail teaches the idea, and
 * a picture of a nail is what the student has to match against the hand in
 * front of them in the exam. `src/lib/trees.ts` draws its trees from numbers
 * because a tree is a shape; a clinical sign is a thing that has to be
 * recognised, and recognition needs the real one.
 *
 * ── Where the pictures come from ───────────────────────────────────────────
 *
 * `imageFile` names a plate under `signs/` in the Supabase `diagrams` bucket,
 * reached the same way every other plate is (`resolveProformaDiagramUrl`), so
 * a sign with no picture yet shows its text and nothing else rather than a
 * broken frame — the same rule `question_diagrams` follows.
 *
 * They are fetched rather than drawn, and `search` is what fetches them.
 * NOTHING IN A SANDBOX CAN DO THAT: the egress gateway blocks
 * commons.wikimedia.org outright, exactly as it blocks the Supabase host. A
 * GitHub runner has open network, so `.github/workflows/exam-sign-images.yml`
 * does the fetching, and `supabase-tasks.yml` uploads whatever lands in
 * `public/diagrams/`. This is the same split that repaired the 39 broken
 * diagram rows: the agent decides WHICH picture, the runner fetches it.
 *
 * ── The licence rule, which is not negotiable ──────────────────────────────
 *
 * This app ships on Play under somebody's real developer account. A clinical
 * photograph is usually of a real patient and is usually somebody's
 * copyrighted work, so only two things may be taken: public domain, or a
 * Creative Commons licence that permits commercial use. `credit` is filled in
 * by the fetcher from the file's own licence metadata and is SHOWN UNDER THE
 * PICTURE — CC-BY requires attribution, and an attribution nobody displays is
 * a licence nobody is keeping. A sign whose fetch found nothing acceptable
 * keeps `imageFile` and stays text-only, which is the correct outcome and not
 * a bug to work around by taking an image with no licence.
 */

export type SignGroup =
  | 'PICCLE'
  | 'Nails'
  | 'Hands'
  | 'Face, eyes and mouth'
  | 'Neck and nodes'
  | 'Nutrition and build'
  | 'Vitals';

export interface ExamSignImage {
  /** Path under `signs/` in the diagrams bucket. Undefined until one is found. */
  file?: string;
  /** Free text from the source's licence metadata, shown under the picture. */
  credit?: string;
  /** e.g. 'CC BY-SA 4.0', 'Public domain'. Commercial use must be permitted. */
  licence?: string;
  /** What the fetcher searches for. Ordered: the first acceptable hit wins. */
  search: string[];
  /**
   * Named Commons files to try **before** searching, in order.
   *
   * Search is how most of these were found and it is the wrong tool for the
   * last few. Commons full-text search ranks the file *page*, so a sign whose
   * distinctive word is rare in filenames — pallor is the standing example —
   * returns twelve pages that merely mention it and nothing that depicts it,
   * and the title gate correctly refuses all twelve. The result is a blank
   * that no amount of re-running fixes, because the input never changes.
   *
   * A named file changes the input. It does **not** change the rules: the
   * licence check still runs, the MIME check still runs, and a title that does
   * not exist is skipped and falls through to the search exactly as before. So
   * naming a bad file costs a log line, and naming a good one is the only way
   * a human's eyes get into a process that is otherwise a keyword match.
   *
   * The title gate is deliberately **not** applied to these — naming the file
   * *is* the corroboration, and it is a stronger one than a substring test.
   */
  commonsFiles?: string[];
  /**
   * The corroboration gate, and the reason it exists.
   *
   * The first run of the fetch workflow searched Commons and took the first
   * freely-licensed hit, and it was wrong for five of nineteen signs — badly
   * wrong, not nearly wrong. "Clubbing" returned a portrait of a film-maker,
   * "platonychia" returned a Roman bronze nail cleaner, "palmar erythema"
   * returned chemotherapy hand-foot syndrome. Commons full-text search matches
   * the file PAGE, so a page that merely mentions a word ranks for it.
   *
   * This repo has already learned this lesson once, on the question diagrams:
   * a keyword search cannot choose a clinical picture, and a plausible wrong
   * one is worse than a blank because the reader trusts it. The fix there was
   * that the filename has to corroborate — `audit:diagrams` is that idea. This
   * is the same rule applied before the download rather than after it.
   *
   * At least one of these must appear in the Commons file TITLE. They are
   * deliberately the sign's own distinctive words: "nail" or "hand" would let
   * every one of the five wrong hits through. A sign whose gate nothing passes
   * keeps no picture, and that is the correct outcome.
   */
  titleMustContain: string[];
}

export interface ExamSign {
  id: string;
  name: string;
  group: SignGroup;
  /** One line a student could say to an examiner. */
  definition: string;
  /** Where on the patient to look, and how. */
  whereToLook: string;
  /** Grading or a positive/negative test, when the sign has one. */
  grading?: string;
  /** The causes, with the mnemonic students actually use. */
  mnemonic?: { word: string; expansion: string[] };
  causes?: string[];
  /** The thing that gets missed, or the trap in the viva. */
  pearl?: string;
  image: ExamSignImage;
}

export const EXAM_SIGNS: ExamSign[] = [
  // ─────────────────────────────── PICCLE ───────────────────────────────
  {
    id: 'pallor',
    name: 'Pallor',
    group: 'PICCLE',
    definition:
      'Loss of the normal red-pink colour of the skin and mucous membranes, reflecting a fall in haemoglobin concentration or in cutaneous perfusion.',
    whereToLook:
      'Lower palpebral conjunctiva (gently evert the lower lid with the patient looking up), tongue and buccal mucosa, nail beds, and the palmar creases. Compare against your own.',
    grading:
      'Palmar crease pallor implies haemoglobin below roughly 7 g/dL — creases that are no redder than the surrounding palm is the classical threshold. Conjunctival pallor alone is less specific.',
    causes: [
      'Blood loss — acute (trauma, haematemesis, melaena, postpartum) or chronic (hookworm, menorrhagia, piles, occult GI malignancy)',
      'Deficiency — iron, B12 and folate, protein-energy malnutrition',
      'Haemolysis — thalassaemia, sickle cell disease, G6PD deficiency, autoimmune',
      'Marrow failure — aplastic anaemia, leukaemia, marrow infiltration',
      'Anaemia of chronic disease — chronic kidney disease, chronic infection, malignancy',
      'Without anaemia: shock, syncope, hypothermia, hypopituitarism',
    ],
    pearl:
      'Pallor is a sign of anaemia, not a measurement of it. A normal-looking conjunctiva does not exclude anaemia, and the examiner is asking you to look in more than one place — say all four sites out loud.',
    image: {
      /*
       * Candidates, not a claim. Each is checked on the runner for existence,
       * MIME and licence before anything is downloaded, and every one that
       * fails is a printed line rather than a broken picture. They are ordered
       * by how well they show the sign where a student is told to look: the
       * conjunctiva first, then the hand.
       */
      commonsFiles: [
        'File:Anemia conjunctiva.jpg',
        'File:Conjunctival pallor.jpg',
        'File:Pallor of conjunctiva.jpg',
        'File:Anemic pallor of the conjunctiva.jpg',
        'File:Palmar pallor.jpg',
        'File:Anaemia palmar pallor.jpg',
        'File:Pale hand anemia.jpg',
      ],
      search: [
        'conjunctival pallor anaemia',
        'pallor lower eyelid anemia',
        'anemia palm pallor',
        'palmar pallor anaemia hand',
        'pale conjunctiva anaemia clinical',
      ],
      titleMustContain: ['pallor', 'pale conjunctiva', 'conjunctival'],
    },
  },
  {
    id: 'icterus',
    name: 'Icterus (jaundice)',
    group: 'PICCLE',
    definition:
      'Yellow discolouration of the sclerae, skin and mucous membranes caused by hyperbilirubinaemia — the accumulation of excess bilirubin in the bloodstream.',
    whereToLook:
      'Bulbar conjunctiva over the sclera in natural daylight first, then the undersurface of the tongue, the soft palate, the skin and the nail beds. Ask the patient to look down and lift the upper lid — the upper bulbar conjunctiva shows it earliest.',
    grading:
      'Detectable clinically once serum bilirubin exceeds roughly 2–3 mg/dL. Look in daylight: tube light masks it, and that alone is why it gets missed on a ward round.',
    mnemonic: {
      word: 'HEPATIC BOSS',
      expansion: [
        'H — Hepatitis (viral A, B, C, E)',
        'E — Extrahepatic obstruction',
        'P — Pancreatic disease (carcinoma head of pancreas, pancreatitis)',
        'A — Alcoholic liver disease',
        'T — Tumours of liver and biliary tract',
        'I — Infections (malaria, leptospirosis, sepsis)',
        'C — Cirrhosis',
        'B — Blood disorders (haemolytic anaemia)',
        'O — Obstructive disease (CBD stone, stricture)',
        'S — Sickle cell and hereditary haemolytic disorders',
        'S — Sepsis',
      ],
    },
    pearl:
      'Carotenaemia spares the sclera — yellow palms and soles with white eyes is carrot and papaya, not liver. That is the commonest trap set on this sign.',
    image: {
      search: ['scleral icterus jaundice', 'jaundice eye sclera', 'icterus conjunctiva'],
      titleMustContain: ['icterus', 'jaundice'],
    },
  },
  {
    id: 'cyanosis-central',
    name: 'Central cyanosis',
    group: 'PICCLE',
    definition:
      'Bluish discolouration of skin and mucous membranes from reduced arterial oxygen saturation, with more than about 5 g/dL of reduced haemoglobin in the capillary blood.',
    whereToLook:
      'The TONGUE, lips and buccal mucous membranes. A blue tongue is the finding that makes it central.',
    mnemonic: {
      word: 'COLD BLUE',
      expansion: [
        'C — Congenital heart disease (right-to-left shunt)',
        'O — Obstructive lung disease (COPD)',
        'L — Lung disease (pneumonia, pulmonary oedema)',
        'D — Drugs and toxins (methaemoglobinaemia)',
        'B — Blood disorders (methaemoglobinaemia, sulfhaemoglobinaemia)',
        'L — Left-to-right shunts that have reversed (Eisenmenger)',
        'U — Upper airway obstruction',
        'E — Embolism (pulmonary embolism)',
      ],
    },
    pearl:
      'Cyanosis needs ABSOLUTE reduced haemoglobin, so a severely anaemic patient can be profoundly hypoxic and never look blue, while a polycythaemic one looks blue easily. Never use colour to exclude hypoxia.',
    image: {
      search: ['central cyanosis tongue', 'cyanosis lips blue', 'cyanotic congenital heart disease child'],
      /*
       * Central cyanosis is looked for on the TONGUE and LIPS, and the plain
       * word "cyanosis" does not say so. It fetched a photograph of one dusky
       * foot from an arterial thrombosis — a real sign, correctly named, and
       * peripheral cyanosis, which is the other entry on this list. The gate
       * has to carry the site, because the site is the difference.
       */
      titleMustContain: ['central cyanosis', 'cyanosis of the tongue', 'cyanotic tongue', 'cyanosis lips'],
    },
  },
  {
    id: 'cyanosis-peripheral',
    name: 'Peripheral cyanosis',
    group: 'PICCLE',
    definition:
      'Blue discolouration of the extremities from slow peripheral blood flow and increased oxygen extraction, with arterial saturation that may be entirely normal.',
    whereToLook:
      'Fingers, toes, nail beds, tip of the nose and the ear lobes — with a PINK tongue. Pink tongue and blue fingers is the whole distinction.',
    causes: [
      'Peripheral circulatory failure or shock',
      'Congestive cardiac failure',
      'Cold exposure',
      'Peripheral vascular disease',
      "Raynaud's phenomenon",
    ],
    pearl:
      'Warm the hand and peripheral cyanosis goes; central cyanosis does not. That is the bedside test, and it costs nothing.',
    image: {
      search: ['peripheral cyanosis fingers', 'acrocyanosis hands', 'cyanosis nail bed'],
      titleMustContain: ['cyanosis', 'acrocyanosis'],
    },
  },
  {
    id: 'clubbing',
    name: 'Clubbing',
    group: 'PICCLE',
    definition:
      'Selective bulbous enlargement of the distal segment of the digit due to increased subungual soft tissue. The normal angle between nail and nail bed — the Lovibond angle — is about 160°, and clubbing obliterates it.',
    whereToLook:
      'Look along the finger from the side at eye level, then do the Schamroth window test: appose the dorsal surfaces of the two index fingers nail to nail. A diamond-shaped gap between them is normal; loss of that window is clubbing.',
    grading:
      'Grade 1 — fluctuation and softening of the nail bed. Grade 2 — obliteration of the Lovibond angle. Grade 3 — parrot-beak or drumstick appearance. Grade 4 — hypertrophic osteoarthropathy, with wrist and ankle pain and periosteal new bone.',
    mnemonic: {
      word: 'CLUBBING',
      expansion: [
        'C — Congenital heart disease (cyanotic)',
        'L — Lung abscess',
        'U — Ulcerative colitis (and Crohn, coeliac, cirrhosis)',
        'B — Bronchiectasis',
        'B — Bronchogenic carcinoma',
        'I — Infective endocarditis',
        'N — Neoplasm (mesothelioma, thymoma)',
        'G — Idiopathic (and familial)',
      ],
    },
    pearl:
      'Clubbing is ABSENT in uncomplicated COPD. Finding it in a patient labelled COPD obliges you to go looking for bronchiectasis or a bronchogenic carcinoma — say that sentence in the viva and it is worth the whole case.',
    image: {
      search: ['digital clubbing fingers', 'nail clubbing schamroth', 'clubbing hypertrophic osteoarthropathy'],
      titleMustContain: ['clubbing', 'clubbed', 'schamroth', 'osteoarthropathy'],
    },
  },
  {
    id: 'koilonychia',
    name: 'Koilonychia',
    group: 'Nails',
    definition:
      'Spoon-shaped nails — the nail plate is thinned, flattened and then concave, so that it would hold a drop of water.',
    whereToLook:
      'Thumb and index finger nails first, viewed from the side. The sequence is brittle → flat (platonychia) → concave (koilonychia), and the middle step is the one students skip.',
    grading:
      'Water-drop test: a drop placed on the nail stays in the concavity instead of running off.',
    causes: [
      'Iron deficiency anaemia — an important association to look for during the nail examination',
      'Plummer-Vinson (Paterson-Brown-Kelly) syndrome',
      'Haemochromatosis and other disorders of iron handling',
      'Repeated exposure to detergents, oils and solvents — occupational',
      'Raynaud phenomenon, lichen planus, and the normal soft nails of infancy',
    ],
    pearl:
      'Koilonychia is a LATE sign of iron deficiency: the nail takes months to grow out, so it says the deficiency has been there a long time. A normal nail excludes nothing.',
    image: {
      search: ['koilonychia spoon nails', 'spoon shaped nail iron deficiency', 'koilonychia'],
      titleMustContain: ['koilonychia', 'spoon nail', 'spoon-shaped'],
    },
  },
  {
    id: 'lymphadenopathy',
    name: 'Lymphadenopathy',
    group: 'PICCLE',
    definition:
      'Enlargement of lymph nodes. Generalised lymphadenopathy is enlargement in two or more non-contiguous node regions.',
    whereToLook:
      'From BEHIND for the cervical chains, with the neck slightly flexed: submental, submandibular, pre- and post-auricular, occipital, superficial and deep cervical, supraclavicular. Then axillary with the arm supported, then epitrochlear, then inguinal. Record site, number, size, consistency, tenderness, fixity and any matting.',
    mnemonic: {
      word: 'VITALS',
      expansion: [
        'V — Viral infections (EBV, CMV, HIV)',
        'I — Infections (tuberculosis, bacterial, toxoplasmosis)',
        'T — Tumours (lymphoma, leukaemia, metastasis)',
        'A — Autoimmune (SLE, rheumatoid arthritis)',
        'L — Lymphoproliferative disorders',
        'S — Sarcoidosis',
      ],
    },
    pearl:
      "A hard, fixed left supraclavicular node is Virchow's node and it is a finding about the abdomen, not the neck — stomach, pancreas, gallbladder, testis or ovary. Never examine a node field and forget to name its drainage area.",
    image: {
      search: ['cervical lymphadenopathy neck', 'lymphadenopathy examination', 'enlarged lymph node neck'],
      titleMustContain: ['lymphadenopathy', 'lymphadenitis', 'lymph node'],
    },
  },
  {
    id: 'edema',
    name: 'Oedema',
    group: 'PICCLE',
    definition:
      'Abnormal accumulation of fluid in the interstitial space, demonstrated at the bedside as pitting on sustained pressure.',
    whereToLook:
      'Press firmly over the medial malleolus or the front of the tibia for at least 15 seconds, then run a finger over the spot to feel the pit. In a bed-bound patient press over the SACRUM — dependent oedema goes where gravity puts it, and that is the one that is missed.',
    grading:
      'Grade 1 — 2 mm pit, disappears rapidly. Grade 2 — 4 mm, a few seconds. Grade 3 — 6 mm, up to a minute. Grade 4 — 8 mm, lasting two to five minutes with obvious distortion.',
    mnemonic: {
      word: 'HEART — KIDNEY — LIVER',
      expansion: [
        'HEART — congestive cardiac failure, constrictive pericarditis',
        'KIDNEY — nephrotic syndrome, nephritic syndrome, chronic kidney disease',
        'LIVER — cirrhosis, chronic liver disease',
        'Also: hypoproteinaemia and malnutrition, myxoedema, drugs (amlodipine, NSAIDs, steroids), venous and lymphatic obstruction, pregnancy',
      ],
    },
    pearl:
      'Non-pitting oedema is a different differential — myxoedema, lymphoedema, filariasis — so always record whether it pitted, not just that it was there.',
    image: {
      search: ['pitting edema leg', 'pedal edema pitting', 'peripheral edema ankle'],
      titleMustContain: ['edema', 'oedema'],
    },
  },

  // ─────────────────────────────── Nails ───────────────────────────────
  {
    id: 'platonychia',
    name: 'Platonychia',
    group: 'Nails',
    definition:
      'Flattening of the nail plate — the transitional stage between a normal convex nail and a frankly spooned (koilonychic) one.',
    whereToLook:
      'From the side, at eye level, on the thumb and index nails. The normal transverse and longitudinal convexity is lost and the nail lies flat.',
    causes: [
      'Early iron deficiency anaemia',
      'Occupational — prolonged contact with water, detergents and solvents',
      'A normal finding in some infants and in some families',
    ],
    pearl:
      'Platonychia is the reason a student says "the nails look normal" and the examiner says "look again from the side". It is the step before koilonychia, and naming it is what separates a good general examination from a recited one.',
    image: {
      search: ['platonychia flat nails', 'flat nail plate', 'nail flattening iron deficiency'],
      titleMustContain: ['platonychia'],
    },
  },
  {
    id: 'leukonychia',
    name: 'Leukonychia',
    group: 'Nails',
    definition:
      'White discolouration of the nail. Diffuse (true leukonychia) reflects the nail plate; apparent leukonychia — Terry nails, Muehrcke lines — blanches with pressure because it is the nail BED.',
    whereToLook:
      'All twenty nails, with and without pressure on the nail plate. If the whiteness disappears when you press, it is in the bed.',
    causes: [
      'Hypoalbuminaemia — chronic liver disease, nephrotic syndrome (Terry nails, Muehrcke lines)',
      'Trauma to the matrix — the commonest cause of the ordinary white spots',
      'Chronic kidney disease (half-and-half nails)',
      'Arsenic poisoning (Mees lines — these do NOT blanch)',
    ],
    pearl:
      'Muehrcke lines blanch and move with the nail bed; Mees lines do not blanch and grow OUT with the nail. One is albumin, the other is arsenic, and the pressure test tells them apart at the bedside.',
    image: {
      search: ['leukonychia white nails', 'terry nails liver', 'muehrcke lines nails'],
      titleMustContain: ['leukonychia', 'leuconychia', 'terry nail', 'muehrcke', 'mees'],
    },
  },
  {
    id: 'splinter-haemorrhages',
    name: 'Splinter haemorrhages',
    group: 'Nails',
    definition:
      'Linear, reddish-brown haemorrhages running longitudinally under the nail plate, in the direction of nail growth.',
    whereToLook:
      'All nail beds, in good light. Note whether they are distal (usually trauma) or proximal (more likely embolic).',
    causes: [
      'Trauma — by far the commonest, especially in manual workers',
      'Infective endocarditis',
      'Vasculitis, SLE, antiphospholipid syndrome',
      'Trichinosis, severe rheumatoid arthritis',
    ],
    pearl:
      'In a febrile patient with a murmur, splinters belong to the endocarditis case and you should go straight on to look for Osler nodes, Janeway lesions, Roth spots and clubbing.',
    image: {
      search: ['splinter hemorrhage nail', 'splinter haemorrhages endocarditis', 'subungual splinter hemorrhage'],
      titleMustContain: ['splinter'],
    },
  },
  {
    id: 'onycholysis',
    name: 'Onycholysis',
    group: 'Nails',
    definition:
      'Painless separation of the nail plate from the nail bed, starting distally and spreading proximally, leaving a white or discoloured area.',
    whereToLook:
      'The free edge of each nail; the separated part looks opaque-white against the pink adherent bed.',
    causes: [
      'Psoriasis — with pitting and oil-drop discolouration',
      'Thyrotoxicosis (Plummer nails)',
      'Fungal infection, trauma, photo-onycholysis from tetracyclines',
    ],
    pearl:
      'Onycholysis with a fine tremor, warm moist palms and a goitre is the thyrotoxicosis short case starting at the hand — the examination of a thyroid patient begins before you reach the neck.',
    image: {
      search: ['onycholysis nail separation', 'psoriatic nail onycholysis', 'plummer nail thyrotoxicosis'],
      titleMustContain: ['onycholysis'],
    },
  },

  // ─────────────────────────────── Hands ───────────────────────────────
  {
    id: 'palmar-erythema',
    name: 'Palmar erythema',
    group: 'Hands',
    definition:
      'Symmetrical reddening of the thenar and hypothenar eminences, sparing the centre of the palm, that blanches on pressure.',
    whereToLook: 'Both palms together, in daylight, with the fingers extended.',
    causes: [
      'Chronic liver disease — the classic',
      'Pregnancy and oral contraceptives (hyperoestrogenaemia)',
      'Thyrotoxicosis, rheumatoid arthritis, polycythaemia',
      'A normal familial finding in some people',
    ],
    pearl:
      'It belongs to a set: look on from palmar erythema to spider naevi in the SVC territory, gynaecomastia, loss of axillary hair, Dupuytren contracture and asterixis before you ever touch the abdomen.',
    image: {
      search: ['palmar erythema liver', 'liver palms erythema', 'palmar erythema hands'],
      titleMustContain: ['palmar erythema', 'liver palm'],
    },
  },
  {
    id: 'asterixis',
    name: 'Asterixis (flapping tremor)',
    group: 'Hands',
    definition:
      'A coarse, irregular, non-rhythmic lapse of posture at the wrist — brief loss of tone followed by a jerky correction. It is a negative myoclonus, not a tremor.',
    whereToLook:
      'Arms outstretched, elbows straight, wrists dorsiflexed, fingers spread, held for at least 30 seconds with the eyes closed.',
    causes: [
      'Hepatic encephalopathy',
      'Uraemia (renal failure)',
      'Carbon dioxide retention — type 2 respiratory failure',
      'Severe cardiac failure, hypokalaemia, some drugs (phenytoin)',
    ],
    pearl:
      'Hold the position for a full half minute. Asterixis is intermittent, and the commonest reason a student reports it absent is that they gave up after five seconds.',
    image: {
      search: ['asterixis flapping tremor', 'hepatic encephalopathy asterixis hands', 'flapping tremor wrist'],
      titleMustContain: ['asterixis', 'flapping tremor'],
    },
  },
  {
    id: 'dupuytren',
    name: 'Dupuytren contracture',
    group: 'Hands',
    definition:
      'Painless, progressive fibrosis and shortening of the palmar aponeurosis, drawing the ring and little fingers into fixed flexion at the MCP and PIP joints.',
    whereToLook:
      'Palpate the palm over the ring finger ray for a nodule or a cord, then ask the patient to lay the hand flat on a table — the tabletop test is positive when the palm will not go flat.',
    causes: [
      'Idiopathic and familial (Northern European descent)',
      'Alcoholic liver disease',
      'Diabetes mellitus, epilepsy and phenytoin',
      'Manual vibration exposure, HIV',
    ],
    pearl:
      'It is the aponeurosis, not the tendon: the finger cannot be passively straightened and the skin is puckered and tethered, which is what distinguishes it from a trigger finger.',
    image: {
      search: ['dupuytren contracture hand', 'dupuytren palmar fascia', 'dupuytren disease fingers'],
      titleMustContain: ['dupuytren'],
    },
  },

  // ───────────────────── Face, eyes and mouth ─────────────────────
  {
    id: 'koplik-and-oral',
    name: 'Oral cavity and tongue',
    group: 'Face, eyes and mouth',
    definition:
      'The mouth carries several general signs at once — pallor and icterus on the undersurface of the tongue, central cyanosis on its dorsum, hydration, dental hygiene, and the state of the gums.',
    whereToLook:
      'With a torch and a spatula: lips, buccal mucosa, gums, teeth, tongue (dorsum, undersurface, papillae), hard and soft palate, tonsils and posterior pharyngeal wall.',
    causes: [
      'Atrophic glossitis (smooth, depapillated) — iron, B12 or folate deficiency',
      'Angular stomatitis and cheilosis — iron and riboflavin deficiency',
      'Bleeding gums and fetor hepaticus — chronic liver disease',
      'Poor dental hygiene and periodontitis — a risk factor for aspiration pneumonia and lung abscess',
      'Oral thrush — immunosuppression, inhaled steroids, HIV',
    ],
    pearl:
      'Look at the undersurface of the tongue for icterus and the dorsum for cyanosis. They are two different surfaces answering two different questions, and students routinely look at only one.',
    image: {
      search: ['atrophic glossitis tongue', 'angular stomatitis cheilosis', 'oral examination tongue'],
      titleMustContain: ['atrophic glossitis', 'angular stomatitis', 'cheilitis', 'cheilosis'],
    },
  },
  {
    id: 'facies',
    name: 'Facies',
    group: 'Face, eyes and mouth',
    definition:
      'The overall appearance of the face, which in a number of conditions is diagnostic from the end of the bed.',
    whereToLook:
      'Before you touch the patient. Expression, symmetry, puffiness, hair distribution, eyes and eyelids.',
    causes: [
      'Moon facies, puffy, mask-like with loss of the outer third of the eyebrows — hypothyroidism (myxoedema)',
      'Staring, anxious, lid retraction and exophthalmos — thyrotoxicosis',
      'Mitral facies — malar flush over a dusky background in mitral stenosis',
      'Cushingoid — moon face, plethora, acne, hirsutism',
      'Parkinsonian — expressionless, unblinking, seborrhoeic',
      'Leonine facies — lepromatous leprosy',
    ],
    pearl:
      'Madarosis — loss of the lateral third of the eyebrow — belongs to both hypothyroidism and leprosy, and the rest of the face tells you which.',
    image: {
      search: ['myxedema facies hypothyroidism', 'moon facies cushing', 'mitral facies malar flush'],
      titleMustContain: ['myxedema', 'myxoedema', 'cushingoid', 'moon face', 'facies'],
    },
  },

  // ───────────────────── Nutrition and build ─────────────────────
  {
    id: 'build-nourishment',
    name: 'Build and nourishment',
    group: 'Nutrition and build',
    definition:
      'Build is the skeletal frame — ectomorphic, mesomorphic or endomorphic. Nourishment is the soft tissue on it, judged by muscle bulk, subcutaneous fat and BMI.',
    whereToLook:
      'Temporalis and the small muscles of the hand for wasting; the mid-arm circumference; skin turgor over the sternum; then height, weight and BMI.',
    grading:
      'BMI (kg/m²): under 18.5 underweight, 18.5–22.9 normal for Indian populations, 23–24.9 overweight, 25 and above obese. Cachexia is weight loss with wasting and anorexia, and it is a finding in its own right.',
    pearl:
      'Temporal wasting is the earliest visible marker of significant weight loss, and it is on the face you are already looking at during the facies.',
    image: {
      search: ['temporal wasting cachexia', 'muscle wasting malnutrition', 'cachexia clinical'],
      titleMustContain: ['cachexia', 'marasmus', 'kwashiorkor', 'muscle wasting'],
    },
  },
  {
    id: 'jvp',
    name: 'Jugular venous pressure',
    group: 'Neck and nodes',
    definition:
      'The vertical height of the internal jugular venous column above the sternal angle, which is an indirect measure of right atrial pressure.',
    whereToLook:
      'Patient reclined at 45°, head turned slightly away, neck muscles relaxed, in tangential light. Use the INTERNAL jugular between the two heads of sternocleidomastoid, never the external.',
    grading:
      'Normal is up to 3 cm above the sternal angle (about 8 cmH₂O from the right atrium). It is venous and not arterial if it has two waves per cycle, varies with respiration and posture, is obliterable by finger pressure, and is non-palpable.',
    causes: [
      'Raised: right heart failure, tricuspid regurgitation, constrictive pericarditis, cardiac tamponade, fluid overload, SVC obstruction',
      'Raised with absent pulsation — SVC obstruction',
      'Kussmaul sign (rises on inspiration) — constrictive pericarditis, restrictive cardiomyopathy',
    ],
    pearl:
      'Hepatojugular reflux: press firmly over the right hypochondrium for 15 seconds. A sustained rise of more than 3 cm that persists while you press is positive and points at the right ventricle.',
    image: {
      search: ['jugular venous pressure examination', 'raised JVP neck', 'jugular venous distension'],
      titleMustContain: ['jugular venous', 'jvp', 'jugular vein disten'],
    },
  },
];

/** All sign groups in the order the general examination is actually performed. */
export const SIGN_GROUP_ORDER: SignGroup[] = [
  'PICCLE',
  'Nails',
  'Hands',
  'Face, eyes and mouth',
  'Neck and nodes',
  'Nutrition and build',
  'Vitals',
];

export function signsByGroup(group: SignGroup): ExamSign[] {
  return EXAM_SIGNS.filter(s => s.group === group);
}

export function findSign(id: string): ExamSign | undefined {
  return EXAM_SIGNS.find(s => s.id === id);
}

/**
 * The six headings of PICCLE, in the order every proforma in this repo recites
 * them: Pallor, Icterus, Cyanosis, Clubbing, Lymphadenopathy,
 * Edema. Cyanosis is split into central and peripheral here because they are
 * different findings with different causes, so this list names the central one
 * and the peripheral sits beside it in the same group.
 */
export const PICCLE_ORDER = [
  'pallor',
  'icterus',
  'cyanosis-central',
  'clubbing',
  'lymphadenopathy',
  'edema',
] as const;
