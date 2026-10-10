import React, { useEffect, useMemo, useState, memo } from 'react';
import type { Atlas, SystemId } from '../data/atlasTypes';
import { SYSTEMS } from '../data/atlasTypes';
import { partBelongsToRegion, REGION_LABELS, type AnatomyRegion } from '../data/anatomyRegions';

export const RegionStructureBrowser = memo(function RegionStructureBrowser({ atlas, region, onSelect, theme }: {
  atlas: Atlas | null; region: AnatomyRegion; onSelect: (id: string) => void; theme: 'light' | 'dark';
}) {
  const [expanded, setExpanded] = useState(false);
  const [system, setSystem] = useState<SystemId | null>(null);
  const [query, setQuery] = useState('');
  useEffect(() => { setSystem(null); setQuery(''); }, [region]);
  const parts = useMemo(() => atlas?.parts.filter(p => partBelongsToRegion(p, region)) || [], [atlas, region]);
  const matches = useMemo(() => parts.filter(p => (!system || p.system === system) && p.name.toLowerCase().includes(query.toLowerCase())), [parts, system, query]);
  const groups = useMemo(() => SYSTEMS.map(s => ({ ...s, count: parts.filter(p => p.system === s.id).length })).filter(s => s.count), [parts]);
  return <section data-testid="region-structure-browser" className={`rounded-2xl border p-3 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'}`}>
    <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="w-full min-h-11 flex items-center justify-between gap-2 text-sm font-bold">
      <span>{REGION_LABELS[region]} · Components</span><span>{parts.length} {expanded ? '−' : '+'}</span>
    </button>
    {expanded && <div className="space-y-3 pt-2">
      <p className="text-xs text-slate-500">Choose a system, then tap a named structure to isolate it and open its details.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label="Regional anatomy systems">
        <button type="button" aria-pressed={!system} onClick={() => setSystem(null)} className="min-h-11 rounded-xl border p-2 text-xs font-semibold">All structures ({parts.length})</button>
        {groups.map(s => <button key={s.id} type="button" aria-pressed={system === s.id} onClick={() => setSystem(s.id)} className={`min-h-11 rounded-xl border p-2 text-xs font-semibold ${system === s.id ? 'bg-sky-600 text-white' : ''}`}>{s.name} ({s.count})</button>)}
      </div>
      <input aria-label="Search structures in selected region" placeholder="Search this region…" value={query} onChange={e => setQuery(e.target.value)} className="w-full min-h-11 rounded-xl border px-3 text-sm bg-transparent" />
      <div className="max-h-[32dvh] overflow-y-auto grid grid-cols-2 gap-2" aria-label="Regional structures">
        {matches.slice(0, 80).map(p => <button key={p.id} type="button" onClick={() => onSelect(p.id)} className="min-h-11 rounded-xl border p-2 text-left text-xs leading-relaxed break-words">{p.name}</button>)}
      </div>
      {!matches.length && <p role="status" className="text-sm">No matching structures in this region. Choose another system or clear the search.</p>}
      {matches.length > 80 && <p className="text-xs text-slate-500">Showing 80 of {matches.length}. Search or choose a system to narrow the list.</p>}
    </div>}
  </section>;
});
