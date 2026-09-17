import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  RotateCcw,
  Send,
} from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { EASE, SPRING, springTo, useReducedMotion } from '@/theme/motion';

/**
 * The bedside AI assistant, as a drawer over the case detail.
 *
 * Extracted from ClinicalProformaModal, and rebuilt, for two reasons.
 *
 * **The expand button did not work, and the reason was geometry.** It, the
 * reset button and the chevron were three 16px icons with `padding: 4` and
 * the default 8dp hit slop — so each had a touch target about 40dp wide with
 * only 12dp between their centres' gaps. Adjacent targets overlapped, and
 * React Native gives an overlap to the later sibling, which is Reset. Tapping
 * "expand" cleared the conversation instead. They are 44dp apart now, with the
 * slop sized to fit between them rather than through the neighbour.
 *
 * **They were also nested inside the header's own Touchable**, which toggles
 * the drawer. Nesting pressables works, but it means a missed inner press
 * silently becomes an outer press — expand that collapses. The header row is
 * now three siblings: a title Touchable that toggles, and two icon buttons.
 *
 * **Motion.** The drawer was three static heights with no transition — it
 * jumped. It now translates, on the native driver, per CLAUDE.md's rule that
 * layout properties are never animated: the panel is a fixed-height sheet
 * whose `translateY` picks the detent, and the composer is a pinned sibling
 * rather than part of the panel, since translating a panel moves its bottom
 * edge and a composer has to stay put. Bubbles enter with a spring from 0.9
 * and the busy indicator breathes, both at the house values.
 */

export interface ChatBubble {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface BedsideChatDrawerProps {
  open: boolean;
  expanded: boolean;
  onToggleOpen: () => void;
  onToggleExpanded: () => void;
  onReset: () => void;
  messages: ChatBubble[];
  busy: boolean;
  input: string;
  onChangeInput: (text: string) => void;
  onSend: (textOverride?: string) => void;
  /** Bottom safe-area inset, so the composer clears the gesture bar. */
  bottomInset: number;
}

/** Detent heights. The composer is excluded — it is a pinned sibling. */
const HEADER_H = 52;
const INPUT_H = 56;
const PANEL_H = 520;
const OPEN_VISIBLE = 260;

const PROMPT_CHIPS: { emoji: string; label: string; prompt: string; a11y: string }[] = [
  {
    emoji: '🎓',
    label: 'Top Viva Qs',
    prompt: 'What are the top viva questions professors ask on this case?',
    a11y: 'Ask for the top viva questions',
  },
  {
    emoji: '🔍',
    label: 'Differentials',
    prompt: 'Give me the complete differential diagnosis list for this case.',
    a11y: 'Ask for the differential diagnosis',
  },
  {
    emoji: '🗣️',
    label: 'Case Summary',
    prompt: 'How should I present this case summary to the external examiner?',
    a11y: 'Ask how to present the case summary',
  },
  {
    emoji: '🩺',
    label: 'Clinical Signs',
    prompt: 'What clinical signs can examiners ask me to demonstrate on the patient?',
    a11y: 'Ask which clinical signs to demonstrate',
  },
];

export function BedsideChatDrawer({
  open,
  expanded,
  onToggleOpen,
  onToggleExpanded,
  onReset,
  messages,
  busy,
  input,
  onChangeInput,
  onSend,
  bottomInset,
}: BedsideChatDrawerProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<ScrollView | null>(null);

  const pad = Math.max(bottomInset, 10);

  /**
   * How far the panel is pushed down. Closed leaves the header alone visible,
   * sitting where the composer would be; open shows OPEN_VISIBLE of it;
   * expanded shows all of it.
   */
  const detent = useMemo(() => {
    if (!open) return PANEL_H - HEADER_H + INPUT_H + pad;
    if (expanded) return 0;
    return PANEL_H - OPEN_VISIBLE;
  }, [open, expanded, pad]);

  const slide = useRef(new Animated.Value(detent)).current;
  const composer = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    // SPRING.sheet is the drawer value — 0.8 damping, so it settles with the
    // slight overshoot a dragged sheet has, which is what this reads as even
    // though it was tapped rather than dragged.
    springTo(slide, detent, { spring: SPRING.sheet, reduceMotion }).start();
    Animated.timing(composer, {
      toValue: open ? 1 : 0,
      duration: open ? 180 : 120,
      easing: EASE.out,
      useNativeDriver: true,
    }).start();
  }, [detent, open, slide, composer, reduceMotion]);

  // Keep the newest message in view once it has laid out.
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(id);
  }, [messages.length, busy, open]);

  const send = useCallback(() => onSend(), [onSend]);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { height: PANEL_H + INPUT_H + pad }]}>
      {/* The composer is pinned: it must not move when the panel does. */}
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          styles.composer,
          {
            height: INPUT_H + pad,
            paddingBottom: pad,
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            opacity: composer,
          },
        ]}>
        <TextInput
          value={input}
          onChangeText={onChangeInput}
          placeholder="Ask about this case or signs…"
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={send}
          returnKeyType="send"
          style={[
            styles.textInput,
            { color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
          ]}
        />
        <Touchable
          onPress={send}
          disabled={!input.trim() || busy}
          label="Send medical question"
          style={[
            styles.sendBtn,
            { backgroundColor: input.trim() ? colors.primary : withAlpha(colors.primary, 0.4) },
          ]}>
          <Send size={16} color={colors.primaryText} />
        </Touchable>
      </Animated.View>

      {/* The panel, drawn over the composer so that when it is fully down only
          its own header shows. */}
      <Animated.View
        style={[
          styles.panel,
          {
            height: PANEL_H,
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            transform: [{ translateY: slide }],
          },
        ]}>
        <View style={styles.header}>
          {/* Title area toggles. It is a sibling of the icon buttons, not
              their parent — see the note at the top of this file. */}
          <Touchable
            onPress={onToggleOpen}
            label={open ? 'Collapse the bedside AI assistant' : 'Open the bedside AI assistant'}
            state={{ expanded: open }}
            scale={false}
            dim
            style={styles.headerTitleArea}>
            <View style={[styles.botIcon, { backgroundColor: withAlpha(colors.primary, 0.15) }]}>
              <Bot size={16} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              Bedside Clinical AI Assistant
            </Text>
          </Touchable>

          {open ? (
            <>
              <Touchable
                onPress={onToggleExpanded}
                label={expanded ? 'Restore the chat to half height' : 'Expand the chat to full height'}
                state={{ expanded }}
                hitSlop={10}
                style={styles.iconBtn}>
                {expanded ? (
                  <Minimize2 size={17} color={colors.text} />
                ) : (
                  <Maximize2 size={17} color={colors.text} />
                )}
              </Touchable>
              <Touchable
                onPress={onReset}
                label="Clear the conversation"
                hitSlop={10}
                style={styles.iconBtn}>
                <RotateCcw size={17} color={colors.textMuted} />
              </Touchable>
            </>
          ) : null}

          <Touchable
            onPress={onToggleOpen}
            label={open ? 'Collapse the bedside AI assistant' : 'Open the bedside AI assistant'}
            hitSlop={10}
            style={styles.iconBtn}>
            {open ? (
              <ChevronDown size={20} color={colors.textMuted} />
            ) : (
              <ChevronUp size={20} color={colors.textMuted} />
            )}
          </Touchable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}>
          {PROMPT_CHIPS.map(chip => (
            <Touchable
              key={chip.label}
              onPress={() => onSend(chip.prompt)}
              label={chip.a11y}
              style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.chipText, { color: colors.text }]}>
                {chip.emoji}  {chip.label}
              </Text>
            </Touchable>
          ))}
        </ScrollView>

        <ScrollView
          ref={scrollRef}
          style={styles.transcript}
          contentContainerStyle={styles.transcriptContent}
          keyboardShouldPersistTaps="handled">
          {messages.length === 0 && !busy ? (
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Ask anything about this case — clinical signs, viva traps, or how to present it.
              </Text>
            </View>
          ) : null}

          {/* No stagger: messages arrive one at a time, and a stagger on a
              single arrival is a delay carrying no information. */}
          {messages.map(msg => (
            <Bubble key={msg.id} message={msg} reduceMotion={reduceMotion} />
          ))}

          {busy ? <TypingIndicator reduceMotion={reduceMotion} /> : null}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/**
 * A message, springing in from 0.9 rather than from 0 — per CLAUDE.md, nothing
 * in this app scales from zero, because a `scale(0)` entrance reads as
 * materialising out of nowhere rather than as arriving.
 */
function Bubble({ message, reduceMotion }: { message: ChatBubble; reduceMotion: boolean }) {
  const { colors } = useTheme();
  const enter = useRef(new Animated.Value(0)).current;
  const mine = message.role === 'user';

  useEffect(() => {
    springTo(enter, 1, { spring: SPRING.default, reduceMotion }).start();
  }, [enter, reduceMotion]);

  const style = {
    opacity: enter,
    transform: [
      { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
    ],
  };

  return (
    <Animated.View
      style={[
        styles.bubble,
        mine
          ? [styles.userBubble, { backgroundColor: colors.primary }]
          : [styles.botBubble, { backgroundColor: colors.background, borderColor: colors.border }],
        style,
      ]}>
      <Text
        style={[styles.bubbleText, { color: mine ? colors.primaryText : colors.text }]}
        selectable>
        {message.text}
      </Text>
    </Animated.View>
  );
}

/** Three dots that breathe out of phase — the wait made legible. */
function TypingIndicator({ reduceMotion }: { reduceMotion: boolean }) {
  const { colors } = useTheme();
  const phase = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(phase, {
        toValue: 1,
        duration: 1000,
        easing: EASE.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, reduceMotion]);

  return (
    <View
      style={[
        styles.bubble,
        styles.botBubble,
        styles.busyBubble,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}>
      {reduceMotion ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View style={styles.dots}>
          {[0, 1, 2].map(i => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: colors.primary },
                {
                  opacity: phase.interpolate({
                    // Each dot peaks a third of a cycle after the last.
                    inputRange: [0, 0.16 + i * 0.16, 0.5 + i * 0.16, 1],
                    outputRange: [0.3, 1, 0.3, 0.3],
                  }),
                  transform: [
                    {
                      translateY: phase.interpolate({
                        inputRange: [0, 0.16 + i * 0.16, 0.5 + i * 0.16, 1],
                        outputRange: [0, -3, 0, 0],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      )}
      <Text style={[styles.busyText, { color: colors.textMuted }]}>
        Consulting MBBS clinical guidelines…
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    // A shadow rather than elevation: elevation draws its outline from the
    // bounds, and this view has a background so the two agree — but the
    // shadow is what reads on a light theme.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_H,
    paddingLeft: 16,
    paddingRight: 8,
  },
  headerTitleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  botIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 13, fontWeight: '700' },
  /**
   * 44dp square, the touch minimum, and wide enough that neighbouring buttons
   * do not share a pixel — which is what made "expand" fire "reset".
   */
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: { paddingHorizontal: 12, gap: 8, paddingBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontSize: 11.5, fontWeight: '600' },
  transcript: { flex: 1, paddingHorizontal: 12 },
  transcriptContent: { paddingVertical: 8, gap: 8, paddingBottom: 16 },
  emptyBox: { padding: 12, alignItems: 'center' },
  emptyText: { fontSize: 12, textAlign: 'center', lineHeight: 17 },
  bubble: { padding: 10, borderRadius: 12, maxWidth: '88%' },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  botBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bubbleText: { fontSize: 12.5, lineHeight: 18 },
  busyBubble: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  busyText: { fontSize: 12 },
  dots: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
