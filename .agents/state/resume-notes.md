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
