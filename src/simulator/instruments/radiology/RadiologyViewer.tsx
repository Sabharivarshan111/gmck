import { useEffect, useRef, useState } from 'react';
import { chestXrayCases, type ChestXrayCase } from './chestXrayCases';
import './RadiologyViewer.css';

type Plane = 'axial' | 'coronal' | 'sagittal';
interface Meta { dimensions: [number, number, number]; spacing: [number, number, number] }
const planeAxes: Record<Plane, [number, number, number]> = { axial: [0, 1, 2], coronal: [0, 2, 1], sagittal: [1, 2, 0] };
const categories = [...new Set(chestXrayCases.map(c => c.category))];
const normalLandmarks: Array<[string, number, number]> = [['Trachea',49,17],['Right lung',30,43],['Left lung',67,40],['Heart border',63,64],['Right hemidiaphragm',30,78]];

export function RadiologyViewer() {
 const [mode, setMode] = useState<'xray' | 'mri'>('xray');
 const [selected, setSelected] = useState(chestXrayCases[0]);
 const [query, setQuery] = useState(''), [category, setCategory] = useState('All');
 const [showNotes, setShowNotes] = useState(true);
 const [plane, setPlane] = useState<Plane>('axial');
 const [meta, setMeta] = useState<Meta | null>(null), [data, setData] = useState<Uint8Array | null>(null);
 const [error, setError] = useState(''), [retry, setRetry] = useState(0);
 const [pos, setPos] = useState([56,64,56]);
 const [contrast, setContrast] = useState(1), [brightness, setBrightness] = useState(1), [zoom, setZoom] = useState(1);
 const [labels, setLabels] = useState(true), [moving, setMoving] = useState(false), [measuring, setMeasuring] = useState(false);
 const [points, setPoints] = useState<Array<[number, number]>>([]), [pan, setPan] = useState([0,0]);
 const [imageSize, setImageSize] = useState<[number, number] | null>(null);
 const [imageLoaded, setImageLoaded] = useState(false);
 const canvas = useRef<HTMLCanvasElement>(null), image = useRef<HTMLImageElement>(null), stage = useRef<HTMLDivElement>(null);
 const drag = useRef<number[] | null>(null);
 const [u,v,slice] = planeAxes[plane];
 const filtered = chestXrayCases.filter(c => (category === 'All' || c.category === category) && `${c.title} ${c.category} ${c.tags}`.toLowerCase().includes(query.trim().toLowerCase()));
 const index = filtered.findIndex(c => c.id === selected.id);

 useEffect(() => {
  if (mode !== 'mri' || data) return;
  let gone = false;
  const ctrl = new AbortController();
  setError('');
  Promise.all([
   fetch('/clinical-reference/radiology/brain-t1.json', {signal: ctrl.signal}).then(r => { if (!r.ok) throw Error('MRI metadata unavailable'); return r.json() as Promise<Meta>; }),
   fetch('/clinical-reference/radiology/brain-t1.pack', {signal: ctrl.signal}).then(async r => {
    if (!r.ok || !r.body) throw Error('MRI volume unavailable');
    return new Uint8Array(await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
   }),
  ]).then(([m,d]) => {
   if (gone) return;
   if (d.length !== m.dimensions.reduce((a,b) => a*b,1)) throw Error('MRI volume is incomplete');
   setMeta(m); setData(d); setPos(m.dimensions.map(n => Math.floor(n/2)));
  }).catch(e => { if (!gone) setError(String(e.message)); });
  return () => { gone = true; ctrl.abort(); };
 }, [mode,data,retry]);

 useEffect(() => {
  if (mode !== 'mri' || !data || !meta || !canvas.current) return;
  const c = canvas.current, w = meta.dimensions[u], h = meta.dimensions[v], [nx,ny] = meta.dimensions;
  c.width = w; c.height = h;
  const ctx = c.getContext('2d'); if (!ctx) return;
  const frame = ctx.createImageData(w,h);
  for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
   const p = [...pos]; p[u] = w-1-x; p[v] = h-1-y;
   const grey = data[p[0]+nx*(p[1]+ny*p[2])], i = (x+y*w)*4;
   frame.data[i] = frame.data[i+1] = frame.data[i+2] = grey; frame.data[i+3] = 255;
  }
  ctx.putImageData(frame,0,0);
 }, [mode,data,meta,plane,pos,u,v]);

 const reset = () => { setZoom(1); setPan([0,0]); setContrast(1); setBrightness(1); setPoints([]); drag.current = null; };
 const choose = (c: ChestXrayCase) => { if(c.id===selected.id){reset();return;} setSelected(c); setImageLoaded(false); setImageSize(null); setError(''); reset(); };
 const switchMode = (next: 'xray' | 'mri') => { setMode(next); setError(''); setMoving(false); setMeasuring(false); reset(); };
 const inspect = (e: React.PointerEvent) => {
  const element = mode === 'mri' ? canvas.current : image.current;
  if (!element || (mode === 'xray' && !imageLoaded)) return;
  const b = element.getBoundingClientRect(), x = (e.clientX-b.left)/b.width, y = (e.clientY-b.top)/b.height;
  if (x<0 || x>1 || y<0 || y>1) return;
  if (measuring) setPoints(p => p.length===1 ? [p[0],[x,y]] : [[x,y]]);
  else if (meta && mode==='mri') setPos(p => { const n=[...p]; n[u]=Math.round((1-x)*(meta.dimensions[u]-1)); n[v]=Math.round((1-y)*(meta.dimensions[v]-1)); return n; });
 };
 const dimensions = mode==='mri' && meta ? [meta.dimensions[u]*meta.spacing[u],meta.dimensions[v]*meta.spacing[v]] : imageSize;
 const distance = points.length===2 && dimensions ? Math.hypot((points[1][0]-points[0][0])*dimensions[0],(points[1][1]-points[0][1])*dimensions[1]) : null;
 const aspect = dimensions ? dimensions[0]/dimensions[1] : 1;

 return <section className="radiology-viewer" aria-label="Radiology reference viewer">
  <div className="radio-tabs"><button aria-pressed={mode==='xray'} onClick={() => switchMode('xray')}>Chest X-ray</button><button aria-pressed={mode==='mri'} onClick={() => switchMode('mri')}>Brain MRI</button></div>
  <p className="radio-intro">Real acquired teaching images · independent of the simulated patient.</p>
  {mode==='xray' && <div className="radio-library" data-testid="radiology-case-library">
   <div className="radio-library-heading"><span className="radio-kicker">CHEST CASE LIBRARY</span><span>{chestXrayCases.length} real films</span></div>

   <label className="radio-case-select">Choose a reference<select aria-label="Chest X-ray case" value={index<0?'':selected.id} onChange={e => { const c=filtered.find(c => c.id===e.target.value); if(c) choose(c); }}><option value="" disabled>Select a matching case</option>{categories.map(group => <optgroup label={group} key={group}>{filtered.filter(c => c.category===group).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</optgroup>)}</select></label>
   <details className="radio-filter-details"><summary>Search & categories</summary><div className="radio-filters"><label>Find a case<input type="search" aria-label="Search chest X-ray cases" placeholder="Pneumothorax, pleural, TB…" value={query} onChange={e => setQuery(e.target.value)}/></label><label>Category<select aria-label="Chest X-ray category" value={category} onChange={e => setCategory(e.target.value)}><option>All</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label></div></details>
   <div className="radio-case-nav"><button disabled={index<=0} onClick={() => choose(filtered[index-1])}>← Previous</button><span role="status">{filtered.length===0?'No matches':index>=0?`${index+1} / ${filtered.length}`:`${filtered.length} matches`}</span><button disabled={index<0||index>=filtered.length-1} onClick={() => choose(filtered[index+1])}>Next →</button></div>
   {(query||category!=='All') && <button className="radio-clear" onClick={() => {setQuery('');setCategory('All');}}>Show all cases</button>}
   <div className="radio-selected"><span>{selected.category}</span><h3>{selected.title}</h3></div>
  </div>}
  {mode==='mri' && <div className="radio-tabs">{(['axial','coronal','sagittal'] as const).map(p => <button key={p} aria-pressed={plane===p} onClick={() => {setPlane(p);reset();}}>{p[0].toUpperCase()+p.slice(1)}</button>)}</div>}
  <div className="radio-toolbar"><button aria-pressed={moving} onClick={() => {setMoving(x => !x);setMeasuring(false);}}>Move</button><button aria-pressed={measuring} onClick={() => {setMoving(false);setMeasuring(x => !x);setPoints([]);}}>Measure</button>{(mode==='mri'||selected.id==='normal') && <button aria-pressed={labels} onClick={() => setLabels(x => !x)}>{mode==='mri'?'Crosshair':'Labels'}</button>}<button onClick={reset}>Reset</button><button onClick={() => {void stage.current?.requestFullscreen().catch(() => setError('Fullscreen unavailable; use zoom below.'));}}>Full screen</button></div>
  <div ref={stage} className="radio-stage" data-testid="radiology-stage" onPointerDown={e => {if(moving){e.currentTarget.setPointerCapture(e.pointerId);drag.current=[e.clientX,e.clientY,...pan];}else inspect(e);}} onPointerMove={e => {if(drag.current&&e.currentTarget.hasPointerCapture(e.pointerId)){const [x,y,px,py]=drag.current;setPan([px+e.clientX-x,py+e.clientY-y]);}}} onPointerUp={() => {drag.current=null;}} onPointerCancel={() => {drag.current=null;}}>
   <button className="radio-exit" aria-label="Exit full screen" onClick={() => void document.exitFullscreen()}>Close full screen</button>
   <div className="radio-frame" style={{transform:`translate(${pan[0]}px,${pan[1]}px) scale(${zoom})`,width:`min(100%, calc(var(--radio-height) * ${aspect}))`,aspectRatio:aspect}}>
    {mode==='xray' ? <img key={`${selected.id}-${retry}`} ref={image} src={selected.image} alt={selected.alt} draggable={false} onLoad={e => {setImageSize([e.currentTarget.naturalWidth,e.currentTarget.naturalHeight]);setImageLoaded(true);setError('');}} onError={() => {setImageLoaded(false);setError('This chest reference could not be loaded. Try again or choose another case.');}} style={{filter:`contrast(${contrast}) brightness(${brightness})`}}/> : data&&meta ? <canvas ref={canvas} aria-label={`${plane} MRI slice`} style={{filter:`contrast(${contrast}) brightness(${brightness})`}}/> : <p role="status">{error||'Loading MRI volume…'}</p>}
    {mode==='mri'&&meta&&data&&labels && <><span className="radio-cross-x" style={{left:`${(1-pos[u]/(meta.dimensions[u]-1))*100}%`}}/><span className="radio-cross-y" style={{top:`${(1-pos[v]/(meta.dimensions[v]-1))*100}%`}}/></>}
    {mode==='xray'&&imageLoaded&&selected.id==='normal'&&labels && normalLandmarks.map(([label,x,y]) => <span key={label} className="radio-label" style={{left:`${x}%`,top:`${y}%`}}>{label}</span>)}
    {points.length>0 && <svg className="radio-caliper" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{points.map(([x,y],i) => <circle key={i} cx={x*100} cy={y*100} r="1"/>)}{points.length===2 && <line x1={points[0][0]*100} y1={points[0][1]*100} x2={points[1][0]*100} y2={points[1][1]*100}/>}</svg>}
   </div>
   <span className="radio-orientation radio-top">{mode==='xray'?selected.projection:plane==='axial'?'A':'S'}</span>
   {(mode==='mri'||selected.orientation) && <><span className="radio-orientation radio-left">{mode==='mri'&&plane==='sagittal'?'A':'R'}</span><span className="radio-orientation radio-right">{mode==='mri'&&plane==='sagittal'?'P':'L'}</span></>}
  </div>
  {error && <p role="alert">{error}<button onClick={() => {setError('');setRetry(x => x+1);}}>Retry</button></p>}
  {mode==='mri'&&meta && <label className="radio-range">Slice <output data-testid="radiology-slice">{pos[slice]+1} / {meta.dimensions[slice]}</output><input aria-label="MRI slice" type="range" min="0" max={meta.dimensions[slice]-1} value={pos[slice]} onChange={e => {setPos(p => {const n=[...p];n[slice]=Number(e.target.value);return n;});setPoints([]);}}/></label>}
  <div className="radio-ranges">{[{label:'Contrast',value:contrast,update:setContrast,max:2},{label:'Brightness',value:brightness,update:setBrightness,max:1.8},{label:'Zoom',value:zoom,update:setZoom,max:3}].map(r => <label key={r.label}>{r.label} <output>{r.value.toFixed(2)}×</output><input aria-label={`Radiology ${r.label}`} type="range" min={r.label==='Zoom'?1:.5} max={r.max} step=".05" value={r.value} onChange={e => r.update(Number(e.target.value))}/></label>)}</div>
  {measuring && <p data-testid="radiology-measurement">{distance===null?'Tap two points on the image.':`${distance.toFixed(1)} ${mode==='mri'?'mm · resampled voxel spacing':'pixels · no X-ray physical calibration'}`}</p>}
  {mode==='xray' && <section className="radio-teaching" aria-label="Chest X-ray teaching notes"><div className="radio-teaching-heading"><h3>What to look for</h3><button aria-expanded={showNotes} onClick={() => setShowNotes(x => !x)}>{showNotes?'Hide notes':'Reveal notes'}</button></div>{showNotes && <><p className="radio-context">{selected.context}</p><ul>{selected.findings.map(f => <li key={f}>{f}</li>)}</ul><div className="radio-takeaway"><strong>Remember</strong><p>{selected.pitfall}</p></div><details><summary>Compare with similar patterns</summary><p>{selected.differential}</p></details></>}</section>}
  <details><summary>Image credits and limitations</summary>{mode==='xray' ? <><p>{selected.author} · {selected.license}. ORBIT copy resized and JPEG encoded; source annotations retained. {selected.id==='normal'?'Landmark labels are approximate. ':''}Image copies remain under their listed licences. No DICOM physical calibration. Teaching references do not establish a diagnosis in the simulated patient.</p><p><a href={selected.source} target="_blank" rel="noreferrer">Original image and source caption</a> · <a href={selected.licenseUrl} target="_blank" rel="noreferrer">Image licence</a></p><p>Pattern reading: <a href="https://radiologyassistant.nl/chest/chest-x-ray/lung-disease" target="_blank" rel="noreferrer">Radiology Assistant</a> · <a href="https://www.brit-thoracic.org.uk/clinical-resources/guidelines/pleural-disease/" target="_blank" rel="noreferrer">BTS pleural guidance</a></p></> : <p>T1 research MRI from OpenNeuro ds000114, CC0, by Gorgolewski and colleagues. Axial, coronal and sagittal cuts share the same RAS-oriented, resampled volume. This is a brain reference, not a lumbar study or a diagnostic viewer.<br/><a href="https://doi.org/10.18112/openneuro.ds000114.v1.0.2" target="_blank" rel="noreferrer">Dataset and credits</a></p>}</details>
 </section>;
}
