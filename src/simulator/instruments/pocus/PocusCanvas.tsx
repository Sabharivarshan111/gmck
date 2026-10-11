/**
 * PocusCanvas.tsx
 * Publication-Grade 60fps Dynamic Point-of-Care Ultrasound (POCUS) Component
 */

import React, { useEffect, useRef, useState } from 'react';
import { PocusReference } from './PocusReference';
import { PatientPathologyState, PatientVitals } from '../../types';
import {
  PocusSimulationEngine,
  PocusSettings,
  PocusViewMode,
  DEFAULT_POCUS_SETTINGS,
} from './PocusEngineCore';
import {
  Radio,
  Sliders,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  Layers,
  Activity,
  Play,
  Pause,
  Ruler,
} from 'lucide-react';

interface PocusCanvasProps {
  vitals: PatientVitals;
  pathology: PatientPathologyState;
  theme?: 'light' | 'dark';
}

export const PocusCanvas: React.FC<PocusCanvasProps> = ({
  vitals,
  pathology,
  theme = 'dark',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<PocusSimulationEngine | null>(null);

  const [settings, setSettings] = useState<PocusSettings>(DEFAULT_POCUS_SETTINGS);
  const [referenceMode, setReferenceMode] = useState(false);
  const [caliperActive, setCaliperActive] = useState<boolean>(false);

  // Initialize engine singleton
  if (!engineRef.current) {
    engineRef.current = new PocusSimulationEngine();
  }

  const timeRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);

  // Freeze holds the current cine phase, including after a setting changes.
  useEffect(() => {
    if (referenceMode) { lastFrameRef.current = null; return; }
    let animId = 0;
    let lastDraw = -Infinity;
    const loop = (now: number) => {
      if (!settings.isFrozen) animId = requestAnimationFrame(loop);
      if (now - lastDraw < 1000 / 30) return;
      lastDraw = now;
      if (!settings.isFrozen && lastFrameRef.current !== null) {
        timeRef.current += Math.min(0.1, (now - lastFrameRef.current) / 1000);
      }
      lastFrameRef.current = settings.isFrozen ? null : now;
      const canvas = canvasRef.current;
      if (!canvas || !engineRef.current) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // Scan texture is intentionally rendered at CSS resolution on mobile.
      const w = Math.round(canvas.clientWidth);
      const h = Math.round(canvas.clientHeight);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      engineRef.current.render(ctx, w, h, timeRef.current, vitals, pathology, settings);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [vitals, pathology, settings, referenceMode]);

  // Handle Canvas Click for Caliper Measurement
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!caliperActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    // The sector depth is calibrated in CSS pixels; reject points outside it.
    const ox = rect.width * (settings.showMMode ? 0.32 : 0.47);
    const dy = clickY - 22;
    const dx = clickX - ox;
    const radius = rect.height - 44;
    const inField = settings.viewMode === 'lung'
      ? Math.abs(dx) < rect.width * (settings.showMMode ? 0.25 : 0.40) && dy >= 0 && dy <= radius
      : dy >= 0 && Math.hypot(dx, dy) <= radius && Math.abs(Math.atan2(dx, dy)) <= Math.PI * 0.22;
    if (!inField) return;

    if (!settings.caliperPointA || (settings.caliperPointA && settings.caliperPointB)) {
      // Set Point A
      setSettings((prev) => ({
        ...prev,
        caliperPointA: { x: clickX, y: clickY },
        caliperPointB: null,
      }));
    } else {
      // Set Point B
      setSettings((prev) => ({
        ...prev,
        caliperPointB: { x: clickX, y: clickY },
      }));
    }
  };

  const clearCalipers = () => {
    setSettings((prev) => ({
      ...prev,
      caliperPointA: null,
      caliperPointB: null,
    }));
    setCaliperActive(false);
  };

  return (
    <div className="space-y-2.5 md:space-y-3.5">
      <div className="grid grid-cols-2 gap-2">
        {[false, true].map(reference => <button key={String(reference)} aria-pressed={referenceMode === reference}
          onClick={() => setReferenceMode(reference)}
          className={`min-h-[44px] rounded-xl px-3 text-xs font-bold border ${referenceMode === reference ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>
          {reference ? 'Reference scans' : 'Case simulation'}
        </button>)}
      </div>
      {/* 1. Transducer Probe & View Preset Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="-mx-1 px-1 flex items-stretch gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'cardiac_plax', label: '🫀 Parasternal Long (PLAX)', sub: 'Phase Array 2.5MHz' },
            { id: 'subxiphoid', label: '🛡️ Subxiphoid 4-Chamber', sub: 'Tamponade / RV Collapse' },
            { id: 'fast_morison', label: '🩻 eFAST Morison\'s Pouch', sub: 'Curved 3.5MHz (Fluid)' },
            { id: 'lung', label: '🫁 Lung Ultrasound (LUS)', sub: 'Linear 8MHz (Sliding/M-Mode)' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  viewMode: v.id as PocusViewMode,
                  showMMode: false,
                  showColorDoppler: false,
                  caliperPointA: null,
                  caliperPointB: null,
                }))
              }
              className={`min-h-[44px] shrink-0 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-bold border transition-all cursor-pointer text-left ${
                settings.viewMode === v.id
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md font-black'
                  : 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 text-slate-400'
              }`}
            >
              <div>{v.label}</div>
              <div className="text-[9px] opacity-70 font-normal">{v.sub}</div>
            </button>
          ))}
        </div>

        {/* Action Controls: Freeze, M-Mode, Caliper */}
        {!referenceMode && <div className="-mx-1 px-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* Live / Freeze */}
          <button
            onClick={() =>
              setSettings((prev) => ({ ...prev, isFrozen: !prev.isFrozen }))
            }
            className={`min-h-[44px] shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              settings.isFrozen
                ? 'bg-red-500/20 text-red-300 border-red-500'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
            }`}
          >
            {settings.isFrozen ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{settings.isFrozen ? 'Unfreeze' : 'Freeze'}</span>
          </button>

          {/* M-Mode Toggle */}
          <button
            onClick={() =>
              setSettings((prev) => ({ ...prev, showMMode: !prev.showMMode, caliperPointA: null, caliperPointB: null }))
            }
            className={`min-h-[44px] shrink-0 px-2.5 rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              settings.showMMode
                ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>M-Mode</span>
          </button>

          {/* Color Doppler (Cardiac only) */}
          {settings.viewMode === 'cardiac_plax' && (
            <button
              onClick={() =>
                setSettings((prev) => ({ ...prev, showColorDoppler: !prev.showColorDoppler }))
              }
              className={`min-h-[44px] shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                settings.showColorDoppler
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Doppler
            </button>
          )}

          {/* Electronic Caliper */}
          <button
            onClick={() => {
              if (caliperActive) {
                clearCalipers();
              } else {
                setCaliperActive(true);
              }
            }}
            className={`min-h-[44px] shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              caliperActive
                ? 'bg-sky-400 text-slate-950 border-sky-300 font-black'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>{caliperActive ? 'Reset Caliper' : 'Caliper'}</span>
          </button>
        </div>}
      </div>

      {referenceMode ? <PocusReference key={settings.viewMode} view={settings.viewMode} /> : <>
      {/* 2. CRT Ultrasound Machine Bezel & Screen */}
      <div className="relative bg-[#020408] rounded-2xl overflow-hidden border border-slate-800 p-2 shadow-2xl flex items-center justify-center">
        <canvas
          data-testid="pocus-canvas"
          aria-label="Synthetic ultrasound teaching scan"
          ref={canvasRef}
          onClick={handleCanvasClick}
          className={`w-full rounded-xl h-[46dvh] min-h-[300px] max-h-[420px] md:h-[380px] md:min-h-0 md:max-h-none select-none ${
            caliperActive ? 'cursor-crosshair' : 'cursor-default'
          }`}
        />

        {caliperActive && !settings.caliperPointB && (
          <div className="absolute bottom-4 left-4 bg-black/80 border border-sky-400 text-sky-300 text-[10px] font-mono px-2.5 py-1 rounded-lg backdrop-blur-xs pointer-events-none">
            {settings.caliperPointA ? 'Tap a second point in the scan' : 'Tap a first point in the scan'}
          </div>
        )}
      </div>

      <p className="px-1 text-[11px] text-slate-400 leading-relaxed">
        Synthetic teaching scan · {settings.viewMode === 'fast_morison' ? (pathology.ascites > 0.25 ? 'Free fluid at the hepatorenal recess' : 'No free fluid simulated') : settings.viewMode === 'lung' ? 'Pleural interface and reverberation artifacts' : 'Cardiac chamber and valve motion'}
      </p>

      {/* 3. Machine Gain & Depth Knobs */}
      <div className="grid grid-cols-1 sm:flex sm:items-center sm:justify-between bg-slate-950 px-3 md:px-4 py-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 gap-2 sm:gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <div className="grid grid-cols-[48px_minmax(0,1fr)_48px] items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">GAIN:</span>
            <input
              type="range"
              min="0.5"
              max="1.8"
              step="0.05"
              value={settings.gain}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, gain: parseFloat(e.target.value) }))
              }
              aria-label="Ultrasound gain"
              className="w-full min-w-0 h-11 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-cyan-400 min-w-[32px]">
              {Math.round(settings.gain * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-[48px_minmax(0,1fr)_48px] items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">DEPTH:</span>
            <input
              type="range"
              min="8"
              max="22"
              step="2"
              value={settings.depthCm}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, depthCm: parseInt(e.target.value, 10), caliperPointA: null, caliperPointB: null }))
              }
              aria-label="Ultrasound depth"
              className="w-full min-w-0 h-11 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-cyan-400 min-w-[32px]">
              {settings.depthCm} cm
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Probe: <strong className="text-slate-200">
            {settings.viewMode === 'lung'
              ? 'Linear 8.0 MHz (Superficial)'
              : settings.viewMode === 'fast_morison'
              ? 'Curvilinear 3.5 MHz (Abdominal)'
              : 'Phased Array 2.5 MHz (Cardiac)'}
          </strong>
        </div>
      </div>

      </>}

      {/* 4. Sonographic Interpretation Dossier */}
      <details className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
        <summary className="min-h-[44px] cursor-pointer font-bold text-cyan-400 flex items-center gap-1.5">
          <Radio className="w-4 h-4" />
          <span>Scan guide & limitations</span>
        </summary>
        <p className="text-[11px] leading-relaxed text-slate-200">
          {settings.viewMode === 'fast_morison'
            ? "Look between the liver and right kidney for a dark fluid stripe. Free fluid can have several causes; its appearance alone does not identify blood. This demo uses the case’s ascites setting, not lactate, to show fluid."
            : settings.viewMode === 'lung'
            ? "Compare pleural sliding, horizontal A-lines and vertical B-lines. Absent sliding and a barcode pattern alone do not prove pneumothorax; B-lines are not specific to one disease. This demo selects patterns using simplified case signals."
            : "Identify the ventricular chambers, valve motion and any dark pericardial space. This demo uses simplified case signals to select an effusion pattern; raised CVP alone does not establish effusion or tamponade. Measurements are illustrative, not clinical findings."}
          <a href="https://www.acep.org/sonoguide/basic/fast" target="_blank" rel="noopener noreferrer" className="block min-h-[44px] pt-3 text-cyan-400 underline">Reference: ACEP Sonoguide</a>
        </p>
      </details>
    </div>
  );
};
