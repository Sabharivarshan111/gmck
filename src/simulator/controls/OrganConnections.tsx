import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { ORGAN_CONNECTIONS, type OrganConnection } from '../data/organConnections';
import './OrganConnections.css';

interface Props { organKey:string; organName:string; mode:'supply'|'relations'; onInspect:(id:string,owner:string)=>void; light?:boolean }
export function OrganConnections({organKey,organName,mode,onInspect,light}:Props) {
  const [diagram,setDiagram]=useState<OrganConnection|null>(null);
  const diagramRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(diagram)diagramRef.current?.scrollIntoView({block:'nearest',behavior:'auto'});},[diagram]);
  const links=(ORGAN_CONNECTIONS[organKey]||[]).filter(c=>mode==='supply'?c.kind!=='relation':c.kind==='relation');
  const groups=[...new Set(links.map(c=>c.direction))];
  const title=mode==='supply'?'Vessels & blood flow':'Anatomical neighbours';
  const colour=diagram?.kind==='arterial'?'#ee8d91':diagram?.kind==='venous'?'#87b8ef':'#aac5dc';
  return <section className={`organ-connections ${light?'oc-light':''}`} data-testid={`organ-connections-${organKey}-${mode}`}>
    <header><small>CONNECTED ANATOMY</small><h3>{title} <span>{links.length}</span></h3><p>Inspect vessels and nearby structures. Red marks arteries; blue marks veins.</p></header>
    {groups.map(group=><div className="oc-group" key={group}><h4>{group}</h4><div className="oc-grid">{links.filter(c=>c.direction===group).map(c=><div key={c.id}>
      <button type="button" className={`oc-card oc-${c.kind}`} data-testid={`inspect-${c.id}`} aria-label={`Show ${c.label} ${c.targetId?'in 3D':'diagram'}`} onClick={()=>c.targetId?onInspect(c.id,c.owner):setDiagram(c)}>
        <i aria-hidden="true"/><span><strong>{c.label}</strong><small>{c.targetId?'3D anatomy':'Teaching diagram'}</small></span><ArrowUpRight size={17} aria-hidden="true"/>
      </button>
      {mode==='supply'&&<details className="oc-note"><summary>Course & drainage</summary><p>{c.note}</p></details>}
    </div>)}</div></div>)}
    {diagram&&<div ref={diagramRef} className="oc-diagram" role="region" aria-label={`${diagram.label} teaching diagram`}>
      <header><strong>{diagram.label}</strong><button type="button" aria-label="Close teaching diagram" onClick={()=>setDiagram(null)}><X size={18}/></button></header>
      <small>Teaching schematic · not a registered 3D mesh</small>
      <svg viewBox="0 0 340 145" role="img" aria-label={`${diagram.kind==='arterial'?diagram.label+' supplies '+organName:diagram.kind==='venous'?organName+' drains towards '+diagram.label:diagram.direction+' relation: '+diagram.label}`}>
        <defs><marker id={`oc-tip-${diagram.id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1 L7 4 L1 7" fill="none" stroke={colour} strokeWidth="1.5"/></marker></defs>
        <rect x="10" y="48" width="128" height="48" rx="12"/><rect x="202" y="48" width="128" height="48" rx="12"/>
        <text x="74" y="77" textAnchor="middle">{organName.slice(0,19)}</text><text x="266" y="77" textAnchor="middle">{diagram.label.slice(0,19)}</text>
        <path d={diagram.kind==='arterial'?'M202 72 H140':'M138 72 H200'} fill="none" stroke={colour} strokeWidth="1.6" markerEnd={`url(#oc-tip-${diagram.id})`}/>
        <text x="170" y="124" textAnchor="middle">{diagram.kind==='relation'?`${diagram.direction} relation`:diagram.kind==='arterial'?'Arterial supply':'Venous drainage'}</text>
      </svg><p>{diagram.note}</p>
    </div>}
  </section>;
}
