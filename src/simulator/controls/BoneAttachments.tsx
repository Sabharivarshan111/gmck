import { ORGAN_ANATOMY_DATABASE } from '../data/organAnatomyData';
const BONES = ['clavicle','scapula','humerus','radius','ulna','sternum','rib','femur','tibia','fibula','patella','sacrum','ilium','ischium','pubis','mandible','maxilla','vertebra','occipital'];
/** Attachment teaching comes from the existing muscle dossiers, not an inferred bone innervation. */
export function BoneAttachments({ name, onMuscle }: { name: string; onMuscle: (id: string) => void }) {
  const normalized = name.toLowerCase();
  const bone = BONES.find(b => normalized.includes(b));
  if (!bone) return null;
  const rows = Object.entries(ORGAN_ANATOMY_DATABASE).flatMap(([id, muscle]) => {
    if (!muscle.muscleGraph) return [];
    return ([['Origin', muscle.muscleGraph.origins], ['Insertion', muscle.muscleGraph.insertions]] as const).flatMap(([kind, sites]) => sites.filter(site => site.bone.toLowerCase().includes(bone)).map(site => ({ id, muscle, kind, site })));
  });
  return <section aria-label="Bone muscle attachments" className="rounded-xl border p-4 space-y-3 text-sm">
    <h3 className="font-bold">Muscle attachments · {name}</h3>
    <p className="text-xs leading-relaxed">Origin and insertion describe attached muscles. The nerve listed supplies that muscle; it is not the bone’s sensory innervation.</p>
    {rows.map(({ id, muscle, kind, site }, index) => <button key={`${id}-${kind}-${index}`} onClick={() => onMuscle(id)} className="w-full text-left rounded-xl border p-3 min-h-11 space-y-1">
      <strong className="block">{muscle.name}</strong><span className="block text-xs">{kind}: {site.landmark} — {site.details}</span><span className="block text-xs">Muscle nerve: {muscle.muscleGraph!.nerveSupply}</span><span className="block text-xs">Action: {muscle.muscleGraph!.action}</span><span className="block font-semibold text-xs text-teal-600">Open muscle dossier →</span>
    </button>)}
    <p className="text-xs leading-relaxed">{rows.length ? 'These are the attachments documented in the current teaching collection, not an exhaustive list for this bone.' : 'No attachments for this bone are documented in the current teaching collection.'} Side and exact bony subdivisions should be confirmed on the selected mesh. Bone-specific blood supply and sensory innervation require a dedicated dossier.</p>
  </section>;
}
