import React, { useState, useEffect, useRef } from 'react';
import { DiagnosticToolType, PatientPathologyState, PatientVitals } from '../types';
import { StethoscopeAudioEngine, HeartSoundPreset, LungSoundPreset, AuscultationSite } from './StethoscopeSynthesizer';
import { Ecg12LeadCanvas } from './Ecg12LeadCanvas';
import { Volume2, VolumeX, Eye, Stethoscope, Radio, Activity, Sparkles, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface DiagnosticToolsProps {
  tool: DiagnosticToolType;
  pathology: PatientPathologyState;
  vitals: PatientVitals;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const DiagnosticTools: React.FC<DiagnosticToolsProps> = ({
  tool,
  pathology,
  vitals,
  onClose,
  theme = 'light',
}) => {
  const isLight = theme === 'light';

  // ============================================================================
  // 1. PUPILLOMETRY STATE & DIRECT/CONSENSUAL LIGHT REFLEX
  // ============================================================================
  const [flashlightOn, setFlashlightOn] = useState<'none' | 'left' | 'right' | 'both'>('none');

  // Compute dynamic pupil diameters based on direct & consensual reflex
  const computePupil = (side: 'left' | 'right') => {
    const isLeft = side === 'left';
    const base = isLeft ? pathology.pupilLeft : pathology.pupilRight;
    const canReact = isLeft ? pathology.pupilReactLeft : pathology.pupilReactRight;

    if (!canReact) return base;

    // Direct stimulation or Consensual stimulation from contralateral eye
    const directLight = isLeft
      ? flashlightOn === 'left' || flashlightOn === 'both'
      : flashlightOn === 'right' || flashlightOn === 'both';
    const consensualLight = isLeft
      ? flashlightOn === 'right' || flashlightOn === 'both'
      : flashlightOn === 'left' || flashlightOn === 'both';

    if (directLight || consensualLight) {
      // Physiological constriction (45% reduction from baseline, clamped to 1.8mm minimum)
      return Math.max(1.5, base * 0.55);
    }
    return base;
  };

  const currentPupilLeft = computePupil('left');
  const currentPupilRight = computePupil('right');

  // ============================================================================
  // 2. STETHOSCOPE WEB AUDIO STATE
  // ============================================================================
  const [stethSite, setStethSite] = useState<AuscultationSite>('mitral');
  const [stethMode, setStethMode] = useState<'bell' | 'diaphragm'>('diaphragm');
  const [isListening, setIsListening] = useState<boolean>(false);
  const audioEngineRef = useRef<StethoscopeAudioEngine | null>(null);

  useEffect(() => {
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.dispose();
        audioEngineRef.current = null;
      }
    };
  }, []);

  // Update auscultation audio whenever isListening, site, vitals, or pathology changes
  useEffect(() => {
    if (!isListening) {
      if (audioEngineRef.current) {
        audioEngineRef.current.stopCardiacAuscultation();
        audioEngineRef.current.stopPulmonaryAuscultation();
      }
      return;
    }

    const startAudio = async () => {
      if (!audioEngineRef.current) {
        audioEngineRef.current = new StethoscopeAudioEngine();
      }
      await audioEngineRef.current.initialize();
      audioEngineRef.current.setStethoscopeMode(stethMode);

      const isPulmonary =
        stethSite === 'lung_bases' || stethSite === 'lung_apices' || stethSite === 'trachea';

      if (isPulmonary) {
        audioEngineRef.current.stopCardiacAuscultation();
        // Resolve lung sound preset
        let lungPreset: LungSoundPreset = 'vesicular';
        if (stethSite === 'trachea') {
          lungPreset = pathology.cyanosis > 0.4 ? 'stridor' : 'bronchial';
        } else if (pathology.lungSoundType === 'crackles') {
          lungPreset = 'crackles';
        } else if (pathology.lungSoundType === 'wheeze') {
          lungPreset = 'wheeze';
        } else if (pathology.lungSoundType === 'bronchial') {
          lungPreset = 'bronchial';
        } else if (pathology.lungSoundType === 'silent') {
          lungPreset = 'silent';
        }
        audioEngineRef.current.startPulmonaryAuscultation(vitals.respiratoryRate, lungPreset);
      } else {
        audioEngineRef.current.stopPulmonaryAuscultation();
        // Resolve heart sound preset
        let heartPreset: HeartSoundPreset = 'normal';
        if (vitals.cvp > 12 && vitals.meanArterialPressure < 65) {
          heartPreset = 'tamponade_muffled';
        } else if (pathology.heartSoundType === 's3_gallop') {
          heartPreset = 's3_gallop';
        } else if (pathology.heartSoundType === 's4_gallop') {
          heartPreset = 's4_gallop';
        } else if (pathology.heartSoundType === 'murmur_systolic') {
          heartPreset = 'mitral_stenosis';
        } else if (pathology.heartSoundType === 'friction_rub') {
          heartPreset = 'friction_rub';
        }
        audioEngineRef.current.startCardiacAuscultation(vitals.heartRate, heartPreset);
      }
    };

    startAudio();
  }, [isListening, stethSite, stethMode, vitals.heartRate, vitals.respiratoryRate, pathology]);

  // ============================================================================
  // 3. POCUS ULTRASOUND CANVAS
  // ============================================================================
  const usCanvasRef = useRef<HTMLCanvasElement>(null);
  const [usView, setUsView] = useState<'cardiac' | 'fast_morison' | 'lung'>('cardiac');

  useEffect(() => {
    if (tool !== 'ultrasound') return;
    const canvas = usCanvasRef.current;
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

      // Sector Cone Geometry
      const originX = w / 2;
      const originY = 24;
      const radius = h - 40;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.arc(originX, originY, radius, Math.PI * 0.3, Math.PI * 0.7);
      ctx.closePath();
      ctx.clip();

      // Deep tissue background with Rayleigh speckle
      ctx.fillStyle = '#0a101d';
      ctx.fill();

      // Speckle noise dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      for (let i = 0; i < 60; i++) {
        const sx = originX + (Math.random() - 0.5) * radius * 1.4;
        const sy = originY + Math.random() * radius;
        ctx.fillRect(sx, sy, 2, 2);
      }

      if (usView === 'cardiac') {
        // Subxiphoid 4-Chamber Cardiac View
        const hr = vitals.heartRate;
        const beat = 1 + 0.14 * Math.sin(t * (hr / 60) * Math.PI * 2);
        const hasTamponade = vitals.cvp > 10;

        // Ventricular blood pool (Anechoic Jet Black)
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.ellipse(originX - 35, originY + 150, 48 * beat, 68 * beat, 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Myocardium / Interventricular Septum (Hyperechoic Gray-White)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 10;
        ctx.stroke();

        // Right Ventricular Free Wall (diastolic collapse in tamponade)
        if (hasTamponade) {
          // Circumferential Anechoic Pericardial Fluid Stripe
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 22;
          ctx.beginPath();
          ctx.arc(originX - 35, originY + 150, 78 * beat, 0, Math.PI * 2);
          ctx.stroke();

          // Fibrous Pericardium boundary (Echogenic bright white line)
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Diastolic RV collapse marker
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 11px monospace';
          ctx.fillText('▲ DIASTOLIC RV COLLAPSE (TAMPONADE)', originX - 110, originY + 250);
        } else {
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 11px monospace';
          ctx.fillText('✓ NORMAL CARDIAC CONTRACTILITY', originX - 100, originY + 250);
        }
      } else if (usView === 'fast_morison') {
        // eFAST: Hepatorenal Recess (Morison\'s Pouch)
        // Liver Parenchyma (Medium gray echotexture)
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.ellipse(originX - 45, originY + 130, 110, 80, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Right Kidney Parenchyma (Slightly darker with bright central sinus)
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(originX + 55, originY + 165, 75, 50, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Renal Pelvis / Central Sinus (Bright hyperechoic core)
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.ellipse(originX + 55, originY + 165, 30, 16, 0.3, 0, Math.PI * 2);
        ctx.fill();

        const hasFluid = pathology.ascites > 0.25 || vitals.lactate > 3.0;
        if (hasFluid) {
          // Free Anechoic Black Fluid Wedge in Morison's Pouch
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.moveTo(originX - 10, originY + 120);
          ctx.lineTo(originX + 35, originY + 140);
          ctx.lineTo(originX + 15, originY + 175);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 11px monospace';
          ctx.fillText("▲ POSITIVE FAST: FREE FLUID IN MORISON'S POUCH", originX - 130, originY + 245);
        } else {
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 11px monospace';
          ctx.fillText('✓ NEGATIVE FAST: NO RETROPERITONEAL FREE FLUID', originX - 125, originY + 245);
        }
      } else {
        // Lung Ultrasound
        const isTensionPneumo = vitals.spo2 < 82 && vitals.cvp > 12;
        const isEdema = pathology.lungSoundType === 'crackles';

        // Pleural Line (Bright horizontal hyperechoic line)
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(originX - 140, originY + 85);
        ctx.lineTo(originX + 140, originY + 85);
        ctx.stroke();

        if (isTensionPneumo) {
          // Absence of lung sliding (Stratosphere / Barcode Sign)
          for (let y = originY + 95; y < originY + radius - 30; y += 8) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(originX - 130, y);
            ctx.lineTo(originX + 130, y);
            ctx.stroke();
          }
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 11px monospace';
          ctx.fillText('▲ ABSENT LUNG SLIDING: BARCODE SIGN (PNEUMOTHORAX)', originX - 145, originY + 235);
        } else if (isEdema) {
          // Multiple B-Lines (Lung Rockets: vertical hyperechoic beams)
          for (let b = -80; b <= 80; b += 35) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(originX + b, originY + 85);
            ctx.lineTo(originX + b * 1.5, originY + radius);
            ctx.stroke();
          }
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 11px monospace';
          ctx.fillText('▲ MULTIPLE CONFLUENT B-LINES (ALVEOLAR EDEMA)', originX - 135, originY + 235);
        } else {
          // Normal horizontal A-lines (Reverberation)
          for (let a = 1; a <= 3; a++) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(originX - 130, originY + 85 + a * 45);
            ctx.lineTo(originX + 130, originY + 85 + a * 45);
            ctx.stroke();
          }
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 11px monospace';
          ctx.fillText('✓ NORMAL LUNG SLIDING & PHYSIOLOGICAL A-LINES', originX - 130, originY + 235);
        }
      }

      ctx.restore();

      // Ultrasound Depth Scales
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      for (let d = 4; d <= 18; d += 4) {
        const dy = originY + (d / 18) * (radius - 20);
        ctx.fillText(`${d}cm`, originX + 130, dy);
        ctx.fillRect(originX + 122, dy - 3, 5, 1);
      }
    };

    renderUS();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [tool, usView, vitals, pathology]);

  if (tool === 'none') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col my-auto max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
            <h3 className="font-bold text-sm text-cyan-400 tracking-wide uppercase">
              {tool === 'pupil' && '👁️ Bedside Pupillometer & Direct/Consensual Reflex Simulator'}
              {tool === 'ultrasound' && '📡 Virtual Point-of-Care Ultrasound (POCUS)'}
              {tool === 'stethoscope' && '🩺 Digital Auscultation Stethoscope & Sound Synthesizer'}
              {tool === 'ecg12' && '📈 Universal 12-Lead Electrocardiogram (ECG)'}
            </h3>
          </div>
          <button
            onClick={() => {
              if (audioEngineRef.current) {
                audioEngineRef.current.dispose();
                audioEngineRef.current = null;
              }
              setIsListening(false);
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto space-y-4">
          {/* ================= 1. PUPILLOMETRY ================= */}
          {tool === 'pupil' && (
            <div className="space-y-4">
              {/* Penlight Control Selector */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">Penlight Light Stimulus:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setFlashlightOn(flashlightOn === 'left' ? 'none' : 'left')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      flashlightOn === 'left'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    🔦 Left Eye (Direct L, Consensual R)
                  </button>
                  <button
                    onClick={() => setFlashlightOn(flashlightOn === 'right' ? 'none' : 'right')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      flashlightOn === 'right'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    🔦 Right Eye (Direct R, Consensual L)
                  </button>
                  <button
                    onClick={() => setFlashlightOn(flashlightOn === 'both' ? 'none' : 'both')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      flashlightOn === 'both'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    🔦 Both Eyes
                  </button>
                  <button
                    onClick={() => setFlashlightOn('none')}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-slate-700 cursor-pointer"
                  >
                    Off
                  </button>
                </div>
              </div>

              {/* Dual Eye Interactive Simulator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center">
                {/* Left Eye */}
                <div className="flex flex-col items-center space-y-2.5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Left Eye (Oculus Sinister - OS)</span>
                    {!pathology.pupilReactLeft && (
                      <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold">
                        FIXED
                      </span>
                    )}
                  </div>

                  <div className="relative w-40 h-40 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center shadow-inner overflow-hidden">
                    {/* Sclera & Iris */}
                    <div className="w-32 h-32 rounded-full bg-amber-900 border border-amber-700 flex items-center justify-center relative">
                      {/* Pupil */}
                      <div
                        className="rounded-full bg-black transition-all duration-200 shadow-xl"
                        style={{
                          width: `${Math.max(10, currentPupilLeft * 14)}px`,
                          height: `${Math.max(10, currentPupilLeft * 14)}px`,
                        }}
                      />
                    </div>
                    {/* Corneal reflection highlight */}
                    <div className="absolute top-8 left-8 w-4 h-4 rounded-full bg-white/70 blur-[0.5px]" />
                    {(flashlightOn === 'left' || flashlightOn === 'both') && (
                      <div className="absolute inset-0 bg-yellow-300/35 backdrop-blur-[0.5px] animate-pulse" />
                    )}
                  </div>

                  <div className="font-mono text-cyan-400 text-base font-black">
                    {currentPupilLeft.toFixed(1)} mm
                    <span className="text-xs font-normal text-slate-400 ml-1.5">
                      {currentPupilLeft < 2.0
                        ? '(Pinpoint Miosis)'
                        : currentPupilLeft > 6.0
                        ? '(Mydriasis / Blown)'
                        : '(Normal)'}
                    </span>
                  </div>
                </div>

                {/* Right Eye */}
                <div className="flex flex-col items-center space-y-2.5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Right Eye (Oculus Dexter - OD)</span>
                    {!pathology.pupilReactRight && (
                      <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold">
                        FIXED
                      </span>
                    )}
                  </div>

                  <div className="relative w-40 h-40 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center shadow-inner overflow-hidden">
                    {/* Sclera & Iris */}
                    <div className="w-32 h-32 rounded-full bg-amber-900 border border-amber-700 flex items-center justify-center relative">
                      {/* Pupil */}
                      <div
                        className="rounded-full bg-black transition-all duration-200 shadow-xl"
                        style={{
                          width: `${Math.max(10, currentPupilRight * 14)}px`,
                          height: `${Math.max(10, currentPupilRight * 14)}px`,
                        }}
                      />
                    </div>
                    {/* Corneal reflection highlight */}
                    <div className="absolute top-8 left-8 w-4 h-4 rounded-full bg-white/70 blur-[0.5px]" />
                    {(flashlightOn === 'right' || flashlightOn === 'both') && (
                      <div className="absolute inset-0 bg-yellow-300/35 backdrop-blur-[0.5px] animate-pulse" />
                    )}
                  </div>

                  <div className="font-mono text-cyan-400 text-base font-black">
                    {currentPupilRight.toFixed(1)} mm
                    <span className="text-xs font-normal text-slate-400 ml-1.5">
                      {currentPupilRight < 2.0
                        ? '(Pinpoint Miosis)'
                        : currentPupilRight > 6.0
                        ? '(Mydriasis / Blown)'
                        : '(Normal)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clinical Teaching Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-sky-400" />
                  <span>Neuroanatomy of Pupillary Light Reflex (CN II & CN III):</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                  <div>
                    • <strong>Direct Light Reflex:</strong> Light entering the pupil stimulates the retinal ganglion cells $	o$ Optic Nerve (CN II) afferents travel to the pretectal nucleus in the midbrain $	o$ bilateral projection to Edinger-Westphal nuclei $	o$ Oculomotor Nerve (CN III) parasympathetic efferents constrict the ipsilateral pupillary sphincter.
                  </div>
                  <div>
                    • <strong>Consensual Light Reflex:</strong> Axons decussate across the posterior commissure to the contralateral Edinger-Westphal nucleus, producing simultaneous equal constriction of the unilluminated eye.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. STETHOSCOPE AUSCULTATION ================= */}
          {tool === 'stethoscope' && (
            <div className="space-y-4">
              {/* Auscultation Site Picker */}
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-semibold flex items-center justify-between">
                  <span>Auscultation Site (Tap to Place Stethoscope):</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setStethMode('bell')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        stethMode === 'bell'
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      🔔 Bell (Low Pitch)
                    </button>
                    <button
                      onClick={() => setStethMode('diaphragm')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        stethMode === 'diaphragm'
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      🔘 Diaphragm (High Pitch)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                  {[
                    { id: 'mitral', label: 'Mitral / Apex', sub: '5th LICS MCL' },
                    { id: 'aortic', label: 'Aortic Area', sub: '2nd RICS' },
                    { id: 'tricuspid', label: 'Tricuspid', sub: '4th LICS' },
                    { id: 'pulmonic', label: 'Pulmonic', sub: '2nd LICS' },
                    { id: 'lung_bases', label: 'Lung Bases', sub: 'Bilateral Posterior' },
                    { id: 'trachea', label: 'Trachea / Stridor', sub: 'Anterior Neck' },
                  ].map((site) => (
                    <button
                      key={site.id}
                      onClick={() => setStethSite(site.id as AuscultationSite)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        stethSite === site.id
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md'
                          : 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="font-bold truncate">{site.label}</span>
                      <span className="text-[10px] text-slate-500 truncate">{site.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auscultation Player Display */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-4">
                <div
                  className={`w-28 h-28 rounded-full border-4 flex items-center justify-center text-4xl transition-all ${
                    isListening
                      ? 'border-emerald-500 bg-emerald-950/40 animate-pulse shadow-lg shadow-emerald-500/30'
                      : 'border-slate-700 bg-slate-800/40 text-slate-500'
                  }`}
                >
                  🩺
                </div>

                <button
                  onClick={() => setIsListening(!isListening)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm border shadow-lg transition-all cursor-pointer ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 text-white border-red-400 shadow-red-500/30'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 border-emerald-400 shadow-emerald-500/30'
                  }`}
                >
                  {isListening ? '⏹ Stop Stethoscope' : '▶ Place Stethoscope & Listen Live'}
                </button>

                <div className="font-mono text-xs text-slate-300 text-center space-y-1">
                  <div>
                    Site: <strong className="text-cyan-400 uppercase">{stethSite.replace('_', ' ')}</strong> | Mode:{' '}
                    <strong className="text-amber-400 uppercase">{stethMode}</strong>
                  </div>
                  <div>
                    Heart Rate: <strong className="text-rose-400">{Math.round(vitals.heartRate)} bpm</strong> | Resp Rate:{' '}
                    <strong className="text-teal-400">{Math.round(vitals.respiratoryRate)} /min</strong>
                  </div>
                </div>
              </div>

              {/* Auscultation Diagnostic Summary */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Auscultation Clinical Finding:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {stethSite === 'mitral' &&
                    (pathology.heartSoundType === 's3_gallop'
                      ? 'S1 + S2 + S3 Ventricular Gallop (Ken-tuck-y cadence). Early diastolic low-frequency filling sound indicative of acute ventricular volume overload in congestive heart failure.'
                      : pathology.heartSoundType === 'murmur_systolic'
                      ? 'Loud, snapping S1 followed by an Opening Snap (OS) and a rough, rumbling mid-diastolic murmur with presystolic accentuation (Mitral Stenosis).'
                      : 'Normal S1 and S2 closure sounds. S1 is louder than S2 at the apex.')}
                  {stethSite === 'aortic' &&
                    (vitals.cvp > 10
                      ? 'Distant, muffled heart sounds with reduced high-frequency valve closure components due to acoustic attenuation by surrounding pericardial fluid (Beck\'s Triad).'
                      : pathology.heartSoundType === 'friction_rub'
                      ? 'Triphasic superficial leathery rasping friction rub audible throughout systole and diastole (Acute Fibrinous Pericarditis).'
                      : 'Normal aortic closure sound (A2). Loud crisp high-frequency snap.')}
                  {(stethSite === 'lung_bases' || stethSite === 'lung_apices') &&
                    (pathology.lungSoundType === 'crackles'
                      ? 'Fine end-inspiratory crackles (crepitations) in bilateral dependent lung zones. Explosive opening of fluid-filled peripheral alveoli in pulmonary edema.'
                      : pathology.lungSoundType === 'wheeze'
                      ? 'High-pitched musical polyphonic expiratory wheezes throughout bilateral lung fields indicative of severe diffuse bronchospasm.'
                      : pathology.lungSoundType === 'silent'
                      ? 'SILENT CHEST: Complete absence of breath sounds despite severe respiratory distress. Impending respiratory arrest.'
                      : 'Normal vesicular breath sounds with rustling 3:1 inspiratory-to-expiratory ratio.')}
                  {stethSite === 'trachea' &&
                    (pathology.cyanosis > 0.4
                      ? 'Harsh monophonic inspiratory stridor over anterior neck indicating critical upper airway laryngeal obstruction in anaphylaxis.'
                      : 'Normal bronchial tubular breath sounds with distinct expiratory pause.')}
                </p>
              </div>
            </div>
          )}

          {/* ================= 3. POINT-OF-CARE ULTRASOUND (POCUS) ================= */}
          {tool === 'ultrasound' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 font-semibold">Probe & Scanning Preset:</span>
                <button
                  onClick={() => setUsView('cardiac')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    usView === 'cardiac'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  Subxiphoid Cardiac
                </button>
                <button
                  onClick={() => setUsView('fast_morison')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    usView === 'fast_morison'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  eFAST Morison's Pouch
                </button>
                <button
                  onClick={() => setUsView('lung')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    usView === 'lung'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  Lung Ultrasound (Pleura & B-lines)
                </button>
              </div>

              <div className="relative bg-[#05070a] rounded-2xl overflow-hidden border border-slate-800 p-2 flex items-center justify-center">
                <canvas ref={usCanvasRef} width={620} height={340} className="rounded-xl w-full h-auto max-h-[340px]" />
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Radio className="w-4 h-4" />
                  <span>Sonographic Interpretation:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {usView === 'cardiac' &&
                    (vitals.cvp > 10
                      ? 'Significant anechoic (jet black) fluid stripe completely separating the visceral epicardium from parietal pericardium. Diastolic right ventricular free wall collapse confirms tamponade hemodynamics.'
                      : 'Normal subxiphoid 4-chamber cardiac view. Biventricular wall thickening and contraction intact; no pericardial fluid collection.')}
                  {usView === 'fast_morison' &&
                    (pathology.ascites > 0.25 || vitals.lactate > 3.0
                      ? 'Pathological anechoic fluid wedge detected in the dependent hepatorenal recess (Morison\'s Pouch). Indicates hemoperitoneum or decompensated peritoneal fluid.'
                      : 'Clear, crisp hepatorenal interface with zero fluid collection in Morison\'s pouch.')}
                  {usView === 'lung' &&
                    (vitals.spo2 < 82 && vitals.cvp > 12
                      ? 'Abolition of normal sliding pleural movement. M-mode displays the pathognomonic "Stratosphere / Barcode Sign" diagnostic of Tension Pneumothorax.'
                      : pathology.lungSoundType === 'crackles'
                      ? 'Multiple vertical laser-like reverberation artifacts (B-lines / "Lung Rockets") extending from the pleural line to the bottom of the screen, diagnostic of alveolar pulmonary edema.'
                      : 'Normal physiological lung sliding with horizontal reverberation A-lines ("Seashore sign" on M-mode).')}
                </p>
              </div>
            </div>
          )}

          {/* ================= 4. 12-LEAD ECG ================= */}
          {tool === 'ecg12' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold">Standard 12-Lead Diagnostic Electrocardiograph:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  Rhythm: {pathology.ecgRhythm.toUpperCase().replace('_', ' ')}
                </span>
              </div>

              {/* Universal 12-Lead Canvas with Continuous Lead II Strip */}
              <Ecg12LeadCanvas rhythm={pathology.ecgRhythm} heartRate={vitals.heartRate} theme={theme} />

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-red-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span>Electrocardiographic Analysis:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {pathology.ecgRhythm.includes('stemi')
                    ? 'Hyperacute ST-segment elevation (+3.5 mm) in inferior leads (II, III, aVF) with reciprocal ST-segment depression in high lateral leads (I, aVL). Diagnostic of Acute Inferior Wall Myocardial Infarction.'
                    : pathology.ecgRhythm.includes('afib')
                    ? 'Absent P waves replaced by irregular baseline fibrillatory oscillations (f-waves) with irregularly irregular R-R intervals.'
                    : pathology.ecgRhythm.includes('hyperkalemia')
                    ? 'Tall, narrow, peaked "tented" T-waves and widening of the QRS complex indicative of severe hyperkalemic myocardial toxicity.'
                    : pathology.ecgRhythm.includes('tamponade')
                    ? 'Generalized low QRS voltage (<5 mm in limb leads) with Electrical Alternans (alternating QRS amplitude beat-to-beat due to pendulum swinging of the heart in pericardial fluid).'
                    : pathology.ecgRhythm.includes('vfib')
                    ? 'Chaotic, polymorphic, completely disorganized ventricular fibrillatory waveforms with zero coordinated cardiac output.'
                    : 'Normal Sinus Rhythm at standard paper speed 25 mm/s and calibration 10 mm/mV.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
