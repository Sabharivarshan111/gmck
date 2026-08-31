# 94 - Textbook-Grounded Medical Diagram Engine (Antigravity Exclusive)

## Core Architecture & Duplicate Prevention Protocol

This skill and pipeline is **exclusive to Antigravity** using its native `generate_image` (Gemini image generator) tool. Claude does not have native `generate_image` capabilities.

---

### 1. Mandatory Pre-Generation Live Supabase Storage Check
Before generating ANY diagram:
1. **LIVE QUERY**: Run a live script against `https://pmtgeydtqypwrypshhsx.supabase.co` storage bucket `diagrams/` across all subject directories.
2. **STRICT RULE**: **NEVER regenerate an existing diagram**. If an image already exists in Supabase Storage or `question_diagrams`, REUSE IT. Do NOT call `generate_image` for already-generated structures.

---

### 2. Current Supabase Inventory (216 Complete Diagrams)

#### 🫀 Anatomy (86 Diagrams Complete)
- Upper Limb: `brachial_plexus_complete_scheme.jpg`, `axilla_boundaries_axillary_artery.jpg`, `cubital_fossa_boundaries_contents.jpg`, `carpal_tunnel_cross_section.jpg`, `clavipectoral_fascia_relations.jpg`, `palmar_spaces_of_hand.jpg`, `palmar_arches_superficial_deep.jpg`, `scapular_arterial_anastomosis.jpg`, `shoulder_joint_anatomy_diagram.jpg`, `shoulder_joint_rotator_cuff_muscles.jpg`, etc.
- Lower Limb: `femoral_triangle_boundaries_contents.jpg`, `adductor_canal_cross_section.jpg`, `popliteal_fossa_boundaries_relations.jpg`, `knee_joint_cruciates_menisci.jpg`, `hip_joint_relations_exam_schematic.jpg`, etc.
- Thorax: `bronchopulmonary_segments_lungs.jpg`, `coronary_circulation_arteries_veins.jpg`, `intercostal_space_cross_section_van.jpg`, `right_atrium_internal_features.jpg`, etc.
- Head & Neck: `carotid_triangle_boundaries_contents.jpg`, `cavernous_sinus_coronal_relations.jpg`, `facial_nerve_complete_course.jpg`, `submandibular_ganglion_secretomotor_pathway.jpg`, `infratemporal_fossa_maxillary_artery.jpg`, `middle_ear_cavity_six_walls.jpg`, `tympanic_membrane_otoscopic_view.jpg`, `larynx_vocal_cords_rima_glottidis.jpg`, etc.
- Neuroanatomy: `circle_of_willis_arterial_polygon.jpg`, `internal_capsule_horizontal_sections.jpg`, `visual_pathway_field_defects.jpg`, `midbrain_cross_section_superior_colliculus.jpg`, `pons_cross_section_facial_colliculus.jpg`, `medulla_cross_section_sensory_decussation.jpg`, etc.
- Histology: `compact_bone_histology_haversian.jpg`, `hyaline_cartilage_histology_plate.jpg`, `elastic_cartilage_histology_plate.jpg`, `fibrocartilage_histology_plate.jpg`, `muscle_types_histology_comparison.jpg`, `liver_histology_plate.jpg`, `kidney_cortex_histology_plate.jpg`, `pancreas_islets_langerhans.jpg`, `spleen_histology_plate.jpg`, `thymus_histology_plate.jpg`, `lymph_node_histology_plate.jpg`, `palatine_tonsil_histology_plate.jpg`, `testis_seminiferous_tubule_histology.jpg`, `ovary_graafian_follicle.jpg`, `thyroid_follicles_histology_plate.jpg`, `duodenum_brunners_glands.jpg`, `ileum_peyers_patches.jpg`, `appendix_cross_section.jpg`, `cerebellum_purkinje_cells.jpg`, `cerebrum_cerebral_cortex.jpg`, `urinary_bladder_urothelium.jpg`, `artery_elastic_vs_muscular_histology.jpg`, etc.
- Embryology & General: `pharyngeal_arches_derivatives.jpg`, `midgut_rotation_embryology_stages.jpg`, `interatrial_septum_development.jpg`, `fetal_circulation_changes_at_birth.jpg`, `neural_tube_formation_and_defects.jpg`, `development_of_face_and_palate.jpg`, `types_of_synovial_joints.jpg`, `cartilaginous_joints_primary_vs_secondary.jpg`, `blood_supply_of_a_long_bone.jpg`, `endochondral_ossification_growth_plate_zones.jpg`, `perineal_pouches_superficial_deep.jpg`, `scrotum_and_testis_coverings.jpg`, `portal_vein_portosystemic_anastomoses.jpg`, `epiploic_foramen_lesser_sac.jpg`, `kidney_posterior_relations_muscular_bed.jpg`, `celiac_trunk_branches_stomach.jpg`, etc.

#### 🔬 Pathology (35 Diagrams Complete)
- Full 35 histology plates and macroscopic schematics: `atherosclerosis_atheroma_plaque.jpg`, `tuberculous_granuloma_histology.jpg`, `lobar_pneumonia_consolidation_stages.jpg`, `chronic_peptic_ulcer_askanazy.jpg`, `cirrhosis_liver_regenerative_nodule.jpg`, `rheumatic_heart_disease_aschoff_nodule.jpg`, `hodgkin_lymphoma_reed_sternberg_cell.jpg`, `papillary_thyroid_carcinoma_histology.jpg`, `clear_cell_rcc_histology.jpg`, `infiltrating_ductal_carcinoma_breast.jpg`, `aml_auer_rods_vs_cml_leukemia.jpg`, `fibroadenoma_breast_histology.jpg`, `osteosarcoma_osteoid_histology.jpg`, `hashimotos_thyroiditis_histology.jpg`, `multiple_myeloma_plasma_cells_histology.jpg`, `seminoma_testis_histology.jpg`, `basal_cell_carcinoma_histology.jpg`, `megaloblastic_vs_iron_deficiency_anemia.jpg`, `acute_appendicitis_suppurative_histology.jpg`, `acute_proliferative_glomerulonephritis_psgn.jpg`, `amyloidosis_spleen_congo_red_histology.jpg`, `benign_prostatic_hyperplasia_corpora_amylacea.jpg`, `chronic_pyelonephritis_thyroidization_kidney.jpg`, `cvc_liver_nutmeg_histology.jpg`, `fatty_liver_steatosis_histology.jpg`, `giant_cell_tumor_osteoclastoma_histology.jpg`, `granulation_tissue_neovascularization_histology.jpg`, `hydatidiform_mole_chorionic_villi_histology.jpg`, `leiomyoma_uterus_spindle_whorls_histology.jpg`, `lepromatous_leprosy_virchow_cells_grenz.jpg`, `mature_cystic_teratoma_ovary_dermoid.jpg`, `meningioma_psammoma_bodies_whorls.jpg`, `myocardial_infarction_coagulative_necrosis.jpg`, `pleomorphic_adenoma_salivary_gland_histology.jpg`, `wilms_tumor_triphasic_nephroblastoma.jpg`.

#### 💊 Pharmacology (16 Diagrams Complete)
- 16 major pathways: `beta_lactam_cell_wall_synthesis_moa.jpg`, `antitubercular_drugs_ripe_moa.jpg`, `cholinergic_neurotransmission_receptors.jpg`, `adrenergic_neurotransmission_receptors.jpg`, `raas_pathway_antihypertensive_drugs.jpg`, `diuretics_nephron_sites_moa.jpg`, `gastric_acid_secretion_ppi_mechanism.jpg`, `antidiabetic_drugs_organ_mechanisms.jpg`, `gaba_a_receptor_benzodiazepine_barbiturate.jpg`, `cardiac_action_potential_antiarrhythmics.jpg`, `dose_response_curve_antagonism.jpg`, `protein_synthesis_inhibitors_30s_50s.jpg`, `antifungal_drugs_sites_of_action.jpg`, `antimalarial_drugs_sites_of_action.jpg`, `antiretroviral_haart_regimen_targets.jpg`, `cancer_chemotherapy_cell_cycle_sites.jpg`.

#### 🏘️ Community Medicine (19 Diagrams Complete)
- 19 diagrams: `demographic_transition_model.jpg`, `epidemiological_triad.jpg`, `iceberg_phenomenon_disease.jpg`, `growth_chart_road_to_health.jpg`, `normal_gaussian_curve.jpg`, `histogram_frequency_polygon.jpg`, `bar_charts_types_comparative.jpg`, `pie_chart_statistical.jpg`, `slow_sand_vs_rapid_sand_filter.jpg`, `cold_chain_system.jpg`, `plasmodium_malaria_cycle.jpg`, `wuchereria_filariasis_cycle.jpg`, `hookworm_cycle.jpg`, `leishmania_kala_azar_cycle.jpg`, `rabies_neuro_cycle.jpg`, `rabies_pep_algorithm.jpg`, `tuberculosis_transmission.jpg`, `typhoid_sanitary_barrier.jpg`, `leprosy_ridley_jopling.jpg`.

#### 🦠 Microbiology (16 Diagrams Complete)
- 16 diagrams: `bacterial_growth_curve_and_endospore_structure.jpg`, `corynebacterium_diphtheriae_morphology_and_elek_test.jpg`, `vibrio_cholerae_enterotoxin_moa_and_tcbs.jpg`, `treponema_pallidum_syphilis_stages_and_vdrl_algorithm.jpg`, `immunoglobulin_structure_and_polymer_architecture.jpg`, `hypersensitivity_type_1_vs_type_4_cascades.jpg`, `hiv_virion_structure_and_replication_cycle.jpg`, `hbv_virion_and_serological_markers.jpg`, `dengue_pathogenesis_ade_and_serology.jpg`, `entamoeba_histolytica_life_cycle_and_liver_abscess.jpg`, `taenia_solium_life_cycle_and_neurocysticercosis.jpg`, `echinococcus_granulosus_hydatid_cyst_structure_and_cycle.jpg`, `medically_important_helminth_eggs_comparative_plate.jpg`, `candida_albicans_and_cryptococcus_neoformans_diagnostics.jpg`, `dermatophytes_macroconidia_and_microconidia_comparative_plate.jpg`, `mycetoma_actinomycetoma_vs_eumycetoma_comparative_plate.jpg`.

#### ⚡ Physiology (23 Diagrams Complete)
- 23 diagrams: `action_potential_nerve.jpg`, `neuromuscular_junction_transmission.jpg`, `sarcomere_crossbridge_cycle.jpg`, `cardiac_cycle_wiggers_diagram.jpg`, `cardiac_action_potentials_comparison.jpg`, `blood_pressure_baroreceptor_reflex.jpg`, `oxygen_hemoglobin_dissociation_curve.jpg`, `lung_volumes_capacities_spirogram.jpg`, `respiration_neural_chemical_control.jpg`, `countercurrent_mechanism_urine.jpg`, `gfr_filtration_barrier_starling.jpg`, `renal_acidification_urine.jpg`, `micturition_reflex_cystometrogram.jpg`, `gastric_hcl_secretion_parietal.jpg`, `glucose_homeostasis_insulin_glucagon.jpg`, `raas_pathway_jga.jpg`, `menstrual_cycle_integrated_phases.jpg`, `spermatogenesis_sertoli_hpg_axis.jpg`, `corticospinal_pyramidal_tract.jpg`, `basal_ganglia_direct_indirect_circuit.jpg`, `visual_pathway_field_defects.jpg`, `erythropoiesis_stages_factors.jpg`, `coagulation_cascade_hemostasis.jpg`.

#### 🧪 Biochemistry (21 Diagrams Complete)
- 21 pathways: `glycolysis_pathway_energetics.jpg`, `tca_cycle_amphibolic_anaplerosis.jpg`, `gluconeogenesis_bypasses_cori_cycle.jpg`, `glycogen_metabolism_gsd_types.jpg`, `hmp_shunt_g6pd_favism.jpg`, `etc_complexes_chemiosmotic_inhibitors.jpg`, `beta_oxidation_carnitine_shuttle.jpg`, `ketogenesis_ketolysis_dka.jpg`, `cholesterol_biosynthesis_statins.jpg`, `lipoprotein_metabolism_reverse_cholesterol_transport.jpg`, `urea_cycle_hyperammonemia_disorders.jpg`, `phenylalanine_tyrosine_inborn_errors.jpg`, `tryptophan_metabolism_carcinoid_hartnup.jpg`, `one_carbon_methionine_folate_trap.jpg`, `purine_denovo_salvage_uric_acid_gout.jpg`, `heme_biosynthesis_porphyrias_pathway.jpg`, `heme_degradation_bilirubin_jaundice_differential.jpg`, `wald_visual_cycle_vitamin_a.jpg`, `enzyme_kinetics_lineweaver_burk_inhibition.jpg`, `serum_protein_electrophoresis_spep_patterns.jpg`, `translation_ribosome_elongation_antibiotics.jpg`.

---

### 3. Diagram Generation Specifications (Antigravity Native `generate_image`)
- **Title**: Bold uppercase title centered at the top of the canvas matching the exact university exam question.
- **Background**: Solid clean white paper background (`#FFFFFF`) with high contrast and zero clutter.
- **Leader Lines**: Crisp, straight horizontal pointer lines with legible bold anatomical/biochemical labels.
- **Art Style**: Colored pencil anatomical/histological sketching standard for university theory and practical exams.
- **Aspect Ratio**: `4:3` (optimal for mobile and desktop viewports).

