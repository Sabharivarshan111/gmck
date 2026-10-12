import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { PocusViewMode } from './PocusEngineCore';

const references = {
  cardiac_plax: {
    image: '/clinical-reference/pocus/plax.gif',
    title: 'Parasternal long-axis reference',
    note: 'Archived reference loop. It does not change with the current case.',
    author: 'Patrick J. Lynch & C. Carl Jaffe',
    page: 'https://commons.wikimedia.org/wiki/File:LeftParasternalLongAxis.gif',
    license: 'CC BY 2.5', licenseUrl: 'https://creativecommons.org/licenses/by/2.5/',
    animated: true,
  },
  subxiphoid: {
    image: '/clinical-reference/pocus/subcostal.gif',
    title: 'Subcostal cardiac reference',
    note: 'Archived reference loop. It does not change with the current case.',
    author: 'Patrick J. Lynch & C. Carl Jaffe',
    page: 'https://commons.wikimedia.org/wiki/File:Subcostal_view_of_heart.gif',
    license: 'CC BY 2.5', licenseUrl: 'https://creativecommons.org/licenses/by/2.5/',
    animated: true,
  },
  fast_morison: {
    image: '/clinical-reference/pocus/morison.jpg',
    title: 'Morison’s pouch with free fluid',
    note: 'Acquired ultrasound reference still, independent of the current case.',
    author: 'Drahreg01', page: 'https://commons.wikimedia.org/wiki/File:Morison003.jpg',
    license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    animated: false,
  },
  lung: {
    image: '/clinical-reference/pocus/lung.jpg',
    title: 'Lung B-mode and M-mode reference',
    note: 'Seashore pattern and B-lines in a patient with fibrosis. Reference still, independent of the current case.',
    author: 'Tinss', page: 'https://commons.wikimedia.org/wiki/File:Sea_shore_sign_on_a_lung_ultrasound.jpg',
    license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    animated: false,
  },
} satisfies Record<PocusViewMode, {image:string;title:string;note:string;author:string;page:string;license:string;licenseUrl:string;animated:boolean}>;

export function PocusReference({ view }: { view: PocusViewMode }) {
  const reference = references[view];
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const holdFrame = () => {
    const img = imageRef.current, canvas = canvasRef.current;
    if (!img || !canvas || !img.naturalWidth) return;
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    canvas.getContext('2d')?.drawImage(img, 0, 0);
  };
  useEffect(() => { if (paused && loaded) holdFrame(); }, [paused, loaded]);
  useEffect(() => { if (reducedMotion) setPaused(true); }, [reducedMotion]);
  return <figure className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-3">
    <figcaption>
      <h4 className="text-sm font-bold text-cyan-300">{reference.title}</h4>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{reference.note}</p>
    </figcaption>
    <div className="min-h-[220px] flex items-center justify-center rounded-xl bg-black overflow-hidden">
      {failed ? <p role="status" className="p-4 text-xs text-slate-300">Reference image could not load. Open its source below or use Case simulation.</p> : <>
        {!loaded && <p role="status" className="text-xs text-slate-400">Loading reference…</p>}
        <img ref={imageRef} src={reference.image} alt={reference.title} referrerPolicy="no-referrer"
          onLoad={() => { setLoaded(true); holdFrame(); }} onError={() => setFailed(true)}
          className={`w-full max-h-[420px] object-contain ${!loaded || (reference.animated && paused) ? 'hidden' : ''}`} />
        {reference.animated && <canvas ref={canvasRef} role="img" aria-label={`${reference.title} — held frame`}
          className={`w-full max-h-[420px] object-contain ${!loaded || !paused ? 'hidden' : ''}`} />}
      </>}
    </div>
    {reference.animated && loaded && !failed && <button onClick={() => setPaused(p => !p)} aria-pressed={!paused}
      className="min-h-[44px] rounded-xl bg-slate-800 px-4 text-xs font-semibold text-slate-100">
      {paused ? 'Play reference loop' : 'Hold reference frame'}
    </button>}
    <p className="text-[10px] leading-relaxed text-slate-400">
      {reference.author} · <a className="underline" href={reference.licenseUrl} target="_blank" rel="noopener noreferrer">{reference.license}</a>
      {' · '}<a className="underline" href={reference.page} target="_blank" rel="noopener noreferrer">Source & original</a> · Unmodified
    </p>
  </figure>;
}
