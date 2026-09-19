/** Keep each original checklist point, separating its action from parenthetical teaching. */
export function guidePoints(text: string): { prompt: string; explanation: string }[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++;
    if (text[i] === ')') depth = Math.max(0, depth - 1);
    if (text[i] === ';' && depth === 0) { parts.push(text.slice(start, i).trim()); start = i + 1; }
  }
  parts.push(text.slice(start).trim());
  return parts.filter(Boolean).map(part => {
    const split = part.indexOf('(');
    if (split > 0) return { prompt: part.slice(0, split).trim(), explanation: part.slice(split) };
    return { prompt: part, explanation: '' };
  });
}
