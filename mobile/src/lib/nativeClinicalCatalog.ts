/** GENERATED from the WEB simulator source. Update from the web source, never edit individual labels here. */
export interface NativeClinicalSkill { id: string; title: string; hint: string; emoji: string }
export interface NativeClinicalScenario { id: string; title: string; subtitle: string; category: string }
export const NATIVE_CLINICAL_SKILLS: NativeClinicalSkill[] = [
  {
    "id": "stethoscope",
    "title": "Auscultation",
    "hint": "Normal heart & lung breath sounds, then compare",
    "emoji": "🩺"
  },
  {
    "id": "ecg12",
    "title": "12-lead ECG",
    "hint": "Normal sinus rhythm & case traces",
    "emoji": "🫀"
  },
  {
    "id": "ultrasound",
    "title": "Ultrasound / POCUS",
    "hint": "Explore probe views & scan findings",
    "emoji": "🖥️"
  },
  {
    "id": "radiology",
    "title": "X-ray & MRI",
    "hint": "Browse real films and MRI slices",
    "emoji": "🩻"
  },
  {
    "id": "pupil",
    "title": "Eyes & cranial nerves",
    "hint": "Follow a target, use a penlight & test reflexes",
    "emoji": "👁️"
  },
  {
    "id": "piccled",
    "title": "General examination",
    "hint": "Pallor, icterus, edema & fluid status",
    "emoji": "🔎"
  },
  {
    "id": "clubbing",
    "title": "Clubbing",
    "hint": "Normal nails, Schamroth test & findings",
    "emoji": "🖐️"
  }
];

export const NATIVE_CLINICAL_SCENARIOS: NativeClinicalScenario[] = [
  {
    "id": "normal",
    "title": "Healthy adult · normal baseline",
    "subtitle": "Learn normal findings before exploring disease",
    "category": "Normal physiology"
  },
  {
    "id": "stemi",
    "title": "Acute Inferior STEMI with Right Ventricular Infarction",
    "subtitle": "Severe substernal chest pressure, bradycardia & RV preload collapse",
    "category": "Cardiovascular Medicine"
  },
  {
    "id": "chf_dcm",
    "title": "Congestive Heart Failure & DCM (Acute Pulmonary Edema)",
    "subtitle": "Orthopnea, raised JVP, S3 gallop & bubbling alveolar crackles",
    "category": "Cardiovascular Medicine"
  },
  {
    "id": "ms_afib",
    "title": "Rheumatic Mitral Stenosis with Rapid Atrial Fibrillation",
    "subtitle": "Irregularly irregular pulse, pulse deficit, loud S1, mid-diastolic rumble",
    "category": "Cardiovascular Medicine"
  },
  {
    "id": "vfib_arrest",
    "title": "Ventricular Fibrillation Sudden Cardiac Arrest (ACLS)",
    "subtitle": "Pulseless, unarousable, chaotic fibrillatory waves on telemetry",
    "category": "Cardiovascular Medicine"
  },
  {
    "id": "snakebite",
    "title": "Russell's Viper Envenomation (Hemotoxic Shock)",
    "subtitle": "Fang puncture right leg, systemic capillary leak & coagulopathy",
    "category": "Toxicology & Shock"
  },
  {
    "id": "op_poisoning",
    "title": "Organophosphate Poisoning (Cholinergic SLUDGE Toxidrome)",
    "subtitle": "Pinpoint pupils, copious secretions, bronchorrhea & fasciculations",
    "category": "Toxicology & Shock"
  },
  {
    "id": "anaphylaxis",
    "title": "Anaphylactic Shock (Severe Type I Hypersensitivity)",
    "subtitle": "Biphasic stridor, diffuse urticaria, angioedema & vasodilation",
    "category": "Toxicology & Shock"
  },
  {
    "id": "pcm_toxicity",
    "title": "Paracetamol (Acetaminophen) Acute Toxic Liver Failure",
    "subtitle": "Centrilobular hepatic necrosis, profound coagulopathy & encephalopathy",
    "category": "Toxicology & Shock"
  },
  {
    "id": "tension_pneumo",
    "title": "Acute Tension Pneumothorax (Post-Trauma Shock)",
    "subtitle": "Tracheal deviation, absent breath sounds & obstructive shock",
    "category": "Emergency & Polytrauma"
  },
  {
    "id": "tamponade",
    "title": "Cardiac Tamponade (Beck's Triad & Pulsus Paradoxus)",
    "subtitle": "Muffled heart sounds, distended neck veins & electrical alternans",
    "category": "Emergency & Polytrauma"
  },
  {
    "id": "splenic_rupture",
    "title": "Blunt Abdominal Trauma with Massive Hemoperitoneum",
    "subtitle": "Kehr's sign (left shoulder pain), abdominal guarding, class IV shock",
    "category": "Emergency & Polytrauma"
  },
  {
    "id": "flail_chest",
    "title": "Polytrauma with Flail Chest and Massive Hemothorax",
    "subtitle": "Paradoxical chest motion, tracheal deviation, dull percussion",
    "category": "Emergency & Polytrauma"
  },
  {
    "id": "cirrhosis",
    "title": "Decompensated Chronic Liver Disease (DCLD with Tense Ascites)",
    "subtitle": "Tense ascites, portal hypertension, jaundice, asterixis & HRS risk",
    "category": "Gastroenterology & Hepatology"
  },
  {
    "id": "variceal_bleed",
    "title": "Bleeding Esophageal Varices with Upper GI Hemorrhage",
    "subtitle": "Massive hematemesis, melena, hyperdynamic portal hypertension",
    "category": "Gastroenterology & Hepatology"
  },
  {
    "id": "acute_pancreatitis",
    "title": "Severe Acute Necrotizing Pancreatitis",
    "subtitle": "Epigastric pain radiating to back, Cullen's sign, systemic inflammatory response",
    "category": "Gastroenterology & Hepatology"
  },
  {
    "id": "tb_hemoptysis",
    "title": "Cavitary Pulmonary Tuberculosis with Massive Hemoptysis",
    "subtitle": "Apical amphoric breath sounds, Rasmussen's aneurysm bleed & post-tussive rales",
    "category": "Pulmonology & Infectious Disease"
  },
  {
    "id": "status_asthmaticus",
    "title": "Refractory Status Asthmaticus with Silent Chest",
    "subtitle": "Pulsus paradoxus, sternocleidomastoid retractions & hypercapnic respiratory failure",
    "category": "Pulmonology & Infectious Disease"
  },
  {
    "id": "septic_shock",
    "title": "Hyperdynamic Septic Shock (Urosepsis & Vasoplegia)",
    "subtitle": "Bounding pulses, vasoplegia, refractory lactic acidosis & oliguria",
    "category": "Pulmonology & Infectious Disease"
  },
  {
    "id": "cerebral_malaria",
    "title": "Severe Plasmodium falciparum Cerebral Malaria",
    "subtitle": "Microvascular sequestration, unarousable coma & dark hemoglobinuria",
    "category": "Pulmonology & Infectious Disease"
  },
  {
    "id": "dka",
    "title": "Diabetic Ketoacidosis (DKA with Kussmaul Breathing)",
    "subtitle": "High anion-gap metabolic acidosis, ketonuria & osmotic dehydration",
    "category": "Endocrinology & Nephrology"
  },
  {
    "id": "aki_uremia",
    "title": "Acute Kidney Injury with Hyperkalemia & Uremic Pericarditis",
    "subtitle": "Anuria, tall tented T-waves, uremic frost & pericardial rub",
    "category": "Endocrinology & Nephrology"
  },
  {
    "id": "thyroid_storm",
    "title": "Severe Thyrotoxic Crisis / Thyroid Storm",
    "subtitle": "Extreme hyperpyrexia (41°C), high-output heart failure & delirium",
    "category": "Endocrinology & Nephrology"
  },
  {
    "id": "stroke",
    "title": "Acute Ischemic Stroke & Dense Hemiplegia (MCA Territory)",
    "subtitle": "Right-sided hemiplegia, UMN facial palsy & Broca's aphasia",
    "category": "Neurology & Stroke"
  },
  {
    "id": "status_epilepticus",
    "title": "Generalized Convulsive Status Epilepticus",
    "subtitle": "Continuous tonic-clonic convulsions > 20 mins, hyperpyrexia & lactic acidosis",
    "category": "Neurology & Stroke"
  },
  {
    "id": "meningitis",
    "title": "Acute Bacterial Meningitis with Impending Herniation",
    "subtitle": "Neck stiffness, Kernig's sign, petechial rash & papilledema",
    "category": "Neurology & Stroke"
  },
  {
    "id": "perforated_peptic_ulcer",
    "title": "Perforated Duodenal Ulcer with Generalized Peritonitis",
    "subtitle": "Board-like abdominal rigidity, absent bowel sounds, gas under diaphragm",
    "category": "General & Vascular Surgery"
  },
  {
    "id": "appendicitis_peritonitis",
    "title": "Gangrenous Acute Appendicitis with Rupture & Peritonitis",
    "subtitle": "McBurney's point tenderness, Rovsing's sign positive, high fever",
    "category": "General & Vascular Surgery"
  },
  {
    "id": "strangulated_hernia",
    "title": "Strangulated Inguinal Hernia & Intestinal Obstruction",
    "subtitle": "Irreducible tense tender groin mass, bilious vomiting & obstipation",
    "category": "General & Vascular Surgery"
  },
  {
    "id": "acute_limb_ischemia",
    "title": "Acute Femoral Embolism (6 Ps of Limb Ischemia)",
    "subtitle": "Pain, Pallor, Pulselessness, Paresthesia, Paralysis & Perishing cold",
    "category": "General & Vascular Surgery"
  },
  {
    "id": "atonic_pph",
    "title": "Massive Atonic Postpartum Hemorrhage (PPH)",
    "subtitle": "Boggy flaccid uterus, torrential vaginal bleeding, hypovolemic collapse",
    "category": "Obstetrics & Gynaecology"
  },
  {
    "id": "eclampsia",
    "title": "Severe Pre-eclampsia with Eclamptic Convulsions",
    "subtitle": "BP 190/120, 4+ proteinuria, hyperreflexia, generalized tonic-clonic fit",
    "category": "Obstetrics & Gynaecology"
  },
  {
    "id": "ectopic_rupture",
    "title": "Ruptured Tubal Ectopic Pregnancy & Hemoperitoneum",
    "subtitle": "Amenorrhea 7 weeks, acute pelvic peritonitis, cervical motion tenderness",
    "category": "Obstetrics & Gynaecology"
  },
  {
    "id": "peds_gastro_shock",
    "title": "Severe Rotavirus Dehydration & Hypovolemic Shock",
    "subtitle": "Sunken fontanelle, skin pinch > 3s, dry mucous membranes, lethargy",
    "category": "Pediatric Critical Care"
  },
  {
    "id": "peds_foreign_body",
    "title": "Acute Laryngeal Foreign Body Aspiration (Inspiratory Stridor)",
    "subtitle": "Sudden choking while eating peanuts, suprasternal retractions, air trapping",
    "category": "Pediatric Critical Care"
  },
  {
    "id": "compartment_syndrome",
    "title": "Acute Compartment Syndrome (Closed Tibial Shaft Fracture)",
    "subtitle": "Pain out of proportion, tense woody calf, pain on passive toe stretch",
    "category": "Orthopedics & Limb Trauma"
  },
  {
    "id": "femoral_neck_fracture",
    "title": "Displaced Intracapsular Femoral Neck Fracture in Elderly",
    "subtitle": "Shortened and externally rotated right limb, severe groin pain, avascular necrosis risk",
    "category": "Orthopedics & Limb Trauma"
  },
  {
    "id": "massive_pe",
    "title": "Massive Pulmonary Embolism with Acute Cor Pulmonale",
    "subtitle": "Obstructive shock, S1Q3T3 pattern, severe RV strain & acute right heart failure",
    "category": "Cardiovascular & Critical Care"
  },
  {
    "id": "mesenteric_ischemia",
    "title": "Acute Superior Mesenteric Artery (SMA) Embolism",
    "subtitle": "Severe periumbilical pain out of proportion to exam, lactic acidosis & bowel ischemia",
    "category": "General & Vascular Surgery"
  },
  {
    "id": "ruptured_aaa",
    "title": "Ruptured Infrarenal Abdominal Aortic Aneurysm (AAA)",
    "subtitle": "Classic triad: sudden flank/abdominal pain, pulsatile mass, hemorrhagic shock",
    "category": "Vascular & Emergency Surgery"
  },
  {
    "id": "subarachnoid_hemorrhage",
    "title": "Aneurysmal Subarachnoid Hemorrhage (Hunt & Hess Grade IV)",
    "subtitle": "Thunderclap headache, neck stiffness, neurogenic stunned myocardium & blown pupil",
    "category": "Neurology & Neurocritical Care"
  },
  {
    "id": "pediatric_epiglottitis",
    "title": "Acute Pediatric Epiglottitis (Haemophilus influenzae type B)",
    "subtitle": "Tripod posture, drooling, high fever & life-threatening inspiratory stridor",
    "category": "Pediatric Critical Care"
  },
  {
    "id": "myasthenia_crisis",
    "title": "Myasthenic Crisis with Respiratory Muscle Exhaustion",
    "subtitle": "Diaphragmatic fatigue, paradoxical abdominal breathing & hypercapnic respiratory failure",
    "category": "Neurology & Critical Care"
  }
];
