/**
 * WiggersPvLoopCanvas.tsx
 * Continuous 60fps Wiggers Diagram (Pressures & Volume) & Pressure-Volume (PV) Loop
 */

import React, { useEffect, useRef } from 'react';
import { CardiacCycleEngine } from './CardiacCyclePhysics';

interface WiggersPvLoopCanvasProps {
  engine: CardiacCycleEngine;
  currentPhi: number;
  isLight?: boolean;
}

export const WiggersPvLoopCanvas: React.FC<WiggersPvLoopCanvasProps> = ({
  engine,
  currentPhi,
  isLight = false,
}) => {
  const wiggersCanvasRef = useRef<HTMLCanvasElement>(null);
  const pvCanvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Render Real-time Wiggers Diagram
  useEffect(() => {
    const canvas = wiggersCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Dark high-contrast clinical oscilloscope theme
    ctx.fillStyle = isLight ? '#f8fafc' : '#030712';
    ctx.fillRect(0, 0, width, height);

    // Padding
    const padL = 45;
    const padR = 20;
    const padT = 25;
    const padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Grid lines (Pressure 0, 40, 80, 120, 160 mmHg)
    ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.25)' : 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';

    const maxPressure = 160;
    for (let p = 0; p <= maxPressure; p += 40) {
      const y = padT + plotH - (p / maxPressure) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillText(`${p}`, padL - 26, y + 3);
    }
    ctx.fillText('mmHg', padL - 32, padT - 8);

    // 7 Phase Vertical Shading & Labels
    const phaseBorders = [0.0, 0.12, 0.18, 0.32, 0.44, 0.52, 0.72, 1.0];
    const phaseNames = ['Atrial', 'Iso-C', 'Rapid-Ej', 'Red-Ej', 'Iso-R', 'Rapid-Fill', 'Diastasis'];

    for (let i = 0; i < phaseBorders.length - 1; i++) {
      const xStart = padL + phaseBorders[i] * plotW;
      const xEnd = padL + phaseBorders[i + 1] * plotW;
      if (i % 2 === 1) {
        ctx.fillStyle = isLight ? 'rgba(241, 245, 249, 0.6)' : 'rgba(15, 23, 42, 0.5)';
        ctx.fillRect(xStart, padT, xEnd - xStart, plotH);
      }
      ctx.fillStyle = isLight ? '#64748b' : '#475569';
      ctx.font = '9px sans-serif';
      ctx.fillText(phaseNames[i], xStart + 2, padT + plotH + 14);
    }

    // Precalculate full-cycle curves (120 sample points)
    const samples = 120;
    const lvpPoints: { x: number; y: number }[] = [];
    const aopPoints: { x: number; y: number }[] = [];
    const lapPoints: { x: number; y: number }[] = [];
    const volPoints: { x: number; y: number }[] = [];

    for (let i = 0; i <= samples; i++) {
      const sPhi = i / samples;
      const data = engine.evaluate(sPhi);
      const x = padL + sPhi * plotW;
      lvpPoints.push({ x, y: padT + plotH - (data.lvPressure / maxPressure) * plotH });
      aopPoints.push({ x, y: padT + plotH - (data.aorticPressure / maxPressure) * plotH });
      lapPoints.push({ x, y: padT + plotH - (data.laPressure / maxPressure) * plotH });
      const normVol = (data.lvVolume - 40) / 120;
      volPoints.push({ x, y: padT + plotH - normVol * (plotH * 0.28) });
    }

    // 1. Draw Left Atrial Pressure (Cyan dashed)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    lapPoints.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw Aortic Pressure (Amber curve with subtle shadow)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    aopPoints.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.stroke();

    // 3. Draw Left Ventricular Pressure (Bright Crimson/Rose bold curve)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    lvpPoints.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.stroke();

    // 4. Draw Ventricular Volume (Emerald trace on lower axis)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    volPoints.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.stroke();

    // 5. Valve Event Markers (C, D, F, A)
    const markerEvents = [
      { phi: 0.12, label: 'C: Mitral Closes', color: '#f43f5e' },
      { phi: 0.18, label: 'D: Aortic Opens', color: '#f59e0b' },
      { phi: 0.44, label: 'F: Aortic Closes (Incisura)', color: '#f59e0b' },
      { phi: 0.52, label: 'A: Mitral Opens', color: '#06b6d4' },
    ];

    markerEvents.forEach((ev) => {
      const mx = padL + ev.phi * plotW;
      ctx.strokeStyle = ev.color;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(mx, padT);
      ctx.lineTo(mx, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = ev.color;
      ctx.font = 'bold 8.5px monospace';
      ctx.fillText(ev.label.split(':')[0], mx - 4, padT - 6);
    });

    // 6. Real-time Sweeping Scanhead Cursor
    const cursorX = padL + currentPhi * plotW;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(cursorX, padT);
    ctx.lineTo(cursorX, padT + plotH);
    ctx.stroke();

    // Live Cursor Head Indicator
    const currentData = engine.evaluate(currentPhi);
    const curY = padT + plotH - (currentData.lvPressure / maxPressure) * plotH;
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(cursorX, curY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Real-time readout banner on top
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(
      `LVP: ${Math.round(currentData.lvPressure)} mmHg | AoP: ${Math.round(currentData.aorticPressure)} mmHg | LAP: ${Math.round(currentData.laPressure)} mmHg | LV Vol: ${Math.round(currentData.lvVolume)} mL`,
      padL + 10,
      padT + 16
    );

    ctx.restore();
  }, [engine, currentPhi, isLight]);

  // 2. Render Real-time PV Loop Canvas
  useEffect(() => {
    const canvas = pvCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = isLight ? '#f8fafc' : '#030712';
    ctx.fillRect(0, 0, width, height);

    const padL = 40;
    const padR = 20;
    const padT = 25;
    const padB = 35;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const vMax = 180;
    const pMax = 180;
    const toX = (v: number) => padL + (v / vMax) * plotW;
    const toY = (p: number) => padT + plotH - (p / pMax) * plotH;

    // Axes & Grid
    ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.25)' : 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    ctx.font = '9px monospace';
    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';

    for (let v = 0; v <= vMax; v += 40) {
      const x = toX(v);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
      ctx.fillText(`${v}`, x - 8, padT + plotH + 14);
    }
    ctx.fillText('Volume (mL)', padL + plotW / 2 - 25, padT + plotH + 28);

    for (let p = 0; p <= pMax; p += 40) {
      const y = toY(p);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillText(`${p}`, padL - 25, y + 3);
    }
    ctx.fillText('P (mmHg)', padL - 32, padT - 8);

    // Compute complete loop trajectory
    const loopSamples = 100;
    const loopPts: { x: number; y: number }[] = [];
    for (let i = 0; i <= loopSamples; i++) {
      const data = engine.evaluate(i / loopSamples);
      loopPts.push({ x: toX(data.lvVolume), y: toY(data.lvPressure) });
    }

    // Fill Stroke Work area with subtle glowing gradient
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, 'rgba(244, 63, 94, 0.25)');
    grad.addColorStop(1, 'rgba(244, 63, 94, 0.02)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    loopPts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.closePath();
    ctx.fill();

    // Draw Continuous PV Loop Line
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    loopPts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.closePath();
    ctx.stroke();

    // ESPVR (End-Systolic Elastance Slope Line)
    const metrics = engine.getPvMetrics();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(toX(10), toY(0));
    ctx.lineTo(toX(metrics.esv), toY(metrics.peakPressure));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('ESPVR (Ees)', toX(metrics.esv) - 30, toY(metrics.peakPressure) - 6);

    // Live Operating Point Dot
    const cur = engine.evaluate(currentPhi);
    const liveX = toX(cur.lvVolume);
    const liveY = toY(cur.lvPressure);

    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(liveX, liveY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Metrics overlay box
    ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(padL + 8, padT + 6, 120, 52);
    ctx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
    ctx.strokeRect(padL + 8, padT + 6, 120, 52);

    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = 'bold 9.5px monospace';
    ctx.fillText(`SV: ${metrics.strokeVolume} mL`, padL + 14, padT + 20);
    ctx.fillText(`EF: ${metrics.ejectionFraction}%`, padL + 14, padT + 34);
    ctx.fillText(`Work: ${metrics.strokeWorkJoules} J`, padL + 14, padT + 48);

    ctx.restore();
  }, [engine, currentPhi, isLight]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
      {/* Real-time Continuous Wiggers Canvas */}
      <div className="lg:col-span-8 flex flex-col rounded-2xl bg-slate-950 border border-slate-800 p-3 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
              Live Synchronized Wiggers Hemodynamic Canvas
            </h4>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="text-rose-400 font-bold">■ LV Pressure</span>
            <span className="text-amber-400 font-bold">■ Aortic Pressure</span>
            <span className="text-cyan-400 font-bold">-- LA Pressure</span>
            <span className="text-emerald-400 font-bold">■ LV Volume</span>
          </div>
        </div>
        <canvas ref={wiggersCanvasRef} className="w-full h-56 rounded-xl block" />
      </div>

      {/* Real-time Dynamic Pressure-Volume (PV) Loop Canvas */}
      <div className="lg:col-span-4 flex flex-col rounded-2xl bg-slate-950 border border-slate-800 p-3 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
            Dynamic P-V Loop
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
            Frank-Starling Area
          </span>
        </div>
        <canvas ref={pvCanvasRef} className="w-full h-56 rounded-xl block" />
      </div>
    </div>
  );
};
