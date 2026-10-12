import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { EyeExamResponse, EyeSide } from './eyeExamModel';
export interface EyeAnchors { right:{x:number;y:number}; left:{x:number;y:number} }
const fallbackAnchors:EyeAnchors = {right:{x:.35,y:.45},left:{x:.65,y:.45}};
interface Props { response:EyeExamResponse; light:'none'|EyeSide|'both'; onAnchors:(anchors:EyeAnchors)=>void; onSample:(response:EyeExamResponse)=>void; scleralTint?:number; inspection?:boolean }
export function EyeHeadView({response,light,onAnchors,onSample,scleralTint=0,inspection=false}:Props) {
  const mount = useRef<HTMLDivElement>(null);
  const latest = useRef({response,light,onAnchors,onSample,scleralTint}); latest.current={response,light,onAnchors,onSample,scleralTint};
  const [status,setStatus] = useState<'loading'|'ready'|'error'>('loading');
  useEffect(()=>{
    const container=mount.current;if(!container)return;
    let disposed=false,frame=0,lastRender=0,lastSample=0;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(34,1,.01,4);camera.position.set(0,inspection?1.644:1.625,inspection?.24:.47);camera.lookAt(0,inspection?1.644:1.625,.025);
    let renderer:THREE.WebGLRenderer;
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'}); }
    catch { setStatus('error'); latest.current.onAnchors(fallbackAnchors);return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
    renderer.domElement.setAttribute('aria-label','Interactive 3D facial examination reference');container.append(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xfff3e8,0x303049,1.6));
    const key=new THREE.DirectionalLight(0xffeee1,2.8);key.position.set(-.2,1.9,.5);scene.add(key);
    const fill=new THREE.DirectionalLight(0xc9e2ff,1.1);fill.position.set(.3,1.7,.3);scene.add(fill);
    const lamps={right:new THREE.SpotLight(0xffefac,0,1,.22,.6,1),left:new THREE.SpotLight(0xffefac,0,1,.22,.6,1)};
    for(const lamp of Object.values(lamps))scene.add(lamp,lamp.target);
    const textures=new Map<string,THREE.Texture>();const materials:THREE.Material[]=[];
    const texture = (name:string) => {const t=new THREE.TextureLoader().load(`/models/eye-exam/${name}.webp`);t.colorSpace=THREE.SRGBColorSpace;t.flipY=false;t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.RepeatWrapping;textures.set(name,t);return t;};
    const faceTexture=texture('face'),mouthTexture=texture('mouth'),irisTexture=texture('iris'),scleraTexture=texture('sclera');
    const skin=new THREE.MeshStandardMaterial({map:faceTexture,roughness:.6});materials.push(skin);
    const mouthMat=new THREE.MeshStandardMaterial({map:mouthTexture,roughness:.65});materials.push(mouthMat);
    const sclera=new THREE.MeshStandardMaterial({map:scleraTexture,color:0xfffaf3,roughness:.36,alphaTest:.5});materials.push(sclera);
    const cornea=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.06,transparent:true,opacity:.14,depthWrite:false,clearcoat:1});materials.push(cornea);
    const tear=new THREE.MeshStandardMaterial({color:0xba7d75,roughness:.25});materials.push(tear);
    const eyes:Partial<Record<EyeSide,THREE.Object3D>>={};
    const pupils:Partial<Record<EyeSide,THREE.ShaderMaterial>>={};
    const morphs:THREE.Mesh[]=[];
    let model:THREE.Object3D|null=null;
    const displayed:EyeExamResponse={right:{...response.right},left:{...response.left},mouth:response.mouth,lightDrive:response.lightDrive};
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const anchors=()=>{
      const result={...fallbackAnchors};
      for(const side of ['right','left'] as const){const eye=eyes[side];if(!eye)continue;const p=eye.getWorldPosition(new THREE.Vector3()).project(camera);result[side]={x:p.x*.5+.5,y:-p.y*.5+.5};}
      latest.current.onAnchors(result);
    };
    const resize=()=>{const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();anchors();};
    const observer=new ResizeObserver(resize);observer.observe(container);resize();
    const loader=new GLTFLoader();
    loader.load('/models/eye-exam/reference-head.glb',gltf=>{
      if(disposed){gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});return;}
      model=gltf.scene;
      model.traverse(o=>{
        if(o.name.startsWith('Eye_') && o.name.endsWith('_eyeball'))eyes[o.position.x<0?'right':'left']=o;
        if(!(o instanceof THREE.Mesh))return;
        const old=o.material as THREE.Material;const name=old.name;
        if(name.startsWith('VitSkin'))o.material=skin;
        else if(name.startsWith('VitMouth'))o.material=mouthMat;
        else if(name.startsWith('VitSclera'))o.material=sclera;
        else if(name.startsWith('VitCornea'))o.material=cornea;
        else if(name.startsWith('VitIris')){
          const side=o.parent?.position.x && o.parent.position.x<0 ? 'right':'left';
          const mat=new THREE.ShaderMaterial({uniforms:{map:{value:irisTexture},pupil:{value:.16}},
            vertexShader:'varying vec2 eyeUV; void main(){eyeUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
            fragmentShader:'uniform sampler2D map; uniform float pupil; varying vec2 eyeUV; void main(){vec2 p=eyeUV-vec2(.5);float r=length(p);float t=clamp((r-pupil)/max(.01,.5-pupil),0.,1.);vec2 uv=vec2(.5)+normalize(p+vec2(.00001))*(.23+t*.27);vec3 c=texture2D(map,uv).rgb;if(r<pupil)c=vec3(.009,.006,.007);gl_FragColor=vec4(c,1.);}' });
          pupils[side]=mat;materials.push(mat);o.material=mat;
        } else if(name.startsWith('VitEyeBack')) {const mat=new THREE.MeshBasicMaterial({color:0x070505});materials.push(mat);o.material=mat;}
        else o.material=tear;
        old.dispose();
        if(o.morphTargetDictionary)morphs.push(o);
      });
      scene.add(model);anchors();setStatus('ready');
    },undefined,()=>{if(!disposed)setStatus('error');});
    const animate=(now:number)=>{
      if(disposed)return;frame=requestAnimationFrame(animate);
      if(document.hidden || now-lastRender<1000/30)return;
      const dt=Math.min(.1,(now-lastRender)/1000||.033);lastRender=now;
      const smoothing=reduced.matches?1:1-Math.exp(-dt*9);
      for(const side of ['right','left'] as const){
        const target=latest.current.response[side],shown=displayed[side];
        for(const key of ['pupil','x','y','lid','blink','ptosis','brow','smile'] as const)shown[key]+=(target[key]-shown[key])*smoothing;
        const eye=eyes[side];if(eye){eye.rotation.y=shown.x*.34;eye.rotation.x=shown.y*.25;}
        const pupil=pupils[side];if(pupil)pupil.uniforms.pupil.value=shown.pupil/24;
      }
      displayed.mouth+=(latest.current.response.mouth-displayed.mouth)*smoothing;
      for(const mesh of morphs){const dict=mesh.morphTargetDictionary!,values=mesh.morphTargetInfluences!;
        for(const side of ['right','left'] as const){const suffix=side==='left'?'Left':'Right';for(const [name,value] of [[`Eyes_Closed_${suffix}`,displayed[side].blink],[`Upper_Lid_${suffix}`,displayed[side].ptosis*(1-displayed[side].blink)],[`Eyebrows_Raised_${suffix}`,displayed[side].brow],[`Lips_Up_Corner_Wide_${suffix}`,displayed[side].smile]] as const){if(dict[name]!==undefined)values[dict[name]]=value;}}
        if(dict.Mouth_Large_Opened!==undefined)values[dict.Mouth_Large_Opened]=displayed.mouth;
      }
      for(const side of ['right','left'] as const){const lamp=lamps[side];lamp.intensity=latest.current.light===side||latest.current.light==='both'?.14:0;const eye=eyes[side];if(eye){const p=eye.getWorldPosition(new THREE.Vector3());lamp.position.set(p.x+(.05*(side==='left'?1:-1)),p.y,.25);lamp.target.position.copy(p);}}
      sclera.color.set(0xfffaf3).lerp(new THREE.Color(0xffd53c),THREE.MathUtils.clamp(latest.current.scleralTint,0,1));
      renderer.render(scene,camera);
      if(now-lastSample>100){lastSample=now;latest.current.onSample({right:{...displayed.right},left:{...displayed.left},mouth:displayed.mouth,lightDrive:latest.current.response.lightDrive});}
    };frame=requestAnimationFrame(animate);
    const contextLost=(event:Event)=>{event.preventDefault();setStatus('error');};renderer.domElement.addEventListener('webglcontextlost',contextLost);
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('webglcontextlost',contextLost);model?.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[]);
  return <><div ref={mount} className="eye-head-canvas" data-testid="eye-head-view" data-render-state={status} />{status==='loading'&&<div className="eye-head-status" role="status">Loading 3D reference head…</div>}{status==='error'&&<div className="eye-head-status" role="status">3D graphics are unavailable here. The interactive pupil views and examination controls below still work.</div>}</>;
}
