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
  { key: 'eye_left', organKey: 'eye', url: '/models/hra/VH_M_Eye_L.glb', fileName: 'VH_M_Eye_L.glb' },
  { key: 'eye_right', organKey: 'eye', url: '/models/hra/VH_M_Eye_R.glb', fileName: 'VH_M_Eye_R.glb' },
  { key: 'ureter_left', organKey: 'ureter', url: '/models/hra/VH_M_Ureter_L.glb', fileName: 'VH_M_Ureter_L.glb' },
  { key: 'ureter_right', organKey: 'ureter', url: '/models/hra/VH_M_Ureter_R.glb', fileName: 'VH_M_Ureter_R.glb' },
  { key: 'spinal_cord', organKey: 'spinal_cord', url: '/models/hra/VH_M_Spinal_Cord.glb', fileName: 'VH_M_Spinal_Cord.glb' },
  { key: 'pelvis_male', organKey: 'pelvis', url: '/models/hra/VH_M_Pelvis.glb', fileName: 'VH_M_Pelvis.glb' },
  { key: 'prostate', organKey: 'prostate', url: '/models/hra/VH_M_Prostate.glb', fileName: 'VH_M_Prostate.glb' },
  { key: 'skin', organKey: 'skin', url: '/models/hra/VH_M_Skin.glb', fileName: 'VH_M_Skin.glb' },
  { key: 'knee_left', organKey: 'knee', url: '/models/hra/VH_M_Knee_L.glb', fileName: 'VH_M_Knee_L.glb' },
  { key: 'knee_right', organKey: 'knee', url: '/models/hra/VH_M_Knee_R.glb', fileName: 'VH_M_Knee_R.glb' },
  { key: 'uterus', organKey: 'uterus', url: '/models/hra/VH_F_Uterus.glb', fileName: 'VH_F_Uterus.glb' },
  { key: 'ovary_left', organKey: 'ovary', url: '/models/hra/VH_F_Ovary_L.glb', fileName: 'VH_F_Ovary_L.glb' },
  { key: 'ovary_right', organKey: 'ovary', url: '/models/hra/VH_F_Ovary_R.glb', fileName: 'VH_F_Ovary_R.glb' },
  { key: 'fallopian_tube_left', organKey: 'fallopian_tube', url: '/models/hra/VH_F_Fallopian_Tube_L.glb', fileName: 'VH_F_Fallopian_Tube_L.glb' },
  { key: 'fallopian_tube_right', organKey: 'fallopian_tube', url: '/models/hra/VH_F_Fallopian_Tube_R.glb', fileName: 'VH_F_Fallopian_Tube_R.glb' },
  { key: 'placenta', organKey: 'placenta', url: '/models/hra/VH_F_Placenta.glb', fileName: 'VH_F_Placenta.glb' },
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

  // Eye — bilateral detailed HRA reference.
  { id: 'hra_eye_overview', organKey: 'eye', label: 'Eyes · HRA', shortLabel: 'Overview', modelKeys: ['eye_left','eye_right'], matchAll: true },
  { id: 'hra_eye_cornea', organKey: 'eye', label: 'Cornea · HRA', shortLabel: 'Cornea', modelKeys: ['eye_left','eye_right'], includes: ['cornea_'] },
  { id: 'hra_eye_lens', organKey: 'eye', label: 'Lens · HRA', shortLabel: 'Lens', modelKeys: ['eye_left','eye_right'], includes: ['lens_'] },
  { id: 'hra_eye_retina', organKey: 'eye', label: 'Retina · HRA', shortLabel: 'Retina', modelKeys: ['eye_left','eye_right'], includes: ['retina_'] },
  { id: 'hra_eye_iris', organKey: 'eye', label: 'Iris · HRA', shortLabel: 'Iris', modelKeys: ['eye_left','eye_right'], includes: ['iris_'] },
  { id: 'hra_eye_sclera', organKey: 'eye', label: 'Sclera · HRA', shortLabel: 'Sclera', modelKeys: ['eye_left','eye_right'], includes: ['sclera_'] },
  { id: 'hra_eye_ciliary', organKey: 'eye', label: 'Ciliary body/muscle · HRA', shortLabel: 'Ciliary', modelKeys: ['eye_left','eye_right'], includes: ['ciliary_body','ciliary_muscle','ciliary_processes'] },
  { id: 'hra_eye_fovea', organKey: 'eye', label: 'Fovea · HRA', shortLabel: 'Fovea', modelKeys: ['eye_left','eye_right'], includes: ['fovea_'] },
  { id: 'hra_eye_humors', organKey: 'eye', label: 'Aqueous/vitreous humors · HRA', shortLabel: 'Humors', modelKeys: ['eye_left','eye_right'], includes: ['aqueous_humor','vitreous_humor'] },

  // Ureter and renal collecting system.
  { id: 'hra_ureter_overview', organKey: 'ureter', label: 'Ureters & collecting systems · HRA', shortLabel: 'Overview', modelKeys: ['ureter_left','ureter_right'], matchAll: true },
  { id: 'hra_ureter', organKey: 'ureter', label: 'Ureters · HRA', shortLabel: 'Ureter', modelKeys: ['ureter_left','ureter_right'], includes: ['ureter_'] },
  { id: 'hra_renal_pelvis', organKey: 'ureter', label: 'Renal pelvis · HRA', shortLabel: 'Renal pelvis', modelKeys: ['ureter_left','ureter_right'], includes: ['renal_pelvis'] },
  { id: 'hra_major_calyces', organKey: 'ureter', label: 'Major calyces · HRA', shortLabel: 'Major calyces', modelKeys: ['ureter_left','ureter_right'], includes: ['major_calyx'] },
  { id: 'hra_minor_calyces', organKey: 'ureter', label: 'Minor calyces · HRA', shortLabel: 'Minor calyces', modelKeys: ['ureter_left','ureter_right'], includes: ['minor_calyx'] },

  // Spinal cord.
  { id: 'hra_spinal_cord_overview', organKey: 'spinal_cord', label: 'Spinal cord · HRA', shortLabel: 'Overview', modelKeys: ['spinal_cord'], matchAll: true },
  { id: 'hra_spinal_cord_cervical', organKey: 'spinal_cord', label: 'Cervical cord · HRA', shortLabel: 'Cervical', modelKeys: ['spinal_cord'], includes: ['cervical_spinal_cord'] },
  { id: 'hra_spinal_cord_thoracic', organKey: 'spinal_cord', label: 'Thoracic cord · HRA', shortLabel: 'Thoracic', modelKeys: ['spinal_cord'], includes: ['thoracic_spinal_cord'] },
  { id: 'hra_spinal_cord_lumbar', organKey: 'spinal_cord', label: 'Lumbar cord · HRA', shortLabel: 'Lumbar', modelKeys: ['spinal_cord'], includes: ['lumbar_spinal_cord'] },
  { id: 'hra_spinal_cord_sacral', organKey: 'spinal_cord', label: 'Sacral cord · HRA', shortLabel: 'Sacral', modelKeys: ['spinal_cord'], includes: ['sacral_spinal_cord'] },

  // Bony pelvis.
  { id: 'hra_pelvis_overview', organKey: 'pelvis', label: 'Bony pelvis · HRA', shortLabel: 'Overview', modelKeys: ['pelvis_male'], matchAll: true },
  { id: 'hra_pelvis_sacrum', organKey: 'pelvis', label: 'Sacrum · HRA', shortLabel: 'Sacrum', modelKeys: ['pelvis_male'], includes: ['sacrum'] },
  { id: 'hra_pelvis_coccyx', organKey: 'pelvis', label: 'Coccyx · HRA', shortLabel: 'Coccyx', modelKeys: ['pelvis_male'], includes: ['coccyx'] },
  { id: 'hra_pelvis_ilium', organKey: 'pelvis', label: 'Ilium · HRA', shortLabel: 'Ilium', modelKeys: ['pelvis_male'], includes: ['ilium_'] },
  { id: 'hra_pelvis_ischium', organKey: 'pelvis', label: 'Ischium · HRA', shortLabel: 'Ischium', modelKeys: ['pelvis_male'], includes: ['ischium_'] },
  { id: 'hra_pelvis_pubis', organKey: 'pelvis', label: 'Pubis · HRA', shortLabel: 'Pubis', modelKeys: ['pelvis_male'], includes: ['pubis_'] },

  // Prostate / male reproductive anatomy.
  { id: 'hra_prostate_overview', organKey: 'prostate', label: 'Prostate & ducts · HRA', shortLabel: 'Overview', modelKeys: ['prostate'], matchAll: true },
  { id: 'hra_prostate_zones', organKey: 'prostate', label: 'Prostatic zones · HRA', shortLabel: 'Zones', modelKeys: ['prostate'], includes: ['zone_of_prostate'] },
  { id: 'hra_prostate_apex_base', organKey: 'prostate', label: 'Prostate apex/base · HRA', shortLabel: 'Apex/Base', modelKeys: ['prostate'], includes: ['apex_of_prostate','base_of_prostate'] },
  { id: 'hra_seminal_vesicle', organKey: 'prostate', label: 'Seminal vesicle · HRA', shortLabel: 'Seminal vesicle', modelKeys: ['prostate'], includes: ['seminal_vesicle'] },
  { id: 'hra_vas_deferens', organKey: 'prostate', label: 'Vas deferens · HRA', shortLabel: 'Vas deferens', modelKeys: ['prostate'], includes: ['vas_deferens'] },
  { id: 'hra_ejaculatory_duct', organKey: 'prostate', label: 'Ejaculatory duct · HRA', shortLabel: 'Ejac duct', modelKeys: ['prostate'], includes: ['ejaculatory_duct'] },

  // Skin.
  { id: 'hra_skin_overview', organKey: 'skin', label: 'Skin · HRA', shortLabel: 'Skin', modelKeys: ['skin'], matchAll: true },

  // Knee — bilateral source reference.
  { id: 'hra_knee_overview', organKey: 'knee', label: 'Knees · HRA', shortLabel: 'Overview', modelKeys: ['knee_left','knee_right'], matchAll: true },
  { id: 'hra_knee_menisci', organKey: 'knee', label: 'Menisci · HRA', shortLabel: 'Menisci', modelKeys: ['knee_left','knee_right'], includes: ['meniscus_'] },
  { id: 'hra_knee_cartilage', organKey: 'knee', label: 'Articular cartilage · HRA', shortLabel: 'Cartilage', modelKeys: ['knee_left','knee_right'], includes: ['articular_cartilage_of_knee'] },
  { id: 'hra_knee_bones', organKey: 'knee', label: 'Knee bones · HRA', shortLabel: 'Bones', modelKeys: ['knee_left','knee_right'], includes: ['femur_','tibia_','fibula_','patella_'] },
  { id: 'hra_knee_cruciate_entheses', organKey: 'knee', label: 'Cruciate entheses · HRA', shortLabel: 'ACL/PCL entheses', modelKeys: ['knee_left','knee_right'], includes: ['anterior_cruciate_enthesis','posterior_cruciate_enthesis'] },

  // Female reproductive organs.
  { id: 'hra_uterus_overview', organKey: 'uterus', label: 'Uterus · HRA', shortLabel: 'Overview', modelKeys: ['uterus'], matchAll: true },
  { id: 'hra_uterus_body', organKey: 'uterus', label: 'Body of uterus · HRA', shortLabel: 'Body', modelKeys: ['uterus'], includes: ['body_of_uterus'] },
  { id: 'hra_uterus_fundus', organKey: 'uterus', label: 'Fundus of uterus · HRA', shortLabel: 'Fundus', modelKeys: ['uterus'], includes: ['fundus_of_uterus'] },
  { id: 'hra_uterus_cervix', organKey: 'uterus', label: 'Cervix · HRA', shortLabel: 'Cervix', modelKeys: ['uterus'], includes: ['cervix','cervical_os'] },
  { id: 'hra_uterus_walls', organKey: 'uterus', label: 'Uterine walls · HRA', shortLabel: 'Walls', modelKeys: ['uterus'], includes: ['wall_of_uterus'] },

  { id: 'hra_ovary_overview', organKey: 'ovary', label: 'Ovaries · HRA', shortLabel: 'Ovaries', modelKeys: ['ovary_left','ovary_right'], matchAll: true },

  { id: 'hra_fallopian_overview', organKey: 'fallopian_tube', label: 'Uterine tubes · HRA', shortLabel: 'Overview', modelKeys: ['fallopian_tube_left','fallopian_tube_right'], matchAll: true },
  { id: 'hra_fallopian_ampulla', organKey: 'fallopian_tube', label: 'Ampulla · HRA', shortLabel: 'Ampulla', modelKeys: ['fallopian_tube_left','fallopian_tube_right'], includes: ['ampulla_of_uterine_tube'] },
  { id: 'hra_fallopian_isthmus', organKey: 'fallopian_tube', label: 'Isthmus · HRA', shortLabel: 'Isthmus', modelKeys: ['fallopian_tube_left','fallopian_tube_right'], includes: ['isthmus_of_fallopian_tube'] },
  { id: 'hra_fallopian_fimbriae', organKey: 'fallopian_tube', label: 'Fimbriae · HRA', shortLabel: 'Fimbriae', modelKeys: ['fallopian_tube_left','fallopian_tube_right'], includes: ['fibria_of_uterine_tube'] },
  { id: 'hra_fallopian_infundibulum', organKey: 'fallopian_tube', label: 'Infundibulum · HRA', shortLabel: 'Infundibulum', modelKeys: ['fallopian_tube_left','fallopian_tube_right'], includes: ['uterine_tube_infundibulum'] },

  { id: 'hra_placenta_overview', organKey: 'placenta', label: 'Placenta · HRA', shortLabel: 'Overview', modelKeys: ['placenta'], matchAll: true },
  { id: 'hra_placenta_plates', organKey: 'placenta', label: 'Basal/chorionic plates · HRA', shortLabel: 'Plates', modelKeys: ['placenta'], includes: ['basal_plate','chorionic_plate'] },
  { id: 'hra_placenta_vessels', organKey: 'placenta', label: 'Placental vessels · HRA', shortLabel: 'Vessels', modelKeys: ['placenta'], includes: ['placenta_vessels','umbilical_artery','umbilical_vein'] },
  { id: 'hra_placenta_cord', organKey: 'placenta', label: 'Umbilical cord · HRA', shortLabel: 'Cord', modelKeys: ['placenta'], includes: ['umbilical_cord'] },
  { id: 'hra_placenta_amnion', organKey: 'placenta', label: 'Amnion · HRA', shortLabel: 'Amnion', modelKeys: ['placenta'], includes: ['amnion'] },
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
