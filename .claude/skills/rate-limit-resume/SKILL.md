---
name: rate-limit-resume
description: Survive an account rate limit or session limit without losing work, and know exactly when and where to resume. Use when a subagent dies with "session limit"/"rate_limit"/HTTP 429, when planning to spawn parallel agents, when work must be paced across a limit reset, and when writing down what a post-limit session should pick up. Covers why parallel agents are the main way this project hits the limit.
---

# Rate limits: what to do before, during and after

A limit is not a crash. It is a **deadline that arrives without warning**, and
the only thing that decides whether it costs an hour or a day is whether the
work was on disk when it hit.

This has happened to this project three times, and the expensive one is always
the same shape: parallel agents, killed together, mid-verification.

- 2026-09-03 — three agents produced the web-flashcards / reels / flowchart
  work and **all three were killed mid-verification**. HANDOFF's own commit says
  everything had to be "verified by hand afterwards rather than taken on trust".
- 2026-09-04 — three agents again. The deploy agent died one tool call after
  saying "Deploying v56"; the native-bugs agent died saying "Now add the
  `ClaimRow` component itself". Both had written real files, so both were
  recoverable. Neither had committed.

## Before: assume you will be interrupted

1. **Write to real files, never hold work in context.** A killed agent's
   context is gone; its files are not. This is the whole difference between the
   two outcomes above.
2. **Checkpoint every 15–20 minutes** to `.agents/state/agent-<topic>.md`:
   what is done, what is half-done and where the seam is, what is next.
   `.agents/state/resume-notes.md` is the same idea for the session as a whole.
3. **Commit finished work as it finishes.** Do not batch a session into one
   commit at the end — that is the batch the limit eats. Stage selectively when
   other agents are mid-edit in the same tree.
4. **Parallel agents multiply burn, not just speed.** Three agents on one
   account is roughly three times the rate against a shared limit, which is why
   this project keeps hitting it with exactly three. Prefer 2, prefer
   sequential for anything whose result another step depends on, and keep
   anything irreversible (a deploy, a migration, a push) in the main session
   where you can see it fail.

## During: read the error before reacting

    You've hit your session limit · resets 2:40pm (UTC)   (rate_limit, HTTP 429)

The reset time is in the message. Two different things wear the same 429:

| | What it means | What to do |
|---|---|---|
| **session / account limit** | the account is out of budget until a stated reset | stop spawning agents; finish the critical path in the main session; if that is also limited, write state and stop |
| **provider quota** (e.g. Gemini 429 from an edge function) | a per-minute or per-day key quota | pace the calls; this is not the account limit and does not block ordinary work |

Do not retry a session limit in a loop. It cannot succeed before the reset, and
every attempt is spent budget.

**Never respawn a killed agent to "try again" without first reading what it
left behind.** It may have finished the dangerous half. On 2026-09-04 the deploy
agent died after deploying v56 — respawning it blind would have redeployed a
function that was already live and correct.

## After: resume from the repo, not from memory

Run this first, always — it is offline and reads the repo, not a chat history:

    npm run resume

Then, before redoing anything an agent was in the middle of, **check the world,
not the transcript**: a deployed function's version, a row in the database, the
file on disk. The agent's last message is a plan, not a result.

## Scheduling a resume

Nothing in this repo polls. If you want the work to continue at the reset:

- **Claude Code**: `send_later` (claude-code-remote MCP) delivers a message back
  into this session at a chosen time — `at` the reset time from the 429, or
  `delay_minutes`. Write the message as a full instruction: it arrives in a
  session that may have lost its context.
- If that tool is absent, say so plainly and let the person restart. Do not
  claim a wake-up you did not schedule.

## For Antigravity, Cursor and Codex

The same rules, minus the tooling. Those agents cannot schedule a wake-up, so
their half is entirely the checkpoint discipline:
`.agents/rules/05-resume.md` and `.agents/state/`. A model that stops mid-task
in those tools leaves nothing else behind.
