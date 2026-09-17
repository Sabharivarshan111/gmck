/**
 * The rest of the general survey — everything the case sheets write as one
 * word and an examiner asks ten questions about.
 *
 * PICCLE is six signs. A real general examination is PICCLE plus the vitals,
 * plus the JVP, plus built and nourishment, plus level of consciousness, plus
 * a head-to-toe that the sheets compress into "Thyroid – Normal. Breasts –
 * Normal. Spine – Normal." Those three words are three examinations, and this
 * module is what is behind them.
 *
 * Same shape as `generalExamination.ts` so one renderer draws both.
 */

import type { ClinicalSign } from './generalExamination';

export const GENERAL_SURVEY: ClinicalSign[] = [
  // ───────────────────────────────────────────────── CONSCIOUSNESS ────────
  {
    id: 'consciousness',
    letter: '',
    name: 'Consciousness, Orientation & Coma',
    summary: 'The first line of every case sheet — "conscious, cooperative, oriented" — is three separate tests and a 15-point scale.',
    figure: 'none',
    examinerTrap:
      'The Glasgow Coma Scale has a floor of 3, not 0. A dead patient scores 3. Quoting "GCS 0" is the fastest way to lose a viva, and the second fastest is giving a total without the breakdown: always say E, V and M separately, because E2V2M4 = 8 and E1V1M6 = 8 mean entirely different things.',
    mnemonics: [
      {
        word: 'AEIOU TIPS',
        answers: 'the causes of coma / altered sensorium',
        letters: [
          { letter: 'A', stands: 'Alcohol', detail: 'Intoxication, and also withdrawal with delirium tremens and Wernicke encephalopathy' },
          { letter: 'E', stands: 'Epilepsy, Electrolytes, Encephalopathy', detail: 'Post-ictal state, status epilepticus; hypo/hypernatraemia, hypercalcaemia; hepatic and uraemic encephalopathy' },
          { letter: 'I', stands: 'Insulin', detail: 'Hypoglycaemia — check a capillary glucose in EVERY unconscious patient before anything else; also DKA and HHS' },
          { letter: 'O', stands: 'Oxygen, Opiates, Overdose', detail: 'Hypoxia, hypercapnia, carbon monoxide; opiate and sedative poisoning; organophosphate' },
          { letter: 'U', stands: 'Uraemia', detail: 'And other metabolic causes — hypothyroid (myxoedema coma), Addisonian crisis' },
          { letter: 'T', stands: 'Trauma, Temperature', detail: 'Extradural, subdural, cerebral contusion, diffuse axonal injury; hypothermia and heat stroke' },
          { letter: 'I', stands: 'Infection', detail: 'Meningitis, encephalitis, cerebral malaria, cerebral abscess, sepsis, enteric encephalopathy' },
          { letter: 'P', stands: 'Psychiatric, Poisoning', detail: 'Psychogenic unresponsiveness (a diagnosis of exclusion); any poison' },
          { letter: 'S', stands: 'Stroke, Shock, Space-occupying lesion', detail: 'Intracerebral or subarachnoid haemorrhage, infarction, venous sinus thrombosis; tumour' },
        ],
        caveat:
          'It is a checklist of causes, not a sequence of actions. The sequence is fixed and different: airway, breathing, circulation, then capillary GLUCOSE, then pupils and fundus, then the list.',
      },
    ],
    blocks: [
      {
        heading: 'The three things that opening sentence asserts',
        bullets: [
          'CONSCIOUS — awake, eyes open or opening to stimulus. Formalised by the GCS.',
          'COOPERATIVE — able and willing to follow the examination. A confused or agitated patient is conscious but not cooperative, and the distinction changes what your examination can claim.',
          'ORIENTED — to TIME (day, date, month, year, roughly what time of day), PLACE (building, city) and PERSON (own name, who the relatives are). Disorientation to time goes first, then place, then person; disorientation to person alone with time and place intact suggests a non-organic cause.',
        ],
      },
      {
        heading: 'Glasgow Coma Scale — score each of the three separately',
        table: {
          columns: ['Score', 'Eye opening (E4)', 'Verbal response (V5)', 'Motor response (M6)'],
          rows: [
            ['6', '—', '—', 'Obeys commands'],
            ['5', '—', 'Oriented', 'Localises to pain'],
            ['4', 'Spontaneous', 'Confused conversation', 'Withdraws from pain (normal flexion)'],
            ['3', 'To speech', 'Inappropriate words', 'Abnormal flexion — decorticate'],
            ['2', 'To pain', 'Incomprehensible sounds', 'Extension — decerebrate'],
            ['1', 'None', 'None', 'None'],
          ],
        },
      },
      {
        heading: 'Interpreting the total',
        bullets: [
          '13–15 — mild head injury.',
          '9–12 — moderate.',
          '8 or less — severe. GCS ≤8 is the conventional threshold for intubation: "GCS 8, intubate."',
          'Minimum 3, maximum 15.',
          'If the patient is intubated, the verbal score is recorded as 1T and the total is written with a T suffix — you cannot score speech in a patient who has a tube through the cords.',
          'In children under 5 use the PAEDIATRIC GCS, where the verbal scale is replaced by: 5 smiles/coos appropriately, 4 cries but consolable, 3 persistently irritable, 2 restless/agitated, 1 none.',
        ],
      },
      {
        heading: 'Beyond the GCS — what else to record in an unconscious patient',
        bullets: [
          'Pupils: size, equality, reaction. Pinpoint = pontine lesion or opiates/organophosphate; a fixed dilated pupil = third nerve compression from uncal herniation; mid-position fixed = midbrain.',
          'Fundus: papilloedema (raised intracranial pressure — and a contraindication to lumbar puncture), subhyaloid haemorrhage (subarachnoid haemorrhage).',
          'Neck stiffness, Kernig and Brudzinski signs — meningitis or subarachnoid haemorrhage. Absent in deep coma even when meningitis is present.',
          'Breathing pattern: Cheyne-Stokes (bihemispheric or metabolic), central neurogenic hyperventilation (midbrain), apneustic (pons), ataxic/Biot (medulla — pre-terminal), Kussmaul (metabolic acidosis).',
          'Posture: decorticate (flexion — lesion above the red nucleus) versus decerebrate (extension — brainstem, worse).',
          'Doll\'s eye (oculocephalic) reflex — only if the cervical spine is cleared.',
          'Smell the breath: ketones, alcohol, fetor hepaticus, uraemic fetor, organophosphate.',
        ],
      },
    ],
  },

  // ──────────────────────────────────────── BUILT & NOURISHMENT ───────────
  {
    id: 'built-nourishment',
    letter: '',
    name: 'Built, Nourishment & Nutritional Assessment',
    summary: '"Moderately built and nourished" is two different measurements — skeletal frame and muscle/fat mass.',
    figure: 'none',
    examinerTrap:
      'Built and nourishment are not synonyms and are not interchangeable. BUILT is the skeletal framework — height relative to the population, span, limb proportion — and it cannot change once the epiphyses have fused. NOURISHMENT is soft tissue — muscle bulk and subcutaneous fat — and it changes week to week. A tall thin cachectic man is "well built, poorly nourished", and saying "poorly built" of him is wrong.',
    blocks: [
      {
        heading: 'Built — the skeletal frame',
        bullets: [
          'Height, and whether it matches the population and the family.',
          'Arm span versus height. Normally within 5 cm of each other; span exceeding height by more than 5 cm suggests Marfan syndrome or eunuchoid proportions (hypogonadism, delayed epiphyseal fusion).',
          'Upper segment : lower segment ratio. Lower segment is pubic symphysis to floor. Normal in an adult is about 0.9–1.0; at birth about 1.7. A HIGH ratio suggests short limbs — achondroplasia, untreated hypothyroidism, rickets. A LOW ratio suggests long limbs — Marfan, hypogonadism.',
          'Symmetry, deformity, kyphoscoliosis, amputation.',
        ],
      },
      {
        heading: 'Nourishment — the soft tissue',
        bullets: [
          'Muscle bulk — temporalis (the first to waste and the easiest to see), deltoid, thenar and hypothenar eminences, interossei (guttering between the metacarpals), quadriceps.',
          'Subcutaneous fat — the buccal pad of fat, the triceps skinfold, the fat over the lower ribs.',
          'Weight, height and BMI.',
          'Mid-upper arm circumference (MUAC) — measured at the midpoint between acromion and olecranon. In a child 1–5 years, MUAC <11.5 cm is severe acute malnutrition, 11.5–12.5 cm moderate. In an adult, <23 cm suggests undernutrition.',
          'Skin, hair and nails — see the vitamin-deficiency signs below.',
          'Oedema — because kwashiorkor and hypoalbuminaemia make a malnourished patient look heavier than they are.',
        ],
      },
      {
        heading: 'BMI and the Asian cut-offs',
        body:
          'BMI = weight (kg) ÷ height (m)². The WHO international cut-offs under-call risk in South Asians, who develop insulin resistance and visceral adiposity at a lower BMI, so India uses revised thresholds. Quote the Asian ones on an Indian ward.',
        table: {
          columns: ['Category', 'WHO (international)', 'Asian / Indian'],
          rows: [
            ['Underweight', 'below 18.5', 'below 18.5'],
            ['Normal', '18.5 – 24.9', '18.0 – 22.9'],
            ['Overweight / at risk', '25.0 – 29.9', '23.0 – 24.9'],
            ['Obese I', '30.0 – 34.9', '25.0 – 29.9'],
            ['Obese II', '35.0 – 39.9', '30.0 and above'],
            ['Obese III', '40.0 and above', '—'],
          ],
        },
      },
      {
        heading: 'Waist circumference and waist-hip ratio',
        bullets: [
          'Waist measured at the midpoint between the lowest rib and the iliac crest, at the end of a normal expiration.',
          'Indian cut-offs for central obesity: men ≥90 cm, women ≥80 cm. (International: 102 cm and 88 cm.)',
          'Waist-hip ratio abnormal above 0.90 in men and 0.85 in women.',
          'Central obesity is a criterion in the metabolic syndrome, and it predicts cardiovascular risk better than BMI in South Asians.',
        ],
      },
      {
        heading: 'Vitamin and micronutrient deficiency signs to look for',
        bullets: [
          'Vitamin A — night blindness, conjunctival xerosis, Bitot spots (triangular foamy patches on the temporal bulbar conjunctiva), keratomalacia, follicular hyperkeratosis.',
          'Vitamin B1 (thiamine) — dry beri-beri (peripheral neuropathy), wet beri-beri (high-output cardiac failure with oedema), Wernicke encephalopathy (ophthalmoplegia, ataxia, confusion).',
          'Vitamin B2 (riboflavin) — angular stomatitis, cheilosis, magenta tongue, scrotal/vulval dermatitis.',
          'Vitamin B3 (niacin) — pellagra: the four Ds — dermatitis (Casal necklace, photosensitive), diarrhoea, dementia, death.',
          'Vitamin B12 / folate — glossitis (beefy red, smooth), knuckle hyperpigmentation, subacute combined degeneration of the cord.',
          'Vitamin C — scurvy: perifollicular haemorrhage, corkscrew hairs, swollen bleeding gums, subperiosteal haemorrhage in children.',
          'Vitamin D — rickets in children (craniotabes, rachitic rosary, Harrison sulcus, widened wrists, bow legs), osteomalacia in adults.',
          'Iodine — goitre, cretinism.',
          'Iron — koilonychia, platonychia, angular stomatitis, glossitis, pica.',
          'Zinc — acrodermatitis enteropathica, poor wound healing, hypogeusia.',
          'Protein-energy — see the paediatric grading (IAP and WHO) under Scoring Systems.',
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────── VITALS ──────
  {
    id: 'vitals',
    letter: '',
    name: 'Vital Signs — Pulse, BP, Respiration, Temperature',
    summary: 'Four numbers; each is a full examination, and the pulse alone has nine characters.',
    figure: 'none',
    examinerTrap:
      'Count the pulse for a FULL minute and count the apex at the same time in anyone with an irregular rhythm — the difference between the two is the pulse deficit, and a pulse deficit is what makes atrial fibrillation atrial fibrillation rather than "irregular pulse". A 15-second count multiplied by four hides it completely.',
    blocks: [
      {
        heading: 'Pulse — the nine characters, in order',
        bullets: [
          '1. RATE — per minute, counted for a full minute. Adult normal 60–100; below 60 bradycardia, above 100 tachycardia.',
          '2. RHYTHM — regular, regularly irregular (second-degree heart block, bigeminy), or irregularly irregular (atrial fibrillation, multiple ectopics).',
          '3. VOLUME — low (shock, aortic stenosis, tachyarrhythmia), normal, or high (aortic regurgitation, thyrotoxicosis, anaemia, fever, AV fistula).',
          '4. CHARACTER (waveform) — best felt at the CAROTID, not the radial. See the table below.',
          '5. CONDITION OF THE VESSEL WALL — roll the emptied radial artery under the finger. A palpable, cord-like, tortuous vessel suggests arteriosclerosis.',
          '6. EQUALITY ON BOTH SIDES — radio-radial delay suggests coarctation of the aorta, subclavian stenosis, aortic dissection or a cervical rib.',
          '7. RADIO-FEMORAL DELAY — palpate radial and femoral together. Delay means coarctation of the aorta, and it is the reason you check the femorals in every hypertensive young patient.',
          '8. ALL PERIPHERAL PULSES — radial, brachial, carotid, femoral, popliteal, posterior tibial, dorsalis pedis. Record present/absent and volume.',
          '9. SPECIAL FEATURES — pulsus paradoxus, pulsus alternans, and the presence of any bruit over the vessel.',
        ],
      },
      {
        heading: 'Pulse character — what each waveform means',
        table: {
          columns: ['Character', 'Feel', 'Cause'],
          rows: [
            ['Anacrotic', 'Slow rising, low volume, with a shoulder on the upstroke', 'Severe aortic stenosis ("pulsus parvus et tardus")'],
            ['Collapsing (water-hammer)', 'Rapid rise, rapid fall; exaggerated by raising the arm', 'Aortic regurgitation, PDA, AV fistula, thyrotoxicosis, severe anaemia'],
            ['Bisferiens', 'Two systolic peaks', 'Mixed aortic stenosis with regurgitation; hypertrophic obstructive cardiomyopathy'],
            ['Dicrotic', 'One systolic and one diastolic peak', 'Typhoid, dilated cardiomyopathy, low cardiac output states'],
            ['Pulsus alternans', 'Alternating strong and weak beats, regular rhythm', 'Severe left ventricular failure'],
            ['Pulsus bigeminus', 'Beats in pairs', 'Ventricular ectopics, digoxin toxicity'],
            ['Pulsus paradoxus', 'Inspiratory fall in systolic BP of more than 10 mmHg', 'Cardiac tamponade, constrictive pericarditis, severe asthma, COPD'],
            ['Pulsus parvus', 'Small volume, normal upstroke', 'Any low cardiac output state'],
          ],
        },
      },
      {
        heading: 'Blood pressure — technique, and the errors that change the number',
        bullets: [
          'Patient seated or supine, rested 5 minutes, arm supported at the level of the HEART, back supported, legs uncrossed, no talking.',
          'Cuff bladder should cover 80% of arm circumference and 40% of arm width. A cuff TOO SMALL over-reads (the classic false hypertension in an obese arm); a cuff too large under-reads.',
          'Palpate the radial while inflating and note where it disappears; inflate 30 mmHg beyond, then deflate at 2–3 mmHg per second. Skipping this misses the AUSCULTATORY GAP and under-reads the systolic in the elderly and in severe hypertension.',
          'Korotkoff phase I = systolic; phase V (disappearance) = diastolic. Use phase IV (muffling) in pregnancy and in high-output states where sounds persist to zero.',
          'Measure in BOTH arms at first visit — a difference over 20/10 mmHg is significant (subclavian stenosis, dissection, coarctation).',
          'Check for POSTURAL HYPOTENSION: supine then 1 and 3 minutes standing. A fall of ≥20 systolic or ≥10 diastolic is positive — autonomic neuropathy, hypovolaemia, drugs.',
          'Check the LEG BP in anyone young and hypertensive. Normally leg systolic exceeds arm by 10–20 mmHg; the reverse is coarctation (Hill sign is the opposite — a leg-arm gradient over 60 mmHg in severe aortic regurgitation).',
          'White coat hypertension and masked hypertension both exist; confirm a new diagnosis with home or ambulatory readings.',
        ],
      },
      {
        heading: 'Blood pressure categories (ACC/AHA 2017; JNC and ESC differ slightly)',
        table: {
          columns: ['Category', 'Systolic', '', 'Diastolic'],
          rows: [
            ['Normal', 'below 120', 'and', 'below 80'],
            ['Elevated', '120–129', 'and', 'below 80'],
            ['Stage 1 hypertension', '130–139', 'or', '80–89'],
            ['Stage 2 hypertension', '140 or above', 'or', '90 or above'],
            ['Hypertensive crisis', 'above 180', 'and/or', 'above 120'],
          ],
        },
      },
      {
        heading: 'Respiratory rate and pattern',
        bullets: [
          'Count for a full minute, WITHOUT telling the patient — a patient who knows you are counting breathes differently. Count while appearing to hold the pulse.',
          'Adult normal 12–20/min. Newborn 30–60, infant 24–40, child 18–30.',
          'Tachypnoea above 20; bradypnoea below 12. Respiratory rate is the earliest and most neglected vital sign in deterioration — it changes before the pulse and long before the blood pressure.',
          'Type: abdomino-thoracic in men and children, thoraco-abdominal in women.',
          'Patterns: Kussmaul (deep sighing — metabolic acidosis, DKA), Cheyne-Stokes (crescendo-decrescendo with apnoea — heart failure, stroke, high altitude), Biot/ataxic (medullary damage), apneustic (pontine).',
          'Look for accessory muscle use, nasal flaring, intercostal and subcostal retraction, tracheal tug, paradoxical abdominal movement.',
        ],
      },
      {
        heading: 'Temperature',
        bullets: [
          'Oral normal 36.4–37.2 °C (97.6–99 °F). Axillary reads about 0.5 °C lower, rectal about 0.5 °C higher; record the site.',
          'Diurnal variation is real: lowest around 04:00, highest around 18:00.',
          'Patterns — CONTINUOUS (fluctuates less than 1 °C, never touching normal: typhoid, lobar pneumonia, urinary tract infection); INTERMITTENT (touches normal each day: malaria, pyaemia, kala-azar); REMITTENT (fluctuates more than 2 °C but never reaches normal: infective endocarditis, most sepsis); RELAPSING/PEL-EBSTEIN (febrile days alternating with afebrile: Hodgkin lymphoma, borreliosis).',
          'Malarial periodicity: quotidian daily, tertian every 48 h (P. vivax, P. ovale, P. falciparum), quartan every 72 h (P. malariae).',
          'Relative bradycardia (a pulse lower than the fever predicts) — typhoid, brucellosis, legionella, drug fever, factitious fever.',
          'Hyperpyrexia above 41.5 °C; hypothermia below 35 °C.',
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── JVP ──────
  {
    id: 'jvp',
    letter: '',
    name: 'Jugular Venous Pressure',
    summary: 'The only place you can see right atrial pressure — internal jugular, 45°, and never the external jugular.',
    figure: 'jvp-waveform',
    examinerTrap:
      'Use the INTERNAL jugular, not the external. The external jugular crosses fascia and is easily kinked, so it can be distended by a local obstruction with a perfectly normal right atrial pressure. And the distinguishing question is always "is it venous or arterial?" — a venous pulsation has two peaks per cycle, is impalpable, is obliterated by light pressure at the root of the neck, falls on inspiration, and moves with posture. An arterial pulsation does none of that.',
    blocks: [
      {
        heading: 'How to examine',
        bullets: [
          'Patient reclined at 45°, head turned slightly AWAY from the side being examined and the neck muscles relaxed — turning it too far tenses the sternomastoid and hides the pulsation.',
          'Good tangential lighting across the neck, not from in front.',
          'Look between the two heads of sternocleidomastoid, for the medial pulsation of the internal jugular.',
          'Measure the VERTICAL height of the top of the pulsation above the sternal angle (angle of Louis). Normal is up to 3 cm; add 5 cm for the distance from the sternal angle to the right atrium, so normal right atrial pressure is up to about 8 cmH₂O.',
          'Confirm it is venous with the five features: two peaks per cycle, impalpable, obliterable, falls with inspiration, varies with posture. Add the HEPATOJUGULAR REFLUX — sustained firm pressure over the right upper quadrant for 15 seconds raises the JVP and, if it stays raised for more than 10 seconds, indicates right ventricular failure.',
        ],
      },
      {
        heading: 'The waveform — three peaks and two troughs',
        table: {
          columns: ['Wave', 'What it is', 'Abnormality'],
          rows: [
            ['a', 'Right atrial contraction (presystolic)', 'Large a: tricuspid stenosis, pulmonary stenosis, pulmonary hypertension. ABSENT a: atrial fibrillation. CANNON a: complete heart block, ventricular tachycardia, junctional rhythm — the atrium contracting against a shut tricuspid valve'],
            ['c', 'Bulging of the tricuspid valve into the atrium at the start of ventricular systole', 'Not usually visible clinically'],
            ['x descent', 'Atrial relaxation and downward pull of the tricuspid ring', 'Exaggerated in cardiac tamponade; absent in tricuspid regurgitation'],
            ['v', 'Atrial filling against a closed tricuspid valve', 'Large "cv" or systolic wave: tricuspid regurgitation (with a pulsatile liver)'],
            ['y descent', 'Tricuspid valve opens, atrium empties', 'SHARP and deep: constrictive pericarditis (Friedreich sign). ABSENT/slow: cardiac tamponade, tricuspid stenosis'],
          ],
        },
      },
      {
        heading: 'Causes of a raised JVP',
        bullets: [
          'Right ventricular failure, from any cause — the commonest.',
          'Tricuspid regurgitation and tricuspid stenosis.',
          'Constrictive pericarditis and cardiac tamponade.',
          'Pulmonary hypertension, cor pulmonale, massive pulmonary embolism.',
          'Fluid overload, over-transfusion, renal failure.',
          'Superior vena cava obstruction — but here the JVP is raised and NON-PULSATILE, with no respiratory variation, plus facial and arm oedema and dilated chest-wall veins. That combination is the diagnosis.',
        ],
      },
      {
        heading: 'Two named signs worth having ready',
        bullets: [
          'KUSSMAUL SIGN — a paradoxical RISE in JVP on inspiration (normally it falls). Constrictive pericarditis, restrictive cardiomyopathy, right ventricular infarction, severe right heart failure. Classically NOT present in uncomplicated cardiac tamponade.',
          'FRIEDREICH SIGN — a sharp, deep y descent in constrictive pericarditis.',
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────── HEAD TO TOE ───────
  {
    id: 'head-to-toe',
    letter: '',
    name: 'Head-to-Toe Survey',
    summary: 'The line the case sheets compress to "Thyroid – Normal. Breasts – Normal. Spine – Normal." — three examinations, not three words.',
    figure: 'none',
    examinerTrap:
      'Examine the thyroid from BEHIND and ask the patient to swallow — a thyroid swelling moves with deglutition because it is bound to the larynx by the pretracheal fascia. A thyroglossal cyst moves on swallowing AND on protruding the tongue; a lymph node moves with neither. Skipping the swallow means you cannot say which of the three it is.',
    blocks: [
      {
        heading: 'Head, hair and face',
        bullets: [
          'Hair — texture, colour, sparseness. Sparse dry brittle hair in hypothyroidism; flag sign and easy pluckability in kwashiorkor; corkscrew hairs in scurvy; alopecia in SLE and after chemotherapy.',
          'Facies — moon facies (Cushing), mask-like (Parkinson), mitral facies (malar flush of mitral stenosis), leonine (lepromatous leprosy), elfin (Williams), adenoid (chronic nasal obstruction), Hippocratic (peritonitis, terminal), myxoedematous, acromegalic, Cushingoid, hemiplegic.',
          'Eyes — pallor and icterus as above, plus xanthelasma (hyperlipidaemia), arcus senilis or juvenilis, Kayser-Fleischer ring (Wilson), exophthalmos and lid lag (Graves), ptosis, subconjunctival haemorrhage, Bitot spot.',
          'Ears and nose — tophi on the pinna (gout), nasal deformity, saddle nose.',
        ],
      },
      {
        heading: 'Mouth, teeth and tongue',
        bullets: [
          'Lips — angular stomatitis and cheilosis (iron, riboflavin, B12), perioral pigmentation (Peutz-Jeghers), herpes labialis, central cyanosis.',
          'Teeth and gums — dental caries and poor hygiene (a source of infective endocarditis and of cervical lymphadenopathy), gum hypertrophy (phenytoin, cyclosporine, leukaemia), bleeding gums (scurvy, leukaemia, thrombocytopenia), a blue lead line, Hutchinson teeth in congenital syphilis.',
          'Tongue — pallor, cyanosis, icterus on the under-surface. Glossitis: atrophic and smooth in B12/iron; beefy red in B12; magenta in riboflavin; strawberry in scarlet fever and Kawasaki; geographic; furred in dehydration and fever; macroglossia in acromegaly, hypothyroidism, amyloidosis; leucoplakia; a fasciculating wasted tongue in motor neurone disease; deviation on protrusion in hypoglossal palsy (towards the lesion).',
          'Buccal mucosa — Koplik spots (measles), candidiasis, oral hairy leucoplakia and Kaposi sarcoma (HIV), pigmentation (Addison).',
          'Throat and tonsils — size, congestion, membrane, exudate.',
        ],
      },
      {
        heading: 'Neck — thyroid, and how to tell one lump from another',
        bullets: [
          'INSPECT from the front with the neck slightly extended: swelling, its position, whether the skin moves over it, dilated veins, scars.',
          'Ask the patient to SWALLOW a sip of water and watch. Thyroid, thyroglossal cyst and anything attached to the pretracheal fascia rise. A lymph node, lipoma or dermoid does not.',
          'Ask the patient to PROTRUDE THE TONGUE. A thyroglossal cyst rises (it retains its tract to the foramen caecum); a thyroid swelling does not.',
          'PALPATE FROM BEHIND, neck slightly flexed to relax the strap muscles. Define: size, shape, surface, consistency, mobility, lower border (can you get below it? if not, retrosternal extension), tenderness, thrill.',
          'Pizzillo method in an obese or short neck — hands behind the head, patient pushes back against them.',
          'Kocher test — gentle lateral lobe compression producing stridor indicates tracheal compression.',
          'Percuss the manubrium for retrosternal dullness. Auscultate for a bruit (thyrotoxicosis, and the sign that the gland is hypervascular before surgery).',
          'Then examine the cervical lymph nodes (levels III, IV, V and VI in particular), the trachea (deviation), the carotid (Berry sign — an absent carotid pulsation with a thyroid swelling suggests malignant infiltration), and look for the signs of thyrotoxicosis or hypothyroidism.',
        ],
      },
      {
        heading: 'Hands — beyond clubbing',
        bullets: [
          'Nails: koilonychia, platonychia, leuconychia, splinter haemorrhages, Beau lines, onycholysis, nail pitting (psoriasis), half-and-half nails (CKD), Terry nails (cirrhosis), Muehrcke lines (hypoalbuminaemia).',
          'Palms: palmar erythema (chronic liver disease, pregnancy, thyrotoxicosis, rheumatoid), Dupuytren contracture (alcohol, diabetes, epilepsy drugs, familial), pallor of the creases, tendon xanthomata.',
          'Tremor: fine at rest with pill-rolling (Parkinson), fine postural (thyrotoxicosis, anxiety, salbutamol), coarse flapping — ASTERIXIS — with the arms outstretched and wrists dorsiflexed for 30 seconds (hepatic encephalopathy, uraemia, CO₂ retention, severe heart failure).',
          'Joints: swelling, deformity, ulnar deviation, swan-neck and boutonnière (rheumatoid), Heberden and Bouchard nodes (osteoarthritis), gouty tophi.',
          'Muscle wasting: thenar (median nerve), hypothenar and interossei (ulnar nerve), generalised small-muscle wasting (T1 root, motor neurone disease).',
        ],
      },
      {
        heading: 'Breast, spine and skin — the three the sheets skip',
        bullets: [
          'BREAST — inspect in four positions (arms by the side, arms raised above the head, hands pressed on hips, leaning forward) looking for asymmetry, a visible lump, skin dimpling, peau d\'orange, nipple retraction or discharge, ulceration. Palpate with the FLAT of the fingers against the chest wall, quadrant by quadrant plus the axillary tail of Spence, then the axilla and supraclavicular fossa. Never pinch the tissue — normal breast pinched between two fingers feels nodular and invents a lump.',
          'SPINE — inspect standing from behind for scoliosis, kyphosis, gibbus (a sharp angular kyphos of spinal tuberculosis), loss of lumbar lordosis, a hairy patch or dimple (spinal dysraphism). Palpate for local tenderness and a step. Check movements in all planes and the gait.',
          'SKIN — pigmentation (generalised in Addison, haemochromatosis, chronic kidney disease), rashes, purpura and petechiae, spider naevi (more than five in the SVC distribution is abnormal — chronic liver disease, pregnancy), striae, scars, sinuses, ulcers, pressure sores, needle marks, surgical and BCG scars.',
        ],
      },
      {
        heading: 'Hydration status',
        bullets: [
          'Skin turgor — pinch over the sternum or the forearm, not the dorsum of an elderly hand where it is falsely lax.',
          'Mucous membranes and the tongue — dry, furred.',
          'Eyes — sunken; in an infant, a depressed anterior fontanelle.',
          'Urine output — the most reliable of all. Under 0.5 mL/kg/h in an adult, under 1 mL/kg/h in a child.',
          'Postural drop in blood pressure, tachycardia, capillary refill over 2 seconds, cold peripheries.',
          'In a child grade it as WHO does: no dehydration, some dehydration (restless/irritable, sunken eyes, drinks eagerly, skin pinch goes back slowly), severe dehydration (lethargic or unconscious, drinks poorly or unable, skin pinch goes back very slowly) — and treat by Plan A, B or C accordingly.',
        ],
      },
    ],
  },
];
