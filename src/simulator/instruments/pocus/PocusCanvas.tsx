/**
 * PocusCanvas.tsx
 * Publication-Grade 60fps Dynamic Point-of-Care Ultrasound (POCUS) Component
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const [caliperActive, setCaliperActive] = useState<boolean>(false);

  // Initialize engine singleton
  if (!engineRef.current) {
    engineRef.current = new PocusSimulationEngine();
  }

  // 60fps Animation Loop
  useEffect(() => {
    let animId: number;
    let startTime = performance.now();

    const loop = (currentTime: number) => {
      animId = requestAnimationFrame(loop);

      const canvas = canvasRef.current;
      if (!canvas || !engineRef.current) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Only advance time if not frozen
      const elapsedSec = settings.isFrozen
        ? 0
        : (currentTime - startTime) / 1000;

      engineRef.current.render(
        ctx,
        w,
        h,
        elapsedSec,
        vitals,
        pathology,
        settings
      );

      ctx.restore();
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [vitals, pathology, settings]);

  // Handle Canvas Click for Caliper Measurement
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!caliperActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

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
        <div className="-mx-1 px-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
              setSettings((prev) => ({ ...prev, showMMode: !prev.showMMode }))
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
          {(settings.viewMode === 'cardiac_plax' || settings.viewMode === 'subxiphoid') && (
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
        </div>
      </div>

      {/* 2. CRT Ultrasound Machine Bezel & Screen */}
      <div className="relative bg-[#020408] rounded-2xl overflow-hidden border border-slate-800 p-2 shadow-2xl flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className={`w-full rounded-xl h-[46dvh] min-h-[300px] max-h-[420px] md:h-[380px] md:min-h-0 md:max-h-none select-none ${
            caliperActive ? 'cursor-crosshair' : 'cursor-default'
          }`}
          style={{ imageRendering: 'pixelated' }}
        />

        {caliperActive && !settings.caliperPointB && (
          <div className="absolute bottom-4 left-4 bg-black/80 border border-sky-400 text-sky-300 text-[10px] font-mono px-2.5 py-1 rounded-lg backdrop-blur-xs pointer-events-none">
            {settings.caliperPointA ? 'Click Point 2 to calculate distance' : 'Click Point 1 to place caliper'}
          </div>
        )}
      </div>

      {/* 3. Machine Gain & Depth Knobs */}
      <div className="grid grid-cols-1 sm:flex sm:items-center sm:justify-between bg-slate-950 px-3 md:px-4 py-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 gap-2 sm:gap-3">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
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
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-cyan-400 min-w-[32px]">
              {Math.round(settings.gain * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">DEPTH:</span>
            <input
              type="range"
              min="8"
              max="22"
              step="2"
              value={settings.depthCm}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, depthCm: parseInt(e.target.value, 10) }))
              }
              className="w-24 accent-cyan-400 cursor-pointer"
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

      {/* 4. Sonographic Interpretation Dossier */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="font-bold text-cyan-400 flex items-center gap-1.5">
          <Radio className="w-4 h-4" />
          <span>Sonographic Interpretation & Biophysical Findings:</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-200">
          {settings.viewMode === 'cardiac_plax' &&
            (vitals.cvp > 10
              ? 'Parasternal Long Axis (PLAX): Significant circumferential anechoic fluid stripe separating parietal pericardium from epicardium. Diastolic right ventricular anterior wall indentation/collapse confirms cardiac tamponade physiology.'
              : 'Parasternal Long Axis (PLAX): Normal Left Ventricular chamber geometry and systolic radial thickening (+35%). Anterior mitral leaflet (AML) exhibits normal rapid diastolic excursion approaching the interventricular septum (EPSS < 7mm). Aortic valve leaflets demonstrate boxcar systolic excursion.')}

          {settings.viewMode === 'subxiphoid' &&
            (vitals.cvp > 10
              ? 'Subxiphoid 4-Chamber: Severe pericardial effusion with anechoic jet-black fluid space enveloping right and left ventricles. Right ventricular free wall displays classic early diastolic collapse when intrapericardial pressure exceeds intracavitary pressure.'
              : 'Subxiphoid 4-Chamber: Liver acoustic window provides clear visualization of 4 cardiac chambers. Coordinated biventricular contractility intact; no pericardial fluid collection.')}

          {settings.viewMode === 'fast_morison' &&
            (pathology.ascites > 0.25 || vitals.lactate > 2.5
              ? 'eFAST Morison\'s Pouch: Pathognomonic anechoic (black) fluid stripe detected in the dependent hepatorenal recess between the liver tip and right kidney. Confirms acute hemoperitoneum or decompensated free abdominal fluid.'
              : 'eFAST Morison\'s Pouch: Intact reflective hyperechoic hepatorenal interface with smooth corticomedullary architecture. Normal physiological diaphragmatic respiratory excursion with zero dependent fluid.')}

          {settings.viewMode === 'lung' &&
            (vitals.spo2 < 82 && vitals.cvp > 12
              ? 'Lung Ultrasound (LUS): Complete abolition of pleural sliding motion. M-mode trace demonstrates the pathognomonic "Stratosphere / Barcode Sign" (parallel static horizontal lines throughout the depth), establishing acute tension pneumothorax.'
              : pathology.lungSoundType === 'crackles'
              ? 'Lung Ultrasound (LUS): Multiple vertical laser-like hyperechoic reverberation artifacts ("B-lines" / "Lung Rockets") projecting from the pleural line to the sector base, indicative of alveolar pulmonary edema or interstitial syndrome.'
              : 'Lung Ultrasound (LUS): Intact hyperechoic pleural sliding with horizontal reverberation "A-lines". M-mode trace confirms normal physiological "Seashore Sign" (granular sandy texture below the pleural line).')}
        </p>
      </div>
    </div>
  );
};
