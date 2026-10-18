/**
 * React Native port of the Vercel captured ECG teaching canvas.
 * Calibrated 4x3 12-lead matrix, rhythm strip, teaching segments, tour,
 * lead groups and same source descriptions. Renders with native SVG,
 * supports offline use. Advanced teaching opens a dedicated local WebView.
 *
 * Advanced cutouts and heart teaching open the locally bundled canonical module.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Pressable, ScrollView, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { GraduationCap, Play, Pause, RotateCcw, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Text } from '@/components/Text';
import NativeEcgCutout from '@/components/NativeEcgCutout';
import { NATIVE_ECG_LEADS, NATIVE_ECG_SEGMENTS, type NativeEcgSegmentId } from '@/lib/nativeEcgReference';
import { leadById, nativeEcgTracePath, type NativeEcgConfig } from '@/lib/nativeEcgWaveform';
import CanonicalTeachingOverlay from '@/components/CanonicalTeachingOverlay';
import { PhysiologyKernel } from '@simulator/engine/PhysiologyKernel';
import { restoreClinicalSnapshot } from '@/lib/clinicalSnapshot';

interface Props { scenarioId: string; onBack: () => void; theme?: 'light' | 'dark'; engine?: PhysiologyKernel }
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
  const plottedLeads = useMemo(() => group === 4 ? NATIVE_ECG_LEADS : NATIVE_ECG_LEADS.slice(group * 3, group * 3 + 3), [group]);
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
  return <View testID="native-ecg-paper" accessibilityLabel="Static synthetic ECG with calibrated grid" style={{ width: pixelWidth, backgroundColor: PINK, borderWidth:1, borderColor:'#fca5a5', borderRadius: 9, overflow:'hidden' }}>
    <Svg width={pixelWidth} height={Math.round(H*(pixelWidth/plotWidth))} viewBox={`0 0 ${plotWidth} ${H}`}>
      <Rect x={0} y={0} width={plotWidth} height={H} fill={PINK} />
      {gridX.map((x,i)=><Line key={'gx'+i} x1={x} x2={x} y1={0} y2={H} stroke={i%5===0?'#dc2626':'#ef4444'} strokeOpacity={i%5===0?.35:.14} strokeWidth={i%5===0?1:.5}/>)}
      {gridY.map((y,i)=><Line key={'gy'+i} x1={0} x2={plotWidth} y1={y} y2={y} stroke={i%5===0?'#dc2626':'#ef4444'} strokeOpacity={i%5===0?.35:.14} strokeWidth={i%5===0?1:.5}/>)}
      {bandRects.map(b=><Rect key={b.key} x={b.x} y={b.y} width={b.w} height={b.h} fill={seg?.bandColor??'rgba(220,38,38,.18)'} />)}
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

export default function NativeEcgTwelveLead({ scenarioId, onBack, theme = 'dark', engine }: Props) {
  const PANEL = theme === 'dark' ? '#0e0e11' : '#fff';
  const BORDER = theme === 'dark' ? '#34343a' : '#e2e8f0';
  const INK = theme === 'dark' ? '#f1f5f9' : '#0f172a';
  const panelInk = INK;
  const muted = '#94a3b8';
  const styles = useMemo(() => makeStyles(PANEL, BORDER, muted), [PANEL, BORDER, muted]);
  const button = { borderWidth: 1, borderColor: BORDER, backgroundColor: theme === 'dark' ? '#1b1b21' : '#f1f5f9', borderRadius: 12, minHeight: 44, justifyContent: 'center' as const, paddingHorizontal: 12 };
  const insets=useSafeAreaInsets();
  const focused=useIsFocused();
  const [active,setActive]=useState(AppState.currentState==='active');
  useEffect(()=>{const sub=AppState.addEventListener('change',state=>setActive(state==='active'));return()=>sub.remove();},[]);
  const {width}=useWindowDimensions();
  const [patient] = useState(() => engine ?? new PhysiologyKernel(scenarioId));
  const readLive = () => ({ rhythm: patient.pathology.ecgRhythm, heartRate: patient.getLiveVitals().heartRate });
  const [live, setLive] = useState(readLive);
  const [capture,setCapture] = useState<NativeEcgConfig>(readLive);
  const [group,setGroup]=useState(0);
  const [zoomed,setZoomed]=useState(false);
  const [segment,setSegment]=useState<NativeEcgSegmentId>('all');
  const [tour,setTour]=useState(false);
  const [teachingOpen,setTeachingOpen]=useState(false);
  const [tutorialOpen,setTutorialOpen]=useState(false);
  const [teachingPatient, setTeachingPatient] = useState(() => JSON.stringify(patient));
  const meta=NATIVE_ECG_SEGMENTS.find(s=>s.id===segment);
  const refresh=()=> setCapture(readLive());
  const openTeaching = (kind: 'icu' | 'ecg') => {
    setTeachingPatient(JSON.stringify(patient));
    if (kind === 'icu') setTutorialOpen(true); else setTeachingOpen(true);
  };
  const acceptPatient = (snapshot: string) => {
    if (!restoreClinicalSnapshot(patient, snapshot)) return;
    const next = readLive();
    setLive(next);
    setCapture(previous => previous.rhythm === next.rhythm ? previous : next);
  };
  useEffect(() => {
    if (!active || !focused || teachingOpen || tutorialOpen) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      patient.tick(Math.min(.25, Math.max(0, (now - last) / 1000)));
      last = now;
      const next = { rhythm: patient.pathology.ecgRhythm, heartRate: patient.getLiveVitals().heartRate };
      setLive(previous => previous.rhythm === next.rhythm && Math.round(previous.heartRate) === Math.round(next.heartRate) ? previous : next);
      setCapture(previous => previous.rhythm === next.rhythm ? previous : next);
    }, 125);
    return () => clearInterval(timer);
  }, [active, focused, teachingOpen, tutorialOpen, patient]);
  useEffect(()=>{
    if(!tour||!active||!focused||teachingOpen||tutorialOpen)return;
    const i=setInterval(()=>setSegment(previous=>{
      const index=BEAT_ORDER.indexOf(previous==='all'?'p':previous);
      return BEAT_ORDER[(index+1)%BEAT_ORDER.length];
    }),4200);
    return()=>clearInterval(i);
  },[tour,active,focused,teachingOpen,tutorialOpen]);
  const canvasWidth=zoomed ? W_LARGE : width-22;
  const chooseSegment=(id:NativeEcgSegmentId)=>{setTour(false);setSegment(id);};
  return <View testID="native-ecg12-studio" style={{flex:1,backgroundColor: theme === 'dark' ? '#0e0e11' : '#0f172a',paddingTop:insets.top}}>
    <StatusBar barStyle="light-content" />
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#06b6d4' }} /><Text style={{ color: theme === 'dark' ? '#e784fb' : '#22d3ee', fontSize: 14, fontWeight: '700' }}>12-lead ECG</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to clinical studio" testID="native-ecg-back" onPress={onBack} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}><X size={20} color={muted} /></Pressable>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal:10,paddingBottom:insets.bottom+16,paddingTop:10,gap:10}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}><Text style={{ color: theme === 'dark' ? '#e784fb' : '#67e8f9', fontSize: 12, fontFamily: 'monospace', fontWeight: '700', backgroundColor: '#06b6d41a', borderColor: '#06b6d44d', borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>Rhythm · {live.rhythm.toUpperCase().replace('_',' ')}</Text><Pressable accessibilityRole="button" accessibilityLabel="Open ECG tutorial" onPress={() => openTeaching('icu')} style={{ minHeight:44, paddingHorizontal:12, borderRadius:12, flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#0891b2' }}><GraduationCap size={16} color="#fff"/><Text style={{color:'#fff',fontSize:12,fontWeight:'700'}}>Tutorial</Text></Pressable></View>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
        <Text style={styles.small}>Static teaching ECG · choose a lead group</Text>
        <Text style={[styles.small,{color:'#fca5a5'}]}>25 mm/s · 10 mm/mV</Text>
      </View>

      <View style={styles.groups}>
        {[...GROUPS,zoomed?'Fit to screen':'Enlarge'].map((g,i)=><Pressable key={i} testID={`native-ecg-group-${i}`} accessibilityRole="button"
          accessibilityState={{selected:i<5&&group===i||i===5&&zoomed}}
          style={[styles.groupButton,i<5&&group===i?{backgroundColor:'#e879f9',borderColor:'#e879f9'}:{}]}
          onPress={()=>i<5?setGroup(i):setZoomed(v=>!v)}>
          <Text style={{textAlign:'center',color:i<5&&group===i?'#020617':INK,fontSize:12}}>{g}</Text>
        </Pressable>)}
      </View>
      <View style={{flexDirection:'row',alignItems:'center',gap:9}}>
        <Text style={[styles.small,{flex:1}]} numberOfLines={2}>Captured · {capture.rhythm.toUpperCase()} · {Math.round(capture.heartRate)} bpm</Text>
        <Pressable testID="native-ecg-capture" accessibilityRole="button" onPress={refresh} style={button}>
          <Text style={{color:INK,fontSize:12}}>Capture current ECG</Text>
        </Pressable>
      </View>
      <ScrollView horizontal={zoomed} showsHorizontalScrollIndicator={false} style={{flexGrow:0}}>
        <EcgPaper cfg={capture} group={group} segment={segment} width={canvasWidth} />
      </ScrollView>
      <View style={[styles.panel,{gap:8}]}>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <View style={{width:10,height:10,borderRadius:5,backgroundColor:'#dc2626'}} />
          <Text style={{flex:1,color:INK,fontSize:12,fontWeight:'800',letterSpacing:1,fontFamily:'monospace'}}>WAVE GUIDE</Text>
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
              style={[button,{minWidth:44,alignItems:'center',borderColor:id===segment?(m?.color??INK):BORDER,backgroundColor:id===segment?(m?.bandColor??panelInk):PANEL}]}>
              <Text style={{color:id===segment?(m?(theme==='dark'?m.darkTextColor:m.lightTextColor):(theme==='dark'?'#0f172a':'#fff')):panelInk,fontSize:12,fontWeight:'800',fontFamily:'monospace'}}>{m?.shortName??'All'}</Text>
            </Pressable>;
          })}
        </ScrollView>
      </View>

      {meta&&<View testID="native-ecg-teaching-segment" style={[styles.panel,{borderColor:meta.color,gap:10}]}>
        <Text style={{color:panelInk,fontSize:14,fontWeight:'800'}}>{meta.name} — Electrophysiological & Diagnostic Walkthrough</Text>
        <Text style={{color:meta.color,fontSize:12,fontWeight:'700'}}>Normal Duration: {meta.normalDurationMs}</Text>
        <NativeEcgCutout segmentId={meta.id} />
        {[
          ['⚡ BIOPHYSICAL & CONDUCTION ORIGIN',meta.physioOrigin],
          ['📐 3D DIPOLE VECTOR (V = D · L)',meta.vectorExplanation+'\n'+meta.leadsAnalysis],
          ['🩺 EXAMINER TRAPS & CLINICAL PEARLS',meta.clinicalPearls],
        ].map(([name,value])=><View key={name} style={[styles.explanation,{borderColor:theme === 'dark' ? '#334155' : '#e2e8f0',backgroundColor:theme === 'dark' ? '#1e293b80' : '#f8fafc'}]}>
          <Text style={{color:theme === 'dark' ? '#e2e8f0' : '#1e293b',fontSize:12,fontWeight:'800',marginBottom:6}}>{name}</Text>
          <Text style={{color:theme === 'dark' ? '#cbd5e1' : '#475569',fontSize:13,lineHeight:21}}>{value}</Text>
        </View>)}
      </View>}
      <Pressable accessibilityRole="button" accessibilityLabel="Open full ECG teaching studio" onPress={() => openTeaching('ecg')} style={button}><Text style={{ color: INK, fontSize: 13 }}>Full ECG teaching studio</Text></Pressable>
      <Text style={styles.small}>Synthetic ECG for education; use clinical ECGs for real patient decisions.</Text>
    </ScrollView>
    {tutorialOpen && <CanonicalTeachingOverlay route={'/simulator?mode=telemetry&native_teaching=icu&nativeTheme=' + theme + '&scenario=' + scenarioId} patient={teachingPatient} active={active && focused} onPatient={acceptPatient} onClose={() => setTutorialOpen(false)} />}
    {teachingOpen && <CanonicalTeachingOverlay route={'/simulator?tool=ecg12&native_teaching=ecg&nativeTheme=' + theme + '&scenario=' + scenarioId} patient={teachingPatient} active={active && focused} onPatient={acceptPatient} onClose={() => setTeachingOpen(false)} />}
  </View>;
}
const makeStyles=(PANEL: string, BORDER: string, muted: string)=>StyleSheet.create({
  header:{flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:BORDER,paddingHorizontal:12,paddingVertical:10,gap:8},
  panel:{borderWidth:1,borderColor:BORDER,backgroundColor:PANEL,padding:10,borderRadius:16},
  small:{fontSize:12,color:muted,lineHeight:18},
  groups:{flexDirection:'row',flexWrap:'wrap',gap:6},
  groupButton:{width:'31%',minHeight:44,flexGrow:1,borderWidth:1,borderColor:BORDER,backgroundColor:PANEL,justifyContent:'center',borderRadius:12,paddingHorizontal:4},
  explanation:{padding:12,borderRadius:11,borderWidth:1,backgroundColor:'#1e293b'},
});
