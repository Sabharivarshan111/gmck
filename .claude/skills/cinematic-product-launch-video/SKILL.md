---
name: cinematic-product-launch-video
description: >
  Build and render the Orbit MBBS launch ads — Apple-Keynote / Stripe-grade
  vertical product films in Remotion, from the real app UI. Use when asked to
  make, edit, re-cut or re-render a video ad, promo, reel or launch film for
  this app; when writing ad scripts or hooks for it; when a rendered ad looks
  wrong (cropped UI, missing diagram, robotic voice, caption hidden behind the
  TikTok UI); or when adding a new shot, screen or voice. Covers the working
  pipeline in `remotion-ad/`, the three shipped scripts, the voice synthesis,
  and the five failure modes that have already cost a re-cut.
---

# Cinematic product launch video engine

There is a **working, committed pipeline** for this. Do not start a new one.

| Thing | Where |
|---|---|
| The renderer | `remotion-ad/` |
| The three scripts, as prose + hook rationale | `.agents/video/AD-SCRIPTS.md` |
| The three scripts, as data | `remotion-ad/src/scripts/*.ts` |
| CI that renders and publishes the MP4s | `.github/workflows/ad-videos.yml` |
| Long-form README | `remotion-ad/README.md` |

## What exists

Three **complete, standalone** 90-second vertical ads — 1080×1920, 30fps,
2,700 frames, **30 shots × exactly 90 frames (3.0s)**. Three different
arguments, not three cuts of one film, and never six clips stitched together.

| Composition id | Angle | Hook framework | Voice |
|---|---|---|---|
| `orbit-the-pattern` | The repeats are already counted | Investigator | `en-US-AvaNeural` |
| `orbit-2am` | The night before the exam | Pain hook | `en-US-JennyNeural` |
| `orbit-draw-it-from-memory` | The diagram is where the marks are | Contrarian | `en-US-AriaNeural` |

One shared motion engine (`ShotTimeline` → `LayeredCameraPhone` / `PlateCard`)
drives all three; **the shot data is the only thing that differs**. A camera or
safe-zone fix therefore lands in all three at once. Do not fork the engine per
ad — that is how three ads drift into three different products.

## Run it

**Normally: CI.** Actions → **Ad videos** → give it a tag (`ads-1`). It captures
the screens, downloads the plates, speaks the script, renders the three ads in
parallel and publishes them as MP4 release assets. `workflow_dispatch` only
appears for workflows on the **default branch**, so the workflow must be on
`main` before the button exists.

Locally, only where the network reaches Supabase and Microsoft:

```sh
cd remotion-ad
npm install --legacy-peer-deps
pip install edge-tts
npm run screens && npm run plates && npm run voice
npm run preflight          # refuses to render if any asset is missing or blank
npm run render:all
```

Motion-only review with no network at all:

```sh
npx remotion still orbit-the-pattern out/f.png --frame=315 --props='{"withVoice":false}'
```

## The network reality — read before promising a rendered MP4

The Claude agent sandbox **cannot produce a finished ad**, and this is a policy
block, not a fixable config. Verified by direct test, three ways:

| Host | Needed for | Result |
|---|---|---|
| `speech.platform.bing.com` | every voiceover | TLS fixed via certifi, then **403 on the WebSocket upgrade** |
| `pmtgeydtqypwrypshhsx.supabase.co` | the medical plates, and the notes screens' images | **403 CONNECT tunnel** |

Consequences, all observed rather than assumed:

- `edge-tts` first fails with `CERTIFICATE_VERIFY_FAILED`. That part **is**
  fixable — append the proxy CA to certifi:
  `cat /root/.ccr/ca-bundle.crt >> "$(python3 -c 'import certifi;print(certifi.where())')"`.
  It then reaches the handshake and gets 403. Do not report the cert error as
  the blocker; it is not.
- The screenshot harness renders the notes screen containing the literal string
  **"This diagram could not be loaded"**, and `tca-note.png` comes out **fully
  black**. Both were reproduced here.

So: render motion locally, render the *product* in CI. Never ship a cut made in
the sandbox.

## The five failure modes, and why they cannot recur

These each cost a re-cut. They are now enforced by code, not by memory.

1. **Never scale or translate the screen content.** The camera transforms the
   *device container* only (`transform: scale() rotateX() rotateY()
   translate3d()` in `LayeredCameraPhone`). The `<Img>` inside renders at
   natural width; its only vertical offset is the screen's own **scroll
   position**, which is a property of the screen, not a camera move. Scaling the
   inner image is what cropped the nav bar, softened the text, and pushed
   headings under the Dynamic Island.
2. **A missing asset stops the build.** `scripts/preflight.mjs` walks every file
   the screen registry names and fails on anything absent **or under 4KB** —
   the size a blank/black capture comes out at. It runs before every render,
   twice in CI. Never render past a preflight failure; never hotlink an image at
   render time.
3. **Human copy, single-language voices.** No "quantum triple-tap protocol", no
   compressed acronyms. Say "The Tamil Nadu Dr. M.G.R. Medical University" or
   "M.G.R. University", never "TNMGRMU". `synthesize.py` **raises** on any
   `*MultilingualNeural` voice, because those read "M.G.R." and "MBBS" with
   French phonemes.
4. **Captions clear the platform UI.** `KineticWordCaption` is pinned at
   `bottom: 308` in a frosted capsule. Reels/TikTok cover roughly the bottom
   260–290px; the instinctive 80–120px is invisible to most viewers. The device
   is also lifted `DEVICE_Y = -100` above centre so the capsule never lands
   across the app's *own* bottom navigation — which would hide the thing the
   shot is showing.
5. **No overlay rectangles.** Attention comes from the backlight behind the
   device, the accent-tinted room, and focal emphasis. Never a drawn box.

## The shot data model

`src/scripts/types.ts`. A shot is:

```ts
{ n, screen, camera, text, vo, focus?, accent? }
```

- `screen` — a key in `ScreenRegistry`, or `null` for a device-dark cold-open
  beat. Two kinds: a `screen` renders **inside** the phone; a `plate` (a medical
  diagram) fills the frame as a lit card, because a plate is the subject of its
  shot, not something being viewed on a phone.
- `camera` — `hero | push | pull | trackLeft | trackRight | glideDown | orbit |
  macro | settle`. These are multipliers on `BASE_SCALE = 1.42`, so **1.0 is
  already a device filling ~65% of frame height**. Keep changes small; ±0.12
  over three seconds is a clearly felt push, and more runs the device into the
  caption.
- `vo` — **7–11 words**. At `+10%`/`+12%` that lands in 1.8–2.4s and leaves
  ~0.6s of air before the cut. Validate before rendering; a long line gets
  truncated by the shot boundary.
- `focus` — 0..1, where the screen is scrolled to. Not a camera move.

Every camera move keeps moving for the whole shot. A camera that arrives and
stops dead reads as a slideshow.

## Adding a shot or a screen

1. Add the asset to `SCREENS` in `ScreenRegistry.tsx` (a key that does not exist
   throws by design — a script must never name an asset that does not).
2. Make sure something produces the file: `capture-screens.mjs` (from
   `mobile/preview/shoot.mjs`), `fetch-plates.mjs`, or the repo's
   `screenshots/`.
3. Keep the ad at exactly 30 shots — `TOTAL_FRAMES` is fixed at 2,700.
4. Run `npm run preflight`, then render a still and **look at it**.

## Facts you may use, and the ones you may not

Checked against the repo and production on 2026-09-02:

| Claim | Value |
|---|---|
| Unique questions | **5,545** |
| Carrying a PYQ year marker | **2,025** |
| Carrying importance stars | **2,734** |
| Diagram rows with a picture | **915**, across **272** plates |
| MBBS years | 4 |
| Focus-timer tree species | 12 |

**Never claim**: a user count, a pass rate, that AI answers are exam-verified,
or any university endorsement. None are true, and a launch ad that overstates
gets found out.

## Writing the hook

The first 3 seconds decide everything; use the `viral-hooks` skill for the
frameworks. What matters most here:

- **Pain outperforms features roughly 2:1.** `orbit-2am` shows no product at all
  for six seconds so the viewer recognises themselves first.
- **Visual, spoken and on-screen text must say the same thing.** Misalignment
  reads as confusion and they swipe.
- **Specific numbers beat adjectives.** "2,025 questions" is the contrast; "lots
  of past questions" is not.
- **Shot 1 must survive being watched with the sound off.**
