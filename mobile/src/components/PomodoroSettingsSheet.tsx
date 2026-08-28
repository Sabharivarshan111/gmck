import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Sheet } from '@/components/Sheet';
import { Slider } from '@/components/Slider';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { Check, Lock, Play, Volume2 } from 'lucide-react-native';
import { CHIME_PRESETS, setSetting, useSettings } from '@/lib/settings';
import { previewSound, silencingReason, soundAvailable } from '@/lib/sound';
import { complete as buzz } from '@/lib/haptics';
import type { PomodoroSettings } from '@/hooks/usePomodoro';
import { TreeChip } from '@/components/FocusTree';
import { nextUnlock, SPECIES } from '@/lib/trees';

/**
 * Everything adjustable about the pomodoro, in one sheet.
 *
 * The durations are drafted and committed rather than applied as they move.
 * A slider that writes straight through would restart the session under the
 * reader's hands — the timer derives its length from these, so dragging Focus
 * from 25 to 40 mid-drag would rewrite the clock four times a second on a
 * session they may not have meant to touch. "Set this configuration" is the
 * moment it takes effect, which is also what makes Cancel mean something.
 *
 * The sound settings are *not* drafted: they are global preferences, they take
 * effect nowhere but the next chime, and hearing a preset the moment you pick
 * it is the whole point of picking one.
 */
export function PomodoroSettingsSheet({
  visible,
  onClose,
  settings,
  onApply,
  onResetCycle,
  focusMinutes,
}: {
  visible: boolean;
  onClose: () => void;
  settings: PomodoroSettings;
  onApply: (next: PomodoroSettings) => void;
  onResetCycle: () => void;
  /** Lifetime focused minutes, which is what unlocks species. */
  focusMinutes: number;
}) {
  const { colors } = useTheme();
  const prefs = useSettings();
  const upcoming = nextUnlock(focusMinutes);

  const [draft, setDraft] = useState<PomodoroSettings>(settings);
  // Re-seed each time it opens, so a sheet closed without applying does not
  // reopen showing changes that were never committed.
  const [seenFor, setSeenFor] = useState(settings);
  if (visible && seenFor !== settings) {
    setSeenFor(settings);
    setDraft(settings);
  }

  const silenced = silencingReason();

  const apply = useCallback(() => {
    onApply(draft);
    onClose();
  }, [draft, onApply, onClose]);

  /**
   * Slider draws a bare track and nothing else — its `label` is for TalkBack,
   * not the screen. Every caller draws its own name-and-value row, and this one
   * has four in a column, so without it the sheet is four anonymous tracks and
   * no way to tell which is the focus length.
   */
  const duration = (
    key: 'focusMinutes' | 'shortMinutes' | 'longMinutes' | 'longEvery',
    label: string,
    min: number,
    max: number,
    unit: string,
  ) => (
    <View key={key} style={styles.field}>
      <View style={styles.fieldHead}>
        <Text style={[typeScale.callout, styles.flex, { color: colors.text }]}>{label}</Text>
        <Text style={[typeScale.footnote, styles.value, { color: colors.textMuted }]}>
          {draft[key]} {unit}
        </Text>
      </View>
      <Slider
        label={label}
        value={draft[key]}
        min={min}
        max={max}
        step={1}
        format={value => `${Math.round(value)} ${unit}`}
        onChange={value => setDraft(prev => ({ ...prev, [key]: Math.round(value) }))}
      />
    </View>
  );

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Pomodoro Settings"
      contentStyle={styles.content}>
      <Text style={[typeScale.footnote, styles.lede, { color: colors.textMuted }]}>
        Durations apply when you set them. Sound and vibration save as you change them.
      </Text>

      <Text style={[styles.section, { color: colors.textMuted }]}>DURATIONS</Text>
      {duration('focusMinutes', 'Focus', 1, 180, 'min')}
      {duration('shortMinutes', 'Short break', 1, 60, 'min')}
      {duration('longMinutes', 'Long break', 1, 90, 'min')}
      {duration('longEvery', 'Long break every', 2, 12, 'pomodoros')}

      <Text style={[styles.section, { color: colors.textMuted }]}>YOUR TREE</Text>

      {/*
        The whole feature has an off switch, and it is the first thing here.
        A pomodoro timer is a perfectly good thing to want on its own; somebody
        who finds a growing tree twee should not have to put up with it to use
        the clock. Off hides the species, the plot and the wilt rule together —
        half a feature is worse than none of it.
      */}
      <Touchable
        label={draft.trees ? 'Use a plain timer with no tree' : 'Grow a tree while you focus'}
        role="checkbox"
        state={{ checked: draft.trees }}
        onPress={() => setDraft(prev => ({ ...prev, trees: !prev.trees }))}
        style={[styles.wilt, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.flex}>
          <Text style={[typeScale.callout, { color: colors.text }]}>Grow a tree</Text>
          <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
            A tree grows for as long as you focus and is planted when the session ends. Turn
            this off for a plain pomodoro timer.
          </Text>
        </View>
        <View
          style={[
            styles.box,
            {
              backgroundColor: draft.trees ? colors.accent : 'transparent',
              borderColor: draft.trees ? colors.accent : colors.border,
            },
          ]}>
          {draft.trees ? <Check size={14} color={colors.onAccent} /> : null}
        </View>
      </Touchable>

      {draft.trees ? (
        <>
      <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
        Species unlock with the minutes you have focused for.
      </Text>
      <View style={styles.trees}>
        {SPECIES.map(species => {
          const unlocked = species.unlockAt <= focusMinutes;
          const active = draft.species === species.key;
          return (
            <Touchable
              key={species.key}
              disabled={!unlocked}
              onPress={() => setDraft(prev => ({ ...prev, species: species.key }))}
              label={
                unlocked
                  ? `${species.name}`
                  : `${species.name}, locked until ${species.unlockAt} focused minutes`
              }
              state={{ selected: active }}
              scaleTo={0.92}
              style={[
                styles.tree,
                {
                  backgroundColor: active ? withAlpha(colors.primary, 0.14) : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  opacity: unlocked ? 1 : 0.45,
                },
              ]}>
              <TreeChip species={species.key} size={46} />
              <Text
                numberOfLines={1}
                style={[typeScale.caption, styles.treeName, { color: colors.text }]}>
                {species.name}
              </Text>
              {unlocked ? null : (
                <View style={styles.treeLock}>
                  <Lock size={9} color={colors.textMuted} />
                  <Text style={[styles.treeLockText, { color: colors.textMuted }]}>
                    {species.unlockAt}m
                  </Text>
                </View>
              )}
            </Touchable>
          );
        })}
      </View>
      {upcoming ? (
        <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
          {upcoming.unlockAt - focusMinutes} more focused minutes unlocks the{' '}
          {upcoming.name.toLowerCase()}.
        </Text>
      ) : (
        <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
          Every species unlocked. That is {Math.round(focusMinutes / 60)} hours of focus.
        </Text>
      )}

      <Touchable
        label={
          draft.wilt
            ? 'Stop the tree withering when you leave the app'
            : 'Wither the tree if you leave the app'
        }
        role="checkbox"
        state={{ checked: draft.wilt }}
        onPress={() => setDraft(prev => ({ ...prev, wilt: !prev.wilt }))}
        style={[styles.wilt, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.flex}>
          <Text style={[typeScale.callout, { color: colors.text }]}>Leaving withers the tree</Text>
          <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
            Switch apps for more than 15 seconds and the tree goes grey. Your minutes still
            count — only the tree is lost.
          </Text>
        </View>
        <View
          style={[
            styles.box,
            {
              backgroundColor: draft.wilt ? colors.accent : 'transparent',
              borderColor: draft.wilt ? colors.accent : colors.border,
            },
          ]}>
          {draft.wilt ? <Check size={14} color={colors.onAccent} /> : null}
        </View>
      </Touchable>
        </>
      ) : null}


      {soundAvailable ? (
        <>
          <View style={styles.sectionRow}>
            <Text style={[styles.section, styles.flex, { color: colors.textMuted }]}>
              ALERT SOUND
            </Text>
            <Touchable
              label="Test the alert sound"
              onPress={() => {
                if (prefs.timerSound) {
                  previewSound(prefs.chimePreset);
                }
                if (prefs.timerVibration) {
                  buzz();
                }
              }}
              style={[styles.test, { borderColor: colors.border }]}>
              <Play size={13} color={colors.text} />
              <Text style={[typeScale.footnote, { color: colors.text }]}>Test</Text>
            </Touchable>
          </View>

          {silenced ? (
            <Text style={[typeScale.footnote, styles.note, { color: colors.warning }]}>
              {silenced === 'dnd' ? 'Do Not Disturb is on' : 'Your phone is silenced'} — the alert
              is an alarm, so it still sounds, but tap sounds elsewhere are muted.
            </Text>
          ) : null}

          <View style={styles.grid}>
            {[...CHIME_PRESETS, { id: 'off', label: 'Off', detail: 'No sound when a session ends' }].map(
              option => {
                const active =
                  option.id === 'off' ? !prefs.timerSound : prefs.timerSound && prefs.chimePreset === option.id;
                return (
                  <Touchable
                    key={option.id}
                    label={`${option.label} — ${option.detail}`}
                    state={{ selected: active }}
                    onPress={() => {
                      if (option.id === 'off') {
                        setSetting('timerSound', false);
                        return;
                      }
                      setSetting('timerSound', true);
                      setSetting('chimePreset', option.id);
                      // Picking a sound from a list of words is picking blind.
                      previewSound(option.id);
                    }}
                    style={[
                      styles.option,
                      // Off is not a sound, and there is an odd number of
                      // these — giving it the full width makes that read as a
                      // decision rather than a row that ran out of options.
                      option.id === 'off' ? styles.optionWide : null,
                      {
                        backgroundColor: active ? withAlpha(colors.primary, 0.12) : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}>
                    <View
                      style={[
                        styles.radio,
                        { borderColor: active ? colors.primary : colors.border },
                      ]}>
                      {active ? (
                        <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                      ) : null}
                    </View>
                    <Text style={[typeScale.footnote, styles.flex, { color: colors.text }]}>
                      {option.label}
                    </Text>
                  </Touchable>
                );
              },
            )}
          </View>

          <View style={styles.field}>
            <View style={styles.fieldHead}>
              <Volume2 size={15} color={colors.textMuted} />
              <Text style={[typeScale.callout, styles.flex, { color: colors.text }]}>Volume</Text>
              <Text style={[typeScale.footnote, styles.value, { color: colors.textMuted }]}>
                {Math.round(prefs.chimeVolume * 100)}%
              </Text>
            </View>
            <Slider
              label="Alert volume"
              value={prefs.chimeVolume}
              min={0}
              max={1}
              step={0.05}
              format={value => `${Math.round(value * 100)} percent`}
              onChange={value => setSetting('chimeVolume', value)}
              // Previewed on release, not on the frame: a drag would otherwise
              // stack twenty copies of the clip on top of each other.
              onCommit={value => {
                setSetting('chimeVolume', value);
                if (prefs.timerSound) {
                  previewSound(prefs.chimePreset);
                }
              }}
            />
          </View>
        </>
      ) : null}

      <Touchable
        label={prefs.timerVibration ? 'Turn off the end-of-session buzz' : 'Buzz when a session ends'}
        role="checkbox"
        state={{ checked: prefs.timerVibration }}
        onPress={() => {
          const next = !prefs.timerVibration;
          setSetting('timerVibration', next);
          if (next) {
            buzz();
          }
        }}
        style={styles.switchRow}>
        <View style={styles.flex}>
          <Text style={[typeScale.callout, { color: colors.text }]}>Vibration</Text>
          <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
            Buzz your phone when the timer ends
          </Text>
        </View>
        {/* A tick, not a filled square. An empty rounded box reads as a
            control that failed to render rather than one that is switched
            off — the same shape the question rows use for done. */}
        <View
          style={[
            styles.check,
            {
              backgroundColor: prefs.timerVibration ? colors.primary : 'transparent',
              borderColor: prefs.timerVibration ? colors.primary : colors.border,
            },
          ]}>
          {prefs.timerVibration ? (
            <Check size={15} color={colors.primaryText} strokeWidth={3} />
          ) : null}
        </View>
      </Touchable>

      <Touchable
        label="Set this configuration"
        onPress={apply}
        style={[styles.primary, { backgroundColor: colors.primary }]}>
        <Text style={[typeScale.callout, styles.primaryText, { color: colors.primaryText }]}>
          Set this configuration
        </Text>
      </Touchable>

      <Touchable
        label="Reset the pomodoro cycle"
        hint="Starts the count of completed pomodoros again from zero"
        onPress={() => {
          onResetCycle();
          onClose();
        }}
        style={[styles.secondary, { borderColor: colors.border }]}>
        <Text style={[typeScale.callout, { color: colors.text }]}>Reset pomodoro cycle</Text>
      </Touchable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  trees: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tree: {
    width: 78,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 2,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  treeName: {
    fontWeight: '600',
    textAlign: 'center',
  },
  treeLock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  treeLockText: {
    fontSize: 10,
    fontWeight: '700',
  },
  wilt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: 12,
  },
  field: {
    gap: 2,
  },
  fieldHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontVariant: ['tabular-nums'],
  },
  flex: {
    flex: 1,
  },
  lede: {
    marginTop: -4,
  },
  section: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 10,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  test: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  note: {
    marginTop: -6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    // Two per row, allowing for the gap.
    width: '48%',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  optionWide: {
    width: '100%',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryText: {
    fontWeight: '600',
  },
  secondary: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
