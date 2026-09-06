import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnatomicalLayer, PatientPathologyState, PatientVitals } from '../types';

interface AnatomicalBody3DProps {
  vitals: PatientVitals;
  pathology: PatientPathologyState;
  layer: AnatomicalLayer;
  scenarioId: string;
  cameraPreset?: 'anterior' | 'head' | 'thorax' | 'abdomen';
  onSelectOrgan?: (organ: { name: string; description: string; clinicalSign: string }) => void;
}

// Utility to center any loaded model to (0,0,0) and scale to target height
function createNormalizedModelWrapper(object: THREE.Object3D, targetHeight: number): THREE.Group {
  const centeringGroup = new THREE.Group();
  centeringGroup.name = 'centeringGroup';
  centeringGroup.add(object);

  // Compute bounding box of object inside centeringGroup
  centeringGroup.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(centeringGroup);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Shift object inside centeringGroup so its geometric center is at (0,0,0)
  object.position.sub(center);
  centeringGroup.updateMatrixWorld(true);

  const maxDim = Math.max(size.y, size.x, size.z, 0.001);
  const baseScale = targetHeight / maxDim;
  centeringGroup.scale.set(baseScale, baseScale, baseScale);

  // Outer wrapper group handles positioning, rotation, and dynamic animation modulation
  const wrapper = new THREE.Group();
  wrapper.name = 'normalizedWrapper';
  wrapper.userData = {
    baseScale,
    centeringGroup,
    originalSize: size,
  };
  wrapper.add(centeringGroup);

  return wrapper;
}

export const AnatomicalBody3D: React.FC<AnatomicalBody3DProps> = ({
  vitals,
  pathology,
  layer,
  scenarioId,
  cameraPreset,
  onSelectOrgan,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedOrganInfo, setSelectedOrganInfo] = useState<{
    name: string;
    description: string;
    clinicalSign: string;
  } | null>(null);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [modelsReady, setModelsReady] = useState<boolean>(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Model References
  const humanBodyWrapperRef = useRef<THREE.Group | null>(null);
  const humanBodyMaterialsRef = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const heartWrapperRef = useRef<THREE.Group | null>(null);
  const lungsWrapperRef = useRef<THREE.Group | null>(null);
  const liverWrapperRef = useRef<THREE.Group | null>(null);
  const brainWrapperRef = useRef<THREE.Group | null>(null);
  const vascularGroupRef = useRef<THREE.Group | null>(null);
  const skeletalGroupRef = useRef<THREE.Group | null>(null);
  const kidneyWrapperRef = useRef<THREE.Group | null>(null);
  const skeletalWrapperRef = useRef<THREE.Group | null>(null);
  const ascitesMeshRef = useRef<THREE.Mesh | null>(null);
  const traumaMarkerRef = useRef<THREE.Group | null>(null);

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
    camera.position.set(0, 0.10, 4.3);
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
    controls.minDistance = 1.0;
    controls.maxDistance = 7.5;
    controls.target.set(0, 0.05, 0);
    controlsRef.current = controls;

    // --- 4. Lighting Rig (Medical Studio 3-Point Light) ---
    const ambientLight = new THREE.AmbientLight(0x223048, 2.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x90caf9, 1.8);
    fillLight.position.set(-3, 2, 3);
    scene.add(fillLight);

    const rimLight1 = new THREE.DirectionalLight(0x00e5ff, 3.2);
    rimLight1.position.set(-4, 2, -3);
    scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0x7c4dff, 2.2);
    rimLight2.position.set(4, -2, -3);
    scene.add(rimLight2);

    const heartLight = new THREE.PointLight(0xff1744, 2.5, 2.0);
    heartLight.position.set(-0.06, 0.44, 0.35);
    scene.add(heartLight);

    // Holographic ground grid
    const gridHelper = new THREE.GridHelper(7, 28, 0x00e5ff, 0x1e293b);
    gridHelper.position.y = -2.1;
    scene.add(gridHelper);

    // Procedural Groups
    const vascularGroup = new THREE.Group();
    const skeletalGroup = new THREE.Group();
    vascularGroupRef.current = vascularGroup;
    skeletalGroupRef.current = skeletalGroup;
    scene.add(vascularGroup);
    scene.add(skeletalGroup);

    // ==========================================
    // 5. GLTF LOADER WITH ROBUST NORMALIZATION
    // ==========================================
    const gltfLoader = new GLTFLoader();
    let loadedCount = 0;
    const totalModels = 7;

    const checkAllLoaded = () => {
      loadedCount++;
      setLoadProgress(Math.round((loadedCount / totalModels) * 100));
      if (loadedCount >= totalModels) {
        setModelsReady(true);
      }
    };

    // A. Human Body Mesh
    gltfLoader.load(
      '/models/human_body.glb',
      (gltf) => {
        const bodyObj = gltf.scene;
        const bodyWrapper = createNormalizedModelWrapper(bodyObj, 3.8);
        // Rotate 90 deg around Y so chest faces forward (+Z)
        bodyWrapper.rotation.y = -Math.PI / 2;
        bodyWrapper.position.set(0, 0, 0);

        humanBodyMaterialsRef.current = [];
        bodyWrapper.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mat = new THREE.MeshPhysicalMaterial({
              color: 0x38bdf8,
              roughness: 0.18,
              metalness: 0.12,
              transmission: 0.86,
              ior: 1.46,
              transparent: true,
              opacity: 0.55,
              clearcoat: 0.9,
              clearcoatRoughness: 0.1,
            });
            child.material = mat;
            humanBodyMaterialsRef.current.push(mat);
            child.userData = {
              name: 'Human Anatomical Body',
              desc: 'Full-body anatomical frame with musculoskeletal landmarks and cutaneous innervation dermatomes.',
              sign: 'General physical examination: Pallor, Icterus, Cyanosis, Clubbing, Lymphadenopathy, Edema (PICCLED).',
            };
          }
        });

        scene.add(bodyWrapper);
        humanBodyWrapperRef.current = bodyWrapper;
        checkAllLoaded();
      },
      undefined,
      (err) => {
        console.warn('Error loading human_body.glb:', err);
        checkAllLoaded();
      }
    );

    // B. Realistic 3D Heart
    gltfLoader.load(
      '/models/heart.glb',
      (gltf) => {
        const heartObj = gltf.scene;
        const heartWrapper = createNormalizedModelWrapper(heartObj, 0.32);
        heartWrapper.position.set(-0.05, 0.52, 0.12);
        heartWrapper.rotation.y = 0.2;

        heartWrapper.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material) {
              child.material.roughness = 0.35;
              child.material.metalness = 0.15;
              child.material.side = THREE.DoubleSide;
            }
            child.userData = {
              name: 'Cardiovascular Pump (Heart & Great Vessels)',
              desc: 'Four-chambered muscular pump: Left ventricle generates systemic mean arterial pressure; coronary arteries supply myocardium.',
              sign: 'Auscultation of S1-S2, S3 gallop in volume overload, ST-elevation in acute myocardial infarction.',
            };
          }
        });

        scene.add(heartWrapper);
        heartWrapperRef.current = heartWrapper;
        checkAllLoaded();
      },
      undefined,
      (err) => {
        console.warn('Error loading heart.glb:', err);
        checkAllLoaded();
      }
    );

    // C. Realistic 3D Lungs
    gltfLoader.load(
      '/models/lungs.glb',
      (gltf) => {
        const lungsObj = gltf.scene;
        const lungsWrapper = createNormalizedModelWrapper(lungsObj, 0.72);
        lungsWrapper.position.set(0.0, 0.56, 0.02);

        lungsWrapper.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material) {
              child.material.transparent = true;
              child.material.opacity = 0.88;
              child.material.roughness = 0.35;
              child.material.side = THREE.DoubleSide;
            }
            child.userData = {
              name: 'Pulmonary System (Right & Left Lungs)',
              desc: 'Tracheobronchial tree and alveolar gas exchange surface. Generates vital capacity and PaO2 oxygenation.',
              sign: 'Vesicular breath sounds; fine end-inspiratory crackles (crepitations) in pulmonary edema/shock.',
            };
          }
        });

        scene.add(lungsWrapper);
        lungsWrapperRef.current = lungsWrapper;
        checkAllLoaded();
      },
      undefined,
      (err) => {
        console.warn('Error loading lungs.glb:', err);
        checkAllLoaded();
      }
    );

    // D. Realistic 3D Liver
    gltfLoader.load(
      '/models/liver.glb',
      (gltf) => {
        const liverObj = gltf.scene;
        const liverWrapper = createNormalizedModelWrapper(liverObj, 0.30);
        liverWrapper.position.set(0.12, 0.28, 0.08);

        liverWrapper.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material) {
              child.material.roughness = 0.40;
              child.material.metalness = 0.08;
              child.material.side = THREE.DoubleSide;
            }
            child.userData = {
              name: 'Liver (Hepatic Lobes & Biliary Architecture)',
              desc: 'Metabolic synthesis of albumin, prothrombin (INR), urea, and biliary clearance of conjugated bilirubin.',
              sign: 'Liver span measurement in midclavicular line (8-12cm); icteric jaundice; asterixis flap in hepatic encephalopathy.',
            };
          }
        });

        scene.add(liverWrapper);
        liverWrapperRef.current = liverWrapper;
        checkAllLoaded();
      },
      undefined,
      (err) => {
        console.warn('Error loading liver.glb:', err);
        checkAllLoaded();
      }
    );

    // E. Realistic 3D Brain
    gltfLoader.load(
      '/models/brain.glb',
      (gltf) => {
        const brainObj = gltf.scene;
        const brainWrapper = createNormalizedModelWrapper(brainObj, 0.30);
        brainWrapper.position.set(0, 1.42, 0.02);

        brainWrapper.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material) {
              child.material.roughness = 0.35;
              child.material.metalness = 0.1;
              child.material.side = THREE.DoubleSide;
            }
            child.userData = {
              name: 'Cerebrum & Cranial Brainstem',
              desc: 'Central command for consciousness, cardiorespiratory autonomic centers in medulla, and cranial nerve nuclei.',
              sign: 'Glasgow Coma Scale (GCS), pupillary light reflex (CN II/III), motor/sensory examination.',
            };
          }
        });

        scene.add(brainWrapper);
        brainWrapperRef.current = brainWrapper;
        checkAllLoaded();
      },
      undefined,
      (err) => {
        console.warn('Error loading brain.glb:', err);
        checkAllLoaded();
      }
    );

    // F. Realistic 3D Kidneys (Renal System)
    gltfLoader.load(
      '/models/kidney.glb',
      (gltf) => {
        const kidneyObj = gltf.scene;
        const kidneyWrapper = createNormalizedModelWrapper(kidneyObj, 0.24);
        kidneyWrapper.position.set(0.00, 0.18, -0.05);

        kidneyWrapper.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material) {
              child.material.roughness = 0.35;
              child.material.metalness = 0.10;
              child.material.side = THREE.DoubleSide;
            }
            child.userData = {
              name: 'Renal Architecture (Right & Left Kidneys)',
              desc: 'Glomerular filtration, electrolyte homeostasis, renin secretion, and acid-base regulation.',
              sign: 'Urine output monitoring (>0.5 mL/kg/h); ballotable nephromegaly; renal angle tenderness.',
            };
          }
        });

        scene.add(kidneyWrapper);
        kidneyWrapperRef.current = kidneyWrapper;
        checkAllLoaded();
      },
      undefined,
      (err) => {
        console.warn('Error loading kidney.glb:', err);
        checkAllLoaded();
      }
    );

    // G. Realistic 3D Skeleton (X-Ray & Biomechanics)
    gltfLoader.load(
      '/models/skeletal.glb',
      (gltf) => {
        const skeletalObj = gltf.scene;
        const skeletalWrapper = createNormalizedModelWrapper(skeletalObj, 3.65);
        skeletalWrapper.position.set(0.00, -0.02, 0.00);

        skeletalWrapper.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xf1f5f9,
              roughness: 0.35,
              metalness: 0.15,
              side: THREE.DoubleSide,
            });
            child.userData = {
              name: 'Human Skeletal Architecture (X-Ray Framework)',
              desc: 'Axial and appendicular skeleton: Thoracic cage protection, hematopoietic bone marrow, calcium phosphate reservoir.',
              sign: 'Fracture screening, sternal compression landmarks, rib series interpretation.',
            };
          }
        });

        scene.add(skeletalWrapper);
        skeletalWrapperRef.current = skeletalWrapper;
        checkAllLoaded();
      },
      undefined,
      (err) => {
        console.warn('Error loading skeletal.glb:', err);
        checkAllLoaded();
      }
    );

    // ==========================================
    // 6. GLOWING VASCULAR SYSTEM
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

    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.06, 0.58, 0.10),
      new THREE.Vector3(-0.04, 0.74, 0.08),
      new THREE.Vector3(0.00, 0.78, 0.02),
      new THREE.Vector3(0.02, 0.42, -0.04),
      new THREE.Vector3(0.02, -0.15, -0.04),
      new THREE.Vector3(0.11, -0.42, 0.01),
      new THREE.Vector3(0.22, -0.85, 0.04),
      new THREE.Vector3(0.22, -1.60, 0.02),
    ]);
    const aortaMesh = new THREE.Mesh(new THREE.TubeGeometry(aortaCurve, 50, 0.026, 12, false), arterialMat);
    aortaMesh.userData = {
      name: 'Aorta & Systemic Arterial Conduit',
      desc: 'High-pressure compliant reservoir delivering pulsatile stroke volume to systemic tissues.',
      sign: 'Synchronous radial and femoral pulses; absence of radio-femoral delay.',
    };
    vascularGroup.add(aortaMesh);

    const leftIliacCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, -0.15, -0.04),
      new THREE.Vector3(-0.11, -0.42, 0.01),
      new THREE.Vector3(-0.22, -0.85, 0.04),
      new THREE.Vector3(-0.22, -1.60, 0.02),
    ]);
    vascularGroup.add(new THREE.Mesh(new THREE.TubeGeometry(leftIliacCurve, 40, 0.024, 12, false), arterialMat));

    const carotidCurveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, 0.78, 0.02),
      new THREE.Vector3(-0.08, 1.05, 0.04),
      new THREE.Vector3(-0.08, 1.30, 0.02),
    ]);
    vascularGroup.add(new THREE.Mesh(new THREE.TubeGeometry(carotidCurveL, 20, 0.016, 10, false), arterialMat));

    const carotidCurveR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, 0.78, 0.02),
      new THREE.Vector3(0.08, 1.05, 0.04),
      new THREE.Vector3(0.08, 1.30, 0.02),
    ]);
    vascularGroup.add(new THREE.Mesh(new THREE.TubeGeometry(carotidCurveR, 20, 0.016, 10, false), arterialMat));

    const ivcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.06, 0.54, 0.10),
      new THREE.Vector3(0.06, 0.20, -0.03),
      new THREE.Vector3(0.06, -0.18, -0.03),
      new THREE.Vector3(0.16, -0.42, 0.01),
    ]);
    const ivcMesh = new THREE.Mesh(new THREE.TubeGeometry(ivcCurve, 30, 0.030, 12, false), venousMat);
    ivcMesh.userData = {
      name: 'Inferior Vena Cava & Venous Return',
      desc: 'Capacitance reservoir returning deoxygenated blood to right atrium under low pressure.',
      sign: 'Jugular Venous Pressure (JVP) elevation and hepatojugular reflux.',
    };
    vascularGroup.add(ivcMesh);

    // ==========================================
    // 7. SKELETAL SYSTEM (X-RAY LAYER)
    // ==========================================
    const boneMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });

    for (let i = 0; i < 16; i++) {
      const vertMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.035, 12), boneMat);
      vertMesh.position.set(0, 0.95 - i * 0.07, -0.10);
      skeletalGroup.add(vertMesh);
    }

    for (let r = 0; r < 8; r++) {
      const ribRadius = 0.34 + (r < 4 ? r * 0.025 : (7 - r) * 0.02);
      const rib = new THREE.Mesh(new THREE.TorusGeometry(ribRadius, 0.014, 8, 24, Math.PI * 1.32), boneMat);
      rib.position.set(0, 0.78 - r * 0.072, 0);
      rib.rotation.x = Math.PI / 2 + 0.14;
      rib.rotation.z = -Math.PI * 0.16;
      skeletalGroup.add(rib);
    }

    const sternumMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.022), boneMat);
    sternumMesh.position.set(0, 0.58, 0.26);
    sternumMesh.userData = {
      name: 'Sternum & Sternal Angle of Louis',
      desc: 'Anterior landmark for cardiac compression and intercostal space counting.',
      sign: 'Manubriosternal junction baseline for measuring vertical JVP column height.',
    };
    skeletalGroup.add(sternumMesh);

    // ==========================================
    // 8. TRAUMA / BITE SITE (SNAKEBITE)
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

    const haloMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.03, 0.16, 24),
      new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
    );
    traumaGroup.add(haloMesh);

    traumaGroup.userData = {
      name: "Russell's Viper Envenomation Puncture Site",
      desc: 'Paired fang punctures 18mm apart with advancing wooden edema, persistent oozing, and blister formation.',
      sign: '20-minute Whole Blood Clotting Test (20WBCT) incoagulable; clear indication for 10 vials polyvalent ASV.',
    };
    scene.add(traumaGroup);
    traumaMarkerRef.current = traumaGroup;

    // ==========================================
    // 9. ASCITES FLUID LAYER
    // ==========================================
    const ascitesGeo = new THREE.SphereGeometry(0.36, 24, 24);
    ascitesGeo.scale(1.15, 0.78, 1.05);
    const ascitesMesh = new THREE.Mesh(
      ascitesGeo,
      new THREE.MeshPhysicalMaterial({
        color: 0xfacc15,
        transmission: 0.82,
        roughness: 0.12,
        transparent: true,
        opacity: 0.62,
        emissive: 0xca8a04,
        emissiveIntensity: 0.35,
      })
    );
    ascitesMesh.position.set(0, -0.10, 0.06);
    ascitesMesh.visible = false;
    ascitesMesh.userData = {
      name: 'Peritoneal Ascitic Collection',
      desc: 'Free transudative peritoneal fluid driven by portal hypertension and hypoalbuminemia.',
      sign: 'Shifting dullness (>1500 mL) and fluid thrill (>2000 mL); diagnostic paracentesis with SAAG calculation.',
    };
    scene.add(ascitesMesh);
    ascitesMeshRef.current = ascitesMesh;

    // --- 10. Raycasting on organ click ---
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

    // --- 11. Animation Loop (60 FPS) ---
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
      if (heartWrapperRef.current) {
        const squeeze = 1.0 + 0.05 * Math.sin(cardiacPhase);
        heartWrapperRef.current.scale.set(squeeze, squeeze * 1.04, squeeze);
      }

      // Lung respiration expansion
      if (lungsWrapperRef.current) {
        const expansion = 1.0 + 0.04 * Math.sin(respPhase);
        lungsWrapperRef.current.scale.set(expansion, expansion * 1.03, expansion);
      }

      // Vascular pulse glow
      const pulse = 0.5 + 0.5 * Math.sin(cardiacPhase);
      arterialMat.emissiveIntensity = 0.5 + 0.6 * pulse;

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

  // Sync Layers and Pathology
  useEffect(() => {
    const bodyMaterials = humanBodyMaterialsRef.current;
    const heart = heartWrapperRef.current;
    const lungs = lungsWrapperRef.current;
    const liver = liverWrapperRef.current;
    const brain = brainWrapperRef.current;
    const kidney = kidneyWrapperRef.current;
    const skeletonModel = skeletalWrapperRef.current;
    const vascular = vascularGroupRef.current;
    const skeletal = skeletalGroupRef.current;

    if (!bodyMaterials.length) return;

    if (heart) heart.visible = true;
    if (lungs) lungs.visible = true;
    if (liver) liver.visible = true;
    if (brain) brain.visible = true;
    if (kidney) kidney.visible = true;
    if (skeletonModel) skeletonModel.visible = layer === 'skeletal' || layer === 'glass';
    if (vascular) vascular.visible = true;
    if (skeletal) skeletal.visible = false;

    switch (layer) {
      case 'skin':
        // Real Human Skin Mode
        bodyMaterials.forEach((mat) => {
          mat.transmission = 0.02;
          mat.opacity = 0.98;
          mat.roughness = 0.45;
          mat.clearcoat = 0.25;

          const baseR = 0.86;
          const baseG = 0.64;
          const baseB = 0.52;

          const r = baseR - pathology.cyanosis * 0.32 + pathology.jaundice * 0.12 - pathology.pallor * 0.15;
          const g = baseG - pathology.cyanosis * 0.18 + pathology.jaundice * 0.22 - pathology.pallor * 0.15;
          const b = baseB + pathology.cyanosis * 0.32 - pathology.jaundice * 0.32 - pathology.pallor * 0.15;

          mat.color.setRGB(r, g, b);
        });
        if (heart) heart.visible = false;
        if (lungs) lungs.visible = false;
        if (liver) liver.visible = false;
        if (brain) brain.visible = false;
        if (kidney) kidney.visible = false;
        if (skeletonModel) skeletonModel.visible = false;
        if (vascular) vascular.visible = false;
        if (skeletal) skeletal.visible = false;
        break;

      case 'glass':
        // Holographic Glass Mode
        bodyMaterials.forEach((mat) => {
          mat.transmission = 0.88;
          mat.opacity = 0.45;
          mat.roughness = 0.15;
          mat.clearcoat = 0.9;
          mat.color.setHex(0x38bdf8);
        });
        if (skeletonModel) skeletonModel.visible = false;
        break;

      case 'vascular':
        bodyMaterials.forEach((mat) => {
          mat.transmission = 0.95;
          mat.opacity = 0.16;
          mat.color.setHex(0x38bdf8);
        });
        if (heart) heart.visible = true;
        if (lungs) lungs.visible = false;
        if (liver) liver.visible = false;
        if (brain) brain.visible = false;
        if (kidney) kidney.visible = false;
        if (skeletonModel) skeletonModel.visible = false;
        if (vascular) vascular.visible = true;
        if (skeletal) skeletal.visible = false;
        break;

      case 'viscera':
        bodyMaterials.forEach((mat) => {
          mat.transmission = 0.93;
          mat.opacity = 0.20;
          mat.color.setHex(0x38bdf8);
        });
        if (heart) heart.visible = true;
        if (lungs) lungs.visible = true;
        if (liver) liver.visible = true;
        if (brain) brain.visible = true;
        if (kidney) kidney.visible = true;
        if (skeletonModel) skeletonModel.visible = false;
        if (vascular) vascular.visible = false;
        if (skeletal) skeletal.visible = false;
        break;

      case 'skeletal':
        bodyMaterials.forEach((mat) => {
          mat.transmission = 0.96;
          mat.opacity = 0.12;
          mat.color.setHex(0x94a3b8);
        });
        if (heart) heart.visible = false;
        if (lungs) lungs.visible = false;
        if (liver) liver.visible = false;
        if (brain) brain.visible = false;
        if (kidney) kidney.visible = false;
        if (skeletonModel) skeletonModel.visible = true;
        if (vascular) vascular.visible = false;
        if (skeletal) skeletal.visible = false;
        break;
    }

    if (ascitesMeshRef.current) {
      if (pathology.ascites > 0.05) {
        ascitesMeshRef.current.visible = true;
        const scale = 0.8 + pathology.ascites * 0.5;
        ascitesMeshRef.current.scale.set(scale, scale * 0.85, scale);
      } else {
        ascitesMeshRef.current.visible = false;
      }
    }

    if (traumaMarkerRef.current) {
      traumaMarkerRef.current.visible = scenarioId === 'snakebite';
    }
  }, [layer, pathology, scenarioId, modelsReady]);

  const resetCamera = (preset: 'anterior' | 'head' | 'thorax' | 'abdomen') => {
    if (!cameraRef.current || !controlsRef.current) return;
    switch (preset) {
      case 'anterior':
        cameraRef.current.position.set(0, 0.10, 4.3);
        controlsRef.current.target.set(0, 0.05, 0);
        break;
      case 'head':
        cameraRef.current.position.set(0, 1.42, 1.25);
        controlsRef.current.target.set(0, 1.42, 0);
        break;
      case 'thorax':
        cameraRef.current.position.set(-0.05, 0.52, 1.85);
        controlsRef.current.target.set(-0.05, 0.50, 0);
        break;
      case 'abdomen':
        cameraRef.current.position.set(0.08, 0.22, 1.75);
        controlsRef.current.target.set(0.08, 0.22, 0);
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
    <div className="relative w-full h-full min-h-[420px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Progress Bar */}
      {!modelsReady && (
        <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <div className="font-mono text-xs text-cyan-300 font-semibold tracking-wider">
            LOADING REALISTIC 3D ANATOMY ASSETS ({loadProgress}%)
          </div>
          <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        </div>
      )}

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
          onClick={() => resetCamera('head')}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
        >
          Head & Brain
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
          Abdomen & Liver
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
        Click any 3D organ to inspect • Drag to rotate 3D
      </div>
    </div>
  );
};
