import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ScrollView,View} from 'react-native';
import Svg,{Path,Rect,Text as SvgText} from 'react-native-svg';
import {Action,Card,Copy,ui} from './SimulatorUi';
import {ECG_SEGMENTS,ECG_WAVES} from './lessonCatalog';
import {drawEcg} from './ecgDrawing';
import {VectorContext} from './vectorContext';
const groups=['I · II · III','aVR · aVL · aVF','V1 · V2 · V3','V4 · V5 · V6','All 12'];
/** Static captured teaching ECG, rendered by native SVG without web content. */
export function NativeEcgSheet({rhythm,heartRate}:{rhythm:string;heartRate:number}){
 const latest=useRef({rhythm,heartRate});latest.current={rhythm,heartRate};
 const [capture,setCapture]=useState(latest.current),[group,setGroup]=useState(0),[segment,setSegment]=useState('all'),[enlarged,setEnlarged]=useState(false),[width,setWidth]=useState(320);
 useEffect(()=>{setCapture(latest.current);},[rhythm]);
 const marks=useMemo(()=>{const ctx=new VectorContext();drawEcg(ctx,capture.rhythm,capture.heartRate,segment,group);return ctx.marks;},[capture,segment,group]);
 const meta=ECG_SEGMENTS.find(s=>s.id===segment),sourceWidth=group===4?840:420,displayWidth=enlarged?840:width;
 return <ScrollView contentContainerStyle={ui.page}>
  <Card title="12-lead ECG"><Copy>Static synthetic teaching strip · captured {capture.rhythm.replace(/_/g,' ')} · {Math.round(capture.heartRate)} bpm{capture.rhythm!==rhythm?' · patient case changed':''}</Copy><Copy muted>Source grid: 25 mm/s · 10 mm/mV. The display scales to fit your screen; use grid squares for measurements.</Copy><Action label="Capture current ECG" onPress={()=>setCapture({...latest.current})}/></Card>
  <View style={ui.row}>{groups.map((label,i)=><Action key={label} label={label} selected={group===i} onPress={()=>setGroup(i)}/>)}</View>
  <View style={ui.row}><Action label="All wave segments" selected={segment==='all'} onPress={()=>setSegment('all')}/>{ECG_SEGMENTS.map(s=><Action key={s.id} label={s.name} selected={segment===s.id} onPress={()=>setSegment(s.id)}/>)}</View>
  <Action label={enlarged?'Fit ECG to screen':'Enlarge ECG'} onPress={()=>setEnlarged(!enlarged)}/>
  <View onLayout={event=>setWidth(event.nativeEvent.layout.width)} accessibilityLabel="Calibrated synthetic ECG trace">
   <ScrollView horizontal><Svg width={displayWidth} height={displayWidth*480/sourceWidth} viewBox={`0 0 ${sourceWidth} 480`}>
    {marks.map((m,i)=>m.kind==='path'?<Path key={i} d={m.d} stroke={m.color} strokeWidth={m.width} strokeDasharray={m.dash.length?m.dash:undefined} fill="none"/>:m.kind==='rect'?<Rect key={i} x={m.x} y={m.y} width={m.width} height={m.height} fill={m.color}/>:<SvgText key={i} x={m.x} y={m.y} fill={m.color} fontSize={parseFloat(m.font.replace('bold ',''))} fontWeight={m.font.includes('bold')?'bold':'normal'} fontFamily="monospace">{m.text}</SvgText>)}
   </Svg></ScrollView>
  </View>
  {meta&&<><Card title={meta.name}><Copy>{meta.normalDurationMs}</Copy><Copy>{meta.id==='pr'?ECG_WAVES.find(w=>w.name==='PR')?.text:meta.physioOrigin}</Copy></Card><Card title="Lead direction">{meta.id==='pr'?<Copy>Follow the P wave and the conduction interval on the highlighted strip; the flat PR segment is only part of the interval.</Copy>:<><Copy>{meta.vectorExplanation}</Copy><Copy>{meta.leadsAnalysis}</Copy></>}</Card><Card title="Clinical teaching notes"><Copy>{meta.clinicalPearls}</Copy></Card></>}
 </ScrollView>;
}
