import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gunzipSync } from 'fflate';
import {
  CORONARY_MESH_GROUPS,
  type CoronarySceneConfig,
} from '../src/lib/coronaryModel';
import manifest from './assets/manifest.json';
import payload from './model-payload.json';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (data: string) => void };
    updateCoronaryScene: (data: CoronarySceneConfig) => void;
    __orbitCoronary?: Record<string, unknown>;
    __orbitCoronaryBoot?: () => void;
  }
}
const canvas = document.querySelector('canvas')!;
const status = document.getElementById('status')!;
const badge = document.getElementById('badge')!;
const send = (data: Record<string, unknown>) => {
  const text = JSON.stringify(data);
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(text);
  else if (parent !== window)
    parent.postMessage({ channel: 'orbit-coronary-webgl', payload: text }, '*');
};
let config: CoronarySceneConfig = {
  angles: { oblique: 45, tilt: -30 },
  mode: 'anatomy',
  selected: 'LM',
  system: 'both',
  shell: true,
  labels: true,
  zoom: 1,
  reset: 0,
  active: true,
};
let renderer: THREE.WebGLRenderer, controls: OrbitControls;
let stopped = false,
  dirty = true,
  raf = 0,
  frame = 0,
  failed = false,
  ready = false;
let lastReset = 0,
  lastZoom = 1,
  lastMode = 'anatomy';
const scene = new THREE.Scene(),
  projection = new THREE.Scene();
scene.background = new THREE.Color('#11111b');
projection.background = new THREE.Color('#181720');
const camera = new THREE.PerspectiveCamera(34, 1, 0.03, 100);
camera.position.set(0, 0, 6.3);
const detectorCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.03, 100);
const heart = new THREE.Group(),
  projectedVessels = new THREE.Group(),
  room = new THREE.Group(),
  arm = new THREE.Group();
const body = new THREE.Group();
body.add(heart, arm);
scene.add(body, room);
projection.add(projectedVessels);
scene.add(new THREE.HemisphereLight(0xffffff, 0x283047, 0.4));
const key = new THREE.DirectionalLight(0xffffff, 1.05);
key.position.set(-3, 3, 6);
scene.add(key);
const rim = new THREE.DirectionalLight(0x9dc8ff, 0.45);
rim.position.set(3, 1, -3);
scene.add(rim);
const fill = new THREE.DirectionalLight(0xffffff, 0.3);
fill.position.set(0, -2, -3);
scene.add(fill);
const contextMeshes: THREE.Mesh[] = [];
const arteryMeshes: THREE.Mesh[] = [];
const shadows: THREE.Mesh[] = [];
const pickable: THREE.Mesh[] = [];
const pickRay = new THREE.Raycaster();
const selectGroups = new Map(
  CORONARY_MESH_GROUPS.flatMap(g => g.sourceIds.map(id => [id, g] as const)),
);
let triangles = 0;
const normal = new THREE.Vector3(),
  up = new THREE.Vector3(0, 1, 0);
const resources: Array<THREE.BufferGeometry | THREE.Material | THREE.Texture> =
  [];
function box(
  size: [number, number, number],
  color: number,
  position: [number, number, number],
) {
  const geo = new THREE.BoxGeometry(...size),
    mat = new THREE.MeshStandardMaterial({ color, roughness: 0.58 });
  resources.push(geo, mat);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...position);
  return m;
}
function label(text: string): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#101018cc';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#c6f4ff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 43);
  const texture = new THREE.CanvasTexture(c),
    material = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      transparent: true,
    });
  resources.push(texture, material);
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.05, 0.26, 1);
  sprite.renderOrder = 10;
  return sprite;
}
const detector = box([0.9, 0.9, 0.09], 0x66c2d5, [0, 0, 2.7]);
const tube = box([0.35, 0.35, 0.35], 0x637385, [0, 0, -2.7]);
arm.add(detector, tube);
const detLabel = label('Detector'),
  tubeLabel = label('X-ray tube');
arm.add(detLabel, tubeLabel);
const beamGeo = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 0, -2.7),
  new THREE.Vector3(0, 0, 2.7),
]);
const beamMat = new THREE.LineDashedMaterial({
  color: 0x81deef,
  dashSize: 0.12,
  gapSize: 0.1,
  transparent: true,
  opacity: 0.7,
});
const beam = new THREE.Line(beamGeo, beamMat);
beam.computeLineDistances();
arm.add(beam);
resources.push(beamGeo, beamMat);
const arc = new THREE.CatmullRomCurve3(
  Array.from(
    { length: 65 },
    (_, i) =>
      new THREE.Vector3(
        -2.7 * Math.sin((i * Math.PI) / 64),
        0,
        2.7 * Math.cos((i * Math.PI) / 64),
      ),
  ),
);
const arcGeo = new THREE.TubeGeometry(arc, 64, 0.095, 8, false),
  arcMat = new THREE.MeshStandardMaterial({ color: 0x85879e, roughness: 0.35 });
resources.push(arcGeo, arcMat);
const cArm = new THREE.Mesh(arcGeo, arcMat);
arm.add(cArm);
room.add(box([2.1, 0.1, 6.7], 0x343547, [0, -1.05, 0]));
room.add(
  box([0.16, 1.2, 0.16], 0x4f5268, [-0.7, -1.7, -2.2]),
  box([0.16, 1.2, 0.16], 0x4f5268, [0.7, -1.7, 2.2]),
);
const patientGeo = new THREE.CapsuleGeometry(0.42, 3.8, 5, 10),
  patientMat = new THREE.MeshStandardMaterial({
    color: 0x7e738b,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
resources.push(patientGeo, patientMat);
const patient = new THREE.Mesh(patientGeo, patientMat);
patient.rotation.x = Math.PI / 2;
patient.position.y = -0.5;
room.add(patient);
const grid = new THREE.GridHelper(12, 16, 0x3b3b55, 0x252538);
grid.position.y = -2.3;
room.add(grid);
const gridMat = Array.isArray(grid.material) ? grid.material : [grid.material];
resources.push(grid.geometry, ...gridMat);

function fail(reason: string) {
  failed = true;
  status.textContent =
    '3D graphics could not open. Use Retry, or try a device with WebGL enabled.';
  status.style.display = 'flex';
  send({ type: 'error', message: reason.slice(0, 200) });
}
function resize() {
  if (!renderer) return;
  const w = Math.max(1, innerWidth),
    h = Math.max(1, innerHeight);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  const span = 1.85 / config.zoom;
  detectorCamera.left = (-span * w) / h;
  detectorCamera.right = (span * w) / h;
  detectorCamera.top = span;
  detectorCamera.bottom = -span;
  detectorCamera.updateProjectionMatrix();
  dirty = true;
  wake();
}
function apply() {
  if (!renderer || !ready) return;
  const a = THREE.MathUtils.degToRad(
    THREE.MathUtils.clamp(config.angles.oblique, -90, 90),
  );
  const t = THREE.MathUtils.degToRad(
    THREE.MathUtils.clamp(config.angles.tilt, -45, 45),
  );
  normal.set(Math.sin(a) * Math.cos(t), Math.sin(t), Math.cos(a) * Math.cos(t));
  detector.position.copy(normal).multiplyScalar(2.7);
  tube.position.copy(normal).multiplyScalar(-2.7);
  detector.lookAt(0, 0, 0);
  tube.lookAt(0, 0, 0);
  detLabel.position.copy(detector.position).addScaledVector(up, 0.55);
  tubeLabel.position.copy(tube.position).addScaledVector(up, -0.45);
  detLabel.visible = tubeLabel.visible = config.labels;
  beamGeo.setFromPoints([tube.position, detector.position]);
  beam.computeLineDistances();
  // The C-arm rotates in 3D with source/detector; this is not an SVG drawing.
  cArm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  cArm.visible = config.mode === 'room';
  room.visible = config.mode === 'room';
  arm.visible = config.mode === 'room';
  body.rotation.x = config.mode === 'room' ? -Math.PI / 2 : 0;
  heart.position.y = room.visible ? -0.02 : 0;
  for (const m of contextMeshes) m.visible = config.shell;
  for (let i = 0; i < arteryMeshes.length; i++) {
    const m = arteryMeshes[i],
      group = selectGroups.get(m.userData.element)!;
    m.visible = config.system === 'both' || group.system === config.system;
    shadows[i].visible = m.visible;
    const chosen = group.id === config.selected;
    const mat = m.material as THREE.MeshStandardMaterial;
    mat.color.set(chosen ? '#f3a7ff' : '#dc2626');
    mat.emissive.set(chosen ? '#75337e' : '#611010');
    (shadows[i].material as THREE.MeshBasicMaterial).color.set(
      chosen ? '#edb7ff' : '#e4e0e7',
    );
  }
  detectorCamera.position.copy(normal).multiplyScalar(8);
  detectorCamera.up.set(0, 1, 0);
  detectorCamera.lookAt(0, 0, 0);
  detectorCamera.updateMatrixWorld();
  if (config.reset !== lastReset || config.mode !== lastMode) {
    camera.position.set(
      config.mode === 'room' ? 6.7 : 0,
      config.mode === 'room' ? 4.5 : 0,
      config.mode === 'room' ? 8.5 : 6.3,
    );
    controls.target.set(0, 0, 0);
    controls.update();
    lastReset = config.reset;
    lastMode = config.mode;
    lastZoom = 1;
  }
  if (config.zoom !== lastZoom) {
    camera.position
      .sub(controls.target)
      .multiplyScalar(lastZoom / config.zoom)
      .add(controls.target);
    lastZoom = config.zoom;
  }
  controls.enabled = config.mode !== 'projection';
  badge.textContent = config.labels
    ? `${config.selected} · ${
        config.mode === 'projection'
          ? 'live geometry projection'
          : 'BodyParts3D reference'
      }`
    : '';
  resize();
  dirty = true;
  wake();
}
function render() {
  raf = 0;
  if (stopped || document.hidden || !config.active || failed || !ready) return;
  if (dirty) {
    renderer.render(
      config.mode === 'projection' ? projection : scene,
      config.mode === 'projection' ? detectorCamera : camera,
    );
    dirty = false;
    frame++;
    window.__orbitCoronary = {
      renderer: 'WebGL',
      frame,
      meshes: arteryMeshes.length,
      triangles,
      selected: config.selected,
      mode: config.mode,
      oblique: config.angles.oblique,
      tilt: config.angles.tilt,
      shell: config.shell,
      visibleMeshes: arteryMeshes.filter(m => m.visible).length,
      modelSha256: manifest.runtime.sha256,
    };
  }
}
function wake() {
  if (!raf && !stopped && config.active) raf = requestAnimationFrame(render);
}
window.updateCoronaryScene = data => {
  config = { ...config, ...data };
  config.zoom = THREE.MathUtils.clamp(config.zoom, 0.7, 1.5);
  apply();
};
window.addEventListener('message', event => {
  if (
    event.source === parent &&
    event.data?.channel === 'orbit-coronary-config'
  )
    window.updateCoronaryScene(event.data.config);
});
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => {
  dirty = true;
  wake();
});
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  fail('WebGL context lost');
});
canvas.addEventListener('webglcontextrestored', () => location.reload());
let down: { x: number; y: number } | null = null;
canvas.addEventListener('pointerdown', event => {
  down = { x: event.clientX, y: event.clientY };
});
canvas.addEventListener('pointerup', event => {
  if (!down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) {
    down = null;
    return;
  }
  down = null;
  if (config.mode === 'projection') return;
  pickRay.setFromCamera(
    new THREE.Vector2(
      (event.clientX / innerWidth) * 2 - 1,
      (-event.clientY / innerHeight) * 2 + 1,
    ),
    camera,
  );
  const hit = pickRay.intersectObjects(
    pickable.filter(m => m.visible),
    false,
  )[0];
  if (hit) {
    const id = selectGroups.get(hit.object.userData.element)?.id;
    if (id) {
      config.selected = id;
      apply();
      send({ type: 'select', id });
    }
  }
});
window.addEventListener('pagehide', () => {
  stopped = true;
  if (raf) cancelAnimationFrame(raf);
  controls?.dispose();
  heart.traverse(obj => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material.dispose();
    }
  });
  shadows.forEach(m => (m.material as THREE.Material).dispose());
  resources.forEach(r => r.dispose());
  renderer?.dispose();
});
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.minDistance = 3.2;
  controls.maxDistance = 15;
  controls.enablePan = false;
  controls.addEventListener('change', () => {
    dirty = true;
    wake();
  });
  const binary = Uint8Array.from(atob(payload.data), c => c.charCodeAt(0));
  const bytes = gunzipSync(binary);
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  new GLTFLoader().parse(
    buffer,
    '',
    gltf => {
      try {
        for (const structure of manifest.structures) {
          const original = gltf.scene.getObjectByName(
            structure.id,
          ) as THREE.Mesh;
          if (!original?.isMesh)
            throw Error(`Missing model group ${structure.id}`);
          if (
            structure.id === 'left-coronary' ||
            structure.id === 'right-coronary'
          ) {
            let vertexOffset = 0,
              indexOffset = 0;
            const source = original.geometry,
              index = source.getIndex()!;
            for (const part of structure.sources) {
              const group = selectGroups.get(part.element);
              if (!group) throw Error('Unmapped source ' + part.element);
              const geometry = new THREE.BufferGeometry();
              for (const name of ['position', 'normal']) {
                const attr = source.getAttribute(name);
                const values = new Float32Array(part.vertices * 3);
                for (let v = 0; v < part.vertices; v++) {
                  const at = vertexOffset + v;
                  values[v * 3] = attr.getX(at);
                  values[v * 3 + 1] = attr.getY(at);
                  values[v * 3 + 2] = attr.getZ(at);
                }
                geometry.setAttribute(
                  name,
                  new THREE.BufferAttribute(values, 3),
                );
              }
              const indexes = Array.from(
                index.array.slice(
                  indexOffset,
                  indexOffset + part.triangles * 3,
                ),
                n => n - vertexOffset,
              );
              if (indexes.some(n => n < 0 || n >= part.vertices))
                throw Error('Source range mismatch ' + part.element);
              geometry.setIndex(indexes);
              geometry.computeBoundingSphere();
              const material = new THREE.MeshStandardMaterial({
                color: 0xdc2626,
                roughness: 0.45,
                metalness: 0.02,
              });
              const mesh = new THREE.Mesh(geometry, material);
              mesh.name = part.element;
              mesh.userData = { element: part.element, group: group.id };
              heart.add(mesh);
              arteryMeshes.push(mesh);
              pickable.push(mesh);
              const shadow = new THREE.Mesh(
                geometry,
                new THREE.MeshBasicMaterial({ color: 0xe4e0e7 }),
              );
              projectedVessels.add(shadow);
              shadows.push(shadow);
              triangles += part.triangles;
              vertexOffset += part.vertices;
              indexOffset += part.triangles * 3;
            }
            if (
              vertexOffset !== source.getAttribute('position').count ||
              indexOffset !== index.count
            )
              throw Error('Incomplete coronary source split');
            source.dispose();
          } else {
            // Spaces (ventricular cavity casts) are not muscle and stay omitted.
            if (
              structure.id === 'left-ventricle' ||
              structure.id === 'right-ventricle'
            ) {
              original.geometry.dispose();
              continue;
            }
            const material = new THREE.MeshStandardMaterial({
              color: structure.id.includes('atrium') ? 0xa34554 : 0x991b1b,
              roughness: 0.5,
              transparent: true,
              opacity: structure.id === 'ventricular-wall' ? 0.14 : 0.12,
              depthWrite: false,
              side: THREE.DoubleSide,
            });
            const m = new THREE.Mesh(original.geometry, material);
            m.name = structure.id;
            heart.add(m);
            contextMeshes.push(m);
          }
          if (Array.isArray(original.material))
            original.material.forEach(m => m.dispose());
          else original.material.dispose();
        }
        if (arteryMeshes.length !== 54)
          throw Error('Coronary mesh count mismatch');
        ready = true;
        status.style.display = 'none';
        apply();
        send({
          type: 'ready',
          renderer: 'WebGL',
          meshes: arteryMeshes.length,
          triangles,
        });
      } catch (error) {
        fail(String(error));
      }
    },
    error => fail(String(error)),
  );
} catch (error) {
  fail(String(error));
}
