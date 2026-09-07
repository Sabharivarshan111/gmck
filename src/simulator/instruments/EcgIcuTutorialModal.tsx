import React, { useState } from 'react';
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
  Maximize2
} from 'lucide-react';

interface EcgIcuTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

type TutorialLevel = 'lkg' | 'med_student' | 'resident' | 'specialist';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-900 shadow-slate-900/20'
            : 'bg-[#090e1a] border-slate-800 text-slate-100 shadow-cyan-950/30'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">
                  12-Lead ECG & ICU Telemetry Masterclass
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  LKG to Specialist
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A structured pedagogical journey from kindergarten intuitive mechanics to cardiology fellowship electrophysiology.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
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
          className={`flex items-center gap-2 px-6 py-3 border-b overflow-x-auto ${
            isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-950/70 border-slate-800/80'
          }`}
        >
          {[
            {
              id: 'lkg',
              label: 'Tier 1: Kindergarten (LKG)',
              badge: 'Intuitive Basics',
              icon: '🐣',
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
              className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ================================================================= */}
          {/* TIER 1: KINDERGARTEN (LKG)                                        */}
          {/* ================================================================= */}
          {activeLevel === 'lkg' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. The Heart is a 2-Stroke Water Pump */}
                <div
                  className={`p-5 rounded-2xl border ${
                    isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl mb-3">
                    💧
                  </div>
                  <h3 className={`font-bold text-sm mb-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    1. The Heart is a Water Pump
                  </h3>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Think of your heart like a squeeze toy or bicycle pump. Every beat, it squeezes to shoot clean red blood through pipes (arteries) to your brain, tummy, and toes!
                  </p>
                  <div className={`mt-3 p-2.5 rounded-xl text-[11px] font-medium ${
                    isLight ? 'bg-rose-50 text-rose-900 border border-rose-200' : 'bg-rose-950/40 text-rose-300 border border-rose-800'
                  }`}>
                    💡 <strong>Rule 1:</strong> Squeeze = Systole (Shoots blood out). Relax = Diastole (Refills with fresh blood).
                  </div>
                </div>

                {/* 2. The Heart Has Its Own Battery & Spark Plug */}
                <div
                  className={`p-5 rounded-2xl border ${
                    isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl mb-3">
                    ⚡
                  </div>
                  <h3 className={`font-bold text-sm mb-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    2. The Built-in Battery (SA Node)
                  </h3>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    How does the pump know when to squeeze? It has a natural spark plug at the top called the <strong>SA Node</strong>. It sparks about 70 times every single minute, like a tiny metronome!
                  </p>
                  <div className={`mt-3 p-2.5 rounded-xl text-[11px] font-medium ${
                    isLight ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-amber-950/40 text-amber-300 border border-amber-800'
                  }`}>
                    💡 <strong>Rule 2:</strong> Electricity travels down built-in wires. When the spark hits muscle, the muscle snaps shut!
                  </div>
                </div>

                {/* 3. What is an ECG? It's a Camera Angle! */}
                <div
                  className={`p-5 rounded-2xl border ${
                    isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-xl mb-3">
                    📸
                  </div>
                  <h3 className={`font-bold text-sm mb-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    3. What is an ECG "Lead"?
                  </h3>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Imagine 12 paparazzi photographers standing around a sports car. One takes a photo from the front, one from the roof, one from the exhaust pipe. <strong>Each ECG lead is just a camera angle!</strong>
                  </p>
                  <div className={`mt-3 p-2.5 rounded-xl text-[11px] font-medium ${
                    isLight ? 'bg-sky-50 text-sky-900 border border-sky-200' : 'bg-sky-950/40 text-sky-300 border border-sky-800'
                  }`}>
                    💡 <strong>The Golden Camera Rule:</strong>
                    <br />• Wave running <strong>TOWARD</strong> camera = Pen draws <strong>UP (▲)</strong>
                    <br />• Wave running <strong>AWAY</strong> from camera = Pen draws <strong>DOWN (▼)</strong>
                  </div>
                </div>
              </div>

              {/* Intuitive Wave Diagram */}
              <div
                className={`p-6 rounded-2xl border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <span>🎨 The 3 Simple Beats of Every Heartbeat</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                    <div className="text-2xl font-black text-rose-500 mb-1">P Wave</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      "Atrial Top Chambers Squeeze"
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      The baby gentle bump before the big mountain. The top chambers push the last drops of blood down into the main pumps.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                    <div className="text-2xl font-black text-emerald-500 mb-1">QRS Spike</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      "Ventricular Main Blast"
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      The tall skyscraper spike! The big muscular bottom ventricles fire with massive power, shooting blood to your entire body.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                    <div className="text-2xl font-black text-cyan-500 mb-1">T Wave</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      "Recharging the Battery"
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      The smooth rolling hill after the spike. The heart muscle quickly recharges its electrical battery so it's ready to fire again!
                    </p>
                  </div>
                </div>
              </div>
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
