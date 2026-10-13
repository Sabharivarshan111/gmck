import React,{useState} from 'react';
import {FlatList,ScrollView,TextInput} from 'react-native';
import {Sheet} from '@/components/Sheet';
import {Touchable} from '@/components/Touchable';
import {useTheme} from '@/theme';
import {SCENARIOS,type ExtendedScenarioDefinition} from '@simulator/engine/PhysiologyKernel';
import {SIMULATOR_ACTIONS} from './lessonCatalog';
import {Action,Card,Copy,ui} from './SimulatorUi';
export function NativeCases({scenario,logs,onScenario,onAction}:{scenario:ExtendedScenarioDefinition;logs:readonly string[];onScenario:(id:string)=>void;onAction:(id:string)=>void}){
 const {colors}=useTheme();const [choose,setChoose]=useState(false),[query,setQuery]=useState('');
 return <ScrollView contentContainerStyle={ui.page}>
  <Card title={scenario.title}><Copy>{scenario.subtitle}</Copy><Copy>{scenario.history}</Copy><Action label={'Choose case · '+SCENARIOS.length+' scenarios'} onPress={()=>setChoose(true)}/></Card>
  {[...new Set(SIMULATOR_ACTIONS.map(a=>a.cat))].map(cat=><Card key={cat} title={cat}>{SIMULATOR_ACTIONS.filter(a=>a.cat===cat).map(a=><Action key={a.id} label={a.label} onPress={()=>onAction(a.id)}/>)}</Card>)}
  <Card title="Session feedback">{logs.slice(-20).reverse().map((log,i)=><Copy key={i}>{log}</Copy>)}</Card>
  <Sheet visible={choose} onClose={()=>setChoose(false)} title="Offline clinical scenarios" scrollable={false}>
   <TextInput accessibilityLabel="Search clinical cases" value={query} onChangeText={setQuery} placeholder="Search condition or system" placeholderTextColor={colors.textMuted} style={{minHeight:44,color:colors.text,padding:12,borderWidth:1,borderColor:colors.border,borderRadius:12}}/>
   <FlatList style={{maxHeight:420}} data={SCENARIOS.filter(c=>`${c.title} ${c.category} ${c.history}`.toLowerCase().includes(query.toLowerCase()))} keyExtractor={c=>c.id} initialNumToRender={10} renderItem={({item})=><Touchable label={'Start '+item.title} onPress={()=>{onScenario(item.id);setChoose(false);}} style={{minHeight:60,paddingVertical:12}}><Copy>{item.title}</Copy><Copy muted>{item.category}</Copy></Touchable>}/>
  </Sheet>
 </ScrollView>;
}
