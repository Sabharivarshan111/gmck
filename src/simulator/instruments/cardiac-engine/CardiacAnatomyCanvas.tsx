import React from 'react';
import { CardiacCycleEngine } from './CardiacCyclePhysics';
import { EcgHeartModel } from '../EcgHeartModel';

export const CardiacAnatomyCanvas:React.FC<{engine:CardiacCycleEngine;currentPhi:number;isLight?:boolean}>=({engine,currentPhi})=>{
 const data=engine.evaluate(currentPhi);
 return <section aria-label="Heart and valve physiology"><EcgHeartModel mitralOpen={data.valves.mitralOpen} aorticOpen={data.valves.aorticOpen}/><div className="ecg-toggle"><span className="ecg-pill">Mitral: {data.valves.mitralOpen?'OPEN':'CLOSED'}</span><span className="ecg-pill">Aortic: {data.valves.aorticOpen?'OPEN':'CLOSED'}</span></div><p>{data.phaseDesc}</p><div className="ecg-two"><article><strong>Left ventricular pressure</strong><p>{Math.round(data.lvPressure)} mmHg</p></article><article><strong>Left ventricular volume</strong><p>{Math.round(data.lvVolume)} mL</p></article><article><strong>Aortic pressure</strong><p>{Math.round(data.aorticPressure)} mmHg</p></article><article><strong>Left atrial pressure</strong><p>{Math.round(data.laPressure)} mmHg</p></article></div><p className="ecg-callout">Both valves are closed during isovolumetric contraction and relaxation: pressure changes while ventricular volume stays constant. The cutaway shows left-sided valve states; right-sided valves are structural context.</p><p className="ecg-small">Illustrative values from the existing simplified cycle model. Leaflets indicate state; chamber contours are fixed for clarity and do not measure contraction or volume.</p></section>;
};
