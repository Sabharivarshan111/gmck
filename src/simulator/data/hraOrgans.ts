export interface HraOrganModelSpec {
  key: string;
  organKey: string;
  url: string;
  fileName: string;
}

export interface HraOrganTarget {
  id: string;
  organKey: string;
  label: string;
  shortLabel: string;
  modelKeys: readonly string[];
  kind?: 'source' | 'schematic';
  matchAll?: boolean;
  includes?: readonly string[];
  prefixes?: readonly string[];
  exact?: readonly string[];
}

export const HRA_ORGAN_MODELS: readonly HraOrganModelSpec[] = [
  { key: 'kidney_left', organKey: 'kidney', url: '/models/hra/VH_M_Kidney_L.glb', fileName: 'VH_M_Kidney_L.glb' },
  { key: 'kidney_right', organKey: 'kidney', url: '/models/hra/VH_M_Kidney_R.glb', fileName: 'VH_M_Kidney_R.glb' },
  { key: 'liver', organKey: 'liver', url: '/models/hra/VH_M_Liver.glb', fileName: 'VH_M_Liver.glb' },
  { key: 'lung', organKey: 'lungs', url: '/models/hra/VH_M_Lung.glb', fileName: 'VH_M_Lung.glb' },
  { key: 'pancreas', organKey: 'pancreas', url: '/models/hra/VH_M_Pancreas.glb', fileName: 'VH_M_Pancreas.glb' },
  { key: 'spleen', organKey: 'spleen', url: '/models/hra/VH_M_Spleen.glb', fileName: 'VH_M_Spleen.glb' },
  { key: 'small_intestine', organKey: 'small_intestine', url: '/models/hra/VH_M_Small_Intestine.glb', fileName: 'VH_M_Small_Intestine.glb' },
  { key: 'urinary_bladder', organKey: 'urinary_bladder', url: '/models/hra/VH_M_Urinary_Bladder.glb', fileName: 'VH_M_Urinary_Bladder.glb' },
  { key: 'thymus', organKey: 'thymus', url: '/models/hra/VH_M_Thymus.glb', fileName: 'VH_M_Thymus.glb' },
  { key: 'blood_vasculature', organKey: 'aorta', url: '/models/hra/VH_M_Blood_Vasculature.glb', fileName: 'VH_M_Blood_Vasculature.glb' },
] as const;

const kidneyModels = ['kidney_left', 'kidney_right'] as const;

export const HRA_ORGAN_TARGETS: readonly HraOrganTarget[] = [
  // Kidney — bilateral same-source reference.
  { id: 'hra_kidney_overview', organKey: 'kidney', label: 'Kidneys · HRA', shortLabel: 'Overview', modelKeys: kidneyModels, matchAll: true },
  { id: 'hra_kidney_capsule', organKey: 'kidney', label: 'Renal capsule · HRA', shortLabel: 'Capsule', modelKeys: kidneyModels, includes: ['kidney_capsule'] },
  { id: 'hra_kidney_cortex', organKey: 'kidney', label: 'Renal cortex · HRA', shortLabel: 'Cortex', modelKeys: kidneyModels, includes: ['outer_cortex_of_kidney'] },
  { id: 'hra_kidney_columns', organKey: 'kidney', label: 'Renal columns · HRA', shortLabel: 'Columns', modelKeys: kidneyModels, includes: ['renal_column'] },
  { id: 'hra_kidney_pyramids', organKey: 'kidney', label: 'Renal pyramids · HRA', shortLabel: 'Pyramids', modelKeys: kidneyModels, includes: ['renal_pyramid'] },
  { id: 'hra_kidney_papillae', organKey: 'kidney', label: 'Renal papillae · HRA', shortLabel: 'Papillae', modelKeys: kidneyModels, includes: ['renal_papilla'] },
  { id: 'hra_kidney_hilum', organKey: 'kidney', label: 'Renal hila · HRA', shortLabel: 'Hilum', modelKeys: kidneyModels, includes: ['hilum_of_kidney'] },

  // Liver — surfaces, segments, porta and ligaments.
  { id: 'hra_liver_overview', organKey: 'liver', label: 'Liver · HRA', shortLabel: 'Overview', modelKeys: ['liver'], matchAll: true },
  { id: 'hra_liver_segments', organKey: 'liver', label: 'Liver segments · HRA', shortLabel: 'Segments', modelKeys: ['liver'], includes: ['segment', 'caudate_lobe_of_liver', 'quadrate_lobe_of_liver'] },
  { id: 'hra_liver_porta', organKey: 'liver', label: 'Porta hepatis · HRA', shortLabel: 'Porta', modelKeys: ['liver'], includes: ['porta_hepatis'] },
  { id: 'hra_liver_caudate', organKey: 'liver', label: 'Caudate lobe · HRA', shortLabel: 'Caudate', modelKeys: ['liver'], includes: ['caudate_lobe_of_liver'] },
  { id: 'hra_liver_quadrate', organKey: 'liver', label: 'Quadrate lobe · HRA', shortLabel: 'Quadrate', modelKeys: ['liver'], includes: ['quadrate_lobe_of_liver'] },
  { id: 'hra_liver_ligaments', organKey: 'liver', label: 'Liver ligaments · HRA', shortLabel: 'Ligaments', modelKeys: ['liver'], includes: ['ligament', 'falciform', 'coronary_ligament'] },
  { id: 'hra_liver_impressions', organKey: 'liver', label: 'Visceral impressions · HRA', shortLabel: 'Impressions', modelKeys: ['liver'], includes: ['impression_of_liver'] },
  { id: 'hra_liver_bare_area', organKey: 'liver', label: 'Bare area · HRA', shortLabel: 'Bare area', modelKeys: ['liver'], includes: ['bare_area_of_liver'] },

  // Lung — HRA source-derived segmental and bronchial reference.
  { id: 'hra_lung_overview', organKey: 'lungs', label: 'Lungs · HRA', shortLabel: 'Overview', modelKeys: ['lung'], matchAll: true },
  { id: 'hra_lung_segments', organKey: 'lungs', label: 'Bronchopulmonary segments · HRA', shortLabel: 'Segments', modelKeys: ['lung'], includes: ['bronchopulmonary_segment'] },
  { id: 'hra_lung_bronchi', organKey: 'lungs', label: 'Bronchial tree · HRA', shortLabel: 'Bronchi', modelKeys: ['lung'], includes: ['bronchus', 'bronchial_cartilage'] },
  { id: 'hra_lung_trachea', organKey: 'lungs', label: 'Trachea · HRA', shortLabel: 'Trachea', modelKeys: ['lung'], includes: ['trachea', 'tracheal_cartilage'] },
  { id: 'hra_lung_carina', organKey: 'lungs', label: 'Carina · HRA', shortLabel: 'Carina', modelKeys: ['lung'], includes: ['carina'] },
  { id: 'hra_lung_hila', organKey: 'lungs', label: 'Lung hila · HRA', shortLabel: 'Hila', modelKeys: ['lung'], includes: ['hilum_'] },

  // Pancreas.
  { id: 'hra_pancreas_overview', organKey: 'pancreas', label: 'Pancreas · HRA', shortLabel: 'Overview', modelKeys: ['pancreas'], matchAll: true },
  { id: 'hra_pancreas_head', organKey: 'pancreas', label: 'Head of pancreas · HRA', shortLabel: 'Head', modelKeys: ['pancreas'], includes: ['head_of_pancreas'] },
  { id: 'hra_pancreas_neck', organKey: 'pancreas', label: 'Neck of pancreas · HRA', shortLabel: 'Neck', modelKeys: ['pancreas'], includes: ['neck_of_pancreas'] },
  { id: 'hra_pancreas_body', organKey: 'pancreas', label: 'Body of pancreas · HRA', shortLabel: 'Body', modelKeys: ['pancreas'], includes: ['body_of_pancreas'] },
  { id: 'hra_pancreas_tail', organKey: 'pancreas', label: 'Tail of pancreas · HRA', shortLabel: 'Tail', modelKeys: ['pancreas'], includes: ['tail_of_pancreas'] },
  { id: 'hra_pancreas_uncinate', organKey: 'pancreas', label: 'Uncinate process · HRA', shortLabel: 'Uncinate', modelKeys: ['pancreas'], includes: ['uncinate_process'] },

  // Spleen.
  { id: 'hra_spleen_overview', organKey: 'spleen', label: 'Spleen · HRA', shortLabel: 'Overview', modelKeys: ['spleen'], matchAll: true },
  { id: 'hra_spleen_hilum', organKey: 'spleen', label: 'Splenic hilum · HRA', shortLabel: 'Hilum', modelKeys: ['spleen'], includes: ['hilum_of_spleen'] },
  { id: 'hra_spleen_gastric_surface', organKey: 'spleen', label: 'Gastric surface · HRA', shortLabel: 'Gastric', modelKeys: ['spleen'], includes: ['gastric_surface_of_spleen'] },
  { id: 'hra_spleen_renal_surface', organKey: 'spleen', label: 'Renal surface · HRA', shortLabel: 'Renal', modelKeys: ['spleen'], includes: ['renal_surface_of_spleen'] },
  { id: 'hra_spleen_colic_surface', organKey: 'spleen', label: 'Colic surface · HRA', shortLabel: 'Colic', modelKeys: ['spleen'], includes: ['colic_surface_of_spleen'] },
  { id: 'hra_spleen_diaphragmatic_surface', organKey: 'spleen', label: 'Diaphragmatic surface · HRA', shortLabel: 'Diaphragm', modelKeys: ['spleen'], includes: ['diaphragmatic_surface_of_spleen'] },

  // Small intestine / duodenum.
  { id: 'hra_small_intestine_overview', organKey: 'small_intestine', label: 'Small intestine · HRA', shortLabel: 'Small bowel', modelKeys: ['small_intestine'], matchAll: true },
  { id: 'hra_duodenum', organKey: 'small_intestine', label: 'Duodenum · HRA', shortLabel: 'Duodenum', modelKeys: ['small_intestine'], includes: ['duodenum_', 'duodenal_'] },
  { id: 'hra_jejunum', organKey: 'small_intestine', label: 'Jejunum · HRA', shortLabel: 'Jejunum', modelKeys: ['small_intestine'], includes: ['jejunum'] },
  { id: 'hra_ileum', organKey: 'small_intestine', label: 'Ileum · HRA', shortLabel: 'Ileum', modelKeys: ['small_intestine'], includes: ['ileum'] },
  { id: 'hra_terminal_ileum', organKey: 'small_intestine', label: 'Terminal ileum · HRA', shortLabel: 'Terminal ileum', modelKeys: ['small_intestine'], includes: ['ileum_terminal'] },
  { id: 'hra_hepatopancreatic_sphincter', organKey: 'small_intestine', label: 'Hepatopancreatic sphincter · HRA', shortLabel: 'Oddi', modelKeys: ['small_intestine'], includes: ['sphincter_of_hepatopancreatic_ampulla'] },

  // Urinary bladder.
  { id: 'hra_bladder_overview', organKey: 'urinary_bladder', label: 'Urinary bladder · HRA', shortLabel: 'Bladder', modelKeys: ['urinary_bladder'], matchAll: true },
  { id: 'hra_bladder_trigone', organKey: 'urinary_bladder', label: 'Bladder trigone · HRA', shortLabel: 'Trigone', modelKeys: ['urinary_bladder'], includes: ['trigone_of_urinary_bladder'] },
  { id: 'hra_bladder_orifices', organKey: 'urinary_bladder', label: 'Ureteric orifices · HRA', shortLabel: 'Ureteric orifices', modelKeys: ['urinary_bladder'], includes: ['ureteral_orifice'] },
  { id: 'hra_bladder_neck', organKey: 'urinary_bladder', label: 'Bladder neck · HRA', shortLabel: 'Neck', modelKeys: ['urinary_bladder'], includes: ['urinary_bladder_neck'] },
  { id: 'hra_bladder_dome', organKey: 'urinary_bladder', label: 'Bladder dome · HRA', shortLabel: 'Dome', modelKeys: ['urinary_bladder'], includes: ['fundus_of_urinary_bladder_dome'] },

  // Thymus.
  { id: 'hra_thymus_overview', organKey: 'thymus', label: 'Thymus · HRA', shortLabel: 'Thymus', modelKeys: ['thymus'], matchAll: true },
  { id: 'hra_thymus_left', organKey: 'thymus', label: 'Left thymic lobe · HRA', shortLabel: 'Thymus L', modelKeys: ['thymus'], includes: ['thymus_lobe_L'] },
  { id: 'hra_thymus_right', organKey: 'thymus', label: 'Right thymic lobe · HRA', shortLabel: 'Thymus R', modelKeys: ['thymus'], includes: ['thymus_lobe_R'] },

  // Blood vasculature reference.
  { id: 'hra_vessels_overview', organKey: 'aorta', label: 'Major vasculature · HRA', shortLabel: 'Vessels', modelKeys: ['blood_vasculature'], matchAll: true },
  { id: 'hra_aorta', organKey: 'aorta', label: 'Aorta · HRA', shortLabel: 'Aorta', modelKeys: ['blood_vasculature'], includes: ['aorta'] },
  { id: 'hra_coronary_arteries', organKey: 'aorta', label: 'Coronary arteries · HRA', shortLabel: 'Coronaries', modelKeys: ['blood_vasculature'], includes: ['coronary_artery', 'anterior_descending_artery', 'posterior_descending_artery', 'right_marginal_artery', 'left_marginal_branch'] },
  { id: 'hra_cardiac_veins', organKey: 'aorta', label: 'Cardiac veins · HRA', shortLabel: 'Cardiac veins', modelKeys: ['blood_vasculature'], includes: ['cardiac_vein', 'coronary_sinus', 'vein_of_left_'] },
  { id: 'hra_portal_vein', organKey: 'portal_vein', label: 'Portal venous system · HRA', shortLabel: 'Portal', modelKeys: ['blood_vasculature'], includes: ['portal_vein'] },
  { id: 'hra_celiac_trunk', organKey: 'celiac_trunk', label: 'Celiac trunk · HRA', shortLabel: 'Celiac', modelKeys: ['blood_vasculature'], includes: ['celiac_trunk'] },
  { id: 'hra_hepatic_vessels', organKey: 'liver', label: 'Hepatic vessels · HRA', shortLabel: 'Hepatic vessels', modelKeys: ['blood_vasculature'], includes: ['hepatic_artery', 'hepatic_vein', 'portal_vein'] },
  { id: 'hra_splenic_vessels', organKey: 'spleen', label: 'Splenic vessels · HRA', shortLabel: 'Splenic vessels', modelKeys: ['blood_vasculature'], includes: ['splenic_artery', 'splenic_vein'] },
  { id: 'hra_renal_vessels', organKey: 'kidney', label: 'Renal vessels · HRA', shortLabel: 'Renal vessels', modelKeys: ['blood_vasculature'], includes: ['renal_artery', 'renal_vein'] },
  { id: 'hra_mesenteric_vessels', organKey: 'abdomen', label: 'Mesenteric vessels · HRA', shortLabel: 'Mesenteric', modelKeys: ['blood_vasculature'], includes: ['mesenteric_artery', 'mesenteric_vein', 'colic_artery', 'colic_vein', 'ileocolic'] },
  { id: 'hra_pulmonary_vessels', organKey: 'lungs', label: 'Pulmonary vessels · HRA', shortLabel: 'Pulm vessels', modelKeys: ['blood_vasculature'], includes: ['pulmonary_artery', 'pulmonary_vein', 'pulmonary_trunk'] },
] as const;

const modelByKey = new Map(HRA_ORGAN_MODELS.map((model) => [model.key, model]));
const targetById = new Map(HRA_ORGAN_TARGETS.map((target) => [target.id, target]));

export function isHraOrganTarget(targetId: string | null | undefined): boolean {
  return !!targetId && targetById.has(targetId);
}

export function getHraOrganTarget(targetId: string | null | undefined): HraOrganTarget | null {
  if (!targetId) return null;
  return targetById.get(targetId) ?? null;
}

export function getHraOrganModel(modelKey: string): HraOrganModelSpec | null {
  return modelByKey.get(modelKey) ?? null;
}

export function getHraTargetsForOrgan(organKey: string | null | undefined): readonly HraOrganTarget[] {
  if (!organKey) return [];
  return HRA_ORGAN_TARGETS.filter((target) => target.organKey === organKey);
}

export function hraOrganMeshMatchesTarget(meshName: string, targetId: string | null | undefined): boolean {
  const target = getHraOrganTarget(targetId);
  if (!target) return false;
  if (target.matchAll) return true;

  const normalized = meshName.toLowerCase();
  if (target.exact?.some((name) => meshName === name)) return true;
  if (target.prefixes?.some((prefix) => meshName.startsWith(prefix))) return true;
  if (target.includes?.some((piece) => normalized.includes(piece.toLowerCase()))) return true;
  return false;
}
