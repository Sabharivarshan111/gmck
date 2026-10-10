import type { Part } from './atlasTypes';

export type AnatomyRegion = 'anterior' | 'head' | 'thorax' | 'abdomen';
export const REGION_LABELS = { anterior: 'Full body', head: 'Head & neck', thorax: 'Thorax', abdomen: 'Abdomen & pelvis' };

// Bounds are in the registered BodyParts3D metre coordinate system. Use the
// centre so a vessel crossing a boundary is listed once, rather than labelling
// the entire aorta as a head structure. This is navigation, not a cutting plane.
export function partBelongsToRegion(part: Part, region: AnatomyRegion): boolean {
  if (region === 'anterior') return true;
  const y = (part.bounds[0][1] + part.bounds[1][1]) / 2;
  const x = Math.abs((part.bounds[0][0] + part.bounds[1][0]) / 2);
  if (region === 'head') return y >= 1.45;
  // Hanging arms and long thigh muscles share torso heights. Canonical limb
  // names and a tighter midline bound keep them out of torso navigation.
  const limbName = /\b(hand|forearm|carpi|carpal|metacarpal|thumb|digiti|digitorum|humerus|humeral|brachii|deltoid|radius|ulna|cubital|radial|ulnar|axillary|coracobrachialis|anconeus|supinator|pronator|tibia|tibial|fibula|fibular|femur|femoral|femoris|thigh|patella|patellar|sartorius|vastus|gracilis|semitendinosus|semimembranosus|gastrocnemius|soleus|foot|pedis|plantar|metatarsal)\b|adductor (?:brevis|longus|magnus|minimus)|teres (?:major|minor)/i;
  if (limbName.test(part.name)) return false;
  if (region === 'thorax') return y >= 1.05 && y < 1.45 && x < 0.17;
  return y >= 0.62 && y < 1.05 && x < 0.17;
}

export function restoreSourceNodeNames(group: { traverse: (fn: (node: { name: string; userData: Record<string, unknown> }) => void) => void }): void {
  // GLTFLoader sanitises spaces and removes dots used for laterality. Its
  // original name is retained in userData. All anatomical matching must use it.
  group.traverse(node => {
    if (typeof node.userData.name === 'string') node.name = node.userData.name;
  });
}
