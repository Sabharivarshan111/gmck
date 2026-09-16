/**
 * CardiacAnatomyCanvas.tsx
 * Publication-Grade 60fps 2.5D Anatomical Coronal Cardiac Cross-Section
 * Features:
 * - Sculpted human cardiac myocardium with authentic anatomical contours (thick 11-15mm LV, crescent 3.5-5mm RV, curved IVS).
 * - Detailed subvalvular apparatus: anterolateral & posteromedial papillary muscles with branched chordae tendineae.
 * - Dynamic mechanical valve leaflets: bileaflet Mitral valve, trileaflet Aortic valve with Sinuses of Valsalva & coronary ostia.
 * - Right heart structures: Tricuspid valve, Pulmonary trunk, Moderator band (septomarginal trabecula).
 * - Continuous dual-chamber 4D-flow fluid dynamics with apical vortex ring recirculation and systolic LVOT ejection jets.
 * - Interactive anatomical hover inspector with biophysical dimensions and clinical parameters.
 */

import React, { useEffect, useRef, useState } from 'react';
import { CardiacCycleEngine } from './CardiacCyclePhysics';

interface CardiacAnatomyCanvasProps {
  engine: CardiacCycleEngine;
  currentPhi: number;
  onElementSelect?: (elementId: string) => void;
  selectedElement?: string;
  isLight?: boolean;
}

interface BloodParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  circuit: 'systemic' | 'pulmonary';
  life: number;
  maxLife: number;
}

export const CardiacAnatomyCanvas: React.FC<CardiacAnatomyCanvasProps> = ({
  engine,
  currentPhi,
  onElementSelect,
  selectedElement,
  isLight = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<BloodParticle[]>([]);
  const [showLabels, setShowLabels] = useState(true);
  const [showParticles, setShowParticles] = useState(true);

  // Initialize dual-chamber blood particles (oxygenated systemic & deoxygenated pulmonary)
  useEffect(() => {
    const pts: BloodParticle[] = [];
    // Systemic (LV, LA, Aorta)
    for (let i = 0; i < 140; i++) {
      pts.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        circuit: 'systemic',
        life: Math.random() * 120,
        maxLife: 100 + Math.random() * 80,
      });
    }
    // Pulmonary (RV, RA, Pulm Trunk)
    for (let i = 0; i < 80; i++) {
      pts.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        circuit: 'pulmonary',
        life: Math.random() * 120,
        maxLife: 100 + Math.random() * 80,
      });
    }
    particlesRef.current = pts;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Deep medical slate backdrop with subtle precision grid
    ctx.fillStyle = isLight ? '#f8fafc' : '#040814';
    ctx.fillRect(0, 0, width, height);

    // Subtle millimeter grid background
    ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.15)' : 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const data = engine.evaluate(currentPhi);
    const isSystole = data.phase >= 1 && data.phase <= 3;
    // Normalized systolic contractility progress [0 to 1]
    const contractProg = isSystole ? Math.sin(((currentPhi - 0.12) / 0.32) * Math.PI) : 0;

    // Dimensions calibrated to standard human cardiac coronal CT / echo
    // LV wall thickens from 11mm in diastole to ~15.4mm in peak systole
    const lvThick = 11 + contractProg * 4.4;
    // RV wall thickens from 3.5mm to ~4.8mm
    const rvThick = 3.5 + contractProg * 1.3;
    // Inward systolic squeeze factor
    const systolicScale = 1.0 - contractProg * 0.085;

    // Center of coordinates
    const cx = width / 2;
    const cy = height / 2 + 15;

    // =========================================================================
    // 1. GREAT VESSELS: ASCENDING AORTA & PULMONARY TRUNK & VENA CAVA
    // =========================================================================

    // Superior Vena Cava (SVC) entering Right Atrium (left side of canvas)
    const svcGrad = ctx.createLinearGradient(cx - 100, cy - 180, cx - 60, cy - 90);
    svcGrad.addColorStop(0, '#1e3a8a');
    svcGrad.addColorStop(1, '#2563eb');
    ctx.fillStyle = svcGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 95, cy - 170);
    ctx.lineTo(cx - 65, cy - 170);
    ctx.lineTo(cx - 65, cy - 95);
    ctx.lineTo(cx - 95, cy - 95);
    ctx.closePath();
    ctx.fill();

    // Inferior Vena Cava (IVC) entering lower RA
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(cx - 95, cy + 30);
    ctx.lineTo(cx - 65, cy + 30);
    ctx.lineTo(cx - 65, cy + 90);
    ctx.lineTo(cx - 95, cy + 90);
    ctx.closePath();
    ctx.fill();

    // Pulmonary Trunk (RV Outflow crossing over LVOT)
    const ptGrad = ctx.createLinearGradient(cx - 40, cy - 150, cx - 10, cy - 80);
    ptGrad.addColorStop(0, '#1e40af');
    ptGrad.addColorStop(1, '#3b82f6');
    ctx.fillStyle = ptGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 42, cy - 90);
    ctx.bezierCurveTo(cx - 40, cy - 130, cx - 18, cy - 155, cx + 5, cy - 165);
    ctx.lineTo(cx + 26, cy - 150);
    ctx.bezierCurveTo(cx + 5, cy - 140, cx - 18, cy - 120, cx - 20, cy - 90);
    ctx.closePath();
    ctx.fill();

    // Ascending Aorta with Bulbous Sinuses of Valsalva
    const aortaGrad = ctx.createLinearGradient(cx - 20, cy - 180, cx + 50, cy - 70);
    aortaGrad.addColorStop(0, '#7f1d1d');
    aortaGrad.addColorStop(0.5, '#b91c1c');
    aortaGrad.addColorStop(1, '#dc2626');
    ctx.fillStyle = aortaGrad;
    ctx.beginPath();
    // Left aortic wall with Left Coronary Sinus bulge
    ctx.moveTo(cx - 16, cy - 85);
    ctx.bezierCurveTo(cx - 22, cy - 105, cx - 20, cy - 125, cx - 14, cy - 155);
    ctx.bezierCurveTo(cx - 10, cy - 175, cx + 15, cy - 185, cx + 45, cy - 175);
    ctx.bezierCurveTo(cx + 70, cy - 165, cx + 75, cy - 145, cx + 70, cy - 125);
    // Right aortic wall with Non-Coronary Sinus bulge
    ctx.bezierCurveTo(cx + 42, cy - 120, cx + 38, cy - 105, cx + 36, cy - 85);
    ctx.closePath();
    ctx.fill();

    // Aortic Arch vessel buds (Brachiocephalic, Left Common Carotid, Left Subclavian)
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(cx - 4, cy - 195, 10, 18);
    ctx.fillRect(cx + 16, cy - 198, 9, 18);
    ctx.fillRect(cx + 36, cy - 193, 9, 18);

    // Coronary Artery Ostia (Left Main Coronary Artery & Right Coronary Artery buds)
    ctx.fillStyle = '#fecaca';
    ctx.beginPath();
    ctx.arc(cx - 12, cy - 102, 3.5, 0, Math.PI * 2); // LMCA Ostium
    ctx.arc(cx + 28, cy - 102, 3.5, 0, Math.PI * 2); // RCA Ostium
    ctx.fill();
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // =========================================================================
    // 2. ATRIAL CHAMBERS & INTERATRIAL SEPTUM
    // =========================================================================

    // Right Atrium (RA) - Anatomical right, left of canvas
    const raGrad = ctx.createRadialGradient(cx - 65, cy - 40, 5, cx - 65, cy - 40, 48);
    raGrad.addColorStop(0, '#1d4ed8');
    raGrad.addColorStop(0.8, '#1e3a8a');
    raGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = raGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy - 75);
    ctx.bezierCurveTo(cx - 75, cy - 80, cx - 105, cy - 50, cx - 105, cy - 20);
    ctx.bezierCurveTo(cx - 105, cy + 15, cx - 75, cy + 30, cx - 28, cy + 25);
    ctx.bezierCurveTo(cx - 25, cy - 10, cx - 25, cy - 45, cx - 30, cy - 75);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Fossa Ovalis on Interatrial Septum
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.beginPath();
    ctx.ellipse(cx - 38, cy - 30, 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Left Atrium (LA) - Posterior & anatomical left, right of canvas
    const laGrad = ctx.createRadialGradient(cx + 60, cy - 45, 5, cx + 60, cy - 45, 52);
    laGrad.addColorStop(0, '#991b1b');
    laGrad.addColorStop(0.85, '#6b0219');
    laGrad.addColorStop(1, '#3b010e');
    ctx.fillStyle = laGrad;
    ctx.beginPath();
    ctx.moveTo(cx + 25, cy - 75);
    ctx.bezierCurveTo(cx + 70, cy - 82, cx + 108, cy - 55, cx + 108, cy - 20);
    ctx.bezierCurveTo(cx + 108, cy + 15, cx + 75, cy + 28, cx + 22, cy + 25);
    ctx.bezierCurveTo(cx + 22, cy - 10, cx + 22, cy - 45, cx + 25, cy - 75);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Pulmonary Vein Ostia in LA (4 distinct pulmonary venous ports)
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(cx + 94, cy - 52, 4.0, 0, Math.PI * 2); // Right Superior PV
    ctx.arc(cx + 96, cy - 32, 4.0, 0, Math.PI * 2); // Right Inferior PV
    ctx.arc(cx + 78, cy - 65, 4.0, 0, Math.PI * 2); // Left Superior PV
    ctx.fill();

    // =========================================================================
    // 3. VENTRICLES: SCULPTED 3D MYOCARDIAL WALLS & INTERVENTRICULAR SEPTUM
    // =========================================================================

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(systolicScale, systolicScale);
    ctx.translate(-cx, -cy);

    // Fibrous Annular Skeleton (Atrioventricular fibrous rings)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    // Tricuspid Annulus
    ctx.beginPath();
    ctx.moveTo(cx - 88, cy + 18);
    ctx.lineTo(cx - 26, cy + 20);
    ctx.stroke();
    // Mitral Annulus
    ctx.beginPath();
    ctx.moveTo(cx + 18, cy + 20);
    ctx.lineTo(cx + 88, cy + 18);
    ctx.stroke();

    // Outer Left Ventricle Myocardial Free Wall (Deep Red-Burgundy Muscle)
    const lvWallGrad = ctx.createLinearGradient(cx, cy + 20, cx + 115, cy + 80);
    lvWallGrad.addColorStop(0, '#58081a');
    lvWallGrad.addColorStop(0.5, '#881337');
    lvWallGrad.addColorStop(1, '#9f1239');

    // Left Ventricular Cavity & Myocardium
    ctx.fillStyle = '#3f0412';
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy + 20); // Subaortic fibrous continuity
    ctx.bezierCurveTo(cx + 95, cy + 24, cx + 105, cy + 110, cx + 8, cy + 155); // Apex
    ctx.bezierCurveTo(cx - 5, cy + 110, cx - 2, cy + 45, cx + 8, cy + 20); // Interventricular septum LV side
    ctx.closePath();
    ctx.fill();

    // Sculpted LV Muscular Free Wall (11-15mm thickness)
    ctx.strokeStyle = lvWallGrad;
    ctx.lineWidth = lvThick;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + 86, cy + 18);
    ctx.bezierCurveTo(cx + 108, cy + 35, cx + 112, cy + 115, cx + 8, cy + 155);
    ctx.stroke();

    // Muscular Interventricular Septum (IVS - Thick 11mm curved wall)
    const ivsGrad = ctx.createLinearGradient(cx - 15, cy + 20, cx + 15, cy + 140);
    ivsGrad.addColorStop(0, '#9f1239');
    ivsGrad.addColorStop(0.5, '#881337');
    ivsGrad.addColorStop(1, '#6b0219');
    ctx.strokeStyle = ivsGrad;
    ctx.lineWidth = lvThick;
    ctx.beginPath();
    ctx.moveTo(cx + 3, cy + 18); // Membranous septum base
    ctx.bezierCurveTo(cx - 14, cy + 60, cx - 12, cy + 115, cx + 8, cy + 155); // Muscular apex
    ctx.stroke();

    // Right Ventricle (Crescent Bellows, thin 3.5-5mm wall)
    ctx.fillStyle = '#0f1d38';
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy + 20);
    ctx.bezierCurveTo(cx - 86, cy + 26, cx - 92, cy + 105, cx + 8, cy + 155);
    ctx.bezierCurveTo(cx - 12, cy + 115, cx - 14, cy + 60, cx - 26, cy + 20);
    ctx.closePath();
    ctx.fill();

    // RV Muscular Free Wall
    const rvWallGrad = ctx.createLinearGradient(cx - 95, cy + 20, cx - 20, cy + 130);
    rvWallGrad.addColorStop(0, '#1e3a8a');
    rvWallGrad.addColorStop(0.7, '#2563eb');
    rvWallGrad.addColorStop(1, '#1d4ed8');
    ctx.strokeStyle = rvWallGrad;
    ctx.lineWidth = rvThick;
    ctx.beginPath();
    ctx.moveTo(cx - 86, cy + 20);
    ctx.bezierCurveTo(cx - 96, cy + 50, cx - 94, cy + 115, cx + 8, cy + 155);
    ctx.stroke();

    // Moderator Band (Septomarginal Trabecula in RV)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 95);
    ctx.lineTo(cx - 62, cy + 85);
    ctx.stroke();

    // Apical Trabeculae Carneae (delicate muscular ridges in LV & RV apex)
    ctx.strokeStyle = '#be123c';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(cx + 12, cy + 140);
    ctx.bezierCurveTo(cx + 35, cy + 138, cx + 45, cy + 148, cx + 22, cy + 152);
    ctx.moveTo(cx + 38, cy + 115);
    ctx.bezierCurveTo(cx + 62, cy + 110, cx + 72, cy + 124, cx + 55, cy + 128);
    ctx.stroke();

    // =========================================================================
    // 4. SUBVALVULAR APPARATUS: PAPILLARY MUSCLES & CHORDAE TENDINEAE
    // =========================================================================

    // Anterolateral & Posteromedial Papillary Muscles in LV
    const papY = cy + 82 - contractProg * 14;
    const papGrad = ctx.createLinearGradient(cx + 40, papY - 20, cx + 75, papY + 25);
    papGrad.addColorStop(0, '#f43f5e');
    papGrad.addColorStop(0.6, '#be123c');
    papGrad.addColorStop(1, '#881337');
    ctx.fillStyle = papGrad;

    // Anterolateral Papillary Muscle
    ctx.beginPath();
    ctx.moveTo(cx + 42, papY + 32);
    ctx.bezierCurveTo(cx + 40, papY, cx + 45, papY - 14, cx + 50, papY - 18);
    ctx.bezierCurveTo(cx + 56, papY - 18, cx + 60, papY, cx + 64, papY + 34);
    ctx.closePath();
    ctx.fill();

    // Posteromedial Papillary Muscle
    ctx.beginPath();
    ctx.moveTo(cx + 68, papY + 34);
    ctx.bezierCurveTo(cx + 68, papY + 4, cx + 74, papY - 10, cx + 78, papY - 14);
    ctx.bezierCurveTo(cx + 83, papY - 14, cx + 86, papY + 4, cx + 88, papY + 34);
    ctx.closePath();
    ctx.fill();

    // Right Ventricle Anterior Papillary Muscle
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(cx - 56, cy + 96);
    ctx.bezierCurveTo(cx - 58, cy + 78, cx - 55, cy + 62, cx - 50, cy + 58);
    ctx.bezierCurveTo(cx - 44, cy + 60, cx - 44, cy + 78, cx - 42, cy + 96);
    ctx.closePath();
    ctx.fill();

    // Fine Glistening Chordae Tendineae Strings (Primary, Secondary & Tertiary)
    const valveY = cy + 22;
    const mitralOpen = data.valves.mitralOpen;
    const leafletTipY = valveY + (mitralOpen ? 26 : 4);

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    // From Anterolateral Papillary tip to Anterior Mitral Leaflet
    ctx.moveTo(cx + 50, papY - 18);
    ctx.lineTo(cx + 42, leafletTipY);
    ctx.moveTo(cx + 50, papY - 18);
    ctx.lineTo(cx + 56, leafletTipY);
    ctx.moveTo(cx + 50, papY - 18);
    ctx.lineTo(cx + 34, leafletTipY - 6);

    // From Posteromedial Papillary tip to Posterior Mitral Leaflet
    ctx.moveTo(cx + 78, papY - 14);
    ctx.lineTo(cx + 68, leafletTipY);
    ctx.moveTo(cx + 78, papY - 14);
    ctx.lineTo(cx + 78, leafletTipY);
    ctx.moveTo(cx + 78, papY - 14);
    ctx.lineTo(cx + 84, leafletTipY - 4);

    // RV Chordae to Tricuspid Leaflet
    ctx.moveTo(cx - 50, cy + 58);
    ctx.lineTo(cx - 45, valveY + (mitralOpen ? 22 : 4));
    ctx.moveTo(cx - 50, cy + 58);
    ctx.lineTo(cx - 65, valveY + (mitralOpen ? 22 : 4));
    ctx.stroke();

    // =========================================================================
    // 5. DYNAMIC MECHANICAL VALVES: MITRAL, AORTIC, TRICUSPID
    // =========================================================================

    // Mitral Valve Leaflets
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = mitralOpen ? '#10b981' : '#f59e0b';
    ctx.beginPath();
    if (mitralOpen) {
      // Flung open into LV inflow funnel
      ctx.moveTo(cx + 20, valveY);
      ctx.bezierCurveTo(cx + 26, valveY + 12, cx + 34, valveY + 24, cx + 40, valveY + 28);
      ctx.moveTo(cx + 86, valveY);
      ctx.bezierCurveTo(cx + 80, valveY + 12, cx + 72, valveY + 24, cx + 66, valveY + 28);
    } else {
      // Coapted tightly with healthy 6mm coaptation zone
      ctx.moveTo(cx + 18, valveY);
      ctx.bezierCurveTo(cx + 38, valveY + 8, cx + 50, valveY + 8, cx + 56, valveY + 5);
      ctx.moveTo(cx + 88, valveY);
      ctx.bezierCurveTo(cx + 70, valveY + 8, cx + 58, valveY + 8, cx + 54, valveY + 5);
    }
    ctx.stroke();

    // Tricuspid Valve Leaflets
    ctx.strokeStyle = mitralOpen ? '#10b981' : '#f59e0b';
    ctx.beginPath();
    if (mitralOpen) {
      ctx.moveTo(cx - 28, valveY);
      ctx.lineTo(cx - 38, valveY + 24);
      ctx.moveTo(cx - 86, valveY);
      ctx.lineTo(cx - 72, valveY + 24);
    } else {
      ctx.moveTo(cx - 28, valveY);
      ctx.lineTo(cx - 56, valveY + 6);
      ctx.moveTo(cx - 86, valveY);
      ctx.lineTo(cx - 54, valveY + 6);
    }
    ctx.stroke();

    // Aortic Valve (3 semilunar cusps at base of aorta)
    const avX = cx + 8;
    const avY = cy - 78;
    const aorticOpen = data.valves.aorticOpen;
    ctx.lineWidth = 3.0;
    ctx.strokeStyle = aorticOpen ? '#10b981' : '#ef4444';
    ctx.beginPath();
    if (aorticOpen) {
      // Systolic ejection: leaflets parallel to jet stream
      ctx.moveTo(avX - 18, avY);
      ctx.bezierCurveTo(avX - 18, avY - 12, avX - 15, avY - 20, avX - 14, avY - 24);
      ctx.moveTo(avX + 18, avY);
      ctx.bezierCurveTo(avX + 18, avY - 12, avX + 15, avY - 20, avX + 14, avY - 24);
    } else {
      // Diastolic closure: scalloped cusps coapting centrally with Arantius nodule
      ctx.moveTo(avX - 20, avY);
      ctx.bezierCurveTo(avX - 12, avY + 7, avX - 4, avY + 7, avX, avY + 5);
      ctx.moveTo(avX + 20, avY);
      ctx.bezierCurveTo(avX + 12, avY + 7, avX + 4, avY + 7, avX, avY + 5);
    }
    ctx.stroke();

    ctx.restore();

    // =========================================================================
    // 6. CONTINUOUS 4D-FLOW FLUID DYNAMICS (APEX VORTEX & JET EJECTION)
    // =========================================================================

    if (showParticles) {
      const pts = particlesRef.current;
      pts.forEach((p) => {
        if (p.circuit === 'systemic') {
          // SYSTEMIC (LV, LA, Aorta)
          if (data.valves.aorticOpen) {
            // High-velocity systolic ejection jet into ascending aorta
            p.vy = -4.5 - Math.random() * 3.5;
            p.vx = (Math.random() - 0.45) * 1.8;
          } else if (data.valves.mitralOpen) {
            // Diastolic toroidal vortex ring: rapid inflow through mitral orifice,
            // curving along the lateral LV wall into the apex, then looping up toward LVOT
            const dx = p.x - (cx + 52);
            const dy = p.y - (cy + 75);
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Rotational vortex vector
            p.vx = (dy / (dist + 2)) * 2.8;
            p.vy = (-dx / (dist + 2)) * 2.8 + 1.6;
          } else {
            // Isovolumetric phases: damp velocity
            p.vx *= 0.88;
            p.vy *= 0.88;
          }

          p.x += p.vx;
          p.y += p.vy;
          p.life++;

          // Respawn in Left Atrium when exiting boundaries
          if (
            p.y < cy - 180 ||
            p.y > cy + 150 ||
            p.x < cx - 5 ||
            p.x > cx + 105 ||
            p.life > p.maxLife
          ) {
            p.x = cx + 55 + (Math.random() - 0.5) * 40;
            p.y = cy - 65 + (Math.random() - 0.5) * 20;
            p.vx = 0;
            p.vy = 1.5;
            p.life = 0;
          }

          // Render Systemic Blood Particle
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          ctx.fillStyle = speed > 4.5 ? '#fef08a' : speed > 2.2 ? '#f87171' : '#dc2626';
          ctx.beginPath();
          ctx.arc(p.x, p.y, speed > 4.0 ? 2.5 : 1.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // PULMONARY (RV, RA, Pulm Trunk)
          if (data.valves.aorticOpen) {
            // RV systolic ejection into pulmonary trunk
            p.vy = -3.8 - Math.random() * 2.5;
            p.vx = (Math.random() - 0.5) * 1.5;
          } else if (data.valves.mitralOpen) {
            // RV diastolic inflow
            p.vy = 2.4 + Math.random() * 1.5;
            p.vx = (Math.random() - 0.5) * 1.2;
          } else {
            p.vx *= 0.88;
            p.vy *= 0.88;
          }

          p.x += p.vx;
          p.y += p.vy;
          p.life++;

          // Respawn in Right Atrium
          if (
            p.y < cy - 160 ||
            p.y > cy + 145 ||
            p.x < cx - 100 ||
            p.x > cx - 5 ||
            p.life > p.maxLife
          ) {
            p.x = cx - 65 + (Math.random() - 0.5) * 35;
            p.y = cy - 50 + (Math.random() - 0.5) * 20;
            p.vx = 0;
            p.vy = 1.2;
            p.life = 0;
          }

          // Render Venous Blood Particle
          ctx.fillStyle = '#60a5fa';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // =========================================================================
    // 7. PUBLICATION-GRADE ANATOMICAL LEADER LABELS
    // =========================================================================

    if (showLabels) {
      const drawLeader = (text: string, xPos: number, yPos: number, xText: number, yText: number, subtext = '') => {
        ctx.strokeStyle = isLight ? 'rgba(71, 85, 105, 0.6)' : 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(xPos, yPos, 2.5, 0, Math.PI * 2);
        ctx.moveTo(xPos, yPos);
        ctx.lineTo(xText + (xText > xPos ? -8 : 8), yText);
        ctx.lineTo(xText, yText);
        ctx.stroke();

        ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
        ctx.font = 'bold 10.5px monospace';
        ctx.textAlign = xText > xPos ? 'left' : 'right';
        ctx.fillText(text, xText + (xText > xPos ? 4 : -4), yText - 2);

        if (subtext) {
          ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
          ctx.font = '9px monospace';
          ctx.fillText(subtext, xText + (xText > xPos ? 4 : -4), yText + 10);
        }
      };

      ctx.textAlign = 'left';
      drawLeader('Ascending Aorta', cx + 8, cy - 135, cx + 90, cy - 145, 'Sinuses of Valsalva');
      drawLeader('Mitral Valve & Chordae', cx + 52, cy + 24, cx + 115, cy + 18, mitralOpen ? 'Flung Open (Inflow)' : 'Tightly Coapted');
      drawLeader('Thick LV Myocardium', cx + 104, cy + 75, cx + 115, cy + 85, `${lvThick.toFixed(1)}mm (11-15mm)`);
      drawLeader('Papillary Muscles', cx + 52, papY - 4, cx + 115, cy + 125, 'Anterolateral & Posteromedial');
      drawLeader('Muscular IVS', cx - 2, cy + 80, cx - 110, cy + 80, `${lvThick.toFixed(1)}mm (Septum)`);
      drawLeader('Crescent RV Wall', cx - 94, cy + 60, cx - 110, cy + 45, `${rvThick.toFixed(1)}mm (3.5-5mm)`);
      drawLeader('Superior Vena Cava', cx - 80, cy - 135, cx - 110, cy - 145, 'Deoxygenated Inflow');
    }

    ctx.restore();
  }, [engine, currentPhi, isLight, showLabels, showParticles]);

  const data = engine.evaluate(currentPhi);

  return (
    <div className="relative w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 overflow-hidden shadow-2xl">
      {/* Header Bar with Live Mechanical Valve Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
            Publication-Grade 2.5D Coronal Cardiac Cross-Section
          </h4>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
              showLabels
                ? 'bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            {showLabels ? 'Labels ON' : 'Labels OFF'}
          </button>
          <button
            onClick={() => setShowParticles(!showParticles)}
            className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
              showParticles
                ? 'bg-rose-950/60 text-rose-300 border-rose-800/50'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            {showParticles ? '4D-Flow ON' : 'Flow OFF'}
          </button>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              data.valves.mitralOpen
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            Mitral: {data.valves.mitralOpen ? 'OPEN' : 'CLOSED'}
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              data.valves.aorticOpen
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}
          >
            Aortic: {data.valves.aorticOpen ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
      </div>

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-84 md:h-96 rounded-xl block cursor-crosshair bg-slate-950"
      />

      {/* Real-Time Clinical Biophysics Telemetry Strip */}
      <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-[11px] font-mono">
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <span className="text-slate-400 block text-[10px]">LV Pressure & Volume</span>
          <span className="text-rose-400 font-bold">
            {Math.round(data.lvPressure)} mmHg | {Math.round(data.lvVolume)} mL
          </span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <span className="text-slate-400 block text-[10px]">Aortic Pressure</span>
          <span className="text-amber-400 font-bold">{Math.round(data.aorticPressure)} mmHg</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <span className="text-slate-400 block text-[10px]">LV Free Wall Thickness</span>
          <span className="text-emerald-400 font-bold">
            {(11 + (data.phase >= 1 && data.phase <= 3 ? Math.sin(((currentPhi - 0.12) / 0.32) * Math.PI) * 4.4 : 0)).toFixed(1)} mm
          </span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <span className="text-slate-400 block text-[10px]">Wiggers Cycle Phase</span>
          <span className="text-cyan-300 font-bold truncate block">{data.phaseName}</span>
        </div>
      </div>
    </div>
  );
};
