---
description: Prove a change works and show a screenshot before calling it done — what counts as proof here, and what the harness structurally cannot see
---

# Show it works

**Never report a change as working on the strength of having written it.** Run
something that exercises it, look at what it draws, say which parts you
verified and which you did not.

Every one of these was reported as finished:

- A sound module **never registered** under the New Architecture. Correct
  Kotlin, WAVs in the APK, `NativeModules.OrbitSound` undefined on every
  device. Settings hid the switches as designed and nothing made a noise.
- Notes rendering `[object Object]` on a phone while the demo looked perfect,
  because the fixture had been written with plain strings and agreed with the
  bug.
- Two sliders shipped with **no value on screen** — the number only reached the
  accessibility layer. The reader found it, twice.
- A daily reminder whose alarm woke every evening, found an empty digest, and
  went back to sleep. For ever, with the switch reading on.
- A release that **failed to build** on two eslint errors, reported green
  because `npx eslint .` prints 69 warnings around them.

None were hard bugs. All survived because "I wrote it" was treated as "it
works".

## What counts as proof, in order

1. **`npm run check:smoke`** (in `mobile/`) — drives the real screens through a
   browser, selecting controls by accessibility label, so one it cannot find is
   one TalkBack cannot announce. Add a step for what you built. It is
   react-native-web: it never checks native rendering, gesture timing, or
   anything Kotlin does.
2. **A screenshot, looked at.** `node preview/shoot.mjs [outDir]`, or a short
   Playwright script for the flow. Then *read the image*. Half the bugs above
   are obvious in a glance and invisible in a diff.
3. **A check script** for what the harness structurally cannot see — native
   modules, manifests, file storage, scheduling, agreement with the web app.
   `mobile/scripts/*-check.mjs`. The only cover Kotlin has.
4. **`npm run check:kotlin`, for anything Kotlin.** There is no Kotlin compiler
   in this sandbox: everything above is green over Kotlin that will not build,
   and the error lands six minutes into a Gradle step on CI as a failed
   release. Twice, so far. It reads React Native's own Android sources from
   `node_modules` and matches every `override fun` against what it claims to
   override. It is not a compiler — **a commit touching Kotlin is not verified
   until the CI run is green.**
5. **The release bundle** — `npx react-native bundle --platform android --dev
   false --entry-file index.js --bundle-output /tmp/b.js`.

## Before saying done

```sh
cd mobile
npx tsc --noEmit
npx eslint . --quiet     # --quiet is not optional; warnings hide the errors
npm run check:smoke
npm run check:kotlin     # if you touched any .kt
node preview/shoot.mjs /tmp/shot   # then open the PNGs
```

Plus every `check:*` touching what you changed, and the bundle.

## Then send the screenshot

The app's owner asked for this directly. Send the state that answers the
request — a filed note showing on its chapter, a badge you can tell is earned,
the reply after tapping the button. Not an empty form.

## Say what you did not verify

There is no emulator in most sandboxes. Never claim device behaviour was
checked when it was not: "the Kotlin compiles and is wired up; posting to the
shade needs the APK on a phone." Name what the harness cannot reach — native
modules, permission dialogs, the soft keyboard, notification delivery, file
pickers, audio. A green bundle is a green bundle, not a working feature.

That is not hedging. It is the difference between the owner tapping the test
button once and finding a dead feature a week later.

## The tells

| Writing this | Do this |
|---|---|
| "This should now work" | Run it, then say what happened |
| "The implementation is complete" | Show the screen it produces |
| "I've added X" as the whole report | Add what proves X, and what X misses |
| "Tests pass" (didn't run) | Run them, paste the last line |
| "Fixed the release" (didn't rebuild) | Check the workflow run |
