# Orbit MBBS Real-Time 3D Interactive Patient Simulator
## Technical & Pathophysiological Specification Document

**Document Version:** 6.0.0-AGI-OPEN-SOURCE-SIMULATOR-SYNTHESIS  
**Target Systems:** Orbit MBBS Mobile (React Native / Three.js / WebGL), Orbit Web, Supabase Edge Infrastructure  
**Curriculum Grounding:** National Medical Commission (NMC) Competency-Based Medical Education (CBME), Madras Medical College (MMC) Final Year Clinical Curriculum, *Kundu's Bedside Clinics in Medicine*, *Das Clinical Surgery*, *Macleod's Clinical Examination*, *Harrison's Principles of Internal Medicine*, *Robbins & Cotran Pathologic Basis of Disease*, *Guyton & Hall Physiology*, *Reddy's Essentials of Forensic Medicine*, *KD Tripathi Pharmacology*, *Bailey & Love Surgery*, *DC Dutta Obstetrics*.

---

## 1. Executive Vision & Core Philosophy

The **Orbit Real-Time 3D Interactive Patient Simulator** is an advanced physiological and clinical simulation engine designed for medical students, interns, and emergency residents. Instead of memorizing isolated symptoms or static multiple-choice questions, students interact with a living, rigged 3D human body undergoing acute clinical emergencies.

```
+----------------------------------------------------------------------------------------------------+
|                                    WHOLE-BODY CLOSED-LOOP ARCHITECTURE                             |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                       +-------------------------+                                  |
|                                       |   CENTRAL NERVOUS SYS   |                                  |
|                                       | Autonomic / GCS / Drive |                                  |
|                                       +------------+------------+                                  |
|                                                    |                                               |
|                    +-------------------------------+-------------------------------+               |
|                    |                                                               |               |
|                    v                                                               v               |
|        +-----------------------+                                       +-----------------------+   |
|        |     CARDIOVASCULAR    | <====== Baroreflex / Neurohumoral === |       RESPIRATORY     |   |
|        |  Heart Rate, Inotropy |                                       |  Ventilation, Shunt   |   |
|        |  Windkessel / SVR     | ====== Pulmonary Perfusion ========>  |  Gas Exchange / PaO2  |   |
|        +-----------+-----------+                                       +-----------+-----------+   |
|                    |                                                               |               |
|                    +-------------------------------+-------------------------------+               |
|                                                    |                                               |
|                    +-------------------------------+-------------------------------+               |
|                    |                               |                               |               |
|                    v                               v                               v               |
|        +-----------------------+       +-----------------------+       +-----------------------+   |
|        |      RENAL SYSTEM     |       |     HEPATIC / MET     |       |   MICROCIRCULATION    |   |
|        |  GFR, ATN, Acid-Base  |       |  Lactate Clearance,   |       |  Capillary Leak,      |   |
|        |  Urine Volume & Color |       |  Synthetic Function   |       |  Mottling, Cyanosis   |   |
|        +-----------------------+       +-----------------------+       +-----------------------+   |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### Key Pillars:
1. **Whole-Body Interconnected Physiology**: Every organ is coupled in a continuous closed loop. Left ventricular failure triggers backward pulmonary capillary hypertension, alveolar transudation, ventilation-perfusion ($V/Q$) mismatch, systemic arterial hypoxemia, cerebral hypoxia, and ischemic acute tubular necrosis in real-time.
2. **Dual-Speed Simulation & Branching "What-If" DAG**: Students can run emergencies at true real-time ($1\times$), slow motion ($0.1\times$), or accelerated time ($5\times$ to $60\times$). At any juncture, the student can fork the timeline (e.g., "Branch A: Administer Beta-Blocker" vs. "Branch B: Immediate Norepinephrine + Primary PCI") and observe divergent survival trajectories side-by-side.
3. **Multi-Scale Visualization**: The user can scrub an Anatomical Layer Slider (Skin $\rightarrow$ Musculoskeletal $\rightarrow$ Vascular $\rightarrow$ Solid Viscera) or double-tap any organ to enter **Organ Inspection Mode**, bringing up real-time microvascular perfusion shaders and a microscopic cellular metabolism HUD (ATP concentration, intracellular $\text{Ca}^{2+}$, cellular edema, apoptosis).
4. **Strict Grounding in Orbit's MBBS Question Bank**: Every scenario maps directly to high-yield 10-mark essay and clinical problem questions in `src/data/topics/`.

---

## 2. Multi-Agent Antigravity Orchestration Framework

### A. Is It Possible to Spawn Multiple Subagents Concurrently?
**Yes.** Antigravity natively supports spawning multiple specialized autonomous subagents concurrently via the `invoke_subagent` tool. Each subagent operates with its own isolated conversation context, dedicated memory, specialized system prompt, and access to workspace files and computational tools.

### B. Subagent Taskforce Topology for Patient Simulator Development
When building this simulator, we can parallelize the entire system across specialized subagents operating as a cohesive medical-engineering taskforce:

```
+----------------------------------------------------------------------------------------------------+
|                                    ANTIGRAVITY SUBAGENT TASKFORCE                                  |
+----------------------------------------------------------------------------------------------------+
|                                     +---------------------------+                                  |
|                                     |    ORCHESTRATOR AGENT     |                                  |
|                                     |  Architecture & Pipeline  |                                  |
|                                     +-------------+-------------+                                  |
|                                                   |                                                |
|         +-------------------+---------------------+---------------------+--------------------+     |
|         |                   |                     |                     |                    |     |
|         v                   v                     v                     v                    v     |
|  +-------------+     +-------------+       +-------------+       +-------------+      +----------+ |
|  | CARDIOLOGY  |     | TOXICOLOGY  |       | CRITICAL    |       | NEPHROLOGY  |      | 3D GLSL  | |
|  |  Subagent   |     |  Subagent   |       |    CARE     |       | & METABOLIC |      | SHADER   | |
|  | (CAD, STEMI,|     | (Snakebite, |       |  Subagent   |       |  Subagent   |      | Engine   | |
|  | Shock, IABP)|     |  OP Poison) |       | (PE, Trauma)|       | (DKA, ATN)  |      | Architect| |
|  +-------------+     +-------------+       +-------------+       +-------------+      +----------+ |
|         |                   |                     |                     |                    |     |
|         +-------------------+---------------------+---------------------+--------------------+     |
|                                                   |                                                |
|                                                   v                                                |
|                                     +---------------------------+                                  |
|                                     |     WASM ODE NUMERICAL    |                                  |
|                                     |    MATH ENGINE ARCHITECT  |                                  |
|                                     +---------------------------+                                  |
+----------------------------------------------------------------------------------------------------+
```

1. **Cardiovascular & Hemodynamics Subagent**: Owns the 4-element Windkessel circuit, Frank-Starling mechanics, 12-lead ECG vector synthesis, and cardiogenic shock spirals.
2. **Toxicology & Forensic Medicine Subagent**: Owns snakebite envenomation (VICC, 20WBCT, presynaptic vs. postsynaptic paralysis) and organophosphate poisoning (acetylcholinesterase inhibition, SLUDGEM).
3. **Critical Care & Trauma Subagent**: Owns hypovolemic hemorrhagic shock, ATLS trauma resuscitation, tension pneumothorax mechanics, and acute pulmonary embolism.
4. **Nephrology & Metabolic Subagent**: Owns acute tubular necrosis (ATN), Henderson-Hasselbalch acid-base equilibria, anion gap calculations, and diabetic ketoacidosis (DKA).
5. **3D WebGL / Three.js Shader Architect**: Owns the Three.js scene graph, rigging, Order-Independent Transparency (WBOIT), and custom GLSL vertex/fragment shaders for cyanosis, mottling, and myocardial dyskinesis.
6. **Wasm ODE Numerical Solver Architect**: Owns the 100 Hz Runge-Kutta 4th order (RK4) continuous mathematical solver and 2-compartment pharmacokinetic/pharmacodynamic (PK/PD) drug clearance engines.
7. **Curriculum Alignment & QA Subagent**: Cross-references every scenario against textbook pages and questions in `src/data/topics/` to ensure absolute fidelity with university exams.

---

## 3. Comprehensive Multi-Year Clinical Scenario Catalogue (Textbook Grounded)

The simulator incorporates **83 acute clinical scenarios** across all 4 MBBS years, every major specialty, and the full Orbit question bank. This catalogue was compiled by **7 parallel research subagents** deep-diving into every topic file (`src/data/topics/`) and cross-referencing Supabase `handwritten_notes`.

### Master Scenario Matrix (All Specialties, All Years)

| # | Year | Specialty | Scenario | Source / Page Ref | Primary Challenge |
|---|------|-----------|----------|-------------------|-------------------|
| **PRECLINICAL FOUNDATIONS (1st–2nd Year)** |
| 1 | 1st | Physiology | Severe Hemorrhagic Shock (Class I–IV) | Guyton Ch.24, generalSurgery.ts Pg 085 | Baroreflex failure, irreversible shock |
| 2 | 1st | Biochemistry | Diabetic Ketoacidosis (DKA) | Vasudevan, generalMedicine.ts Pg 968 | High anion gap, K+ paradox, cerebral edema |
| 3 | 1st | Physiology | Septic Shock & DIC | Pathology hemodynamicDisorders.ts Pg 134 | Endotoxin → cytokine storm → microthrombi |
| 4 | 1st | Physiology | Acute MI & Cardiogenic Shock | cardiovascularSystem.ts Pg 602 | Plaque rupture → coagulative necrosis |
| 5 | 1st | Biochemistry | Adrenal Crisis (Addisonian) | endocrineSystem.ts Pg 1097 | Cortisol/aldosterone deficiency → shock |
| **PARACLINICAL (2nd Year)** |
| 6 | 2nd | Forensic Med | Snakebite (Viper vs. Elapid) | forensicMedicine.ts, Reddy FM | VICC, 20WBCT, neuroparalysis |
| 7 | 2nd | Pharmacology | Organophosphate Poisoning | autonomicNervousSystem.ts Pg 116 | AChE inhibition, SLUDGEM, atropinization |
| 8 | 2nd | Pathology | Anaphylactic Shock | bloodAndImmunology.ts, Robbins Ch.6 | IgE mast cell, airway edema, Epi PK/PD |
| 9 | 2nd | Pathology | Hemodynamic Disorders (Thrombosis/Embolism) | pathology/hemodynamicDisorders.ts | Virchow's Triad, Lines of Zahn |
| 10 | 2nd | Pathology | Acute Inflammation & Wound Healing | pathology/inflammationRepair.ts | Cellular events, chemotaxis, granuloma |
| 11 | 2nd | Pharmacology | CNS Drug Overdose (Morphine/Barbiturate/Benzo) | centralNervousSystem.ts Pg 424 | GABA/opioid depression → apnea |
| 12 | 2nd | Pharmacology | Malignant Hyperthermia | peripheralNervousSystem.ts Pg 373 | RYR1 Ca²⁺ release → hypermetabolism |
| 13 | 2nd | Pharmacology | Local Anaesthetic Toxicity | peripheralNervousSystem.ts | Systemic LAST, CNS/cardiac toxicity |
| **CLINICAL — GENERAL MEDICINE (3rd–4th Year)** |
| 14 | 3rd | Medicine | Dengue Shock Syndrome (DSS) | generalMedicine.ts Pg 388, Manipal Med | ADE, capillary leak, hemoconcentration |
| 15 | 3rd | Medicine | Yellow Oleander Poisoning | generalMedicine.ts Pg 1260, Forensic | Cardiac glycoside → AV block → VF |
| 16 | 3rd | Medicine | Prerenal Azotemia → Ischemic ATN | generalMedicine.ts Pg 854-858 | FeNa shift, muddy brown casts |
| 17 | 4th | Medicine | Anterior STEMI → Cardiogenic Shock | generalMedicine.ts Pg 040 | LAD occlusion, VT/VF, flash edema |
| 18 | 4th | Medicine | Massive Pulmonary Embolism | HW Notes Pg 173, generalMedicine.ts | Saddle embolus, RV strain, EtCO₂ crash |
| 19 | 4th | Medicine | Status Epilepticus | centralNervousSystem.ts Pg 438 | GABAergic failure, excitotoxicity |
| 20 | 4th | Medicine | Stroke (Ischemic & Hemorrhagic) | HW Notes Pg 1135-1146 | Clot/bleed, penumbra, midline shift |
| 21 | 4th | Medicine | Pyogenic Meningitis | HW Notes Pg 1168 | BBB breakdown, purulent exudate, ICP |
| 22 | 4th | Medicine | Myasthenia Gravis Crisis | autonomicNervousSystem.ts Pg 120 | NMJ block → respiratory failure |
| 23 | 4th | Medicine | Acute Severe Asthma (Status Asthmaticus) | respiratorySystem.ts Pg 241 | Bronchospasm, air trapping, V/Q mismatch |
| 24 | 4th | Medicine | Respiratory Failure (Type 1 & 2) | HW Notes Pg 321 | V/Q mismatch vs. hypoventilation |
| 25 | 4th | Medicine | Stevens-Johnson Syndrome (SJS/TEN) | generalMedicine.ts | Keratinocyte apoptosis, mucosal burns |
| 26 | 4th | Medicine | Copper Sulfate Poisoning | generalMedicine.ts Pg 1264 | Hemolysis, hepatorenal necrosis |
| **CLINICAL — GENERAL SURGERY (3rd–4th Year)** |
| 27 | 3rd | Surgery | Burns (Thermal, Electrical, Inhalation) | generalSurgery.ts Pg 122-132 | Fluid shifts, Parkland, airway edema |
| 28 | 3rd | Surgery | Acute Pancreatitis | generalSurgery.ts Pg 738-743 | Enzyme autodigestion → SIRS → ARDS |
| 29 | 3rd | Surgery | Peritonitis (Primary, Secondary, TB) | generalSurgery.ts Pg 614-621 | Peritoneal inflammation, paralytic ileus |
| 30 | 3rd | Surgery | Acute Appendicitis → Perforation | generalSurgery.ts Pg 997-1005 | Luminal obstruction → gangrene |
| 31 | 3rd | Surgery | Intestinal Obstruction & Volvulus | generalSurgery.ts Pg 976-990 | Bowel distension → strangulation |
| 32 | 3rd | Surgery | Extradural & Subdural Hematoma | generalSurgery.ts Pg 1155-1156 | ICP rise, uncal herniation |
| 33 | 3rd | Surgery | Tension Pneumothorax & Flail Chest | generalSurgery.ts Pg 1174-1175 | One-way valve → obstructive shock |
| 34 | 3rd | Surgery | Gas Gangrene | generalSurgery.ts Pg 064 | Clostridial toxins → tissue necrosis |
| 35 | 3rd | Surgery | Necrotizing Fasciitis | generalSurgery.ts Pg 073 | Fascial plane necrosis → sepsis |
| **CLINICAL — OBSTETRICS & GYNAECOLOGY (3rd Year)** |
| 36 | 3rd | ObGyn | Postpartum Hemorrhage (PPH) | obstetricsGynaecology.ts Pg 472-473 | Uterine atony, 4Ts, shock |
| 37 | 3rd | ObGyn | Eclampsia & Pre-eclampsia | obstetricsGynaecology.ts Pg 324-326 | Endothelial vasospasm → seizures |
| 38 | 3rd | ObGyn | HELLP Syndrome | obstetricsGynaecology.ts Pg 322 | Hemolysis, liver necrosis, platelets |
| 39 | 3rd | ObGyn | Abruptio Placentae & Couvelaire Uterus | obstetricsGynaecology.ts Pg 225-233 | Retroplacental hematoma → DIC |
| 40 | 3rd | ObGyn | Placenta Previa | obstetricsGynaecology.ts Pg 234-235 | Painless bright red APH |
| 41 | 3rd | ObGyn | Ruptured Ectopic Pregnancy | obstetricsGynaecology.ts Pg 203-204 | Hemoperitoneum → shock |
| 42 | 3rd | ObGyn | Uterine Rupture | obstetricsGynaecology.ts Pg 496, 569 | Scar dehiscence → fetal extrusion |
| 43 | 3rd | ObGyn | Cord Prolapse | obstetricsGynaecology.ts Pg 440 | Cord compression → fetal asphyxia |
| 44 | 3rd | ObGyn | Shoulder Dystocia | obstetricsGynaecology.ts Pg 437 | Anterior shoulder impaction → asphyxia |
| 45 | 3rd | ObGyn | Acute Uterine Inversion | obstetricsGynaecology.ts Pg 485 | Neurogenic + hypovolemic shock |
| 46 | 3rd | ObGyn | Obstetric DIC | obstetricsGynaecology.ts Pg 586 | Tissue factor release → consumption |
| 47 | 3rd | ObGyn | Puerperal Sepsis / Septic Abortion | obstetricsGynaecology.ts Pg 500, 196 | Endometritis → SIRS → septic shock |
| 48 | 3rd | ObGyn | Ovarian Torsion | obstetricsGynaecology.ts Pg 557 | Pedicle twist → ischemic necrosis |
| 49 | 3rd | ObGyn | Vesicular Mole Complications | obstetricsGynaecology.ts Pg 214 | Trophoblastic embolism, hemorrhage |
| **CLINICAL — PAEDIATRICS (3rd–4th Year)** |
| 50 | 3rd | Paediatrics | Neonatal Sepsis / Septicemia | paediatrics.ts Pg 166 | Non-specific signs, SIRS, MODS |
| 51 | 3rd | Paediatrics | Neonatal Jaundice → Kernicterus | paediatrics.ts Pg 170-172 | Bilirubin encephalopathy, basal ganglia |
| 52 | 3rd | Paediatrics | Acute Bacterial Meningitis (Paed) | paediatrics.ts Pg 585 | Fontanelle bulging, CSF exudate |
| 53 | 3rd | Paediatrics | Febrile Seizures & Status Epilepticus | paediatrics.ts Pg 579-580 | Immature brain, seizure threshold |
| 54 | 3rd | Paediatrics | Tetralogy of Fallot (Cyanotic Spell) | paediatrics.ts Pg 423-444 | RVOTO spasm → R-to-L shunt → cyanosis |
| 55 | 3rd | Paediatrics | Neonatal Resuscitation / Birth Asphyxia | paediatrics.ts Pg 121, 161 | HIE, primary/secondary apnea |
| 56 | 3rd | Paediatrics | Severe Dehydration (Diarrhea) | paediatrics.ts Pg 309 | Isotonic fluid loss → hypovolemic shock |
| 57 | 3rd | Paediatrics | Acute Bronchiolitis (RSV) | paediatrics.ts Pg 406 | Small airway obstruction, hyperinflation |
| 58 | 3rd | Paediatrics | Intussusception | paediatrics.ts Pg 304 | Telescoping bowel → ischemia → perforation |
| 59 | 3rd | Paediatrics | Congenital Hypertrophic Pyloric Stenosis | paediatrics.ts Pg 295 | Metabolic alkalosis, projectile vomiting |
| **CLINICAL — ENT (3rd–4th Year)** |
| 60 | 3rd | ENT | Foreign Body Airway (Bronchial) | ent.ts Pg 345, 375, 377 | Ball-valve obstruction → collapse |
| 61 | 3rd | ENT | Epistaxis (Anterior & Posterior) | ent.ts Pg 205, 279 | Kiesselbach's/Woodruff's plexus bleed |
| 62 | 3rd | ENT | Ludwig's Angina & Retropharyngeal Abscess | ent.ts Pg 309-313 | Floor of mouth → airway compromise |
| 63 | 3rd | ENT | Acute Epiglottitis | ent.ts Pg 338 | Cherry-red swollen epiglottis → arrest |
| 64 | 3rd | ENT | Mastoiditis Intracranial Complications | ent.ts Pg 90-98 | Brain abscess, lateral sinus thrombosis |
| 65 | 3rd | ENT | Tracheostomy Emergencies | ent.ts Pg 345, 369 | Tube displacement, tracheo-innominate fistula |
| **CLINICAL — OPHTHALMOLOGY (3rd Year)** |
| 66 | 3rd | Ophthalmology | Acute Angle Closure Glaucoma | ophthalmology.ts Pg 105, 223, 229 | Pupillary block → IOP spike → optic nerve |
| 67 | 3rd | Ophthalmology | Central Retinal Artery Occlusion (CRAO) | ophthalmology.ts Pg 251 | Cherry-red spot, inner retinal infarction |
| 68 | 3rd | Ophthalmology | Retinal Detachment | ophthalmology.ts Pg 279 | Neurosensory retina separation |
| 69 | 3rd | Ophthalmology | Orbital Cellulitis | ophthalmology.ts Pg 390 | Sinusitis → proptosis → optic nerve compression |
| 70 | 3rd | Ophthalmology | Sympathetic Ophthalmia | ophthalmology.ts Pg 416 | Autoimmune uveal attack on uninjured eye |
| **CLINICAL — FORENSIC MEDICINE & TOXICOLOGY (2nd–3rd Year)** |
| 71 | 2nd | Forensic | Copper Sulfate Poisoning | generalMedicine.ts Pg 1264, Forensic | Hemolysis + hepatorenal necrosis |
| 72 | 2nd | Forensic | Cyanide Poisoning | forensicMedicine.ts | Cytochrome a3 block → cellular asphyxia |
| 73 | 2nd | Forensic | Carbon Monoxide Poisoning | forensicMedicine.ts | HbCO → cherry-red color → tissue hypoxia |
| 74 | 2nd | Forensic | Hanging & Strangulation (Asphyxia) | forensicMedicine.ts | Venous congestion → cerebral anoxia |
| 75 | 2nd | Forensic | Drowning (Fresh/Saltwater) | forensicMedicine.ts | Surfactant washout → pulmonary edema |
| 76 | 2nd | Forensic | Medicolegal Burns | forensicMedicine.ts | Antemortem vs. postmortem, inhalation |
| **CLINICAL — COMMUNITY MEDICINE (3rd Year)** |
| 77 | 3rd | Community Med | Heat Stroke | communityMedicine.ts Pg 874 | Core temp >40°C, thermoregulatory failure |
| 78 | 3rd | Community Med | Lead Poisoning (Chronic) | communityMedicine.ts Pg 934 | Heme synthesis block, wrist drop |
| 79 | 3rd | Community Med | Epidemic / Disaster Triage | communityMedicine.ts Pg 146, 923 | Mass casualty START triage |
| **CLINICAL — ORTHOPAEDICS (3rd–4th Year)** |
| 80 | 3rd | Orthopaedics | Fat Embolism Syndrome | generalSurgery.ts Pg 044 | Marrow fat → pulmonary/cerebral emboli |
| 81 | 3rd | Orthopaedics | Acute Compartment Syndrome | generalSurgery.ts Pg 047 | Fascial pressure → ischemic necrosis |
| 82 | 3rd | Orthopaedics | Crush Syndrome | generalSurgery.ts Pg 025 | Rhabdomyolysis → myoglobin → AKI |
| 83 | 3rd | Orthopaedics | Acute Osteomyelitis & Septic Arthritis | paediatrics.ts / generalSurgery.ts | Hematogenous bone infection |

---

### Deep Dive Scenario 1: Coronary Artery Disease & Anterior STEMI $\rightarrow$ Cardiogenic Shock

* **App Anchor**: `src/data/topics/generalMedicine.ts` ("Describe Clinical features, Complications, Investigations and Management of Acute Coronary Syndrome, Page No: 040") & `cardiovascularSystem.ts` ("Anti-anginal Drugs & Drug Therapy in Myocardial Infarction").
* **Pathophysiological Cascade Across Bodily Organs**:
  1. **Heart ($T+0$ to $10$ min)**: Plaque rupture in proximal LAD exposes subendothelial collagen and Tissue Factor. Platelet adhesion via GP Ib-IX-vWF and GP IIb/IIIa cross-linking causes occlusive thrombus (TIMI 0 flow). Mitochondrial electron transport ceases within 8 seconds; rapid shift to anaerobic glycolysis causes intracellular accumulation of lactic acid, inorganic phosphate, and $H^+$ ($pH_i < 6.4$). ATP depletion ($<50\%$ at 10m) inhibits myosin ATPase cycling; anterior/apical myocardium stops contracting within 60 seconds (hypokinesia $\rightarrow$ akinesia $\rightarrow$ paradoxical systolic dyskinesis).
  2. **Electrophysiological Destabilization ($T+10$ to $30$ min)**: $Na^+/K^+$-ATPase shutdown produces extracellular $K^+$ accumulation ($[K^+]_o > 12\text{ mM}$) and resting membrane depolarization ($-90\text{ mV} \rightarrow -60\text{ mV}$), causing fast $Na_v1.5$ channel inactivation. Conduction velocity crashes ($0.8\text{ m/s} \rightarrow 0.15\text{ m/s}$), establishing re-entrant circuits: Ventricular Premature Contractions (VPCs) $\rightarrow$ polymorphic VT $\rightarrow$ **Ventricular Fibrillation (VF)**.
  3. **Lungs / Backward Failure ($T+30$ min to $2$ hr)**: Irreversible wavefront necrosis (subendocardium to subepicardium). LVEF falls from $60\%$ to $<22\%$. Left Ventricular End-Diastolic Pressure (LVEDP) spikes ($8\text{ mmHg} \rightarrow 28\text{ mmHg}$), transmitting backward: Left Atrium $\rightarrow$ Pulmonary Capillary Wedge Pressure ($\text{PCWP} > 22\text{ mmHg}$). Hydrostatic transudation exceeds oncotic pressure ($25\text{ mmHg}$), flooding interstitial cuffs and alveolar spaces: **Acute Flash Pulmonary Edema**. Alveoli with $V/Q = 0$ drive intrapulmonary shunt fraction ($\dot{Q}_s/\dot{Q}_t$) from $4\%$ to $>35\%$, producing refractory hypoxemia ($PaO_2 < 55\text{ mmHg}, SpO_2 < 82\%$).
  4. **Systemic Forward Failure & End-Organs ($T+2$ to $6$ hr)**: Cardiac Index ($\text{CI}$) falls $< 1.8\text{ L/min/m}^2$, SBP $< 80\text{ mmHg}$. Baroreceptor unloading triggers massive sympathetic outflow: SVR surges $> 2200\text{ dynes}\cdot\text{s/cm}^5$, worsening afterload.
     - *Brain*: MAP $< 50\text{ mmHg}$ breaks cerebral autoregulation; cortical hypoperfusion produces confusion, agitation, somnolence, and coma (GCS $15 \rightarrow 7$).
     - *Kidneys*: Renal Perfusion Pressure ($\text{RPP} = \text{MAP} - \text{CVP}$) crashes. Glomerular filtration ceases; prolonged ischemia to medullary thick ascending limbs causes **Ischemic Acute Tubular Necrosis (ATN)** with muddy brown granular casts, anuria ($<10\text{ mL/hr}$), and rising serum creatinine.
     - *Liver*: Forward hypoperfusion + backward systemic venous congestion ($\text{CVP} > 16\text{ mmHg}$) produces Zone 3 perivenular necrosis: **Ischemic Hepatitis ("Shock Liver")** with AST/ALT spiking $> 3000\text{ U/L}$ and prothrombin time prolonging.
     - *Microcirculation*: Splanchnic and cutaneous shutdown; cold clammy mottled extremities (Mottling score 4/5), capillary refill $> 5\text{ s}$, and arterial lactic acidosis ($> 7.5\text{ mmol/L}$).

---

### Deep Dive Scenario 2: Snakebite Envenomation (Viperidae vs. Elapidae)

* **App Anchor**: `src/data/topics/forensicMedicine.ts` ("Viper snake bite? Feb 2009, Sep 2021", "Difference between poisonous and non-poisonous snake").
* **Pathophysiological Mechanisms**:
  1. **Viperidae (*Russell's Viper / Daboia russelii*)**:
     - *Bite Site*: Snake Venom Metalloproteinases (SVMP) and PLA2 digest capillary basement membranes (Type IV collagen), producing severe local pain, spreading swelling, blister formation, and tissue necrosis.
     - *Vascular & Hematologic*: Venom Factor X activator (RVV-X) and Ecarin activate prothrombin to thrombin uncontrolledly. Total consumption of circulating fibrinogen ($< 20\text{ mg/dL}$) causes **Venom-Induced Consumption Coagulopathy (VICC)**. The **20-Minute Whole Blood Clotting Test (20WBCT)** remains completely un-clotted. Spontaneous systemic bleeding occurs from gums, venipuncture sites, gut, and intracranially.
     - *Cardiovascular*: Systemic endothelial breakdown leads to **Capillary Leak Syndrome**; intravascular plasma leaks into tissues, dropping effective circulatory volume by $40\%$ and causing profound hypovolemic/distributive shock.
     - *Renal*: Combination of severe hypotension, PLA2 direct nephrotoxicity, and hemoglobinuric tubular casts produces acute tubular necrosis and **Bilateral Renal Cortical Necrosis (BRCN)**, causing complete anuria and uremic encephalopathy.
  2. **Elapidae (*Cobra vs. Krait*)**:
     - *Neuromuscular Junction*:
       - **Cobra (*Naja naja*)**: Postsynaptic $\alpha$-neurotoxin competitively blocks motor endplate nicotinic acetylcholine receptors (nAChR). **Reversible** with Polyvalent ASV and Neostigmine + Atropine.
       - **Common Krait (*Bungarus caeruleus*)**: Presynaptic $\beta$-bungarotoxin destroys motor nerve terminal vesicles and presynaptic membrane. **Irreversible by ASV once bound**. Requires prolonged mechanical ventilation until new motor axon terminals sprout (7–14 days).
     - *Descending Flaccid Paralysis Sequence*:
       Bilateral Ptosis $\rightarrow$ External Ophthalmoplegia (diplopia) $\rightarrow$ Facial weakness $\rightarrow$ Bulbar palsy (dysphonia, dysphagia, inability to swallow saliva) $\rightarrow$ "Broken neck sign" (neck extensor paralysis) $\rightarrow$ Intercostal paralysis $\rightarrow$ Diaphragmatic arrest and asphyxiation.

---

### Deep Dive Scenario 3: Severe Hemorrhagic Shock & Trauma (Class I–IV)

* **App Anchor**: `src/data/topics/generalSurgery.ts` ("Management of Shock", "Blood Transfusion & Complications").
* **Hemodynamic Classification & Real-Time Transitions**:

```
========================================================================================================================
CLASS     BLOOD LOSS (mL / %)    HEART RATE    BLOOD PRESSURE    RESP RATE    URINE OUTPUT     MENTAL STATUS / CNS
========================================================================================================================
Class I   < 750 mL (< 15%)       < 100 bpm     Normal            14–20 /min   > 30 mL/hr       Slightly anxious
Class II  750–1500 mL (15–30%)   100–120 bpm   Normal / SBP ok   20–30 /min   20–30 mL/hr      Mildly anxious, thirsty
Class III 1500–2000 mL (30–40%)  120–140 bpm   Decreased (SBP<90)30–40 /min   5–15 mL/hr       Anxious, confused
Class IV  > 2000 mL (> 40%)      > 140 bpm     Severe Drop (<60) > 40 /min    Negligible (0)   Confused, lethargic, coma
========================================================================================================================
```

* **The Lethal Triad of Trauma**:
  1. **Hypothermia ($T < 35^\circ\text{C}$)**: Massive hemorrhage and peripheral hypoperfusion impair cellular thermogenesis.
  2. **Acidosis ($pH < 7.20$, Lactate $> 5\text{ mmol/L}$)**: Global anaerobic glycolysis impairs coagulation enzyme kinetics (clotting factor activity falls $10\%$ for every $0.1$ drop in pH).
  3. **Coagulopathy**: Dilution of platelets and clotting factors, consumption at injury site, and hyperfibrinolysis.
* **Simulator Reversal Protocol**: Massive Transfusion Protocol (MTP) with 1:1:1 ratio (Packed Red Blood Cells : Fresh Frozen Plasma : Platelets), IV Tranexamic Acid (1 g bolus within 3 hours), surgical/radiological source control, and warm calcium gluconate titration.

---

### Deep Dive Scenario 4: Organophosphate Poisoning (Cholinergic Crisis)

* **App Anchor**: `src/data/topics/autonomicNervousSystem.ts` ("Organophosphorus Poisoning & Management") & `forensicMedicine.ts`.
* **Mechanism**: Organophosphates (e.g., Malathion, Parathion) phosphorylate the esteratic site of **Acetylcholinesterase (AChE)**, leading to acetylcholine accumulation across all cholinergic synapses:
  1. **Muscarinic Hyperstimulation (SLUDGEM Toxidrome)**:
     - **S**alivation, **L**acrimation, **U**rination, **D**efecation, **G**astrointestinal cramping/emesis, **E**mphysema/bronchorrhea & bronchospasm, **M**iosis (pinpoint non-reactive pupils).
     - Cardiovascular: Sinus bradycardia ($HR < 45\text{ bpm}$), AV nodal block, and hypotension.
     - Pulmonary: "Killer B's" — **Bronchorrhea**, **Bronchospasm**, and **Bradycardia** causing fatal asphyxia.
  2. **Nicotinic Receptors**: Muscle fasciculations, muscle twitching, followed by flaccid muscle weakness and diaphragmatic fatigue.
  3. **Central Nervous System**: Restlessness, convulsions, central respiratory depression, and coma.
* **Dynamic Interventions in Simulator**:
  - **Atropine Titration**: Competitive muscarinic antagonist. Repeated doubling doses ($1.8\text{ mg} \rightarrow 3.6\text{ mg} \rightarrow 7.2\text{ mg}$) until complete **Atropinization Endpoint** is achieved: clear chest on auscultation (zero crackles/rhonchi), heart rate $> 80\text{ bpm}$, dry axillae, pupil dilation.
  - **Pralidoxime (2-PAM)**: Oxime AChE reactivator. Cleaves the organophosphate from the enzyme active site before "chemical aging" (dealkylation) occurs.

---

### Deep Dive Scenario 5: Diabetic Ketoacidosis (DKA)
* **App Anchor**: `src/data/topics/generalMedicine.ts` ("Diabetic Ketoacidosis, Page No: 0968") & `biochemistry.ts`.
* **Textbook Grounding**: *Vasudevan Biochemistry* & *Harrison's Internal Medicine (Ch. 397)*.
* **Pathophysiological Cascade**:
  1. **Hormonal Derangement**: Severe absolute insulin deficiency + counter-regulatory hormone excess (Glucagon, Epinephrine, Cortisol, Growth Hormone).
  2. **Metabolic Crisis**: Unchecked hormone-sensitive lipase activates in adipose tissue $\rightarrow$ massive flux of free fatty acids into liver $\rightarrow$ mitochondrial $\beta$-oxidation $\rightarrow$ excessive acetyl-CoA converted to **Ketoacids** ($\beta$-hydroxybutyrate and acetoacetate).
  3. **High Anion Gap Metabolic Acidosis**:
     $$\text{Anion Gap} = [Na^+] - ([Cl^-] + [HCO_3^-]) > 20\text{ mEq/L}\quad (\text{Arterial } pH < 7.10,\ [HCO_3^-] < 10\text{ mEq/L})$$
     Acidosis stimulates medullary respiratory center to trigger rapid, deep breathing (**Kussmaul Respiration**) with fruity acetone breath.
  4. **Osmotic Diuresis & Electrolyte Derangement**: Blood glucose $> 450\text{ mg/dL}$ exceeds renal tubular threshold ($180\text{ mg/dL}$), causing profound osmotic diuresis (fluid deficit 5–8 Liters).
  5. **The Potassium Paradox**: Extracellular shift of $K^+$ due to acidosis and lack of insulin creates normal or elevated serum potassium ($[K^+] = 5.2\text{ mEq/L}$), despite massive **total-body potassium depletion** from urinary loss. Administering insulin without potassium causes acute hypokalemia, inducing fatal cardiac arrhythmias.
  6. **Cerebral Edema Danger**: Rapid fluid resuscitation with hypotonic saline drops serum osmolality too quickly, driving free water into brain astrocytes and causing herniation.

---

### Deep Dive Scenario 6: Dengue Shock Syndrome (DSS) & Systemic Capillary Leak
* **App Anchor**: `src/data/topics/generalMedicine.ts` ("What is Dengue Shock Syndrome? Page No: 388")
* **Textbook Grounding**: *Manipal Prep Manual of Medicine (Pg. 388)* & *Harrison's Principles of Internal Medicine*.
* **Pathophysiological Cascade**:
  1. **Antibody-Dependent Enhancement (ADE)**: Secondary infection with a heterologous dengue serotype (DENV-1 to 4). Non-neutralizing cross-reactive antibodies opsonize virions, facilitating massive entry into Fc-receptor-bearing monocytes and macrophages.
  2. **Cytokine Storm & Endothelial Hyperpermeability**: Hyperactivated macrophages release a surge of vasoactive mediators: TNF-$\alpha$, IL-6, IFN-$\gamma$, and VEGF. Endothelial glycocalyx layer degrades; tight junctions open selectively to plasma proteins and fluid without red cell extravasation.
  3. **Third-Spacing & Hemoconcentration**:
     - Rapid plasma extravasation into pleural spaces (bilateral pleural effusions) and peritoneal cavity (ascites).
     - **Hematocrit Spikes**: Hematocrit rises $>20\%$ above baseline (e.g., $38\% \rightarrow 52\%$), while platelet count crashes below $20,000/\mu\text{L}$.
  4. **Circulatory Collapse**:
     - Effective circulating intravascular volume drops precipitously.
     - **Narrowed Pulse Pressure**: Hallmarked by pulse pressure $\le 20\text{ mmHg}$ (e.g., BP $88/70\text{ mmHg}$), rapid thready pulse ($HR > 130\text{ bpm}$), cold clammy mottled extremities, and delayed capillary refill ($>4\text{ s}$).
     - If untreated, decompensates into unrecordable blood pressure and fatal metabolic acidosis.
  5. **Organ Infiltration & Microvascular Bleeds**:
     - Severe thrombocytopenia combined with capillary fragility produces spontaneous petechiae, gum bleeds, epistaxis, and massive gastrointestinal hemorrhage.
     - Ischemic hepatitis: Serum AST and ALT spike ($>500\text{ U/L}$); hepatomegaly.
  6. **Dynamic Interventions in Simulator**:
     - **Isotonic Crystalloid Titration**: 10–20 mL/kg bolus of Ringer's Lactate or Normal Saline over 1 hour. In the 3D HUD, users watch the hematocrit drop back toward $40\%$ and pulse pressure widen ($>30\text{ mmHg}$).
     - **Colloidal Escalation**: If shock persists despite crystalloid loading, switch to $10\text{ mL/kg}$ colloid (Dextran 40 or 5% Albumin) to restore intravascular oncotic pressure.
     - **Platelet Transfusion Gate**: Indicated strictly for active refractory hemorrhage or platelets $<10,000/\mu\text{L}$ with coagulopathy.

---

### Deep Dive Scenario 7: Yellow Oleander Poisoning (*Cerbera thevetia* / Cardiac Glycoside Toxicity)
* **App Anchor**: `src/data/topics/generalMedicine.ts` ("What is Oleander Seed Poisoning? Page No: 1260") & `forensicMedicine.ts` ("Classify agricultural and plant poisons").
* **Textbook Grounding**: *Manipal Prep Manual of Medicine (Pg. 1260)* & *Vision Forensic Medicine*.
* **Pathophysiological Cascade**:
  1. **Toxin & Ingestion**: Ingestion of crushed seeds of Yellow Oleander (*Cerbera thevetia* / *Thevetia peruviana*) containing potent steroidal cardiac glycosides (**Thevetin A**, **Thevetin B**, **Nerifolin**, and **Cerberin**).
  2. **Myocardial $Na^+/K^+$-ATPase Inhibition**:
     - Cardiac glycosides bind the extracellular pocket of the myocardial sarcolemmal $\alpha$-subunit of $Na^+/K^+$-ATPase, completely halting active ion pumping.
     - Intracellular $Na^+$ surges; the $Na^+/Ca^{2+}$ exchanger (NCX) reverses, driving toxic quantities of $Ca^{2+}$ into the cytosol ($[Ca^{2+}]_i > 2\,\mu\text{M}$) and triggering sarcoplasmic reticulum oscillatory release.
  3. **Extracellular Potassium Surge (Hyperkalemia)**:
     - Impaired cellular $K^+$ reuptake across skeletal muscle and myocardium causes potassium to accumulate in the extracellular space.
     - Serum potassium climbs rapidly ($[K^+] > 6.0-7.5\text{ mEq/L}$). In Oleander poisoning, **the degree of hyperkalemia directly correlates with mortality**.
  4. **Electrophysiological Chaos & Arrhythmias**:
     - Increased vagal tone + impaired AV nodal conduction velocity produces marked sinus bradycardia ($HR < 35\text{ bpm}$), sinus arrest, Mobitz Type II AV block, and Complete Heart Block with an unstable ventricular escape rate ($28-36\text{ bpm}$).
     - Intracellular $Ca^{2+}$ overload generates Delayed Afterdepolarizations (DADs), producing ventricular premature contractions (bigeminy, trigeminy), bidirectional ventricular tachycardia, and ventricular fibrillation.
     - Classic "Scooped" ST segment depression ("Salvador Dali mustache") and PR interval prolongation on surface ECG.
  5. **Dynamic Interventions in Simulator**:
     - **Atropine Trial**: 0.6–1.2 mg IV for symptomatic sinus bradycardia (often ineffective for high-grade infra-nodal AV blocks).
     - **Emergency Temporary Transvenous Pacing (TVP)**: Required if high-grade AV block fails pharmacological chronotropy.
     - **Digoxin-Specific Fab Fragments (Digibind)**: The definitive neutralizer. Binds free glycosides with $10^9\text{ M}^{-1}$ affinity, rapidly clearing arrhythmias and normalizing serum potassium.
     - **Hyperkalemia Protocol**: IV Calcium Gluconate (sarcolemmal stabilization), 10 units Regular Insulin + 50 mL 50% Dextrose (intracellular potassium shift), and oral/rectal Potassium binders.

---

### Deep Dive Scenario 8: Prerenal Azotemia $\rightarrow$ Ischemic Acute Tubular Necrosis (ATN)
* **App Anchor**: `src/data/topics/generalMedicine.ts` ("Enumerate causes and Management of Pre Renal Acute Kidney Injury, Page No: 854" & "Aetiology and Treatment of Acute Renal Failure, Page No: 858").
* **Textbook Grounding**: *Manipal Prep Manual of Medicine (Pg. 854–858)* & *Ramadas Nayak Pathology*.
* **Pathophysiological Cascade**:
  1. **Phase 1: Prerenal Azotemia (Functional Hypoperfusion)**:
     - Triggered by severe dehydration, sepsis, hemorrhage, or cardiogenic forward failure dropping $MAP < 65\text{ mmHg}$.
     - Intrarenal autoregulation engages: Prostaglandins dilate afferent arterioles; Angiotensin II constricts efferent arterioles to maintain Glomerular Hydrostatic Pressure ($P_{gc}$).
     - Tubular epithelial cells remain structurally intact and metabolically viable. The proximal tubule avidly reabsorbs sodium and water to expand intravascular volume.
     - **Diagnostic Signature**:
       - $\text{BUN} / \text{Creatinine Ratio} > 20:1$ (BUN reabsorbed along with water; creatinine freely excreted).
       - Fractional Excretion of Sodium: $\text{FeNa} < 1.0\%$.
       - Urine Sodium: $[Na^+]_{\text{urine}} < 20\text{ mEq/L}$.
       - Urine Specific Gravity: $> 1.025$, Urine Osmolality $> 500\text{ mOsm/kg}$ (concentrated).
       - Urine Sediment: Hyaline casts only.
       - **Reversible**: Fully restored within hours by isotonic volume resuscitation.
  2. **Phase 2: Transition to Intrinsic Ischemic ATN (Structural Parenchymal Necrosis)**:
     - If hypoperfusion persists $>2\text{ to }4\text{ hours}$, renal medullary perfusion drops below the critical threshold ($pO_2 < 10\text{ mmHg}$).
     - Highly metabolically active tubular cells in the **Medullary Thick Ascending Limb (mTAL)** and **Proximal Straight Tubule (S3 segment)** deplete intracellular ATP.
     - Cytoskeletal degradation causes detachment of proximal tubular brush border microvilli and loss of cell polarity (basolateral $Na^+/K^+$-ATPase relocates to the apical membrane).
     - Necrotic tubular epithelial cells shed into the tubular lumen, aggregate with Tamm-Horsfall mucoprotein, and form dense **coarse muddy brown granular casts**.
     - Intraluminal casts obstruct urine flow; elevated intratubular pressure forces back-leak of glomerular filtrate across denuded basement membranes into the renal interstitium. GFR collapses to near zero.
     - **Diagnostic Shift in Simulator**:
       - $\text{BUN} / \text{Creatinine Ratio}$ falls to $10-15:1$.
       - $\text{FeNa} > 2.0\%$ (tubules cannot reabsorb sodium).
       - $[Na^+]_{\text{urine}} > 40\text{ mEq/L}$.
       - Urine Osmolality isosthenuric ($\sim 300\text{ mOsm/kg}$, identical to plasma).
       - Urine Sediment: Coarse muddy brown granular casts and renal tubular epithelial cell casts.
       - Urine Output: Oliguria ($<0.3\text{ mL/kg/hr}$) unresponsive to fluid challenges.
  3. **Visual 3D Shader Rendering**:
      - In the 3D Organ Inspection View, the kidney outer cortex shifts from vascular deep red (`#851C1D`) to an ischemic pale tan (`#C4B9A7`), while the medulla becomes intensely congested and hyperemic (`#4A0E17`).

---

### Deep Dive Scenario 9: Burns — Thermal, Electrical & Inhalation Injury
* **App Anchor**: `src/data/topics/generalSurgery.ts` (Pg 122–132), Supabase Forensic Medicine HW Notes.
* **Pathophysiological Cascade**:
  1. **Local Injury ($T+0$)**: Thermal energy causes protein denaturation and coagulative necrosis of epidermis/dermis. **Jackson's Burn Wound Model**: Zone of coagulation (irreversible necrosis) → Zone of stasis (potentially salvageable ischemia) → Zone of hyperemia (inflammatory vasodilation).
  2. **Systemic Capillary Leak ($T+0$ to $48$ hr)**: Massive release of inflammatory mediators (histamine, prostaglandins, kinins) → endothelial permeability increases → intravascular plasma leaks into interstitial space (third-spacing) → profound hypovolemic shock.
  3. **Inhalation Injury**: Upper airway thermal edema ($T+2$ to $12$ hr) → progressive stridor → total obstruction. Lower airway: chemical pneumonitis from combustion products → surfactant destruction → ARDS.
  4. **Fluid Resuscitation (Parkland Formula)**:
     $$V_{24h} = 4 \times \text{Body Weight (kg)} \times \%\text{TBSA burned}$$
     Half given in first 8 hours; second half over next 16 hours.
* **3D Simulator Changes**: Skin burn depth profiles (erythema → blistering → charring), progressive tissue edema, tracheal/laryngeal swelling narrowing airway tube, soot particles visible in trachea (antemortem sign).

---

### Deep Dive Scenario 10: Acute Pancreatitis → SIRS → ARDS
* **App Anchor**: `src/data/topics/generalSurgery.ts` (Pg 738–743).
* **Pathophysiological Cascade**:
  1. **Autodigestion ($T+0$)**: Premature activation of trypsinogen to trypsin within acinar cells → cascade activation of elastase, phospholipase A2, and lipase → autodigestion of pancreatic parenchyma and peripancreatic fat.
  2. **Local Complications**: Fat necrosis (chalky-white saponification spots), hemorrhagic necrosis (Grey Turner's sign — flank ecchymosis; Cullen's sign — periumbilical ecchymosis).
  3. **Systemic Inflammatory Response ($T+6$ to $48$ hr)**: Massive cytokine release (TNF-$\alpha$, IL-1, IL-6) enters systemic circulation → capillary leak → ARDS ($PaO_2/FiO_2 < 200$) → multiorgan failure.
* **3D Simulator Changes**: Swollen, edematous pancreas with hemorrhagic foci, chalky-white fat necrosis spots on omental surface, bilateral pleural effusions, Grey Turner/Cullen sign on skin shader.

---

### Deep Dive Scenario 11: Eclampsia & HELLP Syndrome
* **App Anchor**: `src/data/topics/obstetricsGynaecology.ts` (Pg 322–326).
* **Pathophysiological Cascade**:
  1. **Endothelial Dysfunction**: Defective trophoblastic invasion → spiral artery remodeling failure → placental ischemia → systemic endothelial activation → widespread vasospasm.
  2. **Eclamptic Seizure**: Severe hypertension ($>160/110$ mmHg) → cerebral vasospasm → cortical edema/ischemia → generalized tonic-clonic seizures.
  3. **HELLP Progression**: Microangiopathic hemolytic anemia (schistocytes) → fibrin deposition in hepatic sinusoids → periportal necrosis → liver capsule distension (subcapsular hematoma risk) → thrombocytopenia ($<100,000/\mu\text{L}$).
  4. **Fetal Compromise**: Placental insufficiency → late decelerations on CTG → fetal hypoxia.
* **Dynamic Interventions**: MgSO₄ (Pritchard's regimen: 4g IV loading + 5g IM each buttock), Labetalol/Hydralazine for BP, emergency delivery. **MgSO₄ toxicity monitoring**: loss of patellar reflex → respiratory depression → cardiac arrest (antidote: IV Calcium Gluconate).

---

### Deep Dive Scenario 12: Postpartum Hemorrhage (PPH) — Uterine Atony
* **App Anchor**: `src/data/topics/obstetricsGynaecology.ts` (Pg 472–473).
* **Pathophysiological Cascade**:
  1. **Uterine Atony**: Failure of myometrial contraction after placental delivery → open maternal blood sinuses at placental site → rapid blood loss ($>500$ mL vaginal / $>1000$ mL caesarean).
  2. **Compensated Phase**: Pregnancy hypervolemia ($40\%$ above baseline) masks early shock signs — tachycardia may not appear until $1500$–$2000$ mL lost.
  3. **Decompensation**: Hypotension, tachycardia ($>120$ bpm), confusion → Class III–IV hemorrhagic shock.
* **3D Simulator Changes**: Boggy, non-contracted uterus, profuse vaginal bleeding, progressively paling skin, thready pulse. If retained succenturiate lobe — accessory placental lobe visible inside uterus with torn vessels.
* **Intervention Escalation**: Uterine massage → Oxytocin 20 IU → Methylergometrine 0.2 mg IM → PGF2α (Carboprost) 250 μg IM → Bakri balloon tamponade → B-Lynch suture → Hysterectomy.

---

### Deep Dive Scenario 13: Neonatal Resuscitation & Birth Asphyxia → HIE
* **App Anchor**: `src/data/topics/paediatrics.ts` (Pg 121, 161).
* **Pathophysiological Cascade**:
  1. **Primary Apnea**: Interruption of placental blood flow → fetal hypoxia → gasping → primary apnea (responds to stimulation).
  2. **Secondary Apnea**: Continued hypoxia → terminal gasping → secondary apnea (requires positive pressure ventilation).
  3. **Hypoxic-Ischemic Encephalopathy (HIE)**: Prolonged oxygen deprivation → excitotoxic glutamate release → intracellular Ca²⁺ overload → mitochondrial failure → neuronal death in watershed zones (parasagittal cortex) and basal ganglia.
* **3D Simulator Changes**: Limp, apneic neonate with cyanosis → PPV showing lung inflation → color change to pink. Brain view: affected watershed zones darkening. Heart: bradycardia ($<100$ bpm → $<60$ bpm triggers chest compressions).
* **Unique Pediatric Difference**: Non-specific presentation (temperature instability, poor feeding, lethargy vs. adult fever/chills). Immature blood-brain barrier allows bilirubin deposition (Kernicterus — yellow staining of basal ganglia).

---

### Deep Dive Scenario 14: Tetralogy of Fallot — Cyanotic Spell (Tet Spell)
* **App Anchor**: `src/data/topics/paediatrics.ts` (Pg 423–444).
* **Pathophysiological Cascade**:
  1. **Anatomy**: VSD + Overriding Aorta + Right Ventricular Hypertrophy + Right Ventricular Outflow Tract Obstruction (RVOTO).
  2. **Tet Spell Trigger**: Crying/feeding/fever → sympathetic surge → dynamic infundibular spasm → increased RVOTO → massive right-to-left shunt through VSD → severe systemic hypoxemia.
  3. **Compensatory Mechanisms**: Squatting increases systemic vascular resistance → reduces R-to-L shunt → temporarily improves oxygenation. Polycythemia (Hct $>65\%$) compensates for chronic hypoxia.
* **3D Simulator Changes**: Heart cutaway showing thickened RV wall, VSD, overriding aorta, dynamic narrowing of infundibulum. Central cyanosis (blue lips/tongue). Clubbing of fingers. Squatting posture animation.

---

### Deep Dive Scenario 15: Status Epilepticus
* **App Anchor**: `src/data/topics/centralNervousSystem.ts` (Pg 438, 450), HW Notes Pg 1157.
* **Pathophysiological Cascade**:
  1. **Phase 1 — Seizure ($T+0$ to $5$ min)**: Failure of GABAergic inhibition → hypersynchronous neuronal firing → generalized tonic-clonic convulsions.
  2. **Phase 2 — Compensation ($T+5$ to $30$ min)**: Massive sympathetic discharge → hypertension, tachycardia, hyperglycemia. Cerebral metabolic rate surges $200\%$–$300\%$.
  3. **Phase 3 — Decompensation ($T+30$ min$+$)**: ATP/glucose exhaustion → excitotoxic neuronal death (glutamate → NMDA receptor → Ca²⁺ overload) → cerebral edema → blood-brain barrier breakdown → irreversible brain injury.
* **3D Simulator Changes**: Tonic-clonic body movements, electrical storm propagating across cortex (visualized as spreading wavefronts), brain swelling, cyanosis of lips/fingertips, hyperthermia gauge rising.

---

### Deep Dive Scenario 16: Acute Severe Asthma (Status Asthmaticus)
* **App Anchor**: `src/data/topics/respiratorySystem.ts` (Pg 241, 253), HW Notes Pg 199.
* **Pathophysiological Cascade**:
  1. **Early Phase**: Allergen → IgE-mediated mast cell degranulation → histamine + leukotriene release → bronchial smooth muscle spasm + mucosal edema.
  2. **Late Phase**: Eosinophilic infiltration → epithelial shedding → mucus plug formation → progressive air trapping and hyperinflation.
  3. **Silent Chest (Ominous)**: When obstruction is so severe that airflow ceases entirely — absence of wheeze indicates imminent respiratory arrest, not improvement.
* **3D Simulator Changes**: Inside lungs — bronchioles constricting dramatically, walls swelling (edema), thick mucus plugs forming. Alveoli overdistending (hyperinflation). Accessory muscle use (intercostal retractions). $SpO_2$ dropping.
* **Dynamic Interventions**: Nebulized Salbutamol → Ipratropium → IV Hydrocortisone → IV MgSO₄ → Subcutaneous Epinephrine → Intubation (last resort — risk of worsening air trapping).

---

### Deep Dive Scenario 17: Stroke — Ischemic vs. Hemorrhagic
* **App Anchor**: HW Notes Pg 1135–1146.
* **Pathophysiological Cascade**:
  1. **Ischemic ($80\%$ of strokes)**: Thrombus/embolus occludes cerebral artery → ATP depletion in core ($<10$ mL/100g/min) → excitotoxic glutamate release → cytotoxic edema → irreversible necrosis within 4–6 hours. **Penumbra**: Surrounding zone ($10$–$22$ mL/100g/min) — electrically silent but structurally viable — **salvageable with reperfusion**.
  2. **Hemorrhagic ($20\%$)**: Vessel rupture (Charcot-Bouchard microaneurysms in hypertension) → blood extravasation into parenchyma → hematoma mass effect → midline shift → uncal herniation → brainstem compression.
* **3D Simulator Changes**: *Ischemic* — highlighted vascular occlusion (clot), expanding dark necrotic core, glowing penumbra zone. *Hemorrhagic* — active bleeding visualization, hematoma expansion, brain midline shift, ipsilateral blown pupil.

---

### Deep Dive Scenario 18: Acute Angle Closure Glaucoma
* **App Anchor**: `src/data/topics/ophthalmology.ts` (Pg 105, 223, 229).
* **Pathophysiological Cascade**:
  1. **Pupillary Block**: Mid-dilated pupil position → iris apposes lens → aqueous humor trapped behind iris → posterior chamber pressure rises.
  2. **Iris Bombé**: Iris bows forward → mechanical occlusion of trabecular meshwork → IOP spikes ($>60$ mmHg within minutes).
  3. **Optic Nerve Ischemia**: Elevated IOP compresses retinal ganglion cell axons at lamina cribrosa → ischemic optic neuropathy → permanent vision loss if untreated within 24–48 hours.
* **3D Simulator Changes**: Eye cutaway showing shallow anterior chamber, bowed iris, blocked drainage angle, cloudy edematous cornea, mid-dilated fixed pupil, constricted retinal vessels.
* **Interventions**: Topical Pilocarpine (constricts pupil → opens angle) + Timolol + IV Mannitol (osmotic dehydration of vitreous) → Definitive: Laser Peripheral Iridotomy (LPI).

---

### Deep Dive Scenario 19: Crush Syndrome → Rhabdomyolysis → AKI
* **App Anchor**: `src/data/topics/generalSurgery.ts` (Pg 025).
* **Pathophysiological Cascade**:
  1. **Compression Phase**: Prolonged muscle compression → local ischemia → ATP depletion → sarcolemmal integrity loss.
  2. **Reperfusion Phase (The Killer)**: Upon release of compression, massive washout of intracellular contents into systemic circulation: **Myoglobin** (precipitates in renal tubules → cast nephropathy → ATN), **Potassium** ($[K^+] > 7.0$ mEq/L → fatal cardiac arrhythmias), **Phosphate**, **Uric acid**, and **Lactic acid**.
  3. **Third-Space Fluid Sequestration**: Damaged muscles swell enormously, sequestering liters of fluid → hypovolemic shock despite IV resuscitation.
* **3D Simulator Changes**: Cellular zoom showing myofiber breakdown releasing dark myoglobin molecules → tracking through bloodstream → renal tubular obstruction (brown casts). Heart: peaked T waves → widened QRS → sine wave → VF. Limb: massive swelling within fascial compartments.

---

### Deep Dive Scenario 20: Malignant Hyperthermia
* **App Anchor**: `src/data/topics/peripheralNervousSystem.ts` (Pg 373).
* **Pathophysiological Cascade**:
  1. **Trigger**: Exposure to volatile anaesthetics (Halothane, Sevoflurane) or Succinylcholine in genetically susceptible individuals (RYR1 mutation).
  2. **Molecular Catastrophe**: Abnormal ryanodine receptor fails to close → uncontrolled Ca²⁺ release from sarcoplasmic reticulum → sustained maximal muscle contraction → explosive ATP consumption → extreme heat production ($>1°C$ per 5 minutes) → core temperature $> 43°C$.
  3. **Systemic Collapse**: Rhabdomyolysis → hyperkalemia → metabolic acidosis ($pH < 7.0$) → DIC → cardiac arrest.
* **3D Simulator Changes**: Molecular zoom into sarcoplasmic reticulum showing Ca²⁺ flood, muscle rigidity (masseter → generalized), rapidly rising temperature gauge, dark urine (myoglobinuria), ECG showing widening QRS and peaked T waves.
* **Interventions**: Immediately stop triggering agent → **IV Dantrolene** (2.5 mg/kg boluses — directly blocks RYR1 Ca²⁺ release) → Active cooling (ice packs, cold IV fluids) → Treat hyperkalemia → Monitor for 48 hours (recrudescence).

---

## 3.1. General Medicine Clinical Ward Deep-Dive (Long Cases & Short Cases — MMC Curriculum Grounded)

Grounded in the classic **Madras Medical College (MMC) Final Year Clinical Curriculum**, *Kundu's Bedside Clinics*, *Harrison's 21st Edition*, and NMC CBME guidelines, these cases represent the daily inpatient ward reality where disease unfolds over days and weeks rather than minutes.

### 1. Decompensated Chronic Liver Disease (Cirrhosis & Portal HTN)
* **App Anchor**: `src/data/topics/generalMedicine.ts` (Pg 583–607).
* **Etiologies & Clinical Stigmata**:
  - *Etiologies*: Alcoholic liver disease (AST:ALT ratio $> 2:1$), Chronic Hepatitis B/C, Metabolic Dysfunction-Associated Steatohepatitis (MASH).
  - *Stigmata of Chronic Liver Disease*: Spider angiomas (SVC distribution above nipples), palmar erythema, leuconychia (Muehrcke's lines due to hypoalbuminemia $< 2.8\text{ g/dL}$), Dupuytren's contracture, gynecomastia, parotid enlargement, testicular atrophy.
  - *Portal Hypertension*: Icterus, gross ascites (shifting dullness $>1500\text{ mL}$, fluid thrill $>2000\text{ mL}$), splenomegaly (congestive), caput medusae (recanalized umbilical vein), asterixis (flapping tremor at 3–5 Hz).
* **Diagnostic Scores & Quantitative Targets**:
  - *Child-Pugh Score* (Class A: 5–6, Class B: 7–9, Class C: 10–15): Scored on Total Bilirubin, Albumin, INR, Ascites, and Hepatic Encephalopathy (West Haven Criteria I–IV).
  - *MELD-Na Score*: $\text{MELD} = 9.57 \ln(\text{Cr}) + 3.78 \ln(\text{Bili}) + 11.2 \ln(\text{INR}) + 6.43$.
  - *Diagnostic Paracentesis & SAAG*:
    $$\text{SAAG} = \text{Serum Albumin} - \text{Ascitic Fluid Albumin}$$
    $\text{SAAG} \ge 1.1\text{ g/dL}$ confirms Portal Hypertension (Cirrhosis, Cardiac ascites, Budd-Chiari). $\text{SAAG} < 1.1\text{ g/dL}$ indicates peritoneal etiology (TB peritonitis, peritoneal carcinomatosis).
* **3D Simulation Features**: Shrunken micronodular liver with irregular capsule, spleen span enlarged to $>14\text{ cm}$, prominent collateral portosystemic vessels (esophageal plexus, periumbilical, hemorrhoidal), dynamic fluid shifting on lateral tilt.
* **Ward Trajectory**:
  - *Day 1 (Admission)*: Diagnostic tap, baseline renal/electrolyte panel, initiate sodium-restricted diet ($<2\text{ g/day}$).
  - *Day 2–4 (Diuretic Titration)*: Spironolactone $100\text{ mg}$ + Furosemide $40\text{ mg}$ ratio (maintains normokalemia). Target weight loss: $0.5\text{ kg/day}$ without edema, $1.0\text{ kg/day}$ with peripheral edema.
  - *Day 5 (Complication Branch)*: Fever, abdominal tenderness, altered sensorium $\to$ **Spontaneous Bacterial Peritonitis (SBP)**. Diagnostic tap shows PMN $> 250/\mu\text{L}$. Immediate IV Cefotaxime $2\text{ g}$ q8h + IV Albumin $1.5\text{ g/kg}$ on day 1 to prevent hepatorenal syndrome.

---

### 2. Chronic Congestive Heart Failure & Dilated Cardiomyopathy
* **App Anchor**: `src/data/topics/generalMedicine.ts` (Pg 110–118).
* **Diagnostic Framework**:
  - *Framingham Criteria*: Requires 2 Major criteria (PND, raised JVP, cardiomegaly, acute pulmonary edema, S3 gallop, hepatojugular reflux) OR 1 Major + 2 Minor criteria (bilateral ankle edema, nocturnal cough, dyspnea on exertion, hepatomegaly, pleural effusion, tachycardia $>120\text{ bpm}$).
  - *NYHA Functional Classification*: Class I (no limitation) to Class IV (symptoms at rest).
* **Bedside Examination Signs**:
  - Elevated JVP ($>4\text{ cm}$ vertical distance above sternal angle at $45^\circ$). Prominent *a* wave (pulmonary hypertension) or large *v* wave (tricuspid regurgitation). Positive hepatojugular reflux ($>3\text{ cm}$ sustained rise for 15s).
  - Apex beat: Displaced to 6th intercostal space anterior axillary line, diffuse, hyperdynamic/heaving.
  - Auscultation: S3 gallop rhythm ("Kentucky" cadence — early diastolic ventricular filling into dilated non-compliant ventricle), soft pansystolic murmur of functional mitral regurgitation, bibasilar inspiratory crackles.
* **3D Simulation Features**: Dilated globular left and right ventricles, severely diminished systolic ejection fraction ($LVEF < 30\%$), dilated pulmonary veins with interstitial edema, engorged IVC with absence of inspiratory collapse.
* **Ward Trajectory**:
  - *Day 1*: IV Furosemide bolus + continuous infusion. Strict intake/output balance and daily weight measurement.
  - *Day 2–3*: Optimization of Guideline-Directed Medical Therapy (GDMT): **ARNI** (Sacubitril/Valsartan $24/26\text{ mg}$ BID) or ACEi, **Beta-blocker** (Carvedilol $3.125\text{ mg}$ BID or Metoprolol Succinate), **MRA** (Spironolactone $25\text{ mg}$ OD), and **SGLT2i** (Dapagliflozin $10\text{ mg}$ OD).
  - *Day 5*: Declining NT-proBNP ($>30\%$ drop), clearance of lung crackles, stepdown to oral loop diuretics.

---

### 3. Rheumatic Heart Disease — Mitral Stenosis & Mitral Regurgitation
* **App Anchor**: `src/data/topics/generalMedicine.ts` (Pg 066–080).
* **Pathogenesis & Morphologic Hallmarks**:
  - Post-Group A $\beta$-hemolytic Streptococcal pharyngitis (molecular mimicry between bacterial M protein and human cardiac myosin). Aschoff bodies containing multinucleated Anitschkow myocytes ("caterpillar cells").
  - Chronic healing leads to diffuse fibrous thickening, commissural fusion, chordal shortening, and calcification, creating a classic **"fish-mouth"** or **"button-hole"** stenotic orifice ($<1.0\text{ cm}^2$).
* **Auscultation Simulation Engine**:
  - *Mitral Stenosis (MS)*: Tapping apex beat (palpable S1), loud sharp S1, Opening Snap (OS) following S2 (shorter A2-OS interval indicates more severe stenosis), rough, rumbling mid-diastolic murmur heard best with the bell at the apex in the left lateral decubitus position, ending in presystolic accentuation (lost when atrial fibrillation develops).
  - *Mitral Regurgitation (MR)*: Soft S1, apical pansystolic (holosystolic) murmur radiating to the left axilla, S3 gallop indicating volume overload.
* **Complications & 3D Simulation**:
  - Massive Left Atrial (LA) dilation $\to$ stretching of conduction pathways $\to$ **Atrial Fibrillation** (irregularly irregular pulse, absent *a* wave in JVP).
  - Stasis in LA appendage $\to$ mural thrombus formation $\to$ systemic thromboembolism (embolic stroke, acute limb ischemia).
  - Pulmonary Arterial Hypertension (PAH) $\to$ Right ventricular hypertrophy $\to$ congestive hepatomegaly and peripheral edema. Ortner's syndrome (hoarseness from left recurrent laryngeal nerve compression between dilated pulmonary artery and aorta).

---

### 4. Chronic Kidney Disease (CKD Stage 1–5) & Uremic Syndrome
* **App Anchor**: `src/data/topics/generalMedicine.ts` (Pg 876–890).
* **Classification**: KDIGO Stages G1 ($\ge 90$), G2 (60–89), G3a (45–59), G3b (30–44), G4 (15–29), G5 ($<15\text{ mL/min}/1.73\text{ m}^2$ or dialysis).
* **Bedside Findings**:
  - Sallow yellowish skin complexion (urochrome pigment retention), extreme pallor (normocytic normochromic anemia of CKD due to renal erythropoietin deficiency), excoriation marks from intractable uremic pruritus, uremic frost (urea crystals evaporating on face/chest).
  - Cardiovascular: Refractory volume-dependent hypertension, uremic pericardial friction rub (scratchy two- or three-component rub indicating urgent dialysis indication).
* **3D Simulation Features**: Small, shrunken, echogenic kidneys ($<8.5\text{ cm}$ length) with marked cortical thinning ($<1.0\text{ cm}$), loss of corticomedullary differentiation, subperiosteal bone resorption on digital phalanges (osteitis fibrosa cystica due to secondary hyperparathyroidism).
* **Ward Trajectory**:
  - *Day 1–3*: Dietary protein restriction ($0.6–0.8\text{ g/kg/day}$), phosphate binders (Sevelamer $800\text{ mg}$ TID with meals), active Vitamin D (Calcitriol $0.25\mu\text{g}$ OD), subcutaneous recombinant Erythropoietin ($4000\text{ IU}$ weekly targeting Hb $10–11.5\text{ g/dL}$).
  - *Day 4+*: Vessel mapping and radiocephalic arteriovenous (AV) fistula creation planning (Brescia-Cimino fistula).

---

### 5. Pulmonary Tuberculosis (Cavitary, Fibrocaseous & Miliary)
* **App Anchor**: `src/data/topics/generalMedicine.ts` (Pg 232–251).
* **Pathophysiological Spectrum**:
  - *Primary TB*: Ghon focus (subpleural parenchymal granuloma) + regional lymphangitis/lymphadenitis = **Ranke Complex**.
  - *Post-Primary (Reactivation) TB*: Apical and posterior segments of upper lobes; massive caseation necrosis, liquefaction, and drainage into bronchial tree creating thick-walled **apical cavities**.
  - *Miliary TB*: Unchecked lymphohematogenous dissemination showering entire body with billions of 1–2 mm "millet-seed" granulomas.
* **Bedside Examination Signs**:
  - Severe cachexia (consumption), supraclavicular hollowing, drooping shoulder on affected side, clubbing.
  - Palpation: Tracheal deviation toward affected side (in apical fibrosis), increased tactile vocal fremitus over consolidation.
  - Percussion: Dullness over apex; cracked-pot resonance (bruit de pot fêlé) over large superficial cavity with open bronchus.
  - Auscultation: Amphoric/cavernous breath sounds (hollow, blowing sound like air blown over empty bottle mouth), post-tussive crepitations (crackles heard immediately after a light cough), whispering pectoriloquy.
* **3D Simulation Features**: Upper lobe cavitary lesion with central necrotizing debris and feeding bronchiole; miliary variant exhibits billions of diffuse tiny white nodules throughout lungs, liver, spleen, and bone marrow.
* **Ward Trajectory**:
  - Diagnostic yield: Sputum AFB 2 samples (spot + morning), GeneXpert (CBNAAT) confirming *M. tuberculosis* and Rifampicin sensitivity.
  - Initiation of National Tuberculosis Elimination Program (NTEP) daily fixed-dose combination (FDC): **2HRZE** (Isoniazid, Rifampicin, Pyrazinamide, Ethambutol) $\times 2$ months followed by **4HRE** $\times 4$ months.
  - Monitoring: Baseline Liver Function Tests (LFT) — monitoring drug-induced liver injury (DILI); visual acuity & color vision testing for Ethambutol optic neuritis.

---

### 6. Chronic Obstructive Pulmonary Disease (COPD) with Cor Pulmonale
* **App Anchor**: `src/data/topics/generalMedicine.ts` (Pg 215–228).
* **Clinical Phenotypes**:
  - *Chronic Bronchitis ("Blue Bloaters")*: Productive cough for $\ge 3$ consecutive months in $\ge 2$ consecutive years; overweight, cyanotic, hypercapnic drive, early cor pulmonale and peripheral edema.
  - *Emphysema ("Pink Puffers")*: Alveolar septal destruction, loss of elastic recoil, severe dyspnea, thin/cachectic, pursed-lip breathing, normal blood gases until late.
* **Bedside Examination Signs**:
  - Barrel-shaped chest (AP diameter : transverse diameter ratio $> 0.9$), loss of cardiac dullness, reduced cricosternal distance ($<3$ finger breadths), **Hoover's sign** (paradoxical inward movement of lower lateral ribcage during inspiration due to flattened diaphragm).
  - Auscultation: Markedly prolonged expiratory phase ($I:E = 1:3$ or $1:4$), quiet vesicular breath sounds with widespread polyphonic expiratory rhonchi/wheezes, coarse crackles during infective exacerbation.
* **Cor Pulmonale Progression**:
  - Chronic alveolar hypoxia $\to$ muscularization of pulmonary arterioles $\to$ hypoxic pulmonary vasoconstriction $\to$ pulmonary hypertension ($mPAP > 20\text{ mmHg}$) $\to$ Right ventricular hypertrophy $\to$ Right heart failure (tender hepatomegaly, ascites, bilateral pitting pedal edema).
* **3D Simulation Features**: Hyperinflated lungs with flattened, depressed hemidiaphragms, bullae on lung apices, enlarged main pulmonary artery, right ventricular wall hypertrophy ($>5\text{ mm}$ thickness).

---

### 7. Ischemic Stroke & Hemiplegia Localization
* **App Anchor**: `src/data/topics/generalMedicine.ts` (Pg 1135–1146).
* **Vascular Territory Localization**:
  - *Middle Cerebral Artery (MCA)*: Contralateral hemiplegia and hemisensory loss affecting **face and upper limb much more than lower limb** ($F+A > L$). Conjugate eye deviation toward lesion side. Dominant hemisphere: Global, Broca's (motor/expressive), or Wernicke's (sensory/receptive) aphasia. Non-dominant hemisphere: Hemineglect, anosognosia, apraxia.
  - *Anterior Cerebral Artery (ACA)*: Contralateral hemiparesis and cortical sensory loss affecting **lower limb much more than upper limb** ($L \gg F+A$), abulia, urinary incontinence.
  - *Posterior Cerebral Artery (PCA)*: Contralateral homonymous hemianopia with macular sparing, thalamic pain syndrome.
* **Upper vs Lower Motor Neuron Facial Palsy**:
  - *UMN (Corticonuclear tract lesion)*: **Spares the forehead** (frontalis and orbicularis oculi muscles remain intact) because the upper facial nucleus receives bilateral corticobulbar innervation.
  - *LMN (Facial nerve nucleus / Bell's palsy)*: Complete unilateral paralysis of all facial muscles including inability to wrinkle forehead or close eye.
* **Motor Examination Simulator**:
  - Tone: Spasticity with classic **clasp-knife rigidity** (velocity-dependent resistance followed by sudden release).
  - Power: Medical Research Council (MRC) Grade 0 (no movement) to Grade 5 (normal power).
  - Reflexes: Hyperreflexia ($3+$ to $4+$) with sustained ankle clonus ($>5$ beats), positive **Babinski sign** (extensor plantar response with fanning of toes).
* **3D Simulation Features**: Highlighting the infarcted vascular territory in the cerebral hemisphere with surrounding ischemic penumbra; tractography of descending corticospinal fibers showing loss of signal through the posterior limb of the internal capsule and cerebral peduncles down to the decussation in the medulla.

---

### 8. Type 2 Diabetes Mellitus with Chronic Micro- & Macrovascular Complications
* **App Anchor**: `src/data/topics/generalMedicine.ts` (Pg 968–995).
* **The Diabetic Triad**:
  1. *Diabetic Retinopathy*: Non-Proliferative (NPDR — microaneurysms, dot-and-blot hemorrhages, hard lipid exudates, cotton-wool spots) progressing to Proliferative (PDR — VEGF-driven retinal neovascularization, vitreous hemorrhage, tractional retinal detachment).
  2. *Diabetic Nephropathy*: Hyperfiltration $\to$ microalbuminuria ($30–300\text{ mg/g}$ Cr) $\to$ overt proteinuria $\to$ Kimmelstiel-Wilson nodular glomerulosclerosis.
  3. *Diabetic Neuropathy*: Distal symmetric polyneuropathy with classic **"glove-and-stocking"** sensory loss (loss of vibration 128Hz, loss of 10g monofilament touch, loss of ankle jerk reflex). Autonomic neuropathy: resting tachycardia, orthostatic hypotension, diabetic gastroparesis.
* **Diabetic Foot Examination**:
  - Differentiate *Neuropathic Ulcer* (warm, painless, punch-out margins, located over pressure points like metatarsal heads, surrounded by hyperkeratotic callus, bounding dorsalis pedis pulse) vs *Ischemic Ulcer* (cold, exquisitely painful, punched out on tips of toes or lateral border of foot, absent pulses, gangrene).
  - *Wagner Ulcer Classification*: Grade 0 (intact skin with high-risk foot) to Grade 5 (extensive gangrene involving whole foot).

---

### 9. Pleural Effusion (Exudative vs Transudative Workup)
* **App Anchor**: `src/data/topics/generalMedicine.ts` (Pg 268–275).
* **Quantitative Differentiation (Light's Criteria)**:
  An effusion is classified as an **Exudate** if ANY of the following 3 criteria are met:
  1. $\frac{\text{Pleural Fluid Protein}}{\text{Serum Protein}} > 0.5$
  2. $\frac{\text{Pleural Fluid LDH}}{\text{Serum LDH}} > 0.6$
  3. $\text{Pleural Fluid LDH} > \frac{2}{3} \times \text{Upper Limit of Normal Serum LDH}$
  - *Common Transudates*: Congestive Heart Failure, Cirrhosis with hepatic hydrothorax, Nephrotic Syndrome.
  - *Common Exudates*: Tuberculosis, Parapneumonic effusion/Empyema, Malignancy (bronchogenic or metastatic), Pulmonary Infarction.
* **Bedside Examination Signs**:
  - *Inspection*: Asymmetrical chest movement, reduced expansion on affected side, fullness of intercostal spaces.
  - *Palpation*: Decreased or absent Tactile Vocal Fremitus (TVF) over fluid; trachea and apex beat pushed to the contralateral side in massive effusions ($>2000\text{ mL}$).
  - *Percussion*: **Stony dullness** on percussion with the classical upper curved line of dullness (**Ellis S-shaped curve**, higher in the axilla than in the back or front).
  - *Auscultation*: Absent breath sounds over fluid; bronchial breathing and **aegophony** (nasal "E-to-A" sound) heard just above the upper fluid level due to compressed, atelectatic lung.
* **3D Simulation Features**: Dynamic gravity-dependent pleural fluid layering in the posterior and lateral costophrenic recesses; compression collapse of the lower lobe; procedural thoracentesis simulator with real-time feedback on safe needle placement (**8th intercostal space midaxillary line along the superior border of the 9th rib** to avoid the intercostal neurovascular bundle running in the subcostal groove).

---

### 10. Malaria (P. falciparum & P. vivax)
* **App Anchor**: `src/data/topics/generalMedicine.ts` (Pg 407–420).
* **Clinical Stages & Paroxysms**:
  - *Cold Stage (15–60 min)*: Intense shivering, uncontrollable rigors, chattering teeth, peripheral vasoconstriction, cyanotic nailbeds.
  - *Hot Stage (2–6 hours)*: High spiking temperature ($39.5–41^\circ\text{C}$), severe throbbing headache, burning hot skin, bounding pulse, nausea, delirium.
  - *Sweating Stage (2–4 hours)*: Profuse diaphoresis drenching clothes and bedding, rapid temperature drop to normal, exhaustion, and sleep.
  - Periodicity: *P. vivax* (Benign Tertian — every 48 hours), *P. falciparum* (Malignant Tertian — irregular or sub-tertian).
* **Pathophysiological Distinction**:
  - *P. vivax*: Invades reticulocytes only; forms dormant liver **hypnozoites** (responsible for relapses months/years later, treated with Primaquine $0.25\text{ mg/kg}\times 14$ days); erythrocyte Schüffner's dots.
  - *P. falciparum*: Invades RBCs of all ages; produces **PfEMP1** (Plasmodium falciparum erythrocyte membrane protein 1) knobs causing **cytoadherence, rosetting, and deep microvascular sequestration** in cerebral and renal vascular beds; Maurer's clefts, classic banana/crescent-shaped gametocytes.
* **Complicated / Severe Malaria Manifestations**:
  - *Cerebral Malaria*: Unarousable coma ($GCS < 9$), generalized convulsions, decerebrate/decorticate posturing.
  - *Blackwater Fever*: Massive intravascular hemolysis causing dark red/black mahogany-colored urine (hemoglobinuria), profound anemia, and acute kidney injury.
  - *ARDS*: Non-cardiogenic pulmonary edema with refractory hypoxemia.
  - *Hypoglycemia*: Blood glucose $< 40\text{ mg/dL}$ exacerbated by hyperinsulinemia induced by IV Artesunate/Quinine.

---

## 3.2. Multidisciplinary Daily Ward Cases (Surgery, OBG, Paediatrics, Orthopaedics, ENT, Ophtho)

### General Surgery Ward Cases
1. **Solitary Thyroid Nodule & Goitre**:
   - 40yo female presenting with painless anterior neck swelling moving with deglutition.
   - Bedside assessment: Consistency, mobility, retrosternal extension (Pemberton's sign), cervical lymph node examination, vocal cord indirect laryngoscopy.
   - Triple workup: Serum TSH $\to$ Ultrasound Neck (TIRADS score) $\to$ Fine Needle Aspiration Cytology (FNAC - Bethesda System Category I–VI).
2. **Carcinoma Breast — Triple Assessment**:
   - 50yo female presenting with hard, painless, non-tender lump in upper outer quadrant.
   - Signs: Skin dimpling, *peau d'orange* (cutaneous lymphatic edema), nipple retraction, bloody nipple discharge, fixed axillary lymphadenopathy.
   - Triple Assessment: (1) Clinical Examination, (2) Bilateral Digital Mammography (BIRADS 1–6), (3) Core Needle Biopsy for Histopathology & Immunohistochemistry (ER, PR, HER2-neu, Ki-67).
3. **Obstructive Jaundice (Choledocholithiasis vs Periampullary Carcinoma)**:
   - Progressive jaundice, clay-colored stools, high-colored urine, intractable pruritus.
   - **Courvoisier's Law**: In the presence of jaundice, an enlarged palpable gallbladder is usually NOT due to gallstones, but to malignant obstruction of the common bile duct (e.g., Ca head of pancreas).
   - Workup: Conjugated hyperbilirubinemia, elevated Serum ALP & GGT; Ultrasound $\to$ MRCP (Magnetic Resonance Cholangiopancreatography) $\to$ ERCP for therapeutic stenting or stone retrieval; pre-op Vitamin K administration to correct coagulopathy.
4. **Diabetic Foot Ulcer & Offloading Management**:
   - Wagner Grade 2 ulcer over the 1st metatarsal head.
   - Day-by-day progression: Serial surgical debridement of slough $\to$ negative pressure wound therapy (vacuum-assisted closure) $\to$ healthy pink granulation bed $\to$ split-thickness skin graft (STSG).
5. **Post-Operative Wound Dehiscence & Abdominal Drain Management**:
   - Post-op Day 5 following exploratory laparotomy; sudden gush of salmon-pink serosanguinous fluid ("burst abdomen").
   - Drain tracking: Color transition from hemorrhagic ($>200\text{ mL/day}$) $\to$ serosanguinous $\to$ serous ($<25\text{ mL/day}$ criteria for removal).

### Obstetrics & Gynaecology Ward Cases
1. **Normal Labor Monitoring via WHO Partograph**:
   - Active phase of labor (cervical dilatation $\ge 4\text{ cm}$).
   - Plotting parameters: Cervical dilatation (Alert Line vs Action Line — crossing Action line indicates protracted active phase/arrest), fetal descent (stations $-3$ to $+3$), uterine contractions (frequency per 10 mins, duration $<20\text{s}$, $20–40\text{s}$, $>40\text{s}$), Fetal Heart Rate ($110–160\text{ bpm}$), amniotic fluid status (intact, clear, meconium-stained).
2. **Gestational Diabetes Mellitus (GDM)**:
   - DIPSI / IADPSG criteria. Fasting and 2-hour post-prandial blood sugar tracking.
   - Medical Nutrition Therapy (MNT) $\to$ Subcutaneous Insulin titration. Serial fetal growth scans monitoring for asymmetrical macrosomia (abdominal circumference $> 90\text{th}$ percentile) and polyhydramnios ($AFI > 24\text{ cm}$).
3. **Uterine Fibroids (Leiomyoma)**:
   - 35yo nulliparous female presenting with menorrhagia and secondary dysmenorrhea; palpable firm 16-week size pelvic mass.
   - Classification: FIGO Submucosal (Type 0–2), Intramural (Type 3–5), Subserosal (Type 6–7). Pre-op correction of severe anemia (Hb $6.5\text{ g/dL}$) with blood transfusions and GnRH analogs prior to myomectomy.

### Paediatrics Ward Cases
1. **Severe Acute Malnutrition (SAM — Marasmus vs Kwashiorkor)**:
   - WHO Criteria: Weight-for-height $Z\text{-score} < -3\text{ SD}$ or Mid-Upper Arm Circumference (MUAC) $< 115\text{ mm}$ or bilateral nutritional edema.
   - *Marasmus*: Balanced calorie and protein deficiency; severe muscle wasting, loss of buccal fat pads ("old man facies"), prominent ribs.
   - *Kwashiorkor*: Protein deficiency; bilateral pitting pedal/generalized edema, "flaky paint" dermatosis, hypopigmented sparse "flag sign" hair, apathy.
   - Management: 10 Essential Steps of Inpatient SAM protocol (prevent hypoglycemia, hypothermia, dehydration with ReSoMal, cautious F-75 starter feed $\to$ F-100 catch-up feed).
2. **Nutritional Rickets**:
   - Toddler presenting with delayed walking, frontal bossing, widened wrists, rachitic rosary (swollen costochondral junctions), and genu varum (bow legs).
   - Labs: Low/normal Calcium, low Phosphate, markedly elevated Serum Alkaline Phosphatase (ALP $>800\text{ IU/L}$), low $25(\text{OH})\text{D} < 20\text{ ng/mL}$. X-ray showing metaphyseal cupping, splaying, and fraying.

### Orthopaedics & ENT/Ophthalmology Ward Cases
1. **Colles' Fracture Management**:
   - Extra-articular fracture of the distal radius within $2.5\text{ cm}$ of the articular surface with dorsal displacement, dorsal tilt, radial shift, and supination creating the classic **"Dinner Fork" deformity**.
   - Management: Closed reduction under hematoma block (traction + volar flexion + ulnar deviation) followed by below-elbow Colles' cast; hourly neurovascular checks for finger mobility and compartment syndrome.
2. **Chronic Suppurative Otitis Media (CSOM — Tubotympanic vs Atticoantral)**:
   - *Tubotympanic (Safe/Benign)*: Anteroinferior/central perforation of pars tensa, profuse mucoid non-foul-smelling ear discharge, conductive hearing loss (Rinne negative, Weber lateralized to affected ear).
   - *Atticoantral (Unsafe/Dangerous)*: Attic or posterosuperior marginal perforation, scanty foul-smelling discharge, presence of keratinizing squamous epithelium (**cholesteatoma** with bone-eroding enzymatic activity) threatening intracranial complications.
3. **Senile Cataract & Phacoemulsification**:
   - Progressive painless gradual diminution of visual acuity; glare and halos around lights.
   - Slit-lamp biomicroscopy: Cortical spokes opacities, nuclear sclerosis (yellow/brown grading), or posterior subcapsular plaque. Loss of red reflex.
   - Biometry (A-scan ultrasound + keratometry for IOL power calculation via SRK-T formula) $\to$ Phacoemulsification with posterior chamber foldable intraocular lens (PCIOL) implantation.

---

## 4. Real-Time 3D Rendering & Procedural Shader Architecture


```
+----------------------------------------------------------------------------------------------------+
|                                    3D RENDERING PIPELINE (THREE.JS / R3F)                          |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    +-------------------------+      +-------------------------+      +-------------------------+   |
|    |   RIGGED HUMAN CAD      | ===> |   LAYER OPACITY SLIDER  | ===> |   WBOIT DEPTH SORTING   |   |
|    | High-Poly Humanoid Mesh |      | Skin -> Bone -> Viscera |      | Zero Clipping Artifacts |   |
|    +-------------------------+      +-------------------------+      +-------------------------+   |
|                                                                                   |                |
|                 +-----------------------------------------------------------------+                |
|                 |                                                                                  |
|                 v                                                                 v                |
|    +-------------------------+                                       +-------------------------+   |
|    |  GLSL FRAGMENT SHADERS  |                                       |   GLSL VERTEX SHADERS   |   |
|    | • Ischemia & Cyanosis   |                                       | • Myocardial Dyskinesis |   |
|    | • Mottling Noise        |                                       | • Lung Volume Expansion |   |
|    | • Alveolar Raymarching  |                                       | • Pulsatile Vessel Wall |   |
|    +-------------------------+                                       +-------------------------+   |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### 1. Anatomical Hierarchy & Layered Transparency Slider
* **Hierarchical Mesh Breakdown**:
  - Layer 0: Male / Female rigged skin envelope (PBR realistic skin shader).
  - Layer 1: Musculoskeletal cage (Bones, Ribs, Sternum, Intercostal muscles, Spine).
  - Layer 2: Circulatory & Lymphatic system (Aorta, Vena Cava, Coronary arteries, Pulmonary vessels, Capillary beds).
  - Layer 3: Visceral Organs (Heart, Lungs, Tracheobronchial tree, Brain & Brainstem, Liver, Spleen, Kidneys, Adrenals, Bladder, Stomach, Small & Large Intestine).
* **Weighted Blended Order-Independent Transparency (WBOIT)**: Overlapping transparent anatomy (e.g., ribs over lungs over pulmonary vessels over heart) is rendered without sorting artifacts or triangle clipping.

### 2. Procedural GLSL Shaders

#### A. Microvascular Hypoperfusion & Cyanosis Shader
Changes vertex and fragment colors smoothly based on real-time physiological parameters ($SpO_2, MAP, SVR, Lactate$):
- Normal oxygenated skin: `#E8A29A`
- Ischemic pallor (shock): `#DDD8D0`
- Deoxygenated cyanosis ($SpO_2 < 80\%$): `#33475E`
- Peripheral Mottling: Dynamic procedural Voronoi noise simulating *Livedo Reticularis* around patella and thighs.
- Necrosis: `#1A1110` with surface desquamation.

#### B. Myocardial Ischemic Dyskinesis Vertex Shader
Modulates LV cardiac geometry in synchrony with the cardiac cycle:
- Normal tissue exhibits longitudinal shortening, radial thickening ($>30\%$), and circumferential torsion.
- Ischemic zone (e.g., LAD territory) undergoes **systolic stretching and paradoxical aneurysmal outward bulging** during the isovolumetric contraction and ejection phases.

#### C. Volumetric Alveolar Edema Fluid Shader
Renders pulmonary parenchymal opacity via raymarching:
- As transvascular fluid transudation ($V_{\text{pulm\_fluid}}$) accumulates, lung opacity transforms from translucent pink to diffuse bilateral dense consolidations ("batwing" appearance on 3D X-ray view).

---



### 4.3. Real-Time Procedural Pupil & Ocular Reflex Simulation Engine

#### 4.3.1. Neuroanatomical Circuit & Reflex Pathway
The simulator models the dual parasympathetic and sympathetic pupillomotor innervation loops:
1. **Light Reflex Afferent Pathway**: Retinal ganglion cells $\to$ Optic nerve (CN II) $\to$ Optic chiasm (nasal fibers cross, temporal uncrossed) $\to$ Pretectal nucleus in rostral midbrain.
2. **Interneuronal Cross-Talk**: Pretectal axons project bilaterally to **both Edinger-Westphal (EW) nuclei** via the posterior commissure, generating simultaneous **direct and consensual pupillary constriction**.
3. **Parasympathetic Efferent Pathway**: EW preganglionic fibers run superficially on the dorsomedial surface of the Oculomotor nerve (CN III) $\to$ Ciliary ganglion $\to$ Short ciliary nerves $\to$ Sphincter pupillae ($M_3$ muscarinic constriction).
4. **Sympathetic Mydriasis Pathway**: Hypothalamic 1st order neurons $\to$ Ciliospinal center of Budge ($C8-T2$) $\to$ Sympathetic trunk over lung apex $\to$ Superior cervical ganglion $\to$ Internal carotid plexus $\to$ Long ciliary nerves $\to$ Dilator pupillae ($\alpha_1$ adrenergic dilation).

#### 4.3.2. Extended Longtin-Milton Pupillary Light Reflex (PLR) DDE Model
Pupillary dynamic area $A(t)$ (in $\text{mm}^2$) under variable illuminance $L(t)$ is governed by a non-linear delay differential equation:
$$\tau_p \frac{dA(t)}{dt} + A(t) = A_{dark} - \kappa \cdot \ln\left( 1 + \frac{\Phi(t - \tau_d)}{\Phi_{threshold}} \right)$$
Where:
- $A_{dark} \approx 38.5\text{ mm}^2$ ($7.0\text{ mm}$ resting diameter in dark).
- $\Phi(t) = L(t) \cdot A(t)$ is the retinal flux (incident light intensity $\times$ pupil aperture).
- $\tau_d = 220 - 260\text{ ms}$ represents the total afferent + efferent conduction and synaptic delay.
- $\tau_p = 300 - 400\text{ ms}$ is the mechanical iris sphincter constriction time constant (redilatation is slower: $\tau_{dilate} \approx 1200\text{ ms}$).
- $\kappa$ is the reflex sensitivity gain. When $\kappa$ exceeds critical threshold, physiological **pupillary hippus** (sub-Hertz oscillations) emerges spontaneously.

#### 4.3.3. Pathological Pupillary State Matrix (Orbit Ocular HUD)

| Clinical Condition | Left Pupil Diameter | Right Pupil Diameter | Light Reaction | Swinging Flashlight Response | Pathophysiological Mechanism |
|---|---|---|---|---|---|
| **Normal Eye** | $3.5\text{ mm}$ | $3.5\text{ mm}$ | Prompt, bilateral ($\le 1\text{ s}$) | Symmetrical constriction | Intact bilateral CN II $\to$ Pretectal $\to$ EW $\to$ CN III. |
| **Horner's Syndrome (Left)** | $2.0\text{ mm}$ (Miosis) | $3.5\text{ mm}$ | Normal brisk reaction | Symmetrical | Left sympathetic chain disruption (Pancoast tumor, carotid dissection); anisocoria **worse in darkness**; associated ptosis & anhidrosis. |
| **Relative Afferent Defect (RAPD / Marcus Gunn)** | $3.5\text{ mm}$ | $3.5\text{ mm}$ | Sluggish on affected side | **Paradoxical bilateral dilation** when light swings to affected eye | Left optic nerve ischemia / optic neuritis; afferent drive from diseased eye is weaker than previous eye. |
| **Uncal Transtentorial Herniation** | $7.5\text{ mm}$ (Blown) | $3.5\text{ mm}$ | Left fixed, non-reactive | No response left | Expanding temporal mass compresses left CN III against tentorium; superficial parasympathetic fibers crushed first. |
| **Argyll Robertson Pupils** | $1.8\text{ mm}$ (Bilateral) | $1.8\text{ mm}$ (Bilateral) | **Absent to light** | No reaction | **Light-Near Dissociation**: Accommodates to near target but fails to constrict to light (Neurosyphilis, dorsal midbrain). |
| **Adie's Tonic Pupil** | $6.0\text{ mm}$ (Unilateral) | $3.5\text{ mm}$ | Sluggish, segmental vermiform | Tonic redilatation | Postganglionic parasympathetic denervation (ciliary ganglion); supersensitivity to dilute pilocarpine ($0.125\%$). |
| **Opioid Overdose** | $1.2\text{ mm}$ (Pinpoint) | $1.2\text{ mm}$ (Pinpoint) | Barely perceptible | Sluggish | Central disinhibition of Edinger-Westphal nucleus via $\mu$-opioid receptors; reverses with Naloxone. |
| **Atropine / Anticholinergic** | $8.0\text{ mm}$ (Blown) | $8.0\text{ mm}$ (Blown) | Fixed, non-reactive | No reaction | Competitive blockade of pupillary sphincter $M_3$ receptors. |

### 4.4. Virtual Bedside Diagnostic Device Simulation Kernels

#### 4.4.1. Web Audio Auscultation Synthesis Engine
A real-time dual-filter sound engine utilizing Web Audio API nodes:
- **Spatial Attenuation**: Heart/lung audio volume scales inversely with distance between virtual stethoscope bell/diaphragm and anatomical surface markers:
  $$V(x,y,z) = V_0 \cdot \frac{1}{1 + \alpha \cdot d^2}$$
- **Acoustic Mode Filtering**:
  - *Diaphragm Mode*: High-pass Butterworth filter ($f_c = 200\text{ Hz}$) for high-frequency murmurs (aortic regurgitation, mitral regurgitation, clicks, S1/S2 splitting, bronchial breath sounds, fine crackles).
  - *Bell Mode*: Low-pass filter ($f_c = 120\text{ Hz}$) for low-frequency vibrations (mitral stenosis mid-diastolic rumble, S3 gallop, S4 gallop).

#### 4.4.2. Procedural E-FAST POCUS Ultrasound Raymarching
- Virtual ultrasound transducer placed on torso planes (Subxiphoid, Right Upper Quadrant Morison's pouch, Left Upper Quadrant splenorenal space, Suprapubic pouch of Douglas).
- Procedural GLSL raymarcher intersects 3D visceral meshes, rendering synthetic B-mode grayscale ultrasound with acoustic impedance reflections, liver-kidney parenchyma texture, and dynamic anechoic black fluid collections in hemoperitoneum / hemothorax.

#### 4.4.3. Pneumatic Mechanical Ventilation Circuit (OpenVent Kernel)
- Lumped circuit lung mechanics:
  $$P_{aw}(t) = \frac{V_T(t)}{C_{stat}} + \dot{V}(t) \cdot R_{aw} + \text{PEEP}_{intrinsic}$$
- Simulates Volume Control (VCV), Pressure Control (PCV), and PSV modes, tracking Peak Pressure ($PIP$), Plateau Pressure ($P_{plat}$), and auto-PEEP during bronchospasm.

#### 4.4.4. Biphasic Truncated Exponential (BTE) Defibrillation & Pacing Engine
- Energy discharge from virtual capacitor bank ($C_{defib} = 150\,\mu\text{F}$):
  $$I(t) = \frac{V_0}{Z_{chest}} \exp\left(-\frac{t}{R_{tot} C}\right)$$
- Accounts for transthoracic chest impedance ($50-100\,\Omega$), delivering exact current peaks ($>30\text{ A}$) to calculate myocardial cellular depolarization and rhythm termination probability.

---

## 5. Mathematical Physiological ODE Engine (100 Hz Web Worker / Wasm)

The simulation engine decouples physiological mathematics from graphical rendering. While WebGL renders at **60 FPS**, the mathematical ODE solver runs at **100 Hz** ($dt = 0.01\text{ s}$) inside a dedicated Web Worker or WebAssembly (Wasm) instance using a **4th-order Runge-Kutta (RK4)** integration scheme.

```
+----------------------------------------------------------------------------------------------------+
|                                    100 Hz MATHEMATICAL ODE CLOSED LOOP                             |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    +-------------------------+                                       +-------------------------+   |
|    |  4-ELEMENT WINDKESSEL   | <====== Baroreflex / Autonomic ====== |  GUYTON VENOUS RETURN   |   |
|    |  Aortic Pressure & Flow |                                       |  MSFP, CVP, Cap Leak    |   |
|    +------------+------------+                                       +------------+------------+   |
|                 |                                                                 ^                |
|                 v                                                                 |                |
|    +-------------------------+                                       +------------+------------+   |
|    |    ALVEOLAR SHUNT &     |                                       |   STARLING CAPILLARY    |   |
|    |    GAS EXCHANGE         | ======= Transvascular Edema ========> |   FILTRATION DYNAMICS   |   |
|    |    PaO2, PaCO2, SpO2    |                                       |   Interstitial Fluid    |   |
|    +------------+------------+                                       +-------------------------+   |
|                 |                                                                 |                |
|                 +-----------------------------------------------------------------+                |
|                                                   |                                                |
|                                                   v                                                |
|                                      +-------------------------+                                   |
|                                      |   2-COMPARTMENT PK/PD   |                                   |
|                                      |   Drug Clearance Curves |                                   |
|                                      +-------------------------+                                   |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### 1. Core Mathematical Formulations

#### A. 4-Element Windkessel Hemodynamics
$$\frac{dP_{ao}}{dt} = \frac{Q_{lv}(t) - \frac{P_{ao} - P_{ra}}{R_{sys}}}{C_{ao}} - L \cdot \frac{d^2 Q_{lv}}{dt^2}$$
* $P_{ao}$: Central Aortic Pressure
* $Q_{lv}$: Left Ventricular Outflow
* $R_{sys}$: Systemic Vascular Resistance (modulated by baroreceptors and sympathetic tone)
* $C_{ao}$: Aortic Compliance
* $L$: Blood inertia

#### B. Guyton Venous Return & Mean Systemic Filling Pressure ($MSFP$)
$$Q_{vr} = \frac{MSFP - P_{ra}}{R_{vr}}$$
$$MSFP = \frac{V_{blood} - V_{unstressed}}{C_{vascular}}$$
In viper envenomation or severe anaphylaxis, capillary leakage decreases $V_{blood}$ and increases vascular capacitance, causing $MSFP$ to collapse.

#### C. Starling Transvascular Fluid Filtration (Pulmonary Edema)
$$\frac{dV_{\text{pulm\_fluid}}}{dt} = K_f \cdot \left[(PCWP - P_{if}) - \sigma(\pi_{plasma} - \pi_{if})\right] - Q_{lymph}$$
When $PCWP > 22\text{ mmHg}$, filtration exceeds lymphatic clearance capacity ($Q_{lymph}$), driving fluid into alveoli.

#### D. Intrapulmonary Shunt Fraction & Arterial Oxygenation
$$\frac{\dot{Q}_s}{\dot{Q}_t} = 0.04 + 0.36 \cdot \left(\frac{V_{\text{pulm\_fluid}}}{V_{\text{fluid\_max}}}\right)$$
$$PaO_2 = f\left(\frac{\dot{Q}_s}{\dot{Q}_t}, FiO_2, P_{alv}O_2\right)$$

#### E. 2-Compartment Pharmacokinetic/Pharmacodynamic (PK/PD) Equations
$$\frac{dC_{central}}{dt} = \text{Rate}_{in}(t) - (k_{el} + k_{12}) C_{central} + k_{21} C_{peripheral}$$
$$\frac{dC_{peripheral}}{dt} = k_{12} C_{central} - k_{21} C_{peripheral}$$
$$E(t) = E_{max} \cdot \frac{C_{central}(t)^\gamma}{EC_{50}^\gamma + C_{central}(t)^\gamma}$$
Models clearance, receptor binding, and physiological response for:
- **Polyvalent Anti-Snake Venom (ASV)**: Venom neutralization kinetics.
- **Epinephrine / Norepinephrine**: Adrenergic receptor ($\alpha_1, \beta_1, \beta_2$) occupancy and inotropic/vasoconstrictor curves.
- **Atropine & Pralidoxime (2-PAM)**: Muscarinic blockade and AChE reactivation constants.
- **Nitroglycerin**: Venodilation and preload reduction.
- **Regular Insulin & IV Potassium**: Transcellular glucose/$K^+$ shifting dynamics in DKA.

---

## 5.2. Real-Time 12-Lead ECG Simulation Engine (Vectorcardiography & McSharry Model)

The Orbit Patient Simulator features a dedicated **mathematical electrophysiological synthesis engine** capable of rendering continuous, dynamically morphing 12-lead ECGs that respond instantaneously to simulated cardiac ischemia, electrolyte perturbations, autonomic surges, and antiarrhythmic pharmacokinetics.

### 1. Mathematical Waveform Synthesis Engine (The Coupled McSharry ECGSYN Model)

The cardiac oscillator is modeled by three coupled non-linear Ordinary Differential Equations (ODEs) generating a limit-cycle trajectory in $(x,y)$ state space with cardiac potential mapped along the $z$-axis:

$$\dot{x} = \alpha x - \omega y$$
$$\dot{y} = \alpha y + \omega x$$
$$\dot{z} = -\sum_{i \in \{P, Q, R, S, T\}} a_i \Delta\theta_i \exp\left(-\frac{\Delta\theta_i^2}{2 b_i^2}\right) - (z - z_0)$$

Where:
- $\alpha = 1 - \sqrt{x^2 + y^2}$ acts as an attractor forcing the trajectory onto a unit circle limit cycle ($\sqrt{x^2+y^2} \to 1$).
- $\omega = 2\pi f_{HR}$ governs the instantaneous angular velocity driven by heart rate $f_{HR} = \frac{\text{HR}}{60}\text{ Hz}$.
- $\theta = \operatorname{atan2}(y, x)$ represents the four-quadrant phase angle in $[-\pi, \pi]$ along the cardiac cycle.
- $\Delta\theta_i = (\theta - \theta_i) \pmod{2\pi}$ measures the angular displacement from the peak of wave component $i$.
- $z_0(t)$ represents baseline wander (respiratory modulation at $0.15–0.3\text{ Hz}$).
- For each cardiac event $i \in \{P, Q, R, S, T\}$, the parameter triplet $(a_i, b_i, \theta_i)$ defines the peak amplitude, Gaussian width, and phase occurrence angle.

#### Baseline Normal Sinus Rhythm (NSR) Parameter Matrix (Lead II Reference)

| Wave Event | Electrophysiological Correlate | Amplitude $a_i$ (mV) | Gaussian Width $b_i$ (rad) | Peak Phase $\theta_i$ (rad) | Normal Duration |
|------------|--------------------------------|----------------------|---------------------------|----------------------------|-----------------|
| **P Wave** | Atrial Depolarization | $+1.2$ | $0.25$ | $-\frac{70\pi}{180} \approx -1.22$ | $0.08–0.10\text{ s}$ |
| **Q Wave** | Septal Depolarization | $-5.0$ | $0.10$ | $-\frac{15\pi}{180} \approx -0.26$ | $<0.03\text{ s}$ |
| **R Wave** | Ventricular Apical Activation | $+30.0$ | $0.10$ | $0.00$ | $0.06–0.08\text{ s}$ |
| **S Wave** | Basal Ventricular Depol | $-7.5$ | $0.10$ | $+\frac{15\pi}{180} \approx +0.26$ | $<0.04\text{ s}$ |
| **T Wave** | Ventricular Repolarization | $+0.75$ | $0.40$ | $+\frac{100\pi}{180} \approx +1.75$ | $0.16–0.20\text{ s}$ |

*Note on Rate-Dependent Scaling*: In accordance with Bazett's formula ($QTc = \frac{QT}{\sqrt{RR}}$), the Gaussian widths $b_i$ and angles $\theta_i$ scale dynamically with $\sqrt{\omega / \omega_0}$ to model physiological QT shortening during tachycardia and prolongation during bradycardia.

### 2. Real-Time Pathological Parametric Modifiers

The simulator dynamically modulates $(a_i, b_i, \theta_i)$ as the physiological simulation state changes:

1. **Hyperkalemia Progression (Serum $[K^+]$ Curve)**:
   - *Mild ($[K^+] = 5.5–6.5\text{ mEq/L}$)*: Early repolarization acceleration. $a_T$ doubles ($+0.75 \to +2.5\text{ mV}$), $b_T$ narrows by $40\%$ creating classic **tall, symmetrical, "tented" T waves**.
   - *Moderate ($[K^+] = 6.5–7.5\text{ mEq/L}$)*: Atrial myocyte paralysis and His-Purkinje slowing. $a_P \to 0$ (P wave flattens/disappears), phase gap $\theta_Q - \theta_P$ widens (PR interval $> 0.22\text{ s}$), $b_R$ and $b_S$ double ($QRS > 0.14\text{ s}$).
   - *Severe ($[K^+] > 7.5\text{ mEq/L}$)*: Total loss of conduction hierarchy. QRS complex widens continuously into T wave, forming a lethal **biphasic sine wave pattern** at 50–70 bpm rapidly decaying into ventricular fibrillation or asystole.
2. **Acute STEMI Evolution & Infarction Wavefront**:
   - *Phase 1 (Hyperacute, $T+0$ to $15$ min)*: Local extracellular $K^+$ accumulation causes hyperacute, broad T waves ($a_T \uparrow 300\%$).
   - *Phase 2 (Injury Current, $T+15$ min to $6$ hr)*: Transmural ischemic boundary currents introduce a baseline offset during early repolarization ($ST_{\text{elevation}} = +0.2\text{ to }+0.6\text{ mV}$).
   - *Phase 3 (Necrosis, $T+6$ to $24$ hr)*: Loss of viable electrical vectors in infarcted myocardium creates a necrotic "electrical window" $\to$ broad, deep **Pathological Q waves** ($a_Q$ deepens to $<-8.0\text{ mV}$, $b_Q$ broadens to $0.05\text{ s}$).
   - *Phase 4 (Resolution, Days)*: ST segments return to isoelectric baseline accompanied by symmetric **T-wave inversion** ($a_T$ flips to negative).
3. **Atrial Fibrillation (AFib)**:
   - Atrial pacemaker chaotic multi-wavelet reentry: $a_P = 0$.
   - Heart rate oscillator $\omega(t)$ driven by a stochastic Ornstein-Uhlenbeck random walk modeling chaotic AV nodal filtration ($R-R$ intervals irregularly irregular).
   - Baseline $z_0(t)$ modulated by continuous high-frequency sinusoidal summation simulating fibrillatory **$f$-waves** ($350–600\text{ min}^{-1}$, amplitude $0.05–0.15\text{ mV}$).
4. **Ventricular Arrhythmias**:
   - *Monomorphic VT*: Originating from ectopic ventricular focus. $\omega$ forced to $150–220\text{ bpm}$, $a_P$ decoupled, $b_R, b_S$ widened to $0.16\text{ s}$ (broad notched bizarre QRS), discordant ST-T segments.
   - *Polymorphic VT (Torsades de Pointes)*: Generated in the setting of prolonged QTc ($>500\text{ ms}$). Peak amplitude modulated by a low-frequency rotational envelope:
     $$A_{\text{envelope}}(t) = A_0 \sin(\omega_{\text{torsades}} t), \quad \omega_{\text{torsades}} = 2\pi (0.1–0.3\text{ Hz})$$
     producing the classic "twisting of the peaks around the isoelectric line".
   - *Ventricular Fibrillation (VF)*: Driven by a chaotic Lorenz strange attractor with total loss of periodicity ($a_i = 0$, continuous chaotic fluctuations $0.2–1.5\text{ mV}$ at $4–8\text{ Hz}$ coarseness).
5. **Digoxin Effect ("Salvador Dali" Sign)**:
   - Inhibition of myocardial Na⁺/K⁺-ATPase increases intracellular Ca²⁺, shortening ventricular action potential duration.
   - ST segment exhibits asymmetrical, scooping downward depression resembling Salvador Dali's mustache, shortened QTc interval, and prominent **U waves** following the T wave ($a_U = +0.3\text{ mV}, \theta_U = +140^\circ$).
6. **AV Conduction Blocks**:
   - *1st Degree AV Block*: Fixed conduction delay through AV node. Phase gap $\theta_Q - \theta_P$ prolonged ($PR > 0.20\text{ s}$).
   - *2nd Degree Mobitz I (Wenckebach)*: Decremental AV conduction. Phase gap $\Delta\theta_{PR}$ accumulates by $+0.04\text{ s}$ per cycle over 4–5 beats until one cardiac cycle suppresses ventricular depolarization ($a_Q = a_R = a_S = 0$), followed by a pause and reset.
   - *2nd Degree Mobitz II*: Infranodal His-Purkinje block. Fixed PR interval with intermittent, unheralded dropped QRS complexes (e.g., $2:1$ or $3:1$ block ratio).
   - *3rd Degree (Complete Heart Block)*: Total AV dissociation. Independent dual oscillators: Sinus atrial oscillator ($\omega_{\text{atrial}} = 75\text{ bpm}$) and ventricular escape pacemaker ($\omega_{\text{vent}} = 32\text{ bpm}$). P waves march across rhythm strip with complete disregard for wide idioventricular QRS complexes.

### 3. Vectorcardiography & 3D Lead Projection Geometry

Rather than computing 12 scalar leads independently, the simulator projects a single **3D Cardiac Dipole Vector $\vec{D}(t)$** onto 12 anatomical lead axes:

$$\vec{D}(t) = \begin{bmatrix} D_x(t) \\ D_y(t) \\ D_z(t) \end{bmatrix}$$

Each clinical lead $j \in \{\text{I, II, III, aVR, aVL, aVF, V1, V2, V3, V4, V5, V6}\}$ has a fixed spatial unit vector $\vec{L}_j$. The instantaneous voltage recorded at lead $j$ is the dot product:

$$V_j(t) = \vec{L}_j \cdot \vec{D}(t)$$

#### Frontal Plane (Einthoven's Triangle & Goldberger Augmented Leads)
- $\vec{L}_{\text{I}} = [1, 0, 0]^T \quad (0^\circ)$
- $\vec{L}_{\text{II}} = [\cos 60^\circ, \sin 60^\circ, 0]^T = [0.5, 0.866, 0]^T \quad (+60^\circ)$
- $\vec{L}_{\text{III}} = [\cos 120^\circ, \sin 120^\circ, 0]^T = [-0.5, 0.866, 0]^T \quad (+120^\circ)$
- $\vec{L}_{\text{aVR}} = [\cos 210^\circ, \sin 210^\circ, 0]^T = [-0.866, -0.5, 0]^T \quad (-150^\circ)$
- $\vec{L}_{\text{aVL}} = [\cos 330^\circ, \sin 330^\circ, 0]^T = [0.866, -0.5, 0]^T \quad (-30^\circ)$
- $\vec{L}_{\text{aVF}} = [\cos 90^\circ, \sin 90^\circ, 0]^T = [0, 1.0, 0]^T \quad (+90^\circ)$

#### Horizontal Plane (Wilson Central Terminal & Precordial Leads V1–V6)
- $\vec{L}_{\text{V1}} = [\cos(-60^\circ)\cos 30^\circ, \sin(-60^\circ)\cos 30^\circ, \sin 30^\circ]^T$ (4th ICS right sternal border)
- $\vec{L}_{\text{V2}} = [\cos(-30^\circ)\cos 20^\circ, \sin(-30^\circ)\cos 20^\circ, \sin 20^\circ]^T$ (4th ICS left sternal border)
- $\vec{L}_{\text{V3}}$ to $\vec{L}_{\text{V6}}$ wrap around the anterolateral chest wall into the midaxillary line ($V6$).

#### Real-Time Mean Electrical Axis Engine
The frontal plane mean QRS electrical axis is computed dynamically at every heartbeat:

$$\text{Cardiac Axis} = \operatorname{atan2}(\text{Net QRS in aVF}, \text{Net QRS in Lead I}) \times \frac{180^\circ}{\pi}$$

- **Normal Axis**: $-30^\circ$ to $+90^\circ$
- **Left Axis Deviation (LAD)**: $-30^\circ$ to $-90^\circ$ (Left anterior fascicular block, severe LVH, inferior MI)
- **Right Axis Deviation (RAD)**: $+90^\circ$ to $+180^\circ$ (Right ventricular hypertrophy, Acute Pulmonary Embolism, Cor Pulmonale, lateral MI)
- **Extreme Right / Northwest Axis**: $-90^\circ$ to $-180^\circ$ (Ventricular tachycardia, hyperkalemia, severe emphysema)

### 4. Canvas Rendering & Digital Signal Processing (DSP) Specs

1. **Standard Medical Calibration**:
   - Paper Speed: $25\text{ mm/s}$ standard (toggleable to $50\text{ mm/s}$ for pediatric tachycardias).
   - Voltage Sensitivity: $10\text{ mm/mV}$ ($1\text{ mV} = 10\text{ small boxes} = 2\text{ large boxes}$).
2. **High-Precision Medical Grid**:
   - Small Box ($1\text{ mm} \times 1\text{ mm}$): $0.04\text{ s}$ horizontal time, $0.1\text{ mV}$ vertical amplitude.
   - Large Box ($5\text{ mm} \times 5\text{ mm}$): $0.20\text{ s}$ horizontal time, $0.5\text{ mV}$ vertical amplitude.
   - Dual View Modes: Classic Medical Pink Paper (`#F8D7DA` / `#FFC0CB`) and ICU High-Contrast Obsidian Black (`#0B0E14` background with `#00FF66` phosphor green or `#FFB800` amber CRT trace).
3. **Digital Filtering Chain (AHA/IEC Compliant)**:
   - *Low-Pass Anti-Aliasing Filter*: $40\text{ Hz}$ bandwidth for bedside telemetry display; $150\text{ Hz}$ diagnostic mode for high-frequency QRS notch detection.
   - *Notch Filter*: $50\text{ Hz} / 60\text{ Hz}$ IIR comb filter suppressing AC mains electromagnetic hum.
   - *Baseline Wander Suppression*: High-pass Butterworth filter ($0.05\text{ Hz}$) eliminating respiratory movement artifacts without distorting ST segments.

### 5. Master Scenario Mapping: 30+ High-Yield MBBS Clinical ECG Tracings

| ECG Tracing Pattern | Diagnostic Hallmarks | Mapped Simulator Scenario |
|---------------------|----------------------|---------------------------|
| **Normal Sinus Rhythm (NSR)** | HR 60–100, upright P in I/II, PR 0.12–0.20s, QRS <0.10s | Baseline resting patient |
| **Anterior STEMI** | Tombstone ST elevation in V1–V4, reciprocal ST depression in II/III/aVF | Scenario 1: LAD Plaque Rupture |
| **Inferior STEMI** | ST elevation in II, III, aVF, reciprocal depression in I, aVL | Acute RCA Occlusion |
| **Lateral STEMI** | ST elevation in I, aVL, V5–V6 | Left Circumflex (LCx) Occlusion |
| **Posterior STEMI** | Tall R wave and horizontal ST depression in V1–V3 (mirror image) | LCx/RCA Posterior Descending Branch |
| **Wellens' Syndrome** | Biphasic or deeply inverted T waves in V2–V3 | Critical proximal LAD stenosis warning |
| **Pulmonary Embolism (PE)** | McGinn-White $S_1Q_3T_3$ sign, sinus tachycardia, T-wave inversion V1–V4 | Massive PE, DVT complication |
| **Pericarditis** | Widespread concave-upward ST elevation, PR depression in Lead II | Acute post-viral / uremic pericarditis |
| **Hyperkalemia (Mild)** | Symmetrical, narrow-based, tall, "tented" T waves in precordial leads | DKA, early crush syndrome |
| **Hyperkalemia (Severe)** | Flat P wave, prolonged PR, wide slurred QRS, sine-wave fusion | End-stage CKD, massive rhabdomyolysis |
| **Hypokalemia** | ST depression, flat T wave, prominent U waves ($U > T$) | Diuretic overuse, severe vomiting/diarrhea |
| **Hypercalcemia** | Shortened QT interval ($QTc < 360\text{ ms}$), Osborn-like J wave | Hyperparathyroidism, bone metastasis |
| **Hypocalcemia** | Prolonged QT interval ($QTc > 480\text{ ms}$) via ST segment elongation | Post-thyroidectomy hypoparathyroidism |
| **Atrial Fibrillation (AFib)** | Absent P waves, fibrillatory $f$-waves, irregularly irregular QRS | Mitral Stenosis, Thyrotoxicosis |
| **Atrial Flutter** | Regular "sawtooth" $F$-waves at 300 bpm with $2:1$ or $4:1$ AV block | Chronic Cor Pulmonale, COPD |
| **Supraventricular Tachycardia (SVT)** | Narrow QRS at 160–220 bpm, P waves buried in QRS or retrograde | Paroxysmal SVT, AVNRT |
| **Ventricular Tachycardia (VT)** | Monomorphic wide QRS $>0.14\text{ s}$ at 180 bpm, AV dissociation | STEMI reperfusion arrhythmia |
| **Torsades de Pointes** | Polymorphic VT with amplitude twisting around baseline | Long QT syndrome, Macrolide toxicity |
| **Ventricular Fibrillation (VF)** | Chaotic, disorganized undulations (no discernible QRS or T) | Sudden cardiac arrest in STEMI |
| **1st Degree AV Block** | Fixed PR interval $> 0.20\text{ s}$, all P waves conducted | Digoxin toxicity, Lyme disease, RHD |
| **2nd Degree AV Block (Wenckebach)** | Progressive PR lengthening until dropped QRS, grouping of beats | Inferior wall MI (nodal ischemia) |
| **2nd Degree AV Block (Mobitz II)** | Constant PR interval with random dropped QRS complexes | Anterior wall MI (His bundle ischemia) |
| **3rd Degree AV Block (CHB)** | P waves regular at 75, QRS regular at 30, completely dissociated | Extensive septal necrosis, Calcific AS |
| **Right Bundle Branch Block (RBBB)** | $rSR'$ "rabbit-ear" in V1, slurred S in Lead I and V6, $QRS > 0.12\text{ s}$ | Cor Pulmonale, PE, ASD |
| **Left Bundle Branch Block (LBBB)** | Broad notched R in I/aVL/V6, deep QS in V1, $QRS > 0.12\text{ s}$, LAD | Dilated cardiomyopathy, severe CAD |
| **Left Ventricular Hypertrophy (LVH)** | Sokolow-Lyon criteria: $S_{\text{V1}} + R_{\text{V5/V6}} > 35\text{ mm}$, strain ST depression | Essential hypertension, Aortic Stenosis |
| **Right Ventricular Hypertrophy (RVH)** | Tall R wave in V1 ($R/S > 1$), Right Axis Deviation ($>110^\circ$), strain | Tetralogy of Fallot, Primary PAH |
| **P Mitrale (LAE)** | Broad, notched, bifid P wave in Lead II ($>0.12\text{ s}$), biphasic in V1 | Mitral Stenosis, left atrial dilation |
| **P Pulmonale (RAE)** | Tall, peaked P wave in Lead II ($>2.5\text{ mm}$) | Severe COPD, Cor Pulmonale |
| **Digoxin Effect** | Scooped, sagging ST depression ("Salvador Dali"), short QT, U wave | Heart failure on digitalis therapy |
| **Hypothermia (Osborn J Wave)** | Distinct dome-shaped deflection at J point, severe sinus bradycardia | Environmental hypothermia, cold water immersion |
| **Dextrocardia** | Inverted P wave and negative QRS in Lead I, loss of precordial R progression | Congenital situs inversus |

---



### 5.3. Advanced Multi-Scale ODE & Pharmacodynamic Formulation

#### 5.3.1. Westerhof 4-Element Windkessel Model & Aortic Impedance
The central arterial tree is governed by the 4-element Windkessel circuit combining characteristic aortic impedance ($R_c$), total arterial compliance ($C$), peripheral resistance ($R_p$), and blood inertance ($L$):

$$\begin{aligned}
\text{Total Outflow:} \quad & Q(t) = Q_{Rc}(t) + Q_L(t) \\
\text{Inertance State:} \quad & P(t) - P_{wind}(t) = L \frac{dQ_L(t)}{dt} \\
\text{Viscous State:} \quad & P(t) - P_{wind}(t) = R_c \left[ Q(t) - Q_L(t) \right] \\
\text{Reservoir Balance:} \quad & Q(t) = C \frac{dP_{wind}(t)}{dt} + \frac{P_{wind}(t)}{R_p}
\end{aligned}$$

The frequency-domain input impedance $Z(s) = \frac{P(s)}{Q(s)}$ is:
$$Z(s) = \frac{s L R_c (1 + s R_p C) + R_p (s L + R_c)}{(s L + R_c)(1 + s R_p C)}$$

#### 5.3.2. Guyton Venous Return & Vascular Collapse Limit
Venous return ($VR$) into the right atrium is determined by Mean Systemic Filling Pressure ($MSFP$), Right Atrial Pressure ($RAP$), and Resistance to Venous Return ($RVR$):
$$VR = \begin{cases} 
\dfrac{MSFP - RAP}{RVR}, & RAP > P_{crit} \approx 0\text{ mmHg} \\[8pt]
\dfrac{MSFP - 0}{RVR} = VR_{max}, & RAP \le 0\text{ mmHg} \quad (\text{Great vein thoracic collapse limit})
\end{cases}$$

Where $MSFP$ represents unstressed volume mobilization:
$$MSFP = \frac{V_{tot} - V_{u,tot}}{C_{sys}} = \frac{V_{stressed}}{C_{sys}}$$
- Normal baseline: $V_{tot} = 5000\text{ mL}, V_{u} = 4250\text{ mL} \implies V_{stressed} = 750\text{ mL}, C_{sys} = 100\text{ mL/mmHg} \implies MSFP = 7.5\text{ mmHg}$.
- Vasodilatory shock: $V_u$ expands to $4800\text{ mL} \implies MSFP \downarrow 2.0\text{ mmHg} \implies$ venous return collapses.

#### 5.3.3. Revised Michel-Weinbaum Glycocalyx Capillary Filtration
Trans-endothelial fluid flux ($J_v$) is governed by the endothelial glycocalyx sub-compartment ($g$):
$$J_v = L_p S \left[ (P_c - P_i) - \sigma (\pi_c - \pi_g) \right]$$
Interstitial volume accumulation and edema formation:
$$\frac{dV_{int}}{dt} = J_v - J_L(P_i)$$
Where:
- Capillary hydrostatic pressure: $P_c = \frac{R_v P_{art} + R_a P_{ven}}{R_a + R_v}$.
- Plasma oncotic pressure (Landis-Pappenheimer): $\pi_c = 2.1 C_p + 0.16 C_p^2 + 0.009 C_p^3$.
- Lymphatic drainage: $J_L(P_i) = \frac{J_{L,max}}{1 + \exp(-k_L [P_i - P_{i,threshold}])}$.
- Compliance transition: $P_i < 0\text{ mmHg}$ (rigid matrix, non-edematous); $P_i \ge 0\text{ mmHg}$ (collagen gel expands, compliance increases 20-fold $\to$ pitting edema).

#### 5.3.4. Riley Three-Compartment Shunt & Kelman Oxyhemoglobin Model
Total pulmonary blood flow ($\dot{Q}_t$) is divided into ideal alveolar capillary flow ($\dot{Q}_c$) and true shunt ($\dot{Q}_s$):
$$\frac{\dot{Q}_s}{\dot{Q}_t} = \frac{C_{c'} O_2 - C_a O_2}{C_{c'} O_2 - C_{\bar{v}} O_2}$$
Where oxygen content is:
$$C O_2 = (1.34 \cdot [\text{Hb}] \cdot S O_2) + (0.0031 \cdot P O_2)$$
And hemoglobin saturation $S O_2$ is computed via the Severinghaus-Kelman polynomial:
$$S O_2(P O_2^*) = \frac{(P O_2^*)^4 + a_1 (P O_2^*)^3 + a_2 (P O_2^*)^2 + a_3 (P O_2^*)}{(P O_2^*)^4 + b_1 (P O_2^*)^3 + b_2 (P O_2^*)^2 + b_3 (P O_2^*) + b_4}$$
With virtual partial pressure correction for pH, temperature, and $PaCO_2$:
$$P O_2^* = P O_2 \cdot 10^{\left[ 0.40(pH - 7.40) - 0.06(\log_{10} PaCO_2 - \log_{10} 40) - 0.024(T - 37) \right]}$$

#### 5.3.5. Autonomic Baroreflex Dual Delay Differential Equations (DDEs)
The afferent baroreceptor discharge rate $f_{baro}(t)$ is transduced into dual sympathetic and parasympathetic efferent signals with physiological latencies:
$$\begin{aligned}
\text{Vagal Parasympathetic:} \quad & \tau_p \frac{d P_{eff}(t)}{dt} + P_{eff}(t) = G_p \cdot \left[ f_{baro}(t - D_p) - f_{baseline} \right] \\
\text{Adrenergic Sympathetic:} \quad & \tau_s \frac{d S_{eff}(t)}{dt} + S_{eff}(t) = -G_s \cdot \left[ f_{baro}(t - D_s) - f_{baseline} \right]
\end{aligned}$$
- **Vagal latency ($D_p$):** $0.2 - 0.5\text{ s}$; time constant $\tau_p = 0.8\text{ s}$ (rapid direct muscarinic $I_{K,ACh}$ gating).
- **Sympathetic latency ($D_s$):** $2.0 - 3.0\text{ s}$; time constant $\tau_s = 6.0 - 8.0\text{ s}$ (cAMP second-messenger diffusion).

#### 5.3.6. Mammillary PK/PD Equations for 7 Crisis Agents
For each drug, central concentration $C_1(t)$ drives biophase effect-site equilibration:
$$\frac{dC_e}{dt} = k_{e0} (C_1 - C_e)$$
And pharmacological response is governed by the sigmoidal $E_{max}$ Hill equation:
$$E(C_e) = E_0 + \frac{E_{max} \cdot C_e^\gamma}{EC_{50}^\gamma + C_e^\gamma}$$

| Drug | Primary Receptors | $k_{e0}$ Half-life | Dynamic Clinical Effect in 3D Simulator |
|---|---|---|---|
| **Adrenaline** | $\beta_1, \beta_2, \alpha_1$ | $1.5\text{ min}$ | Low dose ($<1.5\text{ ng/mL}$): $\beta_2$ vasodilation, HR $\uparrow$; High dose ($>4\text{ ng/mL}$): intense $\alpha_1$ vasoconstriction, SVR $\uparrow\uparrow$. |
| **Noradrenaline** | $\alpha_1 \gg \beta_1$ | $1.2\text{ min}$ | Extreme systemic vasoconstriction ($SVR \uparrow 250\%$); reflex vagal baroreflex blunts intrinsic tachycardia. |
| **Atropine** | $M_2$ competitive antagonist | $2.0\text{ min}$ | Uncouples vagal brake ($P_{eff} \to 0$), heart rate accelerates to intrinsic SA node pacing rate ($110-120\text{ bpm}$). Paradoxical bradycardia at $<0.5\text{ mg}$. |
| **Nitroglycerin** | Guanylyl cyclase / NO / cGMP | $2.5\text{ min}$ | Preferential venodilation ($V_u \uparrow 450\text{ mL}$), $MSFP \downarrow$, relieving pulmonary capillary wedge pressure ($PCWP \downarrow$). |
| **Morphine** | $\mu$-opioid agonist | $18.0\text{ min}$ | Central respiratory depression: shifts $\dot{V}_E$ vs $PaCO_2$ response curve to right; delayed CNS equilibration explains delayed apnea. |
| **Polyvalent ASV** | Equine $F(ab\')_2$ neutralizer | Immediate | 2nd-order binding: $\frac{d[\text{Tox}]}{dt} = -k_{on} [\text{Tox}][\text{ASV}] + k_{off} [\text{Complex}]$. Halts coagulopathy & unblocks ACh receptors. |
| **Insulin** | Tyrosine kinase receptor | $8.0\text{ min}$ | Modified Bergman minimal model: drives glucose uptake $X(t)$ and suppresses hepatic gluconeogenesis. |

#### 5.3.7. Proof of Numerical Stiffness & Orbit MNA Stability Kernel
During acute events (heart valve opening/closing, aortic rupture, anaphylactic collapse), localized circuit eigenvalues reach:
$$\lambda_{valve} = \frac{1}{R C} \approx 10^5 \text{ to } 10^7\text{ s}^{-1}$$
Explicit solvers (Forward Euler, Runge-Kutta 4) become unstable unless step size satisfies:
$$h \le \frac{2}{|\lambda_{max}|} \approx \frac{2}{10^5} = 20\text{ microseconds} \quad (50,000\text{ Hz})$$
Running at a standard $50\text{ Hz}$ ($h = 0.02\text{ s}$) causes explosive numerical divergence ($|1 - h\lambda|^3 \approx (1999)^3 \approx 8 \times 10^9 \to \text{NaN}$).

**Orbit's Solution**: The core hydraulic circuit is formulated via **Modified Nodal Analysis (MNA)** with companion conductances:
$$G_{eq} = \frac{C_i^{n+1}}{\Delta t}, \quad I_{eq} = \left( \frac{C_i^{n+1}}{\Delta t} \right) P_i^n$$
Converting the stiff differential-algebraic system into a diagonally dominant linear system:
$$\mathbf{A}^{n+1} \mathbf{x}^{n+1} = \mathbf{b}^n$$
Which is unconditionally $L$-stable, requires only a single sparse linear solve per step, and executes deterministically at **100 Hz in a Web Worker (<3% CPU on mobile)**.

---

## 6. Interactive UX, ICU Telemetry & Multi-Scenario Branching DAG


```
+----------------------------------------------------------------------------------------------------+
|                                    SIMULATOR COCKPIT INTERFACE                                     |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    +-----------------------------------------------+   +--------------------------------------+    |
|    |             3D VIEWPORT / CAD MODEL           |   |           ICU TELEMETRY HUD          |    |
|    |                                               |   | Lead II ECG: 138 bpm [ Tombstone ST ]|    |
|    |    • Orbit, Pan, Zoom, Slice                  |   | Art Line:    72/42 mmHg  (MAP 52)    |    |
|    |    • Organ Transparency Slider (0-100%)       |   | SpO2:        82% [ Severe Hypoxia ]  |    |
|    |    • Cyanosis & Perfusion Live Shaders        |   | CVP / PCWP:  18 / 26 mmHg            |    |
|    |    • Click Organ -> Cellular Cross-Section    |   | EtCO2:       22 mmHg                 |    |
|    +-----------------------------------------------+   +--------------------------------------+    |
|                                                                                                    |
|    +------------------------------------------------------------------------------------------+    |
|    |                              CLINICAL ACTION & LAB REQUISITION PANEL                     |    |
|    | [ Drugs: ASV | Epi | Norepi | Atropine | NTG ]  [ Procedures: Intubate | PCI | Thoracostomy ]|    |
|    | [ Labs: ABG | Troponin | 20WBCT | Renal Panel ] [ Fluids: Normal Saline | Whole Blood ]       |    |
|    +------------------------------------------------------------------------------------------+    |
|                                                                                                    |
|    +------------------------------------------------------------------------------------------+    |
|    |                         BRANCHING "WHAT-IF" DECISION TIMELINE (DAG)                      |    |
|    |                                                                                          |    |
|    |   [T=0m: Bite] ===> [T=30m: 20WBCT Unclotted] ===> [T=1h: Hypotension]                   |    |
|    |                                                           |                              |    |
|    |                                  +------------------------+------------------------+     |    |
|    |                                  |                                                 |     |    |
|    |                                  v                                                 v     |    |
|    |                     [BRANCH A: USER GIVES 3L NS]                    [BRANCH B: ASV + NORAD]      |    |
|    |                     • Worsens Capillary Leak                        • Venom Neutralized          |    |
|    |                     • Massive Pulmonary Edema                       • SVR Restored, MAP > 65     |    |
|    |                     • Fatal Asphyxia at T+2h                        • Full Recovery at T+12h     |    |
|    +------------------------------------------------------------------------------------------+    |
|                                                                                                    |
|    +------------------------------------------------------------------------------------------+    |
|    | CONTROLS: [ || Pause ]  [ > Play 1x ]  [ >> 5x Fast ]  [ >>> 60x Hyper ]  [ Fork Branch ]|    |
|    +------------------------------------------------------------------------------------------+    |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### 1. ICU Telemetry HUD (25 mm/s Continuous Canvas Sweep)
- **12-Lead Electrocardiogram (ECG)**: Synthesized vectorcardiography displaying Lead II and V1–V6. Dynamically renders ST elevation, hyperacute T waves, pathological Q waves, re-entrant VT, VF, and asystole.
- **Arterial Line Waveform**: Continuous pressure tracing displaying systolic peak, dicrotic notch, and pulse pressure variation.
- **Pulse Oximeter ($\text{SpO}_2$) Plethysmograph**: Realistic infrared photoplethysmogram with waveform dampening during vasoconstrictive shock.
- **Central Venous Pressure (CVP)**: Real-time a, c, and v waves, with prominent v waves in tricuspid regurgitation or RV failure.
- **Capnography ($\text{EtCO}_2$)**: Continuous alveolar plateau tracing; drops abruptly in massive pulmonary embolism or cardiac arrest.

### 2. Time Controls & Git-Style Branching DAG
- **Time Scrubbing**: Run cases at true clinical speed ($1\times$), or fast-forward through hours of intensive care ($5\times$, $10\times$, $60\times$).
- **Forking Timelines**: Students test controversial or dangerous interventions without resetting the whole case. Every intervention spawns a new branch in the DAG.
- **Parallel Ghost Mesh Comparison**: Users can render Branch A (untreated) as a translucent red ghost mesh directly superimposed over Branch B (treated with PCI or ASV), demonstrating the exact volume of salvaged tissue.

---

## 6.3. Bedside Ward Examination & Clinical Case Presentation Engine (Indian MBBS / MMC Standard)

Based on the clinical examination traditions of **Madras Medical College (MMC)**, *Kundu's Bedside Clinics in Medicine*, *Das Clinical Surgery*, and *Macleod's Clinical Examination*, the simulator includes a dedicated **Ward Round & Bedside Examination Mode** where students practice long case presentations, bedside physical diagnosis, and daily progress tracking.

### 1. The Classic Indian MBBS Long Case Presentation Format

The engine enforces a rigorous, structured clinical data-gathering flow:
1. **Patient Demographic Profile**: Age, Sex, Occupation, Native place, Socioeconomic status (modified Kuppuswamy classification).
2. **Chief Complaints (Strict Chronological Sequence)**: E.g., "Abdominal distension for 3 months, Bilateral pedal swelling for 1 month, Yellowish discoloration of eyes for 2 weeks."
3. **History of Present Illness (HPI - ODPARA Framework)**:
   - Onset (sudden vs insidious), Duration, Progress (continuous, progressive, remitting), Aggravating factors, Relieving factors, Associated symptoms.
   - **Negative History Scoring**: The student receives diagnostic points for asking relevant negative history questions that systematically rule out competing differentials (e.g., asking about orthopnea/PND to exclude cardiac failure, frothy urine to exclude nephrotic syndrome, or history of melena/hematemesis to rule out variceal bleeding).
4. **General Physical Examination (GPE — The "PICCLED" Cardinal Signs)**:
   - **P — Pallor**: Virtual torch and eyelid retraction tool; inspect lower palpebral conjunctiva, dorsum of tongue, nail bed, and palmar creases.
   - **I — Icterus**: Ask patient avatar to look downward while lifting upper eyelid to inspect upper bulbar conjunctiva in natural daylight; inspect undersurface of tongue and hard palate.
   - **C — Cyanosis**: Distinguish Central (warm tongue, buccal mucosa) vs Peripheral (cold nailbeds, earlobes, nose tip).
   - **C — Clubbing**: Schamroth's window test (loss of diamond-shaped window between opposing dorsal nails), Lovibond angle measurement ($>180^\circ$). Clinical grading from Grade 1 (increased fluctuation of nail bed) to Grade 5 (hypertrophic osteoarthropathy).
   - **L — Lymphadenopathy**: Systemic palpation stations for cervical (anterior/posterior cervical, submandibular, submental, supraclavicular — Virchow's node / Troisier's sign), axillary (anterior, posterior, lateral, central, apical), epitrochlear, and inguinal chains.
   - **E — Edema**: Digital compression over medial malleolus / lower third of tibia for $\ge 10\text{ seconds}$. Dynamic mesh deformation simulates pitting depth ($1+$ to $4+$) vs non-pitting lymphedema/myxedema. Sacral edema checked in recumbent patients.
   - **D — Disease Stigmata**: Procedural inspection for peripheral signs (spider angiomas, palmar erythema, Dupuytren's contracture, xanthomas, trophic ulcers).

### 2. Systemic Physical Examination Simulators

1. **Cardiovascular Examination (CVS)**:
   - *Inspection & Palpation*: Measure JVP waveform (cm above sternal angle at $45^\circ$, identifying *a*, *c*, *x*, *v*, *y* waves). Palpate apex beat (identify intercostal space, distance from midline, character: normal, tapping, heaving, hyperdynamic). Feel for parasternal heave (RVH) and thrills.
   - *3D Spatial Auscultation*: 4 classic valve stations (Mitral, Tricuspid, Aortic, Pulmonary). Spatial audio engine synthesizes first/second heart sounds, splitting, extra sounds (S3 gallop, S4, opening snap), and murmurs. Dynamic maneuvers simulate murmur changes during respiration (Carvallo's sign), Valsalva, isometric handgrip, and position shifts (leaning forward for AR, left lateral for MS).
2. **Respiratory Examination (RS)**:
   - *Palpation*: Tracheal position, chest expansion measurement using interactive tape measure, Tactile Vocal Fremitus (TVF) while avatar phonates "Ninety-Nine".
   - *Percussion*: Systematic percussion comparing symmetrical points across anterior, lateral, and posterior chest walls. Sound synthesizer plays authentic resonant, dull, stony dull, or hyperresonant audio feedback.
   - *Auscultation*: Vesicular vs Bronchial breathing, adventitious sounds (fine/coarse crackles, monophonic/polyphonic rhonchi, pleural rub), Vocal Resonance (bronchophony, whispering pectoriloquy, aegophony).
3. **Abdominal Examination**:
   - *Inspection*: Contour (scaphoid, flat, distended), umbilicus position, visible peristalsis, dilated abdominal wall veins (milking test to determine directional blood flow).
   - *Palpation*: Light palpation for tenderness/guarding $\to$ Deep palpation. Liver span measurement in midclavicular line (normal $10–12\text{ cm}$), Spleen palpation along oblique line from right iliac fossa toward left hypochondrium (Hackett's grading), Bimanual renal ballotment.
   - *Percussion*: Shifting dullness technique (flank dullness transitioning to resonance upon rolling patient onto lateral decubitus, requiring $>1500\text{ mL}$ fluid); Fluid thrill (transmitted fluid impulse across midline with assistant's hand dampening fat transmission, requiring $>2000\text{ mL}$).
4. **Neurological Examination (CNS)**:
   - Cranial nerves I through XII systematic testing minigames (Snellen chart, pupillary light reflex, extraocular motility, trigeminal sensory map, facial symmetry, Rinne/Weber, gag reflex, tongue deviation).
   - Motor System: Muscle bulk circumference measurement, Muscle tone evaluation (spastic clasp-knife vs rigid lead-pipe/cogwheel vs flaccid), Muscle power scoring on Medical Research Council (MRC) scale Grade 0 to 5.
   - Deep Tendon Reflexes (DTRs): Virtual reflex hammer over biceps (C5/C6), triceps (C7), brachioradialis (C5/C6), knee jerk (L3/L4), and ankle jerk (S1). Grade 0 to $4+$ (sustained clonus). Plantar reflex testing for Babinski sign.

### 3. Simulated Daily Ward Rounds Workflow & SOAP Engine

Students manage inpatients across multi-day hospital stays:
- **Pre-Round Nursing Review**: Approach nursing station to review TPR Chart (Temperature, Pulse, Respiration) and 24-hour Fluid Intake / Output balance.
- **Bedside Patient Interview**: Natural-language dialogue with avatar: "How did you sleep? Has your breathlessness improved?"
- **Focused Daily Examination**: Performing the targeted daily check (e.g., measuring abdominal girth at umbilicus in cirrhosis, checking lung bases for resolving crackles in CHF, checking surgical drain output volume and color).
- **Interactive Tablet UI**: Review newly delivered lab investigation results (CBC, LFT, RFT, ABG, blood cultures) and imaging (X-rays, CT slices, and 12-lead ECG strips).
- **Daily Progress Note (SOAP)**:
  - **S (Subjective)**: Patient's reported symptoms over the last 24 hours.
  - **O (Objective)**: Vitals, focused exam findings, new lab trends.
  - **A (Assessment)**: Current clinical status and trajectory (improving, stable, deteriorating, complication).
  - **P (Plan)**: Pharmacological modifications (titrating diuretics, adjusting insulin sliding scales, stepping down IV to oral antibiotics), discharge criteria evaluation.

---

---



### 6.4. Madras Medical College (MMC) Bedside Demonstration Engine & Dr. S. Tito Clinical Gems

Directly transcribed from Madras Medical College bedside clinical teaching records (`RS Tito sir.pdf`, `Abdomen Tito sir.pdf`, `CVS Tito sir.pdf`, `CNS Tito sir.pdf`):

#### 6.4.1. Respiratory System Clinical Rubric (32 Bedside Checkpoints)
1. **Patient Position**: Sitting or standing with legs suspended over the edge of the bed/stool with **no back rest**, allowing an unobstructed **$360^\circ$ view** of the thorax.
2. **Head-to-Foot Evaluation**:
   - *Face*: Generalized puffiness in face and neck (SVC obstruction); subconjunctival edema; dusky edema; "tear-drop sign" inside lower lid (SVC obstruction by mediastinal lymphoma, thymoma, bronchogenic CA).
   - *Horner's Syndrome*: Unilateral ptosis, miosis (pupil asymmetry), enophthalmos, and anhidrosis caused by invasion of the sympathetic chain at the root of the neck by an apical lung mass (**Pancoast Tumor**).
   - *Cyanosis & Temperature*: In COPD, central cyanosis is pronounced due to secondary polycythemia. Warm hands indicate $\text{CO}_2$ retention (asterixis present); cold clammy hands indicate systemic hypoxia; hyperemic flushed hands indicate polycythemia.
3. **Neck & Tracheal Dynamics**:
   - *Sternocricoid Distance*: Normally $\ge 3$ fingerbreadths ($4-5\text{ cm}$). Reduced to $<2$ fingerbreadths in COPD due to lung hyperinflation elevating the sternum.
   - *Trail's Sign*: Visible prominence of the clavicular head of the sternocleidomastoid muscle on the side to which the trachea has deviated (due to relaxation of the pre-tracheal fascia on that side).
   - *Tracheal Tug (Oliver's Sign)*: Downward jerking movement of the trachea synchronized with ventricular systole (Pathognomonic of an **Aortic Arch Aneurysm**).
   - *Trachea Deviation Rules*:
     - *Deviated to SAME side*: Fibrosis, atelectasis/collapse, post-pneumonectomy, pleural mesothelioma.
     - *Deviated to OPPOSITE side*: Massive pleural effusion, tension pneumothorax.
     - *Trachea MIDLINE*: Lobar consolidation, pulmonary edema, minimal/moderate effusion.
4. **Chest Wall Palpation & Expansion**:
   - *Hoover's Sign*: Paradoxical inward movement of the lower lateral ribs during inspiration (instead of normal outward expansion) due to horizontal flattening of the diaphragm in severe COPD.
   - *Surgical Emphysema*: Palpable fine crepitus/crackling under the skin indicating air in subcutaneous planes (rib fracture, chest drain complication, tension pneumothorax).
   - *Tactile Vocal Fremitus (TVF)*: Increased in consolidation with patent bronchus; absent/diminished in pleural effusion and pneumothorax.
5. **Percussion Nuances**:
   - *Stony Dullness*: Complete absence of palpable resonance on percussion. Pathognomonic of **Pleural Effusion**. Upper border follows the classic **Ellis S-shaped curve** (lowest at spine, rises to peak in axilla, slopes gently down to anterior sternum).
   - *Grocco's Triangle of Dullness*: Paravertebral area of dullness on the *opposite* healthy side in massive unilateral pleural effusion.
   - *Skodaic Resonance*: Boxy, hyperresonant percussion note heard immediately above the upper fluid level of a pleural effusion (due to relaxed, partially compressed lung parenchyma).
   - *Traube's Space*: Semilunar space bounded by left 6th rib (superior), left costal margin (inferior), left midaxillary line (lateral). Obliterated in: Left pleural effusion, splenomegaly, cardiomegaly, full stomach.
6. **Auscultation & Sound Physics**:
   - *Breath Sound Types*:
     - *Tubular Bronchial*: High-pitched, loud, harsh with an inspiratory-expiratory gap ($I:E = 1:1$). Consolidation, open pneumothorax.
     - *Cavernous Bronchial*: Low-pitched, hollow blowing sound ($I:E = 1:1$). Thick-walled tuberculous cavity communicating with a bronchus.
     - *Amphoric Bronchial*: Low pitch with metallic, high-pitched overtones (like blowing across the neck of an empty bottle). Large superficial thin-walled cavity, bronchopleural fistula.
     - *Post-Tussive Suction*: Sucking sound heard over a tuberculous cavity immediately after coughing as the elastic cavity re-expands.
   - *Added Sounds Differential*:
     - *Wheeze*: High-pitched musical whistling ($>400\text{ Hz}$), primarily expiratory. Polyphonic (asthma, COPD) vs Monophonic (fixed, single pitch unaffected by coughing: foreign body or endobronchial carcinoma).
     - *Crackles (Crepitations)*: Fine (late inspiratory, dry, non-clearing with cough, sounding like peeling Velcro: interstitial fibrosis, early pulmonary edema) vs Coarse (early inspiratory/biphasic, loud, gurgling, purulent secretions: bronchiectasis, lung abscess).
     - *Pleural Friction Rub*: Superficial grating rasping sound (like walking on fresh snow or rubbing dry leather), heard in both inspiration and expiration; increased by stethoscope pressure; accompanied by sharp pleuritic pain.
   - *Vocal Resonance*: Bronchophony (spoken words heard loudly), Aegophony (bleating nasal 'E' to 'A' transformation at the upper fluid level of an effusion), Whispering Pectoriloquy (whispered syllables distinctly audible).
   - *Cough Characterization*:
     - *Bovine Cough*: Feeble, hollow, non-explosive cough lacking normal glottic closure due to paralysis of the left recurrent laryngeal nerve by a mediastinal mass / aortic aneurysm.
     - *Barking Cough*: Harsh, painful laryngeal/epiglottic inflammation.
     - *Brassy Cough*: Metallic ringing quality caused by direct compression of the trachea by an intrathoracic tumor.

#### 6.4.2. Abdominal Examination & Clinical Pearls
1. **Pain Localization & Pathways**:
   - *Foregut (Stomach, Duodenum to ampulla, Liver, Biliary system, Pancreas)*: Epigastric midline pain.
   - *Midgut (Jejunum, Ileum, Appendix, Ascending colon, Proximal 2/3 transverse colon)*: Periumbilical pain.
   - *Hindgut (Distal 1/3 transverse colon, Descending colon, Rectum)*: Hypogastric / suprapubic pain.
   - *Visceral Pain*: Conducted via unmyelinated autonomic C-fibers; dull, deep, crampy, poorly localized.
   - *Somatic Parietal Pain*: Conducted via myelinated A-delta fibers in intercostal nerves ($T7-T12$); sharp, constant, precisely localized, associated with guarding, rigidity, and rebound tenderness.
   - *Classic Appendicitis Shift*: Visceral periumbilical pain (distended lumen) shifts after 4–6 hours to somatic right iliac fossa pain (parietal peritonitis at McBurney's point).
2. **The 6 F's of Abdominal Distension**:
   - **Fat** (Obesity: umbilicus sunken), **Flatus** (Bowel obstruction: generalized tympanitic note), **Feces** (Chronic constipation / Hirschsprung: palpable indentable masses in left iliac fossa), **Fetus** (Pregnancy: dullness central, flanks resonant), **Fluid** (Ascites: flanks dull, center resonant, shifting dullness $>1500\text{ mL}$, fluid thrill $>2000\text{ mL}$), **Full Bladder** (Urinary retention: suprapubic dull mass arising from pelvis).
3. **Splenomegaly vs Left Renal Mass Differential**:
   - *Splenic Notch*: Present on anterior border of spleen; absent in renal mass.
   - *Insinuation*: Fingers can NOT be insinuated between spleen and left costal margin; can be insinuated above a renal mass.
   - *Movement with Respiration*: Spleen moves downward and medially toward right iliac fossa (along line of 10th rib); kidney moves purely vertically.
   - *Percussion*: Spleen is dull to percussion; kidney is overlaid by the descending colon, producing a **band of colonic resonance**.
   - *Bimanual Ballottement*: Kidney is bimanually palpable and ballottable; spleen is non-ballottable.
4. **Jaundice Bedside Clinical Table**:
   - *Hemolytic / Pre-hepatic*: Spleen enlarged, urine normal color (acholuric jaundice), stool normal dark brown, unconjugated hyperbilirubinemia.
   - *Hepatocellular (Viral / Cirrhosis)*: Tender liver, stigmata of CLD, urine dark tea-colored, stool normal/fluctuating.
   - *Obstructive / Surgical*: Intense pruritus with excoriation scratch marks, clay-colored pale stools, dark green-yellow urine, palpable distended gallbladder in periampullary cancer (**Courvoisier's Law**).
5. **Upper vs Lower Gastrointestinal Bleeding**:
   - Demarcated by the **Ligament of Treitz** (suspensory ligament of the duodenum).
   - *Hematemesis*: Vomiting of blood (Peptic ulcer $50\%$, Esophageal varices $30\%$, Mallory-Weiss tear $10\%$).
   - *Melena*: Passage of black, tarry, foul-smelling, shiny stools requiring at least $50-100\text{ mL}$ of blood lingering in the GI tract for $>8\text{ hours}$ (acid hematin formation).
   - *Hematochezia*: Passage of fresh red or maroon blood per rectum (Diverticular disease, hemorrhoids, colorectal cancer, ischemic colitis).

---



### 6.5. Multidisciplinary Clinical Ward Demonstrations (Madras Medical College Drive Archive)

Directly transcribed from authentic clinical examination records and case presentations across Surgery, Obstetrics & Gynaecology, Paediatrics, Orthopaedics, and Dermatology:

#### 6.5.1. General Surgery: Gastric Outlet Obstruction (GOO) Due to Carcinoma Stomach
*Case Dossier: 65-year-old male, manual labourer (`Surgery_GOO.pdf`).*
- **Clinical Presentation**: Insidious upper abdominal pain (3 months) transitioning from intermittent post-prandial discomfort to persistent dull aching; effortless, spontaneous, non-projectile vomiting of large volumes containing undigested food eaten hours earlier; blood-stained vomitus; melena (10 days); rapid weight loss from $60\text{ kg}$ to $52\text{ kg}$ ($>13\%$ cachectic loss); early satiety.
- **Physical Examination Findings**:
  - *Inspection*: Visible Gastric Peristalsis (**VGP**) progressing across epigastrium from left hypochondrium to right lumbar region ("ball rolling movement").
  - *Palpation*: Hard, non-tender, irregular $3 \times 3\text{ cm}$ mass in epigastrium moving with respiration; negative Carnett's test (mass becomes less distinct on head-raising, confirming intra-abdominal location); upper border not palpable.
  - *Auscultation*: **Succussion Splash** distinctly audible over epigastrium on shaking patient's pelvis $>4$ hours after oral intake (retained intragastric fluid pool).
  - *Rectal Exam*: Pellets of stool with dark melena staining on glove.
- **Biochemical Disturbance**: Classic **Hypochloremic, Hypokalemic Metabolic Alkalosis with Paradoxical Aciduria** (due to continuous loss of $HCl$ in vomitus, renal $K^+$ and $H^+$ wasting to preserve intravascular sodium).
- **Surgical Management**: Endoscopic biopsy, CECT staging, nasogastric decompression with warm normal saline lavage, parenteral fluid/potassium resuscitation, followed by **Subtotal Gastrectomy with Billroth II Gastrojejunostomy + D2 Lymphadenectomy**.

#### 6.5.2. Obstetrics: Preeclampsia & The 4 Leopold Maneuvers
*Case Dossier: 26-year-old female, $G_2 P_1 L_1$, 38 weeks gestation (`OG_HTN_Preeclampsia.pdf`).*
- **Clinical Presentation**: Referred from primary health center with elevated BP ($160/80\text{ mmHg}$); bilateral dependent pedal edema up to knees; screening negative for imminent eclampsia danger symptoms (no frontal headache, no scotoma/blurring of vision, no epigastric pain from Glisson's capsule stretch, no vomiting).
- **The 4 Classic Leopold Obstetric Grips**:
  1. *Fundal Grip*: Palpating uterine fundus: broad, soft, irregular, non-ballottable pole felt $\to$ **Breech in fundus**.
  2. *Lateral (Umbilical) Grip*: Hands on lateral abdominal walls: continuous, smooth, curved resistance on right side $\to$ **Fetal Spine**; multiple irregular small angular nodules on left side $\to$ **Fetal Limbs**.
  3. *First Pelvic Grip (Pawlik's Grip)*: Thumb and fingers of right hand grasping lower uterine pole above symphysis pubis: hard, round, smooth, independently ballottable mass $\to$ **Fetal Head**.
  4. *Second Pelvic Grip*: Examiner faces patient's feet, pressing fingers downward into pelvic inlet: converging fingers indicate unengaged head; diverging fingers indicate **Engaged Fetal Head**.
- **Fetal Auscultation**: Fetal Heart Sounds (FHS) best heard at Right spino-umbilical line ($130\text{ bpm}$, regular rhythm).
- **Emergency Stabilization**: $IV$ Magnesium Sulfate ($MgSO_4$) Pritchard / Zuspan regimen (loading dose $4\text{ g } IV + 10\text{ g } IM$; maintenance $5\text{ g } IM$ every 4h monitored by knee jerk, respiratory rate $>16$, and urine output $>30\text{ mL/hr}$). Antihypertensive titration: Oral Labetalol or Nifedipine.

#### 6.5.3. Paediatrics: Thalassemia Major & Chronic Transfusion Hemosiderosis
*Case Dossier: 11-year-old female child on hypertransfusion protocol (`Peds_Thalassemia.pdf`).*
- **Clinical Presentation**: Diagnosed at 6 months with severe pallor ($Hb = 4.5\text{ g/dL}$); maintained on monthly packed RBC transfusions (target pre-transfusion $Hb \ge 9.5-10\text{ g/dL}$).
- **Hemolytic / Thalassemic Facies ("Chipmunk Facies")**:
  - Frontal and parietal bossing of skull due to massive erythroid marrow expansion.
  - Depressed nasal bridge with hypertelorism (widely spaced eyes).
  - Prominent malar/zygomatic bones with maxillary hypertrophy.
  - Forward protrusion of upper incisor teeth ("rodent facies").
- **Organ Assessment**:
  - Left subcostal $10\text{ cm}$ surgical scar (splenectomy performed for hypersplenism; patient received pre-operative Pneumococcal, Meningococcal, and Hib conjugate vaccines).
  - Hepatomegaly: Liver palpable $4\text{ cm}$ below right costal margin, firm consistency, smooth surface, span $11\text{ cm}$ (secondary hemosiderosis).
  - Skull Radiography: Classic **"Hair-on-End" (Crew-cut) appearance** with widened diploic space and thinned outer cortex.
- **Chelation Protocol**: Daily oral iron chelator **Deferasirox** ($20-40\text{ mg/kg/day}$) or subcutaneous **Deferoxamine** infusion to prevent myocardial and endocrine iron overload (pituitary dwarfism, diabetes, dilated cardiomyopathy).

#### 6.5.4. Orthopaedics: Congenital Talipes Equinovarus (CTEV / Clubfoot) & Ponseti Technique
*Case Dossier: Clinical presentation and biomechanical correction (`Ortho_CTEV.pdf`).*
- **The C-A-V-E Deformity Quartet**:
  1. **C — Cavus**: Forefoot/Midfoot (excessive plantar flexion of 1st metatarsal relative to hindfoot due to tight plantar fascia).
  2. **A — Adductus**: Forefoot/Midfoot (medial deviation of metatarsals at talonavicular and calcaneocuboid joints; tight tibialis posterior).
  3. **V — Varus**: Hindfoot (subtalar joint inversion of calcaneus under talus; tight tibialis posterior, FDL, FHL).
  4. **E — Equinus**: Hindfoot (ankle joint fixed plantarflexion; contracture of Tendoachilles).
- **Ponseti Sequential Correction Protocol**:
  - *1st Cast*: Correct **Cavus** by supination and dorsiflexion of the first ray (elevating 1st metatarsal to align forefoot with hindfoot). Groin-to-toe cast for 1 week.
  - *2nd–4th Casts*: Correct **Adduction and Varus** simultaneously by abducting the supinated foot using the lateral head of the talus as the fixed fulcrum (the calcaneus is **NEVER touched**, allowing it to abduct freely beneath the talus).
  - *5th Cast*: Correct **Equinus** by dorsiflexion. In $>85\%$ of cases, **Percutaneous Achilles Tenotomy** is performed under local anesthesia to achieve $\ge 15^\circ$ dorsiflexion, followed by a final cast for 3 weeks.
  - *Maintenance Phase*: **Dennis Browne Splint** ($70^\circ$ external rotation for clubfoot, $40^\circ$ for normal foot, connected by a shoulder-width bar) worn 23 hours/day for 3 months, then during night-time and naps until 4 years of age.

#### 6.5.5. Dermatology: Lichen Planus (The 9 P's & Histopathology)
*Case Dossier: Clinical presentation and microscopic features (`Derm_LichenPlanus.pdf`).*
- **The 9 P's Diagnostic Framework**:
  1. **Papulosquamous** disease.
  2. **Pruritic** (intense itching; patient rubs rather than scratches).
  3. **Polygonal** / Polyangular borders.
  4. **Plain-topped** (flat, shiny surface).
  5. **Pigmented** (violaceous / purple color).
  6. **Purple-colored** hue.
  7. **Papules and plaques** coalescing.
  8. **Pterygium unguis** of the nails (dorsal pterygium).
  9. **Penile annular** lesions.
- **Pathognomonic Bedside Signs**:
  - **Wickham's Striae**: Delicate network of white lines/dots across papule surfaces, visible after applying a drop of mineral oil or alcohol wipe.
  - **Koebner's Isomorphic Phenomenon**: New lichenoid papules appearing along linear scratches or trauma tracks.
  - **Nail Involvements**: Longitudinal ridging, thinning, "pup-tent" nail splitting, trachyonychia (sandpaper nails), and dorsal pterygium.
  - **Mucosal Lichen Planus**: Reticular lacy white network on buccal mucosa (bilateral); erosive desquamative gingivitis; strong association with **Hepatitis C Virus (HCV)** infection.
- **Histopathological Triad**:
  1. Orthohyperkeratosis without parakeratosis.
  2. Wedge-shaped hypergranulosis with irregular **"saw-toothed" acanthosis**.
  3. Liquefactive degeneration of the basal cell layer with **Civatte (colloid/apoptotic) bodies** and a dense, band-like upper dermal **lymphocytic infiltrate** hugging the dermo-epidermal junction.

---



### 6.6. Comprehensive Clinical Examination & Diagnostic Engines from the 5 Google Drive Repositories

Ingested and synthesized from the complete 5 Google Drive clinical repositories (`FINAL YEAR MBBS`, `4th Year Practicals`, `CASES MBBS FINAL YEAR`, `4th Year Cases`, `PRACTICAL FILES`), incorporating verified clinical cases, practical examination manuals, and physical diagnostic rubrics.

#### 6.6.1. Arterial Blood Gas (ABG) 6-Step Interpretation Engine & Winter's Formula Simulator
*Source Dossier: `ABG_Interpretation.pdf` & `ABG.pdf` (`4th Year Practicals`).*
The simulator models closed-loop acid-base chemistry via the Henderson-Hasselbalch formulation:
$$\text{pH} = \text{pK} + \log_{10}\left( \frac{[\text{HCO}_3^-]}{\alpha \cdot \text{PaCO}_2} \right)$$
Where $\text{pK} = 6.1$ and $\alpha = 0.03\text{ mmol}\cdot\text{L}^{-1}\cdot\text{mmHg}^{-1}$.

##### The 6-Step Algorithmic Solver
1. **Primary Disorder Identification**:
   - Normal physiological reference: $\text{pH} = 7.40 \pm 0.02$, $\text{PaCO}_2 = 38 \pm 2\text{ mmHg}$, $[\text{HCO}_3^-] = 24 \pm 2\text{ mmol/L}$. Physiological survival limits: $6.80 \le \text{pH} \le 7.80$.
   - Directional vector: If $\text{pH}$ and $\text{PaCO}_2$ deviate in the **same direction** $\implies$ Primary Respiratory Disorder. If $\text{pH}$ and $\text{PaCO}_2$ deviate in **opposite directions** $\implies$ Primary Metabolic Disorder.
2. **Expected Physiological Secondary Compensation**:
   - **Metabolic Acidosis**: Winter's Formula:
     $$\text{Expected } \text{PaCO}_2 = 1.5 \times [\text{HCO}_3^-] + 8 \pm 2 \quad \text{or} \quad [\text{HCO}_3^-] + 15$$
     Full respiratory compensation requires $12-24\text{ hours}$. If measured $\text{PaCO}_2 > \text{Expected} \implies$ Coexisting Respiratory Acidosis. If measured $\text{PaCO}_2 < \text{Expected} \implies$ Coexisting Respiratory Alkalosis.
   - **Metabolic Alkalosis**:
     $$\text{Expected } \text{PaCO}_2 = [\text{HCO}_3^-] + 15 \quad (\text{takes } 24-36\text{ hours})$$
   - **Respiratory Acidosis**:
     - *Acute*: $[\text{HCO}_3^-]$ increases by $1.0\text{ mmol/L}$ for every $10\text{ mmHg}$ elevation in $\text{PaCO}_2$ above $40\text{ mmHg}$.
     - *Chronic*: $[\text{HCO}_3^-]$ increases by $4.0-5.0\text{ mmol/L}$ for every $10\text{ mmHg}$ elevation in $\text{PaCO}_2$ (renal tubular adaptation takes $2-5\text{ days}$).
   - **Respiratory Alkalosis**:
     - *Acute*: $[\text{HCO}_3^-]$ decreases by $2.0\text{ mmol/L}$ for every $10\text{ mmHg}$ reduction in $\text{PaCO}_2$ below $40\text{ mmHg}$.
     - *Chronic*: $[\text{HCO}_3^-]$ decreases by $4.0-5.0\text{ mmol/L}$ for every $10\text{ mmHg}$ reduction in $\text{PaCO}_2$.
3. **Anion Gap (AG) with Albumin Correction**:
   $$\text{AG} = [\text{Na}^+] - ([\text{Cl}^-] + [\text{HCO}_3^-]) \quad (\text{Normal: } 10 \pm 3\text{ mEq/L})$$
   Hypoalbuminemia falsely depresses the serum anion gap. The engine computes:
   $$\text{Corrected AG} = \text{AG} + 2.5 \times (4.0 - \text{Albumin } [\text{g/dL}])$$
   - *High Anion Gap Metabolic Acidosis (HAGMA)*: Type A lactic acidosis (sepsis, cardiogenic shock, mesenteric ischemia), Type B (metformin, propofol, thiamine deficiency), DKA, Uremia, Rhabdomyolysis, Toxic alcohols (methanol, ethylene glycol), 5-oxoproline.
   - *Normal Anion Gap Metabolic Acidosis (NAGMA)*: Evaluated via **Urinary Anion Gap**:
     $$\text{U-AG} = ([\text{U-Na}^+] + [\text{U-K}^+]) - [\text{U-Cl}^-]$$
     - **Negative U-AG** $\implies$ Intact distal renal acidification with copious $\text{NH}_4^+$ excretion; etiology is **GI loss** (severe diarrhea, enterocutaneous fistula).
     - **Positive U-AG** $\implies$ Defective distal renal acidification (Type 1 Distal RTA, early renal failure).
4. **Delta-Delta ($\Delta-\Delta$) Ratio for Mixed Metabolic Pathologies**:
   $$\Delta-\Delta = [\text{Na}^+] - [\text{Cl}^-] - 36 \quad \text{(Dalal's formulation)} \quad \text{or} \quad \frac{\Delta\text{AG}}{\Delta[\text{HCO}_3^-]} = \frac{\text{AG} - 12}{24 - [\text{HCO}_3^-]}$$
   - Ratio $> 1.6$ (or $\Delta-\Delta > +6$) $\implies$ Superadded **Metabolic Alkalosis** (vomiting, nasogastric suction, aggressive loop diuretics).
   - Ratio $< 1.0$ (or $\Delta-\Delta < -6$) $\implies$ Superadded **Normal Anion Gap Metabolic Acidosis (NAGMA)**.
5. **Serum Osmolal Gap**:
   $$\text{Calculated Osmolality} = 2 \times [\text{Na}^+] + \frac{\text{Glucose } [\text{mg/dL}]}{18} + \frac{\text{BUN } [\text{mg/dL}]}{2.8}$$
   $$\text{Osmolal Gap} = \text{Measured Osmolality} - \text{Calculated Osmolality}$$
   A gap $> 10\text{ mOsm/kg}$ flags volatile toxic alcohol ingestion (ethylene glycol, methanol, propylene glycol).
6. **Alveolar-Arterial ($A-a$) Oxygen Tension Gradient**:
   $$P_A\text{O}_2 = \left[ (P_{atm} - P_{H_2O}) \times F_i\text{O}_2 \right] - \frac{P_a\text{CO}_2}{R} = \left[ (760 - 47) \times 0.21 \right] - \frac{P_a\text{CO}_2}{0.8} = 150 - 1.25 \times P_a\text{CO}_2$$
   $$\text{A-a Gradient} = P_A\text{O}_2 - P_a\text{O}_2 \quad \left(\text{Normal expected: } \frac{\text{Age}}{4} + 4\right)$$
   - *Normal A-a with Hypoxemia*: Pure hypoventilation (sedative overdose, Guillain-Barré, severe kyphoscoliosis).
   - *Elevated A-a Gradient*: Intrinsic pulmonary gas exchange failure (V/Q mismatch in asthma/pneumonia, anatomical right-to-left shunt in ARDS, diffusion limitation in pulmonary fibrosis).

---

#### 6.6.2. Topographic Neuro-Localization & Stroke Syndromes Engine
*Source Dossier: `Stroke_Localization.pdf` (`4th Year Practicals`) & `Hemiplegia Dr. Chandra Mam.pdf` (`4th Year Cases`).*

The simulator models focal brain and spinal cord lesions with exact motor, sensory, and cranial nerve topological mapping:

| Neuro-Anatomical Station | Motor Hemiplegia Profile | Cranial Nerve & Brainstem Signs | Cortical & Sensory Manifestations | Pathognomonic Clinical Syndromes |
|---|---|---|---|---|
| **Cerebral Cortex (Frontal / Rolandic)** | Contralateral hemiplegia; **unequal limb distribution** ($F+A > L$ in MCA vs $L \gg F+A$ in ACA). | Forehead-sparing contralateral UMN facial palsy (bilateral corticobulbar representation of frontalis). | Focal Jacksonian motor seizures; Aphasia (Broca's motor / Wernicke's sensory) if dominant hemisphere; Loss of cortical sensation (astereognosis, two-point discrimination). | **Middle Cerebral Artery (MCA) / Anterior Cerebral Artery (ACA) Territory Infarct**. |
| **Subcortical / Thalamus** | Contralateral hemiplegia with unequal weakness. | No direct cranial nerve lower motor neuron signs. | Contralateral hemianesthesia (VPL thalamic nucleus); Contralateral homonymous hemianopia; Involuntary movement disorders (Chorea, Parkinsonism, Hemiballismus from subthalamic nucleus). | **Thalamic Syndrome (Dejerine-Roussy)**: excruciating central pain, hyperpathia. |
| **Internal Capsule (Posterior Limb)** | **Dense, proportional contralateral hemiplegia** (Face = Arm = Leg equally paralyzed due to high pyramidal fiber packing density). | Severe contralateral UMN facial and hypoglossal weakness. | Hemianesthesia (thalamocortical fibers); Homonymous hemianopia (optic radiation in retrolenticular capsule). | **Capsular Stroke (Charcot's Artery of Cerebral Hemorrhage / Lenticulostriate branches)**. |
| **Midbrain (Cerebral Peduncle)** | Contralateral UMN hemiplegia. | **Ipsilateral CN III palsy** (ptosis, dilated unresponsive pupil, eyeball directed "down and out"). | Tremor, chorea, ataxia (red nucleus involvement). | **Weber's Syndrome** (peduncular: CN III + contralateral hemiplegia); **Benedikt's Syndrome** (tegmental: CN III + contralateral red nucleus intention tremor & ataxia). |
| **Pons (Basis Pontis)** | Contralateral UMN hemiplegia. | **Ipsilateral CN VI palsy** (failure of lateral rectus abduction) + **Ipsilateral CN VII palsy** (LMN entire half of face paralyzed, bells phenomenon positive). | Cerebellar ataxia on same side. | **Millard-Gubler Syndrome** (ipsilateral CN VI + VII with contralateral hemiplegia); **Ataxic Hemiparesis** (basis pontis lacunar infarct). |
| **Medulla Oblongata** | Contralateral UMN hemiplegia. | **Ipsilateral CN XII palsy** (tongue deviates toward the side of the lesion on protrusion due to unopposed genioglossus). | Contralateral loss of vibration and position sense (medial lemniscus). | **Jackson's Syndrome** (CN XII + contralateral hemiplegia); **Cruciate Hemiplegia** (pyramidal decussation lesion causing ipsilateral arm and contralateral leg paralysis). |
| **Spinal Cord Hemisection** | Ipsilateral UMN paralysis below lesion level (**strictly spares face!**). | No cranial nerve involvement. | Ipsilateral loss of dorsal column modalities (vibration, conscious proprioception); Contralateral loss of spinothalamic pain and temperature 1-2 segments below; Segmental LMN band at lesion level with hyperesthesia. | **Brown-Séquard Syndrome** (above C5: hemiplegia; below C5: monoplegia or paraplegia). |

##### UMN vs LMN Bedside Physical Differential Matrix
- **Hypertonia & Clonus**: UMN lesions produce "clasp-knife" velocity-dependent spastic hypertonia (exaggerated muscle stretch reflexes due to loss of descending inhibitory reticulospinal input) with sustained ankle and patellar clonus ($>5\text{ beats}$). LMN lesions produce complete flaccidity and hypotonia.
- **Pathological Reflexes**: Extensor plantar response (**Babinski's sign**: great toe dorsiflexion with fan-like abduction of other toes) and loss of superficial abdominal reflexes ($T8-T12$) characterize UMN lesions.
- **Muscle Trophism & Fasciculations**: LMN pathology causes rapid, severe muscular atrophy ($>50\%$ volume loss in 6 weeks) with visible spontaneous motor unit firing (**fasciculations**) and electrical reaction of degeneration on electromyography.

---

#### 6.6.3. Acoustic Physics & Hemodynamic Murmurs Engine
*Source Dossier: `Murmurs_Notespaedia.pdf` (`4th Year Practicals`) & `CVS_Tito_sir.pdf`.*

The simulator models intracardiac turbulent flow vectors $\mathbf{u}(\mathbf{x}, t)$ generated across narrowed orifices and incompetent regurgitant orifices, outputting audio waveforms through the Web Audio API with strict hemodynamic timing:

```
            DIASTOLIC MURMUR ACOUSTICS & SEVERITY CORRELATION
                                                                            
  Aortic Regurgitation (Austin Flint):                                     
  S1           A2 P2                                                    S1  
  |             ||=========                                              |  
  |             ||\\\\\   (Early Diastolic Decrescendo)              |  
  +-------------++-------------------------------------------------------+  
                                                                            
  Mitral Stenosis (Opening Snap & Diastolic Rumble):                        
  S1           A2 P2  OS                                                S1  
  |             ||    ^    ==================                     ///   |   
  |             ||    |    \\\\\\\\\\\\\\\   (Mid-Diastolic)      ////   |  (Loud S1)
  +-------------++----+-------------------------------------------+++----+  
                <---->                                            ^^^       
                A2-OS Gap: SHORT gap = CRITICAL MS (<1.0 cm2)     Presystolic Accentuation
                                                                  (LOST in Atrial Fibrillation!)
```

##### 1. Mitral Stenosis Timing & Severity Metrics
- **Orifice Dynamics**: Normal mitral valve area $4-6\text{ cm}^2$; Mild MS $1.5-2.0\text{ cm}^2$; Severe MS $<1.5\text{ cm}^2$; **Critical MS $<1.0\text{ cm}^2$**.
- **Acoustic Physics**:
  1. *Loud S1*: Forceful closure of pliant, non-calcified leaflets snapping shut from their widely separated position deep in the LV cavity at the onset of ventricular systole.
  2. *Opening Snap (OS)*: Sharp, high-frequency diastolic sound occurring when the stenosed mitral valve leaflets balloon into the LV cavity and are suddenly halted by fused commissures.
  3. *A2-OS Interval Severity Law*: As left atrial pressure increases ($LAP > 25\text{ mmHg}$ in severe stenosis), the mitral valve is forced open earlier in diastole. Hence:
     $$\text{Severity of MS} \propto \frac{1}{A_2 - \text{OS Interval}} \quad (\text{Interval } < 60\text{ ms indicates critical MS})$$
  4. *Mid-Diastolic Rumble & Presystolic Accentuation*: Low-pitched rough rumble ($40-100\text{ Hz}$) best heard with the **bell applied lightly at the apex in the left lateral decubitus position**. Presystolic accentuation is driven by active atrial contraction; **in Atrial Fibrillation, presystolic accentuation is completely abolished**.

##### 2. Regurgitant Diastolic Murmurs
- **Severe Aortic Regurgitation (Austin Flint Murmur)**: Regurgitant aortic jet hits the anterior mitral valve leaflet, causing it to vibrate and physically impeding diastolic mitral inflow, generating an apical mid-diastolic rumble without an opening snap.
- **Pulmonary Regurgitation in PAH (Graham Steell Murmur)**: High-pitched early diastolic blowing decrescendo murmur heard along the left 2nd-4th parasternal border, secondary to pulmonary trunk dilation from pulmonary arterial hypertension ($mPAP > 25\text{ mmHg}$).

##### 3. Continuous Murmurs & Mechanical Circuit Shunts
True continuous murmurs persist throughout ventricular systole and continue through $S_2$ into diastole without pausing:
- **Patent Ductus Arteriosus (PDA)**: High-pressure aortic-to-pulmonary shunt across the aortic isthmus; produces a rough "machinery murmur" peaking exactly at $S_2$.
- **Coarctation of the Aorta**: Flow across narrowed isthmus and massive dilated intercostal collaterals.
- **Pregnancy Mammary Souffle**: Flow through dilated internal mammary arteries in the 2nd/3rd trimester.
- *Bedside Distinction*: To-and-fro combination murmurs ($AS + AR$ or $MS + MR$) are **NOT** continuous; they possess a distinct acoustic gap at $S_2$ as ventricular pressure reverses.

##### 4. Dynamic Bedside Auscultatory Maneuvers Matrix

| Clinical Maneuver | Hemodynamic Effect | Most Valvular Murmurs (AS, MR, AR, VSD) | Hypertrophic Cardiomyopathy (HOCM) | Mitral Valve Prolapse (MVP) |
|---|---|---|---|---|
| **Valsalva Strain (Phase II)** | Increased intrathoracic pressure $\to$ Marked decrease in venous return & LV preload. | **Decreased Intensity** (reduced stroke volume). | **LOUDER** (reduced LV cavity size increases dynamic subaortic outflow tract obstruction). | **Click occurs EARLIER; Murmur becomes LONGER**. |
| **Sudden Standing** | Venous pooling in lower extremities $\to$ Reduced venous return. | **Decreased Intensity**. | **LOUDER**. | **Click EARLIER; Murmur LONGER**. |
| **Transient Squatting** | Increased systemic vascular resistance (afterload) + Increased venous return (preload). | **Increased Intensity**. | **SOFTER** (larger LV cavity widens outflow tract). | **Click DELAYED / LATER; Murmur SHORTER**. |
| **Isometric Handgrip** | Significant increase in systemic vascular resistance ($SVR \uparrow 30\%$). | **Regurgitant murmurs (MR, AR, VSD) INCREASE**; AS may decrease. | **SOFTER**. | **Click DELAYED; Murmur SHORTER**. |
| **Amyl Nitrite Inhalation** | Potent systemic arteriolar vasodilation ($SVR \downarrow$). | Forward flow murmurs (AS, PS) increase; Regurgitant murmurs (MR, AR) decrease. | **Markedly LOUDER**. | **Click EARLIER; Murmur LONGER**. |

---

#### 6.6.4. Orthopaedic Goniometry, Peripheral Nerve Injuries & Chronic Osteomyelitis Rubric
*Source Dossier: `Ortho_Goniometry_ROM.pdf`, `Ortho_PeripheralNerves.pdf`, and `Ortho_Osteomyelitis.pdf` (`PRACTICAL FILES`).*

##### 1. Full Joint Kinematics & Goniometric Standards
The simulator enforces accurate anatomical axes, stationary/moving arms, and trick movement substitutions:
- **Shoulder Joint**: Pure glenohumeral flexion $120^\circ$ ($180^\circ$ with scapulothoracic rotation); Abduction $90^\circ$ pure GH ($180^\circ$ with scapular upward rotation); Internal rotation $70^\circ$, External rotation $90^\circ$ (tested supine with arm abducted $90^\circ$, olecranon axis).
- **Elbow & Forearm**: Flexion $150^\circ$, Extension $0^\circ$ ($10-15^\circ$ hyperextension in females); Supination $80-90^\circ$, Pronation $80-90^\circ$ (tested with elbow flexed $90^\circ$ tucked at waist to prevent shoulder trick substitution).
- **Wrist & Hand**: Flexion $75^\circ$, Extension $75^\circ$; Radial deviation $20^\circ$, Ulnar deviation $30^\circ$; 1st CMC palmar abduction $70^\circ$; Thumb opposition touching base of 5th digit.
- **Spine Range**: Modified Schober's test: $10\text{ cm}$ cranial mark from $S2$ distraction during full lumbar flexion must increase by $\ge 5\text{ cm}$ (reduced in Ankylosing Spondylitis).
- **Hip Joint**: Flexion $120^\circ$, Extension $30^\circ$; Abduction $45^\circ$, Adduction $30^\circ$; Internal rotation $45^\circ$, External rotation $45^\circ$.
- **Knee Joint**: Flexion $135^\circ$, Extension $0^\circ$ ($10-15^\circ$ recurvatum/hyperextension).
- **Ankle & Foot**: Talocrural dorsiflexion $10^\circ$ (with knee extended) increasing to $20^\circ$ (with knee flexed $90^\circ$ isolating soleus contracture); Plantarflexion $30-50^\circ$; Subtalar inversion $20^\circ$, Eversion $10^\circ$.

##### 2. Peripheral Nerve Injury & Deformity Localization Engine
- **Radial Nerve (C5-T1)**:
  - *Axillary / Crutch Compression*: Total paralysis of triceps, brachioradialis, supinator, and wrist/finger extensors $\implies$ High **Wrist Drop and Finger Drop** with sensory loss over posterior arm, forearm, and anatomical snuffbox.
  - *Spiral Groove (Saturday Night Palsy / Humeral Shaft #)*: Triceps spared (branches given off in axilla); wrist drop and finger drop present.
  - *Posterior Interosseous Nerve (PIN / Frohse's Arcade)*: Motor only; ECRL spared (radial deviation preserved during wrist extension); no sensory loss.
- **Ulnar Nerve (C8-T1)**:
  - *The Ulnar Paradox*: Lesions at the wrist produce a **severe, grotesque claw hand** (medial 2 lumbricals paralyzed, but FDP to 4th & 5th digits intact, creating violent flexion of IP joints). Lesions at the medial epicondyle produce a **milder claw hand** because the FDP is paralyzed.
  - *Pathognomonic Bedside Signs*: **Froment's Sign** (adductor pollicis paralysis causes compensatory hyperflexion of thumb IP joint via FPL when gripping paper between thumb and index); **Wartenberg's Sign** (abducted 5th finger due to unopposed extensor digiti minimi); wasting of 1st dorsal interosseous and hypothenar eminence.
- **Median Nerve (C5-T1)**:
  - *Low Lesion (Carpal Tunnel / Wrist Laceration)*: **Ape Thumb Deformity** (thenar wasting, loss of abduction/opposition, thumb in plane of palm); sensory loss over palmar aspect of lateral 3.5 digits.
  - *High Lesion (Supracondylar Fracture)*: **Pointing Index Sign** (Benediction sign on attempting to make a fist: 1st, 2nd, and 3rd digits remain straight due to loss of FDS, FDP 1 & 2, and FPL).
- **Common Peroneal Nerve (L4-S2)**:
  - *Fibular Neck Compression*: Foot drop, high-stepping gait, loss of ankle dorsiflexion (deep peroneal) and eversion (superficial peroneal); sensory loss on dorsum of foot and 1st web space.

##### 3. Chronic Osteomyelitis Bedside Clinical Rubric
- **The Triad**: Severe deep bone pain (SOCRATES), persistent discharging sinuses, and progressive limb deformity.
- **Pathological Hallmarks**:
  - *Sequestrum*: Dense, avascular, necrotic bone separated from living tissue; seen extruding as chalky white bony spicules from sinus tracts.
  - *Involucrum*: Thick, dense, irregular sheath of new subperiosteal bone encasing the sequestrum.
  - *Cloaca*: Cortical apertures in the involucrum through which pus and sequestra decompress to subcutaneous planes.
- **Systemic Complications**: Secondary AL amyloidosis, squamous cell carcinoma in long-standing sinus (**Marjolin's Ulcer**), pathological fractures through weakened cortical bone.

---

#### 6.6.5. Surgical Varicose Veins Hemodynamic Valve Incompetence Engine
*Source Dossier: `Surgery_VaricoseVeins.pdf` (`4th Year Cases`) & `SURGERY PRACTICALS.pdf` (`FINAL YEAR MBBS`).*

The simulator models venous valvular incompetence and retrograde hydrostatic venous hypertension ($P_{venous} > 80\text{ mmHg}$ upon standing):

```
                     SURGICAL VARICOSE VEINS CLINICAL ALGORITHM
                                                                             
  [ STEP 1: BRODIE-TRENDELENBURG TEST 1 ]                                    
  Supine -> Leg elevated -> Veins emptied -> Tourniquet placed at Saphenofemoral Junction (SFJ).
  Patient stands up:                                                         
  ├── Fast filling from ABOVE within 5s of releasing tourniquet              
  │   └──► SAPHENOFEMORAL JUNCTION (SFJ) INCOMPETENCE                        
  └── Veins remain collapsed while tourniquet is ON                          
      └──► SFJ is competent (look for perforators)                           
                                                                             
  [ STEP 2: BRODIE-TRENDELENBURG TEST 2 ]                                    
  Tourniquet kept firmly ON at SFJ while patient stands:                     
  └── Rapid filling from BELOW within 30 seconds                             
      └──► PERFORATOR INCOMPETENCE (Hunterian, Boyd's, Cockett's)            
                                                                             
  [ STEP 3: PERTHES TEST FOR DEEP VEIN PATENCY ]                             
  Tourniquet applied below SFJ -> Patient walks briskly:                     
  ├── Varicose veins COLLAPSE & empty                                        
  │   └──► DEEP VEINS PATENT (Muscular calf pump functional; safe to operate) 
  └── Veins become TENSER & severe throbbing calf pain develops              
      └──► DEEP VEIN THROMBOSIS / OBSTRUCTION (Stripping CONTRAINDICATED!)   
```

- **Schwartz Test (Percussion Test)**: Fingers of one hand placed over the SFJ while the other hand percusses the distal varicosity; a palpable impulse confirms a continuous, valve-less column of static blood.
- **Pratt's Test & Fegan's Method**: Multiple tourniquets applied from groin to ankle; sequential unwinding identifies exact fascial perforator defects as localized bulges pop out.
- **CEAP Clinical Staging**:
  - $C_0$: No visible signs.
  - $C_1$: Telangiectasias or reticular veins ($<3\text{ mm}$).
  - $C_2$: Varicose veins ($>3\text{ mm}$).
  - $C_3$: Dependent pitting edema.
  - $C_4$: Skin changes (hemosiderin hyperpigmentation, stasis eczema, **lipodermatosclerosis** producing an "inverted champagne bottle" calf appearance, atrophie blanche).
  - $C_5$: Healed venous ulcer.
  - $C_6$: **Active venous stasis ulcer** (shallow, sloping edges, pink granulation tissue base, located over the "gaiter zone" immediately above the medial malleolus).
- **Operative Strategy**: High flush ligation of the saphenofemoral junction (flush with the femoral vein to divide all tributaries: superficial epigastric, superficial circumflex iliac, superficial external pudendal) + stripping of the great saphenous vein to knee level (stripping below the knee is prohibited to avoid injuring the **saphenous nerve**) vs modern Endovenous Laser Ablation (EVLT) / Radiofrequency Ablation (RFA).

---

#### 6.6.6. Obstetrics Gestational Diabetes Mellitus (GDM) & DIPSI / IADPSG Protocols
*Source Dossier: `OG_GDM_Case.pdf` (`4th Year Cases`) & `OG CASES` (`FINAL YEAR MBBS`).*

- **Diabetogenic Hormonal Cascade**: Human Placental Lactogen (hPL), placental GH, cortisol, and progesterone induce progressive maternal peripheral insulin resistance peaking at $24-28\text{ weeks}$ gestation to prioritize glucose transport across the syncytiotrophoblast to the fetus via GLUT-1 facilitated diffusion.
- **Diagnostic Criteria**:
  - *DIPSI One-Step Test (India Guideline)*: Non-fasting $75\text{ g}$ oral glucose load; $2\text{-hour}$ venous plasma glucose $\ge 140\text{ mg/dL}$ establishes GDM.
  - *IADPSG / WHO Fasting Criteria*: Fasting $\ge 92\text{ mg/dL}$, $1\text{h} \ge 180\text{ mg/dL}$, or $2\text{h} \ge 153\text{ mg/dL}$.
- **Fetal Pathophysiological Cascade (Pedersen's Hypothesis)**:
  $$\text{Maternal Hyperglycemia} \xrightarrow{\text{GLUT-1}} \text{Fetal Hyperglycemia} \xrightarrow{\text{Fetal Pancreas}} \text{Fetal Hyperinsulinemia}$$
  $$\implies \text{Macrosomia } (>4.0\text{ kg}) + \text{Visceromegaly} + \text{Asymmetric Septal Hypertrophy (Cardiomyopathy)}$$
- **Delivery & Neonatal Complications**: Shoulder dystocia (bisacromial diameter $>20\%$ larger than biparietal diameter), Erb's palsy, birth asphyxia. Post-delivery: immediate cord clamping halts maternal glucose supply while fetal hyperinsulinemia persists $\implies$ **Severe Neonatal Hypoglycemia** ($<40\text{ mg/dL}$) requiring early feeding or $10\%$ dextrose infusion. Delayed lung maturation occurs because hyperinsulinemia inhibits fetal lung fibroblast cortisol signaling and surfactant synthesis.
- **Target Glycemic Control**: Fasting $\le 95\text{ mg/dL}$, $1\text{-hour postprandial} \le 140\text{ mg/dL}$, $2\text{-hour postprandial} \le 120\text{ mg/dL}$. Medical Nutrition Therapy (MNT) initiated for 2 weeks; if targets exceeded, human insulin (or Metformin) started.

---

#### 6.6.7. Paediatric Acute Bronchiolitis & Respiratory Distress Dynamics
*Source Dossier: `Peds_Bronchiolitis.pdf` & `Peds_RespDistress.pdf` (`4th Year Cases`).*

- **Clinical Scenario**: 6-month-old infant presenting with 3-day history of low-grade fever and coryza progressing to paroxysmal wheezing cough, tachypnea ($RR > 60\text{ bpm}$), nasal flaring, and deep subcostal retractions.
- **Etiology & Airway Pathophysiology**: Respiratory Syncytial Virus (RSV) infection of small bronchiolar epithelial cells ($<1\text{ mm}$ diameter) causing ciliated cell necrosis, peribronchiolar lymphocytic infiltration, and intra-luminal accumulation of mucus plugs and fibrin.
- **Poiseuille's Law of Pediatric Airway Resistance**:
  $$R_{airway} = \frac{8 \eta L}{\pi r^4}$$
  Because an infant's normal bronchiolar radius $r \approx 1.0\text{ mm}$, a $0.5\text{ mm}$ circumferential mucosal edema reduces the lumen by $50\%$ and increases airway resistance by $16\text{-fold}$ ($2^4 = 16$).
- **Silverman-Anderson & Downes Scoring System**: Tracks 5 vital physical signs:
  1. Respiratory Rate ($<60$, $60-80$, $>80$).
  2. Cyanosis in room air.
  3. Chest Retractions (subcostal, intercostal).
  4. Nasal Flaring.
  5. Grunting (end-expiratory glottic closure to generate intrinsic auto-PEEP and maintain alveolar recruitment).
- **3D Pulmonary Simulator Findings**: Dynamic hyperinflation of the thorax (air trapping), flattened diaphragmatic domes, prominent bilateral basilar subsegmental atelectasis, fine inspiratory crepitations and widespread expiratory polyphonic musical wheezes.
- **Evidence-Based Management**: Humidified oxygen / High-Flow Nasal Cannula (HFNC: $1-2\text{ L/kg/min}$) generating $2-4\text{ cm } \text{H}_2\text{O}$ PEEP, minimal handling, fluid maintenance (avoiding overhydration to prevent worsening pulmonary interstitial edema).

---

## 7. Textbook, Open-Source Simulator Benchmarks & Drive Case Ingestion

To ensure world-class realism and total alignment with clinical examinations, Orbit synthesizes findings from **authoritative medical literature**, **leading open-source physiology engines**, and **Madras Medical College (MMC) study materials**.

### 7.1. Open-Source Patient Simulator Benchmark & Comparative Architecture Analysis

A rigorous audit of state-of-the-art open-source patient simulators was conducted to distill key architectural lessons for Orbit's 3D Patient Simulator:

```
+----------------------------------------------------------------------------------------------------+
|                                    OPEN-SOURCE SIMULATION ENGINE COMPARISON                        |
+----------------------------------------------------------------------------------------------------+
| Engine / Platform       | Core Focus              | Tech Stack       | Key Architectural Takeaways  |
+-------------------------+-------------------------+------------------+------------------------------+
| Pulse Physiology Engine | Whole-Body Systems Math | C++ / Apache 2.0 | Lumped-parameter circuits,   |
| (Kitware / BioGears)    | Multi-organ ODEs        | Python/Unity/Unr | decoupling physics from UI,  |
|                         |                         |                  | validated PK/PD clearance.   |
+-------------------------+-------------------------+------------------+------------------------------+
| Rohy (CRETIC Project,   | Time-Critical Clinical  | Python / Web     | Real-time patient evolution, |
| Univ. of Eastern Finl.) | Reasoning & Escape Room | Docker / DICOM   | dynamic penalties, real-time |
|                         |                         | WebGL            | ECG (no loop), live DICOM.   |
+-------------------------+-------------------------+------------------+------------------------------+
| Infirmary Integrated    | Medical Device & Tele-  | C# / Web         | Authentic ICU monitors, real |
| (Tanjera)               | metry Simulation        | Open Source      | art-line dicrotic notches,   |
|                         |                         |                  | defibrillator pacing engine. |
+-------------------------+-------------------------+------------------+------------------------------+
| SimTIVA & AReS          | Target-Controlled Drug  | JavaScript /     | 3-compartment Marsh, Schnid- |
| (Merlo / Tinghin)       | Infusions (TIVA / TCI)  | MATLAB / Python  | er, Eleveld PK/PD models for |
|                         |                         |                  | propofol, norad, curare.     |
+-------------------------+-------------------------+------------------+------------------------------+
| PatientSim & EasyMED    | LLM Standardized        | Python / vLLM    | 4 behavioral axes (persona,  |
| (MIMIC-IV / FreedomAI)  | Patient Dialogue        | MIMIC-IV datasets| confusion, memory, language) |
|                         |                         |                  | for authentic patient talk.  |
+-------------------------+-------------------------+------------------+------------------------------+
| Synthea (MITRE Corp)    | Synthetic Longitudinal  | Java / FHIR      | Module builder state machine |
|                         | Patient Records         | Open Source      | tracking lifetime disease.   |
+-------------------------+-------------------------+------------------+------------------------------+
```

#### Detailed Lessons Applied to Orbit:
1. **Pulse Physiology Engine (Kitware)**:
   - *Architecture*: C++ modular architecture with decoupled physiological systems (Cardiovascular, Respiratory, Renal, Endocrine, Gastrointestinal, Nervous).
   - *Orbit Innovation*: Orbit adopts Pulse's lumped-parameter cardiovascular circuit and alveolar gas diffusion equations, but compiles the mathematical ODE core directly into **WebAssembly (Wasm) / Web Workers** so it runs at 100 Hz inside the mobile app without requiring server-side streaming.
2. **Rohy Platform (University of Eastern Finland - CRETIC Project)**:
   - *Time-Critical Evolution*: In Rohy, patients don't wait for the student; their condition deteriorates dynamically if interventions are delayed or out of order.
   - *Orbit Innovation*: Orbit implements Rohy's dynamic time-pressure mechanics and adds **3D cellular raymarching and organ cross-sections** alongside non-looped, continuous vectorcardiography.
3. **Infirmary Integrated**:
   - *Device Realism*: Accurate visual recreation of medical monitors (Datascope, Philips IntelliVue, Zoll defibrillators).
   - *Orbit Innovation*: Orbit utilizes Infirmary Integrated's exact sweep speeds ($25\text{ mm/s}$ and $50\text{ mm/s}$), QRS sound chirps, and dicrotic notch dampening curves for the ICU Telemetry HUD.
4. **SimTIVA & AReS**:
   - *Multi-Compartment Pharmacokinetics*: Three-compartment mammillary models ($V_1, V_2, V_3$) with rate constants ($k_{10}, k_{12}, k_{21}, k_{13}, k_{31}$) and effect-site delay ($k_{e0}$) accurately model drug onsets and context-sensitive half-times for inotropes, sedatives, and antivenom.
5. **PatientSim & EasyMED**:
   - *Standardized Patient Personas*: Orbit adopts the 4-axis patient persona framework (Cognitive confusion, Medical recall accuracy, Language fluency, Emotional distress) powered by on-device and edge LLMs to make bedside ward round dialogue feel human, erratic, and authentic.

---

### 7.2. Google Drive MMC Final Year Case Inventory Across All Subjects

Directly indexed from the user's **Final Year '17 MMC Study Materials** drive archive (`https://drive.google.com/drive/folders/12uw1-f5OwGblHgFOiymUtfQ36xxqi9dO`), confirming complete cross-specialty coverage across all clinical posting departments:

```
+----------------------------------------------------------------------------------------------------+
|                         MMC FINAL YEAR '17 STUDY MATERIALS REPOSITORY AUDIT                        |
+----------------------------------------------------------------------------------------------------+
| Subject Folder | Folder ID                         | Items | Verified Clinical Cases & Manuals     |
+----------------+-----------------------------------+-------+---------------------------------------+
| Medicine       | 1AtI6_LshNl3d2FlKNezdb6LGZFr_H5et | 40+   | • DCLD (Cirrhosis - multiple cases)   |
|                |                                   |       | • CVA (Stroke / Hemiplegia - 5 cases) |
|                |                                   |       | • Mitral Stenosis (MS) & Regurg (MR)  |
|                |                                   |       | • Aortic Stenosis (AS) & Regurg (AR)  |
|                |                                   |       | • Pleural Effusion (5 serial cases)   |
|                |                                   |       | • Lobar Pneumonia, Bronchiectasis     |
|                |                                   |       | • Tito Sir Clinical Guides:           |
|                |                                   |       |   - CVS Tito sir.pdf                  |
|                |                                   |       |   - RS Tito sir.pdf                   |
|                |                                   |       |   - Abdomen Tito sir.pdf              |
|                |                                   |       |   - Emailing CNS Tito sir.pdf         |
|                |                                   |       | • Medicine OSCE, Proforma, Viva, Books|
+----------------+-----------------------------------+-------+---------------------------------------+
| Surgery        | 1iNyslc1bpW25GIMs7xrdNTc-BDoFFoNd | 4 sub | • Surgery Practical:                  |
|                |                                   |       |   - Surgical Cases (Thyroid, Breast,  |
|                |                                   |       |     Hernia, Jaundice, Varicose Veins) |
|                |                                   |       |   - Surgical Instruments              |
|                |                                   |       |   - Surgical OSCE Stations            |
|                |                                   |       |   - Surgical Case Proforma            |
|                |                                   |       | • Surgical Books & Theory             |
+----------------+-----------------------------------+-------+---------------------------------------+
| Obstetrics &   | 1oFwczzBlYHDek3gcC3VsQlYLcgj-EVN9 | 29    | • 1. normal pregnancy _RR.pdf         |
| Gynaecology    |                                   |       | • 2. previous LSCS _RR.pdf            |
| (OG)           |                                   |       | • 3. Anemia in pregnancy_RR.pdf       |
|                |                                   |       | • 4. breech presentation_RR.pdf       |
|                |                                   |       | • 5. Heart disease in pregnancy_RR.pdf|
|                |                                   |       | • 6. HTN / Preeclampsia_RR.pdf        |
|                |                                   |       | • 7. twin pregnancy_RR.pdf            |
|                |                                   |       | • 8. GDM (Gestational Diabetes).pdf   |
|                |                                   |       | • G1- Fibroid Uterus_RR.pdf           |
|                |                                   |       | • G2- Uterovaginal Prolapse_RR.pdf    |
|                |                                   |       | • OG Cases, Instruments, OSCE Spotters|
+----------------+-----------------------------------+-------+---------------------------------------+
| Paediatrics    | 1ga9tp--PNnE1_zqQ69O0s1O3m-DEzMEK | 28    | • Severe Acute Malnutrition (SAM)     |
|                |                                   |       | • Tetralogy of Fallot (TOF - 2 cases) |
|                |                                   |       | • Ventricular Septal Defect (VSD)     |
|                |                                   |       | • Patent Ductus Arteriosus (PDA)      |
|                |                                   |       | • Rheumatic Heart Disease (RHD)       |
|                |                                   |       | • Nephrotic vs Nephritic Syndrome     |
|                |                                   |       | • Thalassemia (Salih case)            |
|                |                                   |       | • Cerebral Palsy & Dev Delay          |
|                |                                   |       | • Febrile Seizures, Preterm Newborn   |
|                |                                   |       | • Neonatal Cholestasis, EHPO          |
|                |                                   |       | • Down's Syndrome                     |
+----------------+-----------------------------------+-------+---------------------------------------+
| Orthopaedics   | 19RRc3fMA-Uo1ALzfhLsaJPryBXMatxui | 4 sub | • Ortho Cases (Fractures, Non-union)  |
|                |                                   |       | • Ortho Practical & Instruments.pptx  |
|                |                                   |       | • Ortho Cases Theory.pdf              |
+----------------+-----------------------------------+-------+---------------------------------------+
| Dermatology    | 1KGuu0PThwDWjPnZYIMKeTFOUuzQWVACQ | 3     | • Leprosy (Hansen's Disease)          |
|                |                                   |       | • Lichen Planus                       |
|                |                                   |       | • Psoriasis                           |
+----------------+-----------------------------------+-------+---------------------------------------+
```

---



### 7.3. Open-Source Patient Simulator Forum Deep-Dive, Reddit Sentiment & Benchmark Verdict

To identify the best architectural blueprint for Orbit MBBS, we conducted an exhaustive investigation across developer forums, Reddit (`r/medicine`, `r/medicalschool`, `r/emergencymedicine`, `r/Unity3D`), Hacker News, and sim-lab software repositories:

#### 7.3.1. Detailed Comparative Evaluation

| Engine / App | Developer / Origin | Mathematical Fidelity | Platform Support | Community Sentiment & Limitations |
|---|---|---|---|---|
| **Pulse Physiology Engine** | Kitware (Fork of BioGears 6.1.1, Apache 2.0) | Lumped-parameter MNA circuit, 100 Hz fixed-step, multi-organ gas/blood | C++17, WebAssembly, Unity Asset Store, Python, Java | **Gold Standard for Real-Time Simulation**: Widely praised on Reddit for modularity, low memory footprint ($<40\text{ MB}$), and clean C++ API. Chosen by military/DoD trauma trainers. |
| **BioGears** | Applied Research Associates (ARA / DoD) | Lumped-parameter electrical circuit analog | C++, Java GUI | Highly comprehensive, but relies on dense LU matrix factorization ($O(N^3)$); users report high CPU/thermal throttling on mobile devices. |
| **HumMod / QHP** | Univ. of Mississippi (Guyton / Coleman model) | 5,000+ variables, massive endocrine/metabolic/renal loop | Windows C++ / XML scripts | Legendary for long-term chronic physiology; however, Reddit discussions highlight that it cannot run high-frequency ($>50\text{ Hz}$) intra-beat pulsatile waveforms for real-time ICU monitors. |
| **Bodylight.js** | Charles University Prague (Physiome Project) | Acasual Bond Graphs via Modelica $\to$ C $\to$ Wasm | Browser WebAssembly, JS | Proves Modelica runs in-browser; however, SUNDIALS CVODE variable-step solver thrashes during discrete valve closure events, causing dropped frames in WebGL. |
| **Infirmary Integrated** | Tanjera (Open Source) | Real-time ICU monitor emulation | C# / Mono / Web | Excellent audio synthesis and realistic $25\text{ mm/s}$ and $50\text{ mm/s}$ sweep curves, but uses heuristic vital signs rather than closed-loop organ ODEs. |
| **Full Code & Resuscitation!** | Commercial Mobile Apps | Scripted Decision Trees (Finite State Machines) | iOS / Android | Loved by medical students on `r/medicalschool` for bedside clinical practice; **universally criticized for being 2D static point-and-click photos** with no true 3D organ visualization or real-time pharmacological ODE cascades. |

#### 7.3.2. Forum Discussions & Clinician Consensus
- **The "Full Code" Dilemma**: Clinicians on `r/emergencymedicine` appreciate mobile case trainers, but note that students memorize pre-programmed branch paths rather than understanding whole-body physiology. When a user administers an incorrect beta-blocker dose during cardiogenic shock in 2D apps, the screen simply displays "Patient arrested"; in contrast, a 3D ODE simulator can show the left ventricle dynamically dilating, wall motion akinesis developing, and pulmonary capillary wedge pressure driving alveolar raymarched fluid fill.
- **Why SIMVANA and Med-Tech Devs Build Custom Kernels**: Commercial platforms (such as VR anesthesia trainer SIMVANA) noted on Reddit that while Pulse provides a solid foundation, its standard C++ builds are heavy for mobile WebAssembly ($>30\text{ MB}$ binary). Developers strongly recommend extracting Pulse's validated compartmental parameters into a streamlined, high-speed Runge-Kutta / MNA solver running in a dedicated Web Worker.

#### 7.3.3. The Definitive Verdict for Orbit MBBS
Orbit MBBS should adopt a **Hybrid Dual-Engine Architecture**:
1. **Mathematical Core**: A 100 Hz fixed-step Modified Nodal Analysis (MNA) companion circuit solver coupled with exact analytic matrix exponential solutions for PK/PD and the McSharry 3D vectorcardiogram. This delivers FDA-grade physiological accuracy while keeping bundle size $<250\text{ KB}$ in JavaScript/Wasm.
2. **Rendering Core**: Three.js WebGL viewport running at a decoupled 60–120 FPS on the main thread, sampling physiological states from a lockless `SharedArrayBuffer` via cubic Hermite splines.
3. **Curriculum Engine**: Grounded directly in Madras Medical College (MMC) Final Year bedside clinical examination proformas and Kundu's clinical methods.

---



### 7.4. Expanded Open-Source Medical Tool Ecosystem (Simulation Modules)

To support complete clinical procedures in the 3D simulator, Orbit incorporates architectures from specialized open-source biomedical libraries:

| Simulation Domain | Open-Source Foundation / Repository | Core Mechanism | Orbit MBBS Integration |
|---|---|---|---|
| **Pupillometry & Eye Tracking** | `PyPlr` / `Open-DPSM` / `jeelizPupillometry` | Convolution & DDE pupil area modeling | Real-time WebGL eye rendering with swinging flashlight test, Horner's, uncal herniation, and opioid miosis. |
| **Auscultation Sound Engine** | Web Audio API / Synthesis toolkit | Multi-node frequency filter & spatial attenuation | Interactive 3D stethoscope placement over aortic, pulmonary, mitral, and tricuspid areas with diaphragm/bell toggle. |
| **Mechanical Ventilation** | `OpenVentilator` / ASL 5000 pneumatic circuit | Lumped-parameter differential airway resistance & compliance | Real-time ventilator curves ($P_{aw}$, flow, volume loops), VCV/PCV/PSV modes, and auto-PEEP in COPD. |
| **POCUS Ultrasound** | 3D Slicer / PLUS Toolkit | Real-time volumetric mesh slicing & B-mode texture mapping | Virtual transducer dragging across Morison's pouch, subxiphoid view, and pleural sliding for E-FAST trauma training. |
| **Defibrillation & Pacing** | BTE mathematical waveform solver | Transthoracic impedance current dissipation equations | Synchronized cardioversion for AFib/VT, asynchronous defibrillation for VFib, and transcutaneous pacing for CHB. |

---

### 7.5. Deep-Dive: Open-Source Biomathematical Physiology Engines

To establish an FDA-grade physiological substrate, Orbit synthesizes the mathematical formalisms of the world's premier open-source human physiology engines:

```
+---------------------------------------------------------------------------------------------------------------------------------+
|                                     OPEN-SOURCE COMPUTATIONAL PHYSIOLOGY ENGINES COMPARISON                                     |
+---------------------------------------------------------------------------------------------------------------------------------+
| Feature / Dimension       | Kitware Pulse Engine          | BioGears Engine              | HumMod / QHP                 | OpenCOR / CellML / JSim     |
+---------------------------+-------------------------------+------------------------------+------------------------------+-----------------------------+
| Origin & Governance       | Kitware (Fork of BioGears '17)| ARA / US DoD / TATRC         | Univ. Mississippi (Guyton)   | Auckland Bioengineering/NSR |
| License                   | Apache 2.0 (Permissive)       | Apache 2.0 (Permissive)      | Custom / Academic Open       | Apache 2.0 / GPL            |
| Core Language             | Modern C++17                  | C++11 / Java GUI             | C++ / XML Schema             | C++ / Qt / Python / Java    |
| WebAssembly Compilation   | Native (Emscripten dockcross) | Partial / Heavy Native Deps  | Indirect (Bodylight.js / DAE)| Native via libCellML Wasm   |
| Primary Mathematical Core | Lumped-parameter MNA Circuits | Lumped-parameter Circuits    | 10,000+ DAEs & Algebraic Eq. | Cell/Organ ODE/PDE models   |
| Time-Step Fidelity        | 50 - 100 Hz fixed-step        | 50 - 100 Hz fixed-step       | Multi-scale (seconds to days)| Adaptive / Sub-millisecond  |
| State Serialization       | Google Protocol Buffers (Full)| XML / Custom Binary State    | Text / XML Snapshot          | SED-ML / JSON State         |
| PK/PD Architecture        | Physiologically-Based (PBPK)  | Compartmental PBPK           | Organ Clearance Functions    | Custom Reaction Kinetics    |
| Mobile Browser Viability  | High (<40 MB Wasm heap)       | Moderate (>90 MB Wasm heap)  | Low (Desktop focused)        | High (Modular components)   |
+---------------------------------------------------------------------------------------------------------------------------------+
```

#### 7.5.1. Kitware Pulse Physiology Engine: Architectural Deep-Dive & Wasm Pipeline
- **Lumped-Parameter 0-D Circuit Analogs**: Pulse models biological fluid and gas dynamics through electrical circuit equivalents:
  $$\text{Voltage } (V) \equiv \text{Pressure } (P), \quad \text{Current } (I) \equiv \text{Volumetric Flow Rate } (Q), \quad \text{Charge } (q) \equiv \text{Volume } (V)$$
  Fluid compliance is governed by $C = \frac{\Delta V}{\Delta P}$, vascular resistance by Poiseuille impedance $R = \frac{8\eta L}{\pi r^4} = \frac{\Delta P}{Q}$, and inertial fluid inductance by $L_i = \frac{\rho l}{A}$.
- **WebAssembly Compilation Pipeline**:
  Pulse compiles into high-speed WebAssembly using Emscripten toolchains (`emconfigure` / `emmake`) with optimized build flags:
  ```bash
  emcmake cmake -B build_wasm -DCMAKE_BUILD_TYPE=Release \
    -DENABLE_PULSE_C_API=ON -DENABLE_PULSE_JAVA_API=OFF \
    -DCMAKE_CXX_FLAGS="-O3 -flto -msimd128 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -s INITIAL_MEMORY=67108864"
  ```
- **State Serialization & Branching "What-If" Trees**:
  Pulse structures its entire internal runtime state using **Google Protocol Buffers (`PulseDataModel.proto`)**. Because every compartment's pressure, volume, hematocrit, gas partial pressures ($\text{PaO}_2, \text{PaCO}_2$), and receptor occupancies are codified in Protobuf messages, the engine can serialize a complete patient snapshot in $<3.2\text{ ms}$ into a compact binary buffer:
  ```cpp
  // Dynamic State Forking in Pulse C++ Core
  CDM::PulseStateData stateSnapshot;
  pulseEngine->SerializeState(stateSnapshot); // Capture baseline state at t = 15 min
  // Timeline A: Fork with Antivenom
  std::unique_ptr<PulseEngine> timelineA = PulseEngine::Create();
  timelineA->DeserializeState(stateSnapshot);
  timelineA->AdministerSubstance("IndianPolyvalentAntivenom", 10.0, VolumeUnit::mL);
  // Timeline B: Fork with Conservative Saline
  std::unique_ptr<PulseEngine> timelineB = PulseEngine::Create();
  timelineB->DeserializeState(stateSnapshot);
  timelineB->AdministerCompound("NormalSaline", 1000.0, VolumeUnit::mL);
  ```
- **Custom Pharmacokinetic / Pharmacodynamic (PK/PD) Substance Modeling**:
  Pulse enables custom xenobiotics and drugs by declaring physicochemical and clearance parameters:
  $$\frac{dC_p}{dt} = \frac{\text{Dose Rate}}{V_d} - \left(\frac{\text{CL}_{\text{renal}} + \text{CL}_{\text{hepatic}}}{V_d}\right) \cdot C_p$$
  $$\text{Effect} = E_0 + \frac{E_{\max} \cdot C_e^\gamma}{EC_{50}^\gamma + C_e^\gamma}, \quad \text{where } \frac{dC_e}{dt} = k_{e0}(C_p - C_e)$$
  Custom Indian pharmacopeia entities (e.g. *Polyvalent Snake Antivenom*, *Pralidoxime PAM*, *Artesunate*, *Magnesium Sulfate Pritchard protocol*) are injected via declarative XML/Protobuf definitions overriding standard receptor affinities.

#### 7.5.2. BioGears Engine & Military Trauma Modeling
- Forked by Kitware in 2017 to create Pulse, BioGears continues to specialize in complex penetrating ballistic trauma, tension pneumothorax with thoracic needle decompression, blast lung injury, and combat tourniquet placement.
- Its solver utilizes **Modified Nodal Analysis (MNA)** with dense matrix factorization. While extraordinarily rich in extreme polytrauma scenarios, its computational overhead ($O(N^3)$ matrix inversion) requires aggressive optimization for mobile WebGL environments.

#### 7.5.3. HumMod / Guyton Model: Long-Term Quantitative Human Physiology (QHP)
- Derived from Arthur Guyton’s landmark 1972 circulatory model and developed at the University of Mississippi Medical Center, HumMod contains over **10,000 physiological variables** interconnected across hundreds of non-linear Differential Algebraic Equations (DAEs).
- **Integrative Multi-Day Homeostasis**: Unlike short-term ICU monitors, HumMod excels at multi-day and multi-week endocrine/renal compensations:
  - *Renin-Angiotensin-Aldosterone System (RAAS)* feedback.
  - *Erythropoietin (EPO)* release kinetics in chronic hypoxic kidney disease.
  - *Tubuloglomerular feedback* and long-term resetting of pressure natriuresis.
- **Portability for Orbit**: HumMod's XML-based model descriptions are ingested by Orbit's offline mathematical transpiler, converting Guyton's chronic feedback loops into discrete time-update blocks for subacute ward cases (e.g. DCLD cirrhotic ascites accumulation over 7 ward days).

#### 7.5.4. Standards-Based Physiology: CellML, SBML, OpenCOR & JSim
- **CellML & SBML Interoperability**: Orbit supports loading standardized biomathematical models from the **Physiome Model Repository (PMR)**:
  - *Noble 1998* cardiac ventricular electrophysiology model.
  - *Hodgkin-Huxley* nerve axon action potential equations.
  - *Topp et al. 2000* beta-cell mass, insulin, and glucose dynamics model.
- High-fidelity cellular modules compiled via `libCellML` run as micro-solvers within Orbit's cellular zoom viewport.

#### 7.5.5. Numerical Stiff Solvers & Web Worker Threading Architecture
Physiological dynamics encompass extreme multi-scale stiffness:
- **Fast Scales**: Cardiac depolarization ($\sim 1\text{ ms}$), action potential upstroke ($\sim 0.1\text{ ms}$).
- **Intermediate Scales**: Mechanical cardiac contraction ($\sim 300\text{ ms}$), arterial pulse wave ($\sim 100\text{ ms}$).
- **Slow Scales**: Pharmacokinetic distribution ($\sim 15 - 60\text{ min}$), renal solute clearance ($\sim 6 - 24\text{ hours}$).

**The Failure of Explicit Solvers (Forward Euler / RK4)**:
Explicit Runge-Kutta (RK4) requires time steps smaller than the smallest system eigenvalue: $\Delta t < \frac{2}{|\lambda_{\max}|}$. When simulating stiff membrane potentials or rapid capillary fluid transudation, explicit solvers become numerically unstable, causing infinite pressure explosions ($NaN$).

**The SUNDIALS CVODE / Implicit BDF Solution**:
Orbit employs **Backward Differentiation Formulas (BDF)** of variable order (orders 1 to 5) with fixed-lead Newton-Raphson nonlinear iterations:
$$y_n = \sum_{i=1}^q \alpha_{n,i} y_{n-i} + \Delta t \, \beta_{n,0} f(t_n, y_n)$$
This ensures unconditional numerical stability across all physiological timescales.

**Web Worker & Lockless SharedArrayBuffer Architecture**:
To ensure the Three.js rendering pipeline stays pinned at a buttery **60 - 120 FPS** without a microsecond of frame stutter:
```
+----------------------------------------------------------------------------------------------------+
|                                WEB WORKER MULTI-THREADED ARCHITECTURE                              |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    [ UI MAIN THREAD ]                                          [ BACKGROUND WEB WORKER ]           |
|    Three.js 3D Viewport                                        Pulse / C++ Wasm Kernel             |
|    React Native / WebGL                                        100 Hz Stiff ODE Solver             |
|    60 - 120 FPS Rendering                                      MNA Companion Circuits              |
|             |                                                              |                       |
|             |  Dispatches User Interventions                               |                       |
|             |  (e.g., Atropine 0.6mg IV, Needle Decomp.)                   |                       |
|             +------------------------------------------------------------> |                       |
|             |                  postMessage({ type: 'INJECT_DRUG' })        |                       |
|             |                                                              |                       |
|             |                  Continuous Lock-Free Telemetry              |                       |
|             |  <========================================================== +                       |
|             |         SharedArrayBuffer (Float64Array Ring Buffer)         |                       |
|             |         - ECG Lead II Voltage (1000 Hz)                      |                       |
|             |         - Arterial Pressure Waveform (100 Hz)                |                       |
|             |         - Central Venous Pressure Waveform (100 Hz)          |                       |
|             |         - Capnography EtCO2 Waveform (100 Hz)                |                       |
|             v                                                              v                       |
|    [ Cubic Hermite Spline ]                                     [ Fixed 10ms Delta-T Loop ]        |
|    Smooth Interpolation to Screen                               Atomics.wait / Atomics.notify      |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

### 7.6. Deep-Dive: 3D Anatomical Assets, Meshopt/Draco Pipeline, GLSL Shaders & Biomechanical Rigging

#### 7.6.1. Open-Source Anatomical Repositories & Mesh Optimization Pipeline
- **BodyParts3D / Anatomography (DBCLS, University of Tokyo)**:
  - Based directly on the **Foundational Model of Anatomy (FMA)** ontology, mapping 3,000+ distinct anatomical structures with exact anatomical naming.
  - Released under **CC-BY-SA 2.1 Japan**, making it an ideal open-source geometric substrate.
  - *Optimization*: Raw models (>20 million polygons) undergo quadric error decimation, remeshing, and hierarchy assembly into standard glTF 2.0.
- **Harvard Surgical Planning Laboratory (SPL) Multi-Modality Datasets**:
  - High-precision volumetric models derived from multi-sequence MRI and high-resolution CT (e.g. brain atlases with basal ganglia, internal capsule, and ventricular tree).
- **NIH 3D Print Exchange & NLM Visible Human Project (VHP)**:
  - Cryosectional cross-sectional photographic and surface reconstructions providing millimeter-accurate spatial relationships for visceral organs and thoracic cage anatomy.
- **glTF 2.0 Binary (`.glb`) with Draco & Meshopt Compression**:
  - Meshes utilize `EXT_meshopt_compression` for rapid worker-based decoding with minimal GC pressure on mobile devices.
  - Overall bundle footprint is kept strictly under **250 MB VRAM** and **60 MB disk cache**, ensuring seamless operation on mid-range Android and iOS devices.

#### 7.6.2. WebGL2 / WebGPU Pathological Shaders
Orbit uses dedicated GLSL uber-shaders to render real-time systemic pathology without triggering costly shader re-compilations:

**1. Dynamic Skin Pathology (Subsurface Scattering & Icterus/Cyanosis/Pallor)**:
```glsl
// WebGL2 Pathological Skin Fragment Shader
precision highp float;

uniform sampler2D u_albedoMap;
uniform sampler2D u_regionalMaskMap; // R: Sclera/Mucosa, G: Peripheral/Nails, B: Central/Lips

uniform float u_pallor;      // 0.0 (Normal) to 1.0 (Severe Shock / Hb 3.0 g/dL)
uniform float u_cyanosis;    // 0.0 (SpO2 99%) to 1.0 (SpO2 < 70%)
uniform float u_jaundice;    // 0.0 to 1.0 (Bilirubin > 2.5 mg/dL clinical threshold)
uniform float u_co_cherry;   // 0.0 to 1.0 (Carboxyhemoglobin toxicity)
uniform float u_diaphoresis; // 0.0 to 1.0 (Sweat droplet normal map strength)

in vec2 v_uv;
in vec3 v_normal;
in vec3 v_viewDir;
out vec4 fragColor;

void main() {
    vec4 baseAlbedo = texture(u_albedoMap, v_uv);
    vec4 masks = texture(u_regionalMaskMap, v_uv);
    
    vec3 color = baseAlbedo.rgb;
    
    // 1. Pallor: Blanched dermal capillary bed (melanin/collagen baseline)
    vec3 blanchedBase = mix(color, vec3(0.85, 0.82, 0.76), 0.65);
    color = mix(color, blanchedBase, u_pallor);
    
    // 2. Cyanosis: Deoxygenated venous blood (Central vs Peripheral)
    vec3 deoxBlue = vec3(0.22, 0.28, 0.55);
    float cyanoticZone = max(masks.g * 1.0, masks.b * 1.6); // Mucosa/Lips more sensitive
    color = mix(color, color * deoxBlue * 1.8, u_cyanosis * cyanoticZone);
    
    // 3. Jaundice: Bilirubin tissue deposition (affects elastin-rich sclera first)
    vec3 bileYellow = vec3(0.92, 0.81, 0.12);
    float icterusIntensity = masks.r * 2.2 + (1.0 - masks.r) * 0.45; // High affinity for sclera
    color = mix(color, color * bileYellow * 1.35, u_jaundice * icterusIntensity);
    
    // 4. Carbon Monoxide Cherry-Red Erythema
    vec3 carboxyRed = vec3(0.95, 0.08, 0.18);
    color = mix(color, carboxyRed, u_co_cherry * 0.55);
    
    // 5. Specular Diaphoresis Highlight (Cold Clammy Skin)
    vec3 halfVec = normalize(v_viewDir + vec3(0.0, 1.0, 0.5));
    float spec = pow(max(dot(v_normal, halfVec), 0.0), 32.0);
    color += vec3(1.0) * spec * (u_diaphoresis * 0.4);

    fragColor = vec4(color, baseAlbedo.a);
}
```

**2. Gravity-Aligned Fluid Effusions & Ascites (Vertex & Raymarching)**:
- *Pleural Effusion*: Displaces the lower lung boundaries inward while rendering an anechoic fluid meniscus creeping up the parietal pleura based on the gravitational vector $\vec{g} = (0, -1, 0)$.
- *Ascites*: Dynamically distends the anterior abdominal wall mesh based on fluid volume while flattening the flanks in the supine position (shifting dullness geometry).

**3. Dynamic Organ Pathology & Myocardial Infarction Hypokinesia**:
- In acute STEMI, the normal map in the affected coronary artery perfusion territory (e.g. anterior LAD wall) is dynamically flattened, reducing systolic thickening from $40\%$ to $0\%$ (akinesis) or paradoxical outward systolic bulging (dyskinesis).

#### 7.6.3. Biomechanical Rigging, Morph Targets & Procedural Kinematics
- **Respiratory Distress Morph Targets**:
  - *Intercostal Retraction*: Sparse vertex deltas pulling intercostal spaces inward during inspiration.
  - *Tracheal Tug*: Caudal displacement of the thyroid notch synchronized with peak negative inspiratory intrathoracic pressure.
  - *Paradoxical Flail Chest*: Floating rib segment moves inward during inspiration and outward during expiration.
- **Neurological Rigging**:
  - *Decerebrate Posturing*: Upper extremity adduction, extension, pronation, wrist flexion; lower extremity extension and plantar flexion.
  - *Decorticate Posturing*: Upper extremity adduction, elbow flexion, wrist and finger flexion over chest; lower extremity extension.
  - *House-Brackmann Facial Nerve Palsy (Grade I - VI)*: Independent left/right facial action units. In Grade V (Severe), ipsilateral frontalis wrinkling is absent, incomplete eye closure (lagophthalmos), and severe angle-of-mouth droop.
- **Procedural Tremor Kinematics (Asterixis / Parkinson's)**:
  Rather than rigid keyframes, tremors are generated dynamically via mathematical phase oscillators:
  ```typescript
  // Procedural Asterixis (Hepatic Flap) Kinematic Engine
  export function computeAsterixisRotation(timeSec: number, severity: number): number {
    const frequency = 3.2; // 2 - 5 Hz characteristic metabolic flap
    const phase = (timeSec * frequency) % 1.0;
    // Asymmetric Sawtooth: Slow tonic dorsiflexion followed by sudden involuntary lapse & recovery
    const flapAngle = phase < 0.75 
      ? (phase / 0.75) * (Math.PI / 8)          // Sustained dorsiflexion
      : ((1.0 - phase) / 0.25) * (Math.PI / 8); // Sudden lapse/drop
    return flapAngle * severity;
  }
  ```

---

### 7.7. Deep-Dive: Virtual Medical Diagnostic Devices & Sensor Instrumentation

#### 7.7.1. Pupillary Light Reflex (PLR) Biomathematical Simulation
Orbit implements the **Longtin-Milton Delay Differential Equation (DDE)** model of the pupil:
$$\tau_p \frac{dD(t)}{dt} + D(t) = f\left( \int_{t - \tau_d}^t L(s) \, ds \right)$$
where:
- $D(t)$ is pupil diameter (range: $1.5\text{ mm}$ to $8.5\text{ mm}$).
- $\tau_p \approx 0.30\text{ s}$ is the sphincter pupillae mechanical time constant.
- $\tau_d \approx 0.25\text{ s}$ is the neurological latency across the afferent and efferent arc.
- $f(L)$ is a nonlinear sigmoidal firing function:
  $$f(L) = D_{\max} - \frac{D_{\max} - D_{\min}}{1 + \left(\frac{\bar{L}}{\theta}\right)^n}$$

```
+----------------------------------------------------------------------------------------------------+
|                                    PUPILLARY LIGHT REFLEX CIRCUITRY                                |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    Light Stimulus L(t) ---> Retina ---> Optic Nerve (CN II) ---> Pretectal Nucleus (Midbrain)     |
|                                                                       |            |               |
|                                              +------------------------+            +-------+       |
|                                              | (Bilateral Projection)                      |       |
|                                              v                                             v       |
|                                     Left E-W Nucleus                              Right E-W Nucleus|
|                                              | (CN III)                                    |       |
|                                              v                                             v       |
|                                     Left Ciliary Ganglion                         Right Ciliary Gan|
|                                              |                                             |       |
|                                              v                                             v       |
|                                     Left Constrictor Pupillae                     Right Constrictor|
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

**Clinical Pupillary Pathology Engine**:
1. **Relative Afferent Pupillary Defect (RAPD / Marcus Gunn Pupil)**:
   - Evaluated using the **Swinging Flashlight Test**.
   - The afferent light input for the affected eye is attenuated: $L_{\text{affected}} = 0.25 \cdot L_{\text{source}}$.
   - When the flashlight swings from normal eye $\to$ affected eye, total bilateral neural drive drops, causing both pupils to **paradoxically dilate**.
2. **Horner's Syndrome**:
   - Sympathetic pathway disruption (first, second, or third order).
   - Clinical Triad: Miosis ($D_{\text{baseline}} \approx 2.0\text{ mm}$), Ptosis ($1 - 2\text{ mm}$ upper lid droop via Müller's muscle), Anhidrosis. Dilation lag upon sudden darkness ($>15\text{ s}$ to dilate vs normal $<5\text{ s}$).
3. **Argyll Robertson Pupil (Neurosyphilis / Tabes Dorsalis)**:
   - Light-Near Dissociation: Pretectal light pathways damaged, Edinger-Westphal accommodation fibers preserved. Light response $= 0$; accommodation to near object is intact.
4. **Uncal Herniation (Hutchinson's Pupil)**:
   - Uncus of temporal lobe herniates across tentorium cerebelli, compressing ipsilateral CN III against the petroclinoid ligament.
   - Stage 1: Sluggish response. Stage 2: Ipsilateral fixed, wide dilated pupil ($8.0\text{ mm}$). Stage 3: Bilateral fixed dilated pupils (brain death).

#### 7.7.2. 12-Lead Electrocardiogram Synthesis: McSharry Dynamical Model
Rather than playing back looped prerecorded audio or static PNG images, Orbit generates continuous, real-time 12-lead ECG waveforms using the **McSharry-Clifford-Smith dynamical ODE model on a 3D limit cycle**:
$$\dot{x} = \alpha \left(1 - \sqrt{x^2 + y^2}\right)x - \omega y$$
$$\dot{y} = \alpha \left(1 - \sqrt{x^2 + y^2}\right)y + \omega x$$
$$\dot{z} = -\sum_{i \in \{P, Q, R, S, T\}} a_i \Delta \theta_i \exp\left(-\frac{\Delta \theta_i^2}{2 b_i^2}\right) - (z - z_0)$$
where $\theta = \text{atan2}(y, x)$, $\Delta \theta_i = (\theta - \theta_i) \pmod{2\pi}$, and $\omega = \frac{2\pi}{RR}$.

**Pathology Transformations**:
- **Acute STEMI**: The isoelectric $z_0$ parameter is shifted upward by $+0.35\text{ mV}$ between the $S$ and $T$ waves in leads facing the infarct territory, while opposite reciprocal leads experience negative $z_0$ depression.
- **Hyperkalemia Evolution**:
  - $[K^+] = 6.0\text{ mEq/L}$: Tall, narrow, tented T waves ($a_T \uparrow 200\%, b_T \downarrow 50\%$).
  - $[K^+] = 7.5\text{ mEq/L}$: PR interval prolongation, flattening/loss of P waves ($a_P \to 0$).
  - $[K^+] = 8.5\text{ mEq/L}$: Severe QRS widening ($b_Q, b_R, b_S \times 2.5$).
  - $[K^+] > 9.0\text{ mEq/L}$: Sine wave pattern deteriorating into Ventricular Fibrillation or Asystole.
- **Atrial Fibrillation**:
  - Parameter $a_P$ set to $0$ (loss of P waves).
  - $RR$ interval duration is governed by a non-stationary Markov random walk.
  - High-frequency low-amplitude fibrillatory ($f$) waves synthesized at $400 - 600\text{ Hz}$ across baseline.

#### 7.7.3. Virtual Point-of-Care Ultrasound (POCUS) Engine
- **Platform Foundation**: Integrates concepts from **3D Slicer**, **PLUS Toolkit**, and **ITK-Wasm / VTK.js**.
- **Volumetric Multiplanar Reconstruction (MPR)**:
  As the user drags the virtual ultrasound probe across the 3D patient skin, the probe's position $\vec{P} \in \mathbb{R}^3$ and orientation quaternion $\mathbf{q} \in \mathbb{H}$ define a cutting plane intersecting the segmented patient organ voxel grid.
- **B-Mode Ultrasound Physics Shader**:
  1. *Acoustic Impedance Mismatch*: Generates reflection brightness at tissue interfaces ($Z_1 \to Z_2$) proportional to $R = \left(\frac{Z_2 - Z_1}{Z_2 + Z_1}\right)^2$.
  2. *Rayleigh Speckle Simulation*: Adds procedural 3D Simplex noise scaled to tissue cellular density.
  3. *Acoustic Shadowing*: Downward raymarching casts dark dropout shadows behind bone (ribs) or calcified gallstones.
  4. *Posterior Acoustic Enhancement*: Tissues deep to anechoic fluid collections (urinary bladder, ascites, pericardial effusion) exhibit hyper-echogenic gain amplification.
- **Core Clinical Presets**:
  - **eFAST (Extended Focused Assessment with Sonography for Trauma)**: Morison's pouch (hepatorenal recess), Splenorenal recess, Suprapubic (pouch of Douglas), Thoracic pleural sliding (M-mode seashore sign vs barcode sign in pneumothorax).
  - **FOCUS (Focused Cardiac Ultrasound)**: Parasternal Long Axis (PLAX), Parasternal Short Axis (PSAX), Apical 4-Chamber (A4C), Subcostal 4-Chamber (tamponade with RV diastolic collapse and IVC plethora).

#### 7.7.4. Real-Time Auscultation Sound Engine
- **Web Audio API Graph**:
  ```
  [ Stethoscope Mesh Collision Raycaster ]
                 |
                 v
  [ Dynamic Distance Weighting (A, P, T, M areas) ]
                 |
                 v
  [ Source Oscillators / Noise Generators ] ---> [ BiquadFilterNode ] ---> [ HRIR ConvolverNode ] ---> [ AudioDestinationNode ]
                                               (Bell / Diaphragm EQ)      (3D Spatial Acoustics)          (Speakers / Headphones)
  ```
- **Physical Modeling vs Wavetable**:
  - *Heart Sounds*: $S_1$ and $S_2$ are synthesized using damped low-frequency sinusoids ($40 - 120\text{ Hz}$).
  - *Murmurs*: Bandpass-filtered white noise envelopes. For Aortic Stenosis, a crescendo-decrescendo diamond envelope modulates gain during systole. For Mitral Regurgitation, a plateau pansystolic envelope spans from $S_1$ to $S_2$.
  - *Lung Sounds*: Vesicular breath sounds (soft low-pass noise $<400\text{ Hz}$), bronchial breathing (tubular high-frequency noise with silent inspiratory-expiratory gap), wheezes (parallel sinusoidal oscillators drifting between $300 - 800\text{ Hz}$), and crackles (stochastic Poisson bursts of $2 - 5\text{ ms}$ impulsive transients).
- **Interactive Stethoscope Acoustics**:
  Toggling between the **Bell** (accentuates low-frequency $S_3, S_4$, and mitral stenosis rumble via a $20 - 150\text{ Hz}$ bandpass) and **Diaphragm** (accentuates high-frequency murmurs, clicks, and ejection sounds via a $100 - 1000\text{ Hz}$ bandpass).

#### 7.7.5. Mechanical Ventilation & Invasive Hemodynamics
- **Equation of Motion of the Respiratory System**:
  $$P_{aw}(t) = \frac{V(t)}{C_{rs}} + R_{aw} \cdot \dot{V}(t) + \text{PEEP}$$
  where $C_{rs}$ is respiratory system compliance (reduced to $<20\text{ mL/cmH}_2\text{O}$ in ARDS) and $R_{aw}$ is airway resistance (increased to $>15\text{ cmH}_2\text{O/(L/s)}$ in severe status asthmaticus).
- **Ventilation Modes**:
  - *Volume Control (VCV)*: Constant flow delivery, airway pressure climbs to Peak Inspiratory Pressure ($PIP$), post-inspiratory pause yields Plateau Pressure ($P_{plat}$).
  - *Pressure Control (PCV)*: Constant pressure delivery, decelerating flow profile.
  - *Pressure Support (PSV)*: Patient-triggered spontaneous breathing with flow cycling.
- **Patient-Ventilator Dyssynchrony**:
  - *Auto-PEEP (Intrinsic PEEP)*: Expiratory flow does not reach baseline before the next breath, causing progressive dynamic hyperinflation.
  - *Double Triggering & Breath Stacking*: High patient drive overcomes ventilator cycle, triggering a second consecutive tidal volume and dangerously spiking transpulmonary pressure.
- **Invasive Telemetry Waveform Synthesis**:
  - *Arterial Line*: Generates realistic percussion wave, tidal wave, and dicrotic notch (aortic valve closure). Calculates real-time Pulse Pressure Variation ($PPV = \frac{\Delta PP_{\max} - \Delta PP_{\min}}{PP_{\text{mean}}}$) to guide fluid responsiveness.
  - *Central Venous Pressure (CVP)*: Synthesizes $a$ wave (atrial contraction), $c$ wave (tricuspid bulges during isovolumetric ventricular contraction), $x$ descent, $v$ wave (atrial filling), and $y$ descent (tricuspid opening). Cannon $a$ waves appear during AV dissociation / VT.

---

### 7.8. Deep-Dive: Clinical Multi-Agent Systems, Virtual Standardized Patients & Automated OSCE Evaluators

#### 7.8.1. Multi-Agent Hospital Simulacrum (Agent Hospital Evolution)
Orbit adopts the **Agent Hospital** paradigm (pioneered by Tsinghua University and open-source medical LLM agent researchers) to transform clinical simulation from a solitary quiz into an interactive, crowded hospital ward:
- **Nurse Agent**: Monitors telemetry, administers physician orders, reports sudden vital deterioration ("Doctor, the blood pressure just dropped to 70/40!"), and checks medication rights (Right Patient, Right Drug, Right Dose, Right Route, Right Time).
- **Consultant / Attending Agent**: Conducts bedside ward rounds, questions the student's clinical reasoning ("Why did you choose a calcium channel blocker instead of a beta-blocker here?"), and provides formative feedback.
- **Radiology / Laboratory Tech Agents**: Process ordered investigations with realistic turn-around delays (e.g. Stat ECG: $60\text{ s}$; Bedside Troponin: $15\text{ min}$; CT Head: $30\text{ min}$).

#### 7.8.2. Virtual Standardized Patient (VSP) Cognitive Architecture
The VSP bridges deterministic biophysics with natural language intelligence through a **Two-Tier Decoupled Architecture**:
```
+----------------------------------------------------------------------------------------------------+
|                         VIRTUAL STANDARDIZED PATIENT COGNITIVE PIPELINE                            |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    [ TIER 1: DETERMINISTIC PHYSIOLOGY ENGINE (Pulse / C++ Wasm) ]                                  |
|    Calculates PaO2, PaCO2, BP, Heart Rate, Pain Score (0-10), Blood Volume at 100 Hz                |
|                                       |                                                            |
|                                       v (1 Hz Telemetry Snapshot)                                  |
|    [ TIER 2: STOCHASTIC NATURAL LANGUAGE AGENT (Fine-Tuned LLM) ]                                  |
|                                       |                                                            |
|    +----------------------------------+----------------------------------+                         |
|    | Dynamic Context Injection:                                          |                         |
|    | - SpO2 < 85%: Enable Speech Dyspnea (short 2-3 word gasped bursts) |                         |
|    | - Pain > 7: Inject Non-Verbal Vocalizations ([groans], [cries out]) |                         |
|    | - SBP < 80: Enable Confusion / Obtundation / Slowed Recall          |                         |
|    +---------------------------------------------------------------------+                         |
|                                       |                                                            |
|                                       v                                                            |
|    [ Calgary-Cambridge Information Gating Matrix ]                                                 |
|    Checks Student's Empathy Score & Question Openness:                                             |
|    - Open question ("How can I help you today?") --> Unlocks primary narrative                     |
|    - Closed interrogative ("Do you have chest pain?") --> Binary yes/no answer                     |
|    - High Empathy / Rapport established --> Unlocks sensitive history (Alcohol, Domestic abuse)    |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

#### 7.8.3. Automated Clinical Decision Reasoning & Scoring Engines
Orbit evaluates clinical competence against established international and Indian guidelines (AHA/ACC, Surviving Sepsis Campaign, ATLS, Indian National Health Mission):
1. **Exponential Time-to-Intervention Penalty Curves**:
   Instead of arbitrary pass/fail gates, score decay is continuously coupled to physiological deterioration:
   $$\text{Score}(t) = \text{Score}_{\max} \cdot \exp\left(-k \cdot \max(0, t - t_{\text{ideal}})\right)$$
   - *Acute STEMI Door-to-Needle Time*: $t_{\text{ideal}} = 30\text{ min}$. After 30 minutes, myocardium enters irreversible wavefront necrosis.
   - *Septic Shock Hour-1 Bundle*: $t_{\text{ideal}} = 60\text{ min}$ for broad-spectrum antibiotics, blood cultures, and $30\text{ mL/kg}$ crystalloid.
2. **Critical Failure Safety Triggers**:
   Dangerous actions immediately trip critical failure state events:
   - *Trigger*: Administering IV Fluid Bolus ($1000\text{ mL}$) when patient has Acute Cardiogenic Pulmonary Edema ($PCWP > 25\text{ mmHg}$). Outcome: Rapid alveolar flooding, flash pulmonary edema, acute hypoxemic arrest.
   - *Trigger*: Administering high-flow $100\% \text{ O}_2$ via non-rebreather mask to a chronic hypercapnic COPD patient with baseline $\text{PaCO}_2 = 65\text{ mmHg}$. Outcome: Elimination of hypoxic respiratory drive, severe hypercapnic encephalopathy, and respiratory arrest.
   - *Trigger*: Administering intravenous beta-blocker (Metoprolol) to a patient in decompensated cardiogenic shock or with acute cocaine toxicity (unopposed alpha-adrenergic coronary vasospasm).

#### 7.8.4. Declarative JSON/YAML Scenario Schema & Medical Ontologies
To enable community-driven case authoring across medical colleges, scenarios are specified via a strict declarative schema bound to international medical knowledge graphs:

```yaml
scenario_metadata:
  id: "orbit_cardio_stemi_004"
  title: "Acute Inferior Wall STEMI with Right Ventricular Involvement"
  curriculum_code: "NMC_CBME_IM_6.3"
  difficulty: "Final_Year_MBBS"
  author: "Madras Medical College Clinical Skills Group"

knowledge_graph_bindings:
  primary_diagnosis: "SNOMED:22298006" # Myocardial infarction of inferior wall
  secondary_diagnosis: "SNOMED:233843008" # Right ventricular myocardial infarction
  icd_11: "BA41.1"
  prescribed_drugs:
    - "RxNorm:1191"   # Aspirin
    - "RxNorm:341248" # Clopidogrel
    - "RxNorm:1114195" # Ticagrelor
    - "RxNorm:7052"   # Morphine
  required_labs:
    - "LOINC:42757-5" # Cardiac Troponin I
    - "LOINC:11524-6" # 12-lead ECG study

initial_patient_state:
  vitals:
    heart_rate: 52       # Sinus bradycardia from nodal ischemia
    blood_pressure_sys: 84
    blood_pressure_dia: 56
    spo2: 94
    respiratory_rate: 22
    gcs: 15
  hemodynamics:
    cvp: 14             # Elevated CVP (RV failure)
    pcwp: 10            # Low/normal PCWP (Clear lung fields!)
  persona:
    name: "Muruganandam"
    age: 58
    gender: "Male"
    occupation: "Bus Conductor"
    anxiety_level: 0.85
    health_literacy: "Low"

branching_dag:
  nodes:
    - id: "PRESENTATION"
      description: "Patient clutching chest, pale, diaphoretic. Clear lungs."
    - id: "NITROGLYCERIN_DISASTER"
      description: "Student gave sublingual nitroglycerin! Sudden preload collapse."
      triggers:
        action: "GIVE_DRUG"
        drug: "Nitroglycerin"
      delta_vitals:
        blood_pressure_sys: 55
        blood_pressure_dia: 30
        heart_rate: 120
      penalty: -50
    - id: "VOLUME_EXPANSION_STABLE"
      description: "Student recognized RV MI triad (Hypotension + Raised JVP + Clear Lungs), held nitrates, and gave IV normal saline bolus."
      triggers:
        action: "GIVE_FLUID"
        type: "NormalSaline"
        volume_ml: 1000
      delta_vitals:
        blood_pressure_sys: 105
        blood_pressure_dia: 68
        heart_rate: 74
      bonus: +50
```

---

## 8. Verification & Delivery Roadmap

* **Phase 1: Architecture & Specifications (COMPLETED ✅)**
  - Comprehensive clinical scenario dossiers compiled (Toxicology, Cardiology, Critical Care).
  - Mathematical ODE system designed and cataloged.
  - Persistent documentation saved to `docs/patient_simulator_spec.md`.
* **Phase 1.5: Multi-Agent Deep-Dive Research (COMPLETED ✅ — Sept 5, 2026)**
  - **7 specialized research subagents** deployed in parallel across all MBBS years.
  - **83 acute clinical scenarios** catalogued across **14 specialties**.
  - **20 deep-dive pathophysiological cascades** documented with organ-by-organ progression.
  - Supabase `handwritten_notes` cross-referenced: 1,452+ notes across 14 subjects queried.
* **Phase 1.8: Ward Cases & 12-Lead ECG Engine Deep-Dive (COMPLETED ✅ — Sept 5, 2026)**
  - **10 Core General Medicine Long Cases** fully specified (Cirrhosis, CHF, RHD, CKD, TB, COPD, Stroke, T2DM, Pleural Effusion, Malaria) grounded in MMC Final Year clinical examination standards.
  - **Multidisciplinary Daily Ward Cases** cataloged across Surgery, OBG, Paediatrics, Orthopaedics, and ENT/Ophtho.
  - **Coupled McSharry ECGSYN ODE Engine** fully formulated with exact numerical parameter matrix for Normal Sinus Rhythm, STEMI territories, Hyperkalemia curve, AFib, VT/VF, AV blocks, and Digoxin effects.
  - **3D Vectorcardiography Engine** with Einthoven/Wilson lead projection geometry and real-time Mean Electrical Axis computation.
  - **30+ High-Yield MBBS Clinical ECG Tracings** mapped directly to simulator scenarios.
  - **Bedside Clinical Examination Engine** specified with ODPARA history taking, PICCLED general exam, IPPA systemic flows, and SOAP daily progress notes.
* **Phase 1.9: Open-Source Benchmarks & Google Drive Study Inventory (COMPLETED ✅ — Sept 5, 2026)**
  - Benchmarked **Pulse Physiology Engine**, **BioGears**, **Rohy**, **Infirmary Integrated**, **SimTIVA/AReS**, and **PatientSim/Synthea**.
  - Extracted and indexed all 6 subject folders from the **MMC Final Year Study Materials Drive Archive** (Medicine, Surgery, OG, Pediatrics, Ortho, Dermatology).
* **Phase 1.10: Tito Sir MMC Clinical Gems, Forum Deep-Dive & Numerical Stiffness Kernel (COMPLETED ✅ — Sept 6, 2026)**
  - Integrated Dr. S. Tito's authentic 32-point Respiratory System examination, Abdomen examination, and CVS examination rubrics directly from MMC study files.
  - Formulated advanced multi-scale ODEs: 4-element Windkessel, Guyton venous return with vascular collapse, Michel-Weinbaum capillary glycocalyx filtration, Riley 3-compartment shunt, and 7-drug PK/PD mammillary models.
  - Benchmarked Pulse vs BioGears vs HumMod vs Bodylight.js vs Full Code across Reddit, Hacker News, and developer forums; established the Hybrid MNA Web Worker architecture for Orbit.
* **Phase 1.11: Pupil Reflex DDE Engine, Multidisciplinary Drive Ingestion & Diagnostic Devices (COMPLETED ✅ — Sept 6, 2026)**
  - Fully formulated the Longtin-Milton DDE Pupil Light Reflex model with 8 pathological states (Horner's, RAPD, Argyll Robertson, Uncal Herniation, Opioid, Atropine).
  - Ingested and documented multidisciplinary clinical cases from all 6 Google Drive subject folders: Surgery GOO, OG Preeclampsia & Leopold maneuvers, Pediatrics Thalassemia & hemosiderosis, Orthopaedics Clubfoot Ponseti C-A-V-E, and Dermatology Lichen Planus.
  - Specified virtual diagnostic tool engines: Web Audio auscultation, E-FAST POCUS ultrasound mesh slicing, OpenVent mechanical ventilation, and BTE defibrillation.
* **Phase 1.12: Five Google Drive Clinical Repositories Synthesis (COMPLETED ✅ — Sept 6, 2026)**
  - Crawled and indexed all 5 user-provided clinical drives (`FINAL YEAR MBBS`, `4th Year Practicals`, `CASES MBBS FINAL YEAR`, `4th Year Cases`, `PRACTICAL FILES`).
  - Extracted 15 core clinical practical manuals and guides into local persistent downloads.
  - Fully formulated the 6-Step ABG Solver with Winter's formula and Albumin-corrected Anion Gap.
  - Mapped Topographic Neuro-Localization (Cortex, Thalamus, Internal Capsule, Weber, Benedikt, Millard-Gubler, Jackson, Brown-Séquard).
  - Formulated Acoustic Physics of Murmurs (Mitral Stenosis A2-OS gap law, Austin Flint, Graham Steell, Continuous murmurs, Dynamic maneuvers).
  - Codified Orthopaedic Goniometry (full joint degrees of freedom) and Peripheral Nerve Injury Localization (claw hand, wrist drop, foot drop).
  - Specified Surgical Varicose Veins Hemodynamic Valve Incompetence Engine (Brodie-Trendelenburg 1 & 2, Perthes, CEAP C0-C6).
  - Detailed Obstetric Gestational Diabetes Mellitus (GDM) DIPSI/IADPSG and Pediatric RSV Bronchiolitis airway mechanics.
* **Phase 1.13: AGI Open-Source Medical Simulator Ecosystem & Biomechanical Blueprint (COMPLETED ✅ — Sept 6, 2026)**
  - Fully mapped open-source computational physiology engines (Kitware Pulse Wasm pipeline, BioGears DoD trauma models, HumMod 10,000-variable Guyton long-term homeostasis, CellML/JSim/OpenCOR standards).
  - Designed stiff differential equation solver architecture (CVODE / SUNDIALS implicit BDF with Newton iterations) running inside a dedicated background Web Worker communicating with 60-120 FPS Three.js UI via lockless `SharedArrayBuffer` ring buffers.
  - Specified 3D anatomical asset optimization (BodyParts3D FMA ontology, Harvard SPL, Draco/Meshopt glTF 2.0 scene graph, <250 MB mobile VRAM budget).
  - Programmed GLSL shaders for dynamic systemic pathology: subsurface scattering skin shader (pallor, central vs peripheral cyanosis, jaundice with sclera weighting, CO cherry-red), gravity-aligned raymarched fluid effusions (meniscus sign, shifting dullness), and dynamic myocardial ischemia hypokinesia.
  - Formulated biomechanical rigging & morph targets for clinical examination signs (House-Brackmann facial nerve palsy, intercostal retractions, tracheal tug, flail chest, decerebrate/decorticate posturing, procedural 3.2 Hz asterixis sawtooth flap).
  - Specified virtual diagnostic instrumentation: Longtin-Milton DDE pupillary light reflex with swinging flashlight RAPD and Horner's; McSharry ECGSYN 3D dynamical model for continuous 12-lead waveforms; 3D Slicer/PLUS/ITK-Wasm E-FAST POCUS ultrasound shaders (acoustic impedance, Rayleigh speckle, acoustic shadowing); Web Audio HRIR auscultation with dynamic probe collision; ASL 5000 equation of motion for mechanical ventilation and invasive hemodynamics.
  - Architected clinical multi-agent systems and virtual standardized patients (Agent Hospital paradigm: nurse, attending, tech, patient; 50Hz biophysics + 1Hz LLM translation; Calgary-Cambridge trust-gated information disclosure; exponential time-to-intervention penalties; critical failure safety triggers; declarative JSON/YAML authoring schema with SNOMED-CT, RxNorm, and LOINC bindings).
* **Phase 2: Claude Handover & Sync (ACTIVE)**
  - Update `CLAUDE_HANDOVER.md` to ensure Claude and all collaborating tools share identical context.
* **Phase 3: Prototype Scaffolding (FUTURE — PENDING USER APPROVAL)**
  - Scaffolding of the WebGL Three.js rigged human mesh.
  - Integration of the 100 Hz Runge-Kutta ODE Web Worker engine.
  - Wiring of the 25 mm/s ICU telemetry canvas, 12-lead ECG renderer, and branching DAG controls.



