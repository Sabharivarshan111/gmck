import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, Info, Eye } from 'lucide-react';
import { EcgMagnifiedCutoutCanvas } from './EcgMagnifiedCutoutCanvas';

export type EcgSegmentType = 'all' | 'p' | 'pr' | 'qrs' | 'st' | 't' | 'qt';

export interface Ecg12LeadProps {
  rhythm: string;
  heartRate: number;
  theme?: 'light' | 'dark';
}

interface SegmentMeta {
  id: EcgSegmentType;
  name: string;
  shortName: string;
  phaseStart: number;
  phaseEnd: number;
  normalDurationMs: string;
  color: string;
  bandColor: string;
  textColor: string;
  borderColor: string;
  physioOrigin: string;
  vectorExplanation: string;
  leadsAnalysis: string;
  clinicalPearls: string;
}

const SEGMENTS: SegmentMeta[] = [
  {
    id: 'p',
    name: 'P Wave',
    shortName: 'P',
    phaseStart: 0.12,
    phaseEnd: 0.24,
    normalDurationMs: '80 – 110 ms (< 0.25 mV)',
    color: '#d97706',
    bandColor: 'rgba(245, 158, 11, 0.22)',
    textColor: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-500',
    physioOrigin: 'Atrial Depolarization originating at Sinoatrial (SA) node in high Right Atrium, radiating across Bachmann bundle to Left Atrium.',
    vectorExplanation: 'Mean atrial vector directs down and left (+60°). Points directly toward Lead II (+60°) → upright rounded P wave; away from aVR (-150°) → inverted P wave.',
    leadsAnalysis: 'Positive in Leads I, II, aVF, V4–V6. Biphasic in V1 (initial positive RA component + terminal negative LA component).',
    clinicalPearls: 'P pulmonale (peaked > 2.5 mm in II): Right Atrial Enlargement (COPD, Cor Pulmonale). P mitrale (notched/bifid > 120 ms): Left Atrial Enlargement (Mitral Stenosis). Absent in Atrial Fibrillation.'
  },
  {
    id: 'pr',
    name: 'PR Segment / Interval',
    shortName: 'PR',
    phaseStart: 0.24,
    phaseEnd: 0.35,
    normalDurationMs: '120 – 200 ms (3–5 small squares)',
    color: '#059669',
    bandColor: 'rgba(16, 185, 129, 0.22)',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-500',
    physioOrigin: 'Physiological conduction delay within the Atrioventricular (AV) node, Bundle of His, and bundle branches, allowing ventricular filling before systole.',
    vectorExplanation: 'Small localized potentials cancel out; produces an isoelectric (flat) voltage baseline on all surface limb and precordial leads.',
    leadsAnalysis: 'Isoelectric baseline across all 12 leads under normal conditions.',
    clinicalPearls: 'PR Prolongation (> 200 ms): 1st Degree AV Block. Short PR (< 120 ms): WPW Syndrome (Delta wave). PR Depression: Acute Pericarditis (hallmark sign in II, aVF with reciprocal PR elevation in aVR).'
  },
  {
    id: 'qrs',
    name: 'QRS Complex',
    shortName: 'QRS',
    phaseStart: 0.35,
    phaseEnd: 0.48,
    normalDurationMs: '70 – 100 ms (< 120 ms)',
    color: '#0284c7',
    bandColor: 'rgba(6, 182, 212, 0.25)',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    borderColor: 'border-cyan-500',
    physioOrigin: 'Ventricular Depolarization: Initial left-to-right septal depolarization (Q wave), dominant apex-to-base LV mass activation (R wave), late posterobasal depolarization (S wave).',
    vectorExplanation: 'Mean QRS axis normally -30° to +90°. Left ventricular mass (3x RV) dominates the vector, pointing inferiorly and to the left (+60°).',
    leadsAnalysis: 'Precordial R-Wave Progression: V1 (small r, deep S) transitioning to equiphasic RS at V3–V4, becoming dominant tall R wave in V5–V6. aVR is deeply negative (QS).',
    clinicalPearls: 'Wide QRS (> 120 ms): LBBB (WiLLiaM), RBBB (MaRRoW), or Ventricular Pacing. Pathological Q Wave (> 40 ms or > 25% R): Transmural Myocardial Infarction. Low voltage (< 5mm in limb leads): Tamponade, Amyloid, Obesity.'
  },
  {
    id: 'st',
    name: 'ST Segment',
    shortName: 'ST',
    phaseStart: 0.48,
    phaseEnd: 0.60,
    normalDurationMs: '80 – 120 ms (Isoelectric at J-point)',
    color: '#dc2626',
    bandColor: 'rgba(239, 68, 68, 0.26)',
    textColor: 'text-rose-700 dark:text-rose-300',
    borderColor: 'border-rose-500',
    physioOrigin: 'Plateau phase (Phase 2) of ventricular cardiomyocyte action potential; all ventricular myocytes are uniformly depolarized with zero net trans-myocardial voltage gradient.',
    vectorExplanation: 'In normal myocardium, net dipole is zero → flat isoelectric segment continuous with TP baseline.',
    leadsAnalysis: 'Should be flat at baseline across all leads (tolerates up to 1mm elevation in limb leads, 2mm in V2-V3 in young men).',
    clinicalPearls: 'ST Elevation (STEMI): Acute transmural myocardial injury current pointing toward infarcted zone (Inferior: II, III, aVF; Anterior: V1-V4; Lateral: I, aVL, V5-V6). Reciprocal ST Depression in opposite leads. Diffuse concave elevation: Acute Pericarditis.'
  },
  {
    id: 't',
    name: 'T Wave',
    shortName: 'T',
    phaseStart: 0.60,
    phaseEnd: 0.76,
    normalDurationMs: '160 – 200 ms (Asymmetric, rounded)',
    color: '#7c3aed',
    bandColor: 'rgba(139, 92, 246, 0.24)',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-500',
    physioOrigin: 'Rapid Ventricular Repolarization (Phase 3 of action potential) via voltage-gated potassium channels (IKr, IKs). Epicardium repolarizes before endocardium!',
    vectorExplanation: 'Because repolarization propagates in reverse direction (epicardium to endocardium), the repolarization dipole has the SAME positive polarity as depolarization! Hence T wave is concordant with QRS.',
    leadsAnalysis: 'Upright in I, II, V3–V6. Inverted in aVR. Variable in III, aVL, V1.',
    clinicalPearls: 'Tall Peaked T Waves: Hyperkalemia (early, symmetrical, tented). Inverted T Waves: Myocardial Ischemia, Wellens Syndrome (biphasic/deep V2-V3), or LV Strain. Flat T with U wave: Hypokalemia.'
  },
  {
    id: 'qt',
    name: 'QT / QTc Interval',
    shortName: 'QT',
    phaseStart: 0.35,
    phaseEnd: 0.76,
    normalDurationMs: '380 – 440 ms (Bazett QTc < 450ms ♂, < 460ms ♀)',
    color: '#db2777',
    bandColor: 'rgba(236, 72, 153, 0.20)',
    textColor: 'text-pink-700 dark:text-pink-300',
    borderColor: 'border-pink-500',
    physioOrigin: 'Total Ventricular Electrical Systole: encompasses entire duration of ventricular depolarization (QRS) through complete repolarization (T wave).',
    vectorExplanation: 'Spans the complete ventricular activation cycle from septal onset to epicardial recovery.',
    leadsAnalysis: 'Measured in Lead II or V5 from onset of Q wave to point where terminal limb of T wave returns to baseline.',
    clinicalPearls: 'Long QT Syndrome (QTc > 480 ms): Risk of R-on-T phenomenon degenerating into Torsades de Pointes and VFib. Causes: Drugs (Macrolides, Antipsychotics, Antiarrhythmics), Hypokalemia, Hypocalcemia, Hypomagnesemia.'
  }
];

export const Ecg12LeadCanvas: React.FC<Ecg12LeadProps> = ({
  rhythm,
  heartRate,
  theme = 'light',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeSegment, setActiveSegment] = useState<EcgSegmentType>('all');
  const [isAutoWalking, setIsAutoWalking] = useState(false);
  const autoWalkTimerRef = useRef<any>(null);

  // Auto-walkthrough systematic stepper
  useEffect(() => {
    if (!isAutoWalking) {
      if (autoWalkTimerRef.current) clearInterval(autoWalkTimerRef.current);
      return;
    }

    const order: EcgSegmentType[] = ['p', 'pr', 'qrs', 'st', 't', 'qt'];
    let idx = order.indexOf(activeSegment as any);
    if (idx < 0) idx = 0;

    autoWalkTimerRef.current = setInterval(() => {
      idx = (idx + 1) % order.length;
      setActiveSegment(order[idx]);
    }, 4200);

    return () => {
      if (autoWalkTimerRef.current) clearInterval(autoWalkTimerRef.current);
    };
  }, [isAutoWalking, activeSegment]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw Calibrated Pink Medical Millimeter ECG Grid Paper
    // Background: Standard pink-cream ECG paper (#fff5f5)
    ctx.fillStyle = '#fff5f5';
    ctx.fillRect(0, 0, w, h);

    // Minor grid lines (1mm = 4 pixels, calibrated for 25mm/s and 10mm/mV)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.14)';
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

    // Major grid lines (5mm = 20 pixels = 0.20 sec horizontal, 0.5 mV vertical)
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.35)';
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

    // 2. 12-Lead Standard Clinical 4x3 Matrix Layout
    const colWidth = w / 4;
    const rowHeight = (h - 75) / 3;

    const leads: { name: string; col: number; row: number; leadKey: string }[] = [
      // Col 0: Standard Limb Leads (Bipolar)
      { name: 'Lead I (0°)', col: 0, row: 0, leadKey: 'I' },
      { name: 'Lead II (+60°)', col: 0, row: 1, leadKey: 'II' },
      { name: 'Lead III (+120°)', col: 0, row: 2, leadKey: 'III' },

      // Col 1: Augmented Unipolar Limb Leads
      { name: 'aVR (-150°)', col: 1, row: 0, leadKey: 'aVR' },
      { name: 'aVL (-30°)', col: 1, row: 1, leadKey: 'aVL' },
      { name: 'aVF (+90°)', col: 1, row: 2, leadKey: 'aVF' },

      // Col 2: Septal & Anterior Precordial Leads
      { name: 'V1 (4th ICS RSB)', col: 2, row: 0, leadKey: 'V1' },
      { name: 'V2 (4th ICS LSB)', col: 2, row: 1, leadKey: 'V2' },
      { name: 'V3 (Midway V2-V4)', col: 2, row: 2, leadKey: 'V3' },

      // Col 3: Lateral Precordial Leads
      { name: 'V4 (5th ICS MCL)', col: 3, row: 0, leadKey: 'V4' },
      { name: 'V5 (Ant Axillary)', col: 3, row: 1, leadKey: 'V5' },
      { name: 'V6 (Mid Axillary)', col: 3, row: 2, leadKey: 'V6' },
    ];

    const currentMeta = SEGMENTS.find((s) => s.id === activeSegment);

    // Waveform Synthesis & Segment Highlighting per Lead
    const drawLead = (
      name: string,
      xStart: number,
      yCenter: number,
      width: number,
      leadKey: string,
      isRhythmStrip = false
    ) => {
      // Draw Lead Label
      ctx.fillStyle = '#991b1b';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(name, xStart + 8, yCenter - (isRhythmStrip ? 22 : rowHeight / 2) + 12);

      // Draw Standard 1 mV Calibration Pulse at the start of each lead
      // 10 mm height on standard 4 px/mm grid = 40 pixels!
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const calX = xStart + 8;
      ctx.moveTo(calX, yCenter);
      ctx.lineTo(calX + 4, yCenter);
      ctx.lineTo(calX + 4, yCenter - 40); // 10 mm = 40 px = 1.0 mV
      ctx.lineTo(calX + 12, yCenter - 40);
      ctx.lineTo(calX + 12, yCenter);
      ctx.lineTo(calX + 16, yCenter);
      ctx.stroke();

      // Synthesize ECG trace
      const traceStartX = calX + 18;
      const traceWidth = width - 24;
      const hr = Math.max(35, Math.min(180, heartRate));
      const rrPixels = 25 * 4 * (60 / hr); // 25mm/sec * 4px/mm = 100 px/sec

      const isStemiInferior = rhythm.includes('stemi');
      const isAfib = rhythm.includes('afib');
      const isHyperK = rhythm.includes('hyperkalemia') || rhythm.includes('uremia') || rhythm.includes('aki');
      const isTamponade = rhythm.includes('tamponade');
      const isVFib = rhythm.includes('vfib');

      // Lead-specific authentic morphology (Einthoven 1906, Wilson 1946)
      let leadR = 20;
      let leadS = 6;
      let leadQ = 0;
      let leadT = 8;
      let inv = 1;

      switch (leadKey) {
        case 'I':
          leadR = 18; leadS = 4; leadQ = 1.5; leadT = 7; break;
        case 'II':
          leadR = 28; leadS = 4; leadQ = 1.5; leadT = 10; break;
        case 'III':
          leadR = 10; leadS = 5; leadQ = 0; leadT = 4; break;
        case 'aVR':
          inv = -1; leadR = 3; leadS = 22; leadQ = 0; leadT = 7; break;
        case 'aVL':
          leadR = 12; leadS = 6; leadQ = 1; leadT = 5; break;
        case 'aVF':
          leadR = 20; leadS = 4; leadQ = 1.5; leadT = 8; break;
        case 'V1':
          leadR = 4; leadS = 24; leadQ = 0; leadT = -3; break;
        case 'V2':
          leadR = 8; leadS = 20; leadQ = 0; leadT = 6; break;
        case 'V3':
          leadR = 14; leadS = 14; leadQ = 0; leadT = 8; break;
        case 'V4':
          leadR = 22; leadS = 7; leadQ = 1; leadT = 9; break;
        case 'V5':
          leadR = 26; leadS = 4; leadQ = 2.5; leadT = 9; break;
        case 'V6':
          leadR = 22; leadS = 3; leadQ = 2.5; leadT = 8; break;
        default:
          leadR = 20; leadS = 6; leadQ = 1; leadT = 8;
      }

      // =======================================================================
      // STEP 1: RENDER SYNCHRONIZED MULTI-LEAD HIGHLIGHTING BANDS
      // =======================================================================
      if (currentMeta) {
        const segStartFrac = currentMeta.phaseStart;
        const segEndFrac = currentMeta.phaseEnd;

        const maxBeats = Math.ceil(traceWidth / rrPixels) + 1;
        for (let b = 0; b < maxBeats; b++) {
          const beatStartX = traceStartX + b * rrPixels;
          const bandX1 = beatStartX + segStartFrac * rrPixels;
          const bandX2 = beatStartX + segEndFrac * rrPixels;

          if (bandX1 < traceStartX + traceWidth && bandX2 > traceStartX) {
            const clampX1 = Math.max(traceStartX, bandX1);
            const clampX2 = Math.min(traceStartX + traceWidth, bandX2);
            const bandW = clampX2 - clampX1;

            if (bandW > 0) {
              const topY = yCenter - (isRhythmStrip ? 28 : rowHeight / 2 - 4);
              const boxH = isRhythmStrip ? 56 : rowHeight - 8;

              // Translucent highlighting background
              ctx.fillStyle = currentMeta.bandColor;
              ctx.fillRect(clampX1, topY, bandW, boxH);

              // Segment boundary markers
              ctx.strokeStyle = currentMeta.color;
              ctx.lineWidth = 1.0;
              ctx.setLineDash([2, 2]);
              ctx.beginPath();
              ctx.moveTo(clampX1, topY);
              ctx.lineTo(clampX1, topY + boxH);
              ctx.moveTo(clampX2, topY);
              ctx.lineTo(clampX2, topY + boxH);
              ctx.stroke();
              ctx.setLineDash([]);

              // Draw measurement bracket & label on first visible beat
              if (b === 0 && !isRhythmStrip && leadKey === 'II') {
                ctx.fillStyle = currentMeta.color;
                ctx.font = 'bold 9px monospace';
                ctx.fillText(
                  `[ ${currentMeta.shortName}: ${currentMeta.normalDurationMs.split(' ')[0]}ms ]`,
                  clampX1,
                  topY + 10
                );
              }
            }
          }
        }
      }

      // =======================================================================
      // STEP 2: RENDER CONTINUOUS ECG TRACE
      // =======================================================================
      ctx.beginPath();
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 1.4;

      let prevX = traceStartX;
      let prevY = yCenter;
      ctx.moveTo(prevX, prevY);

      for (let px = 0; px < traceWidth; px++) {
        const x = traceStartX + px;

        if (isVFib) {
          const f1 = Math.sin(px * 0.15) * 16;
          const f2 = Math.sin(px * 0.28 + 1.2) * 10;
          const f3 = Math.cos(px * 0.08) * 8;
          ctx.lineTo(x, yCenter + f1 + f2 + f3);
          continue;
        }

        const phase = (px % rrPixels) / rrPixels;
        let deflection = 0;

        let ampScale = isTamponade ? 0.38 : 1.0;
        if (isTamponade) {
          const beatNum = Math.floor(px / rrPixels);
          ampScale *= beatNum % 2 === 0 ? 1.3 : 0.7;
        }

        // P Wave
        if (!isAfib && !isHyperK) {
          if (phase > 0.12 && phase < 0.24) {
            const pPhase = (phase - 0.18) / 0.06;
            deflection -= 4.5 * Math.exp(-pPhase * pPhase * 4) * inv * ampScale;
          }
        } else if (isAfib) {
          deflection += Math.sin(px * 0.6) * 1.8;
        }

        // Q Wave
        if (phase > 0.34 && phase < 0.37 && leadQ > 0) {
          deflection += leadQ * inv * ampScale;
        }

        // R Wave
        if (phase >= 0.37 && phase <= 0.43) {
          const rPhase = (phase - 0.4) / 0.03;
          const activeR = isHyperK ? leadR * 1.3 : leadR;
          deflection -= activeR * Math.exp(-rPhase * rPhase * 6) * inv * ampScale;
        }

        // S Wave
        if (phase > 0.43 && phase < 0.48) {
          const sPhase = (phase - 0.45) / 0.03;
          const activeS = isHyperK ? leadS * 1.4 : leadS;
          deflection += activeS * Math.exp(-sPhase * sPhase * 6) * inv * ampScale;
        }

        // ST Segment & T Wave
        if (isStemiInferior && (leadKey === 'II' || leadKey === 'III' || leadKey === 'aVF')) {
          if (phase > 0.46 && phase < 0.78) {
            const stPhase = (phase - 0.6) / 0.16;
            deflection -= 18 * Math.exp(-stPhase * stPhase * 2.5);
          }
        } else if (isStemiInferior && (leadKey === 'I' || leadKey === 'aVL')) {
          if (phase > 0.46 && phase < 0.7) {
            const stPhase = (phase - 0.58) / 0.12;
            deflection += 8 * Math.exp(-stPhase * stPhase * 3.0);
          }
        } else if (isHyperK) {
          if (phase > 0.52 && phase < 0.72) {
            const tPhase = (phase - 0.62) / 0.08;
            deflection -= 26 * Math.exp(-tPhase * tPhase * 7) * inv * ampScale;
          }
        } else {
          if (phase > 0.54 && phase < 0.76) {
            const tPhase = (phase - 0.65) / 0.11;
            deflection -= leadT * Math.exp(-tPhase * tPhase * 4) * inv * ampScale;
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
        ctx.strokeStyle = 'rgba(185, 28, 28, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xStart, 0);
        ctx.lineTo(xStart, h - 68);
        ctx.stroke();
      }
    });

    // Row 4: Continuous Lead II Rhythm Strip across bottom
    const rhythmY = h - 35;
    ctx.strokeStyle = 'rgba(185, 28, 28, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, h - 70);
    ctx.lineTo(w, h - 70);
    ctx.stroke();

    drawLead('Lead II (Continuous Long Rhythm Strip for Arrhythmia & Rate Analysis)', 0, rhythmY, w, 'II', true);

    // ECG Footer metadata
    ctx.fillStyle = '#7f1d1d';
    ctx.font = '9.5px monospace';
    ctx.fillText('Paper Speed: 25 mm/s | Voltage: 10 mm/mV (1mV = 10mm) | High-pass 0.05 Hz | Low-pass 150 Hz | NMC & AHA Standard Format', 12, h - 6);
  }, [rhythm, heartRate, theme, activeSegment]);

  const activeMeta = SEGMENTS.find((s) => s.id === activeSegment);

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Interactive 12-Lead ECG Wave Segmentation Controller */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 font-mono">
              12-Lead Real-Time Wave Segmentation Walkthrough
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoWalking(!isAutoWalking)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg border transition-all ${
                isAutoWalking
                  ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              {isAutoWalking ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutoWalking ? 'Pause Tour' : '▶ Step-by-Step Tour'}</span>
            </button>
            <button
              onClick={() => {
                setIsAutoWalking(false);
                setActiveSegment('all');
              }}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-800"
              title="Reset to Full Trace"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Wave Segment Selection Pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => {
              setIsAutoWalking(false);
              setActiveSegment('all');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              activeSegment === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800/70 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Waves (Standard)
          </button>
          {SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              onClick={() => {
                setIsAutoWalking(false);
                setActiveSegment(seg.id);
              }}
              style={{
                borderColor: activeSegment === seg.id ? seg.color : undefined,
                backgroundColor: activeSegment === seg.id ? seg.bandColor : undefined,
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all ${
                activeSegment === seg.id
                  ? `${seg.textColor} border-2 font-bold shadow-sm scale-105`
                  : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              {seg.name}
            </button>
          ))}
        </div>
      </div>

      {/* Calibrated Pink 12-Lead Millimeter Grid Canvas */}
      <div className="w-full overflow-x-auto rounded-xl border-2 border-red-300 shadow-lg bg-[#fff5f5]">
        <canvas
          ref={canvasRef}
          width={840}
          height={490}
          className="w-full min-w-[760px] h-auto block cursor-crosshair"
        />
      </div>

      {/* Synchronized Real-Time Clinical Diagnostic Walkthrough HUD */}
      {activeMeta && (
        <div
          style={{ borderColor: activeMeta.color }}
          className="w-full bg-white dark:bg-slate-900 border-2 rounded-2xl p-4 shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span
                style={{ backgroundColor: activeMeta.color }}
                className="w-3 h-3 rounded-full"
              />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                {activeMeta.name} — Electrophysiological & Diagnostic Walkthrough
              </h4>
            </div>
            <span
              style={{ color: activeMeta.color }}
              className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
            >
              Normal Duration: {activeMeta.normalDurationMs}
            </span>
          </div>

          {/* High-Resolution Single-Beat Waveform Cut-Out & Diagnostic Visualization */}
          <div className="mb-3">
            <EcgMagnifiedCutoutCanvas
              segmentId={activeMeta.id}
              heartRate={heartRate}
              rhythm={rhythm}
              isLight={theme === 'light'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed">
            {/* Column 1: Biophysical Origin */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1 font-mono uppercase tracking-wider text-[10px]">
                ⚡ Biophysical & Conduction Origin
              </span>
              <p className="text-slate-600 dark:text-slate-300">{activeMeta.physioOrigin}</p>
            </div>

            {/* Column 2: Dipole Vector Projection */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1 font-mono uppercase tracking-wider text-[10px]">
                📐 3D Dipole Vector ({'V = D · L'})
              </span>
              <p className="text-slate-600 dark:text-slate-300 mb-1">{activeMeta.vectorExplanation}</p>
              <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-300 block">
                {activeMeta.leadsAnalysis}
              </span>
            </div>

            {/* Column 3: High-Yield Clinical Traps & Pathology */}
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
              <span className="font-bold text-rose-800 dark:text-rose-300 block mb-1 font-mono uppercase tracking-wider text-[10px]">
                🩺 Examiner Traps & Clinical Pearls
              </span>
              <p className="text-rose-900 dark:text-rose-200/90">{activeMeta.clinicalPearls}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
