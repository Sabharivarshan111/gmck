import React, { useState, useEffect, useRef } from 'react';
import { DiagnosticToolType, PatientPathologyState, PatientVitals } from '../types';
import { StethoscopeAudioEngine, HeartSoundPreset, LungSoundPreset, AuscultationSite } from './StethoscopeSynthesizer';
import { resolveAuscultation, HEART_SOUND_DESCRIPTIONS, LUNG_SOUND_DESCRIPTIONS } from './auscultationRouting';
import { AuscultationTrainer } from './AuscultationTrainer';
import { SOUND_LIBRARY } from './auscultationSites';
import { Ecg12LeadCanvas } from './Ecg12LeadCanvas';
import { EcgIcuTutorialModal } from './EcgIcuTutorialModal';
import { EyeExamination } from './eye/EyeExamination';
import { RadiologyViewer } from './radiology/RadiologyViewer';
import { PocusCanvas } from './pocus/PocusCanvas';
import { Volume2, VolumeX, Stethoscope, Radio, Activity, Sparkles, CheckCircle2, AlertTriangle, Info, GraduationCap } from 'lucide-react';

interface DiagnosticToolsProps {
  tool: DiagnosticToolType;
  scenarioId?: string;
  pathology: PatientPathologyState;
  vitals: PatientVitals;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const DiagnosticTools: React.FC<DiagnosticToolsProps> = ({
  tool,
  scenarioId = '',
  pathology,
  vitals,
  onClose,
  theme = 'light',
}) => {
  const isLight = theme === 'light';

  // ============================================================================
  // 2. STETHOSCOPE WEB AUDIO STATE
  // ============================================================================
  const [stethSite, setStethSite] = useState<AuscultationSite>('mitral');
  const [stethMode, setStethMode] = useState<'bell' | 'diaphragm'>('diaphragm');
  const [stethVolume, setStethVolume] = useState<number>(1.2);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [customHeartOverride, setCustomHeartOverride] = useState<HeartSoundPreset | null>(null);
  const [customLungOverride, setCustomLungOverride] = useState<LungSoundPreset | null>(null);
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
    if (tool !== 'stethoscope') {
      audioEngineRef.current?.dispose();
      audioEngineRef.current = null;
      setIsListening(false);
    }
    setCustomHeartOverride(null);
    setCustomLungOverride(null);
  }, [tool, scenarioId]);

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

    let cancelled = false;
    const engine = audioEngineRef.current;
    const syncAudio = async () => {
      if (!engine) return;
      try {
        await engine.initialize();
        if (cancelled) return;
        engine.setStethoscopeMode(stethMode);
        engine.setVolume(stethVolume);
        const sound = resolveAuscultation(pathology, vitals, stethSite, scenarioId, customHeartOverride, customLungOverride);
        if (sound.pulmonary) {
          engine.stopCardiacAuscultation();
          engine.startPulmonaryAuscultation(vitals.respiratoryRate, sound.lung);
        } else {
          engine.stopPulmonaryAuscultation();
          engine.startCardiacAuscultation(vitals.heartRate, sound.heart, sound.atrialContraction);
        }
        setAudioError(null);
      } catch {
        if (!cancelled) {
          setAudioError('Audio could not start. Tap Listen again to retry.');
          setIsListening(false);
        }
      }
    };
    void syncAudio();
    return () => { cancelled = true; };
  }, [isListening, stethSite, stethMode, vitals.heartRate, vitals.respiratoryRate, vitals.cvp, pathology, customHeartOverride, customLungOverride, scenarioId]);

  if (tool === 'none' || tool === 'piccled') return null;

  return (
    <div data-testid={`diagnostic-${tool}`} role="dialog" aria-modal="true" aria-label="Diagnostic skill" className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-hidden sm:overflow-y-auto">
      <div className="relative w-full max-w-4xl h-[100dvh] sm:h-auto bg-slate-900 border-0 sm:border sm:border-slate-700 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col sm:my-auto max-h-[100dvh] sm:max-h-[92vh]">
        {/* Header Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
            <h3 className="min-w-0 font-bold text-sm text-cyan-400">
              <span className="sm:hidden">{tool === 'radiology' ? 'X-ray & MRI' : tool === 'pupil' ? 'Eyes & cranial nerves' : tool === 'ultrasound' ? 'Ultrasound / POCUS' : tool === 'stethoscope' ? 'Auscultation' : '12-lead ECG'}</span>
              <span className="hidden sm:inline">
              {tool === 'pupil' && '👁️ Interactive Eye & Cranial Nerve Examination'}
              {tool === 'radiology' && '🩻 Radiology reference viewer'}
              {tool === 'ultrasound' && '📡 Virtual Point-of-Care Ultrasound (POCUS)'}
              {tool === 'stethoscope' && '🩺 Digital Auscultation Stethoscope & Sound Synthesizer'}
              {tool === 'ecg12' && '📈 Universal 12-Lead Electrocardiogram (ECG)'}
              </span>
            </h3>
          </div>
          <button
            aria-label="Close diagnostic tool"
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
          {tool === 'pupil' && <EyeExamination pathology={pathology} />}

          {/* ================= 2. STETHOSCOPE AUSCULTATION ================= */}
          {tool === 'stethoscope' && (
            <AuscultationTrainer theme={theme} site={stethSite} mode={stethMode} volume={stethVolume}
              listening={isListening} override={customHeartOverride} lungOverride={customLungOverride} audioError={audioError}
              heartRate={vitals.heartRate} respiratoryRate={vitals.respiratoryRate} engineRef={audioEngineRef}
              description={(() => { const sound = resolveAuscultation(pathology, vitals, stethSite, scenarioId, customHeartOverride, customLungOverride); return sound.pulmonary ? LUNG_SOUND_DESCRIPTIONS[sound.lung] : HEART_SOUND_DESCRIPTIONS[sound.heart]; })()}
              onSite={site => { ensureAudioUnlocked(); setStethSite(site); }}
              onMode={mode => { ensureAudioUnlocked(); setStethMode(mode); }}
              onVolume={setStethVolume}
              onListen={() => { ensureAudioUnlocked(); setIsListening(value => !value); }}
              onLung={sound => { ensureAudioUnlocked(); setCustomLungOverride(sound); if (sound) setIsListening(true); }}
              onSound={sound => { ensureAudioUnlocked(); setCustomHeartOverride(sound); const demo = SOUND_LIBRARY.find(s => s.id === sound); if (demo) { setStethSite(demo.site); setIsListening(true); } }}
            />
          )}

          {/* ================= 3. POINT-OF-CARE ULTRASOUND (POCUS) ================= */}
          {tool === 'radiology' && <RadiologyViewer/>}
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
