import React,{useEffect,useState} from 'react';
import {ScrollView,View} from 'react-native';
import {OrbitPOCUS} from '@/native/OrbitPOCUS';
import {Slider} from '@/components/Slider';
import {useReducedMotion} from '@/theme/motion';
import type {PatientPathologyState,PatientVitals} from '@simulator/types';
import {Action,Card,Copy,ui} from './SimulatorUi';
export function NativePocus({vitals,pathology}:{vitals:PatientVitals;pathology:PatientPathologyState}){
 const [mode,setMode]=useState('cardiac_plax'),[gain,setGain]=useState(60),[depth,setDepth]=useState(16),[frozen,setFrozen]=useState(true),[mMode,setMMode]=useState(false);const reduced=useReducedMotion();
 useEffect(()=>{if(reduced)setFrozen(true);},[reduced]);
 return <ScrollView contentContainerStyle={ui.page}><View style={ui.row}>{['cardiac_plax','subxiphoid','fast_morison','lung'].map(m=><Action key={m} label={m.replace(/_/g,' ')} selected={m===mode} onPress={()=>setMode(m)}/>)}</View>
  <Card title="Native ultrasound teaching view"><OrbitPOCUS mode={mode} gain={gain} depth={depth} heartRate={vitals.heartRate} fluid={mode==='fast_morison'?pathology.ascites:mode==='lung'&&pathology.lungSoundType==='crackles'?.6:Math.min(1,vitals.cvp/25)} ischemia={pathology.myocardialIschemia} air={pathology.lungSoundType==='silent'?1:0} mMode={mMode} frozen={frozen} style={{height:330}}/><View style={ui.row}><Action label={frozen?'Play ultrasound':'Freeze ultrasound'} disabled={reduced} onPress={()=>setFrozen(!frozen)}/><Action label="M-mode" selected={mMode} onPress={()=>setMMode(!mMode)}/></View><Slider label="Ultrasound gain" min={0} max={100} step={5} value={gain} onChange={setGain}/><Slider label="Ultrasound depth" min={4} max={24} step={1} value={depth} onChange={setDepth}/><Copy muted>Native schematic teaching appearance; not an acquired ultrasound or patient-specific diagnostic image.</Copy></Card>
 </ScrollView>;
}
