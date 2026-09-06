import React, { useState } from 'react';
import {
  X,
  Heart,
  Activity,
  Zap,
  BookOpen,
  Eye,
  Shield,
  Layers,
  ChevronRight,
  Stethoscope,
  Radio,
  FileText,
  Compass,
} from 'lucide-react';
import { DetailedOrganAnatomy, ORGAN_ANATOMY_DATABASE } from '../data/organAnatomyData';

interface OrganDetailDrawerProps {
  organId: string | null;
  onClose: () => void;
  onFocusCamera?: (preset: 'anterior' | 'head' | 'thorax' | 'abdomen') => void;
  theme?: 'light' | 'dark';
}

export const OrganDetailDrawer: React.FC<OrganDetailDrawerProps> = ({
  organId,
  onClose,
  onFocusCamera,
  theme = 'light',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vascular' | 'lymphatics' | 'clinical'>(
    'overview'
  );

  if (!organId) return null;

  // Resolve organ data, fallback to heart if not exact match
  const organKey =
    Object.keys(ORGAN_ANATOMY_DATABASE).find(
      (k) =>
        k.toLowerCase() === organId.toLowerCase() ||
        ORGAN_ANATOMY_DATABASE[k].name.toLowerCase().includes(organId.toLowerCase()) ||
        organId.toLowerCase().includes(k)
    ) || 'heart';

  const organ: DetailedOrganAnatomy = ORGAN_ANATOMY_DATABASE[organKey] || ORGAN_ANATOMY_DATABASE.heart;

  const isLight = theme === 'light';

  const handleCameraJump = () => {
    if (!onFocusCamera) return;
    if (organKey === 'brain') onFocusCamera('head');
    else if (organKey === 'heart' || organKey === 'lungs') onFocusCamera('thorax');
    else if (organKey === 'liver' || organKey === 'kidney' || organKey === 'ascites') onFocusCamera('abdomen');
    else onFocusCamera('anterior');
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex justify-end">
      {/* Backdrop (clickable to dismiss on mobile) */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity"
      />

      {/* Drawer Container (Slide-up on mobile, slide-left on desktop) */}
      <aside
        className={`pointer-events-auto w-full md:w-[480px] lg:w-[540px] h-[85vh] md:h-full mt-auto md:mt-0 ${
          isLight
            ? 'bg-white/95 text-slate-900 border-l border-slate-200 shadow-2xl'
            : 'bg-slate-900/95 text-slate-100 border-l border-slate-800 shadow-2xl'
        } backdrop-blur-xl flex flex-col rounded-t-3xl md:rounded-none overflow-hidden transition-transform duration-300 ease-out z-10`}
      >
        {/* Mobile Drag Pill Indicator */}
        <div className="md:hidden pt-3 pb-1 flex justify-center">
          <div className={`w-12 h-1.5 rounded-full ${isLight ? 'bg-slate-300' : 'bg-slate-700'}`} />
        </div>

        {/* Drawer Header */}
        <div
          className={`p-4 md:p-5 border-b ${
            isLight ? 'border-slate-100 bg-slate-50/70' : 'border-slate-800/80 bg-slate-950/40'
          } flex items-start justify-between gap-3`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isLight
                    ? 'bg-sky-100 text-sky-700 border border-sky-200'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {organ.system}
              </span>
              <span
                className={`text-[11px] font-medium italic ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {organ.latinName}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
              {organ.name}
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {organ.quadrantOrCavity}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCameraJump}
              title="Focus 3D Viewport on this organ"
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                isLight
                  ? 'bg-white hover:bg-sky-50 text-sky-700 border-sky-200 shadow-sm'
                  : 'bg-slate-800 hover:bg-cyan-950/60 text-cyan-300 border-slate-700'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">Focus 3D</span>
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div
          className={`px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar ${
            isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800 bg-slate-950/20'
          }`}
        >
          {[
            { id: 'overview', label: 'Overview & Relations', icon: BookOpen },
            { id: 'vascular', label: 'Vessels & Nerves', icon: Zap },
            { id: 'clinical', label: 'Bedside & NMC Pearls', icon: Stethoscope },
            { id: 'lymphatics', label: 'Lymph & Surgery', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isCurrent
                    ? isLight
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/20'
                      : 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20'
                    : isLight
                    ? 'text-slate-600 hover:bg-slate-200/60'
                    : 'text-slate-400 hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Surface Landmarks Card */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-sky-50/60 border-sky-100' : 'bg-cyan-950/20 border-cyan-900/40'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-cyan-400 uppercase tracking-wider mb-2">
                  <Compass className="w-4 h-4" />
                  Surface Anatomical Landmarks
                </div>
                <p className={`text-sm leading-relaxed font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  {organ.surfaceLandmarks}
                </p>
                <div className={`mt-3 pt-3 border-t text-xs flex items-center gap-2 ${isLight ? 'border-sky-200/60 text-slate-500' : 'border-cyan-900/60 text-slate-400'}`}>
                  <span className="font-semibold">Dimensions & Weight:</span>
                  <span>{organ.dimensionsAndWeight}</span>
                </div>
              </div>

              {/* Musculoskeletal Relations */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-800/40 border-slate-800'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  Musculoskeletal & Peritoneal Relations
                </h4>
                <ul className="space-y-2 text-xs leading-relaxed">
                  {organ.musculoskeletalRelations.map((rel, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{rel}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Musculoskeletal Attachments & Biomechanics (Z-Anatomy Standard) */}
              {organ.originsAndInsertions && (
                <div
                  className={`p-4 rounded-2xl border ${
                    isLight ? 'bg-amber-50/70 border-amber-200/80' : 'bg-amber-950/20 border-amber-900/40'
                  }`}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-2.5 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" />
                    Musculoskeletal Origins, Insertions & Biomechanics
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-300">Origins (Origo): </span>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {organ.originsAndInsertions.origin.map((o, idx) => (
                          <li key={idx} className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-300">Insertions (Insertio): </span>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {organ.originsAndInsertions.insertion.map((ins, idx) => (
                          <li key={idx} className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                            {ins}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-300">Action (Actio): </span>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {organ.originsAndInsertions.action.map((act, idx) => (
                          <li key={idx} className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                            {act}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-1.5 border-t border-amber-200 dark:border-amber-900/60">
                      <span className="font-bold text-amber-900 dark:text-amber-300">Innervation: </span>
                      <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                        {organ.originsAndInsertions.nerveSupply}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* In-House Supabase Textbook Curriculum & Diagram */}
              {organ.supabaseTextbookReference && (
                <div
                  className={`p-4 rounded-2xl border ${
                    isLight ? 'bg-emerald-50/70 border-emerald-200/80' : 'bg-emerald-950/20 border-emerald-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      In-House Orbit MBBS Textbook Notes
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase">
                      Verified BDC / Gray's
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 mb-2">
                    {organ.supabaseTextbookReference.subtopic}
                  </p>
                  <ul className="space-y-1.5 text-xs mb-3">
                    {organ.supabaseTextbookReference.keyPearls.map((kp, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                  {organ.supabaseTextbookReference.diagramUrl && (
                    <div className="rounded-xl overflow-hidden border border-emerald-200/80 dark:border-emerald-900/40 bg-white dark:bg-slate-900 p-1">
                      <img
                        src={organ.supabaseTextbookReference.diagramUrl}
                        alt={organ.name}
                        className="w-full h-40 object-contain rounded-lg bg-slate-50 dark:bg-slate-950"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="text-[10px] text-center text-slate-400 py-1">
                        Curriculum Plate: {organ.name}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Histology & Core Physiology */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-800/40 border-slate-800'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-500" />
                  Histology & Microscopic Physiology
                </h4>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {organ.histologyAndPhysiology}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: VASCULAR & NERVES */}
          {activeTab === 'vascular' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Arterial Supply */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-rose-50/50 border-rose-100' : 'bg-rose-950/20 border-rose-900/40'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Arterial Blood Supply
                </h4>
                <div className="space-y-2">
                  {organ.arterialSupply.map((art, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-2.5 rounded-xl border leading-relaxed ${
                        isLight
                          ? 'bg-white border-rose-100 text-slate-700 shadow-sm'
                          : 'bg-slate-900/60 border-rose-900/30 text-slate-200'
                      }`}
                    >
                      {art}
                    </div>
                  ))}
                </div>
              </div>

              {/* Venous Drainage */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-blue-50/50 border-blue-100' : 'bg-blue-950/20 border-blue-900/40'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Venous Drainage
                </h4>
                <div className="space-y-2">
                  {organ.venousDrainage.map((vein, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-2.5 rounded-xl border leading-relaxed ${
                        isLight
                          ? 'bg-white border-blue-100 text-slate-700 shadow-sm'
                          : 'bg-slate-900/60 border-blue-900/30 text-slate-200'
                      }`}
                    >
                      {vein}
                    </div>
                  ))}
                </div>
              </div>

              {/* Innervation & Referred Pain */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-amber-50/50 border-amber-100' : 'bg-amber-950/20 border-amber-900/40'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Autonomic Innervation & Pain Referral
                </h4>
                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  <div className={`p-2.5 rounded-xl ${isLight ? 'bg-white border border-amber-100' : 'bg-slate-900/60'}`}>
                    <span className="font-bold text-amber-600 dark:text-amber-400">Sympathetic: </span>
                    <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                      {organ.innervation.sympathetic}
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-xl ${isLight ? 'bg-white border border-amber-100' : 'bg-slate-900/60'}`}>
                    <span className="font-bold text-amber-600 dark:text-amber-400">Parasympathetic: </span>
                    <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                      {organ.innervation.parasympathetic}
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-xl ${isLight ? 'bg-white border border-amber-100' : 'bg-slate-900/60'}`}>
                    <span className="font-bold text-amber-600 dark:text-amber-400">Sensory/Somatic: </span>
                    <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                      {organ.innervation.somaticOrSensory}
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-xl ${isLight ? 'bg-amber-100/60 text-amber-900' : 'bg-amber-950/40 text-amber-200'}`}>
                    <span className="font-bold">Referred Pain Pattern: </span>
                    <span>{organ.innervation.referredPain}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLINICAL & NMC VIVA PEARLS */}
          {activeTab === 'clinical' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Bedside Examination Signs */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-emerald-50/60 border-emerald-100' : 'bg-emerald-950/20 border-emerald-900/40'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2.5 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-500" />
                  Bedside Physical Signs & Auscultation
                </h4>
                <div className="space-y-2">
                  {organ.clinicalBedsideSigns.map((sign, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-3 rounded-xl border leading-relaxed ${
                        isLight
                          ? 'bg-white border-emerald-100 text-slate-700 shadow-sm'
                          : 'bg-slate-900/60 border-emerald-900/30 text-slate-200'
                      }`}
                    >
                      {sign}
                    </div>
                  ))}
                </div>
              </div>

              {/* NMC CBME High-Yield Viva Questions */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-indigo-50/60 border-indigo-100' : 'bg-indigo-950/20 border-indigo-900/40'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-2.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  High-Yield NMC CBME Viva Traps & Questions
                </h4>
                <div className="space-y-2.5">
                  {organ.nmcMbbssVivaPearls.map((pearl, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-3 rounded-xl border leading-relaxed ${
                        isLight
                          ? 'bg-white border-indigo-100 text-slate-700 shadow-sm'
                          : 'bg-slate-900/60 border-indigo-900/30 text-slate-200'
                      }`}
                    >
                      {pearl}
                    </div>
                  ))}
                </div>
              </div>

              {/* Radiology Correlation */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-800'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-cyan-500" />
                  Radiological & Ultrasound Correlation
                </h4>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {organ.radiologicalCorrelation}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: LYMPHATICS & SURGICAL APPROACH */}
          {activeTab === 'lymphatics' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Lymphatic Basins */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-teal-50/60 border-teal-100' : 'bg-teal-950/20 border-teal-900/40'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-2.5 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-teal-500" />
                  Lymphatic Drainage & Oncological Basins
                </h4>
                <ul className="space-y-2 text-xs leading-relaxed">
                  {organ.lymphaticDrainage.map((lym, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                      <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{lym}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Surgical Approaches */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-800'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-rose-500" />
                  Surgical Exposure & Operative Incisions
                </h4>
                <p className={`text-xs leading-relaxed font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {organ.surgicalApproaches}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Organ Selection Carousel at Bottom */}
        <div
          className={`p-3 border-t ${
            isLight ? 'border-slate-100 bg-slate-50/80' : 'border-slate-800 bg-slate-950/60'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Explore Other Organs:</span>
            <span className="text-slate-400">9 Core Anatomical Systems</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'heart', name: 'Heart' },
              { id: 'lungs', name: 'Lungs' },
              { id: 'brain', name: 'Brain' },
              { id: 'liver', name: 'Liver' },
              { id: 'stomach', name: 'Stomach' },
              { id: 'pancreas', name: 'Pancreas' },
              { id: 'spleen', name: 'Spleen' },
              { id: 'kidney', name: 'Kidneys' },
              { id: 'skeletal', name: 'Skeleton' },
              { id: 'aorta', name: 'Aorta' },
              { id: 'ascites', name: 'Ascites' },
              { id: 'snakebite', name: 'Snakebite' },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  const evt = new CustomEvent('select-simulator-organ', { detail: { organId: o.id } });
                  window.dispatchEvent(evt);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  organKey === o.id
                    ? isLight
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-cyan-500 text-slate-950'
                    : isLight
                    ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {o.name}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};
