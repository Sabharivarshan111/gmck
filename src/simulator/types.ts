export type AnatomicalLayer = 'skin' | 'glass' | 'vascular' | 'viscera' | 'skeletal';

export type DiagnosticToolType = 'none' | 'pupil' | 'ultrasound' | 'stethoscope' | 'ecg12' | 'piccled';

export interface PatientVitals {
  heartRate: number;        // bpm (normal 60-100)
  bpSystolic: number;       // mmHg (normal 90-120)
  bpDiastolic: number;      // mmHg (normal 60-80)
  meanArterialPressure: number; // mmHg (MAP = DBP + 1/3 PP)
  spo2: number;             // % (normal 95-100)
  respiratoryRate: number;  // breaths/min (normal 12-20)
  temperature: number;      // °C (normal 36.5 - 37.5)
  cvp: number;              // mmHg (normal 2-6)
  etco2: number;            // mmHg (normal 35-45)
  lactate: number;          // mmol/L (normal 0.5 - 1.5)
  gcs: number;              // 3 - 15
}

export interface PatientPathologyState {
  cyanosis: number;         // 0.0 to 1.0 (hypoxemia)
  pallor: number;           // 0.0 to 1.0 (shock / blood loss)
  jaundice: number;         // 0.0 to 1.0 (hyperbilirubinemia)
  diaphoresis: number;      // 0.0 to 1.0 (cold clammy sweat)
  ascites: number;          // 0.0 to 1.0 (peritoneal fluid distension)
  myocardialIschemia: number; // 0.0 to 1.0 (LAD / inferior wall hypokinesia)
  pupilLeft: number;        // diameter in mm (normal ~3.5mm)
  pupilRight: number;       // diameter in mm (normal ~3.5mm)
  pupilReactLeft: boolean;  // light reactive
  pupilReactRight: boolean; // light reactive
  heartSoundType: 'normal' | 's3_gallop' | 'mitral_stenosis' | 'mitral_regurg' | 'aortic_stenosis';
  lungSoundType: 'vesicular' | 'crackles' | 'wheeze' | 'bronchial' | 'silent';
  ecgRhythm: 'sinus' | 'stemi_inferior' | 'stemi_anterior' | 'afib' | 'vtach' | 'vfib' | 'asystole' | 'hyperkalemia';
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  chiefComplaint: string;
  history: string;
  targetInterventions: string[];
  lethalTriggers: string[];
  initialVitals: PatientVitals;
  initialPathology: PatientPathologyState;
}

export interface ClinicalAction {
  id: string;
  label: string;
  category: 'drug' | 'airway' | 'fluid' | 'procedure';
  description: string;
  dosage?: string;
}

export interface TelemetryWaveformSample {
  ecg: number;       // mV
  artLine: number;   // mmHg
  cvp: number;       // mmHg
  capno: number;     // mmHg
  pleth: number;     // normalized 0-1
}
