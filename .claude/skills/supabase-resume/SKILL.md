---
name: supabase-resume
description: Pick up Supabase work that an earlier session could not do, and park work that this one cannot. Use at the start of any session that touches Supabase, when a Supabase connector or tool appears or disappears mid-task, when a deploy/migration/storage change is blocked because Supabase is unreachable, or when asked what is still waiting on Supabase. Covers the edge functions, the flashcards and notes caches, and storage buckets for the Orbit MBBS app.
---

# Resuming Supabase work

Supabase is unreachable from the development sandboxes. The egress gateway
answers `403` to the CONNECT itself, for `api.supabase.com` and the project
host alike, **before any credential is offered** — so a token is not an
unblock, and neither is retrying. The only routes are an MCP connector or a
GitHub runner.

Connectors come and go mid-session. This skill exists so that costs a delay
rather than an omission.

## The rule

**Never let blocked Supabase work exist only in a chat message.** The next
session cannot see this one's conversation, and neither can the other tool.
It goes in the queue, which is committed:

    .agents/tasks/supabase-pending.json

This has already gone wrong the expensive way once: the repo's copy of
`generate-handwritten-notes` sat two versions behind the deployed one for
weeks, so reading the code agreed with the bug nobody could find.

## At the start of a session

    cd mobile && npm run supabase:status

It prints whether this machine can reach Supabase directly and what is
outstanding. **The network probe is not the whole answer** — it is false in
every sandbox, and a connector is still a route. Check both:

| Signal | Meaning |
|---|---|
| `mcp__Supabase__*` tools are loaded | you have a route — drain the queue |
| probe says reachable (a runner) | you have a route — drain the queue |
| neither | you do not — park work, do not retry |

If the connector is missing, check whether it is merely switched off before
telling anyone it is broken. `ListConnectors` reports `connected` and
`enabledInChat` separately, and `connected: true, enabledInChat: false` means
authenticated but toggled off for this conversation — the fix is a toggle in
the chat's connector settings, not a reconnect. **No tool can flip it; only the
person can.** Say exactly which of the two it is.

## When you have a route

Work the queue oldest first. For each job:

1. Read `why` before `file`. Several of these carry a constraint that is not
   visible in the diff — `sb-nocache-deploy` says not to remove the suffixed
   deck key, and removing it would silently overwrite every reader's deck.
2. Apply it. For `deploy_function`, deploy **from the repo file named in the
   job**, so the deployed function and the repo's copy stay the same thing.
3. Run the job's `verify` line. A deploy that returns a version number has not
   been verified; the verify line says what to actually look at.
4. `npm run supabase:done -- <id>`, then commit the queue.

## When you do not

Queue it, and be precise about what is now untrue:

    node scripts/supabase-queue.mjs add path/to/job.json

A job needs `kind`, `summary`, `why` and usually `file`; the script refuses one
without a `summary` and a `why`, because those are the whole message to whoever
picks it up. Write `why` as the consequence of *not* doing it, not as a restatement
of the title.

Then say in your reply which of these is true, because they are different:

- **nothing is broken meanwhile** — the code has a safe fallback (say what it is)
- **something is degraded** — name what a user would notice
- **something is wrong until this lands** — say so plainly and put it at the top

## What must never go in a job

Credentials, of any kind. The queue is committed. A job names *what* to do and
*which file*; the service-role key, the personal access token and the database
password are not part of that and never appear here. `check:supabase-queue`
runs in CI and will fail on a job whose file has gone missing, but it cannot
un-leak a secret.
