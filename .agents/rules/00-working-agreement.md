---
description: How Claude Code and Antigravity share this repo without fighting each other
---

# Working agreement — two agents, one repo

This project is worked on from **Claude Code** and **Antigravity**, sometimes
on the same day. Neither is the owner. These are the rules that keep a prompt
started in one and continued in the other from producing two versions of the
truth.

## Which file each tool reads

| File | Claude Code | Antigravity | What it is |
|---|---|---|---|
| `AGENTS.md` | via `CLAUDE.md` | **natively** | the shared rules, ≤12,000 chars |
| `CLAUDE.md` | **natively** | on request | the long form, with the reasoning |
| `GEMINI.md` | no | **natively** | a pointer to `AGENTS.md`, nothing else |
| `.agents/rules/*.md` | on request | **natively** | this folder — enforceable rules, ≤12,000 chars each |
| `.claude/skills/**` | **natively** | on request | vendored reference material |
| `HANDOFF.md` | both | both | current state and what is outstanding |

`GEMINI.md` wins conflicts with `AGENTS.md` in Antigravity, which is exactly
why it holds no rules: a duplicated rule that silently wins is the one nobody
updates.

## The rule that prevents drift

**One statement of a rule, in one place.**

- A rule that both tools must obey goes in `AGENTS.md` or `.agents/rules/`.
- The *reasoning* goes in `CLAUDE.md`.
- Reference material stays in `.claude/skills/` and is **pointed at**, never
  copied. If you find yourself pasting a section of a skill into a rules file,
  write the one-line rule and a path instead.

`npm run check:agent-docs` (in `mobile/`) fails if a rules file goes over the
12,000-character cap, if `GEMINI.md` starts growing rules of its own, or if a
path referenced from the rules no longer exists.

## Handing work over mid-task

Whoever stops first updates **`HANDOFF.md`**. That file, not the chat history,
is what the next session reads — the other tool cannot see your conversation.

Record what changed, what is verified, and what is *not*. "Bundle builds" and
"seen working on a device" are different claims and this project has been
careful to keep them apart; keep it that way.

## Branch and build

- Work on `claude/native-app-sync`. Do not push to the default branch.
- **Never commit secrets** — keystore, passwords, certificates, API keys. The
  Android signing key lives only in GitHub Actions secrets and on the
  developer's machine.
- Before saying something works, run the verification block in `AGENTS.md`.
  There is usually no emulator, so a green bundle plus `check:smoke` is the
  strongest available signal — and `mobile/preview` is react-native-web, so it
  checks layout and motion timing, never native rendering.

## Which app a change belongs in

**The native app in `mobile/` is the product. `src/` is frozen.**

`src/` is the original Vite web app. It is still live, it still serves users,
and it is not where work happens any more. Touch it only when the owner asks
for it by name — "send it to Lovable too", "fix it in the web app as well" —
and then only for the specific change asked for.

`AGENTS.md` says "do not refactor the web app", which reads as a rule about
*editing* existing web code. It is broader than that: **do not build new
features there either.** A feature added to `src/` is invisible on the phone,
which is the only place the owner sees this product.

### Before building anything, check whether it already exists

The features here are large and were built over many sessions. `HANDOFF.md`
records what is done; `.agents/rules/` names the files. Flashcards, for one,
are already built — `.agents/rules/60-flashcards.md` points at
`mobile/src/screens/FlashcardsScreen.tsx`, `mobile/src/lib/anki.ts` and
`mobile/src/lib/flashcards.ts`. Building a second one in the web app produces
two implementations that disagree, and the owner sees the interface change
under them for no reason they asked for.

`npm run check:one-app` fails if the web app grows its own Anki scheduler,
because there is exactly one and it lives in `mobile/src/lib/anki.ts`.

### How to tell which app you are looking at

The two Notes screens look alike — the native one was ported from the web one —
so the reliable tells are the things that have since diverged:

| | web app (`src/`) | native app (`mobile/`) |
|---|---|---|
| WhatsApp card under Notes | **yes** | removed |
| "Case proforma" (locked) | no | **yes** |
| "ALSO HERE" section | no | **yes** |
| dev server | `localhost:8080` | `localhost:5173` |

**If you can see the WhatsApp block in Notes, you are in the web app.** It was
removed from the native app on the owner's instruction, in the same commit that
added flashcards, so its presence also means the checkout predates that work.

## Previewing the app

`npm run dev:mobile` at the repo root runs the **React Native** app in a
browser. The root `dev` and `preview` scripts run the *other* app — the
original Vite web app in `src/` — which has none of the native app's motion in
it. Previewing the root and reporting that the animations are missing is the
expected outcome of previewing the root.
