import '@fontsource-variable/roboto';
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ThemeProvider} from '@/theme';
import {ErrorBoundary} from '@/components/ErrorBoundary';
import {NativeEyeExam} from '@/simulator/NativeEyeExam';
import {PhysiologyKernel} from '@simulator/engine/PhysiologyKernel';
import {NativeEcgSheet} from '@/simulator/NativeEcgSheet';
import {Action,ui} from '@/simulator/SimulatorUi';
function Preview(){const [rhythm,setRhythm]=useState('sinus'),[eye,setEye]=useState(false);const pathology=new PhysiologyKernel('normal').pathology;return <View style={{flex:1}}><Action label={eye?'Open ECG':'Open eye examination'} onPress={()=>setEye(!eye)}/><View style={ui.row}>{['sinus','stemi_inferior','hyperkalemia','afib','vfib','tamponade'].map(r=><Action key={r} label={r} onPress={()=>setRhythm(r)}/>)}</View>{eye?<NativeEyeExam pathology={pathology}/>:<NativeEcgSheet rhythm={rhythm} heartRate={75}/>}</View>;}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><SafeAreaProvider><ThemeProvider initialPreference="dark"><Preview/></ThemeProvider></SafeAreaProvider></ErrorBoundary>);
