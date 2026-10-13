import React, { useEffect, useId, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { EcgHeartModel, type Activation } from './EcgHeartModel';

export const beatPhases: { name: string; start: number; end: number; activation: Activation; title: string; text: string; mechanism: string }[] = [
  { name: 'P', start: 80, end: 160, activation: 'atria', title: 'Atria depolarize', text: 'The SA node initiates the impulse. Activation spreads through the right and left atrial muscle, producing the P wave.', mechanism: 'Atrial contraction follows electrical activation. The ECG records voltage, not the contraction itself.' },
  { name: 'PR', start: 160, end: 240, activation: 'delay', title: 'AV conduction slows the impulse', text: 'The AV node delays conduction before the impulse travels through the His–Purkinje system. This permits time for ventricular filling.', mechanism: 'PR interval = P onset to QRS onset (120–200 ms in adults). The flat PR segment is only part of that interval.' },
  { name: 'QRS', start: 240, end: 320, activation: 'ventricles', title: 'Ventricles depolarize', text: 'The impulse travels down the bundle of His, right and left bundle branches, and Purkinje network. Ventricular myocardium activates rapidly.', mechanism: 'Septal activation begins left to right. Most of the QRS reflects the larger ventricular muscle mass. Atrial repolarization is usually hidden within QRS.' },
  { name: 'ST', start: 320, end: 440, activation: 'plateau', title: 'Ventricles are largely depolarized', text: 'The ST segment extends from the J point to the start of T. Little net voltage difference normally remains across the ventricles.', mechanism: 'The ventricular-cell plateau broadly corresponds to this period. Assess ST displacement against the TP baseline in contiguous leads.' },
  { name: 'T', start: 440, end: 620, activation: 'recovery', title: 'Ventricles repolarize', text: 'Ventricular cells recover electrically. The resulting voltage differences produce the T wave.', mechanism: 'Repolarization has opposite electrical polarity to depolarization. Its usual sequence helps explain why T is often concordant with QRS.' },
  { name: 'Rest', start: 620, end: 800, activation: 'rest', title: 'Electrical baseline', text: 'Between beats, ventricular muscle is resting. There is little net surface voltage despite blood continuing to circulate.', mechanism: 'A flat ECG segment does not mean the heart has stopped pumping. Mechanical activity and electrical activation are related but distinct.' },
];
export const normalBeatPath = 'M40 150H72Q88 118 104 150H136L140 160L147 30L155 175L168 150H216Q252 86 288 150H360';

export function EcgBeatTrace({ time = 280, selection = 'QRS' }: { time?: number; selection?: string }) {
  const id = useId().replace(/:/g, '');
  const segment = selection === 'QT' ? {start:240,end:620} : selection === 'PR' ? {start:80,end:240} : beatPhases.find(p => p.name === selection);
  return <svg viewBox="0 0 400 218" role="img" aria-label={`ECG beat highlighting ${selection}`} className="ecg-beat-trace">
    <defs><pattern id={`${id}-small`} width="16" height="16" patternUnits="userSpaceOnUse" x="40" y="150"><path d="M16 0H0V16" fill="none" stroke="currentColor" strokeWidth=".4" opacity=".2"/></pattern><pattern id={`${id}-large`} width="80" height="80" patternUnits="userSpaceOnUse" x="40" y="150"><rect width="80" height="80" fill={`url(#${id}-small)`}/><path d="M80 0H0V80" fill="none" stroke="currentColor" strokeWidth=".7" opacity=".3"/></pattern></defs>
    <rect x="16" y="12" width="368" height="178" rx="12" fill={`url(#${id}-large)`}/>
    {segment && <rect x={40+segment.start*.4} y="12" width={(segment.end-segment.start)*.4} height="178" fill="var(--ecg-accent)" opacity=".14"/>}
    <path d="M20 150H380" fill="none" stroke="currentColor" strokeDasharray="3 5" opacity=".4"/>
    <path d={normalBeatPath} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round"/>
    <line data-testid="beat-cursor" x1={40+time*.4} x2={40+time*.4} y1="12" y2="190" stroke="var(--ecg-accent)" strokeWidth="2"/>
    {[['P',80],['QRS',150],['ST',196],['T',247]].map(([s,x])=><text key={s} x={x} y="208" fill="currentColor" fontSize="12" textAnchor="middle">{s}</text>)}
  </svg>;
}

export function EcgBeatExplorer() {
  const [time, setTime] = useState(280);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(.25);
  const [labels, setLabels] = useState(true);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setReduced(media.matches); if (media.matches) setPlaying(false); };
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!playing) return;
    let frame = 0; let previous = performance.now();
    const tick = (now: number) => {
      if (now - previous >= 1000 / 30) {
        const delta = Math.min(now-previous, 100); previous = now;
        setTime(t => (t+delta*speed)%800);
      }
      frame = requestAnimationFrame(tick);
    };
    const hide = () => {if (document.hidden) setPlaying(false);};
    document.addEventListener('visibilitychange', hide);
    frame = requestAnimationFrame(tick);
    return () => {cancelAnimationFrame(frame);document.removeEventListener('visibilitychange', hide);};
  }, [playing, speed]);
  const phase = beatPhases.find(p => time >= p.start && time < p.end) || beatPhases[5];
  const progress = Math.max(0, Math.min(1, (time-phase.start)/(phase.end-phase.start)));
  const inspect = (t: number) => {setPlaying(false);setTime(t);};
  return <section className="ecg-beat-explorer" aria-label="Synchronized heart and ECG">
    <div className="ecg-section-heading"><div><span className="ecg-kicker">01 / WATCH ONE BEAT</span><h3>From impulse to tracing</h3></div><span className="ecg-pill">75 bpm · teaching beat</span></div>
    <p className="ecg-muted">Tap a phase, then follow the same moment in the heart and on the ECG.</p>
    <div className="ecg-phase-nav">{beatPhases.map(p=><button key={p.name} aria-pressed={phase.name===p.name} onClick={()=>inspect((p.start+p.end)/2)}>{p.name}</button>)}</div>
    <div className="ecg-beat-grid">
      <div className="ecg-model-panel"><div className="ecg-model-toolbar"><span><i className={`ecg-state-dot ${phase.activation}`}/> {phase.title}</span><button aria-pressed={labels} onClick={()=>setLabels(v=>!v)}>Labels {labels?'on':'off'}</button></div><EcgHeartModel activation={phase.activation} progress={progress} labels={labels}/><div className="ecg-model-key"><span><i/> Right heart</span><span><i/> Left heart</span><span><i/> Electrical activation</span></div></div>
      <div className="ecg-trace-panel"><div className="ecg-model-toolbar"><strong>Lead II · illustrative</strong><span>{Math.round(time)} ms</span></div><EcgBeatTrace time={time} selection={phase.name}/><p className="ecg-small">25 mm/s · 10 mm/mV · one small square = 40 ms / 0.1 mV</p><article className="ecg-phase-explanation"><span className="ecg-kicker">{phase.name === 'Rest' ? 'TP BASELINE' : phase.name}</span><h4>{phase.title}</h4><p>{phase.text}</p><p className="ecg-callout">{phase.mechanism}</p></article></div>
    </div>
    <div className="ecg-beat-controls"><button aria-label={playing?'Pause beat':'Play beat'} disabled={reduced} onClick={()=>setPlaying(p=>!p)}>{playing?<Pause size={17}/>:<Play size={17}/>} {playing?'Pause':'Play'}</button><button aria-label="Reset teaching beat" onClick={()=>inspect(0)}><RotateCcw size={17}/></button><label>Playback speed<select aria-label="ECG playback speed" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="0.25">¼ speed</option><option value="0.5">½ speed</option><option value="1">Real time</option></select></label></div>
    <label className="ecg-scrubber">Inspect beat <output>{Math.round(time)} / 800 ms</output><input aria-label="Inspect synchronized beat" type="range" min="0" max="799" step="1" value={Math.round(time)} onChange={e=>inspect(Number(e.target.value))}/></label>
    <p className="ecg-small">{reduced?'Reduced motion is on: use phase buttons or the timeline.':'Playback starts paused. Slow playback preserves the beat’s timing relationships.'} Anatomy and activation are schematic; the diagnostic sheet remains still for measurement.</p>
  </section>;
}
