# Where I stopped — the hand-written half

`mobile/scripts/resume-status.mjs` derives everything it can: the branch, the
dirty tree, the last commits, the Supabase queue, the open notes under
`.agents/queue/`, and whether the repo still holds its load-bearing paths.
This file is the part no script can derive — **what you were in the middle of,
and what you were about to do next.**

## How to write an entry

Append at the **bottom**, newest last. The heading must be

    ## YYYY-MM-DD — <tool> — <one line>

because the report parses that date and prints the entry's age. It also
compares that date against the last commit: an entry older than HEAD is
printed as *history*, not as status, which is the honest answer for prose that
the code has since overtaken.

Keep an entry to about fifteen lines. It is read cold, by someone with no
context and no chat history, on a different account. Four headings earn their
place:

- **DONE** — what is finished and verified. Say *how* it was verified;
  "bundle builds" and "seen on a device" are different claims and this project
  keeps them apart (`.agents/rules/92-verify.md`).
- **HALF-DONE** — what is written but not finished, and where the seam is.
  This is the expensive one to omit; it is what gets rebuilt from scratch.
- **NEXT** — the single next action, concretely enough to start on.
- **DO NOT** — anything you tried that was wrong. HANDOFF §14.2 is the model:
  a cleanup that would have deleted 220 correct diagram rows, written down so
  the next session does not have the same good idea.

Anything blocked on a **person** goes in `blocked.json` instead, with the
owner named. Anything blocked on **Supabase** goes in the queue
(`node scripts/supabase-queue.mjs add`). This file is for work in flight.

`HANDOFF.md` stays what it is: the long, curated, per-session record. This file
is the short volatile one that is rewritten constantly. If an entry here is
still true a week later, it has become history — move it into `HANDOFF.md`.

---

## 2026-09-04 — Claude Code — built the resume mechanism itself

**DONE**

- `mobile/scripts/resume-status.mjs` + `npm run resume` (mobile and root).
  Derives git state, ages the hand-written files against HEAD, reads the
  Supabase queue and `.agents/queue/`, and runs the three integrity checks.
  Offline by design — it must work on a fresh clone behind the agent proxy.
- `mobile/scripts/repo-intact-check.mjs` + `npm run check:repo-intact`. Floors,
  not exact counts; fires on a missing, emptied or shrunk load-bearing path,
  and on a *staged* deletion under `src/data/`, `.agents/`, `.claude/`,
  `.github/workflows/` or `supabase/migrations/`.
- `.claude/skills/session-resume/` for Claude Code,
  `.agents/rules/05-resume.md` for Antigravity/Cursor/Codex, and a row in
  `AGENTS.md`. `CLAUDE.md`'s table is generated — `npm run sync:agent-docs`.
- `.agents/REPO-PROTECTION.md`: what actually protects the repository, with
  click paths, and honest about which half is the owner's alone.
- Fixed a **pre-existing** `check:agent-docs` failure:
  `.agents/rules/63-anki-import.md` pointed at `mobile/src/lib/apkgFormat.ts`
  and `mobile/src/lib/apkgExport.ts`. Both live at `src/lib/` (shared, the
  root tree) which is what `CLAUDE.md` says. Three dead pointers, so the check
  had been failing on this branch before this session touched it.

**NEXT** — nothing outstanding in this lane. The next session's first command
is `npm run resume`.

**DO NOT** — do not make the resume report exit non-zero when an integrity
check fails. It is wired into a `SessionStart` hook and into `&&` chains; a
report that fails is read as a broken tool and gets removed. The *check* fails
the build, in CI, which is where a failure belongs.

## 2026-09-04 — Claude Code — merged to main; builds and the first ad render in flight

**DONE** (all on `main` at `a8ca2713`, verified against the live systems, not locally)
- **The Vercel site was serving a build from before web flashcards existed.**
  Three production deploys had failed on `failed to resolve
  "extends":"@react-native/typescript-config"` — `src/lib/flashcards.ts`
  imported the Anki scheduler across the tree, and esbuild resolves the nearest
  tsconfig to every file it compiles. `anki.ts` moved to `src/lib/`. Production
  is READY on the merge; Web build workflow green for the first time in three
  commits.
- **Physiology flowcharts: 14 of 14 cached notes.** Live function is **v56**.
  The queued payload was not enough — the repair path had two bugs, the real one
  being that `callModel` sent `SYSTEM_PROMPT` on every call, so a request for one
  flowchart section came back as a whole note every time. Three of those 14 were
  written by real readers after the deploy and arrived with a flowchart, which is
  the guarantee working unattended.
- **The cardiac cycle question was showing a baroreceptor reflex plate.** Fixed
  at the data layer to `cardiac_cycle_wiggers_diagram.jpg`; three other plainly
  wrong attachments on that plate cleared. Backup: `question_diagrams_fix_20260904`.
- Textbook chip icon moved to the trailing edge; screenshot captured and sent.
- Skills: `session-resume`, `rate-limit-resume`, and the "show the screenshot"
  rule in `92-verify.md` + `show-it-works`.

**IN FLIGHT — check these first**
- Android **debug / internal / release** runs on `a8ca2713`. They had been red
  since `8d8841ab` on `check:agent-docs` (dead pointers to
  `mobile/src/lib/apkgFormat.ts`), which this merge fixes. If one fails, read the
  log and fix it — do not stop at "it failed".
- **Ad videos** run 33887390781 — the first time that workflow has ever run.
  9 render targets: 3 × 90s ads and 3 × 60s reels in voiced + silent cuts.

**NEXT**
- The owner's ad brief is NOT met yet, and the gap is specific: they want
  (1) one 60s voiced ad where the **mascot presents** — `BotAvatar.tsx` exists
  but is only used inside the AI-chat screen mock, never as a presenter; and
  (2) two 60s subtitle-only cuts on a **black** background, beat-synced to a
  bed they can swap. The `-silent` cuts already exist; the black ground and the
  beat sync do not.
- 56 plates still sit on >5 questions each (555 rows). Read them, never bulk-fix.
- `check:smoke` has one pre-existing failure on HEAD: "a note filed under a
  chapter shows up on that chapter" (locator timeout). Not caused by this work.

**DO NOT**
- Do not respawn a killed agent without checking what it already did. One died
  one call after "Deploying v56" — the deploy had succeeded.
- Do not bulk-fix `question_diagrams` by any text rule, in either direction.

## 2026-09-04 (later) — Claude Code — three builds out, two agents salvaged after a rate limit

**DONE — the builds the owner asked for are published.**
- **Internal APK** — run 33890078552, release `internal-144`, `app-internal.apk`.
  Every step green.
- **Release AAB + APK** — run 33888281335, all 33 steps success, both uploaded
  and published. (Its overall label reads "cancelled" only because a later push
  superseded it after the steps had finished — read the steps, not the label.)
- The unblocker was `resolver.nodeModulesPaths` in `mobile/metro.config.js`.
  Every Android bundle had failed since `8d8841ab` on
  `@babel/runtime/helpers/interopRequireDefault` unresolvable from
  `src/lib/apkgFormat.ts`.

**The APK's real SHA-1, read with apksigner rather than from a doc:**
`com.aistudio.mbbsqbank.aycxvd` / `CE:EA:8A:41:BB:07:78:C4:78:26:D8:8F:CC:E0:2C:C9:EB:29:40:68`
— matches OAUTH-SETUP.md client #2 exactly. Google sign-in's DEVELOPER_ERROR is
therefore purely the missing Android OAuth client; `auth.identities` has 322
working google identities, so the Supabase half is proven fine.

**Two agents were killed by the account limit (resets 19:40 UTC) and BOTH were
salvaged** — because they wrote real files and checkpointed, which is the rule
added earlier today. Their work is committed at `014d614e` (first-year pathway
flashcards) and `635c7217` (three 60s ads: mascot presenter + beat-grid).

**NEXT — what those two did NOT finish:**
- **Screenshots of the pathway cards.** The flashcards agent died right before
  capturing them; `mobile/preview/pathway-card-shots.mjs` exists and is unrun.
  This repo's rule says a visible change is not done until it is shown.
- **`generate-flashcards` is still v10 live.** The first-year/textbook/pathway
  source is in the repo, undeployed on purpose. Deploy needs the Supabase
  connector, then generate one first-year chapter and read the cards back.
- **No frame of any ad has been rendered.** preflight's only complaints are the
  72 missing voiceover mp3s + manifest, which is edge-tts (egress-denied here,
  CI runs `voice` before preflight). Trigger **Ad videos** to see them.

## 2026-09-04 — (later) — Claude Code — a bad deploy of generate-flashcards, and its repair

**INCIDENT, read this before touching `generate-flashcards`.** I deployed
`generate-flashcards` **v12** with a body of the literal string
`__PLACEHOLDER__` and no `textbook.ts`. That is a dead function in production:
every first-year deck generation would have failed while it stood. It was my
error — I called the deploy tool with a stub payload instead of the repo's real
file contents.

Repair dispatched immediately: a courier agent redeploys BOTH files verbatim
(`index.ts` + `textbook.ts`), keeps `verify_jwt: true`, and proves it by
fetching the deployed source back and `diff`ing it against the repo — the same
byte-identity check that took v10 -> v11. If you are reading this and
`get_edge_function` still shows a placeholder, that repair did not land: redeploy
from `supabase/functions/generate-flashcards/` and diff.

**The lesson, so it is a rule rather than a memory:** `deploy_edge_function`
takes the file bodies inline, and a stub payload is accepted silently — the tool
reports `status: ACTIVE` and a fresh version number for a function that cannot
run. Never call it without the real contents in the `files` array, and always
`get_edge_function` + `diff` afterwards. A version number is not proof.

**What was being deployed, and why:** the `applied` card mode was asked for and
never produced (`.agents/queue/flashcards-applied-cards-2026-09-04.md`). Two live
runs of v11 returned 32 cards across `recall`, `reasoning` and `pathway` and
**zero** `applied`. The prompt asked for them as a fraction ("a quarter") in the
tail of a long system prompt; the model followed the taxonomy and ignored the
quota. Commit `9060209a` moves the quota into the **user** prompt as explicit
integers, beside "Write AT LEAST N theory flashcards" — the one numeric demand
this function has ever reliably obeyed. First year only.

Whether that worked is measured, not assumed: invoke with `noCache: true` and
count `mode = 'applied'`. If it is still zero, the next step is structural
rather than persuasive — `appliedCards` as its own array, the way `diagramCards`
already is. **Do not close the gap by relabelling recall cards**; a card with no
vignette is not an applied card, and mislabelling would make the measurement
stop working as a check.

**Ads:** run 33927028250 still in progress, **0 failed jobs of 14**. Ten of the
thirteen renders are done and green, including all three of the new 60-second
reels — the first time any reel has ever rendered. The three 90-second ads are
the ones still going.

## 2026-09-05 — Claude Code — the web app's Anki import, and three things finished

### DONE: the Vercel web app imports Anki packages

**The owner reported this four times and the root cause was not a missing
feature.** `src/lib/apkgWeb.ts` was already written, already correct and
already passing `check:apkg-web` — fflate for the zip, sql.js for the
collection, fzstd for v3, and it takes the real collection rather than the
decoy. **Nothing imported it.** `FlashcardsHub` still rendered a panel saying
"Importing your own .apkg is on the Android app", written back when that was
true, and `apkgWeb.ts`'s own header even says that belief was wrong.

Now wired, with `src/lib/importedDecksWeb.ts` (deck list in localStorage, cards
and media in IndexedDB — the phone's split, for the phone's reason) and
`ImportedStudyView` (same `dueQueue`/`answer`/schedule as a generated deck).

**Two production bugs found by driving it rather than reading it:**
1. sql.js fetched its WASM **over the network** in the built app. `apkgWeb.ts`
   refuses to guess that URL and says why; the hub now passes the one Vite
   emits, so 658KB of WASM ships with the app and no request leaves the origin.
2. The WASM only becomes a build asset because of the `?url` import.

`npm run check:apkg-web-import` is new and is the check that would have caught
the original bug: it serves the built `dist`, walks a first-time reader **past
the tour** to the hub, hands a real v3 package to the real file input, and
asserts on what a reader sees — ten cards not one, an answer on reveal, grading
moving on, the deck surviving a reload, deletion working. `check:apkg-web`
proved the reader; nothing drove the screen, which is exactly where this fell
through. Screenshots in `screenshots/web-anki/`.

**NOT VERIFIED, and it is the next thing to do:** whether this reached
production. The sandbox cannot reach `orbitmbbs.vercel.app` (the agent proxy
403s it) and the Vercel connector returns **no teams** for this account, so
neither route works from here. `npm run build` at the repo root is clean, which
is the strongest signal available. Somebody with the Vercel dashboard should
confirm the deploy for commit `9e77a07c` went green.

### DONE: generate-flashcards applied cards, at v15

Closed. `.agents/queue/flashcards-applied-cards-2026-09-04.md` has the full
three-attempt table. Two findings worth not re-learning: **the ordering
instruction is load-bearing** ("write the applied cards FIRST…" — removing it
dropped applied AND reasoning to zero in 2 of 3 runs), and **never name an
integer for recall** (the model satisfied it and stopped 8 cards short).
Measured live: applied 5/5/4, reasoning 5/5/4, recall 2/1/1, decks full.

### DONE: all 56 over-attached diagram plates read

48 rows corrected, `.agents/queue/diagram-overattachment-2026-09-05.md`.
Verified against the database: rows with a picture went 967 -> 922. The finding
underneath is that **the lookup was never the problem** — every stray was one
bad row, and thirty of the fifty-six plates were completely clean.

### DONE: the ads

Run 33927028250 completed **success**, 14 of 14 jobs. Release `ads-2` carries
**13 MP4s**: the three 90-second ads and ten 60-second reels, including the
three the owner asked for — `orbit-reel-guide` (mascot presents, voiced) and
`orbit-reel-functions` / `orbit-reel-one-question` (no voice, captions, black,
beat-synced). `.agents/video/BEAT-SYNC.md` now exists; the release body had
been pointing readers at a file that was not in the repo.

### The deploy incident from earlier is repaired

`generate-flashcards` is at **v15**, `verify_jwt: true`, both files diffed
byte-identical against this tree, and proved alive by a live invocation
returning 200 with real cards. The v12 placeholder is gone.

### A rule for the next courier

Verifying a deploy by diffing the read-back: extract the returned file contents
with `jq -j`, **not** `jq -r`. `-r` appends its own newline to a file that
already ends in one and reports a spurious one-line difference on every file.

## 2026-09-05 — Claude Code — the ads showed a broken app, and there were four causes

The owner watched the published reels and reported three things: a "this
diagram could not be loaded" placeholder, a white box captioned "Types of
synovial joint", and a home screen showing "Welcome to Orbit … CREATED BY
Sabharivarshan S" with **no motivational quote**. All three were real. Chasing
them found a fourth.

### 1. The hero blanks to an empty card — a real app bug, not just an ad bug

`HomeScreen`'s headline and quote are inside the slide cross-fade; the CREATED
BY chip is not. The fade started at `opacity 0`, so for its duration the hero
is a large empty card with a credit chip floating in it — **every reader, every
six seconds**. The committed `glass-home.png` the ads used is exactly that
frame. Fixed with `HERO_FADE_FLOOR = 0.35`: the same rule as "nothing scales
from 0", applied to opacity.

### 2 and 3. The two diagram screens

`screenshots/single-note-diagram.png` held the failure placeholder (the fixture
points at the plate's Supabase URL, which no sandbox can reach) and
`chapter-diagrams.png` held the harness's **drawn stand-in** — a white
rectangle with the diagram's name over "plane - hinge - pivot - saddle - ball
and socket". Both were captured by hand months ago and the ad pipeline copied
the committed files in.

Now: `fetch-plates.mjs` downloads the plates those screens name (including the
real `types_of_synovial_joints` and `tca_cycle_amphibolic_anaplerosis`), the
workflow runs **plates before screens**, `capture-screens.mjs` stages them
where Vite serves them, and the harness draws them under `?plates=real`. Both
screens are captured fresh every render.

### 4. Seven more assets were named by shots and produced by nothing

Found while checking the above. `staticFile()` on a missing file is a broken
image in a finished ad. Two were plates never downloaded
(`calots_triangle_anatomy.jpg`, `stomach_lymphatics_anatomy.jpg` — both exist
in the bucket); five were screens nothing captured.

**Preflight could not see any of them.** It read `file:` entries out of the
SCREENS registry and stopped; an asset named by an `imageName=` or
`plateImage=` prop was invisible. It scans the props now — 21 assets are named
that way.

**And 100 generated screens were committed** to `remotion-ad/public/app_screens/`
despite `.gitignore` forbidding it since it was written. That is why three
files no step produces still passed preflight: the checkout supplied them. They
are untracked now, which is what makes the capture list load-bearing.

`public/audio/` is still tracked, deliberately: preflight compares every
recorded line against the script text, so a stale clip is caught. A stale
screen is not.

### The guard that was missing everywhere

Every one of these rendered perfectly — right layout, right caption, right
section — with a stand-in, a failure or nothing at all inside. **Nothing looked
at the DOM, so nothing noticed.** `shoot.mjs` now asserts each diagram screen
decoded its plates (`naturalWidth > 0`, src under `/plates/`) and exits
non-zero otherwise.

Captures are also taken under `prefers-reduced-motion` now, which this app
supports properly and which pins every screen in its settled state. A
screenshot of a moving screen is a coin toss, and cause 1 is what losing it
costs.

### Verified by walking the graph, not by eye

All **38** assets named anywhere in the ad code are produced by fetch-plates,
capture-screens or the shooter, and the shooter really produces all 26 screens
the capture list asks for. Re-check with the node one-liner in the commit
`471eaacb` message if any of these lists change.

### Where it is

Ads re-dispatched as **ads-3** after `471eaacb`; the earlier ads-3 dispatch was
cancelled because it predated causes 2-4. A check-in is scheduled. **Preflight
has never had teeth before — this is the first run where a missing asset can
actually fail the build**, so expect it to find things.

74 app screens re-captured into `screenshots/all/`.

## 2026-09-05 — Claude Code — the captions never matched the voice, and three of the ads' four numbers were wrong

The owner watched the published `ads-3` reels and reported four things: the
mascot ad's writing is bad and ungrammatical, "what the hell is 2025" appears
in the ads, a "diagram could not be loaded" frame is *still* there, and
"nothing audio syncs with subtitles". All four were real, and none of them had
the cause the wording suggests.

### The "2025" is a count, and it was also wrong

`reelFunctions` shot 2 read **"2,025 show the years asked"**. It is the number
of questions carrying a list of years — written with a thousands separator,
beside the words "the years asked", at two seconds a shot. It reads as the
year. The same figure was in `reelRepeats` and `thePattern`.

Measuring the bank settled the rest of it. **Three of the four numbers every ad
repeats were false:**

| Claim | In the ads | Measured |
|---|---|---|
| questions in the bank | 5,545 | **5,634** |
| carrying a repeat marker | "2,025" | **3,463** (2,013 carry a year list) |
| hand-drawn plates | 915 | **250**, attached to 922 questions |

915 was `question_diagrams` rows carrying a picture — the *question* count
wearing the drawings' name. One plate answers many questions, so it overstated
the artwork by nearly four times. It was also on the outro card of every ad
(`CustomAppScreens.tsx`), next to "100% Offline", which is true of the bundled
question bank and not of the notes, the plates or Ask AI.

`preflight` now refuses any `text`, `vo` or `kicker` containing a bare
19xx/20xx or a "1,xxx"/"2,xxx". The rule is shape, not accuracy: a number
nobody can sanity-check by looking at it is a number that rots quietly.

### "Nothing syncs" was three separate bugs

1. **A voiced reel's caption was not the spoken line.** `ReelHeadline` drew
   `shot.text` while `<Audio>` played `shot.vo`, and they were written
   independently — "2,025 already asked" on screen over "Your university
   repeats its questions" in the ear. Nothing can be timed against that. The
   scripts now write the headline as a **verbatim span of the spoken line**,
   `preflight` fails a render where that stops being true, and `ReelHeadline`
   lights each word as it is said. The words still all arrive within ten
   frames: the muted cut is the one that gets watched, so the sync is carried
   by colour rather than by entrance.
2. **The karaoke caption divided each clip into equal slices per word.**
   `interpolate(frame, [2, audioFrames - 4], [0, n - 1])`. "a" and
   "twenty-five" got the same time, so the highlight drifted a word or two off
   the voice by the middle of every line, in all three long-form ads, for their
   whole ninety seconds. edge-tts already emits a WordBoundary per word;
   `synthesize.py` now keeps them and the caption highlights against them.
3. **`dynamicScriptTimings.ts` was committed and nothing regenerated it.** CI
   re-recorded every line from the current script on every run, then laid those
   new recordings out on shot boundaries measured from an older one. The shots
   run end to end, so one line that grew pushed every later shot out of step,
   and the error accumulated. Two rows had already drifted. It is generated by
   `scripts/measure-audio.mjs` now, in the same run that makes the recordings,
   and `preflight` fails when a row describes a line the script no longer has.

### The remaining "diagram could not be loaded" was in the fixture

`preview/notesSample.ts` embedded a `supabase.co/storage/...` URL. No sandbox
can reach that host and the object was gone from the bucket anyway, so
`DiagramCard` fell to its error branch. `notes-renderer.png` is captured from
that fixture, and it backs `noteHero` and `noteBody` — **every note shot in
every one of the nine ads**.

The earlier fix guarded `chapter-diagrams` and `single-note-diagram` only.
`notes-renderer` was captured with no `plates=real` and no plate assertion, so
nothing was looking. The fixture takes its picture as a parameter now, defaults
to a drawn stand-in that cannot fail, and both note captures assert a real
plate. `check:notes-schema` was *requiring* the storage URL — it was holding
the bug in place — and now forbids it.

### Publishing

Each render job uploads its own MP4 as soon as it passes its checks, instead of
thirteen renders waiting on the slowest. One failed matrix entry no longer
means nothing is published at all.

### What is not verified

No render has run. The sandbox cannot reach edge-tts or the plate bucket, so
the word timings and the ads themselves are CI's first look — and the committed
mp3s still speak the OLD lines, which is exactly what preflight now fails on.

## 2026-09-05 — Claude Code — the security advisors, and a revoke that silently did nothing

Ran the Supabase security advisors after the diagrams fix. **81 findings, 3 of
them ERROR.** All three are closed; the remaining 69 were each read and are
by design (documented in the two migration headers). Zero ERRORs now.

| Was open | Now |
|---|---|
| `handwritten_notes_pre_flowchart_backup` — RLS disabled, 11 rows, readable by anyone with the anon key | RLS on, no policy: service role only |
| `question_diagrams_fix_20260904` — same, 4 rows | RLS on, no policy |
| `weekly_leaders` — a view running with its OWNER's rights, so it returned rows the caller's RLS would refuse | `security_invoker = on` |

Neither table is referenced by either app or any edge function; they are
migration backups. Proved the fix by `set role anon` and re-counting: the
flowchart backup returns **0 of its 11 rows**.

### The lesson worth keeping: `revoke ... from anon` did nothing

The first migration revoked EXECUTE on the admin RPCs from `anon`, reported
success, and left them exactly as reachable as before. Postgres grants EXECUTE
on a new function to PUBLIC by default, and `anon` was inheriting **PUBLIC's**
grant, not one of its own:

    admin_revoke_user_access  {=X/postgres,postgres=X/postgres,authenticated=X/postgres,...}
                               ^^^ this is PUBLIC

The only reason it was caught is that the change was verified afterwards with
`has_function_privilege('anon', ...)` rather than trusted. It still answered
true. The second migration revokes from PUBLIC and grants back to
`authenticated`. **Verify a grant change by asking the database, never by the
statement succeeding.**

Also: `grant_admin_for_owner_email()` — SECURITY DEFINER, writes `user_roles` —
was exposed at `/rest/v1/rpc/`. It is a trigger function so calling it raised
rather than doing anything, but nothing that grants a role should be an HTTP
endpoint. Revoked from everyone; the trigger still fires, because Postgres
checks EXECUTE at trigger CREATE time, not at fire time.

### Two things confirmed rather than changed

* **The admin dashboard already exists in the native app** and is already
  granted. `AdminPanel` is mounted at `ProgressScreen.tsx:771`, gated by
  `useIsAdmin` -> `is_admin()`, and `sabharivarshan111@gmail.com`
  (`1c0f5bac-…`) holds the `admin` role in `user_roles`. Every `admin_*`
  function self-gates too — checked each body.
* **The Supabase half of Google Sign-In is working**: 323 google identities,
  most recent 2026-09-04. The owner's own account has a google identity. The
  only gap is the three Android OAuth clients in Google Cloud, which is
  `oauth-sha1-deployment` in blocked.json and is the owner's to do.

## 2026-09-05 — Claude Code — first run asks, an old build learns about a new one, and two XP bugs

Nine things from the owner's list. The two worth reading about are the ones
that were each a single symptom hiding two different bugs.

### "If I untap any question it shows as XP gained" was two bugs

**Web.** `use-xp-stream` takes an XP number from three places and they count
different populations: `cloudXp` and the realtime `profiles` row are the
server's count for the ACCOUNT (`profiles.xp` is `COUNT(*) FROM
question_progress WHERE user_id` — global), while `readLocalXp()` counts the
`question-` keys in THIS BROWSER. Sign in on a second browser and the two are
300 and 4. All three handlers wrote into one `prevXp` ref, so un-ticking ran
the local one first (4 → 3, no toast, ref := 3) and then the realtime one read
299 against a baseline of 3 and toasted **"+296 XP"**. One baseline per source
now; realtime shares the cloud's because it *is* `profiles.xp`.

**Native.** `pullProgressFromCloud` merges and never deletes — correct, a tick
from another device has to arrive — but a row un-ticked HERE comes back if
`record_question_undone` never landed, and that RPC returns silently with no
session, no profile year, or offline. `XpToast` reads the rise as a tick.
`pendingUndo` parks the id until the server confirms the delete; the pull skips
a parked id **and retries its undo**, and the push filters them or the two
fight every launch.

### The year was never asked for

Onboarding lived only on My Progress, behind a tab. A fresh install opened on
Home having been asked nothing, and `useProfile` falls back to `'second'` — so
a first year got second year's bank with the chip agreeing. `FirstRun` is now a
gate at the app root (icon, "Welcome to Orbit", "Made by the community",
optional Google, name, and four years with **none** pre-selected).

`readLocalProfile` also stopped coercing an unreadable year to `'second'`,
which silently turned a stored `'third-year'` into second year.

### Traps hit on the way, worth not hitting again

* **`state={{ disabled: true }}` on a `Touchable` really disables it** —
  `isDisabled = disabled || state?.disabled` feeds the Pressable. A button that
  is meant to stay pressable and explain what is missing must not use it.
* **The workflow's release notes had `versionCode 14` typed into them** and
  stayed 14 through the bump to 15, so a correct v15 build told the owner it
  was the number Play rejected. Read from gradle now — and the step's path is
  relative to `mobile`, because the job sets `defaults.run.working-directory`.
  Getting that wrong fails **after** a 19-minute build has succeeded.
* **`revoke ... from public` on a new function does not stick.** Supabase's
  template grants EXECUTE to `anon` by name. Second time on this project.
  Proved with `has_function_privilege` afterwards, which is the only way to
  know.
* **The repo's copy of `razorpay-verify-payment` was three plans behind the
  deployed one.** Reading it would have said a 6-month purchase grants a month.
  Synced, and `check:payments` now pins the tiers from both sides.
* **A mouse drag is not a touch drag.** The subject-card reorder test used
  `page.mouse` and had been failing for weeks while the gesture worked by hand.
  And a step that failed inside home's edit mode left `ReorderLock` on, so the
  year-picker step after it timed out on a control that was present, visible
  and deliberately unresponsive — one broken step reporting as two.

### Open

* `app_releases` has rows for 13 (live) and 15 (`live_on_play` **false**). The
  update prompt stays silent until somebody sets that true, which is right —
  set it when the listing actually serves v15, not when the build lands.
* The search-result triple tap is correct in the repo and has been since
  2026-09-01. Play is on versionCode 13, so what the owner is running predates
  it; shipping v15 is the fix, and there is now a smoke step so it cannot
  regress.
* `.agents/queue/play-billing-migration.md` — what moving off Razorpay
  involves. Not optional; about a working week; none of it doable from a
  sandbox.

## 2026-09-06 — Claude Code — Play's own update API, a green smoke suite, and v15 built

Picks up from the 2026-09-05 entry above. **v15 is built and signed and has not
been uploaded yet** — that is where this stopped.

### The update prompt is Google Play's now, not a row in our table

Yesterday's entry describes an `app_releases` table with a `live_on_play`
boolean. **That flag is gone**, and so is `mandatory`. Do not add them back.

The flag was a person promising, by hand, that the Play listing had caught up
with an upload. A row appears the moment a build is cut — days before Play
serves it — and it failed in both directions: set late and nobody hears about
the update, set early and every phone is sent to a listing still showing the
version it is running.

`com.google.android.play:app-update:2.1.0`, wrapped as the **`OrbitUpdate`
TurboModule** (`src/native/NativeOrbitUpdate.ts`, `UpdateModule.kt`,
`UpdatePackage.kt`, registered in `MainApplication.kt`). Play knows the answer
for a given reader on their track without being told.

**The table survives for the one thing Play cannot do: it hands no release
notes to a client, in any shape.** `app_releases` is now a lookup by the
versionCode Play names, holding the words for the update card and the what's-new
card. A version with no row still prompts, without a list.

Flexible, never immediate by default. Immediate takes the screen and will not
give it back — for a question bank that is a student locked out the evening
before an exam. It is reached only at Play priority >= 4, which nothing sets.
`check:native-update` fails if that flips.

**None of it can be exercised here.** Play reports no update for a build it did
not install — every APK from CI, every debug build, and the preview where the
module is absent. So "no card" and "completely broken" look identical, which is
the sound module's failure exactly. The check asserts the four TurboModule
pieces, the Gradle dependency, flexible-by-default, the install stage, a
dismissable dialog, and that the preview shim reports the module ABSENT rather
than faking one. First real proof is **internal app sharing on a phone**.

### The smoke suite is green — 120 pass, 0 fail — and four "failures" were the test

It had been 110/5 and every one of the five was the test accusing the app.
Worth knowing because the same shapes will recur:

* **A stale string is worth three red steps.** The attach chooser was reworded
  in August (1fdbf17c). `check:note-media` and three smoke steps still asserted
  the old sentences — including the sheet TITLE, which is the first assertion,
  so the step died four seconds in and left its sheet open. The two steps after
  it then timed out at thirty seconds each against that scrim. One sentence,
  three broken flows, two of them entirely healthy.
* **A selector for a control that does not exist accuses the app.** The
  search-result note step looked for `[aria-label*="Regenerate"]`. There is no
  such label — `SingleQuestionNote` says "Write this note again from the top" —
  so it reported "no handwritten note opened" about a note that had opened.
* **Wrong labels can make an assertion pass while testing nothing.** The
  first-run step checked `aria-checked` on "First Year"/"Third Year". The labels
  are "1st Year"/"3rd Year", so it matched no elements and concluded nothing was
  pre-selected. It now counts the four cards before asking which is checked.
* **A mouse drag is not a touch drag.** The subject-card reorder used
  `page.mouse` while `dragArm` reads touch; it had been failing for weeks while
  the gesture worked by hand. And that step throwing left home in edit mode, so
  the year-picker step after it timed out on a control that was present and
  deliberately unresponsive — `ReorderLock`. One broken step, two red.

`finishRearrangingIfOpen()` is now part of every step's cleanup, alongside
closing a sheet and a modal, for the same reason those are.

### Three new checks, and why each exists

| Check | Catches |
|---|---|
| `check:version` | `build.gradle` and `src/lib/appVersion.ts` disagreeing, and PLAY_PACKAGE not matching the applicationId |
| `check:preview-parity` | a root overlay in `App.tsx` that was never mounted in `preview/main.tsx` — it caught `FirstRun`, absent from every screenshot and smoke run |
| `check:native-update` | the four TurboModule pieces, flexible-by-default, the install stage, and a preview shim that admits the module is absent |

All three run in the Checks step of all three Android workflows.

**Two of `check:native-update`'s assertions passed on deliberately broken files
before I caught it**, both the same way: the doc comment explaining a rule
contains the words the check greps for, so the prose satisfied the check for the
rule. Both now read comment-stripped source. `native-sound-check.mjs` documents
this trap in its header and I still wrote it wrong twice.

### 14 is live on Play, not 13

Corrected by the owner from their own console. Four files said 13 and
`app_releases` had 13 flagged live. The error came from one refused upload of 14
being written down as "14 was rejected, 13 is live" and never re-checked. **A
refused upload is not proof of what the listing serves.**

### New: the Play Console form is part of the release

`.agents/rules/41-play-release-notes.md` and
`.claude/skills/play-release-notes/`. A build is not delivered until the owner
has the Release name and Release notes pasted in the chat — they upload from a
phone, and v15 was built, signed and linked before anyone noticed nobody had
written them. Covers the 500-char cap and the two things that may never appear:
a Razorpay price (Play requires Play Billing for digital goods, and the notes
are where a reviewer looks) and anything that has never worked once.

### Where it stands

* **Release 192** — `.aab` and `.apk` published, versionCode 15, built from
  `ee3ffcec` which has the Play update API. Not uploaded.
* The owner was mid-upload in the Play Console when this session ended.
* `live_on_play` no longer exists, so **nothing needs flipping after upload**.
  That was the whole point of the change.

## 2026-09-06 — Claude Code — Play Billing, built and switched off

Picks up from the entry above (Play's update API, green smoke, v15 built). Two
things happened since: **v16 was built and is signed** (release run 193, AD_ID
declared in the manifest), and **Google Play Billing was built end to end**.

### v16

`release-193` on GitHub carries `app-release.aab` and `app-release.apk` for
versionCode 16 / 0.0.0.16. It contains the Play in-app update API — so once 16
is live on Play, a phone on 16 gets the update card for 17 without anything
being flipped by hand.

**The AD_ID rejection has two halves and only one was code.** The manifest half
is done. The other half is the **Advertising ID declaration form** in Play
Console → Policy → App content, which is the owner's, and the owner reports it
still showing "You can't rollout releases with artifacts targeting Android 13
until you have completed this declaration" with the Save button greyed out. The
answers are correct on screen (Yes; Advertising or marketing; "turn off release
errors" left UNTICKED, which is right now that the permission is really there).
Greyed Save means the form is not dirty — changing any answer and changing it
back re-enables Save and re-submits the declaration. **Do not tick "turn off
release errors":** that declares the app ships WITHOUT the permission, which is
no longer true, and it would be trading targeted ad revenue for a form that goes
away.

### Play Billing

`.agents/rules/42-play-billing.md` is the rule; `mobile/PLAY-BILLING-SETUP.md`
is the owner's eight steps; `.agents/queue/play-billing-migration.md` is the
status page it used to be a proposal in.

**It is off.** `PLAY_BILLING_ENABLED = false` and Razorpay is still what ships.
`check:billing` FAILS if that flag is true — that is deliberate, not a bug to
work around: this path has never taken a real payment, and the flag is flipped
after a licence tester has bought each of the five products on a phone.

What was built, all committed and all green under `check:billing`:

* `OrbitBilling` TurboModule — spec, `BillingModule.kt`, `BillingPackage.kt`,
  registered in `MainApplication.kt`, `com.android.billingclient:billing:9.1.0`.
  Hand-written because `react-native-iap` was archived in April 2026 and its
  successor is an Expo module.
* `mobile/src/lib/playBilling.ts` — the one door to the module and to the
  verification function.
* `supabase/functions/play-verify-purchase/` and `supabase/functions/play-rtdn/`
  — **both deployed to production** (project `pmtgeydtqypwrypshhsx`).
* `premium_subscriptions` grew `source`, `play_purchase_token` (UNIQUE),
  `play_product_id`, `play_order_id`, `play_state`, `auto_renewing` —
  **applied to production**. Play rows land in the SAME table Razorpay writes,
  so no reader of the entitlement changed.

**Neither function has been invoked.** This sandbox's proxy refuses
`pmtgeydtqypwrypshhsx.supabase.co` outright (`Host not in allowlist`), so the
deploy succeeded and nothing beyond that was exercised. Both return 500 with
"PLAY_SERVICE_ACCOUNT_JSON is not set on this project" until the owner does
step 3, which is the correct failure.

The five things `check:billing` catches were each verified by breaking the repo
on purpose and watching it fail: the flag flipped on, a price written into the
client, the client and server disagreeing about base plans, the two
`googlePlayAuth.ts` copies drifting, and acknowledgement moved before the grant.

### The one non-obvious thing in there

**A subscription keeps ONE purchase token for its whole life.** Every renewal
reports the same token, which is why the row is upserted on
`play_purchase_token` rather than inserted, and why `restore()` can safely post
every token Play knows about on every launch. The unique index had to be made
non-partial for that: `ON CONFLICT` cannot infer a partial index and PostgREST
has nowhere to put its WHERE clause. Migration `20260906020100` is that fix and
explains itself.

## 2026-09-06 — Claude Code — pinch-to-zoom on every picture, and v17

### Two bugs, both of which looked like features that were merely absent

**The lightbox never zoomed on Android.** `DiagramCard` opened a full-screen
`<ScrollView maximumZoomScale={3} minimumZoomScale={1} centerContent>` — and
all three of those props are **iOS-only**. On Android, the only platform this
app ships to, they are silently ignored. The code read as a zoomable lightbox,
reviewed as one, and had been a static picture on every phone that ever ran it.

`components/ZoomableImage.tsx` is the replacement: a hand-written PanResponder
pinch (two touches is a distance and a midpoint), one-finger pan, double-tap to
zoom towards the tap, bounds computed from the **drawn** picture rather than the
window, and an elastic under-1 pinch that springs back. No new dependency —
`react-native-gesture-handler` is not installed and pinch is the only thing that
would justify it, and there is nothing to arbitrate with inside a `<Modal>`.

`TappableImage` is the wrapper that makes a picture one tap from full screen.
Wired into: the triple-tap / handwritten-notes diagram (`DiagramCard`),
flashcard and imported-Anki card faces on both sides (`FlashcardsScreen`), a
note's attached pictures and its handwritten pages (`ProgressNotesTab`, via
`InkedImage zoomable`). `InkedImage`'s SVG was extracted as `Ink` so the viewer
draws **the same** marks over the same picture rather than a second copy that
could sit a few pixels off.

**Replaying a chapter from Settings replayed the farewell instead.**
`farewell` is local state in `TourOverlay`, which is mounted for the life of the
app, and nothing reset it when the tour ended. So after one press of Skip, every
later `startTour(chapter)` rendered `SKIP_FAREWELL` over step one: tapping
"Focus timer" showed "It lives in here" pointing at the Settings button the
reader had just used, and the chapter never played. Reset on `index === null`.

### Both were proved by breaking them, not by reasoning

The full smoke suite is very slow under this sandbox's throttled clock, so each
flow was also driven on its own through a temporary harness (deleted):

* Walkthrough replay, fix reverted: `FAIL: replaying a chapter showed the skip
  farewell again — the chapter never played`. Fix restored: `PASS`.
* The picture viewer opens on a tap, says how to use it, and closes —
  screenshotted at `/tmp/viewer-open.png` before the harness was removed.

Both are now steps in `preview/smoke.mjs`: *'a chapter replayed from Settings
plays the chapter, not the farewell'* and *'a picture in a note opens full
screen'*.

**The pinch itself is not proved anywhere.** It is a two-finger gesture against
a PanResponder; a browser standing in for that would be a test agreeing with its
own assumptions. First real proof is a phone.

The viewer step drives a **note's** picture rather than the diagram card,
because the note's is a data URI that loads in a browser while the card's comes
from Supabase Storage, which the sandbox cannot reach — and the card correctly
disables Enlarge while its picture has failed to load.

### v17

versionCode 17 / 0.0.0.17 in `build.gradle` and `appVersion.ts`, with an
`app_releases` row. **v16 never reached a reader** — Play blocked it on the
Advertising ID declaration — so from a phone on 14, v17 is the update carrying
everything since 14, and its notes say so.

### The AD_ID error is NOT the manifest, and that is now measured

The v16 `.aab` from GitHub release `release-193` was downloaded and unzipped:
`com.google.android.gms.permission.AD_ID` appears in
`base/manifest/AndroidManifest.xml`. The manifest half has been correct since
commit `0ef51eec`.

What is still outstanding is the **Advertising ID declaration form** in Play
Console (Policy → App content → Advertising ID) and the other **active
artifacts** in the release. Play's wording is "a manifest file in one of your
**active artifacts**", and v14 and v15 predate the fix — so a release that
retains one of them still errors however correct the new bundle is.

**Never tick "I understand the ramifications… turn off release errors".** That
declares the app ships WITHOUT the permission, which is no longer true, and it
trades targeted-ad revenue for making a form go away.

## 2026-09-10 — Claude Code — Razorpay is out of the app, and v18

The app owner's decision, and the right one: **billing for in-app digital
content outside Google Play Billing is grounds for removal of the app.** Ad-free
and the notes unlocks are both digital content consumed in the app. ₹50 is not
worth the listing, the reviews and the install base.

### What was removed

Deleted outright rather than switched off — a payment SDK that is merely
unreferenced is one import away from being live again, and it is a native
module and bytes in a shipped APK for nothing:

* `mobile/src/lib/razorpay.ts`
* `mobile/src/types/react-native-razorpay.d.ts`
* `mobile/preview/shims/razorpay.ts` and its Vite alias and tsconfig path
* the `react-native-razorpay` dependency

`DailyAdConsent` was the app's ONLY purchase entry point, and it now shows a
locked "Ad-free is coming soon — we are moving payments to Google Play. Nothing
is for sale in the app until that is ready." A dialog that silently loses its
offer reads as a bug, so it says why.

### What was deliberately NOT removed

**The entitlement.** `premium.ts`, `premium_subscriptions` and the admin
panel's purchase history are untouched, so anyone who paid through Razorpay
keeps their ad-free until it expires. `isPremiumCached()` still hides the
locked card from them.

An entitlement is orphaned by deleting the thing that READS it, not the thing
that sold it. `check:billing`'s old section 8 said the opposite — "leave
razorpay.ts for one release after Play Billing goes live" — and that reasoning
was wrong; it has been replaced and the correction is written into the file.

### Play Billing stays off

`PLAY_BILLING_ENABLED = false`, which is what the owner asked for: the backend
exists, and it must not work, because no Play Console product exists and no
card has been set up. `check:billing` fails if that flag is ever true.
**So the app currently sells nothing at all, on purpose.**

### `check:payments` was inverted

It used to guard the Razorpay flow (price on the server, HMAC verified before a
row). It now enforces that flow's absence, which is a stronger rule. Verified
by breaking the repo four ways and watching each fail: the dependency coming
back, a file importing the SDK, `PLAY_BILLING_ENABLED` flipped true, and the
"coming soon" explanation being dropped.

Screenshotted the shipped dialog by forcing `ADS_ENABLED` true for one run —
the prompt is unreachable in the preview otherwise, because `requestDailyAd`
returns early when ads are off. The gate was restored immediately after.

### v18

versionCode 18 / 0.0.0.18, with its `app_releases` row saying plainly that
ad-free is not for sale for now and that existing purchases are unaffected.

### One pre-existing failure, not caused by this

`npm run check:music` times out waiting for "Show the music player" to become
stable. **It fails on a clean tree too** — confirmed by stashing this work and
re-running. It looks like Playwright's stability wait never settling under this
sandbox's heavily throttled clock rather than an app fault, but it has not been
run to ground.

## 2026-09-10 — Claude Code — four reported layout bugs, and the card cap

All four came with screenshots, and three of them were the same class of
mistake: a fixed size meeting a string nobody measured.

### The topic header was clipped at BOTH ends

`GradientText` draws SVG text, and **SVG text does not wrap and does not
shrink**. At a fixed 24px, "Obstetrics & Gynaecology" is wider than the header,
and because it is centred it overflowed both edges — the first letter under the
back button, the last off the right of the screen. It read as broken text and
was drawn exactly as asked.

`width: '100%'` on the wrapper is why no layout check ever saw it: the wrapper
was always the right size, and only the glyphs overflowed.

It now measures its box and steps the size down; `textLength` with
`lengthAdjust="spacing"` is a last resort once the size has bottomed out, and
**only then** — the first attempt applied it whenever the title did not fit at
full size, which stretched an already-shrunk title back out to the full width
of the header. Caught by measuring, not by reading.

**The browser cannot reproduce the original clipping** — Chrome's fallback font
is narrower than the phone's Roboto, so it fit there before and after. The
shrink is driven by character count rather than font metrics, so it applies the
same on a device; the phone is still the real proof.

### The My Progress subject row sat crooked

"General Surgery and Orthopaedics" is the only subject long enough to wrap
there, and `subjectTop` centred its two children — so on that one row the `0%`
dropped half a line below where it sits on every other row. Measured: the
name-to-percent offsets were `2, 12, 2, 2` and are now `0, 0, 0, 0`.

### Home's subject tiles

Names now get a fixed two-line box, so a one-line name starts at the same
height as the two-line name beside it (measured: an 18px spread, now 0), and
names over twenty characters spend their letter-spacing to stay inside two
lines. **My first hypothesis here was wrong** and my own probe disproved it: I
measured "% Complete", which is bottom-anchored and was already aligned. The
names were the ragged part.

### 50 new cards a day was sized for the wrong deck

`NEW_PER_DAY_MAX` was reasoned from `MAX_DECK_CARDS` — the biggest deck the
generator builds. That was true of a generated deck and false from the day Anki
import shipped: a shared `.apkg` is two or three thousand cards, and fifty a
day means meeting the last of them next year. Now 200, with detents at 20/50/100
so a forty-step slider still lands on the round numbers.

### Spaced revision moved above the tabs

Asked for, and the right shape: what is due today does not belong to one tab's
worth of the screen. It was below the year ring inside Stats, so a reader on
Calendar or heading to Notes never saw that anything was due.

### Still open from the same message

Not started: the chat mascot reacting to right/wrong MCQ answers; the first
generated Anki deck not reaching Supabase; a YouTube link and player in notes;
linked note files not playing; the Anki/attendance/feature ad scripts; verifying
the "studying now" count; the Liquid Glass audit and the black circle behind the
music player; and the Calendar → attendance tracker rebuild with a bunk
calculator (reference: AlphaLearn's "Smart Bunk Calculator" — Theory and
Postings tracked separately).

## 2026-09-10 (later) — Claude Code — attendance, a reactive mascot, and a dead deck parser

### Attendance replaced the Calendar tab

`src/lib/attendance.ts` + `components/AttendanceTab.tsx`, Theory and Clinical
postings as two lists. Local only, in `check:cloud-ids`' LOCAL_ONLY list — a
record of which days somebody turned up is a record of their movements.

`npm run check:attendance` walks eighteen worked examples. **Floor, never
round**: four of five is 80%, above the 75 line, and yet nothing is spare
(4/0.75 = 5.33 → 5, which is the five already held). Verified by switching it
to round and watching that example fail. Two more breakages caught: dropping
the rotation cap, and unclamping `attended` from `held`.

`ProgressCalendarTab` and `useCalendarEvents` are deleted.

### The bot reacts

New `dismay` state — **deliberately not `exclaim`**, which means the app
failed. A wrong answer is not a failure of the app or of the reader, and
reusing the alarmed face would teach that getting one wrong is the same event
as the app breaking.

`McqCard` gained `onAnswer`; `AskAiScreen` turns it into a transient face and
the avatar is now tappable. Poking it alternates wide/wink and it gets fed up
on the fourth in a run. Driven in the harness: wrong → `dismay`, right →
`wink`, four pokes → `["wide","wink","wide","dismay"]`.

### generate-flashcards has been throwing since August, and nobody could see it

**This is the big one.** `flashcards` has four rows, none newer than 27 August,
while the logs show decks being generated all day. Every run dies in
`parseJson` with `Unexpected non-whitespace character after JSON at position
6975`, which is long before the upsert — so readers pay the full Gemini cost on
every open and get an error.

The `[flashcards] subject=…` line that reads like a success is at line 749 and
`callGemini` is at 836. **It is a pre-flight log.** That is why the feature
looked alive in the logs while the table stood still, and it is worth
remembering the next time a log seems to prove something.

Fixed with `extractJson` — outermost bracket pair, scanned with string/escape
tracking — which is what `parseMcqs` has done in the client since day one.
Eight shapes checked; the shipped parser fails six.

**It is committed and NOT deployed.** Queued as `sb-flashcards-json-parse`.
The sandbox cannot reach Supabase, and the MCP connector takes each file's full
text as a parameter — `index.ts` is 43 KB, and retyping that has one silent typo
between it and breaking the flagship feature for everyone. So
`.github/workflows/supabase-deploy-functions.yml` now deploys from the repo
instead. **It cannot be dispatched until it is on `main`**: GitHub only
registers `workflow_dispatch` from the default branch. That is the only thing
standing between the fix and production.

### Still not started

YouTube links and an inline player in notes; linked note files not playing;
verifying the "studying now" count; the Liquid Glass audit and the black circle
behind the music player; and the ad scripts.

### YouTube links in notes, and the linked-file bug underneath them

**`kindOf` trusted the MIME type and nothing else.** A LINKED file is described
by whatever provider the reader picked it from, and plenty report
`application/octet-stream` for an ordinary `.m4a`, `.mp4` or `.pdf` — so the
kind fell through to `'file'`, the reader drew a plain row with a name and a
"tap to save a copy" footer, and no player at all. Reported as "if I link any
file it doesn't show or play anything".

`music.ts` already carries this exact lesson — *"the MIME type is a hint and the
extension is the second opinion"* — and it had never been applied here. The
extension is consulted **only** when the MIME says nothing (`''`,
`application/octet-stream`), so a provider that does know stays authoritative.

**Links are a new kind of attachment**, not a third mode of "Add file": a file
is bytes to copy or point at, a link is a URL, and the copy/link question makes
no sense for one. `lib/noteLinks.ts` + `components/NoteLinkCard.tsx`.

`react-native-webview` is a **real new dependency** and the only one this
needed. It is not optional: putting a YouTube video into the ExoPlayer already
in the APK means extracting the stream, which breaches YouTube's terms. The
IFrame player is the sanctioned route and it needs a browser.

Three things worth keeping:

* **The still comes first and the WebView mounts on tap.** A note with four
  lectures would otherwise mount four browsers on open. It also means the
  reader decides when anything reaches YouTube at all.
* **`youtube-nocookie.com`**, and no fetch anywhere — the thumbnail is a static
  URL, so nothing tells YouTube which videos a student is studying from beyond
  the images requested.
* **`hqdefault`, never `maxresdefault`** — the latter is missing for a great
  many older videos, which is exactly the lectures students get sent.

`npm run check:note-links` covers the six YouTube URL shapes, four look-alikes
that must NOT match, `javascript:`/`file:` being refused, and timestamps. Its
first version passed for the wrong reason: the "nothing is fetched" assertion
matched this file's own comment saying "no fetch, no oEmbed lookup". Stripped
comments, same as `check:native-update` had to.

### The black circle in the music player

Reported as "what the fuck is black circle behind music player". It is the
transport's own play button with no track loaded: it filled with
`withAlpha(colors.text, 0.12)` and kept `colors.primaryText` for the icon —
on a dark theme, a near-black disc with a black triangle on it, sitting between
two outlined circles. The play mark was invisible inside its own button.

The rule it broke is one the theme already states: **`primaryText` is the ink
for `primary`**, and painting it on anything else is a pairing nobody checked.
The two states are now two controls rather than one control with a swapped
background — filled and legible when there is something to play, the same glass
circle as its neighbours when there is not. A filled button that does nothing is
also a lie about what it will do.

`check:glass-radius` caught the first attempt: `styles.playControl` already
carried `borderRadius: 22` and I passed the prop as well. A glass surface draws
its fill, rim, counter-rim and shader on ONE curve, and two copies of the number
is how a corner ends up looking cut. Separate style for the glass variant.

**The wider Liquid Glass audit is NOT done** — that is the rest of what was
asked ("read articles and open-source projects, fix it if our implementation is
shit"), and it is a bigger piece than one control.

### Two checks fail on a clean tree, and both look like the harness

`check:music` and `check:page-refs` both time out waiting for a control to
become "visible, enabled and stable". Confirmed by stashing all work and
re-running: they fail without any of it. It looks like Playwright's stability
wait never settling against the app's continuous animations (the subject-card
foil, the gradient heading) under this sandbox's heavily throttled clock —
`force: true` is what every probe written today needed. Not run to ground.

### The Supabase connector expired mid-session

Token expired while verifying the presence table, so the "studying now" count
could NOT be checked against live data and the `generate-flashcards` deploy
could not be attempted through the connector either. Both need it back.

---

## 2026-09-11 — Claude Code — glass where the surfaces actually are, the unlock link, attendance working days

Eleven changes landed on `main` this session, each as its own PR because a
direct push is blocked on this branch. What follows is the part worth reading
before touching any of it again.

### The Liquid Glass audit was looking at the wrong file

The owner's verdict on the screenshots was blunt and correct: it did not look
like Apple's material. I had spent the audit inside `GlassSurface.tsx`,
improving a component that **is rendered in ten places**, while **98 surfaces
hand-roll `colors.card` and `colors.border` directly**. Every fix I made was
real and reached almost nothing.

The fix that mattered was three lines in `theme/presets.ts`: under the glass
material, `cardElevated` lifts 0.14 towards the text instead of 0.08 and
`border` lifts 0.42 instead of 0.18. A palette reaches every surface in the app
whether or not that surface knows what material it is. **Audit where a thing is
used before auditing how it is drawn** — that is the whole lesson, and it cost
most of a session.

Four real shader bugs were also fixed in `GlassView.kt`, and one of them was
mine: `Shader.FILTER_MODE_LINEAR` does not exist, the constant is on
`BitmapShader`, and it failed all three Android builds. `check:glass-shader`
now pins it — with comments stripped, because my own warning comment about the
constant matched the assertion looking for it.

### The wallpaper is Home-only on purpose

I read the single mount point as a bug and was ready to fix it. It is the
owner's decision: a wallpaper behind the question bank "coz distraction". The
reasoning is now a long comment at the top of `WallpaperBackground.tsx` so the
next reader does not re-open it.

### Ad-free is bought on a website now

`lib/unlock.ts`, `components/UnlockCard.tsx`. The Play Billing button is gone;
the card links out to `mbbsqbank-questor.lovable.app/unlock` and the app only
**honours** an entitlement it reads back. Nothing is priced, granted or
acknowledged on the client, which is what `check:billing` and `check:payments`
hold.

This was researched badly first and then properly, and the difference matters:
Google's **external payment links programme is Japan only**. India has *user
choice billing*, which is a different thing — an alternative processor shown
**beside** Play's, not a link out of the app. The "India by September 2027"
date I first gave was not in any primary source I could reach. What settled it
for the owner was a competitor doing exactly this and still being listed. That
is evidence about enforcement, **not** a reading of the policy, and the file
says so in both directions rather than pretending the risk is zero.

### Attendance counts working days

Taken from the competitor's tracker the owner sent — one idea, not the screen:
*holidays reduce total working days count*. `remaining` was
`totalDays - held`, so a 28-day block from a Monday claimed **eight days left
where four is right**, and the "how many can I still miss" cap reads straight
off that number. `workingDays()` counts Sundays rather than dividing by seven,
because a 28-day block holds four or five depending on the weekday it starts.
`dayOfRotation()` answers "Day 5 of 24" off the calendar, so it survives a week
of not marking anything. The toggle is **off by default**: plenty of postings
run through the weekend.

Deliberately not taken: Timetable, Calendar tab, Logbook, semester filter. The
Calendar tab was *replaced* by this feature; bringing it back undoes a decision.

### One invented column gated an entire queue

`sb-release-18` carried `insert into app_releases (..., live_on_play, ...)`.
There is no such column — it was removed when the update prompt started asking
Google Play directly, which is a better design for the reason
`lib/appUpdate.ts` explains at length. The insert died `42703`, and because the
queue step exits 1 on any failed job, **one wrong column name would have gated
every job queued behind it**. `CLAUDE.md` and `40-releases.md` both still told
you to set that flag, which is where I got it from. Both corrected.

That rules file sits *hard* against Antigravity's 12,000-char cap and was
already 54 over at HEAD, so `check:agent-docs` was failing before I touched it.
Its own last section warns that adding a paragraph to it breaks the APK. If you
add to it, take something out.

### versionCode: ask the console, twice bitten

**17 is what Play serves; the repo carries 18 and is pinned there** until the
owner uploads. The repo had drifted to 23 because CI built 19-23 and none was
ever uploaded. A green build is not a published one and the repo cannot tell
the difference. This is the second time this number has been wrong in the same
way.

### Where things stand

* All nine workflows are on `main`. `supabase-tasks` is green with zero pending
  jobs. `ad-videos` run 16 finished green (45 videos); `ads-5` was dispatched
  after the attendance reel's copy changed.
* The `app_releases` row for 18 carries **17 notes** — the union of the drafts
  written for 18, 19 and 20, since those were cumulative and only one is being
  uploaded.
* **The Patient Simulator must stay out of the native app** until the owner
  says otherwise. `scripts/no-simulator-check.mjs` holds that, wired into all
  three Android workflows.
* The OpenAI key from commit `f50c8e8` is still live. **Only the owner can
  revoke it** — never hand an agent a login there.

---

## 2026-09-16 — Antigravity — Release v21: monthly vs overall attendance, theory total classes, clinical holiday calendar, 50k anki, ads fix

**DONE**
- **Rewarded Ads Only**: Verified AdMob configuration uses strictly `RewardedAd` (`ca-app-pub-3177287525203129/6765465304`). Decoupled GDPR consent with 3.5s timeout race; `showRewardedAd()` awaits loaded ad up to 8s; daily cooldown slot preserved on playback failure.
- **Theory Attendance Overhaul**:
  - Medical college 1-hour lecture alignment: removed "+2" 2-hour block buttons.
  - Total planned classes: configurable during Add Subject and via quick preset chips (`[60] [80] [100] [120] [150]`) on subject cards. Drives live "remaining classes" and target calculations.
  - Monthly vs Overall Attendance: added monthly bucket storage (`monthly[YYYY-MM]`) to `mobile/src/lib/attendance.ts`. UI displays dual percentage badges (`OVERALL: 86%` and `SEP: 88%`) and distinct subtitle counters per subject, plus month vs overall projection in the Bunk & Target Simulator.
- **Clinical Postings Attendance**:
  - Interactive rotation calendar with weekday headers (Mon-Sun), official gazetted holidays, and tap-to-toggle rain/event holidays that dynamically reduce working days.
- **Anki Deck Import**:
  - Increased limit to 50,000 cards using chunked SQLite storage (`setMany`, `getMany`, `removeMany`) at 250 cards/chunk.
- **Browse & Media Fixes**:
  - Always-visible search bar in leaf question screen.
  - InkedImage and PDF modal white backing prevents black screen rendering.
- **Version 21 Bump**:
  - Bumped to `versionCode: 21` / `versionName: "0.0.0.21"` in `mobile/android/app/build.gradle`, `appVersion.ts`, and `version-check.mjs`.
  - Supabase `app_releases` table row 21 created with full changelog.
  - Verified via `npm run check:version`, `npm run check:attendance` (all 18 worked examples pass), and `npm run typecheck`.

**NEXT**
- Monitor GitHub Actions release workflow for `main` build cutting production APK/AAB for versionCode 21.

**DO NOT**
- Do not re-add 2-hour theory block buttons; MBBS lectures in Indian medical colleges are scheduled strictly in 1-hour slots.
- Do not modify `attendance.ts` above the `// ------` storage line without checking `scripts/attendance-check.mjs` regex stripper.


---

## 2026-09-18 — Claude Code — 40 case sheets, the general examination in photographs, the rewarded ad, and 39 broken pictures

**DONE**

### 39 diagrams were pointing at files that did not exist

25 plates behind 39 `question_diagrams` rows carried a `public_url` for a file
the `diagrams` bucket did not hold. Every one of the files was already in
`public/diagrams/` in this repo.

The cause is structural and will recur unless the shape is understood: writing
a row and uploading the plate go by **two different routes, and only one works
from a sandbox**. The Supabase MCP connector hands an agent SQL; the egress
gateway answers 403 to the CONNECT for the project host before any credential
is offered, so nobody can PUT a JPEG from here. A session generates a plate,
commits it, writes the row with the URL it is *going* to have — and the upload
never happens.

`supabase-tasks.yml` grew a step that uploads any plate in `public/diagrams/`
the bucket lacks. Generic rather than a list of paths, idempotent, POSTs rather
than PUTs so the no-overwrite rule is the server's too, and it prints the
referenced-but-missing table whether or not it uploads anything. **Run it after
any session that adds plates.** Verified: 310 → 351 objects, and the
referenced-but-missing count went 25 → **0**.

A missing row shows nothing, which is the designed answer. A row pointing at
nothing shows a failure. Those are not the same bug.

### The rewarded ad did not play when the reader tapped OK

Reported as "ads not playing immediately or after sometime only playing". Four
defects in `lib/ads.ts`, each of which typechecks, lints and bundles:

1. Readiness was a module-level `rewardedLoaded` boolean beside a module-level
   `rewarded` instance, and the two could describe **different ads**.
   `showRewardedAd` replaced the instance mid-preload; the orphan's LOADED
   listener then set the flag, so the flag said "ready" about an ad nobody held.
2. A failed preload was **never retried** — one transient failure at launch and
   the whole session paid a cold load on every tap.
3. The 8s wait **tore down the LOADED listener**, so an ad arriving at 8.1s was
   discarded *and* the module still believed none existed. Slow for ever.
4. The first preload raced the consent flow and nothing re-preloaded after it.

The loaded ad is held **by identity** now (`readyAd` / `pendingAd`), there is a
bounded retry (5s, 20s, 60s), the late arrival becomes the next preload, and
consent stays decoupled behind its 3.5s race — it is simply asked again
afterwards. `npm run check:ads` pins all of it and says plainly that it reads
the source, because nothing in a sandbox can reach AdMob.

### The general examination now shows a photograph of every sign

`lib/generalExamSigns.ts` (19 signs), `components/GeneralExamSigns.tsx`, and
`.github/workflows/exam-sign-images.yml`. Rendered collapsed inside the Guide
tab of **every** proforma — one shared block, because there is one general
examination, and because every source sheet recites the same PICCKLE line.

**The first fetch run was wrong for five of nineteen signs, and badly wrong.**
"Clubbing" returned a portrait of a real, identifiable film-maker.
"Platonychia" returned a Roman bronze nail cleaner. "Palmar erythema" returned
chemotherapy hand-foot syndrome. Commons full-text search matches the file
*page*, so any page mentioning the word ranks for it.

This repo had already learned that lesson on the question diagrams — a keyword
search cannot choose a clinical picture, and a plausible wrong one is worse
than a blank. The fix is the same one: **the filename must corroborate**. Every
sign carries `titleMustContain`, at least one word of which must be in the
Commons file title, and the gate runs *before* the licence check because a
wrong picture with a perfect licence is still wrong. All thirteen images from
the ungated run were deleted, including the ones that happened to be right.

10 of 19 signs now have a verified-correct photograph, in the bucket under
`signs/`. The other 9 render as text that says so, which is correct. **Only
public domain and commercial-use CC**; NC and ND refused; attribution stored
and displayed under the picture.

### 12 case sheets → 40

`lib/proformas/{ent,ophthalmology,surgeryShort,surgeryLong,paediatrics,orthoObg,medicine}.ts`,
spread into `CLINICAL_PROFORMAS`. General Surgery 14, General Medicine 10,
ENT 5, Paediatrics 4, OBG 3, Orthopaedics 2, Ophthalmology 2.

Built from the fifteen proforma PDFs the owner sent. A department per file
because `clinicalProformas.ts` had passed 290 KB in one array and was becoming
the only file anybody could edit at a time.

Two structural decisions worth keeping:

- **The general examination is not repeated per case.** Every source sheet
  recites the same PICCKLE line; the app draws it once, with photographs.
  Fourteen copies would be fourteen things to keep in step.
- **`swelling_proforma` holds the lump framework once.** Eight short cases are
  the same examination applied to a different site, and the source sheets
  recite the identical thirty-line sequence each time.

All 27 `diagramPath` values were checked against `storage.objects` directly.
None is broken.

The picker is grouped by department now with an empty state — forty flat rows
was the congestion the owner reported.

**BLOCKED / NOT DONE — read this before assuming it works**

- **Nothing was typechecked, linted or screenshotted this session.** `npm ci`
  fails: the proxy returns 403 for registry tarballs (`zod-validation-error`
  and `zod` genuinely, then everything alphabetically once a throttle kicked
  in). So `node_modules` does not exist, and `tsc`, `eslint`, `check:smoke` and
  `preview/shoot.mjs` could not run. The checks that DID run are the
  dependency-free ones: `check:ads`, `check:exam-signs`, `check:proformas`,
  `check:supabase-queue`. **Run `npx tsc --noEmit` and `npx eslint . --quiet`
  on a machine with a working registry before cutting a build.** The ads
  rewrite and the picker grouping are the two changes most worth a real
  typecheck.
- `ortho_casesheets-1.pdf` and `proforma_medicine.pdf` are **CamScanner scans
  with no text layer** and could not be read. The orthopaedic proforma is
  written from the standard sequence (Apley, Maheshwari) rather than from the
  owner's sheet. If his sheet differs, his sheet wins.
- 47 plates sit in the bucket with **no `question_diagrams` row**, so they are
  invisible in all three apps. Same class as the 2026-09-02 fix. Each needs
  matching to its bank question by hand — never blind, never by keyword.
- 9 signs still have no photograph because nothing passed the title gate.
  That is the correct outcome. Do **not** loosen the gate.

**DO NOT**

- Do not loosen `titleMustContain`, and never put a generic word ("nail",
  "hand", "eye") in one. `check:exam-signs` fails if you do. Every one of the
  five wrong images would have passed a generic gate.
- Do not write a `question_diagrams` row from a sandbox without queueing the
  upload. The row will point at a 404 and nobody will notice for weeks.
- Do not put `rewardedLoaded`-style module flags back beside an ad instance.
  Readiness belongs to the instance.
- Do not repeat the general examination inside a proforma's `sections`.

### Later the same day — the scanned sheets, the two reference pages, 45 cases

**The ortho scan was read after all, and the technique generalises.**
`ortho_casesheets-1.pdf` is a CamScanner scan with no text layer, and OCR is
unavailable here (tesseract, poppler-utils, pypdf, pip — all refused by the
proxy). But a scanner embeds each page as a `/DCTDecode` image XObject, and **a
DCTDecode stream is a JPEG byte for byte**, so the 22 pages come out verbatim
and can simply be read as images.
`.agents/sources/proformas/extract-page-images.py` does it and is committed.

Six ortho cases came out: CTEV, chronic osteomyelitis, non-union + malunion,
peripheral nerve injuries, OA knee. Orthopaedics went 2 → 7, total 40 → 45.
The transcription is **by eye, not machine** — where a proforma disagrees with
the owner's sheet, the sheet wins.

**Four PDFs are still unread and they are NOT scans.**
`CLINICAL_CASES_GYNAECOLOGY`, `CLINICAL_CASES_OBSTETRICS_1`, `OG_cases`,
`OG_cases-1` all returned 0 bytes because `extract-pdf-text.py` does not handle
**PDF 1.5 object streams** (`/ObjStm`) — the objects are inside a compressed
stream and the regex never sees them. Teaching it to inflate `/ObjStm` first
unlocks all four, and all four are OBG, the thinnest department at 3 cases.
**That is the highest-yield small task left in this repo.**
`proforma_medicine.pdf` is the one true scan still unread; use
`extract-page-images.py`.

**Two reference pages, under the search in the case picker** (the owner moved
them there from above it): `GeneralExamSheet` mounts the SAME `GeneralExamSigns`
component the Guide tab does — not a copy — and `LabValuesSheet` over the new
`lib/labValues.ts`, ~100 values with conventional AND SI units, age variants,
and critical values marked separately.

**`check:edges` caught a real bug in ChatGPT's v23 `NoteLinkCard`** once the new
modals made me run it: its full-screen modal padded by a hardcoded 48, so the
title and close button sat under the clock on any cutout phone. Fixed.

**The depth gap is measured and is the main remaining quality problem.**
ChatGPT's four v23 system proformas: median 539 lines. The other 41: median 136.
The eight commonest long cases are listed in deepening order in
`CHATGPT_HANDOVER.md` §8.2.

**Still nothing typechecked.** `npm ci` is blocked. See the
`node-modules-unreachable` blocker in `blocked.json`.

## 2026-09-18 — v23 proforma expansion, unpublished

76 cases (23 added), three licensed clinical photos, corrected teaching points, normal-lab sheet access and drawer/sign rendering fixes. See `PROFORMA_V23_AUDIT.md` for source mapping, validation and remaining PDF audit gaps. TypeScript, ESLint, targeted checks and Android JS bundle pass. No fresh native screenshots, APK or AAB. Automatic approval review blocked direct push to public main/release side effects; obtain explicit approval before publishing, and do not bypass through another API. A recovery patch is saved outside the ephemeral checkout. User requests main only; older branch instructions are superseded for this task.

2026-09-18 follow-up: User explicitly approved pushing to public main and v23 release/screenshot workflows. Terminal push lacks credentials; connected GitHub publication follows. Duplicate audit confirms 76 entries with unique IDs/titles but overlapping general frameworks and focused cases; do not claim 76 unrelated conditions. See PROFORMA_V23_AUDIT.md.

## 2026-09-18 — debug-only Google sign-in policy

Standing user instruction: no Google login at startup or in My Progress for the debug APK only. Internal and normal releases retain authentication. `mobile/src/lib/authMode.ts` is explicitly disabled by android-debug.yml because its optimized preview bundle has __DEV__ false. Both UI locations hide Google controls and bypass the gate; the Google service refuses SDK sign-in when disabled and does not save fake verification. Runtime auth-mode tests cover default production, local dev and optimized debug; TypeScript, ESLint, keyboard and edge checks pass. Device verification remains pending. Preserve this build distinction in future releases.

2026-09-18 verification: ef09a62 passed release 276, internal 202 and debug 192 workflows. Previous proforma screenshot run failed after tapping the Normal Values text near the bottom overlay; no laboratory screenshot verified. Driver now targets the actual Show/Hide accessibility control, moves it into an unobstructed viewport region, checks expansion, and removes stale output PNGs before capture. Re-run remains required; do not present old 07/08 images from the failed run as fresh.

## 2026-09-19 — screenshot-driven clinical UI fixes

User requests: expand laboratory abbreviations; add grading references; compact the bedside AI suggestions; put underlined ask/examine/record prompts before guide theory with larger type; brighten My Progress; use PICCLE consistently; publish updated builds.

Implemented: differential count has full cell names, ranges and roles; lab test names and units are expanded; shared clinical references cover New York Heart Association classes, clubbing, pitting oedema and Glasgow Coma Scale. Clubbing/oedema grades render as separate rows in General Examination. Clinical grading conventions and recording limitations are stated; primary reference links remain in the app. Guide checklist prompts precede explanation, use 16/24 type and underline the action; semicolon splitting respects parentheses and retains source text. AI chips use a non-growing horizontal row with 44dp targets. Progress ring is a static View rather than a disabled Touchable that applied 0.45 opacity. PICCLE has six headings; koilonychia is in Nails.

Twelve attributed original photographs are bundled unchanged for offline use (nine existing repository photos plus the three already reviewed Commons originals); captions and attribution stay visible. Seven signs still lack a verified photograph: no fabricated substitutes were added. Missing-photo UI is a compact text line.

Verification: TypeScript, ESLint, sign/keyboard/edge/version checks, guide parsing/unit expansion checks and production Android bundling passed during implementation. Screenshot workflow now waits for the exact commit's real debug APK instead of patching an older native shell: bundled image resources must match the APK. Driver additionally captures compact AI controls and My Progress. CI/device screenshots and final build outcomes must be checked after publishing. Debug-only Google exemption is preserved; internal/release retain sign-in. Version remains 23.

Sources for added grading material: American Heart Association classes-of-heart-failure page; NCBI Bookshelf NBK539713 and NBK554452; glasgowcomascale.org/what-is-gcs/; MedlinePlus blood-differential page. This update does not claim an exhaustive revalidation of all older laboratory interpretation advice or of every PDF line.


## 2026-09-19 — v23 clinical UI release verified

DONE: Clinical UI update c4c90c0 and screenshot assertion follow-up 403675e are published on main. Latest successful builds: debug-196 (35414415713), internal-206 (35414415653), release-280 APK/AAB (35414415656). Native screenshot run 35414415658 passed against the matching debug APK and committed captures as 64ac0e2. The first run's screenshot 09 captured the underlying form too early; the driver now waits for "Normal Values & Grading", searches differential count and requires "Neutrophils" before capture. The stronger run passed. Compact AI buttons and normal-opacity Progress card were visually verified. Saved screenshots are supplied in chat.

HALF-DONE: No new implementation remains for this clinical UI request. Earlier full-PDF line-by-line auditing and unverified-photo gaps remain as documented; this update does not claim to close them.

NEXT: Use release-280 for normal APK/AAB, internal-206 for signed internal testing, debug-196 for login-free preview. Keep version 23 until the next Play upload requires a bump. The same app changes were also successfully built as debug-194/internal-204/release-278 before the stricter screenshot assertions.

DO NOT: Treat the old screenshot 09 as proof the lab sheet opened. Call the proformas 76 unique entries, not 76 unrelated diseases: master frameworks overlap focused cases. Keep Google sign-in disabled only in debug; internal/release retain it. Preserve main-only publication and the separately merged simulator/deployment work from fb8fbce. Twelve real attributed photos are bundled; seven signs still have no verified photo.


## 2026-09-19 — ChatGPT/Codex — v23 clinical UI release, screenshots, and display preference

### DONE

- Published the v23 clinical UI improvements on `main`: expanded laboratory names and differential-count explanations; New York Heart Association, clubbing, pitting oedema and Glasgow Coma Scale grading; larger guide text with the ask/examine/record prompt underlined before its explanation; PICCLE spelling throughout; koilonychia under Nails; compact Bedside Clinical AI suggestion buttons; brighter My Progress card; and twelve attributed real clinical photographs bundled for offline use.
- Preserved the authentication rule: **debug only** bypasses Google sign-in at startup and in My Progress. Internal and normal release builds retain Google sign-in.
- Verified 76 proforma entries have unique IDs and titles. Some master frameworks overlap focused cases, so describe them as 76 unique entries, not 76 unrelated diseases.
- Successful build releases: `debug-196`, `internal-206`, and `release-280` (APK and AAB). Native Android run `35414415658` passed using the matching debug APK.
- Strengthened the native screenshot driver: it must see “Normal Values & Grading”, search for “differential”, and find “Neutrophils” before capturing. This fixed the earlier false-positive screenshot that showed the clerking page beneath the unopened sheet.
- Visually verified and saved four user-facing screenshots: expanded differential count, clinical grading/NYHA, compact bedside AI controls, and the brighter My Progress card.

### USER DISPLAY PREFERENCE — KEEP FOR CLAUDE CODE, ANTIGRAVITY, AND CODEX

When Sabari asks for screenshots, **show the actual images inline inside the chat as visible image cards**, the same way Claude Code shows rendered previews. Do not provide only filenames, download links, sandbox links as prose, or say that screenshots exist elsewhere. Use rendered Markdown image embeds in the final response, with a short label above each image. Links may be included additionally for downloads.

### NEXT / LIMITS

- No further implementation remains for this v23 clinical UI request.
- The earlier complete line-by-line PDF audit and seven signs without a verified photograph remain separate documented work. Do not claim those are complete.
- Keep release publication on `main`, preserve the concurrent simulator/deployment work, and update both this handoff and `.agents/state/resume-notes.md` after future sessions.


## 2026-09-19 — Play Console advertising ID declaration checked

Sabari supplied the Play Console Advertising ID screen. ORBIT already declares `com.google.android.gms.permission.AD_ID` directly in `mobile/android/app/src/main/AndroidManifest.xml`. Version 23 targets Android 36, and the release build serves live AdMob ads. All release, internal and debug workflows run `check:version`, which fails if the permission is absent or explicitly removed. Release `release-280` built successfully from commit `403675e` after that gate passed.

Play Console action: keep “Does your app use advertising ID?” set to **Yes**. Leave the “I understand the ramifications … turn off release errors” checkbox **unchecked**; that checkbox is a waiver for apps that intentionally omit the permission. Save the declaration and send the pending change for review through Publishing overview. No app-code correction or new binary is required for this screen.

## 2026-09-22 — ChatGPT — notes autosave/fullscreen + native Anki media fix

Product commit: `e2103260a933a51ac4d8e6567bad0c05b4d46ad6`.

### Notes
- The green ORBIT video controls remain unchanged.
- YouTube's own iframe/native fullscreen path is disabled (`fs=0`, no iframe
  `allowfullscreen`, and all note WebViews use `allowsFullscreenVideo={false}`).
  ORBIT's dedicated fullscreen modal is now the only fullscreen path.
- Notes keep a device-only crash/recreation draft under
  `orbit:user-note-draft:v1:<noteId>`. Drafts debounce while typing, flush when
  Android backgrounds/closes the editor, recover when reopened, and are cleared
  after an intentional Save. They do not sync to a server.

### Imported Anki media
- `ApkgModule.extractMedia` now returns the exact filename Android wrote for
  each media zip index.
- `importedDecks.ts` consumes that index→filename map instead of reconstructing
  the filename independently in JavaScript. This removes URL-decoding,
  Unicode/case, and sanitisation disagreements that could leave cards pointing
  at nonexistent local image paths.
- The renderer already supported front/back Anki images and tap-to-zoom; this
  fix is at the native extraction→stored URI boundary.
- Existing decks imported before this fix may retain old saved URIs. Re-import
  an affected deck with this build to regenerate its cards/media paths.
- No image-bearing affected APKG was available in the connected files for a
  real-device reproduction. CI proves compilation/checks; the specific media
  behavior still needs confirmation by re-importing a real affected deck on
  Android.

### Published builds from the product commit
- Signed Play/direct release: `release-515`, versionCode 23 / 0.0.0.23.
  Assets: `app-release.aab`, `app-release.apk`. Live ads enabled.
- Internal: `internal-316`, asset `app-internal.apk`. No ads.
- Debug/preview: `debug-322`, asset `app-preview.apk`. No ads.
- Android release run `35747164272`, internal run `35747164383`, and debug
  run `35747164269` all completed successfully. Web run `35747164326` also
  completed successfully.

## 2026-09-25 — ChatGPT follow-up for Claude and Antigravity

- Fixes: imported media fallback filename/URI, schema 18/v3 SQLite unicase
  temporary-copy compatibility, and note Save failure/draft write ordering.
- `npm run check:apkg` now covers real v1/v2/v3 APKG fixtures; all pass.
- Re-import older affected APKGs to restore saved card image references. Do
  not silently delete existing cards or study progress.
- Native image appearance still needs device verification with a real deck.
- Retain pinned versionCode 23 until the owner confirms Play upload.

Builds from `f612990f0cd0b124cc55b13494e61a415781eee6` all passed:
release `release-522` (AAB + APK), internal `internal-323` (APK), debug
`debug-329` (APK); web CI passed too. The real MF5429 deck was not supplied,
so a physical-device re-import/photo check is still outstanding.

## 2026-09-25 — external file entry handoff

- Samsung My Files screenshots: PDF chooser already offers Orbit, APKG file
  manager entry requested. Added MIME-only VIEW filters for opaque content URIs
  (binary, ZIP, Anki) and SEND filters for APKG/PDF. Generic binary MIME may
  surface Orbit for unrelated files; filename is checked during import.
- Native launch handler now consumes VIEW/SEND with read grant, captures PDF
  MIME, ignores OAuth callback schemes, and emits foreground incoming-file
  event. MainActivity updates its intent before notifying native listeners.
- App Shell owns staging; ready navigator routes to Notes; incoming APKG auto
  imports all included decks and starts studying; PDF opens the Notes viewer.
  In-app APKG picker still permits selection. Follow up with on-device tests of
  Samsung My Files and shared APKG/PDF, including warm launch.
- Earlier v3 import/media and note draft fixes are included in this source tree;
  `check:apkg` passes all v1/v2/v3 fixtures. Previously imported image decks
  require re-import, and appearance of a real affected deck is not device
  verified. VersionCode remains 23.
- Product commit `2b6258e39c019c7bc27ad93352cee34e523da3f5` built cleanly:
  release `release-523` (AAB + APK; run 36096381296), internal `internal-324`
  (APK; run 36096381267), debug `debug-330` (APK; run 36096381253), and web
  run 36096381287. All three Android tags resolve to the same product commit.
  Physical Samsung chooser / PDF viewer / imported image deck remain to check.

## 2026-09-25 — Home and PDF customization follow-up

- Implemented draggable PDF editing palette with three-line 40dp handle,
  normalized persisted placement, bottom navigation clearance, and bounds on
  orientation/layout changes. The attached screenshot's single mark was never
  attached to a drag handler before this change.
- `Reorderable` now keeps its drag responder stable through per-frame horizontal
  alignment updates, releases scroll lock on termination, and continues a long
  press into the same-finger move. Subject tile touch ownership no longer gets
  overwritten by its parent; interrupted grid drags reset their offsets.
- `?screen=pdf-tools-demo` mounts the actual PDF reader under the preview's
  native-files shim. `.github/workflows/customization-visual.yml` captures
  before/after screenshots and checks touch movement/persistence. Device gesture
  feel remains unverified until installed on Android.

## 2026-09-25 — version 24 for Claude and Antigravity

- Owner says version 23 was uploaded; requested versionCode 24. Gradle,
  appVersion and version-check are 24 / 0.0.0.24. Supabase app_releases row 24
  exists with four notes; no Play Console upload was performed here.
- CI touch run 36111594836 found the actual Home reorder save race. The card
  moved but the position setter wrote the previous order to storage afterward.
  `useHomeOrder` now reads a synchronously updated order ref in that setter.
- Ignore builds from commit 82441c46 (release 36111594805, internal
  36111594830, debug 36111594851): they do not include the persistence fix.
  Use only a subsequent v24 build from the follow-up commit after its visual
  workflow passes, and capture its exact release tags here.

## 2026-09-25 — Version 24 verified customization (current handoff)

- Product commit `6c80453bb232999070aeeb45338c41c6aef0eff0` includes
  versionCode 24 and its live app_releases row with four notes, Home order
  persistence fix, PDF toolbar initial-position fix and visual check.
- Browser touch workflow 36112331283 passed on that commit and has four
  before/after screenshots. It verifies saved Home order, PDF move and PDF
  position after reopening. Still check an Android phone's gesture feel.
- Only use Android artifacts from release run 36112331297, internal run
  36112331268 and debug run 36112331244 (verify successful tags/assets).
  Previous v24 runs predate the final PDF fix. App has not been uploaded to
  Play Console by this task.

### Final v24 build links

- `release-527`: AAB https://github.com/Sabharivarshan111/gmck/releases/download/release-527/app-release.aab ; APK https://github.com/Sabharivarshan111/gmck/releases/download/release-527/app-release.apk
- `internal-328`: https://github.com/Sabharivarshan111/gmck/releases/download/internal-328/app-internal.apk
- `debug-334`: https://github.com/Sabharivarshan111/gmck/releases/download/debug-334/app-preview.apk
- Runs 36112331297 / 36112331268 / 36112331244 all completed green and
  all tags point to product commit `6c80453bb232999070aeeb45338c41c6aef0eff0`.
  Web and visual checks also passed. AAB is ready for owner Play upload; this
  task did not submit it to Play.

## 2026-09-25 — v24 Home widgets (newer product commit)

- `b9fb2359551777b26665134a0b2ec2470d1ba0cd` adds a five-page swipeable
  Home card for Welcome, question progress, resume/note, focus time/sessions,
  and posting attendance/reminders, plus a second quick-action page. Previous
  and next buttons work alongside swipes; Home refreshes focus data on focus.
- Completed focus sessions are newly counted starting v24. Existing recorded
  total minutes are retained; time spent outside completed Pomodoro sessions
  is not counted. Last question is saved only on deliberate interaction.
- Daily attendance reminder is opt-in under the existing notification master
  switch, defaults off, uses the chosen hour, and is capped at one per day.
  The v24 `app_releases` row now has five notes covering Home and prior fixes.
- Visual run `36169940679` and release/internal/debug runs
  `36169940786 / 36169940683 / 36169940717` target this commit. Confirm
  success and capture final asset links; prior `release-527`, `internal-328`,
  `debug-334` do not contain the Home widget follow-up. No Play upload done.

### Verified latest v24 artifacts

- Release `release-530` (run `36169940786`) succeeded:
  https://github.com/Sabharivarshan111/gmck/releases/download/release-530/app-release.aab
  and https://github.com/Sabharivarshan111/gmck/releases/download/release-530/app-release.apk
- Internal `internal-331` (run `36169940683`) succeeded:
  https://github.com/Sabharivarshan111/gmck/releases/download/internal-331/app-internal.apk
- Debug `debug-337` (run `36169940717`) succeeded:
  https://github.com/Sabharivarshan111/gmck/releases/download/debug-337/app-preview.apk
- All tags resolve to `b9fb2359551777b26665134a0b2ec2470d1ba0cd`.
  Visual `36169940679` and web `36169940725` passed. AAB not uploaded to Play.

### Daily Home card continuation (2026-09-26)

Current product commit `fe03a978bfa2f4c88cd8f850fffc46c08bc4d5bb`. Shared Supabase 42-slot/year/kind cache deployed (private `daily_study_cards`, Edge `daily-study-card` v2). Home carousel includes MCQ, picture, Resume (year validation fixed), progress, study, attendance; small Bank tile replaces duplicate Resume. First live Second Year cards generated; latest visual and Android builds still require verification. See HANDOFF.md.

### Final daily Home visual and builds

Native source `d4e0dd2d3fedfa1b9fde7553dcae4e867660ebd4`, Edge v3, screenshots commit `7458277e6a50a43e4f7bfe6c93183e625d369e92`; visual run `36213138445` passed expanded picture. Final release/internal/debug runs `36213138345 / 36213138347 / 36213138460` still compiling, verify assets. Supabase storage/cache figures and v24 Play text in HANDOFF.md. No Play upload.

### Verified v24 daily-card artifacts

All final Android runs passed: release `36213138345` → `release-536`; internal `36213138347` → `internal-337`; debug `36213138460` → `debug-343`. All tags `49e52ed9490ecd181b893cfc4252831af36d6b60`, only docs/screenshots after source commit. Direct URLs and Play text in HANDOFF.md and CHATGPT_HANDOVER.md. No Play upload.

### Owner-corrected compact daily cards

The owner rejected the tall daily slide. Source `30e5b00f4f78811a6250b172349825e55e2a0341` keeps every Home carousel page at the same compact height, shows a small picture/question/options, and reveals the answer within that card. Tap diagram/question/full explanation for details. It also includes duplicate-request/stale-year protection. Phone-size component visual `36226028426`, web `36226028520`, and final Android release/internal/debug `36226028404 / 36226028480 / 36226028434` all passed. Use `release-539` AAB/APK, `internal-340` APK, `debug-346` APK; all tags point exactly to compact source. Old release-536/internal-337/debug-343 contain the rejected tall card. See HANDOFF.md for direct links and storage context. No Play upload.

### Three-line release notes and offline upgrade retry (2026-09-26)

Main product commit `a5eea5d6b431b204276107d0c0e7b1a70f79e170` caps the in-app note card at three single-line bullets and keeps a failed Supabase read from permanently consuming the What's New card. The v24 cloud row has three notes. Local `check:native-update` and diff check passed; verify Android release/internal/debug workflows from the final handoff commit, their tags and assets, and share only those links. VersionCode is still 24, Play reportedly has 23, and no Play upload occurred. See HANDOFF.md.

### Final verified release-note build artifacts

Runs release `36238458143`, internal `36238458212`, debug `36238458158` all passed. Tags `release-541`, `internal-342`, `debug-348` point to `d4da88d4c6548807772ae2e627cb59961fa73a5f`, containing the release-note fix and handoff. Assets and sizes are in HANDOFF.md. Version 24 AAB was not uploaded to Play Console; the owner reported Play at version 23.

### 2026-09-27 friend feedback

Native Notes and PDF note pages now continue numbered/bulleted lists on Enter; the PDF note page has formatting controls. Generated notes copy an entire section, and the focus player has a selectable playlist. See HANDOFF.md for the local checks and CI/build status. VersionCode stays 24; Play reportedly has 23.

### 2026-09-27 follow-up screenshots

- Home edit resize grips now live within touchable bounds; subject cards expose accessible move arrows and picture controls, with room so arrows do not cover titles. `SortableGrid` visually settles after arrow-driven order changes.
- Personal and PDF note editors release the controlled caret after list continuation and retain its position when an empty list item ends the list. Four numbered entries followed by four bullets were checked in each editor.
- Study music exposes a named playlist with row reorder/removal, shuffle, and repeat off/all/one. Reordering persists in `orbit:music:tracks`; removal respects copied versus linked file handling.
- The phone-viewport visual workflow on `feedback-visual` captures before/after screenshots and exercises saved layout, subject order/picture controls, list editing, and playlist options. This is React Native Web; native Android audio completion and device gesture feel still need an installed-device check. VersionCode remains pinned to 24 while Play reportedly has 23. No Play Console upload is part of this work.

### 2026-09-29 KUHS source review continuation

- Review branch `kuhs-source-review` on GitHub now contains source-checked offline KUHS rows through local commit `3f4e360` (remote equivalent `49a19fc3b0d26807bd27ff29b179040d9bc0a37b`). The latest pass manually inspected PDF pages 6–8 of the first-year book and added 72 Anatomy I essay/short-note rows, including distinct month/year sittings. Catalog total: 181 rows, 165 first-year and 16 second-year. PDF text/metadata were not uploaded to Supabase.
- `KUHS_BANK_READY` remains false: these rows are a review seed, not a complete four-year bank. The user wants first-run and existing-user university selection, offline question bank, and on-demand Supabase note/diagram cache. Continue visual source review of the four Decipher PDFs before enabling KUHS or cutting a signed release.
- Checks passed: `tsc --noEmit`, `check:search-index` (6166 combined hits), `check:repeat-markers`, unique IDs/exam-ref audit, and Android production Metro bundle. GitHub review branch file matches the local committed file after fetch. No emulator/connected device exists here, so do not claim native gesture verification or provide a device screenshot. Existing unrelated dirty music asset and `mobile/preview/customization-visual.mjs` were left untouched.

### 2026-09-30T07:59:51Z — KUHS 50-page checkpoint

DONE: Restored the durable 3,054-entry patch after scratch pruning. Preparation now defaults to 50 total pages, checkpoints OCR/manifest after each page and supports legacy per-year --count. Compared eligible selections against all 50 selected images; added 607 entries. Ledger now 3,661 entries across 237 entry-bearing pages. All 611 coverage rows validated; mobile typecheck/search-index/repeat-marker checks passed.

HALF-DONE: Full whole-page reconciliation remains pending on every page. The third-year page-62 image-only triangle question remains deferred; second-year page-115/116 essay continuation needs reconciliation. KUHS_BANK_READY remains false.

NEXT: Use scripts/kuhs-review-progress.md queue (first gaps from 1, second 119, third 69, final 115) and --total 50. Visually compare source images, never promote OCR automatically. Save and commit between batches and refresh the durable recovery patch.

DO NOT: Upload the source PDFs to Supabase, include TU/RGU-only references, treat 237 entry-bearing pages as fully reviewed, release the incomplete bank, or retry/route around the automatic approval rejection of direct GitHub push.

### 2026-09-30T09:18:35Z — KUHS second 50-page checkpoint

DONE: All 50 source images compared; added 581 entries, totaling 4,242 across 281 entry-bearing pages. Typecheck/search-index/repeat-marker checks passed. Portable manifest records hashes and zero-entry checks. Preparation skips previous selection checks and supports --list-only.

HALF-DONE: All 611 pages require final reconciliation. KUHS_BANK_READY remains false. Continuations/deferred cases are in scripts/kuhs-review-progress.md. No build/release.

NEXT: --total 50, starts first:22 second:132 third:84 final:127. Compare source images, save frequently and refresh durable recovery patch.

DO NOT: Upload PDFs to Supabase, include TU/RGU-only or objective/old one-mark rows, claim 281 pages complete, enable the bank, or retry/route around the automatic approval review rejection of GitHub push.

### 2026-09-30T09:54:29+00:00 — KUHS batch 03 intermediate save

DONE: First 22–31 and second 132–145 source selections checked; 343 entries added, total 4,585 on 305 entry-bearing pages. Structural coverage/ID checkpoint passed. App checks deferred until batch end.

HALF-DONE: Third 84–95 and final 127–140 prepared but not yet viewed. All pages need final reconciliation. Fold-obscured first-year references deferred (22 rows 4/9/15/16/17, 23 rows 12/13, 26 rows 7/8); page 22 posterior mediastinum row 3 has no clear tag. Second 141 satellitism duplicates 136 and is skipped; 144 untagged neurocysticercosis essay deferred. Second 145 joins cryptococcal question from 144 and gonococcal/UTI essays onto supporting image of 146; other 146 rows not entered.

NEXT: Finish third 84–95, final 127–140, then portable 50-page manifest and app checks.

DO NOT: Enable or release KUHS, infer obscured years, upload PDFs to Supabase, or retry blocked GitHub push.

## 2026-09-30T10:08:31.211294+00:00 — KUHS batch 03
DONE: All 50 selected images compared; +566 rows, 4,808 entries on 327 entry-bearing pages. Batch manifest/progress saved; app checks passed. Final 137–140 front matter zero rows.
HALF: All 611 page statuses still manual_page_review_required. KUHS_BANK_READY false.
NEXT: Prepare 50 with --start second:146 --start final:141; later zero-entry front matter and complete reconciliation. Do not mistake ledger-bearing pages for fully reviewed pages.
DO NOT: Upload PDFs to Supabase, enable/release KUHS, retry GitHub push rejected as unverified external egress. Recovery patch version17 after this commit.

## 2026-09-30T10:30:34.884526+00:00 — KUHS batch 04
DONE: 50 selection-checked source images: second 146–149, third 1–10, final 141–176. +365 rows; 5,173 entries on 359 entry-bearing pages. Manifest and coverage saved; type/search/repeat checks passed.
HALF-DONE: All 611 statuses remain manual_page_review_required; KUHS_BANK_READY=false. Final 156–157 untagged scrub typhus essay deferred. Complete page reconciliation pending.
NEXT: Continue final 177 with --total 50 --jobs 2 --ocr; preparation may fill earlier zero-entry gaps. Save checkpoints, verify printed KU references and case continuations.
DO NOT: Release/enable KUHS, upload PDFs to Supabase, infer unclear exam tags or retry rejected GitHub push. Refresh durable recovery patch version19 after commit.

## 2026-09-30T12:49:11.388171+00:00 — KUHS batch 05 recovery intermediate
DONE: Restored durable v19 patch after maintenance; 55 visually compared rows from final 177–182, total 5228 on 365 entry-bearing pages. Structural checks passed.
HALF-DONE: Batch05 44 selected pages remain: second 1–6,10–28 and final 183–201. App typecheck lacked tsc after cleanup; mobile npm ci started. All611 final reconciliation pending.
NEXT: Continue final183; use restored final PDF. Restore second PDF from Library when needed. Rebuild missing image manifest.
DO NOT: Enable/release KUHS, upload PDFs to Supabase, infer missing years or retry rejected GitHub push.

## 2026-09-30T12:51:23.945195+00:00 — KUHS batch 05 intermediate through185
DONE: 94 rows added from final177–185; 5267 entries on368 entry-bearing pages. Source images compared; no year invented for181 KU-only case. Dependencies restored.
HALF-DONE: 41 batch05 pages remain: second1–6,10–28 and final186–201. All611 final reconciliation pending.
NEXT: Continue final186 using restored PDF; images186–188 already rendered. Restore second-year PDF from Library before finishing batch05.
DO NOT: Enable/release KUHS, upload PDFs to Supabase, infer exam dates or retry blocked GitHub push. Durable patch next version21.

## 2026-09-30T18:13:16.880988+00:00 — KUHS batch05 completion
DONE: Restored v21 recovery patch into clean review checkout; compared final186–201 and second1–6,10–28 source images. Added385 entries, total5652 on404 entry-bearing pages. Batch05 all50 selection checked across checkpoints, portable hashes saved. Ledger611 coverage/unique IDs, typecheck, search-index, repeat-marker and diff checks pass.
HALF-DONE: All611 page statuses still manual_page_review_required; deferred source ambiguities in scripts/kuhs-review-progress.md. KUHS_BANK_READY=false; no build/release.
NEXT: final202, 50-page batch; sources at ../restored (final) and /workspace/scratch/d60ed2b4552d/restored (second). Recovery patch saved after local commit.
DO NOT: Upload PDFs to Supabase, infer missing dates, claim whole-page completion, enable/release KUHS, or retry/route around rejected GitHub push.


## 2026-09-30 KUHS sixth source-selection batch
Visually checked final-year PDF pages 202–251 (50 pages), adding 536 KU-tagged entries. Ledger 6,188 entries on 450 entry-bearing pages; all 611 page statuses remain manual_page_review_required. App typecheck/search-index/repeat-marker checks passed. Manifest scripts/kuhs-batches/2026-09-30-50-pages-06.json contains source image hashes/counts. Deferred ascending weakness case 210–211 lacks visible reference. Cross-page breast cases 238–239 joined. Source typos on 216 (DEXA) and 226 (stages of wound) preserved as printed; bare KU tags on 231/237/245 preserved without inferred years. Next final 252–281, then deferred cases/full reconciliation. KUHS_BANK_READY=false. No release, Supabase PDF upload or external push. Prior automatic approval rejection of GitHub egress still applies; do not retry or route around. Refresh recovery patch against origin/kuhs-source-review and save new version after local commit.

Normalized medicine and surgery subject keys to general-medicine/general-surgery (existing catalog keys), preserving all question IDs and source provenance.

2026-10-01: restored recovery patch v23 into fresh kuhs-source-review clone at /workspace/scratch/d60ed2b4552d/gmck-kuhs. Checked final PDF 252–281, added 343, total 6531 on 478 entry-bearing pages. Batch07 manifest saved. Next deferred cases and whole-page reconciliation, first-year page1 onward. All611 statuses pending and readiness false. Checks passed. Do not push: prior automatic egress rejection still applies. Current PDF restored/decipher final year mbbs 2026 (2)(2).pdf is actual281pages.

2026-10-01 reconciliation01:19 source page images checked;6532 entries/478 entry-bearing pages. +1 first68 Oct24 galactosemia case; corrected final88 wrong neighbouring-case KU24 attribution and third63 flood-team KU21. First1–3 fully reconciled with hashes/row fingerprints in scripts/kuhs-reconciled-pages.json; coverage now3 complete/608 pending. Validator permits only evidence-backed completion and rejects changed rows. Next first4 onward. All4 actualPDFs restored locally in ../restored. Third62 blackC has no question text and remains unresolved. Read scripts/kuhs-review-progress.md and reconciliation01 manifest for exclusions. Readiness false; prior no-push block remains.

2026-10-01: all4 PDFs converted into611-page OCR TXT bundle at ../questionbank-txt. Durable bundle libfile_f83fa80191508191afe628f8936dd571,file_00000000e6c08211a737e38b751974ec. Combined TXT libfile_e64f3c86babc81919240579946d15cdd; reviewed KUHS TXT libfile_f82e571e9764819189b129262b0838ae. Report libfile_1c716d7a3da0819196b2bb56f0d9817b. The ZIP includes4individualTXT,all-yearTXT,reviewedledgerTXT,qualityCSV,questioncomparisonCSV,sourcehashes,perpageTXT/JSON,conversion/verification scripts. Structuralconversion checks passed,361pagequality flags,1131questionmatching flags; no exacttext or yearaccuracy claim. Use as search aid for remaining first4onward visual reconciliation. Still6532entries,3complete/608pending,readinessfalse. No push.

## 2026-10-01T03:02:00Z — KUHS development sections

**DONE:** Enabled KUHS selection only in __DEV__ while KUHS_BANK_READY stays false. Home, Browse, topic navigation and Progress use one availability resolver; Browse displays review notice. Existing 6,532-entry shared catalog powers search and progress. Typecheck, changed-file lint, search round trips (12,517 total both banks), repeat markers, development/release gate assertions, preview build and diff check passed.

**HALF-DONE:** No browser interaction or Android device check yet. No published build. OCR conversion of 611 pages is complete but is not source accuracy verification; 1,131 ledger comparison flags remain.

**NEXT:** Exercise KUHS selection, year/subject/topic navigation and search in preview; continue targeted image checks from comparison flags and full source reconciliation.

**DO NOT:** Mark the bank release-ready from OCR coverage. Do not push or route around the earlier external egress rejection.

## 2026-10-01T03:05:00Z — TXT-backed KUHS question provenance

**DONE:** Added exam-reference and source-PDF-page captions to KUHS QuestionRow, with matching accessible label and under-review status. O(1) source lookup preserves raw question/progress/cache keys. Added mobile/scripts/kuhs-txt-check.mjs: all 6,532 reviewed TXT entries exactly match app wording, year, subject, topic, type, page and references. Typecheck, focused lint, progress fanout, preview build and diff check passed.

**HALF-DONE:** Source accuracy review remains separate; raw all-university OCR is not imported into the KUHS bank. No browser/device interaction verification or published build.

**NEXT:** Exercise preview selection and question provenance display; use OCR flags to locate targeted source checks.

**DO NOT:** Infer complete/accurate KUHS coverage from exact TXT/app equality. Do not push through the previously rejected external egress action.

## 2026-10-01T03:16:00Z — KUHS preview screenshots and offline flow

**DONE:** Captured 10 phone-size screenshots from real native components through React Native Web: onboarding, Home university sheet, Settings, all four years, question provenance, completion tick, search. Inspected contact sheet. All external network requests were blocked during flow; selection persisted locally, questions/search/progress rendered. Saved screenshot composites and original PNG zip; libfiles 80099b16605881918a02d020360cda07,30d43fb1b1888191b9327b7137c9f68f,cf39df006a94819182ca01e2a55a47a6,551ba3eb44588191876f5182b6c174b1 (prepend libfile_). Harness mobile/preview/kuhs-capture.mjs serves preview build itself, CHROME_PATH selects browser.

**HALF-DONE:** These are browser previews, not Android emulator/device screenshots. Google sign-in is native-only and does not render in browser onboarding. No automatic existing-user pop-up added; current chooser opens from Home card.

**NEXT:** Continue source reconciliation before release availability.

**DO NOT:** Claim installed app/device verified. Vite dev server failed uv_interface_addresses; used static preview build. agent-browser daemon would not start; Playwright captured successfully with npm-provided Chromium.

## 2026-10-01T03:22:00Z — Existing-user university confirmation

**DONE:** Added UniversityConfirmation centered dialog on Home for hydrated existing profiles missing university, enabled when both banks are available. Selecting persists via existing local profile path and closes immediately; Later dismisses this session. First-run users continue onboarding; chosen profiles are not asked again. Offline browser harness verified prompt, KUHS selection, local persistence/reload, and all existing browse/search/progress captures. Typecheck, changed-file lint, preview build, search/repeat checks passed. Screenshot saved as libfile_a96de146dd948191850824685d8e070a. Whole first-year PDF page4 visually reconciled: all43 rows match. 4pages complete,607pending; entries remain6532.

**HALF-DONE:** Full-bank reconciliation is not complete; keep review label and release gate. Dialog is development-only until KUHS_BANK_READY flips. Not tested on Android device; no release published.

**NEXT:** Reconcile first5 onward using TXT as locator, resolve source errors before release.

**DO NOT:** Remove review labels as a substitute for verification. Do not retry rejected GitHub egress.

## 2026-10-01T03:30:00Z — Owner switches to TXT verification

**DONE:** Follow explicit TXT-only workflow; stop restarting PDF reconciliation. Preserved all6532 entries. Exact TXT/app comparison passes, zero differences; search index all12517 both banks round trips. KUHS availability true after TXT/offline integration checks; removed review preview and source PDF pages in native UI. Automatic existing-user choice verified offline/reload, all4years/questions/search/tick captured. Typecheck, changed-file lint, notes schema limits, preview build passed. Independent raw OCR comparison still5401located/1131uncertain; exact reviewedTXT equality is export integrity, not lossless transcription proof. Comparison report libfile_76ce591754088191a7c807cceb7b5093, clean chooser image libfile_44b2b9c34d388191bb0b2928ad0c9898, question image libfile_2f56c8716d4081918305e9d84c26a937.

**HALF-DONE:** Raw OCR ambiguities remain documented; no guess corrections. No published updated APK or device verification.

**NEXT:** Continue from saved TXT and preserved bank; work on text-supported discrepancies if requested.

**DO NOT:** Restart PDF page count, claim work lost, claim perfect OCR, or retry rejected remote GitHub egress.

## 2026-10-01T03:45:00Z — TXT-only comparison normalization

**DONE:** Audited all6532 saved TXT entries without PDF/image access. Unicode/dehyphenation, singular/plural, -isation/-ization and full month parsing located119 oldflags. 5520 text/reference locations,1012 uncertain; no medical wording/year edits. Created readable canonical TXT without page metadata and separate remaining uncertainty queue, durable IDs in kuhs-review-progress.md. Extended mobile TXT checker to both formats: original and new cleanTXT each match all6532 app rows. Diff check passed.

**HALF-DONE:** Remaining1012 cannot be treated as transcription fixes from locator heuristics. No app UI change this batch; no new APK.

**NEXT:** Use cleanTXT and remaining queue; preserve stable IDs and uncertainty.

**DO NOT:** Claim119 source errors corrected; these are text-location false flags resolved by normalization. No PDF restart or remote egress retry.

## 2026-10-01T03:50:00Z — KUHS repeat counts and clean screenshots

**DONE:** KUHS row count now derives from distinct dated references, not inline stars. Ignores bare KU and duplicate references, normalizes KU/month tags, keeps original question/progress/cache strings unchanged. Explicit recorded-reference caption;36 entries lack dates and show count unspecified. Added check:kuhs-repeats independently parses references and checks all6532 metadata rows (max7), including duplicates/unknown/month variants. Title names selected university. Typecheck, focused lint, fanout, search12517 round trips, TXT/app6532 exact comparison, preview build passed. Offline browser captures onboarding, legacy-user prompt/local persistence, Settings,4years, question refs/tick/search, six-reference badge and search-to-topic navigation; no review/work-in-progress/PDF captions. Inspected screenshots; composite libfile_f4c74240d1cc8191b97308f4e9f2edd8 and full repeat screenshot libfile_248db4e2cf808191af26cc8571a2881f.

**HALF-DONE:** Browser/native component layout verified, not Android device. No updated APK published. Counts are recorded references; year-only tags do not prove separate sittings. TXT uncertainty queue1012 remains, no lossless OCR claim.

**NEXT:** Continue from preserved cleanTXT if further text-supported corrections are available.

**DO NOT:** Count bare KU as one occurrence, inflate repeat frequency, alter raw question IDs/strings just to correct display, restart PDF review, or retry rejected GitHub egress.
## 2026-09-30 — Codex — security repairs and source synchronization

- **DONE** — Live Supabase protections restored and read back; 27 mock handler cases + 10 live validation/no-write cases pass. Actual RLS/quota tests rolled back and passed. Web CI builds pass; native tsc/lint and local Android JS bundle pass. See docs/security-audit-2026-09-30.md.
- **HALF-DONE** — Lovable presence/env and notes/quiz source sync landed, then credits exhausted. Its automatic deployment reverted older AI/admin code; restored immediately through connector. Remaining Lovable source must sync before any publish. Shared textbook helpers now preserve BOTH production algorithms; 69 baseline comparisons and existing textbook gate pass; Android release rerun pending.
- **NEXT** — Watch latest CI. Owner adds Lovable credits, then sync all protected sources/config atomically and read back live functions. Owner verifies historical OpenAI-key revocation and enables leaked-password protection. Continue nickname-suggest, IP/bot controls, account merge/purchase/device audit.
- **DO NOT** — Do not publish stale Lovable source; it demonstrably redeploys unsafe functions. Do not blanket close intentional open Gemini/leaderboard. Do not use old public.http_* recipes: HTTP is server-only in server_http. Do not claim a device test or released APK from a JS bundle.

## 2026-09-30 — Codex — nickname budgets and native release gates

- **DONE** — Nickname endpoint v15 now checks durable budgets/verified user tokens and returns existing fallback names on denial or failure. 5 mocked cases pass. All prior security checks pass; shared textbook retrieval gate fixed without changing either production algorithm (69 baseline comparisons). Latest Android run 36659193780 passes all type/lint/check gates and is building signed artifacts. Web builds pass. Source at gmck main.
- **HALF-DONE** — Signed build completion pending; actual device and purchase flows untested. Lovable remaining source synchronization still blocked on credits, including nickname-suggest.
- **NEXT** — Check final Actions status, then complete credit-blocked Lovable sync before any edit/publish. Historical key revocation and leaked-password protection need owner action.
- **DO NOT** — Do not redeploy stale Lovable source; do not claim a Play upload/device test. Do not use public.http_*; the verified protected schema is server_http.


## 2026-09-30 — Codex — final security build verification

- **DONE** — Release/internal/debug runs 36659193780 / 36659193742 / 36659193735 all completed successfully. Assets release-549, internal-350 and debug-356 exist; tags resolve to 3df5009, build checkout was 882bb3, native source/config unchanged between these commits. Latest web/security CI on 3df5009 passed: 38 regressions and 11 live validation/no-write cases. Read back all 11 repaired live entrypoints and both textbook helpers: exact repo match. Private-table RLS/grants and server_http restrictions rechecked. Downloads and evidence recorded in docs/security-audit-2026-09-30.md.
- **HALF-DONE** — Lovable source remains at 8d7d561 with previously reported exhausted credits. Remaining protected source sync is pending; physical Android testing and real purchase flows untested. Score remains provisional 6/10.
- **NEXT** — Owner restores Lovable credits, then synchronize every remaining protected source/config before edits/publish and read back deployments. Owner verifies historical provider-key revocation and enables leaked-password protection. Continue deeper account-merge, payment, bot/spend and native security audit.
- **DO NOT** — Do not publish stale Lovable sources, claim physical-device/Play verification, change app identity or uninstall to bypass signing mismatch. Build release tags reflect moving main, so cite the actual run checkout for artifact provenance. No user content was removed.


## 2026-09-30 — Codex — Android-only security audit

- **DONE** — Owner paused Lovable. Native/source audit at c253bcd382d1bd098d25a6f88b824898643320d2 gives provisional 5/10, separate from shared backend 6/10. Findings: conditional unbound Play-token ownership reassignment (live source matches), repeatable notes-purchase bonus extension, AsyncStorage session tokens, unbounded archive byte/decompression reads, stale signed-out identity cache, local release debug-key fallback. Evidence and preservation-aware repair order in docs/android-security-audit-2026-09-30.md.
- **HALF-DONE** — Code review only; no physical-device penetration test, real purchase, dependency CVE scan or complete WebView/intent audit. No code fixes in this pass.
- **NEXT** — Prioritize atomic purchase ownership and idempotent bonuses with regression tests, then token-storage migration and bounded archive reads. Preserve valid restores, anonymous progress and large decks.
- **DO NOT** — Resume Lovable without owner steering; do not confuse public anon key with a secret, claim rooted-data risk means ordinary apps can read tokens, or claim device/payment tests passed.


## 2026-09-30 — Codex — Android security repairs except Anki
- **DONE** — Live Play verification v2 uses a service-only atomic token-owner RPC; 8 rolled-back SQL checks and 9 mocked handlers pass. Partial unique-index predicate corrected in a second migration. Android Keystore AES-GCM TurboModule and verified session migration added; failed migration retains old session, no new plaintext writes. Premium cache encrypted/account-bound, Google identity cleared on successful sign-out, local release signing fails closed. 13 Android regression cases pass; local typecheck/lint and native schema parse pass.
- **HALF-DONE** — Full native CI compilation/signed artifacts pending. Device/Play purchase validation remains unperformed; existing PLAY_BILLING_ENABLED=false gate preserved.
- **NEXT** — Check CI, resolve any native compilation/test failure, then record final artifact/run links. Owner device/licence tests and historical secret/password settings remain separate.
- **DO NOT** — Anki import/export must remain untouched at owner's request. Lovable stays paused. Do not change app ID/version/ads or claim a Play upload. Preserve legitimate legacy restores only for their existing recorded owner; new unbound purchases need controlled recovery.


## 2026-09-30 — Codex — Android security repair builds verified
- **DONE** — Source b0557dee55ba197f7d371170b4d78dea3d2f586e: release/internal/debug runs 36701352810 / 36701352840 / 36701352865 all success, producing release-550, internal-351 and debug-357, each tag verified against that exact source. Web and browser regression passed. Security CI 36701353078 passed 60 regressions + 12 live no-write checks; 8 actual SQL rollback checks passed. Native Kotlin/codegen compiled. Final service-only RPC privileges verified and no fixture rows remain. Audit score now provisional 7/10 for Android; audit contains evidence/downloads.
- **HALF-DONE** — Physical-device session migration/sign-in and real Play purchases remain untested. Play billing remains disabled per existing gate. Anki archive bounds deliberately untouched. Historical key/password settings are owner actions; Lovable paused.
- **NEXT** — Owner reviews/installs the appropriate test build without deleting a Play installation, verifies retained sessions/progress and sign-out, and runs Play licence-test purchase/restore/refund before enabling Play billing or uploading a version-bumped Play release.
- **DO NOT** — Do not change Anki import/export, app identity, ads, version or claim a Play upload/device pentest. Do not redeploy stale Lovable code. New unbound legacy purchases require controlled recovery; never assign an existing token to another uid.

### 2026-10-01 — version 25 prepared; release blocked
Owner requested version25, repeated handwritten notes repair and slow Anki repair. Pure notesDedup cleanup merges same-type/topic headings and exact repeats, retaining distinct descriptions, diagram URLs and ordered algorithm steps. Applied to batch merging and rendering cached notes; merge no longer mutates originals. Imported Anki loads eight 250-card chunks per batch with event-loop yields and a one-deck cache; overwrite/delete invalidate it. Study reuses unscheduled states, indexes card lookup, and avoids the second sorted due queue. Scheduler itself unchanged. Regression covers frozen/idempotent AF inputs, unique details, 50k cards, scheduling equality, bounded reads, reopen/overwrite/delete. Merged latest origin main FETCH_HEAD af2c8d50, preserving all security fixes; only conflict was append-only resume notes, both sides retained.
Version25/0.0.0.25 synchronized Gradle/app constants/check. Supabase project pmtgeydtqypwrypshhsx app_releases row25 inserted and returned successfully (three notes). Native and preview typecheck, full mobile lint (0 errors;425 existing warnings), notes schema, Anki, APKG import/export, version, security, KUHS repeat and all6532 TXT comparisons pass. Vite preview and Metro production Android bundle+432 assets built. Browser fixture checks AF headings once preserving unique facts; offline KUHS selection/reload/search/completion/six-exam badge pass. Screenshots ../v25/screenshots; these are browser previews, NOT installed Android or server generation evidence. APK/AAB NOT built/published: no local Android SDK; prior automatic approval rejection of GitHub push (unverified external egress) remains; do NOT retry or route around rejection. Prepared code committed locally, recovery patch saved next version34.

### 2026-10-01 — cardiology depth follow-up; upstream quota blocks final generation
Restored durable patch34 in fresh workspace /workspace/scratch/9e22d9931618/gmck-kuhs; checkpoint c81898b9. User concerned AF screenshot was short. Actual shared cardiology cache has63 sections/5256 words; cleanup retains63 sections/4478 words and all818 string values (duplicates removed). Pre-repair fresh AF returned10 sections/573 words, unchanged by cleanup: generator-depth issue confirmed. Added explicit LeafTopic questionKinds (cardiology25 essays/59 short notes); increased question char cap to4000 to keep1061-char cardiology case intact; removed contradictory one-page prompt; single long essays below900 distinct words expand once and reject still-brief output before persisting. Repeated paragraphs cannot pad guard. Clinical table columns preserved separately in cleanup. Supabase generate-handwritten-notes deployed version64, verify_jwt=true, same security and quota logic; live files/metadata verified. Tests depth/labels/full-case/v25/types/lint/schema/limits pass.
Authored separate AF educational reference16 sections/1746 words; all149 text values preserved and headings renderonce in app browser preview. Not a production generation or installedAPK. Artifact bundle includes cache, partial batch, rawAF, authoredAF, fullTXT, auditJSON, screenshots, source export and README. New wholechapter generation attempt onlybatch1/9 succeeded, batch2 HTTP timeout; post-repairAF request429 dailyGeminiquota. DO NOT claim fresh84-question generation complete or clinical accuracy universally verified. Existing shared/personal notes untouched. Do not bypass quota. Prior GitHub push auto-review rejection remains: do NOT retry/routearound. Native version25 still not released. Refresh recovery patch against origin/kuhs-source-review, save version35; separate cardiology ZIP preserves expensive proof.
Durable cardiology ZIP: libfile_94dbdea4d40c8191997b7492aaa9ea7e. Full AF TXT: libfile_47d75ebc5f988191b59e29d297b745e3. Preserved chapter TXT: libfile_4d1d7cd4d1f48191802162cc6b7d3d66. Preview images libfile_42fc10b417e48191a1ffa6f5f6ab2b8c and libfile_a075f8d6a1e08191bfb08ad9a0fbce3e. These artifacts preserve all before/after proof, partial generation and authored reference for the next session.

### 2026-10-01 — continuation: false quota diagnosis repaired
Saved state intact. Logs reveal the prior AF429 was a misclassified depth rejection: catch /rate/ matched inside "generated". Only typed UpstreamError.kind===quota now returns429; five regression cases distinguish depth/generation/timeouts from real provider quota. Live notes v65 JWTrequired, full source byte-match readback. One fresh anonymous AF long-essay request returns500 with correct too-brief safeguard, not quota; no shared/personal write. Correct prior claims: actual daily-provider quota not established by these AF tests. Fresh successful long output and whole84-question chapter regeneration remain unfinished. Do not blindly retry; next work must improve actual model depth and verify output while preserving existing notes.
Latest native production JS bundle +432assets passes after depth/metadata/full-case fixes; not signedAPK/device evidence. Content-preservation/depth/v25/version and8 notes-isolation regressions pass. Cardiology ZIP/README corrected with continuation-check.json; recovery patch refresh version36. Prior GitHub push automatic-review rejection remains, do not retry or routearound.
## 2026-10-01 — Android 21-item security audit (audit only)
- **DONE** — Audited main af2c8d501e28eed314bc6c55a865bddc5a08c274, release-550 APK (asset SHA256 matched), all 19 live functions and public DB policies/RPCs. Published docs/android-security-checklist-audit-2026-10-01.md. Revised qualitative Android/backend/repository score to 6/10 after deeper findings. 60 regressions and 12 live rejection cases pass. Synthetic rolled-back SQL demonstrates guest merge with a spoofed known device ID and writable own XP/reward counters; role/admin checks deny escalation. Two actual-source mocks show legacy Razorpay grant validation gaps. No real user data or paid provider call used.
- **HALF-DONE** — Findings are not repaired by this audit: merge authorization, hardcoded GitHub token in list_releases.mjs (value never printed/used, validity unknown), legacy Razorpay plan/buyer/state binding, reward columns, attachment/PDF/Anki resource bounds, compatible dependency updates, errors/body/WebView hardening. Auth configuration/native CVE/device/purchase testing and broad historical scan remain incomplete.
- **NEXT** — Follow the new report's prioritized repairs. Token revocation/activity review is owner action; do not merely remove the line and claim revocation. Merge repair must preserve guest progress and prove old-session possession. Scope current native local notes separately from legacy cloud notes.
- **DO NOT** — No product changes, build, Play upload or Lovable publish occurred. Keep Lovable paused and Anki unchanged under existing owner exclusion. Never expose/use the committed token. Do not repeat the old 7/10 assessment as current or describe dependency tooling advisories as proven Android exploits. Do not treat raw Hermes prefix matches as secrets: sb_secret_ decoded to a literal SDK prefix; the APK JWT role is anon.

### 2026-10-01 — release preparation preserved latest GitHub audit
Owner urgently requested connector push/release again. Read-only connector verified Sabharivarshan111/gmck installed repository, public visibility, push permission, main ea1dc5ca. This does not lift prior automatic-review egress rejection: no write/push/build dispatch attempted. Read-only fetch and local merge preserve newer main audit, HANDOFF and prior security changes. Conflicts resolved by retaining local depth/input/metadata fixes and both audit histories. Native TypeScript, depth/v25/version/repeat checks and8 notes-isolation cases pass. list_releases.mjs now uses optional GITHUB_TOKEN environment value instead of embedded credential; public listing works without authorization. No credential was used or printed. Historical credential revocation remains owner action. All notes saved; fresh successful cardiology generation still unverified; no signed version25 release. Recovery patch refresh version37.

### 2026-10-01 — fresh full AF generation verified, release still blocked
Owner requested continued fixes and release. Focused replacement prompt alone failed live at554/750 words. Reconsidered strategy: single supplement call adds missing explanations while preserving the initial answer; repeated strings cannot pad900word guard. Live68 successfully generated AF HTTP200,16sections/1427words(1408unique guard), all157strings retained by client cleanup. Raw and cleaned outputs preserved. Selected clinical corrections made in separate reviewed sample: warfarin/bridging, cardioversion/TTE/TEE, pre-excitation, rhythm-selection and missing tachyarrhythmia classification;17sections/1673unique words. All17preview headings once with externalrequestsblocked. Not whole84question regeneration or universalmedicalcertification; not persisted in shared/personal notes.
Concurrent security deployment detected before overwrite; preserved its endpointSecurity.ts wrapper and generic unexpectederror redaction. Final live69 files byte-match/JWTtrue;4MB transportlimit/origin/headers remain. Typed NotesDepthError safe422message retains savedanswer; quota typedonly. Depth/limits/schema/version/native-previewtypes,8 isolation and4 transport regressions pass. No GitHubwrite/push/dispatch attempted; prior approvalreview egressblock still applies. Version25notreleased. Durably save corrected ZIPnextv2, reviewedTXT/images, recoverypatchnextv38.


## 2026-10-01T10:32:49.131887+00:00 — v25 restored with newer local security work; publication restriction remains

**DONE:** Latest recovery patch38 applied with index at exact base29d13a5033ee1b2150d0ba6a412de2538ba1e621; restored Git tree exactly matches114a19b2. Read-only GitHub confirms main remains ea1dc5ca. Isolated local merge preserves newer unpushed security checkout through cc0bce3b: guest proof authorization, payment binding, endpoint/body/error guards, native link validation and dependency updates. Conflicts preserve university sync plus proof-authorized guest retry and notes typed422 depth safeguards. Live source readback:20 functions/46 file instances agree ignoring whitespace; notes69 four files byte-match/JWTtrue. Two CI harness failures repaired: lint-safe quota expression evaluation and auth guest-merge mocks with proof-before-session-replacement assertion. All55 local release/security checks now pass, including native/preview typechecks, lint,6532 TXT comparison, repeats,50k-card scheduler and APKG. Preview build, offline KUHS flows, reviewed AF17 unique headings, and Android production JS bundle/432 assets pass. No PDF review restarted or user notes rewritten.

**HALF-DONE:** Signed v25 APK/AAB and installed-device/payment tests not performed. Whole84-question fresh cardiology regeneration remains unfinished; saved partial batch and AF evidence preserved. No remote deployment or write attempted here. Existing GitHub release550 predates v25.

**NEXT:** Preserve this combined checkout in a sanitized restore checkpoint with exact base, source hashes, tests and evidence. GitHub publication requires legitimate clearance of the prior automatic-review egress restriction; repository push permission alone does not clear it. Once permitted, recheck latest main, merge safely, push through authorized connector and verify exact run checkout/signatures/assets.

**DO NOT:** Retry or route around the rejection, force-push, restart PDF review, remove existing Anki/progress, deploy stale Lovable or notes sources, use exposed historical tokens, claim v25 released/Play uploaded/device-tested, or enable Play billing.

## 2026-10-03 — production native-component web port (Codex)

**DONE:** The owner explicitly requested Android visual/feature parity for the Vercel app and preservation of the patient simulator. `mobile/web/main.tsx` boots the real `mobile/App.tsx`; build-only transforms supply browser linking/auth/file URLs, truthful onboarding/reminder copy, and emoji rendering. No Android screen/component/source file was edited. Browser adapters implement IndexedDB storage/private files, real Anki ZIP/SQLite/zstd import and SQLite export, PDF pages, audio/video, notifications while open, OAuth, and available browser speech APIs. Built-in emoji use licensed Noto SVG artwork because this browser's color font failed to render. The production build keeps the old web app as `legacy.html` for `/simulator` and public information routes, and serves native study routes from `index.html`. `public/sw.js` updates caches, caches native assets, separates shell fallbacks, and serves private media locally with byte-range support. The only `src/` edit is a TypeScript-only SQL interface fix in `apkgWeb.ts`.

**VERIFIED:** Combined production build; mobile/native, preview, and browser TypeScript; mobile lint; simulator source and asset guards; all three APKG fixtures plus export roundtrip; Anki schedule; KUHS 6,916-question parity; security/sign-out guards; version/ad identity; repository/docs/deploy guards. Production Chromium UI checks cover saved question progress, university choice, history, actual legacy1/legacy2/v3 imports, media after reload, timer, offline KUHS, guest onboarding, native emoji and simulator shell. A separate browser adapter check renders a real PDF page and downloads/reimports an exported SQLite APKG. Cloud requests were blocked deliberately in the local smoke test.

**HALF-DONE:** Production promotion. The web commit `f855f610ed3d53c98ae5b2fd9396e33bd914a44d` is on `codex/native-web-parity`, PR #31. Vercel preview `dpl_FDqLBkwQu6M6WuPVxHyzmytWZttd` is READY; hosted native browse and unchanged simulator routes returned 200 with the correct separate shells. Normal-motion sheet transforms settled from 397.5px to 0px; fresh browser guest setup/profile reload passed without errors. A final adapter fix reports file-viewer popup outcomes accurately and uses sandboxed private media URLs. Vercel `deploy_to_vercel` is advertised but its server responds `Tool deploy_to_vercel not found`; no local deployment token exists. GitHub web-port publication is assessed independently, using an isolated web branch so it does not replay the prior denied signed Android v25 publication or touch default/main. Production remains the existing deployment until a READY deployment from this web commit is proven.

**NEXT:** Confirm the final adapter-fix preview, then promote through a working authorized Vercel route. The connector cannot deploy; browser fallback requires the owner’s approval under the browser-control instructions. Do not merge/push main just to work around the historical signed Android restriction. Check Google OAuth on the real domain/account and cloud AI/notes after publication. Real payment, background reminders with a closed browser, WebGL simulator rendering, and a signed Android/device comparison are not certified by the local browser checks.

**DO NOT:** Change simulator code/models, native application ID/version/signing/ads/billing, publish preview fixtures, claim exact native GPU shaders or Android background services on the web, replay the old rejected v25 signed-release push, or claim the Vercel port is live from an older READY deployment. See `mobile/web/README.md` for browser limits.

**Browser file/music follow-up:** File viewers now sever their opener and use sandboxed private URLs; untrusted HTML is downloaded before worker control. Browser builds remove the unsupported zero-space linked-file option from the native note/music chooser and explain private copies/site-data clearing. Real WAV import, playback controls, persisted music after reload, guest setup and normal sheet motion passed without uncaught errors. Final source remains on the isolated web branch; production promotion still needs a working deploy route.


## 2026-10-03 — Vercel production publication verified

**DONE:** Owner explicitly approved publishing and dashboard fallback, completed secure Google handoff, and confirmed connection. Promoted preview source `554220b72987a0c041840044e85049415d61a818` through Vercel dashboard. New production-environment rebuild `dpl_2vp5qCtL7YwYXQUfPT72KbWDVQXM` reached READY and aliases `orbitmbbs.vercel.app`. Live URL https://orbitmbbs.vercel.app/ renders actual native HomeMain, Noto subject icons, native bottom tabs and menu. Real production guest onboarding (2nd year/KUHS) and persisted profile after reload verified. Native menu Patient simulator navigates /simulator and loads original legacy bundle; cloud verification browser cannot create WebGL context (GPU disabled), so 3D rendering is not certified. No simulator code/models or Android identity/version/signing/ads/billing changed. Production screenshot saved as ORBIT-Production-1791033796898.jpg, Library libfile_1d2ef98d82ac81918bd0aeb028aeccd7.

**NEXT:** Web source remains isolated on codex/native-web-parity, PR #31, main untouched. Future production deployment from old main would replace this port; review/merge PR separately with release guard awareness. Cloud OAuth/AI/payment and device/WebGL comparison remain unverified. Historical signed Android v25 release restriction remains separate and uncleared; do not replay denied action. This entry supersedes prior web-promotion-pending status.


## 2026-10-03 — Live Google OAuth return repaired
Owner reported My Progress sign-in landing on mbbsqbank-questor.lovable.app. Production browser adapter already passes redirectTo=location.origin + '/'. Signed-in Supabase dashboard confirmed auth Site URL was https://mbbsqbank-questor.lovable.app and redirect allowlist empty, causing fallback. Changed live Site URL to https://orbitmbbs.vercel.app/ and verified persistence after dashboard reload. No added wildcard/redirect permissions; production canonical origin uses the Site URL. Fresh real /authorize + /callback flow with provider access_denied (no account login, no user data) returned HTTP302 to https://orbitmbbs.vercel.app/ with auth error, proving callback destination. Successful real Google-account login/session still needs owner verification. Supabase host on Google account chooser is the normal intermediary, not the final return site. This is live server configuration, no Vercel rebuild required; runtime source remains 554220b and production deployment dpl_2vp5qCtL7YwYXQUfPT72KbWDVQXM. Source/Android/simulator unchanged. Site URL also sets default email/password-reset links and callbacks with no permitted return URL; previews now return to canonical production. Proof ORBIT-SignIn-Fix-1791034523669.jpg, Library libfile_abd8888845a48191a2eb6bc0ee9938e6. Historical Android release block remains unchanged.

## 2026-10-04 — Study Buddy local checkpoint / publication rejected
- Prior cached language preset deployment remains READY at orbitmbbs.vercel.app; internal-391 signed ad-free APK run 37188782059 succeeded. It contains presets, not the new Buddy.
- New shared Study Buddy code: customization (three choices/name/colour/hide/quiet), chat-context reactions inside MCQ result, understand/recall/review plans, opt-in MCQ and plan digest, recorded attendance percentage. Original Nova Owl PNG generated in this session.
- Local commit 89d18f4 plus follow-up local changes. Git push was rejected by automatic approval review for lack of explicit authorization to export source/assets to Sabharivarshan111/gmck codex/native-web-parity. Remote remains 075ddae. No alternate publication attempted. Require explicit user export approval before retrying.
- docs/STUDY_BUDDY_RESEARCH.md distinguishes built/checks vs unverified visual/device behaviour and background web/iPhone push not implemented.
- Cloud browser local preview blocked; later browser control rejected by policy. Do not fake screenshots or bypass policy. New Android Kotlin compilation requires an authorized CI run.
- User correction remains 15-mark essay, never 10 marks. No default branch, package ID, signing key, ad mode, simulator or progress contract changed.


## 2026-10-04 — Original IP as Logo mascots and runtime eye rigs
Replaced generated atlases with 27 actual ipaslogo.com logos: cat, dog, fox, panda, rabbit, otter, penguin, bear, squirrel; three designs each, source URLs retained in asset manifest. PNGs resized to 384px, combined 3,212,682 bytes (<5,000,000). Each original has two eye crop regions and fur-color cover patches; native Animated drives blinking, typing glance, tap wink/bounce, thinking sway, correct/wrong poses. No mouth/ear articulation claimed. Preserved original blob engine and quiet/reduced-motion/focus pause. Correct/wrong and AI answer coach now active only on focused screens and expose accessible pet controls. Retired owl/crocodile selections migrate to otter/squirrel, other settings retained. Static picker previews remain static. Web asset imports corrected to ES imports for Vite + Metro. TypeScript, ESLint (zero errors; existing/style warnings), preference checks, existing blob engine checks and web build passed. Local browser URL blocked by cloud browser; live visual verification still pending at this checkpoint. Metro check requires temporary watchFolders because this worktree reuses dependency symlinks. Downloadable ZIP + standalone interactive HTML prepared; runtime frames do not add PNG files.

## 2026-10-05 — Web media and background push repair
User asked to fix YouTube, uploaded video/PDF reader and notifications. Isolated browser-adapter changes on codex/native-web-parity based on 7cac301. YouTube trusted HTML wrapper replaced with direct validated iframe; arbitrary note HTML still sandboxed. Video normal pause/AbortError handling and audio controls repaired. Browser notification page timers replaced by authenticated Web Push subscriptions and a custom-auth Supabase web-push function. RLS table browser privileges revoked, endpoint ownership and provider allowlist enforced; VAPID and cron secrets initialized in Vault. Live Edge ACTIVE v1, two migrations applied, five-minute pg_cron installed. Native Android and simulator source untouched; historical exact-action Android release restriction remains unchanged. Typecheck/build/repo-intact and four reminder/security unit tests passed. Backend config200 and unauthorized dispatch401 verified; hosted browser media/push tests pending at this checkpoint. See docs/WEB_MEDIA_PUSH_FIX.md. Physical iPhone receipt cannot be claimed from this environment.
