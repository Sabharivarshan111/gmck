# Protecting this repository

The app's owner asked for this repo to be undeletable, "hardcoded". This is the
honest answer: **half of it can be hardcoded and half of it cannot**, and the
half that cannot is not a limitation of effort. It is a limitation of who is
allowed to press which button.

| | What it protects | Who can do it |
|---|---|---|
| `npm run check:repo-intact` | the *contents* of a checkout — a wipe, a bad merge, a "tidy-up", a rebase that drops a directory | **done**, runs in CI |
| Branch ruleset: restrict deletions | `main` cannot be deleted, by anyone, including you | the owner, 2 minutes |
| Branch ruleset: restrict force pushes | history on `main` cannot be rewritten away | the owner, same screen |
| Require a PR to `main` | nothing lands unreviewed | the owner, same screen |
| Repository deletion | the repository itself | **only** the owner or an org admin |
| An off-GitHub mirror | everything, including GitHub going away | the owner, once |

## What is already hardcoded

`mobile/scripts/repo-intact-check.mjs`, wired as `npm run check:repo-intact` in
both `package.json` files and run by `.github/workflows/android-debug.yml`,
`android-internal.yml`, `android-release.yml` and `webpack.yml`. It fails, with
a reason, if:

- a load-bearing file is **missing or empty** — `CLAUDE.md`, `AGENTS.md`,
  `GEMINI.md`, `HANDOFF.md`, the four files that must agree about the `@data`
  alias, `build.gradle`, the Supabase queue, `vercel.json`, the workflows;
- a load-bearing **directory has been emptied or shrunk** below a floor —
  `src/data/topics/`, `mobile/src/{components,screens,lib,theme,native}`, the
  Kotlin, `mobile/scripts/`, `.agents/rules/`, `.claude/skills/`,
  `supabase/{functions,migrations}`, `.github/workflows/`;
- something is **present but truncated** — `src/data` under 400 KB, `CLAUDE.md`
  under 40 KB, `HANDOFF.md` under 20 KB;
- `.agents/tasks/supabase-pending.json` **stops parsing**, which every reader of
  it would otherwise treat as an empty queue, silently;
- a deletion under `src/data/`, `.agents/`, `.claude/`, `.github/workflows/` or
  `supabase/migrations/` is **staged** — the cheapest moment to catch one, and
  the only one where nothing has been lost yet.

Floors rather than exact counts, because files are added and removed here every
day. Each floor sits well under what is present, so ordinary work never trips
it and a directory that falls under it has not been edited, it has been emptied.

It exists because of what is genuinely unrecoverable here. `src/data/` is
~570 KB of hand-transcribed exam questions with no upstream — not generated,
not rebuildable, and from inside `mobile/` it looks like a folder belonging to
a frozen web app nobody works on. `.agents/` and `.claude/` are the project's
memory across sessions and tools; deleting them re-opens the hole that had
flashcards built twice (`HANDOFF.md` §8f). `.github/workflows/` is the only
machine that can produce an APK: there is no emulator and no Android SDK in the
sandboxes, and `dl.google.com` is denied by the egress gateway.

## What no script and no agent can do

**Nothing in this repository can stop the repository being deleted.** Deletion
is a GitHub account setting, not a file, and:

- repository deletion and rulesets are **owner/admin-only** by design, so a
  token scoped for an agent cannot reach them even in principle;
- the agent proxy denies the GitHub Actions and admin APIs outright —
  `403: Access to this GitHub Actions path is not permitted through this proxy`
  (`HANDOFF.md` §2.1). Do not spend a session rediscovering this.

So the rest of this file is a set of instructions for a person. They take a few
minutes and they are the actual answer to the question that was asked.

## 1. Stop `main` being deleted or rewritten (2 minutes)

`github.com/Sabharivarshan111/gmck` → **Settings** → **Rules** → **Rulesets** →
**New ruleset** → **New branch ruleset**.

- Ruleset Name: `protect-main`
- Enforcement status: **Active** (a ruleset left on "Evaluate" enforces nothing
  and looks identical in the list)
- Target branches → **Add target** → **Include default branch**
- Tick **Restrict deletions**
- Tick **Block force pushes**
- Optionally **Require a pull request before merging**, with 0 approvals — it
  still stops a direct push to `main`

**Create**. Repeat on the mirror if one is in use; rulesets are per repository,
in the same way the signing secrets are (only `gmck` has those).

One consequence to expect rather than be surprised by: with force pushes
blocked, a history rewrite like the `git filter-repo` that purged the leaked
OpenAI key (§2.3, §5) needs the rule temporarily disabled. That is the trade
being made deliberately — the rewrite is rare, the accidental force push is not.

## 2. Decide who can delete the repository

**Settings** → **General** → scroll to **Danger Zone**.

Under a personal account, only the account owner can delete a repository, and
nothing there can be tightened further. If this ever moves under an
organisation, set **Member privileges** → **Allow members to delete or transfer
repositories for this organization** to **off**, which restricts deletion to
org owners.

Also worth checking on the same page: **Manage access**. An agent, an
integration or a collaborator with `admin` does not need `admin` — `write` is
enough for everything any tool here does.

## 3. Keep a copy that is not on GitHub

Rulesets protect a branch. They do not protect against the account itself being
lost, suspended, or having its password reset by somebody else. The only real
backstop is a copy somewhere GitHub does not control.

The cheapest version, from any machine that has the repo:

```sh
git clone --mirror https://github.com/Sabharivarshan111/gmck gmck-mirror.git
cd gmck-mirror.git && git remote update    # to refresh it later
```

`--mirror` takes every branch, tag and note, not just the checked-out tree.
Keep it on a drive, or push it to a second host (GitLab, Codeberg, a NAS).

### Why there is no mirror workflow in `.github/workflows/`

There nearly was, and it would have been the wrong thing to add. A push-mirror
job needs a credential for the destination — a deploy key or a token — that
only the owner can create, and it would sit in the workflow list looking like
protection while doing nothing until that secret existed. This project has been
bitten by exactly that shape twice: three checks existed for weeks without
running in CI (§8f), and `npm run voice` wrote a manifest without ever running
the synthesiser (§14.4). A step that silently skips is worse than no step,
because it is believed.

If a mirror is wanted as a workflow, the order is: create the destination
repository, add its deploy key as a secret, **then** add the workflow — and
make the workflow **fail loudly** when the secret is absent, the way
`android-internal.yml` exits 1 with an explicit error when
`ANDROID_KEYSTORE_BASE64` is missing, rather than skipping.

## 4. The releases are already a partial backup

Every push to a build branch publishes a GitHub **Release** carrying an APK.
That is not source, but it means a deleted repository does not immediately mean
a dead app: the last shipped build is still installable, and Play holds the
uploaded `.aab` independently of this repository. The signing key is the thing
that is genuinely irreplaceable, and it is deliberately **not** in this repo —
it lives in Actions secrets and on the owner's machine. Losing both means a new
upload key and a Play support request, which is survivable, and committing it
here to avoid that would be worse than the risk it removes.

## Checklist for the owner

- [ ] `protect-main` ruleset created, enforcement **Active**, restrict deletions
      and block force pushes ticked
- [ ] Danger Zone read; nobody unexpected holds `admin`
- [ ] one `git clone --mirror` taken and stored off GitHub
- [ ] a reminder to refresh that mirror (`git remote update`) — monthly is
      plenty

When these are done, update `.agents/state/blocked.json` — the entry is
`repo-deletion-protection` — so the resume report stops listing it.
