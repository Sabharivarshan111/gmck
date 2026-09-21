/**
 * Z-Anatomy peripheral nerve supplement.
 *
 * This is intentionally separate from the BodyParts3D resolver: BodyParts3D
 * contains no peripheral nerves. The supplement is lazy-loaded only when a
 * nerve target is selected so the ordinary simulator startup cost is unchanged.
 */

export const PERIPHERAL_NERVE_MODEL_URL = '/models/zanatomy_peripheral_nerves.glb';

const TARGETS: Record<string, RegExp[]> = {
  peripheral_nerves: [/.*/i],
  vagus_nerve: [/\bvagus nerve\b/i],
  phrenic_nerve: [/\bphrenic nerve\b/i],
  brachial_plexus: [/\bbrachial plexus\b/i],
  pectoral_nerves: [/\b(?:medial |lateral )?pectoral nerve\b/i],
  musculocutaneous_nerve: [/\bmusculocutaneous nerve\b/i],
  axillary_nerve: [/\baxillary nerve\b/i],
  median_nerve: [/\bmedian nerve\b/i],
  ulnar_nerve: [/\bulnar nerve\b/i],
  radial_nerve: [/\bradial nerve\b/i],
  intercostal_nerves: [/\bintercostal nerves?\b/i],
  sympathetic_chain: [/\bsympathetic (?:trunk|chain|ganglia|nerves?)\b/i],
  sympathetic: [/\bsympathetic (?:trunk|chain|ganglia|nerves?)\b/i],
  cardiac_plexus: [/\bcardiac plexus\b/i],
  splanchnic_nerves: [/\bsplanchnic nerves?\b/i],
  femoral_nerve: [/\bfemoral nerve\b/i],
  obturator_nerve: [/\bobturator nerve\b/i],
  sciatic_nerve: [/\bsciatic nerve\b/i],
  tibial_nerve: [/\btibial nerve\b/i],
  common_fibular_nerve: [/\bcommon (?:fibular|peroneal) nerve\b/i],
  common_peroneal_nerve: [/\bcommon (?:fibular|peroneal) nerve\b/i],
};

const ALIASES: Record<string, string> = {
  vagus: 'vagus_nerve',
  phrenic: 'phrenic_nerve',
  'brachial plexus': 'brachial_plexus',
  'pectoral nerve': 'pectoral_nerves',
  'pectoral nerves': 'pectoral_nerves',
  musculocutaneous: 'musculocutaneous_nerve',
  axillary: 'axillary_nerve',
  median: 'median_nerve',
  ulnar: 'ulnar_nerve',
  radial: 'radial_nerve',
  'intercostal nerve': 'intercostal_nerves',
  'intercostal nerves': 'intercostal_nerves',
  'sympathetic chain': 'sympathetic_chain',
  'cardiac plexus': 'cardiac_plexus',
  splanchnic: 'splanchnic_nerves',
  femoral: 'femoral_nerve',
  obturator: 'obturator_nerve',
  sciatic: 'sciatic_nerve',
  tibial: 'tibial_nerve',
  'common fibular': 'common_fibular_nerve',
  'common peroneal': 'common_fibular_nerve',
};

export const PERIPHERAL_NERVE_KEYS = Object.freeze(Object.keys(TARGETS));

export function normalisePeripheralNerveTarget(targetId?: string | null): string | null {
  if (!targetId) return null;
  const clean = targetId
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const direct = clean.replace(/ /g, '_');
  if (TARGETS[direct]) return direct;
  if (ALIASES[clean]) return ALIASES[clean];

  // Existing dossier ids sometimes carry an adjective around the nerve name.
  for (const [alias, key] of Object.entries(ALIASES)) {
    if (clean.includes(alias)) return key;
  }
  return null;
}

export function isPeripheralNerveTarget(targetId?: string | null): boolean {
  return normalisePeripheralNerveTarget(targetId) !== null;
}

function normaliseMeshName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function meshMatchesPeripheralNerveTarget(meshName: string, targetId?: string | null): boolean {
  const key = normalisePeripheralNerveTarget(targetId);
  if (!key) return false;
  if (key === 'peripheral_nerves') return true;
  const name = normaliseMeshName(meshName);
  return TARGETS[key].some((rx) => rx.test(name));
}


/**
 * Resolve a visible Z-Anatomy mesh name back to the stable simulator nerve key.
 * More specific targets are checked before broad autonomic groups.
 */
export function peripheralNerveKeyForMeshName(meshName: string): string | null {
  const name = normaliseMeshName(meshName);
  const priority = [
    'vagus_nerve',
    'phrenic_nerve',
    'brachial_plexus',
    'pectoral_nerves',
    'musculocutaneous_nerve',
    'axillary_nerve',
    'median_nerve',
    'ulnar_nerve',
    'radial_nerve',
    'intercostal_nerves',
    'cardiac_plexus',
    'splanchnic_nerves',
    'femoral_nerve',
    'obturator_nerve',
    'sciatic_nerve',
    'tibial_nerve',
    'common_fibular_nerve',
    'sympathetic_chain',
  ];
  for (const key of priority) {
    if (TARGETS[key]?.some((rx) => rx.test(name))) return key;
  }
  return null;
}
