export const HRA_HEART_MODEL_URL = '/models/hra_heart_male_v1.3.glb';

export interface HraHeartTarget {
  id: string;
  label: string;
  shortLabel: string;
  sourceNames?: readonly string[];
  sourcePrefix?: string;
}

export const HRA_HEART_TARGETS: readonly HraHeartTarget[] = [
  {
    id: 'hra_heart_overview',
    label: 'HRA heart overview',
    shortLabel: 'Overview',
  },
  {
    id: 'hra_right_atrium',
    label: 'Right atrium · HRA',
    shortLabel: 'RA',
    sourceNames: ['VH_M_right_cardiac_atrium'],
  },
  {
    id: 'hra_left_atrium',
    label: 'Left atrium · HRA',
    shortLabel: 'LA',
    sourceNames: ['VH_M_left_cardiac_atrium'],
  },
  {
    id: 'hra_right_ventricle',
    label: 'Right ventricle · HRA',
    shortLabel: 'RV',
    sourceNames: ['VH_M_heart_right_ventricle'],
  },
  {
    id: 'hra_left_ventricle',
    label: 'Left ventricle · HRA',
    shortLabel: 'LV',
    sourceNames: ['VH_M_heart_left_ventricle'],
  },
  {
    id: 'hra_interventricular_septum',
    label: 'Interventricular septum · HRA',
    shortLabel: 'IV septum',
    sourceNames: ['VH_M_interventricular_septum'],
  },
  {
    id: 'hra_mitral_valve',
    label: 'Mitral valve · HRA',
    shortLabel: 'Mitral',
    sourceNames: ['VH_M_mitral_valve'],
  },
  {
    id: 'hra_tricuspid_valve',
    label: 'Tricuspid valve · HRA',
    shortLabel: 'Tricuspid',
    sourceNames: ['VH_M_tricuspid_valve'],
  },
  {
    id: 'hra_aortic_valve',
    label: 'Aortic valve · HRA',
    shortLabel: 'Aortic',
    sourceNames: ['VH_M_aortic_valve'],
  },
  {
    id: 'hra_pulmonary_valve',
    label: 'Pulmonary valve · HRA',
    shortLabel: 'Pulmonary',
    sourceNames: ['VH_M_pulmonary_valve'],
  },
  {
    id: 'hra_papillary_muscles',
    label: 'Papillary muscles · HRA',
    shortLabel: 'Papillary',
    sourcePrefix: 'VH_M_papillary_muscle_of_heart_',
  },
] as const;

const HRA_TARGET_BY_ID = new Map(HRA_HEART_TARGETS.map((target) => [target.id, target]));

export function isHraHeartTarget(targetId: string | null | undefined): boolean {
  return !!targetId && HRA_TARGET_BY_ID.has(targetId);
}

export function getHraHeartTarget(targetId: string | null | undefined): HraHeartTarget | null {
  if (!targetId) return null;
  return HRA_TARGET_BY_ID.get(targetId) ?? null;
}

export function hraHeartMeshMatchesTarget(meshName: string, targetId: string | null | undefined): boolean {
  const target = getHraHeartTarget(targetId);
  if (!target) return false;
  if (target.id === 'hra_heart_overview') return true;

  if (target.sourceNames?.includes(meshName)) return true;
  if (target.sourcePrefix && meshName.startsWith(target.sourcePrefix)) return true;
  return false;
}

export const HRA_HEART_REQUIRED_MESH_NAMES = [
  'VH_M_mitral_valve',
  'VH_M_tricuspid_valve',
  'VH_M_aortic_valve',
  'VH_M_pulmonary_valve',
  'VH_M_papillary_muscle_of_heart_anterior',
  'VH_M_papillary_muscle_of_heart_anterolateral',
  'VH_M_papillary_muscle_of_heart_medial',
  'VH_M_papillary_muscle_of_heart_posterior',
  'VH_M_papillary_muscle_of_heart_posteromedial',
  'VH_M_left_cardiac_atrium',
  'VH_M_right_cardiac_atrium',
  'VH_M_heart_right_ventricle',
  'VH_M_interventricular_septum',
  'VH_M_heart_left_ventricle',
] as const;
