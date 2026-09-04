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
