---
description: The daily study reminder — why it is usually silent, and the two ways that silence has meant "broken"
---

# The daily reminder

**Local notifications, not push.** Everything worth saying is already known on
the device. Push would mean Firebase, a token table, a server cron and sending
a student's study state to a backend to be told what their own phone knew.

**The decision happens at fire time, in Kotlin, without waking JavaScript.**
Two inputs change while the app is closed — days remaining to an exam, and
whether "studied today" is still true — so a message composed when the app was
last open would say "3 days to go" for a week.

## The rules are rules about *not* posting

`NotifyReceiver.onReceive`, in order:

1. **One a day at most**, on a stored epoch day rather than on the alarm, so a
   reboot that reschedules cannot fire twice.
2. **Silence if they already studied today.** Telling someone who just closed
   the app to come back is the behaviour that gets an app muted for ever.
3. **Back off when ignored.** Three unopened and it drops to one a week. Most
   apps escalate here; escalating is how you get uninstalled.
4. **One message, by priority** — exam → streak → revision → nothing.

"Continue where you left off" is deliberately not on that ladder: no deadline
behind it and nothing the reader does not already know.

## The digest has to exist

The receiver reads a **digest** the app leaves in SharedPreferences and posts
nothing when it is empty. That is correct, and it hid a real bug: the digest
was written from `ProgressScreen` and nowhere else, so turning the reminder on
in Settings and never visiting My Progress armed an alarm that woke every
evening, found no facts, and went back to sleep. For ever. No failure, no log.

`mobile/src/lib/reminderSync.ts` is the **only** writer now. It is called from
`App.tsx` **after `hydrateProgress` resolves** — run it before and the digest
says nobody has ever studied, which the receiver will act on — and from My
Progress when the facts behind it change.

It also **re-arms the alarm on every launch**. `setSchedule` used to be called
only when the switch was flipped, and an Android alarm does not survive a
force-stop: one "Force stop", or one swipe on some OEM skins, and the reminder
was gone with the switch still reading on.

## "Send one now" is the feature, not a debug button

Because the feature is silent by design, working and completely dead look
identical from the outside — to the reader and to whoever wrote it. There was
no way to confirm delivery short of waiting for the evening.

`sendTest` runs the receiver's real `compose` over the real digest and posts
through its real `post`. A test that posts a *different* notification — other
channel, other icon, other tap target — proves that a test works and nothing
about the reminder.

Two things it must keep doing:

- **Skip the frequency gates, not the content rules.** One-a-day, studied-today
  and the back-off are about *how often*; this is a deliberate request, not the
  daily check.
- **Never write `KEY_LAST_POSTED`.** Asking to see a reminder would otherwise
  silence tonight's real one.

When tonight's rules genuinely produce nothing it **says so** rather than
inventing a message. That answer is the feature working, and the reply must not
read like a failure.

## The hour belongs to the reader

`reminderHour`, 6 to 23, on a slider that shows a clock time. It had been a
stored setting with no control behind it — 19:00 for everyone.

Whole hours only. `NotifyScheduler` uses `setWindow`, not `setExact`: exact
alarms need SCHEDULE_EXACT_ALARM, which Play grants to alarm clocks and
calendars and not to study apps. Minutes would be a precision the delivery
cannot honour. Commit on **release**, not on every step — each one re-arms an
alarm.

## Four things Android needs, and none are visible to tsc

`npm run check:reminder` asserts all of them, because the preview harness is
react-native-web and has no NotificationManager, no AlarmManager and no shade.

1. `POST_NOTIFICATIONS` and `RECEIVE_BOOT_COMPLETED` in the manifest.
2. `.NotifyReceiver` declared there too, or the alarm reaches nothing.
3. `NotifyPackage()` registered in `MainApplication`, as a `BaseReactPackage`
   declaring `isTurboModule = true` — under the New Architecture anything else
   is never asked for a module at all.
4. The spec using `TurboModuleRegistry.get`, not `getEnforcing`, so a missing
   module degrades instead of crashing.

Permission is asked through React Native's `PermissionsAndroid`, never the
native module: the native one fires the dialog and resolves in the same breath,
so tapping "Allow" still left the switch off. And never at launch — Android
stops showing the dialog after two refusals, so the single chance to ask
belongs at the moment the reader says they want this.
