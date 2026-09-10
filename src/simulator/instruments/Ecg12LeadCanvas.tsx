import React, { useEffect, useRef } from 'react';

export interface Ecg12LeadProps {
  rhythm: string;
  heartRate: number;
  theme?: 'light' | 'dark';
}

export const Ecg12LeadCanvas: React.FC<Ecg12LeadProps> = ({
  rhythm,
  heartRate,
  theme = 'light',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw Pink Medical Millimeter ECG Grid Paper
    // Background: Cream-pink tint (#fff5f5)
    ctx.fillStyle = '#fff5f5';
    ctx.fillRect(0, 0, w, h);

    // Minor grid lines (1mm spacing = 4 pixels)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.12)';
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

    // Major grid lines (5mm spacing = 20 pixels)
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.32)';
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

    // 2. 12-Lead Grid Layout
    // 4 columns: [I, II, III], [aVR, aVL, aVF], [V1, V2, V3], [V4, V5, V6]
    // Row 4: Continuous Lead II Rhythm Strip across the entire width!
    const colWidth = w / 4;
    const rowHeight = (h - 70) / 3;

    const leads: { name: string; col: number; row: number; leadKey: string }[] = [
      // Column 0: Standard Limb Leads
      { name: 'I', col: 0, row: 0, leadKey: 'I' },
      { name: 'II', col: 0, row: 1, leadKey: 'II' },
      { name: 'III', col: 0, row: 2, leadKey: 'III' },

      // Column 1: Augmented Limb Leads
      { name: 'aVR', col: 1, row: 0, leadKey: 'aVR' },
      { name: 'aVL', col: 1, row: 1, leadKey: 'aVL' },
      { name: 'aVF', col: 1, row: 2, leadKey: 'aVF' },

      // Column 2: Septal & Anterior Precordial Leads
      { name: 'V1', col: 2, row: 0, leadKey: 'V1' },
      { name: 'V2', col: 2, row: 1, leadKey: 'V2' },
      { name: 'V3', col: 2, row: 2, leadKey: 'V3' },

      // Column 3: Anterolateral & Lateral Precordial Leads
      { name: 'V4', col: 3, row: 0, leadKey: 'V4' },
      { name: 'V5', col: 3, row: 1, leadKey: 'V5' },
      { name: 'V6', col: 3, row: 2, leadKey: 'V6' },
    ];

    // Waveform Synthesis Math per Lead
    const drawLead = (
      name: string,
      xStart: number,
      yCenter: number,
      width: number,
      leadKey: string
    ) => {
      // Draw Lead Label
      ctx.fillStyle = '#991b1b';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(name, xStart + 8, yCenter - rowHeight / 2 + 14);

      // Draw Standard 1 mV Calibration Pulse at the beginning of each lead
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const calX = xStart + 8;
      ctx.moveTo(calX, yCenter);
      ctx.lineTo(calX + 4, yCenter);
      ctx.lineTo(calX + 4, yCenter - 20); // 10mm = 20px = 1 mV
      ctx.lineTo(calX + 12, yCenter - 20);
      ctx.lineTo(calX + 12, yCenter);
      ctx.lineTo(calX + 16, yCenter);
      ctx.stroke();

      // Synthesize ECG trace
      const traceStartX = calX + 18;
      const traceWidth = width - 24;
      const hr = Math.max(35, Math.min(180, heartRate));
      const rrPixels = (25 * 4 * (60 / hr)); // 25mm/sec * 4px/mm = 100 px/sec

      ctx.beginPath();
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 1.5;

      let prevX = traceStartX;
      let prevY = yCenter;
      ctx.moveTo(prevX, prevY);

      const isStemiInferior = rhythm.includes('stemi');
      const isAfib = rhythm.includes('afib');
      const isHyperK = rhythm.includes('hyperkalemia') || rhythm.includes('uremia') || rhythm.includes('aki');
      const isTamponade = rhythm.includes('tamponade');
      const isVFib = rhythm.includes('vfib');

      for (let px = 0; px < traceWidth; px++) {
        const x = traceStartX + px;

        if (isVFib) {
          // Chaotic ventricular fibrillation oscillations
          const f1 = Math.sin(px * 0.15) * 16;
          const f2 = Math.sin(px * 0.28 + 1.2) * 10;
          const f3 = Math.cos(px * 0.08) * 8;
          const y = yCenter + f1 + f2 + f3;
          ctx.lineTo(x, y);
          continue;
        }

        // Standard phase within cardiac cycle [0, 1)
        const phase = (px % rrPixels) / rrPixels;
        let deflection = 0; // in pixels (up is negative)

        // Lead orientation multiplier (aVR is normally negative)
        const inv = leadKey === 'aVR' ? -1 : 1;

        // Amplitude scale (Tamponade has microvoltage < 5mm)
        let ampScale = isTamponade ? 0.38 : 1.0;
        if (isTamponade) {
          // Electrical Alternans: alternating beat heights
          const beatNum = Math.floor(px / rrPixels);
          ampScale *= (beatNum % 2 === 0 ? 1.3 : 0.7);
        }

        // P Wave
        if (!isAfib && !isHyperK) {
          if (phase > 0.12 && phase < 0.24) {
            const pPhase = (phase - 0.18) / 0.06;
            deflection -= 4 * Math.exp(-pPhase * pPhase * 4) * inv * ampScale;
          }
        } else if (isAfib) {
          // Fibrillatory f-waves (350-600 bpm)
          deflection += Math.sin(px * 0.6) * 1.8;
        }

        // Q Wave
        if (phase > 0.34 && phase < 0.37) {
          deflection += 3.5 * inv * ampScale;
        }

        // R Wave (Tall narrow ventricular depolarization)
        if (phase >= 0.37 && phase <= 0.43) {
          const rPhase = (phase - 0.40) / 0.03;
          const rHeight = isHyperK ? 32 : (leadKey.startsWith('V') ? 34 : 26);
          deflection -= rHeight * Math.exp(-rPhase * rPhase * 6) * inv * ampScale;
        }

        // S Wave
        if (phase > 0.43 && phase < 0.48) {
          const sPhase = (phase - 0.45) / 0.03;
          const sDepth = isHyperK ? 14 : 7;
          deflection += sDepth * Math.exp(-sPhase * sPhase * 6) * inv * ampScale;
        }

        // ST Segment & T Wave
        if (isStemiInferior && (leadKey === 'II' || leadKey === 'III' || leadKey === 'aVF')) {
          // Massive ST Elevation Tombstoning (+3.5mm to +5mm)
          if (phase > 0.46 && phase < 0.78) {
            const stPhase = (phase - 0.60) / 0.16;
            deflection -= 18 * Math.exp(-stPhase * stPhase * 2.5); // Elevated
          }
        } else if (isStemiInferior && (leadKey === 'I' || leadKey === 'aVL')) {
          // Reciprocal ST Depression (-2.5mm)
          if (phase > 0.46 && phase < 0.70) {
            const stPhase = (phase - 0.58) / 0.12;
            deflection += 8 * Math.exp(-stPhase * stPhase * 3.0); // Depressed
          }
        } else if (isHyperK) {
          // Tall, Peaked, Tented T-Wave (Narrow base, doubled height)
          if (phase > 0.52 && phase < 0.72) {
            const tPhase = (phase - 0.62) / 0.08;
            deflection -= 24 * Math.exp(-tPhase * tPhase * 7) * inv * ampScale;
          }
        } else {
          // Normal T-Wave
          if (phase > 0.54 && phase < 0.76) {
            const tPhase = (phase - 0.65) / 0.11;
            deflection -= 8 * Math.exp(-tPhase * tPhase * 4) * inv * ampScale;
          }
        }

        const y = yCenter + deflection;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    // Draw the 12 Leads in standard 4x3 matrix
    leads.forEach((lead) => {
      const xStart = lead.col * colWidth;
      const yCenter = lead.row * rowHeight + rowHeight / 2 + 10;
      drawLead(lead.name, xStart, yCenter, colWidth, lead.leadKey);

      // Divider vertical line between lead columns
      if (lead.col > 0 && lead.row === 0) {
        ctx.strokeStyle = 'rgba(185, 28, 28, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xStart, 0);
        ctx.lineTo(xStart, h - 60);
        ctx.stroke();
      }
    });

    // Row 4: Continuous Lead II Rhythm Strip across bottom
    const rhythmY = h - 35;
    ctx.strokeStyle = 'rgba(185, 28, 28, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, h - 70);
    ctx.lineTo(w, h - 70);
    ctx.stroke();

    drawLead('II (Continuous Rhythm Strip)', 0, rhythmY, w, 'II');

    // ECG Footer metadata
    ctx.fillStyle = '#7f1d1d';
    ctx.font = '10px monospace';
    ctx.fillText('25 mm/s  10 mm/mV  0.05-150Hz  NMC Standard 12-Lead Electrocardiograph', 12, h - 6);
  }, [rhythm, heartRate, theme]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full overflow-x-auto rounded-xl border-2 border-red-300 shadow-md bg-[#fff5f5]">
        <canvas
          ref={canvasRef}
          width={840}
          height={480}
          className="w-full h-auto block"
        />
      </div>
    </div>
  );
};
