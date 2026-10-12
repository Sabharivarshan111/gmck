import React, { useState } from 'react';
import { EdemaExamination, ScleralExamination } from '../instruments/bedside/ClinicalExaminations';
import { PatientVitals, PatientPathologyState } from '../types';
import {
  Activity,
  Droplets,
  Eye,
  Hand,
  Sparkles,
  Info,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Shield,
  X,
} from 'lucide-react';

interface WardExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  vitals: PatientVitals;
  pathology: PatientPathologyState;
  theme?: 'light' | 'dark';
}

export const WardExamModal: React.FC<WardExamModalProps> = ({
  isOpen,
  onClose,
  vitals,
  pathology,
  theme = 'light',
}) => {
  const isLight = theme === 'light';

  const [activeExamTab, setActiveExamTab] = useState<'edema' | 'icterus' | 'pallor' | 'ascites'>('edema');

  // ============================================================================
  // 3. PALLOR & CYANOSIS
  // ============================================================================
  const pallorLevel = pathology.pallor; // 0.0 to 1.0
  const cyanosisLevel = pathology.cyanosis; // 0.0 to 1.0
  const isPalmarCreasePale = pallorLevel > 0.65; // Teaching pallor intensity; not an estimate of hemoglobin.
  const isCentralCyanosis = vitals.spo2 < 85;

  // ============================================================================
  // 4. ASCITES & SHIFTING DULLNESS TEST
  // ============================================================================
  const [isTilted, setIsTilted] = useState<boolean>(false);
  const hasAscites = pathology.ascites > 0.3;

  if (!isOpen) return null;

  return (
    <div data-testid="ward-exam-modal" role="dialog" aria-modal="true" aria-label="General examination" className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-hidden sm:overflow-y-auto">
      <div className="relative w-full max-w-4xl h-[100dvh] sm:h-auto bg-slate-900 border-0 sm:border sm:border-slate-700 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col sm:my-auto max-h-[100dvh] sm:max-h-[92vh]">
        {/* Modal Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 sm:py-4 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-slate-100 tracking-wide truncate">
                General examination
              </h3>
              <p className="hidden sm:block text-[11px] text-slate-400">
                NMC CBME Physical Diagnostics: Kundu Bedside Clinics & Bates Guide
              </p>
            </div>
          </div>
          <button
            aria-label="Close bedside examination"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Apple HIG Segmented Navigation Tabs */}
        <div className="px-2.5 sm:px-3 py-2 sm:py-3 bg-slate-950/60 border-b border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { id: 'edema', label: 'Pitting edema', badge: '3D' },
              { id: 'icterus', label: 'Scleral icterus', badge: '3D' },
              { id: 'pallor', label: 'Pallor & cyanosis', badge: isPalmarCreasePale ? 'Pale' : 'Pink' },
              { id: 'ascites', label: 'Ascites & thrill', badge: hasAscites ? 'Positive' : 'Clear' },
            ].map((tab) => (
              <button
                key={tab.id}
                data-testid={`ward-tab-${tab.id}`}
                onClick={() => setActiveExamTab(tab.id as typeof activeExamTab)}
                className={`min-h-[44px] min-w-0 py-2 px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-between gap-1 cursor-pointer ${
                  activeExamTab === tab.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  activeExamTab === tab.id ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-2.5 sm:p-4 md:p-6 flex-1 overflow-y-auto overscroll-contain space-y-3 sm:space-y-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          {/* ================= 1. PITTING EDEMA INTERACTIVE TESTER ================= */}
          {activeExamTab === 'edema' && <EdemaExamination/>}
          {activeExamTab === 'icterus' && <ScleralExamination pathology={pathology}/>}
          {/* ================= 3. PALLOR & CYANOSIS ================= */}
          {activeExamTab === 'pallor' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pallor Inspection Card */}
                <div className="bg-slate-950 p-3 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Hand className="w-4 h-4 text-rose-400" />
                    <span>Palmar Crease & Conjunctival Pallor (Anemia):</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Estimated Hemoglobin:</span>
                      <span className={`font-bold ${isPalmarCreasePale ? 'text-rose-500' : 'text-emerald-400'}`}>
                        {isPalmarCreasePale ? '< 7.0 g/dL (Severe)' : '13.5 g/dL (Adequate)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Palmar Creases:</span>
                      <span className="font-bold text-slate-200">
                        {isPalmarCreasePale ? 'Bleached / Pale Creases' : 'Pink Erythema Present'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Lower Palpebral Conjunctiva:</span>
                      <span className="font-bold text-slate-200">
                        {pallorLevel > 0.6 ? 'Chalky White Pallor' : 'Pink Capillary Loops'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong>Examination point:</strong> Inspect the conjunctivae, palms and palmar creases in good light. Pallor can suggest anemia, but its appearance cannot determine an exact hemoglobin concentration; confirm with a blood count.
                  </p>
                </div>

                {/* Cyanosis Inspection Card */}
                <div className="bg-slate-950 p-3 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-sky-400" />
                    <span>Cyanosis: Central vs Peripheral:</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Arterial SpO2:</span>
                      <span className={`font-bold ${vitals.spo2 < 85 ? 'text-rose-400' : 'text-teal-400'}`}>
                        {Math.round(vitals.spo2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Central (Tongue & Lips):</span>
                      <span className="font-bold text-slate-200">
                        {isCentralCyanosis ? 'Purplish-Blue Discoloration' : 'Normal Rose Pink'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Peripheral (Nailbeds):</span>
                      <span className="font-bold text-slate-200">
                        {cyanosisLevel > 0.3 ? 'Acrocyanosis Present' : 'No peripheral cyanosis simulated'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong>Diagnostic Differentiator:</strong> Central cyanosis involves warm high-perfusion mucous membranes (dorsum of tongue) and does NOT reverse with local warming, indicating serious arterial hypoxemia or right-to-left shunting.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= 4. ASCITES & ABDOMINAL FLUID ================= */}
          {activeExamTab === 'ascites' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Shifting Dullness Simulator */}
                <div className="bg-slate-950 p-3 sm:p-5 rounded-2xl border border-slate-800 space-y-3 text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Shifting Dullness Examination (&gt; 500 mL Fluid)
                  </div>

                  <div className="relative p-3 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-around text-xs font-mono">
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                        Midline / Umbilicus: <strong className="text-emerald-400">Resonant (Air)</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                        Flank Percussion:{' '}
                        <strong className={hasAscites ? 'text-rose-400' : 'text-emerald-400'}>
                          {hasAscites ? (isTilted ? 'Shifts to Resonant' : 'Dull (Fluid)') : 'Resonant'}
                        </strong>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsTilted(!isTilted)}
                      className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isTilted
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      🔄 {isTilted ? 'Patient in 45° Lateral Tilt' : 'Roll Patient to 45° Lateral Decubitus'}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 text-left leading-relaxed">
                    <strong>Shifting Dullness Sign:</strong> {hasAscites ? 'POSITIVE. As the patient turns, the fluid moves to the dependent flank under gravity, while air-filled bowel loops float up, turning the previously dull flank resonant.' : 'NEGATIVE. Percussion is resonant throughout without flank dullness.'}
                  </p>
                </div>

                {/* Fluid Wave / Thrill Test */}
                <div className="bg-slate-950 p-3 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-sky-400" />
                    <span>Fluid Wave / Thrill Test (&gt; 2000 mL Tense Ascites):</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Midline Ulnar Barrier:</span>
                      <span className="text-emerald-400 font-bold">Applied (Damps fat vibrations)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Fluid Thrill Transmission:</span>
                      <span className={`font-bold ${hasAscites ? 'text-rose-400' : 'text-slate-400'}`}>
                        {hasAscites ? 'POSITIVE SHOCKWAVE DETECTED' : 'NEGATIVE'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    <strong>Technique (Macleod):</strong> Assistant presses the ulnar border of their hand firmly down the midline to prevent skin impulse transmission. Examiner taps one flank while feeling the opposite flank. A distinct hydrodynamic shockwave confirms massive free intraperitoneal fluid.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
