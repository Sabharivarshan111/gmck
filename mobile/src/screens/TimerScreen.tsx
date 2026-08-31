import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Text } from '@/components/Text';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { Touchable } from '@/components/Touchable';
import { PomodoroSettingsSheet } from '@/components/PomodoroSettingsSheet';
import { useExam } from '@/hooks/useExam';
import { daysUntil } from '@/lib/exam';
import { ProgressRing } from '@/components/ProgressRing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarClock, Check, Coffee, Pencil, Play, Pause, RotateCcw, SlidersHorizontal, Sprout, Timer as TimerIcon, Users, X } from 'lucide-react-native';
import { typeScale } from '@/theme/typography';
import { useTheme, withAlpha } from '@/theme';
import { SPRING, springConfig, useReducedMotion } from '@/theme/motion';
import { formatClock, PomodoroMode, usePomodoro } from '@/hooks/usePomodoro';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';
import { formatFocusTime } from '@/lib/focusStats';
import { FocusTree, TreeChip } from '@/components/FocusTree';
import { speciesFor } from '@/lib/trees';
import { clearTodayForest, forestNow, loadForest, subscribeForest, treesToday } from '@/lib/forest';

/** "an oak", "a pine" — a species name read aloud in a sentence. */
function aOrAn(name: string): string {
  return `${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name.toLowerCase()}`;
}

const MODES: { key: PomodoroMode; label: string; emoji: string }[] = [
  { key: 'focus', label: 'Focus', emoji: '🍅' },
  { key: 'short', label: 'Short break', emoji: '☕' },
  { key: 'long', label: 'Long break', emoji: '🌿' },
];

export default function TimerScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const timer = usePomodoro();
  const { onlineCount } = useOnlinePresence(timer.isRunning);
  /**
   * The exam, if one is set. Read here rather than passed down because the
   * Timer and My Progress are different tabs — there is no common parent to
   * hold it, which is why the store has its own listener set.
   */
  const exam = useExam();
  // Derived at render: the count changes at midnight, and a stored one would
  // be a day stale on a screen left open overnight.
  const examDays = exam ? daysUntil(exam) : null;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const startEditing = useCallback(() => {
    if (timer.isRunning) {
      timer.pause();
    }
    const currentMins = Math.ceil(timer.remaining / 60) || 25;
    setCustomInput(String(currentMins));
    setIsEditing(true);
  }, [timer]);

  const saveCustomTime = useCallback(() => {
    const parsed = parseInt(customInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      timer.setCustomMinutes(parsed);
    }
    setIsEditing(false);
  }, [customInput, timer]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const activeMode = MODES.find(m => m.key === timer.mode) ?? MODES[0];
  /*
   * Botanical growth starts at Stage 1 (0.0: seed / soil mound / pot)
   * and smoothly interpolates across all 24 frames to Stage 24 (1.0: mature tree).
   */
  const growthShown = timer.mode === 'focus' ? timer.growth : 0;
  // How much of this session is still to come, for the dial ring.
  const remainingPercent =
    timer.totalSeconds > 0 ? (timer.remaining / timer.totalSeconds) * 100 : 100;

  /**
   * Finishing a session is acknowledged, not just silently reset.
   *
   * The timer already vibrated on completion, but nothing on screen changed
   * except the dial snapping back to full for the next mode — so the buzz had
   * no visible partner, and finishing a 25-minute session felt like nothing had
   * happened. One quick swell of the dial, fired from the same signal as the
   * vibration so the two land together (SKILL §13 Causality + Harmony).
   *
   * This is the rare tier — a pomodoro ends every 25 minutes — which is exactly
   * where a moment of delight is affordable (animate/SKILL.md frequency table).
   * It plays once and stops; a looping celebration would be the wrong trade.
   */
  const reduceMotion = useReducedMotion();
  const swell = useRef(new Animated.Value(0)).current;

  /*
   * Today's plot, read once and kept in step with the store.
   *
   * `forest.ts` has a listener set rather than a context for the same reason
   * `progress.ts` does: this screen re-renders every second while the timer
   * runs, and a context holding the log would drag every consumer with it.
   */
  const [planted, setPlanted] = useState(forestNow());
  useEffect(() => {
    let alive = true;
    loadForest().then(all => {
      if (alive) setPlanted(all);
    });
    const stop = subscribeForest(() => setPlanted(forestNow()));
    return () => {
      alive = false;
      stop();
    };
  }, []);
  const today = treesToday(planted);
  const handleResetToday = useCallback(async () => {
    await clearTodayForest();
  }, []);

  useEffect(() => {
    if (timer.completionNonce === 0) {
      return;
    }
    // Screen-reader users get the same information as the buzz.
    AccessibilityInfo.announceForAccessibility(
      `Session complete. Next up: ${
        MODES.find(m => m.key === timer.mode)?.label ?? 'Focus'
      }.`,
    );
    if (reduceMotion) {
      return;
    }
    swell.setValue(0);
    Animated.sequence([
      Animated.spring(swell, { toValue: 1, ...springConfig(SPRING.momentum) }),
      Animated.spring(swell, { toValue: 0, ...springConfig(SPRING.default) }),
    ]).start();
    // `mode` is read for the announcement only; re-running on a mode change
    // would fire the flourish when the user switches tabs by hand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.completionNonce]);

  return (
    <KeyboardSafe>
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Focus Timer</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Deep work session</Text>
        </View>
        <Touchable
          onPress={() => setSettingsOpen(true)}
          label="Timer settings"
          hint="Choose how long a focus session lasts"
          scaleTo={0.9}
          style={[styles.iconCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SlidersHorizontal size={18} color={colors.text} />
        </Touchable>
      </View>

      {/* Mode switcher */}
      <View
        style={[styles.segment, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {MODES.map(mode => {
          const active = mode.key === timer.mode;
          return (
            <Touchable
              key={mode.key}
              onPress={() => timer.switchMode(mode.key)}
              role="tab"
              label={mode.label}
              state={{ selected: active }}
              scale={false}
              style={[styles.segmentItem, active && { backgroundColor: colors.primary }]}>
              <Text
                style={[
                  styles.segmentText,
                  { color: active ? colors.primaryText : colors.textMuted },
                ]}>
                {mode.emoji} {mode.label}
              </Text>
            </Touchable>
          );
        })}
      </View>

      {/* Dial */}
      <Animated.View
        style={[
          styles.dialWrap,
          {
            transform: [
              { scale: swell.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) },
            ],
          },
        ]}>
        {/* The published design's thick white ring, now carrying the session
            state: it starts full and drains as time is spent. At rest it looks
            exactly as it always has, so nothing about the identity changes —
            it just stops being decoration.

            The head dot is off, and the spring is off: on a value that already
            moves every second, a travelling dot reads as a second clock hand
            and a re-targeting spring never settles. */}
        <ProgressRing
          percent={remainingPercent}
          size={260}
          thickness={14}
          from={colors.primary}
          to={colors.primary}
          showDot={false}
          animate={false}
          trackColor={withAlpha(colors.primary, 0.16)}>
          <View style={styles.dial}>
            {/*
              The tree is the hero and the clock is information.
              It was the other way round, and a countdown is a number you check
              rather than a thing you watch — Forest's whole insight is that a
              thing which is *growing* holds a room in a way a number never
              does. The ring keeps carrying the same progress it always did, so
              nothing about the identity changes; the middle of it stops being
              empty.
            */}
            {!timer.settings.trees ? (
              <Text style={[styles.dialKicker, { color: colors.textMuted }]}>
                {activeMode.emoji} {activeMode.label.toUpperCase()}
              </Text>
            ) : timer.mode === 'focus' ? (
              <FocusTree
                species={timer.settings.species}
                growth={growthShown}
                wilted={timer.wilted}
                size={124}
              />
            ) : (
              <Text style={styles.breakGlyph}>{activeMode.emoji}</Text>
            )}
            {isEditing ? (
              <View style={styles.editContainer}>
                <View style={styles.editRow}>
                  <TextInput
                    value={customInput}
                    onChangeText={text => setCustomInput(text.replace(/[^0-9]/g, '').slice(0, 3))}
                    keyboardType="number-pad"
                    autoFocus
                    maxLength={3}
                    selectTextOnFocus
                    returnKeyType="done"
                    onSubmitEditing={saveCustomTime}
                    style={[
                      styles.dialInput,
                      { color: colors.text },
                    ]}
                  />
                  <Text style={[styles.editUnit, { color: colors.textMuted }]}>min</Text>
                </View>
                <View style={styles.editActions}>
                  <Touchable
                    onPress={cancelEditing}
                    label="Cancel editing"
                    scaleTo={0.88}
                    style={[styles.editBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <X size={16} color={colors.textMuted} />
                  </Touchable>
                  <Touchable
                    onPress={saveCustomTime}
                    label="Apply custom time"
                    scaleTo={0.88}
                    style={[styles.editBtn, { backgroundColor: colors.success, borderColor: colors.success }]}>
                    <Check size={16} color="#ffffff" strokeWidth={3} />
                  </Touchable>
                </View>
              </View>
            ) : (
              <Touchable
                onPress={startEditing}
                label="Set custom time"
                hint="Tap to type custom minutes for the timer"
                scaleTo={0.96}
                hitSlop={14}
                style={styles.dialClockRow}>
                <Text
                  accessibilityLiveRegion="none"
                  style={[styles.dialClock, { color: colors.text }]}>
                  {formatClock(timer.remaining)}
                </Text>
                <Pencil size={16} color={colors.textMuted} />
              </Touchable>
            )}
          </View>
        </ProgressRing>
      </Animated.View>

      {/*
        The state of the session, under the dial rather than inside it.

        A 260dp circle has about 150dp of usable width across its middle, and
        four stacked things — tree, mode, clock, hint — do not fit in it: the
        hint sat *on* the ring and the break glyph sat *on* the mode. Inside the
        ring is now the tree and the clock, which is what the dial is for, and
        everything that is words lives on one line beneath it where it has the
        whole screen to be legible in.
      */}
      <View
        style={[
          styles.statusPill,
          {
            backgroundColor: colors.card,
            borderColor: timer.wilted ? withAlpha(colors.warning, 0.5) : colors.border,
          },
        ]}>
        <Text
          accessibilityLiveRegion="none"
          numberOfLines={1}
          style={[
            styles.status,
            {
              color: timer.wilted
                ? colors.warning
                : isEditing
                  ? colors.primary
                  : colors.textMuted,
            },
          ]}>
        {isEditing
          ? 'Type minutes and tap ✓ to set'
          : timer.wilted
            ? 'You left — the minutes still count, but the tree is grey'
            : timer.mode !== 'focus' || !timer.settings.trees
              ? `${activeMode.emoji} ${activeMode.label} · tap the number to change it`
              : timer.isRunning
                ? `${activeMode.emoji} Focus · ${speciesFor(timer.settings.species).name} growing`
                : `${activeMode.emoji} Focus · tap Play to plant ${aOrAn(
                    speciesFor(timer.settings.species).name,
                  )}`}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Touchable
          onPress={timer.reset}
          label="Reset timer"
          scaleTo={0.9}
          style={[styles.sideButton, { borderColor: colors.border }]}>
          <RotateCcw size={20} color={colors.text} />
        </Touchable>

        <Touchable
          onPress={timer.isRunning ? timer.pause : timer.start}
          label={timer.isRunning ? 'Pause timer' : 'Start timer'}
          // The primary control gets a deeper press than the rest — the amount
          // of shrink is part of how important a button feels.
          scaleTo={0.93}
          style={[styles.playButton, { backgroundColor: colors.primary }]}>
          {timer.isRunning ? (
            <Pause size={30} color={colors.primaryText} fill={colors.primaryText} />
          ) : (
            <Play size={30} color={colors.primaryText} fill={colors.primaryText} />
          )}
        </Touchable>

        <Touchable
          onPress={() => timer.switchMode('short')}
          label="Take a short break"
          scaleTo={0.9}
          style={[styles.sideButton, { borderColor: colors.border }]}>
          <Coffee size={20} color={colors.text} />
        </Touchable>
      </View>

      {/* Presence */}
      <View
        style={[styles.presence, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.presenceIcon, { backgroundColor: colors.cardElevated }]}>
          <Users size={18} color={colors.text} />
        </View>
        <View style={styles.presenceBody}>
          <Text style={[styles.presenceLabel, { color: colors.textMuted }]}>
            {onlineCount != null && onlineCount > 1
              ? `${onlineCount} medical students studying right now`
              : 'Studying with you right now'}
          </Text>
          <Text style={[styles.presenceValue, { color: colors.text }]}>
            {timer.isRunning
              ? onlineCount != null && onlineCount > 1
                ? `You + ${onlineCount - 1} other${onlineCount - 1 === 1 ? '' : 's'} in deep focus`
                : 'You are in deep focus'
              : 'Start a session to join'}
          </Text>
        </View>
        <View style={[styles.presenceDot, { backgroundColor: colors.green }]} />
      </View>

      {/* Stats */}
      {/* Above the stats, below the controls: the reason you are running a
          timer at all belongs next to the timer, and it is the one number here
          that is not about the session. */}
      {exam && examDays !== null && examDays >= 0 ? (
        <View
          style={[
            styles.examStrip,
            {
              backgroundColor: withAlpha(
                examDays <= 7 ? colors.danger : colors.warning,
                0.12,
              ),
              borderColor: withAlpha(examDays <= 7 ? colors.danger : colors.warning, 0.4),
            },
          ]}>
          <CalendarClock
            size={15}
            color={examDays <= 7 ? colors.danger : colors.warning}
          />
          <Text style={[styles.examText, { color: colors.text }]} numberOfLines={1}>
            {examDays === 0
              ? `${exam.name} is today`
              : `${examDays} ${examDays === 1 ? 'day' : 'days'} to ${exam.name}`}
          </Text>
        </View>
      ) : null}

      {/*
        Today's plot.
        This replaced two cards that said "0m" and "0" — a pair of numbers that
        were zero at the moment somebody was most likely to be looking at them,
        and which said nothing the dial was not already saying. What goes here
        instead is the reason to run the timer again: the row of trees you grew
        today, greys included.
      */}
      <View style={[styles.plot, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.plotHead}>
          {timer.settings.trees ? (
            <Sprout size={15} color={colors.textMuted} />
          ) : (
            <TimerIcon size={15} color={colors.textMuted} />
          )}
          <Text style={[styles.plotLabel, styles.flex, { color: colors.textMuted }]}>
            {timer.settings.trees ? "TODAY'S PLOT" : 'TODAY'}
          </Text>
          <Text style={[styles.plotTotal, { color: colors.text }]}>
            {formatFocusTime(timer.focusMinutesToday)}
          </Text>
          {today.length > 0 || timer.focusMinutesToday > 0 ? (
            <Touchable
              onPress={handleResetToday}
              label="Reset today's plot"
              scaleTo={0.9}
              style={[
                styles.resetPlotBtn,
                { backgroundColor: colors.cardElevated, borderColor: colors.border },
              ]}>
              <RotateCcw size={11} color={colors.textMuted} />
              <Text style={[styles.resetPlotText, { color: colors.textMuted }]}>Reset</Text>
            </Touchable>
          ) : null}
        </View>
        {!timer.settings.trees ? null : today.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.plotRow}>
            {today.map(tree => (
              <TreeChip key={tree.id} species={tree.species} wilted={tree.wilted} size={52} />
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.plotEmpty, { color: colors.textMuted }]}>
            Nothing planted yet today. Finish a focus session and your tree stays here.
          </Text>
        )}
        <Text style={[styles.plotEmpty, { color: colors.textMuted }]}>
          {timer.focusMinutesTotal > 0
            ? `${formatFocusTime(timer.focusMinutesTotal)} focused in all · ${timer.completedFocus} in this run`
            : 'Your first session starts the count'}
        </Text>
      </View>

      <PomodoroSettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={timer.settings}
        onApply={timer.updateSettings}
        onResetCycle={timer.resetCycle}
        focusMinutes={timer.focusMinutesTotal}
      />
    </ScrollView>
    </KeyboardSafe>
  );
}

const styles = StyleSheet.create({
  plot: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
  },
  plotHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plotLabel: {
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '700',
  },
  plotTotal: {
    ...typeScale.bodyStrong,
  },
  plotRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-end',
  },
  plotEmpty: {
    ...typeScale.caption,
  },
  resetPlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginLeft: 4,
  },
  resetPlotText: {
    fontSize: 11,
    fontWeight: '600',
  },
  /* Breaks have no tree — the coffee cup stands in, at a size that holds the
     middle of a 260dp dial rather than floating in it. */
  breakGlyph: {
    fontSize: 60,
    lineHeight: 70,
  },
  /*
   * The session's state, in a pill of its own.
   *
   * Loose text under a 260dp ring lands in the gap between the ring and the
   * Play button and reads as belonging to neither — it looked like a caption
   * that had slipped. A pill is a thing, with its own edges, and the margins
   * either side of it are what keep the ring, the pill and the controls three
   * separate objects rather than one crowded stack.
   */
  statusPill: {
    alignSelf: 'center',
    maxWidth: '92%',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
  },
  status: {
    ...typeScale.footnote,
    textAlign: 'center',
  },
  customRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  customLabel: {
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '700',
    marginBottom: 8,
  },
  customEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customInput: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    fontSize: 17,
    fontWeight: '700',
  },
  customUnit: {
    fontSize: 13,
  },
  customSet: {
    height: 46,
    minWidth: 66,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customSetText: {
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: typeScale.title1,
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  iconCircle: {
    height: 44,
    width: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dialWrap: {
    alignItems: 'center',
    marginTop: 22,
  },
  dial: {
    height: 260,
    width: 260,
    borderRadius: 130,
    alignItems: 'center',
    justifyContent: 'center',
    // No elevation here, and that is the fix rather than an omission.
    //
    // This carried `elevation: 12` to fake the soft halo in the design.
    // Android draws an elevation shadow from the view's *outline*, and a view
    // with no background colour gets its outline from the bounds — so a 130dp
    // corner radius came out as a visible straight-edged polygon sitting
    // inside the ring. On the black theme it hid against the page; on any
    // lighter background it was an octagon on screen.
    //
    // Giving it a background would fix the outline and break something else:
    // an opaque disc would punch a hole in a wallpaper. A real glow needs a
    // blur this platform does not have without another dependency, so the
    // honest answer is no glow — same rule GlassSurface follows.
  },
  dialKicker: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '600',
    marginTop: -6,
  },
  dialClockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  dialClock: {
    fontSize: 46,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  dialHint: {
    fontSize: 11,
    marginTop: 2,
    /* Inside a 260dp circle, at the widest point text can be without
       touching the ring at the height it sits. */
    maxWidth: 190,
    textAlign: 'center',
  },
  editContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dialInput: {
    fontSize: 52,
    fontWeight: '300',
    textAlign: 'center',
    width: 90,
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    fontVariant: ['tabular-nums'],
    // @ts-ignore
    outlineWidth: 0,
    // @ts-ignore
    outlineStyle: 'none',
  },
  editUnit: {
    fontSize: 20,
    fontWeight: '400',
    alignSelf: 'center',
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  editBtn: {
    height: 34,
    width: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    marginTop: 20,
  },
  sideButton: {
    height: 56,
    width: 56,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    height: 78,
    width: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginTop: 26,
  },
  presenceIcon: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presenceBody: {
    flex: 1,
  },
  presenceLabel: {
    fontSize: 13,
  },
  presenceValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  presenceDot: {
    height: 12,
    width: 12,
    borderRadius: 6,
  },
  examStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginBottom: 14,
  },
  examText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  statSub: {
    fontSize: 12,
    marginTop: 4,
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  sheetTitle: {
    ...typeScale.title2,
    fontSize: 20,
    fontWeight: '800',
  },
  sheetSub: {
    fontSize: 13,
    marginTop: 4,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  durationChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  durationText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
