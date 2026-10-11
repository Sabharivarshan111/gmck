import { useEffect, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gunzipSync } from 'fflate';
import { startVisibleFrameLoop } from '../engine/visibleFrameLoop';
import type { StethoscopeAudioEngine } from './StethoscopeSynthesizer';

/** Reference meshes retain their registered metre/Y-up coordinates. No drawn anatomy. */
export default function AuscultationThorax({ back, xray, listening, motion, pulmonary, engineRef }: { back: boolean; xray: boolean; listening: boolean; motion: boolean; pulmonary: boolean; engineRef: RefObject<StethoscopeAudioEngine | null> }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controls = useRef<{ update: () => void } | null>(null);
  const latest = useRef({ back, xray, listening, motion, pulmonary }); latest.current = { back, xray, listening, motion, pulmonary };
  const [snapshotError, setSnapshotError] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { setStatus('unavailable'); return; }
    let disposed = false;
    const abort = new AbortController();
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-.25, .25, .25, -.25, .01, 5);
    const anatomy = new THREE.Group(); scene.add(anatomy);
    scene.add(new THREE.HemisphereLight(0xe6f4ff, 0x26374b, 2));
    const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(-1, 2, 3); scene.add(light);
    const fill = new THREE.DirectionalLight(0x9edcff, 1.4); fill.position.set(1, 1, -2); scene.add(fill);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const moving: { pivot: THREE.Group; pulmonary: boolean }[] = [];
    const addPivots = (root: THREE.Object3D, lungs: boolean) => {
      const meshes: THREE.Mesh[] = [];
      root.traverse(node => { if (node instanceof THREE.Mesh && (lungs || node.name === 'cardiac')) meshes.push(node); });
      for (const mesh of meshes) {
        if (!mesh.parent) continue;
        mesh.geometry.computeBoundingBox();
        const center = mesh.geometry.boundingBox!.getCenter(new THREE.Vector3()).add(mesh.position);
        const pivot = new THREE.Group(); pivot.position.copy(center);
        const parent = mesh.parent; parent.add(pivot); pivot.add(mesh); mesh.position.sub(center);
        moving.push({ pivot, pulmonary: lungs });
      }
    };
    const render = () => {
      if (disposed || document.hidden) return;
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      const halfHeight = .255, halfWidth = halfHeight * width / height;
      camera.left = -halfWidth; camera.right = halfWidth; camera.top = halfHeight; camera.bottom = -halfHeight;
      camera.position.set(0, 1.305, latest.current.back ? -2 : 2);
      camera.lookAt(0, 1.305, 0); camera.updateProjectionMatrix();
      anatomy.traverse(child => {
        if (!(child instanceof THREE.Mesh)) return;
        const material = child.material as THREE.MeshStandardMaterial;
        const skin = child.name === 'integumentary';
        child.visible = skin || latest.current.xray;
        if (child.name === 'muscular') child.visible = !latest.current.xray;
        if (skin) {
          material.transparent = latest.current.xray;
          material.opacity = latest.current.xray ? .12 : 1;
          material.depthWrite = !latest.current.xray;
        }
      });
      renderer.render(scene, camera);
    };
    controls.current = { update: render };
    const disposeObject = (object: THREE.Object3D) => object.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      child.geometry.dispose();
      for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
        material.dispose();
      }
    });
    const loadThorax = async () => {
      const response = await fetch('/models/auscultation_thorax_bp3d.glb.gz', { signal: abort.signal });
      if (!response.ok) throw new Error('Chest model unavailable');
      const bytes = new Uint8Array(await response.arrayBuffer());
      // Also accept hosts that decode Content-Encoding before returning the body.
      const decoded = bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes;
      const gltf = await new GLTFLoader().parseAsync(decoded.buffer.slice(decoded.byteOffset, decoded.byteOffset + decoded.byteLength) as ArrayBuffer, '');
      if (disposed) { disposeObject(gltf.scene); return; }
      addPivots(gltf.scene, false);
      anatomy.add(gltf.scene);
    };
    const loadLungs = async () => {
      const gltf = await new GLTFLoader().loadAsync('/models/lungs_candidate_zanatomy_full.glb');
      if (disposed) { disposeObject(gltf.scene); return; }
      // This supplement is already registered to the same BodyParts3D coordinates.
      gltf.scene.traverse(child => {
        if (!(child instanceof THREE.Mesh)) return;
        for (const material of Array.isArray(child.material) ? child.material : [child.material]) material.dispose();
        child.material = new THREE.MeshStandardMaterial({ color: '#bf777d', roughness: .7, transparent: true, opacity: .32, depthWrite: false, side: THREE.DoubleSide });
      });
      addPivots(gltf.scene, true);
      anatomy.add(gltf.scene);
    };
    host.appendChild(renderer.domElement);
    const lost = (event: Event) => { event.preventDefault(); setStatus('unavailable'); };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    const observer = new ResizeObserver(render); observer.observe(host);
    document.addEventListener('visibilitychange', render);
    void Promise.all([loadThorax(), loadLungs()]).then(() => {
      if (!disposed) { render(); setStatus('ready'); }
    }).catch(() => { if (!disposed) setStatus('unavailable'); });
    let lastFrame = 0;
    let wasMoving = false;
    const stopMotion = startVisibleFrameLoop(time => {
      if (time - lastFrame < 33) return;
      lastFrame = time;
      const enabled = latest.current.listening && latest.current.motion && latest.current.xray;
      if (!enabled && !wasMoving) return;
      wasMoving = enabled;
      const trace = enabled ? engineRef.current?.getTrace() : null;
      for (const item of moving) {
        let scale = 1;
        if (trace && item.pulmonary === latest.current.pulmonary) {
          const label = item.pulmonary ? 'Inspiration' : 'S1';
          const event = [...trace.events].reverse().find(e => e.label === label && e.time <= trace.time);
          if (event) {
            const elapsed = trace.time - event.time;
            if (item.pulmonary) {
              const expiration = trace.events.find(e => e.label === 'Expiration' && e.time > event.time);
              const inspirationLength = expiration ? expiration.time - event.time : 2;
              const expansion = elapsed <= inspirationLength ? Math.sin(Math.PI * .5 * elapsed / inspirationLength) : Math.max(0, 1 - (elapsed - inspirationLength) / Math.max(.2, inspirationLength * .55));
              scale = 1 + .035 * expansion;
            } else {
              scale = 1 - .055 * Math.max(0, Math.sin(Math.PI * Math.min(1, elapsed / .4)));
            }
          }
        }
        item.pivot.scale.setScalar(scale);
      }
      render();
    });
    return () => {
      stopMotion();
      disposed = true; abort.abort(); controls.current = null; observer.disconnect(); document.removeEventListener('visibilitychange', render);
      renderer.domElement.removeEventListener('webglcontextlost', lost); disposeObject(anatomy); renderer.dispose(); renderer.domElement.remove();
    };
  }, [engineRef]);
  useEffect(() => { controls.current?.update(); }, [back, xray]);
  return <>
    <div ref={hostRef} className="ausc-webgl" style={{visibility:status === 'ready' ? 'visible' : 'hidden'}} />
    {status !== 'ready' && !snapshotError && <img className="ausc-source-render" src={`/models/auscultation-${back ? 'back' : 'front'}-${xray ? 'xray' : 'surface'}.webp`} alt={`${back ? 'Posterior' : 'Anterior'} BodyParts3D chest reference${xray ? ', transparent skin with ribs, heart and vessels' : ', skin surface'}`} onError={() => setSnapshotError(true)} />}
    {status !== 'ready' && snapshotError && <div className="ausc-model-unavailable" role="status"><strong>{status === 'loading' ? 'Loading anatomical chest…' : '3D chest unavailable'}</strong><span>{status === 'loading' ? 'Preparing source anatomy' : 'Use the listening-point selector below. A WebGL-capable browser is needed for the anatomical view.'}</span></div>}
    <span className="ausc-model-status">{status === 'ready' ? 'BodyParts3D chest · registered Z-Anatomy lungs' : status === 'loading' ? 'Loading 3D · source-model reference' : 'Static anatomical reference · 3D unavailable'}</span>
  </>;
}
