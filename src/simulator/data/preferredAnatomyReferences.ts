import { isHraHeartTarget } from './hraHeart.ts';
import { getHraOrganTarget } from './hraOrgans.ts';
import { getZAnatomyReferenceTarget } from './zanatomyReferences.ts';

/**
 * Canonical source-backed overview used when a student asks to isolate a whole
 * organ. BodyParts3D remains the registered whole-body atlas and keeps its
 * named vessels/relations, but these dedicated HRA/Z-Anatomy references are
 * the higher-fidelity teaching geometry for the organ itself.
 *
 * Keep this list deliberately explicit. A source may contain a related model
 * (for example Z-Anatomy's major-joints reference) without being a suitable
 * replacement for the entire organ/system button (for example "Skeleton").
 */
export const PREFERRED_ANATOMY_OVERVIEW_TARGETS: Readonly<Record<string, string>> = {
  heart: 'hra_heart_overview',
  lungs: 'hra_lung_overview',
  brain: 'za_brain_overview',
  liver: 'hra_liver_overview',
  stomach: 'za_stomach',
  pancreas: 'hra_pancreas_overview',
  spleen: 'hra_spleen_overview',
  small_intestine: 'hra_small_intestine_overview',
  urinary_bladder: 'hra_bladder_overview',
  thymus: 'hra_thymus_overview',
  kidney: 'hra_kidney_overview',
  eye: 'hra_eye_overview',
  ureter: 'hra_ureter_overview',
  spinal_cord: 'hra_spinal_cord_overview',
  pelvis: 'hra_pelvis_overview',
  prostate: 'hra_prostate_overview',
  skin: 'hra_skin_overview',
  knee: 'hra_knee_overview',
  uterus: 'hra_uterus_overview',
  ovary: 'hra_ovary_overview',
  fallopian_tube: 'hra_fallopian_overview',
  placenta: 'hra_placenta_overview',
};

export function getPreferredAnatomyIsolationTarget(
  organOrTargetId: string | null | undefined
): string | null {
  if (!organOrTargetId) return null;
  return PREFERRED_ANATOMY_OVERVIEW_TARGETS[organOrTargetId] || organOrTargetId;
}

export function getVerifiedReferenceOrganKey(
  targetId: string | null | undefined
): string | null {
  if (!targetId) return null;
  if (isHraHeartTarget(targetId)) return 'heart';
  return (
    getHraOrganTarget(targetId)?.organKey ||
    getZAnatomyReferenceTarget(targetId)?.organKey ||
    null
  );
}

export function isolationTargetBelongsToOrgan(
  targetId: string | null | undefined,
  organId: string
): boolean {
  if (!targetId) return false;
  return targetId === organId || getVerifiedReferenceOrganKey(targetId) === organId;
}
