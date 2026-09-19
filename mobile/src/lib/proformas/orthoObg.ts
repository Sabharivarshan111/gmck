/**
 * Orthopaedics and Obstetrics & Gynaecology case proformas.
 *
 * `ortho_fracture_proforma` here is the GENERAL trauma framework — mechanism,
 * look-feel-move, the neurovascular step, how to describe a fracture on a film.
 * It is written from the standard sequence (Apley, Maheshwari, Ebnezar) because
 * the owner's own sheets do not cover it.
 *
 * His sheets HAVE since been read, though the first attempt could not: they are
 * a CamScanner scan with no text layer, and OCR is unavailable in this sandbox.
 * The pages were extracted as JPEGs from the PDF's DCTDecode streams and read
 * as images instead. The six cases they contain — CTEV, chronic osteomyelitis,
 * non-union, peripheral nerve injuries, osteoarthritis and malunion — are in
 * `orthopaedics.ts`, built from the sheets, and the transcription is in
 * `.agents/sources/proformas/ortho_casesheets-1.txt`.
 *
 * The obstetrics and gynaecology sheets did extract, and those cases follow
 * them.
 *
 * One rule specific to orthopaedics and kept throughout: LOOK, FEEL, MOVE, then
 * measure, then special tests, then neurovascular status, then the joint above
 * and the joint below. The neurovascular examination is not an afterthought at
 * the end of the list — it is the one finding that turns a fracture into an
 * emergency, and every case here states it as a named step rather than
 * leaving it to be remembered.
 */
import type { ClinicalProforma } from '@/lib/clinicalProformas';

export const ORTHO_OBG_PROFORMAS: ClinicalProforma[] = [
  {
    id: 'ortho_fracture_proforma',
    title: 'Fracture Assessment — the Injured Limb',
    system: 'Orthopaedics',
    department: 'Orthopaedics / Trauma',
    summary:
      'The trauma case. Covers the mechanism of injury and what each mechanism predicts, the look-feel-move sequence, the neurovascular examination that decides urgency, compartment syndrome, and the description of a fracture that a radiologist would accept.',
    examPearl:
      'DOCUMENT THE DISTAL NEUROVASCULAR STATUS BEFORE AND AFTER every manipulation, splint and plaster, and write the time. A nerve palsy discovered after reduction that was never checked before it is indefensible, and it is the commonest reason these cases end badly.',
    diagramPath: '/diagrams/orthopaedics/supracondylar_fracture_gartland_anatomy.jpg',
    diagramTitle: 'Supracondylar fracture: Gartland types and the anatomy at risk',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Mechanism of injury — which predicts the fracture',
            description: 'Asked in detail, because the pattern follows the force.',
            checklist: [
              'WHEN did it happen — date and TIME, which decides the window for reduction and for an open fracture',
              'WHERE and HOW: fall from a height and from what height, road traffic accident and the speed and the vehicles, direct blow, twisting injury, assault',
              'DIRECT versus INDIRECT force. Direct gives a transverse or comminuted fracture at the point of impact; indirect twisting gives a spiral fracture away from it',
              'Position of the limb at the moment of impact — a fall on the outstretched hand with the elbow extended gives a supracondylar or a Colles fracture depending on age',
              'Was there LOSS OF CONSCIOUSNESS, vomiting, ear or nose bleed — head injury screening in any significant trauma',
              'Could the patient WEIGHT-BEAR or use the limb afterwards, and can they now',
              'Deformity noticed immediately; any wound over the fracture; bleeding and how much',
              'First aid given, splinting, any manipulation attempted by a traditional bone-setter — asked directly, and common',
              'TETANUS immunisation status',
              'ATLS: airway, breathing, circulation and other injuries FIRST. A limb is never the priority over an airway',
            ],
            clinicalSign:
              'A trivial mechanism producing a fracture is a PATHOLOGICAL fracture until proved otherwise — metastasis, myeloma, osteoporosis, a simple bone cyst. Always ask what the patient was actually doing.',
          },
          {
            label: 'Pain, swelling and the rest',
            description: 'Short, and then the general history.',
            checklist: [
              'Pain: site, severity, character, aggravated by movement and relieved by rest and splinting',
              'Swelling, deformity, abnormal mobility, inability to use the limb',
              'NUMBNESS, TINGLING, weakness distal to the injury — asked explicitly and recorded',
              'Pain out of proportion, and pain on passive stretch — the compartment syndrome question',
              'Past: previous fracture at the same site, previous surgery, osteoporosis, malignancy, epilepsy, steroid use',
              'Comorbidity for anaesthetic fitness: diabetes, hypertension, cardiac and respiratory disease',
              'Occupation, handedness, and functional demands — which affect the choice of fixation',
              'Smoking — it delays union, and saying so is part of the counselling',
            ],
          },
        ],
      },
      {
        title: '2. Examination — look, feel, move',
        items: [
          {
            label: 'Look',
            description: 'Both limbs exposed and compared, with the patient positioned comfortably.',
            checklist: [
              'ATTITUDE of the limb — the classic postures: externally rotated and shortened in a fractured neck of femur, dinner-fork deformity in a Colles fracture',
              'SWELLING, bruising and its extent; ecchymosis may track distally and appear away from the fracture',
              'DEFORMITY: angulation, rotation, shortening',
              'WOUND — its site, size, contamination and relation to the fracture. This is what makes the fracture OPEN, and it changes everything',
              'Skin: blisters (fracture blisters), tenting, threatened skin over a sharp fragment, colour',
              'Muscle wasting (in an old injury); scars of previous surgery',
              'Position of any splint or plaster already applied',
            ],
          },
          {
            label: 'Feel and move',
            description: 'Gently, and with the face watched rather than the hand.',
            checklist: [
              'LOCAL TEMPERATURE and TENDERNESS — localise the point of maximum tenderness with one finger',
              'Bony irregularity, gap, step; abnormal mobility and crepitus — elicited ONLY if the diagnosis is in doubt, and never repeatedly. It is painful and it displaces the fracture further',
              'MOVEMENTS: active first, then passive, and both compared with the normal side. Record range in degrees',
              'The JOINT ABOVE and the JOINT BELOW — examined in every case, because the second injury is the one that gets missed',
              'MEASUREMENTS: true and apparent limb length, segmental lengths, and circumference at a fixed distance from a bony landmark',
              'True length from the anterior superior iliac spine to the medial malleolus; apparent length from the xiphisternum or umbilicus',
              'Squaring of the pelvis before measuring — without it every number is wrong',
            ],
          },
          {
            label: 'Distal neurovascular status — the step that decides urgency',
            description: 'Named as its own step, before and after every intervention, with the time recorded.',
            checklist: [
              'PULSES distal to the injury — named, compared, and graded',
              'Capillary refill, colour and temperature of the digits',
              'SENSATION in each peripheral nerve territory distal to the injury — tested individually and named',
              'MOTOR function of each nerve: radial (wrist and finger extension), median (thumb opposition, OK sign for the anterior interosseous), ulnar (finger abduction), and in the lower limb common peroneal (dorsiflexion) and tibial',
              'COMPARTMENT SYNDROME: the earliest and most reliable sign is PAIN ON PASSIVE STRETCH of the muscles in the compartment, plus pain out of proportion to the injury and escalating analgesic requirement',
              'Pulselessness, pallor, paralysis and paraesthesia are LATE — waiting for them is waiting too long',
              'A tense, swollen, tender compartment; measure compartment pressure if in doubt',
              'Record all of this in the notes with a time, BEFORE and AFTER reduction and plaster',
            ],
            clinicalSign:
              'A supracondylar fracture in a child with an absent radial pulse and pain on passive extension of the fingers is an emergency — the brachial artery and the median nerve lie directly behind the distal fragment.',
          },
        ],
      },
      {
        title: '3. Describing the Fracture, Investigations and Management',
        items: [
          {
            label: 'How to describe a fracture on a radiograph',
            description: 'A fixed sequence, and examiners listen for all of it.',
            checklist: [
              'Patient details, side, and the views — at least TWO views at right angles, and the joint above and below included',
              'WHICH BONE and WHICH PART: proximal, middle or distal third; diaphysis, metaphysis, epiphysis',
              'PATTERN: transverse, oblique, spiral, comminuted, segmental, greenstick, buckle, avulsion, impacted',
              'DISPLACEMENT of the DISTAL fragment relative to the proximal — always described that way round: translation (and by how much, as a percentage of the bone width), angulation (direction of the apex, in degrees), rotation, shortening, distraction',
              'INTRA-ARTICULAR extension and any step in the joint surface',
              'Open or closed — which is a CLINICAL finding, not a radiological one',
              'Associated dislocation; the state of the bone (osteopenia, a lytic lesion, periosteal reaction)',
              'In a child: the physis, and the SALTER-HARRIS type',
            ],
          },
          {
            label: 'Investigations and management',
            description: 'Reduce, hold, rehabilitate — and treat the patient, not the radiograph.',
            checklist: [
              'Radiographs in two planes including the joints above and below; CT for intra-articular and complex fractures; MRI for occult fractures and soft tissue',
              'Haemogram, blood grouping and cross-match, blood sugar, renal function, ECG and chest X-ray for fitness',
              'OPEN FRACTURE: Gustilo-Anderson grading, tetanus prophylaxis, intravenous ANTIBIOTICS WITHIN THE FIRST HOUR, a sterile saline-soaked dressing, splintage, and urgent DEBRIDEMENT in theatre — debridement is the operation, and lavage is not a substitute for it',
              'The three principles: REDUCE, HOLD, REHABILITATE',
              'Reduction: closed by traction and manipulation under anaesthesia, or open',
              'Hold: plaster cast or slab, traction, external fixator, or internal fixation (K-wires, plate and screws, intramedullary nail)',
              'Rehabilitation from day one: elevate the limb, move every joint that is not immobilised, isometric exercises for the muscles inside the cast',
              'PLASTER INSTRUCTIONS to the patient — elevate, move the fingers or toes, and return immediately for increasing pain, numbness, or a cold blue limb. This is a safety net and it must be given in words the patient will repeat back',
              'Complications: early — vascular and nerve injury, compartment syndrome, infection, fat embolism; late — delayed union, non-union, malunion, avascular necrosis, joint stiffness, myositis ossificans, complex regional pain syndrome, osteoarthritis',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How do you diagnose compartment syndrome, and what do you do?',
        answer:
          'Clinically, and EARLY. The earliest and most reliable sign is PAIN ON PASSIVE STRETCH of the muscles within the compartment, together with pain out of proportion to the injury and a steadily escalating analgesic requirement; the compartment is tense, swollen and tender. Paraesthesia follows. The five Ps beloved of textbooks — pain, pallor, paraesthesia, paralysis and pulselessness — are LATE, and the pulse is typically PRESENT throughout, because compartment pressure rarely exceeds systolic pressure. So a palpable pulse never excludes it. Where doubt exists, measure the compartment pressure: an absolute pressure above 30 mmHg, or a delta pressure (diastolic minus compartment pressure) below 30 mmHg, is diagnostic. Management is to split the plaster down to skin along its entire length and remove all circumferential dressings, elevate the limb to the level of the heart but NOT above it, and perform urgent FASCIOTOMY of all compartments. Untreated it produces Volkmann ischaemic contracture.',
        examinerTip:
          'Say "the pulse is present" before they ask. It is the single commonest reason the diagnosis is missed.',
      },
      {
        question: 'Classify open fractures and say what the classification is for.',
        answer:
          'GUSTILO-ANDERSON. Type I: a clean wound under 1 cm, minimal soft tissue damage, simple fracture pattern. Type II: a wound between 1 and 10 cm with moderate soft tissue damage and no extensive stripping. Type III: a wound over 10 cm, extensive soft tissue damage, or any high-energy injury, segmental fracture, farmyard contamination, gunshot or vascular injury regardless of wound size. Type III is subdivided: IIIA has adequate soft tissue cover despite extensive laceration; IIIB has periosteal stripping with exposed bone requiring a FLAP for cover; IIIC has an ARTERIAL INJURY requiring repair, irrespective of the size of the wound. The classification matters because it predicts the infection rate and dictates the antibiotic, the need for plastic surgery input and the timing of cover — and because grading is done definitively in theatre at debridement, not in the casualty department, since the wound is always bigger than it looks.',
        examinerTip:
          'IIIC is defined by the artery, not the wound. That is the discriminator examiners test.',
      },
    ],
  },

  {
    id: 'obstetrics_anc_proforma',
    title: 'Obstetric Case — the Antenatal Long Case',
    system: 'Obstetrics & Gynaecology',
    department: 'Obstetrics',
    summary:
      'The obstetric long case. Covers dating and the EDD, the obstetric formula, the full antenatal history by trimester, per-abdomen examination with the fundal height and the four Leopold manoeuvres, and the high-risk factors that decide where and how she delivers.',
    examPearl:
      'Get the DATES right before anything else — LMP, cycle regularity, contraception before conception, and the earliest scan. Every subsequent number, from fundal height to the decision to induce, is measured against the gestational age, and a wrong EDD makes the whole case wrong.',
    diagramPath: '/diagrams/obstetrics/modified_who_partograph_action_line.jpg',
    diagramTitle: 'Modified WHO partograph with alert and action lines',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Particulars, dates and the obstetric formula',
            description: 'The arithmetic of the case, done first.',
            checklist: [
              'Name, age, address, occupation, husband’s occupation, socioeconomic status, education',
              'MARRIED LIFE in years; CONSANGUINITY',
              'OBSTETRIC FORMULA: Gravida, Para, Living, Abortions — stated in full',
              'LMP, and whether she is SURE of it; regularity and length of her cycles',
              'CONTRACEPTION in the three months before conception — hormonal contraception makes the LMP unreliable for dating',
              'EDD by NAEGELE RULE: LMP + 9 months + 7 days, corrected for a cycle longer or shorter than 28 days',
              'GESTATIONAL AGE today, in completed weeks and days',
              'EARLIEST ULTRASOUND and the gestational age it gave — a first-trimester crown-rump length overrides the dates when they disagree by more than a week',
              'Whether the pregnancy was planned; whether it was confirmed by a urine pregnancy test and when',
            ],
          },
          {
            label: 'History of the present pregnancy, by trimester',
            description: 'Exactly as the antenatal sheets set it out.',
            checklist: [
              'FIRST TRIMESTER: nausea and vomiting and whether it needed admission; bleeding or leaking per vaginum; fever with rash; drug intake; radiation exposure; folic acid; booking visit and the booking investigations',
              'SECOND TRIMESTER: QUICKENING and the month it was felt (18–20 weeks in a primigravida, 16–18 in a multigravida); anomaly scan; iron and calcium started; TETANUS TOXOID doses; weight gain; blood pressure at each visit',
              'THIRD TRIMESTER: fetal movements and any decrease; headache, blurred vision, epigastric pain, swelling of the face and hands — the PRE-ECLAMPSIA screen; bleeding per vaginum; leaking; contractions; breathlessness; growth scans',
              'Number of antenatal visits and where; whether booked or unbooked',
              'Any admission during this pregnancy and why',
            ],
            clinicalSign:
              'Headache, blurring of vision and epigastric pain in the third trimester are the imminent-eclampsia symptoms and must be asked of every antenatal case, not only of the hypertensive ones.',
          },
          {
            label: 'Past obstetric, menstrual, medical and family history',
            description: 'Each previous pregnancy in order, with its outcome.',
            checklist: [
              'EACH previous pregnancy: year, antenatal course, gestation at delivery, place, mode of delivery and indication, birth weight, sex, and the child’s present health',
              'Previous CAESAREAN — indication, type of uterine incision, post-operative course, and the interval since. This decides the mode of delivery now',
              'Previous abortion: spontaneous or induced, gestation, whether evacuation was needed',
              'Previous stillbirth, neonatal death, congenital anomaly, or a baby needing NICU care',
              'Previous pre-eclampsia, gestational diabetes, postpartum haemorrhage, or retained placenta — each recurs',
              'MENSTRUAL: age at menarche, cycle, duration, flow, dysmenorrhoea',
              'MEDICAL: anaemia, hypertension, DIABETES, thyroid disease, cardiac disease, epilepsy, tuberculosis, asthma, jaundice; HIV, hepatitis B and VDRL status',
              'Surgical history; drug history; allergies; blood transfusion',
              'FAMILY: hypertension, diabetes, twins, congenital anomaly, consanguinity',
              'Personal: diet (vegetarian or mixed), appetite, bowel and bladder, sleep, tobacco and alcohol',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'General and systemic',
            description: 'On top of PICCLE, the obstetric-specific general findings.',
            checklist: [
              'Height and weight, and the total weight gain in this pregnancy (about 10–12 kg is expected)',
              'PALLOR — assessed carefully; anaemia is the commonest medical complication of pregnancy in India',
              'BLOOD PRESSURE — in the sitting or left lateral position, the right arm, with an appropriate cuff. Never supine at term',
              'PEDAL OEDEMA — and whether it extends above the ankle, or involves the face and hands, which is abnormal',
              'Thyroid; breasts and nipples; spine',
              'CVS and RS fully — a systolic flow murmur is physiological in pregnancy, a diastolic murmur never is',
            ],
          },
          {
            label: 'Per abdomen — inspection and the four manoeuvres',
            description: 'Bladder emptied, patient supine with the knees slightly flexed, examiner on the right.',
            checklist: [
              'INSPECTION: shape of the uterus (ovoid, transverse), fundal height by eye, linea nigra, striae gravidarum (albicantes versus rubrae), scars — and a previous caesarean scar is looked for specifically',
              'Flattening or fullness of the flanks; visible fetal movements',
              'FUNDAL HEIGHT: in weeks against the landmarks (12 weeks at the symphysis, 20–22 at the umbilicus, 36 at the xiphisternum, dropping again at term with engagement), and the SYMPHYSIO-FUNDAL HEIGHT in centimetres, which from 24 weeks should roughly equal the gestational age in weeks',
              'ABDOMINAL GIRTH at the umbilicus',
              'LEOPOLD MANOEUVRES, in order: 1 FUNDAL GRIP — what occupies the fundus (broad soft irregular breech, versus hard round ballottable head). 2 LATERAL or UMBILICAL GRIP — which side the back is on (smooth resistant) and which the limbs (irregular, knobbly). 3 PAWLIK GRIP — the presenting part above the symphysis, and whether it is ballottable. 4 PELVIC GRIP — facing the feet, both hands towards the pelvis: the degree of ENGAGEMENT and the attitude',
              'PRESENTATION, POSITION, ATTITUDE and ENGAGEMENT stated explicitly',
              'ENGAGEMENT in FIFTHS palpable above the brim — the standard notation',
              'Estimated fetal weight',
              'AUSCULTATION of the fetal heart: rate, rhythm, and the site of maximum intensity, which confirms the position',
              'Uterine contractions if in labour: frequency, duration and intensity',
            ],
            clinicalSign:
              'A symphysio-fundal height more than 3 cm less than the gestational age is growth restriction or oligohydramnios until an ultrasound says otherwise; more than 3 cm greater is a multiple pregnancy, polyhydramnios, a big baby, or wrong dates.',
          },
        ],
      },
      {
        title: '3. Diagnosis, Investigations and Plan',
        items: [
          {
            label: 'The obstetric diagnosis',
            description: 'A single sentence containing eight things.',
            checklist: [
              'Format: "A __ year old G_P_L_A_ at __ weeks and __ days of gestation, with a single live intrauterine fetus in cephalic presentation, [engaged / not engaged], with [the high-risk factor], and no clinical evidence of __"',
              'Then the high-risk factors listed, and the plan for delivery: place, mode, timing, and who needs to be present',
            ],
          },
          {
            label: 'Investigations and management',
            description: 'The routine antenatal profile, then the ones the case needs.',
            checklist: [
              'Haemoglobin, complete blood count, BLOOD GROUP AND Rh (and the husband’s if she is Rh negative), urine routine and culture',
              'Blood sugar and the GDM screen — DIPSI 75 g non-fasting with a 2-hour value of 140 mg/dL or above being diagnostic in India',
              'HIV, HBsAg, VDRL; thyroid function',
              'ULTRASOUND: dating in the first trimester, anomaly scan at 18–20 weeks, growth and liquor in the third trimester, with Doppler where growth restriction is suspected',
              'Non-stress test; biophysical profile where indicated',
              'Iron and folic acid; calcium; tetanus toxoid; nutrition and rest advice',
              'ANTI-D at 28 weeks and within 72 hours of delivery for an Rh-negative mother with an Rh-positive baby',
              'ANTENATAL CORTICOSTEROIDS between 24 and 34 weeks where preterm delivery is anticipated',
              'DANGER SIGNS taught to the mother: bleeding, leaking, decreased fetal movements, severe headache, blurred vision, epigastric pain, fever, convulsions — and told to come immediately',
              'Birth preparedness: place of delivery, transport, blood donor, and the money',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How do you calculate the expected date of delivery, and when do you not use the LMP?',
        answer:
          'NAEGELE RULE: to the first day of the last menstrual period add nine months and seven days (equivalently, subtract three months and add seven days and one year). It assumes a regular 28-day cycle with ovulation on day 14, so it is CORRECTED for cycle length — add the days by which the cycle exceeds 28, subtract those by which it falls short. The LMP is NOT used when she is unsure of her dates, when her cycles are irregular, when she conceived while on hormonal contraception or within three months of stopping it, when she conceived during lactational amenorrhoea, or when there was first-trimester bleeding mistaken for a period. In all of those the earliest ULTRASOUND dates the pregnancy: a first-trimester crown-rump length is accurate to about ±5 days and overrides the LMP when they differ by more than 7 days; a second-trimester scan is accurate to about ±10–14 days and overrides by more than 10.',
        examinerTip:
          'Give the cycle-length correction unprompted. It is what separates knowing the rule from reciting it.',
      },
      {
        question: 'Name the Leopold manoeuvres and what each one tells you.',
        answer:
          'FIRST, the FUNDAL GRIP: both hands on the fundus facing the patient’s head, to determine what occupies the fundus — a broad, soft, irregular mass that moves with the trunk is the breech, a hard, round, smooth, ballottable mass is the head. This establishes the LIE and the presentation. SECOND, the LATERAL or UMBILICAL GRIP: the hands on either side of the uterus, one steadying while the other palpates, to find the back (a smooth, continuous, resistant plane) and the limbs (irregular, knobbly, shifting) — this gives the POSITION. THIRD, PAWLIK GRIP: the spread thumb and fingers of the right hand grasp the lower pole above the symphysis to confirm the presenting part and whether it is still ballottable and therefore unengaged. FOURTH, the PELVIC GRIP: the examiner turns to FACE THE PATIENT’S FEET and runs both hands down the sides of the uterus into the pelvis, to determine the degree of ENGAGEMENT and the attitude of the head — whether flexed or extended — by which side the cephalic prominence is felt on.',
        examinerTip:
          'The fourth manoeuvre is the only one done facing the feet. Examiners watch for candidates who forget to turn round.',
      },
    ],
  },

  {
    id: 'gynaecology_proforma',
    title: 'Gynaecology Case — Abnormal Uterine Bleeding and the Pelvic Mass',
    system: 'Obstetrics & Gynaecology',
    department: 'Gynaecology',
    summary:
      'The gynaecology long case. Covers the menstrual history in the detail that makes it diagnostic, the PALM-COEIN classification, the bimanual examination, and the fibroid uterus versus ovarian mass distinction that the case usually turns on.',
    examPearl:
      'Quantify the bleeding rather than accepting "heavy" — number of pads per day, whether they are soaked through, clots and their size, flooding, and whether it interferes with daily life. A haemoglobin that does not match the history means the history has not been taken properly.',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Menstrual history — the core of the case',
            description: 'Past and present, because the change is the diagnosis.',
            checklist: [
              'Age at MENARCHE',
              'PREVIOUS cycle: interval, duration, flow, regularity — established as the baseline',
              'PRESENT cycle: interval, duration, flow, and since when it changed',
              'QUANTIFY: number of pads per day, whether fully soaked, whether changed at night, CLOTS and their size, FLOODING, and whether she has to stay at home',
              'DYSMENORRHOEA: primary or secondary, congestive (before the period, in adenomyosis and endometriosis) or spastic (with the flow)',
              'INTERMENSTRUAL bleeding, POSTCOITAL bleeding — postcoital bleeding is cervical carcinoma until a speculum says otherwise',
              'POSTMENOPAUSAL bleeding — endometrial carcinoma until proved otherwise, in every single case',
              'LMP, and whether this period was normal; date of the last normal period',
              'Premenstrual symptoms; mid-cycle pain',
            ],
            clinicalSign:
              'Postmenopausal bleeding and postcoital bleeding are the two complaints that are malignancy until excluded. Neither is ever managed on the phone.',
          },
          {
            label: 'The rest of the history',
            description: 'Obstetric, contraceptive, medical and family.',
            checklist: [
              'Presenting complaint: bleeding, pain, MASS felt per abdomen, discharge, infertility, prolapse, urinary or bowel symptoms',
              'MASS: when noticed, rate of growth, pain, pressure symptoms on the bladder and rectum',
              'White discharge: amount, colour, odour, itching, relation to the cycle',
              'OBSTETRIC: G P L A, each pregnancy and its outcome, mode of delivery, birth weights, any instrumental delivery or third-degree tear',
              'INFERTILITY: primary or secondary, duration, treatment taken',
              'CONTRACEPTION: method, duration, and whether a COPPER T is in situ — an IUCD is a common and correctable cause of heavy bleeding',
              'MARITAL history and coital history where relevant',
              'Medical: anaemia, thyroid disease, BLEEDING DISORDER (easy bruising, bleeding gums, heavy bleeding since menarche — which suggests von Willebrand disease), diabetes, hypertension, tuberculosis',
              'Drugs: anticoagulants, hormones, tamoxifen',
              'Surgical: previous pelvic or abdominal surgery',
              'FAMILY: breast, ovarian, endometrial or colonic malignancy — the Lynch and BRCA question',
              'Cervical screening history',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'General and abdominal',
            description: 'Beyond PICCLE, aimed at anaemia and at the mass.',
            checklist: [
              'Pallor — often marked and often underestimated; height, weight and BMI; hirsutism and acne (PCOS); acanthosis nigricans',
              'Thyroid; breasts; supraclavicular nodes',
              'ABDOMEN: distension, visible mass, scars, striae, dilated veins, umbilicus',
              'MASS: site, size (in weeks of gestation for a uterine mass, or in centimetres), shape, surface, margins, consistency, tenderness, mobility',
              'CAN YOU GET BELOW IT? A pelvic mass arising from the pelvis — you cannot get below it, and the lower border is not palpable',
              'Does it move with the cervix? — the key manoeuvre, done bimanually',
              'Free fluid: shifting dullness, fluid thrill — which with an ovarian mass raises malignancy',
              'Hernial orifices; inguinal nodes',
            ],
          },
          {
            label: 'Pelvic examination — with consent, a chaperone and an empty bladder',
            description: 'Inspection, speculum, bimanual, and per rectum where indicated.',
            checklist: [
              'CONSENT, a CHAPERONE, privacy, an empty bladder, and the lithotomy position — stated aloud before touching the patient',
              'INSPECTION of the vulva: development, lesions, discharge, atrophy, warts, ulcers; the perineum and any old tear',
              'Ask her to strain — prolapse, cystocele, rectocele, stress incontinence',
              'SPECULUM (Cusco or Sims): the vagina, and the CERVIX — size, shape, os (parous or nulliparous), erosion, growth, ulcer, bleeding on touch, discharge, an IUCD thread',
              'Take a PAP SMEAR where indicated; swabs for discharge',
              'BIMANUAL: the CERVIX — consistency, direction, mobility, and CERVICAL MOTION TENDERNESS (excitation, in pelvic inflammatory disease and ectopic pregnancy)',
              'The UTERUS — size (in weeks), shape, position (anteverted or retroverted), surface, consistency, mobility and tenderness',
              'The FORNICES — any mass: its size, consistency, mobility, tenderness, and whether it is SEPARATE from the uterus',
              'WHETHER THE MASS MOVES WITH THE CERVIX — a fibroid does; an ovarian mass usually does not. This is the single discriminating manoeuvre',
              'A GROOVE between the mass and the uterus points at an ovarian origin',
              'PER RECTAL examination — parametrium, uterosacral ligaments, rectal mucosa, and the pouch of Douglas for nodularity (endometriosis) or deposits',
            ],
            clinicalSign:
              'A mass that moves with the cervix and has no groove between it and the uterus is uterine — a fibroid. One that is separate, with a groove, and does not transmit cervical movement is adnexal.',
          },
        ],
      },
      {
        title: '3. Diagnosis, Investigations and Management',
        items: [
          {
            label: 'PALM-COEIN — the classification of abnormal uterine bleeding',
            description: 'FIGO, and the structural half is separated from the non-structural half.',
            checklist: [
              'PALM — STRUCTURAL causes, which imaging and histology find: Polyp, Adenomyosis, Leiomyoma (submucosal and other), Malignancy and hyperplasia',
              'COEIN — NON-STRUCTURAL: Coagulopathy, Ovulatory dysfunction, Endometrial, Iatrogenic, Not otherwise classified',
              'COAGULOPATHY is asked about specifically: heavy bleeding since menarche, bleeding after dental extraction or childbirth, easy bruising, family history — about 13% of women with heavy menstrual bleeding have an underlying bleeding disorder, most often von Willebrand disease',
              'IATROGENIC includes the copper IUCD, anticoagulants, and hormonal contraception',
            ],
          },
          {
            label: 'Investigations and management',
            description: 'Rule out pregnancy and malignancy first, every time.',
            checklist: [
              'URINE PREGNANCY TEST — in every woman of reproductive age with abnormal bleeding, before anything else',
              'Haemoglobin and complete blood count; ferritin; thyroid function; coagulation screen where suggested',
              'TRANSVAGINAL ULTRASOUND — endometrial thickness, fibroids and their FIGO type, adnexal masses, ovarian morphology',
              'ENDOMETRIAL SAMPLING — mandatory for postmenopausal bleeding, and for any woman over 40 (or younger with risk factors: obesity, PCOS, diabetes, tamoxifen, unopposed oestrogen, family history)',
              'Saline infusion sonography or HYSTEROSCOPY for submucosal lesions and polyps',
              'Pap smear and colposcopy for cervical lesions; CA-125 with an ovarian mass, interpreted with the RMI',
              'MEDICAL: tranexamic acid and NSAIDs for the bleeding itself; the LEVONORGESTREL INTRAUTERINE SYSTEM, which is first-line for heavy menstrual bleeding without a structural cause; combined oral contraceptives; progestogens; GnRH analogues before surgery',
              'Correct the anaemia — oral or intravenous iron, transfusion if severe',
              'SURGICAL: hysteroscopic polypectomy or myomectomy; endometrial ablation where family is complete; myomectomy where fertility is desired; HYSTERECTOMY as the definitive option, after counselling and after malignancy has been excluded',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How do you distinguish a fibroid uterus from an ovarian mass clinically?',
        answer:
          'On bimanual examination the decisive finding is whether the mass MOVES WITH THE CERVIX. A fibroid is part of the uterus: movement imparted to the mass is transmitted to the cervix and vice versa, there is NO GROOVE between the mass and the uterus, the uterus itself is not separately palpable, and the mass is usually firm and may be irregular or bosselated. An ovarian mass is separate: cervical movement is not transmitted to it, a GROOVE can be felt between the mass and the uterus, the uterus is palpable separately and is of normal size, and the mass is more often cystic and lies in the fornix. Supporting features: fibroids cause menorrhagia and pressure symptoms and regress after menopause; an ovarian mass more often causes no menstrual change, and ascites, a fixed mass, bilaterality, nodularity in the pouch of Douglas or rapid growth suggest malignancy. Ultrasound settles it.',
        examinerTip:
          'The groove and the transmitted movement. Say both; either alone can mislead in a large mass.',
      },
      {
        question: 'A 56-year-old woman has one episode of postmenopausal bleeding. What is your approach?',
        answer:
          'Postmenopausal bleeding is ENDOMETRIAL CARCINOMA until proved otherwise, and a single episode is investigated exactly as repeated bleeding is — about 10% of women presenting with it have a malignancy. The approach is: a full history including hormone therapy, tamoxifen, obesity, diabetes, nulliparity, late menopause and a family history of endometrial, breast, ovarian or colonic cancer; general and abdominal examination; and a pelvic examination with a SPECULUM, because the commonest benign causes — atrophic vaginitis, a cervical polyp, a cervical growth — are seen rather than felt. Then TRANSVAGINAL ULTRASOUND to measure the ENDOMETRIAL THICKNESS: 4 mm or less makes carcinoma very unlikely, and above 4 mm mandates ENDOMETRIAL SAMPLING by Pipelle, or hysteroscopy with directed biopsy and dilatation and curettage where sampling fails or bleeding recurs. A Pap smear is taken but never used to exclude endometrial disease, since it is a cervical test.',
        examinerTip:
          'The 4 mm cut-off and "a Pap smear does not exclude endometrial cancer" are the two marks in this question.',
      },
    ],
  },
];
