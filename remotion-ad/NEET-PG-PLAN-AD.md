# ORBIT NEET-PG launch ad

75 seconds · 1080 × 1920 · 30 fps · 25 shots of 90 frames.

Composition: `OrbitNeetPgPlanLaunch`, registered in `src/Root.tsx`.

The captioned music cut shows the actual ORBIT application. The screenshots are captured by `mobile/web/neet-pg-plan-check.mjs` from the built production app at 430 × 932, device scale 2. The only seeded content is a local demo profile; the question bank, planner, saved attempt, session position and reader interactions are real. All screenshot assets are bundled locally. The end card links to https://www.orbitmbbs.site . The phone stays straight and uncropped; only its outer container moves. Feature captions remain 310 px above the bottom of the video.

`neet-plan-shots.json` contains the 25 on-screen lines and their real-screen mappings. The ad covers personal goal setup, weekly time and study days, priority subjects, workload preview, daily sessions, saved progress, the daily question, year/chapter browsing, search, questions/options, answer explanations, saved questions, illustrations, contextual Ask ACEV, offline practice and Black & White appearance. Internet is explicitly required for AI; no historical-paper completeness or rank guarantee is claimed.

The music is an original procedural score, with source in `scripts/generate-neet-plan-score.py` (Python + NumPy, run from repo root). The final AAC track is bundled under `public/audio/neet-plan/`. Roboto is bundled locally with its upstream license. No competitor screenshots, artwork, text or research claims appear in the video. A neural narration service was attempted but refused the request with HTTP 403; this deliverable is intentionally the complete captioned music cut, not a voiced cut.

## Reproduce

Extract the accompanying `ORBIT-NEET-PG-Ad-Media.zip` into `remotion-ad/` first. It supplies the locally bundled captures, end-card QR, score and licensed font. The editable composition and timeline remain in GitHub.

From `remotion-ad/`:

```sh
npm ci
npx remotion render src/index.ts OrbitNeetPgPlanLaunch out/ORBIT-NEET-PG-Launch.mp4 --codec=h264 --crf=18 --concurrency=2
```

In environments that permit loopback but block network-interface enumeration, prepend `NODE_OPTIONS=--require=./scripts/loopback-fallback.cjs`. The helper only supplies the known loopback interface on that exact system error. Use `--browser-executable=<chromium>` and `--gl=swiftshader` when a browser is already installed.

App source: `22cc21d7364a80a369f5179feb8f6019b5ea4c14` on `codex/neet-pg-planner-20261020` (PR 110). The keyboard-safe wrapper changes only keyboard handling; captured screens show the same finished flow without an open keyboard.
