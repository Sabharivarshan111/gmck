/**
 * React Native port of the Vercel captured ECG teaching canvas.
 * Calibrated 4x3 12-lead matrix, rhythm strip, teaching segments, tour,
 * lead groups and same source descriptions. Renders with native SVG,
 * supports offline use and makes no WebView/network calls.
 *
 * The web magnified cutout and ECG heartbeat 3D tutorial still need porting.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { NATIVE_ECG_LEADS, NATIVE_ECG_SEGMENTS, type NativeEcgSegmentId } from '@/lib/nativeEcgReference';
import { leadById, nativeEcgTracePath, type NativeEcgConfig } from '@/lib/nativeEcgWaveform';
import { PhysiologyKernel, SCENARIOS } from '@simulator/engine/PhysiologyKernel';

interface Props { scenarioId: string; onBack: () => void }
const PANEL = '#0f172a';
const BORDER = '#334155';
const INK = '#f1f5f9';
const PINK = '#fff5f5';
const W_LARGE = 840;
const W_SMALL = 420;
const H = 480;
const BEAT_ORDER: Exclude<NativeEcgSegmentId, 'all'>[] = ['p','pr','qrs','st','t','qt'];
const GROUPS = ['I · II · III', 'aVR · aVL · aVF', 'V1 · V2 · V3', 'V4 · V5 · V6', 'All 12'];

function EcgPaper({ cfg, group, segment, width }: {
  cfg: NativeEcgConfig; group: number; segment: NativeEcgSegmentId; width: number;
}) {
  const plotWidth = group === 4 ? W_LARGE : W_SMALL;
  const rowH = (H - 130) / 3;
  const seg = NATIVE_ECG_SEGMENTS.find(s => s.id === segment);
  const plottedLeads = (group === 4 ? NATIVE_ECG_LEADS : NATIVE_ECG_LEADS.slice(group * 3, group * 3 + 3));
  const paths = useMemo(() => plottedLeads.map(lead => {
    const index = NATIVE_ECG_LEADS.findIndex(l => l.id === lead.id);
    const col = group === 4 ? Math.floor(index / 3) : 0;
    const row = index % 3;
    const cellWidth = group === 4 ? plotWidth / 4 : plotWidth;
    const xStart = col * cellWidth;
    const yCenter = row * rowH + rowH / 2 + 10;
    return { lead, row, col, xStart, yCenter, cellWidth, trace: nativeEcgTracePath(lead,cfg,xStart,yCenter,cellWidth) };
  }), [cfg, group, plotWidth, plottedLeads, rowH]);

  const bandRects: {x:number;y:number;w:number;h:number;key:string}[] = [];
  if (seg) {
    const rr = 100 * (60 / Math.max(35,Math.min(180,cfg.heartRate)));
    for (const p of paths) {
      const start = p.xStart + 26;
      const traceWidth = p.cellWidth - 24;
      for (let b=0;b<Math.ceil(traceWidth / rr)+1;b++) {
        const x1=Math.max(start,start+b*rr+seg.phaseStart*rr);
        const x2=Math.min(start+traceWidth,start+b*rr+seg.phaseEnd*rr);
        if (x2>x1) bandRects.push({ x:x1,y:p.yCenter-rowH/2+4,w:x2-x1,h:rowH-8,key:p.lead.id+'-'+b });
      }
    }
  }
  const gridX=Array.from({length:Math.floor(plotWidth/4)+1},(_,i)=>i*4);
  const gridY=Array.from({length:Math.floor(H/4)+1},(_,i)=>i*4);
  const rhythmStrip = nativeEcgTracePath(leadById('II'),cfg,0,H-48,plotWidth);
  const pixelWidth = Math.round(width);
  return <View testID="native-ecg-paper" style={{ width: pixelWidth, backgroundColor: PINK, borderWidth:1, borderColor:'#fca5a5', borderRadius: 9, overflow:'hidden' }}>
    <Svg width={pixelWidth} height={Math.round(H*(pixelWidth/plotWidth))} viewBox={`0 0 ${plotWidth} ${H}`}>
      <Rect x={0} y={0} width={plotWidth} height={H} fill={PINK} />
      {gridX.map((x,i)=><Line key={'gx'+i} x1={x} x2={x} y1={0} y2={H} stroke={i%5===0?'#dc2626':'#ef4444'} strokeOpacity={i%5===0?.35:.14} strokeWidth={i%5===0?1:.5}/>)}
      {gridY.map((y,i)=><Line key={'gy'+i} x1={0} x2={plotWidth} y1={y} y2={y} stroke={i%5===0?'#dc2626':'#ef4444'} strokeOpacity={i%5===0?.35:.14} strokeWidth={i%5===0?1:.5}/>)}
      {bandRects.map(b=><Rect key={b.key} x={b.x} y={b.y} width={b.w} height={b.h} fill={seg?.color??'#dc2626'} fillOpacity={.18} />)}
      {group===4 && [1,2,3].map(i=><Line key={'column'+i} x1={i*plotWidth/4} x2={i*plotWidth/4} y1={0} y2={H-120} stroke="#b91c1c" strokeOpacity={.35}/>)}
      {paths.map(p => <React.Fragment key={p.lead.id}>
        <SvgText x={p.xStart+8} y={p.yCenter-rowH/2+12} fontSize={10} fontWeight="700" fill="#991b1b">{p.lead.name}</SvgText>
        <Path d={`M ${p.xStart+8} ${p.yCenter} h 4 v -40 h 8 v 40 h 4`} fill="none" stroke="#7f1d1d" strokeWidth={1.5}/>
        <Path d={p.trace} fill="none" stroke="#991b1b" strokeWidth={1.4} strokeLinejoin="round"/>
      </React.Fragment>)}
      <Line x1={0} x2={plotWidth} y1={H-120} y2={H-120} stroke="#b91c1c" strokeWidth={1.2} strokeOpacity={.5}/>
      <SvgText x={8} y={H-48-62+12} fill="#991b1b" fontSize={10} fontWeight="700">II · rhythm strip</SvgText>
      <Path d={`M 8 ${H-48} h 4 v -40 h 8 v 40 h 4`} fill="none" stroke="#7f1d1d" strokeWidth={1.5}/>
      <Path d={rhythmStrip} fill="none" stroke="#991b1b" strokeWidth={1.4}/>
      <SvgText x={12} y={H-6} fontSize={9.5} fill="#7f1d1d">SYNTHETIC · 25 mm/s · 10 mm/mV</SvgText>
    </Svg>
  </View>;
}

const button = { borderWidth:1, borderColor:BORDER, backgroundColor:PANEL, borderRadius:12, minHeight:44, justifyContent:'center' as const, paddingHorizontal:10 };
export default function NativeEcgTwelveLead({ scenarioId, onBack }: Props) {
  const insets=useSafeAreaInsets();
  const {width}=useWindowDimensions();
  const [capture,setCapture]=useState<NativeEcgConfig>(()=> {
    const k=new PhysiologyKernel(scenarioId);
    return {rhythm:k.pathology.ecgRhythm,heartRate:k.vitals.heartRate};
  });
  const [group,setGroup]=useState(0);
  const [zoomed,setZoomed]=useState(false);
  const [segment,setSegment]=useState<NativeEcgSegmentId>('all');
  const [tour,setTour]=useState(false);
  const scenario=SCENARIOS.find(s=>s.id===scenarioId)??SCENARIOS[0];
  const meta=NATIVE_ECG_SEGMENTS.find(s=>s.id===segment);
  const refresh=()=> {
    const k=new PhysiologyKernel(scenarioId);
    setCapture({rhythm:k.pathology.ecgRhythm,heartRate:k.vitals.heartRate});
  };
  useEffect(()=>{
    if(!tour)return;
    const i=setInterval(()=>setSegment(previous=>{
      const index=BEAT_ORDER.indexOf(previous==='all'?'p':previous);
      return BEAT_ORDER[(index+1)%BEAT_ORDER.length];
    }),4200);
    return()=>clearInterval(i);
  },[tour]);
  const canvasWidth=zoomed ? (group===4?W_LARGE:W_SMALL) : width-30;
  const chooseSegment=(id:NativeEcgSegmentId)=>{setTour(false);setSegment(id);};
  return <View testID="native-ecg12-studio" style={{flex:1,backgroundColor:'#020617',paddingTop:insets.top}}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to clinical studio" testID="native-ecg-back" onPress={onBack} style={[button,{paddingHorizontal:12}]}>
        <ArrowLeft size={19} color={INK}/>
      </Pressable>
      <View style={{flex:1}}>
        <Text style={{color:INK,fontSize:16,fontWeight:'800'}}>12-lead ECG</Text>
        <Text style={{color:'#94a3b8',fontSize:11}} numberOfLines={1}>{scenario.title}</Text>
      </View>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal:15,paddingBottom:insets.bottom+30,paddingTop:12,gap:12}}>
      <View style={[styles.panel,{gap:8}]}>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <View style={{width:10,height:10,borderRadius:5,backgroundColor:'#dc2626'}} />
          <Text style={{flex:1,color:INK,fontSize:12,fontWeight:'800',letterSpacing:1}}>WAVE GUIDE</Text>
          <Pressable testID="native-ecg-tour" accessibilityRole="button" onPress={()=>{ if(!tour)setSegment('p');setTour(x=>!x);}} style={button}>
            <View style={{flexDirection:'row',alignItems:'center',gap:5}}>
              {tour?<Pause color={INK} size={14}/>:<Play color={INK} size={14}/>}
              <Text style={{color:INK,fontSize:12,fontWeight:'700'}}>{tour?'Pause':'Tour'}</Text>
            </View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Reset to full trace" onPress={()=>{setSegment('all');setTour(false);}} style={button}><RotateCcw color="#cbd5e1" size={16}/></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:6}}>
          {(['all',...BEAT_ORDER] as NativeEcgSegmentId[]).map(id=>{
            const m=NATIVE_ECG_SEGMENTS.find(s=>s.id===id);
            return <Pressable key={id} testID={`native-ecg-segment-${id}`} accessibilityRole="button" accessibilityState={{selected:id===segment}} onPress={()=>chooseSegment(id)}
              style={[button,{minWidth:44,alignItems:'center',borderColor:id===segment?(m?.color??INK):BORDER,backgroundColor:id===segment?(m?.color??INK):PANEL}]}>
              <Text style={{color:id===segment?'#020617':INK,fontSize:11,fontWeight:'800'}}>{m?.shortName??'All'}</Text>
            </Pressable>;
          })}
        </ScrollView>
      </View>

      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
        <Text style={styles.small}>Static teaching ECG · choose a lead group</Text>
        <Text style={[styles.small,{color:'#fca5a5'}]}>25 mm/s · 10 mm/mV</Text>
      </View>

      <View style={styles.groups}>
        {[...GROUPS,zoomed?'Fit to screen':'Enlarge'].map((g,i)=><Pressable key={i} testID={`native-ecg-group-${i}`} accessibilityRole="button"
          accessibilityState={{selected:i<5&&group===i||i===5&&zoomed}}
          style={[styles.groupButton,i<5&&group===i?{backgroundColor:'#e879f9',borderColor:'#e879f9'}:{}]}
          onPress={()=>i<5?setGroup(i):setZoomed(v=>!v)}>
          <Text style={{textAlign:'center',color:i<5&&group===i?'#020617':INK,fontSize:11}}>{g}</Text>
        </Pressable>)}
      </View>
      <View style={{flexDirection:'row',alignItems:'center',gap:9}}>
        <Text style={[styles.small,{flex:1}]} numberOfLines={2}>Captured · {capture.rhythm.toUpperCase()} · {Math.round(capture.heartRate)} bpm</Text>
        <Pressable testID="native-ecg-capture" accessibilityRole="button" onPress={refresh} style={button}>
          <Text style={{color:INK,fontSize:11}}>Capture current ECG</Text>
        </Pressable>
      </View>
      <ScrollView horizontal={zoomed} showsHorizontalScrollIndicator={false} style={{flexGrow:0}}>
        <EcgPaper cfg={capture} group={group} segment={segment} width={canvasWidth} />
      </ScrollView>
      {meta&&<View testID="native-ecg-teaching-segment" style={[styles.panel,{borderColor:meta.color,gap:10}]}>
        <Text style={{color:INK,fontSize:14,fontWeight:'800'}}>{meta.name} — Electrophysiological & Diagnostic Walkthrough</Text>
        <Text style={{color:meta.color,fontSize:12,fontWeight:'700'}}>Normal Duration: {meta.normalDurationMs}</Text>
        {[
          ['⚡ BIOPHYSICAL & CONDUCTION ORIGIN',meta.physioOrigin],
          ['📐 3D DIPOLE VECTOR (V = D · L)',meta.vectorExplanation+'\n'+meta.leadsAnalysis],
          ['🩺 EXAMINER TRAPS & CLINICAL PEARLS',meta.clinicalPearls],
        ].map(([name,value])=><View key={name} style={[styles.explanation,{borderColor:meta.color+'55'}]}>
          <Text style={{color:'#e2e8f0',fontSize:10,fontWeight:'800',marginBottom:6}}>{name}</Text>
          <Text style={{color:'#cbd5e1',fontSize:12,lineHeight:19}}>{value}</Text>
        </View>)}
      </View>}
      <Text style={styles.small}>Synthetic ECG for education; use clinical ECGs for real patient decisions. The magnified cutout and advanced 3D tutorial remain under native port.</Text>
    </ScrollView>
  </View>;
}
const styles=StyleSheet.create({
  header:{flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:BORDER,paddingHorizontal:10,paddingVertical:8,gap:10},
  panel:{borderWidth:1,borderColor:BORDER,backgroundColor:PANEL,padding:12,borderRadius:15},
  small:{fontSize:10,color:'#94a3b8',lineHeight:15},
  groups:{flexDirection:'row',flexWrap:'wrap',gap:7},
  groupButton:{width:'31%',minHeight:44,flexGrow:1,borderWidth:1,borderColor:BORDER,backgroundColor:PANEL,justifyContent:'center',borderRadius:11,paddingHorizontal:4},
  explanation:{padding:12,borderRadius:11,borderWidth:1,backgroundColor:'#1e293b'},
});
