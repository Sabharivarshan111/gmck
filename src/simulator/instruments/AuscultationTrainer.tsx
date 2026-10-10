import { lazy, Suspense, useState } from 'react';
import type { RefObject } from 'react';
import { AUSCULTATION_SITES, SOUND_LIBRARY } from './auscultationSites';
import type { AuscultationSite, HeartSoundPreset, LungSoundPreset, StethoscopeAudioEngine } from './StethoscopeSynthesizer';
import { Phonocardiogram } from './Phonocardiogram';
import { LUNG_SOUND_DESCRIPTIONS } from './auscultationRouting';
import './AuscultationTrainer.css';
const Thorax = lazy(() => import('./AuscultationThorax'));

export function AuscultationTrainer({ theme, site, mode, volume, listening, override, lungOverride, description, audioError, heartRate, respiratoryRate, engineRef, onSite, onMode, onVolume, onListen, onSound, onLung }: {
  theme: 'light' | 'dark'; site: AuscultationSite; mode: 'bell' | 'diaphragm'; volume: number; listening: boolean;
  override: HeartSoundPreset | null; lungOverride: LungSoundPreset | null; description: string; audioError: string | null; heartRate: number; respiratoryRate: number;
  engineRef: RefObject<StethoscopeAudioEngine | null>;
  onSite: (site: AuscultationSite) => void; onMode: (mode: 'bell' | 'diaphragm') => void;
  onLung: (sound: LungSoundPreset | null) => void;
  onVolume: (volume: number) => void; onListen: () => void; onSound: (sound: HeartSoundPreset | null) => void;
}) {
  const [lungSide, setLungSide] = useState<'right' | 'left'>('right');
  const [back, setBack] = useState(false);
  const [xray, setXray] = useState(true);
  const [search, setSearch] = useState('');
  const [training, setTraining] = useState(false);
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const selected = AUSCULTATION_SITES.find(s => s.id === site)!;
  const pulmonary = selected.pulmonary;
  const chooseSite = (next: AuscultationSite) => {
    if (next === 'lung_bases') setBack(true);
    else if (next === 'trachea' || !AUSCULTATION_SITES.find(s => s.id === next)?.pulmonary) setBack(false);
    onSite(next);
  };
  const chooseSound = (next: HeartSoundPreset | null) => {
    const sound = SOUND_LIBRARY.find(s => s.id === next);
    if (sound) { setBack(false); onMode(sound.mode); }
    onSound(next);
  };
  const nextQuestion = () => {
    const candidates = SOUND_LIBRARY.filter(s => s.id !== override);
    const sound = candidates[Math.floor(Math.random() * candidates.length)];
    setAnswer(''); setRevealed(false); setSearch(''); chooseSound(sound.id);
  };
  const setView = (nextBack: boolean) => {
    setBack(nextBack);
    if (nextBack && !pulmonary) onSite('lung_bases');
    if (!nextBack && site === 'lung_bases') onSite('lung_apices');
  };
  const filtered = SOUND_LIBRARY.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));
  const showFindings = !training || revealed;
  const selectedX = (site === 'lung_apices' || site === 'lung_bases') && lungSide === 'left' ? 100-selected.x : selected.x;
  const pointX = back ? 100 - selectedX : selectedX;
  const visibleSites = AUSCULTATION_SITES.filter(s => s.pulmonary === pulmonary && (!back || s.id !== 'trachea'));
  return <section className="ausc-trainer" data-theme={theme} aria-label="Auscultation trainer">
    <div className="ausc-tabs" aria-label="Learning mode">
      <button aria-pressed={!training} onClick={() => { setTraining(false); setRevealed(false); chooseSound(null); onLung(null); }}>Explore</button>
      <button aria-pressed={training} onClick={() => { setTraining(true); nextQuestion(); }}>Train · heart sounds</button>
    </div>
    <div className="ausc-visual">
      <div className="ausc-modes" style={{marginBottom:8}}>
        <button aria-pressed={!pulmonary} onClick={() => chooseSite('mitral')}>Heart</button>
        <button aria-pressed={pulmonary} onClick={() => chooseSite('lung_apices')}>Lungs</button>
      </div>
      <div className="ausc-body" data-testid="auscultation-body">
        <Suspense fallback={<span className="ausc-model-status">Loading chest view…</span>}><Thorax back={back} xray={xray} /></Suspense>
        <span className="ausc-side">{back ? 'Posterior' : 'Anterior'} · patient {back ? 'L ← → R' : 'R ← → L'}</span>
        {visibleSites.flatMap(s => {
          const positions = s.id === 'lung_apices' || s.id === 'lung_bases' ? [s.x, 100-s.x] : [s.x];
          return positions.map((x, i) => <button key={`${s.id}-${i}`} className="ausc-point" style={{left:`${back ? 100-x : x}%`, top:`${s.y}%`}} aria-label={`${s.label}${positions.length === 2 ? ` · ${i === 0 ? 'right' : 'left'} lung` : ''}`} aria-pressed={site === s.id && (positions.length === 1 || lungSide === (i === 0 ? 'right' : 'left'))} onClick={() => { chooseSite(s.id); setLungSide(i === 0 ? 'right' : 'left'); }}>{s.short}</button>);
        })}
        <div className="ausc-steth" style={{left:`${pointX}%`,top:`${selected.y}%`}} aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M24 21C20 10 32 4 40 0" stroke="#99b4c8" strokeWidth="4" fill="none"/><circle cx="24" cy="27" r="16" fill="#16334b" stroke="#ecfeff" strokeWidth="3"/><circle cx="24" cy="27" r="9" fill="#67e8f9" fillOpacity=".4"/><circle cx="24" cy="27" r="3" fill="#ecfeff"/></svg></div>
      </div>
      <div className="ausc-controls" style={{marginTop:8}}><button onClick={() => setView(!back)}>{back ? 'View front' : 'View back'}</button><button aria-pressed={xray} onClick={() => setXray(!xray)}>X-ray view</button></div>
      <div className="ausc-point-label" style={{marginTop:10}}>{selected.label}</div><div className="ausc-location">{selected.location}</div>
      <label className="ausc-library" style={{marginTop:8}}>Listening point<select aria-label="Listening point" value={site} onChange={e => chooseSite(e.target.value as AuscultationSite)}>{AUSCULTATION_SITES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
    </div>
    {!training && pulmonary ? <div className="ausc-library"><label htmlFor="ausc-lung-sound">Breath sound demonstration</label><select id="ausc-lung-sound" value={lungOverride || ''} onChange={e => onLung((e.target.value || null) as LungSoundPreset | null)}><option value="">Current patient case</option>{Object.keys(LUNG_SOUND_DESCRIPTIONS).map(id => <option key={id} value={id}>{id === 'silent' ? 'Absent breath sounds' : id[0].toUpperCase()+id.slice(1)}</option>)}</select></div> : !training ? <div className="ausc-library">
      <label htmlFor="ausc-search">Sound library · heart demonstrations</label>
      <input id="ausc-search" type="search" placeholder="Find a sound…" value={search} onChange={e => setSearch(e.target.value)} />
      <select aria-label="Sound demonstration" value={override || ''} onChange={e => chooseSound((e.target.value || null) as HeartSoundPreset | null)}>
        <option value="">Current patient case</option>
        {override && !filtered.some(s => s.id === override) && <option value={override}>{SOUND_LIBRARY.find(s => s.id === override)?.title || override}</option>}
        {filtered.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
      </select>
      {!filtered.length && <p className="ausc-note" role="status">No matching heart demonstration.</p>}
    </div> : <div className="ausc-library">
      <label htmlFor="ausc-answer">Listen, then identify the heart sound</label>
      <select id="ausc-answer" value={answer} onChange={e => setAnswer(e.target.value)} disabled={revealed}><option value="">Choose your answer</option>{SOUND_LIBRARY.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
      <button disabled={!answer || revealed || pulmonary} onClick={() => setRevealed(true)}>Check answer</button>
      {pulmonary && <p className="ausc-note">Choose Heart to answer this heart-sound exercise.</p>}
      {revealed && <p role="status" className="ausc-point-label">{answer === override ? 'Correct.' : 'Listen again.'} {SOUND_LIBRARY.find(s => s.id === override)?.title}</p>}
      <button onClick={nextQuestion}>Next sound</button>
    </div>}
    <Phonocardiogram engineRef={engineRef} listening={listening} pulmonary={pulmonary} traceKey={`${site}-${override}-${lungOverride}-${mode}`} />
    <div className="ausc-modes" aria-label="Stethoscope head"><button aria-pressed={mode === 'bell'} onClick={() => onMode('bell')}>Bell · low pitch</button><button aria-pressed={mode === 'diaphragm'} onClick={() => onMode('diaphragm')}>Diaphragm</button></div>
    {showFindings && <details><summary>What should I hear?</summary><p>{description}</p></details>}
    {audioError && <p role="alert" className="ausc-error">{audioError}</p>}
    <div className="ausc-footer">
      <button className="ausc-listen" aria-label={listening ? 'Stop Stethoscope' : 'Place Stethoscope & Listen Live'} onClick={onListen}>{listening ? 'Pause listening' : 'Listen at this point'}</button>
      <label className="ausc-volume">Volume<input aria-label="Stethoscope volume" type="range" min="0" max="1.8" step="0.1" value={volume} onChange={e => onVolume(Number(e.target.value))} /><span>{Math.round(volume*100)}%</span></label>
      <span className="ausc-note">{Math.round(heartRate)} bpm · {Math.round(respiratoryRate)} breaths/min · {(pulmonary ? lungOverride : override) ? 'Teaching demonstration' : 'Patient case'}</span>
    </div>
    <details><summary>Sources & model credits</summary><p>Heart: Human Reference Atlas / HuBMAP (CC BY 4.0). Lungs: Z-Anatomy (CC BY-SA 4.0). Organs are resized and placed in an illustrative chest. <a href="/models/ATTRIBUTION_BODYPARTS3D.md" target="_blank" rel="noopener noreferrer">Full attribution</a>. Sound timing follows clinical teaching descriptions; these are simplified synthesized demonstrations.</p></details>
    <p className="ausc-note">Synthesized teaching sounds, not patient recordings. Chest surface and organ placement are illustrative. Lung points share the case’s modeled finding; side-specific disease and murmur radiation are not simulated.</p>
  </section>;
}
