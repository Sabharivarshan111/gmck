import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bone, Stethoscope, Activity, ScanLine, Eye, Hand, ChevronRight, Search, HeartPulse } from 'lucide-react';
import { SCENARIOS } from '../engine/PhysiologyKernel';
import type { DiagnosticToolType } from '../types';
import './SimulatorStudio.css';

const SKILLS: { id: DiagnosticToolType | 'clubbing'; title: string; hint: string; Icon: typeof Activity }[] = [
  { id: 'stethoscope', title: 'Auscultation', hint: 'Normal heart & breath sounds, then compare', Icon: Stethoscope },
  { id: 'ecg12', title: '12-lead ECG', hint: 'Normal sinus rhythm & case traces', Icon: Activity },
  { id: 'ultrasound', title: 'Ultrasound / POCUS', hint: 'Explore probe views & scan findings', Icon: ScanLine },
  { id: 'pupil', title: 'Pupil examination', hint: 'Direct & consensual light responses', Icon: Eye },
  { id: 'piccled', title: 'General examination', hint: 'Pallor, icterus, edema & fluid status', Icon: Hand },
  { id: 'clubbing', title: 'Clubbing', hint: 'Normal nails, Schamroth test & findings', Icon: Hand },
];

export function SimulatorStudio({ scenarioId, onScenario, onAnatomy, onCase, onTool, onMonitor }: {
  scenarioId: string; onScenario: (id: string) => void; onAnatomy: () => void; onCase: (id: string) => void;
  onTool: (id: DiagnosticToolType | 'clubbing') => void; onMonitor: () => void;
}) {
  const [section, setSection] = useState<'skills' | 'cases'>('skills');
  const [query, setQuery] = useState('');
  const normal = scenarioId === 'normal';
  const scenario = SCENARIOS.find(s => s.id === scenarioId)!;
  const skills = SKILLS.filter(s => `${s.title} ${s.hint}`.toLowerCase().includes(query.toLowerCase()));
  const cases = SCENARIOS.filter(s => s.id !== 'normal' && `${s.title} ${s.category}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="studio" data-testid="simulator-studio">
    <header className="studio-header"><Link to="/notes" aria-label="Back to Vault"><ArrowLeft size={20} /></Link><span>ORBIT <b>CLINICAL STUDIO</b></span></header>
    <main className="studio-main">
      <span className="studio-eyebrow">EXPLORE. LISTEN. PRACTISE.</span>
      <h1>What would you<br />like to learn?</h1>
      <p className="studio-intro">Start with normal findings, explore anatomy, or work through a patient case.</p>
      <button className="studio-anatomy" onClick={onAnatomy}>
        <Bone size={32} /><span><strong>Explore 3D anatomy</strong><small>Bones, muscles, organs & nerves · no case needed</small></span><ChevronRight size={22} />
      </button>
      <div className="studio-segments" aria-label="Choose learning activity">
        <button aria-pressed={section === 'skills'} onClick={() => { setSection('skills'); setQuery(''); }}>Learn a skill</button>
        <button aria-pressed={section === 'cases'} onClick={() => { setSection('cases'); setQuery(''); }}>Practise a case</button>
      </div>
      {section === 'skills' && <div className="studio-baseline">
        <div><HeartPulse size={20} /><strong>{normal ? 'Normal findings' : 'Case comparison'}</strong><span>{normal ? 'Healthy adult at rest' : scenario.title}</span></div>
        <label>Findings to show<select aria-label="Findings to show" value={scenarioId} onChange={e => onScenario(e.target.value)}>{SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
        {!normal && <button className="studio-reset" onClick={() => onScenario('normal')}>Return to normal baseline</button>}
        <p>Each tool uses this selection. Sound demonstrations inside Auscultation can override it.</p>
      </div>}
      <label className="studio-search"><Search size={18} /><input type="search" aria-label={section === 'skills' ? 'Search skills' : 'Search cases'} placeholder={section === 'skills' ? 'Find a skill…' : 'Find a case or specialty…'} value={query} onChange={e => setQuery(e.target.value)} /></label>
      {section === 'skills' ? <>
        <div className="studio-grid">{skills.map(({id,title,hint,Icon}) => <button key={id} onClick={() => onTool(id)}><Icon size={24} /><strong>{title}</strong><small>{hint}</small><span>Open skill <ChevronRight size={14} /></span></button>)}</div>
        {!skills.length && <p role="status">No matching skill. Try “ECG” or “lungs”.</p>}
        <button className="studio-monitor" onClick={onMonitor}><Activity size={20} /><span>Open live monitor<small>See ECG, oxygen saturation & respiratory waveforms</small></span><ChevronRight size={20} /></button>
      </> : <div className="studio-cases">{cases.map(s => <button key={s.id} onClick={() => onCase(s.id)}><span><small>{s.category}</small><strong>{s.title}</strong><p>{s.subtitle}</p></span><ChevronRight size={20} /></button>)}{!cases.length && <p role="status">No matching case.</p>}</div>}
      <p className="studio-footnote">Teaching simulations for learning examination and anatomy.</p>
    </main>
  </div>;
}
