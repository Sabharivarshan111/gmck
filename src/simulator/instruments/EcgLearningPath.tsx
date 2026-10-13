import React, { useEffect, useState } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import './EcgLearningPath.css';

const waves = [
  { name: 'P', start: 60, end: 110, title: 'Atria activate', text: 'The P wave records atrial depolarization. It is electrical activation, not a recording of blood flow.' },
  { name: 'PR', start: 60, end: 150, title: 'The signal reaches the ventricles', text: 'Measure from the start of P to the start of QRS. The PR interval includes atrial activation and conduction to the ventricles; it is not just the flat PR segment. Adult reference: 120–200 ms.' },
  { name: 'QRS', start: 150, end: 190, title: 'Ventricles activate', text: 'The QRS complex records ventricular depolarization. Measure its full width. Typical adult QRS duration is 60–100 ms; 120 ms or more is wide and needs explanation.' },
  { name: 'ST', start: 190, end: 245, title: 'Check the baseline', text: 'The ST segment begins at the J point, where QRS ends. Compare with the TP baseline. Assess neighbouring leads together; elevation alone does not prove an infarction.' },
  { name: 'T', start: 245, end: 330, title: 'Ventricles recover', text: 'The T wave represents ventricular repolarization. Its direction and shape vary with the lead. Compare with QRS direction and the other leads.' },
  { name: 'QT', start: 150, end: 330, title: 'Activation through recovery', text: 'Measure from QRS onset to the end of T, excluding a separate U wave. QT changes with heart rate, so assess QTc using a specified correction formula and appropriate reference limits.' },
];
const steps = ['Read the paper', 'Follow one beat', 'Find the rate', 'Understand leads', 'Read systematically', 'Check yourself'];
const path = 'M20 115 L60 115 Q72 88 85 115 L150 115 L157 123 L167 40 L177 138 L190 115 L245 115 Q280 63 305 96 Q320 115 330 115 L380 115';

export function EcgLearningPath() {
  const [step, setStep] = useState(0);
  const [wave, setWave] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media=matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>{setReducedMotion(media.matches);if(media.matches)setPlaying(false);};
    update();media.addEventListener("change",update);
    return()=>media.removeEventListener("change",update);
  }, []);
  const [position, setPosition] = useState(0);
  const [boxes, setBoxes] = useState(4);
  const [answer, setAnswer] = useState<number | null>(null);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      if(now-previous>=1000/30){
        const delta = Math.min(now - previous, 80); previous = now;
        setPosition(p => (p + delta / 800) % 1);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  const selected = waves[wave];
  const go = (next: number) => { setPlaying(false); setStep(next); setAnswer(null); };
  return <section className="ecg-learn" data-testid="ecg-learning-path" aria-label="Guided ECG lessons">
    <div className="ecg-learn-heading"><span className="ecg-eyebrow">START HERE · {step + 1} OF 6</span><h3>{steps[step]}</h3><p>Learn one idea at a time. Diagrams are schematic teaching examples.</p></div>
    <nav className="ecg-step-dots" aria-label="Lesson navigation">{steps.map((title, i) => <button key={title} aria-label={`Lesson ${i + 1}: ${title}`} aria-current={i === step ? 'step' : undefined} onClick={() => go(i)}>{i + 1}</button>)}</nav>
    {step === 0 && <><p>An ECG records voltage over time. Horizontal squares measure time; vertical squares measure voltage. Check the printed settings before measuring.</p><div className="ecg-two"><article><strong>25 mm/s</strong><p>1 small square = 0.04 s<br/>1 large square = 0.20 s</p></article><article><strong>10 mm/mV</strong><p>1 small square = 0.1 mV<br/>10 mm = 1 mV</p></article></div><svg viewBox="0 0 400 150" role="img" aria-label="ECG grid: five small squares make one large square"><defs><pattern id="ecg-lesson-grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="#edbcc4" strokeWidth="1"/></pattern></defs><rect x="20" y="20" width="360" height="100" fill="#fff5f5"/><rect x="20" y="20" width="360" height="100" fill="url(#ecg-lesson-grid)"/><rect x="20" y="20" width="50" height="50" fill="none" stroke="#be123c" strokeWidth="2"/><path d="M140 120h20V20h50v100h20" fill="none" stroke="#9f1239" strokeWidth="3"/><text x="235" y="65" fill="#9f1239" fontSize="15">Calibration pulse</text><text x="235" y="86" fill="#9f1239" fontSize="15">10 mm = 1 mV</text><text x="20" y="145" fill="currentColor" fontSize="14">5 small squares = 1 large square</text></svg><p className="ecg-note">Zoom changes screen size, not the recorded calibration. Count grid squares rather than measuring your phone screen with a ruler.</p></>}
    {step === 1 && <><div className="ecg-wave-buttons" aria-label="Wave selection">{waves.map((item, i) => <button key={item.name} aria-pressed={i === wave} onClick={() => {setWave(i);setPlaying(false);setPosition((item.start - 20) / 360);}}>{item.name}</button>)}</div><svg viewBox="0 0 400 170" role="img" aria-label={`Illustrative ECG beat highlighting ${selected.name}`}><rect x="0" y="0" width="400" height="170" rx="12" fill="#fff5f5"/><path d="M20 115H380" stroke="#e2a9b4" strokeDasharray="4 4"/><rect x={selected.start} y="20" width={selected.end-selected.start} height="125" fill="#d946ef" opacity=".14"/><path d={path} fill="none" stroke="#9f1239" strokeWidth="3"/><line x1={20+position*360} x2={20+position*360} y1="20" y2="145" stroke="#0891b2" strokeWidth="2"/>{[['P',85],['QRS',168],['T',280]].map(([name,x])=><text key={name} x={x} y="160" textAnchor="middle" fill="#881337" fontSize="14">{name}</text>)}</svg><div className="ecg-playback"><button disabled={reducedMotion} onClick={() => setPlaying(p => !p)}>{playing ? <Pause size={16}/> : <Play size={16}/>} {playing ? 'Pause beat' : 'Play beat'}</button><label>Inspect beat<input aria-label="Inspect ECG beat" type="range" min="0" max="1000" value={Math.round(position*1000)} onChange={e => {setPlaying(false);setPosition(Number(e.target.value)/1000);}}/></label></div><h4>{selected.title}</h4><p>{selected.text}</p><p className="ecg-note">The cursor runs through a schematic 75 bpm beat. The diagnostic 12-lead sheet stays still so you can measure it.</p></>}
    {step === 2 && <><h4>Regular rhythm: 300 ÷ large squares</h4><p>Count large squares between two consecutive R peaks. This shortcut assumes 25 mm/s and a regular rhythm.</p><label>Large squares between R peaks<input aria-label="R to R large squares" type="range" min="2" max="10" step="1" value={boxes} onChange={e=>setBoxes(Number(e.target.value))}/></label><div className="ecg-rate"><strong>{Math.round(300/boxes)} bpm</strong><span>300 ÷ {boxes} large squares</span></div><h4>Irregular rhythm: use a longer strip</h4><p>Count QRS complexes in a verified 10-second recording and multiply by 6. A short strip gives a less reliable estimate. Do not assume the visible phone panel is 10 seconds long.</p></>}
    {step === 3 && <><p><strong>10 electrodes produce 12 leads.</strong> An electrode is a physical contact; a lead is an electrical viewpoint. Six limb leads view the frontal plane; V1–V6 view the horizontal plane.</p><div className="ecg-two"><article><strong>Inferior</strong><p>II · III · aVF</p></article><article><strong>Lateral</strong><p>I · aVL · V5 · V6</p></article><article><strong>Septal / anterior</strong><p>V1–V4</p></article><article><strong>aVR</strong><p>Looks toward the right shoulder</p></article></div><details><summary>Where do chest electrodes go?</summary><ul><li>V1: fourth intercostal space, right sternal border.</li><li>V2: fourth intercostal space, left sternal border.</li><li>V4: fifth intercostal space, midclavicular line.</li><li>V3: halfway between V2 and V4.</li><li>V5: anterior axillary line, level with V4.</li><li>V6: midaxillary line, level with V4 and V5.</li></ul><p>Place V4 before V3. V5 and V6 stay at the horizontal level of V4, rather than following the ribs.</p></details><p className="ecg-note">Chest leads record electrical potentials; they do not produce anatomical slices like CT or MRI.</p></>}
    {step === 4 && <><p>Use the same sequence every time. Describe what you see before naming a diagnosis.</p><ol className="ecg-checklist"><li><strong>Confirm quality.</strong> Identity, date, calibration, artefact and electrode placement.</li><li><strong>Rate and rhythm.</strong> Regular R–R? P before every QRS and QRS after every P? Upright P in I and II supports sinus origin.</li><li><strong>Axis.</strong> Use I and aVF; if I is positive and aVF negative, inspect II to distinguish normal leftward axis from left axis deviation.</li><li><strong>Intervals.</strong> Measure PR, QRS and QT/QTc. State the QT correction formula.</li><li><strong>QRS, ST and T.</strong> Review every lead, R progression and neighbouring territories; look for reciprocal changes.</li><li><strong>Summarise and compare.</strong> Combine findings with symptoms, vital signs and prior ECGs.</li></ol><p className="ecg-note">An ECG is one part of the clinical assessment. A normal trace does not exclude acute coronary syndrome; concerning symptoms still need urgent assessment.</p></>}
    {step === 5 && <><h4>At 25 mm/s, a regular R–R interval spans four large squares. What is the rate?</h4><div className="ecg-quiz">{[60,75,100].map(value=><button key={value} aria-pressed={answer===value} onClick={()=>setAnswer(value)}>{value} bpm</button>)}</div>{answer!==null && <p role="status" className="ecg-note">{answer===75?'Correct.':'Try the calculation again.'} Four large squares = 0.8 seconds. 60 ÷ 0.8 = 75 bpm, or 300 ÷ 4 = 75.</p>}<details><summary>Keep this reading checklist</summary><p>Quality → rate → rhythm → axis → intervals → QRS/ST/T → clinical summary and comparison.</p></details><p>You can now explore the detailed leads, intervals and cardiac cycle using the lesson sections above.</p></>}
    <div className="ecg-lesson-nav"><button disabled={step===0} onClick={()=>go(step-1)}><ChevronLeft size={16}/>Back</button><span>{step+1} / 6</span><button disabled={step===5} onClick={()=>go(step+1)}>Next<ChevronRight size={16}/></button></div>
    <details className="ecg-sources"><summary>Teaching references</summary><p>Original schematic illustrations. Reference reading: <a href="https://ecg.utah.edu/lesson/1" target="_blank" rel="noreferrer">University of Utah: leads and waves</a>, <a href="https://ecg.utah.edu/lesson/2" target="_blank" rel="noreferrer">systematic interpretation</a>, and <a href="https://scst.org.uk/wp-content/uploads/2024/09/2024_ECG_Recording_Guidelines_26-09-2024_V5_FINAL.pdf" target="_blank" rel="noreferrer">SCST recording guidance</a>. Adult introductory examples; paediatric and clinical context require appropriate reference ranges.</p></details>
  </section>;
}
