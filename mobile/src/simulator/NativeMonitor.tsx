import React from 'react';
import {ScrollView,View} from 'react-native';
import Svg,{Path} from 'react-native-svg';
import {Text} from '@/components/Text';
import {typeScale} from '@/theme/typography';
import type {PatientVitals,TelemetryWaveformSample} from '@simulator/types';
import {Card,Copy,ui} from './SimulatorUi';
export function NativeMonitor({vitals,samples,rhythm}:{vitals:PatientVitals;samples:TelemetryWaveformSample[];rhythm:string}){
 const traces=[{key:'ecg' as const,name:'ECG · '+rhythm,min:-.6,max:1.6,color:'#69dab2'},{key:'artLine' as const,name:'Arterial pressure · mmHg',min:0,max:200,color:'#f48d9b'},{key:'pleth' as const,name:'Pulse oximeter',min:0,max:1.2,color:'#83c9ee'},{key:'capno' as const,name:'Capnography · mmHg',min:0,max:60,color:'#f2ce71'}];
 const values=[['Heart rate',Math.round(vitals.heartRate)+' bpm'],['Blood pressure',Math.round(vitals.bpSystolic)+' / '+Math.round(vitals.bpDiastolic)+' mmHg'],['SpO₂',Math.round(vitals.spo2)+'%'],['Respiratory rate',Math.round(vitals.respiratoryRate)+' /min'],['MAP',Math.round(vitals.meanArterialPressure)+' mmHg'],['Temperature',vitals.temperature.toFixed(1)+' °C'],['CVP',vitals.cvp.toFixed(1)+' mmHg'],['EtCO₂',Math.round(vitals.etco2)+' mmHg'],['Lactate',vitals.lactate.toFixed(1)+' mmol/L'],['GCS',Math.round(vitals.gcs)+' / 15']];
 return <ScrollView contentContainerStyle={ui.page}><Copy muted>Simulated teaching waveforms</Copy>{traces.map(t=><Card key={t.key} title={t.name}><Svg viewBox="0 0 360 90" width="100%" height={90} accessibilityLabel={t.name}><Path d={samples.map((p,i)=>`${i?'L':'M'} ${i/Math.max(1,samples.length-1)*360} ${85-(p[t.key]-t.min)/(t.max-t.min)*75}`).join(' ')} fill="none" stroke={t.color} strokeWidth={1.6}/></Svg></Card>)}<View style={ui.row}>{values.map(([name,value])=><View key={name} style={{minWidth:140,flexGrow:1}}><Card><Copy muted>{name}</Copy><Text style={[typeScale.title3,{color:'#83c9ee'}]}>{value}</Text></Card></View>)}</View></ScrollView>;
}
