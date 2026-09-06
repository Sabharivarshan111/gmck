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

  // Sweep animation state
  const sweepXRef = useRef<number>(0);
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
    const sweepSpeed = 2.4;
    const eraseWidth = 16;
    const w = canvas.width;
    const h = canvas.height;
    const channelH = h / 4;
    const c1Y = channelH * 0.55;
    const c2Y = channelH * 1.60;
    const c3Y = channelH * 2.65;
    const c4Y = channelH * 3.70;

    // Pre-populate background and continuous initial waveforms
    ctx.fillStyle = '#080c15';
    ctx.fillRect(0, 0, w, h);

    // Initial synthetic prefill across canvas
    for (let x = 0; x < w; x += 3) {
      const sample = sampleWaveforms();
      const targetEcgY = c1Y - sample.ecg * 40;
      const targetArtY = c2Y - (sample.artLine - 40) * 0.75;
      const targetPlethY = c3Y - sample.pleth * 35;
      const targetCapnoY = c4Y - (sample.capno / 50) * 40;

      if (x > 0) {
        // Channel 1: ECG (Green)
        ctx.beginPath();
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 1.8;
        ctx.moveTo(x - 3, prevPointsRef.current.ecg || targetEcgY);
        ctx.lineTo(x, targetEcgY);
        ctx.stroke();

        // Channel 2: Arterial Line (Red)
        ctx.beginPath();
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 1.8;
        ctx.moveTo(x - 3, prevPointsRef.current.art || targetArtY);
        ctx.lineTo(x, targetArtY);
        ctx.stroke();

        // Channel 3: SpO2 Pleth (Cyan)
        ctx.beginPath();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.8;
        ctx.moveTo(x - 3, prevPointsRef.current.pleth || targetPlethY);
        ctx.lineTo(x, targetPlethY);
        ctx.stroke();

        // Channel 4: Capnography (Yellow)
        ctx.beginPath();
        ctx.strokeStyle = '#ffd600';
        ctx.lineWidth = 1.8;
        ctx.moveTo(x - 3, prevPointsRef.current.capno || targetCapnoY);
        ctx.lineTo(x, targetCapnoY);
        ctx.stroke();
      }

      prevPointsRef.current = {
        ecg: targetEcgY,
        art: targetArtY,
        pleth: targetPlethY,
        capno: targetCapnoY,
      };
    }

    const render = () => {
      animId = requestAnimationFrame(render);

      const sample = sampleWaveforms();

      const curX = sweepXRef.current;
      const nextX = (curX + sweepSpeed) % w;

      // Erase band ahead of sweep
      ctx.fillStyle = '#080c15';
      ctx.fillRect(nextX, 0, eraseWidth, h);

      // Faint channel horizontal dividing lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(nextX, i * channelH);
        ctx.lineTo(nextX + eraseWidth, i * channelH);
        ctx.stroke();
      }

      const targetEcgY = c1Y - sample.ecg * 40;
      const targetArtY = c2Y - (sample.artLine - 40) * 0.75;
      const targetPlethY = c3Y - sample.pleth * 35;
      const targetCapnoY = c4Y - (sample.capno / 50) * 40;

      if (nextX > curX) {
        // Channel 1: ECG (Green)
        ctx.beginPath();
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = '#00e676';
        ctx.shadowBlur = 5;
        ctx.moveTo(curX, prevPointsRef.current.ecg || targetEcgY);
        ctx.lineTo(nextX, targetEcgY);
        ctx.stroke();

        // Channel 2: Arterial Line (Red)
        ctx.beginPath();
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 5;
        ctx.moveTo(curX, prevPointsRef.current.art || targetArtY);
        ctx.lineTo(nextX, targetArtY);
        ctx.stroke();

        // Channel 3: SpO2 Pleth (Cyan)
        ctx.beginPath();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 5;
        ctx.moveTo(curX, prevPointsRef.current.pleth || targetPlethY);
        ctx.lineTo(nextX, targetPlethY);
        ctx.stroke();

        // Channel 4: Capnography (Yellow)
        ctx.beginPath();
        ctx.strokeStyle = '#ffd600';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = '#ffd600';
        ctx.shadowBlur = 5;
        ctx.moveTo(curX, prevPointsRef.current.capno || targetCapnoY);
        ctx.lineTo(nextX, targetCapnoY);
        ctx.stroke();

        ctx.shadowBlur = 0;
      }

      // Audio QRS beep
      const now = performance.now();
      if (sample.ecg > 0.8 && now - lastBeepTimeRef.current > 400) {
        lastBeepTimeRef.current = now;
        playHeartBeep(780);
      }

      sweepXRef.current = nextX;
      prevPointsRef.current = {
        ecg: targetEcgY,
        art: targetArtY,
        pleth: targetPlethY,
        capno: targetCapnoY,
      };
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [sampleWaveforms, vitals, audioEnabled]);

  const isLight = theme === 'light';

  return (
    <div
      className={`flex flex-col lg:flex-row rounded-2xl md:rounded-3xl overflow-hidden border shadow-xl h-full transition-all ${
        isLight ? 'bg-white border-slate-200/80 shadow-slate-200/50' : 'bg-[#060911] border-slate-800 shadow-2xl'
      }`}
    >
      {/* Waveform Sweep Screen (Left / Main) */}
      <div className="relative flex-1 bg-[#080c15] p-2.5 flex flex-col justify-between">
        {/* Top Monitor Status Bar */}
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

        {/* SpO2 */}
        <div className="bg-slate-900/80 border border-cyan-900/60 p-2.5 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-cyan-400 font-semibold tracking-wider">
              SpO2
            </div>
            <div className="text-xs text-slate-500 font-mono">% (95-100)</div>
          </div>
          <div
            className={`text-3xl font-mono font-black ${
              vitals.spo2 < 92 ? 'text-red-500 animate-pulse' : 'text-cyan-400'
            }`}
          >
            {Math.round(vitals.spo2)}
            <span className="text-sm font-normal text-cyan-600 ml-0.5">%</span>
          </div>
        </div>

        {/* Respiratory Rate & EtCO2 */}
        <div className="bg-slate-900/80 border border-yellow-900/60 p-2.5 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-yellow-400 font-semibold tracking-wider">
              RESP / EtCO2
            </div>
            <div className="text-xs text-slate-500 font-mono">
              EtCO2: <span className="text-yellow-300 font-bold">{Math.round(vitals.etco2)}</span>
            </div>
          </div>
          <div className="text-3xl font-mono font-black text-yellow-400">
            {Math.round(vitals.respiratoryRate)}
          </div>
        </div>

        {/* CVP & Temp & Lactate */}
        <div className="col-span-2 lg:col-span-1 grid grid-cols-3 gap-1 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 text-center font-mono">
          <div>
            <div className="text-[9px] text-slate-500 uppercase">CVP</div>
            <div className="text-sm font-bold text-blue-400">{vitals.cvp.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase">TEMP</div>
            <div className="text-sm font-bold text-slate-200">{vitals.temperature.toFixed(1)}°</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase">LACTATE</div>
            <div
              className={`text-sm font-bold ${
                vitals.lactate > 2.0 ? 'text-orange-400 font-black' : 'text-slate-300'
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
