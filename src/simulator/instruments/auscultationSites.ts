import type { AuscultationSite, HeartSoundPreset } from './StethoscopeSynthesizer';

// Surface listening areas, not the positions of the anatomical valves.
// Front view: patient's left appears on the viewer's right.
export const AUSCULTATION_SITES: { id: AuscultationSite; label: string; short: string; location: string; x: number; y: number; pulmonary: boolean }[] = [
  { id: 'aortic', label: 'Aortic', short: 'A', location: '2nd right intercostal space, right sternal border', x: 43, y: 35, pulmonary: false },
  { id: 'pulmonic', label: 'Pulmonic', short: 'P', location: '2nd left intercostal space, left sternal border', x: 57, y: 35, pulmonary: false },
  { id: 'erb', label: 'Erb’s point', short: 'E', location: '3rd left intercostal space, left sternal border', x: 57, y: 47, pulmonary: false },
  { id: 'tricuspid', label: 'Tricuspid', short: 'T', location: '4th–5th left intercostal space, lower left sternal border', x: 57, y: 59, pulmonary: false },
  { id: 'mitral', label: 'Mitral / apex', short: 'M', location: '5th left intercostal space, midclavicular line', x: 72, y: 68, pulmonary: false },
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
  { id: 'friction_rub', title: 'Pericardial friction rub', site: 'erb', mode: 'diaphragm' },
];
