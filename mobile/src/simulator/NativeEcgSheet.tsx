import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ScrollView,View} from 'react-native';
import {Sheet} from '@/components/Sheet';
import Svg,{Path,Rect,Text as SvgText} from 'react-native-svg';
import {Action,Card,Copy,ui} from './SimulatorUi';
import {ECG_SEGMENTS,ECG_WAVES} from './lessonCatalog';
import {drawEcg} from './ecgDrawing';
import {VectorContext} from './vectorContext';
const groups=['I · II · III','aVR · aVL · aVF','V1 · V2 · V3','V4 · V5 · V6','All 12'];
/** Static captured teaching ECG, rendered by native SVG without web content. */
export function NativeEcgSheet({rhythm,heartRate}:{rhythm:string;heartRate:number}){
 const latest=useRef({rhythm,heartRate});latest.current={rhythm,heartRate};
 const [capture,setCapture]=useState(latest.current),[group,setGroup]=useState(0),[segment,setSegment]=useState('all'),[enlarged,setEnlarged]=useState(false),[width,setWidth]=useState(320),[segmentsOpen,setSegmentsOpen]=useState(false);
 useEffect(()=>{setCapture(latest.current);},[rhythm]);
 const marks=useMemo(()=>{const ctx=new VectorContext();drawEcg(ctx,capture.rhythm,capture.heartRate,segment,group);return ctx.marks;},[capture,segment,group]);
 const meta=ECG_SEGMENTS.find(s=>s.id===segment),sourceWidth=group===4?840:420,displayWidth=enlarged?840:width;
 return <ScrollView contentContainerStyle={ui.page}>
  <Card><Copy>Captured {capture.rhythm.replace(/_/g,' ')} · {Math.round(capture.heartRate)} bpm · synthetic teaching ECG{capture.rhythm!==rhythm?' · case changed':''}</Copy><View style={[ui.row,{alignItems:'center'}]}><Action label="Capture current ECG" title="Capture" compact onPress={()=>setCapture({...latest.current})}/><Copy muted>25 mm/s · 10 mm/mV</Copy></View></Card>
  <ScrollView horizontal style={{flexGrow:0,maxHeight:56}} contentContainerStyle={ui.row} showsHorizontalScrollIndicator={false}>{groups.map((label,i)=><Action key={label} label={label} compact selected={group===i} onPress={()=>setGroup(i)}/>)}</ScrollView>
  <View style={ui.row}><Action label="Wave segments" title={meta?.name||'Segments'} compact onPress={()=>setSegmentsOpen(true)}/><Action label={enlarged?'Fit ECG to screen':'Enlarge ECG'} title={enlarged?'Fit':'Enlarge'} compact onPress={()=>setEnlarged(!enlarged)}/></View>
  <View onLayout={event=>setWidth(event.nativeEvent.layout.width)} accessibilityLabel="Calibrated synthetic ECG trace">
   <ScrollView horizontal><Svg width={displayWidth} height={displayWidth*480/sourceWidth} viewBox={`0 0 ${sourceWidth} 480`}>
    {marks.map((m,i)=>m.kind==='path'?<Path key={i} d={m.d} stroke={m.color} strokeWidth={m.width} strokeDasharray={m.dash.length?m.dash:undefined} fill="none"/>:m.kind==='rect'?<Rect key={i} x={m.x} y={m.y} width={m.width} height={m.height} fill={m.color}/>:<SvgText key={i} x={m.x} y={m.y} fill={m.color} fontSize={parseFloat(m.font.replace('bold ',''))} fontWeight={m.font.includes('bold')?'bold':'normal'} fontFamily="monospace">{m.text}</SvgText>)}
   </Svg></ScrollView>
  </View>
  <Copy muted>The display scales to fit your screen. Use grid squares for measurements and check printed calibration.</Copy>
  {meta&&<><Card title={meta.name}><Copy>{meta.normalDurationMs}</Copy><Copy>{meta.id==='pr'?ECG_WAVES.find(w=>w.name==='PR')?.text:meta.physioOrigin}</Copy></Card><Card title="Lead direction">{meta.id==='pr'?<Copy>Follow the P wave and the conduction interval on the highlighted strip; the flat PR segment is only part of the interval.</Copy>:<><Copy>{meta.vectorExplanation}</Copy><Copy>{meta.leadsAnalysis}</Copy></>}</Card><Card title="Clinical teaching notes"><Copy>{meta.clinicalPearls}</Copy></Card></>}
  <Sheet visible={segmentsOpen} onClose={()=>setSegmentsOpen(false)} title="Wave segments"><Action label="All wave segments" selected={segment==='all'} onPress={()=>{setSegment('all');setSegmentsOpen(false);}}/>{ECG_SEGMENTS.map(s=><Action key={s.id} label={s.name} selected={segment===s.id} onPress={()=>{setSegment(s.id);setSegmentsOpen(false);}}/>)}</Sheet>
 </ScrollView>;
}
