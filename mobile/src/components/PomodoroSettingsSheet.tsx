import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Sheet } from '@/components/Sheet';
import { Slider } from '@/components/Slider';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { Play, Volume2 } from 'lucide-react-native';
import { CHIME_PRESETS, setSetting, useSettings } from '@/lib/settings';
import { previewSound, silencingReason, soundAvailable } from '@/lib/sound';
import { complete as buzz } from '@/lib/haptics';
import type { PomodoroSettings } from '@/hooks/usePomodoro';

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
}: {
  visible: boolean;
  onClose: () => void;
  settings: PomodoroSettings;
  onApply: (next: PomodoroSettings) => void;
  onResetCycle: () => void;
}) {
  const { colors } = useTheme();
  const prefs = useSettings();

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

  const duration = (
    key: keyof PomodoroSettings,
    label: string,
    min: number,
    max: number,
    unit: string,
  ) => (
    <Slider
      key={key}
      label={label}
      value={draft[key]}
      min={min}
      max={max}
      step={1}
      format={value => `${Math.round(value)} ${unit}`}
      onChange={value => setDraft(prev => ({ ...prev, [key]: Math.round(value) }))}
    />
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

          <View style={styles.volumeRow}>
            <Volume2 size={15} color={colors.textMuted} />
            <View style={styles.flex}>
              <Slider
                label="Volume"
                value={prefs.chimeVolume}
                min={0}
                max={1}
                step={0.05}
                format={value => `${Math.round(value * 100)}%`}
                onChange={value => setSetting('chimeVolume', value)}
                // On the step, not the frame: every change writes the store and
                // wakes every subscriber, and a preview per frame would stack
                // twenty copies of the clip on top of each other.
                onCommit={value => {
                  setSetting('chimeVolume', value);
                  if (prefs.timerSound) {
                    previewSound(prefs.chimePreset);
                  }
                }}
              />
            </View>
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
        <View
          style={[
            styles.check,
            {
              backgroundColor: prefs.timerVibration ? colors.primary : 'transparent',
              borderColor: prefs.timerVibration ? colors.primary : colors.border,
            },
          ]}
        />
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
  content: {
    gap: 14,
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
    marginTop: 4,
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
