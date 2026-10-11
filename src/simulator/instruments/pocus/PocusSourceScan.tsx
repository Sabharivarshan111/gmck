import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PocusSettings } from './PocusEngineCore';

type Frame = { state: 'normal' | 'fluid'; plane: number; image: string };
type Manifest = {
  status: string;
  anatomy: { source: string };
  probe: { model: string; geometry: 'curvilinear'; centerFrequencyMHz: number };
  field: { depthCm: number; sectorAngleDegrees: number; radiusMeters: number };
  frames: Frame[];
};

interface Props {
  hasFluid: boolean;
  settings: PocusSettings;
  setSettings: React.Dispatch<React.SetStateAction<PocusSettings>>;
  caliperActive: boolean;
}

const MANIFEST_URL = '/models/pocus/fast/manifest.json';
const imageCache = new Map<string, HTMLImageElement>();

function loadImage(url: string) {
  const cached = imageCache.get(url);
  if (cached) return Promise.resolve(cached);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      imageCache.set(url, image);
      while (imageCache.size > 4) imageCache.delete(imageCache.keys().next().value as string);
      resolve(image);
    };
    image.onerror = () => reject(new Error('The reconstructed scan asset could not be decoded.'));
    image.src = url;
  });
}

export const PocusSourceScan: React.FC<Props> = ({ hasFluid, settings, setSettings, caliperActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    fetch(MANIFEST_URL, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(`Manifest request failed (${response.status}).`);
        const value = await response.json() as Manifest;
        if (value.probe?.geometry !== 'curvilinear' || !value.frames?.length) throw new Error('The source scan manifest is invalid.');
        setManifest(value);
      })
      .catch(reason => { if (reason?.name !== 'AbortError') setError(String(reason?.message || reason)); });
    return () => controller.abort();
  }, [reload]);

  const frame = manifest?.frames.find(item => item.state === (hasFluid ? 'fluid' : 'normal')) ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !manifest || !frame) return;
    let cancelled = false;
    const draw = async () => {
      try {
        const image = await loadImage(frame.image);
        if (cancelled) return;
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width));
        const height = Math.max(1, Math.round(rect.height));
        if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
        const context = canvas.getContext('2d');
        if (!context) return;
        context.fillStyle = '#020408'; context.fillRect(0, 0, width, height);
        const visibleFraction = Math.min(1, settings.depthCm / manifest.field.depthCm);
        const sourceHeight = Math.max(1, Math.round(image.height * visibleFraction));
        const gainDb = 20 * Math.log10(Math.max(0.05, settings.gain));
        context.filter = `brightness(${Math.pow(10, gainDb / 20)})`;
        context.drawImage(image, 0, 0, image.width, sourceHeight, 0, 0, width, height);
        context.filter = 'none';
        context.fillStyle = '#22d3ee'; context.font = '11px ui-monospace, monospace';
        context.fillText(`${settings.depthCm} cm`, width - 42, height - 12);
        const points = [settings.caliperPointA, settings.caliperPointB].filter(Boolean) as Array<{x:number;y:number}>;
        context.strokeStyle = '#38bdf8'; context.fillStyle = '#38bdf8'; context.lineWidth = 2;
        points.forEach(point => { context.beginPath(); context.arc(point.x, point.y, 5, 0, Math.PI * 2); context.stroke(); });
        if (points.length === 2) {
          context.beginPath(); context.moveTo(points[0].x, points[0].y); context.lineTo(points[1].x, points[1].y); context.stroke();
          const dx = points[1].x - points[0].x, dy = points[1].y - points[0].y;
          const mm = Math.hypot(dx / width * 260, dy / height * settings.depthCm * 10);
          context.fillText(`${mm.toFixed(1)} mm`, (points[0].x + points[1].x) / 2 + 8, (points[0].y + points[1].y) / 2 - 8);
        }
      } catch (reason) { if (!cancelled) setError(String((reason as Error)?.message || reason)); }
    };
    void draw();
    const observer = new ResizeObserver(() => void draw()); observer.observe(canvas);
    return () => { cancelled = true; observer?.disconnect(); };
  }, [frame, manifest, settings]);

  const onClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!caliperActive) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    setSettings(previous => previous.caliperPointA && !previous.caliperPointB
      ? { ...previous, caliperPointB: point }
      : { ...previous, caliperPointA: point, caliperPointB: null });
  }, [caliperActive, setSettings]);

  if (error) return <div role="alert" className="min-h-[300px] grid place-content-center gap-3 text-center text-sm text-rose-300">
    <span>{error}</span><button className="min-h-[44px] rounded-xl border border-rose-400 px-4" onClick={() => setReload(value => value + 1)}>Retry scan</button>
  </div>;
  if (!manifest || !frame) return <div className="min-h-[300px] grid place-content-center text-sm text-slate-400">Loading source-reconstructed scan…</div>;
  return <canvas ref={canvasRef} onClick={onClick} data-testid="pocus-source-scan" aria-label={`${hasFluid ? 'Fluid-positive' : 'Normal'} experimental source-reconstructed Morison's pouch scan`} className={`w-full rounded-xl h-[46dvh] min-h-[300px] max-h-[420px] md:h-[380px] select-none ${caliperActive ? 'cursor-crosshair' : ''}`} />;
};
