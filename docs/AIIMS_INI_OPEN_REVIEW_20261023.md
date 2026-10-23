# Continued AIIMS/INI source review — 23 October 2026

The owner removed the fixed500/509 target. The scope is now open-ended: add complete, unique and defensible questions as eligible sources permit. No remaining-to-target number is current.

This pass adds **3 AIIMS PG and13 INI-CET questions**, producing **128 AIIMS PG +301 INI-CET =429**. All413 earlier complete question records and NEET2078/year-sidecar bytes remain unchanged. No new withdrawal is made.

## Sources and clinical review

Nine existing PDFs from the preceding100-document acquisition contribute the16 selections. All nine source hashes were checked again against the manifest. Original question/options/key pages and continuations were rendered and visually inspected. All16 answers are supplied by the sources; original explanations are authored separately. No new-paper count is claimed for reusing an existing source document.

The AIIMS2010 questions address carbon-dioxide diffusibility, DLCO measurement and the blood-brain barrier. The original report's erroneous CO2 molecular-weight explanation is not copied. App attribution retains the existing source manifest's year-only2010 label. INI questions carry May2025 attribution and cover neonatal stridor, snakebite classification, firearm wounds, the amended MTP opinion requirement, procalcitonin, selected erythropoietin indications, histochemical stains, suspected scaphoid injury, antimuscarinic effects, bland cholestasis, flumazenil, breast conservation and tension pneumothorax.

Primary guidance supports the context-sensitive explanations: NICE NG38 for early MRI in suspected scaphoid injury; ATS/IDSA for procalcitonin plus clinical criteria when considering antibiotic discontinuation; NHM/MoHFW for the20–24week MTP opinion requirement in eligible categories; NIDDK/NCI for selected ESA use; LiverTox for bland steroid-associated cholestasis. The procalcitonin explanation does not use the test alone to diagnose VAP or choose empirical treatment. The MTP explanation distinguishes the prescribed categories and separate exceptions. Exact references, pages, keys, fingerprints and overlap suggestions are in `scripts/aiims-ini-open-review-20261023.json`.

The microbiology question includes a redundant histology illustration in its source. Its text asks which listed stain is not used for routine organism identification and can be answered without identifying the picture; the image is omitted. All numbered ENT/erythropoietin statements and original options/order remain intact. Existing cumulative200-word per-document question/option limits remain enforced; the highest among this batch's contributors is176words.

## Exclusions

Warburg metabolism overlaps ini-2025-01:4, and inspiratory rhythm generation overlaps aiims-2019-may:17; neither is imported again. Other held candidates include multiple true Z-plasty/nerve-grafting choices, inconsistent protozoal forms, renal-cancer bone-metastasis absolutes, mixed Dukes/Astler-Coller/TNM labels, a wrong magnesium-abruption indication, and a breast-milk-jaundice question with several true answers. Incomplete clinical context prevents automatic acceptance of meropenem for every complicated UTI, IVIG from a child's platelet count alone, or a reflux diagnosis from nonspecific infant vomiting. Holds are preserved rather than repaired with invented distractors or missing clinical details.

## Verification and scope

Raw text-bank size is 298,854bytes; separate-bank gzip total is 74,474bytes. The existing750KB/bank,1MB combined raw and250KB gzip limits are unchanged. Their rationale now reflects open-ended expansion instead of the superseded500-question target. These limits concern question data, not the complete Android app.

Eleven source-extension tests, five extraction regressions, all429 source/key/chapter/offline checks and2078year joins pass. Final assembled web/AndroidJS build, actual browser/screenshot and publication results are recorded in the newest resume note and PR122. No main merge, deployment, physical-device verification or Play upload is claimed. The existing anatomy coverage threshold is unchanged.
