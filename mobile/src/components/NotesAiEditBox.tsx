import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { BookOpen, Globe, Send, Sparkles } from 'lucide-react-native';
import {
  mergeProposal,
  proposeNoteEdit,
  saveSingleNote,
  type NoteProposal,
  type NotesContent,
  type SingleNoteRequest,
} from '@/lib/handwrittenNotes';

/**
 * "Fix these notes with AI" — the native half of the web app's NotesAiEditBox.
 *
 * The shape of this is the point. A model asked to correct revision notes is
 * asked to change the thing being revised from, so it never writes directly:
 * it looks the request up in the reference textbook, shows what it found, and
 * waits. Saying no changes nothing at all.
 *
 * Saying yes then asks *how*, which the web version does not:
 *
 *   Add to notes   fold it in — same-titled sections replaced, new ones
 *                  appended, everything else untouched
 *   Replace all    throw the note away and keep only what came back
 *
 * Add is the safe one and is listed first, because Gemini returns only the
 * sections it touched: treating that as the whole note silently deletes the
 * rest. Replace exists because sometimes that is genuinely what is wanted, and
 * it says "Replace all" rather than "Replace" so nobody taps it expecting the
 * gentler thing.
 */

type Bubble =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'status'; text: string }
  | { id: number; role: 'error'; text: string }
  | { id: number; role: 'offer-web' }
  | {
      id: number;
      role: 'proposal';
      proposal: NoteProposal;
      /** 'pending' asks yes/no; 'choosing' asks add/replace. */
      state: 'pending' | 'choosing' | 'accepted' | 'rejected';
    };

/**
 * Omit that distributes over the union.
 *
 * A plain `Omit<Bubble, 'id'>` collapses the union to the keys every member
 * shares — `role` alone — so pushing a bubble with any payload fails to
 * typecheck. This keeps each variant whole.
 */
type NewBubble = Bubble extends infer B
  ? B extends Bubble
    ? Omit<B, 'id'>
    : never
  : never;

export function NotesAiEditBox({
  request,
  content,
  onApply,
}: {
  request: SingleNoteRequest;
  content: NotesContent | null;
  onApply: (next: NotesContent) => void;
}) {
  const { colors } = useTheme();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const idRef = useRef(0);

  const nextId = () => (idRef.current += 1);
  const push = useCallback(
    (bubble: NewBubble) =>
      setBubbles(prev => [...prev, { ...(bubble as Bubble), id: nextId() }]),
    [],
  );
  const patch = useCallback(
    (id: number, changes: Partial<Bubble>) =>
      setBubbles(prev =>
        prev.map(b => (b.id === id ? ({ ...b, ...changes } as Bubble) : b)),
      ),
    [],
  );

  const propose = useCallback(
    async (instruction: string, useWeb: boolean) => {
      if (!content) {
        return;
      }
      setBusy(true);
      const statusId = nextId();
      setBubbles(prev => [
        ...prev,
        {
          id: statusId,
          role: 'status',
          text: useWeb
            ? 'Searching the web for this topic…'
            : 'Looking this up in the reference textbook…',
        },
      ]);
      try {
        const proposal = await proposeNoteEdit(
          request,
          content,
          instruction,
          useWeb,
        );
        patch(statusId, {
          text:
            proposal.source === 'textbook'
              ? 'Found this in the reference textbook:'
              : proposal.source === 'web'
              ? 'Found this on the web:'
              : 'Not in the reference textbook — drafted from standard MBBS knowledge:',
        });
        push({ role: 'proposal', proposal, state: 'pending' });
      } catch (e) {
        patch(statusId, {
          role: 'error',
          text: (e as Error).message || "Couldn't process that request.",
        });
      } finally {
        setBusy(false);
      }
    },
    [content, patch, push, request],
  );

  const apply = useCallback(
    (
      bubble: Extract<Bubble, { role: 'proposal' }>,
      mode: 'add' | 'replace',
    ) => {
      const next =
        mode === 'add'
          ? mergeProposal(content, bubble.proposal.content)
          : bubble.proposal.content;
      patch(bubble.id, { state: 'accepted' });
      onApply(next);
      push({
        role: 'status',
        text:
          mode === 'add'
            ? 'Added to your notes — your other sections are untouched.'
            : 'The note was replaced with this.',
      });
      void saveSingleNote(request, next);
    },
    [content, onApply, patch, push, request],
  );

  const reject = useCallback(
    (bubble: Extract<Bubble, { role: 'proposal' }>) => {
      patch(bubble.id, { state: 'rejected' });
      if (bubble.proposal.source === 'web') {
        push({
          role: 'status',
          text: 'Discarded. Nothing changed — try rewording it.',
        });
      } else {
        push({ role: 'offer-web' });
      }
    },
    [patch, push],
  );

  const submit = useCallback(() => {
    const instruction = input.trim();
    if (!instruction || !content || busy) {
      return;
    }
    setInput('');
    push({ role: 'user', text: instruction });
    void propose(instruction, false);
  }, [busy, content, input, propose, push]);

  const pill = (
    label: string,
    onPress: () => void,
    tone: 'accent' | 'plain' = 'plain',
  ) => (
    <Touchable
      key={label}
      label={label}
      onPress={onPress}
      style={[
        styles.pill,
        tone === 'accent'
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          typeScale.footnote,
          { color: tone === 'accent' ? colors.primaryText : colors.text },
        ]}
      >
        {label}
      </Text>
    </Touchable>
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.head}>
        <View
          style={[
            styles.icon,
            { backgroundColor: withAlpha(colors.fuchsia, 0.15) },
          ]}
        >
          <Sparkles size={16} color={colors.fuchsia} />
        </View>
        <View style={styles.flex}>
          <Text
            style={[typeScale.callout, styles.title, { color: colors.text }]}
          >
            Fix these notes with AI
          </Text>
          <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
            Ask for a change — I check the reference textbook first, show you
            what I found, then you approve it.
          </Text>
        </View>
      </View>

      {bubbles.map(bubble => {
        if (bubble.role === 'user') {
          return (
            <View
              key={bubble.id}
              style={[
                styles.bubble,
                { backgroundColor: withAlpha(colors.primary, 0.12) },
              ]}
            >
              <Text style={[typeScale.footnote, { color: colors.text }]}>
                {bubble.text}
              </Text>
            </View>
          );
        }
        if (bubble.role === 'status') {
          return (
            <Text
              key={bubble.id}
              style={[
                typeScale.footnote,
                styles.status,
                { color: colors.textMuted },
              ]}
            >
              {bubble.text}
            </Text>
          );
        }
        if (bubble.role === 'error') {
          return (
            <Text
              key={bubble.id}
              style={[
                typeScale.footnote,
                styles.status,
                { color: colors.danger },
              ]}
            >
              {bubble.text}
            </Text>
          );
        }
        if (bubble.role === 'offer-web') {
          return (
            <View key={bubble.id} style={styles.offer}>
              <View style={styles.row}>
                <Globe size={14} color={colors.textMuted} />
                <Text
                  style={[
                    typeScale.footnote,
                    styles.flex,
                    { color: colors.textMuted },
                  ]}
                >
                  Nothing changed. The textbook is the source that should win,
                  but it does not cover everything — search the web instead?
                </Text>
              </View>
              <View style={styles.actions}>
                {pill('Search the web', () => {
                  const asked = [...bubbles]
                    .reverse()
                    .find(b => b.role === 'user') as
                    | Extract<Bubble, { role: 'user' }>
                    | undefined;
                  if (asked) {
                    void propose(asked.text, true);
                  }
                })}
              </View>
            </View>
          );
        }

        const { proposal, state } = bubble;
        return (
          <View
            key={bubble.id}
            style={[
              styles.proposal,
              {
                backgroundColor: withAlpha(
                  proposal.source === 'textbook'
                    ? colors.success
                    : colors.warning,
                  0.1,
                ),
                borderColor: withAlpha(
                  proposal.source === 'textbook'
                    ? colors.success
                    : colors.warning,
                  0.4,
                ),
              },
            ]}
          >
            <View style={styles.row}>
              <BookOpen
                size={14}
                color={
                  proposal.source === 'textbook'
                    ? colors.success
                    : colors.warning
                }
              />
              <Text
                style={[
                  typeScale.footnote,
                  styles.flex,
                  {
                    color:
                      proposal.source === 'textbook'
                        ? colors.success
                        : colors.warning,
                  },
                ]}
              >
                {proposal.source === 'textbook'
                  ? 'From the reference textbook'
                  : proposal.source === 'web'
                  ? 'From the web'
                  : 'From general MBBS knowledge'}
              </Text>
            </View>

            {proposal.summary.map((line, i) => (
              <Text
                key={i}
                style={[typeScale.footnote, { color: colors.text }]}
              >
                • {line}
              </Text>
            ))}

            {state === 'pending' ? (
              <View style={styles.actions}>
                {pill(
                  'Yes, use this',
                  () => patch(bubble.id, { state: 'choosing' }),
                  'accent',
                )}
                {pill('No, leave it', () => reject(bubble))}
              </View>
            ) : null}

            {state === 'choosing' ? (
              <>
                <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
                  Add it to what you have, or replace the whole note?
                </Text>
                <View style={styles.actions}>
                  {pill('Add to notes', () => apply(bubble, 'add'), 'accent')}
                  {pill('Replace all', () => apply(bubble, 'replace'))}
                </View>
              </>
            ) : null}

            {state === 'accepted' ? (
              <Text style={[typeScale.footnote, { color: colors.success }]}>
                Applied.
              </Text>
            ) : null}
            {state === 'rejected' ? (
              <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
                Discarded — nothing changed.
              </Text>
            ) : null}
          </View>
        );
      })}

      <View style={[styles.inputRow, { borderColor: colors.border }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          editable={!busy && content != null}
          multiline
          placeholder="Example: The Anaemia Mukt Bharat strategy is 6x6x6, please fix it."
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }]}
          accessibilityLabel="Ask for a change to these notes"
        />
        <Touchable
          label="Send"
          onPress={submit}
          disabled={busy || !input.trim() || content == null}
          style={[
            styles.send,
            {
              backgroundColor:
                busy || !input.trim()
                  ? withAlpha(colors.text, 0.12)
                  : colors.primary,
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Send
              size={16}
              color={input.trim() ? colors.primaryText : colors.textMuted}
            />
          )}
        </Touchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
    marginTop: 20,
  },
  flex: {
    flex: 1,
  },
  head: {
    flexDirection: 'row',
    gap: 10,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
  },
  bubble: {
    alignSelf: 'flex-end',
    maxWidth: '90%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  status: {
    paddingVertical: 2,
  },
  offer: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proposal: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  pill: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 96,
    paddingTop: 2,
  },
  send: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
