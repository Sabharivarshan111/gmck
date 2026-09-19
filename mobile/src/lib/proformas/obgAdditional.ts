/** Source-derived teaching frameworks. References use PDF page numbers. */
import type { ClinicalProforma } from '@/lib/clinicalProformas';

export const OBG_ADDITIONAL_PROFORMAS: ClinicalProforma[] = [
  {
    id: 'obg_gdm_proforma',
    title: "Gestational Diabetes Mellitus",
    system: 'Obstetrics & Gynaecology',
    department: "Obstetrics",
    summary: "Record the actual test, fasting status, sampling times, units and diagnostic criteria; do not mix pathways.",
    examPearl: "Record the actual test, fasting status, sampling times, units and diagnostic criteria; do not mix pathways.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Dating and timing of detection; obtain the original glucose report",
              "Prior diabetes/GDM, large baby, loss, neonatal hypoglycaemia and family diabetes",
              "Thirst, polyuria and infection may be absent",
              "Meal plan, timed glucose log, medication and adherence",
              "Hypoglycaemia, vomiting/illness and indicated ketones",
              "Movements, scans, hypertension symptoms, bleeding, leaking and labour"
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
              "Age, obstetric index, LMP, pregnancy possibility, and dating scan/gestation if pregnant",
              "Previous pregnancies: gestation, mode and indication for delivery, birth weight and maternal/neonatal complications",
              "Menstrual pattern, contraception, medical/surgical history, medicines and allergies",
              "Family history and support; ask sensitive sexual and urinary symptoms privately",
              "Explain examination, obtain consent and offer a chaperone for intimate examination; document examinations deferred or declined"
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
              "BP, pulse, hydration, weight trajectory and prepregnancy BMI",
              "Infection or acute illness; systemic exam guided by existing disease",
              "SFH versus dates, lie, presentation, engagement and fetal heart",
              "Review scan growth, liquor and placenta",
              "Do not infer control or wellbeing from one examination"
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
              "State gestational versus pre-existing diabetes, documented control, treatment and complications",
              "Review glucose against local pregnancy targets; HbA1c does not replace daily monitoring",
              "Agree nutrition/activity/medication review; do not copy fixed source insulin schedule",
              "Individualised fetal surveillance and birth plan",
              "Postnatal testing, future diabetes follow-up and counselling"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "OG cases.pdf / OG cases-1.pdf, pages 12–18 (duplicate source).",
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
        question: "Why keep the diagnostic report?",
        answer: "Different pathways have different fasting conditions, time points and thresholds."
      },
      {
        question: "Do absent symptoms exclude GDM?",
        answer: "No. It is commonly detected by screening."
      }
    ]
  },
  {
    id: 'obg_breech_proforma',
    title: "Breech Presentation",
    system: 'Obstetrics & Gynaecology',
    department: "Obstetrics",
    summary: "Confirm suspected breech on ultrasound and discuss options individually; the source patient’s operation is not a universal plan.",
    examPearl: "Confirm suspected breech on ultrasound and discuss options individually; the source patient’s operation is not a universal plan.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Gestation/dating and when breech identified",
              "Movements, contractions, bleeding or leaking",
              "Prior breech, caesarean/uterine surgery and birth outcomes",
              "Known anomalies, placenta, growth and liquor",
              "Prior counselling/version attempt and preferences"
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
              "Age, obstetric index, LMP, pregnancy possibility, and dating scan/gestation if pregnant",
              "Previous pregnancies: gestation, mode and indication for delivery, birth weight and maternal/neonatal complications",
              "Menstrual pattern, contraception, medical/surgical history, medicines and allergies",
              "Family history and support; ask sensitive sexual and urinary symptoms privately",
              "Explain examination, obtain consent and offer a chaperone for intimate examination; document examinations deferred or declined"
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
              "Maternal vitals and general assessment",
              "SFH, lie and fetal poles with consent",
              "Fundal/pelvic poles, back and engagement; recognise palpation limits",
              "Fetal heart, labour/membrane status",
              "Ultrasound presentation/type, head attitude, placenta, growth and liquor"
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
              "State gestation, presentation, fetal state and labour/membranes",
              "Discuss version suitability/risks/benefits with obstetrics",
              "Plan birth according to eligibility, preferences, expertise and facilities",
              "Prompt assessment for ruptured membranes, labour, bleeding or reduced movements",
              "Vaginal examination only when indicated, consented and by trained staff"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "OG cases.pdf / OG cases-1.pdf, pages 18–22.",
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
        question: "Why ultrasound?",
        answer: "It confirms presentation and supplies information relevant to counselling and birth planning beyond palpation."
      }
    ]
  },
  {
    id: 'obg_postdates_proforma',
    title: "Pregnancy Beyond the Expected Date",
    system: 'Obstetrics & Gynaecology',
    department: "Obstetrics",
    summary: "Crossing the EDD is not synonymous with post-term pregnancy. State completed weeks/days and evidence for the dates.",
    examPearl: "Crossing the EDD is not synonymous with post-term pregnancy. State completed weeks/days and evidence for the dates.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "LMP/cycle reliability, earliest scan and agreed EDD",
              "Movements, contractions, leaking and bleeding",
              "Hypertension/diabetes symptoms and complications",
              "Prior prolonged pregnancy, induction, operative birth or uterine scar",
              "Counselling and patient preferences"
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
              "Age, obstetric index, LMP, pregnancy possibility, and dating scan/gestation if pregnant",
              "Previous pregnancies: gestation, mode and indication for delivery, birth weight and maternal/neonatal complications",
              "Menstrual pattern, contraception, medical/surgical history, medicines and allergies",
              "Family history and support; ask sensitive sexual and urinary symptoms privately",
              "Explain examination, obtain consent and offer a chaperone for intimate examination; document examinations deferred or declined"
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
              "Vitals and general exam",
              "SFH, lie, presentation, engagement and fetal heart",
              "Growth/liquor assessment when indicated",
              "Labour/membrane status; indicated consented cervical examination",
              "Record Bishop-score components if examined"
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
              "Confirm dates before selecting a pathway",
              "Discuss individual induction/expectant-management risks and alternatives under local guidance",
              "Agree surveillance, review date and birth plan",
              "Choose induction approach considering cervix, scar and contraindications",
              "Prompt assessment for reduced movements or warning symptoms"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "OG cases.pdf / OG cases-1.pdf, pages 32–37.",
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
        question: "What belongs in the summary?",
        answer: "Reliable gestation, maternal/fetal state, presentation, scar history, cervix if assessed and agreed plan."
      }
    ]
  },
  {
    id: 'obg_labor_progress_proforma',
    title: "Suspected Disproportion / Poor Labour Progress",
    system: 'Obstetrics & Gynaecology',
    department: "Obstetrics",
    summary: "Short stature or an unengaged head alone does not establish disproportion. Assess serial progress and fetal condition.",
    examPearl: "Short stature or an unengaged head alone does not establish disproportion. Assess serial progress and fetal condition.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Gestation, onset/frequency/strength of contractions",
              "Membranes, liquor, bleeding and movements",
              "Prior labour, operative delivery, birth weights and uterine scar",
              "Pelvic trauma, skeletal disease or mobility limitation",
              "Labour record, analgesia, augmentation and response"
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
              "Age, obstetric index, LMP, pregnancy possibility, and dating scan/gestation if pregnant",
              "Previous pregnancies: gestation, mode and indication for delivery, birth weight and maternal/neonatal complications",
              "Menstrual pattern, contraception, medical/surgical history, medicines and allergies",
              "Family history and support; ask sensitive sexual and urinary symptoms privately",
              "Explain examination, obtain consent and offer a chaperone for intimate examination; document examinations deferred or declined"
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
              "Vitals, hydration, pain and bladder",
              "Lie, presentation, position/engagement and contractions",
              "Appropriate fetal monitoring",
              "Indicated consented cervical dilation/effacement, station, membranes, caput and moulding",
              "Timed serial findings instead of one examination"
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
              "State progress, contractions, position, maternal state and fetal wellbeing",
              "Consider malposition, inadequate contractions and obstruction with senior review",
              "Escalate compromise, deterioration or suspected obstruction",
              "Record reasons, alternatives and consent for interventions",
              "Do not diagnose inadequate pelvis from height alone or augment without clinical assessment"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "OG cases.pdf / OG cases-1.pdf, pages 37–41.",
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
        question: "Why serial findings?",
        answer: "Poor progress concerns change over time; an isolated cervical/head finding cannot establish its rate or cause."
      }
    ]
  },
  {
    id: 'gyn_prolapse_proforma',
    title: "Pelvic Organ Prolapse",
    system: 'Obstetrics & Gynaecology',
    department: "Gynaecology",
    summary: "Describe compartments and symptom burden. Prolapse does not automatically require hysterectomy.",
    examPearl: "Describe compartments and symptom burden. Prolapse does not automatically require hysterectomy.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Bulge onset/progression, reducibility and positional/straining relation",
              "Voiding, incomplete emptying, retention, leakage and splinting",
              "Constipation, evacuation and faecal symptoms",
              "Pain, ulceration, discharge, bleeding, sexual function and daily impact",
              "Birth injury, surgery, menopause, cough/heavy lifting, comorbidity and goals"
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
              "Age, obstetric index, LMP, pregnancy possibility, and dating scan/gestation if pregnant",
              "Previous pregnancies: gestation, mode and indication for delivery, birth weight and maternal/neonatal complications",
              "Menstrual pattern, contraception, medical/surgical history, medicines and allergies",
              "Family history and support; ask sensitive sexual and urinary symptoms privately",
              "Explain examination, obtain consent and offer a chaperone for intimate examination; document examinations deferred or declined"
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
              "General state, BMI, abdomen and relevant bladder/mass findings",
              "Consented chaperoned vulval/exposed-tissue inspection",
              "Anterior, apical and posterior compartments with appropriate straining/position",
              "POP-Q when trained or clear description of observed extent",
              "Pelvic-floor function/emptying when indicated; document deferral"
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
              "State compartment/stage, symptom burden and urinary/bowel impact",
              "Urinalysis/residual where indicated; unexplained bleeding evaluated separately",
              "Pelvic-floor measures, pessary and surgical options guided by preferences",
              "Pessary fitting/review and complication follow-up when chosen",
              "Prompt review for painful irreducibility, retention or ulceration"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "OG cases.pdf / OG cases-1.pdf, pages 62–66.",
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
        question: "Why ask about voiding with bulge reduction?",
        answer: "Prolapse may alter emptying and mask leakage, affecting assessment and treatment counselling."
      }
    ]
  },
  {
    id: 'gyn_adnexal_mass_proforma',
    title: "Ovarian / Adnexal Mass",
    system: 'Obstetrics & Gynaecology',
    department: "Gynaecology",
    summary: "Mobility or lack of pain does not establish benignity. Acute pain can indicate torsion or another emergency.",
    examPearl: "Mobility or lack of pain does not establish benignity. Acute pain can indicate torsion or another emergency.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Mass/pain onset, progression, site and relation to menstruation",
              "Acute severe pain, vomiting, fever or collapse",
              "Bloating, early satiety, pressure, weight and appetite",
              "Cycle, pregnancy possibility, infertility and postmenopausal bleeding",
              "Pelvic operations/endometriosis/cysts and family ovarian/breast or hereditary cancer"
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
              "Age, obstetric index, LMP, pregnancy possibility, and dating scan/gestation if pregnant",
              "Previous pregnancies: gestation, mode and indication for delivery, birth weight and maternal/neonatal complications",
              "Menstrual pattern, contraception, medical/surgical history, medicines and allergies",
              "Family history and support; ask sensitive sexual and urinary symptoms privately",
              "Explain examination, obtain consent and offer a chaperone for intimate examination; document examinations deferred or declined"
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
              "Vitals, pallor, nutrition and indicated nodes",
              "Abdominal mass location, measured size, surface, consistency, mobility and tenderness",
              "Ascites and systemic findings",
              "Indicated consented/chaperoned pelvic examination and uterine/adnexal relation",
              "Document unperformed examinations rather than importing source findings"
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
              "Urgent review for pain/vomiting, instability or peritonism",
              "Pregnancy test when relevant and ultrasound characterisation",
              "Markers/further imaging according to age, menopause and imaging-risk pathway",
              "Appropriate gynaecology/oncology referral for suspicious findings",
              "Discuss surveillance/intervention and fertility goals from full assessment"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "OG cases.pdf / OG cases-1.pdf, pages 66–70.",
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
        question: "Can CA-125 diagnose cancer alone?",
        answer: "No. Non-malignant conditions can raise it and malignancy may occur with normal results; imaging and clinical context matter."
      }
    ]
  },
  {
    id: 'gyn_discharge_proforma',
    title: "Abnormal Vaginal Discharge / Cervicitis",
    system: 'Obstetrics & Gynaecology',
    department: "Gynaecology",
    summary: "Appearance alone is not a reliable diagnosis. Persistent or blood-stained postmenopausal discharge needs evaluation.",
    examPearl: "Appearance alone is not a reliable diagnosis. Persistent or blood-stained postmenopausal discharge needs evaluation.",
    sections: [
      {
        title: "1. Case history",
        items: [
          {
            label: "Presenting problem",
            description: "Establish sequence, severity and relevant negatives.",
            checklist: [
              "Onset, amount, colour, consistency, odour, blood and cycle relation",
              "Itch, soreness, dysuria, dyspareunia, pelvic/back pain and fever",
              "Pregnancy/menopause, procedures, antibiotics and diabetes",
              "Contraception, local products and treatment",
              "Private non-judgemental sexual history, STI exposure and relevant safeguarding"
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
              "Age, obstetric index, LMP, pregnancy possibility, and dating scan/gestation if pregnant",
              "Previous pregnancies: gestation, mode and indication for delivery, birth weight and maternal/neonatal complications",
              "Menstrual pattern, contraception, medical/surgical history, medicines and allergies",
              "Family history and support; ask sensitive sexual and urinary symptoms privately",
              "Explain examination, obtain consent and offer a chaperone for intimate examination; document examinations deferred or declined"
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
              "Vitals/general state and abdominal tenderness/mass",
              "Consented chaperoned external inspection for lesions/inflammation",
              "Appropriate speculum assessment of discharge source, vaginal walls and cervix",
              "Indicated bimanual assessment for pelvic tenderness",
              "Suspicious lesions/bleeding need diagnostic evaluation, not screening alone"
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
              "Consider physiological, vaginal, cervical and non-infective causes",
              "Target pregnancy tests, pH/microscopy and infection testing",
              "Use current local treatment pathway, not the source’s fixed IV antibiotics",
              "Partner testing/treatment when indicated and results review",
              "Escalate fever with pelvic pain, pregnancy concerns or suspicious findings"
            ]
          }
        ]
      },
      {
        title: "Source and scope",
        items: [
          {
            label: "Source pages",
            description: "OG cases.pdf / OG cases-1.pdf, pages 70–75.",
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
        question: "Why is a screening smear insufficient for a suspicious cervix?",
        answer: "Screening does not replace diagnostic assessment of concerning symptoms or a visible lesion."
      }
    ]
  }
];
