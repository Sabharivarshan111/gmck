/** Research directory only: free-to-view is NOT permission to republish source questions. */
export type PgExam = 'NEET_PG' | 'INI_CET' | 'FMGE';
export type PgSource = {id:string;exam:PgExam|'ALL';name:string;from:number;to:number;url:string;answerStatus:string;kind:string;note:string;reuse?:string;sessions?:string[];reuseStatus?:'reference_only'|'licensed_dataset';checkedAt?:string;coverageNote?:string};
export type PgQuestion = {id:string;exam:string;year:number|null;subject:string;chapter?:string;question:string;options:string[];answer:string;explanation:string;source_url?:string;record_type?:string;answer_reference?:string};
export const PG_BASE_SOURCES: PgSource[] = [
  {
    "id": "nbems-neet",
    "exam": "NEET_PG",
    "name": "NBEMS NEET-PG information",
    "from": 2013,
    "to": 2026,
    "url": "https://natboard.edu.in/viewnbeexam?exam=neetpg",
    "answerStatus": "Official examination information; no answer bank supplied",
    "kind": "Official information",
    "note": "Visit the examination authority for current notices and candidate information. This link does not establish historical question coverage.",
    "reuseStatus": "reference_only"
  },
  {
    "id": "nbems-fmge",
    "exam": "FMGE",
    "name": "NBEMS FMGE information",
    "from": 2002,
    "to": 2026,
    "url": "https://natboard.edu.in/viewnbeexam?exam=fmge",
    "answerStatus": "Official examination information; no answer bank supplied",
    "kind": "Official information",
    "note": "Visit the examination authority for current notices and candidate information. This link does not establish historical question coverage.",
    "reuseStatus": "reference_only"
  },
  {
    "id": "aiims-ini",
    "exam": "INI_CET",
    "name": "AIIMS examination information",
    "from": 2020,
    "to": 2026,
    "url": "https://www.aiimsexams.ac.in/",
    "answerStatus": "Official examination information; no answer bank supplied",
    "kind": "Official information",
    "note": "Visit the examination authority for current notices and candidate information. This link does not establish historical question coverage.",
    "reuseStatus": "reference_only"
  }
];
export const PG_SOURCES: PgSource[] = PG_BASE_SOURCES;
export const PG_ORIGINAL_PRACTICE: PgQuestion[] = [
  {
    "id": "orbit-original-1",
    "exam": "ORIGINAL",
    "record_type": "original_exam_style",
    "year": null,
    "subject": "Anatomy",
    "chapter": "Cranial nerves",
    "question": "Which cranial nerve innervates the lateral rectus muscle of the eye?",
    "options": [
      "Oculomotor nerve (III)",
      "Trochlear nerve (IV)",
      "Abducens nerve (VI)",
      "Optic nerve (II)"
    ],
    "answer": "C",
    "explanation": "The abducens nerve (CN VI) innervates lateral rectus and abducts the eye."
  },
  {
    "id": "orbit-original-2",
    "exam": "ORIGINAL",
    "record_type": "original_exam_style",
    "year": null,
    "subject": "Physiology",
    "chapter": "Renal physiology",
    "question": "Which nephron segment reabsorbs sodium chloride but is relatively impermeable to water?",
    "options": [
      "Thin descending limb",
      "Thick ascending limb",
      "Proximal convoluted tubule",
      "Collecting duct in the presence of ADH"
    ],
    "answer": "B",
    "explanation": "The thick ascending limb reabsorbs Na+, K+ and Cl− via NKCC2 while remaining relatively impermeable to water."
  },
  {
    "id": "orbit-original-3",
    "exam": "ORIGINAL",
    "record_type": "original_exam_style",
    "year": null,
    "subject": "Microbiology",
    "chapter": "Mycobacteria",
    "question": "Which staining method is commonly used to demonstrate acid-fast bacilli?",
    "options": [
      "Gram stain",
      "Giemsa stain",
      "Ziehl–Neelsen stain",
      "India ink"
    ],
    "answer": "C",
    "explanation": "Ziehl–Neelsen staining uses carbol fuchsin to detect mycolic acid-rich acid-fast organisms."
  },
  {
    "id": "orbit-original-4",
    "exam": "ORIGINAL",
    "record_type": "original_exam_style",
    "year": null,
    "subject": "Pharmacology",
    "chapter": "Opioids and antagonists",
    "question": "Which agent reverses acute opioid-induced respiratory depression?",
    "options": [
      "Flumazenil",
      "Atropine",
      "Naloxone",
      "Neostigmine"
    ],
    "answer": "C",
    "explanation": "Naloxone is an opioid receptor antagonist used for suspected opioid overdose."
  },
{
  "id": "orbit-original-5",
  "exam": "ORIGINAL",
    "record_type": "original_exam_style",
  "year": null,
  "subject": "Anatomy",
    "chapter": "Coronary circulation",
  "question": "In most individuals, which coronary artery supplies the sinoatrial node?",
  "options": [
    "Right coronary artery",
    "Left anterior descending artery",
    "Posterior descending artery only",
    "Posterior cerebral artery"
  ],
  "answer": "A",
  "explanation": "The sinoatrial nodal artery usually arises from the right coronary artery, although a left circumflex origin is an important anatomical variant."
},
{
  "id": "orbit-original-6",
  "exam": "ORIGINAL",
    "record_type": "original_exam_style",
  "year": null,
  "subject": "Pathology",
    "chapter": "Anaemias",
  "question": "Which iron-study pattern most strongly supports iron-deficiency anaemia?",
  "options": [
    "High ferritin with low TIBC",
    "Low ferritin with high TIBC",
    "High ferritin with low transferrin",
    "High vitamin B12 with normal ferritin"
  ],
  "answer": "B",
  "explanation": "Low ferritin indicates depleted iron stores and total iron-binding capacity commonly increases. Inflammation may raise ferritin and complicate interpretation."
},
{
  "id": "orbit-original-7",
  "exam": "ORIGINAL",
    "record_type": "original_exam_style",
  "year": null,
  "subject": "Obstetrics & Gynaecology",
    "chapter": "Hypertension in pregnancy",
  "question": "Which antihypertensive drug class should be avoided during pregnancy because of fetal renal toxicity?",
  "options": [
    "Labetalol",
    "Nifedipine",
    "ACE inhibitors",
    "Methyldopa"
  ],
  "answer": "C",
  "explanation": "ACE inhibitors interfere with the fetal renin–angiotensin system and can cause fetal kidney injury, oligohydramnios and other fetal harms."
},
{
  "id": "orbit-original-8",
  "exam": "ORIGINAL",
    "record_type": "original_exam_style",
  "year": null,
  "subject": "Surgery",
    "chapter": "Thoracic trauma",
  "question": "A patient has suspected tension pneumothorax with haemodynamic instability. What must happen immediately?",
  "options": [
    "Wait for chest radiography",
    "Urgent pleural decompression",
    "Discharge with analgesia",
    "Start oral diuretics"
  ],
  "answer": "B",
  "explanation": "Tension pneumothorax is a clinical emergency; urgent pleural decompression must not be delayed to obtain imaging in an unstable patient."
},
{
  "id": "orbit-original-9",
  "exam": "ORIGINAL",
    "record_type": "original_exam_style",
  "year": null,
  "subject": "Medicine",
    "chapter": "Anaphylaxis",
  "question": "What is the first-line medication for anaphylaxis?",
  "options": [
    "Oral antihistamine",
    "Intramuscular adrenaline (epinephrine)",
    "Oral corticosteroid",
    "Intravenous furosemide"
  ],
  "answer": "B",
  "explanation": "Intramuscular adrenaline is the first-line emergency treatment for anaphylaxis; adjunctive antihistamines and corticosteroids do not replace it."
},
{
  "id": "orbit-original-10",
  "exam": "ORIGINAL",
    "record_type": "original_exam_style",
  "year": null,
  "subject": "Community Medicine",
    "chapter": "Principles and methods of epidemiology",
  "question": "Which epidemiological statistic compares the risk of disease among exposed and unexposed groups?",
  "options": [
    "Relative risk",
    "Specificity",
    "Sensitivity",
    "Positive predictive value"
  ],
  "answer": "A",
  "explanation": "Relative risk is the incidence proportion in the exposed group divided by the incidence proportion in the unexposed group."
}
];
export const PG_SOURCE_REVIEW_DATE = '2026-10-12';
