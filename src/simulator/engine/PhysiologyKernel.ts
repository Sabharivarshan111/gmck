import { PatientVitals, PatientPathologyState, ScenarioDefinition, TelemetryWaveformSample } from '../types';

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'snakebite',
    title: "Russell's Viper Envenomation (Hemotoxic Shock)",
    subtitle: 'Fang puncture right leg, systemic capillary leak & coagulopathy',
    category: 'Toxicology & Shock',
    chiefComplaint: 'Severe right lower limb swelling, bleeding from gums, dizziness',
    history: '34yo agricultural laborer bitten by large viper in paddy field 90 mins ago. Swelling rapidly advancing past knee.',
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
    subtitle: 'Severe substernal chest pressure, bradycardia & hypotension',
    category: 'Cardiovascular Emergencies',
    chiefComplaint: 'Crushing retrosternal chest pain radiating to epigastrium and jaw',
    history: '56yo diabetic male smoker. Acute onset diaphoresis and syncope while walking.',
    targetInterventions: ['aspirin', 'saline', 'atropine', 'pci_transfer'],
    lethalTriggers: ['nitroglycerin', 'beta_blocker'], // Nitroglycerin collapses RV preload!
    initialVitals: {
      heartRate: 48,
      bpSystolic: 80,
      bpDiastolic: 50,
      meanArterialPressure: 60,
      spo2: 95,
      respiratoryRate: 20,
      temperature: 36.8,
      cvp: 14.0, // High CVP due to RV failure!
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
      myocardialIschemia: 0.90, // Inferior wall / RV akinesis
      pupilLeft: 3.5,
      pupilRight: 3.5,
      pupilReactLeft: true,
      pupilReactRight: true,
      heartSoundType: 's3_gallop',
      lungSoundType: 'vesicular', // Clear lungs in RV MI!
      ecgRhythm: 'stemi_inferior',
    },
  },
  {
    id: 'septic_shock',
    title: 'Hyperdynamic Septic Shock (Urosepsis)',
    subtitle: 'Bounding pulses, vasoplegia & refractory lactic acidosis',
    category: 'Critical Care & Sepsis',
    chiefComplaint: 'High-grade fever, chills, altered sensorium and oliguria',
    history: '68yo female with indwelling urinary catheter, presenting with purulent urine and rigors.',
    targetInterventions: ['saline', 'noradrenaline', 'broad_antibiotics'],
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
    title: 'Decompensated Chronic Liver Disease (DCLD)',
    subtitle: 'Tense ascites, portal hypertension, jaundice & asterixis',
    category: 'General Medicine Ward',
    chiefComplaint: 'Progressive abdominal distension, bilateral pedal edema, yellowish eyes',
    history: '50yo male with long-standing alcohol use disorder, hematemesis 2 weeks ago.',
    targetInterventions: ['paracentesis', 'albumin', 'spironolactone'],
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
      jaundice: 0.95, // Severe scleral & cutaneous icterus!
      diaphoresis: 0.20,
      ascites: 0.90,  // Tense abdominal distension!
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
];

export class PhysiologyKernel {
  public vitals: PatientVitals;
  public pathology: PatientPathologyState;
  public currentScenario: ScenarioDefinition;
  public logs: string[] = [];

  // Cardiac & Respiratory state oscillators
  private cardiacPhase: number = 0; // 0 to 2*PI
  private respPhase: number = 0;    // 0 to 2*PI
  private simTimeSec: number = 0;

  // Active drug levels (concentrations)
  private activeDrugs: Record<string, number> = {
    antivenom: 0,
    saline: 0,
    atropine: 0,
    adrenaline: 0,
    nitroglycerin: 0,
    morphine: 0,
  };

  constructor(scenarioId: string = 'snakebite') {
    const sc = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
    this.currentScenario = sc;
    this.vitals = { ...sc.initialVitals };
    this.pathology = { ...sc.initialPathology };
    this.logs.push(`Scenario Initialized: ${sc.title}`);
  }

  public setScenario(scenarioId: string) {
    const sc = SCENARIOS.find((s) => s.id === scenarioId);
    if (!sc) return;
    this.currentScenario = sc;
    this.vitals = { ...sc.initialVitals };
    this.pathology = { ...sc.initialPathology };
    this.activeDrugs = { antivenom: 0, saline: 0, atropine: 0, adrenaline: 0, nitroglycerin: 0, morphine: 0 };
    this.logs.push(`Switched Scenario to: ${sc.title}`);
  }

  // Applies an intervention
  public applyAction(actionId: string): string {
    let feedback = '';

    // Check for fatal triggers
    if (this.currentScenario.id === 'stemi' && actionId === 'nitroglycerin') {
      this.vitals.bpSystolic = 48;
      this.vitals.bpDiastolic = 24;
      this.vitals.meanArterialPressure = 32;
      this.vitals.heartRate = 38;
      this.vitals.spo2 = 82;
      this.pathology.ecgRhythm = 'vfib';
      feedback = 'CRITICAL ERROR: Nitroglycerin given in Right Ventricular Infarction caused sudden preload collapse and Ventricular Fibrillation!';
      this.logs.push(feedback);
      return feedback;
    }

    switch (actionId) {
      case 'saline':
        this.activeDrugs.saline += 500;
        this.vitals.bpSystolic = Math.min(130, this.vitals.bpSystolic + 14);
        this.vitals.bpDiastolic = Math.min(85, this.vitals.bpDiastolic + 8);
        this.vitals.meanArterialPressure = Math.round(this.vitals.bpDiastolic + (this.vitals.bpSystolic - this.vitals.bpDiastolic) / 3);
        this.vitals.cvp += 2.5;
        this.pathology.pallor = Math.max(0.1, this.pathology.pallor - 0.25);
        feedback = 'IV Normal Saline 500mL Bolus: Improved circulating volume and MAP.';
        break;

      case 'antivenom':
        this.activeDrugs.antivenom += 10;
        this.vitals.lactate = Math.max(1.2, this.vitals.lactate - 1.8);
        this.pathology.cyanosis = Math.max(0.05, this.pathology.cyanosis - 0.20);
        this.vitals.spo2 = Math.min(99, this.vitals.spo2 + 4);
        feedback = 'Indian Polyvalent ASV 10 Vials IV: Neutralizing circulating snake hemotoxins.';
        break;

      case 'atropine':
        this.activeDrugs.atropine += 0.6;
        this.vitals.heartRate = Math.min(110, this.vitals.heartRate + 35);
        this.pathology.pupilLeft = Math.min(6.5, this.pathology.pupilLeft + 1.5);
        this.pathology.pupilRight = Math.min(6.5, this.pathology.pupilRight + 1.5);
        feedback = 'Atropine 0.6mg IV: Vagal block achieved, heart rate normalized.';
        break;

      case 'adrenaline':
        this.activeDrugs.adrenaline += 1.0;
        this.vitals.heartRate = Math.min(150, this.vitals.heartRate + 40);
        this.vitals.bpSystolic = Math.min(170, this.vitals.bpSystolic + 35);
        this.vitals.bpDiastolic = Math.min(100, this.vitals.bpDiastolic + 20);
        this.vitals.meanArterialPressure = Math.round(this.vitals.bpDiastolic + (this.vitals.bpSystolic - this.vitals.bpDiastolic) / 3);
        feedback = 'Epinephrine 1mg IV: Powerful alpha-1 vasoconstriction and beta-1 inotropy.';
        break;

      case 'oxygen':
        this.vitals.spo2 = Math.min(100, this.vitals.spo2 + 6);
        this.pathology.cyanosis = Math.max(0.0, this.pathology.cyanosis - 0.30);
        feedback = 'High-Flow Oxygen 15L/min NRB: Alveolar PaO2 augmented.';
        break;

      case 'defib':
        if (this.pathology.ecgRhythm === 'vfib' || this.pathology.ecgRhythm === 'vtach') {
          this.pathology.ecgRhythm = 'sinus';
          this.vitals.heartRate = 88;
          this.vitals.bpSystolic = 105;
          this.vitals.bpDiastolic = 65;
          this.vitals.meanArterialPressure = 78;
          this.vitals.spo2 = 94;
          feedback = '200J Biphasic Shock Delivered: Successful cardioversion to Normal Sinus Rhythm!';
        } else {
          feedback = 'Defibrillator synced: No shockable rhythm detected.';
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

    // Advance cardiac phase based on current HR
    const cardiacFreq = this.vitals.heartRate / 60; // Hz
    this.cardiacPhase = (this.cardiacPhase + 2 * Math.PI * cardiacFreq * dt) % (2 * Math.PI);

    // Advance respiratory phase based on RR
    const respFreq = this.vitals.respiratoryRate / 60; // Hz
    this.respPhase = (this.respPhase + 2 * Math.PI * respFreq * dt) % (2 * Math.PI);

    // Natural homeostatic drift or stabilization
    if (this.activeDrugs.antivenom > 0 && this.vitals.heartRate > 75) {
      this.vitals.heartRate -= 0.05 * dt * 60;
    }
  }

  // Generate instantaneous telemetry waveform sample (100 Hz)
  public sampleWaveforms(): TelemetryWaveformSample {
    const theta = this.cardiacPhase;

    // 1. ECG Signal Synthesis (Lead II approximation)
    let ecg = 0;
    if (this.pathology.ecgRhythm === 'vfib') {
      // Chaotic sinusoidal fibrillatory wave
      ecg = 0.4 * Math.sin(theta * 3.5) + 0.3 * Math.sin(theta * 7.2) + 0.15 * Math.sin(theta * 11.1);
    } else if (this.pathology.ecgRhythm === 'stemi_inferior') {
      // Elevated ST segment (Tombstone ST elevation)
      if (theta > 0.3 && theta < 0.6) ecg = 0.15 * Math.exp(-Math.pow((theta - 0.45) / 0.08, 2)); // P
      else if (theta > 0.9 && theta < 1.3) ecg = -0.15 * Math.exp(-Math.pow((theta - 1.05) / 0.04, 2)) + 1.2 * Math.exp(-Math.pow((theta - 1.12) / 0.03, 2)) - 0.3 * Math.exp(-Math.pow((theta - 1.18) / 0.04, 2)); // QRS
      else if (theta >= 1.25 && theta < 2.4) ecg = 0.55 * Math.exp(-Math.pow((theta - 1.7) / 0.4, 2)); // Monophasic STEMI ST Elevation
    } else {
      // Normal Sinus Rhythm (P, QRS, T)
      const pWave = 0.18 * Math.exp(-Math.pow((theta - 0.5) / 0.09, 2));
      const qWave = -0.15 * Math.exp(-Math.pow((theta - 1.15) / 0.03, 2));
      const rWave = 1.35 * Math.exp(-Math.pow((theta - 1.22) / 0.03, 2));
      const sWave = -0.35 * Math.exp(-Math.pow((theta - 1.28) / 0.04, 2));
      const tWave = 0.30 * Math.exp(-Math.pow((theta - 1.9) / 0.22, 2));
      ecg = pWave + qWave + rWave + sWave + tWave;
    }

    // 2. Arterial Blood Pressure Waveform (Windkessel with dicrotic notch)
    const pSys = this.vitals.bpSystolic;
    const pDia = this.vitals.bpDiastolic;
    let artLine = pDia;
    if (theta >= 1.2 && theta < 2.2) {
      // Rapid systolic upstroke and decline
      const sysProgress = (theta - 1.2) / 1.0;
      artLine = pDia + (pSys - pDia) * Math.sin(sysProgress * Math.PI);
    } else if (theta >= 2.2 && theta < 2.6) {
      // Dicrotic notch at aortic valve closure
      artLine = pDia + (pSys - pDia) * 0.38 + 6 * Math.sin((theta - 2.2) * 4 * Math.PI);
    } else {
      // Diastolic exponential decay
      const diaProgress = theta < 1.2 ? (theta + (2 * Math.PI - 2.6)) : (theta - 2.6);
      artLine = pDia + (pSys - pDia) * 0.35 * Math.exp(-diaProgress * 0.8);
    }

    // 3. Central Venous Pressure (a, c, v waves)
    const cvpBase = this.vitals.cvp;
    const cvp = cvpBase + 2.0 * Math.sin(theta) + 1.2 * Math.cos(theta * 2) + 0.8 * Math.sin(this.respPhase);

    // 4. Capnography (EtCO2 square wave)
    let capno = 0;
    if (this.respPhase > Math.PI && this.respPhase < 2 * Math.PI) {
      // Expiratory plateau
      capno = this.vitals.etco2 * (1 - Math.exp(-(this.respPhase - Math.PI) * 4));
    } else {
      // Inspiratory baseline (0 mmHg)
      capno = 0;
    }

    // 5. SpO2 plethysmogram (delayed arterial pulse)
    const delayedTheta = (theta - 0.4 + 2 * Math.PI) % (2 * Math.PI);
    const pleth = Math.max(0, Math.sin(delayedTheta) * 0.8 + 0.2);

    return { ecg, artLine, cvp, capno, pleth };
  }

  // Returns current 3D organ displacement/motion factors
  public getOrganKinetics() {
    return {
      heartSqueeze: Math.sin(this.cardiacPhase), // Systole vs diastole
      lungExpansion: Math.sin(this.respPhase),   // Inspiration vs expiration
      vascularPulse: Math.max(0, Math.sin(this.cardiacPhase)), // Arterial expansion
    };
  }
}
