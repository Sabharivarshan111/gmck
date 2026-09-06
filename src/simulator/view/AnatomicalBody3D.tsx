import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AnatomicalLayer, PatientPathologyState, PatientVitals } from '../types';

interface AnatomicalBody3DProps {
  vitals: PatientVitals;
  pathology: PatientPathologyState;
  layer: AnatomicalLayer;
  scenarioId: string;
  onSelectOrgan?: (organ: { name: string; description: string; clinicalSign: string }) => void;
}

export const AnatomicalBody3D: React.FC<AnatomicalBody3DProps> = ({
  vitals,
  pathology,
  layer,
  scenarioId,
  onSelectOrgan,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedOrganInfo, setSelectedOrganInfo] = useState<{
    name: string;
    description: string;
    clinicalSign: string;
  } | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Animated organ references
  const heartGroupRef = useRef<THREE.Group | null>(null);
  const leftLungMeshRef = useRef<THREE.Mesh | null>(null);
  const rightLungMeshRef = useRef<THREE.Mesh | null>(null);
  const vascularGroupRef = useRef<THREE.Group | null>(null);
  const visceraGroupRef = useRef<THREE.Group | null>(null);
  const skeletalGroupRef = useRef<THREE.Group | null>(null);
  const skinGroupRef = useRef<THREE.Group | null>(null);
  const ascitesMeshRef = useRef<THREE.Mesh | null>(null);
  const liverMeshRef = useRef<THREE.Mesh | null>(null);
  const traumaMarkerRef = useRef<THREE.Group | null>(null);
  const pulseParticlesRef = useRef<THREE.Points | null>(null);

  const animTimeRef = useRef<number>(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // --- 1. Scene & Camera ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.15, 4.4);
    cameraRef.current = camera;

    // --- 2. Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- 3. OrbitControls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.2;
    controls.maxDistance = 7.5;
    controls.target.set(0, 0.05, 0);
    controlsRef.current = controls;

    // --- 4. Lighting Rig ---
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const rimLight1 = new THREE.DirectionalLight(0x00e5ff, 3.5);
    rimLight1.position.set(-4, 2, -3);
    scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0x7c4dff, 2.0);
    rimLight2.position.set(4, -2, -3);
    scene.add(rimLight2);

    const heartLight = new THREE.PointLight(0xff1744, 3.0, 2.5);
    heartLight.position.set(-0.10, 0.45, 0.35);
    scene.add(heartLight);

    // High-tech holographic floor grid with subtle glow
    const gridHelper = new THREE.GridHelper(7, 28, 0x00e5ff, 0x1e293b);
    gridHelper.position.y = -2.1;
    scene.add(gridHelper);

    // --- 5. Groups ---
    const skinGroup = new THREE.Group();
    const visceraGroup = new THREE.Group();
    const vascularGroup = new THREE.Group();
    const skeletalGroup = new THREE.Group();

    skinGroupRef.current = skinGroup;
    visceraGroupRef.current = visceraGroup;
    vascularGroupRef.current = vascularGroup;
    skeletalGroupRef.current = skeletalGroup;

    scene.add(skinGroup);
    scene.add(visceraGroup);
    scene.add(vascularGroup);
    scene.add(skeletalGroup);

    // ==========================================
    // A. FUTURISTIC SCULPTED HUMAN SILHOUETTE
    // ==========================================
    const bodyGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      roughness: 0.12,
      metalness: 0.15,
      transmission: 0.88,
      ior: 1.48,
      transparent: true,
      opacity: 0.55,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    });

    // Cranium / Head (sculpted cranial vault & mandible)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.38, 0);

    const craniumGeo = new THREE.SphereGeometry(0.26, 32, 32);
    craniumGeo.scale(1.0, 1.22, 1.15);
    const craniumMesh = new THREE.Mesh(craniumGeo, bodyGlassMat);
    headGroup.add(craniumMesh);

    // Facial slope & chin
    const jawGeo = new THREE.CylinderGeometry(0.14, 0.08, 0.22, 16);
    jawGeo.scale(1.0, 1.0, 0.9);
    const jawMesh = new THREE.Mesh(jawGeo, bodyGlassMat);
    jawMesh.position.set(0, -0.16, 0.06);
    headGroup.add(jawMesh);

    headGroup.userData = {
      name: 'Cranium & Cerebrum',
      desc: 'Houses 86 billion neurons, circle of Willis arterial ring, and cardiorespiratory autonomic centers.',
      sign: 'GCS assessment, pupillary reflexes (CN II/III), facial nerve symmetry (CN VII).',
    };
    skinGroup.add(headGroup);

    // Cervical Neck
    const neckGeo = new THREE.CylinderGeometry(0.13, 0.17, 0.26, 24);
    const neckMesh = new THREE.Mesh(neckGeo, bodyGlassMat);
    neckMesh.position.set(0, 1.05, 0.01);
    neckMesh.userData = {
      name: 'Cervical Spine & Carotid Sheath',
      desc: 'Contains common carotid arteries, internal jugular veins, vagus nerve, and cervical spinal cord.',
      sign: 'Jugular Venous Pressure (JVP) elevation (>3cm above sternal angle in RV failure); carotid bruits.',
    };
    skinGroup.add(neckMesh);

    // Shoulders / Clavicular Girdle
    const shoulderGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.15, 24);
    shoulderGeo.rotateZ(Math.PI / 2);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, bodyGlassMat);
    shoulderMesh.position.set(0, 0.86, 0);
    skinGroup.add(shoulderMesh);

    // Sculpted Thorax (Tapered chest with pectoral contour)
    const chestGeo = new THREE.CylinderGeometry(0.44, 0.36, 0.55, 32);
    chestGeo.scale(1.15, 1.0, 0.85);
    const chestMesh = new THREE.Mesh(chestGeo, bodyGlassMat);
    chestMesh.position.set(0, 0.58, 0.02);
    chestMesh.userData = {
      name: 'Thoracic Cage & Mediastinum',
      desc: 'Encloses cardiopulmonary viscera, pericardial sac, and thoracic aorta.',
      sign: 'Apex beat in 5th left intercostal space midclavicular line; bilateral vesicular breath sounds.',
    };
    skinGroup.add(chestMesh);

    // Abdomen & Waist (narrower waist tapering into pelvic crest)
    const abdomenGeo = new THREE.CylinderGeometry(0.36, 0.40, 0.52, 32);
    abdomenGeo.scale(1.1, 1.0, 0.82);
    const abdomenMesh = new THREE.Mesh(abdomenGeo, bodyGlassMat);
    abdomenMesh.position.set(0, 0.06, 0.01);
    abdomenMesh.userData = {
      name: 'Peritoneal Cavity & Viscera',
      desc: 'Hepatosplenorenal visceral compartment bounded superiorly by the respiratory diaphragm.',
      sign: 'Superficial and deep palpation for hepatomegaly, splenomegaly, shifting dullness in ascites.',
    };
    skinGroup.add(abdomenMesh);

    // Pelvis & Gluteal Crest
    const pelvisGeo = new THREE.CylinderGeometry(0.40, 0.34, 0.38, 28);
    pelvisGeo.scale(1.12, 1.0, 0.88);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, bodyGlassMat);
    pelvisMesh.position.set(0, -0.36, 0);
    skinGroup.add(pelvisMesh);

    // Sculpted Limbs (Arms)
    const createArm = (isLeft: boolean) => {
      const armGroup = new THREE.Group();
      const xSign = isLeft ? -1 : 1;

      // Deltoid
      const deltoidGeo = new THREE.SphereGeometry(0.14, 20, 20);
      const deltoid = new THREE.Mesh(deltoidGeo, bodyGlassMat);
      deltoid.position.set(xSign * 0.58, 0.82, 0);
      armGroup.add(deltoid);

      // Brachium (Upper Arm)
      const brachGeo = new THREE.CylinderGeometry(0.10, 0.08, 0.52, 20);
      const brach = new THREE.Mesh(brachGeo, bodyGlassMat);
      brach.position.set(xSign * 0.64, 0.52, 0);
      brach.rotation.z = xSign * 0.16;
      armGroup.add(brach);

      // Antebrachium (Forearm)
      const foreGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.50, 20);
      const fore = new THREE.Mesh(foreGeo, bodyGlassMat);
      fore.position.set(xSign * 0.74, 0.04, 0);
      fore.rotation.z = xSign * 0.12;
      armGroup.add(fore);

      return armGroup;
    };
    skinGroup.add(createArm(true));
    skinGroup.add(createArm(false));

    // Sculpted Limbs (Legs)
    const createLeg = (isLeft: boolean) => {
      const legGroup = new THREE.Group();
      const xSign = isLeft ? -1 : 1;

      // Thigh (Femoral contour)
      const thighGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.72, 24);
      const thigh = new THREE.Mesh(thighGeo, bodyGlassMat);
      thigh.position.set(xSign * 0.22, -0.82, 0);
      legGroup.add(thigh);

      // Knee joint
      const kneeGeo = new THREE.SphereGeometry(0.11, 16, 16);
      const knee = new THREE.Mesh(kneeGeo, bodyGlassMat);
      knee.position.set(xSign * 0.22, -1.20, 0.02);
      legGroup.add(knee);

      // Calf (Gastrocnemius bulge)
      const calfGeo = new THREE.CylinderGeometry(0.13, 0.09, 0.75, 24);
      const calf = new THREE.Mesh(calfGeo, bodyGlassMat);
      calf.position.set(xSign * 0.22, -1.62, 0);
      calf.userData = {
        name: isLeft ? 'Left Lower Limb' : 'Right Lower Limb',
        desc: 'Musculofascial leg compartments (anterior, lateral, posterior) enclosing neurovascular bundles.',
        sign: 'Pedal edema grading (pitting over medial malleolus / tibia); capillary refill time (<2 sec).',
      };
      legGroup.add(calf);

      return legGroup;
    };
    skinGroup.add(createLeg(true));
    skinGroup.add(createLeg(false));

    // ==========================================
    // B. ANATOMICALLY DETAILED INTERNAL VISCERA
    // ==========================================
    // 1. Pulsating 3D Heart (Dual Ventricles & Atria)
    const heartGroup = new THREE.Group();
    heartGroup.position.set(-0.08, 0.54, 0.12);

    const lvGeo = new THREE.SphereGeometry(0.14, 24, 24);
    lvGeo.scale(0.9, 1.3, 0.85);
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.3,
      metalness: 0.15,
      emissive: 0x991b1b,
      emissiveIntensity: 0.55,
    });
    const lvMesh = new THREE.Mesh(lvGeo, heartMat);
    lvMesh.position.set(-0.04, -0.04, 0);
    lvMesh.rotation.z = 0.22;
    heartGroup.add(lvMesh);

    // Right Ventricle / Outflow tract
    const rvGeo = new THREE.SphereGeometry(0.12, 24, 24);
    rvGeo.scale(0.85, 1.1, 0.8);
    const rvMesh = new THREE.Mesh(rvGeo, heartMat);
    rvMesh.position.set(0.06, -0.02, 0.03);
    heartGroup.add(rvMesh);

    heartGroup.userData = {
      name: 'Cardiac Ventricles & Atria',
      desc: 'Biventricular muscular pump. Left ventricle generates mean arterial pressure; right ventricle perfuses pulmonary bed.',
      sign: 'S1-S2 heart sounds; S3 gallop in volume overload; ischemic ST-elevation on 12-lead ECG.',
    };
    visceraGroup.add(heartGroup);
    heartGroupRef.current = heartGroup;

    // 2. Sculpted Lungs (Left and Right)
    const lungMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.45,
      transparent: true,
      opacity: 0.72,
      emissive: 0x0e7490,
      emissiveIntensity: 0.25,
    });

    // Left Lung (with cardiac notch indentation)
    const leftLungGeo = new THREE.SphereGeometry(0.18, 24, 24);
    leftLungGeo.scale(0.85, 1.6, 0.85);
    const leftLung = new THREE.Mesh(leftLungGeo, lungMat);
    leftLung.position.set(-0.28, 0.55, 0.04);
    leftLung.userData = {
      name: 'Left Lung (Superior & Inferior Lobes)',
      desc: 'Contains bronchial tree, pulmonary capillaries, and alveoli for PaO2/PaCO2 diffusion.',
      sign: 'Normal vesicular breath sounds; diffuse expiratory wheezing in bronchospasm.',
    };
    visceraGroup.add(leftLung);
    leftLungMeshRef.current = leftLung;

    // Right Lung (Trilobed)
    const rightLungGeo = new THREE.SphereGeometry(0.20, 24, 24);
    rightLungGeo.scale(0.95, 1.6, 0.9);
    const rightLung = new THREE.Mesh(rightLungGeo, lungMat);
    rightLung.position.set(0.28, 0.55, 0.04);
    rightLung.userData = {
      name: 'Right Lung (Superior, Middle, Inferior Lobes)',
      desc: 'Larger pulmonary volume (55% total). Auscultated anteriorly, laterally, and posteriorly.',
      sign: 'Percussion note resonant; fine inspiratory crackles (crepitations) in pulmonary edema/shock.',
    };
    visceraGroup.add(rightLung);
    rightLungMeshRef.current = rightLung;

    // 3. Liver (Right & Left Lobes under right hemidiaphragm)
    const liverGeo = new THREE.SphereGeometry(0.23, 24, 24);
    liverGeo.scale(1.45, 0.75, 0.88);
    const liverMat = new THREE.MeshStandardMaterial({
      color: 0x92400e,
      roughness: 0.4,
      metalness: 0.1,
      emissive: 0x451a03,
      emissiveIntensity: 0.25,
    });
    const liverMesh = new THREE.Mesh(liverGeo, liverMat);
    liverMesh.position.set(0.18, 0.16, 0.08);
    liverMesh.rotation.z = -0.18;
    liverMesh.userData = {
      name: 'Liver (Couinaud Segments I - VIII)',
      desc: 'Metabolic synthesis of albumin, prothrombin (INR), urea, and bile clearance of bilirubin.',
      sign: 'Liver span measurement in midclavicular line (normal 8-12 cm); icteric jaundice; asterixis flap.',
    };
    visceraGroup.add(liverMesh);
    liverMeshRef.current = liverMesh;

    // 4. Kidneys (Retroperitoneal)
    const kidneyGeo = new THREE.SphereGeometry(0.10, 20, 20);
    kidneyGeo.scale(0.85, 1.3, 0.75);
    const kidneyMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.45 });

    const leftKidney = new THREE.Mesh(kidneyGeo, kidneyMat);
    leftKidney.position.set(-0.24, -0.06, -0.08);
    leftKidney.userData = {
      name: 'Left Kidney',
      desc: '1 million nephrons regulating GFR, sodium-water balance, and renin-angiotensin-aldosterone axis.',
      sign: 'Urine output monitoring (>0.5 mL/kg/h); renal angle tenderness in pyelonephritis.',
    };
    visceraGroup.add(leftKidney);

    const rightKidney = new THREE.Mesh(kidneyGeo, kidneyMat);
    rightKidney.position.set(0.24, -0.10, -0.08);
    rightKidney.userData = {
      name: 'Right Kidney',
      desc: 'Retroperitoneal excretory organ positioned lower due to hepatic mass.',
      sign: 'Bimanual ballotment technique.',
    };
    visceraGroup.add(rightKidney);

    // 5. Ascites Peritoneal Fluid Reservoir
    const ascitesGeo = new THREE.SphereGeometry(0.36, 24, 24);
    ascitesGeo.scale(1.15, 0.78, 1.05);
    const ascitesMat = new THREE.MeshPhysicalMaterial({
      color: 0xfacc15,
      transmission: 0.8,
      roughness: 0.12,
      transparent: true,
      opacity: 0.6,
      emissive: 0xca8a04,
      emissiveIntensity: 0.35,
    });
    const ascitesMesh = new THREE.Mesh(ascitesGeo, ascitesMat);
    ascitesMesh.position.set(0, -0.10, 0.06);
    ascitesMesh.visible = false;
    ascitesMesh.userData = {
      name: 'Peritoneal Ascitic Collection',
      desc: 'Transudative fluid collection driven by sinusoidal portal hypertension and hypoalbuminemia.',
      sign: 'Shifting dullness (>1500 mL) and fluid thrill (>2000 mL); therapeutic paracentesis with albumin.',
    };
    visceraGroup.add(ascitesMesh);
    ascitesMeshRef.current = ascitesMesh;

    // ==========================================
    // C. GLOWING VASCULAR NETWORK & PULSE WAVE
    // ==========================================
    const arterialMat = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      emissive: 0xd50000,
      emissiveIntensity: 0.85,
      roughness: 0.25,
    });

    const venousMat = new THREE.MeshStandardMaterial({
      color: 0x0070f3,
      emissive: 0x0050c0,
      emissiveIntensity: 0.75,
      roughness: 0.3,
    });

    // Aorta & Arterial branches
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.06, 0.62, 0.10), // LV Outflow tract
      new THREE.Vector3(-0.04, 0.78, 0.08), // Ascending aorta
      new THREE.Vector3(0.00, 0.82, 0.02),  // Aortic arch
      new THREE.Vector3(0.02, 0.45, -0.04), // Thoracic descending
      new THREE.Vector3(0.02, -0.15, -0.04),// Abdominal aorta
      new THREE.Vector3(0.11, -0.42, 0.01), // Right common iliac
      new THREE.Vector3(0.22, -0.85, 0.04), // Right femoral
      new THREE.Vector3(0.22, -1.60, 0.02), // Posterior tibial / dorsalis pedis
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 50, 0.026, 12, false);
    const aortaMesh = new THREE.Mesh(aortaGeo, arterialMat);
    aortaMesh.userData = {
      name: 'Aorta & Systemic Arteries',
      desc: 'High-pressure conduit delivering oxygenated stroke volume (Windkessel compliance).',
      sign: 'Synchronous radial and femoral pulses; absence of radio-femoral delay.',
    };
    vascularGroup.add(aortaMesh);

    // Left iliac & femoral
    const leftIliacCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, -0.15, -0.04),
      new THREE.Vector3(-0.11, -0.42, 0.01),
      new THREE.Vector3(-0.22, -0.85, 0.04),
      new THREE.Vector3(-0.22, -1.60, 0.02),
    ]);
    const leftIliacGeo = new THREE.TubeGeometry(leftIliacCurve, 40, 0.024, 12, false);
    const leftIliacMesh = new THREE.Mesh(leftIliacGeo, arterialMat);
    vascularGroup.add(leftIliacMesh);

    // Carotid arteries (ascending to brain)
    const carotidCurveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, 0.82, 0.02),
      new THREE.Vector3(-0.08, 1.05, 0.04),
      new THREE.Vector3(-0.08, 1.30, 0.02),
    ]);
    const carotidGeoL = new THREE.TubeGeometry(carotidCurveL, 20, 0.016, 10, false);
    vascularGroup.add(new THREE.Mesh(carotidGeoL, arterialMat));

    const carotidCurveR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, 0.82, 0.02),
      new THREE.Vector3(0.08, 1.05, 0.04),
      new THREE.Vector3(0.08, 1.30, 0.02),
    ]);
    const carotidGeoR = new THREE.TubeGeometry(carotidCurveR, 20, 0.016, 10, false);
    vascularGroup.add(new THREE.Mesh(carotidGeoR, arterialMat));

    // Vena Cava (IVC & SVC)
    const ivcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.06, 0.54, 0.10),  // Right atrium entry
      new THREE.Vector3(0.06, 0.20, -0.03), // Thoracic IVC
      new THREE.Vector3(0.06, -0.18, -0.03),// Abdominal IVC
      new THREE.Vector3(0.16, -0.42, 0.01), // Right iliac vein
    ]);
    const ivcGeo = new THREE.TubeGeometry(ivcCurve, 30, 0.030, 12, false);
    const ivcMesh = new THREE.Mesh(ivcGeo, venousMat);
    ivcMesh.userData = {
      name: 'Vena Cava & Central Venous System',
      desc: 'Capacitance reservoir maintaining right atrial preload and cardiac venous return.',
      sign: 'Central Venous Pressure (CVP) monitoring; hepatojugular reflux.',
    };
    vascularGroup.add(ivcMesh);

    // ==========================================
    // D. SKELETAL SYSTEM (X-RAY LAYER)
    // ==========================================
    const boneMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.35,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });

    // Vertebral Column
    for (let i = 0; i < 16; i++) {
      const vertGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.035, 12);
      const vertMesh = new THREE.Mesh(vertGeo, boneMat);
      vertMesh.position.set(0, 0.95 - i * 0.07, -0.10);
      skeletalGroup.add(vertMesh);
    }

    // Ribs
    for (let r = 0; r < 8; r++) {
      const ribRadius = 0.34 + (r < 4 ? r * 0.025 : (7 - r) * 0.02);
      const ribGeo = new THREE.TorusGeometry(ribRadius, 0.014, 8, 24, Math.PI * 1.32);
      const rib = new THREE.Mesh(ribGeo, boneMat);
      rib.position.set(0, 0.78 - r * 0.072, 0);
      rib.rotation.x = Math.PI / 2 + 0.14;
      rib.rotation.z = -Math.PI * 0.16;
      skeletalGroup.add(rib);
    }

    // Sternum
    const sternumGeo = new THREE.BoxGeometry(0.08, 0.38, 0.022);
    const sternumMesh = new THREE.Mesh(sternumGeo, boneMat);
    sternumMesh.position.set(0, 0.58, 0.26);
    sternumMesh.userData = {
      name: 'Sternum & Costal Cartilages',
      desc: 'Anterior boundary of anterior mediastinum. CPR chest compression landmark.',
      sign: 'Sternal angle (Angle of Louis) for intercostal counting and JVP baseline.',
    };
    skeletalGroup.add(sternumMesh);

    // ==========================================
    // E. TRAUMA BITE MARKER (SNAKEBITE)
    // ==========================================
    const traumaGroup = new THREE.Group();
    traumaGroup.position.set(0.22, -1.52, 0.10);

    const fangGeo = new THREE.SphereGeometry(0.018, 12, 12);
    const fangMat = new THREE.MeshBasicMaterial({ color: 0xb91c1c });
    const fang1 = new THREE.Mesh(fangGeo, fangMat);
    fang1.position.set(-0.018, 0, 0);
    const fang2 = new THREE.Mesh(fangGeo, fangMat);
    fang2.position.set(0.018, 0, 0);
    traumaGroup.add(fang1);
    traumaGroup.add(fang2);

    const haloGeo = new THREE.RingGeometry(0.03, 0.15, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    traumaGroup.add(haloMesh);

    traumaGroup.userData = {
      name: "Russell's Viper Bite Puncture Site",
      desc: 'Paired fang punctures on anteromedial calf with rapid local edema, persistent hemorrhagic oozing, and blister formation.',
      sign: 'Incoagulable 20-minute Whole Blood Clotting Test (20WBCT); indicator for 10 vials polyvalent ASV.',
    };
    scene.add(traumaGroup);
    traumaMarkerRef.current = traumaGroup;

    // --- 6. Raycasting on organ click ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const interactiveObjects: THREE.Object3D[] = [];
      scene.traverse((obj) => {
        if (obj.userData && obj.userData.name) {
          interactiveObjects.push(obj);
        }
      });

      const intersects = raycaster.intersectObjects(interactiveObjects, true);
      if (intersects.length > 0) {
        let hit: THREE.Object3D | null = intersects[0].object;
        while (hit && (!hit.userData || !hit.userData.name) && hit.parent) {
          hit = hit.parent;
        }

        if (hit && hit.userData && hit.userData.name) {
          const info = {
            name: hit.userData.name,
            description: hit.userData.desc || '',
            clinicalSign: hit.userData.sign || '',
          };
          setSelectedOrganInfo(info);
          if (onSelectOrgan) onSelectOrgan(info);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // --- 7. Animation Loop ---
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      animTimeRef.current += dt;

      controls.update();

      const hrFreq = vitals.heartRate / 60;
      const cardiacPhase = (animTimeRef.current * 2 * Math.PI * hrFreq) % (2 * Math.PI);

      const rrFreq = vitals.respiratoryRate / 60;
      const respPhase = (animTimeRef.current * 2 * Math.PI * rrFreq) % (2 * Math.PI);

      // Heart systole/diastole squeeze
      if (heartGroupRef.current) {
        const squeeze = 1.0 + 0.14 * Math.sin(cardiacPhase);
        heartGroupRef.current.scale.set(squeeze, squeeze * 1.08, squeeze);
      }

      // Lung respiration
      if (leftLungMeshRef.current && rightLungMeshRef.current) {
        const lungScale = 1.0 + 0.10 * Math.sin(respPhase);
        leftLungMeshRef.current.scale.set(0.85 * lungScale, 1.6 * lungScale, 0.85 * lungScale);
        rightLungMeshRef.current.scale.set(0.95 * lungScale, 1.6 * lungScale, 0.9 * lungScale);
      }

      // Vascular pulse glow
      const pulse = 0.5 + 0.5 * Math.sin(cardiacPhase);
      arterialMat.emissiveIntensity = 0.5 + 0.6 * pulse;

      // Subtle chest breathing motion
      chestMesh.scale.x = 1.15 + 0.02 * Math.sin(respPhase);
      chestMesh.scale.z = 0.85 + 0.03 * Math.sin(respPhase);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Sync Layers and Pathology Shaders
  useEffect(() => {
    if (!skinGroupRef.current || !visceraGroupRef.current || !vascularGroupRef.current || !skeletalGroupRef.current) return;

    skinGroupRef.current.visible = true;
    visceraGroupRef.current.visible = true;
    vascularGroupRef.current.visible = true;
    skeletalGroupRef.current.visible = true;

    switch (layer) {
      case 'skin':
        skinGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            child.material.transmission = 0.05;
            child.material.opacity = 0.96;
            const r = 0.85 - pathology.cyanosis * 0.35 + pathology.jaundice * 0.15;
            const g = 0.65 - pathology.cyanosis * 0.20 + pathology.jaundice * 0.20 - pathology.pallor * 0.15;
            const b = 0.55 + pathology.cyanosis * 0.30 - pathology.jaundice * 0.30 - pathology.pallor * 0.15;
            child.material.color.setRGB(r, g, b);
          }
        });
        visceraGroupRef.current.visible = false;
        vascularGroupRef.current.visible = false;
        skeletalGroupRef.current.visible = false;
        break;

      case 'glass':
        skinGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            child.material.transmission = 0.88;
            child.material.opacity = 0.55;
            child.material.color.setHex(0x38bdf8);
          }
        });
        visceraGroupRef.current.visible = true;
        vascularGroupRef.current.visible = true;
        skeletalGroupRef.current.visible = false;
        break;

      case 'vascular':
        skinGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            child.material.transmission = 0.94;
            child.material.opacity = 0.20;
          }
        });
        visceraGroupRef.current.visible = false;
        vascularGroupRef.current.visible = true;
        skeletalGroupRef.current.visible = false;
        break;

      case 'viscera':
        skinGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            child.material.transmission = 0.92;
            child.material.opacity = 0.22;
          }
        });
        visceraGroupRef.current.visible = true;
        vascularGroupRef.current.visible = false;
        skeletalGroupRef.current.visible = false;
        break;

      case 'skeletal':
        skinGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            child.material.transmission = 0.96;
            child.material.opacity = 0.14;
          }
        });
        visceraGroupRef.current.visible = false;
        vascularGroupRef.current.visible = false;
        skeletalGroupRef.current.visible = true;
        break;
    }

    // Dynamic Ascites
    if (ascitesMeshRef.current) {
      if (pathology.ascites > 0.05) {
        ascitesMeshRef.current.visible = true;
        const scale = 0.8 + pathology.ascites * 0.5;
        ascitesMeshRef.current.scale.set(scale, scale * 0.85, scale);
      } else {
        ascitesMeshRef.current.visible = false;
      }
    }

    // Dynamic Liver Cirrhosis / Jaundice
    if (liverMeshRef.current && liverMeshRef.current.material instanceof THREE.MeshStandardMaterial) {
      if (pathology.jaundice > 0.4) {
        liverMeshRef.current.material.color.setHex(0x84cc16); // Jaundiced greenish-yellow
      } else {
        liverMeshRef.current.material.color.setHex(0x92400e); // Natural hepatic reddish-brown
      }
    }

    // Snakebite bite site
    if (traumaMarkerRef.current) {
      traumaMarkerRef.current.visible = scenarioId === 'snakebite';
    }
  }, [layer, pathology, scenarioId]);

  const resetCamera = (preset: 'anterior' | 'thorax' | 'abdomen') => {
    if (!cameraRef.current || !controlsRef.current) return;
    switch (preset) {
      case 'anterior':
        cameraRef.current.position.set(0, 0.15, 4.4);
        controlsRef.current.target.set(0, 0.05, 0);
        break;
      case 'thorax':
        cameraRef.current.position.set(0, 0.55, 2.1);
        controlsRef.current.target.set(0, 0.50, 0);
        break;
      case 'abdomen':
        cameraRef.current.position.set(0, -0.15, 2.1);
        controlsRef.current.target.set(0, -0.15, 0);
        break;
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Camera Presets */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-300">
        <span className="font-semibold text-cyan-400 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Camera:
        </span>
        <button
          onClick={() => resetCamera('anterior')}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
        >
          Full Body
        </button>
        <button
          onClick={() => resetCamera('thorax')}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
        >
          Thorax & Heart
        </button>
        <button
          onClick={() => resetCamera('abdomen')}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
        >
          Abdomen & Pelvis
        </button>
      </div>

      {/* Selected Organ Inspection Card */}
      {selectedOrganInfo && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-md z-10 bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-cyan-500/50 shadow-2xl text-left animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <h4 className="font-bold text-cyan-400 text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
              {selectedOrganInfo.name}
            </h4>
            <button
              onClick={() => setSelectedOrganInfo(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-300 mb-2 leading-relaxed">{selectedOrganInfo.description}</p>
          <div className="text-[11px] bg-cyan-950/50 border border-cyan-800/50 p-2.5 rounded-lg text-cyan-300">
            <span className="font-bold text-cyan-200">Clinical Bedside Sign: </span>
            {selectedOrganInfo.clinicalSign}
          </div>
        </div>
      )}

      {/* Helper text */}
      <div className="absolute top-4 right-4 z-10 text-[11px] bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-800 text-slate-400 pointer-events-none">
        Click any organ to inspect • Drag to rotate 3D
      </div>
    </div>
  );
};
