# Orbit MBBS — rules for any coding agent

> **Running this in an IDE? `npm run dev` is the OLD WEB APP.**
>
> The root `dev`, `build` and `preview` scripts — the ones an IDE's Run button
> finds — serve the Vite web app in `src/`. The native app, with all of the
> motion work, is in `mobile/`. Previewed the root and saw none of it? That is
> why.
>
> ```sh
> npm run dev:mobile        # or: cd mobile && npm run preview
> ```

Cross-tool rules (Antigravity, Cursor, Codex, Claude Code), under Antigravity's
12,000-char cap — which this file sits against, so an addition means a trim.
**Read `HANDOFF.md` first**, then `CLAUDE.md`.

`.agents/rules/` holds the rest, each within the cap:

| File | What |
|---|---|
| `.agents/rules/00-working-agreement.md` | how two agents share this repo |
| `.agents/rules/05-resume.md` | resuming where a session stopped |
| `.agents/rules/06-rate-limits.md` | surviving a rate limit intact |
| `.agents/rules/10-motion.md` | animation rules; what never ships |
| `.agents/rules/20-interface.md` | theming, type, materials, a11y |

Deep reference stays in `.claude/skills/`, **pointed at, never copied**;
`apple-design/README.md` indexes it. `npm run check:agent-docs` fails if a rules
file goes over the cap, if `GEMINI.md` grows rules of its own, or if a path
above stops resolving.

## The repo holds two apps

| Path | What |
|---|---|
| `src/`, `index.html`, `vite.config.ts` | the Vite/React **web** app, live |
| `mobile/` | the **React Native Android** app |
| `supabase/` | edge functions and migrations, shared by both |

They share one Supabase project and one question bank. **Do not refactor the
web app while working on the native one.**

`src/data/` (~750 KB) reaches the native app through a `@data`
alias, and `src/lib/profanity.ts` through `@shared`. Wired in
`mobile/metro.config.js`, `mobile/babel.config.js`, `mobile/tsconfig.json` and
`mobile/preview/vite.config.ts` — **all four must agree**, and never copy those
files into `mobile/`; a second copy will drift.

## Things that will cost real money or users

- **`applicationId` is `com.aistudio.mbbsqbank.aycxvd`.** It matches the
  published Play listing. Changing it publishes a *second app* instead of an
  update.
- **`versionCode` must increase on every Play upload.** 13 is live, the repo
  carries 15 (14 was rejected and cannot be reused). It sits in `build.gradle`
  AND `mobile/src/lib/appVersion.ts`; `check:version` fails if they disagree,
  and bumping needs an `app_releases` row too.
- **Never commit secrets** — keystore, passwords, certificates, API keys. The
  signing key lives only in GitHub Actions secrets.
- **Test builds must serve no ads at all.** `mobile/src/lib/adsMode.ts` exports
  `ADS_ENABLED = !__DEV__`; the debug and internal workflows overwrite it with
  `false`, so AdMob never starts. Serving yourself live ads can suspend the
  account. Release builds leave it alone — `android-release.yml` asserts that.
- Open Gemini access, no app-side rate limit, and the public leaderboard are
  **deliberate**. Do not "fix" them.

## Cutting a build

Every workflow in `.github/workflows/` runs on a **push to
`claude/native-app-sync`** and publishes a GitHub **Release** — push, then
watch Actions on `gmck`.

| Want | Workflow | Package | Ads | Signs in? |
|---|---|---|---|---|
| Poke at it | `android-debug.yml` | `…aycxvd.debug` | none | no |
| Test sign-in | `android-internal.yml` | `…aycxvd` | none | yes |
| Upload to Play | `android-release.yml` | `…aycxvd` | **live** | yes |

The release one builds both an `.aab` (Play) and an `.apk` (sideload).

Secrets are per repo: only `gmck` has the signing three, so the mirror's
release run dies at "Restore the upload keystore" — a missing secret, not a
broken build. Same for `SUPABASE_ACCESS_TOKEN`.

No sandbox reaches Supabase — the gateway 403s the CONNECT — so a token is no
unblock, only a reason to run `supabase-tasks.yml` on a runner.

`.agents/rules/40-releases.md`: what a wrong build costs, why sign-in works
only in the internal one, why CI compiles the Kotlin first.

## New Architecture: a native module must be a TurboModule

`newArchEnabled=true`. A module registered from a plain `ReactPackage` is
**never reachable**: the TurboModule manager reads such packages only when
`useTurboModuleInterop` is on, and that flag is `false` in every stable
release. The sound module shipped that way, silent on every device, no error.

A working native module needs all four: a spec in
`mobile/src/native/Native*.ts`, `codegenConfig` in `mobile/package.json`, the
Kotlin class extending the **generated** spec, and a `BaseReactPackage`
declaring `isTurboModule = true`. `check:native-sound` asserts it.

Platform, not bugs: taps use `USAGE_ASSISTANCE_SONIFICATION`, so silent mode
and DND mute them; the focus chime is `USAGE_ALARM` and survives DND.

## An Anki package is chosen by `meta`, never by filename

Every version 3 `.apkg` also carries a **decoy** `collection.anki2` holding one
note saying the file needs a newer Anki. A reader that picks by filename
imports it with no error and returns a one-card deck that looks like success.
`name` columns are `COLLATE unicase`, which **no SQLite outside Anki has**:
`ORDER BY name` throws on a device only. `.agents/rules/63-anki-import.md`.

## Notes render objects, not strings

`generate-handwritten-notes` emits **objects** in every list section —
`bullets` items are `{label, description}`, `steps` are
`{title, description, keyTrigger?}`, `flowchart` steps are `{label, detail}`,
`comparison` rows are `{label, left, right}`. Only `revision.items` is
`string[]`.

`String(item)` prints `[object Object]` on a phone. That shipped once: the
preview fixture used plain strings — a fixture that agreed with the bug.
`**bold**` is a highlight, not literal asterisks. `check:notes-schema` pins
fixture, renderer and schema together.

Its zod schema is `questions: z.array(z.string().max(1000)).min(1).max(400)`;
a violation is a **400 for the whole request**, breaking Notes for one topic
with no symptom elsewhere. `mobile/src/lib/notesLimits.ts` clamps from the
*head*: stars and PYQ years are at the start of a question.

## `ask-gemini` is told the intent, it does not infer it

`mobile/src/lib/askAi.ts` owns every request to that function; nothing else
should build one. It picks its system prompt from **flags in the request
body**: `isMCQRequest` selects the MCQ branch, and prose that *describes*
wanting MCQs does nothing. The medical-vs-generic prompt is a keyword match on
the prompt text, which is why `tripleTapPrompt()` says "MBBS medical exam
question" on purpose. `npm run check:mcq` covers the parsing.

## Motion, themes and accessibility

- **Do not hand-roll an animation.** Springs, easings, durations, momentum and
  rubber-banding live in `mobile/src/theme/motion.ts`. The primitives:
  `Touchable`, `Sheet`, `Dialog`, `Slider`, `HoloCard`, `Reorderable`,
  `SortableGrid`, `BackButton`, `listTuning`.
- **Every `Animated.timing` names an `easing` from `EASE`.** Omitting it is the
  bug, not the default.
- **Progress bars use `scaleX` + `transformOrigin: 'left'`, never animated
  `width`.** Width forces layout every frame on the JS thread.
- **Nothing scales from 0.** Entrances start at 0.6–0.9.
- **Reduced motion is not optional.** `useReducedMotion()` is in every
  primitive; new motion handles it in the same commit.
- **`Touchable` requires a `label`.** An unlabelled control is unusable with
  TalkBack. Keep targets at 44dp using `hitSlop`, not padding.
- **A theme is four colours**; `paletteFrom()` derives the other fourteen.
  `success`/`warning`/`danger` stay green/amber/red in **every** theme, and
  `onAccent` is computed from luminance, never hardcoded white.
- **Design tokens**: `theme/tokens.ts` for spacing and radius, `typeScale` in
  `theme/typography.ts` for type. A bare `fontSize` has no tracking or leading.
- **Font is pinned to Roboto** — OEM skins otherwise re-typeset the whole app.
- **No backdrop blur** (`.agents/rules/20-interface.md`). `GlassSurface` draws a
  bevel: two rims of opposite polarity, a dp-capped specular, an inner glow.
- **Never put `elevation` on a view with no background colour.** Android takes
  the outline from the bounds, so a large `borderRadius` draws as a polygon.

## Performance rules that are not micro-optimisation

The target is a 3 GB Android phone.

- Question rows subscribe to **one question** (`useQuestionDone`), never the
  store's global version. `npm run check:fanout` fails if that regresses.
- `theme/textScale.tsx` multiplies the type ramp, applied centrally in
  `components/Text.tsx`, which takes a **zero-cost fast path at exactly 1**.
  Do not move that work anywhere it runs per row.
- Sliders emit on the **step**, not the frame: every `Text` subscribes to text
  size, so a callback per frame is a full-tree re-render per frame.
- PanResponders built in a `useMemo` must not depend on values that change
  during the gesture: the replacement never saw the grant, so the drag dies
  after one frame.

## Storage keys are shared with the web app

One user with both installed sees one state:

- `orbit-profile-v1` — `{ display_name, year }` with short year codes
  (`first`/`second`/`third`/`final`), **not** the internal `YearKey` form
- `question-<first 50 chars, spaces→dashes>` — per-question completion
- `orbit:daily-ad:{progress,theme,questions}` — daily ad caps

Changing any of these shapes breaks cross-install continuity.

`record_questions_done` opens with `IF _year IS NULL THEN RETURN 0`: it needs
the caller's `profiles` row, so a push before that returns 0 and reports **no
error**. `npm run check:sync` pins the order.

## `mobile/preview/` is a dev-only tool

It renders the RN screens in a browser via react-native-web. Metro never sees
it and nothing from it reaches the APK. Add a native dependency, add a shim
there; add a provider to `App.tsx`, add it to `preview/main.tsx`.

A render error must never blank the app: `ErrorBoundary.tsx` wraps everything
**outside** the providers and uses literal colours deliberately.

## A dead session leaves nothing but the repo

The connection drops, the session is deleted, the account signs out — and the
next agent cannot see this chat. Start with `npm run resume` (root, or in
`mobile/`): it derives branch, dirty tree, last commits, the Supabase queue and
the open notes, and says what is **BLOCKED and on whom** — no agent can flip a
connector, paste a secret or buy credits. Before you stop, append to
`.agents/state/resume-notes.md`. `.agents/rules/05-resume.md`.

## Verify before claiming something works

```sh
cd mobile
npx tsc --noEmit          # must be clean
npx eslint . --quiet      # must print nothing (warnings hide errors)
npm run check:xp          # one XP ladder, shared with web
npm run check:version     # gradle and appVersion.ts agree
npm run check:reminder    # the reminder reaches a phone
npm run check:edges       # no page sits under the status bar
npm run check:diagrams    # a question shows its own diagram, or none
npm run check:apkg        # an Anki package imports, and not its decoy
npm run check:kotlin      # Kotlin overrides (no local kotlinc)
npm run check:repo-intact # nothing load-bearing was deleted
npm run check:smoke       # drives the real screens through a browser
# ...and every other check:* in mobile/package.json touching what you
# changed. Each names the bug it exists for in its header.
npx react-native bundle --platform android --dev false \
  --entry-file index.js --bundle-output /tmp/b.js   # must succeed
```

`check:smoke` selects controls by accessibility label, so one it cannot find is
one TalkBack cannot announce. It needs a Chromium binary.

There is usually no emulator, so a green bundle is the strongest signal short
of a device. **Do not claim device behaviour was verified when it was not**:
the harness is react-native-web and checks layout, not native rendering,
gestures or timing.
