# The 56 plates on more than five questions — read row by row

**Status:** DONE. All 56 plates read row by row; **48 rows corrected** — 3
repointed to the plate that draws them, 45 cleared to no picture. Verified
against the database rather than counted from this note: rows carrying a
`public_url` went from 967 to **922**, which is the 45 clears exactly, and the
3 repoints move a row without changing the count.

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

---

# The rest of the 56, read 2026-09-05

## The four that are worth remembering

These are not near misses. Each is a picture that teaches the wrong thing, and
three of the four are the **substring collision** this repo's lookup design
exists to prevent — the row was written by something matching on words:

- **"Clinical Uses of Somatostatin and Octreotide"** on
  `cholesterol_biosynthesis_statins.jpg`. Somato**statin** is not a statin.
- **"Lymphogranuloma venereum"** (twice) on `tuberculous_granuloma_histology`.
  Chlamydial, and the shared word is "granuloma".
- **"What is Stroke or cerebral infarction?"** on
  `myocardial_infarction_coagulative_necrosis`. Cerebral infarction is
  **liquefactive** necrosis — the plate says the opposite of the answer.
- **"IgA Nephropathy"** on `immunoglobulin_structure_and_polymer_architecture`.
  The plate draws IgA's polymer; the question is a kidney disease.

## Every remaining plate, and its verdict

| Plate | Rows | Verdict |
|---|---|---|
| `echinococcus_granulosus_hydatid_cyst…` | 9 | clean. Casoni's test is the hydatid skin test. |
| `lepromatous_leprosy_virchow_cells_grenz` | 10 | clean. |
| `polio_pathogenesis` | 10 | clean. |
| `rigor_mortis_nysten_law` | 9 | **3 cleared**: Algor mortis, Livor mortis / hypostasis, hypostasis vs bruise. All postmortem changes, none of them the one the plate draws, and no plate exists for them. |
| `gaba_a_receptor_benzodiazepine_barbiturate` | 9 | **1 cleared**: "Second Generation Antihistamines" — H1 blockers have nothing to do with GABA-A. |
| `raas_pathway_jga` | 9 | **1 cleared**: adrenocortical hormones and the physiological anatomy of the adrenal. Aldosterone is RAAS's output; the gland is not drawn, and there is no adrenal plate. |
| `rabies_neuro_cycle` | 9 | clean. |
| `seminoma_testis_histology` | 9 | **3 cleared**: all three ovarian tumour questions. Wrong organ. The dermoid plate draws one ovarian germ cell tumour, not the class, so repointing would have been a partial answer dressed as the answer. |
| `typhoid_sanitary_barrier` | 9 | clean. |
| `chronic_peptic_ulcer_askanazy` | 8 | clean. |
| `fatty_liver_steatosis_histology` | 8 | clean — and it already serves the main Alcoholic Liver Disease questions, which is why clearing the ALD row off the bilirubin plate cost that subject nothing. |
| `treponema_pallidum_syphilis_stages…` | 8 | clean. |
| `tuberculous_granuloma_histology` | 8 | **4 cleared**: LGV x2, Granulomatous Amoebic Encephalitis, Wegener's. "Necrosis" stays — caseation is what the plate draws. |
| `acute_proliferative_glomerulonephritis_psgn` | 7 | **2 cleared**: Crescentic GN and RPGN. Same organ, different histology; the plate has no crescents in it. |
| `cholesterol_biosynthesis_statins` | 7 | **2 cleared**: somatostatin (above) and MI drug therapy. Bile acid formation stays — cholesterol is its substrate and the plate draws the synthesis. |
| `cholinergic_neurotransmission_receptors` | 7 | **1 cleared**: Bronchodilators, which the question asks about as sympathomimetics. |
| `glucose_homeostasis_insulin_glucagon` | 7 | clean. |
| `hashimotos_thyroiditis_histology` | 7 | **1 cleared**: Riedel's thyroiditis, a distinct fibrous entity. |
| `immunoglobulin_structure…` | 7 | **2 cleared**: IgA nephropathy (above) and autoimmune haemolytic anaemia. |
| `intracranial_hemorrhages` | 7 | **1 cleared**: intracranial complications of CSOM — abscess and meningitis, not haemorrhage. |
| `serum_protein_electrophoresis_spep_patterns` | 7 | **1 cleared**: Gastric Adenocarcinoma. This is the row `audit:diagrams` flagged on its first run; now fixed. |
| `taenia_solium_life_cycle…` | 7 | **2 cleared**: Diphyllobothrium latum and Hymenolepis nana — different tapeworms with their own cycles. "Tapeworms" stays; T. solium is the type species. |
| `wald_visual_cycle_vitamin_a` | 7 | clean. |
| `wallace_rule_of_nines_burns` | 7 | clean. |
| `mature_cystic_teratoma_ovary_dermoid` | 6 | **1 cleared**: "Epidermal cyst / Epidermoid cyst" — a skin swelling, not an ovarian dermoid. |
| `antitubercular_drugs_ripe_moa` | 6 | **1 cleared**: "Biotransformation", a general pharmacokinetics question. |
| `myocardial_infarction_coagulative_necrosis` | 6 | **1 cleared**: cerebral infarction (above). |
| `palatine_tonsil_histology_plate` | 6 | **1 cleared**: the lingual tonsil, a different structure. |
| `corynebacterium_diphtheriae…` | 9 | clean. The membranous-tonsillitis differentials belong: diphtheria is the classic one. |
| `dose_response_curve_antagonism` | 6 | clean. Beta-blockers stay — they are the textbook competitive antagonist. |
| `glycogen_metabolism_gsd_types` | 6 | clean. |
| `growth_chart_road_to_health` | 6 | clean. |
| `ketogenesis_ketolysis_dka` | 6 | clean. |
| `leishmania_kala_azar_cycle` | 6 | clean. The sandfly is drawn in the cycle. |
| `medically_important_helminth_eggs…` | 6 | clean. |
| `menstrual_cycle_integrated_phases` | 6 | clean. Female infertility is marginal — ovulatory causes are one group of several — but the cycle is the substrate the question reasons over. Noted, not acted on. |
| `tryptophan_metabolism_carcinoid_hartnup` | 6 | clean. |
| `vibrio_cholerae_enterotoxin_moa_and_tcbs` | 6 | clean. |
| `wuchereria_filariasis_cycle` | 6 | clean. |

## What this did not find

**No plate was over-attached because the lookup is wrong.** Every stray was a
single bad row. Thirty of the fifty-six plates were completely clean, and the
biggest plate of all — the HIV virion on 34 questions — was wrong exactly once.
So over-attachment on its own remains what it was: a fact about the bank, not a
defect, and not a number worth driving down.

## Nothing needs deploying

Both apps read this table live, and `applyQuestionDiagrams` rebuilds a cached
note's diagram sections every time it is opened. A note that was cached months
ago with one of these 48 pictures loses it the first time anyone opens it.
