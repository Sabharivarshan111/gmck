/**
 * Source-grounded Obstetrics & Gynaecology disease / high-risk case proformas.
 *
 * These are distilled from the owner's uploaded college case sheets:
 * - CLINICAL CASES (OBSTETRICS) (1).pdf
 * - OG cases.pdf / OG cases-1.pdf
 * - OBSTETRICS AND GYNAECOLOGY CASE PROFORMA.pdf
 *
 * They deliberately keep the cases as EMPTY examination frameworks rather than
 * copying the named patients or their measured values. The source case sequence,
 * discriminating history, examination findings and investigation/management
 * headings are retained. The generic antenatal and gynaecology master frameworks
 * remain in orthoObg.ts; these cases add the condition-specific layer.
 */
import type { ClinicalProforma } from '@/lib/clinicalProformas';

const OBSTETRIC_EXAM = [
  'Consent, empty bladder, adequate exposure and comfortable dorsal/supine position with thighs relaxed',
  'Inspection: shape and distension, flanks, umbilicus, linea nigra, striae, scars, sinuses, dilated veins and hernial orifices',
  'Fundal height and symphysio-fundal height; abdominal girth when relevant',
  'Fundal grip, lateral/umbilical grips, first pelvic grip and second pelvic grip',
  'State lie, presentation, position and engagement explicitly',
  'Auscultate fetal heart sounds: site, rate and rhythm',
  'Complete CVS, respiratory and CNS examination as indicated by the case',
];

export const OBG_HIGH_RISK_PROFORMAS: ClinicalProforma[] = [
  {
    id: 'obg_anaemia_pregnancy_proforma',
    title: 'Anaemia in Pregnancy',
    system: 'Obstetrics & Gynaecology',
    department: 'Obstetrics',
    summary:
      'High-risk antenatal case centred on easy fatigability, the search for blood loss or nutritional/infective causes, pallor and haematinic signs, fetal assessment and the investigation of maternal anaemia.',
    examPearl:
      'Do not stop after writing “pallor present”. The uploaded case sheets specifically look for angular stomatitis, glossitis, cheilosis, platonychia and koilonychia and ask about bleeding, melaena, worms, fever, urinary symptoms and tuberculosis exposure.',
    sections: [
      {
        title: '1. Anaemia-focused history',
        items: [
          {
            label: 'Presenting symptom and functional limitation',
            description: 'Establish when reduced exercise tolerance began and how much ordinary activity now produces symptoms.',
            checklist: [
              'Easy fatigability / lethargy: onset, duration, progression and the work or walking distance that now produces symptoms',
              'Giddiness, headache and blurring of vision',
              'Breathlessness, palpitations, chest pain, orthopnoea or PND',
              'Pica or craving for non-food substances',
              'Fetal movements, pain abdomen, bleeding PV and leaking PV',
            ],
          },
          {
            label: 'Search for the cause',
            description: 'The source sheets actively exclude chronic blood loss, infection and other systemic disease.',
            checklist: [
              'Previous heavy menstrual bleeding before pregnancy',
              'Bleeding PR, melaena, haematemesis, haematuria or other bleeding tendency',
              'Passage of worms in stool',
              'Fever with chills/rigors, burning micturition and recurrent infection',
              'Cough, expectoration, haemoptysis, evening rise of temperature and tuberculosis contact',
              'Jaundice / yellow discolouration of skin, eyes or urine',
              'Previous blood transfusion and previous episodes of anaemia',
              'Iron-folic acid intake and adherence; dietary history and nutritional intake',
            ],
          },
          {
            label: 'Obstetric history',
            description: 'Keep the standard pregnancy chronology around the anaemia problem.',
            checklist: [
              'G-P-L-A index, married life and details of every previous pregnancy',
              'LMP, EDD, gestational age and booking/immunisation status',
              'First trimester: vomiting, urinary symptoms, drugs/radiation and folic-acid intake',
              'Second trimester: quickening, antenatal visits and iron-folic acid supplementation',
              'Third trimester: fetal movements, pain, bleeding/leaking PV and growth assessment',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'General examination for anaemia',
            description: 'Record the usual general survey, then the deficiency signs named in the case sheets.',
            checklist: [
              'Build, nourishment, consciousness/cooperation and orientation',
              'Pallor; icterus, cyanosis, clubbing, lymphadenopathy and pedal oedema',
              'Pulse, BP, respiratory rate, temperature, height, weight and BMI',
              'Angular stomatitis, glossitis and cheilosis',
              'Nails: platonychia and koilonychia',
              'Thyroid, breast and spine examination',
            ],
          },
          {
            label: 'Obstetric and systemic examination',
            description: 'Assess the fetus and look for cardiac or respiratory decompensation.',
            checklist: OBSTETRIC_EXAM,
          },
        ],
      },
      {
        title: '3. Investigations and case formulation',
        items: [
          {
            label: 'Investigations listed in the source cases',
            description: 'Confirm anaemia, look for its type/cause and complete the antenatal profile.',
            checklist: [
              'Complete blood count / haemoglobin',
              'Peripheral smear',
              'Blood grouping and Rh typing',
              'Blood sugar, urea and creatinine',
              'Urine albumin, sugar, pus cells and culture/sensitivity when indicated',
              'Stool examination',
              'Ultrasound for fetal assessment',
              'HIV, HBsAg and VDRL as part of the antenatal work-up',
            ],
          },
          {
            label: 'Presentation sentence',
            description: 'State maternal problem, pregnancy and fetal status in one line.',
            checklist: [
              'Age + obstetric index + gestational age',
              'Severity/type of anaemia where established',
              'Single/multiple live fetus, lie and presentation',
              'Whether in labour and whether there are clinical signs of maternal failure',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Which history points in the uploaded case sheet are specifically used to search for a cause of anaemia?',
        answer:
          'The sheet asks about previous heavy menstrual bleeding, bleeding per rectum or melaena, worms in stool, fever and urinary symptoms, cough/haemoptysis/evening fever or TB contact, jaundice, drug intake, previous transfusion, diet and iron-folic acid intake.',
        examinerTip: 'Answer by causes rather than simply repeating “nutritional anaemia”.',
      },
      {
        question: 'Which peripheral signs does the source case add beyond pallor?',
        answer:
          'Angular stomatitis, glossitis, cheilosis, platonychia and koilonychia are specifically documented, along with the rest of the general examination.',
      },
    ],
  },

  {
    id: 'obg_preeclampsia_proforma',
    title: 'Pregnancy-Induced Hypertension / Pre-eclampsia',
    system: 'Obstetrics & Gynaecology',
    department: 'Obstetrics',
    summary:
      'Antenatal hypertensive case built around oedema, headache and the symptom screen for impending severe disease, followed by BP, oedema, reflex/CNS assessment and fetal examination.',
    examPearl:
      'The source sheets repeatedly ask for headache, blurring of vision, epigastric pain/vomiting and reduced urine output. Ask them together every time; they are not optional add-ons after the blood pressure is found.',
    sections: [
      {
        title: '1. Hypertension-focused history',
        items: [
          {
            label: 'Presenting complaints',
            description: 'Profile oedema and actively seek symptoms of worsening disease.',
            checklist: [
              'Swelling: onset, first site, progression to legs/hands/face, persistence through the day and whether rest/elevation relieves it',
              'Headache and dizziness',
              'Blurring of vision / visual disturbance or syncopal symptoms',
              'Epigastric pain, nausea and vomiting',
              'Reduced urine output, haematuria or other urinary symptoms',
              'Reduced fetal movements',
              'Pain abdomen, bleeding PV and leaking/draining PV',
            ],
          },
          {
            label: 'Exclude competing causes and document pregnancy chronology',
            description: 'The cases explicitly ask for cardiac, renal, hepatic and previous hypertensive clues.',
            checklist: [
              'Chest pain, palpitations, breathlessness and symptoms suggestive of cardiac failure',
              'Jaundice or ascites before 20 weeks',
              'Past or pre-pregnancy hypertension, diabetes, renal disease and thyroid disease',
              'Previous pregnancy hypertension / pre-eclampsia and previous adverse outcomes',
              'First-, second- and third-trimester course, antenatal visits, scans and supplements',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'General and severity assessment',
            description: 'Do not record only the BP.',
            checklist: [
              'Comfort, consciousness, orientation, build and nourishment',
              'Pallor, icterus, cyanosis, clubbing, lymphadenopathy',
              'PEDAL OEDEMA: pitting/non-pitting and extent',
              'Pulse, blood pressure, respiratory rate, temperature and SpO₂ where available',
              'Weight, height and BMI; compare current and pre-pregnancy weight when known',
              'CNS / knee jerks and focal neurological findings',
              'CVS and respiratory examination for failure / pulmonary findings',
            ],
          },
          {
            label: 'Obstetric examination',
            description: 'Maternal assessment is incomplete without fetal assessment.',
            checklist: OBSTETRIC_EXAM,
          },
        ],
      },
      {
        title: '3. Investigation and diagnosis framework',
        items: [
          {
            label: 'Case-sheet investigation headings',
            description: 'Document the maternal and fetal work-up rather than merely writing “PIH profile”.',
            checklist: [
              'Haemoglobin / CBC and platelets',
              'Urine for albumin/protein and routine examination',
              'Blood grouping and Rh typing',
              'Renal and liver function tests',
              'Blood sugar and antenatal infection screening as required',
              'Ultrasound for growth/liquor and fetal assessment; further fetal surveillance as indicated',
            ],
          },
          {
            label: 'Diagnosis sentence',
            description: 'Combine pregnancy, fetus and maternal complication.',
            checklist: [
              'Age + obstetric index + gestational age',
              'Single live fetus, lie, presentation and engagement',
              'Pre-eclampsia / pregnancy-induced hypertension and whether on treatment',
              'Whether in labour and any other medical or obstetric complication',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Which warning symptoms are repeatedly screened for in the source pre-eclampsia cases?',
        answer:
          'Headache, visual disturbance/blurring, epigastric pain with nausea or vomiting, and reduced urine output are repeatedly asked, alongside fetal movement and bleeding/leaking per vagina.',
      },
      {
        question: 'Why is the fetal examination part of the pre-eclampsia case presentation?',
        answer:
          'The case sheets formulate the diagnosis using both the maternal hypertensive disorder and the fetal lie, presentation, fetal heart status and gestational age; the pregnancy cannot be presented as BP alone.',
      },
    ],
  },

  {
    id: 'obg_previous_lscs_proforma',
    title: 'Pregnancy with Previous LSCS',
    system: 'Obstetrics & Gynaecology',
    department: 'Obstetrics',
    summary:
      'Previous-caesarean long case: reconstruct the exact indication and postoperative course of the earlier LSCS, inspect and palpate the scar, assess the current fetus and document the delivery plan.',
    examPearl:
      'The source cases make the previous indication and whether it is recurrent central to the case. “Previous LSCS” is not the diagnosis by itself; say why it was done and whether the current pregnancy recreates that problem.',
    sections: [
      {
        title: '1. History of the previous caesarean',
        items: [
          {
            label: 'Previous pregnancy and operation',
            description: 'Reconstruct the first operation rather than writing only its date.',
            checklist: [
              'Year, gestation and place of the previous delivery',
              'INDICATION for LSCS and whether it was recurrent or non-recurrent',
              'Whether labour/induction was attempted before surgery and why it failed',
              'Baby: sex, birth weight, immediate cry, NICU admission and current health',
              'Maternal postoperative course: fever, wound discharge, transfusion, suture removal and length of hospital stay',
              'Any later scar or abdominal surgery',
              'Inter-pregnancy interval and contraception after the previous birth',
            ],
          },
          {
            label: 'Current pregnancy',
            description: 'Standard trimester chronology plus symptoms relevant to labour and scar.',
            checklist: [
              'LMP, EDD, gestational age, booking and immunisation',
              'Dating/anomaly/growth scans and fetal movements',
              'Pain abdomen / backache and whether it is progressive or associated with contractions',
              'Bleeding PV, leaking PV and vaginal discharge',
              'Symptoms of hypertensive or diabetic complications',
            ],
          },
        ],
      },
      {
        title: '2. Examination of current pregnancy and scar',
        items: [
          {
            label: 'Scar and abdomen',
            description: 'The scar is described, not merely marked “present”.',
            checklist: [
              'Scar site, orientation, length and relation to the pubic symphysis',
              'Healthy healing versus hypertrophy/keloid, sinus or discharge',
              'Scar tenderness',
              'Suprapubic bulge where relevant',
              'Fundal height, SFH and abdominal girth',
              'Lie, presentation, position and engagement by obstetric grips',
              'Fetal heart site, rate and rhythm',
            ],
          },
          {
            label: 'General and systemic examination',
            description: 'Use the shared general examination, then record relevant comorbidity.',
            checklist: [
              'Vitals, pallor, oedema and the rest of the general survey',
              'CVS and respiratory examination',
              'CNS where indicated',
            ],
          },
        ],
      },
      {
        title: '3. Investigations and delivery planning',
        items: [
          {
            label: 'Source-case investigation set',
            description: 'Baseline antenatal work-up plus ultrasound.',
            checklist: [
              'Haemoglobin / PCV',
              'Blood group and Rh typing',
              'Urine albumin; blood sugar',
              'Urea and creatinine; liver/thyroid tests where indicated',
              'HIV, VDRL, HBsAg/HCV screening',
              'Ultrasound to confirm presentation, growth and the current obstetric situation',
            ],
          },
          {
            label: 'Delivery plan',
            description: 'Link the plan to the previous indication and the present findings.',
            checklist: [
              'State whether the previous indication was recurrent or non-recurrent',
              'Record current presentation, engagement, gestational age and scar findings',
              'The uploaded cases include both a planned VBAC example after a healthy scar/non-recurrent indication and a repeat elective LSCS example when current factors favour repeat surgery',
              'Document the institutional delivery plan rather than writing “review”',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'What details of the previous LSCS does the source case insist you obtain?',
        answer:
          'The indication, whether labour/induction was tried, gestation, baby and birth weight, postoperative fever or wound discharge, transfusion, suture removal/hospital stay, and the current health of the child are all recorded.',
      },
      {
        question: 'What scar findings are actually documented in the case sheets?',
        answer:
          'Site/orientation and length of the scar, whether it healed by primary intention, hypertrophy or keloid, sinus/discharge, suprapubic bulge and scar tenderness are documented before the fetal examination.',
      },
    ],
  },

  {
    id: 'obg_rh_negative_proforma',
    title: 'Rh-Negative Pregnancy',
    system: 'Obstetrics & Gynaecology',
    department: 'Obstetrics',
    summary:
      'Antenatal case in which maternal and paternal blood groups, previous pregnancy outcomes and neonatal deaths become part of the core history before fetal assessment.',
    examPearl:
      'The source cases place the husband’s blood group beside the mother’s and make every previous pregnancy outcome explicit. A neonatal death or unexplained previous loss is not background information in an Rh-negative case.',
    sections: [
      {
        title: '1. Rh-focused history',
        items: [
          {
            label: 'Maternal and paternal details',
            description: 'Record blood group information at the start of the case.',
            checklist: [
              'Maternal ABO and Rh type',
              'Husband/partner ABO and Rh type when available',
              'Gravida, para, living, abortions and deaths',
              'LMP, EDD and gestational age',
              'Booking and immunisation status',
            ],
          },
          {
            label: 'Every previous sensitising pregnancy outcome',
            description: 'The source case records the previous baby and death in detail.',
            checklist: [
              'Each prior pregnancy: gestation, place/mode of delivery and neonatal outcome',
              'Stillbirth, neonatal death or unexplained early neonatal jaundice/death',
              'Previous abortion and how it was managed',
              'Previous blood transfusion',
              'Previous advice/treatment related to blood-group incompatibility where documented',
              'Current fetal movements and routine trimester history',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'Maternal and obstetric examination',
            description: 'Follow the same complete antenatal sequence; Rh status does not replace examination.',
            checklist: [
              'General survey and vital signs',
              'Pallor, icterus and oedema',
              ...OBSTETRIC_EXAM,
            ],
          },
        ],
      },
      {
        title: '3. Investigation and presentation',
        items: [
          {
            label: 'Core investigation questions',
            description: 'Keep maternal blood group and fetal surveillance visible in the plan.',
            checklist: [
              'Confirm maternal ABO/Rh typing and review partner blood group where known',
              'Review previous pregnancy/neonatal records if available',
              'Routine antenatal blood and urine profile',
              'Ultrasound and fetal assessment appropriate to the gestation',
              'Document whether this is an Rh-negative pregnancy with or without evidence/history suggesting isoimmunisation rather than writing “Rh negative” alone',
            ],
          },
          {
            label: 'Diagnosis sentence',
            description: 'State maternal Rh status and pregnancy/fetal status together.',
            checklist: [
              'Age + obstetric index + gestational age',
              'Maternal Rh-negative status and partner Rh status if known',
              'Relevant previous fetal/neonatal loss',
              'Single/multiple live fetus, lie, presentation and fetal heart status',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Why is the previous obstetric history especially important in the Rh-negative case?',
        answer:
          'The uploaded case records each earlier pregnancy and specifically highlights a baby who died shortly after birth. Prior fetal or neonatal loss and prior abortion/transfusion are therefore part of the central incompatibility history, not a generic past-history paragraph.',
      },
    ],
  },

  {
    id: 'obg_heart_disease_pregnancy_proforma',
    title: 'Heart Disease in Pregnancy — Rheumatic / Valvular Case',
    system: 'Obstetrics & Gynaecology',
    department: 'Obstetrics',
    summary:
      'Pregnancy complicated by rheumatic/valvular heart disease: functional symptoms, rheumatic history and prophylaxis, full CVS examination and the obstetric assessment in one presentation.',
    examPearl:
      'The uploaded rheumatic case is presented as a cardiac diagnosis inside an obstetric diagnosis: lesion, rhythm, failure/NYHA status and evidence of infective endocarditis are stated alongside gestational age and fetal status.',
    sections: [
      {
        title: '1. Cardiac history in the pregnant patient',
        items: [
          {
            label: 'Symptoms and functional status',
            description: 'Ask the cardiac symptoms explicitly even when the patient reports for routine ANC.',
            checklist: [
              'Breathlessness and the activity that produces it; easy fatigability',
              'Palpitations, chest pain and syncope',
              'Orthopnoea and PND',
              'Cough, expectoration and haemoptysis',
              'Pedal oedema and reduced urine output',
              'Fever or symptoms that could suggest infective endocarditis',
            ],
          },
          {
            label: 'Rheumatic / previous cardiac history',
            description: 'The source case traces the lesion back to childhood rheumatic fever.',
            checklist: [
              'History of fever with migratory/severe joint pains in childhood',
              'Known rheumatic heart disease / valvular lesion and previous echocardiographic diagnosis',
              'Secondary prophylaxis such as scheduled benzathine penicillin when already prescribed',
              'Previous cardiac surgery or intervention',
              'Previous heart-failure admission',
              'Current cardiac medication',
            ],
          },
        ],
      },
      {
        title: '2. Cardiovascular and obstetric examination',
        items: [
          {
            label: 'CVS examination',
            description: 'The source mitral-stenosis example documents the full murmur examination.',
            checklist: [
              'Pulse, BP, JVP, oedema and signs of cardiac failure',
              'Precordial inspection and apical impulse',
              'Parasternal heave and thrills',
              'S1 and S2, with P2 specifically described',
              'Murmur: site, timing, grade and dynamic features; opening snap / presystolic accentuation where present',
              'Respiratory examination for basal crepitations',
            ],
          },
          {
            label: 'Obstetric examination',
            description: 'Complete the pregnancy assessment after the cardiac examination.',
            checklist: OBSTETRIC_EXAM,
          },
        ],
      },
      {
        title: '3. Final formulation',
        items: [
          {
            label: 'Present the heart lesion and pregnancy together',
            description: 'Mirror the structure used in the uploaded case summary.',
            checklist: [
              'Gestational age and obstetric index',
              'Underlying cardiac aetiology and valvular lesion',
              'Rhythm',
              'Functional / NYHA status where established',
              'Evidence or absence of heart failure',
              'Evidence or absence of infective endocarditis',
              'Fetal lie, presentation and fetal heart status',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How is the diagnosis formulated in the uploaded rheumatic-heart-disease pregnancy case?',
        answer:
          'It combines the obstetric status with the cardiac lesion: rheumatic mitral stenosis, rhythm, NYHA/functional status, whether there is infective endocarditis or failure, and then the pregnancy and fetal status.',
      },
    ],
  },

  {
    id: 'obg_twin_pregnancy_proforma',
    title: 'Multiple / Twin Pregnancy',
    system: 'Obstetrics & Gynaecology',
    department: 'Obstetrics',
    summary:
      'Multiple-pregnancy case built around an overdistended uterus, multiple fetal poles/parts and two distinct fetal heart sounds, with the full antenatal history and complication screen.',
    examPearl:
      'The source case does not diagnose twins from fundal height alone: it records multiple fetal parts/poles and two distinct fetal heart sounds heard at separate sites.',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Current pregnancy and complication screen',
            description: 'Standard trimester history with symptoms expected in an overdistended pregnancy.',
            checklist: [
              'LMP, EDD, gestational age, booking and immunisation',
              'Dating/anomaly/growth scans and when multiple pregnancy was identified',
              'Fetal movements',
              'Lower abdominal pain, bleeding PV and leaking/draining PV',
              'Fatigability and breathlessness',
              'Headache / visual symptoms suggesting hypertensive complication',
              'Family history of twins where available',
              'Previous pregnancies and their outcomes',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'Clues to multiple pregnancy',
            description: 'Record the findings in the sequence used by the source case.',
            checklist: [
              'Overdistended / barrel-shaped abdomen and full flanks',
              'Fundal height and SFH greater than expected for dates when present',
              'Multiple fetal parts',
              'Three fetal poles / more than two poles where appreciable',
              'Identify lie and presentation of each fetus as far as clinically possible',
              'Auscultate for TWO DISTINCT fetal heart sounds at separate sites; record each rate and rhythm',
              'Assess pallor and oedema and complete the general examination',
            ],
          },
        ],
      },
      {
        title: '3. Investigation and summary',
        items: [
          {
            label: 'Investigation headings',
            description: 'Confirm plurality and complete the antenatal work-up.',
            checklist: [
              'Haemoglobin, blood group/Rh typing and routine antenatal blood/urine tests',
              'Ultrasound to confirm number of fetuses and current fetal assessment',
              'Document presentation of each fetus and associated liquor/growth findings reported on scan',
            ],
          },
          {
            label: 'Diagnosis sentence',
            description: 'The uploaded case states each fetus rather than merely writing “twins”.',
            checklist: [
              'Age + obstetric index + gestational age',
              'Number of live fetuses',
              'Lie and presentation of each fetus',
              'Fetal heart status',
              'Associated complication such as anaemia or excess liquor when documented',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Which bedside findings in the uploaded case support twin pregnancy?',
        answer:
          'The abdomen is overdistended, multiple fetal parts and three fetal poles are felt, and two distinct fetal heart sounds are heard at separate sites.',
      },
    ],
  },

  {
    id: 'obg_fibroid_aub_proforma',
    title: 'Fibroid Uterus / Abnormal Uterine Bleeding',
    system: 'Obstetrics & Gynaecology',
    department: 'Gynaecology',
    summary:
      'Gynaecology long case for heavy/prolonged menstrual bleeding with a uterine mass, using quantified menstrual history, abdominal/pelvic examination and the source investigation pathway.',
    examPearl:
      'The source case describes the mass in obstetric weeks: a firm, smooth, mobile midline mass corresponding to a gravid-uterus size. Keep that language in the presentation instead of writing only “mass palpable”.',
    sections: [
      {
        title: '1. Bleeding and mass history',
        items: [
          {
            label: 'Quantify the menstrual change',
            description: 'Compare the previous cycle with the present cycle.',
            checklist: [
              'Menarche and previous cycle interval, duration and pads/day',
              'Current frequency, duration and pads/day',
              'Passage of clots and dysmenorrhoea',
              'Duration of heavy/prolonged bleeding',
              'Intermenstrual or postcoital bleeding',
              'Symptoms of anaemia: fatigue, dizziness and reduced effort tolerance',
            ],
          },
          {
            label: 'Mass / pressure and competing causes',
            description: 'The source case actively asks urinary, bowel, endocrine and bleeding-history questions.',
            checklist: [
              'Mass per abdomen or protruding through the introitus: onset and progression',
              'Lower abdominal pain and relation to menstruation',
              'Urinary frequency, retention or difficulty micturating',
              'Difficulty passing stools',
              'White/discharge PV, fever and weight/appetite change',
              'Epistaxis or gum bleeding / bleeding disorder',
              'Symptoms of thyroid dysfunction',
              'OCP / IUCD use and other drug history',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'General, abdomen and pelvic examination',
            description: 'Describe anaemia and then the uterine mass properly.',
            checklist: [
              'Pallor and full general examination; height, weight and BMI',
              'Breast, thyroid and spine',
              'Abdominal inspection: distension, umbilicus, scars, sinuses, veins and visible pulsation',
              'Palpable mass: size in weeks of gravid uterus, site, borders, surface, consistency, tenderness and mobility',
              'Percussion over the mass and bowel sounds',
              'External genital examination',
              'Per-speculum and per-vaginal examination when consented/appropriate; assess transmitted movement/mobility',
            ],
          },
        ],
      },
      {
        title: '3. Investigations and management headings from the case sheet',
        items: [
          {
            label: 'Work-up',
            description: 'The source cases list these explicitly.',
            checklist: [
              'Haemoglobin / PCV, platelets and blood counts',
              'Coagulation / bleeding and clotting assessment where indicated',
              'Thyroid function',
              'Pregnancy test in reproductive-age bleeding',
              'Ultrasound: transabdominal / transvaginal',
              'Pap smear',
              'Endometrial biopsy, including hysteroscopy-guided sampling when indicated',
            ],
          },
          {
            label: 'Treatment categories recorded in the source',
            description: 'Present options according to cause, severity, age and fertility goals rather than as one prescription.',
            checklist: [
              'Correct anaemia and nutritional deficits',
              'Medical control of bleeding: non-hormonal and hormonal options are listed in the source cases',
              'Intrauterine hormonal treatment is listed among medical options',
              'Fibroid-directed surgery includes myomectomy; definitive surgery includes hysterectomy where appropriate',
              'Endometrial ablative procedures are listed for selected abnormal-uterine-bleeding cases',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How is the abdominal mass described in the uploaded fibroid case?',
        answer:
          'It is a firm, smooth, mobile midline mass whose size is expressed as the equivalent of a gravid uterus in weeks; its borders, tenderness and relation to pelvic examination are then documented.',
      },
    ],
  },

  {
    id: 'obg_primary_infertility_pcod_proforma',
    title: 'Primary Infertility with PCOD / Anovulation',
    system: 'Obstetrics & Gynaecology',
    department: 'Gynaecology',
    summary:
      'Infertility case that evaluates the couple, menstrual/anovulatory clues and PCOD features, then separates female and male investigations as the uploaded case does.',
    examPearl:
      'The source sheet investigates BOTH partners. Do not turn an infertility case into a woman-only work-up; semen analysis appears in the same investigation block as ovulation, ovarian reserve and tubal patency.',
    sections: [
      {
        title: '1. Infertility history',
        items: [
          {
            label: 'Define the problem and look for anovulatory clues',
            description: 'Start with duration of regular unprotected intercourse and menstrual pattern.',
            checklist: [
              'Duration of marriage and inability to conceive despite regular unprotected intercourse',
              'Primary versus secondary infertility and any previous pregnancy',
              'Cycle regularity, duration and flow',
              'Weight gain and hirsutism / other PCOD clues',
              'Past contraception',
              'Thyroid symptoms and relevant medical/surgical history',
              'Drug history',
            ],
          },
          {
            label: 'Couple history',
            description: 'The work-up belongs to the couple.',
            checklist: [
              'Coital history and frequency where appropriate',
              'Past genital infection / surgery in either partner',
              'Relevant systemic disease',
              'Male sexual/reproductive history and prior fertility',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'General and gynaecological examination',
            description: 'The uploaded PCOD case records habitus and a complete baseline examination.',
            checklist: [
              'Build/nourishment, pallor, icterus, cyanosis, clubbing, lymphadenopathy and oedema',
              'Height, weight and BMI',
              'Hirsutism / other hyperandrogenic features and weight distribution',
              'Breast and thyroid examination; spine and gait',
              'CVS, RS and CNS baseline examination',
              'Abdominal examination for mass/organomegaly',
              'External genital examination; speculum/PV as consented and indicated',
            ],
          },
        ],
      },
      {
        title: '3. Couple investigation pathway',
        items: [
          {
            label: 'Female investigations listed in the source',
            description: 'Confirm ovulation, ovarian reserve and tubal/pelvic factors.',
            checklist: [
              'Haemoglobin, blood group/typing, glucose and routine renal/liver/thyroid testing',
              'USG abdomen and pelvis',
              'Serum prolactin',
              'Insulin / androgen or testosterone assessment where indicated',
              'Test for ovulation',
              'Test for ovarian reserve',
              'Test for tubal patency',
              'Pap smear as part of gynaecological evaluation where indicated',
            ],
          },
          {
            label: 'Male investigations listed in the source',
            description: 'Do not postpone the male evaluation until every female test is normal.',
            checklist: [
              'Semen analysis',
              'Thyroid / prolactin and gonadal hormone assessment where indicated',
              'Serum testosterone, FSH and LH',
              'Scrotal ultrasound, karyotype or testicular biopsy when clinically indicated in the source pathway',
            ],
          },
          {
            label: 'Management sequence described by the source case',
            description: 'Counselling and lifestyle measures precede escalation.',
            checklist: [
              'Counsel the couple about reproduction and the fertile period',
              'Lifestyle modification is part of the PCOD pathway',
              'Cycle regulation / ovulation-induction pathway with follicular monitoring is described in the source case',
              'Escalate to IUI / assisted reproductive treatment when the initial pathway fails',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'What is the key structural lesson from the uploaded infertility case?',
        answer:
          'Infertility is investigated as a couple: female ovulation, ovarian reserve and tubal assessment are listed alongside semen analysis and male endocrine/scrotal investigations.',
      },
    ],
  },
];
