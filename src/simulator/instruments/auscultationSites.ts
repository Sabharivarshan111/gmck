import type { AuscultationSite, HeartSoundPreset } from './StethoscopeSynthesizer';

// Surface listening areas, not the positions of the anatomical valves.
// Front view: patient's left appears on the viewer's right.
export const AUSCULTATION_SITES: { id: AuscultationSite; label: string; short: string; location: string; x: number; y: number; pulmonary: boolean }[] = [
  { id: 'aortic', label: 'Aortic', short: 'A', location: '2nd right intercostal space, right sternal border', x: 43, y: 30, pulmonary: false },
  { id: 'pulmonic', label: 'Pulmonic', short: 'P', location: '2nd left intercostal space, left sternal border', x: 57, y: 30, pulmonary: false },
  { id: 'erb', label: 'Erb’s point', short: 'E', location: '3rd left intercostal space, left sternal border', x: 57, y: 42, pulmonary: false },
  { id: 'tricuspid', label: 'Tricuspid', short: 'T', location: '4th–5th left intercostal space, lower left sternal border', x: 57, y: 54, pulmonary: false },
  { id: 'mitral', label: 'Mitral / apex', short: 'M', location: '5th left intercostal space, midclavicular line', x: 72, y: 63, pulmonary: false },
  { id: 'trachea', label: 'Trachea', short: 'Tr', location: 'Anterior neck over the trachea', x: 50, y: 15, pulmonary: true },
  { id: 'lung_apices', label: 'Lung apices', short: 'Ap', location: 'Upper lung fields; compare both sides', x: 29, y: 34, pulmonary: true },
  { id: 'lung_bases', label: 'Lung bases', short: 'Ba', location: 'Posterior lower lung fields; compare both sides', x: 29, y: 72, pulmonary: true },
];
export const SOUND_LIBRARY: { id: HeartSoundPreset; title: string; site: AuscultationSite; mode: 'bell' | 'diaphragm' }[] = [
  { id: 'normal', title: 'Normal S1 / S2', site: 'mitral', mode: 'diaphragm' },
  { id: 's3_gallop', title: 'S3 gallop', site: 'mitral', mode: 'bell' },
  { id: 's4_gallop', title: 'S4 gallop', site: 'mitral', mode: 'bell' },
  { id: 'mitral_stenosis', title: 'Mitral stenosis', site: 'mitral', mode: 'bell' },
  { id: 'aortic_stenosis', title: 'Aortic stenosis', site: 'aortic', mode: 'diaphragm' },
  { id: 'mitral_regurg', title: 'Mitral regurgitation', site: 'mitral', mode: 'diaphragm' },
  { id: 'tricuspid_regurg', title: 'Tricuspid regurgitation', site: 'tricuspid', mode: 'diaphragm' },
  { id: 'aortic_regurg', title: 'Aortic regurgitation', site: 'erb', mode: 'diaphragm' },
  { id: 'pulmonic_stenosis', title: 'Pulmonic stenosis', site: 'pulmonic', mode: 'diaphragm' },
  { id: 'vsd', title: 'Ventricular septal defect (VSD)', site: 'tricuspid', mode: 'diaphragm' },
  { id: 'hcm', title: 'Hypertrophic obstructive cardiomyopathy (HCM)', site: 'tricuspid', mode: 'diaphragm' },
  { id: 'pda', title: 'Patent ductus arteriosus (PDA)', site: 'pulmonic', mode: 'diaphragm' },
  { id: 'friction_rub', title: 'Pericardial friction rub', site: 'erb', mode: 'diaphragm' },
];

/** Short recognition cues; radiation and maneuvers are described, not simulated. */
export const MURMUR_GUIDE: Partial<Record<HeartSoundPreset,{timing:string;shape:string;tip:string}>> = {
 aortic_stenosis:{timing:'Systolic ejection',shape:'Crescendo–decrescendo',tip:'Aortic area; may radiate to the carotids.'},
 pulmonic_stenosis:{timing:'Systolic ejection',shape:'Crescendo–decrescendo',tip:'Pulmonic area; may radiate toward the left shoulder/back.'},
 mitral_regurg:{timing:'Holosystolic',shape:'Blowing plateau',tip:'Apex; often radiates to the axilla.'},
 tricuspid_regurg:{timing:'Holosystolic',shape:'Blowing plateau',tip:'Lower left sternal border; generally louder with inspiration.'},
 vsd:{timing:'Holosystolic',shape:'Harsh plateau',tip:'Lower left sternal border; intensity does not measure defect severity.'},
 hcm:{timing:'Systolic ejection',shape:'Crescendo–decrescendo',tip:'Left sternal border/apex; may become louder with standing or Valsalva.'},
 mitral_stenosis:{timing:'Mid/late diastolic',shape:'Low-pitched rumble',tip:'Bell at the apex, left lateral position. Presystolic accentuation requires atrial contraction.'},
 aortic_regurg:{timing:'Early diastolic',shape:'Decrescendo',tip:'Left sternal border; lean forward at end-expiration.'},
 pda:{timing:'Continuous',shape:'Systolic and diastolic flow',tip:'Left infraclavicular/upper sternal region; often peaks near S2.'},
};
