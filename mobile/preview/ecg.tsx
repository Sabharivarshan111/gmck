import '@fontsource-variable/roboto';
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ThemeProvider} from '@/theme';
import {ErrorBoundary} from '@/components/ErrorBoundary';
import {NativeEcgStudio} from '@/simulator/NativeEcgStudio';
import {NativePocus} from '@/simulator/NativePocus';
import {NativeBedsideExam} from '@/simulator/NativeBedsideExam';
import {NativeAuscultation} from '@/simulator/NativeAuscultation';
import {NativeEyeExam} from '@/simulator/NativeEyeExam';
import {PhysiologyKernel} from '@simulator/engine/PhysiologyKernel';
import {NativeEcgSheet} from '@/simulator/NativeEcgSheet';
import {Action,ui} from '@/simulator/SimulatorUi';
function Preview(){const [studio,setStudio]=useState(false),[rhythm,setRhythm]=useState('sinus'),[eye,setEye]=useState(false),[audio,setAudio]=useState(false),[bedside,setBedside]=useState(false),[pocus,setPocus]=useState(false);const pathology=new PhysiologyKernel('normal').pathology;return <View style={{flex:1}}><Action label={studio?'Close ECG studio':'Open ECG studio'} onPress={()=>setStudio(!studio)}/><Action label={pocus?'Close ultrasound':'Open ultrasound'} onPress={()=>setPocus(!pocus)}/><Action label={bedside?'Close bedside examination':'Open bedside examination'} onPress={()=>setBedside(!bedside)}/><Action label={audio?'Close auscultation':'Open auscultation'} onPress={()=>setAudio(!audio)}/><Action label={eye?'Open ECG':'Open eye examination'} onPress={()=>setEye(!eye)}/><View style={ui.row}>{['sinus','stemi_inferior','hyperkalemia','afib','vfib','tamponade'].map(r=><Action key={r} label={r} onPress={()=>setRhythm(r)}/>)}</View>{studio?<NativeEcgStudio/>:pocus?<NativePocus vitals={new PhysiologyKernel('normal').vitals} pathology={pathology} scenarioId="normal"/>:bedside?<NativeBedsideExam pathology={pathology} vitals={new PhysiologyKernel('normal').vitals}/>:audio?<NativeAuscultation pathology={pathology} vitals={new PhysiologyKernel('normal').vitals} scenarioId="normal"/>:eye?<NativeEyeExam pathology={pathology}/>:<NativeEcgSheet rhythm={rhythm} heartRate={75}/>}</View>;}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><SafeAreaProvider><ThemeProvider initialPreference="dark"><Preview/></ThemeProvider></SafeAreaProvider></ErrorBoundary>);
