import type { NotesContent, Section } from './handwrittenNotes';

const textKey = (s: string) => s.replace(/\s+/g, ' ').trim();
function key(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(textKey(value));
  if (Array.isArray(value)) return `[${value.map(key).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${key(v)}`).join(',')}}`;
  return JSON.stringify(value) ?? '';
}
function unique(values: unknown[]): unknown[] {
  const seen = new Set<string>();
  return values.filter(value => { const k = key(value); if (seen.has(k)) return false; seen.add(k); return true; });
}
function mergeValue(a: unknown, b: unknown): unknown {
  if (key(a) === key(b)) return a;
  if (Array.isArray(a) && Array.isArray(b)) return unique([...a, ...b]);
  if (typeof a === 'string' && typeof b === 'string') {
    return unique([...a.split('\n\n'), ...b.split('\n\n')]).join('\n\n');
  }
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const result = { ...a } as Record<string, unknown>;
    for (const [k, v] of Object.entries(b)) result[k] = k in result ? mergeValue(result[k], v) : v;
    return result;
  }
  return a ?? b;
}
function payload(section: Section): Record<string, unknown> {
  const p = { ...section.payload };
  for (const [k, value] of Object.entries(p)) if (Array.isArray(value) && k !== 'columns' && !['steps', 'flowchart'].includes(section.type)) p[k] = unique(value);
  // Repeated headings inside one disease's bullets become one heading, with
  // all distinct descriptions retained. Ordered algorithms are untouched.
  if (section.type === 'bullets' && Array.isArray(p.items)) {
    const items: unknown[] = [];
    const labels = new Map<string, number>();
    for (const item of p.items) {
      const obj = item && typeof item === 'object' ? item as Record<string, unknown> : null;
      const label = obj?.label ?? obj?.title;
      const labelKey = typeof label === 'string' ? textKey(label).toLowerCase() : '';
      const index = labels.get(labelKey);
      if (labelKey && index !== undefined) {
        const previous = items[index] as Record<string, unknown>;
        const merged = mergeValue(previous, item) as Record<string, unknown>;
        // A heading's capitalization is presentation, not another fact.
        if ('label' in previous) merged.label = previous.label;
        if ('title' in previous) merged.title = previous.title;
        items[index] = merged;
      }
      else { if (labelKey) labels.set(labelKey, items.length); items.push(item); }
    }
    p.items = items;
  }
  return p;
}
/** Pure and idempotent: cached notes and fresh batches get the same cleanup. */
export function deduplicateNotes(content: NotesContent): NotesContent {
  const sections: Section[] = [];
  const byTitle = new Map<string, number>();
  const exactSections = new Set<string>();
  for (const section of content.sections ?? []) {
    const clean = { ...section, payload: payload(section) };
    const exact = key(clean);
    if (exactSections.has(exact)) continue;
    exactSections.add(exact);
    const title = textKey(section.title ?? '').toLowerCase();
    const sectionKey = `${section.type}:${title}`;
    // Tables/comparisons with different schemas must keep their own headings
    // so a merged row cannot acquire the wrong clinical column meaning.
    const mergeable = !['diagram', 'steps', 'flowchart', 'table', 'comparison'].includes(section.type);
    const index = title && mergeable ? byTitle.get(sectionKey) : undefined;
    if (index === undefined) { if (title && mergeable) byTitle.set(sectionKey, sections.length); sections.push(clean); }
    else {
      const prev = sections[index];
      sections[index] = { ...prev, pyqYears: [...new Set([...(prev.pyqYears ?? []), ...(clean.pyqYears ?? [])])], payload: payload({ ...prev, payload: mergeValue(prev.payload, clean.payload) as Record<string, unknown> }) };
    }
  }
  return { ...content, sections };
}
