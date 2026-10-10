import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Dedicated lightweight viewer; organ placement and chest surface are illustrative. */
export default function AuscultationThorax({ back, xray }: { back: boolean; xray: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controls = useRef<{ update: (back: boolean, xray: boolean) => void } | null>(null);
  const latest = useRef({ back, xray }); latest.current = { back, xray };
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { setStatus('fallback'); return; }
    let disposed = false;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
    const group = new THREE.Group(); scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const light = new THREE.DirectionalLight(0xffffff, 2.4); light.position.set(2, 3, 5); scene.add(light);
    const surface = new THREE.MeshPhongMaterial({ color: '#469bb0', transparent: true, opacity: 0.35, depthWrite: false });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.47, 0.56, 8, 24), surface);
    torso.scale.set(1.55, 1, 0.6); torso.position.y = -0.1; group.add(torso);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.4, 20), surface);
    neck.position.y = 0.74; group.add(neck);
    const ribs = new THREE.Group(); group.add(ribs);
    for (let i = 0; i < 7; i++) for (const side of [-1, 1]) {
      const points = [new THREE.Vector3(side * 0.05, 0.48 - i * 0.14, 0.27), new THREE.Vector3(side * 0.38, 0.42 - i * 0.14, 0.33), new THREE.Vector3(side * 0.61, 0.42 - i * 0.14, 0.1)];
      ribs.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, 0.018, 6, false), new THREE.MeshStandardMaterial({color:'#f0e8d1',transparent:true,opacity:0.6})));
    }
    const render = () => {
      if (disposed || document.hidden) return;
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      // Scene coordinates match percentage overlay coordinates for both views.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.left = -1; camera.right = 1; camera.top = 1; camera.bottom = -1;
      camera.position.set(0, 0, latest.current.back ? -4 : 4); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
      surface.opacity = latest.current.xray ? 0.16 : 0.65;
      ribs.visible = latest.current.xray;
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
    const load = async (url: string, size: THREE.Vector3, position: THREE.Vector3) => {
      const gltf = await new GLTFLoader().loadAsync(url);
      if (disposed) { disposeObject(gltf.scene); return; }
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const dimensions = box.getSize(new THREE.Vector3());
      const factor = Math.min(size.x / dimensions.x, size.y / dimensions.y, size.z / dimensions.z);
      if (!Number.isFinite(factor) || factor <= 0) { disposeObject(gltf.scene); throw new Error('Invalid organ bounds'); }
      const center = box.getCenter(new THREE.Vector3());
      gltf.scene.scale.multiplyScalar(factor); gltf.scene.position.copy(center.multiplyScalar(-factor).add(position));
      group.add(gltf.scene); render();
    };
    host.appendChild(renderer.domElement);
    const lost = (event: Event) => { event.preventDefault(); setStatus('fallback'); };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    const observer = new ResizeObserver(render); observer.observe(host);
    document.addEventListener('visibilitychange', render);
    render();
    void Promise.allSettled([
      load('/models/hra_heart_male_v1.3.glb', new THREE.Vector3(0.4, 0.5, 0.3), new THREE.Vector3(0.12, -0.1, 0.1)),
      load('/models/lungs_candidate_zanatomy_full.glb', new THREE.Vector3(1.1, 1.15, 0.4), new THREE.Vector3(0, 0.05, -0.04)),
    ]).then(results => { if (!disposed) setStatus(results.every(r => r.status === 'fulfilled') ? 'ready' : 'fallback'); });
    return () => {
      disposed = true; controls.current = null; observer.disconnect(); document.removeEventListener('visibilitychange', render);
      renderer.domElement.removeEventListener('webglcontextlost', lost); disposeObject(group); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  useEffect(() => { controls.current?.update(back, xray); }, [back, xray]);
  return <>
    <div ref={hostRef} className="ausc-webgl" style={{visibility:status === 'fallback' ? 'hidden' : 'visible'}} />
    {status === 'fallback' && <svg className="ausc-surface" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M41 4H59L61 18Q88 20 91 40L84 97H16L9 40Q12 20 39 18Z" fill="#397c91" fillOpacity=".45" stroke="#75bac8" strokeWidth=".5"/><path d="M49 20V88M51 20V88" stroke="#d1e5e7" strokeWidth="1"/>{[30,39,48,57,66,75].map(y=><path key={y} d={`M49 ${y} Q30 ${y-5} 19 ${y+6} M51 ${y} Q70 ${y-5} 81 ${y+6}`} stroke="#dae4d6" strokeWidth=".8" fill="none" />)}</svg>}
    <span className="ausc-model-status">{status === 'ready' ? '3D organs · illustrative placement' : status === 'loading' ? 'Loading 3D organs…' : 'Surface guide · 3D unavailable'}</span>
  </>;
}
