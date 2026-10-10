import { useEffect, useRef, useState } from 'react';
import type { StethoscopeAudioEngine } from './StethoscopeSynthesizer';

/** Rolling trace of output samples; labels use the same clock as scheduled sounds. */
export function Phonocardiogram({ engineRef, listening, pulmonary, traceKey }: {
  engineRef: React.RefObject<StethoscopeAudioEngine | null>; listening: boolean; pulmonary: boolean; traceKey: string;
}) {
  const [frozen, setFrozen] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const history: { time: number; min: number; max: number }[] = [];
    let lastTime = -1;
    const draw = () => {
      if (document.hidden) return;
      const width = Math.max(1, canvas.clientWidth), height = 110;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== Math.round(width * dpr)) { canvas.width = Math.round(width * dpr); canvas.height = height * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#0b1425'; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#223148'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 56); ctx.lineTo(width, 56); ctx.stroke();
      const trace = listening ? engineRef.current?.getTrace() : null;
      if (!trace) {
        ctx.fillStyle = '#b6c6db'; ctx.font = '12px sans-serif';
        ctx.fillText(listening ? 'Waiting for audio…' : 'Tap Listen to see the output signal', 12, 34);
        return;
      }
      const start = trace.time - trace.samples.length / trace.sampleRate;
      // Reduce actual samples into time bins; never invent a waveform.
      const stride = Math.max(1, Math.round(trace.sampleRate * 0.003));
      for (let i = 0; i < trace.samples.length; i += stride) {
        const time = start + i / trace.sampleRate;
        if (time <= lastTime) continue;
        let min = 0, max = 0;
        for (let j = i; j < Math.min(i + stride, trace.samples.length); j++) { min = Math.min(min, trace.samples[j]); max = Math.max(max, trace.samples[j]); }
        history.push({ time, min, max }); lastTime = time;
      }
      while (history.length && history[0].time < trace.time - 2.5) history.shift();
      ctx.strokeStyle = '#67e8f9'; ctx.beginPath();
      for (const bin of history) {
        const x = width * (1 - (trace.time - bin.time) / 2.5);
        ctx.moveTo(x, 56 - Math.min(1, bin.max) * 34); ctx.lineTo(x, 56 - Math.max(-1, bin.min) * 34);
      }
      ctx.stroke(); ctx.font = '11px sans-serif';
      if (!pulmonary) for (const event of trace.events) {
        if (event.time > trace.time || event.time < trace.time - 2.5) continue;
        const x = width * (1 - (trace.time - event.time) / 2.5);
        ctx.fillStyle = event.label === 'S3' || event.label === 'S4' ? '#fbbf24' : '#cbd5e1';
        ctx.fillText(event.label, x, 20);
      }
      ctx.fillStyle = '#94a3b8'; ctx.fillText('2.5 seconds · output amplitude (clipped for display)', 12, 100);
    };
    draw();
    // 30 Hz canvas updates, no React rendering per animation frame.
    const timer = listening && !frozen ? window.setInterval(draw, 33) : undefined;
    return () => { if (timer !== undefined) window.clearInterval(timer); };
  }, [engineRef, listening, pulmonary, traceKey, frozen]);
  return <figure className="ausc-trace"><figcaption>{pulmonary ? 'Breath sound trace' : 'Phonocardiogram'} <span>{listening ? frozen ? 'Frozen snapshot' : 'Live output' : 'Stopped'}</span><button aria-pressed={frozen} onClick={() => setFrozen(value => !value)}>{frozen ? 'Animate trace' : 'Freeze trace'}</button></figcaption><canvas ref={canvasRef} role="img" aria-label={pulmonary ? 'Live breath sound output amplitude' : 'Live heart sound output amplitude with S1 and S2 timing markers'} /></figure>;
}
