import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PatientVitals, PatientPathologyState, AnatomicalLayer } from '../types';
import { Atlas, Part, SystemId, SYSTEMS, decodeModelResponse, PointerTap } from '../data/atlasTypes';
import { Sparkles, Maximize2, Compass, AlertCircle } from 'lucide-react';

interface AnatomicalBody3DProps {
  vitals: PatientVitals;
  pathology: PatientPathologyState;
  layer: AnatomicalLayer;
  scenarioId: string;
  cameraPreset?: 'anterior' | 'head' | 'thorax' | 'abdomen';
  theme?: 'light' | 'dark';
  selectedOrganId?: string | null;
  onSelectOrganId?: (organId: string) => void;
}

export const AnatomicalBody3D: React.FC<AnatomicalBody3DProps> = ({
  vitals,
  pathology,
  layer,
  scenarioId,
  cameraPreset = 'anterior',
  theme = 'light',
  selectedOrganId,
  onSelectOrganId,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [modelsReady, setModelsReady] = useState<boolean>(false);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  // Mesh and material references per anatomical system
  const systemMeshesRef = useRef<Map<SystemId, THREE.Mesh>>(new Map());
  const systemMaterialsRef = useRef<Map<SystemId, THREE.MeshStandardMaterial>>(new Map());
  const pickersRef = useRef<(THREE.Mesh | undefined)[]>([]);
  const atlasRef = useRef<Atlas | null>(null);
  const traumaMarkerRef = useRef<THREE.Group | null>(null);

  const isLight = theme === 'light';

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;
    let animationFrameId: number;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene setup (Clean White Medical Studio)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLight ? 0xf8fafc : 0x070b14);
    sceneRef.current = scene;

    // 2. Camera: Center of BodyParts3D is at y = 0.85 (height 1.70m)
    const isMobile = width < 640;
    const defaultDist = isMobile ? 3.4 : 2.8;
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.05, 50);
    camera.position.set(0, 0.85, defaultDist);
    cameraRef.current = camera;

    // 3. Renderer with Tone Mapping & Studio Environment
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLight ? 1.12 : 1.25;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // PMREM Studio Environment
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

    // 5. Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xa7acb2, isLight ? 1.1 : 0.7);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffaf4, isLight ? 2.4 : 2.0);
    keyLight.position.set(-2, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xe9f0ff, isLight ? 1.8 : 1.5);
    rimLight.position.set(2, 2, -3);
    scene.add(rimLight);

    // 6. Studio Floor Platform (Inspired by ashemag/human-atlas)
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(20, 64),
      new THREE.MeshStandardMaterial({ color: isLight ? 0xecf0f3 : 0x0a0f1c, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.019;
    scene.add(ground);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(0.70, 0.72, 0.028, 64),
      new THREE.MeshStandardMaterial({ color: isLight ? 0xeeeeec : 0x141e33, metalness: 0.12, roughness: 0.67 })
    );
    platform.position.y = -0.016;
    scene.add(platform);

    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.66, 0.665, 96),
      new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.001;
    scene.add(outerRing);

    // 7. System Materials Initialization
    const materialsMap = new Map<SystemId, THREE.MeshStandardMaterial>();
    SYSTEMS.forEach((sys) => {
      const isSkin = sys.id === 'integumentary';
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(sys.color),
        metalness: isSkin ? 0.02 : 0.08,
        roughness: isSkin ? 0.45 : 0.52,
        side: THREE.DoubleSide,
        transparent: isSkin,
        opacity: isSkin ? 0.12 : 1.0,
        depthWrite: !isSkin,
      });
      materialsMap.set(sys.id, mat);
    });
    systemMaterialsRef.current = materialsMap;

    // 8. Snakebite Trauma Marker at right lower leg
    const traumaGroup = new THREE.Group();
    traumaGroup.position.set(0.12, 0.22, 0.08); // Right calf / supramalleolar region
    const fang1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    const fang2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
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

    // 9. Load BodyParts3D 4.0 Atlas Manifest & Binary Chunks
    const abortCtrl = new AbortController();

    const loadAtlas = async () => {
      try {
        const res = await fetch('/models/atlas.json', { signal: abortCtrl.signal });
        const atlas: Atlas = await res.json();
        if (disposed) return;
        atlasRef.current = atlas;

        const bounds = atlas.parts.map(
          (p) => new THREE.Box3(new THREE.Vector3(...p.bounds[0]), new THREE.Vector3(...p.bounds[1]))
        );
        const pickers: (THREE.Mesh | undefined)[] = [];
        const totalChunks = atlas.chunks.length;
        let loadedChunks = 0;

        // 1. Fetch all 15 chunks in parallel
        const chunkBuffers: ArrayBuffer[] = new Array(totalChunks);
        await Promise.all(
          atlas.chunks.map(async (chunk, chunkIdx) => {
            const hasGzip = !!chunk.gzip && typeof DecompressionStream !== 'undefined';
            const fetchUrl = hasGzip ? chunk.gzip! : chunk.url;
            const resp = await fetch(fetchUrl, { signal: abortCtrl.signal });
            const buffer = await decodeModelResponse(resp, chunk.bytes, hasGzip);
            chunkBuffers[chunkIdx] = buffer;
            loadedChunks++;
            setLoadProgress(Math.round((loadedChunks / totalChunks) * 85));
          })
        );

        if (disposed) return;

        // 2. Build geometries and group by anatomical system (single pass)
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

          const pickMesh = new THREE.Mesh(geom);
          pickMesh.matrixAutoUpdate = false;
          pickMesh.userData = { partIndex: partIdx, name: p.name, system: p.system, id: p.id };
          pickers[partIdx] = pickMesh;

          const list = systemGeomGroups.get(p.system) || [];
          list.push(geom);
          systemGeomGroups.set(p.system, list);
        });

        // 3. Merge geometries ONCE per system and mount to scene
        systemGeomGroups.forEach((geomList, sysId) => {
          if (geomList.length === 0) return;
          const merged = mergeGeometries(geomList, false);
          if (!merged) return;

          const mat = materialsMap.get(sysId);
          const sysMesh = new THREE.Mesh(merged, mat);
          sysMesh.frustumCulled = false;
          scene.add(sysMesh);
          systemMeshesRef.current.set(sysId, sysMesh);
        });

        setLoadProgress(100);
        if (!disposed) {
          pickersRef.current = pickers;
          setModelsReady(true);
        }
      } catch (err: any) {
        if (!disposed && err.name !== 'AbortError') {
          console.error('Error loading BodyParts3D atlas:', err);
        }
      }
    };

    loadAtlas();

    // 10. Pointer Interaction (Tap vs Orbit)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const tap = new PointerTap();

    const handlePointerDown = (e: PointerEvent) => {
      tap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === 'touch' ? 12 : 6);
    };

    const handlePointerMove = (e: PointerEvent) => {
      tap.move(e.pointerId, e.clientX, e.clientY);
    };

    const handlePointerUp = (e: PointerEvent) => {
      const isTap = tap.up(e.pointerId, e.clientX, e.clientY);
      if (!isTap || !atlasRef.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      const interactiveMeshes = pickersRef.current.filter((m) => !!m) as THREE.Mesh[];
      const hits = raycaster.intersectObjects(interactiveMeshes, false);

      if (hits.length > 0) {
        // Skip skin hits if deeper structures are hit
        const nonSkinHit = hits.find((h) => (h.object.userData as any)?.system !== 'integumentary');
        const targetHit = nonSkinHit || hits[0];
        const { name, system, id } = targetHit.object.userData;

        // Map anatomical name/system to organ ID for detail drawer
        let organId = 'body';
        const lower = name.toLowerCase();
        if (lower.includes('heart') || lower.includes('aorta') || system === 'cardiac') organId = 'heart';
        else if (lower.includes('lung') || lower.includes('bronch') || system === 'respiratory') organId = 'lungs';
        else if (lower.includes('brain') || lower.includes('cerebr') || lower.includes('midbrain')) organId = 'brain';
        else if (lower.includes('liver') || lower.includes('hepat')) organId = 'liver';
        else if (lower.includes('stomach')) organId = 'stomach';
        else if (lower.includes('pancrea')) organId = 'pancreas';
        else if (lower.includes('spleen')) organId = 'spleen';
        else if (lower.includes('kidney') || system === 'urinary') organId = 'kidney';
        else if (system === 'skeletal') organId = 'skeletal';

        if (onSelectOrganId) {
          onSelectOrganId(organId);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    // 11. Animation Loop (Decoupled 60-120 FPS)
    const clock = new THREE.Clock();

    const animate = () => {
      if (disposed) return;
      animationFrameId = requestAnimationFrame(animate);

      const dt = clock.getDelta();
      controls.update();

      // Cardiopulmonary kinetic modulation
      const hrFreq = Math.max(0.4, vitals.heartRate / 60);
      const cardiacPhase = (clock.getElapsedTime() * 2 * Math.PI * hrFreq) % (2 * Math.PI);

      const rrFreq = Math.max(0.1, vitals.respiratoryRate / 60);
      const respPhase = (clock.getElapsedTime() * 2 * Math.PI * rrFreq) % (2 * Math.PI);

      const cardiacMesh = systemMeshesRef.current.get('cardiac');
      if (cardiacMesh) {
        const squeeze = 1.0 + 0.03 * Math.sin(cardiacPhase);
        cardiacMesh.scale.set(squeeze, squeeze, squeeze);
      }

      const respMesh = systemMeshesRef.current.get('respiratory');
      if (respMesh) {
        const expansion = 1.0 + 0.02 * Math.sin(respPhase);
        respMesh.scale.set(expansion, expansion, expansion);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 12. Resize Listener
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      abortCtrl.abort();
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      cancelAnimationFrame(animationFrameId);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Theme Update
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    sceneRef.current.background = new THREE.Color(isLight ? 0xf8fafc : 0x070b14);
    rendererRef.current.toneMappingExposure = isLight ? 1.12 : 1.25;
  }, [isLight]);

  // Layer Update
  useEffect(() => {
    const meshes = systemMeshesRef.current;
    const mats = systemMaterialsRef.current;
    if (meshes.size === 0) return;

    const skinMat = mats.get('integumentary');
    if (skinMat) {
      // Modulate skin color with pathology (cyanosis, jaundice, pallor)
      const r = 0.86 - pathology.cyanosis * 0.32 + pathology.jaundice * 0.12 - pathology.pallor * 0.15;
      const g = 0.64 - pathology.cyanosis * 0.18 + pathology.jaundice * 0.22 - pathology.pallor * 0.15;
      const b = 0.52 + pathology.cyanosis * 0.32 - pathology.jaundice * 0.32 - pathology.pallor * 0.15;
      skinMat.color.setRGB(r, g, b);
    }

    // Toggle systems based on selected layer
    meshes.forEach((mesh, sysId) => {
      switch (layer) {
        case 'glass':
          // Glass silhouette + all visceral systems visible
          mesh.visible = true;
          if (sysId === 'integumentary' && skinMat) {
            skinMat.transparent = true;
            skinMat.opacity = 0.10;
            skinMat.depthWrite = false;
          }
          break;

        case 'skin':
          // Real human skin opaque mode
          if (sysId === 'integumentary' && skinMat) {
            mesh.visible = true;
            skinMat.transparent = false;
            skinMat.opacity = 1.0;
            skinMat.depthWrite = true;
          } else {
            mesh.visible = false;
          }
          break;

        case 'vascular':
          // Arterial & venous circulation with faint skeleton
          mesh.visible = sysId === 'arterial' || sysId === 'venous' || sysId === 'cardiac' || sysId === 'skeletal';
          if (sysId === 'skeletal') {
            const skelMat = mats.get('skeletal');
            if (skelMat) {
              skelMat.transparent = true;
              skelMat.opacity = 0.25;
            }
          }
          break;

        case 'viscera':
          // All major organs visible, skin faint
          mesh.visible = sysId !== 'muscular';
          if (sysId === 'integumentary' && skinMat) {
            skinMat.transparent = true;
            skinMat.opacity = 0.08;
            skinMat.depthWrite = false;
          }
          break;

        case 'skeletal':
          // X-Ray skeletal mode
          mesh.visible = sysId === 'skeletal';
          const skelMat = mats.get('skeletal');
          if (skelMat) {
            skelMat.transparent = false;
            skelMat.opacity = 1.0;
            skelMat.color.setHex(0xe2d9ba);
          }
          break;
      }
    });

    if (traumaMarkerRef.current) {
      traumaMarkerRef.current.visible = scenarioId === 'snakebite';
    }
  }, [layer, pathology, scenarioId, modelsReady]);

  // Camera Presets
  const resetCamera = (preset: 'anterior' | 'head' | 'thorax' | 'abdomen') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const isMob = window.innerWidth < 640;

    switch (preset) {
      case 'anterior':
        // Full body: center is at y = 0.85
        cameraRef.current.position.set(0, 0.85, isMob ? 3.4 : 2.8);
        controlsRef.current.target.set(0, 0.85, 0);
        break;
      case 'head':
        // Cranial vault / Brain: center is at y = 1.55
        cameraRef.current.position.set(0, 1.55, isMob ? 1.05 : 0.80);
        controlsRef.current.target.set(0, 1.55, 0);
        break;
      case 'thorax':
        // Heart & Lungs: center is at y = 1.25
        cameraRef.current.position.set(-0.02, 1.25, isMob ? 1.25 : 1.00);
        controlsRef.current.target.set(-0.02, 1.25, 0);
        break;
      case 'abdomen':
        // Liver, stomach, pancreas, kidneys: center is at y = 0.95
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

      {/* Top Floating Control Bar (Apple HIG Responsive Layout) */}
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

        {/* Right Info Pill */}
        <div
          className={`pointer-events-auto hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border backdrop-blur-xl text-xs font-mono font-bold ${
            isLight
              ? 'bg-white/90 text-slate-700 border-slate-200/90 shadow-sm'
              : 'bg-slate-900/90 text-cyan-400 border-slate-800 shadow-lg'
          }`}
        >
          <span>BODYPARTS3D ATLAS</span>
          <span className="text-slate-400 font-normal">| 2,234 Parts</span>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-[11px] pointer-events-none">
        <div
          className={`px-2.5 py-1 rounded-xl border backdrop-blur-md font-mono ${
            isLight
              ? 'bg-white/80 border-slate-200/80 text-slate-600'
              : 'bg-slate-900/80 border-slate-800 text-slate-400'
          }`}
        >
          💡 Tap any anatomical organ to inspect relations & CBME pearls
        </div>
      </div>
    </div>
  );
};
