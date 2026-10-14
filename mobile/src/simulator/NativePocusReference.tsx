import React,{useEffect,useState} from 'react';
import {AppState,Image,Linking,Platform,View} from 'react-native';
import Video from 'react-native-video';
import {useReducedMotion} from '@/theme/motion';
import {POCUS_REFERENCES} from './lessonCatalog';
import {Action,Card,Copy} from './SimulatorUi';
export type PocusMode=keyof typeof POCUS_REFERENCES;
const local=(file:string)=>Platform.OS==='android'?'asset:/simulator/pocus/'+file:'/clinical-reference/pocus/'+file;
export function NativePocusReference({mode}:{mode:PocusMode}){
 const ref=POCUS_REFERENCES[mode],reduced=useReducedMotion();
 const [opened,setOpened]=useState(false),[paused,setPaused]=useState(true),[failed,setFailed]=useState(false),[linkMessage,setLinkMessage]=useState('');
 const file=ref.image.split('/').pop()!,stem=file.replace('.gif','');
 useEffect(()=>{setOpened(false);setPaused(true);setFailed(false);},[mode]);
 useEffect(()=>{if(reduced)setPaused(true);},[reduced]);
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>{if(state!=='active')setPaused(true);});return()=>sub.remove();},[]);
 return <Card title={ref.title}><Copy>{ref.note}</Copy><View style={{height:280,backgroundColor:'#000',borderRadius:12,overflow:'hidden'}}>
  {opened&&ref.animated&&!failed?<Video source={{uri:local(stem+'.mp4')}} paused={paused} muted repeat disableFocus playInBackground={false} playWhenInactive={false} resizeMode="contain" style={{width:'100%',height:'100%'}} onError={()=>{setFailed(true);setPaused(true);}}/>:<Image source={{uri:local(ref.animated?stem+'-poster.jpg':file)}} resizeMode="contain" accessibilityLabel={ref.title} style={{width:'100%',height:'100%'}} onError={()=>setFailed(true)}/>}
 </View>{ref.animated&&<Action label={paused?'Play archived ultrasound loop':'Pause archived ultrasound loop'} disabled={failed} onPress={()=>{setOpened(true);setPaused(!paused);}}/>}{failed&&<Copy>The local reference could not load in this build.</Copy>}<Action label="Reference source & attribution" onPress={()=>{void Linking.openURL(ref.page).catch(()=>setLinkMessage('The source link needs a connection; this reference is stored offline.'));}}/><Action label={ref.license+' licence'} onPress={()=>{void Linking.openURL(ref.licenseUrl).catch(()=>setLinkMessage('The licence link needs a connection.'));}}/>{!!linkMessage&&<Copy muted>{linkMessage}</Copy>}<Copy muted>{ref.author} · {ref.license}. Native posters/video are derivatives of the attributed source. References are independent of the simulated patient.</Copy></Card>;
}
