import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { QuestionRow } from '@/components/QuestionRow';
import { SingleQuestionNote } from '@/components/SingleQuestionNote';
import { useTheme } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { SegmentedControl } from '@/components/ui';
import type { HomeStackParamList, RootTabParamList } from '@/navigation/types';
import type { YearKey } from '@/lib/questionBank';
import { noteQuestionText } from '@/lib/questionText';
import { hasTextbook } from '@/lib/textbooks';
import { loadUniversityOfflineSubject, offlineUniversitySubjects, UNIVERSITY_OFFLINE_MANIFEST } from '@/lib/universityOfflineBank';
import type { OfflineUniversity, OfflineUniversityYear, OfflineUniversityQuestion } from '@/lib/universityOfflineTypes';

type Kind = 'essay'|'short-notes'|'unknown';
type ListItem = {kind:'subject';name:string;count:number} |
  {kind:'chapter';name:string;count:number} | {kind:'question';row:OfflineUniversityQuestion};
const YEARS: {key: OfflineUniversityYear;label:string}[] = [
  {key:'first-year',label:'1st'}, {key:'second-year',label:'2nd'},
  {key:'third-year',label:'3rd'}, {key:'final-year',label:'Final'}
];
const TAB_OPTIONS: {key:Kind;label:string}[] = [
  {key:'essay',label:'Essay'},{key:'short-notes',label:'Short Notes'},{key:'unknown',label:'Other'}
];
const LABEL:Record<OfflineUniversityYear,string> = {
  'first-year':'1st Year','second-year':'2nd Year',
  'third-year':'3rd Year Part 1','final-year':'Final Year'
};
const topicKey=(name:string)=>name.toLowerCase().replace(/&/g,'').replace(/\s+/g,'-').replace(/-+$/,'');
export default function OfflineUniversityBankScreen({university,initialYear,onSwitchBack}:{
  university:OfflineUniversity;initialYear:YearKey;onSwitchBack:()=>void;
}){
  const {colors}=useTheme();
  const insets=useSafeAreaInsets();
  const navigation=useNavigation<NativeStackNavigationProp<HomeStackParamList,'BrowseHome'>>();
  const [year,setYear]=useState<OfflineUniversityYear>(initialYear);
  const [subject,setSubject]=useState<string|null>(null);
  const [chapter,setChapter]=useState<string|null>(null);
  const [tab,setTab]=useState<Kind>('essay');
  const [search,setSearch]=useState('');
  const [rows,setRows]=useState<OfflineUniversityQuestion[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [retry,setRetry]=useState(0);
  const [noted,setNoted]=useState<OfflineUniversityQuestion|null>(null);

  const subjects=useMemo(()=>offlineUniversitySubjects(university,year),[university,year]);
  const chosen=subjects.find(p=>p.subject===subject);
  useEffect(()=>{
    if(!subject){setRows([]);return;}
    let live=true;
    setLoading(true);setError('');setRows([]);
    void loadUniversityOfflineSubject(university,year,subject)
      .then(all=>{if(live)setRows(all);})
      .catch(e=>{if(live)setError(e instanceof Error?e.message:'Could not read offline questions');})
      .finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[university,year,subject,retry]);

  const chapters=useMemo(()=>{
    const counts=new Map<string,number>();
    for(const row of rows){const key=row.chapter?.trim()||'Other';counts.set(key,(counts.get(key)||0)+1);}
    return [...counts].map(([name,count])=>({kind:'chapter' as const,name,count})).sort((a,b)=>a.name.localeCompare(b.name));
  },[rows]);
  const questions=useMemo(()=>{
    const needle=search.trim().toLowerCase();
    return rows.filter(row=>(row.chapter?.trim()||'Other')===chapter&&
      (['essay','short-notes'].includes(row.question_type)?row.question_type: 'unknown')===tab &&
      (!needle||row.question_text.toLowerCase().includes(needle)));
  },[rows,chapter,tab,search]);

  const entries:ListItem[]= !subject?subjects.map(s=>({kind:'subject',name:s.subject,count:s.count})) :
    !chapter?chapters:questions.map(row=>({kind:'question',row}));
  const back=useCallback(()=>{
    if(chapter){setChapter(null);setSearch('');return;}
    if(subject){setSubject(null);setRows([]);return;}
    onSwitchBack();
  },[chapter,subject,onSwitchBack]);
  const askAi=useCallback((question:string)=>{
    navigation.getParent<BottomTabNavigationProp<RootTabParamList>>()?.navigate('AskAI',{question,nonce:Date.now()});
  },[navigation]);
  const key=subject?topicKey(subject):'';
  const universityName=university.toUpperCase();

  return <KeyboardSafe>
    <View style={{flex:1,backgroundColor:colors.background,paddingTop:insets.top+8,paddingHorizontal:16}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:12,marginBottom:12}}>
        <Touchable label="Back" onPress={back} style={{borderWidth:1,borderColor:colors.border,borderRadius:10,padding:10}}>
          <Text style={{color:colors.text}}>‹ Back</Text>
        </Touchable>
        <View style={{flex:1}}>
          <Text style={{fontWeight:'800',fontSize:18,color:colors.text}}>
            {universityName} — {subject??'Offline Question Bank'}
          </Text>
          <Text style={{fontSize:12,color:colors.textMuted}}>{chapter??'1st through Final MBBS · No internet required'}</Text>
        </View>
      </View>
      <View style={{padding:12,borderWidth:1,borderColor:colors.border,borderRadius:12,marginBottom:12}}>
        <Text style={{fontSize:12,fontWeight:'700',color:colors.text}}>
          {UNIVERSITY_OFFLINE_MANIFEST.totals[university].toLocaleString()} questions bundled on this device
        </Text>
        <Text style={{fontSize:11,color:colors.textMuted,marginTop:4}}>
          Source questions from PDF scans. Some OCR-derived wording or dates may need correction; source checking is not implied by offline availability.
        </Text>
      </View>
      {!subject?<SegmentedControl options={YEARS.map(x=>({key:x.key,label:x.label}))} value={year}
        onChange={(next:OfflineUniversityYear)=>{setYear(next);setChapter(null);setRows([]);setSearch('');}}/>:null}
      {subject&&!chapter&&!loading?<Text style={{fontSize:12,color:colors.textMuted,marginVertical:10}}>
        {rows.length} offline questions · choose a chapter
      </Text>:null}
      {chapter?<View style={{gap:10,marginTop:10,marginBottom:12}}>
        <SegmentedControl value={tab} onChange={(next:Kind)=>{setTab(next);setSearch('');}}
          options={university==='rguhs'?TAB_OPTIONS:TAB_OPTIONS.filter(option=>option.key!=='unknown')}/>
        <TextInput placeholder="Search this chapter" placeholderTextColor={colors.textMuted} value={search}
          onChangeText={setSearch} style={{paddingHorizontal:12,paddingVertical:10,color:colors.text,
            borderColor:colors.border,borderWidth:1,borderRadius:10,backgroundColor:colors.card}}/>
        <Text style={{color:colors.textMuted,fontSize:12}}>{questions.length} matching questions</Text>
      </View>:null}
      {loading?<ActivityIndicator color={colors.primary} style={{margin:20}}/>:null}
      {error?<Touchable onPress={()=>setRetry(x=>x+1)} label="Retry reading bundled questions">
        <Text style={{color:colors.danger}}>{error}. Tap to retry.</Text>
      </Touchable>:null}
      {!loading&&!error?<FlatList data={entries}
        keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:40}}
        keyExtractor={item=>item.kind==='question'?item.row.id:item.name}
        ListEmptyComponent={<Text style={{padding:16,color:colors.textMuted}}>
          {subjects.length?'No questions in this section.':'Offline questions missing from this APK. Install the latest Android version.'}
        </Text>}
        renderItem={({item,index})=>{
          if(item.kind==='question')return <View style={{marginBottom:14}}>
            <QuestionRow question={item.row.question_text} index={index} onAskAi={askAi}
              onNote={subject&&hasTextbook(key,subject)?()=>setNoted(item.row):undefined}
              repeatCountOverride={item.row.quality_status==='verified'?item.row.exam_dates.length:0}/>
            <Text style={{color:colors.textMuted,fontSize:11,paddingLeft:10}}>
              {item.row.source_pdf?item.row.source_pdf+' · ':''}
              {item.row.source_page!=null?'PDF page '+item.row.source_page:'PDF reference'}
              {item.row.exam_dates?.length?' · '+[...new Set(item.row.exam_dates)].join(', '):''}
              {['verified','source_page_reviewed','reviewed_against_pdf'].includes(item.row.quality_status)?' · Source checked':''}
            </Text>
          </View>;
          return <Touchable label={item.name} onPress={()=>{
            if(item.kind==='subject'){setSubject(item.name);setChapter(null);}
            else {setChapter(item.name);setTab('essay');setSearch('');}
          }} style={{flexDirection:'row',alignItems:'center',padding:16,marginBottom:10,
            backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:14}}>
            <View style={{flex:1}}>
              <Text style={{color:colors.text,fontWeight:'700'}}>{item.name}</Text>
              <Text style={{color:colors.textMuted,fontSize:12}}>{item.count} offline questions</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted}/>
          </Touchable>;
        }}/>
      :null}
      {!subject?<Touchable label={'Switch to existing reviewed '+universityName+' bank'} onPress={onSwitchBack}
        style={{paddingVertical:12}}><Text style={{color:colors.cyan}}>Open existing reviewed {universityName} bank</Text></Touchable>:null}
      <SingleQuestionNote question={noted?noteQuestionText(noted.question_text):null}
        rawQuestion={noted?.question_text??null} subjectKey={key}
        subjectName={subject??''} yearLabel={LABEL[year]} university={university}
        onClose={()=>setNoted(null)}/>
    </View>
  </KeyboardSafe>;
}
