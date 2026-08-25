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

## Two things that cost real money if you get them wrong

**1. A test build must never be able to show a live ad.** Serving yourself live
ads is an AdMob policy violation that can suspend the account. The debug and
internal workflows overwrite `mobile/src/lib/adsMode.ts` with
`ADS_ENABLED = false` before building — not Google's test ads, *none*, because
starting the AdMob SDK and the UMP consent form is real work at launch on a
phone that has none to spare.

The release workflow does the mirror image: it **refuses to build** unless that
file is in its shipped form (`ADS_ENABLED = !__DEV__`). A release that silently
went out with ads disabled would earn nothing and give no sign of it.

Never key this to `__DEV__`. It used to be, and that forced every installable
test build to ship development JavaScript to stay safe — several times slower
than the shipped app, and the cause of most "the app lags" reports.

**2. `versionCode` must increase on every Play upload.** `mobile/android/app/build.gradle`.
13 is live; the repo carries 14. Play rejects a repeat, and it rejects it after
the upload, not before.

Do **not** change `applicationId` (`com.aistudio.mbbsqbank.aycxvd`). It matches
the published listing; changing it publishes a *second app* instead of an update.

## Why `origin`'s release run fails and that is fine

The signing keystore lives in three GitHub secrets — `ANDROID_KEYSTORE_BASE64`,
`ANDROID_STORE_PASSWORD`, `ANDROID_KEY_PASSWORD` — and only `gmck` has them.
The mirror's release run therefore dies at *"Restore the upload keystore"*.
That is a missing secret, not a broken build: check `gmck`'s run before
debugging anything.

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

## Where the long version lives

`mobile/BUILD-FROM-PHONE.md` — step by step, from a phone, no computer.
`HANDOFF.md` §2 — what is still blocking, and §6 for building.
