import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  ShieldAlert,
  Layers,
  Sun,
  Moon,
  Compass,
  Stethoscope,
  Sparkles,
  Monitor,
  Heart,
  ChevronDown,
  Info,
} from 'lucide-react';
import { PhysiologyKernel, SCENARIOS } from '../simulator/engine/PhysiologyKernel';
import { AnatomicalLayer, DiagnosticToolType, PatientPathologyState, PatientVitals } from '../simulator/types';
import { AnatomicalBody3D } from '../simulator/view/AnatomicalBody3D';
import { IcuMonitor } from '../simulator/instruments/IcuMonitor';
import { DiagnosticTools } from '../simulator/instruments/DiagnosticTools';
import { InterventionPanel } from '../simulator/controls/InterventionPanel';
import { OrganDetailDrawer } from '../simulator/controls/OrganDetailDrawer';

export const Simulator: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialScenario = searchParams.get('scenario') || 'snakebite';
  const initialTool = (searchParams.get('tool') as DiagnosticToolType) || 'none';
  const initialLayer = (searchParams.get('layer') as AnatomicalLayer) || 'glass';

  // Physiology Engine Instance
  const kernelRef = useRef<PhysiologyKernel | null>(null);
  if (!kernelRef.current) {
    kernelRef.current = new PhysiologyKernel(initialScenario);
  }
  const kernel = kernelRef.current;

  // React state synchronized with engine
  const [currentScenarioId, setCurrentScenarioId] = useState<string>(initialScenario);
  const [vitals, setVitals] = useState<PatientVitals>({ ...kernel.vitals });
  const [pathology, setPathology] = useState<PatientPathologyState>({ ...kernel.pathology });
  const [activeLayer, setActiveLayer] = useState<AnatomicalLayer>(initialLayer);
  const [activeTool, setActiveTool] = useState<DiagnosticToolType>(initialTool);
  const [logs, setLogs] = useState<string[]>([...kernel.logs]);

  // Clean White Medical Studio vs ICU Dark Mode (Default: light matching ashemag/human-atlas)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Mobile navigation tab state
  const [mobileTab, setMobileTab] = useState<'3d' | 'telemetry' | 'interventions'>('3d');

  // Selected Organ for Deep Anatomical Sheet
  const [selectedOrganId, setSelectedOrganId] = useState<string | null>(null);

  // Active Camera Preset
  const [cameraPreset, setCameraPreset] = useState<'anterior' | 'head' | 'thorax' | 'abdomen'>('anterior');

  // Global listener for organ selection events
  useEffect(() => {
    const handleOrganSelect = (e: any) => {
      if (e.detail && e.detail.organId) {
        setSelectedOrganId(e.detail.organId);
      }
    };
    window.addEventListener('select-simulator-organ', handleOrganSelect);
    return () => {
      window.removeEventListener('select-simulator-organ', handleOrganSelect);
    };
  }, []);

  // Initial action from searchParams if provided
  useEffect(() => {
    const action = searchParams.get('action');
    if (action && kernelRef.current) {
      kernelRef.current.applyAction(action);
      setVitals({ ...kernelRef.current.vitals });
      setPathology({ ...kernelRef.current.pathology });
      setLogs([...kernelRef.current.logs]);
    }
  }, [searchParams]);

  // Simulation Clock Tick Loop (60 Hz UI sync)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      if (kernelRef.current) {
        kernelRef.current.tick(dt);
        setVitals({ ...kernelRef.current.vitals });
        setPathology({ ...kernelRef.current.pathology });
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Scenario switch handler
  const handleSelectScenario = (scenarioId: string) => {
    if (!kernelRef.current) return;
    kernelRef.current.setScenario(scenarioId);
    setCurrentScenarioId(scenarioId);
    setVitals({ ...kernelRef.current.vitals });
    setPathology({ ...kernelRef.current.pathology });
    setLogs([...kernelRef.current.logs]);
  };

  // Action intervention handler
  const handleApplyAction = (actionId: string) => {
    if (!kernelRef.current) return;
    kernelRef.current.applyAction(actionId);
    setVitals({ ...kernelRef.current.vitals });
    setPathology({ ...kernelRef.current.pathology });
    setLogs([...kernelRef.current.logs]);
  };

  // Sample waveform callback for ICU monitor
  const handleSampleWaveforms = useCallback(() => {
    if (kernelRef.current) {
      return kernelRef.current.sampleWaveforms();
    }
    return { ecg: 0, artLine: 80, cvp: 4, capno: 35, pleth: 0.5 };
  }, []);

  const isLight = theme === 'light';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        isLight ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#05070d] text-slate-100'
      }`}
    >
      {/* 1. Header Bar (Responsive & Clean) */}
      <header
        className={`px-3 md:px-6 py-2.5 sticky top-0 z-30 backdrop-blur-xl border-b transition-colors ${
          isLight
            ? 'bg-white/85 border-slate-200/80 shadow-xs'
            : 'bg-slate-900/90 border-slate-800 shadow-md'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Brand & Back Navigation */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Link
              to="/"
              className={`p-1.5 rounded-xl border flex items-center gap-1 text-xs font-semibold transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-2xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Notes</span>
            </Link>

            <div className={`h-4 w-[1px] hidden sm:block ${isLight ? 'bg-slate-300' : 'bg-slate-700'}`} />

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Activity className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-xs md:text-sm font-black tracking-tight truncate">
                    Orbit 3D Patient Simulator
                  </h1>
                  <span
                    className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded-full font-bold border ${
                      isLight
                        ? 'bg-sky-100 text-sky-700 border-sky-200'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    }`}
                  >
                    Clinical Studio
                  </span>
                </div>
                <p className={`text-[10px] truncate hidden md:block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  NMC CBME Virtual Resuscitation & Multi-Organ Anatomy
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick Vitals Pill Bar & Theme Switcher */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Quick Vitals HUD (Mobile & Desktop) */}
            <div
              onClick={() => setMobileTab('telemetry')}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border cursor-pointer transition-all ${
                isLight
                  ? 'bg-slate-100/90 border-slate-200 text-slate-700 hover:bg-slate-200/80 shadow-2xs'
                  : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-rose-500">
                <Heart className="w-3 h-3 fill-rose-500 animate-pulse" />
                <span>{Math.round(vitals.heartRate)}</span>
              </div>
              <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>|</span>
              <div className="text-[11px] font-mono font-bold text-sky-600 dark:text-cyan-400">
                <span>{Math.round(vitals.bpSystolic)}/{Math.round(vitals.bpDiastolic)}</span>
              </div>
              <span className={`text-[10px] hidden sm:inline ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>|</span>
              <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 hidden sm:flex items-center">
                <span>{Math.round(vitals.spo2)}%</span>
              </div>
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setTheme(isLight ? 'dark' : 'light')}
              title={isLight ? 'Switch to ICU Dark Telemetry Mode' : 'Switch to Clean Medical Studio Mode'}
              className={`p-2 rounded-xl border transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
              }`}
            >
              {isLight ? <Moon className="w-4 h-4 text-slate-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Mobile Segmented Tab Bar (Visible on mobile/tablet < 1024px) */}
      <div
        className={`lg:hidden px-3 py-2 border-b sticky top-[53px] z-20 backdrop-blur-md flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar ${
          isLight ? 'bg-white/90 border-slate-200/80' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <button
          onClick={() => setMobileTab('3d')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === '3d'
              ? isLight
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-cyan-500 text-slate-950 shadow-xs'
              : isLight
              ? 'text-slate-600 hover:bg-slate-100'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>3D Anatomy</span>
        </button>

        <button
          onClick={() => setMobileTab('telemetry')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'telemetry'
              ? isLight
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-cyan-500 text-slate-950 shadow-xs'
              : isLight
              ? 'text-slate-600 hover:bg-slate-100'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>ICU Monitor</span>
        </button>

        <button
          onClick={() => setMobileTab('interventions')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'interventions'
              ? isLight
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-cyan-500 text-slate-950 shadow-xs'
              : isLight
              ? 'text-slate-600 hover:bg-slate-100'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Rx & Case</span>
        </button>
      </div>

      {/* 3. Main Stage Content */}
      <main className="flex-1 p-3 md:p-5 max-w-7xl mx-auto w-full flex flex-col space-y-4">
        {/* DESKTOP VIEW: Split View (Side-by-side) */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4">
          {/* 3D Anatomical Viewport (7 cols) */}
          <div className="lg:col-span-7 h-[520px]">
            <AnatomicalBody3D
              vitals={vitals}
              pathology={pathology}
              layer={activeLayer}
              scenarioId={currentScenarioId}
              cameraPreset={cameraPreset}
              theme={theme}
              selectedOrganId={selectedOrganId}
              onSelectOrganId={(organId) => setSelectedOrganId(organId)}
            />
          </div>

          {/* ICU Telemetry Monitor (5 cols) */}
          <div className="lg:col-span-5 h-[520px] flex flex-col">
            <IcuMonitor
              vitals={vitals}
              sampleWaveforms={handleSampleWaveforms}
              ecgRhythm={pathology.ecgRhythm}
              theme={theme}
            />
          </div>
        </div>

        {/* MOBILE VIEW: Tab-driven clean single stage */}
        <div className="lg:hidden flex flex-col space-y-3">
          {mobileTab === '3d' && (
            <div className="h-[440px] w-full">
              <AnatomicalBody3D
                vitals={vitals}
                pathology={pathology}
                layer={activeLayer}
                scenarioId={currentScenarioId}
                cameraPreset={cameraPreset}
                theme={theme}
                selectedOrganId={selectedOrganId}
                onSelectOrganId={(organId) => setSelectedOrganId(organId)}
              />
            </div>
          )}

          {mobileTab === 'telemetry' && (
            <div className="h-[460px] w-full">
              <IcuMonitor
                vitals={vitals}
                sampleWaveforms={handleSampleWaveforms}
                ecgRhythm={pathology.ecgRhythm}
                theme={theme}
              />
            </div>
          )}
        </div>

        {/* Bottom Panel: Interventions, Diagnostics & Case Scenarios */}
        {/* On desktop: always visible. On mobile: visible when interventions tab is selected OR under 3D stage */}
        <div className={`w-full ${mobileTab === 'telemetry' ? 'hidden lg:block' : 'block'}`}>
          <InterventionPanel
            scenarios={SCENARIOS}
            currentScenarioId={currentScenarioId}
            onSelectScenario={handleSelectScenario}
            activeLayer={activeLayer}
            onSelectLayer={setActiveLayer}
            onOpenTool={setActiveTool}
            onApplyAction={handleApplyAction}
            logs={logs}
            theme={theme}
          />
        </div>
      </main>

      {/* 4. Apple-Style Deep Organ Anatomical Drawer (Slide-up on mobile, slide-in on desktop) */}
      <OrganDetailDrawer
        organId={selectedOrganId}
        onClose={() => setSelectedOrganId(null)}
        onFocusCamera={(preset) => setCameraPreset(preset)}
        theme={theme}
      />

      {/* 5. Diagnostic Modal Tool (Pupil, Ultrasound POCUS, Stethoscope, 12-Lead ECG) */}
      <DiagnosticTools
        tool={activeTool}
        pathology={pathology}
        vitals={vitals}
        onClose={() => setActiveTool('none')}
      />
    </div>
  );
};

export default Simulator;
