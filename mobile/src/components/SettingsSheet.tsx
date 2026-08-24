import React, { useEffect, useState } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Sheet } from '@/components/Sheet';
import { Slider } from '@/components/Slider';
import { Check } from 'lucide-react-native';
import { useTheme, withAlpha } from '@/theme';
import { radius, space } from '@/theme/tokens';
import { typeScale } from '@/theme/typography';
import {
  TEXT_SIZE_MAX,
  TEXT_SIZE_MIN,
  TEXT_SIZE_STEP,
  TEXT_SIZE_DEFAULT,
  formatTextSize,
} from '@/theme/textScale';
import {
  setSetting,
  useSettings,
  TAP_PRESETS,
  CHIME_PRESETS,
} from '@/lib/settings';
import { tick } from '@/lib/haptics';
import { previewSound, silencingReason, soundAvailable } from '@/lib/sound';

/**
 * Everything the user can change, in one place.
 *
 * It exists because the header had grown a circle per setting, and that does
 * not scale: the next preference would have been a third circle, and the one
 * after that a fourth, until the top of the screen is a toolbar. One button
 * that opens a list is how this ends well.
 *
 * The controls each show their current value rather than only their name. A
 * settings row that says "Haptics" and nothing else makes you open it to find
 * out what it is set to.
 */

function Switchable({
  label,
  detail,
  value,
  onChange,
}: {
  label: string;
  detail: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <Touchable
      onPress={() => {
        onChange(!value);
        // The setting has just changed, which is a commit — and for the
        // haptics switch specifically it is also the only honest way to show
        // what was turned on.
        tick();
      }}
      role="switch"
      label={label}
      hint={detail}
      state={{ checked: value }}
      scaleTo={0.985}
      style={[styles.row, { borderColor: colors.border }]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.rowDetail, { color: colors.textMuted }]}>
          {detail}
        </Text>
      </View>
      <View
        style={[
          styles.box,
          {
            backgroundColor: value ? colors.accent : 'transparent',
            borderColor: value ? colors.accent : colors.border,
          },
        ]}
      >
        {value ? <Check size={15} color={colors.onAccent} /> : null}
      </View>
    </Touchable>
  );
}

export function SettingsSheet({
  visible,
  onClose,
  textSize,
  onTextSizeChange,
}: {
  visible: boolean;
  onClose: () => void;
  textSize: number;
  onTextSizeChange: (value: number) => void;
}) {
  const { colors } = useTheme();
  const settings = useSettings();

  /**
   * Re-read every time the sheet opens.
   *
   * Do Not Disturb is toggled from the notification shade, so the answer can
   * change while the app is in the background and there is no callback for
   * either this or the ringer mode. Reading it on open is both the cheapest
   * and the most accurate moment.
   */
  const [silenced, setSilenced] =
    useState<ReturnType<typeof silencingReason>>('');
  useEffect(() => {
    if (visible) {
      setSilenced(silencingReason());
    }
  }, [visible]);

  /**
   * Drafted while dragging. Writing the real text size on every step re-renders
   * every piece of text in the app — see the note in HomeScreen; the preview
   * below is what moves during the drag, and the app is re-typeset once.
   */
  const [sizeDraft, setSizeDraft] = React.useState(textSize);
  React.useEffect(() => {
    if (visible) {
      setSizeDraft(textSize);
    }
  }, [visible, textSize]);

  return (
    <Sheet visible={visible} onClose={onClose} title="Settings">
      <Text style={[styles.section, { color: colors.textMuted }]}>
        TEXT SIZE
      </Text>
      <View
        style={[
          styles.preview,
          { backgroundColor: colors.cardElevated, borderColor: colors.border },
        ]}
      >
        {/* Sized from the draft with plain React Native Text, so it is not
            scaled a second time by the committed value mid-drag. */}
        <RNText
          numberOfLines={3}
          style={[
            styles.sample,
            { color: colors.text, fontSize: Math.round(15 * sizeDraft) },
          ]}
        >
          Bilirubin is conjugated in the hepatocyte and excreted in bile.
        </RNText>
      </View>
      <View style={styles.scaleRow}>
        <Text style={[styles.smallA, { color: colors.textMuted }]}>A</Text>
        <Text
          testID="text-size-value"
          style={[styles.value, { color: colors.text }]}
        >
          {formatTextSize(sizeDraft)}
        </Text>
        <Text style={[styles.largeA, { color: colors.textMuted }]}>A</Text>
      </View>
      <Slider
        value={sizeDraft}
        min={TEXT_SIZE_MIN}
        max={TEXT_SIZE_MAX}
        step={TEXT_SIZE_STEP}
        onChange={setSizeDraft}
        onCommit={onTextSizeChange}
        label="Text size"
        format={formatTextSize}
        detents={[TEXT_SIZE_DEFAULT]}
        ticks={[TEXT_SIZE_MIN, TEXT_SIZE_DEFAULT, 1.08, TEXT_SIZE_MAX]}
      />

      <Text style={[styles.section, { color: colors.textMuted }]}>
        FEEDBACK
      </Text>
      <Switchable
        label="Haptics"
        detail="A short vibration when you tap"
        value={settings.haptics}
        onChange={next => setSetting('haptics', next)}
      />
      {settings.haptics ? (
        <View style={styles.indent}>
          <View style={styles.scaleRow}>
            <Text style={[styles.rowDetail, { color: colors.textMuted }]}>
              Strength
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {Math.round(settings.hapticStrength * 100)}%
            </Text>
          </View>
          <Slider
            value={settings.hapticStrength}
            min={0}
            max={1}
            step={0.05}
            onChange={next => setSetting('hapticStrength', next)}
            // Fired on release as well, so the strength just chosen is felt
            // once at full length rather than only as the taps that set it.
            onCommit={() => tick()}
            label="Haptic strength"
            format={value => `${Math.round(value * 100)} percent`}
            ticks={[0, 0.5, 1]}
          />
          <Text style={[styles.rowDetail, { color: colors.textMuted }]}>
            Stronger means a longer buzz — Android gives no way to change how
            hard the motor pushes without a bigger dependency than this is
            worth.
          </Text>
        </View>
      ) : null}
      {/* Hidden rather than disabled when the build cannot play audio — the
          preview harness, or any build where the native module did not
          register. A switch that is present and does nothing is worse than an
          absent one. */}
      {soundAvailable ? (
        <>
          <Switchable
            label="Tap sounds"
            detail="A soft click when you press something"
            value={settings.tapSound}
            onChange={next => setSetting('tapSound', next)}
          />
          {/* Otherwise this reads as a broken switch. Taps go out on the
              system sound stream, which silent mode and Do Not Disturb mute —
              the right behaviour, and impossible to guess from a switch that
              is on and quiet. The generic sentence was already here and was
              still being read past, so when the phone is *currently* muted it
              says which setting is doing it instead. */}
          {silenced ? (
            <View
              style={[
                styles.silenced,
                {
                  backgroundColor: withAlpha(colors.warning, 0.12),
                  borderColor: withAlpha(colors.warning, 0.4),
                },
              ]}
            >
              <Text style={[styles.silencedTitle, { color: colors.warning }]}>
                {silenced === 'dnd'
                  ? 'Do Not Disturb is on'
                  : silenced === 'silent'
                  ? 'Your phone is on silent'
                  : 'Your phone is set to vibrate'}
              </Text>
              <Text
                style={[styles.note, { color: withAlpha(colors.text, 0.75) }]}
              >
                Android is muting tap sounds right now — nothing here is broken.
                Turn it off to hear them. The timer chime is an alarm, so it
                still sounds either way; play one from Timer sound below to
                check your volume.
              </Text>
            </View>
          ) : (
            <Text style={[styles.note, { color: withAlpha(colors.text, 0.5) }]}>
              Clicks follow your phone: silent mode and Do Not Disturb mute
              them. The timer chime is an alarm, so it still sounds.
            </Text>
          )}
          <SoundPicker
            title="PRESS SOUND"
            options={TAP_PRESETS}
            selected={settings.tapPreset}
            onSelect={id => setSetting('tapPreset', id)}
          />

          <Switchable
            label="Timer sound"
            detail="A chime when a focus session ends"
            value={settings.timerSound}
            onChange={next => setSetting('timerSound', next)}
          />
          <SoundPicker
            title="TIMER SOUND"
            options={CHIME_PRESETS}
            selected={settings.chimePreset}
            onSelect={id => setSetting('chimePreset', id)}
          />
        </>
      ) : null}

      <Text style={[styles.footnote, { color: withAlpha(colors.text, 0.45) }]}>
        Themes and wallpaper live behind the moon button, next door.
      </Text>
    </Sheet>
  );
}

/**
 * A list of sounds you can hear before choosing.
 *
 * Selecting plays the clip — picking a sound from names alone is picking
 * blind, and it also answers "is sound working at all" without making anyone
 * hunt for a switch. `previewSound` deliberately ignores the on/off toggles
 * so the options can be auditioned before the feature is turned on.
 */
function SoundPicker({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: { id: string; label: string; detail: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.indent}>
      <Text style={[styles.section, { color: colors.textMuted }]}>{title}</Text>
      {options.map(option => {
        const active = option.id === selected;
        return (
          <Touchable
            key={option.id}
            onPress={() => {
              onSelect(option.id);
              previewSound(option.id);
            }}
            role="radio"
            state={{ checked: active }}
            label={`${option.label}. ${option.detail}`}
            scaleTo={0.98}
            style={[
              styles.preset,
              {
                borderColor: active ? colors.accent : colors.border,
                backgroundColor: active
                  ? withAlpha(colors.accent, 0.1)
                  : 'transparent',
              },
            ]}
          >
            <View style={styles.flex}>
              <Text
                style={[
                  styles.presetLabel,
                  { color: active ? colors.accent : colors.text },
                ]}
              >
                {option.label}
              </Text>
              <Text style={[styles.presetDetail, { color: colors.textMuted }]}>
                {option.detail}
              </Text>
            </View>
          </Touchable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  preset: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    marginBottom: space.xs,
    minHeight: 44,
  },
  presetLabel: {
    ...typeScale.bodyStrong,
  },
  presetDetail: {
    ...typeScale.caption,
    marginTop: 2,
  },
  section: {
    ...typeScale.overline,
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  preview: {
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    // Fixed, not min: a box that grows while the slider under it is being
    // dragged moves the slider.
    height: 92,
    justifyContent: 'center',
  },
  sample: {
    ...typeScale.body,
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 30,
    marginTop: space.sm,
  },
  smallA: {
    fontSize: 12,
    fontWeight: '700',
  },
  largeA: {
    fontSize: 20,
    fontWeight: '700',
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    ...typeScale.body,
    fontWeight: '600',
  },
  rowDetail: {
    ...typeScale.caption,
  },
  box: {
    height: 24,
    width: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indent: {
    paddingLeft: space.sm,
    paddingBottom: space.md,
  },
  footnote: {
    ...typeScale.caption,
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  silenced: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
    gap: 4,
  },
  silencedTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  note: {
    ...typeScale.caption,
    marginTop: space.xs,
    marginBottom: space.sm,
    paddingHorizontal: space.xs,
  },
});
