import React from 'react';
import { AnatomicalLayer, DiagnosticToolType, ScenarioDefinition } from '../types';
import { Layers, Stethoscope, Sparkles, Activity, AlertCircle } from 'lucide-react';

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

  return (
    <div
      className={`rounded-2xl md:rounded-3xl p-4 md:p-5 flex flex-col space-y-4 border transition-all ${
        isLight
          ? 'bg-white text-slate-900 border-slate-200/80 shadow-md'
          : 'bg-slate-900/90 text-slate-100 border-slate-800 shadow-xl'
      }`}
    >
      {/* 1. Scenario Selector & Clinical Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
          isLight ? 'border-slate-100' : 'border-slate-800'
        }`}
      >
        <div>
          <div
            className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider ${
              isLight ? 'text-sky-600' : 'text-cyan-400'
            }`}
          >
            Active MBBS Clinical Scenario
          </div>
          <h2 className="text-base md:text-lg font-black flex items-center gap-2 mt-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span>{currentScenario.title}</span>
          </h2>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {currentScenario.chiefComplaint}
          </p>
        </div>

        {/* Scenario Switcher Dropdown */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <label className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Case:
          </label>
          <select
            value={currentScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className={`text-xs font-medium rounded-xl px-3 py-2 border transition-all focus:outline-none focus:ring-2 ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 focus:ring-sky-500'
                : 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-cyan-500'
            }`}
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
              Anatomical 3D Layers
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
                { id: 'skeletal', label: 'X-Ray' },
              ] as const
            ).map((l) => (
              <button
                key={l.id}
                onClick={() => onSelectLayer(l.id)}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
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
              className={`py-2 px-1 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              👁️ Pupil
            </button>
            <button
              onClick={() => onOpenTool('ultrasound')}
              className={`py-2 px-1 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              📡 POCUS
            </button>
            <button
              onClick={() => onOpenTool('stethoscope')}
              className={`py-2 px-1 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              🩺 Steth
            </button>
            <button
              onClick={() => onOpenTool('ecg12')}
              className={`py-2 px-1 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all ${
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

      {/* 3. Clinical Interventions / Resuscitation Drugs */}
      <div
        className={`p-3.5 md:p-4 rounded-2xl border space-y-2.5 ${
          isLight ? 'bg-slate-50/80 border-slate-200/80' : 'bg-slate-950/70 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-1.5">
            <Sparkles className={`w-4 h-4 ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
            Emergency Interventions & Pharmacotherapy
          </span>
          <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Tap to infuse
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <button
            onClick={() => onApplyAction('saline')}
            className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center text-center transition-all ${
              isLight
                ? 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-800 shadow-xs'
                : 'bg-blue-950/50 hover:bg-blue-900/60 border-blue-800/60 text-blue-300'
            }`}
          >
            <span className="text-base">💧</span>
            <span>IV Saline</span>
            <span className={`text-[10px] ${isLight ? 'text-sky-600' : 'text-blue-400/80'}`}>500 mL Bolus</span>
          </button>

          <button
            onClick={() => onApplyAction('antivenom')}
            className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center text-center transition-all ${
              isLight
                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800 shadow-xs'
                : 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-800/60 text-emerald-300'
            }`}
          >
            <span className="text-base">🧪</span>
            <span>Antivenom</span>
            <span className={`text-[10px] ${isLight ? 'text-emerald-600' : 'text-emerald-400/80'}`}>10 Vials ASV</span>
          </button>

          <button
            onClick={() => onApplyAction('atropine')}
            className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center text-center transition-all ${
              isLight
                ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800 shadow-xs'
                : 'bg-purple-950/50 hover:bg-purple-900/60 border-purple-800/60 text-purple-300'
            }`}
          >
            <span className="text-base">💉</span>
            <span>Atropine</span>
            <span className={`text-[10px] ${isLight ? 'text-purple-600' : 'text-purple-400/80'}`}>0.6 mg IV</span>
          </button>

          <button
            onClick={() => onApplyAction('adrenaline')}
            className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center text-center transition-all ${
              isLight
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800 shadow-xs'
                : 'bg-red-950/50 hover:bg-red-900/60 border-red-800/60 text-red-300'
            }`}
          >
            <span className="text-base">⚡</span>
            <span>Adrenaline</span>
            <span className={`text-[10px] ${isLight ? 'text-rose-600' : 'text-red-400/80'}`}>1 mg IV</span>
          </button>

          <button
            onClick={() => onApplyAction('oxygen')}
            className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center text-center transition-all ${
              isLight
                ? 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-800 shadow-xs'
                : 'bg-cyan-950/50 hover:bg-cyan-900/60 border-cyan-800/60 text-cyan-300'
            }`}
          >
            <span className="text-base">🫁</span>
            <span>High-Flow O2</span>
            <span className={`text-[10px] ${isLight ? 'text-teal-600' : 'text-cyan-400/80'}`}>15 L/min NRB</span>
          </button>

          <button
            onClick={() => onApplyAction('nitroglycerin')}
            className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center text-center transition-all ${
              isLight
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800 shadow-xs'
                : 'bg-amber-950/50 hover:bg-amber-900/60 border-amber-800/60 text-amber-300'
            }`}
          >
            <span className="text-base">💊</span>
            <span>Nitroglycerin</span>
            <span className={`text-[10px] ${isLight ? 'text-amber-600' : 'text-amber-400/80'}`}>0.4 mg SL</span>
          </button>

          <button
            onClick={() => onApplyAction('defib')}
            className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center text-center transition-all ${
              isLight
                ? 'bg-red-100 hover:bg-red-200 border-red-300 text-red-900 shadow-xs'
                : 'bg-rose-950/50 hover:bg-rose-900/60 border-rose-800/60 text-rose-300'
            }`}
          >
            <span className="text-base">⚡⚡</span>
            <span>Defibrillator</span>
            <span className={`text-[10px] ${isLight ? 'text-red-700' : 'text-rose-400/80'}`}>200J Biphasic</span>
          </button>
        </div>
      </div>

      {/* 4. Real-Time Clinical Event Log */}
      <div
        className={`rounded-2xl border p-3 space-y-1.5 ${
          isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-950/90 border-slate-800'
        }`}
      >
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-between">
          <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Clinical Event Log & Feedback</span>
          <span className={isLight ? 'text-slate-400' : 'text-slate-600'}>{logs.length} entries</span>
        </div>
        <div className="h-16 md:h-20 overflow-y-auto font-mono text-xs space-y-1 pr-2">
          {logs.slice(-5).map((log, index) => (
            <div
              key={index}
              className={`p-1 rounded flex items-center gap-2 ${
                log.includes('CRITICAL ERROR')
                  ? isLight
                    ? 'bg-rose-50 border border-rose-200 text-rose-700 font-bold'
                    : 'bg-red-950/80 border border-red-800 text-red-300 font-bold'
                  : isLight
                  ? 'text-slate-700'
                  : 'text-slate-300'
              }`}
            >
              <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>•</span>
              <span className="text-[11px] md:text-xs">{log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
