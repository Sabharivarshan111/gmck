# Orbit MBBS — rules for any coding agent

> **Running this in an IDE? `npm run dev` is the OLD WEB APP.**
>
> This repo holds two apps. The root `dev`, `build` and `preview` scripts —
> the ones an IDE's Run button finds, because they are in the root
> `package.json` — serve the original Vite web app in `src/`. The native
> React Native app, with all of its animations, lives in `mobile/`.
>
> To see the native app in a browser:
>
> ```sh
> npm run dev:mobile        # or: cd mobile && npm run preview
> ```
>
> Previewed this and saw none of the motion work? That is why: you were
> looking at the web app.

Cross-tool rules (Antigravity, Cursor, Codex, Claude Code), kept under
Antigravity's 12,000-char cap — deliberately the short version.

**Read `HANDOFF.md` first** for current status, then `CLAUDE.md` for the full
reasoning. This file is the subset that is expensive to get wrong early.

`.agents/rules/` holds the rest, split so each file fits the cap:

| File | What |
|---|---|
| `.agents/rules/00-working-agreement.md` | how the two agents share this repo |
| `.agents/rules/10-motion.md` | animation rules; what never ships |
| `.agents/rules/20-interface.md` | theming, type, materials, a11y, perf |

Deep reference stays in `.claude/skills/` and is **pointed at, never copied** —
`apple-design/README.md` is its index. `npm run check:agent-docs` (in
`mobile/`) fails if a rules file goes over the cap, if `GEMINI.md` starts
holding rules of its own, or if any path above stops resolving.

## The repo holds two apps

| Path | What |
|---|---|
| `src/`, `index.html`, `vite.config.ts` | the Vite/React **web** app, still live |
| `mobile/` | the **React Native Android** app |
| `supabase/` | edge functions and migrations, shared by both |

They share one Supabase project and one question bank. **Do not refactor the
web app while working on the native one.**

`src/data/` (~750 KB of TypeScript) reaches the native app through a `@data`
alias, and `src/lib/profanity.ts` through `@shared`. Wired in
`mobile/metro.config.js`, `mobile/babel.config.js`, `mobile/tsconfig.json` and
`mobile/preview/vite.config.ts` — **all four must agree**. Never copy those
files into `mobile/`; a second copy will drift.

## Things that will cost real money or users

- **`applicationId` is `com.aistudio.mbbsqbank.aycxvd`.** It matches the
  published Play listing. Changing it publishes a *second app* instead of an
  update.
- **`versionCode` must increase on every Play upload.** 13 is live; the repo
  carries 14.
- **Never commit secrets** — keystore, passwords, certificates, API keys. The
  signing key lives only in GitHub Actions secrets. Do not base64 it into a
  workflow file to "fix" a build.
- **Test builds must serve no ads at all.** `mobile/src/lib/adsMode.ts` exports
  `ADS_ENABLED = !__DEV__`; the debug and internal workflows overwrite it with
  `false`, so AdMob never starts. Serving yourself live ads is a policy
  violation that can suspend the account. Release builds leave it alone and *do*
  serve ads — `android-release.yml` asserts that.
- The open Gemini access, the absence of an app-side rate limit, and the public
  leaderboard are **deliberate**. Do not "fix" them.

## Cutting a build

Every workflow in `.github/workflows/` runs on a **push to
`claude/native-app-sync`** and publishes to a GitHub **Release**, so you can
cut one too — push, then watch Actions on `gmck`.

| Want | Workflow | Package | Ads | Signs in? |
|---|---|---|---|---|
| Poke at it | `android-debug.yml` | `…aycxvd.debug` | none | no |
| Test sign-in | `android-internal.yml` | `…aycxvd` | none | yes |
| Upload to Play | `android-release.yml` | `…aycxvd` | **live** | yes |

The release one builds both the `.aab` (for Play) and an `.apk` (to sideload).

Secrets are per repo and every push goes to two: only `gmck` has the signing
three, so the mirror's release run dies at "Restore the upload keystore" — a
missing secret, not a broken build. Same for `SUPABASE_ACCESS_TOKEN`.

No sandbox reaches Supabase — the gateway 403s the CONNECT — so a token is no
unblock, only a reason to run `supabase-tasks.yml` on a runner.

`.agents/rules/40-releases.md` has the rest: what a wrong build costs, why
sign-in works only in the internal one, and why CI first compiles the Kotlin.

## New Architecture: a native module must be a TurboModule

`newArchEnabled=true`. A module registered from a plain `ReactPackage` is
**never reachable** — the TurboModule manager only reads such packages when
`useTurboModuleInterop` is on, and that flag is `false` in every stable React
Native release. The sound module shipped that way and was silent on every
device with no error anywhere.

A working native module needs all four: a spec in `mobile/src/native/Native*.ts`,
`codegenConfig` in `mobile/package.json`, the Kotlin class extending the
**generated** spec, and a `BaseReactPackage` declaring `isTurboModule = true`.
`npm run check:native-sound` asserts it.

Audio specifics that look like bugs and are the platform: taps use
`USAGE_ASSISTANCE_SONIFICATION` so silent mode and Do Not Disturb mute them;
the focus chime uses `USAGE_ALARM` on its own pool so it survives DND.

## Notes render objects, not strings

`generate-handwritten-notes` emits **objects** in every list section —
`bullets` items are `{label, description}`, `steps` are
`{title, description, keyTrigger?}`, `flowchart` steps are `{label, detail}`,
`comparison` rows are `{label, left, right}`. Only `revision.items` is
`string[]`.

Running an item through `String(item)` prints `[object Object]` on a phone.
That shipped once, because the preview fixture had been written with plain
strings — a fixture that agreed with the bug. `**bold**` in the model's output
is a highlight, not literal asterisks. `npm run check:notes-schema` pins the
fixture, the renderer and the edge function's schema together.

Its zod schema is `questions: z.array(z.string().max(1000)).min(1).max(400)`,
and a violation is a **400 for the whole request**, breaking Notes for one
topic with no symptom elsewhere. `mobile/src/lib/notesLimits.ts` clamps from the
*head*, because importance stars and PYQ years are at the start of a question.

## `ask-gemini` is told the intent, it does not infer it

`mobile/src/lib/askAi.ts` owns every request to that function; nothing else
should build one. The function picks its system prompt from **flags in the
request body** — `isMCQRequest` selects the MCQ branch. Prose that *describes*
wanting MCQs does nothing. The medical-vs-generic prompt is chosen by keyword
match on the prompt text, which is why `tripleTapPrompt()` says "MBBS medical
exam question" on purpose. `npm run check:mcq` covers the parsing.

## Motion, themes and accessibility

- **Do not hand-roll an animation.** Springs, easings, durations, momentum and
  rubber-banding live in `mobile/src/theme/motion.ts`. The primitives are
  `Touchable`, `Sheet`, `Dialog`, `Slider`, `HoloCard`, `Reorderable`,
  `SortableGrid`, `BackButton`, `listTuning`.
- **Every `Animated.timing` names an `easing` from `EASE`.** Omitting it is the
  bug, not the default.
- **Progress bars use `scaleX` + `transformOrigin: 'left'`, never animated
  `width`.** Width forces layout every frame on the JS thread.
- **Nothing scales from 0.** Entrances start at 0.6–0.9.
- **Reduced motion is not optional.** `useReducedMotion()` is wired into every
  primitive; new motion handles it in the same commit.
- **`Touchable` requires a `label`.** An unlabelled control is unusable with
  TalkBack. Keep targets at 44dp using `hitSlop`, not padding.
- **A theme is four colours**; `paletteFrom()` derives the other fourteen.
  `success`/`warning`/`danger` stay green/amber/red in **every** theme, and
  `onAccent` is computed from luminance, never hardcoded white.
- **Design tokens**: `theme/tokens.ts` for spacing and radius, `typeScale` in
  `theme/typography.ts` for type. A bare `fontSize` ships without its tracking
  and leading.
- **Font is pinned to Roboto** — OEM skins otherwise re-typeset the whole app.
- **No backdrop blur, and no faking it.** React Native has no equivalent
  without another dependency. `GlassSurface` draws the specular highlight,
  translucency and float instead.
- **Never put `elevation` on a view with no background colour.** Android takes
  the shadow outline from the bounds, so a large `borderRadius` renders as a
  visible polygon.

## Performance rules that are not micro-optimisation

The target is a 3 GB Android phone.

- Question rows subscribe to **one question** (`useQuestionDone`), never to the
  store's global version. `npm run check:fanout` fails if that regresses.
- `theme/textScale.tsx` multiplies the type ramp and is applied centrally in
  `components/Text.tsx`, which takes a **zero-cost fast path at exactly 1**.
  Do not move that work anywhere it runs per row.
- Sliders emit on the **step**, not the frame: every `Text` subscribes to text
  size, so a callback per frame is a full-tree re-render per frame.
- PanResponders built in a `useMemo` must not depend on values that change
  during the gesture — the replacement never saw the grant, and the drag dies
  after one frame.

## Storage keys are shared with the web app

One user with both installed must see one state:

- `orbit-profile-v1` — `{ display_name, year }` with short year codes
  (`first`/`second`/`third`/`final`), **not** the internal `YearKey` form
- `question-<first 50 chars, spaces→dashes>` — per-question completion
- `orbit:daily-ad:{progress,theme,questions}` — daily ad caps

Changing any of these shapes breaks cross-install continuity.

`record_questions_done` opens with `IF _year IS NULL THEN RETURN 0` — it needs
the caller's `profiles` row to exist, so a push before that returns 0 and
reports **no error**. `npm run check:sync` pins the ordering.

## `mobile/preview/` is a dev-only tool

It renders the RN screens in a browser via react-native-web so screens can be
reviewed without an emulator. It is **not** imported by `index.js`, Metro never
sees it, and nothing from it reaches the APK. When you add a native dependency,
add a shim there; when you add a provider to `App.tsx`, add it to
`preview/main.tsx` too.

A render error must never blank the app: `components/ErrorBoundary.tsx` wraps
everything **outside** the providers and uses literal colours on purpose.

## Verify before claiming something works

```sh
cd mobile
npx tsc --noEmit          # must be clean
npx eslint . --quiet      # must print nothing (warnings hide errors)
npm run check:xp          # one XP ladder, shared with web
npm run check:reminder    # the reminder reaches a phone
npm run check:note-media  # note media: on-phone, uncapped
npm run check:edges       # no page sits under the status bar
npm run check:kotlin      # Kotlin overrides (no local kotlinc)
npm run check:smoke       # drives the real screens through a browser
# ...and every other check:* in mobile/package.json that touches what
# you changed. Each one names the bug it exists for in its header.
npx react-native bundle --platform android --dev false \
  --entry-file index.js --bundle-output /tmp/b.js   # must succeed
```

`check:smoke` selects controls by accessibility label, so a control it cannot
find is one TalkBack cannot announce either. It needs a Chromium binary.

There is usually no emulator available, so a green bundle is the strongest
signal short of a device. **Do not claim device behaviour was verified when it
was not** — and note the preview harness is react-native-web, so it checks
layout, not native rendering, gestures or animation timing.
