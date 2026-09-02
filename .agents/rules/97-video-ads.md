# 97 - Launch ad videos (Remotion)

There is a **working, committed pipeline**. Do not start a new one, and do not
render ads by hand in another tool.

| Thing | Where |
|---|---|
| Renderer | `remotion-ad/` |
| Scripts as prose + hook rationale | `.agents/video/AD-SCRIPTS.md` |
| Scripts as data | `remotion-ad/src/scripts/` |
| CI render + release | `.github/workflows/ad-videos.yml` |
| Full standard | `.claude/skills/cinematic-product-launch-video/SKILL.md` |

## What it produces

Three **complete, standalone** 90-second vertical ads (1080x1920, 30fps, 2,700
frames, **30 shots x exactly 90 frames**). Three different arguments — not three
cuts of one film, and never six clips stitched into one:

- `orbit-the-pattern` — the repeats are already counted (`en-US-AvaNeural`)
- `orbit-2am` — the night before the exam (`en-US-JennyNeural`)
- `orbit-draw-it-from-memory` — the diagram is where the marks are (`en-US-AriaNeural`)

One shared motion engine drives all three; the shot data is the only difference.
**Do not fork the engine per ad** — that is how three ads drift into three
different-looking products.

## Run it

Actions -> **Ad videos** -> tag (e.g. `ads-1`). It captures the real screens,
downloads the real plates, speaks the lines, renders the three in parallel and
publishes the MP4s to a release. `workflow_dispatch` only appears for workflows
on the **default branch**, so it must be on `main` first.

## Rendering cannot finish in an agent sandbox

Policy blocks, verified by direct test — not guesses:

- `speech.platform.bing.com` — **403 on the WebSocket upgrade**, so no voice.
  The first error you see is `CERTIFICATE_VERIFY_FAILED`, and that part IS
  fixable (`cat /root/.ccr/ca-bundle.crt >> "$(python3 -c 'import certifi;print(certifi.where())')"`).
  Fixing it gets you to the 403. Do not report the cert error as the blocker.
- Supabase storage — **403 CONNECT**, so no medical plates, and the notes
  screens capture with the literal text "This diagram could not be loaded".
  `tca-note.png` comes out fully black.

So: review motion locally with
`npx remotion still <id> out/f.png --frame=315 --props='{"withVoice":false}'`,
and render the actual product in CI. Never ship a cut made in the sandbox.

## The five rules that are enforced in code

Each of these already cost a re-cut once.

1. **The camera moves the device, never the screen content.** All transforms are
   on the device container in `LayeredCameraPhone`. The inner `<Img>` renders at
   natural width; its only vertical offset is the screen's own scroll position.
   Scaling the inner image cropped the nav bar and pushed headings under the
   Dynamic Island.
2. **A missing asset stops the build.** `scripts/preflight.mjs` fails on any
   asset absent or under 4KB (the size of a blank capture). It runs before every
   render. Never hotlink an image at render time; bundle it.
3. **Human copy, single-language US voices.** Say "The Tamil Nadu Dr. M.G.R.
   Medical University", never "TNMGRMU". `synthesize.py` raises on any
   `*MultilingualNeural` voice — they read "M.G.R." and "MBBS" with French
   phonemes.
4. **Captions at `bottom: 308`**, and the device lifted `DEVICE_Y = -100`. Reels
   and TikTok cover roughly the bottom 260-290px, and the caption must also
   clear the app's own bottom navigation.
5. **No overlay rectangles.** Direct attention with the backlight, the
   accent-tinted room and focal emphasis.

## Voice

Python **edge-tts** (`pip install edge-tts`). `voice-manifest.mjs` dumps the 90
lines to JSON, `synthesize.py` speaks them. A file under 2KB raises — edge-tts
writes a zero-byte mp3 when the socket is refused, and a silent shot in a
finished ad is worse than a crash.

Voiceover lines are **7-11 words**, which lands in 1.8-2.4s and leaves ~0.6s of
air before the cut.

## Facts that may be claimed

5,545 unique questions; 2,025 carrying a PYQ year marker; 2,734 star-rated; 915
diagram rows across 272 plates; 4 MBBS years; 12 tree species.

**Never claim** a user count, a pass rate, that AI answers are exam-verified, or
any university endorsement.

## Assets are never committed

`public/app_screens/` and `public/audio/` are gitignored and rebuilt on every
render. A committed screenshot is a UI the app may no longer have; a committed
plate goes stale the moment the diagram is regenerated.
