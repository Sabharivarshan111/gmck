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
  vagus_nerve: [/vagus/i],
  phrenic_nerve: [/phrenic/i],
  brachial_plexus: [/brachial.*plexus|plexus.*brachial/i],
  pectoral_nerves: [/pectoral.*nerve|nerve.*pectoral/i],
  musculocutaneous_nerve: [/musculocutaneous/i],
  axillary_nerve: [/axillary.*nerve|nerve.*axillary/i],
  median_nerve: [/median.*nerve|nerve.*median/i],
  ulnar_nerve: [/ulnar.*nerve|nerve.*ulnar/i],
  radial_nerve: [/radial.*nerve|nerve.*radial/i],
  intercostal_nerves: [/intercostal/i],
  sympathetic_chain: [/sympathetic/i],
  sympathetic: [/sympathetic/i],
  cardiac_plexus: [/cardiac.*plexus|plexus.*cardiac/i],
  splanchnic_nerves: [/splanchnic/i],
  femoral_nerve: [/femoral.*nerve|nerve.*femoral/i],
  obturator_nerve: [/obturator.*nerve|nerve.*obturator/i],
  sciatic_nerve: [/sciatic/i],
  tibial_nerve: [/tibial.*nerve|nerve.*tibial/i],
  common_fibular_nerve: [/(common.*(fibular|peroneal)|(fibular|peroneal).*common)/i],
  common_peroneal_nerve: [/(common.*(fibular|peroneal)|(fibular|peroneal).*common)/i],
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
