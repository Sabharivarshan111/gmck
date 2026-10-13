/**
 * InteractiveCardiacEngineMaster.tsx
 * Cohesive Master Controller binding Continuous Wiggers, PV Loop,
 * Anatomical Cross-Section, and Conduction/Dipole Engines.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Sliders, Activity, Heart, Zap } from 'lucide-react';
import { CardiacCycleEngine, CardiacParams } from './CardiacCyclePhysics';
import { WiggersPvLoopCanvas } from './WiggersPvLoopCanvas';
import { CardiacAnatomyCanvas } from './CardiacAnatomyCanvas';
import { CardiacConductionCanvas } from './CardiacConductionCanvas';

export const InteractiveCardiacEngineMaster: React.FC<{ isLight?: boolean }> = ({ isLight = false }) => {
  const [params, setParams] = useState<CardiacParams>({
    heartRate: 75,
    contractility: 1.0,
    afterload: 1.0,
    preload: 1.0,
    aorticStenosis: false,
    mitralRegurgitation: false,
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentPhi, setCurrentPhi] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'hemodynamics' | 'anatomy' | 'electrophysiology'>('anatomy');

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setReducedMotion(media.matches); if (media.matches) setIsPlaying(false); };
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const engine = useMemo(() => new CardiacCycleEngine(params), [params]);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Cap teaching playback at 30fps; paused lessons do not schedule frames.
  useEffect(() => {
    if (!isPlaying) return;
    lastTimeRef.current = performance.now();
    const loop = (now: number) => {
      if (isPlaying && now - lastTimeRef.current >= 1000 / 30) {
        const deltaMs = Math.min(now - lastTimeRef.current, 100);
        const cycleDurationMs = engine.getCycleDurationMs();
        setCurrentPhi((prev) => (prev + deltaMs / cycleDurationMs) % 1.0);
        lastTimeRef.current = now;
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, engine]);

  const currentData = engine.evaluate(currentPhi);

  // Pathology Preset Loader
  const loadPreset = (presetName: string) => {
    switch (presetName) {
      case 'normal':
        setParams({ heartRate: 75, contractility: 1.0, afterload: 1.0, preload: 1.0, aorticStenosis: false, mitralRegurgitation: false });
        break;
      case 'as':
        setParams({ heartRate: 75, contractility: 1.3, afterload: 1.0, preload: 1.0, aorticStenosis: true, mitralRegurgitation: false });
        break;
      case 'mr':
        setParams({ heartRate: 85, contractility: 1.1, afterload: 0.9, preload: 1.3, aorticStenosis: false, mitralRegurgitation: true });
        break;
      case 'hfref':
        setParams({ heartRate: 95, contractility: 0.55, afterload: 1.3, preload: 1.4, aorticStenosis: false, mitralRegurgitation: false });
        break;
      case 'htn':
        setParams({ heartRate: 78, contractility: 1.2, afterload: 1.6, preload: 1.1, aorticStenosis: false, mitralRegurgitation: false });
        break;
      case 'tachy':
        setParams({ heartRate: 140, contractility: 1.2, afterload: 1.0, preload: 0.85, aorticStenosis: false, mitralRegurgitation: false });
        break;
    }
  };

  return (
    <div className={`p-3 sm:p-5 rounded-2xl border transition-all ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800 shadow-2xl'}`}>
      {/* Header & Subsystem Switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-black">
              🫀
            </div>
            <h3 className="text-base font-black tracking-tight text-slate-900 sim-dark:text-slate-100">
              Cardiac cycle explorer
            </h3>
          </div>
          <p className="text-xs text-slate-500 sim-dark:text-slate-400 mt-0.5">
            Phase: <strong className="text-rose-500">{currentData.phaseName}</strong> | Cycle Time: <span className="font-mono">{Math.round(currentData.tMs)} ms</span> ({Math.round(currentPhi * 100)}%)
          </p>
        </div>

        {/* System Tab Toggles */}
        <div className="w-full min-w-0 grid grid-cols-1 sm:flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 sim-dark:bg-slate-950 border border-slate-200 sim-dark:border-slate-800">
          <button
            onClick={() => setActiveTab('hemodynamics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'hemodynamics' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Pressure & volume
          </button>
          <button
            onClick={() => setActiveTab('anatomy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'anatomy' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Heart & valves
          </button>
          <button
            onClick={() => setActiveTab('electrophysiology')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'electrophysiology' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Electrical activity
          </button>
        </div>
      </div>

      {/* Primary Simulation Canvas Display */}
      <div className="mb-5">
        {activeTab === 'hemodynamics' && (
          <WiggersPvLoopCanvas engine={engine} currentPhi={currentPhi} isLight={isLight} />
        )}
        {activeTab === 'anatomy' && (
          <CardiacAnatomyCanvas engine={engine} currentPhi={currentPhi} isLight={isLight} />
        )}
        {activeTab === 'electrophysiology' && (
          <CardiacConductionCanvas engine={engine} currentPhi={currentPhi} isLight={isLight} />
        )}
      </div>

      {/* Cockpit Interactive Controls & Pathology Presets */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        {/* Playback Scrub Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 text-slate-100 hover:bg-slate-700 transition-all cursor-pointer"
            disabled={reducedMotion}
            aria-label={isPlaying ? 'Pause cardiac cycle' : 'Play cardiac cycle'}
            title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={() => {
              setCurrentPhi(0);
              lastTimeRef.current = performance.now();
            }}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 text-slate-100 hover:bg-slate-700 transition-all cursor-pointer"
            aria-label="Reset cardiac cycle"
            title="Reset to Atrial Systole (t=0)"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
          </button>

          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>0 ms</span>
              <span>{Math.round(currentData.tMs)} ms</span>
              <span>{Math.round(engine.getCycleDurationMs())} ms / cycle</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.005"
              aria-label="Cardiac cycle position"
              value={currentPhi}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentPhi(parseFloat(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>
        </div>

        {/* Sliders: HR, Inotropy, Afterload, Preload */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div>
            <div className="flex flex-wrap gap-1 justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>Heart Rate:</span>
              <strong className="text-emerald-400">{params.heartRate} bpm</strong>
            </div>
            <input
              type="range"
              min="40"
              max="160"
              aria-label="Teaching heart rate"
              value={params.heartRate}
              onChange={(e) => setParams({ ...params, heartRate: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex flex-wrap gap-1 justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>Contractility (Ees):</span>
              <strong className="text-purple-400">{params.contractility.toFixed(1)}x</strong>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              aria-label="Teaching contractility"
              value={params.contractility}
              onChange={(e) => setParams({ ...params, contractility: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          <div>
            <div className="flex flex-wrap gap-1 justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>Afterload (SVR):</span>
              <strong className="text-amber-400">{params.afterload.toFixed(1)}x</strong>
            </div>
            <input
              type="range"
              min="0.6"
              max="2.0"
              step="0.1"
              aria-label="Teaching afterload"
              value={params.afterload}
              onChange={(e) => setParams({ ...params, afterload: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div>
            <div className="flex flex-wrap gap-1 justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>Preload (EDV):</span>
              <strong className="text-cyan-400">{params.preload.toFixed(1)}x</strong>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.1"
              aria-label="Teaching preload"
              value={params.preload}
              onChange={(e) => setParams({ ...params, preload: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        </div>

        {/* Pathology Preset Quick Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-mono text-slate-400 mr-2 flex items-center gap-1">
            <Sliders className="w-3 h-3" /> Presets:
          </span>
          {[
            { id: 'normal', label: '1. Normal Sinus' },
            { id: 'as', label: '2. Aortic Stenosis (Gradient)' },
            { id: 'mr', label: '3. Mitral Regurgitation (V-Wave)' },
            { id: 'hfref', label: '4. Reduced contractility' },
            { id: 'htn', label: '5. Severe Hypertension' },
            { id: 'tachy', label: '6. Tachycardia (140 bpm)' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset.id)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
