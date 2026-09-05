---
description: Cutting builds — which of the four to use, how to trigger one, and the two things a wrong build costs
---

# Releases

Three build workflows, in `.github/workflows/`. All three are already wired to
run on a **push to `claude/native-app-sync`**, so cutting a build is:

```sh
git push gmck claude/native-app-sync    # signed builds live here
git push origin claude/native-app-sync  # mirror; its release run fails, see below
```

Then watch **Actions** on `gmck`. Every workflow publishes to a GitHub
**Release**, not just an Actions artifact — an artifact needs a signed-in
desktop browser, and the whole point is installing from the phone.

## Which build

| Want | Workflow | Tag | Package | Ads | Signs in? |
|---|---|---|---|---|---|
| Install and poke at it | `android-debug.yml` | `debug-N` | `…aycxvd.debug` | **none** | no |
| Test Google Sign-In / Supabase | `android-internal.yml` | `internal-N` | `…aycxvd` | **none** | yes |
| Upload to Play | `android-release.yml` | `release-N` | `…aycxvd` | **live** | yes (Play cert) |

`android-release.yml` produces **both** an `.aab` (upload this to Play) and an
`.apk` (sideload this to test the real thing). The other two produce an APK only
— Play never sees them.

## How to actually cut one (you do not need API access)

**Push to `main`, and all three build and publish their releases.** That is the
whole answer, and it is new as of 2026-09-03.

Before that, the three workflows only fired on pushes to
`claude/native-app-sync`, and `main` was in none of the lists. So a merge to
`main` built nothing, and the only other route was calling `workflow_dispatch`
through the GitHub API — which needs a token. Claude Code has one through its
GitHub connector; **Antigravity does not**, which is the entire reason it could
never cut a build while Claude Code could. It was never a permissions problem
to argue about, just a branch missing from three lists.

The `paths:` filters on the debug and internal workflows are what keep this
affordable — a commit that only moves documentation still burns no runner.
`android-release.yml` deliberately has no paths filter, because it is the
artifact people actually wait for.

Each workflow also still accepts a manual `workflow_dispatch` from the Actions
tab, which is the way to rebuild a commit without pushing a new one.

## Two things that cost real money if you get them wrong

**1. A test build must never be able to show a live ad.** Serving yourself live
ads is an AdMob policy violation that can suspend the account. The debug and
internal workflows overwrite `mobile/src/lib/adsMode.ts` with
`ADS_ENABLED = false` — not Google's test ads, *none*, because starting the
AdMob SDK and the UMP consent form is real work at launch on a phone that has
none to spare.

The release workflow does the mirror image: it **refuses to build** unless that
file is in its shipped form (`ADS_ENABLED = !__DEV__`). A release that silently
went out with ads disabled would earn nothing and give no sign of it.

Never key this to `__DEV__`. It used to be, and that forced every installable
test build to ship development JavaScript to stay safe — several times slower
than the shipped app, and the cause of most "the app lags" reports.

**2. `versionCode` must increase on every Play upload.** Play rejects a repeat,
and it rejects it *after* the upload. 13 is live and the repo carries 15 — 14
was rejected and cannot be reused. It is in `mobile/android/app/build.gradle`
AND `mobile/src/lib/appVersion.ts`, which is how the app knows its own version
with no native module; `npm run check:version` fails if they disagree. Bumping
also needs an `app_releases` row, `live_on_play` false until Play serves it.

Do **not** change `applicationId` (`com.aistudio.mbbsqbank.aycxvd`): it matches
the published listing, and changing it publishes a *second app*.

## A secret belongs to one repo, and there are two remotes

**Every push goes to two repositories** — `gmck` and `origin` — and both run the
same workflow files. A GitHub secret is *per repository*, so a workflow that
reads one works on the remote that holds it and fails on the other, from
identical code. That is the single most confusing failure mode in this repo, and
it is never a bug in the YAML.

The signing keystore lives in three secrets — `ANDROID_KEYSTORE_BASE64`,
`ANDROID_STORE_PASSWORD`, `ANDROID_KEY_PASSWORD` — and only `gmck` has them.
The mirror's release run therefore dies at *"Restore the upload keystore"*.
Check `gmck`'s run before debugging anything.

The same trap now applies to `SUPABASE_ACCESS_TOKEN` (below). When you ask
someone to add a secret, **name the repository** — "add it to GitHub" gets it
added to whichever one they had open, which is a coin flip.

A workflow that needs a secret should therefore say which name it looked for
and whether it found it, before doing anything else. Printing `set` / `not set`
for a secret name leaks nothing and turns a silent skip into an answer.

Never commit a keystore, a password or a `.jks`. The workflow writes the
decoded key outside the workspace and deletes it in an `always()` step.

## What every build runs before it builds

Typecheck, lint, then the `check:*` scripts. Each one guards a bug that
shipped, so a red check is a real answer and not an obstacle. The full local
list is in `CLAUDE.md` under "Verify before claiming something works";
`check:smoke` and `check:contrast` are the two worth running by hand, since
`check:smoke` needs Chromium and is not in CI.

**Nothing in this repo compiles Kotlin.** `dl.google.com` is unreachable from
the agent sandboxes, so CI is the first thing that ever sees a native change —
a Kotlin typo costs a full round trip. Read `MainApplication.kt` and the
`*Module.kt`/`*Package.kt` files carefully before pushing one.

## Sign-in only works in the internal build

Google Sign-In matches an app on **package name + signing certificate**. The
debug APK deliberately fails both, so sign-in can never work there — that is
not a bug to chase. `android-internal.yml` keeps the real package and the real
upload key, and prints the SHA-1 the OAuth client has to be registered against
on every run. Installing it means **uninstalling the Play Store copy first**
(same package, different signature — Android refuses otherwise). Local progress
goes with it; anything synced to Supabase comes back on sign-in, which is what
the build exists to prove.

The published app uses *Play's* app-signing certificate, which is a different
certificate from the upload key. See `mobile/OAUTH-SETUP.md`.

## `supabase-check.yml` is the fourth, and it is not a build

It runs every edge function and RPC the app depends on against the **live**
project and prints a pass/fail table. It exists because the agent sandboxes
cannot reach the Supabase host at all — the egress gateway answers 403 — so
contracts can be checked against the migrations here and never against the
running project. A runner has open network.

It is `workflow_dispatch` only, and GitHub offers "Run workflow" only for a
workflow that exists on the repository's **default** branch (the dispatch API
404s otherwise). Until this branch merges, it runs from the default branch's
copy.

It uses the **anon key**, which is public and already shipped inside the APK.
Never add a service-role key: that key bypasses RLS, and this check exists to
prove RLS works.

## `supabase-tasks.yml` is how anything *changes* Supabase

`supabase-check.yml` reads; this one writes. It holds the maintenance jobs that
need the Management API — making a storage bucket private, running a one-off
SQL statement — and it exists because **no agent sandbox can reach Supabase at
all**.

That block is worth understanding before you waste an hour on it. The egress
gateway answers `403` to the CONNECT itself, for `api.supabase.com` and for
`pmtgeydtqypwrypshhsx.supabase.co` alike, exactly as it does for `google.com`:

```
connect_rejected  gateway answered 403 to CONNECT
                  pmtgeydtqypwrypshhsx.supabase.co:443
```

**A token does not change this.** The refusal happens before any credential is
offered, so being handed a personal access token is not an unblock — it only
moves the work to a runner. Do not retry, do not look for a proxy around it, and
never disable TLS verification or unset `HTTPS_PROXY`. `curl -sS
"$HTTPS_PROXY/__agentproxy/status"` shows the recent refusals if you want to see
it for yourself. The only permanent fix is the *environment's network policy*,
which is set by the account owner when the environment is created — not by
anything in this repo.

The token is a Supabase **personal access token: full management access to the
account.** It lives only in GitHub's secret store. Never in this repo, never in
a log, never in a command line where a process listing could catch it — read it
from the environment, keep `set +x` on, and print bucket names and flags rather
than responses.

## Reading a red pipeline before blaming the YAML

Both repos are **public**, so Actions minutes are free and unlimited. Billing
is never the answer; do not go looking for it.

Two states mean *GitHub has not allocated a runner*, neither a defect in the
workflow:

- **`startup_failure`** — a previously-green workflow simply refusing to start.
- **`409 Cannot cancel a workflow run that has not been queued yet`** on a run
  that has sat in `queued` for half an hour. It exists but was never enqueued,
  so there is nothing to cancel.

Both showed up together after a day of heavy pushing, with nothing in progress
on either repo. The fix is to ask for less — the concurrency guards and path
filters on `android-debug.yml` and `android-internal.yml` are there for this —
then wait. It recovers on its own.

**Checks use `cancel-in-progress: false`; builds use `true`.** An obsolete build
is worth cancelling — the commit that replaced it is the one worth building. A
check answering a question you are waiting on is not: cancelling it destroys
the answer, which is how the first flashcards run died.

A workflow file not on the **default** branch cannot be dispatched from the UI
(`workflow_dispatch` 404s, as does listing its runs by filename). Give anything
you need to run from a branch a `push:` trigger with a `paths:` filter.

## Where the long version lives

`mobile/BUILD-FROM-PHONE.md` — step by step, from a phone. `HANDOFF.md` §2 for
what is blocking, §6 for building.

## Three ways a build goes red that are NOT the build (2026-09-04)

All three read as "my change did not ship".

**1. A shared module cannot find Babel's helpers.**

    Unable to resolve module @babel/runtime/helpers/interopRequireDefault
      from /repo/src/lib/apkgFormat.ts

Every Android build failed to bundle for two days. Metro walks **up from the
requesting file**, so a shared module in `../src/lib/` looks in
`/repo/node_modules`, never `mobile/node_modules` — the only one CI installs,
and Babel injects helper imports into what it transforms. Fixed with
`resolver.nodeModulesPaths`. Not reproducible where `/repo/node_modules`
exists; move it aside and run the real bundle.

**2. The Vercel build breaks on a file in `mobile/`.** The mirror image: the
web app imported from `mobile/`, and esbuild resolves the nearest tsconfig to
every file — `mobile/tsconfig.json`, extending a package only
`mobile/node_modules` has. Three deploys failed unnoticed, because a failed one
leaves the previous up. **A shared module belongs in `src/lib/`, via
`@shared`.**

**3. A doc check gates every Android build.** `check:agent-docs` runs first in
all three workflows and fails on a rules file pointing at a path that no longer
exists. Moving a file breaks the APK until the rules are repointed: the error
names a markdown file while the symptom is "no APK".

**Green deploy, stale phone:** `public/sw.js` evicts caches by changing its cache
name, and `SW_VERSION` sat unchanged for a month, so `activate` deleted nothing.
Bump it whenever a reader must see the change.
