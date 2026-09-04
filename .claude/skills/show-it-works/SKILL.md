---
name: show-it-works
description: Prove a change works and show a screenshot of it, before saying it is done. Use whenever finishing a feature, a fix or a UI change in this repo; when about to report something as working, complete, fixed or ready; before cutting a release build; and whenever tempted to write "this should now work" — that sentence is the signal this skill exists for.
---

# Show it works

## The rule

**Never report a change as working on the strength of the code being written.**
Run something that exercises it, look at what it draws, and say plainly which
parts you verified and which you did not.

This exists because of a run of real failures in this repo, every one of which
was reported as finished:

- A sound module that was **never registered** under the New Architecture:
  correct Kotlin, correct WAVs in the APK, `NativeModules.OrbitSound`
  undefined on every device. Settings hid the switches exactly as designed and
  nothing made a noise. No crash, no log.
- Notes rendering `[object Object]` on a phone while the demo screen looked
  perfect, because the fixture had been written with plain strings and agreed
  with the bug.
- Two sliders shipped with **no value on screen** — the number only ever went
  to the accessibility layer. The reader found it, twice.
- A daily reminder whose alarm woke every evening, found an empty digest, and
  went back to sleep. For ever, with the switch reading on.
- A release that **failed to build** on two eslint errors, reported as green
  because `npx eslint .` prints 69 warnings around them.

None of these were hard bugs. All of them survived because "I wrote the code"
was treated as "it works".

## What counts as proof, in order

1. **The smoke harness.** `cd mobile && npm run check:smoke` drives the real
   screens through a browser. Add a step for what you built. It selects
   controls by accessibility label, so a control it cannot find is one TalkBack
   cannot announce either. **Not a substitute for a device**: it is
   react-native-web, so it checks layout and logic, never native rendering,
   gesture timing or anything Kotlin does.
2. **A screenshot, looked at.** `cd mobile && node preview/shoot.mjs [outDir]`,
   or a short Playwright script that drives the flow. Then *actually read the
   image*. Half the bugs above are visible in one glance and invisible in a
   diff — grey on black, a missing value, a card with no way into it.
3. **A check script** for anything the harness structurally cannot see: native
   modules, manifests, file storage, scheduling, cross-app agreement. See
   `mobile/scripts/*-check.mjs`. This is the only cover for Kotlin.
4. **`npm run check:kotlin`, for anything Kotlin.** There is **no Kotlin
   compiler in this sandbox** — tsc, eslint, every check, the smoke harness and
   the release bundle are all green over Kotlin that will not compile, and the
   error appears six minutes into a Gradle step on CI as a failed release. That
   has happened twice. This reads React Native's own Android sources out of
   `node_modules` and matches every `override fun` against the declaration it
   claims to come from.

   It is not a compiler. **A commit that touches Kotlin is not verified until
   the CI run is green** — check the workflow run before reporting it.
5. **The release bundle.**
   `npx react-native bundle --platform android --dev false --entry-file index.js
   --bundle-output /tmp/b.js` — a green bundle is the strongest signal available
   without a device.

## Before saying "done"

```sh
cd mobile
npx tsc --noEmit                 # clean
npx eslint . --quiet             # MUST be --quiet: 69 warnings hide the errors,
                                 # and that has broken a release build already
npm run check:smoke              # and a new step for what you built
npm run check:kotlin             # if you touched any .kt — there is no local compiler
node preview/shoot.mjs /tmp/shot # then open the PNGs and look at them
```

Plus every `check:*` in `package.json` that touches what you changed, and the
bundle.

## Then send the screenshot

The app's owner asked for this directly: **show a screenshot of what you are
building**. A described change cannot be judged; a picture can, in seconds, by
the person who knows what it is supposed to look like.

Send the state that answers the request — a filed note showing on its chapter,
a badge you can tell is earned, the reply after tapping the button. Not an
empty form. If the feature has a before and after, send both.

## Say what you did not verify

There is no emulator in most sandboxes. So:

- **Never claim device behaviour was checked when it was not.** Say "the Kotlin
  compiles and is wired up; posting to the notification shade needs the APK on
  a phone."
- **Kotlin is compiled by CI and nowhere else.** Wait for the run.
- **Name what the harness cannot reach**: native modules, permissions dialogs,
  the soft keyboard (react-native-web has none), notification delivery, file
  pickers, audio.
- **A green bundle is a green bundle**, not a working feature.

Being explicit here is not hedging. It is the difference between the owner
knowing to tap the test button once and the owner discovering a dead feature a
week later.

## The tells that you are about to get this wrong

| You are writing | Do this instead |
|---|---|
| "This should now work" | Run it, then say what happened |
| "The implementation is complete" | Show the screen it produces |
| "I've added X" as the whole report | Add what proves X, and what X does not cover |
| "Tests pass" (didn't run them) | Run them and paste the last line |
| "Fixed the release" (didn't rebuild) | Check the actual workflow run |

## Take the screenshot, and SHOW it — every time, unasked

Added on the owner's instruction, 2026-09-04: *"hereafter what you do,
screenshot and show what you build in preview"*. This applies to Claude Code
and to Antigravity equally.

Looking at the picture yourself is not the rule. **Delivering it is.** The
owner has repeatedly been the one to find a defect that a harness had already
drawn — the wrong plate on Breast Carcinoma, a baroreceptor diagram over the
cardiac cycle question, two sliders with no number on them. In each case a
screenshot existed or could have; nobody put it in front of the person who
would recognise it in one second.

So, for any change with a visible surface:

1. Capture it from the **real screen**, through the preview harness, not from a
   mockup and not from a description. `node preview/shoot.mjs [outDir]` for the
   set; the targeted harnesses (`preview/page-ref-shots.mjs`,
   `diagram-shot.mjs`, `music-shot.mjs`, `apkg-shot.mjs`, …) for one feature.
   Write a new one when none fits — they are short.
2. **Look at it** before sending. A capture you did not open is not evidence,
   and this repo has shipped a black `tca-note.png` and a notes capture reading
   "This diagram could not be loaded" precisely that way.
3. **Send it**, and say what in the picture shows the change. In Claude Code
   that is the file-sending tool; in Antigravity, attach it in the reply.
4. Say what the picture **cannot** show. react-native-web is not Android: it
   has no native driver, no real gesture timing, no `RuntimeShader`, no
   TalkBack. A screenshot proves layout and copy. It never proves feel, and it
   never proves a native module is registered.

A change with no visible surface — a check, a schedule, an edge function — is
exempt from the picture and not from the proof: show the command and its real
output instead.
