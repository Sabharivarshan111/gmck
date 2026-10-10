import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { supabase } from '@/lib/supabase';
import type { PgExam } from '@/lib/pgEntranceBank';

type Review = {
  status: string; answer: string; explanation: string; evidence: string;
  confidence: string; notice: string; independently_medically_reviewed: boolean;
};
const SUBJECTS = [
  'Medicine', 'Anatomy', 'Physiology', 'Pathology', 'Microbiology',
  'Pharmacology', 'Community Medicine', 'Obstetrics', 'Surgery',
  'Paediatrics', 'Biochemistry', 'Ophthalmology', 'ENT',
] as const;
const YEARS = [2023, 2024, 2025, 2026] as const;
type Exam = 'ALL' | PgExam;

/**
 * An optional server-backed aid for students with *their own* recalled MCQs.
 * An AI suggestion is never added to the distributed PYQ corpus. No book text
 * leaves the server. PgEntranceBankModal's KeyboardSafe lifts these inputs.
 */
export function PgRecentAnswerReview({
  exam, year, onYear,
}: {
  exam: Exam; year: number | null; onYear: (value: number) => void;
}) {
  const { colors } = useTheme();
  const [subject, setSubject] = useState<string>('Medicine');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['','','','']);
  const [sourceUrl, setSourceUrl] = useState('');
  const [result, setResult] = useState<Review | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const recentYear = year !== null && YEARS.includes(year as typeof YEARS[number]);
  const valid = recentYear && exam !== 'ALL' &&
    question.trim().length >= 12 && options.every(v => v.trim()) && !checking;

  async function checkAnswer() {
    if (!valid) return;
    setChecking(true); setResult(null); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Sign in with Google first (My Progress). Private textbook checking requires an authenticated session.');
        return;
      }
      const { data, error: requestError } = await supabase.functions.invoke('pg-answer-review', {
        body: {
          exam, exam_year: year, subject, question: question.trim(),
          options: options.map(o => o.trim()),
          ...(sourceUrl.trim() ? { source_url: sourceUrl.trim() } : {}),
        },
      });
      if (requestError) {
        setError('The secure textbook check could not complete. Check your sign-in, internet and quota.');
        return;
      }
      if (data?.status !== 'textbook_provisional' ||
          !['A', 'B', 'C', 'D', 'UNRESOLVED'].includes(data?.answer) ||
          typeof data.explanation !== 'string') {
        setError(typeof data?.error === 'string' ? data.error : 'No reliable textbook-grounded candidate available.');
        return;
      }
      setResult(data as Review);
    } catch {
      setError('Textbook answer check is unavailable. No answer has been assumed.');
    } finally { setChecking(false); }
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>2023–2026 · Check a recalled MCQ</Text>
      <Text style={[styles.details, { color: colors.textMuted }]}>
        Paste a question you have permission to use. Your private Supabase textbooks can
        provide a provisional explanation; this does not verify the examination year,
        confirm that the question appeared in an exam, or create an official answer key.
      </Text>
      <View style={styles.wrap}>
        {YEARS.map(y => (
          <Touchable key={y} label={'Recall year ' + y}
            state={{ selected: year === y }}
            onPress={() => { onYear(y); setResult(null); setError(''); }}
            style={[styles.chip, { borderColor: colors.border,
              backgroundColor: year === y ? withAlpha(colors.primary, 0.17) : colors.background }]}>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>{y}</Text>
          </Touchable>
        ))}
      </View>
      {exam === 'ALL' ? (
        <Text style={[styles.details, { color: colors.textMuted }]}>
          Select NEET-PG, INI-CET, or FMGE in the exam filters above.
        </Text>
      ) : null}
      <Text style={[styles.label, { color: colors.textMuted }]}>SUBJECT</Text>
      <View style={styles.wrap}>
        {SUBJECTS.map(s => (
          <Touchable key={s} label={'Subject ' + s} state={{selected:subject===s}}
            onPress={() => { setSubject(s); setResult(null); }}
            style={[styles.chip,{borderColor:colors.border,
              backgroundColor:subject===s?withAlpha(colors.primary,0.17):colors.background}]}>
            <Text style={{ color: colors.text, fontSize: 11 }}>{s}</Text>
          </Touchable>
        ))}
      </View>
      <Text style={[styles.label, { color: colors.textMuted }]}>RECALLED QUESTION</Text>
      <TextInput multiline value={question}
        onChangeText={v => { setQuestion(v); setResult(null); }}
        accessibilityLabel="Paste recalled PG examination question"
        placeholder="Paste the question stem (not the textbook material)"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, styles.multiline, { borderColor:colors.border,color:colors.text }]} />
      {options.map((value,i) => (
        <TextInput key={i} value={value}
          onChangeText={v => {setOptions(old => old.map((o,j)=>i===j?v:o));setResult(null);}}
          placeholder={'Option ' + 'ABCD'[i]} placeholderTextColor={colors.textMuted}
          accessibilityLabel={'MCQ option ' + 'ABCD'[i]}
          style={[styles.input, {borderColor:colors.border,color:colors.text}]} />
      ))}
      <TextInput value={sourceUrl} onChangeText={setSourceUrl}
        autoCapitalize="none" keyboardType="url"
        accessibilityLabel="Optional recalled question source URL"
        placeholder="Source URL (optional, HTTPS)"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, {borderColor:colors.border,color:colors.text}]} />
      <Touchable label="Check options against textbooks" disabled={!valid}
        state={{busy:checking}} onPress={() => {void checkAnswer();}}
        style={[styles.action,{backgroundColor:valid?withAlpha(colors.primary,0.20):colors.background,borderColor:colors.border}]}>
        {checking ? <ActivityIndicator color={colors.primary} /> : null}
        <Text style={{color:colors.text,fontWeight:'800',fontSize:13}}>Check against Supabase textbooks</Text>
      </Touchable>
      {error ? <Text style={[styles.details, {color:colors.danger}]}>{error}</Text> : null}
      {result ? (
        <View style={[styles.result,{borderColor:colors.border}]}>
          <Text style={[styles.title,{color:colors.text}]}>
            {result.answer === 'UNRESOLVED' ? 'Unable to resolve' : 'Provisional answer: ' + result.answer}
          </Text>
          <Text style={[styles.details,{color:colors.text}]}>{result.explanation}</Text>
          <Text style={[styles.details,{color:colors.textMuted}]}>{result.evidence}</Text>
          <Text style={[styles.details,{color:colors.textMuted}]}>
            AI interpretation only. Neither the source year nor answer has been independently verified.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
const styles=StyleSheet.create({
  card:{borderWidth:1,borderRadius:16,padding:14,gap:10},
  title:{fontSize:15,fontWeight:'800'},
  details:{fontSize:12,lineHeight:18},
  label:{fontSize:11,fontWeight:'700'},
  wrap:{flexDirection:'row',flexWrap:'wrap',gap:6},
  chip:{borderWidth:1,borderRadius:12,paddingHorizontal:10,minHeight:33,justifyContent:'center'},
  input:{borderWidth:1,borderRadius:10,fontSize:13,minHeight:43,paddingHorizontal:12,paddingVertical:10},
  multiline:{minHeight:94,textAlignVertical:'top'},
  action:{borderWidth:1,borderRadius:12,minHeight:48,alignItems:'center',
    flexDirection:'row',gap:8,justifyContent:'center'},
  result:{borderTopWidth:1,paddingTop:12,gap:8},
});
