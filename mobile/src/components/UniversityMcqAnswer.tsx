import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme } from '@/theme';
import { typeScale } from '@/theme/typography';
import { supabase } from '@/lib/supabase';
import { collectedQuestionSource } from '@data/universityPapers/questionBankData';

type Answer = {
  id: string;
  status: 'answered' | 'unresolved';
  basis?: 'textbook' | 'web';
  label?: string;
  option?: string;
  explanation: string;
  sources: { title: string; quote: string; url?: string }[];
};
// Bounded session cache, keyed by exact source identity. Never persisted as an official key.
const cache = new Map<string, Answer>();

export function UniversityMcqAnswer({ question, onClose }: { question: string | null; onClose: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const run = useRef(0);
  const row = question ? collectedQuestionSource(question) : undefined;
  const fetchAnswer = useCallback(async () => {
    const generation = ++run.current;
    setAnswer(null);
    setError(null);
    if (!row || row.questionFormat !== 'mcq' || row.options?.length !== 4) return;
    const saved = cache.get(row.id);
    if (saved) { setAnswer(saved); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error: failure } = await supabase.functions.invoke<Answer>('university-mcq-answer', {
        body: { id: row.id, question: row.question, options: row.options, subject: row.subjectKey, topic: row.topicKey },
      });
      if (failure || !data || data.id !== row.id || !['answered', 'unresolved'].includes(data.status) || typeof data.explanation !== 'string' || !Array.isArray(data.sources)) throw new Error('Could not retrieve a sourced answer. Please try again.');
      if (data.status === 'answered' && (!row.options.some(option => option.label === data.label && option.text === data.option) || !data.sources.length)) throw new Error('The answer could not be matched to the original choices.');
      if (generation !== run.current) return;
      if (data.status === 'answered') {
        if (cache.size >= 100) cache.delete(cache.keys().next().value!);
        cache.set(row.id, data);
      }
      setAnswer(data);
    } catch (failure) {
      if (generation === run.current) setError((failure as Error).message);
    } finally {
      if (generation === run.current) setLoading(false);
    }
  }, [row]);
  useEffect(() => {
    if (question) fetchAnswer();
    else { run.current += 1; setAnswer(null); setError(null); setLoading(false); }
    return () => { run.current += 1; };
  }, [question, fetchAnswer]);
  const close = () => { run.current += 1; onClose(); };
  return (
    <Modal visible={question !== null} animationType="slide" onRequestClose={close} statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 12, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={[typeScale.title2, { color: colors.text }]}>MCQ answer</Text>
          <Touchable label="Close MCQ answer" onPress={close} hitSlop={12}>
            <Text style={[typeScale.callout, { color: colors.cyan }]}>Close</Text>
          </Touchable>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={[typeScale.body, { color: colors.text }]}>{row?.question}</Text>
          {loading ? <View style={styles.section}><ActivityIndicator color={colors.cyan} /><Text style={[typeScale.callout, { color: colors.textMuted }]}>Checking the textbook, then medical sources…</Text></View> : null}
          {error ? <View style={styles.section}><Text style={[typeScale.callout, { color: colors.text }]}>{error}</Text><Touchable label="Retry MCQ answer" onPress={fetchAnswer}><Text style={[typeScale.callout, { color: colors.cyan }]}>Try again</Text></Touchable></View> : null}
          {answer ? <View style={styles.section}>
            <Text style={[typeScale.caption, { color: colors.textMuted }]}>{answer.status === 'answered' ? answer.basis === 'textbook' ? 'TEXTBOOK EVIDENCE · AI ANSWER' : 'WEB EVIDENCE · AI ANSWER' : 'ANSWER NOT ESTABLISHED'}</Text>
            {answer.status === 'answered' ? <Text style={[typeScale.title2, { color: colors.success }]}>{answer.label?.toUpperCase()}. {answer.option}</Text> : null}
            <Text style={[typeScale.body, { color: colors.text }]}>{answer.explanation}</Text>
            {answer.sources.map((source, index) => <View key={index} style={styles.section}>
              <Text style={[typeScale.callout, { color: colors.textMuted }]}>{source.title}</Text>
              <Text style={[typeScale.callout, { color: colors.text }]}>“{source.quote}”</Text>
              {source.url?.startsWith('https://pubmed.ncbi.nlm.nih.gov/') ? <Touchable label={`Read source: ${source.title}`} onPress={() => { Linking.openURL(source.url!).catch(() => undefined); }}><Text style={[typeScale.callout, { color: colors.cyan }]}>Read source ↗</Text></Touchable> : null}
            </View>)}
          </View> : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  body: { padding: 16, paddingBottom: 48, gap: 20 },
  section: { gap: 12, marginTop: 16 },
});
