import React,{useEffect,useRef,useState} from 'react';
import {ScrollView,View} from 'react-native';
import {OrbitPOCUS} from '@/native/OrbitPOCUS';
import {Slider} from '@/components/Slider';
import {useReducedMotion} from '@/theme/motion';
import type {PatientPathologyState,PatientVitals} from '@simulator/types';
import {Action,Card,Copy,ui} from './SimulatorUi';
export function NativePocus({vitals,pathology,scenarioId}:{vitals:PatientVitals;pathology:PatientPathologyState;scenarioId:string}){
 const snapshot=useRef({vitals:{...vitals},pathology:{...pathology},scenarioId});
 const [mode,setMode]=useState('cardiac_plax'),[gain,setGain]=useState(60),[depth,setDepth]=useState(16),[frozen,setFrozen]=useState(true),[mMode,setMMode]=useState(false);const reduced=useReducedMotion();
 if(!frozen)snapshot.current={vitals:{...vitals},pathology:{...pathology},scenarioId};
 const scan=snapshot.current;
 const cardiacFluid=scan.scenarioId==='tamponade'&&scan.vitals.cvp>12?.8:0;
 useEffect(()=>{if(reduced)setFrozen(true);},[reduced]);
 return <ScrollView contentContainerStyle={ui.page}><View style={ui.row}>{['cardiac_plax','subxiphoid','fast_morison','lung'].map(m=><Action key={m} label={m.replace(/_/g,' ')} selected={m===mode} onPress={()=>setMode(m)}/>)}</View>
  <Card title="Native ultrasound teaching view"><OrbitPOCUS mode={mode} gain={gain} depth={depth} heartRate={scan.vitals.heartRate} fluid={mode==='fast_morison'?scan.pathology.ascites:mode==='lung'?(scan.pathology.lungSoundType==='crackles'?.6:0):cardiacFluid} ischemia={scan.pathology.myocardialIschemia} air={scan.scenarioId==='tension_pneumo'&&scan.vitals.cvp>12?1:0} mMode={mMode} frozen={frozen} style={{height:330}}/><View style={ui.row}><Action label={frozen?'Play ultrasound':'Freeze ultrasound'} disabled={reduced} onPress={()=>{if(frozen)snapshot.current={vitals:{...vitals},pathology:{...pathology},scenarioId};setFrozen(!frozen);}}/><Action label="M-mode" selected={mMode} onPress={()=>setMMode(!mMode)}/></View><Slider label="Ultrasound gain" min={0} max={100} step={5} value={gain} format={n=>n+'%'} onChange={setGain}/><Slider label="Ultrasound depth" min={4} max={24} step={1} value={depth} format={n=>n+' cm'} onChange={setDepth}/><Copy muted>{frozen?'Frozen patient inputs. Play to refresh after changing a case or intervention. ':''}Native schematic teaching appearance; not an acquired ultrasound or patient-specific diagnostic image.</Copy></Card>
 </ScrollView>;
}
