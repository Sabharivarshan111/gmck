import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { supabase } from '@/lib/supabase';
import type { PgExam, PgQuestion } from '@/lib/pgEntranceBank';

type Review = {
  status: string; answer: string; explanation: string;
  answer_comparison?: string; retrieval_fallback?: string | null;
  references?: {id:string; ocr_page:number|null; paragraph_id:string; passage_sha256:string}[];
};
const SUBJECTS = ['Medicine', 'Anatomy', 'Physiology', 'Pathology', 'Microbiology',
  'Pharmacology', 'Community Medicine', 'Obstetrics', 'Surgery', 'Paediatrics',
  'Biochemistry', 'Ophthalmology', 'ENT', 'Forensic Medicine', 'Orthopaedics',
  'Psychiatry', 'Dermatology', 'Radiology', 'Anaesthesia'];
const ALIASES: Record<string,string> = {'pediatrics':'Paediatrics',
  'social & preventive medicine':'Community Medicine', 'skin':'Dermatology',
  'gynaecology & obstetrics':'Obstetrics'};
type Exam = 'ALL' | PgExam | 'GENERAL_MEDICAL';

/** Private, metered textbook interpretation. Results never replace a dataset key. */
export function PgRecentAnswerReview({exam, year, onYear, initialQuestion}: {
  exam:Exam; year:number|null; onYear:(value:number|null)=>void; initialQuestion?:PgQuestion|null;
}) {
  const {colors} = useTheme();
  const [subject,setSubject] = useState('Medicine');
  const [question,setQuestion] = useState('');
  const [options,setOptions] = useState(['','','','']);
  const [sourceUrl,setSourceUrl] = useState('');
  const [result,setResult] = useState<Review|null>(null);
  const [error,setError] = useState('');
  const [checking,setChecking] = useState(false);
  useEffect(() => {
    if (!initialQuestion) return;
    setQuestion(initialQuestion.question); setOptions([...initialQuestion.options]);
    setSourceUrl(initialQuestion.source_url ?? '');
    setSubject(ALIASES[initialQuestion.subject.toLowerCase()] ?? SUBJECTS.find(s =>
      s.toLowerCase() === initialQuestion.subject.toLowerCase()) ?? '');
    setResult(null);setError('');
  },[initialQuestion]);
  useEffect(() => {setResult(null);setError('');},[exam,year]);
  const fingerprint = useRef('');
  fingerprint.current = JSON.stringify([exam,year,subject,question,options,sourceUrl,initialQuestion?.id]);
  const unchanged = initialQuestion && question === initialQuestion.question &&
    options.every((v,i) => v === initialQuestion.options[i]);
  const selectedExam = exam === 'ALL' && initialQuestion ?
    initialQuestion.exam === 'ORIGINAL' ? 'GENERAL_MEDICAL' : initialQuestion.exam : exam;
  const validYear = year === null || (Number.isInteger(year) && year >= 1991 && year <= 2026);
  const valid = validYear && !!subject && selectedExam !== 'ALL' && question.trim().length >= 12 &&
    options.every(v => v.trim()) && new Set(options.map(v => v.trim().toLowerCase())).size === 4 && !checking;
  const clear = () => {setResult(null);setError('');};
  async function checkAnswer() {
    if (!valid) return;
    const snapshot = fingerprint.current;
    setChecking(true);clear();
    try {
      const {data:{session}} = await supabase.auth.getSession();
      if (fingerprint.current !== snapshot) return;
      if (!session?.access_token) {
        setError('Sign in with Google first (My Progress). Private textbook checking requires an authenticated session.');
        return;
      }
      const {data,error:requestError} = await supabase.functions.invoke('pg-answer-review',{
        body:{exam:selectedExam,exam_year:year,subject,question:question.trim(),
          options:options.map(v => v.trim()),
          ...(unchanged ? {supplied_answer:initialQuestion.answer,question_id:initialQuestion.id} : {}),
          ...(sourceUrl.trim() ? {source_url:sourceUrl.trim()} : {})},
      });
      if (fingerprint.current !== snapshot) return;
      let payload = data;
      if (requestError) {
        try {
          const context = (requestError as {context?:Response}).context;
          if (context) payload = await context.json();
        } catch { /* Safe fallback below. */ }
        if (fingerprint.current !== snapshot) return;
        if (payload?.answer !== 'UNRESOLVED') {
          setError(typeof payload?.error === 'string' ? payload.error : 'Textbook check unavailable. Check sign-in, connection and quota.');
          return;
        }
      }
      if (!['textbook_provisional','unresolved'].includes(payload?.status) ||
        !['A','B','C','D','UNRESOLVED'].includes(payload?.answer) ||
        (payload.answer !== 'UNRESOLVED' && typeof payload.explanation !== 'string')) {
        setError(typeof payload?.error === 'string' ? payload.error : 'No supported answer available.');return;
      }
      setResult({...payload,explanation:payload.explanation || payload.error || 'No supported answer available.'});
    } catch {
      if (fingerprint.current === snapshot) setError('Textbook answer check is unavailable. No answer has been assumed.');
    } finally {setChecking(false);}
  }
  const inputStyle = [styles.input,{borderColor:colors.border,color:colors.text}];
  return <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}>
    <Text style={[styles.title,{color:colors.text}]}>Check an answer against textbooks</Text>
    <Text style={[styles.details,{color:colors.textMuted}]}>
      Paste a question you have permission to use. Supabase textbook evidence provides a provisional explanation.
      It does not verify an exam year or create an official answer key.
    </Text>
    <View style={styles.wrap}>{[2023,2024,2025,2026].map(y =>
      <Touchable key={y} label={'Recall year '+y} state={{selected:year===y}}
        onPress={() => {onYear(y);clear();}} style={[styles.chip,{borderColor:colors.border,
          backgroundColor:year===y?withAlpha(colors.primary,0.17):colors.background}]}>
        <Text style={{color:colors.text}}>{y}</Text>
      </Touchable>)}
      <Touchable label="Use unknown question year" onPress={() => {onYear(null);clear();}}
        style={[styles.chip,{borderColor:colors.border}]}><Text style={{color:colors.text}}>Year unknown / undated</Text></Touchable>
    </View>
    <Text style={[styles.details,{color:colors.textMuted}]}>Year: {year ?? 'unknown'}. Historical years 1991–2026 are supported using the filter above.</Text>
    {unchanged ? <Text style={[styles.details,{color:colors.textMuted}]}>Comparing supplied answer {initialQuestion.answer} for {initialQuestion.id}. Confirm the subject below.</Text> : null}
    {selectedExam === 'ALL' ? <Text style={[styles.details,{color:colors.textMuted}]}>Select NEET-PG, INI-CET, FMGE or Mock practice above.</Text> : null}
    <Text style={[styles.label,{color:colors.textMuted}]}>SUBJECT</Text>
    {!subject ? <Text style={[styles.details,{color:colors.warning}]}>This source subject has no dedicated reference mapping. Select an appropriate supported subject or leave the answer unresolved.</Text> : null}
    <View style={styles.wrap}>{SUBJECTS.map(s =>
      <Touchable key={s} label={'Subject '+s} state={{selected:subject===s}}
        onPress={() => {setSubject(s);clear();}}
        style={[styles.chip,{borderColor:colors.border,backgroundColor:subject===s?withAlpha(colors.primary,0.17):colors.background}]}>
        <Text style={{color:colors.text,fontSize:11}}>{s}</Text>
      </Touchable>)}</View>
    <Text style={[styles.label,{color:colors.textMuted}]}>QUESTION</Text>
    <TextInput multiline value={question} maxLength={1300} accessibilityLabel="Paste a medical practice question you own or have permission to use"
      onChangeText={v => {setQuestion(v);clear();}} placeholder="Paste your own or permitted question stem"
      placeholderTextColor={colors.textMuted} style={[...inputStyle,styles.multiline]} />
    {options.map((v,i) => <TextInput key={i} value={v} maxLength={450}
      accessibilityLabel={'MCQ option '+'ABCD'[i]} placeholder={'Option '+'ABCD'[i]}
      onChangeText={text => {setOptions(old => old.map((o,j)=>i===j?text:o));clear();}}
      placeholderTextColor={colors.textMuted} style={inputStyle} />)}
    <TextInput value={sourceUrl} maxLength={600} autoCapitalize="none" keyboardType="url"
      accessibilityLabel="Optional permitted question source URL" placeholder="Source URL (optional, HTTPS)"
      onChangeText={v => {setSourceUrl(v);clear();}} placeholderTextColor={colors.textMuted} style={inputStyle} />
    <Touchable label="Check options against textbooks" disabled={!valid} state={{busy:checking}}
      onPress={() => {void checkAnswer();}} style={[styles.action,{borderColor:colors.border,
        backgroundColor:valid?withAlpha(colors.primary,0.20):colors.background}]}>
      {checking ? <ActivityIndicator color={colors.primary} /> : null}
      <Text style={{color:colors.text,fontWeight:'800'}}>Check against Supabase textbooks</Text>
    </Touchable>
    {error ? <Text style={[styles.details,{color:colors.danger}]}>{error}</Text> : null}
    {result ? <View style={[styles.result,{borderColor:colors.border}]}>
      <Text style={[styles.title,{color:colors.text}]}>{result.answer === 'UNRESOLVED' ? 'Unable to resolve' : 'Provisional answer: '+result.answer}</Text>
      <Text style={[styles.details,{color:colors.text}]}>{result.explanation}</Text>
      {result.answer_comparison ? <Text style={[styles.details,{color:colors.text}]}>Supplied key: {result.answer_comparison.replaceAll('_',' ')}.</Text> : null}
      {result.retrieval_fallback ? <Text style={[styles.details,{color:colors.warning}]}>{result.retrieval_fallback}</Text> : null}
      {Array.isArray(result.references) ? result.references.map((ref,i) =>
        <Text key={ref.id} style={[styles.details,{color:colors.textMuted}]}>Textbook reference {i+1} · OCR page {ref.ocr_page ?? 'unknown'} · {ref.paragraph_id} · SHA-256 {ref.passage_sha256.slice(0,12)}…</Text>) : null}
      <Text style={[styles.details,{color:colors.textMuted}]}>AI interpretation only. Neither the source year nor answer has been independently verified. The supplied key is unchanged.</Text>
    </View> : null}
  </View>;
}
const styles=StyleSheet.create({
  card:{borderWidth:1,borderRadius:16,padding:14,gap:10},title:{fontSize:15,fontWeight:'800'},
  details:{fontSize:12,lineHeight:18},label:{fontSize:11,fontWeight:'700'},
  wrap:{flexDirection:'row',flexWrap:'wrap',gap:6},
  chip:{borderWidth:1,borderRadius:12,paddingHorizontal:10,minHeight:44,justifyContent:'center'},
  input:{borderWidth:1,borderRadius:10,fontSize:13,minHeight:44,paddingHorizontal:12,paddingVertical:10},
  multiline:{minHeight:94,textAlignVertical:'top'},
  action:{borderWidth:1,borderRadius:12,minHeight:48,alignItems:'center',flexDirection:'row',gap:8,justifyContent:'center'},
  result:{borderTopWidth:1,paddingTop:12,gap:8},
});
