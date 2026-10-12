import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Search, HeartPulse, Moon, Sun } from 'lucide-react';
import { SCENARIOS } from '../engine/PhysiologyKernel';
import type { DiagnosticToolType } from '../types';
import './SimulatorStudio.css';

const SKILLS: { id: DiagnosticToolType | 'clubbing'; title: string; hint: string; emoji: string }[] = [
  { id: 'stethoscope', title: 'Auscultation', hint: 'Normal heart & lung breath sounds, then compare', emoji: '🩺' },
  { id: 'ecg12', title: '12-lead ECG', hint: 'Normal sinus rhythm & case traces', emoji: '🫀' },
  { id: 'ultrasound', title: 'Ultrasound / POCUS', hint: 'Explore probe views & scan findings', emoji: '🖥️' },
  { id: 'pupil', title: 'Pupil examination', hint: 'Direct & consensual light responses', emoji: '👁️' },
  { id: 'piccled', title: 'General examination', hint: 'Pallor, icterus, edema & fluid status', emoji: '🔎' },
  { id: 'clubbing', title: 'Clubbing', hint: 'Normal nails, Schamroth test & findings', emoji: '🖐️' },
];

export function SimulatorStudio({ theme, onToggleTheme, scenarioId, onScenario, onAnatomy, onCase, onTool, onMonitor }: {
  theme: 'light' | 'dark'; onToggleTheme: () => void;
  scenarioId: string; onScenario: (id: string) => void; onAnatomy: () => void; onCase: (id: string) => void;
  onTool: (id: DiagnosticToolType | 'clubbing') => void; onMonitor: () => void;
}) {
  const [section, setSection] = useState<'skills' | 'cases'>('skills');
  const [query, setQuery] = useState('');
  const normal = scenarioId === 'normal';
  const scenario = SCENARIOS.find(s => s.id === scenarioId)!;
  const skills = SKILLS.filter(s => `${s.title} ${s.hint}`.toLowerCase().includes(query.toLowerCase()));
  const cases = SCENARIOS.filter(s => s.id !== 'normal' && `${s.title} ${s.category}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="studio" data-theme={theme} data-testid="simulator-studio">
    <header className="studio-header"><Link reloadDocument to="/notes" aria-label="Back to Vault"><ArrowLeft size={20} /></Link><span>ORBIT <b>CLINICAL STUDIO</b></span><button className="studio-theme" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={onToggleTheme}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button></header>
    <main className="studio-main">
      <span className="studio-eyebrow">EXPLORE. LISTEN. PRACTISE.</span>
      <h1>What would you<br />like to learn?</h1>
      <p className="studio-intro">Start with normal findings, explore anatomy, or work through a patient case.</p>
      <button className="studio-anatomy" onClick={onAnatomy}>
        <span className="studio-emoji" aria-hidden="true">🦴</span><span><strong>Explore 3D anatomy</strong><small>Bones, muscles, organs & nerves · no case needed</small></span><ChevronRight size={22} />
      </button>
      <div className="studio-segments" aria-label="Choose learning activity">
        <button aria-pressed={section === 'skills'} onClick={() => { setSection('skills'); setQuery(''); }}>Learn a skill</button>
        <button aria-pressed={section === 'cases'} onClick={() => { setSection('cases'); setQuery(''); }}>Practise a case</button>
      </div>
      {section === 'skills' && <details className="studio-baseline" open={!normal}>
        <summary aria-label="Change comparison findings"><HeartPulse size={20} /><strong>{normal ? 'Normal findings' : 'Case comparison'}</strong><span>{normal ? 'Healthy adult at rest' : scenario.title}</span><small>Change findings ↓</small></summary>
        <label>Findings to show<select aria-label="Findings to show" value={scenarioId} onChange={e => onScenario(e.target.value)}>{SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
        {!normal && <button className="studio-reset" onClick={() => onScenario('normal')}>Return to normal baseline</button>}
        <p>Each tool uses this selection. Sound demonstrations inside Auscultation can override it.</p>
      </details>}
      <label className="studio-search"><Search size={18} /><input type="search" aria-label={section === 'skills' ? 'Search skills' : 'Search cases'} placeholder={section === 'skills' ? 'Find a skill…' : 'Find a case or specialty…'} value={query} onChange={e => setQuery(e.target.value)} /></label>
      {section === 'skills' ? <>
        <div className="studio-grid">{skills.map(({id,title,hint,emoji}) => <button key={id} onClick={() => onTool(id)}><span className="studio-emoji" aria-hidden="true">{emoji}</span><strong>{title}</strong><small>{hint}</small><span className="studio-open">Open skill <ChevronRight size={14} /></span></button>)}</div>
        {!skills.length && <p role="status">No matching skill. Try “ECG” or “lungs”.</p>}
        <button className="studio-monitor" onClick={onMonitor}><span className="studio-emoji" aria-hidden="true">📈</span><span>Open live monitor<small>See ECG, oxygen saturation & respiratory waveforms</small></span><ChevronRight size={20} /></button>
      </> : <div className="studio-cases">{cases.map(s => <button key={s.id} onClick={() => onCase(s.id)}><span><small>{s.category}</small><strong>{s.title}</strong><p>{s.subtitle}</p></span><ChevronRight size={20} /></button>)}{!cases.length && <p role="status">No matching case.</p>}</div>}
      <p className="studio-footnote">Teaching simulations for learning examination and anatomy.</p>
    </main>
  </div>;
}
