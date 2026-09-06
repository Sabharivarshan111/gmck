import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Activity, ShieldAlert, BookOpen, Layers } from 'lucide-react';
import { PhysiologyKernel, SCENARIOS } from '../simulator/engine/PhysiologyKernel';
import { AnatomicalLayer, DiagnosticToolType, PatientPathologyState, PatientVitals } from '../simulator/types';
import { AnatomicalBody3D } from '../simulator/view/AnatomicalBody3D';
import { IcuMonitor } from '../simulator/instruments/IcuMonitor';
import { DiagnosticTools } from '../simulator/instruments/DiagnosticTools';
import { InterventionPanel } from '../simulator/controls/InterventionPanel';

export const Simulator: React.FC = () => {
  const [searchParams] = useSearchParams();
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
        // Sync state periodically (every 100ms)
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

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 sticky top-0 z-30 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Notes</span>
          </Link>
          <div className="h-4 w-[1px] bg-slate-700" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-black text-white tracking-wide flex items-center gap-2">
                Orbit 3D Patient Simulator
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  v8.0 PBR Engine
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                CBME Final Year MBBS Clinical Resuscitation & Diagnostic Suite
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Physiology ODE: </span>
            <span className="text-emerald-400 font-mono font-bold">100 Hz Runge-Kutta 4</span>
          </div>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="flex-1 p-3 md:p-5 max-w-7xl mx-auto w-full flex flex-col space-y-4">
        {/* Top Split: 3D Anatomical Viewport & ICU Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 3D Anatomical Viewport (7 Cols on desktop) */}
          <div className="lg:col-span-7 h-[420px] md:h-[500px]">
            <AnatomicalBody3D
              vitals={vitals}
              pathology={pathology}
              layer={activeLayer}
              scenarioId={currentScenarioId}
            />
          </div>

          {/* ICU Telemetry Monitor (5 Cols on desktop) */}
          <div className="lg:col-span-5 h-[420px] md:h-[500px] flex flex-col">
            <IcuMonitor
              vitals={vitals}
              sampleWaveforms={handleSampleWaveforms}
              ecgRhythm={pathology.ecgRhythm}
            />
          </div>
        </div>

        {/* Bottom Panel: Interventions, Diagnostics & Case Scenarios */}
        <div className="w-full">
          <InterventionPanel
            scenarios={SCENARIOS}
            currentScenarioId={currentScenarioId}
            onSelectScenario={handleSelectScenario}
            activeLayer={activeLayer}
            onSelectLayer={setActiveLayer}
            onOpenTool={setActiveTool}
            onApplyAction={handleApplyAction}
            logs={logs}
          />
        </div>
      </main>

      {/* Diagnostic Modal Tool (Pupil, Ultrasound, Stethoscope, 12-Lead ECG) */}
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
