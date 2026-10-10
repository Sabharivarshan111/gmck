/** Research directory only: free-to-view is NOT permission to republish source questions. */
export type PgExam = 'NEET_PG' | 'INI_CET' | 'FMGE';
export type PgSource = {id:string;exam:PgExam|'ALL';name:string;from:number;to:number;url:string;answerStatus:string;kind:string;note:string;reuse?:string};
export type PgQuestion = {id:string;exam:string;year:number|null;subject:string;question:string;options:string[];answer:string;explanation:string;source_url?:string;record_type?:string;answer_reference?:string};
export const PG_SOURCES: PgSource[] = [
  {
    "id": "medmcqa",
    "exam": "ALL",
    "name": "MedMCQA (2022 release)",
    "from": 1991,
    "to": 2022,
    "url": "https://huggingface.co/datasets/openlifescienceai/medmcqa",
    "answerStatus": "Mixed: validation keys; AIIMS test labels withheld",
    "kind": "Dataset",
    "note": "193,155 records; mostly mock questions, not 193,155 confirmed PYQs. Per-question exam year not verified.",
    "reuse": "Review individual question rights before reuse"
  },
  {
    "id": "neet-oncourse",
    "exam": "NEET_PG",
    "name": "Oncourse NEET-PG answers",
    "from": 2010,
    "to": 2025,
    "url": "https://getoncourse.ai/previous-year-papers/neet-pg/",
    "answerStatus": "Advertises solved MCQs + explanations",
    "kind": "Unofficial",
    "note": "8,272 listed in 14 year groups in source snapshot; 2010 only 1 question. App upgrade promoted. Not a complete freely reusable archive."
  },
  {
    "id": "neet-pyq",
    "exam": "NEET_PG",
    "name": "NEET PG PYQ year browser",
    "from": 2000,
    "to": 2026,
    "url": "https://www.neetpgpyq.com/years",
    "answerStatus": "Question browser; paid restrictions may apply",
    "kind": "Unofficial",
    "note": "Older AIPG-style questions mixed into NEET label; latest 2026 content very sparse"
  },
  {
    "id": "neet-aipg",
    "exam": "NEET_PG",
    "name": "Historical All India PG solved papers",
    "from": 2001,
    "to": 2005,
    "url": "https://www.educationobserver.com/forum/showthread.php?tid=12528",
    "answerStatus": "Several solved PDFs",
    "kind": "Historic archive",
    "note": "Earlier AIPG exam, not modern NEET-PG"
  },
  {
    "id": "neet-prepp",
    "exam": "NEET_PG",
    "name": "Prepp NEET-PG recalled keys",
    "from": 2023,
    "to": 2025,
    "url": "https://prepp.in/neet-pg-exam/question-paper",
    "answerStatus": "Year-wise PDFs and answer-key links listed",
    "kind": "Unofficial",
    "note": "Some exam date / shift metadata on source pages conflicts with NBEMS; verify"
  },
  {
    "id": "neet-careers",
    "exam": "NEET_PG",
    "name": "Careers360 historical solved papers",
    "from": 2013,
    "to": 2025,
    "url": "https://medicine.careers360.com/articles/neet-pg-previous-year-question-papers-with-solutions",
    "answerStatus": "Solved memory-based papers; variable download access",
    "kind": "Recall",
    "note": "Do not infer every year or sitting is complete"
  },
  {
    "id": "neet-2026",
    "exam": "NEET_PG",
    "name": "NEET-PG August 2026 recall & solutions",
    "from": 2026,
    "to": 2026,
    "url": "https://medicine.careers360.com/articles/neet-pg-2026-question-paper-memory-based-with-solutions",
    "answerStatus": "Answers and explanations for selected recalls",
    "kind": "2026 recall",
    "note": "Candidate recall, not the official NBEMS paper"
  },
  {
    "id": "ini-oncourse",
    "exam": "INI_CET",
    "name": "Oncourse INI-CET + older PG archive",
    "from": 1994,
    "to": 2026,
    "url": "https://getoncourse.ai/previous-year-papers/ini-cet/",
    "answerStatus": "Advertises solutions; selected years only",
    "kind": "Unofficial",
    "note": "1,462 listed across 25 year groups, including predecessor exams before 2020. Some years contain only one question; paid upgrade promoted."
  },
  {
    "id": "ini-aiims",
    "exam": "INI_CET",
    "name": "Old AIIMS-PG solved PDFs",
    "from": 2000,
    "to": 2014,
    "url": "https://www.educationobserver.com/forum/showthread.php?tid=17508",
    "answerStatus": "Some year papers have attached answer keys",
    "kind": "Historic archive",
    "note": "Several years incomplete or with question-only PDFs"
  },
  {
    "id": "ini-aiims-1999",
    "exam": "INI_CET",
    "name": "AIIMS-PG 1999 and older collections",
    "from": 1999,
    "to": 2012,
    "url": "https://www.educationobserver.com/forum/showthread.php?tid=12410",
    "answerStatus": "Solved AIIMS-PG files and separate keys",
    "kind": "Historic archive",
    "note": "Confirm each attachment is postgraduate, not AIIMS MBBS entrance"
  },
  {
    "id": "ini-prepp",
    "exam": "INI_CET",
    "name": "Prepp INI-CET PDF + answer-key index",
    "from": 2020,
    "to": 2025,
    "url": "https://prepp.in/ini-cet-exam/question-paper",
    "answerStatus": "Unverified memory-based answer-key PDFs",
    "kind": "Recall",
    "note": "May and November sittings must be distinguished"
  },
  {
    "id": "ini-2025",
    "exam": "INI_CET",
    "name": "INI-CET 2025 session archive",
    "from": 2025,
    "to": 2025,
    "url": "https://prepp.in/ini-cet-exam/question-paper-2025",
    "answerStatus": "Memory-based questions and answer keys",
    "kind": "Recall",
    "note": "Verify that PDF links lead to full answers"
  },
  {
    "id": "ini-2026",
    "exam": "INI_CET",
    "name": "DigiNerve INI-CET May 2026 recall",
    "from": 2026,
    "to": 2026,
    "url": "https://www.diginerve.com/blogs/inicet-may-2026-recall-questions-with-answers-pdf/",
    "answerStatus": "Answers displayed, selected questions",
    "kind": "2026 recall",
    "note": "Clinical answer audit warning: anatomy Q8 marks midline cleft for maxillary/medial nasal non-fusion, conflicting with standard embryology. Choices appear ambiguous; do not import without review. Image-dependent questions also need images."
  },
  {
    "id": "ini-2026-c360",
    "exam": "INI_CET",
    "name": "Careers360 INI-CET May 2026 explained",
    "from": 2026,
    "to": 2026,
    "url": "https://medicine.careers360.com/articles/ini-cet-may-2026-question-paper",
    "answerStatus": "Memory-based explanations",
    "kind": "2026 recall",
    "note": "Expert-review claim from publisher; independently recheck clinical answers"
  },
  {
    "id": "fmge-oncourse",
    "exam": "FMGE",
    "name": "Oncourse FMGE solved year archive",
    "from": 2003,
    "to": 2026,
    "url": "https://getoncourse.ai/previous-year-papers/fmge/",
    "answerStatus": "Advertises correct answers + explanations",
    "kind": "Unofficial",
    "note": "2,049 listed across 18 year groups, including 270 for 2026 versus 300 questions in one FMGE sitting. Incomplete; app upgrade promoted."
  },
  {
    "id": "fmge-old",
    "exam": "FMGE",
    "name": "FMGE old solved papers (2002 onward)",
    "from": 2002,
    "to": 2007,
    "url": "https://www.educationobserver.com/forum/showthread.php?tid=14302",
    "answerStatus": "Solved papers in selected attachments",
    "kind": "Historic archive",
    "note": "Some years may have paper-only attachments; availability varies"
  },
  {
    "id": "fmge-old2",
    "exam": "FMGE",
    "name": "FMGE 2006–2011 memory papers",
    "from": 2006,
    "to": 2011,
    "url": "https://www.educationobserver.com/forum/showthread.php?tid=14308",
    "answerStatus": "Mixed: question-only and solved files",
    "kind": "Historic archive",
    "note": "Do not mark answer-complete without opening the attached PDF"
  },
  {
    "id": "fmge-recent",
    "exam": "FMGE",
    "name": "Careers360 recent FMGE papers",
    "from": 2022,
    "to": 2026,
    "url": "https://medicine.careers360.com/articles/fmge-question-paper",
    "answerStatus": "Session recall with answers and PDF links",
    "kind": "Recall",
    "note": "Check June and December sittings separately"
  },
  {
    "id": "fmge-2026",
    "exam": "FMGE",
    "name": "FMGE June 2026 recalled solutions",
    "from": 2026,
    "to": 2026,
    "url": "https://medicine.careers360.com/articles/fmge-2026-question-paper-answer-key-solutions",
    "answerStatus": "Question recalls and expert solutions",
    "kind": "2026 recall",
    "note": "June 28, 2026 sitting; not an official complete paper"
  },
  {
    "id": "fmge-study",
    "exam": "FMGE",
    "name": "FMGE previous 5 years Diginerve",
    "from": 2020,
    "to": 2025,
    "url": "https://www.diginerve.com/blogs/fmge-previous-year-questions-last-5-years/",
    "answerStatus": "Selected solved questions",
    "kind": "Unofficial",
    "note": "Topic-based compilation, not a complete chronological session archive"
  }
,
  {
    "id": "neet-2023-2025-recalls",
    "exam": "NEET_PG",
    "name": "NEET-PG 2023–2025 year-specific memory recalls",
    "from": 2023,
    "to": 2025,
    "url": "https://medicine.careers360.com/articles/neet-pg-question-paper",
    "answerStatus": "Links to historical year recall questions; coverage and keys are unofficial",
    "kind": "2023–2025 recall directory",
    "note": "Questions/options and sessions are not all independently verified, and publisher reuse permission is not established"
  },
  {
    "id": "ini-2023-2024-archive",
    "exam": "INI_CET",
    "name": "INI-CET 2023–2024 memory recall sources",
    "from": 2023,
    "to": 2024,
    "url": "https://medicine.careers360.com/articles/ini-cet-previous-years-question-papers-pdf-with-answer-key-and-solutions",
    "answerStatus": "Publisher lists past sessions with recalled keys and selected solutions",
    "kind": "2023–2024 recall directory",
    "note": "January/July exam sessions must be verified separately; external papers are not bundled"
  },
  {
    "id": "ini-2025-c360",
    "exam": "INI_CET",
    "name": "INI-CET 2025 January/July recall answers",
    "from": 2025,
    "to": 2025,
    "url": "https://medicine.careers360.com/articles/ini-cet-2025-question-paper-with-answer-key",
    "answerStatus": "Selected memory-based questions and answer keys",
    "kind": "2025 recall",
    "note": "January session was held November 2024; label by exam session, not calendar date"
  },
  {
    "id": "ini-2026-solutions",
    "exam": "INI_CET",
    "name": "INI-CET May 2026 answer explanations",
    "from": 2026,
    "to": 2026,
    "url": "https://medicine.careers360.com/articles/ini-cet-2026-question-paper-with-answer-key-solutions",
    "answerStatus": "2026 recalled questions with answers and explanations",
    "kind": "2026 recall",
    "note": "Not an official full paper. Check disputed answers against source textbooks"
  },
  {
    "id": "fmge-2023-2026-session-index",
    "exam": "FMGE",
    "name": "FMGE 2023–2026 sitting-by-sitting recall directory",
    "from": 2023,
    "to": 2026,
    "url": "https://medicine.careers360.com/articles/fmge-question-paper",
    "answerStatus": "Year/session memory-based questions, PDF links and explanations",
    "kind": "2023–2026 recall directory",
    "note": "2026 January and June sessions are different; October 2026 is still in the future as of October 10"
  }
];
export const PG_ORIGINAL_PRACTICE: PgQuestion[] = [
  {
    "id": "orbit-original-1",
    "exam": "ORIGINAL",
    "year": null,
    "subject": "Anatomy",
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
    "year": null,
    "subject": "Physiology",
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
    "year": null,
    "subject": "Microbiology",
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
    "year": null,
    "subject": "Pharmacology",
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
  "year": null,
  "subject": "Anatomy",
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
  "year": null,
  "subject": "Pathology",
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
  "year": null,
  "subject": "Obstetrics & Gynaecology",
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
  "year": null,
  "subject": "Surgery",
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
  "year": null,
  "subject": "Medicine",
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
  "year": null,
  "subject": "Community Medicine",
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
export const PG_SOURCE_REVIEW_DATE = '2026-10-10';
