import React, { useEffect, useState } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Sheet } from '@/components/Sheet';
import { NotificationBell } from '@/components/NotificationBell';
import { Slider } from '@/components/Slider';
import { BellRing, Check, Compass } from 'lucide-react-native';
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
import { CHAPTERS } from '@/tour/script';
import { startTour } from '@/tour/store';
import { previewSound, silencingReason, soundAvailable } from '@/lib/sound';
import {
  DEFAULT_HOUR,
  cancelNotifications,
  hasNotificationPermission,
  notificationsAvailable,
  requestNotificationPermission,
  setNotificationSchedule,
  formatHour,
  sendTestNotification,
  type TestResult,
} from '@/lib/notifications';
import { syncReminders } from '@/lib/reminderSync';

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

/**
 * What to say after "Send one now".
 *
 * `quiet` is not a failure and must not read like one: it is the whole policy
 * working — nothing due, so nothing sent. Saying "no notification appeared"
 * there would teach the reader the feature is broken on exactly the evenings
 * it is behaving best.
 */
const TEST_REPLY: Record<string, string> = {
  posted: 'Sent — check your notification shade. That is the message tonight would carry.',
  quiet:
    'Sent a note saying there is nothing due. That is what tonight would be: no exam within a ' +
    'week, no streak at risk, no revision waiting. Notifications are reaching you.',
  blocked: 'Android is not letting Orbit post. Turn notifications on for Orbit in system settings.',
  unavailable: 'This build cannot post notifications.',
};

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
  /**
   * Whether Android will actually let a reminder through.
   *
   * Re-read on open rather than watched: the permission can be revoked from
   * system settings while the app is backgrounded, and a switch reading "on"
   * over a permission that has been taken away is a switch that lies.
   */
  const [notifyAllowed, setNotifyAllowed] = useState(false);
  /** null before anything is sent, 'sending' while in flight, then the result. */
  const [testState, setTestState] = useState<TestResult | 'sending' | null>(null);
  useEffect(() => {
    if (visible) {
      setNotifyAllowed(hasNotificationPermission());
    }
  }, [visible]);

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

      {notificationsAvailable ? (
        <>
          {/*
            "NOTIFICATIONS", then "Daily reminder (notification)".
            
            The section was headed "Daily reminder" with a bell beside it, and
            the reader's report was that they could not tell it was the
            notification switch at all — a bell is an icon, and "reminder" is a
            word this app also uses for exam countdowns and revision that are
            not notifications. The word people go looking for is the one
            Android's own settings use, so it is said twice: once as the
            section, once in brackets on the switch that turns them on.
          */}
          <View style={styles.reminderHead}>
            <NotificationBell enabled={settings.dailyReminder && notifyAllowed} />
            <Text style={[styles.section, styles.sectionInline, { color: colors.textMuted }]}>
              NOTIFICATIONS
            </Text>
          </View>

          <Switchable
            label="Daily reminder (notifications)"
            detail="Let Orbit send you a notification — one a day, and only when there is something worth saying"
            value={settings.dailyReminder && notifyAllowed}
            onChange={async next => {
              if (!next) {
                setSetting('dailyReminder', false);
                cancelNotifications();
                return;
              }
              const granted = hasNotificationPermission()
                ? true
                : await requestNotificationPermission();
              const allowed = granted || hasNotificationPermission();
              setNotifyAllowed(allowed);
              if (!allowed) {
                // Asked and refused. Leaving the switch off is the honest
                // outcome — showing it on over a denied permission is a
                // control that silently does nothing.
                setSetting('dailyReminder', false);
                return;
              }
              setSetting('dailyReminder', true);
              setNotificationSchedule(true, settings.reminderHour ?? DEFAULT_HOUR);
              // The switch used to arm an alarm over an empty digest, so the
              // check woke every evening, found no facts and went back to
              // sleep. See lib/reminderSync.ts.
              syncReminders().catch(() => {});
            }}
          />
          {/* The whole policy, said plainly. Someone deciding whether to let an
              app onto their lock screen deserves to know what it will do
              before they find out. */}
          <Text style={[styles.note, { color: withAlpha(colors.text, 0.5) }]}>
            At most one a day, in the evening. Nothing if you have already studied that day,
            and it stops asking for a week after three you ignore. Exam countdowns, a streak
            about to break, and revision that is due — never "come back and play".
          </Text>
          {settings.dailyReminder && !notifyAllowed ? (
            <Text style={[styles.note, { color: colors.warning }]}>
              Android is blocking notifications for Orbit. Turn them on in system settings.
            </Text>
          ) : null}

          {/* Only once the master switch is on. Showing three dead sub-switches
              above the one that enables them is a menu that answers a question
              nobody has asked yet. */}
          {settings.dailyReminder ? (
            <View style={styles.indent}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>WHAT TO SEND</Text>
              <Switchable
                label="Exam countdown"
                detail="In the last week before a date you have set"
                value={settings.remindExam}
                onChange={next => setSetting('remindExam', next)}
              />
              <Switchable
                label="Streak about to break"
                detail="Only once a streak is worth keeping"
                value={settings.remindStreak}
                onChange={next => setSetting('remindStreak', next)}
              />
              <Switchable
                label="Revision due"
                detail="When spaced revision has questions for today"
                value={settings.remindRevision}
                onChange={next => setSetting('remindRevision', next)}
              />
              <Text style={[styles.note, { color: withAlpha(colors.text, 0.5) }]}>
                Turning all three off is the same as turning the reminder off.
              </Text>

              {/*
                When it arrives.

                The hour was a constant — 19:00, for everyone. A reminder is a
                thing that interrupts you, so the one control it most obviously
                needs is the one saying when it may. Whole hours only: the
                alarm is inexact by design (see NotifyScheduler.kt), so minutes
                would be a precision the delivery cannot honour.
              */}
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>WHEN</Text>
              <View style={styles.scaleRow}>
                <Text style={[styles.rowDetail, { color: colors.textMuted }]}>
                  Check for something to say at
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {formatHour(settings.reminderHour)}
                </Text>
              </View>
              <Slider
                value={settings.reminderHour}
                min={6}
                max={23}
                step={1}
                onChange={next => setSetting('reminderHour', Math.round(next))}
                // On release, not on every step: each one re-arms an alarm.
                onCommit={next => {
                  setNotificationSchedule(true, Math.round(next));
                  syncReminders().catch(() => {});
                }}
                label="Reminder time"
                format={value => formatHour(Math.round(value))}
                ticks={[6, 12, 19, 23]}
                detents={[DEFAULT_HOUR]}
              />
              <Text style={[styles.note, { color: withAlpha(colors.text, 0.5) }]}>
                Give or take a few minutes — the alarm is inexact so Android can
                batch it with whatever else it was waking for, which is most of
                what a daily alarm costs a battery.
              </Text>

              {/*
                And the way to find out it works.

                Almost every rule in this feature is a rule about *not*
                posting, so it is silent on most evenings by design — which
                makes working and broken look identical from the outside. This
                sends tonight's real message through the real code path, and
                says plainly when tonight's answer is "nothing".
              */}
              <Touchable
                onPress={async () => {
                  setTestState('sending');
                  await syncReminders().catch(() => {});
                  setTestState(await sendTestNotification());
                }}
                label="Send a reminder now"
                hint="Posts tonight's reminder straight away so you can see one"
                style={[
                  styles.testButton,
                  { borderColor: colors.border, backgroundColor: colors.cardElevated },
                ]}>
                <BellRing size={16} color={colors.accent} />
                <Text style={[typeScale.callout, { color: colors.text }]}>
                  {testState === 'sending' ? 'Sending…' : 'Send one now'}
                </Text>
              </Touchable>
              {testState && testState !== 'sending' ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[
                    styles.note,
                    { color: testState === 'blocked' ? colors.warning : colors.textMuted },
                  ]}>
                  {TEST_REPLY[testState]}
                </Text>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}

      {/*
        The walkthrough, on demand.
        Two reasons it is a list of chapters rather than one "replay" button.
        The first run is eighteen steps and nobody comes back here wanting all
        eighteen again — they have forgotten one thing, and being made to sit
        through the other seventeen to reach it is why in-app tours get skipped
        the first time. The second is that the tour is the only place several
        of these features are explained at all, so it has to be reachable as
        reference and not only as an introduction.
      */}
      <Text style={[styles.section, { color: colors.textMuted }]}>WALKTHROUGH</Text>
      <View style={styles.tourRows}>
        {CHAPTERS.filter(chapter => chapter.id !== 'welcome').map(chapter => (
          <Touchable
            key={chapter.id}
            onPress={() => {
              /*
               * Close first. The tour points at controls on the screens behind
               * this sheet, and a sheet left open would cover the first thing
               * it tries to spotlight.
               */
              onClose();
              tick();
              startTour(chapter.id);
            }}
            label={`Walk me through ${chapter.name}`}
            hint={chapter.blurb}
            scaleTo={0.98}
            style={[styles.tourRow, { borderColor: colors.border }]}>
            <Compass size={16} color={colors.accent} />
            <View style={styles.flex}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{chapter.name}</Text>
              <Text style={[styles.rowDetail, { color: colors.textMuted }]}>{chapter.blurb}</Text>
            </View>
          </Touchable>
        ))}
      </View>

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
  tourRows: { gap: space.sm },
  tourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
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
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    marginTop: 12,
  },
  sectionInline: {
    marginTop: 0,
  },
  reminderHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: 2,
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
