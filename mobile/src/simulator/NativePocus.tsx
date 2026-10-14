import React,{useEffect,useRef,useState} from 'react';
import {AppState,Pressable,ScrollView,View} from 'react-native';
import Svg,{Circle,Line} from 'react-native-svg';
import {NativePocusReference,type PocusMode} from './NativePocusReference';
import {OrbitPOCUS} from '@/native/OrbitPOCUS';
import {Slider} from '@/components/Slider';
import {useReducedMotion} from '@/theme/motion';
import type {PatientPathologyState,PatientVitals} from '@simulator/types';
import {Action,Card,Copy,ui} from './SimulatorUi';
type Point={x:number;y:number};
const modes=['cardiac_plax','subxiphoid','fast_morison','lung'] as const;
export function NativePocus({vitals,pathology,scenarioId}:{vitals:PatientVitals;pathology:PatientPathologyState;scenarioId:string}){
 const snapshot=useRef({vitals:{...vitals},pathology:{...pathology},scenarioId});
 const [mode,setMode]=useState<PocusMode>('cardiac_plax'),[gain,setGain]=useState(100),[depth,setDepth]=useState(16),[frozen,setFrozen]=useState(true),[mMode,setMMode]=useState(false),[doppler,setDoppler]=useState(false),[caliper,setCaliper]=useState(false),[a,setA]=useState<Point|null>(null),[b,setB]=useState<Point|null>(null),[width,setWidth]=useState(320);
 const reduced=useReducedMotion(),height=330;
 if(!frozen)snapshot.current={vitals:{...vitals},pathology:{...pathology},scenarioId};
 const scan=snapshot.current,cardiac=mode==='cardiac_plax'||mode==='subxiphoid';
 const cardiacFluid=scan.scenarioId==='tamponade'&&scan.vitals.cvp>12?.8:0;
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>{if(state!=='active')setFrozen(true);});return()=>sub.remove();},[]);
 useEffect(()=>{if(reduced)setFrozen(true);},[reduced]);
 const clear=()=>{setA(null);setB(null);};
 const choose=(m:PocusMode)=>{setMode(m);setMMode(false);setDoppler(false);clear();};
 const inField=(p:Point)=>mode==='lung'?p.x>=28&&p.x<=332&&p.y>=32&&p.y<=285:(p.y>=22&&Math.hypot(p.x-180,p.y-22)<=288&&Math.abs(Math.atan2(p.x-180,p.y-22))<=40*Math.PI/180);
 const place=(point:Point)=>{if(!inField(point)||(mMode&&point.x>=228&&point.y>=145))return;if(!a||b){setA(point);setB(null);}else setB(point);};
 const distance=a&&b?Math.hypot(a.x-b.x,a.y-b.y)*depth/(mode==='lung'?253:288):null;
 return <ScrollView contentContainerStyle={ui.page}><View style={ui.row}>{modes.map(m=><Action key={m} label={m.replace(/_/g,' ')} selected={m===mode} onPress={()=>choose(m)}/>)}</View>
  <Card title="Native ultrasound teaching view">
   <View onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={{height,position:'relative'}}>
    <OrbitPOCUS mode={mode} gain={gain/100} depth={depth} heartRate={scan.vitals.heartRate} fluid={mode==='fast_morison'?scan.pathology.ascites:mode==='lung'?(scan.pathology.lungSoundType==='crackles'?.6:0):cardiacFluid} ischemia={scan.pathology.myocardialIschemia} air={scan.scenarioId==='tension_pneumo'&&scan.vitals.cvp>12?1:0} mMode={mMode} colorDoppler={doppler&&cardiac} frozen={frozen} style={{height:'100%',width:'100%'}}/>
    {caliper&&<Pressable accessibilityLabel="Place ultrasound caliper point" accessibilityHint="Tap two points in the scan, or use centre points and coordinate sliders below" onPress={e=>place({x:e.nativeEvent.locationX/width*360,y:e.nativeEvent.locationY/height*320})} style={{position:'absolute',inset:0}}/>}
    <Svg pointerEvents="none" width="100%" height="100%" viewBox="0 0 360 320" preserveAspectRatio="none" style={{position:'absolute',inset:0}}>{a&&b&&<Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#edcf6b" strokeWidth={1.2} strokeDasharray="4 3"/>}{[a,b].map((p,i)=>p&&<React.Fragment key={i}><Line x1={p.x-5} y1={p.y} x2={p.x+5} y2={p.y} stroke="#edcf6b"/><Line x1={p.x} y1={p.y-5} x2={p.x} y2={p.y+5} stroke="#edcf6b"/><Circle cx={p.x} cy={p.y} r={2} fill="#edcf6b"/></React.Fragment>)}</Svg>
   </View>
   <View style={ui.row}><Action label={frozen?'Play ultrasound':'Freeze ultrasound'} disabled={reduced} onPress={()=>{if(frozen)snapshot.current={vitals:{...vitals},pathology:{...pathology},scenarioId};setFrozen(!frozen);}}/><Action label="M-mode" selected={mMode} onPress={()=>{setMMode(!mMode);clear();}}/>{cardiac&&<Action label="Colour Doppler" selected={doppler} onPress={()=>setDoppler(!doppler)}/>}<Action label={caliper?'Clear ultrasound calipers':'Ultrasound calipers'} selected={caliper} onPress={()=>{clear();setCaliper(!caliper);}}/></View>
   <Slider label="Ultrasound gain" min={50} max={180} step={5} value={gain} format={n=>n+'%'} onChange={setGain}/><Slider label="Ultrasound depth" min={8} max={22} step={1} value={depth} format={n=>n+' cm'} onChange={n=>{setDepth(n);clear();}}/>
   {caliper&&<><Copy>{distance===null?(a?'Tap a second point in the scan.':'Tap a first point in the scan.'):`Simulated distance: ${distance.toFixed(1)} cm`}</Copy><Action label="Place centre calipers" onPress={()=>{setA({x:165,y:125});setB({x:185,y:160});}}/>{([['First',a,setA],['Second',b,setB]] as const).map(([label,p,set])=>p&&<View key={label}><Slider label={label+' caliper horizontal'} min={60} max={300} step={1} value={p.x} format={n=>Math.round(n/360*100)+'% across'} onChange={x=>{const point={...p,x};if(inField(point))set(point);}}/><Slider label={label+' caliper depth'} min={80} max={260} step={1} value={p.y} format={n=>Math.round(n/320*100)+'% depth'} onChange={y=>{const point={...p,y};if(inField(point))set(point);}}/></View>)}</>}
   <Copy muted>{frozen?'Frozen patient inputs. Play to refresh after changing a case or intervention. ':''}Native schematic appearance model; not acquired or patient-specific diagnostic ultrasound. Calipers use the virtual scan's depth scale. Colour and M-mode are qualitative teaching overlays.</Copy>
  </Card><NativePocusReference mode={mode}/>
 </ScrollView>;
}
