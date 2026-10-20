import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  ArrowUp,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { NoteText } from '@/components/NoteText';
import { McqCard } from '@/components/McqCard';
import { askAi, type HistoryEntry, type Mcq } from '@/lib/askAi';
import {
  neetPgDiscussionHistory,
  neetPgDiscussionPrompt,
  NEET_DISCUSSION_LIMIT,
} from '@/lib/neetPgDiscussion';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { radius, space } from '@/theme/tokens';
import type { OfflineMcq } from '@shared/neetPgOffline';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  mcqs?: Mcq[];
};
const SUGGESTIONS = [
  ['Explain the answer', 'Explain the supplied answer step by step.'],
  [
    'Compare the options',
    'Help me understand the differences between the options in this question.',
  ],
  [
    'Help me remember',
    'Give me a short memory aid for the concept in this question.',
  ],
] as const;

/** A question-scoped conversation through the existing ACEV service. */
export function NeetPgQuestionAi({
  question,
  chapter,
  onClose,
}: {
  question: OfflineMcq;
  chapter: string;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<{
    prompt: string;
    text: string;
  } | null>(null);
  const history = useRef<HistoryEntry[]>([]);
  const busy = useRef(false);
  const mounted = useRef(true);
  const list = useRef<FlatList<Message>>(null);
  const sequence = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const send = async (raw: string, retry = false) => {
    const text = raw.trim();
    if (!text || busy.current) return;
    Keyboard.dismiss();
    busy.current = true;
    setLoading(true);
    setFailure(null);
    setInput('');
    if (!retry)
      setMessages(current => [
        ...current,
        { id: `user-${++sequence.current}`, role: 'user', text },
      ]);
    try {
      const prompt = neetPgDiscussionPrompt(text);
      const result = await askAi(
        prompt,
        neetPgDiscussionHistory(question, chapter, history.current),
      );
      if (!mounted.current) return;
      history.current = [
        ...history.current,
        { role: 'user' as const, content: text },
        { role: 'assistant' as const, content: result.text.slice(0, 5000) },
      ].slice(-8);
      setMessages(current => [
        ...current,
        {
          id: `assistant-${++sequence.current}`,
          role: 'assistant',
          text: result.text,
          mcqs: result.mcqs,
        },
      ]);
    } catch (error) {
      if (mounted.current)
        setFailure({
          prompt: text,
          text:
            error instanceof Error
              ? error.message
              : 'Could not connect. Try again when you are online.',
        });
    } finally {
      busy.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  return (
    <Sheet visible onClose={onClose} title="Ask ACEV" scrollable={false}>
      <View style={[styles.panel, { height: Math.min(height * 0.67, 640) }]}>
        <View
          style={[
            styles.context,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Touchable
            label={
              expanded ? 'Collapse attached question' : 'Read attached question'
            }
            state={{ expanded }}
            onPress={() => setExpanded(value => !value)}
            style={{ minHeight: 44, justifyContent: 'center', gap: space.sm }}
          >
            <View style={styles.row}>
              <Text
                style={[
                  typeScale.overline,
                  styles.flex,
                  { color: colors.textMuted },
                ]}
              >
                THIS QUESTION · {chapter}
              </Text>
              {expanded ? (
                <ChevronUp size={16} color={colors.textMuted} />
              ) : (
                <ChevronDown size={16} color={colors.textMuted} />
              )}
            </View>
            {!expanded ? (
              <Text
                numberOfLines={2}
                style={[typeScale.footnote, { color: colors.text }]}
              >
                {question.question}
              </Text>
            ) : null}
          </Touchable>
          {expanded ? (
            <ScrollView
              style={{ maxHeight: height * 0.22 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[typeScale.footnote, { color: colors.text }]}>
                {question.question}
                {'\n\n'}
              </Text>
              <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
                {question.options
                  .map(
                    (option, index) =>
                      `${String.fromCharCode(65 + index)}. ${option}`,
                  )
                  .join('\n')}
              </Text>
            </ScrollView>
          ) : null}
        </View>
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={item => item.id}
          style={styles.flex}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.messages}
          onContentSizeChange={() =>
            list.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={styles.intro}>
              <Sparkles size={24} color={colors.accent} />
              <Text style={[typeScale.title3, { color: colors.text }]}>
                Make the concept click.
              </Text>
              <Text style={[typeScale.callout, { color: colors.textMuted }]}>
                Ask about the answer, compare the options, or work through the
                reasoning.
              </Text>
              {question.imageIds.length ? (
                <Text style={[typeScale.caption, { color: colors.textMuted }]}>
                  For image-based doubts, describe what you see. Images are not
                  sent to this chat.
                </Text>
              ) : null}
              <View style={styles.suggestions}>
                {SUGGESTIONS.map(([title, prompt]) => (
                  <Touchable
                    key={title}
                    label={title}
                    onPress={() => {
                      void send(prompt);
                    }}
                    style={[styles.suggestion, { borderColor: colors.border }]}
                  >
                    <Text style={[typeScale.footnote, { color: colors.text }]}>
                      {title}
                    </Text>
                    <ArrowUp size={14} color={colors.textMuted} />
                  </Touchable>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.message,
                item.role === 'user' && {
                  backgroundColor: withAlpha(colors.text, 0.05),
                  borderRadius: radius.md,
                  padding: space.md,
                },
              ]}
            >
              <Text
                style={[
                  typeScale.overline,
                  {
                    color:
                      item.role === 'assistant'
                        ? colors.accent
                        : colors.textMuted,
                  },
                ]}
              >
                {item.role === 'assistant' ? 'ACEV' : 'YOU'}
              </Text>
              {item.role === 'assistant' ? (
                <NoteText content={item.text} />
              ) : (
                <Text
                  selectable
                  style={[typeScale.body, { color: colors.text }]}
                >
                  {item.text}
                </Text>
              )}
              {item.mcqs?.map((mcq, index) => (
                <McqCard key={index} item={mcq} index={index} />
              ))}
            </View>
          )}
          ListFooterComponent={
            <>
              {loading ? (
                <View style={styles.row} accessibilityLiveRegion="polite">
                  <ActivityIndicator color={colors.accent} />
                  <Text
                    style={[typeScale.footnote, { color: colors.textMuted }]}
                  >
                    Thinking through your question…
                  </Text>
                </View>
              ) : null}
              {failure ? (
                <View style={[styles.error, { borderColor: colors.border }]}>
                  <Text
                    accessibilityRole="alert"
                    style={[typeScale.footnote, { color: colors.text }]}
                  >
                    {failure.text}
                  </Text>
                  <Touchable
                    label="Retry question discussion"
                    onPress={() => {
                      void send(failure.prompt, true);
                    }}
                    style={styles.retry}
                  >
                    <RotateCcw size={15} color={colors.text} />
                    <Text style={[typeScale.footnote, { color: colors.text }]}>
                      Try again
                    </Text>
                  </Touchable>
                </View>
              ) : null}
            </>
          }
        />
        <View
          style={[
            styles.composer,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            accessibilityLabel="Ask about this NEET PG question"
            placeholder="Ask a follow-up…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={NEET_DISCUSSION_LIMIT}
            style={[styles.input, typeScale.body, { color: colors.text }]}
          />
          <Touchable
            label="Send question to ACEV"
            disabled={!input.trim() || loading}
            onPress={() => {
              void send(input);
            }}
            style={[
              styles.send,
              {
                backgroundColor: colors.primary,
                opacity: !input.trim() || loading ? 0.35 : 1,
              },
            ]}
          >
            <ArrowUp size={20} color={colors.primaryText} />
          </Touchable>
        </View>
        <Text
          style={[
            typeScale.caption,
            styles.footer,
            { color: colors.textMuted },
          ]}
        >
          Online AI assistance · your stored answer stays unchanged
        </Text>
      </View>
    </Sheet>
  );
}
const styles = StyleSheet.create({
  panel: { flexShrink: 1, gap: space.md },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  context: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  messages: {
    gap: space.xl,
    paddingVertical: space.sm,
    paddingBottom: space.lg,
  },
  intro: { gap: space.md, paddingVertical: space.md },
  suggestions: { gap: space.sm, paddingTop: space.sm },
  suggestion: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  message: { gap: space.sm },
  error: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
    marginTop: space.md,
  },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 44,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.sm,
    gap: space.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 108,
    paddingHorizontal: space.sm,
    paddingVertical: space.md,
    textAlignVertical: 'top',
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { textAlign: 'center', paddingBottom: space.sm },
});
