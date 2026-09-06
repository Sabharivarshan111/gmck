import React, { useState, useEffect, useRef } from 'react';
import { DiagnosticToolType, PatientPathologyState, PatientVitals } from '../types';

interface DiagnosticToolsProps {
  tool: DiagnosticToolType;
  pathology: PatientPathologyState;
  vitals: PatientVitals;
  onClose: () => void;
}

export const DiagnosticTools: React.FC<DiagnosticToolsProps> = ({
  tool,
  pathology,
  vitals,
  onClose,
}) => {
  // Pupillometry state
  const [flashlightOn, setFlashlightOn] = useState<'none' | 'left' | 'right'>('none');

  // Ultrasound state
  const ultrasoundCanvasRef = useRef<HTMLCanvasElement>(null);
  const [usView, setUsView] = useState<'cardiac' | 'fast_morison' | 'lung'>('cardiac');

  // Stethoscope state
  const [stethSite, setStethSite] = useState<'mitral' | 'aortic' | 'lung_bases'>('mitral');
  const [isListening, setIsListening] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play auscultation sound
  useEffect(() => {
    if (!isListening) return;

    let timer: NodeJS.Timeout;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const playLubDub = () => {
        const now = ctx.currentTime;

        // Lub (S1) - lower pitch
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.frequency.setValueAtTime(65, now);
        osc1.frequency.exponentialRampToValueAtTime(45, now + 0.08);
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.11);

        // Dub (S2) - slightly higher pitch
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.setValueAtTime(95, now + 0.22);
        osc2.frequency.exponentialRampToValueAtTime(70, now + 0.30);
        gain2.gain.setValueAtTime(0.3, now + 0.22);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.22);
        osc2.stop(now + 0.33);

        // S3 Gallop sound if present
        if (pathology.heartSoundType === 's3_gallop') {
          const osc3 = ctx.createOscillator();
          const gain3 = ctx.createGain();
          osc3.frequency.setValueAtTime(40, now + 0.36);
          gain3.gain.setValueAtTime(0.2, now + 0.36);
          gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
          osc3.connect(gain3);
          gain3.connect(ctx.destination);
          osc3.start(now + 0.36);
          osc3.stop(now + 0.43);
        }
      };

      const intervalMs = (60 / vitals.heartRate) * 1000;
      playLubDub();
      timer = setInterval(playLubDub, intervalMs);
    } catch {
      // Ignore
    }

    return () => {
      clearInterval(timer);
    };
  }, [isListening, vitals.heartRate, pathology.heartSoundType]);

  // Ultrasound 2D sector simulation
  useEffect(() => {
    if (tool !== 'ultrasound') return;
    const canvas = ultrasoundCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const renderUS = () => {
      animId = requestAnimationFrame(renderUS);
      t += 0.05;

      const w = canvas.width;
      const h = canvas.height;

      // Dark background
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, w, h);

      // Draw Ultrasound Sector Cone
      const originX = w / 2;
      const originY = 30;
      const radius = h - 50;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.arc(originX, originY, radius, Math.PI * 0.3, Math.PI * 0.7);
      ctx.closePath();
      ctx.clip();

      // Speckle noise gradient
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      // Procedural echogenic structures
      if (usView === 'cardiac') {
        // Ventricle contracting chambers
        const beat = 1 + 0.15 * Math.sin(t * (vitals.heartRate / 60) * 4);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(originX - 30, originY + 140, 50 * beat, 70 * beat, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Myocardium wall (Echogenic hyperechoic white)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 12;
        ctx.stroke();

        // Pericardial Effusion fluid stripe (Anechoic Jet Black)
        if (vitals.cvp > 10) {
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 14;
          ctx.beginPath();
          ctx.arc(originX - 30, originY + 140, 68 * beat, 0, Math.PI * 2);
          ctx.stroke();

          // Marker text
          ctx.fillStyle = '#ef4444';
          ctx.font = '11px monospace';
          ctx.fillText('⚡ PERICARDIAL EFFUSION STRIPE', originX - 90, originY + 240);
        }
      } else if (usView === 'fast_morison') {
        // Morison's pouch: Liver vs Right Kidney interface
        ctx.fillStyle = '#334155'; // Liver parenchyma
        ctx.beginPath();
        ctx.ellipse(originX - 40, originY + 120, 110, 80, -0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b'; // Kidney
        ctx.beginPath();
        ctx.ellipse(originX + 50, originY + 160, 70, 45, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Anechoic free fluid if ascites or hemoperitoneum
        if (pathology.ascites > 0.3) {
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.moveTo(originX - 10, originY + 110);
          ctx.lineTo(originX + 30, originY + 130);
          ctx.lineTo(originX + 10, originY + 155);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#f59e0b';
          ctx.font = '11px monospace';
          ctx.fillText('▲ ANECHOIC FREE FLUID (MORISON)', originX - 80, originY + 230);
        }
      } else {
        // Lung Sliding (B-mode)
        ctx.strokeStyle = '#cbd5e1'; // Bright Pleural Line
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(originX - 140, originY + 80);
        ctx.lineTo(originX + 140, originY + 80);
        ctx.stroke();

        // Comet tail / B-lines in pulmonary edema
        if (pathology.lungSoundType === 'crackles') {
          for (let b = -80; b <= 80; b += 40) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(originX + b, originY + 80);
            ctx.lineTo(originX + b * 1.6, originY + radius);
            ctx.stroke();
          }
          ctx.fillStyle = '#38bdf8';
          ctx.font = '11px monospace';
          ctx.fillText('▲ MULTIPLE B-LINES (ALVEOLAR EDEMA)', originX - 95, originY + 220);
        }
      }

      ctx.restore();

      // Ultrasound Depth Scales
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      for (let d = 5; d <= 20; d += 5) {
        const dy = originY + (d / 20) * (radius - 20);
        ctx.fillText(`${d}cm`, originX + 120, dy);
        ctx.fillRect(originX + 112, dy - 3, 5, 1);
      }
    };

    renderUS();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [tool, usView, vitals, pathology]);

  if (tool === 'none') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
            <h3 className="font-bold text-sm text-cyan-400 tracking-wide uppercase">
              {tool === 'pupil' && '👁️ Bedside Pupillometer & Light Reflex Simulator'}
              {tool === 'ultrasound' && '📡 Virtual Point-of-Care Ultrasound (POCUS)'}
              {tool === 'stethoscope' && '🩺 Digital Auscultation Stethoscope'}
              {tool === 'ecg12' && '📈 Standard 12-Lead Electrocardiogram (ECG)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {/* ================= PUPILLOMETRY ================= */}
          {tool === 'pupil' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-6 bg-slate-950 p-6 rounded-xl border border-slate-800 text-center">
                {/* Left Eye */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Left Eye (OS)
                  </div>
                  <div className="relative w-36 h-36 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center shadow-inner overflow-hidden">
                    {/* Iris */}
                    <div className="w-28 h-28 rounded-full bg-amber-800/80 border border-amber-600/50 flex items-center justify-center">
                      {/* Pupil */}
                      <div
                        className="rounded-full bg-black transition-all duration-300 shadow-md"
                        style={{
                          width: `${(flashlightOn === 'left' ? pathology.pupilLeft * 0.55 : pathology.pupilLeft) * 12}px`,
                          height: `${(flashlightOn === 'left' ? pathology.pupilLeft * 0.55 : pathology.pupilLeft) * 12}px`,
                        }}
                      />
                    </div>
                    {/* Corneal reflection highlight */}
                    <div className="absolute top-7 left-7 w-4 h-4 rounded-full bg-white/70 blur-[1px]" />
                    {flashlightOn === 'left' && (
                      <div className="absolute inset-0 bg-yellow-300/30 backdrop-blur-[1px] animate-pulse" />
                    )}
                  </div>
                  <div className="font-mono text-cyan-400 text-sm font-bold">
                    {(flashlightOn === 'left' ? pathology.pupilLeft * 0.55 : pathology.pupilLeft).toFixed(1)} mm
                  </div>
                  <button
                    onClick={() => setFlashlightOn(flashlightOn === 'left' ? 'none' : 'left')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      flashlightOn === 'left'
                        ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-lg shadow-yellow-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    🔦 {flashlightOn === 'left' ? 'Light Active' : 'Shine Penlight'}
                  </button>
                </div>

                {/* Right Eye */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Right Eye (OD)
                  </div>
                  <div className="relative w-36 h-36 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center shadow-inner overflow-hidden">
                    {/* Iris */}
                    <div className="w-28 h-28 rounded-full bg-amber-800/80 border border-amber-600/50 flex items-center justify-center">
                      {/* Pupil */}
                      <div
                        className="rounded-full bg-black transition-all duration-300 shadow-md"
                        style={{
                          width: `${(flashlightOn === 'right' ? pathology.pupilRight * 0.55 : pathology.pupilRight) * 12}px`,
                          height: `${(flashlightOn === 'right' ? pathology.pupilRight * 0.55 : pathology.pupilRight) * 12}px`,
                        }}
                      />
                    </div>
                    {/* Corneal reflection highlight */}
                    <div className="absolute top-7 left-7 w-4 h-4 rounded-full bg-white/70 blur-[1px]" />
                    {flashlightOn === 'right' && (
                      <div className="absolute inset-0 bg-yellow-300/30 backdrop-blur-[1px] animate-pulse" />
                    )}
                  </div>
                  <div className="font-mono text-cyan-400 text-sm font-bold">
                    {(flashlightOn === 'right' ? pathology.pupilRight * 0.55 : pathology.pupilRight).toFixed(1)} mm
                  </div>
                  <button
                    onClick={() => setFlashlightOn(flashlightOn === 'right' ? 'none' : 'right')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      flashlightOn === 'right'
                        ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-lg shadow-yellow-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    🔦 {flashlightOn === 'right' ? 'Light Active' : 'Shine Penlight'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-slate-200">Clinical Interpretation:</div>
                <div>
                  • <strong>Direct Light Reflex:</strong> Cranial Nerve II (Optic) afferent limb →
                  Edinger-Westphal nucleus → Cranial Nerve III (Oculomotor) efferent limb.
                </div>
                <div>
                  • <strong>Consensual Reflex:</strong> Bilateral pretectal decussation via posterior commissure ensures equal simultaneous constriction.
                </div>
              </div>
            </div>
          )}

          {/* ================= POINT-OF-CARE ULTRASOUND (POCUS) ================= */}
          {tool === 'ultrasound' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Select Probe Preset:</span>
                <button
                  onClick={() => setUsView('cardiac')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold border transition-all ${
                    usView === 'cardiac'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Subxiphoid Cardiac
                </button>
                <button
                  onClick={() => setUsView('fast_morison')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold border transition-all ${
                    usView === 'fast_morison'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  eFAST Morison&apos;s Pouch
                </button>
                <button
                  onClick={() => setUsView('lung')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold border transition-all ${
                    usView === 'lung'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Lung (Pleura & B-lines)
                </button>
              </div>

              <div className="relative bg-[#05070a] rounded-xl overflow-hidden border border-slate-800 p-2 flex items-center justify-center">
                <canvas ref={ultrasoundCanvasRef} width={560} height={320} className="rounded" />
              </div>

              <div className="text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
                <span className="font-semibold text-cyan-400">Acoustic Findings: </span>
                {usView === 'cardiac' &&
                  (vitals.cvp > 10
                    ? 'Hypoechoic dark rim separating epicardium from pericardium, diagnostic of pericardial effusion.'
                    : 'Normal biventricular contractility, no pericardial fluid collection.')}
                {usView === 'fast_morison' &&
                  (pathology.ascites > 0.3
                    ? "Anechoic black fluid stripe detected between liver and kidney parenchyma in Morison's pouch."
                    : 'Clear hepatorenal interface with no free fluid collections.')}
                {usView === 'lung' &&
                  (pathology.lungSoundType === 'crackles'
                    ? 'Vertical hyperechoic reverberation artifacts originating from the pleural line (B-lines) indicating interstitial alveolar fluid.'
                    : 'Smooth horizontal A-lines with normal sliding pleural motion.')}
              </div>
            </div>
          )}

          {/* ================= STETHOSCOPE ================= */}
          {tool === 'stethoscope' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Auscultation Site:</span>
                <button
                  onClick={() => setStethSite('mitral')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold border transition-all ${
                    stethSite === 'mitral'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Mitral (Apex Beat)
                </button>
                <button
                  onClick={() => setStethSite('aortic')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold border transition-all ${
                    stethSite === 'aortic'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Aortic (2nd RICS)
                </button>
                <button
                  onClick={() => setStethSite('lung_bases')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold border transition-all ${
                    stethSite === 'lung_bases'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Bilateral Lung Bases
                </button>
              </div>

              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-4">
                <div
                  className={`w-28 h-28 rounded-full border-4 flex items-center justify-center text-4xl transition-all ${
                    isListening
                      ? 'border-emerald-500 bg-emerald-950/40 animate-pulse shadow-lg shadow-emerald-500/20'
                      : 'border-slate-700 bg-slate-800/40 text-slate-500'
                  }`}
                >
                  🩺
                </div>

                <button
                  onClick={() => setIsListening(!isListening)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm border shadow-lg transition-all ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 text-white border-red-400 shadow-red-500/30'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 border-emerald-400 shadow-emerald-500/30'
                  }`}
                >
                  {isListening ? '⏹ Stop Auscultation' : '▶ Place Stethoscope & Listen'}
                </button>

                <div className="font-mono text-xs text-slate-400">
                  Rate: <span className="text-emerald-400 font-bold">{Math.round(vitals.heartRate)} bpm</span>{' '}
                  | Rhythm:{' '}
                  <span className="text-cyan-400 font-bold">
                    {pathology.heartSoundType === 's3_gallop'
                      ? 'S1 + S2 + S3 Ventricular Gallop (Volume Overload)'
                      : 'Normal S1 & S2'}
                  </span>
                </div>
              </div>

              <div className="text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
                <strong>Bedside Teaching Note: </strong>
                {stethSite === 'mitral' &&
                  'S1 is generated by mitral and tricuspid valve closure. Best heard with the bell of the stethoscope in left lateral decubitus.'}
                {stethSite === 'aortic' &&
                  'S2 is louder at the base. Split into A2 (aortic) and P2 (pulmonic) during inspiration.'}
                {stethSite === 'lung_bases' &&
                  (pathology.lungSoundType === 'crackles'
                    ? 'Fine end-inspiratory crackles (crepitations) indicating fluid reopening atelectatic alveoli in cardiac failure or sepsis.'
                    : 'Clear vesicular breath sounds throughout bilateral lung fields.')}
              </div>
            </div>
          )}

          {/* ================= 12-LEAD ECG ================= */}
          {tool === 'ecg12' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Calibration: 25 mm/s, 10 mm/mV</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {pathology.ecgRhythm.toUpperCase().replace('_', ' ')}
                </span>
              </div>

              {/* Pink Medical Grid Paper with 12 Leads */}
              <div className="relative bg-[#ffebee] border-2 border-red-300 rounded-xl p-3 overflow-hidden shadow-inner text-slate-900 grid grid-cols-3 gap-2">
                {[
                  { name: 'I', stemi: false },
                  { name: 'aVR', stemi: false },
                  { name: 'V1', stemi: false },
                  { name: 'II', stemi: pathology.ecgRhythm === 'stemi_inferior' },
                  { name: 'aVL', stemi: false },
                  { name: 'V2', stemi: false },
                  { name: 'III', stemi: pathology.ecgRhythm === 'stemi_inferior' },
                  { name: 'aVF', stemi: pathology.ecgRhythm === 'stemi_inferior' },
                  { name: 'V3', stemi: false },
                  { name: 'V4', stemi: false },
                  { name: 'V5', stemi: false },
                  { name: 'V6', stemi: false },
                ].map((lead) => (
                  <div
                    key={lead.name}
                    className="relative bg-white/70 border border-red-200 rounded p-2 h-24 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-red-900">{lead.name}</span>
                      {lead.stemi && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1 rounded">
                          ▲ ST +3.5mm
                        </span>
                      )}
                    </div>
                    {/* SVG ECG Lead Path */}
                    <svg className="w-full h-12" viewBox="0 0 160 50">
                      <path
                        d={
                          lead.stemi
                            ? 'M 0,25 L 30,25 Q 38,20 45,25 L 55,25 L 60,35 L 65,5 L 72,12 L 105,12 Q 120,18 135,25 L 160,25'
                            : 'M 0,25 L 30,25 Q 38,20 45,25 L 55,25 L 60,35 L 65,5 L 70,30 L 80,25 Q 95,16 110,25 L 160,25'
                        }
                        fill="none"
                        stroke="#b71c1c"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </div>
                ))}
              </div>

              <div className="text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
                <span className="font-semibold text-red-400">Diagnostic Summary: </span>
                {pathology.ecgRhythm === 'stemi_inferior'
                  ? 'Hyperacute convex ST elevation in Leads II, III, and aVF with reciprocal ST depression in Lead I and aVL. Diagnostic of Acute Inferior Myocardial Infarction (RCA Occlusion).'
                  : pathology.ecgRhythm === 'vfib'
                  ? 'Disorganized, chaotic fibrillatory deflections without identifiable QRS complexes. Immediate CPR and asynchronous defibrillation required.'
                  : 'Normal Sinus Rhythm with normal axis, normal intervals, and no ischemic ST-T changes.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
