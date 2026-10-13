import React,{useEffect,useRef,useState} from 'react';
import {AppState,BackHandler,Modal,ScrollView,StyleSheet,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useIsFocused} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Text} from '@/components/Text';
import {useTheme} from '@/theme';
import {typeScale} from '@/theme/typography';
import {PgEntranceBankModal} from '@/components/PgEntranceBankModal';
import {ClinicalProformaModal} from '@/components/ClinicalProformaModal';
import {GeneralExamSheet} from '@/components/GeneralExamSheet';
import {PhysiologyKernel,SCENARIOS} from '@simulator/engine/PhysiologyKernel';
import type {TelemetryWaveformSample} from '@simulator/types';
import {NativeAnatomyPanel} from '@/simulator/NativeAnatomyPanel';
import {NativeMonitor} from '@/simulator/NativeMonitor';
import {NativeCases} from '@/simulator/NativeCases';
import {NativeRadiology} from '@/simulator/NativeRadiology';
import {NativeEcgStudio} from '@/simulator/NativeEcgStudio';
import {NativePocus} from '@/simulator/NativePocus';
import {SIMULATOR_ACTIONS} from '@/simulator/lessonCatalog';
import {Action,Card,Copy,ui} from '@/simulator/SimulatorUi';
const Anatomy=React.memo(NativeAnatomyPanel);
type Tab='Skills'|'3D'|'Monitor'|'Cases';
type Tool='radiology'|'ecg'|'ultrasound'|null;
type SavedSession={scenario:string;elapsed:number;actions:Array<{at:number;id:string}>};
const storageKey='orbit-native-simulator-session-v1';
const actionIds=new Set(SIMULATOR_ACTIONS.map(a=>a.id));
/** Android views and packaged assets. No web navigation in the simulator. */
export default function SimulatorScreen({onExit}:{onExit:()=>void}){
 const {colors}=useTheme(),insets=useSafeAreaInsets(),focused=useIsFocused();
 const kernel=useRef(new PhysiologyKernel('normal')),elapsed=useRef(0),actions=useRef<SavedSession['actions']>([]),samples=useRef<TelemetryWaveformSample[]>([]);
 const [opened3D,setOpened3D]=useState(false);
 const [tab,setTab]=useState<Tab>('Skills'),[tool,setTool]=useState<Tool>(null),[pg,setPg]=useState(false),[forms,setForms]=useState(false),[exam,setExam]=useState(false);
 const [active,setActive]=useState(AppState.currentState==='active'),[restored,setRestored]=useState(false),[running,setRunning]=useState(true);
 const [vitals,setVitals]=useState({...kernel.current.vitals}),[pathology,setPathology]=useState({...kernel.current.pathology}),[scenario,setScenario]=useState(kernel.current.currentScenario),[logs,setLogs]=useState(kernel.current.logs.slice()),[trace,setTrace]=useState<TelemetryWaveformSample[]>([]);
 const saveQueue=useRef(Promise.resolve());
 const save=useRef(()=>{});save.current=()=>{if(!restored)return;const data=JSON.stringify({scenario:kernel.current.currentScenario.id,elapsed:elapsed.current,actions:actions.current});saveQueue.current=saveQueue.current.then(()=>AsyncStorage.setItem(storageKey,data)).catch(()=>undefined);};
 const publish=()=>{setVitals(kernel.current.getLiveVitals());setPathology({...kernel.current.pathology});setScenario(kernel.current.currentScenario);setLogs(kernel.current.logs.slice());};
 useEffect(()=>{
  let gone=false;
  void (async()=>{
   try{
    const raw=await AsyncStorage.getItem(storageKey);
    if(raw){
     const stored=JSON.parse(raw) as SavedSession;
     if(SCENARIOS.some(s=>s.id===stored.scenario)&&Number.isFinite(stored.elapsed)&&stored.elapsed>=0&&stored.elapsed<=21600&&Array.isArray(stored.actions)&&stored.actions.length<=500){
      const valid=stored.actions.every((a,i)=>a&&actionIds.has(a.id)&&Number.isFinite(a.at)&&a.at>=0&&a.at<=stored.elapsed&&(i===0||a.at>=stored.actions[i-1].at));
      if(valid){
       const replay=new PhysiologyKernel(stored.scenario);let t=0,count=0;
       for(const action of [...stored.actions,{at:stored.elapsed,id:''}]){
        while(t<action.at){if(gone)return;const dt=Math.min(.04,action.at-t);replay.tick(dt);t+=dt;if(++count%2000===0)await new Promise<void>(resolve=>setTimeout(resolve,0));}
        if(action.id)replay.applyAction(action.id);
       }
       if(!gone){kernel.current=replay;elapsed.current=stored.elapsed;actions.current=stored.actions;}
      }
     }
    }
   }catch{/* A corrupt saved session falls back to the normal baseline. */}
   if(!gone){setVitals({...kernel.current.vitals});setPathology({...kernel.current.pathology});setScenario(kernel.current.currentScenario);setLogs(kernel.current.logs.slice());setRestored(true);}
  })();
  return()=>{gone=true;save.current();};
 },[]);
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>{if(state!=='active')save.current();setActive(state==='active');});return()=>sub.remove();},[]);
 useEffect(()=>{
  if(!focused||!active||!restored||!running)return;
  let ticks=0;
  const timer=setInterval(()=>{
   kernel.current.tick(.04);elapsed.current+=.04;
   samples.current.push(kernel.current.sampleWaveforms());if(samples.current.length>180)samples.current.shift();
   ticks++;
   if(tab==='Monitor'&&ticks%5===0)setTrace(samples.current.slice());
   if(ticks%25===0)setVitals(kernel.current.getLiveVitals());
   if(ticks%750===0)save.current();
  },40);
  return()=>clearInterval(timer);
 },[focused,active,restored,running,tab]);
 useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{
  if(!focused)return false;
  if(tool)setTool(null);else if(pg)setPg(false);else if(forms)setForms(false);else if(exam)setExam(false);else if(tab!=='Skills')setTab('Skills');else {save.current();onExit();}
  return true;
 });return()=>sub.remove();},[focused,onExit,tab,tool,pg,forms,exam]);
 const choose=(id:string)=>{kernel.current=new PhysiologyKernel(id);elapsed.current=0;actions.current=[];samples.current=[];setTrace([]);publish();save.current();};
 const apply=(id:string)=>{if(!restored||actions.current.length>=500)return;kernel.current.applyAction(id);actions.current.push({id,at:elapsed.current});publish();save.current();};
 return <View style={[styles.screen,{backgroundColor:colors.background,paddingTop:insets.top,paddingBottom:insets.bottom}]}>
  <View style={[styles.header,{borderBottomColor:colors.border}]}><Action label="Back" onPress={()=>{save.current();onExit();}}/><View style={{flex:1}}><Text style={[typeScale.bodyStrong,{color:colors.text}]}>Patient simulator</Text><Text style={[typeScale.caption,{color:colors.textMuted}]}>{restored?'Offline native studio':'Restoring local session…'}</Text></View><Text style={[typeScale.bodyStrong,{color:colors.text}]}>{Math.round(vitals.heartRate)} · {Math.round(vitals.bpSystolic)}/{Math.round(vitals.bpDiastolic)}</Text></View>
  <View style={styles.baseline}><Text numberOfLines={2} style={[typeScale.caption,{color:colors.textMuted}]}>{scenario.title}</Text></View>
  <View style={styles.screen}>
   {opened3D&&<View style={[StyleSheet.absoluteFill,{display:tab==='3D'&&focused&&active?'flex':'none'}]}><Anatomy/></View>}
   {tab==='Monitor'&&<NativeMonitor vitals={vitals} samples={trace} rhythm={pathology.ecgRhythm}/>}
   {tab==='Cases'&&<NativeCases scenario={scenario} logs={logs} onScenario={choose} onAction={apply}/>}
   {tab==='Skills'&&<ScrollView contentContainerStyle={ui.page}><Card title="Clinical learning studio"><Copy>Explore normal findings, compare disease cases and inspect anatomy offline.</Copy><Action label="ECG learning studio" onPress={()=>setTool('ecg')}/><Action label="X-ray & MRI · annotated references" onPress={()=>setTool('radiology')}/><Action label="Ultrasound teaching view" onPress={()=>setTool('ultrasound')}/><Action label="NEET PG · offline practice" onPress={()=>setPg(true)}/><Action label="Clinical case proformas" onPress={()=>setForms(true)}/><Action label="General examination guide" onPress={()=>setExam(true)}/><Action label={running?'Pause simulated patient':'Resume simulated patient'} onPress={()=>setRunning(!running)}/></Card></ScrollView>}
  </View>
  <View style={[styles.tabs,{borderTopColor:colors.border}]}>{(['Skills','3D','Monitor','Cases'] as const).map(t=><Action key={t} label={t} selected={tab===t} onPress={()=>{setTab(t);if(t==='3D')setOpened3D(true);if(t==='Monitor')setTrace(samples.current.slice());}}/>)}</View>
  <Modal visible={!!tool} onRequestClose={()=>setTool(null)} animationType="none" statusBarTranslucent><View style={[styles.screen,{backgroundColor:colors.background,paddingTop:insets.top,paddingBottom:insets.bottom}]}><View style={styles.header}><Action label="Close diagnostic view" onPress={()=>setTool(null)}/><Text style={[typeScale.bodyStrong,{color:colors.text}]}>{tool==='radiology'?'X-ray & MRI':tool==='ecg'?'ECG learning studio':'Ultrasound'}</Text></View>{tool==='radiology'?<NativeRadiology/>:tool==='ecg'?<NativeEcgStudio/>:tool==='ultrasound'?<NativePocus vitals={vitals} pathology={pathology}/>:null}</View></Modal>
  <PgEntranceBankModal visible={pg} onClose={()=>setPg(false)}/><ClinicalProformaModal visible={forms} onClose={()=>setForms(false)}/><GeneralExamSheet visible={exam} onClose={()=>setExam(false)}/>
 </View>;
}
const styles=StyleSheet.create({screen:{flex:1},header:{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:12,paddingVertical:8,borderBottomWidth:StyleSheet.hairlineWidth},baseline:{paddingHorizontal:16,paddingVertical:8},tabs:{flexDirection:'row',justifyContent:'space-around',padding:8,borderTopWidth:StyleSheet.hairlineWidth}});
