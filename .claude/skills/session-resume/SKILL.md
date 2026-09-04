---
name: session-resume
description: Find out where the work stopped, on a cold session with no chat history, and leave the next session able to do the same. Use at the very start of any session on this repo; when resuming after a disconnect, a deleted session, a sign-out or a fresh clone on a different account; when asked "what was I doing", "what is left", "continue from where we stopped" or "what is blocked"; and before ending a session, to write down what the next one needs. Also covers what protects this repository from being deleted.
---

# Resuming work on Orbit MBBS

Everything you knew about this task last time is gone. That is the normal case
here, not the exception: sessions get deleted, connections drop, the account
signs out, containers are thrown away, and the work moves between Claude Code
and Antigravity, which cannot read each other's conversations. **The repo is
the only thing that survived.**

Two failures in this project's history came from exactly that, and both are
written down so nobody has to re-learn them: flashcards were built twice, once
in each app, because neither session could see the other (`HANDOFF.md` §8f);
and a blocked Supabase deploy was mentioned once in a chat message and
forgotten for weeks, until the deployed function and the repo's copy had
silently diverged and reading the code agreed with the bug (§8j).

## The first thing to run

```sh
npm run resume            # from the repo root
```

`mobile/scripts/resume-status.mjs`, also `cd mobile && npm run resume`. It is
**offline by design** — no Supabase, no GitHub API, no network — because the
situation it exists for is a fresh clone in a sandbox behind an egress proxy
that 403s the CONNECT.

Read the whole thing before touching anything. It is short, and each section is
answering a question you cannot answer from memory:

| Section | The question |
|---|---|
| 1. Git | which branch, is the tree dirty, what were the last commits, am I behind a remote |
| 2. What the last session said | `.agents/state/resume-notes.md`, aged against HEAD |
| 3. Blocked, and on whom | `.agents/state/blocked.json` |
| 4. Supabase queue | `.agents/tasks/supabase-pending.json` |
| 5. Open notes | `.agents/queue/` |
| 6. Is the repo still coherent | `check:repo-intact`, `check:agent-docs`, `check:supabase-queue` |

Then read `HANDOFF.md` **from the end** — the newest session is the last
section, not the first — and `.agents/rules/00-working-agreement.md` if you are
about to touch anything both tools share.

A `SessionStart` hook (`.claude/hooks/session-start.sh`, registered in
`.claude/settings.json`) prints this report at the top of every Claude Code
session, resumed ones included. If you can already see it above, you do not
need to run it again.

## The report is derived; do not "fix" it by writing prose into it

Almost every fact in it is read out of the repo at the moment you ask — git is
asked about git, the queue file is parsed, the directory is listed. That is
deliberate. `HANDOFF.md` is the curated long record and it stays, but prose is
true on the day it is written and quietly wrong a week later, which is the same
disease as a lost chat message. A status file that has to be maintained by hand
will not be, precisely in the sessions that end abruptly.

Only two things are hand-written, because only two cannot be derived:

- **`.agents/state/resume-notes.md`** — what you were in the middle of, and the
  next action. Append-only, newest entry at the bottom, heading
  `## YYYY-MM-DD — <tool> — <one line>`. The date is parsed: an entry older
  than HEAD is printed as history rather than status.
- **`.agents/state/blocked.json`** — what is stopped and **who can unstop it**.

`.agents/state/session-state.json` is a generated snapshot (`npm run
resume:write`) for a reader who cannot run anything. Never hand-edit it; if its
`generatedAt` is older than the HEAD commit it records, it has been overtaken
and the script is the answer.

## Saying what is blocked

**A blocker with no owner is not a status, it is a shrug.** Half the open work
here is stopped on something no agent can do:

| Blocked on | Who can clear it |
|---|---|
| a GitHub Actions secret | a human, in Settings → Secrets and variables → Actions. The Actions API is denied by the agent proxy (HANDOFF §2.1) |
| Supabase being unreachable | the owner — enable the connector for **this chat**, or push so `supabase-tasks.yml` runs on a runner |
| Lovable being out of credits | the owner, at lovable.dev/settings/billing |
| a real Razorpay payment | the owner, on a device, with a card |
| an OAuth client / SHA-1 | the owner, in Google Cloud |
| deleting the GitHub repo being possible | the owner — see `.agents/REPO-PROTECTION.md` |

When a connector is the blocker, carry over `supabase-resume`'s distinction and
**say which**: `connected: false` needs a reconnect; `connected: true,
enabledInChat: false` is authenticated but toggled off for this conversation,
which is a switch in the chat's connector settings that no tool can flip. The
remedies are completely different and "Supabase is down" is neither of them.

Each entry may carry `clearsWhen`: a cheap offline probe of something that would
be observably different once it is unblocked (a queue job going `done`, a file
appearing or disappearing). The report prints **MAY BE CLEAR** when one fires,
and never edits the file — a probe can be right about the filesystem and wrong
about the world, so clearing an entry is a person's decision, taken with the
`verify` line in front of them.

## Before you stop — this is the half that gets skipped

Whatever you did is worth nothing to the next session if it cannot be found.

1. **Append to `.agents/state/resume-notes.md`.** Four headings: **DONE** (and
   how it was verified — "the bundle builds" and "seen on a device" are
   different claims and this project keeps them apart), **HALF-DONE** (and
   exactly where the seam is; this is the expensive one to omit, because it is
   what gets rebuilt from scratch), **NEXT** (one concrete action), **DO NOT**
   (what you tried that was wrong — HANDOFF §14.2, the cleanup that would have
   deleted 220 correct diagram rows, is the model).
2. **Anything stopped on a person** goes in `.agents/state/blocked.json` with
   the owner named. Anything stopped on Supabase goes in the queue:
   `node scripts/supabase-queue.mjs add <job.json>` — see the `supabase-resume`
   skill.
3. **A whole session's worth of narrative** goes in `HANDOFF.md`, at the end.
4. **Commit and push**, to both remotes. Uncommitted work in a container about
   to be destroyed is work the next session will redo.

Write the entry when you first become unsure whether you will finish, not when
you finish. The session most in need of a handover note is the one that does
not get to write it.

## Do not let the state files become a fourth place rules live

`.agents/state/` holds *state*, never rules. A rule goes in `AGENTS.md` or
`.agents/rules/`, its reasoning in `CLAUDE.md`, reference material in
`.claude/skills/` — and it is stated once
(`.agents/rules/00-working-agreement.md`). `npm run check:agent-docs` enforces
the mechanical part: the 12,000-char cap per rules file, `GEMINI.md` staying a
pointer, every referenced path resolving, and the generated cross-tool indexes
being current (`npm run sync:agent-docs` after adding a skill or a rule).

`AGENTS.md` runs within tens of characters of its cap. Measure before adding to
it — `node -e "console.log(require('fs').readFileSync('AGENTS.md','utf8').length)"`
— and trim wording, never a rule.

## The repository must not be deletable by accident

```sh
cd mobile && npm run check:repo-intact
```

`mobile/scripts/repo-intact-check.mjs` fails if a load-bearing path is missing,
emptied or shrunk under a floor, if the Supabase queue stops parsing, or if a
deletion under `src/data/`, `.agents/`, `.claude/`, `.github/workflows/` or
`supabase/migrations/` is **staged** — which is the cheapest moment to catch
one. It runs in all three Android workflows and the web build, so it cannot
become one of the checks that exists without ever running (HANDOFF §8f).

What it protects, and why each one is unrecoverable rather than merely annoying:

- `src/data/` is ~570 KB of hand-transcribed exam questions with no upstream.
  It is not generated. From inside `mobile/` it looks like a folder belonging
  to a frozen web app nobody works on, which is exactly how it gets deleted.
- `.agents/` and `.claude/` **are** the project's memory across sessions and
  tools. Deleting them re-opens the hole that had flashcards built twice.
- `.github/workflows/` is the only machine that can build an APK: there is no
  emulator and no Android SDK in the sandbox, and `dl.google.com` is denied.
- `mobile/scripts/` is where every bug this repo has already fixed is
  remembered. A deleted check is a bug scheduled to come back.

**It cannot stop the repository being deleted on github.com.** No script can:
that is an owner-only setting and the GitHub admin API is denied by the agent
proxy. Do not spend a session rediscovering that (HANDOFF §2.1).
`.agents/REPO-PROTECTION.md` is the honest half — branch protection, a
"Restrict deletions" ruleset, who may delete, and an off-GitHub mirror — with
click paths, all of it the owner's to enable. If asked to make the repo
undeletable, say plainly which half you have done and hand over the other half
rather than implying the whole thing is covered.
