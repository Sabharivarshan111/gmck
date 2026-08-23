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

## Previewing the app

`npm run dev:mobile` at the repo root runs the **React Native** app in a
browser. The root `dev` and `preview` scripts run the *other* app — the
original Vite web app in `src/` — which has none of the native app's motion in
it. Previewing the root and reporting that the animations are missing is the
expected outcome of previewing the root.
