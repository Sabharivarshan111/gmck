export type SystemId =
  | 'skeletal'
  | 'muscular'
  | 'cardiac'
  | 'sensory'
  | 'arterial'
  | 'venous'
  | 'nervous'
  | 'respiratory'
  | 'digestive'
  | 'urinary'
  | 'lymphatic'
  | 'endocrine'
  | 'reproductive'
  | 'integumentary'
  | 'connective';

export interface SystemDefinition {
  id: SystemId;
  name: string;
  color: string;
  description: string;
}

export const SYSTEMS: SystemDefinition[] = [
  {
    id: 'skeletal',
    name: 'Skeleton & Bones',
    color: '#e2d9ba',
    description: 'Bones form the supporting framework of the body, protect thoracic and abdominal organs, and provide attachment points for muscles.',
  },
  {
    id: 'muscular',
    name: 'Muscular Architecture',
    color: '#a85b50',
    description: 'Skeletal muscles generate somatic movement, stabilize posture, and maintain joint kinematics.',
  },
  {
    id: 'cardiac',
    name: 'Heart & Great Vessels',
    color: '#b96760',
    description: 'Muscular four-chambered pump directing systemic and pulmonary circulations through coordinated valved cycles.',
  },
  {
    id: 'sensory',
    name: 'Sensory Organs',
    color: '#b0c8ce',
    description: 'Specialized tissues detecting optical, auditory, and balance stimuli relaying to cranial nerves.',
  },
  {
    id: 'arterial',
    name: 'Arterial Circulation',
    color: '#c05245',
    description: 'High-pressure systemic arterial tree delivering oxygenated blood from the aorta to capillary beds.',
  },
  {
    id: 'venous',
    name: 'Venous Drainage',
    color: '#527c9f',
    description: 'Low-pressure venous capacitance system returning deoxygenated blood to the right atrium via the venae cavae.',
  },
  {
    id: 'nervous',
    name: 'Nervous System & Brain',
    color: '#d8b565',
    description: 'The cerebrum, brainstem, spinal cord, and peripheral nerves mediating autonomic and voluntary sensorimotor control.',
  },
  {
    id: 'respiratory',
    name: 'Lungs & Airways',
    color: '#b98991',
    description: 'Tracheobronchial tree and bilateral pulmonary lobes executing alveolar oxygen and carbon dioxide gas exchange.',
  },
  {
    id: 'digestive',
    name: 'Digestive Viscera',
    color: '#b8916b',
    description: 'The alimentary tract from esophagus, stomach, duodenum to colon, along with hepatic and pancreatic accessory organs.',
  },
  {
    id: 'urinary',
    name: 'Renal & Urinary System',
    color: '#b47961',
    description: 'Bilateral retroperitoneal kidneys filtering plasma, clearing metabolic toxins, and regulating fluid-electrolyte balance.',
  },
  {
    id: 'lymphatic',
    name: 'Lymphatic Drainage',
    color: '#879f7c',
    description: 'Lymphatic vessels and nodes returning interstitial fluid to the central venous circulation and mediating immune defense.',
  },
  {
    id: 'endocrine',
    name: 'Endocrine Organs',
    color: '#c5a09a',
    description: 'Ductless glands secreting hormones regulating systemic metabolism, stress responses, and homeostasis.',
  },
  {
    id: 'reproductive',
    name: 'Reproductive System',
    color: '#bda098',
    description: 'Reproductive structures responsible for gametogenesis and sexual hormone production.',
  },
  {
    id: 'integumentary',
    name: 'Cutaneous Surface / Skin',
    color: '#ba9b7d',
    description: 'The skin and cutaneous barrier protecting underlying tissue, mediating thermoregulation and tactile sensation.',
  },
  {
    id: 'connective',
    name: 'Connective Tissue & Cartilage',
    color: '#aec3bb',
    description: 'Fibrous connective tissues, costal cartilages, and ligaments supporting articulation and fascial compartmentalization.',
  },
];

export interface Part {
  id: string;
  name: string;
  conceptId: string;
  system: SystemId;
  chunk: number;
  positions: number;
  normals: number;
  indices: number;
  vertexCount: number;
  indexCount: number;
  bounds: [number[], number[]];
}

export interface Concept {
  id: string;
  name: string;
  elements: string[];
}

export interface ChunkInfo {
  url: string;
  bytes: number;
  gzip?: string;
  gzipBytes?: number;
}

export interface Atlas {
  version: string;
  sex?: 'male';
  source?: string;
  scope?: string;
  parts: Part[];
  concepts: Concept[];
  chunks: ChunkInfo[];
  triangles: number;
}

export const DEFAULT_VISIBLE_SYSTEMS: SystemId[] = [
  'cardiac',
  'skeletal',
  'respiratory',
  'digestive',
  'urinary',
  'arterial',
  'venous',
  'nervous',
  'muscular',
  'integumentary',
];

export async function decodeModelResponse(
  response: Response,
  expectedBytes: number,
  compressed: boolean
): Promise<ArrayBuffer> {
  if (!response.ok) throw new Error(`Failed to load anatomy chunk: ${response.statusText}`);
  const payload = await response.arrayBuffer();
  const signature = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
  const isGzip = compressed && signature[0] === 0x1f && signature[1] === 0x8b;

  let buffer: ArrayBuffer;
  if (isGzip && typeof DecompressionStream !== 'undefined') {
    buffer = await new Response(
      new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))
    ).arrayBuffer();
  } else {
    buffer = payload;
  }

  if (buffer.byteLength !== expectedBytes) {
    console.warn(`Anatomy chunk byte mismatch: got ${buffer.byteLength}, expected ${expectedBytes}`);
  }
  return buffer;
}

export class PointerTap {
  private active = new Map<number, { x: number; y: number; threshold: number }>();
  private blocked = false;

  down(id: number, x: number, y: number, threshold: number = 8) {
    if (this.active.size === 0) this.blocked = false;
    this.active.set(id, { x, y, threshold });
    if (this.active.size > 1) this.blocked = true;
  }

  move(id: number, x: number, y: number) {
    const start = this.active.get(id);
    if (start && Math.hypot(x - start.x, y - start.y) > start.threshold) {
      this.blocked = true;
    }
  }

  up(id: number, x: number, y: number) {
    this.move(id, x, y);
    const tap = this.active.has(id) && this.active.size === 1 && !this.blocked;
    this.active.delete(id);
    return tap;
  }

  cancel(id: number) {
    this.active.delete(id);
    this.blocked = true;
  }
}
