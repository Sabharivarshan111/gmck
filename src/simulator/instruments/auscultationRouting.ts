import type { PatientPathologyState, PatientVitals } from '../types';
import type { AuscultationSite, HeartSoundPreset, LungSoundPreset } from './StethoscopeSynthesizer';

// Case findings, not diagnoses inferred from nonspecific shock/hypoxia signs.
export function resolveAuscultation(pathology: PatientPathologyState, vitals: PatientVitals, site: AuscultationSite, scenarioId = '', override: HeartSoundPreset | null = null) {
  const pulmonary = site === 'lung_bases' || site === 'lung_apices' || site === 'trachea';
  const heart: HeartSoundPreset = override || (vitals.heartRate <= 0 || pathology.ecgRhythm === 'vfib' ? 'silent' : scenarioId === 'tamponade' && vitals.cvp > 12
    ? 'tamponade_muffled'
    : pathology.heartSoundType === 'murmur_systolic' ? 'aortic_stenosis' : pathology.heartSoundType);
  const lung: LungSoundPreset = vitals.respiratoryRate <= 0 ? 'silent' : site === 'trachea'
    ? ['anaphylaxis', 'peds_foreign_body', 'pediatric_epiglottitis'].includes(scenarioId) ? 'stridor' : 'bronchial'
    : pathology.lungSoundType;
  return { pulmonary, heart, lung, atrialContraction: !!override || (scenarioId !== 'ms_afib' && !pathology.ecgRhythm.includes('afib')) };
}

export const HEART_SOUND_DESCRIPTIONS: Record<HeartSoundPreset, string> = {
  silent: 'No organized heart sounds in the modeled cardiac arrest.',
  normal: 'S1 and S2 closure sounds.',
  s3_gallop: 'Low-pitched S3 shortly after S2 in early diastole.',
  s4_gallop: 'Low-pitched S4 just before S1 in late diastole; requires organized atrial contraction.',
  mitral_stenosis: 'Loud S1, opening snap after S2 and a low-pitched diastolic rumble. Presystolic accentuation is absent during atrial fibrillation.',
  aortic_stenosis: 'Systolic crescendo–decrescendo ejection murmur between S1 and S2.',
  mitral_regurg: 'Blowing holosystolic murmur from S1 to S2.',
  aortic_regurg: 'Early diastolic decrescendo murmur beginning at S2.',
  friction_rub: 'Superficial pericardial friction sound with systolic and diastolic components.',
  tamponade_muffled: 'Attenuated heart sounds in the modeled tamponade case.',
};
export const LUNG_SOUND_DESCRIPTIONS: Record<LungSoundPreset, string> = {
  vesicular: 'Soft vesicular airflow; inspiration is louder and longer than audible expiration.',
  bronchial: 'Tubular bronchial airflow with a pause and prominent expiration. Expected over the trachea; abnormal over peripheral lung fields.',
  crackles: 'Short discontinuous end-inspiratory crackles.',
  wheeze: 'Musical polyphonic expiratory wheeze.',
  stridor: 'Harsh inspiratory upper-airway sound in the modeled upper-airway obstruction case.',
  silent: 'Absent breath sounds at this modeled site. Interpret alongside the case and examination.',
};
