import React, { useState } from 'react';
import {
  Scissors,
  Hand,
  Focus,
  Eye,
  EyeOff,
  RotateCcw,
  Undo2,
  Layers,
  ChevronDown,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react';
import { DissectionToolMode, Part, SYSTEMS, SystemId } from '../data/atlasTypes';

interface DissectionToolbarProps {
  toolMode: DissectionToolMode;
  onSelectToolMode: (mode: DissectionToolMode) => void;
  isXray: boolean;
  onToggleXray: () => void;
  layerPeel: number; // 0.0 to 1.0
  onChangeLayerPeel: (val: number) => void;
  dissectedParts: Part[];
  onRestorePart: (partId: string) => void;
  onUndoLastDissect: () => void;
  onRestoreAll: () => void;
  theme?: 'light' | 'dark';
}

export const DissectionToolbar: React.FC<DissectionToolbarProps> = ({
  toolMode,
  onSelectToolMode,
  isXray,
  onToggleXray,
  layerPeel,
  onChangeLayerPeel,
  dissectedParts,
  onRestorePart,
  onUndoLastDissect,
  onRestoreAll,
  theme = 'light',
}) => {
  const [trayOpen, setTrayOpen] = useState(false);
  const isLight = theme === 'light';

  const toolLabels: { id: DissectionToolMode; label: string; icon: React.ReactNode; hint: string }[] = [
    {
      id: 'inspect',
      label: 'Inspect',
      icon: <Hand className="w-3.5 h-3.5" />,
      hint: 'Tap any organ to view clinical relations & NMC CBME notes',
    },
    {
      id: 'scalpel',
      label: 'Scalpel',
      icon: <Scissors className="w-3.5 h-3.5 text-rose-500" />,
      hint: 'Dissect mode: tap any muscle or organ to cut and peel it away',
    },
    {
      id: 'isolate',
      label: 'Isolate',
      icon: <Focus className="w-3.5 h-3.5 text-sky-500" />,
      hint: 'Isolate mode: tap any structure to hide surrounding anatomy',
    },
  ];

  const getPeelLabel = (val: number) => {
    if (val < 0.15) return 'Full Body (Skin & Superficial)';
    if (val < 0.35) return 'Superficial Muscles Exposed';
    if (val < 0.55) return 'Deep Musculature & Fascia';
    if (val < 0.75) return 'Neurovascular Bundles & Organs';
    if (val < 0.90) return 'Visceral Organs';
    return 'Skeletal Framework';
  };

  return (
    <div className="w-full space-y-2">
      {/* Main Glass Control Strip */}
      <div
        className={`p-2 rounded-2xl border backdrop-blur-xl shadow-lg flex flex-wrap items-center justify-between gap-2.5 transition-all ${
          isLight
            ? 'bg-white/95 border-slate-200/90 text-slate-800'
            : 'bg-slate-900/95 border-slate-800 text-slate-200 shadow-slate-950/50'
        }`}
      >
        {/* Left: Mode Switcher Pills */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          {toolLabels.map((t) => {
            const active = toolMode === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectToolMode(t.id)}
                title={t.hint}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? isLight
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'bg-slate-700 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}

          {/* X-Ray Ghost Mode Toggle */}
          <button
            onClick={onToggleXray}
            title="Toggle translucent X-Ray ghosting"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isXray
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>X-Ray</span>
          </button>
        </div>

        {/* Center: Anatomical Depth Peeler Slider */}
        <div className="flex-1 min-w-[220px] max-w-[360px] flex items-center gap-2 px-2">
          <Layers className="w-4 h-4 text-sky-500 shrink-0" />
          <div className="flex-1 flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Depth Peel:</span>
              <span className="text-sky-600 dark:text-sky-400 font-bold">{getPeelLabel(layerPeel)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={layerPeel}
              onChange={(e) => onChangeLayerPeel(parseFloat(e.target.value))}
              className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Right: Dissection Tray & Undo Controls */}
        <div className="flex items-center gap-1.5">
          {/* Dissected Count / Open Tray Button */}
          <button
            onClick={() => setTrayOpen(!trayOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              dissectedParts.length > 0
                ? isLight
                  ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold shadow-xs'
                  : 'bg-rose-950/50 border-rose-800 text-rose-300 font-bold'
                : isLight
                ? 'bg-slate-50 border-slate-200 text-slate-500'
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Cut ({dissectedParts.length})</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${trayOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Undo Cut Button */}
          <button
            onClick={onUndoLastDissect}
            disabled={dissectedParts.length === 0}
            title="Undo last dissected structure (Ctrl+Z)"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              dissectedParts.length > 0
                ? isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 cursor-pointer'
                : 'opacity-40 cursor-not-allowed border-transparent text-slate-400'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          {/* Restore All Button */}
          <button
            onClick={onRestoreAll}
            disabled={dissectedParts.length === 0 && layerPeel === 0 && !isXray}
            title="Restore whole body and reset layers"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              dissectedParts.length > 0 || layerPeel > 0 || isXray
                ? isLight
                  ? 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100 cursor-pointer font-semibold'
                  : 'bg-sky-950/50 border-sky-800 text-sky-300 hover:bg-sky-900 cursor-pointer font-semibold'
                : 'opacity-40 cursor-not-allowed border-transparent text-slate-400'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restore All</span>
          </button>
        </div>
      </div>

      {/* Dissected Parts Tray Drawer (Collapsible) */}
      {trayOpen && (
        <div
          className={`p-3 rounded-2xl border backdrop-blur-xl shadow-xl transition-all ${
            isLight
              ? 'bg-white/95 border-slate-200/90 text-slate-800'
              : 'bg-slate-900/95 border-slate-800 text-slate-200 shadow-slate-950/60'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <h4 className="text-xs font-bold tracking-wide uppercase font-mono">
                Dissected Structures Tray ({dissectedParts.length})
              </h4>
            </div>
            <div className="flex items-center gap-2">
              {dissectedParts.length > 0 && (
                <button
                  onClick={onRestoreAll}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                >
                  Restore All Structures
                </button>
              )}
              <button
                onClick={() => setTrayOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {dissectedParts.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
              💡 No structures dissected yet. Toggle the <span className="font-bold text-rose-500">Scalpel</span> tool
              above and tap any muscle, organ, or vessel in the 3D body to cut and remove it.
            </div>
          ) : (
            <div className="mt-2.5 max-h-48 overflow-y-auto pr-1 space-y-1.5">
              {dissectedParts.map((p) => {
                const sys = SYSTEMS.find((s) => s.id === p.system);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: sys?.color || '#a85b50' }}
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({sys?.name || p.system})</span>
                    </div>
                    <button
                      onClick={() => onRestorePart(p.id)}
                      title="Unhide this structure"
                      className="flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-700 font-bold px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Unhide</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
