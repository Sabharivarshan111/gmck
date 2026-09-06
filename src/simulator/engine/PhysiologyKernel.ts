import { PatientVitals, PatientPathologyState, ScenarioDefinition, TelemetryWaveformSample } from '../types';

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'snakebite',
    title: "Russell's Viper Envenomation (Hemotoxic Shock)",
    subtitle: 'Fang puncture right leg, systemic capillary leak & coagulopathy',
    category: 'Toxicology & Shock',
    chiefComplaint: 'Severe right lower limb swelling, bleeding from gums, dizziness',
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
    id: 'stemi',
    title: 'Acute Inferior STEMI with Right Ventricular Infarction',
    subtitle: 'Severe substernal chest pressure, bradycardia & RV preload collapse',
    category: 'Cardiovascular Emergencies',
    chiefComplaint: 'Crushing retrosternal chest pain radiating to epigastrium and jaw with syncope',
    history: '56yo diabetic male smoker. Clear lungs, raised JVP, profound hypotension on nitrates.',
    targetInterventions: ['aspirin', 'saline', 'atropine', 'pci_transfer'],
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
    id: 'septic_shock',
    title: 'Hyperdynamic Septic Shock (Urosepsis & Vasoplegia)',
    subtitle: 'Bounding pulses, vasoplegia, refractory lactic acidosis & oliguria',
    category: 'Critical Care & Sepsis',
    chiefComplaint: 'High-grade fever, shaking chills, altered sensorium and cloudy urine',
    history: '68yo female with indwelling urinary catheter, presenting with purulent urine, rigors, and warm vasodilated extremities.',
    targetInterventions: ['saline', 'noradrenaline', 'broad_antibiotics', 'oxygen'],
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
    id: 'cirrhosis',
    title: 'Decompensated Chronic Liver Disease (DCLD with Tense Ascites)',
    subtitle: 'Tense ascites, portal hypertension, jaundice, asterixis & HRS risk',
    category: 'General Medicine Ward',
    chiefComplaint: 'Progressive abdominal distension, bilateral pedal edema, yellowish sclerae',
    history: '50yo male with history of alcohol dependence and previous variceal bleed. Shifting dullness > 2L, fluid thrill positive, spider angiomas.',
    targetInterventions: ['paracentesis', 'albumin', 'spironolactone', 'furosemide'],
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
    id: 'op_poisoning',
    title: 'Organophosphate Poisoning (Cholinergic SLUDGE Toxidrome)',
    subtitle: 'Pinpoint pupils, copious secretions, bronchorrhea & fasciculations',
    category: 'Toxicology & Shock',
    chiefComplaint: 'Unconscious with excessive oral salivation, vomiting, and urinary incontinence',
    history: '28yo farmer brought after spraying chlorpyrifos. Pinpoint non-reactive pupils (1.0mm), severe bronchorrhea with diffuse rhonchi, muscle fasciculations.',
    targetInterventions: ['atropine', 'pralidoxime', 'oxygen', 'intubation'],
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
    id: 'tension_pneumo',
    title: 'Acute Tension Pneumothorax (Post-Trauma Respiratory Shock)',
    subtitle: 'Tracheal deviation, absent breath sounds & obstructive shock',
    category: 'Emergency & Critical Care',
    chiefComplaint: 'Extreme respiratory distress and cyanosis following blunt thoracic trauma',
    history: '24yo male motorcyclist in road accident. Trachea shifted markedly to left, right hemithorax hyperresonant and silent, neck veins distended.',
    targetInterventions: ['needle_decomp', 'chest_tube', 'oxygen'],
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
    subtitle: 'Muffled heart sounds, distended neck veins & electrical alternans',
    category: 'Cardiovascular Emergencies',
    chiefComplaint: 'Severe air hunger, orthopnea, syncope on sitting upright',
    history: '42yo female with pericardial metastasis. BP drops 22 mmHg on inspiration (pulsus paradoxus), heart sounds distant, low QRS voltage.',
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
    id: 'anaphylaxis',
    title: 'Anaphylactic Shock (Severe Type I Hypersensitivity)',
    subtitle: 'Biphasic stridor, diffuse urticaria, angioedema & vasodilation',
    category: 'Emergency & Critical Care',
    chiefComplaint: 'Sudden throat tightness, barking wheeze, generalized red itchy hives',
    history: '19yo student given IV Ceftriaxone. Lip and uvular edema, severe inspiratory stridor, profound distributive hypotension.',
    targetInterventions: ['adrenaline', 'saline', 'hydrocortisone', 'oxygen'],
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
    id: 'dka',
    title: 'Diabetic Ketoacidosis (DKA with Kussmaul Breathing)',
    subtitle: 'High anion-gap metabolic acidosis, ketonuria & osmotic dehydration',
    category: 'Endocrine & Metabolic',
    chiefComplaint: 'Deep rapid labored breathing, abdominal pain, persistent vomiting',
    history: '21yo with Type 1 DM missed insulin. Fruity acetone breath odor, skin turgor poor, blood sugar 480 mg/dL, arterial pH 7.12.',
    targetInterventions: ['saline', 'insulin_iv', 'potassium'],
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
    id: 'chf_dcm',
    title: 'Congestive Heart Failure & DCM (Acute Pulmonary Edema)',
    subtitle: 'Orthopnea, raised JVP, S3 gallop & bubbling alveolar crackles',
    category: 'Cardiology Ward',
    chiefComplaint: 'Waking up choking with pink frothy sputum, unable to lie flat',
    history: '62yo male with dilated cardiomyopathy. Bibasilar bubbling crackles to upper zones, severe orthopnea, S3 gallop rhythm.',
    targetInterventions: ['furosemide', 'oxygen', 'nitroglycerin', 'bipap'],
    lethalTriggers: ['saline', 'beta_blocker_acute'],
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
    id: 'stroke',
    title: 'Acute Ischemic Stroke & Dense Hemiplegia (MCA Territory)',
    subtitle: "Right-sided hemiplegia, UMN facial palsy & Broca's aphasia",
    category: 'Neurology Ward',
    chiefComplaint: 'Sudden loss of movement in right arm and leg with inability to speak',
    history: '67yo female presented 90 minutes post-onset. Right arm power 0/5, leg 1/5, forehead sparing facial droop, NIHSS score 16.',
    targetInterventions: ['rtpa', 'oxygen', 'head_ct', 'permissive_htn'],
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
    id: 'tb_hemoptysis',
    title: 'Cavitary Pulmonary Tuberculosis with Massive Hemoptysis',
    subtitle: "Apical amphoric breath sounds, Rasmussen's aneurysm bleed & post-tussive rales",
    category: 'Pulmonology & Infectious Disease',
    chiefComplaint: 'Coughing large quantities of bright red arterial blood (>200 mL)',
    history: '38yo male with evening fevers, 8kg weight loss, now presenting with life-threatening hemoptysis from right apical tuberculous cavity.',
    targetInterventions: ['dependent_lung_position', 'oxygen', 'tranexamic_acid', 'att_regimen'],
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
];

export class PhysiologyKernel {
  public vitals: PatientVitals;
  public pathology: PatientPathologyState;
  public currentScenario: ScenarioDefinition;
  public logs: string[] = [];

  private cardiacPhase: number = 0;
  private respPhase: number = 0;
  private simTimeSec: number = 0;

  // Active pharmacokinetics & physiological targets
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
    this.logs.push(`Switched Scenario to: ${sc.title}`);
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

    switch (actionId) {
      case 'saline':
        this.targetSBP = Math.min(130, this.vitals.bpSystolic + 16);
        this.targetDBP = Math.min(85, this.vitals.bpDiastolic + 10);
        this.targetHR = Math.max(75, this.vitals.heartRate - 12);
        this.vitals.cvp += 2.0;
        this.pathology.pallor = Math.max(0.1, this.pathology.pallor - 0.25);
        feedback = 'IV Normal Saline 500 mL Bolus: Restored circulating intravascular volume, elevated MAP, and eased tachycardia.';
        break;

      case 'antivenom':
        this.vitals.lactate = Math.max(1.2, this.vitals.lactate - 1.8);
        this.pathology.cyanosis = Math.max(0.05, this.pathology.cyanosis - 0.25);
        this.targetSpO2 = Math.min(99, this.vitals.spo2 + 5);
        this.targetHR = Math.max(76, this.vitals.heartRate - 18);
        feedback = 'Indian Polyvalent ASV 10 Vials IV: Neutralized circulating snake hemotoxins; restored microvascular stability.';
        break;

      case 'atropine':
        this.targetHR = Math.min(110, this.vitals.heartRate + 40);
        this.pathology.pupilLeft = Math.min(6.0, this.pathology.pupilLeft + 2.0);
        this.pathology.pupilRight = Math.min(6.0, this.pathology.pupilRight + 2.0);
        feedback = 'Atropine 0.6 mg IV: Muscarinic vagal blockade established; chronotropy augmented.';
        break;

      case 'pralidoxime':
        this.pathology.cyanosis = Math.max(0.1, this.pathology.cyanosis - 0.35);
        this.targetHR = Math.min(95, this.vitals.heartRate + 25);
        this.targetSpO2 = Math.min(96, this.vitals.spo2 + 8);
        feedback = 'Pralidoxime (2-PAM 2g IV): Reactivated acetylcholinesterase, halting nicotinic fasciculations.';
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
        if (this.pathology.ecgRhythm === 'vfib' || this.pathology.ecgRhythm === 'vtach') {
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

      default:
        feedback = `Administered ${actionId}.`;
    }

    this.logs.push(feedback);
    return feedback;
  }

  // 100 Hz Step Update
  public tick(dt: number) {
    this.simTimeSec += dt;

    // Smooth exponential convergence to target vitals
    const rate = Math.min(1.0, dt * 1.2);
    this.vitals.heartRate += (this.targetHR - this.vitals.heartRate) * rate;
    this.vitals.bpSystolic += (this.targetSBP - this.vitals.bpSystolic) * rate;
    this.vitals.bpDiastolic += (this.targetDBP - this.vitals.bpDiastolic) * rate;
    this.vitals.spo2 += (this.targetSpO2 - this.vitals.spo2) * rate;
    this.vitals.respiratoryRate += (this.targetRR - this.vitals.respiratoryRate) * rate;

    // Update MAP
    this.vitals.meanArterialPressure = Math.round(
      this.vitals.bpDiastolic + (this.vitals.bpSystolic - this.vitals.bpDiastolic) / 3
    );

    // Advance cardiac phase
    const currentHR = this.vitals.heartRate;
    const cardiacFreq = Math.max(0.4, currentHR / 60);
    this.cardiacPhase = (this.cardiacPhase + 2 * Math.PI * cardiacFreq * dt) % (2 * Math.PI);

    // Advance respiratory phase
    const respFreq = Math.max(0.1, this.vitals.respiratoryRate / 60);
    this.respPhase = (this.respPhase + 2 * Math.PI * respFreq * dt) % (2 * Math.PI);
  }

  // Live fluctuating vitals for monitor digits (heart rate variability + respiratory variations)
  public getLiveVitals(): PatientVitals {
    const t = this.simTimeSec;
    // Autonomic heart rate micro-variability (+/- 1-2 bpm)
    const hrNoise = 1.8 * Math.sin(t * 0.35) + 0.9 * Math.sin(t * 1.1);
    // Respiratory stroke volume variation in blood pressure
    const respBPSwing = 3.0 * Math.sin(this.respPhase);
    // SpO2 minor dithering (+/- 0.4%)
    const spo2Dither = 0.4 * Math.sin(t * 0.2);

    const liveHR = Math.round(this.vitals.heartRate + hrNoise);
    const liveSBP = Math.round(this.vitals.bpSystolic + respBPSwing);
    const liveDBP = Math.round(this.vitals.bpDiastolic + respBPSwing * 0.5);
    const liveMAP = Math.round(liveDBP + (liveSBP - liveDBP) / 3);
    const liveSpO2 = Math.min(100, Math.max(50, Math.round(this.vitals.spo2 + spo2Dither)));

    return {
      ...this.vitals,
      heartRate: liveHR,
      bpSystolic: liveSBP,
      bpDiastolic: liveDBP,
      meanArterialPressure: liveMAP,
      spo2: liveSpO2,
    };
  }

  // Instantaneous waveform sample (anti-aliased continuous functions)
  public sampleWaveforms(): TelemetryWaveformSample {
    const theta = this.cardiacPhase;

    // 1. ECG Signal (Lead II)
    let ecg = 0;
    if (this.pathology.ecgRhythm === 'vfib') {
      ecg = 0.4 * Math.sin(theta * 3.5) + 0.3 * Math.sin(theta * 7.2) + 0.15 * Math.sin(theta * 11.1);
    } else if (this.pathology.ecgRhythm === 'stemi_inferior') {
      const p = 0.15 * Math.exp(-Math.pow((theta - 0.45) / 0.08, 2));
      const q = -0.15 * Math.exp(-Math.pow((theta - 1.05) / 0.04, 2));
      const r = 1.25 * Math.exp(-Math.pow((theta - 1.12) / 0.03, 2));
      const s = -0.25 * Math.exp(-Math.pow((theta - 1.18) / 0.04, 2));
      // ST-elevation plateau
      const stElevation = theta >= 1.22 && theta < 2.4 ? 0.52 * Math.exp(-Math.pow((theta - 1.7) / 0.4, 2)) : 0;
      ecg = p + q + r + s + stElevation;
    } else {
      // Normal Sinus Rhythm
      const p = 0.18 * Math.exp(-Math.pow((theta - 0.5) / 0.09, 2));
      const q = -0.16 * Math.exp(-Math.pow((theta - 1.14) / 0.035, 2));
      const r = 1.45 * Math.exp(-Math.pow((theta - 1.22) / 0.032, 2));
      const s = -0.36 * Math.exp(-Math.pow((theta - 1.30) / 0.04, 2));
      const t = 0.32 * Math.exp(-Math.pow((theta - 1.95) / 0.22, 2));
      ecg = p + q + r + s + t;
    }

    // 2. Arterial Blood Pressure Waveform
    const pSys = this.vitals.bpSystolic;
    const pDia = this.vitals.bpDiastolic;
    let artLine = pDia;
    if (theta >= 1.15 && theta < 2.1) {
      const prog = (theta - 1.15) / 0.95;
      artLine = pDia + (pSys - pDia) * Math.sin(prog * Math.PI);
    } else if (theta >= 2.1 && theta < 2.5) {
      // Dicrotic notch
      artLine = pDia + (pSys - pDia) * 0.36 + 7 * Math.sin((theta - 2.1) * 4 * Math.PI);
    } else {
      // Diastolic runoff
      const prog = theta < 1.15 ? theta + (2 * Math.PI - 2.5) : theta - 2.5;
      artLine = pDia + (pSys - pDia) * 0.32 * Math.exp(-prog * 0.85);
    }

    // 3. Central Venous Pressure
    const cvp = this.vitals.cvp + 1.8 * Math.sin(theta) + 1.0 * Math.cos(theta * 2) + 0.6 * Math.sin(this.respPhase);

    // 4. Capnography (EtCO2 square wave)
    let capno = 0;
    if (this.respPhase > Math.PI && this.respPhase < 2 * Math.PI) {
      capno = this.vitals.etco2 * (1 - Math.exp(-(this.respPhase - Math.PI) * 5));
    }

    // 5. SpO2 plethysmogram
    const delayedTheta = (theta - 0.4 + 2 * Math.PI) % (2 * Math.PI);
    const pleth = Math.max(0, Math.sin(delayedTheta) * 0.85 + 0.15);

    return { ecg, artLine, cvp, capno, pleth };
  }
}
