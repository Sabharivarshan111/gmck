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
