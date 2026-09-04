---
description: Picking work up where a dead session left it — the one command that says where things stopped, and why the answer lives in the repo rather than in a chat
---

# Resuming — the repo is the only thing that survives

A session here ends four ways and they are indistinguishable from the next one:
the connection drops, somebody deletes the session, the account signs out, or
the container is simply thrown away. In every case **the conversation is gone**.
It is also gone across tools — Claude Code cannot read an Antigravity thread and
Antigravity cannot read a Claude Code one — and across accounts, which is the
case the app's owner actually hits: a fresh install of this repository on a new
account, expected to continue from where the last one stopped.

So nothing about the state of the work may exist only in a chat message. It has
cost this project twice already: flashcards were built from scratch in both apps
because neither session could see the other (`HANDOFF.md` §8f), and a blocked
Supabase deploy was announced once, in a message, and forgotten for weeks — long
enough that the repo's copy of `generate-handwritten-notes` and the deployed one
had silently diverged (§8j).

## Start here

```sh
npm run resume            # from the repo root
cd mobile && npm run resume
```

`mobile/scripts/resume-status.mjs`. It runs **offline** — no Supabase, no
GitHub API, no network at all — because the report has to work in the case it
exists for, which is a fresh clone in a sandbox behind an egress proxy.

It prints, in order:

1. **Git** — branch, whether the tree is dirty and with what, the last eight
   commits, and how this branch compares to each remote. That comparison is
   against the **last fetched** ref and says how old the ref is; it never
   fetches. `git fetch --all` first if you need it current, and remember that
   `origin` and `gmck` can be at different commits.
2. **What the last session said** — the newest entry in
   `.agents/state/resume-notes.md`, with its age. An entry older than HEAD is
   flagged as *history*, not status.
3. **What is blocked, and on whom** — from `.agents/state/blocked.json`.
4. **The Supabase queue** — `.agents/tasks/supabase-pending.json`.
5. **Open notes** under `.agents/queue/`.
6. **Whether the repo still coheres** — it runs `check:repo-intact`,
   `check:agent-docs` and `check:supabase-queue`, and lists the other checks
   rather than running them.

## Derived, because a hand-written status file rots

`HANDOFF.md` is the long, curated record and it stays. But prose is only true on
the day it is written, and a stale status file is the same disease as a lost
chat message wearing a shirt. So almost everything above is **derived from the
repo at the moment you ask**: git is asked about git, the queue file is read,
the directory is listed.

Two things cannot be derived, and only those two are hand-written:

| File | What it holds | Who writes it |
|---|---|---|
| `.agents/state/resume-notes.md` | what you were in the middle of; the next action | every session, before it stops |
| `.agents/state/blocked.json` | what is stopped, and **who can unstop it** | whoever hits the blocker |

Both are stamped, and the report **ages both against the last commit**, so an
entry the code has overtaken announces itself instead of being believed.

`.agents/state/session-state.json` is a generated snapshot of the same facts,
refreshed with `npm run resume:write`. It is for a reader who cannot run
anything — a tool browsing files, a person on github.com. It carries
`generatedAt` beside the HEAD commit date it was taken at; if the snapshot is
older, it has been overtaken and the script is the answer.

## "Blocked" without an owner is not a status

Half the outstanding work here is stopped on something **no agent can do**: a
GitHub Actions secret only a human can paste, a Supabase connector that is
switched off in the chat's settings, a Lovable workspace out of credits, a real
payment through Razorpay, an OAuth client in Google Cloud. An agent that reports
"blocked on Supabase" has said "try again later", and every future session tries
again later. An agent that reports "blocked until the owner enables the Supabase
connector for this chat — no tool can flip that toggle" has written an
instruction somebody can act on in ten seconds.

So every entry in `blocked.json` carries `owner`, and the report prints it in
capitals. Follow `.claude/skills/supabase-resume/SKILL.md`'s distinction
wherever a connector is involved: `connected: false` needs a reconnect,
`connected: true, enabledInChat: false` needs a toggle in the conversation's
connector settings, and those are completely different remedies. Say which.

Each entry may also carry `clearsWhen`, a cheap offline probe of something that
would be observably different once it is unblocked — a queue job going `done`, a
file appearing or disappearing. The report prints **MAY BE CLEAR** when the
probe fires. It never edits the file: a probe can be right about the filesystem
and wrong about the world, so clearing an entry stays a person's decision.

## Before you stop

1. Append an entry to `.agents/state/resume-notes.md`. The format is at the top
   of that file; the heading must carry an ISO date or it cannot be aged. Four
   headings: **DONE** (and how it was verified), **HALF-DONE** (and where the
   seam is), **NEXT**, **DO NOT** (what you tried that was wrong — §14.2 is the
   model).
2. Anything stopped on a person goes in `.agents/state/blocked.json` with the
   owner named. Anything stopped on Supabase goes in the queue:
   `node scripts/supabase-queue.mjs add <job.json>`.
3. Something worth a whole session's record goes in `HANDOFF.md`, at the end.
4. **Push.** Uncommitted work on a container that is about to be destroyed is
   work the next session will redo.

The order matters: a report is only as good as the last thing written into it,
and the moment you are least likely to write it is the moment a session is cut
short. Write the entry when you start being unsure, not when you finish.

## Nothing here may be deleted

`npm run check:repo-intact` (`mobile/scripts/repo-intact-check.mjs`) fails if a
load-bearing path has gone missing, been emptied, or shrunk below a floor: the
question bank in `src/data/` — hand-transcribed, no upstream, unrebuildable —
`mobile/src/`, the Kotlin, `mobile/scripts/` (the checks are this repo's memory
of its own bugs), `.agents/rules/`, `.claude/skills/`, `supabase/`, the
workflows, and `CLAUDE.md` / `AGENTS.md` / `HANDOFF.md`. It also fails on a
**staged deletion** under a guarded path, which is the cheapest moment to catch
one. It runs in all three Android workflows and in the web build.

It cannot stop the repository itself being deleted on github.com — that is an
owner-only setting, and the GitHub admin API is denied by the agent proxy in any
case. `.agents/REPO-PROTECTION.md` is the honest other half: what actually
protects a repo, with the click paths, and which of it only the owner can do.

## Claude Code runs this automatically

`.claude/settings.json` registers a `SessionStart` hook,
`.claude/hooks/session-start.sh`, which prints the report into the start of
every Claude Code session — including a resumed one, which is exactly the case
where the context has been lost. It is synchronous, offline and never fails the
session: it installs nothing and touches no network, so it costs a second.

Antigravity, Cursor and Codex have no equivalent, which is why this file exists
and why the first line of it is a command to run.
