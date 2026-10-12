Warning: truncated output (original token count: 45425)
Total output lines: 2146

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

`com.google.android.play:app-updat…29425 tokens truncated…1, two migrations applied, five-minute pg_cron installed. Native Android and simulator source untouched; historical exact-action Android release restriction remains unchanged. Typecheck/build/repo-intact and four reminder/security unit tests passed. Backend config200 and unauthorized dispatch401 verified; hosted browser media/push tests pending at this checkpoint. See docs/WEB_MEDIA_PUSH_FIX.md. Physical iPhone receipt cannot be claimed from this environment.

## 2026-10-05 — Codex — Patient simulator shortcut in web Notes
Owner asked to add the existing Vercel patient simulator to Notes. Browser-only NotesScreen transform adds a themed accessible Patient simulator card under ALSO HERE before flashcards; it opens existing /simulator. Bumped SW cache version so installed apps update. Native Android and simulator source unchanged. Web TypeScript and production build passed; publication/live shortcut verification next.


## 2026-10-05 — Patient Simulator lifecycle and mobile performance

Owner explicitly requested fixing/optimising the simulator. Added a visible-frame loop that pauses in background tabs, deduplicates resume and discards hidden time. Physiology still ticks every visible frame; UI snapshots publish at 10 Hz. ICU waveform rendering no longer restarts with each vitals update; sweep speed uses elapsed time; sound enable resumes AudioContext during the user gesture and closes it on unmount. Anatomy now handles renderer creation/download failures locally instead of blanking the app, restarts after WebGL context recovery, responds to container resize, and caps phone GPU draws at 30 fps. Fixed the missing local organ resolver import, malformed synthetic Part metadata and outdated simulator sound types. Service worker cache version advanced.

Verified: build:vercel, mobile typecheck:web, simulator organ/asset/mobile/dossier checks, deploy-size check and repo-intact; simulator-lifecycle-check covers pause/resume/cleanup. Root TypeScript has one pre-existing src/lib/apkgWeb.ts callable-union error; simulator files are clean. This cloud browser has WebGL disabled; anatomy rendering/context recovery and iPhone audio still require real-device verification. No medical scenario or treatment calibration changed.

## 2026-10-10 — simulator mobile region/runtime audit

**DONE:** Reproduced runtime missing sympathetic meshes with actual GLTFLoader (source JSON had names but runtime sanitizer broke matching); restored source node names for supplemental layers. Updated region controls/state, regional labels/visibility/spread inventory, searchable region/system/exact-source structure browser, safe exact-mesh dossier naming and compact mobile detail tabs/scrolling. Root TypeScript SQL-init union blocker repaired; SW version advanced. Model/organ/dossier/mobile/lifecycle/integrity checks and combined Vercel build pass. See docs/SIMULATOR_MOBILE_AUDIT_2026-10-10.md and scripts/simulator-runtime-model-check.mjs.

**HALF-DONE:** Hosted click audit and publication pending at this checkpoint. Browser WebGL unavailable; actual phone GPU/gestures remain unverified. Small structures without clinical dossiers expose metadata rather than invented innervation. Phrenic/splanchnic are existing labelled schematics.

**NEXT:** Deploy isolated simulator web branch, verify UI clicks and exact deployment; preserve source changes/research/audit evidence.

**DO NOT:** Claim perfect anatomy/physical-device validation; replace source gaps with unrelated nerves; replay historical denied signed Android release; alter package/version/signing/ad/payment identities or stale backend sources.


## 2026-10-10 — Patient simulator responsive polish

**DONE:** Phone viewport-first layout, compact system browser/header, larger readable sheets, independent simulator theme, 44px portrait/landscape controls, exact isolated-part Dossier navigation, diagnostic and tutorial layout fixes. All 147 named nerve UI selections matched exact titles; 42 scenarios and 27 intervention feedback routes exercised. TypeScript, mobile source checks, actual GLTFLoader target checks, all-anatomy coverage and combined production build passed. Audit: `docs/simulator-mobile-audit-2026-10-10.md`; PR #43. Preserve concurrent main PG offline changes; combined SW cache v14.

**HALF-DONE:** Vestibular mesh remains unregistered (source y≈0.08m); renderer withholds it and explains the gap. Cloud browser WebGL unavailable; UI screenshots cannot establish physical GPU/touch/audio behavior. 36 clinical dossiers do not cover individual clinical innervation for every catalog part.

**NEXT:** Verify merged production deployment and capture its final phone screenshot. Device/GPU and expert clinical review remain separate validation tasks.

**DO NOT:** Substitute another nerve for a missing target, invent vestibular placement, or call all individual muscles/nerves medically verified from catalog/loader checks.


## 2026-10-10 — Simulator one-hand follow-up

**DONE:** Bottom thumb navigation/Browse/Layers/zoom/reset, pan command buttons, bottom region picker, persistent phone detail footer and expandable supply/innervation notes. Bounded Crisp/Smooth rendering modes with low-memory and 3M pixel budget tests. TypeScript, simulator mobile guards, actual model regression and combined build pass. Hosted first preview exercised at 360/390/430/landscape; no horizontal overflow. See `docs/simulator-one-hand-audit-2026-10-10.md`.

**HALF-DONE:** Final refinements and production publication verification pending at this commit. Browser cannot create WebGL; actual overview sharpness/GPU/FPS/physical touch remain unverified. Anatomy source registration safeguards and 36-dossier clinical coverage limits remain.

**NEXT:** Verify final deployed region picker, range height, supply action and capture mobile screenshot; publish production preserving concurrent main PG changes.

**DO NOT:** Claim perfect anatomy, all clinical innervations reviewed, or actual phone GPU blur fixed solely from DPR code/UI tests.


## 2026-10-10 — One-hand camera reset follow-up

**DONE:** PR #46 merged as 3627df2 preserving concurrent PG changes; merged TypeScript/mobile/render quality checks and combined build passed. Explicit Reset command now resets the camera even when already in Full body and clears stale spread-camera bookkeeping. A regression executes the actual production effect with a real Three camera/vectors, checking zoom bounds, all pan directions and same-region/spread reset. Dark panel contrast checked.

**HALF-DONE:** Production build of #46 running; this Reset follow-up publication and final production region/range/supply screenshot check pending. Physical GPU sharpness remains unverified because cloud WebGL cannot initialize.

**NEXT:** Verify final production deployment and capture screenshot; core simulator UI audit and research report are in docs/simulator-one-hand-audit-2026-10-10.md.

**DO NOT:** Claim headless camera arithmetic tests demonstrate rendered sharpness/FPS or complete clinical innervation validation.


## 2026-10-10 — Final head grouping and compact sheet

**DONE:** #47 production READY e558afe/dpl_9ar7t8ATEn8wLJHFtEMLqbUYhqis. Hosted region picker verified Head→Skeleton→Frontal bone; range measured 44px; LAD Inspect in 3D closed the sheet and selected LAD. Source head filter exposed four skeletal misfiles (bilateral levator scapulae and gingiva): fixed systems without changing mesh identities, with actual-atlas assertions. Redundant phone expand pill hidden; full accessible structure names accompany compact 3D buttons. SW v16.

**HALF-DONE:** Final grouping/compact-sheet release and screenshot check pending at this checkpoint. Device GPU/FPS/overview clarity remains physically unverified; complete individual clinical dossiers still absent for many source parts.

**NEXT:** Verify final production head systems/compact sheet and save its screenshot.

**DO NOT:** Substitute structures, invent missing models/innervation, or equate browser UI/headless arithmetic checks with physical GPU or clinical certification.


## 2026-10-10 — Source-detail fallback and quality guard

**DONE:** Legacy DPR=1 source assertion replaced with actual bounded render-quality tests. Actual source classification/dossier tests, camera regression, GLTFLoader targets, TypeScript and combined build passed. Gingiva retains exact source metadata; muscles without individual dossiers no longer open skeletal notes just because an attachment name contains a bone. Mobile compact cards retain full accessible names. SW v17.

**HALF-DONE:** Final source fallback release and browser screenshot pending at this checkpoint. Physical-phone GPU/blur/FPS remains unverified.

**NEXT:** Verify corrected head filters and exact source dossiers on final production; capture compact mobile sheet. Preserve concurrent PG changes.


## 2026-10-10 — One-hand simulator final checkpoint / quota block

**DONE:** PRs #46/#47 production e558afe READY: bottom thumb controls/navigation, bottom region picker, quality modes, progressive notes/footer and explicit camera reset. Actual 360/390/430/landscape browser checks, head→Skeleton→Frontal bone, 44px spread control and LAD Inspect→isolated model state. Live screenshot ORBIT_One_Hand_Mobile_UI.jpg saved. PRs #48/#49 merged through e2cc0289: four source grouping repairs, compact cards with full accessible labels, exact metadata fallback and updated bounded-quality organ guard. Final TypeScript, actual-atlas 57-target resolution, actual GLTFLoader, real Three camera effect, quality tests and combined build pass.

**BLOCKED:** Final refinements are NOT live. Vercel HTTP 402 api-deployments-free-per-day (>100), retryAfter 86400s, around 12:52 UTC. No installed CLI fallback. See new blocker in blocked.json. Live remains e558afe. Cancelled only our superseded builds/previews; unrelated PG builds untouched. Do not alter billing/security.

**NEXT:** After quota reset deploy CURRENT main containing e2cc0289, preserving later PG changes. Verify corrected head counts/grouping, gingiva/levator exact metadata and compact phone supply controls, then capture final-release screenshot.

**LIMITS:** Cloud WebGL unavailable; physical GPU blur/sharpness/FPS/gestures/audio remain unverified. 36 clinical dossiers do not individually certify every muscle/nerve innervation. Vestibular registration quarantine and other source gaps retained.

## 2026-10-10 — Codex — simulator rotation/framing and auscultation follow-up

**DONE:** Moved mobile isolated identity toward thumb controls, kept full source display names, compacted spread panel, added aspect/depth/viewport-aware isolated framing. Corrected ms_afib sound routing, absent atrial accentuation, cyanosis/stridor and shock/tamponade false inference, cardiac-arrest minimum-rate audio, expired async playback and scheduled-source stop/disposal. Dark-mode live mobile controls exercised (8 presets, 6 sites, 2 filters, volume/start/stop/close/reopen); actual screenshot saved. TypeScript, mobile UI/organ/camera checks, 42x7 source case/site routing, 30 actual offline DSP combinations and Three.js projection checks pass. Production build passes with NODE_OPTIONS=--max-old-space-size=6144; ordinary runtime default heap failed during the unrelated native-web build. Detailed limits and clinical references appended to docs/simulator-one-hand-audit-2026-10-10.md.

**HALF-DONE:** New fixes not live; existing simulator-vercel-daily-quota-20261010 blocker remains. No captured/audible physical-device sound or GPU rotation/clarity claim. Offline compressor implementation is passthrough, not actual browser output validation.

**NEXT:** After Vercel daily limit resets, deploy current main containing this follow-up and prior PR48/49, preserving PG changes. Capture real-phone model rotation/fit in both themes and check headphones/speaker sounds against clinician-reviewed recordings.

**DO NOT:** Convert anatomical right to camera-relative left; infer stridor from cyanosis or tamponade from CVP alone; report queued fixes as published; change billing/security settings to bypass quota; claim every nerve/muscle's clinical innervation is certified.

## 2026-10-10 — Codex — Mobile auscultation trainer

**DONE:** Implemented mobile chest listening points, lazy attributed 3D organs with labeled fallback, moving stethoscope, real output waveform/scheduler labels, exploration/training, nine cardiac and six lung demos, fixed thumb player, both themes. TypeScript, 32 offline DSP renders, source-model bounds/targets and mobile guard passed; production build checked. See docs/simulator-auscultation-trainer-2026-10-10.md.
**HALF-DONE:** Browser UI audit follows deployment of this branch. Physical-device sound and GPU realism are not certified; cloud WebGL may show fallback.
**NEXT:** Publish branch preview, exercise phone-size UI, then merge and verify production revision.
**DO NOT:** Import normal/abnormal datasets as named valve-disease clips; copy GPL hardware simulator code; infer clinically registered chest/valve locations from illustrative placement; alter Android releases or concurrent PG work. Prior PR51 production deployment is now READY (e689045); old quota-block status is superseded.


### 2026-10-10 — Auscultation realism correction (PR52 follow-up)
- DONE: Removed schematic capsule/ribs and SVG chest; registered BodyParts3D 587-part chest plus Z-Anatomy lungs, explicit static source-model reference fallback, source attribution, valid triangle/source-coordinate checks. Fixed initial frozen/reduced-motion trace startup. Root TypeScript and model checks passed; browser actions exercised the heart/lung library and training controls on PR52 preview; dark mode opened.
- HALF-DONE: Corrected preview/production deployment and final screenshot verification pending at this checkpoint. Cloud browser lacks WebGL; real meshes inspected with an offline EGL renderer, never represented as a live GPU browser test. Physical acoustic/clinical certification remains unverified.
- NEXT: Verify corrected preview 360/390/430 and dark theme, record screenshots and publish PR52 when checks pass.
- DO NOT: Restore procedural anatomy; claim every anatomy structure or headphone sound clinically certified; touch Android releases, PG data, billing or security settings.


### 2026-10-10 — Realistic auscultation preview audit completed
- DONE: PR52 merged at a82b8a4a33d31ee4a76d50beaeedfa4c69b1c489; corrected preview fdf5b016 READY. Actual browser source-model reference inspected in light/dark. Front/back and X-ray/surface images switched correctly. 360/390/430 and landscape have no horizontal overflow; every trainer button measured at least 44 px, dark theme now propagates, 155 px player scroll clearance verified. Source image decoded at 720 px.
- HALF-DONE: Final production deployment is building. Follow-up fixes Freeze losing the plotted history while retaining timing labels: history now persists across freeze/unfreeze and resets for stop or a different trace. TypeScript passed; final deployed follow-up trace screenshot check pending. GPU live render and physical headphone/clinical sound fidelity remain unverified.
- NEXT: Verify final deployment and Freeze waveform; save mobile screenshots. Physical-device GPU/audio review is the remaining evidence gap.
- DO NOT: Restore drawn anatomical substitutes, substitute unrelated missing nerves, claim all structures or acoustics clinically certified, alter Android releases/PG/billing/security.


## Final deployed browser verification — 2026-10-10 18:28 UTC

DONE: PR #52 and #53 merged; production main 91c3c7194bf7a3ecb7185558d384460cfa0da435 READY (dpl_5DM3oiP4Zn6gcKLgzcxF75amZQv6). Refreshed orbitmbbs.vercel.app responsive harness, verified full 2.5-second S3 waveform survives Freeze, remains stable, Animate resumes and Stop resets. All 42 case selections matched rendered headings. Mitral/apex button and selector work; dark-mode mobile screenshot inspected. Two screenshots saved: orbit-mitral-dark-20261010.jpg and orbit-frozen-s3-trace-20261010.jpg.

HALF-DONE: Cloud browser lacks WebGL; verified labelled source-geometry static references, not live device GPU. Synthesized teaching audio routing/timing tested, but clinical acoustic fidelity and physical headphone output are not certified.

NEXT: Physical mobile WebGL rendering and clinical listening review; evaluate the new cranial-nerve trainer references separately before adding a new feature scope.

DO NOT: Claim perfect clinical accuracy, live GPU verification from static screenshots, or exhaustive intervention correctness from case-selection tests. Do not replace registered anatomy with drawings or copy competitor assets.


## Competitor-inspired mobile UI — final checkpoint 2026-10-10 15:57 UTC

DONE: PR #54, #55 and #56 merged. Production main 36fcad128c164d5d1335374601f0c772db3669f4 is READY (dpl_6hjfJ9fMHYEfHEZ52V3SNHeBEoiS). Compact mobile selection name/info opens anatomy details; Restore clears selection. Pupil results precede penlight controls and clinical explanation is collapsed. WebGL-unavailable notice no longer blocks selection/spread controls. At 360px, selection width and scroll width are both 299px, dark background is rgb(15,23,42), selection/spread gap is 8px and buttons meet 44px targets. Details/Restore and pupil left/right/both/off plus disclosure verified in browser. TypeScript, mobile guard and web build passed. Final screenshots: orbit-pupil-mobile-inspired-20261011.jpg and orbit-selection-gap-fixed-20261011.jpg.

HALF-DONE: Cloud browser lacks WebGL, so live GPU anatomy rendering on a physical mobile device remains unverified. Clinical audio fidelity remains unverified. Current pupil tool is schematic; animated facial patient and complete cranial-nerve examination trainer are not implemented.

NEXT: Physical-device GPU/audio verification. If requested, design and clinically validate the separate facial/cranial-nerve examination feature.

DO NOT: Claim an animated facial trainer, perfect clinical fidelity or live GPU verification from these screenshots. Do not import competitor assets or replace registered anatomy with drawings. Do not alter Android releases, PG, billing or security.


## Auscultation playback and training follow-up — 2026-10-11

DONE: New sound presets cancel queued old sources and schedule the replacement at currentTime + 40ms; routine rate updates retain cycle timing. Absent lung sounds stop sources and idle scheduler. Preset setters use the same transition path. Added regression assertions for these transitions; all 32 bell/diaphragm offline sound renders remain finite, audible (except intended silence), with routing/timing/stop checks passed. Training hides timing labels until Check answer; frozen trace keeps its original time/events when revealing labels. TypeScript, targeted ESLint, mobile UI guard, source-model check and web build passed.

HALF-DONE: Publishing and deployed browser verification of answer reveal/frozen trace remain pending. Physical phone GPU and clinical acoustic fidelity remain unverified.

NEXT: Verify training and reveal on the deployed 360px phone harness, save screenshot, record deployment result.

DO NOT: Claim physical headphone output or clinically certified recordings; do not substitute drawn anatomy or add the separate facial trainer in this patch.


## Auscultation follow-up — deployed verification 2026-10-11

DONE: PR #57 merged at main d4b38d0856d71fd4fc986394a1f485d94f50d46c. Production dpl_3dGVJcF7zuaL5E2BzAcJDBWakUHo READY. Real 360x800 browser: training initially hides timing labels and findings; selecting an answer and Check answer reveals S4 feedback and S1/S2/S4 timing labels on the visually preserved frozen trace. Next sound clears answer, disables Check answer and hides labels/findings again. Explore restores labels; Stop switches trace to Stopped. Trainer clientWidth equals scrollWidth (310px). BodyParts3D reference decoded at 720px and Mitral/apex is available. Screenshot orbit-training-reveal-20261011.jpg saved and inspected. Audio preset-transition regression checks, 32 offline audio renders, TypeScript, targeted ESLint, source model check, mobile guard and web build passed.

HALF-DONE: No physical device WebGL or headphone/clinical acoustic fidelity verification. Schematic pupil tool remains; no animated facial trainer implemented.

NEXT: Physical phone rendering/listening review. Check narrow chest point hit-target separation against actual rendered body width (288–303px), rather than the model check's assumed 336px.

DO NOT: Infer a live 3D GPU from the labelled static reference, claim clinical certification, or claim exhaustive intervention correctness. Keep competitor assets out and native releases/PG/billing/security untouched.


## POCUS / pupil screenshot follow-up — 2026-10-11

DONE: POCUS Freeze retains last live inputs and cine phase, including when vitals subsequently change; M-mode history stops advancing. Scan gain changes brightness, depth zooms the field, calipers use display-depth calibration and reject taps outside the field. Gain/depth rows fit narrow phones, scan captions sit outside the acoustic clip and depth labels stay in bounds. Synthetic tissue now renders grayscale with cached correlated texture; removed unsupported 60 FPS and diagnostic certainty claims. Lactate alone no longer produces free abdominal fluid. Added separate attributed archived reference scans (external Wikimedia images/loops), expressly independent of patient case. Pupil orientation is examiner-facing, pupil diameter proportional to iris, and small pupils never enlarge under the teaching light response.

HALF-DONE: These synthetic images remain schematic appearance models, not accurate acquired sonograms or a Blender acoustic model. Blender is not installed. Full animated facial/cranial-nerve trainer remains absent. Reference images and mobile controls still need deployed browser verification at this checkpoint; command-line image downloads were denied by the network.

NEXT: Verify reference image loading, all four view selectors, caliper/mobile controls, pupil light controls and production deployment. Physical-device performance/GPU/audio and clinical fidelity remain unverified. No amniotic-fluid module found; owner’s attached fluid screenshot is abdominal Morison’s pouch.

DO NOT: Describe texture as validated ultrasound physics, claim all requested features fixed, call the fibrosis lung reference normal, infer diagnoses solely from CVP/SpO2/lactate, copy competitor assets, alter Android releases/PG/billing/security.

## 2026-10-11 — Vault and independent simulator skills
- User explicitly authorized patient simulator UI redesign and the Notes→Vault four-card layout.
- Implemented native/shared Vault entry with Notes, Simulator & Anatomy, Case proformas, Anki flashcards. Existing Notes routes and PG/case library tools retained.
- Browser opens simulator on a studio with a healthy adult baseline, independent diagnostics, case comparison and a separate anatomy entry. Android Vault opens hosted simulator through Linking; this is not a native 3D port or new APK release.
- Source anatomy heartbeat/breathing animations use scheduled audio events, pause when hidden, and support reduced motion. Exact bone mesh selection retained; attachment teaching derives from the existing muscle graph and explicitly describes incomplete coverage.
- Added independent clubbing teaching and removed visual pallor→exact Hb and cyanosis→capillary-refill conflation.
- Checks: root/mobile TypeScript, changed-component ESLint, combined Vercel build, source chest mesh integrity, simulator UI regression, 645 case/action regression, Notes schema. Browser visual verification pending preview deployment; local Chromium download failed in the current environment.
- The source-reconstructed POCUS pilot is on separate branch codex/pocus-source-physics-20261011 and is not silently overwritten or claimed integrated by this work.
- Final combined production build and rendered Web Audio tests passed. Public GitHub push was rejected twice by automatic review, even after the connector confirmed the exact repo is public and user-administered; explicit publishing approval is required. Do not retry through another API.
- Review: docs/VAULT_SIMULATOR_UI_REVIEW_20261011.md. Browser-width regression prepared in scripts/simulator-studio-e2e.mjs, not run. Older mobile smoke navigation updated for Vault→Notes.
- Android production JavaScript bundle also passed with temporary Metro config for symlinked dependency watch folders; no APK/device verification claimed.


## 2026-10-12 — approved Vault release
User explicitly approved public publishing/deployment (“Yes live it”), then asked to continue. PR #61 published through connected GitHub because shell git has no credentials. Initial preview READY at dpl_Dy9vMzV333FNFsGaW1EQdidNgv48. Cloud browser verified six independent skills, normal breath playback and heart shortcut, ECG sinus, case search and normal reset, 360/390/430 layouts, and four Vault destinations. Corrected missing WardExam dialog semantics and changed Back to Vault links to reloadDocument (legacy simulator router cannot render native Notes). Git retrieval failed on automatic follow-up deployment; exact commit d440e8c0e118d64465f2292886544ca48bb6d93c retried at dpl_7UH65HY8zphvLDkYscScaboTErQq. Await rebuilt preview then merge and production verification. No APK or GPU movement verification claimed.


## 2026-10-12 — calendar columns and Android simulator authorization
User explicitly requested all Vercel changes in Android, including Vault and Patient Simulator; this lifts the previous native simulator hold. Vault and educational icons (Anki index cards, no joker) are merged through PRs #61–63. Main 43ee2b4418312153c2b5fb5b117e89669859819a is deployed READY.
Calendar bug: seven percentage-width cells plus gaps overflow narrow rows; rotation starts were also not padded to their actual weekday. Changed shared RN calendar to seven flex slots per explicit week with Monday-first padding, shared aligned headers, weekday accessibility labels, wrapping title/summary. New pure tests cover 54 rotations, all seven starts, month/year boundaries and leap days.
Android now opens the hosted current simulator inside a dedicated WebView from Vault, with native safe-area header, Back to Vault, network/crash retry and blur/background unmount to stop audio/GPU. It requires internet; this is not an offline native 3D port. Replaced the now-obsolete simulator hold check with URL navigation tests and updated three Android workflows. Existing application ID, version code, ads and signing remain unchanged.
Passed: native TypeScript, changed-file ESLint, attendance arithmetic/holiday rules, 54 calendar rotations, 14 simulator navigation cases, production Android JS bundle (459 assets), native-browser build with 6GB Node heap, version/edges/Kotlin/Notes schema, restored full documentation paths, repo-intact and preview parity. Full lint and deployed phone calendar verification pending at this checkpoint. Next: publish isolated feature PR, verify 360/390/430 calendar columns, merge, verify production and exact-commit Android APK build/release. No physical phone/WebGL or Play upload claim.


## 2026-10-12 — simulator theme matches Vault
PR #64 merged at main 1678421a9f0150ae984e68aa38d19dd692145382; production dpl_8611mQuFxeo1cvUyYVaWkV13daxn READY. Browser preview verified Sundays aligned with Sun at 360/390/430px, no horizontal overflow, and Wednesday-start padding; adjusted empty slots to match bordered cell geometry before merge. Exact-commit Android workflows started (internal 38221585542, debug 38221585642, release 38221585578).
Owner supplied current Vault screenshot and asked for the same whole simulator theme and Android inclusion. Implemented dark-by-default black/charcoal/purple palette, colorful medical skill icons, a persisted accessible light/dark toggle, and shared skin for bedside/anatomy/case surfaces. Clinical plot/anatomy colors and physiology are retained. Android uses this same hosted simulator inside the new native screen.
Caught own earlier clubbing image deployment defect in Web CI: public/diagrams is trimmed from dist. Copied the existing unmodified 323688-byte clinical hand photograph to public/clinical-reference/clubbing.jpg and updated the trainer URL. Source image SHA is 3ae3e3d79776ea5c6fa989a465fb9a4ddf5e328b. Asset placement guard must pass on full GitHub checkout; local sparse public assets prevent full packing guard validation. Root TypeScript and new Studio/Clubbing lint passed; two pre-existing explicit-any lint errors in Simulator.tsx remain outside the theme edits. Native full lint was clean. Theme build, preview screenshots, final production and signed APK verification pending. No physical-device test, offline anatomy port or Play upload claimed.

## 2026-10-12 — Codex — recovered and verified simulator anatomy mobile flow

**DONE** — Workspace recovered. Fixed floating camera-control overlap during mobile spread. Updated tests to open Layers, use accessible selection/restore actions and the named thoracoacromial action. Studio check scopes anatomy canvases instead of the global mascot canvas. Workflow builds/serves the exact checked-out commit.
- Source commit `1d929982d376011a66602384192e6159f27b1155`: TypeScript, Web build, simulator integrity, studio checks at 360/390/430px and all seven focused anatomy checks passed. Browser run `38229914664`, job `114746580144`. All isolation render targets passed in the separate broader job; its legacy full-flow assertions have not been updated here.
- Preview `dpl_Fcrq32RYGAuX4QuSdAMevDDXrY4s` READY. Vault theme production `6aa7d07` already live; Android `debug-466` and internal APK builds passed for that exact SHA. Vault/calendar are native; simulator uses the current hosted page in a dedicated in-app WebView and requires internet. Play Store upload not performed.
**HALF-DONE** — PR66 ready to merge; watch its production deployment after merge.
**NEXT** — Verify production deployment for PR66 and report the live link. No new native build needed for this hosted simulator-only visual fix.
**DO NOT** — Do not mistake a browser check for physical-device testing. Do not run old anatomy tests against the Skills landing screen, or count the mascot canvas as an anatomy renderer. Preserve the separate PG import work on `claude/native-app-sync`.


## 2026-10-12 — anatomy arrows, real eye head and phone case layout
**DONE** — PR69 branch codex/eye-exam-label-arrows-20261012 includes anchored label arrows and CC0 Vitruvian real 3D head, gaze dragging, penlight direct/consensual, RAPD, III/IV/VI, Horner, V1/VII corneal response, lid lifting, facial morph controls. 22 model/asset checks and root TypeScript/build passed. Fixed screenshot specialty chip shrinking and stacked case detail badges on phones; InterventionPanel lint passes after typed property checks. Simulator remains same hosted screen in Android native WebView, online only.
**HALF-DONE** — Feature commit ab8ce95129ab210739924e145ff817afb5055407 has good Web/integrity CI but eye browser check clicked a background launcher. Follow-up87616f7c4c36edcdfc21fa0a24b3c2674a024481 scopes instrument buttons correctly. CI38257022123 job114837600377 pending. Actual eye screenshots and complete focused anatomy checks must be reviewed before merge/deploy.
**NEXT** — Finish CI and visual review, fix any actual failures, merge PR69 and verify production exact SHA READY; phone case regression check added at360/390/430.
**DO NOT** — Claim production or physical-device testing before verified. Preserve native PG work. Source/output licensing and real mesh integrity are recorded in public/models/eye-exam/sources.json. Current attachments were visible inline; do not read them via Library.
