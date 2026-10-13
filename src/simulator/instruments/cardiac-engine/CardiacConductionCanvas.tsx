import React, {useState} from 'react';
import {CardiacCycleEngine} from './CardiacCyclePhysics';
import {EcgHeartModel, type Activation} from '../EcgHeartModel';

export const CardiacConductionCanvas:React.FC<{engine:CardiacCycleEngine;currentPhi:number;isLight?:boolean}>=({engine,currentPhi})=>{
 const [lead,setLead]=useState(1);const data=engine.evaluate(currentPhi);
 const activation:Activation=data.phase===0?'atria':data.phase===1?'ventricles':data.phase<4?'plateau':data.phase===4?'recovery':'rest';
 const leads=[{name:'I',angle:0},{name:'II',angle:60},{name:'III',angle:120},{name:'aVR',angle:-150},{name:'aVL',angle:-30},{name:'aVF',angle:90}];
 const l=leads[lead];const vector=data.dipoleVector;const voltage=vector.magnitude*Math.cos((vector.angleDeg-l.angle)*Math.PI/180);
 return <section aria-label="Electrical activation model"><EcgHeartModel activation={activation}/><div className="ecg-phase-nav">{leads.map((l,i)=><button key={l.name} onClick={()=>setLead(i)} aria-pressed={i===lead}>{l.name}</button>)}</div><div className="ecg-result"><strong>Lead {l.name}: {voltage.toFixed(2)} mV</strong><span>{l.angle}° viewpoint · illustrative dipole projection</span></div><p>A lead records the projection of the net electrical vector onto its axis. In a quiet interval, this simplified model produces little or no net voltage. Select a lead, then scrub through the cycle.</p><p className="ecg-callout">The diagram shows the activation sequence and the numerical model shows a simplified net vector. It does not simulate every regional potential, conduction disorder or 12-lead morphology.</p><p className="ecg-small">For step-by-step AV delay and synchronized P–QRS–T teaching, use the main beat explorer above. This physiology model uses its own normalized mechanical-cycle clock.</p></section>;
};
