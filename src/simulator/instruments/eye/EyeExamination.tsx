import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PatientPathologyState } from '../../types';
import type { EyeAnchors } from './EyeHeadView';
import { EYE_FINDINGS, resolveEyeExam, type EyeExamInput, type EyeExamResponse, type EyeFinding, type EyeSide, type FaceAction } from './eyeExamModel';
import './EyeExamination.css';
const EyeHeadView=lazy(()=>import('./EyeHeadView').then(m=>({default:m.EyeHeadView})));
const DEFAULT_ANCHORS:EyeAnchors={right:{x:.35,y:.45},left:{x:.65,y:.45}};
type Instrument='finger'|'light'|'cotton';
export function EyeExamination({pathology}:{pathology:PatientPathologyState}) {
  const [finding,setFinding]=useState<EyeFinding>('case');
  const [affected,setAffected]=useState<EyeSide>('right');
  const [instrument,setInstrument]=useState<Instrument>('finger');
  const [gaze,setGaze]=useState({x:0,y:0});
  const [light,setLight]=useState<EyeExamInput['light']>('none');
  const [cotton,setCotton]=useState<EyeSide|null>(null);
  const [liftLids,setLiftLids]=useState(false);
  const [action,setAction]=useState<FaceAction>('rest');
  const [marker,setMarker]=useState({x:.5,y:.45});
  const [anchors,setAnchors]=useState(DEFAULT_ANCHORS);
  const [sample,setSample]=useState<EyeExamResponse|null>(null);
  const cottonTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const input=useMemo(()=>({finding,affected,gaze,light,cotton,liftLids,action}),[finding,affected,gaze,light,cotton,liftLids,action]);
  const response=useMemo(()=>resolveEyeExam(input,pathology),[input,pathology]);
  const onSample=useCallback((next:EyeExamResponse)=>setSample(next),[]);
  const onAnchors=useCallback((next:EyeAnchors)=>setAnchors(next),[]);
  const current=sample||response;
  useEffect(()=>()=>{if(cottonTimer.current)clearTimeout(cottonTimer.current);},[]);
  const clear=()=>{setGaze({x:0,y:0});setLight('none');setCotton(null);setLiftLids(false);setAction('rest');setMarker({x:.5,y:.45});if(cottonTimer.current)clearTimeout(cottonTimer.current);};
  const changeInstrument=(next:Instrument)=>{setInstrument(next);setLight('none');setCotton(null);setAction('rest');};
  const point=(event:React.PointerEvent<HTMLDivElement>)=>{
    const r=event.currentTarget.getBoundingClientRect();const x=Math.min(1,Math.max(0,(event.clientX-r.left)/r.width)),y=Math.min(1,Math.max(0,(event.clientY-r.top)/r.height));setMarker({x,y});
    if(instrument==='finger'){setGaze({x:(x-.5)*2,y:(y-.45)*2});return;}
    const hit=(['right','left'] as const).find(side=>Math.hypot((x-anchors[side].x)*r.width,(y-anchors[side].y)*r.height)<Math.max(26,r.width*.105))||null;
    if(instrument==='light')setLight(hit||'none');else setCotton(hit);
  };
  const touchCornea=(side:EyeSide)=>{if(cottonTimer.current)clearTimeout(cottonTimer.current);setCotton(side);cottonTimer.current=setTimeout(()=>setCotton(null),600);};
  const torch=(side:EyeExamInput['light'])=>{setInstrument('light');setCotton(null);setLight(side);if(side==='left'||side==='right')setMarker(anchors[side]);};
  const entry=EYE_FINDINGS.find(f=>f.id===finding)!;
  return <section className="eye-exam" aria-label="Interactive eye and facial examination">
    <div className="eye-preset"><label>Findings<select aria-label="Eye examination findings" value={finding} onChange={e=>{setFinding(e.target.value as EyeFinding);clear();}}>{EYE_FINDINGS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
      {!['case','normal'].includes(finding)&&<div className="eye-side" aria-label="Affected side">{(['right','left'] as const).map(side=><button key={side} aria-pressed={side===affected} onClick={()=>{setAffected(side);clear();}}>Patient’s {side}</button>)}</div>}
    </div>
    <div className="eye-instruments" aria-label="Examination instrument">
      <button aria-pressed={instrument==='finger'} onClick={()=>changeInstrument('finger')}>☝️ Follow finger</button>
      <button aria-pressed={instrument==='light'} onClick={()=>changeInstrument('light')}>🔦 Penlight</button>
      <button aria-pressed={instrument==='cotton'} onClick={()=>changeInstrument('cotton')}>🪶 Cotton</button>
    </div>
    <p className="eye-instruction">{instrument==='finger'?'Drag the target to test eye movements.':instrument==='light'?'Tap or drag the penlight over either eye.':'Touch either eye to demonstrate the corneal blink reflex.'} Patient’s right is on your left.</p>
    <div className="eye-stage" tabIndex={0} role="group" aria-label="Move examination target" onKeyDown={e=>{if(!e.key.startsWith('Arrow'))return;e.preventDefault();setInstrument('finger');setGaze(g=>({x:Math.min(1,Math.max(-1,g.x+(e.key==='ArrowRight'?.2:e.key==='ArrowLeft'?-.2:0))),y:Math.min(1,Math.max(-1,g.y+(e.key==='ArrowDown'?.2:e.key==='ArrowUp'?-.2:0)))}));}}
      onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);point(e);}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))point(e);}} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);setCotton(null);}} onPointerCancel={()=>setCotton(null)}>
      <Suspense fallback={<div className="eye-head-status">Loading eye examination…</div>}><EyeHeadView response={response} light={light} onAnchors={onAnchors} onSample={onSample}/></Suspense>
      <span className="eye-stage-side eye-stage-right">RIGHT · OD</span><span className="eye-stage-side eye-stage-left">LEFT · OS</span>
      {light!=='none'&&(['right','left'] as const).filter(side=>light===side||light==='both').map(side=><span key={side} className="eye-light-beam" style={{left:`${anchors[side].x*100}%`,top:`${anchors[side].y*100}%`}} aria-hidden="true"/>)}
      <span className="eye-tool-marker" aria-hidden="true" style={{left:`${marker.x*100}%`,top:`${marker.y*100}%`}}>{instrument==='finger'?'☝️':instrument==='light'?'🔦':'🪶'}</span>
      <span className="eye-reference-badge">Interactive 3D reference head</span>
    </div>
    <div className="eye-pupil-readouts" aria-label="Live pupil close-ups">
      {(['right','left'] as const).map(side=><div key={side}><span>Patient’s {side} · {side==='right'?'OD':'OS'}</span><div className="eye-iris" aria-hidden="true"><div className="eye-pupil" style={{width:`${current[side].pupil/12*100}%`,height:`${current[side].pupil/12*100}%`}}/></div><output data-testid={`eye-${side}-diameter`}>{current[side].pupil.toFixed(1)} mm</output></div>)}
    </div>
    <p className="eye-caption">Live close-ups · pupil sizes and response timing are simulated.</p>
    {instrument==='light'&&<div className="eye-controls" aria-label="Penlight controls"><button aria-label="Left eye penlight" aria-pressed={light==='left'} onClick={()=>torch('left')}>Light: left eye</button><button aria-label="Right eye penlight" aria-pressed={light==='right'} onClick={()=>torch('right')}>Light: right eye</button><button aria-label="Both eyes penlight" aria-pressed={light==='both'} onClick={()=>torch('both')}>Both eyes</button><button aria-label="Turn penlight off" onClick={()=>torch('none')}>Off</button></div>}
    {instrument==='finger'&&<div className="eye-gaze-controls" aria-label="Eye movement directions">{[['Patient’s right',-.9,0],['Up',0,-.9],['Centre',0,0],['Down',0,.9],['Patient’s left',.9,0],['Down & toward right eye’s nose',.8,.8],['Down & toward left eye’s nose',-.8,.8]].map(([label,x,y])=><button key={label} onClick={()=>setGaze({x:Number(x),y:Number(y)})}>{label}</button>)}</div>}
    {instrument==='cotton'&&<div className="eye-controls"><button onClick={()=>touchCornea('right')}>Touch right cornea</button><button onClick={()=>touchCornea('left')}>Touch left cornea</button></div>}
    <div className="eye-controls">{['iii','iii_spared','horner'].includes(finding)&&<button aria-pressed={liftLids} onClick={()=>setLiftLids(v=>!v)}>{liftLids?'Release eyelids':'Lift eyelids'}</button>}<button onClick={clear}>Reset examination</button></div>
    <details className="eye-teaching"><summary>Facial movements · CN V & VII</summary><div className="eye-controls">{([['brows','Raise eyebrows'],['close','Close eyes'],['smile','Smile / show teeth'],['mouth','Open mouth'],['rest','Relax face']] as const).map(([id,label])=><button key={id} aria-pressed={action===id} onClick={()=>setAction(id)}>{label}</button>)}</div><p>Facial weakness here represents a peripheral VII pattern. Mouth opening animates the reference jaw; it does not model jaw strength, uvular movement or a gag reflex.</p></details>
    <div className="eye-teaching" role="status"><strong>{entry.label}{!['case','normal'].includes(finding)?` · patient’s ${affected}`:''}</strong><p>{entry.note}</p>{cotton&&<p>{finding==='v1'&&cotton===affected?'No blink: the touched side’s afferent signal is absent.':finding==='vii'?`Only the unaffected eyelid closes; the ${affected} facial efferent is impaired.`:'Both eyelids close: afferent V1 → brainstem → bilateral facial VII output.'}</p>}</div>
    <details className="eye-teaching"><summary>Reflex pathway & model notes</summary><p>Light response: retina → optic nerve (II) → pretectal region → both Edinger–Westphal nuclei → oculomotor nerves (III) → pupillary sphincters.</p><p>This is an adult reference mesh with illustrative eye alignment. It is not a quantitative diplopia, ocular torsion, visual-acuity or visual-field test. A pupil pattern alone does not establish a diagnosis.</p><p>Dragging cotton is a virtual demonstration, not instructions to touch a person’s eye without clinical supervision.</p><a href="https://www.nanosweb.org/CNPalsy/" target="_blank" rel="noreferrer">Neuro-ophthalmology reference</a> · <a href="https://www.ncbi.nlm.nih.gov/books/NBK381/" target="_blank" rel="noreferrer">Pupil examination reference</a><p>3D head and textures: Vitruvian / CharMorph, CC0; mobile adaptation by ORBIT. <a href="https://github.com/ibrews/VitruvianGodot" target="_blank" rel="noreferrer">Model source & credits</a></p></details>
    <div className="eye-model-state" data-testid="eye-response-state" data-right-x={response.right.x} data-left-x={response.left.x} data-right-lid={response.right.lid} data-left-lid={response.left.lid} data-right-pupil={response.right.pupil} data-left-pupil={response.left.pupil} aria-hidden="true"/>
  </section>;
}
