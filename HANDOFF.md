# Handoff — Orbit MBBS native Android app

**Last updated:** 2026-08-26

Written so a fresh session (or a different person) can pick this up without the
prior conversation. Read `CLAUDE.md` too — it lists the traps.

---

## 1. What was asked for, and what exists now

The app was a Vite/React web app shipped to Play inside a Capacitor WebView.
The goal was a **genuinely native** Android app in React Native — not a
WebView wrapper.

That exists, in `mobile/`. Verified: the release JS bundle is ~3.8 MB, contains
the full question bank, and has **zero WebView references**. Screens are native
Android views on Hermes.

The web app in the repo root is untouched and still live.

### Ported and working

| Area | Notes |
|---|---|
| Home | hero carousel, quick actions, gradient subject cards, streak + focus stats |
| Question bank | year → subject → paper → topic → questions, any nesting depth |
| Question rows | tick to complete, importance stars, page refs, **triple-tap worked answers** |
| High-Yield Diagrams | **Nano Banana 2 Grounded AI JPEGs**: 21+ topics in Supabase Storage `diagrams` mapped to 219 syllabus questions |
| Mobile Diagram Card | `mobile/src/components/DiagramCard.tsx` with pinch-to-zoom Lightbox Modal, loading state, theme support |
| Notes | year → subject → topic → **batched AI notes + high-yield diagrams**, refine, regenerate |
| Search | full-text across all 5,523 questions |
| Timer | wall-clock pomodoro, survives backgrounding, per-day + lifetime stats |
| Ask AI | same `ask-gemini` edge function as web |
| My Progress | profile, year ring, streak/level, rewards, heatmap, subjects, leaderboard, **Calendar & Saved Notes tabs** |
| Profile | name + year editor, doubles as first-run onboarding |
| Auth | Google Sign-In → Supabase `signInWithIdToken`; anonymous otherwise |
| Ads | AdMob interstitial + rewarded, web app's 3-bucket daily policy |

### Deliberately not done

- **react-native-webview** — omitted on purpose; the app renders natively.
- **Play Integrity** — the console shows verdicts enabled, but the app never
  calls the API. Enabling it properly needs server-side verification in the
  edge functions. Not a console switch.

---

## 1b. Continuing this work somewhere else

The rules an agent must follow are in **`AGENTS.md`** (repo root, tool-agnostic
— Antigravity, Cursor, Codex, Claude Code all read it) and the full reasoning
is in **`CLAUDE.md`**. `GEMINI.md` is a pointer to `AGENTS.md`, not a second
copy, because Antigravity merges the two and lets `GEMINI.md` win conflicts —
so the only safe content there is content that cannot conflict.

`CLAUDE.md` is ~32,000 characters and Antigravity caps a *rules* file at
12,000. That is why `AGENTS.md` is a distilled subset rather than a copy: it
carries what is expensive to get wrong in the first hour and points at the rest.

### Previewing the native app (read this before reporting "no animations")

An IDE's Run/Preview button finds the **root** `package.json`, whose `dev` and
`preview` scripts serve the original Vite **web** app in `src/`. That app has
none of the native app's motion in it, so previewing the root and concluding
the animations did not survive the migration is the expected result of
previewing the root.

```sh
npm run dev:mobile        # the React Native app in a browser
# identical to: cd mobile && npm run preview
```

Both scripts exist at the root now so the right one is findable from the same
place as the wrong one.

Measured in that preview, so it is not a guess: the bottom-nav blob produces
13 distinct frames across a tab switch and a card press produces 9 across a
press-in — both animating. `mobile/preview` is react-native-web, so it checks
layout and motion timing in a browser, never native rendering.

One warning in that preview is expected and harmless:

    Animated: `useNativeDriver` is not supported because the native animated
    module is missing. Falling back to JS-based animation.

react-native-web has no native driver, so it runs the same animations on the
JS thread. On a device they run on the native driver, which is the whole
reason every animation in this app sets `useNativeDriver: true`.

### What does not travel

- **`.claude/skills/`** — vendored design skills (`apple-design`, `animate`,
  `review-animations/STANDARDS.md`). Claude Code loads these automatically;
  other tools do not. They are the source of the motion rules, and
  `.claude/skills/apple-design/README.md` records which techniques were
  deliberately *not* taken. Open them by hand when touching animation.
- **The signing key.** It exists only in GitHub Actions secrets and on the
  developer's machine. A local release build needs its own copy of the `.jks` —
  see below. It must never enter the repo.
- **The GitHub Actions runner's toolchain.** Everything below has to be
  installed locally.

### Local toolchain the build pins

| Thing | Version |
|---|---|
| JDK | 17 |
| Node | >= 22.11.0 |
| Android compileSdk / buildTools | 37 / `37.0.0` (the SDK package is `platforms;android-37.0` — `platforms;android-37` does not exist) |
| targetSdk / minSdk | 36 / 24 |
| NDK | `27.1.12297006` |
| Gradle | 9.4.1, via the wrapper |

New Architecture and Hermes are both on, so the build compiles C++ and needs
the NDK and CMake — this is the slow part, ~15 minutes cold.

```sh
cd mobile
npm ci --legacy-peer-deps
npm start                 # Metro, in one terminal
npm run android           # debug build onto a connected device
```

A release build locally, with your own copy of the keystore:

```sh
cd mobile/android
KEYSTORE_PATH=/absolute/path/to/upload-keystore.jks \
STORE_PASSWORD=… KEY_PASSWORD=… \
  ./gradlew bundleRelease     # app-release.aab, for Play
```

The key alias is `upload`. Without `KEYSTORE_PATH` the release variant falls
back to the debug key and the result is **not** publishable.

### Things that are easy to trip over on a fresh machine

- There is **no `google-services.json`** in the repo. Google Sign-In is
  configured through the OAuth client ID in code plus the certificate SHA-1
  registered in Google Cloud, not through that file. Do not add one
  speculatively.
- CI overwrites `mobile/src/lib/adsMode.ts` for test builds. A local build does
  **not**, so a locally built release APK will serve **live ads**. Do not
  install one on your own phone and browse the app.
- `check:smoke` needs a Chromium binary and drives the react-native-web
  preview. It checks layout and labels, never native rendering or gesture
  timing.

---

## 2. Blocking items — do these first

### 2.1 Signing secrets are not in CI yet

**The upload key reset is done.** The original upload key belonged to *Google
AI Studio* (`CN=AI Studio, O=Google`), so no keystore ever existed on the
developer's machine. A replacement was generated —
`CN=Orbit MBBS, OU=Orbit MBBS QBank`, alias `upload`, SHA-1
`CE:EA:8A:41:BB:07:78:C4:78:26:D8:8F:CC:E0:2C:C9:EB:29:40:68` — and **Play has
accepted it**. Play App Signing stays enabled, so installed users are
unaffected.

What is still outstanding is only that the three repository secrets have not
been set:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | base64 of `upload-keystore.jks` |
| `ANDROID_STORE_PASSWORD` | the keystore password |
| `ANDROID_KEY_PASSWORD` | the same value — store and key passwords match |

Until they exist, `android-release.yml` and `android-internal.yml` fail within
a minute with an explicit error, and the debug build silently skips its
"sign with the upload key" step, which is why Google Sign-In does not work in
the debug APK.

**An agent cannot set these.** The GitHub Actions secrets API is blocked by
the agent proxy (`403: Access to this GitHub Actions path is not permitted
through this proxy`), and the Android SDK cannot be installed in the sandbox
either (`dl.google.com` is denied by the same gateway), so a release cannot be
built locally as a workaround. A human has to paste them once, in
Settings → Secrets and variables → Actions.

The keystore and its password are **not in this repo** and must never be.
Do not "solve" the CI problem by committing them or by base64-ing them into a
workflow file.

### 2.2 Razorpay needs one real payment before it is trusted

The ad-free purchase is implemented — `mobile/src/lib/razorpay.ts`, offered from
the daily ad prompt — against the same two edge functions the web app uses, so
a purchase made on either lands in the same `premium_subscriptions` row and
extends the same expiry.

What is verified: the bundle builds with `react-native-razorpay` linked, the
preview shim rejects rather than faking a success, and `npm run check:payments`
holds the price, the order and the signature check on the server.

What is **not** verified: an actual payment. Nobody has put ₹50 through it. Do
that once, on a device, in Razorpay test mode first, and confirm a row appears
in `premium_subscriptions` with an `expires_at` a month out. Until then treat
it as untested code that handles money.

`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` must be set on the Supabase
project, or `razorpay-create-order` returns 500.

### 2.3 Leaked OpenAI API key

GitHub push protection found a live **OpenAI API key** committed at
`src/components/AIChatWindow.tsx:14` (commit `f50c8e8`). The file is already
deleted from HEAD, but the key remains in the original repo's history.

- Purged from `gmck`'s history via `git filter-repo` (see §5).
- **Still present in `mbbsqbank-questor-ee7eadb9` history.**
- **Action: revoke the key at platform.openai.com.** Not done as of writing.

### 2.4 Google Cloud OAuth SHA-1s

**`mobile/OAUTH-SETUP.md` has the three clients to create, with the values.**
The short version: Play App Signing means the certificate on a phone that
installed from Play is Google's, not the upload key — so registering only the
upload key gives sign-in that works in your test build and fails for every real
user. Three Android clients are needed: production (SHA-1 from Play Console →
App signing), internal (the upload key), and `.debug` (Android's standard debug
key).

Sign-in only works if Google Cloud has an Android OAuth client whose SHA-1
matches the certificate that signed the running build.

| Certificate | SHA-1 | Still needed? |
|---|---|---|
| Deployment (Play App Signing) | `54:F7:27:F7:21:AD:9D:36:3A:42:4C:85:F4:B9:7A:25:A2:E3:FB:D5` | **Yes — this is what real users run** |
| New upload key | `CE:EA:8A:41:BB:07:78:C4:78:26:D8:8F:CC:E0:2C:C9:EB:29:40:68` | Yes, after the reset lands |
| Old upload (AI Studio) | `65:C0:36:DE:45:8B:20:58:33:E4:84:0D:09:79:AD:F1:07:6A:76:05` | Stops mattering after reset |

Missing the deployment one is the classic failure: sign-in works in testing and
fails for every real user.

---

## 3. Identifiers and configuration

| Thing | Value | Where |
|---|---|---|
| App name | Orbit MBBS | `mobile/app.json`, `strings.xml` |
| applicationId / namespace | `com.aistudio.mbbsqbank.aycxvd` | `mobile/android/app/build.gradle` |
| versionCode / versionName | 14 / `0.0.0.14` (13 is live) | same |
| minSdk / targetSdk | 24 / 36 | `mobile/android/build.gradle` |
| Deep-link scheme | `com.aistudio.mbbsqbank.aycxvd` | manifest intent-filter |
| Google Web Client ID | `358287134961-24qidem5pd6qhtkq43b3a9cfcp87c49p.apps.googleusercontent.com` | `mobile/src/lib/googleAuth.ts` |
| AdMob app ID | `ca-app-pub-3177287525203129~3298255365` | `mobile/app.json` |
| AdMob interstitial | `ca-app-pub-3177287525203129/7425202639` | `mobile/src/lib/ads.ts` |
| AdMob rewarded | `ca-app-pub-3177287525203129/6765465304` | `mobile/src/lib/ads.ts` |
| Supabase project | `pmtgeydtqypwrypshhsx` | `mobile/src/lib/supabase.ts` |

### Secrets — where they live, not what they are

| Secret | Location |
|---|---|
| Upload keystore + password | with the developer only; **never commit** |
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_STORE_PASSWORD`, `ANDROID_KEY_PASSWORD` | GitHub repo secrets on `gmck` |
| Gemini / AI keys | Supabase edge-function secrets |

---

## 4. Supabase

Nothing new was needed. The native app calls the same RPCs and edge functions
the web app already uses, all present in `supabase/migrations`:

`register_open`, `claim_or_merge_profile`, `record_question_done`,
`record_question_undone`, `record_questions_done`, `get_weekly_leaderboard`,
`get_year_leaderboard`

Edge functions used: `ask-gemini`, `generate-handwritten-notes`.

**Do not deploy `supabase/functions/generate-handwritten-notes/` from this
repo.** The copy here is behind what is live, and pushing it is a downgrade,
not a no-op:

| | repo copy | deployed |
|---|---|---|
| textbooks | 2, bundled in `textbook.ts` (Park's, Vision Forensic) | 4, read at runtime from the private `textbooks` Storage bucket |
| subjects grounded | Community Medicine, Forensic Medicine | those plus 2nd-year Pharmacology |

`supabase functions deploy generate-handwritten-notes` would silently drop two
books and the Storage loader, and the only symptom is that notes for the
affected subjects get vaguer — nothing errors. Pull the deployed source down
first (Lovable, or `supabase functions download`) and reconcile before
deploying anything in that directory.

**One setting to confirm:** Authentication → Providers → **Anonymous must be
ON**. The app signs in anonymously so progress sync, streaks and the
leaderboard work before a user signs in with Google. The web app relies on it
too.

Google provider must carry the Web Client ID above.

---

## 5. Repository state

- **`gmck`** (private) is the migration target and is current. Full history
  preserved (~1817 commits), with the leaked-secret file purged.
- **`mbbsqbank-questor-ee7eadb9`** is the original. Work lives on branch
  `claude/android-react-native-app-o54cjj`. Still contains the leaked key in
  history.

Because history was rewritten for `gmck`, its commit SHAs differ from the
original. File contents are identical.

To re-sync `gmck` after further work on the original:

```sh
git clone --no-local <original> /tmp/mig && cd /tmp/mig
git checkout claude/android-react-native-app-o54cjj
git filter-repo --force --invert-paths --path src/components/AIChatWindow.tsx
git remote add gmck https://github.com/Sabharivarshan111/gmck.git
git push --force gmck HEAD:refs/heads/main
```

---

## 6. Building

Two paths, both documented:

- `mobile/README.md` — desktop path (`npm run android`, Fast Refresh)
- `mobile/BUILD-FROM-PHONE.md` — **phone-only** path via GitHub Actions

`.github/workflows/android-release.yml` is a manually-triggered workflow that
typechecks, lints and produces a signed AAB + APK as artifacts. It reads the
keystore from a base64 repo secret, writes it outside the workspace, and
deletes it afterwards. It fails loudly if the secret is missing rather than
silently emitting a debug-signed build.

**The workflow has never completed a real run** — it cannot until the upload
key reset lands. Expect to debug it on first use.

---

## 7. What has and has not been verified

**Verified by driving the app:** `npm run check:smoke` walks eleven flows in
the preview — theme toggle, sheets, year picker, search, three levels into the
question bank, ticking and un-ticking a question, the timer, every tab — and
fails on any uncaught error. `npm run check:fanout` guards the per-question
subscription. The error boundary was verified by forcing a render crash and
confirming the recovery screen appears instead of a blank one.

**Verified mechanically:** TypeScript clean, ESLint 0 errors, Android release
bundle builds, live ad unit IDs present in the release bundle with the dev
branch dead-code eliminated, shared blocklist strings present in the bundle,
question counts match the web app (2nd year = 1219, Forensic Medicine topic
counts identical).

**Verified visually:** every screen, through the react-native-web preview
harness at phone viewport. This renders the real components but is *not* a
device.

**NOT verified — needs a real device:**

- Google Sign-In handshake (no Play Services in the sandbox)
- Actual ad delivery
- Notes generation end-to-end (sandbox blocks Supabase)
- Leaderboard with real rows (only the error path was exercised)
- Font weight rendering on real Android
- **How any of the new motion actually feels.** The springs, the sheet drag,
  the velocity handoff and the press feedback were all built to the values in
  `.claude/skills/review-animations/STANDARDS.md`, and they compile and render —
  but feel cannot be judged from code or from a react-native-web screenshot.
  The standards themselves say to check motion in slow motion, frame by frame,
  and on a real device for gestures. None of that has happened. Treat the
  timings as a starting point to tune on hardware, not as finished.
- **TalkBack.** Every control now carries a label, role and state, but no
  screen reader has actually been run over the app.
- **Reduced motion.** The `AccessibilityInfo` wiring is in place and the
  branches are written, but "Remove animations" has not been switched on on a
  real device to confirm the app degrades the way it is supposed to.

Do not describe any of the above as working until someone runs it on a phone.

---

## 7a. Design system (added after the first handoff)

The app previously had **zero animation** — no `Animated`, no
`LayoutAnimation`, every transition an instant cut — and 5 accessibility props
across 122 touchables. That is what this pass addressed.

Vendored, unmodified, from https://github.com/emilkowalski/skills:

```
.claude/skills/
  apple-design/      SKILL.md + README.md   ← README is the index; read it first
  animate/           SKILL.md + RECIPES.md
  review-animations/ SKILL.md + STANDARDS.md ← exact curves/durations/springs
  improve-animations/, find-animation-opportunities/,
  animation-vocabulary/, emil-design-eng/
```

`apple-design/README.md` maps every web technique in those skills to its React
Native equivalent, lists the rules that bind and where each is honoured, and
records the deliberate departures (no backdrop blur, no haptics, no stagger,
one JS-driven animation) with the reasoning. Read it before touching motion.

New code:

| File | What |
|---|---|
| `src/theme/motion.ts` | Apple spring params → RN physics, `EASE` curves, `DURATION`, momentum projection, rubber-banding, `useReducedMotion()` |
| `src/theme/typography.ts` | Type ramp with size-specific tracking and leading; font-scale cap |
| `src/components/Touchable.tsx` | The press target. Required `label`, press-down spring, hit slop |
| `src/components/Sheet.tsx` | Bottom sheet: 1:1 drag, rubber-band, momentum projection, velocity handoff, `dismissable` gate |
| `src/components/Dialog.tsx` | Centred either/or dialog |
| `src/components/BackButton.tsx` | One back control, one place |
| `src/components/listTuning.ts` | `FlatList` virtualization for long question lists |
| `preview/shoot.mjs` | The screenshot harness (was previously untracked) |

Performance work in the same pass:

- `collectQuestions` / `collectAllQuestions` are now `WeakMap`-cached per node.
  They were being re-walked on **every** ticked question, across 14 subjects, on
  three screens, because the memo key included the progress store's version.
- `searchQuestions` builds a lazy flat index with pre-folded lowercase strings
  instead of re-walking all four years and calling `.toLowerCase()` on ~11,000
  strings per keystroke. `warmSearchIndex()` builds it while the user is still
  reading the browse screen.

## 8. Suggested next steps

1. Submit the upload-key-reset `.pem`; revoke the OpenAI key. (blocking)
2. Add the three GitHub secrets on `gmck`; run the workflow; fix what breaks.
3. Sideload the APK and walk the checklist in `BUILD-FROM-PHONE.md` §Step 4.
4. Upload to **internal testing** — the first build signed by Google, and so
   the first real test of sign-in against the deployment certificate.
5. **Tune the motion on hardware.** Play each transition at 2–5x, step the
   sheet drag frame by frame, and try the gestures with a thumb. The values are
   defensible but unproven on a device.
6. Run TalkBack over every screen, and switch on "Remove animations" to confirm
   the reduced-motion branches behave.
7. Then, in rough value order: Razorpay, the Calendar/saved-notes tabs,
   local notifications.

---

## 8a. Notifications, and two things they exposed (2026-08-25)

The daily reminder ships. `NativeOrbitNotify` + `NotifyReceiver.kt` decide
whether to fire on the phone, because the two inputs that matter — days to the
exam, and whether "studied today" is still true — go stale overnight and a
message composed in JavaScript would be wrong by morning. Settings has the
master switch, three per-kind switches, and an animated bell.

Two things worth knowing before touching it:

- **Permission is asked through React Native's `PermissionsAndroid`, not the
  native module.** The module's `requestPermission` fires the dialog and
  resolves `false` in the same breath — it cannot wait — so the app had already
  decided it was refused before anyone tapped Allow, wrote the setting back
  off, and hid the three switches gated on it. The module stays as the fallback
  for platforms with no `PermissionsAndroid`, which is the preview harness.
- **`Touchable` publishes state as `aria-*` as well as `accessibilityState`.**
  react-native-web 0.21 removed `accessibilityState` and reads only `aria-*`.
  Every switch in the preview therefore reported no state at all, and the smoke
  assertion "the daily reminder is off by default" had been passing on an
  absent attribute rather than on a value. TalkBack on the phone still reads
  `accessibilityState`; both are set from one value, so they cannot disagree.

**Still unverified:** nothing here has met a real clock. Whether the alarm
survives Doze, fires at the chosen hour, and backs off after three ignored
notifications needs a device left alone overnight.

## 8b. Where native and the web app still keep separate books

Two features exist on both sides and do **not** share state. Same user, two
answers, and neither side is wrong on its own:

| Feature | Web | Native |
|---|---|---|
| Spaced revision | `revision_schedule` table + `review_question` RPC | `AsyncStorage`, textbook SM-2 |
| Exam countdown | `exam_targets` table | `orbit:exam-v1` |

The native SM-2 was written to match the server's SQL exactly — same grades
(`again`/`hard`/`good`/`easy`), same enrolment at `due_date + 1` — so the
schedules agree until the two are used on different devices, at which point
they drift apart silently and permanently. Pointing the native hooks at the
RPC is the fix; `check:spaced` pins the arithmetic either way.

---

## 8c. Textbook grounding covers three years, not one (2026-08-25)

`generate-handwritten-notes` picks its textbook by **subject**, never by year,
and has eight books: Anatomy (Vishram Singh + Langman's), Physiology
(Sembulingam), Biochemistry (Vasudevan), Pharmacology (KD Tripathi for
classification + Tara Shanbhag for everything else), Pathology (Ramadas Nayak),
Microbiology (Apurba Sastry), Community (Sia's Park), Forensic (Vision). Final
year has none.

Both clients gated the triple tap on `year === 'third-year'`, written when
Community and Forensic were the only two books. Six more arrived and the gate
did not move: 803 triple-tap notes were third year, one was second, none were
first. **The native gate now follows `hasTextbook`; the web app
(`src/components/QuestionCard.tsx:107`) still has the year check and needs the
same change in Lovable.**

Two traps worth knowing:

- **The repo's copy of the edge function was two versions behind**, so reading
  the code agreed with the gate. It is deleted — its folder holds a README
  pointing at the deployed one. It was also propping up two `check:notes-schema`
  assertions about diagram attachment that the live function does not do.
- **`subject` had a `|| 'Community Medicine'` fallback.** Harmless while the
  feature was third-year-only; now it would ground an Anatomy question in Park.

`mobile/src/lib/textbooks.ts` mirrors the server's `pickBookKey`, and
`npm run check:textbooks` pins them together — same rules in the same order,
since the matches overlap.

### The cache was poisoned, and has been cleared

The 1st/2nd-year books were uploaded 23–25 Aug; every cached 1st/2nd-year note
was generated 17 Jul – 24 Aug, i.e. **before its book existed**. The function
returns the cache on the first batch unless `regenerate` is set, so none of them
would ever have refreshed — the Notes tab would have kept serving ungrounded
July answers for those subjects for ever.

75 stale rows were backed up to `handwritten_notes_pre_textbook_backup` and
deleted, so the next open of each topic regenerates against the textbook. Two
Pharmacology notes made after its book landed were kept. Third year was never
affected: Park and Vision were bundled inside the function long before the
storage migration. **Drop the backup table once the regenerated notes look
right.**

Expect the first open of each 1st/2nd-year topic to be slow and to risk a 429 —
every one is now a cache miss on a free-tier key.

---

## 8d. What this session could NOT verify — for whoever can (2026-08-26)

Everything below is written, typechecked, linted, smoke-covered and shipped. All
of it is unproven in the one way that matters, because the agent sandboxes
**cannot reach Supabase** (the egress gateway refuses CONNECT) and have **no
emulator or device**. Antigravity has the connectors; a phone has the rest.

Ordered by what it costs to be wrong.

### 1. The `textbooks` bucket is public — fix this first

It holds OCR'd copyrighted textbooks. `storage.buckets.public` is `true`, so
anyone with a URL can download them, and the notes function's own comments
describe it as private. Set it private: the function reads it with the
service-role key and will not notice.

`supabase-tasks.yml` now does exactly this from a runner — see §8e. It had not
started when this was written, so **confirm the flag before crossing it off.**

### 2. A flashcard deck has never been generated

`generate-flashcards` is deployed and the image half is confirmed against the
live `question_diagrams` table by SQL. The **Gemini half has never run.** Open
one chapter, then:

```sql
select card_count, cards from flashcards where deck_key = 'Third Year::Community Medicine::epidemiology-of-communicable-diseases';
```

Check: a sane theory/image split, no repeated `imageUrl`, and backs short enough
to recall (~25 words). Paragraph-length backs mean the prompt's "one fact per
card" rule is not landing. Also confirm a 429 surfaces the quota message rather
than a raw error — the free tier is the binding constraint and a deck is one
call.

### 2b. Image cards have no written answer yet

`generate-flashcards` sets `back: ""` for image cards, so revealing one shows
the diagram alone. The diagram is a legitimate answer on its own, but a line of
text beside it is better. The fix is in the function: pass the diagram rows'
question text to Gemini in the same call and ask for a short back for each, then
attach the image. Needs a redeploy — the connector was offline when the client
half was fixed.

### 3. The daily reminder has never met a clock

`NotifyReceiver.kt` decides whether to fire on the phone. Nothing has confirmed
the alarm survives Doze, fires at the chosen hour, or backs off after three
ignored notifications. Leave it on overnight.

### 4. Two Android-only rendering fixes are diagnosed, not executed

react-native-web is more forgiving than Android, so the preview agreed with both
bugs and would agree with the fixes either way:

- **The progress bar** stuck at half — `<Svg width="100%">` inside a box whose
  width was the percentage. Tick every question in a topic and watch it reach
  the end.
- **The tick's checkmark** could not draw — `strokeDashoffset` on the native
  driver. Tick a question and watch the green check animate.

### 5. The web app still names textbooks

`src/components/handwritten/ExamDiagramCard.tsx` renders `"Vision FMT Grounded"`
/ `"Park PSM Grounded"`. The app names no textbook to the reader, and that
caption is also third-year-only, so it is wrong above a first- or second-year
diagram. Needs the same removal in Lovable; the native side is done and
`check:textbooks` guards it.

### 6. Razorpay has never taken a real payment

Unchanged from §2.2.

---

## 8e. Verification run and the Supabase token (2026-08-26, later)

### Everything local is green

Run in full on this branch at `1e4b2fbd`. This is the strongest signal available
without a device, and it is complete — nothing was skipped:

| | |
|---|---|
| `npx tsc --noEmit` | clean |
| `npx eslint .` | **0 errors**, 64 warnings (all `no-inline-styles`) |
| release bundle | succeeds — 4.4 MB, 19 assets copied |
| `check:fanout` `check:sync` `check:contrast` `check:subject-cards` | pass |
| `check:native-sound` `check:mcq` `check:notes-limits` `check:notes-schema` | pass |
| `check:textbooks` `check:cloud-ids` `check:glass` `check:anki` `check:agent-docs` | pass |
| `check:sounds` | pass — tap at 1850 Hz vs 220 Hz, all three chime notes dominate, no DC offset, no clipping |
| `check:smoke` | pass — **38 flows, 0 crashes** |

Smoke now covers the flashcard work end to end: a session showing a card and
Anki's four buttons, writing and studying your own deck, a chapter opening with
a retry when the deck cannot build, and Notes offering flashcards and a locked
case proforma with no WhatsApp anywhere.

Still unproven on a device, unchanged from §8d: the progress-bar and checkmark
Android fixes, the daily reminder against a real clock, and Razorpay.

### The Supabase token exists, and it does not help here

The app's owner created a Supabase personal access token and added it to GitHub
as `SUPABASE_ACCESS_TOKEN`. Two things follow, and both are permanent:

**It cannot be used from an agent sandbox.** The egress gateway refuses the
CONNECT itself — `403`, before any credential is offered, for
`api.supabase.com` and the project host alike. Verified again this session
against `curl -sS "$HTTPS_PROXY/__agentproxy/status"`, which lists the
refusals. Being handed a token is not an unblock; it only moves the work to a
runner. The permanent fix is the *environment's network policy* at
claude.ai/code, which is the account owner's to change, not this repo's.

**The token was never written down here.** It was held in the session
scratchpad, used to confirm the above, and shredded. `git log -S sbp_` is
clean and must stay that way.

### `supabase-tasks.yml` is the route, and it has not run yet

New workflow. It reports which of `SUPABASE_ACCESS_TOKEN` / `SUPABASE_TOKEN` /
`SUPABASE_PAT` is set — printing `set`/`not set`, never a value — and then does
§8d item 1: makes the `textbooks` bucket private via one idempotent SQL
statement through the Management API.

**It is queued, not finished.** Run `32985941650` on `gmck` sat in `queued` for
over fifteen minutes with nothing else in progress. That is GitHub failing to
allocate a runner, not a broken workflow — see `.agents/rules/40-releases.md`,
"Reading a red pipeline before blaming the YAML", for why `startup_failure` and
`409 Cannot cancel a workflow run that has not been queued yet` both mean the
same thing, and why billing is never the answer (both repos are public).

**Check which repo the secret is on.** Secrets are per repository and every push
goes to two. The workflow runs on both `gmck` and `origin`; if the token was
added to only one, the other reports `not set` and skips. Whoever picks this up
should read the run's first step before assuming anything failed.

---

## 8f. Flashcards got built twice — read this before starting a feature

The native app already had Anki flashcards: `FlashcardsScreen.tsx`, Anki's
scheduler in `lib/anki.ts`, the deck loader in `lib/flashcards.ts`, and five
smoke flows covering study, custom decks and the retry path. Committed, pushed,
green.

A second implementation then appeared in **the web app** — a purple "Anki
Flashcard Decks" hero on `src/components/shell/NotesTab.tsx`, its own year grid,
its own copy. Nothing failed and nothing warned. The owner was shown a preview,
saw an interface they had not asked for, and reasonably read it as their app
having been changed underneath them.

Nothing was lost: the native work was never touched, and the web work was never
pushed. But it cost a session, and the cause was a gap in the rules rather than
a mistake anyone could have caught by reading code.

**What was missing:** `AGENTS.md` said "do not refactor the web app", which
reads as a rule about editing existing web code. It did not say *do not build
new features there*, and it did not say *check whether the feature already
exists*. Both are now in `.agents/rules/00-working-agreement.md` under "Which
app a change belongs in", along with a table of tells for identifying which app
is on screen — the reliable one being that **Notes still shows the WhatsApp card
in the web app and does not in the native app.**

`npm run check:one-app` now fails if `src/` or `supabase/` grows a second copy
of Anki's scheduler. It is deliberately narrow: the web app is still allowed to
change when the owner asks for it by name, but not to duplicate logic that
already exists natively and is tested there.

While wiring it in, three checks turned out never to have run in CI at all —
`check:anki`, `check:textbooks` and `check:one-app`. All three now run in the
debug, internal and release workflows.

---

## 9. High-Yield AI Exam Diagrams & Localhost Previews

### Local Dev & Preview URLs
- **Web App (Vite + React + Lovable)**: `http://localhost:8080/`
- **Mobile Web Preview (React Native for Web)**: `http://localhost:5173/`
- **Production Web App**: `https://mbbsqbank-questor.lovable.app`

### AI Exam Diagrams (Nano Banana 2 + Textbook Grounding)
- **Engine**: Nano Banana 2 API (`https://api.nanobananaapi.ai/api/v1/nanobanana/generate-2`).
- **Grounding Sources**:
  1. *Park's Textbook of Preventive and Social Medicine* (`sia_park.txt`).
  2. *Vision Forensic Medicine and Toxicology 4th Ed.* (`vision_forensic.txt`).
- **Format**: High-resolution JPEGs ($< 1.1\text{ MB}$ each) featuring continuous circular life cycle loops and anime/manga scientific line art.
- **Supabase Storage**: Bucket `diagrams` (`community/...` and `forensic/...`).
- **Database Mappings**:
  - `public.question_diagrams`: 219 syllabus questions mapped to diagrams.
  - `public.handwritten_notes`: Injected with `🎨 High-Yield Visual Exam Diagram` as section 1 across 75+ records.

### React Native Diagram Components
- `mobile/src/components/DiagramCard.tsx`: Native diagram viewer with high-res image loading, theme-aware badge, and fullscreen tap-to-zoom Lightbox modal.
- `mobile/src/components/NotesContentView.tsx`: `RichText` splits **every** run
  of model prose into text and image parts, so a diagram renders wherever the
  markdown lands — paragraph, definition, bullet description, comparison cell,
  flowchart detail, revision item. Handling it per section type was the first
  attempt and it printed the raw `![alt](url)` at the reader everywhere it had
  not been special-cased. `Inline` is now RichText's private helper;
  `npm run check:notes-schema` fails if any `<Inline>` reappears outside it.
- A multi-batch topic asks for the diagram once per batch, but `mergeNotes()`
  folds sections by title, so the second and later copies are dropped and the
  Notes section shows it once, at the top. That is why the topic-level Notes
  tab and a triple-tap note look the same.

---

## 10. Supabase Verification & Native Validation Findings (2026-08-24)

Verified live against Supabase project `pmtgeydtqypwrypshhsx` following `.agents/SUPABASE-VERIFY-PROMPT.md`:

### §1a. `question_diagrams` Row Lookup — **CONFIRMED**
- Query: `select id, question_text, public_url from question_diagrams where question_text ilike '%Define Firearm. Draw and %';`
- Result: Row `063cce25-b760-4237-b819-0ddb1b816146` exists with URL `https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/forensic/shotgun_cartridge_cross_section.jpg`.

### §1b. `alreadyHasDiagram` in Edge Function — **CONFIRMED**
- The title-based guard `s.title?.toLowerCase().includes("diagram")` in deployed edge functions suppresses image attachment on prompt requests containing "Draw and describe".
- All database rows in `public.handwritten_notes` have diagrams injected with `s.icon === "🎨"` and Storage URLs to guarantee rendering across both single-question and hub topic notes.

### §1c. Cached Note Section Titles — **CONFIRMED**
- Both `single::forensic-medicine::s3cwd9` (web app & current phone key) and `single::forensic-medicine::zaunt4` (legacy phone key) have `"🎨 Parts of a 12-Gauge Shotgun Cartridge"` as their first section title.

### §1d. Storage Bucket Public Access — **CONFIRMED**
- Direct HTTP GET returns `HTTP/2 200 OK`, `image/jpeg` (634,021 bytes) with `access-control-allow-origin: *`.

### §2. Cache Key Resolution & Origin — **CONFIRMED**
- `single::forensic-medicine::201qgi` & `single::forensic-medicine::s3cwd9`: Created in July/August 2026 (web app origin).
- `single::forensic-medicine::66wfte` & `single::forensic-medicine::zaunt4`: Created 2026-08-24 by mobile before hashing fix.
- Mobile hashing logic matches web app hashes (`note-key-check.mjs` passes).

### §3. AI Edit Box Contract (`proposeOnly`) — **CONFIRMED**
- `proposeOnly: true` returns `{ cached, content, ... }` and **writes nothing** to Supabase.
- Checked `updated_at` on `debug::edit-test` before and after request; timestamp remained unchanged at `2026-07-23 04:37:03.808+00`.

### §4. Verification Suite Results
- `npx tsc --noEmit` -> **0 errors** (PASS)
- `npx eslint .` -> **0 errors**, 53 warnings (PASS)
- `npm run check:note-key` -> **PASS**
- `npm run check:notes-schema` -> **PASS**
- `npm run check:android-res` -> **PASS**
- `npm run check:smoke` -> **21/21 flows passed, 0 runtime errors** (PASS)


