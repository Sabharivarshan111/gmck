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

export const AnatomicalBody3D: React.FC<AnatomicalBody3DProps> = ({
  vitals,
  pathology,
  scenarioId,
  cameraPreset = 'anterior',
  theme = 'light',
  selectedOrganId,
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
  const pickersRef = useRef<(THREE.Mesh | undefined)[]>([]);
  const atlasRef = useRef<Atlas | null>(null);
  const traumaMarkerRef = useRef<THREE.Group | null>(null);

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

    // 1. Scene setup (Clean White Medical Studio)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLight ? 0xf8fafc : 0x070b14);
    sceneRef.current = scene;

    // 2. Camera setup
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

    const keyLight = new THREE.DirectionalLight(0xfffaf4, isLight ? 2.2 : 1.8);
    keyLight.position.set(-2.5, 4, 3.5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xe9f0ff, isLight ? 1.8 : 1.5);
    rimLight.position.set(2.5, 2, -3.5);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, isLight ? 0.8 : 0.6);
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
            roughness: 0.52,
            metalness: 0.08,
            side: THREE.DoubleSide,
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
                'if (partVisible < 0.5) discard;\n'
            );

            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <color_fragment>',
              '#include <color_fragment>\n' +
                'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.38, 0.82, 0.95), partSelected * 0.85);\n'
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

        // Fetch all 15 chunks concurrently
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

        // Build geometries with partIndex and group by system
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

          // CRUCIAL: Inject partIndex attribute for GPU shader lookups
          geom.setAttribute('partIndex', new THREE.BufferAttribute(new Float32Array(p.vertexCount).fill(partIdx), 1));

          const pickMesh = new THREE.Mesh(geom);
          pickMesh.matrixAutoUpdate = false;
          pickMesh.userData = { partIndex: partIdx, name: p.name, system: p.system, id: p.id };
          pickers[partIdx] = pickMesh;

          const list = systemGeomGroups.get(p.system) || [];
          list.push(geom);
          systemGeomGroups.set(p.system, list);
        });

        // Merge geometries ONCE per system and mount
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
          console.error('Failed to load BodyParts3D atlas:', err);
        }
      }
    };

    loadAtlas();

    // 9. Raycasting Pointer Tap & Dissection Interaction
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pointerTap = new PointerTap();
    const worldBox = new THREE.Box3();
    const hitPoint = new THREE.Vector3();

    const onPointerDown = (e: PointerEvent) => {
      pointerTap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === 'touch' ? 14 : 6);
    };

    const onPointerMove = (e: PointerEvent) => {
      pointerTap.move(e.pointerId, e.clientX, e.clientY);
      if (!atlasRef.current || !partDataRef.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const partData = partDataRef.current;
      const pickers = pickersRef.current;
      const bounds = atlasRef.current.parts.map(
        (p) => new THREE.Box3(new THREE.Vector3(...p.bounds[0]), new THREE.Vector3(...p.bounds[1]))
      );

      let nearest = Infinity;
      let foundIndex = -1;

      for (let i = 0; i < pickers.length; i++) {
        const mesh = pickers[i];
        if (!mesh || partData[i * 4 + 3] < 0.5) continue;
        if (atlasRef.current.parts[i].system === 'integumentary') continue; // Allow picking through transparent skin

        if (!raycaster.ray.intersectBox(bounds[i], hitPoint)) continue;
        const hits = raycaster.intersectObject(mesh, false);
        if (hits[0] && hits[0].distance < nearest) {
          nearest = hits[0].distance;
          foundIndex = i;
        }
      }

      if (foundIndex >= 0) {
        setHoveredPart(atlasRef.current.parts[foundIndex]);
        renderer.domElement.style.cursor = toolModeRef.current === 'scalpel' ? 'crosshair' : 'pointer';
      } else {
        setHoveredPart(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const isTap = pointerTap.up(e.pointerId, e.clientX, e.clientY);
      if (!isTap || !atlasRef.current || !partDataRef.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const partData = partDataRef.current;
      const pickers = pickersRef.current;
      const bounds = atlasRef.current.parts.map(
        (p) => new THREE.Box3(new THREE.Vector3(...p.bounds[0]), new THREE.Vector3(...p.bounds[1]))
      );

      let nearest = Infinity;
      let foundIndex = -1;

      for (let i = 0; i < pickers.length; i++) {
        const mesh = pickers[i];
        if (!mesh || partData[i * 4 + 3] < 0.5) continue;
        if (atlasRef.current.parts[i].system === 'integumentary') continue;

        if (!raycaster.ray.intersectBox(bounds[i], hitPoint)) continue;
        const hits = raycaster.intersectObject(mesh, false);
        if (hits[0] && hits[0].distance < nearest) {
          nearest = hits[0].distance;
          foundIndex = i;
        }
      }

      if (foundIndex >= 0) {
        const clickedPart = atlasRef.current.parts[foundIndex];
        const mode = toolModeRef.current;

        if (mode === 'scalpel') {
          // DISSECT MODE: Cut and hide this exact part
          if (onDissectPartRef.current) {
            onDissectPartRef.current(clickedPart);
          }
        } else {
          // INSPECT / ISOLATE MODE: Select structure
          if (onSelectOrganIdRef.current) {
            onSelectOrganIdRef.current(clickedPart.id);
          }
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);

    // 10. Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 11. Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      if (disposed) return;
      animationFrameId = requestAnimationFrame(animate);
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

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      abortCtrl.abort();
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Theme & Background
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(isLight ? 0xf8fafc : 0x070b14);
    }
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = isLight ? 1.12 : 1.25;
    }
  }, [isLight]);

  // Update GPU DataTexture when hiddenPartIds, isolatedPartId, or layerPeel changes
  useEffect(() => {
    const atlas = atlasRef.current;
    const partData = partDataRef.current;
    const partTexture = partTextureRef.current;
    if (!atlas || !partData || !partTexture) return;

    const hiddenSet = new Set(hiddenPartIds);
    const isolatedId = isolatedPartId;

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

    atlas.parts.forEach((p, i) => {
      let visible = 1.0;

      // 1. Check if manually dissected/cut
      if (hiddenSet.has(p.id)) {
        visible = 0.0;
      }
      // 2. Check if depth peeled
      else if (peeledSystems.has(p.system)) {
        visible = 0.0;
      }
      // 3. Check if another structure is isolated
      else if (isolatedId && p.id !== isolatedId && p.conceptId !== isolatedId) {
        visible = 0.0;
      }

      partData[i * 4 + 3] = visible;
    });

    partTexture.needsUpdate = true;
  }, [hiddenPartIds, isolatedPartId, layerPeel]);

  // Update GPU Selection DataTexture when selectedOrganId changes
  useEffect(() => {
    const atlas = atlasRef.current;
    const selectionData = selectionDataRef.current;
    const selectionTexture = selectionTextureRef.current;
    if (!atlas || !selectionData || !selectionTexture) return;

    atlas.parts.forEach((p, i) => {
      const isSelected = selectedOrganId && (p.id === selectedOrganId || p.conceptId === selectedOrganId);
      selectionData[i * 4] = isSelected ? 255 : 0;
    });

    selectionTexture.needsUpdate = true;
  }, [selectedOrganId]);

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
