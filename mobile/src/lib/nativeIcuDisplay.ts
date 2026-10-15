/** Analytical display port of canonical IcuMonitor.tsx. Patient ticking stays separate.
 * Canvas coordinates, 150 px/s sweep, 20 px erase band and 4.8s prefill match Vercel.
 * Source file stays frozen; the parity test compares every returned coordinate.
 */
import type { PatientVitals } from '@simulator/types';
export const ICU_WIDTH = 720;
export const ICU_HEIGHT = 360;
const channelH = ICU_HEIGHT / 4;
const c1Y = channelH * 0.55;
const c2Y = channelH * 1.60;
const c3Y = channelH * 2.65;
const c4Y = channelH * 3.70;
export function calculateIcuPoint(t: number, vitals: PatientVitals, ecgRhythm: string) {
  const hr = Math.max(35, vitals.heartRate);
  const cardiacPeriod = 60 / hr;
  const theta = ((t / cardiacPeriod) * 2 * Math.PI) % (2 * Math.PI);

  const rr = Math.max(8, vitals.respiratoryRate);
  const respPeriod = 60 / rr;
  const phi = ((t / respPeriod) * 2 * Math.PI) % (2 * Math.PI);

  // 1. ECG Lead II
  let ecg = 0;
  if (ecgRhythm === 'vfib') {
    ecg = 0.4 * Math.sin(theta * 3.5) + 0.3 * Math.sin(theta * 7.2) + 0.15 * Math.sin(theta * 11.1);
  } else if (ecgRhythm.includes('stemi')) {
    const p = 0.16 * Math.exp(-Math.pow((theta - 0.45) / 0.08, 2));
    const q = -0.16 * Math.exp(-Math.pow((theta - 1.05) / 0.04, 2));
    const r = 1.25 * Math.exp(-Math.pow((theta - 1.12) / 0.03, 2));
    const s = -0.25 * Math.exp(-Math.pow((theta - 1.18) / 0.04, 2));
    const st = theta >= 1.22 && theta < 2.4 ? 0.52 * Math.exp(-Math.pow((theta - 1.7) / 0.4, 2)) : 0;
    ecg = p + q + r + s + st;
  } else {
    const p = 0.18 * Math.exp(-Math.pow((theta - 0.5) / 0.09, 2));
    const q = -0.16 * Math.exp(-Math.pow((theta - 1.14) / 0.035, 2));
    const r = 1.45 * Math.exp(-Math.pow((theta - 1.22) / 0.032, 2));
    const s = -0.36 * Math.exp(-Math.pow((theta - 1.30) / 0.04, 2));
    const tw = 0.32 * Math.exp(-Math.pow((theta - 1.95) / 0.22, 2));
    ecg = p + q + r + s + tw;
  }

  // 2. Arterial line with authentic Pulse Transit Time (PTT = ~170ms post-QRS)
  const pSys = vitals.bpSystolic;
  const pDia = vitals.bpDiastolic;
  let art = pDia;
  // Normal radial pulse upstroke begins ~1.05 rad after R-wave peak (theta = 1.22 -> 2.27)
  if (theta >= 2.27 && theta < 3.25) {
    // Systolic upstroke and ejection peak
    const prog = (theta - 2.27) / 0.98;
    art = pDia + (pSys - pDia) * Math.sin(prog * Math.PI);
  } else if (theta >= 3.25 && theta < 3.75) {
    // Dicrotic notch (incisura) and secondary diastolic rebound
    const notchProg = (theta - 3.25) / 0.50;
    art = pDia + (pSys - pDia) * 0.38 + 6 * Math.sin(notchProg * 2 * Math.PI);
  } else {
    // Diastolic runoff exponential decay
    const prog = theta < 2.27 ? theta + (2 * Math.PI - 3.75) : theta - 3.75;
    art = pDia + (pSys - pDia) * 0.32 * Math.exp(-prog * 0.85);
  }

  // 3. Plethysmogram (Finger Photoplethysmography lag ~220ms post-R)
  const ppgTheta = (theta - 2.62 + 2 * Math.PI) % (2 * Math.PI);
  let pleth = 0;
  if (ppgTheta < 1.6) {
    pleth = Math.sin((ppgTheta / 1.6) * Math.PI);
  } else {
    pleth = 0.25 * Math.exp(-(ppgTheta - 1.6) * 1.5);
  }

  // 4. Capnography
  let capno = 0;
  if (phi > Math.PI && phi < 2 * Math.PI) {
    capno = vitals.etco2 * (1 - Math.exp(-(phi - Math.PI) * 5));
  }

  return {
    ecgY: c1Y - ecg * 42,
    artY: c2Y - (art - 35) * 0.75,
    plethY: c3Y - pleth * 38,
    capnoY: c4Y - (capno / 50) * 42,
    rawEcg: ecg,
  };
}
export type IcuPoint = ReturnType<typeof calculateIcuPoint>;
export type IcuSweep = { x: number; time: number; points: (IcuPoint | null)[] };
export function createIcuSweep(vitals: PatientVitals, rhythm: string): IcuSweep {
  return { x: 0, time: 0, points: Array.from({ length: ICU_WIDTH }, (_, x) => calculateIcuPoint(x / 150, vitals, rhythm)) };
}
export function advanceIcuSweep(sweep: IcuSweep, dt: number, vitals: PatientVitals, rhythm: string) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  const curX = sweep.x;
  const nextX = (curX + 150 * dt) % ICU_WIDTH;
  sweep.time += dt;
  // As with canvas.fillRect, only pixels within the screen are erased.
  for (let x = Math.floor(nextX); x < Math.min(ICU_WIDTH, Math.ceil(nextX + 20)); x++) sweep.points[x] = null;
  const draw = (start: number, end: number) => {
    for (let x = start; x <= end && x < ICU_WIDTH; x++) {
      sweep.points[x] = calculateIcuPoint(sweep.time + (x / ICU_WIDTH) * 0.1, vitals, rhythm);
    }
  };
  draw(Math.floor(curX), nextX > curX ? Math.floor(nextX) : ICU_WIDTH - 1);
  if (nextX < curX) draw(0, Math.floor(nextX));
  sweep.x = nextX;
}
export function icuChannelPath(sweep: IcuSweep, key: 'ecgY' | 'artY' | 'plethY' | 'capnoY') {
  let connected = false;
  return sweep.points.map((point, x) => {
    if (!point) { connected = false; return ''; }
    const command = connected ? 'L' : 'M';
    connected = true;
    return `${command}${x} ${point[key].toFixed(3)}`;
  }).join(' ');
}
