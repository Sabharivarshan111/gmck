import React,{useEffect,useRef,useState} from 'react';
import {AppState,ScrollView,View} from 'react-native';
import Svg,{Circle,Ellipse,Line,Path,Text as SvgText} from 'react-native-svg';
import Audio from '@/native/NativeOrbitSimAudio';
import {SimSlider as Slider} from './SimulatorUi';
import type {PatientPathologyState,PatientVitals} from '@simulator/types';
import {resolveAuscultation} from './nativeAuscultationRouting';
import type {AuscultationSite,HeartSoundPreset,LungSoundPreset} from './nativeAuscultationRouting';
import {AUDIO_CLIPS,AUSCULTATION_SITES,HEART_SOUND_DESCRIPTIONS,LUNG_SOUND_DESCRIPTIONS,SOUND_LIBRARY} from './lessonCatalog';
import {Action,Card,Copy,ui} from './SimulatorUi';
export function NativeAuscultation({vitals,pathology,scenarioId}:{vitals:PatientVitals;pathology:PatientPathologyState;scenarioId:string}){
 const [site,setSite]=useState<AuscultationSite>('mitral'),[mode,setMode]=useState<'bell'|'diaphragm'>('diaphragm'),[heart,setHeart]=useState<HeartSoundPreset|null>(null),[lung,setLung]=useState<LungSoundPreset|null>(null),[playing,setPlaying]=useState(false),[volume,setVolume]=useState(.5),[message,setMessage]=useState('Tap Play to listen.');
 const mounted=useRef(true),explicitStart=useRef(false);
 const finding=resolveAuscultation(pathology,vitals,site,scenarioId,heart,lung),selected=AUSCULTATION_SITES.find(s=>s.id===site)!;
 const preset=finding.pulmonary?finding.lung:finding.heart==='mitral_stenosis'&&!finding.atrialContraction?'mitral_stenosis_af':finding.heart;
 const rate=finding.pulmonary?vitals.respiratoryRate:vitals.heartRate,group=finding.pulmonary?'pulmonary':'cardiac';
 const candidates=AUDIO_CLIPS.filter(c=>c.group===group&&c.preset===preset&&c.mode===mode);
 const clip=candidates.reduce<(typeof AUDIO_CLIPS)[number]|undefined>((best,c)=>!best||Math.abs(c.rate-rate)<Math.abs(best.rate-rate)?c:best,undefined);
 const clipFile=clip?.file,noSound=rate<=0;
 const speed=clip?Math.max(.5,Math.min(2,rate/clip.rate)):1;
 const latest=useRef({speed,volume});latest.current={speed,volume};
 useEffect(()=>{mounted.current=true;const sub=AppState.addEventListener('change',state=>{if(state!=='active'){Audio?.stop();setPlaying(false);setMessage('Paused while the app is in the background.');}});return()=>{mounted.current=false;sub.remove();Audio?.stop();};},[]);
 useEffect(()=>{
  if(!playing){Audio?.stop();return;}
  if(!clipFile||preset==='silent'||noSound){Audio?.stop();setMessage(preset==='silent'?'No sound in this modeled finding.':'Offline reference clip unavailable.');setPlaying(false);return;}
  let gone=false;const userStarted=explicitStart.current;explicitStart.current=false;
  void Audio?.play(clipFile,latest.current.speed,latest.current.volume,userStarted).then(ok=>{if(!gone&&mounted.current){setPlaying(ok);setMessage(ok?'Playing local synthetic reference.':'Audio focus unavailable. Tap Play when ready.');}}).catch(()=>{if(!gone&&mounted.current){setPlaying(false);setMessage('The local audio could not play. Check this Android build and media volume.');}});
  return()=>{gone=true;};
 },[playing,clipFile,preset,noSound]);
 useEffect(()=>{if(playing)Audio?.update(speed,volume);},[playing,speed,volume]);
 useEffect(()=>{if(!playing)return;let gone=false;const timer=setInterval(()=>{void Audio?.isPlaying().then(ok=>{if(!gone&&!ok){setPlaying(false);setMessage('Playback stopped. Tap Play to resume.');}});},2000);return()=>{gone=true;clearInterval(timer);};},[playing]);
 return <ScrollView contentContainerStyle={ui.page}>
  <Card title="Auscultation"><Copy>Surface listening areas · patient's left is on your right. Lung bases are examined posteriorly; this locator shows the region only.</Copy>
   <Svg width="100%" height={230} viewBox="0 0 240 240"><Path d="M90 30L80 54L46 74L38 218H202L194 74L160 54L150 30Z" fill="#172737" stroke="#3b5163" strokeWidth={1.4}/><Ellipse cx={120} cy={26} rx={30} ry={23} fill="#172737" stroke="#3b5163"/><Line x1={120} y1={60} x2={120} y2={200} stroke="#3b5163"/>{AUSCULTATION_SITES.map(s=><Circle key={s.id} cx={s.x*2.4} cy={s.y*2.7+25} r={s.id===site?9:5} fill={s.id===site?'#8bdded':'#647789'}/>)}<SvgText x={14} y={25} fill="#b9c6d3" fontSize={12}>R</SvgText><SvgText x={215} y={25} fill="#b9c6d3" fontSize={12}>L</SvgText></Svg>
   <Copy>{selected.label} · {selected.location}</Copy><View style={ui.row}>{AUSCULTATION_SITES.map(s=><Action key={s.id} label={s.label} selected={site===s.id} onPress={()=>setSite(s.id as AuscultationSite)}/>)}</View>
  </Card>
  <Card title={finding.pulmonary?'Breath sounds':'Heart sounds'}><Copy>{finding.pulmonary?LUNG_SOUND_DESCRIPTIONS[finding.lung]:HEART_SOUND_DESCRIPTIONS[finding.heart]}</Copy><View style={ui.row}>{(['bell','diaphragm'] as const).map(m=><Action key={m} label={m==='bell'?'Bell · low frequencies':'Diaphragm'} selected={mode===m} onPress={()=>setMode(m)}/>)}</View><Action label={playing?'Stop listening':'Play reference sound'} disabled={!Audio||!clip||rate<=0} onPress={()=>{explicitStart.current=!playing;setPlaying(!playing);}}/><Copy>{!Audio?'This preview has no Android audio module.':message}</Copy><Slider label="Auscultation volume" value={volume} min={0} max={1} step={.05} format={v=>Math.round(v*100)+'%'} onChange={setVolume}/><Copy muted>{Math.round(rate)} {finding.pulmonary?'breaths/min':'bpm'} · procedural teaching audio, stored offline. Tempo is adjusted between reference rates while preserving pitch.</Copy></Card>
  <Card title="Case or reference library"><Action label="Use current patient case" selected={!heart&&!lung} onPress={()=>{setHeart(null);setLung(null);}}/>{SOUND_LIBRARY.map(s=><Action key={s.id} label={s.title} selected={heart===s.id} onPress={()=>{setHeart(s.id as HeartSoundPreset);setLung(null);setSite(s.site as AuscultationSite);setMode(s.mode as 'bell'|'diaphragm');}}/>)}<View style={ui.row}>{(['vesicular','bronchial','crackles','wheeze','stridor','silent'] as const).map(p=><Action key={p} label={`Lung · ${p}`} selected={lung===p} onPress={()=>{setLung(p);setHeart(null);setSite(p==='stridor'?'trachea':'lung_bases');}}/>)}</View><Copy muted>Reference library selection is independent of the patient case. Headphones help with quieter low-frequency findings.</Copy></Card>
 </ScrollView>;
}
