# Rate limits — surviving one without losing the work

A rate limit is a deadline that arrives without warning. Whether it costs an
hour or a day is decided entirely by whether the work was **on disk** when it
landed. Claude Code has the same rules in `.claude/skills/rate-limit-resume/`.

## It has happened three times, always the same way

Parallel agents, killed together, mid-verification.

- **2026-09-03** — three agents produced the web-flashcards, reels and
  flowchart work; all three were killed mid-verification, and everything had to
  be re-verified by hand (see the `20be9e4f` commit message, which says so).
- **2026-09-04** — three agents again. One died one step after "Deploying
  v56"; another died saying "Now add the ClaimRow component itself". Both had
  written real files, so both were recoverable. Neither had committed.

The pattern is not bad luck. **Parallel agents multiply burn against a shared
account budget**, so three agents reach the limit roughly three times as fast.
Two is usually the right number, and anything irreversible — a deploy, a
migration, a push — belongs in the main session where a failure is visible.

## Before

1. **Write real files. Never hold work only in context.** A killed agent's
   context is gone; its files survive. That is the whole difference.
2. **Checkpoint every 15–20 minutes** into `.agents/state/agent-<topic>.md`:
   done / half-done and where the seam is / next.
3. **Commit finished work as it finishes.** The end-of-session batch commit is
   exactly the batch a limit eats.

## During

The reset time is in the error. Two different things wear the same 429:

- an **account or session limit** — stop spawning agents, finish only the
  critical path, then write state and stop. Retrying in a loop cannot succeed
  before the reset and spends budget doing it.
- a **provider quota** — e.g. a Gemini 429 surfacing through
  `generate-handwritten-notes`. That is a per-minute key limit, not the account,
  and ordinary work continues. Pace the calls.

## After

Run `npm run resume` first — it is offline and reads the repo rather than a
chat history nobody else can see.

Then **check the world, not the transcript**, before redoing anything: the
deployed function's version, the row in the database, the file on disk. A dead
agent's last message is a plan, not a result. On 2026-09-04 an agent died
*after* its deploy succeeded; re-running it blind would have redeployed a
function that was already live and correct.

Antigravity cannot schedule its own wake-up, so its whole half of this is the
checkpoint discipline above.
