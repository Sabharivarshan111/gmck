import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  GraduationCap,
  Activity,
  Heart,
  Zap,
  HelpCircle,
  ChevronRight,
  Compass,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Maximize2,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Info,
  Eye,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { InteractiveCardiacEngineMaster } from './cardiac-engine/InteractiveCardiacEngineMaster';

interface EcgIcuTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

type TutorialLevel = 'lkg' | 'med_student' | 'resident' | 'specialist';

// =====================================================================
// VISUAL MODULE 1: 2-STROKE HEART PUMP SIMULATOR (Cross-Section SVG)
// =====================================================================
const HeartPumpVisualizer: React.FC<{ isLight: boolean }> = ({ isLight }) => {
  const [phase, setPhase] = useState<'diastole' | 'systole'>('diastole');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [selectedElement, setSelectedElement] = useState<string | null>('mitral');

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPhase((prev) => (prev === 'diastole' ? 'systole' : 'diastole'));
    }, 1400);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const isDiastole = phase === 'diastole';

  const elementDetails: Record<string, { title: string; desc: string; sound: string; clinical: string }> = {
    mitral: {
      title: 'Mitral (Bicuspid) & Tricuspid Valves',
      desc: isDiastole
        ? 'OPEN in Diastole: Allows blood to rush from atria into the ventricles.'
        : 'SNAP SHUT in Systole: High ventricular pressure slams AV valves shut, producing the first heart sound.',
      sound: '🔊 LUB (S1 Sound)',
      clinical: 'Regurgitation: Leaky mitral valve causes blood to squirt backwards into Left Atrium (pansystolic blowing murmur).',
    },
    aortic: {
      title: 'Aortic & Pulmonic Semilunar Valves',
      desc: isDiastole
        ? 'CLOSED in Diastole: Prevents blood from leaking back into ventricles from high-pressure aorta (80 mmHg).'
        : 'FLY OPEN in Systole: Ventricle pressure exceeds aorta (120 mmHg), flinging valves open to eject blood.',
      sound: '🔊 DUB (S2 Sound)',
      clinical: 'Stenosis: Calcified narrow aortic valve causes harsh systolic crescendo-decrescendo ejection murmur.',
    },
    lv: {
      title: 'Left Ventricle (The Main Engine)',
      desc: isDiastole
        ? 'RELAXING & FILLING (End-Diastolic Volume ~120 mL). Compliance allows low pressure (5-10 mmHg).'
        : 'POWERFUL SQUEEZE: Pressure spikes from 8 to 120 mmHg, ejecting ~70 mL Stroke Volume into the body.',
      sound: 'Ejection Fraction ~ 60%',
      clinical: 'Heart Failure: In systolic dysfunction, LV cannot squeeze (EF < 40%); blood backs up into lungs causing pulmonary edema.',
    },
    rv: {
      title: 'Right Ventricle (Low-Pressure Pulmonary Pump)',
      desc: isDiastole
        ? 'Refills with deoxygenated blue venous blood from superior/inferior vena cava.'
        : 'Pumps blood into the low-resistance pulmonary circuit (peak pressure only ~25 mmHg).',
      sound: 'Pulmonary Flow: 5 L/min',
      clinical: 'Pulmonary Embolism: Clot in pulmonary artery blocks RV outflow, causing acute cor pulmonale and right heart failure.',
    },
  };

  const currentInfo = selectedElement ? elementDetails[selectedElement] : elementDetails.mitral;

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-lg'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-black">
              💧
            </div>
            <h4 className="font-bold text-sm tracking-tight">1. The Heart is a 2-Stroke Hydraulic Pump</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Watch the cross-section squeeze and relax. Observe valve leaflets snapping shut and generating heart sounds.
          </p>
        </div>

        {/* Phase & Play Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => {
              setIsPlaying(false);
              setPhase('diastole');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-none ${
              isDiastole
                ? 'bg-sky-500 text-white shadow-sm ring-2 ring-sky-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            1. Diastole (Refill)
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setPhase('systole');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-none ${
              !isDiastole
                ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            2. Systole (Eject)
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all"
            title={isPlaying ? 'Pause Animation' : 'Auto-Play Animation'}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-amber-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Animated Heart Pump Cross-Section SVG */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden">
          {/* Sound & Phase Announcement Banner */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all ${
                isDiastole
                  ? 'bg-sky-500/90 text-white border border-sky-300/30'
                  : 'bg-rose-500/90 text-white border border-rose-300/30 animate-pulse'
              }`}
            >
              {isDiastole ? '🌊 DIASTOLE: Filling Chambers' : '⚡ SYSTOLE: Ejecting Blood'}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1 transition-all ${
                isDiastole
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-bounce'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              {isDiastole ? 'DUB (S2)' : 'LUB (S1)'}
            </span>
          </div>

          <svg
            viewBox="0 0 380 320"
            className="w-full max-w-[360px] h-auto my-2 select-none"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
          >
            <defs>
              {/* Blood gradients */}
              <linearGradient id="deoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e40af" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="oxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#991b1b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <radialGradient id="sparkGrad">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
                <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Vena Cava and Aorta Great Vessels */}
            {/* Superior Vena Cava (Blue) */}
            <path d="M 100 20 L 100 85 L 125 85 L 125 20 Z" fill="#1e3a8a" opacity="0.8" />
            <text x="112" y="45" fill="#93c5fd" fontSize="9" fontWeight="bold" textAnchor="middle">SVC</text>

            {/* Aorta Arch (Red) */}
            <path
              d="M 180 85 C 180 25, 260 20, 265 85 L 245 85 C 240 45, 198 45, 198 85 Z"
              fill="#991b1b"
              opacity="0.9"
            />
            {/* 3 Brachiocephalic branches */}
            <line x1="205" y1="42" x2="200" y2="15" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
            <line x1="225" y1="36" x2="225" y2="15" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
            <line x1="245" y1="42" x2="250" y2="15" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
            <text x="225" y="65" fill="#fca5a5" fontSize="9" fontWeight="bold" textAnchor="middle">AORTA</text>

            {/* Pulmonary Trunk (Blue Arch crossing in front) */}
            <path
              d="M 145 95 C 145 50, 185 50, 185 95 Z"
              fill="#2563eb"
              opacity="0.85"
            />

            {/* Left Atrium (Red, Top Right) */}
            <rect
              x="205"
              y="85"
              width="85"
              height="60"
              rx="14"
              fill="url(#oxGrad)"
              opacity="0.95"
              className="cursor-pointer hover:opacity-100"
              onClick={() => setSelectedElement('mitral')}
            />
            <text x="247" y="118" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
              Left Atrium
            </text>

            {/* Right Atrium (Blue, Top Left) */}
            <rect
              x="90"
              y="85"
              width="85"
              height="60"
              rx="14"
              fill="url(#deoxGrad)"
              opacity="0.95"
              className="cursor-pointer hover:opacity-100"
              onClick={() => setSelectedElement('rv')}
            />
            <text x="132" y="118" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
              Right Atrium
            </text>

            {/* Ventricles Outer Muscular Frame (Contracts inward on systole) */}
            <g
              transform={`translate(190, 220) scale(${isDiastole ? '1' : '0.92'}) translate(-190, -220)`}
              style={{ transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              {/* Left Ventricle (Thick Wall, high pressure) */}
              <path
                d="M 190 145 L 290 145 C 295 210, 240 285, 190 295 Z"
                fill="url(#oxGrad)"
                stroke="#7f1d1d"
                strokeWidth={isDiastole ? '6' : '10'}
                className="cursor-pointer"
                onClick={() => setSelectedElement('lv')}
              />
              <text x="238" y="225" fill="#ffffff" fontSize="12" fontWeight="black" textAnchor="middle">
                Left Ventricle
              </text>
              <text x="238" y="240" fill="#fecaca" fontSize="9" textAnchor="middle">
                {isDiastole ? 'Relaxed (10 mmHg)' : 'Squeezing (120 mmHg)'}
              </text>

              {/* Right Ventricle (Crescent Wall, lower pressure) */}
              <path
                d="M 190 145 L 90 145 C 85 210, 140 285, 190 295 Z"
                fill="url(#deoxGrad)"
                stroke="#1e3a8a"
                strokeWidth={isDiastole ? '4' : '7'}
                className="cursor-pointer"
                onClick={() => setSelectedElement('rv')}
              />
              <text x="142" y="225" fill="#ffffff" fontSize="12" fontWeight="black" textAnchor="middle">
                Right Ventricle
              </text>
              <text x="142" y="240" fill="#bfdbfe" fontSize="9" textAnchor="middle">
                {isDiastole ? 'Relaxed (4 mmHg)' : 'Squeezing (25 mmHg)'}
              </text>

              {/* Interventricular Septum divider line */}
              <line x1="190" y1="145" x2="190" y2="295" stroke="#f87171" strokeWidth="8" strokeLinecap="round" />
            </g>

            {/* VALVES: AV (Mitral/Tricuspid) and Semilunar (Aortic/Pulmonic) */}
            {/* Left AV Valve (Mitral Valve at x=247, y=145) */}
            <g
              className="cursor-pointer"
              onClick={() => setSelectedElement('mitral')}
            >
              {isDiastole ? (
                // OPEN Leaflets pointing downwards into LV + Flow Arrows
                <g>
                  <line x1="225" y1="145" x2="235" y2="168" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
                  <line x1="265" y1="145" x2="255" y2="168" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
                  {/* Downward flow arrow */}
                  <path d="M 247 135 L 247 175 M 241 167 L 247 177 L 253 167" stroke="#ffffff" strokeWidth="3" fill="none" />
                </g>
              ) : (
                // SHUT tightly with vibrating shockwave
                <g>
                  <line x1="222" y1="145" x2="272" y2="145" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" />
                  <circle cx="247" cy="145" r="14" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3" opacity="0.8" />
                  <text x="247" y="140" fill="#fef08a" fontSize="8" fontWeight="bold" textAnchor="middle">S1 LUB</text>
                </g>
              )}
            </g>

            {/* Right AV Valve (Tricuspid Valve at x=132, y=145) */}
            <g
              className="cursor-pointer"
              onClick={() => setSelectedElement('mitral')}
            >
              {isDiastole ? (
                <g>
                  <line x1="110" y1="145" x2="120" y2="168" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
                  <line x1="150" y1="145" x2="140" y2="168" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 132 135 L 132 175 M 126 167 L 132 177 L 138 167" stroke="#ffffff" strokeWidth="3" fill="none" />
                </g>
              ) : (
                <g>
                  <line x1="107" y1="145" x2="157" y2="145" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" />
                  <circle cx="132" cy="145" r="14" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3" opacity="0.8" />
                </g>
              )}
            </g>

            {/* Aortic Semilunar Valve (Outflow from LV upward) */}
            <g
              className="cursor-pointer"
              onClick={() => setSelectedElement('aortic')}
            >
              {isDiastole ? (
                // CLOSED to hold diastolic blood pressure in aorta
                <g>
                  <line x1="192" y1="88" x2="218" y2="88" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                  <circle cx="205" cy="88" r="10" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="2,2" opacity="0.7" />
                  <text x="205" y="80" fill="#fca5a5" fontSize="8" fontWeight="bold" textAnchor="middle">S2 DUB</text>
                </g>
              ) : (
                // FLY OPEN with high velocity upward blood stream
                <g>
                  <line x1="195" y1="88" x2="197" y2="68" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
                  <line x1="215" y1="88" x2="213" y2="68" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 205 110 L 205 50 M 199 60 L 205 48 L 211 60" stroke="#fef08a" strokeWidth="3.5" fill="none" />
                </g>
              )}
            </g>
          </svg>

          {/* Interactive Tap Guides */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-1 text-[11px] font-mono">
            <button
              onClick={() => setSelectedElement('mitral')}
              className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                selectedElement === 'mitral'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              Mitral & Tricuspid (S1)
            </button>
            <button
              onClick={() => setSelectedElement('aortic')}
              className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                selectedElement === 'aortic'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              Aortic & Pulmonic (S2)
            </button>
            <button
              onClick={() => setSelectedElement('lv')}
              className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                selectedElement === 'lv'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              Left Ventricle
            </button>
            <button
              onClick={() => setSelectedElement('rv')}
              className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                selectedElement === 'rv'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              Right Ventricle
            </button>
          </div>
        </div>

        {/* Dynamic Detail Card */}
        <div className="lg:col-span-5 space-y-3">
          <div
            className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" />
                {currentInfo.title}
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                {currentInfo.sound}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {currentInfo.desc}
            </p>
            <div
              className={`mt-3 p-2.5 rounded-lg border text-[11px] ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/40 border-amber-800 text-amber-300'
              }`}
            >
              <strong>🩺 Clinical Correlation:</strong> {currentInfo.clinical}
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border text-xs space-y-1.5 ${
              isLight ? 'bg-sky-50/70 border-sky-200 text-sky-900' : 'bg-sky-950/30 border-sky-900 text-sky-300'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              The Kindergarten Golden Pump Rule:
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              When ventricles squeeze, valves behind them must <strong>SLAM SHUT</strong> (Lub), and valves in front must <strong>FLY OPEN</strong>. When valves leak or narrow, you hear turbulent whistling: <strong>A Heart Murmur!</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// VISUAL MODULE 2: ELECTRICAL CONDUCTION HIGHWAY & LIVE ECG DRAWING
// =====================================================================
const ConductionHighwayVisualizer: React.FC<{ isLight: boolean }> = ({ isLight }) => {
  const [step, setStep] = useState<number>(0);
  const [isAuto, setIsAuto] = useState<boolean>(true);

  useEffect(() => {
    if (!isAuto) return;
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 1800);
    return () => clearInterval(timer);
  }, [isAuto]);

  const stepsData = [
    {
      id: 0,
      title: '1. SA Node Sparks',
      subtitle: 'Atrial Depolarization',
      badge: 'P WAVE (0.08 - 0.10s)',
      color: 'amber',
      meaning: 'Natural battery at top of Right Atrium fires. Electricity sweeps across atria like ripples on a pond, commanding both atria to squeeze.',
      ecgHighlight: 'p',
    },
    {
      id: 1,
      title: '2. AV Node Gatekeeper Delay',
      subtitle: 'The 0.10s Traffic Pause',
      badge: 'PR SEGMENT (Isoelectric)',
      color: 'sky',
      meaning: 'Electricity reaches the AV Node and is intentionally SLOWED DOWN for 100 milliseconds. This critical pause allows atria to completely empty blood into ventricles before ventricles contract!',
      ecgHighlight: 'pr',
    },
    {
      id: 2,
      title: '3. His-Purkinje Ventricular Blast',
      subtitle: 'Ventricular Depolarization',
      badge: 'QRS COMPLEX (< 0.12s)',
      color: 'emerald',
      meaning: 'Electricity explodes down the Bundle of His and Purkinje fiber highway at 4 meters/second! Both massive ventricles fire simultaneously in a fraction of a second, rocketing blood into the body.',
      ecgHighlight: 'qrs',
    },
    {
      id: 3,
      title: '4. Cellular Battery Recharge',
      subtitle: 'Ventricular Repolarization',
      badge: 'T WAVE (0.16s)',
      color: 'purple',
      meaning: 'After the mechanical blast, billions of ventricular muscle cells pump Potassium back in and Sodium out to recharge their electrical battery for the next beat.',
      ecgHighlight: 't',
    },
  ];

  const currentStep = stepsData[step];

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-lg'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
              ⚡
            </div>
            <h4 className="font-bold text-sm tracking-tight">2. The Electrical Wiring Highway & Synchronized ECG</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Follow the spark from SA Node down through Purkinje fibers. See how each electrical event directly paints the ECG wave!
          </p>
        </div>

        {/* Stepper controls */}
        <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto">
          {stepsData.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                setIsAuto(false);
                setStep(idx);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                step === idx
                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {idx + 1}. {idx === 0 ? 'SA Spark' : idx === 1 ? 'AV Delay' : idx === 2 ? 'QRS Blast' : 'Recharge'}
            </button>
          ))}
          <button
            onClick={() => setIsAuto(!isAuto)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            title={isAuto ? 'Pause Auto Stepper' : 'Auto Play Steps'}
          >
            {isAuto ? <Pause className="w-3.5 h-3.5 text-amber-500" /> : <Play className="w-3.5 h-3.5 text-emerald-500" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Heart Conduction SVG with synchronized active pulse */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-slate-800 relative">
          <svg viewBox="0 0 340 280" className="w-full max-w-[320px] h-auto select-none">
            {/* Heart Muscle Background Outline */}
            <path
              d="M 170 80 C 130 30, 60 50, 60 110 C 60 170, 130 220, 170 260 C 210 220, 280 170, 280 110 C 280 50, 210 30, 170 80 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="3"
            />

            {/* Atria and Ventricles faint zones */}
            <line x1="60" y1="120" x2="280" y2="120" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,3" />
            <text x="100" y="80" fill="#64748b" fontSize="9" fontWeight="bold">Right Atrium</text>
            <text x="240" y="80" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="end">Left Atrium</text>
            <text x="170" y="240" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">Ventricles</text>

            {/* 1. SA Node (Top Right Atrium, x=95, y=70) */}
            <circle
              cx="95"
              cy="70"
              r={step === 0 ? '10' : '6'}
              fill={step === 0 ? '#fbbf24' : '#64748b'}
              stroke="#fef08a"
              strokeWidth={step === 0 ? '3' : '1'}
              className={step === 0 ? 'animate-pulse' : ''}
            />
            <text x="95" y="55" fill={step === 0 ? '#fef08a' : '#94a3b8'} fontSize="9" fontWeight="black" textAnchor="middle">
              SA Node
            </text>

            {/* Atrial Conduction Wavelet radiating from SA Node */}
            {step === 0 && (
              <g>
                <circle cx="95" cy="70" r="18" fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.8" />
                <circle cx="95" cy="70" r="30" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.6" />
                {/* Bachmann bundle across to LA */}
                <path d="M 95 70 C 130 55, 180 60, 220 75" stroke="#fde047" strokeWidth="3" fill="none" strokeDasharray="4,2" />
              </g>
            )}

            {/* Internodal tracts connecting SA to AV node */}
            <path
              d="M 95 70 C 110 90, 130 100, 150 115"
              stroke={step >= 0 ? '#f59e0b' : '#475569'}
              strokeWidth="2.5"
              fill="none"
            />

            {/* 2. AV Node (Junction, x=150, y=115) */}
            <circle
              cx="150"
              cy="115"
              r={step === 1 ? '11' : '7'}
              fill={step === 1 ? '#38bdf8' : step > 1 ? '#0ea5e9' : '#475569'}
              stroke="#bae6fd"
              strokeWidth={step === 1 ? '3' : '1'}
              className={step === 1 ? 'animate-pulse' : ''}
            />
            <text x="150" y="105" fill={step === 1 ? '#38bdf8' : '#94a3b8'} fontSize="9" fontWeight="black" textAnchor="middle">
              AV Node
            </text>

            {/* AV Delay Halo */}
            {step === 1 && (
              <g>
                <circle cx="150" cy="115" r="22" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3,3" />
                <text x="150" y="138" fill="#7dd3fc" fontSize="8" fontWeight="bold" textAnchor="middle">
                  100ms PAUSE ⏳
                </text>
              </g>
            )}

            {/* 3. Bundle of His & Branches (x=170, down septum) */}
            <path
              d="M 150 115 L 170 135 L 170 170"
              stroke={step >= 2 ? '#34d399' : '#475569'}
              strokeWidth="3.5"
              fill="none"
            />
            {/* Left Bundle Branch */}
            <path
              d="M 170 170 C 180 190, 220 200, 235 220"
              stroke={step >= 2 ? '#34d399' : '#475569'}
              strokeWidth="3"
              fill="none"
            />
            {/* Right Bundle Branch */}
            <path
              d="M 170 170 C 160 190, 120 200, 105 220"
              stroke={step >= 2 ? '#34d399' : '#475569'}
              strokeWidth="3"
              fill="none"
            />

            {/* Purkinje Arbor Arborization Network */}
            <g stroke={step >= 2 ? '#10b981' : '#334155'} strokeWidth="1.5" fill="none">
              <path d="M 235 220 L 250 205 M 235 220 L 245 235 M 235 220 L 225 245" />
              <path d="M 105 220 L 90 205 M 105 220 L 95 235 M 105 220 L 115 245" />
            </g>

            {/* Step 2 Lightning Blast Effect */}
            {step === 2 && (
              <g>
                <circle cx="170" cy="190" r="45" fill="none" stroke="#34d399" strokeWidth="2.5" opacity="0.6" className="animate-ping" />
                <text x="170" y="200" fill="#a7f3d0" fontSize="10" fontWeight="black" textAnchor="middle">
                  PURKINJE BLAST ⚡
                </text>
              </g>
            )}

            {/* Step 3 Repolarization Waves */}
            {step === 3 && (
              <g>
                <path d="M 80 210 C 120 240, 220 240, 260 210" stroke="#c084fc" strokeWidth="4" fill="none" strokeDasharray="5,3" />
                <text x="170" y="225" fill="#e9d5ff" fontSize="9" fontWeight="black" textAnchor="middle">
                  RECHARGING 🔋
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Live Synchronized Oscilloscope ECG Strip */}
        <div className="lg:col-span-6 space-y-3">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                Synchronized Lead II Oscilloscope Strip
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                25 mm/s | 10 mm/mV
              </span>
            </div>

            {/* ECG Strip SVG with animated cursor and segment highlight */}
            <svg viewBox="0 0 340 100" className="w-full h-24 select-none">
              {/* Pink grid background lines */}
              <defs>
                <pattern id="ecgMiniGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#881337" strokeWidth="0.5" opacity="0.3" />
                </pattern>
              </defs>
              <rect width="340" height="100" fill="#4c0519" opacity="0.25" />
              <rect width="340" height="100" fill="url(#ecgMiniGrid)" />

              {/* Baseline isoelectric line */}
              <line x1="0" y1="50" x2="340" y2="50" stroke="#fb7185" strokeWidth="0.8" strokeDasharray="2,4" opacity="0.5" />

              {/* ECG Segments: Highlighted based on active step */}
              {/* P Wave: x=25 to 55, peak y=38 */}
              <path
                d="M 15 50 L 25 50 C 35 36, 45 36, 55 50"
                stroke={step === 0 ? '#fbbf24' : '#10b981'}
                strokeWidth={step === 0 ? '4' : '2'}
                fill="none"
              />
              {/* PR Segment: x=55 to 85, flat at y=50 */}
              <line
                x1="55"
                y1="50"
                x2="85"
                y2="50"
                stroke={step === 1 ? '#38bdf8' : '#10b981'}
                strokeWidth={step === 1 ? '4' : '2'}
              />
              {/* QRS Spike: Q(90, 56) -> R(105, 12) -> S(118, 68) -> J-point(128, 50) */}
              <path
                d="M 85 50 L 90 56 L 105 12 L 118 68 L 128 50"
                stroke={step === 2 ? '#34d399' : '#10b981'}
                strokeWidth={step === 2 ? '4' : '2'}
                fill="none"
              />
              {/* ST Segment: x=128 to 160, flat at y=50 */}
              <line
                x1="128"
                y1="50"
                x2="160"
                y2="50"
                stroke="#10b981"
                strokeWidth="2"
              />
              {/* T Wave: x=160 to 220, smooth hill peak at y=32 */}
              <path
                d="M 160 50 C 180 30, 200 30, 220 50"
                stroke={step === 3 ? '#c084fc' : '#10b981'}
                strokeWidth={step === 3 ? '4' : '2'}
                fill="none"
              />
              {/* Flat tail to next beat */}
              <line x1="220" y1="50" x2="260" y2="50" stroke="#10b981" strokeWidth="2" />
              {/* Next beat P wave */}
              <path d="M 260 50 C 270 36, 280 36, 290 50" stroke="#10b981" strokeWidth="2" fill="none" opacity="0.6" />
              <line x1="290" y1="50" x2="310" y2="50" stroke="#10b981" strokeWidth="2" opacity="0.6" />
              <path d="M 310 50 L 314 56 L 325 15 L 334 65" stroke="#10b981" strokeWidth="2" fill="none" opacity="0.6" />

              {/* Dynamic Step Callout Pointer */}
              {step === 0 && (
                <g>
                  <circle cx="40" cy="38" r="5" fill="#fbbf24" />
                  <text x="40" y="24" fill="#fef08a" fontSize="9" fontWeight="bold" textAnchor="middle">P Wave</text>
                </g>
              )}
              {step === 1 && (
                <g>
                  <circle cx="70" cy="50" r="5" fill="#38bdf8" />
                  <text x="70" y="38" fill="#bae6fd" fontSize="9" fontWeight="bold" textAnchor="middle">PR Delay</text>
                </g>
              )}
              {step === 2 && (
                <g>
                  <circle cx="105" cy="12" r="5" fill="#34d399" />
                  <text x="105" y="8" fill="#a7f3d0" fontSize="9" fontWeight="bold" textAnchor="middle">QRS Spike</text>
                </g>
              )}
              {step === 3 && (
                <g>
                  <circle cx="190" cy="32" r="5" fill="#c084fc" />
                  <text x="190" y="20" fill="#f3e8ff" fontSize="9" fontWeight="bold" textAnchor="middle">T Wave</text>
                </g>
              )}
            </svg>
          </div>

          {/* Step Explanation Card */}
          <div
            className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                {currentStep.title} ({currentStep.subtitle})
              </h5>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {currentStep.badge}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {currentStep.meaning}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// VISUAL MODULE 3: 12-CAMERA PAPARAZZI STUDIO (Vector & Leads)
// =====================================================================
const PaparazziCameraStudioVisualizer: React.FC<{ isLight: boolean }> = ({ isLight }) => {
  const [selectedLead, setSelectedLead] = useState<string>('II');

  const leadDatabase: Record<
    string,
    {
      angle: string;
      position: string;
      viewTarget: string;
      direction: 'towards' | 'away' | 'perpendicular';
      deflection: string;
      clinicalMnemonic: string;
      rWaveHeight: number; // For mini SVG: positive tall, biphasic, or negative
      sWaveDepth: number;
    }
  > = {
    I: {
      angle: '0°',
      position: 'Left Arm (Lateral)',
      viewTarget: 'High Lateral Wall of Left Ventricle',
      direction: 'towards',
      deflection: 'Positive (▲)',
      clinicalMnemonic: 'Wave heads toward left arm. Normal R wave is positive.',
      rWaveHeight: 18,
      sWaveDepth: 3,
    },
    II: {
      angle: '+60°',
      position: 'Left Foot (Inferior Apex)',
      viewTarget: 'Inferior Wall & Apex (Directly along heart axis!)',
      direction: 'towards',
      deflection: 'Strongly Positive (▲▲▲)',
      clinicalMnemonic: 'The Golden Rhythm Lead! Electrical wave aims directly at Lead II (+60°). Tallest R wave on the entire ECG!',
      rWaveHeight: 28,
      sWaveDepth: 2,
    },
    III: {
      angle: '+120°',
      position: 'Left Foot (Inferior Right)',
      viewTarget: 'Inferior Wall (Right side)',
      direction: 'towards',
      deflection: 'Positive (▲)',
      clinicalMnemonic: 'Inferior lead. Key for diagnosing Inferior STEMI with II and aVF.',
      rWaveHeight: 15,
      sWaveDepth: 4,
    },
    aVR: {
      angle: '-150°',
      position: 'Right Shoulder (Looking backwards)',
      viewTarget: 'Inside of Right Ventricle Cavity',
      direction: 'away',
      deflection: 'Completely Inverted / Negative (▼▼▼)',
      clinicalMnemonic: 'The "Odd-Ball" Lead. The entire electrical wave races AWAY from the right shoulder. Everything (P, QRS, T) is upside down!',
      rWaveHeight: 2,
      sWaveDepth: 26,
    },
    aVL: {
      angle: '-30°',
      position: 'Left Shoulder (High Lateral)',
      viewTarget: 'High Lateral Wall of Left Ventricle',
      direction: 'perpendicular',
      deflection: 'Biphasic / Small Positive (±)',
      clinicalMnemonic: 'Perpendicular to mean axis (+60°). R and S waves often equal.',
      rWaveHeight: 10,
      sWaveDepth: 8,
    },
    aVF: {
      angle: '+90°',
      position: 'Straight Down at Feet (Inferior)',
      viewTarget: 'Inferior Diaphragmatic Surface',
      direction: 'towards',
      deflection: 'Positive (▲▲)',
      clinicalMnemonic: 'Foot lead. Points straight down. Positive in normal axis.',
      rWaveHeight: 22,
      sWaveDepth: 3,
    },
    V1: {
      angle: 'Horizontal 4th RICS',
      position: 'Right Sternal Border',
      viewTarget: 'Interventricular Septum & Right Ventricle',
      direction: 'away',
      deflection: 'Negative (Small r, Deep S)',
      clinicalMnemonic: 'Ventricle septum depolarizes left-to-right, then main LV mass races away toward the left. Deep S wave!',
      rWaveHeight: 4,
      sWaveDepth: 24,
    },
    V2: {
      angle: 'Horizontal 4th LICS',
      position: 'Left Sternal Border',
      viewTarget: 'Interventricular Septum',
      direction: 'away',
      deflection: 'Negative (rS complex)',
      clinicalMnemonic: 'Septal lead. Deep S wave. Elevation here indicates septal STEMI.',
      rWaveHeight: 6,
      sWaveDepth: 20,
    },
    V3: {
      angle: 'Horizontal 5th LICS',
      position: 'Midway between V2 & V4',
      viewTarget: 'Anterior Wall of Left Ventricle',
      direction: 'perpendicular',
      deflection: 'Transition Zone (R = S)',
      clinicalMnemonic: 'Transition zone where R wave equals S wave as camera moves towards LV.',
      rWaveHeight: 14,
      sWaveDepth: 14,
    },
    V4: {
      angle: 'Horizontal 5th LICS',
      position: 'Mid-Clavicular Line',
      viewTarget: 'Anterior Wall & Cardiac Apex',
      direction: 'towards',
      deflection: 'Tall Positive (▲▲)',
      clinicalMnemonic: 'Anterior LV lead. R wave becomes taller than S wave (Rs).',
      rWaveHeight: 22,
      sWaveDepth: 5,
    },
    V5: {
      angle: 'Horizontal 5th LICS',
      position: 'Anterior Axillary Line',
      viewTarget: 'Low Lateral Wall of Left Ventricle',
      direction: 'towards',
      deflection: 'Tall Positive (qR complex)',
      clinicalMnemonic: 'Lateral LV lead. Facing bulk of left ventricle muscle mass. Tall R wave.',
      rWaveHeight: 24,
      sWaveDepth: 3,
    },
    V6: {
      angle: 'Horizontal 5th LICS',
      position: 'Mid-Axillary Line',
      viewTarget: 'Lateral Wall of Left Ventricle',
      direction: 'towards',
      deflection: 'Tall Positive (qR complex)',
      clinicalMnemonic: 'Lateral LV lead. Views heart from the left side of torso. Tall positive R wave.',
      rWaveHeight: 20,
      sWaveDepth: 2,
    },
  };

  const currentLead = leadDatabase[selectedLead] || leadDatabase.II;

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-lg'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-black">
              📸
            </div>
            <h4 className="font-bold text-sm tracking-tight">3. The 12-Camera Paparazzi Studio (Why Waves Go UP or DOWN)</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any camera angle around the body. The Golden Camera Rule reveals exactly why the pen pushes UP or DOWN!
          </p>
        </div>
      </div>

      {/* 12-Lead Buttons Bar */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Limb Leads:</span>
        {['I', 'II', 'III', 'aVR', 'aVL', 'aVF'].map((lead) => (
          <button
            key={lead}
            onClick={() => setSelectedLead(lead)}
            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              selectedLead === lead
                ? 'bg-sky-500 text-white shadow-md ring-2 ring-sky-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {lead}
          </button>
        ))}

        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mx-1">Chest Leads:</span>
        {['V1', 'V2', 'V3', 'V4', 'V5', 'V6'].map((lead) => (
          <button
            key={lead}
            onClick={() => setSelectedLead(lead)}
            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              selectedLead === lead
                ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {lead}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Studio Torso & Camera Angles SVG */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-slate-800 relative">
          <svg viewBox="0 0 360 260" className="w-full max-w-[340px] h-auto select-none">
            {/* Torso Outline */}
            <path
              d="M 120 40 C 90 60, 70 120, 80 230 L 280 230 C 290 120, 270 60, 240 40 C 210 50, 150 50, 120 40 Z"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="2"
            />
            {/* Clavicles & Sternum */}
            <path d="M 120 45 L 180 65 L 240 45" stroke="#475569" strokeWidth="2" fill="none" />
            <line x1="180" y1="65" x2="180" y2="135" stroke="#475569" strokeWidth="4" strokeLinecap="round" />

            {/* Heart Position in Chest (x=175, y=115) */}
            <circle cx="175" cy="115" r="28" fill="#881337" opacity="0.4" />
            <path
              d="M 175 95 C 160 85, 145 95, 145 110 C 145 130, 175 145, 175 145 C 175 145, 205 130, 205 110 C 205 95, 190 85, 175 95 Z"
              fill="#dc2626"
            />

            {/* Mean Electrical Depolarization Vector Arrow (Points towards +60° down-left) */}
            <line x1="175" y1="115" x2="225" y2="190" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
            {/* Arrowhead at +60° */}
            <polygon points="225,190 226,178 214,184" fill="#fef08a" />
            <text x="235" y="200" fill="#fef08a" fontSize="9" fontWeight="black">
              Mean Axis (+60°)
            </text>

            {/* Camera Angle Spotlights */}
            {/* Lead II Camera (+60° at bottom right) */}
            <g
              className="cursor-pointer"
              onClick={() => setSelectedLead('II')}
            >
              <circle cx="255" cy="225" r="14" fill={selectedLead === 'II' ? '#38bdf8' : '#1e293b'} stroke="#38bdf8" strokeWidth="2" />
              <text x="255" y="229" fill="#ffffff" fontSize="9" fontWeight="black" textAnchor="middle">II</text>
              {selectedLead === 'II' && (
                <polygon points="255,210 185,125 165,105 240,225" fill="#38bdf8" opacity="0.15" />
              )}
            </g>

            {/* aVR Camera (-150° at top left right shoulder) */}
            <g
              className="cursor-pointer"
              onClick={() => setSelectedLead('aVR')}
            >
              <circle cx="95" cy="55" r="14" fill={selectedLead === 'aVR' ? '#ef4444' : '#1e293b'} stroke="#ef4444" strokeWidth="2" />
              <text x="95" y="59" fill="#ffffff" fontSize="8" fontWeight="black" textAnchor="middle">aVR</text>
              {selectedLead === 'aVR' && (
                <polygon points="95,70 165,105 185,125 110,55" fill="#ef4444" opacity="0.15" />
              )}
            </g>

            {/* Lead I Camera (0° at left side of patient / right side of screen) */}
            <g
              className="cursor-pointer"
              onClick={() => setSelectedLead('I')}
            >
              <circle cx="285" cy="115" r="13" fill={selectedLead === 'I' ? '#38bdf8' : '#1e293b'} stroke="#38bdf8" strokeWidth="2" />
              <text x="285" y="119" fill="#ffffff" fontSize="9" fontWeight="black" textAnchor="middle">I</text>
            </g>

            {/* Lead III Camera (+120° at bottom left) */}
            <g
              className="cursor-pointer"
              onClick={() => setSelectedLead('III')}
            >
              <circle cx="105" cy="225" r="13" fill={selectedLead === 'III' ? '#38bdf8' : '#1e293b'} stroke="#38bdf8" strokeWidth="2" />
              <text x="105" y="229" fill="#ffffff" fontSize="8" fontWeight="black" textAnchor="middle">III</text>
            </g>

            {/* aVF Camera (+90° straight down) */}
            <g
              className="cursor-pointer"
              onClick={() => setSelectedLead('aVF')}
            >
              <circle cx="180" cy="245" r="13" fill={selectedLead === 'aVF' ? '#38bdf8' : '#1e293b'} stroke="#38bdf8" strokeWidth="2" />
              <text x="180" y="249" fill="#ffffff" fontSize="8" fontWeight="black" textAnchor="middle">aVF</text>
            </g>

            {/* Precordial Leads arc V1-V6 around anterior chest */}
            {[
              { id: 'V1', cx: 162, cy: 110 },
              { id: 'V2', cx: 178, cy: 112 },
              { id: 'V3', cx: 195, cy: 122 },
              { id: 'V4', cx: 212, cy: 135 },
              { id: 'V5', cx: 232, cy: 140 },
              { id: 'V6', cx: 250, cy: 145 },
            ].map((v) => (
              <g
                key={v.id}
                className="cursor-pointer"
                onClick={() => setSelectedLead(v.id)}
              >
                <circle
                  cx={v.cx}
                  cy={v.cy}
                  r="8"
                  fill={selectedLead === v.id ? '#10b981' : '#022c22'}
                  stroke="#10b981"
                  strokeWidth="1.5"
                />
                <text x={v.cx} y={v.cy + 3} fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
                  {v.id}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Live Lead Morphology Preview & Golden Camera Rule Card */}
        <div className="lg:col-span-5 space-y-3">
          {/* Mini Waveform Display */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-sky-400">
                Lead {selectedLead} Camera View ({currentLead.angle})
              </span>
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                  currentLead.deflection.includes('Positive')
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : currentLead.deflection.includes('Negative')
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {currentLead.deflection}
              </span>
            </div>

            {/* Generated SVG Waveform for this specific lead */}
            <svg viewBox="0 0 240 80" className="w-full h-20 select-none">
              <rect width="240" height="80" fill="#4c0519" opacity="0.25" />
              <line x1="0" y1="40" x2="240" y2="40" stroke="#fb7185" strokeWidth="0.8" strokeDasharray="2,3" opacity="0.5" />

              {/* Dynamic waveform based on rWaveHeight and sWaveDepth */}
              <path
                d={`M 10 40 
                   L 30 40 
                   C 36 ${40 - (currentLead.rWaveHeight > 5 ? 8 : -4)}, 44 ${40 - (currentLead.rWaveHeight > 5 ? 8 : -4)}, 50 40 
                   L 70 40 
                   L 75 42 
                   L 85 ${40 - currentLead.rWaveHeight} 
                   L 95 ${40 + currentLead.sWaveDepth} 
                   L 105 40 
                   L 130 40 
                   C 145 ${40 - (currentLead.rWaveHeight > 5 ? 12 : -8)}, 165 ${40 - (currentLead.rWaveHeight > 5 ? 12 : -8)}, 180 40 
                   L 230 40`}
                stroke={currentLead.rWaveHeight > currentLead.sWaveDepth ? '#10b981' : '#f43f5e'}
                strokeWidth="2.5"
                fill="none"
              />
            </svg>
          </div>

          {/* Explanation Card */}
          <div
            className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div className="font-bold text-xs mb-1 text-slate-900 dark:text-white flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-500" />
              Viewing Perspective: {currentLead.position}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              {currentLead.viewTarget}
            </p>
            <div
              className={`p-2.5 rounded-lg text-[11px] leading-relaxed font-medium ${
                isLight ? 'bg-sky-50 text-sky-900 border border-sky-200' : 'bg-sky-950/40 text-sky-300 border border-sky-800'
              }`}
            >
              💡 <strong>Why is it {currentLead.deflection}?</strong>
              <br />
              {currentLead.clinicalMnemonic}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// VISUAL MODULE 4: CALIBRATED PINK GRID P-QRS-T ANATOMY BREAKDOWN
// =====================================================================
const CalibratedGridWaveBreakdown: React.FC<{ isLight: boolean }> = ({ isLight }) => {
  const [activeZone, setActiveZone] = useState<string>('qrs');

  const zoneData: Record<
    string,
    {
      name: string;
      fullName: string;
      duration: string;
      amplitude: string;
      boxes: string;
      color: string;
      mechanicalEvent: string;
      pathologyAlert: string;
    }
  > = {
    p: {
      name: 'P Wave',
      fullName: 'Atrial Depolarization',
      duration: '< 120 ms',
      amplitude: '< 2.5 mm (0.25 mV)',
      boxes: '< 3 small boxes wide, < 2.5 boxes tall',
      color: 'rose',
      mechanicalEvent: 'Right atrium contracts first, then left atrium. Pushes final 20% of blood into ventricles ("Atrial Kick").',
      pathologyAlert: 'P pulmonale (> 2.5 mm) in Right Atrial Enlargement (COPD/Cor Pulmonale); P mitrale (notched M-shape > 120 ms) in Left Atrial Enlargement (Mitral Stenosis).',
    },
    pr: {
      name: 'PR Interval',
      fullName: 'AV Nodal Transit Time',
      duration: '120 - 200 ms',
      amplitude: 'Isoelectric flatline',
      boxes: '3 to 5 small boxes (Exactly 1 large box!)',
      color: 'amber',
      mechanicalEvent: 'Conduction from SA node through atria, through AV node delay, down bundle of His until ventricular myocytes fire.',
      pathologyAlert: 'PR > 200 ms (> 5 boxes) = 1st Degree AV Block. PR < 120 ms (< 3 boxes) = Wolff-Parkinson-White (WPW) pre-excitation pathway with Delta wave!',
    },
    qrs: {
      name: 'QRS Complex',
      fullName: 'Ventricular Depolarization',
      duration: '< 120 ms',
      amplitude: '5 to 30 mm (Variable)',
      boxes: '< 3 small boxes wide (< 0.12s)',
      color: 'emerald',
      mechanicalEvent: 'Septum depolarizes left-to-right (Q wave), then massive left and right ventricular muscular walls contract violently (R spike).',
      pathologyAlert: 'QRS > 120 ms (> 3 boxes) = Bundle Branch Block (LBBB / RBBB) or Ventricular Tachycardia. Pathological Q wave (> 1 box wide or > 25% R wave) = Old Transmural Myocardial Infarction!',
    },
    st: {
      name: 'ST Segment',
      fullName: 'Early Ventricular Plateau (Phase 2)',
      duration: '80 - 120 ms',
      amplitude: 'Strictly isoelectric (0 mm deviation)',
      boxes: 'Should sit flat on the TP baseline',
      color: 'cyan',
      mechanicalEvent: 'Both ventricles are fully depolarized and squeezing under maximum pressure. Calcium influx maintains muscular contraction.',
      pathologyAlert: 'CRITICAL ALERT: ST Elevation > 1 mm in limb leads (> 2 mm in V2-V3) = ACUTE TRANSMURAL STEMI (Immediate Cath Lab / Thrombolysis!). ST depression = Subendocardial ischemia or NSTEMI.',
    },
    t: {
      name: 'T Wave',
      fullName: 'Ventricular Repolarization (Phase 3)',
      duration: '100 - 180 ms',
      amplitude: '< 5 mm in limb, < 10 mm in chest',
      boxes: 'Asymmetrical smooth hill (slow up, fast down)',
      color: 'purple',
      mechanicalEvent: 'Ventricular myocytes recharge their ionic gradients via Na+/K+ ATPase pumps, preparing for the next mechanical systole.',
      pathologyAlert: 'Tall peaked symmetrical "tented" T waves = Fatal Hyperkalemia (K+ > 6.5 mEq/L). Inverted T waves = Myocardial ischemia or ventricular strain.',
    },
    qt: {
      name: 'QTc Interval',
      fullName: 'Total Ventricular Electrical Systole',
      duration: '♂ < 440 ms, ♀ < 460 ms',
      boxes: 'Must be rate-corrected using Bazett formula (QT / √RR)',
      amplitude: 'Spans from start of Q wave to end of T wave',
      color: 'rose',
      mechanicalEvent: 'Encompasses both ventricular contraction (depolarization) and recovery (repolarization).',
      pathologyAlert: 'QTc > 500 ms = EXTREME DANGER of Torsades de Pointes polymorphic ventricular tachycardia and sudden cardiac death! Common causes: Ondansetron, Macrolides, Hypokalemia, Hypomagnesemia.',
    },
  };

  const current = zoneData[activeZone] || zoneData.qrs;

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-lg'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
              📐
            </div>
            <h4 className="font-bold text-sm tracking-tight">4. Calibrated Pink Millimeter Grid & Segment Inspector</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any segment along the heartbeat. Inspect exact millisecond rules, box counts, and life-threatening pathologies.
          </p>
        </div>
      </div>

      {/* Segment Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {[
          { id: 'p', label: 'P Wave (Atria)' },
          { id: 'pr', label: 'PR Interval (AV Node)' },
          { id: 'qrs', label: 'QRS Spike (Ventricles)' },
          { id: 'st', label: 'ST Segment (STEMI Alert)' },
          { id: 't', label: 'T Wave (Recharge)' },
          { id: 'qt', label: 'QTc Interval (Sudden Death Risk)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveZone(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeZone === tab.id
                ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Calibrated Pink Grid Canvas with Highlighted Segment */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-3 rounded-2xl bg-[#fff1f2] dark:bg-[#2b0c15] border-2 border-rose-300 dark:border-rose-900 relative shadow-inner overflow-hidden">
          <svg viewBox="0 0 380 140" className="w-full h-auto select-none">
            {/* Fine 1mm pink grid lines */}
            <defs>
              <pattern id="pinkFineGrid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#f43f5e" strokeWidth="0.4" opacity="0.35" />
              </pattern>
              <pattern id="pinkMajorGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect width="40" height="40" fill="url(#pinkFineGrid)" />
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e11d48" strokeWidth="1" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="380" height="140" fill="url(#pinkMajorGrid)" />

            {/* Isoelectric zero baseline (y=80) */}
            <line x1="0" y1="80" x2="380" y2="80" stroke="#be123c" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />

            {/* Active Zone Shaded Caliper Box */}
            {activeZone === 'p' && (
              <rect x="35" y="45" width="45" height="50" fill="#f43f5e" opacity="0.25" rx="4" />
            )}
            {activeZone === 'pr' && (
              <rect x="35" y="55" width="80" height="35" fill="#f59e0b" opacity="0.25" rx="4" />
            )}
            {activeZone === 'qrs' && (
              <rect x="110" y="10" width="45" height="100" fill="#10b981" opacity="0.25" rx="4" />
            )}
            {activeZone === 'st' && (
              <rect x="155" y="65" width="45" height="30" fill="#06b6d4" opacity="0.3" rx="4" />
            )}
            {activeZone === 't' && (
              <rect x="195" y="40" width="75" height="55" fill="#8b5cf6" opacity="0.25" rx="4" />
            )}
            {activeZone === 'qt' && (
              <rect x="115" y="10" width="155" height="110" fill="#ec4899" opacity="0.2" rx="4" />
            )}

            {/* Lead II Calibrated Vector Waveform */}
            <path
              d="M 15 80 
                 L 35 80 
                 C 45 60, 65 60, 75 80 
                 L 115 80 
                 L 120 88 
                 L 132 18 
                 L 145 105 
                 L 155 80 
                 L 195 80 
                 C 215 52, 245 52, 270 80 
                 L 360 80"
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinejoin="round"
              fill="none"
              className="dark:stroke-white"
            />

            {/* Zone Caliper Boundary Markers */}
            {activeZone === 'p' && (
              <g>
                <line x1="35" y1="40" x2="35" y2="95" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="2,2" />
                <line x1="80" y1="40" x2="80" y2="95" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="2,2" />
                <text x="57" y="36" fill="#be123c" fontSize="10" fontWeight="black" textAnchor="middle">&lt; 3 small boxes</text>
              </g>
            )}
            {activeZone === 'pr' && (
              <g>
                <line x1="35" y1="50" x2="35" y2="95" stroke="#d97706" strokeWidth="1.5" strokeDasharray="2,2" />
                <line x1="115" y1="50" x2="115" y2="95" stroke="#d97706" strokeWidth="1.5" strokeDasharray="2,2" />
                <text x="75" y="46" fill="#b45309" fontSize="10" fontWeight="black" textAnchor="middle">3 to 5 boxes (120-200ms)</text>
              </g>
            )}
            {activeZone === 'qrs' && (
              <g>
                <line x1="115" y1="15" x2="115" y2="110" stroke="#059669" strokeWidth="1.5" strokeDasharray="2,2" />
                <line x1="155" y1="15" x2="155" y2="110" stroke="#059669" strokeWidth="1.5" strokeDasharray="2,2" />
                <text x="135" y="12" fill="#047857" fontSize="10" fontWeight="black" textAnchor="middle">&lt; 3 boxes (&lt; 0.12s)</text>
              </g>
            )}
            {activeZone === 'st' && (
              <g>
                <line x1="155" y1="65" x2="155" y2="95" stroke="#0891b2" strokeWidth="1.5" strokeDasharray="2,2" />
                <line x1="195" y1="65" x2="195" y2="95" stroke="#0891b2" strokeWidth="1.5" strokeDasharray="2,2" />
                <text x="175" y="60" fill="#0e7490" fontSize="10" fontWeight="black" textAnchor="middle">Strictly Flat (0mm)</text>
              </g>
            )}
            {activeZone === 't' && (
              <g>
                <line x1="195" y1="35" x2="195" y2="95" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="2,2" />
                <line x1="270" y1="35" x2="270" y2="95" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="2,2" />
                <text x="232" y="32" fill="#6d28d9" fontSize="10" fontWeight="black" textAnchor="middle">Smooth Asymmetric Hill</text>
              </g>
            )}
            {activeZone === 'qt' && (
              <g>
                <line x1="115" y1="20" x2="115" y2="120" stroke="#db2777" strokeWidth="1.5" strokeDasharray="2,2" />
                <line x1="270" y1="20" x2="270" y2="120" stroke="#db2777" strokeWidth="1.5" strokeDasharray="2,2" />
                <text x="192" y="132" fill="#be185d" fontSize="10" fontWeight="black" textAnchor="middle">QTc &lt; 440-460 ms</text>
              </g>
            )}
          </svg>
        </div>

        {/* Diagnostic Normal Limits & Pathology Breakdown */}
        <div className="lg:col-span-5 space-y-3">
          <div
            className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white">
                {current.name}: {current.fullName}
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                {current.duration}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div>
                <strong>📏 Grid Measurement:</strong> {current.boxes}
              </div>
              <div>
                <strong>⚡ Mechanical Event:</strong> {current.mechanicalEvent}
              </div>
            </div>

            <div
              className={`mt-3 p-2.5 rounded-lg border text-[11px] leading-relaxed font-medium ${
                isLight ? 'bg-red-50 border-red-200 text-red-900' : 'bg-red-950/40 border-red-800 text-red-300'
              }`}
            >
              <strong>🚨 Clinical Pathology Alert:</strong>
              <br />
              {current.pathologyAlert}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// MAIN MODAL COMPONENT
// =====================================================================
export const EcgIcuTutorialModal: React.FC<EcgIcuTutorialModalProps> = ({
  isOpen,
  onClose,
  theme = 'light',
}) => {
  const [activeLevel, setActiveLevel] = useState<TutorialLevel>('lkg');
  const [selectedLead, setSelectedLead] = useState<string>('II');
  const [selectedAxisDeg, setSelectedAxisDeg] = useState<number>(60); // Normal axis +60°

  if (!isOpen) return null;

  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch sm:items-center justify-center p-0 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn overflow-hidden">
      <div
        className={`relative w-full max-w-5xl h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[92vh] flex flex-col rounded-none sm:rounded-3xl border-0 sm:border shadow-2xl overflow-hidden transition-all ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-900 shadow-slate-900/20'
            : 'bg-[#090e1a] border-slate-800 text-slate-100 shadow-cyan-950/30'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`sticky top-0 z-20 flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5 sm:py-4 border-b ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 items-center justify-center text-white shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-bold tracking-tight truncate">
                  12-Lead ECG & ICU Telemetry Masterclass
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Visual Walkthrough
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
                Intuitive interactive animations, biophysical vectors, and hospital telemetry from fundamentals to fellowship.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-all cursor-pointer shrink-0 ${
              isLight
                ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Tier Curriculum Selector */}
        <div
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-6 py-2 sm:py-3 border-b overflow-x-auto no-scrollbar ${
            isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-950/70 border-slate-800/80'
          }`}
        >
          {[
            {
              id: 'lkg',
              label: 'Tier 1: Visual Fundamentals',
              badge: 'Interactive Animations',
              icon: '🎨',
              color: 'from-amber-500 to-orange-500',
            },
            {
              id: 'med_student',
              label: 'Tier 2: Medical Student',
              badge: 'Einthoven & Vectors',
              icon: '📚',
              color: 'from-sky-500 to-blue-500',
            },
            {
              id: 'resident',
              label: 'Tier 3: Resident Physician',
              badge: 'Waves & Segments',
              icon: '🩺',
              color: 'from-emerald-500 to-teal-500',
            },
            {
              id: 'specialist',
              label: 'Tier 4: Cardiology Specialist',
              badge: 'STEMI & Arrhythmias',
              icon: '⚡',
              color: 'from-rose-500 to-red-600',
            },
          ].map((tier) => (
            <button
              key={tier.id}
              onClick={() => setActiveLevel(tier.id as TutorialLevel)}
              className={`min-h-[44px] shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeLevel === tier.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md border border-slate-200 dark:border-slate-700 ring-2 ring-rose-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <span>{tier.icon}</span>
              <span>{tier.label}</span>
              <span className="text-[10px] opacity-70 hidden sm:inline">({tier.badge})</span>
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-2.5 sm:p-4 md:p-6 space-y-3 sm:space-y-6 pb-[calc(16px+env(safe-area-inset-bottom))]">
          {/* ================================================================= */}
          {/* TIER 1: INTERACTIVE VISUAL WALKTHROUGH                            */}
          {/* ================================================================= */}
          {activeLevel === 'lkg' && (
            <div className="space-y-6 animate-fadeIn">
              {/* 1. Publication-Grade Real-Time Continuous Cardiac Physics Engine (Wiggers, PV Loop, 2.5D Flow Anatomy, Cellular Action Potential, Dipole Projection) */}
              <InteractiveCardiacEngineMaster isLight={isLight} />

              {/* 2. The 12-Camera Paparazzi Studio */}
              <PaparazziCameraStudioVisualizer isLight={isLight} />

              {/* 3. Calibrated Pink Millimeter Grid Breakdown */}
              <CalibratedGridWaveBreakdown isLight={isLight} />
            </div>
          )}

          {/* ================================================================= */}
          {/* TIER 2: MEDICAL STUDENT                                           */}
          {/* ================================================================= */}
          {activeLevel === 'med_student' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Einthoven's Triangle & Math */}
                <div
                  className={`p-5 rounded-2xl border space-y-3 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span>Einthoven's Triangle & Kirchhoff's Law</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Willem Einthoven (Nobel Prize 1924) arranged three electrodes on the extremities to form an equilateral triangle in the frontal plane:
                  </p>
                  <ul className="text-xs space-y-1.5 font-mono text-slate-700 dark:text-slate-300">
                    <li className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <strong>Lead I:</strong> Axis = 0° (Right Arm [-] to Left Arm [+])
                    </li>
                    <li className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <strong>Lead II:</strong> Axis = +60° (Right Arm [-] to Left Foot [+])
                    </li>
                    <li className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <strong>Lead III:</strong> Axis = +120° (Left Arm [-] to Left Foot [+])
                    </li>
                  </ul>
                  <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs font-mono text-sky-900 dark:text-sky-300">
                    <strong>Einthoven's Law:</strong> Lead I + Lead III = Lead II
                    <div className="text-[11px] opacity-80 mt-1">
                      (V_LA - V_RA) + (V_LL - V_LA) = V_LL - V_RA = Lead II
                    </div>
                  </div>
                </div>

                {/* Precordial Horizontal Leads (V1-V6) */}
                <div
                  className={`p-5 rounded-2xl border space-y-3 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>The 6 Precordial Chest Leads (Horizontal Plane)</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    While limb leads view the heart from the front, chest leads (V1–V6) slice the heart horizontally like an axial CT scan:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <div className="font-bold text-teal-600 dark:text-teal-400">V1 & V2: Septal</div>
                      <div className="text-[10px] text-slate-500">4th R/L ICS parasternum. Look at interventricular septum.</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <div className="font-bold text-cyan-600 dark:text-cyan-400">V3 & V4: Anterior</div>
                      <div className="text-[10px] text-slate-500">5th LICS mid-clavicular line. Look at anterior wall of LV.</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <div className="font-bold text-indigo-600 dark:text-indigo-400">V5 & V6: Lateral</div>
                      <div className="text-[10px] text-slate-500">5th LICS axillary lines. Look at lateral wall of LV.</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <div className="font-bold text-amber-600 dark:text-amber-400">R-Wave Progression</div>
                      <div className="text-[10px] text-slate-500">Small rS in V1 growing into tall qR in V5–V6.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Standard Paper Speed & Voltage Calibration */}
              <div
                className={`p-5 rounded-2xl border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <h4 className="font-bold text-sm mb-2">📐 Standard Pink Millimeter Grid Calibration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <div className="font-bold text-rose-500">1 Small Box (1 mm)</div>
                    <div className="text-slate-600 dark:text-slate-300 font-mono mt-1">
                      Time = <strong>0.04 seconds (40 ms)</strong>
                      <br />Voltage = <strong>0.1 mV</strong>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <div className="font-bold text-rose-500">1 Large Box (5 mm)</div>
                    <div className="text-slate-600 dark:text-slate-300 font-mono mt-1">
                      Time = <strong>0.20 seconds (200 ms)</strong>
                      <br />Voltage = <strong>0.5 mV</strong>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <div className="font-bold text-rose-500">Paper Speed & Standard</div>
                    <div className="text-slate-600 dark:text-slate-300 font-mono mt-1">
                      Speed = <strong>25 mm/s</strong>
                      <br />Calibration = <strong>10 mm/mV (1 mV pulse)</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TIER 3: RESIDENT PHYSICIAN                                        */}
          {/* ================================================================= */}
          {activeLevel === 'resident' && (
            <div className="space-y-6 animate-fadeIn">
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Clinical Waveforms, Intervals & Diagnostic Normal Limits</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="py-2.5 px-3">Component</th>
                        <th className="py-2.5 px-3">Normal Duration</th>
                        <th className="py-2.5 px-3">Normal Amplitude</th>
                        <th className="py-2.5 px-3">Electrophysiological Meaning</th>
                        <th className="py-2.5 px-3">Key Pathology Alerts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                      <tr>
                        <td className="py-2 px-3 font-bold text-rose-500">P Wave</td>
                        <td className="py-2 px-3">&lt; 120 ms (3 boxes)</td>
                        <td className="py-2 px-3">&lt; 2.5 mm (0.25 mV)</td>
                        <td className="py-2 px-3 font-sans">Atrial depolarization (RA then LA)</td>
                        <td className="py-2 px-3 font-sans text-[11px] text-amber-500">
                          P pulmonale (&gt;2.5mm, RAA); P mitrale (notched &gt;120ms, LAA)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-amber-500">PR Interval</td>
                        <td className="py-2 px-3">120 - 200 ms (3-5 boxes)</td>
                        <td className="py-2 px-3">Isoelectric</td>
                        <td className="py-2 px-3 font-sans">AV nodal conduction delay</td>
                        <td className="py-2 px-3 font-sans text-[11px] text-rose-500">
                          &gt;200ms = 1° AV Block; &lt;120ms = Pre-excitation (WPW syndrome)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-emerald-500">QRS Complex</td>
                        <td className="py-2 px-3">&lt; 120 ms (&lt;3 boxes)</td>
                        <td className="py-2 px-3">Variable (5-30 mm)</td>
                        <td className="py-2 px-3 font-sans">Ventricular depolarization</td>
                        <td className="py-2 px-3 font-sans text-[11px] text-red-500">
                          &gt;120ms = LBBB / RBBB / Ventricular rhythm / Hyperkalemia
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-cyan-500">ST Segment</td>
                        <td className="py-2 px-3">80 - 120 ms</td>
                        <td className="py-2 px-3">Isoelectric (TP line)</td>
                        <td className="py-2 px-3 font-sans">Ventricular plateau Phase 2</td>
                        <td className="py-2 px-3 font-sans text-[11px] text-red-500 font-bold">
                          Elevation &gt;1mm = Transmural STEMI; Depression = Subendocardial ischemia
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-indigo-500">T Wave</td>
                        <td className="py-2 px-3">100 - 180 ms</td>
                        <td className="py-2 px-3">&lt; 5 mm limb, &lt; 10 mm chest</td>
                        <td className="py-2 px-3 font-sans">Ventricular repolarization Phase 3</td>
                        <td className="py-2 px-3 font-sans text-[11px] text-amber-500">
                          Tall peaked = Hyperkalemia; Inverted = Ischemia or strain
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-purple-500">QTc Interval</td>
                        <td className="py-2 px-3">♂ &lt; 440 ms, ♀ &lt; 460 ms</td>
                        <td className="py-2 px-3">—</td>
                        <td className="py-2 px-3 font-sans">Total ventricular systole (Bazett formula)</td>
                        <td className="py-2 px-3 font-sans text-[11px] text-rose-500">
                          &gt;500ms = Severe Torsades de Pointes / Sudden Cardiac Death risk
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs font-mono">
                  <strong>Bazett Formula:</strong> QTc = QT / √(RR interval in seconds)
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TIER 4: CARDIOLOGY SPECIALIST                                     */}
          {/* ================================================================= */}
          {activeLevel === 'specialist' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* STEMI Anatomical Culprit Localization */}
                <div
                  className={`p-5 rounded-2xl border space-y-3 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <h3 className="font-bold text-sm flex items-center gap-2 text-rose-500">
                    <Flame className="w-4 h-4" />
                    <span>STEMI Anatomical Territory & Reciprocal Vectors</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                      <div className="font-bold text-rose-700 dark:text-rose-300">
                        Inferior STEMI (Leads II, III, aVF)
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                        <strong>Culprit Artery:</strong> Right Coronary Artery (RCA, 85%) or LCx.
                        <br /><strong>Reciprocal Changes:</strong> ST Depression in Lead I and aVL!
                        <br /><span className="text-amber-600 dark:text-amber-400 font-semibold">Caution:</span> Check V4R for Right Ventricular Infarct before giving nitroglycerin!
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800">
                      <div className="font-bold text-orange-700 dark:text-orange-300">
                        Anterior / Septal STEMI (Leads V1 - V4)
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                        <strong>Culprit Artery:</strong> Left Anterior Descending (LAD - "Widow Maker").
                        <br />High risk of cardiogenic shock, acute pulmonary edema, and complete heart block.
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                      <div className="font-bold text-blue-700 dark:text-blue-300">
                        Lateral STEMI (Leads I, aVL, V5, V6)
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                        <strong>Culprit Artery:</strong> Left Circumflex Artery (LCx) or Diagonal branches.
                        <br /><strong>Reciprocal Changes:</strong> ST depression in III and aVF.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Critical ICU Emergency Patterns */}
                <div
                  className={`p-5 rounded-2xl border space-y-3 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <h3 className="font-bold text-sm flex items-center gap-2 text-amber-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Emergency ICU Pathological Patterns</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-amber-50 border-amber-200 text-slate-800' : 'bg-amber-950/40 border-amber-800 text-slate-200'}`}>
                      <div className={`font-bold ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
                        Cardiac Tamponade (Beck's Triad)
                      </div>
                      <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        • <strong>Low Voltage:</strong> QRS &lt; 5 mm in limb leads, &lt; 10 mm in chest leads.
                        <br />• <strong>Electrical Alternans:</strong> Beat-to-beat alternating height of QRS as heart swings in massive pericardial fluid.
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-red-50 border-red-200 text-slate-800' : 'bg-red-950/40 border-red-800 text-slate-200'}`}>
                      <div className={`font-bold ${isLight ? 'text-red-900' : 'text-red-300'}`}>
                        Hyperkalemia Sine Wave Progression
                      </div>
                      <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        K+ 6.0: Peaked symmetrical tented T waves.
                        <br />K+ 7.0: PR prolongation and P wave flattening.
                        <br />K+ 8.0: Massive QRS widening merging with T wave into a <strong>Sine Wave</strong> → imminent arrest.
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-purple-50 border-purple-200 text-slate-800' : 'bg-purple-950/40 border-purple-800 text-slate-200'}`}>
                      <div className={`font-bold ${isLight ? 'text-purple-900' : 'text-purple-300'}`}>
                        Atrial Fibrillation & Ventricular Fibrillation
                      </div>
                      <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        • <strong>AFib:</strong> Absent P waves, fibrillatory baseline (400-600 bpm), irregularly irregular R-R intervals.
                        <br />• <strong>VFib:</strong> Completely chaotic polymorphic deflections, zero cardiac output, immediate defibrillation required!
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Frontal Axis Compass */}
              <div
                className={`p-5 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <h4 className="font-bold text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span>Interactive Hexaxial Electrical Axis Calculator</span>
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                    Axis: {selectedAxisDeg}° (
                    {selectedAxisDeg >= -30 && selectedAxisDeg <= 90
                      ? 'Normal Axis'
                      : selectedAxisDeg < -30 && selectedAxisDeg >= -90
                      ? 'Left Axis Deviation (LAD)'
                      : selectedAxisDeg > 90 && selectedAxisDeg <= 180
                      ? 'Right Axis Deviation (RAD)'
                      : 'Extreme Northwest Axis'}
                    )
                  </span>
                </h4>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 font-mono">-90° (Extreme LAD)</span>
                  <input
                    type="range"
                    min="-90"
                    max="180"
                    step="5"
                    value={selectedAxisDeg}
                    onChange={(e) => setSelectedAxisDeg(parseInt(e.target.value))}
                    className="flex-1 accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 font-mono">+180° (Extreme RAD)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-mono text-xs">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500">Lead I (0°)</div>
                    <div className={`font-bold ${Math.cos((selectedAxisDeg * Math.PI) / 180) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {Math.cos((selectedAxisDeg * Math.PI) / 180) > 0 ? 'Positive (▲)' : 'Negative (▼)'}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500">Lead II (+60°)</div>
                    <div className={`font-bold ${Math.cos(((selectedAxisDeg - 60) * Math.PI) / 180) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {Math.cos(((selectedAxisDeg - 60) * Math.PI) / 180) > 0 ? 'Positive (▲)' : 'Negative (▼)'}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500">Lead aVF (+90°)</div>
                    <div className={`font-bold ${Math.cos(((selectedAxisDeg - 90) * Math.PI) / 180) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {Math.cos(((selectedAxisDeg - 90) * Math.PI) / 180) > 0 ? 'Positive (▲)' : 'Negative (▼)'}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500">Lead aVR (-150°)</div>
                    <div className={`font-bold ${Math.cos(((selectedAxisDeg + 150) * Math.PI) / 180) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {Math.cos(((selectedAxisDeg + 150) * Math.PI) / 180) > 0 ? 'Positive (▲)' : 'Negative (▼)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`flex items-center justify-between px-6 py-3 border-t text-xs ${
            isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <BookOpen className="w-4 h-4 text-rose-500" />
            <span>NMC CBME Competency PE-5.1: 12-Lead Electrocardiogram Interpretation & Clinical Correlation</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all shadow-md cursor-pointer"
          >
            Got It, Return to Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
