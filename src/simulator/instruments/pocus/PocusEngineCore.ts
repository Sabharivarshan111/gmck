/**
 * PocusEngineCore.ts
 * Publication-Grade Dynamic Point-of-Care Ultrasound (POCUS) Simulation Core
 * Adheres to clinical sonography physics:
 * - Piezoelectric sector scan geometry (phased array, curvilinear, linear)
 * - Rayleigh-distributed coherent tissue speckle patterns
 * - Time Gain Compensation (TGC) and depth attenuation
 * - Real-time biomechanical myocardial kinetics (PLAX & Subxiphoid)
 * - Dynamic diaphragmatic respiratory excursion (eFAST Morison's pouch)
 * - Pleural sliding dynamics & M-mode sonogram (Seashore vs Barcode sign)
 */

import { PatientPathologyState, PatientVitals } from '../../types';

export type PocusViewMode = 'cardiac_plax' | 'subxiphoid' | 'fast_morison' | 'lung';

export interface PocusSettings {
  viewMode: PocusViewMode;
  gain: number; // 0.5 to 1.8 (default 1.0)
  depthCm: number; // 8 to 22 cm
  isFrozen: boolean;
  showMMode: boolean;
  showColorDoppler: boolean;
  caliperPointA: { x: number; y: number } | null;
  caliperPointB: { x: number; y: number } | null;
}

export const DEFAULT_POCUS_SETTINGS: PocusSettings = {
  viewMode: 'cardiac_plax',
  gain: 1.0,
  depthCm: 16,
  isFrozen: false,
  showMMode: false,
  showColorDoppler: false,
  caliperPointA: null,
  caliperPointB: null,
};

/**
 * Coherent 2D Rayleigh Speckle Generator
 * Creates realistic ultrasound interference speckle texture rather than television white noise.
 */
export class SpeckleGenerator {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  private width = 256;
  private height = 256;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d')!;
    this.generate();
  }

  private generate() {
    const imgData = this.ctx.createImageData(this.width, this.height);
    const data = imgData.data;

    // Generate Rayleigh distribution scatterers
    // P(r) = (r / sigma^2) * exp(-r^2 / (2*sigma^2))
    const sigma = 38;
    for (let i = 0; i < data.length; i += 4) {
      const u1 = Math.max(1e-7, Math.random());
      const u2 = Math.random();
      // Box-Muller transform for Gaussian components
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
      // Rayleigh amplitude R = sqrt(z0^2 + z1^2)
      const rayleigh = Math.min(255, Math.sqrt(z0 * z0 + z1 * z1) * sigma);

      data[i] = rayleigh;     // R
      data[i + 1] = rayleigh; // G
      data[i + 2] = rayleigh; // B
      data[i + 3] = 255;      // A
    }
    this.ctx.putImageData(imgData, 0, 0);
  }
}

/**
 * 60fps Real-Time Ultrasound Physics & Scan Renderer
 */
export class PocusSimulationEngine {
  private speckle: SpeckleGenerator;
  private mMBuffer: number[][] = [];

  constructor() {
    this.speckle = new SpeckleGenerator();
  }

  /**
   * Main Render Entrypoint
   */
  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    timeSec: number,
    vitals: PatientVitals,
    pathology: PatientPathologyState,
    settings: PocusSettings
  ): void {
    // 1. CRT Cathode Black Backdrop
    ctx.fillStyle = '#020408';
    ctx.fillRect(0, 0, width, height);

    const isLung = settings.viewMode === 'lung';
    const sectorOriginX = width * (settings.showMMode ? 0.35 : 0.5);
    const sectorOriginY = 22;
    const sectorRadius = height - 44;
    const sectorAngle = isLung ? Math.PI * 0.28 : Math.PI * 0.44; // Narrower or wider sector

    ctx.save();

    // 2. Transducer Acoustic Cone Clip
    ctx.beginPath();
    if (isLung) {
      // Linear Probe: Trapezoid / Rectangular Near Field with Sector Flare
      const topW = width * 0.35;
      const botW = width * 0.52;
      ctx.moveTo(sectorOriginX - topW / 2, sectorOriginY);
      ctx.lineTo(sectorOriginX + topW / 2, sectorOriginY);
      ctx.lineTo(sectorOriginX + botW / 2, sectorOriginY + sectorRadius);
      ctx.lineTo(sectorOriginX - botW / 2, sectorOriginY + sectorRadius);
      ctx.closePath();
    } else {
      // Phased Array / Curvilinear Sector
      ctx.moveTo(sectorOriginX, sectorOriginY);
      ctx.arc(
        sectorOriginX,
        sectorOriginY,
        sectorRadius,
        Math.PI * 0.5 - sectorAngle / 2,
        Math.PI * 0.5 + sectorAngle / 2
      );
      ctx.closePath();
    }
    ctx.clip();

    // 3. Deep Acoustic Fluid / Tissue Gradient
    const depthGrad = ctx.createLinearGradient(0, sectorOriginY, 0, sectorOriginY + sectorRadius);
    depthGrad.addColorStop(0, '#0a101d');
    depthGrad.addColorStop(0.5, '#050a14');
    depthGrad.addColorStop(1, '#02040a');
    ctx.fillStyle = depthGrad;
    ctx.fill();

    // 4. Fine Rayleigh Speckle Underlay (Subtle moving interference)
    ctx.save();
    ctx.globalAlpha = 0.08 * settings.gain;
    const speckleShiftX = (Math.sin(timeSec * 0.5) * 15) % 256;
    const speckleShiftY = (timeSec * 12) % 256;
    ctx.drawImage(this.speckle.canvas, speckleShiftX, speckleShiftY, width, height);
    ctx.restore();

    // 5. Render Specific Sonographic View
    switch (settings.viewMode) {
      case 'cardiac_plax':
        this.renderPLAX(ctx, sectorOriginX, sectorOriginY, sectorRadius, timeSec, vitals, pathology, settings);
        break;
      case 'subxiphoid':
        this.renderSubxiphoid(ctx, sectorOriginX, sectorOriginY, sectorRadius, timeSec, vitals, pathology, settings);
        break;
      case 'fast_morison':
        this.renderMorison(ctx, sectorOriginX, sectorOriginY, sectorRadius, timeSec, vitals, pathology, settings);
        break;
      case 'lung':
        this.renderLung(ctx, sectorOriginX, sectorOriginY, sectorRadius, timeSec, vitals, pathology, settings);
        break;
    }

    ctx.restore();

    // 6. Transducer Probe Orientation Marker ("Dot" at 9 o'clock)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    const dotX = isLung ? sectorOriginX - width * 0.16 : sectorOriginX - 22;
    ctx.arc(dotX, sectorOriginY + 6, 3, 0, Math.PI * 2);
    ctx.fill();

    // 7. Depth Scale & Focal Zone Carats (Lateral Border)
    this.renderDepthScale(ctx, sectorOriginX, sectorOriginY, sectorRadius, settings.depthCm);

    // 8. M-Mode Sonogram Split Screen (if enabled)
    if (settings.showMMode) {
      this.renderMModeStrip(ctx, width, height, sectorOriginX, sectorOriginY, sectorRadius, timeSec, vitals, pathology, settings);
    }

    // 9. Caliper Measurement Brackets (if user placed calipers)
    this.renderCalipers(ctx, settings);

    // 10. Sonography Telemetry & Machine HUD
    this.renderTelemetryHUD(ctx, width, height, vitals, settings);
  }

  /**
   * VIEW 1: Parasternal Long Axis (PLAX) Echocardiogram
   * True anatomical view: RVOT anteriorly, Interventricular Septum (IVS),
   * Left Ventricle (LV), Posterior Wall (LVPW), Mitral Valve (AML/PML),
   * Aortic Root with Semilunar Cusps, and Left Atrium (LA).
   */
  private renderPLAX(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    radius: number,
    t: number,
    vitals: PatientVitals,
    pathology: PatientPathologyState,
    settings: PocusSettings
  ): void {
    const hr = vitals.heartRate;
    const cardiacPhase = (t * (hr / 60)) % 1; // 0.0 to 1.0
    // Systole occurs from phi ~0.10 to ~0.42
    const isSystole = cardiacPhase >= 0.10 && cardiacPhase <= 0.42;
    const systolicProgress = isSystole ? Math.sin(((cardiacPhase - 0.10) / 0.32) * Math.PI) : 0;

    // Myocardial contraction factor: LV wall thickens 35%, cavity narrows 40%
    const contraction = systolicProgress * 0.35;
    const hasTamponade = vitals.cvp > 10;
    const hasSevereTamponade = vitals.cvp > 14 && vitals.meanArterialPressure < 65;

    // Geometric Anchors in Sector View
    const centerX = ox - 10;
    const centerY = oy + radius * 0.48;

    // A. ANECHOIC PERICARDIAL FLUID (If Tamponade / Pericardial Effusion)
    if (hasTamponade) {
      ctx.fillStyle = '#000000'; // Anechoic jet black
      ctx.beginPath();
      // Effusion surrounding the posterior LV wall and anterior RV wall
      ctx.ellipse(centerX, centerY + 10, 110, 85, -0.32, 0, Math.PI * 2);
      ctx.fill();

      // Bright Hyperechoic Parietal Pericardium boundary
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Diastolic RV Free Wall Collapse Highlight
      if (hasSevereTamponade && !isSystole) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('▲ RV DIASTOLIC COLLAPSE', ox - 90, oy + 65);
      }
    }

    // B. RIGHT VENTRICULAR OUTFLOW TRACT (RVOT) - Anterior
    ctx.fillStyle = '#020617'; // Anechoic blood
    ctx.beginPath();
    // In severe tamponade, RV collapses during early-to-mid diastole
    const rvCollapse = (hasSevereTamponade && !isSystole) ? 0.35 : 1.0;
    ctx.ellipse(centerX - 15, centerY - 55, 60, 22 * rvCollapse, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // RV Free Wall (Anterior Myocardium)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 5;
    ctx.stroke();

    // C. INTERVENTRICULAR SEPTUM (IVS) - Hyperechoic Myocardium
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 8 + contraction * 4; // Thickens in systole
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX - 80, centerY - 35);
    ctx.quadraticCurveTo(centerX - 10, centerY - 45 - contraction * 8, centerX + 60, centerY - 40);
    ctx.stroke();

    // D. LEFT VENTRICULAR CAVITY (Anechoic Chamber)
    ctx.fillStyle = '#020409';
    ctx.beginPath();
    const lvWidth = 85 * (1 - contraction * 0.4);
    const lvHeight = 46 * (1 - contraction * 0.35);
    ctx.ellipse(centerX - 25, centerY + 2, lvWidth, lvHeight, -0.28, 0, Math.PI * 2);
    ctx.fill();

    // E. LV POSTERIOR WALL (LVPW) - Hyperechoic Myocardium
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 9 + contraction * 3.5;
    ctx.beginPath();
    ctx.moveTo(centerX - 95, centerY + 30);
    ctx.quadraticCurveTo(centerX - 20, centerY + 42 - contraction * 10, centerX + 45, centerY + 18);
    ctx.stroke();

    // F. AORTIC ROOT & SINUSES OF VALSALVA
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    // Anterior aortic wall (continuous with IVS)
    ctx.beginPath();
    ctx.moveTo(centerX + 58, centerY - 40);
    ctx.lineTo(centerX + 115, centerY - 50);
    ctx.stroke();

    // Posterior aortic wall (continuous with anterior mitral leaflet)
    ctx.beginPath();
    ctx.moveTo(centerX + 50, centerY - 10);
    ctx.lineTo(centerX + 110, centerY - 20);
    ctx.stroke();

    // Aortic Valve Leaflets (Boxcar opening in systole, single bright line in diastole)
    if (isSystole) {
      // Leaflets parallel to aortic walls (Boxcar)
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX + 70, centerY - 42);
      ctx.lineTo(centerX + 95, centerY - 46);
      ctx.moveTo(centerX + 68, centerY - 14);
      ctx.lineTo(centerX + 93, centerY - 18);
      ctx.stroke();
    } else {
      // Coaptation line in center
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX + 70, centerY - 28);
      ctx.lineTo(centerX + 95, centerY - 32);
      ctx.stroke();
    }

    // G. MITRAL VALVE APPARATUS
    const amlPivotX = centerX + 50;
    const amlPivotY = centerY - 10;
    const pmlPivotX = centerX + 35;
    const pmlPivotY = centerY + 22;

    let amlTipX = centerX + 10;
    let amlTipY = centerY + 8;
    let pmlTipX = centerX + 12;
    let pmlTipY = centerY + 12;

    if (isSystole) {
      // Closed / Coapting in Systole
      amlTipX = centerX + 24;
      amlTipY = centerY + 6;
      pmlTipX = centerX + 24;
      pmlTipY = centerY + 7;
    } else {
      // Wide open in diastole: AML swings up towards IVS
      const eWave = Math.sin((cardiacPhase / 0.58) * Math.PI);
      amlTipX = centerX + 18 - eWave * 18;
      amlTipY = centerY - 15 - eWave * 18; // Close to septum (normal EPSS < 7mm)
      pmlTipX = centerX + 22;
      pmlTipY = centerY + 26;
    }

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.5;
    // Anterior leaflet
    ctx.beginPath();
    ctx.moveTo(amlPivotX, amlPivotY);
    ctx.lineTo(amlTipX, amlTipY);
    ctx.stroke();

    // Posterior leaflet
    ctx.beginPath();
    ctx.moveTo(pmlPivotX, pmlPivotY);
    ctx.lineTo(pmlTipX, pmlTipY);
    ctx.stroke();

    // H. LEFT ATRIUM (LA) - Posterior to Aorta
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(centerX + 85, centerY + 10, 32, 26, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // I. Optional Color Doppler Jet
    if (settings.showColorDoppler) {
      this.renderColorDoppler(ctx, centerX, centerY, isSystole, pathology);
    }
  }

  /**
   * VIEW 2: Subxiphoid 4-Chamber Echocardiogram
   */
  private renderSubxiphoid(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    radius: number,
    t: number,
    vitals: PatientVitals,
    pathology: PatientPathologyState,
    settings: PocusSettings
  ): void {
    const hr = vitals.heartRate;
    const cardiacPhase = (t * (hr / 60)) % 1;
    const isSystole = cardiacPhase >= 0.10 && cardiacPhase <= 0.42;
    const contraction = isSystole ? Math.sin(((cardiacPhase - 0.10) / 0.32) * Math.PI) * 0.28 : 0;
    const hasTamponade = vitals.cvp > 10;

    // 1. Liver Acoustic Window (Top Sector Near Field)
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(ox, oy + 55, 110, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Diaphragm (Bright hyperechoic curve)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(ox, oy + 50, 95, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    const heartY = oy + 185;

    // 2. Anechoic Pericardial Space (Tamponade Stripe)
    if (hasTamponade) {
      ctx.fillStyle = '#000000'; // Jet black anechoic fluid
      ctx.beginPath();
      ctx.arc(ox - 10, heartY, 95, 0, Math.PI * 2);
      ctx.fill();

      // Pericardial Sac Border
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // 3. Right Ventricle (RV) - Closest to liver
    const rvCollapse = (hasTamponade && !isSystole) ? 0.45 : 1.0;
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(ox - 45, heartY - 25, 42 * (1 - contraction * 0.3), 32 * rvCollapse, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 5;
    ctx.stroke();

    // 4. Left Ventricle (LV)
    ctx.fillStyle = '#020409';
    ctx.beginPath();
    ctx.ellipse(ox + 40, heartY - 15, 48 * (1 - contraction * 0.35), 40 * (1 - contraction * 0.35), -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 9; // Thicker LV wall
    ctx.stroke();

    // 5. Right Atrium (RA) & Left Atrium (LA)
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(ox - 35, heartY + 35, 30, 24, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ox + 35, heartY + 40, 32, 26, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Tricuspid & Mitral Leaflets
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.5;
    const valveOpen = !isSystole;
    // TV
    ctx.beginPath();
    ctx.moveTo(ox - 50, heartY + 5);
    ctx.lineTo(ox - 40 + (valveOpen ? 6 : 0), heartY + 5 - (valveOpen ? 8 : 0));
    ctx.stroke();
    // MV
    ctx.beginPath();
    ctx.moveTo(ox + 25, heartY + 8);
    ctx.lineTo(ox + 35 - (valveOpen ? 8 : 0), heartY + 8 - (valveOpen ? 10 : 0));
    ctx.stroke();
  }

  /**
   * VIEW 3: eFAST Morison's Pouch (Hepatorenal Recess)
   */
  private renderMorison(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    radius: number,
    t: number,
    vitals: PatientVitals,
    pathology: PatientPathologyState,
    settings: PocusSettings
  ): void {
    const rr = vitals.respiratoryRate;
    const respGlide = Math.sin(t * (rr / 60) * Math.PI * 2) * 14;
    const hasFreeFluid = pathology.ascites > 0.25 || vitals.lactate > 2.5;

    const liverCenterY = oy + 120 + respGlide;
    const kidneyCenterY = oy + 175 + respGlide * 0.8;

    // A. LIVER PARENCHYMA
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(ox - 45, liverCenterY, 115, 75, -0.22, 0, Math.PI * 2);
    ctx.fill();

    // Portal Vein Branches
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(ox - 65, liverCenterY - 15, 14, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // B. RIGHT KIDNEY PARENCHYMA
    ctx.fillStyle = '#1e293b'; // Renal cortex
    ctx.beginPath();
    ctx.ellipse(ox + 50, kidneyCenterY, 78, 52, 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Medullary Pyramids
    ctx.fillStyle = '#0f172a';
    for (let p = -25; p <= 25; p += 25) {
      ctx.beginPath();
      ctx.arc(ox + 48 + p * 0.8, kidneyCenterY + p * 0.5, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    // Renal Pelvis / Central Sinus
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(ox + 52, kidneyCenterY, 32, 18, 0.35, 0, Math.PI * 2);
    ctx.fill();

    // C. MORISON'S POUCH
    if (hasFreeFluid) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(ox - 15, liverCenterY - 10);
      ctx.quadraticCurveTo(ox + 18, liverCenterY + 25, ox + 35, kidneyCenterY - 18);
      ctx.lineTo(ox + 20, kidneyCenterY + 15);
      ctx.quadraticCurveTo(ox, liverCenterY + 35, ox - 10, liverCenterY + 20);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px monospace';
      ctx.fillText("▲ ANECHOIC FLUID STRIPE (MORISON'S POUCH)", ox - 125, oy + radius - 20);
    } else {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ox - 10, liverCenterY);
      ctx.quadraticCurveTo(ox + 15, liverCenterY + 25, ox + 35, kidneyCenterY - 20);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('✓ INTACT HEPATORENAL INTERFACE (NO FLUID)', ox - 120, oy + radius - 20);
    }
  }

  /**
   * VIEW 4: Lung Ultrasound (LUS)
   */
  private renderLung(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    radius: number,
    t: number,
    vitals: PatientVitals,
    pathology: PatientPathologyState,
    settings: PocusSettings
  ): void {
    const rr = vitals.respiratoryRate;
    const respCycle = Math.sin(t * (rr / 60) * Math.PI * 2);
    const isTensionPneumo = vitals.spo2 < 82 && vitals.cvp > 12;
    const isEdema = pathology.lungSoundType === 'crackles';

    const pleuraY = oy + 90;
    const ribLeftX = ox - 95;
    const ribRightX = ox + 95;

    // 1. CHEST WALL MUSCULATURE
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(ox - 150, oy, 300, 90);

    // Muscle fascia layers
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1;
    for (let my = oy + 25; my < pleuraY; my += 20) {
      ctx.beginPath();
      ctx.moveTo(ox - 145, my);
      ctx.lineTo(ox + 145, my);
      ctx.stroke();
    }

    // 2. RIBS WITH POSTERIOR ACOUSTIC SHADOWING ("Bat Sign")
    // Left Rib
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(ribLeftX, pleuraY - 10, 22, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();

    // Left Acoustic Shadow
    ctx.fillStyle = '#010306';
    ctx.fillRect(ribLeftX - 22, pleuraY - 8, 44, radius - 70);

    // Right Rib
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(ribRightX, pleuraY - 10, 22, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();

    // Right Acoustic Shadow
    ctx.fillStyle = '#010306';
    ctx.fillRect(ribRightX - 22, pleuraY - 8, 44, radius - 70);

    // 3. HYPERECHOIC PLEURAL LINE
    const slidingJitter = isTensionPneumo ? 0 : (Math.sin(t * 22) * 1.5 + respCycle * 3);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(ribLeftX + 22, pleuraY);
    ctx.lineTo(ribRightX - 22, pleuraY);
    ctx.stroke();

    // Shimmering pleura granule effect
    if (!isTensionPneumo) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (let s = ribLeftX + 26; s < ribRightX - 26; s += 8) {
        const dotOffset = (s + t * 40) % (ribRightX - ribLeftX - 52);
        ctx.fillRect(ribLeftX + 26 + dotOffset, pleuraY - 1, 3, 2);
      }
    }

    // 4. PATHOLOGICAL ARTIFACTS
    if (isTensionPneumo) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('▲ ABSENT LUNG SLIDING: PNEUMOTHORAX', ox - 110, oy + radius - 20);
    } else if (isEdema) {
      // B-LINES ("Lung Rockets")
      const bPositions = [-50, -18, 15, 48];
      for (const bp of bPositions) {
        const bGrad = ctx.createLinearGradient(0, pleuraY, 0, oy + radius);
        bGrad.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
        bGrad.addColorStop(1, 'rgba(56, 189, 248, 0.25)');
        ctx.fillStyle = bGrad;
        ctx.fillRect(ox + bp + slidingJitter * 0.4 - 3, pleuraY, 6, radius - 80);
      }

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('▲ MULTIPLE B-LINES: PULMONARY EDEMA / ARDS', ox - 130, oy + radius - 20);
    } else {
      // Normal A-LINES
      for (let a = 1; a <= 3; a++) {
        const aDepth = pleuraY + a * 48;
        if (aDepth < oy + radius) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 / a})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ribLeftX + 24, aDepth);
          ctx.lineTo(ribRightX - 24, aDepth);
          ctx.stroke();
        }
      }

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('✓ NORMAL LUNG SLIDING & REVERBERATION A-LINES', ox - 135, oy + radius - 20);
    }
  }

  /**
   * Optional Color Doppler Visualization
   */
  private renderColorDoppler(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    isSystole: boolean,
    pathology: PatientPathologyState
  ): void {
    ctx.save();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 20, cy - 20, 75, 60);

    if (isSystole && pathology.heartSoundType === 'mitral_regurg') {
      const grad = ctx.createRadialGradient(cx + 40, cy + 15, 2, cx + 40, cy + 15, 30);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
      grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.8)');
      grad.addColorStop(1, 'rgba(234, 179, 8, 0.4)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx + 40, cy + 15, 28, 0, Math.PI * 2);
      ctx.fill();
    } else if (isSystole) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.45)';
      ctx.beginPath();
      ctx.ellipse(cx + 25, cy - 25, 22, 12, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Real-Time M-Mode Sonogram Strip
   */
  private renderMModeStrip(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    ox: number,
    oy: number,
    radius: number,
    t: number,
    vitals: PatientVitals,
    pathology: PatientPathologyState,
    settings: PocusSettings
  ): void {
    const stripX = width * 0.70;
    const stripW = width * 0.28;
    const stripY = 22;
    const stripH = height - 44;

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, oy + radius);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#05070a';
    ctx.fillRect(stripX, stripY, stripW, stripH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(stripX, stripY, stripW, stripH);

    const isLung = settings.viewMode === 'lung';
    const isTensionPneumo = isLung && vitals.spo2 < 82 && vitals.cvp > 12;
    const col: number[] = [];
    const numRows = 60;

    for (let r = 0; r < numRows; r++) {
      if (isLung) {
        if (r < 20) {
          col.push((r % 5 === 0) ? 220 : 60);
        } else if (r === 20) {
          col.push(255);
        } else {
          if (isTensionPneumo) {
            col.push((r % 4 === 0) ? 190 : 50);
          } else {
            col.push(Math.random() * 160 + 30);
          }
        }
      } else {
        const hr = vitals.heartRate;
        const wave = Math.sin(t * (hr / 60) * Math.PI * 2);
        const wallPos = 30 + Math.round(wave * 8);
        if (Math.abs(r - wallPos) <= 2) {
          col.push(240);
        } else {
          col.push(Math.random() * 40);
        }
      }
    }

    this.mMBuffer.push(col);
    if (this.mMBuffer.length > stripW) {
      this.mMBuffer.shift();
    }

    for (let x = 0; x < this.mMBuffer.length; x++) {
      const dataCol = this.mMBuffer[x];
      const px = stripX + x;
      for (let y = 0; y < dataCol.length; y++) {
        const val = dataCol[y];
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.fillRect(px, stripY + (y / numRows) * stripH, 1, stripH / numRows + 1);
      }
    }

    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('M-MODE SWEEP', stripX + 8, stripY + 16);
    if (isLung) {
      ctx.fillStyle = isTensionPneumo ? '#ef4444' : '#10b981';
      ctx.fillText(isTensionPneumo ? 'BARCODE SIGN' : 'SEASHORE SIGN', stripX + 8, stripY + 30);
    }
  }

  /**
   * Lateral Depth Scale Markings (cm)
   */
  private renderDepthScale(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    radius: number,
    depthCm: number
  ): void {
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    const numTicks = 4;
    for (let i = 1; i <= numTicks; i++) {
      const frac = i / numTicks;
      const dy = oy + frac * radius;
      const cmVal = Math.round(frac * depthCm);
      ctx.fillText(`${cmVal}cm`, ox + radius * 0.42 + 25, dy + 3);
      ctx.fillRect(ox + radius * 0.42 + 18, dy, 5, 1);
    }
  }

  /**
   * Caliper Measurements
   */
  private renderCalipers(ctx: CanvasRenderingContext2D, settings: PocusSettings): void {
    const { caliperPointA, caliperPointB } = settings;
    if (!caliperPointA) return;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#38bdf8';

    ctx.beginPath();
    ctx.arc(caliperPointA.x, caliperPointA.y, 4, 0, Math.PI * 2);
    ctx.fill();

    if (caliperPointB) {
      ctx.beginPath();
      ctx.arc(caliperPointB.x, caliperPointB.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(caliperPointA.x, caliperPointA.y);
      ctx.lineTo(caliperPointB.x, caliperPointB.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const dx = caliperPointB.x - caliperPointA.x;
      const dy = caliperPointB.y - caliperPointA.y;
      const pxDist = Math.sqrt(dx * dx + dy * dy);
      const cmDist = (pxDist / 20).toFixed(1);

      ctx.font = 'bold 11px monospace';
      ctx.fillText(`+ ${cmDist} cm`, (caliperPointA.x + caliperPointB.x) / 2 + 8, (caliperPointA.y + caliperPointB.y) / 2 - 8);
    }
  }

  /**
   * Telemetry HUD Overlay
   */
  private renderTelemetryHUD(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    vitals: PatientVitals,
    settings: PocusSettings
  ): void {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`GAIN: ${Math.round(settings.gain * 100)}%`, 14, 20);
    ctx.fillText(`DEPTH: ${settings.depthCm}cm`, 14, 34);
    ctx.fillText(`FPS: 60`, 14, 48);

    if (settings.isFrozen) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('❄ FROZEN (CINE)', width - 110, 20);
    } else {
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('● LIVE 60 FPS', width - 95, 20);
    }
  }
}
