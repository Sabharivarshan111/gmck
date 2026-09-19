/** Source-derived teaching frameworks. References use PDF page numbers. */
import type { ClinicalProforma } from '@/lib/clinicalProformas';

export const PAEDIATRIC_SYSTEM_PROFORMAS: ClinicalProforma[] = [
  {
    id: 'paed_cns_proforma',
    title: "Paediatric Neurological Examination",
    system: 'Pediatrics',
    department: "Paediatrics",
    summary: "Observe play, posture and spontaneous movement before formal testing. Separate delayed acquisition from loss of skills.",
    examPearl: "Observe play, posture and spontaneous movement before formal testing. Separate delayed acquisition from loss of skills.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Onset and course: acute, episodic, static or progressive; fever, trauma and preceding infection",
              "Altered interaction, consciousness, behaviour, school performance or acquired skills",
              "Witnessed seizure description: onset, duration, awareness, head/eye deviation, movements, recovery and triggers",
              "Weakness by functional task and distribution; fatigability, falls, hand preference and involuntary movement",
              "Headache, vomiting, visual change, hearing, swallowing, voice and facial symptoms",
              "Sensory change, imbalance, gait in light/dark, back pain and bowel/bladder function"
            ]
          }
        ]
      },
      {
        title: "2. Complete background history",
        items: [
          {
            label: "Shared framework",
            description: "Add this background to the focused history; do not assume normal findings.",
            checklist: [
              "Informant, relationship and reliability; age and chronology of complaints",
              "Antenatal illness/exposures, gestation, birth weight, delivery, resuscitation and neonatal admission",
              "Gross motor, fine motor, language and social development; distinguish delay from regression",
              "Immunisation card, feeding observation and 24-hour dietary recall; assess actual intake against age-appropriate needs",
              "Previous illness, admissions, medicines/allergies, family pedigree, consanguinity, schooling and home environment"
            ]
          }
        ]
      },
      {
        title: "3. Bedside examination",
        items: [
          {
            label: "Examine and record",
            description: "Measure findings and document what was actually assessed.",
            checklist: [
              "Assess consciousness, airway and breathing; escalate ongoing seizure or acute deterioration",
              "Plot growth and head circumference; examine skull/fontanelle, spine and neurocutaneous signs",
              "Age-appropriate interaction, cognition/language and cranial nerves: vision, pupils, eye movements, face, hearing, palate and tongue",
              "Compare bulk, posture, tone and movement in all limbs; formal joint power only when cooperation permits",
              "Deep tendon/superficial reflexes, plantar responses and clonus interpreted for age",
              "Coordination, gait and sensory modalities adapted to ability; document limitations",
              "Meningeal signs when appropriate; their absence does not exclude meningitis in infants",
              "Other systems, swallowing, mobility, communication and daily-care needs"
            ]
          }
        ]
      },
      {
        title: "4. Assessment and next steps",
        items: [
          {
            label: "Formulation and investigations",
            description: "Link each investigation to a clinical question and discuss the plan with the supervising team.",
            checklist: [
              "Present age, time course, development, syndrome, likely anatomical level and probable cause",
              "Distinguish central, nerve, neuromuscular-junction and muscle patterns from findings",
              "Prioritise glucose and physiological assessment when acutely unwell; targeted tests thereafter",
              "Imaging, EEG, infection/metabolic work-up selected for the clinical question; assess lumbar-puncture contraindications",
              "Include vision/hearing, feeding, rehabilitation, school participation and caregiver support"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "PAEDIATRIC CASE PROFORMAS.pdf, pages 31–47.",
            checklist: [
              "Teaching and clerking framework; not an automatic diagnosis or prescribing protocol.",
              "Record unassessed findings as not examined; example patient findings are not normal defaults."
            ]
          }
        ]
      }
    ],
    vivaQuestions: [
      {
        question: "Why can adult power grading mislead in infants?",
        answer: "Resistance testing needs cooperation. Observe antigravity movement, symmetry, posture and developmental tasks; state the method and limitations."
      },
      {
        question: "How should the case be presented?",
        answer: "Describe time course and function, then syndrome, likely localisation, cause and complications."
      }
    ]
  },
  {
    id: 'paed_rs_proforma',
    title: "Paediatric Respiratory Examination",
    system: 'Pediatrics',
    department: "Paediatrics",
    summary: "Count breathing while the child is calm. Describe respiratory effort and oxygenation before localisation manoeuvres.",
    examPearl: "Count breathing while the child is calm. Describe respiratory effort and oxygenation before localisation manoeuvres.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Fever, cough and breathing difficulty: onset, sequence, progression and effect on feeding/play",
              "Cough character, night/exercise symptoms, sputum, haemoptysis and post-tussive vomiting",
              "Wheeze, stridor, grunting, apnoea, cyanosis and sudden choking/foreign-body onset",
              "Episodes, interval wellness, seasonal/allergen triggers, atopy and treatment response",
              "TB contact, recurrent infections, aspiration with feeds, smoke/biomass exposure and immunisation",
              "Previous oxygen, ventilation/admissions; inhaler technique, adherence and medicines"
            ]
          }
        ]
      },
      {
        title: "2. Complete background history",
        items: [
          {
            label: "Shared framework",
            description: "Add this background to the focused history; do not assume normal findings.",
            checklist: [
              "Informant, relationship and reliability; age and chronology of complaints",
              "Antenatal illness/exposures, gestation, birth weight, delivery, resuscitation and neonatal admission",
              "Gross motor, fine motor, language and social development; distinguish delay from regression",
              "Immunisation card, feeding observation and 24-hour dietary recall; assess actual intake against age-appropriate needs",
              "Previous illness, admissions, medicines/allergies, family pedigree, consanguinity, schooling and home environment"
            ]
          }
        ]
      },
      {
        title: "3. Bedside examination",
        items: [
          {
            label: "Examine and record",
            description: "Measure findings and document what was actually assessed.",
            checklist: [
              "Observe alertness, ability to feed/speak, hydration and respiratory distress",
              "Temperature, pulse, respiratory rate for a full minute, oxygen saturation and perfusion; use age-appropriate ranges",
              "Retractions, nasal flaring, grunting, head bobbing, stridor and asymmetric movement",
              "Chest shape/scars, trachea and expansion; compare corresponding areas anteriorly, laterally and posteriorly",
              "Percussion, air entry, breath sounds, crackles, wheeze and rub with location",
              "Resonance/fremitus only if a child can cooperate; do not invent adult manoeuvres in infants",
              "ENT, growth, clubbing, nodes, CVS and liver examination"
            ]
          }
        ]
      },
      {
        title: "4. Assessment and next steps",
        items: [
          {
            label: "Formulation and investigations",
            description: "Link each investigation to a clinical question and discuss the plan with the supervising team.",
            checklist: [
              "Present severity, distribution and likely airway/parenchymal/pleural or extrapulmonary process",
              "Urgently escalate apnoea, exhaustion, central cyanosis, severe distress or altered consciousness",
              "Choose imaging, blood tests and microbiology according to severity and cause rather than routinely for every cough",
              "Recurrent wheeze: assess pattern, technique and adherence; age-appropriate lung function when feasible",
              "Document treatment response, feeding/hydration, oxygen needs and follow-up"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "PAEDIATRIC CASE PROFORMAS.pdf, pages 48–59; Paediatrics_proforma.pdf, pages 20–24.",
            checklist: [
              "Teaching and clerking framework; not an automatic diagnosis or prescribing protocol.",
              "Record unassessed findings as not examined; example patient findings are not normal defaults."
            ]
          }
        ]
      }
    ],
    vivaQuestions: [
      {
        question: "Does wheeze establish asthma?",
        answer: "No. Consider age, recurrence, triggers, interval symptoms, response, infection, aspiration and foreign body, especially with sudden asymmetric findings."
      }
    ]
  },
  {
    id: 'paed_cvs_proforma',
    title: "Paediatric Cardiovascular Examination",
    system: 'Pediatrics',
    department: "Paediatrics",
    summary: "In infants feeding is the exercise history: record effort, sweating, pauses and growth.",
    examPearl: "In infants feeding is the exercise history: record effort, sweating, pauses and growth.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Feeding duration, pauses, sweating, breathlessness, weight gain and recurrent respiratory illness",
              "Cyanosis at rest or with crying/exertion; spells, squatting, syncope and exercise tolerance",
              "Older child: pain, palpitations, orthopnoea and oedema",
              "Onset from birth versus later, antenatal findings and neonatal oxygen/admission",
              "Fever, migratory joint pain, involuntary movement, sore throat, known rheumatic disease and prophylaxis",
              "Confirmed structural lesion, echo, procedures, medicines and family sudden death"
            ]
          }
        ]
      },
      {
        title: "2. Complete background history",
        items: [
          {
            label: "Shared framework",
            description: "Add this background to the focused history; do not assume normal findings.",
            checklist: [
              "Informant, relationship and reliability; age and chronology of complaints",
              "Antenatal illness/exposures, gestation, birth weight, delivery, resuscitation and neonatal admission",
              "Gross motor, fine motor, language and social development; distinguish delay from regression",
              "Immunisation card, feeding observation and 24-hour dietary recall; assess actual intake against age-appropriate needs",
              "Previous illness, admissions, medicines/allergies, family pedigree, consanguinity, schooling and home environment"
            ]
          }
        ]
      },
      {
        title: "3. Bedside examination",
        items: [
          {
            label: "Examine and record",
            description: "Measure findings and document what was actually assessed.",
            checklist: [
              "Growth, perfusion, central cyanosis, clubbing, pulse, respiratory rate, saturation and age-appropriate BP",
              "Pulse rate/rhythm/volume, brachial–femoral comparison and limb measurements when indicated",
              "Precordial shape/scars, apex, parasternal impulse and thrills",
              "S1/S2, splitting, added sounds and murmur timing/site/grade/character/radiation",
              "Positional/respiratory changes only when feasible; do not assign a lesion from one sign",
              "Lung findings, liver enlargement, oedema and endocarditis signs when relevant",
              "Other systems and functional limitation"
            ]
          }
        ]
      },
      {
        title: "4. Assessment and next steps",
        items: [
          {
            label: "Formulation and investigations",
            description: "Link each investigation to a clinical question and discuss the plan with the supervising team.",
            checklist: [
              "State cyanotic/acyanotic pattern, suspected lesion, rhythm, failure and pulmonary-hypertension features",
              "Echo defines anatomy/haemodynamics; ECG and chest imaging answer complementary questions",
              "An acutely cyanotic or shocked infant requires urgent assessment before elective clerking",
              "Review growth/feeding support, medicines and prophylaxis records",
              "Plan cardiology follow-up and counselling for the confirmed lesion"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "PAEDIATRIC CASE PROFORMAS.pdf, pages 59–71.",
            checklist: [
              "Teaching and clerking framework; not an automatic diagnosis or prescribing protocol.",
              "Record unassessed findings as not examined; example patient findings are not normal defaults."
            ]
          }
        ]
      }
    ],
    vivaQuestions: [
      {
        question: "Does murmur loudness grade severity?",
        answer: "No. Flow and pressure gradients determine loudness; interpret with oxygenation, pulses, growth, failure signs and echo."
      },
      {
        question: "Why palpate femoral pulses?",
        answer: "Weak or delayed femoral pulses compared with upper limbs can suggest aortic obstruction."
      }
    ]
  },
  {
    id: 'paed_rheumatic_proforma',
    title: "Rheumatic Fever / Rheumatic Heart Disease",
    system: 'Pediatrics',
    department: "Paediatrics",
    summary: "Joint pain alone does not establish rheumatic fever. Document its pattern and the evidence supporting diagnostic criteria.",
    examPearl: "Joint pain alone does not establish rheumatic fever. Document its pattern and the evidence supporting diagnostic criteria.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Fever and joint symptoms: distribution, migration, swelling, duration and treatment response",
              "Preceding sore throat, previous episodes and documented rheumatic fever",
              "Breathlessness, feeding/exercise limitation, palpitations, syncope and oedema",
              "Involuntary movements, handwriting/behaviour change, rash or nodules",
              "Echo findings, admissions, prophylaxis, missed doses and allergy"
            ]
          }
        ]
      },
      {
        title: "2. Complete background history",
        items: [
          {
            label: "Shared framework",
            description: "Add this background to the focused history; do not assume normal findings.",
            checklist: [
              "Informant, relationship and reliability; age and chronology of complaints",
              "Antenatal illness/exposures, gestation, birth weight, delivery, resuscitation and neonatal admission",
              "Gross motor, fine motor, language and social development; distinguish delay from regression",
              "Immunisation card, feeding observation and 24-hour dietary recall; assess actual intake against age-appropriate needs",
              "Previous illness, admissions, medicines/allergies, family pedigree, consanguinity, schooling and home environment"
            ]
          }
        ]
      },
      {
        title: "3. Bedside examination",
        items: [
          {
            label: "Examine and record",
            description: "Measure findings and document what was actually assessed.",
            checklist: [
              "Vitals, perfusion and growth",
              "Joint inflammation and range of motion",
              "Skin, nodules and directed neurological examination for chorea",
              "Apex, parasternal impulse, sounds and full murmur description",
              "Lungs, liver and failure signs; alternative fever sources"
            ]
          }
        ]
      },
      {
        title: "4. Assessment and next steps",
        items: [
          {
            label: "Formulation and investigations",
            description: "Link each investigation to a clinical question and discuss the plan with the supervising team.",
            checklist: [
              "Separate acute inflammatory features from established valve disease",
              "Assess applicable Jones criteria and antecedent streptococcal evidence with the team",
              "ECG, inflammatory markers and echo as indicated; absent murmur does not exclude carditis",
              "Review secondary prophylaxis and adherence with cardiology",
              "Explain recurrence prevention and arrange clinical/echo follow-up"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "Paediatrics_proforma.pdf, pages 1–5.",
            checklist: [
              "Teaching and clerking framework; not an automatic diagnosis or prescribing protocol.",
              "Record unassessed findings as not examined; example patient findings are not normal defaults."
            ]
          }
        ]
      }
    ],
    vivaQuestions: [
      {
        question: "What changes the long-term plan?",
        answer: "Carditis, residual valve disease, recurrence risk and adherence influence follow-up and secondary prophylaxis."
      }
    ]
  },
  {
    id: 'paed_thalassaemia_proforma',
    title: "Thalassaemia / Chronic Haemolytic Anaemia",
    system: 'Pediatrics',
    department: "Paediatrics",
    summary: "Document transfusion burden and chelation as carefully as pallor; complications affect growth, cardiac and endocrine function.",
    examPearl: "Document transfusion burden and chelation as carefully as pallor; complications affect growth, cardiac and endocrine function.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Onset of pallor, jaundice, abdominal enlargement and fatigue",
              "Confirmed haemoglobin diagnosis, family screening and affected siblings",
              "Transfusion start/frequency, last transfusion, reactions and records",
              "Chelation, adherence, adverse effects and monitoring; do not assume iron deficiency",
              "Growth/puberty, bone pain/fractures, cardiac/endocrine symptoms and infection",
              "Splenectomy, vaccination and prophylaxis records if relevant"
            ]
          }
        ]
      },
      {
        title: "2. Complete background history",
        items: [
          {
            label: "Shared framework",
            description: "Add this background to the focused history; do not assume normal findings.",
            checklist: [
              "Informant, relationship and reliability; age and chronology of complaints",
              "Antenatal illness/exposures, gestation, birth weight, delivery, resuscitation and neonatal admission",
              "Gross motor, fine motor, language and social development; distinguish delay from regression",
              "Immunisation card, feeding observation and 24-hour dietary recall; assess actual intake against age-appropriate needs",
              "Previous illness, admissions, medicines/allergies, family pedigree, consanguinity, schooling and home environment"
            ]
          }
        ]
      },
      {
        title: "3. Bedside examination",
        items: [
          {
            label: "Examine and record",
            description: "Measure findings and document what was actually assessed.",
            checklist: [
              "Vitals, pallor, icterus, growth trajectory and puberty when appropriate",
              "Facial/bony changes, pigmentation and treatment access sites",
              "Measured liver/spleen extent, consistency/tenderness and ascites",
              "CVS/RS examination for murmur or failure",
              "Targeted skeletal, endocrine and treatment-complication examination"
            ]
          }
        ]
      },
      {
        title: "4. Assessment and next steps",
        items: [
          {
            label: "Formulation and investigations",
            description: "Link each investigation to a clinical question and discuss the plan with the supervising team.",
            checklist: [
              "Present confirmed type, transfusion dependence, growth and complications",
              "Review CBC, smear and haemoglobin analysis; recent transfusion affects interpretation",
              "Trend iron-burden assessment and specialist organ surveillance",
              "Discuss transfusion/chelation, adherence, school and psychosocial needs with haematology",
              "Appropriate family counselling and screening"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "Paediatrics_proforma.pdf, pages 6–10.",
            checklist: [
              "Teaching and clerking framework; not an automatic diagnosis or prescribing protocol.",
              "Record unassessed findings as not examined; example patient findings are not normal defaults."
            ]
          }
        ]
      }
    ],
    vivaQuestions: [
      {
        question: "Why interpret ferritin as a trend?",
        answer: "Inflammation and liver disease affect it as well as iron burden; interpret serial values with clinical and specialist organ-iron assessment."
      }
    ]
  },
  {
    id: 'paed_hepatomegaly_proforma',
    title: "Hepatomegaly / Hepatosplenomegaly in a Child",
    system: 'Pediatrics',
    department: "Paediatrics",
    summary: "A palpable liver edge alone is insufficient: measure span and describe edge, surface, consistency and tenderness.",
    examPearl: "A palpable liver edge alone is insufficient: measure span and describe edge, surface, consistency and tenderness.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Abdominal enlargement, pain and fever with chronology",
              "Jaundice, dark urine, pale stools, pruritus, bleeding, vomiting and behaviour change",
              "Pallor, transfusions, recurrent infection and growth/development",
              "Oedema, breathlessness and cardiac history",
              "Drug/herbal exposure, contacts, travel and family hepatic/haemolytic disease"
            ]
          }
        ]
      },
      {
        title: "2. Complete background history",
        items: [
          {
            label: "Shared framework",
            description: "Add this background to the focused history; do not assume normal findings.",
            checklist: [
              "Informant, relationship and reliability; age and chronology of complaints",
              "Antenatal illness/exposures, gestation, birth weight, delivery, resuscitation and neonatal admission",
              "Gross motor, fine motor, language and social development; distinguish delay from regression",
              "Immunisation card, feeding observation and 24-hour dietary recall; assess actual intake against age-appropriate needs",
              "Previous illness, admissions, medicines/allergies, family pedigree, consanguinity, schooling and home environment"
            ]
          }
        ]
      },
      {
        title: "3. Bedside examination",
        items: [
          {
            label: "Examine and record",
            description: "Measure findings and document what was actually assessed.",
            checklist: [
              "Vitals, growth, pallor, icterus, nodes, oedema and skin signs",
              "Abdominal contour, veins, scars and gentle systematic palpation",
              "Liver extent/span, edge, surface, consistency, tenderness and pulsatility",
              "Spleen, other masses, ascites and renal findings",
              "CVS/RS and neurological state; portal-hypertension/decompensation signs"
            ]
          }
        ]
      },
      {
        title: "4. Assessment and next steps",
        items: [
          {
            label: "Formulation and investigations",
            description: "Link each investigation to a clinical question and discuss the plan with the supervising team.",
            checklist: [
              "State isolated hepatomegaly or hepatosplenomegaly, course and associated syndrome",
              "CBC/smear, liver profile/synthetic function, renal studies and ultrasound guided by findings",
              "Select infection, haemolysis, metabolic or immune tests from the differential",
              "Escalate encephalopathy, bleeding, severe illness or neonatal cholestasis features",
              "Specialist assessment for persistent unexplained enlargement/growth concerns"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "Paediatrics_proforma.pdf, pages 11–14; PAEDIATRIC CASE PROFORMAS.pdf, pages 1–16.",
            checklist: [
              "Teaching and clerking framework; not an automatic diagnosis or prescribing protocol.",
              "Record unassessed findings as not examined; example patient findings are not normal defaults."
            ]
          }
        ]
      }
    ],
    vivaQuestions: [
      {
        question: "Why describe consistency and tenderness?",
        answer: "They characterise the process but cannot establish its cause alone; correlate with other findings and investigations."
      }
    ]
  },
  {
    id: 'paed_neonatal_jaundice_proforma',
    title: "Neonatal Jaundice",
    system: 'Pediatrics',
    department: "Paediatrics",
    summary: "Use measured bilirubin and the correct gestation/age-in-hours chart; skin colour cannot decide treatment.",
    examPearl: "Use measured bilirubin and the correct gestation/age-in-hours chart; skin colour cannot decide treatment.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Age in hours at onset and measured bilirubin with sample times",
              "Gestation, birth weight, delivery/bruising and neonatal illness",
              "Feeding effectiveness, weight change, urine/stool colour and output",
              "Maternal/infant groups, antibodies, affected siblings and phototherapy",
              "Poor feeding, lethargy, temperature instability, abnormal cry, arching or seizures",
              "Persistent jaundice, pale stools, dark urine and family haemolytic disorders"
            ]
          }
        ]
      },
      {
        title: "2. Complete background history",
        items: [
          {
            label: "Shared framework",
            description: "Add this background to the focused history; do not assume normal findings.",
            checklist: [
              "Informant, relationship and reliability; age and chronology of complaints",
              "Antenatal illness/exposures, gestation, birth weight, delivery, resuscitation and neonatal admission",
              "Gross motor, fine motor, language and social development; distinguish delay from regression",
              "Immunisation card, feeding observation and 24-hour dietary recall; assess actual intake against age-appropriate needs",
              "Previous illness, admissions, medicines/allergies, family pedigree, consanguinity, schooling and home environment"
            ]
          }
        ]
      },
      {
        title: "3. Bedside examination",
        items: [
          {
            label: "Examine and record",
            description: "Measure findings and document what was actually assessed.",
            checklist: [
              "Temperature, alertness, tone, observed feeding, hydration and weight versus birth weight",
              "Good-light inspection with visual limitations documented",
              "Pallor, bruising, cephalhaematoma, liver/spleen and infection signs",
              "Complete neonatal/neurological examination",
              "Establish cardiorespiratory stability first"
            ]
          }
        ]
      },
      {
        title: "4. Assessment and next steps",
        items: [
          {
            label: "Formulation and investigations",
            description: "Link each investigation to a clinical question and discuss the plan with the supervising team.",
            checklist: [
              "Prompt escalation for first-day jaundice, neurological signs or an unwell baby",
              "Measure bilirubin with method/time and plot on an applicable gestation-specific chart",
              "Fractionated bilirubin and haemolysis/infection evaluation when indicated; pale stools need urgent assessment",
              "Treatment and rebound monitoring under the neonatal protocol",
              "Support feeding and specify reassessment and follow-up"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "Paediatrics_proforma.pdf, pages 15–19; PAEDIATRIC CASE PROFORMAS.pdf, pages 25–30.",
            checklist: [
              "Teaching and clerking framework; not an automatic diagnosis or prescribing protocol.",
              "Record unassessed findings as not examined; example patient findings are not normal defaults."
            ]
          }
        ]
      }
    ],
    vivaQuestions: [
      {
        question: "Why age in hours?",
        answer: "Risk and thresholds change rapidly after birth and with gestation and clinical risk; a number without that context is incomplete."
      }
    ]
  },
  {
    id: 'paed_acute_abdomen_proforma',
    title: "Acute Abdominal Pain in a Child",
    system: 'Pediatrics',
    department: "Paediatrics",
    summary: "Assess stability and surgical warning signs first. Include extra-abdominal causes and examination limitations.",
    examPearl: "Assess stability and surgical warning signs first. Include extra-abdominal causes and examination limitations.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Pain onset, site/migration, character, severity, periodicity and triggers",
              "Vomiting: bilious, blood, frequency and relation to pain",
              "Stool/flatus, diarrhoea/blood, constipation, distension and appetite",
              "Fever, urinary/respiratory symptoms, trauma and ingestion",
              "Previous episodes, operations and medicines",
              "Private age-appropriate menstrual/pregnancy history when relevant"
            ]
          }
        ]
      },
      {
        title: "2. Complete background history",
        items: [
          {
            label: "Shared framework",
            description: "Add this background to the focused history; do not assume normal findings.",
            checklist: [
              "Informant, relationship and reliability; age and chronology of complaints",
              "Antenatal illness/exposures, gestation, birth weight, delivery, resuscitation and neonatal admission",
              "Gross motor, fine motor, language and social development; distinguish delay from regression",
              "Immunisation card, feeding observation and 24-hour dietary recall; assess actual intake against age-appropriate needs",
              "Previous illness, admissions, medicines/allergies, family pedigree, consanguinity, schooling and home environment"
            ]
          }
        ]
      },
      {
        title: "3. Bedside examination",
        items: [
          {
            label: "Examine and record",
            description: "Measure findings and document what was actually assessed.",
            checklist: [
              "Vitals, perfusion, hydration, pain behaviour and growth",
              "Abdominal contour, movement, scars and distension",
              "Gentle palpation away from pain: tenderness, guarding, masses and organs",
              "Percussion/bowel sounds as feasible and reassessment if evolving",
              "Chest, hernial orifices and indicated consented genital examination",
              "Avoid repeated painful manoeuvres; record limitations"
            ]
          }
        ]
      },
      {
        title: "4. Assessment and next steps",
        items: [
          {
            label: "Formulation and investigations",
            description: "Link each investigation to a clinical question and discuss the plan with the supervising team.",
            checklist: [
              "Escalate shock, bilious vomiting, peritonism, severe focal pain or suspected torsion/obstruction",
              "State course, location, systemic state and medical/surgical differential",
              "Target urine, blood tests and imaging; pregnancy testing when relevant",
              "Record analgesia, hydration, surgical review and reassessment time",
              "Evaluate warning features before labelling recurrent pain functional"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "Paediatrics_proforma.pdf, pages 25–30; PAEDIATRIC CASE PROFORMAS.pdf, pages 1–16.",
            checklist: [
              "Teaching and clerking framework; not an automatic diagnosis or prescribing protocol.",
              "Record unassessed findings as not examined; example patient findings are not normal defaults."
            ]
          }
        ]
      }
    ],
    vivaQuestions: [
      {
        question: "Why examine the chest?",
        answer: "Lower respiratory disease can cause abdominal pain; a complete examination avoids an abdomen-only differential."
      }
    ]
  },
  {
    id: 'paed_tof_proforma',
    title: "Cyanotic Congenital Heart Disease / Tetralogy of Fallot",
    system: 'Pediatrics',
    department: "Paediatrics",
    summary: "A cyanotic spell is an emergency: stop routine clerking and call the paediatric emergency team.",
    examPearl: "A cyanotic spell is an emergency: stop routine clerking and call the paediatric emergency team.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Cyanosis onset/progression and relation to feeds, crying or exercise",
              "Spells: triggers, duration, breathing, consciousness, recovery and emergency care",
              "Squatting, exercise tolerance, feeds and growth",
              "Echo diagnosis, procedures/shunt, medicines and follow-up",
              "Headache, fever, seizures, focal deficit and dehydration"
            ]
          }
        ]
      },
      {
        title: "2. Complete background history",
        items: [
          {
            label: "Shared framework",
            description: "Add this background to the focused history; do not assume normal findings.",
            checklist: [
              "Informant, relationship and reliability; age and chronology of complaints",
              "Antenatal illness/exposures, gestation, birth weight, delivery, resuscitation and neonatal admission",
              "Gross motor, fine motor, language and social development; distinguish delay from regression",
              "Immunisation card, feeding observation and 24-hour dietary recall; assess actual intake against age-appropriate needs",
              "Previous illness, admissions, medicines/allergies, family pedigree, consanguinity, schooling and home environment"
            ]
          }
        ]
      },
      {
        title: "3. Bedside examination",
        items: [
          {
            label: "Examine and record",
            description: "Measure findings and document what was actually assessed.",
            checklist: [
              "Consciousness, breathing, saturation and perfusion first",
              "Central cyanosis, clubbing, growth, pulse/BP and femoral pulses",
              "Precordium, apex/heave, heart sounds and murmur location/character",
              "Liver, lungs and failure/associated signs",
              "Neurological examination for relevant symptoms"
            ]
          }
        ]
      },
      {
        title: "4. Assessment and next steps",
        items: [
          {
            label: "Formulation and investigations",
            description: "Link each investigation to a clinical question and discuss the plan with the supervising team.",
            checklist: [
              "State cyanotic physiology, suspected/confirmed lesion, function and complications",
              "Review echo anatomy and intervention records",
              "Urgent assessment for acute spells or new neurological signs",
              "Assess blood count and hydration; do not assume all cyanotic children need iron restriction",
              "Cardiology follow-up, growth support and urgent-symptom advice"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "Paediatrics_proforma.pdf, pages 31–34.",
            checklist: [
              "Teaching and clerking framework; not an automatic diagnosis or prescribing protocol.",
              "Record unassessed findings as not examined; example patient findings are not normal defaults."
            ]
          }
        ]
      }
    ],
    vivaQuestions: [
      {
        question: "What does squatting suggest?",
        answer: "A compensatory behaviour seen with some cyanotic heart disease, classically TOF; it supports the history but does not define anatomy."
      }
    ]
  },
  {
    id: 'paed_vsd_proforma',
    title: "Acyanotic Congenital Heart Disease / VSD",
    system: 'Pediatrics',
    department: "Paediatrics",
    summary: "A loud murmur need not mean a large defect. Describe physiology and confirm anatomy by echo.",
    examPearl: "A loud murmur need not mean a large defect. Describe physiology and confirm anatomy by echo.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Feeding pauses, sweating, tachypnoea, growth and onset",
              "Recurrent respiratory illness/admissions and exercise tolerance",
              "Cyanosis, syncope or change from baseline",
              "Birth history, confirmed lesion and previous echo",
              "Medicines, adherence, interventions and family cardiac disease"
            ]
          }
        ]
      },
      {
        title: "2. Complete background history",
        items: [
          {
            label: "Shared framework",
            description: "Add this background to the focused history; do not assume normal findings.",
            checklist: [
              "Informant, relationship and reliability; age and chronology of complaints",
              "Antenatal illness/exposures, gestation, birth weight, delivery, resuscitation and neonatal admission",
              "Gross motor, fine motor, language and social development; distinguish delay from regression",
              "Immunisation card, feeding observation and 24-hour dietary recall; assess actual intake against age-appropriate needs",
              "Previous illness, admissions, medicines/allergies, family pedigree, consanguinity, schooling and home environment"
            ]
          }
        ]
      },
      {
        title: "3. Bedside examination",
        items: [
          {
            label: "Examine and record",
            description: "Measure findings and document what was actually assessed.",
            checklist: [
              "Vitals, saturation, growth and perfusion",
              "Pulse/BP, precordial activity, apex and thrills",
              "Murmur timing/site/radiation/intensity and S2/P2",
              "Lung sounds, effort and liver enlargement",
              "Other congenital features and systemic examination"
            ]
          }
        ]
      },
      {
        title: "4. Assessment and next steps",
        items: [
          {
            label: "Formulation and investigations",
            description: "Link each investigation to a clinical question and discuss the plan with the supervising team.",
            checklist: [
              "State likely shunt, growth, failure and pulmonary-pressure features",
              "Echo defines location/size, pressures and associated lesions",
              "ECG/imaging/labs for specific clinical questions",
              "Review nutrition, medicines and intervention plan with cardiology",
              "Growth follow-up and deterioration advice"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "Paediatrics_proforma.pdf, pages 72–77.",
            checklist: [
              "Teaching and clerking framework; not an automatic diagnosis or prescribing protocol.",
              "Record unassessed findings as not examined; example patient findings are not normal defaults."
            ]
          }
        ]
      }
    ],
    vivaQuestions: [
      {
        question: "Can a small VSD be loud?",
        answer: "Yes. A restrictive high-velocity jet may be prominent; haemodynamic impact requires clinical and echo assessment."
      }
    ]
  },
  {
    id: 'paed_cp_proforma',
    title: "Cerebral Palsy / Developmental Motor Disorder",
    system: 'Pediatrics',
    department: "Paediatrics",
    summary: "Document function and participation alongside tone/reflexes. New regression needs evaluation rather than automatic attribution to CP.",
    examPearl: "Document function and participation alongside tone/reflexes. New regression needs evaluation rather than automatic attribution to CP.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "First concern, milestones and static/progressive/regressive course",
              "Prematurity, birth events, neonatal seizures/jaundice and later neurological injury",
              "Distribution of stiffness/movements, falls and hand use",
              "Vision/hearing, seizures, communication, feeding/choking, sleep and pain",
              "Aids, self-care, school, therapy, caregiver strain and goals"
            ]
          }
        ]
      },
      {
        title: "2. Complete background history",
        items: [
          {
            label: "Shared framework",
            description: "Add this background to the focused history; do not assume normal findings.",
            checklist: [
              "Informant, relationship and reliability; age and chronology of complaints",
              "Antenatal illness/exposures, gestation, birth weight, delivery, resuscitation and neonatal admission",
              "Gross motor, fine motor, language and social development; distinguish delay from regression",
              "Immunisation card, feeding observation and 24-hour dietary recall; assess actual intake against age-appropriate needs",
              "Previous illness, admissions, medicines/allergies, family pedigree, consanguinity, schooling and home environment"
            ]
          }
        ]
      },
      {
        title: "3. Bedside examination",
        items: [
          {
            label: "Examine and record",
            description: "Measure findings and document what was actually assessed.",
            checklist: [
              "Observe movement, posture, interaction and communication",
              "Growth/nutrition, head size, skin/spine and indicated feeding assessment",
              "Age-appropriate cranial nerves, vision and hearing",
              "Tone, selective movement, reflex distribution and motor pattern",
              "Contractures, hips/spine, range and gait when ambulant",
              "Suitable validated functional classifications when trained"
            ]
          }
        ]
      },
      {
        title: "4. Assessment and next steps",
        items: [
          {
            label: "Formulation and investigations",
            description: "Link each investigation to a clinical question and discuss the plan with the supervising team.",
            checklist: [
              "State motor type/distribution, function, associated impairments and likely cause",
              "Investigate atypical progression/regression or alternative diagnoses",
              "Multidisciplinary therapy, communication, nutrition and school support",
              "Review pain, seizures, spasticity and hip surveillance",
              "Agree practical family goals and reassess"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "Paediatrics_proforma.pdf, pages 35–47; PAEDIATRIC CASE PROFORMAS.pdf, pages 31–47.",
            checklist: [
              "Teaching and clerking framework; not an automatic diagnosis or prescribing protocol.",
              "Record unassessed findings as not examined; example patient findings are not normal defaults."
            ]
          }
        ]
      }
    ],
    vivaQuestions: [
      {
        question: "Can the clinical picture change after a non-progressive injury?",
        answer: "Yes. Growth, functional demands and secondary complications can change function, so reassessment remains necessary."
      }
    ]
  },
  {
    id: 'paed_nephritic_proforma',
    title: "Acute Nephritic Syndrome / Glomerulonephritis",
    system: 'Pediatrics',
    department: "Paediatrics",
    summary: "Measure BP and urine output: hypertension, fluid overload and kidney dysfunction matter beyond urine colour.",
    examPearl: "Measure BP and urine output: hypertension, fluid overload and kidney dysfunction matter beyond urine colour.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Urine colour/blood, dysuria and output",
              "Oedema, weight change and chronology",
              "Recent throat/skin infection and timing",
              "Headache, vomiting, visual change, seizures and breathlessness",
              "Rash, joints, recurrence, medicines and family renal disease"
            ]
          }
        ]
      },
      {
        title: "2. Complete background history",
        items: [
          {
            label: "Shared framework",
            description: "Add this background to the focused history; do not assume normal findings.",
            checklist: [
              "Informant, relationship and reliability; age and chronology of complaints",
              "Antenatal illness/exposures, gestation, birth weight, delivery, resuscitation and neonatal admission",
              "Gross motor, fine motor, language and social development; distinguish delay from regression",
              "Immunisation card, feeding observation and 24-hour dietary recall; assess actual intake against age-appropriate needs",
              "Previous illness, admissions, medicines/allergies, family pedigree, consanguinity, schooling and home environment"
            ]
          }
        ]
      },
      {
        title: "3. Bedside examination",
        items: [
          {
            label: "Examine and record",
            description: "Measure findings and document what was actually assessed.",
            checklist: [
              "BP with appropriate cuff, pulse, respiratory rate, saturation and perfusion",
              "Weight, oedema and volume assessment",
              "Throat/skin/rash; cardiac and respiratory overload signs",
              "Abdominal/renal and indicated neurological examination",
              "Serial BP, weight and fluid balance"
            ]
          }
        ]
      },
      {
        title: "4. Assessment and next steps",
        items: [
          {
            label: "Formulation and investigations",
            description: "Link each investigation to a clinical question and discuss the plan with the supervising team.",
            checklist: [
              "State nephritic features, severity, AKI and systemic disease evidence",
              "Urine microscopy/protein quantification, creatinine/electrolytes and indicated complement",
              "Select infection/immune studies by history and timing",
              "Escalate symptomatic severe hypertension, pulmonary oedema, hyperkalaemia or oliguria",
              "Follow BP, urine, renal function and relevant complement recovery"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "Paediatrics_proforma.pdf, pages 48–54.",
            checklist: [
              "Teaching and clerking framework; not an automatic diagnosis or prescribing protocol.",
              "Record unassessed findings as not examined; example patient findings are not normal defaults."
            ]
          }
        ]
      }
    ],
    vivaQuestions: [
      {
        question: "How differs from nephrotic syndrome?",
        answer: "Haematuria, hypertension and impaired filtration dominate nephritic disease; protein loss/hypoalbuminaemia dominate nephrotic disease, with possible overlap."
      }
    ]
  },
  {
    id: 'paed_nephrotic_proforma',
    title: "Childhood Nephrotic Syndrome",
    system: 'Pediatrics',
    department: "Paediatrics",
    summary: "An oedematous child can have reduced effective circulating volume. Assess perfusion separately from swelling.",
    examPearl: "An oedematous child can have reduced effective circulating volume. Assess perfusion separately from swelling.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Oedema onset/distribution, weight and frothy urine",
              "Output, haematuria, fever, abdominal pain, dyspnoea and limb pain/swelling",
              "First episode or relapse; urine/remission records",
              "Steroid exposure, documented response, adherence, infection and adverse effects",
              "Other immunosuppression, vaccination and systemic symptoms"
            ]
          }
        ]
      },
      {
        title: "2. Complete background history",
        items: [
          {
            label: "Shared framework",
            description: "Add this background to the focused history; do not assume normal findings.",
            checklist: [
              "Informant, relationship and reliability; age and chronology of complaints",
              "Antenatal illness/exposures, gestation, birth weight, delivery, resuscitation and neonatal admission",
              "Gross motor, fine motor, language and social development; distinguish delay from regression",
              "Immunisation card, feeding observation and 24-hour dietary recall; assess actual intake against age-appropriate needs",
              "Previous illness, admissions, medicines/allergies, family pedigree, consanguinity, schooling and home environment"
            ]
          }
        ]
      },
      {
        title: "3. Bedside examination",
        items: [
          {
            label: "Examine and record",
            description: "Measure findings and document what was actually assessed.",
            checklist: [
              "Vitals/BP, perfusion, growth and weight versus baseline",
              "Oedema, ascites and respiratory/pleural findings",
              "Hydration and circulation independent of oedema severity",
              "Abdominal tenderness, fever and infection focus",
              "Steroid toxicity, growth and urgent suspected thrombosis assessment"
            ]
          }
        ]
      },
      {
        title: "4. Assessment and next steps",
        items: [
          {
            label: "Formulation and investigations",
            description: "Link each investigation to a clinical question and discuss the plan with the supervising team.",
            checklist: [
              "Confirm proteinuria/hypoalbuminaemia and review renal function/electrolytes",
              "State episode and documented response using applicable definitions",
              "Urgently evaluate infection, hypovolaemia, thrombosis, AKI or respiratory compromise",
              "Supervised nephrology plan; no improvised steroid/albumin dosing",
              "Agreed urine monitoring, relapse action plan, BP/growth and adverse-effect follow-up"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "Paediatrics_proforma.pdf, pages 55–57.",
            checklist: [
              "Teaching and clerking framework; not an automatic diagnosis or prescribing protocol.",
              "Record unassessed findings as not examined; example patient findings are not normal defaults."
            ]
          }
        ]
      }
    ],
    vivaQuestions: [
      {
        question: "Why is abdominal pain important?",
        answer: "It can indicate infection, hypovolaemia or thrombosis and should not be assumed to be ascites alone."
      }
    ]
  },
  {
    id: 'paed_rickets_proforma',
    title: "Rickets / Metabolic Bone Disease",
    system: 'Pediatrics',
    department: "Paediatrics",
    summary: "Describe bone changes and growth then establish cause; bow legs alone do not diagnose nutritional rickets.",
    examPearl: "Describe bone changes and growth then establish cause; bow legs alone do not diagnose nutritional rickets.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Deformity, pain, fractures, delayed walking and growth",
              "Calcium/vitamin D intake, supplements and relevant sunlight exposure",
              "Diarrhoea, liver/renal disease, medicines and prior treatment",
              "Spasms, seizures or weakness",
              "Family bone/dental disease, stature and consanguinity"
            ]
          }
        ]
      },
      {
        title: "2. Complete background history",
        items: [
          {
            label: "Shared framework",
            description: "Add this background to the focused history; do not assume normal findings.",
            checklist: [
              "Informant, relationship and reliability; age and chronology of complaints",
              "Antenatal illness/exposures, gestation, birth weight, delivery, resuscitation and neonatal admission",
              "Gross motor, fine motor, language and social development; distinguish delay from regression",
              "Immunisation card, feeding observation and 24-hour dietary recall; assess actual intake against age-appropriate needs",
              "Previous illness, admissions, medicines/allergies, family pedigree, consanguinity, schooling and home environment"
            ]
          }
        ]
      },
      {
        title: "3. Bedside examination",
        items: [
          {
            label: "Examine and record",
            description: "Measure findings and document what was actually assessed.",
            checklist: [
              "Growth trajectory and body proportions",
              "Skull/fontanelle when appropriate, teeth, chest and wrists/ankles",
              "Alignment, tenderness, strength and gait",
              "Malnutrition and chronic-disease signs",
              "Promptly assess acute neuromuscular/cardiorespiratory symptoms"
            ]
          }
        ]
      },
      {
        title: "4. Assessment and next steps",
        items: [
          {
            label: "Formulation and investigations",
            description: "Link each investigation to a clinical question and discuss the plan with the supervising team.",
            checklist: [
              "State suspected active rickets, severity, growth and possible cause",
              "Calcium, phosphate, age-appropriate ALP, vitamin D/PTH and renal studies as indicated",
              "Target radiographs; imaging alone does not determine cause",
              "Supervised cause-specific treatment and nutrition",
              "Monitor biochemical/function response, deformity and family risk"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "Paediatrics_proforma.pdf, pages 78–83.",
            checklist: [
              "Teaching and clerking framework; not an automatic diagnosis or prescribing protocol.",
              "Record unassessed findings as not examined; example patient findings are not normal defaults."
            ]
          }
        ]
      }
    ],
    vivaQuestions: [
      {
        question: "Why paediatric ALP ranges?",
        answer: "ALP changes with growth; adult ranges can misclassify results. Interpret with the other biochemical and clinical findings."
      }
    ]
  },
  {
    id: 'paed_hypothyroid_proforma',
    title: "Childhood Hypothyroidism",
    system: 'Pediatrics',
    department: "Paediatrics",
    summary: "Growth deceleration and development may be more informative than an adult-style symptom checklist.",
    examPearl: "Growth deceleration and development may be more informative than an adult-style symptom checklist.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Constipation, activity, feeding, cold intolerance and voice",
              "Growth, milestones, school and puberty",
              "Neonatal screen, prolonged jaundice and thyroid tests",
              "Maternal/family thyroid disease and autoimmune conditions",
              "Prescribed levothyroxine: administration, adherence, interactions and monitoring"
            ]
          }
        ]
      },
      {
        title: "2. Complete background history",
        items: [
          {
            label: "Shared framework",
            description: "Add this background to the focused history; do not assume normal findings.",
            checklist: [
              "Informant, relationship and reliability; age and chronology of complaints",
              "Antenatal illness/exposures, gestation, birth weight, delivery, resuscitation and neonatal admission",
              "Gross motor, fine motor, language and social development; distinguish delay from regression",
              "Immunisation card, feeding observation and 24-hour dietary recall; assess actual intake against age-appropriate needs",
              "Previous illness, admissions, medicines/allergies, family pedigree, consanguinity, schooling and home environment"
            ]
          }
        ]
      },
      {
        title: "3. Bedside examination",
        items: [
          {
            label: "Examine and record",
            description: "Measure findings and document what was actually assessed.",
            checklist: [
              "Pulse, temperature, growth charts and proportions",
              "Skin/hair, face/oral features, thyroid and oedema",
              "Reflexes, muscle function and development",
              "CVS and abdomen",
              "Hearing and associated problems where indicated"
            ]
          }
        ]
      },
      {
        title: "4. Assessment and next steps",
        items: [
          {
            label: "Formulation and investigations",
            description: "Link each investigation to a clinical question and discuss the plan with the supervising team.",
            checklist: [
              "TSH/free T4 interpreted for age/context",
              "Prompt paediatric/endocrine review, especially suspected congenital disease",
              "Clarify cause without delaying necessary treatment",
              "Supervised replacement/monitoring plan rather than source-example doses",
              "Follow growth, development, school and adherence"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "Paediatrics_proforma.pdf, pages 84–88.",
            checklist: [
              "Teaching and clerking framework; not an automatic diagnosis or prescribing protocol.",
              "Record unassessed findings as not examined; example patient findings are not normal defaults."
            ]
          }
        ]
      }
    ],
    vivaQuestions: [
      {
        question: "Does a reported normal neonatal screen exclude current disease?",
        answer: "No. Screening records are useful but a new clinical concern still needs evaluation."
      }
    ]
  },
  {
    id: 'paed_hydrocephalus_proforma',
    title: "Macrocephaly / Hydrocephalus",
    system: 'Pediatrics',
    department: "Paediatrics",
    summary: "Macrocephaly is a measurement, hydrocephalus a diagnosis. Use serial head growth, examination and imaging.",
    examPearl: "Macrocephaly is a measurement, hydrocephalus a diagnosis. Use serial head growth, examination and imaging.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Head enlargement onset/rate and prior measurements",
              "Headache, vomiting, irritability, feeding, drowsiness and gaze/vision",
              "Delay versus regression, seizures and focal deficit",
              "Antenatal scans, prematurity, haemorrhage, infection and spine abnormalities",
              "Family head size, imaging, surgery/shunt, fever and change from baseline"
            ]
          }
        ]
      },
      {
        title: "2. Complete background history",
        items: [
          {
            label: "Shared framework",
            description: "Add this background to the focused history; do not assume normal findings.",
            checklist: [
              "Informant, relationship and reliability; age and chronology of complaints",
              "Antenatal illness/exposures, gestation, birth weight, delivery, resuscitation and neonatal admission",
              "Gross motor, fine motor, language and social development; distinguish delay from regression",
              "Immunisation card, feeding observation and 24-hour dietary recall; assess actual intake against age-appropriate needs",
              "Previous illness, admissions, medicines/allergies, family pedigree, consanguinity, schooling and home environment"
            ]
          }
        ]
      },
      {
        title: "3. Bedside examination",
        items: [
          {
            label: "Examine and record",
            description: "Measure findings and document what was actually assessed.",
            checklist: [
              "Consciousness, vitals and stability first",
              "Correct occipitofrontal circumference plotted serially with growth proportions",
              "Fontanelle/sutures, veins, gaze and cranial nerves",
              "Age-adapted motor, reflex, sensory and developmental exam",
              "Spine/skin and relevant shunt-track findings"
            ]
          }
        ]
      },
      {
        title: "4. Assessment and next steps",
        items: [
          {
            label: "Formulation and investigations",
            description: "Link each investigation to a clinical question and discuss the plan with the supervising team.",
            checklist: [
              "Urgently escalate raised-pressure signs or suspected shunt malfunction/infection",
              "Consider familial head size, megalencephaly, subdural collections and hydrocephalus",
              "Appropriate ultrasound/cross-sectional imaging with the specialist team",
              "Do not perform routine lumbar puncture with suspected raised intracranial pressure",
              "Cause-specific care, developmental follow-up and family emergency instructions"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "Paediatrics_proforma.pdf, pages 89–103.",
            checklist: [
              "Teaching and clerking framework; not an automatic diagnosis or prescribing protocol.",
              "Record unassessed findings as not examined; example patient findings are not normal defaults."
            ]
          }
        ]
      }
    ],
    vivaQuestions: [
      {
        question: "Why serial head measurements?",
        answer: "Centile crossing may be more informative than one large value; consider gestation, family head size, development and examination."
      }
    ]
  }
];
