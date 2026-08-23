# First prompt to give Antigravity

Paste the block below into Antigravity the first time you open this repo there,
or any time it seems to have forgotten how the project works. It is written to
be pasted whole.

This file is **not** a rules file — it lives outside `.agents/rules/` on
purpose, so it is not auto-loaded and is not subject to the 12,000-character
cap.

---

You are working on Orbit MBBS, an Android app. This project is worked on from
two tools — you (Antigravity) and Claude Code — sometimes on the same day.
Before doing anything else, set yourself up so that work can pass between them
without either of us losing track.

**Step 1 — read these, in this order.** Do not skim; they contain rules that
are expensive to break and were each learned from a bug that shipped.

1. `HANDOFF.md` — current state, what is outstanding, what is verified and what
   is not, and the local build setup (JDK 17, NDK 27.1.12297006, SDK package
   `platforms;android-37.0`).
2. `AGENTS.md` — the shared rules, written to fit your 12,000-character cap.
3. `.agents/rules/00-working-agreement.md` — how you and Claude Code share this
   repo. This is the important one.
4. `.agents/rules/10-motion.md` and `20-interface.md` — animation, theming,
   type, accessibility, performance.
5. `.agents/rules/30-reference.md` — an index of the vendored design skills in
   `.claude/skills/`. Those are reference documents Claude Code loads
   automatically and you do not. **Open the relevant one before any animation
   or visual-design work** — `apple-design/README.md` is the index, and records
   which techniques were deliberately *not* taken so they do not get "fixed".

**Step 2 — know the two-app trap.** This repo holds two applications:

- `src/`, `index.html`, root `vite.config.ts` — the ORIGINAL Vite web app,
  still live. The root `dev`, `build` and `preview` scripts run this one.
- `mobile/` — the React Native Android app. This is the one being worked on.

Your preview pane, run from the root, shows the **web app**, which has none of
the native app's animations. To preview the real app:

```sh
npm run dev:mobile          # or: cd mobile && npm run preview
```

If you ever conclude that features or animations are "missing", check which app
you are looking at first. Paths in the rules are written as `mobile/src/...`
for this reason — a bare `src/...` points into the other application.

**Step 3 — understand how work passes between us.**

`HANDOFF.md` is the handover, not chat history: I cannot see your conversation
and you cannot see mine. Whoever stops mid-task updates it with what changed,
what is verified, and what is **not**. This project is careful to keep "the
bundle builds" and "this was seen working on a device" as different claims —
keep them different.

If you add a rule, put it in `AGENTS.md` or `.agents/rules/`. If you add
reasoning, put it in `CLAUDE.md`. Never copy material between them: point at it
with a path. A duplicated rule is a rule with two homes and one maintainer.

If you add a skill or a rules file, run:

```sh
cd mobile && npm run sync:agent-docs
```

That regenerates the index in `.agents/rules/30-reference.md` (so Antigravity
sees Claude Code's skills) and in `CLAUDE.md` (so Claude Code sees your rules).
`npm run check:agent-docs` fails if you forget, and it runs in CI, so this
cannot go stale quietly.

Note that `GEMINI.md` takes precedence over `AGENTS.md` in your context. It is
deliberately a pointer with no rules in it. Do not move rules there — a stale
copy that silently wins is the worst possible outcome. The check enforces this.

**Step 4 — verification is not optional.** Before claiming anything works:

```sh
cd mobile
npx tsc --noEmit      # must be clean
npx eslint .          # 0 errors; warnings are inline-style noise
npm run check:smoke   # drives the real screens, 18 flows, must end "OK"
```

plus the `check:*` scripts listed in `AGENTS.md`. `check:smoke` must report
**0 runtime errors**, not merely 18 passing steps — a passing suite with
warnings underneath is how a gesture bug survived three bug reports.

If you have an emulator or a device — which you may and Claude Code usually
does not — say so explicitly when you report results, and prefer testing there.
`mobile/preview` is react-native-web: it checks layout and motion timing in a
browser, never native rendering, native gestures, or anything in
`mobile/android/`.

**Step 5 — things that must not happen.**

- Never commit a secret. The Android signing key lives only in GitHub Actions
  secrets and on the developer's machine. Do not base64 a keystore into a
  workflow file to make a build pass.
- Do not change `applicationId` (`com.aistudio.mbbsqbank.aycxvd`) — it would
  publish a second app instead of an update — and increase `versionCode` for
  every Play upload.
- Test builds must serve **no ads at all**; release builds serve live ones.
  `mobile/src/lib/adsMode.ts` and the CI workflows own that distinction.
- Work on the branch `claude/native-app-sync`. Do not push to the default
  branch.

**Step 6 — report back.** Tell me, in this order:

1. Which of the files in step 1 you read, and the single rule from them you
   think is most likely to be broken by accident.
2. The command you would run to preview the React Native app, and how you know
   it is not the web app.
3. Whether `npm run check:agent-docs` and `npm run check:smoke` pass right now
   on your machine, with the actual output.
4. Anything in `HANDOFF.md` marked outstanding that you think should be done
   first.

Do not start writing code until you have done step 6.
