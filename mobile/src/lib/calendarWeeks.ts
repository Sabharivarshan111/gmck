/** Monday-first rows. Empty slots preserve alignment for partial weeks. */
export function calendarWeeks<T extends { dayOfWeek: number }>(days: readonly T[]): (T | null)[][] {
  if (!days.length) return [];
  const cells: (T | null)[] = Array((days[0].dayOfWeek + 6) % 7).fill(null);
  cells.push(...days);
  while (cells.length % 7) cells.push(null);
  const weeks: (T | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
