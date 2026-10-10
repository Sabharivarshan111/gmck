/** Bounded supersampling improves overview sharpness without unbounded phone DPR. */
export function anatomyPixelRatio(dpr: number, mobile: boolean, quality: 'smooth' | 'crisp', width: number, height: number, memoryGb?: number): number {
  const cap = mobile ? quality === 'smooth' ? 1 : memoryGb !== undefined && memoryGb <= 4 ? 1.25 : 1.5 : 1.75;
  const pixelBudget = Math.sqrt(3_000_000 / Math.max(1, width * height));
  return Math.min(Math.max(0.75, Math.min(dpr || 1, cap)), pixelBudget);
}
