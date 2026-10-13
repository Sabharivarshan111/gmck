import React,{useMemo,useState} from 'react';
import {ScrollView,View} from 'react-native';
import Svg,{Circle,Line,Path} from 'react-native-svg';
import {Slider} from '@/components/Slider';
import {NativeEcgHeartModel,type Activation} from './NativeEcgHeartModel';
import {CardiacCycleEngine,DEFAULT_CARDIAC_PARAMS} from '@simulator/instruments/cardiac-engine/CardiacCyclePhysics';
import {ECG_WAVES,ECG_PHASES,ECG_BEAT_PATH,ECG_INTERVALS,ECG_PATTERNS,ECG_LEADS,ECG_CHEST} from './lessonCatalog';
import {Action,Card,Copy,ui} from './SimulatorUi';
export function NativeEcgStudio(){
 const [tab,setTab]=useState('Start here'),[time,setTime]=useState(0),[wave,setWave]=useState(0),[axis,setAxis]=useState(60),[lead,setLead]=useState(1),[params,setParams]=useState(DEFAULT_CARDIAC_PARAMS);
 const engine=useMemo(()=>new CardiacCycleEngine(params),[params]),state=engine.evaluate(time/800),metrics=engine.getPvMetrics();
 const phase=ECG_PHASES.find(p=>time>=p.start&&time<p.end),voltage=Math.cos((axis-ECG_LEADS[lead].angle)*Math.PI/180);
 const points=useMemo(()=>Array.from({length:160},(_,i)=>engine.evaluate(i/160)),[engine]);
 return <ScrollView contentContainerStyle={ui.page}>
  <View style={ui.row}>{['Start here','Leads & axis','Intervals','Patterns','Cardiac cycle'].map(t=><Action key={t} label={t} selected={tab===t} onPress={()=>setTab(t)}/>)}</View>
  {tab==='Start here'&&<>
   <Card title="Read voltage over time"><Copy>At 25 mm/s: one small square = 40 ms; one large square = 200 ms. At 10 mm/mV: one small square = 0.1 mV. Check printed calibration.</Copy><Copy>For a regular rhythm at 25 mm/s, heart rate = 300 ÷ large squares between consecutive R peaks.</Copy></Card>
   <View style={ui.row}>{ECG_WAVES.map((w,i)=><Action key={w.name} label={w.name} selected={wave===i} onPress={()=>setWave(i)}/>)}</View><Card title={ECG_WAVES[wave].title}><Copy>{ECG_WAVES[wave].text}</Copy></Card>
   <Card title={phase?.title||'Resting interval'}><NativeEcgHeartModel activation={(phase?.activation||'rest') as Activation} progress={phase?(time-phase.start)/(phase.end-phase.start):0}/><Svg viewBox="0 0 800 160" width="100%" height={100}><Path d={ECG_BEAT_PATH} fill="none" stroke="#e78aa8" strokeWidth={2}/><Line x1={time} x2={time} y1={5} y2={150} stroke="#77c8db"/></Svg><Slider label="Inspect activation phase" min={0} max={799} step={1} value={time} onChange={setTime} format={n=>n+' ms'}/><Copy>{phase?.text||'No net activation vector during this quiet interval.'}</Copy><Copy muted>{phase?.mechanism||'This is a schematic teaching beat.'}</Copy></Card>
  </>}
  {tab==='Leads & axis'&&<>
   <Card title="One heart, twelve views"><Copy>Ten electrodes create twelve leads. Each lead records voltage along its viewing direction.</Copy><View style={ui.row}>{ECG_LEADS.map((l,i)=><Action key={l.name} label={l.name} selected={lead===i} onPress={()=>setLead(i)}/>)}</View><Svg viewBox="0 0 300 270" width="100%" height={270}><Circle cx={150} cy={135} r={95} stroke="#526374" fill="none"/>{ECG_LEADS.map(l=><Line key={l.name} x1={150} y1={135} x2={150+95*Math.cos(l.angle*Math.PI/180)} y2={135+95*Math.sin(l.angle*Math.PI/180)} stroke="#526374"/>)}<Path d={`M150 135 L${150+90*Math.cos(axis*Math.PI/180)} ${135+90*Math.sin(axis*Math.PI/180)}`} stroke="#e5c361" strokeWidth={3}/></Svg><Slider label="Net QRS axis" min={-180} max={180} step={5} value={axis} onChange={setAxis} format={n=>n+'°'}/><Copy>{ECG_LEADS[lead].name}: {Math.abs(voltage)<.02?'Nearly isoelectric':voltage>0?'Positive deflection':'Negative deflection'} · projection {voltage.toFixed(2)}</Copy><Copy>I = LA − RA; II = LL − RA; III = LL − LA. Therefore I + III = II at the same instant.</Copy></Card>
   <Card title="Chest lead placement">{ECG_CHEST.map(c=><Copy key={c.name}>{c.name}: {c.text}</Copy>)}</Card>
  </>}
  {tab==='Intervals'&&ECG_INTERVALS.map(i=><Card key={i.name} title={i.name+' · '+i.range}><Copy>{i.measure}</Copy><Copy>{i.meaning}</Copy><Copy>{i.check}</Copy></Card>)}
  {tab==='Patterns'&&ECG_PATTERNS.map(p=><Card key={p.id} title={p.name}><Copy>{p.finding}</Copy><Copy>{p.why}</Copy><Copy>{p.next}</Copy></Card>)}
  {tab==='Cardiac cycle'&&<>
   <Card title={state.phaseName}><NativeEcgHeartModel mitralOpen={state.valves.mitralOpen} aorticOpen={state.valves.aorticOpen}/><Copy>{state.phaseDesc}</Copy><Copy>Mitral: {state.valves.mitralStateText} · Aortic: {state.valves.aorticStateText}</Copy><Copy>LV {Math.round(state.lvPressure)} mmHg · {Math.round(state.lvVolume)} mL; aortic {Math.round(state.aorticPressure)} mmHg</Copy><Slider label="Cardiac cycle time" min={0} max={799} step={1} value={time} onChange={setTime} format={n=>Math.round(n/800*engine.getCycleDurationMs())+' ms'}/></Card>
   <Card title="Pressure & volume"><Svg viewBox="0 0 360 160" width="100%" height={160}>{(['lvPressure','aorticPressure','lvVolume'] as const).map((key,i)=><Path key={key} d={points.map((p,j)=>`${j?'L':'M'} ${j/159*360} ${150-p[key]/200*130}`).join(' ')} fill="none" stroke={['#ed8d9d','#e3c369','#77c8db'][i]} strokeWidth={1.5}/>)}</Svg><Copy muted>Pink: LV pressure (mmHg) · gold: aortic pressure (mmHg) · blue: LV volume (mL). Separate physical units share this teaching scale.</Copy><Copy>Stroke volume {metrics.strokeVolume} mL · EF {metrics.ejectionFraction}%</Copy></Card>
   <Card title="Cellular action potential"><Svg viewBox="0 0 360 140" width="100%" height={140}><Path d={points.map((p,j)=>`${j?'L':'M'} ${j/159*360} ${125-(p.cellVoltage+90)/140*110}`).join(' ')} fill="none" stroke="#77c8db" strokeWidth={2}/></Svg><Copy>Phase {state.cellPhase} · {Math.round(state.cellVoltage)} mV</Copy></Card>
   <Card title="Change physiology">{([{key:'heartRate' as const,label:'Heart rate',min:40,max:180,step:5},{key:'contractility' as const,label:'Contractility',min:.5,max:2,step:.1},{key:'preload' as const,label:'Preload',min:.7,max:1.5,step:.1},{key:'afterload' as const,label:'Afterload',min:.6,max:2,step:.1}]).map(p=><Slider key={p.key} label={p.label} min={p.min} max={p.max} step={p.step} value={params[p.key]} onChange={n=>setParams({...params,[p.key]:n})}/>)}<Action label="Aortic stenosis" selected={params.aorticStenosis} onPress={()=>setParams({...params,aorticStenosis:!params.aorticStenosis})}/><Action label="Mitral regurgitation" selected={params.mitralRegurgitation} onPress={()=>setParams({...params,mitralRegurgitation:!params.mitralRegurgitation})}/></Card>
  </>}
 </ScrollView>;
}
