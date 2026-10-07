import React from 'react';
import { Layers3, RotateCcw } from 'lucide-react';

interface AnatomySpreadControlProps {
  value: number;
  onChange: (value: number) => void;
  theme?: 'light' | 'dark';
  className?: string;
}

export const AnatomySpreadControl: React.FC<AnatomySpreadControlProps> = ({
  value,
  onChange,
  theme = 'light',
  className = '',
}) => {
  const isLight = theme === 'light';
  const percent = Math.round(value * 100);
  const phase =
    value < 0.03
      ? 'Assembled'
      : value < 0.55
      ? 'Separated systems'
      : value < 0.9
      ? 'Exploded anatomy'
      : 'Every piece';
  const interactionHint =
    value < 0.03
      ? 'Separate systems and individual structures'
      : value < 0.82
      ? 'Drag to rotate · pinch to zoom · tap label'
      : 'Drag to pan · pinch to zoom · tap label';

  return (
    <div
      data-testid="anatomy-spread-control"
      className={`pointer-events-auto rounded-2xl border backdrop-blur-xl shadow-lg px-3 py-2.5 ${className} ${
        isLight
          ? 'bg-white/95 border-slate-200/90 text-slate-800'
          : 'bg-slate-950/90 border-slate-700/90 text-slate-100'
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isLight ? 'bg-violet-50 text-violet-700' : 'bg-violet-500/15 text-violet-300'
          }`}
        >
          <Layers3 className="w-4 h-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] sm:text-xs font-extrabold tracking-wide">Spread anatomy</div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {phase} · {interactionHint}
              </div>
            </div>
            <output className="font-mono text-[11px] font-black text-violet-600 dark:text-violet-300">
              {percent}%
            </output>
          </div>

          <input
            data-testid="anatomy-spread"
            aria-label="Spread anatomical structures apart"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="mt-1.5 h-2 w-full cursor-pointer accent-violet-600"
          />

          <div className="mt-0.5 flex justify-between text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Assembled</span>
            <span>Every piece</span>
          </div>
        </div>

        {value > 0.01 && (
          <button
            type="button"
            data-testid="anatomy-spread-reset"
            aria-label="Reassemble anatomy"
            title="Reassemble anatomy"
            onClick={() => onChange(0)}
            className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center border transition-colors ${
              isLight
                ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                : 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
