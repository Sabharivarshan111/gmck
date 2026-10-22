# AIIMS PG recall extension — 22 October 2026

Added 10 individually checked, text-only recalls: seven from the PrepLadder
June 2020 pharmacology recall, two from PG Blazer's May/November 2011 posts,
and one from its May 2015 collection. AIIMS PG grows from 90 to 100; INI-CET
stays at 213. All 303 previously approved records retain every field unchanged.
The 2,078-question NEET PG bank and its year sidecar remain byte-identical.

`scripts/aiims-june2020-audit-20261022.json` records the four acquired HTML
documents' exact URLs, byte lengths and SHA-256 hashes, source question
numbers, supplied keys, chapter placements, medical references and five holds.
Raw publisher HTML, explanations and illustrations are not redistributed.
The source heading supplies the recall year/session; it does not authenticate
the original examination wording or order. Questions use adapted wording and
original educational explanations.

The seven selected pharmacology question/option blocks total **188 original
source words**, before adaptation. The existing PG Blazer selections plus
these short additions also remain below 200 words per session collection;
individual posts are not treated as a way to reproduce an entire collection.
The histology item explicitly concerns the thymic parenchymal framework, not
the collagen-containing capsule. The heterotopic-ossification explanation
states that ALP alone cannot exclude disease or determine maturity.

Five pharmacology candidates remain held: an image-dependent item, an
incomplete enteric-coating option, a questionable rosuvastatin interaction
rationale, outdated HIV PEP choices, and a hairy-cell-leukaemia question
offering both cladribine and pentostatin without a uniquely discriminating
clinical stem. No missing choices or exam years were invented.

Additional searches found that FirstRanker's June 2020 physiology-solved and
PSM landing pages now say “Document Not Found”; their download links deliver
a one-page “Document has been moved” response. They are not newly acquired
papers. Several other search hits concern undergraduate AIIMS science papers,
paid question banks or unverified reposts and were not imported.

Verification: source-extension mutation tests, all 313 fingerprinted-record
checks, NEET source/year preservation, offline reader/installer/discussion
checks and the production import-graph check pass. The assembled production
build and 360/390/430px browser flows pass, including the new June 2020
answer/year display, isolated bookmarks, offline reload and the unchanged
NEET reader. Native and preview TypeScript, full quiet mobile lint and the
required native guards pass. Android JavaScript bundle verification is
recorded in the publication receipt; it is not a signed APK or device test.

The service-worker cache version changes to deliver the new lazy-loaded bank.
The final tested tree, hosted CI and live deployment verification belong in
the pull-request publication receipt. Existing release gates remain intact.
