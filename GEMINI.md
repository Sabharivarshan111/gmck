# Orbit MBBS — Antigravity / Gemini

**The rules live in `AGENTS.md`. Read that file.** Then `HANDOFF.md` for
current status, and `CLAUDE.md` for the full reasoning.

This file exists because Antigravity reads `AGENTS.md` and `GEMINI.md` together
and lets `GEMINI.md` win any conflict. It is deliberately a pointer and not a
copy: two files of rules that can disagree is worse than one, and the one that
silently wins is the one nobody updates.

Add Antigravity-specific overrides here only — never a second copy of a rule
that already exists in `AGENTS.md`.

## Antigravity-specific notes

- Rules files are capped at 12,000 characters. `AGENTS.md` is written to fit;
  `CLAUDE.md` (~32,000) is not a rules file and is meant to be opened and read,
  not loaded wholesale.
- `.claude/skills/` holds vendored design skills (`apple-design`, `animate`,
  `review-animations/STANDARDS.md`) that Claude Code loads automatically and
  Antigravity does not. They are the source of the motion and interaction rules
  in `AGENTS.md` — open them by hand when doing animation work.
  `.claude/skills/apple-design/README.md` is the index, and records which web
  techniques were deliberately **not** taken (no backdrop blur, no haptics on
  navigation, no stagger) so nobody "fixes" them by accident.
- There is no emulator in most sandboxes but there is one in a local IDE. If
  you can run the app on a device, say so explicitly when reporting results —
  every claim in the history so far is careful to distinguish "the bundle
  builds" from "this was seen working", and that distinction is worth keeping.
