import React,{useMemo,useState} from 'react';
import {ScrollView,View} from 'react-native';
import Svg,{Circle,Defs,Ellipse,G,Line,Path,ClipPath,Text as SvgText} from 'react-native-svg';
import {EYE_FINDINGS,resolveEyeExam} from '@simulator/instruments/eye/eyeExamModel';
import type {EyeExamInput,EyeResponse,EyeSide} from '@simulator/instruments/eye/eyeExamModel';
import type {PatientPathologyState} from '@simulator/types';
import {Action,Card,Copy,ui} from './SimulatorUi';
const initial:EyeExamInput={finding:'case',affected:'right',gaze:{x:0,y:0},light:'none',cotton:null,liftLids:false,action:'rest'};
function Eye({side,x,response,light,tint}:{side:EyeSide;x:number;response:EyeResponse;light:boolean;tint:number}){
 const irisX=x+response.x*15,irisY=130+response.y*9,closed=response.lid>=1;
 const pupilRadius=response.pupil/12*23;
 return <G><Defs><ClipPath id={`eye-${side}`}><Ellipse cx={x} cy={130} rx={58} ry={28}/></ClipPath></Defs>
  <Ellipse cx={x} cy={130} rx={58} ry={28} fill={tint>.15?'#e9dfaa':'#eef0eb'} stroke="#a3b4c3" strokeWidth={1.4}/>
  <G clipPath={`url(#eye-${side})`}><Circle cx={irisX} cy={irisY} r={23} fill="#626b57"/><Circle cx={irisX} cy={irisY} r={18} fill="none" stroke="#424c3d" strokeWidth={2}/><Circle cx={irisX} cy={irisY} r={pupilRadius} fill="#080d10"/><Circle cx={irisX-5} cy={irisY-8} r={2.5} fill="#f5f6e9"/>
   {response.lid>0&&<Path d={`M${x-65} 95H${x+65}V${102+response.lid*58}Q${x} ${116+response.lid*48} ${x-65} ${102+response.lid*58}Z`} fill="#bd8f79"/>}
  </G>
  {closed&&<Path d={`M${x-57} 132Q${x} 141 ${x+57} 132`} stroke="#725647" strokeWidth={2} fill="none"/>}
  <Path d={`M${x-50} ${79-response.brow*9}Q${x} ${68-response.brow*9} ${x+50} ${79-response.brow*9}`} fill="none" stroke="#99755c" strokeWidth={5} strokeLinecap="round"/>
  {light&&<><Path d={`M${x-66} 175L${x-10} 145L${x+10} 145Z`} fill="#edc96b" opacity={.18}/><Line x1={x-66} y1={175} x2={x-10} y2={145} stroke="#edc96b" strokeWidth={1}/></>}
  <SvgText x={x} y={45} fill="#b7c5d3" fontSize={13} textAnchor="middle">Patient {side}</SvgText>
  <Line x1={irisX} y1={irisY+8} x2={x} y2={205} stroke="#87aab6" strokeWidth={1.1}/><Circle cx={irisX} cy={irisY+8} r={2.5} fill="#87aab6"/>
  <SvgText x={x} y={224} fill="#dce5ec" fontSize={13} textAnchor="middle">{response.pupil.toFixed(1)} mm</SvgText>
 </G>;
}
export function NativeEyeExam({pathology}:{pathology:PatientPathologyState}){
 const [input,setInput]=useState<EyeExamInput>(initial);
 const update=(patch:Partial<EyeExamInput>)=>setInput(current=>({...current,...patch}));
 const response=useMemo(()=>resolveEyeExam(input,pathology),[input,pathology]);
 const note=EYE_FINDINGS.find(f=>f.id===input.finding)?.note;
 return <ScrollView contentContainerStyle={ui.page}>
  <Card title="Pupil & cranial nerve examination"><Copy>Examiner-facing view: the patient's right eye is on your left. Native schematic uses the same pupil and reflex model as the web simulator.</Copy><View testID="native-eye-stage" style={{backgroundColor:'#0a111b',borderRadius:16}}><Svg width="100%" height={250} viewBox="0 0 360 250"><Eye side="right" x={94} response={response.right} light={input.light==='right'||input.light==='both'} tint={input.finding==='case'?pathology.jaundice:0}/><Eye side="left" x={266} response={response.left} light={input.light==='left'||input.light==='both'} tint={input.finding==='case'?pathology.jaundice:0}/></Svg></View><Copy>Right pupil {response.right.pupil.toFixed(1)} mm · Left pupil {response.left.pupil.toFixed(1)} mm</Copy><Copy>{note}</Copy></Card>
  <Card title="Reference finding"><View style={ui.row}>{EYE_FINDINGS.map(f=><Action key={f.id} label={f.label} selected={input.finding===f.id} onPress={()=>update({finding:f.id,cotton:null,light:'none',action:'rest'})}/>)}</View><View style={ui.row}>{(['right','left'] as const).map(side=><Action key={side} label={`Affected ${side} side`} selected={input.affected===side} onPress={()=>update({affected:side})}/>)}</View></Card>
  <Card title="Direct & consensual light response"><View style={ui.row}>{(['none','right','left','both'] as const).map(light=><Action key={light} label={light==='none'?'Light off':`Light · ${light}`} selected={input.light===light} onPress={()=>update({light})}/>)}</View><Copy muted>Use alternating right and left illumination to compare responses. Diameters are illustrative model values.</Copy></Card>
  <Card title="Eye movements"><View style={ui.row}>{[[-1,-1],[0,-1],[1,-1],[-1,0],[0,0],[1,0],[-1,1],[0,1],[1,1]].map(([x,y])=><Action key={`${x},${y}`} label={`${['Left','Centre','Right'][x+1]} · ${['up','level','down'][y+1]}`} selected={input.gaze.x===x&&input.gaze.y===y} onPress={()=>update({gaze:{x,y}})}/>)}</View><Action label={input.liftLids?'Release upper lids':'Elevate upper lids'} selected={input.liftLids} onPress={()=>update({liftLids:!input.liftLids})}/></Card>
  <Card title="Corneal reflex & eyelid closure"><View style={ui.row}>{([null,'right','left'] as const).map(cotton=><Action key={cotton||'none'} label={cotton?`Cotton · ${cotton} cornea`:'Remove cotton'} selected={input.cotton===cotton} onPress={()=>update({cotton})}/>)}</View><Action label={input.action==='close'?'Open eyes':'Close eyes'} selected={input.action==='close'} onPress={()=>update({action:input.action==='close'?'rest':'close'})}/><Copy>Right blink: {response.right.blink?'present':'absent'} · Left blink: {response.left.blink?'present':'absent'}{input.cotton===null&&input.action!=='close'?' · no stimulus applied':''}</Copy></Card>
  <Action label="Reset eye examination" onPress={()=>setInput({...initial,gaze:{x:0,y:0}})}/>
 </ScrollView>;
}
