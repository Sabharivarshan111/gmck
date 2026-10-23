# Continued AIIMS/INI recall review - 23 October 2026

The owner requested continued expansion and explicitly allowed more than500 questions. There is no fixed target or cap. This batch adds **13 AIIMS PG and7 INI-CET questions**, bringing the reviewed candidate to **141 AIIMS PG +308 INI-CET =449**. All429 preceding complete records are exactly preserved. The2078-question NEET bank and year sidecar remain byte-identical.

## Source review

Thirteen separate PG Blazer November2011 article snapshots contribute thirteen questions. These are new source receipts, not thirteen new exam sittings. Direct HTML returned406; each pinned hash identifies the retrieved publisher text, not original HTML bytes. Complete question/options and available keys were read. Stems are paraphrased while preserving the tested fact, source choices and choice order. Publisher explanations are not distributed.

An existing AglaSem November2022 medicine PDF contributes seven additional questions. Its25 pages were reacquired and its SHA256 matches the existing manifest. Selected pages4,5,7,9,11,19 and the session heading on page2 were rendered and visually inspected, including the page4-to5 continuation. This PDF is not counted as a newly discovered paper. The selected topics are high-intensity secondary-prevention statin therapy, losartan and hyperkalaemia, vitamin-D toxicity, H.pylori test of cure, corrected reticulocytes, EBV attachment and syringomyelia.

Twelve new AIIMS questions have supplied publisher keys. One complete congenital-adrenal-hyperplasia recall lacks a publisher key. Its hydrocortisone answer is explicitly labelled editorial in the reader and supported by Endocrine Society guidance. The explanation also notes infant mineralocorticoid/sodium assessment; this is not described as a supplied answer. The LUMINATE item identifies the historical voclosporin trial drug without claiming a current approved uveitis indication. Gene and tract explanations avoid universal claims about steroid resistance or pupil involvement.

Clinical references and exact source/key/page/fingerprint receipts are recorded per question in `scripts/aiims-ini-continued-review2-20261023.json`. References include Endocrine Society, AHA/ACC, ACG, DailyMed, NIH genetics/neurology and original podocin, reflux-nephropathy, LUMINATE and xenon publications. The reticulocyte calculation uses the conventional15g/dL reference and distinguishes the corrected percentage from the maturation-adjusted production index.

## Exclusions and preservation

The pre-import comparison considered the three closest TF-IDF question/option matches for each selection, then manually compared tested facts and correct answers across both banks. No new semantic duplicate is accepted. Existing left-neglect and sestamibi questions were recognised and not reimported. Repeated losartan, tetany and reticulocyte variants in the same medicine paper are held rather than counted twice.

Twenty-three newly recorded holds cover missing options, ambiguous clinical context, corrupted terminology and erroneous keys. Examples include thiopentone elimination versus redistribution, CT as an absolute pregnancy contraindication, mismatched ovarian-tumour key letters, a time-free endothelial-loss percentage and incomplete contemporary PMTCT regimens. Earlier holds remain intact. No missing distractor, image or clinical qualifier is invented to rescue a rejected recall.

Cumulative selected question/option words remain at or below200 per source document. The medicine PDF reaches198. The limits and clinical/provenance/anatomy gates are unchanged. Runtime banks occupy314839 raw bytes and78465 separate-bank gzip bytes; this is question data, not full application size.

## Validation

Eleven source-extension tests and five extraction regression tests pass. All449 source/key/chapter/offline checks, all2078 NEET year joins, root/mobile TypeScript, quiet mobile ESLint, the assembled production web build and Android JavaScript bundle pass. Digestive dossier coverage remains103/108 with the original95% floor. Actual assembled production browser checks pass at360/390/430: exam controls/counts, existing answers/year labels/bookmarks, service-worker offline reload, new CAH/editorial attribution and new statin/November2022 answer reveal. The two new screenshots were visually inspected. Repository39path guard passes. Exact tested-tree/publication receipts are in PR122. No main merge, deployment, signed APK or physical-device claim is made.
