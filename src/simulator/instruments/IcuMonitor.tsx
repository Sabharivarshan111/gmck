import React, { useEffect, useRef, useState } from 'react';
import { PatientVitals, TelemetryWaveformSample } from '../types';

interface IcuMonitorProps {
  vitals: PatientVitals;
  sampleWaveforms: () => TelemetryWaveformSample;
  ecgRhythm: string;
  theme?: 'light' | 'dark';
}

export const IcuMonitor: React.FC<IcuMonitorProps> = ({
  vitals,
  sampleWaveforms,
  ecgRhythm,
  theme = 'light',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastBeepTimeRef = useRef<number>(0);
  const sweepXRef = useRef<number>(0);
  const timeOffsetRef = useRef<number>(0);

  const prevPointsRef = useRef<{
    ecg: number;
    art: number;
    pleth: number;
    capno: number;
  }>({ ecg: 0, art: 0, pleth: 0, capno: 0 });

  // Web Audio Beep generator
  const playHeartBeep = (freq: number) => {
    if (!audioEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const pitch = Math.max(300, freq * (vitals.spo2 / 100));
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const sweepSpeed = 2.5; // pixels per frame
    const eraseWidth = 20;
    const w = canvas.width;
    const h = canvas.height;
    const channelH = h / 4;
    const c1Y = channelH * 0.55;
    const c2Y = channelH * 1.60;
    const c3Y = channelH * 2.65;
    const c4Y = channelH * 3.70;

    // Helper: calculate analytical waveform coordinate at absolute time t
    const calculatePoint = (t: number) => {
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

      // 2. Arterial line
      const pSys = vitals.bpSystolic;
      const pDia = vitals.bpDiastolic;
      let art = pDia;
      if (theta >= 1.15 && theta < 2.1) {
        const prog = (theta - 1.15) / 0.95;
        art = pDia + (pSys - pDia) * Math.sin(prog * Math.PI);
      } else if (theta >= 2.1 && theta < 2.5) {
        art = pDia + (pSys - pDia) * 0.36 + 7 * Math.sin((theta - 2.1) * 4 * Math.PI);
      } else {
        const prog = theta < 1.15 ? theta + (2 * Math.PI - 2.5) : theta - 2.5;
        art = pDia + (pSys - pDia) * 0.32 * Math.exp(-prog * 0.85);
      }

      // 3. Plethysmogram
      const delayed = (theta - 0.4 + 2 * Math.PI) % (2 * Math.PI);
      const pleth = Math.max(0, Math.sin(delayed) * 0.85 + 0.15);

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
    };

    // Pre-populate background with continuous hospital-grade waveforms across canvas
    ctx.fillStyle = '#080c15';
    ctx.fillRect(0, 0, w, h);

    const totalCanvasSec = (w / sweepSpeed) * 0.016; // Time equivalent across screen
    let prev = calculatePoint(0);
    for (let x = 1; x < w; x++) {
      const t = (x / w) * totalCanvasSec;
      const pt = calculatePoint(t);

      // Lead II (Green)
      ctx.beginPath();
      ctx.strokeStyle = '#00e676';
      ctx.lineWidth = 2.0;
      ctx.moveTo(x - 1, prev.ecgY);
      ctx.lineTo(x, pt.ecgY);
      ctx.stroke();

      // ART (Red)
      ctx.beginPath();
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 2.0;
      ctx.moveTo(x - 1, prev.artY);
      ctx.lineTo(x, pt.artY);
      ctx.stroke();

      // Pleth (Cyan)
      ctx.beginPath();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2.0;
      ctx.moveTo(x - 1, prev.plethY);
      ctx.lineTo(x, pt.plethY);
      ctx.stroke();

      // Capno (Yellow)
      ctx.beginPath();
      ctx.strokeStyle = '#ffd600';
      ctx.lineWidth = 2.0;
      ctx.moveTo(x - 1, prev.capnoY);
      ctx.lineTo(x, pt.capnoY);
      ctx.stroke();

      prev = pt;
    }
    prevPointsRef.current = {
      ecg: prev.ecgY,
      art: prev.artY,
      pleth: prev.plethY,
      capno: prev.capnoY,
    };

    let lastTime = performance.now();

    const render = (currentTime: number) => {
      animId = requestAnimationFrame(render);
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;
      timeOffsetRef.current += dt;

      const curX = sweepXRef.current;
      const nextX = (curX + sweepSpeed) % w;

      // Erase band ahead of sweep
      ctx.fillStyle = '#080c15';
      ctx.fillRect(nextX, 0, eraseWidth, h);

      // Grid dividers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(nextX, i * channelH);
        ctx.lineTo(nextX + eraseWidth, i * channelH);
        ctx.stroke();
      }

      // Draw continuous segments for all integer pixels between curX and nextX
      const startX = Math.floor(curX);
      const endX = nextX > curX ? Math.floor(nextX) : w;

      for (let x = startX; x <= endX; x++) {
        const t = timeOffsetRef.current + (x / w) * 0.1;
        const pt = calculatePoint(t);

        if (x > startX) {
          ctx.beginPath();
          ctx.strokeStyle = '#00e676';
          ctx.lineWidth = 2.0;
          ctx.moveTo(x - 1, prevPointsRef.current.ecg);
          ctx.lineTo(x, pt.ecgY);
          ctx.stroke();

          ctx.beginPath();
          ctx.strokeStyle = '#ff1744';
          ctx.lineWidth = 2.0;
          ctx.moveTo(x - 1, prevPointsRef.current.art);
          ctx.lineTo(x, pt.artY);
          ctx.stroke();

          ctx.beginPath();
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 2.0;
          ctx.moveTo(x - 1, prevPointsRef.current.pleth);
          ctx.lineTo(x, pt.plethY);
          ctx.stroke();

          ctx.beginPath();
          ctx.strokeStyle = '#ffd600';
          ctx.lineWidth = 2.0;
          ctx.moveTo(x - 1, prevPointsRef.current.capno);
          ctx.lineTo(x, pt.capnoY);
          ctx.stroke();
        }

        prevPointsRef.current = {
          ecg: pt.ecgY,
          art: pt.artY,
          pleth: pt.plethY,
          capno: pt.capnoY,
        };

        if (pt.rawEcg > 1.0 && currentTime - lastBeepTimeRef.current > 400) {
          lastBeepTimeRef.current = currentTime;
          playHeartBeep(780);
        }
      }

      if (nextX < curX) {
        // Wrapped around: draw from 0 to nextX
        for (let x = 0; x <= Math.floor(nextX); x++) {
          const t = timeOffsetRef.current + (x / w) * 0.1;
          const pt = calculatePoint(t);

          if (x > 0) {
            ctx.beginPath();
            ctx.strokeStyle = '#00e676';
            ctx.lineWidth = 2.0;
            ctx.moveTo(x - 1, prevPointsRef.current.ecg);
            ctx.lineTo(x, pt.ecgY);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = '#ff1744';
            ctx.lineWidth = 2.0;
            ctx.moveTo(x - 1, prevPointsRef.current.art);
            ctx.lineTo(x, pt.artY);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2.0;
            ctx.moveTo(x - 1, prevPointsRef.current.pleth);
            ctx.lineTo(x, pt.plethY);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = '#ffd600';
            ctx.lineWidth = 2.0;
            ctx.moveTo(x - 1, prevPointsRef.current.capno);
            ctx.lineTo(x, pt.capnoY);
            ctx.stroke();
          }

          prevPointsRef.current = {
            ecg: pt.ecgY,
            art: pt.artY,
            pleth: pt.plethY,
            capno: pt.capnoY,
          };
        }
      }

      sweepXRef.current = nextX;
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [vitals, ecgRhythm]);

  const isLight = theme === 'light';

  return (
    <div
      className={`rounded-2xl md:rounded-3xl border overflow-hidden flex flex-col lg:flex-row shadow-2xl transition-all h-full ${
        isLight ? 'bg-slate-900 border-slate-800' : 'bg-[#050811] border-slate-800'
      }`}
    >
      {/* Waveform Sweep Screen (Left / Main Panel) */}
      <div className="flex-1 p-3 flex flex-col">
        {/* Monitor Header Status Bar */}
        <div
          className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-[11px] ${
            isLight
              ? 'bg-slate-900 text-slate-200 border-slate-800'
              : 'bg-slate-900/90 text-slate-300 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              SWEEP 25 mm/s
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">
              Rhythm:{' '}
              <strong
                className={
                  ecgRhythm === 'vfib' || ecgRhythm === 'vtach'
                    ? 'text-red-500 animate-pulse'
                    : ecgRhythm.includes('stemi')
                    ? 'text-amber-400 font-black'
                    : 'text-emerald-400 font-bold'
                }
              >
                {ecgRhythm.toUpperCase().replace('_', ' ')}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-all ${
                audioEnabled
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {audioEnabled ? '🔊 Tone ON' : '🔇 Muted'}
            </button>
            <span className="text-slate-500 font-mono text-[10px]">INTELLIVUE X3 SIM</span>
          </div>
        </div>

        {/* Real-Time Canvas */}
        <div className="relative flex-1 my-1.5 min-h-[260px]">
          <canvas
            ref={canvasRef}
            width={720}
            height={360}
            className="w-full h-full rounded border border-slate-900 bg-[#080c15]"
          />

          {/* Left Axis Channel Tags */}
          <div className="absolute top-2 left-3 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1 bg-slate-900/60 px-1 rounded">
            <span>II</span>
            <span className="text-slate-500 font-normal">1.0 mV/cm</span>
          </div>
          <div className="absolute top-[26%] left-3 text-[10px] font-mono font-bold text-red-500 flex items-center gap-1 bg-slate-900/60 px-1 rounded">
            <span>ART</span>
            <span className="text-slate-500 font-normal">0 - 200 mmHg</span>
          </div>
          <div className="absolute top-[52%] left-3 text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1 bg-slate-900/60 px-1 rounded">
            <span>PLETH</span>
            <span className="text-slate-500 font-normal">SpO2 %</span>
          </div>
          <div className="absolute top-[78%] left-3 text-[10px] font-mono font-bold text-yellow-400 flex items-center gap-1 bg-slate-900/60 px-1 rounded">
            <span>CO2</span>
            <span className="text-slate-500 font-normal">0 - 50 mmHg</span>
          </div>
        </div>
      </div>

      {/* Vital Numbers Display (Right Panel) */}
      <div className="w-full lg:w-60 bg-[#080c14] border-t lg:border-t-0 lg:border-l border-slate-800 p-3 grid grid-cols-2 lg:grid-cols-1 gap-2.5">
        {/* Heart Rate */}
        <div className="bg-slate-900/80 border border-emerald-900/60 p-2.5 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-emerald-400 font-semibold tracking-wider">
              ECG / HR
            </div>
            <div className="text-xs text-slate-500 font-mono">bpm (60-100)</div>
          </div>
          <div
            className={`text-3xl font-mono font-black ${
              vitals.heartRate < 50 || vitals.heartRate > 120
                ? 'text-red-500 animate-pulse'
                : 'text-emerald-400'
            }`}
          >
            {Math.round(vitals.heartRate)}
          </div>
        </div>

        {/* Arterial Blood Pressure */}
        <div className="bg-slate-900/80 border border-red-900/60 p-2.5 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-red-400 font-semibold tracking-wider">
              NIBP / ART
            </div>
            <div className="text-xs text-slate-500 font-mono">
              MAP: <span className="text-red-300 font-bold">({vitals.meanArterialPressure})</span>
            </div>
          </div>
          <div className="text-right font-mono">
            <div
              className={`text-xl font-black ${
                vitals.bpSystolic < 90 ? 'text-red-500 animate-pulse' : 'text-red-400'
              }`}
            >
              {Math.round(vitals.bpSystolic)}/{Math.round(vitals.bpDiastolic)}
            </div>
          </div>
        </div>

        {/* Pulse Oximetry */}
        <div className="bg-slate-900/80 border border-cyan-900/60 p-2.5 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-cyan-400 font-semibold tracking-wider">
              SPO2
            </div>
            <div className="text-xs text-slate-500 font-mono">% (95-100)</div>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-3xl font-mono font-black ${
                vitals.spo2 < 92 ? 'text-red-500 animate-pulse' : 'text-cyan-400'
              }`}
            >
              {Math.round(vitals.spo2)}
            </span>
            <span className="text-xs text-slate-500 font-mono">%</span>
          </div>
        </div>

        {/* Respiration & End-Tidal CO2 */}
        <div className="bg-slate-900/80 border border-yellow-900/60 p-2.5 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-yellow-400 font-semibold tracking-wider">
              RESP / ETCO2
            </div>
            <div className="text-xs text-slate-500 font-mono">
              EtCO2:{' '}
              <span className="text-yellow-200 font-bold">{Math.round(vitals.etco2)}</span>
            </div>
          </div>
          <div
            className={`text-3xl font-mono font-black ${
              vitals.respiratoryRate > 28 || vitals.respiratoryRate < 10
                ? 'text-red-500 animate-pulse'
                : 'text-yellow-400'
            }`}
          >
            {Math.round(vitals.respiratoryRate)}
          </div>
        </div>

        {/* Secondary Parameters (CVP, Temp, Lactate) */}
        <div className="col-span-2 lg:col-span-1 bg-slate-950/60 border border-slate-800/80 px-3 py-2 rounded-lg flex items-center justify-around font-mono text-xs">
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase">CVP</div>
            <div className="text-sky-400 font-bold">{vitals.cvp.toFixed(1)}</div>
          </div>
          <div className="text-slate-700">|</div>
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase">TEMP</div>
            <div className="text-slate-300 font-bold">{vitals.temperature.toFixed(1)}°</div>
          </div>
          <div className="text-slate-700">|</div>
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase">LACTATE</div>
            <div
              className={`font-bold ${
                vitals.lactate > 4.0 ? 'text-amber-500 animate-pulse' : 'text-slate-300'
              }`}
            >
              {vitals.lactate.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
