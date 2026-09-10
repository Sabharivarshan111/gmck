import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PatientVitals, PatientPathologyState } from '../types';
import {
  Atlas,
  Part,
  SystemId,
  SYSTEMS,
  decodeModelResponse,
  PointerTap,
  DissectionToolMode,
} from '../data/atlasTypes';
import { Scissors, Hand, Focus, Eye, Sparkles, Maximize2, Compass, AlertCircle, Info } from 'lucide-react';

interface AnatomicalBody3DProps {
  vitals: PatientVitals;
  pathology: PatientPathologyState;
  scenarioId: string;
  cameraPreset?: 'anterior' | 'head' | 'thorax' | 'abdomen';
  theme?: 'light' | 'dark';
  selectedOrganId?: string | null;
  contextOrganId?: string | null;
  onSelectOrganId?: (organId: string) => void;
  // Dissection engine integration
  toolMode?: DissectionToolMode;
  isXray?: boolean;
  layerPeel?: number;
  hiddenPartIds?: string[];
  isolatedPartId?: string | null;
  onDissectPart?: (part: Part) => void;
  onAtlasLoaded?: (atlas: Atlas) => void;
}

/**
 * Concurrency-bounded queue for downloading & decoding binary model chunks.
 * Limits in-flight decompressions to prevent mobile WebKit Jetsam OOM crashes.
 */
async function fetchChunksWithLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
  onProgress?: (completed: number, total: number) => void
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let completed = 0;
  let cursor = 0;

  const worker = async () => {
    while (cursor < tasks.length) {
      const idx = cursor++;
      results[idx] = await tasks[idx]();
      completed++;
      if (onProgress) onProgress(completed, tasks.length);
    }
  };

  const poolSize = Math.min(limit, tasks.length);
  await Promise.all(Array.from({ length: poolSize }, () => worker()));
  return results;
}

// ============================================================================
// Anatomical Element Resolver for 3D Isolation & Selection
// Maps high-level organ/vessel/nerve keys to actual BodyParts3D element IDs
// ============================================================================
// Enhanced Multi-Structure Atlas Element Resolver (Relations, Nerves, Vessels)
// ============================================================================
export function resolveAtlasElementIds(targetId: string, atlas: Atlas): Set<string> {
  const result = new Set<string>();
  if (!targetId || !atlas) return result;

  const rawKey = targetId.toLowerCase().trim();
  const cleanKey = rawKey.replace(/\([^)]*\)/g, '').replace(/_/g, ' ').trim();
  const key = cleanKey || rawKey;

  // 0. Direct element ID match
  if (atlas.parts.some((p) => p.id === targetId)) {
    result.add(targetId);
  }

  // 1. Direct concept lookup
  if (atlas.concepts) {
    for (const c of atlas.concepts) {
      const cName = c.name.toLowerCase();
      if (cName === key || c.id.toLowerCase() === key || cName === rawKey) {
        c.elements.forEach((el) => result.add(el));
      }
    }
  }

  // 2. System match
  atlas.parts.forEach((p) => {
    if (p.system.toLowerCase() === key || p.system.toLowerCase() === rawKey) result.add(p.id);
  });

  // 3. Anatomical matching rules
  if (key.includes('sternum') || key.includes('manubrium') || key.includes('xiphoid')) {
    atlas.parts.forEach((p) => {
      if (p.name.toLowerCase().includes('sternum') || p.id === 'FJ3178') result.add(p.id);
    });
  } else if (key.includes('cartilage') || key.includes('costal')) {
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      if (pName.includes('cartilage') || pName.includes('costal') || pName.includes('rib')) result.add(p.id);
    });
  } else if (key.includes('rib')) {
    atlas.parts.forEach((p) => {
      if (p.name.toLowerCase().includes('rib')) result.add(p.id);
    });
  } else if (key.includes('vertebra') || key.includes('spine')) {
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      if (pName.includes('vertebra') || pName.includes('thoracic vertebra')) result.add(p.id);
    });
  } else if (key.includes('esophag')) {
    atlas.parts.forEach((p) => {
      if (p.name.toLowerCase().includes('esophagus') || p.id === 'FJ2563') result.add(p.id);
    });
  } else if (key.includes('azygos') || key.includes('hemiazygos')) {
    atlas.parts.forEach((p) => {
      if (p.name.toLowerCase().includes('azygos')) result.add(p.id);
    });
  } else if (key.includes('lymph') || key.includes('node') || key.includes('thoracic duct') || key.includes('cisterna')) {
    atlas.parts.forEach((p) => {
      if (p.system === 'lymphatic' || p.name.toLowerCase().includes('spleen') || p.name.toLowerCase().includes('thymus')) result.add(p.id);
    });
  } else if (key.includes('diaphragm') || key.includes('tendon')) {
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      if (pName.includes('diaphragm') || pName.includes('phrenic') || pName.includes('tendon')) result.add(p.id);
    });
  } else if (key.includes('pleura')) {
    atlas.parts.forEach((p) => {
      if (p.system === 'respiratory' || p.name.toLowerCase().includes('lung')) result.add(p.id);
    });
  } else if (key.includes('vena cava') || key.includes('svc') || key.includes('ivc')) {
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      if (pName.includes('cava') || pName.includes('brachiocephalic') || pName.includes('jugular')) result.add(p.id);
    });
  } else if (key.includes('pulmonary')) {
    atlas.parts.forEach((p) => {
      if (p.name.toLowerCase().includes('pulmonary')) result.add(p.id);
    });
  } else if (key.includes('lad') || key.includes('anterior descending') || (key.includes('anterior interventricular') && !key.includes('vein'))) {
    const terms = [
      'anterior interventricular branch of left coronary',
      'trunk of anterior interventricular',
      'diagonal branch of anterior descending',
      'conus branch of anterior interventricular',
      'septal branch of anterior interventricular',
      'anterior branch of anterior interventricular',
    ];
    atlas.parts.forEach((p) => {
      if (p.system !== 'arterial') return;
      const pName = p.name.toLowerCase();
      if (
        p.id === 'FJ2737' || // Trunk of left coronary artery
        p.id === 'FJ2631' || // Trunk of anterior interventricular branch
        terms.some((t) => pName.includes(t)) ||
        (pName.includes('anterior interventricular') && !pName.includes('vein')) ||
        pName.includes('diagonal branch of anterior')
      ) {
        result.add(p.id);
      }
    });
  } else if (key.includes('rca') || key.includes('right coronary') || key.includes('pda') || (key.includes('posterior interventricular') && !key.includes('vein'))) {
    const terms = [
      'right coronary',
      'posterior interventricular branch of right',
      'marginal branch of right coronary',
      'first anterior ventricular branch of right',
      'first posterior ventricular branch of right',
      'septal branch of right posterior',
    ];
    atlas.parts.forEach((p) => {
      if (p.system !== 'arterial') return;
      const pName = p.name.toLowerCase();
      if (terms.some((t) => pName.includes(t)) || p.id === 'FJ2723') {
        result.add(p.id);
      }
    });
  } else if (key.includes('lcx') || (key.includes('circumflex') && !key.includes('femoral') && !key.includes('humeral') && !key.includes('scapular'))) {
    atlas.parts.forEach((p) => {
      if (p.system !== 'arterial') return;
      const pName = p.name.toLowerCase();
      if (
        p.id === 'FJ2737' ||
        (pName.includes('circumflex') && pName.includes('coronary')) ||
        pName.includes('circumflex branch of left')
      ) {
        result.add(p.id);
      }
    });
  } else if (key.includes('coronary sinus') || key.includes('coronary_sinus') || key.includes('cardiac vein')) {
    const terms = ['coronary sinus', 'great cardiac vein', 'middle cardiac vein', 'small cardiac vein', 'anterior cardiac vein'];
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      if (terms.some((t) => pName.includes(t))) result.add(p.id);
    });
  } else if (key.includes('celiac')) {
    const terms = ['celiac', 'common hepatic', 'splenic artery', 'left gastric artery'];
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      if (terms.some((t) => pName.includes(t))) result.add(p.id);
    });
  } else if (key.includes('portal')) {
    atlas.parts.forEach((p) => {
      if (p.name.toLowerCase().includes('portal vein')) result.add(p.id);
    });
  } else if (key.includes('vagus') || key.includes('recurrent laryngeal') || key.includes('parasympathetic')) {
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      if (
        pName.includes('vagus') ||
        pName.includes('medulla oblongata') ||
        pName.includes('pons') ||
        pName.includes('central canal') ||
        pName.includes('peduncle of midbrain') ||
        (p.system === 'nervous' && (pName.includes('oculomotor') || pName.includes('trochlear') || pName.includes('ganglion')))
      ) {
        result.add(p.id);
      }
    });
  } else if (key.includes('phrenic')) {
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      if (pName.includes('phrenic') || pName.includes('central canal') || p.id === 'FJ1737') {
        result.add(p.id);
      }
    });
  } else if (key.includes('axillary') || key.includes('brachial')) {
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      if (
        pName.includes('axillary') ||
        pName.includes('brachial') ||
        p.id === 'FJ1737' ||
        (p.system === 'nervous' && pName.includes('cervical'))
      ) {
        result.add(p.id);
      }
    });
  } else if (key.includes('pectoral nerve')) {
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      if (pName.includes('pectoral') || p.id === 'FJ1737' || p.system === 'nervous') {
        result.add(p.id);
      }
    });
  } else if (key.includes('sympathetic')) {
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      if (
        pName.includes('sympathetic') ||
        pName.includes('ganglion') ||
        pName.includes('medulla oblongata') ||
        pName.includes('pons') ||
        pName.includes('central canal') ||
        p.id === 'FJ1737'
      ) {
        result.add(p.id);
      }
    });
  } else if (key.includes('somatic') || key.includes('sensory nerve')) {
    atlas.parts.forEach((p) => {
      if (p.system === 'sensory' || (p.system === 'nervous' && p.name.toLowerCase().includes('ciliary'))) {
        result.add(p.id);
      }
    });
  } else if (key.includes('nerve') || key.includes('nervous') || key.includes('innervation') || key.includes('neuro')) {
    atlas.parts.forEach((p) => {
      if (p.system === 'nervous' || p.name.toLowerCase().includes('nerve') || p.name.toLowerCase().includes('ganglion')) {
        result.add(p.id);
      }
    });
  } else if (key.includes('heart') || key.includes('cardiac') || key.includes('cor humanum') || key.includes('septum') || key.includes('myocardium')) {
    const pureHeartIds = new Set([
      'FJ2428', // Wall of ventricle (main muscular myocardium)
      'FJ2438', // Wall of left atrium
      'FJ2439', // Wall of right atrium
      'FJ3413', // Ascending aorta root
      'FJ2966', // Pulmonary trunk root
      'FJ2417', // Left anterior cusp of pulmonary valve
      'FJ2420', // Anterior leaflet of mitral valve
      'FJ2421', // Anterior leaflet of tricuspid valve
      'FJ2426', // Left posterior cusp of aortic valve
      'FJ2427', // Posterior cusp of pulmonary valve
      'FJ2431', // Right posterior cusp of aortic valve
      'FJ2432', // Posterior leaflet of mitral valve
      'FJ2433', // Posterior leaflet of tricuspid valve
      'FJ2434', // Right anterior cusp of pulmonary valve
      'FJ2435', // Anterior cusp of aortic valve
      'FJ2436', // Septal leaflet of tricuspid valve
    ]);
    atlas.parts.forEach((p) => {
      if (pureHeartIds.has(p.id)) {
        result.add(p.id);
        return;
      }
      const pName = p.name.toLowerCase();
      // STRICT FILTER: Exclude blood cavity chamber casts, cerebral ventricles, and veins
      if (
        pName.includes('cavity of') ||
        pName.includes('lateral ventricle') ||
        pName.includes('third ventricle') ||
        pName.includes('fourth ventricle') ||
        pName.includes('interventricular foramen') ||
        pName.includes('brain') ||
        pName.includes('cerebr') ||
        pName.includes('vein')
      ) return;

      if (
        p.system === 'cardiac' ||
        pName.includes('myocard') ||
        pName.includes('pericard')
      ) {
        result.add(p.id);
      }
    });
  } else if (key.includes('liver') || key.includes('hepar') || key.includes('biliary')) {
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      if (pName.includes('liver') || pName.includes('caudate lobe') || pName.includes('hepatic') || pName.includes('gallbladder')) {
        result.add(p.id);
      }
    });
  } else if (key.includes('lung') || key.includes('pulmon') || key.includes('bronch') || key.includes('respiratory') || key.includes('trachea')) {
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      // 1. Respiratory organs & airway tree
      if (
        p.system === 'respiratory' ||
        pName.includes('bronch') ||
        pName.includes('lung') ||
        pName.includes('trachea') ||
        pName.includes('larynx') ||
        pName.includes('pleura')
      ) {
        result.add(p.id);
      }
      // 2. Pulmonary & Bronchial Blood Supply (pulmonary trunk, pulmonary arteries, pulmonary veins, bronchial vessels)
      else if (
        pName.includes('pulmonary') ||
        pName.includes('bronchial artery') ||
        pName.includes('bronchial vein')
      ) {
        result.add(p.id);
      }
      // 3. Neurovascular supply (phrenic nerve, vagal pulmonary branches)
      else if (
        pName.includes('phrenic') ||
        (p.system === 'nervous' && pName.includes('vagus'))
      ) {
        result.add(p.id);
      }
    });
  } else if (key.includes('abdomen') || key.includes('abdominal')) {
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      // 1. Abdominal Viscera
      if (
        p.system === 'digestive' ||
        p.system === 'urinary' ||
        p.id === 'FJ2561' || // Spleen
        pName.includes('stomach') ||
        pName.includes('liver') ||
        pName.includes('pancreas') ||
        pName.includes('spleen') ||
        pName.includes('kidney') ||
        pName.includes('ureter') ||
        pName.includes('gallbladder') ||
        pName.includes('biliary') ||
        pName.includes('colon') ||
        pName.includes('appendix') ||
        pName.includes('intestine') ||
        pName.includes('mesentery') ||
        pName.includes('duodenum') ||
        pName.includes('jejunum') ||
        pName.includes('ileum') ||
        pName.includes('rectum')
      ) {
        result.add(p.id);
      }
      // 2. Abdominal Blood Supply: Celiac trunk, mesenteric vessels, portal vein, renal vessels, abdominal aorta, IVC
      else if (
        pName.includes('celiac') ||
        pName.includes('mesenteric') ||
        pName.includes('portal vein') ||
        pName.includes('hepatic artery') ||
        pName.includes('hepatic vein') ||
        pName.includes('splenic artery') ||
        pName.includes('splenic vein') ||
        pName.includes('renal artery') ||
        pName.includes('renal vein') ||
        pName.includes('gastric artery') ||
        pName.includes('gastroepiploic') ||
        pName.includes('gastroduodenal') ||
        (p.system === 'arterial' && (pName.includes('abdominal aorta') || pName.includes('lumbar artery')))
      ) {
        result.add(p.id);
      }
    });
  } else if (key.includes('brain') || key.includes('cranium') || key.includes('cerebr')) {
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      if (pName.includes('brain') || pName.includes('cerebr') || pName.includes('fornix') || pName.includes('thalam') || pName.includes('optic') || pName.includes('retina')) {
        result.add(p.id);
      }
    });
  } else if (key.includes('kidney') || key.includes('renal')) {
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      if (pName.includes('kidney') || pName.includes('renal') || pName.includes('ureter')) {
        result.add(p.id);
      }
    });
  } else if (key.includes('stomach') || key.includes('gastric')) {
    atlas.parts.forEach((p) => {
      if (p.name.toLowerCase().includes('stomach') || p.name.toLowerCase().includes('gastric')) result.add(p.id);
    });
  } else if (key.includes('spleen') || key.includes('splenic')) {
    atlas.parts.forEach((p) => {
      if (p.name.toLowerCase().includes('spleen') || p.name.toLowerCase().includes('splenic')) result.add(p.id);
    });
  } else if (key.includes('aorta')) {
    atlas.parts.forEach((p) => {
      if (p.name.toLowerCase().includes('aorta')) result.add(p.id);
    });
  } else if (key.includes('pectoral')) {
    atlas.parts.forEach((p) => {
      if (p.name.toLowerCase().includes('pectoralis')) result.add(p.id);
    });
  } else if (key.includes('deltoid')) {
    atlas.parts.forEach((p) => {
      if (p.name.toLowerCase().includes('deltoid')) result.add(p.id);
    });
  } else {
    // Smart words resolution
    const words = key.split(/[\s,/-]+/).filter((w) => w.length >= 3 && !['and', 'the', 'with', 'muscle', 'artery', 'vein'].includes(w));
    atlas.parts.forEach((p) => {
      const pName = p.name.toLowerCase();
      if (p.id === targetId || p.conceptId === targetId || pName.includes(key) || (words.length > 0 && words.every((w) => pName.includes(w)))) {
        result.add(p.id);
      }
    });
    if (result.size === 0 && words.length > 0) {
      atlas.parts.forEach((p) => {
        const pName = p.name.toLowerCase();
        if (words.some((w) => pName.includes(w) && w.length >= 4)) {
          result.add(p.id);
        }
      });
    }
  }

  return result;
}

// ============================================================================
// Context Organ Resolver: Maps isolated vessels, nerves, and relations to their parent organ
// ============================================================================
export function resolveContextOrganId(isolatedId?: string | null, selectedId?: string | null): string | null {
  if (!isolatedId && !selectedId) return null;
  const iso = (isolatedId || '').toLowerCase().replace(/_/g, ' ');
  const sel = (selectedId || '').toLowerCase().replace(/_/g, ' ');

  // Cardiac structures: Coronary vessels, autonomic innervation, relations
  if (
    iso.includes('lad') ||
    iso.includes('rca') ||
    iso.includes('lcx') ||
    iso.includes('coronary') ||
    iso.includes('anterior interventricular') ||
    iso.includes('posterior interventricular') ||
    iso.includes('cardiac vein') ||
    iso.includes('cardiac plexus') ||
    iso.includes('sympathetic') ||
    iso.includes('vagus') ||
    iso.includes('sternum') ||
    iso.includes('esophag') ||
    iso.includes('azygos') ||
    iso.includes('thoracic duct') ||
    sel.includes('heart')
  ) {
    if (iso !== 'heart' && (iso || sel.includes('heart'))) return 'heart';
  }

  // Hepatic / Biliary structures
  if (iso.includes('portal') || iso.includes('hepatic') || iso.includes('gallbladder') || sel.includes('liver')) {
    if (iso !== 'liver' && (iso || sel.includes('liver'))) return 'liver';
  }

  // Renal structures
  if (iso.includes('renal') || iso.includes('ureter') || sel.includes('kidney')) {
    if (iso !== 'kidney' && (iso || sel.includes('kidney'))) return 'kidney';
  }

  // Pulmonary structures
  if (iso.includes('pulmon') || iso.includes('bronch') || iso.includes('pleura') || sel.includes('lung')) {
    if (iso !== 'lung' && (iso || sel.includes('lung'))) return 'lungs';
  }

  // Gastric structures
  if (iso.includes('celiac') || iso.includes('gastric') || sel.includes('stomach')) {
    if (iso !== 'stomach' && (iso || sel.includes('stomach'))) return 'stomach';
  }

  return null;
}

// ============================================================================
// Autonomic Nervous System & Sympathetic Trunk 3D Generator
// Models the bilateral paravertebral sympathetic chains (T1-T12, cervical, L1),
// 32 ganglia nodules, rami communicantes, thoracic cardiac nerves, cardiac plexus,
// splanchnic nerves, and vagus nerves (CN X) calibrated to BodyParts3D skeleton coordinates
// ============================================================================
export function createAutonomicNervousSystem(): {
  group: THREE.Group;
  cardiacGroup: THREE.Group;
  pulmonaryGroup: THREE.Group;
  abdominalGroup: THREE.Group;
  materials: {
    trunk: THREE.MeshStandardMaterial;
    ganglia: THREE.MeshStandardMaterial;
  };
  bounds: THREE.Box3;
} {
  const group = new THREE.Group();
  group.name = 'autonomic_nervous_system';

  const cardiacGroup = new THREE.Group();
  cardiacGroup.name = 'cardiac_nerves';
  group.add(cardiacGroup);

  const pulmonaryGroup = new THREE.Group();
  pulmonaryGroup.name = 'pulmonary_nerves';
  group.add(pulmonaryGroup);

  const abdominalGroup = new THREE.Group();
  abdominalGroup.name = 'abdominal_nerves';
  group.add(abdominalGroup);

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Deep rich amber-gold (high contrast against white background)
    emissive: 0x92400e, // Warm golden-brown emissive
    emissiveIntensity: 0.75,
    roughness: 0.28,
    metalness: 0.1,
    transparent: false,
    opacity: 1.0,
  });

  const gangliaMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Warm honey gold
    emissive: 0xb45309,
    emissiveIntensity: 0.90,
    roughness: 0.22,
    metalness: 0.15,
  });

  const bounds = new THREE.Box3();

  // Thoracic & Cervical vertebral coordinates for Sympathetic Chains (calibrated to BodyParts3D spine)
  const rightLevels = [
    new THREE.Vector3(-0.022, 1.555, -0.018), // Superior cervical ganglion
    new THREE.Vector3(-0.024, 1.505, -0.028), // Middle cervical ganglion
    new THREE.Vector3(-0.025, 1.465, -0.035), // Stellate / Cervicothoracic ganglion
    new THREE.Vector3(-0.025, 1.440, -0.038), // T1
    new THREE.Vector3(-0.026, 1.418, -0.042), // T2
    new THREE.Vector3(-0.027, 1.396, -0.045), // T3
    new THREE.Vector3(-0.027, 1.374, -0.047), // T4
    new THREE.Vector3(-0.028, 1.345, -0.048), // T5
    new THREE.Vector3(-0.028, 1.315, -0.048), // T6
    new THREE.Vector3(-0.028, 1.285, -0.046), // T7
    new THREE.Vector3(-0.027, 1.258, -0.043), // T8
    new THREE.Vector3(-0.026, 1.230, -0.039), // T9
    new THREE.Vector3(-0.025, 1.202, -0.034), // T10
    new THREE.Vector3(-0.024, 1.176, -0.028), // T11
    new THREE.Vector3(-0.024, 1.148, -0.022), // T12
    new THREE.Vector3(-0.023, 1.110, -0.018), // L1
  ];

  const leftLevels = rightLevels.map((p) => new THREE.Vector3(-p.x, p.y, p.z));

  // 1. Right Sympathetic Trunk cord
  const rightCurve = new THREE.CatmullRomCurve3(rightLevels);
  const rightTrunkGeo = new THREE.TubeGeometry(rightCurve, 64, 0.0028, 8, false);
  const rightTrunkMesh = new THREE.Mesh(rightTrunkGeo, trunkMat);
  group.add(rightTrunkMesh);

  // 2. Left Sympathetic Trunk cord
  const leftCurve = new THREE.CatmullRomCurve3(leftLevels);
  const leftTrunkGeo = new THREE.TubeGeometry(leftCurve, 64, 0.0028, 8, false);
  const leftTrunkMesh = new THREE.Mesh(leftTrunkGeo, trunkMat);
  group.add(leftTrunkMesh);

  // 3. Sympathetic Ganglia Nodules (Fusiform beads)
  const ganglionGeo = new THREE.SphereGeometry(0.0052, 12, 10);
  ganglionGeo.scale(1.0, 1.5, 1.0);

  [...rightLevels, ...leftLevels].forEach((pos) => {
    const gMesh = new THREE.Mesh(ganglionGeo, gangliaMat);
    gMesh.position.copy(pos);
    group.add(gMesh);
    bounds.expandByPoint(pos);
  });

  // 4. Rami Communicantes (connecting ganglia to intercostal nerves laterally)
  rightLevels.slice(3, 15).forEach((pos) => {
    const p2 = new THREE.Vector3(pos.x - 0.014, pos.y - 0.003, pos.z - 0.004);
    const ramiCurve = new THREE.LineCurve3(pos, p2);
    const ramiGeo = new THREE.TubeGeometry(ramiCurve, 8, 0.0016, 6, false);
    group.add(new THREE.Mesh(ramiGeo, trunkMat));
  });

  leftLevels.slice(3, 15).forEach((pos) => {
    const p2 = new THREE.Vector3(pos.x + 0.014, pos.y - 0.003, pos.z - 0.004);
    const ramiCurve = new THREE.LineCurve3(pos, p2);
    const ramiGeo = new THREE.TubeGeometry(ramiCurve, 8, 0.0016, 6, false);
    group.add(new THREE.Mesh(ramiGeo, trunkMat));
  });

  // 5. Sympathetic Cardiac Nerves (branching from Cervical & T1-T5 to Cardiac Plexus)
  const cardiacPlexusTarget = new THREE.Vector3(0.005, 1.345, 0.018);
  bounds.expandByPoint(cardiacPlexusTarget);

  // Right cardiac branches
  rightLevels.slice(2, 7).forEach((pos, idx) => {
    const mid = new THREE.Vector3(pos.x * 0.45, pos.y - 0.015, pos.z + 0.032 + idx * 0.004);
    const end = new THREE.Vector3(-0.004, 1.345 + (idx - 2) * 0.005, 0.016 + idx * 0.002);
    const nerveCurve = new THREE.CatmullRomCurve3([pos, mid, end]);
    const nerveGeo = new THREE.TubeGeometry(nerveCurve, 16, 0.0020, 6, false);
    cardiacGroup.add(new THREE.Mesh(nerveGeo, trunkMat));
  });

  // Left cardiac branches
  leftLevels.slice(2, 7).forEach((pos, idx) => {
    const mid = new THREE.Vector3(pos.x * 0.45, pos.y - 0.015, pos.z + 0.032 + idx * 0.004);
    const end = new THREE.Vector3(0.008, 1.345 + (idx - 2) * 0.005, 0.016 + idx * 0.002);
    const nerveCurve = new THREE.CatmullRomCurve3([pos, mid, end]);
    const nerveGeo = new THREE.TubeGeometry(nerveCurve, 16, 0.0020, 6, false);
    cardiacGroup.add(new THREE.Mesh(nerveGeo, trunkMat));
  });

  // 6. Cardiac Plexus (Superficial and Deep mesh network at aortic arch/bifurcation)
  const plexusBranches = [
    [new THREE.Vector3(-0.010, 1.355, 0.012), new THREE.Vector3(0.002, 1.348, 0.018), new THREE.Vector3(0.012, 1.340, 0.022)],
    [new THREE.Vector3(-0.006, 1.365, 0.008), new THREE.Vector3(0.005, 1.352, 0.015), new THREE.Vector3(0.010, 1.335, 0.020)],
    [new THREE.Vector3(-0.008, 1.340, 0.015), new THREE.Vector3(0.000, 1.335, 0.022), new THREE.Vector3(0.008, 1.328, 0.025)],
  ];
  plexusBranches.forEach((pts) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 16, 0.0018, 6, false);
    cardiacGroup.add(new THREE.Mesh(geo, gangliaMat));
  });

  // 6b. Pulmonary Plexus (Anterior & Posterior plexus branches radiating around lung hila)
  const pulmonaryBranches = [
    // Right pulmonary branches
    [new THREE.Vector3(-0.018, 1.365, 0.008), new THREE.Vector3(-0.024, 1.348, 0.012), new THREE.Vector3(-0.032, 1.336, 0.016)],
    [new THREE.Vector3(-0.014, 1.352, 0.014), new THREE.Vector3(-0.022, 1.342, 0.016), new THREE.Vector3(-0.028, 1.330, 0.020)],
    // Left pulmonary branches
    [new THREE.Vector3(0.018, 1.365, 0.008), new THREE.Vector3(0.024, 1.348, 0.012), new THREE.Vector3(0.032, 1.336, 0.016)],
    [new THREE.Vector3(0.012, 1.342, 0.014), new THREE.Vector3(0.022, 1.342, 0.016), new THREE.Vector3(0.028, 1.330, 0.020)],
  ];
  pulmonaryBranches.forEach((pts) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 16, 0.0018, 6, false);
    pulmonaryGroup.add(new THREE.Mesh(geo, trunkMat));
  });

  // 7. Splanchnic Nerves (Greater splanchnic T5-T9 descending to celiac region)
  const rightSplanchnicPts = [
    new THREE.Vector3(-0.024, 1.340, -0.035),
    new THREE.Vector3(-0.020, 1.280, -0.028),
    new THREE.Vector3(-0.016, 1.210, -0.018),
    new THREE.Vector3(-0.012, 1.130, -0.010),
  ];
  const rightSplanchnicGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rightSplanchnicPts), 24, 0.0022, 6, false);
  abdominalGroup.add(new THREE.Mesh(rightSplanchnicGeo, trunkMat));

  const leftSplanchnicPts = rightSplanchnicPts.map((p) => new THREE.Vector3(-p.x, p.y, p.z));
  const leftSplanchnicGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leftSplanchnicPts), 24, 0.0022, 6, false);
  abdominalGroup.add(new THREE.Mesh(leftSplanchnicGeo, trunkMat));

  // 8. Bilateral Vagus Nerves (CN X)
  const rightVagusPts = [
    new THREE.Vector3(-0.022, 1.560, -0.010),
    new THREE.Vector3(-0.020, 1.480, -0.002),
    new THREE.Vector3(-0.018, 1.410, 0.008),
    new THREE.Vector3(-0.014, 1.350, 0.014),
    new THREE.Vector3(-0.010, 1.260, -0.018),
  ];
  const rightVagusGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rightVagusPts), 32, 0.0026, 8, false);
  group.add(new THREE.Mesh(rightVagusGeo, trunkMat));

  const leftVagusPts = [
    new THREE.Vector3(0.022, 1.560, -0.010),
    new THREE.Vector3(0.020, 1.480, -0.002),
    new THREE.Vector3(0.018, 1.370, 0.018),
    new THREE.Vector3(0.012, 1.340, 0.014),
    new THREE.Vector3(0.008, 1.260, -0.018),
  ];
  const leftVagusGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leftVagusPts), 32, 0.0026, 8, false);
  group.add(new THREE.Mesh(leftVagusGeo, trunkMat));

  // Left Recurrent Laryngeal Nerve loop
  const recurrentLaryngealPts = [
    new THREE.Vector3(0.018, 1.370, 0.018),
    new THREE.Vector3(0.012, 1.335, 0.012),
    new THREE.Vector3(0.006, 1.360, -0.005),
    new THREE.Vector3(0.006, 1.440, -0.010),
    new THREE.Vector3(0.008, 1.510, -0.012),
  ];
  const recurrentGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(recurrentLaryngealPts), 24, 0.0018, 6, false);
  group.add(new THREE.Mesh(recurrentGeo, trunkMat));

  // Render on top of viscera
  group.renderOrder = 12;

  return {
    group,
    cardiacGroup,
    pulmonaryGroup,
    abdominalGroup,
    materials: { trunk: trunkMat, ganglia: gangliaMat },
    bounds,
  };
}

// ============================================================================
// Lymphatic System 3D Generator
// Models Thoracic Duct, Tracheobronchial & Hilar Lymph Nodes, Cisterna Chyli,
// Celiac, Mesenteric, and Lumbar Para-Aortic Lymph Node Chains
// ============================================================================
export function createLymphaticSystem(): {
  group: THREE.Group;
  thoracicGroup: THREE.Group;
  abdominalGroup: THREE.Group;
  materials: {
    node: THREE.MeshStandardMaterial;
    vessel: THREE.MeshStandardMaterial;
  };
  bounds: THREE.Box3;
} {
  const group = new THREE.Group();
  group.name = 'lymphatic_system';

  const thoracicGroup = new THREE.Group();
  thoracicGroup.name = 'thoracic_lymphatics';
  group.add(thoracicGroup);

  const abdominalGroup = new THREE.Group();
  abdominalGroup.name = 'abdominal_lymphatics';
  group.add(abdominalGroup);

  const nodeMat = new THREE.MeshStandardMaterial({
    color: 0x10b981, // Emerald jade green
    emissive: 0x059669,
    emissiveIntensity: 0.9,
    roughness: 0.25,
    metalness: 0.1,
  });

  const vesselMat = new THREE.MeshStandardMaterial({
    color: 0x059669,
    emissive: 0x047857,
    emissiveIntensity: 0.7,
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
    opacity: 0.95,
  });

  const bounds = new THREE.Box3();
  const nodeGeo = new THREE.SphereGeometry(0.0038, 10, 8);
  nodeGeo.scale(1.1, 1.4, 1.1);

  // 1. Thoracic Duct (L1 to root of neck)
  const thoracicDuctPts = [
    new THREE.Vector3(0.003, 1.125, -0.024), // Cisterna chyli apex
    new THREE.Vector3(0.004, 1.200, -0.026),
    new THREE.Vector3(0.004, 1.280, -0.027),
    new THREE.Vector3(0.003, 1.340, -0.027),
    new THREE.Vector3(-0.004, 1.400, -0.024),
    new THREE.Vector3(-0.015, 1.450, -0.018),
    new THREE.Vector3(-0.022, 1.478, -0.012), // Terminating at Left Venous Angle
  ];
  const thoracicDuctGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(thoracicDuctPts), 40, 0.0016, 6, false);
  thoracicGroup.add(new THREE.Mesh(thoracicDuctGeo, vesselMat));

  // 2. Subcarinal (Inferior Tracheobronchial) Lymph Nodes
  const subcarinalPositions = [
    new THREE.Vector3(0.000, 1.338, 0.008),
    new THREE.Vector3(-0.006, 1.334, 0.009),
    new THREE.Vector3(0.006, 1.334, 0.009),
  ];
  subcarinalPositions.forEach((pos) => {
    const mesh = new THREE.Mesh(nodeGeo, nodeMat);
    mesh.position.copy(pos);
    thoracicGroup.add(mesh);
    bounds.expandByPoint(pos);
  });

  // 3. Right & Left Superior Tracheobronchial Nodes
  const tracheobronchialPositions = [
    new THREE.Vector3(-0.014, 1.358, 0.010),
    new THREE.Vector3(-0.018, 1.368, 0.008),
    new THREE.Vector3(0.014, 1.358, 0.010),
    new THREE.Vector3(0.018, 1.368, 0.008),
  ];
  tracheobronchialPositions.forEach((pos) => {
    const mesh = new THREE.Mesh(nodeGeo, nodeMat);
    mesh.position.copy(pos);
    thoracicGroup.add(mesh);
  });

  // 4. Paratracheal Chains
  const paratrachealPositions = [
    new THREE.Vector3(-0.010, 1.390, 0.006),
    new THREE.Vector3(-0.011, 1.425, 0.004),
    new THREE.Vector3(0.010, 1.390, 0.006),
    new THREE.Vector3(0.011, 1.425, 0.004),
  ];
  paratrachealPositions.forEach((pos) => {
    const mesh = new THREE.Mesh(nodeGeo, nodeMat);
    mesh.position.copy(pos);
    thoracicGroup.add(mesh);
  });

  // 5. Bronchopulmonary (Hilar) Lymph Nodes
  const hilarPositions = [
    new THREE.Vector3(-0.026, 1.344, 0.015),
    new THREE.Vector3(-0.032, 1.335, 0.018),
    new THREE.Vector3(0.026, 1.344, 0.015),
    new THREE.Vector3(0.032, 1.335, 0.018),
  ];
  hilarPositions.forEach((pos) => {
    const mesh = new THREE.Mesh(nodeGeo, nodeMat);
    mesh.position.copy(pos);
    thoracicGroup.add(mesh);
  });

  // Connecting hilar lymphatic vessels
  const hilarVessels = [
    [new THREE.Vector3(-0.032, 1.335, 0.018), new THREE.Vector3(-0.026, 1.344, 0.015), new THREE.Vector3(-0.014, 1.358, 0.010), new THREE.Vector3(0.0, 1.338, 0.008)],
    [new THREE.Vector3(0.032, 1.335, 0.018), new THREE.Vector3(0.026, 1.344, 0.015), new THREE.Vector3(0.014, 1.358, 0.010), new THREE.Vector3(0.0, 1.338, 0.008)],
  ];
  hilarVessels.forEach((pts) => {
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.0010, 6, false);
    thoracicGroup.add(new THREE.Mesh(geo, vesselMat));
  });

  // 6. Abdominal: Cisterna Chyli
  const cisternaGeo = new THREE.SphereGeometry(0.0055, 12, 10);
  cisternaGeo.scale(0.8, 1.8, 0.8);
  const cisternaMesh = new THREE.Mesh(cisternaGeo, nodeMat);
  cisternaMesh.position.set(0.003, 1.120, -0.024);
  abdominalGroup.add(cisternaMesh);
  bounds.expandByPoint(cisternaMesh.position);

  // 7. Celiac & Superior Mesenteric Lymph Nodes
  const celiacPositions = [
    new THREE.Vector3(0.002, 1.215, -0.014),
    new THREE.Vector3(-0.008, 1.210, -0.012),
    new THREE.Vector3(0.010, 1.218, -0.012),
    new THREE.Vector3(0.002, 1.175, 0.004), // SMA root
    new THREE.Vector3(-0.006, 1.168, 0.008),
    new THREE.Vector3(0.008, 1.170, 0.007),
  ];
  celiacPositions.forEach((pos) => {
    const mesh = new THREE.Mesh(nodeGeo, nodeMat);
    mesh.position.copy(pos);
    abdominalGroup.add(mesh);
  });

  // 8. Lumbar (Para-aortic) Lymph Node Chains
  const lumbarPositions = [
    new THREE.Vector3(-0.016, 1.155, -0.018),
    new THREE.Vector3(-0.017, 1.110, -0.016),
    new THREE.Vector3(-0.016, 1.065, -0.014),
    new THREE.Vector3(0.016, 1.155, -0.018),
    new THREE.Vector3(0.017, 1.110, -0.016),
    new THREE.Vector3(0.016, 1.065, -0.014),
  ];
  lumbarPositions.forEach((pos) => {
    const mesh = new THREE.Mesh(nodeGeo, nodeMat);
    mesh.position.copy(pos);
    abdominalGroup.add(mesh);
  });

  // Lumbar lymphatic trunks to cisterna chyli
  const lumbarTrunkLeft = [
    new THREE.Vector3(-0.016, 1.065, -0.014),
    new THREE.Vector3(-0.016, 1.110, -0.016),
    new THREE.Vector3(-0.008, 1.118, -0.022),
    new THREE.Vector3(0.003, 1.120, -0.024),
  ];
  const lumbarTrunkRight = [
    new THREE.Vector3(0.016, 1.065, -0.014),
    new THREE.Vector3(0.016, 1.110, -0.016),
    new THREE.Vector3(0.009, 1.118, -0.022),
    new THREE.Vector3(0.003, 1.120, -0.024),
  ];
  [lumbarTrunkLeft, lumbarTrunkRight].forEach((pts) => {
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.0012, 6, false);
    abdominalGroup.add(new THREE.Mesh(geo, vesselMat));
  });

  group.renderOrder = 11;

  return {
    group,
    thoracicGroup,
    abdominalGroup,
    materials: { node: nodeMat, vessel: vesselMat },
    bounds,
  };
}

export const AnatomicalBody3D: React.FC<AnatomicalBody3DProps> = ({
  vitals,
  pathology,
  scenarioId,
  cameraPreset = 'anterior',
  theme = 'light',
  selectedOrganId,
  contextOrganId,
  onSelectOrganId,
  toolMode = 'inspect',
  isXray = false,
  layerPeel = 0,
  hiddenPartIds = [],
  isolatedPartId = null,
  onDissectPart,
  onAtlasLoaded,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [modelsReady, setModelsReady] = useState<boolean>(false);
  const [hoveredPart, setHoveredPart] = useState<Part | null>(null);

  // System meshes and GPU data textures
  const systemMeshesRef = useRef<Map<SystemId, THREE.Mesh>>(new Map());
  const systemMaterialsRef = useRef<Map<SystemId, THREE.MeshStandardMaterial>>(new Map());
  const atlasRef = useRef<Atlas | null>(null);
  const traumaMarkerRef = useRef<THREE.Group | null>(null);
  const selectionPointerRef = useRef<THREE.Group | null>(null);

  // 3D Neural and Lymphatic Engines
  const autonomicGroupRef = useRef<THREE.Group | null>(null);
  const autonomicMaterialsRef = useRef<{
    trunk: THREE.MeshStandardMaterial;
    ganglia: THREE.MeshStandardMaterial;
  } | null>(null);
  const cardiacNervesRef = useRef<THREE.Group | null>(null);
  const pulmonaryNervesRef = useRef<THREE.Group | null>(null);
  const abdominalNervesRef = useRef<THREE.Group | null>(null);

  const lymphaticGroupRef = useRef<THREE.Group | null>(null);
  const lymphaticMaterialsRef = useRef<{
    node: THREE.MeshStandardMaterial;
    vessel: THREE.MeshStandardMaterial;
  } | null>(null);
  const thoracicLymphRef = useRef<THREE.Group | null>(null);
  const abdominalLymphRef = useRef<THREE.Group | null>(null);

  // GPU DataTextures for 60 FPS Dissection & Selection
  const partTextureRef = useRef<THREE.DataTexture | null>(null);
  const partDataRef = useRef<Float32Array | null>(null);
  const selectionTextureRef = useRef<THREE.DataTexture | null>(null);
  const selectionDataRef = useRef<Uint8Array | null>(null);

  const isLight = theme === 'light';

  // Refs for current props to access inside native events without re-mounting
  const toolModeRef = useRef(toolMode);
  toolModeRef.current = toolMode;
  const onDissectPartRef = useRef(onDissectPart);
  onDissectPartRef.current = onDissectPart;
  const onSelectOrganIdRef = useRef(onSelectOrganId);
  onSelectOrganIdRef.current = onSelectOrganId;

  // Initialize Scene & Load BodyParts3D Atlas
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;
    let animationFrameId: number;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene setup (Clean Titanium Medical Studio)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLight ? 0xedf2f7 : 0x070b14);
    sceneRef.current = scene;

    // 2. Camera setup
    const isMobileDevice = width < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const defaultDist = isMobileDevice ? 3.4 : 2.8;
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.05, 50);
    camera.position.set(0, 0.85, defaultDist);
    cameraRef.current = camera;

    // 3. Renderer with Tone Mapping & Studio Environment (Hardened for Mobile)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    // Strict mobile DPR clamping to 1.0 prevents WebKit Jetsam OOM crashes
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobileDevice ? 1.0 : 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLight ? 0.90 : 1.05;
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // WebGL Context Loss & Self-Healing Lifecycle
    let isContextLost = false;
    const handleContextLost = (e: Event) => {
      e.preventDefault(); // Required: prevents browser from permanently destroying WebGL context
      isContextLost = true;
      console.warn('[WebGL] Context lost due to system pressure. Pausing render loop.');
    };
    const handleContextRestored = () => {
      console.info('[WebGL] Context restored. Re-uploading GPU resources...');
      isContextLost = false;
      if (partTextureRef.current) partTextureRef.current.needsUpdate = true;
      if (selectionTextureRef.current) selectionTextureRef.current.needsUpdate = true;
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    // PMREM Studio Environment (Soft Fill Ambient)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    room.dispose();
    pmrem.dispose();

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.3;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI * 0.95;
    controls.target.set(0, 0.85, 0);
    controlsRef.current = controls;

    // 5. Studio Lighting Rig - Calibrated physiological studio levels (NO color bleaching!)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x64748b, isLight ? 0.40 : 0.50);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, isLight ? 1.05 : 1.15);
    keyLight.position.set(-2.5, 4, 3.5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xfff1f2, isLight ? 0.45 : 0.60);
    rimLight.position.set(2.5, 2.5, -3.5);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, isLight ? 0.30 : 0.35);
    fillLight.position.set(0, -1, 3);
    scene.add(fillLight);

    // 6. Medical Studio Pedestal Platform
    const platformGeo = new THREE.CylinderGeometry(0.75, 0.78, 0.028, 64);
    const platformMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xe2e8f0 : 0x0f172a,
      metalness: 0.12,
      roughness: 0.65,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(0, -0.014, 0);
    scene.add(platform);

    const ringGeo = new THREE.RingGeometry(0.7, 0.704, 96);
    const ringMat = new THREE.MeshBasicMaterial({
      color: isLight ? 0x94a3b8 : 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.001, 0);
    scene.add(ring);

    // 7. Snakebite Trauma Marker at right lower leg
    const traumaGroup = new THREE.Group();
    traumaGroup.position.set(0.12, 0.22, 0.08);
    const fang1 = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 12), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    const fang2 = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 12), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    fang2.position.set(0.018, 0, 0);
    traumaGroup.add(fang1);
    traumaGroup.add(fang2);

    const haloMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.02, 0.045, 24),
      new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
    );
    haloMesh.rotation.x = -Math.PI / 2;
    traumaGroup.add(haloMesh);
    scene.add(traumaGroup);
    traumaMarkerRef.current = traumaGroup;

    // 7b. Interactive 3D Selection Pointer Pin & Arrow Marker
    const selectionPointerGroup = new THREE.Group();
    selectionPointerGroup.visible = false;

    // Inverted 3D Arrow Cone pointing downwards towards selected muscle/organ
    const arrowConeGeo = new THREE.ConeGeometry(0.016, 0.045, 16);
    arrowConeGeo.rotateX(Math.PI); // Point downwards
    const arrowConeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vivid sky cyan
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.7,
    });
    const arrowCone = new THREE.Mesh(arrowConeGeo, arrowConeMat);
    arrowCone.position.y = 0.04;
    selectionPointerGroup.add(arrowCone);

    // Glowing target ring around structure
    const arrowRingGeo = new THREE.RingGeometry(0.015, 0.03, 32);
    arrowRingGeo.rotateX(-Math.PI / 2);
    const arrowRingMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const arrowRing = new THREE.Mesh(arrowRingGeo, arrowRingMat);
    selectionPointerGroup.add(arrowRing);

    scene.add(selectionPointerGroup);
    selectionPointerRef.current = selectionPointerGroup;

    // 7c. Anatomically-Calibrated 3D Autonomic & Sympathetic Neural Engine
    const autonomicSystem = createAutonomicNervousSystem();
    scene.add(autonomicSystem.group);
    autonomicGroupRef.current = autonomicSystem.group;
    autonomicMaterialsRef.current = autonomicSystem.materials;
    cardiacNervesRef.current = autonomicSystem.cardiacGroup;
    pulmonaryNervesRef.current = autonomicSystem.pulmonaryGroup;
    abdominalNervesRef.current = autonomicSystem.abdominalGroup;

    // 7d. Anatomically-Calibrated 3D Lymphatic System
    const lymphaticSystem = createLymphaticSystem();
    scene.add(lymphaticSystem.group);
    lymphaticGroupRef.current = lymphaticSystem.group;
    lymphaticMaterialsRef.current = lymphaticSystem.materials;
    thoracicLymphRef.current = lymphaticSystem.thoracicGroup;
    abdominalLymphRef.current = lymphaticSystem.abdominalGroup;

    // 8. Load BodyParts3D Atlas Manifest & Binary Chunks
    const abortCtrl = new AbortController();

    const loadAtlas = async () => {
      try {
        const res = await fetch('/models/atlas.json', { signal: abortCtrl.signal });
        const atlas: Atlas = await res.json();
        if (disposed) return;
        atlasRef.current = atlas;
        if (onAtlasLoaded) onAtlasLoaded(atlas);

        const totalParts = atlas.parts.length;
        const width = THREE.MathUtils.ceilPowerOfTwo(totalParts); // 2048

        // Allocate GPU DataTextures for 60 FPS Dissection & Selection
        const partData = new Float32Array(width * 4);
        // Default: all parts fully visible (alpha = 1.0)
        for (let i = 0; i < totalParts; i++) {
          partData[i * 4 + 3] = 1.0;
        }
        partDataRef.current = partData;
        const partTexture = new THREE.DataTexture(partData, width, 1, THREE.RGBAFormat, THREE.FloatType);
        partTexture.needsUpdate = true;
        partTextureRef.current = partTexture;

        const selectionData = new Uint8Array(width * 4);
        selectionDataRef.current = selectionData;
        const selectionTexture = new THREE.DataTexture(selectionData, width, 1);
        selectionTexture.needsUpdate = true;
        selectionTextureRef.current = selectionTexture;

        // Create Materials Hooked into GPU Dissection Discard Shader
        const materialsMap = new Map<SystemId, THREE.MeshStandardMaterial>();
        SYSTEMS.forEach((sys) => {
          const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(sys.color),
            roughness: 0.22, // Crisp biological sheen, eliminates flat clay appearance
            metalness: 0.04,
            side: THREE.FrontSide, // FrontSide only! Eliminates double-image blur and internal murkiness
            transparent: true,
            opacity: sys.id === 'integumentary' ? 0.12 : 1.0,
            depthWrite: sys.id !== 'integumentary',
          });

          mat.onBeforeCompile = (shader) => {
            shader.uniforms.partState = { value: partTexture };
            shader.uniforms.selectionState = { value: selectionTexture };
            shader.uniforms.stateWidth = { value: width };

            shader.vertexShader =
              `attribute float partIndex;
uniform sampler2D partState;
uniform sampler2D selectionState;
uniform float stateWidth;
varying float partVisible;
varying float partSelected;
` + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              '#include <begin_vertex>\n' +
                'vec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5);\n' +
                'vec4 state = texture2D(partState, stateUv);\n' +
                'transformed += state.xyz;\n' +
                'partVisible = state.w;\n' +
                'partSelected = texture2D(selectionState, stateUv).r;\n'
            );

            shader.fragmentShader =
              `varying float partVisible;
varying float partSelected;
` + shader.fragmentShader;

            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <clipping_planes_fragment>',
              '#include <clipping_planes_fragment>\n' +
                'if (partVisible < 0.1) discard;\n'
            );

            const isArterialSys = sys.id === 'arterial';
            const isVenousSys = sys.id === 'venous';
            const isNervousSys = sys.id === 'nervous';
            const isCardiacSys = sys.id === 'cardiac';

            let selectedColorGlsl = 'diffuseColor.rgb = diffuseColor.rgb * 1.35;\n';
            let selectedEmissiveGlsl = 'totalEmissiveRadiance += diffuseColor.rgb * 0.4;\n';

            if (isArterialSys) {
              // SOLID, 100% OPAQUE, DEEP ARTERIAL SCARLET RED (NO ACES ORANGE SHIFT)
              selectedColorGlsl = 'diffuseColor.rgb = vec3(0.96, 0.02, 0.02);\n' +
                                  'diffuseColor.a = 1.0;\n';
              selectedEmissiveGlsl = 'totalEmissiveRadiance = vec3(0.18, 0.005, 0.005);\n';
            } else if (isVenousSys) {
              // VIVID DEEP ROYAL COBALT BLUE (SLASHED GREEN TO PREVENT CYAN BLEED)
              selectedColorGlsl = 'diffuseColor.rgb = vec3(0.04, 0.18, 0.88);\n' +
                                  'diffuseColor.a = 1.0;\n';
              selectedEmissiveGlsl = 'totalEmissiveRadiance = vec3(0.01, 0.03, 0.20);\n';
            } else if (isNervousSys) {
              // BRILLIANT SATURATED GOLDEN AMBER (HIGH VISIBILITY OVER MYOCARDIUM)
              selectedColorGlsl = 'diffuseColor.rgb = vec3(1.0, 0.72, 0.02);\n' +
                                  'diffuseColor.a = 1.0;\n';
              selectedEmissiveGlsl = 'totalEmissiveRadiance = vec3(0.35, 0.22, 0.01);\n';
            }

            let contextColorGlsl = '';
            if (isCardiacSys) {
              // ANATOMICAL TRANSLUCENT MYOCARDIUM: Rich deep crimson (#991b1b), 44% alpha, deep chamber visibility!
              contextColorGlsl = 'diffuseColor.rgb = vec3(0.68, 0.12, 0.16);\n' +
                                 'diffuseColor.a = 0.44;\n';
            } else {
              contextColorGlsl = 'diffuseColor.rgb = diffuseColor.rgb * 0.75;\n' +
                                 'diffuseColor.a = 0.40;\n';
            }

            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <color_fragment>',
              '#include <color_fragment>\n' +
                'if (partVisible > 0.1 && partVisible < 0.8) {\n' +
                '  // CONTEXT ORGAN MODE\n' +
                contextColorGlsl +
                '} else if (partSelected > 0.5) {\n' +
                '  // PRIMARY SELECTED TARGET\n' +
                selectedColorGlsl +
                '}\n'
            );

            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <emissivemap_fragment>',
              '#include <emissivemap_fragment>\n' +
                'if (partVisible > 0.1 && partVisible < 0.8) {\n' +
                '  // Subtle warm anatomical rim illumination for sharp definition without white haze\n' +
                '  vec3 viewDir = normalize(-vViewPosition);\n' +
                '  float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);\n' +
                '  totalEmissiveRadiance = vec3(0.40, 0.08, 0.10) * (rim * 0.25);\n' +
                '} else if (partSelected > 0.5) {\n' +
                selectedEmissiveGlsl +
                '}\n'
            );
          };

          materialsMap.set(sys.id, mat);
        });
        systemMaterialsRef.current = materialsMap;

        const bounds = atlas.parts.map(
          (p) => new THREE.Box3(new THREE.Vector3(...p.bounds[0]), new THREE.Vector3(...p.bounds[1]))
        );
        const pickers: (THREE.Mesh | undefined)[] = [];
        const totalChunks = atlas.chunks.length;
        let loadedChunks = 0;

        // Fetch chunks in bounded batches to eliminate mobile Jetsam memory crashes
        const isMobileDevice = width < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const concurrencyLimit = isMobileDevice ? 2 : 4;

        const chunkTasks = atlas.chunks.map((chunk) => async () => {
          const hasGzip = !!chunk.gzip && typeof DecompressionStream !== 'undefined';
          const fetchUrl = hasGzip ? chunk.gzip! : chunk.url;
          const resp = await fetch(fetchUrl, { signal: abortCtrl.signal });
          return await decodeModelResponse(resp, chunk.bytes, hasGzip);
        });

        const chunkBuffers = await fetchChunksWithLimit(
          chunkTasks,
          concurrencyLimit,
          (done, total) => {
            setLoadProgress(Math.round((done / total) * 85));
          }
        );

        if (disposed) return;

        // Build temporary geometries with partIndex and group by system
        const systemGeomGroups = new Map<SystemId, THREE.BufferGeometry[]>();

        atlas.parts.forEach((p, partIdx) => {
          const buffer = chunkBuffers[p.chunk];
          if (!buffer) return;

          const geom = new THREE.BufferGeometry();
          geom.setAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(buffer, p.positions, p.vertexCount * 3), 3)
          );
          geom.setAttribute(
            'normal',
            new THREE.BufferAttribute(new Int16Array(buffer, p.normals, p.vertexCount * 3), 3, true)
          );
          geom.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer, p.indices, p.indexCount), 1));
          geom.boundingBox = bounds[partIdx].clone();
          geom.computeBoundingSphere();

          // Inject partIndex attribute for GPU shader lookups
          geom.setAttribute('partIndex', new THREE.BufferAttribute(new Float32Array(p.vertexCount).fill(partIdx), 1));

          const list = systemGeomGroups.get(p.system) || [];
          list.push(geom);
          systemGeomGroups.set(p.system, list);
        });

        // Merge geometries ONCE per system, add to scene, and IMMEDIATELY dispose unmerged geometries
        systemGeomGroups.forEach((geomList, sysId) => {
          if (geomList.length === 0) return;
          const merged = mergeGeometries(geomList, false);

          // CRITICAL MEMORY GC: Dispose individual unmerged geometries immediately!
          for (let i = 0; i < geomList.length; i++) {
            geomList[i].dispose();
          }
          geomList.length = 0;

          if (!merged) return;

          merged.computeBoundingSphere();
          const mat = materialsMap.get(sysId);
          const sysMesh = new THREE.Mesh(merged, mat);
          sysMesh.frustumCulled = false;
          sysMesh.userData = { systemId: sysId };

          // Set renderOrder so vessels and nerves are cleanly drawn on top of viscera
          if (sysId === 'nervous' || sysId === 'arterial') {
            sysMesh.renderOrder = 30;
          } else if (sysId === 'venous') {
            sysMesh.renderOrder = 25;
          } else if (sysId === 'cardiac' || sysId === 'respiratory' || sysId === 'digestive' || sysId === 'urinary') {
            sysMesh.renderOrder = 5;
          } else if (sysId === 'skeletal') {
            sysMesh.renderOrder = 2;
          } else if (sysId === 'integumentary') {
            sysMesh.renderOrder = 40;
          }
          scene.add(sysMesh);
          systemMeshesRef.current.set(sysId, sysMesh);
        });

        // CRITICAL MEMORY GC: Clear raw chunk buffers completely from memory
        chunkBuffers.length = 0;

        setLoadProgress(100);
        if (!disposed) {
          setModelsReady(true);
        }
      } catch (err: any) {
        if (!disposed && err.name !== 'AbortError') {
          console.error('Failed to load BodyParts3D atlas:', err);
        }
      }
    };

    loadAtlas();

    // 9. Raycasting Pointer Tap & Dissection Interaction (Direct Merged-Mesh Attribute Raycast)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pointerTap = new PointerTap();

    /**
     * Resolves the hit part directly from the merged system mesh using the partIndex vertex attribute.
     * O(1) attribute lookup, zero separate pick meshes!
     */
    const getHitPartFromIntersection = (hit: THREE.Intersection): Part | null => {
      if (!hit.face || !hit.object || !(hit.object instanceof THREE.Mesh)) return null;
      const geom = hit.object.geometry as THREE.BufferGeometry;
      const partAttr = geom.getAttribute('partIndex');
      if (!partAttr) return null;

      const partIdx = Math.round(partAttr.getX(hit.face.a));
      const atlas = atlasRef.current;
      const partData = partDataRef.current;
      if (!atlas || !partData || partIdx < 0 || partIdx >= atlas.parts.length) return null;

      // Check if shader has marked this part as discarded/hidden
      if (partData[partIdx * 4 + 3] < 0.1) return null;

      return atlas.parts[partIdx];
    };

    const findTopmostVisiblePart = (
      pointerCoords: THREE.Vector2,
      cam: THREE.Camera,
      meshes: THREE.Mesh[]
    ): Part | null => {
      raycaster.setFromCamera(pointerCoords, cam);
      const candidateMeshes = meshes.filter((m) => m.userData.systemId !== 'integumentary');
      const hits = raycaster.intersectObjects(candidateMeshes, false);

      for (const hit of hits) {
        const part = getHitPartFromIntersection(hit);
        if (part) return part;
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerTap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === 'touch' ? 14 : 6);
    };

    const onPointerMove = (e: PointerEvent) => {
      pointerTap.move(e.pointerId, e.clientX, e.clientY);
      // Skip hover raycasting on touch drag to prevent mobile thermal throttle & stutter
      if (e.pointerType === 'touch' || !modelsReady) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const hitPart = findTopmostVisiblePart(pointer, camera, Array.from(systemMeshesRef.current.values()));
      if (hitPart) {
        setHoveredPart(hitPart);
        renderer.domElement.style.cursor = toolModeRef.current === 'scalpel' ? 'crosshair' : 'pointer';
      } else {
        setHoveredPart(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const isTap = pointerTap.up(e.pointerId, e.clientX, e.clientY);
      if (!isTap || !modelsReady) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const clickedPart = findTopmostVisiblePart(pointer, camera, Array.from(systemMeshesRef.current.values()));
      if (!clickedPart) return;

      const mode = toolModeRef.current;
      if (mode === 'scalpel') {
        if (onDissectPartRef.current) onDissectPartRef.current(clickedPart);
      } else {
        if (onSelectOrganIdRef.current) onSelectOrganIdRef.current(clickedPart.id);
      }
    };

    const onPointerCancel = (e: PointerEvent) => {
      pointerTap.cancel(e.pointerId);
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown, { passive: true });
    dom.addEventListener('pointermove', onPointerMove, { passive: true });
    dom.addEventListener('pointerup', onPointerUp, { passive: true });
    dom.addEventListener('pointercancel', onPointerCancel, { passive: true });

    // 10. Resize & Orientation handler
    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const isMob = w < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMob ? 1.0 : 1.75));
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 11. Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      if (disposed || isContextLost) return;
      animationFrameId = requestAnimationFrame(animate);

      // Skip render if container is hidden (e.g. mobile tab switched to telemetry)
      if (container.offsetWidth === 0 || container.offsetHeight === 0) return;

      const elapsed = clock.getElapsedTime();

      // Cardiac pulsation
      const hr = vitals.heartRate;
      const cardiacScale = 1.0 + 0.035 * Math.sin(elapsed * ((hr / 60) * Math.PI * 2));
      const cardiacMesh = systemMeshesRef.current.get('cardiac');
      if (cardiacMesh) {
        cardiacMesh.scale.set(cardiacScale, cardiacScale, cardiacScale);
      }

      // Trauma marker visibility and pulse
      if (traumaMarkerRef.current) {
        traumaMarkerRef.current.visible = scenarioId === 'snakebite';
        const s = 1.0 + 0.2 * Math.sin(elapsed * 4);
        traumaMarkerRef.current.scale.set(s, s, s);
      }

      // Selection pointer marker bounce and pulse
      if (selectionPointerRef.current && selectionPointerRef.current.visible) {
        const cone = selectionPointerRef.current.children[0];
        const ring = selectionPointerRef.current.children[1];
        if (cone) {
          cone.position.y = 0.04 + 0.008 * Math.sin(elapsed * 6);
        }
        if (ring) {
          const rs = 1.0 + 0.2 * Math.sin(elapsed * 5);
          ring.scale.set(rs, rs, rs);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      abortCtrl.abort();
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointercancel', onPointerCancel);
      dom.removeEventListener('webglcontextlost', handleContextLost);
      dom.removeEventListener('webglcontextrestored', handleContextRestored);

      controls.dispose();

      // Dispose DataTextures
      if (partTextureRef.current) {
        partTextureRef.current.dispose();
        partTextureRef.current = null;
      }
      if (selectionTextureRef.current) {
        selectionTextureRef.current.dispose();
        selectionTextureRef.current = null;
      }

      // Dispose Scene Environment Texture
      if (scene.environment) {
        scene.environment.dispose();
      }

      // Recursive scene traversal disposal
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Theme & Background
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(isLight ? 0xedf2f7 : 0x070b14);
    }
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = isLight ? 0.98 : 1.15;
    }
  }, [isLight]);

  // Update GPU DataTexture when hiddenPartIds, isolatedPartId, contextOrganId, or layerPeel changes
  useEffect(() => {
    const atlas = atlasRef.current;
    const partData = partDataRef.current;
    const partTexture = partTextureRef.current;
    if (!atlas || !partData || !partTexture) return;

    const hiddenSet = new Set(hiddenPartIds);
    const targetKey = isolatedPartId || (selectedOrganId && (
      selectedOrganId.includes('artery') ||
      selectedOrganId.includes('vein') ||
      selectedOrganId.includes('nerve') ||
      selectedOrganId.includes('lad') ||
      selectedOrganId.includes('rca') ||
      selectedOrganId.includes('lcx') ||
      selectedOrganId.includes('coronary')
    ) ? selectedOrganId : null);

    const isolatedElements = targetKey ? resolveAtlasElementIds(targetKey, atlas) : null;
    const contextKey = contextOrganId || resolveContextOrganId(targetKey, selectedOrganId);
    const contextElements = (contextKey && contextKey !== targetKey) ? resolveAtlasElementIds(contextKey, atlas) : null;

    // Entity category checks
    const isSympatheticTarget = !!targetKey && (targetKey.toLowerCase().includes('sympath') || targetKey.toLowerCase().includes('cardiac plexus'));
    const isVagusTarget = !!targetKey && (targetKey.toLowerCase().includes('vagus') || targetKey.toLowerCase().includes('parasympath'));
    const isAutonomicTarget = isSympatheticTarget || isVagusTarget;

    const isLungTarget = !!targetKey && (
      targetKey.toLowerCase().includes('lung') ||
      targetKey.toLowerCase().includes('pulmon') ||
      targetKey.toLowerCase().includes('bronch') ||
      targetKey.toLowerCase().includes('trachea')
    );

    const isAbdomenTarget = !!targetKey && (
      targetKey.toLowerCase().includes('abdomen') ||
      targetKey.toLowerCase().includes('liver') ||
      targetKey.toLowerCase().includes('stomach') ||
      targetKey.toLowerCase().includes('pancreas') ||
      targetKey.toLowerCase().includes('spleen') ||
      targetKey.toLowerCase().includes('kidney') ||
      targetKey.toLowerCase().includes('celiac') ||
      targetKey.toLowerCase().includes('mesenteric') ||
      targetKey.toLowerCase().includes('portal')
    );

    const isArteryTarget = !!targetKey && (
      targetKey.toLowerCase().includes('artery') ||
      targetKey.toLowerCase().includes('lad') ||
      targetKey.toLowerCase().includes('rca') ||
      targetKey.toLowerCase().includes('lcx') ||
      targetKey.toLowerCase().includes('coronary')
    );

    const isCardiacTarget = !!targetKey && !isArteryTarget && (
      targetKey.toLowerCase().includes('heart') ||
      targetKey.toLowerCase().includes('cor humanum')
    );

    const isLymphaticTarget = !!targetKey && targetKey.toLowerCase().includes('lymph');

    // Autonomic Nerves Visibility and Saturated High-Contrast Amber-Gold Styling
    if (autonomicGroupRef.current) {
      if (isAutonomicTarget) {
        autonomicGroupRef.current.visible = true;
        if (cardiacNervesRef.current) cardiacNervesRef.current.visible = true;
        if (pulmonaryNervesRef.current) pulmonaryNervesRef.current.visible = true;
        if (abdominalNervesRef.current) abdominalNervesRef.current.visible = true;
        if (autonomicMaterialsRef.current) {
          autonomicMaterialsRef.current.trunk.emissiveIntensity = 0.85;
          autonomicMaterialsRef.current.trunk.color.setHex(0xd97706); // Deep rich amber-gold
          autonomicMaterialsRef.current.trunk.emissive.setHex(0x92400e);
          autonomicMaterialsRef.current.ganglia.emissiveIntensity = 1.05;
          autonomicMaterialsRef.current.ganglia.color.setHex(0xf59e0b); // Warm honey-gold
          autonomicMaterialsRef.current.ganglia.emissive.setHex(0xb45309);
        }
      } else if (isArteryTarget) {
        // STRICTLY HIDE AUTONOMIC NERVES WHEN ISOLATING AN ARTERY
        autonomicGroupRef.current.visible = false;
      } else if (isLungTarget) {
        // Show pulmonary plexus & vagus pulmonary innervation
        autonomicGroupRef.current.visible = true;
        if (pulmonaryNervesRef.current) pulmonaryNervesRef.current.visible = true;
        if (cardiacNervesRef.current) cardiacNervesRef.current.visible = false;
        if (abdominalNervesRef.current) abdominalNervesRef.current.visible = false;
        if (autonomicMaterialsRef.current) {
          autonomicMaterialsRef.current.trunk.emissiveIntensity = 0.85;
          autonomicMaterialsRef.current.trunk.color.setHex(0xd97706);
          autonomicMaterialsRef.current.ganglia.emissiveIntensity = 1.05;
          autonomicMaterialsRef.current.ganglia.color.setHex(0xf59e0b);
        }
      } else if (isAbdomenTarget) {
        // Show splanchnic nerves (T5-T12) & celiac plexus
        autonomicGroupRef.current.visible = true;
        if (abdominalNervesRef.current) abdominalNervesRef.current.visible = true;
        if (pulmonaryNervesRef.current) pulmonaryNervesRef.current.visible = false;
        if (cardiacNervesRef.current) cardiacNervesRef.current.visible = false;
        if (autonomicMaterialsRef.current) {
          autonomicMaterialsRef.current.trunk.emissiveIntensity = 0.85;
          autonomicMaterialsRef.current.trunk.color.setHex(0xd97706);
          autonomicMaterialsRef.current.ganglia.emissiveIntensity = 1.05;
          autonomicMaterialsRef.current.ganglia.color.setHex(0xf59e0b);
        }
      } else if (isCardiacTarget) {
        // Show cardiac plexus & sympathetic cardiac branches
        autonomicGroupRef.current.visible = true;
        if (cardiacNervesRef.current) cardiacNervesRef.current.visible = true;
        if (pulmonaryNervesRef.current) pulmonaryNervesRef.current.visible = false;
        if (abdominalNervesRef.current) abdominalNervesRef.current.visible = false;
        if (autonomicMaterialsRef.current) {
          autonomicMaterialsRef.current.trunk.emissiveIntensity = 0.85;
          autonomicMaterialsRef.current.trunk.color.setHex(0xd97706);
          autonomicMaterialsRef.current.ganglia.emissiveIntensity = 1.05;
          autonomicMaterialsRef.current.ganglia.color.setHex(0xf59e0b);
        }
      } else if (isolatedPartId) {
        autonomicGroupRef.current.visible = false;
      } else {
        // Normal full body mode
        autonomicGroupRef.current.visible = layerPeel <= 0.68;
        if (cardiacNervesRef.current) cardiacNervesRef.current.visible = true;
        if (pulmonaryNervesRef.current) pulmonaryNervesRef.current.visible = true;
        if (abdominalNervesRef.current) abdominalNervesRef.current.visible = true;
        if (autonomicMaterialsRef.current) {
          autonomicMaterialsRef.current.trunk.emissiveIntensity = 0.75;
          autonomicMaterialsRef.current.trunk.color.setHex(0xd97706);
          autonomicMaterialsRef.current.ganglia.emissiveIntensity = 0.90;
          autonomicMaterialsRef.current.ganglia.color.setHex(0xf59e0b);
        }
      }
    }

    // Lymphatics Visibility: NEVER show green lymphatics on cardiac, arterial, or nerve isolations!
    if (lymphaticGroupRef.current) {
      if (isLymphaticTarget) {
        lymphaticGroupRef.current.visible = true;
        if (thoracicLymphRef.current) thoracicLymphRef.current.visible = true;
        if (abdominalLymphRef.current) abdominalLymphRef.current.visible = true;
        if (lymphaticMaterialsRef.current) {
          lymphaticMaterialsRef.current.node.emissiveIntensity = 2.4;
          lymphaticMaterialsRef.current.node.color.setHex(0x34d399);
          lymphaticMaterialsRef.current.vessel.emissiveIntensity = 2.0;
        }
      } else if (isLungTarget) {
        // Show carinal, hilar, paratracheal nodes & thoracic duct
        lymphaticGroupRef.current.visible = true;
        if (thoracicLymphRef.current) thoracicLymphRef.current.visible = true;
        if (abdominalLymphRef.current) abdominalLymphRef.current.visible = false;
        if (lymphaticMaterialsRef.current) {
          lymphaticMaterialsRef.current.node.emissiveIntensity = 1.9;
          lymphaticMaterialsRef.current.vessel.emissiveIntensity = 1.6;
        }
      } else if (isAbdomenTarget) {
        // Show cisterna chyli, celiac nodes, mesenteric nodes, lumbar chains
        lymphaticGroupRef.current.visible = true;
        if (abdominalLymphRef.current) abdominalLymphRef.current.visible = true;
        if (thoracicLymphRef.current) thoracicLymphRef.current.visible = false;
        if (lymphaticMaterialsRef.current) {
          lymphaticMaterialsRef.current.node.emissiveIntensity = 1.9;
          lymphaticMaterialsRef.current.vessel.emissiveIntensity = 1.6;
        }
      } else if (isolatedPartId || isCardiacTarget || isArteryTarget || isAutonomicTarget) {
        // STRICTLY HIDE LYMPHATICS ON CARDIAC, ARTERY, AND NERVE ISOLATIONS (NO GREEN SPHERES/TUBES)
        lymphaticGroupRef.current.visible = false;
      } else {
        // Normal full body mode
        lymphaticGroupRef.current.visible = layerPeel <= 0.68;
        if (thoracicLymphRef.current) thoracicLymphRef.current.visible = true;
        if (abdominalLymphRef.current) abdominalLymphRef.current.visible = true;
        if (lymphaticMaterialsRef.current) {
          lymphaticMaterialsRef.current.node.emissiveIntensity = 0.9;
          lymphaticMaterialsRef.current.vessel.emissiveIntensity = 0.7;
        }
      }
    }

    // Ordered depth stages for Layer Peeling
    const peelOrder: SystemId[][] = [
      ['integumentary'], // 0.0 - 0.15
      ['muscular', 'sensory'], // 0.15 - 0.35
      ['connective', 'reproductive'], // 0.35 - 0.55
      ['arterial', 'venous', 'lymphatic', 'nervous'], // 0.55 - 0.75
      ['digestive', 'respiratory', 'cardiac', 'urinary', 'endocrine'], // 0.75 - 0.90
      ['skeletal'], // 0.90 - 1.00
    ];

    const peeledSystems = new Set<SystemId>();
    if (layerPeel > 0.08) peelOrder[0].forEach((s) => peeledSystems.add(s));
    if (layerPeel > 0.28) peelOrder[1].forEach((s) => peeledSystems.add(s));
    if (layerPeel > 0.48) peelOrder[2].forEach((s) => peeledSystems.add(s));
    if (layerPeel > 0.68) peelOrder[3].forEach((s) => peeledSystems.add(s));
    if (layerPeel > 0.88) peelOrder[4].forEach((s) => peeledSystems.add(s));

      const isolationBox = new THREE.Box3();

    atlas.parts.forEach((p, i) => {
      let visible = 1.0;

      if (isAutonomicTarget) {
        // Dedicated 3D autonomic group is active: show context organ (Heart) in contrasting translucent tone
        if (contextElements && contextElements.has(p.id)) {
          visible = 0.35; // Context Organ (Heart) in cool titanium-slate translucent
        } else if (p.name.toLowerCase().includes('thoracic vertebra') && (
          p.name.includes('First') || p.name.includes('Second') || p.name.includes('Third') || p.name.includes('Fourth') || p.name.includes('Fifth')
        )) {
          visible = 0.35; // subtle adjacent spine context
        } else {
          visible = 0.0;
        }
      } else if (isolatedElements && isolatedElements.size > 0) {
        // Isolation Mode: Show target elements fully, context organ in contrasting translucent color
        if (isolatedElements.has(p.id)) {
          visible = 1.0;
          isolationBox.expandByPoint(new THREE.Vector3(p.bounds[0][0], p.bounds[0][1], p.bounds[0][2]));
          isolationBox.expandByPoint(new THREE.Vector3(p.bounds[1][0], p.bounds[1][1], p.bounds[1][2]));
        } else if (contextElements && contextElements.has(p.id)) {
          visible = 0.35; // Context Organ in contrasting translucent color!
        } else {
          visible = 0.0;
        }
      } else {
        // Standard Mode: Respect manual dissection and depth peeling
        if (hiddenSet.has(p.id)) {
          visible = 0.0;
        } else if (peeledSystems.has(p.system)) {
          visible = 0.0;
        }
      }

      partData[i * 4 + 3] = visible;
    });

    partTexture.needsUpdate = true;

    // Adjust depthWrite for context organ materials so overlay vessels/nerves render without occlusion
    const materials = systemMaterialsRef.current;
    if (materials) {
      const isIsolationActive = (isolatedElements && isolatedElements.size > 0) || isAutonomicTarget;
      const cardiacMat = materials.get('cardiac');
      if (cardiacMat) {
        cardiacMat.depthWrite = !isIsolationActive;
      }
      const arterialMat = materials.get('arterial');
      if (arterialMat) {
        arterialMat.depthWrite = true;
      }
    }

    // Automatic Camera Framing onto Isolated Organ / Vessel / Nerve
    if (isAutonomicTarget && cameraRef.current && controlsRef.current) {
      const center = new THREE.Vector3(0.0, 1.345, -0.005);
      controlsRef.current.minDistance = 0.05;
      controlsRef.current.target.copy(center);
      cameraRef.current.position.set(0.0, 1.36, 0.38);
      controlsRef.current.update();
    } else if (isolatedElements && isolatedElements.size > 0 && !isolationBox.isEmpty() && cameraRef.current && controlsRef.current) {
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      isolationBox.getCenter(center);
      isolationBox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z, 0.08);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      let cameraDistance = (maxDim / 2) / Math.tan(fov / 2) * 1.65;
      cameraDistance = Math.min(Math.max(cameraDistance, 0.28), 2.4);

      controlsRef.current.minDistance = 0.05;
      controlsRef.current.target.copy(center);
      cameraRef.current.position.set(center.x, center.y + 0.015, center.z + cameraDistance);
      controlsRef.current.update();
    } else if (!isolatedPartId && cameraRef.current && controlsRef.current) {
      // Restored full body
      controlsRef.current.minDistance = 0.3;
      resetCamera(cameraPreset || 'anterior');
    }
  }, [hiddenPartIds, isolatedPartId, contextOrganId, selectedOrganId, layerPeel, modelsReady]);

  // Update GPU Selection DataTexture and 3D Selection Pointer when selectedOrganId or isolatedPartId changes
  useEffect(() => {
    const atlas = atlasRef.current;
    const selectionData = selectionDataRef.current;
    const selectionTexture = selectionTextureRef.current;
    if (!atlas || !selectionData || !selectionTexture || !modelsReady) return;

    const targetHighlight = isolatedPartId || selectedOrganId;
    const isAutonomic = targetHighlight && (
      targetHighlight.toLowerCase().includes('sympath') ||
      targetHighlight.toLowerCase().includes('cardiac plexus') ||
      targetHighlight.toLowerCase().includes('vagus')
    );
    const selectedElements = (targetHighlight && !isAutonomic) ? resolveAtlasElementIds(targetHighlight, atlas) : null;

    const box = new THREE.Box3();
    let count = 0;

    atlas.parts.forEach((p, i) => {
      const isSelected = selectedElements ? selectedElements.has(p.id) : false;
      selectionData[i * 4] = isSelected ? 255 : 0;
      if (isSelected) {
        box.expandByPoint(new THREE.Vector3(...p.bounds[0]));
        box.expandByPoint(new THREE.Vector3(...p.bounds[1]));
        count++;
      }
    });

    selectionTexture.needsUpdate = true;

    // Keep 3D scene clean without cartoon pointer rings or cones
    if (selectionPointerRef.current) {
      selectionPointerRef.current.visible = false;
    }
  }, [selectedOrganId, isolatedPartId, modelsReady]);

  // Update X-Ray Material Ghost Opacity
  useEffect(() => {
    const materials = systemMaterialsRef.current;
    materials.forEach((mat, sysId) => {
      if (isXray) {
        mat.opacity = 0.16;
        mat.depthWrite = false;
      } else {
        mat.opacity = sysId === 'integumentary' ? 0.12 : 1.0;
        mat.depthWrite = sysId !== 'integumentary';
      }
      mat.needsUpdate = true;
    });
  }, [isXray]);

  // Camera Presets
  const resetCamera = (preset: 'anterior' | 'head' | 'thorax' | 'abdomen') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const isMob = window.innerWidth < 640;

    switch (preset) {
      case 'anterior':
        cameraRef.current.position.set(0, 0.85, isMob ? 3.4 : 2.8);
        controlsRef.current.target.set(0, 0.85, 0);
        break;
      case 'head':
        cameraRef.current.position.set(0, 1.55, isMob ? 1.05 : 0.85);
        controlsRef.current.target.set(0, 1.55, 0);
        break;
      case 'thorax':
        cameraRef.current.position.set(0, 1.25, isMob ? 1.3 : 1.05);
        controlsRef.current.target.set(0, 1.25, 0);
        break;
      case 'abdomen':
        cameraRef.current.position.set(0.04, 0.95, isMob ? 1.25 : 1.00);
        controlsRef.current.target.set(0.04, 0.95, 0);
        break;
    }
    controlsRef.current.update();
  };

  useEffect(() => {
    if (cameraPreset) {
      resetCamera(cameraPreset);
    }
  }, [cameraPreset]);

  return (
    <div
      className={`relative w-full h-full min-h-[380px] md:min-h-[460px] rounded-2xl md:rounded-3xl overflow-hidden border ${
        isLight ? 'bg-slate-50 border-slate-200/80 shadow-md' : 'bg-[#070b14] border-slate-800 shadow-2xl'
      }`}
    >
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Progress Bar */}
      {!modelsReady && (
        <div
          className={`absolute inset-0 z-20 backdrop-blur-md flex flex-col items-center justify-center space-y-3 ${
            isLight ? 'bg-white/90 text-slate-800' : 'bg-slate-950/85 text-cyan-300'
          }`}
        >
          <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
          <div className="font-mono text-xs font-semibold tracking-wider">
            LOADING BODYPARTS3D 4.0 ATLAS ({loadProgress}%)
          </div>
          <div className={`w-48 h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            2,234 Anatomically Registered Parts • CC BY 4.0
          </div>
        </div>
      )}

      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none gap-2">
        {/* Camera Presets Segmented Pill */}
        <div
          className={`pointer-events-auto flex items-center gap-1 p-1 rounded-2xl border backdrop-blur-xl text-xs transition-all ${
            isLight
              ? 'bg-white/90 text-slate-700 border-slate-200/90 shadow-sm'
              : 'bg-slate-900/90 text-slate-300 border-slate-800 shadow-lg'
          }`}
        >
          <div
            className={`font-bold flex items-center gap-1 px-2 text-[11px] ${
              isLight ? 'text-sky-700' : 'text-cyan-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            <span className="hidden sm:inline">Camera:</span>
          </div>
          <button
            onClick={() => resetCamera('anterior')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              cameraPreset === 'anterior'
                ? isLight
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                : isLight
                ? 'hover:bg-slate-100 text-slate-700'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            Full
          </button>
          <button
            onClick={() => resetCamera('head')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              cameraPreset === 'head'
                ? isLight
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                : isLight
                ? 'hover:bg-slate-100 text-slate-700'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            Head
          </button>
          <button
            onClick={() => resetCamera('thorax')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              cameraPreset === 'thorax'
                ? isLight
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                : isLight
                ? 'hover:bg-slate-100 text-slate-700'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            Thorax
          </button>
          <button
            onClick={() => resetCamera('abdomen')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              cameraPreset === 'abdomen'
                ? isLight
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                : isLight
                ? 'hover:bg-slate-100 text-slate-700'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            Abdomen
          </button>
        </div>

        {/* Right Info Pill with Active Dissection Indicator */}
        <div
          className={`pointer-events-auto hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border backdrop-blur-xl text-xs font-mono font-bold ${
            toolMode === 'scalpel'
              ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-md animate-pulse'
              : isLight
              ? 'bg-white/90 text-slate-700 border-slate-200/90 shadow-sm'
              : 'bg-slate-900/90 text-cyan-400 border-slate-800 shadow-lg'
          }`}
        >
          {toolMode === 'scalpel' ? (
            <>
              <Scissors className="w-3.5 h-3.5 text-rose-600" />
              <span>SCALPEL ACTIVE (TAP TO CUT)</span>
            </>
          ) : (
            <>
              <span>BODYPARTS3D ATLAS</span>
              <span className="text-slate-400 font-normal">| 2,234 Parts</span>
            </>
          )}
        </div>
      </div>

      {/* Bottom Floating Hover Tooltip */}
      {hoveredPart && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          <div
            className={`px-3 py-1.5 rounded-2xl border backdrop-blur-xl text-xs font-mono flex items-center gap-2 ${
              isLight
                ? 'bg-white/95 border-slate-200 text-slate-800 shadow-lg'
                : 'bg-slate-900/95 border-slate-800 text-slate-200 shadow-slate-950/60'
            }`}
          >
            {toolMode === 'scalpel' ? (
              <Scissors className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            ) : (
              <Hand className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            )}
            <span className="font-bold text-sky-700 dark:text-sky-400">{hoveredPart.name}</span>
            <span className="text-slate-400">({hoveredPart.system})</span>
            {toolMode === 'scalpel' && <span className="text-rose-600 font-bold">• Click to Dissect</span>}
          </div>
        </div>
      )}
    </div>
  );
};
