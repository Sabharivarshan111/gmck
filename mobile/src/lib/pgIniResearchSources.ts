/** External research metadata only. Does not import provider questions or validate answers. */
import type {PgSource} from './pgEntranceBank';

export const PG_INI_RESEARCH_SOURCES: PgSource[] = [
  {
    "id": "research-ini-reflex",
    "exam": "INI_CET",
    "name": "Reflex public INI-CET recall archive",
    "to": 2025,
    "url": "https://www.reflexprep.com/inicet-previous-year-questions",
    "answerStatus": "Publisher keys; recall and original additions mixed",
    "kind": "Unofficial archive",
    "note": "Seven publicly listed sets; missing sessions and high-yield additions prevent a complete-PYQ claim. May 2026 is plan-gated.",
    "reuse": "Reference only; no republication permission established",
    "reuseStatus": "reference_only",
    "checkedAt": "2026-10-11",
    "coverageNote": "External research reference; zero questions imported or independently verified by this record.",
    "from": 2020,
    "sessions": [
      "November 2020",
      "May 2021",
      "May 2022",
      "November 2022",
      "May 2023",
      "May 2024",
      "May 2025"
    ]
  },
  {
    "id": "research-ini-diginerve2026pdf",
    "exam": "INI_CET",
    "name": "DigiNerve May 2026 recall PDF",
    "to": 2026,
    "url": "https://www.diginerve.com/blogs/wp-content/uploads/2026/05/INICET_May_2026_DigiNerve-new-01.pdf",
    "answerStatus": "Publisher recall answers, not official key",
    "kind": "Unofficial archive",
    "note": "49-page PDF lead with image questions. No automatic medical verification or permission to republish.",
    "reuse": "Reference only; no republication permission established",
    "reuseStatus": "reference_only",
    "checkedAt": "2026-10-11",
    "coverageNote": "External research reference; zero questions imported or independently verified by this record.",
    "from": 2026,
    "sessions": [
      "May 2026"
    ]
  },
  {
    "id": "research-ini-prepladder-medicine",
    "exam": "INI_CET",
    "name": "PrepLadder INI-CET medicine archive",
    "to": 2025,
    "url": "https://www.prepladder.com/neet-pg-study-material/previous-years-question-papers/last-5-year-pyqs-in-medicine-for-ini-cet",
    "answerStatus": "Selected subject-wise publisher explanations",
    "kind": "Unofficial archive",
    "note": "Last-five-year label is a publisher claim; exact per-question session and total recall coverage need auditing.",
    "reuse": "Reference only; no republication permission established",
    "reuseStatus": "reference_only",
    "checkedAt": "2026-10-11",
    "coverageNote": "External research reference; zero questions imported or independently verified by this record.",
    "from": 2020
  },
  {
    "id": "research-ini-prepladder-pedia",
    "exam": "INI_CET",
    "name": "PrepLadder INI-CET pediatrics PDF",
    "to": 2025,
    "url": "https://image.prepladder.com/content/Last-5-Year-PYQs-in-Pedia-for-INI-CET.pdf",
    "answerStatus": "Selected publisher explanations",
    "kind": "Unofficial archive",
    "note": "Subject-specific PDF lead, not a complete multi-subject paper.",
    "reuse": "Reference only; no republication permission established",
    "reuseStatus": "reference_only",
    "checkedAt": "2026-10-11",
    "coverageNote": "External research reference; zero questions imported or independently verified by this record.",
    "from": 2020
  },
  {
    "id": "research-ini-prepladder-obg",
    "exam": "INI_CET",
    "name": "PrepLadder INI-CET OBG PDF",
    "to": 2025,
    "url": "https://image.prepladder.com/content/Last-5-year-PYQs-in-OBG-for-INI-CET.pdf",
    "answerStatus": "Selected publisher explanations",
    "kind": "Unofficial archive",
    "note": "Subject-specific PDF lead. Preserve images and multi-correct format when evaluating any item.",
    "reuse": "Reference only; no republication permission established",
    "reuseStatus": "reference_only",
    "checkedAt": "2026-10-11",
    "coverageNote": "External research reference; zero questions imported or independently verified by this record.",
    "from": 2020
  },
  {
    "id": "research-ini-marrow2026",
    "exam": "INI_CET",
    "name": "Marrow May 2026 examination analysis",
    "to": 2026,
    "url": "https://www.marrow.com/blog/5-takeaways-from-ini-cet-2026/",
    "answerStatus": "Analysis only, not complete question-answer set",
    "kind": "Competitor analysis",
    "note": "Competitor comparison of paper patterns; do not count analysis as imported questions.",
    "reuse": "Reference only; no republication permission established",
    "reuseStatus": "reference_only",
    "checkedAt": "2026-10-11",
    "coverageNote": "External research reference; zero questions imported or independently verified by this record.",
    "from": 2026,
    "sessions": [
      "May 2026"
    ]
  },
  {
    "id": "research-ini-official-format2025",
    "exam": "INI_CET",
    "name": "AIIMS INI-CET July 2025 prospectus",
    "to": 2025,
    "url": "https://docs.aiimsexams.ac.in/sites/2_PROSPECTUS%20PART-A%20INI-CET%20JULY%202025%20SESSION.pdf",
    "answerStatus": "Official format, not answer key",
    "kind": "Official format",
    "note": "Confirms single-correct and multiple-correct questions. A four-option single-letter importer cannot represent every INI-CET item.",
    "reuse": "Reference only; no republication permission established",
    "reuseStatus": "reference_only",
    "checkedAt": "2026-10-11",
    "coverageNote": "External research reference; zero questions imported or independently verified by this record.",
    "from": 2025,
    "sessions": [
      "July 2025 admission session"
    ]
  }
];
