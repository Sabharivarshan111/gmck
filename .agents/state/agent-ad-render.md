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
