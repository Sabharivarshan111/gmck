import React, { useState, useEffect } from 'react';
import {
  X,
  Scissors,
  Zap,
  BookOpen,
  Shield,
  Layers,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  Activity,
  Compass,
  ArrowRight,
  Sparkles,
  Maximize2,
  Minimize2,
  Navigation,
  Eye
} from 'lucide-react';
import {
  DetailedOrganAnatomy,
  ORGAN_ANATOMY_DATABASE,
  VascularNodeReference,
  NerveNodeReference
} from '../data/organAnatomyData';

interface OrganDetailDrawerProps {
  organId: string | null;
  onClose: () => void;
  onFocusCamera?: (preset: 'anterior' | 'head' | 'thorax' | 'abdomen') => void;
  onSelectOrgan?: (organId: string) => void;
  onIsolateStructure?: (structureId: string | null) => void;
  onDissectOrgan?: (organId: string) => void;
  theme?: 'light' | 'dark';
}

export const OrganDetailDrawer: React.FC<OrganDetailDrawerProps> = ({
  organId,
  onClose,
  onFocusCamera,
  onSelectOrgan,
  onIsolateStructure,
  onDissectOrgan,
  theme = 'light',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vascular' | 'relations' | 'clinical' | 'lymphatics'>(
    'overview'
  );
  const [navHistory, setNavHistory] = useState<string[]>([]);
  const [isIsolated, setIsIsolated] = useState(false);

  // Sync initial organId into history
  useEffect(() => {
    if (organId) {
      setNavHistory([organId]);
      setIsIsolated(false);
    } else {
      setNavHistory([]);
      setIsIsolated(false);
    }
  }, [organId]);

  if (!organId && navHistory.length === 0) return null;

  const currentNavId = navHistory[navHistory.length - 1] || organId || 'heart';

  // Resolve organ data, fallback to best match or heart
  const organKey =
    Object.keys(ORGAN_ANATOMY_DATABASE).find(
      (k) =>
        k.toLowerCase() === currentNavId.toLowerCase() ||
        ORGAN_ANATOMY_DATABASE[k].name.toLowerCase().includes(currentNavId.toLowerCase()) ||
        currentNavId.toLowerCase().includes(k)
    ) || 'heart';

  const organ: DetailedOrganAnatomy = ORGAN_ANATOMY_DATABASE[organKey] || ORGAN_ANATOMY_DATABASE.heart;
  const isLight = theme === 'light';

  const handleCameraJump = (presetOverride?: 'anterior' | 'head' | 'thorax' | 'abdomen') => {
    if (!onFocusCamera) return;
    if (presetOverride) {
      onFocusCamera(presetOverride);
      return;
    }
    if (organKey.includes('brain') || organKey.includes('vagus')) onFocusCamera('head');
    else if (organKey.includes('heart') || organKey.includes('lung') || organKey.includes('artery') || organKey.includes('sinus') || organKey.includes('phrenic') || organKey.includes('pectoralis')) onFocusCamera('thorax');
    else if (organKey.includes('liver') || organKey.includes('kidney') || organKey.includes('celiac') || organKey.includes('portal') || organKey.includes('stomach') || organKey.includes('spleen') || organKey.includes('pancreas')) onFocusCamera('abdomen');
    else onFocusCamera('anterior');
  };

  const navigateToStructure = (targetId: string, cameraPreset?: 'anterior' | 'head' | 'thorax' | 'abdomen') => {
    setNavHistory((prev) => [...prev, targetId]);
    if (onSelectOrgan) onSelectOrgan(targetId);
    if (cameraPreset) {
      handleCameraJump(cameraPreset);
    } else {
      // Automatic camera based on entity
      if (targetId.includes('brain') || targetId.includes('head') || targetId.includes('vagus')) {
        handleCameraJump('head');
      } else if (targetId.includes('heart') || targetId.includes('lung') || targetId.includes('artery') || targetId.includes('phrenic')) {
        handleCameraJump('thorax');
      } else if (targetId.includes('liver') || targetId.includes('kidney') || targetId.includes('celiac') || targetId.includes('portal')) {
        handleCameraJump('abdomen');
      }
    }
  };

  const handleGoBack = () => {
    if (navHistory.length > 1) {
      const newHistory = navHistory.slice(0, -1);
      setNavHistory(newHistory);
      const prevId = newHistory[newHistory.length - 1];
      if (onSelectOrgan) onSelectOrgan(prevId);
    } else {
      onClose();
    }
  };

  const toggleIsolation = () => {
    if (isIsolated) {
      setIsIsolated(false);
      if (onIsolateStructure) onIsolateStructure(null);
    } else {
      setIsIsolated(true);
      if (onIsolateStructure) onIsolateStructure(organKey);
    }
  };

  // Build breadcrumbs trail
  const breadcrumbItems: { id: string; label: string }[] = organ.breadcrumbs && organ.breadcrumbs.length > 0
    ? organ.breadcrumbs
    : [
        { id: organ.quadrantOrCavity.toLowerCase(), label: organ.quadrantOrCavity.split('(')[0].trim() },
        { id: organ.id, label: organ.name.split('(')[0].trim() }
      ];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex justify-end">
      {/* Backdrop (tap to dismiss on mobile) */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity"
      />

      {/* Drawer Container */}
      <aside
        className={`pointer-events-auto w-full md:w-[500px] lg:w-[560px] h-[90vh] md:h-full mt-auto md:mt-0 ${
          isLight
            ? 'bg-white/95 text-slate-900 border-l border-slate-200 shadow-2xl'
            : 'bg-slate-900/95 text-slate-100 border-l border-slate-800 shadow-2xl'
        } backdrop-blur-2xl flex flex-col rounded-t-3xl md:rounded-none overflow-hidden transition-transform duration-300 ease-out z-10`}
      >
        {/* Mobile Drag Pill */}
        <div className="md:hidden pt-3 pb-1 flex justify-center">
          <div className={`w-12 h-1.5 rounded-full ${isLight ? 'bg-slate-300' : 'bg-slate-700'}`} />
        </div>

        {/* Apple HIG Breadcrumbs Bar with Back Button */}
        <div
          className={`px-4 py-2 border-b flex items-center justify-between gap-2 text-xs font-medium overflow-x-auto no-scrollbar ${
            isLight ? 'bg-slate-50 border-slate-200/80 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {navHistory.length > 1 && (
              <button
                onClick={handleGoBack}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors min-h-[32px] ${
                  isLight ? 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 shadow-xs' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
                title="Return to parent structure"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar whitespace-nowrap text-[11px]">
              {breadcrumbItems.map((b, idx) => (
                <React.Fragment key={b.id + idx}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                  <button
                    onClick={() => navigateToStructure(b.id)}
                    className={`font-semibold px-2 py-0.5 rounded-md transition-colors ${
                      idx === breadcrumbItems.length - 1
                        ? isLight
                          ? 'text-sky-700 bg-sky-50 font-bold'
                          : 'text-cyan-300 bg-cyan-950/40 font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {b.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
              isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-200/60' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Header: Title, Category, Action Buttons */}
        <div
          className={`p-4 md:p-5 border-b ${
            isLight ? 'border-slate-100 bg-white' : 'border-slate-800/80 bg-slate-900/60'
          } flex items-start justify-between gap-3`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isLight
                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                    : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {organ.system}
              </span>
              <span
                className={`text-[11px] font-medium italic truncate max-w-[200px] ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {organ.latinName}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
              {organ.name}
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {organ.quadrantOrCavity}
            </p>
          </div>

          {/* Quick 3D Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => handleCameraJump()}
              title="Center and zoom 3D Viewport"
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all min-h-[44px] px-3 ${
                isLight
                  ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200 shadow-xs'
                  : 'bg-slate-800 hover:bg-cyan-950/60 text-cyan-300 border-slate-700'
              }`}
            >
              <Compass className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              <span className="hidden sm:inline">Focus 3D</span>
            </button>

            <button
              onClick={toggleIsolation}
              title={isIsolated ? 'Restore full anatomy view' : 'Isolate this structure in 3D viewport'}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all min-h-[44px] px-3 ${
                isIsolated
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/40'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">{isIsolated ? 'Isolated' : 'Isolate'}</span>
            </button>

            {onDissectOrgan && (
              <button
                onClick={() => {
                  onDissectOrgan(organKey);
                  onClose();
                }}
                title="Dissect / Remove structure from 3D model"
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all min-h-[44px] px-3 ${
                  isLight
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                    : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/60'
                }`}
              >
                <Scissors className="w-4 h-4 text-rose-500" />
                <span className="hidden sm:inline">Dissect</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div
          className={`px-4 py-2.5 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar ${
            isLight ? 'border-slate-100 bg-slate-50/70' : 'border-slate-800 bg-slate-950/40'
          }`}
        >
          {[
            { id: 'overview', label: 'Overview & Graph', icon: BookOpen },
            { id: 'vascular', label: 'Vessels & Nerves', icon: Zap },
            { id: 'relations', label: '6-Vector Relations', icon: Compass },
            { id: 'clinical', label: 'Bedside & NMC Viva', icon: Stethoscope },
            { id: 'lymphatics', label: 'Lymph & Surgery', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap min-h-[40px] transition-all ${
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
          {/* TAB 1: OVERVIEW & MUSCLE GRAPH */}
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

              {/* Musculoskeletal Attachments & Biomechanics (Z-Anatomy Standard) */}
              {(organ.muscleGraph || organ.originsAndInsertions) && (
                <div
                  className={`p-4 rounded-2xl border ${
                    isLight ? 'bg-amber-50/70 border-amber-200/80' : 'bg-amber-950/20 border-amber-900/40'
                  }`}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" />
                    Musculoskeletal Origins, Insertions & Biomechanics
                  </h4>

                  {/* Origins */}
                  <div className="mb-3">
                    <span className="font-bold text-xs text-amber-900 dark:text-amber-300">
                      Origins (Origo) — Clickable Osseous Landmarks:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {organ.muscleGraph?.origins.map((o, idx) => (
                        <button
                          key={idx}
                          onClick={() => navigateToStructure(o.bone.toLowerCase())}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 hover:bg-amber-200 transition-colors min-h-[36px] flex items-center gap-1"
                        >
                          <span className="font-bold">{o.bone}:</span> {o.landmark}
                        </button>
                      )) ||
                        organ.originsAndInsertions?.origin.map((o, idx) => (
                          <div
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
                          >
                            {o}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Insertions */}
                  <div className="mb-3">
                    <span className="font-bold text-xs text-amber-900 dark:text-amber-300">
                      Insertions (Insertio) — Clickable Osseous Landmarks:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {organ.muscleGraph?.insertions.map((ins, idx) => (
                        <button
                          key={idx}
                          onClick={() => navigateToStructure(ins.bone.toLowerCase())}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 hover:bg-amber-200 transition-colors min-h-[36px] flex items-center gap-1"
                        >
                          <span className="font-bold">{ins.bone}:</span> {ins.landmark}
                        </button>
                      )) ||
                        organ.originsAndInsertions?.insertion.map((ins, idx) => (
                          <div
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
                          >
                            {ins}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Actions & Antagonists */}
                  <div className="space-y-1.5 text-xs pt-2 border-t border-amber-200/80 dark:border-amber-900/60">
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-300">Primary Actions: </span>
                      <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                        {organ.muscleGraph?.action || organ.originsAndInsertions?.action.join('; ')}
                      </span>
                    </div>
                    {organ.muscleGraph?.synergists && (
                      <div>
                        <span className="font-bold text-amber-900 dark:text-amber-300">Synergists: </span>
                        <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                          {organ.muscleGraph.synergists}
                        </span>
                      </div>
                    )}
                    {organ.muscleGraph?.antagonists && (
                      <div>
                        <span className="font-bold text-amber-900 dark:text-amber-300">Antagonists: </span>
                        <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                          {organ.muscleGraph.antagonists}
                        </span>
                      </div>
                    )}
                    <div className="pt-1 font-semibold text-amber-800 dark:text-amber-300">
                      <span>Innervation: </span>
                      <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                        {organ.muscleGraph?.nerveSupply || organ.originsAndInsertions?.nerveSupply}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* In-House Supabase Textbook Curriculum Notes */}
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
                      BDC / Gray's
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

          {/* TAB 2: VESSELS & NERVES (INTERACTIVE CLICKABLE GRAPH) */}
          {activeTab === 'vascular' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Arterial Supply Cards */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-rose-50/50 border-rose-100' : 'bg-rose-950/20 border-rose-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Arterial Blood Supply & Branches
                  </h4>
                  <span className="text-[10px] font-semibold text-rose-500 uppercase">Clickable Nodes</span>
                </div>

                {/* Rich interactive arterial cards */}
                {organ.arterialNodes && organ.arterialNodes.length > 0 ? (
                  <div className="space-y-2.5">
                    {organ.arterialNodes.map((art) => (
                      <div
                        key={art.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isLight
                            ? 'bg-white border-rose-100 hover:border-rose-300 shadow-xs'
                            : 'bg-slate-900/80 border-rose-900/40 hover:border-rose-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {art.name}
                            </div>
                            {art.parentVessel && (
                              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                                Parent: {art.parentVessel}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => navigateToStructure(art.id, art.cameraPreset)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1 min-h-[36px] transition-colors"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                          <span className="font-semibold">Territory:</span> {art.territory}
                        </p>
                        <div className="text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg mt-2 border border-rose-100 dark:border-rose-900/30">
                          <span className="font-bold">Clinical Pearl:</span> {art.clinicalNote}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {organ.arterialSupply.map((art, idx) => (
                      <div
                        key={idx}
                        className={`text-xs p-2.5 rounded-xl border leading-relaxed ${
                          isLight
                            ? 'bg-white border-rose-100 text-slate-700 shadow-xs'
                            : 'bg-slate-900/60 border-rose-900/30 text-slate-200'
                        }`}
                      >
                        {art}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Venous Drainage Cards */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-blue-50/50 border-blue-100' : 'bg-blue-950/20 border-blue-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Venous Drainage & Return
                  </h4>
                  <span className="text-[10px] font-semibold text-blue-500 uppercase">Clickable Nodes</span>
                </div>

                {organ.venousNodes && organ.venousNodes.length > 0 ? (
                  <div className="space-y-2.5">
                    {organ.venousNodes.map((vein) => (
                      <div
                        key={vein.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isLight
                            ? 'bg-white border-blue-100 hover:border-blue-300 shadow-xs'
                            : 'bg-slate-900/80 border-blue-900/40 hover:border-blue-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {vein.name}
                            </div>
                            {vein.parentVessel && (
                              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                                Drains into: {vein.parentVessel}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => navigateToStructure(vein.id, vein.cameraPreset)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1 min-h-[36px] transition-colors"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                          <span className="font-semibold">Territory:</span> {vein.territory}
                        </p>
                        <div className="text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg mt-2 border border-blue-100 dark:border-blue-900/30">
                          <span className="font-bold">Clinical Pearl:</span> {vein.clinicalNote}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {organ.venousDrainage.map((vein, idx) => (
                      <div
                        key={idx}
                        className={`text-xs p-2.5 rounded-xl border leading-relaxed ${
                          isLight
                            ? 'bg-white border-blue-100 text-slate-700 shadow-xs'
                            : 'bg-slate-900/60 border-blue-900/30 text-slate-200'
                        }`}
                      >
                        {vein}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Innervation & Nerve Nodes */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-amber-50/50 border-amber-100' : 'bg-amber-950/20 border-amber-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Peripheral & Autonomic Nerves
                  </h4>
                  <span className="text-[10px] font-semibold text-amber-600 uppercase">Innervation</span>
                </div>

                {organ.nerveNodes && organ.nerveNodes.length > 0 && (
                  <div className="space-y-2.5 mb-3">
                    {organ.nerveNodes.map((nerve) => (
                      <div
                        key={nerve.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isLight
                            ? 'bg-white border-amber-100 hover:border-amber-300 shadow-xs'
                            : 'bg-slate-900/80 border-amber-900/40 hover:border-amber-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {nerve.name}
                            </div>
                            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                              Roots: {nerve.roots} | Origin: {nerve.origin}
                            </div>
                          </div>
                          <button
                            onClick={() => navigateToStructure(nerve.id, nerve.cameraPreset)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 min-h-[36px] transition-colors"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-xs space-y-1 mt-2 text-slate-600 dark:text-slate-300">
                          <div><span className="font-semibold">Motor:</span> {nerve.motorSupply}</div>
                          <div><span className="font-semibold">Sensory:</span> {nerve.sensorySupply}</div>
                        </div>
                        <div className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg mt-2 border border-amber-100 dark:border-amber-900/30">
                          <span className="font-bold">Bedside Pearl:</span> {nerve.clinicalNote}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Autonomic Breakdown & Referred Pain */}
                <div className="grid grid-cols-1 gap-2 text-xs">
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

          {/* TAB 3: 6-DIRECTION ORTHOGONAL RELATIONS COMPASS */}
          {activeTab === 'relations' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-indigo-50/50 border-indigo-100' : 'bg-indigo-950/20 border-indigo-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-indigo-500" />
                    6-Vector Orthogonal Anatomical Relations
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200">
                    Spatial Matrix
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Click any adjacent anatomical structure to navigate, focus the 3D camera, and isolate that anatomical plane.
                </p>

                {organ.relationsStructured ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Superior */}
                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-indigo-100' : 'bg-slate-900/60 border-indigo-950'}`}>
                      <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                        <span>↑ Superior (Cranial)</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {organ.relationsStructured.superior.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => navigateToStructure(item.toLowerCase())}
                            className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-slate-700 dark:text-slate-300 transition-colors min-h-[32px]"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Inferior */}
                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-indigo-100' : 'bg-slate-900/60 border-indigo-950'}`}>
                      <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                        <span>↓ Inferior (Caudal)</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {organ.relationsStructured.inferior.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => navigateToStructure(item.toLowerCase())}
                            className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-slate-700 dark:text-slate-300 transition-colors min-h-[32px]"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Anterior */}
                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-indigo-100' : 'bg-slate-900/60 border-indigo-950'}`}>
                      <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                        <span>⊙ Anterior (Ventral)</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {organ.relationsStructured.anterior.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => navigateToStructure(item.toLowerCase())}
                            className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-slate-700 dark:text-slate-300 transition-colors min-h-[32px]"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Posterior */}
                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-indigo-100' : 'bg-slate-900/60 border-indigo-950'}`}>
                      <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                        <span>⊗ Posterior (Dorsal)</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {organ.relationsStructured.posterior.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => navigateToStructure(item.toLowerCase())}
                            className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-slate-700 dark:text-slate-300 transition-colors min-h-[32px]"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Medial */}
                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-indigo-100' : 'bg-slate-900/60 border-indigo-950'}`}>
                      <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                        <span>→ Medial</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {organ.relationsStructured.medial.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => navigateToStructure(item.toLowerCase())}
                            className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-slate-700 dark:text-slate-300 transition-colors min-h-[32px]"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lateral */}
                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-indigo-100' : 'bg-slate-900/60 border-indigo-950'}`}>
                      <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                        <span>← Lateral</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {organ.relationsStructured.lateral.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => navigateToStructure(item.toLowerCase())}
                            className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-slate-700 dark:text-slate-300 transition-colors min-h-[32px]"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-2 text-xs leading-relaxed">
                    {organ.musculoskeletalRelations.map((rel, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                        <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{rel}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CLINICAL & NMC VIVA PEARLS */}
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
                  Key Bedside Examination Findings
                </h4>
                <div className="space-y-2">
                  {organ.clinicalBedsideSigns.map((sign, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
                        isLight
                          ? 'bg-white border-emerald-100 text-slate-700 shadow-xs'
                          : 'bg-slate-900/60 border-emerald-900/30 text-slate-200'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <span>{sign}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* NMC MBBS Viva Exam Pearls */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-purple-50/60 border-purple-100' : 'bg-purple-950/20 border-purple-900/40'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  NMC MBBS Practical / Viva High-Yield Pearls
                </h4>
                <div className="space-y-2">
                  {organ.nmcMbbssVivaPearls.map((pearl, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        isLight
                          ? 'bg-white border-purple-100 text-slate-700 shadow-xs'
                          : 'bg-slate-900/60 border-purple-900/30 text-slate-200'
                      }`}
                    >
                      {pearl}
                    </div>
                  ))}
                </div>
              </div>

              {/* Radiological Correlation */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-800/40 border-slate-800'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-sky-500" />
                  Radiological Correlation (X-Ray / CT / Ultrasound)
                </h4>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {organ.radiologicalCorrelation}
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: LYMPHATICS & SURGICAL APPROACHES */}
          {activeTab === 'lymphatics' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Surgical Approaches */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-amber-50/60 border-amber-100' : 'bg-amber-950/20 border-amber-900/40'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-amber-500" />
                  Standard Surgical Incisions & Approaches
                </h4>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  {organ.surgicalApproaches}
                </p>
              </div>

              {/* Lymphatic Drainage */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-emerald-50/50 border-emerald-100' : 'bg-emerald-950/20 border-emerald-900/40'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2.5 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  Lymphatic Node Drainage
                </h4>
                <ul className="space-y-2 text-xs leading-relaxed">
                  {organ.lymphaticDrainage.map((lymph, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{lymph}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
