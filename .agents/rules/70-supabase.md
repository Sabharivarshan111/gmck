---
description: Supabase — why no sandbox can reach it, and the queue that stops blocked work being forgotten
---

# Supabase, and work that is waiting for it

**No agent sandbox can reach Supabase.** The egress gateway answers `403` to
the CONNECT itself — `api.supabase.com` and the project host alike — *before
any credential is offered*. A personal access token is therefore **not an
unblock**; it only moves the work to a machine that has a route. Do not retry,
do not look for a proxy around it, and never disable TLS verification or unset
`HTTPS_PROXY`. `curl -sS "$HTTPS_PROXY/__agentproxy/status"` lists the refusals
if you want to see it.

Two routes exist: an **MCP connector** (Antigravity and Claude Code both have
one when it is switched on) and a **GitHub runner**.

## Blocked work goes in the queue, never only in a chat message

    .agents/tasks/supabase-pending.json

Committed, so it survives the session, the tool and the machine. Neither agent
can read the other's conversation, and a connector dropping mid-task is normal
— one did, halfway through the flashcards work.

The failure this prevents is not "it could not be done", it is that it is
**forgotten**. The repo's copy of `generate-handwritten-notes` once sat two
versions behind the deployed one for weeks, so reading the code agreed with the
bug nobody could find. That is what an un-queued deploy turns into.

## Every session that touches Supabase starts here

```sh
cd mobile && npm run supabase:status
```

It prints whether *this machine* can reach Supabase and what is outstanding.
**The probe is not the whole answer.** It is false in every sandbox, and a
connector is still a route — so check your own tools too:

| Signal | You have a route? |
|---|---|
| Supabase MCP tools are loaded | yes — drain the queue |
| probe says reachable (a runner) | yes — drain the queue |
| neither | no — park the work |

**A missing connector is usually switched off, not broken.** Report which:
authenticated but disabled for this conversation is a toggle the person flips
in the chat's connector settings, and no tool can flip it for them.

## Draining it

Oldest first. Read `why` before `file` — several jobs carry a constraint that
is invisible in the diff. Deploy a function **from the repo file the job names**,
so the deployed copy and the repo's copy stay the same thing. Run the job's
`verify` line; a deploy that returned a version number has not been verified.
Then `npm run supabase:done -- <id>` and commit.

## Adding to it

```sh
node scripts/supabase-queue.mjs add path/to/job.json
```

`kind`, `summary`, `why`, usually `file`. The script refuses a job with no
`summary` or `why`, because those are the entire message to whoever picks it
up — write `why` as the consequence of *not* doing it.

Then say which is true, because they are three different situations: nothing is
broken meanwhile (name the fallback), something is degraded (name what a user
sees), or something is wrong until it lands (say so first).

**No credentials in a job, ever.** The queue is committed.
`npm run check:supabase-queue` fails on a job whose file has gone missing; it
cannot un-leak a secret.

## What is deployed, and from where

`supabase/functions/` is the deployment source. `generate-flashcards` lives
there and must keep matching what is live. `generate-handwritten-notes` does
**not** — read that one through the connector, and see
`.agents/rules/50-notes.md`.
