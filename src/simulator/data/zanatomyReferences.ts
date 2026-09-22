export interface ZAnatomyReferenceModel {
  key: string;
  organKey: string;
  url: string;
  manifestUrl: string;
}

export interface ZAnatomyReferenceTarget {
  id: string;
  organKey: string;
  label: string;
  shortLabel: string;
  modelKey: string;
  matchAll?: boolean;
  exact?: readonly string[];
  includes?: readonly string[];
}

export const ZANATOMY_REFERENCE_MODELS: readonly ZAnatomyReferenceModel[] = [
  {
    key: 'brain_reference',
    organKey: 'brain',
    url: '/models/zanatomy/brain_reference.glb',
    manifestUrl: '/models/zanatomy/brain_reference.manifest.json',
  },
  {
    key: 'stomach_reference',
    organKey: 'stomach',
    url: '/models/zanatomy/stomach_reference.glb',
    manifestUrl: '/models/zanatomy/stomach_reference.manifest.json',
  },
  {
    key: 'pectoralis_major_reference',
    organKey: 'pectoralis_major',
    url: '/models/zanatomy/pectoralis_major_reference.glb',
    manifestUrl: '/models/zanatomy/pectoralis_major_reference.manifest.json',
  },
  {
    key: 'deltoid_reference',
    organKey: 'deltoid',
    url: '/models/zanatomy/deltoid_reference.glb',
    manifestUrl: '/models/zanatomy/deltoid_reference.manifest.json',
  },
  {
    key: 'major_joints_reference',
    organKey: 'skeletal',
    url: '/models/zanatomy/major_joints_reference.glb',
    manifestUrl: '/models/zanatomy/major_joints_reference.manifest.json',
  },
] as const;

export const ZANATOMY_REFERENCE_TARGETS: readonly ZAnatomyReferenceTarget[] = [
  // Brain / CNS
  { id: 'za_brain_overview', organKey: 'brain', label: 'Brain reference · Z-Anatomy', shortLabel: 'Overview', modelKey: 'brain_reference', matchAll: true },
  { id: 'za_brain_cortex', organKey: 'brain', label: 'Cortical gyri · Z-Anatomy', shortLabel: 'Cortex', modelKey: 'brain_reference', includes: ['gyrus', 'insula'] },
  { id: 'za_brain_basal_ganglia', organKey: 'brain', label: 'Basal ganglia · Z-Anatomy', shortLabel: 'Basal ganglia', modelKey: 'brain_reference', includes: ['caudate nucleus', 'putamen', 'globus pallidus'] },
  { id: 'za_brain_limbic', organKey: 'brain', label: 'Hippocampus & amygdala · Z-Anatomy', shortLabel: 'Limbic', modelKey: 'brain_reference', includes: ['hippocampus', 'amygdaloid body'] },
  { id: 'za_brain_diencephalon', organKey: 'brain', label: 'Thalamus & hypothalamus · Z-Anatomy', shortLabel: 'Diencephalon', modelKey: 'brain_reference', includes: ['thalamus', 'hypothalamus'] },
  { id: 'za_brain_brainstem', organKey: 'brain', label: 'Brainstem · Z-Anatomy', shortLabel: 'Brainstem', modelKey: 'brain_reference', includes: ['pons.', 'medulla oblongata.', 'midbrain.'] },
  { id: 'za_brain_ventricles', organKey: 'brain', label: 'Ventricular system · Z-Anatomy', shortLabel: 'Ventricles', modelKey: 'brain_reference', includes: ['ventricle', 'aqueduct of midbrain'] },
  { id: 'za_brain_cerebellar', organKey: 'brain', label: 'Cerebellar structures · Z-Anatomy', shortLabel: 'Cerebellar', modelKey: 'brain_reference', includes: ['cerebellar', 'tonsil of cerebellum', 'lingula of cerebellum'] },
  { id: 'za_brain_corpus_callosum', organKey: 'brain', label: 'Corpus callosum · Z-Anatomy', shortLabel: 'Corpus callosum', modelKey: 'brain_reference', exact: ['Corpus callosum'] },

  // Stomach / proximal GI context
  { id: 'za_stomach_overview', organKey: 'stomach', label: 'Stomach & proximal GI · Z-Anatomy', shortLabel: 'Overview', modelKey: 'stomach_reference', matchAll: true },
  { id: 'za_stomach', organKey: 'stomach', label: 'Stomach · Z-Anatomy', shortLabel: 'Stomach', modelKey: 'stomach_reference', exact: ['Stomach'] },
  { id: 'za_stomach_duodenum', organKey: 'stomach', label: 'Duodenum · Z-Anatomy', shortLabel: 'Duodenum', modelKey: 'stomach_reference', exact: ['Duodenum'] },
  { id: 'za_stomach_greater_omentum', organKey: 'stomach', label: 'Greater omentum · Z-Anatomy', shortLabel: 'Greater omentum', modelKey: 'stomach_reference', exact: ['Greater omentum'] },
  { id: 'za_stomach_lesser_omentum', organKey: 'stomach', label: 'Lesser omentum · Z-Anatomy', shortLabel: 'Lesser omentum', modelKey: 'stomach_reference', exact: ['Lesser omentum'] },

  // Pectoralis major
  { id: 'za_pectoralis_overview', organKey: 'pectoralis_major', label: 'Pectoralis major · Z-Anatomy', shortLabel: 'Overview', modelKey: 'pectoralis_major_reference', matchAll: true },
  { id: 'za_pectoralis_clavicular', organKey: 'pectoralis_major', label: 'Clavicular head · Z-Anatomy', shortLabel: 'Clavicular', modelKey: 'pectoralis_major_reference', includes: ['clavicular head of pectoralis major muscle'] },
  { id: 'za_pectoralis_sternocostal', organKey: 'pectoralis_major', label: 'Sternocostal head · Z-Anatomy', shortLabel: 'Sternocostal', modelKey: 'pectoralis_major_reference', includes: ['sternocostal head of pectoralis major muscle'] },
  { id: 'za_pectoralis_abdominal', organKey: 'pectoralis_major', label: 'Abdominal part · Z-Anatomy', shortLabel: 'Abdominal', modelKey: 'pectoralis_major_reference', includes: ['abdominal part of pectoralis major muscle'] },

  // Deltoid
  { id: 'za_deltoid_overview', organKey: 'deltoid', label: 'Deltoid · Z-Anatomy', shortLabel: 'Overview', modelKey: 'deltoid_reference', matchAll: true },
  { id: 'za_deltoid_clavicular', organKey: 'deltoid', label: 'Clavicular part · Z-Anatomy', shortLabel: 'Clavicular', modelKey: 'deltoid_reference', includes: ['clavicular part of deltoid muscle'] },
  { id: 'za_deltoid_acromial', organKey: 'deltoid', label: 'Acromial part · Z-Anatomy', shortLabel: 'Acromial', modelKey: 'deltoid_reference', includes: ['acromial part of deltoid muscle'] },
  { id: 'za_deltoid_spinal', organKey: 'deltoid', label: 'Spinal part · Z-Anatomy', shortLabel: 'Spinal', modelKey: 'deltoid_reference', includes: ['scapular spinal part of deltoid muscle'] },

  // Major joints — source-derived reference structures.
  { id: 'za_joints_overview', organKey: 'skeletal', label: 'Major joints · Z-Anatomy', shortLabel: 'Joints', modelKey: 'major_joints_reference', matchAll: true },
  { id: 'za_knee_joint', organKey: 'skeletal', label: 'Knee ligaments & menisci · Z-Anatomy', shortLabel: 'Knee', modelKey: 'major_joints_reference', includes: ['cruciate ligament', 'meniscus', 'capsule of knee joint'] },
  { id: 'za_hip_joint', organKey: 'skeletal', label: 'Hip capsule & labrum · Z-Anatomy', shortLabel: 'Hip', modelKey: 'major_joints_reference', includes: ['acetabular labrum', 'capsule of hip joint'] },
  { id: 'za_shoulder_joint', organKey: 'skeletal', label: 'Glenohumeral capsule & ligaments · Z-Anatomy', shortLabel: 'Shoulder', modelKey: 'major_joints_reference', includes: ['glenohumeral'] },
] as const;

const modelByKey = new Map(ZANATOMY_REFERENCE_MODELS.map((m) => [m.key, m]));
const targetById = new Map(ZANATOMY_REFERENCE_TARGETS.map((t) => [t.id, t]));

export function isZAnatomyReferenceTarget(id: string | null | undefined): boolean {
  return !!id && targetById.has(id);
}

export function getZAnatomyReferenceTarget(id: string | null | undefined): ZAnatomyReferenceTarget | null {
  if (!id) return null;
  return targetById.get(id) ?? null;
}

export function getZAnatomyReferenceModel(key: string): ZAnatomyReferenceModel | null {
  return modelByKey.get(key) ?? null;
}

export function getZAnatomyTargetsForOrgan(organKey: string | null | undefined): readonly ZAnatomyReferenceTarget[] {
  if (!organKey) return [];
  return ZANATOMY_REFERENCE_TARGETS.filter((target) => target.organKey === organKey);
}

export function zAnatomyMeshMatchesTarget(meshName: string, id: string | null | undefined): boolean {
  const target = getZAnatomyReferenceTarget(id);
  if (!target) return false;
  if (target.matchAll) return true;

  const lower = meshName.toLowerCase();
  if (target.exact?.some((name) => meshName === name)) return true;
  if (target.includes?.some((piece) => lower.includes(piece.toLowerCase()))) return true;
  return false;
}
