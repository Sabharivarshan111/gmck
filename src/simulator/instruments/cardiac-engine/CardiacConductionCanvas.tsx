/**
 * CardiacConductionCanvas.tsx
 * Authentic Wavefront Propagation, Cellular Action Potential (Phase 0-4),
 * and Spatial Dipole Dot-Product Vector Engine for Einthoven's 12-Lead ECG.
 */

import React, { useEffect, useRef } from 'react';
import { CardiacCycleEngine } from './CardiacCyclePhysics';

interface CardiacConductionCanvasProps {
  engine: CardiacCycleEngine;
  currentPhi: number;
  isLight?: boolean;
}

export const CardiacConductionCanvas: React.FC<CardiacConductionCanvasProps> = ({
  engine,
  currentPhi,
  isLight = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const actionPotentialCanvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Cellular Action Potential (0-4) with sweeping cursor
  useEffect(() => {
    const canvas = actionPotentialCanvasRef.current;
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

    const padL = 35;
    const padR = 15;
    const padT = 20;
    const padB = 25;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Voltage Axis (-90 mV to +30 mV)
    const vMin = -100;
    const vMax = +40;
    const toY = (v: number) => padT + plotH - ((v - vMin) / (vMax - vMin)) * plotH;

    ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.25)' : 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    ctx.font = '8.5px monospace';
    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';

    [-90, -60, 0, +30].forEach((v) => {
      const y = toY(v);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillText(`${v}mV`, padL - 28, y + 3);
    });

    // Draw Complete Action Potential Curve
    const samples = 100;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= samples; i++) {
      const sPhi = i / samples;
      const data = engine.evaluate(sPhi);
      pts.push({ x: padL + sPhi * plotW, y: toY(data.cellVoltage) });
    }

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    pts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.stroke();

    // Phase Labels
    ctx.font = 'bold 8.5px sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('Phase 0 (INa)', padL + 0.13 * plotW, toY(10));
    ctx.fillStyle = '#34d399';
    ctx.fillText('Phase 2 (ICa,L)', padL + 0.23 * plotW, toY(20));
    ctx.fillStyle = '#a855f7';
    ctx.fillText('Phase 3 (IK)', padL + 0.38 * plotW, toY(-25));
    ctx.fillStyle = '#64748b';
    ctx.fillText('Phase 4 (IK1)', padL + 0.65 * plotW, toY(-75));

    // Live Cursor
    const curX = padL + currentPhi * plotW;
    const curData = engine.evaluate(currentPhi);
    const curY = toY(curData.cellVoltage);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(curX, padT);
    ctx.lineTo(curX, padT + plotH);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(curX, curY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, [engine, currentPhi, isLight]);

  // 2. Conduction Anatomy & Hexaxial Dipole Vector Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
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

    const data = engine.evaluate(currentPhi);
    const dipole = data.dipoleVector;
    const leadVoltages = engine.projectLeadVoltages(dipole);

    // Left Half: Anatomical Conduction Tree (SA -> AV -> Purkinje)
    const treeW = width * 0.55;
    const cx = treeW / 2;
    const cy = height / 2 + 10;

    // Heart Outline
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 80);
    ctx.bezierCurveTo(cx - 70, cy - 80, cx - 80, cy + 30, cx, cy + 100);
    ctx.bezierCurveTo(cx + 80, cy + 30, cx + 70, cy - 80, cx, cy - 80);
    ctx.fill();
    ctx.stroke();

    // 1. SA Node (Top Right Atrium)
    const saActive = currentPhi < 0.12;
    ctx.fillStyle = saActive ? '#fbbf24' : '#64748b';
    ctx.shadowColor = saActive ? '#fbbf24' : 'transparent';
    ctx.shadowBlur = saActive ? 14 : 0;
    ctx.beginPath();
    ctx.arc(cx - 38, cy - 60, saActive ? 8 : 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Bachmann Bundle across to Left Atrium
    ctx.strokeStyle = saActive ? '#fef08a' : '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 38, cy - 60);
    ctx.bezierCurveTo(cx - 10, cy - 70, cx + 20, cy - 65, cx + 38, cy - 50);
    ctx.stroke();

    // 2. AV Node (Junction, Koch Triangle)
    const avActive = currentPhi >= 0.12 && currentPhi < 0.18;
    ctx.fillStyle = avActive ? '#38bdf8' : '#475569';
    ctx.shadowColor = avActive ? '#38bdf8' : 'transparent';
    ctx.shadowBlur = avActive ? 16 : 0;
    ctx.beginPath();
    ctx.arc(cx, cy - 25, avActive ? 9 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. Bundle of His & Left/Right Bundle Branches
    const purkinjeActive = currentPhi >= 0.18 && currentPhi < 0.28;
    ctx.strokeStyle = purkinjeActive ? '#34d399' : '#334155';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 25);
    ctx.lineTo(cx, cy + 15); // His bundle
    ctx.lineTo(cx - 30, cy + 60); // Right bundle
    ctx.moveTo(cx, cy + 15);
    ctx.lineTo(cx + 35, cy + 60); // Left bundle
    ctx.stroke();

    // Purkinje Arbor Arborization
    ctx.strokeStyle = purkinjeActive ? '#10b981' : '#1e293b';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy + 60);
    ctx.lineTo(cx - 45, cy + 45);
    ctx.moveTo(cx - 30, cy + 60);
    ctx.lineTo(cx - 40, cy + 75);
    ctx.moveTo(cx + 35, cy + 60);
    ctx.lineTo(cx + 50, cy + 45);
    ctx.moveTo(cx + 35, cy + 60);
    ctx.lineTo(cx + 45, cy + 75);
    ctx.stroke();

    // Right Half: Einthoven Hexaxial Compass & Dot Product Projections
    const compassCx = width * 0.78;
    const compassCy = height / 2;
    const radius = 65;

    // Compass Hexaxial Lines
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.lineWidth = 1;
    [0, 60, 120, -150, -30, 90].forEach((angle) => {
      const rad = (angle * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(compassCx - Math.cos(rad) * radius, compassCy - Math.sin(rad) * radius);
      ctx.lineTo(compassCx + Math.cos(rad) * radius, compassCy + Math.sin(rad) * radius);
      ctx.stroke();
    });

    // Realtime Spatial Dipole Vector Arrow D(t)
    if (dipole.magnitude > 0.02) {
      const arrowLen = Math.min(radius * 1.1, dipole.magnitude * 28);
      const rad = (dipole.angleDeg * Math.PI) / 180;
      const arrX = compassCx + Math.cos(rad) * arrowLen;
      const arrY = compassCy + Math.sin(rad) * arrowLen;

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(compassCx, compassCy);
      ctx.lineTo(arrX, arrY);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(arrX, arrY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Live Lead Deflections Readouts
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 9.5px monospace';
    ctx.fillText(`Lead I:   ${leadVoltages.I.toFixed(2)} mV`, width - 115, 25);
    ctx.fillText(`Lead II:  ${leadVoltages.II.toFixed(2)} mV`, width - 115, 40);
    ctx.fillText(`Lead III: ${leadVoltages.III.toFixed(2)} mV`, width - 115, 55);
    ctx.fillText(`aVR:     ${leadVoltages.aVR.toFixed(2)} mV`, width - 115, 70);
    ctx.fillText(`aVF:     ${leadVoltages.aVF.toFixed(2)} mV`, width - 115, 85);

    ctx.restore();
  }, [engine, currentPhi, isLight]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
      {/* Wavefront Propagation & Hexaxial Vector Compass */}
      <div className="lg:col-span-8 flex flex-col rounded-2xl bg-slate-950 border border-slate-800 p-3 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
            Conduction Wavefront & Einthoven Hexaxial Dipole Engine
          </h4>
          <span className="text-[10px] font-mono text-amber-400">
            V_lead = D(t) • L_lead
          </span>
        </div>
        <canvas ref={canvasRef} className="w-full h-56 rounded-xl block" />
      </div>

      {/* Cellular Action Potential (0-4) */}
      <div className="lg:col-span-4 flex flex-col rounded-2xl bg-slate-950 border border-slate-800 p-3 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
            Cellular Action Potential
          </h4>
          <span className="text-[10px] font-mono text-cyan-400">Phase 0 - 4</span>
        </div>
        <canvas ref={actionPotentialCanvasRef} className="w-full h-56 rounded-xl block" />
      </div>
    </div>
  );
};
