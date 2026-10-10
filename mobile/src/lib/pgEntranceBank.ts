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
    "note": "14 selected years, major gaps; year and answer accuracy not independently verified"
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
    "note": "Pre-2020 material belongs to historical predecessor exams"
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
    "note": "Some image-dependent questions are incomplete without images"
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
    "note": "2,053 listed across 18 selected years; not comprehensive"
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
  }
];
export const PG_SOURCE_REVIEW_DATE = '2026-10-10';
