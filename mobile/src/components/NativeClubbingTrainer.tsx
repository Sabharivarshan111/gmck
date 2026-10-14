import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import Radiology from '@/native/NativeOrbitRadiology';

/** Same independent teaching skill as the Vercel ClubbingTrainer. */
export default function NativeClubbingTrainer({ onBack }: { onBack: () => void }) {
  const insets=useSafeAreaInsets();
  const [mode,setMode]=useState<'normal'|'clubbing'>('normal');
  const [answer,setAnswer]=useState(false), [steps,setSteps]=useState(false);
  const [image,setImage]=useState(''), [error,setError]=useState('');
  useEffect(() => {
    if (mode!=='clubbing'||image) return;
    let cancelled=false;
    if (!Radiology) { setError('Native image renderer unavailable.'); return; }
    Radiology.renderXray('clinical-reference/clubbing.jpg',1,1).then(json => { if(!cancelled) setImage(JSON.parse(json).uri); }).catch(e => {if(!cancelled) setError(String(e.message||e));});
    return () => {cancelled=true;};
  },[mode,image]);
  const button=(label: string,onPress: () => void,selected=false) => <Touchable key={label} label={label} onPress={onPress} state={{selected}} style={[styles.button,{backgroundColor:selected?'#0f766e':'#f8fafc'}]}><Text style={{color:selected?'#fff':'#0f172a',fontWeight:'700'}}>{label}</Text></Touchable>;
  return <View style={[styles.screen,{paddingTop:insets.top}]}>
    <View style={styles.header}><Text style={styles.title}>Clubbing examination</Text>{button('Close clubbing skill',onBack)}</View>
    <ScrollView contentContainerStyle={{padding:16,paddingBottom:insets.bottom+32,gap:16}}>
      <Text style={styles.muted}>Independent teaching skill. These examples do not assign clubbing to the selected patient case.</Text>
      <View style={{flexDirection:'row',gap:8}}>{(['normal','clubbing'] as const).map(v => button(v==='normal'?'Normal findings':'Clubbing findings',() => {setMode(v);setAnswer(false);},mode===v))}</View>
      {mode==='clubbing' && <View>{image?<Image source={{uri:image}} style={{height:288,width:'100%',backgroundColor:'#f1f5f9',borderRadius:12}} resizeMode="contain" accessibilityLabel="Clinical reference photograph of enlarged distal fingers with convex nails"/>:error?<Text accessibilityRole="alert" style={styles.muted}>{error}</Text>:<ActivityIndicator color="#0f766e"/>}<Text style={styles.muted}>Inspect the terminal phalanges and nail curvature; a photograph alone cannot assess nail-bed fluctuation.</Text></View>}
      <View style={[styles.card,{backgroundColor:'#f0fdfa'}]}><Text style={styles.title}>{mode==='normal'?'What should I find normally?':'What changes in clubbing?'}</Text>{(mode==='normal'?['No bulbous enlargement of the fingertips.','The nail folds form an angle below 180°; the nail bed feels firm.','A diamond-shaped window remains when corresponding fingernails are opposed.']:['Increased nail curvature and bulbous terminal phalanges.','Loss of the normal nail-fold angle, progressing beyond 180°.','Nail-bed sponginess may be an early finding.','Schamroth window may be lost. Interpret with the full examination.']).map(t => <Text style={styles.ink} key={t}>• {t}</Text>)}</View>
      <View style={styles.card}>{button('How to examine & why',() => setSteps(x => !x),steps)}{steps && ['Inspect fingers from the side for the nail-fold angle and distal enlargement.','Gently palpate the nail bed for fluctuation or sponginess.','Ask the patient to oppose corresponding nails; look for the diamond window (Schamroth test).','Compare both hands and examine the toes. Ask about duration and family history.','Investigate the clinical context, including pulmonary, cardiac and gastrointestinal disease. Clubbing itself does not diagnose a cause.'].map((t,i) => <Text style={styles.ink} key={t}>{i+1}. {t}</Text>)}</View>
      <View style={styles.card}><Text style={styles.title}>Viva: does asthma usually cause clubbing?</Text>{button(answer?'Hide answer':'Reveal answer',() => setAnswer(x => !x))}{answer && <Text style={styles.ink}>No. Look for another cause, such as bronchiectasis, if a patient labelled as having asthma has clubbing.</Text>}</View>
      {button('Nail clubbing examination',() => {void Linking.openURL('https://www.ncbi.nlm.nih.gov/books/NBK539713/').catch(() => setError('Unable to open reference.'));})}
    </ScrollView>
  </View>;
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:'#fff'},header:{padding:16,borderBottomWidth:1,borderColor:'#e2e8f0',gap:8},title:{color:'#0f172a',fontWeight:'700',fontSize:16},ink:{color:'#0f172a',lineHeight:22},muted:{color:'#475569',fontSize:13,lineHeight:20},button:{minHeight:48,padding:12,borderRadius:12,borderWidth:1,borderColor:'#cbd5e1',justifyContent:'center',flexShrink:1},card:{padding:16,borderRadius:12,borderWidth:1,borderColor:'#e2e8f0',gap:10}});
