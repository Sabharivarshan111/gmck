/**
 * Native offline ECG: waveform synthesis mirrors the Vercel
 * src/simulator/instruments/Ecg12LeadCanvas.tsx formula.
 * All distances are nominal SVG pixels at 4px/mm, 25mm/s, 10mm/mV.
 */
import { NATIVE_ECG_LEADS, type NativeEcgLead } from './nativeEcgReference';

export interface NativeEcgConfig { rhythm: string; heartRate: number }
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function ecgDeflection(px: number, lead: NativeEcgLead, config: NativeEcgConfig): number {
  const rrPixels = 100 * (60 / clamp(config.heartRate, 35, 180));
  const phase = (px % rrPixels) / rrPixels;
  const rhythm = config.rhythm.toLowerCase();
  const isVFib = rhythm.includes('vfib');
  if (isVFib) return Math.sin(px * 0.15) * 16 + Math.sin(px * 0.28 + 1.2) * 10 + Math.cos(px * 0.08) * 8;
  const isStemi = rhythm.includes('stemi');
  const isAfib = rhythm.includes('afib');
  const isHyperK = rhythm.includes('hyperkalemia') || rhythm.includes('uremia') || rhythm.includes('aki');
  const isTamponade = rhythm.includes('tamponade');
  let ampScale = isTamponade ? 0.38 : 1;
  if (isTamponade) ampScale *= Math.floor(px / rrPixels) % 2 === 0 ? 1.3 : 0.7;
  let deflection = 0;
  if (!isAfib && !isHyperK && phase > 0.12 && phase < 0.24) {
    const pPhase = (phase - 0.18) / 0.06;
    deflection -= 4.5 * Math.exp(-pPhase * pPhase * 4) * lead.inv * ampScale;
  } else if (isAfib) {
    deflection += Math.sin(px * 0.6) * 1.8;
  }
  if (phase > 0.34 && phase < 0.37 && lead.q > 0) deflection += lead.q * lead.inv * ampScale;
  if (phase >= 0.37 && phase <= 0.43) {
    const rPhase = (phase - 0.4) / 0.03;
    deflection -= (isHyperK ? lead.r * 1.3 : lead.r) * Math.exp(-rPhase * rPhase * 6) * lead.inv * ampScale;
  }
  if (phase > 0.43 && phase < 0.48) {
    const sPhase = (phase - 0.45) / 0.03;
    deflection += (isHyperK ? lead.s * 1.4 : lead.s) * Math.exp(-sPhase * sPhase * 6) * lead.inv * ampScale;
  }
  if (isStemi && ['II', 'III', 'aVF'].includes(lead.id) && phase > 0.46 && phase < 0.78) {
    const stPhase = (phase - 0.6) / 0.16;
    deflection -= 18 * Math.exp(-stPhase * stPhase * 2.5);
  } else if (isStemi && ['I', 'aVL'].includes(lead.id) && phase > 0.46 && phase < 0.7) {
    const stPhase = (phase - 0.58) / 0.12;
    deflection += 8 * Math.exp(-stPhase * stPhase * 3);
  } else if (isHyperK && phase > 0.52 && phase < 0.72) {
    const tPhase = (phase - 0.62) / 0.08;
    deflection -= 26 * Math.exp(-tPhase * tPhase * 7) * lead.inv * ampScale;
  } else if (!isStemi && !isHyperK && phase > 0.54 && phase < 0.76) {
    const tPhase = (phase - 0.65) / 0.11;
    deflection -= lead.t * Math.exp(-tPhase * tPhase * 4) * lead.inv * ampScale;
  } else if (isStemi && !['II','III','aVF','I','aVL'].includes(lead.id) && phase > 0.54 && phase < 0.76) {
    const tPhase = (phase - 0.65) / 0.11;
    deflection -= lead.t * Math.exp(-tPhase * tPhase * 4) * lead.inv * ampScale;
  }
  return deflection;
}

export function nativeEcgTracePath(
  lead: NativeEcgLead, cfg: NativeEcgConfig,
  xStart: number, yCenter: number, cellWidth: number,
): string {
  const traceStart = xStart + 26;
  const n = Math.max(1, Math.round(cellWidth - 24));
  const parts = [`M ${traceStart} ${yCenter}`];
  for (let px=0; px<n; px++) {
    const def = ecgDeflection(px, lead, cfg);
    // VFib returns positive displacement below the baseline, as in Vercel.
    parts.push(`L ${(traceStart + px).toFixed(1)} ${(yCenter + def).toFixed(1)}`);
  }
  return parts.join(' ');
}
export const leadById = (id: string) => NATIVE_ECG_LEADS.find(l => l.id === id) ?? NATIVE_ECG_LEADS[1];
