# agent-ads — three 60s ads (mascot VO + two beat-synced silent cuts)

Scope: `remotion-ad/` only (plus `.agents/video/*` docs and the render matrix in
`.github/workflows/ad-videos.yml`, which nothing else claims). Do NOT commit/push.

## Status log

### T0 — orientation (done)
Read: skill SKILL.md, `.agents/rules/97-video-ads.md`, `.agents/video/AD-SCRIPTS.md`,
`remotion-ad/src/**`, `scripts/preflight.mjs`, `scripts/voice-manifest.mjs`,
`scripts/make-beds.py`, `.github/workflows/ad-videos.yml`.

Facts established (do not re-derive):
- `preflight.mjs` does NOT currently check the 1800-frame sum, despite the comments
  in the reel scripts claiming it does. Needs adding.
- `preflight.mjs` demands `audio/<id>/shot_NN.mp3` for EVERY shot of EVERY script,
  so a no-voiceover script must be marked or preflight fails.
- **`make-beds.py` is never called by the CI workflow.** `public/audio/bed/*.wav`
  are gitignored, so today the three existing reels' beds are missing in CI too and
  the `assets` job's preflight step would fail. Must add a "Generate the music beds"
  step to the workflow.
- Baseline preflight in this sandbox: 58 problems, all of them missing audio
  (voice clips + beds + manifest.json). Screens/plates ARE present locally.
- `public/app_screens/` and `public/audio/` are gitignored; screens exist locally.
- Beat maths: at 30fps and 60s, frames-per-beat = 1800/bpm and total beats = bpm.
  Integer frames-per-beat at bpm 72/75/90/100/120/150. Chose **100** and **120**.

## Plan (each item flipped to DONE as it lands)
1. types.ts: `bpm`, `beatOffsetFrames`, `noVoice` on AdScript; `beats`, `mascot` on
   Shot; `resolveShotFrames()` doing largest-remainder beat scaling + cumulative
   rounding so the sum is always exactly 1800.
2. BotAvatar: optional `color` / `badge` props (defaults keep AppAiChatScreen same).
3. `MascotStage.tsx` — hero + guide staging.
4. `BeatCaption.tsx` — subtitle-led, beat-pulsed caption for ads 2/3.
5. `reelMascot.ts` (ad 1, voiced), `reelBeatFunctions.ts` (ad 2), `reelBeatNight.ts` (ad 3).
6. index.ts registry + Root.tsx compositions.
7. preflight: frame-sum + beat-grid check; skip voice for `noVoice`.
8. voice-manifest: skip `noVoice`.
9. make-beds.py: two new beds at 100bpm / 120bpm; run locally (slow, background).
10. workflow: make-beds step + render matrix entries.
11. docs: `.agents/video/BEAT-SYNC.md` + AD-SCRIPTS.md section.
12. `npx tsc --noEmit` + `npm run preflight`.

Nothing rendered here — Remotion's headless shell host is egress-denied.

### T1 — code landed (tsc clean at every step)
DONE 1 types.ts (`bpm`/`beatOffsetFrames`/`noVoice`, `beats`/`mascot`/`kicker`,
     `vo` now optional, `resolveShotFrames()` + `framesPerBeat()`).
DONE 2 BotAvatar `color` / `badge` optional props (chat mock unchanged).
DONE 3 `src/components/MascotStage.tsx` (hero + guide).
DONE 4 `src/components/beatGrid.ts` + `src/components/BeatCaption.tsx` (BeatCaption + BeatRoom).
DONE   ShotTimeline wired: resolveShotFrames is the ONLY source of shot length;
       mascot layer; beat clock passed down; `black`/`subtitleLed`/`speaks` split.
DONE 5 `src/scripts/reelGuide.ts` (18 shots, frames sum 1800, 113 words, <=2.6 wps),
       `reelFunctions.ts` (21 shots, 100 beats @100bpm),
       `reelOneQuestion.ts` (22 shots, 120 beats @120bpm).
DONE 6 `src/scripts/index.ts` (+ SILENT_REELS / VOICED_REELS) and `src/Root.tsx`
       (silent reels registered ONCE, not as a -silent pair).

NEXT: 7 preflight (frame-sum + beat check + skip voice for noVoice),
      8 voice-manifest skip, 9 make-beds 3 new beds + run, 10 workflow, 11 docs, 12 verify.
