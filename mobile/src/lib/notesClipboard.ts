import type { Section } from './handwrittenNotes';

const value = (item: unknown, ...keys: string[]): string => {
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  if (!item || typeof item !== 'object') return '';
  for (const key of keys) {
    const entry = (item as Record<string, unknown>)[key];
    if (typeof entry === 'string' || typeof entry === 'number') return String(entry);
  }
  return '';
};
const list = (item: unknown): unknown[] => Array.isArray(item) ? item : [];

/** The text behind a section's copy button, in the same reading order as its card. */
export function sectionClipboardText(section: Section): string {
  const p = section.payload ?? (section as unknown as Record<string, unknown>);
  const lines: string[] = [section.title];
  switch (section.type) {
    case 'definition': case 'outcome':
      lines.push(value(p, 'text'));
      break;
    case 'text':
      lines.push(value(p, 'paragraph'));
      break;
    case 'diagram':
      lines.push(value(p, 'caption', 'description'), value(p, 'imageUrl', 'url'));
      break;
    case 'bullets':
    case 'steps':
    case 'revision':
      list(p.items).forEach((item, i) => {
        const parts = typeof item === 'string' ? [item] : [
          value(item, 'label', 'title', 'text'),
          value(item, 'description', 'detail'),
          value(item, 'keyTrigger'),
        ];
        lines.push(`${section.type === 'bullets' ? '•' : `${i + 1}.`} ${parts.filter(Boolean).join(' — ')}`);
      });
      break;
    case 'morphology':
      lines.push(value(p, 'subtitle'));
      list(p.items).forEach(item => {
        const record = item as Record<string, unknown>;
        lines.push(value(item, 'title', 'label'), ...list(record?.details).map(part => value(part, 'text', 'detail', 'description')));
      });
      break;
    case 'comparison':
      lines.push([value(p, 'left'), value(p, 'right')].filter(Boolean).join(' | '));
      list(p.rows).forEach(row => lines.push([
        value(row, 'label'), value(row, 'left'), value(row, 'right'),
      ].filter(Boolean).join(' | ')));
      break;
    case 'table':
      lines.push(list(p.columns).map(column => value(column, 'label', 'title')).join(' | '));
      list(p.rows).forEach(row => lines.push(
        Array.isArray(row) ? row.map(cell => value(cell, 'text', 'label')).join(' | ') : value(row, 'text', 'label'),
      ));
      break;
    case 'flowchart':
      list(p.steps).forEach((step, i) => lines.push(
        `${i + 1}. ${[value(step, 'label', 'title'), value(step, 'detail', 'description')].filter(Boolean).join(' — ')}`,
      ));
      break;
    default:
      lines.push(value(p, 'text', 'paragraph'));
  }
  return lines.filter(Boolean).join('\n').replace(/\*\*|==[ygbp]?:?/g, '');
}
