import React from 'react';
import { AnatomicalLayer, DiagnosticToolType, ScenarioDefinition } from '../types';

interface InterventionPanelProps {
  scenarios: ScenarioDefinition[];
  currentScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  activeLayer: AnatomicalLayer;
  onSelectLayer: (layer: AnatomicalLayer) => void;
  onOpenTool: (tool: DiagnosticToolType) => void;
  onApplyAction: (actionId: string) => void;
  logs: string[];
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
}) => {
  const currentScenario = scenarios.find((s) => s.id === currentScenarioId) || scenarios[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col space-y-4 text-slate-100 shadow-xl">
      {/* 1. Scenario Selector & Clinical Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">
            Active Clinical Simulation Scenario
          </div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            {currentScenario.title}
          </h2>
          <p className="text-xs text-slate-400">{currentScenario.chiefComplaint}</p>
        </div>

        {/* Scenario Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium">Switch Case:</label>
          <select
            value={currentScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Anatomical Layer Toggles & Diagnostic Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Layer Toggles */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span>🧬 Anatomical 3D Layers:</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {(
              [
                { id: 'glass', label: 'Glass' },
                { id: 'skin', label: 'Skin' },
                { id: 'vascular', label: 'Vessels' },
                { id: 'viscera', label: 'Viscera' },
                { id: 'skeletal', label: 'X-Ray' },
              ] as const
            ).map((l) => (
              <button
                key={l.id}
                onClick={() => onSelectLayer(l.id)}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  activeLayer === l.id
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic Tools */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span>🔬 Bedside Diagnostics:</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => onOpenTool('pupil')}
              className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              👁️ Pupil
            </button>
            <button
              onClick={() => onOpenTool('ultrasound')}
              className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              📡 POCUS
            </button>
            <button
              onClick={() => onOpenTool('stethoscope')}
              className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              🩺 Steth
            </button>
            <button
              onClick={() => onOpenTool('ecg12')}
              className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              📈 12-Lead
            </button>
          </div>
        </div>
      </div>

      {/* 3. Clinical Interventions / Resuscitation Drugs */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>⚡ Emergency Interventions & Pharmacotherapy:</span>
          <span className="text-[11px] text-slate-500 font-mono">Select action to execute</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <button
            onClick={() => onApplyAction('saline')}
            className="p-2 bg-blue-950/50 hover:bg-blue-900/60 border border-blue-800/60 text-blue-300 rounded-lg text-xs font-semibold flex flex-col items-center text-center transition-all"
          >
            <span className="text-base">💧</span>
            <span>IV Saline</span>
            <span className="text-[10px] text-blue-400/80">500 mL Bolus</span>
          </button>

          <button
            onClick={() => onApplyAction('antivenom')}
            className="p-2 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 rounded-lg text-xs font-semibold flex flex-col items-center text-center transition-all"
          >
            <span className="text-base">🧪</span>
            <span>Antivenom</span>
            <span className="text-[10px] text-emerald-400/80">10 Vials ASV</span>
          </button>

          <button
            onClick={() => onApplyAction('atropine')}
            className="p-2 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/60 text-purple-300 rounded-lg text-xs font-semibold flex flex-col items-center text-center transition-all"
          >
            <span className="text-base">💉</span>
            <span>Atropine</span>
            <span className="text-[10px] text-purple-400/80">0.6 mg IV</span>
          </button>

          <button
            onClick={() => onApplyAction('adrenaline')}
            className="p-2 bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 text-red-300 rounded-lg text-xs font-semibold flex flex-col items-center text-center transition-all"
          >
            <span className="text-base">⚡</span>
            <span>Adrenaline</span>
            <span className="text-[10px] text-red-400/80">1 mg IV</span>
          </button>

          <button
            onClick={() => onApplyAction('oxygen')}
            className="p-2 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 rounded-lg text-xs font-semibold flex flex-col items-center text-center transition-all"
          >
            <span className="text-base">🫁</span>
            <span>High-Flow O2</span>
            <span className="text-[10px] text-cyan-400/80">15 L/min NRB</span>
          </button>

          <button
            onClick={() => onApplyAction('nitroglycerin')}
            className="p-2 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 rounded-lg text-xs font-semibold flex flex-col items-center text-center transition-all"
          >
            <span className="text-base">💊</span>
            <span>Nitroglycerin</span>
            <span className="text-[10px] text-amber-400/80">0.4 mg SL</span>
          </button>

          <button
            onClick={() => onApplyAction('defib')}
            className="p-2 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-lg text-xs font-semibold flex flex-col items-center text-center transition-all"
          >
            <span className="text-base">⚡⚡</span>
            <span>Defibrillator</span>
            <span className="text-[10px] text-rose-400/80">200J Biphasic</span>
          </button>
        </div>
      </div>

      {/* 4. Real-Time Clinical Event Log */}
      <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-3 space-y-1.5">
        <div className="text-[11px] font-mono font-semibold text-slate-400 flex items-center justify-between">
          <span>EVENT LOG & CLINICAL FEEDBACK</span>
          <span className="text-slate-600">{logs.length} entries</span>
        </div>
        <div className="h-20 overflow-y-auto font-mono text-xs space-y-1 pr-2">
          {logs.slice(-5).map((log, index) => (
            <div
              key={index}
              className={`p-1 rounded flex items-center gap-2 ${
                log.includes('CRITICAL ERROR')
                  ? 'bg-red-950/80 border border-red-800 text-red-300 font-bold'
                  : 'text-slate-300'
              }`}
            >
              <span className="text-slate-600 text-[10px]">•</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
