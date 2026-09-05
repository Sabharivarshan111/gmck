# The 56 plates on more than five questions — read row by row

**Status:** in progress. 15 of 56 plates read; 20 rows corrected. This note is
the record of which plates have been read, so the next session does not start
over or re-read what is already clean.

## Why this is by hand and never a script

`question_diagrams` had 967 rows carrying a picture across 250 plates, and 56
of those plates were attached to more than five questions each (555 rows). That
number on its own is **not** a defect: an HIV virion plate legitimately answers
thirty-four different HIV questions, and a leukaemia comparison plate answers
fifteen leukaemia questions. Over-attachment is the ordinary case.

The defect is the stray — one question of a completely different subject
sitting on a plate because of how the row was first written. Those can only be
found by reading the questions, which is why `check:diagrams` fails if the
*lookup* ever grows a keyword table, a score or a containment test. The auditor
(`npm run audit:diagrams`) is a second opinion on the filename, not a matcher,
and it answers nothing at all for two thirds of the rows.

## The test applied to every row

**Does the plate draw the subject of the question?** Not "is it related", not
"is it the same chapter". If the answer is no, and a plate that does draw it
exists, the row is repointed. If no such plate exists, the row is cleared —
`public_url = null`. A blank is correct and a plausible neighbour is not, which
is the rule the whole lookup is built on.

## Plates read, and what came out of each

| Plate | Rows | Verdict |
|---|---|---|
| `hiv_virion_structure_and_replication_cycle` | 34 | 33 genuine. **1 stray cleared**: "Non Shivering Thermogenesis" — a physiology brown-fat question on a microbiology virion plate. |
| `heme_degradation_bilirubin_jaundice_differential` | 32 | 25 genuine. **3 repointed** (Dengue Virus -> dengue plate, Hepatitis B Virus -> HBV plate, Amoebic Liver Abscess -> entamoeba plate — each of those plates already served that subject's *other* questions). **4 cleared** with no plate that draws them: Sickle Cell Anaemia x2, Leptospirosis, Alcoholic Liver Disease. Jaundice is a feature of all four; none of them is heme degradation. |
| `plasmodium_malaria_cycle` | 23 | 22 genuine. **1 cleared**: "Extramalarial uses of Chloroquine" — the plate teaches nothing about chloroquine in RA or SLE. |
| `purine_denovo_salvage_uric_acid_gout` | 18 | 16 genuine. **2 cleared**: "Classify poison" (forensic medicine, on a purine plate) and "What is Pseudo Gout?" — pseudogout is calcium pyrophosphate, **not** urate, so a uric-acid plate there is an active teaching error rather than a near miss. |
| `lobar_pneumonia_consolidation_stages` | 17 | 14 genuine. **3 cleared**: Cystic Fibrosis, and Pneumocystis pneumonia x2 — PCP is diffuse and interstitial and does not produce lobar consolidation, so the stages plate teaches the wrong radiology. |
| `beta_lactam_cell_wall_synthesis_moa` | 16 | clean. The two "Bacterial Cell Wall" questions are legitimately served — the plate draws the wall and the drug's action on it. |
| `aml_auer_rods_vs_cml_leukemia` | 15 | clean. The two ALL questions stay: absent Auer rods is exactly what the plate contrasts. |
| `rheumatic_heart_disease_aschoff_nodule` | 14 | clean. |
| `hbv_virion_and_serological_markers` | 13 | clean, now 14 with the repointed row. ("Viral Oncogenes" is a stretch — HBV is one of several — but the plate does draw HBV. Left alone; noted rather than acted on.) |
| `lipoprotein_metabolism_reverse_cholesterol_transport` | 12 | 11 genuine. **1 cleared**: a peripheral vascular occlusive disease case. Atherosclerosis is the cause and the plate is the biochemistry — related, not drawn. |
| `larynx_vocal_cords_rima_glottidis` | 12 | clean. Laryngeal TB and carcinoma stay: the plate is the anatomy those diseases occupy. |
| `megaloblastic_vs_iron_deficiency_anemia` | 12 | 11 genuine. **1 cleared**: G-6-PD deficiency, which is haemolytic and is neither of the two the plate contrasts. |
| `dengue_pathogenesis_ade_and_serology` | 12 | clean, now 13. |
| `hypersensitivity_type_1_vs_type_4_cascades` | 11 | 8 genuine. **3 cleared**: the Type 2 questions x2 and Type 3. The plate contrasts 1 against 4 and draws neither of those. |
| `basal_ganglia_direct_indirect_circuit` | 10 | clean. The Parkinson's drug questions belong: the circuit is where those drugs act. |
| `diuretics_nephron_sites_moa` | 10 | 9 genuine. **1 cleared**: SIADH, which is not a diuretic. |

## Still to read

41 plates with 6-10 rows each. In descending order the next ones are
`lepromatous_leprosy_virchow_cells_grenz` (10), `polio_pathogenesis` (10),
`rigor_mortis_nysten_law` (9),
`echinococcus_granulosus_hydatid_cyst_structure_and_cycle` (9), then the tail.
Re-derive the list with:

    select regexp_replace(public_url,'^.*/','') plate, count(*)
    from question_diagrams where public_url is not null
    group by 1 having count(*) > 5 order by 2 desc;

## What must not be done to close this faster

- **No bulk UPDATE driven by a text rule**, in either direction. That is the
  keyword search coming back through the side door, and it is the bug this
  whole design exists to prevent.
- **No loosening of the lookup** to reach a row that does not match. Fix the
  row.
- Both apps pick these corrections up with no deploy: they read this table
  live, and `applyQuestionDiagrams` rebuilds a cached note's diagram sections
  every time it is opened.
