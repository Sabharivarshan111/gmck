import { PatientVitals, PatientPathologyState, ScenarioDefinition, TelemetryWaveformSample } from '../types';

export interface ExtendedScenarioDefinition extends ScenarioDefinition {
  departmentId: string;
}

export const SCENARIOS: ExtendedScenarioDefinition[] = [
  // 1. CARDIOLOGY
  {
    id: 'stemi',
    title: "Acute Inferior STEMI with Right Ventricular Infarction",
    subtitle: "Severe substernal chest pressure, bradycardia & RV preload collapse",
    category: "Cardiovascular Medicine",
    departmentId: "cardiology",
    chiefComplaint: "Crushing retrosternal chest pain radiating to epigastrium and jaw with syncope",
    history: "56yo diabetic male smoker. Clear lungs, raised JVP, profound hypotension on nitrates.",
    targetInterventions: ['aspirin', 'saline', 'atropine', 'defib'],
    lethalTriggers: ['nitroglycerin', 'beta_blocker'],
    initialVitals: {
      heartRate: 48,
      bpSystolic: 80,
      bpDiastolic: 50,
      meanArterialPressure: 60,
      spo2: 95,
      respiratoryRate: 20,
      temperature: 36.8,
      cvp: 14.0,
      etco2: 36,
      lactate: 2.9,
      gcs: 15,
    },
    initialPathology: {
      cyanosis: 0.20,
      pallor: 0.85,
      jaundice: 0.0,
      diaphoresis: 0.95,
      ascites: 0.0,
      myocardialIschemia: 0.90,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 's3_gallop',
      lungSoundType: 'vesicular',
      ecgRhythm: 'stemi_inferior',
    },
  },
  {
    id: 'chf_dcm',
    title: "Congestive Heart Failure & DCM (Acute Pulmonary Edema)",
    subtitle: "Orthopnea, raised JVP, S3 gallop & bubbling alveolar crackles",
    category: "Cardiovascular Medicine",
    departmentId: "cardiology",
    chiefComplaint: "Waking up choking with pink frothy sputum, unable to lie flat",
    history: "62yo male with dilated cardiomyopathy. Bibasilar bubbling crackles to upper zones, severe orthopnea, S3 gallop rhythm.",
    targetInterventions: ['furosemide', 'oxygen', 'nitroglycerin'],
    lethalTriggers: ['saline', 'beta_blocker'],
    initialVitals: {
      heartRate: 116,
      bpSystolic: 172,
      bpDiastolic: 102,
      meanArterialPressure: 125,
      spo2: 84,
      respiratoryRate: 32,
      temperature: 36.8,
      cvp: 16.0,
      etco2: 44,
      lactate: 2.8,
      gcs: 14,
    },
    initialPathology: {
      cyanosis: 0.50,
      pallor: 0.45,
      jaundice: 0.10,
      diaphoresis: 0.90,
      ascites: 0.25,
      myocardialIschemia: 0.45,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 's3_gallop',
      lungSoundType: 'crackles',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'ms_afib',
    title: "Rheumatic Mitral Stenosis with Rapid Atrial Fibrillation",
    subtitle: "Irregularly irregular pulse, pulse deficit, loud S1, mid-diastolic rumble",
    category: "Cardiovascular Medicine",
    departmentId: "cardiology",
    chiefComplaint: "Sudden onset palpitation, acute breathlessness, and hemoptysis",
    history: "32yo female with childhood acute rheumatic fever. Rapid irregular ventricular response, pulmonary venous congestion.",
    targetInterventions: ['furosemide', 'oxygen', 'defib'],
    lethalTriggers: ['saline', 'inotropic_overload'],
    initialVitals: {
      heartRate: 154,
      bpSystolic: 92,
      bpDiastolic: 62,
      meanArterialPressure: 72,
      spo2: 88,
      respiratoryRate: 28,
      temperature: 37.0,
      cvp: 12.0,
      etco2: 34,
      lactate: 3.1,
      gcs: 15,
    },
    initialPathology: {
      cyanosis: 0.40,
      pallor: 0.50,
      jaundice: 0.05,
      diaphoresis: 0.70,
      ascites: 0.10,
      myocardialIschemia: 0.30,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'murmur_systolic',
      lungSoundType: 'crackles',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'vfib_arrest',
    title: "Ventricular Fibrillation Sudden Cardiac Arrest (ACLS)",
    subtitle: "Pulseless, unarousable, chaotic fibrillatory waves on telemetry",
    category: "Cardiovascular Medicine",
    departmentId: "cardiology",
    chiefComplaint: "Sudden collapse while walking in hospital corridor; no pulse or respiration",
    history: "64yo male with prior coronary artery disease. Immediate CPR underway, shockable rhythm confirmed.",
    targetInterventions: ['defib', 'adrenaline', 'oxygen'],
    lethalTriggers: ['atropine', 'saline_delay'],
    initialVitals: {
      heartRate: 0,
      bpSystolic: 0,
      bpDiastolic: 0,
      meanArterialPressure: 0,
      spo2: 45,
      respiratoryRate: 0,
      temperature: 36.2,
      cvp: 0.0,
      etco2: 12,
      lactate: 9.8,
      gcs: 3,
    },
    initialPathology: {
      cyanosis: 0.95,
      pallor: 0.95,
      jaundice: 0.0,
      diaphoresis: 0.99,
      ascites: 0.0,
      myocardialIschemia: 1.0,
      pupilLeft: 6.0,
      pupilRight: 6.0,
      pupilReactLeft: false,
      pupilReactRight: false,
      heartSoundType: 'normal',
      lungSoundType: 'silent',
      ecgRhythm: 'vfib',
    },
  },

  // 2. TOXICOLOGY & SHOCK
  {
    id: 'snakebite',
    title: "Russell's Viper Envenomation (Hemotoxic Shock)",
    subtitle: "Fang puncture right leg, systemic capillary leak & coagulopathy",
    category: "Toxicology & Shock",
    departmentId: "toxicology",
    chiefComplaint: "Severe right lower limb swelling, bleeding from gums, dizziness",
    history: "34yo agricultural laborer bitten by Russell's viper in paddy field 90 mins ago. Advancing wooden edema past knee, 20WBCT > 20 mins (incoagulable).",
    targetInterventions: ['antivenom', 'saline', 'oxygen'],
    lethalTriggers: ['tourniquet', 'incision_suction'],
    initialVitals: {
      heartRate: 118,
      bpSystolic: 84,
      bpDiastolic: 52,
      meanArterialPressure: 62,
      spo2: 92,
      respiratoryRate: 24,
      temperature: 37.1,
      cvp: 2.0,
      etco2: 32,
      lactate: 4.8,
      gcs: 14,
    },
    initialPathology: {
      cyanosis: 0.35,
      pallor: 0.75,
      jaundice: 0.15,
      diaphoresis: 0.80,
      ascites: 0.0,
      myocardialIschemia: 0.20,
      pupilLeft: 4.0,
      pupilRight: 4.0,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'op_poisoning',
    title: "Organophosphate Poisoning (Cholinergic SLUDGE Toxidrome)",
    subtitle: "Pinpoint pupils, copious secretions, bronchorrhea & fasciculations",
    category: "Toxicology & Shock",
    departmentId: "toxicology",
    chiefComplaint: "Unconscious with excessive oral salivation, vomiting, and urinary incontinence",
    history: "28yo farmer brought after spraying chlorpyrifos. Pinpoint non-reactive pupils (1.0mm), severe bronchorrhea with diffuse rhonchi, muscle fasciculations.",
    targetInterventions: ['atropine', 'pralidoxime', 'oxygen'],
    lethalTriggers: ['succinylcholine', 'beta_blocker'],
    initialVitals: {
      heartRate: 42,
      bpSystolic: 86,
      bpDiastolic: 54,
      meanArterialPressure: 64,
      spo2: 83,
      respiratoryRate: 34,
      temperature: 36.5,
      cvp: 6.0,
      etco2: 48,
      lactate: 4.2,
      gcs: 8,
    },
    initialPathology: {
      cyanosis: 0.70,
      pallor: 0.60,
      jaundice: 0.0,
      diaphoresis: 0.98,
      ascites: 0.0,
      myocardialIschemia: 0.30,
      pupilLeft: 1.0,
      pupilRight: 1.0,
      pupilReactLeft: false,
      pupilReactRight: false,
      heartSoundType: 'normal',
      lungSoundType: 'wheeze',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'anaphylaxis',
    title: "Anaphylactic Shock (Severe Type I Hypersensitivity)",
    subtitle: "Biphasic stridor, diffuse urticaria, angioedema & vasodilation",
    category: "Toxicology & Shock",
    departmentId: "toxicology",
    chiefComplaint: "Sudden throat tightness, barking wheeze, generalized red itchy hives",
    history: "19yo student given IV Ceftriaxone. Lip and uvular edema, severe inspiratory stridor, profound distributive hypotension.",
    targetInterventions: ['adrenaline', 'saline', 'oxygen'],
    lethalTriggers: ['subcutaneous_adrenaline', 'upright_posture'],
    initialVitals: {
      heartRate: 140,
      bpSystolic: 68,
      bpDiastolic: 38,
      meanArterialPressure: 48,
      spo2: 85,
      respiratoryRate: 34,
      temperature: 37.2,
      cvp: 1.0,
      etco2: 24,
      lactate: 4.9,
      gcs: 13,
    },
    initialPathology: {
      cyanosis: 0.55,
      pallor: 0.40,
      jaundice: 0.0,
      diaphoresis: 0.85,
      ascites: 0.0,
      myocardialIschemia: 0.25,
      pupilLeft: 4.0,
      pupilRight: 4.0,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'wheeze',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'pcm_toxicity',
    title: "Paracetamol (Acetaminophen) Acute Toxic Liver Failure",
    subtitle: "Centrilobular hepatic necrosis, profound coagulopathy & encephalopathy",
    category: "Toxicology & Shock",
    departmentId: "toxicology",
    chiefComplaint: "Right upper quadrant abdominal tenderness, intractable vomiting, confusion",
    history: "22yo ingested 20g paracetamol 36h ago. Serum transaminases > 5000 IU/L, INR 4.2, metabolic acidosis.",
    targetInterventions: ['saline', 'oxygen'],
    lethalTriggers: ['sedatives', 'nsaids'],
    initialVitals: {
      heartRate: 112,
      bpSystolic: 96,
      bpDiastolic: 58,
      meanArterialPressure: 70,
      spo2: 95,
      respiratoryRate: 22,
      temperature: 36.6,
      cvp: 3.5,
      etco2: 30,
      lactate: 5.4,
      gcs: 11,
    },
    initialPathology: {
      cyanosis: 0.15,
      pallor: 0.60,
      jaundice: 0.70,
      diaphoresis: 0.60,
      ascites: 0.15,
      myocardialIschemia: 0.10,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },

  // 3. EMERGENCY MEDICINE & TRAUMA
  {
    id: 'tension_pneumo',
    title: "Acute Tension Pneumothorax (Post-Trauma Shock)",
    subtitle: "Tracheal deviation, absent breath sounds & obstructive shock",
    category: "Emergency & Polytrauma",
    departmentId: "emergency_trauma",
    chiefComplaint: "Extreme respiratory distress and cyanosis following blunt thoracic trauma",
    history: "24yo male motorcyclist in road accident. Trachea shifted markedly to left, right hemithorax hyperresonant and silent, neck veins distended.",
    targetInterventions: ['needle_decomp', 'oxygen'],
    lethalTriggers: ['delay_for_xray', 'positive_pressure_vent'],
    initialVitals: {
      heartRate: 142,
      bpSystolic: 66,
      bpDiastolic: 36,
      meanArterialPressure: 46,
      spo2: 76,
      respiratoryRate: 38,
      temperature: 36.7,
      cvp: 18.0,
      etco2: 20,
      lactate: 5.8,
      gcs: 11,
    },
    initialPathology: {
      cyanosis: 0.85,
      pallor: 0.80,
      jaundice: 0.0,
      diaphoresis: 0.90,
      ascites: 0.0,
      myocardialIschemia: 0.50,
      pupilLeft: 4.5,
      pupilRight: 4.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'silent',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'tamponade',
    title: "Cardiac Tamponade (Beck's Triad & Pulsus Paradoxus)",
    subtitle: "Muffled heart sounds, distended neck veins & electrical alternans",
    category: "Emergency & Polytrauma",
    departmentId: "emergency_trauma",
    chiefComplaint: "Severe air hunger, orthopnea, syncope on sitting upright",
    history: "42yo female with pericardial effusion. BP drops 22 mmHg on inspiration (pulsus paradoxus), heart sounds distant, low QRS voltage.",
    targetInterventions: ['pericardiocentesis', 'saline', 'oxygen'],
    lethalTriggers: ['furosemide', 'nitroglycerin'],
    initialVitals: {
      heartRate: 128,
      bpSystolic: 82,
      bpDiastolic: 68,
      meanArterialPressure: 72,
      spo2: 90,
      respiratoryRate: 28,
      temperature: 36.9,
      cvp: 20.0,
      etco2: 30,
      lactate: 3.9,
      gcs: 13,
    },
    initialPathology: {
      cyanosis: 0.35,
      pallor: 0.70,
      jaundice: 0.0,
      diaphoresis: 0.75,
      ascites: 0.0,
      myocardialIschemia: 0.40,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'splenic_rupture',
    title: "Blunt Abdominal Trauma with Massive Hemoperitoneum",
    subtitle: "Kehr's sign (left shoulder pain), abdominal guarding, class IV shock",
    category: "Emergency & Polytrauma",
    departmentId: "emergency_trauma",
    chiefComplaint: "Severe left upper quadrant pain following steering wheel impact, dizzy and pale",
    history: "29yo driver with seatbelt sign. FAST positive in splenorenal recess and pelvis. SBP refractory to posture.",
    targetInterventions: ['saline', 'oxygen', 'noradrenaline'],
    lethalTriggers: ['excessive_diuretics', 'delayed_transfusion'],
    initialVitals: {
      heartRate: 138,
      bpSystolic: 72,
      bpDiastolic: 44,
      meanArterialPressure: 53,
      spo2: 91,
      respiratoryRate: 28,
      temperature: 36.1,
      cvp: 1.0,
      etco2: 26,
      lactate: 6.4,
      gcs: 12,
    },
    initialPathology: {
      cyanosis: 0.30,
      pallor: 0.95,
      jaundice: 0.0,
      diaphoresis: 0.90,
      ascites: 0.40,
      myocardialIschemia: 0.35,
      pupilLeft: 4.0,
      pupilRight: 4.0,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'flail_chest',
    title: "Polytrauma with Flail Chest and Massive Hemothorax",
    subtitle: "Paradoxical chest motion, tracheal deviation, dull percussion",
    category: "Emergency & Polytrauma",
    departmentId: "emergency_trauma",
    chiefComplaint: "Excruciating thoracic pain and paradoxical inward chest movement on inspiration",
    history: "45yo pedestrian struck by car. Segmental fractures of ribs 4-8, dullness across right base, profound hypoxia.",
    targetInterventions: ['oxygen', 'saline'],
    lethalTriggers: ['excessive_bag_mask', 'delayed_decompression'],
    initialVitals: {
      heartRate: 132,
      bpSystolic: 80,
      bpDiastolic: 48,
      meanArterialPressure: 58,
      spo2: 78,
      respiratoryRate: 36,
      temperature: 36.4,
      cvp: 4.0,
      etco2: 24,
      lactate: 5.1,
      gcs: 11,
    },
    initialPathology: {
      cyanosis: 0.80,
      pallor: 0.85,
      jaundice: 0.0,
      diaphoresis: 0.90,
      ascites: 0.0,
      myocardialIschemia: 0.45,
      pupilLeft: 4.0,
      pupilRight: 4.0,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'silent',
      ecgRhythm: 'sinus',
    },
  },

  // 4. GASTROENTEROLOGY & HEPATOLOGY
  {
    id: 'cirrhosis',
    title: "Decompensated Chronic Liver Disease (DCLD with Tense Ascites)",
    subtitle: "Tense ascites, portal hypertension, jaundice, asterixis & HRS risk",
    category: "Gastroenterology & Hepatology",
    departmentId: "gastroenterology",
    chiefComplaint: "Progressive abdominal distension, bilateral pedal edema, yellowish sclerae",
    history: "50yo male with history of alcohol dependence and previous variceal bleed. Shifting dullness > 2L, fluid thrill positive, spider angiomas.",
    targetInterventions: ['furosemide', 'oxygen'],
    lethalTriggers: ['nsaids', 'sedation'],
    initialVitals: {
      heartRate: 88,
      bpSystolic: 104,
      bpDiastolic: 64,
      meanArterialPressure: 77,
      spo2: 96,
      respiratoryRate: 18,
      temperature: 37.0,
      cvp: 4.0,
      etco2: 38,
      lactate: 1.8,
      gcs: 14,
    },
    initialPathology: {
      cyanosis: 0.05,
      pallor: 0.50,
      jaundice: 0.95,
      diaphoresis: 0.20,
      ascites: 0.92,
      myocardialIschemia: 0.0,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'variceal_bleed',
    title: "Bleeding Esophageal Varices with Upper GI Hemorrhage",
    subtitle: "Massive hematemesis, melena, hyperdynamic portal hypertension",
    category: "Gastroenterology & Hepatology",
    departmentId: "gastroenterology",
    chiefComplaint: "Sudden vomitus of 800 mL fresh blood with clots, dizziness and syncope",
    history: "52yo known cirrhotic patient presenting with acute upper GI bleeding and cold clammy skin.",
    targetInterventions: ['saline', 'noradrenaline', 'oxygen'],
    lethalTriggers: ['aspirin', 'nsaids'],
    initialVitals: {
      heartRate: 130,
      bpSystolic: 76,
      bpDiastolic: 46,
      meanArterialPressure: 56,
      spo2: 93,
      respiratoryRate: 26,
      temperature: 36.3,
      cvp: 1.5,
      etco2: 28,
      lactate: 5.6,
      gcs: 12,
    },
    initialPathology: {
      cyanosis: 0.25,
      pallor: 0.95,
      jaundice: 0.65,
      diaphoresis: 0.90,
      ascites: 0.60,
      myocardialIschemia: 0.30,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'acute_pancreatitis',
    title: "Severe Acute Necrotizing Pancreatitis",
    subtitle: "Epigastric pain radiating to back, Cullen's sign, systemic inflammatory response",
    category: "Gastroenterology & Hepatology",
    departmentId: "gastroenterology",
    chiefComplaint: "Agonizing epigastric pain boring through to the back, relieved by leaning forward",
    history: "41yo male following binge alcohol intake. Marked epigastric guarding, serum lipase > 3000 U/L, SIRS positive.",
    targetInterventions: ['saline', 'oxygen'],
    lethalTriggers: ['oral_intake', 'delayed_resuscitation'],
    initialVitals: {
      heartRate: 122,
      bpSystolic: 90,
      bpDiastolic: 56,
      meanArterialPressure: 67,
      spo2: 91,
      respiratoryRate: 28,
      temperature: 38.6,
      cvp: 2.0,
      etco2: 28,
      lactate: 4.5,
      gcs: 14,
    },
    initialPathology: {
      cyanosis: 0.20,
      pallor: 0.60,
      jaundice: 0.35,
      diaphoresis: 0.85,
      ascites: 0.30,
      myocardialIschemia: 0.20,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'crackles',
      ecgRhythm: 'sinus',
    },
  },

  // 5. PULMONOLOGY & INFECTIOUS DISEASE
  {
    id: 'tb_hemoptysis',
    title: "Cavitary Pulmonary Tuberculosis with Massive Hemoptysis",
    subtitle: "Apical amphoric breath sounds, Rasmussen's aneurysm bleed & post-tussive rales",
    category: "Pulmonology & Infectious Disease",
    departmentId: "pulmonology",
    chiefComplaint: "Coughing large quantities of bright red arterial blood (>200 mL)",
    history: "38yo male with evening fevers, 8kg weight loss, now presenting with life-threatening hemoptysis from right apical tuberculous cavity.",
    targetInterventions: ['oxygen', 'saline'],
    lethalTriggers: ['non_dependent_position', 'excessive_sedation'],
    initialVitals: {
      heartRate: 114,
      bpSystolic: 94,
      bpDiastolic: 58,
      meanArterialPressure: 70,
      spo2: 87,
      respiratoryRate: 28,
      temperature: 38.3,
      cvp: 2.5,
      etco2: 30,
      lactate: 3.2,
      gcs: 13,
    },
    initialPathology: {
      cyanosis: 0.40,
      pallor: 0.70,
      jaundice: 0.0,
      diaphoresis: 0.65,
      ascites: 0.0,
      myocardialIschemia: 0.20,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'bronchial',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'status_asthmaticus',
    title: "Refractory Status Asthmaticus with Silent Chest",
    subtitle: "Pulsus paradoxus, sternocleidomastoid retractions & hypercapnic respiratory failure",
    category: "Pulmonology & Infectious Disease",
    departmentId: "pulmonology",
    chiefComplaint: "Inability to speak in sentences, severe air hunger, exhausting wheeze disappearing into silence",
    history: "26yo chronic asthmatic whose bronchodilator inhaler ran out. Severe hyperinflation, silent chest, impending respiratory arrest.",
    targetInterventions: ['oxygen', 'adrenaline'],
    lethalTriggers: ['sedatives', 'beta_blocker'],
    initialVitals: {
      heartRate: 144,
      bpSystolic: 138,
      bpDiastolic: 88,
      meanArterialPressure: 104,
      spo2: 80,
      respiratoryRate: 38,
      temperature: 37.0,
      cvp: 8.0,
      etco2: 56,
      lactate: 4.1,
      gcs: 12,
    },
    initialPathology: {
      cyanosis: 0.75,
      pallor: 0.40,
      jaundice: 0.0,
      diaphoresis: 0.95,
      ascites: 0.0,
      myocardialIschemia: 0.35,
      pupilLeft: 4.0,
      pupilRight: 4.0,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'silent',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'septic_shock',
    title: "Hyperdynamic Septic Shock (Urosepsis & Vasoplegia)",
    subtitle: "Bounding pulses, vasoplegia, refractory lactic acidosis & oliguria",
    category: "Pulmonology & Infectious Disease",
    departmentId: "pulmonology",
    chiefComplaint: "High-grade fever, shaking chills, altered sensorium and cloudy urine",
    history: "68yo female with indwelling urinary catheter, presenting with purulent urine, rigors, and warm vasodilated extremities.",
    targetInterventions: ['saline', 'noradrenaline', 'oxygen'],
    lethalTriggers: ['hypoventilation', 'delayed_pressor'],
    initialVitals: {
      heartRate: 132,
      bpSystolic: 75,
      bpDiastolic: 40,
      meanArterialPressure: 51,
      spo2: 90,
      respiratoryRate: 30,
      temperature: 39.4,
      cvp: 1.5,
      etco2: 26,
      lactate: 6.2,
      gcs: 12,
    },
    initialPathology: {
      cyanosis: 0.40,
      pallor: 0.60,
      jaundice: 0.30,
      diaphoresis: 0.70,
      ascites: 0.0,
      myocardialIschemia: 0.40,
      pupilLeft: 3.0,
      pupilRight: 3.0,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'crackles',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'cerebral_malaria',
    title: "Severe Plasmodium falciparum Cerebral Malaria",
    subtitle: "Microvascular sequestration, unarousable coma & dark hemoglobinuria",
    category: "Pulmonology & Infectious Disease",
    departmentId: "pulmonology",
    chiefComplaint: "High-grade continuous fever with rigors progressing to sudden unarousable coma and seizures",
    history: "27yo forest ranger from endemic area. Ring forms and crescent gametocytes on smear, splenomegaly, blackwater urine.",
    targetInterventions: ['saline', 'oxygen'],
    lethalTriggers: ['dextrose_delay', 'inappropriate_sedation'],
    initialVitals: {
      heartRate: 126,
      bpSystolic: 92,
      bpDiastolic: 54,
      meanArterialPressure: 66,
      spo2: 91,
      respiratoryRate: 28,
      temperature: 40.2,
      cvp: 3.0,
      etco2: 26,
      lactate: 5.8,
      gcs: 7,
    },
    initialPathology: {
      cyanosis: 0.30,
      pallor: 0.90,
      jaundice: 0.60,
      diaphoresis: 0.95,
      ascites: 0.0,
      myocardialIschemia: 0.20,
      pupilLeft: 3.0,
      pupilRight: 3.0,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },

  // 6. ENDOCRINOLOGY & NEPHROLOGY
  {
    id: 'dka',
    title: "Diabetic Ketoacidosis (DKA with Kussmaul Breathing)",
    subtitle: "High anion-gap metabolic acidosis, ketonuria & osmotic dehydration",
    category: "Endocrinology & Nephrology",
    departmentId: "endocrinology_nephrology",
    chiefComplaint: "Deep rapid labored breathing, abdominal pain, persistent vomiting",
    history: "21yo with Type 1 DM missed insulin. Fruity acetone breath odor, skin turgor poor, blood sugar 480 mg/dL, arterial pH 7.12.",
    targetInterventions: ['saline', 'insulin_iv'],
    lethalTriggers: ['insulin_bolus_without_fluids', 'insulin_when_hypokalemic'],
    initialVitals: {
      heartRate: 124,
      bpSystolic: 92,
      bpDiastolic: 58,
      meanArterialPressure: 69,
      spo2: 97,
      respiratoryRate: 32,
      temperature: 37.4,
      cvp: 2.0,
      etco2: 18,
      lactate: 3.8,
      gcs: 13,
    },
    initialPathology: {
      cyanosis: 0.10,
      pallor: 0.65,
      jaundice: 0.0,
      diaphoresis: 0.40,
      ascites: 0.0,
      myocardialIschemia: 0.10,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'aki_uremia',
    title: "Acute Kidney Injury with Hyperkalemia & Uremic Pericarditis",
    subtitle: "Anuria, tall tented T-waves, uremic frost & pericardial rub",
    category: "Endocrinology & Nephrology",
    departmentId: "endocrinology_nephrology",
    chiefComplaint: "Total absence of urine output for 36 hours, nausea, hitching chest pain on leaning forward",
    history: "58yo diabetic post-contrast CT scan. Serum potassium 7.2 mEq/L, creatinine 8.4 mg/dL, coarse pericardial friction rub.",
    targetInterventions: ['saline', 'insulin_iv', 'furosemide'],
    lethalTriggers: ['potassium_sparing_diuretic', 'nsaids'],
    initialVitals: {
      heartRate: 108,
      bpSystolic: 168,
      bpDiastolic: 98,
      meanArterialPressure: 121,
      spo2: 94,
      respiratoryRate: 26,
      temperature: 36.9,
      cvp: 12.0,
      etco2: 30,
      lactate: 4.2,
      gcs: 13,
    },
    initialPathology: {
      cyanosis: 0.15,
      pallor: 0.85,
      jaundice: 0.10,
      diaphoresis: 0.50,
      ascites: 0.20,
      myocardialIschemia: 0.40,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'crackles',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'thyroid_storm',
    title: "Severe Thyrotoxic Crisis / Thyroid Storm",
    subtitle: "Extreme hyperpyrexia (41°C), high-output heart failure & delirium",
    category: "Endocrinology & Nephrology",
    departmentId: "endocrinology_nephrology",
    chiefComplaint: "Profuse sweating, racing heart > 160 bpm, marked agitation and delirium",
    history: "34yo with untreated Graves' disease following dental extraction. Burch-Wartofsky score 65, exophthalmos, diffuse toxic goiter with bruit.",
    targetInterventions: ['saline', 'oxygen'],
    lethalTriggers: ['aspirin', 'iodine_before_thionamide'],
    initialVitals: {
      heartRate: 168,
      bpSystolic: 174,
      bpDiastolic: 62,
      meanArterialPressure: 99,
      spo2: 94,
      respiratoryRate: 34,
      temperature: 41.2,
      cvp: 5.0,
      etco2: 44,
      lactate: 4.6,
      gcs: 10,
    },
    initialPathology: {
      cyanosis: 0.25,
      pallor: 0.20,
      jaundice: 0.25,
      diaphoresis: 0.99,
      ascites: 0.0,
      myocardialIschemia: 0.50,
      pupilLeft: 4.5,
      pupilRight: 4.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'crackles',
      ecgRhythm: 'sinus',
    },
  },

  // 7. NEUROLOGY
  {
    id: 'stroke',
    title: "Acute Ischemic Stroke & Dense Hemiplegia (MCA Territory)",
    subtitle: "Right-sided hemiplegia, UMN facial palsy & Broca's aphasia",
    category: "Neurology & Stroke",
    departmentId: "neurology",
    chiefComplaint: "Sudden loss of movement in right arm and leg with inability to speak",
    history: "67yo female presented 90 minutes post-onset. Right arm power 0/5, leg 1/5, forehead sparing facial droop, NIHSS score 16.",
    targetInterventions: ['rtpa', 'oxygen'],
    lethalTriggers: ['aggressive_bp_lowering', 'anticoagulants_within_24h'],
    initialVitals: {
      heartRate: 84,
      bpSystolic: 184,
      bpDiastolic: 106,
      meanArterialPressure: 132,
      spo2: 97,
      respiratoryRate: 18,
      temperature: 37.0,
      cvp: 4.5,
      etco2: 38,
      lactate: 1.5,
      gcs: 14,
    },
    initialPathology: {
      cyanosis: 0.05,
      pallor: 0.20,
      jaundice: 0.0,
      diaphoresis: 0.30,
      ascites: 0.0,
      myocardialIschemia: 0.10,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'status_epilepticus',
    title: "Generalized Convulsive Status Epilepticus",
    subtitle: "Continuous tonic-clonic convulsions > 20 mins, hyperpyrexia & lactic acidosis",
    category: "Neurology & Stroke",
    departmentId: "neurology",
    chiefComplaint: "Unresponsive with continuous generalized shaking, foaming at mouth, cyanosis",
    history: "23yo known epileptic patient who missed medication. 25 minutes of continuous convulsions, tongue bite, trismus.",
    targetInterventions: ['oxygen', 'saline'],
    lethalTriggers: ['oral_airway_during_convulsion', 'restraining_limbs'],
    initialVitals: {
      heartRate: 148,
      bpSystolic: 160,
      bpDiastolic: 96,
      meanArterialPressure: 117,
      spo2: 79,
      respiratoryRate: 36,
      temperature: 39.1,
      cvp: 7.0,
      etco2: 52,
      lactate: 7.8,
      gcs: 6,
    },
    initialPathology: {
      cyanosis: 0.85,
      pallor: 0.30,
      jaundice: 0.0,
      diaphoresis: 0.95,
      ascites: 0.0,
      myocardialIschemia: 0.30,
      pupilLeft: 5.0,
      pupilRight: 5.0,
      pupilReactLeft: false,
      pupilReactRight: false,
      heartSoundType: 'normal',
      lungSoundType: 'wheeze',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'meningitis',
    title: "Acute Bacterial Meningitis with Impending Herniation",
    subtitle: "Neck stiffness, Kernig's sign, petechial rash & papilledema",
    category: "Neurology & Stroke",
    departmentId: "neurology",
    chiefComplaint: "Excruciating headache, neck rigidity, photophobia, high fever",
    history: "18yo college student presenting with purpuric skin rash, altered mental status, and severe meningismus.",
    targetInterventions: ['oxygen', 'saline'],
    lethalTriggers: ['lumbar_puncture_before_ct', 'hypotonic_fluids'],
    initialVitals: {
      heartRate: 120,
      bpSystolic: 146,
      bpDiastolic: 84,
      meanArterialPressure: 104,
      spo2: 95,
      respiratoryRate: 24,
      temperature: 39.8,
      cvp: 5.0,
      etco2: 34,
      lactate: 3.9,
      gcs: 11,
    },
    initialPathology: {
      cyanosis: 0.20,
      pallor: 0.50,
      jaundice: 0.0,
      diaphoresis: 0.80,
      ascites: 0.0,
      myocardialIschemia: 0.15,
      pupilLeft: 3.0,
      pupilRight: 3.0,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },

  // 8. GENERAL & VASCULAR SURGERY
  {
    id: 'perforated_peptic_ulcer',
    title: "Perforated Duodenal Ulcer with Generalized Peritonitis",
    subtitle: "Board-like abdominal rigidity, absent bowel sounds, gas under diaphragm",
    category: "General & Vascular Surgery",
    departmentId: "general_surgery",
    chiefComplaint: "Sudden onset explosive epigastric pain like a knife, abdomen rock hard",
    history: "48yo male taking OTC NSAIDs for backache. Board-like rigidity, loss of liver dullness, pneumoperitoneum on erect chest radiograph.",
    targetInterventions: ['saline', 'oxygen'],
    lethalTriggers: ['oral_analgesics', 'barium_meal'],
    initialVitals: {
      heartRate: 126,
      bpSystolic: 90,
      bpDiastolic: 54,
      meanArterialPressure: 66,
      spo2: 92,
      respiratoryRate: 30,
      temperature: 38.5,
      cvp: 2.0,
      etco2: 28,
      lactate: 4.7,
      gcs: 14,
    },
    initialPathology: {
      cyanosis: 0.20,
      pallor: 0.70,
      jaundice: 0.0,
      diaphoresis: 0.85,
      ascites: 0.25,
      myocardialIschemia: 0.20,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'appendicitis_peritonitis',
    title: "Gangrenous Acute Appendicitis with Rupture & Peritonitis",
    subtitle: "McBurney's point tenderness, Rovsing's sign positive, high fever",
    category: "General & Vascular Surgery",
    departmentId: "general_surgery",
    chiefComplaint: "Umbilical pain shifting to right lower quadrant with vomiting and fever",
    history: "16yo boy with anorexia, rebound tenderness at McBurney's point, high leukocytosis (18,000/mcL).",
    targetInterventions: ['saline', 'oxygen'],
    lethalTriggers: ['purgatives', 'warm_abdominal_compress'],
    initialVitals: {
      heartRate: 118,
      bpSystolic: 102,
      bpDiastolic: 64,
      meanArterialPressure: 76,
      spo2: 96,
      respiratoryRate: 24,
      temperature: 39.2,
      cvp: 3.0,
      etco2: 32,
      lactate: 3.2,
      gcs: 15,
    },
    initialPathology: {
      cyanosis: 0.10,
      pallor: 0.40,
      jaundice: 0.0,
      diaphoresis: 0.70,
      ascites: 0.15,
      myocardialIschemia: 0.05,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'strangulated_hernia',
    title: "Strangulated Inguinal Hernia & Intestinal Obstruction",
    subtitle: "Irreducible tense tender groin mass, bilious vomiting & obstipation",
    category: "General & Vascular Surgery",
    departmentId: "general_surgery",
    chiefComplaint: "Tender painful groin swelling that can no longer be pushed back, vomiting bile",
    history: "63yo male with chronic reducible inguinal hernia. Mass now hot, erythematous, non-pulsatile with absent cough impulse.",
    targetInterventions: ['saline', 'oxygen'],
    lethalTriggers: ['forceful_manual_reduction', 'delayed_exploration'],
    initialVitals: {
      heartRate: 124,
      bpSystolic: 88,
      bpDiastolic: 54,
      meanArterialPressure: 65,
      spo2: 94,
      respiratoryRate: 26,
      temperature: 38.4,
      cvp: 2.0,
      etco2: 30,
      lactate: 4.8,
      gcs: 14,
    },
    initialPathology: {
      cyanosis: 0.20,
      pallor: 0.65,
      jaundice: 0.0,
      diaphoresis: 0.80,
      ascites: 0.10,
      myocardialIschemia: 0.15,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'acute_limb_ischemia',
    title: "Acute Femoral Embolism (6 Ps of Limb Ischemia)",
    subtitle: "Pain, Pallor, Pulselessness, Paresthesia, Paralysis & Perishing cold",
    category: "General & Vascular Surgery",
    departmentId: "general_surgery",
    chiefComplaint: "Sudden agonizing pain and icy coldness in right lower leg, unable to move toes",
    history: "66yo with atrial fibrillation who stopped anticoagulation. Femoral, popliteal, and pedal pulses absent on right, sensation reduced.",
    targetInterventions: ['saline', 'oxygen'],
    lethalTriggers: ['heating_pads_on_limb', 'limb_elevation'],
    initialVitals: {
      heartRate: 110,
      bpSystolic: 140,
      bpDiastolic: 85,
      meanArterialPressure: 103,
      spo2: 95,
      respiratoryRate: 20,
      temperature: 36.8,
      cvp: 4.0,
      etco2: 36,
      lactate: 3.4,
      gcs: 15,
    },
    initialPathology: {
      cyanosis: 0.15,
      pallor: 0.50,
      jaundice: 0.0,
      diaphoresis: 0.60,
      ascites: 0.0,
      myocardialIschemia: 0.20,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },

  // 9. OBSTETRICS & GYNAECOLOGY
  {
    id: 'atonic_pph',
    title: "Massive Atonic Postpartum Hemorrhage (PPH)",
    subtitle: "Boggy flaccid uterus, torrential vaginal bleeding, hypovolemic collapse",
    category: "Obstetrics & Gynaecology",
    departmentId: "obg",
    chiefComplaint: "Torrential postpartum vaginal hemorrhage following twin vaginal delivery",
    history: "28yo P2L2 immediately post-delivery. Uterus soft, flaccid reaching above umbilicus, cumulative blood loss > 1500 mL.",
    targetInterventions: ['saline', 'noradrenaline', 'oxygen'],
    lethalTriggers: ['uterine_packing_delay', 'ignoring_bladder_fullness'],
    initialVitals: {
      heartRate: 146,
      bpSystolic: 62,
      bpDiastolic: 32,
      meanArterialPressure: 42,
      spo2: 89,
      respiratoryRate: 32,
      temperature: 36.0,
      cvp: 1.0,
      etco2: 22,
      lactate: 6.8,
      gcs: 11,
    },
    initialPathology: {
      cyanosis: 0.40,
      pallor: 0.98,
      jaundice: 0.0,
      diaphoresis: 0.95,
      ascites: 0.0,
      myocardialIschemia: 0.40,
      pupilLeft: 4.0,
      pupilRight: 4.0,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'eclampsia',
    title: "Severe Pre-eclampsia with Eclamptic Convulsions",
    subtitle: "BP 190/120, 4+ proteinuria, hyperreflexia, generalized tonic-clonic fit",
    category: "Obstetrics & Gynaecology",
    departmentId: "obg",
    chiefComplaint: "Generalized seizure in 34-week primigravida with blinding frontal headache",
    history: "22yo primigravida brought in post-ictal state following 2 tonic-clonic convulsions. Severe facial edema, clonus positive.",
    targetInterventions: ['oxygen', 'saline'],
    lethalTriggers: ['diazepam_overload', 'rapid_overcorrection_bp'],
    initialVitals: {
      heartRate: 134,
      bpSystolic: 196,
      bpDiastolic: 122,
      meanArterialPressure: 146,
      spo2: 86,
      respiratoryRate: 28,
      temperature: 37.8,
      cvp: 8.0,
      etco2: 44,
      lactate: 5.2,
      gcs: 9,
    },
    initialPathology: {
      cyanosis: 0.50,
      pallor: 0.40,
      jaundice: 0.0,
      diaphoresis: 0.90,
      ascites: 0.15,
      myocardialIschemia: 0.35,
      pupilLeft: 4.5,
      pupilRight: 4.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'ectopic_rupture',
    title: "Ruptured Tubal Ectopic Pregnancy & Hemoperitoneum",
    subtitle: "Amenorrhea 7 weeks, acute pelvic peritonitis, cervical motion tenderness",
    category: "Obstetrics & Gynaecology",
    departmentId: "obg",
    chiefComplaint: "Sudden lancinating lower abdominal pain, syncope, and slight dark vaginal spotting",
    history: "25yo female, 7 weeks amenorrhea. Marked cervical excitation tenderness, pouch of Douglas bulging, urine pregnancy test positive.",
    targetInterventions: ['saline', 'oxygen', 'noradrenaline'],
    lethalTriggers: ['delay_for_mri', 'pelvic_heat'],
    initialVitals: {
      heartRate: 136,
      bpSystolic: 74,
      bpDiastolic: 42,
      meanArterialPressure: 52,
      spo2: 92,
      respiratoryRate: 28,
      temperature: 36.4,
      cvp: 1.5,
      etco2: 26,
      lactate: 5.4,
      gcs: 13,
    },
    initialPathology: {
      cyanosis: 0.25,
      pallor: 0.90,
      jaundice: 0.0,
      diaphoresis: 0.85,
      ascites: 0.35,
      myocardialIschemia: 0.25,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },

  // 10. PEDIATRICS
  {
    id: 'peds_gastro_shock',
    title: "Severe Rotavirus Dehydration & Hypovolemic Shock",
    subtitle: "Sunken fontanelle, skin pinch > 3s, dry mucous membranes, lethargy",
    category: "Pediatric Critical Care",
    departmentId: "pediatrics",
    chiefComplaint: "14 episodes of watery rice-water stools in 18-month-old infant, unable to drink",
    history: "18-month infant with sunken eyes, depressed anterior fontanelle, skin pinch returns very slowly (>3s), cold mottled extremities.",
    targetInterventions: ['saline', 'oxygen'],
    lethalTriggers: ['anti_diarrheal_opioids', 'delayed_iv_access'],
    initialVitals: {
      heartRate: 172,
      bpSystolic: 64,
      bpDiastolic: 38,
      meanArterialPressure: 46,
      spo2: 92,
      respiratoryRate: 46,
      temperature: 37.8,
      cvp: 1.0,
      etco2: 24,
      lactate: 5.8,
      gcs: 9,
    },
    initialPathology: {
      cyanosis: 0.40,
      pallor: 0.85,
      jaundice: 0.0,
      diaphoresis: 0.70,
      ascites: 0.0,
      myocardialIschemia: 0.20,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'peds_foreign_body',
    title: "Acute Laryngeal Foreign Body Aspiration (Inspiratory Stridor)",
    subtitle: "Sudden choking while eating peanuts, suprasternal retractions, air trapping",
    category: "Pediatric Critical Care",
    departmentId: "pediatrics",
    chiefComplaint: "Sudden violent coughing and choking fit in 3-year-old child, now gasping with loud crowing stridor",
    history: "3yo child was playing with peanuts. Severe inspiratory stridor, suprasternal and subcostal indrawing, acute agitation.",
    targetInterventions: ['oxygen'],
    lethalTriggers: ['blind_finger_sweep', 'sedatives'],
    initialVitals: {
      heartRate: 158,
      bpSystolic: 88,
      bpDiastolic: 54,
      meanArterialPressure: 65,
      spo2: 78,
      respiratoryRate: 48,
      temperature: 37.1,
      cvp: 4.0,
      etco2: 48,
      lactate: 4.6,
      gcs: 12,
    },
    initialPathology: {
      cyanosis: 0.80,
      pallor: 0.50,
      jaundice: 0.0,
      diaphoresis: 0.90,
      ascites: 0.0,
      myocardialIschemia: 0.30,
      pupilLeft: 4.0,
      pupilRight: 4.0,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'wheeze',
      ecgRhythm: 'sinus',
    },
  },

  // 11. ORTHOPEDICS & LIMB TRAUMA
  {
    id: 'compartment_syndrome',
    title: "Acute Compartment Syndrome (Closed Tibial Shaft Fracture)",
    subtitle: "Pain out of proportion, tense woody calf, pain on passive toe stretch",
    category: "Orthopedics & Limb Trauma",
    departmentId: "orthopedics",
    chiefComplaint: "Excruciating calf tightness and burning pain after sports tackle, unrelieved by IV morphine",
    history: "26yo soccer player with closed tibial fracture. Anterior and deep posterior compartments rock hard, sensory loss in 1st webspace.",
    targetInterventions: ['oxygen', 'saline'],
    lethalTriggers: ['cast_tightening', 'limb_elevation_above_heart'],
    initialVitals: {
      heartRate: 116,
      bpSystolic: 144,
      bpDiastolic: 88,
      meanArterialPressure: 106,
      spo2: 97,
      respiratoryRate: 22,
      temperature: 37.2,
      cvp: 4.0,
      etco2: 36,
      lactate: 2.9,
      gcs: 15,
    },
    initialPathology: {
      cyanosis: 0.10,
      pallor: 0.40,
      jaundice: 0.0,
      diaphoresis: 0.75,
      ascites: 0.0,
      myocardialIschemia: 0.10,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },
  {
    id: 'femoral_neck_fracture',
    title: "Displaced Intracapsular Femoral Neck Fracture in Elderly",
    subtitle: "Shortened and externally rotated right limb, severe groin pain, avascular necrosis risk",
    category: "Orthopedics & Limb Trauma",
    departmentId: "orthopedics",
    chiefComplaint: "Inability to bear weight on right hip following fall in bathroom, right leg turned outward",
    history: "78yo osteoporotic female. Right lower extremity shortened by 2.5 cm and externally rotated, tender over anterior hip capsule.",
    targetInterventions: ['saline', 'oxygen'],
    lethalTriggers: ['delayed_thromboprophylaxis', 'forceful_rotational_stress'],
    initialVitals: {
      heartRate: 98,
      bpSystolic: 152,
      bpDiastolic: 86,
      meanArterialPressure: 108,
      spo2: 95,
      respiratoryRate: 20,
      temperature: 36.9,
      cvp: 3.5,
      etco2: 36,
      lactate: 2.1,
      gcs: 15,
    },
    initialPathology: {
      cyanosis: 0.05,
      pallor: 0.35,
      jaundice: 0.0,
      diaphoresis: 0.45,
      ascites: 0.0,
      myocardialIschemia: 0.15,
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 'normal',
      lungSoundType: 'vesicular',
      ecgRhythm: 'sinus',
    },
  },
];

export class PhysiologyKernel {
  public vitals: PatientVitals;
  public pathology: PatientPathologyState;
  public currentScenario: ExtendedScenarioDefinition;
  public logs: string[] = [];

  private cardiacPhase: number = 0;
  private respPhase: number = 0;
  private simTimeSec: number = 0;

  private targetHR: number;
  private targetSBP: number;
  private targetDBP: number;
  private targetSpO2: number;
  private targetRR: number;

  constructor(scenarioId: string = 'snakebite') {
    const sc = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
    this.currentScenario = sc;
    this.vitals = { ...sc.initialVitals };
    this.pathology = { ...sc.initialPathology };
    this.targetHR = sc.initialVitals.heartRate;
    this.targetSBP = sc.initialVitals.bpSystolic;
    this.targetDBP = sc.initialVitals.bpDiastolic;
    this.targetSpO2 = sc.initialVitals.spo2;
    this.targetRR = sc.initialVitals.respiratoryRate;
    this.logs.push(`Scenario Initialized: ${sc.title}`);
  }

  public setScenario(scenarioId: string) {
    const sc = SCENARIOS.find((s) => s.id === scenarioId);
    if (!sc) return;
    this.currentScenario = sc;
    this.vitals = { ...sc.initialVitals };
    this.pathology = { ...sc.initialPathology };
    this.targetHR = sc.initialVitals.heartRate;
    this.targetSBP = sc.initialVitals.bpSystolic;
    this.targetDBP = sc.initialVitals.bpDiastolic;
    this.targetSpO2 = sc.initialVitals.spo2;
    this.targetRR = sc.initialVitals.respiratoryRate;
    this.logs.push(`Switched Scenario to: [${sc.category}] ${sc.title}`);
  }

  public applyAction(actionId: string): string {
    let feedback = '';

    // Check lethal triggers
    if (this.currentScenario.id === 'stemi' && (actionId === 'nitroglycerin' || actionId === 'beta_blocker')) {
      this.targetSBP = 48;
      this.targetDBP = 24;
      this.targetHR = 36;
      this.targetSpO2 = 80;
      this.pathology.ecgRhythm = 'vfib';
      feedback = 'CRITICAL ERROR: Nitrates/Beta-blockers in RV Infarction collapsed preload, precipitating Ventricular Fibrillation!';
      this.logs.push(feedback);
      return feedback;
    }

    if (this.currentScenario.id === 'chf_dcm' && actionId === 'saline') {
      this.targetSpO2 = 72;
      this.targetRR = 38;
      this.vitals.cvp += 6;
      this.pathology.cyanosis = 0.85;
      feedback = 'CRITICAL ERROR: IV Saline bolus in Acute Cardiogenic Pulmonary Edema flooded the alveoli! Severe hypoxemia ensued.';
      this.logs.push(feedback);
      return feedback;
    }

    if (this.currentScenario.id === 'dka' && actionId === 'insulin_iv' && this.vitals.cvp < 3) {
      this.targetSBP = 70;
      feedback = 'CAUTION: Insulin before aggressive volume resuscitation worsens intravascular volume collapse!';
      this.logs.push(feedback);
    }

    // Check if this action triggers a specific lethal contraindication for the current case
    if (this.currentScenario.lethalTriggers.includes(actionId)) {
      this.targetSBP = Math.max(40, this.vitals.bpSystolic - 35);
      this.targetDBP = Math.max(20, this.vitals.bpDiastolic - 25);
      this.targetSpO2 = Math.max(70, this.vitals.spo2 - 15);
      this.pathology.cyanosis = Math.min(1.0, this.pathology.cyanosis + 0.4);
      feedback = `CRITICAL ERROR: ${actionId.toUpperCase()} is strictly contraindicated in ${this.currentScenario.title}! Hemodynamics destabilized.`;
      this.logs.push(feedback);
      return feedback;
    }

    switch (actionId) {
      case 'saline':
        this.targetSBP = Math.min(130, this.vitals.bpSystolic + 18);
        this.targetDBP = Math.min(85, this.vitals.bpDiastolic + 12);
        this.targetHR = Math.max(75, this.vitals.heartRate - 14);
        this.vitals.cvp += 2.0;
        this.pathology.pallor = Math.max(0.1, this.pathology.pallor - 0.25);
        feedback = 'IV Normal Saline 500 mL Bolus: Restored circulating intravascular volume, elevated MAP, and eased tachycardia.';
        break;

      case 'blood_transfusion':
      case 'prbc':
        this.targetSBP = Math.min(125, this.vitals.bpSystolic + 26);
        this.targetDBP = Math.min(80, this.vitals.bpDiastolic + 16);
        this.targetHR = Math.max(75, this.vitals.heartRate - 22);
        this.targetSpO2 = Math.min(99, this.vitals.spo2 + 4);
        this.vitals.cvp += 3.0;
        this.pathology.pallor = Math.max(0.05, this.pathology.pallor - 0.55);
        feedback = 'Massive Transfusion Protocol (4 Units O-Neg PRBCs): Restored oxygen carrying capacity, stabilized hemorrhagic shock.';
        break;

      case 'aspirin_ticagrelor':
      case 'aspirin':
        this.pathology.myocardialIschemia = Math.max(0.05, this.pathology.myocardialIschemia - 0.65);
        feedback = 'Dual Antiplatelet Loading (Aspirin 325 mg + Ticagrelor 180 mg): Platelet COX-1 & P2Y12 inhibition arrested coronary thrombus propagation.';
        break;

      case 'heparin':
        this.pathology.myocardialIschemia = Math.max(0.05, this.pathology.myocardialIschemia - 0.4);
        feedback = 'Unfractionated Heparin Bolus (5000 IU IV): Antithrombin III potentiated, halting thromboembolic progression.';
        break;

      case 'antivenom':
        this.vitals.lactate = Math.max(1.2, this.vitals.lactate - 1.8);
        this.pathology.cyanosis = Math.max(0.05, this.pathology.cyanosis - 0.25);
        this.targetSpO2 = Math.min(99, this.vitals.spo2 + 5);
        this.targetHR = Math.max(76, this.vitals.heartRate - 18);
        feedback = 'Indian Polyvalent ASV 10 Vials IV: Neutralized circulating snake hemotoxins & venom metalloproteinases; restored microvascular stability.';
        break;

      case 'pralidoxime':
        this.pathology.cyanosis = Math.max(0.1, this.pathology.cyanosis - 0.35);
        this.targetHR = Math.min(95, this.vitals.heartRate + 25);
        this.targetSpO2 = Math.min(96, this.vitals.spo2 + 8);
        feedback = 'Pralidoxime (2-PAM 2g IV): Reactivated phosphorylated acetylcholinesterase, halting neuromuscular twitching and fasciculations.';
        break;

      case 'atropine':
        this.targetHR = Math.min(110, this.vitals.heartRate + 40);
        this.pathology.pupilLeft = Math.min(6.0, this.pathology.pupilLeft + 2.0);
        this.pathology.pupilRight = Math.min(6.0, this.pathology.pupilRight + 2.0);
        feedback = 'Atropine 2.0 mg IV Titration: Muscarinic receptor blockade established; dried hypersecretions & relieved severe bradycardia.';
        break;

      case 'nac':
        this.vitals.lactate = Math.max(1.0, this.vitals.lactate - 1.2);
        feedback = 'N-Acetylcysteine (NAC 150 mg/kg IV Infusion): Glutathione stores replenished, binding toxic NAPQI metabolite and halting acute liver failure.';
        break;

      case 'calcium_gluconate':
        this.targetHR = Math.min(85, Math.max(65, this.vitals.heartRate));
        this.pathology.ecgRhythm = 'sinus';
        feedback = '10% Calcium Gluconate 10 mL IV: Antagonized cardiotoxic effects of severe hyperkalemia; stabilized myocardial resting membrane potential.';
        break;

      case 'magnesium_sulfate':
        this.targetSBP = Math.max(130, this.vitals.bpSystolic - 30);
        this.targetDBP = Math.max(82, this.vitals.bpDiastolic - 22);
        this.targetHR = Math.max(75, this.vitals.heartRate - 15);
        feedback = 'Magnesium Sulfate 4g IV Loading + 1g/hr Infusion: NMDA blockade and cerebral vasodilation prevented eclamptic convulsions.';
        break;

      case 'oxytocin':
        this.targetSBP = Math.min(120, this.vitals.bpSystolic + 22);
        this.targetDBP = Math.min(78, this.vitals.bpDiastolic + 14);
        this.pathology.pallor = Math.max(0.1, this.pathology.pallor - 0.4);
        feedback = 'Oxytocin 10 IU IV + Bimanual Compression: Vigorous myometrial contractions induced, halting catastrophic atonic post-partum hemorrhage.';
        break;

      case 'ceftriaxone':
      case 'broad_abx':
        this.vitals.temperature = Math.max(37.0, this.vitals.temperature - 1.0);
        this.vitals.lactate = Math.max(1.5, this.vitals.lactate - 2.0);
        feedback = 'Ceftriaxone 2g IV + Vancomycin: Rapid bactericidal penetration of blood-brain barrier and systemic circulation; halted septic surge.';
        break;

      case 'lorazepam':
        this.pathology.ecgRhythm = 'sinus';
        this.targetRR = Math.max(16, this.vitals.respiratoryRate - 6);
        feedback = 'Lorazepam 4 mg IV Bolus: GABA-A receptor allosteric modulation terminated generalized convulsive status epilepticus within 90 seconds.';
        break;

      case 'fasciotomy':
        this.vitals.lactate = Math.max(1.2, this.vitals.lactate - 1.0);
        feedback = 'Emergent Dual-Incision 4-Compartment Leg Fasciotomy: Intercompartmental pressure plummeted from 48 to 12 mmHg; palpable dorsalis pedis pulse restored.';
        break;

      case 'traction_splint':
        this.targetSBP = Math.min(120, this.vitals.bpSystolic + 16);
        this.targetHR = Math.max(80, this.vitals.heartRate - 20);
        feedback = 'Hare Traction Splint Applied: Restored anatomical femoral alignment, tamponading retroperitoneal/thigh occult blood loss.';
        break;

      case 'ors_fluids':
        this.targetSBP = Math.min(105, this.vitals.bpSystolic + 20);
        this.targetHR = Math.max(90, this.vitals.heartRate - 30);
        this.vitals.cvp += 3.0;
        feedback = 'WHO Rehydration Protocol (20 mL/kg Ringer Lactate Bolus): Restored pediatric intravascular circulating volume and skin turgor.';
        break;

      case 'surgical_consult':
      case 'laparotomy':
        this.vitals.lactate = Math.max(1.0, this.vitals.lactate - 2.5);
        this.targetSBP = 118;
        this.targetDBP = 76;
        feedback = 'Emergent Exploratory Laparotomy / Surgical Decompression: Source control achieved; peritoneal lavage and defect closure completed successfully!';
        break;

      case 'adrenaline':
        this.targetHR = Math.min(145, this.vitals.heartRate + 35);
        this.targetSBP = Math.min(160, this.vitals.bpSystolic + 35);
        this.targetDBP = Math.min(95, this.vitals.bpDiastolic + 18);
        this.targetSpO2 = Math.min(98, this.vitals.spo2 + 8);
        this.pathology.cyanosis = Math.max(0.05, this.pathology.cyanosis - 0.35);
        feedback = 'Adrenaline (Epinephrine 1mg IV / 0.5mg IM): Alpha-1 vasoconstriction reversed shock; Beta-2 dilated airways.';
        break;

      case 'noradrenaline':
        this.targetSBP = Math.min(135, this.vitals.bpSystolic + 30);
        this.targetDBP = Math.min(85, this.vitals.bpDiastolic + 22);
        this.targetHR = Math.max(80, this.vitals.heartRate - 15);
        feedback = 'Noradrenaline (Norepinephrine) Infusion: Potent alpha-1 vasoconstriction restored target MAP > 65 mmHg.';
        break;

      case 'oxygen':
        this.targetSpO2 = Math.min(100, this.vitals.spo2 + 8);
        this.pathology.cyanosis = Math.max(0.0, this.pathology.cyanosis - 0.40);
        this.targetRR = Math.max(16, this.vitals.respiratoryRate - 6);
        feedback = 'High-Flow Oxygen 15 L/min NRB: Alveolar PaO2 augmented; tissue hypoxia relieved.';
        break;

      case 'furosemide':
        this.targetSBP = Math.max(115, this.vitals.bpSystolic - 25);
        this.targetDBP = Math.max(75, this.vitals.bpDiastolic - 15);
        this.targetSpO2 = Math.min(96, this.vitals.spo2 + 7);
        this.vitals.cvp = Math.max(6, this.vitals.cvp - 6);
        this.pathology.lungSoundType = 'vesicular';
        feedback = 'Furosemide 40 mg IV: Rapid venodilation followed by loop diuresis relieved alveolar congestion.';
        break;

      case 'needle_decomp':
        this.targetSBP = 110;
        this.targetDBP = 70;
        this.targetHR = 96;
        this.targetSpO2 = 94;
        this.vitals.cvp = 5.0;
        this.pathology.lungSoundType = 'bronchial';
        feedback = 'Immediate Needle Decompression (2nd ICS MCL): Massive rush of pressurized air relieved tension pneumothorax!';
        break;

      case 'pericardiocentesis':
        this.targetSBP = 118;
        this.targetDBP = 76;
        this.targetHR = 88;
        this.targetSpO2 = 96;
        this.vitals.cvp = 6.0;
        feedback = "Subxiphoid Pericardiocentesis: Aspirated 150 mL non-clotting pericardial fluid; Beck's triad resolved.";
        break;

      case 'insulin_iv':
        this.vitals.lactate = Math.max(1.0, this.vitals.lactate - 1.5);
        this.targetRR = Math.max(18, this.vitals.respiratoryRate - 8);
        feedback = 'Regular Insulin 10 Units IV: Halted hepatic ketogenesis and shifted cellular glucose uptake.';
        break;

      case 'defib':
        if (this.pathology.ecgRhythm === 'vfib' || this.pathology.ecgRhythm === 'vtach' || this.currentScenario.id === 'vfib_arrest') {
          this.pathology.ecgRhythm = 'sinus';
          this.targetHR = 88;
          this.targetSBP = 110;
          this.targetDBP = 70;
          this.targetSpO2 = 95;
          feedback = '200J Biphasic Shock Delivered: Successful electrical cardioversion to Normal Sinus Rhythm!';
        } else {
          feedback = 'Defibrillator checked: Rhythm is non-shockable.';
        }
        break;

      case 'rtpa':
        this.vitals.lactate = Math.max(1.0, this.vitals.lactate - 0.4);
        feedback = 'IV r-tPA (Alteplase 0.9 mg/kg): Thrombolytic recanalization of occluded cerebral vessel commenced.';
        break;

      case 'nitroglycerin':
        this.targetSBP = Math.max(100, this.vitals.bpSystolic - 20);
        this.targetDBP = Math.max(65, this.vitals.bpDiastolic - 12);
        feedback = 'Sublingual Nitroglycerin 0.4 mg: Coronary vasodilation and systemic venodilation reduced myocardial preload.';
        break;

      default:
        feedback = `Administered ${actionId}.`;
    }

    this.logs.push(feedback);
    return feedback;
  }

  // 100 Hz Step Update
  public tick(dt: number) {
    this.simTimeSec += dt;

    const rate = Math.min(1.0, dt * 1.2);
    this.vitals.heartRate += (this.targetHR - this.vitals.heartRate) * rate;
    this.vitals.bpSystolic += (this.targetSBP - this.vitals.bpSystolic) * rate;
    this.vitals.bpDiastolic += (this.targetDBP - this.vitals.bpDiastolic) * rate;
    this.vitals.spo2 += (this.targetSpO2 - this.vitals.spo2) * rate;
    this.vitals.respiratoryRate += (this.targetRR - this.vitals.respiratoryRate) * rate;

    this.vitals.meanArterialPressure = Math.round(
      this.vitals.bpDiastolic + (this.vitals.bpSystolic - this.vitals.bpDiastolic) / 3
    );

    const currentHR = this.vitals.heartRate;
    const cardiacFreq = Math.max(0.4, currentHR / 60);
    this.cardiacPhase = (this.cardiacPhase + 2 * Math.PI * cardiacFreq * dt) % (2 * Math.PI);

    const respFreq = Math.max(0.1, this.vitals.respiratoryRate / 60);
    this.respPhase = (this.respPhase + 2 * Math.PI * respFreq * dt) % (2 * Math.PI);
  }

  public getLiveVitals(): PatientVitals {
    const t = this.simTimeSec;
    const hrNoise = this.vitals.heartRate > 0 ? (1.8 * Math.sin(t * 0.35) + 0.9 * Math.sin(t * 1.1)) : 0;
    const respBPSwing = this.vitals.bpSystolic > 0 ? (3.0 * Math.sin(this.respPhase)) : 0;
    const spo2Dither = this.vitals.spo2 > 0 ? (0.4 * Math.sin(t * 0.2)) : 0;

    const liveHR = Math.max(0, Math.round(this.vitals.heartRate + hrNoise));
    const liveSBP = Math.max(0, Math.round(this.vitals.bpSystolic + respBPSwing));
    const liveDBP = Math.max(0, Math.round(this.vitals.bpDiastolic + respBPSwing * 0.5));
    const liveMAP = Math.round(liveDBP + (liveSBP - liveDBP) / 3);
    const liveSpO2 = Math.min(100, Math.max(0, Math.round(this.vitals.spo2 + spo2Dither)));

    return {
      ...this.vitals,
      heartRate: liveHR,
      bpSystolic: liveSBP,
      bpDiastolic: liveDBP,
      meanArterialPressure: liveMAP,
      spo2: liveSpO2,
    };
  }

  public sampleWaveforms(): TelemetryWaveformSample {
    const theta = this.cardiacPhase;

    let ecg = 0;
    if (this.pathology.ecgRhythm === 'vfib' || this.currentScenario.id === 'vfib_arrest') {
      ecg = 0.4 * Math.sin(theta * 3.5) + 0.3 * Math.sin(theta * 7.2) + 0.15 * Math.sin(theta * 11.1);
    } else if (this.pathology.ecgRhythm === 'stemi_inferior' || this.currentScenario.id === 'stemi') {
      const p = 0.15 * Math.exp(-Math.pow((theta - 0.45) / 0.08, 2));
      const q = -0.15 * Math.exp(-Math.pow((theta - 1.05) / 0.04, 2));
      const r = 1.25 * Math.exp(-Math.pow((theta - 1.12) / 0.03, 2));
      const s = -0.25 * Math.exp(-Math.pow((theta - 1.18) / 0.04, 2));
      const stElevation = theta >= 1.22 && theta < 2.4 ? 0.52 * Math.exp(-Math.pow((theta - 1.7) / 0.4, 2)) : 0;
      ecg = p + q + r + s + stElevation;
    } else {
      const p = 0.18 * Math.exp(-Math.pow((theta - 0.5) / 0.09, 2));
      const q = -0.16 * Math.exp(-Math.pow((theta - 1.14) / 0.035, 2));
      const r = 1.45 * Math.exp(-Math.pow((theta - 1.22) / 0.032, 2));
      const s = -0.36 * Math.exp(-Math.pow((theta - 1.30) / 0.04, 2));
      const t = 0.32 * Math.exp(-Math.pow((theta - 1.95) / 0.22, 2));
      ecg = p + q + r + s + t;
    }

    const pSys = this.vitals.bpSystolic;
    const pDia = this.vitals.bpDiastolic;
    let artLine = pDia;
    if (pSys <= 5) {
      artLine = 0;
    } else if (theta >= 1.15 && theta < 2.1) {
      const prog = (theta - 1.15) / 0.95;
      artLine = pDia + (pSys - pDia) * Math.sin(prog * Math.PI);
    } else if (theta >= 2.1 && theta < 2.5) {
      artLine = pDia + (pSys - pDia) * 0.36 + 7 * Math.sin((theta - 2.1) * 4 * Math.PI);
    } else {
      const prog = theta < 1.15 ? theta + (2 * Math.PI - 2.5) : theta - 2.5;
      artLine = pDia + (pSys - pDia) * 0.32 * Math.exp(-prog * 0.85);
    }

    const cvp = this.vitals.cvp + (this.vitals.heartRate > 0 ? (1.8 * Math.sin(theta) + 1.0 * Math.cos(theta * 2)) : 0);

    let capno = 0;
    if (this.vitals.respiratoryRate > 0 && this.respPhase > Math.PI && this.respPhase < 2 * Math.PI) {
      capno = this.vitals.etco2 * (1 - Math.exp(-(this.respPhase - Math.PI) * 5));
    }

    const delayedTheta = (theta - 0.4 + 2 * Math.PI) % (2 * Math.PI);
    const pleth = this.vitals.spo2 > 0 ? Math.max(0, Math.sin(delayedTheta) * 0.85 + 0.15) : 0;

    return { ecg, artLine, cvp, capno, pleth };
  }
}
