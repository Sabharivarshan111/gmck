import React, { useState } from 'react';
import { AnatomicalLayer, DiagnosticToolType, ScenarioDefinition } from '../types';
import { Layers, Stethoscope, Sparkles, Activity, AlertCircle, ChevronDown, ShieldAlert, HeartPulse, Pill, Syringe } from 'lucide-react';

interface InterventionPanelProps {
  scenarios: ScenarioDefinition[];
  currentScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  activeLayer: AnatomicalLayer;
  onSelectLayer: (layer: AnatomicalLayer) => void;
  onOpenTool: (tool: DiagnosticToolType) => void;
  onApplyAction: (actionId: string) => void;
  logs: string[];
  theme?: 'light' | 'dark';
}

export const InterventionPanel: React.FC<InterventionPanelProps> = ({
  scenarios,
  currentScenarioId,
  onSelectScenario,
  activeLayer,
  onSelectLayer,
  onOpenTool,
  onApplyAction,
  logs,
  theme = 'light',
}) => {
  const currentScenario = scenarios.find((s) => s.id === currentScenarioId) || scenarios[0];
  const isLight = theme === 'light';
  const [activeInterventionTab, setActiveInterventionTab] = useState<'all' | 'resus' | 'cardiac' | 'antidotes' | 'procedures'>('all');

  // Categorized interventions
  const interventions = [
    // Resuscitation & Fluids
    { id: 'saline', label: 'IV Saline', sub: '500 mL Bolus', icon: '💧', cat: 'resus', color: 'sky' },
    { id: 'oxygen', label: 'High-Flow O2', sub: '15 L/min NRB', icon: '🫁', cat: 'resus', color: 'teal' },
    { id: 'defib', label: 'Defibrillator', sub: '200J Biphasic', icon: '⚡', cat: 'resus', color: 'rose' },

    // Vasoactive & Cardiac
    { id: 'adrenaline', label: 'Adrenaline', sub: '1 mg IV / 0.5 IM', icon: '⚡', cat: 'cardiac', color: 'rose' },
    { id: 'noradrenaline', label: 'Noradrenaline', sub: 'Infusion >65 MAP', icon: '🩸', cat: 'cardiac', color: 'red' },
    { id: 'atropine', label: 'Atropine', sub: '0.6 mg IV', icon: '💉', cat: 'cardiac', color: 'purple' },
    { id: 'nitroglycerin', label: 'Nitroglycerin', sub: '0.4 mg SL', icon: '💊', cat: 'cardiac', color: 'amber' },
    { id: 'furosemide', label: 'Furosemide', sub: '40 mg IV', icon: '🌊', cat: 'cardiac', color: 'blue' },

    // Antidotes & Metabolic
    { id: 'antivenom', label: 'Antivenom', sub: '10 Vials ASV', icon: '🐍', cat: 'antidotes', color: 'emerald' },
    { id: 'pralidoxime', label: 'Pralidoxime', sub: '2-PAM 2g IV', icon: '🧪', cat: 'antidotes', color: 'indigo' },
    { id: 'insulin_iv', label: 'Regular Insulin', sub: '10 Units IV', icon: '💉', cat: 'antidotes', color: 'violet' },

    // Procedures & Decompressions
    { id: 'needle_decomp', label: 'Needle Decomp', sub: '2nd ICS MCL', icon: '🎯', cat: 'procedures', color: 'orange' },
    { id: 'pericardiocentesis', label: 'Pericardiocentesis', sub: 'Subxiphoid Tap', icon: '🫀', cat: 'procedures', color: 'red' },
    { id: 'rtpa', label: 'r-tPA Alteplase', sub: '0.9 mg/kg IV', icon: '🧠', cat: 'procedures', color: 'cyan' },
  ];

  const filteredInterventions = activeInterventionTab === 'all'
    ? interventions
    : interventions.filter(i => i.cat === activeInterventionTab);

  // Group scenarios by category
  const categories = Array.from(new Set(scenarios.map(s => s.category)));

  return (
    <div
      className={`rounded-2xl md:rounded-3xl border p-4 md:p-5 space-y-4 md:space-y-5 transition-all ${
        isLight
          ? 'bg-white border-slate-200/80 shadow-sm text-slate-800'
          : 'bg-slate-900 border-slate-800 shadow-xl text-slate-100'
      }`}
    >
      {/* 1. Header: Active Clinical Scenario & Case Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <div
            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isLight ? 'text-sky-600' : 'text-cyan-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Active MBBS Clinical Scenario ({scenarios.length} Cases Available)</span>
          </div>
          <h2 className="text-base md:text-lg font-black flex items-center gap-2 mt-0.5">
            <span className="truncate">{currentScenario.title}</span>
          </h2>
          <p className={`text-xs mt-0.5 line-clamp-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {currentScenario.chiefComplaint}
          </p>
        </div>

        {/* Scenario Switcher Dropdown (Responsive, Categorized) */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-1.5 min-w-0 mt-1 sm:mt-0">
          <label className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider flex-shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Case:
          </label>
          <div className="relative w-full sm:w-80 min-w-0">
            <select
              value={currentScenarioId}
              onChange={(e) => onSelectScenario(e.target.value)}
              className={`w-full truncate text-xs font-semibold rounded-xl pl-3 pr-8 py-2 border transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer ${
                isLight
                  ? 'bg-slate-100/90 hover:bg-slate-200/80 border-slate-300/80 text-slate-900 focus:ring-sky-500'
                  : 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-cyan-500'
              }`}
            >
              {categories.map((cat) => (
                <optgroup key={cat} label={`── ${cat} ──`}>
                  {scenarios
                    .filter((sc) => sc.category === cat)
                    .map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.title}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Case Details Badge Strip */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`px-2.5 py-1 rounded-lg font-semibold border ${
          isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
        }`}>
          Category: <strong>{currentScenario.category}</strong>
        </span>
        <span className={`px-2.5 py-1 rounded-lg font-semibold border ${
          isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
        }`}>
          Target Rx: {currentScenario.targetInterventions.join(', ')}
        </span>
        <span className={`px-2.5 py-1 rounded-lg font-semibold border ${
          isLight ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
        }`}>
          Lethal Errors: {currentScenario.lethalTriggers.join(', ')}
        </span>
      </div>

      {/* 2. Anatomical Layer Toggles & Diagnostic Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {/* Layer Toggles */}
        <div
          className={`p-3 md:p-3.5 rounded-2xl border space-y-2 ${
            isLight ? 'bg-slate-50/80 border-slate-200/80' : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
              Anatomical 3D Systems
            </span>
            <span className={`text-[10px] uppercase font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              5 layers
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {(
              [
                { id: 'glass', label: 'Glass' },
                { id: 'skin', label: 'Skin' },
                { id: 'vascular', label: 'Vessels' },
                { id: 'viscera', label: 'Viscera' },
                { id: 'skeletal', label: 'Skeleton' },
              ] as const
            ).map((l) => (
              <button
                key={l.id}
                onClick={() => onSelectLayer(l.id)}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  activeLayer === l.id
                    ? isLight
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-500/20'
                      : 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : isLight
                    ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic Tools */}
        <div
          className={`p-3 md:p-3.5 rounded-2xl border space-y-2 ${
            isLight ? 'bg-slate-50/80 border-slate-200/80' : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Stethoscope className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              Bedside Diagnostics & POCUS
            </span>
            <span className={`text-[10px] uppercase font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              Modal Tools
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => onOpenTool('pupil')}
              className={`py-2 px-1 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              👁️ Pupil
            </button>
            <button
              onClick={() => onOpenTool('ultrasound')}
              className={`py-2 px-1 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              📡 POCUS
            </button>
            <button
              onClick={() => onOpenTool('stethoscope')}
              className={`py-2 px-1 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              🩺 Steth
            </button>
            <button
              onClick={() => onOpenTool('ecg12')}
              className={`py-2 px-1 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              📈 12-Lead
            </button>
          </div>
        </div>
      </div>

      {/* 3. Categorized Emergency Interventions / Resuscitation Drugs */}
      <div
        className={`p-3.5 md:p-4 rounded-2xl border space-y-3 ${
          isLight ? 'bg-slate-50/80 border-slate-200/80' : 'bg-slate-950/70 border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Sparkles className={`w-4 h-4 ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
            <span>Emergency Interventions & Pharmacotherapy</span>
          </div>

          {/* Sub-category selector */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
            {[
              { id: 'all', label: 'All (14)' },
              { id: 'resus', label: 'Resus & Fluids' },
              { id: 'cardiac', label: 'Vasoactive' },
              { id: 'antidotes', label: 'Antidotes' },
              { id: 'procedures', label: 'Procedures' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveInterventionTab(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeInterventionTab === tab.id
                    ? isLight
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-cyan-500 text-slate-950 shadow-xs font-black'
                    : isLight
                    ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interventions Button Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {filteredInterventions.map((item) => (
            <button
              key={item.id}
              onClick={() => onApplyAction(item.id)}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center text-center transition-all cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-white hover:bg-slate-100/90 border-slate-200 text-slate-800 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
              }`}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span className="truncate w-full">{item.label}</span>
              <span className={`text-[10px] truncate w-full ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'}`}>
                {item.sub}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Clinical Event Log & Bedside Feedback */}
      <div
        className={`p-3 md:p-4 rounded-2xl border space-y-2 ${
          isLight ? 'bg-slate-50/60 border-slate-200/80' : 'bg-slate-950/50 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-1.5">
            <Activity className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
            Clinical Event Log & Feedback
          </span>
          <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            {logs.length} entries
          </span>
        </div>

        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {logs.slice(-6).map((log, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-xl text-xs font-mono flex items-start gap-2 ${
                log.includes('CRITICAL') || log.includes('ERROR')
                  ? 'bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 font-semibold'
                  : log.includes('CAUTION') || log.includes('WARNING')
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400'
                  : isLight
                  ? 'bg-white border border-slate-200 text-slate-700'
                  : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span className="flex-1">{log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
