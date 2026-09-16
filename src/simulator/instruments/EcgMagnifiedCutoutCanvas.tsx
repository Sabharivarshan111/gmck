/**
 * EcgMagnifiedCutoutCanvas.tsx
 * High-Resolution Single-Beat ECG Waveform Cut-Out & Diagnostic Visualization
 * Features:
 * - 4x magnified calibrated pink millimeter grid (25 mm/s, 10 mm/mV standard).
 * - Focused single-beat waveform cut-out centered on the active segment.
 * - Millisecond caliper brackets with dual measurement calipers and duration tag.
 * - Voltage amplitude caliper (1 mm = 0.1 mV, 10 mm = 1.0 mV).
 * - High-yield morphological annotations (Q wave, R peak, S notch, J-point, T wave apex).
 * - Vectorial dipole trajectory compass showing spatial electrical propagation.
 */

import React, { useEffect, useRef } from 'react';

interface EcgMagnifiedCutoutCanvasProps {
  segmentId: string;
  heartRate?: number;
  rhythm?: string;
  isLight?: boolean;
}

interface SegmentVisualConfig {
  name: string;
  color: string;
  bandColor: string;
  startNorm: number;
  endNorm: number;
  durationMs: number;
  caliperText: string;
  voltageText: string;
  vectorDeg: number;
  vectorName: string;
  landmarks: { label: string; normX: number; relY: number; align?: 'left' | 'right' | 'center' }[];
}

const SEGMENT_CONFIGS: Record<string, SegmentVisualConfig> = {
  p: {
    name: 'P Wave (Atrial Depolarization)',
    color: '#10b981',
    bandColor: 'rgba(16, 185, 129, 0.22)',
    startNorm: 0.12,
    endNorm: 0.23,
    durationMs: 90,
    caliperText: '90 ms (Normal: 80 - 110 ms)',
    voltageText: '0.18 mV (< 0.25 mV)',
    vectorDeg: 45,
    vectorName: 'Atrial Vector (+45°)',
    landmarks: [
      { label: 'RA Depolarization (Ascending)', normX: 0.145, relY: -12, align: 'right' },
      { label: 'P Crest (Apex)', normX: 0.175, relY: -28, align: 'center' },
      { label: 'LA Depolarization (Descending)', normX: 0.205, relY: -12, align: 'left' },
    ],
  },
  p_wave: {
    name: 'P Wave (Atrial Depolarization)',
    color: '#10b981',
    bandColor: 'rgba(16, 185, 129, 0.22)',
    startNorm: 0.12,
    endNorm: 0.23,
    durationMs: 90,
    caliperText: '90 ms (Normal: 80 - 110 ms)',
    voltageText: '0.18 mV (< 0.25 mV)',
    vectorDeg: 45,
    vectorName: 'Atrial Vector (+45°)',
    landmarks: [
      { label: 'RA Depolarization (Ascending)', normX: 0.145, relY: -12, align: 'right' },
      { label: 'P Crest (Apex)', normX: 0.175, relY: -28, align: 'center' },
      { label: 'LA Depolarization (Descending)', normX: 0.205, relY: -12, align: 'left' },
    ],
  },
  pr: {
    name: 'PR Segment & Interval (AV Node Delay)',
    color: '#f59e0b',
    bandColor: 'rgba(245, 158, 11, 0.22)',
    startNorm: 0.23,
    endNorm: 0.35,
    durationMs: 140,
    caliperText: '140 ms (PR Interval: 120 - 200 ms)',
    voltageText: '0.00 mV (Isoelectric Baseline)',
    vectorDeg: 0,
    vectorName: 'AV Nodal Delay (Minimal Dipole)',
    landmarks: [
      { label: 'End of P Wave', normX: 0.235, relY: 14, align: 'right' },
      { label: 'AV Nodal Physiological Delay (100ms)', normX: 0.285, relY: -22, align: 'center' },
      { label: 'His-Purkinje Entry', normX: 0.34, relY: 14, align: 'left' },
    ],
  },
  pr_segment: {
    name: 'PR Segment & Interval (AV Node Delay)',
    color: '#f59e0b',
    bandColor: 'rgba(245, 158, 11, 0.22)',
    startNorm: 0.23,
    endNorm: 0.35,
    durationMs: 140,
    caliperText: '140 ms (PR Interval: 120 - 200 ms)',
    voltageText: '0.00 mV (Isoelectric Baseline)',
    vectorDeg: 0,
    vectorName: 'AV Nodal Delay (Minimal Dipole)',
    landmarks: [
      { label: 'End of P Wave', normX: 0.235, relY: 14, align: 'right' },
      { label: 'AV Nodal Physiological Delay (100ms)', normX: 0.285, relY: -22, align: 'center' },
      { label: 'His-Purkinje Entry', normX: 0.34, relY: 14, align: 'left' },
    ],
  },
  qrs: {
    name: 'QRS Complex (Ventricular Depolarization)',
    color: '#06b6d4',
    bandColor: 'rgba(6, 182, 212, 0.24)',
    startNorm: 0.34,
    endNorm: 0.46,
    durationMs: 85,
    caliperText: '85 ms (Normal: 70 - 100 ms)',
    voltageText: '1.45 mV (R-Wave Amplitude)',
    vectorDeg: 60,
    vectorName: 'Mean QRS Vector (+60°)',
    landmarks: [
      { label: 'Q Wave (Septal L->R)', normX: 0.36, relY: 24, align: 'right' },
      { label: 'R Peak (LV Free Wall)', normX: 0.395, relY: -110, align: 'center' },
      { label: 'S Wave (Basal LV)', normX: 0.43, relY: 34, align: 'left' },
      { label: 'J-Point (QRS End)', normX: 0.455, relY: -14, align: 'left' },
    ],
  },
  st: {
    name: 'ST Segment (Action Potential Phase 2 Plateau)',
    color: '#ef4444',
    bandColor: 'rgba(239, 68, 68, 0.24)',
    startNorm: 0.45,
    endNorm: 0.58,
    durationMs: 100,
    caliperText: '100 ms (Isoelectric TP baseline)',
    voltageText: '0.00 mV (< 1mm elevation threshold)',
    vectorDeg: 0,
    vectorName: 'Phase 2 Plateau (No Injury Vector)',
    landmarks: [
      { label: 'J-Point (ST Takeoff)', normX: 0.455, relY: -18, align: 'right' },
      { label: 'Isoelectric Plateau (Phase 2 Ca2+)', normX: 0.51, relY: -22, align: 'center' },
      { label: 'T Wave Takeoff', normX: 0.575, relY: -14, align: 'left' },
    ],
  },
  st_segment: {
    name: 'ST Segment (Action Potential Phase 2 Plateau)',
    color: '#ef4444',
    bandColor: 'rgba(239, 68, 68, 0.24)',
    startNorm: 0.45,
    endNorm: 0.58,
    durationMs: 100,
    caliperText: '100 ms (Isoelectric TP baseline)',
    voltageText: '0.00 mV (< 1mm elevation threshold)',
    vectorDeg: 0,
    vectorName: 'Phase 2 Plateau (No Injury Vector)',
    landmarks: [
      { label: 'J-Point (ST Takeoff)', normX: 0.455, relY: -18, align: 'right' },
      { label: 'Isoelectric Plateau (Phase 2 Ca2+)', normX: 0.51, relY: -22, align: 'center' },
      { label: 'T Wave Takeoff', normX: 0.575, relY: -14, align: 'left' },
    ],
  },
  t: {
    name: 'T Wave (Ventricular Repolarization)',
    color: '#8b5cf6',
    bandColor: 'rgba(139, 92, 246, 0.22)',
    startNorm: 0.56,
    endNorm: 0.74,
    durationMs: 150,
    caliperText: '150 ms (Normal: 120 - 160 ms)',
    voltageText: '0.35 mV (< 0.5 mV limb leads)',
    vectorDeg: 55,
    vectorName: 'Repolarization Vector (+55°)',
    landmarks: [
      { label: 'Gentle Ascending Limb', normX: 0.60, relY: -20, align: 'right' },
      { label: 'T Wave Apex (Epicardium -> Endo)', normX: 0.65, relY: -48, align: 'center' },
      { label: 'Steep Descending Limb', normX: 0.71, relY: -20, align: 'left' },
    ],
  },
  t_wave: {
    name: 'T Wave (Ventricular Repolarization)',
    color: '#8b5cf6',
    bandColor: 'rgba(139, 92, 246, 0.22)',
    startNorm: 0.56,
    endNorm: 0.74,
    durationMs: 150,
    caliperText: '150 ms (Normal: 120 - 160 ms)',
    voltageText: '0.35 mV (< 0.5 mV limb leads)',
    vectorDeg: 55,
    vectorName: 'Repolarization Vector (+55°)',
    landmarks: [
      { label: 'Gentle Ascending Limb', normX: 0.60, relY: -20, align: 'right' },
      { label: 'T Wave Apex (Epicardium -> Endo)', normX: 0.65, relY: -48, align: 'center' },
      { label: 'Steep Descending Limb', normX: 0.71, relY: -20, align: 'left' },
    ],
  },
  qt: {
    name: 'QT / QTc Interval (Total Electrical Systole)',
    color: '#0284c7',
    bandColor: 'rgba(2, 132, 199, 0.20)',
    startNorm: 0.34,
    endNorm: 0.74,
    durationMs: 390,
    caliperText: '390 ms (Bazett QTc: < 440 ms)',
    voltageText: 'Depol (QRS) + Repol (T Wave)',
    vectorDeg: 60,
    vectorName: 'Complete Electrical Systole',
    landmarks: [
      { label: 'Q-Onset (Depolarization)', normX: 0.35, relY: 26, align: 'right' },
      { label: 'Phase 0 -> Phase 3', normX: 0.53, relY: -80, align: 'center' },
      { label: 'T-End (Repolarization Complete)', normX: 0.735, relY: 18, align: 'left' },
    ],
  },
  qt_interval: {
    name: 'QT / QTc Interval (Total Electrical Systole)',
    color: '#0284c7',
    bandColor: 'rgba(2, 132, 199, 0.20)',
    startNorm: 0.34,
    endNorm: 0.74,
    durationMs: 390,
    caliperText: '390 ms (Bazett QTc: < 440 ms)',
    voltageText: 'Depol (QRS) + Repol (T Wave)',
    vectorDeg: 60,
    vectorName: 'Complete Electrical Systole',
    landmarks: [
      { label: 'Q-Onset (Depolarization)', normX: 0.35, relY: 26, align: 'right' },
      { label: 'Phase 0 -> Phase 3', normX: 0.53, relY: -80, align: 'center' },
      { label: 'T-End (Repolarization Complete)', normX: 0.735, relY: 18, align: 'left' },
    ],
  },
};

export const EcgMagnifiedCutoutCanvas: React.FC<EcgMagnifiedCutoutCanvasProps> = ({
  segmentId,
  heartRate = 75,
  rhythm = 'SINUS',
  isLight = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background: Standard Calibrated Pink ECG Grid Paper
    ctx.fillStyle = '#fff5f5';
    ctx.fillRect(0, 0, w, h);

    // 1. Minor Grid Lines: 1 mm = 4 pixels
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.16)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 2. Major Grid Lines: 5 mm = 20 pixels (0.20 s horizontal, 0.5 mV vertical)
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.38)';
    ctx.lineWidth = 1.0;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Baseline Y center
    const yCenter = h * 0.58;

    // Normalized ECG Waveform Function for Lead II (single beat)
    const getLeadIIValue = (phi: number): number => {
      let v = 0;
      // P wave (phi: 0.12 to 0.23, peak at 0.175)
      if (phi >= 0.12 && phi <= 0.23) {
        const pNorm = (phi - 0.12) / 0.11;
        v += Math.sin(pNorm * Math.PI) * 0.22;
      }
      // Q wave (phi: 0.34 to 0.37, dip at 0.36)
      if (phi >= 0.34 && phi <= 0.37) {
        const qNorm = (phi - 0.34) / 0.03;
        v -= Math.sin(qNorm * Math.PI) * 0.18;
      }
      // R wave (phi: 0.37 to 0.42, tall peak at 0.395)
      if (phi >= 0.37 && phi <= 0.42) {
        const rNorm = (phi - 0.37) / 0.05;
        v += Math.sin(rNorm * Math.PI) * 1.55;
      }
      // S wave (phi: 0.42 to 0.46, dip at 0.435)
      if (phi >= 0.42 && phi <= 0.46) {
        const sNorm = (phi - 0.42) / 0.04;
        v -= Math.sin(sNorm * Math.PI) * 0.32;
      }
      // T wave (phi: 0.56 to 0.74, asymmetric peak at 0.66)
      if (phi >= 0.56 && phi <= 0.74) {
        const tNorm = (phi - 0.56) / 0.18;
        const skew = Math.sin(tNorm * Math.PI) * (1 - 0.18 * (tNorm - 0.5));
        v += Math.max(0, skew) * 0.40;
      }
      return v;
    };

    const cfg = SEGMENT_CONFIGS[segmentId] || SEGMENT_CONFIGS.qrs;

    // Draw Calibration Voltage Pulse at left margin (10 mm = 40 px = 1.0 mV)
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    const calX = 24;
    ctx.moveTo(calX, yCenter);
    ctx.lineTo(calX + 6, yCenter);
    ctx.lineTo(calX + 6, yCenter - 40);
    ctx.lineTo(calX + 22, yCenter - 40);
    ctx.lineTo(calX + 22, yCenter);
    ctx.lineTo(calX + 28, yCenter);
    ctx.stroke();

    // Pulse Label
    ctx.fillStyle = '#7f1d1d';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('1.0 mV', calX + 3, yCenter - 44);
    ctx.fillText('10 mm', calX + 3, yCenter + 14);

    // Waveform rendering area
    const startX = 64;
    const waveW = w - 80;

    // Highlighted Segment Shaded Band
    const bandX1 = startX + cfg.startNorm * waveW;
    const bandX2 = startX + cfg.endNorm * waveW;

    ctx.fillStyle = cfg.bandColor;
    ctx.fillRect(bandX1, 16, bandX2 - bandX1, h - 32);

    // Boundary Caliper Vertical Lines
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(bandX1, 16);
    ctx.lineTo(bandX1, h - 16);
    ctx.moveTo(bandX2, 16);
    ctx.lineTo(bandX2, h - 16);
    ctx.stroke();
    ctx.setLineDash([]);

    // Continuous Lead II Waveform Line (Black ink, 2.5px width)
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const steps = 360;
    for (let i = 0; i <= steps; i++) {
      const phi = i / steps;
      const x = startX + phi * waveW;
      const mv = getLeadIIValue(phi);
      // 1.0 mV = 40 pixels on 4 px/mm grid
      const y = yCenter - mv * 40;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Highlighted active curve segment (Glow overlay on top)
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    let segmentStarted = false;
    for (let i = 0; i <= steps; i++) {
      const phi = i / steps;
      if (phi >= cfg.startNorm && phi <= cfg.endNorm) {
        const x = startX + phi * waveW;
        const mv = getLeadIIValue(phi);
        const y = yCenter - mv * 40;
        if (!segmentStarted) {
          ctx.moveTo(x, y);
          segmentStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    ctx.stroke();

    // Duration Bracket & Arrow above the segment
    const bracketY = 28;
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bandX1, bracketY + 8);
    ctx.lineTo(bandX1, bracketY);
    ctx.lineTo(bandX2, bracketY);
    ctx.lineTo(bandX2, bracketY + 8);
    ctx.stroke();

    // Horizontal arrowheads
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.moveTo(bandX1 + 6, bracketY - 3);
    ctx.lineTo(bandX1, bracketY);
    ctx.lineTo(bandX1 + 6, bracketY + 3);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(bandX2 - 6, bracketY - 3);
    ctx.lineTo(bandX2, bracketY);
    ctx.lineTo(bandX2 - 6, bracketY + 3);
    ctx.fill();

    // Duration Tag text
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱ ${cfg.caliperText}`, (bandX1 + bandX2) / 2, bracketY - 6);

    // Voltage amplitude tag (vertical bracket)
    const voltX = bandX2 + 8;
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(voltX, yCenter);
    ctx.lineTo(voltX + 4, yCenter);
    ctx.lineTo(voltX + 4, yCenter - 28);
    ctx.lineTo(voltX, yCenter - 28);
    ctx.stroke();
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ ${cfg.voltageText}`, voltX + 8, yCenter - 12);

    // Anatomical Landmarks & Callout Arrows
    cfg.landmarks.forEach((lm) => {
      const lmX = startX + lm.normX * waveW;
      const mv = getLeadIIValue(lm.normX);
      const pointY = yCenter - mv * 40;
      const targetY = pointY + lm.relY;

      // Small anchor dot
      ctx.fillStyle = cfg.color;
      ctx.beginPath();
      ctx.arc(lmX, pointY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Pointer Line
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(lmX, pointY);
      ctx.lineTo(lmX, targetY);
      ctx.stroke();

      // Pill Background for Text
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = lm.align || 'center';
      const text = lm.label;
      const metrics = ctx.measureText(text);
      const textW = metrics.width;
      let pillX = lmX - textW / 2 - 4;
      if (lm.align === 'left') pillX = lmX - 4;
      if (lm.align === 'right') pillX = lmX - textW - 4;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.fillRect(pillX, targetY - 10, textW + 8, 14);
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.9)';
      ctx.strokeRect(pillX, targetY - 10, textW + 8, 14);

      ctx.fillStyle = '#0f172a';
      ctx.fillText(text, lm.align === 'left' ? lmX : lm.align === 'right' ? lmX : lmX, targetY);
    });

    // Electrical Vector Compass in Top-Right Inset
    const compassX = w - 48;
    const compassY = 48;
    const compassR = 24;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.beginPath();
    ctx.arc(compassX, compassY, compassR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Axis crosshairs
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(compassX - compassR + 2, compassY);
    ctx.lineTo(compassX + compassR - 2, compassY);
    ctx.moveTo(compassX, compassY - compassR + 2);
    ctx.lineTo(compassX, compassY + compassR - 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Vector Arrow
    if (cfg.vectorDeg !== 0) {
      const rad = (cfg.vectorDeg * Math.PI) / 180;
      const arrowLen = compassR - 5;
      const arrX = compassX + Math.cos(rad) * arrowLen;
      const arrY = compassY + Math.sin(rad) * arrowLen;

      ctx.strokeStyle = cfg.color;
      ctx.fillStyle = cfg.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(compassX, compassY);
      ctx.lineTo(arrX, arrY);
      ctx.stroke();

      // Arrowhead
      const headLen = 6;
      const headAngle = Math.PI / 6;
      ctx.beginPath();
      ctx.moveTo(arrX, arrY);
      ctx.lineTo(arrX - headLen * Math.cos(rad - headAngle), arrY - headLen * Math.sin(rad - headAngle));
      ctx.lineTo(arrX - headLen * Math.cos(rad + headAngle), arrY - headLen * Math.sin(rad + headAngle));
      ctx.closePath();
      ctx.fill();
    }

    // Compass Vector Label
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(cfg.vectorName, compassX, compassY + compassR + 10);
  }, [segmentId, heartRate, rhythm, isLight]);

  const cfg = SEGMENT_CONFIGS[segmentId] || SEGMENT_CONFIGS.qrs;

  return (
    <div className="w-full bg-slate-950 border-2 rounded-xl p-3 shadow-inner space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
          <span className="font-bold text-slate-100">
            🔍 Single-Lead Magnified Cut-Out: {cfg.name}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
            Lead II (4x Zoom)
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-rose-300">
            25 mm/s | 10 mm/mV
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-red-300 shadow-sm bg-[#fff5f5]">
        <canvas
          ref={canvasRef}
          width={760}
          height={210}
          className="w-full min-w-[700px] h-auto block"
        />
      </div>
    </div>
  );
};
