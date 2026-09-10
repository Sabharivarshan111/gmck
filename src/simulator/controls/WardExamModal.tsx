import React, { useState, useEffect, useRef } from 'react';
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
  // 1. PITTING EDEMA ENGINE STATE
  // ============================================================================
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [pressDurationSec, setPressDurationSec] = useState<number>(0);
  const [currentPitDepthMm, setCurrentPitDepthMm] = useState<number>(0);
  const [reboundTimerSec, setReboundTimerSec] = useState<number>(0);
  const [hasCompletedTest, setHasCompletedTest] = useState<boolean>(false);

  // Compute maximum pit depth based on Starling forces (CVP and fluid retention)
  const cvp = vitals.cvp;
  const ascites = pathology.ascites;
  // Extracellular volume index (EVI)
  const evi = Math.max(0, (cvp - 3) / 8) + ascites * 1.2;
  const maxPossibleDepthMm = Math.min(8.2, Math.max(0, evi * 3.8));

  // Pressing interval timer (up to 10 seconds)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPressing) {
      setHasCompletedTest(false);
      interval = setInterval(() => {
        setPressDurationSec((prev) => {
          const next = Math.min(10.0, prev + 0.1);
          // Indentation depth formula: d(t) = D_max * (1 - e^(-t / 2.5))
          const depth = maxPossibleDepthMm * (1 - Math.exp(-next / 2.5));
          setCurrentPitDepthMm(depth);
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPressing, maxPossibleDepthMm]);

  // Handle release: trigger recovery countdown
  const handleRelease = () => {
    if (!isPressing) return;
    setIsPressing(false);
    setHasCompletedTest(true);

    // Recovery tau proportional to fluid retention
    const tauReboundSec = 3.0 + evi * 18.0;
    const initialRecoverySeconds = Math.round(tauReboundSec * 2.5);
    setReboundTimerSec(initialRecoverySeconds);
  };

  // Rebound relaxation timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasCompletedTest && reboundTimerSec > 0) {
      timer = setInterval(() => {
        setReboundTimerSec((prev) => {
          if (prev <= 1) {
            setCurrentPitDepthMm(0);
            return 0;
          }
          setCurrentPitDepthMm((d) => Math.max(0, d * 0.94));
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hasCompletedTest, reboundTimerSec]);

  // NMC Pitting Edema Grade determination
  const getEdemaGrade = (depth: number) => {
    if (depth < 0.5) return { grade: '0+', label: 'Non-Pitting / No Edema', desc: 'No detectable tissue indentation.' };
    if (depth < 3.0) return { grade: '1+', label: '1+ Mild Pitting Edema', desc: '~2 mm indentation; disappears almost immediately (<5s).' };
    if (depth < 5.0) return { grade: '2+', label: '2+ Moderate Pitting Edema', desc: '~4 mm indentation; disappears in 10-15 seconds.' };
    if (depth < 7.0) return { grade: '3+', label: '3+ Severe Pitting Edema', desc: '~6 mm deep pit; persists >1 minute; swollen ankles (CHF).' };
    return { grade: '4+', label: '4+ Very Severe / Brawny Edema', desc: '~8 mm very deep pit; persists 2-5 minutes; gross pedal distortion (Cirrhosis).' };
  };

  const edemaResult = getEdemaGrade(currentPitDepthMm);

  // ============================================================================
  // 2. SCLERAL ICTERUS COLORIMETRY
  // ============================================================================
  const jaundiceLevel = pathology.jaundice; // 0.0 to 1.0
  const estimatedBilirubinMgDl = (0.6 + jaundiceLevel * 14.5).toFixed(1);

  const getScleralColor = (j: number) => {
    if (j < 0.15) return { color: '#f8fafc', label: 'Anicteric (Pearly White)', grade: 'Normal (< 1.2 mg/dL)' };
    if (j < 0.35) return { color: '#fef08a', label: 'Subclinical Icterus', grade: 'Mild (1.2 - 2.5 mg/dL)' };
    if (j < 0.70) return { color: '#fde047', label: 'Overt Jaundice (Canary Yellow)', grade: 'Moderate (2.5 - 7.0 mg/dL)' };
    return { color: '#eab308', label: 'Severe Deep Saffron Icterus', grade: 'Severe (> 7.0 mg/dL)' };
  };

  const icterusData = getScleralColor(jaundiceLevel);

  // ============================================================================
  // 3. PALLOR & CYANOSIS
  // ============================================================================
  const pallorLevel = pathology.pallor; // 0.0 to 1.0
  const cyanosisLevel = pathology.cyanosis; // 0.0 to 1.0
  const isPalmarCreasePale = pallorLevel > 0.65; // Hb < 7 g/dL
  const isCentralCyanosis = vitals.spo2 < 85;

  // ============================================================================
  // 4. ASCITES & SHIFTING DULLNESS TEST
  // ============================================================================
  const [isTilted, setIsTilted] = useState<boolean>(false);
  const hasAscites = pathology.ascites > 0.3;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm text-slate-100 tracking-wide">
                Bedside Ward Clinical Examination ("PICCLED" & Fluid Status)
              </h3>
              <p className="text-[11px] text-slate-400">
                NMC CBME Physical Diagnostics: Kundu Bedside Clinics & Bates Guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Apple HIG Segmented Navigation Tabs */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { id: 'edema', label: '💧 Pitting Edema Test', badge: edemaResult.grade },
              { id: 'icterus', label: '👁️ Scleral Icterus', badge: `${estimatedBilirubinMgDl} mg%` },
              { id: 'pallor', label: '🩸 Pallor & Cyanosis', badge: isPalmarCreasePale ? 'Hb<7' : 'Pink' },
              { id: 'ascites', label: '🌊 Ascites & Thrill', badge: hasAscites ? 'Positive' : 'Clear' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveExamTab(tab.id as any)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1 cursor-pointer ${
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
        <div className="p-5 md:p-6 flex-1 overflow-y-auto space-y-4">
          {/* ================= 1. PITTING EDEMA INTERACTIVE TESTER ================= */}
          {activeExamTab === 'edema' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Interactive Thumb Press Pad */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3.5 text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Site: Right Medial Malleolus / Anterior Tibia
                  </div>

                  {/* 10-Second Press & Hold Pad */}
                  <div
                    onMouseDown={() => {
                      setPressDurationSec(0);
                      setIsPressing(true);
                    }}
                    onMouseUp={handleRelease}
                    onTouchStart={() => {
                      setPressDurationSec(0);
                      setIsPressing(true);
                    }}
                    onTouchEnd={handleRelease}
                    className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center select-none cursor-pointer transition-all duration-150 ${
                      isPressing
                        ? 'border-emerald-400 bg-emerald-950/60 scale-95 shadow-xl shadow-emerald-500/30'
                        : hasCompletedTest && currentPitDepthMm > 1.0
                        ? 'border-amber-400 bg-amber-950/30 shadow-lg shadow-amber-500/20'
                        : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Hand className={`w-8 h-8 mb-1 ${isPressing ? 'text-emerald-400 animate-bounce' : 'text-slate-400'}`} />
                    <span className="text-xs font-black">
                      {isPressing ? `${pressDurationSec.toFixed(1)}s / 10s` : 'Press & Hold Thumb'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isPressing ? 'Sustained Compression' : '10s Firm Hold'}
                    </span>
                  </div>

                  {/* Indentation Depth Readout */}
                  <div className="font-mono text-center">
                    <div className="text-2xl font-black text-emerald-400">
                      {currentPitDepthMm.toFixed(1)} mm
                    </div>
                    <div className="text-xs font-bold text-slate-300">
                      {edemaResult.label}
                    </div>
                  </div>

                  {/* Recovery Timer Countdown */}
                  {reboundTimerSec > 0 && (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold animate-pulse">
                      ⏱ Rebound Recovery: {reboundTimerSec}s remaining
                    </div>
                  )}
                </div>

                {/* Starling Forces & Grading Breakdown */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5 mb-2">
                      <Droplets className="w-4 h-4 text-sky-400" />
                      <span>Starling Forces Equilibrium & Hemodynamics:</span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Central Venous Pressure (CVP):</span>
                        <span className="text-sky-400 font-bold">{vitals.cvp.toFixed(1)} mmHg</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Estimated Capillary Hydrostatic (Pc):</span>
                        <span className="text-rose-400 font-bold">{Math.round(0.8 * vitals.cvp + 15)} mmHg</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Plasma Oncotic Pressure (πc):</span>
                        <span className="text-amber-400 font-bold">
                          {hasAscites ? '14.2 mmHg (Hypoalbuminemia)' : '25.0 mmHg (Normal)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <strong className="text-emerald-400">Bedside Clinical Pearl (Kundu): </strong>
                    <span>
                      {cvp > 10
                        ? 'High right atrial filling pressures raise systemic capillary hydrostatic pressure, driving fluid transudation into gravity-dependent pretibial interstitial tissue (Right Heart Failure).'
                        : hasAscites
                        ? 'Cirrhotic portal hypertension and impaired hepatic albumin synthesis drop intravascular oncotic pressure, producing massive 4+ persistent pitting edema and tense ascites.'
                        : 'Euvolemic Starling equilibrium maintained. No significant interstitial fluid accumulation.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. SCLERAL ICTERUS PHOTOMETRY ================= */}
          {activeExamTab === 'icterus' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visual Scleral Inspection Eye Diagram */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3 text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Inspection: Superior Bulbar Sclera in Natural Daylight
                  </div>

                  {/* Sclera Simulation Eye */}
                  <div className="relative w-44 h-28 rounded-full border-4 border-slate-700 flex items-center justify-center overflow-hidden shadow-inner" style={{ backgroundColor: icterusData.color }}>
                    {/* Iris */}
                    <div className="w-24 h-24 rounded-full bg-amber-900 border-2 border-amber-700 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black" />
                    </div>
                    {/* Scleral vessels */}
                    <div className="absolute top-2 left-6 w-12 h-1 bg-red-400/40 rounded-full blur-[0.5px]" />
                    <div className="absolute bottom-3 right-8 w-16 h-1 bg-red-400/30 rounded-full blur-[0.5px]" />
                  </div>

                  <div className="font-mono">
                    <div className="text-lg font-bold text-amber-400">
                      {icterusData.label}
                    </div>
                    <div className="text-xs text-slate-400">
                      Serum Total Bilirubin: <strong>{estimatedBilirubinMgDl} mg/dL</strong>
                    </div>
                  </div>
                </div>

                {/* Diagnostic Criteria & Clinical Pearl */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>Scleral Icterus Examination Rules (NMC CBME):</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc pl-4 leading-relaxed">
                      <li>
                        <strong>Elastin Affinity:</strong> Bilirubin has an extraordinary affinity for elastin, which is highly concentrated in the bulbar sclera.
                      </li>
                      <li>
                        <strong>Superior Sclera:</strong> Must ask patient to look downwards while elevating the upper eyelid; superior sclera is protected from solar UV photo-oxidation.
                      </li>
                      <li>
                        <strong>Sublingual Mucosa:</strong> Second most sensitive site; inspected under the frenulum of the tongue.
                      </li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
                    <strong className="text-amber-400">Clinical Correlate: </strong>
                    <span>
                      {jaundiceLevel > 0.5
                        ? 'Overt clinical jaundice with dark cola-colored urine. Hallmarks of severe hepatocellular failure or decompensated liver disease.'
                        : 'Anicteric sclera. Hepatic bilirubin conjugation and biliary excretion pathways are functioning normally.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. PALLOR & CYANOSIS ================= */}
          {activeExamTab === 'pallor' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pallor Inspection Card */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
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
                    <strong>Kundu Bedside Pearl:</strong> Palmar creases are normally darker than surrounding skin when Hb &gt; 7 g/dL. When Hb drops below 7 g/dL, palmar creases lose all pink tint and become as pale as the surrounding palm.
                  </p>
                </div>

                {/* Cyanosis Inspection Card */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
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
                        {cyanosisLevel > 0.3 ? 'Acrocyanosis Present' : 'Normal Capillary Refill (<2s)'}
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
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Shifting Dullness Examination (&gt; 500 mL Fluid)
                  </div>

                  <div className="relative p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
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
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
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
