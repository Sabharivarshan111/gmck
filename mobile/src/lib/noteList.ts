/** Continue a typed list when Enter inserts a single newline. Empty items end the list. */
export function continueListOnEnter(previous: string, next: string): { text: string; cursor: number } | null {
  let start = 0;
  while (start < previous.length && previous[start] === next[start]) start++;
  let oldEnd = previous.length;
  let newEnd = next.length;
  while (oldEnd > start && newEnd > start && previous[oldEnd - 1] === next[newEnd - 1]) {
    oldEnd--;
    newEnd--;
  }
  if (oldEnd !== start || next.slice(start, newEnd) !== '\n') return null;
  const lineStart = previous.lastIndexOf('\n', start - 1) + 1;
  const beforeCaret = previous.slice(lineStart, start);
  const numbered = beforeCaret.match(/^(\s*)(\d{1,3})([.)\]:])\s+/);
  const bullet = beforeCaret.match(/^(\s*)([-*•+–—])\s+/);
  const marker = numbered ?? bullet;
  if (!marker) return null;
  const typed = beforeCaret.slice(marker[0].length);
  if (!typed.trim()) {
    return {
      text: next.slice(0, lineStart) + next.slice(lineStart + marker[0].length),
      cursor: start + 1 - marker[0].length,
    };
  }
  const prefix = numbered
    ? `${numbered[1]}${Number(numbered[2]) + 1}${numbered[3]} `
    : `${bullet![1]}${bullet![2]} `;
  return { text: next.slice(0, newEnd) + prefix + next.slice(newEnd), cursor: newEnd + prefix.length };
}
