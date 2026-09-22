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
import { AnatomicalBody3D, resolvePartToOrganKey } from '../simulator/view/AnatomicalBody3D';
import { useIsDesktopLayout } from '@/hooks/use-desktop-layout';
import { IcuMonitor } from '../simulator/instruments/IcuMonitor';
import { DiagnosticTools } from '../simulator/instruments/DiagnosticTools';
import { InterventionPanel } from '../simulator/controls/InterventionPanel';
import { OrganDetailDrawer } from '../simulator/controls/OrganDetailDrawer';
import { WardExamModal } from '../simulator/controls/WardExamModal';
import { DissectionToolbar } from '../simulator/controls/DissectionToolbar';
import { DissectionToolMode, Part } from '../simulator/data/atlasTypes';
import { isPeripheralNerveTarget } from '../simulator/data/peripheralNerves';
import { HRA_HEART_TARGETS, isHraHeartTarget } from '../simulator/data/hraHeart';
import {
  getHraOrganTarget,
  getHraReferenceSexForOrgan,
  getHraTargetsForOrgan,
  isHraOrganTarget,
} from '../simulator/data/hraOrgans';
import {
  getZAnatomyReferenceTarget,
  getZAnatomyTargetsForOrgan,
  isZAnatomyReferenceTarget,
} from '../simulator/data/zanatomyReferences';

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
  const [selectedOrganId, setSelectedOrganId] = useState<string | null>(searchParams.get('organ') || null);

  // Active Camera Preset
  const [cameraPreset, setCameraPreset] = useState<'anterior' | 'head' | 'thorax' | 'abdomen'>('anterior');

  // Interactive Dissection Engine State
  const [toolMode, setToolMode] = useState<DissectionToolMode>('inspect');
  const [isXray, setIsXray] = useState<boolean>(false);
  const [layerPeel, setLayerPeel] = useState<number>(0.0);
  const [hiddenPartIds, setHiddenPartIds] = useState<string[]>([]);
  // Only one of the two layouts may hold a 3D view; see use-desktop-layout.ts.
  const isDesktopLayout = useIsDesktopLayout();
  const [dissectedParts, setDissectedParts] = useState<Part[]>([]);
  const [isolatedPartId, setIsolatedPartId] = useState<string | null>(searchParams.get('isolate') || null);
  const [contextOrganId, setContextOrganId] = useState<string | null>(null);

  // Dissection Handlers
  const handleDissectPart = (part: Part) => {
    if (toolMode === 'isolate') {
      const organKey = resolvePartToOrganKey(part);
      const target = organKey || part.id;
      setIsolatedPartId((prev) => (prev === target ? null : target));
      setLogs((prev) => [
        ...prev,
        `🔍 Isolated ${part.name} (${part.system}) — Surrounding structures dimmed.`,
      ]);
      return;
    }

    // Scalpel or Cut mode
    setHiddenPartIds((prev) => (prev.includes(part.id) ? prev : [...prev, part.id]));
    setDissectedParts((prev) => (prev.some((p) => p.id === part.id) ? prev : [...prev, part]));
    setLogs((prev) => [
      ...prev,
      `✂️ Dissected ${part.name} (${part.system}) — Deep planes & neurovascular bed exposed.`,
    ]);
  };

  const handleSelectToolMode = (mode: DissectionToolMode) => {
    setToolMode(mode);
    if (mode === 'inspect') {
      // Clear 3D isolation lock so full body is inspected in context
      setIsolatedPartId(null);
    } else if (mode === 'isolate' && selectedOrganId) {
      setIsolatedPartId(selectedOrganId);
      setLogs((prev) => [
        ...prev,
        `🔍 Isolated ${selectedOrganId.toUpperCase()} — Surrounding structures dimmed.`,
      ]);
    }
  };

  const handleRestorePart = (partId: string) => {
    setHiddenPartIds((prev) => prev.filter((id) => id !== partId));
    setDissectedParts((prev) => prev.filter((p) => p.id !== partId));
    setLogs((prev) => [...prev, `Restored ${partId} to anatomical 3D space.`]);
  };

  const handleUndoLastDissect = () => {
    if (dissectedParts.length === 0) return;
    const lastPart = dissectedParts[dissectedParts.length - 1];
    setHiddenPartIds((prev) => prev.filter((id) => id !== lastPart.id));
    setDissectedParts((prev) => prev.slice(0, -1));
    setLogs((prev) => [...prev, `Undid dissection of ${lastPart.name}.`]);
  };

  const handleRestoreAll = () => {
    setHiddenPartIds([]);
    setDissectedParts([]);
    setIsolatedPartId(null);
    setLogs((prev) => [...prev, 'Full anatomical reconstruction restored.']);
  };

  const handleSelect3DOrgan = useCallback((organId: string) => {
    if (toolMode === 'isolate') {
      // In Isolate mode: Toggle isolation of clicked structure in 3D
      setIsolatedPartId((prev) => (prev === organId ? null : organId));
      setContextOrganId(null);
    } else {
      // In Inspect mode: Highlight structure in 3D & open clinical dossier without hiding the body!
      setSelectedOrganId(organId);
      setContextOrganId(null);
    }

    const lower = organId.toLowerCase();
    if (isPeripheralNerveTarget(organId)) setCameraPreset('anterior');
    else if (lower.includes('brain') || lower.includes('head')) setCameraPreset('head');
    else if (lower.includes('heart') || lower.includes('lung') || lower.includes('aorta')) setCameraPreset('thorax');
    else if (lower.includes('liver') || lower.includes('abdomen') || lower.includes('kidney') || lower.includes('stomach') || lower.includes('spleen')) setCameraPreset('abdomen');
  }, [toolMode]);

  // Keyboard shortcuts: Cmd+Z / Ctrl+Z to undo, Escape to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        handleUndoLastDissect();
      } else if (e.key === 'Escape') {
        setIsolatedPartId(null);
        setSelectedOrganId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dissectedParts]);

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
    const organ = searchParams.get('organ');
    if (organ) setSelectedOrganId(organ);
    const isolate = searchParams.get('isolate');
    if (isolate) setIsolatedPartId(isolate);
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
        setVitals({ ...kernelRef.current.getLiveVitals() });
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
      {/* 1. Header Bar (Responsive & Clean)
          Header and the mobile tab bar are ONE sticky block. The tab bar used
          to be stuck at a hardcoded 53-pixel offset, which is this header's
          height on the phone it was written on — and the header's title wraps,
          so on a narrow screen the header grows and the tab bar sat over the
          content it was meant to sit under. Nesting them means neither has to
          know the other's size. */}
      <div className="sticky top-0 z-30">
      <header
        className={`px-3 md:px-6 py-2.5 backdrop-blur-xl border-b transition-colors ${
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
              className={`min-h-[44px] min-w-[44px] px-2 sm:px-2.5 rounded-xl border flex items-center justify-center gap-1 text-xs font-semibold transition-all ${
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
            <button
              type="button"
              aria-label="Open ICU monitor"
              onClick={() => setMobileTab('telemetry')}
              className={`min-h-[44px] flex items-center gap-2 px-2.5 rounded-xl border cursor-pointer transition-all ${
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
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setTheme(isLight ? 'dark' : 'light')}
              title={isLight ? 'Switch to ICU Dark Telemetry Mode' : 'Switch to Clean Medical Studio Mode'}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-all ${
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

      {/* 2. Mobile Segmented Tab Bar (Apple HIG Recessed Segmented Control) */}
      <div className={`lg:hidden px-3 pt-2 pb-2 ${isLight ? 'bg-white/85' : 'bg-slate-900/90'} backdrop-blur-xl`}>
        <div
          className={`min-h-[52px] p-1 rounded-2xl border flex items-center justify-between gap-1 backdrop-blur-xl ${
            isLight
              ? 'bg-slate-200/80 border-slate-300/60 shadow-xs'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <button
            data-testid="simulator-tab-3d"
            onClick={() => setMobileTab('3d')}
            className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${
              mobileTab === '3d'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden min-[390px]:inline">3D Anatomy</span><span className="min-[390px]:hidden">3D</span>
          </button>

          <button
            data-testid="simulator-tab-monitor"
            onClick={() => setMobileTab('telemetry')}
            className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${
              mobileTab === 'telemetry'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden min-[390px]:inline">ICU Monitor</span><span className="min-[390px]:hidden">Monitor</span>
          </button>

          <button
            data-testid="simulator-tab-case"
            onClick={() => setMobileTab('interventions')}
            className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${
              mobileTab === 'interventions'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden min-[390px]:inline">Rx & Case</span><span className="min-[390px]:hidden">Case</span>
          </button>
        </div>
      </div>
      </div>

      {/* 3. Main Stage Content */}
      <main className="flex-1 p-2.5 sm:p-3 md:p-5 max-w-7xl mx-auto w-full flex flex-col space-y-3 md:space-y-4 pb-[calc(12px+env(safe-area-inset-bottom))]">
        {/* DESKTOP VIEW: Split View (Side-by-side) */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4">
          {/* 3D Anatomical Viewport with Interactive Dissection Engine (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-2">
            {/* Dissection & Peeler Toolbar */}
            <DissectionToolbar
              toolMode={toolMode}
              onSelectToolMode={handleSelectToolMode}
              isXray={isXray}
              onToggleXray={() => setIsXray(!isXray)}
              layerPeel={layerPeel}
              onChangeLayerPeel={setLayerPeel}
              dissectedParts={dissectedParts}
              onRestorePart={handleRestorePart}
              onUndoLastDissect={handleUndoLastDissect}
              onRestoreAll={handleRestoreAll}
              theme={theme}
            />

            {/* Viewport Canvas */}
            <div className="h-[490px] w-full relative">
              {isolatedPartId && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-amber-300 dark:border-amber-700 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Isolated: {isolatedPartId.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  {contextOrganId && contextOrganId !== isolatedPartId && (
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-2">
                      Organ: {contextOrganId.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      if (isHraHeartTarget(isolatedPartId)) {
                        setSelectedOrganId('heart');
                        return;
                      }
                      const hraTarget = getHraOrganTarget(isolatedPartId);
                      if (hraTarget) {
                        setSelectedOrganId(hraTarget.organKey);
                        return;
                      }
                      const zTarget = getZAnatomyReferenceTarget(isolatedPartId);
                      setSelectedOrganId(zTarget?.organKey || isolatedPartId);
                    }}
                    className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-100 hover:bg-sky-200 text-sky-900 dark:bg-sky-950 dark:hover:bg-sky-900 dark:text-sky-200 transition-colors cursor-pointer"
                    title="Open clinical anatomy dossier"
                  >
                    📖 Dossier
                  </button>
                  <button
                    onClick={() => {
                      setIsolatedPartId(null);
                      setContextOrganId(null);
                    }}
                    className="ml-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:hover:bg-amber-900 dark:text-amber-200 transition-colors cursor-pointer"
                  >
                    Show Full Body
                  </button>
                </div>
              )}
              {isDesktopLayout && (
                <AnatomicalBody3D
                  vitals={vitals}
                  pathology={pathology}
                  layer={activeLayer}
                  scenarioId={currentScenarioId}
                  cameraPreset={cameraPreset}
                  theme={theme}
                  selectedOrganId={selectedOrganId}
                  contextOrganId={contextOrganId}
                  onSelectOrganId={handleSelect3DOrgan}
                  toolMode={toolMode}
                  isXray={isXray}
                  layerPeel={layerPeel}
                  hiddenPartIds={hiddenPartIds}
                  isolatedPartId={isolatedPartId}
                  onDissectPart={handleDissectPart}
                />
              )}
            </div>
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

        {/* 1-Tap Organ Deep Inspector Strip (Desktop & Mobile 3D) */}
        <div
          className={`p-2 md:p-2.5 rounded-2xl border items-center gap-2 overflow-x-auto no-scrollbar ${mobileTab === '3d' ? 'flex' : 'hidden lg:flex'} ${
            isLight ? 'bg-white/95 border-slate-200/80 shadow-xs' : 'bg-slate-900/90 border-slate-800 shadow-md'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 pl-1 pr-2 border-r border-slate-200 dark:border-slate-800 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Deep Inspector:</span>
          </div>
          {[
            { id: 'full', label: 'Full Body', icon: '🧍' },
            { id: 'heart', label: 'Heart & Aorta', icon: '🫀' },
            { id: 'lungs', label: 'Lungs & Trachea', icon: '🫁' },
            { id: 'abdomen', label: 'Abdomen & GI', icon: '🥘' },
            { id: 'brain', label: 'Brain & Cranium', icon: '🧠' },
            { id: 'peripheral_nerves', label: 'Peripheral Nerves', icon: '⚡' },
            { id: 'liver', label: 'Liver & Biliary', icon: '🩸' },
            { id: 'stomach', label: 'Stomach & Bed', icon: '🥣' },
            { id: 'pancreas', label: 'Pancreas', icon: '🥞' },
            { id: 'spleen', label: 'Spleen', icon: '🛡️' },
            { id: 'small_intestine', label: 'Small Intestine', icon: '🌀' },
            { id: 'urinary_bladder', label: 'Urinary Bladder', icon: '💧' },
            { id: 'thymus', label: 'Thymus', icon: '🧫' },
            { id: 'kidney', label: 'Kidneys & Adrenals', icon: '🫘' },
            { id: 'skeletal', label: 'Skeleton & Ribs', icon: '🦴' },
            { id: 'eye', label: 'Eyes', icon: '👁️' },
            { id: 'ureter', label: 'Ureters', icon: '〰️' },
            { id: 'spinal_cord', label: 'Spinal Cord', icon: '🧠' },
            { id: 'pelvis', label: 'Bony Pelvis', icon: '🦴' },
            { id: 'prostate', label: 'Prostate', icon: '♂️' },
            { id: 'skin', label: 'Skin', icon: '🧴' },
            { id: 'knee', label: 'Knees', icon: '🦵' },
            { id: 'uterus', label: 'Uterus', icon: '♀️' },
            { id: 'ovary', label: 'Ovaries', icon: '⚪' },
            { id: 'fallopian_tube', label: 'Uterine Tubes', icon: '↔️' },
            { id: 'placenta', label: 'Placenta', icon: '🫧' },
            { id: 'snakebite', label: 'Snakebite Wound', icon: '🐍' },
          ].map((item) => {
            const isActive =
              item.id === 'full'
                ? !isolatedPartId && !selectedOrganId
                : isolatedPartId === item.id || selectedOrganId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'full') {
                    setIsolatedPartId(null);
                    setSelectedOrganId(null);
                    setContextOrganId(null);
                    setCameraPreset('anterior');
                    return;
                  }
                  if (isolatedPartId === item.id) {
                    // Toggle off back to full body
                    setIsolatedPartId(null);
                    setSelectedOrganId(null);
                    setContextOrganId(null);
                    setCameraPreset('anterior');
                    return;
                  }
                  // Source-backed organs with dedicated HRA models open directly
                  // in their verified HRA overview instead of relying on a broad
                  // BodyParts3D abdomen bucket.
                  const directHraOverview: Record<string, string> = {
                    small_intestine: 'hra_small_intestine_overview',
                    urinary_bladder: 'hra_bladder_overview',
                    thymus: 'hra_thymus_overview',
                    eye: 'hra_eye_overview',
                    ureter: 'hra_ureter_overview',
                    spinal_cord: 'hra_spinal_cord_overview',
                    pelvis: 'hra_pelvis_overview',
                    prostate: 'hra_prostate_overview',
                    skin: 'hra_skin_overview',
                    knee: 'hra_knee_overview',
                    uterus: 'hra_uterus_overview',
                    ovary: 'hra_ovary_overview',
                    fallopian_tube: 'hra_fallopian_overview',
                    placenta: 'hra_placenta_overview',
                  };
                  setIsolatedPartId(directHraOverview[item.id] || item.id);
                  setSelectedOrganId(item.id);
                  setContextOrganId(null);

                  if (item.id === 'brain' || item.id === 'eye') setCameraPreset('head');
                  else if (item.id === 'heart' || item.id === 'lungs' || item.id === 'thymus') setCameraPreset('thorax');
                  else if (
                    item.id === 'abdomen' ||
                    item.id === 'liver' ||
                    item.id === 'kidney' ||
                    item.id === 'stomach' ||
                    item.id === 'pancreas' ||
                    item.id === 'spleen' ||
                    item.id === 'small_intestine' ||
                    item.id === 'urinary_bladder' ||
                    item.id === 'thymus' ||
                    item.id === 'ureter' ||
                    item.id === 'pelvis' ||
                    item.id === 'prostate' ||
                    item.id === 'uterus' ||
                    item.id === 'ovary' ||
                    item.id === 'fallopian_tube' ||
                    item.id === 'placenta'
                  )
                    setCameraPreset('abdomen');
                  else setCameraPreset('anterior');
                }}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer ${
                  isActive
                    ? isLight
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                    : isLight
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Internal heart — source-derived BodyParts3D structures only.
            This exposes the chambers, valves and papillary muscles that were
            already in the atlas but previously buried behind the generic heart isolate. */}
        {(
          isolatedPartId === 'heart' ||
          contextOrganId === 'heart' ||
          [
            'Cavity of right atrium',
            'Cavity of left atrium',
            'Cavity of right ventricle',
            'Cavity of left ventricle',
            'tricuspid valve',
            'mitral valve',
            'aortic valve',
            'pulmonary valve',
            'papillary muscle',
            'hra_interventricular_septum',
          ].includes(isolatedPartId || '') ||
          isHraHeartTarget(isolatedPartId)
        ) && (
          <div
            className={`px-2.5 py-2 rounded-2xl border flex items-center gap-2 overflow-x-auto no-scrollbar ${isLight
              ? 'bg-rose-50/80 border-rose-200/80'
              : 'bg-rose-950/20 border-rose-900/50'}`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 whitespace-nowrap px-1">
              Internal heart:
            </span>
            {[
              ['heart', 'External'],
              ['Cavity of right atrium', 'RA'],
              ['Cavity of left atrium', 'LA'],
              ['Cavity of right ventricle', 'RV'],
              ['Cavity of left ventricle', 'LV'],
              ['tricuspid valve', 'Tricuspid'],
              ['mitral valve', 'Mitral'],
              ['aortic valve', 'Aortic'],
              ['pulmonary valve', 'Pulmonary'],
              ['papillary muscle', 'Papillary'],
              ['hra_heart_overview', 'HRA cutaway'],
              ['hra_interventricular_septum', 'IV septum · HRA'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => {
                  setIsolatedPartId(id);
                  setSelectedOrganId(id === 'heart' ? 'heart' : null);
                  setContextOrganId(
                    id === 'heart' || id === 'hra_interventricular_septum'
                      ? null
                      : 'heart'
                  );
                  setCameraPreset('thorax');
                  setMobileTab('3d');
                }}
                className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 border transition-all active:scale-95 ${isolatedPartId === id
                  ? isLight
                    ? 'bg-rose-600 border-rose-700 text-white shadow-sm'
                    : 'bg-rose-400 border-rose-300 text-slate-950 shadow-sm'
                  : isLight
                  ? 'bg-white border-rose-200 text-rose-900'
                  : 'bg-slate-900 border-rose-800 text-rose-200'}`}
              >
                {label}
              </button>
            ))}
            <span
              className={`min-h-[44px] px-3 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap flex items-center border ${isLight
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-amber-950/50 border-amber-800 text-amber-200'}`}
              title="These structures are not represented as independent source meshes in the current atlas."
            >
              Source gaps: chordae • interatrial septum • conduction system
            </span>
          </div>
        )}

        {isHraHeartTarget(isolatedPartId) && (
          <div
            className={`px-2.5 py-2 rounded-2xl border flex items-center gap-2 overflow-x-auto no-scrollbar ${isLight
              ? 'bg-fuchsia-50/80 border-fuchsia-200/80'
              : 'bg-fuchsia-950/20 border-fuchsia-900/50'}`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300 whitespace-nowrap px-1">
              HRA reference:
            </span>
            {HRA_HEART_TARGETS.map((target) => (
              <button
                key={target.id}
                onClick={() => {
                  setIsolatedPartId(target.id);
                  setSelectedOrganId(null);
                  setContextOrganId(null);
                  setCameraPreset('thorax');
                  setMobileTab('3d');
                }}
                className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 border transition-all active:scale-95 ${isolatedPartId === target.id
                  ? isLight
                    ? 'bg-fuchsia-600 border-fuchsia-700 text-white shadow-sm'
                    : 'bg-fuchsia-400 border-fuchsia-300 text-slate-950 shadow-sm'
                  : isLight
                  ? 'bg-white border-fuchsia-200 text-fuchsia-900'
                  : 'bg-slate-900 border-fuchsia-800 text-fuchsia-200'}`}
                title={target.label}
              >
                {target.shortLabel}
              </button>
            ))}
            <span
              className={`min-h-[44px] px-3 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap flex items-center border ${isLight
                ? 'bg-white border-fuchsia-200 text-fuchsia-900'
                : 'bg-slate-900 border-fuchsia-800 text-fuchsia-200'}`}
            >
              HuBMAP HRA male v1.3 · same-source cutaway
            </span>
          </div>
        )}

        {/* Multi-organ HRA reference strip. This is source-driven: only
            structures verified in the official HRA GLBs appear here. */}
        {(() => {
          const activeHraTarget = getHraOrganTarget(isolatedPartId);
          const sourceOrganKey =
            activeHraTarget?.organKey ||
            contextOrganId ||
            isolatedPartId ||
            selectedOrganId;
          const targets = getHraTargetsForOrgan(sourceOrganKey);
          if (!targets.length) return null;
          const referenceSex = getHraReferenceSexForOrgan(sourceOrganKey);

          return (
            <div
              className={`px-2.5 py-2 rounded-2xl border flex items-center gap-2 overflow-x-auto no-scrollbar ${isLight
                ? 'bg-violet-50/80 border-violet-200/80'
                : 'bg-violet-950/20 border-violet-900/50'}`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-300 whitespace-nowrap px-1">
                HRA reference:
              </span>
              {targets.map((target) => (
                <button
                  key={target.id}
                  onClick={() => {
                    setIsolatedPartId(target.id);
                    setSelectedOrganId(null);
                    setContextOrganId(null);
                    setCameraPreset(
                      target.organKey === 'lungs' || target.organKey === 'aorta'
                        ? 'thorax'
                        : target.organKey === 'brain'
                        ? 'head'
                        : 'abdomen'
                    );
                    setMobileTab('3d');
                  }}
                  className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 border transition-all active:scale-95 ${isolatedPartId === target.id
                    ? isLight
                      ? 'bg-violet-600 border-violet-700 text-white shadow-sm'
                      : 'bg-violet-400 border-violet-300 text-slate-950 shadow-sm'
                    : isLight
                    ? 'bg-white border-violet-200 text-violet-900'
                    : 'bg-slate-900 border-violet-800 text-violet-200'}`}
                  title={target.label}
                >
                  {target.shortLabel}
                </button>
              ))}
              <span
                className={`min-h-[44px] px-3 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap flex items-center border ${isLight
                  ? 'bg-white border-violet-200 text-violet-900'
                  : 'bg-slate-900 border-violet-800 text-violet-200'}`}
              >
                HuBMAP HRA {referenceSex === 'female' ? 'female' : referenceSex === 'mixed' ? 'mixed-reference' : 'male'} v1.3 · source-derived
              </span>
            </div>
          );
        })()}

        {/* Z-Anatomy reference strip for structures not covered well by HRA. */}
        {(() => {
          const activeZTarget = getZAnatomyReferenceTarget(isolatedPartId);
          const sourceOrganKey =
            activeZTarget?.organKey ||
            contextOrganId ||
            isolatedPartId ||
            selectedOrganId;
          const targets = getZAnatomyTargetsForOrgan(sourceOrganKey);
          if (!targets.length) return null;

          return (
            <div
              className={`px-2.5 py-2 rounded-2xl border flex items-center gap-2 overflow-x-auto no-scrollbar ${isLight
                ? 'bg-teal-50/80 border-teal-200/80'
                : 'bg-teal-950/20 border-teal-900/50'}`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300 whitespace-nowrap px-1">
                Z-Anatomy:
              </span>
              {targets.map((target) => (
                <button
                  key={target.id}
                  onClick={() => {
                    setIsolatedPartId(target.id);
                    setSelectedOrganId(null);
                    setContextOrganId(null);
                    setCameraPreset(
                      target.organKey === 'brain'
                        ? 'head'
                        : target.organKey === 'stomach'
                        ? 'abdomen'
                        : 'anterior'
                    );
                    setMobileTab('3d');
                  }}
                  className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 border transition-all active:scale-95 ${isolatedPartId === target.id
                    ? isLight
                      ? 'bg-teal-600 border-teal-700 text-white shadow-sm'
                      : 'bg-teal-400 border-teal-300 text-slate-950 shadow-sm'
                    : isLight
                    ? 'bg-white border-teal-200 text-teal-900'
                    : 'bg-slate-900 border-teal-800 text-teal-200'}`}
                  title={target.label}
                >
                  {target.shortLabel}
                </button>
              ))}
              <span
                className={`min-h-[44px] px-3 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap flex items-center border ${isLight
                  ? 'bg-white border-teal-200 text-teal-900'
                  : 'bg-slate-900 border-teal-800 text-teal-200'}`}
              >
                Source-derived · CC BY-SA 4.0
              </span>
            </div>
          );
        })()}

        {/* Major named nerves — compact, horizontal and thumb-friendly on mobile.
            The actual 3D layer is still lazy-loaded only after one of these is used. */}
        {(isolatedPartId === 'peripheral_nerves' || isPeripheralNerveTarget(isolatedPartId)) && (
          <div
            className={`px-2.5 py-2 rounded-2xl border flex items-center gap-2 overflow-x-auto no-scrollbar ${isLight
              ? 'bg-amber-50/80 border-amber-200/80'
              : 'bg-amber-950/20 border-amber-900/50'}`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 whitespace-nowrap px-1">
              Major nerves:
            </span>
            {[
              ['vagus_nerve', 'Vagus'],
              ['phrenic_nerve', 'Phrenic'],
              ['brachial_plexus', 'Brachial plexus'],
              ['axillary_nerve', 'Axillary'],
              ['median_nerve', 'Median'],
              ['ulnar_nerve', 'Ulnar'],
              ['radial_nerve', 'Radial'],
              ['sciatic_nerve', 'Sciatic'],
              ['femoral_nerve', 'Femoral'],
              ['tibial_nerve', 'Tibial'],
              ['common_fibular_nerve', 'Common fibular'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => {
                  setIsolatedPartId(id);
                  setSelectedOrganId(id);
                  setContextOrganId('peripheral_nerves');
                  setCameraPreset('anterior');
                  setMobileTab('3d');
                }}
                className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 border transition-all ${isolatedPartId === id
                  ? isLight
                    ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                    : 'bg-amber-400 border-amber-300 text-slate-950 shadow-sm'
                  : isLight
                  ? 'bg-white border-amber-200 text-amber-900 active:scale-95'
                  : 'bg-slate-900 border-amber-800 text-amber-200 active:scale-95'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* MOBILE VIEW: Tab-driven clean single stage (Kept permanently mounted to prevent WebGL context destruction) */}
        <div className="lg:hidden flex flex-col space-y-3">
          <div
            data-testid="mobile-anatomy-stage"
            className="flex flex-col space-y-2 w-full"
            style={{ display: mobileTab === '3d' ? 'flex' : 'none' }}
          >
            <DissectionToolbar
              toolMode={toolMode}
              onSelectToolMode={handleSelectToolMode}
              isXray={isXray}
              onToggleXray={() => setIsXray(!isXray)}
              layerPeel={layerPeel}
              onChangeLayerPeel={setLayerPeel}
              dissectedParts={dissectedParts}
              onRestorePart={handleRestorePart}
              onUndoLastDissect={handleUndoLastDissect}
              onRestoreAll={handleRestoreAll}
              theme={theme}
            />
            {/* The stage was a flat `h-[420px]`: the same box on a 640pt phone,
                where it overflows under the fold, and on an 844pt one, where a
                third of the screen goes unused. `dvh` rather than `vh` because
                mobile `vh` counts the URL bar that is not there, so the canvas
                was taller than the space it had. The floor keeps it usable on a
                small screen and in landscape. */}
            <div
              className="w-full relative"
              style={{ height: 'max(340px, min(66dvh, 560px))' }}
            >
              {isolatedPartId && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-amber-300 dark:border-amber-700 shadow-md pointer-events-auto touch-auto whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    Isolated: {isolatedPartId.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <button
                    onClick={() => setSelectedOrganId(isolatedPartId)}
                    className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200 cursor-pointer"
                    title="Open clinical anatomy dossier"
                  >
                    📖 Dossier
                  </button>
                  <button
                    onClick={() => {
                      setIsolatedPartId(null);
                      setContextOrganId(null);
                      setSelectedOrganId(null);
                    }}
                    className="ml-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 cursor-pointer"
                  >
                    Restore
                  </button>
                </div>
              )}
              {!isDesktopLayout && (
                <AnatomicalBody3D
                  vitals={vitals}
                  pathology={pathology}
                  layer={activeLayer}
                  scenarioId={currentScenarioId}
                  cameraPreset={cameraPreset}
                  theme={theme}
                  selectedOrganId={selectedOrganId}
                  contextOrganId={contextOrganId}
                  onSelectOrganId={handleSelect3DOrgan}
                  toolMode={toolMode}
                  isXray={isXray}
                  layerPeel={layerPeel}
                  hiddenPartIds={hiddenPartIds}
                  isolatedPartId={isolatedPartId}
                  onDissectPart={handleDissectPart}
                />
              )}
            </div>
          </div>

          <div
            data-testid="mobile-monitor-stage"
            className="w-full pb-2"
            style={{
              display: mobileTab === 'telemetry' ? 'block' : 'none',
              height: 'max(500px, min(72dvh, 620px))',
            }}
          >
            <IcuMonitor
              vitals={vitals}
              sampleWaveforms={handleSampleWaveforms}
              ecgRhythm={pathology.ecgRhythm}
              theme={theme}
            />
          </div>
        </div>

        {/* Bottom Panel: Interventions, Diagnostics & Case Scenarios */}
        {/* On desktop: always visible. On mobile: visible when interventions tab is selected OR under 3D stage */}
        <div className={`w-full ${mobileTab === 'interventions' ? 'block' : 'hidden lg:block'}`}>
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
        isolatedPartId={isolatedPartId}
        onClose={() => {
          // Close drawer but PRESERVE isolatedPartId in 3D viewport
          setSelectedOrganId(null);
        }}
        onFocusCamera={(preset) => setCameraPreset(preset)}
        onSelectOrgan={(newOrganId) => setSelectedOrganId(newOrganId)}
        onIsolateStructure={(structureId, parentOrganId) => {
          setIsolatedPartId(structureId);
          setContextOrganId(parentOrganId || null);
        }}
        onDissectOrgan={(organKey) => {
          const fakePart: Part = {
            id: organKey,
            name: organKey.charAt(0).toUpperCase() + organKey.slice(1),
            system: 'viscera' as any,
            bounds: [[0, 0, 0], [0, 0, 0]],
            vertexCount: 0,
            indexCount: 0,
            vertices: 0,
            indices: 0,
          };
          setHiddenPartIds((prev) => (prev.includes(organKey) ? prev : [...prev, organKey]));
          setDissectedParts((prev) => (prev.some((p) => p.id === organKey) ? prev : [...prev, fakePart]));
          setLogs((prev) => [...prev, `✂️ Dissected structure: ${fakePart.name} — Underlying planes exposed.`]);
        }}
        theme={theme}
      />

      {/* 5. Diagnostic Modal Tool (Pupil, Ultrasound POCUS, Stethoscope, 12-Lead ECG) */}
      <DiagnosticTools
        tool={activeTool}
        pathology={pathology}
        vitals={vitals}
        onClose={() => setActiveTool('none')}
      />

      {/* 6. Bedside Ward Examination Modal (PICCLED: Pitting Edema, Scleral Icterus, Pallor, Cyanosis, Ascites) */}
      <WardExamModal
        isOpen={activeTool === 'piccled'}
        onClose={() => setActiveTool('none')}
        vitals={vitals}
        pathology={pathology}
        theme={theme}
      />
    </div>
  );
};

export default Simulator;
