# agent-ad-render — get the ad videos rendered and published

Scope: watch/fix `.github/workflows/ad-videos.yml` + `remotion-ad/` only. May
commit+push those paths on `main`. Never touch mobile/, src/, supabase/.

## T0 — 2026-09-04 ~22:50Z
Run **33927028250** (`ads-2`, main @ 8caec037) is IN PROGRESS.
https://github.com/Sabharivarshan111/gmck/actions/runs/33927028250
Stage: `assets` job, step 8 "Capture the real app screens".

Previous runs, for context:
- run 6 (33887390781) FAILED at preflight: `audio/bed/bed-*.wav is missing`.
  Cause: `make-beds.py` was never called by the workflow. Fixed in 635c7217
  ("Generate the music beds" step) — that step IS in the current run.
- run 5 (33780839675) SUCCESS — the three 90s ads only (release `ads-1`).

Nothing renders in this sandbox (remotion.media egress-denied). Local preflight
fails with ~73 missing-mp3/manifest problems; that is expected, not a finding.

## Next
Watch jobs; on failure read failed_only logs, fix, re-dispatch.

## T1 — 2026-09-04 ~23:00Z
`assets` job SUCCEEDED (22:54:50Z). Screens ok, plates ok, beds generated
(2m20s), edge-tts ok, preflight ok. So the bed fix from 635c7217 worked.

All **13** render jobs are in flight (matrix has 13 targets, not 15):
the 3 x 90s ads, 4 voiced reels x 2 mixes (repeats/six-hours/draw-it/guide),
and the 2 subtitle-led reels registered once each.

Pre-checked locally while waiting (all clean, do not re-derive):
- `npx tsc --noEmit` in remotion-ad: clean.
- every reel's `resolveShotFrames()` sums to exactly 1800.
- every `shot.screen` resolves against ScreenRegistry (36 keys, 0 missing).
- local preflight's 73 problems are 100% missing mp3/bed/manifest — no
  structural problem.
- all 13 matrix ids exist as compositions in Root.tsx.

Note: release `ads-1` (run 5) carries ONLY the three 90s ads — no reel has
ever rendered before this run.

## Next
Poll `list_workflow_jobs` on 33927028250 (WARNING: ~9k tokens a poll, be
sparing). Render of the 90s ads took ~45min in run 5.

## Finding (not blocking the render) — `.agents/video/BEAT-SYNC.md` does not exist
Five places reference it and it was never written (agent-ads item 11, killed):
`remotion-ad/src/scripts/reelOneQuestion.ts:24`, `reelFunctions.ts:38`,
`types.ts:95` and `:166`, and `.github/workflows/ad-videos.yml:293` — which is
the **published release body**, so the release will point readers at a file
that is not in the repo. Left alone deliberately: `.agents/video/` is outside
this agent's push allowance (`remotion-ad/` + `ad-videos.yml` only).

## T2 — 2026-09-04 ~23:22Z
Renders ~27 min in, still in_progress, **0 failed jobs**. (run 5's 90s renders
took ~45 min, so this is normal.)
Cheap poll that costs ~50 tokens: `get_job_logs failed_only=true run_id=...`.
`list_workflow_jobs` on this run costs ~9k tokens — use it only at the end.

## T2 — 2026-09-04 ~23:12Z — TEN OF THIRTEEN RENDERS DONE, ALL GREEN

Read off `list_workflow_jobs` on run 33927028250, not inferred:

    SUCCESS  orbit-reel-guide           <- the mascot presents, voiced
    SUCCESS  orbit-reel-guide-silent
    SUCCESS  orbit-reel-functions       <- subtitle-led, black, beat-synced
    SUCCESS  orbit-reel-one-question    <- subtitle-led, black, beat-synced
    SUCCESS  orbit-reel-repeats         + -silent
    SUCCESS  orbit-reel-six-hours       + -silent
    SUCCESS  orbit-reel-draw-it         + -silent

    IN PROGRESS  orbit-2am, orbit-the-pattern, orbit-draw-it-from-memory
                 (the three 90-second ads — longer, still rendering)

Every finished job passed all four gates in order: Render -> "Check the file is
a real video, not an empty container" -> install ffmpeg -> "Check the video
actually has a voice in it" -> upload-artifact. So none is an empty container
and none is silent, which are the two failures this pipeline has actually
shipped before.

**This is the first time any 60-second reel has ever rendered.** Release `ads-1`
from the earlier run carries only the three 90s ads.

Render times: 7-14 minutes each. The silent cuts are fastest (~7 min) — no
voice track to mux.

## Next
The three 90s ads are still going. When the run completes, confirm the release
and list the MP4s with sizes/durations. Artifacts are already uploaded per job.
