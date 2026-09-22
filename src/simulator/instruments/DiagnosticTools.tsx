import React, { useState, useEffect, useRef } from 'react';
import { DiagnosticToolType, PatientPathologyState, PatientVitals } from '../types';
import { StethoscopeAudioEngine, HeartSoundPreset, LungSoundPreset, AuscultationSite } from './StethoscopeSynthesizer';
import { Ecg12LeadCanvas } from './Ecg12LeadCanvas';
import { EcgIcuTutorialModal } from './EcgIcuTutorialModal';
import { PocusCanvas } from './pocus/PocusCanvas';
import { Volume2, VolumeX, Eye, Stethoscope, Radio, Activity, Sparkles, CheckCircle2, AlertTriangle, Info, GraduationCap } from 'lucide-react';

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
  const [stethVolume, setStethVolume] = useState<number>(1.2);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [customHeartOverride, setCustomHeartOverride] = useState<HeartSoundPreset | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const audioEngineRef = useRef<StethoscopeAudioEngine | null>(null);

  /**
   * Synchronous AudioContext unlock helper for iOS/macOS WebKit autoplay enforcement.
   */
  const ensureAudioUnlocked = () => {
    if (!audioEngineRef.current) {
      audioEngineRef.current = new StethoscopeAudioEngine();
    }
    audioEngineRef.current.unlock();
  };

  useEffect(() => {
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.dispose();
        audioEngineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setVolume(stethVolume);
    }
  }, [stethVolume]);

  // Update auscultation audio whenever isListening, site, vitals, or pathology changes
  useEffect(() => {
    if (!isListening) {
      if (audioEngineRef.current) {
        audioEngineRef.current.stopAll();
      }
      return;
    }

    const syncAudio = async () => {
      ensureAudioUnlocked();
      await audioEngineRef.current!.initialize();
      audioEngineRef.current!.setStethoscopeMode(stethMode);
      audioEngineRef.current!.setVolume(stethVolume);

      const isPulmonary =
        stethSite === 'lung_bases' || stethSite === 'lung_apices' || stethSite === 'trachea';

      if (isPulmonary) {
        audioEngineRef.current!.stopCardiacAuscultation();
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
        audioEngineRef.current!.startPulmonaryAuscultation(vitals.respiratoryRate, lungPreset);
      } else {
        audioEngineRef.current!.stopPulmonaryAuscultation();
        // Resolve heart sound preset with clinical routing & manual audition override
        let heartPreset: HeartSoundPreset = customHeartOverride || 'normal';
        if (!customHeartOverride) {
          if (vitals.cvp > 12 && vitals.meanArterialPressure < 65) {
            heartPreset = 'tamponade_muffled';
          } else if (pathology.heartSoundType === 's3_gallop') {
            heartPreset = 's3_gallop';
          } else if (pathology.heartSoundType === 's4_gallop') {
            heartPreset = 's4_gallop';
          } else if (pathology.heartSoundType === 'aortic_stenosis' || pathology.heartSoundType === 'murmur_systolic') {
            heartPreset = 'aortic_stenosis';
          } else if (pathology.heartSoundType === 'mitral_regurg') {
            heartPreset = 'mitral_regurg';
          } else if (pathology.heartSoundType === 'aortic_regurg') {
            heartPreset = 'aortic_regurg';
          } else if (pathology.heartSoundType === 'mitral_stenosis') {
            heartPreset = 'mitral_stenosis';
          } else if (pathology.heartSoundType === 'friction_rub') {
            heartPreset = 'friction_rub';
          }
        }
        audioEngineRef.current!.startCardiacAuscultation(vitals.heartRate, heartPreset);
      }
    };

    syncAudio();
  }, [isListening, stethSite, stethMode, vitals.heartRate, vitals.respiratoryRate, pathology, customHeartOverride]);

  if (tool === 'none') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-hidden sm:overflow-y-auto">
      <div className="relative w-full max-w-4xl h-[100dvh] sm:h-auto bg-slate-900 border-0 sm:border sm:border-slate-700 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col sm:my-auto max-h-[100dvh] sm:max-h-[92vh]">
        {/* Header Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
            <h3 className="min-w-0 truncate font-bold text-xs sm:text-sm text-cyan-400 tracking-wide uppercase">
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
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-2.5 sm:p-4 md:p-6 flex-1 overflow-y-auto overscroll-contain space-y-3 sm:space-y-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          {/* ================= 1. PUPILLOMETRY ================= */}
          {tool === 'pupil' && (
            <div className="space-y-4">
              {/* Penlight Control Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">Penlight Light Stimulus:</span>
                <div className="-mx-1 px-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setFlashlightOn(flashlightOn === 'left' ? 'none' : 'left')}
                    className={`min-h-[44px] shrink-0 px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer ${
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
                    className="min-h-[44px] shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-slate-700 cursor-pointer"
                  >
                    Off
                  </button>
                </div>
              </div>

              {/* Dual Eye Interactive Simulator */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 bg-slate-950 p-3 sm:p-5 rounded-2xl border border-slate-800 text-center">
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

                  <div className="relative w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center shadow-inner overflow-hidden">
                    {/* Sclera & Iris */}
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-amber-900 border border-amber-700 flex items-center justify-center relative">
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

                  <div className="relative w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center shadow-inner overflow-hidden">
                    {/* Sclera & Iris */}
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-amber-900 border border-amber-700 flex items-center justify-center relative">
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
              <div className="bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-sky-400" />
                  <span>Neuroanatomy of Pupillary Light Reflex (CN II & CN III):</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                  <div>
                    • <strong>Direct Light Reflex:</strong> Light entering the pupil stimulates retinal ganglion cells → Optic Nerve (CN II) afferents travel to the pretectal nucleus in the midbrain → bilateral projection to Edinger-Westphal nuclei → Oculomotor Nerve (CN III) parasympathetic efferents constrict the ipsilateral pupillary sphincter.
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
                      onClick={() => {
                        ensureAudioUnlocked();
                        setStethMode('bell');
                        audioEngineRef.current?.setStethoscopeMode('bell');
                      }}
                      onTouchStart={ensureAudioUnlocked}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        stethMode === 'bell'
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      🔔 Bell (Low Pitch)
                    </button>
                    <button
                      onClick={() => {
                        ensureAudioUnlocked();
                        setStethMode('diaphragm');
                        audioEngineRef.current?.setStethoscopeMode('diaphragm');
                      }}
                      onTouchStart={ensureAudioUnlocked}
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
                      onClick={() => {
                        ensureAudioUnlocked();
                        setStethSite(site.id as AuscultationSite);
                      }}
                      onTouchStart={ensureAudioUnlocked}
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

                {/* Medical-Grade Murmur Verification & Audition Suite */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold flex items-center gap-1.5 text-slate-200">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Clinically Verified Murmurs & Sounds (Medical-Grade DSP):</span>
                    </span>
                    {customHeartOverride && (
                      <button
                        onClick={() => {
                          ensureAudioUnlocked();
                          setCustomHeartOverride(null);
                        }}
                        onTouchStart={ensureAudioUnlocked}
                        className="text-[10px] text-amber-400 hover:underline cursor-pointer font-mono"
                      >
                        Reset to Case Default
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                    {[
                      { id: 'normal', label: 'Normal S1/S2', sub: 'M1-T1 & A2-P2 Splits' },
                      { id: 's3_gallop', label: 'S3 Gallop', sub: 'Ventricular Filling (CHF)' },
                      { id: 's4_gallop', label: 'S4 Gallop', sub: 'Atrial Kick (LVH / Stiff)' },
                      { id: 'aortic_stenosis', label: 'Aortic Stenosis', sub: 'Harsh Systolic Diamond' },
                      { id: 'mitral_regurg', label: 'Mitral Regurg', sub: 'Holosystolic Plateau' },
                      { id: 'aortic_regurg', label: 'Aortic Regurg', sub: 'Diastolic Decrescendo' },
                      { id: 'mitral_stenosis', label: 'Mitral Stenosis', sub: 'Opening Snap + Rumble' },
                      { id: 'friction_rub', label: 'Friction Rub', sub: 'Triphasic Leathery Scratch' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          ensureAudioUnlocked();
                          setCustomHeartOverride(m.id as HeartSoundPreset);
                          if (!isListening) setIsListening(true);
                          audioEngineRef.current?.setHeartPreset(m.id as HeartSoundPreset);
                        }}
                        onTouchStart={ensureAudioUnlocked}
                        className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          customHeartOverride === m.id
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                            : 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="font-bold text-[11px] truncate">{m.label}</span>
                        <span className="text-[9px] opacity-70 truncate">{m.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Auscultation Player Display */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3.5">
                <div
                  className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl transition-all ${
                    isListening
                      ? 'border-emerald-500 bg-emerald-950/40 animate-pulse shadow-lg shadow-emerald-500/30'
                      : 'border-slate-700 bg-slate-800/40 text-slate-500'
                  }`}
                >
                  🩺
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => {
                      ensureAudioUnlocked();
                      setIsListening(!isListening);
                    }}
                    onTouchStart={ensureAudioUnlocked}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm border shadow-lg transition-all cursor-pointer ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white border-red-400 shadow-red-500/30'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 border-emerald-400 shadow-emerald-500/30'
                    }`}
                  >
                    {isListening ? '⏹ Stop Stethoscope' : '▶ Place Stethoscope & Listen Live'}
                  </button>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <Volume2 className="w-4 h-4 text-slate-400" />
                    <input
                      type="range"
                      min="0.2"
                      max="1.8"
                      step="0.1"
                      value={stethVolume}
                      onChange={(e) => setStethVolume(parseFloat(e.target.value))}
                      className="w-20 accent-emerald-500 cursor-pointer"
                      title="Stethoscope Volume"
                    />
                    <span className="text-[10px] font-mono text-slate-400 min-w-[32px]">
                      {Math.round(stethVolume * 100)}%
                    </span>
                  </div>
                </div>

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
            <PocusCanvas vitals={vitals} pathology={pathology} theme={theme} />
          )}

          {/* ================= 4. 12-LEAD ECG ================= */}
          {tool === 'ecg12' && (
            <div className="space-y-2.5 sm:space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-300 gap-2">
                <div className="min-w-0">
                  <span className="hidden sm:block font-semibold mb-1">Standard 12-Lead Diagnostic Electrocardiograph</span>
                  <span className="inline-flex max-w-full truncate rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-[11px] text-cyan-300 font-bold">
                    Rhythm · {pathology.ecgRhythm.toUpperCase().replace('_', ' ')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTutorialOpen(true)}
                  className="min-h-[44px] shrink-0 flex items-center gap-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-[11px] sm:text-xs shadow-md transition-all cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden sm:inline">12-Lead Master Tutorial</span><span className="sm:hidden">Tutorial</span>
                </button>
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

      {/* 4-Tier Interactive ECG & ICU Tutorial Modal */}
      <EcgIcuTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        theme={theme}
      />
    </div>
  );
};
